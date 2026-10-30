#!/usr/bin/env node
'use strict';

/**
 * tool/build.js —— 离线分析音频，把「歌词 / 节拍 / 起音 / 能量」烘焙成 index.html 里的常量表
 *
 * 页面本身不做任何音频分析：它只读这里生成的 TIMELINE 与 SCENE_DEFS。
 *
 * 用法：
 *   node tool/build.js                  # 完整流程：解码 → 分析 → 写回 index.html
 *   node tool/build.js --reuse          # 复用 audio/analysis.json，只重新烘焙
 *   node tool/build.js --analyze-only   # 只产出 audio/analysis.json
 *   node tool/build.js --bake-only      # 只重新烘焙（等同 --reuse）
 *   node tool/build.js --channel msedge # 用系统浏览器解码，不下载 chromium
 *
 * 产物：
 *   audio/analysis.json  解码 + 特征（中间产物，可缓存）
 *   index.html           @generated 区块内的 TRACK / TIMELINE / SCENE_DEFS
 */

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');

/* ══════════════════════════════════════════════════════════════════════════
 *  参数
 * ══════════════════════════════════════════════════════════════════════════*/

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.slice(0, 2) !== '--') continue;
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v === undefined || v.slice(0, 2) === '--') out[k] = true;
    else { out[k] = v; i++; }
  }
  return out;
}

const raw = parseArgs(process.argv.slice(2));

const CFG = {
  audio: path.resolve(ROOT, raw.audio || 'audio/Mili - world.execute (me) ;.mp3'),
  lrc: path.resolve(ROOT, raw.lrc || 'audio/Mili - world.execute (me) ;.lrc'),
  page: path.resolve(ROOT, 'index.html'),
  out: path.resolve(ROOT, 'audio/analysis.json'),
  channel: raw.channel || null,
  reuse: !!(raw.reuse || raw['bake-only']),
  analyzeOnly: !!raw['analyze-only'],
  noBake: !!raw['no-bake'],
  headed: !!raw.headed
};

/* ══════════════════════════════════════════════════════════════════════════
 *  1. 解码 + 特征提取（在浏览器里跑，用 Web Audio 解码 mp3）
 * ══════════════════════════════════════════════════════════════════════════*/

async function analyze() {
  let playwright;
  try { playwright = require('playwright'); }
  catch { try { playwright = require('playwright-core'); }
  catch { die('缺少 playwright：npm i -D playwright-core（或 playwright）'); } }

  const audioBytes = fs.readFileSync(CFG.audio);
  const pageJs = fs.readFileSync(path.join(__dirname, 'analyzer.js'), 'utf8');

  const html = `<!doctype html><meta charset="utf-8"><title>analyze</title>
<script src="/analyzer.js"></script>`;

  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url.startsWith('/index')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else if (req.url === '/analyzer.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      res.end(pageJs);
    } else if (req.url === '/track') {
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audioBytes.length });
      res.end(audioBytes);
    } else {
      res.writeHead(404); res.end();
    }
  });

  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const port = server.address().port;

  const browser = await playwright.chromium.launch({
    headless: !CFG.headed,
    channel: CFG.channel || undefined,
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e && e.message || e)));

    console.log('  解码中… ' + path.basename(CFG.audio) + '  (' + (audioBytes.length / 1048576).toFixed(1) + ' MB)');
    await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__ANALYSIS__ !== undefined, undefined, { timeout: 180000 });

    const res = await page.evaluate(() => window.__ANALYSIS__);
    if (res && res.error) die('页面内分析失败：\n' + res.error + (errors.length ? '\n' + errors.join('\n') : ''));

    fs.mkdirSync(path.dirname(CFG.out), { recursive: true });
    fs.writeFileSync(CFG.out, JSON.stringify(res));
    return res;
  } finally {
    await browser.close();
    server.close();
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 *  2. LRC 解析
 * ══════════════════════════════════════════════════════════════════════════*/

function parseLrc(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line[0] === '{') continue;                       // 元数据行
    const m = /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/.exec(line);
    if (!m) continue;
    const t = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    const body = m[3].trim();
    if (!body) continue;
    lines.push({ time: +t.toFixed(3), text: body });
  }
  lines.sort((a, b) => a.time - b.time);
  return lines;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  3. 结构分段：按响度跳变切段，再按段内能量分级
 * ══════════════════════════════════════════════════════════════════════════*/

function segment(an, lrc) {
  const hop = an.rmsHop;                    // 0.25 s
  const n = an.rms.length;
  const total = an.duration;
  const db = (v) => 20 * Math.log10(Math.max(1e-6, v));

  /* ── 特征 1：电平（1s 平滑）───────────────────────────────────────────── */
  const w1 = Math.round(1 / hop);
  const lvl = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let k = i - w1; k <= i + w1; k++) {
      if (k < 0 || k >= n) continue;
      s += an.rms[k]; c++;
    }
    lvl[i] = db(s / c);
  }

  /* ── 特征 2：起音密度（±1s 加权）────────────────────────────────────── */
  const dens = new Float64Array(n);
  for (const o of an.onsets) {
    const i = Math.round(o.t / hop);
    for (let k = i - 4; k <= i + 4; k++) {
      if (k < 0 || k >= n) continue;
      dens[k] += o.s * (1 - Math.abs(k - i) / 5);
    }
  }
  for (let i = 0; i < n; i++) {
    let s = 0, c = 0;
    for (let k = i - w1; k <= i + w1; k++) {
      if (k < 0 || k >= n) continue;
      s += dens[k]; c++;
    }
    dens[i] = s / c;
  }

  /* ── z-score ─────────────────────────────────────────────────────────── */
  function zscore(a) {
    let m = 0;
    for (let i = 0; i < n; i++) m += a[i];
    m /= n;
    let v = 0;
    for (let i = 0; i < n; i++) v += (a[i] - m) * (a[i] - m);
    const sd = Math.sqrt(v / n) || 1;
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = (a[i] - m) / sd;
    return out;
  }
  const zl = zscore(lvl);
  const zd = zscore(dens);

  /* ── 新颖度：前后各 5s 的均值之差（棋盘核）──────────────────────────── */
  const W = Math.round(5 / hop);
  const nov = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let l1 = 0, d1 = 0, c1 = 0, l2 = 0, d2 = 0, c2 = 0;
    for (let k = i - W; k < i; k++) {
      if (k < 0 || k >= n) continue;
      l1 += zl[k]; d1 += zd[k]; c1++;
    }
    for (let k = i; k < i + W; k++) {
      if (k < 0 || k >= n) continue;
      l2 += zl[k]; d2 += zd[k]; c2++;
    }
    if (!c1 || !c2) continue;
    nov[i] = Math.abs(l1 / c1 - l2 / c2) + Math.abs(d1 / c1 - d2 / c2);
  }

  /* ── 打点：以 8 小节为格，格点再吸附到附近的新颖度峰（内容感知）────────── */
  const barSec = (60 / an.bpm) * 4;
  const blockBars = 8;
  const span = barSec * blockBars;
  const snap = (t) => {
    let best = t, bd = 0.30;
    for (const b of an.beats) {
      const d = Math.abs(b - t);
      if (d < bd) { bd = d; best = b; }
    }
    return +best.toFixed(3);
  };

  const picked = [];
  const win = Math.max(2, Math.round((barSec * 2) / hop));
  for (let k = 1; ; k++) {
    let t = an.beatOffset + k * span;
    if (t > total - Math.max(6, span * 0.4)) break;
    // 在 ±2 小节内找新颖度最大的位置，让切点更贴近真实段落交界
    const c = Math.round(t / hop);
    let bi = c, bv = -1;
    for (let i = Math.max(0, c - win); i <= Math.min(n - 1, c + win); i++) {
      if (nov[i] > bv) { bv = nov[i]; bi = i; }
    }
    picked.push(snap(bi * hop));
  }
  picked.sort((a, b) => a - b);

  // 去掉过近的切点（< 1 小节）
  for (let i = picked.length - 1; i > 0; i--) {
    if (picked[i] - picked[i - 1] < barSec) picked.splice(i, 1);
  }

  /* ── 组段 ────────────────────────────────────────────────────────────── */
  const bounds = [0].concat(picked, [+total.toFixed(3)]);
  const segs = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i];
    const end = bounds[i + 1];
    if (end - start < 1) continue;
    let s = 0, c = 0;
    for (let k = Math.floor(start / hop); k < Math.min(n, Math.ceil(end / hop)); k++) { s += an.rms[k]; c++; }
    const rms = s / Math.max(1, c);
    segs.push({ start: +start.toFixed(3), end: +end.toFixed(3), rms: +rms.toFixed(4), db: +db(rms).toFixed(1) });
  }

  /* 太短的段并到前一段 */
  for (let i = segs.length - 1; i > 0; i--) {
    if (segs[i].end - segs[i].start < 7) {
      segs[i - 1].end = segs[i].end;
      segs.splice(i, 1);
    }
  }

  const sortedDb = segs.map((x) => x.db).sort((a, b) => a - b);
  const q = (p) => sortedDb[Math.min(sortedDb.length - 1, Math.floor(p * (sortedDb.length - 1)))];

  return segs.map((s) => ({
    start: s.start,
    end: s.end,
    db: s.db,
    rms: s.rms,
    level: s.db <= q(0.34) ? 'quiet' : s.db <= q(0.72) ? 'build' : 'peak'
  }));
}


/* ══════════════════════════════════════════════════════════════════════════
 *  4. 生成事件表
 * ══════════════════════════════════════════════════════════════════════════*/

const PALETTE = {
  quiet: ['#4f7fff', '#6f8bd8', '#5eb6ff'],
  build: ['#5ef2d0', '#59e0b8', '#7ef2c4'],
  peak: ['#ff5ea8', '#ff2f6d', '#ffa63d']
};

function buildTimeline(an, lrc, segs) {
  const events = [];
  const push = (time, type, extra) => {
    events.push(Object.assign({ time: +time.toFixed(3), type }, extra || {}));
  };

  /* 开场标题 */
  push(0, 'text', { text: 'world.execute(me);', size: 1.3, color: '#eafeff' });
  push(0, 'caption', { text: 'Mili — audio-locked render · ' + an.bpm.toFixed(1) + ' BPM' });

  const accentOf = (s) => PALETTE[s.level][0];
  const segAt = (t) => segs.find((s) => t >= s.start && t < s.end) || segs[segs.length - 1];

  /* 每段：调色 / 图形 / 段落标签 / 重击 */
  segs.forEach((s, i) => {
    const accent = accentOf(s);
    push(s.start, 'color', { color: accent });
    push(s.start, 'shape', {
      sides: 3 + (i % 4),
      radius: s.level === 'peak' ? 215 : s.level === 'build' ? 190 : 165
    });
    push(s.start, 'caption', {
      text: '// ' + String(i + 1).padStart(2, '0') + ' ' + s.level + ' · ' + s.db.toFixed(0) + ' dB · ' + fmtClock(s.start)
    });
    if (s.level === 'peak') {
      push(s.start, 'cameraShake', { intensity: 0.9, duration: 0.9 });
      push(s.start, 'flash', { color: accent, duration: 0.45 });
      push(s.start, 'pulse', { scale: 1.06, duration: 0.6 });
    } else if (s.level === 'build') {
      push(s.start, 'cameraShake', { intensity: 0.45, duration: 0.6 });
    }
  });

  /* 歌词 → text 事件（CAPS 行更大、更亮）*/
  for (const l of lrc) {
    const caps = l.text === l.text.toUpperCase() && /[A-Z]/.test(l.text);
    const len = l.text.length;
    let size = caps ? 1.0 : 0.80;
    if (!caps && len > 30) size = 0.68;
    if (caps && len > 14) size = 0.88;

    const seg = segAt(l.time);
    push(l.time, 'text', {
      text: l.text,
      size: +size.toFixed(2),
      color: caps ? accentOf(seg) : '#eafeff'
    });

    if (caps) {
      // 全大写单词 = 歌里自带的强调，配一下
      push(l.time, 'pulse', { scale: 1.045, duration: 0.35 });
      if (len <= 12) push(l.time, 'flash', { color: accentOf(seg), duration: 0.18 });
    }
  }

  /* 强起音 → 闪光（限流：1.1s 内只取最强的一下）*/
  const strong = an.onsets
    .filter((o) => o.s > 0.55)
    .sort((a, b) => b.s - a.s);

  const used = [];
  for (const o of strong) {
    if (used.length >= 90) break;
    if (used.some((t) => Math.abs(t - o.t) < 1.1)) continue;
    const seg = segAt(o.t);
    if (o.t < 2) continue;
    used.push(o.t);
    push(o.t, 'flash', { color: accentOf(seg), duration: 0.22 });
  }
  used.sort((a, b) => a - b);

  /* 小节重拍 → 轻微推镜（密集段才给）*/
  const barBeats = [];
  for (let i = 0; i < an.beats.length; i += 4) {
    const t = an.beats[i];
    const seg = segAt(t);
    if (seg.level === 'peak') barBeats.push(t);
  }
  let lastPulse = -9;
  for (const t of barBeats) {
    if (t - lastPulse < 1.2) continue;
    lastPulse = t;
    push(t, 'pulse', { scale: 1.035, duration: 0.3 });
  }

  /* 最猛的几下 → 强抖 */
  const top = an.onsets.slice().sort((a, b) => b.s - a.s).slice(0, 12);
  for (const o of top) {
    if (o.t < 3) continue;
    push(o.t, 'cameraShake', { intensity: 0.7, duration: 0.5 });
  }

  /* 尾字幕 */
  push(Math.max(0, an.duration - 2.2), 'caption', { text: '// end — ' + fmtClock(an.duration) });

  events.sort((a, b) => a.time - b.time);
  return events;
}

function fmtClock(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0');
}

/* ══════════════════════════════════════════════════════════════════════════
 *  5. 写回 index.html
 * ══════════════════════════════════════════════════════════════════════════*/

function quote(s) {
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function bake(an, segs, events) {
  const lines = [];

  lines.push('  /* @generated:begin  —— 由 tool/build.js 生成，请勿手改这一段 */');
  lines.push('  const TRACK = {');
  lines.push('    file: ' + quote(path.relative(ROOT, CFG.audio).replace(/\\/g, '/')) + ',');
  lines.push('    duration: ' + an.duration + ',');
  lines.push('    bpm: ' + an.bpm + ',');
  lines.push('    beatOffset: ' + an.beatOffset + ',');
  lines.push('    beats: ' + an.beats.length + ',');
  lines.push('    onsets: ' + an.onsets.length + ',');
  lines.push('    sections: ' + segs.length);
  lines.push('  };');
  lines.push('');

  lines.push('  /* ' + events.length + ' 个事件：歌词 ' + events.filter((e) => e.type === 'text').length +
             ' / 闪光 ' + events.filter((e) => e.type === 'flash').length +
             ' / 抖动 ' + events.filter((e) => e.type === 'cameraShake').length +
             ' / 推镜 ' + events.filter((e) => e.type === 'pulse').length + ' */');
  lines.push('  const TIMELINE = [');
  for (const e of events) {
    const parts = ['time: ' + e.time, 'type: ' + quote(e.type)];
    if (e.text != null) parts.push('text: ' + quote(e.text));
    if (e.size != null) parts.push('size: ' + e.size);
    if (e.color != null) parts.push('color: ' + quote(e.color));
    if (e.duration != null) parts.push('duration: ' + e.duration);
    if (e.intensity != null) parts.push('intensity: ' + e.intensity);
    if (e.scale != null) parts.push('scale: ' + e.scale);
    if (e.sides != null) parts.push('sides: ' + e.sides);
    if (e.radius != null) parts.push('radius: ' + e.radius);
    lines.push('    { ' + parts.join(', ') + ' },');
  }
  lines.push('  ];');
  lines.push('');

  lines.push('  /* 分镜：start / end 来自响度分段，level 决定画哪几层 */');
  lines.push('  const SCENE_DEFS = [');
  segs.forEach((s, i) => {
    lines.push('    { id: ' + quote('s' + String(i + 1).padStart(2, '0') + '-' + s.level) +
               ', start: ' + s.start + ', end: ' + s.end + ', level: ' + quote(s.level) + ' },');
  });
  lines.push('  ];');
  lines.push('  /* @generated:end */');

  const block = lines.join('\n');

  const html = fs.readFileSync(CFG.page, 'utf8');
  const re = /[ \t]*\/\* @generated:begin[\s\S]*?@generated:end \*\//;
  if (!re.test(html)) die('index.html 里找不到 @generated:begin / @generated:end 标记');

  fs.writeFileSync(CFG.page, html.replace(re, block));

  return { block: block.split('\n').length, bytes: Buffer.byteLength(block) };
}

/* ══════════════════════════════════════════════════════════════════════════
 *  主流程
 * ══════════════════════════════════════════════════════════════════════════*/

async function main() {
  let an;
  if (CFG.reuse) {
    if (!fs.existsSync(CFG.out)) die('没有找到 ' + CFG.out + '，先跑一次完整流程');
    an = JSON.parse(fs.readFileSync(CFG.out, 'utf8'));
    console.log('  复用 ' + path.relative(ROOT, CFG.out));
  } else {
    an = await analyze();
  }

  console.log('');
  console.log('  时长      ' + an.duration.toFixed(2) + ' s  (' + fmtClock(an.duration) + ')');
  console.log('  采样      ' + an.sampleRate + ' Hz / ' + an.channels + ' ch (mono mix)');
  console.log('  速度      ' + an.bpm.toFixed(2) + ' BPM   首拍 ' + an.beatOffset.toFixed(3) + ' s');
  console.log('  拍数      ' + an.beats.length + '   起音 ' + an.onsets.length);

  if (CFG.analyzeOnly) { console.log('\n  已写出 ' + path.relative(ROOT, CFG.out) + '\n'); return; }

  const lrc = parseLrc(CFG.lrc);
  console.log('  歌词      ' + lrc.length + ' 行（' + fmtClock(lrc[0].time) + ' → ' + fmtClock(lrc[lrc.length - 1].time) + '）');

  const segs = segment(an, lrc);
  console.log('  分段      ' + segs.length + ' 段');
  console.log('');
  for (const s of segs) {
    console.log('    ' + fmtClock(s.start) + ' → ' + fmtClock(s.end) +
                '  ' + String((s.end - s.start).toFixed(1)).padStart(5) + 's  ' +
                s.db.toFixed(1).padStart(6) + ' dB  ' + s.level);
  }

  const events = buildTimeline(an, lrc, segs);
  const stat = bake(an, segs, events);

  console.log('');
  console.log('  事件      ' + events.length + ' 条  (text ' +
              events.filter((e) => e.type === 'text').length + ', flash ' +
              events.filter((e) => e.type === 'flash').length + ', shake ' +
              events.filter((e) => e.type === 'cameraShake').length + ', pulse ' +
              events.filter((e) => e.type === 'pulse').length + ')');
  console.log('  已写回    index.html  (' + stat.block + ' 行 / ' + (stat.bytes / 1024).toFixed(1) + ' KB)');
  console.log('');
}

function die(msg) {
  console.error('\n  ✗ ' + msg + '\n');
  process.exit(1);
}

main().catch((e) => die(e && e.stack ? e.stack : String(e)));


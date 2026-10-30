#!/usr/bin/env node
'use strict';

/**
 * render.js —— 用 Playwright 把 index.html 逐帧渲染成 PNG 序列，并给出 FFmpeg 命令
 *
 * 用法：
 *   node render.js                       // 渲染 index.html，30fps，24s → frames/
 *   node render.js --duration 12 --fps 60
 *   node render.js --mode api            // 开一次页面，逐帧调 renderAt(t)（快很多）
 *   node render.js --dry-run             // 只打印帧计划和 FFmpeg 命令，不启动浏览器
 *   node render.js --audio track.mp3     // 生成的命令里直接混入音轨
 *   node render.js --channel msedge      // 用系统已装的浏览器，不下载 Playwright 的 chromium
 *
 * 默认模式 navigate：每一帧都重新打开一次 ?t=...，最贴近“逐帧打开”的语义，
 * 单帧内存占用最低；mode api 只加载一次页面，靠 window.renderAt(t) 推进，
 * 速度约为 navigate 的 5~8 倍，结果完全等价（页面本身无跨帧状态）。
 *
 * 依赖只在渲染侧：npm i -D playwright && npx playwright install chromium
 * 页面本身仍然零依赖、零构建。
 */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

/* ══════════════════════════════════════════════════════════════════════════
 *  1. 命令行参数
 * ══════════════════════════════════════════════════════════════════════════*/

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.slice(0, 2) !== '--') continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.slice(0, 2) === '--') out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

const raw = parseArgs(process.argv.slice(2));
const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const bool = (v, d) => (v === undefined ? d : !(v === false || v === 'false' || v === '0'));
const str = (v, d) => (typeof v === 'string' && v.length ? v : d);

const CFG = {
  url:      str(raw.url, 'index.html'),
  fps:      num(raw.fps, 30),
  duration: raw.duration == null ? null : num(raw.duration, 24),   // null = 启动后从页面读 window.DURATION
  start:    num(raw.start, 0),
  out:      str(raw.out, 'frames'),
  mode:     raw.mode === 'api' ? 'api' : 'navigate',
  width:    Math.round(num(raw.width, 1920)),
  height:   Math.round(num(raw.height, 1080)),
  dpr:      num(raw.dpr, 1),
  timeout:  num(raw.timeout, 30000),
  prefix:   'frame_',
  digits:   6,
  crf:      num(raw.crf, 16),
  preset:   str(raw.preset, 'slow'),
  video:    str(raw['out-video'], 'out.mp4'),
  audio:    raw.audio && raw.audio !== true ? raw.audio : null,
  channel:  str(raw.channel, null),      // msedge / chrome：用系统已装的浏览器
  clean:    bool(raw.clean, false),
  headed:   bool(raw.headed, false),
  dryRun:   bool(raw['dry-run'], false),
  quiet:    bool(raw.quiet, false)
};

if (!(CFG.fps > 0)) fail('--fps 必须大于 0');
if (CFG.duration != null && !(CFG.duration > 0)) fail('--duration 必须大于 0');
if (CFG.width < 1 || CFG.height < 1) fail('--width / --height 非法');

/* ══════════════════════════════════════════════════════════════════════════
 *  2. 帧计划：第 n 帧（1 起）对应 t = start + (n-1)/fps
 * ══════════════════════════════════════════════════════════════════════════*/

let total = 0;
let frames = [];

function planFrames() {
  const n = Math.max(1, Math.round(CFG.duration * CFG.fps));
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      index: i + 1,
      t: +((CFG.start + i / CFG.fps).toFixed(6)),
      file: CFG.prefix + String(i + 1).padStart(CFG.digits, '0') + '.png'
    });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  3. 路径 / URL
 * ══════════════════════════════════════════════════════════════════════════*/

function resolveUrl(u) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) return u;          // http(s):// file:// data:
  const abs = path.resolve(process.cwd(), u);
  if (!fs.existsSync(abs)) fail('找不到页面文件：' + abs);
  return pathToFileURL(abs).href;                            // 自动处理空格 / ; / 括号
}

function withT(base, t) {
  return base + (base.indexOf('?') >= 0 ? '&' : '?') + 't=' + t;
}

const PAGE_URL = resolveUrl(CFG.url);
const OUT_DIR = path.resolve(process.cwd(), CFG.out);

/* ══════════════════════════════════════════════════════════════════════════
 *  4. FFmpeg 命令
 * ══════════════════════════════════════════════════════════════════════════*/

function ffmpegCommand() {
  const pattern = toPosix(path.posix.join(CFG.out, CFG.prefix + '%0' + CFG.digits + 'd.png'));
  const parts = ['ffmpeg -y'];
  parts.push('-framerate ' + CFG.fps);
  parts.push('-i "' + pattern + '"');
  if (CFG.audio) {
    parts.push('-i "' + toPosix(CFG.audio) + '"');
    parts.push('-map 0:v:0', '-map 1:a:0', '-c:a aac', '-b:a 192k', '-shortest');
  }
  parts.push('-c:v libx264');
  parts.push('-pix_fmt yuv420p');
  parts.push('-crf ' + CFG.crf);
  parts.push('-preset ' + CFG.preset);
  parts.push('-movflags +faststart');
  parts.push('"' + toPosix(CFG.video) + '"');
  return parts.join(' ');
}

const toPosix = (p) => String(p).replace(/\\/g, '/');

/* ══════════════════════════════════════════════════════════════════════════
 *  5. 主流程
 * ══════════════════════════════════════════════════════════════════════════*/

function printHeader() {
  if (CFG.quiet) return;
  const last = frames[frames.length - 1];
  console.log('');
  console.log('  页面    ' + PAGE_URL);
  console.log('  模式    ' + CFG.mode + (CFG.mode === 'navigate' ? '（每帧重新打开 ?t=）' : '（一次加载，逐帧 renderAt）'));
  console.log('  画布    ' + CFG.width + 'x' + CFG.height + ' @dpr ' + CFG.dpr);
  console.log('  时长    ' + CFG.duration + 's @ ' + CFG.fps + 'fps → ' + total + ' 帧');
  console.log('  区间    t = ' + frames[0].t + ' … ' + last.t);
  console.log('  输出    ' + OUT_DIR + '\\' + frames[0].file + ' … ' + last.file);
  console.log('');
}

async function main() {
  if (CFG.dryRun) {
    if (CFG.duration == null) CFG.duration = 24;   // dry-run 不开浏览器，只能按默认时长示范
    frames = planFrames();
    total = frames.length;
    printHeader();
    console.log('  [dry-run] 不启动浏览器。FFmpeg 命令：');
    console.log('');
    console.log('  ' + ffmpegCommand());
    console.log('');
    return;
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    try {
      playwright = require('playwright-core');
    } catch (e2) {
      fail('缺少 playwright，请先在渲染侧安装：\n  npm i -D playwright\n  npx playwright install chromium');
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (CFG.clean) {
    for (const f of fs.readdirSync(OUT_DIR)) {
      if (f.startsWith(CFG.prefix) && f.endsWith('.png')) fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }

  const browser = await playwright.chromium.launch({
    headless: !CFG.headed,
    channel: CFG.channel || undefined,
    args: [
      '--hide-scrollbars',
      '--disable-lcd-text',          // 关掉次像素抗锯齿，保证跨机器截图一致
      '--force-color-profile=srgb',
      '--font-render-hinting=none'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: CFG.width, height: CFG.height },
    deviceScaleFactor: CFG.dpr,
    reducedMotion: 'reduce'
  });

  const page = await context.newPage();

  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + (e && e.message ? e.message : e)));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console.error: ' + m.text()); });

  /* 没给 --duration 时，从页面读真实时长（音频时长就写在 window.DURATION 里） */
  if (CFG.duration == null) {
    await page.goto(PAGE_URL, { waitUntil: 'load', timeout: CFG.timeout });
    await page.waitForFunction(() => window.__READY__ === true, null, { timeout: CFG.timeout });
    const d = await page.evaluate(() => window.DURATION);
    if (!(d > 0)) fail('页面没有导出 window.DURATION，请显式传 --duration');
    CFG.duration = Math.round(d * 1000) / 1000;
    if (!CFG.quiet) console.log('  时长    自动读取 window.DURATION = ' + CFG.duration + 's');
  }
  frames = planFrames();
  total = frames.length;
  printHeader();

  const clip = { x: 0, y: 0, width: CFG.width, height: CFG.height };
  const startedAt = Date.now();
  let current = null;

  try {
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const target = path.join(OUT_DIR, f.file);
      current = f;

      if (CFG.mode === 'navigate' || i === 0) {
        // 每帧重新打开：?t= 走页面的自动渲染路径
        await page.goto(withT(PAGE_URL, f.t), { waitUntil: 'load', timeout: CFG.timeout });
        await page.waitForFunction(
          (tt) => window.__READY__ === true && Math.abs(window.__LAST_T__ - tt) < 1e-6,
          f.t,
          { timeout: CFG.timeout }
        );
      } else {
        // 复用页面：同步调 renderAt(t)，返回值即实际渲染的 t
        const seen = await page.evaluate((tt) => {
          window.renderAt(tt);
          return window.__LAST_T__;
        }, f.t);
        if (Math.abs(seen - f.t) > 1e-6) {
          throw new Error('时间不符：请求 ' + f.t + '，实际 ' + seen);
        }
      }

      await page.screenshot({ path: target, type: 'png', clip: clip });

      if (!CFG.quiet) progress(i + 1, frames.length, f, startedAt);
    }
  } catch (e) {
    const extra = problems.length ? '；页面错误：' + problems.slice(0, 3).join(' | ') : '';
    const where = current ? '第 ' + current.index + ' 帧（t=' + current.t + '）' : '启动阶段';
    throw new Error(where + '失败：' + (e && e.message ? e.message : e) + extra);
  } finally {
    await context.close();
    await browser.close();
  }

  if (!CFG.quiet) process.stdout.write('\n');

  if (problems.length) {
    console.log('  页面报了 ' + problems.length + ' 条错误（截图仍已产出）：');
    for (const p of problems.slice(0, 8)) console.log('    - ' + p);
    console.log('');
  }

  console.log('  完成：' + total + ' 帧 / ' + ((Date.now() - startedAt) / 1000).toFixed(1) + 's → ' + OUT_DIR);
  console.log('');
  console.log('  FFmpeg：');
  console.log('');
  console.log('  ' + ffmpegCommand());
  console.log('');
}

function progress(done, all, f, startedAt) {
  const elapsed = (Date.now() - startedAt) / 1000;
  const eta = done > 1 ? (elapsed / done) * (all - done) : 0;
  const pct = ((done / all) * 100).toFixed(1).padStart(5);
  process.stdout.write(
    '\r  ' + pct + '%  ' + String(done).padStart(4) + '/' + all +
    '  t=' + f.t.toFixed(3).padStart(7) + 's  ' + f.file +
    '  eta ' + eta.toFixed(1).padStart(6) + 's   '
  );
}

function fail(msg) {
  console.error('\n  ✗ ' + msg + '\n');
  process.exit(1);
}

main().catch((e) => {
  console.error('\n  ✗ 渲染失败：' + (e && e.stack ? e.stack : e) + '\n');
  process.exit(1);
});

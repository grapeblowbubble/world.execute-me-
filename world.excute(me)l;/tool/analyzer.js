/* ══════════════════════════════════════════════════════════════════════════
 *  tool/analyzer.js —— 在浏览器里解码音频、提取特征，结果写到 window.__ANALYSIS__
 *
 *  这一段代码只跑在离线分析阶段（Playwright 里），页面 index.html 永远不会
 *  执行它 —— 页面只读烘焙好的数据表。
 *
 *  输出：
 *    duration  秒
 *    bpm / beatOffset / beats[]     节拍
 *    onsets[]  起始点（t + 强度 0..1）
 *    rms[]     每 0.25s 的响度（0..1）
 *    flux[]    每帧的起音包络（用于对齐/调试，体积较大但只是中间产物）
 * ══════════════════════════════════════════════════════════════════════════*/
(async function () {
  'use strict';

  const SR = 22050;        // 重采样目标
  const WIN = 1024;        // FFT 窗
  const HOP = 512;         // 帧移 → 每帧 23.2ms
  const ENV_FPS = SR / HOP;

  /* ── 解码 ─────────────────────────────────────────────────────────────── */
  const buf = await (await fetch('/track')).arrayBuffer();
  const octx = new OfflineAudioContext(1, 1, SR);
  const audio = await octx.decodeAudioData(buf);

  const ch = audio.numberOfChannels;
  const n = audio.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < ch; c++) {
    const d = audio.getChannelData(c);
    for (let i = 0; i < n; i++) mono[i] += d[i] / ch;
  }

  /* ── 原地 radix-2 FFT ─────────────────────────────────────────────────── */
  function fft(re, im) {
    const m = re.length;
    for (let i = 1, j = 0; i < m; i++) {
      let bit = m >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let len = 2; len <= m; len <<= 1) {
      const ang = -2 * Math.PI / len;
      const wr = Math.cos(ang), wi = Math.sin(ang);
      const half = len >> 1;
      for (let i = 0; i < m; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < half; k++) {
          const ar = re[i + k], ai = im[i + k];
          const br = re[i + k + half], bi = im[i + k + half];
          const vr = br * cr - bi * ci;
          const vi = br * ci + bi * cr;
          re[i + k] = ar + vr; im[i + k] = ai + vi;
          re[i + k + half] = ar - vr; im[i + k + half] = ai - vi;
          const nr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  /* ── 起音包络：对数幅度谱的正向差分（spectral flux）───────────────────── */
  const frames = Math.max(0, Math.floor((n - WIN) / HOP) + 1);
  const flux = new Float32Array(frames);
  const rms = new Float32Array(frames);

  const hann = new Float32Array(WIN);
  for (let i = 0; i < WIN; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1));

  const re = new Float32Array(WIN);
  const im = new Float32Array(WIN);
  const BINS = WIN >> 1;
  let prev = new Float32Array(BINS);

  for (let f = 0; f < frames; f++) {
    const off = f * HOP;
    let sum = 0;
    for (let i = 0; i < WIN; i++) {
      const s = mono[off + i] || 0;
      sum += s * s;
      re[i] = s * hann[i];
      im[i] = 0;
    }
    rms[f] = Math.sqrt(sum / WIN);

    fft(re, im);

    let fl = 0;
    for (let b = 1; b < BINS; b++) {
      const mag = Math.log(1 + 100 * Math.sqrt(re[b] * re[b] + im[b] * im[b]));
      const d = mag - prev[b];
      if (d > 0) fl += d;
      prev[b] = mag;
    }
    flux[f] = fl;
  }

  /* 归一化（去掉极值后按 99 分位缩放）*/
  const sorted = Float32Array.from(flux).sort();
  const p99 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))] || 1;
  for (let i = 0; i < frames; i++) flux[i] = Math.min(1, flux[i] / p99);

  let rmsMax = 0;
  for (let i = 0; i < frames; i++) rmsMax = Math.max(rmsMax, rms[i]);

  /* ── 节拍：包络自相关 ─────────────────────────────────────────────────── */
  const mean = (() => { let s = 0; for (let i = 0; i < frames; i++) s += flux[i]; return s / frames; })();
  const cen = new Float32Array(frames);
  for (let i = 0; i < frames; i++) cen[i] = flux[i] - mean;

  const lagMin = Math.max(4, Math.round(ENV_FPS * 0.30));   // 200 BPM
  const lagMax = Math.round(ENV_FPS * 1.20);                // 50 BPM

  let bestLag = 0, bestScore = -Infinity;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let s = 0;
    for (let i = 0; i + lag < frames; i++) s += cen[i] * cen[i + lag];
    s /= (frames - lag);
    // 轻微偏向 100~150 BPM，避免被半拍/双拍吃掉
    const bpmAt = (60 * ENV_FPS) / lag;
    const w = bpmAt >= 90 && bpmAt <= 165 ? 1.0 : 0.86;
    s *= w;
    if (s > bestScore) { bestScore = s; bestLag = lag; }
  }

  const period = bestLag / ENV_FPS;             // 秒
  const bpm = 60 / period;

  /* 相位：让节拍点尽量落在起音峰上 */
  let bestPhase = 0, phaseScore = -Infinity;
  const phaseSteps = 64;
  for (let p = 0; p < phaseSteps; p++) {
    const phase = (p / phaseSteps) * period;
    let s = 0;
    for (let t = phase; t < n / SR; t += period) {
      const idx = Math.round(t * ENV_FPS);
      if (idx >= 0 && idx < frames) s += flux[idx];
    }
    if (s > phaseScore) { phaseScore = s; bestPhase = phase; }
  }

  /* 每个拍点微调到 ±80ms 内的起音峰 */
  const beats = [];
  const total = n / SR;
  for (let t = bestPhase; t < total; t += period) {
    const c = Math.round(t * ENV_FPS);
    let bi = c, bv = -1;
    const rad = Math.round(0.08 * ENV_FPS);
    for (let k = c - rad; k <= c + rad; k++) {
      if (k < 0 || k >= frames) continue;
      if (flux[k] > bv) { bv = flux[k]; bi = k; }
    }
    beats.push(+(bi / ENV_FPS).toFixed(4));
  }

  /* ── 起音峰 ───────────────────────────────────────────────────────────── */
  const onsets = [];
  const minGap = Math.round(0.09 * ENV_FPS);
  for (let i = 1; i < frames - 1; i++) {
    const v = flux[i];
    if (v < 0.12) continue;
    if (v < flux[i - 1] || v < flux[i + 1]) continue;
    if (onsets.length && i - Math.round(onsets[onsets.length - 1].t * ENV_FPS) < minGap) {
      if (v > onsets[onsets.length - 1].s) {
        onsets[onsets.length - 1] = { t: +(i / ENV_FPS).toFixed(4), s: +v.toFixed(4) };
      }
      continue;
    }
    onsets.push({ t: +(i / ENV_FPS).toFixed(4), s: +v.toFixed(4) });
  }

  /* ── 响度（每 0.25s）────────────────────────────────────────────────────── */
  const rmsHop = 0.25;
  const rmsSteps = Math.floor(total / rmsHop);
  const rmsOut = [];
  for (let i = 0; i < rmsSteps; i++) {
    const a = Math.round(i * rmsHop * ENV_FPS);
    const b = Math.round((i + 1) * rmsHop * ENV_FPS);
    let s = 0, c = 0;
    for (let k = a; k < b && k < frames; k++) { s += rms[k] * rms[k]; c++; }
    rmsOut.push(+Math.sqrt(s / Math.max(1, c)).toFixed(4));
  }

  window.__ANALYSIS__ = {
    duration: +total.toFixed(4),
    sampleRate: SR,
    channels: ch,
    frameHop: HOP,
    envFps: +ENV_FPS.toFixed(4),
    rmsMax: +rmsMax.toFixed(4),
    bpm: +bpm.toFixed(2),
    beatOffset: +bestPhase.toFixed(4),
    beats,
    onsets,
    rms: rmsOut,
    rmsHop
  };
})().catch((e) => { window.__ANALYSIS__ = { error: String(e && e.stack || e) }; });

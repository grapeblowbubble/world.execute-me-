  /* ── S21 虎斑猫 · 基因背景（双螺旋 / 测序流）──────────────────────────── */
  MODULES['sc.bioCat'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const cx = W / 2, by = 648;
    const purr = smooth(0.10, 1.90, localT);

    /* ---------- 背景：双螺旋 ---------- */
    const helix = function (cy, amp, turns, drift, al) {
      const N = 132;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const x = (i / N) * (W + 120) - 60;
          const u = (i / N) * turns * Math.PI * 2 + drift + k * Math.PI;
          const y = cy + Math.sin(u) * amp;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(94,242,208,' + (al * (k === 0 ? 1 : 0.72)).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      /* 碱基对横档：越靠"侧面"越亮，做出立体扭转 */
      for (let i = 0; i <= N; i += 2) {
        const x = (i / N) * (W + 120) - 60;
        const u = (i / N) * turns * Math.PI * 2 + drift;
        const y1 = cy + Math.sin(u) * amp;
        const y2 = cy + Math.sin(u + Math.PI) * amp;
        const d = Math.abs(Math.cos(u));
        ctx.strokeStyle = 'rgba(140,215,235,' + (al * (0.30 + 0.95 * d)).toFixed(3) + ')';
        ctx.lineWidth = d > 0.7 ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y1); ctx.lineTo(x, y2);
        ctx.stroke();
      }
    };

    helix(214, 74, 3.2, -localT * 0.30, 0.14);
    helix(560, 128, 2.4, -localT * 0.20 + 1.1, 0.10);
    helix(880, 150, 2.0, localT * 0.16 + 2.4, 0.07);

    /* 测序流：横向滚动的碱基条 */
    const SEQ = 'ACGT';
    mono(ctx, 11, 500);
    for (let r = 0; r < 3; r++) {
      const yy = 96 + r * 26;
      const speed = 26 + r * 14;
      const off = (t * speed) % 22;
      ctx.fillStyle = 'rgba(140,215,235,' + (0.10 + r * 0.03).toFixed(3) + ')';
      for (let x = -22; x < W + 22; x += 22) {
        const idx = Math.floor((x + off) / 22 + r * 7);
        ctx.fillText(SEQ.charAt(Math.abs(idx) % 4), x, yy);
      }
    }

    /* 基因组环：猫身后的圆环 + 刻度 */
    ctx.save();
    ctx.translate(cx, by - 168);
    ctx.rotate(localT * 0.12);
    ctx.strokeStyle = 'rgba(232,178,58,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const l = k % 6 === 0 ? 12 : 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 300, Math.sin(a) * 300);
      ctx.lineTo(Math.cos(a) * (300 + l), Math.sin(a) * (300 + l));
      ctx.stroke();
    }
    ctx.restore();

    /* ---------- 猫：线描 + 虎斑 ---------- */
    ctx.save();
    ctx.translate(cx, by);

    const ink = 'rgba(232,178,58,' + (0.42 + 0.34 * purr).toFixed(3) + ')';
    ctx.fillStyle = 'rgba(10,8,16,0.80)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;

    /* 身体 */
    ctx.beginPath();
    ctx.moveTo(-96, 0);
    ctx.bezierCurveTo(-104, -96, -66, -168, 0, -168);
    ctx.bezierCurveTo(66, -168, 104, -96, 96, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    /* 虎斑：身体上的横纹 */
    ctx.strokeStyle = 'rgba(232,178,58,' + (0.24 + 0.18 * purr).toFixed(3) + ')';
    ctx.lineWidth = 3;
    for (let k = 0; k < 5; k++) {
      const yy = -22 - k * 30;
      const w = 84 - k * 12;
      ctx.beginPath();
      ctx.moveTo(-w, yy + 8);
      ctx.quadraticCurveTo(-w * 0.4, yy - 8, -w * 0.1, yy + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w, yy + 8);
      ctx.quadraticCurveTo(w * 0.4, yy - 8, w * 0.1, yy + 4);
      ctx.stroke();
    }
    /* 尾巴 + 环纹 */
    ctx.strokeStyle = 'rgba(232,178,58,' + (0.34 + 0.30 * purr).toFixed(3) + ')';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(92, -18);
    ctx.bezierCurveTo(168, -30, 186, -128, 146, -170);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(10,8,16,0.75)';
    ctx.lineWidth = 3.5;
    for (let k = 0; k < 4; k++) {
      const u = 0.22 + k * 0.19;
      const bx = 92 + (146 - 92) * u + 26 * Math.sin(u * Math.PI);
      const byy = -18 + (-170 + 18) * u;
      ctx.beginPath();
      ctx.moveTo(bx - 7, byy + 3);
      ctx.lineTo(bx + 7, byy - 3);
      ctx.stroke();
    }
    ctx.lineWidth = 2;

    /* 头 */
    ctx.beginPath();
    ctx.arc(0, -214, 66, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,8,16,0.86)';
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.stroke();

    /* 耳朵 */
    const ear = function (sx) {
      ctx.beginPath();
      ctx.moveTo(sx * 20, -262);
      ctx.lineTo(sx * 66, -322);
      ctx.lineTo(sx * 70, -246);
      ctx.closePath();
      ctx.fillStyle = 'rgba(10,8,16,0.86)';
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.stroke();
    };
    ear(-1); ear(1);

    /* 额头的虎斑 M 纹 */
    ctx.strokeStyle = 'rgba(232,178,58,' + (0.30 + 0.22 * purr).toFixed(3) + ')';
    ctx.lineWidth = 2.4;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(k * 14, -246);
      ctx.lineTo(k * 20, -228);
      ctx.stroke();
    }

    /* 眼：随咕噜眯起，外圈加描边 */
    const open = 1 - 0.72 * purr;
    ctx.fillStyle = 'rgba(232,178,58,0.96)';
    ctx.beginPath(); ctx.ellipse(-24, -222, 9, 11 * open, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24, -222, 9, 11 * open, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(10,8,16,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-26, -222); ctx.lineTo(-22, -222); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -222); ctx.lineTo(26, -222); ctx.stroke();

    /* 胡须：延伸成数据线 */
    ctx.strokeStyle = 'rgba(234,254,255,0.26)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-14, -204 + i * 6); ctx.lineTo(-130, -222 + i * 22);
      ctx.moveTo(14, -204 + i * 6); ctx.lineTo(130, -222 + i * 22);
      ctx.stroke();
      ctx.fillStyle = 'rgba(94,242,208,0.5)';
      ctx.beginPath(); ctx.arc(-130, -222 + i * 22, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(130, -222 + i * 22, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    /* 颈圈 + 吊牌 */
    ctx.strokeStyle = 'rgba(94,242,208,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -158, 44, 12, 0, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.fillStyle = 'rgba(94,242,208,0.85)';
    ctx.beginPath();
    ctx.arc(0, -146, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    /* ---------- 咕噜声波 ---------- */
    const amp = 6 + purr * 30;
    ctx.strokeStyle = 'rgba(232,178,58,' + (0.18 + 0.34 * purr).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = cx - 440; x <= cx + 440; x += 3) {
      const u = (x - (cx - 440)) / 880;
      const env = Math.sin(u * Math.PI);
      const y = by + 66 + Math.sin(u * 58 - t * 7.5) * amp * env;
      if (x === cx - 440) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* ---------- HUD ---------- */
    mono(ctx, 14, 600);
    ctx.fillStyle = 'rgba(232,178,58,0.62)';
    ctx.fillText('SUBJECT 04  \u00b7  FELIS CATUS  \u00b7  TABBY', 96, 150);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(140,215,235,0.55)';
    ctx.fillText('ENJOYMENT  \u00b7  purr ' + Math.round(purr * 100) + '%  \u00b7  ' + Math.round(amp * 4) + ' Hz', W - 96, 150);
    ctx.textAlign = 'left';

    mono(ctx, 12, 500);
    ctx.fillStyle = 'rgba(94,242,208,0.42)';
    ctx.fillText('GENOME 2.7 Gb  \u00b7  PURR 25 Hz  \u00b7  KNEAD 4 Hz', 96, 934);
  };

  /* ── S22 存在需要证据（冲击展开）───────────────────────────────────────── */
  MODULES['sc.existence'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const cx = W / 2, cy = 452;
    const TW = 2.844;                       /* “EXISTENCE” 出现并闪光的时刻 */
    const rise = smooth(0.10, 2.20, localT);
    const age = localT - TW;
    const boom = clamp(age / 0.55, 0, 1);   /* 0→1 冲击展开 */
    const after = clamp(age / 1.30, 0, 1);

    /* ---------- 冲击前的暗场 ---------- */
    const pre = 1 - clamp(age / 0.09, 0, 1);

    /* 中心辉光：冲击瞬间暴涨后回落 */
    const glowR = 120 + 420 * rise + 620 * Math.pow(1 - boom, 2.2) * (age > 0 ? 1 : 0);
    const glowA = 0.10 + 0.45 * rise + 0.45 * Math.pow(1 - boom, 2) * (age > 0 ? 1 : 0);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    g.addColorStop(0, 'rgba(234,254,255,' + glowA.toFixed(3) + ')');
    g.addColorStop(0.22, 'rgba(94,242,208,' + (0.06 + 0.20 * rise).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(94,242,208,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* ---------- 冲击波环 ---------- */
    for (let k = 0; k < 4; k++) {
      const a2 = age - k * 0.10;
      if (a2 <= 0 || a2 > 1.9) continue;
      const u = clamp(a2 / 1.9, 0, 1);
      const rr = 60 + u * (k === 0 ? 900 : 640);
      ctx.strokeStyle = 'rgba(234,254,255,' + ((1 - u) * (0.55 - k * 0.10)).toFixed(3) + ')';
      ctx.lineWidth = (1 - u) * 9 + 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* ---------- 光芒：冲击时被推出去 ---------- */
    const N = 36;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + t * 0.08;
      const long = i % 2 === 0;
      const base = (long ? 520 : 260) * (0.35 + 0.65 * rise);
      const push = 1 + 1.5 * Math.pow(1 - boom, 2) * (age > 0 ? 1 : 0);
      const len = base * (0.85 + 0.15 * Math.sin(t * 1.7 + i)) * (after > 0 ? push : 1);
      const al = (0.05 + (long ? 0.16 : 0.08) * rise) * (1 + 2.4 * Math.pow(1 - boom, 3) * (age > 0 ? 1 : 0));
      ctx.strokeStyle = 'rgba(234,254,255,' + Math.min(0.85, al).toFixed(3) + ')';
      ctx.lineWidth = long ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }

    /* ---------- 碎片：冲击时炸开的点 ---------- */
    if (age > 0) {
      for (let i = 0; i < 72; i++) {
        const dir = hash01(i * 3.17) * Math.PI * 2;
        const spd = 240 + hash01(i * 7.31) * 620;
        const d = spd * (1 - Math.exp(-age * 2.2)) / 2.2;
        const x = cx + Math.cos(dir) * d;
        const y = cy + Math.sin(dir) * d * 0.82;
        const a2 = (1 - clamp(age / 1.6, 0, 1)) * (0.35 + 0.55 * hash01(i * 1.7));
        if (a2 <= 0.01) continue;
        const sz = 1.2 + hash01(i * 5.5) * 2.4;
        ctx.fillStyle = 'rgba(234,254,255,' + a2.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* ---------- 主环与核心 ---------- */
    ctx.beginPath();
    ctx.arc(cx, cy, 118 + 12 * Math.sin(t * 2.1) + 40 * Math.pow(1 - boom, 2) * (age > 0 ? 1 : 0), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(234,254,255,' + (0.20 + 0.35 * rise).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const coreR = 9 * (1 + 2.2 * Math.pow(1 - boom, 3) * (age > 0 ? 1 : 0));
    ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.98)'; ctx.fill();

    /* ---------- 证据点：冲击后散成轨道 ---------- */
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - t * 0.4;
      const rr = 210 + 260 * Math.pow(1 - boom, 2) * (age > 0 ? 1 : 0);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.42;
      ctx.beginPath(); ctx.arc(x, y, 3.5 + 2.5 * Math.pow(1 - boom, 2), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(94,242,208,' + (0.35 + 0.45 * rise).toFixed(3) + ')';
      ctx.fill();
    }

    /* ---------- 读数 ---------- */
    mono(ctx, 14, 600);
    ctx.fillStyle = 'rgba(180,230,245,0.78)';
    ctx.textAlign = 'center';
    ctx.fillText('EXISTENCE  \u00b7  requires proof  \u00b7  ' + Math.round((age > 0 ? 100 : rise * 96)) + '%', W / 2, 706);
    ctx.textAlign = 'left';

    /* 冲击瞬间的白色闪屏（叠在模块内，跟着镜头一起抖） */
    if (age > 0 && age < 0.42) {
      ctx.fillStyle = 'rgba(234,254,255,' + (0.42 * Math.pow(1 - age / 0.42, 2)).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  };


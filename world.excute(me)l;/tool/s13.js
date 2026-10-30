  /* ── S13 时间轴：七件发明，线条彼此拉扯变形 ───────────────────────────── */
  MODULES['sc.timeAxis'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;

    drawBackground(ctx, t, st);

    const NPT = 64;

    /* 按弧长重采样成固定点数：所有图形共用一个点集，才能逐点插值 */
    const rs = function (pts, n) {
      const seg = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(d);
        total += d;
      }
      const out = [];
      if (total <= 0) {
        for (let i = 0; i < n; i++) out.push([pts[0][0], pts[0][1]]);
        return out;
      }
      let si = 0, sacc = 0;
      for (let i = 0; i < n; i++) {
        const target = (i / (n - 1)) * total;
        while (si < seg.length - 1 && sacc + seg[si] < target) { sacc += seg[si]; si++; }
        const r = seg[si] === 0 ? 0 : (target - sacc) / seg[si];
        const a = pts[si], b = pts[si + 1] || pts[si];
        out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
      }
      return out;
    };

    const arc = function (cx, cy, r, a0, a1) {
      const out = [];
      const n = 48;
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * (i / n);
        out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return out;
    };

    const box = function (cx, cy, w, h) {
      return [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h], [cx - w, cy - h]];
    };

    /* ---------- 七个图形：每个 4 条笔画，坐标归一化在 [-1,1] ---------- */
    const ICON = [
      /* 0 轮子 */
      [
        arc(0, 0, 0.92, 0, Math.PI * 2),
        arc(0, 0, 0.24, 0, Math.PI * 2),
        [[-0.9, 0], [0.9, 0]],
        [[0, -0.9], [0, 0.9]]
      ],
      /* 1 杠杆 */
      [
        [[-0.17, 0.58], [0.17, 0.58], [0, 0.96], [-0.17, 0.58]],
        [[-0.98, -0.46], [0.98, 0.16]],
        box(-0.78, -0.62, 0.20, 0.14),
        arc(0, 0.58, 0.62, -Math.PI * 0.92, -Math.PI * 0.32)
      ],
      /* 2 指南针 */
      [
        arc(0, 0, 0.94, 0, Math.PI * 2),
        arc(0, 0, 0.74, 0, Math.PI * 2),
        [[0, -0.70], [0.17, 0], [0, 0.70], [-0.17, 0], [0, -0.70]],
        [[-0.06, -0.90], [0.06, -0.90]]
      ],
      /* 3 蒸汽机 */
      [
        arc(-0.40, 0.16, 0.50, 0, Math.PI * 2),
        arc(0.52, 0.26, 0.66, 0, Math.PI * 2),
        [[-0.40, -0.34], [-0.40, -0.70], [0.52, -0.70], [0.52, -0.40]],
        [[0.52, 0.26], [0.06, 0.26], [0.06, 0.62]]
      ],
      /* 4 集成电路 */
      [
        box(0, 0, 0.86, 0.86),
        box(0, 0, 0.46, 0.46),
        [[-0.86, -0.46], [-1.02, -0.46], [-1.02, -0.20], [-0.86, -0.20],
         [-0.86, 0.10], [-1.02, 0.10], [-1.02, 0.36], [-0.86, 0.36]],
        [[-0.46, 0.86], [-0.46, 1.02], [-0.16, 1.02], [-0.16, 0.86],
         [0.14, 0.86], [0.14, 1.02], [0.44, 1.02], [0.44, 0.86]]
      ],
      /* 5 阿波罗 */
      [
        [[-0.30, 0.86], [-0.30, -0.10], [-0.16, -0.62], [0, -0.74],
         [0.16, -0.62], [0.30, -0.10], [0.30, 0.86], [-0.30, 0.86]],
        [[-0.30, 0.40], [-0.70, 0.86], [-0.44, 0.86], [-0.30, 0.66]],
        [[0.30, 0.40], [0.70, 0.86], [0.44, 0.86], [0.30, 0.66]],
        arc(0, 0.30, 0.14, 0, Math.PI * 2)
      ],
      /* 6 神经网络 */
      [
        arc(-0.62, -0.52, 0.15, 0, Math.PI * 2),
        arc(-0.62, 0.52, 0.15, 0, Math.PI * 2),
        arc(0.62, 0, 0.15, 0, Math.PI * 2),
        [[-0.62, -0.52], [0.62, 0], [-0.62, 0.52], [0.62, 0], [-0.62, -0.52]]
      ]
    ];

    const NAMES = ['WHEEL', 'LEVER', 'COMPASS', 'STEAM ENGINE',
                   'INTEGRATED CIRCUIT', 'APOLLO', 'NEURAL NET'];
    const YEARS = ['4000 BC', '3000 BC', '1200', '1712', '1950', '1969', '2010'];

    /* ---------- 时间推进 ---------- */
    const STEP = 0.50;
    const MORPH = 0.28;
    const uu = clamp(localT / STEP, 0, 6.999);
    const idx = Math.floor(uu);
    const nxt = Math.min(6, idx + 1);
    const q = clamp((localT - idx * STEP) / MORPH, 0, 1);
    const e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;

    const CX = W / 2, CY = 452, SC = 296;

    /* ---------- 逐点插值 + 拉伸弯曲 ---------- */
    const drawIcon = function (pts, alpha, width, glow) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const x = CX + pts[i][0] * SC;
        const y = CY + pts[i][1] * SC;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      if (glow) {
        ctx.strokeStyle = 'rgba(94,242,208,' + (alpha * 0.16).toFixed(3) + ')';
        ctx.lineWidth = width * 5;
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(234,254,255,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = width;
      ctx.stroke();
    };

    const A = ICON[idx], B = ICON[nxt];
    const morphing = q < 1 && idx < 6;

    for (let s = 0; s < 4; s++) {
      const pa = rs(A[s], NPT);
      const pb = rs(B[s], NPT);
      const pts = [];
      for (let i = 0; i < NPT; i++) {
        const ax = pa[i][0], ay = pa[i][1];
        const bx = pb[i][0], by = pb[i][1];
        let x = ax + (bx - ax) * e;
        let y = ay + (by - ay) * e;
        if (morphing) {
          /* 拉伸与弯曲：沿法线鼓出，幅度带各点噪声 */
          const dx = bx - ax, dy = by - ay;
          const dl = Math.hypot(dx, dy) || 1;
          const bulge = Math.sin(Math.PI * q) * (0.06 + 0.20 * hash01(s * 7.3 + i * 2.9));
          x += (-dy / dl) * bulge;
          y += (dx / dl) * bulge;
          /* 再叠一点横向拖尾，像被拉过去 */
          x += Math.sin(Math.PI * q) * 0.10 * (hash01(s * 3.1 + i * 5.7) - 0.5);
        }
        pts.push([x, y]);
      }
      drawIcon(pts, 0.92, 2.4, true);
    }

    /* 上一帧形状的残影，让“拉扯”看得见 */
    if (morphing) {
      for (let s = 0; s < 4; s++) {
        const pa = rs(A[s], NPT);
        const pts = [];
        for (let i = 0; i < NPT; i++) {
          const bulge = Math.sin(Math.PI * (1 - q)) * (0.04 + 0.10 * hash01(s * 5.1 + i * 3.3));
          pts.push([pa[i][0] + bulge * 0.10, pa[i][1] + bulge * 0.10]);
        }
        drawIcon(pts, (1 - e) * 0.22, 1.2, false);
      }
    }

    /* ---------- 年份与名称 ---------- */
    const fadeIn = smooth(0, 0.25, localT);
    ctx.textAlign = 'center';
    mono(ctx, 62, 700);
    ctx.fillStyle = 'rgba(234,254,255,' + (0.94 * fadeIn).toFixed(3) + ')';
    ctx.fillText(YEARS[idx], CX, 186);

    mono(ctx, 17, 600);
    ctx.fillStyle = 'rgba(94,242,208,' + (0.62 * fadeIn).toFixed(3) + ')';
    ctx.fillText(NAMES[idx].split('').join(String.fromCharCode(0x2009)), CX, 222);

    /* ---------- 底部时间轴 ---------- */
    const ax0 = 240, ax1 = 1680, ayy = 872;
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(94,242,208,0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax0, ayy); ctx.lineTo(ax1, ayy); ctx.stroke();

    for (let i = 0; i < 7; i++) {
      const x = ax0 + (ax1 - ax0) * (i / 6);
      const on = i <= idx;
      ctx.beginPath();
      ctx.moveTo(x, ayy - 6); ctx.lineTo(x, ayy + 6);
      ctx.strokeStyle = 'rgba(94,242,208,' + (on ? 0.7 : 0.25) + ')';
      ctx.stroke();
      mono(ctx, 12, 500);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(140,215,235,' + (on ? 0.62 : 0.24) + ')';
      ctx.fillText(YEARS[i], x, ayy + 26);
    }

    const cx2 = ax0 + (ax1 - ax0) * (uu / 6);
    ctx.beginPath();
    ctx.arc(cx2, ayy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,47,109,0.9)';
    ctx.fill();

    /* 光标到图形的牵引虚线 */
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(cx2, ayy - 8);
    ctx.lineTo(CX, CY + SC * 1.05);
    ctx.strokeStyle = 'rgba(255,47,109,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  };

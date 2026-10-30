  /* ── S13 时间轴：七件发明，线条彼此拉扯变形 ───────────────────────────── */
  MODULES['sc.timeAxis'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;

    drawBackground(ctx, t, st);

    const NPT = 128;                     /* 骨架更密，变形弧线才不显棱 */
    const CX = W / 2, CY = 462, SC = 262;

    /* ---------- 工具 ---------- */
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

    const circ = function (x, y, r, n) {
      const o = [];
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * Math.PI * 2;
        o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
      }
      return o;
    };
    const arcT = function (x, y, r, a0, a1, n) {
      const o = [];
      for (let k = 0; k <= n; k++) {
        const a = a0 + (a1 - a0) * (k / n);
        o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
      }
      return o;
    };
    const box = function (cx, cy, w, h) {
      return [[cx - w, cy - h], [cx + w, cy - h], [cx + w, cy + h], [cx - w, cy + h], [cx - w, cy - h]];
    };
    const seg = function (x1, y1, x2, y2) { return [[x1, y1], [x2, y2]]; };

    /* ---------- 骨架：参与变形的主笔画 ---------- */
    const SK = [];
    /* 0 轮子 */
    SK[0] = [
      circ(0, 0, 0.94, 44),
      circ(0, 0, 0.27, 18),
      seg(-0.94, 0, 0.94, 0),
      seg(0, -0.94, 0, 0.94)
    ];
    /* 1 杠杆：地面 + 支点 + 倾斜杆 + 砝码 */
    SK[1] = [
      seg(-1, 0.90, 1, 0.90),
      [[0, 0.90], [-0.19, 0.46], [0.19, 0.46], [0, 0.90]],
      [[-0.90, 0.34], [0.90, -0.06]],
      [[-0.97, 0.34], [-0.97, -0.10], [-0.57, -0.10], [-0.57, 0.34], [-0.97, 0.34]]
    ];
    /* 2 指南针：双环 + 菱形针 */
    SK[2] = [
      circ(0, 0, 1.0, 44),
      circ(0, 0, 0.80, 40),
      [[0, -0.76], [0.17, 0], [0, 0.76], [-0.17, 0], [0, -0.76]]
    ];
    /* 3 蒸汽机（摇臂式）：地 + A 架 + 摇臂 + 汽缸 */
    SK[3] = [
      seg(-1, 0.90, 1, 0.90),
      [[-0.20, 0.90], [0.02, -0.20], [0.24, 0.90]],
      [[-0.68, -0.30], [0.64, -0.44]],
      [[-0.80, -0.28], [-0.80, 0.24], [-0.42, 0.24], [-0.42, -0.28], [-0.80, -0.28]]
    ];
    /* 4 集成电路：封装 + 芯片 + 两条引脚带 */
    SK[4] = [
      box(0, 0, 0.82, 0.82),
      box(0, 0, 0.44, 0.44),
      [[-1.0, -0.40], [-0.82, -0.40], [-0.82, -0.16], [-1.0, -0.16]],
      [[1.0, -0.40], [0.82, -0.40], [0.82, -0.16], [1.0, -0.16]]
    ];
    /* 5 阿波罗：座舱锥 + 服务舱 + 两片尾翼 */
    SK[5] = [
      [[-0.32, -0.86], [0.32, -0.86], [0.52, 0.10], [-0.52, 0.10], [-0.32, -0.86]],
      [[-0.52, 0.10], [0.52, 0.10], [0.44, 0.48], [-0.44, 0.48], [-0.52, 0.10]],
      [[-0.44, 0.48], [-0.94, 0.86], [-0.28, 0.86]],
      [[0.44, 0.48], [0.94, 0.86], [0.28, 0.86]]
    ];
    /* 6 神经网络：三层竖列（骨架），细节层再补节点与连线 */
    SK[6] = [
      seg(-0.76, -0.62, -0.76, 0.62),
      seg(0, -0.76, 0, 0.76),
      seg(0.76, -0.62, 0.76, 0.62),
      circ(0, 0, 1.0, 44)
    ];

    /* ---------- 细节：不参与变形，落定时以高分辨率补画 ---------- */
    const DT = [];
    /* 0 轮子：8 根辐条 + 轮缘铆钉 + 轴心 */
    DT[0] = (function () {
      const o = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        o.push(seg(Math.cos(a) * 0.27, Math.sin(a) * 0.27, Math.cos(a) * 0.90, Math.sin(a) * 0.90));
      }
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        o.push(seg(Math.cos(a) * 0.88, Math.sin(a) * 0.88, Math.cos(a) * 0.94, Math.sin(a) * 0.94));
      }
      o.push(circ(0, 0, 0.075, 10));
      return o;
    })();
    /* 1 杠杆：配重球 + 转动弧 + 支点斜纹 */
    DT[1] = [
      circ(0.86, -0.20, 0.12, 14),
      arcT(0, 0.46, 0.66, Math.PI * 1.02, Math.PI * 1.86, 24),
      seg(0.08, 0.52, 0.30, 0.52),
      seg(-0.30, 0.94, -0.16, 0.94),
      seg(-0.06, 0.94, 0.08, 0.94),
      seg(0.16, 0.94, 0.30, 0.94)
    ];
    /* 2 指南针：八个方位刻度 + 轴心 + 十字 */
    DT[2] = (function () {
      const o = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        o.push(seg(Math.cos(a) * 0.80, Math.sin(a) * 0.80, Math.cos(a) * 0.96, Math.sin(a) * 0.96));
      }
      o.push(seg(-0.60, 0, -0.22, 0));
      o.push(seg(0.22, 0, 0.60, 0));
      o.push(circ(0, 0, 0.06, 10));
      return o;
    })();
    /* 3 蒸汽机：链条 + 泵体 + 蒸汽 + 摇臂轴 */
    DT[3] = (function () {
      const o = [];
      for (let k = 0; k < 4; k++) {
        const y = -0.36 + k * 0.18;
        o.push(circ(0.64, y, 0.055, 8));
      }
      o.push([[0.50, 0.36], [0.78, 0.36], [0.78, 0.66], [0.50, 0.66], [0.50, 0.36]]);
      o.push(circ(0.02, -0.24, 0.05, 8));
      o.push(arcT(-0.90, -0.48, 0.13, Math.PI * 0.8, Math.PI * 1.9, 12));
      o.push(arcT(-0.90, -0.66, 0.18, Math.PI * 0.85, Math.PI * 1.85, 12));
      o.push(arcT(-0.90, -0.86, 0.23, Math.PI * 0.9, Math.PI * 1.8, 12));
      return o;
    })();
    /* 4 集成电路：三面引脚 + 缺口 + 走线 */
    DT[4] = (function () {
      const o = [];
      for (let k = 0; k < 3; k++) {
        const y = -0.52 + k * 0.36;
        o.push([[ -1.0, y], [-0.82, y]]);
        o.push([[1.0, y], [0.82, y]]);
      }
      for (let k = 0; k < 3; k++) {
        const x = -0.44 + k * 0.44;
        o.push([[x, 0.82], [x, 1.0]]);
      }
      o.push(circ(-0.66, -0.66, 0.07, 10));
      o.push(seg(-0.44, -0.44, -0.82, -0.44));
      o.push(seg(0.44, 0.44, 0.82, 0.44));
      return o;
    })();
    /* 5 阿波罗：舷窗 + 舱门 + 天线 + 尾焰 */
    DT[5] = [
      circ(0, -0.54, 0.12, 14),
      box(0, 0.28, 0.22, 0.09),
      seg(0.10, -0.84, 0.30, -1.0),
      seg(-0.10, 0.48, -0.10, 0.70),
      seg(0.00, 0.48, 0.00, 0.74),
      seg(0.10, 0.48, 0.10, 0.70)
    ];
    /* 6 神经网络：3-4-3 全连接 + 节点菱形 */
    DT[6] = (function () {
      const o = [];
      const lay = [3, 4, 3], xs = [-0.76, 0, 0.76];
      const pos = [];
      for (let L = 0; L < 3; L++) {
        const arr = [];
        const n = lay[L];
        for (let k = 0; k < n; k++) {
          const yy = (k - (n - 1) / 2) * (1.10 / Math.max(1, n - 1)) * 2;
          arr.push([xs[L], yy]);
        }
        pos.push(arr);
      }
      for (let L = 0; L < 2; L++) {
        for (let a = 0; a < pos[L].length; a++) {
          for (let b = 0; b < pos[L + 1].length; b++) {
            o.push([[pos[L][a][0], pos[L][a][1]], [pos[L + 1][b][0], pos[L + 1][b][1]]]);
          }
        }
      }
      for (let L = 0; L < 3; L++) {
        for (let k = 0; k < pos[L].length; k++) {
          const p = pos[L][k], r = 0.10;
          o.push([[p[0], p[1] - r], [p[0] + r, p[1]], [p[0], p[1] + r], [p[0] - r, p[1]], [p[0], p[1] - r]]);
        }
      }
      return o;
    })();

    const NAMES = ['WHEEL', 'LEVER', 'COMPASS', 'STEAM ENGINE',
                   'INTEGRATED CIRCUIT', 'APOLLO', 'NEURAL NET'];
    const YEARS = ['4000 BC', '3000 BC', '1200', '1712', '1950', '1969', '2010'];

    /* ---------- 时间推进：首格放长，避开上一个镜头的垂直擦除 ---------- */
    const T = [0, 0.95, 1.40, 1.85, 2.30, 2.75, 3.20];
    const MORPH = 0.26;

    let idx = 0;
    for (let k = 0; k < 7; k++) if (localT >= T[k]) idx = k;
    const nxt = Math.min(6, idx + 1);
    const q = idx < 6 ? clamp((localT - (T[idx + 1] - MORPH)) / MORPH, 0, 1) : 0;
    const e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    const lab = (q >= 0.5 && idx < 6) ? nxt : idx;
    const morphing = q < 1 && idx < 6;
    const settle = 1 - Math.sin(Math.PI * q);

    /* ---------- 画骨架（逐点插值 + 拉伸弯曲） ---------- */
    const drawPts = function (pts, alpha, width, glow) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const x = CX + pts[i][0] * SC;
        const y = CY + pts[i][1] * SC;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      if (glow) {
        ctx.strokeStyle = 'rgba(94,242,208,' + (alpha * 0.15).toFixed(3) + ')';
        ctx.lineWidth = width * 5;
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(234,254,255,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = width;
      ctx.stroke();
    };

    /* 细节：高分辨率直接画，不参与重采样 */
    const drawDetail = function (strokes, alpha, width) {
      if (alpha <= 0.004) return;
      ctx.strokeStyle = 'rgba(234,254,255,' + alpha.toFixed(3) + ')';
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      for (let s = 0; s < strokes.length; s++) {
        const pts = strokes[s];
        ctx.beginPath();
        for (let k = 0; k < pts.length; k++) {
          const x = CX + pts[k][0] * SC;
          const y = CY + pts[k][1] * SC;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const A = SK[idx], B = SK[nxt];
    const NSTROKE = Math.max(A.length, B.length);

    for (let s = 0; s < NSTROKE; s++) {
      const sa = A[s] || A[A.length - 1];
      const sb = B[s] || B[B.length - 1];
      const pa = rs(sa, NPT);
      const pb0 = rs(sb, NPT);

      /* 循环位移对齐：取最不交叉的对应关系 */
      let bestK = 0, bestD = Infinity;
      for (let k = 0; k < NPT; k += 2) {
        let d = 0;
        for (let i = 0; i < NPT; i += 4) {
          const j = (i + k) % NPT;
          const ddx = pa[i][0] - pb0[j][0], ddy = pa[i][1] - pb0[j][1];
          d += ddx * ddx + ddy * ddy;
        }
        if (d < bestD) { bestD = d; bestK = k; }
      }
      const pb = [];
      for (let i = 0; i < NPT; i++) pb.push(pb0[(i + bestK) % NPT]);

      const pts = [];
      for (let i = 0; i < NPT; i++) {
        const ax = pa[i][0], ay = pa[i][1];
        const bx = pb[i][0], by = pb[i][1];
        let x = ax + (bx - ax) * e;
        let y = ay + (by - ay) * e;
        if (morphing) {
          const dx = bx - ax, dy = by - ay;
          const dl = Math.hypot(dx, dy) || 1;
          const th = (i / NPT) * Math.PI * 2;
          const wave = 0.5 + 0.5 * Math.sin(th * 3 + s * 1.7 + q * 2.4);
          const bulge = Math.sin(Math.PI * q) * (0.015 + 0.05 * wave);
          x += (-dy / dl) * bulge;
          y += (dx / dl) * bulge;
          x += Math.sin(Math.PI * q) * 0.03 * Math.sin(th * 5 + s * 2.3);
        }
        pts.push([x, y]);
      }
      drawPts(pts, 0.92, 2.3, true);
    }

    /* 细节随形状一同交叉淡入淡出 */
    drawDetail(DT[idx], 0.62 * (1 - e) * settle + 0.62 * (1 - settle) * 0, 1.5);
    if (idx < 6 && e > 0.001) drawDetail(DT[nxt], 0.62 * e * settle, 1.5);
    /* 落定后细节稍微提亮 */
    if (!morphing) drawDetail(DT[idx], 0.16, 1.5);

    /* 残影：上一形状的轮廓，看得见“被拉过去” */
    if (morphing) {
      for (let s = 0; s < A.length; s++) {
        const pa2 = rs(A[s], NPT);
        drawPts(pa2, (1 - e) * 0.20, 1.1, false);
      }
    }

    /* ---------- 年份与名称 ---------- */
    const fadeIn = smooth(0, 0.22, localT);
    ctx.textAlign = 'center';
    mono(ctx, 58, 700);
    ctx.fillStyle = 'rgba(234,254,255,' + (0.94 * fadeIn).toFixed(3) + ')';
    ctx.fillText(YEARS[lab], CX, 128);

    mono(ctx, 17, 600);
    ctx.fillStyle = 'rgba(94,242,208,' + (0.62 * fadeIn).toFixed(3) + ')';
    ctx.fillText(NAMES[lab].split('').join(String.fromCharCode(0x2009)), CX, 164);

    /* ---------- 底部时间轴 ---------- */
    const ax0 = 240, ax1 = 1680, ayy = 872;
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(94,242,208,0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax0, ayy); ctx.lineTo(ax1, ayy); ctx.stroke();

    for (let i = 0; i < 7; i++) {
      const x = ax0 + (ax1 - ax0) * (i / 6);
      const on = i <= lab;
      ctx.beginPath();
      ctx.moveTo(x, ayy - 6); ctx.lineTo(x, ayy + 6);
      ctx.strokeStyle = 'rgba(94,242,208,' + (on ? 0.7 : 0.25) + ')';
      ctx.stroke();
      mono(ctx, 12, 500);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(140,215,235,' + (on ? 0.62 : 0.24) + ')';
      ctx.fillText(YEARS[i], x, ayy + 26);
    }

    const cx2 = ax0 + (ax1 - ax0) * ((idx + (q >= 0.5 ? 1 : 0)) / 6);
    ctx.beginPath();
    ctx.arc(cx2, ayy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,47,109,0.9)';
    ctx.fill();

    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(cx2, ayy - 8);
    ctx.lineTo(CX, CY + SC * 1.06);
    ctx.strokeStyle = 'rgba(255,47,109,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  };


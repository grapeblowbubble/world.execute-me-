  MODULES['sc.infinityLimit'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const A  = function (a) { return 'rgba(94,242,208,' + a + ')'; };
    const Wt = function (a) { return 'rgba(234,254,255,' + a + ')'; };
    const Rd = function (a) { return 'rgba(255,47,109,' + a + ')'; };

    /* ── 坐标 ─────────────────────────────────────────────── */
    const ax0 = 300, ax1 = 1660;      /* 数学 x 从 0.45 → 14 */
    const xMin = 0.45, xMax = 14;
    const yAxis = 762;
    const yL = 430;                   /* 极限值所在的水平线 */

    const gx = function (x) { return ax0 + ((x - xMin) / (xMax - xMin)) * (ax1 - ax0); };
    const fx = function (x) { return 1 + Math.sin(3 * x) / (1 + x); };
    const gy = function (x) { return yL - (fx(x) - 1) * 300; };

    /* ── ε 与冲击时刻 ─────────────────────────────────────── */
    const T_HIT = 2.80;                       /* LIMITATIONS = 43.507 */
    const imp = localT - T_HIT;
    const hit = imp > 0 ? clamp(imp / 0.06, 0, 1) : 0;          /* 硬切 */
    const shake = imp > 0 ? Math.exp(-5.0 * imp) : 0;
    const eps0 = 0.40 * Math.pow(0.055, clamp(localT / 2.72, 0, 1));
    const eps = imp > 0 ? Math.max(0, eps0 * Math.max(0, 1 - imp * 4)) : eps0;
    const tube = eps * 300;

    /* ε 收缩的抖动给一点冲击感 */
    const jx = shake * 26 * (hash01(Math.floor(t * 60) * 1.7) - 0.5);
    const jy = shake * 18 * (hash01(Math.floor(t * 60) * 2.3 + 4) - 0.5);
    ctx.save();
    ctx.translate(jx, jy);

    /* ── ε 管（在极限线两侧收缩的带）───────────────────────── */
    if (tube > 0.6) {
      const g1 = ctx.createLinearGradient(0, yL - tube, 0, yL + tube);
      g1.addColorStop(0, A(0.00));
      g1.addColorStop(0.5, A(0.10));
      g1.addColorStop(1, A(0.00));
      ctx.fillStyle = g1;
      ctx.fillRect(ax0 - 40, yL - tube, ax1 - ax0 + 120, tube * 2);
    }

    /* ── 极限线 ───────────────────────────────────────────── */
    ctx.setLineDash([7, 9]);
    ctx.strokeStyle = imp > 0 ? Rd(0.85) : Rd(0.55);
    ctx.lineWidth = imp > 0 ? 2.4 : 1.5;
    ctx.beginPath();
    ctx.moveTo(ax0 - 40, yL);
    ctx.lineTo(ax1 + 60, yL);
    ctx.stroke();
    ctx.setLineDash([]);

    mono(ctx, 13, '');
    ctx.textAlign = 'left';
    ctx.fillStyle = Rd(0.80);
    ctx.fillText('L = 1.000', ax1 + 70, yL - 8);
    ctx.fillStyle = Wt(0.30);
    ctx.fillText('asymptote', ax1 + 70, yL + 12);

    /* ── 曲线（ε 内亮、ε 外暗）───────────────────────────── */
    const xc = (function () {
      for (let i = 0; i <= 900; i++) {
        const x = xMax - (i / 900) * (xMax - xMin);
        if (Math.abs(fx(x) - 1) > eps) return x;
      }
      return xMin;
    })();

    const drawSeg = function (xa, xb, col, lw, glow) {
      if (xb <= xa) return;
      ctx.beginPath();
      const n2 = Math.max(2, Math.round((xb - xa) * 40));
      for (let i = 0; i <= n2; i++) {
        const x = xa + (i / n2) * (xb - xa);
        const yy = gy(x);
        i ? ctx.lineTo(gx(x), yy) : ctx.moveTo(gx(x), yy);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.stroke();
      if (glow) { ctx.strokeStyle = A(0.10); ctx.lineWidth = 10; ctx.stroke(); }
    };

    drawSeg(xMin, Math.max(xMin, xc), Wt(0.16), 1.6, false);
    drawSeg(Math.max(xMin, xc), xMax, A(0.95), 2.6, true);

    /* 分界：x(ε) */
    if (xc > xMin + 0.05 && xc < xMax - 0.05 && imp <= 0) {
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = A(0.30);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx(xc), yL - 190); ctx.lineTo(gx(xc), yAxis); ctx.stroke();
      ctx.setLineDash([]);
      mono(ctx, 12, '');
      ctx.fillStyle = A(0.55);
      ctx.textAlign = 'center';
      ctx.fillText('x > ' + xc.toFixed(2), gx(xc), yL - 200);
    }

    /* ── 坐标轴与刻度 ─────────────────────────────────────── */
    ctx.strokeStyle = Wt(0.18);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax0 - 40, yAxis); ctx.lineTo(ax1 + 60, yAxis); ctx.stroke();
    mono(ctx, 11, '');
    ctx.textAlign = 'center';
    for (let x = 1; x <= 13; x++) {
      const px = gx(x);
      ctx.strokeStyle = Wt(0.14);
      ctx.beginPath(); ctx.moveTo(px, yAxis); ctx.lineTo(px, yAxis + 7); ctx.stroke();
      ctx.fillStyle = Wt(0.22);
      ctx.fillText(String(x), px, yAxis + 22);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = Wt(0.26);
    ctx.fillText('x', ax1 + 40, yAxis - 10);

    /* ── 探测点：在曲线上滑动，量出到极限线的误差 ─────────── */
    const xP = 1.4 + clamp(localT, 0, 2.8) * 3.1;
    const yP = gy(xP);
    if (imp <= 0) {
      ctx.strokeStyle = Rd(0.42);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx(xP), yP); ctx.lineTo(gx(xP), yL); ctx.stroke();
      ctx.fillStyle = Wt(0.95);
      ctx.beginPath(); ctx.arc(gx(xP), yP, 5.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Wt(0.15);
      ctx.beginPath(); ctx.arc(gx(xP), yP, 13, 0, Math.PI * 2); ctx.fill();
      mono(ctx, 12, '');
      ctx.fillStyle = Rd(0.70);
      ctx.textAlign = 'center';
      ctx.fillText('|f−L| ' + Math.abs(fx(xP) - 1).toFixed(3), gx(xP), yL + (yP < yL ? 22 : -14));
    }

    /* ── 左上：函数式 ─────────────────────────────────────── */
    ctx.textAlign = 'left';
    mono(ctx, 14, '');
    ctx.fillStyle = A(0.42);
    ctx.fillText('f(x) = 1 + sin(3x) / (1 + x)', 96, 96);
    mono(ctx, 12, '');
    ctx.fillStyle = Wt(0.24);
    ctx.fillText('lim  f(x) = 1      ε → 0  ⇒  x → ∞', 96, 118);
    ctx.fillStyle = Rd(0.55);
    ctx.fillText('ε = ' + eps.toFixed(4), 96, 148);

    /* ── 右上：放大窗 ─────────────────────────────────────── */
    ctx.save();
    const zx = 1372, zy = 96, zw = 400, zh = 208;
    ctx.strokeStyle = Wt(0.16);
    ctx.lineWidth = 1;
    ctx.strokeRect(zx + 0.5, zy + 0.5, zw, zh);
    ctx.strokeStyle = A(0.35);
    for (let k = 0; k < 4; k++) {
      const sgn = k < 2 ? 1 : -1;
      const bx2 = k % 2 ? zx + zw : zx;
      const by2 = k < 2 ? zy : zy + zh;
      ctx.beginPath();
      ctx.moveTo(bx2 + sgn * 12, by2);
      ctx.lineTo(bx2, by2);
      ctx.lineTo(bx2, by2 + (k < 2 ? 12 : -12));
      ctx.stroke();
    }
    /* 放大后的曲线：只取最后 12% 的区间，纵向放大到 ε 尺度 */
    const zx0 = xMax - (xMax - xMin) * 0.14;
    const zg = 62;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x = zx0 + (i / 160) * (xMax - zx0);
      const px = zx + 10 + (i / 160) * (zw - 20);
      const py = zy + zh / 2 - (fx(x) - 1) * zg * 6;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.strokeStyle = A(0.85);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = Rd(0.55);
    ctx.beginPath(); ctx.moveTo(zx + 10, zy + zh / 2); ctx.lineTo(zx + zw - 10, zy + zh / 2); ctx.stroke();
    ctx.setLineDash([]);
    mono(ctx, 10, '');
    ctx.fillStyle = Wt(0.35);
    ctx.textAlign = 'left';
    ctx.fillText('ZOOM ×48   x ∈ [' + zx0.toFixed(1) + ', 14]', zx + 8, zy + zh - 10);
    ctx.restore();

    /* ── 左下：误差阶梯（|f−L| 随 x 下降）─────────────────── */
    ctx.save();
    mono(ctx, 11, '');
    ctx.textAlign = 'left';
    ctx.fillStyle = Wt(0.24);
    ctx.fillText('|f − L|', 96, 250);
    for (let k = 1; k <= 10; k++) {
      const xv = 0.8 * Math.pow(1.42, k - 1);
      if (xv > xMax) break;
      const e = Math.abs(fx(xv) - 1);
      const barW = clamp(e * 190, 1, 150);
      const yy = 262 + (k - 1) * 26;
      ctx.fillStyle = A(0.10 + 0.42 * clamp(e * 2, 0, 1));
      ctx.fillRect(96, yy, barW, 9);
      ctx.fillStyle = Wt(0.22);
      ctx.fillText('x ' + xv.toFixed(2), 96 + barW + 8, yy + 9);
    }
    ctx.restore();

    /* ── 右下：数值面板 ───────────────────────────────────── */
    ctx.save();
    mono(ctx, 12, '');
    ctx.textAlign = 'right';
    const rows = [
      ['x', xP.toFixed(3), Wt(0.55)],
      ['f(x)', fx(xP).toFixed(5), A(0.85)],
      ['|f(x) − L|', Math.abs(fx(xP) - 1).toFixed(5), Rd(0.65)],
      ['ε', imp > 0 ? '0.0000' : eps.toFixed(4), imp > 0 ? Rd(0.95) : Wt(0.45)]
    ];
    for (let i = 0; i < rows.length; i++) {
      const yy = 884 + i * 26;
      ctx.fillStyle = Wt(0.26);
      ctx.fillText(rows[i][0], 1690, yy);
      ctx.fillStyle = rows[i][2];
      ctx.fillText(rows[i][1], 1860, yy);
      ctx.fillStyle = 'rgba(234,254,255,0.10)';
      ctx.fillRect(1520, yy + 7, 340, 1);
    }
    ctx.restore();
    ctx.restore();   /* 抖动 */

    /* ── LIMITATIONS：误差冲击 ────────────────────────────── */
    if (imp > 0) {
      const g2 = clamp(imp / 0.9, 0, 1);

      /* 1. 极限线炸成碎片：断开的短划向两边飞 */
      for (let k = 0; k < 26; k++) {
        const u = k / 25;
        const dir = k % 2 ? 1 : -1;
        const fly = g2 * (40 + hash01(k * 3.7) * 150);
        const seg = 18 + hash01(k * 7.1) * 26;
        const x0s = ax0 - 40 + u * (ax1 - ax0 + 100) + dir * fly;
        ctx.strokeStyle = Rd(0.75 * (1 - g2 * 0.5));
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0s, yL + (hash01(k * 5.3) - 0.5) * 26 * g2);
        ctx.lineTo(x0s + seg, yL + (hash01(k * 5.3) - 0.5) * 26 * g2);
        ctx.stroke();
      }

      /* 2. 红色骨折标记：两组互相垂直的断线 + 角标 */
      const cxh = gx(9.2), cyh = yL - 120;
      ctx.strokeStyle = Rd(0.55 * (1 - g2 * 0.35));
      ctx.lineWidth = 3;
      for (let k = 0; k < 5; k++) {
        const yy = cyh - 70 + k * 34;
        ctx.beginPath();
        ctx.moveTo(cxh - 150 + hash01(k * 2.1) * 30, yy);
        ctx.lineTo(cxh + 130 + hash01(k * 4.3) * 40, yy + (hash01(k * 6.7) - 0.5) * 16);
        ctx.stroke();
      }
      for (let k = 0; k < 4; k++) {
        const xx = cxh - 120 + k * 78;
        ctx.beginPath();
        ctx.moveTo(xx, cyh - 92);
        ctx.lineTo(xx + (hash01(k * 9.1) - 0.5) * 18, cyh + 96);
        ctx.stroke();
      }

      /* 3. 扫描红带自上而下 */
      const band = (imp * 1.7 % 1.6) * H;
      const g3 = ctx.createLinearGradient(0, band - 90, 0, band + 90);
      g3.addColorStop(0, Rd(0));
      g3.addColorStop(0.5, Rd(0.16));
      g3.addColorStop(1, Rd(0));
      ctx.fillStyle = g3;
      ctx.fillRect(0, band - 90, W, 180);

      /* 4. 把画面切成横条错位（真 · 用自身像素） */
      if (imp < 0.62) {
        const dpr = ctx.canvas.width / W;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const nS = 12;
        for (let k = 0; k < nS; k++) {
          const sh = 26;
          const sy = (yL - 240 + k * sh) ;
          if (sy < 0 || sy + sh > H) continue;
          const dx2 = (hash01(k * 3.3 + Math.floor(t * 60) * 0.7) - 0.5) * 120 * (1 - imp / 0.62);
          ctx.drawImage(ctx.canvas, 0, sy * dpr, ctx.canvas.width, sh * dpr,
            dx2 * dpr, sy * dpr, ctx.canvas.width, sh * dpr);
        }
        ctx.restore();
      }

      /* 5. 碎点：曲线化作散点 */
      ctx.fillStyle = Rd(0.55);
      for (let i = 0; i <= 70; i++) {
        const x = xMin + (i / 70) * (xMax - xMin);
        const yy = gy(x) + (hash01(i * 2.7 + Math.floor(t * 30)) - 0.5) * 26 * g2;
        ctx.fillRect(gx(x) - 1.5, yy - 1.5, 3, 3);
      }
    }
  };


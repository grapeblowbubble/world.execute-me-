  MODULES['sc.sineTangent'] = function (ctx, t, localT, cfg) {
    const { W, H, FONT } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const A = function (a) { return 'rgba(94,242,208,' + a + ')'; };
    const Wt = function (a) { return 'rgba(234,254,255,' + a + ')'; };

    /* ── 几何 ───────────────────────────────────────────── */
    const R = 136;
    const cx = 300, cy = 660;          /* 单位圆 */
    const x0 = 470, x1 = 1640;         /* SIN 展开带 */
    const amp = R;
    const lam = 300;                   /* 波长 */
    const spd = Math.PI * 2 * 0.36;    /* 0.36 转/秒 */
    const phi = t * spd;
    const s = Math.sin(phi), c = Math.cos(phi);

    const px_ = cx + R * c;            /* 圆上的点 */
    const py_ = cy - R * s;
    const sinY = py_;                  /* SIN 头的高度 = 点的 y */
    const cosX = px_;                  /* COS 的横坐标   = 点的 x */

    const yC = 236 - 44 * smooth(0, 6, localT);   /* COS 基线缓慢上移 */
    const ampC = 92;

    /* ── 单位圆 ─────────────────────────────────────────── */
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = A(0.34);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    /* 24 格刻度，每 6 格加重 */
    for (let i = 0; i < 24; i++) {
      const a2 = (i / 24) * Math.PI * 2;
      const big = i % 6 === 0;
      const l = big ? 13 : 6;
      ctx.strokeStyle = big ? Wt(0.45) : A(0.20);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a2) * (R - l), cy - Math.sin(a2) * (R - l));
      ctx.lineTo(cx + Math.cos(a2) * R, cy - Math.sin(a2) * R);
      ctx.stroke();
    }

    /* 直角三角形的两条腿：cos（横）与 sin（竖） */
    ctx.fillStyle = 'rgba(94,242,208,0.07)';
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cosX, cy); ctx.lineTo(cosX, py_); ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = Wt(0.55);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cosX, cy); ctx.stroke();   /* cos 腿 */

    ctx.strokeStyle = A(0.85);
    ctx.beginPath(); ctx.moveTo(cosX, cy); ctx.lineTo(cosX, py_); ctx.stroke(); /* sin 腿 */

    /* 半径臂 */
    ctx.strokeStyle = Wt(0.9);
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px_, py_); ctx.stroke();

    /* 圆心 + 动点 */
    ctx.fillStyle = Wt(0.9);
    ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(234,254,255,0.16)';
    ctx.beginPath(); ctx.arc(px_, py_, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Wt(1);
    ctx.beginPath(); ctx.arc(px_, py_, 4.4, 0, Math.PI * 2); ctx.fill();

    /* 内嵌的数字：φ */
    mono(ctx, 13, 500);
    ctx.fillStyle = A(0.55);
    ctx.textAlign = 'left';
    ctx.fillText('φ ' + phi.toFixed(3) + ' rad   ' + ((phi * 180 / Math.PI) % 360).toFixed(1) + '°',
      cx - R, cy + R + 34);
    ctx.fillStyle = Wt(0.42);
    ctx.fillText('r = 1.000', cx - R, cy + R + 54);
    ctx.restore();

    /* ── SIN 展开带 ─────────────────────────────────────── */
    ctx.save();
    /* 基线 + 上下 ±1 参考线 */
    ctx.strokeStyle = A(0.13);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = A(0.10);
    ctx.beginPath(); ctx.moveTo(x0, cy - amp); ctx.lineTo(x1, cy - amp); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, cy + amp); ctx.lineTo(x1, cy + amp); ctx.stroke();
    ctx.setLineDash([]);

    const n = 260;
    const wave = function (yy, col, lw, glow) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * (i / n);
        const ph = phi - ((x1 - x) / lam) * Math.PI * 2;
        pts.push([x, yy(x, ph)]);
      }
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.stroke();
      if (glow) {
        ctx.strokeStyle = A(0.14);
        ctx.lineWidth = 10;
        ctx.stroke();
      }
    };

    wave(function (x, ph) { return cy - amp * Math.sin(ph); }, A(0.92), 2.4, true);

    /* 头部：动点 → 波头的水平虚线 + 波头 */
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = Wt(0.30);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px_, py_); ctx.lineTo(x1, sinY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = Wt(1);
    ctx.beginPath(); ctx.arc(x1, sinY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = A(0.18);
    ctx.beginPath(); ctx.arc(x1, sinY, 14, 0, Math.PI * 2); ctx.fill();

    mono(ctx, 13, 500);
    ctx.fillStyle = A(0.55);
    ctx.textAlign = 'left';
    ctx.fillText('SIN θ   amp 1.00   λ ' + lam + ' px', x0, cy + amp + 40);
    ctx.restore();

    /* ── COS 带（在上方，不断向上延伸）─────────────────── */
    ctx.save();
    ctx.strokeStyle = Wt(0.10);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 7]);
    ctx.beginPath(); ctx.moveTo(x0, yC); ctx.lineTo(x1, yC); ctx.stroke();
    ctx.setLineDash([]);

    wave(function (x, ph) { return yC - ampC * Math.cos(ph); }, Wt(0.62), 2.0, false);

    /* 把 COS 高度竖直地“顶”出去：头部光柱一路向上 */
    const barH = Math.abs(c) * (150 + 30 * Math.sin(t * 1.7));
    const dir = c >= 0 ? -1 : 1;
    const g1 = ctx.createLinearGradient(0, yC, 0, yC + dir * barH);
    g1.addColorStop(0, Wt(0.55));
    g1.addColorStop(1, Wt(0));
    ctx.fillStyle = g1;
    ctx.fillRect(x1 - 3, Math.min(yC, yC + dir * barH), 6, Math.abs(barH));

    ctx.fillStyle = Wt(0.95);
    ctx.beginPath(); ctx.arc(x1, yC - ampC * c, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Wt(0.15);
    ctx.beginPath(); ctx.arc(x1, yC - ampC * c, 12, 0, Math.PI * 2); ctx.fill();

    /* 圆上动点 → 上方 COS 的竖直引导线 */
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(234,254,255,0.20)';
    ctx.beginPath(); ctx.moveTo(cosX, cy); ctx.lineTo(cosX, yC - ampC * c); ctx.stroke();
    ctx.setLineDash([]);

    mono(ctx, 13, 500);
    ctx.fillStyle = Wt(0.45);
    ctx.textAlign = 'left';
    ctx.fillText('COS θ   phase +π/2   extends upward', x0, yC - ampC - 22);
    ctx.restore();

    /* ── 右上相位盘 ─────────────────────────────────────── */
    ctx.save();
    const dx = 1700, dy = 236, dr = 62;
    ctx.strokeStyle = A(0.30);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = A(0.12);
    ctx.beginPath(); ctx.arc(dx, dy, dr * 0.62, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a3 = (i / 12) * Math.PI * 2;
      ctx.strokeStyle = A(0.22);
      ctx.beginPath();
      ctx.moveTo(dx + Math.cos(a3) * (dr - 8), dy - Math.sin(a3) * (dr - 8));
      ctx.lineTo(dx + Math.cos(a3) * dr, dy - Math.sin(a3) * dr);
      ctx.stroke();
    }
    ctx.strokeStyle = Wt(0.9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(phi) * dr, dy - Math.sin(phi) * dr); ctx.stroke();
    ctx.fillStyle = Wt(0.9);
    ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();
    mono(ctx, 11, 500);
    ctx.fillStyle = A(0.45);
    ctx.textAlign = 'center';
    ctx.fillText('PHASE', dx, dy + dr + 22);
    ctx.restore();

    /* ── 右上数据 ───────────────────────────────────────── */
    ctx.save();
    mono(ctx, 14, 500);
    ctx.textAlign = 'right';
    const rows = [
      ['sin θ', s.toFixed(4), A(0.85)],
      ['cos θ', c.toFixed(4), Wt(0.70)],
      ['sin²+cos²', (s * s + c * c).toFixed(4), A(0.45)],
      ['ω', '2.262 rad/s', Wt(0.35)]
    ];
    for (let i = 0; i < rows.length; i++) {
      const y = 132 + i * 26;
      ctx.fillStyle = Wt(0.30);
      ctx.fillText(rows[i][0], 1884, y);
      ctx.fillStyle = rows[i][2];
      ctx.fillText(rows[i][1], 1884, y + 0);
      ctx.fillStyle = 'rgba(234,254,255,0.20)';
      ctx.fillRect(1700, y + 6, 184, 1);
    }
    /* sin/cos 数值横条 */
    ctx.restore();

    /* ── 底部谐波条 ─────────────────────────────────────── */
    ctx.save();
    const bx0 = 470, bx1 = 1640, by = 950, bh = 62;
    mono(ctx, 12, 500);
    ctx.textAlign = 'left';
    ctx.fillStyle = A(0.32);
    ctx.fillText('HARMONICS  |sin kθ| / k', bx0, by - 14);
    for (let i2 = 0; i2 < 12; i2++) {
      const k = i2 + 1;
      const v = Math.abs(Math.sin(k * phi)) / (1 + k * 0.26);
      const bw = (bx1 - bx0) / 12 - 8;
      const x = bx0 + i2 * ((bx1 - bx0) / 12);
      ctx.fillStyle = 'rgba(94,242,208,' + (0.10 + v * 0.62).toFixed(3) + ')';
      ctx.fillRect(x, by + bh - v * bh, bw, v * bh);
      ctx.strokeStyle = A(0.12);
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, by + 0.5, bw - 1, bh - 1);
    }
    ctx.restore();

    /* ── 左上标题 ───────────────────────────────────────── */
    ctx.save();
    mono(ctx, 13, 500);
    ctx.textAlign = 'left';
    ctx.fillStyle = A(0.42);
    ctx.fillText('UNIT CIRCLE → SIN → COS', 96, 96);
    ctx.fillStyle = Wt(0.22);
    ctx.fillText('sin²θ + cos²θ = 1  ·  every point on the circle is a phase', 96, 118);
    ctx.restore();
  };


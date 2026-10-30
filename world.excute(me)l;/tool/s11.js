  MODULES['sc.circuit'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const A  = function (a) { return 'rgba(94,242,208,' + a + ')'; };
    const Wt = function (a) { return 'rgba(234,254,255,' + a + ')'; };
    const Rd = function (a) { return 'rgba(255,47,109,' + a + ')'; };
    const Bl = function (a) { return 'rgba(47,107,255,' + a + ')'; };

    /* ── 时间与相位 ───────────────────────────────────────── */
    const hz   = 0.55;                       /* 视觉化后的交流频率 */
    const phi  = localT * Math.PI * 2 * hz;
    const pol  = Math.sin(phi);              /* >0 正半周 */
    const onA  = clamp(pol * 3, 0, 1);       /* 正半周导通度 */
    const onB  = clamp(-pol * 3, 0, 1);
    const flow = (localT * 1.35) % 1;        /* 电流沿导线流动的相位 */

    /* ── 节点坐标 ─────────────────────────────────────────── */
    const srcX = 250, srcY = 486, srcR = 54;  /* 交流源 */
    const tx = 760, tyT = 356, tyB = 620;     /* 桥：上/下顶点 */
    const tyL = 620, tyR = 352;               /* 左/右顶点（占位，下面重算） */
    const bx = 760;
    const Tn = [bx, 356], Bn = [bx, 620], Ln = [bx - 140, 488], Rn = [bx + 140, 488];
    const railT = 286, railB = 700;
    const capX = 1250, loadX = 1560;

    /* 连线折线（每段用同一套采样，颜色按弧长扫） */
    const P = function (arr) { return arr; };
    const wireAC1 = P([[srcX, srcY - srcR], [srcX, 356], [bx, 356]]);            /* 源上端子 → T */
    const wireAC2 = P([[srcX, srcY + srcR], [srcX, 620], [bx, 620]]);            /* 源下端子 → B */
    const wirePlus = P([Ln, [bx - 240, 488], [bx - 240, railT], [loadX, railT]]); /* L → 上母线 */
    const wireMinus = P([Rn, [bx + 240, 488], [bx + 240, railB], [loadX, railB]]);/* R → 下母线 */
    const wireLoad = P([[loadX, railT], [loadX, railB]]);                        /* 负载 */
    const wireCap  = P([[capX, railT], [capX, railB]]);                          /* 电容 */

    /* ── 导线：底色 + 流动的蓝→红渐变 ──────────────────────── */
    const strokePath = function (pts) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1])
                                            : ctx.moveTo(pts[i][0], pts[i][1]);
    };

    const lerpC = function (a, b, u) {
      return [Math.round(a[0] + (b[0] - a[0]) * u),
              Math.round(a[1] + (b[1] - a[1]) * u),
              Math.round(a[2] + (b[2] - a[2]) * u)];
    };
    const BLUE = [47, 107, 255], RED = [255, 47, 109], MINT = [94, 242, 208];

    /* 沿折线按弧长画渐变段，u = (flow - s/LEN) mod 1 决定蓝→红 */
    const flowWire = function (pts, alpha, c0, c1, width) {
      const segs = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        const L2 = Math.hypot(dx, dy);
        segs.push({ x: pts[i - 1][0], y: pts[i - 1][1], dx: dx / L2, dy: dy / L2, L: L2, s0: total });
        total += L2;
      }
      ctx.lineCap = 'butt';
      for (const sg of segs) {
        const n2 = Math.max(1, Math.round(sg.L / 7));
        for (let k = 0; k < n2; k++) {
          const s0 = sg.s0 + (k / n2) * sg.L;
          const sl = sg.L / n2;
          let u = (flow - s0 / total) % 1;
          if (u < 0) u += 1;
          const c = lerpC(c0, c1, u);
          ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(sg.x + sg.dx * (s0 - sg.s0), sg.y + sg.dy * (s0 - sg.s0));
          ctx.lineTo(sg.x + sg.dx * (s0 - sg.s0 + sl), sg.y + sg.dy * (s0 - sg.s0 + sl));
          ctx.stroke();
        }
      }
    };

    const allWires = [wireAC1, wireAC2, wirePlus, wireMinus, wireLoad, wireCap];

    /* 暗底 */
    ctx.lineCap = 'round';
    for (const wp of allWires) {
      strokePath(wp);
      ctx.strokeStyle = 'rgba(140,170,200,0.16)';
      ctx.lineWidth = 5.5;
      ctx.stroke();
      ctx.strokeStyle = A(0.10);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* 流动渐变：交流段随半周换向，直流段始终同一方向 */
    flowWire(wireAC1, 0.85, pol > 0 ? BLUE : RED, pol > 0 ? RED : BLUE, 3.2);
    flowWire(wireAC2, 0.85, pol > 0 ? RED : BLUE, pol > 0 ? BLUE : RED, 3.2);
    flowWire(wirePlus, 0.95, BLUE, RED, 3.6);
    flowWire(wireMinus, 0.95, RED, BLUE, 3.6);
    flowWire(wireLoad, 0.95, BLUE, RED, 3.6);
    flowWire(wireCap, 0.55, BLUE, RED, 2.4);

    /* 沿导线的流光小点（强化“在流动”） */
    for (const wp of allWires) {
      let total = 0;
      for (let i = 1; i < wp.length; i++) total += Math.hypot(wp[i][0] - wp[i - 1][0], wp[i][1] - wp[i - 1][1]);
      for (let k = 0; k < 3; k++) {
        let u = (flow * 1.0 + k / 3) % 1;
        let s = u * total, acc = 0, px = wp[0][0], py = wp[0][1];
        for (let i = 1; i < wp.length; i++) {
          const L2 = Math.hypot(wp[i][0] - wp[i - 1][0], wp[i][1] - wp[i - 1][1]);
          if (s <= acc + L2) {
            const f = (s - acc) / L2;
            px = wp[i - 1][0] + (wp[i][0] - wp[i - 1][0]) * f;
            py = wp[i - 1][1] + (wp[i][1] - wp[i - 1][1]) * f;
            break;
          }
          acc += L2;
        }
        ctx.fillStyle = Wt(0.55);
        ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = Wt(0.10);
        ctx.beginPath(); ctx.arc(px, py, 7.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* ── 交流源 ───────────────────────────────────────────── */
    ctx.beginPath();
    ctx.arc(srcX, srcY, srcR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,14,24,0.80)';
    ctx.fill();
    ctx.strokeStyle = Wt(0.30);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    /* 圆内一根随相位摆动的弦 */
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const xx = srcX - srcR * 0.62 + (i / 48) * srcR * 1.24;
      const yy = srcY - Math.sin(phi - (i / 48) * Math.PI * 2) * 20;
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.strokeStyle = pol > 0 ? A(0.95) : Rd(0.75);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    mono(ctx, 11, '');
    ctx.textAlign = 'center';
    ctx.fillStyle = Wt(0.34);
    ctx.fillText('AC', srcX, srcY + srcR + 22);
    ctx.fillStyle = pol > 0 ? A(0.70) : Rd(0.55);
    ctx.fillText((pol > 0 ? '+' : '−') + ' ' + Math.abs(Math.sin(phi)).toFixed(2), srcX, srcY - srcR - 12);

    /* ── 整流桥：四点 + 四个二极管 ─────────────────────────── */
    const diode = function (x1, y1, x2, y2, lit) {
      const dx = x2 - x1, dy = y2 - y1, L2 = Math.hypot(dx, dy);
      const ux = dx / L2, uy = dy / L2;
      const mx = x1 + dx * 0.5, my = y1 + dy * 0.5;
      const s2 = 17;
      /* 三角 */
      ctx.beginPath();
      ctx.moveTo(mx - ux * s2, my - uy * s2);
      ctx.lineTo(mx - uy * s2 * 1.15, my + ux * s2 * 1.15);
      ctx.lineTo(mx + uy * s2 * 1.15, my - ux * s2 * 1.15);
      ctx.closePath();
      ctx.fillStyle = lit ? A(0.85) : 'rgba(150,180,205,0.20)';
      ctx.fill();
      /* 阴极横杠 */
      ctx.beginPath();
      ctx.moveTo(mx + ux * s2 * 0.55 - uy * s2 * 1.15, my + uy * s2 * 0.55 + ux * s2 * 1.15);
      ctx.lineTo(mx + ux * s2 * 0.55 + uy * s2 * 1.15, my + uy * s2 * 0.55 - ux * s2 * 1.15);
      ctx.strokeStyle = lit ? A(0.95) : 'rgba(150,180,205,0.28)';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      if (lit) {
        ctx.beginPath();
        ctx.arc(mx, my, 26, 0, Math.PI * 2);
        ctx.fillStyle = A(0.10);
        ctx.fill();
      }
    };

    /* 桥的四条边：T-L / T-R / R-B / B-L */
    const edges = [
      [Tn, Rn, onA],   /* 正半周：T→R 导通 */
      [Bn, Ln, onA],   /* 正半周：B→L 导通 */
      [Tn, Ln, onB],   /* 负半周：T→L 导通 */
      [Bn, Rn, onB]    /* 负半周：B→R 导通 */
    ];
    for (const e2 of edges) {
      ctx.beginPath();
      ctx.moveTo(e2[0][0], e2[0][1]);
      ctx.lineTo(e2[1][0], e2[1][1]);
      ctx.strokeStyle = e2[2] > 0.5 ? A(0.10 + 0.35 * e2[2]) : 'rgba(150,180,205,0.14)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    diode(Tn[0], Tn[1], Rn[0], Rn[1], onA > 0.5);
    diode(Bn[0], Bn[1], Ln[0], Ln[1], onA > 0.5);
    diode(Tn[0], Tn[1], Ln[0], Ln[1], onB > 0.5);
    diode(Bn[0], Bn[1], Rn[0], Rn[1], onB > 0.5);

    /* 四个顶点小方块 */
    for (const v of [Tn, Bn, Ln, Rn]) {
      ctx.fillStyle = Wt(0.55);
      ctx.fillRect(v[0] - 3.5, v[1] - 3.5, 7, 7);
    }
    mono(ctx, 11, '');
    ctx.fillStyle = Wt(0.30);
    ctx.textAlign = 'center';
    ctx.fillText('BRIDGE  D1–D4', bx, tyB + 42);

    /* ── 电容（两条平行板 + 极性标记）─────────────────────── */
    const capMid = (railT + railB) / 2;
    ctx.strokeStyle = Wt(0.42);
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(capX - 26, capMid - 16); ctx.lineTo(capX + 26, capMid - 16); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(capX - 26, capMid + 16); ctx.lineTo(capX + 26, capMid + 16); ctx.stroke();
    ctx.strokeStyle = A(0.35);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(capX - 26, capMid - 16); ctx.lineTo(capX + 26, capMid - 16); ctx.stroke();
    mono(ctx, 10, '');
    ctx.fillStyle = Wt(0.28);
    ctx.fillText('FILTER', capX, railB + 22);
    ctx.fillText('4700 µF', capX, railB + 38);

    /* ── 负载电阻：锯齿 ───────────────────────────────────── */
    const rz = 6;
    const rTop = capMid - 60, rBot = capMid + 60;
    ctx.strokeStyle = Wt(0.42);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(loadX, rTop);
    for (let i = 0; i < 7; i++) {
      const yy = rTop + (i + 0.5) * ((rBot - rTop) / 7);
      ctx.lineTo(loadX + (i % 2 ? rz : -rz), yy);
    }
    ctx.lineTo(loadX, rBot);
    ctx.stroke();
    mono(ctx, 10, '');
    ctx.fillStyle = Wt(0.28);
    ctx.fillText('LOAD', loadX, railB + 22);
    ctx.fillText('1 kΩ', loadX, railB + 38);

    /* ── 左上：输出纹波示波器 ─────────────────────────────── */
    const sx = 110, sy = 92, sw = 400, sh = 168;
    ctx.strokeStyle = Wt(0.16);
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, sw, sh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();
    /* 全波整流 + 电容滤波：|sin| 用指数放电抹平 */
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const u = i / 200;
      const ph = (localT * 2.6 + u * 3.2) * Math.PI * 2;
      const raw = Math.abs(Math.sin(ph));
      const v = 0.62 + 0.38 * Math.pow(raw, 0.55);
      const px = sx + 10 + u * (sw - 20);
      const py = sy + sh - 22 - v * (sh - 60);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.strokeStyle = A(0.90);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = A(0.12);
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
    mono(ctx, 10, '');
    ctx.textAlign = 'left';
    ctx.fillStyle = Wt(0.34);
    ctx.fillText('V_OUT  ·  ripple', sx + 8, sy + 14);
    ctx.fillStyle = A(0.55);
    ctx.fillText('DC 0.94', sx + 8, sy + sh - 6);

    /* ── 左下：电路说明 ───────────────────────────────────── */
    ctx.textAlign = 'left';
    mono(ctx, 13, '');
    ctx.fillStyle = A(0.42);
    ctx.fillText('AC  →  BRIDGE  →  FILTER  →  DC', 96, 300);
    mono(ctx, 11, '');
    ctx.fillStyle = Wt(0.26);
    ctx.fillText('full-wave rectification · 4 diodes · ' + (pol > 0 ? 'positive half' : 'negative half'), 96, 322);

    /* ── 右下：读数 ───────────────────────────────────────── */
    ctx.save();
    mono(ctx, 12, '');
    ctx.textAlign = 'right';
    const rows = [
      ['V_in', (Math.sin(phi) * 1.00).toFixed(3) + ' pu', pol > 0 ? A(0.85) : Rd(0.75)],
      ['V_dc', '0.940 pu', Wt(0.55)],
      ['ripple', '4.2 %', Wt(0.40)],
      ['conduction', pol > 0 ? 'D1 · D3' : 'D2 · D4', A(0.70)]
    ];
    for (let i = 0; i < rows.length; i++) {
      const yy = 792 + i * 26;
      ctx.fillStyle = Wt(0.26);
      ctx.fillText(rows[i][0], 1690, yy);
      ctx.fillStyle = rows[i][2];
      ctx.fillText(rows[i][1], 1860, yy);
      ctx.fillStyle = 'rgba(234,254,255,0.10)';
      ctx.fillRect(1520, yy + 7, 340, 1);
    }
    ctx.restore();

    /* ── 电流方向箭头（在负载上，始终向下 = 直流）───────────── */
    const ay = capMid + 90 + 26 * Math.sin(phi);
    ctx.fillStyle = A(0.55);
    ctx.beginPath();
    ctx.moveTo(loadX + 34, ay - 8);
    ctx.lineTo(loadX + 34, ay + 8);
    ctx.lineTo(loadX + 44, ay);
    ctx.closePath();
    ctx.fill();
  };


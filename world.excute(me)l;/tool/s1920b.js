  /* ── S19 茄子 · 营养成分键线式（科幻标本扫描）────────────────────────── */
  MODULES['sc.bioEggplant'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const cx = 900, cy = 418;
    const bodyH = 472, bodyW = 168;

    const appear = smooth(0.05, 0.55, localT);
    const scanU = (localT * 0.42) % 1;
    const scanY = cy - bodyH / 2 + scanU * bodyH;

    const poly = function (pts, close, w, col) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      if (close) ctx.closePath();
      ctx.strokeStyle = col || 'rgba(234,254,255,0.86)';
      ctx.lineWidth = w || 1.6;
      ctx.stroke();
    };
    const dot = function (x, y, r, a) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(234,254,255,' + a.toFixed(3) + ')';
      ctx.fill();
    };

    /* ---------- 样本本体：线描茄子 ---------- */
    const widthAt = function (v) {
      const s = Math.pow(Math.sin(Math.PI * (0.09 + v * 0.82)), 0.78);
      return bodyW * s * (0.56 + 0.58 * v);
    };
    const edge = function (v, side, k) {
      const y = cy - bodyH / 2 + v * bodyH;
      return [cx + side * widthAt(v) * (k === undefined ? 1 : k), y];
    };

    ctx.globalAlpha = appear;
    const right = [], left = [];
    for (let i = 0; i <= 60; i++) {
      const v = i / 60;
      right.push(edge(v, 1));
      left.unshift(edge(v, -1));
    }
    poly(right, false, 2.0, 'rgba(234,254,255,0.88)');
    poly(left, false, 2.0, 'rgba(234,254,255,0.88)');

    for (let k = 1; k <= 2; k++) {
      const sc = k === 1 ? 0.74 : 0.46;
      const r2 = [], l2 = [];
      for (let i = 0; i <= 48; i++) {
        const v = 0.06 + (i / 48) * 0.86;
        r2.push(edge(v, 1, sc));
        l2.unshift(edge(v, -1, sc));
      }
      poly(r2, false, 1.0, 'rgba(94,242,208,' + (0.34 - k * 0.08).toFixed(3) + ')');
      poly(l2, false, 1.0, 'rgba(94,242,208,' + (0.34 - k * 0.08).toFixed(3) + ')');
    }
    for (let i = 1; i < 9; i++) {
      const v = i / 9;
      poly([edge(v, 1, 0.74), edge(v, -1, 0.74)], false, 0.8, 'rgba(94,242,208,0.16)');
    }
    for (let i = 0; i < 26; i++) {
      const v = 0.24 + hash01(i * 3.7) * 0.66;
      const off = (hash01(i * 8.1) - 0.5) * 1.5;
      const p = edge(v, off > 0 ? 1 : -1, Math.min(0.62, Math.abs(off)));
      dot(p[0], p[1], 2.2, 0.42);
    }
    const topY = cy - bodyH / 2;
    poly([[cx - 10, topY + 8], [cx - 6, topY - 34], [cx + 4, topY - 58], [cx + 12, topY - 34], [cx + 12, topY + 6]],
          false, 2.0, 'rgba(234,254,255,0.82)');
    for (let k = -2; k <= 2; k++) {
      poly([[cx + k * 26, topY + 18], [cx + k * 40, topY - 6], [cx + k * 18, topY + 2]],
            false, 1.2, 'rgba(94,242,208,0.62)');
    }

    const vScan = clamp((scanY - (cy - bodyH / 2)) / bodyH, 0, 1);
    const wScan = widthAt(vScan) + 6;
    const bandTop = scanY - 54;
    const g = ctx.createLinearGradient(0, bandTop, 0, scanY + 2);
    g.addColorStop(0, 'rgba(94,242,208,0)');
    g.addColorStop(0.8, 'rgba(94,242,208,0.12)');
    g.addColorStop(1, 'rgba(234,254,255,0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - wScan, bandTop, wScan * 2, 54);
    ctx.strokeStyle = 'rgba(234,254,255,0.80)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - wScan, scanY);
    ctx.lineTo(cx + wScan, scanY);
    ctx.stroke();

    /* 尺寸标注 */
    ctx.strokeStyle = 'rgba(140,215,235,0.34)';
    ctx.lineWidth = 1;
    const dx = cx - bodyW - 126;
    ctx.beginPath();
    ctx.moveTo(dx, cy - bodyH / 2); ctx.lineTo(dx, cy + bodyH / 2);
    ctx.moveTo(dx - 8, cy - bodyH / 2); ctx.lineTo(dx + 8, cy - bodyH / 2);
    ctx.moveTo(dx - 8, cy + bodyH / 2); ctx.lineTo(dx + 8, cy + bodyH / 2);
    ctx.stroke();
    mono(ctx, 12, 600);
    ctx.fillStyle = 'rgba(140,215,235,0.50)';
    ctx.textAlign = 'right';
    ctx.fillText('184 mm', dx - 16, cy + 4);
    ctx.textAlign = 'left';

    /* 旋转准星 */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(localT * 0.22);
    ctx.strokeStyle = 'rgba(94,242,208,0.16)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const a0 = (k / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, bodyW + 96, a0, a0 + 0.42);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    /* ---------- 键线式：绘图基元（局部单位 = 1 根键长） ---------- */
    const painter = function (mx, my, b, a) {
      const X = (u) => mx + u * b, Y = (v) => my + v * b;
      const seg = function (p, q, w, al) {
        ctx.beginPath();
        ctx.moveTo(X(p[0]), Y(p[1]));
        ctx.lineTo(X(q[0]), Y(q[1]));
        ctx.strokeStyle = 'rgba(234,254,255,' + (al === undefined ? 0.82 * a : al * a).toFixed(3) + ')';
        ctx.lineWidth = w || 1.8;
        ctx.stroke();
      };
      const dbl = function (p, q) {
        seg(p, q);
        const x1 = X(p[0]), y1 = Y(p[1]), x2 = X(q[0]), y2 = Y(q[1]);
        const vx = x2 - x1, vy = y2 - y1, L = Math.hypot(vx, vy) || 1;
        const nx = -vy / L * 3.3, ny = vx / L * 3.3;
        ctx.beginPath();
        ctx.moveTo(x1 + vx * 0.20 + nx, y1 + vy * 0.20 + ny);
        ctx.lineTo(x1 + vx * 0.80 + nx, y1 + vy * 0.80 + ny);
        ctx.strokeStyle = 'rgba(234,254,255,' + (0.78 * a).toFixed(3) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };
      const txt = function (p, s2, align, size) {
        mono(ctx, size || 11, 700);
        ctx.fillStyle = 'rgba(94,242,208,' + (0.88 * a).toFixed(3) + ')';
        ctx.textAlign = align || 'center';
        ctx.fillText(s2, X(p[0]), Y(p[1]));
        ctx.textAlign = 'left';
      };
      return { seg, dbl, txt };
    };

    /* ---------- 维生素 C：L-抗坏血酸（呋喃-2-酮 + 2,3-烯二醇） ---------- */
    const drawC = function (mx, my, b, a) {
      const P = painter(mx, my, b, a);
      const O1 = [0.00, -0.46], C2 = [0.437, -0.142], C3 = [0.270, 0.372],
            C4 = [-0.270, 0.372], C5 = [-0.437, -0.142];
      P.seg(O1, C2); P.seg(C2, C3); P.dbl(C3, C4); P.seg(C4, C5); P.seg(C5, O1);
      P.dbl(C2, [0.80, -0.25]);                    /* C2 = O */
      P.txt([0.90, -0.16], 'O', 'left');
      P.seg(C3, [0.48, 0.66]);  P.txt([0.52, 0.84], 'OH', 'center');
      P.seg(C4, [-0.48, 0.66]); P.txt([-0.52, 0.84], 'HO', 'center');
      /* C5 上的 -CH(OH)-CH2OH */
      const C6 = [-0.80, -0.34];
      P.seg(C5, C6);
      P.seg(C6, [-0.68, -0.70]); P.txt([-0.66, -0.88], 'OH', 'center');
      const C7 = [-1.14, -0.20];
      P.seg(C6, C7);
      P.seg(C7, [-1.34, -0.52]); P.txt([-1.40, -0.68], 'OH', 'center');
      for (let i = 0; i < 5; i++) P.seg(i === 0 ? O1 : [0, 0], [0, 0], 0.01, 0);
    };

    /* ---------- 维生素 E：α-生育酚（色满环 + 植基侧链） ---------- */
    const drawE = function (mx, my, b, a) {
      const P = painter(mx, my, b, a);
      /* 苯环（六边形，右侧为稠合边） */
      const V = [];
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 180) * (30 + k * 60);
        V.push([-0.50 + Math.cos(ang) * 0.42, Math.sin(ang) * 0.42]);
      }
      for (let k = 0; k < 6; k++) P.seg(V[k], V[(k + 1) % 6]);
      /* 芳香内线（三条，朝环心） */
      for (let k = 0; k < 6; k += 2) {
        const p = V[k], q = V[(k + 1) % 6];
        const x1 = mx + p[0] * b, y1 = my + p[1] * b;
        const x2 = mx + q[0] * b, y2 = my + q[1] * b;
        const vx = x2 - x1, vy = y2 - y1, L = Math.hypot(vx, vy) || 1;
        let nx = -vy / L, ny = vx / L;
        const cxm = mx - 0.50 * b, cym = my;
        if ((x1 + x2) / 2 - cxm > 0 ? nx > 0 : nx < 0) { nx = -nx; ny = -ny; }
        ctx.beginPath();
        ctx.moveTo(x1 + vx * 0.18 + nx * 4.4, y1 + vy * 0.18 + ny * 4.4);
        ctx.lineTo(x1 + vx * 0.82 + nx * 4.4, y1 + vy * 0.82 + ny * 4.4);
        ctx.strokeStyle = 'rgba(234,254,255,' + (0.62 * a).toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      /* 吡喃环（共用 V[5]、V[0] 这条竖边） */
      const C8a = V[0], C4a = V[5];
      const O1 = [0.20, 0.42], C2 = [0.52, 0.21], C3 = [0.52, -0.21], C4 = [0.20, -0.42];
      P.seg(C8a, O1); P.seg(O1, C2); P.seg(C2, C3); P.seg(C3, C4); P.seg(C4, C4a);
      P.txt([0.10, 0.56], 'O', 'center');
      /* 苯环上的取代：5-甲基 / 6-羟基 / 7-甲基 / 8-甲基 */
      P.seg(V[4], [-0.50, -0.80]);
      P.seg(V[3], [-1.20, -0.34]); P.txt([-1.30, -0.36], 'HO', 'right');
      P.seg(V[2], [-1.16, 0.44]);  P.txt([-1.26, 0.58], 'CH3', 'center', 10);
      P.seg(V[1], [-0.50, 0.80]);  P.txt([-0.50, 0.96], 'CH3', 'center', 10);
      /* C2 上的甲基 */
      P.seg(C2, [0.52, 0.58]); P.txt([0.52, 0.74], 'CH3', 'center', 10);
      /* 植基侧链：13 个碳，4/8/12 位带甲基 */
      let px = C2[0], py = C2[1];
      const CH = [1.58, 2.62, 3.66];
      const nodes = [C2];
      for (let i = 1; i <= 13; i++) {
        px += 0.26;
        py = (i % 2 === 0) ? 0.02 : 0.21;
        nodes.push([px, py]);
      }
      for (let i = 0; i < nodes.length - 1; i++) P.seg(nodes[i], nodes[i + 1]);
      for (let k = 0; k < 3; k++) {
        const node = nodes[4 + k * 4];
        P.seg(node, [node[0], node[1] - 0.34]);
      }
    };

    /* ---------- 脂肪：甘油三酯 ---------- */
    const drawFat = function (mx, my, b, a) {
      const P = painter(mx, my, b, a);
      const rows = [-0.62, 0, 0.62];
      for (let r = 0; r < 3; r++) {
        const y = rows[r];
        const Cg = [-1.02, y];
        P.seg(Cg, [-0.66, y]);
        P.seg([-0.66, y], [-0.44, y]);          /* C-O */
        P.txt([-0.55, y - 0.16], 'O', 'center', 10);
        /* 羰基碳 */
        P.dbl([-0.44, y], [-0.16, y]);
        const sgn = r === 0 ? -1 : 1;
        P.dbl([-0.30, y], [-0.30, y + 0.34 * sgn]);
        P.txt([-0.30, y + 0.50 * sgn], 'O', 'center', 10);
      }
      /* 甘油骨架：三条链的连接 */
      P.seg([-1.02, -0.62], [-1.02, 0.62]);
      P.seg([-1.02, -0.62], [-1.34, -0.86]);
      P.seg([-1.02, 0.62], [-1.34, 0.86]);
      /* 三条脂肪酸链 */
      const lens = [7, 5, 6];
      for (let r = 0; r < 3; r++) {
        let x = -0.16, y = rows[r];
        const up = r === 0 ? -1 : 1;
        for (let i = 0; i < lens[r]; i++) {
          const nx = x + 0.26;
          const ny = y + (i % 2 === 0 ? 0.17 * up : -0.17 * up) * (r === 1 ? 0.6 : 1);
          P.seg([x, y], [nx, ny]);
          x = nx; y = ny;
        }
      }
    };

    /* ---------- 维生素 B12：咕啉环 + 核苷酸环（拓扑示意） ---------- */
    const drawB12 = function (mx, my, b, a) {
      const P = painter(mx, my, b, a);
      const centres = [[0, -0.86], [0.86, 0.06], [0, 0.98], [-0.86, 0.06]];
      const toC = centres.map((c) => Math.atan2(-c[1], -c[0]));
      /* 四个吡咯环 */
      for (let k = 0; k < 4; k++) {
        const c = centres[k], base = toC[k];
        const pts = [];
        for (let i = 0; i < 5; i++) {
          const ang = base + (i / 5) * Math.PI * 2;
          pts.push([c[0] + Math.cos(ang) * 0.30, c[1] + Math.sin(ang) * 0.30]);
        }
        for (let i = 0; i < 5; i++) P.seg(pts[i], pts[(i + 1) % 5]);
        /* 内侧顶点接 N，N 再接 Co */
        const inner = pts[0];
        P.seg(inner, [inner[0] * 0.44, inner[1] * 0.44]);
        P.txt([inner[0] * 0.30 + 0.03, inner[1] * 0.30 + 0.05], 'N', 'center', 9);
      }
      /* 三条次甲基桥（咕啉缺一条） */
      for (let k = 0; k < 3; k++) {
        const c1 = centres[k], c2 = centres[(k + 1) % 4];
        const a1 = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
        const p1 = [c1[0] + Math.cos(a1) * 0.30, c1[1] + Math.sin(a1) * 0.30];
        const p2 = [c2[0] - Math.cos(a1) * 0.30, c2[1] - Math.sin(a1) * 0.30];
        P.seg(p1, p2);
      }
      /* 中心钴 */
      ctx.beginPath();
      ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(94,242,208,' + (0.92 * a).toFixed(3) + ')';
      ctx.fill();
      P.txt([0, -0.06], 'Co', 'center', 9);
      /* 下方核苷酸环 */
      const L1 = [0.40, 1.26], L2 = [0.78, 1.42], L3 = [1.16, 1.26];
      P.seg([0.20, 1.22], L1); P.seg(L1, L2); P.seg(L2, L3);
      P.txt([L2[0], L2[1] + 0.24], 'ribose-P', 'center', 9);
      /* 5,6-二甲基苯并咪唑（简化为一个六边形） */
      const bz = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
        bz.push([L3[0] + 0.30 + Math.cos(ang) * 0.22, L3[1] + Math.sin(ang) * 0.22]);
      }
      for (let i = 0; i < 6; i++) P.seg(bz[i], bz[(i + 1) % 6]);
      /* 与钴的配位键 */
      ctx.setLineDash([3, 4]);
      P.seg([L3[0] - 0.04, L3[1] - 0.20], [0, 0.22]);
      ctx.setLineDash([]);
    };

    /* ---------- 面板 ---------- */
    const panel = function (mx, my, hw, hh, label, formula, fn, order, b) {
      const a = smooth(0.24 + order * 0.14, 0.66 + order * 0.14, localT);
      if (a <= 0.01) return;
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.30 * a).toFixed(3) + ')';
      ctx.lineWidth = 1;
      const c = Math.min(hw, hh) * 0.34;
      ctx.beginPath();
      ctx.moveTo(mx - hw, my - hh + c); ctx.lineTo(mx - hw, my - hh); ctx.lineTo(mx - hw + c, my - hh);
      ctx.moveTo(mx + hw - c, my - hh); ctx.lineTo(mx + hw, my - hh); ctx.lineTo(mx + hw, my - hh + c);
      ctx.moveTo(mx + hw, my + hh - c); ctx.lineTo(mx + hw, my + hh); ctx.lineTo(mx + hw - c, my + hh);
      ctx.moveTo(mx - hw + c, my + hh); ctx.lineTo(mx - hw, my + hh); ctx.lineTo(mx - hw, my + hh - c);
      ctx.stroke();
      fn(mx, my, b, a);
      const ly = my + hh - 34;
      ctx.textAlign = 'center';
      mono(ctx, 13, 700);
      ctx.fillStyle = 'rgba(234,254,255,' + (0.74 * a).toFixed(3) + ')';
      ctx.fillText(label, mx, ly);
      mono(ctx, 11, 500);
      ctx.fillStyle = 'rgba(94,242,208,' + (0.58 * a).toFixed(3) + ')';
      ctx.fillText(formula, mx, ly + 16);
      ctx.textAlign = 'left';
    };

    panel(300, 268, 214, 132, 'VITAMIN C',  'C6H8O6  ·  ASCORBIC ACID', drawC, 0, 62);
    panel(300, 646, 214, 132, 'VITAMIN E',  'C29H50O2  ·  α-TOCOPHEROL', drawE, 1, 34);
    panel(1620, 268, 214, 132, 'VITAMIN B12', 'C63H88CoN14O14P  ·  COBALAMIN', drawB12, 2, 44);
    panel(1620, 646, 214, 132, 'FAT  ·  TRIGLYCERIDE', 'C55H104O6', drawFat, 3, 46);

    /* 牵引线 */
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(94,242,208,0.16)';
    ctx.lineWidth = 1;
    const links = [[514, 268], [514, 646], [1406, 268], [1406, 646]];
    for (let k = 0; k < links.length; k++) {
      ctx.beginPath();
      ctx.moveTo(links[k][0], links[k][1]);
      ctx.lineTo(cx + (k < 2 ? -bodyW * 0.8 : bodyW * 0.8), cy + (k % 2 === 0 ? -120 : 120));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    /* ---------- HUD ---------- */
    mono(ctx, 13, 600);
    ctx.fillStyle = 'rgba(140,215,235,0.55)';
    ctx.fillText('SPECIMEN 02  \u00b7  SOLANUM MELONGENA  \u00b7  SCAN ' + Math.round(scanU * 100) + '%', 96, 150);
    ctx.textAlign = 'right';
    ctx.fillText('NUTRIENTS  C / E / B12 / LIPID', W - 96, 150);
    ctx.textAlign = 'left';

    mono(ctx, 12, 500);
    ctx.fillStyle = 'rgba(94,242,208,0.42)';
    ctx.fillText('WATER 92.7  \u00b7  FIBRE 3.0  \u00b7  K 229mg  \u00b7  FOLATE 22\u00b5g', 96, 934);
  };

  /* ── S20 番茄 · 番茄红素（共轭长链）────────────────────────────────────── */
  MODULES['sc.bioTomato'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const cx = 960, cy = 400;
    const R = 214;
    const appear = smooth(0.05, 0.60, localT);
    const spin = localT * 0.42;
    const reveal = smooth(0.55, 1.95, localT);

    ctx.globalAlpha = appear;

    /* ---------- 番茄：压扁的线描球 ---------- */
    const outlineAt = function (th) {
      return R * (1 + 0.030 * Math.cos(6 * th));
    };
    ctx.strokeStyle = 'rgba(234,254,255,0.86)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 180; i++) {
      const th = (i / 180) * Math.PI * 2;
      const rr = outlineAt(th);
      const x = cx + Math.cos(th) * rr;
      const y = cy + Math.sin(th) * rr * 0.84;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    /* 经线 */
    ctx.strokeStyle = 'rgba(94,242,208,0.22)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) {
      const th = (k / 8) * Math.PI + spin * 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const v = -1 + (i / 40) * 2;
        const lat = Math.asin(v);
        const rr = Math.cos(lat);
        const x = cx + Math.cos(th) * rr * R;
        const y = cy + Math.sin(lat) * R * 0.84;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    /* 纬线 */
    for (let k = -2; k <= 2; k++) {
      const lat = (k / 3) * (Math.PI / 2) * 0.92;
      const rr = Math.cos(lat) * R;
      ctx.beginPath();
      ctx.ellipse(cx, cy + Math.sin(lat) * R * 0.84, rr, rr * 0.10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* 萼片 */
    ctx.strokeStyle = 'rgba(94,242,208,0.72)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 0.84 + 4);
      ctx.lineTo(cx + Math.cos(a) * R * 0.26, cy - R * 0.84 - 10 + Math.sin(a) * R * 0.10);
      ctx.lineTo(cx + Math.cos(a) * R * 0.44, cy - R * 0.84 + 8 + Math.sin(a) * R * 0.13);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.84 + 6);
    ctx.lineTo(cx - 4, cy - R * 0.84 - 40);
    ctx.lineTo(cx + 5, cy - R * 0.84 - 62);
    ctx.stroke();

    /* 扫描弧 */
    ctx.strokeStyle = 'rgba(234,254,255,0.28)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const rr = R * (1.12 + k * 0.16) + 26 * Math.sin(t * 1.1 + k);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, -0.9 + localT * 0.2, 0.9 + localT * 0.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* ---------- 番茄红素：C40H56，32 碳主链 + 8 个甲基 ---------- */
    const y0 = 726, amp = 22;
    const x0 = 236, x1 = 1684;
    const NC = 32;
    const step = (x1 - x0) / (NC - 1);
    const node = function (i) {
      return [x0 + i * step, y0 + (i % 2 === 0 ? -amp : amp)];
    };
    const DBL = [2, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 30];
    const METHYL = [2, 6, 10, 14, 19, 23, 27, 31];

    ctx.globalAlpha = reveal;
    /* 主链 */
    for (let i = 1; i < NC; i++) {
      const p = node(i), q = node(i + 1);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
      ctx.strokeStyle = 'rgba(234,254,255,0.78)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      if (DBL.indexOf(i) >= 0) {
        const vx = q[0] - p[0], vy = q[1] - p[1], L = Math.hypot(vx, vy) || 1;
        const nx = -vy / L * 3.2, ny = vx / L * 3.2;
        ctx.beginPath();
        ctx.moveTo(p[0] + vx * 0.18 + nx, p[1] + vy * 0.18 + ny);
        ctx.lineTo(p[0] + vx * 0.82 + nx, p[1] + vy * 0.82 + ny);
        ctx.strokeStyle = 'rgba(234,254,255,0.70)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
    /* 甲基支链 */
    for (let k = 0; k < METHYL.length; k++) {
      const i = METHYL[k];
      const p = node(i + 1);
      const dir = (i % 4 === 2) ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + 2, p[1] + dir * 30);
      ctx.strokeStyle = 'rgba(234,254,255,0.62)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    /* 电子流动光点 */
    for (let k = 0; k < 3; k++) {
      const u = ((t * 0.55 + k / 3) % 1);
      const idx = 1 + u * (NC - 2);
      const i0 = Math.floor(idx), fr = idx - i0;
      const p = node(i0), q = node(i0 + 1);
      const x = p[0] + (q[0] - p[0]) * fr, y = p[1] + (q[1] - p[1]) * fr;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, 16);
      gg.addColorStop(0, 'rgba(234,254,255,0.9)');
      gg.addColorStop(1, 'rgba(94,242,208,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* 分子框与读数 */
    ctx.strokeStyle = 'rgba(94,242,208,0.28)';
    ctx.lineWidth = 1;
    const bxc = 96, bxw = W - 192, by0 = 660, byh = 132;
    const cc = 18;
    ctx.beginPath();
    ctx.moveTo(bxc, by0 + cc); ctx.lineTo(bxc, by0); ctx.lineTo(bxc + cc, by0);
    ctx.moveTo(bxc + bxw - cc, by0); ctx.lineTo(bxc + bxw, by0); ctx.lineTo(bxc + bxw, by0 + cc);
    ctx.moveTo(bxc + bxw, by0 + byh - cc); ctx.lineTo(bxc + bxw, by0 + byh); ctx.lineTo(bxc + bxw - cc, by0 + byh);
    ctx.moveTo(bxc + cc, by0 + byh); ctx.lineTo(bxc, by0 + byh); ctx.lineTo(bxc, by0 + byh - cc);
    ctx.stroke();

    mono(ctx, 13, 600);
    ctx.fillStyle = 'rgba(140,215,235,0.60)';
    ctx.fillText('SPECIMEN 03  \u00b7  SOLANUM LYCOPERSICUM', 96, 150);
    ctx.textAlign = 'right';
    ctx.fillText('ANTIOXIDANTS  ' + Math.round(reveal * 100) + '%', W - 96, 150);
    ctx.textAlign = 'left';

    mono(ctx, 12, 600);
    ctx.fillStyle = 'rgba(94,242,208,0.62)';
    ctx.fillText('LYCOPENE  \u00b7  C40H56  \u00b7  11 CONJUGATED C=C  \u00b7  ψ,ψ-CAROTENE', 236, 650);
  };

  /* ── S19 茄子 · 营养成分键线式（科幻标本扫描）────────────────────────── */
  MODULES['sc.bioEggplant'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const cx = 900, cy = 418;
    const bodyH = 468, bodyW = 196;

    const appear = smooth(0.05, 0.55, localT);
    const scanU = (localT * 0.42) % 1;
    const scanY = cy - bodyH / 2 + scanU * bodyH;

    /* ---------- 基础描线 ---------- */
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
    /* 正多边形（化学环） */
    const ngon = function (x, y, r, n, rot) {
      const o = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (rot || 0);
        o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
      }
      o.push(o[0]);
      return o;
    };

    /* ---------- 样本本体：线描茄子 ---------- */
    const widthAt = function (v) {
      return bodyW * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.70)), 0.9) * (1 - 0.22 * v);
    };
    const edge = function (v, side, k) {
      const y = cy - bodyH / 2 + v * bodyH;
      return [cx + side * widthAt(v) * (k === undefined ? 1 : k), y];
    };

    ctx.globalAlpha = appear;
    /* 外轮廓 */
    const right = [], left = [];
    for (let i = 0; i <= 60; i++) {
      const v = i / 60;
      right.push(edge(v, 1));
      left.unshift(edge(v, -1));
    }
    poly(right, false, 2.0, 'rgba(234,254,255,0.88)');
    poly(left, false, 2.0, 'rgba(234,254,255,0.88)');

    /* 剖面内轮廓 */
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
    /* 横向肋线 */
    for (let i = 1; i < 9; i++) {
      const v = i / 9;
      const w = widthAt(v) * 0.74;
      poly([edge(v, 1, 0.74), edge(v, -1, 0.74)], false, 0.8, 'rgba(94,242,208,0.16)');
    }
    /* 籽 */
    for (let i = 0; i < 26; i++) {
      const v = 0.24 + hash01(i * 3.7) * 0.66;
      const off = (hash01(i * 8.1) - 0.5) * 1.5;
      const p = edge(v, off > 0 ? 1 : -1, Math.min(0.62, Math.abs(off)));
      dot(p[0], p[1], 2.2, 0.42);
    }
    /* 蒂与萼片 */
    const topY = cy - bodyH / 2;
    poly([[cx - 10, topY + 8], [cx - 6, topY - 34], [cx + 4, topY - 58], [cx + 12, topY - 34], [cx + 12, topY + 6]],
          false, 2.0, 'rgba(234,254,255,0.82)');
    for (let k = -2; k <= 2; k++) {
      poly([[cx + k * 26, topY + 18], [cx + k * 40, topY - 6], [cx + k * 18, topY + 2]],
            false, 1.2, 'rgba(94,242,208,0.62)');
    }

    /* 扫描光带 */
    const bandTop = scanY - 46;
    const g = ctx.createLinearGradient(0, bandTop, 0, scanY + 10);
    g.addColorStop(0, 'rgba(94,242,208,0)');
    g.addColorStop(0.75, 'rgba(94,242,208,0.10)');
    g.addColorStop(1, 'rgba(234,254,255,0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - bodyW - 90, bandTop, (bodyW + 90) * 2, 56);
    ctx.strokeStyle = 'rgba(234,254,255,0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW - 90, scanY);
    ctx.lineTo(cx + bodyW + 90, scanY);
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

    /* ---------- 键线式 ---------- */
    const panel = function (mx, my, s, label, formula, strokes, accent) {
      const a = smooth(0.25 + (mx / W) * 0.5, 0.9 + (mx / W) * 0.5, localT);
      if (a <= 0.01) return;
      /* 角标 */
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.30 * a).toFixed(3) + ')';
      ctx.lineWidth = 1;
      const e = s * 2.1, c = s * 0.55;
      ctx.beginPath();
      ctx.moveTo(mx - e, my - e + c); ctx.lineTo(mx - e, my - e); ctx.lineTo(mx - e + c, my - e);
      ctx.moveTo(mx + e - c, my - e); ctx.lineTo(mx + e, my - e); ctx.lineTo(mx + e, my - e + c);
      ctx.moveTo(mx + e, my + e - c); ctx.lineTo(mx + e, my + e); ctx.lineTo(mx + e - c, my + e);
      ctx.moveTo(mx - e + c, my + e); ctx.lineTo(mx - e, my + e); ctx.lineTo(mx - e, my + e - c);
      ctx.stroke();

      /* 化学键 */
      ctx.strokeStyle = 'rgba(234,254,255,' + (0.80 * a).toFixed(3) + ')';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let k = 0; k < strokes.length; k++) {
        const pts = strokes[k];
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const x = mx + pts[i][0] * s, y = my + pts[i][1] * s;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      /* 标签 */
      ctx.textAlign = 'center';
      mono(ctx, 13, 700);
      ctx.fillStyle = 'rgba(234,254,255,' + (0.72 * a).toFixed(3) + ')';
      ctx.fillText(label, mx, my + s * 2.5);
      mono(ctx, 11, 500);
      ctx.fillStyle = 'rgba(94,242,208,' + (0.58 * a).toFixed(3) + ')';
      ctx.fillText(formula, mx, my + s * 2.5 + 17);
      ctx.textAlign = 'left';
    };

    /* 维生素 C：五元内酯环 + 侧链烯二醇 */
    const vitC = [
      ngon(-0.10, 0.06, 0.52, 5, -0.3),
      [[0.30, 0.36], [0.72, 0.62]],
      [[0.36, 0.30], [0.78, 0.56]],
      [[-0.58, -0.20], [-1.00, -0.34]],
      [[-0.02, -0.48], [-0.06, -0.94]],
      [[0.30, -0.30], [0.62, -0.56]]
    ];
    /* 维生素 E：苯并吡喃双环 + 植基长链 */
    const vitE = (function () {
      const o = [ngon(-0.36, 0, 0.34, 6, Math.PI / 6), ngon(0.10, 0, 0.34, 6, Math.PI / 6)];
      o.push([[0.10, -0.34], [0.44, -0.58], [0.44, -0.94]]);
      let x = 0.44, y = 0;
      const zz = [[x, y]];
      for (let k = 0; k < 6; k++) {
        x += 0.14; y = (k % 2 === 0) ? -0.26 : 0.26;
        zz.push([x, y]);
      }
      o.push(zz);
      for (let k = 0; k < 4; k++) {
        const px = 0.58 + k * 0.28;
        o.push([[px, -0.26], [px, -0.58]]);
      }
      return o;
    })();
    /* 脂肪：甘油三酯，三条脂肪酸链 */
    const fat = (function () {
      const o = [];
      const gx = [-0.86, -0.50, -0.14];
      o.push([[gx[0], -0.36], [gx[0], 0.36]]);
      o.push([[gx[1], -0.52], [gx[1], 0.52]]);
      o.push([[gx[2], -0.36], [gx[2], 0.36]]);
      for (let k = 0; k < 3; k++) {
        const y0 = [-0.52, 0, 0.52][k];
        o.push([[gx[k], (k === 1 ? 0.52 : 0.36) * (k === 1 ? -1 : 1) * -1], [gx[k] + 0.28, y0]]);
        let x = gx[k] + 0.28, y = y0;
        const zz = [[x, y]];
        for (let i = 0; i < 5; i++) {
          x += 0.13; y = y0 + (i % 2 === 0 ? 0.20 : -0.20);
          zz.push([x, y]);
        }
        o.push(zz);
      }
      return o;
    })();
    /* 维生素 B12：四个吡咯环围着中心钴 */
    const vitB12 = (function () {
      const o = [];
      o.push(ngon(-0.46, 0, 0.30, 5, 0));
      o.push(ngon(0.46, 0, 0.30, 5, 0));
      o.push(ngon(0, -0.46, 0.30, 5, Math.PI));
      o.push(ngon(0, 0.46, 0.30, 5, Math.PI));
      o.push(ngon(0, 0, 0.24, 4, Math.PI / 4));
      o.push([[-0.46, 0], [-0.24, 0]]);
      o.push([[0.46, 0], [0.24, 0]]);
      o.push([[0, -0.46], [0, -0.24]]);
      o.push([[0, 0.46], [0, 0.24]]);
      o.push([[0.46, 0.30], [0.86, 0.62], [0.86, 0.92]]);
      return o;
    })();

    const S = 62;
    panel(268, 232, S, 'VITAMIN C', 'C6H8O6', vitC);
    panel(268, 646, S, 'VITAMIN E', 'C29H50O2', vitE);
    panel(1600, 232, S, 'VITAMIN B12', 'C63H88CoN14O14P', vitB12);
    panel(1600, 646, S, 'FAT  ·  TRIGLYCERIDE', 'C55H104O6', fat);

    /* 牵引线：从分子到样本 */
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(94,242,208,0.16)';
    ctx.lineWidth = 1;
    const links = [[268, 300], [268, 690], [1600, 300], [1600, 690]];
    for (let k = 0; k < links.length; k++) {
      ctx.beginPath();
      ctx.moveTo(links[k][0] + (k < 2 ? 130 : -130), links[k][1]);
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

    const cx = 760, cy = 372, R = 186;
    const appear = smooth(0.05, 0.55, localT);
    const spin = localT * 0.30;

    /* ---------- 番茄：线描球体 ---------- */
    ctx.globalAlpha = appear;
    ctx.strokeStyle = 'rgba(234,254,255,0.86)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    /* 经线（用椭圆近似）：随 spin 转动 */
    for (let k = 0; k < 5; k++) {
      const ph = spin + (k / 5) * Math.PI;
      const rx = Math.abs(Math.cos(ph)) * R;
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.10 + 0.20 * Math.abs(Math.cos(ph))).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(3, rx), R, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    /* 纬线 */
    for (let k = 1; k < 4; k++) {
      const y = cy - R + (k / 4) * 2 * R;
      const rr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
      ctx.beginPath();
      ctx.ellipse(cx, y, rr, rr * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    /* 萼片 */
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * R * 0.34;
      const y1 = cy - R * 0.86 + Math.sin(a) * R * 0.20;
      const x2 = cx + Math.cos(a) * R * 1.02;
      const y2 = cy - R * 0.86 + Math.sin(a) * R * 0.62;
      ctx.strokeStyle = 'rgba(94,242,208,0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 0.92);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* 扫描环 */
    const ringR = R + 26 + 8 * Math.sin(localT * 2.2);
    ctx.strokeStyle = 'rgba(94,242,208,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, spin, spin + Math.PI * 1.25);
    ctx.stroke();

    /* ---------- 番茄红素：24 碳共轭多烯 ---------- */
    const y0 = 700, amp = 40, x0 = 300, x1 = 1660;
    const N = 24;
    const step = (x1 - x0) / (N - 1);
    const pts = [];
    for (let i = 0; i < N; i++) {
      pts.push([x0 + i * step, y0 + ((i % 2 === 0) ? -amp : amp)]);
    }

    /* 主链 */
    ctx.strokeStyle = 'rgba(234,254,255,0.88)';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
      else ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();

    /* 单双键交替：偶数段画第二条线 */
    ctx.strokeStyle = 'rgba(234,254,255,0.70)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < N - 1; i += 2) {
      const a = pts[i], b = pts[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const ox = (-dy / len) * 7, oy = (dx / len) * 7;
      ctx.beginPath();
      ctx.moveTo(a[0] + ox * 0.6, a[1] + oy * 0.6);
      ctx.lineTo(b[0] + ox * 0.6, b[1] + oy * 0.6);
      ctx.stroke();
    }

    /* 甲基 */
    ctx.strokeStyle = 'rgba(94,242,208,0.62)';
    ctx.lineWidth = 1.4;
    for (let i = 2; i < N - 2; i += 4) {
      const p = pts[i];
      const sgn = i % 8 === 2 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + 4, p[1] + sgn * 46);
      ctx.stroke();
    }

    /* 电子流：沿链流动的亮点 */
    const flow = (localT * 0.55) % 1;
    for (let k = 0; k < 3; k++) {
      const u = (flow + k / 3) % 1;
      const fi = u * (N - 1.001);
      const i0 = Math.floor(fi), r = fi - i0;
      const a = pts[i0], b = pts[i0 + 1] || pts[i0];
      const px = a[0] + (b[0] - a[0]) * r;
      const py = a[1] + (b[1] - a[1]) * r;
      const gg = ctx.createRadialGradient(px, py, 0, px, py, 22);
      gg.addColorStop(0, 'rgba(234,254,255,0.55)');
      gg.addColorStop(1, 'rgba(234,254,255,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(234,254,255,0.9)';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }

    /* 分子框 */
    ctx.strokeStyle = 'rgba(94,242,208,0.30)';
    ctx.lineWidth = 1;
    const bx0 = x0 - 60, bx1 = x1 + 60, by0 = y0 - 96, by1 = y0 + 96;
    const c = 26;
    ctx.beginPath();
    ctx.moveTo(bx0, by0 + c); ctx.lineTo(bx0, by0); ctx.lineTo(bx0 + c, by0);
    ctx.moveTo(bx1 - c, by0); ctx.lineTo(bx1, by0); ctx.lineTo(bx1, by0 + c);
    ctx.moveTo(bx1, by1 - c); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 - c, by1);
    ctx.moveTo(bx0 + c, by1); ctx.lineTo(bx0, by1); ctx.lineTo(bx0, by1 - c);
    ctx.stroke();

    /* ---------- HUD ---------- */
    mono(ctx, 13, 600);
    ctx.fillStyle = 'rgba(140,215,235,0.55)';
    ctx.fillText('LYCOPENE  \u00b7  C40H56  \u00b7  11 CONJUGATED DOUBLE BONDS', bx0, by0 - 22);
    ctx.textAlign = 'right';
    ctx.fillText('ANTIOXIDANTS  ' + Math.round(Math.min(1, localT / 1.6) * 100) + '%', W - 96, 150);
    ctx.textAlign = 'left';

    mono(ctx, 13, 600);
    ctx.fillStyle = 'rgba(140,215,235,0.50)';
    ctx.fillText('SPECIMEN 03  \u00b7  SOLANUM LYCOPERSICUM', 96, 150);
  };


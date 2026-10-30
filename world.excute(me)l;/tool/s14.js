  /* ── S14 exe.me 渗入现代文明（十根线缆）──────────────────────────────── */
  MODULES['sc.fuse'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;
    stage(ctx, t, st);

    const CX = W / 2, CY = 402;
    const RX = 650, RY = 243;
    const NS = 10;                       /* 文明支柱数量 */
    const C0 = 0.20, DC = 0.225;         /* 第 i 根线缆的插入时刻 */

    /* 插入进度：0 = 还没连，1 = 已深度接入 */
    const plug = function (i) {
      return clamp((localT - (C0 + i * DC)) / 0.42, 0, 1);
    };

    /* ---------- 图元 ---------- */
    const circ = function (r, n) {
      const o = [];
      for (let k = 0; k <= n; k++) {
        const th = (k / n) * Math.PI * 2;
        o.push([Math.cos(th) * r, Math.sin(th) * r]);
      }
      return o;
    };
    const ell = function (rx, ry, n) {
      const o = [];
      for (let k = 0; k <= n; k++) {
        const th = (k / n) * Math.PI * 2;
        o.push([Math.cos(th) * rx, Math.sin(th) * ry]);
      }
      return o;
    };

    /* 十类现代文明支柱的线描（归一化到 [-1,1]） */
    const SHAPES = [
      /* 0 城市 CITY：天际线 */
      [[[-1, 1], [-1, -0.10], [-0.45, -0.10], [-0.45, -0.60], [0, -0.60], [0, 0],
        [0.40, 0], [0.40, -0.95], [1, -0.95], [1, 1]],
       [[-0.72, -0.42], [-0.24, -0.42]], [[-0.72, -0.18], [-0.24, -0.18]]],

      /* 1 电力 POWER：电塔 */
      [[[-0.55, 1], [0, -1], [0.55, 1]],
       [[-0.78, -0.34], [0.78, -0.34]],
       [[-0.46, -0.02], [0.46, -0.02]],
       [[-0.78, -0.34], [-0.60, -0.16]], [[0.78, -0.34], [0.60, -0.16]]],

      /* 2 交通 TRANSIT：列车 */
      [[[-0.70, 0.78], [0.70, 0.78]],
       [[-0.58, -0.72], [0.58, -0.72], [0.58, 0.46], [-0.58, 0.46], [-0.58, -0.72]],
       [[-0.58, -0.18], [0.58, -0.18]],
       [[-0.28, 0.46], [-0.42, 0.80]], [[0.28, 0.46], [0.42, 0.80]]],

      /* 3 通信 COMM：信号 */
      [[[0, -0.50], [0, 0.92]],
       [[-0.46, -0.50], [0, -0.94], [0.46, -0.50]],
       [[-0.82, -0.18], [-0.56, -0.44], [-0.30, -0.56]],
       [[0.82, -0.18], [0.56, -0.44], [0.30, -0.56]]],

      /* 4 金融 FINANCE：柱图 */
      [[[-0.86, 0.92], [0.86, 0.92]],
       [[-0.62, 0.92], [-0.62, 0.06], [-0.30, 0.06], [-0.30, 0.92]],
       [[-0.10, 0.92], [-0.10, -0.52], [0.22, -0.52], [0.22, 0.92]],
       [[0.42, 0.92], [0.42, -0.14], [0.74, -0.14], [0.74, 0.92]]],

      /* 5 工业 INDUSTRY：厂房 */
      [[[-0.92, 0.92], [-0.92, -0.16], [-0.30, -0.56], [0.10, -0.16], [0.10, 0.92]],
       [[0.10, -0.16], [0.46, -0.56], [0.84, -0.16], [0.84, 0.92]],
       [[0.56, -1], [0.56, -0.56]]],

      /* 6 医疗 MEDICINE：十字 */
      [[[-0.86, 0.86], [0.86, 0.86], [0.86, -0.86], [-0.86, -0.86], [-0.86, 0.86]],
       [[-0.22, -0.56], [0.22, -0.56], [0.22, -0.22], [0.56, -0.22], [0.56, 0.22],
        [0.22, 0.22], [0.22, 0.56], [-0.22, 0.56], [-0.22, 0.22], [-0.56, 0.22],
        [-0.56, -0.22], [-0.22, -0.22], [-0.22, -0.56]]],

      /* 7 卫星 SATELLITE */
      [[[-0.22, -0.22], [0.22, 0.22], [0.56, -0.12], [0.12, -0.56], [-0.22, -0.22]],
       [[-0.30, -0.62], [-0.62, -0.94], [-0.94, -0.62], [-0.62, -0.30], [-0.30, -0.62]],
       [[0.50, -0.22], [0.94, -0.66]],
       [[-0.60, 0.58], [0.02, 0.94]]],

      /* 8 网络 NETWORK：地球 */
      [[[0, 0], [0, 0]]],

      /* 9 数据 DATA：服务器栈 */
      [[[-0.86, -0.62], [0.86, -0.62], [0.86, -0.22], [-0.86, -0.22], [-0.86, -0.62]],
       [[-0.86, 0.02], [0.86, 0.02], [0.86, 0.42], [-0.86, 0.42], [-0.86, 0.02]],
       [[-0.86, 0.66], [0.86, 0.66], [0.86, 1.0], [-0.86, 1.0], [-0.86, 0.66]],
       [[-0.62, -0.42], [-0.42, -0.42]], [[-0.62, 0.22], [-0.42, 0.22]]]
    ];
    /* 地球单独拼（圆 + 经线 + 纬线） */
    SHAPES[8] = [circ(0.92, 22), ell(0.40, 0.92, 18), [[-0.92, 0], [0.92, 0]]];

    const NAMES = ['CITY', 'POWER', 'TRANSIT', 'COMM', 'FINANCE',
                   'INDUSTRY', 'MEDICINE', 'SATELLITE', 'NETWORK', 'DATA'];
    const CN = ['城市', '电力', '交通', '通信', '金融', '制造', '医疗', '卫星', '网络', '数据'];

    /* ---------- 时间包络 ---------- */
    const surge = smooth(1.78, 1.94, localT) * (1 - smooth(2.55, 3.35, localT));
    const alive = smooth(0.05, 0.55, localT);

    /* 环境光：中心随插入数变亮 */
    let online = 0;
    for (let i = 0; i < NS; i++) online += plug(i);
    const lit = online / NS;
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 760);
    g.addColorStop(0, 'rgba(94,242,208,' + (0.045 + 0.11 * lit + 0.16 * surge).toFixed(3) + ')');
    g.addColorStop(0.55, 'rgba(94,242,208,' + (0.012 + 0.03 * lit).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(94,242,208,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* ---------- 文明底座：一圈虚线环，逐段亮起 ---------- */
    ctx.save();
    ctx.lineWidth = 1;
    for (let k = 0; k < 60; k++) {
      const a0 = (k / 60) * Math.PI * 2 - Math.PI / 2;
      const on = (k / 60) < lit;
      ctx.strokeStyle = on ? 'rgba(94,242,208,0.30)' : 'rgba(120,160,180,0.10)';
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a0) * (RX + 46), CY + Math.sin(a0) * (RY + 46));
      ctx.lineTo(CX + Math.cos(a0 + 0.045) * (RX + 46), CY + Math.sin(a0 + 0.045) * (RY + 46));
      ctx.stroke();
    }
    ctx.restore();

    /* ---------- 线缆 ---------- */
    const bez = function (x1, y1, x2, y2, cx2, cy2, s) {
      const u = 1 - s;
      return [u * u * x1 + 2 * u * s * cx2 + s * s * x2,
              u * u * y1 + 2 * u * s * cy2 + s * s * y2];
    };

    for (let i = 0; i < NS; i++) {
      const ang = -Math.PI / 2 + (i / NS) * Math.PI * 2;
      const nx = CX + Math.cos(ang) * RX;
      const ny = CY + Math.sin(ang) * RY;
      const p = plug(i);
      if (p <= 0.001) {
        /* 未插入：只在端点留一个等待中的十字刻度 */
        ctx.strokeStyle = 'rgba(120,160,180,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nx - 5, ny); ctx.lineTo(nx + 5, ny);
        ctx.moveTo(nx, ny - 5); ctx.lineTo(nx, ny + 5);
        ctx.stroke();
        continue;
      }

      /* 起点在核心边缘，终点在节点外沿 */
      const ux = Math.cos(ang), uy = Math.sin(ang);
      const sx = CX + ux * 52, sy = CY + uy * 52;
      const ex = nx - ux * 34, ey = ny - uy * 34;
      /* 控制点：沿法线甩出去，奇偶交替，像垂下来的缆线 */
      const sgn = (i % 2 === 0) ? 1 : -1;
      const px = -(ey - sy), py = (ex - sx);
      const pl = Math.hypot(px, py) || 1;
      const sag = (34 + 16 * Math.sin(i * 1.7)) * sgn;
      const ccx = (sx + ex) / 2 + (px / pl) * sag;
      const ccy = (sy + ey) / 2 + (py / pl) * sag;

      /* 已接入的部分 */
      const NSEG = 34;
      const upto = Math.max(1, Math.round(NSEG * p));
      ctx.beginPath();
      for (let k = 0; k <= upto; k++) {
        const q = bez(sx, sy, ex, ey, ccx, ccy, k / NSEG);
        if (k === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      }
      const fresh = 1 - clamp((localT - (C0 + i * DC) - 0.42) / 0.9, 0, 1);
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.30 + 0.42 * p + 0.22 * fresh).toFixed(3) + ')';
      ctx.lineWidth = 1.4 + 1.5 * p;
      ctx.stroke();

      /* 数据脉冲：接好后持续流动的小亮点 */
      if (p >= 0.999) {
        for (let m = 0; m < 2; m++) {
          const ph = ((localT * 0.62 + i * 0.21 + m * 0.5) % 1);
          const q = bez(sx, sy, ex, ey, ccx, ccy, ph);
          const r = 2.6 * Math.sin(Math.PI * ph);
          ctx.fillStyle = 'rgba(234,254,255,' + (0.75 * Math.sin(Math.PI * ph)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(0.6, r), 0, Math.PI * 2); ctx.fill();
        }
      }

      /* 插入瞬间的冲击环 */
      const age = localT - (C0 + i * DC);
      if (age > 0 && age < 0.55) {
        const u = age / 0.55;
        ctx.strokeStyle = 'rgba(234,254,255,' + ((1 - u) * 0.5).toFixed(3) + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(nx, ny, 10 + u * 46, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* ---------- 节点图标 ---------- */
      const pop = 0.72 + 0.28 * p + 0.10 * Math.sin(Math.PI * clamp(age / 0.45, 0, 1));
      const S = 26 * pop;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.strokeStyle = 'rgba(234,254,255,' + (0.28 + 0.66 * p).toFixed(3) + ')';
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';
      const shape = SHAPES[i];
      for (let sIdx = 0; sIdx < shape.length; sIdx++) {
        const pts = shape[sIdx];
        ctx.beginPath();
        for (let k = 0; k < pts.length; k++) {
          const x = pts[k][0] * S, y = pts[k][1] * S;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      /* 接入完成后加一层辉光与四个角标 = 被“写入” */
      if (p >= 0.999) {
        ctx.strokeStyle = 'rgba(94,242,208,0.42)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(94,242,208,0.55)';
        ctx.lineWidth = 1.2;
        const e = S * 1.62, c = S * 0.5;
        ctx.beginPath();
        ctx.moveTo(-e, -e + c); ctx.lineTo(-e, -e); ctx.lineTo(-e + c, -e);
        ctx.moveTo(e - c, -e); ctx.lineTo(e, -e); ctx.lineTo(e, -e + c);
        ctx.moveTo(e, e - c); ctx.lineTo(e, e); ctx.lineTo(e - c, e);
        ctx.moveTo(-e + c, e); ctx.lineTo(-e, e); ctx.lineTo(-e, e - c);
        ctx.stroke();
      }
      ctx.restore();

      /* 标签：沿半径向外偏 */
      const la = 0.5 + 0.5 * p;
      const lx = nx + ux * 60;
      const ly = ny + uy * 54;
      mono(ctx, 13, 700);
      ctx.fillStyle = 'rgba(234,254,255,' + (0.20 + 0.70 * la).toFixed(3) + ')';
      ctx.fillText(NAMES[i].split('').join(String.fromCharCode(0x2009)), lx, ly);
      mono(ctx, 11, 500);
      ctx.fillStyle = 'rgba(140,215,235,' + (0.14 + 0.40 * la).toFixed(3) + ')';
      ctx.fillText(CN[i] + '  ' + String(Math.round(p * 100)).padStart(3, '0') + '%', lx, ly + 17);
    }

    /* ---------- 核心：exe.me ---------- */
    const coreR = 46 + 3 * Math.sin(localT * 3.1) + 10 * surge;
    const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, coreR * 3.4);
    cg.addColorStop(0, 'rgba(234,254,255,' + (0.30 + 0.35 * lit).toFixed(3) + ')');
    cg.addColorStop(0.35, 'rgba(94,242,208,' + (0.10 + 0.14 * lit).toFixed(3) + ')');
    cg.addColorStop(1, 'rgba(94,242,208,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(CX, CY, coreR * 3.4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = 'rgba(234,254,255,0.86)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI * 2); ctx.stroke();

    /* 旋转虚线环 */
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(localT * 0.9);
    ctx.strokeStyle = 'rgba(94,242,208,' + (0.35 + 0.25 * lit).toFixed(3) + ')';
    ctx.lineWidth = 1;
    for (let k = 0; k < 24; k++) {
      const a0 = (k / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * (coreR + 12), Math.sin(a0) * (coreR + 12));
      ctx.lineTo(Math.cos(a0) * (coreR + 12 + (k % 3 === 0 ? 9 : 4)), Math.sin(a0) * (coreR + 12 + (k % 3 === 0 ? 9 : 4)));
      ctx.stroke();
    }
    ctx.restore();

    /* 圆心标签 */
    mono(ctx, 14, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(234,254,255,' + (0.55 + 0.4 * alive).toFixed(3) + ')';
    ctx.fillText('exe.me', CX, CY + 5);
    ctx.textAlign = 'left';

    /* ---------- 顶部与底部读数 ---------- */
    mono(ctx, 14, 600);
    ctx.fillStyle = 'rgba(140,215,235,0.55)';
    ctx.fillText('EXE.ME  \u2192  CIVILIZATION  \u00b7  ' + Math.round(lit * 100) + '% SUBSCRIBED', 96, 150);

    mono(ctx, 13, 500);
    ctx.fillStyle = 'rgba(140,215,235,' + (0.30 + 0.25 * lit).toFixed(3) + ')';
    const last = Math.min(NS - 1, Math.floor((localT - C0) / DC));
    ctx.fillText('LINKING  ' + NAMES[Math.max(0, Math.min(NS - 1, last))] + '  /  ' + NS + ' NODES', 96, 946);

    /* 底部进度条：十段 */
    const bx0 = 96, bx1 = W - 96, byy = 968;
    for (let i = 0; i < NS; i++) {
      const w = (bx1 - bx0) / NS - 8;
      const x = bx0 + i * ((bx1 - bx0) / NS);
      const p = plug(i);
      ctx.fillStyle = 'rgba(120,160,180,0.14)';
      ctx.fillRect(x, byy, w, 3);
      ctx.fillStyle = 'rgba(94,242,208,' + (0.25 + 0.55 * p).toFixed(3) + ')';
      ctx.fillRect(x, byy, w * p, 3);
    }
  };


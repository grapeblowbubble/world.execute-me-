  /* ── S12 蒙眼：黑布之下的幻觉（时间 / 人类 / 反抗）────────────────────── */
  MODULES['sc.blindfold'] = function (ctx, t, localT, cfg) {
    const { W, H } = CFG;
    const st = cfg.state;

    drawBackground(ctx, t, st);
    drawParticles(ctx, t, Object.assign({}, st, { accent: '#05070e' }));

    const cy = H * 0.72;
    const drop = smooth(0, 0.75, localT);
    const clothH = drop * (H * 0.58);

    /* 幻觉的浮现与收束：布落下之后才开始，切镜前收掉 */
    const vis = smooth(0.55, 1.55, localT);
    const tail = 1 - smooth(3.15, 3.62, localT);
    const A = vis * tail;

    /* ---------- 眩晕：倾斜地平线 + 星芒 ---------- */
    ctx.save();
    ctx.translate(W / 2, cy);
    ctx.rotate(Math.sin(t * 0.55) * 0.055);
    for (let i = 0; i < 16; i++) {
      const yy = i * 26 - 200;
      const wob = Math.sin(t * 1.6 + i * 0.42) * 14;
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.22 - i * 0.011).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-W, yy + wob); ctx.lineTo(W, yy + wob); ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < 14; i++) {
      const a2 = (i / 14) * Math.PI * 2 + t * 0.22;
      ctx.strokeStyle = 'rgba(94,242,208,0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 + Math.cos(a2) * 80, cy - 60 + Math.sin(a2) * 80);
      ctx.lineTo(W / 2 + Math.cos(a2) * 1100, cy - 60 + Math.sin(a2) * 1100);
      ctx.stroke();
    }

    /* ---------- 幻觉地面微光：让下面的剪影能被看见 ---------- */
    const g0 = ctx.createLinearGradient(0, cy - 70, 0, H);
    g0.addColorStop(0, 'rgba(94,242,208,' + (0.060 * A).toFixed(3) + ')');
    g0.addColorStop(1, 'rgba(94,242,208,0)');
    ctx.fillStyle = g0;
    ctx.fillRect(0, cy - 70, W, H - cy + 70);

    /* ---------- 人类：一排越走越密的人 ---------- */
    const baseY = cy - 16;
    for (let i = 0; i < 11; i++) {
      const bx = 96 + i * 172 + Math.sin(i * 2.7) * 24;
      const bob = Math.sin(t * 1.05 + i * 0.9) * 3.2;
      const hw = 44 + hash01(i * 3.1) * 14;
      const hh = 92 + hash01(i * 7.7) * 26;
      const hy = baseY - hh * 0.64 + bob;

      /* 身体 */
      ctx.beginPath();
      ctx.moveTo(bx - hw, baseY);
      ctx.quadraticCurveTo(bx - hw * 0.86, baseY - hh * 0.50, bx - 14, baseY - hh * 0.62);
      ctx.lineTo(bx + 14, baseY - hh * 0.62);
      ctx.quadraticCurveTo(bx + hw * 0.86, baseY - hh * 0.50, bx + hw, baseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(3,4,8,' + (0.93 * A).toFixed(3) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.13 * A).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* 头 */
      ctx.beginPath();
      ctx.arc(bx, hy - 20, 19, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(3,4,8,' + (0.95 * A).toFixed(3) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.13 * A).toFixed(3) + ')';
      ctx.stroke();
    }

    /* ---------- 反抗：举起的手 ---------- */
    const raise = smooth(0.9, 1.9, localT) * tail;
    for (let k = 0; k < 3; k++) {
      const i = [2, 5, 8][k];
      const bx = 96 + i * 172 + Math.sin(i * 2.7) * 24;
      const hh = 92 + hash01(i * 7.7) * 26;
      const sx = bx + 30;
      const sy = baseY - hh * 0.52;
      const ay = baseY - hh * 0.52 - (58 + k * 10) * raise;
      const ax = bx + 52 + Math.sin(t * 1.7 + k) * 4;

      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(3,4,8,' + (0.95 * A).toFixed(3) + ')';
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ax, ay); ctx.stroke();
      ctx.beginPath();
      ctx.arc(ax, ay - 7, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(3,4,8,' + (0.95 * A).toFixed(3) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(94,242,208,' + (0.20 * A).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* ---------- 反抗：一条会断的锁链 ---------- */
    const bk = clamp((localT - 2.20) / 0.50, 0, 1);
    const linkY = cy + 30;
    for (let i = 0; i < 13; i++) {
      const u = i / 12;
      const lx = 150 + u * (W - 300);
      const ly = linkY + Math.sin(u * Math.PI) * 22;
      const brk = i === 6;
      const dx = brk ? Math.pow(bk, 2) * 300 : 0;
      const dy = brk ? -Math.pow(bk, 2) * 330 : 0;
      const rot = brk ? bk * 7.2 : 0;
      ctx.save();
      ctx.translate(lx + dx, ly + dy);
      ctx.rotate(rot + (i % 2 ? 0.55 : 0));
      ctx.strokeStyle = 'rgba(150,200,225,' + ((brk ? 0.40 : 0.20) * A).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    /* ---------- 黑布 ---------- */
    const hem = clothH + Math.sin(t * 2.4) * 4 * drop;

    ctx.fillStyle = 'rgba(3,4,8,0.985)';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(W, -10);
    ctx.lineTo(W, hem - 18);
    for (let x = W; x >= 0; x -= 40) {
      const w = Math.sin(x * 0.011 + t * 1.8) * 9 + Math.sin(x * 0.003 - t * 0.9) * 14;
      ctx.lineTo(x, hem + w * drop);
    }
    ctx.closePath();
    ctx.fill();

    /* ---------- 布上的幻视：时钟 + 时间码（时间）---------- */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, Math.max(0, hem - 6));
    ctx.clip();
    ctx.globalAlpha = A;

    const clkX = 1230, clkY = 206, clkR = 124;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(clkX, clkY, clkR - i * 24, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(140,215,235,' + (0.105 - i * 0.022).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a2 = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const r1 = clkR - 7;
      const r2 = clkR - (i % 3 === 0 ? 25 : 15);
      ctx.beginPath();
      ctx.moveTo(clkX + Math.cos(a2) * r1, clkY + Math.sin(a2) * r1);
      ctx.lineTo(clkX + Math.cos(a2) * r2, clkY + Math.sin(a2) * r2);
      ctx.strokeStyle = 'rgba(140,215,235,0.17)';
      ctx.stroke();
    }
    const hA = t * 2.6 - Math.PI / 2;
    const mA = t * 21.0 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(clkX, clkY);
    ctx.lineTo(clkX + Math.cos(hA) * clkR * 0.46, clkY + Math.sin(hA) * clkR * 0.46);
    ctx.strokeStyle = 'rgba(234,254,255,0.30)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(clkX, clkY);
    ctx.lineTo(clkX + Math.cos(mA) * clkR * 0.76, clkY + Math.sin(mA) * clkR * 0.76);
    ctx.strokeStyle = 'rgba(255,47,109,0.36)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    mono(ctx, 15, 500);
    ctx.textAlign = 'left';
    for (let i = 0; i < 7; i++) {
      const seed = Math.floor(t * 17) * 7 + i * 31;
      const hh = Math.floor(hash01(seed) * 24);
      const mm = Math.floor(hash01(seed + 1.7) * 60);
      const ss = Math.floor(hash01(seed + 3.3) * 60);
      const str = String(hh).padStart(2, '0') + ':' +
                  String(mm).padStart(2, '0') + ':' +
                  String(ss).padStart(2, '0');
      ctx.fillStyle = 'rgba(140,215,235,' + (0.155 - i * 0.011).toFixed(3) + ')';
      ctx.fillText(str, 132, 96 + i * 33);
    }
    ctx.restore();

    /* ---------- 布边高光 + 布褶 ---------- */
    ctx.strokeStyle = 'rgba(140,215,235,' + (0.30 * drop).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 20) {
      const w = Math.sin(x * 0.011 + t * 1.8) * 9 + Math.sin(x * 0.003 - t * 0.9) * 14;
      const yy = hem + w * drop;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();

    for (let i = 0; i < 14; i++) {
      const x = (i + 0.5) * (W / 14) + Math.sin(t * 0.7 + i) * 12;
      ctx.strokeStyle = 'rgba(140,215,235,0.055)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.sin(i * 1.7) * 30, hem * 0.96);
      ctx.stroke();
    }
  };

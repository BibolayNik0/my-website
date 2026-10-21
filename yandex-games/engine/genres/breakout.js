// Арканоид: отбивай шар платформой, разбивай блоки-предметы, волны усложняются.
YG.register('breakout', {
  power: { ru: 'Широкая платформа', en: 'Wide paddle' },
  powerDesc: { ru: '+8% ширины платформы за уровень', en: '+8% paddle width per level' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const COLS = api.p.cols || 7;
    let bricks = [], ball, padX = C.W / 2, wave = 0, score = 0, over = false, launched = false;
    const floats = [], drops = [];
    const padW = () => Math.min(C.W * 0.5, 90 * (1 + api.power() * 0.08));
    const padY = () => C.H - 70;
    const newWave = () => {
      wave++;
      const rows = Math.min(8, 3 + wave);
      const bw = (C.W - 20) / COLS;
      bricks = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
        if (api.p.pattern === 'holes' && (r + c) % 3 === 0) continue;
        bricks.push({ x: 10 + c * bw, y: 100 + r * 34, w: bw - 4, h: 30, hp: 1 + Math.floor(r / 3) + Math.floor(wave / 4), e: api.sp.tiles[(r + wave) % api.sp.tiles.length] });
      }
      resetBall();
    };
    const resetBall = () => { launched = false; ball = { x: padX, y: padY() - 14, vx: 0, vy: 0, r: 9 }; };
    newWave();
    const move = (e) => { padX = YG.clamp(C.pos(e).x, padW() / 2, C.W - padW() / 2); };
    C.cv.addEventListener('pointermove', move);
    C.cv.addEventListener('pointerdown', (e) => {
      move(e);
      if (!launched && !over) { launched = true; const sp = (api.p.speed || 360) + wave * 15; ball.vx = YG.rand(-0.5, 0.5) * sp; ball.vy = -sp; }
    });
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over) {
        if (!launched) { ball.x = padX; ball.y = padY() - 14; }
        else {
          const steps = 3;
          for (let s = 0; s < steps; s++) {
            ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
            if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; }
            if (ball.x > C.W - ball.r) { ball.x = C.W - ball.r; ball.vx *= -1; }
            if (ball.y < 70 + ball.r) { ball.y = 70 + ball.r; ball.vy *= -1; }
            if (ball.vy > 0 && ball.y + ball.r > padY() && ball.y < padY() + 14 && Math.abs(ball.x - padX) < padW() / 2 + ball.r) {
              const sp = Math.hypot(ball.vx, ball.vy) * 1.01, k = (ball.x - padX) / (padW() / 2);
              ball.vx = sp * k * 0.8; ball.vy = -Math.sqrt(Math.max(sp * sp - ball.vx * ball.vx, sp * sp * 0.2)); api.sfx('tap');
            }
            for (let i = bricks.length - 1; i >= 0; i--) {
              const b = bricks[i];
              if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
                const ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - ball.x + ball.r), oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - ball.y + ball.r);
                if (ox < oy) ball.vx *= -1; else ball.vy *= -1;
                b.hp--; api.sfx('hit');
                if (b.hp <= 0) {
                  bricks.splice(i, 1); score += 10 * wave; api.score(score);
                  if (Math.random() < 0.25) drops.push({ x: b.x + b.w / 2, y: b.y });
                }
                break;
              }
            }
          }
          if (ball.y > C.H + 20) {
            over = true; api.sfx('lose');
            api.end({}).then((r) => { if (r === 'revive') { over = false; resetBall(); } });
          }
          if (!bricks.length) { api.coins(10 + wave * 3); api.sfx('win'); YG.floatText(floats, C.W / 2, C.H / 2, (api.lang === 'ru' ? 'Волна ' : 'Wave ') + (wave + 1), '#fff176'); newWave(); }
        }
      }
      bricks.forEach((b) => {
        ctx.fillStyle = `rgba(255,255,255,${0.12 + b.hp * 0.08})`;
        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 8); ctx.fill();
        YG.drawSprite(ctx, b.e, b.x + b.w / 2, b.y + b.h / 2, Math.min(24, b.h - 4));
        if (b.hp > 1) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'right'; ctx.fillText(b.hp, b.x + b.w - 4, b.y + 11); }
      });
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; if (!over) d.y += 180 * dt;
        if (d.y > padY() - 10 && d.y < padY() + 20 && Math.abs(d.x - padX) < padW() / 2) { api.coins(2); YG.floatText(floats, d.x, d.y, '+2'); drops.splice(i, 1); continue; }
        if (d.y > C.H) { drops.splice(i, 1); continue; }
        YG.drawSprite(ctx, api.sp.item || '🪙', d.x, d.y, 24);
      }
      ctx.fillStyle = api.pal[2]; ctx.beginPath(); ctx.roundRect(padX - padW() / 2, padY(), padW(), 14, 7); ctx.fill();
      YG.drawSprite(ctx, api.hero(), ball.x, ball.y, ball.r * 2.6);
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

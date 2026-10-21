// Флаппи: тапай, чтобы взлетать, пролетай между препятствиями.
YG.register('flappy', {
  power: { ru: 'Широкий проход', en: 'Wide gaps' },
  powerDesc: { ru: 'Проходы между препятствиями шире', en: 'Gaps between obstacles are wider' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const GRAV = api.p.gravity || 1400, FLAP = api.p.flap || 430;
    let y = C.H / 2, vy = 0, pipes = [], score = 0, over = false, started = false, spawnT = 0, inv = 0;
    const coins = [], floats = [];
    const speed = () => (api.p.speed || 170) + score * 3;
    const gap = () => Math.max(130, (api.p.gap || 170) - score * 1.2) + api.power() * 6;
    const flap = () => { if (over) return; started = true; vy = -FLAP; api.sfx('tap'); };
    C.cv.addEventListener('pointerdown', flap);
    const key = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } };
    window.addEventListener('keydown', key);
    const hx = () => C.W * 0.3;
    const die = () => {
      over = true; api.sfx('lose');
      api.end({}).then((r) => { if (r === 'revive') { pipes = pipes.filter((p) => p.x > hx() + 200); y = C.H / 2; vy = 0; inv = 1.5; started = false; over = false; } });
    };
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over && started) {
        vy += GRAV * dt; y += vy * dt;
        inv = Math.max(0, inv - dt);
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = 230 / speed() * 1.6;
          const gp = gap(), top = YG.rand(90, C.H - 90 - gp);
          pipes.push({ x: C.W + 40, top, gp, passed: false });
          coins.push({ x: C.W + 40, y: top + gp / 2 });
        }
        if (y > C.H - 20 || y < -40) { if (!inv) die(); else { y = YG.clamp(y, 0, C.H - 20); vy = 0; } }
      }
      const pw = 64, R = 20;
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        if (!over && started) p.x -= speed() * dt;
        if (p.x < -pw) { pipes.splice(i, 1); continue; }
        ctx.fillStyle = api.pal[2];
        ctx.beginPath(); ctx.roundRect(p.x - pw / 2, -10, pw, p.top + 10, 10); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x - pw / 2, p.top + p.gp, pw, C.H, 10); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(p.x + pw / 2 - 12, 0, 12, p.top); ctx.fillRect(p.x + pw / 2 - 12, p.top + p.gp, 12, C.H);
        YG.drawSprite(ctx, api.sp.enemy, p.x, p.top - 22, 34);
        YG.drawSprite(ctx, api.sp.enemy, p.x, p.top + p.gp + 22, 34);
        if (!p.passed && p.x < hx()) { p.passed = true; score++; api.score(score); }
        if (!over && !inv && Math.abs(p.x - hx()) < pw / 2 + R - 6 && (y - R + 6 < p.top || y + R - 6 > p.top + p.gp)) die();
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (!over && started) c.x -= speed() * dt;
        if (c.x < -30) { coins.splice(i, 1); continue; }
        if (Math.hypot(c.x - hx(), c.y - y) < 32) { api.coins(1); YG.floatText(floats, c.x, c.y, '+1'); coins.splice(i, 1); continue; }
        YG.drawSprite(ctx, api.sp.item || '🪙', c.x, c.y, 26);
      }
      ctx.globalAlpha = inv && Math.floor(inv * 10) % 2 ? 0.4 : 1;
      YG.drawSprite(ctx, api.hero(), hx(), y, 46, YG.clamp(vy / 900, -0.5, 0.8));
      ctx.globalAlpha = 1;
      if (!started && !over) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(api.lang === 'ru' ? 'Тапни, чтобы лететь' : 'Tap to fly', C.W / 2, C.H / 2 + 70);
      }
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); window.removeEventListener('keydown', key); C.destroy(); host.innerHTML = ''; }
    };
  }
});

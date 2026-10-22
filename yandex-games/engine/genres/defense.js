// Оборона: враги идут волнами, тапай по ним, автопушка помогает. Не пропусти к базе.
YG.register('defense', {
  power: { ru: 'Автопушка', en: 'Auto turret' },
  powerDesc: { ru: 'Пушка стреляет чаще и сильнее', en: 'Turret fires faster and harder' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const enemies = api.sp.enemies;
    let foes = [], shots = [], hp = 3, kills = 0, wave = 1, over = false, spawnT = 1, waveLeft = 8, turretT = 0;
    const floats = [];
    const baseY = () => C.H - 90;
    const spawn = () => {
      const tier = Math.min(enemies.length - 1, Math.floor(Math.random() * (1 + wave / 3)));
      const boss = waveLeft === 1 && wave % 5 === 0;
      foes.push({ x: YG.rand(40, C.W - 40), y: 60, hp: (1 + tier) * (boss ? 12 : 1) + Math.floor(wave / 4), max: 0, e: boss ? (api.sp.boss || enemies[enemies.length - 1]) : enemies[tier],
        sp: (api.p.speed || 45) + wave * 3 + YG.rand(0, 20) - (boss ? 20 : 0), size: boss ? 80 : 40 + tier * 4, coin: (1 + tier) * (boss ? 15 : 1), wob: YG.rand(0, 6) });
      foes[foes.length - 1].max = foes[foes.length - 1].hp;
    };
    const hit = (f, dmg) => {
      f.hp -= dmg;
      if (f.hp <= 0) {
        foes.splice(foes.indexOf(f), 1);
        kills++; api.score(kills); api.coins(f.coin, f.coin < 3);
        YG.floatText(floats, f.x, f.y, '+' + f.coin);
      }
    };
    C.cv.addEventListener('pointerdown', (e) => {
      if (over) return;
      const p = C.pos(e);
      let best = null, bd = 1e9;
      foes.forEach((f) => { const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < f.size * 0.8 && d < bd) { bd = d; best = f; } });
      if (best) { api.sfx('hit'); hit(best, api.p.tapDmg || 1); }
      shots.push({ x: p.x, y: p.y, t: 0.2, fx: true });
    });
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over) {
        spawnT -= dt;
        if (spawnT <= 0 && waveLeft > 0) { spawn(); waveLeft--; spawnT = Math.max(0.35, 1.3 - wave * 0.06); }
        if (waveLeft <= 0 && !foes.length) { wave++; waveLeft = 8 + wave * 2; api.coins(wave * 2); api.sfx('win'); api.hud((api.lang === 'ru' ? 'Волна ' : 'Wave ') + wave + ' · ' + '❤️'.repeat(hp)); }
        turretT -= dt;
        if (turretT <= 0 && foes.length) {
          turretT = Math.max(0.3, 2.2 - api.power() * 0.18); // базовая пушка лишь помогает, основная работа — тапы
          const target = foes.reduce((a, f) => (f.y > a.y ? f : a), foes[0]);
          shots.push({ x: C.W / 2, y: baseY(), tx: target.x, ty: target.y, t: 0.15, f: target });
        }
        for (const f of foes.slice()) {
          f.y += f.sp * dt; f.x += Math.sin(performance.now() / 400 + f.wob) * 20 * dt;
          if (f.y > baseY() - 10) {
            foes.splice(foes.indexOf(f), 1); hp--; api.sfx('lose');
            api.hud((api.lang === 'ru' ? 'Волна ' : 'Wave ') + wave + ' · ' + '❤️'.repeat(Math.max(0, hp)));
            if (hp <= 0) {
              over = true;
              api.end({}).then((r) => { if (r === 'revive') { hp = 3; foes = []; over = false; api.hud((api.lang === 'ru' ? 'Волна ' : 'Wave ') + wave + ' · ❤️❤️❤️'); } });
              break;
            }
          }
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, baseY(), C.W, C.H - baseY());
      YG.drawSprite(ctx, api.sp.base || '🏰', C.W / 2 - 70, baseY() + 40, 50);
      YG.drawSprite(ctx, api.hero(), C.W / 2, baseY() + 30, 54);
      YG.drawSprite(ctx, api.sp.base || '🏰', C.W / 2 + 70, baseY() + 40, 50);
      foes.forEach((f) => {
        YG.drawSprite(ctx, f.e, f.x, f.y, f.size);
        if (f.max > 1) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(f.x - 20, f.y - f.size / 2 - 8, 40, 5); ctx.fillStyle = '#ff5252'; ctx.fillRect(f.x - 20, f.y - f.size / 2 - 8, 40 * f.hp / f.max, 5); }
      });
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i]; s.t -= dt;
        if (s.fx) { ctx.strokeStyle = 'rgba(255,255,255,' + s.t * 4 + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 30 - s.t * 80, 0, 7); ctx.stroke(); }
        else {
          ctx.strokeStyle = api.pal[2]; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.f.x, s.f.y); ctx.stroke();
          if (s.t <= 0 && foes.includes(s.f)) hit(s.f, 1 + Math.floor(api.power() / 3));
        }
        if (s.t <= 0) shots.splice(i, 1);
      }
      YG.drawFloats(ctx, floats, dt);
    });
    api.hud((api.lang === 'ru' ? 'Волна ' : 'Wave ') + wave + ' · ❤️❤️❤️');
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

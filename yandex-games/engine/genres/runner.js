// Раннер по полосам: уворачивайся от препятствий, собирай монеты, скорость растёт.
YG.register('runner', {
  power: { ru: 'Магнит', en: 'Magnet' },
  powerDesc: { ru: 'Притягивает монеты с соседних полос', en: 'Pulls coins from nearby lanes' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const LANES = api.p.lanes || 3;
    const enemies = api.sp.enemies || [api.sp.enemy];
    let lane = Math.floor(LANES / 2), px = 0, speed = api.p.speed || 260, dist = 0, over = false, spawnT = 0, inv = 0;
    const objs = [], floats = [];
    const laneX = (l) => C.W / 2 + (l - (LANES - 1) / 2) * Math.min(110, C.W / (LANES + 0.5));
    px = laneX(lane);
    const heroY = () => C.H - 120;
    const unswipe = YG.swipe(C.cv, (d, e) => {
      if (over) return;
      if (d === 'tap' && e && e.clientX != null) { const p = C.pos(e); d = p.x < C.W / 2 ? 'left' : 'right'; }
      if (d === 'left') lane = Math.max(0, lane - 1);
      if (d === 'right') lane = Math.min(LANES - 1, lane + 1);
      api.sfx('tap');
    });
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over) {
        speed += dt * (api.p.accel || 6);
        dist += speed * dt / 40;
        api.score(dist);
        inv = Math.max(0, inv - dt);
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.35, 260 / speed * (api.p.density || 0.9));
          const free = YG.randi(0, LANES - 1);
          for (let l = 0; l < LANES; l++) {
            if (l === free) { if (Math.random() < 0.7) objs.push({ l, y: -40, k: 'coin' }); }
            else if (Math.random() < 0.45) objs.push({ l, y: -40, k: 'bad', e: YG.pick(enemies) });
          }
        }
      }
      // дорога
      const off = (dist * 40) % 60;
      for (let l = 0; l <= LANES; l++) {
        const x = laneX(l) - (laneX(1) - laneX(0)) / 2;
        ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.setLineDash([30, 30]); ctx.lineDashOffset = -off;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke();
      }
      ctx.setLineDash([]);
      px += (laneX(lane) - px) * Math.min(1, dt * 16);
      const hy = heroY();
      const mag = api.power() * 18;
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (!over) o.y += speed * dt;
        let ox = laneX(o.l);
        if (o.k === 'coin' && mag && Math.abs(o.y - hy) < 160 && Math.abs(ox - px) <= mag * 6) { o.mx = (o.mx || ox) + (px - (o.mx || ox)) * Math.min(1, dt * 8); ox = o.mx; }
        if (o.y > C.H + 50) { objs.splice(i, 1); continue; }
        if (!over && Math.abs(o.y - hy) < 34 && Math.abs(ox - px) < 34) {
          if (o.k === 'coin') { api.coins(1); YG.floatText(floats, ox, o.y, '+1'); objs.splice(i, 1); continue; }
          if (!inv) {
            over = true; api.sfx('lose');
            api.end({}).then((r) => {
              if (r !== 'revive') return;
              objs.length = 0; inv = 2; over = false;
            });
          }
        }
        YG.drawSprite(ctx, o.k === 'coin' ? (api.sp.item || '🪙') : o.e, ox, o.y, o.k === 'coin' ? 30 : 48);
      }
      ctx.globalAlpha = inv > 0 && Math.floor(inv * 10) % 2 ? 0.4 : 1;
      YG.drawSprite(ctx, api.hero(), px, hy + Math.sin(dist * 2) * 3, 58);
      ctx.globalAlpha = 1;
      YG.drawFloats(ctx, floats, dt);
    });
    api.hud(api.lang === 'ru' ? '← свайп / тап по сторонам →' : '← swipe / tap sides →');
    setTimeout(() => api.hud(''), 2500);
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); unswipe(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

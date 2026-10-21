// Мемори: открывай карточки парами, запоминай расположение. Уровни растут, время ограничено.
YG.register('memory', {
  power: { ru: 'Подсмотр', en: 'Peek' },
  powerDesc: { ru: 'Дольше показывает карты в начале уровня', en: 'Shows the cards longer at level start' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const pool = api.sp.tiles;
    let level = 0, cards = [], open = [], time = 0, score = 0, over = false, peek = 0, lock = 0, combo = 0;
    const floats = [];
    let L = {};
    const newLevel = () => {
      level++;
      const pairs = Math.min(pool.length, 4 + level * 2);
      const cols = pairs <= 6 ? 3 : pairs <= 8 ? 4 : 5;
      const picks = pool.slice().sort(() => Math.random() - 0.5).slice(0, pairs);
      cards = picks.concat(picks).sort(() => Math.random() - 0.5).map((e) => ({ e, open: false, done: false, flip: 0 }));
      L.cols = cols; L.rows = Math.ceil(cards.length / cols);
      time = (api.p.time || 30) + pairs * 4;
      peek = 1 + api.power() * 0.4;
      open = [];
      api.hud((api.lang === 'ru' ? 'Уровень ' : 'Level ') + level);
    };
    newLevel();
    const geo = () => {
      const c = Math.min((C.W - 20) / L.cols, (C.H - 170) / L.rows);
      return { c, x: (C.W - c * L.cols) / 2, y: 120 };
    };
    C.cv.addEventListener('pointerdown', (e) => {
      if (over || peek > 0 || lock > 0) return;
      const g = geo(), p = C.pos(e);
      const cx = Math.floor((p.x - g.x) / g.c), cy = Math.floor((p.y - g.y) / g.c);
      if (cx < 0 || cy < 0 || cx >= L.cols) return;
      const card = cards[cy * L.cols + cx];
      if (!card || card.open || card.done) return;
      card.open = true; api.sfx('tap'); open.push(card);
      if (open.length === 2) {
        const [a, b] = open;
        if (a.e === b.e) {
          a.done = b.done = true; combo++;
          score += 10 * combo; api.score(score); api.coins(1 + Math.floor(combo / 2), true); api.sfx('coin');
          open = [];
          if (cards.every((c) => c.done)) {
            score += Math.floor(time) * 3 + level * 50; api.score(score);
            api.coins(5 + level * 2); api.sfx('win');
            YG.floatText(floats, C.W / 2, C.H / 2, '✨ ' + (api.lang === 'ru' ? 'Уровень пройден!' : 'Level clear!'), '#fff176');
            setTimeout(newLevel, 700);
          }
        } else { combo = 0; lock = 0.7; }
      }
    });
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over) {
        if (peek > 0) peek -= dt; else time -= dt;
        if (lock > 0) { lock -= dt; if (lock <= 0) { open.forEach((c) => { c.open = false; }); open = []; } }
        if (time <= 0) {
          over = true; time = 0;
          api.end({}).then((r) => { if (r === 'revive') { time = 20; over = false; } });
        }
      }
      ctx.fillStyle = time < 8 ? '#ff5252' : '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(peek > 0 ? '👀' : '⏱ ' + Math.ceil(time), C.W / 2, 104);
      const g = geo();
      cards.forEach((c, i) => {
        const x = g.x + (i % L.cols) * g.c, y = g.y + Math.floor(i / L.cols) * g.c;
        const show = c.open || c.done || peek > 0;
        c.flip += ((show ? 1 : 0) - c.flip) * Math.min(1, dt * 12);
        const w = (g.c - 8) * Math.abs(c.flip * 2 - 1);
        ctx.fillStyle = c.flip > 0.5 ? (c.done ? 'rgba(46,204,113,.35)' : 'rgba(255,255,255,.9)') : api.pal[2];
        ctx.beginPath(); ctx.roundRect(x + g.c / 2 - w / 2, y + 4, Math.max(1, w), g.c - 8, 10); ctx.fill();
        if (c.flip > 0.5) YG.drawSprite(ctx, c.e, x + g.c / 2, y + g.c / 2, g.c * 0.55 * Math.abs(c.flip * 2 - 1));
        else { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `bold ${Math.floor(g.c * 0.35)}px system-ui`; ctx.fillText('?', x + g.c / 2, y + g.c / 2 + g.c * 0.12); }
      });
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

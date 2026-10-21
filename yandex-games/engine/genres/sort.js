// Сортировка: переливай предметы между колбами, чтобы в каждой был один вид. Уровни на время.
YG.register('sort', {
  power: { ru: 'Запас времени', en: 'Extra time' },
  powerDesc: { ru: '+5 секунд на уровень', en: '+5 seconds per level' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const CAP = api.p.cap || 4;
    const kinds = api.sp.tiles;
    let level = 0, tubes = [], sel = -1, time = 0, score = 0, over = false, won = 0;
    const floats = [];
    const newLevel = () => {
      level++;
      const colors = Math.min(kinds.length, 3 + Math.floor(level / 2));
      const pool = [];
      for (let c = 0; c < colors; c++) for (let k = 0; k < CAP; k++) pool.push(c);
      // перемешиваем, пока ни одна колба не оказалась собранной
      do { pool.sort(() => Math.random() - 0.5); }
      while (Array.from({ length: colors }, (_, t) => pool.slice(t * CAP, t * CAP + CAP)).some((t) => t.every((v) => v === t[0])));
      tubes = Array.from({ length: colors }, (_, t) => pool.slice(t * CAP, t * CAP + CAP));
      tubes.push([], []);
      time = (api.p.time || 40) + colors * 6 + api.power() * 5;
      sel = -1;
      api.hud((api.lang === 'ru' ? 'Уровень ' : 'Level ') + level);
    };
    newLevel();
    let L = {};
    const layout = () => {
      const n = tubes.length, perRow = Math.min(n, 7), rows = Math.ceil(n / perRow);
      const tw = Math.min(64, (C.W - 20) / perRow - 10), th = tw * 0.9 * CAP + 20;
      L = { n, perRow, rows, tw, th, gap: 10 };
    };
    const tubePos = (i) => {
      const r = Math.floor(i / L.perRow), inRow = Math.min(L.perRow, L.n - r * L.perRow), c = i % L.perRow;
      const totalW = inRow * (L.tw + L.gap) - L.gap;
      return { x: (C.W - totalW) / 2 + c * (L.tw + L.gap), y: 130 + r * (L.th + 30) };
    };
    const solved = () => tubes.every((t) => t.length === 0 || (t.length === CAP && t.every((v) => v === t[0])));
    C.cv.addEventListener('pointerdown', (e) => {
      if (over) return;
      layout();
      const p = C.pos(e);
      let hit = -1;
      for (let i = 0; i < tubes.length; i++) { const q = tubePos(i); if (p.x > q.x - 6 && p.x < q.x + L.tw + 6 && p.y > q.y - 30 && p.y < q.y + L.th + 10) hit = i; }
      if (hit < 0) { sel = -1; return; }
      if (sel < 0) { if (tubes[hit].length) { sel = hit; api.sfx('tap'); } return; }
      if (hit === sel) { sel = -1; return; }
      const from = tubes[sel], to = tubes[hit];
      const top = from[from.length - 1];
      if (to.length < CAP && (!to.length || to[to.length - 1] === top)) {
        while (from.length && from[from.length - 1] === top && to.length < CAP) to.push(from.pop());
        api.sfx('coin');
        if (to.length === CAP && to.every((v) => v === to[0])) { api.coins(2, true); }
        if (solved()) {
          won++;
          const bonus = Math.floor(time) * 2;
          score += 100 * level + bonus; api.score(score);
          api.coins(5 + level * 2); api.sfx('win');
          YG.floatText(floats, C.W / 2, C.H / 2, '✨ +' + (100 * level + bonus), '#fff176');
          newLevel();
        }
      } else api.sfx('hit');
      sel = -1;
    });
    const lp = YG.loop((dt) => {
      layout();
      const ctx = C.ctx; C.bg();
      if (!over) {
        time -= dt;
        if (time <= 0) {
          over = true; time = 0;
          api.end({}).then((r) => { if (r === 'revive') { time = 30; over = false; } });
        }
      }
      ctx.fillStyle = time < 10 ? '#ff5252' : '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('⏱ ' + Math.ceil(time), C.W / 2, 108);
      const cell = L.tw * 0.9;
      tubes.forEach((t, i) => {
        const q = tubePos(i), lift = i === sel ? -20 : 0;
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(q.x, q.y + lift, L.tw, L.th, [4, 4, L.tw / 2, L.tw / 2]); ctx.fill(); ctx.stroke();
        t.forEach((v, k) => YG.drawSprite(ctx, kinds[v], q.x + L.tw / 2, q.y + lift + L.th - 14 - cell / 2 - k * cell, cell * 0.8));
      });
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

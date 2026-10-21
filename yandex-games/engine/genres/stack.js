// Башня: блок ездит туда-сюда, тапни, чтобы поставить. Лишнее обрезается.
YG.register('stack', {
  power: { ru: 'Точность', en: 'Precision' },
  powerDesc: { ru: 'Больше допуск для идеальной установки', en: 'Wider tolerance for perfect drops' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const BH = 34;
    const colors = api.p.colors || ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'];
    const startW = () => Math.min(220, C.W * 0.6);
    let blocks = [{ x: (C.W - startW()) / 2, w: startW() }];
    let cur = null, score = 0, over = false, camY = 0, streak = 0, chips = [];
    const floats = [];
    const speed = () => (api.p.speed || 180) + score * 4;
    const next = () => { const top = blocks[blocks.length - 1]; cur = { x: -top.w, w: top.w, dir: 1 }; if (blocks.length % 2) { cur.x = C.W; cur.dir = -1; } };
    next();
    const baseY = () => C.H - 120;
    const drop = () => {
      if (over) return;
      const top = blocks[blocks.length - 1];
      const tol = 4 + api.power() * 1.5;
      let { x, w } = cur;
      if (Math.abs(x - top.x) <= tol) {
        x = top.x; streak++; api.sfx('win');
        if (streak >= 3) w = Math.min(startW(), w + 8);
        api.coins(2);
        YG.floatText(floats, C.W / 2, baseY() - blocks.length * BH + camY - 30, api.lang === 'ru' ? 'ИДЕАЛЬНО!' : 'PERFECT!', '#fff176');
      } else {
        streak = 0;
        const l = Math.max(x, top.x), r = Math.min(x + w, top.x + top.w);
        if (r <= l) {
          over = true; chips.push({ x, w, y: blocks.length, vy: 0 });
          api.end({}).then((res) => { if (res === 'revive') { over = false; next(); } });
          return;
        }
        chips.push({ x: x < top.x ? x : r, w: w - (r - l), y: blocks.length, vy: 0 });
        x = l; w = r - l; api.sfx('tap');
        if (score % 3 === 0) api.coins(1, true);
      }
      blocks.push({ x, w });
      score++; api.score(score);
      next();
    };
    C.cv.addEventListener('pointerdown', drop);
    const key = (e) => { if (e.code === 'Space') drop(); };
    window.addEventListener('keydown', key);
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over) {
        cur.x += cur.dir * speed() * dt;
        if (cur.x > C.W - cur.w * 0.2) cur.dir = -1;
        if (cur.x < -cur.w * 0.8) cur.dir = 1;
      }
      const target = Math.max(0, blocks.length * BH - C.H * 0.45);
      camY += (target - camY) * Math.min(1, dt * 5);
      const yOf = (i) => baseY() - i * BH + camY;
      blocks.forEach((b, i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(b.x, yOf(i), b.w, BH - 2);
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(b.x, yOf(i) + BH - 8, b.w, 6);
        if (i % 5 === 4 && b.w > 30) YG.drawSprite(ctx, api.sp.deco || '⭐', b.x + b.w / 2, yOf(i) + BH / 2 - 1, 20);
      });
      if (!over) {
        const i = blocks.length;
        ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(cur.x, yOf(i), cur.w, BH - 2);
        YG.drawSprite(ctx, api.hero(), cur.x + cur.w / 2, yOf(i) - 18, 34);
      }
      chips.forEach((c) => { c.vy += 900 * dt; c.off = (c.off || 0) + c.vy * dt; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(c.x, yOf(c.y) + c.off, c.w, BH - 2); });
      chips = chips.filter((c) => c.off < C.H);
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); window.removeEventListener('keydown', key); C.destroy(); host.innerHTML = ''; }
    };
  }
});

// Змейка: собирай еду, расти, не врезайся. Хвост — из предметов темы.
YG.register('snake', {
  power: { ru: 'Замедление', en: 'Slow motion' },
  powerDesc: { ru: 'Змейка ускоряется медленнее', en: 'Snake speeds up slower' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const COLS = api.p.cols || 15;
    let L = {};
    const layout = () => { const c = Math.floor(Math.min((C.W - 16) / COLS, (C.H - 120) / (COLS + 4))); L = { c, rows: COLS + 4, x: (C.W - c * COLS) / 2, y: 80 }; };
    layout(); C.onResize = layout;
    const foods = api.sp.foods || [api.sp.item];
    let snake, dir, nextDir, food, score, over = false, stepT = 0, eaten = 0;
    const floats = [];
    const reset = () => {
      const cy = Math.floor(L.rows / 2);
      snake = [{ x: 5, y: cy }, { x: 4, y: cy }, { x: 3, y: cy }];
      dir = { x: 1, y: 0 }; nextDir = dir;
    };
    reset(); score = 0;
    const placeFood = () => {
      do { food = { x: YG.randi(0, COLS - 1), y: YG.randi(0, L.rows - 1), e: YG.pick(foods), gold: Math.random() < 0.1 }; }
      while (snake.some((s) => s.x === food.x && s.y === food.y));
    };
    placeFood();
    const interval = () => Math.max(0.06, (api.p.step || 0.16) - eaten * 0.003 / (1 + api.power() * 0.25));
    const unswipe = YG.swipe(C.cv, (d) => {
      const m = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } }[d];
      if (m && (m.x !== -dir.x || m.y !== -dir.y)) nextDir = m;
    });
    const die = () => {
      over = true; api.sfx('lose');
      api.end({}).then((r) => { if (r === 'revive') { const len = snake.length; reset(); while (snake.length < Math.min(len, 6)) snake.push({ ...snake[snake.length - 1] }); over = false; } });
    };
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      if (!over) {
        stepT += dt;
        if (stepT >= interval()) {
          stepT = 0; dir = nextDir;
          const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (api.p.wrap) { h.x = (h.x + COLS) % COLS; h.y = (h.y + L.rows) % L.rows; }
          if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= L.rows || snake.some((s, i) => i < snake.length - 1 && s.x === h.x && s.y === h.y)) { die(); }
          else {
            snake.unshift(h);
            if (h.x === food.x && h.y === food.y) {
              eaten++; score += food.gold ? 50 : 10; api.score(score);
              api.coins(food.gold ? 10 : 1); if (food.gold) api.sfx('win');
              YG.floatText(floats, L.x + (h.x + 0.5) * L.c, L.y + h.y * L.c, food.gold ? '+50' : '+10');
              placeFood();
            } else snake.pop();
          }
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(L.x, L.y, COLS * L.c, L.rows * L.c);
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.strokeRect(L.x, L.y, COLS * L.c, L.rows * L.c);
      const pc = (p) => [L.x + (p.x + 0.5) * L.c, L.y + (p.y + 0.5) * L.c];
      if (food.gold) { ctx.fillStyle = 'rgba(255,215,0,.35)'; ctx.beginPath(); ctx.arc(...pc(food), L.c * 0.7, 0, 7); ctx.fill(); }
      YG.drawSprite(ctx, food.e, ...pc(food), L.c * 0.9);
      for (let i = snake.length - 1; i >= 1; i--) {
        ctx.fillStyle = i % 2 ? api.pal[2] : 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.arc(...pc(snake[i]), L.c * 0.42, 0, 7); ctx.fill();
      }
      YG.drawSprite(ctx, api.hero(), ...pc(snake[0]), L.c * 1.15);
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); unswipe(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

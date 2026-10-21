// Три в ряд: меняй соседние фишки местами, собирай линии, пока не кончились ходы.
YG.register('match3', {
  power: { ru: 'Запас ходов', en: 'Extra moves' },
  powerDesc: { ru: '+1 ход в начале раунда за уровень', en: '+1 starting move per level' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const N = api.p.size || 8;
    const K = Math.min(api.sp.tiles.length, api.p.kinds || 6);
    const tiles = api.sp.tiles.slice(0, K);
    let moves = (api.p.moves || 25) + api.power();
    let score = 0, over = false, busy = false, sel = -1, combo = 0;
    const floats = [];
    let g = [];
    const rnd = () => YG.randi(0, K - 1);
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? -2 : g[y * N + x];
    do {
      g = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let v;
        do { v = rnd(); } while ((x >= 2 && g[y * N + x - 1] === v && g[y * N + x - 2] === v) || (y >= 2 && g[(y - 1) * N + x] === v && g[(y - 2) * N + x] === v));
        g.push(v);
      }
    } while (!hasMove());
    // смещение для анимации падения
    const off = g.map(() => 0);
    let L = {};
    const layout = () => { const s = Math.min(C.W - 20, C.H - 150); L = { s, c: s / N, x: (C.W - s) / 2, y: Math.max(90, (C.H - s) / 2 + 20) }; };
    layout(); C.onResize = layout;

    function findMatches() {
      const m = new Set();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const v = at(x, y); if (v < 0) continue;
        if (at(x + 1, y) === v && at(x + 2, y) === v) { let k = x; while (at(k, y) === v) m.add(y * N + k++); }
        if (at(x, y + 1) === v && at(x, y + 2) === v) { let k = y; while (at(x, k) === v) m.add(k++ * N + x); }
      }
      return m;
    }
    function hasMove() {
      for (let i = 0; i < N * N; i++) for (const d of [1, N]) {
        const j = i + d; if (j >= N * N || (d === 1 && i % N === N - 1)) continue;
        [g[i], g[j]] = [g[j], g[i]];
        const ok = findMatches().size > 0;
        [g[i], g[j]] = [g[j], g[i]];
        if (ok) return true;
      }
      return false;
    }
    function collapse() {
      for (let x = 0; x < N; x++) {
        let w = N - 1;
        for (let y = N - 1; y >= 0; y--) if (g[y * N + x] >= 0) { if (w !== y) { g[w * N + x] = g[y * N + x]; off[w * N + x] = (w - y) * L.c; g[y * N + x] = -1; } w--; }
        for (let y = w; y >= 0; y--) { g[y * N + x] = rnd(); off[y * N + x] = (w + 1) * L.c; }
      }
    }
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    async function resolve() {
      combo = 0;
      let m = findMatches();
      while (m.size) {
        combo++;
        const pts = m.size * 10 * combo;
        score += pts; api.score(score);
        api.coins(Math.ceil(m.size / 3) * combo);
        const first = [...m][0];
        YG.floatText(floats, L.x + (first % N + 0.5) * L.c, L.y + (Math.floor(first / N) + 0.5) * L.c, '+' + pts + (combo > 1 ? ' x' + combo : ''));
        m.forEach((i) => { g[i] = -1; });
        api.sfx(combo > 1 ? 'win' : 'coin');
        await wait(120);
        collapse();
        await wait(260);
        m = findMatches();
      }
      if (!hasMove()) { g = g.map(rnd); return resolve(); }
    }
    async function trySwap(i, j) {
      busy = true;
      [g[i], g[j]] = [g[j], g[i]];
      if (!findMatches().size) {
        await wait(150);
        [g[i], g[j]] = [g[j], g[i]];
        api.sfx('hit');
      } else {
        moves--;
        await resolve();
      }
      api.hud('👣 ' + moves);
      busy = false;
      if (moves <= 0 && !over) {
        over = true;
        api.end({}).then((r) => { if (r === 'revive') { moves += 5; over = false; api.hud('👣 ' + moves); } });
      }
    }
    let down = null;
    const cellAt = (p) => { const x = Math.floor((p.x - L.x) / L.c), y = Math.floor((p.y - L.y) / L.c); return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1; };
    const adj = (a, b) => (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N)) || Math.abs(a - b) === N;
    C.cv.addEventListener('pointerdown', (e) => {
      if (busy || over) return;
      const p = C.pos(e), i = cellAt(p);
      if (i < 0) return;
      down = { i, p };
      if (sel >= 0 && adj(sel, i)) { const s = sel; sel = -1; down = null; trySwap(s, i); return; }
      sel = i;
    });
    C.cv.addEventListener('pointermove', (e) => {
      if (!down || busy) return;
      const p = C.pos(e), dx = p.x - down.p.x, dy = p.y - down.p.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < L.c * 0.4) return;
      const i = down.i, x = i % N, y = Math.floor(i / N);
      let j = -1;
      if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && x < N - 1) j = i + 1; else if (dx < 0 && x > 0) j = i - 1; }
      else { if (dy > 0 && y < N - 1) j = i + N; else if (dy < 0 && y > 0) j = i - N; }
      down = null; sel = -1;
      if (j >= 0) trySwap(i, j);
    });
    api.hud('👣 ' + moves);
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect(L.x - 6, L.y - 6, L.s + 12, L.s + 12, 14); ctx.fill();
      for (let i = 0; i < N * N; i++) {
        const x = L.x + (i % N) * L.c, y = L.y + Math.floor(i / N) * L.c;
        if ((i + Math.floor(i / N)) % 2) { ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, y, L.c, L.c); }
        if (off[i] > 0) off[i] = Math.max(0, off[i] - dt * L.c * 14);
        if (g[i] >= 0) {
          if (i === sel) { ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, L.c - 4, L.c - 4, 8); ctx.fill(); }
          YG.drawSprite(ctx, tiles[g[i]], x + L.c / 2, y + L.c / 2 - off[i], L.c * 0.72 * (i === sel ? 1.1 : 1));
        }
      }
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

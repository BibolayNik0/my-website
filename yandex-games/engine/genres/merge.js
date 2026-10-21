// Мерж: перетаскивай одинаковые предметы, чтобы получить следующий уровень. Генератор подкидывает новые.
YG.register('merge', {
  power: { ru: 'Удачный генератор', en: 'Lucky generator' },
  powerDesc: { ru: '+6% шанс создать предмет 2-го уровня', en: '+6% chance to spawn a tier-2 item' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const tiers = api.sp.tiers;
    const N = api.p.size || 5;
    const AUTO = api.p.auto || 2.6;
    let grid = Array.from({ length: N * N }, () => -1);
    let score = 0, over = false, autoT = AUTO, cool = 0, drag = null, flash = [];
    const floats = [];
    let L = {};
    const layout = () => {
      const size = Math.min(C.W - 24, C.H - 220);
      L = { size, cell: size / N, x: (C.W - size) / 2, y: 80, gx: C.W / 2, gy: 80 + size + 70 };
    };
    layout(); C.onResize = layout;
    const empties = () => grid.map((v, i) => v < 0 ? i : -1).filter((i) => i >= 0);
    const spawn = () => {
      const e = empties();
      if (!e.length) return false;
      const i = YG.pick(e);
      grid[i] = Math.random() < api.power() * 0.06 ? 1 : 0;
      flash.push({ i, t: 0.3 });
      return true;
    };
    const hasPair = () => {
      const c = {};
      for (const v of grid) if (v >= 0 && v < tiers.length - 1) { if (c[v]) return true; c[v] = 1; }
      return grid.filter((v) => v === tiers.length - 1).length >= 2;
    };
    for (let k = 0; k < Math.floor(N * N / 3); k++) spawn();
    const cellAt = (p) => {
      const cx = Math.floor((p.x - L.x) / L.cell), cy = Math.floor((p.y - L.y) / L.cell);
      return cx >= 0 && cy >= 0 && cx < N && cy < N ? cy * N + cx : -1;
    };
    const checkOver = () => {
      if (over || empties().length || hasPair()) return;
      over = true;
      api.end({}).then((r) => {
        if (r !== 'revive') return;
        const idx = grid.map((v, i) => [v, i]).filter((a) => a[0] >= 0).sort((a, b) => a[0] - b[0]).slice(0, Math.ceil(N * N / 3));
        idx.forEach(([, i]) => { grid[i] = -1; });
        over = false;
      });
    };
    C.cv.addEventListener('pointerdown', (e) => {
      if (over) return;
      const p = C.pos(e);
      if (Math.hypot(p.x - L.gx, p.y - L.gy) < 50) {
        if (cool <= 0) { if (spawn()) { api.sfx('tap'); cool = 0.3; } else checkOver(); }
        return;
      }
      const i = cellAt(p);
      if (i >= 0 && grid[i] >= 0) drag = { i, x: p.x, y: p.y };
    });
    C.cv.addEventListener('pointermove', (e) => { if (drag) { const p = C.pos(e); drag.x = p.x; drag.y = p.y; } });
    const up = (e) => {
      if (!drag || over) { drag = null; return; }
      const j = cellAt(C.pos(e)), i = drag.i;
      drag = null;
      if (j < 0 || j === i) return;
      if (grid[j] === grid[i]) {
        const tier = grid[i];
        grid[i] = -1;
        if (tier >= tiers.length - 1) {
          grid[j] = -1;
          score += 1000; api.coins(60); api.sfx('win');
          YG.floatText(floats, L.x + (j % N + 0.5) * L.cell, L.y + (Math.floor(j / N) + 0.5) * L.cell, '💥 +1000', '#fff176');
        } else {
          grid[j] = tier + 1;
          score += (tier + 1) * 10;
          api.coins(tier + 1, tier < 2);
          flash.push({ i: j, t: 0.3 });
          YG.floatText(floats, L.x + (j % N + 0.5) * L.cell, L.y + (Math.floor(j / N) + 0.5) * L.cell, '+' + (tier + 1) * 10);
        }
        api.score(score);
      } else {
        const t = grid[j]; grid[j] = grid[i]; grid[i] = t;
      }
    };
    window.addEventListener('pointerup', up);
    const lp = YG.loop((dt) => {
      if (!over) {
        cool -= dt;
        autoT -= dt * (1 + score / 4000);
        if (autoT <= 0) { autoT = AUTO; if (!spawn()) checkOver(); }
        if (!empties().length) checkOver();
      }
      const ctx = C.ctx; C.bg();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.roundRect(L.x - 6, L.y - 6, L.size + 12, L.size + 12, 16); ctx.fill();
      for (let i = 0; i < N * N; i++) {
        const x = L.x + (i % N) * L.cell, y = L.y + Math.floor(i / N) * L.cell;
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.roundRect(x + 3, y + 3, L.cell - 6, L.cell - 6, 10); ctx.fill();
        if (grid[i] >= 0 && !(drag && drag.i === i)) {
          const f = flash.find((q) => q.i === i);
          const s = L.cell * 0.66 * (f ? 1 + f.t : 1);
          YG.drawSprite(ctx, tiers[grid[i]], x + L.cell / 2, y + L.cell / 2, s);
          ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'left';
          ctx.fillText(grid[i] + 1, x + 8, y + 16);
        }
      }
      flash.forEach((f) => { f.t -= dt; }); flash = flash.filter((f) => f.t > 0);
      if (drag) YG.drawSprite(ctx, tiers[grid[drag.i]], drag.x, drag.y, L.cell * 0.8);
      // генератор
      const ready = cool <= 0;
      ctx.fillStyle = ready ? api.pal[2] : 'rgba(255,255,255,.2)';
      ctx.beginPath(); ctx.arc(L.gx, L.gy, 44, 0, Math.PI * 2); ctx.fill();
      YG.drawSprite(ctx, api.sp.gen || '🎁', L.gx, L.gy, 48);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillRect(L.gx - 60, L.gy + 54, 120 * Math.max(0, autoT / AUTO), 5);
      YG.drawFloats(ctx, floats, dt);
    });
    api.hud('➡ ' + tiers.slice(0, 5).join('→') + '…');
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); window.removeEventListener('pointerup', up); host.innerHTML = ''; }
    };
  }
});

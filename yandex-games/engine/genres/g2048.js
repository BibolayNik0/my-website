// 2048 с эволюцией: свайпай, одинаковые плитки сливаются в следующую стадию.
YG.register('g2048', {
  power: { ru: 'Быстрый старт', en: 'Head start' },
  powerDesc: { ru: '+5% шанс появления плитки 2-го уровня', en: '+5% chance to spawn a tier-2 tile' },
  start(host, api) {
    const C = YG.makeCanvas(host);
    const N = api.p.size || 4;
    const tiers = api.sp.tiers;
    let g = Array(N * N).fill(-1), score = 0, over = false, anim = Array(N * N).fill(0);
    const floats = [];
    let L = {};
    const layout = () => { const s = Math.min(C.W - 24, C.H - 160); L = { s, c: s / N, x: (C.W - s) / 2, y: Math.max(90, (C.H - s) / 2) }; };
    layout(); C.onResize = layout;
    const add = () => {
      const e = g.map((v, i) => v < 0 ? i : -1).filter((i) => i >= 0);
      if (!e.length) return;
      const i = YG.pick(e);
      g[i] = Math.random() < 0.1 + api.power() * 0.05 ? 1 : 0; anim[i] = 1;
    };
    add(); add();
    const canMove = () => {
      if (g.includes(-1)) return true;
      for (let i = 0; i < N * N; i++) {
        if (i % N < N - 1 && g[i] === g[i + 1]) return true;
        if (i + N < N * N && g[i] === g[i + N]) return true;
      }
      return false;
    };
    const move = (d) => {
      if (over || d === 'tap') return;
      let moved = false;
      const lines = [];
      for (let a = 0; a < N; a++) {
        const line = [];
        for (let b = 0; b < N; b++) {
          if (d === 'left') line.push(a * N + b);
          if (d === 'right') line.push(a * N + (N - 1 - b));
          if (d === 'up') line.push(b * N + a);
          if (d === 'down') line.push((N - 1 - b) * N + a);
        }
        lines.push(line);
      }
      for (const line of lines) {
        const vals = line.map((i) => g[i]).filter((v) => v >= 0);
        const out = [];
        for (let k = 0; k < vals.length; k++) {
          if (k + 1 < vals.length && vals[k] === vals[k + 1] && vals[k] < tiers.length - 1) {
            const nv = vals[k] + 1;
            out.push(nv); score += Math.pow(2, nv + 1); k++;
            api.coins(nv, nv < 3);
          } else out.push(vals[k]);
        }
        while (out.length < N) out.push(-1);
        line.forEach((i, k) => { if (g[i] !== out[k]) { moved = true; if (out[k] >= 0 && out[k] !== g[i]) anim[i] = 1; } g[i] = out[k]; });
      }
      if (moved) {
        add(); api.score(score); api.sfx('tap');
        if (!canMove()) {
          over = true;
          api.end({}).then((r) => {
            if (r !== 'revive') return;
            g.map((v, i) => [v, i]).filter((a) => a[0] >= 0).sort((a, b) => a[0] - b[0]).slice(0, 5).forEach(([, i]) => { g[i] = -1; });
            over = false;
          });
        }
      }
    };
    const unswipe = YG.swipe(C.cv, move);
    const lp = YG.loop((dt) => {
      const ctx = C.ctx; C.bg();
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect(L.x - 8, L.y - 8, L.s + 16, L.s + 16, 18); ctx.fill();
      for (let i = 0; i < N * N; i++) {
        const x = L.x + (i % N) * L.c, y = L.y + Math.floor(i / N) * L.c;
        const v = g[i];
        ctx.fillStyle = v < 0 ? 'rgba(255,255,255,.07)' : `hsla(${(v * 37 + 20) % 360},70%,${55 - v * 2}%,.55)`;
        ctx.beginPath(); ctx.roundRect(x + 4, y + 4, L.c - 8, L.c - 8, 12); ctx.fill();
        if (v >= 0) {
          anim[i] = Math.max(0, anim[i] - dt * 5);
          YG.drawSprite(ctx, tiers[v], x + L.c / 2, y + L.c / 2 - 4, L.c * 0.55 * (1 + anim[i] * 0.25));
          ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(L.c * 0.16)}px system-ui`; ctx.textAlign = 'center';
          ctx.fillText(Math.pow(2, v + 1), x + L.c / 2, y + L.c - 10);
        }
      }
      YG.drawFloats(ctx, floats, dt);
    });
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); unswipe(); C.destroy(); host.innerHTML = ''; }
    };
  }
});

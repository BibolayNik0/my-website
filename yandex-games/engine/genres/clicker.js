// Кликер/айдл-тайкун: тапай героя, покупай генераторы, копи доход оффлайн.
YG.register('clicker', {
  idle: true,
  power: { ru: 'Сила тапа', en: 'Tap power' },
  powerDesc: { ru: '+50% монет за тап за уровень', en: '+50% coins per tap per level' },
  BASE_COST: [15, 120, 1100, 12000, 130000, 1400000],
  BASE_CPS: [0.3, 2, 12, 70, 400, 2500],
  cps(gs, p) {
    const k = (p && p.cpsMul) || 1;
    return (gs.gens || []).reduce((a, lv, i) => a + lv * this.BASE_CPS[i] * k, 0);
  },
  offline(gs) { return this.cps(gs); },
  start(host, api) {
    const self = this;
    const gs = api.state;
    const gens = (api.p.gens || []).map((s) => { const [e, ru, en] = s.split('|'); return { e, name: { ru, en } }; });
    gs.gens = gs.gens || gens.map(() => 0);
    while (gs.gens.length < gens.length) gs.gens.push(0);
    gs.total = gs.total || 0;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';
    const top = document.createElement('div');
    top.style.cssText = 'position:relative;flex:1.2;min-height:0';
    const panel = document.createElement('div');
    panel.style.cssText = 'flex:1;overflow-y:auto;padding:8px 12px 16px;background:rgba(0,0,0,.35);max-width:720px;width:100%;margin:0 auto;border-radius:18px 18px 0 0';
    wrap.append(top, panel); host.appendChild(wrap);

    const C = YG.makeCanvas(top);
    const floats = [], parts = [];
    let pulse = 0, acc = 0, golden = null, nextGolden = YG.rand(30, 60);
    const cost = (i) => Math.floor(self.BASE_COST[i] * (api.p.costMul || 1) * Math.pow(1.15, gs.gens[i]));
    const cps = () => self.cps(gs, api.p);
    const boosted = () => (gs.boostUntil || 0) > Date.now();
    const tapVal = () => (1 + cps() * 0.05) * (1 + api.power() * 0.5) * (boosted() ? 3 : 1) * (api.p.tapMul || 1);

    function renderPanel() {
      const L = api.L;
      const b = boosted();
      panel.innerHTML = `
        <div class="card row" style="margin-top:0"><div class="grow"><b>${YG.fmt(cps() * api.coinMult() * (b ? 3 : 1))}</b> 🪙/${api.lang === 'ru' ? 'сек' : 'sec'} · ${api.lang === 'ru' ? 'тап' : 'tap'}: ${YG.fmt(tapVal() * api.coinMult())}</div>
          ${b ? `<span class="tag">x3 ${Math.ceil((gs.boostUntil - Date.now()) / 1000)}s</span>` : `<button class="btn ad" data-boost="1">▶ x3 2 ${api.lang === 'ru' ? 'мин' : 'min'}</button>`}</div>
        ${gens.map((g, i) => {
          const locked = i > 0 && gs.gens[i - 1] === 0;
          const c = cost(i);
          return `<div class="card row" style="${locked ? 'opacity:.4' : ''}"><div class="ic">${locked ? '🔒' : g.e}</div>
            <div class="grow"><b>${L(g.name)}</b> <span class="muted">x${gs.gens[i]}</span><div class="small muted">+${YG.fmt(self.BASE_CPS[i] * (api.p.cpsMul || 1))}/s</div></div>
            <button class="btn ${api.balance() >= c && !locked ? '' : 'disabled'}" data-gen="${i}">🪙 ${YG.fmt(c)}</button></div>`;
        }).join('')}`;
    }
    panel.addEventListener('click', async (e) => {
      const g = e.target.closest('[data-gen]');
      if (g) {
        const i = +g.dataset.gen;
        if (i > 0 && gs.gens[i - 1] === 0) return;
        if (api.spend(cost(i))) { gs.gens[i]++; api.sfx('up'); api.save(); renderPanel(); }
        return;
      }
      if (e.target.closest('[data-boost]') && await api.rewarded()) { gs.boostUntil = Date.now() + 120000; api.save(); renderPanel(); }
    });

    const tap = (e) => {
      const p = C.pos(e);
      if (golden && Math.hypot(p.x - golden.x, p.y - golden.y) < 40) {
        const v = api.coins(cps() * 30 + tapVal() * 20);
        YG.floatText(floats, golden.x, golden.y, '+' + YG.fmt(v), '#fff176');
        golden = null; api.sfx('win');
        return;
      }
      const v = api.coins(tapVal(), true);
      gs.total += v;
      api.sfx('tap');
      pulse = 1;
      YG.floatText(floats, p.x + YG.rand(-20, 20), p.y - 20, '+' + YG.fmt(v));
      for (let i = 0; i < 5; i++) parts.push({ x: p.x, y: p.y, vx: YG.rand(-150, 150), vy: YG.rand(-250, -50), life: 0.8 });
    };
    C.cv.addEventListener('pointerdown', tap);

    let panelT = 0;
    const lp = YG.loop((dt) => {
      acc += cps() * dt * (boosted() ? 3 : 1);
      if (acc >= 1) { const v = api.coins(Math.floor(acc), true); gs.total += v; acc -= Math.floor(acc); }
      api.score(gs.total);
      panelT += dt; if (panelT > 0.5) { panelT = 0; renderPanel(); }
      nextGolden -= dt;
      if (nextGolden <= 0 && !golden) { golden = { x: -30, y: YG.rand(40, C.H * 0.5), t: 0 }; nextGolden = YG.rand(40, 80); }
      const ctx = C.ctx; C.bg();
      // лучи
      ctx.save(); ctx.translate(C.W / 2, C.H / 2); ctx.rotate(performance.now() / 4000);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -C.H); ctx.lineTo(30, -C.H); ctx.fill(); }
      ctx.restore();
      pulse = Math.max(0, pulse - dt * 6);
      const size = Math.min(C.W, C.H) * 0.42 * (1 + pulse * 0.08);
      YG.drawSprite(ctx, api.hero(), C.W / 2, C.H / 2, size);
      // фоновые генераторы
      gens.forEach((g, i) => { if (gs.gens[i]) YG.drawSprite(ctx, g.e, 30 + i * 38, C.H - 26, 28, Math.sin(performance.now() / 300 + i) * 0.2); });
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life; YG.drawSprite(ctx, '🪙', p.x, p.y, 16); ctx.globalAlpha = 1;
      }
      if (golden) {
        golden.t += dt; golden.x += 90 * dt; golden.y += Math.sin(golden.t * 3) * 1.5;
        YG.drawSprite(ctx, api.sp.item || '🌟', golden.x, golden.y, 44 + Math.sin(golden.t * 8) * 4);
        if (golden.x > C.W + 40) golden = null;
      }
      YG.drawFloats(ctx, floats, dt);
    });
    renderPanel();
    const saveT = setInterval(() => api.save(), 5000);
    return {
      pause: () => lp.pause(), resume: () => lp.resume(),
      destroy() { lp.stop(); C.destroy(); clearInterval(saveT); api.save(); host.innerHTML = ''; }
    };
  }
});

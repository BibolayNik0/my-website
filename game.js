(() => {
  // ================= DERIVED DATA =================
  const EVOLVES = {}, PREV = {};
  EVO.forEach(([a, b, c]) => { (EVOLVES[a] = EVOLVES[a] || []).push({ to: b, cost: c }); PREV[b] = a; });
  const family = (id) => { while (PREV[id]) id = PREV[id]; return id; };
  const depthOf = (id) => { let d = 0; while (PREV[id]) { id = PREV[id]; d++; } return d; };
  const SP = (id) => SPECIES[id - 1];
  function chainOf(id) {
    const out = [];
    const walk = (x, depth) => { out.push({ id: x, depth }); (EVOLVES[x] || []).forEach((e) => walk(e.to, depth + 1)); };
    walk(family(id), 0);
    return out;
  }
  const typeChip = (t) => `<span class="type" style="background:${TYPE_COLORS[t] || '#777'}">${t}</span>`;

  // Base stats (attack / defense / stamina), derived from evolution stage, rarity and type
  const STAT_PROFILE = {
    'Боевой': [1.3, 0.85, 0.85], 'Камень': [1, 1.3, 0.7], 'Земля': [1.05, 1.15, 0.8], 'Психический': [1.3, 0.9, 0.8],
    'Призрак': [1.25, 0.9, 0.85], 'Нормальный': [0.9, 0.9, 1.2], 'Фея': [0.85, 1, 1.15], 'Вода': [1, 1.05, 0.95],
    'Огонь': [1.15, 0.9, 0.95], 'Электро': [1.15, 0.9, 0.95], 'Лёд': [1, 1, 1], 'Трава': [1, 1, 1], 'Яд': [1, 0.95, 1.05],
    'Жук': [0.95, 1.05, 1], 'Летающий': [1.05, 0.9, 1.05], 'Дракон': [1.15, 0.95, 0.9],
  };
  const STAT_OVERRIDE = { 113: [0.4, 0.4, 2.2], 143: [1, 0.8, 1.2], 129: [0.4, 1.3, 1.3] };
  const BASE = {};
  function baseStats(id) {
    if (BASE[id]) return BASE[id];
    const sp = SP(id), d = depthOf(id), final = !EVOLVES[id];
    let total;
    if (sp.rarity === 5) total = id === 150 ? 690 : id === 151 ? 630 : 590;
    else if (id === 129) total = 200;
    else if (id === 130) total = 560;
    else {
      total = 290 + d * 120 + (final && d > 0 ? 40 : 0) + (d === 0 && final ? (sp.rarity >= 3 ? 230 : 110) : 0)
        + (sp.rarity >= 4 ? 60 : 0) + (sp.rarity >= 3 && d > 0 ? 60 : 0);
    }
    const r = rng(hash('stats' + id));
    total *= 0.92 + r() * 0.16;
    let p = (STAT_OVERRIDE[id] || STAT_PROFILE[sp.type] || [1, 1, 1]).map((x) => x * (0.9 + r() * 0.2));
    const sum = p[0] + p[1] + p[2];
    const [atk, def, sta] = p.map((x) => Math.round(total * x / sum));
    return (BASE[id] = { atk, def, sta });
  }
  const cpm = (lvl) => 0.094 + 0.6963 * Math.sqrt((lvl - 1) / 39);
  function calcCp(spId, lvl, iv) {
    const b = baseStats(spId), m = cpm(lvl);
    return Math.max(10, Math.floor((b.atk + iv.a) * Math.sqrt(b.def + iv.d) * Math.sqrt(b.sta + iv.h) * m * m / 10));
  }
  function battleStats(spId, lvl, iv) {
    const b = baseStats(spId), m = cpm(lvl);
    return { atk: (b.atk + iv.a) * m, def: (b.def + iv.d) * m, hp: Math.max(10, Math.floor((b.sta + iv.h) * m)) };
  }
  const ivPct = (iv) => Math.round((iv.a + iv.d + iv.h) / 45 * 100);
  const ivStars = (iv) => { const p = ivPct(iv); return p === 100 ? 4 : p >= 82 ? 3 : p >= 67 ? 2 : p >= 50 ? 1 : 0; };
  const randIv = (r, min = 0) => ({ a: min + Math.floor(r() * (16 - min)), d: min + Math.floor(r() * (16 - min)), h: min + Math.floor(r() * (16 - min)) });

  // ================= CONSTANTS =================
  const CELL = 0.0012;               // ~130 m grid cell
  const VIEW_CELLS = 4;
  const WINDOW_MS = 10 * 60 * 1000;  // wild spawns rotate every 10 min
  const TRAINER_WINDOW = 3 * 3600 * 1000;
  const RAID_WINDOW = 3600 * 1000;
  const CATCH_RADIUS = 70;           // m
  const STOP_RADIUS = 60;            // m
  const STOP_COOLDOWN = 5 * 60 * 1000;
  const INCENSE_MS = 15 * 60 * 1000;
  const LUCKY_MS = 30 * 60 * 1000;
  const SHINY_CHANCE = 1 / 100;
  const MAX_EGGS = 9;
  const MAX_SPEED = 10.5;            // m/s — faster than this does not count as walking
  const DEFAULT_POS = [55.7539, 37.6208]; // Red Square

  // ================= HELPERS =================
  const $ = (id) => document.getElementById(id);
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function dist(a, b) {
    const R = 6371000, toR = Math.PI / 180;
    const dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const isNight = () => { const h = new Date().getHours(); return h >= 21 || h < 6; };
  const today = () => new Date().toLocaleDateString('sv');
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString('sv'); };
  const fmtDist = (m) => m < 1000 ? Math.round(m) + ' м' : (m / 1000).toFixed(1) + ' км';
  const fmtTime = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const fmtNum = (n) => Math.floor(n).toLocaleString('ru-RU');
  const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

  // ================= SIZE & GENDER =================
  // size factor ~ mean of 3 uniforms in [0.64, 1.36]: about 5% XS (< 0.8) and 5% XL (> 1.2)
  function sizeGender(spId, r) {
    const sz = Math.round((0.64 + (r() + r() + r()) / 3 * 0.72) * 100) / 100;
    const rate = SIZES[spId - 1][2];
    return { sz, g: rate < 0 ? null : r() < rate / 8 ? 'f' : 'm' };
  }
  const sizeTag = (sz) => sz < 0.8 ? 'XS' : sz > 1.2 ? 'XL' : '';
  const genderIcon = (g) => g === 'f' ? '<span class="gender f">♀</span>' : g === 'm' ? '<span class="gender m">♂</span>' : '';
  function heightWeight(spId, sz) {
    const [h, w] = SIZES[spId - 1];
    return { h: (h / 10 * sz).toFixed(2).replace('.', ','), w: (w / 10 * sz * sz).toFixed(1).replace('.', ',') };
  }

  const newBuddyDefaults = (uid) => ({ uid, walked: 0, walkHeart: 0, food: 70, mood: 70, t: Date.now(), day: null, giftDay: '' });

  // ================= SAVE =================
  const SAVE_KEY = 'pokemon-go-v1';
  const DEFAULT_SETTINGS = { mapStyle: 'auto', buildings: true, tilt: true, sprites: 'anim', sound: true, music: true, vibro: true, saver: false, ar: false,
    radius: true, weatherFx: true };
  const defaultState = () => ({
    xp: 0, balls: { basic: 20, great: 5, ultra: 0 }, items: { berry: 3, incense: 1, lucky: 1, pass: 0, poffin: 1 }, candy: {},
    stardust: 1000, coins: 50,
    seen: {}, caught: {}, mons: [], gone: {}, stops: {}, beaten: {}, raidsDone: {},
    totalCaught: 0, walked: 0, spins: 0, evolved: 0, shinyCaught: 0, hatched: 0, trainerWins: 0, raidWins: 0, curveballs: 0, powerups: 0,
    eggs: [{ id: 1, km: 2, walked: 0 }], eggUid: 2, buddy: null, team: [],
    quests: null, lastCatchDay: '', incenseUntil: 0, luckyUntil: 0, freePassDay: '', streak: { last: '', count: 0 },
    medals: {}, tutorialDone: false, uid: 1, settings: { ...DEFAULT_SETTINGS },
    cards: {}, shinyCards: {}, shards: 0, packs: 1, setsClaimed: {},
    trainer: { name: '', look: '🧑', color: '#3d7dca', team: null },
    gear: { owned: { cap: true, sneakers: true }, equip: { head: 'cap', feet: 'sneakers' } }, gearShop: null,
    pass: null, journal: {}, xlCaught: 0, xsCaught: 0, gems: 0, offersBought: {},
  });
  function migrate(p) {
    const s = Object.assign(defaultState(), p);
    s.settings = Object.assign({ ...DEFAULT_SETTINGS }, p.settings || {});
    s.items = Object.assign({ berry: 0, incense: 0, lucky: 0, pass: 0, poffin: 0 }, p.items || defaultState().items);
    if (s.buddy) s.buddy = Object.assign(newBuddyDefaults(s.buddy.uid), s.buddy);
    s.balls = Object.assign({ basic: 0, great: 0, ultra: 0 }, p.balls || defaultState().balls);
    s.trainer = Object.assign(defaultState().trainer, p.trainer || {});
    s.mons.forEach((m) => {
      if (m.sz === undefined) Object.assign(m, sizeGender(m.sp, rng(hash('sg' + m.uid))));
      if (!m.uid) m.uid = s.uid++;
      if (!m.iv) {
        // old saves only stored CP: pick IVs and the level that best matches it
        const r = rng(hash('mig' + m.uid));
        m.iv = randIv(r);
        let best = 1, bd = 1e9;
        for (let l = 1; l <= 40; l++) { const d = Math.abs(calcCp(m.sp, l, m.iv) - m.cp); if (d < bd) { bd = d; best = l; } }
        m.lvl = best;
      }
      m.cp = calcCp(m.sp, m.lvl, m.iv);
    });
    return s;
  }
  let S = defaultState();
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) S = migrate(JSON.parse(raw)); } catch (e) {}
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

  // ================= BONUSES (gear + team) =================
  const GEAR_BY_ID = Object.fromEntries(GEAR.map((g) => [g.id, g]));
  function bonus(stat) {
    let v = 0;
    for (const slot in S.gear.equip) { const g = GEAR_BY_ID[S.gear.equip[slot]]; if (g && g.bonus[stat]) v += g.bonus[stat]; }
    const team = S.trainer.team && TEAMS[S.trainer.team];
    if (team && team.bonus[stat]) v += team.bonus[stat];
    return v;
  }
  const pct = (stat) => bonus(stat) / 100;
  const catchRadius = () => CATCH_RADIUS + bonus('radius');
  const stopRadius = () => STOP_RADIUS + bonus('radius');
  const dustGain = (n) => Math.round(n * (1 + pct('dust')));
  const shinyChance = () => SHINY_CHANCE * (1 + pct('shiny') + buddyPerk('shiny'));
  const bonusText = (b) => Object.keys(b).map((k) => `+${b[k]}${GEAR_STATS[k].unit} ${GEAR_STATS[k].label}`).join(', ');

  // ================= SPRITES =================
  const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
  const spriteUrl = (id, shiny, mode = spriteMode()) =>
    mode === 'anim' ? `${SPR}other/showdown/${shiny ? 'shiny/' : ''}${id}.gif` : `${SPR}${shiny ? 'shiny/' : ''}${id}.png`;
  const backUrl = (id, shiny, mode = spriteMode()) =>
    mode === 'anim' ? `${SPR}other/showdown/back/${shiny ? 'shiny/' : ''}${id}.gif` : `${SPR}back/${shiny ? 'shiny/' : ''}${id}.png`;
  const pixelUrl = (id, shiny) => `${SPR}${shiny ? 'shiny/' : ''}${id}.png`;
  const artUrl = (id, shiny) => `${SPR}other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;
  const fallback = (id) => `onerror="this.onerror=null;this.className=this.className.replace('anim','pixel');this.src='${SPR}${id}.png'"`;
  const sprImg = (id, shiny, cls = '') =>
    `<img class="spr ${spriteMode()} ${cls}" src="${spriteUrl(id, shiny)}" alt="" draggable="false" ${fallback(id)}>`;
  function sizeSprite(im, maxH, maxW, scale = 3) {
    const fit = () => { const k = Math.min(scale, maxH / im.naturalHeight, maxW / im.naturalWidth); im.style.width = im.naturalWidth * k + 'px'; im.style.height = im.naturalHeight * k + 'px'; };
    if (im.complete && im.naturalWidth) fit(); else im.onload = fit;
  }

  // ================= UI HELPERS =================
  let toastTimer;
  function toast(msg, ms = 1600) {
    const t = $('toast'); t.innerHTML = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), ms);
  }
  const popupQueue = [];
  function popup(html, onShow) {
    if ($('popup').classList.contains('on')) { popupQueue.push([html, onShow]); return; }
    $('popupBox').innerHTML = html; $('popup').classList.add('on');
    if (onShow) onShow($('popupBox'));
  }
  function closePopup() {
    $('popup').classList.remove('on');
    if (popupQueue.length) setTimeout(() => popup(...popupQueue.shift()), 150);
  }
  $('popup').addEventListener('click', (e) => { if (e.target.id === 'popup' || e.target.closest('[data-ok]')) closePopup(); });

  function burst(x, y, chars = ['✨', '⭐', '💫'], n = 14) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.textContent = chars[i % chars.length];
      const a = (i / n) * Math.PI * 2, r = 70 + Math.random() * 70;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.cos(a) * r + 'px'); p.style.setProperty('--dy', Math.sin(a) * r + 'px');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }
  function floatText(x, y, text, cls = '') {
    const d = document.createElement('div');
    d.className = 'dmg ' + cls; d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 950);
  }
  function flash() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 450); }
  const anyScreenOpen = () => !!document.querySelector('.screen.on');

  // ================= SOUND, MUSIC, VIBRATION =================
  let AC, master;
  function audio() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 1; master.connect(AC.destination); }
      catch (e) { return null; }
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d = 0.12, type = 'sine', v = 0.12, delay = 0, f2, at) {
    const a = audio(); if (!a) return;
    const t = at !== undefined ? at : a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(master); o.start(t); o.stop(t + d + 0.03);
  }
  const sfx = (fn) => () => { if (S.settings.sound) fn(); };
  const SFX = {
    tap: sfx(() => tone(660, 0.06, 'triangle', 0.07)),
    throw: sfx(() => tone(260, 0.3, 'sine', 0.12, 0, 900)),
    hit: sfx(() => tone(160, 0.12, 'square', 0.07)),
    wobble: sfx(() => tone(420, 0.08, 'triangle', 0.1)),
    miss: sfx(() => tone(300, 0.25, 'sine', 0.08, 0, 140)),
    catch: sfx(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.12, i * 0.09))),
    flee: sfx(() => tone(520, 0.45, 'sawtooth', 0.05, 0, 110)),
    spin: sfx(() => [880, 1175, 1568].forEach((f, i) => tone(f, 0.14, 'sine', 0.1, i * 0.06))),
    level: sfx(() => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, i * 0.11))),
    appear: sfx(() => [392, 523, 659].forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.08))),
    evolve: sfx(() => [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, i * 0.14))),
    berry: sfx(() => [700, 900].forEach((f, i) => tone(f, 0.1, 'sine', 0.08, i * 0.08))),
    attack: sfx(() => tone(220, 0.08, 'square', 0.06, 0, 120)),
    charge: sfx(() => { tone(200, 0.4, 'sawtooth', 0.08, 0, 800); tone(90, 0.5, 'square', 0.06, 0.1, 40); }),
    hurt: sfx(() => tone(140, 0.15, 'sawtooth', 0.07, 0, 70)),
    dodge: sfx(() => tone(900, 0.1, 'sine', 0.07, 0, 1400)),
    curve: sfx(() => [1200, 1500, 1800].forEach((f, i) => tone(f, 0.08, 'sine', 0.06, i * 0.05))),
    hatch: sfx(() => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.25, 'triangle', 0.11, i * 0.1))),
    coin: sfx(() => [988, 1319].forEach((f, i) => tone(f, 0.12, 'square', 0.05, i * 0.07))),
  };
  function vibrate(p) { if (S.settings.vibro && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }

  const music = { song: null, step: 0, next: 0, timer: null };
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function playMusic(name) {
    music.song = name;
    if (!S.settings.music || !AC) return stopMusicTimer();
    if (music.timer) return;
    music.step = 0; music.next = AC.currentTime + 0.1;
    music.timer = setInterval(() => {
      if (!S.settings.music || !music.song || document.hidden) return;
      const s = SONGS[music.song], dur = 60 / s.bpm / 2;
      while (music.next < AC.currentTime + 0.25) {
        const i = music.step % s.lead.length;
        if (s.lead[i]) tone(midi(s.lead[i]), dur * 0.9, 'square', 0.025, 0, null, music.next);
        if (s.bass[i]) tone(midi(s.bass[i]), dur * 0.95, 'triangle', 0.045, 0, null, music.next);
        music.step++; music.next += dur;
      }
      if (music.next < AC.currentTime) music.next = AC.currentTime + 0.05;
    }, 60);
  }
  function stopMusicTimer() { clearInterval(music.timer); music.timer = null; }
  document.addEventListener('pointerdown', () => { audio(); playMusic(music.song || 'map'); }, { once: true });

  // ================= LEVELS & REWARDS =================
  function levelFromXp(xp) { let lvl = 1, need = 1000, rest = xp; while (rest >= need) { rest -= need; lvl++; need = Math.round(need * 1.35); } return { lvl, rest, need }; }
  const playerLvl = () => levelFromXp(S.xp).lvl;
  function rewardLabel(k, n) {
    if (k === 'gear') { const g = GEAR_BY_ID[n]; return `${g.icon} ${g.name}`; }
    const def = BALLS[k] || ITEMS[k] || CURRENCY[k];
    return `${def.icon} ${k === 'dust' ? fmtNum(n) : '×' + n}`;
  }
  function grant(rew) {
    const parts = [];
    for (const k in rew) {
      const n = rew[k]; if (!n) continue;
      if (BALLS[k]) S.balls[k] += n;
      else if (k === 'dust') S.stardust += n;
      else if (k === 'coins') S.coins += n;
      else if (k === 'pack') S.packs += n;
      else if (k === 'shards') S.shards += n;
      else if (k === 'gems') S.gems += n;
      else if (k === 'gear') { if (!addGear(n)) { parts.push(`${rewardLabel(k, n)} → 🪙 ${GEAR_RARITY[GEAR_BY_ID[n].rarity].sell}`); continue; } }
      else S.items[k] = (S.items[k] || 0) + n;
      parts.push(rewardLabel(k, n));
    }
    save(); renderHud();
    return parts;
  }
  const rewardsHtml = (parts) => `<div class="rewards">${parts.map((p) => `<span>${p}</span>`).join('')}</div>`;
  function addXp(n) {
    n = Math.round(n * (1 + pct('xp')));
    if (S.luckyUntil > Date.now()) n *= 2;
    const before = playerLvl(); S.xp += n; const after = playerLvl();
    save(); renderHud();
    for (let l = before + 1; l <= after; l++) {
      const parts = grant({ basic: 10, great: 5, ultra: l >= 5 ? 3 : 0, berry: 3, incense: l % 3 === 0 ? 1 : 0, pass: l % 2 === 0 ? 1 : 0, coins: 20, pack: l % 5 === 0 ? 1 : 0, gems: l % 5 === 0 ? 20 : 0 });
      if (l % 5 === 0) addEgg(10); else if (l % 2 === 0) addEgg(5);
      if (l === 5 && !S.trainer.team) setTimeout(teamPicker, 300);
      setTimeout(() => { SFX.level(); vibrate([60, 40, 60]); }, 400);
      popup(`<div class="big">🎉</div><h2>Уровень ${l}!</h2><p>Редкие покемоны теперь встречаются чаще, а покемонов можно усиливать до уровня ${Math.min(40, l + 2)}.</p>
        ${rewardsHtml(parts)}<button class="btn" data-ok>Круто!</button>`);
    }
    return n;
  }

  // ================= QUESTS =================
  const QT = {
    catch:     { range: [5, 10], text: (q) => `Поймай ${q.n} ${acc(q.n, 'покемона', 'покемонов')}`, reward: { basic: 6, great: 1 } },
    type:      { range: [2, 4],  text: (q) => `Поймай ${q.n} ${acc(q.n, 'покемона', 'покемонов')} типа «${q.t}»`, reward: { great: 3 } },
    spin:      { range: [3, 6],  text: (q) => `Посети ${q.n} ${plural(q.n, 'покестоп', 'покестопа', 'покестопов')}`, reward: { berry: 3, basic: 3 } },
    excellent: { range: [2, 4],  text: (q) => `Сделай ${q.n} ${plural(q.n, 'отличный бросок', 'отличных броска', 'отличных бросков')}`, reward: { ultra: 2 } },
    curve:     { range: [2, 4],  text: (q) => `Сделай ${q.n} ${plural(q.n, 'кручёный бросок', 'кручёных броска', 'кручёных бросков')}`, reward: { great: 3, dust: 500 } },
    walk:      { range: [1, 2],  text: (q) => `Пройди ${q.n} км`, reward: { incense: 1 }, scale: 1000 },
    berry:     { range: [2, 4],  text: (q) => `Накорми ягодой ${q.n} ${acc(q.n, 'покемона', 'покемонов')}`, reward: { great: 2, berry: 2 } },
    evolve:    { range: [1, 2],  text: (q) => `Эволюционируй ${q.n} ${acc(q.n, 'покемона', 'покемонов')}`, reward: { ultra: 2, incense: 1 } },
    hatch:     { range: [1, 1],  text: () => 'Выведи покемона из яйца', reward: { dust: 1000, lucky: 1 } },
    battle:    { range: [1, 2],  text: (q) => `Победи ${q.n} ${acc(q.n, 'тренера', 'тренеров')}`, reward: { pass: 1, dust: 500 } },
    powerup:   { range: [2, 4],  text: (q) => `Усиль покемонов ${q.n} ${plural(q.n, 'раз', 'раза', 'раз')}`, reward: { dust: 1000 } },
  };
  const QTYPES = ['Вода', 'Трава', 'Огонь', 'Жук', 'Нормальный', 'Яд', 'Летающий'];
  function ensureQuests() {
    const d = today();
    if (S.quests && S.quests.day === d) return;
    const r = rng(hash('quests:' + d)), keys = Object.keys(QT), list = [];
    for (let i = 0; i < 4; i++) {
      const k = keys.splice(Math.floor(r() * keys.length), 1)[0], t = QT[k];
      const n = t.range[0] + Math.floor(r() * (t.range[1] - t.range[0] + 1));
      list.push({ k, n, t: k === 'type' ? QTYPES[Math.floor(r() * QTYPES.length)] : null, p: 0, claimed: false });
    }
    S.quests = { day: d, list }; save();
  }
  const questGoal = (q) => q.n * (QT[q.k].scale || 1);
  function quest(k, amount = 1, type) {
    ensureQuests();
    let finished = false;
    S.quests.list.forEach((q) => {
      if (q.k !== k || q.claimed || (k === 'type' && q.t !== type)) return;
      const goal = questGoal(q), was = q.p;
      q.p = Math.min(goal, q.p + amount);
      if (was < goal && q.p >= goal) finished = true;
    });
    save(); renderQuestDot();
    if (finished) setTimeout(() => { toast('📜 Задание выполнено!<br><small>Забери награду в профиле</small>', 2000); SFX.spin(); }, 300);
    checkMedals();
  }
  function renderQuestDot() {
    ensureQuests();
    const n = S.quests.list.filter((q) => !q.claimed && q.p >= questGoal(q)).length;
    $('questDot').textContent = n; $('questDot').classList.toggle('on', n > 0);
  }

  // ================= MEDALS =================
  const MEDALS = [
    { id: 'dex',     name: 'Коллекционер',   icon: '📖', val: () => Object.keys(S.caught).length, tiers: [10, 50, 151], unit: 'видов' },
    { id: 'catch',   name: 'Ловец',          icon: '🎯', val: () => S.totalCaught, tiers: [30, 300, 1500], unit: 'поймано' },
    { id: 'walk',    name: 'Путешественник', icon: '👟', val: () => S.walked / 1000, tiers: [5, 50, 200], unit: 'км' },
    { id: 'spin',    name: 'Исследователь',  icon: '🎁', val: () => S.spins, tiers: [20, 200, 1000], unit: 'покестопов' },
    { id: 'evolve',  name: 'Учёный',         icon: '🧬', val: () => S.evolved, tiers: [3, 30, 150], unit: 'эволюций' },
    { id: 'shiny',   name: 'Блеск',          icon: '✨', val: () => S.shinyCaught, tiers: [1, 5, 20], unit: 'блестящих' },
    { id: 'hatch',   name: 'Заводчик',       icon: '🥚', val: () => S.hatched, tiers: [3, 30, 150], unit: 'яиц' },
    { id: 'trainer', name: 'Боец',           icon: '🥊', val: () => S.trainerWins, tiers: [5, 50, 250], unit: 'побед' },
    { id: 'raid',    name: 'Рейдер',         icon: '🔥', val: () => S.raidWins, tiers: [1, 20, 100], unit: 'рейдов' },
    { id: 'curve',   name: 'Кручёный',       icon: '🌀', val: () => S.curveballs, tiers: [10, 100, 500], unit: 'бросков' },
    { id: 'cards',   name: 'Картограф',      icon: '🃏', val: () => cardsOwned(), tiers: [20, 75, 151], unit: 'карточек' },
    { id: 'xl',      name: 'Великан',        icon: '🐘', val: () => S.xlCaught, tiers: [1, 10, 50], unit: 'XL-покемонов' },
    { id: 'xs',      name: 'Кроха',          icon: '🐜', val: () => S.xsCaught, tiers: [1, 10, 50], unit: 'XS-покемонов' },
  ];
  const MEDAL_COINS = [50, 150, 400];
  const TIER_NAMES = ['Бронза', 'Серебро', 'Золото'];
  function checkMedals() {
    MEDALS.forEach((m) => {
      const v = m.val(), tier = m.tiers.filter((t) => v >= t).length, had = S.medals[m.id] || 0;
      if (tier > had) {
        S.medals[m.id] = tier;
        let coins = 0; for (let t = had; t < tier; t++) coins += MEDAL_COINS[t];
        S.coins += coins; S.packs += tier - had; S.gems += 5 * (tier - had); save(); renderHud();
        setTimeout(() => {
          SFX.coin();
          popup(`<div class="big">🏅</div><h2>Медаль «${m.name}»</h2><p>${TIER_NAMES[tier - 1]}: ${m.tiers[tier - 1]} ${m.unit}</p>
            ${rewardsHtml([rewardLabel('coins', coins), rewardLabel('pack', tier - had), rewardLabel('gems', 5 * (tier - had))])}<button class="btn" data-ok>Ура!</button>`);
        }, 800);
      }
    });
  }

  // ================= DAILY STREAK =================
  const STREAK_REWARDS = [
    { basic: 10, coins: 10 }, { berry: 3, coins: 10 }, { great: 5, coins: 15 }, { dust: 1000, coins: 15 },
    { incense: 1, coins: 20 }, { ultra: 3, coins: 25 }, { ultra: 5, pass: 1, lucky: 1, coins: 100, pack: 1 },
  ];
  function checkStreak() {
    const d = today();
    if (S.streak.last === d) return;
    S.streak.count = S.streak.last === yesterday() ? S.streak.count + 1 : 1;
    S.streak.last = d;
    const day = (S.streak.count - 1) % 7, rew = STREAK_REWARDS[day];
    const parts = grant(rew);
    if (day === 6) { addEgg(10); parts.push('🥚 10 км'); }
    passXp(PASS_POINTS.streak);
    save();
    popup(`<div class="big">📅</div><h2>Ежедневный бонус</h2><p>Ты заходишь ${S.streak.count} ${plural(S.streak.count, 'день', 'дня', 'дней')} подряд!</p>
      ${streakHtml()}${rewardsHtml(parts)}<button class="btn" data-ok>Забрать</button>`);
  }
  function streakHtml() {
    const day = (S.streak.count - 1) % 7;
    return '<div class="streak">' + STREAK_REWARDS.map((r, i) =>
      `<div class="${i < day ? 'done' : i === day ? 'now' : ''}"><b>${i === 6 ? '🎁' : i < day ? '✓' : i + 1}</b>день</div>`).join('') + '</div>';
  }
  const acc = (n, one, many) => n === 1 ? one : many;
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };

  // ================= HUD =================
  function renderHud() {
    const { lvl, rest, need } = levelFromXp(S.xp);
    $('lvlNum').textContent = lvl;
    $('lvlText').textContent = `${S.trainer.name || 'Тренер'} · ур. ${lvl}`;
    $('xpText').textContent = `${fmtNum(rest)} / ${fmtNum(need)} XP`;
    $('xpFill').style.width = (rest / need * 100) + '%';
    $('gemCount').textContent = fmtNum(S.gems);
    if (typeof buddyBubble === 'function') { const bb = S.buddy ? buddyBubble() : ''; $('buddyDot').textContent = bb; $('buddyDot').classList.toggle('on', !!bb); }
    $('packDot').textContent = S.packs; $('packDot').classList.toggle('on', S.packs > 0);
    renderEggChip();
  }
  function renderEggChip() {
    const egg = S.eggs.slice().sort((a, b) => (a.km * 1000 - a.walked) - (b.km * 1000 - b.walked))[0];
    $('eggChip').classList.toggle('on', !!egg);
    if (egg) $('eggText').textContent = `${(egg.walked / 1000).toFixed(1)}/${egg.km} км`;
  }
  function buffTick() {
    const now = Date.now();
    const inc = S.incenseUntil - now, luck = S.luckyUntil - now;
    $('incenseChip').classList.toggle('on', inc > 0); if (inc > 0) $('incenseTime').textContent = fmtTime(inc);
    $('luckyChip').classList.toggle('on', luck > 0); if (luck > 0) $('luckyTime').textContent = `×2 XP ${fmtTime(luck)}`;
    if (inc > 0) incenseSpawnTick();
  }
  setInterval(buffTick, 1000);

  // ================= WEATHER =================
  let weather = null; // { kind, temp, day }
  let lastWeatherFetch = 0;
  function weatherKind(code, wind) {
    let k = 'cloudy';
    if (code <= 1) k = 'clear';
    else if (code === 2) k = 'partly';
    else if (code === 3) k = 'cloudy';
    else if (code === 45 || code === 48) k = 'fog';
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) k = 'rain';
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) k = 'snow';
    if (wind >= 30 && ['clear', 'partly', 'cloudy'].includes(k)) k = 'windy';
    return k;
  }
  async function fetchWeather() {
    if (!pos || Date.now() - lastWeatherFetch < 25 * 60000) return;
    lastWeatherFetch = Date.now();
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos[0].toFixed(3)}&longitude=${pos[1].toFixed(3)}&current=weather_code,temperature_2m,is_day,wind_speed_10m`;
      const res = await fetch(url); const j = await res.json(); const c = j.current;
      const kind = weatherKind(c.weather_code, c.wind_speed_10m);
      const changed = !weather || weather.kind !== kind;
      weather = { kind, temp: Math.round(c.temperature_2m), day: !!c.is_day };
      renderWeather();
      if (changed) refreshWorld();
    } catch (e) { lastWeatherFetch = Date.now() - 20 * 60000; }
  }
  setInterval(fetchWeather, 5 * 60000);
  const boostedTypes = () => weather ? WEATHER[weather.kind].types : [];
  const isBoosted = (sp) => boostedTypes().includes(sp.type);
  function weatherIcon() { const w = WEATHER[weather.kind]; return (!weather.day && w.night) || w.icon; }
  function renderWeather() {
    const chip = $('weatherChip');
    chip.classList.toggle('on', !!weather);
    if (!weather) return;
    chip.textContent = `${weatherIcon()} ${weather.temp}°`;
    $('weatherFx').innerHTML = S.settings.weatherFx && !S.settings.saver ? fxHtml(weather.kind) : '';
  }
  function fxHtml(kind, n = 1) {
    let h = '';
    if (kind === 'rain') for (let i = 0; i < 60 * n; i++) h += `<i class="drop" style="left:${Math.random() * 110}%;animation-duration:${0.5 + Math.random() * 0.4}s;animation-delay:${-Math.random() * 2}s"></i>`;
    if (kind === 'snow') for (let i = 0; i < 40 * n; i++) h += `<i class="flake" style="left:${Math.random() * 100}%;animation-duration:${6 + Math.random() * 6}s;animation-delay:${-Math.random() * 10}s;font-size:${8 + Math.random() * 10}px">❄</i>`;
    if (kind === 'fog') h += '<div class="fog"></div>';
    if (kind === 'windy') for (let i = 0; i < 10; i++) h += `<i class="windline" style="top:${Math.random() * 100}%;animation-duration:${1.5 + Math.random() * 2}s;animation-delay:${-Math.random() * 3}s"></i>`;
    return h;
  }
  $('weatherChip').addEventListener('click', () => {
    if (!weather) return;
    const w = WEATHER[weather.kind];
    popup(`<div class="big">${weatherIcon()}</div><h2>${w.name}, ${weather.temp}°</h2>
      <p>Погода усиливает покемонов типов:</p><div>${w.types.map(typeChip).join(' ')}</div>
      <p>Их больше вокруг, у них выше уровень, и за них дают на 25% больше опыта и пыли.</p><button class="btn" data-ok>Понятно</button>`);
  });

  // ================= MAP =================
  const STYLES = {
    day: 'https://tiles.openfreemap.org/styles/liberty',
    night: 'https://tiles.openfreemap.org/styles/dark',
    light: 'https://tiles.openfreemap.org/styles/positron',
  };
  const styleKey = () => S.settings.mapStyle === 'auto' ? (isNight() ? 'night' : 'day') : S.settings.mapStyle;
  let curStyle = styleKey();
  const PITCH = 55, ZOOM = 16.3;
  const map = new maplibregl.Map({
    container: 'map', style: STYLES[curStyle], center: [DEFAULT_POS[1], DEFAULT_POS[0]], zoom: ZOOM,
    pitch: S.settings.tilt ? PITCH : 0, maxPitch: 70, minZoom: 13, attributionControl: { compact: true },
  });
  map.doubleClickZoom.disable();
  map.on('style.load', () => {
    try {
      const has = map.getStyle().layers.some((l) => l.type === 'fill-extrusion');
      if (!has && map.getSource('openmaptiles')) {
        map.addLayer({ id: 'pk-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14,
          paint: { 'fill-extrusion-color': curStyle === 'night' ? '#2c3658' : '#dcd6ce',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.85 } });
      }
    } catch (e) {}
    applyBuildings();
  });
  map.on('idle', () => { if (pos && updateBiomes()) refreshWorld(); });
  function applyBuildings() {
    try {
      map.getStyle().layers.forEach((l) => {
        if (l.type === 'fill-extrusion') map.setLayoutProperty(l.id, 'visibility', S.settings.buildings ? 'visible' : 'none');
      });
    } catch (e) {}
  }
  function applyMapStyle() {
    const k = styleKey();
    if (k !== curStyle) { curStyle = k; map.setStyle(STYLES[k], { diff: false }); }
  }
  setInterval(applyMapStyle, 60000);

  const groundEl = document.createElement('div');
  groundEl.className = 'ground-marker';
  groundEl.innerHTML = '<div class="range"></div><div class="pulse"></div>';
  const groundMarker = new maplibregl.Marker({ element: groundEl, pitchAlignment: 'map', rotationAlignment: 'map' })
    .setLngLat([DEFAULT_POS[1], DEFAULT_POS[0]]).addTo(map);
  const avatarEl = document.createElement('div');
  avatarEl.className = 'avatar';
  const avatarMarker = new maplibregl.Marker({ element: avatarEl, anchor: 'bottom' }).setLngLat([DEFAULT_POS[1], DEFAULT_POS[0]]).addTo(map);
  const buddyEl = document.createElement('div');
  buddyEl.className = 'buddy';
  buddyEl.addEventListener('click', (e) => { e.stopPropagation(); openBuddy(); });
  const buddyMarker = new maplibregl.Marker({ element: buddyEl, anchor: 'bottom', offset: [42, -2] }).setLngLat([DEFAULT_POS[1], DEFAULT_POS[0]]).addTo(map);
  function renderBuddyMarker() {
    const m = S.buddy && S.mons.find((x) => x.uid === S.buddy.uid);
    if (!m) { buddyEl.innerHTML = ''; return; }
    const bub = buddyBubble();
    buddyEl.innerHTML = `${bub ? `<div class="bd-bubble">${bub}</div>` : ''}<img src="${spriteUrl(m.sp, m.shiny)}" alt="" ${fallback(m.sp)}>`;
  }
  function updateRange() {
    const lat = pos ? pos[0] : DEFAULT_POS[0];
    const mpp = 40075016.686 * Math.cos(lat * Math.PI / 180) / (512 * Math.pow(2, map.getZoom()));
    const px = 2 * catchRadius() / mpp, r = groundEl.querySelector('.range');
    r.style.width = r.style.height = px + 'px';
    r.style.display = S.settings.radius ? 'block' : 'none';
  }
  map.on('zoom', updateRange);
  map.on('rotate', () => { $('compassIcon').style.transform = `rotate(${-map.getBearing() - 45}deg)`; });

  let pos = null, follow = true, lastPos = null, lastPosT = 0;
  map.on('dragstart', () => { follow = false; });

  function setPos(p, instant) {
    const now = Date.now();
    if (lastPos) {
      const d = dist(lastPos, p), dt = Math.max(0.5, (now - lastPosT) / 1000);
      // ignore GPS jitter and driving
      if (d > 3 && d < 300 && d / dt <= MAX_SPEED && !isBlocked()) { walk(d); journalRoute(p); }
    }
    lastPos = p; lastPosT = now; pos = p;
    const ll = [p[1], p[0]];
    groundMarker.setLngLat(ll); avatarMarker.setLngLat(ll); buddyMarker.setLngLat(ll);
    updateRange();
    if (follow) instant ? map.jumpTo({ center: ll }) : map.easeTo({ center: ll, duration: 500 });
    refreshWorld();
    fetchWeather();
  }

  // Walking: eggs, buddy candy, quests
  function walk(d) {
    S.walked += d;
    journalDay().m += d;
    quest('walk', d);
    ensurePass(); S.pass.m = (S.pass.m || 0) + d;
    while (S.pass.m >= 1000) { S.pass.m -= 1000; passXp(PASS_POINTS.km); }
    const hatchNow = [];
    S.eggs.forEach((e) => { e.walked = Math.min(e.km * 1000, e.walked + d * (1 + pct('egg'))); if (e.walked >= e.km * 1000) hatchNow.push(e); });
    if (S.buddy) {
      const m = S.mons.find((x) => x.uid === S.buddy.uid);
      if (m) {
        S.buddy.walked += d;
        S.buddy.walkHeart = (S.buddy.walkHeart || 0) + d;
        if (S.buddy.walkHeart >= 1000) { S.buddy.walkHeart -= 1000; const got = addHearts('walk', 1); if (got) toast(`🐾 ${SP(m.sp).name}: ❤️ +${got} за прогулку`, 1600); }
        const need = buddyKm(m) * 1000;
        if (S.buddy.walked >= need) {
          S.buddy.walked -= need;
          const fam = family(m.sp), n = buddyPerk('candy'); S.candy[fam] = (S.candy[fam] || 0) + n;
          toast(`<img src="${pixelUrl(m.sp, m.shiny)}" alt="">${SP(m.sp).name} нашёл ${n > 1 ? n + ' конфеты' : 'конфету'}! 🍬`, 2200);
          SFX.coin();
        }
      } else S.buddy = null;
    }
    save(); renderEggChip();
    hatchNow.forEach(hatch);
  }
  const buddyKm = (m) => [1, 1, 3, 5, 5, 5][SP(m.sp).rarity];

  // ================= BIOMES =================
  const biomeCache = new Map(), poiCache = new Map();
  const STOP_COLORS = ['#2f80ed', '#1aa1b8', '#7b61ff', '#e0569b', '#14a37f', '#e8873a'];
  const cellKey = (i, j) => i + ':' + j;
  function inRing(pt, ring) {
    let inside = false;
    for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
      const [xi, yi] = ring[a], [xj, yj] = ring[b];
      if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function inFeature(pt, f) {
    const g = f.geometry; if (!g) return false;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.some((poly) => inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h)));
  }
  function withBbox(features) {
    return features.map((f) => {
      let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
      const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      polys.forEach((p) => p[0].forEach(([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }));
      return { f, b: [x0, y0, x1, y1] };
    });
  }
  // Classifies grid cells that are on screen and fully loaded; returns true if anything new was learnt
  function updateBiomes() {
    if (!pos || !map.isStyleLoaded() || !map.areTilesLoaded() || map.getZoom() < 14 || !map.getSource('openmaptiles')) return false;
    const bounds = map.getBounds();
    const ci = Math.floor(pos[0] / CELL), cj = Math.floor(pos[1] / CELL);
    const todo = [];
    for (let i = ci - VIEW_CELLS; i <= ci + VIEW_CELLS; i++) for (let j = cj - VIEW_CELLS; j <= cj + VIEW_CELLS; j++) {
      const k = cellKey(i, j);
      if (!biomeCache.has(k) && bounds.contains([(j + 0.5) * CELL, (i + 0.5) * CELL])) todo.push([i, j, k]);
    }
    if (!todo.length) return false;
    let water, park, pois;
    try {
      water = withBbox(map.querySourceFeatures('openmaptiles', { sourceLayer: 'water' }));
      const green = new Set(['grass', 'wood', 'farmland', 'wetland', 'park']);
      park = withBbox(map.querySourceFeatures('openmaptiles', { sourceLayer: 'park' })
        .concat(map.querySourceFeatures('openmaptiles', { sourceLayer: 'landcover' }).filter((f) => green.has(f.properties.class))));
      pois = map.querySourceFeatures('openmaptiles', { sourceLayer: 'poi' })
        .filter((f) => f.geometry && f.geometry.type === 'Point' && poiName(f.properties));
    } catch (e) { return false; }
    const hits = (pt, list) => list.some(({ f, b }) => pt[0] >= b[0] && pt[0] <= b[2] && pt[1] >= b[1] && pt[1] <= b[3] && inFeature(pt, f));
    todo.forEach(([i, j, k]) => {
      let w = 0, g = 0;
      [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]].forEach(([a, b]) => {
        const pt = [(j + b) * CELL, (i + a) * CELL];
        if (hits(pt, water)) w++; else if (hits(pt, park)) g++;
      });
      biomeCache.set(k, w >= 1 ? 'water' : g >= 2 ? 'park' : 'city');
      let best = null;
      pois.forEach((f) => {
        const [x, y] = f.geometry.coordinates;
        if (y < i * CELL || y >= (i + 1) * CELL || x < j * CELL || x >= (j + 1) * CELL) return;
        const tier = poiTier(f.properties);
        if (tier < 0) return;
        const rank = tier * 1e8 + (f.properties.rank || 99) * 1e6 + (hash(poiName(f.properties)) % 1e6);
        if (!best || rank < best.rank) best = { rank, f, ll: [y, x] };
      });
      poiCache.set(k, best ? { ll: best.ll, name: poiName(best.f.properties), icon: POI_ICONS[best.f.properties.subclass] || POI_ICONS[best.f.properties.class] || '📍' } : null);
    });
    return true;
  }
  const biomeOf = (i, j) => biomeCache.get(cellKey(i, j)) || 'city';
  // 0 = landmark, 1 = place to hang out, 2 = ordinary, -1 = never a Pokéstop
  const POI_TIERS = [
    ['attraction', 'museum', 'monument', 'memorial', 'castle', 'fountain', 'art_gallery', 'arts_centre', 'theatre', 'viewpoint', 'zoo', 'aquarium',
      'place_of_worship', 'church', 'park', 'garden', 'stadium', 'library', 'town_hall', 'artwork', 'ruins', 'archaeological_site'],
    ['cafe', 'restaurant', 'ice_cream', 'bakery', 'bar', 'beer', 'pub', 'cinema', 'music', 'playground', 'swimming', 'sports_centre', 'college',
      'school', 'university', 'books', 'fast_food'],
  ];
  const POI_SKIP = new Set(['hospital', 'clinic', 'doctors', 'dentist', 'pharmacy', 'atm', 'bank', 'toilets', 'fuel', 'parking', 'car', 'laundry',
    'cemetery', 'entrance', 'veterinary', 'funeral_directors']);
  function poiTier(p) {
    if (POI_SKIP.has(p.class) || POI_SKIP.has(p.subclass)) return -1;
    for (let t = 0; t < POI_TIERS.length; t++) if (POI_TIERS[t].includes(p.subclass) || POI_TIERS[t].includes(p.class)) return t;
    return 2;
  }
  const poiName = (p) => p['name:ru'] || p.name || p['name:latin'] || p.name_int || '';

  // ================= WORLD =================
  function speciesPick(r, biome) {
    const night = isNight(), lvl = playerLvl(), boosted = boostedTypes(), bb = BIOMES[biome || 'city'].boost;
    const pool = SPECIES.map((s) => {
      let w = RARITY[s.rarity].weight;
      if (s.night) w *= night ? 3 : 0.4;
      if (s.rarity >= 3) w *= 1 + lvl * 0.08;
      if (boosted.includes(s.type)) w *= 2.5;
      if (bb[s.type]) w *= bb[s.type];
      return [s, w];
    });
    let x = r * pool.reduce((a, [, w]) => a + w, 0);
    for (const [s, w] of pool) { if ((x -= w) <= 0) return s; }
    return pool[0][0];
  }
  function wildMon(sp, r, extra = {}) {
    const boosted = isBoosted(sp);
    const maxL = Math.min(30, playerLvl() + 4);
    const lvl = Math.min(35, 1 + Math.floor(r() * maxL) + (boosted ? 5 : 0));
    const iv = randIv(r, boosted ? 4 : 0);
    return Object.assign({ sp, lvl, iv, cp: calcCp(sp.id, lvl, iv), boosted }, sizeGender(sp.id, r), extra);
  }

  function generate() {
    const win = Math.floor(Date.now() / WINDOW_MS), twin = Math.floor(Date.now() / TRAINER_WINDOW), rwin = Math.floor(Date.now() / RAID_WINDOW);
    const ci = Math.floor(pos[0] / CELL), cj = Math.floor(pos[1] / CELL);
    const mons = [], stops = [], npcs = [];
    for (let i = ci - VIEW_CELLS; i <= ci + VIEW_CELLS; i++) {
      for (let j = cj - VIEW_CELLS; j <= cj + VIEW_CELLS; j++) {
        // stops appear once their cell has been checked for real places, so names and positions never jump
        const rs = rng(hash(`stop:${i}:${j}`)), poi = poiCache.get(cellKey(i, j)), roll = rs();
        if (poiCache.has(cellKey(i, j)) && (roll < 0.22 || (poi && roll < 0.55))) {
          const fb = STOP_FALLBACK[hash(`stopname:${i}:${j}`) % STOP_FALLBACK.length];
          const ll = [(i + rs()) * CELL, (j + rs()) * CELL];
          const stop = poi ? { id: `s${i}_${j}`, ll: poi.ll, name: poi.name, icon: poi.icon, poi: true }
            : { id: `s${i}_${j}`, ll, name: fb[1], icon: fb[0], poi: false };
          stop.color = STOP_COLORS[hash(stop.name) % STOP_COLORS.length];
          const rr = rng(hash(`raid:${i}:${j}:${rwin}`));
          if (rr() < 0.12) {
            const tier = rr() < 0.15 ? 5 : rr() < 0.45 ? 4 : 3;
            const cands = SPECIES.filter((s) => s.rarity === tier);
            const boss = pick(cands, rr);
            stop.raid = { id: `r${i}_${j}_${rwin}`, tier, sp: boss, ends: (rwin + 1) * RAID_WINDOW };
            if (S.raidsDone[stop.raid.id]) stop.raid = null;
          }
          stops.push(stop);
        }
        const rt = rng(hash(`npc:${i}:${j}:${twin}`));
        if (rt() < 0.05) {
          const id = `t${i}_${j}_${twin}`;
          if (!S.beaten[id]) npcs.push({ id, ll: [(i + rt()) * CELL, (j + rt()) * CELL], name: pick(TRAINER_NAMES, rt), look: pick(TRAINER_LOOKS, rt), seed: hash(id) });
        }
        const r = rng(hash(`mon:${i}:${j}:${win}`));
        const n = r() < 0.55 ? (r() < 0.25 ? 2 : 1) : 0;
        const biome = biomeOf(i, j);
        for (let k = 0; k < n; k++) {
          const sp = speciesPick(r(), biome);
          const ll = [(i + r()) * CELL, (j + r()) * CELL];
          const shiny = r() < shinyChance();
          const id = `m${i}_${j}_${win}_${k}_${sp.id}`;
          const mon = wildMon(sp, r, { id, ll, shiny });
          if (!S.gone[id]) mons.push(mon);
        }
      }
    }
    return { mons, stops, npcs };
  }

  let incenseSpawns = [], lastIncense = 0;
  function incenseSpawnTick() {
    if (!pos || Date.now() - lastIncense < 40000) return;
    lastIncense = Date.now();
    const r = Math.random, a = r() * Math.PI * 2, d = 20 + r() * 40;
    const ci = Math.floor(pos[0] / CELL), cj = Math.floor(pos[1] / CELL);
    const sp = speciesPick(r(), biomeOf(ci, cj));
    incenseSpawns.push(wildMon(sp, r, { id: 'i' + Date.now(), shiny: r() < shinyChance() * 2, exp: Date.now() + 5 * 60000,
      ll: [pos[0] + (d * Math.cos(a)) / 111320, pos[1] + (d * Math.sin(a)) / (111320 * Math.cos(pos[0] * Math.PI / 180))] }));
    refreshWorld();
    toast('🪔 Ладан приманил покемона!', 1300);
  }

  const markers = new Map();
  function refreshWorld() {
    if (!pos) return;
    const now = Date.now();
    const { mons, stops, npcs } = generate();
    incenseSpawns = incenseSpawns.filter((m) => m.exp > now && !S.gone[m.id]);
    const want = new Map();
    mons.concat(incenseSpawns).forEach((m) => want.set(m.id, { kind: 'mon', data: m }));
    npcs.forEach((t) => want.set(t.id, { kind: 'npc', data: t }));
    stops.forEach((s) => {
      const used = S.stops[s.id] && now - S.stops[s.id] < STOP_COOLDOWN;
      if (used && !s.raid) return;
      const key = s.id + (s.poi ? 'p' : '') + (s.raid ? '_' + s.raid.id : '') + (used ? '_u' : '');
      want.set(key, { kind: 'stop', data: s, used });
    });

    markers.forEach((v, id) => { if (!want.has(id)) { v.marker.remove(); markers.delete(id); } });
    want.forEach((v, id) => { if (!markers.has(id)) createMarker(id, v); });

    const nearby = [];
    markers.forEach((v) => {
      if (v.kind === 'stop') {
        if (v.data.raid) { const b = v.el.querySelector('.raid-badge'); if (b) b.textContent = `РЕЙД ${'★'.repeat(v.data.raid.tier - 2)} · ${fmtTime(v.data.raid.ends - now)}`; }
        const sd = dist(pos, v.data.ll);
        v.el.classList.toggle('near', sd <= stopRadius()); v.el.classList.toggle('close', sd <= 160);
      }
      if (v.kind !== 'mon') return;
      const d = dist(pos, v.data.ll), close = d <= catchRadius();
      if (v.close !== close) { v.close = close; v.el.classList.toggle('far', !close); }
      if (d < 400) nearby.push({ m: v.data, d });
    });
    nearby.sort((a, b) => a.d - b.d);
    const nearCount = nearby.filter((x) => x.d <= catchRadius()).length;
    const ci = Math.floor(pos[0] / CELL), cj = Math.floor(pos[1] / CELL), bm = BIOMES[biomeOf(ci, cj)];
    pocketCheck();
    buddyNotice();
    $('status').textContent = `${bm.icon} ${bm.name} · ` +
      (nearCount ? `Можно поймать: ${nearCount}` : nearby.length ? 'Подойди к покемону' : 'Гуляй, чтобы найти покемонов');
    cleanup();
  }
  function createMarker(id, v) {
    const el = document.createElement('div');
    if (v.kind === 'mon') {
      const m = v.data;
      el.className = `mon r${m.sp.rarity} far`;
      el.innerHTML = `<div class="mon-shadow"></div>${sprImg(m.sp.id, m.shiny)}${m.shiny ? '<span class="sparkle">✨</span>' : ''}${m.boosted && weather ? `<span class="boost">${weatherIcon()}</span>` : ''}`;
      el.addEventListener('click', (e) => { e.stopPropagation(); tryEncounter(m); });
    } else if (v.kind === 'npc') {
      const t = v.data;
      el.className = 'npc';
      el.innerHTML = `<div class="vs">VS</div><div class="look">${t.look}</div><div class="base"></div>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); tryTrainer(t); });
    } else {
      const s = v.data;
      el.className = 'ps' + (v.used ? ' used' : '') + (s.raid ? ' raid' : '');
      el.style.setProperty('--c', s.color);
      el.innerHTML = (s.raid ? `<div class="raid-badge"></div><div class="boss"><img src="${spriteUrl(s.raid.sp.id, false)}" alt="" ${fallback(s.raid.sp.id)}></div>` : '') +
        `<div class="ps-label">${s.name}</div><div class="ps-disc"><div class="ps-ring"></div><div class="ps-face">${s.icon}</div></div>
        <div class="ps-pole"></div><div class="ps-base"></div>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); s.raid ? raidMenu(s, e) : openStop(s); });
    }
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([v.data.ll[1], v.data.ll[0]]).addTo(map);
    markers.set(id, { marker, el, kind: v.kind, data: v.data, close: false });
  }
  function rebuildMarkers() { markers.forEach((v) => v.marker.remove()); markers.clear(); refreshWorld(); renderBuddyMarker(); }
  function cleanup() {
    const win = Math.floor(Date.now() / WINDOW_MS), now = Date.now(); let changed = false;
    for (const id in S.gone) if (S.gone[id] < win - 1) { delete S.gone[id]; changed = true; }
    for (const id in S.stops) if (now - S.stops[id] > STOP_COOLDOWN) { delete S.stops[id]; changed = true; }
    for (const id in S.beaten) if (now - S.beaten[id] > TRAINER_WINDOW * 2) { delete S.beaten[id]; changed = true; }
    for (const id in S.raidsDone) if (now - S.raidsDone[id] > RAID_WINDOW * 2) { delete S.raidsDone[id]; changed = true; }
    if (changed) save();
  }
  setInterval(refreshWorld, 10000);

  // ================= POKÉSTOPS =================
  function randomGear(r, maxRarity) {
    const pool = GEAR.filter((g) => !g.exclusive && g.rarity <= maxRarity);
    const w = pool.map((g) => [g, [0, 10, 5, 2, 1][g.rarity]]);
    let x = r() * w.reduce((a, [, n]) => a + n, 0);
    for (const [g, n] of w) if ((x -= n) <= 0) return g;
    return pool[0];
  }
  function spinStop(s) {
    const r = Math.random, rew = {
      basic: 3 + Math.floor(r() * 3),
      great: (r() < 0.4 ? 1 + Math.floor(r() * 2) : 0) + bonus('stop'),
      ultra: r() < 0.1 ? 1 : 0,
      berry: r() < 0.35 ? 1 + Math.floor(r() * 2) : 0,
      incense: r() < 0.03 ? 1 : 0,
    };
    const loot = Object.keys(rew).filter((k) => rew[k]).map((k) => [(BALLS[k] || ITEMS[k]).icon, '×' + rew[k]]);
    grant(rew);
    if (r() < 0.14 && S.eggs.length < MAX_EGGS) { const km = r() < 0.5 ? 2 : r() < 0.8 ? 5 : 10; addEgg(km); loot.push(['🥚', km + ' км']); }
    if (r() < 0.02) { const g = randomGear(r, 2); if (addGear(g.id)) loot.push([g.icon, g.name]); }
    S.stops[s.id] = Date.now(); S.spins++; journalDay().s++; save();
    SFX.spin(); vibrate(40);
    quest('spin'); passXp(PASS_POINTS.spin);
    const xp = addXp(50);
    refreshWorld();
    return { loot, xp };
  }

  // Full-screen Pokéstop: spin the photo disc with a finger to get items
  let stopUi = null;
  function openStop(s) {
    const now = Date.now(), used = S.stops[s.id] && now - S.stops[s.id] < STOP_COOLDOWN;
    const d = dist(pos, s.ll), far = d > stopRadius();
    const view = $('stopView');
    view.style.setProperty('--c', s.color);
    view.innerHTML = `
      <button class="close sv-close" id="svClose">✕</button>
      <div class="sv-head"><div class="sv-name">${s.name}</div>
        <div class="sv-sub">${s.poi ? '📍 Настоящее место' : '📍 Покестоп'} · ${fmtDist(d)}${s.raid ? ' · 🔥 Рейд' : ''}</div></div>
      <div class="sv-disc-wrap"><div class="sv-disc ${used ? 'used' : ''}" id="svDisc"><div class="sv-photo">${s.icon}</div></div></div>
      <div class="sv-hint" id="svHint">${far ? `Подойди ближе — ещё ${fmtDist(d - stopRadius())}` : used ? `Перезарядка: ${fmtTime(STOP_COOLDOWN - (now - S.stops[s.id]))}` : 'Крути диск пальцем! 👆'}</div>
      <div class="sv-loot" id="svLoot"></div>`;
    view.classList.add('on');
    stopUi = { s, angle: 0, lastA: null, can: !far && !used, done: false };
    $('svClose').onclick = closeStop;
    SFX.tap();
  }
  function closeStop() { $('stopView').classList.remove('on'); stopUi = null; }
  $('stopView').addEventListener('pointerdown', (e) => {
    const disc = e.target.closest('#svDisc');
    if (!disc || !stopUi) return;
    disc.setPointerCapture(e.pointerId);
    stopUi.drag = true; stopUi.lastA = null;
  });
  $('stopView').addEventListener('pointermove', (e) => {
    if (!stopUi || !stopUi.drag || stopUi.done) return;
    const disc = $('svDisc'), r = disc.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    if (stopUi.lastA !== null) { let da = a - stopUi.lastA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; stopUi.angle += da; }
    stopUi.lastA = a;
    disc.style.transform = `rotate(${stopUi.angle}rad)`;
    if (Math.abs(stopUi.angle) > Math.PI * 1.2) {
      if (stopUi.can) doSpin();
      else if (!stopUi.warned) { stopUi.warned = true; SFX.miss(); vibrate(60); }
    }
  });
  $('stopView').addEventListener('pointerup', () => { if (stopUi) { stopUi.drag = false; if (!stopUi.done) { const d = $('svDisc'); d.style.transition = 'transform .4s'; d.style.transform = ''; setTimeout(() => { d.style.transition = ''; }, 400); stopUi.angle = 0; } } });
  function doSpin() {
    const ui = stopUi; ui.done = true;
    const disc = $('svDisc');
    disc.style.setProperty('--from', `${ui.angle}rad`);
    disc.style.transform = '';
    disc.classList.add('spin');
    const { loot, xp } = spinStop(ui.s);
    setTimeout(() => disc.classList.add('used'), 700);
    const box = $('svLoot'), dr = disc.getBoundingClientRect();
    box.style.left = dr.left + dr.width / 2 + 'px'; box.style.top = dr.top + dr.height / 2 + 'px';
    loot.concat([['⭐', `+${xp} XP`]]).forEach(([icon, label], i) => {
      const it = document.createElement('div');
      it.className = 'sv-item';
      const a = (i / (loot.length + 1)) * Math.PI * 2 - Math.PI / 2, rr = 120 + (i % 2) * 30;
      it.style.setProperty('--tx', Math.cos(a) * rr + 'px'); it.style.setProperty('--ty', Math.sin(a) * rr + 'px');
      it.style.animationDelay = 0.25 + i * 0.08 + 's';
      it.innerHTML = `<b>${icon}</b><small>${label}</small>`;
      box.appendChild(it);
    });
    $('svHint').textContent = 'Отлично! Предметы в сумке 🎒';
    setTimeout(() => { if (stopUi === ui) closeStop(); }, 2600);
  }

  // ================= EGGS =================
  function addEgg(km) {
    if (S.eggs.length >= MAX_EGGS) return false;
    S.eggs.push({ id: S.eggUid++, km, walked: 0 }); save(); renderEggChip();
    return true;
  }
  const EGG10 = [147, 131, 143, 142, 138, 140, 123, 113, 137, 125, 126, 124, 122];
  function eggPool(km) {
    if (km === 10) return EGG10.map(SP);
    return SPECIES.filter((s) => !PREV[s.id] && !EGG10.includes(s.id) && s.rarity < 5 && (km === 2 ? s.rarity === 1 : s.rarity >= 2));
  }
  function hatch(egg) {
    S.eggs = S.eggs.filter((e) => e !== egg);
    const r = Math.random, sp = pick(eggPool(egg.km), r);
    const lvl = Math.min(20, playerLvl()), iv = randIv(r, 10), shiny = r() < shinyChance() * 2;
    const mon = Object.assign({ uid: S.uid++, sp: sp.id, lvl, iv, cp: calcCp(sp.id, lvl, iv), t: Date.now(), shiny, fav: false, hatched: true }, sizeGender(sp.id, r));
    S.mons.unshift(mon);
    const fam = family(sp.id), candy = { 2: 5, 5: 10, 10: 20 }[egg.km], dust = dustGain({ 2: 400, 5: 800, 10: 1600 }[egg.km]);
    S.candy[fam] = (S.candy[fam] || 0) + candy; S.stardust += dust;
    const first = !S.caught[sp.id];
    S.caught[sp.id] = (S.caught[sp.id] || 0) + 1; S.seen[sp.id] = true; S.hatched++; journalDay().h++;
    if (sizeTag(mon.sz) === 'XL') S.xlCaught++; else if (sizeTag(mon.sz) === 'XS') S.xsCaught++;
    passXp(PASS_POINTS.hatch);
    if (shiny) S.shinyCaught++;
    save();
    quest('hatch');
    const xp = 500 * (egg.km / 2) + (first ? 500 : 0);
    popup(`<h2>Ой? Яйцо шевелится!</h2><div style="height:190px;display:grid;place-items:center" id="hatchBox"><span class="egg big k${egg.km} shake"></span></div>
      <div id="hatchInfo" style="visibility:hidden"><h2>${shiny ? '✨ ' : ''}${sp.name}!</h2><div>${typeChip(sp.type)} <b>CP ${mon.cp}</b></div>
      ${rewardsHtml([`+${xp} XP`, `🍬 +${candy}`, `💫 +${dust}`].concat(first ? ['🆕 Новый вид!'] : []))}
      <button class="btn" data-ok>Привет, ${sp.name}!</button></div>`, () => {
      SFX.wobble();
      setTimeout(() => { const e = document.querySelector('#hatchBox .egg'); if (e) { e.classList.remove('shake'); e.classList.add('crack'); } SFX.hatch(); }, 1600);
      setTimeout(() => {
        const box = $('hatchBox'); if (!box) return;
        box.innerHTML = `<img class="art" src="${artUrl(sp.id, shiny)}" alt="">`;
        $('hatchInfo').style.visibility = 'visible';
        const r2 = box.getBoundingClientRect(); burst(r2.left + r2.width / 2, r2.top + r2.height / 2, ['✨', '⭐', '🥚'], 16);
        vibrate([40, 60, 80]);
        addXp(xp);
      }, 2200);
    });
  }

  // ================= ENCOUNTER =================
  let enc = null;
  const totalBalls = () => S.balls.basic + S.balls.great + S.balls.ultra;
  function tryEncounter(mon) {
    const d = dist(pos, mon.ll);
    if (d > catchRadius()) { SFX.tap(); return toast(`<img src="${pixelUrl(mon.sp.id, mon.shiny)}" alt="">${mon.sp.name} далеко<br><small>${fmtDist(d)} — подойди ближе</small>`); }
    if (!totalBalls()) return toast('Нет покеболов!<br><small>Загляни на покестоп 🎁 или в магазин</small>');
    startEncounter(mon);
  }
  function startEncounter(mon, opts = {}) {
    S.seen[mon.sp.id] = true; save();
    const premier = opts.premier || 0;
    enc = { mon, premier, raid: !!premier, ball: premier ? 'premier' : S.balls.basic ? 'basic' : S.balls.great ? 'great' : 'ultra',
      busy: false, ringT: 0, x: 0, dir: 1, raf: 0, fails: 0, berry: false };
    $('encounter').classList.toggle('night', isNight());
    $('encFx').innerHTML = weather && S.settings.weatherFx ? fxHtml(weather.kind, 0.6) : '';
    $('encName').innerHTML = (mon.shiny ? '✨ ' : '') + mon.sp.name + genderIcon(mon.g) + (sizeTag(mon.sz) ? ` <span class="sz">${sizeTag(mon.sz)}</span>` : '');
    applyEncAr();
    $('encCp').textContent = 'CP ' + mon.cp;
    $('encInfo').innerHTML = `${typeChip(mon.sp.type)} <span style="color:${RARITY[mon.sp.rarity].color};font-size:12px;font-weight:800">● ${RARITY[mon.sp.rarity].label}</span>` +
      (mon.boosted && weather ? `<span class="boostline">${weatherIcon()} Усилен погодой: +25% опыта и пыли</span>` : '') +
      (cardBonus(mon.sp.type) ? `<span class="boostline">🃏 Карточки: +${Math.round(cardBonus(mon.sp.type) * 100)}% к поимке</span>` : '');
    const body = $('encBody'); body.className = 'body';
    const anim = spriteMode() === 'anim';
    body.innerHTML = anim
      ? `<img class="anim" src="${spriteUrl(mon.sp.id, mon.shiny, 'anim')}" alt="" draggable="false">`
      : `<img class="art" src="${artUrl(mon.sp.id, mon.shiny)}" alt="" draggable="false">`;
    const im = body.querySelector('img');
    if (anim) {
      sizeSprite(im, 170, 220);
      im.onerror = () => { im.onerror = null; im.className = 'art'; im.style.cssText = ''; im.src = artUrl(mon.sp.id, mon.shiny); };
    }
    $('encHint').textContent = premier ? 'Рейд-босс ослаб! Лови премьер-болами' : 'Смахни покебол вверх. Покрути его по кругу перед броском — кручёный бросок!';
    resetBall(); renderPicker();
    $('encounter').classList.add('on');
    SFX.appear(); vibrate(30);
    if (mon.shiny) setTimeout(() => burst(innerWidth / 2, innerHeight * 0.32, ['✨', '⭐'], 16), 300);
    loop();
  }
  const ballDef = (k) => k === 'premier' ? PREMIER : BALLS[k];
  const ballCount = (k) => k === 'premier' ? enc.premier : S.balls[k];
  function renderPicker() {
    const keys = enc.raid ? ['premier'] : Object.keys(BALLS);
    $('encPicker').innerHTML = keys.map((k) =>
      `<button class="pick ${enc.ball === k ? 'on' : ''}" data-ball="${k}" ${ballCount(k) ? '' : 'disabled'}>${ballDef(k).icon} ${ballCount(k)}</button>`).join('')
      + `<button class="pick berry ${enc.berry ? 'on' : ''}" id="berryBtn" ${S.items.berry && !enc.berry ? '' : 'disabled'}>🍓 ${S.items.berry}</button>`;
    $('ball').className = 'ball ' + ballDef(enc.ball).css;
  }
  $('encPicker').addEventListener('click', (e) => {
    if (!enc || enc.busy) return;
    const b = e.target.closest('[data-ball]');
    if (b && ballCount(b.dataset.ball)) { enc.ball = b.dataset.ball; SFX.tap(); renderPicker(); return; }
    if (e.target.closest('#berryBtn') && S.items.berry && !enc.berry) {
      S.items.berry--; enc.berry = true; save();
      const be = document.createElement('div'); be.className = 'berry-eat'; be.textContent = '🍓';
      $('target').appendChild(be); setTimeout(() => be.remove(), 1000);
      SFX.berry(); quest('berry'); renderPicker();
      toast(`${enc.mon.sp.name} съел ягоду!`, 1100);
    }
  });

  function loop() {
    if (!enc) return;
    const ring = $('ring');
    if (!enc.busy) {
      enc.ringT = (enc.ringT + 0.011 + enc.mon.sp.rarity * 0.001) % 1;
      const max = Math.min(110, innerWidth / 2 - 100), speed = 0.5 + enc.mon.sp.rarity * 0.35;
      enc.x += enc.dir * speed;
      if (Math.abs(enc.x) > max) { enc.dir *= -1; enc.x = Math.sign(enc.x) * max; }
      if (Math.random() < 0.002 * enc.mon.sp.rarity) { const b = $('encBody'); b.classList.add('attack'); setTimeout(() => b.classList.remove('attack'), 500); }
    }
    const size = 170 - 135 * Math.sin(enc.ringT * Math.PI);
    ring.style.width = ring.style.height = size + 'px';
    ring.style.borderColor = RARITY[enc.mon.sp.rarity].color;
    ring.style.boxShadow = `0 0 12px ${RARITY[enc.mon.sp.rarity].color}`;
    let tx = enc.x, ty = 0;
    if (enc.ar) {
      // AR: the Pokémon sits in a real direction around the player
      const ppd = innerWidth / AR_FOV, dAz = angDiff(enc.ar.az, arHeading());
      const visible = Math.abs(dAz) < AR_FOV / 2;
      tx = dAz * ppd + (visible ? enc.x * 0.4 : 0);
      ty = Math.max(-innerHeight * 0.3, Math.min(innerHeight * 0.3, (arPitch() - enc.ar.el) * ppd));
      if (visible && !enc.ar.found) {
        enc.ar.found = true; SFX.appear(); vibrate([40, 40, 80]);
        toast(`Нашёл! ${enc.mon.sp.name} здесь`, 1200);
        $('encHint').textContent = 'Нашёл! Теперь смахни покебол вверх';
      }
      $('arHint').innerHTML = visible ? '' : `<b>${dAz < 0 ? '◀' : '▶'}</b><span>${enc.ar.found ? 'Покемон' : 'Ищи покемона'} ${dAz < 0 ? 'левее' : 'правее'} — повернись с телефоном</span>`;
      $('arHint').className = 'ar-hint ' + (visible ? '' : dAz < 0 ? 'on left' : 'on right');
    }
    $('target').style.transform = `translate(${tx}px, ${ty}px)`;
    enc.ringSize = size;
    enc.raf = requestAnimationFrame(loop);
  }
  function endEncounter() {
    if (!enc) return;
    cancelAnimationFrame(enc.raf); enc = null;
    $('encounter').classList.remove('on', 'ar'); camOff();
    refreshWorld();
  }
  $('encRun').addEventListener('click', () => {
    SFX.tap();
    if (enc && enc.raid) { toast(`${enc.mon.sp.name} ушёл…`); }
    endEncounter();
  });

  // Throwing: drag the ball, swirl it for a curveball, flick it up
  const ball = $('ball');
  let drag = null;
  function resetBall() {
    ball.getAnimations().forEach((a) => a.cancel());
    ball.style.transition = 'none'; ball.style.transform = ''; ball.style.opacity = 1;
    ball.classList.remove('curve');
  }
  ball.addEventListener('pointerdown', (e) => {
    if (!enc || enc.busy) return;
    if (enc.ar && !enc.ar.found) { toast('Сначала найди покемона 👀', 1200); return; }
    ball.setPointerCapture(e.pointerId);
    drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, pts: [], angle: 0, lastA: null, curve: false };
    ball.style.transition = 'none';
  });
  ball.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.pts.push([e.clientX, e.clientY]); if (drag.pts.length > 6) drag.pts.shift();
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (Math.hypot(dx, dy) > 14) {
      const a = Math.atan2(dy, dx);
      if (drag.lastA !== null) { let da = a - drag.lastA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; drag.angle += da; }
      drag.lastA = a;
      if (!drag.curve && Math.abs(drag.angle) > Math.PI * 1.8) { drag.curve = true; ball.classList.add('curve'); SFX.curve(); vibrate(20); }
    }
    ball.style.transform = `translate(${dx}px, ${dy}px) rotate(${drag.angle}rad)`;
  });
  const releaseBall = () => {
    if (!drag) return;
    const d = drag; drag = null;
    const p0 = d.pts[0] || [d.x0, d.y0];
    const dy = d.y - p0[1], dx = d.x - p0[0];
    if (d.y0 - d.y < 50 || dy > -10) { ball.style.transition = 'transform .25s'; ball.style.transform = ''; return; }
    throwBall(dx / Math.max(1, -dy), d.curve);
  };
  ball.addEventListener('pointerup', releaseBall);
  ball.addEventListener('pointercancel', releaseBall);

  function throwBall(slope, curve) {
    if (ballCount(enc.ball) <= 0) return toast('Закончились такие покеболы');
    enc.busy = true;
    if (enc.ball === 'premier') enc.premier--; else { S.balls[enc.ball]--; save(); renderHud(); }
    renderPicker();
    if (curve) ball.classList.add('curve');
    SFX.throw();

    const tgt = $('target').getBoundingClientRect(), br = ball.getBoundingClientRect();
    const sx = br.left + br.width / 2, sy = br.top + br.height / 2;
    const tx = tgt.left + tgt.width / 2, ty = tgt.top + tgt.height / 2;
    const landX = sx + slope * (sy - ty);
    const hit = Math.abs(landX - tx) < (curve ? 75 : 65);
    const ringSize = enc.ringSize;
    const ex = hit ? tx : landX, ey = hit ? ty : ty - 50;
    if (curve) {
      ball.animate([
        { transform: 'translate(0,0) scale(1) rotate(0)' },
        { transform: `translate(${(ex - sx) / 2 + 70}px, ${(ey - sy) / 2}px) scale(.7) rotate(900deg)` },
        { transform: `translate(${ex - sx}px, ${ey - sy}px) scale(.45) rotate(1800deg)` }], { duration: 650, easing: 'ease-out', fill: 'forwards' });
    } else {
      ball.style.transition = 'transform .55s cubic-bezier(.3,.7,.4,1)';
      ball.style.transform = `translate(${ex - sx}px, ${ey - sy}px) scale(.45) rotate(720deg)`;
    }

    setTimeout(() => {
      if (!enc) return;
      ball.getAnimations().forEach((a) => a.cancel());
      if (!hit) {
        ball.style.opacity = 0; SFX.miss(); toast('Мимо!', 800);
        setTimeout(() => { if (enc) { resetBall(); enc.busy = false; afterThrow(); } }, 500);
        return;
      }
      SFX.hit(); vibrate(25);
      let bonus = 1.1, label = 'Неплохо', bxp = 0;
      if (ringSize < 65) { bonus = 1.85; label = 'Отлично!'; bxp = 100; quest('excellent'); }
      else if (ringSize < 110) { bonus = 1.4; label = 'Хорошо!'; bxp = 50; }
      if (curve) { bonus *= 1.7; bxp += 20; label += ' 🌀'; S.curveballs++; quest('curve'); }
      enc.bonusXp = Math.max(enc.bonusXp || 0, bxp);
      const chance = Math.min(0.97, RARITY[enc.mon.sp.rarity].catchRate * ballDef(enc.ball).mult * bonus * (enc.berry ? 1.5 : 1)
        * (enc.raid ? 2 : 1) * (1 + enc.fails * 0.08) * (1 + cardBonus(enc.mon.sp.type) + pct('catch') + buddyPerk('catch')));
      const success = Math.random() < chance;
      enc.berry = false;
      toast(label, 800);
      $('encBody').style.visibility = 'hidden';
      ball.style.transition = 'transform .3s';
      ball.style.transform = `translate(${tx - sx}px, ${ty - sy + 60}px) scale(.6)`;
      const wobbles = success ? 3 : 1 + Math.floor(Math.random() * 3);
      let w = 0;
      const step = () => {
        if (!enc) return;
        if (w++ >= wobbles) return finishThrow(success, tx, ty + 60);
        SFX.wobble(); vibrate(15);
        ball.animate([{ rotate: '0deg' }, { rotate: '-28deg' }, { rotate: '28deg' }, { rotate: '0deg' }], { duration: 500, composite: 'add' });
        setTimeout(step, 750);
      };
      setTimeout(step, 500);
    }, curve ? 660 : 560);
  }
  function afterThrow() {
    if (enc.raid) {
      if (!enc.premier) { toast(`${enc.mon.sp.name} ушёл…`, 1500); setTimeout(endEncounter, 1300); }
      renderPicker(); return;
    }
    if (!totalBalls()) { toast('Покеболы закончились', 1400); setTimeout(endEncounter, 1200); return; }
    if (!S.balls[enc.ball]) enc.ball = S.balls.basic ? 'basic' : S.balls.great ? 'great' : 'ultra';
    renderPicker();
  }
  function finishThrow(success, bx, by) {
    const mon = enc.mon;
    if (success) {
      const sp = mon.sp, first = !S.caught[sp.id], fam = family(sp.id), day = today();
      const firstToday = S.lastCatchDay !== day;
      const boost = mon.boosted && weather ? 1.25 : 1;
      S.caught[sp.id] = (S.caught[sp.id] || 0) + 1;
      S.totalCaught++; S.lastCatchDay = day;
      if (mon.shiny) S.shinyCaught++;
      const candy = 3 + (sp.rarity >= 4 ? 7 : 0) + (enc.raid ? 5 : 0);
      const dust = dustGain((100 + sp.rarity * 50 + (enc.raid ? 1000 : 0)) * boost);
      S.candy[fam] = (S.candy[fam] || 0) + candy;
      S.stardust += dust;
      S.mons.unshift({ uid: S.uid++, sp: sp.id, lvl: mon.lvl, iv: mon.iv, cp: calcCp(sp.id, mon.lvl, mon.iv), t: Date.now(), shiny: mon.shiny, fav: false, sz: mon.sz, g: mon.g });
      if (sizeTag(mon.sz) === 'XL') S.xlCaught++; else if (sizeTag(mon.sz) === 'XS') S.xsCaught++;
      journalDay().c.push(sp.id);
      passXp(PASS_POINTS.catch + (enc.bonusXp >= 100 ? PASS_POINTS.excellent : 0));
      if (S.mons.length > 1000) S.mons.length = 1000;
      if (mon.id) S.gone[mon.id] = Math.floor(Date.now() / WINDOW_MS);
      let xp = RARITY[sp.rarity].xp + (enc.bonusXp || 0) + (first ? 500 : 0) + (mon.shiny ? 500 : 0) + (firstToday ? 1000 : 0);
      xp = Math.round(xp * boost);
      save();
      SFX.catch(); vibrate([40, 60, 80]);
      burst(bx, by, ['⭐', '✨', '💫'], 16);
      quest('catch'); quest('type', 1, sp.type);
      let cardLine = null;
      if (Math.random() < 0.05 * (enc.bonusXp >= 100 ? 2 : 1) * (1 + pct('card'))) {
        const shinyCard = Math.random() < (mon.shiny ? 0.5 : CARD_SHINY_CHANCE);
        cardLine = `🃏 Карточка${shinyCard ? ' ✨' : ''}${addCard(sp.id, shinyCard) ? ' · новая!' : ''}`;
        save(); checkMedals();
      }
      setTimeout(() => {
        cancelAnimationFrame(enc.raf); enc = null;
        $('encounter').classList.remove('on', 'ar'); camOff();
        const gained = addXp(xp);
        const lines = [`+${gained} XP`, `🍬 +${candy}`, `💫 +${dust}`];
        if (first) lines.push('🆕 Новый вид!');
        if (firstToday) lines.push('☀️ Первая поимка дня');
        if (sizeTag(mon.sz)) lines.push(sizeTag(mon.sz) === 'XL' ? '🐘 XL — великан!' : '🐜 XS — кроха!');
        if (cardLine) lines.push(cardLine);
        popup(`<img class="art" src="${artUrl(sp.id, mon.shiny)}" alt=""><h2>${mon.shiny ? '✨ ' : ''}${sp.name}${genderIcon(mon.g)} пойман!</h2>
          <div>${typeChip(sp.type)} <b>CP ${mon.cp}</b></div>${rewardsHtml(lines)}
          <button class="btn" data-ok>Отлично!</button>`);
        refreshWorld();
      }, 700);
      return;
    }
    $('encBody').style.visibility = 'visible';
    enc.fails++;
    if (!enc.raid && Math.random() < RARITY[mon.sp.rarity].flee + enc.fails * 0.03) {
      if (mon.id) S.gone[mon.id] = Math.floor(Date.now() / WINDOW_MS);
      save();
      ball.style.opacity = 0;
      $('encBody').classList.add('flee');
      SFX.flee(); vibrate(120);
      toast(`${mon.sp.name} убежал…`, 1500);
      setTimeout(endEncounter, 1300);
      return;
    }
    SFX.miss(); toast('Вырвался!', 900);
    resetBall(); enc.busy = false;
    afterThrow();
  }

  // ================= BATTLES (trainers & raids) =================
  let battle = null;
  function myTeam(n) {
    const chosen = S.team.map((uid) => S.mons.find((m) => m.uid === uid)).filter(Boolean);
    const rest = S.mons.filter((m) => !chosen.includes(m)).sort((a, b) => b.cp - a.cp);
    return chosen.concat(rest).slice(0, n);
  }
  function tryTrainer(t) {
    const d = dist(pos, t.ll);
    if (d > stopRadius()) { SFX.tap(); return toast(`${t.look} Тренер ${t.name} ждёт<br><small>${fmtDist(d)} — подойди ближе</small>`); }
    if (!S.mons.length) return toast('Сначала поймай хотя бы одного покемона');
    const r = rng(t.seed), lvl = playerLvl();
    const pool = SPECIES.filter((s) => s.rarity <= 3);
    const enemy = [0, 1, 2].map(() => { const sp = pick(pool, r), l = Math.max(1, Math.min(40, lvl + 2 + Math.floor(r() * 4))); return { sp, lvl: l, iv: randIv(r, 5), shiny: false }; });
    const team = myTeam(3);
    popup(`<div class="big">${t.look}</div><h2>Тренер ${t.name}</h2><p>«Давай сразимся! У меня три покемона.»</p>
      <div class="team-pick">${enemy.map((e) => `<div><img src="${pixelUrl(e.sp.id)}" alt="">${e.sp.name}</div>`).join('')}</div>
      <p>Твоя команда:</p><div class="team-pick">${team.map((m) => `<div><img src="${pixelUrl(m.sp, m.shiny)}" alt="">CP ${m.cp}</div>`).join('')}</div>
      <div class="actions"><button class="btn red" id="goBattle">⚔️ В бой!</button><button class="btn ghost" data-ok>Потом</button></div>`, (box) => {
      box.querySelector('#goBattle').onclick = () => { closePopup(); startBattle({ kind: 'trainer', trainer: t, enemy, team }); };
    });
  }
  function raidMenu(s, ev) {
    const d = dist(pos, s.ll), raid = s.raid, near = d <= stopRadius();
    const used = S.stops[s.id] && Date.now() - S.stops[s.id] < STOP_COOLDOWN;
    const freePass = S.freePassDay !== today();
    const passes = S.items.pass + (freePass ? 1 : 0);
    const boss = raid.sp, team = myTeam(6);
    popup(`<img class="art" src="${artUrl(boss.id)}" alt=""><h2>Рейд ${'★'.repeat(raid.tier - 2)} · ${boss.name}</h2>
      <div>${typeChip(boss.type)} <span style="color:${RARITY[boss.rarity].color}">● ${RARITY[boss.rarity].label}</span></div>
      <p>Осталось ${fmtTime(raid.ends - Date.now())}. Победи босса за 2 минуты командой из 6 покемонов — и попробуй его поймать!${near ? '' : `<br><b>Подойди ближе: ${fmtDist(d)}</b>`}</p>
      ${team.length ? `<div class="team-pick">${team.map((m) => `<div><img src="${pixelUrl(m.sp, m.shiny)}" alt="">CP ${m.cp}</div>`).join('')}</div>` : ''}
      <div class="actions" style="flex-direction:column">
        <button class="btn red" id="goRaid" ${near && passes && team.length ? '' : 'disabled'}>⚔️ Сразиться (🎟️ ${freePass ? 'бесплатно' : S.items.pass})</button>
        <button class="btn blue" id="spinRaidStop">🎁 Открыть покестоп «${s.name}»</button>
        <button class="btn ghost" data-ok>Закрыть</button></div>`, (box) => {
      box.querySelector('#goRaid').onclick = () => {
        if (freePass) S.freePassDay = today(); else S.items.pass--;
        save(); closePopup();
        const lvl = 20 + raid.tier * 3;
        startBattle({ kind: 'raid', raid, stop: s, enemy: [{ sp: boss, lvl, iv: { a: 15, d: 15, h: 15 }, shiny: false, hpMult: { 3: 6, 4: 10, 5: 16 }[raid.tier] }], team });
      };
      const sp = box.querySelector('#spinRaidStop');
      if (sp) sp.onclick = () => { closePopup(); openStop(s); };
    });
  }

  function startBattle(cfg) {
    const mk = (m, isMine) => {
      const spId = isMine ? m.sp : m.sp.id;
      const st = battleStats(spId, m.lvl, m.iv);
      const hp = Math.round(st.hp * (m.hpMult || 1) * (isMine ? 1 : 1.2));
      return { uid: isMine ? m.uid : null, spId, sp: SP(spId), shiny: m.shiny, lvl: m.lvl, cp: isMine ? m.cp : calcCp(spId, m.lvl, m.iv), atk: st.atk, def: st.def, hp, maxHp: hp, energy: 0 };
    };
    battle = {
      kind: cfg.kind, cfg, enemy: cfg.enemy.map((m) => mk(m, false)), mine: cfg.team.map((m) => mk(m, true)),
      ei: 0, mi: 0, start: Date.now(), limit: cfg.kind === 'raid' ? 120000 : 0, nextEnemy: Date.now() + 2200,
      telegraph: false, dodgeUntil: 0, dodgeCd: 0, fastCd: 0, switchCd: 0, over: false, enemyAttacks: 0, timer: null,
    };
    const el = $('battle');
    el.classList.toggle('night', isNight());
    el.classList.toggle('raid', cfg.kind === 'raid');
    $('battleFx').innerHTML = weather && S.settings.weatherFx ? fxHtml(weather.kind, 0.6) : '';
    el.classList.add('on');
    playMusic('battle');
    renderBattle(true);
    battle.timer = setInterval(battleTick, 100);
    $('bHint').textContent = 'Тапай по экрану — быстрая атака. Жми «Уклон», когда враг светится красным!';
    $('bHint').style.opacity = 1;
    setTimeout(() => { $('bHint').style.opacity = 0; }, 4500);
  }
  const curE = () => battle.enemy[battle.ei];
  const curM = () => battle.mine[battle.mi];
  function setMonImg(sel, mon, back) {
    const im = document.querySelector(sel + ' img');
    const src = back ? backUrl(mon.spId, mon.shiny) : spriteUrl(mon.spId, mon.shiny);
    if (im.dataset.src !== src) {
      im.dataset.src = src; im.src = src; im.style.width = im.style.height = '';
      im.onerror = () => { im.onerror = null; im.src = back ? `${SPR}back/${mon.spId}.png` : pixelUrl(mon.spId); };
      sizeSprite(im, back ? 150 : 130, 190, 3);
    }
    document.querySelector(sel).classList.remove('faint');
  }
  function hpBar(m) {
    const p = Math.max(0, m.hp / m.maxHp);
    return `<div class="hpbar ${p < 0.25 ? 'low' : p < 0.5 ? 'mid' : ''}"><i style="width:${p * 100}%"></i></div>`;
  }
  function renderBattle(full) {
    const e = curE(), m = curM();
    if (full) { setMonImg('#bEnemy', e, false); setMonImg('#bMine', m, true); }
    const title = battle.kind === 'raid' ? `Рейд ${'★'.repeat(battle.cfg.raid.tier - 2)}` : `${battle.cfg.trainer.look} Тренер ${battle.cfg.trainer.name}`;
    const left = battle.limit ? `<small>⏱ ${fmtTime(battle.limit - (Date.now() - battle.start))}</small>` : '';
    $('bTitle').innerHTML = title + left;
    const dots = (list, idx) => `<div class="teamdots">${list.map((x, i) => `<i class="${x.hp <= 0 ? 'out' : ''}" title="${x.sp.name}"></i>`).join('')}</div>`;
    $('bEnemyPanel').innerHTML = `<b>${e.sp.name}</b><span class="cp">CP ${e.cp}</span> ${typeChip(e.sp.type)}${hpBar(e)}${battle.enemy.length > 1 ? dots(battle.enemy) : ''}`;
    $('bMyPanel').innerHTML = `<b>${m.sp.name}</b><span class="cp">CP ${m.cp}</span>${hpBar(m)}
      <div class="enbar"><i style="width:${m.energy}%"></i></div>${dots(battle.mine)}`;
    const [fast, charge] = MOVES[m.sp.type];
    $('bCharge').textContent = `⚡ ${charge}`;
    $('bCharge').disabled = m.energy < 50 || battle.over;
    $('bDodge').disabled = battle.over;
    $('bSwitch').disabled = battle.over || Date.now() < battle.switchCd || battle.mine.filter((x) => x.hp > 0).length < 2;
  }
  function damage(att, def, power, typeName) {
    const eff = typeEff(typeName, def.sp.type);
    const stab = att.sp.type === typeName ? 1.2 : 1;
    return { dmg: Math.floor(0.5 * power * (att.atk / def.def) * stab * eff) + 1, eff };
  }
  function centerOf(sel) { const r = document.querySelector(sel + ' img').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function animate(sel, cls, ms = 180) { const el = document.querySelector(sel); el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }
  function myAttack(charged) {
    if (!battle || battle.over) return;
    const m = curM(), e = curE(), now = Date.now();
    if (m.hp <= 0 || e.hp <= 0) return;
    if (!charged && now < battle.fastCd) return;
    if (charged && m.energy < 50) return;
    const [fast, charge] = MOVES[m.sp.type];
    const { dmg: raw, eff } = damage(m, e, charged ? 60 : 7, m.sp.type);
    const dmg = Math.round(raw * (1 + pct('damage') + (S.buddy && m.uid === S.buddy.uid ? buddyPerk('damage') : 0)));
    if (charged) { m.energy -= 50; flash(); SFX.charge(); vibrate([30, 30, 60]); }
    else { battle.fastCd = now + 330; m.energy = Math.min(100, m.energy + 9); SFX.attack(); }
    e.hp = Math.max(0, e.hp - dmg);
    animate('#bMine', 'lunge'); setTimeout(() => animate('#bEnemy', 'hurt', 140), 90);
    const [x, y] = centerOf('#bEnemy');
    floatText(x + (Math.random() * 40 - 20), y - 20, (charged ? charge + ' ' : '') + '−' + dmg, eff > 1 ? 'super' : eff < 1 ? 'weak' : '');
    if (charged && eff > 1) setTimeout(() => toast('Супер-эффективно!', 700), 100);
    if (e.hp <= 0) enemyFainted();
    renderBattle();
  }
  function enemyFainted() {
    document.querySelector('#bEnemy').classList.add('faint');
    SFX.flee();
    if (battle.ei < battle.enemy.length - 1) {
      battle.ei++; battle.nextEnemy = Date.now() + 2200; battle.telegraph = false;
      setTimeout(() => { if (battle && !battle.over) { renderBattle(true); toast(`Тренер выпускает ${curE().sp.name}!`, 1100); } }, 700);
    } else endBattle(true);
  }
  function battleTick() {
    if (!battle || battle.over || battle.pausedAt) return;
    const now = Date.now(), e = curE(), m = curM();
    if (battle.limit && now - battle.start > battle.limit) { toast('Время вышло!', 1200); return endBattle(false); }
    if (e.hp > 0 && m.hp > 0) {
      const interval = battle.kind === 'raid' ? 1500 : 1900;
      if (!battle.telegraph && now > battle.nextEnemy - 550) { battle.telegraph = true; document.querySelector('#bEnemy').classList.add('charging'); }
      if (now >= battle.nextEnemy) {
        battle.telegraph = false; document.querySelector('#bEnemy').classList.remove('charging');
        battle.enemyAttacks++;
        const big = battle.enemyAttacks % 4 === 0;
        const { dmg: raw, eff } = damage(e, m, big ? 30 : 9, e.sp.type);
        const dodged = now < battle.dodgeUntil;
        const dmg = Math.max(1, Math.round(raw * (dodged ? 0.25 : 1)));
        m.hp = Math.max(0, m.hp - dmg);
        m.energy = Math.min(100, m.energy + 4);
        animate('#bEnemy', 'lunge'); setTimeout(() => animate('#bMine', 'hurt', 140), 90);
        const [x, y] = centerOf('#bMine');
        floatText(x, y - 30, (dodged ? 'Уклон! ' : big ? MOVES[e.sp.type][1] + ' ' : '') + '−' + dmg, dodged ? 'weak' : eff > 1 ? 'super' : '');
        dodged ? SFX.dodge() : (SFX.hurt(), vibrate(big ? 80 : 30));
        battle.nextEnemy = now + interval * (0.8 + Math.random() * 0.4);
        if (m.hp <= 0) myFainted();
      }
    }
    renderBattle();
  }
  function myFainted() {
    document.querySelector('#bMine').classList.add('faint');
    const next = battle.mine.findIndex((x) => x.hp > 0);
    if (next < 0) return setTimeout(() => endBattle(false), 600);
    battle.mi = next; battle.nextEnemy = Date.now() + 2000;
    setTimeout(() => { if (battle && !battle.over) { renderBattle(true); toast(`Вперёд, ${curM().sp.name}!`, 900); } }, 700);
  }
  $('bField').addEventListener('pointerdown', (e) => { if (!e.target.closest('.b-panel')) myAttack(false); });
  $('bCharge').addEventListener('click', () => myAttack(true));
  $('bDodge').addEventListener('click', () => {
    if (!battle || battle.over || Date.now() < battle.dodgeCd) return;
    battle.dodgeUntil = Date.now() + 600; battle.dodgeCd = Date.now() + 900;
    const el = document.querySelector('#bMine img');
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50px)' }, { transform: 'translateX(0)' }], { duration: 450 });
    SFX.tap();
  });
  $('bSwitch').addEventListener('click', () => {
    if (!battle || battle.over || Date.now() < battle.switchCd) return;
    const alive = battle.mine.map((x, i) => [x, i]).filter(([x, i]) => x.hp > 0 && i !== battle.mi);
    if (!alive.length) return;
    battle.mi = alive[0][1]; battle.switchCd = Date.now() + 4000;
    SFX.tap(); renderBattle(true); toast(`Вперёд, ${curM().sp.name}!`, 900);
  });
  $('bFlee').addEventListener('click', () => { if (battle && !battle.over) endBattle(false, true); });
  function endBattle(win, fled) {
    battle.over = true; clearInterval(battle.timer);
    const cfg = battle.cfg, b = battle;
    setTimeout(() => {
      $('battle').classList.remove('on');
      playMusic('map');
      battle = null;
      if (!win) {
        popup(`<div class="big">${fled ? '🏳️' : '😵'}</div><h2>${fled ? 'Ты сдался' : 'Поражение'}</h2>
          <p>${cfg.kind === 'raid' ? 'Рейд-босс оказался сильнее. Усиль покемонов и возвращайся, пока рейд не закончился!' : 'Усиль своих покемонов звёздной пылью и попробуй снова.'}</p>
          <button class="btn" data-ok>Ладно</button>`);
        return;
      }
      SFX.level(); vibrate([60, 40, 60, 40, 120]);
      if (cfg.kind === 'trainer') {
        S.beaten[cfg.trainer.id] = Date.now(); S.trainerWins++;
        const parts = grant({ dust: dustGain(500 + playerLvl() * 20), coins: 10, great: 2, berry: Math.random() < 0.5 ? 2 : 0, pass: Math.random() < 0.15 ? 1 : 0, pack: Math.random() < 0.25 ? 1 : 0,
          gear: Math.random() < 0.1 ? randomGear(Math.random, 3).id : 0 });
        passXp(PASS_POINTS.trainer);
        const xp = addXp(600);
        quest('battle'); checkMedals(); refreshWorld();
        popup(`<div class="big">🏆</div><h2>Победа!</h2><p>${cfg.trainer.look} ${cfg.trainer.name}: «Ты силён! Держи награду.»</p>
          ${rewardsHtml([`+${xp} XP`].concat(parts))}<button class="btn" data-ok>Ура!</button>`);
      } else {
        const raid = cfg.raid, left = Math.max(0, b.limit - (Date.now() - b.start));
        S.raidsDone[raid.id] = Date.now(); S.raidWins++;
        const parts = grant({ dust: dustGain(1000 * raid.tier), coins: 10 * raid.tier, ultra: raid.tier - 1, berry: 3, pack: raid.tier === 5 ? 2 : 1,
          gear: Math.random() < 0.25 ? randomGear(Math.random, 4).id : 0 });
        passXp(PASS_POINTS.raid);
        const xp = addXp({ 3: 1500, 4: 3000, 5: 6000 }[raid.tier]);
        const premier = 5 + Math.floor(left / 20000);
        checkMedals(); refreshWorld();
        popup(`<div class="big">🔥</div><h2>Рейд пройден!</h2><p>Бонус за оставшееся время: премьер-болов ${premier}.</p>
          ${rewardsHtml([`+${xp} XP`].concat(parts))}<button class="btn red" data-ok id="toCatch">Поймать ${raid.sp.name}!</button>`, (box) => {
          box.querySelector('#toCatch').addEventListener('click', () => {
            const r = Math.random, iv = randIv(r, 10), lvl = 20;
            const mon = Object.assign({ sp: raid.sp, lvl, iv, cp: calcCp(raid.sp.id, lvl, iv), shiny: r() < shinyChance() * 3, boosted: false }, sizeGender(raid.sp.id, r));
            setTimeout(() => startEncounter(mon, { premier }), 200);
          });
        });
      }
    }, 900);
  }

  // ================= COLLECTION =================
  let dexTab = 'mine', mineSort = 'recent', mineQuery = '';
  function renderDex() {
    const caughtSpecies = Object.keys(S.caught).length;
    $('dexStats').innerHTML = `
      <div><b>${caughtSpecies}/151</b><span>Покедекс</span></div>
      <div><b>${S.mons.length}</b><span>в коллекции</span></div>
      <div><b>${fmtNum(S.stardust)}</b><span>💫 пыли</span></div>`;
    document.querySelectorAll('#dexTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === dexTab));
    if (dexTab === 'cards') return renderCards();
    if (dexTab === 'dex') {
      $('dexBody').innerHTML = '<div class="grid">' + SPECIES.map((s) => {
        const c = S.caught[s.id], seen = S.seen[s.id];
        return `<div class="card ${c ? '' : 'unknown'}" data-sp="${s.id}"><span class="num">#${String(s.id).padStart(3, '0')}</span>
          ${c ? `<span class="badge">×${c}</span>` : ''}
          <div class="pic"><img src="${pixelUrl(s.id)}" alt="" loading="lazy"></div><div class="n">${c || seen ? s.name : '???'}</div>
          <div class="s">${c ? s.type : seen ? 'Встречен' : 'Не найден'}</div></div>`;
      }).join('') + '</div>';
      return;
    }
    const q = mineQuery.trim().toLowerCase();
    let list = S.mons.filter((m) => !q || SP(m.sp).name.toLowerCase().includes(q) || SP(m.sp).type.toLowerCase().includes(q));
    const sorters = {
      recent: (a, b) => b.t - a.t, cp: (a, b) => b.cp - a.cp, num: (a, b) => a.sp - b.sp || b.cp - a.cp, iv: (a, b) => ivPct(b.iv) - ivPct(a.iv),
      name: (a, b) => SP(a.sp).name.localeCompare(SP(b.sp).name, 'ru'), fav: (a, b) => (b.fav - a.fav) || (b.t - a.t),
      team: (a, b) => (S.team.includes(b.uid) - S.team.includes(a.uid)) || (b.cp - a.cp),
    };
    list = list.slice().sort(sorters[mineSort]);
    $('dexBody').innerHTML = `<div class="toolbar">
        <input id="mineSearch" placeholder="Поиск по имени или типу" value="${mineQuery.replace(/"/g, '')}">
        <select id="mineSort">
          ${[['recent', 'Новые'], ['cp', 'CP'], ['iv', 'Оценка'], ['num', 'Номер'], ['name', 'Имя'], ['fav', 'Избранные'], ['team', 'Команда']].map(([v, l]) => `<option value="${v}" ${mineSort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>` +
      (list.length ? '<div class="grid">' + list.map((m) => {
        const s = SP(m.sp), marks = (m.shiny ? '✨' : '') + (m.fav ? '❤️' : '') + (S.team.includes(m.uid) ? '🛡️' : '') + (S.buddy && S.buddy.uid === m.uid ? '🐾' : '');
        return `<div class="card" data-uid="${m.uid}"><span class="cp">CP ${m.cp}</span><span class="marks">${marks}</span>
          <div class="pic"><img src="${pixelUrl(s.id, m.shiny)}" alt="" loading="lazy"></div><div class="n">${s.name}</div><div class="s">${'★'.repeat(ivStars(m.iv)) || s.type}</div></div>`;
      }).join('') + '</div>' : `<div class="empty-note">${S.mons.length ? 'Ничего не найдено' : 'Пока никого. Выходи на прогулку и лови покемонов!'}</div>`);
    const inp = $('mineSearch');
    inp.addEventListener('input', () => { mineQuery = inp.value; const p = inp.selectionStart; renderDex(); const n = $('mineSearch'); n.focus(); n.setSelectionRange(p, p); });
    $('mineSort').addEventListener('change', (e) => { mineSort = e.target.value; renderDex(); });
  }
  $('dexTabs').addEventListener('click', (e) => { if (e.target.dataset.tab) { dexTab = e.target.dataset.tab; SFX.tap(); renderDex(); } });
  $('dexBody').addEventListener('click', (e) => {
    const c = e.target.closest('[data-uid]'); if (c) return openMon(+c.dataset.uid);
    const d = e.target.closest('[data-sp]'); if (d && (S.caught[d.dataset.sp] || S.seen[d.dataset.sp])) speciesInfo(+d.dataset.sp);
  });

  function chainHtml(id) {
    const ch = chainOf(id);
    if (ch.length < 2) return '';
    return '<div class="chain">' + ch.map((c, i) =>
      (i && ch[i - 1].depth < c.depth ? '<span>›</span>' : i ? '<span>·</span>' : '') +
      `<img class="${S.caught[c.id] ? '' : 'unk'}" src="${pixelUrl(c.id)}" alt="" title="${S.caught[c.id] ? SP(c.id).name : '???'}">`).join('') + '</div>';
  }
  function speciesInfo(id) {
    const s = SP(id), c = S.caught[id] || 0, b = baseStats(id);
    popup(`<img class="art" src="${artUrl(id)}" alt="" style="${c ? '' : 'filter:brightness(0) invert(1) opacity(.3)'}">
      <h2>#${String(id).padStart(3, '0')} ${s.name}</h2><div>${typeChip(s.type)} <span style="color:${RARITY[s.rarity].color}">● ${RARITY[s.rarity].label}</span></div>
      <p>Поймано: ${c} · Конфеты: 🍬 ${S.candy[family(id)] || 0}<br>Атака ${b.atk} · Защита ${b.def} · Здоровье ${b.sta}<br>Макс. CP: ${calcCp(id, 40, { a: 15, d: 15, h: 15 })}</p>
      ${chainHtml(id)}<button class="btn" data-ok>Закрыть</button>`);
  }

  const powerCost = (lvl) => ({ dust: 100 * (2 + Math.floor(lvl * lvl / 16)), candy: lvl < 10 ? 1 : lvl < 20 ? 2 : lvl < 30 ? 3 : 4 });
  const maxLvl = () => Math.min(40, playerLvl() + 2);
  function openMon(uid) {
    const m = S.mons.find((x) => x.uid === uid); if (!m) return;
    const s = SP(m.sp), fam = family(m.sp), candy = S.candy[fam] || 0, evo = EVOLVES[m.sp];
    const col = TYPE_COLORS[s.type] || '#555', b = baseStats(m.sp), stars = ivStars(m.iv), cost = powerCost(m.lvl);
    const canPower = m.lvl < maxLvl() && S.stardust >= cost.dust && candy >= cost.candy;
    const inTeam = S.team.includes(uid), isBuddy = S.buddy && S.buddy.uid === uid, hw = heightWeight(m.sp, m.sz || 1);
    const statRow = (label, base, iv, max) => `<div class="statrow"><span>${label}</span><div class="bar"><i style="width:${base / max * 100}%"></i><b style="width:${iv / max * 100}%"></b></div><em>${base + iv}</em></div>`;
    const appraisal = ['Ничего особенного', 'Неплохой покемон', 'Хороший покемон', 'Отличный покемон!', 'Идеальный покемон! 💯'][stars];
    const sheet = $('monSheet');
    sheet.innerHTML = `
      <div class="md-hero" style="background: radial-gradient(90% 90% at 50% 100%, ${col}, #101a33 75%)">
        <button class="close md-close" id="mdClose">✕</button>
        <div class="plat"></div>
        <img id="mdArt" src="${artUrl(s.id, m.shiny)}" alt="">
      </div>
      <div class="md-body">
        <div class="md-cp">CP <b>${m.cp}</b> · ур. ${m.lvl}</div>
        <div class="lvlbar"><i style="width:${m.lvl / 40 * 100}%"></i></div>
        <div class="md-name">${m.shiny ? '✨ ' : ''}${s.name}${genderIcon(m.g)}${isBuddy ? ' 🐾' : ''}${sizeTag(m.sz) ? ` <span class="sz">${sizeTag(m.sz)}</span>` : ''}</div>
        <div class="md-types">${typeChip(s.type)} <span style="color:${RARITY[s.rarity].color};font-size:13px">● ${RARITY[s.rarity].label}</span></div>
        <div class="md-grid">
          <div><b>🍬 ${candy}</b><span>конфет</span></div>
          <div><b>💫 ${fmtNum(S.stardust)}</b><span>пыли</span></div>
          <div><b>${new Date(m.t).toLocaleDateString('ru-RU')}</b><span>${m.hatched ? 'вылупился' : 'пойман'}</span></div>
          <div><b>${hw.h} м</b><span>рост</span></div>
          <div><b>${hw.w} кг</b><span>вес</span></div>
          <div><b>${m.g === 'f' ? '♀ самка' : m.g === 'm' ? '♂ самец' : '—'}</b><span>пол</span></div>
        </div>
        <div class="appraise"><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - Math.min(3, stars))}</div>${appraisal} · ${ivPct(m.iv)}%</div>
        ${statRow('Атака', b.atk, m.iv.a, 320)}${statRow('Защита', b.def, m.iv.d, 320)}${statRow('Здоровье', b.sta, m.iv.h, 320)}
        <p style="color:var(--muted);font-size:13px;text-align:center">Приёмы: ${MOVES[s.type][0]} · ${MOVES[s.type][1]}</p>
        ${chainHtml(s.id)}
        <div class="md-actions">
          <button class="btn" id="mdPower" ${canPower ? '' : 'disabled'}>⬆️ Усилить · 💫 ${fmtNum(cost.dust)} · 🍬 ${cost.candy}${m.lvl >= 40 ? ' (макс.)' : m.lvl >= maxLvl() ? ` · нужен ур. тренера ${m.lvl - 1}` : ''}</button>
          ${evo ? `<button class="btn blue" id="mdEvolve" ${candy >= evo[0].cost ? '' : 'disabled'}>🧬 Эволюция · 🍬 ${evo[0].cost}${evo.length > 1 ? ' (случайно)' : ''}</button>` : ''}
          <div class="md-row2">
            <button class="btn ghost" id="mdTeam">${inTeam ? '🛡️ Из команды' : `🛡️ В команду (${S.team.length}/6)`}</button>
            <button class="btn ghost" id="mdBuddy" ${isBuddy ? 'disabled' : ''}>🐾 ${isBuddy ? 'Напарник' : 'Напарником'}</button>
          </div>
          <button class="btn ghost" id="mdPhoto">📸 Сфотографироваться</button>
          <button class="btn ghost" id="mdFav">${m.fav ? '💔 Убрать из избранного' : '❤️ В избранное'}</button>
          <button class="btn red" id="mdTransfer">👋 Отпустить (+1 🍬)</button>
        </div>
      </div>`;
    sheet.classList.add('on'); sheet.scrollTop = 0;
    $('mdClose').onclick = () => { sheet.classList.remove('on'); renderDex(); };
    $('mdFav').onclick = () => { m.fav = !m.fav; save(); SFX.tap(); openMon(uid); };
    $('mdPhoto').onclick = () => openPhoto({ spId: m.sp, shiny: m.shiny, cp: m.cp, g: m.g });
    $('mdTeam').onclick = () => {
      if (inTeam) S.team = S.team.filter((x) => x !== uid);
      else if (S.team.length >= 6) return toast('В команде уже 6 покемонов');
      else S.team.push(uid);
      save(); SFX.tap(); openMon(uid);
    };
    $('mdBuddy').onclick = () => {
      S.buddy = newBuddy(uid); save(); renderBuddyMarker(); SFX.spin();
      toast(`🐾 ${s.name} теперь твой напарник!<br><small>Конфета каждые ${buddyKm(m)} км</small>`, 2200); openMon(uid);
    };
    $('mdPower').onclick = () => {
      const c = powerCost(m.lvl);
      if (m.lvl >= maxLvl() || S.stardust < c.dust || (S.candy[fam] || 0) < c.candy) return;
      S.stardust -= c.dust; S.candy[fam] -= c.candy; m.lvl++; const old = m.cp; m.cp = calcCp(m.sp, m.lvl, m.iv);
      S.powerups++; save(); quest('powerup'); SFX.spin(); vibrate(30);
      const r = $('mdArt').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['⬆️', '✨'], 10);
      toast(`CP ${old} → ${m.cp}`, 1200); openMon(uid);
    };
    let armed = false;
    $('mdTransfer').onclick = (e) => {
      if (m.fav) return toast('Сначала убери из избранного');
      if (isBuddy) return toast('Нельзя отпустить напарника');
      if (!armed) { armed = true; e.target.textContent = 'Точно отпустить? Нажми ещё раз'; setTimeout(() => { armed = false; if (e.target.isConnected) e.target.textContent = '👋 Отпустить (+1 🍬)'; }, 2500); return; }
      S.mons = S.mons.filter((x) => x.uid !== uid); S.team = S.team.filter((x) => x !== uid); S.candy[fam] = candy + 1; save();
      SFX.tap(); sheet.classList.remove('on'); renderDex();
      toast(`Пока, ${s.name}! 👋<br><small>+1 🍬</small>`);
    };
    if (evo) $('mdEvolve').onclick = () => {
      const opt = evo[Math.floor(Math.random() * evo.length)];
      if ((S.candy[fam] || 0) < opt.cost) return;
      S.candy[fam] -= opt.cost;
      const to = SP(opt.to);
      $('mdArt').classList.add('evolving'); SFX.evolve(); vibrate([50, 80, 50, 80, 150]);
      $('mdEvolve').disabled = true;
      setTimeout(() => { $('mdArt').src = artUrl(to.id, m.shiny); }, 1100);
      setTimeout(() => {
        const r = $('mdArt').getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, ['✨', '⭐', '💫'], 18);
        m.sp = to.id; m.cp = calcCp(m.sp, m.lvl, m.iv);
        S.caught[to.id] = (S.caught[to.id] || 0) + 1; S.seen[to.id] = true; S.evolved++; save();
        quest('evolve'); passXp(PASS_POINTS.evolve);
        toast(`🎉 ${s.name} эволюционировал в ${to.name}!`, 2400);
        addXp(500); renderBuddyMarker();
        openMon(uid);
      }, 2300);
    };
  }

  // ================= COLLECTIBLE CARDS =================
  const ownsCard = (id) => !!(S.cards[id] || S.shinyCards[id]);
  const cardsOwned = () => SPECIES.filter((s) => ownsCard(s.id)).length;
  function addCard(id, shiny) {
    const key = shiny ? 'shinyCards' : 'cards', isNew = !S[key][id];
    S[key][id] = (S[key][id] || 0) + 1;
    return isNew;
  }
  // Gold-or-better cards give +5% catch chance for their type (max +25%)
  function cardBonus(type) {
    const n = SPECIES.filter((s) => s.type === type && s.rarity >= 3 && ownsCard(s.id)).length;
    return Math.min(0.25, n * 0.05);
  }
  function rollCard(r, guaranteedRare) {
    const weights = guaranteedRare ? { 3: 80, 4: 17, 5: 3 } : { 1: 60, 2: 28, 3: 9, 4: 2.5, 5: 0.5 };
    let x = r() * Object.values(weights).reduce((a, b) => a + b, 0), tier = 1;
    for (const t in weights) { if ((x -= weights[t]) <= 0) { tier = +t; break; } }
    const sp = pick(SPECIES.filter((s) => s.rarity === tier), r);
    return { id: sp.id, shiny: r() < CARD_SHINY_CHANCE };
  }
  const setIds = (set) => set.ids === 'all' ? SPECIES.map((s) => s.id) : set.ids;

  function cardHtml(id, opts = {}) {
    const s = SP(id), b = baseStats(id), [fast, charge] = MOVES[s.type];
    const known = opts.missing ? (S.seen[id] || S.caught[id]) : true;
    const cls = ['tcg', 'r' + s.rarity, opts.shiny ? 'shiny' : '', opts.mini ? 'mini' : '', opts.missing ? 'missing' : ''].join(' ');
    return `<div class="${cls}" style="--type:${TYPE_COLORS[s.type]};${opts.w ? `--w:${opts.w}` : ''}" ${opts.attrs || ''}>
      <div class="tcg-inner">
        <div class="tcg-head"><b>${known ? s.name : '???'}${opts.shiny ? ' ✨' : ''}</b><span>CP ${calcCp(id, 40, { a: 15, d: 15, h: 15 })}</span></div>
        <div class="tcg-art"><img src="${opts.mini ? pixelUrl(id, opts.shiny) : artUrl(id, opts.shiny)}" alt="" loading="lazy" draggable="false"></div>
        <div class="tcg-type">${typeChip(s.type)} <span>${'◆'.repeat(s.rarity)}</span></div>
        <div class="tcg-moves">
          <div><b>${fast}</b><span>7</span></div>
          <div><b>${charge}</b><span>60</span></div>
          <div class="tcg-stats">АТК ${b.atk} · ЗАЩ ${b.def} · ЗДР ${b.sta}</div>
        </div>
        <div class="tcg-foot"><span>#${String(id).padStart(3, '0')}/151</span><span>${CARD_RARITY[s.rarity].name}</span></div>
      </div>
      <div class="tcg-shine"></div>
      ${opts.badge || ''}
    </div>`;
  }

  // ---- Album ----
  let cardFilter = 'all';
  function renderCards() {
    const owned = cardsOwned();
    const dupShards = duplicateShards();
    const filters = [['all', 'Все'], ['1', '◆'], ['2', '◆◆'], ['3', '◆◆◆'], ['4', '◆×4'], ['5', '◆×5'], ['shiny', '✨']];
    const list = SPECIES.filter((s) => cardFilter === 'all' || (cardFilter === 'shiny' ? S.shinyCards[s.id] : s.rarity === +cardFilter));
    const sets = CARD_SETS.map((set) => {
      const ids = setIds(set), have = ids.filter(ownsCard).length, done = have === ids.length, claimed = S.setsClaimed[set.id];
      const rew = Object.keys(set.reward).map((k) => rewardLabel(k, set.reward[k])).join(' ');
      return `<div class="quest ${claimed ? 'done' : ''}"><div class="qt"><div><b>${set.icon} ${set.name}</b><br><small>${have} / ${ids.length} · награда: ${rew}</small></div>
        ${claimed ? '✅' : done ? `<button class="btn sm" data-set="${set.id}">Забрать</button>` : ''}</div>
        <div class="prog"><i style="width:${have / ids.length * 100}%"></i></div></div>`;
    }).join('');
    $('dexBody').innerHTML = `
      <div class="wallet">
        <div>🎴 ${S.packs}<small>наборов</small></div>
        <div>🔷 ${fmtNum(S.shards)}<small>осколков</small></div>
        <div>🃏 ${owned}/151<small>собрано</small></div>
      </div>
      <div class="md-row2" style="margin-bottom:12px">
        <button class="btn" id="openPackBtn" ${S.packs ? '' : 'disabled'}>🎴 Открыть набор</button>
        <button class="btn ghost" id="dustBtn" ${dupShards ? '' : 'disabled'}>🔷 Повторы → +${dupShards}</button>
      </div>
      <p style="color:var(--muted);font-size:13px;margin:0 0 12px">Наборы дают за рейды, уровни, медали и серию дней, а ещё их продают в магазине. Золотые карточки и выше дают +5% к поимке покемонов своего типа.</p>
      <div class="seg" style="margin-bottom:12px">${filters.map(([v, l]) => `<button class="${cardFilter === v ? 'on' : ''}" data-cf="${v}">${l}</button>`).join('')}</div>
      <div class="card-grid">${list.map((s) => {
        const n = (S.cards[s.id] || 0) + (S.shinyCards[s.id] || 0), shinyOnly = !S.cards[s.id] && S.shinyCards[s.id];
        const badge = n ? `<span class="tcg-count">×${n}${S.shinyCards[s.id] ? ' ✨' : ''}</span>` : '';
        return cardHtml(s.id, { mini: true, shiny: cardFilter === 'shiny' || shinyOnly, missing: !n, badge, attrs: `data-card="${s.id}"` });
      }).join('')}</div>
      <h3>🗂️ Коллекции</h3>${sets}`;
  }
  function duplicateShards() {
    let n = 0;
    for (const id in S.cards) n += Math.max(0, S.cards[id] - 1) * CARD_RARITY[SP(+id).rarity].shards;
    for (const id in S.shinyCards) n += Math.max(0, S.shinyCards[id] - 1) * CARD_RARITY[SP(+id).rarity].shards * 4;
    return n;
  }
  $('dexBody').addEventListener('click', (e) => {
    if (dexTab !== 'cards') return;
    const f = e.target.closest('[data-cf]'); if (f) { cardFilter = f.dataset.cf; SFX.tap(); return renderCards(); }
    if (e.target.closest('#openPackBtn')) return openPack();
    if (e.target.closest('#dustBtn')) {
      const b = e.target.closest('#dustBtn');
      if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Точно? Нажми ещё раз'; return; }
      const n = duplicateShards();
      for (const id in S.cards) S.cards[id] = Math.min(1, S.cards[id]);
      for (const id in S.shinyCards) S.shinyCards[id] = Math.min(1, S.shinyCards[id]);
      S.shards += n; save(); SFX.coin(); toast(`🔷 +${n} осколков`); return renderCards();
    }
    const st = e.target.closest('[data-set]');
    if (st) {
      const set = CARD_SETS.find((x) => x.id === st.dataset.set);
      if (S.setsClaimed[set.id] || !setIds(set).every(ownsCard)) return;
      S.setsClaimed[set.id] = true;
      const parts = grant(set.reward);
      const r = st.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, ['🃏', '✨', '⭐'], 14);
      SFX.level();
      popup(`<div class="big">${set.icon}</div><h2>Коллекция «${set.name}» собрана!</h2>${rewardsHtml(parts)}<button class="btn" data-ok>Ура!</button>`);
      return renderCards();
    }
    const c = e.target.closest('[data-card]');
    if (c) {
      const id = +c.dataset.card;
      if (ownsCard(id)) openCard(id, cardFilter === 'shiny' || !S.cards[id]);
      else craftMenu(id);
    }
  });
  function craftMenu(id) {
    const s = SP(id), cost = CARD_RARITY[s.rarity].craft, known = S.seen[id] || S.caught[id];
    popup(`<div style="display:flex;justify-content:center;margin:6px 0 10px">${cardHtml(id, { mini: true, missing: true, w: '150px' })}</div>
      <h2>${known ? s.name : 'Неизвестная карточка'}</h2><p>${CARD_RARITY[s.rarity].name} карточка · #${String(id).padStart(3, '0')}<br>Её можно найти в наборе или создать из осколков.</p>
      <div class="actions"><button class="btn" id="craftBtn" ${S.shards >= cost ? '' : 'disabled'}>Создать · 🔷 ${cost}</button><button class="btn ghost" data-ok>Закрыть</button></div>`, (box) => {
      box.querySelector('#craftBtn').onclick = () => {
        if (S.shards < cost) return;
        S.shards -= cost; addCard(id, false); save(); checkMedals();
        closePopup(); SFX.evolve(); renderCards();
        setTimeout(() => openCard(id, false, true), 200);
      };
    });
  }

  // ---- Card viewer with 3D tilt ----
  let tiltCard = null, gyroAsked = false;
  function openCard(id, shiny, celebrate) {
    const s = SP(id), n = shiny ? S.shinyCards[id] : S.cards[id];
    const bonus = s.rarity >= 3 ? `<p>🃏 Бонус: +5% к поимке покемонов типа «${s.type}»</p>` : '';
    const swap = S.cards[id] && S.shinyCards[id] ? `<button class="btn ghost sm" id="cvSwap">${shiny ? 'Обычная' : '✨ Блестящая'}</button>` : '';
    $('cardView').innerHTML = `<button class="close cv-close" id="cvClose">✕</button>
      <div class="cv-stage">${cardHtml(id, { shiny })}</div>
      <div class="cv-info"><b>${CARD_RARITY[s.rarity].name} карточка${shiny ? ' ✨' : ''}</b> · у тебя ×${n || 0}${bonus}${swap}</div>`;
    $('cardView').classList.add('on');
    tiltCard = $('cardView').querySelector('.tcg');
    $('cvClose').onclick = () => { $('cardView').classList.remove('on'); tiltCard = null; };
    const sw = $('cvSwap'); if (sw) sw.onclick = () => openCard(id, !shiny);
    if (celebrate) { const r = tiltCard.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['✨', '⭐', '🃏'], 18); }
    if (!gyroAsked && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      gyroAsked = true; DeviceOrientationEvent.requestPermission().catch(() => {});
    }
    SFX.spin();
  }
  function tilt(card, nx, ny) {
    // nx, ny in [-1, 1]
    card.style.transform = `rotateY(${nx * 18}deg) rotateX(${-ny * 18}deg)`;
    card.style.setProperty('--mx', `${50 + nx * 45}%`);
    card.style.setProperty('--my', `${50 + ny * 45}%`);
  }
  $('cardView').addEventListener('pointermove', (e) => {
    if (!tiltCard) return;
    const r = tiltCard.getBoundingClientRect();
    tilt(tiltCard, Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)), Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)));
  });
  $('cardView').addEventListener('pointerleave', () => { if (tiltCard) tilt(tiltCard, 0, 0); });
  window.addEventListener('deviceorientation', (e) => {
    if (!tiltCard || e.gamma === null) return;
    tilt(tiltCard, Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
  });

  // ---- Pack opening ----
  function openPack() {
    if (!S.packs) return;
    S.packs--;
    const r = Math.random;
    const cards = [rollCard(r), rollCard(r), rollCard(r), rollCard(r), rollCard(r, true)];
    cards.forEach((c) => { c.isNew = addCard(c.id, c.shiny); });
    passXp(PASS_POINTS.pack);
    save(); renderHud();
    const view = $('packView');
    view.innerHTML = `<div class="pack-stage"><div class="pack" id="packFoil"><span>Покемон GO</span><b>🎴</b><small>5 карточек</small></div></div>
      <div class="pack-hint">Нажми на набор, чтобы открыть</div>`;
    view.classList.add('on');
    SFX.appear();
    $('packFoil').onclick = () => {
      $('packFoil').classList.add('tear'); SFX.charge(); vibrate([30, 40, 60]);
      setTimeout(() => showPackCards(cards), 550);
    };
  }
  function showPackCards(cards) {
    const view = $('packView');
    view.innerHTML = `<div class="pack-cards">${cards.map((c, i) => {
      const s = SP(c.id);
      return `<div class="flip ${s.rarity >= 3 || c.shiny ? 'rare' : ''}" style="--glow:${RARITY[s.rarity].color}" data-i="${i}">
        <div class="in"><div class="back"></div><div class="front">${cardHtml(c.id, { mini: true, shiny: c.shiny, w: '104px',
          badge: c.isNew ? '<span class="newbadge">NEW</span>' : '' })}</div></div></div>`;
    }).join('')}</div>
      <div class="pack-hint" id="packHint">Переворачивай карточки!</div>
      <div class="actions" id="packActions" style="visibility:hidden;margin-top:8px">
        <button class="btn" id="packDone">Готово</button>${S.packs ? `<button class="btn blue" id="packMore">Ещё набор (${S.packs})</button>` : ''}
      </div>`;
    let opened = 0;
    view.querySelectorAll('.flip').forEach((f) => {
      f.addEventListener('click', () => {
        const c = cards[+f.dataset.i];
        if (f.classList.contains('open')) return openCard(c.id, c.shiny);
        f.classList.add('open'); opened++;
        const s = SP(c.id);
        if (s.rarity >= 3 || c.shiny) {
          const r = f.getBoundingClientRect();
          setTimeout(() => burst(r.left + r.width / 2, r.top + r.height / 2, c.shiny ? ['✨', '🌈'] : ['✨', '⭐'], s.rarity >= 4 || c.shiny ? 18 : 10), 300);
          if (s.rarity >= 4 || c.shiny) { flash(); SFX.level(); vibrate([40, 40, 100]); } else SFX.catch();
        } else SFX.tap();
        if (opened === cards.length) {
          $('packHint').textContent = 'Нажми на карточку, чтобы рассмотреть';
          $('packActions').style.visibility = 'visible';
          checkMedals();
        }
      });
    });
    view.querySelector('#packDone').onclick = () => { view.classList.remove('on'); if (dexTab === 'cards' && $('dex').classList.contains('on')) renderCards(); };
    const more = view.querySelector('#packMore'); if (more) more.onclick = () => openPack();
  }

  // ================= GEAR =================
  function addGear(id) {
    const g = GEAR_BY_ID[id];
    if (S.gear.owned[id]) { S.coins += GEAR_RARITY[g.rarity].sell; save(); return false; }
    S.gear.owned[id] = true; save();
    return true;
  }
  function toggleGear(id) {
    const g = GEAR_BY_ID[id];
    if (S.gear.equip[g.slot] === id) delete S.gear.equip[g.slot]; else S.gear.equip[g.slot] = id;
    save(); renderAvatar(); updateRange(); rebuildMarkers();
  }
  function gearShopOffers() {
    const d = today();
    if (!S.gearShop || S.gearShop.day !== d) {
      const r = rng(hash('gearshop:' + d)), pool = GEAR.filter((g) => !g.exclusive), ids = [];
      while (ids.length < 3) { const g = pick(pool, r); if (!ids.includes(g.id)) ids.push(g.id); }
      S.gearShop = { day: d, ids }; save();
    }
    return S.gearShop.ids.map((id) => GEAR_BY_ID[id]);
  }
  const gearRow = (g, right) => `<div class="row gear-row"><div class="ic">${g.icon}</div><div class="grow"><b style="color:${GEAR_RARITY[g.rarity].color}">${g.name}</b>
    <small>${GEAR_SLOTS[g.slot].name} · ${GEAR_RARITY[g.rarity].name}${g.exclusive ? ' · эксклюзив' : ''}<br>${bonusText(g.bonus)}</small></div>${right}</div>`;
  function renderGearTab() {
    const owned = GEAR.filter((g) => S.gear.owned[g.id]);
    const totals = Object.keys(GEAR_STATS).filter((k) => bonus(k)).map((k) => `<span>+${bonus(k)}${GEAR_STATS[k].unit} ${GEAR_STATS[k].label}</span>`);
    return `<div class="gear-hero">
        <div class="gear-avatar">${avatarHtml(true)}<b>${esc(S.trainer.name || 'Тренер')}</b></div>
        <div class="gear-slots">${Object.keys(GEAR_SLOTS).map((slot) => {
          const g = GEAR_BY_ID[S.gear.equip[slot]];
          return `<div class="gslot ${g ? 'on' : ''}" style="${g ? `--rc:${GEAR_RARITY[g.rarity].color}` : ''}" ${g ? `data-gear="${g.id}"` : ''}>
            <span>${g ? g.icon : GEAR_SLOTS[slot].icon}</span><small>${g ? g.name : GEAR_SLOTS[slot].name}</small></div>`;
        }).join('')}</div>
      </div>
      <div class="rewards bonus-sum">${totals.length ? totals.join('') : '<span>Надень снаряжение, чтобы получить бонусы</span>'}</div>
      <h3>Снаряжение · ${owned.length}/${GEAR.length}</h3>
      <div class="list">${owned.map((g) => gearRow(g, `<button class="btn sm ${S.gear.equip[g.slot] === g.id ? 'ghost' : ''}" data-gear="${g.id}">${S.gear.equip[g.slot] === g.id ? 'Снять' : 'Надеть'}</button>`)).join('')}</div>
      <p style="color:var(--muted);font-size:13px">Новое снаряжение: боевой пропуск, магазин (каждый день новое), рейды, тренеры и редкие находки на покестопах. Повторы превращаются в монеты.</p>`;
  }

  // ================= BATTLE PASS =================
  const seasonIndex = () => Math.max(1, Math.floor((Date.now() - PASS_EPOCH) / (PASS_DAYS * 864e5)) + 1);
  const seasonEnds = () => PASS_EPOCH + seasonIndex() * PASS_DAYS * 864e5;
  const seasonName = (n) => `Сезон ${n}: ${PASS_NAMES[(n - 1) % PASS_NAMES.length]}`;
  function ensurePass() {
    const n = seasonIndex();
    if (!S.pass || S.pass.season !== n) { S.pass = { season: n, xp: 0, m: 0, premium: false, claimed: { free: {}, prem: {} } }; save(); }
  }
  const passTier = () => Math.min(PASS_TIERS, Math.floor(S.pass.xp / PASS_XP));
  function passXp(n) {
    ensurePass();
    const before = passTier(); S.pass.xp += n; save();
    const after = passTier();
    if (after > before) setTimeout(() => { toast(`🎖️ Боевой пропуск: уровень ${after}!`, 1800); SFX.coin(); }, 900);
    renderPassDot();
  }
  function passClaimable() {
    ensurePass();
    let n = 0;
    for (let t = 1; t <= passTier(); t++) { if (!S.pass.claimed.free[t]) n++; if (S.pass.premium && !S.pass.claimed.prem[t]) n++; }
    return n;
  }
  function renderPassDot() { const n = passClaimable(); $('passDot').textContent = n; $('passDot').classList.toggle('on', n > 0); }
  function rewardCell(rew) { return Object.keys(rew).filter((k) => rew[k]).map((k) => `<span>${rewardLabel(k, rew[k])}</span>`).join(''); }
  function claimPass(t, track) {
    if (t > passTier() || S.pass.claimed[track][t] || (track === 'prem' && !S.pass.premium)) return [];
    S.pass.claimed[track][t] = true;
    return grant(PASS_REWARDS[t - 1][track]);
  }
  function renderPass() {
    ensurePass();
    const p = S.pass, tier = passTier(), left = Math.max(0, seasonEnds() - Date.now()), days = Math.ceil(left / 864e5);
    const into = tier >= PASS_TIERS ? PASS_XP : p.xp % PASS_XP, claimable = passClaimable();
    $('passBody').innerHTML = `
      <div class="pass-hero">
        <div class="pass-title">🎖️ ${seasonName(p.season)}</div>
        <small>Осталось ${days} ${plural(days, 'день', 'дня', 'дней')} · потом начнётся новый сезон</small>
        <div class="pass-lvl"><b>${tier}</b><span>/ ${PASS_TIERS}</span></div>
        <div class="xpbar"><i style="width:${into / PASS_XP * 100}%"></i></div>
        <small>${tier >= PASS_TIERS ? 'Пропуск пройден! 🏆' : `${fmtNum(into)} / ${fmtNum(PASS_XP)} очков до уровня ${tier + 1}`}</small>
        <div class="actions" style="margin-top:12px">
          ${p.premium ? '<span class="pass-prem">⭐ Премиум активен</span>' : `<button class="btn" id="buyPrem" ${S.coins >= PASS_PRICE ? '' : 'disabled'}>⭐ Премиум · 🪙 ${PASS_PRICE}</button>`}
          ${claimable ? `<button class="btn blue" id="claimAll">Забрать всё (${claimable})</button>` : ''}
        </div>
      </div>
      <p class="pass-how">Очки пропуска: поимка +${PASS_POINTS.catch} (отличный бросок ещё +${PASS_POINTS.excellent}) · покестоп +${PASS_POINTS.spin} · 1 км +${PASS_POINTS.km} · яйцо +${PASS_POINTS.hatch} · тренер +${PASS_POINTS.trainer} · рейд +${PASS_POINTS.raid} · задание +${PASS_POINTS.quest} · эволюция +${PASS_POINTS.evolve}</p>
      <div class="pt-head"><span>Бесплатно</span><span></span><span>Премиум ⭐</span></div>
      <div class="pt-track">${PASS_REWARDS.map((r, i) => {
        const t = i + 1, reached = t <= tier;
        const cell = (track) => {
          const claimed = p.claimed[track][t], locked = track === 'prem' && !p.premium;
          const state = claimed ? 'claimed' : locked ? 'locked' : reached ? 'ready' : '';
          return `<div class="pt-cell ${track} ${state}" ${state === 'ready' ? `data-pclaim="${track}:${t}"` : ''}>${rewardCell(r[track])}
            ${claimed ? '<i>✓</i>' : locked ? '<i>🔒</i>' : reached ? '<em>Забрать</em>' : ''}</div>`;
        };
        return `<div class="pt-row ${reached ? 'reached' : ''}">${cell('free')}<div class="pt-num">${t}</div>${cell('prem')}</div>`;
      }).join('')}</div>`;
  }
  $('passBody').addEventListener('click', (e) => {
    if (e.target.closest('#buyPrem')) {
      if (S.coins < PASS_PRICE || S.pass.premium) return;
      S.coins -= PASS_PRICE; S.pass.premium = true; save(); SFX.level(); renderHud();
      const r = e.target.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, ['⭐', '✨', '🎖️'], 16);
      toast('⭐ Премиум-пропуск открыт!'); renderPassDot(); return renderPass();
    }
    let parts = [];
    if (e.target.closest('#claimAll')) {
      for (let t = 1; t <= passTier(); t++) parts = parts.concat(claimPass(t, 'free'), claimPass(t, 'prem'));
    } else {
      const c = e.target.closest('[data-pclaim]'); if (!c) return;
      const [track, t] = c.dataset.pclaim.split(':');
      parts = claimPass(+t, track);
      const r = c.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['🎁', '✨'], 10);
    }
    if (!parts.length) return;
    save(); SFX.catch(); renderPassDot(); renderPass();
    popup(`<div class="big">🎖️</div><h2>Награды пропуска</h2>${rewardsHtml(parts)}<button class="btn" data-ok>Отлично!</button>`);
  });

  // ================= WALK JOURNAL =================
  function journalDay(d = today()) {
    if (!S.journal[d]) {
      S.journal[d] = { m: 0, c: [], s: 0, h: 0, r: [] };
      const keys = Object.keys(S.journal).sort();
      while (keys.length > 14) delete S.journal[keys.shift()];
    }
    return S.journal[d];
  }
  function journalRoute(p) {
    const j = journalDay(), last = j.r[j.r.length - 1];
    if ((!last || dist(last, p) > 25) && j.r.length < 800) j.r.push([+p[0].toFixed(5), +p[1].toFixed(5)]);
  }
  let journalSel = null;
  function lastDays(n) { return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d.toLocaleDateString('sv'); }); }
  function routeSvg(r) {
    if (r.length < 2) return '<div class="empty-note">Маршрут появится, когда ты пройдёшь хотя бы 50 м</div>';
    const lat0 = r[0][0] * Math.PI / 180;
    const pts = r.map(([la, lo]) => [lo * Math.cos(lat0), -la]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const W = 340, H = 220, pad = 16, k = Math.min((W - 2 * pad) / Math.max(1e-9, maxX - minX), (H - 2 * pad) / Math.max(1e-9, maxY - minY));
    const ox = (W - (maxX - minX) * k) / 2, oy = (H - (maxY - minY) * k) / 2;
    const P = pts.map(([x, y]) => [(x - minX) * k + ox, (y - minY) * k + oy]);
    const d = P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const [sx, sy] = P[0], [ex, ey] = P[P.length - 1];
    return `<svg class="route" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <path d="${d}" fill="none" stroke="rgba(61,125,202,.35)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#5b9cf0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${sx}" cy="${sy}" r="7" fill="#30a46c" stroke="#fff" stroke-width="2"/><circle cx="${ex}" cy="${ey}" r="7" fill="#e5484d" stroke="#fff" stroke-width="2"/></svg>`;
  }
  function renderJournal() {
    const days = lastDays(7);
    if (!journalSel || !days.includes(journalSel)) journalSel = days[6];
    const data = days.map((d) => S.journal[d] || { m: 0, c: [], s: 0, h: 0, r: [] });
    const maxKm = Math.max(1, ...data.map((x) => x.m / 1000));
    const wk = data.reduce((a, x) => ({ m: a.m + x.m, c: a.c + x.c.length, s: a.s + x.s, h: a.h + x.h }), { m: 0, c: 0, s: 0, h: 0 });
    const j = S.journal[journalSel] || { m: 0, c: [], s: 0, h: 0, r: [] };
    const wd = (d) => new Date(d + 'T12:00').toLocaleDateString('ru-RU', { weekday: 'short' });
    const uniq = [...new Set(j.c)];
    $('journalBody').innerHTML = `
      <h3 style="margin-top:0">За неделю</h3>
      <div class="stats"><div><b>${(wk.m / 1000).toFixed(1)}</b><span>км</span></div><div><b>${wk.c}</b><span>поймано</span></div><div><b>${wk.s}</b><span>покестопов</span></div></div>
      <div class="week">${days.map((d, i) => `<button class="wk-day ${d === journalSel ? 'on' : ''}" data-day="${d}">
        <i style="height:${Math.max(4, data[i].m / 1000 / maxKm * 100)}%"></i><b>${(data[i].m / 1000).toFixed(1)}</b><small>${i === 6 ? 'сегодня' : wd(d)}</small></button>`).join('')}</div>
      <h3>${journalSel === today() ? 'Сегодня' : new Date(journalSel + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}</h3>
      <div class="stats">
        <div><b>${(j.m / 1000).toFixed(2)}</b><span>км пройдено</span></div>
        <div><b>${j.c.length}</b><span>поймано</span></div>
        <div><b>${j.s} · ${j.h}</b><span>покестопов · яиц</span></div>
      </div>
      <div class="route-box">${routeSvg(j.r)}</div>
      ${uniq.length ? `<h3>Пойманные покемоны</h3><div class="j-mons">${uniq.slice(0, 60).map((id) => `<img src="${pixelUrl(id)}" alt="" title="${SP(id).name}">`).join('')}</div>` : ''}`;
  }
  $('journalBody').addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (b) { journalSel = b.dataset.day; SFX.tap(); renderJournal(); } });

  // ================= TRAINER =================
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function avatarHtml(big) {
    const t = S.trainer, hat = S.gear.equip.head ? GEAR_BY_ID[S.gear.equip.head].icon : '', team = t.team && TEAMS[t.team];
    return `<div class="trn ${big ? 'big' : ''}" style="--c:${t.color}">${hat ? `<div class="trn-hat">${hat}</div>` : ''}<div class="trn-head">${t.look}</div>
      ${team ? `<div class="trn-team" style="background:${team.color}">${team.icon}</div>` : ''}</div>`;
  }
  function renderAvatar() {
    avatarEl.innerHTML = avatarHtml(false) + `<div class="trn-name">${esc(S.trainer.name || 'Тренер')}</div><div class="ava-shadow"></div>`;
    $('hudAva').style.setProperty('--c', S.trainer.color); $('hudAva').textContent = S.trainer.look;
    renderHud();
  }
  function trainerSetup(first) {
    const t = { ...S.trainer };
    const html = () => `<h2>${first ? 'Создай тренера' : 'Твой тренер'}</h2>
      <div class="tr-preview" id="trPreview"></div>
      <input class="tr-name" id="trName" maxlength="16" placeholder="Имя тренера" value="${esc(t.name)}">
      <div class="tr-grid">${AVATAR_LOOKS.map((l) => `<button class="${l === t.look ? 'on' : ''}" data-look="${l}">${l}</button>`).join('')}</div>
      <div class="tr-colors">${AVATAR_COLORS.map((c) => `<button class="${c === t.color ? 'on' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
      <div class="actions"><button class="btn" id="trSave">${first ? 'Начать игру!' : 'Сохранить'}</button>${first ? '' : '<button class="btn ghost" data-ok>Отмена</button>'}</div>`;
    popup(html(), (box) => {
      const preview = () => {
        const keep = S.trainer; S.trainer = t; box.querySelector('#trPreview').innerHTML = avatarHtml(true); S.trainer = keep;
        box.querySelector('#trSave').disabled = !t.name.trim();
      };
      preview();
      box.querySelector('#trName').addEventListener('input', (e) => { t.name = e.target.value; preview(); });
      box.addEventListener('click', (e) => {
        const l = e.target.closest('[data-look]'), c = e.target.closest('[data-color]');
        if (l) { t.look = l.dataset.look; box.querySelectorAll('[data-look]').forEach((b) => b.classList.toggle('on', b === l)); preview(); }
        if (c) { t.color = c.dataset.color; box.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('on', b === c)); preview(); }
        if (e.target.id === 'trSave' && t.name.trim()) {
          S.trainer = Object.assign(S.trainer, { name: t.name.trim().slice(0, 16), look: t.look, color: t.color });
          save(); renderAvatar(); closePopup(); SFX.spin();
          if ($('profile').classList.contains('on')) renderProfile();
        }
      });
    });
  }
  function teamPicker() {
    const had = S.trainer.team;
    popup(`<h2>${had ? 'Сменить команду' : 'Выбери команду'}</h2><p>${had ? `Смена стоит 🪙 1000.` : 'Команда даёт постоянный бонус. Выбирай с умом!'}</p>
      <div class="teams">${Object.keys(TEAMS).map((k) => { const tm = TEAMS[k]; return `<button class="team-btn" data-team="${k}" style="--tc:${tm.color}" ${k === had ? 'disabled' : ''}>
        <b>${tm.icon} ${tm.name}</b><small>${tm.desc}</small></button>`; }).join('')}</div>
      <button class="btn ghost" data-ok>${had ? 'Отмена' : 'Позже'}</button>`, (box) => {
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-team]'); if (!b) return;
        if (had) { if (S.coins < 1000) return toast('Нужно 🪙 1000'); S.coins -= 1000; }
        S.trainer.team = b.dataset.team; save(); renderAvatar(); closePopup();
        const tm = TEAMS[S.trainer.team]; SFX.level();
        toast(`${tm.icon} Добро пожаловать в команду ${tm.name}!<br><small>${tm.desc}</small>`, 2400);
        if ($('profile').classList.contains('on')) renderProfile();
      });
    });
  }

  // ================= CAMERA: AR & PHOTOS =================
  let camStream = null;
  async function camOn(video) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
    if (!camStream) camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = camStream;
    await video.play().catch(() => {});
  }
  function camOff() {
    if (camStream) camStream.getTracks().forEach((t) => t.stop());
    camStream = null;
    document.querySelectorAll('video').forEach((v) => { v.srcObject = null; });
  }
  // ---- AR search: find where the Pokémon sits by turning around with the phone ----
  const AR_FOV = 62;
  const orient = { heading: null, pitch: 0, abs: false, listening: false, last: 0 };
  const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
  function onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.alpha !== null && e.alpha !== undefined) {
      if (e.type === 'deviceorientationabsolute') orient.abs = true;
      else if (orient.abs) return; // prefer the absolute (compass) stream when the browser has it
      h = 360 - e.alpha;
    }
    if (h === null) return;
    orient.heading = orient.heading === null ? h : (orient.heading + angDiff(h, orient.heading) * 0.3 + 360) % 360;
    if (e.beta !== null && e.beta !== undefined) orient.pitch = orient.pitch * 0.7 + (e.beta - 90) * 0.3;
    orient.last = Date.now();
  }
  function listenOrientation() {
    if (orient.listening) return;
    orient.listening = true;
    // must be called right inside the tap on iOS
    try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) {}
    window.addEventListener('deviceorientationabsolute', onOrient);
    window.addEventListener('deviceorientation', onOrient);
  }
  const hasSensor = () => orient.heading !== null && Date.now() - orient.last < 3000;
  const arHeading = () => hasSensor() ? orient.heading : enc.ar.look;
  const arPitch = () => hasSensor() ? orient.pitch : 0;
  function initArSearch() {
    if (!enc || enc.ar) return;
    const start = hasSensor() ? orient.heading : 0;
    enc.ar = { az: (start + 90 + Math.random() * 180) % 360, el: -4 + Math.random() * 10, look: 0, found: false };
    $('encHint').textContent = hasSensor() ? 'Покемон где-то рядом. Повернись с телефоном и найди его!' : 'Покемон где-то рядом. Веди пальцем по экрану, чтобы осмотреться';
  }
  // without a gyroscope: drag the camera view with a finger
  let arDrag = null;
  $('arena').addEventListener('pointerdown', (e) => { if (enc && enc.ar && !hasSensor() && !e.target.closest('#ball')) arDrag = e.clientX; });
  $('arena').addEventListener('pointermove', (e) => {
    if (arDrag === null || !enc || !enc.ar) return;
    enc.ar.look = (enc.ar.look - (e.clientX - arDrag) * AR_FOV / innerWidth + 360) % 360; arDrag = e.clientX;
  });
  window.addEventListener('pointerup', () => { arDrag = null; });

  async function applyEncAr() {
    const on = S.settings.ar;
    $('encAr').classList.toggle('on', on);
    if (!on) {
      $('encounter').classList.remove('ar'); $('arHint').className = 'ar-hint';
      if (enc) { enc.ar = null; }
      if (!$('photoView').classList.contains('on')) camOff(); return;
    }
    listenOrientation();
    try { await camOn($('encVideo')); $('encounter').classList.add('ar'); setTimeout(initArSearch, 400); }
    catch (e) { S.settings.ar = false; save(); $('encAr').classList.remove('on'); toast('📷 Камера недоступна<br><small>Разреши доступ к камере в настройках браузера</small>', 2200); }
  }
  $('encAr').addEventListener('click', () => { S.settings.ar = !S.settings.ar; save(); SFX.tap(); applyEncAr(); });
  $('encPhoto').addEventListener('click', () => { if (enc) openPhoto({ spId: enc.mon.sp.id, shiny: enc.mon.shiny, cp: enc.mon.cp, g: enc.mon.g }); });

  let photo = null;
  async function openPhoto(o) {
    photo = o;
    const view = $('photoView');
    view.innerHTML = `<video id="phVideo" playsinline muted autoplay></video><div class="ph-bg"></div>
      <img id="phMon" crossorigin="anonymous" src="${artUrl(o.spId, o.shiny)}" alt="" draggable="false">
      <button class="close ph-close" id="phClose">✕</button>
      <div class="ph-bar"><input type="range" id="phSize" min="120" max="420" value="240"><button class="ph-shot" id="phShot" title="Снять"></button></div>
      <div class="ph-tip">Двигай покемона пальцем, размер — ползунком</div>`;
    view.classList.add('on');
    const im = $('phMon');
    const place = (w) => { im.style.width = im.style.height = w + 'px'; };
    place(240); im.style.left = (view.clientWidth / 2 - 120) + 'px'; im.style.top = (view.clientHeight * 0.55 - 120) + 'px';
    $('phSize').oninput = (e) => {
      const w = +e.target.value, r = im.getBoundingClientRect();
      im.style.left = (parseFloat(im.style.left) + r.width / 2 - w / 2) + 'px'; im.style.top = (parseFloat(im.style.top) + r.height / 2 - w / 2) + 'px'; place(w);
    };
    let drag = null;
    im.onpointerdown = (e) => { im.setPointerCapture(e.pointerId); drag = { x: e.clientX - parseFloat(im.style.left), y: e.clientY - parseFloat(im.style.top) }; };
    im.onpointermove = (e) => { if (drag) { im.style.left = e.clientX - drag.x + 'px'; im.style.top = e.clientY - drag.y + 'px'; } };
    im.onpointerup = () => { drag = null; };
    $('phClose').onclick = closePhoto;
    $('phShot').onclick = shoot;
    try { await camOn($('phVideo')); view.classList.add('cam'); }
    catch (e) { view.classList.remove('cam'); toast('📷 Без камеры — фото на фоне травы', 1600); }
  }
  function closePhoto() {
    $('photoView').classList.remove('on', 'cam'); $('photoView').innerHTML = ''; photo = null;
    if (enc && S.settings.ar) applyEncAr(); else camOff();
  }
  async function shoot() {
    const view = $('photoView'), W = view.clientWidth, H = view.clientHeight, k = Math.min(2, window.devicePixelRatio || 1);
    const c = document.createElement('canvas'); c.width = W * k; c.height = H * k;
    const g = c.getContext('2d'); g.scale(k, k);
    const v = $('phVideo');
    if (view.classList.contains('cam') && v.videoWidth) {
      const s = Math.max(W / v.videoWidth, H / v.videoHeight), vw = v.videoWidth * s, vh = v.videoHeight * s;
      g.drawImage(v, (W - vw) / 2, (H - vh) / 2, vw, vh);
    } else {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#5fb7f5'); sky.addColorStop(0.55, '#bfe6ff'); sky.addColorStop(0.551, '#6fbf5a'); sky.addColorStop(1, '#3e9a36');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
    }
    const im = $('phMon'), r = im.getBoundingClientRect(), vr = view.getBoundingClientRect();
    g.drawImage(im, r.left - vr.left, r.top - vr.top, r.width, r.height);
    const sp = SP(photo.spId);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, H - 46, W, 46);
    g.fillStyle = '#fff'; g.font = '800 16px Nunito, sans-serif'; g.textBaseline = 'middle';
    g.fillText(`${photo.shiny ? '✨ ' : ''}${sp.name}${photo.cp ? ' · CP ' + photo.cp : ''}`, 14, H - 23);
    g.textAlign = 'right'; g.fillText(`Покемон GO · ${new Date().toLocaleDateString('ru-RU')}`, W - 14, H - 23);
    flash(); tone(1800, 0.05, 'square', 0.05); vibrate(30);
    let blob;
    try { blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92)); } catch (e) { return toast('Не удалось сохранить фото'); }
    const url = URL.createObjectURL(blob), file = new File([blob], `pokemon-${sp.name}.jpg`, { type: 'image/jpeg' });
    const canShare = navigator.canShare && navigator.canShare({ files: [file] });
    popup(`<h2>📸 Готово!</h2><img class="ph-result" src="${url}" alt="">
      <div class="actions"><button class="btn" id="phSave">💾 Сохранить</button>${canShare ? '<button class="btn blue" id="phShare">📤 Поделиться</button>' : ''}<button class="btn ghost" data-ok>Ещё раз</button></div>`, (box) => {
      box.querySelector('#phSave').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('💾 Фото сохранено'); };
      const sh = box.querySelector('#phShare'); if (sh) sh.onclick = () => navigator.share({ files: [file], title: 'Покемон GO' }).catch(() => {});
    });
  }

  // ================= POCKET MODE & BATTERY SAVER =================
  let pocket = null;
  async function pocketOn() {
    pocket = { lock: null, near: new Set(), lastTap: 0 };
    markers.forEach((v, id) => { if (v.kind === 'mon' && v.close) pocket.near.add(id); });
    try { if (navigator.wakeLock) pocket.lock = await navigator.wakeLock.request('screen'); } catch (e) {}
    $('pocket').classList.add('on'); renderPocket(); SFX.tap();
  }
  function pocketOff() {
    if (pocket && pocket.lock) pocket.lock.release().catch(() => {});
    pocket = null; $('pocket').classList.remove('on');
  }
  function renderPocket(alert) {
    if (!pocket) return;
    const j = journalDay(), egg = S.eggs.slice().sort((a, b) => (a.km * 1000 - a.walked) - (b.km * 1000 - b.walked))[0];
    $('pocketBody').innerHTML = `<div class="pk-title">🌙 Карманный режим</div>
      <div class="pk-big">${(j.m / 1000).toFixed(2)} км</div><div class="pk-sub">пройдено сегодня</div>
      ${egg ? `<div class="pk-sub">🥚 ${(egg.walked / 1000).toFixed(2)} / ${egg.km} км</div>` : ''}
      <div class="pk-alert">${alert || 'Телефон завибрирует, когда рядом появится покемон'}</div>
      <div class="pk-exit">Дважды коснись экрана, чтобы выйти</div>`;
  }
  $('pocket').addEventListener('click', () => { if (!pocket) return; const now = Date.now(); if (now - pocket.lastTap < 400) pocketOff(); else pocket.lastTap = now; });
  document.addEventListener('visibilitychange', async () => {
    if (pocket && document.visibilityState === 'visible' && navigator.wakeLock) { try { pocket.lock = await navigator.wakeLock.request('screen'); } catch (e) {} }
  });
  function pocketCheck() {
    if (!pocket) return;
    const now = new Set(); let fresh = null;
    markers.forEach((v, id) => { if (v.kind === 'mon' && v.close) { now.add(id); if (!pocket.near.has(id)) fresh = v.data; } });
    pocket.near = now;
    if (fresh) { vibrate([150, 80, 150]); SFX.appear(); renderPocket(`${fresh.shiny ? '✨ ' : ''}Рядом ${fresh.sp.name}! Достань телефон`); }
    else renderPocket();
  }
  $('btnPocket').addEventListener('click', pocketOn);
  const spriteMode = () => S.settings.saver ? 'pixel' : S.settings.sprites;
  function applySaver() {
    document.body.classList.toggle('saver', !!S.settings.saver);
    try { if (map.setPixelRatio) map.setPixelRatio(S.settings.saver ? 1 : (window.devicePixelRatio || 1)); } catch (e) {}
    renderWeather();
  }

  // ================= BUDDY CARE (tamagotchi) =================
  // Affection (hearts) lives on the Pokémon itself, so it is kept when you switch buddies.
  const newBuddy = (uid) => Object.assign(newBuddyDefaults(uid), { giftDay: today() });
  const buddyMon = () => S.buddy && S.mons.find((x) => x.uid === S.buddy.uid);
  function affLevel(m) { const h = (m && m.aff) || 0; let l = 0; AFFECTION.forEach((a, i) => { if (h >= a.hearts) l = i; }); return l; }
  function buddyTick() {
    const b = S.buddy; if (!b) return;
    const now = Date.now(), hours = (now - (b.t || now)) / 36e5;
    b.food = Math.max(0, (b.food ?? 70) - hours * BUDDY_DECAY.food);
    b.mood = Math.max(0, (b.mood ?? 70) - hours * BUDDY_DECAY.mood);
    b.t = now;
    if (!b.day || b.day.date !== today()) b.day = { date: today(), feed: 0, pet: 0, play: 0, walk: 0 };
  }
  const excited = () => S.buddy && S.buddy.food >= 70 && S.buddy.mood >= 70;
  // Bonuses only work while the buddy is fed (not starving)
  function buddyPerk(kind) {
    const m = buddyMon(); if (!m) return 0;
    buddyTick();
    if (S.buddy.food < 10) return 0;
    const l = affLevel(m);
    if (kind === 'catch') return [0, 0, 0.05, 0.10, 0.15][l];
    if (kind === 'damage') return [0, 0, 0, 0.10, 0.15][l];
    if (kind === 'shiny') return l >= 4 ? 0.10 : 0;
    if (kind === 'candy') return l >= 1 ? 2 : 1;
    return 0;
  }
  function addHearts(kind, n) {
    const m = buddyMon(); if (!m) return 0;
    buddyTick();
    const d = S.buddy.day;
    if (d[kind] >= BUDDY_LIMITS[kind]) return 0;
    d[kind]++;
    const before = affLevel(m), gain = n * (excited() ? 2 : 1);
    m.aff = (m.aff || 0) + gain;
    const after = affLevel(m);
    save();
    if (after > before) setTimeout(() => {
      SFX.level(); vibrate([60, 40, 120]);
      popup(`<img class="art" src="${artUrl(m.sp, m.shiny)}" alt=""><h2>${SP(m.sp).name}: ${AFFECTION[after].name}!</h2>
        <p>Новые бонусы привязанности:</p>${rewardsHtml(AFFECTION[after].perks)}<button class="btn" data-ok>Ура!</button>`);
    }, 600);
    return gain;
  }
  function buddyMoodText() {
    const b = S.buddy;
    if (b.food < 10) return '😢 Очень голоден — бонусы не работают';
    if (b.food < 35) return '🍓 Проголодался';
    if (b.mood < 35) return '🎾 Скучает, поиграй с ним';
    if (excited()) return '✨ Счастлив! Сердечки ×2';
    return '🙂 Всё хорошо';
  }
  function buddyBubble() {
    const b = S.buddy, m = buddyMon(); if (!m) return '';
    buddyTick();
    if (affLevel(m) >= 2 && b.giftDay !== today()) return '🎁';
    if (b.food < 35) return '🍓';
    if (b.mood < 35) return '🎾';
    if (excited()) return '❤️';
    return '';
  }

  let buddyUi = null;
  function openBuddy() {
    const m = buddyMon();
    if (!m) return pickBuddy();
    buddyTick(); save();
    const s = SP(m.sp), l = affLevel(m), h = m.aff || 0, next = AFFECTION[l + 1], b = S.buddy, d = b.day;
    const prog = next ? (h - AFFECTION[l].hearts) / (next.hearts - AFFECTION[l].hearts) * 100 : 100;
    const gift = l >= 2 && b.giftDay !== today();
    const bar = (label, v, cls) => `<div class="bd-stat"><span>${label}</span><div class="bd-bar ${cls}"><i style="width:${v}%"></i></div><b>${Math.round(v)}%</b></div>`;
    $('buddySheet').innerHTML = `
      <div class="bd-scene" style="--tc:${TYPE_COLORS[s.type]}">
        <button class="close bd-close" id="bdClose">✕</button>
        <div class="bd-title"><b>${s.name}${genderIcon(m.g)}</b><small>${buddyMoodText()}</small></div>
        <div class="bd-stage" id="bdStage">
          <div class="bd-floor"></div>
          <img id="bdMon" class="${spriteMode()}" src="${spriteUrl(m.sp, m.shiny)}" alt="" draggable="false" ${fallback(m.sp)}>
          <div class="bd-play" id="bdPlay"></div>
        </div>
      </div>
      <div class="bd-body">
        <div class="bd-aff"><div><b>${'❤️'.repeat(l)}${'🤍'.repeat(4 - l)}</b><span>${AFFECTION[l].name}</span></div>
          <small>${next ? `${h} / ${next.hearts} сердечек до «${next.name}»` : `${h} сердечек — максимум!`}</small>
          <div class="bd-bar aff"><i style="width:${prog}%"></i></div></div>
        ${bar('🍖 Сытость', b.food, 'food')}${bar('😊 Настроение', b.mood, 'mood')}
        <div class="bd-actions">
          <button class="bd-act" id="bdFeed"><b>🍓</b>Покормить<small>${d.feed}/${BUDDY_LIMITS.feed} ❤️</small></button>
          <button class="bd-act" id="bdPet"><b>✋</b>Погладить<small>${d.pet}/${BUDDY_LIMITS.pet} ❤️</small></button>
          <button class="bd-act" id="bdGame"><b>🎾</b>Поиграть<small>${d.play}/${BUDDY_LIMITS.play} ❤️</small></button>
          <button class="bd-act" id="bdWalk"><b>👟</b>Гулять<small>${d.walk}/${BUDDY_LIMITS.walk} ❤️</small></button>
          ${gift ? '<button class="bd-act gift" id="bdGift"><b>🎁</b>Подарок!<small>забрать</small></button>' : ''}
          <button class="bd-act" id="bdPhoto"><b>📸</b>Фото<small>&nbsp;</small></button>
        </div>
        <p class="bd-hint" id="bdHint">Сердечки за день: корми, гладь, играй и гуляй вместе. Когда напарник сыт и весел, сердечки удваиваются.</p>
        <h3>Бонусы привязанности</h3>
        <div class="bd-perks">${AFFECTION.slice(1).map((a, i) => `<div class="bd-perk ${l >= i + 1 ? 'on' : ''}"><b>${'❤️'.repeat(i + 1)} ${a.name}</b><small>${a.perks.join(' · ')}</small></div>`).join('')}</div>
        <button class="btn ghost" id="bdChange" style="width:100%;margin-top:14px">🔄 Сменить напарника</button>
      </div>`;
    $('buddySheet').classList.add('on');
    sizeSprite($('bdMon'), 170, 220, 3);
    buddyUi = { m, pet: 0 };
    $('bdClose').onclick = closeBuddy;
    $('bdFeed').onclick = feedMenu;
    $('bdPet').onclick = () => { $('bdHint').textContent = '✋ Гладь покемона пальцем!'; buddyUi.petting = true; SFX.tap(); };
    $('bdGame').onclick = playGame;
    $('bdWalk').onclick = () => popup(`<div class="big">👟</div><h2>Гуляйте вместе</h2><p>За каждый пройденный километр напарник получает сердечко (до ${BUDDY_LIMITS.walk} в день) и иногда находит конфеты.</p><button class="btn" data-ok>Понятно</button>`);
    $('bdPhoto').onclick = () => openPhoto({ spId: m.sp, shiny: m.shiny, cp: m.cp, g: m.g });
    $('bdChange').onclick = pickBuddy;
    const gb = $('bdGift'); if (gb) gb.onclick = buddyGift;
  }
  function closeBuddy() { $('buddySheet').classList.remove('on'); buddyUi = null; renderBuddyMarker(); }
  function bdHeartsAt(el, n = 6, chars = ['❤️', '💕', '💖']) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 3, chars, n); }

  function feedMenu() {
    const b = S.buddy;
    popup(`<h2>Чем угостить?</h2><div class="list">${Object.keys(BUDDY_FOOD).map((k) => { const f = BUDDY_FOOD[k], n = S.items[k] || 0;
      return `<div class="row"><div class="ic">${f.icon}</div><div class="grow"><b>${f.name} ×${n}</b><small>Сытость +${f.food}% · настроение +${f.mood}%</small></div>
        <button class="btn sm" data-food="${k}" ${n ? '' : 'disabled'}>Дать</button></div>`; }).join('')}</div>
      <p>${b.food >= 100 ? 'Напарник сыт, но от лакомства не откажется.' : ''}</p><button class="btn ghost" data-ok>Отмена</button>`, (box) => {
      box.addEventListener('click', (e) => {
        const k = e.target.dataset && e.target.dataset.food; if (!k || !S.items[k]) return;
        const f = BUDDY_FOOD[k];
        S.items[k]--; b.food = Math.min(100, b.food + f.food); b.mood = Math.min(100, b.mood + f.mood);
        const got = addHearts('feed', f.hearts);
        save(); closePopup(); SFX.berry(); vibrate(30);
        const im = $('bdMon');
        if (im) { im.classList.add('eat'); setTimeout(() => im.classList.remove('eat'), 700); bdHeartsAt(im, 8, [f.icon, '❤️']); }
        toast(got ? `Ням! ❤️ +${got}` : 'Ням! (сердечки за еду на сегодня уже собраны)', 1500);
        setTimeout(openBuddy, 800);
      });
    });
  }
  // Petting: rub the Pokémon with a finger
  $('buddySheet').addEventListener('pointermove', (e) => {
    if (!buddyUi || !buddyUi.petting || !e.target.closest('#bdMon') || !(e.buttons || e.pointerType === 'touch')) return;
    const p = [e.clientX, e.clientY];
    if (buddyUi.last) buddyUi.pet += Math.hypot(p[0] - buddyUi.last[0], p[1] - buddyUi.last[1]);
    buddyUi.last = p;
    if (buddyUi.pet - (buddyUi.lastHeart || 0) > 140) {
      buddyUi.lastHeart = buddyUi.pet;
      floatText(e.clientX, e.clientY - 20, '❤️');
      S.buddy.mood = Math.min(100, S.buddy.mood + 4);
      tone(880 + Math.random() * 300, 0.08, 'sine', 0.05); vibrate(10);
    }
    if (buddyUi.pet > 900) {
      buddyUi.petting = false; buddyUi.pet = 0; buddyUi.lastHeart = 0;
      const got = addHearts('pet', 1); save();
      bdHeartsAt($('bdMon'), 10);
      toast(got ? `${SP(buddyUi.m.sp).name} доволен! ❤️ +${got}` : `${SP(buddyUi.m.sp).name} доволен!`, 1400);
      setTimeout(openBuddy, 900);
    }
  });
  $('buddySheet').addEventListener('pointerup', () => { if (buddyUi) buddyUi.last = null; });

  // Mini-game: tap the ball 8 times in 15 seconds
  function playGame() {
    if (!buddyUi || buddyUi.game) return;
    const area = $('bdPlay'), im = $('bdMon');
    const g = buddyUi.game = { hits: 0, need: 8, ends: Date.now() + 15000 };
    $('bdHint').textContent = `🎾 Лови мячик! 0 / ${g.need}`;
    const spawn = () => {
      if (!buddyUi || buddyUi.game !== g) return;
      if (Date.now() > g.ends) return finish(false);
      area.innerHTML = `<button class="bd-ball" style="left:${10 + Math.random() * 75}%;top:${8 + Math.random() * 60}%">🎾</button>`;
      const ball = area.querySelector('.bd-ball');
      const t = setTimeout(spawn, 1100);
      ball.onpointerdown = (e) => {
        e.stopPropagation(); clearTimeout(t); g.hits++;
        SFX.tap(); vibrate(15); floatText(e.clientX, e.clientY, '+1');
        im.classList.add('jump'); setTimeout(() => im.classList.remove('jump'), 400);
        $('bdHint').textContent = `🎾 Лови мячик! ${g.hits} / ${g.need}`;
        if (g.hits >= g.need) finish(true); else spawn();
      };
    };
    const finish = (win) => {
      area.innerHTML = ''; buddyUi.game = null;
      S.buddy.mood = Math.min(100, S.buddy.mood + (win ? 35 : 10));
      const got = win ? addHearts('play', 2) : 0; save();
      if (win) { SFX.catch(); bdHeartsAt(im, 12); }
      toast(win ? `Победа! ${got ? `❤️ +${got}` : 'Настроение выросло'}` : 'Время вышло, но было весело!', 1600);
      setTimeout(openBuddy, 900);
    };
    spawn();
  }
  function buddyGift() {
    const m = buddyMon(); if (!m || S.buddy.giftDay === today()) return;
    S.buddy.giftDay = today();
    const best = affLevel(m) >= 4, r = Math.random;
    const parts = grant({ basic: best ? 10 : 5, great: best ? 5 : 2, berry: 2, ultra: best ? 2 : 0, poffin: r() < (best ? 0.5 : 0.2) ? 1 : 0, dust: dustGain(best ? 1000 : 400) });
    if (r() < (best ? 0.3 : 0.1) && S.eggs.length < MAX_EGGS) { addEgg(best ? 10 : 5); parts.push(`🥚 ${best ? 10 : 5} км`); }
    SFX.spin(); bdHeartsAt($('bdMon'), 10, ['🎁', '✨']);
    popup(`<div class="big">🎁</div><h2>${SP(m.sp).name} принёс подарок!</h2>${rewardsHtml(parts)}<button class="btn" data-ok>Спасибо!</button>`);
    setTimeout(openBuddy, 300);
  }
  function pickBuddy() {
    const list = S.mons.slice().sort((a, b) => (b.aff || 0) - (a.aff || 0) || b.cp - a.cp).slice(0, 30);
    if (!list.length) return toast('Сначала поймай покемона!');
    popup(`<h2>Выбери напарника</h2><p>Он будет ходить рядом, искать конфеты и становиться твоим другом.</p>
      <div class="team-pick">${list.map((m) => `<div data-bud="${m.uid}" style="cursor:pointer"><img src="${pixelUrl(m.sp, m.shiny)}" alt="">${SP(m.sp).name}${m.aff ? `<br>❤️ ${m.aff}` : ''}</div>`).join('')}</div>
      <button class="btn ghost" data-ok>Отмена</button>`, (box) => {
      box.addEventListener('click', (e) => {
        const c = e.target.closest('[data-bud]'); if (!c) return;
        S.buddy = newBuddy(+c.dataset.bud); save(); renderBuddyMarker(); closePopup(); SFX.spin();
        setTimeout(openBuddy, 200);
      });
    });
  }
  // Ultra friends notice rare Pokémon nearby
  const noticed = new Set();
  function buddyNotice() {
    const m = buddyMon(); if (!m || affLevel(m) < 3 || !pos) return;
    markers.forEach((v, id) => {
      if (v.kind !== 'mon' || noticed.has(id) || !(v.data.sp.rarity >= 3 || v.data.shiny)) return;
      const d = dist(pos, v.data.ll); if (d > 250) return;
      noticed.add(id);
      toast(`<img src="${pixelUrl(m.sp, m.shiny)}" alt="">${SP(m.sp).name} что-то заметил!<br><small>${v.data.shiny ? '✨ ' : ''}${v.data.sp.name} в ${fmtDist(d)}</small>`, 2600);
      vibrate([60, 60, 60]);
    });
  }
  setInterval(() => { if (S.buddy) { buddyTick(); renderBuddyMarker(); } }, 60000);

  // ================= PREMIUM STORE (donations) =================
  function renderStore() {
    ensurePass();
    $('storeBody').innerHTML = `
      <div class="store-hero"><div><small>Твои кристаллы</small><b>💎 ${fmtNum(S.gems)}</b></div><span>Кристаллы дают за медали и каждые 5 уровней, а скоро их можно будет купить</span></div>
      <h3>Кристаллы</h3>
      <div class="gem-grid">${GEM_PACKS.map((g) => `<button class="gem-pack" data-gempack="${g.id}">${g.tag ? `<em>${g.tag}</em>` : ''}
        <span class="gp-ic">${g.icon}</span><b>${fmtNum(g.gems)}</b>${g.bonus ? `<small>+${g.bonus} бонус</small>` : '<small>&nbsp;</small>'}<i>${g.price}</i></button>`).join('')}</div>
      <h3>Предложения</h3>
      <div class="list">${GEM_OFFERS.map((o) => {
        const bought = o.once && S.offersBought[o.id], owned = o.pass && S.pass.premium;
        const what = o.pass ? 'Открывает премиум-дорожку текущего сезона' : Object.keys(o.give).map((k) => rewardLabel(k, o.give[k])).join(' · ');
        return `<div class="row offer"><div class="ic">${o.icon}</div><div class="grow"><b>${o.title}</b><small>${what}${o.once ? ' · только один раз' : ''}</small></div>
          ${bought || owned ? '<span class="cnt">✓</span>' : `<button class="btn sm" data-offer="${o.id}" ${S.gems >= o.gems ? '' : 'disabled'}>💎 ${o.gems}</button>`}</div>`;
      }).join('')}</div>
      ${DONATE.supportUrl ? `<a class="btn blue support" href="${DONATE.supportUrl}" target="_blank" rel="noopener">💛 Поддержать автора</a>` : ''}
      <p class="store-note">Покупки за реальные деньги включатся после подключения сервера и платёжной системы.</p>`;
  }
  $('storeBody').addEventListener('click', (e) => {
    const gp = e.target.closest('[data-gempack]');
    if (gp) {
      const g = GEM_PACKS.find((x) => x.id === gp.dataset.gempack);
      if (!DONATE.enabled) {
        return popup(`<div class="big">${g.icon}</div><h2>${fmtNum(g.gems + g.bonus)} кристаллов · ${g.price}</h2>
          <p>Оплата пока не подключена: для неё нужен сервер, который подтвердит платёж и начислит кристаллы. Скоро заработает!</p>
          ${DONATE.supportUrl ? `<a class="btn blue" href="${DONATE.supportUrl}" target="_blank" rel="noopener">💛 Поддержать автора</a> ` : ''}<button class="btn ghost" data-ok>Понятно</button>`);
      }
      return;
    }
    const of = e.target.closest('[data-offer]');
    if (of) {
      const o = GEM_OFFERS.find((x) => x.id === of.dataset.offer);
      if (S.gems < o.gems || (o.once && S.offersBought[o.id])) return;
      if (o.pass) { ensurePass(); if (S.pass.premium) return; S.pass.premium = true; renderPassDot(); }
      S.gems -= o.gems;
      if (o.once) S.offersBought[o.id] = true;
      const parts = o.give ? grant(o.give) : ['⭐ Премиум-пропуск'];
      save(); renderHud(); SFX.coin();
      const r = of.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, ['💎', '✨'], 10);
      popup(`<div class="big">${o.icon}</div><h2>${o.title}</h2>${rewardsHtml(parts)}<button class="btn" data-ok>Отлично!</button>`);
      renderStore();
    }
  });

  // ================= BAG: items, eggs, shop =================
  let bagTab = 'items';
  function renderBag() {
    document.querySelectorAll('#bagTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === bagTab));
    const now = Date.now();
    if (bagTab === 'items') {
      const incActive = S.incenseUntil > now, luckActive = S.luckyUntil > now, freePass = S.freePassDay !== today();
      const row = (ic, name, desc, right) => `<div class="row"><div class="ic">${ic}</div><div class="grow"><b>${name}</b><small>${desc}</small></div>${right}</div>`;
      $('bagBody').innerHTML = `<div class="wallet"><div>💫 ${fmtNum(S.stardust)}<small>звёздная пыль</small></div><div>🪙 ${fmtNum(S.coins)}<small>монеты</small></div></div><div class="list">` +
        Object.keys(BALLS).map((k) => row(BALLS[k].icon, BALLS[k].name, BALLS[k].desc, `<span class="cnt">×${S.balls[k]}</span>`)).join('') +
        row(ITEMS.berry.icon, ITEMS.berry.name, ITEMS.berry.desc, `<span class="cnt">×${S.items.berry}</span>`) +
        row(ITEMS.incense.icon, `${ITEMS.incense.name} ×${S.items.incense}`, ITEMS.incense.desc,
          `<button class="btn sm" data-use="incense" ${S.items.incense && !incActive ? '' : 'disabled'}>${incActive ? 'Активен' : 'Зажечь'}</button>`) +
        row(ITEMS.lucky.icon, `${ITEMS.lucky.name} ×${S.items.lucky}`, ITEMS.lucky.desc,
          `<button class="btn sm" data-use="lucky" ${S.items.lucky && !luckActive ? '' : 'disabled'}>${luckActive ? 'Активно' : 'Включить'}</button>`) +
        row(ITEMS.pass.icon, ITEMS.pass.name, ITEMS.pass.desc + (freePass ? ' · бесплатный сегодня доступен' : ''), `<span class="cnt">×${S.items.pass + (freePass ? 1 : 0)}</span>`) +
        '</div><h3>Конфеты</h3>' +
        (Object.keys(S.candy).length ? '<div class="list">' + Object.keys(S.candy).sort((a, b) => a - b).map((f) =>
          `<div class="row"><img src="${pixelUrl(f)}" alt="" style="width:48px;height:48px;image-rendering:pixelated"><div class="grow"><b>Конфеты: ${SP(+f).name}</b><small>Для эволюции и усиления этой семьи</small></div><span class="cnt">🍬 ${S.candy[f]}</span></div>`).join('') + '</div>'
          : '<div class="empty-note">Лови покемонов, чтобы получать конфеты.</div>');
    } else if (bagTab === 'gear') {
      $('bagBody').innerHTML = renderGearTab();
    } else if (bagTab === 'eggs') {
      $('bagBody').innerHTML = `<p style="color:var(--muted)">Яйца вылупляются, пока ты гуляешь. Их дают на покестопах и за уровни. Места: ${S.eggs.length}/${MAX_EGGS}.</p>` +
        (S.eggs.length ? '<div class="list">' + S.eggs.map((e) => `<div class="row"><span class="egg k${e.km}"></span><div class="grow"><b>Яйцо ${e.km} км</b>
          <small>${(e.walked / 1000).toFixed(2)} / ${e.km} км · ${e.km === 2 ? 'обычные покемоны' : e.km === 5 ? 'необычные покемоны' : 'редкие покемоны!'}</small>
          <div class="egg-prog"><i style="width:${e.walked / (e.km * 1000) * 100}%"></i></div></div></div>`).join('') + '</div>'
          : '<div class="empty-note">Яиц нет. Крути покестопы! 🎁</div>') +
        (S.buddy ? (() => { const m = S.mons.find((x) => x.uid === S.buddy.uid); return m ? `<h3>Напарник</h3><div class="row"><img src="${pixelUrl(m.sp, m.shiny)}" alt="" style="width:56px;height:56px;image-rendering:pixelated"><div class="grow"><b>${SP(m.sp).name} 🐾</b><small>Конфета каждые ${buddyKm(m)} км</small><div class="egg-prog"><i style="width:${S.buddy.walked / (buddyKm(m) * 1000) * 100}%"></i></div></div></div>` : ''; })() : '');
    } else {
      $('bagBody').innerHTML = `<button class="store-banner" id="toStore"><b>💎 Магазин кристаллов</b><small>Наборы, премиум-пропуск и поддержка игры</small><span>${fmtNum(S.gems)} 💎</span></button>
        <div class="wallet"><div>🪙 ${fmtNum(S.coins)}<small>монеты: за медали, бонусы дня и бои</small></div></div><div class="shop">` +
        SHOP.map((it) => `<div class="shop-item"><div class="ic">${it.icon}</div><b>${it.title}</b><button class="btn sm" data-buy="${it.id}" ${S.coins >= it.price ? '' : 'disabled'}>🪙 ${it.price}</button></div>`).join('') + '</div>' +
        `<h3>🧢 Снаряжение дня <small style="color:var(--muted);font-weight:700">· обновляется каждый день</small></h3><div class="list">${gearShopOffers().map((g) => gearRow(g,
          S.gear.owned[g.id] ? '<span class="cnt">✓</span>' : `<button class="btn sm" data-buygear="${g.id}" ${S.coins >= GEAR_RARITY[g.rarity].price ? '' : 'disabled'}>🪙 ${GEAR_RARITY[g.rarity].price}</button>`)).join('')}</div>`;
    }
  }
  $('bagTabs').addEventListener('click', (e) => { if (e.target.dataset.tab) { bagTab = e.target.dataset.tab; SFX.tap(); renderBag(); } });
  $('bagBody').addEventListener('click', (e) => {
    if (e.target.closest('#toStore')) { $('bag').classList.remove('on'); return openSheet('store', renderStore); }
    const gb = e.target.closest('[data-buygear]');
    if (gb) {
      const g = GEAR_BY_ID[gb.dataset.buygear], price = GEAR_RARITY[g.rarity].price;
      if (S.coins < price || S.gear.owned[g.id]) return;
      S.coins -= price; addGear(g.id); SFX.coin(); toast(`${g.icon} ${g.name} — твоё!<br><small>Надень во вкладке «Снаряжение»</small>`, 2000); return renderBag();
    }
    const ge = e.target.closest('[data-gear]');
    if (ge) { toggleGear(ge.dataset.gear); SFX.tap(); return renderBag(); }
    const use = e.target.closest('[data-use]');
    if (use) {
      const k = use.dataset.use;
      if (k === 'incense' && S.items.incense) { S.items.incense--; S.incenseUntil = Date.now() + INCENSE_MS; lastIncense = 0; toast('🪔 Ладан зажжён на 15 минут!'); }
      if (k === 'lucky' && S.items.lucky) { S.items.lucky--; S.luckyUntil = Date.now() + LUCKY_MS; toast('🍀 Опыт ×2 на 30 минут!'); }
      save(); SFX.spin(); renderBag(); buffTick(); return;
    }
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const it = SHOP.find((x) => x.id === buy.dataset.buy);
      if (S.coins < it.price) return;
      if (it.egg && S.eggs.length >= MAX_EGGS) return toast('Нет места для яиц');
      S.coins -= it.price;
      if (it.egg) addEgg(it.egg); else grant(it.give);
      save(); SFX.coin();
      const r = buy.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, ['🪙', '✨'], 8);
      toast(`Куплено: ${it.title}`); renderBag();
    }
  });

  // ================= PROFILE =================
  function renderProfile() {
    ensureQuests();
    const { lvl, rest, need } = levelFromXp(S.xp);
    const qs = S.quests.list.map((q, i) => {
      const goal = questGoal(q), done = q.p >= goal, t = QT[q.k];
      const prog = q.k === 'walk' ? `${(q.p / 1000).toFixed(2)} / ${q.n} км` : `${Math.floor(q.p)} / ${q.n}`;
      const rew = Object.keys(t.reward).map((k) => rewardLabel(k, t.reward[k])).join(' ');
      return `<div class="quest ${q.claimed ? 'done' : ''}"><div class="qt"><div><b>${t.text(q)}</b><br><small>${prog} · награда: ${rew} +500 XP</small></div>
        ${q.claimed ? '✅' : done ? `<button class="btn sm" data-claim="${i}">Забрать</button>` : ''}</div>
        <div class="prog"><i style="width:${Math.min(100, q.p / goal * 100)}%"></i></div></div>`;
    }).join('');
    const medals = MEDALS.map((m) => {
      const v = m.val(), tier = m.tiers.filter((t) => v >= t).length, next = m.tiers[tier];
      return `<div class="medal t${tier}"><div class="mi">${m.icon}</div><div><b>${m.name}</b>
        <small>${(Math.floor(v * 10) / 10).toLocaleString('ru-RU')} ${m.unit}${next ? ` · до след.: ${next}` : ' · максимум!'}</small></div></div>`;
    }).join('');
    const team = S.trainer.team && TEAMS[S.trainer.team];
    $('profileBody').innerHTML = `
      <div class="trainer-card" style="--c:${S.trainer.color};${team ? `--tc:${team.color}` : ''}">
        ${avatarHtml(true)}
        <div class="grow"><b>${esc(S.trainer.name || 'Тренер')}</b>
          <small>${team ? `${team.icon} Команда ${team.name} · ${team.desc}` : lvl >= 5 ? 'Выбери команду!' : 'Команда откроется на 5 уровне'}</small>
          <div class="actions" style="justify-content:flex-start;margin-top:8px">
            <button class="btn sm ghost" id="editTrainer">✏️ Внешность</button>
            <button class="btn sm ghost" id="openJournal">📔 Дневник</button>
            ${lvl >= 5 ? `<button class="btn sm ${team ? 'ghost' : ''}" id="pickTeam">${team ? '🔄 Сменить команду' : '🛡️ Выбрать команду'}</button>` : ''}
          </div></div>
      </div>
      <div class="stats">
        <div><b>${lvl}</b><span>уровень</span></div>
        <div><b>${fmtNum(S.xp)}</b><span>всего XP</span></div>
        <div><b>${Math.round(rest / need * 100)}%</b><span>до ур. ${lvl + 1}</span></div>
        <div><b>${S.totalCaught}</b><span>поймано</span></div>
        <div><b>${(S.walked / 1000).toFixed(2)}</b><span>км пройдено</span></div>
        <div><b>${S.trainerWins + S.raidWins}</b><span>побед в боях</span></div>
      </div>
      <h3>📅 Серия: ${S.streak.count} ${plural(S.streak.count, 'день', 'дня', 'дней')}</h3>${streakHtml()}
      <h3>📜 Задания на сегодня</h3>${qs}
      <p style="color:var(--muted);font-size:13px">☀️ Первая поимка каждого дня даёт +1000 XP. Новые задания — каждый день.</p>
      <h3>🏅 Медали <small style="color:var(--muted);font-weight:700">· за каждую — монеты 🪙</small></h3><div class="medals">${medals}</div>`;
  }
  $('profileBody').addEventListener('click', (e) => {
    if (e.target.id === 'editTrainer') return trainerSetup(false);
    if (e.target.id === 'openJournal') { $('profile').classList.remove('on'); return openSheet('journal', renderJournal); }
    if (e.target.id === 'pickTeam') return teamPicker();
    const b = e.target.closest('[data-claim]'); if (!b) return;
    const q = S.quests.list[+b.dataset.claim]; if (q.claimed) return;
    q.claimed = true;
    const parts = grant(Object.assign({ coins: 10 }, QT[q.k].reward));
    passXp(PASS_POINTS.quest);
    const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, ['🎁', '✨', '⭐'], 12);
    SFX.catch(); const xp = addXp(500); toast(`Награда!<br>${parts.join('  ')}<br><small>+${xp} XP</small>`, 2000);
    renderQuestDot(); renderProfile();
  });

  // ================= SETTINGS =================
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  function renderSettings() {
    const sw = (k, title, sub) => `<div class="set-row"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div><button class="switch ${S.settings[k] ? 'on' : ''}" data-sw="${k}"></button></div>`;
    const seg = (k, title, opts) => `<div class="set-row col"><div><b>${title}</b></div><div class="seg">${opts.map(([v, l]) =>
      `<button class="${S.settings[k] === v ? 'on' : ''}" data-seg="${k}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    $('settingsBody').innerHTML =
      (isStandalone() ? '' : `<div class="set-row"><div><b>📲 Установить как приложение</b><small>${installPrompt ? 'Иконка на главном экране, запуск на весь экран' : ios ? 'Safari: «Поделиться» → «На экран «Домой»»' : 'Меню браузера → «Установить приложение» / «Добавить на главный экран»'}</small></div>${installPrompt ? '<button class="btn sm" id="installBtn">Установить</button>' : ''}</div>`) +
      '<h3>Карта</h3>' +
      seg('mapStyle', 'Стиль карты', [['auto', 'Авто'], ['day', 'День'], ['night', 'Ночь'], ['light', 'Светлая']]) +
      sw('buildings', '3D-здания', 'Объёмные дома на карте') +
      sw('tilt', 'Наклон камеры', '3D-вид сверху под углом') +
      sw('weatherFx', 'Эффекты погоды', 'Дождь, снег, туман и ветер на экране') +
      sw('radius', 'Радиус ловли', 'Синий круг вокруг тебя') +
      '<h3>Игра</h3>' +
      seg('sprites', 'Покемоны', [['anim', 'Анимированные'], ['pixel', 'Пиксельные']]) +
      sw('music', 'Музыка') +
      sw('sound', 'Звуки') +
      sw('vibro', 'Вибрация', 'Работает на Android') +
      sw('ar', 'AR-режим при ловле', 'Покемон на фоне камеры телефона') +
      sw('saver', 'Экономия батареи', 'Без анимаций, эффектов погоды и с простыми спрайтами') +
      `<div class="set-row"><div><b>Обучение</b><small>Показать подсказки для новичка ещё раз</small></div><button class="btn sm ghost" id="tutBtn">Показать</button></div>` +
      '<h3>Сохранение</h3>' +
      `<div class="set-row"><div><b>Сохранить в файл</b><small>Чтобы перенести прогресс на другой телефон</small></div><button class="btn sm blue" id="exportBtn">Скачать</button></div>` +
      `<div class="set-row"><div><b>Загрузить из файла</b><small>Заменит текущий прогресс</small></div><button class="btn sm ghost" id="importBtn">Выбрать</button></div>` +
      `<div class="set-row"><div><b>Сбросить прогресс</b><small>Удалит всех покемонов, уровень и предметы</small></div><button class="btn sm red" id="resetBtn">Сбросить</button></div>` +
      `<p style="color:var(--muted);font-size:12px;text-align:center;margin-top:20px">Покемон GO · фанатская игра. Pokémon © Nintendo / Game Freak.<br>Карта © OpenFreeMap, OpenStreetMap. Погода: Open-Meteo. Спрайты: PokéAPI.</p>`;
  }
  $('settingsBody').addEventListener('click', async (e) => {
    const t = e.target;
    if (t.dataset.sw) { const k = t.dataset.sw; S.settings[k] = !S.settings[k]; save(); SFX.tap(); applySetting(k); renderSettings(); return; }
    if (t.dataset.seg) { const k = t.dataset.seg; S.settings[k] = t.dataset.v; save(); SFX.tap(); applySetting(k); renderSettings(); return; }
    if (t.id === 'tutBtn') { $('settings').classList.remove('on'); showTutorial(0); }
    if (t.id === 'installBtn' && installPrompt) { installPrompt.prompt(); await installPrompt.userChoice.catch(() => {}); installPrompt = null; renderSettings(); }
    if (t.id === 'exportBtn') exportSave();
    if (t.id === 'importBtn') $('importFile').click();
    if (t.id === 'resetBtn') {
      if (t.dataset.armed) {
        const keep = S.settings; S = defaultState(); S.settings = keep; S.tutorialDone = true; save();
        renderHud(); renderQuestDot(); incenseSpawns = []; rebuildMarkers(); renderSettings(); toast('Прогресс сброшен');
      } else { t.dataset.armed = 1; t.textContent = 'Точно?'; }
    }
  });
  function exportSave() {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `pokemon-go-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('💾 Файл сохранён');
  }
  $('importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (typeof data.xp !== 'number' || !Array.isArray(data.mons)) throw new Error('bad');
      S = migrate(data); save();
      toast('✅ Прогресс загружен'); setTimeout(() => location.reload(), 800);
    } catch (err) { toast('❌ Это не файл сохранения игры'); }
    e.target.value = '';
  });
  function applySetting(k) {
    if (k === 'mapStyle') applyMapStyle();
    if (k === 'buildings') applyBuildings();
    if (k === 'tilt') map.easeTo({ pitch: S.settings.tilt ? PITCH : 0, duration: 600 });
    if (k === 'radius') updateRange();
    if (k === 'sprites') rebuildMarkers();
    if (k === 'weatherFx') renderWeather();
    if (k === 'music') { if (S.settings.music) { audio(); playMusic(battle ? 'battle' : 'map'); } else stopMusicTimer(); }
    if (k === 'sound' && S.settings.sound) SFX.tap();
    if (k === 'vibro') vibrate(50);
    if (k === 'saver') { applySaver(); rebuildMarkers(); }
  }

  // ================= TUTORIAL =================
  const TUTORIAL = [
    ['👋', 'Привет, тренер!', 'Это игра про покемонов в твоём городе. Гуляй по-настоящему — и они будут появляться рядом с тобой на карте.'],
    ['🎯', 'Ловля', 'Подойди к покемону ближе 70 м (синий круг) и нажми на него. Смахни покебол вверх. Бросай, когда цветное кольцо маленькое — шанс выше!<br><br>🌀 Покрути покебол пальцем по кругу перед броском — получится кручёный бросок.'],
    ['🎁', 'Покестопы, яйца и напарник', 'Покестопы — столбики с крутящимся диском, они стоят у настоящих мест твоего города. Открой покестоп и раскрути диск пальцем: выпадут покеболы, ягоды и яйца. Яйца вылупляются, пока ты гуляешь. Выбери покемона-напарника — он будет ходить рядом и находить конфеты. Корми его, гладь и играй с ним: чем крепче дружба, тем больше бонусов.'],
    ['⚔️', 'Бои и рейды', 'Красные значки VS — тренеры, с ними можно сразиться. Покестопы с боссом — рейды: победи его командой и поймай! В бою тапай по экрану, а когда враг светится красным — жми «Уклон».'],
    ['🌦️', 'Погода и местность', 'Погода настоящая: в дождь больше водных, в солнце — огненных и травяных. У воды живут водные покемоны, в парках — травяные и жуки, в городе — электрические и боевые.'],
    ['🧬', 'Развитие', 'За поимки дают конфеты и звёздную пыль. С ними покемонов можно усиливать и эволюционировать. Выполняй задания дня, собирай медали и заходи каждый день за бонусом!'],
  ];
  function showTutorial(i) {
    const [ic, title, text] = TUTORIAL[i], last = i === TUTORIAL.length - 1;
    popup(`<div class="big">${ic}</div><h2>${title}</h2><p class="left">${text}</p>
      <div class="tut-dots">${TUTORIAL.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="actions">${i ? '<button class="btn ghost" id="tutPrev">Назад</button>' : '<button class="btn ghost" id="tutSkip">Пропустить</button>'}
      <button class="btn" id="tutNext">${last ? 'Начать!' : 'Далее'}</button></div>`, (box) => {
      const done = () => { S.tutorialDone = true; save(); closePopup(); if (!S.trainer.name) setTimeout(() => trainerSetup(true), 200); };
      box.querySelector('#tutNext').onclick = () => { if (last) return done(); $('popup').classList.remove('on'); showTutorial(i + 1); };
      const prev = box.querySelector('#tutPrev'); if (prev) prev.onclick = () => { $('popup').classList.remove('on'); showTutorial(i - 1); };
      const skip = box.querySelector('#tutSkip'); if (skip) skip.onclick = done;
    });
  }

  // ================= NAV =================
  const openSheet = (id, render) => { SFX.tap(); render(); $(id).classList.add('on'); $(id).scrollTop = 0; };
  $('btnDex').addEventListener('click', () => openSheet('dex', renderDex));
  $('btnBag').addEventListener('click', () => openSheet('bag', renderBag));
  $('btnProfile').addEventListener('click', () => openSheet('profile', renderProfile));
  $('btnProfile2').addEventListener('click', () => openSheet('profile', renderProfile));
  $('btnSettings').addEventListener('click', () => openSheet('settings', renderSettings));
  $('btnPass').addEventListener('click', () => openSheet('passSheet', renderPass));
  $('btnBuddy').addEventListener('click', () => { SFX.tap(); openBuddy(); });
  $('gemChip').addEventListener('click', () => openSheet('store', renderStore));
  $('eggChip').addEventListener('click', () => { bagTab = 'eggs'; openSheet('bag', renderBag); });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { SFX.tap(); $(b.dataset.close).classList.remove('on'); }));
  $('btnCenter').addEventListener('click', () => {
    SFX.tap(); follow = true;
    if (pos) map.easeTo({ center: [pos[1], pos[0]], zoom: ZOOM, pitch: S.settings.tilt ? PITCH : 0, duration: 700 });
  });
  $('btnCompass').addEventListener('click', () => { SFX.tap(); map.easeTo({ bearing: 0, duration: 600 }); });

  // ================= CONNECTION & LOCATION GUARDS =================
  // The game needs both internet and real GPS. While either is missing a blocking screen covers everything.
  const blocks = {};
  const isBlocked = () => Object.keys(blocks).length > 0;
  function setBlock(key, html) {
    if (html) blocks[key] = html; else delete blocks[key];
    const msg = blocks.offline || blocks.gps;
    $('blocker').classList.toggle('on', !!msg);
    if (msg) $('blockerBox').innerHTML = msg;
    if (battle) {
      if (msg && !battle.pausedAt) battle.pausedAt = Date.now();
      if (!msg && battle.pausedAt) { const d = Date.now() - battle.pausedAt; battle.start += d; battle.nextEnemy += d; battle.pausedAt = 0; }
    }
  }
  $('blocker').addEventListener('click', (e) => {
    if (e.target.id === 'retryNet') ping();
    if (e.target.id === 'retryGps') startGps();
  });

  let online = true, failStreak = 0;
  async function ping() {
    if (!navigator.onLine) return setOnline(false);
    const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(`manifest.webmanifest?ping=${Date.now()}`, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error(r.status);
      failStreak = 0; setOnline(true);
    } catch (e) {
      if (++failStreak >= 2) setOnline(false); else setTimeout(ping, 1500);
    } finally { clearTimeout(to); }
  }
  function setOnline(v) {
    if (v === online && (v || blocks.offline)) return;
    online = v;
    setBlock('offline', v ? null : `<div class="big pulse">📡</div><h2>Нет подключения к интернету</h2>
      <p>Покемон GO работает только онлайн. Проверь мобильный интернет или Wi-Fi — игра продолжится сама, как только связь появится.</p>
      <button class="btn" id="retryNet">Проверить снова</button>`);
    if (v) { refreshWorld(); fetchWeather(); }
  }
  window.addEventListener('offline', () => setOnline(false));
  window.addEventListener('online', ping);
  setInterval(ping, 10000);

  let watchId = null, gotFix = false;
  const gpsMsg = (title, text) => `<div class="big pulse">📍</div><h2>${title}</h2><p>${text}</p><button class="btn" id="retryGps">Попробовать снова</button>`;
  function startGps() {
    if (!('geolocation' in navigator)) return setBlock('gps', gpsMsg('Нужна геолокация', 'Твой браузер не умеет определять местоположение. Открой игру в Chrome или Safari на телефоне.'));
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (!gotFix) $('status').textContent = 'Поиск геолокации…';
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        if (p.coords.accuracy > 100 && gotFix) return;
        setBlock('gps', null);
        const ll = [p.coords.latitude, p.coords.longitude];
        if (!gotFix) { gotFix = true; follow = true; lastPos = null; setPos(ll, true); return; }
        setPos(ll);
      },
      (err) => {
        if (err.code === 1) setBlock('gps', gpsMsg('Доступ к геолокации запрещён',
          'Игра работает только с настоящим местоположением. Нажми на значок 🔒 рядом с адресом сайта → «Местоположение» → «Разрешить», затем нажми кнопку ниже.'));
        else if (!gotFix) setBlock('gps', gpsMsg('Не получается найти тебя', 'Включи геолокацию (GPS) на телефоне и выйди на открытое место.'));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }

  // ================= START =================
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  ensurePass();
  applySaver();
  renderAvatar();
  ensureQuests();
  renderQuestDot();
  renderPassDot();
  renderBuddyMarker();
  buffTick();
  if (!S.tutorialDone) showTutorial(0);
  else if (!S.trainer.name) trainerSetup(true);
  checkStreak();
  checkMedals();
  startGps();
  ping();
})();

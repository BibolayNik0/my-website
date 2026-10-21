// Ядро мета-игры, общее для всех 100 игр:
// экономика (монеты/кристаллы), улучшения, коллекции с сундуками, ежедневные награды,
// задания, боевой пропуск, магазин (покупки Яндекса), офферы, реклама за награду, сохранения.
(function () {
  'use strict';

  const SDK = window.YSDK;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const now = () => Date.now();
  const DAY = 86400000;
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = (n) => {
    n = Math.floor(n);
    if (n < 10000) return String(n);
    const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
    let i = 0; let v = n;
    while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
    return (v < 100 ? v.toFixed(1) : Math.floor(v)) + u[i];
  };
  const fmtTime = (ms) => {
    ms = Math.max(0, ms); const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ---------------- Локализация ----------------
  const T = {
    ru: {
      play: 'ИГРАТЬ', best: 'Рекорд', score: 'Очки', level: 'Ур.', shop: 'Магазин', collection: 'Коллекция', tasks: 'Задания',
      upgrades: 'Улучшения', menu: 'Меню', close: 'Закрыть', claim: 'Забрать', claimX2: 'x2 за рекламу', watchAd: 'Смотреть рекламу',
      free: 'Бесплатно', daily: 'Ежедневная награда', day: 'День', chestFree: 'Бесплатный сундук', chests: 'Сундуки',
      chestBasic: 'Обычный сундук', chestPremium: 'Королевский сундук', chestAd: 'Сундук за рекламу', open: 'Открыть', open10: 'Открыть 10',
      odds: 'Шансы', common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный', newItem: 'НОВИНКА!',
      duplicate: 'Повтор → ', equip: 'Надеть', equipped: 'Надето', bonus: 'Бонус к доходу', albumDone: 'Альбом собран: +15% дохода',
      gameOver: 'Игра окончена', continue: 'Продолжить?', reviveAd: 'Продолжить за рекламу', reviveGems: 'Продолжить за', giveUp: 'Завершить',
      earned: 'Заработано', newBest: 'НОВЫЙ РЕКОРД!', notEnough: 'Недостаточно', getMore: 'Пополнить', buy: 'Купить',
      gems: 'Кристаллы', coins: 'Монеты', noAds: 'Без рекламы', noAdsDesc: 'Убирает всю рекламу между раундами навсегда. Награды за рекламу остаются — их можно получать по кнопке.',
      vip: 'VIP-статус', vipDesc: 'x2 монеты навсегда, +20 💎 каждый день, бесплатный сундук в 2 раза чаще, VIP-рамка.',
      pass: 'Боевой пропуск', passDesc: 'Открывает премиум-дорожку: кристаллы, королевские сундуки, гарантированные эпики и легендарка на 30 уровне.',
      starter: 'Набор новичка', starterDesc: '300 💎 + 5000 монет + гарантированный эпический предмет. Только один раз!',
      bundle: 'Набор коллекционера', bundleDesc: '10 королевских сундуков + гарантированный легендарный предмет.',
      expiresIn: 'Исчезнет через', bought: 'Куплено', owned: 'Есть', popular: 'ХИТ', value: 'ВЫГОДНО', bestv: 'ЛУЧШЕЕ',
      questRounds: 'Сыграй раундов: {0}', questCoins: 'Заработай монет: {0}', questChest: 'Открой сундуков: {0}', questScore: 'Набери {0} очков за раунд',
      questUpgrade: 'Сделай улучшений: {0}', questAd: 'Посмотри рекламу за награду', questDone: 'Готово', passLevel: 'Уровень пропуска',
      premium: 'Премиум', unlock: 'Открыть', levelUp: 'Новый уровень!', income: 'Доход', incomeDesc: '+15% монет за уровень',
      max: 'МАКС', offline: 'Пока тебя не было', offlineEarn: 'заработано', limitedOffer: 'Ограниченное предложение', later: 'Позже',
      sound: 'Звук', save: 'Сохранить прогресс', saveDesc: 'Войди в Яндекс ID, чтобы прогресс не потерялся.', login: 'Войти',
      collectionBonus: 'Бонус коллекции', progress: 'Собрано', pity: 'Гарантия эпика через', pityL: 'Гарантия легендарки через',
      thanks: 'Спасибо за покупку!', restore: 'Покупки восстановлены', adsLeft: 'Осталось сегодня', paused: 'Пауза', resume: 'Продолжить', toMenu: 'В меню',
      reward: 'Награда', streak: 'Серия'
    },
    en: {
      play: 'PLAY', best: 'Best', score: 'Score', level: 'Lv.', shop: 'Shop', collection: 'Collection', tasks: 'Tasks',
      upgrades: 'Upgrades', menu: 'Menu', close: 'Close', claim: 'Claim', claimX2: 'x2 for ad', watchAd: 'Watch ad',
      free: 'Free', daily: 'Daily reward', day: 'Day', chestFree: 'Free chest', chests: 'Chests',
      chestBasic: 'Basic chest', chestPremium: 'Royal chest', chestAd: 'Ad chest', open: 'Open', open10: 'Open 10',
      odds: 'Odds', common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', newItem: 'NEW!',
      duplicate: 'Duplicate → ', equip: 'Equip', equipped: 'Equipped', bonus: 'Income bonus', albumDone: 'Album complete: +15% income',
      gameOver: 'Game over', continue: 'Continue?', reviveAd: 'Continue for ad', reviveGems: 'Continue for', giveUp: 'Finish',
      earned: 'Earned', newBest: 'NEW BEST!', notEnough: 'Not enough', getMore: 'Get more', buy: 'Buy',
      gems: 'Gems', coins: 'Coins', noAds: 'No ads', noAdsDesc: 'Removes all between-round ads forever. Rewarded ads stay available on demand.',
      vip: 'VIP status', vipDesc: 'x2 coins forever, +20 💎 daily, free chest twice as often, VIP frame.',
      pass: 'Season pass', passDesc: 'Unlocks the premium track: gems, royal chests, guaranteed epics and a legendary at tier 30.',
      starter: 'Starter pack', starterDesc: '300 💎 + 5000 coins + guaranteed epic item. One time only!',
      bundle: 'Collector bundle', bundleDesc: '10 royal chests + guaranteed legendary item.',
      expiresIn: 'Expires in', bought: 'Bought', owned: 'Owned', popular: 'HOT', value: 'VALUE', bestv: 'BEST',
      questRounds: 'Play rounds: {0}', questCoins: 'Earn coins: {0}', questChest: 'Open chests: {0}', questScore: 'Score {0} in one round',
      questUpgrade: 'Buy upgrades: {0}', questAd: 'Watch a rewarded ad', questDone: 'Done', passLevel: 'Pass tier',
      premium: 'Premium', unlock: 'Unlock', levelUp: 'Level up!', income: 'Income', incomeDesc: '+15% coins per level',
      max: 'MAX', offline: 'While you were away', offlineEarn: 'earned', limitedOffer: 'Limited offer', later: 'Later',
      sound: 'Sound', save: 'Save progress', saveDesc: 'Log in with Yandex ID to keep your progress safe.', login: 'Log in',
      collectionBonus: 'Collection bonus', progress: 'Collected', pity: 'Epic guaranteed in', pityL: 'Legendary guaranteed in',
      thanks: 'Thank you for your purchase!', restore: 'Purchases restored', adsLeft: 'Left today', paused: 'Paused', resume: 'Resume', toMenu: 'Menu',
      reward: 'Reward', streak: 'Streak'
    }
  };
  let LANG = 'ru';
  const t = (k, ...a) => {
    let s = (T[LANG] && T[LANG][k]) || T.ru[k] || k;
    a.forEach((v, i) => { s = s.replace('{' + i + '}', v); });
    return s;
  };
  const L = (obj) => (obj && typeof obj === 'object') ? (obj[LANG] || obj.ru) : obj;

  // ---------------- Звук ----------------
  let actx = null;
  const Sound = {
    on: true,
    play(kind) {
      if (!this.on || paused) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        const map = { tap: [520, 0.05, 'triangle'], coin: [880, 0.08, 'square'], win: [660, 0.3, 'triangle'], lose: [160, 0.35, 'sawtooth'],
          chest: [440, 0.25, 'triangle'], buy: [990, 0.2, 'sine'], hit: [220, 0.08, 'square'], up: [740, 0.15, 'sine'] };
        const [f, d, type] = map[kind] || map.tap;
        o.type = type; o.frequency.value = f;
        if (kind === 'win' || kind === 'chest' || kind === 'up') o.frequency.exponentialRampToValueAtTime(f * 2, actx.currentTime + d);
        g.gain.value = 0.06; g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
        o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
      } catch (e) {}
    }
  };

  // ---------------- Состояние ----------------
  const RARITY = ['common', 'rare', 'epic', 'legendary'];
  const RARITY_BONUS = [0.01, 0.02, 0.04, 0.10];
  const DUP_COINS = [100, 300, 1000, 5000];
  const DUP_GEMS = [0, 0, 10, 50];
  const ODDS = {
    basic:   [80, 17, 2.7, 0.3],
    premium: [50, 35, 12, 3]
  };
  const PITY_EPIC = 10;     // каждый 10-й королевский сундук — минимум эпик
  const PITY_LEG = 40;      // каждый 40-й королевский сундук — легендарка
  const PASS_TIERS = 30;
  const PASS_XP = 150;
  const DAILY = [
    { coins: 200 }, { coins: 400 }, { gems: 10 }, { chest: 'basic' }, { coins: 800 }, { gems: 25 }, { chest: 'premium' }
  ];
  const STARTER_WINDOW = 48 * 3600 * 1000;

  let G = null;          // конфиг текущей игры
  let S = null;          // сохранение
  let genre = null;      // модуль жанра
  let inst = null;       // запущенный раунд
  let paused = false;
  let saveTimer = null;
  let items = [];        // предметы коллекции текущей игры
  let interstitialCount = 0;

  function defaultSave() {
    return {
      v: 1, ts: 0, coins: 0, gems: 20, xp: 0, lvl: 1, upg: { income: 0, power: 0 }, owned: {}, equip: null,
      daily: { idx: 0, last: null }, quests: { date: null, list: [] },
      pass: { xp: 0, free: [], prem: [] }, perm: {}, starterShownAt: 0, starterGranted: false,
      chest: { freeAt: 0, adDate: null, adCount: 0, pity: 0, pityL: 0, opened: 0 },
      best: 0, rounds: 0, sound: true, gs: {}, noAdsPromptDate: null, lastSeen: now(), revivesBought: 0
    };
  }

  function save(immediate) {
    S.ts = now(); S.lastSeen = now();
    SDK.saveLocal(G.key, S);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => SDK.saveCloud(G.key, S), immediate ? 0 : 4000);
  }

  // ---------------- Экономика ----------------
  function collectionBonus() {
    let b = 0;
    items.forEach((it) => { if (S.owned[it.id]) b += RARITY_BONUS[it.r]; });
    albums().forEach((a) => { if (a.items.every((it) => S.owned[it.id])) b += 0.15; });
    return b;
  }
  function coinMult() {
    return (1 + 0.15 * S.upg.income) * (1 + collectionBonus()) * (S.perm.vip ? 2 : 1);
  }
  function addCoins(n, raw) {
    const v = Math.max(0, Math.round(raw ? n : n * coinMult()));
    S.coins += v; questProgress('coins', v); renderTop(); return v;
  }
  function addGems(n) { S.gems += n; renderTop(); }
  function spendCoins(n) { if (S.coins < n) return false; S.coins -= n; renderTop(); save(); return true; }
  function spendGems(n) {
    if (S.gems < n) { offerGems(n); return false; }
    S.gems -= n; renderTop(); save(); return true;
  }
  function xpNeed(l) { return Math.floor(80 * Math.pow(l, 1.35)); }
  function addXp(n) {
    S.xp += n;
    S.pass.xp += n;
    let leveled = false;
    while (S.xp >= xpNeed(S.lvl)) {
      S.xp -= xpNeed(S.lvl); S.lvl++; leveled = true;
      S.gems += 5; S.coins += 200 * S.lvl;
    }
    if (leveled) { Sound.play('up'); toast('⭐ ' + t('levelUp') + ' ' + t('level') + ' ' + S.lvl + '  +5 💎'); }
    renderTop();
  }
  function upgCost(key) {
    const base = key === 'income' ? 150 : 250;
    return Math.floor(base * Math.pow(1.55, S.upg[key]));
  }
  const UPG_MAX = { income: 25, power: 10 };

  // ---------------- Коллекции ----------------
  function buildItems() {
    const set = window.YG_SETS[G.set];
    items = set.items.map((s, i) => {
      const [e, ru, en] = s.split('|');
      const r = i < 8 ? 0 : i < 12 ? 1 : i < 15 ? 2 : 3;
      const album = (i < 4 || i === 8 || i === 9 || i === 12 || i === 13) ? 0 : 1;
      return { id: G.set + '_' + i, e, name: { ru, en }, r, album };
    });
  }
  function albums() {
    const set = window.YG_SETS[G.set];
    return set.albums.map((a, i) => {
      const [ru, en] = a.split('|');
      return { name: { ru, en }, items: items.filter((it) => it.album === i) };
    });
  }
  function rollRarity(odds) {
    const total = odds.reduce((a, b) => a + b, 0);
    let x = Math.random() * total;
    for (let i = 0; i < odds.length; i++) { if ((x -= odds[i]) < 0) return i; }
    return 0;
  }
  function rollItem(kind, minRarity) {
    let r = rollRarity(ODDS[kind]);
    if (kind === 'premium') {
      S.chest.pity++; S.chest.pityL++;
      if (S.chest.pityL >= PITY_LEG) r = 3;
      else if (S.chest.pity >= PITY_EPIC && r < 2) r = 2;
      if (r >= 2) S.chest.pity = 0;
      if (r === 3) S.chest.pityL = 0;
    }
    if (minRarity != null && r < minRarity) r = minRarity;
    // Предпочитаем ещё не собранные предметы нужной редкости (честный «умный» дроп).
    const pool = items.filter((it) => it.r === r);
    const fresh = pool.filter((it) => !S.owned[it.id]);
    const src = fresh.length && Math.random() < 0.6 ? fresh : pool;
    return src[Math.floor(Math.random() * src.length)];
  }
  function grantItem(it) {
    const isNew = !S.owned[it.id];
    S.owned[it.id] = (S.owned[it.id] || 0) + 1;
    let dupCoins = 0, dupGems = 0;
    if (!isNew) {
      dupCoins = DUP_COINS[it.r] * Math.max(1, Math.floor(S.lvl / 3));
      dupGems = DUP_GEMS[it.r];
      S.coins += dupCoins; S.gems += dupGems;
    }
    return { it, isNew, dupCoins, dupGems };
  }
  function openChests(kind, count, minRarity) {
    const res = [];
    for (let i = 0; i < count; i++) {
      const forced = (minRarity != null && i === 0) ? minRarity : null;
      res.push(grantItem(rollItem(kind, forced)));
    }
    S.chest.opened += count;
    questProgress('chest', count);
    save();
    showChestResults(res);
    renderTop();
  }
  function basicChestCost() { return Math.floor(600 * (1 + (S.lvl - 1) * 0.25)); }
  function freeChestInterval() { return (S.perm.vip ? 2 : 4) * 3600 * 1000; }
  function adChestsLeft() { if (S.chest.adDate !== today()) { S.chest.adDate = today(); S.chest.adCount = 0; } return 5 - S.chest.adCount; }

  // ---------------- Ежедневные награды ----------------
  function dailyAvailable() { return S.daily.last !== today(); }
  function dailyIndex() {
    if (!S.daily.last) return 0;
    const diff = Math.round((new Date(today()) - new Date(S.daily.last)) / DAY);
    if (diff > 1) return 0; // серия прервалась
    return S.daily.idx % 7;
  }
  function grantReward(r, mult) {
    mult = mult || 1;
    if (r.coins) { S.coins += Math.floor(r.coins * mult * Math.max(1, S.lvl / 2)); }
    if (r.gems) S.gems += r.gems * mult;
    if (r.chest) openChests(r.chest, mult, r.min);
    if (r.item != null) openChests('premium', 1, r.item);
    renderTop(); save();
  }
  function rewardLabel(r) {
    if (r.coins) return '🪙 ' + fmt(r.coins * Math.max(1, S.lvl / 2));
    if (r.gems) return '💎 ' + r.gems;
    if (r.item === 3) return '🌟 ' + t('legendary');
    if (r.item === 2) return '🟣 ' + t('epic');
    if (r.chest === 'premium') return '👑 ' + t('chestPremium');
    if (r.chest) return '📦 ' + t('chestBasic');
    return '';
  }

  // ---------------- Задания ----------------
  function genQuests() {
    if (S.quests.date === today()) return;
    const scoreGoal = Math.max(10, Math.floor((S.best || G.quest || 50) * 0.6));
    const pool = [
      { k: 'rounds', n: 3 + Math.floor(Math.random() * 3) },
      { k: 'coins', n: Math.floor(1000 * Math.max(1, S.lvl / 2)) },
      { k: 'chest', n: 2 },
      { k: 'score', n: scoreGoal },
      { k: 'upgrade', n: 2 },
      { k: 'ad', n: 1 }
    ];
    pool.sort(() => Math.random() - 0.5);
    S.quests = { date: today(), list: pool.slice(0, 3).map((q) => ({ ...q, p: 0, done: false, claimed: false, gems: 15 + Math.floor(Math.random() * 3) * 5 })) };
    save();
  }
  function questProgress(k, v) {
    if (!S || !S.quests.list) return;
    S.quests.list.forEach((q) => {
      if (q.k !== k || q.done) return;
      if (k === 'score') q.p = Math.max(q.p, v); else q.p += v;
      if (q.p >= q.n) { q.done = true; toast('📋 ' + t('questDone') + '!'); }
    });
    renderBadges();
  }
  function questText(q) {
    const map = { rounds: 'questRounds', coins: 'questCoins', chest: 'questChest', score: 'questScore', upgrade: 'questUpgrade', ad: 'questAd' };
    return t(map[q.k], fmt(q.n));
  }

  // ---------------- Боевой пропуск ----------------
  function passTier() { return Math.min(PASS_TIERS, Math.floor(S.pass.xp / PASS_XP)); }
  function passReward(tier, prem) {
    if (!prem) {
      if (tier % 5 === 0) return { chest: 'basic' };
      return tier % 2 ? { coins: 300 + tier * 40 } : { gems: 5 };
    }
    if (tier === 30) return { item: 3 };
    if (tier === 10 || tier === 20) return { item: 2 };
    if (tier % 5 === 0) return { chest: 'premium' };
    return tier % 2 ? { gems: 20 } : { coins: 1000 + tier * 150 };
  }

  // ---------------- Покупки ----------------
  async function restorePurchases() {
    const list = await SDK.getPurchases();
    let restored = false;
    for (const p of list) {
      const def = SDK.PRODUCTS[p.productID];
      if (!def) continue;
      if (def.type === 'permanent') {
        if (!S.perm[p.productID]) { S.perm[p.productID] = true; restored = true; }
        if (p.productID === 'starter_pack' && !S.starterGranted) grantProduct('starter_pack');
      } else {
        // Необработанный расходник (например, вкладку закрыли во время оплаты) — выдаём и списываем.
        grantProduct(p.productID);
        await SDK.consume(p.purchaseToken);
        restored = true;
      }
    }
    if (restored) { save(true); toast('✅ ' + t('restore')); }
  }
  function grantProduct(id) {
    const def = SDK.PRODUCTS[id];
    if (def.gems) addGems(def.gems);
    if (id === 'chest_bundle') openChests('premium', 10, 3);
    if (id === 'starter_pack' && !S.starterGranted) {
      S.starterGranted = true; S.gems += 300; S.coins += 5000; openChests('premium', 1, 2);
    }
    if (def.type === 'permanent') S.perm[id] = true;
    if (id === 'no_ads') document.body.classList.add('noads');
    renderTop(); save(true);
  }
  async function buy(id) {
    const def = SDK.PRODUCTS[id];
    if (def.type === 'permanent' && S.perm[id]) return;
    const res = await SDK.purchase(id);
    if (!res.ok) return;
    grantProduct(id);
    if (def.type === 'consumable') await SDK.consume(res.token);
    Sound.play('buy');
    toast('💖 ' + t('thanks'));
    if (current === 'shop') renderShop();
  }

  // ---------------- UI ----------------
  let current = 'menu';
  let root, topEl, viewEl, navEl, gameEl, hudEl, modalEl, toastEl;

  function priceBtn(id) {
    const icon = SDK.currencyIcon(id);
    return `<button class="btn buy" data-buy="${id}">${icon ? `<img class="cur" src="${icon}" alt="">` : ''}${SDK.priceLabel(id)}</button>`;
  }

  function renderTop() {
    if (!topEl || !S) return;
    const need = xpNeed(S.lvl);
    topEl.innerHTML = `
      <div class="lvl ${S.perm.vip ? 'vip' : ''}" data-go="tasks"><b>${S.lvl}</b><i style="width:${Math.min(100, S.xp / need * 100)}%"></i></div>
      <div class="cur-pill" data-go="upgrades">🪙 <b>${fmt(S.coins)}</b></div>
      <div class="cur-pill gem" data-go="shop">💎 <b>${fmt(S.gems)}</b><span class="plus">+</span></div>
      <button class="icon-btn" data-act="sound">${S.sound ? '🔊' : '🔇'}</button>`;
  }
  function renderBadges() {
    if (!navEl || !S) return;
    const qReady = S.quests.list.some((q) => q.done && !q.claimed);
    const passReady = Array.from({ length: passTier() }, (_, i) => i + 1).some((tr) => !S.pass.free.includes(tr) || (S.perm.season_pass && !S.pass.prem.includes(tr)));
    const chestReady = S.chest.freeAt <= now();
    navEl.querySelector('[data-go=tasks]').classList.toggle('badge', qReady || passReady || dailyAvailable());
    navEl.querySelector('[data-go=collection]').classList.toggle('badge', chestReady);
    const upgReady = ['income', 'power'].some((k) => S.upg[k] < UPG_MAX[k] && S.coins >= upgCost(k));
    navEl.querySelector('[data-go=upgrades]').classList.toggle('badge', upgReady);
  }

  function go(screen) {
    current = screen;
    navEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.go === screen));
    ({ menu: renderMenu, shop: renderShop, collection: renderCollection, tasks: renderTasks, upgrades: renderUpgrades })[screen]();
    renderBadges();
  }

  function renderMenu() {
    const hero = S.equip ? items.find((i) => i.id === S.equip).e : G.sp.hero;
    const starterLeft = S.starterShownAt ? S.starterShownAt + STARTER_WINDOW - now() : 0;
    const showStarter = !S.perm.starter_pack && S.starterShownAt && starterLeft > 0;
    viewEl.innerHTML = `
      <div class="menu">
        <h1 class="title">${L(G.title)}</h1>
        <div class="hero-big">${hero}</div>
        <p class="desc">${L(G.desc)}</p>
        <div class="best">🏆 ${t('best')}: <b>${fmt(S.best)}</b></div>
        <button class="btn play" data-act="play">▶ ${t('play')}</button>
        <div class="chips">
          ${dailyAvailable() ? `<button class="chip pulse" data-act="daily">🎁 ${t('daily')}</button>` : ''}
          <button class="chip ${S.chest.freeAt <= now() ? 'pulse' : ''}" data-act="freechest">📦 ${S.chest.freeAt <= now() ? t('chestFree') : fmtTime(S.chest.freeAt - now())}</button>
          <button class="chip" data-go="tasks">🎖️ ${t('passLevel')} ${passTier()}</button>
        </div>
        ${showStarter ? `<div class="offer-banner" data-act="starter"><span>🔥 ${t('starter')}</span><small>${t('expiresIn')} <b class="countdown" data-until="${S.starterShownAt + STARTER_WINDOW}">${fmtTime(starterLeft)}</b></small></div>` : ''}
        ${!SDK.local && !SDK.isAuthorized() ? `<button class="chip ghost" data-act="auth">☁️ ${t('save')}</button>` : ''}
      </div>`;
  }

  function renderUpgrades() {
    const pow = genre.power || { ru: 'Сила', en: 'Power' };
    const powDesc = genre.powerDesc || { ru: 'Улучшает игровые способности', en: 'Improves abilities' };
    const row = (k, icon, name, desc) => {
      const lv = S.upg[k], max = lv >= UPG_MAX[k], cost = upgCost(k);
      return `<div class="card row">
        <div class="ic">${icon}</div>
        <div class="grow"><b>${name}</b> <span class="muted">${t('level')} ${lv}/${UPG_MAX[k]}</span><div class="muted small">${desc}</div>
        <div class="bar"><i style="width:${lv / UPG_MAX[k] * 100}%"></i></div></div>
        ${max ? `<span class="tag">${t('max')}</span>` : `<button class="btn ${S.coins >= cost ? '' : 'disabled'}" data-upg="${k}">🪙 ${fmt(cost)}</button>`}
      </div>`;
    };
    viewEl.innerHTML = `<h2>${t('upgrades')}</h2>
      ${row('income', '💰', t('income'), t('incomeDesc'))}
      ${row('power', G.sp.power || '⚡', L(pow), L(powDesc))}
      <div class="card"><b>x${coinMult().toFixed(2)}</b> — ${t('income')}: ${t('upgrades').toLowerCase()} × ${t('collectionBonus').toLowerCase()} (+${Math.round(collectionBonus() * 100)}%)${S.perm.vip ? ' × VIP 2' : ''}</div>
      ${!S.perm.vip ? `<div class="card row promo"><div class="ic">👑</div><div class="grow"><b>${t('vip')}</b><div class="small">${t('vipDesc')}</div></div>${priceBtn('vip')}</div>` : ''}`;
  }

  function renderShop() {
    const starterLeft = S.starterShownAt ? S.starterShownAt + STARTER_WINDOW - now() : -1;
    const gemsCard = (id) => {
      const d = SDK.PRODUCTS[id];
      const tag = d.tag ? `<span class="ribbon">${t(d.tag === 'best' ? 'bestv' : d.tag)}</span>` : '';
      return `<div class="card gem-card">${tag}<div class="gem-ic">${d.gems >= 2000 ? '💰' : d.gems >= 700 ? '💎💎' : '💎'}</div><b>${d.gems} 💎</b>${priceBtn(id)}</div>`;
    };
    viewEl.innerHTML = `<h2>${t('shop')}</h2>
      ${!S.perm.starter_pack && starterLeft > 0 ? `<div class="card row promo hot"><div class="ic">🔥</div><div class="grow"><b>${t('starter')}</b><div class="small">${t('starterDesc')}</div><div class="small">${t('expiresIn')} <b class="countdown" data-until="${S.starterShownAt + STARTER_WINDOW}">${fmtTime(starterLeft)}</b></div></div>${priceBtn('starter_pack')}</div>` : ''}
      <div class="grid4">${['gems_small', 'gems_medium', 'gems_large', 'gems_huge'].map(gemsCard).join('')}</div>
      <div class="card row"><div class="ic">🎁</div><div class="grow"><b>${t('bundle')}</b><div class="small">${t('bundleDesc')}</div></div>${priceBtn('chest_bundle')}</div>
      <div class="card row"><div class="ic">👑</div><div class="grow"><b>${t('vip')}</b><div class="small">${t('vipDesc')}</div></div>${S.perm.vip ? `<span class="tag">${t('owned')}</span>` : priceBtn('vip')}</div>
      <div class="card row"><div class="ic">🎖️</div><div class="grow"><b>${t('pass')}</b><div class="small">${t('passDesc')}</div></div>${S.perm.season_pass ? `<span class="tag">${t('owned')}</span>` : priceBtn('season_pass')}</div>
      <div class="card row"><div class="ic">🚫</div><div class="grow"><b>${t('noAds')}</b><div class="small">${t('noAdsDesc')}</div></div>${S.perm.no_ads ? `<span class="tag">${t('owned')}</span>` : priceBtn('no_ads')}</div>
      <h3>${t('coins')}</h3>
      <div class="grid3">
        ${[[20, 1], [90, 5], [400, 25]].map(([g, m]) => `<div class="card gem-card"><div class="gem-ic">🪙</div><b>${fmt(coinPack(m))}</b><button class="btn" data-coinpack="${g}|${m}">💎 ${g}</button></div>`).join('')}
      </div>`;
  }
  function coinPack(m) { return Math.floor(1500 * m * Math.max(1, S.lvl / 2) * (1 + S.upg.income * 0.15)); }

  function renderCollection() {
    const left = S.chest.freeAt - now();
    const adsLeft = adChestsLeft();
    const total = items.length, got = items.filter((i) => S.owned[i.id]).length;
    viewEl.innerHTML = `<h2>${t('collection')} <span class="muted">${got}/${total}</span></h2>
      <div class="card">${t('collectionBonus')}: <b>+${Math.round(collectionBonus() * 100)}%</b> ${t('income').toLowerCase()}</div>
      <div class="chest-row">
        <div class="card chest"><div class="chest-ic">📦</div><b>${t('chestFree')}</b>
          ${left <= 0 ? `<button class="btn pulse" data-act="freechest">${t('open')}</button>` : `<button class="btn disabled countdown" data-until="${S.chest.freeAt}">${fmtTime(left)}</button>`}</div>
        <div class="card chest"><div class="chest-ic">📺</div><b>${t('chestAd')}</b><div class="small muted">${t('adsLeft')}: ${adsLeft}</div>
          <button class="btn ${adsLeft > 0 ? 'ad' : 'disabled'}" data-act="adchest">▶ ${t('watchAd')}</button></div>
        <div class="card chest"><div class="chest-ic">🧰</div><b>${t('chestBasic')}</b><button class="btn" data-act="coinchest">🪙 ${fmt(basicChestCost())}</button></div>
        <div class="card chest royal"><div class="chest-ic">👑</div><b>${t('chestPremium')}</b>
          <button class="btn" data-act="gemchest">💎 60</button><button class="btn" data-act="gemchest10">${t('open10')} 💎 540</button>
          <div class="small muted">${t('pity')} ${PITY_EPIC - S.chest.pity} · ${t('pityL')} ${PITY_LEG - S.chest.pityL}</div></div>
      </div>
      <button class="link" data-act="odds">ℹ️ ${t('odds')}</button>
      ${albums().map((a) => {
        const done = a.items.every((it) => S.owned[it.id]);
        return `<h3>${L(a.name)} <span class="muted">${a.items.filter((it) => S.owned[it.id]).length}/${a.items.length}</span> ${done ? '✅' : ''}</h3>
        <div class="album">${a.items.map((it) => `
          <div class="item r${it.r} ${S.owned[it.id] ? '' : 'locked'} ${S.equip === it.id ? 'eq' : ''}" data-item="${it.id}">
            <div class="e">${S.owned[it.id] ? it.e : '❔'}</div>
            <div class="n">${S.owned[it.id] ? L(it.name) : t(RARITY[it.r])}</div>
            ${S.owned[it.id] > 1 ? `<span class="cnt">x${S.owned[it.id]}</span>` : ''}
          </div>`).join('')}</div>
        <div class="small muted">${t('albumDone')}</div>`;
      }).join('')}`;
  }

  function renderTasks() {
    genQuests();
    const di = dailyIndex();
    const tier = passTier();
    const tierXp = S.pass.xp - tier * PASS_XP;
    let passHtml = '';
    for (let tr = 1; tr <= PASS_TIERS; tr++) {
      const fr = passReward(tr, false), pr = passReward(tr, true);
      const reached = tr <= tier;
      const fc = S.pass.free.includes(tr), pc = S.pass.prem.includes(tr);
      passHtml += `<div class="tier ${reached ? 'reached' : ''}">
        <div class="tn">${tr}</div>
        <button class="pr free ${fc ? 'claimed' : reached ? 'ready' : ''}" data-pass="f${tr}">${fc ? '✔' : rewardLabel(fr)}</button>
        <button class="pr prem ${pc ? 'claimed' : reached && S.perm.season_pass ? 'ready' : ''} ${S.perm.season_pass ? '' : 'lockp'}" data-pass="p${tr}">${pc ? '✔' : (S.perm.season_pass ? '' : '🔒 ') + rewardLabel(pr)}</button>
      </div>`;
    }
    viewEl.innerHTML = `<h2>${t('tasks')}</h2>
      <h3>🎁 ${t('daily')} <span class="muted">${t('streak')}: ${dailyAvailable() ? di : ((S.daily.idx - 1) % 7) + 1}</span></h3>
      <div class="daily">${DAILY.map((r, i) => {
        const claimed = dailyAvailable() ? i < di : i <= (S.daily.idx - 1) % 7;
        const ready = dailyAvailable() && i === di;
        return `<div class="dcell ${claimed ? 'claimed' : ''} ${ready ? 'ready' : ''}" ${ready ? 'data-act="daily"' : ''}><small>${t('day')} ${i + 1}</small><div>${rewardLabel(r)}</div></div>`;
      }).join('')}</div>
      <h3>📋 ${t('tasks')}</h3>
      ${S.quests.list.map((q, i) => `<div class="card row"><div class="grow">${questText(q)}<div class="bar"><i style="width:${Math.min(100, q.p / q.n * 100)}%"></i></div></div>
        ${q.claimed ? '<span class="tag">✔</span>' : q.k === 'ad' && !q.done ? `<button class="btn ad" data-act="questad">▶</button>` : `<button class="btn ${q.done ? 'pulse' : 'disabled'}" data-quest="${i}">💎 ${q.gems}</button>`}</div>`).join('')}
      <h3>🎖️ ${t('pass')} — ${t('passLevel')} ${tier}/${PASS_TIERS}</h3>
      <div class="bar big"><i style="width:${tier >= PASS_TIERS ? 100 : tierXp / PASS_XP * 100}%"></i></div>
      ${S.perm.season_pass ? '' : `<div class="card row promo"><div class="ic">🎖️</div><div class="grow"><b>${t('premium')}</b><div class="small">${t('passDesc')}</div></div>${priceBtn('season_pass')}</div>`}
      <div class="pass"><div class="tier head"><div class="tn">#</div><div class="pr">${t('free')}</div><div class="pr">${t('premium')} 👑</div></div>${passHtml}</div>`;
  }

  // ---------------- Модальные окна ----------------
  let modalDone = null;
  function modal(html, opts) {
    opts = opts || {};
    if (modalDone) modalDone('replaced');
    return new Promise((resolve) => {
      modalEl.innerHTML = `<div class="modal ${opts.cls || ''}">${opts.noClose ? '' : '<button class="x" data-m="close">✕</button>'}${html}</div>`;
      modalEl.classList.add('show');
      const finish = (v) => {
        modalEl.removeEventListener('click', handler);
        if (modalDone === finish) modalDone = null;
        resolve(v);
      };
      const handler = (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        const v = b.dataset.m;
        // Кнопки покупок внутри модалок обрабатывает общий делегат, окно не закрываем.
        if (v === 'keep') return;
        e.stopPropagation();
        modalEl.classList.remove('show');
        finish(v);
      };
      modalDone = finish;
      modalEl.addEventListener('click', handler);
    });
  }
  function closeModal() { modalEl.classList.remove('show'); }

  function toast(msg) {
    const d = el('div', 'toast', msg);
    toastEl.appendChild(d);
    setTimeout(() => d.classList.add('out'), 1800);
    setTimeout(() => d.remove(), 2300);
  }

  function showChestResults(res) {
    Sound.play('chest');
    const html = `<h2>📦 ${t('reward')}</h2><div class="chest-res">${res.map((r) => `
      <div class="item r${r.it.r} pop"><div class="e">${r.it.e}</div><div class="n">${L(r.it.name)}</div>
      <div class="small">${r.isNew ? `<b class="new">${t('newItem')}</b>` : t('duplicate') + '🪙' + fmt(r.dupCoins) + (r.dupGems ? ' 💎' + r.dupGems : '')}</div></div>`).join('')}</div>
      <button class="btn" data-m="ok">${t('claim')}</button>`;
    setTimeout(() => modal(html).then(() => { if (current === 'collection') renderCollection(); }), 0);
  }

  function showOdds() {
    const row = (k) => ODDS[k].map((o, i) => `<span class="r${i}">${t(RARITY[i])}: ${o}%</span>`).join('<br>');
    modal(`<h2>${t('odds')}</h2><div class="card"><b>${t('chestBasic')}</b><br>${row('basic')}</div>
      <div class="card"><b>${t('chestPremium')}</b><br>${row('premium')}<br><small>${t('pity')} ${PITY_EPIC} · ${t('pityL')} ${PITY_LEG}</small></div>
      <button class="btn" data-m="ok">OK</button>`);
  }

  function offerGems(need) {
    Sound.play('lose');
    modal(`<h2>${t('notEnough')} 💎</h2><p>${need} 💎</p>
      <div class="grid4">${['gems_small', 'gems_medium', 'gems_large', 'gems_huge'].map((id) => `<div class="card gem-card"><b>${SDK.PRODUCTS[id].gems} 💎</b>${priceBtn(id).replace('class="btn buy"', 'data-m="keep" class="btn buy"')}</div>`).join('')}</div>
      <button class="btn ghost" data-m="close">${t('close')}</button>`);
  }

  function offerStarter(force) {
    if (S.perm.starter_pack) return;
    if (!S.starterShownAt) { S.starterShownAt = now(); save(); }
    const left = S.starterShownAt + STARTER_WINDOW - now();
    if (left <= 0 && !force) return;
    modal(`<div class="offer"><div class="ribbon big">${t('limitedOffer')}</div><div class="hero-big">🎁</div>
      <h2>${t('starter')}</h2><p>${t('starterDesc')}</p>
      <div class="small">${t('expiresIn')} <b class="countdown" data-until="${S.starterShownAt + STARTER_WINDOW}">${fmtTime(left)}</b></div>
      ${priceBtn('starter_pack').replace('class="btn buy"', 'data-m="keep" class="btn buy big"')}
      <button class="btn ghost" data-m="close">${t('later')}</button></div>`, { cls: 'offer-modal' });
  }

  function offerNoAds() {
    if (S.perm.no_ads || S.noAdsPromptDate === today()) return;
    S.noAdsPromptDate = today(); save();
    modal(`<div class="hero-big">🚫📺</div><h2>${t('noAds')}</h2><p>${t('noAdsDesc')}</p>
      ${priceBtn('no_ads').replace('class="btn buy"', 'data-m="keep" class="btn buy big"')}
      <button class="btn ghost" data-m="close">${t('later')}</button>`);
  }

  async function claimDaily() {
    if (!dailyAvailable()) return;
    const di = dailyIndex();
    const r = DAILY[di];
    const v = await modal(`<h2>🎁 ${t('daily')}</h2><div class="hero-big">${rewardLabel(r).split(' ')[0]}</div><p><b>${t('day')} ${di + 1}: ${rewardLabel(r)}</b></p>
      <button class="btn ad" data-m="x2">▶ ${t('claimX2')}</button><button class="btn" data-m="ok">${t('claim')}</button>`, { noClose: true });
    let mult = 1;
    if (v === 'x2' && await SDK.showRewarded()) { mult = 2; questProgress('ad', 1); }
    S.daily.idx = di + 1; S.daily.last = today();
    grantReward(r, mult);
    Sound.play('coin');
    go(current);
  }

  // ---------------- Раунд ----------------
  let round = null;
  function startRound() {
    if (inst) return;
    closeModal();
    document.body.classList.add('in-game');
    gameEl.innerHTML = '';
    const host = el('div', 'host');
    gameEl.appendChild(host);
    const myRound = round = { coins: 0, score: 0, revives: 0, ended: false };
    hudEl.innerHTML = '';
    const api = {
      t, L, lang: LANG, game: G, sp: G.sp, p: G.p || {}, pal: G.pal,
      hero: () => (S.equip ? items.find((i) => i.id === S.equip).e : G.sp.hero),
      power: () => S.upg.power,
      state: S.gs, save: () => save(),
      // Асинхронные анимации жанра могут доиграть после выхода из раунда — такие вызовы игнорируем.
      coins: (n, silent) => { if (round !== myRound) return 0; const v = addCoins(n); round.coins += v; if (!silent) Sound.play('coin'); updateHud(); return v; },
      spend: (n) => { if (!spendCoins(n)) { toast(t('notEnough') + ' 🪙'); return false; } updateHud(); return true; },
      balance: () => S.coins,
      rewarded: async () => { const ok = await SDK.showRewarded(); if (ok) questProgress('ad', 1); return ok; },
      toast,
      coinMult,
      score: (n) => { if (round !== myRound) return; round.score = n; updateHud(); },
      sfx: (k) => Sound.play(k),
      hud: (txt) => { if (round !== myRound) return; round.extra = txt; updateHud(); },
      end: (o) => (round === myRound ? endRound(o || {}) : Promise.resolve('done')),
      fmt
    };
    updateHud();
    inst = genre.start(host, api);
    SDK.gameplayStart();
  }
  function updateHud() {
    if (!round) return;
    hudEl.innerHTML = `<button class="icon-btn" data-act="pause">⏸</button>
      ${genre.idle ? '' : `<div class="hud-score">${fmt(round.score)}</div>`}
      <div class="cur-pill">🪙 <b>${fmt(genre.idle ? S.coins : round.coins)}</b></div>
      ${round.extra ? `<div class="hud-extra">${round.extra}</div>` : ''}`;
  }

  async function endRound(o) {
    if (!round || round.ended) return 'done';
    round.ended = true;
    SDK.gameplayStop();
    Sound.play('lose');
    const canRevive = o.canRevive !== false && round.revives < 2 && !genre.idle;
    if (canRevive) {
      const gemCost = 10 * (round.revives + 1);
      const v = await modal(`<h2>${t('continue')}</h2><div class="hero-big">💖</div><p>${t('score')}: <b>${fmt(round.score)}</b> · ${t('best')}: ${fmt(S.best)}</p>
        ${round.revives === 0 ? `<button class="btn ad" data-m="ad">▶ ${t('reviveAd')}</button>` : ''}
        <button class="btn" data-m="gems">${t('reviveGems')} 💎 ${gemCost}</button>
        <button class="btn ghost" data-m="no">${t('giveUp')}</button>`, { noClose: true });
      let ok = false;
      if (v === 'ad') { ok = await SDK.showRewarded(); if (ok) questProgress('ad', 1); }
      if (v === 'gems') ok = spendGems(gemCost);
      if (ok) { round.revives++; round.ended = false; SDK.gameplayStart(); return 'revive'; }
    }
    finishRound();
    return 'done';
  }

  async function finishRound() {
    const score = Math.floor(round.score);
    const isBest = score > S.best;
    if (isBest) { S.best = score; SDK.submitScore(G.board || 'score', score); }
    S.rounds++;
    questProgress('rounds', 1);
    questProgress('score', score);
    addXp(10 + Math.min(60, Math.floor(Math.sqrt(score) * 2)));
    save();
    const earned = round.coins;
    if (inst) { inst.destroy(); inst = null; }
    const v = await modal(`<h2>${isBest ? '🏆 ' + t('newBest') : t('gameOver')}</h2>
      <p>${t('score')}: <b class="big">${fmt(score)}</b></p><p>${t('best')}: ${fmt(S.best)}</p>
      <p>${t('earned')}: 🪙 <b>${fmt(earned)}</b></p>
      ${earned > 0 ? `<button class="btn ad" data-m="x2">▶ ${t('claimX2')} (+🪙${fmt(earned)})</button>` : ''}
      <button class="btn" data-m="again">↻ ${t('play')}</button>
      <button class="btn ghost" data-m="menu">${t('toMenu')}</button>`, { noClose: true });
    if (v === 'x2' && await SDK.showRewarded()) { addCoins(earned, true); questProgress('ad', 1); toast('🪙 +' + fmt(earned)); save(); }
    leaveGame();
    // Межстраничная реклама только в паузе между раундами и не после первого раунда.
    if (!S.perm.no_ads && S.rounds > 1 && v !== 'x2') {
      const shown = await SDK.showInterstitial();
      if (shown) { interstitialCount++; if (interstitialCount === 3) offerNoAds(); }
    }
    if (S.rounds === 3 && !S.perm.starter_pack && !S.starterShownAt) offerStarter();
    if (v === 'again') startRound();
  }

  function leaveGame() {
    if (genre.idle && round && round.score > S.best) { S.best = Math.floor(round.score); SDK.submitScore(G.board || 'score', S.best); save(); }
    if (inst) { inst.destroy(); inst = null; }
    SDK.gameplayStop();
    round = null;
    document.body.classList.remove('in-game');
    gameEl.innerHTML = ''; hudEl.innerHTML = '';
    go(current === 'menu' ? 'menu' : current);
  }

  async function pauseMenu() {
    if (!inst) return;
    inst.pause && inst.pause();
    SDK.gameplayStop();
    const v = await modal(`<h2>${t('paused')}</h2><button class="btn" data-m="resume">▶ ${t('resume')}</button><button class="btn ghost" data-m="menu">${t('toMenu')}</button>`, { noClose: true });
    if (v === 'menu') {
      if (genre.idle) { leaveGame(); return; }
      if (inst) { inst.destroy(); inst = null; }
      round.ended = true;
      finishRound();
      return;
    }
    SDK.gameplayStart();
    inst && inst.resume && inst.resume();
  }

  // ---------------- Обработчики ----------------
  async function onClick(e) {
    const b = e.target.closest('[data-go],[data-act],[data-buy],[data-upg],[data-item],[data-quest],[data-pass],[data-coinpack]');
    if (!b) return;
    Sound.play('tap');
    if (b.dataset.buy) return buy(b.dataset.buy);
    if (b.dataset.go) return go(b.dataset.go);
    if (b.dataset.upg) {
      const k = b.dataset.upg, c = upgCost(k);
      if (S.upg[k] >= UPG_MAX[k]) return;
      if (!spendCoins(c)) { toast(t('notEnough') + ' 🪙'); return; }
      S.upg[k]++; questProgress('upgrade', 1); Sound.play('up'); save(); return renderUpgrades();
    }
    if (b.dataset.item) {
      const it = items.find((i) => i.id === b.dataset.item);
      if (!S.owned[it.id]) return;
      const v = await modal(`<div class="item r${it.r} solo"><div class="e">${it.e}</div></div><h2>${L(it.name)}</h2><p class="r${it.r}">${t(RARITY[it.r])}</p>
        <p>${t('bonus')}: +${Math.round(RARITY_BONUS[it.r] * 100)}%</p>
        ${S.equip === it.id ? `<span class="tag">${t('equipped')}</span>` : `<button class="btn" data-m="equip">${t('equip')}</button>`}`);
      if (v === 'equip') { S.equip = it.id; save(); renderCollection(); }
      return;
    }
    if (b.dataset.quest) {
      const q = S.quests.list[+b.dataset.quest];
      if (!q.done || q.claimed) return;
      q.claimed = true; addGems(q.gems); addXp(40); save(); Sound.play('coin'); return renderTasks();
    }
    if (b.dataset.pass) {
      const prem = b.dataset.pass[0] === 'p', tr = +b.dataset.pass.slice(1);
      if (prem && !S.perm.season_pass) return buy('season_pass');
      const list = prem ? S.pass.prem : S.pass.free;
      if (tr > passTier() || list.includes(tr)) return;
      list.push(tr); grantReward(passReward(tr, prem)); Sound.play('coin'); return renderTasks();
    }
    if (b.dataset.coinpack) {
      const [g, m] = b.dataset.coinpack.split('|').map(Number);
      if (spendGems(g)) { addCoins(coinPack(m), true); save(); toast('🪙 +' + fmt(coinPack(m))); renderShop(); }
      return;
    }
    switch (b.dataset.act) {
      case 'play': return startRound();
      case 'pause': return pauseMenu();
      case 'sound': S.sound = Sound.on = !S.sound; save(); return renderTop();
      case 'daily': return claimDaily();
      case 'starter': return offerStarter();
      case 'odds': return showOdds();
      case 'auth': if (await SDK.auth()) { const cloud = await SDK.loadCloud(G.key); if (cloud && (cloud.ts || 0) > S.ts) { S = Object.assign(defaultSave(), cloud); } save(true); go(current); } return;
      case 'freechest':
        if (S.chest.freeAt > now()) return go('collection');
        S.chest.freeAt = now() + freeChestInterval(); openChests('basic', 1); return go(current);
      case 'adchest':
        if (adChestsLeft() <= 0) return;
        if (await SDK.showRewarded()) { S.chest.adCount++; questProgress('ad', 1); openChests('basic', 1); renderCollection(); }
        return;
      case 'coinchest':
        if (spendCoins(basicChestCost())) { openChests('basic', 1); renderCollection(); } else toast(t('notEnough') + ' 🪙');
        return;
      case 'gemchest': if (spendGems(60)) { openChests('premium', 1); renderCollection(); } return;
      case 'gemchest10': if (spendGems(540)) { openChests('premium', 10); renderCollection(); } return;
      case 'questad':
        if (await SDK.showRewarded()) { questProgress('ad', 1); addCoins(300); save(); renderTasks(); }
        return;
    }
  }

  function tick() {
    document.querySelectorAll('.countdown').forEach((c) => {
      const left = +c.dataset.until - now();
      if (left <= 0) { c.textContent = '✓'; if (!inst && !modalEl.classList.contains('show')) go(current); return; }
      c.textContent = fmtTime(left);
    });
    if (S && S.perm.vip && S.vipDay !== today()) { S.vipDay = today(); addGems(20); toast('👑 VIP +20 💎'); save(); }
    if (navEl) renderBadges();
  }

  function offlineEarnings() {
    if (!genre.offline) return;
    const mins = Math.min(8 * 60, (now() - (S.lastSeen || now())) / 60000);
    if (mins < 2) return;
    const amount = Math.floor(genre.offline(S.gs) * mins * 60 * coinMult() * 0.5);
    if (amount <= 0) return;
    modal(`<h2>💤 ${t('offline')}</h2><div class="hero-big">🪙</div><p>${t('offlineEarn')}: <b>${fmt(amount)}</b></p>
      <button class="btn ad" data-m="x2">▶ ${t('claimX2')}</button><button class="btn" data-m="ok">${t('claim')}</button>`, { noClose: true })
      .then(async (v) => {
        let m = 1;
        if (v === 'x2' && await SDK.showRewarded()) { m = 2; questProgress('ad', 1); }
        addCoins(amount * m, true); save();
      });
  }

  // ---------------- Канвас-утилиты для жанров ----------------
  const spriteCache = new Map();
  function sprite(ch, size) {
    size = Math.round(size);
    const key = ch + '|' + size;
    let c = spriteCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    const pad = Math.ceil(size * 0.25);
    c.width = c.height = size + pad * 2;
    const x = c.getContext('2d');
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    x.fillText(ch, c.width / 2, c.height / 2 + size * 0.06);
    c.pad = pad;
    spriteCache.set(key, c);
    return c;
  }
  function drawSprite(ctx, ch, x, y, size, rot) {
    const s = sprite(ch, size);
    if (rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(s, -s.width / 2, -s.height / 2); ctx.restore();
    } else ctx.drawImage(s, x - s.width / 2, y - s.height / 2);
  }
  function makeCanvas(host) {
    const cv = el('canvas', 'gcv');
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    const o = { cv, ctx, W: 0, H: 0, dpr: 1 };
    o.resize = () => {
      o.dpr = Math.min(2, window.devicePixelRatio || 1);
      o.W = host.clientWidth; o.H = host.clientHeight;
      cv.width = o.W * o.dpr; cv.height = o.H * o.dpr;
      ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    };
    o.resize();
    const onR = () => { o.resize(); o.onResize && o.onResize(); };
    window.addEventListener('resize', onR);
    o.destroy = () => window.removeEventListener('resize', onR);
    o.bg = () => {
      const g = ctx.createLinearGradient(0, 0, 0, o.H);
      g.addColorStop(0, G.pal[0]); g.addColorStop(1, G.pal[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, o.W, o.H);
    };
    o.pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    return o;
  }
  // Игровой цикл с паузой: fn(dt в секундах).
  function loop(fn) {
    let raf = 0, last = 0, stopped = false, isPaused = false;
    const step = (ts) => {
      if (stopped) return;
      raf = requestAnimationFrame(step);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      if (!isPaused && !paused) fn(dt);
    };
    raf = requestAnimationFrame(step);
    return {
      stop() { stopped = true; cancelAnimationFrame(raf); },
      pause() { isPaused = true; },
      resume() { isPaused = false; last = 0; }
    };
  }
  function floatText(list, x, y, txt, color) { list.push({ x, y, txt, color: color || '#ffd54a', life: 1 }); }
  function drawFloats(ctx, list, dt) {
    ctx.textAlign = 'center'; ctx.font = 'bold 18px system-ui,sans-serif';
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]; f.life -= dt; f.y -= 40 * dt;
      if (f.life <= 0) { list.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.color; ctx.fillText(f.txt, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  // ---------------- Загрузка ----------------
  async function boot(cfg) {
    G = cfg;
    G.key = 'yg_' + G.slug;
    genre = YG.genres[G.genre];
    if (!genre) throw new Error('Unknown genre ' + G.genre);
    await SDK.init();
    LANG = SDK.lang === 'ru' || SDK.lang === 'be' || SDK.lang === 'kk' || SDK.lang === 'uk' || SDK.lang === 'uz' ? 'ru' : 'en';
    document.documentElement.lang = LANG;
    document.title = L(G.title);
    document.documentElement.style.setProperty('--bg1', G.pal[0]);
    document.documentElement.style.setProperty('--bg2', G.pal[1]);
    document.documentElement.style.setProperty('--acc', G.pal[2]);

    S = Object.assign(defaultSave(), await SDK.loadCloud(G.key) || {});
    S.gs = S.gs || {};
    Sound.on = S.sound;
    buildItems();

    root = $('#app');
    root.innerHTML = `<div class="top"></div><div class="view"></div><nav class="nav">
      <button data-go="menu">🏠<span>${t('menu')}</span></button>
      <button data-go="upgrades">⬆️<span>${t('upgrades')}</span></button>
      <button data-go="collection">📚<span>${t('collection')}</span></button>
      <button data-go="tasks">📋<span>${t('tasks')}</span></button>
      <button data-go="shop">🛒<span>${t('shop')}</span></button></nav>
      <div class="game"></div><div class="hud"></div><div class="modal-wrap"></div><div class="toasts"></div>`;
    topEl = $('.top', root); viewEl = $('.view', root); navEl = $('.nav', root);
    gameEl = $('.game', root); hudEl = $('.hud', root); modalEl = $('.modal-wrap', root); toastEl = $('.toasts', root);
    root.addEventListener('click', onClick);
    // Запрет контекстного меню и выделения — требование к UX на платформе.
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    SDK.on('pause', () => { paused = true; inst && inst.pause && inst.pause(); });
    SDK.on('resume', () => { paused = false; inst && inst.resume && inst.resume(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { paused = true; inst && inst.pause && inst.pause(); save(true); }
      else if (!SDK.adOpen) { paused = false; inst && inst.resume && inst.resume(); }
    });

    if (S.perm.no_ads) document.body.classList.add('noads');
    genQuests();
    renderTop();
    go('menu');
    await restorePurchases();
    offlineEarnings();
    setInterval(tick, 1000);
    window.addEventListener('beforeunload', () => { S.lastSeen = now(); SDK.saveLocal(G.key, S); });
    SDK.loadingReady();
    $('#loader') && $('#loader').remove();
    // Возвращающийся игрок с активным стартовым оффером видит его один раз за сессию.
    if (!S.perm.starter_pack && S.starterShownAt && S.starterShownAt + STARTER_WINDOW > now() && S.rounds > 3) setTimeout(() => offerStarter(), 1500);
  }

  window.YG = {
    genres: {},
    register(name, impl) { this.genres[name] = impl; },
    boot, sprite, drawSprite, makeCanvas, loop, floatText, drawFloats, fmt,
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (v, a, b) => Math.max(a, Math.min(b, v))
  };
})();

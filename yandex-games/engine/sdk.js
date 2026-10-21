// Обёртка над Yandex Games SDK v2 с локальной заглушкой для разработки.
// Все игры работают только через этот модуль: реклама, покупки, облачные сохранения, лидерборды.
(function () {
  'use strict';

  // Продукты каталога. Одинаковые ID нужно завести в консоли каждой игры (см. MONETIZATION.md).
  // price — запасная цена для отображения, если getCatalog недоступен.
  const PRODUCTS = {
    gems_small:   { type: 'consumable', gems: 80,   price: 29 },
    gems_medium:  { type: 'consumable', gems: 250,  price: 79,  tag: 'popular' },
    gems_large:   { type: 'consumable', gems: 700,  price: 199, tag: 'value' },
    gems_huge:    { type: 'consumable', gems: 2000, price: 499, tag: 'best' },
    chest_bundle: { type: 'consumable', chests: 10, price: 249 },
    starter_pack: { type: 'permanent',  price: 49 },
    no_ads:       { type: 'permanent',  price: 99 },
    vip:          { type: 'permanent',  price: 199 },
    season_pass:  { type: 'permanent',  price: 149 }
  };

  const AD_INTERVAL_MS = 65000; // платформа сама режет частые вызовы, держим запас

  const SDK = {
    PRODUCTS,
    ready: false,
    local: true,
    ysdk: null,
    player: null,
    payments: null,
    catalog: {},
    lang: (navigator.language || 'ru').slice(0, 2),
    lastAd: Date.now(), // первый межстраничный показ не раньше чем через минуту после старта
    adOpen: false,
    listeners: { pause: [], resume: [] },

    async init() {
      if (typeof window.YaGames === 'undefined') {
        this.ready = true;
        return this;
      }
      try {
        this.ysdk = await window.YaGames.init();
        this.local = false;
        const env = this.ysdk.environment;
        if (env && env.i18n && env.i18n.lang) this.lang = env.i18n.lang;
        if (this.ysdk.on) {
          this.ysdk.on('game_api_pause', () => this.emit('pause'));
          this.ysdk.on('game_api_resume', () => this.emit('resume'));
        }
        try { this.player = await this.ysdk.getPlayer({ scopes: false }); } catch (e) { this.player = null; }
        try { this.payments = await this.ysdk.getPayments({ signed: false }); } catch (e) { this.payments = null; }
        if (this.payments) {
          try {
            const list = await this.payments.getCatalog();
            for (const p of list) this.catalog[p.id] = p;
          } catch (e) { /* каталог не настроен — используем запасные цены */ }
        }
      } catch (e) {
        this.ysdk = null;
        this.local = true;
      }
      this.ready = true;
      return this;
    },

    on(ev, fn) { this.listeners[ev].push(fn); },
    emit(ev) { for (const fn of this.listeners[ev]) fn(); },

    loadingReady() {
      try { this.ysdk && this.ysdk.features.LoadingAPI.ready(); } catch (e) {}
    },
    gameplayStart() {
      try { this.ysdk && this.ysdk.features.GameplayAPI.start(); } catch (e) {}
    },
    gameplayStop() {
      try { this.ysdk && this.ysdk.features.GameplayAPI.stop(); } catch (e) {}
    },

    // ---------- Реклама ----------
    showInterstitial() {
      if (Date.now() - this.lastAd < AD_INTERVAL_MS || this.adOpen) return Promise.resolve(false);
      this.lastAd = Date.now();
      if (!this.ysdk) return Promise.resolve(false);
      return new Promise((resolve) => {
        this.adOpen = true;
        this.emit('pause');
        this.ysdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: (shown) => { this.adOpen = false; this.emit('resume'); resolve(!!shown); },
            onError: () => { this.adOpen = false; this.emit('resume'); resolve(false); }
          }
        });
      });
    },

    // Возвращает true, только если игрок досмотрел ролик.
    showRewarded() {
      if (this.adOpen) return Promise.resolve(false);
      if (!this.ysdk) {
        return new Promise((r) => setTimeout(() => r(window.confirm('[DEV] Засчитать просмотр рекламы?')), 50));
      }
      return new Promise((resolve) => {
        let rewarded = false;
        this.adOpen = true;
        this.emit('pause');
        this.ysdk.adv.showRewardedVideo({
          callbacks: {
            onRewarded: () => { rewarded = true; },
            onClose: () => { this.adOpen = false; this.lastAd = Date.now(); this.emit('resume'); resolve(rewarded); },
            onError: () => { this.adOpen = false; this.emit('resume'); resolve(false); }
          }
        });
      });
    },

    // ---------- Покупки ----------
    priceLabel(id) {
      const p = this.catalog[id];
      if (p && p.price) return p.price;
      return PRODUCTS[id].price + ' ' + (this.lang === 'ru' ? 'ян' : 'YAN');
    },
    currencyIcon(id) {
      const p = this.catalog[id];
      try { return p && p.getPriceCurrencyImage ? p.getPriceCurrencyImage('small') : ''; } catch (e) { return ''; }
    },

    // Возвращает { ok, token }.
    async purchase(id) {
      if (!this.payments) {
        if (!this.local) return { ok: false };
        const ok = window.confirm('[DEV] Подтвердить тестовую покупку «' + id + '»?');
        return { ok, token: ok ? 'dev-' + Date.now() : null };
      }
      try {
        const res = await this.payments.purchase({ id });
        return { ok: true, token: res.purchaseToken };
      } catch (e) {
        return { ok: false };
      }
    },
    async consume(token) {
      if (!this.payments || !token) return;
      try { await this.payments.consumePurchase(token); } catch (e) {}
    },
    // Список покупок, привязанных к аккаунту: постоянные товары + необработанные расходники.
    async getPurchases() {
      if (!this.payments) return [];
      try { return await this.payments.getPurchases(); } catch (e) { return []; }
    },

    // ---------- Сохранения ----------
    async loadCloud(key) {
      let local = null;
      try { local = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      if (!this.player) return local;
      try {
        const data = await this.player.getData([key]);
        const cloud = data && data[key] ? JSON.parse(data[key]) : null;
        if (!cloud) return local;
        if (!local) return cloud;
        return (cloud.ts || 0) >= (local.ts || 0) ? cloud : local;
      } catch (e) { return local; }
    },
    saveLocal(key, obj) {
      try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
    },
    async saveCloud(key, obj) {
      if (!this.player) return;
      try { await this.player.setData({ [key]: JSON.stringify(obj) }, false); } catch (e) {}
    },

    // ---------- Лидерборды ----------
    async submitScore(board, score) {
      if (!this.ysdk) return;
      try {
        if (this.ysdk.leaderboards && this.ysdk.leaderboards.setScore) {
          await this.ysdk.leaderboards.setScore(board, Math.floor(score));
        } else if (this.ysdk.getLeaderboards) {
          const lb = await this.ysdk.getLeaderboards();
          await lb.setLeaderboardScore(board, Math.floor(score));
        }
      } catch (e) {}
    },

    isAuthorized() {
      return !!(this.player && this.player.getMode && this.player.getMode() !== 'lite');
    },
    async auth() {
      if (!this.ysdk || !this.ysdk.auth) return false;
      try {
        await this.ysdk.auth.openAuthDialog();
        this.player = await this.ysdk.getPlayer({ scopes: false });
        return true;
      } catch (e) { return false; }
    }
  };

  window.YSDK = SDK;
})();

// Хранилище: профили, треки, лайки, подписки и комментарии в localStorage,
// загруженные аудиофайлы — в IndexedDB.
const Store = (() => {
  const KEY = 'volna_db_v1';
  let data = null;

  const uid = (p) => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function seed() {
    const now = Date.now();
    const H = 3600e3;
    const users = [
      { username: 'anya_beats', name: 'Аня Морозова', bio: 'Lo-fi биты для учёбы и ночных прогулок 🌙\nМосква', hue: 265, genre: 'lofi',
        tracks: ['Дождь на Арбате', 'Чай с бергамотом', 'Ночная смена', 'Сонный трамвай'] },
      { username: 'max.wave', name: 'Макс Волков', bio: 'Synthwave / ретро 80-х. Пишу музыку к несуществующим фильмам 🌆', hue: 320, genre: 'synthwave',
        tracks: ['Неон над Невой', 'Последний автобус', 'Хромированное лето'] },
      { username: 'dj_lera', name: 'Лера Соколова', bio: 'House DJ · сеты по пятницам\nБукинг в директ 💌', hue: 190, genre: 'house',
        tracks: ['Пятница, 23:59', 'Бетон и бархат', 'Танцуй, пока горит'] },
      { username: 'timur808', name: 'Тимур', bio: 'Битмейкер. 808 — это образ жизни 🔊', hue: 20, genre: 'trap',
        tracks: ['808 на районе', 'Холодный лёд', 'Без тормозов'] },
      { username: 'polina.sky', name: 'Полина Небо', bio: 'Эмбиент, поля, тишина ☁️', hue: 160, genre: 'ambient',
        tracks: ['Северное сияние', 'Туман над озером', 'Тишина между нот'] },
      { username: 'kirill_pop', name: 'Кирилл Лето', bio: 'Поп-продюсер. Делаю песни, которые застревают в голове 🍋', hue: 45, genre: 'pop',
        tracks: ['Летние окна', 'Твой плейлист', 'Солнце в кармане'] },
    ];
    const r = Synth.rng(20261021);
    const db = { version: 1, session: null, users: {}, tracks: {}, comments: [] };
    const ids = [];
    users.forEach((u, ui) => {
      const id = 'u_demo' + ui;
      ids.push(id);
      db.users[id] = {
        id, username: u.username, name: u.name, bio: u.bio, hue: u.hue, avatar: null,
        password: hash('demo'), demo: true, following: [], likes: [], privateLikes: false,
        createdAt: now - (60 + ui * 5) * 24 * H,
      };
      u.tracks.forEach((title, ti) => {
        const tid = 't_demo' + ui + '_' + ti;
        db.tracks[tid] = {
          id: tid, title, artistId: id, genre: u.genre, kind: 'synth',
          seed: Math.floor(r() * 2 ** 31), description: '', cover: null,
          plays: 40 + Math.floor(r() * 2400), createdAt: now - Math.floor((2 + r() * 40) * 24 * H),
        };
      });
    });
    const trackIds = Object.keys(db.tracks);
    // подписки и лайки между демо-пользователями
    ids.forEach((id, i) => {
      const u = db.users[id];
      u.following = ids.filter((o, j) => o !== id && (j + i) % 3 !== 0);
      const liked = trackIds.filter((t) => db.tracks[t].artistId !== id && r() < 0.4);
      u.likes = liked.map((t) => ({ trackId: t, at: now - Math.floor(r() * 96 * H) })).sort((a, b) => b.at - a.at);
    });
    const lines = ['🔥🔥🔥', 'Это на репит', 'Под дождь идеально', 'Когда альбом?', 'Мурашки с первых секунд', 'Добавил в свой плейлист', 'Бас качает 💥', 'Очень красиво ✨'];
    trackIds.forEach((t) => {
      const n = Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const author = ids[Math.floor(r() * ids.length)];
        if (author === db.tracks[t].artistId) continue;
        db.comments.push({ id: uid('c_'), trackId: t, userId: author, text: lines[Math.floor(r() * lines.length)], createdAt: now - Math.floor(r() * 72 * H) });
      }
    });
    return db;
  }

  function load() {
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    if (!data || data.version !== 1) { data = seed(); save(); }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      window.UI && window.UI.toast('Не хватает места в браузере — попробуйте картинку поменьше');
      return false;
    }
  }

  // ---------- IndexedDB для аудиофайлов ----------
  let idbP = null;
  function idb() {
    if (!idbP) {
      idbP = new Promise((res, rej) => {
        const req = indexedDB.open('volna_files', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('files');
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
    }
    return idbP;
  }
  async function fileOp(mode, fn) {
    const db = await idb();
    return new Promise((res, rej) => {
      const tx = db.transaction('files', mode);
      const req = fn(tx.objectStore('files'));
      tx.oncomplete = () => res(req && req.result);
      tx.onerror = () => rej(tx.error);
    });
  }
  const putFile = (key, blob) => fileOp('readwrite', (s) => s.put(blob, key));
  const getFile = (key) => fileOp('readonly', (s) => s.get(key));
  const delFile = (key) => fileOp('readwrite', (s) => s.delete(key));

  // ---------- API ----------
  const api = {
    load, save, hash, uid, putFile, getFile, delFile,
    get data() { return data; },
    me() { return data.session ? data.users[data.session] : null; },
    user: (id) => data.users[id],
    byUsername: (name) => Object.values(data.users).find((u) => u.username.toLowerCase() === String(name).toLowerCase()),
    track: (id) => data.tracks[id],
    allUsers: () => Object.values(data.users),
    allTracks: () => Object.values(data.tracks).sort((a, b) => b.createdAt - a.createdAt),
    tracksBy: (userId) => Object.values(data.tracks).filter((t) => t.artistId === userId).sort((a, b) => b.createdAt - a.createdAt),
    followers: (userId) => Object.values(data.users).filter((u) => u.following.includes(userId)),
    likers: (trackId) => Object.values(data.users).filter((u) => u.likes.some((l) => l.trackId === trackId)),
    likeCount: (trackId) => Object.values(data.users).reduce((n, u) => n + (u.likes.some((l) => l.trackId === trackId) ? 1 : 0), 0),
    isLiked(trackId) { const me = api.me(); return !!me && me.likes.some((l) => l.trackId === trackId); },
    isFollowing(userId) { const me = api.me(); return !!me && me.following.includes(userId); },
    comments: (trackId) => data.comments.filter((c) => c.trackId === trackId).sort((a, b) => a.createdAt - b.createdAt),

    register({ username, name, password }) {
      username = username.trim().replace(/^@/, '');
      if (!/^[a-zA-Z0-9_.]{3,24}$/.test(username)) throw new Error('Ник: 3–24 символа, латиница, цифры, «_» и «.»');
      if (api.byUsername(username)) throw new Error('Такой ник уже занят');
      if (!password || password.length < 4) throw new Error('Пароль — минимум 4 символа');
      const id = uid('u_');
      data.users[id] = {
        id, username, name: name.trim() || username, bio: '', hue: Math.floor(Math.random() * 360), avatar: null,
        password: hash(password), following: [], likes: [], privateLikes: false, createdAt: Date.now(),
      };
      data.session = id;
      save();
      return data.users[id];
    },
    login(username, password) {
      const u = api.byUsername(username.trim().replace(/^@/, ''));
      if (!u || u.password !== hash(password)) throw new Error('Неверный ник или пароль');
      data.session = u.id;
      save();
      return u;
    },
    loginDemo(id) { data.session = id; save(); },
    logout() { data.session = null; save(); },

    toggleLike(trackId) {
      const me = api.me();
      const i = me.likes.findIndex((l) => l.trackId === trackId);
      if (i >= 0) me.likes.splice(i, 1);
      else me.likes.unshift({ trackId, at: Date.now() });
      save();
      return i < 0;
    },
    toggleFollow(userId) {
      const me = api.me();
      const i = me.following.indexOf(userId);
      if (i >= 0) me.following.splice(i, 1);
      else me.following.push(userId);
      save();
      return i < 0;
    },
    addComment(trackId, text) {
      data.comments.push({ id: uid('c_'), trackId, userId: data.session, text, createdAt: Date.now() });
      save();
    },
    deleteComment(id) {
      data.comments = data.comments.filter((c) => !(c.id === id && c.userId === data.session));
      save();
    },
    addTrack(t) {
      const id = uid('t_');
      data.tracks[id] = { id, artistId: data.session, plays: 0, createdAt: Date.now(), description: '', cover: null, ...t };
      if (!save()) { delete data.tracks[id]; return null; }
      return data.tracks[id];
    },
    deleteTrack(id) {
      const t = data.tracks[id];
      if (!t || t.artistId !== data.session) return;
      delete data.tracks[id];
      Object.values(data.users).forEach((u) => { u.likes = u.likes.filter((l) => l.trackId !== id); });
      data.comments = data.comments.filter((c) => c.trackId !== id);
      if (t.kind === 'file') delFile('audio:' + id).catch(() => {});
      save();
    },
    countPlay(id) {
      if (data.tracks[id]) { data.tracks[id].plays++; save(); }
    },
    updateProfile(patch) {
      const me = api.me();
      if (patch.username !== undefined) {
        const u = patch.username.trim().replace(/^@/, '');
        if (!/^[a-zA-Z0-9_.]{3,24}$/.test(u)) throw new Error('Ник: 3–24 символа, латиница, цифры, «_» и «.»');
        const other = api.byUsername(u);
        if (other && other.id !== me.id) throw new Error('Такой ник уже занят');
        patch.username = u;
      }
      const backup = { ...me };
      Object.assign(me, patch);
      if (!save()) { Object.assign(me, backup); throw new Error('Не удалось сохранить'); }
    },
    reset() {
      localStorage.removeItem(KEY);
      indexedDB.deleteDatabase('volna_files');
      load();
    },

    // Лента: что выложили и что лайкнули люди, на которых я подписан
    feed() {
      const me = api.me();
      const events = [];
      for (const fid of me.following) {
        const u = data.users[fid];
        if (!u) continue;
        api.tracksBy(fid).forEach((t) => events.push({ type: 'upload', user: u, track: t, at: t.createdAt }));
        if (!u.privateLikes) {
          u.likes.forEach((l) => {
            const t = data.tracks[l.trackId];
            if (t) events.push({ type: 'like', user: u, track: t, at: l.at });
          });
        }
      }
      return events.sort((a, b) => b.at - a.at).slice(0, 60);
    },
  };
  return api;
})();

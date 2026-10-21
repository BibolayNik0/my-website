// ---------- Утилиты ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const fmtNum = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' млн';
  if (n >= 1e4) return Math.round(n / 1e3) + ' тыс.';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + ' тыс.';
  return String(n);
};
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
function ago(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'только что';
  if (d < 3600) return Math.floor(d / 60) + ' мин.';
  if (d < 86400) return Math.floor(d / 3600) + ' ч.';
  if (d < 86400 * 7) return Math.floor(d / 86400) + ' д.';
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
const genreName = (g) => (Synth.GENRES[g] ? Synth.GENRES[g].name : 'Другое');

const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M5 6.2v11.6a1 1 0 0 0 1.55.83L15 13v4.5a1 1 0 0 0 2 0v-11a1 1 0 0 0-2 0V11L6.55 5.37A1 1 0 0 0 5 6.2z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M19 6.2v11.6a1 1 0 0 1-1.55.83L9 13v4.5a1 1 0 0 1-2 0v-11a1 1 0 0 1 2 0V11l8.45-5.63A1 1 0 0 1 19 6.2z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" class="i-heart"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" class="i-line"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5z"/></svg>',
  home: '<svg viewBox="0 0 24 24" class="i-line"><path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z"/></svg>',
  search: '<svg viewBox="0 0 24 24" class="i-line"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" class="i-line"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8v8M8 12h8"/></svg>',
  user: '<svg viewBox="0 0 24 24" class="i-line"><circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.2-3.8 4.3-5.5 8-5.5s6.8 1.7 8 5.5"/></svg>',
  headphones: '<svg viewBox="0 0 24 24" class="i-line"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.5"/></svg>',
  volume: '<svg viewBox="0 0 24 24" class="i-line"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="i-line"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" class="i-line"><path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13.5h9l1-13.5"/></svg>',
  share: '<svg viewBox="0 0 24 24" class="i-line"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" class="i-line"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" class="i-line"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  grid: '<svg viewBox="0 0 24 24" class="i-line"><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/></svg>',
};
const playIcon = () => `<span class="ic-play">${ICON.play}</span><span class="ic-pause">${ICON.pause}</span>`;

// ---------- Обложки и аватарки ----------
const coverCache = new Map();
function coverSrc(t) {
  if (t.cover) return t.cover;
  const key = t.genre + t.seed;
  if (coverCache.has(key)) return coverCache.get(key);
  const r = Synth.rng((t.seed || 1) ^ 0x51ed27);
  const h1 = Math.floor(r() * 360);
  const h2 = (h1 + 40 + Math.floor(r() * 120)) % 360;
  let shapes = '';
  if (t.genre === 'synthwave') {
    const sunR = 38 + r() * 26, sunX = 60 + r() * 80;
    shapes += `<circle cx="${sunX.toFixed(1)}" cy="${(150 - sunR * 0.75).toFixed(1)}" r="${sunR.toFixed(1)}" fill="url(#s)"/>`;
    for (let i = 0; i < 5; i++) shapes += `<rect x="0" y="${150 - sunR * 0.55 + i * 8}" width="200" height="${2 + i}" fill="hsl(${h1} 60% 18%)"/>`;
    for (let i = 0; i < 7; i++) shapes += `<line x1="${100 + (i - 3) * 12}" y1="150" x2="${100 + (i - 3) * 60}" y2="200" stroke="hsl(${h2} 100% 70%)" stroke-opacity=".5"/>`;
    shapes += `<line x1="0" y1="150" x2="200" y2="150" stroke="hsl(${h2} 100% 70%)" stroke-opacity=".6"/>`;
  } else if (t.genre === 'ambient') {
    for (let i = 0; i < 4; i++) {
      const y = 60 + i * 35 + r() * 10;
      shapes += `<path d="M0 ${y} Q 50 ${y - 25 - r() * 20} 100 ${y} T 200 ${y} V200 H0Z" fill="hsl(${(h1 + i * 15) % 360} 50% ${60 - i * 9}%)" fill-opacity=".45"/>`;
    }
  } else {
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const cx = r() * 200, cy = r() * 200, rad = 20 + r() * 70;
      shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="hsl(${Math.floor(r() * 360)} 90% 70%)" fill-opacity="${(0.15 + r() * 0.35).toFixed(2)}"/>`;
    }
    if (t.genre === 'trap') shapes += `<rect x="30" y="30" width="140" height="140" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" transform="rotate(${Math.floor(r() * 30)} 100 100)"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 75% 55%)"/><stop offset="1" stop-color="hsl(${h2} 70% 25%)"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36e"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/>${shapes}</svg>`;
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  coverCache.set(key, src);
  return src;
}
const cover = (t, cls = '') => `<img class="cover ${cls}" src="${coverSrc(t)}" alt="" loading="lazy">`;

function avatar(u, size = 32, ring = false) {
  const inner = u.avatar
    ? `<img src="${u.avatar}" alt="">`
    : `<span style="font-size:${Math.round(size * 0.42)}px">${esc((u.name || u.username).trim()[0] || '?').toUpperCase()}</span>`;
  const el = `<span class="avatar" style="--h:${u.hue};width:${size}px;height:${size}px">${inner}</span>`;
  return ring ? `<span class="ring">${el}</span>` : el;
}
function hasFresh(u) {
  const day = Date.now() - 48 * 3600e3;
  return Store.tracksBy(u.id).some((t) => t.createdAt > day) || (!u.privateLikes && u.likes.some((l) => l.at > day));
}

function trackPeaks(t) {
  return t.peaks && t.peaks.length ? t.peaks : Synth.peaks(t);
}
function trackDuration(t) {
  return t.kind === 'synth' ? Synth.duration(t) : t.duration || 0;
}
function wave(t, cls = '') {
  const bars = trackPeaks(t).map((p) => `<i style="height:${Math.round(p * 100)}%"></i>`).join('');
  return `<div class="wave ${cls}" data-action="seek" data-wave="${t.id}" data-id="${t.id}"><div class="wave-bars">${bars}</div><div class="wave-fill">${bars}</div></div>`;
}
function likeBtn(t, big = false) {
  const liked = Store.isLiked(t.id);
  return `<button class="like-btn ${liked ? 'liked' : ''} ${big ? 'big' : ''}" data-action="like" data-like-btn="${t.id}" data-id="${t.id}" title="Нравится">${ICON.heart}<span class="cnt">${fmtNum(Store.likeCount(t.id))}</span></button>`;
}
function playBtn(id, cls = '') {
  return `<button class="play-btn ${cls}" data-action="play" data-play="${id}" data-id="${id}" aria-label="Слушать">${playIcon()}</button>`;
}

// ---------- Плеер ----------
const Player = {
  engine: new Synth.Engine(),
  audio: new Audio(),
  queue: [],
  index: -1,
  current: null,
  backend: null,
  temp: null,
  objectUrl: null,
  token: 0,

  trackOf(id) { return id === 'preview' ? this.temp : Store.track(id); },
  get playing() {
    if (this.backend === 'synth') return this.engine.playing;
    if (this.backend === 'file') return !this.audio.paused;
    return false;
  },
  get time() { return this.backend === 'synth' ? this.engine.currentTime : this.backend === 'file' ? this.audio.currentTime : 0; },
  get duration() {
    if (this.backend === 'synth') return this.engine.duration;
    if (this.backend === 'file') return isFinite(this.audio.duration) ? this.audio.duration : (this.trackOf(this.current) || {}).duration || 0;
    return 0;
  },

  stopBackend() {
    this.engine.pause();
    this.audio.pause();
  },
  async load(id) {
    const t = this.trackOf(id);
    if (!t) return false;
    const my = ++this.token;
    this.stopBackend();
    if (t.kind === 'synth') {
      this.engine.load(t);
      this.backend = 'synth';
    } else {
      let blob = null;
      try { blob = await Store.getFile('audio:' + id); } catch (e) { blob = null; }
      if (my !== this.token) return false;
      if (!blob) { UI.toast('Аудиофайл не найден в этом браузере'); return false; }
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = URL.createObjectURL(blob);
      this.audio.src = this.objectUrl;
      this.backend = 'file';
    }
    this.current = id;
    if (id !== 'preview') Store.countPlay(id);
    this.updateBar();
    return true;
  },
  async play(id, queue) {
    if (queue && queue.length) this.queue = queue.slice();
    if (!this.queue.includes(id)) this.queue = [id];
    this.index = this.queue.indexOf(id);
    if (this.current !== id) {
      if (!(await this.load(id))) return;
    }
    this.resume();
  },
  preview(t) {
    this.temp = { ...t, id: 'preview' };
    this.current = null;
    this.play('preview', ['preview']);
  },
  resume() {
    if (this.backend === 'synth') this.engine.play();
    else if (this.backend === 'file') this.audio.play().catch(() => UI.toast('Не удалось воспроизвести файл'));
    UI.syncPlayState();
  },
  pause() {
    this.stopBackend();
    UI.syncPlayState();
  },
  toggle(id, queue) {
    if (id && id !== this.current) return this.play(id, queue);
    if (!this.current) return;
    this.playing ? this.pause() : this.resume();
  },
  seek(sec) {
    if (this.backend === 'synth') this.engine.seek(sec);
    else if (this.backend === 'file') this.audio.currentTime = sec;
    UI.syncProgress();
  },
  next(auto = false) {
    if (this.index < this.queue.length - 1) return this.play(this.queue[this.index + 1]);
    if (auto) { this.seek(0); this.pause(); }
  },
  prev() {
    if (this.time > 3 || this.index <= 0) return this.seek(0);
    this.play(this.queue[this.index - 1]);
  },
  setVolume(v) {
    this.engine.setVolume(v);
    this.audio.volume = v;
    try { localStorage.setItem('volna_volume', v); } catch (e) {}
  },

  updateBar() {
    const t = this.trackOf(this.current);
    const bar = $('#player');
    if (!t) { bar.classList.add('empty'); return; }
    bar.classList.remove('empty');
    const artist = Store.user(t.artistId) || Store.me();
    $('#pl-cover').src = coverSrc(t);
    $('#pl-title').textContent = t.title;
    $('#pl-title').href = t.id === 'preview' ? '#/upload' : '#/t/' + t.id;
    $('#pl-artist').textContent = artist ? artist.name : '';
    $('#pl-artist').href = artist ? '#/u/' + artist.username : '#/';
    const like = $('#pl-like');
    like.hidden = t.id === 'preview';
    like.dataset.id = t.id;
    like.dataset.likeBtn = t.id;
    like.classList.toggle('liked', Store.isLiked(t.id));
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: artist ? artist.name : '', album: 'Волна' });
    }
  },
};
Player.engine.onended = () => Player.next(true);
Player.audio.addEventListener('ended', () => Player.next(true));
Player.audio.addEventListener('play', () => UI.syncPlayState());
Player.audio.addEventListener('pause', () => UI.syncPlayState());
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => Player.resume());
  navigator.mediaSession.setActionHandler('pause', () => Player.pause());
  navigator.mediaSession.setActionHandler('nexttrack', () => Player.next());
  navigator.mediaSession.setActionHandler('previoustrack', () => Player.prev());
}

// ---------- UI-помощники ----------
const UI = {
  toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => el.classList.remove('show'), 2600);
  },
  modal(title, html) {
    this.closeModal();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog"><header><h3>${esc(title)}</h3><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">✕</button></header><div class="modal-body">${html}</div></div>`;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) this.closeModal(); });
    document.body.appendChild(wrap);
  },
  closeModal() { $$('.modal-wrap').forEach((m) => m.remove()); },
  syncPlayState() {
    const playing = Player.playing;
    $$('[data-play]').forEach((b) => b.classList.toggle('is-playing', playing && b.dataset.play === Player.current));
    $$('[data-row]').forEach((r) => r.classList.toggle('current', r.dataset.row === Player.current));
    $('#pl-toggle').classList.toggle('is-playing', playing);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  },
  syncProgress() {
    const d = Player.duration;
    const p = d ? Math.min(100, (Player.time / d) * 100) : 0;
    $('#pl-progress').style.setProperty('--p', p + '%');
    $('#pl-time').textContent = fmtTime(Player.time);
    $('#pl-dur').textContent = fmtTime(d);
    $$('[data-wave]').forEach((w) => {
      const val = w.dataset.wave === Player.current ? p : 0;
      w.querySelector('.wave-fill').style.clipPath = `inset(0 ${100 - val}% 0 0)`;
    });
  },
  syncLikes(id) {
    const liked = Store.isLiked(id);
    const cnt = fmtNum(Store.likeCount(id));
    $$(`[data-like-btn="${CSS.escape(id)}"]`).forEach((b) => {
      b.classList.toggle('liked', liked);
      const c = b.querySelector('.cnt');
      if (c) c.textContent = cnt;
    });
  },
};
window.UI = UI;
setInterval(() => { if (Player.current) UI.syncProgress(); }, 200);

function readImage(file, max = 512) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * k), h = Math.round(img.height * k);
      const c = document.createElement('canvas');
      const side = Math.min(w, h);
      c.width = c.height = side;
      c.getContext('2d').drawImage(img, (img.width - side / k) / 2, (img.height - side / k) / 2, side / k, side / k, 0, 0, side, side);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Не удалось прочитать картинку')); };
    img.src = url;
  });
}

async function analyzeAudio(file) {
  const buf = await file.arrayBuffer();
  Player.engine.ensure();
  const audio = await Player.engine.ctx.decodeAudioData(buf);
  const ch = audio.getChannelData(0);
  const n = 90, block = Math.floor(ch.length / n);
  const peaks = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < block; j += 16) sum += Math.abs(ch[i * block + j]);
    peaks.push(sum / (block / 16));
  }
  const max = Math.max(...peaks) || 1;
  return { duration: audio.duration, peaks: peaks.map((p) => Math.max(0.06, +(p / max).toFixed(2))) };
}

// ---------- Компоненты ----------
function trackCard(t) {
  const a = Store.user(t.artistId);
  const comments = Store.comments(t.id).length;
  return `<div class="tcard" data-row="${t.id}">
    <div class="tcard-cover">${cover(t)}${playBtn(t.id, 'overlay')}</div>
    <div class="tcard-main">
      <div class="tcard-head">
        <div class="tcard-titles">
          <a class="muted small" href="#/u/${esc(a.username)}">${esc(a.name)}</a>
          <a class="tcard-title" href="#/t/${t.id}">${esc(t.title)}</a>
        </div>
        <span class="tag">#${esc(genreName(t.genre))}</span>
      </div>
      ${wave(t)}
      <div class="tcard-actions">
        ${likeBtn(t)}
        <a class="act" href="#/t/${t.id}">${ICON.comment}<span>${comments}</span></a>
        <span class="act muted">${ICON.headphones}<span>${fmtNum(t.plays)}</span></span>
        <span class="spacer"></span>
        <span class="muted small">${fmtTime(trackDuration(t))}</span>
      </div>
    </div>
  </div>`;
}

function trackRow(t, n) {
  const a = Store.user(t.artistId);
  return `<div class="row" data-row="${t.id}">
    ${n !== undefined ? `<span class="row-n">${n}</span>` : ''}
    <div class="row-cover">${cover(t)}${playBtn(t.id, 'overlay sm')}</div>
    <div class="row-info">
      <a class="row-title" href="#/t/${t.id}">${esc(t.title)}</a>
      <a class="row-artist" href="#/u/${esc(a.username)}">${esc(a.name)}</a>
    </div>
    <span class="tag hide-sm">${esc(genreName(t.genre))}</span>
    <span class="row-dur muted small">${fmtTime(trackDuration(t))}</span>
    ${likeBtn(t)}
  </div>`;
}
const trackList = (tracks, numbered = false) =>
  `<div class="list" data-queue="${tracks.map((t) => t.id).join(',')}">${tracks.map((t, i) => trackRow(t, numbered ? i + 1 : undefined)).join('')}</div>`;

function tile(t) {
  const a = Store.user(t.artistId);
  return `<div class="tile" data-row="${t.id}">
    <div class="tile-cover">${cover(t)}${playBtn(t.id, 'overlay')}
      <div class="tile-stats"><span>${ICON.heart} ${fmtNum(Store.likeCount(t.id))}</span><span>${ICON.headphones} ${fmtNum(t.plays)}</span></div>
    </div>
    <a class="tile-title" href="#/t/${t.id}">${esc(t.title)}</a>
    <a class="tile-artist" href="#/u/${esc(a.username)}">${esc(a.name)}</a>
  </div>`;
}
const tileGrid = (tracks) => `<div class="grid" data-queue="${tracks.map((t) => t.id).join(',')}">${tracks.map(tile).join('')}</div>`;

function followBtn(u, small = false) {
  const me = Store.me();
  if (!me || u.id === me.id) return '';
  const f = Store.isFollowing(u.id);
  const back = u.following.includes(me.id);
  return `<button class="btn ${f ? 'btn-ghost' : 'btn-primary'} ${small ? 'btn-sm' : ''}" data-action="follow" data-id="${u.id}">${f ? 'Вы подписаны' : back ? 'Подписаться в ответ' : 'Подписаться'}</button>`;
}
function userRow(u) {
  return `<div class="urow">
    <a href="#/u/${esc(u.username)}" class="urow-link">${avatar(u, 44)}<span><b>${esc(u.username)}</b><span class="muted small">${esc(u.name)}</span></span></a>
    ${followBtn(u, true)}
  </div>`;
}
const userList = (users, empty = 'Пока никого') => (users.length ? users.map(userRow).join('') : `<p class="empty">${empty}</p>`);

function suggestions(limit = 5) {
  const me = Store.me();
  return Store.allUsers()
    .filter((u) => u.id !== me.id && !me.following.includes(u.id))
    .map((u) => ({ u, score: Store.followers(u.id).length + (u.following.includes(me.id) ? 10 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.u);
}

// ---------- Экраны ----------
const Views = {
  auth(mode = 'login') {
    const demos = Store.allUsers().filter((u) => u.demo);
    return `<div class="auth">
      <div class="auth-card">
        <div class="logo big">Волна</div>
        <p class="muted center">Слушайте музыку, делитесь треками и смотрите, что нравится друзьям.</p>
        <div class="seg">
          <a href="#/login" class="${mode === 'login' ? 'active' : ''}">Вход</a>
          <a href="#/register" class="${mode === 'register' ? 'active' : ''}">Регистрация</a>
        </div>
        ${mode === 'login'
          ? `<form id="login-form" class="form">
              <input name="username" placeholder="Ник" autocomplete="username" required>
              <input name="password" type="password" placeholder="Пароль" autocomplete="current-password" required>
              <button class="btn btn-primary btn-block">Войти</button>
            </form>`
          : `<form id="register-form" class="form">
              <input name="name" placeholder="Имя" autocomplete="name">
              <input name="username" placeholder="Ник (латиницей)" autocomplete="username" required>
              <input name="password" type="password" placeholder="Пароль" autocomplete="new-password" required>
              <button class="btn btn-primary btn-block">Создать аккаунт</button>
            </form>`}
        <div class="divider"><span>или войдите как демо-пользователь</span></div>
        <div class="demo-list">
          ${demos.map((u) => `<button class="demo" data-action="demo-login" data-id="${u.id}">${avatar(u, 40)}<span>${esc(u.username)}</span></button>`).join('')}
        </div>
        <p class="muted tiny center">Данные хранятся только в этом браузере.</p>
      </div>
    </div>`;
  },

  feed() {
    const me = Store.me();
    const following = me.following.map(Store.user).filter(Boolean);
    const events = Store.feed();
    const stories = following.length
      ? `<div class="stories">${following
          .sort((a, b) => hasFresh(b) - hasFresh(a))
          .map((u) => `<a class="story" href="#/u/${esc(u.username)}">${avatar(u, 62, hasFresh(u))}<span>${esc(u.username)}</span></a>`)
          .join('')}</div>`
      : '';
    const sugg = suggestions();
    const side = sugg.length
      ? `<aside class="side"><div class="side-me">${avatar(me, 44)}<div><a href="#/u/${esc(me.username)}"><b>${esc(me.username)}</b></a><div class="muted small">${esc(me.name)}</div></div></div>
          <h4 class="muted">Рекомендации для вас</h4>${userList(sugg)}</aside>`
      : '';
    let body;
    if (!events.length) {
      const fresh = Store.allTracks().slice(0, 8);
      body = `<div class="card empty-feed"><h2>Ваша лента пока пуста</h2><p class="muted">Подпишитесь на авторов — здесь появятся их новые треки и то, что они лайкают.</p>${userList(sugg)}</div>
        <h3 class="section-title">Новое на Волне</h3>${trackList(fresh)}`;
    } else {
      body = `<div data-queue="${[...new Set(events.map((e) => e.track.id))].join(',')}">` +
        events.map((e) => `<article class="post">
          <header class="post-head">
            <a href="#/u/${esc(e.user.username)}">${avatar(e.user, 32)}</a>
            <div><a href="#/u/${esc(e.user.username)}"><b>${esc(e.user.username)}</b></a>
            <span class="muted">${e.type === 'like' ? 'лайкнул(а) трек' : 'выложил(а) новый трек'} · ${ago(e.at)}</span></div>
          </header>
          ${trackCard(e.track)}
        </article>`).join('') + '</div>';
    }
    return `<div class="with-side"><div class="main-col">${stories}${body}</div>${side}</div>`;
  },

  explore(params) {
    const q = (params.get('q') || '').trim().toLowerCase();
    const genre = params.get('genre') || '';
    const sort = params.get('sort') || 'top';
    const search = `<form id="search-form" class="search">${ICON.search}<input name="q" value="${esc(q)}" placeholder="Поиск треков и людей" autocomplete="off"></form>`;
    if (q) {
      const users = Store.allUsers().filter((u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
      const tracks = Store.allTracks().filter((t) => {
        const a = Store.user(t.artistId);
        return t.title.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || genreName(t.genre).toLowerCase().includes(q);
      });
      return `${search}
        <h3 class="section-title">Люди</h3>${userList(users, 'Никого не нашли')}
        <h3 class="section-title">Треки</h3>${tracks.length ? trackList(tracks) : '<p class="empty">Ничего не нашли</p>'}`;
    }
    let tracks = Store.allTracks().filter((t) => !genre || t.genre === genre);
    if (sort === 'top') tracks.sort((a, b) => Store.likeCount(b.id) * 50 + b.plays - (Store.likeCount(a.id) * 50 + a.plays));
    const link = (g, s) => `#/explore?${new URLSearchParams({ ...(g ? { genre: g } : {}), sort: s })}`;
    return `${search}
      <div class="chips">
        <a class="chip ${!genre ? 'active' : ''}" href="${link('', sort)}">Все</a>
        ${Object.entries(Synth.GENRES).map(([k, g]) => `<a class="chip ${genre === k ? 'active' : ''}" href="${link(k, sort)}">${g.name}</a>`).join('')}
        <span class="spacer"></span>
        <a class="chip ghost ${sort === 'top' ? 'active' : ''}" href="${link(genre, 'top')}">Популярное</a>
        <a class="chip ghost ${sort === 'new' ? 'active' : ''}" href="${link(genre, 'new')}">Новое</a>
      </div>
      ${tracks.length ? tileGrid(tracks) : '<p class="empty">В этом жанре пока нет треков</p>'}`;
  },

  profile(username, tab) {
    const u = Store.byUsername(username);
    if (!u) return `<div class="card center"><h2>Пользователь не найден</h2><p class="muted">Возможно, ссылка устарела.</p><a class="btn btn-primary" href="#/explore">К поиску</a></div>`;
    const me = Store.me();
    const isMe = u.id === me.id;
    const tracks = Store.tracksBy(u.id);
    const followers = Store.followers(u.id);
    const followsMe = !isMe && u.following.includes(me.id);
    const likes = u.likes.map((l) => Store.track(l.trackId)).filter(Boolean);
    const commonFollowers = !isMe ? followers.filter((f) => me.following.includes(f.id)) : [];

    let content;
    if (tab === 'likes') {
      if (u.privateLikes && !isMe) {
        content = `<div class="empty-state">${ICON.lock}<h3>Лайки скрыты</h3><p class="muted">${esc(u.username)} решил(а) не показывать понравившиеся треки.</p></div>`;
      } else if (!likes.length) {
        content = `<div class="empty-state">${ICON.heart}<h3>Пока нет лайков</h3><p class="muted">${isMe ? 'Нажимайте ♥ на треках — они появятся здесь, и друзья их увидят.' : 'Здесь появятся треки, которые понравятся ' + esc(u.username) + '.'}</p></div>`;
      } else {
        const common = isMe ? 0 : likes.filter((t) => Store.isLiked(t.id)).length;
        const total = likes.reduce((s, t) => s + trackDuration(t), 0);
        content = `<div class="likes-head">
            <button class="btn btn-primary" data-action="play-all">${ICON.play} Слушать все</button>
            <div class="muted small">${likes.length} ${plural(likes.length, 'трек', 'трека', 'треков')} · ${Math.round(total / 60)} мин.${common ? ` · <span class="accent">${common} ${plural(common, 'общий', 'общих', 'общих')} с вами ♥</span>` : ''}${isMe && u.privateLikes ? ' · ' + ICON.lock + ' видно только вам' : ''}</div>
          </div>${trackList(likes, true)}`;
      }
    } else {
      content = tracks.length
        ? tileGrid(tracks)
        : `<div class="empty-state">${ICON.grid}<h3>Треков пока нет</h3>${isMe ? '<a class="btn btn-primary" href="#/upload">Загрузить первый трек</a>' : ''}</div>`;
    }

    return `<section class="profile-head">
        <div class="ph-avatar">${avatar(u, 150, hasFresh(u))}</div>
        <div class="ph-info">
          <div class="ph-top">
            <h1>${esc(u.username)}</h1>
            <div class="ph-buttons">
              ${isMe
                ? `<a class="btn btn-ghost btn-sm" href="#/settings">Редактировать профиль</a><a class="icon-btn" href="#/settings" title="Настройки">${ICON.settings}</a>`
                : `${followBtn(u, true)}<button class="btn btn-ghost btn-sm" data-action="share-profile" data-id="${u.id}">Поделиться</button>`}
            </div>
          </div>
          <ul class="stats">
            <li><b>${tracks.length}</b> ${plural(tracks.length, 'трек', 'трека', 'треков')}</li>
            <li><button data-action="followers" data-id="${u.id}"><b>${fmtNum(followers.length)}</b> ${plural(followers.length, 'подписчик', 'подписчика', 'подписчиков')}</button></li>
            <li><button data-action="following" data-id="${u.id}"><b>${fmtNum(u.following.length)}</b> ${plural(u.following.length, 'подписка', 'подписки', 'подписок')}</button></li>
          </ul>
          <div class="ph-name">${esc(u.name)}${followsMe ? '<span class="badge">подписан(а) на вас</span>' : ''}</div>
          ${u.bio ? `<div class="ph-bio">${esc(u.bio)}</div>` : ''}
          ${commonFollowers.length ? `<div class="muted small ph-common">Подписаны: ${commonFollowers.slice(0, 2).map((f) => `<a href="#/u/${esc(f.username)}"><b>${esc(f.username)}</b></a>`).join(', ')}${commonFollowers.length > 2 ? ` и ещё ${commonFollowers.length - 2}` : ''}</div>` : ''}
        </div>
      </section>
      <nav class="tabs">
        <a href="#/u/${esc(u.username)}" class="${tab !== 'likes' ? 'active' : ''}">${ICON.grid}Треки</a>
        <a href="#/u/${esc(u.username)}/likes" class="${tab === 'likes' ? 'active' : ''}">${ICON.heart}Нравится${u.privateLikes ? ICON.lock : ''}</a>
      </nav>
      <div class="tab-content" data-likes-of="${u.id}">${content}</div>`;
  },

  track(id) {
    const t = Store.track(id);
    if (!t) return `<div class="card center"><h2>Трек не найден</h2><a class="btn btn-primary" href="#/explore">Обзор</a></div>`;
    const me = Store.me();
    const a = Store.user(t.artistId);
    const likers = Store.likers(t.id);
    const friendLikers = likers.filter((u) => me.following.includes(u.id));
    const shown = (friendLikers.length ? friendLikers : likers).slice(0, 2);
    const comments = Store.comments(t.id);
    const more = Store.tracksBy(a.id).filter((x) => x.id !== t.id).slice(0, 5);
    return `<section class="track-hero" data-queue="${[t.id, ...more.map((x) => x.id)].join(',')}" data-row="${t.id}">
        <div class="th-cover">${cover(t)}</div>
        <div class="th-main">
          <div class="th-top">
            ${playBtn(t.id, 'xl')}
            <div>
              <a href="#/u/${esc(a.username)}" class="th-artist">${avatar(a, 24)} ${esc(a.name)}</a>
              <h1>${esc(t.title)}</h1>
              <div class="muted small">${ago(t.createdAt)} · <span class="tag">#${esc(genreName(t.genre))}</span>${t.kind === 'synth' ? ` · ${Synth.compose(t).bpm} BPM` : ''}</div>
            </div>
          </div>
          ${wave(t, 'big')}
          <div class="tcard-actions">
            ${likeBtn(t, true)}
            <span class="act muted">${ICON.headphones}<span>${fmtNum(t.plays)}</span></span>
            <span class="act muted">${ICON.comment}<span>${comments.length}</span></span>
            <span class="spacer"></span>
            <button class="icon-btn" data-action="share-track" data-id="${t.id}" title="Скопировать ссылку">${ICON.share}</button>
            ${a.id === me.id ? `<button class="icon-btn danger" data-action="delete-track" data-id="${t.id}" title="Удалить">${ICON.trash}</button>` : ''}
          </div>
          ${likers.length ? `<button class="likers" data-action="likers" data-id="${t.id}">
              <span class="stack">${likers.slice(0, 3).map((u) => avatar(u, 22)).join('')}</span>
              <span>Нравится <b>${esc(shown[0].username)}</b>${likers.length > 1 ? ` и <b>ещё ${likers.length - 1}</b>` : ''}</span>
            </button>` : ''}
          ${t.description ? `<p class="th-desc">${esc(t.description)}</p>` : ''}
        </div>
      </section>
      <div class="two-col">
        <section class="card">
          <h3>Комментарии</h3>
          <div class="comments">
            ${comments.length ? comments.map((c) => {
              const cu = Store.user(c.userId);
              if (!cu) return '';
              return `<div class="comment">${avatar(cu, 32)}<div><a href="#/u/${esc(cu.username)}"><b>${esc(cu.username)}</b></a> ${esc(c.text)}<div class="muted tiny">${ago(c.createdAt)}${c.userId === me.id ? ` · <button class="link" data-action="delete-comment" data-id="${c.id}">удалить</button>` : ''}</div></div></div>`;
            }).join('') : '<p class="empty">Будьте первым, кто оставит комментарий</p>'}
          </div>
          <form id="comment-form" class="comment-form" data-id="${t.id}">${avatar(me, 32)}<input name="text" placeholder="Добавьте комментарий…" maxlength="300" autocomplete="off"><button class="btn btn-primary btn-sm">Отправить</button></form>
        </section>
        ${more.length ? `<section><h3 class="section-title">Ещё от ${esc(a.name)}</h3>${trackList(more)}</section>` : ''}
      </div>`;
  },

  upload(params) {
    const mode = params.get('mode') === 'file' ? 'file' : 'gen';
    const genres = Object.entries(Synth.GENRES).map(([k, g]) => `<option value="${k}">${g.name}</option>`).join('');
    return `<div class="narrow">
      <h1 class="page-title">Новый трек</h1>
      <div class="seg">
        <a href="#/upload" class="${mode === 'gen' ? 'active' : ''}">🎛 Сгенерировать бит</a>
        <a href="#/upload?mode=file" class="${mode === 'file' ? 'active' : ''}">⬆ Загрузить файл</a>
      </div>
      ${mode === 'gen'
        ? `<form id="gen-form" class="form card">
            <p class="muted small">Выберите жанр — Волна соберёт уникальный бит. Не нравится — бросьте кубик ещё раз.</p>
            <label>Жанр<select name="genre">${genres}</select></label>
            <div class="gen-preview">
              <div class="gen-cover"><img id="gen-cover" class="cover" alt=""></div>
              <div class="gen-ctrl">
                <button type="button" class="btn btn-ghost" data-action="preview">${ICON.play} Прослушать</button>
                <button type="button" class="btn btn-ghost" data-action="reroll">${ICON.dice} Другой вариант</button>
                <div class="muted small" id="gen-info"></div>
              </div>
            </div>
            <label>Название<input name="title" required maxlength="80" placeholder="Например, «Ночной город»"></label>
            <label>Описание<textarea name="description" rows="3" maxlength="500" placeholder="О чём этот трек?"></textarea></label>
            <button class="btn btn-primary btn-block">Опубликовать</button>
          </form>`
        : `<form id="file-form" class="form card">
            <label class="drop">
              <input type="file" name="audio" accept="audio/*" required>
              <span class="drop-inner">${ICON.plus}<b id="drop-label">Выберите аудиофайл</b><span class="muted small">MP3, WAV, OGG, M4A</span></span>
            </label>
            <label>Название<input name="title" required maxlength="80"></label>
            <label>Жанр<select name="genre">${genres}<option value="other">Другое</option></select></label>
            <label>Обложка (необязательно)<input type="file" name="cover" accept="image/*"></label>
            <label>Описание<textarea name="description" rows="3" maxlength="500"></textarea></label>
            <button class="btn btn-primary btn-block" id="file-submit">Опубликовать</button>
            <p class="muted tiny">Файл сохраняется в вашем браузере (IndexedDB) и не уходит на сервер.</p>
          </form>`}
    </div>`;
  },

  settings() {
    const me = Store.me();
    return `<div class="narrow">
      <h1 class="page-title">Редактировать профиль</h1>
      <form id="profile-form" class="form card">
        <div class="avatar-edit">
          <span id="avatar-preview">${avatar(me, 72)}</span>
          <div><b>${esc(me.username)}</b><br>
            <label class="link">Сменить фото<input type="file" name="avatar" accept="image/*" hidden></label>
            ${me.avatar ? ' · <button type="button" class="link" data-action="remove-avatar">Удалить</button>' : ''}
          </div>
        </div>
        <label>Имя<input name="name" value="${esc(me.name)}" maxlength="40"></label>
        <label>Ник<input name="username" value="${esc(me.username)}" maxlength="24"></label>
        <label>О себе<textarea name="bio" rows="3" maxlength="200">${esc(me.bio)}</textarea></label>
        <label class="check"><input type="checkbox" name="privateLikes" ${me.privateLikes ? 'checked' : ''}><span><b>Скрыть мои лайки</b><br><span class="muted small">Другие не увидят вкладку «Нравится», а ваши лайки не попадут в их ленту.</span></span></label>
        <button class="btn btn-primary btn-block">Сохранить</button>
      </form>
      <div class="card stack-btns">
        <button class="btn btn-ghost btn-block" data-action="logout">Выйти из аккаунта</button>
        <button class="btn btn-ghost btn-block danger" data-action="reset">Сбросить все данные</button>
      </div>
    </div>`;
  },
};

// ---------- Роутер ----------
function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(qs || '') };
}

let genState = null;
function render() {
  UI.closeModal();
  const { parts, params } = parseRoute();
  const me = Store.me();
  const view = $('#view');
  document.body.classList.toggle('logged-out', !me);
  if (!me) {
    view.innerHTML = Views.auth(parts[0] === 'register' ? 'register' : 'login');
    return;
  }
  const [p0, p1, p2] = parts;
  let html, nav = '';
  switch (p0) {
    case undefined: case 'login': case 'register': html = Views.feed(); nav = 'feed'; break;
    case 'explore': html = Views.explore(params); nav = 'explore'; break;
    case 'upload': html = Views.upload(params); nav = 'upload'; break;
    case 'u': html = Views.profile(p1, p2); nav = p1 && p1.toLowerCase() === me.username.toLowerCase() ? 'me' : ''; break;
    case 't': html = Views.track(p1); break;
    case 'settings': html = Views.settings(); nav = 'me'; break;
    default: html = `<div class="card center"><h2>Страница не найдена</h2><a class="btn btn-primary" href="#/">На главную</a></div>`;
  }
  view.innerHTML = html;
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
  $$('[data-nav="me"]').forEach((a) => { a.href = '#/u/' + encodeURIComponent(me.username); });
  $$('.nav-avatar').forEach((el) => { el.innerHTML = avatar(me, 26); });
  if (p0 === 'upload' && $('#gen-form')) initGen();
  UI.syncPlayState();
  UI.syncProgress();
}

function initGen() {
  const form = $('#gen-form');
  genState = { genre: form.genre.value, seed: Math.floor(Math.random() * 2 ** 31) };
  const update = () => {
    genState.genre = form.genre.value;
    const t = { ...genState, kind: 'synth' };
    $('#gen-cover').src = coverSrc(t);
    const s = Synth.compose(t);
    $('#gen-info').textContent = `${s.bpm} BPM · ${fmtTime(s.duration)}`;
  };
  form.genre.addEventListener('change', () => { update(); if (Player.current === 'preview') previewGen(); });
  genState.update = update;
  update();
}
function previewGen() {
  Player.preview({ title: $('#gen-form').title.value || 'Черновик', genre: genState.genre, seed: genState.seed, kind: 'synth', artistId: Store.me().id });
}

// ---------- События ----------
function queueFrom(el) {
  const q = el.closest('[data-queue]');
  return q ? q.dataset.queue.split(',').filter(Boolean) : null;
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const id = el.dataset.id;
  const action = el.dataset.action;
  switch (action) {
    case 'play':
      e.preventDefault();
      Player.toggle(id, queueFrom(el));
      break;
    case 'seek': {
      const rect = el.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      if (Player.current !== id) await Player.play(id, queueFrom(el));
      if (Player.current === id) Player.seek(frac * Player.duration);
      break;
    }
    case 'pl-toggle': Player.toggle(); break;
    case 'pl-next': Player.next(); break;
    case 'pl-prev': Player.prev(); break;
    case 'play-all': {
      const q = $('.tab-content [data-queue]');
      if (q) { const ids = q.dataset.queue.split(','); Player.play(ids[0], ids); }
      break;
    }
    case 'like': {
      const liked = Store.toggleLike(id);
      UI.syncLikes(id);
      if (liked) {
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 400);
      }
      break;
    }
    case 'follow': {
      const now = Store.toggleFollow(id);
      UI.toast(now ? 'Вы подписались на ' + Store.user(id).username : 'Вы отписались');
      const inModal = el.closest('.modal');
      if (inModal) {
        el.outerHTML = followBtn(Store.user(id), true);
      } else render();
      break;
    }
    case 'followers': UI.modal('Подписчики', userList(Store.followers(id))); break;
    case 'following': UI.modal('Подписки', userList(Store.user(id).following.map(Store.user).filter(Boolean))); break;
    case 'likers': UI.modal('Отметки «Нравится»', userList(Store.likers(id))); break;
    case 'close-modal': UI.closeModal(); break;
    case 'demo-login': Store.loginDemo(id); location.hash = '#/'; render(); break;
    case 'logout':
      Player.pause();
      Store.logout();
      location.hash = '#/login';
      render();
      break;
    case 'reset':
      if (confirm('Удалить все аккаунты, треки и лайки в этом браузере и вернуть демо-данные?')) {
        Player.pause();
        Player.current = null;
        Player.backend = null;
        Player.updateBar();
        Store.reset();
        location.hash = '#/login';
        render();
      }
      break;
    case 'share-track':
    case 'share-profile': {
      const url = location.href.split('#')[0] + (action === 'share-track' ? '#/t/' + id : '#/u/' + Store.user(id).username);
      try { await navigator.clipboard.writeText(url); UI.toast('Ссылка скопирована'); } catch (err) { prompt('Ссылка:', url); }
      break;
    }
    case 'delete-track':
      if (confirm('Удалить трек? Лайки и комментарии тоже исчезнут.')) {
        if (Player.current === id) { Player.pause(); Player.current = null; Player.backend = null; Player.updateBar(); }
        Store.deleteTrack(id);
        UI.toast('Трек удалён');
        location.hash = '#/u/' + Store.me().username;
      }
      break;
    case 'delete-comment': Store.deleteComment(id); render(); break;
    case 'reroll':
      genState.seed = Math.floor(Math.random() * 2 ** 31);
      genState.update();
      if (Player.current === 'preview') previewGen();
      break;
    case 'preview':
      if (Player.current === 'preview' && Player.playing) Player.pause();
      else previewGen();
      break;
    case 'remove-avatar':
      Store.updateProfile({ avatar: null });
      render();
      break;
  }
});

document.addEventListener('submit', async (e) => {
  const f = e.target;
  e.preventDefault();
  try {
    switch (f.id) {
      case 'login-form':
        Store.login(f.username.value, f.password.value);
        location.hash = '#/';
        render();
        break;
      case 'register-form':
        Store.register({ username: f.username.value, name: f.name.value, password: f.password.value });
        UI.toast('Добро пожаловать на Волну!');
        location.hash = '#/';
        render();
        break;
      case 'search-form':
        location.hash = '#/explore?q=' + encodeURIComponent(f.q.value.trim());
        break;
      case 'comment-form': {
        const text = f.text.value.trim();
        if (!text) return;
        Store.addComment(f.dataset.id, text);
        render();
        $('#comment-form input').focus();
        break;
      }
      case 'gen-form': {
        const t = Store.addTrack({ title: f.title.value.trim(), description: f.description.value.trim(), genre: genState.genre, seed: genState.seed, kind: 'synth' });
        if (!t) return;
        if (Player.current === 'preview') { Player.pause(); Player.current = null; Player.backend = null; }
        UI.toast('Трек опубликован');
        location.hash = '#/t/' + t.id;
        Player.play(t.id, [t.id]);
        break;
      }
      case 'file-form': {
        const file = f.audio.files[0];
        if (!file) throw new Error('Выберите аудиофайл');
        const btn = $('#file-submit');
        btn.disabled = true;
        btn.textContent = 'Обрабатываем…';
        try {
          let meta = { duration: 0, peaks: null };
          try { meta = await analyzeAudio(file); } catch (err) { /* без волны — не страшно */ }
          const coverImg = f.cover.files[0] ? await readImage(f.cover.files[0], 400) : null;
          const t = Store.addTrack({
            title: f.title.value.trim(), description: f.description.value.trim(), genre: f.genre.value,
            seed: Math.floor(Math.random() * 2 ** 31), kind: 'file', cover: coverImg, duration: meta.duration, peaks: meta.peaks,
          });
          if (!t) return;
          try {
            await Store.putFile('audio:' + t.id, file);
          } catch (err) {
            Store.deleteTrack(t.id);
            throw new Error('Не удалось сохранить файл в браузере');
          }
          UI.toast('Трек опубликован');
          location.hash = '#/t/' + t.id;
        } finally {
          btn.disabled = false;
          btn.textContent = 'Опубликовать';
        }
        break;
      }
      case 'profile-form': {
        Store.updateProfile({ name: f.name.value.trim() || f.username.value.trim(), username: f.username.value, bio: f.bio.value.trim(), privateLikes: f.privateLikes.checked });
        UI.toast('Профиль сохранён');
        location.hash = '#/u/' + Store.me().username;
        break;
      }
    }
  } catch (err) {
    UI.toast(err.message);
  }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.name === 'audio' && el.files[0]) {
    $('#drop-label').textContent = el.files[0].name;
    const title = el.form.title;
    if (!title.value) title.value = el.files[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  }
  if (el.name === 'avatar' && el.files[0]) {
    try {
      Store.updateProfile({ avatar: await readImage(el.files[0], 256) });
      $('#avatar-preview').innerHTML = avatar(Store.me(), 72);
      $$('.nav-avatar').forEach((n) => { n.innerHTML = avatar(Store.me(), 26); });
      UI.toast('Фото обновлено');
    } catch (err) { UI.toast(err.message); }
  }
  if (el.id === 'pl-volume') Player.setVolume(+el.value);
});

$('#pl-progress').addEventListener('click', (e) => {
  if (!Player.current) return;
  const rect = e.currentTarget.getBoundingClientRect();
  Player.seek(((e.clientX - rect.left) / rect.width) * Player.duration);
});
$('#pl-volume').addEventListener('input', (e) => Player.setVolume(+e.target.value));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') UI.closeModal();
  if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) && Player.current) {
    e.preventDefault();
    Player.toggle();
  }
});

window.addEventListener('hashchange', render);

// ---------- Старт ----------
Store.load();
{
  const v = parseFloat(localStorage.getItem('volna_volume'));
  const vol = isNaN(v) ? 0.8 : v;
  $('#pl-volume').value = vol;
  Player.setVolume(vol);
}
render();

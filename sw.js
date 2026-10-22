// Offline support: app shell is precached, sprites are cache-first, map tiles fall back to cache when offline.
const VERSION = 'v3';
const SHELL = `pgo-shell-${VERSION}`;
const SPRITES = 'pgo-sprites';
const TILES = 'pgo-tiles';
const SHELL_FILES = [
  './', './index.html', './style.css', './data.js', './game.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
];
const MAX_TILES = 1500;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pgo-shell-') && k !== SHELL).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => c.delete(k)));
}

async function cacheFirst(req, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) c.put(req, res.clone());
  return res;
}

async function networkFirst(req, cacheName) {
  const c = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) { c.put(req, res.clone()); if (cacheName === TILES && Math.random() < 0.05) trim(TILES, MAX_TILES); }
    return res;
  } catch (err) {
    const hit = await c.match(req);
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'raw.githubusercontent.com') return e.respondWith(cacheFirst(req, SPRITES));
  if (url.hostname === 'tiles.openfreemap.org') return e.respondWith(networkFirst(req, TILES));
  if (url.hostname === 'api.open-meteo.com') return;
  // Own files: always try the network first so updates show up immediately
  if (url.origin === self.location.origin) return e.respondWith(networkFirst(req, SHELL));
  if (url.hostname === 'unpkg.com' || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    return e.respondWith(staleWhileRevalidate(req, SHELL));
  }
});

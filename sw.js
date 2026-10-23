// No offline mode: the game always needs internet. This worker only exists so the game can be installed as an app,
// and it clears any caches left by older versions.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});

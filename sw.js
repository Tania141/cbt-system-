// CBT Консулт — Service Worker v1.0
const CACHE_NAME = 'cbt-v1';
const ASSETS = [
  '/cbt-system-/',
  '/cbt-system-/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Само за навигация — иначе винаги от мрежата
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/cbt-system-/index.html')
      )
    );
  }
});

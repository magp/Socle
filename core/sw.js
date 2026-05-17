const CACHE_VERSION = '%%CACHE_VERSION%%';
const ASSETS = %%ASSETS%%;
const BASE_PATH = '%%BASE_PATH%%';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE_PATH).then(r => r ?? fetch(BASE_PATH))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(r => r ?? fetch(event.request))
  );
});

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

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // version.json — always network, never cache (update detection depends on freshness)
  if (event.request.url.endsWith('/version.json')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE_PATH).then(r => r ?? fetch(BASE_PATH))
    );
    return;
  }

  // Cache-first with runtime caching: on first fetch, store in cache for offline use
  event.respondWith(
    caches.match(event.request).then(r => {
      if (r) return r;
      return fetch(event.request).then(response => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const toCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, toCache));
        }
        return response;
      });
    })
  );
});

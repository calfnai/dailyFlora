const CACHE_PREFIX = 'dailyflora-gesture-assets-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;

self.addEventListener('install', () => {
  // Cache assets only when MediaPipe requests them; preloading every WASM
  // variant adds roughly 40 MB to startup.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))
    )),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.pathname.match(/gesture_recognizer\.task|vision_wasm_/)) return;
  url.pathname = url.pathname.replace(/\/{2,}/g, '/');
  const normalizedRequest = new Request(url.toString(), request);
  event.respondWith(
    caches.match(normalizedRequest).then((cached) => cached || fetch(normalizedRequest).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(normalizedRequest, copy));
      }
      return response;
    }))
  );
});

const CACHE_NAME = 'dailyflora-gesture-assets-v1';
const CACHED_ASSETS = [
  './models/gesture_recognizer.task',
  './mediapipe/wasm/vision_wasm_internal.js',
  './mediapipe/wasm/vision_wasm_internal.wasm',
  './mediapipe/wasm/vision_wasm_module_internal.js',
  './mediapipe/wasm/vision_wasm_module_internal.wasm',
  './mediapipe/wasm/vision_wasm_nosimd_internal.js',
  './mediapipe/wasm/vision_wasm_nosimd_internal.wasm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_ASSETS).catch(() => undefined)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.pathname.match(/gesture_recognizer\.task|vision_wasm_/)) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }))
  );
});

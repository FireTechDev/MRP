const CACHE_NAME = 'mrp-cache-v1';
const urlsToCache = [
  '/MRP/',
  '/MRP/index.html',
  '/MRP/manifest.json',
  '/MRP/icons/icon-192x192.png',
  '/MRP/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 
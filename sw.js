// Legacy bridge: the pre-refactor app parses APP_VERSION from sw.js and relies on
// registration.update() to move to a newer worker. Keep these constants here so
// already-installed iOS PWAs can detect the transition build and adopt it.
const APP_VERSION = '1.0.22';
const APP_BUILD = '06/03/2026 - 23h57';
const SW_VERSION = new URL(self.location.href).searchParams.get('v') || `${APP_VERSION}-${APP_BUILD}`;
const CACHE_PREFIX = 'mrp-';
const STATIC_CACHE = `${CACHE_PREFIX}static-${SW_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${SW_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}api-${SW_VERSION}`;
const EXTERNAL_CACHE = `${CACHE_PREFIX}external-${SW_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './version.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './icons/192.png',
  './icons/512.png',
  './icons/firetruck.svg',
  './icons/material-icons.woff2',
];

const API_HOSTS = new Set([
  'nominatim.openstreetmap.org',
]);

const EXTERNAL_ASSET_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
]);

function isSupportedProtocol(url) {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isCacheableResponse(response) {
  return !!response && (response.status === 200 || response.type === 'opaque');
}

async function safeCachePut(cache, request, response) {
  try {
    const requestUrl = new URL(request.url);
    if (!isSupportedProtocol(requestUrl)) return;
    await cache.put(request, response);
  } catch (_) {
    // Ignore cache write failures.
  }
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await safeCachePut(cache, request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  throw new Error('Network unavailable');
}

async function networkFirst(request, cacheName, timeoutMs = 9000) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetchWithTimeout(request, timeoutMs);

    if (response.status === 429 || response.status >= 500) {
      const cached = await cache.match(request);
      if (cached) return cached;
      return response;
    }

    if (isCacheableResponse(response)) {
      await safeCachePut(cache, request, response.clone());
    }

    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Network unavailable');
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );

  // Immediate activation keeps legacy clients from being stranded with the old
  // service worker when they trigger registration.update() from cached code.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && ![
            STATIC_CACHE,
            RUNTIME_CACHE,
            API_CACHE,
            EXTERNAL_CACHE,
          ].includes(name))
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();

      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      clients.forEach((client) => {
        client.postMessage({
          type: 'MRP_SW_OFFLINE_READY',
          version: SW_VERSION,
        });
      });
    })()
  );
});

self.addEventListener('message', (event) => {
  const type = event?.data?.type;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CHECK_FOR_UPDATE') {
    self.registration.update().catch(() => {});
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSupportedProtocol(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetchWithTimeout(request, 9000);
          if (isCacheableResponse(response)) {
            const runtimeCache = await caches.open(RUNTIME_CACHE);
            await safeCachePut(runtimeCache, request, response.clone());
          }
          return response;
        } catch (_) {
          const runtimeCache = await caches.open(RUNTIME_CACHE);
          const pageFromRuntime = await runtimeCache.match(request);
          if (pageFromRuntime) return pageFromRuntime;

          const staticCache = await caches.open(STATIC_CACHE);
          const shell = await staticCache.match('./index.html');
          if (shell) return shell;

          return new Response('Application hors ligne.', {
            status: 503,
            statusText: 'Offline',
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }
      })()
    );
    return;
  }

  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(
      networkFirst(request, RUNTIME_CACHE, 5000).catch(
        () => new Response('', { status: 504, statusText: 'Gateway Timeout' })
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      staleWhileRevalidate(request, RUNTIME_CACHE).catch(async () => {
        const staticCache = await caches.open(STATIC_CACHE);
        const fallback = await staticCache.match(request);
        if (fallback) return fallback;
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      })
    );
    return;
  }

  if (API_HOSTS.has(url.hostname)) {
    event.respondWith(
      networkFirst(request, API_CACHE, 15000).catch(
        () => new Response('', { status: 504, statusText: 'Gateway Timeout' })
      )
    );
    return;
  }

  if (EXTERNAL_ASSET_HOSTS.has(url.hostname) || ['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      staleWhileRevalidate(request, EXTERNAL_CACHE).catch(
        () => new Response('', { status: 504, statusText: 'Gateway Timeout' })
      )
    );
  }
});

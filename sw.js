// Version de l'application
const APP_VERSION = '1.0.20';

const CACHE_NAME = 'mrp-cache-v6';
const urlsToCache = [
  '/MRP/',
  '/MRP/index.html',
  '/MRP/styles.css',
  '/MRP/script.js',
  '/MRP/manifest.json',
  '/MRP/icon-192x192.png',
  '/MRP/icon-512x512.png',
  '/MRP/sw.js'
];

// Ressources externes optionnelles (seront mises en cache si disponibles)
const optionalUrlsToCache = [
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Mettre en cache les ressources essentielles
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('Ressources essentielles mises en cache');
            // Essayer de mettre en cache les ressources externes (optionnelles)
            return Promise.allSettled(
              optionalUrlsToCache.map(url => 
                fetch(url)
                  .then(response => {
                    if (response.ok) {
                      return cache.put(url, response);
                    }
                  })
                  .catch(err => {
                    console.log('Ressource externe non disponible:', url, err);
                    // Ignorer les erreurs pour les ressources externes
                  })
              )
            );
          })
          .catch(error => {
            console.log('Erreur lors de la mise en cache initiale:', error);
            // Continuer même si certaines ressources n'ont pas pu être mises en cache
            // Les ressources seront mises en cache lors de leur première utilisation
          });
      })
  );
  // Forcer l'activation immédiate du nouveau service worker
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Forcer la prise de contrôle de tous les clients
      return self.clients.claim();
    })
  );
});

// Gestion des requêtes
self.addEventListener('fetch', event => {
  // Ignorer les requêtes de vérification de mise à jour
  if (event.request.url.includes('?v=')) {
    return;
  }

  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response immédiatement (Cache First)
        if (response) {
          return response;
        }

        // Pas dans le cache - essayer le réseau
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Vérifier que la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone la réponse pour la mettre en cache
            const responseToCache = response.clone();

            // Mettre en cache la réponse (en arrière-plan, ne pas bloquer)
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.log('Erreur lors de la mise en cache:', err);
              });

            return response;
          })
          .catch(error => {
            // Erreur réseau - essayer de retourner depuis le cache (même si déjà vérifié)
            console.log('Erreur réseau pour', event.request.url, error);
            
            // Essayer une dernière fois le cache (au cas où il y aurait une version)
            return caches.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Si vraiment rien dans le cache, retourner une réponse d'erreur pour les pages HTML
              if (event.request.destination === 'document' || event.request.mode === 'navigate') {
                return caches.match('/MRP/index.html').then(indexResponse => {
                  if (indexResponse) {
                    return indexResponse;
                  }
                  // Dernier recours : réponse d'erreur
                  return new Response('Application hors ligne. Veuillez vous reconnecter.', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                      'Content-Type': 'text/html'
                    })
                  });
                });
              }
              
              // Pour les autres ressources, retourner une réponse d'erreur
              throw error;
            });
          });
      })
      .catch(error => {
        console.error('Erreur dans le service worker:', error);
        // Dernier recours : essayer de retourner index.html
        if (event.request.destination === 'document' || event.request.mode === 'navigate') {
          return caches.match('/MRP/index.html');
        }
        throw error;
      })
  );
});

// Gestion des messages pour les mises à jour
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 
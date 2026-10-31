// Bump this version number every time you make changes to your files!
// e.g., change v86 to v87
const CACHE_NAME = 'mybudget-v557';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install Event - Cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clear out old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Advanced Caching Strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests (ignore POST, PUT, etc.)
  if (event.request.method !== 'GET') return;

  // 1. Network-First Strategy for HTML Navigation (Pages)
  // This ensures you always get the latest index.html when online
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Clone and update the cache with the fresh HTML
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If network fails (offline), fallback to cached index.html
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 2. Stale-While-Revalidate Strategy for Static Assets (CSS, JS, Fonts, Chart.js)
  // This serves from cache instantly for speed, but fetches network in the background to keep it updated
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // If valid response, update the cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silently fail background fetch if offline (we already served the cached version)
      });

      // Return cached version immediately, or wait for network if not in cache
      return cachedResponse || fetchPromise;
    })
  );
});
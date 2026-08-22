'use strict';

const CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `viaje-chiloe-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `viaje-chiloe-runtime-${CACHE_VERSION}`;

const APP_SHELL_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isMapOrRouteRequest(url) {
  return url.hostname.endsWith('tile.openstreetmap.org') || url.hostname === 'router.project-osrm.org';
}

// Estrategia: sirve de la caché al tiro si existe (rápido y funciona sin
// señal), y en paralelo pide la versión nueva a la red para la próxima vez.
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isMapOrRouteRequest(url)) {
    event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    return;
  }

  if (url.origin === self.location.origin || APP_SHELL_URLS.includes(event.request.url)) {
    event.respondWith(staleWhileRevalidate(event.request, APP_SHELL_CACHE));
  }
});

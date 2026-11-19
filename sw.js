// Service worker de Mariantonia.
// SUBIR LA VERSIÓN EN CADA DEPLOY: si no, los celulares siguen viendo la app vieja.
const CACHE = 'mariantonia-v14';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero: si hay internet se ve siempre la última versión;
// si no hay, se sirve la copia guardada.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // El backend nunca se cachea acá: la app tiene su propia copia del catálogo.
  if (e.request.url.indexOf('script.google.com') !== -1) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

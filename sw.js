const CACHE = 'biotrop-production-v2-24';
const CORE_ASSETS = [
  './app.html',
  './config.js',
  './assets/biotrop-logo.svg',
  './assets/js/biotrop-production-v2.js',
  './utilidades-tech.js'
];

async function appResponseWithTechLayer(request) {
  const response = await fetch(request, { cache: 'no-store' });
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const html = await response.text();
  const injected = html.replace('</body>', '<script src="./utilidades-tech.js?v=24"></script>\n</body>');
  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/app.html')) {
    event.respondWith((async () => {
      try {
        const response = await appResponseWithTechLayer(event.request);
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        return caches.match(event.request);
      }
    })());
    return;
  }

  if (url.pathname.endsWith('/config.js')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        return caches.match(event.request);
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

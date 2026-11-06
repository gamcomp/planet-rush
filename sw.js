// Planet Rush service worker: the game is one self-contained page, so caching it makes the game playable offline.
// v2: pages are revalidated with the server on every visit (GitHub Pages sends max-age=600, which delayed updates),
// and each page is cached under its own path (phone.html no longer overwrites index.html).
const CACHE = 'planet-rush-v2';
const CORE = ['./', './index.html', './phone.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// the cache key for a page: its path without the query (index.html?embed=1 and index.html share one copy)
const pageKey = url => { const u = new URL(url); u.search = ''; u.hash = ''; if (u.pathname.endsWith('/')) u.pathname += 'index.html'; return u.href; };
// pages: ask the server first ("no-cache" = revalidate, a cheap 304 when nothing changed), cache as the offline fallback;
// everything else (fonts, icons): cache first
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    const key = pageKey(req.url);
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return r;
    }).catch(() => caches.match(key).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if ((r.ok && r.type === 'basic') || /fonts\.(googleapis|gstatic)\.com/.test(req.url)) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});

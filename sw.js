// Кухарчата — офлайн-кеш: гра працює без інтернету після першого відкриття
const CACHE = 'kukharchata-v18';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/main.js', 'js/i18n.js', 'js/i18n-data.js', 'js/data.js', 'js/gen.js', 'js/decor.js', 'js/food.js', 'js/hats.js', 'js/style.js', 'js/uiicons.js', 'js/sim.js', 'js/calib.js', 'js/render.js', 'js/map.js', 'js/input.js', 'js/audio.js', 'js/net.js', 'js/icons.js',
  'vendor/three.module.min.js', 'vendor/peerjs.min.js', 'vendor/jsQR.js', 'vendor/qrcode.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// спершу мережа (щоб оновлення приходили), без мережі — кеш
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});

// Two strategies, on purpose.
//
// The app shell is served network first: a deploy should be live on the next
// load, not the one after. Bumping CACHE by hand was the only thing keeping
// changed markup and code from being served stale, and that step is easy to
// forget.
//
// Everything else, the level data and the artwork, never changes without its
// filename changing, so it is served cache first and revalidated behind the
// scenes.
const CACHE = 'thread-v12';

const SHELL = ['./', 'index.html', 'snip.html', 'loom.html', 'styles.css', 'logic.js', 'app.js', 'audio.js', 'toast.js', 'snip.js', 'loom.js', 'snip-app.js', 'nav.js', 'settings.js', 'loom-app.js', 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js', 'sync.js', 'config.js', 'manifest.webmanifest'];
const ASSETS = SHELL.concat(['boards.js', 'mascot.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png']);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

function isShell(request, url) {
  if (request.mode === 'navigate') return true;
  if (url.origin !== self.location.origin) return false;
  const here = new URL('./', self.location).pathname;
  const rest = url.pathname.startsWith(here) ? url.pathname.slice(here.length) : url.pathname;
  return SHELL.indexOf(rest) !== -1 || rest === '';
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (isShell(e.request, url)) {
    // network first, falling back to the last good copy when offline
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
    );
    return;
  }

  // cache first for the things that do not change in place
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

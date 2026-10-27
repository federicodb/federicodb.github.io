// Service worker di Orfini Math Quest: la Quest funziona anche senza connessione, dalla seconda visita.
// - File della Quest (stessa origine): prima la rete, la copia salvata solo se offline.
//   Così dopo un aggiornamento del sito non si mescolano mai moduli vecchi e nuovi.
// - Librerie su CDN con versione nell'indirizzo (KaTeX, Chart.js, JSXGraph, math.js, nerdamer): dalla cache,
//   perché a parità di indirizzo il contenuto non cambia.
// - Font di Google: dalla cache, aggiornati in background.
const CACHE = 'orfini-quest-v1';
const CORE = ['./', './index.html', './css/app.css', './js/main.js', './manifest.webmanifest', './icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('orfini-quest-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isVersionedCdn = (url) => url.hostname === 'cdn.jsdelivr.net' && /@\d+\.\d+\.\d+/.test(url.pathname);
const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // no-cache: il browser riconvalida col server (304 se invariato) invece di usare la sua cache HTTP,
    // che altrimenti poteva dare un modulo vecchio accanto a uno nuovo (import mancante → pagina bianca).
    // Le navigazioni non accettano opzioni su una Request esistente: restano come sono.
    const res = await (req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' }));
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const update = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || update;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // solo i file della Quest: il resto del sito (giochi, catalogo) non passa di qui
    if (url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) e.respondWith(networkFirst(req));
    return;
  }
  if (isVersionedCdn(url)) e.respondWith(cacheFirst(req));
  else if (isFont(url)) e.respondWith(staleWhileRevalidate(req));
});

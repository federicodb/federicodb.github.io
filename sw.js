// Service worker del sito (catalogo, app, Journal, Mappa): ciò che si è aperto almeno una volta funziona anche senza rete.
// Stessa strategia della Quest (allenamento/sw.js), che ha il suo service worker e non passa di qui:
// - file del sito: prima la rete (con la connessione si vede sempre la versione aggiornata), la copia solo se offline;
// - librerie su CDN con la versione nell'indirizzo: dalla cache, perché a parità di indirizzo non cambiano;
// - font e altre risorse esterne: dalla cache, aggiornate in background.
// Per svuotare le copie sui dispositivi basta cambiare CACHE (es. 'orfini-sito-v2').
const CACHE = 'orfini-sito-v1';
const QUEST = '/allenamento/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('orfini-sito-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const VERSIONATI = /^(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)$/;
const isVersioned = (url) => (VERSIONATI.test(url.hostname) && /@\d+\.\d+\.\d+/.test(url.pathname))
  || (url.hostname === 'cdnjs.cloudflare.com' && /\/\d+\.\d+\.\d+\//.test(url.pathname))
  || (url.hostname === 'cdn.tailwindcss.com' && /^\/\d+\.\d+\.\d+/.test(url.pathname));

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await (req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' }));
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('/index.html')) || Response.error();
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
    if (url.pathname.startsWith(QUEST)) return; // la Quest ha il suo service worker
    e.respondWith(networkFirst(req));
  } else if (isVersioned(url)) {
    e.respondWith(cacheFirst(req));
  } else if (url.protocol === 'https:') {
    e.respondWith(staleWhileRevalidate(req));
  }
});

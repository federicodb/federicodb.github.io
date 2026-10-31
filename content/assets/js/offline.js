// Registra il service worker del sito (/sw.js): dalla seconda visita catalogo, app e Journal funzionano anche offline.
// Basta una pagina: poi il service worker vale per tutto il sito. Solo su https o in locale.
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(location.hostname)) return;
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
})();

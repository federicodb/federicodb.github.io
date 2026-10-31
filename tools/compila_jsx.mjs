// Traduce in anticipo il JSX delle app React (prima tradotto nel browser da Babel a ogni apertura, ~3 MB in più).
// L'app resta un file solo: il sorgente JSX rimane dentro, in <script type="text/x-jsx-sorgente" id="jsx-sorgente">
// (il browser non lo esegue), e subito dopo c'è il codice tradotto, con l'impronta del sorgente da cui viene.
//
// Uso:  node tools/compila_jsx.mjs                 (tutte le app con JSX)
//       node tools/compila_jsx.mjs content/apps/x.html
// Si modifica sempre il sorgente, poi si rilancia: build.py avvisa se sorgente e traduzione non corrispondono.
// Stesse impostazioni di Babel nel browser (@babel/standalone 8.0.10, script non-module): react classico + env.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const Babel = require('@babel/standalone');

const BABEL_TAG = /\s*<script\s+src="https:\/\/unpkg\.com\/@babel\/standalone@[\d.]+\/babel\.min\.js"><\/script>\n?/;
const IN_BROWSER = /<script type="text\/babel">\n?([\s\S]*?)<\/script>/;
const SORGENTE = /<script type="text\/x-jsx-sorgente" id="jsx-sorgente">\n?([\s\S]*?)<\/script>\s*<script data-jsx-compilato="[0-9a-f]+">[\s\S]*?<\/script>/;

export const impronta = (sorgente) => createHash('sha1').update(sorgente).digest('hex').slice(0, 12);

function traduci(sorgente, file) {
  return Babel.transform(sorgente, {
    filename: file,
    presets: [['react', { runtime: 'classic' }], 'env'],
    targets: { browsers: undefined },
  }).code;
}

function blocco(sorgente, file) {
  const codice = traduci(sorgente, file).replaceAll('</script', '<\\/script');
  return `<script type="text/x-jsx-sorgente" id="jsx-sorgente">\n${sorgente}</script>\n`
    + `    <script data-jsx-compilato="${impronta(sorgente)}">\n`
    + `// Tradotto da tools/compila_jsx.mjs dal sorgente qui sopra: non modificare, modifica il sorgente e rilancia.\n`
    // parte a pagina caricata, come faceva Babel: prima vengono gli script condivisi (es. tema scuro di orfini-shared.js)
    + `document.addEventListener('DOMContentLoaded', function () {\n${codice}\n});\n</script>`;
}

function compila(file) {
  let html = readFileSync(file, 'utf8');
  let m = html.match(SORGENTE), sorgente;
  if (m) sorgente = m[1];
  else if ((m = html.match(IN_BROWSER))) sorgente = m[1];
  else return false;
  html = html.replace(m[0], () => blocco(sorgente, file)).replace(BABEL_TAG, '\n');
  writeFileSync(file, html);
  return true;
}

const args = process.argv.slice(2);
const files = args.length ? args : readdirSync('content/apps').filter((f) => f.endsWith('.html')).map((f) => join('content/apps', f));
let n = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (!IN_BROWSER.test(html) && !SORGENTE.test(html)) continue;
  compila(f);
  console.log(`  ✓ ${f}`);
  n++;
}
console.log(`JSX tradotto in ${n} app`);

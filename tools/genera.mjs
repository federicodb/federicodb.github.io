#!/usr/bin/env node
// Genera le parti del sito che dipendono dai dati:
//   1. il menu (tools/parti/menu.html) in tutte le pagine che hanno i marcatori MENU_START / MENU_END;
//   2. la vista elenco della home, in index.html tra ELENCO_START / ELENCO_END: HTML vero, leggibile senza JavaScript;
//   3. il vocabolario per la ricerca, in index.html tra VOCABOLARIO_START / VOCABOLARIO_END.
// Legge data/attivita.json (scritto da build.py) e data/vocabolario.json (scritto a mano).
// Uso: node tools/genera.mjs     Non usa la rete, non ha dipendenze, dà sempre lo stesso risultato.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (f) => readFileSync(join(ROOT, f), 'utf8');
const katex = createRequire(import.meta.url)(join(ROOT, 'content/assets/vendor/katex/katex.min.js'));

const attivita = JSON.parse(leggi('data/attivita.json'));
const vocabolario = JSON.parse(leggi('data/vocabolario.json'));
const parole = new Map(vocabolario.map((p) => [p.id, p]));

// ---------- pagine con il menu: file -> voce attiva ----------
const PAGINE_MENU = {
  'index.html': 'esplora',
  'verifiche.html': 'archivio',
  'calcolo-mentale.html': 'calcolo',
  'competenze.html': 'competenze',
  'scuola.html': 'scuola',
};

const SEZIONI = [
  { id: 'attivita', nome: 'Attività', frase: 'Giochi, simulazioni e laboratori da aprire subito.', vai: null },
  { id: 'allenati', nome: 'Allenati', frase: 'Lezioni a piccoli passi della Quest, con numeri sempre nuovi.', vai: ['allenamento/', 'Apri la Quest'] },
  { id: 'journal', nome: 'Journal', frase: 'Il diario di bordo: come nascono le attività e come vanno in classe.', vai: ['journal/', 'Tutte le note'] },
  { id: 'archivio', nome: 'Archivio', frase: 'Le verifiche già svolte, per mettersi alla prova su carta.', vai: ['verifiche.html', 'Apri l\'archivio'] },
];
const TIPI = {
  arcade: 'Arcade', simulazione: 'Simulazione', memory: 'Memory', immagine: 'Immagine', infografica: 'Infografica',
  video: 'Video', app: 'Esplorazione', lezione: 'Lezione', nota: 'Nota', verifica: 'Verifica',
};
// forma della sezione: la stessa che avranno le stelle della costellazione (il colore non è mai l'unica informazione)
const FORME = {
  attivita: '<circle cx="8" cy="8" r="6"/>',
  allenati: '<path d="M8 1.5 15 14H1z"/>',
  journal: '<path d="M8 1 15 8 8 15 1 8z"/>',
  archivio: '<rect x="2" y="2" width="12" height="12" rx="1.5"/>',
};
const forma = (sezione) => `<svg class="forma" viewBox="0 0 16 16" aria-hidden="true">${FORME[sezione]}</svg>`;

// ---------- testo ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Testo con formule $…$: le formule diventano MathML (si disegnano da sole, senza fogli di stile né script) */
function conFormule(testo) {
  return String(testo).split(/(\$[^$\n]+\$)/).map((pezzo) => {
    if (!/^\$[^$\n]+\$$/.test(pezzo)) return esc(pezzo);
    const tex = pezzo.slice(1, -1);
    const html = katex.renderToString(tex, { output: 'mathml', throwOnError: true });
    return html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/, '').replace(/<\/?semantics>/g, '');
  }).join('');
}
const href = (url) => (/^https?:/.test(url) ? url : url.split('/').map((p) => p.split('#').map((q, i) => (i ? q : encodeURIComponent(q))).join('#')).join('/'));
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const dataIt = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${MESI[+m[2] - 1]} ${m[1]}` : ''; };

// ---------- conteggi: un padre conta anche le attività delle figlie ----------
const conta = new Map(vocabolario.map((p) => [p.id, new Set()]));
for (const a of attivita) for (const p of a.parole) { conta.get(p)?.add(a.id); const padre = parole.get(p)?.padre; if (padre) conta.get(padre)?.add(a.id); }

// ---------- 1. menu ----------
function sostituisci(html, nome, contenuto, file) {
  const re = new RegExp(`([ \\t]*)<!-- ${nome}_START -->[\\s\\S]*?<!-- ${nome}_END -->`);
  if (!re.test(html)) throw new Error(`${file}: mancano i marcatori <!-- ${nome}_START --> e <!-- ${nome}_END -->`);
  return html.replace(re, (_, rientro) => `${rientro}<!-- ${nome}_START -->\n${contenuto.replace(/^(?=.)/gm, rientro)}\n${rientro}<!-- ${nome}_END -->`);
}
export function menuPer(voce) {
  const menu = leggi('tools/parti/menu.html').trimEnd();
  return voce ? menu.replace(`data-voce="${voce}"`, `data-voce="${voce}" aria-current="page"`) : menu;
}

// ---------- 2. elenco ----------
function scheda(a, i) {
  const esterno = /^https?:/.test(a.url);
  const conImmagine = a.miniatura && (a.sezione === 'attivita' || a.sezione === 'journal');
  const immagine = conImmagine
    ? `<img class="card-img" src="${href(a.miniatura)}" alt="" width="600" height="338" loading="lazy" decoding="async">`
    : '';
  const quando = a.sezione === 'journal' && a.data ? ` · <time datetime="${esc(a.data)}">${dataIt(a.data)}</time>` : '';
  const chips = a.parole.map((id) => `<li><a href="?parola=${id}" data-parola="${id}">${esc(parole.get(id)?.nomeCompleto ?? id)}</a></li>`).join('');
  return `<li class="card${conImmagine ? ' con-img' : ''}" data-sezione="${a.sezione}" data-tipo="${a.tipo}" data-parole="${a.parole.join(' ')}">
    <a class="card-link" href="${esc(href(a.url))}"${esterno ? ' target="_blank" rel="noopener"' : ''}>
        ${immagine}<span class="card-tipo">${forma(a.sezione)}${TIPI[a.tipo]}${quando}${esterno ? ' · sito esterno' : ''}</span>
        <h3 class="card-titolo">${conFormule(a.titolo)}</h3>
        <p class="card-desc">${conFormule(a.descrizione)}</p>
    </a>
    <ul class="card-parole" aria-label="Parole chiave">${chips}</ul>
</li>`;
}

function elenco() {
  const perSezione = (id) => {
    const voci = attivita.filter((a) => a.sezione === id);
    // il Journal si legge dal più recente
    return id === 'journal' ? [...voci].sort((x, y) => (y.data || '').localeCompare(x.data || '')) : voci;
  };
  const filtriSezione = [`<a class="filtro" href="./" data-sezione="" aria-current="true">Tutto <span>${attivita.length}</span></a>`]
    .concat(SEZIONI.map((s) => `<a class="filtro" href="?sezione=${s.id}" data-sezione="${s.id}">${forma(s.id)}${s.nome} <span>${perSezione(s.id).length}</span></a>`)).join('\n            ');

  const chip = (p, classe) => `<a class="parola ${classe}" href="?parola=${p.id}" data-parola="${p.id}" title="${esc(p.nomeCompleto)}: ${esc(p.descrizione)}">${esc(classe === 'figlia' ? p.etichetta : p.etichetta)} <span>${conta.get(p.id).size}</span></a>`;
  const gruppi = vocabolario.filter((p) => !p.padre).map((p) => {
    const figlie = vocabolario.filter((f) => f.padre === p.id);
    return figlie.length
      ? `<li class="famiglia">${chip(p, 'padre')}${figlie.map((f) => chip(f, 'figlia')).join('')}</li>`
      : `<li>${chip(p, 'sola')}</li>`;
  });
  // prima le famiglie (padre e figlie insieme), poi le parole sole
  const ordinati = [...gruppi.filter((g) => g.startsWith('<li class="famiglia"')), ...gruppi.filter((g) => !g.startsWith('<li class="famiglia"'))];

  const sezioni = SEZIONI.map((s) => {
    const voci = perSezione(s.id);
    return `<section class="sezione" data-sezione="${s.id}" aria-labelledby="sez-${s.id}">
    <header class="sezione-testa">
        <h2 id="sez-${s.id}">${forma(s.id)}${s.nome} <span class="sezione-n">${voci.length}</span></h2>
        <p>${s.frase}</p>
        ${s.vai ? `<a class="sezione-vai" href="${s.vai[0]}">${s.vai[1]}</a>` : ''}
    </header>
    <ul class="griglia">
${voci.map(scheda).join('\n')}
    </ul>
</section>`;
  }).join('\n');

  return `<div class="filtri" id="filtri">
    <nav class="filtri-sezione" aria-label="Sezioni">
            ${filtriSezione}
    </nav>
    <nav class="filtri-parole" id="filtri-parole" aria-label="Parole chiave">
        <ul>
${ordinati.join('\n')}
        </ul>
        <button type="button" id="tutte-le-parole" class="tutte-le-parole" aria-expanded="false" aria-controls="filtri-parole">Tutte le ${vocabolario.length} parole</button>
    </nav>
    <div class="filtri-stato">
        <p id="esito" role="status" aria-live="polite">${attivita.length} voci</p>
        <p id="suggerimento" hidden></p>
        <button type="button" id="raggruppa" class="interruttore" aria-pressed="true">Raggruppa per sezione</button>
        <a href="./" id="azzera" class="azzera" hidden>Azzera i filtri</a>
    </div>
</div>
<div id="main-grid" class="elenco raggruppato">
${sezioni}
    <p id="vuoto" class="vuoto" hidden>Nessun risultato. Prova con una delle parole chiave qui sopra, oppure <a href="./">azzera i filtri</a>.</p>
</div>`;
}

function vocabolarioPerRicerca() {
  const dati = vocabolario.map((p) => ({ id: p.id, e: p.etichetta, n: p.nomeCompleto, ...(p.padre ? { p: p.padre } : {}), a: p.alias }));
  return `<script type="application/json" id="om-vocabolario">${JSON.stringify(dati).replace(/</g, '\\u003c')}</script>`;
}

// ---------- scrittura ----------
function main() {
  let scritti = 0;
  for (const [file, voce] of Object.entries(PAGINE_MENU)) {
    if (!existsSync(join(ROOT, file))) throw new Error(`${file}: la pagina non esiste`);
    const prima = leggi(file);
    let dopo = sostituisci(prima, 'MENU', menuPer(voce), file);
    if (file === 'index.html') {
      dopo = sostituisci(dopo, 'ELENCO', elenco(), file);
      dopo = sostituisci(dopo, 'VOCABOLARIO', vocabolarioPerRicerca(), file);
    }
    if (dopo !== prima) { writeFileSync(join(ROOT, file), dopo); scritti++; }
  }
  console.log(`✓ Generato: menu in ${Object.keys(PAGINE_MENU).length} pagine, elenco con ${attivita.length} voci e ${vocabolario.length} parole (${scritti} file cambiati)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(`✗ Generazione fallita: ${e.message}`); process.exit(1); }
}

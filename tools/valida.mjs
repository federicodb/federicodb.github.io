#!/usr/bin/env node
// Validazione dei dati della costellazione: data/attivita.json e data/vocabolario.json.
// Uso: node tools/valida.mjs            (esce con 1 se trova errori: la pubblicazione si ferma)
//      node tools/valida.mjs --riepilogo (stampa anche quante attività ha ogni parola, per sezione)
//      node tools/valida.mjs --dati <cartella> (legge i due file da un'altra cartella: serve per le prove)
//      node tools/valida.mjs --senza-mappa (salta il confronto con data/mappa.json: lo usa il build prima di ricalcolarla)
// Non usa la rete: gli indirizzi esterni (https://…) sono controllati solo nella forma.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const iDati = process.argv.indexOf('--dati');
const DATI = iDati > 0 ? process.argv[iDati + 1] : join(ROOT, 'data');
const SEZIONI = ['attivita', 'allenati', 'journal', 'archivio'];
const TIPI = ['arcade', 'simulazione', 'memory', 'immagine', 'infografica', 'video', 'app', 'lezione', 'nota', 'verifica'];
const MIN_ATTIVITA = 2;        // una parola con una sola attività non diventa stella
const MAX_PAROLE_ETICHETTA = 2; // senza contare "e", "di", "a"…
// parole che in un'etichetta possono avere maiuscole: nomi propri e sigle
const MAIUSCOLE_AMMESSE = new Set(['Pitagora', 'Fibonacci', 'MCM', 'MCD', 'INVALSI', '3D']);
const CONNETTIVI = new Set(['e', 'di', 'a', 'da', 'in', 'del', 'della', 'dei', 'delle', 'al']);

const errori = [];
const errore = (msg) => errori.push(msg);
const leggi = (file) => {
  try { return JSON.parse(readFileSync(join(DATI, file), 'utf8')); } catch (e) { errore(`${file}: non si legge (${e.message})`); return []; }
};

/** minuscole, senza accenti né punteggiatura */
const norma = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9φπ]+/g, ' ').trim();
/** come norma, ma senza la vocale finale di ogni parola lunga: "frazione" e "frazioni" coincidono */
const radice = (s) => norma(s).split(' ').map((p) => (p.length >= 5 ? p.replace(/[aeiou]$/, '') : p)).join(' ');
function distanza(a, b) { // Levenshtein
  const r = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prec = r[0]; r[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = r[j];
      r[j] = Math.min(r[j] + 1, r[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1));
      prec = t;
    }
  }
  return r[b.length];
}

const vocabolario = leggi('vocabolario.json');
const attivita = leggi('attivita.json');

// ---------- vocabolario ----------
const parole = new Map();
for (const p of vocabolario) {
  const dove = `vocabolario «${p.id ?? '?'}»`;
  for (const campo of ['id', 'etichetta', 'nomeCompleto', 'descrizione']) {
    if (typeof p[campo] !== 'string' || !p[campo].trim()) errore(`${dove}: manca «${campo}»`);
  }
  if (!Array.isArray(p.alias)) errore(`${dove}: «alias» deve essere una lista (anche vuota)`);
  if (p.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) errore(`${dove}: l'id usa solo minuscole, cifre e trattini`);
  if (parole.has(p.id)) errore(`${dove}: id ripetuto`);
  if (p.descrizione && /\n/.test(p.descrizione)) errore(`${dove}: la descrizione è di una riga`);
  const piene = String(p.etichetta ?? '').split(/\s+/).filter((w) => !CONNETTIVI.has(w));
  if (piene.length > MAX_PAROLE_ETICHETTA) errore(`${dove}: etichetta «${p.etichetta}» troppo lunga (una o due parole)`);
  for (const w of String(p.etichetta ?? '').split(/\s+/)) {
    if (w !== w.toLowerCase() && !MAIUSCOLE_AMMESSE.has(w)) errore(`${dove}: «${w}» nell'etichetta va in minuscolo (i nomi propri si aggiungono a MAIUSCOLE_AMMESSE in tools/valida.mjs)`);
  }
  parole.set(p.id, p);
}
for (const p of vocabolario) {
  if (p.padre === undefined) continue;
  const padre = parole.get(p.padre);
  if (typeof p.padre !== 'string') errore(`vocabolario «${p.id}»: un solo padre, scritto come id`);
  else if (!padre) errore(`vocabolario «${p.id}»: il padre «${p.padre}» non è nel vocabolario`);
  else if (p.padre === p.id) errore(`vocabolario «${p.id}»: è padre di se stessa`);
  else if (padre.padre) errore(`vocabolario «${p.id}»: il padre «${p.padre}» è a sua volta un figlio (due livelli al massimo)`);
}

// forme di ogni parola: quelle canoniche (id, etichetta, nome completo) e gli alias
const canoniche = new Map(); // forma normalizzata -> id
const alias = new Map();     // forma normalizzata -> id
for (const p of vocabolario) {
  for (const f of [p.id, p.nomeCompleto]) canoniche.set(norma(f), p.id);
  for (const a of p.alias ?? []) {
    const n = norma(a);
    if (alias.has(n) && alias.get(n) !== p.id) errore(`alias «${a}»: è sia di «${alias.get(n)}» sia di «${p.id}»`);
    alias.set(n, p.id);
  }
}
for (const [n, id] of alias) {
  if (canoniche.has(n) && canoniche.get(n) !== id) errore(`alias «${n}» di «${id}»: è già la forma canonica di «${canoniche.get(n)}»`);
}

// quasi-duplicati: stesse parole a meno di singolare/plurale, oppure a una lettera di distanza
const forme = vocabolario.map((p) => ({ id: p.id, padre: p.padre, etichetta: p.etichetta, nomi: [...new Set([p.nomeCompleto, p.id.replace(/-/g, ' ')].map(radice))] }));
for (let i = 0; i < forme.length; i++) {
  for (let j = i + 1; j < forme.length; j++) {
    const a = forme[i]; const b = forme[j];
    const vicine = a.nomi.some((x) => b.nomi.some((y) => x === y || (Math.min(x.length, y.length) >= 6 && distanza(x, y) <= 1)));
    if (vicine) errore(`quasi-duplicati: «${a.id}» e «${b.id}» sono lo stesso concetto? Tienine una e metti l'altra tra gli alias`);
    // due stelle con la stessa etichetta si confondono sulla mappa, anche se hanno padri diversi
    if (norma(a.etichetta) === norma(b.etichetta)) errore(`etichetta ripetuta: «${a.etichetta}» per «${a.id}» e «${b.id}»`);
  }
}

// ---------- attività ----------
const conteggio = new Map(vocabolario.map((p) => [p.id, new Set()]));
const ids = new Set();
let lezioni = null;
const lezioniQuest = () => {
  lezioni ??= new Set(JSON.parse(readFileSync(join(ROOT, 'allenamento/catalogo.json'), 'utf8')).map((l) => l.id));
  return lezioni;
};

function controllaUrl(a, dove) {
  const url = a.url;
  if (/^https?:\/\//.test(url)) {
    try { new URL(url); } catch { errore(`${dove}: indirizzo esterno non valido «${url}»`); }
    return;
  }
  if (/^([a-z]+:|\/)/i.test(url)) return errore(`${dove}: «${url}» deve essere relativo alla radice del sito (senza / iniziale)`);
  const [percorso, ancora = ''] = url.split('#');
  let file;
  try { file = join(ROOT, decodeURIComponent(percorso)); } catch { return errore(`${dove}: indirizzo non valido «${url}»`); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return errore(`${dove}: l'indirizzo «${url}» non esiste nel sito`);
  const lezione = ancora.match(/^\/lezione\/([^/]+)/);
  if (percorso === 'allenamento/' && lezione && !lezioniQuest().has(lezione[1])) errore(`${dove}: la lezione «${lezione[1]}» non è nel catalogo della Quest`);
}

for (const a of attivita) {
  const dove = `attività «${a.id ?? a.titolo ?? '?'}»`;
  for (const campo of ['id', 'titolo', 'descrizione', 'url', 'sezione', 'tipo']) {
    if (typeof a[campo] !== 'string' || !a[campo].trim()) errore(`${dove}: manca «${campo}»`);
  }
  if (ids.has(a.id)) errore(`${dove}: id ripetuto`);
  ids.add(a.id);
  if (a.sezione && !SEZIONI.includes(a.sezione)) errore(`${dove}: sezione «${a.sezione}» sconosciuta (${SEZIONI.join(', ')})`);
  if (a.tipo && !TIPI.includes(a.tipo)) errore(`${dove}: tipo «${a.tipo}» sconosciuto (${TIPI.join(', ')})`);
  if (typeof a.url === 'string' && a.url) controllaUrl(a, dove);
  if (!Array.isArray(a.parole) || a.parole.length === 0) { errore(`${dove}: serve almeno una parola chiave`); continue; }
  if (new Set(a.parole).size !== a.parole.length) errore(`${dove}: parola ripetuta`);
  for (const parola of a.parole) {
    if (parole.has(parola)) { conteggio.get(parola).add(a.id); continue; }
    const n = norma(parola);
    if (alias.has(n)) errore(`${dove}: «${parola}» è un alias, la forma canonica è «${alias.get(n)}»`);
    else if (canoniche.has(n)) errore(`${dove}: «${parola}» si scrive con l'id «${canoniche.get(n)}»`);
    else {
      const vicina = [...parole.keys()].map((id) => [distanza(radice(parola), radice(id.replace(/-/g, ' '))), id]).sort((x, y) => x[0] - y[0])[0];
      errore(`${dove}: «${parola}» non è nel vocabolario${vicina && vicina[0] <= 3 ? ` (forse «${vicina[1]}»?)` : ''}`);
    }
  }
}

// un padre conta anche le attività dei figli
const totale = new Map([...conteggio].map(([id, s]) => [id, new Set(s)]));
for (const p of vocabolario) if (p.padre && totale.has(p.padre)) for (const a of conteggio.get(p.id)) totale.get(p.padre).add(a);
for (const p of vocabolario) {
  const n = totale.get(p.id).size;
  if (n === 0) errore(`vocabolario «${p.id}»: nessuna attività la usa`);
  else if (n < MIN_ATTIVITA) errore(`vocabolario «${p.id}»: una sola attività (${[...totale.get(p.id)][0]}). Non diventa una stella: spostala nel tema più vicino`);
}

// ---------- mappa: deve essere stata calcolata da questi dati ----------
if (!errori.length && !process.argv.includes('--senza-mappa') && iDati < 0) {
  try {
    const { impronta } = await import('./mappa.mjs');
    const mappa = JSON.parse(readFileSync(join(ROOT, 'data/mappa.json'), 'utf8'));
    if (mappa.impronta !== impronta(attivita, vocabolario)) errore('data/mappa.json non corrisponde più ai dati: lancia «npm run build» (oppure «node tools/mappa.mjs») e committa il file');
    const ids = new Set(mappa.parole.map((p) => p.id));
    for (const p of vocabolario) if (!ids.has(p.id)) errore(`data/mappa.json: manca la stella «${p.id}»`);
  } catch (e) { errore(`data/mappa.json: non si legge (${e.message})`); }
}

// ---------- esito ----------
if (process.argv.includes('--riepilogo')) {
  const perId = new Map(attivita.map((a) => [a.id, a]));
  console.log('attività  (att/all/jou/arc)  parola');
  for (const p of vocabolario) {
    const per = SEZIONI.map((s) => [...totale.get(p.id)].filter((id) => perId.get(id)?.sezione === s).length);
    console.log(`${String(totale.get(p.id).size).padStart(6)}    (${per.map((x) => String(x).padStart(2)).join(' / ')})   ${p.padre ? '  └ ' : ''}${p.nomeCompleto}`);
  }
  console.log('');
}
if (errori.length) {
  console.error(`✗ Validazione fallita: ${errori.length} ${errori.length === 1 ? 'errore' : 'errori'}`);
  for (const e of errori) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ Dati validi: ${attivita.length} attività, ${vocabolario.length} parole (${vocabolario.filter((p) => !p.padre).length} senza padre, ${vocabolario.filter((p) => p.padre).length} figlie)`);

#!/usr/bin/env node
// Disposizione della costellazione in tre dimensioni: la calcola una volta, durante il build, e la salva in data/mappa.json.
// La mappa è quindi identica a ogni visita e il browser non deve calcolare niente.
//   - sezioni: quattro nodi fissi;
//   - parole:  una stella per parola del vocabolario; raggio secondo il numero di attività (un padre conta anche le figlie),
//              sezione prevalente (colore e forma), quote per sezione;
//   - legami:  due parole sono unite se hanno attività in comune (peso = quante).
// Forze (d3-force-3d, la versione a tre dimensioni di d3-force; deterministico: stesso ingresso, stessa uscita): ogni parola è attirata verso le sue sezioni in
// proporzione alle attività, le figlie restano vicine al padre, le parole con attività in comune si avvicinano, nessuna si sovrappone.
// Uso: node tools/mappa.mjs            scrive data/mappa.json
//      node tools/mappa.mjs --stampa   scrive il risultato a video (per i test)
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (f) => JSON.parse(readFileSync(join(ROOT, f), 'utf8'));

// posizione delle sezioni: i vertici di un tetraedro schiacciato (x, y, z). La nebulosa è più larga che alta,
// così ruotando attorno all'asse verticale resta sempre leggibile.
export const ANCORE = { attivita: [-820, -300, 160], allenati: [820, -300, -160], journal: [-280, 300, 330], archivio: [280, 300, -330] };
const R_SEZIONE = 44;
const raggio = (n) => Math.round((9 + 4.6 * Math.sqrt(n)) * 10) / 10;

/** Impronta dei dati da cui dipende la mappa: tools/valida.mjs la confronta con quella salvata */
export function impronta(attivita, vocabolario) {
  const dati = [attivita.map((a) => [a.id, a.sezione, a.parole]), vocabolario.map((p) => [p.id, p.padre ?? null]), ANCORE];
  return createHash('sha256').update(JSON.stringify(dati)).digest('hex').slice(0, 16);
}

export async function calcola(attivita, vocabolario) {
  const { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY, forceZ } = await import('d3-force-3d');
  const sezioni = Object.keys(ANCORE);
  const perId = new Map(vocabolario.map((p) => [p.id, p]));

  // attività di ogni parola (un padre comprende le figlie)
  const voci = new Map(vocabolario.map((p) => [p.id, new Set()]));
  for (const a of attivita) for (const id of a.parole) { voci.get(id).add(a); const padre = perId.get(id).padre; if (padre) voci.get(padre).add(a); }

  const grandezza = Object.fromEntries(sezioni.map((s) => [s, attivita.filter((a) => a.sezione === s).length]));
  const stelle = vocabolario.map((p, i) => {
    const mie = [...voci.get(p.id)];
    const quote = Object.fromEntries(sezioni.map((s) => [s, mie.filter((a) => a.sezione === s).length]));
    const sezione = sezioni.reduce((m, s) => (quote[s] > quote[m] ? s : m), sezioni[0]); // a parità vince la prima
    // punto verso cui tende: baricentro delle sue sezioni, pesate per quanto la parola è tipica di ciascuna
    // (attività della parola in quella sezione / attività della sezione): così Journal e Archivio, più piccoli, non restano vuoti
    const peso = Object.fromEntries(sezioni.map((s) => [s, quote[s] / grandezza[s]]));
    const tot = sezioni.reduce((t, s) => t + peso[s], 0);
    const spinta = 1.35;
    const bx = spinta * sezioni.reduce((t, s) => t + ANCORE[s][0] * peso[s], 0) / tot;
    const by = spinta * sezioni.reduce((t, s) => t + ANCORE[s][1] * peso[s], 0) / tot;
    const bz = spinta * sezioni.reduce((t, s) => t + ANCORE[s][2] * peso[s], 0) / tot;
    const angolo = i * 2.399963; // partenza a spirale: niente caso
    return { id: p.id, padre: p.padre, n: mie.length, r: raggio(mie.length), sezione, quote, bx, by, bz,
      x: bx * 0.75 + Math.cos(angolo) * (40 + 9 * i), y: by * 0.75 + Math.sin(angolo) * (30 + 5 * i), z: bz * 0.75 + Math.sin(angolo * 1.7) * (40 + 9 * i) };
  });
  const nodoSezione = sezioni.map((s) => ({ id: `sezione:${s}`, fx: ANCORE[s][0], fy: ANCORE[s][1], fz: ANCORE[s][2], x: ANCORE[s][0], y: ANCORE[s][1], z: ANCORE[s][2], r: R_SEZIONE, fisso: true }));

  // legami tra parole: attività in comune (solo dirette, non quelle ereditate dal padre)
  const comuni = new Map();
  for (const a of attivita) {
    const ids = [...a.parole].sort();
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const k = `${ids[i]}|${ids[j]}`; comuni.set(k, (comuni.get(k) || 0) + 1); }
  }
  const indice = new Map(stelle.map((s, i) => [s.id, i]));
  const legami = [...comuni].map(([k, w]) => { const [a, b] = k.split('|'); return [indice.get(a), indice.get(b), w]; }).sort((x, y) => x[0] - y[0] || x[1] - y[1]);

  const affini = legami.map(([a, b, w]) => ({ source: stelle[a], target: stelle[b], distanza: 190 + stelle[a].r + stelle[b].r, forza: Math.min(0.1, 0.02 * w) }));
  const famiglie = stelle.filter((s) => s.padre).map((s) => { const p = stelle[indice.get(s.padre)]; return { source: s, target: p, distanza: s.r + p.r + 56 }; });
  const sim = forceSimulation([...nodoSezione, ...stelle], 3)
    .force('affini', forceLink(affini).distance((m) => m.distanza).strength((m) => m.forza))
    .force('famiglie', forceLink(famiglie).distance((m) => m.distanza).strength(1).iterations(8))
    .force('carica', forceManyBody().strength((n) => (n.fisso ? -900 : -420)).distanceMax(700))
    .force('urti', forceCollide().radius((n) => n.r + 40).iterations(4))
    .force('x', forceX((n) => (n.fisso ? n.fx : n.bx)).strength((n) => (n.fisso ? 0 : (n.padre ? 0.03 : 0.24))))
    .force('y', forceY((n) => (n.fisso ? n.fy : n.by)).strength((n) => (n.fisso ? 0 : (n.padre ? 0.03 : 0.26))))
    .force('z', forceZ((n) => (n.fisso ? n.fz : n.bz)).strength((n) => (n.fisso ? 0 : (n.padre ? 0.03 : 0.24))))
    .stop();
  for (let i = 0; i < 700; i++) sim.tick();

  const tondo = (v) => Math.round(v);
  return {
    impronta: impronta(attivita, vocabolario),
    sezioni: sezioni.map((s) => ({ id: s, x: ANCORE[s][0], y: ANCORE[s][1], z: ANCORE[s][2], r: R_SEZIONE, n: attivita.filter((a) => a.sezione === s).length })),
    parole: stelle.map((s) => ({ id: s.id, x: tondo(s.x), y: tondo(s.y), z: tondo(s.z), r: s.r, n: s.n, sezione: s.sezione, quote: s.quote })),
    legami,
  };
}

const scrivi = (m) => `{\n  "impronta": ${JSON.stringify(m.impronta)},\n  "sezioni": [\n${m.sezioni.map((s) => '    ' + JSON.stringify(s)).join(',\n')}\n  ],\n  "parole": [\n${m.parole.map((s) => '    ' + JSON.stringify(s)).join(',\n')}\n  ],\n  "legami": ${JSON.stringify(m.legami)}\n}\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const mappa = await calcola(leggi('data/attivita.json'), leggi('data/vocabolario.json'));
    if (process.argv.includes('--stampa')) process.stdout.write(scrivi(mappa));
    else {
      writeFileSync(join(ROOT, 'data/mappa.json'), scrivi(mappa));
      const largo = (c) => { const v = mappa.parole.map((p) => p[c]); return Math.round(Math.max(...v) - Math.min(...v)); };
      console.log(`✓ Mappa 3D: ${mappa.parole.length} stelle, ${mappa.legami.length} legami, ${largo('x')} × ${largo('y')} × ${largo('z')}`);
    }
  } catch (e) { console.error(`✗ Mappa non calcolata: ${e.message}`); process.exit(1); }
}

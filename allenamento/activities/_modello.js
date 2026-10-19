// MODELLO PER UNA NUOVA ATTIVITÀ — Orfini Math Quest
// 1. Copia questo file, ad esempio in activities/polinomi/divisione-ruffini.js
// 2. Cambia metadati e generatori
// 3. Importalo in activities/catalogo.js e aggiungilo all'area giusta
// 4. Controlla con:  npm test   (genera migliaia di lezioni e le verifica con nerdamer e math.js)
//
// REGOLA D'ORO: ogni funzione genera UN problema con numeri casuali ma sempre la stessa difficoltà.
// Si usa rng.until(genera, accetta) per scartare i casi troppo facili o troppo difficili
// e quelli che non si possono calcolare a mente (risultati "tondi", terne pitagoriche, angoli notevoli).
//
// CONTESTI: per i problemi "con le parole" usa  scene(rng, 'gruppo' | 'prezzo' | 'tariffa' | …)
// da activities/contesti.js: l'app sceglie da sola situazioni dell'indirizzo dello studente
// o della vita di tutti i giorni.
// GRAFICI: plane() mostra da solo intersezioni con gli assi e vertice; se la domanda chiede proprio
// quei valori usa  notable: false  (o ['x'] / ['y']) oppure  notableExcept: [x].
// RISPOSTE: lo studente può scrivere anche il calcolo impostato ("230/46", "20% di 150"): va bene così.

import { tx, frac, poly, par } from '../js/engine/helpers.js';
import { plane, polygon, numberLine, table, bars } from '../js/gfx/svg.js';

// --- Risposta numerica, con figura vettoriale e verifica simbolica ---
function esempioNumerico(rng) {
  const { a, b } = rng.until(() => ({ a: rng.int(3, 12), b: rng.int(3, 12) }), (v) => v.a !== v.b);
  return {
    type: 'number',                      // accetta 12 · 12,5 · 3/4 · √2 · "x = 12" · "12 cm" …
    fig: polygon({ pts: [[0, 0], [a, 0], [a, b], [0, b]], sides: [`${a} cm`, `${b} cm`], right: [0, 1, 2, 3] }),
    prompt: 'Qual è l\'area del rettangolo?',
    answer: a * b,
    unit: 'cm²',
    // decimals: 1,                      // se va arrotondato (tollera anche arrotondamenti intermedi)
    // alts: [valore con π = 3,14],      // altri valori accettati
    // reduced: true,                    // la frazione deve essere ridotta ai minimi termini
    traps: [{ value: 2 * (a + b), msg: 'Questo è il perimetro.' }], // errore tipico → messaggio mirato
    hint: 'Base per altezza.',
    explain: `$$A = ${a}\\cdot ${b} = ${a * b}\\ \\text{cm}^2$$`,
    cas: { eval: `${a}*${b}` },          // i test ricalcolano la risposta con math.js
    twin: () => esempioNumerico(rng),    // problema gemello dopo un errore
  };
}

// --- Più soluzioni (ordine libero) o coordinate (ordered: true) ---
function esempioSoluzioni(rng) {
  const p = rng.intNot(-6, 6), q = rng.intNot(-6, 6, [p]);
  return {
    type: 'numbers',                     // lo studente scrive "2; -3" oppure "2 e -3" oppure "x1 = 2; x2 = -3"
    prompt: `Risolvi $${poly([[1, 'x^2'], [-(p + q), 'x'], [p * q, '']])} = 0$`,
    answers: [p, q],
    explain: `Le soluzioni sono $${p}$ e $${q}$.`,
    explainFig: plane({ xmin: -8, xmax: 8, ymin: -10, ymax: 10, fns: [{ f: (x) => (x - p) * (x - q) }], points: [{ x: p, y: 0 }, { x: q, y: 0 }] }),
    cas: { solve: `x^2-(${p + q})*x+(${p * q})=0` }, // nerdamer risolve e confronta
    twin: () => esempioSoluzioni(rng),
  };
}

// --- Espressione (equivalenza algebrica) con controllo di forma ---
function esempioEspressione(rng) {
  const k = rng.int(2, 9);
  return {
    type: 'expr',
    prompt: `Sviluppa: $${k}(x + 1)$`,
    answer: `${k}x + ${k}`,
    // form: (albero) => null | 'messaggio'   // es. "togli le parentesi", "scrivi come unica potenza"
    traps: [{ expr: `${k}x + 1`, msg: `Il ${k} moltiplica anche l'1.` }],
    explain: `$$${k}(x+1) = ${k}x + ${k}$$`,
    cas: { given: `${k}*(x+1)` },        // nerdamer verifica che risposta e domanda coincidano
    twin: () => esempioEspressione(rng),
  };
}

// --- Vero/falso multiplo (formato INVALSI "scelta multipla complessa") ---
function esempioVeroFalso(rng) {
  const n = rng.int(11, 40);
  return {
    type: 'truefalse',
    prompt: `Il numero ${n}:`,
    statements: [
      { text: 'è pari', value: n % 2 === 0 },
      { text: 'è multiplo di 3', value: n % 3 === 0 },
      { text: 'è maggiore di 10', value: true },
    ],
    explain: `${n} ${n % 2 ? 'è dispari' : 'è pari'} e ${n % 3 ? 'non è' : 'è'} multiplo di 3.`,
    twin: () => esempioVeroFalso(rng),
  };
}

// --- Scelta multipla con grafico Chart.js (caricato solo quando serve) ---
function esempioGrafico(rng) {
  const v = [rng.int(2, 9), rng.int(2, 9), rng.int(10, 15)];
  return {
    type: 'choice',
    chart: { type: 'bar', alt: 'Voti', data: { labels: ['A', 'B', 'C'], datasets: [{ label: 'Voti', data: v, colorEach: true }] }, legend: false },
    fig: bars(['A', 'B', 'C'], v), figFallbackOnly: true, // se Chart.js non si carica
    prompt: 'Quale barra è la più alta?',
    options: [{ label: 'C', correct: true }, { label: 'A', why: 'Confronta le altezze.' }, { label: 'B', why: 'Confronta le altezze.' }],
    explain: `C vale ${v[2]}.`,
    twin: () => esempioGrafico(rng),
  };
}

export default {
  id: 'modello',                       // unico, senza spazi: è la chiave dei progressi salvati
  area: 'numeri',                      // numeri | polinomi | equazioni | rette | sistemi | geometria | dati | funzioni | invalsi
  years: [1, 2],                       // anni di corso consigliati
  mat: ['MAT_K1', 'MAT_A1'],           // codici della riforma (vedi MAT_LABELS in catalogo.js)
  ambito: 'Numeri',                    // ambito INVALSI
  title: 'Titolo dell\'attività',
  summary: 'Una riga che dice cosa si impara.',
  glyph: '∑',
  levels: [
    { name: 'Primo livello', desc: 'Cosa si fa qui' },
    { name: 'Secondo livello', desc: 'Cosa si fa qui' },
  ],
  generate(rng, level) {
    const intro = {
      type: 'learn',
      title: 'L\'idea',
      body: 'Testo introduttivo con formule: $a^2 + b^2$.',
      fig: numberLine({ min: -5, max: 5, marks: [{ x: 2 }], ranges: [{ from: 2, to: Infinity }] }),
      // board: { bbox: [-6, 6, 6, -6], build: (brd, JXG, colori) => { … } }, // lavagna JSXGraph interattiva
    };
    if (level === 1) return [intro, esempioNumerico(rng), esempioVeroFalso(rng), esempioGrafico(rng)];
    return [intro, esempioEspressione(rng), esempioSoluzioni(rng), esempioNumerico(rng)];
  },
};

void [tx, frac, par, table];

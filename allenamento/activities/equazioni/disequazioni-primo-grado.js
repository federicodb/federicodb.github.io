import { poly, frac, par } from '../../js/engine/helpers.js';
import { numberLine } from '../../js/gfx/svg.js';

const SYM = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' };
const FLIP = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };
const strict = (s) => s === '<' || s === '>';

/** Disegno della soluzione x (rel) k sulla retta dei numeri */
export function solutionLine(rel, k, label) {
  const right = rel === '>' || rel === '>=';
  return numberLine({
    min: Math.floor(k) - 5, max: Math.floor(k) + 5, width: 300,
    marks: [{ x: k, open: strict(rel), label: label ?? undefined }],
    ranges: [right ? { from: k, to: Infinity } : { from: -Infinity, to: k }],
    alt: `x ${rel} ${k}`,
  });
}

function gen(rng, neg) {
  return rng.until(() => {
    const a = neg ? rng.intNot(-6, -2) : rng.int(2, 7);
    const k = rng.intNot(-6, 6);
    const b = rng.intNot(-12, 12);
    const rel = rng.pick(['<', '<=', '>', '>=']);
    return { a, b, c: a * k + b, k, rel };
  }, (v) => v.c !== 0);
}

/** Risolvi: si chiede la soluzione come scelta tra quattro rappresentazioni grafiche */
function solveChoice(rng, neg) {
  const { a, b, c, k, rel } = gen(rng, neg);
  const sol = a < 0 ? FLIP[rel] : rel;
  const opts = [
    { rel: sol, k, correct: true },
    { rel: FLIP[sol], k, why: a < 0 ? `Hai diviso per ${a}, un numero negativo: il verso andava cambiato.` : 'Il verso è al contrario: dividendo per un numero positivo il verso resta lo stesso.' },
    { rel: strict(sol) ? sol + '=' : sol[0], k, why: strict(sol) ? `Il segno è stretto: $x = ${k}$ non è una soluzione, il pallino è vuoto.` : `Con $${SYM[sol]}$ anche $x = ${k}$ è soluzione: il pallino è pieno.` },
    { rel: sol, k: -k, why: 'Controlla il segno del valore di confine.' },
  ];
  return {
    type: 'choice',
    prompt: `Quale disegno rappresenta le soluzioni di $$${poly([[a, 'x'], [b, '']])} ${SYM[rel]} ${c}$$`,
    options: opts.map((o) => ({ label: `<span class="opt-fig">$x ${SYM[o.rel]} ${o.k}$${solutionLine(o.rel, o.k)}</span>`, correct: o.correct, why: o.why })),
    explain: `$$${poly([[a, 'x']])} ${SYM[rel]} ${c} ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${c - b}$$ $$x ${SYM[sol]} ${frac(c - b, a)}${a < 0 ? '\\quad\\text{(verso cambiato: diviso per un negativo)}' : ''}$$`,
    twin: () => solveChoice(rng, neg),
  };
}

/** Valore di confine + verso */
function boundary(rng, neg) {
  const { a, b, c, k, rel } = gen(rng, neg);
  return {
    type: 'number',
    cas: { solve: `${a}*x+(${b})=${c}` },
    prompt: `Risolvi $${poly([[a, 'x'], [b, '']])} ${SYM[rel]} ${c}$. Qual è il valore di confine della soluzione?`,
    answer: k,
    traps: [{ value: -k, msg: 'Controlla il segno quando sposti il termine noto.' }, { value: c - b, msg: `Hai isolato $${poly([[a, 'x']])}$: ora dividi per ${par(a)}.` }],
    hint: 'Si risolve come un\'equazione; il confine è il valore che renderebbe vera l\'uguaglianza.',
    explain: `$$${poly([[a, 'x']])} ${SYM[rel]} ${c - b} \\Rightarrow x ${SYM[a < 0 ? FLIP[rel] : rel]} ${k}$$`,
    twin: () => boundary(rng, neg),
  };
}

function isSolution(rng) {
  const { a, b, c, rel } = gen(rng, rng.chance(0.5));
  const x = rng.int(-8, 8);
  const lhs = a * x + b;
  const truth = { '<': lhs < c, '<=': lhs <= c, '>': lhs > c, '>=': lhs >= c }[rel];
  return {
    type: 'choice',
    prompt: `$x = ${x}$ è una soluzione di $${poly([[a, 'x'], [b, '']])} ${SYM[rel]} ${c}$?`,
    options: [
      { label: 'Sì', correct: truth, why: truth ? undefined : `Sostituendo: $${lhs} ${SYM[rel]} ${c}$ è falso.` },
      { label: 'No', correct: !truth, why: !truth ? undefined : `Sostituendo: $${lhs} ${SYM[rel]} ${c}$ è vero.` },
    ],
    fixedOrder: true,
    explain: `Sostituisco: $${a}\\cdot ${par(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${lhs}$. È vero che $${lhs} ${SYM[rel]} ${c}$? ${truth ? 'Sì' : 'No'}.`,
    twin: () => isSolution(rng),
  };
}

function system(rng) {
  const lo = rng.int(-5, 2), hi = lo + rng.int(2, 6);
  const a1 = rng.int(2, 5), b1 = rng.intNot(-9, 9);
  const a2 = rng.int(2, 5), b2 = rng.intNot(-9, 9);
  // x > lo  e  x <= hi
  const empty = rng.chance(0.25);
  const L = empty ? hi : lo, H = empty ? lo : hi;
  const right = empty ? `x \\le ${H}` : `${L} < x \\le ${H}`;
  return {
    type: 'choice',
    prompt: `Risolvi il sistema: $$\\begin{cases} ${poly([[a1, 'x'], [b1, '']])} > ${a1 * L + b1} \\\\ ${poly([[a2, 'x'], [b2, '']])} \\le ${a2 * H + b2} \\end{cases}$$`,
    options: [
      { label: empty ? 'Nessuna soluzione' : `$${L} < x \\le ${H}$`, correct: true },
      { label: empty ? `$${H} < x \\le ${L}$` : `$x > ${L}$`, why: 'Servono i valori che soddisfano entrambe le disequazioni: l\'intersezione.' },
      { label: empty ? `$x > ${L}$` : `$x \\le ${H}$`, why: 'Hai tenuto solo una delle due condizioni.' },
      { label: empty ? 'Tutti i numeri reali' : 'Nessuna soluzione', why: 'Disegna le due soluzioni sulla stessa retta e guarda dove si sovrappongono.' },
    ],
    fig: undefined,
    explain: `Prima: $x > ${L}$. Seconda: $x \\le ${H}$. ${empty ? `Nessun numero è insieme maggiore di ${L} e minore o uguale a ${H}: il sistema è impossibile.` : `Insieme: $${L} < x \\le ${H}$.`}`,
    explainFig: numberLine({ min: Math.min(L, H) - 3, max: Math.max(L, H) + 3, width: 300, marks: [{ x: L, open: true }, { x: H }], ranges: empty ? [] : [{ from: L, to: H }] }),
    twin: () => system(rng),
  };
  void right;
}

export default {
  id: 'disequazioni-1',
  area: 'equazioni',
  years: [1, 2],
  mat: ['MAT_A3', 'MAT_K1'],
  ambito: 'Relazioni e funzioni',
  title: 'Disequazioni di primo grado',
  summary: 'Quando la bilancia pende: soluzioni come intervalli.',
  glyph: 'x>?',
  levels: [
    { name: 'Come un\'equazione', desc: 'Coefficiente positivo' },
    { name: 'Il verso che cambia', desc: 'Dividere per un numero negativo' },
    { name: 'Sistemi', desc: 'Intersezione di soluzioni' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Infinite soluzioni, un disegno',
      body: 'Le soluzioni di $x > 2$ sono tutti i numeri a destra di 2, senza il 2: pallino vuoto. Con $x \\ge 2$ il 2 è compreso: pallino pieno. Attenzione: moltiplicando o dividendo per un numero negativo il verso si capovolge, perché $3 > 1$ ma $-3 < -1$.',
      fig: solutionLine('>', 2),
    };
    if (level === 1) return [learn, boundary(rng, false), solveChoice(rng, false), isSolution(rng), solveChoice(rng, false), boundary(rng, false)];
    if (level === 2) return [learn, solveChoice(rng, true), boundary(rng, true), isSolution(rng), solveChoice(rng, true), solveChoice(rng, true)];
    return [learn, system(rng), solveChoice(rng, true), system(rng), isSolution(rng), system(rng)];
  },
};

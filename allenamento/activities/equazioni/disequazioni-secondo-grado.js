import { poly } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

const SYM = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' };

function parabFig(a, p, q, rel) {
  const f = (x) => a * (x - p) * (x - q);
  const lo = Math.min(p, q), hi = Math.max(p, q);
  const xmin = lo - 3, xmax = hi + 3;
  const yv = f((p + q) / 2);
  const span = Math.max(Math.abs(yv), Math.abs(f(xmin)), 4);
  const pos = rel === '>' || rel === '>=';
  // regione evidenziata: dove f ha il segno richiesto
  const shade = [];
  if ((a > 0) === pos) shade.push({ f, from: xmin, to: lo, cls: 'g-region' }, { f, from: hi, to: xmax, cls: 'g-region' });
  else shade.push({ f, from: lo, to: hi, cls: 'g-region' });
  return plane({
    xmin, xmax, ymin: -Math.min(span, 25) - 1, ymax: Math.min(span, 25) + 1, width: 320, height: 230,
    fns: [{ f }], shade: rel ? shade : [],
    points: [{ x: lo, y: 0, open: rel === '<' || rel === '>' }, { x: hi, y: 0, open: rel === '<' || rel === '>' }],
  });
}

function intervalLabel(kind, lo, hi, closed) {
  const L = closed ? '\\le' : '<';
  if (kind === 'out') return `$x ${closed ? '\\le' : '<'} ${lo} \\ \\vee\\ x ${closed ? '\\ge' : '>'} ${hi}$`;
  return `$${lo} ${L} x ${L} ${hi}$`;
}

function solve(rng, showGraph) {
  const { a, p, q } = rng.until(() => ({ a: rng.pick([1, 1, -1, 2]), p: rng.intNot(-6, 6), q: rng.intNot(-6, 6) }), (v) => v.p < v.q && v.p !== -v.q);
  const rel = rng.pick(['<', '<=', '>', '>=']);
  const closed = rel === '<=' || rel === '>=';
  const pos = rel === '>' || rel === '>=';
  const outside = (a > 0) === pos;
  const b = -a * (p + q), c = a * p * q;
  return {
    type: 'choice',
    fig: showGraph ? parabFig(a, p, q, null) : undefined,
    prompt: `${showGraph ? 'Il grafico mostra $y = ' + poly([[a, 'x^2'], [b, 'x'], [c, '']]) + '$. ' : ''}Risolvi: $$${poly([[a, 'x^2'], [b, 'x'], [c, '']])} ${SYM[rel]} 0$$`,
    options: [
      { label: intervalLabel(outside ? 'out' : 'in', p, q, closed), correct: true },
      { label: intervalLabel(outside ? 'in' : 'out', p, q, closed), why: `Guarda il segno della parabola: con $a ${a > 0 ? '> 0' : '< 0'}$ è ${a > 0 ? 'positiva fuori dalle radici e negativa tra le radici' : 'negativa fuori dalle radici e positiva tra le radici'}.` },
      { label: intervalLabel(outside ? 'out' : 'in', p, q, !closed), why: closed ? 'Con il segno di uguale le radici sono comprese.' : 'La disuguaglianza è stretta: le radici sono escluse.' },
      { label: intervalLabel(outside ? 'out' : 'in', -q, -p, closed), why: 'Le radici hanno il segno sbagliato: risolvi prima l\'equazione associata.' },
    ],
    explain: `Radici dell'equazione associata: $x = ${p}$ e $x = ${q}$. La parabola ha la concavità ${a > 0 ? 'verso l\'alto' : 'verso il basso'}, quindi è ${pos ? 'positiva' : 'negativa'} ${outside ? 'all\'esterno' : 'all\'interno'} delle radici.`,
    explainFig: parabFig(a, p, q, rel),
    twin: () => solve(rng, showGraph),
  };
}

function noRoots(rng) {
  const { a, b, c } = rng.until(() => ({ a: rng.pick([1, 2, -1, -2]), b: rng.int(-4, 4), c: rng.intNot(-9, 9) }), (v) => v.b * v.b - 4 * v.a * v.c < 0);
  const rel = rng.pick(['>', '<']);
  const always = (a > 0) === (rel === '>');
  const f = (x) => a * x * x + b * x + c;
  const xv = -b / (2 * a);
  return {
    type: 'choice',
    prompt: `Risolvi: $$${poly([[a, 'x^2'], [b, 'x'], [c, '']])} ${SYM[rel]} 0$$`,
    options: [
      { label: 'Per ogni $x$ reale', correct: always, why: always ? undefined : `La parabola è tutta ${a > 0 ? 'sopra' : 'sotto'} l'asse x.` },
      { label: 'Nessuna soluzione', correct: !always, why: !always ? undefined : `La parabola è tutta ${a > 0 ? 'sopra' : 'sotto'} l'asse x.` },
      { label: 'Solo tra le radici', why: `$\\Delta = ${b * b - 4 * a * c} < 0$: non ci sono radici.` },
    ],
    fixedOrder: true,
    explain: `$\\Delta = ${b * b - 4 * a * c} < 0$: la parabola non tocca l'asse x ed è tutta ${a > 0 ? 'sopra' : 'sotto'} di esso. Quindi la disequazione è ${always ? 'sempre verificata' : 'mai verificata'}.`,
    explainFig: plane({ xmin: Math.round(xv) - 5, xmax: Math.round(xv) + 5, ymin: -12, ymax: 12, width: 300, height: 220, fns: [{ f }] }),
    twin: () => noRoots(rng),
  };
}

function signRead(rng) {
  const { a, p, q } = rng.until(() => ({ a: rng.pick([1, -1]), p: rng.int(-5, 3), q: rng.int(-3, 6) }), (v) => v.p < v.q);
  const x = rng.pick([p - 1, (p + q) / 2, q + 1].filter((v) => Number.isInteger(v)));
  const val = a * (x - p) * (x - q);
  return {
    type: 'choice',
    fig: parabFig(a, p, q, null),
    prompt: `Guarda il grafico di $y = ${poly([[a, 'x^2'], [-a * (p + q), 'x'], [a * p * q, '']])}$. Per $x = ${x}$, la $y$ è…`,
    options: [
      { label: 'positiva', correct: val > 0, why: val > 0 ? undefined : 'In quel punto la parabola è sotto l\'asse x.' },
      { label: 'negativa', correct: val < 0, why: val < 0 ? undefined : 'In quel punto la parabola è sopra l\'asse x.' },
      { label: 'zero', correct: val === 0, why: val === 0 ? undefined : 'La y è zero solo nelle radici.' },
    ],
    fixedOrder: true,
    explain: `Per $x = ${x}$: $y = ${val}$. ${val > 0 ? 'Sopra' : val < 0 ? 'Sotto' : 'Sull\''}${val === 0 ? 'asse x.' : ' l\'asse x.'}`,
    twin: () => signRead(rng),
  };
}

export default {
  id: 'disequazioni-2',
  area: 'equazioni',
  years: [3],
  mat: ['MAT_A3', 'MAT_K2'],
  ambito: 'Relazioni e funzioni',
  title: 'Disequazioni di secondo grado',
  summary: 'Il segno della parabola risolve la disequazione.',
  glyph: 'x²>0',
  levels: [
    { name: 'Leggere il segno', desc: 'Dal grafico al segno della funzione' },
    { name: 'Risolvere', desc: 'Radici, concavità, intervalli' },
    { name: 'Casi speciali', desc: 'Delta negativo: sempre o mai' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Sopra o sotto l\'asse x',
      body: 'Risolvere $x^2 - x - 6 > 0$ vuol dire trovare dove la parabola $y = x^2 - x - 6$ sta sopra l\'asse x. Le radici $-2$ e $3$ dividono la retta in tre parti; la concavità dice in quali la parabola è positiva.',
      fig: parabFig(1, -2, 3, '>'),
    };
    if (level === 1) return [learn, signRead(rng), solve(rng, true), signRead(rng), solve(rng, true), signRead(rng)];
    if (level === 2) return [learn, solve(rng, true), solve(rng, false), solve(rng, false), solve(rng, true), solve(rng, false)];
    return [learn, noRoots(rng), solve(rng, false), noRoots(rng), solve(rng, false), noRoots(rng)];
  },
};

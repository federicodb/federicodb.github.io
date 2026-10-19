import { scene } from '../contesti.js';
import { poly, par, frac } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

const parab = (a, b, c, roots, extra = {}) => {
  const xs = roots.length ? roots : [-b / (2 * a)];
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const span = Math.max(6, Math.max(...xs) - Math.min(...xs) + 4);
  const f = (x) => a * x * x + b * x + c;
  const xmin = Math.floor(cx - span / 2), xmax = Math.ceil(cx + span / 2);
  const yv = f(-b / (2 * a));
  const ys = [yv, f(xmin), f(xmax), 0];
  const ymin = Math.floor(Math.max(Math.min(...ys), yv - 30) - 1), ymax = Math.ceil(Math.min(Math.max(...ys), yv + 30) + 1);
  return plane({ xmin, xmax, ymin, ymax, width: 320, height: 240, fns: [{ f }], points: roots.map((r) => ({ x: r, y: 0, label: `x = ${String(r).replace('.', ',')}` })), ...extra });
};

function pure(rng) {
  const k = rng.int(2, 12);
  const a = rng.int(1, 4);
  return {
    type: 'numbers',
    cas: { solve: `${a}*x^2-${a * k * k}=0` },
    prompt: `Risolvi: $$${a === 1 ? '' : a}x^2 - ${a * k * k} = 0$$ Scrivi le soluzioni separate da punto e virgola.`,
    answers: [k, -k],
    traps: [{ values: [k], msg: `Anche $${-k}$ elevato al quadrato dà ${k * k}: le soluzioni sono due.` }],
    hint: 'Isola $x^2$ e poi pensa a quali numeri, al quadrato, danno quel valore.',
    explain: `$$x^2 = ${k * k} \\Rightarrow x = \\pm ${k}$$`,
    fig: parab(a, 0, -a * k * k, [-k, k]),
    figAfter: true,
    placeholder: 'ad es. 3; -3',
    twin: () => pure(rng),
  };
}

function spuria(rng) {
  const a = rng.intNot(-5, 5), r = rng.intNot(-8, 8);
  const b = -a * r;
  return {
    type: 'numbers',
    cas: { solve: `${a}*x^2+(${b})*x=0` },
    prompt: `Risolvi: $$${poly([[a, 'x^2'], [b, 'x']])} = 0$$`,
    answers: [0, r],
    traps: [{ values: [r], msg: 'Dividendo per x si perde la soluzione x = 0: raccogli invece di dividere.' }],
    hint: 'Raccogli la x: un prodotto è zero se uno dei fattori è zero.',
    explain: `$$x\\left(${poly([[a, 'x'], [b, '']])}\\right) = 0 \\Rightarrow x = 0 \\ \\vee\\ x = ${r}$$`,
    placeholder: 'ad es. 0; 4',
    twin: () => spuria(rng),
  };
}

function complete(rng, withA) {
  const { a, p, q } = rng.until(() => ({ a: withA ? rng.intNot(-3, 3, [0, 1]) : 1, p: rng.intNot(-8, 8), q: rng.intNot(-8, 8) }), (v) => v.p !== v.q);
  const b = -a * (p + q), c = a * p * q;
  const D = b * b - 4 * a * c;
  return {
    type: 'numbers',
    cas: { solve: `${a}*x^2+(${b})*x+(${c})=0` },
    prompt: `Risolvi: $$${poly([[a, 'x^2'], [b, 'x'], [c, '']])} = 0$$`,
    answers: [p, q],
    traps: [{ values: [-p, -q], msg: 'Le soluzioni hanno il segno sbagliato: nella formula c\'è $-b$.' }],
    hint: `$\\Delta = b^2 - 4ac$, poi $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$.`,
    explain: `$$\\Delta = ${par(b)}^2 - 4\\cdot ${par(a)}\\cdot ${par(c)} = ${D}$$ $$x = \\dfrac{${-b} \\pm \\sqrt{${D}}}{${2 * a}} = \\dfrac{${-b} \\pm ${Math.sqrt(D)}}{${2 * a}} \\Rightarrow x_1 = ${p},\\ x_2 = ${q}$$`,
    explainFig: parab(a, b, c, [p, q]),
    placeholder: 'ad es. 2; -5',
    twin: () => complete(rng, withA),
  };
}

function delta(rng) {
  const a = rng.intNot(-4, 4), b = rng.int(-9, 9), c = rng.intNot(-9, 9);
  const D = b * b - 4 * a * c;
  return {
    type: 'number',
    cas: { eval: `(${b})^2-4*(${a})*(${c})` },
    prompt: `Calcola il discriminante di $${poly([[a, 'x^2'], [b, 'x'], [c, '']])} = 0$.`,
    answer: D,
    traps: [{ value: b * b + 4 * a * c, msg: 'Attenzione ai segni: è $b^2 - 4ac$, con a e c presi con il loro segno.' }, { value: -b * b - 4 * a * c, msg: '$b^2$ è sempre positivo o nullo.' }],
    hint: '$\\Delta = b^2 - 4ac$',
    explain: `$$\\Delta = ${par(b)}^2 - 4\\cdot ${par(a)}\\cdot ${par(c)} = ${b * b} ${-4 * a * c < 0 ? '-' : '+'} ${Math.abs(4 * a * c)} = ${D}$$`,
    twin: () => delta(rng),
  };
}

function howMany(rng) {
  const kind = rng.pick([0, 1, 2]);
  let a, b, c;
  if (kind === 1) { const r = rng.intNot(-5, 5); a = rng.intNot(-3, 3); b = -2 * a * r; c = a * r * r; }
  else ({ a, b, c } = rng.until(() => ({ a: rng.intNot(-4, 4), b: rng.int(-8, 8), c: rng.intNot(-9, 9) }), (v) => (kind === 2 ? v.b * v.b - 4 * v.a * v.c > 0 : v.b * v.b - 4 * v.a * v.c < 0)));
  const D = b * b - 4 * a * c;
  const roots = D > 0 ? [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)] : D === 0 ? [-b / (2 * a)] : [];
  return {
    type: 'choice',
    prompt: `Quante soluzioni reali ha $${poly([[a, 'x^2'], [b, 'x'], [c, '']])} = 0$?`,
    options: [
      { label: 'Due soluzioni distinte', correct: D > 0, why: D > 0 ? undefined : `$\\Delta = ${D}$ non è positivo.` },
      { label: 'Due soluzioni coincidenti (una sola)', correct: D === 0, why: D === 0 ? undefined : `$\\Delta = ${D}$ non è zero.` },
      { label: 'Nessuna soluzione reale', correct: D < 0, why: D < 0 ? undefined : `$\\Delta = ${D}$ non è negativo.` },
    ],
    fixedOrder: true,
    explain: `$\\Delta = ${D}$: ${D > 0 ? 'positivo, due soluzioni. La parabola taglia l\'asse x in due punti.' : D === 0 ? 'zero, una soluzione doppia. La parabola tocca l\'asse x nel vertice.' : 'negativo, nessuna soluzione reale. La parabola non tocca l\'asse x.'}`,
    explainFig: parab(a, b, c, roots.map((r) => Math.round(r * 100) / 100)),
    twin: () => howMany(rng),
  };
}

function problem(rng) {
  // rettangolo: base = altezza + d, area = A
  const h = rng.int(3, 15), d = rng.int(1, 7);
  const A = h * (h + d);
  const what = scene(rng, 'rettangolo');
  return {
    type: 'number',
    unit: 'dm',
    cas: { solve: `x*(x+${d})=${A}`, pick: 'positive' },
    prompt: `${what} ha la base più lunga dell'altezza di ${d} dm e l'area di ${A} dm². Quanto misura l'altezza?`,
    answer: h,
    traps: [{ value: -h - d, msg: 'Quella è la soluzione negativa dell\'equazione: una lunghezza non può essere negativa.' }, { value: h + d, msg: 'Questa è la base: la domanda chiede l\'altezza.' }],
    hint: `Se l'altezza è $x$, la base è $x + ${d}$ e $x(x+${d}) = ${A}$.`,
    explain: `$$x(x+${d}) = ${A} \\Rightarrow x^2 + ${d}x - ${A} = 0$$ Le soluzioni sono $x = ${h}$ e $x = ${-h - d}$: si accetta solo quella positiva, quindi l'altezza è ${h} dm e la base ${h + d} dm.`,
    twin: () => problem(rng),
  };
}

export default {
  id: 'equazioni-2',
  area: 'equazioni',
  years: [2, 3],
  mat: ['MAT_A3', 'MAT_K2'],
  ambito: 'Relazioni e funzioni',
  title: 'Equazioni di secondo grado',
  summary: 'Il discriminante, la formula e la parabola che taglia l\'asse x.',
  glyph: 'Δ',
  levels: [
    { name: 'Incomplete', desc: 'Pure e spurie, senza formula' },
    { name: 'La formula', desc: 'Discriminante e soluzioni' },
    { name: 'Ragionare con Δ', desc: 'Quante soluzioni e problemi reali' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Δ = b² − 4ac',
      body: 'Le soluzioni di $ax^2 + bx + c = 0$ sono i punti in cui la parabola $y = ax^2 + bx + c$ incontra l\'asse x. Il discriminante $\\Delta$ dice quanti sono, prima ancora di calcolarli. Per più soluzioni scrivile separate da punto e virgola: <b>2; -3</b>.',
      fig: parab(1, -1, -6, [-2, 3]),
    };
    if (level === 1) return [learn, pure(rng), spuria(rng), pure(rng), spuria(rng), pure(rng)];
    if (level === 2) return [learn, delta(rng), complete(rng, false), complete(rng, false), delta(rng), complete(rng, true)];
    return [learn, howMany(rng), complete(rng, true), problem(rng), howMany(rng), problem(rng)];
  },
};

void frac;

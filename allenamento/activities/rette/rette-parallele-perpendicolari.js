import { poly, frac, par } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

function perpSlope(rng) {
  const n = rng.intNot(-5, 5), d = rng.int(1, 4);
  const m = n / d;
  return {
    type: 'number',
    prompt: `Una retta ha coefficiente angolare $m = ${frac(n, d)}$. Quale coefficiente ha una retta perpendicolare? (puoi scrivere una frazione)`,
    answer: -1 / m,
    traps: [{ value: 1 / m, msg: 'Va bene l\'inverso, ma il segno va cambiato.' }, { value: -m, msg: 'Va bene il segno opposto, ma serve anche l\'inverso.' }],
    hint: 'Antireciproco: inverti la frazione e cambia il segno.',
    explain: `$$m' = -\\dfrac{1}{m} = ${frac(-d, n)}$$ Verifica: $m\\cdot m' = ${frac(n, d)}\\cdot\\left(${frac(-d, n)}\\right) = -1$.`,
    explainFig: plane({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, width: 260, height: 260, fns: [{ f: (x) => m * x }, { f: (x) => (-1 / m) * x, cls: 'g-fn2' }] }),
    twin: () => perpSlope(rng),
  };
}

function relation(rng) {
  const m = rng.intNot(-3, 3);
  const kind = rng.pick(['par', 'perp', 'none']);
  const m2 = kind === 'par' ? m : kind === 'perp' ? -1 / m : rng.until(() => m + rng.pick([1, 2, -1]), (v) => v !== m && Math.abs(v * m + 1) > 1e-9);
  const q1 = rng.int(-3, 3), q2 = rng.intNot(-3, 3, [q1]);
  const second = Number.isInteger(m2) ? poly([[m2, 'x'], [q2, '']]) : `${m2 < 0 ? '-' : ''}\\dfrac{1}{${Math.abs(m)}}x ${q2 < 0 ? '-' : '+'} ${Math.abs(q2)}`;
  return {
    type: 'choice',
    prompt: `Le rette $y = ${poly([[m, 'x'], [q1, '']])}$ e $y = ${second}$ sono…`,
    options: [
      { label: 'parallele', correct: kind === 'par', why: kind === 'par' ? undefined : 'Due rette parallele hanno lo stesso coefficiente angolare.' },
      { label: 'perpendicolari', correct: kind === 'perp', why: kind === 'perp' ? undefined : 'Due rette perpendicolari hanno coefficienti con prodotto −1.' },
      { label: 'né parallele né perpendicolari', correct: kind === 'none', why: kind === 'none' ? undefined : 'Confronta i coefficienti angolari.' },
    ],
    fixedOrder: true,
    explain: `$m_1 = ${m}$, $m_2 = ${Number.isInteger(m2) ? m2 : frac(-1 * Math.sign(m), Math.abs(m))}$. ${kind === 'par' ? 'Sono uguali: parallele.' : kind === 'perp' ? 'Il prodotto è −1: perpendicolari.' : 'Né uguali né con prodotto −1.'}`,
    explainFig: plane({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, width: 260, height: 260, fns: [{ f: (x) => m * x + q1 }, { f: (x) => m2 * x + q2, cls: 'g-fn2' }] }),
    twin: () => relation(rng),
  };
}

function lineThrough(rng, perp) {
  const m = rng.intNot(-3, 3);
  const P = { x: rng.int(-3, 3), y: rng.int(-4, 4) };
  const slope = perp ? -1 / m : m;
  const q = P.y - slope * P.x;
  const qTex = Number.isInteger(q) ? null : true;
  return {
    type: 'expr', vars: ['x'],
    prompt: `Scrivi l'equazione della retta ${perp ? 'perpendicolare' : 'parallela'} a $y = ${poly([[m, 'x'], [rng.int(-4, 4), '']])}$ passante per $P(${P.x};\\,${P.y})$. $$y = \\;?$$`,
    answer: `${slope}*x + ${par(q)}`,
    traps: perp ? [{ expr: `${m}*x + ${par(P.y - m * P.x)}`, msg: 'Questa è la parallela: per la perpendicolare serve l\'antireciproco.' }] : [{ expr: `${m}*x`, msg: 'La pendenza è giusta ma la retta deve passare per P.' }],
    hint: `Usa $y - y_P = m(x - x_P)$ con $m = ${perp ? frac(-1, m) : m}$.`,
    explain: `$$y - ${par(P.y)} = ${perp ? frac(-1, m) : m}\\,(x - ${par(P.x)})$$ $$y = ${perp ? frac(-1, m) : m}x ${q < 0 ? '-' : '+'} ${qTex ? frac(Math.round(Math.abs(q) * Math.abs(m)), Math.abs(m)) : Math.abs(q)}$$`,
    placeholder: perp ? 'ad es. -1/2x + 3' : 'ad es. 2x - 1',
    twin: () => lineThrough(rng, perp),
  };
}

function intersection(rng) {
  const X = rng.int(-4, 4), Y = rng.int(-4, 4);
  const m1 = rng.intNot(-3, 3), m2 = rng.intNot(-3, 3, [0, m1]);
  const q1 = Y - m1 * X, q2 = Y - m2 * X;
  return {
    type: 'numbers', ordered: true,
    cas: { system: [`y=${m1}*x+(${q1})`, `y=${m2}*x+(${q2})`] },
    prompt: `Trova il punto di intersezione delle rette $y = ${poly([[m1, 'x'], [q1, '']])}$ e $y = ${poly([[m2, 'x'], [q2, '']])}$. Scrivi le coordinate come $(x;\\,y)$.`,
    answers: [X, Y],
    hint: 'Uguaglia le due espressioni di y e ricava x; poi sostituisci.',
    explain: `$$${poly([[m1, 'x'], [q1, '']])} = ${poly([[m2, 'x'], [q2, '']])} \\Rightarrow ${poly([[m1 - m2, 'x']])} = ${q2 - q1} \\Rightarrow x = ${X}$$ $$y = ${m1}\\cdot ${par(X)} ${q1 < 0 ? '-' : '+'} ${Math.abs(q1)} = ${Y}$$`,
    explainFig: plane({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, width: 280, height: 280, fns: [{ f: (x) => m1 * x + q1 }, { f: (x) => m2 * x + q2, cls: 'g-fn2' }], points: [{ x: X, y: Y, label: `(${X}; ${Y})` }] }),
    placeholder: '(x; y)',
    twin: () => intersection(rng),
  };
}

export default {
  id: 'rette-parallele',
  area: 'rette',
  years: [2, 3],
  mat: ['MAT_K3', 'MAT_A2'],
  ambito: 'Relazioni e funzioni',
  title: 'Rette parallele e perpendicolari',
  summary: 'Stessa pendenza, pendenze antireciproche, incroci.',
  glyph: '⊥',
  levels: [
    { name: 'Riconoscere', desc: 'Parallele, perpendicolari o nessuna delle due' },
    { name: 'Costruire', desc: 'La retta per un punto' },
    { name: 'Incrociare', desc: 'Il punto di intersezione' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Pendenze che si parlano',
      body: 'Parallele: stessa pendenza, $m_1 = m_2$. Perpendicolari: pendenze antireciproche, $m_1\\cdot m_2 = -1$ (ad esempio $2$ e $-\\tfrac{1}{2}$).',
      fig: plane({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, width: 280, height: 280, fns: [{ f: (x) => 2 * x + 1, label: 'm = 2' }, { f: (x) => 2 * x - 3, label: 'm = 2' }, { f: (x) => -0.5 * x, cls: 'g-fn2', label: 'm = −½', labelX: -4 }] }),
    };
    if (level === 1) return [learn, relation(rng), perpSlope(rng), relation(rng), perpSlope(rng), relation(rng)];
    if (level === 2) return [learn, lineThrough(rng, false), perpSlope(rng), lineThrough(rng, true), lineThrough(rng, false), lineThrough(rng, true)];
    return [learn, intersection(rng), intersection(rng), relation(rng), intersection(rng), lineThrough(rng, true)];
  },
};

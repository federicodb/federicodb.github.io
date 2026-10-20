import { factorsOf } from '../../js/engine/check.js';
import { variables } from '../../js/engine/expr.js';

// Forma k·√r con r senza fattori quadrati (oppure solo intero)
const SQUAREFREE = [2, 3, 5, 6, 7, 10, 11];
function simplifiedRoot(tree) {
  const fs = factorsOf(tree);
  for (const f of fs) {
    if (f.k === 'fn' && f.f === 'sqrt' && f.a.k === 'num') {
      const r = f.a.v;
      for (let q = 2; q * q <= r; q++) if (r % (q * q) === 0) return `Il valore è giusto, ma sotto radice c'è ancora il quadrato ${q * q}: portalo fuori.`;
    }
  }
  return null;
}
function noRootInDenominator(tree) {
  const bad = (t) => (t.k === 'div' && hasSqrt(t.b)) || [t.a, t.b].some((c) => c && bad(c));
  const hasSqrt = (t) => (t.k === 'fn' && t.f === 'sqrt') || [t.a, t.b].some((c) => c && hasSqrt(c));
  return bad(tree) ? 'Il valore è giusto, ma va razionalizzato: niente radici al denominatore.' : null;
}

function simplify(rng) {
  const k = rng.int(2, 7);
  const r = rng.pick(SQUAREFREE);
  return {
    type: 'expr', vars: [],
    cas: { eval: `sqrt(${k * k * r})` },
    prompt: `Porta fuori dalla radice: $$\\sqrt{${k * k * r}}$$`,
    answer: `${k}*sqrt(${r})`,
    form: simplifiedRoot,
    traps: [{ expr: `${k * k}*sqrt(${r})`, msg: `Fuori dalla radice esce la radice di ${k * k}, cioè ${k}.` }],
    hint: `Cerca un quadrato perfetto che divide ${k * k * r}.`,
    explain: `$$\\sqrt{${k * k * r}} = \\sqrt{${k * k}\\cdot ${r}} = \\sqrt{${k * k}}\\cdot\\sqrt{${r}} = ${k}\\sqrt{${r}}$$`,
    placeholder: 'ad es. 3√2',
    twin: () => simplify(rng),
  };
}

function sumSimilar(rng) {
  const r = rng.pick([2, 3, 5]);
  const a = rng.int(1, 4), b = rng.int(2, 5);
  // a√(r·p²) + b√r
  const p = rng.int(2, 4);
  const tot = a * p + b;
  return {
    type: 'expr', vars: [],
    prompt: `Calcola: $$${a === 1 ? '' : a}\\sqrt{${r * p * p}} + ${b}\\sqrt{${r}}$$`,
    answer: `${tot}*sqrt(${r})`,
    form: simplifiedRoot,
    traps: [{ expr: `${a + b}*sqrt(${r * p * p + r})`, msg: 'Le radici non si sommano sommando i radicandi. Prima rendile simili.' }],
    hint: `Porta fuori da $\\sqrt{${r * p * p}}$ il fattore ${p}: diventano radicali simili.`,
    explain: `$$${a === 1 ? '' : a}\\sqrt{${r * p * p}} = ${a * p}\\sqrt{${r}}$$ $$${a * p}\\sqrt{${r}} + ${b}\\sqrt{${r}} = ${tot}\\sqrt{${r}}$$ Come $${a * p}x + ${b}x = ${tot}x$.`,
    placeholder: 'ad es. 7√3',
    twin: () => sumSimilar(rng),
  };
}

function productRoots(rng) {
  const r = rng.pick([2, 3, 5, 6]);
  const s = rng.pick([2, 3, 5, 6, 8, 12].filter((x) => x !== r));
  const prod = r * s;
  let k = 1, rest = prod;
  for (let q = 2; q * q <= rest; q++) while (rest % (q * q) === 0) { rest /= q * q; k *= q; }
  const ans = rest === 1 ? String(k) : `${k}*sqrt(${rest})`;
  return {
    type: 'expr', vars: [],
    cas: { eval: `sqrt(${r})*sqrt(${s})` },
    prompt: `Calcola e semplifica: $$\\sqrt{${r}}\\cdot\\sqrt{${s}}$$`,
    answer: ans,
    form: simplifiedRoot,
    hint: 'Il prodotto di due radici quadrate è la radice del prodotto.',
    explain: `$$\\sqrt{${r}}\\cdot\\sqrt{${s}} = \\sqrt{${prod}}${k > 1 ? ` = ${rest === 1 ? k : `${k}\\sqrt{${rest}}`}` : ''}$$`,
    placeholder: 'ad es. 2√6',
    twin: () => productRoots(rng),
  };
}

function rationalize(rng) {
  const a = rng.int(1, 9);
  const r = rng.pick([2, 3, 5, 6, 7]);
  const g = (x, y) => (y ? g(y, x % y) : x);
  const gg = g(a, r);
  const num = a / gg, den = r / gg;
  return {
    type: 'expr', vars: [],
    cas: { eval: `${a}/sqrt(${r})` },
    prompt: `Razionalizza il denominatore: $$\\dfrac{${a}}{\\sqrt{${r}}}$$`,
    answer: `${a}*sqrt(${r})/${r}`,
    form: noRootInDenominator,
    hint: `Moltiplica sopra e sotto per $\\sqrt{${r}}$.`,
    explain: `$$\\dfrac{${a}}{\\sqrt{${r}}}\\cdot\\dfrac{\\sqrt{${r}}}{\\sqrt{${r}}} = \\dfrac{${a}\\sqrt{${r}}}{${r}}${gg > 1 ? ` = ${den === 1 ? '' : `\\dfrac{`}${num === 1 ? '' : num}\\sqrt{${r}}${den === 1 ? '' : `}{${den}}`}` : ''}$$ Il valore non cambia: abbiamo moltiplicato per 1.`,
    placeholder: 'ad es. 3√2/2',
    twin: () => rationalize(rng),
  };
}

/** Stima: posiziona la radice sulla retta tra due interi */
function placeRoot(rng) {
  const n = rng.until(() => rng.int(5, 99), (x) => !Number.isInteger(Math.sqrt(x)));
  const lo = Math.floor(Math.sqrt(n));
  const r = Math.sqrt(n);
  return {
    type: 'place',
    prompt: `Posiziona $\\sqrt{${n}}$ sulla retta, a occhio.`,
    min: lo - 1, max: lo + 2, snap: 0.01, tol: 0.15,
    ticks: [lo - 1, lo, lo + 1, lo + 2].map((v) => ({ v, label: String(v) })).concat([lo - 0.5, lo + 0.5, lo + 1.5].map((v) => ({ v, major: false }))),
    answer: r, answerLabel: `√${n} ≈ ${String(Math.round(r * 100) / 100).replace('.', ',')}`,
    label: `Posizione di radice di ${n}`,
    hint: `$${lo}^2 = ${lo * lo}$ e $${lo + 1}^2 = ${(lo + 1) ** 2}$: a quale dei due è più vicino ${n}?`,
    explain: `$${lo}^2 = ${lo * lo} < ${n} < ${(lo + 1) ** 2} = ${lo + 1}^2$, quindi $\\sqrt{${n}}$ sta tra ${lo} e ${lo + 1}, ${n - lo * lo < (lo + 1) ** 2 - n ? `più vicino a ${lo}` : `più vicino a ${lo + 1}`}: $\\sqrt{${n}} \\approx ${String(Math.round(r * 100) / 100).replace('.', '{,}')}$.`,
    twin: () => placeRoot(rng),
  };
}

function estimate(rng) {
  const n = rng.until(() => rng.int(5, 140), (x) => !Number.isInteger(Math.sqrt(x)));
  const lo = Math.floor(Math.sqrt(n));
  return {
    type: 'choice',
    prompt: `Tra quali interi consecutivi si trova $\\sqrt{${n}}$?`,
    options: [
      { label: `$${lo}$ e $${lo + 1}$`, correct: true },
      { label: `$${lo - 1}$ e $${lo}$`, why: `$${lo}^2 = ${lo * lo}$ è già minore di ${n}.` },
      { label: `$${lo + 1}$ e $${lo + 2}$`, why: `$${lo + 1}^2 = ${(lo + 1) ** 2}$ è già maggiore di ${n}.` },
      { label: `$${Math.floor(n / 2) - 1}$ e $${Math.floor(n / 2)}$`, why: 'La radice quadrata non è la metà del numero.' },
    ].filter((o, i, arr) => arr.findIndex((p) => p.label === o.label) === i),
    explain: `$${lo}^2 = ${lo * lo} < ${n} < ${(lo + 1) ** 2} = ${lo + 1}^2$, quindi $${lo} < \\sqrt{${n}} < ${lo + 1}$.`,
    twin: () => estimate(rng),
  };
}

export default {
  id: 'radicali',
  area: 'numeri',
  years: [2],
  mat: ['MAT_K1', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Radicali',
  summary: 'Stimare, semplificare e razionalizzare le radici.',
  glyph: '√',
  levels: [
    { name: 'Stima e semplificazione', desc: 'Portare fuori i quadrati' },
    { name: 'Operazioni', desc: 'Radicali simili e prodotti' },
    { name: 'Razionalizzare', desc: 'Niente radici al denominatore' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Quadrati nascosti', body: '$$\\sqrt{72} = \\sqrt{36\\cdot 2} = 6\\sqrt{2}$$ Si cerca il più grande quadrato perfetto che divide il radicando. Scrivi le radici con il simbolo √ del tastierino o con sqrt(…).' };
    if (level === 1) return [learn, estimate(rng), simplify(rng), placeRoot(rng), simplify(rng), simplify(rng)];
    if (level === 2) return [learn, sumSimilar(rng), productRoots(rng), simplify(rng), sumSimilar(rng), productRoots(rng)];
    return [{ type: 'learn', title: 'Moltiplicare per 1', body: '$$\\dfrac{3}{\\sqrt{2}} = \\dfrac{3}{\\sqrt{2}}\\cdot\\dfrac{\\sqrt{2}}{\\sqrt{2}} = \\dfrac{3\\sqrt{2}}{2}$$ Moltiplicare per $\\frac{\\sqrt 2}{\\sqrt 2}$ non cambia il valore ma toglie la radice dal denominatore.' }, rationalize(rng), productRoots(rng), rationalize(rng), sumSimilar(rng), rationalize(rng)];
  },
};

void variables;

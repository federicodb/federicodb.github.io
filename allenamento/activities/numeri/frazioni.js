import { scene } from '../contesti.js';
import { frac, gcd } from '../../js/engine/helpers.js';
import { fractionBar } from '../../js/gfx/svg.js';

const lcm = (a, b) => (a / gcd(a, b)) * b;

function equivalent(rng) {
  const d = rng.pick([3, 4, 5, 6, 8]);
  const n = rng.int(1, d - 1);
  const k = rng.int(2, 4);
  return {
    type: 'number',
    fig: fractionBar(n * k, d * k),
    prompt: `La barra è divisa in ${d * k} parti e ne sono colorate ${n * k}. Riduci la frazione $\\dfrac{${n * k}}{${d * k}}$ ai minimi termini.`,
    answer: n / d,
    reduced: true,
    traps: [{ value: (n * k - 1) / (d * k - 1), msg: 'Ridurre non vuol dire togliere 1 sopra e sotto: si divide per lo stesso numero.' }],
    hint: `Cerca un numero che divida sia ${n * k} sia ${d * k}.`,
    explain: `Il M.C.D. di ${n * k} e ${d * k} è ${gcd(n * k, d * k)}: $$\\dfrac{${n * k}}{${d * k}} = \\dfrac{${n * k} : ${gcd(n * k, d * k)}}{${d * k} : ${gcd(n * k, d * k)}} = ${frac(n, d)}$$ La quantità colorata non cambia: cambia solo il modo di contare le parti.`,
    placeholder: 'ad es. 3/4',
    twin: () => equivalent(rng),
  };
}

function compare(rng) {
  const { a, b, c, d } = rng.until(
    () => ({ a: rng.int(1, 8), b: rng.int(2, 9), c: rng.int(1, 8), d: rng.int(2, 9) }),
    (v) => v.a < v.b && v.c < v.d && v.b !== v.d && v.a * v.d !== v.c * v.b && Math.abs(v.a / v.b - v.c / v.d) < 0.2 && (v.a > v.c) !== (v.a / v.b > v.c / v.d),
  );
  const bigger = a / b > c / d ? frac(a, b) : frac(c, d);
  const smaller = a / b > c / d ? frac(c, d) : frac(a, b);
  const m = lcm(b, d);
  return {
    type: 'choice',
    prompt: `Quale frazione è maggiore?`,
    options: [
      { label: `$${bigger}$`, correct: true },
      { label: `$${smaller}$`, why: 'Il numeratore più grande non basta: conta anche in quante parti è diviso l\'intero.' },
      { label: 'Sono uguali', why: 'Portale allo stesso denominatore e confronta.' },
    ],
    fixedOrder: false,
    explain: `Stesso denominatore ${m}: $$${frac(a, b)} = \\dfrac{${(a * m) / b}}{${m}} \\qquad ${frac(c, d)} = \\dfrac{${(c * m) / d}}{${m}}$$ quindi la maggiore è $${bigger}$.`,
    twin: () => compare(rng),
  };
}

function addSub(rng) {
  const { a, b, c, d } = rng.until(
    () => ({ a: rng.int(1, 7), b: rng.int(2, 9), c: rng.int(1, 7), d: rng.int(2, 9) }),
    (v) => v.b !== v.d && gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1 && v.a < 2 * v.b && v.c < 2 * v.d,
  );
  const op = rng.pick(['+', '-']);
  const num = op === '+' ? a * d + c * b : a * d - c * b;
  const den = b * d;
  const m = lcm(b, d);
  return {
    type: 'number',
    cas: { eval: `${a}/${b} ${op} ${c}/${d}` },
    prompt: `Calcola e semplifica: $$${frac(a, b)} ${op} ${frac(c, d)}$$`,
    answer: num / den,
    reduced: true,
    traps: [{ value: op === '+' ? (a + c) / (b + d) : (a - c) / (b - d || 1), msg: 'Numeratori e denominatori non si sommano tra loro: prima serve lo stesso denominatore.' }],
    hint: `Il minimo comune multiplo dei denominatori è ${m}.`,
    explain: `$$${frac(a, b)} ${op} ${frac(c, d)} = \\dfrac{${(a * m) / b} ${op} ${(c * m) / d}}{${m}} = ${frac((a * m) / b + (op === '+' ? 1 : -1) * ((c * m) / d), m)}$$`,
    placeholder: 'ad es. 7/12',
    twin: () => addSub(rng),
  };
}

function mulDiv(rng) {
  const { a, b, c, d } = rng.until(
    () => ({ a: rng.int(1, 9), b: rng.int(2, 9), c: rng.int(1, 9), d: rng.int(2, 9) }),
    (v) => gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1 && (gcd(v.a, v.d) > 1 || gcd(v.c, v.b) > 1),
  );
  const div = rng.chance(0.5);
  const val = div ? (a / b) / (c / d) : (a * c) / (b * d);
  return {
    type: 'number',
    cas: { eval: `(${a}/${b}) ${div ? '/' : '*'} (${c}/${d})` },
    prompt: `Calcola: $$${frac(a, b)} ${div ? ':' : '\\cdot'} ${frac(c, d)}$$`,
    answer: val,
    reduced: true,
    traps: div ? [{ value: (a * c) / (b * d), msg: 'Nella divisione si moltiplica per l\'inversa della seconda frazione.' }] : [{ value: (a * d) / (b * c), msg: 'Questa è la divisione: nel prodotto numeratore per numeratore, denominatore per denominatore.' }],
    hint: div ? `Diventa $${frac(a, b)} \\cdot ${frac(d, c)}$. Semplifica in croce prima di moltiplicare.` : 'Semplifica in croce, poi moltiplica.',
    explain: div
      ? `$$${frac(a, b)} : ${frac(c, d)} = ${frac(a, b)} \\cdot \\dfrac{${d}}{${c}} = ${frac(a * d, b * c)}$$`
      : `$$${frac(a, b)} \\cdot ${frac(c, d)} = \\dfrac{${a}\\cdot ${c}}{${b}\\cdot ${d}} = ${frac(a * c, b * d)}$$`,
    placeholder: 'ad es. 5/6',
    twin: () => mulDiv(rng),
  };
}

function fractionOf(rng) {
  const d = rng.pick([3, 4, 5, 6, 8, 10]);
  const n = rng.int(1, d - 1);
  const total = d * rng.int(3, 12);
  const g = scene(rng, 'gruppo');
  return {
    type: 'number',
    prompt: n === 1 ? `Su ${total} ${g.tot}, $${frac(n, d)}$ ${g.uno}. ${g.q || 'Quanti sono?'}` : `Su ${total} ${g.tot}, i $${frac(n, d)}$ ${g.molti}. ${g.q || 'Quanti sono?'}`,
    answer: (total * n) / d,
    traps: [{ value: total / d, msg: `${total / d} è una sola parte su ${d}: ora moltiplica per ${n}.` }],
    hint: `Dividi ${total} in ${d} parti uguali e prendine ${n}.`,
    explain: `$$${frac(n, d)} \\cdot ${total} = ${total} : ${d} \\cdot ${n} = ${(total * n) / d}$$`,
    twin: () => fractionOf(rng),
  };
}

function expression(rng) {
  const { a, b, c, d, e } = rng.until(
    () => ({ a: rng.int(1, 5), b: rng.int(2, 6), c: rng.int(1, 5), d: rng.int(2, 6), e: rng.int(2, 5) }),
    (v) => v.b !== v.d && gcd(v.a, v.b) === 1 && gcd(v.c, v.d) === 1,
  );
  // (a/b + c/d) · e  … con la precedenza delle operazioni
  const val = (a / b + c / d) * e;
  return {
    type: 'number',
    prompt: `Calcola: $$\\left(${frac(a, b)} + ${frac(c, d)}\\right)\\cdot ${e}$$`,
    answer: val,
    reduced: true,
    traps: [{ value: a / b + (c / d) * e, msg: 'La parentesi va calcolata prima: il prodotto vale per tutta la somma.' }],
    hint: 'Prima la somma in parentesi, poi il prodotto.',
    explain: `$$\\left(${frac(a, b)} + ${frac(c, d)}\\right)\\cdot ${e} = ${frac(a * d + b * c, b * d)}\\cdot ${e} = ${frac((a * d + b * c) * e, b * d)}$$`,
    twin: () => expression(rng),
  };
}

// ---------- interattivi ----------
/** Stima: posiziona la frazione sulla retta da 0 a 1 (con il solo riferimento di metà) */
function placeFraction(rng) {
  const q = rng.pick([3, 4, 5, 6, 8, 10]);
  const p = rng.until(() => rng.int(1, q - 1), (x) => x * 2 !== q);
  return {
    type: 'place',
    prompt: `Dove si trova $${frac(p, q)}$ sulla retta? Stima a occhio: c'è solo il segno di metà.`,
    min: 0, max: 1, snap: 0.01, tol: 0.06,
    ticks: [{ v: 0, label: '0' }, { v: 0.5, label: '½' }, { v: 1, label: '1' }],
    answer: p / q, answerLabel: `${p}/${q}`,
    label: `Posizione di ${p}/${q}`,
    why: (v) => (v > p / q ? `Troppo a destra: ${p}/${q} è ${p * 2 < q ? 'meno' : 'più'} di metà, ma non così tanto.` : `Troppo a sinistra: ${p}/${q} è ${p * 2 < q ? 'meno' : 'più'} di metà, ma non così poco.`),
    hint: `Dividi il segmento da 0 a 1 in ${q} parti uguali e contane ${p}.`,
    explain: `Il segmento da 0 a 1 diviso in ${q} parti: $${frac(p, q)}$ è alla ${p}ª tacca, ${p * 2 < q ? 'prima' : 'dopo'} di metà.`,
    explainFig: fractionBar(p, q),
    twin: () => placeFraction(rng),
  };
}

/** Ordina quattro frazioni dalla più piccola alla più grande */
function sortFractions(rng) {
  const items = [];
  while (items.length < 4) {
    const q = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    const p = rng.int(1, q + 2);
    if (items.some((x) => Math.abs(x.value - p / q) < 0.02)) continue;
    items.push({ label: `$${frac(p, q)}$`, value: p / q, p, q });
  }
  const sorted = items.slice().sort((a, b) => a.value - b.value);
  return {
    type: 'sort',
    prompt: 'Trascina le frazioni in ordine, dalla più piccola alla più grande.',
    items,
    hint: 'Confronta ogni frazione con $\\frac{1}{2}$ e con $1$, oppure trasformale in numeri decimali.',
    explain: `In decimali: ${sorted.map((x) => `$${frac(x.p, x.q)} \\approx ${String(Math.round(x.value * 100) / 100).replace('.', '{,}')}$`).join(', ')}.`,
    twin: () => sortFractions(rng),
  };
}

export default {
  id: 'frazioni',
  area: 'numeri',
  years: [1],
  mat: ['MAT_K1', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Frazioni',
  summary: 'Parti di un intero: ridurre, confrontare, operare.',
  glyph: '½',
  levels: [
    { name: 'Parti dell\'intero', desc: 'Frazioni equivalenti e confronto' },
    { name: 'Somme e differenze', desc: 'Il denominatore comune' },
    { name: 'Prodotti e quozienti', desc: 'Espressioni con le frazioni' },
  ],
  generate(rng, level) {
    const d = rng.pick([4, 6]);
    const learn = {
      type: 'learn',
      title: 'Stessa quantità, nomi diversi',
      body: `$\\dfrac{1}{2}$, $\\dfrac{2}{4}$, $\\dfrac{3}{6}$ indicano la stessa parte dell'intero: cambia solo in quante parti lo dividi. Qui sotto ${d / 2} parti su ${d}: metà della barra.`,
      fig: fractionBar(d / 2, d),
    };
    if (level === 1) return [learn, equivalent(rng), compare(rng), fractionOf(rng), equivalent(rng), placeFraction(rng)];
    if (level === 2) return [{ type: 'learn', title: 'Per sommare servono parti uguali', body: 'Non si possono sommare terzi e quarti così come sono: si trasformano entrambi in dodicesimi. $$\\dfrac{1}{3} + \\dfrac{1}{4} = \\dfrac{4}{12} + \\dfrac{3}{12} = \\dfrac{7}{12}$$' }, addSub(rng), fractionOf(rng), addSub(rng), addSub(rng), sortFractions(rng)];
    return [{ type: 'learn', title: 'Moltiplicare è "prendere una parte di"', body: '$\\dfrac{2}{3}\\cdot\\dfrac{3}{4}$ vuol dire prendere i due terzi di tre quarti. Dividere per una frazione è moltiplicare per la sua inversa.' }, mulDiv(rng), expression(rng), mulDiv(rng), expression(rng), mulDiv(rng)];
  },
};

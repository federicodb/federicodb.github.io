import { poly, gcd } from '../../js/engine/helpers.js';
import { factoredForm } from '../../js/engine/check.js';

function common(rng) {
  // k·x^m (a x^n + b) con k>1
  const k = rng.int(2, 9), m = rng.int(0, 2);
  const a = rng.int(1, 5), b = rng.intNot(-9, 9);
  if (gcd(a, b) !== 1) return common(rng);
  const n = rng.int(1, 2);
  if (n === 2 && b < 0) return common(rng); // a x² - b potrebbe essere una differenza di quadrati
  const lead = k * a, tail = k * b;
  const xm = m === 0 ? '' : m === 1 ? 'x' : 'x^2';
  const expanded = poly([[lead, `x^{${n + m}}`.replace('x^{1}', 'x')], [tail, xm]]);
  const outer = `${k}${xm ? xm : ''}`;
  return {
    type: 'expr',
    cas: { given: `${lead}*x^${n + m}+(${tail})*x^${m}` },
    prompt: `Scomponi raccogliendo il fattore comune: $$${expanded}$$`,
    answer: `${k}${m ? '*x^' + m : ''}*(${a}x^${n} + ${b})`,
    form: factoredForm({ minFactors: m === 0 ? 1 : 2 }),
    hint: `Il M.C.D. dei coefficienti è ${k}${m ? `; la x compare almeno con esponente ${m}` : ''}.`,
    explain: `$$${expanded} = ${outer}\\left(${poly([[a, `x^{${n}}`.replace('x^{1}', 'x')], [b, '']])}\\right)$$ Verifica: rimoltiplicando si torna al polinomio di partenza.`,
    placeholder: 'ad es. 3x(2x+5)',
    twin: () => common(rng),
  };
}

function diffSquares(rng) {
  const a = rng.int(1, 5), b = rng.int(1, 9);
  if (gcd(a, b) !== 1) return diffSquares(rng);
  return {
    type: 'expr',
    cas: { given: `${a * a}*x^2-${b * b}` },
    prompt: `Scomponi: $$${a * a === 1 ? '' : a * a}x^2 - ${b * b}$$`,
    answer: `(${a}x+${b})(${a}x-${b})`,
    form: factoredForm(),
    hint: 'È una differenza di due quadrati: di chi sono i quadrati?',
    explain: `$${a * a === 1 ? '' : a * a}x^2 = (${a === 1 ? '' : a}x)^2$ e $${b * b} = ${b}^2$: $$${a * a === 1 ? '' : a * a}x^2 - ${b * b} = (${a === 1 ? '' : a}x + ${b})(${a === 1 ? '' : a}x - ${b})$$`,
    placeholder: 'ad es. (x+3)(x-3)',
    twin: () => diffSquares(rng),
  };
}

function perfectSquare(rng) {
  const b = rng.intNot(-9, 9, [0, 1, -1]);
  return {
    type: 'expr',
    cas: { given: `x^2+(${2 * b})*x+${b * b}` },
    prompt: `Scomponi: $$${poly([[1, 'x^2'], [2 * b, 'x'], [b * b, '']])}$$`,
    answer: `(x + ${b})^2`.replace('+ -', '- '),
    form: factoredForm(),
    hint: 'Primo e ultimo termine sono quadrati: controlla il doppio prodotto.',
    explain: `$x^2$ e $${b * b}$ sono i quadrati di $x$ e $${Math.abs(b)}$, e $${2 * b}x$ è il doppio prodotto con il segno: $$${poly([[1, 'x^2'], [2 * b, 'x'], [b * b, '']])} = \\left(${poly([[1, 'x'], [b, '']])}\\right)^2$$`,
    placeholder: 'ad es. (x-4)^2',
    twin: () => perfectSquare(rng),
  };
}

function trinomial(rng) {
  const { p, q } = rng.until(() => ({ p: rng.intNot(-9, 9), q: rng.intNot(-9, 9) }), (v) => v.p !== v.q && v.p !== -v.q && v.p + v.q !== 0);
  const s = p + q, prod = p * q;
  return {
    type: 'expr',
    cas: { given: `x^2+(${s})*x+(${prod})` },
    prompt: `Scomponi il trinomio: $$${poly([[1, 'x^2'], [s, 'x'], [prod, '']])}$$`,
    answer: `(x + ${p})(x + ${q})`,
    form: factoredForm(),
    hint: `Cerca due numeri con somma ${s} e prodotto ${prod}.`,
    explain: `Somma $${s}$, prodotto $${prod}$: i numeri sono $${p}$ e $${q}$. $$${poly([[1, 'x^2'], [s, 'x'], [prod, '']])} = \\left(${poly([[1, 'x'], [p, '']])}\\right)\\left(${poly([[1, 'x'], [q, '']])}\\right)$$`,
    placeholder: 'ad es. (x+2)(x-5)',
    twin: () => trinomial(rng),
  };
}

function twoSteps(rng) {
  const k = rng.int(2, 5), b = rng.int(2, 7);
  return {
    type: 'expr',
    cas: { given: `${k}*x^3-${k * b * b}*x` },
    prompt: `Scomponi completamente: $$${k}x^3 - ${k * b * b}x$$`,
    answer: `${k}x(x+${b})(x-${b})`,
    form: factoredForm({ minFactors: 3 }),
    hint: 'Prima raccogli, poi guarda cosa resta nella parentesi.',
    explain: `$$${k}x^3 - ${k * b * b}x = ${k}x(x^2 - ${b * b}) = ${k}x(x+${b})(x-${b})$$ Una scomposizione è completa solo quando nessun fattore si scompone ancora.`,
    placeholder: 'ad es. 2x(x+3)(x-3)',
    twin: () => twoSteps(rng),
  };
}

function whichMethod(rng) {
  const [p1, q1] = rng.pick([[2, 3], [1, 6], [2, 5], [3, 4], [1, 8], [2, 7]]);
  const sq = rng.pick([3, 5, 7]);
  const cases = [
    { p: `x^2 - ${rng.pick([16, 25, 36, 49])}`, m: 'Differenza di quadrati' },
    { p: `${rng.int(2, 6)}x^2 + ${rng.int(2, 6) * 7}x`, m: 'Raccoglimento a fattore comune' },
    { p: `x^2 + ${p1 + q1}x + ${p1 * q1}`, m: 'Trinomio speciale (somma e prodotto)' },
    { p: `x^2 + ${2 * sq}x + ${sq * sq}`, m: 'Quadrato di binomio' },
  ];
  const c = rng.pick(cases);
  const methods = ['Differenza di quadrati', 'Raccoglimento a fattore comune', 'Trinomio speciale (somma e prodotto)', 'Quadrato di binomio'];
  return {
    type: 'choice',
    prompt: `Qual è il primo metodo da usare per scomporre $${c.p}$?`,
    options: methods.map((m) => ({ label: m, correct: m === c.m, why: m === c.m ? undefined : 'Guarda il numero di termini e se sono quadrati.' })),
    explain: `Due termini con il meno e due quadrati: differenza di quadrati. Un fattore in comune: raccoglimento. Tre termini: quadrato di binomio se estremi quadrati e doppio prodotto, altrimenti trinomio speciale. Qui: ${c.m.toLowerCase()}.`,
    twin: () => whichMethod(rng),
  };
}

export default {
  id: 'scomposizioni',
  area: 'polinomi',
  years: [2],
  mat: ['MAT_K1', 'MAT_A3'],
  ambito: 'Numeri',
  title: 'Scomposizioni',
  summary: 'Da somma a prodotto: il contrario dei prodotti notevoli.',
  glyph: '( )( )',
  levels: [
    { name: 'Raccoglimento', desc: 'Il fattore comune' },
    { name: 'Prodotti notevoli al contrario', desc: 'Differenze di quadrati e quadrati di binomio' },
    { name: 'Trinomi e scomposizioni complete', desc: 'Somma e prodotto, in più passaggi' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Scomporre è tornare indietro', body: 'Moltiplicare: $3x(x+2) \\to 3x^2 + 6x$. Scomporre è il viaggio opposto: $3x^2 + 6x \\to 3x(x+2)$. La risposta viene controllata: deve valere come il polinomio dato <b>ed</b> essere un prodotto che non si scompone più.' };
    if (level === 1) return [learn, common(rng), common(rng), whichMethod(rng), common(rng), common(rng)];
    if (level === 2) return [learn, diffSquares(rng), perfectSquare(rng), whichMethod(rng), diffSquares(rng), perfectSquare(rng)];
    return [learn, trinomial(rng), trinomial(rng), twoSteps(rng), whichMethod(rng), trinomial(rng)];
  },
};

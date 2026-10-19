import { poly, par } from '../../js/engine/helpers.js';
import { squareTiles } from '../../js/gfx/svg.js';

const noParens = (t) => {
  const bad = (n) => (n.k === 'pow' && (n.a.k === 'add' || n.a.k === 'sub')) || (n.k === 'mul' && [n.a, n.b].some((c) => c.k === 'add' || c.k === 'sub')) || [n.a, n.b].some((c) => c && bad(c));
  return bad(t) ? 'Il valore è giusto, ma va sviluppato: niente parentesi nel risultato.' : null;
};

function squareBinomial(rng) {
  const a = rng.int(1, 5), b = rng.intNot(-9, 9);
  const L = rng.pick(['x', 'a', 'y']);
  const A = a === 1 ? L : `${a}${L}`;
  return {
    type: 'expr',
    fig: b > 0 && a === 1 ? squareTiles(3, Math.min(b, 4), { la: L, lb: String(b) }) : undefined,
    cas: { given: `(${a}*${L}+(${b}))^2` },
    prompt: `Sviluppa: $$\\left(${poly([[a, L], [b, '']])}\\right)^2$$`,
    answer: `${a * a}${L}^2 + ${2 * a * b}${L} + ${b * b}`,
    form: noParens,
    traps: [
      { expr: `${a * a}${L}^2 + ${b * b}`, msg: 'Manca il doppio prodotto: il quadrato di una somma non è la somma dei quadrati.' },
      { expr: `${a * a}${L}^2 + ${a * b}${L} + ${b * b}`, msg: 'Il prodotto centrale va raddoppiato.' },
      { expr: `${a * a}${L}^2 - ${2 * a * b}${L} + ${b * b}`, msg: 'Il segno del doppio prodotto è quello di b.' },
    ],
    hint: 'Quadrato del primo, più il doppio prodotto, più il quadrato del secondo.',
    explain: `$$(${A})^2 + 2\\cdot ${A}\\cdot ${par(b)} + ${par(b)}^2 = ${poly([[a * a, L + '^2'], [2 * a * b, L], [b * b, '']])}$$`,
    twin: () => squareBinomial(rng),
  };
}

function sumDiff(rng) {
  const a = rng.int(1, 6), b = rng.int(1, 9);
  const L = rng.pick(['x', 'a', 'y', 'k']);
  return {
    type: 'expr',
    cas: { given: `(${a}*${L}+${b})*(${a}*${L}-${b})` },
    prompt: `Sviluppa: $$\\left(${poly([[a, L], [b, '']])}\\right)\\left(${poly([[a, L], [-b, '']])}\\right)$$`,
    answer: `${a * a}${L}^2 - ${b * b}`,
    form: noParens,
    traps: [{ expr: `${a * a}${L}^2 + ${b * b}`, msg: 'Il segno è meno: è una differenza di quadrati.' }, { expr: `${a * a}${L}^2 - ${2 * b}`, msg: `Il secondo termine va elevato al quadrato: $${b}^2 = ${b * b}$.` }],
    hint: 'Somma per differenza: quadrato del primo meno quadrato del secondo.',
    explain: `I doppi prodotti si annullano: $$(${poly([[a, L]])})^2 - ${b}^2 = ${a * a === 1 ? '' : a * a}${L}^2 - ${b * b}$$`,
    twin: () => sumDiff(rng),
  };
}

function cube(rng) {
  const b = rng.intNot(-4, 4);
  return {
    type: 'expr',
    cas: { given: `(x+(${b}))^3` },
    prompt: `Sviluppa: $$\\left(${poly([[1, 'x'], [b, '']])}\\right)^3$$`,
    answer: `x^3 + ${3 * b}x^2 + ${3 * b * b}x + ${b ** 3}`,
    form: noParens,
    traps: [{ expr: `x^3 + ${b ** 3}`, msg: 'Mancano i tripli prodotti: $(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$.' }],
    hint: 'Cubo del binomio: $a^3 + 3a^2b + 3ab^2 + b^3$.',
    explain: `$$x^3 + 3x^2\\cdot ${par(b)} + 3x\\cdot ${par(b)}^2 + ${par(b)}^3 = ${poly([[1, 'x^3'], [3 * b, 'x^2'], [3 * b * b, 'x'], [b ** 3, '']])}$$`,
    twin: () => cube(rng),
  };
}

function recognize(rng) {
  const a = rng.int(2, 7);
  const kind = rng.pick(['sq', 'diff']);
  const expr = kind === 'sq' ? `x^2 + ${2 * a}x + ${a * a}` : `x^2 - ${a * a}`;
  return {
    type: 'choice',
    prompt: `Il polinomio $${expr}$ è lo sviluppo di…`,
    options: [
      { label: `$(x+${a})^2$`, correct: kind === 'sq', why: kind === 'sq' ? undefined : `$(x+${a})^2$ ha anche il doppio prodotto $${2 * a}x$.` },
      { label: `$(x+${a})(x-${a})$`, correct: kind === 'diff', why: kind === 'diff' ? undefined : 'La somma per differenza non ha il termine in x.' },
      { label: `$(x-${a})^2$`, why: `$(x-${a})^2$ ha il doppio prodotto negativo: $-${2 * a}x$.` },
      { label: `$x^2 + ${a * a}$`, why: 'Questo è già un polinomio, non un prodotto notevole.' },
    ],
    explain: kind === 'sq' ? `$x^2$ e $${a * a}$ sono quadrati di $x$ e $${a}$, e $${2 * a}x$ è il loro doppio prodotto: $(x+${a})^2$.` : `Due quadrati con il segno meno in mezzo: $(x+${a})(x-${a})$.`,
    twin: () => recognize(rng),
  };
}

function mental(rng) {
  const n = rng.pick([19, 21, 29, 31, 39, 41, 49, 51, 59, 61, 99, 101]);
  const base = Math.round(n / 10) * 10;
  const d = n - base;
  return {
    type: 'number',
    prompt: `Usa un prodotto notevole per calcolare a mente $${n}^2$.`,
    answer: n * n,
    hint: `$${n} = ${base} ${d < 0 ? '-' : '+'} ${Math.abs(d)}$: usa il quadrato del binomio.`,
    explain: `$$${n}^2 = (${base} ${d < 0 ? '-' : '+'} ${Math.abs(d)})^2 = ${base * base} ${d < 0 ? '-' : '+'} ${Math.abs(2 * base * d)} + ${d * d} = ${n * n}$$`,
    twin: () => mental(rng),
  };
}

export default {
  id: 'prodotti-notevoli',
  area: 'polinomi',
  years: [1, 2],
  mat: ['MAT_K1', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Prodotti notevoli',
  summary: 'Quadrati, cubi e somme per differenza, anche con le figure.',
  glyph: '(a+b)²',
  levels: [
    { name: 'Quadrato del binomio', desc: 'Il doppio prodotto che si dimentica' },
    { name: 'Somma per differenza', desc: 'E riconoscere i prodotti notevoli' },
    { name: 'Cubo e calcolo mentale', desc: 'Usare le regole per calcolare più in fretta' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Il quadrato di una somma, disegnato',
      body: 'Un quadrato di lato $a + b$ si divide in quattro pezzi: $a^2$, $b^2$ e due rettangoli $ab$. Per questo $$(a+b)^2 = a^2 + 2ab + b^2$$ e non $a^2 + b^2$.',
      fig: squareTiles(3, 2),
    };
    if (level === 1) return [learn, squareBinomial(rng), squareBinomial(rng), mental(rng), squareBinomial(rng), squareBinomial(rng)];
    if (level === 2) return [learn, sumDiff(rng), recognize(rng), sumDiff(rng), squareBinomial(rng), recognize(rng)];
    return [learn, cube(rng), mental(rng), cube(rng), recognize(rng), mental(rng)];
  },
};

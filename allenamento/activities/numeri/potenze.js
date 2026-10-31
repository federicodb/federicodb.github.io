// Proprietà delle potenze: risposte scritte come espressioni e verificate per equivalenza,
// più un controllo di forma ("scrivi come unica potenza").

const LETTERS = ['a', 'b', 'x', 'y', 'k'];

/** La risposta deve essere una sola potenza della lettera (o la lettera, o 1). */
const singlePower = (letter) => (t) => {
  const ok =
    (t.k === 'pow' && t.a.k === 'var' && t.a.v === letter && t.b.k === 'num') ||
    (t.k === 'var' && t.v === letter) ||
    (t.k === 'num' && t.v === 1);
  return ok ? null : `Il valore è giusto, ma scrivilo come un'unica potenza: $${letter}^{\\square}$.`;
};

/** Niente potenze di prodotti: (ab)^n va "aperta" */
const noPowerOfProduct = (t) => {
  const bad = (n) => (n.k === 'pow' && n.a.k === 'mul') || [n.a, n.b].some((c) => c && bad(c));
  return bad(t) ? 'Giusto, ma distribuisci l\'esponente su ogni fattore.' : null;
};

function product(rng) {
  const L = rng.pick(LETTERS);
  const m = rng.int(2, 9);
  const n = rng.intNot(2, 9, [m]);
  return {
    type: 'expr',
    cas: { given: `${L}^${m}*${L}^${n}` },
    prompt: `Scrivi come unica potenza: $$${L}^{${m}}\\cdot ${L}^{${n}}$$`,
    answer: `${L}^${m + n}`,
    form: singlePower(L),
    traps: [{ expr: `${L}^${m * n}`, msg: 'Gli esponenti si moltiplicano solo nella potenza di potenza. Qui la base è la stessa e si moltiplicano le potenze.' }],
    hint: `Scrivi per esteso: ${m} fattori ${L} per altri ${n} fattori ${L}. Quanti ${L} in tutto?`,
    explain: `$$${L}^{${m}}\\cdot ${L}^{${n}} = ${L}^{${m}+${n}} = ${L}^{${m + n}}$$ Stessa base: si tiene la base e si sommano gli esponenti.`,
    placeholder: `${L}^…`,
    twin: () => product(rng),
  };
}

function quotient(rng) {
  const L = rng.pick(LETTERS);
  const n = rng.int(2, 6);
  const m = n + rng.int(2, 7);
  const traps = [{ expr: `${L}^${m + n}`, msg: 'Nel quoziente gli esponenti si sottraggono, non si sommano.' }];
  if (m % n === 0 && m / n !== m - n) traps.push({ expr: `${L}^${m / n}`, msg: 'Gli esponenti non si dividono: si sottraggono.' });
  return {
    type: 'expr',
    cas: { given: `${L}^${m}/${L}^${n}` },
    prompt: `Scrivi come unica potenza: $$${L}^{${m}} : ${L}^{${n}}$$`,
    answer: `${L}^${m - n}`,
    form: singlePower(L),
    domain: 'positive',
    traps,
    hint: `Ogni ${L} al denominatore si semplifica con un ${L} al numeratore.`,
    explain: `$$${L}^{${m}} : ${L}^{${n}} = ${L}^{${m}-${n}} = ${L}^{${m - n}}$$`,
    placeholder: `${L}^…`,
    twin: () => quotient(rng),
  };
}

function numericExponent(rng) {
  const b = rng.pick([2, 3, 5, 10]);
  const m = rng.int(3, 12);
  const n = rng.int(2, 9);
  const op = rng.pick(['mul', 'div']);
  const exp = op === 'mul' ? m + n : m + n - n; // m+n : n  => m
  const left = op === 'mul' ? `${b}^{${m}}\\cdot ${b}^{${n}}` : `${b}^{${m + n}} : ${b}^{${n}}`;
  return {
    type: 'number',
    prompt: `Completa con l'esponente giusto: $$${left} = ${b}^{\\,?}$$`,
    answer: exp,
    powerBase: b,
    traps: op === 'mul' ? [{ value: m * n, msg: 'Gli esponenti si sommano, non si moltiplicano.' }] : [{ value: m + 2 * n, msg: 'Nel quoziente gli esponenti si sottraggono.' }],
    hint: op === 'mul' ? 'Stessa base, prodotto: somma gli esponenti.' : 'Stessa base, quoziente: sottrai gli esponenti.',
    explain: `$$${left} = ${b}^{${exp}}$$`,
    twin: () => numericExponent(rng),
  };
}

function powerOfPower(rng) {
  const L = rng.pick(LETTERS);
  const m = rng.int(2, 6);
  const n = rng.intNot(2, 5, [m]);
  return {
    type: 'expr',
    cas: { given: `(${L}^${m})^${n}` },
    prompt: `Scrivi come unica potenza: $$\\left(${L}^{${m}}\\right)^{${n}}$$`,
    answer: `${L}^${m * n}`,
    form: singlePower(L),
    traps: [{ expr: `${L}^${m + n}`, msg: `Qui ${L}^${m} è ripetuto ${n} volte: gli esponenti si moltiplicano.` }],
    hint: `$\\left(${L}^{${m}}\\right)^{${n}}$ vuol dire $${Array(n).fill(`${L}^{${m}}`).join('\\cdot ')}$.`,
    explain: `$$\\left(${L}^{${m}}\\right)^{${n}} = ${Array(n).fill(`${L}^{${m}}`).join('\\cdot ')} = ${L}^{${m}\\cdot ${n}} = ${L}^{${m * n}}$$`,
    placeholder: `${L}^…`,
    twin: () => powerOfPower(rng),
  };
}

function zeroExponent(rng) {
  const b = rng.pick([7, 13, 25, 2026, 99]);
  const m = rng.int(3, 9);
  return {
    type: 'choice',
    prompt: `Quanto vale $${b}^{${m}} : ${b}^{${m}}$?`,
    options: [
      { label: '$1$', correct: true },
      { label: '$0$', why: `L'esponente diventa 0, ma la potenza vale 1: un numero diviso per sé stesso fa 1.` },
      { label: `$${b}$`, why: 'Dividendo un numero per sé stesso non si ottiene il numero.' },
      { label: `$${b}^{${2 * m}}$`, why: 'Nel quoziente gli esponenti si sottraggono.' },
    ],
    explain: `Da una parte $${b}^{${m}} : ${b}^{${m}} = ${b}^{0}$, dall'altra un numero diviso per sé stesso fa $1$. Per questo si pone $${b}^0 = 1$.`,
    twin: () => zeroExponent(rng),
  };
}

function productPower(rng) {
  const [A, B] = rng.shuffle(LETTERS).slice(0, 2);
  const c = rng.pick([2, 3]);
  const n = rng.int(c === 2 ? 3 : 2, 7); // 2^2 = 2·2: si escludono i casi in cui l'errore tipico dà il risultato giusto
  return {
    type: 'expr',
    cas: { given: `(${c}*${A}*${B})^${n}` },
    prompt: `Togli le parentesi: $$\\left(${c}${A}${B}\\right)^{${n}}$$`,
    answer: `${c ** n}${A}^${n}${B}^${n}`,
    form: noPowerOfProduct,
    traps: [
      { expr: `${c}${A}^${n}${B}^${n}`, msg: `Anche il ${c} va elevato alla ${n}.` },
      { expr: `${c * n}${A}^${n}${B}^${n}`, msg: `${c} alla ${n} non è ${c}·${n}.` },
    ],
    hint: `L'esponente ${n} vale per ogni fattore: ${c}, ${A} e ${B}.`,
    explain: `$$\\left(${c}${A}${B}\\right)^{${n}} = ${c}^{${n}}${A}^{${n}}${B}^{${n}} = ${c ** n}${A}^{${n}}${B}^{${n}}$$`,
    twin: () => productPower(rng),
  };
}

function mixed(rng) {
  const L = rng.pick(LETTERS);
  const { m, n, p, q, k } = rng.until(
    () => {
      const m = rng.int(2, 6), n = rng.int(2, 6), p = rng.int(2, 4), q = rng.int(3, 20);
      return { m, n, p, q, k: (m + n) * p - q };
    },
    (x) => x.k >= 2 && x.k <= 20 && x.m * x.n !== x.m + x.n,
  );
  const traps = [{ expr: `${L}^${m * n * p - q}`, msg: `Dentro la parentesi c'è un prodotto: ${m} e ${n} si sommano.` }];
  if (m + n * p - q !== k) traps.unshift({ expr: `${L}^${m + n * p - q}`, msg: `L'esponente ${p} vale per tutta la parentesi: prima somma ${m}+${n}, poi moltiplica.` });
  return {
    type: 'expr',
    cas: { given: `(${L}^${m}*${L}^${n})^${p}/${L}^${q}` },
    prompt: `Semplifica: $$\\left(${L}^{${m}}\\cdot ${L}^{${n}}\\right)^{${p}} : ${L}^{${q}}$$`,
    answer: `${L}^${k}`,
    form: singlePower(L),
    domain: 'positive',
    traps,
    hint: 'Un passo alla volta: parentesi, poi potenza di potenza, poi quoziente.',
    explain: `$$\\left(${L}^{${m + n}}\\right)^{${p}} : ${L}^{${q}} = ${L}^{${(m + n) * p}} : ${L}^{${q}} = ${L}^{${k}}$$`,
    placeholder: `${L}^…`,
    twin: () => mixed(rng),
  };
}

function whichWrong(rng) {
  const L = rng.pick(LETTERS);
  const m = rng.int(2, 5), n = rng.intNot(2, 5, [m]);
  return {
    type: 'choice',
    prompt: 'Una sola di queste uguaglianze è sbagliata. Quale?',
    options: rng.shuffle([
      { label: `$${L}^{${m}}\\cdot ${L}^{${n}} = ${L}^{${m * n}}$`, correct: true },
      { label: `$\\left(${L}^{${m}}\\right)^{${n}} = ${L}^{${m * n}}$`, why: 'Questa è corretta: potenza di potenza, esponenti moltiplicati.' },
      { label: `$${L}^{${m + n}} : ${L}^{${n}} = ${L}^{${m}}$`, why: 'Questa è corretta: quoziente, esponenti sottratti.' },
      { label: `$${L}^{${m}}\\cdot ${L}^{0} = ${L}^{${m}}$`, why: `Questa è corretta: moltiplicare per $${L}^0 = 1$ non cambia nulla.` },
    ]),
    explain: `Nel prodotto di potenze con la stessa base gli esponenti si sommano: $${L}^{${m}}\\cdot ${L}^{${n}} = ${L}^{${m + n}}$, non $${L}^{${m * n}}$.`,
    twin: () => whichWrong(rng),
  };
}

export default {
  id: 'potenze',
  area: 'numeri',
  years: [1],
  mat: ['MAT_K1', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Proprietà delle potenze',
  summary: 'Prodotti, quozienti, potenze di potenze. Capire perché, non solo come.',
  glyph: 'aⁿ',
  levels: [
    { name: 'Stessa base', desc: 'Prodotto e quoziente di potenze' },
    { name: 'Potenze di potenze', desc: 'Esponente zero, potenza di un prodotto' },
    { name: 'Tutto insieme', desc: 'Espressioni con più proprietà' },
  ],
  generate(rng, level) {
    if (level === 1) {
      const m = rng.int(2, 4), n = rng.int(2, 3);
      return [
        {
          type: 'learn',
          title: 'Contare i fattori',
          body: `Una potenza è un prodotto ripetuto. $$a^{${m}}\\cdot a^{${n}} = \\underbrace{${Array(m).fill('a').join('\\cdot ')}}_{${m}}\\cdot\\underbrace{${Array(n).fill('a').join('\\cdot ')}}_{${n}} = a^{${m + n}}$$ Per questo, con la stessa base, nel prodotto gli esponenti si sommano.`,
        },
        product(rng),
        numericExponent(rng),
        quotient(rng),
        product(rng),
        quotient(rng),
      ];
    }
    if (level === 2) {
      return [
        {
          type: 'learn',
          title: 'Una potenza elevata a potenza',
          body: '$$\\left(a^{2}\\right)^{3} = a^{2}\\cdot a^{2}\\cdot a^{2} = a^{6}$$ La potenza $a^2$ è ripetuta 3 volte: gli esponenti si moltiplicano.',
        },
        powerOfPower(rng),
        zeroExponent(rng),
        productPower(rng),
        powerOfPower(rng),
        productPower(rng),
      ];
    }
    return [
      {
        type: 'learn',
        title: 'Un passo alla volta',
        body: 'Nelle espressioni con le potenze si procede come sempre: prima le parentesi, poi le potenze, poi prodotti e quozienti. Ad ogni passo usa una sola proprietà.',
      },
      mixed(rng),
      whichWrong(rng),
      mixed(rng),
      whichWrong(rng),
      mixed(rng),
    ];
  },
};

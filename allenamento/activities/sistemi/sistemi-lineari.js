import { poly, par, euro } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

const eqTex = (a, b, c) => `${poly([[a, 'x'], [b, 'y']])} = ${c}`;

function gen(rng) {
  return rng.until(() => {
    const X = rng.int(-5, 5), Y = rng.int(-5, 5);
    const a1 = rng.intNot(-4, 4), b1 = rng.intNot(-4, 4), a2 = rng.intNot(-4, 4), b2 = rng.intNot(-4, 4);
    return { X, Y, a1, b1, a2, b2, c1: a1 * X + b1 * Y, c2: a2 * X + b2 * Y };
  }, (v) => v.a1 * v.b2 - v.a2 * v.b1 !== 0 && (Math.abs(v.a1) === 1 || Math.abs(v.b1) === 1 || Math.abs(v.a2) === 1 || Math.abs(v.b2) === 1));
}

const lineOf = (a, b, c) => (x) => (c - a * x) / b;

function substitution(rng) {
  const s = gen(rng);
  return {
    type: 'numbers', ordered: true,
    cas: { system: [`${s.a1}*x+(${s.b1})*y=${s.c1}`, `${s.a2}*x+(${s.b2})*y=${s.c2}`] },
    prompt: `Risolvi il sistema: $$\\begin{cases} ${eqTex(s.a1, s.b1, s.c1)} \\\\ ${eqTex(s.a2, s.b2, s.c2)} \\end{cases}$$ Scrivi la soluzione come $(x;\\,y)$.`,
    answers: [s.X, s.Y],
    traps: [{ values: [s.Y, s.X], msg: 'Hai invertito x e y.' }],
    hint: 'Ricava da un\'equazione la variabile con coefficiente 1 (o −1) e sostituiscila nell\'altra.',
    explain: `La soluzione è $(${s.X};\\,${s.Y})$. Verifica: $${s.a1}\\cdot ${par(s.X)} + ${par(s.b1)}\\cdot ${par(s.Y)} = ${s.c1}$ e $${s.a2}\\cdot ${par(s.X)} + ${par(s.b2)}\\cdot ${par(s.Y)} = ${s.c2}$. Graficamente è il punto in cui le due rette si incontrano.`,
    explainFig: plane({ xmin: -7, xmax: 7, ymin: -7, ymax: 7, width: 280, height: 280, fns: [{ f: lineOf(s.a1, s.b1, s.c1) }, { f: lineOf(s.a2, s.b2, s.c2), cls: 'g-fn2' }], points: [{ x: s.X, y: s.Y, label: `(${s.X}; ${s.Y})` }] }),
    placeholder: '(x; y)',
    twin: () => substitution(rng),
  };
}

function graphical(rng) {
  const s = gen(rng);
  return {
    type: 'numbers', ordered: true,
    cas: { system: [`${s.a1}*x+(${s.b1})*y=${s.c1}`, `${s.a2}*x+(${s.b2})*y=${s.c2}`] },
    fig: plane({ xmin: -7, xmax: 7, ymin: -7, ymax: 7, width: 300, height: 300, fns: [{ f: lineOf(s.a1, s.b1, s.c1), label: 'r' }, { f: lineOf(s.a2, s.b2, s.c2), cls: 'g-fn2', label: 's' }], notableExcept: [s.X] }),
    prompt: 'Le rette $r$ e $s$ rappresentano un sistema. Leggi la soluzione dal grafico: $(x;\\,y)$.',
    answers: [s.X, s.Y],
    traps: [{ values: [s.Y, s.X], msg: 'Prima la coordinata x (orizzontale), poi la y.' }],
    hint: 'La soluzione è il punto comune alle due rette.',
    explain: `Le rette si incontrano in $(${s.X};\\,${s.Y})$: è l'unica coppia che soddisfa entrambe le equazioni $${eqTex(s.a1, s.b1, s.c1)}$ e $${eqTex(s.a2, s.b2, s.c2)}$.`,
    placeholder: '(x; y)',
    twin: () => graphical(rng),
  };
}

function kind(rng) {
  const t = rng.pick(['det', 'imp', 'ind']);
  const a = rng.intNot(-4, 4), b = rng.intNot(-4, 4), c = rng.int(-8, 8);
  const k = rng.intNot(-3, 3, [0, 1]);
  let a2, b2, c2;
  if (t === 'det') { a2 = rng.intNot(-4, 4); b2 = rng.until(() => rng.intNot(-4, 4), (v) => a * v - a2 * b !== 0); c2 = rng.int(-8, 8); }
  else if (t === 'imp') { a2 = k * a; b2 = k * b; c2 = k * c + rng.intNot(-4, 4); }
  else { a2 = k * a; b2 = k * b; c2 = k * c; }
  return {
    type: 'choice',
    prompt: `Il sistema $$\\begin{cases} ${eqTex(a, b, c)} \\\\ ${eqTex(a2, b2, c2)} \\end{cases}$$ è…`,
    options: [
      { label: 'determinato (una soluzione)', correct: t === 'det', why: t === 'det' ? undefined : 'I coefficienti di x e y sono proporzionali: le rette sono parallele o coincidenti.' },
      { label: 'impossibile (nessuna soluzione)', correct: t === 'imp', why: t === 'imp' ? undefined : t === 'det' ? 'Le rette hanno pendenze diverse: si incontrano.' : 'Anche i termini noti sono proporzionali: le rette coincidono.' },
      { label: 'indeterminato (infinite soluzioni)', correct: t === 'ind', why: t === 'ind' ? undefined : t === 'det' ? 'Le rette hanno pendenze diverse: si incontrano in un solo punto.' : 'I termini noti non sono proporzionali: le rette sono parallele distinte.' },
    ],
    fixedOrder: true,
    explain: t === 'det' ? 'I coefficienti non sono proporzionali: le rette si incontrano in un punto.' : t === 'imp' ? `La seconda equazione ha coefficienti ${k} volte quelli della prima, ma il termine noto no: rette parallele distinte.` : `La seconda equazione è la prima moltiplicata per ${k}: stessa retta, infinite soluzioni.`,
    explainFig: plane({ xmin: -7, xmax: 7, ymin: -7, ymax: 7, width: 260, height: 260, fns: [{ f: lineOf(a, b, c) }, { f: lineOf(a2, b2, c2), cls: 'g-fn2', dash: t === 'ind' }] }),
    twin: () => kind(rng),
  };
}

function problem(rng) {
  const ctx = rng.pick(['biglietti', 'snack', 'tavoli']);
  if (ctx === 'biglietti') {
    const pa = rng.pick([12, 15, 18]), pr = rng.pick([6, 8, 9, 10]);
    const A = rng.int(3, 15), Rr = rng.int(5, 25);
    return {
      type: 'numbers', ordered: true,
      prompt: `Per la gita al museo sono stati venduti ${A + Rr} biglietti, adulti a ${euro(pa)} e studenti a ${euro(pr)}, per un incasso di ${euro(A * pa + Rr * pr)}. Quanti adulti e quanti studenti? Scrivi (adulti; studenti).`,
      answers: [A, Rr],
      traps: [{ values: [Rr, A], msg: 'Prima gli adulti, poi gli studenti.' }],
      hint: `Con $a$ adulti e $s$ studenti: $a + s = ${A + Rr}$ e $${pa}a + ${pr}s = ${A * pa + Rr * pr}$.`,
      explain: `$$\\begin{cases} a + s = ${A + Rr} \\\\ ${pa}a + ${pr}s = ${A * pa + Rr * pr} \\end{cases}$$ Sostituendo $s = ${A + Rr} - a$: $${pa}a + ${pr}(${A + Rr} - a) = ${A * pa + Rr * pr}$, quindi $${pa - pr}a = ${A * pa + Rr * pr - pr * (A + Rr)}$, $a = ${A}$ e $s = ${Rr}$.`,
      placeholder: '(adulti; studenti)',
      twin: () => problem(rng),
    };
  }
  if (ctx === 'snack') {
    const x = rng.pick([1.5, 2, 2.5]), y = rng.pick([1, 1.2, 0.8]);
    const n1 = rng.int(1, 3), m1 = rng.int(1, 3), n2 = rng.int(1, 4), m2 = rng.until(() => rng.int(1, 4), (v) => n1 * v !== n2 * m1);
    return {
      type: 'numbers', ordered: true, decimals: 2,
      prompt: `Al distributore, ${n1} panini e ${m1} succhi costano ${euro(n1 * x + m1 * y)}; ${n2} panini e ${m2} succhi costano ${euro(n2 * x + m2 * y)}. Quanto costano un panino e un succo? Scrivi (panino; succo) in euro.`,
      answers: [x, y],
      traps: [{ values: [y, x], msg: 'Prima il panino, poi il succo.' }],
      hint: `$${n1}p + ${m1}s = ${String(n1 * x + m1 * y).replace('.', '{,}')}$ e $${n2}p + ${m2}s = ${String(n2 * x + m2 * y).replace('.', '{,}')}$.`,
      explain: `Risolvendo il sistema: panino ${euro(x)}, succo ${euro(y)}. Verifica: $${n1}\\cdot ${String(x).replace('.', '{,}')} + ${m1}\\cdot ${String(y).replace('.', '{,}')} = ${String(+(n1 * x + m1 * y).toFixed(2)).replace('.', '{,}')}$.`,
      placeholder: '(panino; succo)',
      twin: () => problem(rng),
    };
  }
  const t4 = rng.int(2, 9), t6 = rng.int(2, 9);
  return {
    type: 'numbers', ordered: true,
    prompt: `Nella sala ci sono ${t4 + t6} tavoli, alcuni da 4 posti e altri da 6, per un totale di ${4 * t4 + 6 * t6} posti. Quanti sono i tavoli da 4 e quanti da 6? Scrivi (da 4; da 6).`,
    answers: [t4, t6],
    traps: [{ values: [t6, t4], msg: 'Prima i tavoli da 4, poi quelli da 6.' }],
    hint: `$q + s = ${t4 + t6}$ e $4q + 6s = ${4 * t4 + 6 * t6}$.`,
    explain: `Se fossero tutti da 4: $${4 * (t4 + t6)}$ posti. Mancano $${6 * t6 - 0 + 4 * t4 - 4 * (t4 + t6)}$ posti, 2 per ogni tavolo da 6: i tavoli da 6 sono ${t6} e quelli da 4 sono ${t4}.`,
    placeholder: '(da 4; da 6)',
    twin: () => problem(rng),
  };
}

export default {
  id: 'sistemi-lineari',
  area: 'sistemi',
  years: [2],
  mat: ['MAT_A3', 'MAT_C2'],
  ambito: 'Relazioni e funzioni',
  title: 'Sistemi lineari',
  summary: 'Due equazioni, due incognite, due rette.',
  glyph: '{ }',
  levels: [
    { name: 'Il punto d\'incontro', desc: 'Metodo grafico e tipi di sistema' },
    { name: 'Sostituzione', desc: 'Risolvere con l\'algebra' },
    { name: 'Problemi', desc: 'Biglietti, prezzi, posti a sedere' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Due condizioni insieme',
      body: 'Ogni equazione di primo grado in x e y è una retta. Risolvere il sistema vuol dire trovare il punto che sta su entrambe. Trascina i punti per muovere la retta blu e guarda dove incontra quella fissa.',
      board: {
        bbox: [-7, 7, 7, -7],
        alt: 'Due rette, una con punti trascinabili, e il loro punto di intersezione',
        build: (brd, JXG, t) => {
          const l1 = brd.create('line', [[-4, -3], [4, 1]], { strokeColor: t.series[1], strokeWidth: 3, fixed: true, straightFirst: true, straightLast: true });
          const p = brd.create('point', [-3, 4], { name: 'P', color: t.series[0], size: 5, snapToGrid: true });
          const q = brd.create('point', [3, -2], { name: 'Q', color: t.series[0], size: 5, snapToGrid: true });
          const l2 = brd.create('line', [p, q], { strokeColor: t.series[0], strokeWidth: 3 });
          brd.create('intersection', [l1, l2, 0], { name: () => '', color: t.series[2], size: 5 });
        },
      },
      fig: plane({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, width: 260, height: 260, fns: [{ f: (x) => 0.5 * x - 1 }, { f: (x) => -x + 2, cls: 'g-fn2' }], points: [{ x: 2, y: 0, label: '(2; 0)' }] }),
      figFallbackOnly: true,
    };
    if (level === 1) return [learn, graphical(rng), kind(rng), graphical(rng), kind(rng), graphical(rng)];
    if (level === 2) return [learn, substitution(rng), substitution(rng), kind(rng), substitution(rng), substitution(rng)];
    return [learn, problem(rng), substitution(rng), problem(rng), problem(rng), kind(rng)];
  },
};

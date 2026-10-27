// EQUAZIONI DI PRIMO GRADO CON COEFFICIENTI "SPECIALI": frazionari, irrazionali,
// e prodotti notevoli in cui i termini di secondo grado si eliminano.
// Le soluzioni sono sempre numeri piccoli; con i radicali si razionalizza.
import { poly, frac, gcd, par } from '../../js/engine/helpers.js';

const lcm = (a, b) => (a / gcd(a, b)) * b;
const sgnTerm = (n, lit = '') => (n < 0 ? `- ${Math.abs(n)}${lit}` : `+ ${n}${lit}`);
const xb = (b) => poly([[1, 'x'], [b, '']]);           // x + b

// ---------- livello 1: coefficienti frazionari ----------
/** x/a + x/b = c */
function fracSum(rng) {
  const { a, b } = rng.until(() => ({ a: rng.int(2, 6), b: rng.int(2, 6) }), (v) => v.a < v.b && lcm(v.a, v.b) <= 12);
  const L = lcm(a, b), x = L * rng.intNot(-3, 3), c = x / a + x / b;
  return {
    type: 'number',
    cas: { solve: `x/${a}+x/${b}=${c}` },
    prompt: `Risolvi: $$\\dfrac{x}{${a}} + \\dfrac{x}{${b}} = ${c}$$ $x = $`,
    answer: x,
    // errore tipico: x/a + x/b scritto come 2x/(a + b)
    traps: [{ value: (c * (a + b)) / 2, msg: 'I denominatori non si sommano: moltiplica entrambi i membri per il m.c.m.' }].filter((t) => Math.abs(t.value - x) > 1e-9),
    hint: `Moltiplica entrambi i membri per ${L}, il m.c.m. dei denominatori.`,
    explain: `Si moltiplica tutto per ${L}: $$${L / a}x + ${L / b}x = ${c * L} \\;\\Rightarrow\\; ${L / a + L / b}x = ${c * L} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => fracSum(rng),
  };
}

/** (p/q)·x + c = d   con x multiplo di q */
function fracCoef(rng) {
  const { p, q } = rng.until(() => ({ p: rng.intNot(-5, 5, [0]), q: rng.int(2, 6) }), (v) => gcd(Math.abs(v.p), v.q) === 1);
  const x = q * rng.intNot(-3, 3), c = rng.intNot(-9, 9), d = (p * x) / q + c;
  return {
    type: 'number',
    cas: { solve: `(${p}/${q})*x+(${c})=${d}` },
    prompt: `Risolvi: $$${frac(p, q)}\\,x ${sgnTerm(c)} = ${d}$$ $x = $`,
    answer: x,
    traps: [{ value: ((d - c) * p) / q, msg: `Per liberare la x si moltiplica per l'inversa di $${frac(p, q)}$, cioè $${frac(q, p)}$.` }].filter((t) => Math.abs(t.value - x) > 1e-9),
    hint: `Prima porta ${par(c)} a destra, poi moltiplica per $${frac(q, p)}$.`,
    explain: `$$${frac(p, q)}\\,x = ${d - c} \\;\\Rightarrow\\; x = ${d - c}\\cdot ${p < 0 ? `\\left(${frac(q, p)}\\right)` : frac(q, p)} = ${x}$$`,
    twin: () => fracCoef(rng),
  };
}

/** (x + p)/a = (x + r)/b */
function fracBinom(rng) {
  const v = rng.until(
    () => ({ a: rng.int(2, 5), b: rng.int(2, 6), x: rng.intNot(-9, 9), p: rng.intNot(-6, 6) }),
    (w) => w.a !== w.b && ((w.b * (w.x + w.p)) % w.a === 0),
  );
  // b(x + p) = a(x + r)  →  r = b(x + p)/a − x
  const r = (v.b * (v.x + v.p)) / v.a - v.x;
  if (r === 0 || Math.abs(r) > 12) return fracBinom(rng);
  const L = lcm(v.a, v.b);
  return {
    type: 'number',
    cas: { solve: `(x+(${v.p}))/${v.a}=(x+(${r}))/${v.b}` },
    prompt: `Risolvi: $$\\dfrac{${xb(v.p)}}{${v.a}} = \\dfrac{${xb(r)}}{${v.b}}$$ $x = $`,
    answer: v.x,
    hint: `Moltiplica entrambi i membri per ${L}: ogni numeratore va moltiplicato tutto (parentesi!).`,
    explain: `Per ${L}: $$${L / v.a}\\left(${xb(v.p)}\\right) = ${L / v.b}\\left(${xb(r)}\\right) \\;\\Rightarrow\\; ${poly([[L / v.a, 'x'], [(L / v.a) * v.p, '']])} = ${poly([[L / v.b, 'x'], [(L / v.b) * r, '']])} \\;\\Rightarrow\\; x = ${v.x}$$`,
    twin: () => fracBinom(rng),
  };
}

function whichLcm(rng) {
  // coppie in cui nessun denominatore è già multiplo dell'altro (altrimenti un'opzione sbagliata coinciderebbe con il m.c.m.)
  const [a, b] = rng.pick([[2, 3], [3, 4], [4, 6], [2, 5], [6, 4], [4, 10]]);
  const L = lcm(a, b), wrong = a * b === L ? a + b : a * b;
  return {
    type: 'choice',
    prompt: `Per eliminare i denominatori in $\\dfrac{x}{${a}} - \\dfrac{x + 1}{${b}} = 1$, per quale numero conviene moltiplicare entrambi i membri?`,
    options: [
      { label: `$${L}$`, correct: true },
      { label: `$${wrong}$`, why: wrong === a * b ? 'Funziona, ma non è il più piccolo: i conti diventano più grandi del necessario.' : 'La somma dei denominatori non è un multiplo di entrambi.' },
      { label: `$${Math.max(a, b)}$`, why: `Non è multiplo di ${Math.min(a, b)}: un denominatore resterebbe.` },
    ],
    explain: `Si usa il minimo comune multiplo dei denominatori: m.c.m.$(${a}, ${b}) = ${L}$. Attenzione al segno meno davanti alla seconda frazione: cambia il segno di tutto il numeratore.`,
    twin: () => whichLcm(rng),
  };
}

// ---------- livello 2: coefficienti irrazionali ----------
const RAD = [2, 3, 5];
const sq = (k) => `\\sqrt{${k}}`;

/** √k · x = m  →  x = m/√k = (m/k)√k   (m multiplo di k: risultato "pulito") */
function radSimple(rng) {
  const k = rng.pick(RAD), t = rng.intNot(-4, 4), m = k * t;
  const val = m / Math.sqrt(k);
  return {
    type: 'number',
    cas: { eval: `${m}/sqrt(${k})` },
    prompt: `Risolvi e razionalizza: $$${sq(k)}\\,x = ${m}$$ $x = $`,
    answer: val,
    traps: [{ value: m / k, msg: `Si divide per $${sq(k)}$, non per ${k}.` }, { value: m * Math.sqrt(k), msg: `Per liberare la x si divide per $${sq(k)}$, non si moltiplica.` }],
    hint: `Dividi per $${sq(k)}$, poi moltiplica numeratore e denominatore per $${sq(k)}$.`,
    explain: `$$x = \\dfrac{${m}}{${sq(k)}} = \\dfrac{${m}\\,${sq(k)}}{${k}} = ${t === 1 ? '' : t === -1 ? '-' : t}${sq(k)}$$`,
    placeholder: 'ad es. 3√2',
    twin: () => radSimple(rng),
  };
}

/** √k · x + c = d */
function radTwoSteps(rng) {
  const k = rng.pick(RAD), t = rng.intNot(-3, 3), c = rng.intNot(-9, 9), d = k * t + c;
  return {
    type: 'number',
    cas: { eval: `(${d}-(${c}))/sqrt(${k})` },
    prompt: `Risolvi e razionalizza: $$${sq(k)}\\,x ${sgnTerm(c)} = ${d}$$ $x = $`,
    answer: (d - c) / Math.sqrt(k),
    traps: [{ value: (d + c) / Math.sqrt(k), msg: `Portando ${par(c)} a destra il segno cambia.` }].filter((tr) => tr.value !== (d - c) / Math.sqrt(k)),
    hint: 'Prima porta il numero a destra, poi dividi per il radicale.',
    explain: `$$${sq(k)}\\,x = ${d - c} \\;\\Rightarrow\\; x = \\dfrac{${d - c}}{${sq(k)}} = \\dfrac{${d - c}\\,${sq(k)}}{${k}} = ${t === 1 ? '' : t === -1 ? '-' : t}${sq(k)}$$`,
    placeholder: 'ad es. -2√3',
    twin: () => radTwoSteps(rng),
  };
}

/** √k · x − x = m  →  x(√k − 1) = m  →  razionalizzazione con il coniugato */
function radConjugate(rng) {
  const k = rng.pick([2, 3, 5]), den = k - 1;                // (√k − 1)(√k + 1) = k − 1
  const m = den * rng.int(1, 3);
  const val = m / (Math.sqrt(k) - 1), c = m / den;
  return {
    type: 'number',
    cas: { eval: `${m}/(sqrt(${k})-1)` },
    prompt: `Risolvi e razionalizza: $$${sq(k)}\\,x - x = ${m}$$ $x = $`,
    answer: val,
    traps: [{ value: m / Math.sqrt(k), msg: `Non si può "togliere" la x: si raccoglie, $x(${sq(k)} - 1)$.` }],
    hint: `Raccogli la x: $x\\left(${sq(k)} - 1\\right) = ${m}$. Per razionalizzare moltiplica per il coniugato $${sq(k)} + 1$.`,
    explain: `$$x = \\dfrac{${m}}{${sq(k)} - 1}\\cdot\\dfrac{${sq(k)} + 1}{${sq(k)} + 1} = \\dfrac{${m}\\left(${sq(k)} + 1\\right)}{${k} - 1} = ${c === 1 ? '' : c}\\left(${sq(k)} + 1\\right)$$`,
    placeholder: 'ad es. 2(√3+1)',
    twin: () => radConjugate(rng),
  };
}

/** x√k + √(k s²) = t√k : prima si semplifica il radicale */
function radSimplify(rng) {
  const k = rng.pick([2, 3]), s = rng.int(2, 3), x = rng.intNot(-4, 4, [0]), t = x + s;
  if (t === 0) return radSimplify(rng);
  return {
    type: 'number',
    cas: { eval: `(${t}*sqrt(${k})-sqrt(${k * s * s}))/sqrt(${k})` },
    prompt: `Risolvi: $$${sq(k)}\\,x + \\sqrt{${k * s * s}} = ${t === 1 ? '' : t === -1 ? '-' : t}${sq(k)}$$ $x = $`,
    answer: x,
    hint: `Semplifica: $\\sqrt{${k * s * s}} = ${s}${sq(k)}$. Poi dividi tutto per $${sq(k)}$.`,
    explain: `$$${sq(k)}\\,x + ${s}${sq(k)} = ${t}${sq(k)} \\;\\Rightarrow\\; x + ${s} = ${t} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => radSimplify(rng),
  };
}

// ---------- livello 3: prodotti notevoli, i termini in x² si eliminano ----------
/** (x + a)² − (x + b)² = c */
function pnDiff(rng) {
  const { a, b, x } = rng.until(() => ({ a: rng.intNot(-5, 5), b: rng.intNot(-5, 5), x: rng.intNot(-6, 6) }), (v) => v.a !== v.b && v.a !== -v.b);
  const c = 2 * (a - b) * x + a * a - b * b;
  return {
    type: 'number',
    cas: { solve: `(x+(${a}))^2-(x+(${b}))^2=${c}` },
    prompt: `Risolvi: $$\\left(${xb(a)}\\right)^2 - \\left(${xb(b)}\\right)^2 = ${c}$$ $x = $`,
    answer: x,
    hint: 'Sviluppa i due quadrati: i termini $x^2$ si eliminano. Attenzione al meno davanti al secondo quadrato.',
    explain: `$$${poly([[1, 'x^2'], [2 * a, 'x'], [a * a, '']])} - \\left(${poly([[1, 'x^2'], [2 * b, 'x'], [b * b, '']])}\\right) = ${c}$$ $$${poly([[2 * (a - b), 'x'], [a * a - b * b, '']])} = ${c} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => pnDiff(rng),
  };
}

/** (x + a)(x − a) − x(x + b) = c */
function pnConj(rng) {
  const { a, b, x } = rng.until(() => ({ a: rng.int(1, 5), b: rng.intNot(-6, 6), x: rng.intNot(-7, 7) }), () => true);
  const c = -a * a - b * x;
  return {
    type: 'number',
    cas: { solve: `(x+${a})*(x-${a})-x*(x+(${b}))=${c}` },
    prompt: `Risolvi: $$(x + ${a})(x - ${a}) - x\\left(${xb(b)}\\right) = ${c}$$ $x = $`,
    answer: x,
    traps: [{ value: (c - a * a) / -b, msg: `$(x + ${a})(x - ${a}) = x^2 - ${a * a}$: il quadrato di ${a} va sottratto.` }].filter((t) => Number.isFinite(t.value) && Math.abs(t.value - x) > 1e-9),
    hint: 'Somma per differenza: $x^2 - a^2$. Poi distribuisci il meno su tutto $x(x + b)$.',
    explain: `$$x^2 - ${a * a} - x^2 ${b < 0 ? '+' : '-'} ${Math.abs(b)}x = ${c} \\;\\Rightarrow\\; ${poly([[-b, 'x']])} = ${c + a * a} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => pnConj(rng),
  };
}

/** (x − a)² = x² + c */
function pnSquareEq(rng) {
  const { a, x } = rng.until(() => ({ a: rng.int(1, 6), x: rng.intNot(-6, 6) }), () => true);
  const c = a * a - 2 * a * x;
  return {
    type: 'number',
    cas: { solve: `(x-${a})^2=x^2+(${c})` },
    prompt: `Risolvi: $$(x - ${a})^2 = x^2 ${sgnTerm(c)}$$ $x = $`,
    answer: x,
    traps: [{ value: (a * a - c) / a, msg: `Nel quadrato di binomio c'è il doppio prodotto: $-2\\cdot ${a}\\cdot x = -${2 * a}x$.` }].filter((t) => Math.abs(t.value - x) > 1e-9),
    hint: 'Sviluppa il quadrato: $x^2$ compare in entrambi i membri e si elimina.',
    explain: `$$x^2 - ${2 * a}x + ${a * a} = x^2 ${sgnTerm(c)} \\;\\Rightarrow\\; -${2 * a}x = ${c - a * a} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => pnSquareEq(rng),
  };
}

/** (2x + a)² − 4x(x + b) = c */
function pnCoeff(rng) {
  const { a, b, x } = rng.until(() => ({ a: rng.intNot(-4, 4), b: rng.intNot(-4, 4), x: rng.intNot(-5, 5) }), (v) => v.a !== v.b);
  const c = 4 * (a - b) * x + a * a;
  return {
    type: 'number',
    cas: { solve: `(2*x+(${a}))^2-4*x*(x+(${b}))=${c}` },
    prompt: `Risolvi: $$\\left(${poly([[2, 'x'], [a, '']])}\\right)^2 - 4x\\left(${xb(b)}\\right) = ${c}$$ $x = $`,
    answer: x,
    hint: '$(2x + a)^2 = 4x^2 + 4ax + a^2$: il termine $4x^2$ si elimina con quello di $4x(x + b)$.',
    explain: `$$4x^2 ${sgnTerm(4 * a, 'x')} + ${a * a} - 4x^2 ${sgnTerm(-4 * b, 'x')} = ${c} \\;\\Rightarrow\\; ${poly([[4 * (a - b), 'x']])} = ${c - a * a} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => pnCoeff(rng),
  };
}

/** Determinata, impossibile o indeterminata? */
function pnKind(rng) {
  const a = rng.int(1, 5);
  const kind = rng.pick(['det', 'imp', 'ind']);
  const rhs = kind === 'ind' ? poly([[2 * a, 'x'], [a * a, '']]) : kind === 'imp' ? poly([[2 * a, 'x'], [a * a + rng.intNot(-3, 3), '']]) : poly([[rng.pick([1, 3]) * a, 'x'], [a * a, '']]);
  const label = { det: 'Determinata: una sola soluzione', imp: 'Impossibile: nessuna soluzione', ind: 'Indeterminata: ogni numero è soluzione' };
  return {
    type: 'choice',
    prompt: `Che tipo di equazione è $(x + ${a})^2 - x^2 = ${rhs}$?`,
    options: ['det', 'imp', 'ind'].map((k) => ({ label: label[k], correct: k === kind, why: k === kind ? undefined : 'Sviluppa e porta tutto a sinistra: guarda cosa resta.' })),
    fixedOrder: true,
    explain: `A sinistra resta $${2 * a}x + ${a * a}$. ${kind === 'ind' ? 'I due membri sono identici: $0 = 0$ per ogni x.' : kind === 'imp' ? 'Le x si eliminano e resta un\'uguaglianza falsa tra numeri: nessuna soluzione.' : 'I coefficienti della x sono diversi: c\'è una sola soluzione.'}`,
    twin: () => pnKind(rng),
  };
}

export default {
  id: 'equazioni-1-speciali',
  area: 'equazioni',
  years: [1, 2],
  mat: ['MAT_A3', 'MAT_K1'],
  ambito: 'Relazioni e funzioni',
  title: 'Equazioni di primo grado: oltre gli interi',
  summary: 'Coefficienti frazionari e irrazionali, prodotti notevoli che si semplificano.',
  glyph: '½x',
  levels: [
    { name: 'Coefficienti frazionari', desc: 'Il m.c.m. dei denominatori elimina le frazioni' },
    { name: 'Coefficienti irrazionali', desc: 'Dividere per un radicale e razionalizzare' },
    { name: 'Con i prodotti notevoli', desc: 'I termini in x² si eliminano: resta un\'equazione di primo grado' },
  ],
  generate(rng, level) {
    if (level === 1) return [
      { type: 'learn', title: 'Via i denominatori', body: 'Se moltiplichi <b>entrambi i membri</b> per il m.c.m. dei denominatori, le frazioni spariscono e l\'equazione diventa a coefficienti interi: $$\\dfrac{x}{2} + \\dfrac{x}{3} = 5 \\;\\xrightarrow{\\cdot 6}\\; 3x + 2x = 30$$' },
      fracCoef(rng), fracSum(rng), whichLcm(rng), fracBinom(rng), fracSum(rng)];
    if (level === 2) return [
      { type: 'learn', title: 'Un radicale come coefficiente', body: 'Si risolve come sempre, dividendo per il coefficiente della x. Poi si <b>razionalizza</b>: $$\\sqrt{2}\\,x = 6 \\;\\Rightarrow\\; x = \\dfrac{6}{\\sqrt{2}} = \\dfrac{6\\sqrt{2}}{2} = 3\\sqrt{2}$$ Per scrivere la risposta usa il tasto √ (3√2) oppure, dalla tastiera del computer, <b>3 radice di 2</b> o <b>3sqrt(2)</b>.' },
      radSimple(rng), radTwoSteps(rng), radSimplify(rng), radConjugate(rng), radSimple(rng)];
    return [
      { type: 'learn', title: 'Sembra di secondo grado… ma non lo è', body: 'Sviluppando i prodotti notevoli i termini $x^2$ spesso si eliminano: $$(x + 3)^2 - (x - 1)^2 = 16 \\;\\Rightarrow\\; 8x + 8 = 16 \\;\\Rightarrow\\; x = 1$$ Attenzione al meno davanti a una parentesi: cambia segno a <b>tutti</b> i termini.' },
      pnSquareEq(rng), pnDiff(rng), pnConj(rng), pnKind(rng), pnCoeff(rng), pnDiff(rng)];
  },
};

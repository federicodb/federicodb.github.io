import { poly, par } from '../../js/engine/helpers.js';
import { factorsOf } from '../../js/engine/check.js';
import { variables } from '../../js/engine/expr.js';

const L = ['a', 'b', 'x', 'y'];
const mono = (c, parts) => {
  // parts: [[lettera, esponente]]
  const lit = parts.filter(([, e]) => e > 0).map(([v, e]) => (e === 1 ? v : `${v}^{${e}}`)).join('');
  if (!lit) return String(c);
  return (c === 1 ? '' : c === -1 ? '-' : String(c)) + lit;
};
const monoAns = (c, parts) => {
  const lit = parts.filter(([, e]) => e > 0).map(([v, e]) => (e === 1 ? v : `${v}^${e}`)).join('*');
  return lit ? `${c}*${lit}` : String(c);
};
// un solo monomio: coefficiente per potenze di lettere diverse
function flat(t) {
  if (t.k === 'mul') return [...flat(t.a), ...flat(t.b)];
  if (t.k === 'neg') return flat(t.a);
  return [t];
}
function singleMonomial(tree) {
  const fs = flat(tree);
  const seen = new Set();
  let nums = 0;
  for (const f of fs) {
    if (f.k === 'num') { nums++; continue; }
    const v = f.k === 'var' ? f.v : f.k === 'pow' && f.a.k === 'var' && f.b.k === 'num' ? f.a.v : null;
    if (!v) return 'Il valore è giusto, ma scrivi il risultato come un unico monomio.';
    if (seen.has(v)) return `Il valore è giusto, ma la lettera ${v} compare due volte: riuniscila in una sola potenza.`;
    seen.add(v);
  }
  return nums > 1 ? 'Il valore è giusto, ma moltiplica tra loro i coefficienti.' : null;
}

function degree(rng) {
  const [u, v] = rng.shuffle(L).slice(0, 2);
  const e1 = rng.int(1, 5), e2 = rng.int(1, 4);
  const c = rng.intNot(-9, 9);
  return {
    type: 'number',
    prompt: `Qual è il grado del monomio $${mono(c, [[u, e1], [v, e2]])}$?`,
    answer: e1 + e2,
    traps: [{ value: Math.max(e1, e2), msg: 'Il grado di un monomio è la somma degli esponenti di tutte le lettere.' }, { value: Math.abs(c), msg: 'Il coefficiente non conta per il grado.' }],
    hint: 'Somma gli esponenti delle lettere.',
    explain: `Esponenti: ${e1} per $${u}$ e ${e2} per $${v}$. Grado $= ${e1} + ${e2} = ${e1 + e2}$.`,
    twin: () => degree(rng),
  };
}

function similarSum(rng) {
  const [u, v] = rng.shuffle(L).slice(0, 2);
  const e = rng.int(1, 3);
  const a = rng.intNot(-9, 9), b = rng.intNot(-9, 9, [0, -a]), c = rng.intNot(-6, 6);
  const parts = [[u, e], [v, 1]];
  const tot = a + b + c;
  return {
    type: 'expr',
    prompt: `Semplifica: $$${poly([[a, mono(1, parts)], [b, mono(1, parts)], [c, mono(1, parts)]])}$$`,
    answer: monoAns(tot, parts),
    form: tot === 0 ? null : singleMonomial,
    traps: [{ expr: `${tot}*${u}^${3 * e}*${v}^3`, msg: 'Nella somma di monomi simili la parte letterale resta uguale: si sommano solo i coefficienti.' }],
    hint: 'I monomi sono simili: somma solo i coefficienti.',
    explain: `$$(${a} ${b < 0 ? '-' : '+'} ${Math.abs(b)} ${c < 0 ? '-' : '+'} ${Math.abs(c)})\\,${mono(1, parts)} = ${mono(tot, parts)}$$`,
    twin: () => similarSum(rng),
  };
}

function productMono(rng) {
  const [u, v] = rng.shuffle(L).slice(0, 2);
  const a = rng.intNot(-6, 6, [0, 1, -1]), b = rng.intNot(-6, 6, [0, 1, -1]);
  const e1 = rng.int(1, 4), e2 = rng.int(1, 4), f1 = rng.int(1, 3), f2 = rng.int(0, 3);
  const res = [[u, e1 + f1], [v, e2 + f2]];
  return {
    type: 'expr',
    cas: { given: `(${monoAns(a, [[u, e1], [v, e2]])})*(${monoAns(b, [[u, f1], [v, f2]])})` },
    prompt: `Calcola: $$\\left(${mono(a, [[u, e1], [v, e2]])}\\right)\\cdot\\left(${mono(b, [[u, f1], [v, f2]])}\\right)$$`,
    answer: monoAns(a * b, res),
    form: singleMonomial,
    traps: [{ expr: monoAns(a * b, [[u, e1 * f1], [v, e2 * Math.max(f2, 1)]]), msg: 'Nel prodotto gli esponenti della stessa lettera si sommano.' }, { expr: monoAns(-a * b, res), msg: 'Controlla la regola dei segni.' }],
    hint: 'Moltiplica i coefficienti, poi per ogni lettera somma gli esponenti.',
    explain: `Coefficiente: $${par(a)}\\cdot ${par(b)} = ${a * b}$. $${u}$: $${e1}+${f1} = ${e1 + f1}$; $${v}$: $${e2}+${f2} = ${e2 + f2}$. $$${mono(a * b, res)}$$`,
    twin: () => productMono(rng),
  };
}

function powerMono(rng) {
  const [u, v] = rng.shuffle(L).slice(0, 2);
  const a = rng.intNot(-3, 3, [0, 1]);
  const e1 = rng.int(1, 3), e2 = rng.int(1, 3), n = rng.int(2, 3);
  return {
    type: 'expr',
    cas: { given: `(${monoAns(a, [[u, e1], [v, e2]])})^${n}` },
    prompt: `Calcola: $$\\left(${mono(a, [[u, e1], [v, e2]])}\\right)^{${n}}$$`,
    answer: monoAns(a ** n, [[u, e1 * n], [v, e2 * n]]),
    form: singleMonomial,
    traps: [{ expr: monoAns(a * n, [[u, e1 * n], [v, e2 * n]]), msg: `Il coefficiente va elevato alla ${n}, non moltiplicato per ${n}.` }, { expr: monoAns(a ** n, [[u, e1 + n], [v, e2 + n]]), msg: 'Potenza di potenza: gli esponenti si moltiplicano.' }],
    hint: 'Ogni fattore del monomio va elevato all\'esponente.',
    explain: `$$${par(a)}^{${n}} = ${a ** n}, \\quad (${u}^{${e1}})^{${n}} = ${u}^{${e1 * n}}, \\quad (${v}^{${e2}})^{${n}} = ${v}^{${e2 * n}}$$`,
    twin: () => powerMono(rng),
  };
}

function evaluate(rng) {
  const a = rng.intNot(-4, 4), b = rng.intNot(-6, 6), c = rng.int(-9, 9);
  const x = rng.intNot(-3, 3);
  const val = a * x * x + b * x + c;
  return {
    type: 'number',
    prompt: `Calcola il valore di $${poly([[a, 'x^2'], [b, 'x'], [c, '']])}$ per $x = ${x}$.`,
    answer: val,
    traps: [{ value: -a * x * x + b * x + c, msg: `Attenzione: $(${x})^2$ è positivo anche se $x$ è negativo.` }],
    hint: 'Sostituisci la x con il valore tra parentesi e rispetta le precedenze.',
    explain: `$$${a}\\cdot (${x})^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\cdot (${x}) ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${a * x * x} ${b * x < 0 ? '-' : '+'} ${Math.abs(b * x)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${val}$$`,
    twin: () => evaluate(rng),
  };
}

function polySum(rng) {
  const a = [rng.intNot(-5, 5), rng.int(-7, 7), rng.int(-9, 9)];
  const b = [rng.intNot(-5, 5, [0, -a[0]]), rng.int(-7, 7), rng.int(-9, 9)];
  const minus = rng.chance(0.5);
  const s = a.map((v, i) => (minus ? v - b[i] : v + b[i]));
  return {
    type: 'expr',
    prompt: `Calcola: $$\\left(${poly([[a[0], 'x^2'], [a[1], 'x'], [a[2], '']])}\\right) ${minus ? '-' : '+'} \\left(${poly([[b[0], 'x^2'], [b[1], 'x'], [b[2], '']])}\\right)$$`,
    answer: `${s[0]}x^2 + ${par(s[1])}x + ${par(s[2])}`,
    traps: minus ? [{ expr: `${a[0] - b[0]}x^2 + ${par(a[1] + b[1])}x + ${par(a[2] + b[2])}`, msg: 'Il meno davanti alla parentesi cambia il segno di tutti i termini, non solo del primo.' }] : [],
    hint: minus ? 'Togli la seconda parentesi cambiando il segno a ogni termine.' : 'Somma i termini simili: x² con x², x con x, numeri con numeri.',
    explain: `$$${poly([[s[0], 'x^2'], [s[1], 'x'], [s[2], '']])}$$`,
    twin: () => polySum(rng),
  };
}

/** Smista: monomi simili a quello dato oppure no */
function binsSimilar(rng) {
  const [u, v] = rng.shuffle(['a', 'b', 'x', 'y']).slice(0, 2);
  const e1 = rng.int(1, 3), e2 = rng.int(1, 2);
  const parts = [[u, e1], [v, e2]];
  const c0 = rng.pick([2, 3, 4, 5, -2, -3]);
  const coeff = () => rng.pick([2, 3, 5, 7, -1, -4, -6, 8]);
  const similar = [0, 1, 2].map(() => ({ label: `$${mono(coeff(), rng.chance(0.5) ? parts : [parts[1], parts[0]])}$`, bin: 'si' }));
  const wrongs = [
    [[u, e1 + 1], [v, e2]], [[u, e1], [v, e2 + 1]], [[u, e2], [v, e1]], [[u, e1]], [[u, e1], [v, e2], [rng.pick(['z', 'c']), 1]],
  ].filter((p) => mono(1, p) !== mono(1, parts) && !(p.length === 2 && p[0][1] === e1 && p[1][1] === e2));
  const different = rng.shuffle(wrongs).slice(0, 3).map((p) => ({ label: `$${mono(coeff(), p)}$`, bin: 'no' }));
  const items = similar.concat(different).filter((x, i, arr) => arr.findIndex((y) => y.label === x.label) === i);
  return {
    type: 'bins',
    prompt: `Smista i monomi: quali sono simili a $${mono(c0, parts)}$?`,
    bins: [{ id: 'si', label: 'Simili', plain: 'Simili' }, { id: 'no', label: 'Non simili', plain: 'Non simili' }],
    items,
    hint: 'Due monomi sono simili se hanno la stessa parte letterale: stesse lettere con gli stessi esponenti. Il coefficiente non conta.',
    explain: `La parte letterale di $${mono(c0, parts)}$ è $${mono(1, parts)}$. Sono simili solo i monomi con esattamente $${mono(1, parts)}$, in qualunque ordine e con qualunque coefficiente.`,
    twin: () => binsSimilar(rng),
  };
}

export default {
  id: 'monomi',
  area: 'polinomi',
  years: [1],
  mat: ['MAT_K1', 'MAT_C1'],
  ambito: 'Numeri',
  title: 'Monomi e polinomi',
  summary: 'Il calcolo con le lettere, regola per regola.',
  glyph: '3x²',
  levels: [
    { name: 'Grado e monomi simili', desc: 'Riconoscere e sommare' },
    { name: 'Prodotti e potenze', desc: 'Coefficienti ed esponenti' },
    { name: 'Polinomi', desc: 'Somme, differenze e valore numerico' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Le lettere sono numeri in incognito', body: 'Nel monomio $-5a^2b$ il coefficiente è $-5$ e la parte letterale è $a^2b$. Si sommano solo monomi con la stessa parte letterale, come si sommano solo oggetti dello stesso tipo: $3$ mele $+ 2$ mele $= 5$ mele.' };
    if (level === 1) return [learn, degree(rng), similarSum(rng), binsSimilar(rng), degree(rng), similarSum(rng)];
    if (level === 2) return [learn, productMono(rng), powerMono(rng), productMono(rng), powerMono(rng), productMono(rng)];
    return [learn, polySum(rng), evaluate(rng), polySum(rng), evaluate(rng), polySum(rng)];
  },
};

void variables;

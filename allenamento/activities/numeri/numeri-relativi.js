// NUMERI RELATIVI — somme algebriche, regola dei segni, espressioni "micro".
// Numeri sempre piccoli: la difficoltà sta nei segni e nella precedenza, non nei conti.
import { par } from '../../js/engine/helpers.js';
import { perClasse } from '../contesti.js';

const M = () => perClasse({ 1: 9, 3: 12 });            // valore assoluto massimo dei numeri
const sg = (n) => (n < 0 ? `-${-n}` : `+${n}`);        // numero con segno esplicito
const ps = (n) => `(${sg(n)})`;                        // tra parentesi, con segno: (+3) (−4)

// ---------- livello 1: somme algebriche ----------
function addRel(rng) {
  const m = M();
  const { a, b, op } = rng.until(
    () => ({ a: rng.intNot(-m, m), b: rng.intNot(-m, m), op: rng.pick(['+', '-']) }),
    (v) => (v.a < 0 || v.b < 0) && (v.op === '-' ? v.a - v.b : v.a + v.b) !== 0,
  );
  const val = op === '+' ? a + b : a - b;
  const traps = [{ value: -val, msg: 'Il valore assoluto è giusto ma il segno no: il risultato ha il segno del numero con valore assoluto maggiore.' }];
  if (op === '-' && b < 0 && a + b !== val && a + b !== -val) traps.push({ value: a + b, msg: `Togliere ${ps(b)} vuol dire aggiungere ${ps(-b)}: meno per meno fa più.` });
  return {
    type: 'number',
    cas: { eval: `${a} ${op} (${b})` },
    prompt: `Calcola: $$${a} ${op} ${ps(b)}$$`,
    answer: val,
    traps,
    hint: op === '-' ? `Sottrarre un numero è come sommare il suo opposto: $${a} ${op} ${ps(b)} = ${a} + ${ps(-b)}$.` : 'Segni uguali: si sommano i valori assoluti. Segni diversi: si sottraggono e si tiene il segno del più "grande".',
    explain: `$$${a} ${op} ${ps(b)} = ${a} ${op === '+' ? (b < 0 ? `- ${-b}` : `+ ${b}`) : (b < 0 ? `+ ${-b}` : `- ${b}`)} = ${val}$$`,
    twin: () => addRel(rng),
  };
}

function placeRel(rng) {
  const { a, b } = rng.until(() => ({ a: rng.intNot(-8, 8), b: rng.intNot(-8, 8) }), (v) => Math.abs(v.a + v.b) <= 9 && Math.sign(v.a) !== Math.sign(v.b) && v.a + v.b !== 0);
  const val = a + b;
  return {
    type: 'place',
    prompt: `Parti da $${a}$ e fai un salto di $${sg(b)}$: dove arrivi sulla retta?`,
    min: -10, max: 10, snap: 1, tol: 0.4,
    ticks: Array.from({ length: 21 }, (_, i) => i - 10).map((v) => (v % 5 === 0 ? { v, label: String(v) } : { v, major: false })),
    answer: val, answerLabel: String(val),
    label: `Arrivo di ${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`,
    why: (v) => (v === a - b ? 'Hai saltato nel verso sbagliato: un numero positivo sposta a destra, uno negativo a sinistra.' : v > val ? 'Troppo a destra.' : 'Troppo a sinistra.'),
    hint: `${b > 0 ? 'Verso destra' : 'Verso sinistra'} di ${Math.abs(b)} passi.`,
    explain: `Da $${a}$ si fanno ${Math.abs(b)} passi verso ${b > 0 ? 'destra' : 'sinistra'}: $$${a} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${val}$$`,
    twin: () => placeRel(rng),
  };
}

function sortRel(rng) {
  const vals = [];
  while (vals.length < 5) { const v = rng.intNot(-12, 12); if (!vals.includes(v) && !vals.includes(-v)) vals.push(v); }
  if (!vals.some((v) => v < 0)) vals[0] = -Math.abs(vals[0]);
  return {
    type: 'sort',
    prompt: 'Ordina dal più piccolo al più grande.',
    items: vals.map((v) => ({ label: `$${v}$`, value: v })),
    hint: 'Tra due negativi è più piccolo quello più lontano dallo zero: −9 < −2.',
    explain: `$$${vals.slice().sort((x, y) => x - y).join(' < ')}$$ Sulla retta i numeri crescono da sinistra a destra.`,
    twin: () => sortRel(rng),
  };
}

function temperature(rng) {
  const lo = -rng.int(2, 9), hi = rng.int(3, 14);
  const city = rng.pick(['a Campo Imperatore', 'a Cortina', 'a Livigno', 'a Norcia', 'sul Monte Vettore']);
  return {
    type: 'number',
    cas: { eval: `${hi} - (${lo})` },
    prompt: `Un giorno d'inverno ${city} la minima è $${lo}\\ °C$ e la massima $${sg(hi)}\\ °C$. Di quanti gradi è salita la temperatura?`,
    answer: hi - lo,
    unit: '°C',
    traps: [{ value: hi + lo, msg: `Da $${lo}$ a $0$ ci sono già ${-lo} gradi, poi da $0$ a $${hi}$ altri ${hi}.` }],
    hint: 'Differenza: massima meno minima.',
    explain: `$$${hi} - ${ps(lo)} = ${hi} + ${-lo} = ${hi - lo}$$`,
    twin: () => temperature(rng),
  };
}

// ---------- livello 2: prodotti, quozienti, potenze ----------
function mulRel(rng) {
  const div = rng.chance(0.4);
  const { a, b } = rng.until(() => ({ a: rng.intNot(-9, 9, [0, 1, -1]), b: rng.intNot(-9, 9, [0, 1, -1]) }), (v) => v.a < 0 || v.b < 0);
  const p = a * b;
  const [x, y, val, sym] = div ? [p, b, a, ':'] : [a, b, p, '\\cdot'];
  return {
    type: 'number',
    cas: { eval: div ? `(${x}) / (${y})` : `(${x}) * (${y})` },
    prompt: `Calcola: $$${ps(x)} ${sym} ${ps(y)}$$`,
    answer: val,
    traps: [{ value: -val, msg: 'Regola dei segni: segni uguali danno +, segni diversi danno −.' }],
    hint: 'Prima il segno (concordi + , discordi −), poi il valore assoluto.',
    explain: `Segni ${(x < 0) === (y < 0) ? 'uguali: risultato positivo' : 'diversi: risultato negativo'}. $$${ps(x)} ${sym} ${ps(y)} = ${val}$$`,
    twin: () => mulRel(rng),
  };
}

function powRel(rng) {
  const b = rng.int(2, 4), e = b === 2 ? rng.int(2, 5) : rng.int(2, 3);
  const pw = b ** e;
  return {
    type: 'truefalse',
    prompt: 'Vero o falso?',
    statements: [
      { text: `$(-${b})^{${e}} = ${e % 2 ? -pw : pw}$`, value: true },
      { text: `$-${b}^{${e}} = ${pw}$`, value: false },
      { text: `$(-${b})^{${e}}$ e $-${b}^{${e}}$ sono uguali`, value: e % 2 === 1 },
      { text: `$(-1)^{${2 * e}} = -1$`, value: false },
    ],
    explain: `Con le parentesi la potenza riguarda anche il segno: esponente pari dà +, dispari dà −. Senza parentesi, $-${b}^{${e}} = -(${b}^{${e}}) = -${pw}$.`,
    twin: () => powRel(rng),
  };
}

function signBins(rng) {
  const items = [];
  const seen = new Set();
  while (items.length < 6) {
    const n = rng.int(2, 3);
    const fs = Array.from({ length: n }, () => rng.intNot(-5, 5, [0, 1, -1]));
    const neg = fs.filter((f) => f < 0).length;
    const label = fs.map(ps).join('\\cdot ');
    if (seen.has(label) || !neg) continue;
    seen.add(label);
    items.push({ label: `$${label}$`, bin: neg % 2 ? 'neg' : 'pos' });
  }
  if (!items.some((i) => i.bin === 'pos') || !items.some((i) => i.bin === 'neg')) return signBins(rng);
  return {
    type: 'bins',
    prompt: 'Senza calcolare: il prodotto è positivo o negativo?',
    bins: [{ id: 'pos', label: 'Positivo' }, { id: 'neg', label: 'Negativo' }],
    items,
    hint: 'Conta i fattori negativi: se sono in numero pari il prodotto è positivo.',
    explain: 'Numero pari di fattori negativi → prodotto positivo; numero dispari → negativo.',
    twin: () => signBins(rng),
  };
}

// ---------- livello 3: espressioni micro ----------
/** a + b·c   (precedenza: prima il prodotto) */
function exprPrec(rng) {
  const { a, b, c } = rng.until(() => ({ a: rng.intNot(-9, 9), b: rng.intNot(-5, 5, [0, 1, -1]), c: rng.intNot(-6, 6, [0, 1, -1]) }), (v) => (v.b < 0 || v.c < 0) && Math.abs(v.a + v.b * v.c) <= 40);
  const val = a + b * c;
  const traps = [];
  if ((a + b) * c !== val) traps.push({ value: (a + b) * c, msg: 'Prima le moltiplicazioni, poi le addizioni: non si va da sinistra a destra.' });
  if (a - b * c !== val) traps.push({ value: a - b * c, msg: 'Attenzione al segno del prodotto.' });
  return {
    type: 'number',
    cas: { eval: `${a} + (${b})*(${c})` },
    prompt: `Calcola: $$${a} + ${b} \\cdot ${ps(c)}$$`,
    answer: val,
    traps,
    hint: 'La moltiplicazione ha la precedenza.',
    explain: `$$${a} + ${b} \\cdot ${ps(c)} = ${a} + ${ps(b * c)} = ${val}$$`,
    twin: () => exprPrec(rng),
  };
}

/** k·(p − q) + r */
function exprParen(rng) {
  const { k, p, q, r } = rng.until(() => ({ k: rng.intNot(-6, 6, [0, 1, -1]), p: rng.intNot(-9, 9), q: rng.intNot(-9, 9), r: rng.intNot(-9, 9) }), (v) => v.p !== v.q && Math.abs(v.k * (v.p - v.q) + v.r) <= 40 && (v.k < 0 || v.p - v.q < 0));
  const val = k * (p - q) + r;
  const traps = [];
  const noDist = k * p - q + r;
  if (noDist !== val) traps.push({ value: noDist, msg: `Il ${par(k)} moltiplica tutta la parentesi, anche ${par(q)}.` });
  if (val !== 0 && -val !== noDist) traps.push({ value: -val, msg: 'Ricontrolla i segni: un fattore negativo cambia il segno del prodotto.' });
  return {
    type: 'number',
    cas: { eval: `(${k})*((${p}) - (${q})) + (${r})` },
    prompt: `Calcola: $$${ps(k)} \\cdot \\left(${p} - ${ps(q)}\\right) ${r < 0 ? '-' : '+'} ${Math.abs(r)}$$`,
    answer: val,
    traps,
    hint: 'Prima la parentesi, poi il prodotto, poi la somma.',
    explain: `$$${ps(k)} \\cdot \\left(${p} - ${ps(q)}\\right) ${r < 0 ? '-' : '+'} ${Math.abs(r)} = ${ps(k)} \\cdot ${ps(p - q)} ${r < 0 ? '-' : '+'} ${Math.abs(r)} = ${k * (p - q)} ${r < 0 ? '-' : '+'} ${Math.abs(r)} = ${val}$$`,
    twin: () => exprParen(rng),
  };
}

/** −[a − (b − c)] : parentesi annidate e segno meno davanti */
function exprNested(rng) {
  const { a, b, c } = rng.until(() => ({ a: rng.intNot(-9, 9), b: rng.intNot(-9, 9), c: rng.intNot(-9, 9) }), (v) => v.a - (v.b - v.c) !== 0 && v.b !== v.c);
  const inner = b - c, mid = a - inner, val = -mid;
  const traps = [];
  if (mid !== val) traps.push({ value: mid, msg: 'Il meno davanti alla parentesi quadra cambia il segno di tutto il risultato.' });
  const wrong = -(a - b - c);
  if (wrong !== val && wrong !== mid) traps.push({ value: wrong, msg: `Togliendo la tonda preceduta dal meno, anche ${par(c)} cambia segno.` });
  return {
    type: 'number',
    cas: { eval: `-((${a}) - ((${b}) - (${c})))` },
    prompt: `Calcola: $$-\\left[${a} - \\left(${b} - ${ps(c)}\\right)\\right]$$`,
    answer: val,
    traps,
    hint: 'Si parte dalla parentesi più interna.',
    explain: `$$-\\left[${a} - \\left(${b} - ${ps(c)}\\right)\\right] = -\\left[${a} - ${ps(inner)}\\right] = -\\left[${mid}\\right] = ${val}$$`,
    twin: () => exprNested(rng),
  };
}

/** (−a):(−b) − c·(−d) */
function exprDiv(rng) {
  const { q, b, c, d } = rng.until(() => ({ q: rng.intNot(-6, 6, [0, 1, -1]), b: rng.intNot(-6, 6, [0, 1, -1]), c: rng.intNot(-5, 5, [0]), d: rng.intNot(-5, 5, [0]) }), (v) => (v.q * v.b < 0 || v.b < 0) && Math.abs(v.q - v.c * v.d) <= 40);
  const a = q * b, val = q - c * d;
  const traps = [];
  if (q + c * d !== val) traps.push({ value: q + c * d, msg: `Il prodotto ${par(c)}·${ps(d)} va sottratto con il suo segno.` });
  if (-q - c * d !== val) traps.push({ value: -q - c * d, msg: 'Controlla il segno del quoziente: segni uguali danno +.' });
  return {
    type: 'number',
    cas: { eval: `(${a})/(${b}) - (${c})*(${d})` },
    prompt: `Calcola: $$${ps(a)} : ${ps(b)} - ${c < 0 ? `(${c})` : c} \\cdot ${ps(d)}$$`,
    answer: val,
    traps,
    hint: 'Prima divisione e moltiplicazione (ognuna con la regola dei segni), poi la sottrazione.',
    explain: `$$${ps(a)} : ${ps(b)} - ${c < 0 ? `(${c})` : c} \\cdot ${ps(d)} = ${par(q)} - ${par(c * d)} = ${val}$$`,
    twin: () => exprDiv(rng),
  };
}

/** Ordine delle operazioni: quale passaggio va fatto per primo? */
function firstStep(rng) {
  const a = rng.intNot(-9, 9), b = rng.intNot(-5, 5, [0, 1, -1]), c = rng.intNot(-6, 6, [0]), d = rng.intNot(-9, 9);
  return {
    type: 'choice',
    prompt: `In $${a} - ${b < 0 ? `(${b})` : b} \\cdot \\left(${c} + ${ps(d)}\\right)$, qual è il primo calcolo da fare?`,
    options: [
      { label: `$${c} + ${ps(d)}$`, correct: true },
      { label: `$${a} - ${b < 0 ? `(${b})` : b}$`, why: 'La sottrazione viene per ultima.' },
      { label: `$${b < 0 ? `(${b})` : b} \\cdot ${c}$`, why: 'La parentesi va calcolata tutta prima di moltiplicare.' },
    ],
    explain: 'Ordine: parentesi, poi potenze, poi moltiplicazioni e divisioni, infine addizioni e sottrazioni.',
    twin: () => firstStep(rng),
  };
}

export default {
  id: 'numeri-relativi',
  area: 'numeri',
  years: [1],
  mat: ['MAT_K1', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Numeri relativi',
  summary: 'Segni, regola dei segni ed espressioni brevi.',
  glyph: '±',
  levels: [
    { name: 'Somme algebriche', desc: 'Più e meno sulla retta dei numeri' },
    { name: 'La regola dei segni', desc: 'Prodotti, quozienti e potenze' },
    { name: 'Espressioni micro', desc: 'Precedenze e parentesi, con i segni' },
  ],
  generate(rng, level) {
    if (level === 1) return [
      { type: 'learn', title: 'Un numero con il segno', body: 'Sulla retta i positivi stanno a destra dello zero, i negativi a sinistra. Sommare un positivo sposta a destra, sommare un negativo sposta a sinistra. Sottrarre un numero è come sommare il suo opposto: $5 - (-3) = 5 + 3 = 8$.' },
      addRel(rng), placeRel(rng), addRel(rng), sortRel(rng), temperature(rng), addRel(rng)];
    if (level === 2) return [
      { type: 'learn', title: 'La regola dei segni', body: 'Nel prodotto e nel quoziente: segni <b>uguali</b> danno $+$, segni <b>diversi</b> danno $-$. $$(-3)\\cdot(-4) = +12 \\qquad (-12):(+3) = -4$$ Nelle potenze conta l\'esponente: $(-2)^3 = -8$, $(-2)^4 = +16$, ma $-2^4 = -16$.' },
      mulRel(rng), signBins(rng), mulRel(rng), powRel(rng), mulRel(rng)];
    return [
      { type: 'learn', title: 'Prima cosa si calcola?', body: 'Parentesi (dalla più interna), poi potenze, poi moltiplicazioni e divisioni, infine addizioni e sottrazioni. Ogni passo con la sua regola dei segni: $$-3 + 2\\cdot(-4) = -3 + (-8) = -11$$' },
      firstStep(rng), exprPrec(rng), exprParen(rng), exprDiv(rng), exprNested(rng), exprPrec(rng)];
  },
};

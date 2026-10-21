import { tx, euro } from '../../js/engine/helpers.js';
import { settimana } from '../../js/engine/rng.js';
import { plane } from '../../js/gfx/svg.js';

function expEquation(rng) {
  const b = rng.pick([2, 3, 5]);
  const n = rng.int(2, b === 2 ? 8 : 5);
  const k = rng.intNot(-3, 3);
  return {
    type: 'number',
    cas: { solveNum: `${b}^(x+(${k}))-${b ** n}` },
    prompt: `Risolvi: $$${b}^{x ${k < 0 ? '-' : '+'} ${Math.abs(k)}} = ${b ** n}$$`,
    answer: n - k,
    traps: [{ value: n, msg: `Hai trovato l'esponente totale ${n}: ora ricava x da $x ${k < 0 ? '-' : '+'} ${Math.abs(k)} = ${n}$.` }],
    hint: `Scrivi ${b ** n} come potenza di ${b}.`,
    explain: `$$${b ** n} = ${b}^{${n}} \\Rightarrow x ${k < 0 ? '-' : '+'} ${Math.abs(k)} = ${n} \\Rightarrow x = ${n - k}$$`,
    twin: () => expEquation(rng),
  };
}

function negExp(rng) {
  const b = rng.pick([2, 3, 10]);
  const n = rng.int(1, 4);
  return {
    type: 'number',
    prompt: `Quanto vale $${b}^{-${n}}$? (frazione o decimale)`,
    answer: 1 / b ** n,
    traps: [{ value: -(b ** n), msg: 'Un esponente negativo non rende negativo il risultato: indica il reciproco.' }, { value: -b * n, msg: 'L\'esponente non moltiplica la base.' }],
    hint: `$a^{-n} = \\dfrac{1}{a^n}$`,
    explain: `$$${b}^{-${n}} = \\dfrac{1}{${b}^{${n}}} = \\dfrac{1}{${b ** n}}$$`,
    twin: () => negExp(rng),
  };
}

function growth(rng, kind = rng.pick(['pop', 'money', 'viral'])) {
  const n = rng.int(2, 5);
  if (kind === 'money') {
    const C = rng.pick([1000, 2000, 5000]), r = rng.pick([10, 20]);
    const n = r === 10 ? rng.pick([2, 3]) : 2; // eslint-disable-line no-shadow
    const M = C * (1 + r / 100) ** n;
    return {
      type: 'number', unit: '€', decimals: 2,
      prompt: `Depositi ${euro(C)} su un conto con interesse composto del ${r}% annuo. Quanto avrai dopo ${n} anni?`,
      answer: M,
      traps: [{ value: C * (1 + (r * n) / 100), msg: 'Questo è l\'interesse semplice: con quello composto gli interessi producono altri interessi.' }],
      hint: `Ogni anno il capitale si moltiplica per $${tx(1 + r / 100)}$.`,
      explain: `$$M = ${C}\\cdot ${tx(1 + r / 100)}^{${n}} = ${tx(M)}\\ €$$ Anno per anno: ${Array.from({ length: n + 1 }, (_, i) => euro(C * (1 + r / 100) ** i)).join(' → ')}.`,
      chart: { type: 'line', alt: 'Crescita del capitale', data: { labels: Array.from({ length: n + 1 }, (_, i) => `anno ${i}`), datasets: [{ label: 'Capitale', data: Array.from({ length: n + 1 }, (_, i) => +(C * (1 + r / 100) ** i).toFixed(2)) }] }, legend: false },
      chartAfter: true,
      twin: () => growth(rng, kind),
    };
  }
  if (kind === 'viral') {
    const s = rng.pick([2, 3]), d = rng.int(4, 7);
    return {
      type: 'number',
      prompt: `Un video viene condiviso da 1 persona il primo giorno; ogni giorno chi l'ha visto lo condivide con ${s} nuove persone, quindi il numero di persone raggiunte si moltiplica per ${s + 1}. Quante persone lo hanno visto al giorno ${d}?`,
      answer: (s + 1) ** (d - 1),
      traps: [{ value: 1 + s * (d - 1), msg: 'La crescita non è lineare: ogni giorno si moltiplica, non si aggiunge sempre lo stesso numero.' }, { value: (s + 1) ** d, msg: `Il giorno 1 c'è 1 persona: al giorno ${d} si è moltiplicato ${d - 1} volte.` }],
      hint: `Giorno 1: 1. Giorno 2: ${s + 1}. Giorno 3: ${(s + 1) ** 2}…`,
      explain: `$$N(${d}) = ${s + 1}^{${d - 1}} = ${(s + 1) ** (d - 1)}$$ La crescita esponenziale all'inizio sembra lenta, poi esplode.`,
      chart: { type: 'bar', alt: 'Crescita giornaliera', data: { labels: Array.from({ length: d }, (_, i) => `g${i + 1}`), datasets: [{ label: 'Persone', data: Array.from({ length: d }, (_, i) => (s + 1) ** i) }] }, legend: false },
      chartAfter: true,
      twin: () => growth(rng, kind),
    };
  }
  const P0 = rng.pick([1000, 2000, 5000]), half = rng.pick([2, 3, 5, 8]);
  const t = half * n;
  return {
    type: 'number', unit: 'mg',
    prompt: `Un farmaco si dimezza nel sangue ogni ${half} ore. Se all'inizio ce ne sono ${P0} mg, quanti ne restano dopo ${t} ore?`,
    answer: P0 / 2 ** n,
    traps: [{ value: P0 - (P0 / 2) * n, msg: 'Non si toglie sempre la stessa quantità: ogni volta si dimezza ciò che resta.' }],
    hint: `In ${t} ore ci sono ${n} periodi di dimezzamento.`,
    explain: `$$${P0}\\cdot\\left(\\dfrac{1}{2}\\right)^{${n}} = ${tx(P0 / 2 ** n)}\\ \\text{mg}$$`,
    twin: () => growth(rng, kind),
  };
}

function graphId(rng) {
  const base = rng.pick([2, 3, 0.5]);
  const opts = [
    { f: (x) => base ** x, ok: true },
    { f: (x) => (1 / base) ** x, why: base > 1 ? 'Questa è decrescente: è la base reciproca.' : 'Questa è crescente: è la base reciproca.' },
    { f: (x) => 2 * x + 1, why: 'Questa è una retta: la crescita è sempre la stessa.' },
  ];
  return {
    type: 'choice',
    prompt: `Quale grafico rappresenta $y = ${base === 0.5 ? '\\left(\\tfrac{1}{2}\\right)' : base}^x$?`,
    options: rng.shuffle(opts).map((o) => ({ label: `<span class="opt-fig">${plane({ xmin: -3, xmax: 3, ymin: -1, ymax: 8, width: 170, height: 200, labels: false, fns: [{ f: o.f }], points: [{ x: 0, y: o.f(0), r: 3 }] })}</span>`, correct: !!o.ok, why: o.why })),
    explain: `$y = a^x$ passa sempre per $(0;\\,1)$ ed è ${base > 1 ? 'crescente perché la base è maggiore di 1' : 'decrescente perché la base è tra 0 e 1'}. Non tocca mai l'asse x.`,
    twin: () => graphId(rng),
  };
}

// ---------- varianti: stesse competenze, formati diversi (scelte una volta a settimana) ----------
const money = (rng) => growth(rng, 'money');
const viral = (rng) => growth(rng, 'viral');
const halfLife = (rng) => growth(rng, 'pop');

/** Ordina potenze con esponente negativo, nullo e frazionario */
function expSort(rng) {
  const pool = [
    ['2^{-2}', 1 / 4, '\\tfrac{1}{4}'], ['2^{-1}', 1 / 2, '\\tfrac{1}{2}'], ['3^{-1}', 1 / 3, '\\tfrac{1}{3}'], ['10^{-1}', 1 / 10, '0{,}1'],
    ['5^{0}', 1, '1'], ['2^{0}', 1, '1'], ['\\left(\\tfrac{1}{2}\\right)^{-2}', 4, '4'], ['\\left(\\tfrac{1}{3}\\right)^{-1}', 3, '3'],
    ['4^{1/2}', 2, '2'], ['9^{1/2}', 3, '3'], ['2^{3}', 8, '8'], ['3^{2}', 9, '9'],
    ['\\left(\\tfrac{1}{2}\\right)^{2}', 1 / 4, '\\tfrac{1}{4}'], ['10^{-2}', 1 / 100, '0{,}01'],
  ];
  const items = rng.until(() => rng.shuffle(pool).slice(0, 4), (v) => new Set(v.map((x) => x[1])).size === 4);
  return {
    type: 'sort',
    prompt: 'Ordina dal più piccolo al più grande.',
    items: items.map(([t, v]) => ({ label: `$${t}$`, value: v })),
    hint: 'Un esponente negativo dà il reciproco, l\'esponente zero dà 1, l\'esponente $\\tfrac{1}{2}$ è la radice quadrata.',
    explain: `$$${items.slice().sort((x, y) => x[1] - y[1]).map(([t, , v]) => `${t} = ${v}`).join(' \\;<\\; ')}$$`,
    twin: () => expSort(rng),
  };
}

/** Smista successioni: si aggiunge sempre lo stesso numero o si moltiplica sempre per lo stesso fattore? */
function growthBins(rng) {
  const seen = new Set();
  const make = (expo) => rng.until(() => {
    const a = rng.int(1, 6);
    const seq = expo ? (() => { const r = rng.pick([2, 3]); return [0, 1, 2, 3].map((i) => a * r ** i); })() : (() => { const d = rng.int(2, 9); return [0, 1, 2, 3].map((i) => a + d * i); })();
    return rng.chance(0.3) ? seq.reverse() : seq;
  }, (seq) => !seen.has(seq.join()));
  const items = rng.shuffle([true, true, true, false, false, false]).map((expo) => {
    const seq = make(expo);
    seen.add(seq.join());
    return { label: `$${seq.join(';\\ ')};\\ \\ldots$`, bin: expo ? 'exp' : 'lin' };
  });
  return {
    type: 'bins',
    prompt: 'Smista le successioni secondo il tipo di crescita (o di calo).',
    bins: [{ id: 'lin', label: 'Lineare: + sempre lo stesso' }, { id: 'exp', label: 'Esponenziale: × sempre lo stesso' }],
    items,
    hint: 'Guarda come si passa da un numero al successivo: differenza costante o rapporto costante?',
    explain: 'Se la differenza tra due numeri vicini è sempre la stessa la crescita è lineare; se è sempre lo stesso il rapporto (×2, ×3, oppure ÷2 quando cala) è esponenziale.',
    twin: () => growthBins(rng),
  };
}

/** Equazione con basi diverse da riscrivere come potenze della stessa base */
function expEquationBase(rng) {
  const [b, m] = rng.pick([[2, 2], [2, 3], [3, 2], [5, 2]]);
  const B = b ** m;
  const t = rng.int(1, b === 2 ? 4 : 3), k = rng.intNot(-2, 2);
  const n = m * (t + k);
  if (n <= 0) return expEquationBase(rng);
  return {
    type: 'number',
    cas: { solveNum: `${B}^(x+(${k}))-${b}^${n}` },
    prompt: `Risolvi: $$${B}^{x ${k < 0 ? '-' : '+'} ${Math.abs(k)}} = ${b}^{${n}}$$`,
    answer: t,
    traps: [{ value: n - k, msg: `Le basi sono diverse: prima scrivi ${B} come potenza di ${b}.` }, { value: n / m, msg: `$x ${k < 0 ? '-' : '+'} ${Math.abs(k)} = ${n / m}$: manca l'ultimo passaggio.` }].filter((x) => x.value !== t),
    hint: `$${B} = ${b}^{${m}}$, quindi $${B}^{x ${k < 0 ? '-' : '+'} ${Math.abs(k)}} = ${b}^{${m}(x ${k < 0 ? '-' : '+'} ${Math.abs(k)})}$.`,
    explain: `$$${b}^{${m}(x ${k < 0 ? '-' : '+'} ${Math.abs(k)})} = ${b}^{${n}} \\Rightarrow ${m}(x ${k < 0 ? '-' : '+'} ${Math.abs(k)}) = ${n} \\Rightarrow x ${k < 0 ? '-' : '+'} ${Math.abs(k)} = ${n / m} \\Rightarrow x = ${t}$$`,
    twin: () => expEquationBase(rng),
  };
}

export default {
  id: 'esponenziali',
  area: 'funzioni',
  years: [4],
  mat: ['MAT_K2', 'MAT_C2'],
  ambito: 'Relazioni e funzioni',
  title: 'Esponenziali',
  summary: 'Crescite che esplodono, decadimenti, interessi composti.',
  glyph: 'aˣ',
  levels: [
    { name: 'Potenze con esponente reale', desc: 'Esponenti negativi e grafici' },
    { name: 'Equazioni esponenziali', desc: 'Stessa base' },
    { name: 'Modelli di crescita', desc: 'Interessi, condivisioni, dimezzamenti' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Moltiplicare sempre per lo stesso numero',
      body: 'Una crescita lineare aggiunge sempre la stessa quantità; una crescita esponenziale moltiplica sempre per lo stesso fattore. All\'inizio si somigliano, poi l\'esponenziale stacca tutto.',
      fig: plane({ xmin: 0, xmax: 6, ymin: 0, ymax: 64, width: 300, height: 240, ystep: 8, fns: [{ f: (x) => 2 ** x, label: 'y = 2ˣ' }, { f: (x) => 6 * x + 1, cls: 'g-fn2', label: 'y = 6x + 1', labelX: 4.6 }] }),
    };
    const pick = (...gens) => settimana(rng).pick(gens)(rng);
    if (level === 1) return [learn, pick(graphId, growthBins), pick(negExp, expSort), negExp(rng), pick(graphId, expSort), pick(graphId, growthBins)];
    if (level === 2) return [learn, pick(expEquation, expEquationBase), expEquation(rng), pick(negExp, expSort), pick(expEquation, expEquationBase), pick(graphId, growthBins)];
    return [learn, pick(money, viral, halfLife), pick(viral, halfLife, growthBins), pick(expEquation, expEquationBase), pick(money, halfLife), pick(money, viral)];
  },
};

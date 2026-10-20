import { scene } from '../contesti.js';
import { tx } from '../../js/engine/helpers.js';

// forma a·10^n con 1 ≤ a < 10 (oppure 10^n da solo)
function sciForm(tree) {
  const isPow10 = (t) => t.k === 'pow' && t.a.k === 'num' && t.a.v === 10 && (t.b.k === 'num' || (t.b.k === 'neg' && t.b.a.k === 'num'));
  if (isPow10(tree)) return null;
  if (tree.k === 'mul' && tree.a.k === 'num' && isPow10(tree.b)) {
    if (tree.a.v >= 1 && tree.a.v < 10) return null;
    return `Il valore è giusto, ma il numero prima di 10 deve stare tra 1 e 10 (escluso): qui è ${String(tree.a.v).replace('.', ',')}.`;
  }
  return 'Il valore è giusto, ma scrivilo nella forma $a\\cdot 10^{n}$, ad esempio 3,2·10^5.';
}

const fmtBig = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 12 });
// in LaTeX: prima la virgola decimale ({,}), poi i separatori delle migliaia (spazio sottile \,)
const texBig = (n) => fmtBig(n).replace(',', '{,}').replace(/\./g, '\\,');

function toSci(rng) {
  const big = rng.chance(0.6);
  const digits = rng.int(2, 3);
  const mant = rng.int(10 ** (digits - 1) + 1, 10 ** digits - 1);
  const m = mant / 10 ** (digits - 1); // 1 ≤ m < 10
  if (Number.isInteger(m)) return toSci(rng);
  const sc = scene(rng, big ? 'grande' : 'piccolo');
  const n = rng.int(sc.e[0], sc.e[1]);
  // m·10^n in virgola mobile può dare 802999,9999999999: si riporta alle cifre significative di m
  const value = Number((m * 10 ** n).toPrecision(digits));
  const ctx = sc.t;
  return {
    type: 'expr',
    vars: [],
    prompt: `${ctx} $${texBig(value)}$. Scrivilo in notazione scientifica.`,
    answer: `${m}*10^(${n})`,
    form: sciForm,
    traps: [{ expr: `${m}*10^(${-n})`, msg: big ? 'L\'esponente deve essere positivo: il numero è grande.' : 'L\'esponente deve essere negativo: il numero è minore di 1.' }],
    hint: big ? 'Conta di quanti posti sposti la virgola verso sinistra.' : 'Conta di quanti posti sposti la virgola verso destra: l\'esponente sarà negativo.',
    explain: `$$${texBig(value)} = ${tx(m, 3)}\\cdot 10^{${n}}$$ La virgola si sposta di ${Math.abs(n)} posti.`,
    placeholder: 'ad es. 3,2·10^5',
    twin: () => toSci(rng),
  };
}

function product(rng) {
  const a = rng.int(2, 9), b = rng.int(2, 9);
  const n = rng.int(-6, 9), k = rng.int(-6, 9);
  const raw = a * b;
  const m = raw >= 10 ? raw / 10 : raw;
  const e = n + k + (raw >= 10 ? 1 : 0);
  return {
    type: 'expr',
    vars: [],
    prompt: `Calcola e scrivi in notazione scientifica: $$\\left(${a}\\cdot 10^{${n}}\\right)\\cdot\\left(${b}\\cdot 10^{${k}}\\right)$$`,
    answer: `${m}*10^(${e})`,
    form: sciForm,
    traps: [{ expr: `${raw}*10^(${n * k})`, msg: 'Le potenze di 10 si moltiplicano sommando gli esponenti.' }],
    hint: 'Moltiplica i numeri davanti, somma gli esponenti, poi sistema la forma.',
    explain: `$$${a}\\cdot ${b} = ${raw}, \\quad 10^{${n}}\\cdot 10^{${k}} = 10^{${n + k}}$$ $$${raw}\\cdot 10^{${n + k}}${raw >= 10 ? ` = ${tx(m)}\\cdot 10^{${e}}` : ''}$$`,
    placeholder: 'ad es. 1,2·10^7',
    twin: () => product(rng),
  };
}

function order(rng) {
  const items = rng.shuffle([
    { t: 'Diametro di un atomo', e: -10 }, { t: 'Spessore di un foglio', e: -4 }, { t: 'Altezza di una persona', e: 0 },
    { t: 'Altezza della Torre di Pisa', e: 1.75 }, { t: 'Distanza Foligno–Roma (m)', e: 5.2 }, { t: 'Raggio della Terra (m)', e: 6.8 },
    { t: 'Distanza Terra–Sole (m)', e: 11.2 }, { t: 'Lunghezza di una formica', e: -2.7 },
  ]).slice(0, 3);
  const biggest = items.reduce((a, b) => (a.e > b.e ? a : b));
  return {
    type: 'choice',
    prompt: 'Quale di queste misure è la più grande?',
    options: items.map((it) => ({ label: it.t, correct: it === biggest, why: it === biggest ? undefined : `È dell'ordine di $10^{${Math.floor(it.e)}}$ m.` })),
    explain: `L'ordine di grandezza è la potenza di 10 più vicina: ${items.map((it) => `${it.t.toLowerCase()} circa $10^{${Math.floor(it.e)}}$ m`).join('; ')}.`,
    twin: () => order(rng),
  };
}

function compareSci(rng) {
  const a = rng.int(2, 9), b = rng.int(2, 9);
  const n = rng.int(-5, 6);
  const k = n + rng.pick([-1, 1]);
  const big = a * 10 ** n > b * 10 ** k ? 'first' : 'second';
  const A = `$${a}\\cdot 10^{${n}}$`, B = `$${b}\\cdot 10^{${k}}$`;
  return {
    type: 'choice',
    prompt: `Qual è il numero maggiore?`,
    options: [
      { label: A, correct: big === 'first', why: big === 'first' ? undefined : 'Conta prima l\'esponente: un 10 in più vale più di qualsiasi cifra davanti.' },
      { label: B, correct: big === 'second', why: big === 'second' ? undefined : 'Conta prima l\'esponente: un 10 in più vale più di qualsiasi cifra davanti.' },
    ],
    explain: `In notazione scientifica si confronta prima l'esponente: $10^{${Math.max(n, k)}}$ batte $10^{${Math.min(n, k)}}$, qualunque sia il numero davanti (che sta tra 1 e 10).`,
    twin: () => compareSci(rng),
  };
}

/** Ordina numeri in notazione scientifica: prima conta l'esponente, poi il numero davanti */
function sortSci(rng) {
  const items = [];
  const base = rng.int(-4, 5);
  while (items.length < 4) {
    const a = rng.int(11, 98) / 10;
    const n = base + rng.pick([-1, 0, 0, 1, 2]);
    if (items.some((x) => Math.abs(Math.log10(x.value) - Math.log10(a * 10 ** n)) < 0.02)) continue;
    items.push({ label: `$${tx(a, 1)}\\cdot 10^{${n}}$`, value: a * 10 ** n });
  }
  return {
    type: 'sort',
    prompt: 'Trascina i numeri in ordine, dal più piccolo al più grande.',
    items,
    hint: 'Guarda prima gli esponenti: vince il più grande. A parità di esponente, conta il numero davanti.',
    explain: 'In notazione scientifica il numero davanti sta sempre tra 1 e 10: per questo l\'esponente decide l\'ordine di grandezza, e il numero davanti serve solo quando gli esponenti sono uguali.',
    twin: () => sortSci(rng),
  };
}

export default {
  id: 'notazione-scientifica',
  area: 'numeri',
  years: [1, 2],
  mat: ['MAT_K1', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Notazione scientifica',
  summary: 'Numeri giganti e minuscoli, con le potenze di 10.',
  glyph: '10ⁿ',
  levels: [
    { name: 'Scrivere', desc: 'Dalla forma estesa a a·10ⁿ' },
    { name: 'Confrontare', desc: 'Ordini di grandezza' },
    { name: 'Calcolare', desc: 'Prodotti in notazione scientifica' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Contare le cifre una volta sola', body: '$$340\\,000\\,000 = 3{,}4\\cdot 10^{8}$$ $$0{,}00052 = 5{,}2\\cdot 10^{-4}$$ Il primo numero sta tra 1 e 10, l\'esponente dice di quanti posti si sposta la virgola.' };
    if (level === 1) return [learn, toSci(rng), toSci(rng), compareSci(rng), toSci(rng), toSci(rng)];
    if (level === 2) return [learn, compareSci(rng), order(rng), toSci(rng), compareSci(rng), sortSci(rng)];
    return [learn, product(rng), product(rng), compareSci(rng), product(rng), toSci(rng)];
  },
};

import { scene } from '../contesti.js';
import { tx, euro } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

function breakEven(rng) {
  const F = rng.pick([600, 800, 1200, 1500, 2000]), p = rng.pick([12, 15, 20, 25]), c = rng.pick([4, 5, 7, 8]);
  const q = F / (p - c);
  if (!Number.isInteger(q)) return breakEven(rng);
  const what = scene(rng, 'prodotto');
  return {
    type: 'number', unit: 'pezzi',
    prompt: `Un laboratorio scolastico produce ${what}. Costi fissi: ${euro(F)}; costo per pezzo: ${euro(c)}; prezzo di vendita: ${euro(p)}. Quanti pezzi bisogna vendere per andare in pareggio?`,
    answer: q,
    traps: [{ value: F / p, msg: 'Ogni pezzo venduto copre solo il margine (prezzo − costo), non l\'intero prezzo.' }],
    hint: 'Pareggio: ricavi = costi, cioè $p\\cdot q = F + c\\cdot q$.',
    explain: `$$${p}q = ${F} + ${c}q \\Rightarrow ${p - c}q = ${F} \\Rightarrow q = ${q}$$`,
    explainFig: plane({ xmin: 0, xmax: Math.ceil(q * 1.8 / 10) * 10, ymin: 0, ymax: Math.ceil((p * q * 1.8) / 100) * 100, width: 320, height: 230, fns: [{ f: (x) => p * x, label: 'ricavi' }, { f: (x) => F + c * x, cls: 'g-fn2', label: 'costi', labelX: q * 0.3 }], points: [{ x: q, y: p * q, label: 'pareggio' }], xName: 'pezzi', yName: '€' }),
    twin: () => breakEven(rng),
  };
}

function compareTariffs(rng) {
  const a = { f: rng.pick([0, 5]), v: rng.pick([0.2, 0.25, 0.3]) };
  const b = { f: rng.pick([10, 12, 15]), v: rng.pick([0.05, 0.08, 0.1]) };
  const x = (b.f - a.f) / (a.v - b.v);
  const n = Math.round(x * rng.pick([0.5, 1.6]));
  const best = a.f + a.v * n < b.f + b.v * n ? 'A' : 'B';
  return {
    type: 'choice',
    prompt: `Tariffa A: ${euro(a.f)} al mese + ${euro(a.v)} a minuto. Tariffa B: ${euro(b.f)} al mese + ${euro(b.v)} a minuto. Con ${n} minuti al mese, quale conviene?`,
    options: [
      { label: 'A', correct: best === 'A', why: best === 'A' ? undefined : `Con ${n} minuti: A costa ${euro(a.f + a.v * n)}, B costa ${euro(b.f + b.v * n)}.` },
      { label: 'B', correct: best === 'B', why: best === 'B' ? undefined : `Con ${n} minuti: A costa ${euro(a.f + a.v * n)}, B costa ${euro(b.f + b.v * n)}.` },
    ],
    fixedOrder: true,
    explain: `A: $${tx(a.f)} + ${tx(a.v)}\\cdot ${n} = ${tx(a.f + a.v * n)}$ €. B: $${tx(b.f)} + ${tx(b.v)}\\cdot ${n} = ${tx(b.f + b.v * n)}$ €. Le due tariffe si equivalgono a circa ${Math.round(x)} minuti: sotto conviene A, sopra B.`,
    explainFig: plane({ xmin: 0, xmax: Math.ceil(x * 2 / 10) * 10, ymin: 0, ymax: Math.ceil(a.f + a.v * x * 2), width: 320, height: 220, fns: [{ f: (t) => a.f + a.v * t, label: 'A' }, { f: (t) => b.f + b.v * t, cls: 'g-fn2', label: 'B' }], vlines: [{ x: n, label: `${n} min` }], xName: 'min', yName: '€' }),
    twin: () => compareTariffs(rng),
  };
}

function maxProfit(rng) {
  const a = rng.pick([1, 2]), b = rng.pick([40, 60, 80, 100]), F = rng.pick([100, 200, 300]);
  const qBest = b / (2 * a);
  const G = -a * qBest * qBest + b * qBest - F;
  return {
    type: 'numbers', ordered: true,
    prompt: `Il guadagno giornaliero di un'officina è $G(q) = -${a === 1 ? '' : a}q^2 + ${b}q - ${F}$ euro, dove $q$ è il numero di interventi. Quanti interventi massimizzano il guadagno, e quanto vale il guadagno massimo? Scrivi (interventi; guadagno).`,
    answers: [qBest, G],
    hint: 'Il massimo di una parabola con concavità verso il basso è nel vertice.',
    explain: `$$q_V = \\dfrac{${b}}{2\\cdot ${a}} = ${qBest} \\qquad G(${qBest}) = ${tx(G)}\\ €$$`,
    explainFig: plane({ xmin: 0, xmax: 2 * qBest, ymin: Math.min(-F, 0) - 10, ymax: G + 50, width: 320, height: 230, fns: [{ f: (q) => -a * q * q + b * q - F }], points: [{ x: qBest, y: G, label: 'massimo' }], xName: 'q', yName: '€' }),
    placeholder: '(q; G)',
    twin: () => maxProfit(rng),
  };
}

function constraint(rng) {
  const [h, m] = rng.pick([[12, 12], [9, 12], [12, 15], [10, 14], [15, 12], [12, 9]]);
  const pa = rng.pick([30, 40]), pb = rng.pick([50, 60]);
  // A: 1 h + 2 m; B: 2 h + 1 m  → vertici (0,0) (0,h/2) (m/2,0) e intersezione
  const xI = (2 * m - h) / 3, yI = (2 * h - m) / 3;
  const verts = [[0, 0], [Math.min(h, m / 2), 0], [0, Math.min(h / 2, m)]];
  if (xI > 0 && yI > 0 && Number.isInteger(xI) && Number.isInteger(yI)) verts.push([xI, yI]);
  const best = verts.reduce((acc, v) => (pa * v[0] + pb * v[1] > pa * acc[0] + pb * acc[1] ? v : acc));
  return {
    type: 'number', unit: '€',
    prompt: `Un'azienda produce sedie A e B. Ogni A richiede 1 ora di lavoro e ${2} kg di legno, ogni B 2 ore e 1 kg. Ha ${h} ore e ${m} kg di legno al giorno. Guadagna ${pa} € per ogni A e ${pb} € per ogni B. Qual è il guadagno massimo? (il massimo è in un vertice della regione ammissibile)`,
    answer: pa * best[0] + pb * best[1],
    hint: `Vincoli: $x + 2y \\le ${h}$, $2x + y \\le ${m}$, $x, y \\ge 0$. Calcola il guadagno nei vertici.`,
    explain: `Vertici della regione ammissibile: ${verts.map((v) => `(${tx(v[0])};\\,${tx(v[1])})`).map((s) => `$${s}$`).join(', ')}. Il guadagno $${pa}x + ${pb}y$ è massimo in $(${tx(best[0])};\\,${tx(best[1])})$: ${pa * best[0] + pb * best[1]} €.`,
    explainFig: plane({ xmin: 0, xmax: Math.max(h, m / 2) + 1, ymin: 0, ymax: Math.max(h / 2, m) + 1, width: 300, height: 260, fns: [{ f: (x) => (h - x) / 2, label: 'ore' }, { f: (x) => m - 2 * x, cls: 'g-fn2', label: 'legno' }], points: verts.map(([x, y]) => ({ x, y })) }),
    twin: () => constraint(rng),
  };
}

export default {
  id: 'problemi-scelta',
  area: 'funzioni',
  years: [5],
  mat: ['MAT_K2', 'MAT_C2'],
  ambito: 'Relazioni e funzioni',
  title: 'Problemi di scelta',
  summary: 'Pareggio, tariffe, massimo guadagno: la matematica delle decisioni.',
  glyph: '€↗',
  levels: [
    { name: 'Il punto di pareggio', desc: 'Costi fissi e variabili' },
    { name: 'Scegliere tra alternative', desc: 'Confronto di tariffe' },
    { name: 'Ottimizzare', desc: 'Massimo guadagno, vincoli' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Modellare una decisione', body: 'Si scrive la grandezza da rendere massima (o minima) come funzione di una variabile, si disegnano le alternative e si confronta. Il caso continuo usa rette e parabole; il caso con vincoli cerca il meglio nei vertici della regione ammissibile.' };
    if (level === 1) return [learn, breakEven(rng), breakEven(rng), compareTariffs(rng), breakEven(rng), compareTariffs(rng)];
    if (level === 2) return [learn, compareTariffs(rng), breakEven(rng), compareTariffs(rng), maxProfit(rng), compareTariffs(rng)];
    return [learn, maxProfit(rng), constraint(rng), maxProfit(rng), constraint(rng), maxProfit(rng)];
  },
};

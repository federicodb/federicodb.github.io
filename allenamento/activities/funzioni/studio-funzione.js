import { plane } from '../../js/gfx/svg.js';
import { poly } from '../../js/engine/helpers.js';

function domain(rng) {
  const kind = rng.pick(['frac', 'sqrt', 'log']);
  const a = rng.intNot(-6, 6);
  const map = {
    frac: { f: `\\dfrac{x + 1}{x ${a < 0 ? '+' : '-'} ${Math.abs(a)}}`, right: `x \\ne ${a}`, w: [`x > ${a}`, `x \\ge ${a}`, 'tutti i reali'] },
    sqrt: { f: `\\sqrt{x ${a < 0 ? '+' : '-'} ${Math.abs(a)}}`, right: `x \\ge ${a}`, w: [`x > ${a}`, `x \\ne ${a}`, 'tutti i reali'] },
    log: { f: `\\ln(x ${a < 0 ? '+' : '-'} ${Math.abs(a)})`, right: `x > ${a}`, w: [`x \\ge ${a}`, `x \\ne ${a}`, 'tutti i reali'] },
  }[kind];
  const why = {
    frac: 'Il denominatore non può essere zero: si esclude un solo valore.',
    sqrt: 'Sotto la radice quadrata serve un numero maggiore o uguale a zero.',
    log: 'L\'argomento del logaritmo deve essere strettamente positivo.',
  }[kind];
  return {
    type: 'choice',
    prompt: `Qual è il dominio di $f(x) = ${map.f}$?`,
    options: [{ label: `$${map.right}$`, correct: true }, ...map.w.map((w) => ({ label: w === 'tutti i reali' ? 'Tutti i numeri reali' : `$${w}$`, why }))],
    explain: why,
    twin: () => domain(rng),
  };
}

function cubicPick(rng) {
  // f(x) = k (x-p)(x-q)(x-r) con radici intere
  const [p, q, r] = rng.until(() => [rng.int(-4, -1), rng.int(-1, 2), rng.int(2, 5)], (v) => v[0] < v[1] && v[1] < v[2]);
  const k = rng.pick([0.25, -0.25, 0.2, -0.2]);
  const f = (x) => k * (x - p) * (x - q) * (x - r);
  return { p, q, r, k, f };
}

function readGraph(rng) {
  const { p, q, r, k, f } = cubicPick(rng);
  const x0 = rng.pick([p - 1, (p + q) / 2, (q + r) / 2, r + 1].filter((v) => Number.isInteger(v)));
  const statements = rng.shuffle([
    { text: `La funzione ha ${[p, q, r].length} zeri: $x = ${p}$, $x = ${q}$, $x = ${r}$`, value: true },
    { text: `$f(${x0}) > 0$`, value: f(x0) > 0 },
    { text: `Per $x$ molto grande la funzione tende a ${k > 0 ? '+' : '-'}∞`, value: true },
    { text: `La funzione è crescente in tutto il suo dominio`, value: false },
    { text: `$f(0) ${f(0) > 0 ? '<' : '>'} 0$`, value: false },
  ]).slice(0, 4);
  return {
    type: 'truefalse',
    fig: plane({ xmin: -6, xmax: 6, ymin: -8, ymax: 8, width: 320, height: 300, fns: [{ f }], points: [p, q, r].map((x) => ({ x, y: 0 })) }),
    prompt: 'Osserva il grafico di $y = f(x)$. Indica se ogni affermazione è vera o falsa.',
    statements,
    explain: `Zeri dove il grafico tocca l'asse x (${p}, ${q}, ${r}); il segno di $f$ si legge da sopra/sotto l'asse; la funzione sale e scende, quindi non è crescente ovunque.`,
    twin: () => readGraph(rng),
  };
}

function monotone(rng) {
  const a = rng.pick([1, -1]), h = rng.int(-3, 3), k = rng.int(-3, 3);
  const f = (x) => a * (x - h) ** 2 + k;
  return {
    type: 'choice',
    fig: plane({ xmin: -6, xmax: 6, ymin: -8, ymax: 8, width: 300, height: 280, fns: [{ f }], points: [{ x: h, y: k, label: `(${h}; ${k})` }] }),
    prompt: 'In quale intervallo la funzione rappresentata è crescente?',
    options: [
      { label: a > 0 ? `$x > ${h}$` : `$x < ${h}$`, correct: true },
      { label: a > 0 ? `$x < ${h}$` : `$x > ${h}$`, why: 'Lì il grafico scende andando verso destra.' },
      { label: `$y > ${k}$`, why: 'La crescenza si descrive con un intervallo di x.' },
      { label: 'In tutto ℝ', why: 'Il grafico ha un punto di svolta.' },
    ],
    explain: `Il vertice $(${h};\\,${k})$ è un ${a > 0 ? 'minimo' : 'massimo'}: la funzione è crescente ${a > 0 ? `per $x > ${h}$` : `per $x < ${h}$`}.`,
    twin: () => monotone(rng),
  };
}

function asymptote(rng) {
  const a = rng.intNot(-4, 4);
  const b = rng.intNot(-3, 3, [a]);
  const f = (x) => 1 / (x - a) + b;
  return {
    type: 'choice',
    fig: plane({ xmin: -7, xmax: 7, ymin: -7, ymax: 7, width: 300, height: 300, fns: [{ f, domain: [-7, a - 0.02] }, { f, domain: [a + 0.02, 7] }], vlines: [{ x: a, cls: 'g-guide' }], hlines: [{ y: b, cls: 'g-guide' }] }),
    prompt: `Il grafico è quello di $y = \\dfrac{1}{x ${a < 0 ? '+' : '-'} ${Math.abs(a)}} ${b < 0 ? '-' : '+'} ${Math.abs(b)}$. Quali sono gli asintoti?`,
    options: [
      { label: `$x = ${a}$ e $y = ${b}$`, correct: true },
      { label: `$x = ${-a}$ e $y = ${b}$`, why: 'L\'asintoto verticale è dove si annulla il denominatore.' },
      { label: `$x = ${b}$ e $y = ${a}$`, why: 'Verticale e orizzontale sono scambiati.' },
      { label: `Solo $x = ${a}$`, why: 'Per x molto grande la frazione tende a zero: resta un asintoto orizzontale.' },
    ],
    explain: `Il denominatore si annulla per $x = ${a}$: asintoto verticale. Per $x \\to \\pm\\infty$ la frazione tende a 0, quindi $y \\to ${b}$: asintoto orizzontale.`,
    twin: () => asymptote(rng),
  };
}

function zerosFromFactored(rng) {
  const { p, q, r } = cubicPick(rng);
  return {
    type: 'numbers',
    prompt: `Trova gli zeri di $f(x) = (x ${p < 0 ? '+' : '-'} ${Math.abs(p)})(x ${q < 0 ? '+' : '-'} ${Math.abs(q)})(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})$`.replace('(x - 0)', 'x').replace('(x + 0)', 'x'),
    answers: [p, q, r],
    traps: [{ values: [-p, -q, -r], msg: 'Ogni fattore si annulla per il valore opposto al numero scritto: $x - 3 = 0$ per $x = 3$.' }],
    hint: 'Un prodotto è zero quando uno dei fattori è zero.',
    explain: `Ogni fattore si annulla una volta: $x = ${p}$, $x = ${q}$, $x = ${r}$.`,
    placeholder: 'ad es. -2; 1; 4',
    twin: () => zerosFromFactored(rng),
  };
}

export default {
  id: 'studio-funzione',
  area: 'funzioni',
  years: [5],
  mat: ['MAT_K2', 'MAT_A2'],
  ambito: 'Relazioni e funzioni',
  title: 'Studio di funzione',
  summary: 'Dominio, zeri, segno, crescenza, asintoti: leggere un grafico.',
  glyph: 'f(x)',
  levels: [
    { name: 'Dominio e zeri', desc: 'Dove esiste, dove si annulla' },
    { name: 'Segno e crescenza', desc: 'Leggere il grafico' },
    { name: 'Asintoti', desc: 'Il comportamento agli estremi' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Le domande da fare a un grafico', body: 'Dove esiste (dominio)? Dove taglia gli assi (zeri)? Dove sta sopra o sotto l\'asse x (segno)? Dove sale e dove scende? Cosa succede agli estremi (asintoti)? Le stesse domande valgono per qualsiasi modello: costi, temperature, popolazioni.', fig: plane({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, width: 300, height: 280, fns: [{ f: (x) => 0.2 * (x + 3) * (x - 1) * (x - 4) }], points: [-3, 1, 4].map((x) => ({ x, y: 0 })) }) };
    if (level === 1) return [learn, domain(rng), zerosFromFactored(rng), domain(rng), zerosFromFactored(rng), domain(rng)];
    if (level === 2) return [learn, readGraph(rng), monotone(rng), readGraph(rng), monotone(rng), readGraph(rng)];
    return [learn, asymptote(rng), readGraph(rng), asymptote(rng), domain(rng), asymptote(rng)];
  },
};

void poly;

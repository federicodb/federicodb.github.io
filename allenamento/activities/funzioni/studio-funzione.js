import { plane } from '../../js/gfx/svg.js';
import { poly } from '../../js/engine/helpers.js';
import { settimana } from '../../js/engine/rng.js';

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

// ---------- varianti: stesse competenze, formati diversi (scelte una volta a settimana) ----------
const lin = (a) => (a === 0 ? 'x' : `x ${a < 0 ? '+' : '-'} ${Math.abs(a)}`);
const cubicFig = ({ p, q, r, f }, o = {}) => plane({ xmin: -6, xmax: 6, ymin: -8, ymax: 8, width: 320, height: 300, fns: [{ f }], points: o.points === false ? [] : [p, q, r].map((x) => ({ x, y: 0 })), notable: o.notable });

/** Esiste o no in un punto? Smista funzioni di tipo diverso */
function domainBins(rng) {
  const x0 = rng.int(-2, 2);
  const seen = new Set();
  const items = rng.shuffle([true, true, true, false, false, false]).map((ok) => {
    const it = rng.until(() => {
      const kind = rng.pick(['frac', 'sqrt', 'log']), a = rng.int(-4, 4);
      const tex = { frac: `\\dfrac{${rng.pick(['1', 'x', '2x + 1'])}}{${lin(a)}}`, sqrt: `\\sqrt{${lin(a)}}`, log: `\\ln(${lin(a)})` }[kind];
      const def = { frac: x0 !== a, sqrt: x0 >= a, log: x0 > a }[kind];
      return { label: `$${tex}$`, def };
    }, (v) => v.def === ok && !seen.has(v.label));
    seen.add(it.label);
    return { label: it.label, bin: ok ? 'si' : 'no' };
  });
  return {
    type: 'bins',
    prompt: `Quali funzioni esistono in $x = ${x0}$? Smista.`,
    bins: [{ id: 'si', label: `Esiste in x = ${x0}` }, { id: 'no', label: `Non esiste in x = ${x0}` }],
    items,
    hint: `Sostituisci $x = ${x0}$: il denominatore non deve fare 0, sotto radice serve un numero $\\ge 0$, nel logaritmo un numero $> 0$.`,
    explain: `Si sostituisce $x = ${x0}$ e si controlla la condizione: denominatore $\\ne 0$, radicando $\\ge 0$, argomento del logaritmo $> 0$. Attenzione allo zero: va bene sotto radice, non nel logaritmo.`,
    twin: () => domainBins(rng),
  };
}

/** Zeri letti dal grafico, senza punti evidenziati */
function zerosFromGraph(rng) {
  const c = cubicPick(rng);
  return {
    type: 'numbers',
    fig: cubicFig(c, { points: false, notable: false }),
    prompt: 'Leggi dal grafico gli zeri della funzione.',
    answers: [c.p, c.q, c.r],
    traps: [{ values: [-c.p, -c.q, -c.r], msg: 'Controlla i segni: a sinistra dell\'origine le ascisse sono negative.' }],
    hint: 'Gli zeri sono le ascisse dei punti in cui il grafico incontra l\'asse x.',
    explain: `Il grafico incontra l'asse x in $x = ${c.p}$, $x = ${c.q}$, $x = ${c.r}$.`,
    explainFig: cubicFig(c, { notable: false }),
    placeholder: 'ad es. -2; 1; 4',
    twin: () => zerosFromGraph(rng),
  };
}

/** Dove la funzione è positiva */
function signIntervals(rng) {
  const c = cubicPick(rng);
  const { p, q, r, k } = c;
  const posUp = `$${p} < x < ${q}$ oppure $x > ${r}$`;
  const posDown = `$x < ${p}$ oppure $${q} < x < ${r}$`;
  return {
    type: 'choice',
    fig: cubicFig(c),
    prompt: 'In quali intervalli la funzione è positiva?',
    options: rng.shuffle([
      { label: k > 0 ? posUp : posDown, correct: true },
      { label: k > 0 ? posDown : posUp, why: 'Lì il grafico sta sotto l\'asse x: la funzione è negativa.' },
      { label: `$x > ${p}$`, why: 'Il segno cambia a ogni zero: dopo il primo zero il grafico non resta sempre sopra l\'asse x.' },
      { label: `$y > 0$`, why: 'Serve un insieme di valori di x, non una condizione su y.' },
    ]),
    hint: 'Positiva vuol dire grafico sopra l\'asse x. Il segno può cambiare solo negli zeri.',
    explain: `Il grafico sta sopra l'asse x per ${k > 0 ? posUp : posDown}; negli zeri ${p}, ${q}, ${r} il segno cambia.`,
    twin: () => signIntervals(rng),
  };
}

/** Asintoti da scrivere, per una funzione omografica */
function asymptoteNumbers(rng) {
  const a = rng.intNot(-4, 4), b = rng.intNot(-3, 3);
  const c = rng.until(() => rng.intNot(-5, 5), (v) => b * a + v !== 0);
  const f = (x) => (b * x + c) / (x - a);
  return {
    type: 'numbers', ordered: true,
    prompt: `Trova gli asintoti di $f(x) = \\dfrac{${poly([[b, 'x'], [c, '']])}}{${lin(a)}}$. Scrivi (verticale; orizzontale), cioè i valori di $x$ e di $y$.`,
    answers: [a, b],
    traps: [{ values: [-a, b], msg: 'L\'asintoto verticale è dove il denominatore si annulla: attenzione al segno.' }, { values: [a, c], msg: 'Per x molto grande contano solo i termini con x: il rapporto dei coefficienti di x.' }].filter((t) => t.values[1] !== b || t.values[0] !== a),
    hint: 'Verticale: dove si annulla il denominatore. Orizzontale: rapporto dei coefficienti di x al numeratore e al denominatore.',
    explain: `Il denominatore si annulla in $x = ${a}$ (e il numeratore lì vale $${b * a + c} \\ne 0$): asintoto verticale $x = ${a}$. Per $x \\to \\pm\\infty$ $f(x) \\approx \\dfrac{${b}x}{x} = ${b}$: asintoto orizzontale $y = ${b}$.`,
    explainFig: plane({ xmin: -8, xmax: 8, ymin: -8, ymax: 8, width: 300, height: 300, fns: [{ f, domain: [-8, a - 0.02] }, { f, domain: [a + 0.02, 8] }], vlines: [{ x: a, cls: 'g-guide' }], hlines: [{ y: b, cls: 'g-guide' }], notable: false }),
    placeholder: 'x = …; y = …',
    twin: () => asymptoteNumbers(rng),
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
    const pick = (...gens) => settimana(rng).pick(gens)(rng);
    if (level === 1) return [learn, pick(domain, domainBins), pick(zerosFromFactored, zerosFromGraph), domain(rng), zerosFromFactored(rng), pick(domain, domainBins)];
    if (level === 2) return [learn, readGraph(rng), pick(monotone, signIntervals), pick(readGraph, signIntervals), monotone(rng), pick(readGraph, zerosFromGraph)];
    return [learn, pick(asymptote, asymptoteNumbers), readGraph(rng), pick(asymptote, asymptoteNumbers), pick(domain, domainBins, signIntervals), asymptote(rng)];
  },
};

void poly;

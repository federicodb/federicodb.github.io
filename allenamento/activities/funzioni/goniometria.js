import { tx, frac } from '../../js/engine/helpers.js';
import { settimana } from '../../js/engine/rng.js';
import { unitCircle, plane } from '../../js/gfx/svg.js';

const NICE = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const g = (a, b) => (b ? g(b, a % b) : a);

function toRad(rng) {
  const d = rng.pick(NICE);
  const k = g(d, 180);
  const num = d / k, den = 180 / k;
  const tex = `${num === 1 ? '' : num}\\pi${den === 1 ? '' : `/${den}`}`;
  return {
    type: 'expr', vars: [],
    prompt: `Converti in radianti: $${d}°$. (usa π dal tastierino, ad esempio 3π/4)`,
    answer: `${num}*pi/${den}`,
    traps: [{ expr: `${d}*pi`, msg: 'Per passare ai radianti si moltiplica per π/180.' }],
    hint: '$180° = \\pi$ radianti.',
    explain: `$$${d}° \\cdot \\dfrac{\\pi}{180°} = ${num === 1 ? '' : num}\\dfrac{\\pi}{${den}}$$`.replace('\\dfrac{\\pi}{1}', '\\pi'),
    placeholder: 'ad es. π/3',
    twin: () => toRad(rng),
    texAnswer: tex,
  };
}

function signQuadrant(rng) {
  const d = rng.pick(NICE.filter((x) => x % 90 !== 0));
  const fn = rng.pick(['sin', 'cos']);
  const v = fn === 'sin' ? Math.sin((d * Math.PI) / 180) : Math.cos((d * Math.PI) / 180);
  return {
    type: 'choice',
    fig: unitCircle(d),
    prompt: `Guarda la circonferenza goniometrica. Il ${fn === 'sin' ? 'seno' : 'coseno'} di $${d}°$ è…`,
    options: [
      { label: 'positivo', correct: v > 0, why: v > 0 ? undefined : fn === 'sin' ? 'Il seno è la coordinata y del punto: qui è sotto l\'asse x.' : 'Il coseno è la coordinata x del punto: qui è a sinistra dell\'asse y.' },
      { label: 'negativo', correct: v < 0, why: v < 0 ? undefined : fn === 'sin' ? 'Il seno è la coordinata y: qui il punto è sopra l\'asse x.' : 'Il coseno è la coordinata x: qui il punto è a destra.' },
    ],
    fixedOrder: true,
    explain: `Il punto sulla circonferenza ha coordinate $(\\cos ${d}°;\\,\\sin ${d}°) \\approx (${tx(Math.cos((d * Math.PI) / 180), 2)};\\,${tx(Math.sin((d * Math.PI) / 180), 2)})$.`,
    twin: () => signQuadrant(rng),
  };
}

function valueNotable(rng) {
  const d = rng.pick(NICE);
  const fn = rng.pick(['sin', 'cos']);
  const v = Math.round((fn === 'sin' ? Math.sin((d * Math.PI) / 180) : Math.cos((d * Math.PI) / 180)) * 1e6) / 1e6;
  const vals = [
    ['0', 0], ['\\dfrac{1}{2}', 0.5], ['-\\dfrac{1}{2}', -0.5], ['\\dfrac{\\sqrt{2}}{2}', Math.SQRT1_2], ['-\\dfrac{\\sqrt{2}}{2}', -Math.SQRT1_2],
    ['\\dfrac{\\sqrt{3}}{2}', Math.sqrt(3) / 2], ['-\\dfrac{\\sqrt{3}}{2}', -Math.sqrt(3) / 2], ['1', 1], ['-1', -1],
  ];
  const right = vals.find(([, x]) => Math.abs(x - v) < 1e-6);
  const others = vals.filter((x) => x !== right && Math.abs(Math.abs(x[1]) - Math.abs(v)) < 1e-6).concat(vals.filter((x) => x !== right && Math.abs(Math.abs(x[1]) - Math.abs(v)) > 1e-6));
  const opts = [right, ...others.slice(0, 3)];
  return {
    type: 'choice',
    fig: unitCircle(d),
    prompt: `Quanto vale $\\${fn}\\,${d}°$?`,
    options: opts.map(([t, x]) => ({ label: `$${t}$`, correct: x === right[1], why: x === right[1] ? undefined : Math.abs(Math.abs(x) - Math.abs(v)) < 1e-6 ? 'Il valore assoluto è giusto, il segno no: in che quadrante sei?' : 'Riporta l\'angolo al primo quadrante e usa i valori di 30°, 45°, 60°.' })),
    explain: `$$\\${fn}\\,${d}° = ${right[0]}$$`,
    twin: () => valueNotable(rng),
  };
}

function waveRead(rng) {
  const A = rng.int(1, 4), k = rng.pick([1, 2, 0.5]);
  const T = (2 * Math.PI) / k;
  const ask = rng.pick(['A', 'T']);
  return {
    type: ask === 'A' ? 'number' : 'expr',
    vars: [],
    fig: plane({ xmin: 0, xmax: 4 * Math.PI, ymin: -A - 1, ymax: A + 1, width: 340, height: 200, step: Math.PI / 2, labelStep: Math.PI, fns: [{ f: (x) => A * Math.sin(k * x) }], labels: true }).replace(/>(\d+,?\d*)<\/text>/g, (m, n) => {
      const v = parseFloat(n.replace(',', '.'));
      const r = Math.round(v / Math.PI);
      return Math.abs(v - r * Math.PI) < 0.01 && r > 0 ? `>${r === 1 ? '' : r}π</text>` : m;
    }),
    prompt: ask === 'A' ? 'Il grafico è quello di $y = A\\sin(kx)$. Qual è l\'ampiezza $A$?' : 'Il grafico è quello di $y = A\\sin(kx)$. Qual è il periodo? (usa π, ad esempio 2π)',
    answer: ask === 'A' ? A : `${T / Math.PI}*pi`,
    traps: ask === 'A' ? [{ value: 2 * A, msg: 'Questa è la distanza tra massimo e minimo: l\'ampiezza è la metà.' }] : [{ expr: `${T / Math.PI / 2}*pi`, msg: 'Questo è mezzo periodo: il periodo è la distanza tra due massimi consecutivi.' }],
    hint: ask === 'A' ? 'Quanto sale il grafico sopra l\'asse x?' : 'Misura la distanza tra due massimi consecutivi.',
    explain: ask === 'A' ? `Il massimo è $${A}$, il minimo $-${A}$: l'ampiezza è $${A}$.` : `$$T = \\dfrac{2\\pi}{k} = \\dfrac{2\\pi}{${tx(k)}} = ${T / Math.PI === 1 ? '' : tx(T / Math.PI)}\\pi$$`,
    placeholder: ask === 'T' ? 'ad es. 2π' : undefined,
    twin: () => waveRead(rng),
  };
}

// ---------- varianti: stesse competenze, formati diversi (scelte una volta a settimana) ----------
const radTex = (d) => {
  const k = g(d, 180), num = d / k, den = 180 / k;
  if (den === 1) return `${num === 1 ? '' : num}\\pi`;
  return `\\dfrac{${num === 1 ? '' : num}\\pi}{${den}}`;
};
const NOT_AXIS = NICE.filter((x) => x % 90 !== 0);

/** Dai radianti ai gradi */
function toDeg(rng) {
  const d = rng.pick(NICE);
  const k = g(d, 180);
  return {
    type: 'number', unit: '°',
    cas: { eval: `${d / k}*180/${180 / k}` },
    prompt: `Converti in gradi: $${radTex(d)}$ radianti.`,
    answer: d,
    traps: [{ value: Math.round((d * Math.PI) / 180 * 100) / 100, msg: 'Hai sostituito π con 3,14: per avere i gradi π vale 180°.' }],
    hint: '$\\pi$ radianti $= 180°$: sostituisci $\\pi$ con $180°$.',
    explain: `$$${radTex(d)}\\cdot\\dfrac{180°}{\\pi} = ${d}°$$`,
    twin: () => toDeg(rng),
  };
}

/** Smista angoli (in gradi o in radianti) nei quadranti */
function quadrantBins(rng) {
  const ds = rng.until(() => rng.shuffle(NOT_AXIS).slice(0, 6), (v) => new Set(v.map((d) => Math.floor(d / 90))).size >= 3);
  const names = ['I', 'II', 'III', 'IV'];
  return {
    type: 'bins',
    prompt: 'In quale quadrante cade il lato dell\'angolo? Smista.',
    bins: names.map((n) => ({ id: n, label: n })),
    items: ds.map((d) => ({ label: rng.chance(0.5) ? `$${d}°$` : `$${radTex(d)}$`, bin: names[Math.floor(d / 90)] })),
    hint: 'I quadranti cambiano a $90° = \\dfrac{\\pi}{2}$, $180° = \\pi$ e $270° = \\dfrac{3\\pi}{2}$.',
    explain: ds.slice().sort((a, b) => a - b).map((d) => `$${d}°$: ${names[Math.floor(d / 90)]}`).join(' · '),
    twin: () => quadrantBins(rng),
  };
}

/** Ordina angoli scritti un po' in gradi e un po' in radianti */
function radSort(rng) {
  const ds = rng.shuffle(NICE).slice(0, 4);
  const asRad = rng.shuffle([true, false, rng.chance(0.5), rng.chance(0.5)]);
  return {
    type: 'sort',
    prompt: 'Ordina gli angoli dal più piccolo al più grande.',
    items: ds.map((d, i) => ({ label: asRad[i] ? `$${radTex(d)}$` : `$${d}°$`, value: d })),
    hint: 'Porta tutto in gradi: $\\pi = 180°$.',
    explain: `$$${ds.slice().sort((a, b) => a - b).map((d) => `${radTex(d)} = ${d}°`).join(' \;<\; ')}$$`,
    twin: () => radSort(rng),
  };
}

/** Valori per simmetria a partire da quelli del primo quadrante */
function symmetricValue(rng) {
  const [fn, d, base] = rng.pick([['sin', 150, 30], ['sin', 210, 30], ['sin', 330, 30], ['cos', 120, 60], ['cos', 240, 60], ['cos', 300, 60]]);
  const v = Math.round((fn === 'sin' ? Math.sin((d * Math.PI) / 180) : Math.cos((d * Math.PI) / 180)) * 2) / 2;
  return {
    type: 'number',
    fig: unitCircle(d),
    cas: { eval: `${fn}(${d} deg)` },
    prompt: `Sapendo che $\\${fn}\\,${base}° = \\dfrac{1}{2}$, quanto vale $\\${fn}\\,${d}°$?`,
    answer: v,
    traps: [{ value: -v, msg: `Il valore assoluto è giusto, il segno no: ${fn === 'sin' ? 'il seno è la y del punto' : 'il coseno è la x del punto'}, guarda dove si trova.` }],
    hint: `$${d}°$ è simmetrico di $${base}°$ rispetto a uno degli assi: cambia al massimo il segno.`,
    explain: `$${d}°$ ha lo stesso angolo di riferimento di $${base}°$, e nel suo quadrante il ${fn === 'sin' ? 'seno' : 'coseno'} è ${v > 0 ? 'positivo' : 'negativo'}: $\\${fn}\\,${d}° = ${v > 0 ? '' : '-'}\\dfrac{1}{2}$.`,
    twin: () => symmetricValue(rng),
  };
}

/** Ampiezza e periodo letti dalla formula */
function waveFromFormula(rng) {
  const [k, kTex, T, Twrong] = rng.pick([[2, '2x', '\\pi', '4\\pi'], [3, '3x', '\\dfrac{2\\pi}{3}', '6\\pi'], [0.5, '\\dfrac{x}{2}', '4\\pi', '\\pi']]);
  const A = rng.until(() => rng.int(1, 5), (a) => a !== k && 2 * a !== k);
  const kLbl = k === 0.5 ? '\\dfrac{1}{2}' : k;
  return {
    type: 'choice',
    prompt: `Quali sono ampiezza e periodo di $y = ${A === 1 ? '' : A}\\sin\\left(${kTex}\\right)$?`,
    options: rng.shuffle([
      { label: `ampiezza $${A}$, periodo $${T}$`, correct: true },
      { label: `ampiezza $${A}$, periodo $${Twrong}$`, why: `Il periodo è $\\dfrac{2\\pi}{k}$: si divide per ${k === 0.5 ? '$\\tfrac{1}{2}$' : k}, non si moltiplica.` },
      { label: `ampiezza $${kLbl}$, periodo $${T}$`, why: 'L\'ampiezza è il numero che moltiplica il seno, non quello dentro la parentesi.' },
      { label: `ampiezza $${2 * A}$, periodo $${T}$`, why: 'Questa è la distanza tra massimo e minimo: l\'ampiezza è la metà.' },
    ]),
    explain: `$$A = ${A} \\qquad T = \\dfrac{2\\pi}{${kLbl}} = ${T}$$`,
    explainFig: plane({ xmin: 0, xmax: 4 * Math.PI, ymin: -A - 1, ymax: A + 1, width: 340, height: 200, step: Math.PI / 2, labelStep: Math.PI, fns: [{ f: (x) => A * Math.sin(k * x) }], labels: false }),
    twin: () => waveFromFormula(rng),
  };
}

export default {
  id: 'goniometria',
  area: 'funzioni',
  years: [4],
  mat: ['MAT_K2', 'MAT_K3'],
  ambito: 'Relazioni e funzioni',
  title: 'Goniometria',
  summary: 'Circonferenza goniometrica, radianti, onde.',
  glyph: '◷',
  levels: [
    { name: 'Gradi e radianti', desc: 'Misurare gli angoli in due modi' },
    { name: 'Seno e coseno', desc: 'Segni e valori notevoli' },
    { name: 'Funzioni periodiche', desc: 'Ampiezza e periodo' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Coordinate di un punto che gira',
      body: 'Su una circonferenza di raggio 1, il punto che corrisponde all\'angolo $\\alpha$ ha coordinate $(\\cos\\alpha;\\,\\sin\\alpha)$. Trascina il punto e guarda i due segmenti.',
      board: {
        bbox: [-1.6, 1.6, 1.6, -1.6],
        alt: 'Circonferenza goniometrica con punto trascinabile',
        build: (brd, JXG, t) => {
          const O = brd.create('point', [0, 0], { visible: false, fixed: true });
          const c = brd.create('circle', [O, 1], { strokeColor: t.muted, fixed: true, highlight: false });
          const P = brd.create('glider', [Math.cos(1), Math.sin(1), c], { name: 'P', color: t.series[0], size: 6 });
          brd.create('segment', [O, P], { strokeColor: t.text });
          brd.create('segment', [[0, 0], [() => P.X(), 0]], { strokeColor: t.series[1], strokeWidth: 4 });
          brd.create('segment', [[() => P.X(), 0], P], { strokeColor: t.series[2], strokeWidth: 4 });
          brd.create('text', [-1.5, 1.45, () => `angolo ≈ ${Math.round(((Math.atan2(P.Y(), P.X()) * 180) / Math.PI + 360) % 360)}°`], { fontSize: 15, color: t.text, fixed: true });
          brd.create('text', [-1.5, 1.25, () => `cos ≈ ${P.X().toFixed(2).replace('.', ',')}   sin ≈ ${P.Y().toFixed(2).replace('.', ',')}`], { fontSize: 15, color: t.text, fixed: true });
        },
      },
      fig: unitCircle(40),
      figFallbackOnly: true,
    };
    const pick = (...gens) => settimana(rng).pick(gens)(rng);
    if (level === 1) return [learn, pick(toRad, toDeg), pick(signQuadrant, quadrantBins), toRad(rng), pick(toDeg, radSort), pick(signQuadrant, quadrantBins, radSort)];
    if (level === 2) return [learn, pick(signQuadrant, quadrantBins), valueNotable(rng), pick(valueNotable, symmetricValue), pick(signQuadrant, symmetricValue), valueNotable(rng)];
    return [learn, waveRead(rng), pick(waveRead, waveFromFormula), pick(valueNotable, symmetricValue), pick(waveRead, waveFromFormula), waveRead(rng)];
  },
};

void frac;

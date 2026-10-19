import { scene } from '../contesti.js';
import { tx } from '../../js/engine/helpers.js';
import { box, cylinder } from '../../js/gfx/svg.js';

function prismVolume(rng) {
  const a = rng.int(2, 12), b = rng.int(2, 10), c = rng.int(2, 15);
  return {
    type: 'number', unit: 'cm³',
    fig: box({ a, b, c, labels: [`${a} cm`, `${b} cm`, `${c} cm`] }),
    prompt: 'Qual è il volume del parallelepipedo?',
    answer: a * b * c,
    traps: [{ value: 2 * (a * b + b * c + a * c), msg: 'Questa è la superficie totale: il volume è il prodotto delle tre dimensioni.' }, { value: a + b + c, msg: 'Il volume si ottiene moltiplicando, non sommando.' }],
    hint: 'Volume = area di base × altezza',
    explain: `$$V = ${a}\\cdot ${b}\\cdot ${c} = ${a * b * c}\\ \\text{cm}^3$$ Sono ${a * b * c} cubetti da 1 cm di lato.`,
    twin: () => prismVolume(rng),
  };
}

function surface(rng) {
  const a = rng.int(2, 10), b = rng.int(2, 8), c = rng.int(2, 10);
  return {
    type: 'number', unit: 'cm²',
    fig: box({ a, b, c, labels: [`${a}`, `${b}`, `${c}`] }),
    prompt: `Quanto cartone serve per costruire una scatola chiusa di ${a} × ${b} × ${c} cm? (superficie totale)`,
    answer: 2 * (a * b + b * c + a * c),
    traps: [{ value: a * b * c, msg: 'Questo è il volume.' }, { value: a * b + b * c + a * c, msg: 'Le facce sono sei, a coppie uguali: moltiplica per 2.' }],
    hint: 'Sei facce, a due a due uguali.',
    explain: `$$S = 2\\,(${a}\\cdot ${b} + ${b}\\cdot ${c} + ${a}\\cdot ${c}) = 2\\cdot ${a * b + b * c + a * c} = ${2 * (a * b + b * c + a * c)}\\ \\text{cm}^2$$`,
    twin: () => surface(rng),
  };
}

function cylVolume(rng) {
  const r = rng.int(2, 6), h = rng.int(2, 10);
  const V = Math.PI * r * r * h;
  return {
    type: 'number', unit: 'cm³', decimals: 0,
    alts: [3.14 * r * r * h],
    fig: cylinder({ rLabel: `${r} cm`, hLabel: `${h} cm` }),
    prompt: `Calcola il volume del cilindro (raggio ${r} cm, altezza ${h} cm). Puoi lasciare il risultato con π (scrivendo ad esempio 7π) oppure usare $\\pi \\approx 3{,}14$.`,
    answer: V,
    traps: [{ value: Math.PI * 2 * r * h, msg: 'Questa è la superficie laterale.' }, { value: Math.PI * (2 * r) ** 2 * h, msg: 'Nella formula c\'è il raggio, non il diametro.' }],
    hint: 'Area di base (π r²) per altezza.',
    explain: `$$V = \\pi r^2 h = \\pi\\cdot ${r}^2\\cdot ${h} = ${r * r * h}\\pi \\approx ${tx(3.14 * r * r * h, 1)}\\ \\text{cm}^3$$`,
    twin: () => cylVolume(rng),
  };
}

function cone(rng) {
  const { r, h } = rng.until(() => ({ r: rng.int(2, 6), h: rng.int(2, 12) }), (v) => (v.r * v.r * v.h) % 3 === 0);
  const V = (Math.PI * r * r * h) / 3;
  return {
    type: 'number', unit: 'cm³', decimals: 0,
    alts: [(3.14 * r * r * h) / 3],
    fig: cylinder({ rLabel: `${r} cm`, hLabel: `${h} cm`, cone: true }),
    prompt: `Calcola il volume del cono (raggio ${r} cm, altezza ${h} cm). Puoi lasciare il risultato con π (scrivendo ad esempio 7π) oppure usare $\\pi \\approx 3{,}14$.`,
    answer: V,
    traps: [{ value: Math.PI * r * r * h, msg: 'Questo è il volume del cilindro: il cono ne è un terzo.' }],
    hint: 'Il cono è un terzo del cilindro con stessa base e altezza.',
    explain: `$$V = \\dfrac{\\pi r^2 h}{3} = \\dfrac{\\pi\\cdot ${r * r}\\cdot ${h}}{3} = ${(r * r * h) / 3}\\pi \\approx ${tx((3.14 * r * r * h) / 3, 1)}\\ \\text{cm}^3$$`,
    twin: () => cone(rng),
  };
}

function liters(rng) {
  const a = rng.int(3, 12) * 10, b = rng.int(2, 8) * 10, c = rng.int(3, 10) * 10;
  const L = (a * b * c) / 1000;
  const what = scene(rng, 'vasca');
  return {
    type: 'number', unit: 'litri', decimals: 1,
    fig: box({ a, b, c, labels: [`${a} cm`, `${b} cm`, `${c} cm`] }),
    prompt: `Quanti litri contiene ${what} di ${a} × ${b} × ${c} cm, pieno fino all'orlo?`,
    answer: L,
    traps: [{ value: a * b * c, msg: 'Questi sono cm³: 1 litro = 1 dm³ = 1000 cm³.' }, { value: (a * b * c) / 100, msg: '1 litro corrisponde a 1000 cm³, non 100.' }],
    hint: 'Trasforma le misure in decimetri: 1 dm³ = 1 litro.',
    explain: `In decimetri: $${a / 10}\\cdot ${b / 10}\\cdot ${c / 10} = ${tx(L)}$ dm³ $= ${tx(L)}$ litri.`,
    twin: () => liters(rng),
  };
}

function scaleCube(rng) {
  const k = rng.pick([2, 3]);
  return {
    type: 'choice',
    prompt: `Se raddoppi${k === 3 ? ' (anzi, triplichi)' : ''} il lato di un cubo, il volume diventa…`,
    options: [
      { label: `${k ** 3} volte più grande`, correct: true },
      { label: `${k} volte più grande`, why: 'Il lato cresce in tre direzioni contemporaneamente.' },
      { label: `${k * k} volte più grande`, why: 'Questo vale per l\'area di una faccia; il volume ha una dimensione in più.' },
      { label: `${k * k + k} volte più grande`, why: `Il volume è $${k}^3 = ${k ** 3}$ volte quello iniziale.` },
    ],
    explain: `$$V' = (${k}\\ell)^3 = ${k ** 3}\\,\\ell^3$$ Il volume scala con il cubo del rapporto di similitudine.`,
    twin: () => scaleCube(rng),
  };
}

export default {
  id: 'solidi',
  area: 'geometria',
  years: [2, 3],
  mat: ['MAT_K3', 'MAT_A4', 'MAT_C4'],
  ambito: 'Spazio e figure',
  title: 'Solidi e volumi',
  summary: 'Scatole, cilindri, coni e litri.',
  glyph: '⬚',
  levels: [
    { name: 'Parallelepipedi', desc: 'Volume e superficie' },
    { name: 'Cilindri e coni', desc: 'Con π' },
    { name: 'Capacità', desc: 'Dai cm³ ai litri' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Strati di cubetti', body: 'Il volume conta quanti cubetti di lato 1 riempiono il solido: area della base (quanti in uno strato) per altezza (quanti strati). Per i solidi "a punta" (cono, piramide) si divide per 3.', fig: box({ a: 4, b: 3, c: 2, labels: ['4', '3', '2'] }) };
    if (level === 1) return [learn, prismVolume(rng), surface(rng), prismVolume(rng), scaleCube(rng), surface(rng)];
    if (level === 2) return [learn, cylVolume(rng), cone(rng), cylVolume(rng), cone(rng), prismVolume(rng)];
    return [learn, liters(rng), liters(rng), scaleCube(rng), cylVolume(rng), liters(rng)];
  },
};

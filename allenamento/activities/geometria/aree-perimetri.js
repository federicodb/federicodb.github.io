import { tx, it } from '../../js/engine/helpers.js';
import { polygon, circleFig } from '../../js/gfx/svg.js';

function rectangle(rng) {
  const b = rng.int(3, 20), h = rng.int(2, 15);
  const ask = rng.pick(['area', 'per']);
  return {
    type: 'number', unit: ask === 'area' ? 'cm²' : 'cm',
    fig: polygon({ pts: [[0, 0], [b, 0], [b, h], [0, h]], sides: [`${b} cm`, `${h} cm`], right: [0, 1, 2, 3] }),
    prompt: ask === 'area' ? 'Qual è l\'area del rettangolo?' : 'Qual è il perimetro del rettangolo?',
    answer: ask === 'area' ? b * h : 2 * (b + h),
    traps: ask === 'area' ? [{ value: 2 * (b + h), msg: 'Questo è il perimetro: l\'area è base per altezza.' }] : [{ value: b * h, msg: 'Questa è l\'area: il perimetro è la somma dei lati.' }, { value: b + h, msg: 'I lati sono quattro: base e altezza vanno contate due volte.' }],
    hint: ask === 'area' ? 'Area = base × altezza' : 'Perimetro = somma di tutti i lati',
    explain: ask === 'area' ? `$$A = ${b}\\cdot ${h} = ${b * h}\\ \\text{cm}^2$$` : `$$2p = 2\\cdot(${b} + ${h}) = ${2 * (b + h)}\\ \\text{cm}$$`,
    twin: () => rectangle(rng),
  };
}

function triangle(rng) {
  const b = rng.int(4, 18), h = rng.int(3, 14);
  const off = rng.int(-2, Math.max(0, b - 2));
  if ((b * h) % 2) return triangle(rng);
  return {
    type: 'number', unit: 'cm²',
    fig: polygon({ pts: [[0, 0], [b, 0], [off, h]], sides: [`${b} cm`, '', ''], extra: [{ seg: [[off, h], [off, 0]], dash: true, label: `${h} cm`, cls: 'g-seg' }] }),
    prompt: 'Qual è l\'area del triangolo? (la linea tratteggiata è l\'altezza)',
    answer: (b * h) / 2,
    traps: [{ value: b * h, msg: 'Un triangolo è metà di un rettangolo con la stessa base e altezza: dividi per 2.' }],
    hint: 'Area = base × altezza : 2',
    explain: `$$A = \\dfrac{${b}\\cdot ${h}}{2} = ${(b * h) / 2}\\ \\text{cm}^2$$ Due triangoli uguali formano un parallelogramma di area $b\\cdot h$.`,
    twin: () => triangle(rng),
  };
}

function trapezoid(rng) {
  const B = rng.int(8, 20), b = rng.int(3, B - 3), h = rng.int(3, 12);
  if (((B + b) * h) % 2) return trapezoid(rng);
  const off = rng.int(0, B - b);
  return {
    type: 'number', unit: 'm²',
    fig: polygon({ pts: [[0, 0], [B, 0], [off + b, h], [off, h]], sides: [`${B} m`, '', `${b} m`, ''], extra: [{ seg: [[off + b / 2, h], [off + b / 2, 0]], dash: true, label: `${h} m` }] }),
    prompt: 'Un terreno ha la forma del trapezio in figura. Qual è la sua area?',
    answer: ((B + b) * h) / 2,
    traps: [{ value: (B + b) * h, msg: 'Manca la divisione per 2.' }, { value: B * h, msg: 'Servono entrambe le basi.' }],
    hint: 'Area = (base maggiore + base minore) × altezza : 2',
    explain: `$$A = \\dfrac{(${B} + ${b})\\cdot ${h}}{2} = ${((B + b) * h) / 2}\\ \\text{m}^2$$`,
    twin: () => trapezoid(rng),
  };
}

function circle(rng) {
  const r = rng.int(2, 10);
  const ask = rng.pick(['area', 'circ']);
  const val = ask === 'area' ? Math.PI * r * r : 2 * Math.PI * r;
  return {
    type: 'number', unit: ask === 'area' ? 'cm²' : 'cm', decimals: 1,
    fig: circleFig({ r, label: `r = ${r} cm` }),
    prompt: `${ask === 'area' ? 'Calcola l\'area del cerchio' : 'Calcola la lunghezza della circonferenza'} di raggio ${r} cm. Puoi lasciare il risultato con π (scrivendo ad esempio 7π) oppure usare $\\pi \\approx 3{,}14$.`,
    answer: val,
    alts: [ask === 'area' ? 3.14 * r * r : 2 * 3.14 * r],
    traps: ask === 'area' ? [{ value: 2 * Math.PI * r, msg: 'Questa è la circonferenza: l\'area è π·r².' }, { value: Math.PI * 2 * r * 2 * r, msg: 'Nella formula c\'è il raggio, non il diametro.' }] : [{ value: Math.PI * r * r, msg: 'Questa è l\'area: la circonferenza è 2·π·r.' }],
    hint: ask === 'area' ? '$A = \\pi r^2$' : '$C = 2\\pi r$',
    explain: ask === 'area' ? `$$A = \\pi\\cdot ${r}^2 = ${r * r}\\pi \\approx ${tx(3.14 * r * r, 2)}\\ \\text{cm}^2$$` : `$$C = 2\\pi\\cdot ${r} = ${2 * r}\\pi \\approx ${tx(2 * 3.14 * r, 2)}\\ \\text{cm}$$`,
    twin: () => circle(rng),
  };
}

function composite(rng) {
  // L: rettangolo grande meno rettangolo in un angolo
  const W = rng.int(8, 16), H = rng.int(6, 12), w = rng.int(2, W - 3), h = rng.int(2, H - 3);
  const area = W * H - w * h;
  return {
    type: 'number', unit: 'm²',
    fig: polygon({ pts: [[0, 0], [W, 0], [W, H - h], [W - w, H - h], [W - w, H], [0, H]], sides: [`${W} m`, `${H - h} m`, `${w} m`, `${h} m`, `${W - w} m`, `${H} m`], right: [0, 1, 2, 4, 5] }),
    prompt: 'Una stanza ha la pianta a forma di L come in figura. Quanti metri quadri di pavimento servono?',
    answer: area,
    traps: [{ value: W * H, msg: 'Questa è l\'area del rettangolo intero: togli l\'angolo che manca.' }, { value: 2 * (W + H), msg: 'Questo è il perimetro.' }],
    hint: 'Pensa a un rettangolo grande a cui manca un rettangolo più piccolo, oppure dividi la L in due rettangoli.',
    explain: `$$${W}\\cdot ${H} - ${w}\\cdot ${h} = ${W * H} - ${w * h} = ${area}\\ \\text{m}^2$$ Oppure: $${W - w}\\cdot ${H} + ${w}\\cdot ${H - h} = ${area}$.`,
    twin: () => composite(rng),
  };
}

function tiles(rng) {
  const L = rng.int(3, 7), Wd = rng.int(2, 5);
  const t = rng.pick([20, 25, 50]);
  const n = ((L * 100) / t) * ((Wd * 100) / t);
  return {
    type: 'number', unit: 'piastrelle',
    prompt: `Un bagno rettangolare misura ${L} m × ${Wd} m. Quante piastrelle quadrate di ${t} cm di lato servono per coprire il pavimento?`,
    answer: n,
    traps: [{ value: (L * Wd) / (t * t), msg: 'Le unità di misura devono essere uguali: trasforma i metri in centimetri.' }, { value: (L * Wd * 100) / t, msg: 'Una piastrella copre $' + t + '\\cdot ' + t + '$ cm², non ' + t + ' cm².' }],
    hint: `Quante piastrelle stanno lungo un lato di ${L * 100} cm? E lungo l'altro?`,
    explain: `Lungo i ${L * 100} cm ne stanno $${L * 100} : ${t} = ${(L * 100) / t}$; lungo i ${Wd * 100} cm ne stanno ${(Wd * 100) / t}. Totale: $${(L * 100) / t}\\cdot ${(Wd * 100) / t} = ${n}$ piastrelle.`,
    twin: () => tiles(rng),
  };
}

export default {
  id: 'aree-perimetri',
  area: 'geometria',
  years: [1],
  mat: ['MAT_K3', 'MAT_A4', 'MAT_C4'],
  ambito: 'Spazio e figure',
  title: 'Aree e perimetri',
  summary: 'Rettangoli, triangoli, cerchi e stanze a forma di L.',
  glyph: '▭',
  levels: [
    { name: 'Rettangoli e triangoli', desc: 'Area o perimetro?' },
    { name: 'Trapezi e cerchi', desc: 'Formule e π' },
    { name: 'Nella realtà', desc: 'Piante, pavimenti e piastrelle' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Il bordo e la superficie', body: 'Il perimetro misura il bordo (cm, m), l\'area misura la superficie (cm², m²): quanti quadretti servono a coprirla. Un rettangolo 4 × 3 ha perimetro 14 cm e area 12 cm².', fig: polygon({ pts: [[0, 0], [4, 0], [4, 3], [0, 3]], sides: ['4 cm', '3 cm'], right: [0, 1, 2, 3], extra: [1, 2, 3].map((x) => ({ seg: [[x, 0], [x, 3]], dash: true, cls: 'g-grid' })).concat([1, 2].map((y) => ({ seg: [[0, y], [4, y]], dash: true, cls: 'g-grid' }))) }) };
    if (level === 1) return [learn, rectangle(rng), triangle(rng), rectangle(rng), triangle(rng), rectangle(rng)];
    if (level === 2) return [learn, trapezoid(rng), circle(rng), trapezoid(rng), circle(rng), circle(rng)];
    return [learn, composite(rng), tiles(rng), composite(rng), circle(rng), tiles(rng)];
  },
};

void it;

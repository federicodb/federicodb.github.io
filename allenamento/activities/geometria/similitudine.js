import { scene } from '../contesti.js';
import { tx, frac } from '../../js/engine/helpers.js';
import { polygon } from '../../js/gfx/svg.js';

function sides(rng) {
  const t = rng.pick([[3, 4, 5], [4, 5, 6], [5, 6, 8], [2, 3, 4], [6, 7, 9]]);
  const k = rng.pick([1.5, 2, 2.5, 3]);
  const i = rng.int(0, 2), j = (i + rng.int(1, 2)) % 3;
  const names = ['a', 'b', 'c'];
  return {
    type: 'number', unit: 'cm', decimals: 2,
    fig: polygon({ pts: [[0, 0], [t[2], 0], [(t[2] ** 2 + t[0] ** 2 - t[1] ** 2) / (2 * t[2]), Math.sqrt(Math.max(0.1, t[0] ** 2 - ((t[2] ** 2 + t[0] ** 2 - t[1] ** 2) / (2 * t[2])) ** 2))]], sides: [`c = ${t[2]}`, `b = ${t[1]}`, `a = ${t[0]}`], width: 260, height: 180 }),
    prompt: `Un triangolo ha i lati $a = ${t[0]}$, $b = ${t[1]}$, $c = ${t[2]}$ cm. In un triangolo simile il lato corrispondente ad $${names[i]}$ misura ${tx(t[i] * k).replace('{,}', ',')} cm. Quanto misura il lato corrispondente a $${names[j]}$?`,
    answer: t[j] * k,
    traps: [{ value: t[j] + (t[i] * k - t[i]), msg: 'Nella similitudine i lati si moltiplicano tutti per lo stesso numero, non si aggiunge la stessa quantità.' }],
    hint: `Rapporto di similitudine: $k = ${tx(t[i] * k)} : ${t[i]}$.`,
    explain: `$$k = \\dfrac{${tx(t[i] * k)}}{${t[i]}} = ${tx(k)} \\qquad ${names[j]}' = ${t[j]}\\cdot ${tx(k)} = ${tx(t[j] * k)}\\ \\text{cm}$$`,
    twin: () => sides(rng),
  };
}

function shadow(rng) {
  // ombre scelte perché l'altezza venga "tonda" (al massimo i decimetri): proporzione a mente
  const { pole, ps, ts } = rng.until(() => ({ pole: rng.pick([1, 1.5, 2]), ps: rng.pick([0.5, 0.8, 1.2, 1.5, 2.5]), ts: rng.int(4, 18) }), (v) => Number.isInteger(+((v.pole * v.ts) / v.ps * 10).toFixed(9)));
  const H = (pole * ts) / ps;
  const [what, the] = scene(rng, 'alto');
  return {
    type: 'number', unit: 'm', decimals: 1,
    fig: polygon({ pts: [[0, 0], [ts, 0], [0, H]], sides: [`ombra ${ts} m`, '', '?'], right: [0], width: 300, height: 200 }),
    prompt: `Nello stesso momento, un'asta alta ${tx(pole).replace('{,}', ',')} m fa un'ombra di ${tx(ps).replace('{,}', ',')} m e ${what} fa un'ombra di ${ts} m. Quanto è ${the.startsWith('la ') || the === 'l\'insegna' ? 'alta' : 'alto'} ${the}?`,
    answer: H,
    traps: [{ value: (ps * ts) / pole, msg: 'Proporzione invertita: altezza sta a ombra come altezza sta a ombra.' }],
    hint: 'I raggi del Sole sono paralleli: i due triangoli asta–ombra sono simili.',
    explain: `$$\\dfrac{h}{${ts}} = \\dfrac{${tx(pole)}}{${tx(ps)}} \\Rightarrow h = ${ts}\\cdot\\dfrac{${tx(pole)}}{${tx(ps)}} \\approx ${tx(H, 2)}\\ \\text{m}$$ È il metodo con cui Talete misurò l'altezza delle piramidi.`,
    twin: () => shadow(rng),
  };
}

function areaScale(rng) {
  const k = rng.pick([2, 3, 4, 1.5]);
  const A = rng.int(3, 20);
  return {
    type: 'number', unit: 'cm²', decimals: 2,
    prompt: `Una figura ha area ${A} cm². La ingrandisci con rapporto di similitudine $k = ${tx(k)}$ (tutte le lunghezze ×${tx(k).replace('{,}', ',')}). Qual è la nuova area?`,
    answer: A * k * k,
    traps: [{ value: A * k, msg: `Le lunghezze si moltiplicano per ${tx(k).replace('{,}', ',')}, ma l'area per $k^2$: cresce in due direzioni.` }],
    hint: 'Pensa a un quadrato: raddoppiando il lato, quante volte cresce l\'area?',
    explain: `$$A' = A\\cdot k^2 = ${A}\\cdot ${tx(k)}^2 = ${tx(A * k * k)}\\ \\text{cm}^2$$ Le aree scalano con $k^2$, i volumi con $k^3$.`,
    explainFig: polygon({ pts: [[0, 0], [2, 0], [2, 2], [0, 2]], extra: [{ seg: [[1, 0], [1, 2]], dash: true }, { seg: [[0, 1], [2, 1]], dash: true }], sides: ['2', '2'], width: 160, height: 160 }),
    twin: () => areaScale(rng),
  };
}

function isSimilar(rng) {
  const t = rng.pick([[3, 4, 5], [4, 6, 7], [5, 5, 8], [2, 3, 4]]);
  const k = rng.pick([2, 3, 1.5]);
  const yes = rng.chance(0.5);
  const u = t.map((x) => x * k);
  if (!yes) u[rng.int(0, 2)] += rng.pick([1, -1]);
  return {
    type: 'choice',
    prompt: `Il triangolo di lati ${t.join(', ')} è simile al triangolo di lati ${u.map((x) => tx(x).replace('{,}', ',')).join(', ')}?`,
    options: [
      { label: 'Sì', correct: yes, why: yes ? undefined : 'Calcola i rapporti tra lati corrispondenti: devono essere tutti uguali.' },
      { label: 'No', correct: !yes, why: !yes ? undefined : `Tutti i rapporti valgono ${tx(k).replace('{,}', ',')}.` },
    ],
    fixedOrder: true,
    explain: `Rapporti: ${u.map((x, i) => `$${frac(Math.round(x * 2), t[i] * 2)}$`).join(', ')}. ${yes ? 'Sono uguali: i triangoli sono simili.' : 'Non sono tutti uguali: non sono simili.'}`,
    twin: () => isSimilar(rng),
  };
}

export default {
  id: 'similitudine',
  area: 'geometria',
  years: [2],
  mat: ['MAT_K3', 'MAT_C4'],
  ambito: 'Spazio e figure',
  title: 'Similitudine e Talete',
  summary: 'Stessa forma, misure diverse: ombre, mappe, ingrandimenti.',
  glyph: '◺◺',
  levels: [
    { name: 'Rapporto di similitudine', desc: 'Lati corrispondenti' },
    { name: 'Talete e le ombre', desc: 'Misurare l\'altezza senza salire' },
    { name: 'Aree che crescono di più', desc: 'k per le lunghezze, k² per le aree' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Stessa forma', body: 'Due figure sono simili se una è l\'ingrandimento dell\'altra: angoli uguali e lati in proporzione. Il numero per cui si moltiplicano tutti i lati è il rapporto di similitudine $k$.', fig: polygon({ pts: [[0, 0], [4, 0], [1, 3], [6, 0], [14, 0], [8, 6]].slice(0, 3), sides: ['4', '', ''], width: 200, height: 150 }) + polygon({ pts: [[0, 0], [8, 0], [2, 6]], sides: ['8', '', ''], width: 240, height: 180 }) };
    if (level === 1) return [learn, sides(rng), isSimilar(rng), sides(rng), isSimilar(rng), sides(rng)];
    if (level === 2) return [learn, shadow(rng), sides(rng), shadow(rng), shadow(rng), isSimilar(rng)];
    return [learn, areaScale(rng), shadow(rng), areaScale(rng), sides(rng), areaScale(rng)];
  },
};

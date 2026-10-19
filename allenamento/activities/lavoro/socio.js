// MATEMATICA AL LAVORO — Servizi Socio-Sanitari (Servizi per la sanità e l'assistenza sociale)
// Porzioni e diluizioni, liquidi della giornata, turni, rampe accessibili (pendenza massima 8%),
// indicatori demografici, medie da tabelle, budget di un servizio, probabilità.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { polygon, table, plane } from '../../js/gfx/svg.js';

// ---------- livello 1: porzioni e dosi ----------
function porzioni(rng) {
  const base = rng.pick([4, 5, 6]);
  const q = rng.pick([300, 400, 500, 600]);
  const N = rng.until(() => rng.pick([10, 12, 15, 20, 24, 30, 40]), (n) => Number.isInteger((q * n) / base));
  const ans = (q * N) / base;
  const what = rng.pick(['pasta', 'riso', 'farina per i biscotti', 'verdure']);
  return {
    type: 'number', unit: 'g',
    prompt: `Una ricetta per ${base} persone richiede ${q} g di ${what}. Quanti grammi servono per ${N} ospiti del centro diurno?`,
    answer: ans,
    traps: [{ value: (q * base) / N, msg: 'Con più persone servono più grammi: la proporzione è diretta.' }].filter((t) => t.value !== ans),
    hint: `Per una persona: $${q} : ${base}$ g.`,
    explain: `$$\\dfrac{${q}}{${base}}\\cdot ${N} = ${tx(q / base)}\\cdot ${N} = ${ans}\\ \\text{g}$$`,
    cas: { eval: `${q}/${base}*${N}` },
    twin: () => porzioni(rng),
  };
}

function detergente(rng) {
  const c = rng.pick([10, 20, 25, 40, 50]);
  const L = rng.pick([2, 3, 4, 5, 8, 10]);
  const ml = c * L;
  return {
    type: 'number', unit: 'ml',
    prompt: `Le istruzioni del detergente per le superfici dicono: ${c} ml di prodotto per ogni litro d'acqua. Quanti ml servono per un secchio da ${L} litri?`,
    answer: ml,
    hint: `${c} ml per ognuno dei ${L} litri.`,
    explain: `$$${c}\\cdot ${L} = ${ml}\\ \\text{ml}$$ Più prodotto non pulisce meglio: rispettare la dose evita sprechi e irritazioni.`,
    cas: { eval: `${c}*${L}` },
    twin: () => detergente(rng),
  };
}

function liquidi(rng) {
  const bic = rng.int(3, 6), b = rng.pick([150, 200, 250]);
  const tis = rng.pick([200, 250, 300]);
  const brodo = rng.pick([200, 250, 300]);
  const tot = bic * b + tis + brodo;
  return {
    type: 'number', unit: 'litri', decimals: 2,
    fig: table(['Bevanda', 'Quantità'], [[`Acqua (${bic} bicchieri)`, `${b} ml l'uno`], ['Tisana', `${tis} ml`], ['Brodo', `${brodo} ml`]], { caption: 'Scheda dei liquidi di un ospite' }),
    prompt: 'Quanti litri di liquidi ha assunto l\'ospite nella giornata?',
    answer: tot / 1000,
    traps: [{ value: tot, msg: 'Questi sono millilitri: 1 litro = 1000 ml.' }, { value: (b + tis + brodo) / 1000, msg: `I bicchieri d'acqua sono ${bic}: conta ${bic} volte ${b} ml.` }],
    hint: `$${bic}\\cdot ${b} + ${tis} + ${brodo}$ ml, poi dividi per 1000.`,
    explain: `$$${bic}\\cdot ${b} + ${tis} + ${brodo} = ${tot}\\ \\text{ml} = ${tx(tot / 1000)}\\ \\text{litri}$$ La scheda dei liquidi aiuta a prevenire la disidratazione, frequente nelle persone anziane.`,
    cas: { eval: `(${bic}*${b}+${tis}+${brodo})/1000` },
    twin: () => liquidi(rng),
  };
}

// ---------- livello 2: spazi accessibili e territorio ----------
function rampa(rng) {
  const h = rng.pick([8, 12, 16, 20, 24, 32, 40]);
  const L = h / 0.08;
  return {
    type: 'number', unit: 'm', decimals: 2,
    fig: polygon({ pts: [[0, 0], [10, 0], [10, 2]], sides: ['lunghezza ?', `${h} cm`, ''], right: [1], width: 300, height: 140 }),
    prompt: `Per superare un gradino alto ${h} cm serve una rampa per la carrozzina. La pendenza non deve superare l'8% (norma sulle barriere architettoniche). Quanto deve essere lunga la rampa, come minimo, in metri?`,
    answer: L / 100,
    traps: [{ value: (h * 0.08) / 100, msg: 'Pendenza = dislivello : lunghezza. Qui la lunghezza è l\'incognita: si divide il dislivello per 0,08.' }, { value: L, msg: 'Questi sono centimetri: la domanda chiede i metri.' }],
    hint: `$\\dfrac{${h}}{L} = 0{,}08 \\Rightarrow L = ${h} : 0{,}08$ (in cm).`,
    explain: `$$L = \\dfrac{${h}}{0{,}08} = ${tx(L)}\\ \\text{cm} = ${tx(L / 100)}\\ \\text{m}$$ Pendenza 8% vuol dire salire di 8 cm ogni metro.`,
    cas: { eval: `${h}/0.08/100` },
    twin: () => rampa(rng),
  };
}

function rampaANorma(rng) {
  const { h, L } = rng.until(() => ({ h: rng.pick([10, 15, 20, 30]), L: rng.pick([1.5, 2, 2.5, 3, 4, 5]) }), (o) => Number.isInteger((o.h / o.L) * 10));
  const p = (h / (L * 100)) * 100;
  return {
    type: 'number', unit: '%', decimals: 1,
    prompt: `Una rampa supera un dislivello di ${h} cm in ${it(L)} m di lunghezza. Qual è la sua pendenza in percentuale? (È a norma se non supera l'8%.)`,
    answer: p,
    traps: [{ value: (L * 100) / h, msg: 'Divisione capovolta: pendenza = dislivello : lunghezza.' }],
    hint: `Porta tutto in centimetri: ${it(L)} m = ${L * 100} cm.`,
    explain: `$$\\dfrac{${h}}{${L * 100}}\\cdot 100 = ${tx(p, 1)}\\%$$ ${p <= 8 ? 'È a norma.' : 'Supera l\'8%: non è a norma, troppo ripida per una carrozzina.'}`,
    cas: { eval: `${h}/(${L}*100)*100` },
    twin: () => rampaANorma(rng),
  };
}

function indiceVecchiaia(rng) {
  const giovani = rng.pick([800, 1000, 1200, 1500, 2000]);
  const k = rng.pick([1.2, 1.5, 1.8, 2, 2.5]);
  const anziani = giovani * k;
  const I = k * 100;
  return {
    type: 'number',
    fig: table(['Fascia d\'età', 'Abitanti'], [['0–14 anni', giovani.toLocaleString('it-IT')], ['65 anni e più', anziani.toLocaleString('it-IT')]], { caption: 'Popolazione di un piccolo comune' }),
    prompt: 'L\'indice di vecchiaia (ISTAT) è il numero di anziani (65 anni e più) ogni 100 giovani (0–14 anni). Quanto vale in questo comune?',
    answer: I,
    traps: [{ value: (giovani / anziani) * 100, msg: 'Rapporto capovolto: anziani diviso giovani.' }],
    hint: `$\\dfrac{${anziani}}{${giovani}}\\cdot 100$`,
    explain: `$$\\dfrac{${anziani}}{${giovani}}\\cdot 100 = ${tx(I)}$$ Ci sono ${tx(I)} anziani ogni 100 giovani. In Italia l'indice supera 190: è tra i più alti d'Europa.`,
    cas: { eval: `${anziani}/${giovani}*100` },
    twin: () => indiceVecchiaia(rng),
  };
}

// ---------- livello 3: dati e budget del servizio ----------
function etaMedia(rng) {
  const classi = [70, 80, 90];
  const n = rng.until(() => classi.map(() => rng.int(2, 10)), (v) => Number.isInteger((v[0] * 70 + v[1] * 80 + v[2] * 90) / (v[0] + v[1] + v[2])));
  const tot = n.reduce((a, b) => a + b, 0);
  const media = (n[0] * 70 + n[1] * 80 + n[2] * 90) / tot;
  return {
    type: 'number', unit: 'anni',
    fig: table(['Età (anni)', '70', '80', '90'], [['Ospiti', ...n]], { caption: 'Ospiti di un centro diurno' }),
    prompt: 'Qual è l\'età media degli ospiti?',
    answer: media,
    traps: [{ value: 80, msg: 'La media di 70, 80 e 90 non basta: ogni età va pesata con il numero di ospiti.' }].filter((t) => t.value !== media),
    hint: `Somma età × ospiti e dividi per ${tot} ospiti.`,
    explain: `$$\\dfrac{70\\cdot ${n[0]} + 80\\cdot ${n[1]} + 90\\cdot ${n[2]}}{${tot}} = \\dfrac{${70 * n[0] + 80 * n[1] + 90 * n[2]}}{${tot}} = ${media}\\ \\text{anni}$$ È una media ponderata.`,
    cas: { eval: `(70*${n[0]}+80*${n[1]}+90*${n[2]})/${tot}` },
    twin: () => etaMedia(rng),
  };
}

function oreBudget(rng) {
  const F = rng.pick([50, 100, 150]);
  const c = rng.pick([18, 20, 22, 25]);
  const h = rng.int(8, 30);
  const extra = rng.int(1, c - 1);
  const B = F + c * h + extra;
  return {
    type: 'number', unit: 'ore',
    prompt: `Un servizio di assistenza domiciliare costa ${euro(F)} al mese di quota fissa più ${euro(c)} l'ora. Una famiglia ha un budget di ${euro(B)} al mese. Quante ore intere di assistenza può avere, al massimo?`,
    answer: h,
    traps: [{ value: h + 1, msg: 'Arrotondando per eccesso si sfora il budget: si arrotonda per difetto.' }, { value: Math.floor(B / c), msg: 'Prima togli la quota fissa dal budget.' }].filter((t) => t.value !== h),
    hint: `$${F} + ${c}x \\le ${B}$`,
    explain: `$$${c}x \\le ${B} - ${F} = ${B - F} \\Rightarrow x \\le ${tx((B - F) / c)}$$ Le ore sono intere: al massimo ${h}.`,
    explainFig: plane({ xmin: 0, xmax: h + 6, ymin: 0, ymax: Math.ceil((F + c * (h + 6)) / 100) * 100, width: 320, height: 210, fns: [{ f: (x) => F + c * x, domain: [0, h + 6] }], hlines: [{ y: B, label: 'budget' }], points: [{ x: h, y: F + c * h, label: `${h} ore` }], xName: 'ore', yName: '€' }),
    twin: () => oreBudget(rng),
  };
}

function probAttivita(rng) {
  const N = rng.pick([20, 25, 40, 50]);
  const p = rng.pick([20, 30, 40, 60]);
  const m = (N * p) / 100;
  const att = rng.pick(['il laboratorio di musica', 'la ginnastica dolce', 'il laboratorio di pittura']);
  return {
    type: 'number', unit: '%',
    prompt: `In una residenza ci sono ${N} ospiti e ${m} hanno scelto ${att}. Si estrae a sorte un ospite per un'intervista. Qual è la probabilità, in percentuale, che abbia scelto ${att}?`,
    answer: p,
    traps: [{ value: 100 - p, msg: 'Questa è la probabilità dell\'evento contrario.' }].filter((t) => t.value !== p),
    hint: `Casi favorevoli : casi possibili = $${m} : ${N}$.`,
    explain: `$$P = \\dfrac{${m}}{${N}} = ${tx(p / 100)} = ${p}\\%$$`,
    cas: { eval: `${m}/${N}*100` },
    twin: () => probAttivita(rng),
  };
}

export default {
  id: 'lavoro-socio',
  area: 'lavoro',
  indirizzo: 'socio',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_C3'],
  ambito: 'Dati e previsioni',
  title: 'Matematica nei servizi alla persona',
  summary: 'Porzioni, liquidi, rampe accessibili, indicatori della popolazione, budget del servizio.',
  glyph: '♡',
  levels: [
    { name: 'Porzioni e dosi', desc: 'Ricette, detergenti, scheda dei liquidi' },
    { name: 'Spazi e territorio', desc: 'Rampe all\'8%, indice di vecchiaia' },
    { name: 'Dati del servizio', desc: 'Media ponderata, budget, probabilità' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Proporzioni di ogni giorno', body: 'Ricette, dosi di detergente, liquidi della giornata: sono proporzioni dirette. Se le persone raddoppiano, raddoppiano anche gli ingredienti. Attenzione alle unità: 1 litro = 1000 ml.' },
        porzioni(rng), detergente(rng), liquidi(rng), porzioni(rng), liquidi(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'La pendenza giusta', body: 'Pendenza = dislivello : lunghezza. Per le rampe la norma sulle barriere architettoniche fissa al massimo l\'8%: si sale di 8 cm ogni metro. L\'indice di vecchiaia conta gli anziani ogni 100 giovani.', fig: polygon({ pts: [[0, 0], [100, 0], [100, 8]], sides: ['100 cm', '8 cm', ''], right: [1], width: 300, height: 110 }) },
        rampa(rng), rampaANorma(rng), indiceVecchiaia(rng), rampa(rng), rampaANorma(rng),
      ];
    }
    return [
      { type: 'learn', title: 'Numeri per decidere', body: 'Una media ponderata pesa ogni valore con quante volte compare. Un budget è una disequazione: costo fisso + costo orario × ore ≤ soldi disponibili.' },
      etaMedia(rng), oreBudget(rng), probAttivita(rng), etaMedia(rng), oreBudget(rng),
    ];
  },
};

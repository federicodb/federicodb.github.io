// MATEMATICA AL LAVORO — Graphic Design (Servizi commerciali, comunicazione visiva)
// Formati e rapporti d'aspetto, risoluzione di stampa, griglie di impaginazione,
// ridimensionamenti, preventivi con IVA, risultati delle campagne, crescita dei follower.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { polygon, table, plane } from '../../js/gfx/svg.js';

// ---------- livello 1: formati ----------
function formato(rng) {
  const [a, b] = rng.pick([[16, 9], [4, 3], [3, 2], [4, 5], [9, 16]]);
  const k = rng.pick([40, 60, 80, 120, 160, 240]);
  const W = a * k, H = b * k;
  return {
    type: 'number', unit: 'px',
    fig: polygon({ pts: [[0, 0], [a, 0], [a, b], [0, b]], sides: [`${W} px`, '?', '', ''], width: 260, height: 200 }),
    prompt: `Un'immagine in formato ${a}:${b} è larga ${W} pixel. Quanto deve essere alta per non deformarsi?`,
    answer: H,
    traps: [{ value: (W * a) / b, msg: `Rapporto capovolto: l'altezza sta alla larghezza come ${b} sta a ${a}.` }].filter((t) => t.value !== H),
    hint: `$${W} : ${a} = ${k}$, poi moltiplica per ${b}.`,
    explain: `$$h = ${W}\\cdot\\dfrac{${b}}{${a}} = ${k}\\cdot ${b} = ${H}\\ \\text{px}$$`,
    cas: { eval: `${W}*${b}/${a}` },
    twin: () => formato(rng),
  };
}

function risoluzione(rng) {
  // pollici interi: 1 pollice = 2,54 cm
  const inch = rng.pick([2, 4, 5, 8, 10]);
  const dpi = rng.pick([150, 300]);
  const cm = +(inch * 2.54).toFixed(2);
  const px = inch * dpi;
  return {
    type: 'number', unit: 'pixel',
    prompt: `Un'immagine va stampata larga ${tx(cm).replace('{,}', ',')} cm a ${dpi} dpi (punti per pollice). Sapendo che 1 pollice = 2,54 cm, quanti pixel di larghezza servono?`,
    answer: px,
    traps: [{ value: cm * dpi, msg: 'I dpi sono punti per pollice: prima trasforma i centimetri in pollici.' }],
    hint: `$${tx(cm)} : 2{,}54 = ${inch}$ pollici.`,
    explain: `$$${tx(cm)}\\ \\text{cm} = ${inch}\\ \\text{pollici} \\qquad ${inch}\\cdot ${dpi} = ${px}\\ \\text{pixel}$$ Per la stampa di qualità si usano 300 dpi; per lo schermo bastano molti meno pixel.`,
    cas: { eval: `${cm}/2.54*${dpi}` },
    twin: () => risoluzione(rng),
  };
}

function ridimensiona(rng) {
  const w = rng.pick([800, 1200, 1600, 2000, 2400]);
  const h = rng.pick([600, 900, 1000, 1200]);
  const p = rng.pick([25, 50, 75, 150]);
  const nw = (w * p) / 100, nh = (h * p) / 100;
  return {
    type: 'numbers', ordered: true,
    prompt: `Un'immagine di ${w} × ${h} pixel viene ridimensionata al ${p}%. Quali sono le nuove misure? Scrivi (larghezza; altezza).`,
    answers: [nw, nh],
    hint: `Il ${p}% vuol dire moltiplicare per ${it(p / 100)}.`,
    explain: `$$${w}\\cdot ${tx(p / 100)} = ${nw} \\qquad ${h}\\cdot ${tx(p / 100)} = ${nh}$$ Larghezza e altezza cambiano dello stesso fattore: le proporzioni restano uguali.`,
    placeholder: '(larghezza; altezza)',
    twin: () => ridimensiona(rng),
  };
}

// ---------- livello 2: impaginazione ----------
function colonne(rng) {
  const { L, m, n, g } = rng.until(
    () => ({ L: rng.pick([210, 297]), m: rng.pick([15, 20, 25]), n: rng.pick([2, 3, 4, 5]), g: rng.pick([4, 5, 6, 10]) }),
    (v) => Number.isInteger((v.L - 2 * v.m - (v.n - 1) * v.g) / v.n),
  );
  const c = (L - 2 * m - (n - 1) * g) / n;
  return {
    type: 'number', unit: 'mm',
    fig: table(['Pagina', 'Margini', 'Colonne', 'Spazio tra colonne'], [[`${L} mm`, `${m} mm per lato`, n, `${g} mm`]]),
    prompt: `Una pagina larga ${L} mm ha margini di ${m} mm a destra e a sinistra. Va divisa in ${n} colonne uguali separate da spazi di ${g} mm. Quanto è larga ogni colonna?`,
    answer: c,
    traps: [{ value: (L - 2 * m) / n, msg: `Mancano gli spazi tra le colonne: con ${n} colonne gli spazi sono ${n - 1}.` }, { value: (L - 2 * m - n * g) / n, msg: `Gli spazi tra ${n} colonne sono ${n - 1}, non ${n}.` }].filter((t) => t.value !== c),
    hint: `Spazio utile: $${L} - 2\\cdot ${m} - ${n - 1}\\cdot ${g}$.`,
    explain: `$$\\dfrac{${L} - ${2 * m} - ${(n - 1) * g}}{${n}} = \\dfrac{${L - 2 * m - (n - 1) * g}}{${n}} = ${c}\\ \\text{mm}$$`,
    cas: { eval: `(${L}-2*${m}-(${n}-1)*${g})/${n}` },
    twin: () => colonne(rng),
  };
}

function logoScala(rng) {
  const w = rng.pick([40, 60, 80, 120]);
  const h = rng.pick([20, 30, 50]);
  const k = rng.pick([2, 3, 5, 1.5]);
  const nw = w * k, nh = h * k;
  return {
    type: 'number', unit: 'mm',
    prompt: `Un logo misura ${w} × ${h} mm. Sul cartellone deve diventare largo ${nw} mm senza deformarsi. Quanto sarà alto?`,
    answer: nh,
    traps: [{ value: h + (nw - w), msg: 'Aggiungere gli stessi millimetri deforma il logo: bisogna moltiplicare per lo stesso fattore.' }].filter((t) => t.value !== nh),
    hint: `La larghezza è stata moltiplicata per $${nw} : ${w} = ${tx(k)}$.`,
    explain: `Fattore di scala: $${nw} : ${w} = ${tx(k)}$. Altezza: $${h}\\cdot ${tx(k)} = ${nh}$ mm. Le figure ingrandite sono simili: tutte le misure si moltiplicano per lo stesso numero.`,
    cas: { eval: `${h}*${nw}/${w}` },
    twin: () => logoScala(rng),
  };
}

function preventivo(rng) {
  const ore = rng.pick([5, 8, 10, 12, 20]);
  const t = rng.pick([20, 25, 30, 40]);
  const st = rng.pick([50, 100, 150, 200]);
  const net = ore * t + st;
  const tot = net * 1.22;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Preventivo per un manifesto: ${ore} ore di progettazione a ${euro(t)} l'ora, più ${euro(st)} di stampa. Aggiungi l'IVA al 22%. Quanto paga il cliente?`,
    answer: tot,
    traps: [{ value: net, msg: 'Manca l\'IVA: moltiplica per 1,22.' }, { value: ore * t * 1.22 + st, msg: 'L\'IVA si applica anche alla stampa.' }],
    hint: `Imponibile: $${ore}\\cdot ${t} + ${st} = ${net}$ €.`,
    explain: `$$${ore}\\cdot ${t} + ${st} = ${net}\\ € \\qquad ${net}\\cdot 1{,}22 = ${tx(tot)}\\ €$$`,
    cas: { eval: `(${ore}*${t}+${st})*1.22` },
    twin: () => preventivo(rng),
  };
}

// ---------- livello 3: campagne ----------
function ctr(rng) {
  const I = rng.pick([1000, 2000, 4000, 5000, 10000, 20000]);
  const r = rng.pick([0.5, 1, 1.5, 2, 2.5, 4]);
  const c = (I * r) / 100;
  return {
    type: 'number', unit: '%', decimals: 2,
    fig: table(['Impressioni', 'Clic'], [[I.toLocaleString('it-IT'), c]], { caption: 'Risultati dell\'annuncio' }),
    prompt: `Un annuncio è stato mostrato ${I.toLocaleString('it-IT')} volte e ha ricevuto ${c} clic. Qual è il CTR (percentuale di clic)?`,
    answer: r,
    traps: [{ value: r / 100, msg: 'Questo è il rapporto: per la percentuale moltiplica per 100.' }],
    hint: `$\\dfrac{${c}}{${I}}\\cdot 100$`,
    explain: `$$\\text{CTR} = \\dfrac{${c}}{${I}}\\cdot 100 = ${tx(r)}\\%$$`,
    cas: { eval: `${c}/${I}*100` },
    twin: () => ctr(rng),
  };
}

function costoClic(rng) {
  const c = rng.pick([50, 80, 100, 200, 250, 400]);
  const cpc = rng.pick([0.2, 0.25, 0.4, 0.5]);
  const B = c * cpc;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Una campagna è costata ${euro(B)} e ha portato ${c} clic. Quanto è costato in media ogni clic?`,
    answer: cpc,
    traps: [{ value: c / B, msg: 'Divisione al contrario: euro diviso clic.' }].filter((t) => Math.abs(t.value - cpc) > 0.01),
    hint: 'Costo per clic = spesa : numero di clic.',
    explain: `$$${tx(B)} : ${c} = ${tx(cpc)}\\ €$$`,
    cas: { eval: `${B}/${c}` },
    twin: () => costoClic(rng),
  };
}

function follower(rng) {
  const F0 = rng.pick([1000, 2000, 5000]);
  const n = 2;
  const p = rng.pick([10, 20, 50]);
  const F = Math.round(F0 * (1 + p / 100) ** n);
  return {
    type: 'number', unit: 'follower',
    fig: plane({ xmin: 0, xmax: 4, ymin: 0, ymax: Math.ceil((F0 * (1 + p / 100) ** 4) / 1000) * 1000, width: 300, height: 200, step: 1, fns: [{ f: (x) => F0 * (1 + p / 100) ** x, domain: [0, 4] }], points: [{ x: 0, y: F0 }, { x: n, y: F, label: '?' }], xName: 'mesi', yName: 'follower' }),
    prompt: `Un profilo ha ${F0.toLocaleString('it-IT')} follower e cresce del ${p}% ogni mese. Quanti follower avrà dopo ${n} mesi?`,
    answer: F,
    traps: [{ value: F0 + (F0 * p * n) / 100, msg: `Ogni mese il ${p}% si calcola sui follower di quel mese, che sono sempre di più: la crescita è esponenziale, non lineare.` }],
    hint: `Ogni mese si moltiplica per ${it(1 + p / 100)}.`,
    explain: `$$${F0}\\cdot ${tx(1 + p / 100)}^{${n}} = ${F}$$ Mese per mese: ${Array.from({ length: n + 1 }, (_, i) => Math.round(F0 * (1 + p / 100) ** i)).join(' → ')}.`,
    cas: { eval: `${F0}*(1+${p}/100)^${n}` },
    twin: () => follower(rng),
  };
}

export default {
  id: 'lavoro-grafica',
  area: 'lavoro',
  indirizzo: 'grafica',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_A2'],
  ambito: 'Relazioni e funzioni',
  title: 'Matematica per la grafica',
  summary: 'Formati, pixel e dpi, griglie, ridimensionamenti, preventivi, dati delle campagne.',
  glyph: 'Aa',
  levels: [
    { name: 'Formati', desc: 'Rapporti d\'aspetto, pixel e dpi, ridimensionare' },
    { name: 'Impaginazione e preventivi', desc: 'Colonne, loghi in scala, IVA' },
    { name: 'Campagne', desc: 'CTR, costo per clic, crescita dei follower' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Proporzioni che non deformano', body: 'Un formato 16:9 vuol dire: per ogni 16 parti di larghezza, 9 di altezza. Se cambi la larghezza, l\'altezza cambia nello stesso rapporto. In stampa: pixel = pollici × dpi, con 1 pollice = 2,54 cm.' },
        formato(rng), risoluzione(rng), ridimensiona(rng), formato(rng), risoluzione(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'La griglia', body: 'Larghezza di una colonna = (pagina − margini − spazi tra le colonne) : numero di colonne. Con $n$ colonne gli spazi in mezzo sono $n - 1$.' },
        colonne(rng), logoScala(rng), preventivo(rng), colonne(rng), logoScala(rng),
      ];
    }
    return [
      { type: 'learn', title: 'Leggere i numeri di una campagna', body: 'CTR = clic : impressioni × 100. Costo per clic = spesa : clic. Una crescita "del 10% al mese" è esponenziale: ogni mese si moltiplica per 1,1.' },
      ctr(rng), costoClic(rng), follower(rng), ctr(rng), follower(rng),
    ];
  },
};

// MATEMATICA AL LAVORO — Elettrico-Elettronico (Manutenzione e assistenza tecnica)
// Legge di Ohm, potenza ed energia, serie e parallelo, partitore, tolleranze,
// corrente alternata, decibel, costante di tempo.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { plane, table } from '../../js/gfx/svg.js';

// schema essenziale: generatore e resistenze in serie o in parallelo (SVG, colori del tema)
function schema(kind, labels) {
  const W = 300, H = 150;
  let g = '';
  const line = (x1, y1, x2, y2) => `<line class="g-seg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const res = (x, y, lab, vert = false) => vert
    ? `<rect class="g-fill1 g-shape" x="${x - 9}" y="${y - 22}" width="18" height="44" rx="3"/><text class="g-lbl" x="${x + 16}" y="${y + 5}">${lab}</text>`
    : `<rect class="g-fill1 g-shape" x="${x - 22}" y="${y - 9}" width="44" height="18" rx="3"/><text class="g-lbl" x="${x}" y="${y - 16}" text-anchor="middle">${lab}</text>`;
  g += line(30, 30, 30, 120) + `<line class="g-seg" x1="18" y1="70" x2="42" y2="70"/><line class="g-seg" x1="23" y1="80" x2="37" y2="80"/>`;
  g += `<rect x="20" y="71" width="20" height="8" fill="var(--surface)"/>`;
  if (kind === 'serie') {
    g += line(30, 30, 270, 30) + line(270, 30, 270, 120) + line(270, 120, 30, 120);
    labels.forEach((l, i) => { const x = 90 + i * (labels.length === 2 ? 120 : 80); g += `<rect x="${x - 23}" y="20" width="46" height="20" fill="var(--surface)"/>` + res(x, 30, l); });
  } else {
    g += line(30, 30, 230, 30) + line(30, 120, 230, 120);
    labels.forEach((l, i) => { const x = 130 + i * 70; g += line(x, 30, x, 120) + `<rect x="${x - 10}" y="52" width="20" height="46" fill="var(--surface)"/>` + res(x, 75, l, true); });
  }
  return `<svg class="g g-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schema del circuito">${g}</svg>`;
}

// ---------- livello 1: Ohm, potenza, energia ----------
function ohmI(rng) {
  const { V, R } = rng.until(() => ({ V: rng.pick([12, 24, 48, 230]), R: rng.pick([2, 4, 6, 8, 10, 12, 20, 23, 40, 46, 100, 115]) }), (v) => v.R !== v.V && Number.isInteger((v.V / v.R) * 10));
  const I = V / R;
  return {
    type: 'number', unit: 'A', decimals: 2,
    fig: schema('serie', [`${R} Ω`]),
    prompt: `Una resistenza da ${R} Ω è collegata a una tensione di ${V} V. Quale corrente la attraversa?`,
    answer: I,
    traps: [{ value: V * R, msg: 'Dalla legge di Ohm $V = R\\cdot I$ si ricava $I = V/R$: si divide, non si moltiplica.' }, { value: R / V, msg: 'Divisione al contrario: tensione diviso resistenza.' }],
    hint: '$I = \\dfrac{V}{R}$',
    explain: `$$I = \\dfrac{V}{R} = \\dfrac{${V}}{${R}} = ${tx(I, 2)}\\ \\text{A}$$`,
    cas: { eval: `${V}/${R}` },
    twin: () => ohmI(rng),
  };
}

function ohmR(rng) {
  const { V, I } = rng.until(() => ({ V: rng.pick([12, 24, 230]), I: rng.pick([0.2, 0.5, 2, 4, 5, 10]) }), (v) => Number.isInteger(v.V / v.I));
  const R = V / I;
  return {
    type: 'number', unit: 'Ω', decimals: 1,
    prompt: `Un carico alimentato a ${V} V assorbe ${it(I)} A. Qual è la sua resistenza?`,
    answer: R,
    traps: [{ value: V * I, msg: 'Questa è la potenza in watt: la resistenza è $V/I$.' }],
    hint: '$R = \\dfrac{V}{I}$',
    explain: `$$R = \\dfrac{${V}}{${tx(I)}} = ${tx(R, 1)}\\ \\Omega$$`,
    cas: { eval: `${V}/${I}` },
    twin: () => ohmR(rng),
  };
}

function corrente(rng) {
  // potenze multiple di 230 W: la divisione si fa a mente
  const [what, P] = rng.pick([['un asciugacapelli', rng.pick([1840, 2070, 2300])], ['un forno', rng.pick([2300, 2760, 3450])], ['un trapano', rng.pick([460, 690, 920])], ['un bollitore', rng.pick([1840, 2070])]]);
  const I = P / 230;
  return {
    type: 'number', unit: 'A',
    prompt: `Sulla targhetta di ${what} c'è scritto ${P} W, 230 V. Quanta corrente assorbe?`,
    answer: I,
    traps: [{ value: P * 230, msg: 'Da $P = V\\cdot I$ si ricava $I = P/V$.' }],
    hint: '$I = \\dfrac{P}{V}$',
    explain: `$$I = \\dfrac{${P}}{230} = ${tx(I, 1)}\\ \\text{A}$$ Una presa domestica normale regge 10 A, una presa grande 16 A.`,
    cas: { eval: `${P}/230` },
    twin: () => corrente(rng),
  };
}

function bolletta(rng) {
  const P = rng.pick([500, 1000, 2000]);
  const h = rng.pick([2, 3, 4, 5]);
  const g = rng.pick([10, 20, 30]);
  const c = rng.pick([0.2, 0.25, 0.3]);
  const kWh = (P * h * g) / 1000;
  const cost = kWh * c;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Una stufetta da ${P} W resta accesa ${h} ore al giorno per ${g} giorni. L'energia costa ${euro(c)} al kWh. Quanto si spende?`,
    answer: cost,
    traps: [{ value: P * h * g * c, msg: 'Prima trasforma i watt in kilowatt: dividi per 1000.' }, { value: (P / 1000) * h * c, msg: `Hai calcolato un giorno solo: moltiplica anche per ${g}.` }],
    hint: `Energia = potenza in kW × ore: $${tx(P / 1000)}\\cdot ${h}\\cdot ${g}$ kWh.`,
    explain: `$$E = ${tx(P / 1000)}\\ \\text{kW}\\cdot ${h * g}\\ \\text{h} = ${tx(kWh)}\\ \\text{kWh}$$ $$${tx(kWh)}\\cdot ${tx(c)} = ${tx(cost)}\\ €$$`,
    cas: { eval: `${P}/1000*${h}*${g}*${c}` },
    twin: () => bolletta(rng),
  };
}

// ---------- livello 2: circuiti ----------
function serie(rng) {
  const Rs = [rng.pick([10, 22, 33, 47]), rng.pick([100, 150, 220]), rng.pick([56, 68, 82])];
  const R = Rs.reduce((s, r) => s + r, 0);
  return {
    type: 'number', unit: 'Ω',
    fig: schema('serie', Rs.map((r) => `${r} Ω`)),
    prompt: `Tre resistenze da ${Rs.join(' Ω, ')} Ω sono collegate in serie. Qual è la resistenza equivalente?`,
    answer: R,
    hint: 'In serie le resistenze si sommano.',
    explain: `$$R_{eq} = ${Rs.join(' + ')} = ${R}\\ \\Omega$$ In serie la corrente è la stessa in tutte le resistenze.`,
    cas: { eval: Rs.join('+') },
    twin: () => serie(rng),
  };
}

function parallelo(rng) {
  const [R1, R2] = rng.pick([[6, 3], [12, 6], [10, 10], [20, 30], [12, 4], [60, 30], [40, 10], [100, 100], [30, 15], [24, 8]]);
  const R = (R1 * R2) / (R1 + R2);
  return {
    type: 'number', unit: 'Ω', decimals: 1,
    fig: schema('parallelo', [`${R1} Ω`, `${R2} Ω`]),
    prompt: `Due resistenze da ${R1} Ω e ${R2} Ω sono collegate in parallelo. Qual è la resistenza equivalente?`,
    answer: R,
    traps: [{ value: R1 + R2, msg: 'Questa è la somma, che vale per il collegamento in serie.' }, { value: (R1 + R2) / 2, msg: 'Non è la media: in parallelo la resistenza equivalente è più piccola della più piccola delle due.' }].filter((t) => Math.abs(t.value - R) > 0.01),
    hint: 'Con due resistenze: prodotto diviso somma, $R_{eq} = \\dfrac{R_1 R_2}{R_1 + R_2}$.',
    explain: `$$R_{eq} = \\dfrac{${R1}\\cdot ${R2}}{${R1} + ${R2}} = \\dfrac{${R1 * R2}}{${R1 + R2}} = ${tx(R, 1)}\\ \\Omega$$`,
    cas: { eval: `1/(1/${R1}+1/${R2})` },
    twin: () => parallelo(rng),
  };
}

function partitore(rng) {
  const Vin = rng.pick([5, 9, 12, 24]);
  const [R1, R2] = rng.until(() => rng.pick([[1000, 1000], [2000, 1000], [1000, 2000], [3000, 1000], [1000, 3000], [4000, 1000], [2000, 2000]]), ([a, b]) => Number.isInteger(((Vin * b) / (a + b)) * 100));
  const Vout = (Vin * R2) / (R1 + R2);
  return {
    type: 'number', unit: 'V',
    fig: schema('serie', [`R₁ = ${R1 / 1000} kΩ`.replace('.', ','), `R₂ = ${R2 / 1000} kΩ`.replace('.', ',')]),
    prompt: `Un partitore di tensione è alimentato a ${Vin} V, con $R_1 = ${tx(R1 / 1000)}$ kΩ e $R_2 = ${tx(R2 / 1000)}$ kΩ. Quanto vale la tensione ai capi di $R_2$? Usa $V_{out} = V_{in}\\cdot\\dfrac{R_2}{R_1 + R_2}$.`,
    answer: Vout,
    traps: [{ value: (Vin * R1) / (R1 + R2), msg: 'Questa è la tensione su $R_1$: al numeratore va $R_2$.' }].filter((t) => Math.abs(t.value - Vout) > 0.01),
    hint: `$\\dfrac{R_2}{R_1+R_2} = \\dfrac{${R2}}{${R1 + R2}}$`,
    explain: `$$V_{out} = ${Vin}\\cdot\\dfrac{${R2}}{${R1 + R2}} = ${tx(Vout, 2)}\\ \\text{V}$$ La tensione si divide in proporzione alle resistenze.`,
    cas: { eval: `${Vin}*${R2}/(${R1}+${R2})` },
    twin: () => partitore(rng),
  };
}

function tolleranzaR(rng) {
  const R = rng.pick([100, 220, 330, 470, 680, 1000]);
  const t = rng.pick([1, 5, 10]);
  const lo = R * (1 - t / 100), hi = R * (1 + t / 100);
  return {
    type: 'numbers', ordered: true, decimals: 1,
    prompt: `Una resistenza ha valore nominale ${R} Ω e tolleranza ±${t}%. Tra quali valori può stare la resistenza reale? Scrivi (minimo; massimo).`,
    answers: [lo, hi],
    hint: `Il ${t}% di ${R} è $${tx((R * t) / 100, 1)}$ Ω: toglilo e aggiungilo.`,
    explain: `$$${R}\\cdot ${tx(1 - t / 100)} = ${tx(lo, 1)}\\ \\Omega \\qquad ${R}\\cdot ${tx(1 + t / 100)} = ${tx(hi, 1)}\\ \\Omega$$ Se il multimetro legge un valore fuori da questo intervallo, il componente è da sostituire.`,
    placeholder: '(min; max)',
    twin: () => tolleranzaR(rng),
  };
}

// ---------- livello 3: alternata, decibel, condensatori ----------
function valoreEfficace(rng) {
  const toMax = rng.chance(0.5);
  const k = rng.pick([10, 20, 50, 100, 200]);
  const v = toMax ? k : +(1.41 * k).toFixed(2);
  const ans = toMax ? +(1.41 * k).toFixed(2) : k;
  return {
    type: 'number', unit: 'V', decimals: 1,
    fig: plane({ xmin: 0, xmax: 6.3, ymin: -1.3, ymax: 1.3, width: 300, height: 170, labels: false, fns: [{ f: (x) => Math.sin(x) }], hlines: [{ y: 1 / Math.SQRT2, label: 'efficace' }, { y: 1, label: 'massimo' }], xName: 't', yName: 'V' }),
    prompt: toMax
      ? `Una tensione alternata ha valore efficace ${k} V. Qual è il valore massimo (di picco)? Usa $V_{max} = V_{eff}\\cdot\\sqrt{2}$ con $\\sqrt{2} \\approx 1{,}41$.`
      : `Una tensione alternata ha valore massimo ${tx(v)} V. Qual è il valore efficace? Usa $V_{eff} = \\dfrac{V_{max}}{\\sqrt{2}}$ con $\\sqrt{2} \\approx 1{,}41$.`,
    answer: ans,
    alts: [toMax ? k * Math.SQRT2 : v / Math.SQRT2],
    traps: [{ value: toMax ? k / 1.41 : v * 1.41, msg: toMax ? 'Il valore massimo è più grande di quello efficace: si moltiplica per √2.' : 'Il valore efficace è più piccolo del massimo: si divide per √2.' }],
    hint: toMax ? `$${k}\\cdot 1{,}41$` : `$${tx(v)} : 1{,}41$: guarda bene i numeri.`,
    explain: toMax ? `$$V_{max} = ${k}\\cdot 1{,}41 = ${tx(ans)}\\ \\text{V}$$ Per la rete di casa: $230\\cdot 1{,}41 \\approx 325$ V di picco.` : `$$V_{eff} = \\dfrac{${tx(v)}}{1{,}41} = ${k}\\ \\text{V}$$`,
    cas: { eval: toMax ? `${k}*1.41` : `${v}/1.41` },
    twin: () => valoreEfficace(rng),
  };
}

function periodo(rng) {
  const f = rng.pick([50, 100, 200, 250, 400, 500, 1000, 2000]);
  const T = 1000 / f;
  return {
    type: 'number', unit: 'ms', decimals: 2,
    prompt: `Un segnale ha frequenza ${f} Hz. Quanto dura un periodo, in millisecondi?`,
    answer: T,
    traps: [{ value: 1 / f, msg: 'Questo è il periodo in secondi: moltiplica per 1000 per avere i millisecondi.' }],
    hint: '$T = \\dfrac{1}{f}$ in secondi; 1 s = 1000 ms.',
    explain: `$$T = \\dfrac{1}{${f}}\\ \\text{s} = ${tx(1 / f, 5)}\\ \\text{s} = ${tx(T, 2)}\\ \\text{ms}$$`,
    cas: { eval: `1000/${f}` },
    twin: () => periodo(rng),
  };
}

function decibel(rng) {
  const r = rng.pick([10, 100, 1000]);
  const G = 20 * Math.log10(r);
  return {
    type: 'number', unit: 'dB',
    prompt: `Un amplificatore riceve 0,01 V e restituisce ${it(0.01 * r)} V. Qual è il guadagno in decibel? Usa $G = 20\\cdot\\log_{10}\\dfrac{V_{out}}{V_{in}}$.`,
    answer: G,
    traps: [{ value: 10 * Math.log10(r), msg: 'Per le tensioni il fattore è 20, non 10 (10 vale per le potenze).' }, { value: r, msg: 'Questo è il rapporto tra le tensioni: ora prendi il logaritmo.' }],
    hint: `Il rapporto è ${r}. Calcola $\\log_{10} ${r}$ e moltiplica per 20.`,
    explain: `$$G = 20\\cdot\\log_{10} ${r} = 20\\cdot ${tx(Math.log10(r), 3)} = ${tx(G, 1)}\\ \\text{dB}$$ Ogni volta che la tensione si moltiplica per 10, il guadagno sale di 20 dB.`,
    cas: { eval: `20*log10(${r})` },
    twin: () => decibel(rng),
  };
}

function caricaCondensatore(rng) {
  const R = rng.pick([1, 2, 5, 10]);
  const C = rng.pick([100, 200, 500, 1000]);
  const tau = (R * 1000 * C) / 1e6;
  const t5 = 5 * tau;
  return {
    type: 'number', unit: 's',
    fig: plane({ xmin: 0, xmax: 6, ymin: 0, ymax: 1.15, width: 300, height: 180, fns: [{ f: (x) => 1 - Math.exp(-x) }], vlines: [{ x: 1, label: 'τ' }, { x: 5, label: '5τ' }], xName: 't/τ', yName: 'V/V₀', step: 1 }),
    prompt: `Un condensatore da ${C} µF si carica attraverso una resistenza da ${tx(R)} kΩ. La costante di tempo è $\\tau = R\\cdot C$. Dopo $5\\tau$ è praticamente carico: dopo quanti secondi?`,
    answer: t5,
    traps: [{ value: tau, msg: 'Questa è una sola costante di tempo: dopo τ il condensatore è carico solo al 63% circa.' }, { value: 5 * R * C, msg: 'Converti le unità: kΩ = 1000 Ω e µF = 0,000001 F.' }],
    hint: `$\\tau = ${tx(R * 1000, 0)}\\ \\Omega\\cdot ${C}\\cdot 10^{-6}\\ \\text{F}$`,
    explain: `$$\\tau = ${R * 1000}\\cdot ${C}\\cdot 10^{-6} = ${tx(tau, 3)}\\ \\text{s} \\qquad 5\\tau = ${tx(t5, 2)}\\ \\text{s}$$ La carica segue una curva esponenziale: $V = V_0\\left(1 - e^{-t/\\tau}\\right)$.`,
    cas: { eval: `5*${R}*1000*${C}*10^(-6)` },
    twin: () => caricaCondensatore(rng),
  };
}

export default {
  id: 'lavoro-elettrico',
  area: 'lavoro',
  indirizzo: 'elettrico',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_A3'],
  ambito: 'Relazioni e funzioni',
  title: 'Matematica sul quadro elettrico',
  summary: 'Legge di Ohm, potenza e bolletta, serie e parallelo, alternata, decibel.',
  glyph: 'Ω',
  levels: [
    { name: 'Ohm e potenza', desc: 'Corrente, resistenza, potenza, energia e costi' },
    { name: 'Circuiti', desc: 'Serie, parallelo, partitore, tolleranze' },
    { name: 'Segnali', desc: 'Valore efficace, periodo, decibel, condensatori' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Una formula, tre domande', body: 'La legge di Ohm $V = R\\cdot I$ si può usare in tre modi: $I = V/R$, $R = V/I$, $V = R\\cdot I$. La potenza è $P = V\\cdot I$. L\'energia consumata, in kWh, è la potenza in kW per le ore di funzionamento.', fig: table(['Grandezza', 'Simbolo', 'Unità'], [['Tensione', 'V', 'volt (V)'], ['Corrente', 'I', 'ampere (A)'], ['Resistenza', 'R', 'ohm (Ω)'], ['Potenza', 'P', 'watt (W)']]) },
        ohmI(rng), ohmR(rng), corrente(rng), bolletta(rng), ohmI(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'In fila o affiancate', body: 'In serie le resistenze si sommano: la corrente deve attraversarle tutte. In parallelo la corrente ha più strade, quindi la resistenza equivalente diminuisce: con due resistenze vale $\\dfrac{R_1 R_2}{R_1 + R_2}$.', fig: schema('parallelo', ['R₁', 'R₂']) },
        serie(rng), parallelo(rng), partitore(rng), tolleranzaR(rng), parallelo(rng),
      ];
    }
    return [
      { type: 'learn', title: 'La tensione che oscilla', body: 'La tensione di casa è sinusoidale: 50 oscillazioni al secondo (50 Hz). I 230 V sono il valore efficace; il valore massimo è $230\\cdot\\sqrt{2} \\approx 325$ V.', fig: plane({ xmin: 0, xmax: 12.6, ymin: -1.3, ymax: 1.3, width: 320, height: 170, labels: false, fns: [{ f: (x) => Math.sin(x) }], xName: 't', yName: 'V' }) },
      valoreEfficace(rng), periodo(rng), decibel(rng), caricaCondensatore(rng), valoreEfficace(rng),
    ];
  },
};

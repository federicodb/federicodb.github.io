// Quesiti originali "stile INVALSI": stessi ambiti (Numeri, Relazioni e funzioni, Spazio e figure,
// Dati e previsioni), stesse tipologie (scelta multipla, scelta multipla complessa vero/falso,
// risposta univoca, argomentazione). I valori cambiano a ogni sessione.
// Non sono quesiti ufficiali: per le prove rilasciate vedi Gestinv (gestinv.it) e il sito INVALSI.

import { tx, euro, frac, poly, par } from '../../js/engine/helpers.js';
import { plane, polygon, table, bars } from '../../js/gfx/svg.js';

const tag = (ambito, dim, step) => ({ ...step, ambito, dimensione: dim });

// ======================= GRADO 10 (fine biennio) =======================
export const G10 = {
  doubleDiscount(rng) {
    const a = rng.pick([10, 20, 30]), b = rng.pick([10, 20, 25]);
    const tot = 100 - (100 - a) * (100 - b) / 100;
    return tag('Numeri', 'Risolvere problemi', {
      type: 'number', unit: '%', decimals: 1,
      prompt: `Durante i saldi un giubbotto è scontato del ${a}%. Alla cassa viene applicato un ulteriore sconto del ${b}% sul prezzo già scontato. Qual è lo sconto complessivo rispetto al prezzo iniziale?`,
      answer: tot,
      traps: [{ value: a + b, msg: 'Il secondo sconto si applica a un prezzo già ridotto: gli sconti non si sommano.' }],
      hint: 'Prova con un prezzo iniziale di 100 €.',
      explain: `Con 100 €: dopo il primo sconto ${100 - a} €, dopo il secondo $${100 - a}\\cdot ${tx((100 - b) / 100)} = ${tx(((100 - a) * (100 - b)) / 100)}$ €. Sconto totale: $${tx(tot)}\\%$, meno di ${a + b}%.`,
      twin: () => G10.doubleDiscount(rng),
    });
  },
  between(rng) {
    const a = rng.int(1, 5), b = rng.int(a + 1, 8);
    const cands = rng.shuffle([
      { t: `$${frac(a * 2 + 1, b * 2)}$`, v: (a * 2 + 1) / (b * 2) },
      { t: `$${tx((a / b + (a + 1) / b) / 2, 3)}$`, v: (a / b + (a + 1) / b) / 2 },
      { t: `$${frac(a, b + 1)}$`, v: a / (b + 1) },
      { t: `$${tx((a + 1) / b + 0.05, 3)}$`, v: (a + 1) / b + 0.05 },
    ]);
    return tag('Numeri', 'Conoscere', {
      type: 'truefalse',
      prompt: `Indica per ciascun numero se è compreso tra $${frac(a, b)}$ e $${frac(a + 1, b)}$.`,
      statements: cands.map((c) => ({ text: c.t, value: c.v > a / b && c.v < (a + 1) / b })),
      explain: `$${frac(a, b)} \\approx ${tx(a / b, 3)}$ e $${frac(a + 1, b)} \\approx ${tx((a + 1) / b, 3)}$: per confrontare conviene trasformare tutto in decimali.`,
      twin: () => G10.between(rng),
    });
  },
  counterexample(rng) {
    const claims = [
      { c: 'se $a > b$ allora $a^2 > b^2$', right: '$a = 1$, $b = -3$', wrong: ['$a = 5$, $b = 2$', '$a = 3$, $b = 0$', '$a = 10$, $b = 9$'], why: 'Con $a = 1$ e $b = -3$: $a > b$ ma $1 < 9$.' },
      { c: 'il quadrato di un numero è sempre maggiore del numero', right: '$x = \\dfrac{1}{2}$', wrong: ['$x = 3$', '$x = -2$', '$x = 10$'], why: '$\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4} < \\frac{1}{2}$.' },
      { c: 'dividendo un numero si ottiene sempre un risultato più piccolo', right: 'dividere 6 per 0,5', wrong: ['dividere 6 per 2', 'dividere 6 per 3', 'dividere 6 per 6'], why: '$6 : 0{,}5 = 12$, più grande di 6.' },
      { c: 'la somma di due numeri primi è sempre pari', right: '$2 + 3$', wrong: ['$3 + 5$', '$5 + 7$', '$11 + 13$'], why: '$2 + 3 = 5$ è dispari: 2 è l\'unico primo pari.' },
    ];
    const k = rng.pick(claims);
    return tag('Numeri', 'Argomentare', {
      type: 'choice',
      prompt: `Luca afferma che ${k.c}. Quale esempio dimostra che Luca sbaglia?`,
      options: [{ label: k.right, correct: true }, ...k.wrong.map((w) => ({ label: w, why: 'In questo caso l\'affermazione è vera: un controesempio deve renderla falsa.' }))],
      explain: `${k.why} Per dimostrare che un'affermazione generale è falsa basta un solo controesempio.`,
      twin: () => G10.counterexample(rng),
    });
  },
  taxi(rng) {
    const f = rng.pick([3, 4, 5]), v = rng.pick([1.2, 1.5, 2]);
    const xs = [2, 4, 6, 10];
    return tag('Relazioni e funzioni', 'Risolvere problemi', {
      type: 'expr', vars: ['x'],
      fig: table(['km percorsi', ...xs.map(String)], [['costo (€)', ...xs.map((x) => tx(f + v * x).replace('{,}', ','))]]),
      prompt: 'La tabella riporta il costo di una corsa in taxi in base ai km. Scrivi la formula del costo $y$ in funzione dei km $x$: $y = \\;?$',
      answer: `${v}*x + ${f}`,
      traps: [{ expr: `${v}*x`, msg: 'Con 0 km il costo non è zero: c\'è una quota fissa.' }],
      hint: 'Di quanto aumenta il costo per ogni km in più? Quanto costerebbe 0 km?',
      explain: `Ogni 2 km il costo aumenta di $${tx(2 * v)}$ €, quindi $${tx(v)}$ € al km. Con 0 km: ${euro(f)}. $$y = ${tx(v)}x + ${f}$$`,
      placeholder: 'ad es. 1,5x + 4',
      twin: () => G10.taxi(rng),
    });
  },
  gridTriangle(rng) {
    const A = [rng.int(-5, -1), rng.int(-4, 0)], B = [rng.int(1, 5), A[1]], C = [rng.int(-3, 3), rng.int(2, 5)];
    const area = (Math.abs(B[0] - A[0]) * Math.abs(C[1] - A[1])) / 2;
    return tag('Spazio e figure', 'Risolvere problemi', {
      type: 'number', unit: 'quadretti', decimals: 1,
      fig: plane({ xmin: -6, xmax: 6, ymin: -5, ymax: 6, width: 300, height: 280, segs: [[A, B], [B, C], [C, A]].map(([p, q]) => ({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], cls: 'g-fn1' })), points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }, { x: C[0], y: C[1], label: 'C' }] }),
      prompt: 'Qual è l\'area del triangolo ABC, misurata in quadretti?',
      answer: area,
      traps: [{ value: area * 2, msg: 'Base per altezza va diviso per 2.' }],
      hint: 'La base AB è orizzontale: contala. L\'altezza è la distanza di C da AB.',
      explain: `Base $AB = ${Math.abs(B[0] - A[0])}$, altezza $= ${Math.abs(C[1] - A[1])}$: $$A = \\dfrac{${Math.abs(B[0] - A[0])}\\cdot ${Math.abs(C[1] - A[1])}}{2} = ${tx(area)}$$`,
      twin: () => G10.gridTriangle(rng),
    });
  },
  quadrilaterals(rng) {
    const all = [
      { text: 'Ogni quadrato è un rombo', value: true },
      { text: 'Ogni rombo è un quadrato', value: false },
      { text: 'Ogni rettangolo è un parallelogramma', value: true },
      { text: 'Le diagonali di un rettangolo sono perpendicolari', value: false },
      { text: 'Le diagonali di un rombo sono perpendicolari', value: true },
      { text: 'Un trapezio ha sempre due lati paralleli', value: true },
      { text: 'Un parallelogramma ha sempre gli angoli retti', value: false },
    ];
    return tag('Spazio e figure', 'Conoscere', {
      type: 'truefalse',
      prompt: 'Indica se ogni affermazione è vera o falsa.',
      statements: rng.shuffle(all).slice(0, 4),
      explain: 'Il quadrato ha tutte le proprietà del rombo (lati uguali) e del rettangolo (angoli retti). Il rombo ha diagonali perpendicolari, il rettangolo diagonali uguali.',
      twin: () => G10.quadrilaterals(rng),
    });
  },
  addData(rng) {
    // nuova media "tonda" (al massimo una cifra decimale): si calcola a mente
    const { n, m, x } = rng.until(() => ({ n: rng.int(3, 9), m: rng.int(5, 8), x: rng.int(2, 10) }), (v) => v.x !== v.m && Number.isInteger(((v.n * v.m + v.x) / (v.n + 1)) * 10));
    const newM = (n * m + x) / (n + 1);
    return tag('Dati e previsioni', 'Risolvere problemi', {
      type: 'number', decimals: 2,
      prompt: `La media dei ${n} voti di Sara è ${m}. Con la verifica successiva prende ${x}. Qual è la nuova media?`,
      answer: newM,
      traps: [{ value: (m + x) / 2, msg: 'Non si fa la media tra la vecchia media e il nuovo voto: la vecchia media "pesa" ' + n + ' voti.' }],
      hint: `La somma dei primi ${n} voti è $${n}\\cdot ${m}$.`,
      explain: `$$\\dfrac{${n}\\cdot ${m} + ${x}}{${n + 1}} = \\dfrac{${n * m + x}}{${n + 1}} = ${tx(newM)}$$`,
      twin: () => G10.addData(rng),
    });
  },
  barPercent(rng) {
    const labels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'];
    // totale 50 o 100: la percentuale si calcola a mente
    const T = rng.pick([50, 100]);
    const vals = rng.until(() => labels.map(() => rng.int(T / 25, T / 4)), (v) => v.slice(0, 4).reduce((s, x) => s + x, 0) < T - 2);
    vals[4] = T - vals.slice(0, 4).reduce((s, x) => s + x, 0);
    const tot = T;
    const i = rng.int(0, 4);
    return tag('Dati e previsioni', 'Conoscere', {
      type: 'number', unit: '%', decimals: 0,
      fig: bars(labels, vals),
      prompt: `Il grafico mostra quanti studenti hanno usato il laboratorio di informatica ogni giorno della settimana. Che percentuale del totale settimanale corrisponde a ${['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì'][i]}?`,
      answer: (vals[i] / tot) * 100,
      traps: [{ value: vals[i], msg: 'Quella è la frequenza assoluta: dividi per il totale.' }],
      hint: `Totale della settimana: somma le cinque barre.`,
      explain: `Totale: ${vals.join(' + ')} = ${tot}. $$\\dfrac{${vals[i]}}{${tot}}\\cdot 100 = ${tx((vals[i] / tot) * 100, 1)}\\%$$`,
      twin: () => G10.barPercent(rng),
    });
  },
  lineFromPoints(rng) {
    const m = rng.intNot(-3, 3), q = rng.int(-4, 4);
    const x1 = rng.int(-3, 0), x2 = x1 + rng.int(1, 3);
    return tag('Relazioni e funzioni', 'Conoscere', {
      type: 'choice',
      prompt: `Quale retta passa per i punti $(${x1};\\,${m * x1 + q})$ e $(${x2};\\,${m * x2 + q})$?`,
      options: [
        { label: `$y = ${poly([[m, 'x'], [q, '']])}$`, correct: true },
        { label: `$y = ${poly([[-m, 'x'], [q, '']])}$`, why: 'Sostituisci le coordinate: il primo punto non soddisfa l\'equazione.' },
        { label: `$y = ${poly([[m, 'x'], [q + 1, '']])}$`, why: 'Sostituisci le coordinate: non torna.' },
        { label: `$y = ${poly([[q || 1, 'x'], [m, '']])}$`, why: 'Sostituisci le coordinate: non torna.' },
      ].filter((o, i, a) => a.findIndex((p) => p.label === o.label) === i),
      explain: `Basta sostituire: con $x = ${x1}$ si ottiene $y = ${m * x1 + q}$ e con $x = ${x2}$ si ottiene $y = ${m * x2 + q}$.`,
      twin: () => G10.lineFromPoints(rng),
    });
  },
  diagonal(rng) {
    const [a, b] = rng.pick([[30, 40], [60, 80], [90, 120], [50, 120], [80, 150]]);
    return tag('Spazio e figure', 'Risolvere problemi', {
      type: 'number', unit: 'cm',
      fig: polygon({ pts: [[0, 0], [b, 0], [b, a], [0, a]], sides: [`${b} cm`, `${a} cm`], extra: [{ seg: [[0, 0], [b, a]], dash: true, label: '?' }], right: [0, 1, 2, 3] }),
      prompt: `Un pannello rettangolare misura ${b} cm per ${a} cm. Quanto è lunga la sua diagonale?`,
      answer: Math.hypot(a, b),
      hint: 'La diagonale è l\'ipotenusa di un triangolo rettangolo.',
      explain: `$$d = \\sqrt{${b}^2 + ${a}^2} = \\sqrt{${a * a + b * b}} = ${Math.hypot(a, b)}\\ \\text{cm}$$`,
      twin: () => G10.diagonal(rng),
    });
  },
  urnRatio(rng) {
    const r = rng.int(2, 8), k = rng.int(2, 4);
    const tot = r * k;
    return tag('Dati e previsioni', 'Risolvere problemi', {
      type: 'number',
      prompt: `In un sacchetto ci sono ${r} palline rosse e alcune blu. La probabilità di estrarre una pallina rossa è $${frac(1, k)}$. Quante sono le palline blu?`,
      answer: tot - r,
      traps: [{ value: tot, msg: 'Questo è il totale delle palline: togli le rosse.' }],
      hint: `Se le rosse sono $${frac(1, k)}$ del totale, il totale è ${k} volte le rosse.`,
      explain: `Totale $= ${r}\\cdot ${k} = ${tot}$; blu $= ${tot} - ${r} = ${tot - r}$.`,
      twin: () => G10.urnRatio(rng),
    });
  },
};

// ======================= GRADO 13 (quinto anno) =======================
export const G13 = {
  // manutenzione
  percentChange(rng) {
    const d = rng.pick([-25, -20, -10, 10, 20, 25, 50]);
    const a = rng.int(3, 24) * 20;
    const b = Math.round(a * (1 + d / 100));
    const pct = ((b - a) / a) * 100;
    return tag('Numeri', 'Risolvere problemi', {
      type: 'number', unit: '%', decimals: 1,
      prompt: `Gli iscritti a un corso sono passati da ${a} a ${b}. Qual è la variazione percentuale? (negativa se è un calo)`,
      answer: pct,
      traps: [{ value: ((b - a) / b) * 100, msg: 'La variazione si calcola rispetto al valore iniziale.' }, { value: -pct, msg: 'Controlla il segno.' }],
      hint: '(valore finale − valore iniziale) : valore iniziale × 100',
      explain: `$$\\dfrac{${b} - ${a}}{${a}}\\cdot 100 = ${tx(pct, 2)}\\%$$`,
      twin: () => G13.percentChange(rng),
    });
  },
  equationContext(rng) {
    const fee = rng.pick([20, 25, 30]), per = rng.pick([8, 10, 12]), budget = fee + per * rng.int(4, 12);
    return tag('Relazioni e funzioni', 'Risolvere problemi', {
      type: 'number', unit: 'ore',
      prompt: `Un tecnico chiede ${euro(fee)} di uscita più ${euro(per)} l'ora. Con ${euro(budget)} quante ore di lavoro si possono pagare?`,
      answer: (budget - fee) / per,
      traps: [{ value: budget / per, msg: 'Prima va tolta la quota di uscita.' }],
      hint: `$${fee} + ${per}x = ${budget}$`,
      explain: `$$${fee} + ${per}x = ${budget} \\Rightarrow x = \\dfrac{${budget - fee}}{${per}} = ${(budget - fee) / per}$$`,
      twin: () => G13.equationContext(rng),
    });
  },
  // ricontestualizzazione
  decay(rng) {
    const v0 = rng.pick([10000, 20000, 30000]), r = rng.pick([10, 20, 50]), n = rng.pick([2, 3]);
    const v = v0 * (1 - r / 100) ** n;
    return tag('Relazioni e funzioni', 'Risolvere problemi', {
      type: 'number', unit: '€', decimals: 0,
      prompt: `Un'auto nuova costa ${euro(v0)} e perde il ${r}% del suo valore ogni anno. Quanto vale dopo ${n} anni?`,
      answer: v,
      traps: [{ value: v0 * (1 - (r * n) / 100), msg: 'La percentuale si calcola ogni anno sul valore residuo, non su quello iniziale.' }],
      hint: `Ogni anno il valore si moltiplica per $${tx(1 - r / 100)}$.`,
      explain: `$$V = ${v0}\\cdot ${tx(1 - r / 100)}^{${n}} \\approx ${Math.round(v)}\\ €$$ È un modello esponenziale decrescente.`,
      chart: { type: 'line', alt: 'Valore dell\'auto negli anni', data: { labels: Array.from({ length: n + 1 }, (_, i) => `${i}`), datasets: [{ label: 'Valore (€)', data: Array.from({ length: n + 1 }, (_, i) => Math.round(v0 * (1 - r / 100) ** i)) }] }, legend: false, xTitle: 'anni' },
      chartAfter: true,
      twin: () => G13.decay(rng),
    });
  },
  logScale(rng) {
    const a = rng.int(2, 5), b = a + rng.int(1, 3);
    return tag('Relazioni e funzioni', 'Argomentare', {
      type: 'choice',
      prompt: `Nella scala Richter ogni grado in più corrisponde a un'ampiezza 10 volte maggiore. Un terremoto di magnitudo ${b} rispetto a uno di magnitudo ${a} ha un'ampiezza…`,
      options: [
        { label: `${10 ** (b - a)} volte maggiore`, correct: true },
        ...[
          { v: b - a, why: 'La scala è logaritmica: ogni grado moltiplica per 10.' },
          { v: 10 * (b - a), why: 'I fattori 10 si moltiplicano tra loro, non si sommano.' },
          { v: +(b / a).toFixed(2), why: 'Non è il rapporto tra le magnitudo.' },
          { v: 2 * (b - a), why: 'Ogni grado moltiplica per 10, non per 2.' },
          { v: 10 * b, why: 'Conta la differenza di magnitudo, non la magnitudo.' },
        ].filter((o, i, arr) => o.v !== 10 ** (b - a) && arr.findIndex((p) => p.v === o.v) === i).slice(0, 3)
          .map((o) => ({ label: `${String(o.v).replace('.', ',')} volte maggiore`, why: o.why })),
      ],
      explain: `$$10^{${b} - ${a}} = 10^{${b - a}} = ${10 ** (b - a)}$$`,
      twin: () => G13.logScale(rng),
    });
  },
  heightAngle(rng) {
    // 45°: altezza = distanza; 30° e 60° con tan ≈ 0,58 e 1,73
    const d = rng.pick([10, 20, 30, 40, 50]), ang = rng.pick([30, 45, 60]);
    const t = ang === 45 ? 1 : ang === 30 ? 0.58 : 1.73;
    const h = d * t;
    return tag('Spazio e figure', 'Risolvere problemi', {
      type: 'number', unit: 'm', decimals: 1,
      alts: [d * Math.tan((ang * Math.PI) / 180)],
      fig: polygon({ pts: [[0, 0], [d, 0], [d, h]], sides: [`${d} m`, 'h', ''], vertices: [`${ang}°`, '', ''], right: [1], width: 300, height: 200 }),
      prompt: `Da ${d} m di distanza si vede la cima di un edificio con un angolo di elevazione di ${ang}°. Quanto è alto l'edificio?${ang === 45 ? '' : ` Usa $\\tan ${ang}° \\approx ${tx(t, 2)}$.`}`,
      answer: h,
      traps: [{ value: d * Math.sin((ang * Math.PI) / 180), msg: 'Il lato opposto si ricava dall\'adiacente con la tangente, non con il seno.' }],
      hint: 'altezza = distanza × tangente dell\'angolo',
      explain: `$$h = ${d}\\cdot\\tan ${ang}° ${ang === 45 ? '=' : '\\approx'} ${d}\\cdot ${tx(t, 2)} = ${tx(h, 2)}\\ \\text{m}$$${ang === 45 ? ' A 45° il triangolo è isoscele: altezza e distanza sono uguali.' : ''}`,
      twin: () => G13.heightAngle(rng),
    });
  },
  doubleTable(rng) {
    const a = rng.int(5, 20), b = rng.int(5, 20), c = rng.int(5, 20), d = rng.int(5, 20);
    return tag('Dati e previsioni', 'Risolvere problemi', {
      type: 'number', reduced: true,
      fig: table(['', 'Usa i mezzi', 'Non usa i mezzi', 'Totale'], [['Biennio', a, b, a + b], ['Triennio', c, d, c + d], ['Totale', a + c, b + d, a + b + c + d]].map((r) => r.map(String))),
      prompt: 'Si sceglie a caso uno studente tra quelli che usano i mezzi pubblici. Qual è la probabilità che sia del triennio? (frazione)',
      answer: c / (a + c),
      traps: [{ value: c / (a + b + c + d), msg: 'Lo studente è scelto solo tra chi usa i mezzi: il denominatore è quella colonna.' }, { value: c / (c + d), msg: 'Questa è la probabilità di usare i mezzi sapendo che è del triennio: è la domanda al contrario.' }],
      hint: 'Restringi l\'attenzione alla colonna "Usa i mezzi".',
      explain: `$$P = \\dfrac{${c}}{${a + c}}${frac(c, a + c) !== `\\dfrac{${c}}{${a + c}}` ? ` = ${frac(c, a + c)}` : ''}$$ È una probabilità condizionata: si conta solo dentro il gruppo dato.`,
      placeholder: 'ad es. 3/7',
      twin: () => G13.doubleTable(rng),
    });
  },
  medianRobust(rng) {
    const base = Array.from({ length: 6 }, () => rng.int(1200, 1800));
    const outlier = rng.int(8000, 15000);
    const all = base.concat(outlier);
    const mean = all.reduce((s, x) => s + x, 0) / all.length;
    return tag('Dati e previsioni', 'Argomentare', {
      type: 'choice',
      fig: `<p class="data-row">${all.map((x) => euro(x)).join('&ensp;')}</p>`,
      prompt: 'Questi sono gli stipendi mensili dei dipendenti di una piccola azienda (incluso il titolare). Quale indice descrive meglio lo stipendio tipico di un dipendente?',
      options: [
        { label: 'La mediana, perché non è influenzata dal valore molto alto', correct: true },
        { label: `La media (${euro(Math.round(mean))}), perché tiene conto di tutti i valori`, why: 'Proprio per questo è distorta dal valore anomalo: nessun dipendente guadagna quella cifra.' },
        { label: 'La moda, perché è il valore più frequente', why: 'Qui ogni valore compare una volta sola: la moda non esiste.' },
      ],
      explain: `La media è ${euro(Math.round(mean))}, sopra quasi tutti gli stipendi. La mediana (${euro([...all].sort((x, y) => x - y)[3])}) rappresenta meglio la situazione tipica.`,
      twin: () => G13.medianRobust(rng),
    });
  },
  parabolaMax(rng) {
    const v = rng.pick([20, 30, 40]), k = rng.pick([1, 2]);
    const L = v / 2;
    return tag('Relazioni e funzioni', 'Risolvere problemi', {
      type: 'number', unit: 'm²',
      prompt: `Con ${v * k === v ? v : v} m di rete si vuole recintare un'area rettangolare appoggiata a un muro (il lato lungo il muro non va recintato). Le dimensioni sono $x$ (lati perpendicolari al muro) e $${v} - 2x$. Qual è l'area massima?`,
      answer: (v / 4) * (v / 2),
      traps: [{ value: (v / 4) ** 2, msg: 'Non è un quadrato: il lato lungo il muro non usa rete.' }],
      hint: `$A(x) = x(${v} - 2x)$: è una parabola, il massimo è nel vertice.`,
      explain: `$$A(x) = -2x^2 + ${v}x \\qquad x_V = \\dfrac{${v}}{4} = ${tx(v / 4)} \\qquad A_{max} = ${tx(v / 4)}\\cdot ${tx(L)} = ${tx((v / 4) * L)}\\ \\text{m}^2$$`,
      twin: () => G13.parabolaMax(rng),
    });
  },
  readFunction(rng) {
    const a = rng.pick([-1, 1]), h = rng.int(-2, 2), k = rng.int(-2, 3);
    const f = (x) => a * 0.5 * (x - h) ** 2 + k;
    const statements = rng.shuffle([
      { text: `$f(${h}) = ${k}$`, value: true },
      { text: `La funzione ha un ${a > 0 ? 'massimo' : 'minimo'} in $x = ${h}$`, value: false },
      { text: `$f(${h + 2}) = f(${h - 2})$`, value: true },
      { text: `$f(x) ${a > 0 ? '\\ge' : '\\le'} ${k}$ per ogni $x$`, value: true },
      { text: `La funzione è crescente per $x ${a > 0 ? '<' : '>'} ${h}$`, value: false },
    ]).slice(0, 4);
    return tag('Relazioni e funzioni', 'Conoscere', {
      type: 'truefalse',
      fig: plane({ xmin: -6, xmax: 6, ymin: -6, ymax: 7, width: 300, height: 280, fns: [{ f }], points: [{ x: h, y: k }] }),
      prompt: 'Il grafico rappresenta una funzione $f$. Indica se ogni affermazione è vera o falsa.',
      statements,
      explain: `Il vertice $(${h};\\,${k})$ è un ${a > 0 ? 'minimo' : 'massimo'}; il grafico è simmetrico rispetto alla retta $x = ${h}$.`,
      twin: () => G13.readFunction(rng),
    });
  },
  combinatoricsQuick(rng) {
    const n = rng.int(4, 7);
    return tag('Dati e previsioni', 'Risolvere problemi', {
      type: 'number',
      prompt: `In un torneo con ${n} squadre ognuna gioca una volta contro ciascuna delle altre. Quante partite si giocano?`,
      answer: (n * (n - 1)) / 2,
      traps: [{ value: n * (n - 1), msg: 'Ogni partita coinvolge due squadre: così è contata due volte.' }],
      hint: 'Ogni squadra gioca n − 1 partite, ma ogni partita ha due squadre.',
      explain: `$$\\dfrac{${n}\\cdot ${n - 1}}{2} = ${(n * (n - 1)) / 2}$$`,
      twin: () => G13.combinatoricsQuick(rng),
    });
  },
  slopeMeaning(rng) {
    const m = rng.pick([0.8, 1.2, 1.5, 2.5]), q = rng.pick([20, 35, 50]);
    return tag('Relazioni e funzioni', 'Argomentare', {
      type: 'choice',
      prompt: `Il costo mensile di una bolletta è $C = ${tx(m)}x + ${q}$, dove $x$ sono i metri cubi consumati. Che cosa rappresenta il numero ${tx(m).replace('{,}', ',')}?`,
      options: [
        { label: 'Il costo di ogni metro cubo in più', correct: true },
        { label: 'Il costo fisso mensile', why: `Il costo fisso è ${q}: il termine che non dipende da x.` },
        { label: 'Il numero di metri cubi consumati', why: 'I metri cubi sono la variabile x.' },
        { label: 'Il costo totale della bolletta', why: 'Il costo totale è C.' },
      ],
      explain: `Il coefficiente di $x$ è la pendenza: aumentando $x$ di 1, $C$ aumenta di ${tx(m).replace('{,}', ',')} €.`,
      twin: () => G13.slopeMeaning(rng),
    });
  },
};

void par;

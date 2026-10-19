// MATEMATICA DI TUTTI I GIORNI — per chi non ha scelto un indirizzo
// Prezzo al kg, resto, tempi di viaggio, costo del carburante, bollette, abbonamenti,
// conto diviso, interesse composto, acquisti a rate, valore atteso dei giochi.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { table, plane } from '../../js/gfx/svg.js';

// ---------- livello 1: spesa e spostamenti ----------
function convenienza(rng) {
  const { gA, pA, gB, pB } = rng.until(
    () => ({ gA: rng.pick([250, 500, 400]), pA: rng.pick([1.5, 2, 2.4, 3]), gB: rng.pick([750, 1000, 800]), pB: rng.pick([3, 4, 4.8, 5, 6]) }),
    (v) => Math.abs(v.pA / v.gA - v.pB / v.gB) > 0.0004 && Number.isInteger(((v.pA * 1000) / v.gA) * 100) && Number.isInteger(((v.pB * 1000) / v.gB) * 100),
  );
  const kA = (pA * 1000) / gA, kB = (pB * 1000) / gB;
  const best = kA < kB ? 'A' : 'B';
  const what = rng.pick(['caffè', 'cereali', 'pasta integrale', 'biscotti']);
  const opt = (l) => ({ label: `Confezione ${l}`, correct: best === l, why: best === l ? undefined : `Al kg: A costa ${euro(kA)}, B costa ${euro(kB)}.` });
  return {
    type: 'choice',
    fig: table(['', 'Peso', 'Prezzo'], [['Confezione A', `${gA} g`, euro(pA)], ['Confezione B', `${gB} g`, euro(pB)]], { caption: what[0].toUpperCase() + what.slice(1) }),
    prompt: `Quale confezione di ${what} conviene?`,
    options: [opt('A'), opt('B')],
    explain: `Prezzo al kg: A $= ${tx(pA)} \\cdot \\dfrac{1000}{${gA}} = ${tx(kA)}$ €, B $= ${tx(pB)} \\cdot \\dfrac{1000}{${gB}} = ${tx(kB)}$ €. Conviene ${best}. Il prezzo al kg è scritto anche sul cartellino: confrontalo sempre.`,
    twin: () => convenienza(rng),
  };
}

function resto(rng) {
  const items = rng.shuffle([['pane', 1.8], ['latte', 1.3], ['mele', 2.5], ['yogurt', 1.2], ['pasta', 0.9], ['succo', 1.6], ['uova', 2.7]]).slice(0, 3);
  const tot = +items.reduce((s, [, p]) => s + p, 0).toFixed(2);
  const pay = tot <= 10 ? 10 : 20;
  const r = +(pay - tot).toFixed(2);
  return {
    type: 'number', unit: '€', decimals: 2,
    fig: table(['Prodotto', 'Prezzo'], items.map(([n, p]) => [n, euro(p)]), { caption: 'Scontrino' }),
    prompt: `Paghi con una banconota da ${pay} €. Quanto resto ricevi?`,
    answer: r,
    traps: [{ value: tot, msg: 'Questo è il totale della spesa: il resto è quello che manca per arrivare a ' + pay + ' €.' }],
    hint: 'Somma i prezzi, poi conta quanto manca alla banconota.',
    explain: `Totale: $${items.map(([, p]) => tx(p)).join(' + ')} = ${tx(tot)}$ €. Resto: $${pay} - ${tx(tot)} = ${tx(r)}$ €.`,
    cas: { eval: `${pay}-(${items.map(([, p]) => p).join('+')})` },
    twin: () => resto(rng),
  };
}

function tempoViaggio(rng) {
  const { d, v } = rng.until(() => ({ d: rng.pick([10, 15, 20, 30, 40, 45, 60, 90, 120]), v: rng.pick([30, 40, 60, 80, 90, 120]) }), (o) => Number.isInteger((o.d / o.v) * 60) && o.d / o.v <= 2);
  const t = (d / v) * 60;
  return {
    type: 'number', unit: 'minuti',
    prompt: `Un tragitto è lungo ${d} km e la velocità media è ${v} km/h. Quanti minuti dura il viaggio?`,
    answer: t,
    traps: [{ value: d / v, msg: 'Questo è il tempo in ore: moltiplica per 60 per avere i minuti.' }, { value: (v / d) * 60, msg: 'Tempo = distanza : velocità, non il contrario.' }].filter((x) => x.value !== t),
    hint: `A ${v} km/h si fa 1 km ogni $60 : ${v}$ minuti.`,
    explain: `$$t = \\dfrac{${d}}{${v}}\\ \\text{h} = ${tx(d / v)}\\ \\text{h} = ${tx(t)}\\ \\text{minuti}$$`,
    cas: { eval: `${d}/${v}*60` },
    twin: () => tempoViaggio(rng),
  };
}

function carburante(rng) {
  const c = rng.pick([5, 6, 8]);
  const d = rng.pick([100, 200, 250, 300, 500]);
  const p = rng.pick([1.8, 2]);
  const litri = (c * d) / 100;
  const costo = litri * p;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Un'auto consuma ${c} litri ogni 100 km. Per un viaggio di ${d} km, con il carburante a ${euro(p)} al litro, quanto si spende?`,
    answer: costo,
    traps: [{ value: litri, msg: 'Questi sono i litri: moltiplica per il prezzo al litro.' }, { value: c * d * p, msg: `Il consumo è ogni 100 km: prima dividi ${d} per 100.` }],
    hint: `Litri: $${c}\\cdot ${d / 100}$.`,
    explain: `$$${c}\\cdot\\dfrac{${d}}{100} = ${tx(litri)}\\ \\text{litri} \\qquad ${tx(litri)}\\cdot ${tx(p)} = ${tx(costo)}\\ €$$`,
    cas: { eval: `${c}*${d}/100*${p}` },
    twin: () => carburante(rng),
  };
}

// ---------- livello 2: bollette e abbonamenti ----------
function abbonamento(rng) {
  const b = rng.pick([1.5, 2, 2.5]);
  const A = rng.pick([25, 30, 35, 40, 45]);
  const n = Math.floor(A / b) + 1;
  return {
    type: 'number', unit: 'viaggi',
    prompt: `Un biglietto dell'autobus costa ${euro(b)}, l'abbonamento mensile ${euro(A)}. Da quanti viaggi al mese in su conviene l'abbonamento?`,
    answer: n,
    traps: [{ value: Math.floor(A / b), msg: Number.isInteger(A / b) ? `Con ${A / b} viaggi spendi esattamente quanto l'abbonamento: conviene dal viaggio dopo.` : `Con ${Math.floor(A / b)} viaggi spendi ${euro(Math.floor(A / b) * b)}: costa ancora meno dell'abbonamento.` }],
    hint: `Quanti biglietti si comprano con ${euro(A)}?`,
    explain: `$$${A} : ${tx(b)} = ${tx(A / b)}$$ Con ${n - 1} viaggi i biglietti costano ${euro((n - 1) * b)}, con ${n} costano ${euro(n * b)}: da ${n} viaggi in su conviene l'abbonamento.`,
    twin: () => abbonamento(rng),
  };
}

function bollettaLuce(rng) {
  const F = rng.pick([8, 10, 12]);
  const kWh = rng.pick([100, 150, 200, 250, 300]);
  const c = rng.pick([0.2, 0.25, 0.3]);
  const tot = F + kWh * c;
  return {
    type: 'number', unit: '€', decimals: 2,
    explainFig: plane({ xmin: 0, xmax: 400, ymin: 0, ymax: Math.ceil((F + 400 * c) / 20) * 20, width: 320, height: 210, step: 50, fns: [{ f: (x) => F + c * x, domain: [0, 400] }], points: [{ x: 0, y: F, label: `quota fissa ${F} €` }, { x: kWh, y: tot, label: `${kWh} kWh` }], xName: 'kWh', yName: '€' }),
    prompt: `La bolletta della luce ha una quota fissa di ${euro(F)} al mese più ${euro(c)} per ogni kWh. Questo mese hai consumato ${kWh} kWh. Quanto paghi?`,
    answer: tot,
    traps: [{ value: kWh * c, msg: 'Manca la quota fissa.' }, { value: (F + c) * kWh, msg: 'La quota fissa si paga una volta, non per ogni kWh.' }],
    hint: `$${F} + ${kWh}\\cdot ${tx(c)}$`,
    explain: `$$${F} + ${kWh}\\cdot ${tx(c)} = ${tx(tot)}\\ €$$ È una funzione lineare: la quota fissa è l'intercetta, il prezzo al kWh è la pendenza.`,
    cas: { eval: `${F}+${kWh}*${c}` },
    twin: () => bollettaLuce(rng),
  };
}

function contoDiviso(rng) {
  const n = rng.pick([4, 5, 6, 8]);
  const per = rng.pick([12, 15, 18, 20, 25]);
  const tot = n * per;
  const m = 10;
  const quota = (tot * (1 + m / 100)) / n;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `In pizzeria in ${n} spendete ${euro(tot)} e volete lasciare il ${m}% di mancia. Quanto paga ciascuno?`,
    answer: quota,
    traps: [{ value: tot / n, msg: 'Manca la mancia.' }, { value: tot / n + m, msg: 'La mancia è il 10% del conto, non 10 euro a testa.' }],
    hint: `Totale con mancia: $${tot}\\cdot 1{,}1$.`,
    explain: `$$${tot}\\cdot 1{,}1 = ${tx(tot * 1.1)}\\ € \\qquad ${tx(tot * 1.1)} : ${n} = ${tx(quota)}\\ €$$`,
    cas: { eval: `${tot}*1.1/${n}` },
    twin: () => contoDiviso(rng),
  };
}

// ---------- livello 3: risparmio e rischi ----------
function interesseComposto(rng) {
  const C = rng.pick([1000, 2000, 5000]);
  const r = rng.pick([2, 5, 10]);
  const n = 2;
  const M = C * (1 + r / 100) ** n;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Metti ${euro(C)} su un conto che rende il ${r}% all'anno e lasci anche gli interessi sul conto. Quanto avrai dopo ${n} anni?`,
    answer: M,
    traps: [{ value: C * (1 + (r * n) / 100), msg: 'Il secondo anno l\'interesse si calcola anche sugli interessi del primo anno (interesse composto).' }],
    hint: `Ogni anno si moltiplica per ${tx(1 + r / 100)}.`,
    explain: `$$${C}\\cdot ${tx(1 + r / 100)} = ${tx(C * (1 + r / 100))} \\qquad ${tx(C * (1 + r / 100))}\\cdot ${tx(1 + r / 100)} = ${tx(M)}\\ €$$ Gli interessi producono altri interessi: è una crescita esponenziale.`,
    cas: { eval: `${C}*(1+${r}/100)^${n}` },
    twin: () => interesseComposto(rng),
  };
}

function rate(rng) {
  const P = rng.pick([400, 500, 800, 1000]);
  const n = rng.pick([10, 12, 20]);
  const extra = rng.pick([10, 20, 25]);
  const tot = P * (1 + extra / 100);
  const rata = tot / n;
  return {
    type: 'number', unit: '%',
    prompt: `Un telefono costa ${euro(P)} in contanti, oppure ${n} rate da ${euro(rata)}. Quanto paghi in più con le rate, in percentuale?`,
    answer: extra,
    traps: [{ value: tot - P, msg: `Questa è la differenza in euro: rapportala a ${P} per avere la percentuale.` }],
    hint: `Totale a rate: $${n}\\cdot ${tx(rata)}$.`,
    explain: `$$${n}\\cdot ${tx(rata)} = ${tx(tot)}\\ € \\qquad \\dfrac{${tx(tot)} - ${P}}{${P}}\\cdot 100 = ${extra}\\%$$ Prima di firmare un finanziamento confronta il totale da pagare (e il TAEG).`,
    cas: { eval: `(${n}*${rata}-${P})/${P}*100` },
    twin: () => rate(rng),
  };
}

function grattaVinci(rng) {
  const cost = rng.pick([2, 5]);
  const prizes = cost === 2 ? [[2, 5], [10, 50], [100, 1000]] : [[5, 5], [20, 50], [500, 1000]];
  const ev = prizes.reduce((s, [v, d]) => s + v / d, 0);
  const loss = cost - ev;
  return {
    type: 'number', unit: '€', decimals: 2,
    fig: table(['Vincita', 'Probabilità'], prizes.map(([v, d]) => [euro(v), `1 su ${d}`]), { caption: `Biglietto da ${euro(cost)}` }),
    prompt: `Il valore atteso della vincita è la somma di (vincita × probabilità). In media, quanti euro si perdono per ogni biglietto comprato?`,
    answer: loss,
    traps: [{ value: ev, msg: `Questa è la vincita media: togli il prezzo del biglietto (${euro(cost)}).` }],
    hint: `$${prizes.map(([v, d]) => `\\dfrac{${v}}{${d}}`).join(' + ')}$`,
    explain: `Vincita media: $${prizes.map(([v, d]) => `${v}\\cdot\\dfrac{1}{${d}}`).join(' + ')} = ${tx(ev)}$ €. Si paga ${euro(cost)}: in media si perdono $${cost} - ${tx(ev)} = ${tx(loss)}$ € a biglietto. Più si gioca, più ci si avvicina a questa perdita: il banco vince sempre.`,
    cas: { eval: `${cost}-(${prizes.map(([v, d]) => `${v}/${d}`).join('+')})` },
    twin: () => grattaVinci(rng),
  };
}

export default {
  id: 'vita-reale',
  area: 'lavoro',
  indirizzo: null,
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_C3'],
  ambito: 'Numeri',
  title: 'Matematica di tutti i giorni',
  summary: 'Spesa, viaggi, bollette, abbonamenti, risparmio, rate e giochi d\'azzardo.',
  glyph: '€',
  levels: [
    { name: 'Spesa e viaggi', desc: 'Prezzo al kg, resto, tempi, carburante' },
    { name: 'Bollette e abbonamenti', desc: 'Quote fisse, convenienza, conto diviso' },
    { name: 'Soldi e rischi', desc: 'Interessi, rate, valore atteso' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'La matematica della spesa', body: 'Per confrontare due confezioni si guarda il prezzo al kg. Per i viaggi: tempo = distanza : velocità. Per il carburante: litri = consumo ogni 100 km × km : 100.' },
        convenienza(rng), resto(rng), tempoViaggio(rng), carburante(rng), convenienza(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'Quota fissa più consumo', body: 'Bollette, abbonamenti e tariffe hanno quasi sempre una parte fissa e una parte che cresce con l\'uso: sono funzioni lineari. Per scegliere bisogna sapere quanto si userà il servizio.' },
        bollettaLuce(rng), abbonamento(rng), contoDiviso(rng), bollettaLuce(rng), abbonamento(rng),
      ];
    }
    return [
      { type: 'learn', title: 'Soldi nel tempo', body: 'Con l\'interesse composto i soldi crescono in modo esponenziale. Con le rate si paga quasi sempre di più. Nei giochi d\'azzardo il valore atteso della vincita è minore del prezzo: in media si perde.' },
      interesseComposto(rng), rate(rng), grattaVinci(rng), interesseComposto(rng), rate(rng),
    ];
  },
};

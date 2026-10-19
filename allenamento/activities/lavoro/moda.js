// MATEMATICA AL LAVORO — Fashion Factory (Industria e artigianato per il Made in Italy)
// Scale del cartamodello, consumo di tessuto, gonna a ruota, ricarichi e IVA, saldi,
// sviluppo delle taglie, pareggio di una collezione, resa del piazzamento.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { plane, table, circleFig, polygon } from '../../js/gfx/svg.js';

// ---------- livello 1: misure e cartamodelli ----------
function scalaCartamodello(rng) {
  const k = rng.pick([2, 4, 5, 10]);
  const sheet = rng.int(3, 16);
  const real = sheet * k;
  return {
    type: 'number', unit: 'cm',
    prompt: `Sul figurino in scala 1:${k} la lunghezza della manica è ${sheet} cm. Quanto deve misurare la manica vera?`,
    answer: real,
    traps: [{ value: sheet / k, msg: `In scala 1:${k} il disegno è ${k} volte più piccolo: per avere la misura vera si moltiplica.` }].filter((t) => t.value !== real),
    hint: `Ogni centimetro del figurino vale ${k} cm.`,
    explain: `$$${sheet}\\cdot ${k} = ${real}\\ \\text{cm}$$`,
    cas: { eval: `${sheet}*${k}` },
    twin: () => scalaCartamodello(rng),
  };
}

function consumoTessuto(rng) {
  const m = rng.pick([1.5, 2, 2.5, 3]);
  const N = rng.pick([10, 20, 30, 40]);
  const p = rng.pick([10, 20]);
  const base = m * N;
  const tot = base * (1 + p / 100);
  return {
    type: 'number', unit: 'm', decimals: 1,
    prompt: `Per un abito servono ${tx(m).replace('{,}', ',')} m di tessuto. Si devono confezionare ${N} abiti e si aggiunge il ${p}% per gli scarti di taglio. Quanti metri di tessuto bisogna ordinare?`,
    answer: tot,
    traps: [{ value: base, msg: `Questi sono i metri senza scarto: aggiungi il ${p}%.` }, { value: base + p, msg: `Hai aggiunto ${p} metri, ma lo scarto è il ${p}% dei metri necessari.` }].filter((t) => Math.abs(t.value - tot) > 0.01),
    hint: `Prima $${tx(m)}\\cdot ${N}$, poi aggiungi il ${p}%.`,
    explain: `$$${tx(m)}\\cdot ${N} = ${tx(base)}\\ \\text{m} \\qquad ${tx(base)}\\cdot ${tx(1 + p / 100)} = ${tx(tot)}\\ \\text{m}$$`,
    cas: { eval: `${m}*${N}*(1+${p}/100)` },
    twin: () => consumoTessuto(rng),
  };
}

function gonnaRuota(rng) {
  // circonferenza vita scelta perché il raggio venga intero con π ≈ 3,14
  const r = rng.int(10, 15);
  const W = +(2 * 3.14 * r).toFixed(2);
  return {
    type: 'number', unit: 'cm', decimals: 1,
    fig: circleFig({ label: 'r', fill: 'g-fill2' }),
    prompt: `Per una gonna a ruota il giro vita (${tx(W).replace('{,}', ',')} cm) è una circonferenza. Quanto misura il raggio da tracciare sul tessuto? Usa $r = \\dfrac{C}{2\\pi}$ con $\\pi \\approx 3{,}14$.`,
    answer: r,
    alts: [W / (2 * Math.PI)],
    traps: [{ value: W / 3.14, msg: 'Questo è il diametro: il raggio è la metà.' }, { value: W / 2, msg: 'Hai diviso solo per 2: manca π.' }],
    hint: `$2\\cdot 3{,}14 = 6{,}28$: dividi ${it(W)} per 6,28.`,
    explain: `$$r = \\dfrac{${tx(W)}}{2\\cdot 3{,}14} = \\dfrac{${tx(W)}}{6{,}28} = ${r}\\ \\text{cm}$$ Con questo raggio si taglia il cerchio interno della gonna.`,
    cas: { eval: `${W}/(2*3.14)` },
    twin: () => gonnaRuota(rng),
  };
}

// ---------- livello 2: prezzi, ricarichi, IVA ----------
function ricarico(rng) {
  const c = rng.pick([20, 30, 40, 50, 60, 80]);
  const p = rng.pick([50, 100, 150]);
  const prezzo = c * (1 + p / 100);
  return {
    type: 'number', unit: '€',
    prompt: `Produrre una camicia costa ${euro(c)}. Il laboratorio applica un ricarico del ${p}%. A che prezzo (senza IVA) la vende?`,
    answer: prezzo,
    traps: [{ value: (c * p) / 100, msg: 'Questo è solo il ricarico: va aggiunto al costo.' }, { value: c + p, msg: `Hai aggiunto ${p} euro, ma il ricarico è il ${p}% del costo.` }].filter((t) => t.value !== prezzo),
    hint: `Ricarico del ${p}%: il prezzo è il ${100 + p}% del costo.`,
    explain: `$$${c}\\cdot ${tx(1 + p / 100)} = ${tx(prezzo)}\\ €$$`,
    cas: { eval: `${c}*(1+${p}/100)` },
    twin: () => ricarico(rng),
  };
}

function scorporoIVA(rng) {
  const netto = rng.int(2, 20) * 50;
  const lordo = netto * 1.22;
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Una giacca costa ${euro(lordo)} IVA inclusa (IVA al 22%). Qual è il prezzo senza IVA?`,
    answer: netto,
    traps: [{ value: lordo * 0.78, msg: 'Togliere il 22% del prezzo finale non funziona: l\'IVA era calcolata sul prezzo senza IVA, che è più basso.' }],
    hint: `Il prezzo con IVA è il 122% di quello senza: dividi per 1,22.`,
    explain: `$$${tx(lordo)} : 1{,}22 = ${netto}\\ €$$ Verifica: il 22% di ${netto} è ${it(netto * 0.22)}, e $${netto} + ${tx(netto * 0.22)} = ${tx(lordo)}$.`,
    cas: { eval: `${lordo}/1.22` },
    twin: () => scorporoIVA(rng),
  };
}

function saldiDoppi(rng) {
  const [a, b] = rng.pick([[20, 10], [30, 20], [50, 20], [40, 10], [20, 20], [50, 10]]);
  const tot = 100 - (100 - a) * (100 - b) / 100;
  return {
    type: 'number', unit: '%',
    prompt: `Un cappotto è scontato del ${a}%. Alla cassa c'è un ulteriore ${b}% di sconto sul prezzo già scontato. Qual è lo sconto totale rispetto al prezzo iniziale?`,
    answer: tot,
    traps: [{ value: a + b, msg: `Gli sconti non si sommano: il secondo ${b}% si calcola su un prezzo già più basso.` }],
    hint: `Prova con un prezzo di 100 €: dopo il primo sconto costa ${100 - a} €.`,
    explain: `Su 100 €: dopo il ${a}% restano ${100 - a} €; il ${b}% di ${100 - a} è ${tx(((100 - a) * b) / 100)}, quindi si paga $${tx((100 - a) * (100 - b) / 100)}$ €. Lo sconto totale è del ${tx(tot)}%, non del ${a + b}%.`,
    cas: { eval: `100-(100-${a})*(100-${b})/100` },
    twin: () => saldiDoppi(rng),
  };
}

// ---------- livello 3: collezione ----------
function taglie(rng) {
  const base = rng.pick([40, 42, 44]);
  const vita = rng.pick([66, 68, 70, 72]);
  const step = 4;
  const T = rng.until(() => rng.pick([38, 40, 42, 44, 46, 48, 50]), (t) => t !== base);
  const ans = vita + ((T - base) / 2) * step;
  return {
    type: 'number', unit: 'cm',
    fig: table(['Taglia', base - 2, base, base + 2, base + 4], [['Vita (cm)', vita - step, vita, vita + step, '…']], { caption: 'Sviluppo delle taglie' }),
    prompt: `Nella tabella delle taglie la ${base} ha ${vita} cm di vita e ogni taglia (che sale di 2 in 2) aggiunge ${step} cm. Quanti centimetri di vita ha la taglia ${T}?`,
    answer: ans,
    traps: [{ value: vita + (T - base) * step, msg: `Le taglie salgono di 2 in 2: dalla ${base} alla ${T} ci sono ${Math.abs(T - base) / 2} passi, non ${Math.abs(T - base)}.` }],
    hint: `Conta i passi di taglia da ${base} a ${T}.`,
    explain: `Dalla ${base} alla ${T} ci sono $${(T - base) / 2}$ passi: $$${vita} ${T > base ? '+' : '-'} ${Math.abs((T - base) / 2)}\\cdot ${step} = ${ans}\\ \\text{cm}$$ La misura cresce in modo lineare con la taglia: $y = ${vita} + 2(x - ${base})$.`,
    explainFig: plane({ xmin: 36, xmax: 52, ymin: 50, ymax: 100, width: 320, height: 210, step: 2, fns: [{ f: (x) => vita + 2 * (x - base), domain: [36, 52] }], points: [{ x: T, y: ans, label: `${T}; ${ans}` }, { x: base, y: vita }], xName: 'taglia', yName: 'cm' }),
    cas: { eval: `${vita}+(${T}-${base})/2*${step}` },
    twin: () => taglie(rng),
  };
}

function pareggioCollezione(rng) {
  const { F, c, p } = rng.until(() => ({ F: rng.pick([1200, 1500, 2000, 2400, 3000]), c: rng.pick([15, 20, 25, 30]), p: rng.pick([45, 50, 60, 75, 80]) }), (v) => v.p > v.c && Number.isInteger(v.F / (v.p - v.c)));
  const q = F / (p - c);
  return {
    type: 'number', unit: 'capi',
    prompt: `Una mini collezione ha costi fissi di ${euro(F)} (cartamodelli, prototipi, servizio fotografico). Ogni capo costa ${euro(c)} di materiali e lavorazione e si vende a ${euro(p)}. Quanti capi bisogna vendere per andare in pareggio?`,
    answer: q,
    traps: [{ value: F / p, msg: 'Ogni capo copre solo il margine (prezzo − costo), non l\'intero prezzo.' }].filter((t) => t.value !== q),
    hint: `Ogni capo venduto lascia $${p} - ${c} = ${p - c}$ € per coprire i costi fissi.`,
    explain: `$$${p}q = ${F} + ${c}q \\Rightarrow ${p - c}q = ${F} \\Rightarrow q = ${q}$$`,
    explainFig: plane({ xmin: 0, xmax: q * 2, ymin: 0, ymax: Math.ceil((p * q * 2) / 500) * 500, width: 320, height: 220, fns: [{ f: (x) => p * x, label: 'ricavi' }, { f: (x) => F + c * x, cls: 'g-fn2', label: 'costi', labelX: q * 0.3 }], points: [{ x: q, y: p * q, label: `pareggio: ${q} capi` }], xName: 'capi', yName: '€' }),
    cas: { solve: `${p}*x=${F}+${c}*x` },
    twin: () => pareggioCollezione(rng),
  };
}

function resaPiazzamento(rng) {
  const L = rng.pick([2, 3, 4, 5]);
  const H = 1.5;
  const resa = rng.pick([60, 70, 75, 80, 90]);
  const usata = +((L * H * resa) / 100).toFixed(3);
  return {
    type: 'number', unit: '%',
    fig: polygon({ pts: [[0, 0], [L, 0], [L, H], [0, H]], sides: [`${L} m`, '1,5 m', '', ''], width: 300, height: 150 }),
    prompt: `Su una pezza alta 1,5 m si usano ${L} m di lunghezza. I pezzi del cartamodello occupano in tutto ${tx(usata).replace('{,}', ',')} m². Qual è la resa del piazzamento, in percentuale?`,
    answer: resa,
    traps: [{ value: 100 - resa, msg: 'Questa è la percentuale di scarto: la resa è la parte usata.' }].filter((t) => Math.abs(t.value - resa) > 0.01),
    hint: `Area della pezza: $${L}\\cdot 1{,}5 = ${tx(L * H)}$ m².`,
    explain: `$$\\dfrac{${tx(usata)}}{${tx(L * H)}}\\cdot 100 = ${tx(resa)}\\%$$ Il resto (${it(100 - resa)}%) è scarto: un buon piazzamento lo riduce al minimo.`,
    cas: { eval: `${usata}/(${L}*1.5)*100` },
    twin: () => resaPiazzamento(rng),
  };
}

export default {
  id: 'lavoro-moda',
  area: 'lavoro',
  indirizzo: 'moda',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Matematica in sartoria',
  summary: 'Figurini in scala, metri di tessuto, gonna a ruota, prezzi, taglie, collezioni.',
  glyph: '✂',
  levels: [
    { name: 'Misure e tessuti', desc: 'Scale, consumo di tessuto, gonna a ruota' },
    { name: 'Prezzi', desc: 'Ricarico, IVA, saldi uno dopo l\'altro' },
    { name: 'La collezione', desc: 'Sviluppo taglie, pareggio, resa del piazzamento' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Dal figurino al capo', body: 'Un figurino in scala 1:5 è cinque volte più piccolo del capo vero. Quando si ordina il tessuto si aggiunge sempre una percentuale per gli scarti di taglio.' },
        scalaCartamodello(rng), consumoTessuto(rng), gonnaRuota(rng), consumoTessuto(rng), scalaCartamodello(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'Dal costo al cartellino', body: 'Costo di produzione + ricarico = prezzo di vendita. Poi si aggiunge l\'IVA (22%): il prezzo al pubblico è $1{,}22$ volte quello senza IVA. Per tornare indietro si divide per $1{,}22$.' },
        ricarico(rng), scorporoIVA(rng), saldiDoppi(rng), ricarico(rng), scorporoIVA(rng),
      ];
    }
    return [
      { type: 'learn', title: 'Numeri di una collezione', body: 'Le misure delle taglie crescono in modo lineare. Una collezione ha costi fissi (prototipi, foto) e costi per capo: si va in pareggio quando i ricavi coprono entrambi.' },
      taglie(rng), pareggioCollezione(rng), resaPiazzamento(rng), taglie(rng), pareggioCollezione(rng),
    ];
  },
};

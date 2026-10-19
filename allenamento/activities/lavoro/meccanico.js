// MATEMATICA AL LAVORO — Meccanico (Industria e artigianato per il Made in Italy, Meccanica)
// Misure, scale del disegno tecnico, parametri di taglio, ingranaggi, costi e qualità.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { polygon, box, plane, table } from '../../js/gfx/svg.js';


// ---------- livello 1: misure e disegno ----------
function scala(rng) {
  const ingr = rng.chance(0.3);
  const k = ingr ? rng.pick([2, 5]) : rng.pick([2, 5, 10]);
  const d = ingr ? rng.int(6, 40) * 5 : rng.int(8, 60);
  const real = ingr ? d / k : d * k;
  const sc = ingr ? `${k}:1` : `1:${k}`;
  return {
    type: 'number', unit: 'mm', decimals: 1,
    fig: polygon({ pts: [[0, 0], [6, 0], [6, 3], [0, 3]], sides: [`${d} mm sul disegno`, '', '', ''], width: 280, height: 150 }),
    prompt: `Nel disegno in scala ${sc} una quota misura ${d} mm. Quanto misura il pezzo reale?`,
    answer: real,
    traps: [{ value: ingr ? d * k : d / k, msg: ingr ? `La scala ${sc} è un ingrandimento: il disegno è ${k} volte più grande del pezzo, quindi il pezzo è più piccolo.` : `In scala ${sc} il disegno è ${k} volte più piccolo del pezzo: bisogna moltiplicare.` }],
    hint: ingr ? `In scala ${sc} ogni millimetro reale diventa ${k} mm sul disegno.` : `In scala ${sc} ogni millimetro del disegno vale ${k} mm reali.`,
    explain: ingr ? `$$${d} : ${k} = ${tx(real, 1)}\\ \\text{mm}$$ Le scale con il primo numero più grande (${sc}) ingrandiscono: si usano per i particolari piccoli.` : `$$${d}\\cdot ${k} = ${real}\\ \\text{mm}$$ Le scale 1:${k} riducono: si usano per i pezzi grandi.`,
    cas: { eval: ingr ? `${d}/${k}` : `${d}*${k}` },
    twin: () => scala(rng),
  };
}

function pollici(rng) {
  const [lab, v] = rng.pick([['1/2', 0.5], ['1/4', 0.25], ['1', 1], ['2', 2], ['1 e 1/2', 1.5], ['3', 3]]);
  const mm = v * 25.4;
  return {
    type: 'number', unit: 'mm', decimals: 2,
    prompt: `Un tubo ha il diametro di ${lab} ${v > 1 ? 'pollici' : 'pollice'}. Sapendo che 1 pollice = 25,4 mm, quanto misura in millimetri?`,
    answer: mm,
    traps: [{ value: 25.4 / v, msg: 'Hai diviso: per passare da pollici a millimetri si moltiplica per 25,4.' }].filter((t) => Math.abs(t.value - mm) > 0.2),
    hint: v < 1 ? `Metà di 25,4 è 12,7${v === 0.25 ? '; la metà ancora è 6,35' : ''}.` : 'Moltiplica il numero di pollici per 25,4.',
    explain: `$$${tx(v, 3)}\\cdot 25{,}4 = ${tx(mm, 2)}\\ \\text{mm}$$ Pollici e filettature in pollici (gas) si usano ancora negli impianti idraulici e pneumatici.`,
    cas: { eval: `${v}*25.4` },
    twin: () => pollici(rng),
  };
}

function tolleranza(rng) {
  const N = rng.int(20, 80);
  const t = rng.pick([0.02, 0.05, 0.1]);
  const deltas = rng.shuffle([-1.6, -0.6, 0.4, 0.8, 1.4, 2]).slice(0, 3);
  const dec = t < 0.05 ? 3 : 2;
  const vals = deltas.map((k) => +(N + k * t).toFixed(3));
  return {
    type: 'truefalse',
    prompt: `Il disegno prescrive un diametro di $${N} \\pm ${tx(t)}$ mm. Quali pezzi sono accettabili?`,
    statements: vals.map((v, i) => ({ text: `Il pezzo che misura ${it(v, dec)} mm è accettabile`, value: Math.abs(deltas[i]) <= 1 })),
    hint: `Sono accettabili le misure tra ${it(N - t, dec)} mm e ${it(N + t, dec)} mm.`,
    explain: `Limite inferiore: $${N} - ${tx(t)} = ${tx(N - t, dec)}$ mm. Limite superiore: $${N} + ${tx(t)} = ${tx(N + t, dec)}$ mm. Un pezzo va bene se la misura sta tra i due limiti.`,
    twin: () => tolleranza(rng),
  };
}

function massaPiastra(rng) {
  const { a, b, c } = rng.until(() => ({ a: rng.int(2, 10) * 10, b: rng.int(2, 6) * 10, c: rng.pick([5, 10, 20]) }), (v) => (v.a * v.b * v.c) % 1000 === 0);
  const V = (a * b * c) / 1000; // cm³
  const m = V * 8;
  return {
    type: 'number', unit: 'g',
    fig: box({ a, b, c, labels: [`${a} mm`, `${b} mm`, `${c} mm`] }),
    prompt: `Una piastra d'acciaio misura ${a} × ${b} × ${c} mm. L'acciaio ha densità di circa 8 g/cm³. Quanti grammi pesa?`,
    answer: m,
    alts: [V * 7.85],
    traps: [{ value: a * b * c * 8, msg: 'Prima passa da mm³ a cm³: 1 cm³ = 1000 mm³.' }, { value: V, msg: `Questo è il volume in cm³: moltiplica per la densità.` }],
    hint: `In centimetri la piastra misura ${a / 10} × ${b / 10} × ${c / 10}.`,
    explain: `$$V = ${a / 10}\\cdot ${b / 10}\\cdot ${tx(c / 10)} = ${tx(V)}\\ \\text{cm}^3 \\qquad m = ${tx(V)}\\cdot 8 = ${tx(m)}\\ \\text{g}$$ Con la densità precisa (7,85 g/cm³) si ottiene ${it(V * 7.85, 1)} g.`,
    cas: { eval: `${a}*${b}*${c}/1000*8` },
    twin: () => massaPiastra(rng),
  };
}

// ---------- livello 2: alle macchine utensili ----------
// π ≈ 3,14: i dati sono costruiti perché il conto si semplifichi a mente
function giri(rng) {
  const { D, n } = rng.until(() => ({ D: rng.pick([20, 25, 40, 50, 80, 100]), n: rng.pick([400, 500, 800, 1000, 1200, 1500, 2000]) }), (v) => { const Vc = (3.14 * v.D * v.n) / 1000; return Vc >= 60 && Vc <= 320 && Number.isInteger(Math.round(Vc * 100) / 10); });
  const Vc = +((3.14 * D * n) / 1000).toFixed(2);
  return {
    type: 'number', unit: 'giri/min', decimals: 0,
    prompt: `Si tornisce un pezzo di diametro ${D} mm con velocità di taglio $V_c = ${tx(Vc)}$ m/min. Quanti giri al minuto deve fare il mandrino? Usa $n = \\dfrac{1000\\cdot V_c}{\\pi\\cdot D}$ con $\\pi \\approx 3{,}14$.`,
    answer: n,
    alts: [(1000 * Vc) / (Math.PI * D)],
    traps: [
      { value: (1000 * Vc) / D, msg: 'Manca π: in un giro il pezzo percorre la circonferenza, π·D.' },
      { value: (3.14 * D * 1000) / Vc, msg: 'Formula capovolta: al numeratore va 1000·Vc.' },
    ].filter((t) => Math.abs(t.value - n) > 1),
    hint: `Calcola prima $3{,}14\\cdot ${D} = ${tx(3.14 * D)}$: vedrai che il conto si semplifica.`,
    explain: `$$n = \\dfrac{1000\\cdot ${tx(Vc)}}{3{,}14\\cdot ${D}} = \\dfrac{${tx(1000 * Vc)}}{${tx(3.14 * D)}} = ${n}\\ \\text{giri/min}$$ A parità di velocità di taglio, più il pezzo è grosso e meno giri servono.`,
    cas: { eval: `1000*${Vc}/(3.14*${D})` },
    twin: () => giri(rng),
  };
}

function velocitaTaglio(rng) {
  const D = rng.pick([10, 20, 25, 50]);
  const n = rng.pick([400, 800, 1000, 2000]);
  const Vc = (3.14 * D * n) / 1000;
  return {
    type: 'number', unit: 'm/min', decimals: 1,
    prompt: `Una fresa di diametro ${D} mm gira a ${n} giri/min. Qual è la velocità di taglio $V_c = \\dfrac{\\pi\\cdot D\\cdot n}{1000}$? Usa $\\pi \\approx 3{,}14$.`,
    answer: Vc,
    alts: [(Math.PI * D * n) / 1000],
    traps: [{ value: 3.14 * D * n, msg: 'Dividi per 1000 per passare da millimetri a metri.' }],
    hint: `$${D}\\cdot ${n} = ${D * n}$; diviso 1000 fa ${it((D * n) / 1000)}; ora moltiplica per 3,14.`,
    explain: `$$V_c = \\dfrac{3{,}14\\cdot ${D}\\cdot ${n}}{1000} = 3{,}14\\cdot ${tx((D * n) / 1000)} = ${tx(Vc, 2)}\\ \\text{m/min}$$`,
    cas: { eval: `3.14*${D}*${n}/1000` },
    twin: () => velocitaTaglio(rng),
  };
}

function tempoLavorazione(rng) {
  const { L, f, n } = rng.until(
    () => ({ L: rng.int(3, 12) * 20, f: rng.pick([0.1, 0.2, 0.25, 0.4]), n: rng.pick([400, 500, 600, 800, 1000]) }),
    (v) => Number.isInteger(Math.round((v.L / (v.f * v.n)) * 1000) / 10),
  );
  const t = L / (f * n);
  return {
    type: 'number', unit: 'min', decimals: 2,
    prompt: `Bisogna tornire un tratto lungo ${L} mm con avanzamento ${it(f)} mm/giro a ${n} giri/min. Quanti minuti dura la passata? Usa $t = \\dfrac{L}{f\\cdot n}$.`,
    answer: t,
    traps: [{ value: (L * f) / n, msg: 'L\'avanzamento va al denominatore: in un minuto l\'utensile avanza di f·n millimetri.' }],
    hint: `In un minuto l'utensile avanza di $${tx(f)}\\cdot ${n} = ${tx(f * n)}$ mm.`,
    explain: `$$t = \\dfrac{${L}}{${tx(f)}\\cdot ${n}} = \\dfrac{${L}}{${tx(f * n)}} = ${tx(t, 2)}\\ \\text{min}$$ cioè circa ${Math.round(t * 60)} secondi.`,
    cas: { eval: `${L}/(${f}*${n})` },
    twin: () => tempoLavorazione(rng),
  };
}

function ingranaggi(rng) {
  const { z1, z2, n1 } = rng.until(
    () => ({ z1: rng.pick([12, 15, 18, 20, 24]), z2: rng.pick([36, 40, 45, 48, 60]), n1: rng.int(2, 6) * 300 }),
    (v) => Number.isInteger((v.n1 * v.z1) / v.z2),
  );
  const n2 = (n1 * z1) / z2;
  return {
    type: 'number', unit: 'giri/min',
    fig: table(['', 'Ruota motrice', 'Ruota condotta'], [['Denti', z1, z2], ['Giri/min', n1, '?']], { caption: 'Coppia di ruote dentate' }),
    prompt: `Una ruota dentata da ${z1} denti gira a ${n1} giri/min e trascina una ruota da ${z2} denti. Quanti giri al minuto fa la ruota condotta?`,
    answer: n2,
    traps: [{ value: (n1 * z2) / z1, msg: 'La ruota condotta ha più denti: deve girare più lentamente, non più veloce.' }],
    hint: 'I denti che passano in un minuto sono gli stessi per le due ruote: $n_1\\cdot z_1 = n_2\\cdot z_2$.',
    explain: `$$n_2 = \\dfrac{n_1\\cdot z_1}{z_2} = \\dfrac{${n1}\\cdot ${z1}}{${z2}} = ${n2}\\ \\text{giri/min}$$ Velocità e numero di denti sono inversamente proporzionali. Il rapporto di trasmissione è $${z2}:${z1} = ${tx(z2 / z1)}$.`,
    cas: { eval: `${n1}*${z1}/${z2}` },
    twin: () => ingranaggi(rng),
  };
}

// ---------- livello 3: produzione e qualità ----------
function convenienzaCNC(rng) {
  const { A1, c1, A2, c2 } = rng.until(
    () => ({ A1: rng.pick([20, 40, 60]), c1: rng.pick([6, 7, 8, 9]), A2: rng.pick([200, 240, 300, 360]), c2: rng.pick([2, 3, 4]) }),
    (v) => Number.isInteger((v.A2 - v.A1) / (v.c1 - v.c2)),
  );
  const q = (A2 - A1) / (c1 - c2);
  return {
    type: 'number', unit: 'pezzi',
    prompt: `Al tornio tradizionale un pezzo costa ${euro(A1)} di preparazione più ${euro(c1)} a pezzo. Al tornio CNC costa ${euro(A2)} di programmazione più ${euro(c2)} a pezzo. Per quanti pezzi le due lavorazioni costano uguale?`,
    answer: q,
    traps: [{ value: (A2 + A1) / (c1 - c2), msg: 'I costi fissi vanno sottratti, non sommati: $A_2 - A_1$.' }].filter((t) => t.value !== q),
    hint: `Scrivi l'equazione $${A1} + ${c1}x = ${A2} + ${c2}x$.`,
    explain: `$$${A1} + ${c1}x = ${A2} + ${c2}x \\Rightarrow ${c1 - c2}x = ${A2 - A1} \\Rightarrow x = ${q}$$ Sopra i ${q} pezzi conviene il CNC: costa di più all'inizio, ma ogni pezzo costa meno.`,
    explainFig: plane({ xmin: 0, xmax: q * 2, ymin: 0, ymax: Math.ceil((A1 + c1 * q * 2) / 50) * 50, width: 320, height: 220, fns: [{ f: (x) => A1 + c1 * x, label: 'tradizionale' }, { f: (x) => A2 + c2 * x, cls: 'g-fn2', label: 'CNC', labelX: q * 0.4 }], points: [{ x: q, y: A1 + c1 * q, label: `${q} pezzi` }], xName: 'pezzi', yName: '€' }),
    cas: { solve: `${A1}+${c1}*x=${A2}+${c2}*x` },
    twin: () => convenienzaCNC(rng),
  };
}

function mediaMisure(rng) {
  const N = rng.pick([20, 25, 30, 40]);
  const ks = rng.until(() => Array.from({ length: 6 }, () => rng.int(-4, 4)), (k) => k.reduce((a, b) => a + b, 0) % 6 === 0);
  const vals = ks.map((k) => +(N + k / 100).toFixed(2));
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  return {
    type: 'number', unit: 'mm', decimals: 2,
    fig: `<p class="data-row">${vals.map((v) => it(v, 2)).join('&ensp;')}</p>`,
    prompt: `Al controllo qualità si misurano 6 perni da ${N} mm (valori in mm). Qual è la media delle misure?`,
    answer: mean,
    hint: 'Somma le sei misure e dividi per 6. Più veloce: somma solo gli scostamenti da ' + N + ' (in centesimi).',
    explain: `Scostamenti da ${N} mm in centesimi: ${ks.join(', ')}. Somma: ${ks.reduce((s, k) => s + k, 0)}. Media: $${N} + \\dfrac{${ks.reduce((s, k) => s + k, 0)}}{6}\\cdot 0{,}01 = ${tx(mean, 2)}$ mm.`,
    cas: { eval: `(${vals.join('+')})/6` },
    twin: () => mediaMisure(rng),
  };
}

function scarti(rng) {
  const p = rng.pick([10, 20, 25]);
  const keep = (100 - p) / 100;
  const need = rng.int(2, 12) * (p === 10 ? 100 : p === 20 ? 50 : 40);
  const Q = need * keep;
  return {
    type: 'number', unit: 'pezzi',
    prompt: `Bisogna consegnare ${Q} pezzi buoni. In media il ${p}% dei pezzi prodotti viene scartato. Quanti pezzi bisogna produrre?`,
    answer: need,
    traps: [{ value: Q * (1 + p / 100), msg: `Aggiungere il ${p}% di ${Q} non basta: lo scarto si calcola sui pezzi prodotti, che sono più di ${Q}.` }].filter((t) => t.value !== need),
    hint: `I pezzi buoni sono il ${100 - p}% di quelli prodotti: $${tx(keep)}\\cdot x = ${Q}$.`,
    explain: `$$x = \\dfrac{${Q}}{${tx(keep)}} = ${need}$$ Verifica: il ${p}% di ${need} è ${need - Q}, e $${need} - ${need - Q} = ${Q}$.`,
    cas: { eval: `${Q}/${keep}` },
    twin: () => scarti(rng),
  };
}

function conicita(rng) {
  const { D, d, L } = rng.until(() => ({ D: rng.int(20, 50), d: rng.int(10, 40), L: rng.pick([20, 25, 40, 50, 100]) }), (v) => v.D - v.d >= 2 && v.D - v.d <= 20 && Number.isInteger(((v.D - v.d) * 100) / v.L));
  const c = ((D - d) * 100) / L;
  return {
    type: 'number', unit: '%',
    fig: polygon({ pts: [[0, 0], [L, (D - d) / 2], [L, D - (D - d) / 2], [0, D]], sides: [`L = ${L}`, `d = ${d}`, '', `D = ${D}`], width: 300, height: 200 }),
    prompt: `Un tratto conico passa da $D = ${D}$ mm a $d = ${d}$ mm in una lunghezza di ${L} mm. Qual è la sua conicità, in percentuale? Usa $C = \\dfrac{D - d}{L}\\cdot 100$.`,
    answer: c,
    traps: [{ value: ((D - d) * 100) / (2 * L), msg: 'Questa è la metà: la conicità usa la differenza dei diametri, non dei raggi.' }].filter((t) => t.value !== c),
    hint: `$D - d = ${D - d}$ mm su ${L} mm di lunghezza.`,
    explain: `$$C = \\dfrac{${D} - ${d}}{${L}}\\cdot 100 = \\dfrac{${D - d}}{${L}}\\cdot 100 = ${tx(c)}\\%$$ Vuol dire che il diametro cala di ${it(c / 100)} mm per ogni millimetro di lunghezza.`,
    cas: { eval: `(${D}-${d})/${L}*100` },
    twin: () => conicita(rng),
  };
}

export default {
  id: 'lavoro-meccanico',
  area: 'lavoro',
  indirizzo: 'meccanico',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_A4'],
  ambito: 'Spazio e figure',
  title: 'Matematica in officina',
  summary: 'Scale, tolleranze, giri del mandrino, ingranaggi, costi e scarti.',
  glyph: '⚙',
  levels: [
    { name: 'Misure e disegno', desc: 'Scale, pollici, tolleranze, massa di un pezzo' },
    { name: 'Alle macchine', desc: 'Giri, velocità di taglio, tempi, ingranaggi' },
    { name: 'Produzione e qualità', desc: 'Convenienza, media delle misure, scarti, conicità' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Il disegno dice la verità, in scala', body: 'In scala 1:5 ogni millimetro del disegno vale 5 mm reali. In scala 2:1 il disegno è il doppio del pezzo. Una quota $40 \\pm 0{,}05$ vuol dire: va bene ogni misura tra $39{,}95$ e $40{,}05$ mm.' },
        scala(rng), pollici(rng), tolleranza(rng), scala(rng), massaPiastra(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'Giri e velocità di taglio', body: 'In un giro il tagliente percorre la circonferenza del pezzo, $\\pi\\cdot D$. Per avere la velocità di taglio giusta: $n = \\dfrac{1000\\cdot V_c}{\\pi\\cdot D}$. Il 1000 serve perché $V_c$ è in metri al minuto e $D$ in millimetri.' },
        giri(rng), velocitaTaglio(rng), tempoLavorazione(rng), ingranaggi(rng), giri(rng),
      ];
    }
    return [
      { type: 'learn', title: 'Conviene?', body: 'Il costo di una lavorazione è quasi sempre una funzione lineare: una parte fissa (preparazione, programmazione) più un costo per ogni pezzo. Confrontare due lavorazioni vuol dire trovare dove le due rette si incontrano.' },
      convenienzaCNC(rng), mediaMisure(rng), scarti(rng), conicita(rng), convenienzaCNC(rng),
    ];
  },
};

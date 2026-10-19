import { scene } from '../contesti.js';
import { it, tx, euro } from '../../js/engine/helpers.js';
import { plane, table } from '../../js/gfx/svg.js';

function missingTerm(rng) {
  const { a, b, c, d } = rng.until(
    () => {
      const a = rng.int(2, 12), b = rng.int(2, 12), k = rng.int(2, 6);
      return { a, b, c: a * k, d: b * k };
    },
    (v) => v.a !== v.b,
  );
  const pos = rng.int(0, 3);
  const vals = [a, b, c, d];
  const shown = vals.map((v, i) => (i === pos ? 'x' : v));
  return {
    type: 'number',
    prompt: `Trova $x$: $$${shown[0]} : ${shown[1]} = ${shown[2]} : ${shown[3]}$$`,
    answer: vals[pos],
    hint: 'Il prodotto dei medi è uguale al prodotto degli estremi.',
    explain: `Medi: $${shown[1]}$ e $${shown[2]}$; estremi: $${shown[0]}$ e $${shown[3]}$. $$${shown[1]}\\cdot ${shown[2]} = ${shown[0]}\\cdot ${shown[3]} \\Rightarrow x = ${vals[pos]}$$`,
    twin: () => missingTerm(rng),
  };
}

function direct(rng) {
  const kind = rng.pick(['ricetta', 'carburante', 'stampa']);
  if (kind === 'ricetta') {
    const p1 = rng.pick([2, 4, 5]), q1 = rng.pick([150, 200, 250, 300]);
    const p2 = rng.until(() => rng.int(3, 12), (p) => p !== p1 && (q1 * p) % p1 === 0);
    const ans = (q1 * p2) / p1;
    return {
      type: 'number', unit: 'g',
      prompt: `Per ${p1} persone servono ${q1} g di farina. Quanta farina serve per ${p2} persone?`,
      answer: ans,
      traps: [{ value: q1 + (p2 - p1), msg: 'Non si aggiunge un grammo per persona: la farina cresce in proporzione alle persone.' }],
      hint: `Trova la farina per 1 persona: ${q1} : ${p1}.`,
      explain: `Per una persona: $${q1} : ${p1} = ${tx(q1 / p1)}$ g. Per ${p2}: $${tx(q1 / p1)}\\cdot ${p2} = ${ans}$ g.`,
      twin: () => direct(rng),
    };
  }
  if (kind === 'carburante') {
    const km1 = rng.pick([100, 150, 200]), l1 = rng.pick([5, 6, 8, 10]);
    const km2 = rng.pick([250, 300, 350, 450, 500]);
    const ans = (l1 * km2) / km1;
    return {
      type: 'number', unit: 'litri', decimals: 1,
      prompt: `Uno scooter consuma ${l1} litri ogni ${km1} km. Quanti litri servono per ${km2} km?`,
      answer: ans,
      traps: [{ value: (km1 * km2) / l1 / 100, msg: 'Controlla la proporzione: più chilometri, più litri.' }],
      hint: `${km2} km sono ${it(km2 / km1)} volte ${km1} km.`,
      explain: `$$${l1} : ${km1} = x : ${km2} \\Rightarrow x = \\dfrac{${l1}\\cdot ${km2}}{${km1}} = ${tx(ans)}$$`,
      twin: () => direct(rng),
    };
  }
  const pag1 = rng.pick([10, 12, 20]), min1 = rng.pick([2, 3, 4]);
  const pag2 = pag1 * rng.int(2, 6);
  return {
    type: 'number', unit: 'minuti',
    prompt: `Una stampante stampa ${pag1} pagine in ${min1} minuti. Quanto tempo serve per ${pag2} pagine?`,
    answer: (min1 * pag2) / pag1,
    hint: `Le pagine sono ${pag2 / pag1} volte di più.`,
    explain: `Pagine ×${pag2 / pag1} ⇒ tempo ×${pag2 / pag1}: $${min1}\\cdot ${pag2 / pag1} = ${(min1 * pag2) / pag1}$ minuti.`,
    twin: () => direct(rng),
  };
}

function scaleMap(rng) {
  const scale = rng.pick([25000, 50000, 100000, 200000]);
  const cm = rng.pick([2, 3, 4, 5, 6, 7, 8, 12]);
  const km = (cm * scale) / 100000;
  return {
    type: 'number', unit: 'km', decimals: 2,
    prompt: `Su una carta in scala $1 : ${scale.toLocaleString('it-IT')}$ due paesi distano ${cm} cm. Quanti km sono nella realtà?`,
    answer: km,
    traps: [{ value: cm * scale, msg: `${(cm * scale).toLocaleString('it-IT')} sono centimetri: trasformali in km (÷ 100 000).` }],
    hint: `Ogni cm sulla carta vale ${scale.toLocaleString('it-IT')} cm reali. 1 km = 100 000 cm.`,
    explain: `$${cm}\\cdot ${scale} = ${cm * scale}$ cm $= ${tx(km)}$ km.`,
    twin: () => scaleMap(rng),
  };
}

function inverse(rng) {
  const w1 = rng.pick([2, 3, 4, 6]), d1 = rng.pick([6, 8, 9, 12]);
  const w2 = rng.until(() => rng.int(2, 12), (w) => w !== w1 && (w1 * d1) % w === 0);
  const ans = (w1 * d1) / w2;
  const [who, task] = scene(rng, 'squadra');
  return {
    type: 'number', unit: 'ore',
    prompt: `${w1} ${who} impiegano ${d1} ore per ${task}. Lavorando allo stesso ritmo, quante ore impiegano ${w2} ${who}?`,
    answer: ans,
    traps: [{ value: (d1 * w2) / w1, msg: `Hai usato la proporzionalità diretta: con ${w2 > w1 ? 'più' : 'meno'} persone il tempo ${w2 > w1 ? 'diminuisce' : 'aumenta'}.` }],
    hint: 'Il lavoro totale (persone × ore) resta lo stesso.',
    explain: `Lavoro totale: $${w1}\\cdot ${d1} = ${w1 * d1}$ ore-persona. Con ${w2} persone: $${w1 * d1} : ${w2} = ${ans}$ ore. È una proporzionalità inversa: il prodotto resta costante.`,
    twin: () => inverse(rng),
  };
}

function directOrInverse(rng) {
  const k = rng.int(2, 6);
  const isDirect = rng.chance(0.5);
  const xs = [1, 2, 3, 4, 6];
  const rows = xs.map((x) => [x, isDirect ? k * x : +(12 * k / x).toFixed(2)]);
  const f = isDirect ? (x) => k * x : (x) => (12 * k) / x;
  return {
    type: 'choice',
    fig: table(['$x$', '$y$'], rows.map((r) => [r[0], String(r[1]).replace('.', ',')])) + plane({ xmin: 0, xmax: 7, ymin: 0, ymax: isDirect ? k * 7 : 12 * k + 2, width: 320, height: 220, fns: [{ f, domain: isDirect ? [0, 7] : [0.4, 7] }], points: rows.map(([x, y]) => ({ x, y })) }),
    prompt: 'Che legame c\'è tra $x$ e $y$?',
    options: [
      { label: 'Proporzionalità diretta', correct: isDirect, why: isDirect ? undefined : 'Quando x raddoppia, y si dimezza: il rapporto non è costante.' },
      { label: 'Proporzionalità inversa', correct: !isDirect, why: !isDirect ? undefined : 'Quando x raddoppia, anche y raddoppia: è costante il rapporto, non il prodotto.' },
      { label: 'Nessuna proporzionalità', why: isDirect ? `Il rapporto $y/x$ vale sempre ${k}.` : `Il prodotto $x\\cdot y$ vale sempre ${12 * k}.` },
    ],
    fixedOrder: true,
    explain: isDirect
      ? `$y/x = ${k}$ per ogni coppia: proporzionalità diretta, $y = ${k}x$. Il grafico è una retta che passa per l'origine.`
      : `$x\\cdot y = ${12 * k}$ per ogni coppia: proporzionalità inversa, $y = \\dfrac{${12 * k}}{x}$. Il grafico è un ramo di iperbole.`,
    twin: () => directOrInverse(rng),
  };
}

function unitPrice(rng) {
  const a = { q: rng.pick([250, 500, 750]), p: rng.pick([1.2, 1.5, 1.8, 2.1]) };
  const b = { q: rng.pick([1000, 1500]), p: rng.pick([2.4, 2.9, 3.3, 3.9]) };
  const ua = a.p / a.q, ub = b.p / b.q;
  if (Math.abs(ua - ub) < 1e-6) return unitPrice(rng);
  const cheaper = ua < ub ? 'A' : 'B';
  return {
    type: 'choice',
    prompt: `Confezione A: ${a.q} g a ${euro(a.p)}. Confezione B: ${b.q} g a ${euro(b.p)}. Quale conviene?`,
    options: [
      { label: 'A', correct: cheaper === 'A', why: cheaper === 'A' ? undefined : 'Confronta il prezzo al chilo, non il prezzo della confezione.' },
      { label: 'B', correct: cheaper === 'B', why: cheaper === 'B' ? undefined : 'Confronta il prezzo al chilo, non il prezzo della confezione.' },
    ],
    fixedOrder: true,
    explain: `Prezzo al kg: A $= ${tx(a.p)} : ${tx(a.q / 1000, 3)} \\approx ${tx(ua * 1000)}$ €/kg; B $= ${tx(b.p)} : ${tx(b.q / 1000, 3)} \\approx ${tx(ub * 1000)}$ €/kg. Conviene ${cheaper}.`,
    twin: () => unitPrice(rng),
  };
}

export default {
  id: 'proporzioni',
  area: 'numeri',
  years: [1, 2],
  mat: ['MAT_K2', 'MAT_C2'],
  ambito: 'Relazioni e funzioni',
  title: 'Proporzioni',
  summary: 'Ricette, mappe, consumi, squadre di lavoro.',
  glyph: 'a:b',
  levels: [
    { name: 'La proporzione', desc: 'Termine incognito e scale' },
    { name: 'Diretta', desc: 'Più ne hai, più ne serve' },
    { name: 'Diretta o inversa?', desc: 'Tabelle, grafici e lavori di squadra' },
  ],
  generate(rng, level) {
    if (level === 1) return [{ type: 'learn', title: 'Due rapporti uguali', body: '$$3 : 4 = 6 : 8$$ si legge "3 sta a 4 come 6 sta a 8". In ogni proporzione il prodotto dei medi è uguale al prodotto degli estremi: $4\\cdot 6 = 3\\cdot 8 = 24$.' }, missingTerm(rng), scaleMap(rng), missingTerm(rng), scaleMap(rng), missingTerm(rng)];
    if (level === 2) return [{ type: 'learn', title: 'Proporzionalità diretta', body: 'Se una grandezza raddoppia e l\'altra raddoppia, se triplica e l\'altra triplica, il loro rapporto è costante. Il trucco: calcola quanto vale "per uno".' }, direct(rng), unitPrice(rng), direct(rng), direct(rng), unitPrice(rng)];
    return [{ type: 'learn', title: 'Quando una sale e l\'altra scende', body: 'Più persone lavorano, meno tempo serve: è una proporzionalità inversa. Qui resta costante il prodotto, non il rapporto.' }, directOrInverse(rng), inverse(rng), directOrInverse(rng), inverse(rng), direct(rng)];
  },
};

void it;

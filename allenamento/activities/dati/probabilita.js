import { scene } from '../contesti.js';
import { frac, tx } from '../../js/engine/helpers.js';
import { tree, table } from '../../js/gfx/svg.js';

function urn(rng) {
  const r = rng.int(1, 9), b = rng.int(1, 9), g = rng.int(0, 6);
  const tot = r + b + g;
  const ask = rng.pick(['rossa', 'blu', g ? 'verde' : 'rossa']);
  const fav = { rossa: r, blu: b, verde: g }[ask];
  return {
    type: 'number', reduced: true,
    prompt: `In un sacchetto ci sono ${r} palline rosse, ${b} blu${g ? ` e ${g} verdi` : ''}. Pescandone una a caso, qual è la probabilità che sia ${ask}? (frazione ridotta)`,
    answer: fav / tot,
    traps: [{ value: fav / (tot - fav), msg: 'Al denominatore vanno tutti i casi possibili, non solo quelli contrari.' }],
    hint: 'Casi favorevoli : casi possibili',
    explain: `$$P = \\dfrac{${fav}}{${tot}}${frac(fav, tot) !== `\\dfrac{${fav}}{${tot}}` ? ` = ${frac(fav, tot)}` : ''}$$`,
    placeholder: 'ad es. 2/7',
    twin: () => urn(rng),
  };
}

function dice(rng) {
  const target = rng.int(3, 11);
  const fav = 6 - Math.abs(7 - target);
  const head = ['+', '1', '2', '3', '4', '5', '6'];
  const rows = [1, 2, 3, 4, 5, 6].map((a) => [String(a), ...[1, 2, 3, 4, 5, 6].map((b) => (a + b === target ? `<b class="hl">${a + b}</b>` : String(a + b)))]);
  return {
    type: 'number', reduced: true,
    fig: table(head, rows, { caption: 'Somme di due dadi' }),
    prompt: `Si lanciano due dadi. Qual è la probabilità che la somma sia ${target}?`,
    answer: fav / 36,
    traps: [{ value: 1 / 11, msg: 'Le somme da 2 a 12 non sono equiprobabili: conta le coppie nella tabella.' }],
    hint: 'Le coppie possibili sono 36: quante danno quella somma?',
    explain: `Le coppie con somma ${target} sono ${fav} su 36: $$P = \\dfrac{${fav}}{36} = ${frac(fav, 36)}$$`,
    placeholder: 'ad es. 1/6',
    twin: () => dice(rng),
  };
}

function complement(rng) {
  const p = rng.pick([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]);
  const what = scene(rng, 'evento');
  return {
    type: 'number', unit: '%', decimals: 1,
    prompt: `La probabilità che ${what} è del ${Math.round(p * 100)}%. Qual è la probabilità dell'evento contrario?`,
    answer: (1 - p) * 100,
    alts: [1 - p],
    hint: 'Un evento e il suo contrario insieme fanno il 100%.',
    explain: `$$P(\\bar E) = 100\\% - ${Math.round(p * 100)}\\% = ${Math.round((1 - p) * 100)}\\%$$`,
    twin: () => complement(rng),
  };
}

function independent(rng) {
  const kind = rng.pick(['coin', 'die']);
  const n = rng.int(2, 3);
  if (kind === 'coin') {
    const lv = Array(n).fill(['T', 'C']);
    return {
      type: 'number', reduced: true,
      fig: tree(lv),
      prompt: `Si lancia una moneta ${n} volte. Qual è la probabilità di ottenere sempre testa?`,
      answer: 1 / 2 ** n,
      traps: [{ value: 1 / (2 * n), msg: 'Le probabilità di eventi indipendenti si moltiplicano, non si sommano.' }, { value: n / 2, msg: 'La probabilità non può superare 1.' }],
      hint: 'Ogni lancio ha probabilità 1/2: moltiplica.',
      explain: `$$P = ${Array(n).fill('\\dfrac{1}{2}').join('\\cdot ')} = \\dfrac{1}{${2 ** n}}$$ Nell'albero solo un percorso su ${2 ** n} è tutto testa.`,
      placeholder: 'ad es. 1/8',
      twin: () => independent(rng),
    };
  }
  const face = rng.int(1, 6);
  return {
    type: 'number', reduced: true,
    prompt: `Si lancia un dado ${n} volte. Qual è la probabilità di ottenere ${face} ${n === 2 ? 'entrambe le volte' : 'tutte e tre le volte'}?`,
    answer: 1 / 6 ** n,
    traps: [{ value: n / 6, msg: 'Gli eventi sono indipendenti: le probabilità si moltiplicano.' }],
    hint: 'Ogni lancio: 1/6. Moltiplica.',
    explain: `$$P = \\left(\\dfrac{1}{6}\\right)^{${n}} = \\dfrac{1}{${6 ** n}}$$`,
    placeholder: 'ad es. 1/36',
    twin: () => independent(rng),
  };
}

function atLeastOne(rng) {
  const p = rng.pick([0.1, 0.2, 0.3]);
  const n = rng.int(2, 3);
  const val = 1 - (1 - p) ** n;
  return {
    type: 'number', unit: '%', decimals: 1,
    prompt: `Un tiro libero va a segno con probabilità ${Math.round(p * 100)}%. Su ${n} tiri indipendenti, qual è la probabilità di segnarne almeno uno?`,
    answer: val * 100,
    alts: [val],
    traps: [{ value: p * n * 100, msg: 'Sommare le probabilità conta due volte i casi in cui segni più tiri. Passa dal contrario: nessun canestro.' }],
    hint: '"Almeno uno" è il contrario di "nessuno".',
    explain: `$$P(\\text{nessuno}) = ${tx(1 - p)}^{${n}} = ${tx((1 - p) ** n, 3)} \\qquad P(\\text{almeno uno}) = 1 - ${tx((1 - p) ** n, 3)} = ${tx(val, 3)} = ${tx(val * 100, 1)}\\%$$`,
    twin: () => atLeastOne(rng),
  };
}

function fairGame(rng) {
  const target = rng.pick([7, 6, 8, 2, 12]);
  const fav = 6 - Math.abs(7 - target);
  return {
    type: 'choice',
    prompt: `Gioco: lanci due dadi, vinci se esce somma ${target}. Un compagno dice che "è come vincere con una probabilità su 11, perché le somme possibili sono 11". Ha ragione?`,
    options: [
      { label: `No: le 36 coppie sono equiprobabili, la probabilità è ${fav}/36`, correct: true },
      { label: 'Sì: le somme da 2 a 12 sono 11', why: 'Le somme non sono equiprobabili: il 7 si ottiene in 6 modi, il 2 in uno solo.' },
      { label: 'No: la probabilità è 1/6 per qualsiasi somma', why: 'Per una singola faccia di un dado vale 1/6, non per la somma di due dadi.' },
    ],
    explain: `Un argomento ricorrente nelle prove INVALSI: i casi possibili devono essere equiprobabili. Le coppie (dado 1, dado 2) sono 36 e tutte ugualmente probabili; quelle con somma ${target} sono ${fav}.`,
    twin: () => fairGame(rng),
  };
}

export default {
  id: 'probabilita',
  area: 'dati',
  years: [2, 3, 4, 5],
  mat: ['MAT_K4', 'MAT_C3'],
  ambito: 'Dati e previsioni',
  title: 'Probabilità',
  summary: 'Dadi, palline, monete: misurare l\'incertezza.',
  glyph: 'P(E)',
  levels: [
    { name: 'Casi favorevoli', desc: 'Probabilità classica' },
    { name: 'Due dadi e il contrario', desc: 'Tabelle e eventi complementari' },
    { name: 'Eventi indipendenti', desc: 'Alberi e "almeno uno"' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Contare bene', body: 'Se tutti i casi sono ugualmente probabili: $$P = \\dfrac{\\text{casi favorevoli}}{\\text{casi possibili}}$$ La probabilità va da 0 (impossibile) a 1 (certo). Si può scrivere anche in percentuale.' };
    if (level === 1) return [learn, urn(rng), urn(rng), complement(rng), urn(rng), complement(rng)];
    if (level === 2) return [learn, dice(rng), complement(rng), fairGame(rng), dice(rng), urn(rng)];
    return [learn, independent(rng), atLeastOne(rng), independent(rng), atLeastOne(rng), fairGame(rng)];
  },
};

void table;

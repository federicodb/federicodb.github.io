import { scene } from '../contesti.js';
import { it, tx, euro } from '../../js/engine/helpers.js';

// ---------- cursore: il prezzo dopo lo sconto, con la barra del prezzo pieno ----------
function priceBar(P, v, s, solution) {
  const W = 420, x0 = 10, w = 400, paid = (v / P) * w;
  let ticks = '';
  for (let k = 1; k < 10; k++) ticks += `<line x1="${x0 + (k * w) / 10}" y1="34" x2="${x0 + (k * w) / 10}" y2="${k === 5 ? 86 : 78}" class="pb-tick"/>`;
  return `<svg viewBox="0 0 ${W} 120" class="g" role="img" aria-label="Barra del prezzo">
    <rect x="${x0}" y="40" width="${w}" height="40" rx="8" class="pb-full"/>
    <rect x="${x0}" y="40" width="${Math.max(0, paid)}" height="40" rx="8" class="pb-paid${solution ? ' ok' : ''}"/>
    ${ticks}
    <text x="${x0}" y="26" class="g-lbl-sm">0 €</text><text x="${x0 + w}" y="26" class="g-lbl-sm" text-anchor="end">${euro(P)}</text>
    <text x="${x0 + w / 2}" y="108" class="g-lbl-sm" text-anchor="middle">metà</text>
  </svg>`;
}
function sliderDiscount(rng) {
  const s = rng.pick([10, 20, 25, 30, 40, 50]);
  const P = rng.until(() => rng.int(4, 20) * 10, (p) => Number.isInteger((p * s) / 100));
  const ans = (P * (100 - s)) / 100;
  return {
    type: 'slider',
    prompt: `Un giubbotto costa ${euro(P)} ed è scontato del ${s}%. Sposta il cursore sul prezzo che paghi.`,
    min: 0, max: P, step: 1, start: P, answer: ans, tol: 0,
    label: 'Prezzo da pagare', decimals: 0, unit: '€',
    scene: (v, o) => priceBar(P, v, s, o.solution),
    why: (v) => (v === (P * s) / 100 ? 'Questo è lo sconto: il prezzo da pagare è quello che resta.' : v > ans ? 'Paghi ancora troppo.' : 'Troppo poco: lo sconto è solo il ' + s + '%.'),
    hint: `Lo sconto è il ${s}% di ${euro(P)}: ogni tacca della barra è il 10%.`,
    explain: `Sconto: $\\dfrac{${s}}{100}\\cdot ${P} = ${(P * s) / 100}$ €. Prezzo da pagare: $${P} - ${(P * s) / 100} = ${ans}$ €, cioè il $${100 - s}\\%$ del prezzo.`,
    twin: () => sliderDiscount(rng),
  };
}

// ---------- widget: griglia 10×10 per vedere "su cento" ----------
function gridWidget(start) {
  return (el, api) => {
    el.innerHTML = `
      <div class="w-row">
        <svg viewBox="0 0 210 210" class="w-svg w-grid100" role="img" aria-label="Griglia di 100 quadretti"></svg>
        <div class="w-side">
          <p class="w-big" data-out></p>
          <label class="w-slider">Quadretti colorati
            <input type="range" min="0" max="100" value="${start}" aria-label="Percentuale">
          </label>
        </div>
      </div>`;
    const svg = el.querySelector('svg');
    let cells = '';
    for (let i = 0; i < 100; i++) {
      const x = 5 + (i % 10) * 20;
      const y = 5 + Math.floor(i / 10) * 20;
      cells += `<rect x="${x}" y="${y}" width="18" height="18" rx="2" data-i="${i}"/>`;
    }
    svg.innerHTML = cells;
    const out = el.querySelector('[data-out]');
    const input = el.querySelector('input');
    const draw = () => {
      const p = +input.value;
      svg.querySelectorAll('rect').forEach((r) => r.classList.toggle('on', +r.dataset.i < p));
      api.tex(out, `${p}\\% = \\dfrac{${p}}{100} = ${tx(p / 100)}`);
    };
    input.addEventListener('input', draw);
    draw();
  };
}

// ---------- livello 1: percentuale di un numero ----------
const NICE = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75];

function percentOf(rng) {
  const p = rng.pick(NICE);
  // N scelto in modo che il risultato sia intero e N non sia "troppo tondo"
  const N = rng.until(() => rng.int(4, 60) * 10, (n) => (n * p) % 100 === 0 && n % 100 !== 0);
  const ans = (N * p) / 100;
  return {
    type: 'number',
    prompt: `Quanto vale il $${p}\\%$ di $${N}$?`,
    answer: ans,
    traps: [
      { value: N * p, msg: `Hai moltiplicato per ${p}, ma "per cento" vuol dire anche dividere per 100.` },
      { value: N / p, msg: `Hai diviso per ${p}: la percentuale si calcola moltiplicando per ${p} e dividendo per 100.` },
      { value: N - ans, msg: 'Questo è quello che resta togliendo la percentuale, non la percentuale stessa.' },
    ],
    hint: `Trova prima l'1% di ${N} dividendo per 100, poi moltiplica per ${p}.`,
    explain: `$$${p}\\%\\ \\text{di}\\ ${N} = \\dfrac{${p}}{100}\\cdot ${N} = ${ans}$$ L'1% di ${N} è $${tx(N / 100)}$; ${p} volte tanto fa $${ans}$.`,
    twin: () => percentOf(rng),
  };
}

function percentForms(rng) {
  const p = rng.pick([5, 8, 12, 25, 35, 40, 75]);
  return {
    type: 'choice',
    prompt: `Quale di questi numeri è uguale a $${p}\\%$?`,
    options: [
      { label: `$${tx(p / 100)}$`, correct: true },
      { label: `$${tx(p / 10)}$`, why: `$${tx(p / 10)}$ sarebbe $${p * 10}\\%$: hai diviso per 10, non per 100.` },
      { label: `$${p}$`, why: `$${p}$ intero equivale a $${p * 100}\\%$.` },
      { label: `$${tx(p / 1000, 3)}$`, why: 'Hai diviso per 1000: lo zero dopo la virgola è di troppo.' },
    ],
    explain: `$${p}\\% = \\dfrac{${p}}{100} = ${tx(p / 100)}$: dividere per 100 sposta la virgola di due posti a sinistra.`,
    twin: () => percentForms(rng),
  };
}

function percentContext(rng) {
  const g = scene(rng, 'gruppo');
  const p = rng.pick([10, 15, 20, 25, 30, 35, 40]);
  const N = rng.until(() => rng.int(8, 90) * 10, (n) => (n * p) % 100 === 0);
  const ans = (N * p) / 100;
  return {
    type: 'number',
    prompt: `Su ${N} ${g.tot}, il $${p}\\%$ ${g.uno}. ${g.q || 'Quanti sono?'}`,
    answer: ans,
    traps: [{ value: N - ans, msg: 'Hai contato quelli che restano fuori dal gruppo: rileggi la domanda.' }],
    hint: `Calcola $\\dfrac{${p}}{100}\\cdot ${N}$.`,
    explain: `$$\\dfrac{${p}}{100}\\cdot ${N} = ${ans}$$`,
    twin: () => percentContext(rng),
  };
}

// ---------- livello 2: sconti e aumenti ----------
function discount(rng) {
  const s = rng.pick([10, 15, 20, 25, 30, 40]);
  const P = rng.until(() => rng.int(3, 40) * 5, (x) => (x * s) % 100 === 0 && x > 20);
  const off = (P * s) / 100;
  const ans = P - off;
  const item = scene(rng, 'prezzo');
  return {
    type: 'number',
    unit: '€',
    prompt: `${item[0].toUpperCase() + item.slice(1)} costa ${euro(P)} ed è scontato del $${s}\\%$. Quanto si paga?`,
    answer: ans,
    decimals: 2,
    traps: [
      { value: off, msg: `${euro(off)} è lo sconto, cioè quanto risparmi. Ora toglilo dal prezzo.` },
      { value: P - s, msg: `Hai tolto ${s} euro, ma lo sconto è il ${s}% del prezzo, non ${s} euro.` },
      { value: P + off, msg: 'Hai aggiunto lo sconto invece di toglierlo.' },
    ],
    hint: `Si paga il $${100 - s}\\%$ del prezzo.`,
    explain: `Sconto: $\\dfrac{${s}}{100}\\cdot ${P} = ${tx(off)}$ €. Prezzo finale: $${P} - ${tx(off)} = ${tx(ans)}$ €. Più veloce: si paga il $${100 - s}\\%$, cioè $${tx((100 - s) / 100)}\\cdot ${P} = ${tx(ans)}$.`,
    twin: () => discount(rng),
  };
}

function increase(rng) {
  const s = rng.pick([5, 10, 20, 25, 50]);
  const P = rng.until(() => rng.int(4, 60) * 10, (x) => (x * s) % 100 === 0);
  const ans = P * (1 + s / 100);
  const what = scene(rng, 'aumento');
  return {
    type: 'number',
    unit: '€',
    prompt: `${what} costava ${euro(P)} e aumenta del $${s}\\%$. Quanto costa adesso?`,
    answer: ans,
    decimals: 2,
    traps: [
      { value: (P * s) / 100, msg: 'Questo è solo l\'aumento: va aggiunto al prezzo di partenza.' },
      { value: P + s, msg: `Hai aggiunto ${s} euro, ma l'aumento è il ${s}% di ${P}.` },
    ],
    hint: `Dopo l'aumento si paga il $${100 + s}\\%$ del prezzo iniziale.`,
    explain: `$$${P}\\cdot ${tx(1 + s / 100)} = ${tx(ans)}$$ Moltiplicare per $${tx(1 + s / 100)}$ significa tenere il 100% e aggiungere il ${s}%.`,
    twin: () => increase(rng),
  };
}

function upDown(rng) {
  const s = rng.pick([10, 20, 25, 50]);
  const P = rng.pick([100, 200, 80, 400]);
  const up = P * (1 + s / 100);
  const end = up * (1 - s / 100);
  return {
    type: 'choice',
    prompt: `Un prezzo di ${euro(P)} aumenta del $${s}\\%$ e poi cala del $${s}\\%$. Alla fine il prezzo è…`,
    options: [
      { label: `minore di ${euro(P)}`, correct: true },
      { label: `uguale a ${euro(P)}`, why: 'Sembra intuitivo, ma la diminuzione si calcola su un prezzo più alto.' },
      { label: `maggiore di ${euro(P)}`, why: 'Prova a fare i conti passo per passo.' },
    ],
    fixedOrder: true,
    explain: `Dopo l'aumento: ${euro(up)}. Il calo del ${s}% si calcola su ${euro(up)}: $${tx(up)}\\cdot ${tx(1 - s / 100)} = ${tx(end)}$. Le due percentuali non si annullano perché si applicano a numeri diversi.`,
    twin: () => upDown(rng),
  };
}

// ---------- livello 3: trovare la percentuale e il valore iniziale ----------
function whatPercent(rng) {
  const p = rng.pick([4, 5, 8, 12, 15, 20, 24, 35, 45, 60, 64, 85]);
  const total = rng.until(() => rng.int(2, 30) * 25, (t) => (t * p) % 100 === 0);
  const part = (total * p) / 100;
  return {
    type: 'number',
    unit: '%',
    prompt: `In una verifica da ${total} punti hai ottenuto ${part} punti. Che percentuale hai raggiunto?`,
    answer: p,
    traps: [{ value: p / 100, msg: `${it(p / 100)} è il rapporto: per averlo in percentuale moltiplica per 100.` }],
    hint: `Fai $\\dfrac{${part}}{${total}}$ e moltiplica per 100.`,
    explain: `$$\\dfrac{${part}}{${total}} = ${tx(p / 100)} = ${p}\\%$$`,
    twin: () => whatPercent(rng),
  };
}

function originalPrice(rng) {
  const s = rng.pick([10, 20, 25, 40, 50]);
  const P = rng.until(() => rng.int(4, 40) * 10, (x) => (x * s) % 100 === 0);
  const F = P * (1 - s / 100);
  return {
    type: 'number',
    unit: '€',
    prompt: `Dopo uno sconto del $${s}\\%$ hai pagato ${euro(F)}. Quanto costava prima dello sconto?`,
    answer: P,
    decimals: 2,
    traps: [
      { value: F * (1 + s / 100), msg: `Aggiungere il ${s}% a ${euro(F)} non basta: lo sconto era calcolato sul prezzo iniziale, che è più alto.` },
      { value: F + s, msg: 'Hai aggiunto un numero di euro, ma lo sconto era una percentuale.' },
    ],
    hint: `${euro(F)} è il $${100 - s}\\%$ del prezzo iniziale. Dividi per $${tx((100 - s) / 100)}$.`,
    explain: `Se $x$ è il prezzo iniziale: $${tx((100 - s) / 100)}\\,x = ${tx(F)}$, quindi $x = ${tx(F)} : ${tx((100 - s) / 100)} = ${P}$ €. Verifica: il ${s}% di ${P} è ${it((P * s) / 100)}, e $${P} - ${tx((P * s) / 100)} = ${tx(F)}$.`,
    twin: () => originalPrice(rng),
  };
}

export default {
  id: 'percentuali',
  area: 'numeri',
  years: [1, 2],
  mat: ['MAT_K1', 'MAT_C2'],
  ambito: 'Numeri',
  title: 'Percentuali',
  summary: 'Dal "su cento" a sconti, aumenti e prezzi originali.',
  glyph: '%',
  levels: [
    { name: 'Il per cento', desc: 'Calcolare la percentuale di un numero' },
    { name: 'Sconti e aumenti', desc: 'Prezzi finali e trappole classiche' },
    { name: 'Al contrario', desc: 'Trovare la percentuale e il prezzo iniziale' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        {
          type: 'learn',
          title: 'Per cento vuol dire "su cento"',
          body: 'Una percentuale dice quante parti prendi se il tutto è diviso in 100 parti uguali. Muovi il cursore e osserva.',
          widget: gridWidget(rng.pick([12, 25, 35, 60])),
        },
        percentForms(rng),
        percentOf(rng),
        percentOf(rng),
        percentContext(rng),
        percentContext(rng),
      ];
    }
    if (level === 2) {
      return [
        {
          type: 'learn',
          title: 'Lo sconto si toglie, l\'aumento si aggiunge',
          body: 'Uno sconto del $20\\%$ vuol dire pagare il $80\\%$ del prezzo: moltiplicare per $0{,}8$. Un aumento del $20\\%$ vuol dire pagare il $120\\%$: moltiplicare per $1{,}2$.',
        },
        discount(rng),
        increase(rng),
        upDown(rng),
        sliderDiscount(rng),
        increase(rng),
      ];
    }
    return [
      {
        type: 'learn',
        title: 'Tornare indietro',
        body: 'Se dopo uno sconto del $25\\%$ hai pagato $60$ €, quei $60$ € sono il $75\\%$ del prezzo iniziale. Per tornare indietro si divide: $60 : 0{,}75 = 80$ €.',
      },
      whatPercent(rng),
      originalPrice(rng),
      whatPercent(rng),
      originalPrice(rng),
      upDown(rng),
    ];
  },
};

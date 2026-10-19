import { scene } from '../contesti.js';
import { poly, frac, par, euro, tx } from '../../js/engine/helpers.js';
import { plane, table } from '../../js/gfx/svg.js';

function readValue(rng) {
  const m = rng.intNot(-3, 3), q = rng.int(-4, 4);
  const x = rng.int(-3, 3);
  const y = m * x + q;
  if (Math.abs(y) > 7) return readValue(rng);
  return {
    type: 'number',
    fig: plane({ xmin: -5, xmax: 5, ymin: -8, ymax: 8, width: 300, height: 360, fns: [{ f: (t) => m * t + q }], vlines: [{ x, cls: 'g-guide' }], notableExcept: [x] }),
    prompt: `Dal grafico della retta, quanto vale $y$ quando $x = ${x}$?`,
    answer: y,
    hint: 'Sali (o scendi) dalla x fino alla retta, poi leggi la y.',
    explain: `La retta è $y = ${poly([[m, 'x'], [q, '']])}$: per $x = ${x}$ si ha $y = ${m}\\cdot ${par(x)} ${q < 0 ? '-' : '+'} ${Math.abs(q)} = ${y}$.`,
    twin: () => readValue(rng),
  };
}

function interceptSlope(rng) {
  const m = rng.intNot(-3, 3), q = rng.intNot(-4, 4);
  const ask = rng.pick(['q', 'm']);
  return {
    type: 'number',
    fig: plane({ xmin: -5, xmax: 5, ymin: -7, ymax: 7, width: 300, height: 360, fns: [{ f: (t) => m * t + q, notable: ask === 'q' ? ['x'] : ['y'] }], points: [{ x: 0, y: q }, { x: 1, y: m + q }] }),
    prompt: ask === 'q' ? 'Dove la retta taglia l\'asse $y$? Scrivi l\'ordinata $q$.' : 'Qual è il coefficiente angolare $m$ della retta?',
    answer: ask === 'q' ? q : m,
    traps: ask === 'm' ? [{ value: -m, msg: 'Controlla se la retta sale o scende andando verso destra.' }, { value: q, msg: 'Questo è il punto in cui taglia l\'asse y, non la pendenza.' }] : [{ value: -q / m, msg: 'Questo è il punto in cui taglia l\'asse x.' }],
    hint: ask === 'q' ? 'Guarda il punto della retta che sta sull\'asse verticale.' : 'Spostati di 1 a destra: di quanto sale o scende la retta?',
    explain: `La retta è $y = ${poly([[m, 'x'], [q, '']])}$: ${ask === 'q' ? `taglia l'asse y in $(0;\\,${q})$` : `ogni passo a destra la y cambia di $${m}$`}.`,
    twin: () => interceptSlope(rng),
  };
}

function tariff(rng) {
  const T = scene(rng, 'tariffa');
  const fixed = rng.pick(T.fixed), per = rng.pick(T.per);
  const n = T.n[1] >= 100 ? rng.int(T.n[0] / 10, T.n[1] / 10) * 10 : rng.int(T.n[0], T.n[1]);
  const what = [T.s, T.u];
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `${what[0]} costa ${euro(fixed)} fissi più ${euro(per)} per ogni unità (${what[1]}). Quanto si spende per ${n} ${what[1]}?`,
    answer: fixed + per * n,
    traps: [{ value: per * n, msg: 'Manca la quota fissa.' }, { value: (fixed + per) * n, msg: 'La quota fissa si paga una volta sola.' }],
    hint: `Il costo è $y = ${tx(per)}x + ${fixed}$.`,
    explain: `$$y = ${tx(per)}\\cdot ${n} + ${fixed} = ${tx(fixed + per * n)}$$ Il costo è una funzione lineare: $${tx(per)}$ è la pendenza, $${fixed}$ l'ordinata all'origine.`,
    explainFig: plane({ xmin: 0, xmax: n + 4, ymin: 0, ymax: Math.ceil((fixed + per * (n + 4)) / 5) * 5, width: 320, height: 220, fns: [{ f: (x) => fixed + per * x, domain: [0, n + 4] }], points: [{ x: n, y: fixed + per * n, label: `${n}; ${tx(fixed + per * n)}`.replace('{,}', ',') }], xName: 'unità', yName: '€' }),
    twin: () => tariff(rng),
  };
}

function matchGraph(rng) {
  const m = rng.intNot(-3, 3), q = rng.intNot(-3, 3);
  const cands = [[m, q], [-m, q], [m, -q], [q, m]].filter((c, i, arr) => c[0] !== 0 && arr.findIndex((d) => d[0] === c[0] && d[1] === c[1]) === i);
  const opts = rng.shuffle(cands).slice(0, 3);
  if (!opts.some((o) => o[0] === m && o[1] === q)) opts[0] = [m, q];
  return {
    type: 'choice',
    prompt: `Quale grafico rappresenta $y = ${poly([[m, 'x'], [q, '']])}$?`,
    options: opts.map(([mm, qq]) => ({
      label: `<span class="opt-fig">${plane({ xmin: -4, xmax: 4, ymin: -5, ymax: 5, width: 180, height: 200, labels: false, fns: [{ f: (x) => mm * x + qq }], points: [{ x: 0, y: qq, r: 3.5 }] })}</span>`,
      correct: mm === m && qq === q,
      why: mm === m && qq === q ? undefined : mm !== m ? 'La pendenza non è quella giusta: controlla se sale o scende e quanto.' : 'La pendenza va bene, ma il punto sull\'asse y no.',
    })),
    explain: `$q = ${q}$: la retta passa per $(0;\\,${q})$. $m = ${m}$: ${m > 0 ? 'sale' : 'scende'} di ${Math.abs(m)} per ogni passo a destra.`,
    twin: () => matchGraph(rng),
  };
}

function fromTable(rng) {
  const m = rng.intNot(-4, 5), q = rng.int(-6, 6);
  const xs = [0, 1, 2, 3, 4];
  return {
    type: 'expr', vars: ['x'],
    fig: table(['$x$', ...xs.map(String)], [['$y$', ...xs.map((x) => String(m * x + q))]]),
    prompt: 'La tabella descrive una funzione lineare. Scrivi la sua equazione: $y = \\;?$',
    answer: `${m}*x + ${par(q)}`,
    traps: [{ expr: `${q}*x + ${par(m)}`, msg: 'Hai scambiato m e q: q è il valore di y quando x = 0.' }],
    hint: 'Quanto cambia y quando x aumenta di 1? Quanto vale y per x = 0?',
    explain: `Quando $x$ aumenta di 1, $y$ cambia di $${m}$: è la pendenza. Per $x = 0$, $y = ${q}$. Quindi $y = ${poly([[m, 'x'], [q, '']])}$.`,
    placeholder: 'ad es. 2x + 1',
    twin: () => fromTable(rng),
  };
}

export default {
  id: 'funzioni-lineari',
  area: 'rette',
  years: [1, 2],
  mat: ['MAT_K2', 'MAT_A2'],
  ambito: 'Relazioni e funzioni',
  title: 'Funzioni lineari',
  summary: 'Leggere grafici e tabelle, tariffe e costi.',
  glyph: 'y=mx',
  levels: [
    { name: 'Leggere il grafico', desc: 'Valori, pendenza e intercetta' },
    { name: 'Dal grafico all\'equazione', desc: 'Riconoscere y = mx + q' },
    { name: 'Modelli', desc: 'Costi fissi e variabili, tabelle' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Due numeri bastano',
      body: 'In $y = mx + q$, $q$ dice dove la retta taglia l\'asse y, $m$ quanto sale per ogni passo a destra. Muovi i cursori sotto il grafico e osserva.',
      board: {
        bbox: [-6, 6, 6, -6],
        alt: 'Retta y = mx + q con cursori per m e q',
        controls: [
          { id: 'm', label: 'pendenza m', min: -3, max: 3, step: 0.5, value: 1 },
          { id: 'q', label: 'intercetta q', min: -4, max: 4, step: 1, value: 1 },
        ],
        build: (brd, JXG, t, ctl) => {
          brd.create('functiongraph', [(x) => ctl.m() * x + ctl.q()], { strokeColor: t.series[0], strokeWidth: 3 });
          const fmt = (v) => String(+v.toFixed(2)).replace('.', ',').replace('-', '−');
          brd.create('point', [0, () => ctl.q()], { name: '', size: 5, fixed: true, color: t.series[1] });
          brd.create('text', [0.35, () => ctl.q() + (ctl.m() >= 0 ? -0.55 : 0.55), () => `(0; ${fmt(ctl.q())})`], { fontSize: 15, strokeColor: t.text, fixed: true, cssStyle: 'font-weight:700' });
          brd.create('point', [() => (ctl.m() ? -ctl.q() / ctl.m() : NaN), 0], { name: '', size: 4, fixed: true, color: t.series[2] });
          brd.create('text', [() => (ctl.m() && ctl.q() ? -ctl.q() / ctl.m() + (ctl.m() > 0 ? -2.1 : 0.25) : NaN), 0.55, () => (ctl.m() ? `(${fmt(-ctl.q() / ctl.m())}; 0)` : '')], { fontSize: 14, strokeColor: t.text, fixed: true });
        },
      },
      fig: plane({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, width: 280, height: 280, fns: [{ f: (x) => 2 * x - 1, label: 'y = 2x − 1' }], points: [{ x: 0, y: -1, label: 'q = −1' }] }),
      figFallbackOnly: true,
    };
    if (level === 1) return [learn, readValue(rng), interceptSlope(rng), readValue(rng), interceptSlope(rng), readValue(rng)];
    if (level === 2) return [learn, matchGraph(rng), interceptSlope(rng), matchGraph(rng), fromTable(rng), matchGraph(rng)];
    return [learn, tariff(rng), fromTable(rng), tariff(rng), matchGraph(rng), tariff(rng)];
  },
};

void frac;

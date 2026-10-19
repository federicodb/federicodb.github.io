import { poly, par, tx, frac } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

const fig = (a, b, c, pts = []) => {
  const xv = -b / (2 * a), yv = a * xv * xv + b * xv + c;
  const f = (x) => a * x * x + b * x + c;
  const xmin = Math.floor(xv - 5), xmax = Math.ceil(xv + 5);
  const ys = [yv, f(xmin), f(xmax), 0];
  return plane({ xmin, xmax, ymin: Math.floor(Math.max(Math.min(...ys), yv - 25)) - 1, ymax: Math.ceil(Math.min(Math.max(...ys), yv + 25)) + 1, width: 300, height: 260, fns: [{ f }], points: pts });
};

function vertex(rng) {
  const a = rng.intNot(-3, 3), h = rng.int(-5, 5), k = rng.int(-6, 6);
  const b = -2 * a * h, c = a * h * h + k;
  return {
    type: 'numbers', ordered: true,
    cas: { vertex: `${a}*x^2+(${b})*x+(${c})` },
    prompt: `Trova il vertice della parabola $y = ${poly([[a, 'x^2'], [b, 'x'], [c, '']])}$. Scrivi $(x_V;\\,y_V)$.`,
    answers: [h, k],
    traps: [{ values: [-h, k], msg: 'L\'ascissa del vertice è $-\\dfrac{b}{2a}$: attenzione al segno.' }],
    hint: '$x_V = -\\dfrac{b}{2a}$, poi sostituisci per trovare $y_V$.',
    explain: `$$x_V = -\\dfrac{${b}}{2\\cdot ${par(a)}} = ${h} \\qquad y_V = ${a}\\cdot ${par(h)}^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\cdot ${par(h)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${k}$$`,
    explainFig: fig(a, b, c, [{ x: h, y: k, label: `V(${h}; ${k})` }]),
    placeholder: '(x; y)',
    twin: () => vertex(rng),
  };
}

function concavity(rng) {
  const a = rng.intNot(-3, 3), b = rng.int(-6, 6), c = rng.int(-5, 5);
  const opts = [
    { a, b, c, ok: true },
    { a: -a, b: -b, c: -c, why: 'Concavità sbagliata: guarda il segno del coefficiente di x².' },
    { a, b, c: c + (c >= 0 ? -4 : 4), why: 'La parabola deve tagliare l\'asse y in (0; c).' },
  ];
  return {
    type: 'choice',
    prompt: `Quale grafico rappresenta $y = ${poly([[a, 'x^2'], [b, 'x'], [c, '']])}$?`,
    options: rng.shuffle(opts).map((o) => ({ label: `<span class="opt-fig">${plane({ xmin: -5, xmax: 5, ymin: -8, ymax: 8, width: 170, height: 200, labels: false, fns: [{ f: (x) => o.a * x * x + o.b * x + o.c }], points: [{ x: 0, y: o.c, r: 3.5 }] })}</span>`, correct: !!o.ok, why: o.why })),
    explain: `$a = ${a} ${a > 0 ? '> 0' : '< 0'}$: concavità verso ${a > 0 ? 'l\'alto' : 'il basso'}. $c = ${c}$: taglia l'asse y in $(0;\\,${c})$.`,
    twin: () => concavity(rng),
  };
}

function yIntercept(rng) {
  const a = rng.intNot(-3, 3), b = rng.int(-6, 6), c = rng.intNot(-9, 9);
  return {
    type: 'number',
    prompt: `In quale punto la parabola $y = ${poly([[a, 'x^2'], [b, 'x'], [c, '']])}$ taglia l'asse y? Scrivi l'ordinata.`,
    answer: c,
    hint: 'Sull\'asse y vale x = 0.',
    explain: `Per $x = 0$: $y = ${c}$. Il termine noto è sempre l'ordinata del punto sull'asse y.`,
    twin: () => yIntercept(rng),
  };
}

function maxProblem(rng) {
  const kind = rng.pick(['throw', 'revenue']);
  if (kind === 'throw') {
    const v = rng.pick([10, 12, 14, 15, 20]), g = 5;
    const tmax = v / (2 * g), hmax = (v * v) / (4 * g);
    return {
      type: 'number', unit: 'm', decimals: 2,
      prompt: `Una palla lanciata verso l'alto ha altezza $h(t) = ${v}t - ${g}t^2$ (metri, secondi). Qual è l'altezza massima?`,
      answer: hmax,
      traps: [{ value: tmax, msg: 'Questo è l\'istante in cui la palla è più in alto: ora calcola h in quell\'istante.' }],
      hint: 'Il massimo è nel vertice: $t_V = -\\dfrac{b}{2a}$.',
      explain: `$$t_V = \\dfrac{${v}}{${2 * g}} = ${tx(tmax)}\\ \\text{s} \\qquad h(${tx(tmax)}) = ${v}\\cdot ${tx(tmax)} - ${g}\\cdot ${tx(tmax)}^2 = ${tx(hmax)}\\ \\text{m}$$`,
      explainFig: plane({ xmin: 0, xmax: Math.ceil(v / g), ymin: 0, ymax: Math.ceil(hmax) + 2, width: 300, height: 220, fns: [{ f: (t) => v * t - g * t * t, domain: [0, v / g] }], points: [{ x: tmax, y: hmax, label: `${tx(hmax).replace('{,}', ',')} m` }], xName: 't', yName: 'h' }),
      twin: () => maxProblem(rng),
    };
  }
  const p0 = rng.pick([20, 30, 40]), q0 = rng.pick([100, 120, 200]), k = rng.pick([2, 4, 5]);
  // prezzo p, quantità venduta q = q0 - k(p - p0), ricavo R = p q
  const pBest = (q0 + k * p0) / (2 * k);
  if (!Number.isInteger(pBest * 2)) return maxProblem(rng);
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Un negozio vende ${q0} felpe a settimana al prezzo di ${p0} €. Per ogni euro di aumento ne vende ${k} in meno. A quale prezzo il ricavo è massimo?`,
    answer: pBest,
    traps: [{ value: p0, msg: 'Al prezzo attuale il ricavo non è necessariamente il massimo.' }],
    hint: `Con prezzo $p$, vende $${q0} - ${k}(p - ${p0})$ felpe. Ricavo $R(p) = p\\cdot(${q0 + k * p0} - ${k}p)$: una parabola.`,
    explain: `$$R(p) = -${k}p^2 + ${q0 + k * p0}p \\qquad p_V = \\dfrac{${q0 + k * p0}}{2\\cdot ${k}} = ${tx(pBest)}\\ €$$`,
    twin: () => maxProblem(rng),
  };
}

function shift(rng) {
  const h = rng.intNot(-4, 4);
  const k = rng.intNot(-4, 4, [0, h, -h]);
  return {
    type: 'choice',
    prompt: `Come si ottiene il grafico di $y = (x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}$ da quello di $y = x^2$?`,
    options: [
      { label: `Traslando di ${Math.abs(h)} a ${h > 0 ? 'destra' : 'sinistra'} e di ${Math.abs(k)} in ${k > 0 ? 'alto' : 'basso'}`, correct: true },
      { label: `Traslando di ${Math.abs(h)} a ${h > 0 ? 'sinistra' : 'destra'} e di ${Math.abs(k)} in ${k > 0 ? 'alto' : 'basso'}`, why: `Il vertice è dove la parentesi si annulla: $x = ${h}$.` },
      { label: `Traslando di ${Math.abs(k)} a ${k > 0 ? 'destra' : 'sinistra'} e di ${Math.abs(h)} in ${h > 0 ? 'alto' : 'basso'}`, why: 'Il numero dentro la parentesi sposta in orizzontale, quello fuori in verticale.' },
    ],
    explain: `Il vertice passa da $(0;\\,0)$ a $(${h};\\,${k})$.`,
    explainFig: plane({ xmin: -7, xmax: 7, ymin: -6, ymax: 8, width: 280, height: 260, fns: [{ f: (x) => x * x, dash: true }, { f: (x) => (x - h) ** 2 + k, cls: 'g-fn2' }], points: [{ x: h, y: k, label: `(${h}; ${k})` }] }),
    twin: () => shift(rng),
  };
}

export default {
  id: 'parabola',
  area: 'funzioni',
  years: [3],
  mat: ['MAT_K2', 'MAT_K3'],
  ambito: 'Relazioni e funzioni',
  title: 'La parabola',
  summary: 'Vertice, concavità, traslazioni e massimi.',
  glyph: '∪',
  levels: [
    { name: 'Riconoscere', desc: 'Concavità e intersezione con l\'asse y' },
    { name: 'Il vertice', desc: 'Calcolarlo e traslare' },
    { name: 'Massimi e minimi', desc: 'Lanci e ricavi' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Tre coefficienti, una forma',
      body: 'In $y = ax^2 + bx + c$ il segno di $a$ decide se la parabola è rivolta verso l\'alto o verso il basso, $c$ è il punto in cui taglia l\'asse y e il vertice ha ascissa $x_V = -b/(2a)$. Muovi i cursori.',
      board: {
        bbox: [-7, 9, 7, -7],
        alt: 'Parabola con cursori per a, b, c',
        controls: [
          { id: 'a', label: 'a', min: -3, max: 3, step: 0.5, value: 1 },
          { id: 'b', label: 'b', min: -6, max: 6, step: 1, value: 0 },
          { id: 'c', label: 'c', min: -6, max: 6, step: 1, value: -2 },
        ],
        build: (brd, JXG, t, ctl) => {
          brd.create('functiongraph', [(x) => ctl.a() * x * x + ctl.b() * x + ctl.c()], { strokeColor: t.series[0], strokeWidth: 3 });
          const fmt = (v) => String(+v.toFixed(2)).replace('.', ',').replace('-', '−');
          const xv = () => (ctl.a() ? -ctl.b() / (2 * ctl.a()) : 0);
          const yv = () => { const A = ctl.a(), B = ctl.b(), C = ctl.c(); const x = xv(); return A * x * x + B * x + C; };
          brd.create('point', [xv, yv], { name: '', color: t.series[2], size: 5, fixed: true });
          brd.create('text', [() => xv() + 0.3, () => yv() - (ctl.a() >= 0 ? 0.9 : -0.6), () => `V(${fmt(xv())}; ${fmt(yv())})`], { fontSize: 15, strokeColor: t.text, fixed: true, cssStyle: 'font-weight:700' });
          // intersezione con l'asse y (se non coincide con il vertice)
          const onY = () => Math.abs(xv()) > 1e-9;
          brd.create('point', [() => (onY() ? 0 : NaN), () => ctl.c()], { name: '', color: t.series[1], size: 4, fixed: true });
          brd.create('text', [() => (onY() ? 0.3 : NaN), () => ctl.c() + 0.6, () => `(0; ${fmt(ctl.c())})`], { fontSize: 14, strokeColor: t.text, fixed: true });
          // intersezioni con l'asse x: x = (−b ± √Δ) / 2a
          const root = (sg) => { const A = ctl.a(), B = ctl.b(), C = ctl.c(); const D = B * B - 4 * A * C; if (!A || D < 0) return NaN; return (-B + sg * Math.sqrt(D)) / (2 * A); };
          for (const sg of [-1, 1]) {
            brd.create('point', [() => root(sg), 0], { name: '', color: t.series[3], size: 4, fixed: true });
            brd.create('text', [() => root(sg) + (sg * Math.sign(ctl.a() || 1) < 0 ? -2.3 : 0.25), 0.7, () => (Number.isFinite(root(sg)) && Math.abs(root(-1) - root(1)) > 1e-9 ? `(${fmt(root(sg))}; 0)` : '')], { fontSize: 14, strokeColor: t.text, fixed: true });
          }
        },
      },
      fig: fig(1, -2, -3, [{ x: 1, y: -4, label: 'V(1; −4)' }]),
      figFallbackOnly: true,
    };
    if (level === 1) return [learn, concavity(rng), yIntercept(rng), concavity(rng), shift(rng), concavity(rng)];
    if (level === 2) return [learn, vertex(rng), shift(rng), vertex(rng), concavity(rng), vertex(rng)];
    return [learn, maxProblem(rng), vertex(rng), maxProblem(rng), maxProblem(rng), shift(rng)];
  },
};

void frac;

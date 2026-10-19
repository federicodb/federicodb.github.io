import { frac, poly, par, gcd } from '../../js/engine/helpers.js';
import { plane } from '../../js/gfx/svg.js';

const N = 6; // piano da -6 a 6

/** Piano cartesiano con punti trascinabili (agganciati ai quadretti). */
function planeWidget({ A, B, dragA = true, dragB = true, target = null, onUpdate }) {
  return (el, api) => {
    el.innerHTML = `
      <div class="w-row">
        <svg class="w-svg w-plane" viewBox="${-N - 0.5} ${-N - 0.5} ${2 * N + 1} ${2 * N + 1}" role="application"
          aria-label="Piano cartesiano: trascina i punti oppure selezionali e usa le frecce"></svg>
        <div class="w-side"><p class="w-big" data-out></p><p class="w-help" data-help></p></div>
      </div>`;
    const svg = el.querySelector('svg');
    const out = el.querySelector('[data-out]');
    const help = el.querySelector('[data-help]');
    const pts = { A: { ...A, drag: dragA }, B: { ...B, drag: dragB } };
    let grid = '';
    for (let i = -N; i <= N; i++) {
      grid += `<line x1="${i}" y1="${-N}" x2="${i}" y2="${N}" class="${i === 0 ? 'axis' : ''}"/>`;
      grid += `<line x1="${-N}" y1="${i}" x2="${N}" y2="${i}" class="${i === 0 ? 'axis' : ''}"/>`;
    }
    svg.innerHTML = `<g class="w-gridlines">${grid}</g><g data-dyn></g>`;
    const dyn = svg.querySelector('[data-dyn]');
    const clamp = (v) => Math.max(-N, Math.min(N, v));

    function draw() {
      const { A: a, B: b } = pts;
      let line = '';
      if (a.x !== b.x || a.y !== b.y) {
        // retta estesa ai bordi
        const dx = b.x - a.x, dy = b.y - a.y;
        const t = 30;
        line = `<line class="w-line" x1="${a.x - dx * t}" y1="${-(a.y - dy * t)}" x2="${a.x + dx * t}" y2="${-(a.y + dy * t)}"/>`;
        // triangolo dello spostamento: prima orizzontale, poi verticale
        line += `<polyline class="w-run" points="${a.x},${-a.y} ${b.x},${-a.y}"/>`;
        line += `<polyline class="w-rise" points="${b.x},${-a.y} ${b.x},${-b.y}"/>`;
      }
      const dot = (p, id) =>
        `<g class="w-pt ${p.drag ? 'drag' : ''}" data-p="${id}" ${p.drag ? `tabindex="0" role="slider" aria-label="Punto ${id}: ${p.x}, ${p.y}"` : ''}>
          <circle cx="${p.x}" cy="${-p.y}" r="${p.drag ? 0.42 : 0.28}"/>
          <text x="${p.x + 0.45}" y="${-p.y - 0.45}">${id}</text></g>`;
      dyn.innerHTML = line + dot(a, 'A') + dot(b, 'B');
      const dx = b.x - a.x, dy = b.y - a.y;
      if (dx === 0 && dy === 0) api.tex(out, 'A = B');
      else if (dx === 0) api.tex(out, `\\Delta x = 0:\\ \\text{retta verticale}`);
      else {
        const raw = `\\dfrac{${dy}}{${dx}}`;
        const red = frac(dy, dx);
        api.tex(out, `m = \\dfrac{\\Delta y}{\\Delta x} = ${raw}${red === raw ? '' : ' = ' + red}`);
      }
      help.textContent = `A(${a.x}; ${a.y})   B(${b.x}; ${b.y})`;
      onUpdate?.(pts, api);
      bind();
    }

    let dragging = null;
    const toPlane = (ev) => {
      const r = svg.getBoundingClientRect();
      const s = (2 * N + 1) / r.width;
      return { x: clamp(Math.round((ev.clientX - r.left) * s - N - 0.5)), y: clamp(-Math.round((ev.clientY - r.top) * s - N - 0.5)) };
    };
    function bind() {
      dyn.querySelectorAll('.w-pt.drag').forEach((g) => {
        g.addEventListener('pointerdown', (ev) => {
          dragging = g.dataset.p;
          svg.setPointerCapture(ev.pointerId);
          ev.preventDefault();
        });
        g.addEventListener('keydown', (ev) => {
          const p = pts[g.dataset.p];
          const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
          if (!moves[ev.key]) return;
          ev.preventDefault();
          p.x = clamp(p.x + moves[ev.key][0]);
          p.y = clamp(p.y + moves[ev.key][1]);
          draw();
          dyn.querySelector(`[data-p="${g.dataset.p}"]`)?.focus();
        });
      });
    }
    svg.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const q = toPlane(ev);
      const p = pts[dragging];
      if (q.x !== p.x || q.y !== p.y) { p.x = q.x; p.y = q.y; draw(); }
    });
    svg.addEventListener('pointerup', () => (dragging = null));
    svg.addEventListener('pointercancel', () => (dragging = null));
    draw();

    if (target) {
      return {
        check() {
          const { A: a, B: b } = pts;
          const dx = b.x - a.x, dy = b.y - a.y;
          if (dx === 0) return { ok: false, message: 'Con $\\Delta x = 0$ la retta è verticale e la pendenza non esiste. Sposta B a destra o a sinistra.' };
          const ok = dy * target.d === target.n * dx;
          if (ok) return { ok: true, message: `Esatto: $\\dfrac{${dy}}{${dx}} = ${frac(target.n, target.d)}$.` };
          if (dy * target.d === -target.n * dx) return { ok: false, message: 'La pendenza ha il valore giusto ma il segno sbagliato: la tua retta va nella direzione opposta.' };
          if (dx * target.d === target.n * dy) return { ok: false, message: 'Hai scambiato Δx e Δy: la pendenza è "quanto sale" diviso "quanto avanza".' };
          return { ok: false, message: `La tua pendenza è $${frac(dy, dx)}$, non $${frac(target.n, target.d)}$.` };
        },
      };
    }
  };
}

function twoPoints(rng, { integer }) {
  return rng.until(
    () => {
      const A = { x: rng.int(-5, 4), y: rng.int(-5, 5) };
      const B = { x: rng.int(-5, 5), y: rng.int(-5, 5) };
      return { A, B, dx: B.x - A.x, dy: B.y - A.y };
    },
    (v) =>
      v.dx !== 0 && v.dy !== 0 && Math.abs(v.dx) >= 1 &&
      (integer ? v.dy % v.dx === 0 && Math.abs(v.dy / v.dx) <= 4 : v.dy % v.dx !== 0 && Math.abs(v.dx) <= 6),
  );
}

function slopeNumber(rng, integer) {
  const { A, B, dx, dy } = twoPoints(rng, { integer });
  const m = dy / dx;
  const traps = [{ value: -m, msg: 'Il valore è giusto ma il segno no. Calcola le differenze sempre nello stesso ordine: B meno A sopra e sotto.' }];
  if (dy !== 0) traps.push({ value: dx / dy, msg: 'Hai capovolto la frazione: sopra va la differenza delle y, sotto quella delle x.' });
  return {
    type: 'number',
    fig: plane({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, width: 300, height: 300, points: [{ x: A.x, y: A.y, label: 'A' }, { x: B.x, y: B.y, label: 'B' }] }),
    prompt: `Qual è il coefficiente angolare della retta che passa per $A(${A.x};\\,${A.y})$ e $B(${B.x};\\,${B.y})$?${integer ? '' : ' Puoi rispondere con una frazione, ad esempio 2/3.'}`,
    answer: m,
    traps,
    hint: '$m = \\dfrac{y_B - y_A}{x_B - x_A}$',
    explain: `$$m = \\dfrac{${B.y} - ${par(A.y)}}{${B.x} - ${par(A.x)}} = \\dfrac{${dy}}{${dx}} = ${frac(dy, dx)}$$`,
    twin: () => slopeNumber(rng, integer),
  };
}

function upOrDown(rng) {
  const { A, B, dx, dy } = twoPoints(rng, { integer: rng.chance(0.5) });
  const up = dy / dx > 0;
  return {
    type: 'choice',
    prompt: `Percorrendo da sinistra a destra la retta per $A(${A.x};\\,${A.y})$ e $B(${B.x};\\,${B.y})$, la retta…`,
    options: [
      { label: 'sale', correct: up, why: up ? undefined : 'Guarda il punto più a destra: ha la y più bassa o più alta?' },
      { label: 'scende', correct: !up, why: !up ? undefined : 'Guarda il punto più a destra: ha la y più bassa o più alta?' },
    ],
    fixedOrder: true,
    explain: `$m = \\dfrac{${dy}}{${dx}}$ è ${up ? 'positivo: la retta sale' : 'negativo: la retta scende'}. Il segno di $m$ dice da che parte va la retta.`,
    twin: () => upOrDown(rng),
  };
}

function dragToSlope(rng) {
  const target = rng.until(
    () => {
      const d = rng.int(1, 4);
      const n = rng.intNot(-4, 4);
      const g = gcd(n, d);
      return { n: n / g, d: d / g };
    },
    (t) => t.d <= 3,
  );
  const A = { x: rng.int(-3, 0), y: rng.int(-2, 1) };
  return {
    type: 'widget',
    prompt: `Trascina il punto $B$ in modo che la retta $AB$ abbia coefficiente angolare $m = ${frac(target.n, target.d)}$. Puoi anche selezionare B e usare le frecce.`,
    widget: planeWidget({ A, B: { x: A.x + 2, y: A.y }, dragA: false, target }),
    explain: `Da $A$ si avanza di $${target.d}$ ${target.d === 1 ? 'quadretto' : 'quadretti'} a destra e si ${target.n > 0 ? 'sale' : 'scende'} di $${Math.abs(target.n)}$. Vanno bene anche i multipli: $${2 * target.d}$ a destra e $${2 * Math.abs(target.n)}$ ${target.n > 0 ? 'su' : 'giù'}.`,
    twin: () => dragToSlope(rng),
  };
}

function lineEquation(rng) {
  const v = rng.until(
    () => {
      const m = rng.intNot(-3, 3);
      const q = rng.intNot(-5, 5);
      const x1 = rng.int(-3, 2);
      const x2 = x1 + rng.int(1, 3);
      return { m, q, A: { x: x1, y: m * x1 + q }, B: { x: x2, y: m * x2 + q } };
    },
    (v) => Math.abs(v.A.y) <= 6 && Math.abs(v.B.y) <= 6 && v.A.x !== 0,
  );
  const { m, q, A, B } = v;
  return {
    type: 'expr',
    vars: ['x'],
    prompt: `Scrivi l'equazione della retta per $A(${A.x};\\,${A.y})$ e $B(${B.x};\\,${B.y})$. $$y = \\;?$$`,
    answer: `${m}*x + ${par(q)}`,
    traps: [
      { expr: `${m}*x`, msg: 'La pendenza è giusta, ma la retta non passa per l\'origine: manca q.' },
      { expr: `${-m}*x + ${par(q)}`, msg: 'Controlla il segno della pendenza.' },
      { expr: `${m}*x + ${par(A.y)}`, msg: `q non è la y di A: è il valore di y quando x = 0. Usa $${A.y} = ${m}\\cdot${par(A.x)} + q$.` },
    ],
    hint: 'Prima trova $m$ con i due punti, poi sostituisci le coordinate di A in $y = mx + q$ e ricava $q$.',
    explain: `$$m = \\dfrac{${B.y} - ${par(A.y)}}{${B.x} - ${par(A.x)}} = ${m}$$ $$${A.y} = ${m}\\cdot ${par(A.x)} + q \\;\\Rightarrow\\; q = ${q}$$ $$y = ${poly([[m, 'x'], [q, '']])}$$`,
    placeholder: 'ad es. 2x - 1',
    twin: () => lineEquation(rng),
  };
}

function parallel(rng) {
  const m = rng.intNot(-4, 4);
  const q1 = rng.int(-5, 5);
  const q2 = rng.intNot(-5, 5, [q1]);
  const s3 = rng.intNot(-5, 5, [0, m, -m, m + 1, m - 1]);
  return {
    type: 'choice',
    prompt: `Quale retta è parallela a $y = ${poly([[m, 'x'], [q1, '']])}$?`,
    options: rng.shuffle([
      { label: `$y = ${poly([[m, 'x'], [q2, '']])}$`, correct: true },
      { label: `$y = ${poly([[-m, 'x'], [q1, '']])}$`, why: 'Pendenza opposta: le due rette si incrociano.' },
      { label: `$y = ${poly([[s3, 'x'], [m, '']])}$`, why: 'Il numero che conta per il parallelismo è il coefficiente della x, non il termine noto.' },
      { label: `$y = ${poly([[m + (m > 0 ? 1 : -1), 'x'], [q1, '']])}$`, why: 'Pendenze diverse, anche di poco: prima o poi le rette si incontrano.' },
    ]),
    explain: `Due rette sono parallele quando hanno lo stesso coefficiente angolare: qui $m = ${m}$. Il termine noto sposta la retta in su o in giù senza inclinarla.`,
    twin: () => parallel(rng),
  };
}

export default {
  id: 'retta-pendenza',
  area: 'rette',
  years: [1, 2],
  mat: ['MAT_K3', 'MAT_K2'],
  ambito: 'Relazioni e funzioni',
  title: 'Pendenza di una retta',
  summary: 'Quanto sale, quanto avanza: il coefficiente angolare.',
  glyph: 'm',
  levels: [
    { name: 'Sale o scende', desc: 'Pendenza intera da due punti' },
    { name: 'Pendenze frazionarie', desc: 'Costruire una retta con una pendenza data' },
    { name: 'L\'equazione', desc: 'Da due punti a y = mx + q' },
  ],
  generate(rng, level) {
    const A = { x: -2, y: -1 };
    const learn = {
      type: 'learn',
      title: 'Quanto sali per ogni passo in avanti',
      body: 'Trascina i punti $A$ e $B$. Il coefficiente angolare $m$ confronta lo spostamento verticale $\\Delta y$ con quello orizzontale $\\Delta x$.',
      widget: planeWidget({ A, B: { x: rng.int(1, 3), y: rng.int(1, 4) } }),
    };
    if (level === 1) return [learn, upOrDown(rng), slopeNumber(rng, true), slopeNumber(rng, true), upOrDown(rng), slopeNumber(rng, true)];
    if (level === 2) return [learn, slopeNumber(rng, false), dragToSlope(rng), slopeNumber(rng, false), dragToSlope(rng), slopeNumber(rng, false)];
    return [learn, slopeNumber(rng, false), lineEquation(rng), parallel(rng), lineEquation(rng), lineEquation(rng)];
  },
};

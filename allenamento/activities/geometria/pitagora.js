import { TRIPLES, tx, it } from '../../js/engine/helpers.js';
import { polygon } from '../../js/gfx/svg.js';

// ---------- widget: quadrati costruiti sui lati ----------
function squaresWidget(a0, b0) {
  return (el, api) => {
    el.innerHTML = `
      <div class="w-row">
        <svg class="w-svg w-pyth" role="img" aria-label="Triangolo rettangolo con i quadrati costruiti sui lati"></svg>
        <div class="w-side">
          <label class="w-slider"><span>Cateto $a = $ <output data-a></output></span>
            <input type="range" min="1" max="9" value="${a0}" data-ia aria-label="Cateto a"></label>
          <label class="w-slider"><span>Cateto $b = $ <output data-b></output></span>
            <input type="range" min="1" max="9" value="${b0}" data-ib aria-label="Cateto b"></label>
          <p class="w-big" data-out></p>
        </div>
      </div>`;
    el.querySelectorAll('label').forEach((l) => api.renderMath(l));
    const svg = el.querySelector('svg');
    const ia = el.querySelector('[data-ia]');
    const ib = el.querySelector('[data-ib]');
    const out = el.querySelector('[data-out]');
    const draw = () => {
      const a = +ia.value;
      const b = +ib.value;
      el.querySelector('[data-a]').textContent = a;
      el.querySelector('[data-b]').textContent = b;
      const c2 = a * a + b * b;
      // coordinate matematiche (y verso l'alto), poi ribaltate
      const P = (x, y) => `${x},${-y}`;
      const grid = (x0, y0, w, h) => {
        let g = '';
        for (let i = 1; i < w; i++) g += `<line x1="${x0 + i}" y1="${-y0}" x2="${x0 + i}" y2="${-(y0 + h)}"/>`;
        for (let j = 1; j < h; j++) g += `<line x1="${x0}" y1="${-(y0 + j)}" x2="${x0 + w}" y2="${-(y0 + j)}"/>`;
        return g;
      };
      const sqA = [P(0, 0), P(a, 0), P(a, -a), P(0, -a)].join(' ');
      const sqB = [P(0, 0), P(0, b), P(-b, b), P(-b, 0)].join(' ');
      const sqC = [P(a, 0), P(0, b), P(b, a + b), P(a + b, a)].join(' ');
      const minX = -b - 0.6, maxX = a + b + 0.6, minY = -(a + b) - 0.6, maxY = a + 0.6;
      svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
      svg.innerHTML = `
        <g class="w-sq w-sq-a"><polygon points="${sqA}"/><g class="w-gridlines">${grid(0, -a, a, a)}</g>
          <text x="${a / 2}" y="${a / 2}" class="w-lbl">${a * a}</text></g>
        <g class="w-sq w-sq-b"><polygon points="${sqB}"/><g class="w-gridlines">${grid(-b, 0, b, b)}</g>
          <text x="${-b / 2}" y="${-b / 2}" class="w-lbl">${b * b}</text></g>
        <g class="w-sq w-sq-c"><polygon points="${sqC}"/>
          <text x="${(a + b) / 2}" y="${-(a + b) / 2}" class="w-lbl">${c2}</text></g>
        <polygon class="w-tri" points="${P(0, 0)} ${P(a, 0)} ${P(0, b)}"/>
        <polyline class="w-right" points="${P(0, 0.6)} ${P(0.6, 0.6)} ${P(0.6, 0)}"/>`;
      svg.querySelectorAll('.w-lbl').forEach((t) => t.setAttribute('font-size', Math.max(0.7, (a + b) / 9)));
      const c = Math.sqrt(c2);
      api.tex(out, `${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c2} \\;\\Rightarrow\\; c = ${Number.isInteger(c) ? c : '\\sqrt{' + c2 + '}\\approx ' + tx(c, 2)}`);
    };
    ia.addEventListener('input', draw);
    ib.addEventListener('input', draw);
    draw();
  };
}

function scaledTriple(rng, maxC = 100) {
  return rng.until(
    () => {
      const t = rng.pick(TRIPLES);
      const k = rng.int(1, 6);
      const [a, b] = rng.shuffle([t[0], t[1]]);
      return { a: a * k, b: b * k, c: t[2] * k };
    },
    (v) => v.c <= maxC && v.c >= 10,
  );
}

function hypotenuse(rng) {
  const { a, b, c } = scaledTriple(rng);
  const unit = rng.pick(['cm', 'm', 'dm']);
  return {
    type: 'number',
    unit,
    fig: polygon({ pts: [[0, 0], [a, 0], [0, b]], sides: [`${a} ${unit}`, '?', `${b} ${unit}`], right: [0], alt: `Triangolo rettangolo con cateti ${a} e ${b}` }),
    cas: { eval: `sqrt(${a}^2+${b}^2)` },
    prompt: `In un triangolo rettangolo i cateti misurano ${a} ${unit} e ${b} ${unit}. Quanto misura l'ipotenusa?`,
    answer: c,
    traps: [
      { value: a + b, msg: 'I lati non si sommano direttamente: si sommano le aree dei quadrati costruiti sui cateti.' },
      { value: a * a + b * b, msg: `${a * a + b * b} è l'area del quadrato sull'ipotenusa. Il lato è la sua radice quadrata.` },
    ],
    hint: `Calcola $${a}^2 + ${b}^2$ e poi la radice quadrata.`,
    explain: `$$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${c * c}} = ${c}$$`,
    twin: () => hypotenuse(rng),
  };
}

function leg(rng) {
  const { a, b, c } = scaledTriple(rng);
  const unit = rng.pick(['cm', 'm']);
  return {
    type: 'number',
    unit,
    fig: polygon({ pts: [[0, 0], [a, 0], [0, b]], sides: [`${a} ${unit}`, `${c} ${unit}`, '?'], right: [0], alt: `Triangolo rettangolo con ipotenusa ${c} e cateto ${a}` }),
    cas: { eval: `sqrt(${c}^2-${a}^2)` },
    prompt: `L'ipotenusa di un triangolo rettangolo misura ${c} ${unit} e un cateto ${a} ${unit}. Quanto misura l'altro cateto?`,
    answer: b,
    traps: [
      { value: c - a, msg: 'Non si sottraggono i lati ma le aree dei quadrati: $c^2 - a^2$.' },
      { value: c * c - a * a, msg: `${c * c - a * a} è l'area del quadrato sul cateto: manca la radice quadrata.` },
    ],
    hint: `Il quadrato sull'ipotenusa è la somma degli altri due: togli $${a}^2$ da $${c}^2$.`,
    explain: `$$b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c} - ${a * a}} = \\sqrt{${b * b}} = ${b}$$`,
    twin: () => leg(rng),
  };
}

function whichHyp(rng) {
  const { a, b, c } = scaledTriple(rng, 60);
  return {
    type: 'choice',
    prompt: `I lati di un triangolo rettangolo misurano ${a}, ${b} e ${c}. Quale è l'ipotenusa?`,
    options: rng.shuffle([
      { label: String(c), correct: true },
      { label: String(a), why: 'L\'ipotenusa è il lato opposto all\'angolo retto, ed è sempre il più lungo.' },
      { label: String(b), why: 'L\'ipotenusa è il lato opposto all\'angolo retto, ed è sempre il più lungo.' },
    ]),
    explain: `L'ipotenusa è il lato più lungo: $${c}$. Infatti $${a}^2 + ${b}^2 = ${a * a + b * b} = ${c}^2$.`,
    twin: () => whichHyp(rng),
  };
}

function isRight(rng) {
  const { a, b, c } = scaledTriple(rng, 50);
  const right = rng.chance(0.5);
  const C = right ? c : c + rng.pick([-1, 1]);
  const sum = a * a + b * b;
  return {
    type: 'choice',
    prompt: `Un triangolo ha i lati di ${a}, ${b} e ${C} cm. È rettangolo?`,
    options: [
      { label: 'Sì', correct: right, why: right ? undefined : `$${a}^2 + ${b}^2 = ${sum}$ ma $${C}^2 = ${C * C}$: non sono uguali.` },
      { label: 'No', correct: !right, why: right ? `Controlla: $${a}^2 + ${b}^2 = ${sum} = ${C}^2$.` : undefined },
    ],
    fixedOrder: true,
    explain: right
      ? `$${a}^2 + ${b}^2 = ${sum}$ e $${C}^2 = ${C * C}$: sono uguali, quindi vale il teorema e il triangolo è rettangolo.`
      : `$${a}^2 + ${b}^2 = ${sum}$, mentre $${C}^2 = ${C * C}$. Basta una differenza di 1 cm perché l'angolo non sia più retto.`,
    twin: () => isRight(rng),
  };
}

// terne pitagoriche "travestite" (anche con i decimali): il conto torna sempre a mente
function realWorld(rng) {
  const kind = rng.pick(['ladder', 'tv', 'ramp']);
  if (kind === 'ladder') {
    const [d, h, L] = rng.pick([[1.5, 2, 2.5], [1.8, 2.4, 3], [2.4, 3.2, 4], [1.2, 3.5, 3.7], [0.9, 4, 4.1], [1, 2.4, 2.6], [1.5, 3.6, 3.9], [1.2, 1.6, 2]]);
    return {
      type: 'number',
      unit: 'm',
      decimals: 2,
      prompt: `Una scala lunga ${it(L)} m è appoggiata a un muro, con la base a ${it(d)} m dal muro. A che altezza arriva?`,
      answer: h,
      traps: [{ value: Math.sqrt(L * L + d * d), msg: 'La scala è l\'ipotenusa: l\'altezza è un cateto, quindi si sottrae.' }],
      hint: `La scala è l'ipotenusa: $h^2 = ${tx(L)}^2 - ${tx(d)}^2$.`,
      explain: `$$h = \\sqrt{${tx(L)}^2 - ${tx(d)}^2} = \\sqrt{${tx(L * L)} - ${tx(d * d)}} = \\sqrt{${tx(h * h)}} = ${tx(h)}\\ \\text{m}$$`,
      cas: { eval: `sqrt(${L}^2-${d}^2)` },
      twin: () => realWorld(rng),
    };
  }
  if (kind === 'tv') {
    const k = rng.pick([10, 12, 14, 15, 16, 20]);
    const w = 4 * k, hgt = 3 * k, diag = 5 * k;
    return {
      type: 'number',
      unit: 'cm',
      prompt: `Lo schermo di un monitor in formato 4:3 è largo ${w} cm e alto ${hgt} cm. Quanto misura la diagonale?`,
      answer: diag,
      traps: [{ value: w + hgt, msg: 'La diagonale non è la somma dei lati: è l\'ipotenusa del triangolo che ha i lati come cateti.' }],
      hint: `${w} e ${hgt} sono 4 e 3 moltiplicati per ${k}: ricordi la terna 3, 4, 5?`,
      explain: `$$d = \\sqrt{${w}^2 + ${hgt}^2} = \\sqrt{${w * w + hgt * hgt}} = ${diag}\\ \\text{cm}$$ È la terna 3, 4, 5 moltiplicata per ${k} (circa ${it(diag / 2.54, 0)} pollici).`,
      cas: { eval: `sqrt(${w}^2+${hgt}^2)` },
      twin: () => realWorld(rng),
    };
  }
  const [rise, base, len] = rng.pick([[0.5, 1.2, 1.3], [0.9, 4, 4.1], [1.1, 6, 6.1], [0.8, 1.5, 1.7], [0.6, 0.8, 1]]);
  return {
    type: 'number',
    unit: 'm',
    decimals: 2,
    prompt: `Una rampa lunga ${it(len)} m supera un dislivello di ${it(rise)} m. Quanto spazio occupa in orizzontale?`,
    answer: base,
    traps: [{ value: Math.sqrt(len * len + rise * rise), msg: 'La rampa è l\'ipotenusa: lo spazio orizzontale è un cateto.' }],
    hint: `Rampa = ipotenusa: $b^2 = ${tx(len)}^2 - ${tx(rise)}^2$.`,
    explain: `$$\\sqrt{${tx(len)}^2 - ${tx(rise)}^2} = \\sqrt{${tx(len * len)} - ${tx(rise * rise)}} = \\sqrt{${tx(base * base)}} = ${tx(base)}\\ \\text{m}$$ La pendenza è $${tx(rise)} : ${tx(base)} \\approx ${it((rise / base) * 100, 1)}\\%$.`,
    cas: { eval: `sqrt(${len}^2-${rise}^2)` },
    twin: () => realWorld(rng),
  };
}

export default {
  id: 'pitagora',
  area: 'geometria',
  years: [1, 2],
  mat: ['MAT_K3', 'MAT_A4', 'MAT_C4'],
  ambito: 'Spazio e figure',
  title: 'Il teorema di Pitagora',
  summary: 'Quadrati sui lati, ipotenuse e cateti, misure reali.',
  glyph: 'a²+b²',
  levels: [
    { name: 'Trovare l\'ipotenusa', desc: 'Con terne pitagoriche intere' },
    { name: 'Trovare un cateto', desc: 'E riconoscere i triangoli rettangoli' },
    { name: 'Nel mondo reale', desc: 'Scale, schermi e rampe' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Aree che si sommano',
      body: 'In un triangolo rettangolo, il quadrato costruito sull\'ipotenusa ha la stessa area dei due quadrati costruiti sui cateti messi insieme. Cambia i cateti e conta i quadretti.',
      widget: squaresWidget(rng.pick([3, 4, 6]), rng.pick([4, 3, 8])),
    };
    if (level === 1) return [learn, whichHyp(rng), hypotenuse(rng), hypotenuse(rng), hypotenuse(rng), whichHyp(rng)];
    if (level === 2) return [learn, leg(rng), isRight(rng), leg(rng), isRight(rng), leg(rng)];
    return [learn, realWorld(rng), isRight(rng), realWorld(rng), leg(rng), realWorld(rng)];
  },
};

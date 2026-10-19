import { TRIPLES, tx, frac } from '../../js/engine/helpers.js';
import { polygon } from '../../js/gfx/svg.js';

const rad = (d) => (d * Math.PI) / 180;

function ratios(rng) {
  const t = rng.pick(TRIPLES.slice(0, 5));
  const k = rng.int(1, 3);
  const [a, b, c] = [t[0] * k, t[1] * k, t[2] * k];
  const fn = rng.pick(['sin', 'cos', 'tan']);
  const val = { sin: a / c, cos: b / c, tan: a / b }[fn];
  const name = { sin: 'seno', cos: 'coseno', tan: 'tangente' }[fn];
  return {
    type: 'number',
    reduced: true,
    fig: polygon({ pts: [[0, 0], [b, 0], [b, a]], sides: [`${b}`, `${a}`, `${c}`], vertices: ['α', '', ''], right: [1], width: 280, height: 200 }),
    prompt: `Nel triangolo rettangolo in figura, quanto vale il ${name} dell'angolo $\\alpha$? Scrivilo come frazione ridotta.`,
    answer: val,
    traps: [
      { value: { sin: b / c, cos: a / c, tan: b / a }[fn], msg: fn === 'tan' ? 'Tangente = cateto opposto : cateto adiacente.' : 'Hai scambiato cateto opposto e adiacente.' },
      { value: { sin: c / a, cos: c / b, tan: b / a }[fn], msg: 'La frazione è capovolta.' },
    ],
    hint: { sin: 'Seno = cateto opposto : ipotenusa', cos: 'Coseno = cateto adiacente : ipotenusa', tan: 'Tangente = cateto opposto : cateto adiacente' }[fn],
    explain: `$$\\${fn} \\alpha = ${{ sin: frac(a, c), cos: frac(b, c), tan: frac(a, b) }[fn]}$$ Il cateto opposto ad $\\alpha$ è ${a}, quello adiacente ${b}, l'ipotenusa ${c}.`,
    placeholder: 'ad es. 3/5',
    twin: () => ratios(rng),
  };
}

// angoli notevoli: sin 30° = 0,5; cos 30° ≈ 0,87; sin 45° ≈ 0,71 — conti a mente
function findSide(rng) {
  const [ang, which, k] = rng.pick([[30, 'opp', 0.5], [60, 'adj', 0.5], [30, 'adj', 0.87], [60, 'opp', 0.87], [45, 'opp', 0.71], [45, 'adj', 0.71]]);
  const hyp = k === 0.5 ? rng.pick([2, 3, 4, 5, 6, 8, 10, 12]) : rng.pick([2, 3, 5, 10, 20]);
  const val = hyp * k;
  const exact = which === 'opp' ? hyp * Math.sin(rad(ang)) : hyp * Math.cos(rad(ang));
  const s = Math.sin(rad(ang)), c = Math.cos(rad(ang));
  const fn = which === 'opp' ? 'sin' : 'cos';
  return {
    type: 'number', unit: 'm', decimals: 2,
    fig: polygon({ pts: [[0, 0], [c * 10, 0], [c * 10, s * 10]], sides: [which === 'adj' ? '?' : '', which === 'opp' ? '?' : '', `${hyp} m`], vertices: [`${ang}°`, '', ''], right: [1], width: 280, height: 200 }),
    prompt: `Una rampa lunga ${hyp} m è inclinata di ${ang}° rispetto al suolo. ${which === 'opp' ? 'A che altezza arriva' : 'Quanto spazio occupa in orizzontale'}? ${k === 0.5 ? '' : `Usa $\\${fn}\\,${ang}° \\approx ${tx(k)}$.`}`,
    answer: val,
    alts: [exact],
    traps: [{ value: which === 'opp' ? hyp * c : hyp * s, msg: which === 'opp' ? 'Il cateto opposto all\'angolo si trova con il seno, non con il coseno.' : 'Il cateto adiacente all\'angolo si trova con il coseno, non con il seno.' }].filter((t) => Math.abs(t.value - val) > 0.05),
    hint: which === 'opp' ? 'Cateto opposto = ipotenusa × seno dell\'angolo' : 'Cateto adiacente = ipotenusa × coseno dell\'angolo',
    explain: `$$${which === 'opp' ? 'h' : 'd'} = ${hyp}\\cdot\\${fn}\\,${ang}° ${k === 0.5 ? '=' : '\\approx'} ${hyp}\\cdot ${tx(k)} = ${tx(val)}\\ \\text{m}$$${k === 0.5 ? ' Nel mezzo triangolo equilatero il cateto opposto ai 30° è metà dell\'ipotenusa.' : ''}`,
    twin: () => findSide(rng),
  };
}

function notable(rng) {
  const rows = [
    { a: 30, sin: '\\dfrac{1}{2}', cos: '\\dfrac{\\sqrt{3}}{2}', sv: 0.5 },
    { a: 45, sin: '\\dfrac{\\sqrt{2}}{2}', cos: '\\dfrac{\\sqrt{2}}{2}', sv: Math.SQRT1_2 },
    { a: 60, sin: '\\dfrac{\\sqrt{3}}{2}', cos: '\\dfrac{1}{2}', sv: Math.sqrt(3) / 2 },
  ];
  const r = rng.pick(rows);
  const fn = rng.pick(['sin', 'cos']);
  const right = r[fn];
  const all = ['\\dfrac{1}{2}', '\\dfrac{\\sqrt{2}}{2}', '\\dfrac{\\sqrt{3}}{2}', '1'];
  return {
    type: 'choice',
    prompt: `Quanto vale $\\${fn}\\,${r.a}°$?`,
    options: all.map((v) => ({ label: `$${v}$`, correct: v === right, why: v === right ? undefined : v === '1' ? `Il ${fn === 'sin' ? 'seno' : 'coseno'} vale 1 solo a ${fn === 'sin' ? '90°' : '0°'}.` : 'Ripensa al triangolo equilatero tagliato a metà (30° e 60°) o al quadrato tagliato dalla diagonale (45°).' })),
    fixedOrder: true,
    explain: `$$\\${fn}\\,${r.a}° = ${right}$$ ${r.a === 45 ? 'Nel triangolo rettangolo isoscele i cateti sono uguali.' : 'Nel mezzo triangolo equilatero il cateto minore è metà dell\'ipotenusa.'}`,
    twin: () => notable(rng),
  };
}

function angleFromSlope(rng) {
  const [pct, deg] = rng.pick([[10, 6], [20, 11], [50, 27], [100, 45]]);
  const opts = [
    { label: `circa ${deg}°`, correct: true },
    { label: `${pct}°`, why: 'La pendenza in percentuale non è l\'angolo in gradi: confronta dislivello e distanza.' },
    { label: pct === 100 ? 'circa 90°' : `circa ${deg * 3}°`, why: pct === 100 ? 'A 90° la strada sarebbe un muro verticale: il 100% vuol dire salire 100 m ogni 100 m.' : 'Troppo ripida: prova a disegnare il triangolo con i cateti.' },
  ];
  return {
    type: 'choice',
    fig: polygon({ pts: [[0, 0], [100, 0], [100, pct]], sides: ['100 m', `${pct} m`, ''], vertices: ['α', '', ''], right: [1], width: 280, height: pct === 100 ? 220 : 140 }),
    prompt: `Un cartello stradale indica una salita del ${pct}%: si sale di ${pct} m ogni 100 m in orizzontale. Di quanti gradi è inclinata la strada?`,
    options: opts,
    explain: `$\\tan\\alpha = \\dfrac{${pct}}{100}$${pct === 100 ? ': i due cateti sono uguali, quindi $\\alpha = 45°$.' : `, da cui $\\alpha \\approx ${deg}°$.`} Una salita del ${pct}% è molto meno ripida di ${pct}°.`,
    twin: () => angleFromSlope(rng),
  };
}

export default {
  id: 'trigonometria',
  area: 'geometria',
  years: [3, 4],
  mat: ['MAT_K3', 'MAT_C4'],
  ambito: 'Spazio e figure',
  title: 'Trigonometria del triangolo rettangolo',
  summary: 'Seno, coseno e tangente per rampe, scale e pendenze.',
  glyph: 'sin',
  levels: [
    { name: 'Rapporti tra lati', desc: 'Seno, coseno, tangente' },
    { name: 'Angoli notevoli', desc: '30°, 45°, 60°' },
    { name: 'Nella realtà', desc: 'Rampe, strade e pendenze' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Rapporti che dipendono solo dall\'angolo', body: 'In tutti i triangoli rettangoli con lo stesso angolo $\\alpha$ i rapporti tra i lati sono uguali (sono simili). Questi rapporti si chiamano seno, coseno e tangente di $\\alpha$.', fig: polygon({ pts: [[0, 0], [4, 0], [4, 3]], sides: ['adiacente', 'opposto', 'ipotenusa'], vertices: ['α', '', ''], right: [1], width: 300, height: 200 }) };
    if (level === 1) return [learn, ratios(rng), ratios(rng), ratios(rng), notable(rng), ratios(rng)];
    if (level === 2) return [learn, notable(rng), ratios(rng), notable(rng), findSide(rng), notable(rng)];
    return [learn, findSide(rng), angleFromSlope(rng), findSide(rng), angleFromSlope(rng), findSide(rng)];
  },
};

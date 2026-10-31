import { perClasse } from '../contesti.js';
import { tx } from '../../js/engine/helpers.js';
import { polygon, table } from '../../js/gfx/svg.js';

// Successione "alla Fibonacci" che parte da a, b: ogni termine è la somma dei due precedenti
function seq(a, b, n) {
  const s = [a, b];
  while (s.length < n) s.push(s[s.length - 1] + s[s.length - 2]);
  return s;
}
const FIB = seq(1, 1, 12); // 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144
const isFib = (s) => s.every((v, i) => i < 2 || v === s[i - 1] + s[i - 2]);
const list = (s) => s.join(',\\ ');

/** Quadrati di lato 1, 1, 2, 3, 5… accostati a spirale: formano un rettangolo F(n) × F(n+1) */
function squaresFig(n) {
  let w = 1, h = 1;
  const extra = [];
  for (let i = 1; i < n; i++) {
    if (i % 2) { extra.push({ seg: [[w, 0], [w, h]] }); w += FIB[i]; }
    else { extra.push({ seg: [[0, h], [w, h]] }); h += FIB[i]; }
  }
  return polygon({ pts: [[0, 0], [w, 0], [w, h], [0, h]], extra, sides: [String(w), String(h), '', ''], alt: `Quadrati di lato ${FIB.slice(0, n).join(', ')} che formano un rettangolo ${Math.min(w, h)} per ${Math.max(w, h)}` });
}

function start(rng) {
  const [lo, hi] = perClasse({ 1: [1, 5], 3: [2, 9] });
  return [rng.int(lo, hi), rng.int(lo, hi)];
}

function nextTerm(rng) {
  const [a, b] = start(rng);
  // dalla terza: due passi avanti, senza che il termine intermedio sia scritto
  const passi = perClasse({ 1: 1, 3: 2 });
  const s = seq(a, b, 5 + passi);
  const shown = s.slice(0, 5), ans = s[s.length - 1];
  const [p, l] = shown.slice(-2);
  return {
    type: 'number',
    prompt: passi === 1
      ? `Ogni numero è la somma dei due precedenti. Qual è il prossimo? $$${list(shown)},\\ ?$$`
      : `Ogni numero è la somma dei due precedenti. Quale numero viene <b>due posti</b> dopo l'ultimo? $$${list(shown)},\\ \\_\\_,\\ ?$$`,
    answer: ans,
    traps: passi === 1 ? [{ value: 2 * l - p, msg: `Non si aggiunge sempre ${l - p}: si sommano gli ultimi due numeri.` }] : [{ value: l + p, msg: `Questo è il numero subito dopo: ne manca ancora uno.` }],
    hint: passi === 1 ? `Somma gli ultimi due: $${p} + ${l}$.` : `Prima trova il numero subito dopo ($${p} + ${l}$), poi quello successivo.`,
    explain: passi === 1 ? `$$${p} + ${l} = ${ans}$$` : `$$${p} + ${l} = ${p + l}, \\qquad ${l} + ${p + l} = ${ans}$$`,
    cas: { eval: passi === 1 ? `${p}+${l}` : `${l}+(${p}+${l})` },
    twin: () => nextTerm(rng),
  };
}

function missingMiddle(rng) {
  const [a, b] = start(rng);
  const s = seq(a, b, 6);
  const pos = rng.pick([2, 3]);
  const shown = s.map((v, i) => (i === pos ? '?' : v));
  return {
    type: 'number',
    prompt: `Ogni numero è la somma dei due precedenti. Quale numero manca? $$${list(shown)}$$`,
    answer: s[pos],
    traps: [{ value: s[pos - 1] + s[pos + 1], msg: 'Il numero che manca, sommato a quello prima, deve dare quello dopo.' }],
    hint: `Il numero che manca più $${s[pos - 1]}$ fa $${s[pos + 1]}$.`,
    explain: `$$${s[pos + 1]} - ${s[pos - 1]} = ${s[pos]}$$ Controllo: $${s[pos - 1]} + ${s[pos]} = ${s[pos + 1]}$ e $${s[pos]} + ${s[pos + 1]} = ${s[pos + 2]}$.`,
    cas: { eval: `${s[pos + 1]}-${s[pos - 1]}` },
    twin: () => missingMiddle(rng),
  };
}

/** Riconoscere lo schema: quali successioni sono "alla Fibonacci"? */
function binsFib(rng) {
  const impostori = [
    () => { const a = rng.int(1, 6), d = rng.int(2, 5); return Array.from({ length: 5 }, (_, i) => a + d * i); },
    () => { const a = rng.int(1, 4); return Array.from({ length: 5 }, (_, i) => a * 2 ** i); },
    () => { const [a, b] = start(rng); const s = [a, b]; while (s.length < 5) s.push(s[s.length - 1] + s[s.length - 2] + 1); return s; },
    () => { const s = seq(...start(rng), 5); s[4] += rng.pick([-1, 1]); return s; },
  ];
  const items = rng.until(
    () => [
      ...Array.from({ length: 3 }, () => ({ s: seq(...start(rng), 5), bin: 'si' })),
      ...rng.shuffle(impostori).slice(0, 3).map((g) => ({ s: g(), bin: 'no' })),
    ],
    (v) => v.every((x) => isFib(x.s) === (x.bin === 'si')) && new Set(v.map((x) => x.s.join())).size === v.length,
  );
  return {
    type: 'bins',
    prompt: 'In quali successioni ogni numero è la somma dei due precedenti?',
    bins: [{ id: 'si', label: 'Sì, sempre' }, { id: 'no', label: 'No' }],
    items: items.map((x) => ({ label: `$${list(x.s)}$`, bin: x.bin })),
    hint: 'Controlla ogni numero dal terzo in poi, non solo il primo: basta un numero sbagliato.',
    explain: 'Dal terzo numero in poi ognuno deve essere la somma dei due prima. Le altre crescono aggiungendo sempre lo stesso numero, raddoppiando, aggiungendo 1 in più oppure hanno un solo numero fuori posto.',
    twin: () => binsFib(rng),
  };
}

function tfFib(rng) {
  const tutte = [
    { text: 'Ogni tre numeri ce n\'è uno pari ($2,\\ 8,\\ 34,\\ 144\\dots$)', value: true },
    { text: 'Sono tutti numeri dispari', value: false },
    { text: 'Dopo $21$ viene $34$', value: true },
    { text: 'Dopo $13$ viene $26$', value: false },
    { text: 'Dal terzo in poi, ogni numero è maggiore del precedente', value: true },
    { text: 'Ogni numero è il doppio del precedente', value: false },
  ];
  return {
    type: 'truefalse',
    prompt: `La successione di Fibonacci: $$${list(FIB.slice(0, 10))},\\ \\dots$$`,
    statements: rng.shuffle(tutte).slice(0, 4),
    explain: 'Si va avanti sommando gli ultimi due: $13 + 21 = 34$. Pari e dispari si alternano così: dispari, dispari, pari, dispari, dispari, pari… perché dispari + dispari = pari, dispari + pari = dispari.',
    twin: () => tfFib(rng),
  };
}

function backwards(rng) {
  // prima: due numeri della vera successione, uno indietro; dalla terza: successione qualunque, due indietro
  const indietro = perClasse({ 1: 1, 3: 2 });
  const s = indietro === 1 ? FIB.slice(0, rng.int(5, 10)) : seq(...start(rng), 6);
  const [p, l] = s.slice(-2);
  const ans = s[s.length - 1 - indietro - 1];
  return {
    type: 'number',
    prompt: indietro === 1
      ? `In una successione ogni numero è la somma dei due precedenti. Due numeri consecutivi sono $${p}$ e $${l}$. Quale numero viene <b>prima</b> di $${p}$?`
      : `In una successione ogni numero è la somma dei due precedenti. Due numeri consecutivi sono $${p}$ e $${l}$. Quale numero viene <b>due posti prima</b> di $${p}$?`,
    answer: ans,
    traps: [{ value: p + l, msg: 'Questo è il numero dopo: qui si torna indietro.' }],
    hint: indietro === 1 ? `Il numero prima, sommato a $${p}$, dà $${l}$.` : `Prima trova il numero subito prima di $${p}$: $${l} - ${p}$. Poi ripeti.`,
    explain: indietro === 1
      ? `$$${l} - ${p} = ${ans}$$ Controllo: $${ans} + ${p} = ${l}$.`
      : `$$${l} - ${p} = ${l - p}, \\qquad ${p} - ${l - p} = ${ans}$$ Controllo: $${ans} + ${l - p} = ${p}$.`,
    cas: { eval: indietro === 1 ? `${l}-${p}` : `${p}-(${l}-${p})` },
    twin: () => backwards(rng),
  };
}

/** I quadrati di Fibonacci: l'area del rettangolo è la somma delle aree dei quadrati */
function squaresArea(rng) {
  const n = rng.int(...perClasse({ 1: [4, 5], 3: [5, 6] }));
  const lati = FIB.slice(0, n), w = FIB[n - 1], h = FIB[n];
  const area = w * h, somma = lati.map((x) => `${x}^2`).join(' + ');
  const chiediSomma = perClasse({ 1: false, 3: true });
  return {
    type: 'number',
    fig: squaresFig(n),
    prompt: chiediSomma
      ? `I quadrati di lato $${lati.join(',\\ ')}$ formano il rettangolo della figura. Quanto fa, senza calcolare ogni quadrato, $$${somma}\\ ?$$`
      : `I quadrati di lato $${lati.join(',\\ ')}$ formano il rettangolo della figura. Qual è l'area del rettangolo?`,
    answer: area,
    traps: [{ value: 2 * (w + h), msg: 'Questo è il perimetro: serve l\'area.' }],
    hint: chiediSomma ? 'Ogni addendo è l\'area di un quadrato: insieme coprono tutto il rettangolo.' : `Il rettangolo misura $${w}$ per $${h}$.`,
    explain: `$$${w}\\cdot ${h} = ${area}$$ Ed è anche la somma delle aree dei quadrati: $${somma} = ${area}$.`,
    cas: { eval: lati.map((x) => `${x}^2`).join('+') },
    twin: () => squaresArea(rng),
  };
}

function sumTerms(rng) {
  const n = rng.int(...perClasse({ 1: [5, 6], 3: [6, 8] }));
  const termini = FIB.slice(0, n), ans = FIB[n + 1] - 1;
  return {
    type: 'number',
    prompt: `Quanto fa la somma dei primi ${n} numeri di Fibonacci? $$${termini.join(' + ')}$$`,
    answer: ans,
    traps: [{ value: FIB[n + 1], msg: 'Quasi: c\'è un 1 di troppo.' }],
    hint: `Guarda il numero che viene due posti dopo $${FIB[n - 1]}$ nella successione.`,
    explain: `$$${termini.join(' + ')} = ${ans} = ${FIB[n + 1]} - 1$$ Vale sempre: la somma dei primi numeri è il numero due posti dopo l'ultimo, meno 1.`,
    cas: { eval: termini.join('+') },
    twin: () => sumTerms(rng),
  };
}

/** I rapporti tra numeri consecutivi si avvicinano a φ, saltando sopra e sotto */
function ratioChoice(rng) {
  // dalla terza: anche partendo da due numeri qualunque si arriva allo stesso valore
  const s = perClasse({ 1: () => FIB.slice(0, 8), 3: () => seq(...start(rng), 8) })();
  const righe = s.slice(1).map((v, i) => [`$${v} : ${s[i]}$`, `$${tx(v / s[i], 3)}$`]).slice(1);
  return {
    type: 'choice',
    fig: table(['Rapporto', 'Valore'], righe),
    prompt: `Divido ogni numero di $${list(s)}$ per quello prima. Come si comportano i rapporti?`,
    options: [
      { label: 'Si avvicinano a un numero vicino a 1,62, saltando un po\' sopra e un po\' sotto', correct: true },
      { label: 'Crescono sempre', why: 'Guarda la colonna dei valori: salgono e scendono.' },
      { label: 'Diminuiscono sempre', why: 'Guarda la colonna dei valori: salgono e scendono.' },
      { label: 'Si avvicinano a 2', why: 'Gli ultimi valori restano vicini a 1,62, lontani da 2.' },
    ],
    explain: 'I rapporti si avvicinano sempre di più a $\\varphi = \\dfrac{1+\\sqrt5}{2} \\approx 1{,}618$, il <b>rapporto aureo</b>, una volta per eccesso e una per difetto. Succede qualunque siano i due numeri di partenza.',
    twin: () => ratioChoice(rng),
  };
}

function ratioNumber(rng) {
  const [num, den] = rng.pick([[3, 2], [8, 5], [13, 8]]);
  return {
    type: 'number', decimals: 3,
    prompt: `Quanto fa $${num} : ${den}$? Scrivi il risultato con la virgola.`,
    answer: num / den,
    hint: den === 8 ? `$${num} : 8$: metà di metà di metà. Oppure $1/8 = 0{,}125$.` : `$${num} : ${den}$: $1/${den} = ${tx(1 / den, 3)}$.`,
    explain: `$$${num} : ${den} = ${tx(num / den, 3)}$$ È già vicino a $\\varphi \\approx 1{,}618$: più avanti si va nella successione, più ci si avvicina.`,
    cas: { eval: `${num}/${den}` },
    twin: () => ratioNumber(rng),
  };
}

function placeRatio(rng) {
  const [label, tex, v] = rng.pick([['φ', '\\varphi', (1 + Math.sqrt(5)) / 2], ['5/3', '\\dfrac{5}{3}', 5 / 3], ['8/5', '\\dfrac{8}{5}', 1.6], ['13/8', '\\dfrac{13}{8}', 13 / 8]]);
  return {
    type: 'place',
    prompt: `Dove si trova $${tex}$ sulla retta?`,
    min: 1, max: 2, snap: 0.01, tol: 0.06,
    ticks: [{ v: 1, label: '1' }, { v: 1.5, major: false }, { v: 2, label: '2' }],
    answer: v, answerLabel: `${label} ≈ ${tx(v, 3).replace('{,}', ',')}`,
    label: `Posizione di ${label}`,
    hint: 'Il segno piccolo è 1,5. Il valore è un po\' più grande.',
    explain: `$${tex} \\approx ${tx(v, 3)}$: poco oltre la metà tra 1 e 2.`,
    twin: () => placeRatio(rng),
  };
}

/** Rettangolo aureo: lato lungo ≈ 1,6 × lato corto */
function goldenRect(rng) {
  const corto = rng.pick([5, 10, 15, 20, 25, 30]), lungo = corto * 1.6;
  const inverso = perClasse({ 1: false, 3: rng.chance(0.5) });
  return {
    type: 'number', unit: 'cm',
    prompt: inverso
      ? `Un grafico disegna un riquadro con le proporzioni del rettangolo aureo. Il lato lungo misura ${lungo} cm. Quanto misura il lato corto? (Usa $\\varphi \\approx 1{,}6$.)`
      : `Un grafico disegna un riquadro con le proporzioni del rettangolo aureo. Il lato corto misura ${corto} cm. Quanto misura il lato lungo? (Usa $\\varphi \\approx 1{,}6$.)`,
    answer: inverso ? corto : lungo,
    traps: inverso ? [{ value: lungo / 2, msg: 'Non è la metà: si divide per 1,6.' }] : [{ value: corto * 2, msg: 'Non è il doppio: si moltiplica per 1,6.' }],
    hint: inverso ? `Quale numero, per 1,6, fa ${lungo}? Prova con i multipli di 5.` : `${corto} per 1,6: ${corto} più ${corto} per 0,6.`,
    explain: inverso ? `$$${lungo} : 1{,}6 = ${corto}\\ \\text{cm}$$` : `$$${corto}\\cdot 1{,}6 = ${corto} + ${tx(corto * 0.6)} = ${lungo}\\ \\text{cm}$$`,
    cas: { eval: inverso ? `${lungo}/1.6` : `${corto}*1.6` },
    twin: () => goldenRect(rng),
  };
}

function tfPhi(rng) {
  const tutte = [
    { text: '$\\varphi^2 = \\varphi + 1$', value: true },
    { text: '$\\dfrac{1}{\\varphi} = \\varphi - 1$', value: true },
    { text: '$\\varphi$ si può scrivere come frazione di due numeri interi', value: false },
    { text: '$\\dfrac{13}{8}$ è esattamente uguale a $\\varphi$', value: false },
    { text: '$\\varphi$ è compreso tra $1{,}6$ e $1{,}7$', value: true },
  ];
  return {
    type: 'truefalse',
    prompt: 'Il rapporto aureo $\\varphi = \\dfrac{1+\\sqrt5}{2} \\approx 1{,}618$:',
    statements: rng.shuffle(tutte).slice(0, 4),
    explain: '$\\varphi$ è la soluzione positiva di $x^2 = x + 1$; dividendo per $\\varphi$ si ottiene $\\varphi = 1 + \\dfrac{1}{\\varphi}$. Contiene $\\sqrt5$, quindi è irrazionale: $\\dfrac{13}{8} = 1{,}625$ ci va vicino, ma nessuna frazione lo raggiunge.',
    twin: () => tfPhi(rng),
  };
}

export default {
  id: 'fibonacci',
  area: 'numeri',
  years: [1, 2],
  mat: ['MAT_K1', 'MAT_K3'],
  ambito: 'Numeri',
  title: 'Successione di Fibonacci e rapporto aureo',
  summary: 'Somme che si ripetono, quadrati a spirale e il numero φ.',
  glyph: 'φ',
  levels: [
    { name: 'La regola', desc: 'Ogni numero è la somma dei due precedenti' },
    { name: 'Schemi nascosti', desc: 'Andare all\'indietro, quadrati e somme' },
    { name: 'Il rapporto aureo', desc: 'Rapporti, φ e rettangoli aurei' },
  ],
  generate(rng, level) {
    if (level === 1) return [{ type: 'learn', title: 'Somma gli ultimi due', body: `$$${list(FIB.slice(0, 10))},\\ \\dots$$ Dal terzo in poi, ogni numero è la somma dei due precedenti: $5 + 8 = 13$. Leonardo Fibonacci la descrisse nel 1202 contando coppie di conigli.` }, nextTerm(rng), missingMiddle(rng), binsFib(rng), nextTerm(rng), tfFib(rng)];
    if (level === 2) return [{ type: 'learn', title: 'Quadrati a spirale', body: 'Accostando quadrati di lato $1, 1, 2, 3, 5, 8$ si forma sempre un rettangolo: i suoi lati sono due numeri consecutivi della successione.', fig: squaresFig(6) }, backwards(rng), squaresArea(rng), sumTerms(rng), backwards(rng), squaresArea(rng)];
    return [{ type: 'learn', title: 'Il numero aureo', body: 'Dividendo un numero della successione per quello prima: $8 : 5 = 1{,}6$, $13 : 8 = 1{,}625$, $21 : 13 \\approx 1{,}615$… I rapporti si avvicinano a $$\\varphi = \\frac{1+\\sqrt5}{2} \\approx 1{,}618$$' }, ratioChoice(rng), ratioNumber(rng), placeRatio(rng), goldenRect(rng), tfPhi(rng)];
  },
};

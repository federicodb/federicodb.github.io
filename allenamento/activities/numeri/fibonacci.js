import { perClasse } from '../contesti.js';
import { polygon } from '../../js/gfx/svg.js';

// Successione "alla Fibonacci" che parte da a, b: ogni termine è la somma dei due precedenti
export function seq(a, b, n) {
  const s = [a, b];
  while (s.length < n) s.push(s[s.length - 1] + s[s.length - 2]);
  return s;
}
export const FIB = seq(1, 1, 15); // 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610
const isFib = (s) => s.every((v, i) => i < 2 || v === s[i - 1] + s[i - 2]);
export const list = (s) => s.join(',\\ ');

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

/** Due numeri di partenza: piccoli in prima, qualunque (ma sempre da calcolo a mente) dalla terza */
export function start(rng) {
  const [lo, hi] = perClasse({ 1: [1, 5], 3: [2, 9] });
  return [rng.int(lo, hi), rng.int(lo, hi)];
}

// ---------------------------------------------------------------- livello 1: la regola

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
    traps: passi === 1 ? [{ value: 2 * l - p, msg: `Non si aggiunge sempre ${l - p}: si sommano gli ultimi due numeri.` }] : [{ value: l + p, msg: 'Questo è il numero subito dopo: ne manca ancora uno.' }],
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

// ---------------------------------------------------------------- livello 2: quadrati e somme

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

/** La successione dei quadrati: due quadrati vicini sommati danno ancora un numero di Fibonacci */
function squaresPair(rng) {
  const i = rng.pick(perClasse({ 1: [2, 3], 3: [4, 5] }));
  const p = FIB[i], q = FIB[i + 1], ans = FIB[2 * i + 2];
  return {
    type: 'number',
    prompt: `La successione dei quadrati: $$${list(FIB.slice(0, 8).map((x) => x * x))},\\ \\dots$$ Quanto fa la somma di due quadrati vicini, $${p}^2 + ${q}^2$?`,
    answer: ans,
    traps: [{ value: (p + q) ** 2, msg: `Questo è $(${p} + ${q})^2$: qui si sommano i due quadrati.` }],
    hint: `$${p}^2 = ${p * p}$ e $${q}^2 = ${q * q}$.`,
    explain: `$$${p}^2 + ${q}^2 = ${p * p} + ${q * q} = ${ans}$$ E $${ans}$ è di nuovo un numero di Fibonacci: la somma dei quadrati di due vicini cade sempre nella successione, più avanti.`,
    cas: { eval: `${p}^2+${q}^2` },
    twin: () => squaresPair(rng),
  };
}

// ---------------------------------------------------------------- livello 3: invarianti

/** Identità di Cassini: (precedente × successivo) − quadrato vale sempre +1 o −1, a segni alterni */
function cassini(rng) {
  // prima: la vera successione, fino a numeri da calcolare a mente; dalla terza: anche lontano, solo per schema,
  //        oppure una successione qualunque (il valore non è più 1, ma resta lo stesso a segni alterni)
  const tipo = perClasse({ 1: 'vicino', 3: rng.pick(['lontano', 'qualunque']) });
  const s = tipo === 'qualunque' ? seq(...start(rng), 9) : FIB;
  const val = (j) => s[j - 1] * s[j + 1] - s[j] * s[j];
  const j0 = tipo === 'vicino' ? rng.int(1, 3) : 1;
  const j = tipo === 'vicino' ? j0 + 2 : rng.int(5, 7);
  const ex = [j0, j0 + 1].map((k) => `$$${s[k - 1]}\\cdot ${s[k + 1]} - ${s[k]}^2 = ${val(k)}$$`).join('');
  const ans = val(j);
  return {
    type: 'number',
    prompt: `${tipo === 'qualunque' ? `Nella successione $${list(s.slice(0, 6))},\\ \\dots$` : 'Nella successione di Fibonacci'} moltiplico i due vicini di un numero e tolgo il suo quadrato: ${ex}${tipo === 'vicino' ? 'Quanto fa' : 'Senza fare i conti: quanto fa'} $$${s[j - 1]}\\cdot ${s[j + 1]} - ${s[j]}^2\\ ?$$`,
    answer: ans,
    traps: ans ? [{ value: -ans, msg: 'Il numero è giusto ma il segno no: a ogni passo il segno si inverte.' }] : [],
    hint: tipo === 'vicino' ? `$${s[j - 1]}\\cdot ${s[j + 1]} = ${s[j - 1] * s[j + 1]}$ e $${s[j]}^2 = ${s[j] * s[j]}$.` : 'Il valore non cambia, cambia solo il segno a ogni passo: conta i passi dal primo esempio.',
    explain: `$$${s[j - 1]}\\cdot ${s[j + 1]} - ${s[j]}^2 = ${s[j - 1] * s[j + 1]} - ${s[j] * s[j]} = ${ans}$$ È un <b>invariante</b>: andando avanti nella successione il risultato resta ${Math.abs(ans)}, con il segno che si alterna (identità di Cassini, 1680).`,
    cas: { eval: `${s[j - 1]}*${s[j + 1]}-${s[j]}^2` },
    twin: () => cassini(rng),
  };
}

/** Il trucco del mago: la somma di 10 numeri consecutivi è 11 volte il settimo */
function trick11(rng) {
  const [a, b] = start(rng);
  const s = seq(a, b, 10), ans = 11 * s[6];
  return {
    type: 'number',
    prompt: `Ogni numero è la somma dei due precedenti. Quanto fa la somma di tutti e dieci? $$${list(s)}$$`,
    answer: ans,
    traps: [{ value: ans - s[9], msg: 'Manca l\'ultimo numero.' }],
    hint: 'C\'è un trucco da mago: guarda il settimo numero e moltiplicalo per 11.',
    explain: `Il settimo numero è $${s[6]}$: $$${s[6]}\\cdot 11 = ${ans}$$ Funziona sempre. Se i primi due sono $a$ e $b$, i dieci numeri sommati fanno $55a + 88b = 11\\,(5a + 8b)$, e $5a + 8b$ è proprio il settimo.`,
    cas: { eval: s.join('+') },
    twin: () => trick11(rng),
  };
}

/** Divisibilità a posti fissi: per 3 un numero ogni 4, per 5 un numero ogni 5 */
function binsDivisible(rng) {
  const d = rng.pick([3, 5]);
  const candidati = FIB.slice(2);
  const si = candidati.filter((v) => v % d === 0), no = rng.shuffle(candidati.filter((v) => v % d)).slice(0, 3);
  return {
    type: 'bins',
    prompt: `Questi numeri di Fibonacci sono divisibili per ${d}?`,
    bins: [{ id: 'si', label: `Divisibile per ${d}` }, { id: 'no', label: 'No' }],
    items: rng.shuffle([...si.map((v) => ({ label: `$${v}$`, bin: 'si' })), ...no.map((v) => ({ label: `$${v}$`, bin: 'no' }))]),
    hint: d === 3 ? 'Somma le cifre: se la somma è divisibile per 3, lo è anche il numero.' : 'Divisibile per 5 se finisce con 0 o 5.',
    explain: `Divisibili per ${d}: $${si.join(',\\ ')}$. Nella successione cadono a posti fissi: ${d === 3 ? 'uno ogni 4 numeri (il 4°, l\'8°, il 12°)' : 'uno ogni 5 numeri (il 5°, il 10°, il 15°)'}.`,
    twin: () => binsDivisible(rng),
  };
}

export default {
  id: 'fibonacci',
  area: 'numeri',
  years: [1, 2],
  mat: ['MAT_K1', 'MAT_K3'],
  ambito: 'Numeri',
  title: 'Successione di Fibonacci',
  summary: 'La regola, i quadrati a spirale e i numeri che non cambiano mai.',
  glyph: '1·1·2',
  levels: [
    { name: 'La regola', desc: 'Ogni numero è la somma dei due precedenti' },
    { name: 'Quadrati e somme', desc: 'Andare all\'indietro, quadrati a spirale, somme' },
    { name: 'Invarianti', desc: 'Quello che resta uguale mentre tutto cresce' },
  ],
  generate(rng, level) {
    if (level === 1) return [{ type: 'learn', title: 'Somma gli ultimi due', body: `$$${list(FIB.slice(0, 10))},\\ \\dots$$ Dal terzo in poi, ogni numero è la somma dei due precedenti: $5 + 8 = 13$. Leonardo Fibonacci la descrisse nel 1202, nel <i>Liber abaci</i>, contando coppie di conigli.` }, nextTerm(rng), missingMiddle(rng), binsFib(rng), nextTerm(rng), tfFib(rng)];
    if (level === 2) return [{ type: 'learn', title: 'Quadrati a spirale', body: 'Accostando quadrati di lato $1, 1, 2, 3, 5, 8$ si forma sempre un rettangolo: i suoi lati sono due numeri consecutivi della successione. Anche i quadrati $1, 1, 4, 9, 25, 64\\dots$ nascondono schemi.', fig: squaresFig(6) }, backwards(rng), squaresArea(rng), sumTerms(rng), squaresPair(rng), squaresArea(rng)];
    return [{ type: 'learn', title: 'Quello che non cambia', body: 'Un quadrato $8 \\times 8$ (area $64$) si può tagliare in quattro pezzi e ricomporre in un rettangolo $5 \\times 13$ (area $65$). Da dove viene il quadretto in più? $$5\\cdot 13 - 8^2 = 1$$ I pezzi non combaciano davvero: resta una fessura sottilissima lungo la diagonale. Un <b>invariante</b> è un valore che resta uguale mentre la successione cresce.' }, cassini(rng), trick11(rng), binsDivisible(rng), cassini(rng), trick11(rng)];
  },
};

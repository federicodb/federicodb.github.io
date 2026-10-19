// Enigma del giorno: lo stesso per tutti (il seme è la data), così in classe se ne può parlare.
// Problemi di ragionamento, non di calcolo: tre tentativi, un aiuto.

import { createRng } from '../../js/engine/rng.js';
import { hashSeed } from '../../js/game/game.js';
import { polygon, table } from '../../js/gfx/svg.js';
import { tx } from '../../js/engine/helpers.js';

const PUZZLES = [
  (r) => {
    // età
    const k = r.int(2, 4), y = r.int(4, 12), s = r.int(8, 15);
    const f = k * s; // padre ha k volte l'età del figlio
    const ny = f + y, ns = s + y;
    if (ny === ns * 2) return null;
    return {
      title: 'Questione di età',
      prompt: `Oggi Marta ha ${s} anni e suo padre ne ha ${f}, cioè ${k} volte tanto. Tra quanti anni il padre avrà esattamente il doppio degli anni di Marta?`,
      answer: f - 2 * s,
      valid: f - 2 * s > 0,
      hint: `Tra $t$ anni: $${f} + t = 2(${s} + t)$.`,
      explain: `$$${f} + t = 2(${s} + t) \\Rightarrow t = ${f - 2 * s}$$ La differenza di età (${f - s} anni) non cambia mai: il padre ha il doppio quando Marta ha proprio ${f - s} anni.`,
    };
  },
  (r) => {
    // successione
    const a = r.int(1, 5), d = r.int(2, 6);
    const kind = r.pick(['quad', 'fib']);
    if (kind === 'quad') {
      const seq = Array.from({ length: 5 }, (_, i) => a + d * i * i);
      return { title: 'Il numero che manca', prompt: `Qual è il numero successivo? $$${seq.join(',\\ ')},\\ ?$$`, answer: a + d * 25, valid: true, hint: 'Guarda le differenze tra numeri consecutivi, e poi le differenze delle differenze.', explain: `Differenze: ${seq.slice(1).map((v, i) => v - seq[i]).join(', ')}, che crescono di ${2 * d}. La prossima differenza è ${d * 9}: $${seq[4]} + ${d * 9} = ${a + d * 25}$. I termini sono $${a} + ${d}n^2$.` };
    }
    const s = [a, a + d];
    while (s.length < 6) s.push(s[s.length - 1] + s[s.length - 2]);
    return { title: 'Il numero che manca', prompt: `Qual è il numero successivo? $$${s.join(',\\ ')},\\ ?$$`, answer: s[4] + s[5], valid: true, hint: 'Ogni numero dipende dai due precedenti.', explain: `Ogni termine è la somma dei due precedenti (come la successione di Fibonacci): $${s[4]} + ${s[5]} = ${s[4] + s[5]}$.` };
  },
  (r) => {
    // stretta di mano / poligono diagonali
    const n = r.int(6, 15);
    return { title: 'Diagonali', prompt: `Quante diagonali ha un poligono convesso con ${n} lati?`, answer: (n * (n - 3)) / 2, valid: true, hint: 'Da ogni vertice partono diagonali verso tutti i vertici tranne sé stesso e i due vicini.', explain: `Da ogni vertice partono $${n} - 3 = ${n - 3}$ diagonali; ognuna è contata due volte: $$\\dfrac{${n}\\cdot ${n - 3}}{2} = ${(n * (n - 3)) / 2}$$`, fig: polygon({ pts: Array.from({ length: Math.min(n, 9) }, (_, i) => [Math.cos((2 * Math.PI * i) / Math.min(n, 9)), Math.sin((2 * Math.PI * i) / Math.min(n, 9))]), width: 200, height: 200 }) };
  },
  (r) => {
    // bilance
    const a = r.int(2, 6), b = r.int(2, 6);
    // 2 cerchi = 1 quadrato + a ; 1 quadrato = 1 cerchio + b → cerchio?
    const circle = a + b, square = circle + b;
    return { title: 'Bilance in equilibrio', prompt: `Due cerchi pesano quanto un quadrato più ${a} grammi. Un quadrato pesa quanto un cerchio più ${b} grammi. Quanto pesa un cerchio?`, answer: circle, valid: 2 * circle === square + a, hint: 'Sostituisci il quadrato nella prima bilancia.', explain: `$$2c = q + ${a},\\quad q = c + ${b} \\Rightarrow 2c = c + ${b} + ${a} \\Rightarrow c = ${circle}$$` };
  },
  (r) => {
    // percentuale inversa
    const p = r.pick([20, 25, 50]);
    return { title: 'Su e giù', prompt: `Un prezzo aumenta del ${p}%. Di che percentuale deve diminuire per tornare al valore iniziale? (arrotonda ai decimi)`, answer: (p / (100 + p)) * 100, decimals: 1, valid: true, hint: 'Parti da 100: quanto vale dopo l\'aumento? Quanto devi togliere?', explain: `Da 100 si arriva a ${100 + p}. Per tornare a 100 si tolgono ${p} su ${100 + p}: $$\\dfrac{${p}}{${100 + p}} \\approx ${tx((p / (100 + p)) * 100, 1)}\\%$$` };
  },
  (r) => {
    // ultima cifra
    const b = r.pick([2, 3, 7]), e = r.int(20, 99);
    const cyc = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 7: [7, 9, 3, 1] }[b];
    return { title: 'L\'ultima cifra', prompt: `Qual è l'ultima cifra di $${b}^{${e}}$?`, answer: cyc[(e - 1) % 4], valid: true, hint: `Calcola le prime potenze di ${b} e guarda solo l'ultima cifra.`, explain: `Le ultime cifre delle potenze di ${b} si ripetono ogni 4: ${cyc.join(', ')}. Poiché ${e} diviso 4 dà resto ${e % 4 || 4 === 4 ? e % 4 : ''}, l'ultima cifra è ${cyc[(e - 1) % 4]}.` };
  },
  (r) => {
    // quadrato magico
    const s = r.int(4, 9);
    const base = [[2, 7, 6], [9, 5, 1], [4, 3, 8]].map((row) => row.map((v) => v + s - 5));
    const hidden = r.int(0, 8);
    const ans = base[Math.floor(hidden / 3)][hidden % 3];
    const rows = base.map((row, i) => row.map((v, j) => (i * 3 + j === hidden ? '?' : String(v))));
    return { title: 'Quadrato magico', prompt: 'In questo quadrato la somma di ogni riga, colonna e diagonale è la stessa. Quale numero manca?', fig: table(['', '', ''], rows), answer: ans, valid: true, hint: 'Trova la somma magica da una riga completa.', explain: `La somma magica è ${3 * s}. Il numero mancante è ${ans}.` };
  },
  (r) => {
    // treni
    const v1 = r.pick([60, 80, 90]), v2 = r.pick([40, 70, 100]), d = (v1 + v2) * r.pick([1, 1.5, 2]);
    return { title: 'Treni in arrivo', prompt: `Due treni partono nello stesso momento da due stazioni distanti ${d} km e si vengono incontro, a ${v1} km/h e ${v2} km/h. Dopo quanti minuti si incontrano?`, answer: (d / (v1 + v2)) * 60, valid: true, hint: 'Ogni ora la distanza tra loro diminuisce della somma delle velocità.', explain: `La distanza cala di ${v1 + v2} km ogni ora: $$t = \\dfrac{${d}}{${v1 + v2}}\\ \\text{h} = ${tx(d / (v1 + v2))}\\ \\text{h} = ${(d / (v1 + v2)) * 60}\\ \\text{min}$$` };
  },
];

export function puzzleOfDay(dayKey) {
  const rng = createRng(hashSeed('enigma' + dayKey));
  for (let i = 0; i < 50; i++) {
    const p = rng.pick(PUZZLES)(rng);
    if (p && p.valid !== false && Number.isFinite(p.answer)) return { ...p, day: dayKey };
  }
  return { title: 'Il numero che manca', prompt: 'Qual è il successivo? $$1,\\ 1,\\ 2,\\ 3,\\ 5,\\ 8,\\ ?$$', answer: 13, hint: 'Ogni numero è la somma dei due precedenti.', explain: '$5 + 8 = 13$', day: dayKey };
}

export const PUZZLE_COUNT = PUZZLES.length;

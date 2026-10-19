// Sfida lampo: domande da risolvere a mente in pochi secondi.
// La difficoltà cresce con il punteggio della partita e con l'anno scelto.

import { tx } from '../../js/engine/helpers.js';

const gens = [
  // livello 0: calcolo base
  (r) => { const a = r.int(6, 19), b = r.int(6, 19); return { p: `${a} \\times ${b}`, a: a * b }; },
  (r) => { const a = r.int(20, 99), b = r.int(11, 89); return { p: `${a} + ${b}`, a: a + b }; },
  (r) => { const b = r.int(3, 12), q = r.int(3, 15); return { p: `${b * q} : ${b}`, a: q }; },
  (r) => { const a = r.int(-12, 12), b = r.int(-12, 12); return { p: `(${a}) - (${b})`, a: a - b }; },
  // livello 1: percentuali, potenze, frazioni
  (r) => { const p = r.pick([10, 20, 25, 50, 5]), n = r.int(2, 30) * 20; return { p: `${p}\\%\\ \\text{di}\\ ${n}`, a: (p * n) / 100 }; },
  (r) => { const b = r.int(2, 5), e = r.int(2, b === 2 ? 8 : 4); return { p: `${b}^{${e}}`, a: b ** e }; },
  (r) => { const n = r.int(2, 15); return { p: `\\sqrt{${n * n}}`, a: n }; },
  (r) => { const d = r.pick([2, 4, 5]), n = r.int(1, d - 1), k = r.int(2, 9) * d; return { p: `\\tfrac{${n}}{${d}}\\ \\text{di}\\ ${k}`, a: (n * k) / d }; },
  // livello 2: algebra rapida
  (r) => { const a = r.int(2, 9), x = r.int(-9, 9), b = r.int(-15, 15); return { p: `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a * x + b}\\quad x = ?`, a: x }; },
  (r) => { const x = r.int(-5, 5); return { p: `x^2 - 3x\\ \\text{per}\\ x = ${x}`, a: x * x - 3 * x }; },
  (r) => { const m = r.int(-4, 4), x1 = r.int(-3, 3), dx = r.int(1, 3); return { p: `m\\ \\text{tra}\\ (${x1};\\,0)\\ \\text{e}\\ (${x1 + dx};\\,${m * dx})`, a: m }; },
  (r) => { const a = r.int(1, 6), b = r.int(1, 6); return { p: `(${a}+${b})^2 - ${a}^2 - ${b}^2`, a: 2 * a * b }; },
  // livello 3: triennio
  (r) => { const b = r.pick([2, 3, 10]), e = r.int(0, b === 2 ? 7 : 3); return { p: `\\log_{${b}} ${b ** e}`, a: e }; },
  (r) => { const p = r.int(-4, 4), q = r.int(-4, 4); return { p: `x^2 ${-(p + q) < 0 ? '-' : '+'} ${Math.abs(p + q)}x ${p * q < 0 ? '-' : '+'} ${Math.abs(p * q)} = 0:\\ x_1 + x_2`, a: p + q }; },
  (r) => { const n = r.int(3, 6); return { p: `${n}!`, a: [1, 1, 2, 6, 24, 120, 720][n] }; },
  (r) => { const d = r.pick([0, 30, 90, 150, 180, 270]); return { p: `\\sin ${d}°`, a: Math.round(Math.sin((d * Math.PI) / 180) * 100) / 100, dec: 2 }; },
];
const BANDS = [[0, 4], [0, 8], [4, 12], [8, 16]];

/** Una domanda lampo. `year` 1–5, `streak` = risposte giuste nella partita (la difficoltà sale). */
export function lampoItem(rng, year = 1, streak = 0) {
  const base = year >= 4 ? 3 : year === 3 ? 2 : year === 2 ? 1 : 0;
  const band = BANDS[Math.min(3, base + Math.floor(streak / 6))];
  const g = gens[rng.int(band[0], band[1] - 1)];
  const it = g(rng);
  return { prompt: `$$${it.p}$$`, answer: it.a, decimals: it.dec, display: tx(it.a) };
}

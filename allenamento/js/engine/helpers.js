// Strumenti comuni per chi scrive le attività.

export const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

/** Numero in formato italiano: virgola decimale, al massimo `dec` cifre, senza zeri inutili */
export function it(n, dec = 2) {
  const r = Math.round(n * 10 ** dec) / 10 ** dec;
  return String(r).replace('.', ',');
}
/** Numero per LaTeX con virgola decimale corretta */
export function tx(n, dec = 2) {
  return it(n, dec).replace(',', '{,}');
}
/** Euro in formato italiano: 12,50 € */
export function euro(n) {
  const r = Math.round(n * 100) / 100;
  return (Number.isInteger(r) ? String(r) : r.toFixed(2)).replace('.', ',') + ' €';
}

/** Frazione ridotta in LaTeX: frac(6, -4) -> -\dfrac{3}{2} */
export function frac(num, den) {
  if (den === 0) throw new Error('denominatore nullo');
  const g = gcd(num, den);
  let n = num / g;
  let d = den / g;
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return String(n);
  return `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`;
}

/**
 * Polinomio in LaTeX a partire da termini [coeff, parteLetterale]:
 * poly([[3,'x'],[-5,'']]) -> "3x - 5";  poly([[1,'x'],[0,'']]) -> "x"
 */
export function poly(terms) {
  let out = '';
  for (const [c, lit] of terms) {
    if (c === 0) continue;
    const abs = Math.abs(c);
    const coeff = lit && abs === 1 ? '' : String(abs);
    const sign = c < 0 ? (out ? ' - ' : '-') : out ? ' + ' : '';
    out += sign + coeff + lit;
  }
  return out || '0';
}

/** Numero con segno tra parentesi se negativo: (-3) */
export const par = (n) => (n < 0 ? `(${n})` : String(n));

/** Terne pitagoriche primitive comode per la scuola */
export const TRIPLES = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61],
];

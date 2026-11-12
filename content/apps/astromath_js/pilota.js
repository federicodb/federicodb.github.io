// PILOTA DI ASTROMATH — astronauta in pixel art vettoriale (disegno originale).
// Ogni pixel è un quadratino pieno disegnato dalla GPU: nitido a ogni zoom, ruota con il volo,
// si specchia quando cambia direzione. Fotogrammi: fermo, saluto (due pose), passo.
// Tavolozza:  K contorno · W tuta · L ombra della tuta · G grigio (guanti, stivali, zaino)
//             V visiera · v riflesso della visiera · H luce · T pannello nel colore della costellazione · O spia

export const PX = 0.3;          // lato di un pixel in unità del mondo
export const COLONNE = 16, RIGHE = 19;
const CY = 9;                   // riga del centro: la riga 18 (gli stivali) sta a 2,7 unità sotto il centro

const BASE = [
  '......KKKK......',
  '....KKWWWWKK....',
  '...KWWWWWWWHK...',
  '..KWWVVVVVVWWK..',
  '..KWVvvVVVVVWK..',
  '..KWVvVVVVVVWK..',
  '..KWVVVVVVVVWK..',
  '..KLWVVVVVVWLK..',
  '...KLWWWWWWLK...',
  'GKKWWWWWWWWWWKKG',
  'GKWKWWTTTTWWKWKG',
  'GKWKWWTOOTWWKWKG',
  'GKWKWWTTTTWWKWKG',
  '.KGKWWWWWWWWKGK.',
  '..KKLLLLLLLLKK..',
  '...KWWWKKWWWK...',
  '...KWWLKKLWWK...',
  '...KGGGKKGGGK...',
  '...KKKKKKKKKK...',
];

/** Modifiche a BASE: [riga, colonna, carattere] */
const via = (righe, colonne) => righe.flatMap((r) => colonne.map((c) => [r, c, '.']));
const BRACCIO_GIU = via([10, 11, 12, 13], [13, 14]);
const SALUTO_A = [...BRACCIO_GIU, [3, 14, 'K'], [3, 15, 'K'], [4, 14, 'G'], [4, 15, 'K'], [5, 14, 'G'], [5, 15, 'K'], [6, 14, 'W'], [6, 15, 'K'], [7, 14, 'W'], [7, 15, 'K'], [8, 13, 'K'], [8, 14, 'W'], [8, 15, 'K']];
const SALUTO_B = [...BRACCIO_GIU, [2, 14, 'K'], [2, 15, 'K'], [3, 14, 'G'], [3, 15, 'G'], [4, 14, 'G'], [4, 15, 'K'], [5, 14, 'W'], [5, 15, 'K'], [6, 14, 'W'], [6, 15, 'K'], [7, 14, 'W'], [7, 15, 'K'], [8, 13, 'K'], [8, 14, 'W'], [8, 15, 'K']];
const PASSO = [
  ...'...KGGGKKWLWK...'.split('').map((ch, c) => [16, c, ch]),
  ...'...KKKKKKGGGK...'.split('').map((ch, c) => [17, c, ch]),
  ...'........KKKKK...'.split('').map((ch, c) => [18, c, ch]),
];

function applica(base, modifiche) {
  const g = base.map((r) => r.split(''));
  for (const [r, c, ch] of modifiche) g[r][c] = ch;
  return g.map((r) => r.join(''));
}
export const FOTOGRAMMI = { fermo: BASE, salutoA: applica(BASE, SALUTO_A), salutoB: applica(BASE, SALUTO_B), passo: applica(BASE, PASSO) };

const TAVOLOZZA = {
  K: [0.17, 0.2, 0.31], W: [0.93, 0.95, 1], L: [0.66, 0.72, 0.84], G: [0.38, 0.42, 0.52],
  V: [0.1, 0.14, 0.36], v: [0.38, 0.52, 0.95], H: [1, 1, 1], O: [1, 0.62, 0.24],
};

/**
 * Disegna il pilota nella lista (rettangoli pieni).
 * @param stato { verso: 1 | -1, saluta: bool, ora: secondi, rot: radianti, tinta: [r,g,b] }
 */
export function disegnaPilotaPixel(lista, p, { verso = 1, saluta = false, ora = 0, rot = 0, tinta }) {
  let nome = 'fermo';
  if (saluta) nome = Math.floor(ora * 5) % 2 ? 'salutoA' : 'salutoB';
  else if (p.aTerra && Math.abs(p.vx) > 2) nome = Math.floor(ora * 8) % 2 ? 'passo' : 'fermo';
  const g = FOTOGRAMMI[nome];
  const c = Math.cos(rot), s = Math.sin(rot);
  // il riflesso che scorre sulla visiera ogni tre secondi circa
  const lampo = (ora % 3.2) / 0.6;
  const lampoCol = lampo < 1 ? 4 + Math.floor(lampo * 8) : -1;
  for (let r = 0; r < RIGHE; r++) {
    const riga = g[r];
    for (let col = 0; col < COLONNE; col++) {
      let ch = riga[col];
      if (ch === '.') continue;
      if (ch === 'V' && (col === lampoCol || col === lampoCol + 1) && r >= 3 && r <= 6) ch = 'H';
      const colore = ch === 'T' ? tinta : TAVOLOZZA[ch];
      if (!colore) continue;
      const lx = verso * (col - (COLONNE - 1) / 2) * PX, ly = (CY - r) * PX;
      lista.rett(p.x + lx * c - ly * s, p.y + lx * s + ly * c, 0.55, PX * 1.04, PX * 1.04, rot, colore, 1);
    }
  }
}

/** Punti del pilota in coordinate del mondo (per sciarpa e fiamme) */
export function puntiPilota(p, verso) {
  return {
    collo: [p.x - verso * 0.5, p.y + 0.4],
    ugelli: [[p.x - 2.25, p.y - 1.15], [p.x + 2.25, p.y - 1.15]],
  };
}

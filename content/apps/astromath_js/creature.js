// CREATURE DI ASTROMATH — una per costellazione, disegnata con la matematica del suo argomento.
// L'animazione è il disegno dell'idea: il Quadrato del binomio si scompone in a², 2ab, b²,
// la Squadra 3-4-5 apre i quadrati sui lati, la Manta ha le ali y = ax² con a che respira…
//
// Ogni funzione riceve una "penna" (vedi disegno.js) già spostata sulla stella, il tempo t e l'umore:
//   pen.poly(punti, chiuso, ton, larghezza)   ton: 0 tinta, 1 accento, 2 bianco, 3 oro
//   pen.cerchio(x, y, r, ton, larghezza, lati)
// Unità locali: la creatura sta in un cerchio di raggio ~5.

const TAU = Math.PI * 2;
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));

/** Occhi: guardano il pilota, sbattono le palpebre, si chiudono a mezzaluna quando la creatura è felice */
export function occhi(pen, x, y, dist, guarda, t, umore, r = 0.55) {
  const batti = (t % 4.3) < 0.12;
  for (const s of [-1, 1]) {
    const ox = x + s * dist;
    if (umore === 'felice') {
      pen.poly(range(7, (i) => { const a = Math.PI * (i / 6); return [ox - Math.cos(a) * r, y + Math.sin(a) * r * 0.9 - r * 0.2]; }), false, 2, 2);
      continue;
    }
    if (batti) { pen.poly([[ox - r, y], [ox + r, y]], false, 2, 2); continue; }
    pen.cerchio(ox, y, r, 2, 1.6, 14);
    const pd = umore === 'triste' ? [0, -r * 0.45] : [Math.cos(guarda) * r * 0.42, Math.sin(guarda) * r * 0.42];
    pen.cerchio(ox + pd[0], y + pd[1], r * 0.32, 2, 2.4, 8);
  }
}

function bocca(pen, x, y, w, umore) {
  const c = umore === 'triste' ? -1 : umore === 'felice' ? 1.6 : 0.6;
  pen.poly(range(7, (i) => { const u = i / 6 - 0.5; return [x + u * w, y - c * (0.25 - u * u) * w * 0.8]; }), false, 2, 1.6);
}

const CREATURE = {
  // Contastelle: una stella con la coda a retta dei numeri, che ondeggia come una molla
  contastelle(pen, t, u) {
    const R = 4 * (1 + 0.06 * Math.sin(t * 2.2)), r = 1.8;
    const rot = t * 0.4;
    pen.poly(range(10, (i) => { const a = rot + (i * TAU) / 10 + Math.PI / 2; const rr = i % 2 ? r : R; return [Math.cos(a) * rr, Math.sin(a) * rr]; }), true, 0, 2.6);
    const coda = range(9, (i) => [-1 - i * 1.15, -2.6 - i * 0.35 + Math.sin(t * 3 - i * 0.7) * 0.18 * i]);
    pen.poly(coda, false, 1, 2);
    coda.forEach(([x, y], i) => { if (i % 2 === 0) pen.poly([[x, y - 0.45], [x, y + 0.45]], false, 1, 1.6); });
    occhi(pen, 0, 0.35, 0.85, u.guarda, t, u.umore, 0.48);
  },

  // Medusa Percento: la cupola si riempie come un grafico a torta, i tentacoli sono sinusoidi
  medusa(pen, t, u) {
    const p = 0.5 + 0.35 * Math.sin(t * 0.9);
    pen.poly(range(25, (i) => { const a = Math.PI * (i / 24); return [Math.cos(a) * 4.2, 0.4 + Math.sin(a) * 3.6]; }), false, 0, 2.6);
    pen.poly([[-4.2, 0.4], [4.2, 0.4]], false, 0, 2);
    const fette = Math.max(1, Math.round(p * 10));
    for (let i = 0; i <= fette; i++) { const a = Math.PI * (1 - i / 10); pen.poly([[0, 0.4], [Math.cos(a) * 2.6, 0.4 + Math.sin(a) * 2.2]], false, 1, 1.4); }
    for (let k = 0; k < 5; k++) {
      const x0 = -3.2 + k * 1.6;
      pen.poly(range(10, (i) => [x0 + Math.sin(t * 2.4 + k + i * 0.6) * 0.35 * (i / 9), 0.2 - i * 0.62]), false, 0, 1.6);
    }
    occhi(pen, 0, 2.2, 1.1, u.guarda, t, u.umore, 0.5);
  },

  // Monomio: una x che cammina, con l'esponente che le gira attorno
  monomio(pen, t, u) {
    const s = Math.sin(t * 3) * 0.5;
    pen.poly([[-3 + s, -3.5], [3 - s, 3.5]], false, 0, 3);
    pen.poly([[-3 - s, 3.5], [3 + s, -3.5]], false, 0, 3);
    const a = t * 1.6;
    const ex = 4.2 + Math.cos(a) * 1.2, ey = 3.6 + Math.sin(a) * 0.9;
    pen.poly([[ex - 0.5, ey + 0.4], [ex - 0.1, ey + 0.8], [ex + 0.4, ey + 0.6], [ex + 0.4, ey + 0.2], [ex - 0.5, ey - 0.5], [ex + 0.5, ey - 0.5]], false, 1, 1.8);
    occhi(pen, 0, 0.9, 0.75, u.guarda, t, u.umore, 0.45);
  },

  // Quadrato del binomio: (a+b)² si apre nei pezzi a², ab, ab, b² e si richiude
  quadrato(pen, t, u) {
    const A = 4, B = 2.6, L = A + B, o = -L / 2;
    const e = (u.umore === 'mostra' ? 0.9 : 0.5) * (0.5 + 0.5 * Math.sin(t * 1.4));
    const pezzo = (x, y, w, h, dx, dy, ton) => pen.poly([[x + dx, y + dy], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + dx, y + h + dy]], true, ton, 2.2);
    pezzo(o, o + B, A, A, -e, e, 0);        // a²
    pezzo(o + A, o + B, B, A, e, e, 1);      // ab
    pezzo(o, o, A, B, -e, -e, 1);            // ab
    pezzo(o + A, o, B, B, e, -e, 2);         // b²
    occhi(pen, o + A / 2 - e, o + B + A / 2 + e, 0.8, u.guarda, t, u.umore, 0.48);
  },

  // Scompositore: un polinomio-rettangolo che si separa nei suoi fattori, con il × in mezzo
  scompositore(pen, t, u) {
    const g = Math.max(0, Math.sin(t * 1.2)) * 1.6;
    const blocco = (x, w, ton) => pen.poly([[x, -2], [x + w, -2], [x + w, 2], [x, 2]], true, ton, 2.4);
    blocco(-4 - g, 3.4, 0);
    blocco(-0.6 + g, 4.6, 1);
    if (g > 0.4) { const c = 0; pen.poly([[c - 0.5, -0.5], [c + 0.5, 0.5]], false, 2, 2); pen.poly([[c - 0.5, 0.5], [c + 0.5, -0.5]], false, 2, 2); }
    occhi(pen, -2.3 - g, 0.4, 0.6, u.guarda, t, u.umore, 0.4);
    occhi(pen, 1.7 + g, 0.4, 0.6, u.guarda, t, u.umore, 0.4);
  },

  // Bilancia: le equazioni stanno in equilibrio; il giogo oscilla e si ferma quando è felice
  bilancia(pen, t, u) {
    const ang = u.umore === 'felice' ? 0 : 0.22 * Math.sin(t * 1.3);
    const c = Math.cos(ang), s = Math.sin(ang);
    pen.poly([[0, -4.5], [0, 2.4]], false, 0, 2.6);
    pen.poly([[-2, -4.5], [2, -4.5]], false, 0, 2.6);
    const l = [-4.2 * c, 2.4 - 4.2 * s], r = [4.2 * c, 2.4 + 4.2 * s];
    pen.poly([l, r], false, 0, 2.6);
    for (const [px, py] of [l, r]) {
      pen.poly([[px, py], [px - 1.3, py - 2.4]], false, 1, 1.4);
      pen.poly([[px, py], [px + 1.3, py - 2.4]], false, 1, 1.4);
      pen.poly(range(9, (i) => { const a = Math.PI + Math.PI * (i / 8); return [px + Math.cos(a) * 1.5, py - 2.4 + Math.sin(a) * 0.7]; }), false, 1, 2);
    }
    pen.cerchio(0, 3.4, 1.2, 0, 2.2, 16);
    occhi(pen, 0, 3.5, 0.45, u.guarda, t, u.umore, 0.3);
  },

  // Aquilone: il filo è una retta con la sua pendenza, la coda segue come una catena elastica
  aquilone(pen, t, u) {
    const tilt = 0.15 * Math.sin(t * 1.1);
    const k = [[0, 4.2], [2.6, 0.6], [0, -3.2], [-2.6, 0.6]].map(([x, y]) => [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)]);
    pen.poly(k, true, 0, 2.6);
    pen.poly([k[0], k[2]], false, 1, 1.4);
    pen.poly([k[1], k[3]], false, 1, 1.4);
    const coda = range(8, (i) => [k[2][0] + Math.sin(t * 2.6 - i * 0.8) * 0.5 * (i / 7), k[2][1] - i * 0.8]);
    pen.poly(coda, false, 1, 1.6);
    coda.forEach(([x, y], i) => { if (i % 2) { pen.poly([[x - 0.4, y - 0.3], [x + 0.4, y + 0.3]], false, 3, 1.6); pen.poly([[x - 0.4, y + 0.3], [x + 0.4, y - 0.3]], false, 3, 1.6); } });
    pen.poly([k[2], [k[2][0] - 6, k[2][1] - 3]], false, 2, 1); // il filo: pendenza 1/2
    occhi(pen, 0, 1.1, 0.75, u.guarda, t, u.umore, 0.42);
  },

  // Squadra 3-4-5: i quadrati sui lati si aprono e si richiudono (a² + b² = c²)
  squadra(pen, t, u) {
    const s = 1.5, A = [-2 * s, -1.5 * s], B = [2 * s, -1.5 * s], C = [2 * s, 1.5 * s];
    pen.poly([A, B, C], true, 0, 2.8);
    pen.poly([[B[0] - 0.6, B[1]], [B[0] - 0.6, B[1] + 0.6], [B[0], B[1] + 0.6]], false, 2, 1.4);
    const k = (u.umore === 'mostra' ? 1 : 0.6) * (0.5 + 0.5 * Math.sin(t * 1.2));
    const quad = (P, Q, ton) => {
      const dx = Q[0] - P[0], dy = Q[1] - P[1];
      const nx = dy * k, ny = -dx * k; // esterno al triangolo (verso orario)
      pen.poly([P, Q, [Q[0] + nx, Q[1] + ny], [P[0] + nx, P[1] + ny]], true, ton, 1.6);
    };
    quad(A, B, 1);
    quad(B, C, 1);
    quad(C, A, 3);
    occhi(pen, 0.9, -0.4, 0.6, u.guarda, t, u.umore, 0.4);
  },

  // Stormo della media: sette punti volano attorno e periodicamente si radunano sul valore medio
  stormo(pen, t, u) {
    const rad = u.umore === 'felice' ? 0.6 : 1.4 + 1.6 * (0.5 + 0.5 * Math.sin(t * 0.8));
    for (let i = 0; i < 7; i++) {
      const a = t * (0.9 + i * 0.07) + (i * TAU) / 7;
      pen.cerchio(Math.cos(a) * rad * (1 + 0.15 * i), Math.sin(a) * rad * 0.7, 0.32, i % 2 ? 1 : 0, 2.4, 8);
    }
    pen.poly([[0, -4.2], [0, 3.6]], false, 3, 1.2);
    pen.poly([[-0.8, 3.9], [0.8, 3.9]], false, 3, 1.6); // la barra di x̄
    [1.2, 2, 2.8, 2, 1.2].forEach((h, i) => { const x = -2.5 + i * 1.25; pen.poly([[x - 0.5, -4.5], [x - 0.5, -4.5 + h], [x + 0.5, -4.5 + h], [x + 0.5, -4.5]], false, 0, 1.4); });
    pen.cerchio(0, 0, 1, 0, 2.4, 16);
    occhi(pen, 0, 0.1, 0.4, u.guarda, t, u.umore, 0.26);
  },

  // Uccello Radice: un segno di radice che vola; la barra è l'ala
  radice(pen, t, u) {
    const w = Math.sin(t * 4) * 1.4;
    pen.poly([[-4.5, 0], [-3.4, 0.6], [-1.8, -3], [0.8, 3.8], [5, 3.8 + w]], false, 0, 3);
    pen.poly([[0.8, 3.8], [3.2, 5.2 + w * 0.6], [5, 3.8 + w]], false, 1, 1.6);
    pen.poly([[-1.8, -3], [-2.6, -4.2], [-1.2, -4.2], [-1.8, -3]], false, 1, 1.4);
    occhi(pen, 0.6, 2.6, 0.55, u.guarda, t, u.umore, 0.36);
  },

  // Manta parabolica: le ali sono y = ax² e a respira; la coda è una sinusoide
  manta(pen, t, u) {
    const a = 0.12 + 0.07 * Math.sin(t * 1.6);
    pen.poly(range(21, (i) => { const x = -5 + i * 0.5; return [x, a * x * x - 0.8]; }), false, 0, 2.8);
    pen.poly(range(11, (i) => { const x = -2.5 + i * 0.5; return [x, -0.8 - 0.9 * Math.cos((x / 2.5) * Math.PI / 2)]; }), false, 0, 2.2);
    pen.poly(range(10, (i) => [Math.sin(t * 3 - i * 0.7) * 0.4 * (i / 9), -1.7 - i * 0.5]), false, 1, 1.6);
    pen.poly([[0, -0.8], [0, 0.4]], false, 3, 1); // l'asse di simmetria
    occhi(pen, 0, -0.6, 0.8, u.guarda, t, u.umore, 0.4);
  },

  // Ingranaggio: l'officina, sempre in movimento
  ingranaggio(pen, t, u) {
    const rot = t * 0.7, n = 10;
    pen.poly(range(n * 4, (i) => { const a = rot + (i * TAU) / (n * 4); const dente = Math.floor(i / 2) % 2 === 0; const r = dente ? 4.3 : 3.4; return [Math.cos(a) * r, Math.sin(a) * r]; }), true, 0, 2.4);
    pen.cerchio(0, 0, 1.2, 1, 1.6, 12);
    occhi(pen, 0, 1.9, 0.9, u.guarda, t, u.umore, 0.42);
    bocca(pen, 0, -2.1, 1.4, u.umore);
  },
};

/** Disegna la creatura `tipo` con l'umore: calmo, mostra (durante la domanda), felice, triste */
export function disegnaCreatura(pen, tipo, t, u) {
  const f = CREATURE[tipo] || CREATURE.contastelle;
  f(pen, t, u);
}

export const TIPI_CREATURA = Object.keys(CREATURE);

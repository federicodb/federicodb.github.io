// DISEGNO DI ASTROMATH — trasforma lo stato del mondo in una "lista di disegno":
// segmenti luminosi (linee al neon) e punti morbidi. Il renderer (Three.js o, senza WebGL, Canvas 2D)
// disegna la lista in pochissime chiamate. Qui vivono anche camera, particelle, onde della griglia,
// sciarpa e scia del pilota.

import { MONDO } from './mondo.js';
import { disegnaCreatura } from './creature.js';

const TAU = Math.PI * 2;
const PS = MONDO.scalaPilota; // il pilota disegnato è più grande delle sue unità di disegno
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------------------------------------
// Colori
// ------------------------------------------------------------------------------------------------
const cacheHsl = new Map();
export function hsl(h, s, l) {
  const k = `${h}|${s}|${l}`;
  let c = cacheHsl.get(k);
  if (c) return c;
  s /= 100; l /= 100;
  const f = (n) => { const kk = (n + h / 30) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)); };
  c = [f(0), f(8), f(4)];
  cacheHsl.set(k, c);
  return c;
}

// ------------------------------------------------------------------------------------------------
// Lista di disegno
// ------------------------------------------------------------------------------------------------
export const SEG = 11; // x1 y1 z1 x2 y2 z2 r g b a w(px)
export const PT = 8;   // x y z size(unità del mondo) r g b a

export class Lista {
  constructor(maxSeg = 14000, maxPt = 3000) {
    this.seg = new Float32Array(maxSeg * SEG);
    this.pt = new Float32Array(maxPt * PT);
    this.maxSeg = maxSeg; this.maxPt = maxPt;
    this.nSeg = 0; this.nPt = 0;
  }
  svuota() { this.nSeg = 0; this.nPt = 0; }
  linea(x1, y1, z1, x2, y2, z2, c, a, w) {
    if (this.nSeg >= this.maxSeg || a <= 0.003) return;
    const o = this.nSeg++ * SEG, s = this.seg;
    s[o] = x1; s[o + 1] = y1; s[o + 2] = z1; s[o + 3] = x2; s[o + 4] = y2; s[o + 5] = z2;
    s[o + 6] = c[0]; s[o + 7] = c[1]; s[o + 8] = c[2]; s[o + 9] = a; s[o + 10] = w;
  }
  punto(x, y, z, size, c, a) {
    if (this.nPt >= this.maxPt || a <= 0.003) return;
    const o = this.nPt++ * PT, p = this.pt;
    p[o] = x; p[o + 1] = y; p[o + 2] = z; p[o + 3] = size; p[o + 4] = c[0]; p[o + 5] = c[1]; p[o + 6] = c[2]; p[o + 7] = a;
  }
  poli(punti, z, c, a, w, chiuso = false) {
    for (let i = 1; i < punti.length; i++) this.linea(punti[i - 1][0], punti[i - 1][1], z, punti[i][0], punti[i][1], z, c, a, w);
    if (chiuso && punti.length > 2) { const p = punti[punti.length - 1], q = punti[0]; this.linea(p[0], p[1], z, q[0], q[1], z, c, a, w); }
  }
}

/** Penna per le creature e il pilota: trasforma coordinate locali (traslazione, scala, rotazione, rollio 3D) */
export class Penna {
  constructor(lista) { this.l = lista; this.toni = [[1, 1, 1]]; }
  imposta({ x, y, s = 1, rot = 0, rollio = 0, z = 0, alfa = 1, toni }) {
    this.x = x; this.y = y; this.s = s; this.z = z; this.alfa = alfa; this.toni = toni;
    this.c = Math.cos(rot); this.sn = Math.sin(rot); this.sx = Math.cos(rollio * 0.9);
    return this;
  }
  tr(px, py) {
    const lx = px * this.sx * this.s, ly = py * this.s;
    return [this.x + lx * this.c - ly * this.sn, this.y + lx * this.sn + ly * this.c];
  }
  poly(punti, chiuso, ton, w) {
    const c = this.toni[ton] || this.toni[0];
    let prev = this.tr(punti[0][0], punti[0][1]);
    const first = prev;
    for (let i = 1; i < punti.length; i++) {
      const q = this.tr(punti[i][0], punti[i][1]);
      this.l.linea(prev[0], prev[1], this.z, q[0], q[1], this.z, c, this.alfa, w);
      prev = q;
    }
    if (chiuso) this.l.linea(prev[0], prev[1], this.z, first[0], first[1], this.z, c, this.alfa, w);
  }
  cerchio(x, y, r, ton, w, lati = 20) {
    const pts = [];
    for (let i = 0; i < lati; i++) { const a = (i / lati) * TAU; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    this.poly(pts, true, ton, w);
  }
}

// ------------------------------------------------------------------------------------------------
// Caratteri a tratti (cifre, x, y, O, segno meno): per le tacche degli assi, nello stile vettoriale
// ------------------------------------------------------------------------------------------------
const GLIFI = {
  0: [[[0, 0], [1, 0], [1, 2], [0, 2], [0, 0]]], 1: [[[0.2, 1.6], [0.6, 2], [0.6, 0]]], 2: [[[0, 2], [1, 2], [1, 1], [0, 1], [0, 0], [1, 0]]],
  3: [[[0, 2], [1, 2], [1, 0], [0, 0]], [[0, 1], [1, 1]]], 4: [[[0, 2], [0, 1], [1, 1]], [[1, 2], [1, 0]]], 5: [[[1, 2], [0, 2], [0, 1], [1, 1], [1, 0], [0, 0]]],
  6: [[[1, 2], [0, 2], [0, 0], [1, 0], [1, 1], [0, 1]]], 7: [[[0, 2], [1, 2], [0.4, 0]]], 8: [[[0, 0], [1, 0], [1, 2], [0, 2], [0, 0]], [[0, 1], [1, 1]]],
  9: [[[1, 1], [0, 1], [0, 2], [1, 2], [1, 0], [0, 0]]], '-': [[[0.1, 1], [0.9, 1]]],
  x: [[[0, 0], [1, 1.3]], [[0, 1.3], [1, 0]]], y: [[[0, 1.3], [0.5, 0.5]], [[1, 1.3], [0.2, -0.7]]], O: [[[0.5, 0], [1, 0.5], [1, 1.5], [0.5, 2], [0, 1.5], [0, 0.5], [0.5, 0]]],
};
export function scrivi(lista, testo, x, y, z, h, c, a, w = 1.4) {
  const k = h / 2;
  let cx = x;
  for (const ch of String(testo)) {
    const g = GLIFI[ch];
    if (g) for (const tratto of g) lista.poli(tratto.map(([px, py]) => [cx + px * k, y + py * k]), z, c, a, w);
    cx += k * 1.5;
  }
}

// ------------------------------------------------------------------------------------------------
// Camera: segue il pilota con una molla, guarda avanti nella direzione del moto,
// allarga il campo visivo in accelerazione, trema sugli urti (se gli effetti sono pieni)
// ------------------------------------------------------------------------------------------------
export const FOV_BASE = 60;   // campo visivo ampio e camera vicina: più prospettiva, parallasse vera tra i piani

export class Camera {
  constructor() {
    this.x = 0; this.y = 30; this.vx = 0; this.vy = 0; this.d = 80; this.fov = FOV_BASE;
    this.trauma = 0; this.ox = 0; this.oy = 0; this.aspect = 1.6; this.spostamento = [0, 0];
    this.inclX = 0; this.inclY = 0; // spostamento laterale dell'occhio: la camera guarda il bersaglio un po' di sbieco
    this.base();
  }
  distanzaBase() {
    // lo stesso campo visibile sul piano di gioco di prima (~84 unità in altezza, ~70 sul lato corto del telefono),
    // ma da più vicino e con un obiettivo più grandangolare: gli strati lontani scorrono in modo naturale
    const t = Math.tan((FOV_BASE * Math.PI) / 360);
    return Math.max(42 / t, 35 / (t * Math.min(1, this.aspect)));
  }
  aggiorna(dt, mondo, ridotti) {
    const p = mondo.pilota;
    let tx = p.x + p.vx * 0.35, ty = Math.max(22, p.y + p.vy * 0.3 + 6);
    let dVoluta = this.distanzaBase();
    const inc = mondo.incontro;
    if (inc) {
      const s = mondo.stelle[inc.i];
      tx = lerp(tx, s.x, 0.7); ty = lerp(ty, s.y, 0.7); dVoluta *= 0.9;
      // lascia libero lo spazio del pannello della domanda (a destra sugli schermi larghi, in basso sugli altri)
      const [hw, hh] = this.vista(0);
      tx += this.spostamento[0] * hw; ty += this.spostamento[1] * hh;
    }
    if (mondo.finito || mondo.portaleAperto) dVoluta *= 1.12;
    // molla smorzata criticamente
    const w = 3.2;
    const ax = w * w * (tx - this.x) - 2 * w * this.vx, ay = w * w * (ty - this.y) - 2 * w * this.vy;
    this.vx += ax * dt; this.vy += ay * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const vel = Math.hypot(p.vx, p.vy);
    // in velocità la camera arretra appena e l'obiettivo si apre un poco: niente zoom brusco
    const corsa = ridotti ? 0 : clamp((vel - 14) / 26, 0, 1);
    this.d = lerp(this.d, dVoluta * (1 + 0.1 * corsa), 1 - Math.exp(-dt * 1.6));
    this.fov = lerp(this.fov, FOV_BASE + 5 * corsa, 1 - Math.exp(-dt * 1.6));
    // l'occhio si sposta piano dalla parte opposta al moto (come un operatore che segue in carrello):
    // il piano di gioco resta inquadrato, i piani lontani e vicini scorrono con la loro profondità
    // durante un incontro l'inquadratura si raddrizza quasi del tutto: si legge e si sceglie con calma
    const calma = inc ? 0.3 : 1;
    const ix = ridotti ? 0 : clamp(-this.vx * 0.55, -16, 16) * calma, iy = ridotti ? 0 : (clamp(-this.vy * 0.4, -10, 10) - 6) * calma;
    this.inclX = lerp(this.inclX, ix, 1 - Math.exp(-dt * 1.2));
    this.inclY = lerp(this.inclY, iy, 1 - Math.exp(-dt * 1.2));
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    const sh = ridotti ? 0 : this.trauma * this.trauma * 1.6;
    const t = performance.now() / 1000;
    this.ox = sh * (Math.sin(t * 47) + Math.sin(t * 31 + 1.3)) * 0.5;
    this.oy = sh * (Math.sin(t * 43 + 2.1) + Math.sin(t * 29)) * 0.5;
    this.base();
  }
  scuoti(q) { this.trauma = Math.min(1, this.trauma + q); }
  /** Posizione dell'occhio, punto guardato e assi della camera (destra, su, avanti): li usano tutti i disegni */
  base() {
    const tgt = [this.x + this.ox, this.y + this.oy, 0];
    const pos = [tgt[0] + this.inclX, tgt[1] + this.inclY, this.d];
    const fw = norm3([tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]]);
    const dx = norm3(cross3(fw, [0, 1, 0]));
    const su = cross3(dx, fw);
    this.occhio = { pos, tgt, dx, su, fw };
    return this.occhio;
  }
  /** Proiezione su schermo (px) di un punto del mondo: [x, y, scala px per unità] */
  proietta(x, y, z, W, H) {
    const { pos, dx, su, fw } = this.occhio;
    const v = [x - pos[0], y - pos[1], z - pos[2]];
    const zc = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2];
    if (zc <= 0.1) return null;
    const f = H / 2 / Math.tan((this.fov * Math.PI) / 360);
    return [W / 2 + ((v[0] * dx[0] + v[1] * dx[1] + v[2] * dx[2]) * f) / zc, H / 2 - ((v[0] * su[0] + v[1] * su[1] + v[2] * su[2]) * f) / zc, f / zc];
  }
  /** Mezza larghezza e mezza altezza visibili alla profondità z (con margine per l'inclinazione) */
  vista(z) { const hh = (this.d - z) * Math.tan((this.fov * Math.PI) / 360); return [hh * this.aspect + Math.abs(this.inclX), hh + Math.abs(this.inclY)]; }
}
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// ------------------------------------------------------------------------------------------------
// Particelle (scintille, polvere di stelle, fiamme): un unico pool, disegnato come punti morbidi
// ------------------------------------------------------------------------------------------------
export class Particelle {
  constructor(n = 900) { this.p = []; this.max = n; this.densita = 1; }
  emetti(x, y, { n = 20, v = 14, vita = 1, tinta = [1, 1, 1], size = 0.9, g = 0, dir = null, spread = TAU, z = 0.5 } = {}) {
    const m = Math.round(n * this.densita);
    for (let i = 0; i < m && this.p.length < this.max; i++) {
      const a = dir == null ? Math.random() * TAU : dir + (Math.random() - 0.5) * spread;
      const s = v * (0.35 + Math.random() * 0.65);
      this.p.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vita: vita * (0.6 + Math.random() * 0.4), t: 0, c: tinta, size: size * (0.6 + Math.random() * 0.8), g });
    }
  }
  aggiorna(dt) {
    for (const q of this.p) { q.t += dt; q.vx *= 1 - 1.6 * dt; q.vy = q.vy * (1 - 1.6 * dt) - q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    this.p = this.p.filter((q) => q.t < q.vita);
  }
  disegna(lista) {
    for (const q of this.p) { const k = 1 - q.t / q.vita; lista.punto(q.x, q.y, q.z, q.size * (0.5 + 0.5 * k), q.c, k * k); }
  }
}

// ------------------------------------------------------------------------------------------------
// Scena
// ------------------------------------------------------------------------------------------------
export class Scena {
  constructor() {
    this.lista = new Lista();
    this.penna = new Penna(this.lista);
    this.cam = new Camera();
    this.part = new Particelle();
    this.onde = [];       // onde della griglia (risposte giuste, atterraggi…)
    this.scia = [];       // ultime posizioni del pilota
    this.sciarpa = null;  // catena di punti con molle
    this.umori = {};      // umore di ogni creatura: { tipo, da }
    this.creaProfondita();
    this.qualita = { alone: 1, particelle: 1 };
    this.ridotti = false;
  }

  /** Strati di profondità fissi nel mondo (deterministici): pulviscolo vicino all'obiettivo e figure lontane */
  creaProfondita() {
    let sd = 977;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    // pulviscolo tra la camera e il piano: scorre più veloce del piano ed è fuori fuoco
    this.polvere = Array.from({ length: 70 }, () => ({ x: (r() * 2 - 1) * 260, y: -20 + r() * 340, z: 14 + r() * 38, size: 0.8 + r() * 1.6, a: 0.1 + r() * 0.22, c: r() < 0.5 ? [0.75, 0.85, 1] : [1, 0.92, 0.8] }));
    // figure geometriche lontane (poligoni regolari e cifre): scorrono più lente, morbide per la sfocatura
    this.lontani = Array.from({ length: 26 }, (_, i) => ({ x: (r() * 2 - 1) * 300, y: -10 + r() * 360, z: -45 - r() * 150, lati: 3 + Math.floor(r() * 6), R: 5 + r() * 12, rot: r() * TAU, vr: (r() - 0.5) * 0.12, cifra: i % 5 === 0 ? String(Math.floor(r() * 10)) : null, dt: Math.floor(r() * 50) }));
  }

  onda(x, y, forza = 1) { if (!this.ridotti) this.onde.push({ x, y, t: 0, f: forza }); }

  umore(i, tipo, durata = 1.4) { this.umori[i] = { tipo, fino: performance.now() / 1000 + durata }; }

  /** Spostamento elastico della griglia: onde che si allargano e l'ammaccatura della spinta del pilota */
  deforma(x, y, p) {
    let dx = 0, dy = 0;
    for (const o of this.onde) {
      const ex = x - o.x, ey = y - o.y, d = Math.hypot(ex, ey) || 1;
      const R = o.t * 46, amp = o.f * Math.exp(-o.t * 1.7);
      const k = amp * Math.exp(-(((d - R) / 7) ** 2)) * 2.2;
      dx += (ex / d) * k; dy += (ey / d) * k;
    }
    if (!this.ridotti && p.spinge > 0.05) {
      const ex = x - p.x, ey = y - p.y, d2 = ex * ex + ey * ey;
      if (d2 < 900) { const d = Math.sqrt(d2) || 1, k = p.spinge * 2.6 * Math.exp(-d2 / 110); dx += (ex / d) * k; dy += (ey / d) * k; }
    }
    return [x + dx, y + dy];
  }

  aggiorna(dt, mondo) {
    this.cam.aggiorna(dt, mondo, this.ridotti);
    for (const o of this.onde) o.t += dt;
    this.onde = this.onde.filter((o) => o.t < 2.2);
    this.part.densita = this.qualita.particelle * (this.ridotti ? 0.25 : 1);
    this.part.aggiorna(dt);
    const p = mondo.pilota;
    // fiamme dei razzi
    if (p.spinge > 0.1 && Math.random() < 0.9) {
      const inp = mondo.input, m = Math.hypot(inp.x, inp.y) || 1;
      const dir = Math.atan2(-inp.y / m, -inp.x / m);
      for (const s of [-1, 1]) {
        const nx = p.x + s * 0.95 * PS * Math.cos(p.rollio * 0.9), ny = p.y - 0.9 * PS;
        this.part.emetti(nx, ny, { n: 2, v: 10 + 14 * p.spinge, vita: 0.32, tinta: Math.random() < 0.5 ? [1, 0.55, 0.85] : [1, 0.9, 0.6], size: 0.55, dir, spread: 0.6, z: 0.2 });
      }
    }
    this.scia.push([p.x, p.y + 0.2]);
    if (this.scia.length > 46) this.scia.shift();
    this.aggiornaSciarpa(dt, p);
  }

  aggiornaSciarpa(dt, p) {
    const N = 11;
    const ancora = [p.x - p.rollio * 0.3 * PS, p.y + 1.05 * PS];
    if (!this.sciarpa) this.sciarpa = Array.from({ length: N }, (_, i) => ({ x: ancora[0], y: ancora[1] - i * 0.4, px: ancora[0], py: ancora[1] - i * 0.4 }));
    const L = 0.18 + 0.62 * clamp(p.energia / p.energiaMax, 0, 1); // la sciarpa è lunga quanto l'energia
    const s = this.sciarpa;
    const vento = [-p.vx * 0.9, -p.vy * 0.9 - 2.5];
    const t = performance.now() / 1000;
    for (let i = 1; i < N; i++) {
      const q = s[i];
      const vx = (q.x - q.px) * 0.96, vy = (q.y - q.py) * 0.96;
      q.px = q.x; q.py = q.y;
      const fl = Math.sin(t * 9 - i * 0.8) * 0.9 * (i / N);
      q.x += vx + (vento[0] + fl * Math.abs(vento[1]) * 0.15) * dt * dt * 12;
      q.y += vy + (vento[1] + fl * Math.abs(vento[0]) * 0.15) * dt * dt * 12;
    }
    s[0].x = ancora[0]; s[0].y = ancora[1];
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < N; i++) {
        const a = s[i - 1], b = s[i];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
        const k = (d - L) / d;
        b.x -= dx * k; b.y -= dy * k;
      }
    }
  }

  costruisci(mondo, W, H) {
    const l = this.lista, cam = this.cam, t = mondo.tempo, liv = mondo.livello, p = mondo.pilota;
    l.svuota();
    cam.aspect = W / H;
    const tinta = hsl(liv.tinta, 90, 62), tintaChiara = hsl(liv.tinta, 95, 80), oro = hsl(45, 100, 62), bianco = [1, 1, 1];
    const accento = hsl((liv.tinta + 150) % 360, 90, 68);

    // nebulose: grandi chiazze tenui nella tinta del livello, molto lontane (la parallasse la fa la prospettiva)
    for (let i = 0; i < 5; i++) {
      const a = i * 2.399963;
      l.punto(Math.cos(a) * 320, 120 + Math.sin(a) * 200, -420, 260, hsl((liv.tinta + i * 24) % 360, 70, 45), 0.06);
    }
    // figure lontane dietro il piano di gioco
    const cLont = hsl(liv.tinta, 55, 62);
    for (const f of this.lontani) {
      const rot = f.rot + t * f.vr;
      if (f.cifra) { scrivi(l, f.cifra, f.x, f.y, f.z, f.R, cLont, 0.32, 2); continue; }
      const pts = [];
      for (let k = 0; k <= f.lati; k++) { const a = rot + (k * TAU) / f.lati; pts.push([f.x + Math.cos(a) * f.R, f.y + Math.sin(a) * f.R]); }
      l.poli(pts, f.z, cLont, 0.3, 1.8);
    }

    // griglia del piano cartesiano (deformabile)
    const zg = -6, [hw, hh] = cam.vista(zg);
    const x0 = Math.floor((cam.x - hw - 10) / 10) * 10, x1 = cam.x + hw + 10;
    const y0 = Math.max(-30, Math.floor((cam.y - hh - 10) / 10) * 10), y1 = cam.y + hh + 10;
    const cg = hsl(liv.tinta, 40, 55);
    for (let gx = x0; gx <= x1; gx += 10) {
      const asse = gx === 0;
      let prev = null;
      for (let gy = y0; gy <= y1; gy += 5) {
        const q = this.deforma(gx, gy, p);
        if (prev) l.linea(prev[0], prev[1], zg, q[0], q[1], zg, asse ? bianco : cg, asse ? 0.5 : gy < 0 ? 0.05 : 0.12, asse ? 2 : 1);
        prev = q;
      }
    }
    for (let gy = y0; gy <= y1; gy += 10) {
      const asse = gy === 0;
      let prev = null;
      for (let gx = x0; gx <= x1; gx += 5) {
        const q = this.deforma(gx, gy, p);
        if (prev) l.linea(prev[0], prev[1], zg, q[0], q[1], zg, asse ? bianco : cg, asse ? 0.55 : gy < 0 ? 0.05 : 0.12, asse ? 2.4 : 1);
        prev = q;
      }
    }
    // tacche e numeri sugli assi (1 unità del grafico = 10 unità del mondo), lettere x, y, O
    for (let gx = x0; gx <= x1; gx += 10) {
      if (gx === 0 || Math.abs(gx) > 150) continue;
      l.linea(gx, -0.8, zg, gx, 0.8, zg, bianco, 0.4, 1.4);
      scrivi(l, String(gx / 10), gx - 0.7, -3.4, zg, 1.8, bianco, 0.35, 1.2);
    }
    for (let gy = Math.max(10, y0); gy <= y1; gy += 10) {
      l.linea(-0.8, gy, zg, 0.8, gy, zg, bianco, 0.4, 1.4);
      scrivi(l, String(gy / 10), -3.6 - String(gy / 10).length * 0.6, gy - 0.9, zg, 1.8, bianco, 0.35, 1.2);
    }
    scrivi(l, 'O', -2.6, -3.4, zg, 1.8, bianco, 0.5, 1.4);
    scrivi(l, 'x', MONDO.meta + 4, 1.2, zg, 2.6, bianco, 0.6, 1.8);
    l.poli([[MONDO.meta + 1, -1.2], [MONDO.meta + 3, 0], [MONDO.meta + 1, 1.2]], zg, bianco, 0.6, 2);
    scrivi(l, 'y', 1.6, MONDO.tetto + 4, zg, 2.6, bianco, 0.6, 1.8);
    l.poli([[-1.2, MONDO.tetto + 1], [0, MONDO.tetto + 3], [1.2, MONDO.tetto + 1]], zg, bianco, 0.6, 2);

    // correnti: il grafico e le linee di flusso che scorrono
    for (const c of mondo.correnti) {
      const pts = [];
      for (let x = c.x0; x <= c.x1 + 0.01; x += 1.5) pts.push([x, c.f(x)]);
      l.poli(pts, 0, tinta, 0.35, 2.2);
      const span = c.x1 - c.x0;
      for (let k = 0; k < span / 9; k++) {
        const xa = c.x0 + ((k * 9 + t * 14) % span), xb = Math.min(c.x1, xa + 2.6);
        l.linea(xa, c.f(xa), 0, xb, c.f(xb), 0, tintaChiara, 0.85, 2.8);
      }
    }

    // archi della costellazione
    for (const ar of mondo.archi) {
      if (ar.prog <= 0) continue;
      const a = mondo.stelle[ar.a], b = mondo.stelle[ar.b];
      const ex = lerp(a.x, b.x, ar.prog), ey = lerp(a.y, b.y, ar.prog);
      l.linea(a.x, a.y, -0.5, ex, ey, -0.5, tintaChiara, 0.75, 2.4);
      if (ar.prog < 1) l.punto(ex, ey, 0, 2.6, bianco, 0.9);
    }

    // stelle e creature
    const ora = performance.now() / 1000;
    mondo.stelle.forEach((s, i) => {
      const batt = this.ridotti ? 0 : Math.sin(t * 1.9 + s.fase);
      const dist = Math.hypot(p.x - s.x, p.y - s.y);
      const inInc = mondo.incontro && mondo.incontro.i === i;
      if (s.stato === 'accesa') {
        const da = t - s.accesaDa, esplodi = clamp(1 - da / 0.8, 0, 1);
        l.punto(s.x, s.y, 0, 9 + 6 * esplodi + batt * 0.6, tintaChiara, 0.55);
        l.punto(s.x, s.y, 0.1, 3.2, bianco, 0.95);
        for (let k = 0; k < 8; k++) {
          const a = t * 0.3 + (k * TAU) / 8, r = k % 2 ? 2.2 : 4.4 + esplodi * 6;
          l.linea(s.x, s.y, 0, s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, 0, k % 2 ? tinta : bianco, 0.7, 1.6);
        }
      } else {
        l.punto(s.x, s.y, 0, 5 + batt * 0.8, tinta, 0.45);
        l.punto(s.x, s.y, 0.1, 1.6, bianco, 0.8);
        const r = 2.6 + batt * 0.3;
        l.linea(s.x - r, s.y, 0, s.x + r, s.y, 0, bianco, 0.6, 1.4);
        l.linea(s.x, s.y - r, 0, s.x, s.y + r, 0, bianco, 0.6, 1.4);
        for (let k = 0; k < s.livelloQuest; k++) l.punto(s.x - (s.livelloQuest - 1) * 0.9 + k * 1.8, s.y - 4.2, 0, 0.9, oro, 0.85); // difficoltà
        if (s.allenata) { // già conquistata nella Quest
          for (let k = 0; k < 16; k += 2) { const a = t * 0.5 + (k * TAU) / 16, b = a + TAU / 32; l.linea(s.x + Math.cos(a) * 6.5, s.y + Math.sin(a) * 6.5, 0, s.x + Math.cos(b) * 6.5, s.y + Math.sin(b) * 6.5, 0, oro, 0.7, 1.6); }
        }
      }
      // la creatura compare quando il pilota è vicino o durante l'incontro, e festeggia quando la stella si accende
      const um = this.umori[i] && this.umori[i].fino > ora ? this.umori[i].tipo : inInc ? 'mostra' : 'calmo';
      const vicino = clamp((46 - dist) / 18, 0, 1);
      const visibile = s.stato === 'accesa' ? (um === 'felice' ? 1 : 0) : Math.max(vicino, inInc ? 1 : 0);
      if (visibile > 0.01) {
        let cx = s.x, cy = s.y + 9, sc = 1, rot = 0;
        if (um === 'felice') { cy += Math.abs(Math.sin(ora * 9)) * 1.4; rot = Math.sin(ora * 6) * 0.15; }
        if (um === 'triste') cx += Math.sin(ora * 34) * 0.5;
        if (um === 'mostra') sc = 1.12;
        cy += Math.sin(ora * 1.3 + s.fase) * 0.6; // galleggia
        this.penna.imposta({ x: cx, y: cy, s: sc * (0.7 + 0.3 * visibile), rot, z: 0.3, alfa: visibile, toni: [tinta, accento, bianco, oro] });
        disegnaCreatura(this.penna, liv.creatura, ora + s.fase, { umore: um, guarda: Math.atan2(p.y - cy, p.x - cx) });
      }
    });

    // anelli-risposta
    const inc = mondo.incontro;
    if (inc) {
      for (const a of inc.anelli) {
        if (a.via) continue;
        const nasce = clamp((inc.t - a.nasce) / 0.5, 0, 1);
        const r = MONDO.raggioAnello * (0.4 + 0.6 * nasce) * (1 + 0.04 * Math.sin(ora * 3 + a.k));
        const pts = [];
        for (let k = 0; k <= 32; k++) { const ang = (k / 32) * TAU; pts.push([a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r]); }
        l.poli(pts, 0.2, tintaChiara, 0.85 * nasce, 2.6);
        for (let k = 0; k < 6; k++) { const ang = ora * 0.8 + (k * TAU) / 6; l.linea(a.x + Math.cos(ang) * (r + 0.5), a.y + Math.sin(ang) * (r + 0.5), 0.2, a.x + Math.cos(ang) * (r + 1.3), a.y + Math.sin(ang) * (r + 1.3), 0.2, bianco, 0.6 * nasce, 1.6); }
        const s = mondo.stelle[inc.i];
        l.linea(s.x, s.y, -0.2, a.x, a.y, -0.2, tinta, 0.12 * nasce, 1);
        // conferma: l'arco dorato si riempie mentre il pilota resta dentro l'anello
        if (inc.dentro && inc.dentro.k === a.k) {
          const fin = Math.min(1, inc.dentro.carica) * TAU, R = r + 1.6, n = Math.max(2, Math.ceil(fin / 0.2));
          const arco = [];
          for (let j = 0; j <= n; j++) { const ang = Math.PI / 2 - (fin * j) / n; arco.push([a.x + Math.cos(ang) * R, a.y + Math.sin(ang) * R]); }
          l.poli(arco, 0.25, oro, 0.95, 4);
          l.punto(a.x, a.y, 0.2, r * 2.4, oro, 0.12 + 0.25 * inc.dentro.carica);
        }
      }
    }

    // portale
    if (mondo.portaleAperto) {
      const P = MONDO.portale;
      for (let k = 0; k < 3; k++) {
        const n = 6 + k, r = P.r * (0.5 + k * 0.32), rot = t * (k % 2 ? -0.6 : 0.8);
        const pts = []; for (let j = 0; j < n; j++) { const a = rot + (j * TAU) / n; pts.push([P.x + Math.cos(a) * r, P.y + Math.sin(a) * r]); }
        l.poli(pts, 0, k === 1 ? bianco : tintaChiara, 0.8, 2.2, true);
      }
      l.punto(P.x, P.y, 0, 14 + Math.sin(t * 3) * 2, tintaChiara, 0.5);
      l.punto(P.x, P.y, 0.1, 4, bianco, 1);
      for (let yy = Math.max(0, p.y - 40); yy < P.y - P.r; yy += 6) l.linea(P.x, yy, -1, P.x, yy + 3, -1, tintaChiara, 0.18, 1.6);
    }

    // scia del pilota (le linee di velocità "a stelle in corsa" sono state tolte su richiesta del docente)
    const vel = Math.hypot(p.vx, p.vy);
    for (let i = 1; i < this.scia.length; i++) {
      const k = i / this.scia.length;
      const a = this.scia[i - 1], b = this.scia[i];
      l.linea(a[0], a[1], -0.1, b[0], b[1], -0.1, tinta, k * 0.5 * clamp(vel / 18, 0.15, 1), 1 + 3 * k);
    }
    this.part.disegna(l);
    this.disegnaPilota(p, tinta, bianco, oro);
    // pulviscolo davanti all'obiettivo (per ultimo: sta più vicino di tutto)
    if (!this.ridotti) for (const q of this.polvere) l.punto(q.x, q.y, q.z, q.size, q.c, q.a);
  }

  disegnaPilota(p, tinta, bianco, oro) {
    const l = this.lista, pen = this.penna;
    // sciarpa (energia): un nastro che si assottiglia
    const s = this.sciarpa;
    if (s) for (let i = 1; i < s.length; i++) { const k = 1 - i / s.length; l.linea(s[i - 1].x, s[i - 1].y, 0.35, s[i].x, s[i].y, 0.35, tinta, 0.95, 1.4 + 3.6 * k); }
    const visiera = hsl(195, 95, 62), corpo = [0.92, 0.95, 1];
    const rot = -p.rollio * 0.32 + (p.aTerra ? 0 : clamp(p.vy / 60, -0.15, 0.15) * -p.rollio);
    pen.imposta({ x: p.x, y: p.y, s: PS, rot, rollio: p.rollio, z: 0.5, alfa: 1, toni: [corpo, visiera, bianco, oro, tinta] });
    const sh = Math.sin(p.rollio) * 0.45; // il rollio sposta le parti in profondità: effetto carta
    // zaino a razzo (dietro)
    pen.poly([[-1.25 - sh, -0.7], [-0.75 - sh, -0.7], [-0.75 - sh, 0.95], [-1.25 - sh, 0.95]], true, 3, 1.6);
    pen.poly([[0.75 - sh, -0.7], [1.25 - sh, -0.7], [1.25 - sh, 0.95], [0.75 - sh, 0.95]], true, 3, 1.6);
    // fiamme
    if (p.spinge > 0.08) {
      const f = 0.8 + p.spinge * 1.8 + Math.sin(performance.now() / 40) * 0.25;
      for (const x of [-1 - sh, 1 - sh]) pen.poly([[x - 0.28, -0.75], [x, -0.75 - f], [x + 0.28, -0.75]], false, 4, 2);
    }
    // gambe
    const passo = p.aTerra ? 0 : Math.sin(performance.now() / 300) * 0.15;
    pen.poly([[-0.35, -0.85], [-0.5 + passo, -1.8], [-0.85 + passo, -1.95]], false, 0, 2);
    pen.poly([[0.35, -0.85], [0.5 - passo, -1.8], [0.85 - passo, -1.95]], false, 0, 2);
    // busto
    pen.poly([[-0.7, -0.85], [0.7, -0.85], [0.75, 0.9], [-0.75, 0.9]], true, 0, 2.2);
    pen.poly([[-0.72, -0.35], [0.72, -0.35]], false, 3, 1.6);
    pen.cerchio(0 + sh * 0.4, 0.3, 0.26, 1, 2, 10);
    // braccia
    const br = p.spinge > 0.1 ? 0.35 : 0;
    pen.poly([[-0.75, 0.8], [-1.35, 0.1 + br], [-1.25, -0.3 + br]], false, 0, 1.8);
    pen.poly([[0.75, 0.8], [1.35, 0.1 + br], [1.25, -0.3 + br]], false, 0, 1.8);
    // casco e visiera (la visiera si sposta con il rollio)
    pen.cerchio(0, 1.75, 0.95, 0, 2.2, 22);
    const vx = sh * 0.9;
    pen.poly(Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * TAU; return [vx + Math.cos(a) * 0.6, 1.8 + Math.sin(a) * 0.36]; }), true, 1, 2.2);
    pen.poly([[0.55, 2.5], [0.95, 3.25]], false, 2, 1.4);
    l.punto(...pen.tr(0.95, 3.25), 0.5, 0.7, tinta, 0.9);
    l.punto(p.x, p.y + 0.6 * PS, 0.4, 5 * PS, tinta, 0.08); // alone
  }
}

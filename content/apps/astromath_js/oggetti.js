// OGGETTI LIBERI DI ASTROMATH — l'imprevedibile del cielo: niente domande, niente penalità.
// Personaggi che dicono freddure, molle che rimbalzano, fuochi d'artificio a forma di curva,
// un buco nero che fa girare e rilancia, raffiche di vento a vettore, e (raro) un dodecaedro d'oro.
// Posizioni casuali per partita (seme), sempre lontane da stelle, anelli e portale.
// Durante un incontro gli oggetti non toccano il pilota: la risposta resta un atto volontario.

import { MONDO } from './mondo.js';
import { FREDDURE, PERSONAGGI } from './freddure.js';
import { occhi } from './creature.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** PRNG mulberry32 da una stringa */
function rngDa(seme) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seme.length; i++) h = Math.imul(h ^ seme.charCodeAt(i), 16777619);
  let s = h >>> 0;
  const next = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (a, b) => a + Math.floor(next() * (b - a + 1)), pick: (arr) => arr[Math.floor(next() * arr.length)] };
}

/** Curve dei fuochi d'artificio: punti in [-1, 1], nome e formula */
export const CURVE = [
  { nome: 'Rosa a quattro petali', tex: 'r = \\cos(2\\theta)', f: (u) => { const t = u * TAU; const r = Math.cos(2 * t); return [r * Math.cos(t), r * Math.sin(t)]; } },
  { nome: 'Curva di Lissajous', tex: 'x = \\sin 3t,\\ y = \\sin 2t', f: (u) => [Math.sin(3 * u * TAU), Math.sin(2 * u * TAU)] },
  { nome: 'Cardioide', tex: 'r = 1 + \\cos\\theta', f: (u) => { const t = u * TAU; const r = (1 + Math.cos(t)) / 2; return [r * Math.cos(t) - 0.25, r * Math.sin(t)]; } },
  { nome: 'Astroide', tex: 'x^{2/3} + y^{2/3} = 1', f: (u) => { const t = u * TAU; return [Math.cos(t) ** 3, Math.sin(t) ** 3]; } },
  { nome: 'Spirale di Archimede', tex: 'r = a\\,\\theta', f: (u) => { const t = u * 3 * TAU; const r = u; return [r * Math.cos(t), r * Math.sin(t)]; } },
  { nome: 'Rosa a tre petali', tex: 'r = \\sin(3\\theta)', f: (u) => { const t = u * Math.PI; const r = Math.sin(3 * t); return [r * Math.cos(t), r * Math.sin(t)]; } },
];

/** Tipi di oggetto: quanti per partita e quanto spazio vogliono attorno */
const TIPI = [
  { tipo: 'personaggio', n: 5, raggio: 4.5 },
  { tipo: 'molla', n: 3, raggio: 4.2 },
  { tipo: 'fuoco', n: 3, raggio: 3.5 },
  { tipo: 'buco', n: 1, raggio: 5 },
  { tipo: 'vento', n: 3, raggio: 4 },
];

export class Oggetti {
  /** @param mondo  il Mondo della partita (stelle già posizionate) @param seme stringa della partita */
  constructor(mondo, seme = 'astromath', { segreto = null, sentite = [] } = {}) {
    this.mondo = mondo;
    this.lista = [];
    const r = rngDa(`${seme}|oggetti`);
    const occupati = mondo.stelle.map((s) => ({ x: s.x, y: s.y, d: 26 })).concat([{ x: MONDO.portale.x, y: MONDO.portale.y, d: 22 }, { x: 0, y: 0, d: 18 }]);
    const libero = (x, y, d) => occupati.every((o) => Math.hypot(o.x - x, o.y - y) > o.d + d);
    const metti = (tipo, raggio) => {
      for (let k = 0; k < 200; k++) {
        const x = (r.next() * 2 - 1) * (MONDO.meta - 10), y = 14 + r.next() * (MONDO.tetto - 30);
        if (!libero(x, y, raggio + 8)) continue;
        occupati.push({ x, y, d: raggio + 8 });
        return { x, y };
      }
      return null;
    };
    // prima le freddure mai sentite su questo dispositivo; se sono finite, si ricomincia da tutte
    const nuove = FREDDURE.filter((f) => !sentite.includes(f.testo));
    const freddure = nuove.length >= 5 ? nuove : [...FREDDURE];
    for (const { tipo, n, raggio } of TIPI) {
      for (let i = 0; i < n; i++) {
        const pos = metti(tipo, raggio);
        if (!pos) continue;
        const o = { tipo, ...pos, x0: pos.x, y0: pos.y, raggio, fase: r.next() * TAU, stato: 'pronto', t: 0, attesa: 0 };
        if (tipo === 'personaggio') {
          const k = r.int(0, freddure.length - 1);
          const fr = freddure.splice(k, 1)[0] || FREDDURE[0];
          o.chi = fr.chi; o.testo = fr.testo;
        }
        if (tipo === 'fuoco') o.curva = r.int(0, CURVE.length - 1);
        if (tipo === 'vento') o.ang = r.next() * TAU;
        if (tipo === 'molla') o.lati = r.pick([5, 6, 8]);
        this.lista.push(o);
      }
    }
    // il dodecaedro d'oro: compare solo in alcune partite (decide chi crea gli oggetti)
    const vuoleSegreto = segreto == null ? r.next() < 0.3 : segreto;
    if (vuoleSegreto) { const pos = metti('segreto', 5); if (pos) this.lista.push({ tipo: 'segreto', ...pos, x0: pos.x, y0: pos.y, raggio: 5, fase: 0, stato: 'pronto', t: 0, attesa: 0 }); }
  }

  /** Interazioni con il pilota (a passo di simulazione). Gli eventi vanno nel mondo. */
  aggiorna(dt) {
    const m = this.mondo, p = m.pilota;
    const calmo = !!m.incontro; // durante un incontro gli oggetti stanno buoni
    for (const o of this.lista) {
      o.t += dt;
      o.attesa = Math.max(0, o.attesa - dt);
      // ogni oggetto galleggia un poco
      if (o.stato === 'pronto' && o.tipo !== 'buco') { o.x = o.x0 + Math.sin(o.t * 0.7 + o.fase) * 1.2; o.y = o.y0 + Math.sin(o.t * 0.9 + o.fase * 1.3) * 1.6; }
      const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1e-6;
      switch (o.tipo) {
        case 'personaggio':
          if (o.stato === 'pronto' && !calmo && d < o.raggio + 2) { o.stato = 'parla'; o.t = 0; m.emetti('freddura', { chi: o.chi, testo: o.testo, x: o.x, y: o.y, o }); }
          else if (o.stato === 'parla' && o.t > 5.5) { o.stato = 'via'; o.t = 0; }
          break;
        case 'molla':
          if (!calmo && o.attesa <= 0 && d < o.raggio + 1.8) {
            // rimbalzo elastico: la velocità si riflette sulla normale e prende slancio
            const nx = dx / d, ny = dy / d, vn = p.vx * nx + p.vy * ny;
            const v = Math.max(Math.hypot(p.vx, p.vy) * 1.15, 26);
            let rx = p.vx - 2 * Math.min(0, vn) * nx, ry = p.vy - 2 * Math.min(0, vn) * ny;
            const rn = Math.hypot(rx, ry) || 1;
            rx = (rx / rn) * 0.4 + nx * 0.6; ry = (ry / rn) * 0.4 + ny * 0.6;
            const k = Math.hypot(rx, ry) || 1;
            p.vx = (rx / k) * v; p.vy = (ry / k) * v;
            p.x = o.x + nx * (o.raggio + 2); p.y = o.y + ny * (o.raggio + 2);
            p.aTerra = false;
            o.attesa = 0.35; o.boing = 1;
            m.emetti('boing', { x: o.x, y: o.y, nx, ny });
          }
          if (o.boing) o.boing = Math.max(0, o.boing - dt * 1.6);
          break;
        case 'fuoco':
          if (o.stato === 'pronto' && !calmo && d < o.raggio + 2) { o.stato = 'botto'; o.t = 0; m.emetti('botto', { x: o.x, y: o.y, curva: CURVE[o.curva], o }); }
          else if (o.stato === 'botto' && o.t > 9) { o.stato = 'pronto'; o.t = 0; o.curva = (o.curva + 1) % CURVE.length; } // si ricarica con un'altra curva
          break;
        case 'buco': {
          if (calmo || o.attesa > 0) break;
          if (o.stato === 'pronto' && d < 17) {
            // attrazione e risucchio a spirale
            const f = 70 / Math.max(4, d);
            p.vx -= (dx / d) * f * dt - (-dy / d) * f * 0.6 * dt;
            p.vy -= (dy / d) * f * dt - (dx / d) * f * 0.6 * dt;
            if (d < 3.5) { o.stato = 'orbita'; o.t = 0; o.ang0 = Math.atan2(dy, dx); m.emetti('buco', { x: o.x, y: o.y }); }
          } else if (o.stato === 'orbita') {
            const a = o.ang0 + o.t * 6.5, R = 5 + o.t * 2;
            p.x = o.x + Math.cos(a) * R; p.y = o.y + Math.sin(a) * R; p.vx = 0; p.vy = 0;
            if (o.t > 1.6) {
              // lanciato verso l'alto, un po' di lato: l'infinito ti restituisce più su
              const lato = Math.cos(a) >= 0 ? 1 : -1;
              p.vx = lato * 14; p.vy = 40; p.aTerra = false;
              o.stato = 'pronto'; o.attesa = 4;
              m.emetti('buco-fuori', { x: p.x, y: p.y });
            }
          }
          break;
        }
        case 'vento':
          o.ang += dt * 0.15;
          if (!calmo && o.attesa <= 0 && d < o.raggio + 2.5) {
            p.vx += Math.cos(o.ang) * 30; p.vy += Math.sin(o.ang) * 30; p.aTerra = false;
            o.attesa = 1.5;
            m.emetti('vento', { x: o.x, y: o.y, ang: o.ang });
          }
          break;
        case 'segreto':
          if (o.stato === 'pronto' && !calmo && d < o.raggio + 2) { o.stato = 'preso'; o.t = 0; m.emetti('segreto', { x: o.x, y: o.y }); }
          break;
        default: break;
      }
    }
  }
}

// ------------------------------------------------------------------------------------------------
// Disegno (penna di disegno.js: coordinate locali, toni 0 tinta, 1 accento, 2 bianco, 3 oro)
// ------------------------------------------------------------------------------------------------
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));

const GLIFI = {
  pi(pen, t, g) { pen.poly(range(9, (i) => [-3.2 + i * 0.8, 2.6 + Math.sin(t * 3 + i * 0.7) * 0.15]), false, 0, 2.6); pen.poly([[-1.5, 2.6], [-1.8, -3]], false, 0, 2.6); pen.poly([[1.4, 2.6], [1.2, -2.3], [2.1, -3]], false, 0, 2.6); occhi(pen, 0, 0.6, 0.65, g, t, 'calmo', 0.42); },
  zero(pen, t, g) { pen.poly(range(25, (i) => { const a = (i / 24) * TAU; return [Math.cos(a) * 2.6, Math.sin(a) * 3.6]; }), true, 0, 2.6); occhi(pen, 0, 0.6, 0.8, g, t, 'calmo', 0.42); },
  radice(pen, t, g) { const w = Math.sin(t * 4) * 0.6; pen.poly([[-3.4, 0], [-2.6, 0.5], [-1.4, -2.6], [0.6, 3], [3.6, 3 + w]], false, 0, 2.6); occhi(pen, 0.9, 1.6, 0.55, g, t, 'calmo', 0.36); },
  infinito(pen, t, g) { pen.poly(range(41, (i) => { const u = (i / 40) * TAU, k = 1 + Math.sin(u) ** 2; return [(3.8 * Math.cos(u)) / k, (3.4 * Math.sin(u) * Math.cos(u)) / k]; }), true, 0, 2.6); occhi(pen, 0, 0, 2.4, g, t, 'calmo', 0.38); },
  percento(pen, t, g) { pen.poly([[2.6, 3.4], [-2.6, -3.4]], false, 0, 2.4); pen.cerchio(-1.9, 2.2, 1.1, 0, 2.2, 16); pen.cerchio(1.9, -2.2, 1.1, 0, 2.2, 16); pen.cerchio(-1.9 + Math.cos(g) * 0.4, 2.2 + Math.sin(g) * 0.4, 0.38, 2, 2.4, 8); pen.cerchio(1.9 + Math.cos(g) * 0.4, -2.2 + Math.sin(g) * 0.4, 0.38, 2, 2.4, 8); },
  triangolo(pen, t, g) { pen.poly([[-3.8, -2.4], [3.4, -2.4], [-1.2, 2.6]], true, 0, 2.6); pen.poly(range(7, (i) => { const a = Math.PI * (0.62 + 0.38 * (i / 6)); return [-1.2 + Math.cos(a) * 1.2, 2.6 + Math.sin(a) * -1.2 + 0]; }), false, 1, 1.4); occhi(pen, -0.4, -0.7, 0.7, g, t, 'calmo', 0.4); },
  x(pen, t, g) { const s = Math.sin(t * 3) * 0.4; pen.poly([[-2.6 + s, -3.2], [2.6 - s, 3.2]], false, 0, 2.8); pen.poly([[-2.6 - s, 3.2], [2.6 + s, -3.2]], false, 0, 2.8); occhi(pen, 0, 0.9, 0.7, g, t, 'calmo', 0.42); },
  parallele(pen, t, g) { for (const ox of [-1.3, 1.3]) { pen.poly([[ox - 1.1, -3.4], [ox + 1.1, 3.4]], false, 0, 2.6); occhi(pen, ox + 0.15, 0.9, 0, g, t + ox, 'calmo', 0.36); } },
  sette(pen, t, g) { pen.poly([[-2.4, 3], [2.6, 3], [-0.4, -3.4]], false, 0, 2.8); pen.poly([[-0.9, 0.2], [1.6, 0.2]], false, 1, 1.6); occhi(pen, -0.3, 1.9, 0.6, g, t, 'calmo', 0.36); },
};

/** Vertici e spigoli del dodecaedro regolare (per il segreto) */
const PHI = (1 + Math.sqrt(5)) / 2;
const DV = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) DV.push([a, b, c]);
for (const a of [-1, 1]) for (const b of [-1, 1]) { DV.push([0, a / PHI, b * PHI]); DV.push([a / PHI, b * PHI, 0]); DV.push([a * PHI, 0, b / PHI]); }
const DE = [];
for (let i = 0; i < DV.length; i++) for (let j = i + 1; j < DV.length; j++) { const d = Math.hypot(DV[i][0] - DV[j][0], DV[i][1] - DV[j][1], DV[i][2] - DV[j][2]); if (Math.abs(d - 2 / PHI) < 1e-6) DE.push([i, j]); }

/** Disegna tutti gli oggetti nella lista di disegno */
export function disegnaOggetti(scena, oggetti, ora, colori) {
  if (!oggetti) return;
  const l = scena.lista, pen = scena.penna, p = oggetti.mondo.pilota;
  const { tinta, accento, bianco, oro } = colori;
  for (const o of oggetti.lista) {
    const guarda = Math.atan2(p.y - o.y, p.x - o.x);
    switch (o.tipo) {
      case 'personaggio': {
        let alfa = 1, s = 1, dy = 0, rot = 0;
        if (o.stato === 'parla') { s = 1 + 0.12 * Math.max(0, Math.sin(o.t * 9)) * Math.exp(-o.t); rot = Math.sin(o.t * 6) * 0.12 * Math.exp(-o.t * 0.6); }
        if (o.stato === 'via') { alfa = clamp(1 - o.t / 1.2, 0, 1); dy = o.t * o.t * 6; rot = o.t * 4; s = 1 - o.t * 0.3; if (alfa <= 0) continue; }
        pen.imposta({ x: o.x, y: o.y + dy, s: s * 0.95, rot, z: 0.2, alfa, toni: [accento, tinta, bianco, oro] });
        (GLIFI[o.chi] || GLIFI.pi)(pen, ora + o.fase, guarda);
        break;
      }
      case 'molla': {
        const w = o.boing || 0, sq = 1 + Math.sin(ora * 30) * 0.25 * w;
        const pts = range(o.lati + 1, (i) => { const a = ora * 0.4 + o.fase + (i * TAU) / o.lati; return [o.x + Math.cos(a) * o.raggio * sq, o.y + Math.sin(a) * o.raggio / sq]; });
        l.poli(pts, 0.1, oro, 0.85, 2.6);
        const pts2 = range(o.lati + 1, (i) => { const a = -ora * 0.6 + o.fase + (i * TAU) / o.lati; return [o.x + Math.cos(a) * o.raggio * 0.55, o.y + Math.sin(a) * o.raggio * 0.55]; });
        l.poli(pts2, 0.1, bianco, 0.5 + 0.4 * w, 1.6);
        break;
      }
      case 'fuoco': {
        if (o.stato === 'pronto') {
          // un piccolo razzo con la miccia che sfrigola
          pen.imposta({ x: o.x, y: o.y, s: 1, rot: Math.sin(ora * 2 + o.fase) * 0.15, z: 0.1, alfa: 1, toni: [accento, tinta, bianco, oro] });
          pen.poly([[-1, -2.2], [1, -2.2], [1, 1.6], [0, 3.2], [-1, 1.6]], true, 0, 2.2);
          pen.poly([[-1, -2.2], [-1.8, -3.2], [-1, -1.4]], false, 1, 1.6);
          pen.poly([[1, -2.2], [1.8, -3.2], [1, -1.4]], false, 1, 1.6);
          pen.poly([[0, -2.2], [Math.sin(ora * 20) * 0.4, -3.6]], false, 3, 1.4);
          l.punto(o.x + Math.sin(ora * 20) * 0.4, o.y - 3.7, 0.2, 1.2 + Math.random() * 0.8, oro, 0.9);
        } else {
          // la curva si disegna e si spegne
          const c = CURVE[o.curva], prog = clamp(o.t / 0.9, 0, 1), spegni = clamp(1 - (o.t - 2.2) / 1.6, 0, 1), R = 13 * (0.6 + 0.4 * prog);
          const N = 120, fino = Math.floor(N * prog);
          let prev = null;
          for (let i = 0; i <= fino; i++) {
            const [u, v] = c.f(i / N);
            const q = [o.x + u * R, o.y + v * R];
            if (prev) l.linea(prev[0], prev[1], 0.15, q[0], q[1], 0.15, i % 2 ? oro : accento, 0.9 * spegni, 2.4);
            prev = q;
          }
        }
        break;
      }
      case 'buco': {
        const spin = ora * (o.stato === 'orbita' ? 6 : 1.4);
        for (let k = 0; k < 3; k++) {
          const pts = range(48, (i) => { const u = (i / 47) * TAU, kk = 1 + Math.sin(u) ** 2, R = 6 - k * 1.6; const x = (R * Math.cos(u)) / kk, y = (R * 0.9 * Math.sin(u) * Math.cos(u)) / kk; const a = spin * (k % 2 ? -1 : 1) * 0.3; return [o.x + x * Math.cos(a) - y * Math.sin(a), o.y + x * Math.sin(a) + y * Math.cos(a)]; });
          l.poli(pts, -0.2, k === 1 ? bianco : accento, 0.65 - k * 0.12, 2.2);
        }
        for (let i = 0; i < 14; i++) { const a = spin * 1.5 + i * 0.45, rr = 3 + ((i * 1.7 + ora * 4) % 11); l.punto(o.x + Math.cos(a) * rr, o.y + Math.sin(a) * rr * 0.7, 0.1, 0.5, bianco, 0.5 * (1 - rr / 14)); }
        l.punto(o.x, o.y, 0, 7, accento, 0.12);
        break;
      }
      case 'vento': {
        const L = 7, c = Math.cos(o.ang), s = Math.sin(o.ang), lamp = o.attesa > 1 ? 1 : 0.6;
        const coda = [o.x - c * L / 2, o.y - s * L / 2], testa = [o.x + c * L / 2, o.y + s * L / 2];
        l.linea(coda[0], coda[1], 0.1, testa[0], testa[1], 0.1, bianco, 0.75 * lamp, 2.6);
        for (const sgn of [-1, 1]) { const a = o.ang + Math.PI + sgn * 0.5; l.linea(testa[0], testa[1], 0.1, testa[0] + Math.cos(a) * 2.2, testa[1] + Math.sin(a) * 2.2, 0.1, bianco, 0.75 * lamp, 2.6); }
        for (let k = 0; k < 3; k++) { const f = ((ora * 1.6 + k / 3) % 1) - 0.5, ox = -s * (k - 1) * 1.3, oy = c * (k - 1) * 1.3; l.linea(o.x + ox + c * f * L, o.y + oy + s * f * L, 0.1, o.x + ox + c * (f * L + 1.4), o.y + oy + s * (f * L + 1.4), 0.1, tinta, 0.5, 1.4); }
        break;
      }
      case 'segreto': {
        if (o.stato === 'preso' && o.t > 1.2) break;
        const ra = ora * 0.7, rb = ora * 0.45, sc = 3 * (o.stato === 'preso' ? 1 + o.t * 2 : 1), alfa = o.stato === 'preso' ? 1 - o.t / 1.2 : 1;
        const P = DV.map(([x, y, z]) => { const x1 = x * Math.cos(ra) + z * Math.sin(ra), z1 = -x * Math.sin(ra) + z * Math.cos(ra); const y1 = y * Math.cos(rb) - z1 * Math.sin(rb); return [o.x + x1 * sc * 0.6, o.y + y1 * sc * 0.6]; });
        for (const [i, j] of DE) l.linea(P[i][0], P[i][1], 0.2, P[j][0], P[j][1], 0.2, oro, 0.9 * alfa, 2);
        l.punto(o.x, o.y, 0, 9, oro, 0.15 * alfa);
        break;
      }
      default: break;
    }
  }
}

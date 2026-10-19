// Grafica vettoriale per gli esercizi.
// Ogni funzione restituisce una stringa SVG che usa classi CSS (g-*) per i colori:
// così le figure seguono automaticamente il tema chiaro (LIM) o scuro.
// Le figure sono generate con i valori VERI del problema, non sono illustrazioni generiche.

const r2 = (v) => Math.round(v * 100) / 100;
const fmt = (n) => {
  const r = Math.round(n * 100) / 100;
  return String(r).replace('.', ',');
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(w, h, body, label, cls = '') {
  return `<svg class="g ${cls}" viewBox="0 0 ${r2(w)} ${r2(h)}" role="img" aria-label="${esc(label || 'Figura')}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

function text(x, y, s, cls = 'g-lbl', anchor = 'middle', size) {
  return `<text x="${r2(x)}" y="${r2(y)}" class="${cls}" text-anchor="${anchor}" dominant-baseline="middle"${size ? ` font-size="${size}"` : ''}>${esc(s)}</text>`;
}

// ---------------------------------------------------------------------------
// Piano cartesiano
// ---------------------------------------------------------------------------
/**
 * Piano cartesiano con funzioni, punti, segmenti, regioni.
 * @param {object} o
 *   xmin,xmax,ymin,ymax  finestra
 *   fns: [{ f:(x)=>y, cls:'g-fn1', domain:[a,b], label, dash }]
 *   points: [{ x, y, label, cls, open }]
 *   segs: [{ x1,y1,x2,y2, cls, dash }]
 *   vlines/hlines: [{ x|y, cls, label }]
 *   shade: [{ f, g, from, to, cls }]  (regione tra due funzioni)
 *   step: passo della griglia; labels: numeri sugli assi
 */
export function plane(o) {
  const { xmin = -6, xmax = 6, ymin = -6, ymax = 6 } = o;
  const W = o.width || 340;
  const H = o.height || Math.round((W * (ymax - ymin)) / (xmax - xmin));
  const pad = 14;
  const sx = (W - 2 * pad) / (xmax - xmin);
  const sy = (H - 2 * pad) / (ymax - ymin);
  const X = (x) => pad + (x - xmin) * sx;
  const Y = (y) => H - pad - (y - ymin) * sy;
  const step = o.step || niceStep(xmax - xmin);
  const ystep = o.ystep || niceStep(ymax - ymin);
  let g = '';
  if (o.grid !== false) {
    for (let x = Math.ceil(xmin / step) * step; x <= xmax + 1e-9; x += step) g += `<line class="g-grid" x1="${r2(X(x))}" y1="${pad}" x2="${r2(X(x))}" y2="${H - pad}"/>`;
    for (let y = Math.ceil(ymin / ystep) * ystep; y <= ymax + 1e-9; y += ystep) g += `<line class="g-grid" x1="${pad}" y1="${r2(Y(y))}" x2="${W - pad}" y2="${r2(Y(y))}"/>`;
  }
  // assi
  if (xmin <= 0 && xmax >= 0) g += `<line class="g-axis" x1="${r2(X(0))}" y1="${H - pad + 4}" x2="${r2(X(0))}" y2="${pad - 6}" marker-end="url(#g-arrow)"/>`;
  if (ymin <= 0 && ymax >= 0) g += `<line class="g-axis" x1="${pad - 4}" y1="${r2(Y(0))}" x2="${W - pad + 6}" y2="${r2(Y(0))}" marker-end="url(#g-arrow)"/>`;
  if (o.labels !== false) {
    const y0 = ymin <= 0 && ymax >= 0 ? Y(0) : H - pad;
    const x0 = xmin <= 0 && xmax >= 0 ? X(0) : pad;
    const lstep = o.labelStep || step * (Math.round((xmax - xmin) / step) > 14 ? 2 : 1);
    const lystep = o.labelYStep || ystep * (Math.round((ymax - ymin) / ystep) > 14 ? 2 : 1);
    for (let x = Math.ceil(xmin / lstep) * lstep; x <= xmax + 1e-9; x += lstep) {
      if (Math.abs(x) < 1e-9 || X(x) > W - pad - 4) continue;
      g += text(X(x), y0 + 11, fmt(x), 'g-tick');
    }
    for (let y = Math.ceil(ymin / lystep) * lystep; y <= ymax + 1e-9; y += lystep) {
      if (Math.abs(y) < 1e-9 || Y(y) < pad + 4) continue;
      g += text(x0 - 5, Y(y), fmt(y), 'g-tick', 'end');
    }
    if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) g += text(X(0) - 6, Y(0) + 10, 'O', 'g-tick', 'end');
    g += text(W - pad + 2, (ymin <= 0 && ymax >= 0 ? Y(0) : H - pad) - 9, o.xName || 'x', 'g-axname', 'end');
    g += text((xmin <= 0 && xmax >= 0 ? X(0) : pad) + 9, pad - 2, o.yName || 'y', 'g-axname', 'start');
  }
  // regioni
  for (const s of o.shade || []) {
    const n = 80;
    let pts = [];
    for (let i = 0; i <= n; i++) {
      const x = s.from + ((s.to - s.from) * i) / n;
      pts.push(`${r2(X(x))},${r2(Y(clampY(s.f(x))))}`);
    }
    for (let i = n; i >= 0; i--) {
      const x = s.from + ((s.to - s.from) * i) / n;
      pts.push(`${r2(X(x))},${r2(Y(clampY(s.g ? s.g(x) : 0)))}`);
    }
    g += `<polygon class="${s.cls || 'g-region'}" points="${pts.join(' ')}"/>`;
  }
  function clampY(y) {
    return Math.max(ymin - 1, Math.min(ymax + 1, y));
  }
  for (const v of o.vlines || []) g += `<line class="${v.cls || 'g-guide'}" x1="${r2(X(v.x))}" y1="${pad}" x2="${r2(X(v.x))}" y2="${H - pad}"/>` + (v.label ? text(X(v.x) + 4, pad + 8, v.label, 'g-lbl-sm', 'start') : '');
  for (const h of o.hlines || []) g += `<line class="${h.cls || 'g-guide'}" x1="${pad}" y1="${r2(Y(h.y))}" x2="${W - pad}" y2="${r2(Y(h.y))}"/>` + (h.label ? text(W - pad - 4, Y(h.y) - 8, h.label, 'g-lbl-sm', 'end') : '');
  // funzioni (campionate, con salti dove la funzione esce dalla finestra o non è definita)
  for (const fn of o.fns || []) {
    const [a, b] = fn.domain || [xmin, xmax];
    const n = fn.samples || 240;
    let d = '';
    let pen = false;
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      let y;
      try { y = fn.f(x); } catch { y = NaN; }
      if (!Number.isFinite(y) || y > ymax + (ymax - ymin) || y < ymin - (ymax - ymin)) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${r2(X(x))},${r2(Y(y))}`;
      pen = true;
    }
    g += `<path class="${fn.cls || 'g-fn1'}" d="${d}"${fn.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
    if (fn.label) {
      const lx = fn.labelX ?? (a + (b - a) * 0.85);
      let ly = fn.f(lx);
      if (Number.isFinite(ly)) {
        ly = Math.max(ymin + (ymax - ymin) * 0.08, Math.min(ymax - (ymax - ymin) * 0.08, ly));
        g += text(X(lx) + 4, Y(ly) - 10, fn.label, (fn.cls || 'g-fn1').replace('g-fn', 'g-fnl'), 'start');
      }
    }
  }
  for (const s of o.segs || []) g += `<line class="${s.cls || 'g-seg'}" x1="${r2(X(s.x1))}" y1="${r2(Y(s.y1))}" x2="${r2(X(s.x2))}" y2="${r2(Y(s.y2))}"${s.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
  // punti notevoli (intersezioni con gli assi, vertice) calcolati dalle funzioni
  const userPts = (o.points || []).map((p) => ({ ...p, px: X(p.x), py: Y(p.y) }));
  const notes = [];
  const defNotable = o.notable ?? (o.labels !== false);
  for (const fn of o.fns || []) {
    const kinds = fn.notable ?? defNotable;
    if (!kinds) continue;
    const want = kinds === true ? ['x', 'y', 'v'] : kinds;
    for (const pt of notablePoints(fn, { xmin, xmax, ymin, ymax }, want)) {
      if ((o.notableExcept || []).some((ex) => Math.abs(ex - pt.x) < 1e-6)) continue;
      const px = X(pt.x), py = Y(pt.y);
      if (userPts.some((u) => u.label && Math.hypot(u.px - px, u.py - py) < 8)) continue;
      if (notes.some((n) => Math.hypot(n.px - px, n.py - py) < 3)) continue;
      notes.push({ ...pt, px, py });
    }
  }
  for (const n of notes) g += `<circle class="g-pt g-pt-note" cx="${r2(n.px)}" cy="${r2(n.py)}" r="4"/>`;
  for (const p of userPts) g += `<circle class="${p.cls || 'g-pt'}${p.open ? ' open' : ''}" cx="${r2(p.px)}" cy="${r2(p.py)}" r="${p.r || 4.5}"/>`;
  // etichette: si sceglie per ognuna la posizione libera (niente sovrapposizioni tra etichette)
  const boxes = [];
  const place = (px, py, label, cls, prefer) => {
    const w = label.length * 6.6 + 6, h = 15;
    const cands = prefer ? [prefer] : [];
    cands.push([8, -11, 'start'], [-8, -11, 'end'], [8, 13, 'start'], [-8, 13, 'end'], [0, -16, 'middle'], [0, 18, 'middle']);
    for (const [dx, dy, anchor] of cands) {
      const x0 = anchor === 'start' ? px + dx : anchor === 'end' ? px + dx - w : px + dx - w / 2;
      const y0 = py + dy - h / 2;
      const inside = x0 >= 1 && x0 + w <= W - 1 && y0 >= 1 && y0 + h <= H - 1;
      const free = !boxes.some((b) => x0 < b.x + b.w && x0 + w > b.x && y0 < b.y + b.h && y0 + h > b.y);
      if (inside && free) { boxes.push({ x: x0, y: y0, w, h }); return text(px + dx, py + dy, label, cls, anchor); }
    }
    const [dx, dy, anchor] = cands[0];
    return text(px + dx, py + dy, label, cls, anchor);
  };
  for (const p of userPts) if (p.label) g += place(p.px, p.py, p.label, 'g-lbl-sm g-halo', p.dx != null || p.dy != null ? [p.dx ?? 8, p.dy ?? -10, p.anchor || 'start'] : null);
  for (const n of notes) g += place(n.px, n.py, `(${fmt(n.x)}; ${fmt(n.y)})`.replace(/-/g, '−'), 'g-note g-halo');
  return wrap(W, H, defs() + g, o.alt || 'Piano cartesiano', 'g-plane');
}

/** Intersezioni con gli assi e vertice (per le parabole), solo se hanno coordinate "pulite" */
const nice = (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
function notablePoints(fn, win, want) {
  const out = [];
  const [a, b] = fn.domain || [win.xmin, win.xmax];
  const f = (x) => { try { const y = fn.f(x); return Number.isFinite(y) ? y : NaN; } catch { return NaN; } };
  const inWin = (x, y) => x >= win.xmin - 1e-9 && x <= win.xmax + 1e-9 && y >= win.ymin - 1e-9 && y <= win.ymax + 1e-9;
  const add = (x, y, kind) => {
    x = Math.round(x * 1e6) / 1e6; y = Math.round(y * 1e6) / 1e6;
    if (Object.is(x, -0)) x = 0; if (Object.is(y, -0)) y = 0;
    if (inWin(x, y) && nice(x) && nice(y) && !out.some((p) => Math.abs(p.x - x) < 1e-6 && Math.abs(p.y - y) < 1e-6)) out.push({ x, y, kind });
  };
  if (want.includes('y') && a <= 0 && b >= 0) { const y0 = f(0); if (Number.isFinite(y0)) add(0, y0, 'y'); }
  if (want.includes('x')) {
    const n = 600;
    let px = a, py = f(a);
    for (let i = 1; i <= n; i++) {
      const x = a + ((b - a) * i) / n, y = f(x);
      if (Number.isFinite(y) && Math.abs(y) < 1e-12) add(x, 0, 'x');
      else if (Number.isFinite(py) && Number.isFinite(y) && py * y < 0) {
        let lo = px, hi = x, flo = py;
        for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2, fm = f(m); if (!Number.isFinite(fm)) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
        const r = (lo + hi) / 2;
        if (Math.abs(f(r)) < 1e-6) add(r, 0, 'x');
      }
      px = x; py = y;
    }
  }
  if (want.includes('v')) {
    // vertice solo se la funzione è davvero una parabola: controllo su più punti
    const c = f(0), p1 = f(1), m1 = f(-1);
    const A = (p1 + m1 - 2 * c) / 2, B = (p1 - m1) / 2;
    const isQuad = [2, -3, 0.5, 4.5].every((x) => Math.abs(f(x) - (A * x * x + B * x + c)) < 1e-7 * Math.max(1, Math.abs(f(x))));
    if (isQuad && Math.abs(A) > 1e-9) {
      const xv = -B / (2 * A);
      if (xv >= a && xv <= b) add(xv, f(xv), 'v');
    }
    // tangenza con l'asse x (radice doppia) già coperta dal vertice
  }
  return out;
}

function niceStep(range) {
  if (range <= 12) return 1;
  if (range <= 24) return 2;
  if (range <= 60) return 5;
  if (range <= 120) return 10;
  if (range <= 300) return 25;
  return Math.pow(10, Math.floor(Math.log10(range / 6)));
}

function defs() {
  return `<defs><marker id="g-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="g-arrowhead"/></marker></defs>`;
}

// ---------------------------------------------------------------------------
// Retta dei numeri (disequazioni, intervalli, confronto di numeri)
// ---------------------------------------------------------------------------
/**
 * @param o { min, max, marks:[{x,label,open,closed}], ranges:[{from,to}] (from/to = ±Infinity ammessi), ticks:true }
 */
export function numberLine(o) {
  const W = o.width || 360;
  const H = 74;
  const pad = 22;
  const X = (x) => pad + ((x - o.min) / (o.max - o.min)) * (W - 2 * pad);
  let g = `<line class="g-axis" x1="${pad - 10}" y1="40" x2="${W - pad + 12}" y2="40" marker-end="url(#g-arrow)"/>`;
  const st = o.step || niceStep(o.max - o.min);
  if (o.ticks !== false) {
    for (let x = Math.ceil(o.min / st) * st; x <= o.max + 1e-9; x += st) {
      g += `<line class="g-axis" x1="${r2(X(x))}" y1="35" x2="${r2(X(x))}" y2="45"/>`;
      if (o.tickLabels !== false && !(o.marks || []).some((m) => Math.abs(m.x - x) < st / 2)) g += text(X(x), 58, fmt(x), 'g-tick');
    }
  }
  for (const r of o.ranges || []) {
    const a = r.from === -Infinity ? pad - 10 : X(r.from);
    const b = r.to === Infinity ? W - pad + 6 : X(r.to);
    g += `<line class="g-range" x1="${r2(a)}" y1="40" x2="${r2(b)}" y2="40"/>`;
  }
  for (const m of o.marks || []) {
    g += `<circle class="g-pt${m.open ? ' open' : ''}" cx="${r2(X(m.x))}" cy="40" r="6"/>`;
    g += text(X(m.x), 18, m.label ?? fmt(m.x), 'g-lbl');
  }
  return wrap(W, H, defs() + g, o.alt || 'Retta dei numeri', 'g-line');
}

// ---------------------------------------------------------------------------
// Figure piane
// ---------------------------------------------------------------------------
/**
 * Poligono con etichette su lati, vertici e angoli retti. I punti sono in unità "matematiche";
 * la figura viene scalata e centrata automaticamente.
 * @param o { pts:[[x,y]...], sides:['a','b',…] (etichetta del lato i→i+1), vertices:['A',…],
 *            right:[indici dei vertici con angolo retto], fill:'g-fill1', extra:[{seg:[[x,y],[x,y]], dash, label}] , heights }
 */
export function polygon(o) {
  const W = o.width || 300;
  const H = o.height || 220;
  const all = o.pts.concat(...(o.extra || []).map((e) => e.seg || []));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const pad = 34;
  const s = Math.min((W - 2 * pad) / (maxx - minx || 1), (H - 2 * pad) / (maxy - miny || 1));
  const ox = (W - (maxx - minx) * s) / 2;
  const oy = (H - (maxy - miny) * s) / 2;
  const P = ([x, y]) => [ox + (x - minx) * s, H - oy - (y - miny) * s];
  const pts = o.pts.map(P);
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  let g = `<polygon class="${o.fill || 'g-fill1'} g-shape" points="${pts.map((p) => p.map(r2).join(',')).join(' ')}"/>`;
  for (const e of o.extra || []) {
    const [a, b] = e.seg.map(P);
    g += `<line class="${e.cls || 'g-seg'}" x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(b[0])}" y2="${r2(b[1])}"${e.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    if (e.label) g += text((a[0] + b[0]) / 2 + (e.dx || 10), (a[1] + b[1]) / 2 + (e.dy || 0), e.label, 'g-lbl', 'start');
  }
  (o.right || []).forEach((i) => {
    const p = pts[i];
    const a = pts[(i + pts.length - 1) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const u = norm([a[0] - p[0], a[1] - p[1]]);
    const v = norm([b[0] - p[0], b[1] - p[1]]);
    const k = 12;
    g += `<polyline class="g-mark" points="${r2(p[0] + u[0] * k)},${r2(p[1] + u[1] * k)} ${r2(p[0] + (u[0] + v[0]) * k)},${r2(p[1] + (u[1] + v[1]) * k)} ${r2(p[0] + v[0] * k)},${r2(p[1] + v[1] * k)}"/>`;
  });
  (o.sides || []).forEach((lab, i) => {
    if (!lab) return;
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const out = norm([mx - cx, my - cy]);
    g += text(mx + out[0] * 16, my + out[1] * 16, lab, 'g-lbl');
  });
  (o.vertices || []).forEach((lab, i) => {
    if (!lab) return;
    const p = pts[i];
    const out = norm([p[0] - cx, p[1] - cy]);
    g += text(p[0] + out[0] * 14, p[1] + out[1] * 14, lab, 'g-vtx');
  });
  return wrap(W, H, g, o.alt || 'Figura', 'g-fig');
}
const norm = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

export function circleFig({ r = 1, label = 'r', diameter = false, sector = null, fill = 'g-fill2', alt }) {
  const W = 240, H = 220, c = [120, 110], R = 82;
  let g = `<circle class="${fill} g-shape" cx="${c[0]}" cy="${c[1]}" r="${R}"/>`;
  if (sector) {
    const a = (sector * Math.PI) / 180;
    const x = c[0] + R * Math.cos(-a), y = c[1] + R * Math.sin(-a);
    g += `<path class="g-fill3" d="M${c[0]},${c[1]} L${c[0] + R},${c[1]} A${R},${R} 0 ${sector > 180 ? 1 : 0} 0 ${r2(x)},${r2(y)} Z"/>`;
    g += text(c[0] + 30 * Math.cos(-a / 2), c[1] + 30 * Math.sin(-a / 2), `${sector}°`, 'g-lbl-sm');
  }
  if (diameter) g += `<line class="g-seg" x1="${c[0] - R}" y1="${c[1]}" x2="${c[0] + R}" y2="${c[1]}"/>` + text(c[0], c[1] - 12, label, 'g-lbl');
  else g += `<line class="g-seg" x1="${c[0]}" y1="${c[1]}" x2="${c[0] + R}" y2="${c[1]}"/>` + text(c[0] + R / 2, c[1] - 12, label, 'g-lbl');
  g += `<circle class="g-pt" cx="${c[0]}" cy="${c[1]}" r="3.5"/>`;
  void r;
  return wrap(W, H, g, alt || 'Cerchio', 'g-fig');
}

// ---------------------------------------------------------------------------
// Solidi in assonometria
// ---------------------------------------------------------------------------
export function box({ a, b, c, labels = ['a', 'b', 'c'], alt }) {
  // parallelepipedo a×b×c in assonometria cavaliera
  const W = 300, H = 230;
  const k = 0.5, ang = Math.PI / 6;
  const m = Math.max(a + b * k * Math.cos(ang), c + b * k * Math.sin(ang));
  const s = 150 / m;
  const ox = 60, oy = 190;
  const P = (x, y, z) => [ox + (x + y * k * Math.cos(ang)) * s, oy - (z + y * k * Math.sin(ang)) * s];
  const v = {
    A: P(0, 0, 0), B: P(a, 0, 0), C: P(a, b, 0), D: P(0, b, 0),
    E: P(0, 0, c), F: P(a, 0, c), G: P(a, b, c), H: P(0, b, c),
  };
  const poly = (ps, cls) => `<polygon class="${cls}" points="${ps.map((p) => v[p].map(r2).join(',')).join(' ')}"/>`;
  let g = poly(['A', 'B', 'F', 'E'], 'g-fill1 g-shape') + poly(['B', 'C', 'G', 'F'], 'g-fill1b g-shape') + poly(['E', 'F', 'G', 'H'], 'g-fill1c g-shape');
  const hid = (p, q) => `<line class="g-hidden" x1="${r2(v[p][0])}" y1="${r2(v[p][1])}" x2="${r2(v[q][0])}" y2="${r2(v[q][1])}"/>`;
  g += hid('A', 'D') + hid('D', 'C') + hid('D', 'H');
  g += text((v.A[0] + v.B[0]) / 2, v.A[1] + 14, labels[0], 'g-lbl');
  g += text((v.B[0] + v.C[0]) / 2 + 14, (v.B[1] + v.C[1]) / 2 + 6, labels[1], 'g-lbl', 'start');
  g += text(v.A[0] - 12, (v.A[1] + v.E[1]) / 2, labels[2], 'g-lbl', 'end');
  return wrap(W, H, g, alt || 'Parallelepipedo', 'g-fig');
}

export function cylinder({ rLabel = 'r', hLabel = 'h', cone = false, alt }) {
  const W = 240, H = 240, cx = 120, rx = 70, ry = 20, top = 50, bot = 190;
  let g = '';
  if (cone) {
    g += `<path class="g-fill2 g-shape" d="M${cx - rx},${bot} L${cx},${top} L${cx + rx},${bot} A${rx},${ry} 0 0 1 ${cx - rx},${bot} Z"/>`;
    g += `<path class="g-hidden" d="M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}"/>`;
    g += `<line class="g-hidden" x1="${cx}" y1="${top}" x2="${cx}" y2="${bot}"/>`;
  } else {
    g += `<path class="g-fill2 g-shape" d="M${cx - rx},${top} L${cx - rx},${bot} A${rx},${ry} 0 0 0 ${cx + rx},${bot} L${cx + rx},${top}"/>`;
    g += `<ellipse class="g-fill2c g-shape" cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}"/>`;
    g += `<path class="g-hidden" d="M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}"/>`;
  }
  g += `<line class="g-seg" x1="${cx}" y1="${bot}" x2="${cx + rx}" y2="${bot}"/><circle class="g-pt" cx="${cx}" cy="${bot}" r="3"/>`;
  g += text(cx + rx / 2, bot + 14, rLabel, 'g-lbl');
  g += `<line class="g-dim" x1="${cx + rx + 16}" y1="${top}" x2="${cx + rx + 16}" y2="${bot}"/>`;
  g += text(cx + rx + 22, (top + bot) / 2, hLabel, 'g-lbl', 'start');
  return wrap(W, H, g, alt || (cone ? 'Cono' : 'Cilindro'), 'g-fig');
}

// ---------------------------------------------------------------------------
// Frazioni, tessere algebriche, circonferenza goniometrica
// ---------------------------------------------------------------------------
export function fractionBar(n, d, { alt, whole = 1 } = {}) {
  const W = 320, H = 56 * whole + 10;
  let g = '';
  for (let w = 0; w < whole; w++) {
    const cw = (W - 10) / d;
    for (let i = 0; i < d; i++) {
      const on = w * d + i < n;
      g += `<rect class="${on ? 'g-fill1 on' : 'g-cell'}" x="${r2(5 + i * cw)}" y="${5 + w * 56}" width="${r2(cw - 3)}" height="46" rx="5"/>`;
    }
  }
  return wrap(W, H, g, alt || `${n} parti su ${d}`, 'g-fig');
}

/** Quadrato (a+b)² scomposto in tessere: a², 2ab, b² */
export function squareTiles(a, b, { la = 'a', lb = 'b', alt } = {}) {
  const S = 200 / (a + b), o = 30;
  const A = a * S, B = b * S;
  let g = `<rect class="g-fill1" x="${o}" y="${o}" width="${r2(A)}" height="${r2(A)}"/>`;
  g += `<rect class="g-fill3" x="${r2(o + A)}" y="${o}" width="${r2(B)}" height="${r2(A)}"/>`;
  g += `<rect class="g-fill3" x="${o}" y="${r2(o + A)}" width="${r2(A)}" height="${r2(B)}"/>`;
  g += `<rect class="g-fill2" x="${r2(o + A)}" y="${r2(o + A)}" width="${r2(B)}" height="${r2(B)}"/>`;
  g += `<rect class="g-shape g-nofill" x="${o}" y="${o}" width="${r2(A + B)}" height="${r2(A + B)}"/>`;
  g += text(o + A / 2, o + A / 2, `${la}²`, 'g-lbl') + text(o + A + B / 2, o + A / 2, `${la}${lb}`, 'g-lbl-sm') + text(o + A / 2, o + A + B / 2, `${la}${lb}`, 'g-lbl-sm') + text(o + A + B / 2, o + A + B / 2, `${lb}²`, 'g-lbl-sm');
  g += text(o + A / 2, o - 12, la, 'g-lbl') + text(o + A + B / 2, o - 12, lb, 'g-lbl') + text(o - 12, o + A / 2, la, 'g-lbl') + text(o - 12, o + A + B / 2, lb, 'g-lbl');
  return wrap(260, 260, g, alt || 'Quadrato di un binomio', 'g-fig');
}

/** Circonferenza goniometrica con angolo in gradi */
export function unitCircle(deg, { showSin = true, showCos = true, alt } = {}) {
  const W = 260, H = 260, c = 130, R = 95;
  const a = (deg * Math.PI) / 180;
  const px = c + R * Math.cos(a), py = c - R * Math.sin(a);
  let g = `<line class="g-axis" x1="15" y1="${c}" x2="${W - 12}" y2="${c}" marker-end="url(#g-arrow)"/><line class="g-axis" x1="${c}" y1="${H - 15}" x2="${c}" y2="12" marker-end="url(#g-arrow)"/>`;
  g += `<circle class="g-shape g-nofill" cx="${c}" cy="${c}" r="${R}"/>`;
  const large = ((deg % 360) + 360) % 360 > 180 ? 1 : 0;
  g += `<path class="g-arc" d="M${c + 26},${c} A26,26 0 ${large} 0 ${r2(c + 26 * Math.cos(a))},${r2(c - 26 * Math.sin(a))}"/>`;
  g += `<line class="g-seg" x1="${c}" y1="${c}" x2="${r2(px)}" y2="${r2(py)}"/>`;
  if (showCos) g += `<line class="g-cos" x1="${c}" y1="${c}" x2="${r2(px)}" y2="${c}"/>`;
  if (showSin) g += `<line class="g-sin" x1="${r2(px)}" y1="${c}" x2="${r2(px)}" y2="${r2(py)}"/>`;
  g += `<circle class="g-pt" cx="${r2(px)}" cy="${r2(py)}" r="5"/>`;
  g += text(c + 40 * Math.cos(a / 2), c - 40 * Math.sin(a / 2), `${deg}°`, 'g-lbl-sm');
  g += text(c + R + 8, c + 12, '1', 'g-tick', 'start');
  return wrap(W, H, defs() + g, alt || `Circonferenza goniometrica, angolo di ${deg} gradi`, 'g-fig');
}

/** Diagramma ad albero per probabilità/combinatoria */
export function tree(levels, { alt } = {}) {
  // levels: [['T','C'], ['T','C']] → albero completo
  const leaves = levels.reduce((n, l) => n * l.length, 1);
  const W = Math.max(260, leaves * 34), H = 50 + levels.length * 70;
  let g = '';
  const draw = (x0, x1, depth, px, py) => {
    if (depth >= levels.length) return;
    const opts = levels[depth];
    const w = (x1 - x0) / opts.length;
    opts.forEach((lab, i) => {
      const x = x0 + w * (i + 0.5);
      const y = 40 + depth * 70 + 40;
      g += `<line class="g-seg" x1="${r2(px)}" y1="${r2(py)}" x2="${r2(x)}" y2="${r2(y - 12)}"/>`;
      g += `<circle class="g-node" cx="${r2(x)}" cy="${r2(y)}" r="12"/>` + text(x, y, lab, 'g-lbl-sm');
      draw(x0 + w * i, x0 + w * (i + 1), depth + 1, x, y + 12);
    });
  };
  g += `<circle class="g-pt" cx="${W / 2}" cy="22" r="5"/>`;
  draw(0, W, 0, W / 2, 22);
  return wrap(W, H, g, alt || 'Diagramma ad albero', 'g-fig');
}

/** Tabella HTML semplice (per dati, frequenze, valori di funzione) */
export function table(head, rows, { caption } = {}) {
  return `<div class="g-table-wrap"><table class="g-table">${caption ? `<caption>${esc(caption)}</caption>` : ''}<thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

/** Barre orizzontali/verticali in SVG per dati semplici (senza librerie) */
export function bars(labels, values, { alt, unit = '', max } = {}) {
  const W = 340, H = 200, pad = 30, bw = (W - 2 * pad) / labels.length;
  const M = max || Math.max(...values) * 1.15;
  let g = `<line class="g-axis" x1="${pad}" y1="${H - pad}" x2="${W - pad + 6}" y2="${H - pad}"/>`;
  values.forEach((v, i) => {
    const h = ((H - 2 * pad) * v) / M;
    const x = pad + i * bw + bw * 0.18;
    g += `<rect class="g-bar g-bar${i % 4}" x="${r2(x)}" y="${r2(H - pad - h)}" width="${r2(bw * 0.64)}" height="${r2(h)}" rx="3"/>`;
    g += text(x + bw * 0.32, H - pad - h - 9, fmt(v) + unit, 'g-lbl-sm');
    g += text(x + bw * 0.32, H - pad + 13, labels[i], 'g-tick');
  });
  return wrap(W, H, g, alt || 'Grafico a barre', 'g-fig');
}

export const svgUtil = { fmt, esc, text, wrap };

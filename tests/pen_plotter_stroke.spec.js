// @ts-check
/**
 * Qualità del tratto del Pen Plotter: ogni modalità viene generata con i parametri
 * di default e le metriche sono misurate in mm su globalElements (ciò che va in G-code).
 */
const { test, expect } = require('@playwright/test');

const APP = '/content/apps/pen_plotter__23v2_8K.html';

const MODES = ['harmonograph', 'spirograph', 'lsystem', 'flowfield', 'fractal', 'text',
  'fibonacci', 'tessellation', 'threed', 'turtle', 'noodles'];

const IMAGE_TYPES = ['hatching', 'spiral', 'contour', 'voronoi_stippling', 'fdog', 'linedraw_waves',
  'sawtooth_halftone', 'boxes_halftone', 'spiral_polygon', 'delaunay_image', 'springs_image',
  'implode_grid', 'ascii'];

// Difetti noti dei singoli generatori, da correggere nella fase 3: il test è atteso fallire.
// Quando un generatore viene corretto, test.fail segnala il passaggio: rimuovere la voce.
const KNOWN_ISSUES = {
  'harmonograph': 'il preset di default (damped_rotary) ha smorzamento minimo: spire successive quasi coincidenti (~3% ripassato)',
  'flowfield': 'il serpentino coherent_noise ripassa tratti delle righe adiacenti',
  'img:implode_grid': 'le linee della griglia implosa convergono e si sovrappongono'
};

// Calcolo delle metriche, eseguito nella pagina
function measureStrokes() {
  const penWidth = parseFloat(document.getElementById('paramPenWidth').value) || 0.6;
  const els = globalElements.filter(e => (e.type === 'path' || e.type === 'axis' || e.type === 'gcode-text') && e.points && e.points.length);
  const COVER_TOL = 0.03;
  const RETRACE_MIN_RUN = 5.0;
  const CELL = 1.0;
  const grid = new Map();
  const cellKey = (cx, cy) => cx + ',' + cy;
  const distSq = (p, a, b) => {
    let x = a.x, y = a.y, dx = b.x - x, dy = b.y - y;
    if (dx !== 0 || dy !== 0) {
      const t = Math.max(0, Math.min(1, ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy)));
      x += dx * t; y += dy * t;
    }
    return (p.x - x) ** 2 + (p.y - y) ** 2;
  };
  // Indice di tutti i segmenti, con path di appartenenza e ascissa curvilinea
  const insert = (a, b, pi, from, to) => {
    const x0 = Math.floor(Math.min(a.x, b.x) / CELL), x1 = Math.floor(Math.max(a.x, b.x) / CELL);
    const y0 = Math.floor(Math.min(a.y, b.y) / CELL), y1 = Math.floor(Math.max(a.y, b.y) / CELL);
    for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
      const k = cellKey(i, j);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push([a, b, pi, from, to]);
    }
  };
  // Un punto è "su altro inchiostro" se un segmento di un altro path, o dello stesso path
  // ma distante più di LAG mm lungo il tracciato, passa entro COVER_TOL (indipendente dall'ordine)
  const LAG = 1.0;
  const covered = (p, pi, at) => {
    const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const list = grid.get(cellKey(cx + i, cy + j));
      if (!list) continue;
      for (const s of list) {
        // Esclude i segmenti dello stesso path il cui intervallo [from, to] dista meno di LAG da 'at'
        if (s[2] === pi && at >= s[3] - LAG && at <= s[4] + LAG) continue;
        if (distSq(p, s[0], s[1]) <= COVER_TOL * COVER_TOL) return true;
      }
    }
    return false;
  };

  els.forEach((e, pi) => {
    let len = 0;
    for (let i = 1; i < e.points.length; i++) {
      const a = e.points[i - 1], b = e.points[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      insert(a, b, pi, len, len + d);
      len += d;
    }
  });

  let segs = 0, zero = 0, micro = 0, overlap = 0, retrace = 0, nearClosed = 0;
  els.forEach((e, pi) => {
    const P = e.points;
    let len = 0;
    let run = 0, runSegs = 0;
    const closeRun = () => { if (run >= RETRACE_MIN_RUN) retrace += runSegs; run = 0; runSegs = 0; };
    for (let i = 1; i < P.length; i++) {
      const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
      segs++; len += d;
      if (d < 0.005) zero++;
      else if (d < 0.1) micro++;
      const mid = { x: (P[i].x + P[i - 1].x) / 2, y: (P[i].y + P[i - 1].y) / 2 };
      if (d >= 0.005 && covered(P[i - 1], pi, len - d) && covered(P[i], pi, len) && covered(mid, pi, len - d / 2)) {
        overlap++; run += d; runSegs++;
      } else {
        closeRun();
      }
    }
    closeRun();
    const gap = Math.hypot(P[0].x - P[P.length - 1].x, P[0].y - P[P.length - 1].y);
    if (P.length > 3 && len > 3 * penWidth && gap > 0.01 && gap < penWidth / 2) nearClosed++;
  });

  return {
    paths: els.length,
    segs,
    zeroSeg: zero,
    microPct: +(100 * micro / Math.max(1, segs)).toFixed(2),
    overlapPct: +(100 * overlap / Math.max(1, segs)).toFixed(2),
    retracePct: +(100 * retrace / Math.max(1, segs)).toFixed(2),
    nearClosed
  };
}

async function setup(page) {
  page.on('dialog', d => d.dismiss());
  await page.goto(APP, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof setMode === 'function' && typeof generateGCode === 'function');
}

function expectCleanStrokes(m) {
  expect(m.paths, 'nessun percorso generato').toBeGreaterThan(0);
  expect(m.zeroSeg, 'segmenti di lunghezza nulla').toBe(0);
  expect(m.microPct, '% micro-segmenti < 0.1 mm').toBeLessThan(1);
  // Ritracciamento = tratto ripassato per almeno 5 mm; le sovrapposizioni brevi (overlapPct) sono volute dal disegno
  expect(m.retracePct, '% segmenti ritracciati (overdraw >= 5 mm)').toBeLessThan(1);
  expect(m.nearClosed, 'anelli quasi chiusi (gap < mezzo tratto)').toBe(0);
}

test.describe('Pen Plotter: qualità del tratto', () => {
  for (const mode of MODES) {
    test(`modalità ${mode}`, async ({ page }) => {
      test.fail(!!KNOWN_ISSUES[mode], KNOWN_ISSUES[mode]);
      await setup(page);
      await page.evaluate(m => { bypassComplexityCheck = true; setMode(m); }, mode);
      await page.waitForTimeout(mode === 'threed' || mode === 'text' ? 2500 : 1200);
      const m = await page.evaluate(measureStrokes);
      console.log(mode, JSON.stringify(m));
      expectCleanStrokes(m);
    });
  }

  for (const type of IMAGE_TYPES) {
    test(`immagine ${type}`, async ({ page }) => {
      test.fail(!!KNOWN_ISSUES['img:' + type], KNOWN_ISSUES['img:' + type]);
      await setup(page);
      await page.evaluate(async t => {
        const c = document.createElement('canvas');
        c.width = 400; c.height = 400;
        const x = c.getContext('2d');
        const gr = x.createRadialGradient(200, 200, 10, 200, 200, 200);
        gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff');
        x.fillStyle = gr; x.fillRect(0, 0, 400, 400);
        x.fillStyle = '#000'; x.font = 'bold 140px sans-serif'; x.fillText('Aé', 60, 260);
        const img = new Image();
        img.src = c.toDataURL();
        await img.decode();
        setMode('image', false);
        sourceImage = img;
        document.getElementById('imageProcessType').value = t;
        try { updateImageModeControls(); } catch (e) { }
        bypassComplexityCheck = true;
        processImage();
      }, type);
      await page.waitForTimeout(1500);
      const m = await page.evaluate(measureStrokes);
      console.log('img:' + type, JSON.stringify(m));
      expectCleanStrokes(m);
    });
  }

  // Linee nascoste 3D confrontate con il raycasting di Three.js (verità indipendente):
  // "mancanti" = punti visibili non disegnati, "fantasma" = spigoli nascosti disegnati
  test('3D: rimozione linee nascoste coerente con il raycasting', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => { bypassComplexityCheck = true; setMode('threed'); });
    await page.waitForTimeout(1500);
    const results = await page.evaluate(() => {
      const cases = [['cube', 'random'], ['mixed', 'fattammano'], ['mixed', 'spiral'], ['icosahedron', 'tree'], ['mixed', 'vertex_fractal']];
      const segDist = (q, a, b) => {
        const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L)) : 0;
        return Math.hypot(q.x - a.x - t * dx, q.y - a.y - t * dy);
      };
      return cases.map(([solid, pat]) => {
        document.getElementById('paramThreeDSolidType').value = solid;
        document.getElementById('paramThreeDPattern').value = pat;
        toggleThreeDControls();
        calculateThreeD();
        const aspect = threeDCamera.aspect;
        const sx = aspect > 1 ? 42 : 42 * aspect, sy = aspect > 1 ? 42 / aspect : 42;
        const lines = currentRawElements.map(e => e.points);
        const ray = new THREE.Raycaster();
        let total = 0, missing = 0, ghost = 0;
        threeDCubes.forEach(cube => {
          const g = extractGeometryData(cube);
          const wv = g.vertices.map(v => v.clone().applyMatrix4(cube.matrixWorld));
          g.edges.forEach(([i, j]) => {
            const e0 = wv[i].clone().project(threeDCamera), e1 = wv[j].clone().project(threeDCamera);
            const ed = { x: (e1.x - e0.x) * sx, y: (e1.y - e0.y) * sy };
            const el = Math.hypot(ed.x, ed.y);
            if (el < 1e-6) return;
            for (let k = 1; k < 8; k++) {
              const P = wv[i].clone().lerp(wv[j], k / 8);
              const dir = P.clone().sub(threeDCamera.position);
              const dist = dir.length();
              ray.set(threeDCamera.position, dir.normalize());
              const hits = ray.intersectObjects(threeDCubes, false);
              const visible = !hits.length || hits[0].distance > dist - 0.05;
              const pr = P.clone().project(threeDCamera);
              const q = { x: pr.x * sx, y: pr.y * sy };
              // solo linee parallele allo spigolo: un'altra linea visibile che lo incrocia non conta
              const drawn = lines.some(L => {
                for (let m = 1; m < L.length; m++) {
                  if (segDist(q, L[m - 1], L[m]) >= 0.002) continue;
                  const ld = { x: L[m].x - L[m - 1].x, y: L[m].y - L[m - 1].y };
                  if (Math.abs(ed.x * ld.y - ed.y * ld.x) / (el * Math.hypot(ld.x, ld.y) + 1e-12) < 0.01) return true;
                }
                return false;
              });
              total++;
              if (visible && !drawn) missing++;
              if (!visible && drawn) ghost++;
            }
          });
        });
        return { solid, pat, missingPct: 100 * missing / total, ghostPct: 100 * ghost / total };
      });
    });
    for (const r of results) {
      console.log('hlr', JSON.stringify(r));
      expect(r.missingPct, `${r.solid}/${r.pat}: spigoli visibili mancanti %`).toBeLessThan(0.5);
      expect(r.ghostPct, `${r.solid}/${r.pat}: spigoli nascosti disegnati %`).toBeLessThan(0.5);
    }
  });

  test('il testo produce contorni chiusi senza corde di chiusura', async ({ page }) => {
    await setup(page);
    const m = await page.evaluate(async () => {
      setMode('text', false);
      document.getElementById('paramTextInput').value = 'O';
      document.getElementById('paramTextProcessType').value = 'hatching';
      processText();
      await new Promise(r => setTimeout(r, 500));
      const loops = currentRawElements.filter(e => {
        const P = e.points;
        return P.length > 3 && Math.hypot(P[0].x - P[P.length - 1].x, P[0].y - P[P.length - 1].y) < 1e-9;
      });
      return { loops: loops.length };
    });
    // Contorno esterno + interno della "O"
    expect(m.loops).toBe(2);
  });
});

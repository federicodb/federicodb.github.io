// Cinematismi 3D: controlli geometrici in mm (ingranamento, contatto, stampabilità, piatti).
const { test, expect } = require('@playwright/test');
const URL = '/content/apps/ruota_quadrata_cinematismi.html';
test.setTimeout(240000);

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => { throw e; });
  await page.goto(URL);
  await page.waitForFunction(() => window.OCM && window.OCM.state.M, null, { timeout: 60000 });
});

// per ogni coppia dentata: nessuna compenetrazione, contatto entro la tolleranza in ogni posa
async function meshReport(page, mid, params) {
  return page.evaluate(([mid, params]) => {
    const O = window.OCM; O.setMech(mid); for (const k in params) O.state.P[mid][k] = params[k]; O.setMech(mid);
    const M = O.state.M, c = M.P.c, rep = [];
    M.mesh.forEach((pair, j) => {
      let maxOver = 0, minNear = 1e9, worstS = 0;
      const near = O.OFF(pair.body, c);
      for (let i = 2; i <= 98; i++) {
        const s = i / 100, b = pair.bodyPose(s), q = pair.partnerPose(s);
        const part = O.xf(pair.partner, q.x, q.y, q.rot);
        const over = Math.abs(O.areaP(O.I(O.xf(pair.body, b.x, b.y, b.rot), part)));
        const touch = Math.abs(O.areaP(O.I(O.xf(near, b.x, b.y, b.rot), part)));
        if (over > maxOver) { maxOver = over; worstS = s; }
        minNear = Math.min(minNear, touch);
      }
      rep.push({ pair: j, maxOver: +maxOver.toFixed(4), worstS, minNear: +minNear.toFixed(3) });
    });
    return rep;
  }, [mid, params]);
}

for (const [mid, params] of [['ruota', { n: 4 }], ['ruota', { n: 6, L: 24, K: 4 }], ['rulli', {}]]) {
  test(`${mid} ${JSON.stringify(params)}: i denti non si compenetrano e restano a contatto`, async ({ page }) => {
    const rep = await meshReport(page, mid, params);
    for (const r of rep) {
      expect(r.maxOver, JSON.stringify(r)).toBeLessThan(0.01);   // mm² di sovrapposizione (arrotondamenti)
      expect(r.minNear, JSON.stringify(r)).toBeGreaterThan(0.05); // allargando il corpo della tolleranza tocca sempre
    }
  });
}

for (const params of [{}, { zs: 12, zp: 12, N: 3, m: 1.25 }, { N: 5, zs: 20, zp: 11 }]) {
  test(`planetario ${JSON.stringify(params)}: ingranamento a ogni quota, senza compenetrazioni`, async ({ page }) => {
    const r = await page.evaluate((params) => {
      const O = window.OCM; O.setMech('planetario'); Object.assign(O.state.P.planetario, params); O.setMech('planetario');
      const M = O.state.M, h = M.P.h; let overS = 0, overR = 0, minTS = 1e9, minTR = 1e9;
      for (const z of [0, h / 4, h / 2, h]) for (let i = 0; i < 40; i++) for (const c of M.pipCheck(i / 40, z)) {
        overS = Math.max(overS, c.overSun); overR = Math.max(overR, c.overRing); minTS = Math.min(minTS, c.touchSun); minTR = Math.min(minTR, c.touchRing); }
      return { overS, overR, minTS, minTR, warns: M.warns };
    }, params);
    expect(r.warns, JSON.stringify(r)).toEqual([]);
    expect(r.overS, JSON.stringify(r)).toBeLessThan(0.01);
    expect(r.overR, JSON.stringify(r)).toBeLessThan(0.01);
    expect(r.minTS, JSON.stringify(r)).toBeGreaterThan(0.05);
    expect(r.minTR, JSON.stringify(r)).toBeGreaterThan(0.05);
  });
}

test('ruota: la primitiva rotola tangente alla catenaria', async ({ page }) => {
  const worst = await page.evaluate(() => {
    const O = window.OCM; O.setMech('ruota');
    const M = O.state.M, P = M.P, th = Math.PI / P.n, a = P.L / (2 * Math.tan(th)), ue = Math.asinh(Math.tan(th)), Per = 2 * a * ue, total = P.K * Per;
    const pts = []; const W = M.pitch;
    for (let i = 0; i < W.length; i++) { const A = W[i], B = W[(i + 1) % W.length]; for (let k = 0; k < 200; k++) pts.push([A[0] + (B[0] - A[0]) * k / 200, A[1] + (B[1] - A[1]) * k / 200]); }
    const road = x => { const X = x + total / 2, k = Math.min(P.K - 1, Math.max(0, Math.floor(X / Per))); return -a * Math.cosh((X - (k + .5) * Per) / a); };
    let lo = 1e9, hi = 0;
    for (let i = 5; i < 395; i++) { const q = M.poses(i / 400).ruota, cs = Math.cos(q.rot), sn = Math.sin(q.rot); let g = 1e9;
      for (const p of pts) { const x = q.x + p[0] * cs - p[1] * sn, y = q.y + p[0] * sn + p[1] * cs; if (Math.abs(x) < total / 2) g = Math.min(g, y - road(x)); }
      lo = Math.min(lo, g); hi = Math.max(hi, g); }
    return { lo, hi };
  });
  expect(worst.lo).toBeGreaterThan(-1e-6);
  expect(worst.hi).toBeLessThan(0.02);
});

test('stampabilità: niente pareti più sottili di 0,4 mm nei pezzi dentati', async ({ page }) => {
  const r = await page.evaluate(() => {
    const O = window.OCM, out = [];
    for (const mid of ['ruota', 'rulli']) { O.setMech(mid); const M = O.state.M;
      for (const p of M.parts) { const L = p.layers.find(l => l.t > 3) || p.layers[0];
        const paths = L.shapes.flatMap(sh => [O.polyP(sh.outer), ...sh.holes.map(h => O.polyP(h).reverse())]);
        const a0 = Math.abs(O.areaP(paths)), a1 = Math.abs(O.areaP(O.OFF(O.OFF(paths, -0.2), 0.2)));
        out.push({ mid, id: p.id, lost: +(a0 - a1).toFixed(3), frac: (a0 - a1) / a0 }); } }
    return out;
  });
  for (const x of r) expect(x.frac, JSON.stringify(x)).toBeLessThan(0.01);
});

test('Reuleaux: il rotore sta sempre nel foro e tocca i lati', async ({ page }) => {
  const r = await page.evaluate(() => {
    const O = window.OCM; O.setMech('reuleaux'); O.setTol(0.2);
    const M = O.state.M, P = M.P, S = P.W + P.c, out = M.parts.find(p => p.id === 'rotore').layers[0].shapes[0].outer;
    let maxOver = -1e9, maxPlay = 0;
    for (let i = 0; i < 360; i++) { const q = M.poses(i / 360).rotore, cs = Math.cos(q.rot), sn = Math.sin(q.rot);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of out) { const x = q.x + p[0] * cs - p[1] * sn, y = q.y + p[0] * sn + p[1] * cs; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      maxOver = Math.max(maxOver, x1 - S / 2, -S / 2 - x0, y1 - S / 2, -S / 2 - y0);
      maxPlay = Math.max(maxPlay, Math.abs((x1 - x0) - P.W), Math.abs((y1 - y0) - P.W)); }
    return { maxOver, maxPlay };
  });
  expect(r.maxOver).toBeLessThan(1e-3);
  expect(r.maxPlay).toBeLessThan(0.05);
});

test('Cardano: satellite dentro la corona per tutta la corsa, gioco piccolo', async ({ page }) => {
  const res = await page.evaluate(() => {
    const O = window.OCM, out = [];
    for (const [zp, m, c] of [[14, 1.5, 0.2], [18, 1.5, 0.2], [24, 2, 0.3], [30, 1, 0.1]]) {
      O.setMech('cardano'); O.state.P.cardano.m = m; O.state.P.cardano.zp = zp; O.setTol(c);
      const M = O.state.M, cav = O.polyP(M.cardano.cavity), pl = O.polyP(M.cardano.planetO);
      let over = 0, minTouch = 1e9;
      for (let i = 0; i < 90; i++) { const q = M.poses(i / 90).planet, body = O.xf([pl], q.x, q.y, q.rot);
        over = Math.max(over, Math.abs(O.areaP(O.D(body, [cav]))));
        minTouch = Math.min(minTouch, Math.abs(O.areaP(O.D(O.OFF(body, c), [cav])))); }
      out.push({ zp, m, c, over: +over.toFixed(4), minTouch: +minTouch.toFixed(3) });
    }
    return out;
  });
  for (const r of res) { expect(r.over, JSON.stringify(r)).toBeLessThan(0.01); expect(r.minTouch, JSON.stringify(r)).toBeGreaterThan(0.05); }
});

test('Cardano: il foro sulla primitiva traccia una retta', async ({ page }) => {
  const y = await page.evaluate(() => { const O = window.OCM; O.setMech('cardano'); O.setParam('dr', 1); const M = O.state.M, r = M.P.m * M.P.zp / 2; let m = 0;
    for (let i = 0; i < 100; i++) { const q = M.poses(i / 100).planet; m = Math.max(m, Math.abs(q.y + r * Math.sin(q.rot))); } return m; });
  expect(y).toBeLessThan(1e-9);
});

test('ogni pezzo è un solido unico chiuso (niente gusci separati, niente giunzioni a T)', async ({ page }) => {
  const r = await page.evaluate(() => {
    const O = window.OCM, out = [];
    for (const mid of ['ruota', 'reuleaux', 'rulli', 'cardano', 'planetario']) { O.setMech(mid);
      for (const p of (O.state.M.printParts || O.state.M.parts)) {
        const t = O.partMesh(p).tris, key = i => Math.round(t[i] * 1e3) + ',' + Math.round(t[i + 1] * 1e3) + ',' + Math.round(t[i + 2] * 1e3);
        const E = new Map(); let vol = 0;
        for (let i = 0; i < t.length; i += 9) { const k = [key(i), key(i + 3), key(i + 6)];
          if (k[0] === k[1] || k[1] === k[2] || k[0] === k[2]) continue;
          for (let j = 0; j < 3; j++) { const e = k[j] + '|' + k[(j + 1) % 3]; E.set(e, (E.get(e) || 0) + 1); }
          const a = [t[i], t[i + 1], t[i + 2]], b = [t[i + 3], t[i + 4], t[i + 5]], c = [t[i + 6], t[i + 7], t[i + 8]];
          vol += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6; }
        let open = 0; for (const [e, n] of E) { const [x, y] = e.split('|'); if ((E.get(y + '|' + x) || 0) !== n) open++; }
        let lv = vol; if (p.layers) { lv = 0; for (const L of p.layers) for (const sh of L.shapes) { lv += Math.abs(O.areaP([O.polyP(sh.outer)])) * L.t; for (const h of sh.holes) lv -= Math.abs(O.areaP([O.polyP(h)])) * L.t; } }
        out.push({ mid, id: p.id, open, vol: +vol.toFixed(1), lv: +lv.toFixed(1) }); } }
    return out;
  });
  for (const x of r) { expect(x.open, JSON.stringify(x)).toBe(0); expect(Math.abs(x.vol - x.lv) / x.lv, JSON.stringify(x)).toBeLessThan(1e-3); }
});

test('STL validi e pezzi che entrano nel piatto per ogni stampante', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const O = window.OCM, res = [];
    for (const pr of ['a1', 'a1mini']) for (const mid of ['ruota', 'reuleaux', 'rulli', 'cardano', 'planetario']) {
      O.setPrinter(pr); O.setMech(mid); const bed = O.PRINTERS[pr].bed, M = O.state.M, PP = M.printParts || M.parts, pl = O.packPlates(PP, bed);
      let stlOk = true;
      for (const p of PP) { const b = await O.partStl(p).arrayBuffer(); const dv = new DataView(b), n = dv.getUint32(80, true);
        if (b.byteLength !== 84 + 50 * n || n < 12) stlOk = false;
        let zmin = 1e9; for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) zmin = Math.min(zmin, dv.getFloat32(84 + 50 * i + 12 + k * 12 + 8, true));
        if (Math.abs(zmin) > 1e-4) stlOk = false; }
      res.push({ pr, mid, warns: M.warns.length, allFit: pl.every(x => x.items.every(i => i.fit)), stlOk });
    }
    return res;
  });
  for (const x of r) { expect(x.stlOk, JSON.stringify(x)).toBe(true); expect(x.allFit, JSON.stringify(x)).toBe(true); expect(x.warns, JSON.stringify(x)).toBe(0); }
});

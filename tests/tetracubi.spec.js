// @ts-check
// Tetracubi 3D (content/apps/tetracubi_3d.html, generato da tools/tetracubi_3d/).
// Laboratorio: codice del set riproducibile, piano di montaggio eseguibile, pezzi alti 20 mm,
// nessuno sbalzo oltre 45°, PDF di istruzioni. Gioco: discesa guidata e cursore della velocità.
// Ganci di prova: window.__lab e window.__t3.
const { test, expect } = require('@playwright/test');

test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const URL = '/content/apps/tetracubi_3d.html';

function sorveglia(page) {
  const errori = [];
  page.on('pageerror', (e) => errori.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errori.push('console: ' + m.text()); });
  return errori;
}

async function apri(page, url = URL) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' }));
      localStorage.removeItem('orfini_tetracubi_modo');
      localStorage.removeItem('orfini_tetracubi_velocita');
    } catch (e) { /* */ }
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__tcAvviato === true && !!window.__lab, null, { timeout: 30000 });
}

test('lo stesso codice ridà lo stesso set, anche da ?set=', async ({ page }) => {
  const errori = sorveglia(page);
  await apri(page, URL + '?set=444-7KQ2M');
  const a = await page.evaluate(() => ({ info: window.__lab.info(), plan: window.__lab.plan() }));
  expect(a.info.code).toBe('444-7KQ2M');
  expect(a.info.gapFree).toBe(true);
  expect(a.info.pieces).toBe(16);
  expect(await page.locator('#labCode').inputValue()).toBe('444-7KQ2M');
  // un altro set, poi di nuovo il codice scritto a mano (minuscole e O al posto di 0 accettate)
  await page.evaluate(() => window.__lab.regenerate());
  expect(await page.evaluate(() => window.__lab.info().code)).not.toBe('444-7KQ2M');
  await page.fill('#labCode', '444-7kq2m');
  await page.click('#btnCode');
  const b = await page.evaluate(() => window.__lab.plan());
  expect(b).toEqual(a.plan);
  await page.fill('#labCode', 'cubo');
  await page.click('#btnCode');
  await expect(page.locator('#labCode')).toHaveAttribute('aria-invalid', 'true');
  expect(errori).toEqual([]);
});

test('il piano di montaggio si esegue: ogni pezzo entra in linea retta', async ({ page }) => {
  await apri(page);
  for (const code of ['444-00001', '444-ZZZZZ', '442-3M9QX', '432-K0T7A', '222-00002']) {
    const { plan, box } = await page.evaluate((c) => { window.__lab.open(c); return { plan: window.__lab.plan(), box: window.__lab.box() }; }, code);
    const placed = new Set();
    const tot = box[0] * box[1] * box[2];
    for (const st of plan) {
      expect(st.forzato, `${code}: passo forzato`).toBe(false);
      for (const c of st.cells) {
        // dalla cella verso l'esterno, nella direzione d'ingresso, niente pezzi già montati
        for (let k = 1; ; k++) {
          const n = c.map((v, i) => v + st.d[i] * k);
          if (n.some((v, i) => v < 0 || v >= box[i])) break;
          expect(placed.has(n.join(',')), `${code}: ${st.name} urta`).toBe(false);
        }
      }
      for (const c of st.cells) placed.add(c.join(','));
    }
    expect(placed.size).toBe(tot);
  }
});

test('stampa: pezzi più alti 20 mm, gioco 0,2 mm, nessuno sbalzo oltre 45°', async ({ page }) => {
  await apri(page, URL + '?set=444-7KQ2M');
  const meshes = await page.evaluate(() => window.__lab.printMeshes());
  const normale = (a, b, c) => {
    const u = b.map((x, i) => x - a[i]), v = c.map((x, i) => x - a[i]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n);
    return len < 1e-9 ? null : n.map((x) => x / len);
  };
  let hMax = 0, controllate = 0;
  for (const m of meshes) {
    const zs = m.verts.map((v) => v[2]);
    hMax = Math.max(hMax, Math.max(...zs));
    expect(Math.min(...zs)).toBeCloseTo(0, 6);
    // un guscio convesso per cubetto (44 triangoli): le facce dentro un altro guscio non si stampano
    const gusci = [];
    for (let k = 0; k < m.tris.length; k += 44) gusci.push(m.tris.slice(k, k + 44));
    const dentro = (p, g) => g.every((t) => {
      const [a, b, c] = t.map((i) => m.verts[i]);
      const n = normale(a, b, c);
      return !n || n[0] * (p[0] - a[0]) + n[1] * (p[1] - a[1]) + n[2] * (p[2] - a[2]) < -1e-4;
    });
    gusci.forEach((g, gi) => {
      for (const t of g) {
        const [a, b, c] = t.map((i) => m.verts[i]);
        const n = normale(a, b, c);
        // faccia rivolta in basso più ripida di 45°: ammessa solo sul piatto o nascosta in un altro cubetto
        if (!n || n[2] >= -Math.SQRT1_2 - 1e-6) continue;
        if (Math.max(a[2], b[2], c[2]) < 1e-6) continue;
        const p = [0, 1, 2].map((i) => (a[i] + b[i] + c[i]) / 3);
        controllate++;
        expect(gusci.some((h, hi) => hi !== gi && dentro(p, h)), `sbalzo oltre 45° a z = ${p[2].toFixed(2)}`).toBe(true);
      }
    });
  }
  expect(controllate).toBeGreaterThan(0);
  expect(hMax).toBeCloseTo(20, 3);
  // un cubetto isolato: 10,1 mm di passo meno 0,2 di gioco
  const i = await page.evaluate(() => window.__lab.info());
  expect(i.maxPrintH).toBeCloseTo(20, 3);
  expect(i.unit).toBeCloseTo(10.1, 6);
  expect(i.fits).toBe(true);
});

test('il PDF delle istruzioni ha copertina e passi, con il codice nel nome', async ({ page }) => {
  test.setTimeout(120000);   // senza scheda grafica la codifica delle pagine è lenta
  const errori = sorveglia(page);
  await apri(page, URL + '?set=444-7KQ2M');
  const b64 = await page.evaluate(() => window.__lab.pdfBase64());
  const pdf = Buffer.from(b64, 'base64').toString('latin1');
  expect(pdf.startsWith('%PDF-1.4')).toBe(true);
  expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  expect(pdf).toContain('/Count 4');              // copertina + 16 passi su 3 pagine
  expect(pdf).toContain('set 444-7KQ2M');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#btnPdf')]);
  expect(download.suggestedFilename()).toBe('tetracubi-444-7KQ2M-istruzioni.pdf');
  const [d3mf] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
  expect(d3mf.suggestedFilename()).toBe('tetracubi-444-7KQ2M-a1.3mf');
  expect(errori).toEqual([]);
});

test('discesa guidata: il pezzo resta fermo finché non lo si fa scendere', async ({ page }) => {
  const errori = sorveglia(page);
  await apri(page);
  await page.click('.modebtn[data-modo="guidata"]');
  await expect(page.locator('#speedRow')).toBeHidden();
  await expect(page.locator('#guidedTag')).toBeVisible();
  await page.click('#btnPlay');
  const y0 = await page.evaluate(() => window.__t3.cur.y);
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__t3.cur.y)).toBe(y0);
  await page.evaluate(() => window.__t3.stepDown());
  expect(await page.evaluate(() => window.__t3.cur.y)).toBe(y0 - 1);
  // si ricorda la scelta
  expect(await page.evaluate(() => localStorage.getItem('orfini_tetracubi_modo'))).toBe('guidata');
  expect(errori).toEqual([]);
});

test('discesa automatica: il cursore moltiplica la velocità del livello', async ({ page }) => {
  await apri(page);
  await page.click('#btnPlay');
  await expect(page.locator('#speedRow')).toBeVisible();
  const base = await page.evaluate(() => window.__t3.gravMs());
  await page.locator('#speed').fill('200');
  expect(await page.evaluate(() => window.__t3.velocita)).toBe(2);
  await expect(page.locator('#speedVal')).toHaveText('×2,0');
  expect(await page.evaluate(() => window.__t3.gravMs())).toBe(Math.round(base / 2));
  const y0 = await page.evaluate(() => window.__t3.cur.y);
  await page.waitForFunction((y) => window.__t3.cur && window.__t3.cur.y < y, y0, { timeout: 10000 });
});

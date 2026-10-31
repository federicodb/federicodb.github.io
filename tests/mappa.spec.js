// @ts-check
// Mappa dei temi (galaxy.html): dati generati da build.py (mappa_build.py → galaxy_data.js), filtro visivo, zoom.
const { test, expect } = require('@playwright/test');

test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] } });

test.describe('Mappa dei temi', () => {
  test('nessun gruppo isolato, nessuna etichetta di classe, filtro per intersezione', async ({ page }) => {
    const errori = [];
    page.on('pageerror', (e) => errori.push(e.message));
    await page.goto('/galaxy.html');
    const dati = await page.evaluate(() => window.GALAXY);
    // ogni tema raggiunge Matematica (nodo 0) seguendo le linee
    const adj = dati.nodes.map(() => []);
    for (const [a, b] of dati.edges) { adj[a].push(b); adj[b].push(a); }
    const visti = new Set([0]); const coda = [0];
    while (coda.length) for (const v of adj[coda.shift()]) if (!visti.has(v)) { visti.add(v); coda.push(v); }
    expect(visti.size, 'temi collegati a Matematica').toBe(dati.nodes.length);
    for (const n of dati.nodes) expect(n.label).not.toMatch(/^[1-5] ?[A-Z]{2,}$|MAT_|CIT_|Biennio/i);

    await expect(page.locator('.tag-content.is-sun')).toHaveText('Matematica');
    await page.locator('.tag-content', { hasText: /^Polinomi$/ }).evaluate((e) => e.click());
    await expect(page.locator('#galaxy-panel')).toHaveClass(/open/);
    const uno = await page.locator('#gp-list li').count();
    await page.locator('.tag-content', { hasText: /^Prodotti notevoli$/ }).evaluate((e) => e.click());
    await expect(page.locator('#gp-chips button')).toHaveCount(2);
    const due = await page.locator('#gp-list li').count();
    expect(due).toBeGreaterThan(0);
    expect(due).toBeLessThanOrEqual(uno);
    await expect(page.locator('#gp-catalog')).toHaveAttribute('href', /index\.html\?tag=/);
    await page.locator('#gp-clear').click();
    await expect(page.locator('#galaxy-panel')).not.toHaveClass(/open/);
    expect(errori).toEqual([]);
  });

  test('da lontano resta leggibile solo Matematica, anche con la rotella sopra un\'etichetta', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/galaxy.html');
    await page.waitForTimeout(1500);
    const box = await page.locator('.tag-content.is-sun').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 400);
    await expect.poll(async () => page.evaluate(() => [...document.querySelectorAll('.galaxy-tag')]
      .filter((w) => w.style.visibility !== 'hidden').map((w) => w.textContent)), { timeout: 10000 }).toEqual(['Matematica']);
  });
});

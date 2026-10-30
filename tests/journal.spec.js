// @ts-check
// Journal (journal/, generato da build.py + journal_build.py): elenco, note, collegamenti alle attività, pagine senza JS.
// Le pagine si leggono dal disco: il test vale per qualunque insieme di note presente dopo il build.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NOTE = fs.existsSync(path.join(ROOT, 'journal'))
  ? fs.readdirSync(path.join(ROOT, 'journal'), { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== 'media').map(d => d.name)
  : [];

test.beforeEach(async ({ page }) => {
  // banner dei cookie già chiuso, per non coprire la pagina
  await page.addInitScript(() => localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, date: Date.now() })));
});

test.describe('Journal', () => {
  test('l\'elenco mostra tutte le note e ogni voce apre la sua pagina', async ({ page }) => {
    const errori = [];
    page.on('pageerror', e => errori.push(e.message));
    await page.goto('/journal/');
    await expect(page.getByRole('heading', { level: 1, name: 'Journal' })).toBeVisible();
    await expect(page.locator('.jr-item')).toHaveCount(Math.max(NOTE.length, 1));
    for (const nota of NOTE) await expect(page.locator(`.jr-item a[href="${nota}/"]`)).toHaveCount(1);
    expect(errori).toEqual([]);
  });

  for (const nota of NOTE) {
    test(`nota ${nota}: testo, formule, risorse e attività collegate`, async ({ page, request }) => {
      const errori = [];
      page.on('pageerror', e => errori.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errori.push(`${r.status()} ${r.url()}`); });
      await page.goto(`/journal/${nota}/`);
      await expect(page.locator('.jr-note h1')).not.toBeEmpty();
      await expect(page.locator('.jr-meta time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
      // nessuna formula lasciata come testo grezzo: ogni $...$ diventa KaTeX
      await page.waitForFunction(() => document.querySelectorAll('.jr-body .katex').length > 0 || !/\$/.test(document.querySelector('.jr-body').textContent));
      // ogni link interno (app, spiegazione, Quest, miniature) risponde
      const link = await page.locator('.jr a[href], .jr img[src]').evaluateAll(els => els
        .map(e => e.getAttribute('href') || e.getAttribute('src'))
        .filter(u => u && !/^(https?:|#|mailto:)/.test(u))
        .map(u => new URL(u, location.href).pathname));
      for (const u of new Set(link)) {
        expect((await request.get(decodeURI(u))).status(), u).toBe(200);
      }
      expect(errori).toEqual([]);
    });
  }

  test('il filtro ?attivita= mostra solo le note su quell\'attività', async ({ page }) => {
    test.skip(NOTE.length === 0, 'nessuna nota');
    await page.goto('/journal/');
    const prima = await page.locator('.jr-item').first().getAttribute('data-attivita');
    test.skip(!prima, 'la nota più recente non cita attività');
    const att = prima.split(' ')[0];
    await page.goto(`/journal/?attivita=${att}`);
    await expect(page.locator('.jr-filter')).toBeVisible();
    for (const li of await page.locator('.jr-item:visible').all()) {
      expect(` ${await li.getAttribute('data-attivita')} `).toContain(` ${att} `);
    }
  });
});

test.describe('Journal senza JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('elenco e note restano leggibili', async ({ page }) => {
    await page.goto('/journal/');
    await expect(page.locator('.jr-item')).toHaveCount(Math.max(NOTE.length, 1));
    for (const nota of NOTE) {
      await page.goto(`/journal/${nota}/`);
      await expect(page.locator('.jr-body')).not.toBeEmpty();
    }
  });
});

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
    for (const nota of NOTE) await expect(page.locator(`.jr-item h2 a[href="${nota}/"]`)).toHaveCount(1);
    expect(errori).toEqual([]);
  });

  test('ogni copertina dell\'elenco è generata dal build e si carica', async ({ page, request }) => {
    await page.goto('/journal/');
    for (const src of await page.locator('.jr-cover img').evaluateAll((els) => els.map((e) => new URL(e.getAttribute('src'), location.href).pathname))) {
      expect(src).toMatch(/\/journal\/[^/]+\/copertina\.webp$/);
      expect((await request.get(src)).status(), src).toBe(200);
    }
    await expect(page.locator('.jr-cover img')).toHaveCount(NOTE.length);
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

test.describe('Journal: collegamenti generati dal build', () => {
  for (const nota of NOTE) {
    test(`nota ${nota}: temi senza etichette di classe, competenze e note collegate`, async ({ page }) => {
      await page.goto(`/journal/${nota}/`);
      for (const t of await page.locator('.jr-tags a').allTextContents()) {
        expect(t, 'nessuna etichetta di classe o codice tra i temi').not.toMatch(/^[1-5] ?[A-Z]{2,}$|MAT_|CIT_|\$/);
      }
      for (const href of await page.locator('.jr-tags a').evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
        expect(href).toMatch(/index\.html\?tag=[^%]*(%[0-9A-F]{2}[^%]*)*$/);
        expect(href).not.toContain('%25');
      }
      for (const href of await page.locator('.jr-skills a').evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
        expect(href).toMatch(/competenze\.html#(MAT|CIT|IND|SOFT)_[A-Z]?\d$/);
      }
      for (const href of await page.locator('.jr-more a').evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
        expect(href).not.toBe(`../${nota}/`);
      }
      await expect(page.locator('.jr-colophon a[href^="https://github.com/"]').first()).toBeVisible();
    });
  }
});

test.describe('Journal: ricerca e filtro nel menu', () => {
  test('la ricerca filtra mentre si scrive, senza badare agli accenti, e resta nell\'indirizzo', async ({ page }) => {
    test.skip(NOTE.length < 2, 'servono almeno due note');
    await page.goto('/journal/');
    const prima = page.locator('.jr-item').first();
    const titolo = (await prima.locator('h2').textContent()).trim();
    const parola = titolo.split(/\s+/).find((w) => w.length > 5) || titolo.split(/\s+/)[0];
    await page.locator('#search-input').fill(parola.toUpperCase());
    await expect(prima).toBeVisible();
    for (const li of await page.locator('.jr-item:visible').all()) {
      expect(await li.getAttribute('data-testo')).toContain(parola.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    }
    await expect(page).toHaveURL(/[?&]q=/);
    await page.locator('#search-input').fill('zzqqnessunanota');
    await expect(page.locator('.jr-item:visible')).toHaveCount(0);
    await expect(page.locator('.jr-none')).toBeVisible();
  });

  test('il filtro per attività si apre dal pulsante e funziona anche da una nota', async ({ page }) => {
    test.skip(NOTE.length === 0, 'nessuna nota');
    await page.goto(`/journal/${NOTE[0]}/`);
    await page.locator('#filter-burger-btn').click();
    const chip = page.locator('#filter-dropdown .filter-chip[data-attivita]:not([data-attivita=""])').first();
    await expect(chip).toBeVisible();
    const att = await chip.getAttribute('data-attivita');
    await chip.click();
    await expect(page).toHaveURL(new RegExp(`/journal/\\?attivita=${att}`));
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

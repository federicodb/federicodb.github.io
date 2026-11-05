// @ts-check
// Orfini Math Quest: in ogni livello di ogni attività le formule sono disegnate da KaTeX, sia nella domanda
// sia nella correzione. Criterio in tests/helpers/formule.js: nessun $…$ o comando LaTeX visibile, nessun errore KaTeX.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { expectFormuleDisegnate } = require('./helpers/formule');

const PASSI = 4; // domande controllate per livello (domanda + correzione)
const CATALOGO = require('../allenamento/catalogo.json');

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('orfini_quest_v2', JSON.stringify({
    version: 2, onboarded: true, profile: { nickname: 'x', year: 1, indirizzo: null }, settings: { sound: false, haptics: false, teacher: true },
  })));
});

for (const { id } of CATALOGO) {
  test(`formule disegnate: ${id}`, async ({ page }) => {
    test.setTimeout(180000);
    const { allActivities } = await import(pathToFileURL(path.join(__dirname, '../allenamento/activities/catalogo.js')).href);
    const act = allActivities.find((a) => a.id === id);
    const livelli = act?.levels?.length || 1;
    const errori = [];
    page.on('pageerror', (e) => errori.push(e.message));
    for (let lv = 1; lv <= livelli; lv++) {
      await page.goto(`/allenamento/?test&docente#/lezione/${id}/${lv}`);
      for (let n = 0; n < PASSI; n++) {
        const primary = page.locator('.actionbar .btn.big');
        const presente = await primary.waitFor({ timeout: 15000 }).then(() => true, () => false);
        await expectFormuleDisegnate(page, `${id} livello ${lv}, domanda ${n + 1}`);
        if (!presente) break; // riepilogo di fine lezione: controllato sopra
        if (await primary.isDisabled()) {
          const right = page.locator('[data-input] [data-correct="1"]:not([disabled])');
          const input = page.locator('[data-input] input:not([type=range])').first();
          if (await right.count()) for (const b of await right.all()) await b.click();
          else if (await input.count()) await input.fill(await page.evaluate(() => String(window.__step?.answer ?? '').replace('.', ',')));
          else await page.evaluate(() => window.__solve?.());
        }
        if (await primary.isDisabled()) break; // domanda che non si risolve da qui: già controllata
        await primary.click(); // Verifica (o Avanti, nei passi di sola lettura)
        // dopo il clic: correzione con "Continua", oppure già la domanda successiva, oppure fine lezione
        let stato = '';
        await expect.poll(async () => (stato = await page.evaluate(() => {
          const bar = document.querySelector('.actionbar'), b = document.querySelector('.actionbar .btn.big');
          if (!b) return 'fine';
          if (bar && /\b(good|bad)\b/.test(bar.className)) return 'correzione';
          return b.disabled ? 'domanda' : 'attesa';
        })), { timeout: 8000 }).not.toBe('attesa').catch(() => {});
        if (stato === 'fine') break;
        if (stato !== 'correzione') continue;
        await expectFormuleDisegnate(page, `${id} livello ${lv}, correzione ${n + 1}`);
        await page.locator('.actionbar .btn.big').click(); // Continua
        if (!(await page.locator('.actionbar .btn.big').count())) break; // fine lezione
      }
    }
    if (errori.length) throw new Error(errori.join('\n'));
  });
}

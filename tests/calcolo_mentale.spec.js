// @ts-check
// Pagina "Calcolo veloce" (calcolo-mentale.html): schede, indirizzi diretti, verifica simbolica, esercizi.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // banner dei cookie già chiuso, per non coprire la pagina
  await page.addInitScript(() => localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, date: Date.now() })));
});

test.describe('Calcolo veloce', () => {
  test('schede di primo livello: clic, tastiera e indirizzo', async ({ page }) => {
    await page.goto('/calcolo-mentale.html');
    await expect(page.locator('#panel-metodo')).toBeVisible();
    await page.getByRole('tab', { name: 'Storia e critiche' }).click();
    await expect(page.locator('#panel-storia')).toBeVisible();
    await expect(page.locator('#panel-metodo')).toBeHidden();
    await expect(page).toHaveURL(/#storia$/);
    await expect(page.locator('#panel-storia')).toContainText('K. S. Shukla');
    // frecce della tastiera (WAI-ARIA tabs)
    await page.getByRole('tab', { name: 'Storia e critiche' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Per il docente' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-docente')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.getByRole('tab', { name: 'Il metodo' })).toHaveAttribute('aria-selected', 'true');
    // la tabella del docente elenca tutte le tecniche
    await page.getByRole('tab', { name: 'Per il docente' }).click();
    await expect(page.locator('#cm-teacher-table tbody tr')).toHaveCount(14);
  });

  test('indirizzo diretto (QR): tecnica e vista, con la verifica simbolica di nerdamer', async ({ page }) => {
    await page.goto('/calcolo-mentale.html#vicino-a-100/perche');
    await expect(page.getByRole('tab', { name: 'Le tecniche' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.cm-tech-head h2')).toHaveText('Numeri vicini a 100');
    await expect(page.locator('#vtab-perche')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#view-perche .cm-proof li')).toHaveCount(4);
    await expect(page.locator('#view-perche [data-verify-body] .cm-ok')).toContainText('identità verificata', { timeout: 15000 });
    // cambiando vista cambia l'indirizzo
    await page.locator('#vtab-esempi').click();
    await expect(page).toHaveURL(/#vicino-a-100\/esempi$/);
    await expect(page.locator('#view-esempi .cm-example')).toHaveCount(3);
  });

  test('prova tu: senza cronometro, aiuto dopo il primo errore, soluzione dopo il secondo, poi la risposta giusta', async ({ page }) => {
    await page.goto('/calcolo-mentale.html#quadrato-del-5/prova');
    const input = page.locator('#cm-answer');
    await input.fill('7');
    await page.getByRole('button', { name: 'Verifica' }).click();
    await expect(page.locator('[data-feedback]')).toContainText('Non ancora');
    await input.fill('8');
    await page.getByRole('button', { name: 'Verifica' }).click();
    await expect(page.locator('[data-feedback]')).toContainText('Ecco come si fa');
    // nuovo esercizio, risposta giusta letta dalla formula (n^2)
    await page.getByRole('button', { name: 'Nuovo esercizio' }).click();
    const tex = await page.locator('[data-q] annotation').first().textContent();
    const n = Number(tex.match(/(\d+)\^2/)[1]);
    await input.fill(String(n * n));
    await page.getByRole('button', { name: 'Verifica' }).click();
    await expect(page.locator('[data-feedback] .cm-ok')).toContainText('Giusto');
  });

  test('link alla Quest e voce di menu dalla home', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#main-nav .nav-links .nav-link').nth(2)).toHaveText('Calcolo veloce');
    await page.locator('#main-nav .nav-links .nav-link').nth(2).click();
    await expect(page).toHaveURL(/calcolo-mentale\.html/);
    await page.goto('/calcolo-mentale.html#per-11');
    await expect(page.locator('.cm-quest')).toHaveAttribute('href', 'allenamento/#/lezione/calcolo-per-11/1');
  });
});

test.describe('Calcolo veloce sul telefono', () => {
  test.use({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true });

  test('elenco delle tecniche a schede compatte, nessuno sforamento in nessuna scheda', async ({ page }) => {
    await page.goto('/calcolo-mentale.html#tecniche');
    await expect(page.locator('#cm-index-list')).toBeHidden();
    await page.locator('#cm-index-toggle').tap();
    await expect(page.locator('#cm-index-list')).toBeVisible();
    await page.locator('#cm-index-list a[data-trick="prova-del-9"]').tap();
    await expect(page.locator('#cm-index-list')).toBeHidden();
    await expect(page.locator('#cm-index-current')).toHaveText('La prova del 9');
    await expect(page).toHaveURL(/#prova-del-9$/);
    for (const hash of ['metodo', 'tecniche', 'storia', 'docente', 'ricarico-e-margine/perche', 'triangolo-dei-coefficienti/esempi', 'lavorare-insieme/prova']) {
      await page.goto(`/calcolo-mentale.html#${hash}`);
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), hash).toBe(0);
    }
  });
});

// @ts-check
// Uso offline del sito (sw.js): dopo una visita con la rete, catalogo, app aperte e Journal si riaprono senza rete.
const { test, expect } = require('@playwright/test');

test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] } });

test('dalla seconda visita catalogo, un\'app e il Journal si aprono senza rete', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, date: Date.now() })));
  await page.goto('/index.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // ora il service worker controlla la pagina e salva ciò che si apre
  await expect(page.locator('.card').first()).toBeVisible();
  await page.goto('/content/apps/math_bubble_equazione_della_retta.html');
  await expect(page.locator('#playerName')).toBeVisible();
  await page.goto('/journal/');
  await expect(page.locator('.jr-item').first()).toBeVisible();

  await context.setOffline(true);
  await page.goto('/index.html');
  await expect(page.locator('.card').first()).toBeVisible();
  await page.goto('/content/apps/math_bubble_equazione_della_retta.html');
  await expect(page.locator('#playerName')).toBeVisible();
  await page.goto('/journal/');
  await expect(page.locator('.jr-item').first()).toBeVisible();
  await context.setOffline(false);
});

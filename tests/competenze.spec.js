// @ts-check
// Competenze: per ogni voce attività, verifiche e allenamenti; Quadro d'insieme della copertura della rubrica.
const { test, expect } = require('@playwright/test');

test('quadro d\'insieme e voci con attività, verifiche e allenamenti', async ({ page }) => {
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.goto('/competenze.html');
  await expect(page.locator('#MAT_K1 .skill-links a').first()).toBeVisible();
  await expect(page.locator('#MAT_K1 .skill-links')).toContainText('verifiche nell\'Archivio');
  await expect(page.locator('#MAT_K1 .skill-links .katex').first()).toBeVisible(); // titoli con formule resi da KaTeX
  await page.locator('.cat-btn[data-target="quadro"]').click();
  await expect(page.locator('.quadro-numeri')).toContainText('attività interattive');
  expect(await page.locator('.quadro-riga').count()).toBeGreaterThan(20);
  await page.locator('.quadro-riga', { hasText: 'MAT_A3' }).click();
  await expect(page.locator('#MAT_A3')).toBeVisible();
  expect(errori).toEqual([]);
});

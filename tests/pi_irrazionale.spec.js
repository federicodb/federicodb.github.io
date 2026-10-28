// @ts-check
// App "π is irrational" (content/apps/pi_is_irrational.html): tappe, conti mostrati, slider veri, domande e Spiegami.
const { test, expect } = require('@playwright/test');

const URL = '/content/apps/pi_is_irrational.html';
const disegno = page => page.evaluate(() => /** @type {HTMLCanvasElement} */ (document.getElementById('stage')).toDataURL());

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, date: Date.now() })));
});

test.describe('π is irrational', () => {
  test('schede: clic, tastiera e indirizzo diretto, senza errori', async ({ page }) => {
    const errori = [];
    page.on('pageerror', e => errori.push(e.message));
    await page.goto(URL + '#lancette');
    await expect(page.locator('#panel-lancette')).toBeVisible();
    await expect(page.locator('#panel-ruota')).toBeHidden();
    await page.getByRole('tab', { name: /Le cifre/ }).click();
    await expect(page).toHaveURL(/#cifre$/);
    await page.getByRole('tab', { name: /Le cifre/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /Verifica/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-verifica')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.locator('#panel-ruota')).toBeVisible();
    expect(errori).toEqual([]);
  });

  test('tappa 1: la ruota arriva tra 3,14 e 3,15', async ({ page }) => {
    await page.goto(URL + '#ruota');
    await page.locator('#r-k').fill('1000');
    await page.locator('#r-lens button[data-v="2"]').click();
    await expect(page.locator('#r-read')).toContainText('tra 3,14 e 3,15');
    await page.locator('#r-lens button[data-v="4"]').click();
    await expect(page.locator('#r-read')).toContainText('tra 3,1415 e 3,1416');
  });

  test('tappa 2: avanzo e sforamento per q = 1, 7, 113', async ({ page }) => {
    await page.goto(URL + '#unita');
    await expect(page.locator('#u-read')).toContainText('avanza 0,14');
    await page.locator('#u-quick button[data-v="7"]').click();
    await expect(page.locator('#u-read')).toContainText('22/7');
    await expect(page.locator('#u-read')).toContainText('sfora di 0,0089');
    await page.locator('#u-quick button[data-v="113"]').click();
    await expect(page.locator('#u-read')).toContainText('355/113');
    await expect(page.locator('#u-read')).toContainText('sfora di 0,000030');
    await expect(page.locator('#u-prove tr.best')).toContainText('355/113');
  });

  test('tappa 3: con r = p/q il disegno si chiude dopo q giri, con π mai', async ({ page }) => {
    await page.goto(URL + '#lancette');
    await page.locator('#l-j7').click();
    await expect(page.locator('#stage-status')).toHaveText('chiuso dopo 7 giri');
    await page.locator('#l-r button[data-v="7/2"]').click();
    await page.locator('#l-j7').click();
    await expect(page.locator('#stage-status')).toHaveText('chiuso dopo 2 giri');
    await page.locator('#l-r button[data-v="pi"]').click();
    await page.locator('#l-j7').click();
    await expect(page.locator('#stage-status')).toHaveText('dopo 7 giri: distanza 0,056');
    await page.locator('#l-j113').click();
    await expect(page.locator('#stage-status')).toHaveText('dopo 113 giri: distanza 0,00019');
    await expect(page.locator('#l-read')).not.toContainText('si è chiuso');
    // frazione scelta dallo studente, ridotta: 10/6 = 5/3 si chiude dopo 3 giri
    await page.locator('#l-r button[data-v="libera"]').click();
    await page.locator('#l-p').fill('10');
    await page.locator('#l-q').fill('6');
    await page.locator('#l-q').dispatchEvent('change');
    await expect(page.locator('#l-free-red')).toHaveText('= 5/3 ridotta');
    await page.locator('#l-j7').click();
    await expect(page.locator('#stage-status')).toHaveText('chiuso dopo 3 giri');
  });

  test('tappa 4: periodi delle frazioni e caccia al periodo', async ({ page }) => {
    await page.goto(URL + '#cifre');
    await page.locator('#c-all').click();
    await expect(page.locator('#c-read')).toContainText('Periodo: 142857');
    await page.locator('#c-frac button[data-v="3/8"]').click();
    await page.locator('#c-all').click();
    await expect(page.locator('#c-read')).toContainText('decimale finito');
    await page.locator('#c-frac button[data-v="5/12"]').click();
    await page.locator('#c-all').click();
    await expect(page.locator('#c-read')).toContainText('Periodo: 6.');
    await page.locator('#c-view button[data-v="caccia"]').click();
    await page.locator('#c-tryall').click();
    await expect(page.locator('#c-read')).toContainText('nessun periodo da 1 a 120 funziona');
    await page.locator('#c-num button[data-v="22/7"]').click();
    await page.locator('#c-tryall').click();
    await expect(page.locator('#c-read')).toContainText('il periodo più corto è di 6 cifre');
    await page.locator('#c-num button[data-v="355/113"]').click();
    await expect(page.locator('#c-read')).toContainText('le prime 6 cifre decimali');
    await page.locator('#c-tryall').click();
    await expect(page.locator('#c-read')).toContainText('il periodo più corto è di 112 cifre');
  });

  test('niente slider finti: ogni slider cambia il disegno', async ({ page }) => {
    await page.goto(URL + '#ruota');
    await page.waitForTimeout(300);
    for (const [tappa, id, valore] of [['ruota', '#r-k', '500'], ['unita', '#u-q', '9'], ['cifre', '#c-L', '7']]) {
      await page.getByRole('tab', { name: new RegExp({ ruota: 'Srotola', unita: 'unità', cifre: 'Le cifre' }[tappa]) }).click();
      if (tappa === 'cifre') await page.locator('#c-view button[data-v="caccia"]').click();
      await page.waitForTimeout(150);
      const prima = await disegno(page);
      await page.locator(id).fill(valore);
      await page.waitForTimeout(150);
      expect(await disegno(page), `lo slider ${id} deve cambiare il disegno`).not.toBe(prima);
    }
  });

  test('domande di previsione e verifica finale', async ({ page }) => {
    await page.goto(URL + '#ruota');
    const quiz = page.locator('.quiz[data-quiz="ruota"]');
    await quiz.getByRole('button', { name: 'Tra 3 e 4' }).click();
    await expect(quiz.locator('.feedback')).toContainText('Giusto.');
    await page.goto(URL + '#verifica');
    await expect(page.locator('#v-grid > .card')).toHaveCount(10);
    await page.locator('#v-grid > .card').nth(2).getByRole('button', { name: 'irrazionale' }).click();
    await page.locator('#v-grid > .card').nth(0).getByRole('button', { name: 'irrazionale' }).click();
    await expect(page.locator('#v-score')).toHaveText('Risposte date: 2 su 10 · giuste: 1');
    await expect(page.locator('#v-grid > .card').nth(0).locator('.feedback')).toContainText('314/100');
  });

  test('Spiegami: apre la scena della tappa e si chiude', async ({ page }) => {
    await page.goto(URL + '#unita');
    await page.locator('#panel-unita .mini-explain').click();
    await expect(page.locator('#explain')).toBeVisible();
    await expect(page.locator('#explainFrame')).toHaveAttribute('src', 'pi_is_irrational_spiegazione.html?embed=1#unita');
    const frame = page.frameLocator('#explainFrame');
    await expect(frame.locator('#time')).toContainText('0:17');
    await page.keyboard.press('Escape');
    await expect(page.locator('#explain')).toBeHidden();
  });
});

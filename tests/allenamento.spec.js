// @ts-check
// Orfini Math Quest (/allenamento/): primo avvio, una lezione completa, collegamenti dal sito.
const { test, expect } = require('@playwright/test');

/** Primo avvio della Quest: avatar, nickname, classe, indirizzo, obiettivo */
async function completeOnboarding(page, { indirizzo = 'meccanico', home = true } = {}) {
  await expect(page.locator('.onb h1')).toHaveText('Orfini Math Quest');
  await page.locator('.onb [data-next]').click();
  await page.locator('#nick').fill('Ipotenusa98');
  await page.locator('.onb [data-next]').click();
  await page.locator('[data-year] [data-v="1"]').click();
  await page.locator('.onb [data-next]').click();
  if (indirizzo) await page.locator(`[data-ind] [data-v="${indirizzo}"]`).click();
  await page.locator('.onb [data-next]').click();
  await page.locator('.onb [data-next]').click();
  if (home) await expect(page.locator('#tabbar .tab').first()).toBeVisible();
}

function questState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('orfini_quest_v2') || 'null'));
}

/** Gioca la lezione aperta fino alla fine; con ?test le risposte giuste sono marcate nel DOM */
async function playLesson(page) {
  for (let n = 0; n < 80; n++) {
    const s = await questState(page);
    if (s && s.stats.lessons > 0) return;
    const modalBtn = page.locator('.modal button').first();
    if (await modalBtn.isVisible().catch(() => false)) { await modalBtn.click(); continue; }
    const primary = page.locator('.actionbar .btn.big');
    if (!(await primary.isVisible().catch(() => false))) { await page.waitForTimeout(150); continue; }
    if (await primary.isDisabled()) {
      const right = page.locator('[data-input] [data-correct="1"]:not([disabled])');
      const input = page.locator('[data-input] input').first();
      if (await right.count()) {
        for (const b of await right.all()) await b.click();
      } else if (await input.count()) {
        const answer = await page.evaluate(() => {
          const a = window.__step && window.__step.answer;
          return typeof a === 'number' ? String(a).replace('.', ',') : String(a ?? '1');
        });
        await input.fill(answer);
      } else {
        await page.locator('[data-input] button:not([disabled])').first().click();
      }
    }
    if (await primary.isEnabled()) await primary.click();
    await page.waitForTimeout(80);
  }
  throw new Error('La lezione non si è conclusa');
}

test.describe('Orfini Math Quest (/allenamento/)', () => {
  test('primo avvio e una lezione completa', async ({ page }) => {
    await page.goto('/allenamento/?test');
    await completeOnboarding(page);
    let s = await questState(page);
    expect(s.onboarded).toBe(true);
    expect(s.profile.indirizzo).toBe('meccanico');

    // link discreto al sito nella barra in alto
    await expect(page.locator('#topbar .site-link')).toHaveAttribute('href', '../');

    await page.goto('/allenamento/?test#/lezione/frazioni/1');
    await expect(page.locator('.actionbar')).toBeVisible();
    await playLesson(page);
    s = await questState(page);
    expect(s.stats.lessons).toBe(1);
    expect(s.lastActivity).toBe('frazioni');
    expect(s.xp).toBeGreaterThan(0);
  });

  test('?indirizzo= preimposta l\'indirizzo anche al primo avvio', async ({ page }) => {
    await page.goto('/allenamento/?indirizzo=elettrico');
    await expect(page).toHaveURL(/\/allenamento\/$/);
    await page.locator('.onb [data-next]').click();
    await page.locator('#nick').fill('Ohm');
    await page.locator('.onb [data-next]').click();
    await page.locator('[data-year] [data-v="2"]').click();
    await page.locator('.onb [data-next]').click();
    await expect(page.locator('[data-ind] [data-v="elettrico"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.onb [data-next]')).toBeEnabled();
  });

  test('home: voce di menu e riquadro "Il tuo allenamento"', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#training-cta')).toHaveText('Inizia ad allenarti');
    await expect(page.locator('#training-stats')).toBeHidden();
    const links = page.locator('#main-nav .nav-links .nav-link');
    await expect(links.nth(1)).toHaveText('Allenati');

    await page.goto('/allenamento/');
    await completeOnboarding(page);
    await page.goto('/index.html');
    await expect(page.locator('#training-cta')).toHaveText('Continua ad allenarti');
    await expect(page.locator('#training-stats')).toContainText('Serie');

    await links.nth(1).click();
    await expect(page).toHaveURL(/\/allenamento\/(#\/)?$/);
    await expect(page.locator('#tabbar .tab').first()).toBeVisible();
  });

  test('competenze: attività per codice MAT con link alla lezione', async ({ page }) => {
    await page.goto('/competenze.html');
    const link = page.locator('#MAT_K1 .skill-training a', { hasText: 'Frazioni' });
    await expect(link).toHaveAttribute('href', 'allenamento/#/lezione/frazioni/1');
    await link.click();
    // al primo accesso si passa dal primo avvio, poi si arriva alla lezione richiesta
    await completeOnboarding(page, { home: false });
    await expect(page).toHaveURL(/\/allenamento\/#\/lezione\/frazioni\/1$/);
    await expect(page.locator('.actionbar')).toBeVisible();
  });

  test('scuola: link "Matematica per" ogni indirizzo', async ({ page }) => {
    await page.goto('/scuola.html');
    for (const id of ['meccanico', 'elettrico', 'moda', 'grafica', 'odonto', 'socio']) {
      await expect(page.locator(`.track-link-math[href="allenamento/?indirizzo=${id}"]`).first()).toBeVisible();
    }
  });
});

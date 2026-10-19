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

  test('scelta multipla: dopo un errore la risposta giusta resta selezionabile', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('orfini_quest_v2', JSON.stringify({ version: 2, onboarded: true, profile: { nickname: 'x', year: 1, indirizzo: null } })));
    // si avanza nella lezione fino a una domanda con almeno 3 opzioni (frazioni, livello 1: confronti)
    let found = false;
    for (let attempt = 0; attempt < 20 && !found; attempt++) {
      await page.goto('/allenamento/?test#/lezione/frazioni/1');
      for (let n = 0; n < 12; n++) {
        await page.locator('.actionbar .btn.big').waitFor();
        if ((await page.locator('.option').count()) >= 3) { found = true; break; }
        const primary = page.locator('.actionbar .btn.big');
        const input = page.locator('[data-input] input');
        if (await input.count()) {
          await input.fill(await page.evaluate(() => String(window.__step.answer).replace('.', ',')));
          await primary.click();
        } else if (await page.locator('.option').count()) {
          await page.locator('.option[data-correct="1"]').click();
          await primary.click();
        }
        await primary.click();
      }
    }
    expect(found).toBe(true);
    const opts = page.locator('.option');
    const right = page.locator('.option[data-correct="1"]');
    const wrong = page.locator('.option:not([data-correct])').first();
    await wrong.click();
    await page.locator('.actionbar .btn.big', { hasText: 'Verifica' }).click();
    await expect(page.locator('.actionbar')).toContainText('Non ancora');
    // lo studente tocca subito la risposta giusta e poi "Riprova"
    await right.click();
    await page.locator('.actionbar .btn.big', { hasText: 'Riprova' }).click();
    await expect(wrong).toBeDisabled();
    await expect(right).toBeEnabled();
    await expect(right).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.actionbar .btn.big', { hasText: 'Verifica' }).click();
    await expect(page.locator('.actionbar.good')).toBeVisible();
    expect(await opts.count()).toBeGreaterThanOrEqual(3);
  });

  test('calcolatrice: domanda e barra si spostano insieme e tornano al loro posto', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 });
    await page.addInitScript(() => localStorage.setItem('orfini_quest_v2', JSON.stringify({ version: 2, onboarded: true, profile: { nickname: 'x', year: 1, indirizzo: null } })));
    await page.goto('/allenamento/#/lezione/percentuali/1');
    const box = () => page.evaluate(() => {
      const r = (q) => document.querySelector(q)?.getBoundingClientRect();
      const c = r('.lesson .card'), b = r('.actionbar .inner'), k = r('.calc:not(.closing)');
      return { cx: Math.round(c.x), cw: Math.round(c.width), bx: Math.round(b.x), bw: Math.round(b.width), calcX: k ? Math.round(k.x) : null };
    });
    await expect(page.locator('.actionbar')).toBeVisible();
    const closed = await box();
    expect(closed.bx).toBe(closed.cx);
    await page.locator('[data-calc-btn]').click();
    await page.waitForTimeout(500); // fine della transizione
    const open = await box();
    expect(open.bx).toBe(open.cx);
    expect(open.bw).toBe(open.cw);
    expect(open.cx + open.cw).toBeLessThanOrEqual(open.calcX - 16);
    await page.locator('[data-calc-btn]').click();
    await page.waitForTimeout(500);
    expect(await box()).toEqual(closed);
    await expect(page.locator('.calc')).toHaveCount(0);

    // su schermi larghi c'è già spazio: niente si muove
    await page.setViewportSize({ width: 1920, height: 1080 });
    const wide = await box();
    await page.locator('[data-calc-btn]').click();
    await page.waitForTimeout(500);
    expect({ ...(await box()), calcX: null }).toEqual(wide);
  });

  test('cambia utente: la sessione del prof sparisce dalla home e i giochi restano', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => localStorage.setItem('arcade_classifica', '[{"nome":"3EL","punti":990}]'));
    await page.goto('/allenamento/');
    await completeOnboarding(page);
    await page.goto('/allenamento/#/profilo');
    await page.locator('.profile-links [data-switch]').click();
    await expect(page.locator('.sheet')).toContainText('Nessun altro utente');
    await page.locator('.sheet [data-new]').click();
    await expect(page.locator('.onb h1')).toHaveText('Orfini Math Quest');

    // sul sito non compare più la sessione del prof
    await page.goto('/index.html');
    await expect(page.locator('#training-cta')).toHaveText('Inizia ad allenarti');

    // si torna al profilo del prof
    await page.goto('/allenamento/#/benvenuto');
    await completeOnboarding(page, { indirizzo: 'socio' });
    await page.goto('/allenamento/#/profilo');
    await page.locator('.profile-links [data-switch]').click();
    await expect(page.locator('.user-row')).toHaveCount(1);
    await expect(page.locator('.user-row')).toContainText('Ipotenusa98');
    await page.locator('.user-row [data-use]').click();
    await expect(page.locator('#tabbar .tab').first()).toBeVisible();
    const s = await questState(page);
    expect(s.profile.nickname).toBe('Ipotenusa98');
    expect(await page.evaluate(() => localStorage.getItem('arcade_classifica'))).toBe('[{"nome":"3EL","punti":990}]');
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

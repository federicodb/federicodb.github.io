// @ts-check
// Orfini Math Quest: scaffolding per classe (numeri per classe, prova d'ingresso, prerequisiti, bonus "a mente").
const { test, expect } = require('@playwright/test');

const state = (extra = {}) => JSON.stringify({ version: 2, onboarded: true, profile: { nickname: 'x', year: 1, indirizzo: null }, settings: { sound: false, haptics: false }, ...extra });
const setState = (page, extra) => page.addInitScript((s) => { if (!sessionStorage.getItem('init')) { localStorage.setItem('orfini_quest_v2', s); sessionStorage.setItem('init', '1'); } }, state(extra));
const quest = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('orfini_quest_v2')));

/** Compila la risposta alla domanda corrente: giusta (con ?test le risposte sono marcate) o sbagliata */
async function fill(page, right) {
  const input = page.locator('[data-input] input:not([type=range])').first();
  if (right) {
    const marked = page.locator('[data-input] [data-correct="1"]:not([disabled])');
    if (await marked.count()) for (const b of await marked.all()) await b.click();
    else if (await input.count()) await input.fill(await page.evaluate(() => String(window.__step.answer).replace('.', ',')));
    else await page.evaluate(() => window.__solve?.());
    return;
  }
  const wrongOpt = page.locator('.option:not([data-correct]):not([disabled])').first();
  const wrongTf = page.locator('.tf-btns button:not([data-correct]):not([disabled])');
  if (await input.count()) await input.fill('99999');
  else if (await wrongOpt.count()) await wrongOpt.click();
  else if (await wrongTf.count()) { for (const b of await wrongTf.all()) await b.click(); }
  else await page.evaluate(() => window.__solve?.());
}

/** Un passo qualunque della lezione, secondo lo stato della barra: compila e verifica, oppure va avanti */
async function step(page, right) {
  await page.locator('.actionbar .btn.big, .summary').first().waitFor();
  if (await page.locator('.summary').count()) return false;
  await page.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
  const primary = page.locator('.actionbar .btn.big');
  if (await primary.isDisabled()) await fill(page, right);
  if (await primary.isEnabled()) await primary.click();
  return true;
}
const answer = (page, right) => step(page, right);

test.describe('Scaffolding per classe', () => {
  test('la classe del profilo arriva ai generatori (anche quando cambia nel Profilo)', async ({ page }) => {
    await setState(page, { profile: { nickname: 'x', year: 4, indirizzo: null } });
    await page.goto('/allenamento/#/');
    await expect(page.locator('#tabbar .tab').first()).toBeVisible();
    expect(await page.evaluate(() => import('/allenamento/activities/contesti.js').then((m) => m.classe()))).toBe(4);
    await page.goto('/allenamento/#/profilo');
    await page.locator('[data-year] [data-y="2"]').click();
    expect(await page.evaluate(() => import('/allenamento/activities/contesti.js').then((m) => m.classe()))).toBe(2);
  });

  test('prova d\'ingresso superata: il livello si sblocca', async ({ page }) => {
    await setState(page, { profile: { nickname: 'x', year: 5, indirizzo: null } });
    await page.goto('/allenamento/#/');
    await page.locator('[data-filter="tutte"]').click(); // in 5ª "La mia classe" non mostra le frazioni
    await page.locator('[data-open="frazioni"]').first().click();
    await expect(page.locator('.sheet')).toContainText('Sei in 5ª');
    await expect(page.locator('.sheet a[href="#/prova/frazioni/3"]')).toContainText('Salta qui');
    await page.goto('/allenamento/?test#/prova/frazioni/3');
    for (let k = 0; k < 4; k++) await answer(page, true);
    await expect(page.locator('.summary .verdict')).toHaveText('Prova superata!');
    expect((await quest(page)).activities.frazioni.stars).toBe(2);
    await page.locator('.summary a.btn.big').click();
    await expect(page).toHaveURL(/#\/lezione\/frazioni\/3$/);
    await expect(page.locator('.lesson .card')).toBeVisible();
  });

  test('prova d\'ingresso non superata: si suggerisce da dove partire', async ({ page }) => {
    await setState(page);
    await page.goto('/allenamento/?test#/prova/percentuali/3');
    for (let k = 0; k < 4; k++) await answer(page, k === 0);
    await expect(page.locator('.summary .verdict')).toHaveText('Non ancora');
    await expect(page.locator('.summary a.btn.big')).toHaveAttribute('href', '#/lezione/percentuali/1');
    expect((await quest(page)).activities.percentuali?.stars || 0).toBe(0);
  });

  test('bonus "a mente": c\'è senza calcolatrice, non c\'è se la si apre', async ({ page }) => {
    await setState(page);
    for (const useCalc of [false, true]) {
      let found = false;
      for (let attempt = 0; attempt < 6 && !found; attempt++) {
        await page.goto('/allenamento/?test#/lezione/percentuali/1');
        for (let n = 0; n < 20 && !found; n++) {
          await page.locator('.actionbar .btn.big, .summary').first().waitFor();
          if (await page.locator('.summary').count()) break;
          const primary = page.locator('.actionbar .btn.big');
          const isNumber = await page.evaluate(() => window.__step?.type === 'number');
          if (isNumber && (await primary.isDisabled())) {
            if (useCalc) { await page.locator('[data-calc-btn]').click(); await expect(page.locator('.calc-nudge')).toContainText('×1,2'); await page.locator('[data-calc-btn]').click(); }
            await fill(page, true);
            await primary.click();
            await expect(page.locator('.actionbar.good')).toBeVisible();
            await expect(page.locator('.actionbar .mental-tag')).toHaveCount(useCalc ? 0 : 1);
            found = true;
          } else await step(page, true);
        }
      }
      expect(found).toBe(true);
    }
  });

  test('prerequisiti nella scheda e ripasso suggerito dopo due lezioni sotto l\'80%', async ({ page }) => {
    await setState(page, { profile: { nickname: 'x', year: 4, indirizzo: null }, activities: { esponenziali: { level: 1, stars: 0, box: 0, due: null, sessions: 1, lastScore: 0.2, best: 0.2, lowRuns: 1 } } });
    await page.goto('/allenamento/#/');
    await page.locator('[data-filter="tutte"]').click();
    await page.locator('[data-open="esponenziali"]').first().click();
    await expect(page.locator('.sheet .prereq')).toContainText('Proprietà delle potenze');
    await page.goto('/allenamento/?test#/lezione/esponenziali/1');
    for (let n = 0; n < 60 && (await step(page, false)); n++);
    await expect(page.locator('.summary .remedial')).toContainText('Prima di riprovare');
    await expect(page.locator('.summary .remedial a[href^="#/lezione/potenze/"]')).toBeVisible();
  });
});

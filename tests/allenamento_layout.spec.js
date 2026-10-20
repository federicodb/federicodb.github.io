// @ts-check
// Orfini Math Quest: ogni schermata di ogni lezione deve stare nello schermo di uno smartphone (360 px).
// Si percorrono i 3 livelli di ogni attività rispondendo giusto (con ?test le risposte sono marcate nel DOM).
// Le formule troppo larghe possono scorrere da sole (.math-scroll), mai la pagina.
const { test, expect } = require('@playwright/test');
const catalogo = require('../allenamento/catalogo.json');

test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

/** Elementi visibili che escono a destra dallo schermo (esclusi interni SVG, MathML nascosto, tabelle e formule scorrevoli) */
function overflowing() {
  const vw = document.documentElement.clientWidth;
  const out = [];
  if (document.documentElement.scrollWidth > vw) out.push(`pagina +${document.documentElement.scrollWidth - vw}px`);
  for (const el of document.querySelectorAll('.lesson *, .actionbar *')) {
    if (el.closest('.katex-mathml, .math-scroll, .g-table-wrap, .calc') || (el.closest('svg') && el.tagName !== 'svg')) continue;
    const b = el.getBoundingClientRect();
    if (b.width && b.right > vw + 1) out.push(`${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(' ')[0]} +${Math.round(b.right - vw)}px`);
  }
  return [...new Set(out)].slice(0, 5);
}

test.describe('Orfini Math Quest: impaginazione a 360 px', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('orfini_quest_v2', JSON.stringify({
      version: 2, onboarded: true, profile: { nickname: 'x', year: 1, indirizzo: 'meccanico' }, settings: { sound: false, haptics: false, teacher: true },
    })));
  });

  for (const act of catalogo) {
    test(act.id, async ({ page }) => {
      test.setTimeout(90_000);
      const problems = [];
      for (let level = 1; level <= 3; level++) {
        await page.goto(`/allenamento/?test&docente#/lezione/${act.id}/${level}`);
        await page.locator('.actionbar .btn.big').waitFor();
        for (let n = 0; n < 16; n++) {
          await page.waitForTimeout(60);
          for (const p of await page.evaluate(overflowing)) problems.push(`livello ${level}, passo ${n + 1}: ${p}`);
          const primary = page.locator('.actionbar .btn.big');
          if (!(await primary.count())) break;
          if (await primary.isDisabled()) {
            const right = page.locator('[data-input] [data-correct="1"]:not([disabled])');
            const input = page.locator('[data-input] input').first();
            if (await right.count()) for (const b of await right.all()) await b.click();
            else if (await input.count()) await input.fill(await page.evaluate(() => String(window.__step?.answer ?? '1').replace('.', ',')));
            else while (await page.locator('.order-pool .order-chip').count()) await page.locator('.order-pool .order-chip').first().click();
          }
          await page.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
          if (await primary.isDisabled()) break;
          await primary.click();
          const next = page.locator('.actionbar .btn.big');
          await page.waitForTimeout(60);
          for (const p of await page.evaluate(overflowing)) problems.push(`livello ${level}, passo ${n + 1} (correzione): ${p}`);
          if ((await next.count()) && (await next.isEnabled())) await next.click();
          if (!(await page.locator('.actionbar').count())) break;
        }
      }
      expect([...new Set(problems)]).toEqual([]);
    });
  }
});

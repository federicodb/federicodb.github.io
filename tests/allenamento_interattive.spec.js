// @ts-check
// Orfini Math Quest: domande interattive (cursore, retta, smista, ordina) con trascinamenti veri.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('orfini_quest_v2', JSON.stringify({
    version: 2, onboarded: true, profile: { nickname: 'x', year: 1, indirizzo: null }, settings: { sound: false, haptics: false, teacher: true },
  })));
});

/** Apre la lezione e avanza (rispondendo giusto) fino alla prima domanda del tipo richiesto */
async function reach(page, lesson, type) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.goto(`/allenamento/?test&docente#/lezione/${lesson}`);
    for (let n = 0; n < 12; n++) {
      const primary = page.locator('.actionbar .btn.big');
      await primary.waitFor();
      const t = await page.evaluate(() => window.__step?.type);
      if (t === type && (await primary.isDisabled())) return;
      if (await primary.isDisabled()) {
        const right = page.locator('[data-input] [data-correct="1"]:not([disabled])');
        const input = page.locator('[data-input] input:not([type=range])').first();
        if (await right.count()) for (const b of await right.all()) await b.click();
        else if (await input.count()) await input.fill(await page.evaluate(() => String(window.__step.answer).replace('.', ',')));
        else await page.evaluate(() => window.__solve?.());
        await primary.click();
      }
      await page.locator('.actionbar .btn.big').click();
    }
  }
  throw new Error(`domanda ${type} non trovata in ${lesson}`);
}

async function verifyIsRight(page) {
  await page.locator('.actionbar .btn.big', { hasText: 'Verifica' }).click();
  await expect(page.locator('.actionbar.good')).toBeVisible();
}

/** Trascina con il mouse da un punto a un altro, a piccoli passi */
async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(from.x + ((to.x - from.x) * k) / 12, from.y + ((to.y - from.y) * k) / 12);
  await page.mouse.up();
}
const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

test.describe('Domande interattive', () => {
  test('retta: trascinare il punto sulla frazione', async ({ page }) => {
    await reach(page, 'frazioni/1', 'place');
    const svg = page.locator('svg.ia-line');
    const box = await svg.boundingBox();
    const { answer, min, max } = await page.evaluate(() => window.__step);
    const vbW = await page.evaluate(() => document.querySelector('svg.ia-line').viewBox.baseVal.width);
    const x = box.x + ((34 + ((answer - min) / (max - min)) * (vbW - 68)) / vbW) * box.width;
    // prima un punto sbagliato (all'estremo opposto), poi quello giusto trascinando
    const wrongX = answer < 0.5 ? box.x + box.width * 0.9 : box.x + box.width * 0.1;
    await page.mouse.click(wrongX, box.y + box.height * 0.55);
    await expect(page.locator('.ia-marker')).toBeVisible();
    await page.locator('.actionbar .btn.big', { hasText: 'Verifica' }).click();
    await expect(page.locator('.actionbar.bad')).toBeVisible();
    await page.locator('.actionbar .btn.big', { hasText: 'Riprova' }).click();
    await drag(page, { x: wrongX, y: box.y + box.height * 0.55 }, { x, y: box.y + box.height * 0.55 });
    await verifyIsRight(page);
    await expect(page.locator('.ia-sol-lbl')).toBeVisible();
  });

  test('smista: trascinare ogni monomio nel contenitore giusto', async ({ page }) => {
    await reach(page, 'monomi/1', 'bins');
    const chips = page.locator('.ia-pool .ia-chip');
    while (await chips.count()) {
      const chip = chips.first();
      const target = await chip.getAttribute('data-target');
      await drag(page, await center(chip), await center(page.locator(`[data-bin="${target}"]`)));
    }
    await expect(page.locator('.ia-bin .ia-chip')).not.toHaveCount(0);
    await verifyIsRight(page);
  });

  test('ordina: trascinare e usare le frecce', async ({ page }) => {
    await reach(page, 'frazioni/2', 'sort');
    const firstLabel = await page.locator('.ia-sort-item').first().innerText();
    // trascina il primo elemento in fondo
    const items = page.locator('.ia-sort-item');
    await drag(page, await center(items.first()), await center(items.last()));
    await expect.poll(() => items.last().innerText()).toBe(firstLabel);
    // alternativa senza trascinamento: con ▲ l'ultima scheda risale fino in cima
    const lastLabel = await items.last().innerText();
    const n = await items.count();
    for (let k = 0; k < n - 1; k++) await items.nth(n - 1 - k).locator('[data-up]').click();
    await expect.poll(() => items.first().innerText()).toBe(lastLabel);
    await expect(items.first().locator('[data-up]')).toBeDisabled();
    await page.evaluate(() => window.__solve());
    await verifyIsRight(page);
  });

  test('cursore: prezzo scontato', async ({ page }) => {
    await reach(page, 'percentuali/2', 'slider');
    const { answer } = await page.evaluate(() => window.__step);
    const range = page.locator('.ia-slider input[type=range]');
    await range.fill(String(answer + 5 > (await page.evaluate(() => window.__step.max)) ? answer - 5 : answer + 5));
    await page.locator('.actionbar .btn.big', { hasText: 'Verifica' }).click();
    await expect(page.locator('.actionbar.bad')).toBeVisible();
    await page.locator('.actionbar .btn.big', { hasText: 'Riprova' }).click();
    await range.fill(String(answer));
    await expect(page.locator('.ia-slider output')).toHaveText(`${answer} €`);
    await verifyIsRight(page);
  });
});

test.describe('Domande interattive su telefono (tocchi)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('smista a tocchi: tocca la scheda, poi il contenitore', async ({ page }) => {
    await reach(page, 'probabilita/2', 'bins');
    const chips = page.locator('.ia-pool .ia-chip');
    while (await chips.count()) {
      const chip = chips.first();
      const target = await chip.getAttribute('data-target');
      await chip.tap();
      await expect(chip).toHaveAttribute('aria-pressed', 'true');
      await page.locator(`[data-bin="${target}"] .ia-bin-head`).tap();
    }
    await verifyIsRight(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });

  test('retta a tocchi: tocca il punto giusto', async ({ page }) => {
    await reach(page, 'radicali/1', 'place');
    const box = await page.locator('svg.ia-line').boundingBox();
    const { answer, min, max } = await page.evaluate(() => window.__step);
    const vbW = await page.evaluate(() => document.querySelector('svg.ia-line').viewBox.baseVal.width);
    await page.touchscreen.tap(box.x + ((34 + ((answer - min) / (max - min)) * (vbW - 68)) / vbW) * box.width, box.y + box.height * 0.6);
    await verifyIsRight(page);
  });
});

test.describe('Punteggio, scommessa e fine lezione', () => {
  test('"Sono sicuro" raddoppia il moltiplicatore, il riepilogo mostra le abilità, la carta si scarica', async ({ page }) => {
    await page.goto('/allenamento/?test&docente#/lezione/frazioni/1');
    let betDone = false;
    for (let n = 0; n < 14; n++) {
      const primary = page.locator('.actionbar .btn.big');
      await page.locator('.actionbar .btn.big, .summary').first().waitFor();
      if (await page.locator('.summary').count()) break;
      if (await primary.isDisabled()) {
        if (!betDone && (await page.locator('.actionbar .bet').count())) {
          await page.locator('.actionbar .bet').click();
          await expect(page.locator('.actionbar .bet')).toHaveAttribute('aria-pressed', 'true');
        }
        const right = page.locator('[data-input] [data-correct="1"]:not([disabled])');
        const input = page.locator('[data-input] input:not([type=range])').first();
        if (await right.count()) for (const b of await right.all()) await b.click();
        else if (await input.count()) await input.fill(await page.evaluate(() => String(window.__step.answer).replace('.', ',')));
        else await page.evaluate(() => window.__solve?.());
        await page.locator('.actionbar .btn.big').click();
        if (!betDone && (await page.locator('.actionbar.good').count())) {
          const chip = await page.locator('.actionbar .xp-chip').innerText();
          if (await page.locator('.actionbar h3', { hasText: 'Fiducia ben riposta' }).count()) {
            // scommessa ×2, e ×1,2 in più se la risposta scritta è data a mente
            const mental = await page.locator('.actionbar .mental-tag').count();
            expect(chip).toMatch(mental ? /10 × 2,4 = \+24 XP/ : /10 × 2 = \+20 XP/);
            betDone = true;
          }
        }
      }
      const next = page.locator('.actionbar .btn.big');
      if ((await next.count()) && (await next.isEnabled())) await next.click();
      await page.evaluate(() => document.querySelectorAll('.modal').forEach((m) => m.remove()));
    }
    expect(betDone).toBe(true);
    await page.locator('.summary').waitFor();
    await expect(page.locator('.summary .skills')).toBeVisible();
    await expect(page.locator('.summary .skills')).toContainText('sono sicuro');
    const download = page.waitForEvent('download');
    await page.locator('[data-card]').click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('carta-frazioni-1.png');
    const path = await file.path();
    const head = require('fs').readFileSync(path).subarray(0, 8).toString('hex');
    expect(head).toBe('89504e470d0a1a0a'); // firma PNG
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('orfini_quest_v2')));
    expect(s.album[0].id).toBe('frazioni');
    expect(s.stats.betsRight).toBe(1);
  });
});

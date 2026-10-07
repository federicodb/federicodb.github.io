// @ts-check
const { test, expect } = require('@playwright/test');

const viewports = [
  // Verticali
  { name: 'Mobile 360x640 Portrait', width: 360, height: 640, isMobile: true, hasTouch: true },
  { name: 'Mobile 390x844 Portrait', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Mobile 430x932 Portrait', width: 430, height: 932, isMobile: true, hasTouch: true },
  // Orizzontali
  { name: 'Mobile 640x360 Landscape', width: 640, height: 360, isMobile: true, hasTouch: true },
  { name: 'Mobile 844x390 Landscape', width: 844, height: 390, isMobile: true, hasTouch: true },
  { name: 'Mobile 932x430 Landscape', width: 932, height: 430, isMobile: true, hasTouch: true },
  // Tablet
  { name: 'Tablet 768x1024 Portrait', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'Tablet 1024x768 Landscape', width: 1024, height: 768, isMobile: true, hasTouch: true },
];

for (const vp of viewports) {
  test.describe(`T4: Dispositivo ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.hasTouch,
      isMobile: vp.isMobile,
    });

    test('Verifiche layout, touch, scroll, dimensioni e tastierino', async ({ page }) => {
      await page.goto('/content/apps/math_bubble_equazione_della_retta.html', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#playerName');
      const loadDuration = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return nav ? (nav.domContentLoadedEventEnd - nav.startTime) : 50;
      });
      expect(loadDuration).toBeLessThan(10000);

      // Iniziamo la partita
      await page.fill('#playerName', 'Studente');
      await page.fill('#playerClass', '1A');
      await page.click('#btnStartGame');
      await page.waitForTimeout(300);

      // Verifica scroll
      const scrollInfo = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        };
      });

      // Nessuno scorrimento orizzontale in ogni caso
      expect(scrollInfo.scrollWidth).toBeLessThanOrEqual(scrollInfo.innerWidth + 1);

      // In orizzontale mobile (height < 500), nessuno scorrimento verticale
      if (vp.height < 500) {
        expect(scrollInfo.scrollHeight).toBeLessThanOrEqual(scrollInfo.innerHeight + 1);
      }

      // Canvas visibile e alto almeno 200px
      const canvasBox = await page.locator('#gameCanvas').boundingBox();
      expect(canvasBox).not.toBeNull();
      expect(canvasBox.height).toBeGreaterThanOrEqual(200);

      // Input m e q NON sono readonly: digitabili sia da tastiera che con touch
      const isMReadOnly = await page.locator('#inputM').getAttribute('readonly');
      expect(isMReadOnly).toBeNull();

      // Tutti i tasti del tastierino touch misurano almeno 44x44 px (con tolleranza 2px per padding/bordi)
      const touchKeys = await page.locator('.touch-key').all();
      expect(touchKeys.length).toBeGreaterThan(0);
      for (const key of touchKeys) {
        const box = await key.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          expect(box.width).toBeGreaterThanOrEqual(42);
          expect(box.height).toBeGreaterThanOrEqual(42);
        }
      }

      // Eseguiamo un tiro usando esclusivamente i tap sul tastierino integrato
      // Selezioniamo il bersaglio e digitiamo il valore
      const targetCoord = await page.evaluate(() => {
        const t = window.GameState.bubbles.find(b => b.isTarget);
        return { x: t.x, y: t.y };
      });

      // Pendenza attesa al livello 1: y / x
      // Usiamo il tastierino per digitare y / x
      // Prima puliamo con tasto BACKSPACE se presente
      const btnClear = page.locator('.touch-key[data-key="clear"]');
      if (await btnClear.count() > 0) {
        await btnClear.tap();
      }

      // Digitiamo ad esempio '-' se y o x negativo
      const strVal = `${targetCoord.y}/${targetCoord.x}`;
      for (const char of strVal) {
        const keyBtn = page.locator(`.touch-key[data-key="${char}"]`);
        await keyBtn.tap();
      }

      // Tap sul pulsante SPARA
      await page.locator('#btnFire').tap();
      await page.waitForTimeout(600);

      // Verifichiamo che il punteggio sia aumentato
      const newScore = await page.evaluate(() => window.GameState.score);
      expect(newScore).toBeGreaterThan(0);

      // Cliccando/toccando una bolla compare l'etichetta con le coordinate
      await page.evaluate(() => {
        const firstBubble = window.GameState.bubbles[0];
        if (firstBubble) {
          window.selectBubbleForInspection(firstBubble);
        }
      });
      await page.waitForTimeout(200);
      const isInspectorVisible = await page.evaluate(() => {
        return window.GameState.inspectedBubble !== null;
      });
      expect(isInspectorVisible).toBe(true);

      // Verifica che le etichette delle bolle stiano dentro i bordi del canvas
      const allLabelsInside = await page.evaluate(() => {
        return window.GameState.bubbles.every(b => {
          const cx = window.toCanvasX(b.x);
          const cy = window.toCanvasY(b.y);
          return cx >= 10 && cx <= window.UI.canvas.width - 10 &&
                 cy >= 10 && cy <= window.UI.canvas.height - 10;
        });
      });
      expect(allLabelsInside).toBe(true);

      // Cattura screenshot per il viewport
      const orientationName = vp.width < vp.height ? 'portrait' : 'landscape';
      await page.screenshot({
        path: `tests/screenshots/mobile/${vp.width}x${vp.height}_${orientationName}.png`,
        fullPage: true,
      });
    });
  });
}

test.describe('T4: Rotazione dello schermo durante la partita', () => {
  test('Passaggio da Portrait (390x844) a Landscape (844x390) e ritorno conserva stato e bolle visibili', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');

    await page.fill('#playerName', 'Giroscopio');
    await page.fill('#playerClass', '2M');
    await page.click('#btnStartGame');
    await page.waitForTimeout(300);

    // Impostiamo punteggio e livello
    await page.evaluate(() => {
      window.GameState.score = 45;
      window.GameState.level = 2;
      window.UI.scoreDisplay.textContent = '45';
      window.UI.levelDisplay.textContent = '2';
      window.UI.inputM.value = '3/4';
    });

    // Ruotiamo a orizzontale
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);

    // Verifichiamo che livello, punteggio e valori inseriti siano preservati
    const stateInLandscape = await page.evaluate(() => {
      return {
        level: window.GameState.level,
        score: window.GameState.score,
        mVal: window.UI.inputM.value,
        allVisible: window.GameState.bubbles.every(b => {
          return b.y >= window.GameState.config.yRange[0] &&
                 b.y <= window.GameState.config.yRange[1];
        }),
      };
    });

    expect(stateInLandscape.level).toBe(2);
    expect(stateInLandscape.score).toBe(45);
    expect(stateInLandscape.mVal).toBe('3/4');
    expect(stateInLandscape.allVisible).toBe(true);

    // Ruotiamo indietro a verticale
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const stateInPortraitAgain = await page.evaluate(() => {
      return {
        level: window.GameState.level,
        score: window.GameState.score,
        mVal: window.UI.inputM.value,
        allVisible: window.GameState.bubbles.every(b => {
          return b.y >= window.GameState.config.yRange[0] &&
                 b.y <= window.GameState.config.yRange[1];
        }),
      };
    });

    expect(stateInPortraitAgain.level).toBe(2);
    expect(stateInPortraitAgain.score).toBe(45);
    expect(stateInPortraitAgain.mVal).toBe('3/4');
    expect(stateInPortraitAgain.allVisible).toBe(true);
  });
});

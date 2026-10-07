// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('T5, T6, T7, T8: Resize, Tema LIM, Console e Screenshot Desktop', () => {
  test('T5: Resize desktop 1440x900 -> 800x400 mantiene tutte le bolle visibili', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');

    await page.fill('#playerName', 'TestResize');
    await page.fill('#playerClass', '1T');
    await page.click('#btnStartGame');
    await page.waitForTimeout(300);

    // Ridimensiona a 800x400
    await page.setViewportSize({ width: 800, height: 400 });
    await page.waitForTimeout(300);

    const allInside = await page.evaluate(() => {
      const minY = window.GameState.config.yRange[0];
      const maxY = window.GameState.config.yRange[1];
      return window.GameState.bubbles.every(b => b.y >= minY && b.y <= maxY);
    });
    expect(allInside).toBe(true);
  });

  test('T6: Tema LIM (Proiezione) applica data-theme="light", sfondo chiaro e persiste al reload', async ({ page }) => {
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');

    // Click sul toggle tema LIM
    await page.click('#btnThemeToggle');
    await page.waitForTimeout(300);

    // Verifica data-theme="light"
    const htmlTheme = await page.getAttribute('html', 'data-theme');
    expect(htmlTheme).toBe('light');

    // Verifica colore chiaro sul canvas (pixel in angolo o al centro)
    const isLightCanvas = await page.evaluate(() => {
      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d');
      // pixel in coordinate (5, 5)
      const pixel = ctx.getImageData(5, 5, 1, 1).data;
      // Per tema chiaro ci aspettiamo un canale di luminosità elevato (r, g, b > 200)
      return pixel[0] > 180 && pixel[1] > 180 && pixel[2] > 180;
    });
    expect(isLightCanvas).toBe(true);

    // Ricarica la pagina: la scelta deve persistere da localStorage
    await page.reload();
    await page.waitForTimeout(300);
    const reloadedTheme = await page.getAttribute('html', 'data-theme');
    expect(reloadedTheme).toBe('light');
  });

  test('T7: Console pulita senza errori JavaScript (tranne eventuale avviso Tailwind CDN)', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignora eventuale avviso informativo di Tailwind CDN sul non uso in produzione
        if (!text.includes('cdn.tailwindcss.com should not be used in production')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');
    await page.fill('#playerName', 'NoErrors');
    await page.click('#btnStartGame');
    await page.waitForTimeout(400);

    expect(consoleErrors).toEqual([]);
  });

  test('T8: Screenshot desktop di login, livello 1, livello 4, livello 5, vittoria e proiezione', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');

    // 1. Screenshot Login
    await page.screenshot({ path: 'tests/screenshots/desktop_01_login.png' });

    // Inizia partita
    await page.fill('#playerName', 'Marco LIM');
    await page.fill('#playerClass', '3MEC');
    await page.click('#btnStartGame');
    await page.waitForTimeout(300);

    // 2. Screenshot Livello 1
    await page.screenshot({ path: 'tests/screenshots/desktop_02_livello1.png' });

    // 3. Screenshot Livello 4
    await page.evaluate(() => {
      window.GameState.level = 4;
      window.setupLevel(4);
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/desktop_03_livello4.png' });

    // 4. Screenshot Livello 5
    await page.evaluate(() => {
      window.GameState.level = 5;
      window.setupLevel(5);
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/desktop_04_livello5.png' });

    // 5. Screenshot Vittoria
    await page.evaluate(() => {
      window.completeGameVictory();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/desktop_05_vittoria.png' });

    // 6. Screenshot Modalità Proiezione LIM
    await page.click('#btnRestart');
    await page.click('#btnStartGame');
    await page.click('#btnThemeToggle');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/desktop_06_proiezione.png' });
  });
});

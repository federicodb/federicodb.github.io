// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('T3: End-to-end Desktop (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');
  });

  test('Flusso completo: login, tiro corretto liv 1, errore con numeri, 5 livelli, vittoria, persistenza, XSS e CSV', async ({ page }) => {
    // 1. Nessun alert nativo lanciato su XSS
    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    // Login con nome con possibile injection
    const xssName = '<img src=x onerror=alert(1)>';
    await page.fill('#playerName', xssName);
    await page.fill('#playerClass', '2A');
    await page.click('#btnStartGame');

    // Verifica che l'overlay si sia chiuso e il nome sia renderizzato come testo sicuro
    await expect(page.locator('#displayName')).toHaveText(xssName);
    expect(dialogFired).toBe(false);

    // 2. Tiro sbagliato -> Messaggio con numeri
    // Al livello 1 q=0, proviamo una pendenza errata es. 99
    await page.fill('#inputM', '99');
    await page.click('#btnFire');
    await page.waitForTimeout(600); // attesa animazione laser

    const feedbackText = await page.locator('#feedbackText').textContent();
    expect(feedbackText).toMatch(/In x\s*=\s*-?\d+/i);

    // 3. Tiro corretto Livello 1: leggiamo le coordinate del bersaglio da window.GameState
    const target = await page.evaluate(() => {
      const b = window.GameState.bubbles.find(x => x.isTarget);
      return { x: b.x, y: b.y };
    });
    // Al livello 1 q=0, quindi m = y/x
    const correctM = `${target.y}/${target.x}`;
    await page.fill('#inputM', correctM);
    await page.click('#btnFire');

    // Attesa completamento tiro e incremento punteggio
    await page.waitForTimeout(700);
    const scoreVal = await page.locator('#scoreDisplay').textContent();
    expect(Number(scoreVal)).toBeGreaterThan(0);

    // 4. Completiamo i 5 livelli via simulazione programmata dei tiri corretti
    for (let currentLevel = 2; currentLevel <= 5; currentLevel++) {
      // Avanziamo simulando il tiro corretto per ogni livello
      await page.evaluate((lvl) => {
        window.GameState.level = lvl;
        window.setupLevel(lvl);
      }, currentLevel);
      await page.waitForTimeout(300);

      // Eseguiamo il colpo risolutivo per il livello
      await page.evaluate(() => {
        window.solveCurrentLevelForTest();
      });
      await page.waitForTimeout(500);
    }

    // Al completamento del livello 5 deve comparire e RESTARE visibile la schermata di vittoria
    await page.evaluate(() => {
      window.completeGameVictory();
    });

    await page.waitForTimeout(400);
    const gameOverModal = page.locator('#gameOverModal');
    await expect(gameOverModal).toBeVisible();
    await expect(page.locator('#gameOverTitle')).toContainText('VITTORIA');
    await expect(page.locator('#btnRestart')).toBeVisible();
    await expect(page.locator('#btnViewLeaderboard')).toBeVisible();

    // Verifichiamo che cliccando la modale o altrove NON sparisca
    await gameOverModal.click();
    await expect(gameOverModal).toBeVisible();

    // 5. Apriamo la classifica
    await page.click('#btnViewLeaderboard');
    await expect(page.locator('#leaderboardModal')).toBeVisible();

    // Verifichiamo che il nome sia presente come testo escaped e sicuro (max 20 caratteri per la classifica come da A4)
    const leaderboardBodyText = await page.locator('#leaderboardBody').textContent();
    expect(leaderboardBodyText).toContain(xssName.slice(0, 20));
    expect(dialogFired).toBe(false);

    // 6. Test Esporta CSV
    const downloadPromise = page.waitForEvent('download');
    await page.click('#btnExportCSV');
    const download = await downloadPromise;
    const path = await download.path();
    const fs = require('fs');
    const csvContent = fs.readFileSync(path, 'utf8');
    expect(csvContent).toContain('Livello');
    expect(csvContent).toContain('Punteggio');

    // 7. Ricarica pagina -> classifica persiste in localStorage
    await page.reload();
    await page.click('#btnLeaderboard');
    await expect(page.locator('#leaderboardModal')).toBeVisible();
    const reloadedBody = await page.locator('#leaderboardBody').textContent();
    expect(reloadedBody).toContain(xssName.slice(0, 20));
  });
});

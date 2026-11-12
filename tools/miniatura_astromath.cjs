// Miniatura di AstroMath (content/assets/thumbnails/astromath.webp): una scena di gioco, non la schermata d'avvio.
// Uso: python3 -m http.server 8091 (dalla root), poi
//   node tools/miniatura_astromath.cjs /tmp/scena.png 10 3 1,2,4   (livello, stella dell'incontro, stelle da accendere)
//   .venv/bin/python3 -c "from PIL import Image; Image.open('/tmp/scena.png').convert('RGB').resize((600,375), Image.LANCZOS).save('content/assets/thumbnails/astromath.webp','WEBP',quality=85)"
// La pagina ha <meta name="miniatura" content="fissa">: thumbnails.py non la sovrascrive.
const { chromium } = require(process.cwd() + '/node_modules/playwright');
const [OUT, LIV, STELLA] = [process.argv[2], Number(process.argv[3] || 10), Number(process.argv[4] || 3)];
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.addInitScript(() => {
    localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true }));
    localStorage.setItem('orfini_astromath_v1', JSON.stringify({ v: 1, sigla: 'LINCE-φ', livelli: {}, badge: {}, giorni: [], stats: {}, impostazioni: { qualita: 'alta', volume: 0, vibrazione: false, effetti: 'pieni' }, classifica: [] }));
  });
  await page.goto('http://127.0.0.1:8091/content/apps/astromath.html?test&foto=1.12&seme=miniatura');
  await page.waitForFunction(() => document.documentElement.dataset.pronto === '1');
  await page.evaluate((k) => window.__astromath.avvia(k), LIV);
  await page.waitForFunction(() => window.__astromath.stato().schermo === 'volo');
  await page.evaluate(() => document.getElementById('intro-ok')?.click());
  // accende alcune stelle vicine: si vedono gli archi della costellazione
  for (const i of (process.argv[5] || '0,1,2').split(',').map(Number).filter((k) => k !== STELLA)) {
    await page.evaluate((k) => window.__astromath.vai(k), i);
    await page.waitForFunction((k) => window.__astromath.stato().incontro === k, i, { timeout: 30000 });
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__astromath.giusta());
    await page.waitForTimeout(2200);
  }
  await page.evaluate((k) => window.__astromath.vai(k), STELLA);
  await page.waitForFunction((k) => window.__astromath.stato().incontro === k, STELLA, { timeout: 30000 });
  // solo il mondo: via HUD, comandi, pannello, avvisi e pulsante "home"
  await page.addStyleTag({ content: '#hud, #comandi, #incontro, #avvisi, #intro, .orfini-back-btn, #bussola { display: none !important; }' });
  await page.waitForTimeout(7000); // la camera arriva sulla stella e la creatura si mette in posa
  await page.screenshot({ path: OUT });
  await browser.close();
})();

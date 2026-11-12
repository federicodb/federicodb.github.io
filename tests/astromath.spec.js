// @ts-check
// AstroMath (content/apps/astromath.html): domande dalla Quest, volo, incontri, badge, legame con la Quest,
// ripiego senza WebGL, tastiera, misure da telefono. Si gioca con il gancio di test (?test): window.__astromath.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');
const { expectFormuleDisegnate } = require('./helpers/formule');

const URL = '/content/apps/astromath.html?test';
const MODULI = path.join(__dirname, '..', 'content', 'apps', 'astromath_js');

test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

function sorveglia(page) {
  const errori = [];
  page.on('pageerror', (e) => errori.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errori.push('console: ' + m.text()); });
  return errori;
}

async function apri(page, url = URL) {
  await page.addInitScript(() => { try { localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' })); } catch (e) { /* */ } });
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.pronto === '1', null, { timeout: 30000 });
}

const stato = (page) => page.evaluate(() => window.__astromath.stato());

async function avvia(page, i) {
  await page.evaluate((k) => window.__astromath.avvia(k), i);
  await page.waitForFunction(() => window.__astromath.stato().schermo === 'volo', null, { timeout: 30000 });
  const ok = page.locator('#intro-ok');
  if (await ok.isVisible()) await ok.click();
}

async function incontro(page, i) {
  await page.evaluate((k) => window.__astromath.vai(k), i);
  await page.waitForFunction((k) => window.__astromath.stato().incontro === k, i, { timeout: 8000 });
  await expect(page.locator('#incontro')).toBeVisible();
}

test.describe('domande ad anelli (Node, dai generatori della Quest)', () => {
  test('ogni livello: 6 stelle, una sola risposta giusta, opzioni tutte diverse', async () => {
    const { LIVELLI } = await import(pathToFileURL(path.join(MODULI, 'livelli.js')).href);
    const { generaStelle } = await import(pathToFileURL(path.join(MODULI, 'domande.js')).href);
    const problemi = [];
    for (const L of LIVELLI) {
      for (const [seme, classe, indirizzo] of [['a', 1, null], ['b', 2, null], ['c', 1, 'elettrico'], ['d', 3, 'meccanico']]) {
        const stelle = await generaStelle(L, { seme, classe, indirizzo });
        if (stelle.length !== 6) problemi.push(`${L.id}: ${stelle.length} stelle`);
        for (const s of stelle) {
          const o = s.sfida.opzioni;
          const etichette = o.map((x) => x.label);
          if (o.filter((x) => x.giusta).length !== 1) problemi.push(`${L.id}/${s.attivita}: risposte giuste ${o.filter((x) => x.giusta).length}`);
          if (new Set(etichette).size !== etichette.length) problemi.push(`${L.id}/${s.attivita}: opzioni doppie ${etichette.join(' | ')}`);
          if (o.length < 2 || o.length > 4) problemi.push(`${L.id}/${s.attivita}: ${o.length} opzioni`);
          if (etichette.some((e) => /NaN|undefined|Infinity/.test(e))) problemi.push(`${L.id}/${s.attivita}: ${etichette.join(' | ')}`);
          // numeri da calcolare a mente: i distrattori generati da AstroMath hanno al massimo due decimali
          if (s.sfida.tipo === 'number' && etichette.some((e) => /\{,\}\d{3,}/.test(e))) problemi.push(`${L.id}/${s.attivita}: troppi decimali ${etichette.join(' | ')}`);
        }
      }
    }
    expect(problemi).toEqual([]);
  });

  test('stesso seme, stesse domande (la classe vola sullo stesso cielo)', async () => {
    const { LIVELLI } = await import(pathToFileURL(path.join(MODULI, 'livelli.js')).href);
    const { generaStelle } = await import(pathToFileURL(path.join(MODULI, 'domande.js')).href);
    const a = await generaStelle(LIVELLI[3], { seme: 'classe-2el' });
    const b = await generaStelle(LIVELLI[3], { seme: 'classe-2el' });
    expect(a.map((s) => s.sfida.prompt)).toEqual(b.map((s) => s.sfida.prompt));
  });
});

test.describe('AstroMath nel browser', () => {
  test.describe.configure({ retries: 1 });

  test('una costellazione intera: incontro, errore, risposta giusta, portale, badge', async ({ page }) => {
    test.setTimeout(120000);
    const errori = sorveglia(page);
    await apri(page);
    expect((await stato(page)).renderer).toBe('webgl');
    await expectFormuleDisegnate(page, 'avvio');
    await avvia(page, 0);
    await incontro(page, 0);
    await expectFormuleDisegnate(page, 'incontro');
    // sbagliare non toglie nulla: l'anello scartato si spegne, la stella resta da accendere
    await page.evaluate(() => window.__astromath.sbagliata());
    await expect(page.locator('.opz.scartata')).toHaveCount(1);
    await expect(page.locator('#inc-esito')).toHaveClass(/no/);
    await page.evaluate(() => window.__astromath.giusta());
    await expect.poll(async () => (await stato(page)).stelle[0]).toBe('accesa');
    for (let i = 1; i < 6; i++) {
      await page.waitForTimeout(900);
      await incontro(page, i);
      await page.evaluate(() => window.__astromath.giusta());
    }
    await expect.poll(async () => (await stato(page)).portale).toBe(true);
    await page.evaluate(() => window.__astromath.portale());
    await expect(page.locator('#schermo-fine')).toBeVisible();
    await expectFormuleDisegnate(page, 'fine');
    const salvato = await page.evaluate(() => JSON.parse(localStorage.getItem('orfini_astromath_v1')));
    expect(salvato.livelli.numeri.completo).toBe(true);
    expect(Object.keys(salvato.badge)).toEqual(expect.arrayContaining(['primo-volo', 'costellazione-numeri']));
    // i link di ripasso portano alle lezioni della Quest
    await expect(page.locator('#fine-ripasso a').first()).toHaveAttribute('href', /^\/allenamento\/#\/lezione\/[a-z0-9-]+\/[1-3]$/);
    expect(errori).toEqual([]);
  });

  test('tutte le costellazioni: domande pronte e formule disegnate in ogni incontro', async ({ page }) => {
    test.setTimeout(240000);
    const errori = sorveglia(page);
    await apri(page);
    const n = await page.evaluate(() => document.querySelectorAll('#mappa-livelli .livello').length);
    expect(n).toBe(12);
    for (let L = 0; L < n; L++) {
      await avvia(page, L);
      for (let i = 0; i < 6; i++) {
        await incontro(page, i);
        await expectFormuleDisegnate(page, `livello ${L}, stella ${i}`);
        await page.evaluate(() => window.__astromath.giusta());
        await page.waitForTimeout(300);
        await page.evaluate(() => window.__astromath.pilota({ x: 0, y: 3, vx: 0, vy: 0 })); // via dalla stella
        await page.waitForTimeout(900);
      }
      expect((await stato(page)).stelle.every((s) => s === 'accesa')).toBe(true);
    }
    expect(errori).toEqual([]);
  });

  test('legame con la Quest: legge, sblocca e indora le stelle, ma non scrive mai', async ({ page }) => {
    test.setTimeout(90000);
    await page.addInitScript(() => {
      if (sessionStorage.getItem('fatto')) return;
      sessionStorage.setItem('fatto', '1');
      const q = { version: 2, profile: { nickname: '', year: 1, indirizzo: 'elettrico' }, activities: { 'numeri-relativi': { stars: 3, best: 1 }, frazioni: { stars: 3, best: 1 }, potenze: { stars: 3, best: 1 } } };
      localStorage.setItem('orfini_quest_v2', JSON.stringify(q));
    });
    await apri(page);
    const prima = await page.evaluate(() => localStorage.getItem('orfini_quest_v2'));
    await expect(page.locator('#quest-legame')).toContainText('Collegato alla Quest');
    // «Numeri» allenati nella Quest: la seconda costellazione è già aperta
    await expect(page.locator('#mappa-livelli .livello').nth(1)).toBeEnabled();
    await expect(page.locator('#mappa-livelli .livello').nth(2)).toBeDisabled();
    await avvia(page, 0);
    const allenate = await page.evaluate(() => window.__astromath.mondo().stelle.map((s) => s.allenata));
    expect(allenate.every(Boolean)).toBe(true);
    await expect(page.locator('.avviso-oro')).toBeVisible();
    await incontro(page, 0);
    await page.evaluate(() => window.__astromath.giusta());
    await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('orfini_astromath_v1')).badge))).toContain('ponte-quest');
    expect(await page.evaluate(() => localStorage.getItem('orfini_quest_v2'))).toBe(prima);
  });

  test('tastiera: le frecce fanno volare, i tasti 1-4 rispondono, P mette in pausa', async ({ page }) => {
    test.setTimeout(60000);
    await apri(page);
    await avvia(page, 2);
    await page.locator('#tela').focus();
    const y0 = (await stato(page)).pilota.y;
    await page.keyboard.down('ArrowUp');
    await page.waitForFunction((y) => window.__astromath.stato().pilota.y > y + 3, y0, { timeout: 5000 });
    await page.keyboard.up('ArrowUp');
    expect((await stato(page)).pilota.y).toBeGreaterThan(y0 + 3);
    await incontro(page, 0);
    const giusta = await page.evaluate(() => { const m = window.__astromath.mondo(); return m.stelle[m.incontro.i].corrente.opzioni.findIndex((o) => o.giusta); });
    await page.keyboard.press(`Digit${giusta + 1}`);
    await expect.poll(async () => (await stato(page)).stelle[0]).toBe('accesa');
    await page.keyboard.press('KeyP');
    await expect(page.locator('#schermo-pausa')).toBeVisible();
    expect((await stato(page)).pausa).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#schermo-pausa')).toBeHidden();
  });

  test('due errori: spiegazione e problema gemello, poi la stella si accende lo stesso', async ({ page }) => {
    test.setTimeout(60000);
    await apri(page);
    await avvia(page, 1);
    // una stella con almeno tre opzioni
    const i = await page.evaluate(() => window.__astromath.mondo().stelle.findIndex((s) => s.sfida.opzioni.length >= 3));
    test.skip(i < 0, 'nessuna stella con tre opzioni con questo seme');
    await incontro(page, i);
    await page.evaluate(() => window.__astromath.sbagliata());
    await page.evaluate(() => window.__astromath.sbagliata());
    await expect(page.locator('#inc-nota')).toContainText('Ecco come si fa');
    await expectFormuleDisegnate(page, 'gemello');
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__astromath.giusta());
    await expect.poll(async () => (await stato(page)).stelle[i]).toBe('accesa');
  });

  test('senza WebGL si gioca lo stesso (Canvas 2D)', async ({ page }) => {
    test.setTimeout(60000);
    const errori = sorveglia(page);
    await apri(page, URL + '&2d');
    expect((await stato(page)).renderer).toBe('2d');
    await avvia(page, 0);
    await incontro(page, 0);
    await page.evaluate(() => window.__astromath.giusta());
    await expect.poll(async () => (await stato(page)).stelle[0]).toBe('accesa');
    expect(errori).toEqual([]);
  });

  test('telefono in verticale: niente scorrimento orizzontale, HUD e comandi non si coprono', async ({ browser }) => {
    test.setTimeout(60000);
    const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await apri(page);
    const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: innerWidth }));
    expect(w.s).toBeLessThanOrEqual(w.i + 1);
    await avvia(page, 1);
    const a = await page.locator('#hud').boundingBox(), b = await page.locator('#comandi').boundingBox();
    const sovrapposti = a && b && !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
    expect(sovrapposti).toBe(false);
    for (const sel of ['#btn-pausa', '#btn-impostazioni', '#btn-audio']) {
      const r = await page.locator(sel).boundingBox();
      expect(r && r.width >= 44 && r.height >= 44).toBe(true);
    }
    await incontro(page, 0);
    await expectFormuleDisegnate(page, 'telefono');
    await ctx.close();
  });
});

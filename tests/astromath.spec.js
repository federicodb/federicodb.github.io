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

/** Formule che escono dalla loro casella (pannello o etichetta dell'anello), anche in altezza: frazioni ed esponenti compresi */
const formuleTagliate = (page) => page.evaluate(() => [...document.querySelectorAll('#incontro .opz')].flatMap((b, k) => {
  const r = b.getBoundingClientRect();
  return [...b.querySelectorAll('.katex-html')].filter((f) => { const q = f.getBoundingClientRect(); return q.top < r.top - 0.5 || q.bottom > r.bottom + 0.5 || q.left < r.left - 0.5 || q.right > r.right + 0.5; }).map(() => `opzione ${k + 1}`);
}));

/** Formule spezzate su più righe nel pannello o sulle etichette degli anelli (una formula in linea a capo ha più rettangoli) */
const formuleACapo = (page) => page.evaluate(() => [...document.querySelectorAll('#incontro .katex, #etichette .katex')]
  .filter((k) => !k.closest('.katex-display') && k.offsetParent && k.getClientRects().length > 1)
  .map((k) => k.textContent.slice(0, 40)));

async function avvia(page, i) {
  const prima = (await stato(page)).avviate;
  await page.evaluate((k) => window.__astromath.avvia(k), i);
  await page.waitForFunction((n) => { const s = window.__astromath.stato(); return s.schermo === 'volo' && s.avviate > n; }, prima, { timeout: 30000 });
  const ok = page.locator('#intro-ok');
  if (await ok.isVisible()) await ok.click();
}

async function incontro(page, i) {
  await page.evaluate((k) => window.__astromath.vai(k), i);
  await page.waitForFunction((k) => window.__astromath.stato().incontro === k, i, { timeout: 20000 }); // largo: senza GPU i fotogrammi sono lenti
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

test.describe('oggetti liberi (Node)', () => {
  test('ogni livello: oggetti lontani da stelle e portale, stessa disposizione con lo stesso seme', async () => {
    const { LIVELLI } = await import(pathToFileURL(path.join(MODULI, 'livelli.js')).href);
    const { Mondo, MONDO } = await import(pathToFileURL(path.join(MODULI, 'mondo.js')).href);
    const { Oggetti } = await import(pathToFileURL(path.join(MODULI, 'oggetti.js')).href);
    const problemi = [];
    for (const L of LIVELLI) {
      const finte = L.forma.map((_, i) => ({ indice: i, livelloQuest: 1, sfida: { opzioni: [] } }));
      for (const seme of ['a', 'b', 'c']) {
        const m = new Mondo(L, finte);
        const og = new Oggetti(m, seme, { segreto: true });
        const tipi = new Set(og.lista.map((o) => o.tipo));
        for (const t of ['personaggio', 'molla', 'fuoco', 'buco', 'vento', 'segreto']) if (!tipi.has(t)) problemi.push(`${L.id}/${seme}: manca ${t}`);
        for (const o of og.lista) {
          // lontani dalle stelle (anelli compresi: raggio 15) e dal portale
          const dStella = Math.min(...m.stelle.map((s) => Math.hypot(s.x - o.x, s.y - o.y)));
          if (dStella < 26 + o.raggio) problemi.push(`${L.id}/${seme}: ${o.tipo} a ${dStella.toFixed(1)} da una stella`);
          if (Math.hypot(o.x - MONDO.portale.x, o.y - MONDO.portale.y) < 22) problemi.push(`${L.id}/${seme}: ${o.tipo} sul portale`);
          if (Math.abs(o.x) > MONDO.meta || o.y < 10 || o.y > MONDO.tetto) problemi.push(`${L.id}/${seme}: ${o.tipo} fuori dal cielo`);
        }
        const bis = new Oggetti(new Mondo(L, finte), seme, { segreto: true });
        if (JSON.stringify(bis.lista.map((o) => [o.tipo, o.x0, o.y0, o.chi])) !== JSON.stringify(og.lista.map((o) => [o.tipo, o.x0, o.y0, o.chi]))) problemi.push(`${L.id}/${seme}: disposizione non ripetibile`);
      }
    }
    expect(problemi).toEqual([]);
  });

  test('freddure e curve: ogni personaggio esiste, ogni formula si compone con KaTeX', async () => {
    const { FREDDURE, PERSONAGGI } = await import(pathToFileURL(path.join(MODULI, 'freddure.js')).href);
    const { CURVE } = await import(pathToFileURL(path.join(MODULI, 'oggetti.js')).href);
    const katex = require(path.join(__dirname, '..', 'allenamento', 'node_modules', 'katex', 'dist', 'katex.js'));
    const problemi = [];
    const testi = new Set();
    for (const f of FREDDURE) {
      if (!PERSONAGGI.includes(f.chi)) problemi.push(`personaggio sconosciuto: ${f.chi}`);
      if (testi.has(f.testo)) problemi.push(`doppia: ${f.testo}`);
      testi.add(f.testo);
      for (const m of f.testo.matchAll(/\$([^$]+)\$/g)) {
        try { katex.renderToString(m[1], { throwOnError: true }); } catch (e) { problemi.push(`${f.testo.slice(0, 40)}: ${e.message.slice(0, 60)}`); }
      }
      if ((f.testo.match(/\$/g) || []).length % 2) problemi.push(`delimitatori dispari: ${f.testo}`);
    }
    for (const c of CURVE) {
      try { katex.renderToString(c.tex, { throwOnError: true }); } catch (e) { problemi.push(`${c.nome}: ${e.message.slice(0, 60)}`); }
      for (let k = 0; k <= 20; k++) { const [u, v] = c.f(k / 20); if (!Number.isFinite(u) || !Number.isFinite(v) || Math.abs(u) > 1.01 || Math.abs(v) > 1.01) problemi.push(`${c.nome}: punto fuori da [-1, 1]`); }
    }
    expect(problemi).toEqual([]);
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
        expect(await formuleACapo(page), `livello ${L}, stella ${i}: formule a capo`).toEqual([]);
        expect(await formuleTagliate(page), `livello ${L}, stella ${i}: formule tagliate`).toEqual([]);
        await page.evaluate(() => window.__astromath.giusta());
        await page.waitForTimeout(300);
        await page.evaluate(() => window.__astromath.pilota({ x: 0, y: 3, vx: 0, vy: 0 })); // via dalla stella
        await page.waitForTimeout(900);
      }
      expect((await stato(page)).stelle.every((s) => s === 'accesa')).toBe(true);
    }
    expect(errori).toEqual([]);
  });

  test('oggetti liberi: freddura, molla, fuochi, vento, buco nero e dodecaedro fanno il loro effetto', async ({ page }) => {
    test.setTimeout(120000);
    const errori = sorveglia(page);
    await apri(page, URL + '&segreto');
    await avvia(page, 2);
    const stati = () => page.evaluate(() => window.__astromath.mondo().oggetti.lista.map((o) => o.tipo + ':' + o.stato));
    const via = async () => { await page.evaluate(() => window.__astromath.pilota({ x: 0, y: 3, vx: 0, vy: 0 })); await page.waitForTimeout(500); };
    // freddura: fumetto con il testo, formule disegnate
    await page.evaluate(() => window.__astromath.vaiOggetto('personaggio'));
    await expect(page.locator('.fumetto').first()).toBeVisible({ timeout: 10000 });
    await expectFormuleDisegnate(page, 'fumetto');
    await via();
    // molla: il pilota rimbalza (la velocità cambia verso)
    await page.evaluate(() => window.__astromath.vaiOggetto('molla'));
    await expect.poll(() => page.evaluate(() => window.__astromath.mondo().pilota.vx), { timeout: 10000 }).toBeGreaterThan(5);
    await via();
    // fuochi: esplode, compaiono nome e formula della curva
    await page.evaluate(() => window.__astromath.vaiOggetto('fuoco'));
    await expect.poll(stati, { timeout: 10000 }).toContain('fuoco:botto');
    await expect(page.locator('.fumetto.curva')).toBeVisible({ timeout: 10000 });
    await expectFormuleDisegnate(page, 'curva');
    await via();
    // buco nero: orbita, poi rilancio verso l'alto
    await page.evaluate(() => window.__astromath.vaiOggetto('buco'));
    await expect.poll(stati, { timeout: 10000 }).toContain('buco:orbita');
    await expect.poll(() => page.evaluate(() => window.__astromath.mondo().pilota.vy), { timeout: 20000 }).toBeGreaterThan(20);
    await via();
    // dodecaedro d'oro: badge
    await page.evaluate(() => window.__astromath.vaiOggetto('segreto'));
    await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('orfini_astromath_v1')).badge)), { timeout: 10000 }).toContain('dodecaedro');
    expect(errori).toEqual([]);
  });

  test('ogni partita ha numeri nuovi, alla stessa difficoltà', async ({ page }) => {
    test.setTimeout(60000);
    await apri(page);
    const domande = () => page.evaluate(() => window.__astromath.mondo().stelle.map((s) => `${s.livelloQuest}|${s.sfida.prompt}`));
    await avvia(page, 0);
    const prima = await domande();
    await avvia(page, 0);
    const seconda = await domande();
    expect(seconda).not.toEqual(prima);
    // stessa difficoltà: i livelli Quest delle sei stelle non cambiano
    expect(seconda.map((d) => d.split('|')[0])).toEqual(prima.map((d) => d.split('|')[0]));
    const uguali = prima.filter((d, i) => d === seconda[i]).length;
    expect(uguali).toBeLessThanOrEqual(1);
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
    // il numero sceglie soltanto; Invio conferma
    await page.keyboard.press(`Digit${giusta + 1}`);
    await expect(page.locator('.opz.scelta')).toHaveCount(1);
    await page.waitForTimeout(300);
    expect((await stato(page)).stelle[0]).toBe('spenta');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await stato(page)).stelle[0]).toBe('accesa');
    await page.keyboard.press('KeyP');
    await expect(page.locator('#schermo-pausa')).toBeVisible();
    expect((await stato(page)).pausa).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#schermo-pausa')).toBeHidden();
  });

  test('risposta volontaria: passare in un anello o toccare una volta non risponde', async ({ page }) => {
    test.setTimeout(60000);
    await apri(page);
    await avvia(page, 0);
    await incontro(page, 0);
    await page.waitForTimeout(1500);
    // attraversare l'anello di corsa: nessuna risposta
    const a = await page.evaluate(() => { const m = window.__astromath.mondo(); return m.incontro.anelli[0]; });
    await page.evaluate((r) => window.__astromath.pilota({ x: r.x - 3, y: r.y, vx: 40, vy: 0 }), a);
    await page.waitForTimeout(700);
    expect((await stato(page)).stelle[0]).toBe('spenta');
    expect(await page.evaluate(() => window.__astromath.mondo().incontro.anelli.some((x) => x.via))).toBe(false);
    // fermarsi dentro l'anello finché si riempie: risponde
    await page.evaluate((r) => window.__astromath.pilota({ x: r.x, y: r.y, vx: 0, vy: 0 }), a);
    await expect.poll(async () => page.evaluate(() => { const m = window.__astromath.mondo(); return !m.incontro || m.incontro.anelli[0].via || m.stelle[0].stato === 'accesa'; }), { timeout: 8000 }).toBe(true);
    // un solo tocco sceglie, il pulsante Conferma risponde
    await page.evaluate(() => window.__astromath.pilota({ x: 0, y: 3, vx: 0, vy: 0 }));
    await page.waitForTimeout(1200);
    await incontro(page, 1);
    const k = await page.evaluate(() => { const m = window.__astromath.mondo(); return m.stelle[1].corrente.opzioni.findIndex((o) => o.giusta); });
    await page.locator('#inc-opzioni .opz').nth(k).click();
    await page.waitForTimeout(300);
    expect((await stato(page)).stelle[1]).toBe('spenta');
    await page.locator('#inc-conferma').click();
    await expect.poll(async () => (await stato(page)).stelle[1]).toBe('accesa');
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

  for (const [nome, viewport, stelle] of [['verticale', { width: 375, height: 700 }, [0, 1, 2, 3, 4, 5]], ['orizzontale', { width: 740, height: 360 }, [0, 2, 4]]]) {
    test(`telefono in ${nome}: in ogni costellazione tutte le opzioni e le formule si vedono per intero`, async ({ browser }) => {
      test.setTimeout(600000);
      const ctx = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await apri(page);
      const problemi = [];
      for (let L = 0; L < 12; L++) {
        await avvia(page, L);
        for (const i of stelle) {
          await incontro(page, i);
          await page.waitForTimeout(900); // animazioni d'ingresso del pannello e delle opzioni
          const p = await page.evaluate(() => {
            const pan = document.getElementById('incontro').getBoundingClientRect();
            const cmd = document.getElementById('comandi').getBoundingClientRect();
            const fuori = [];
            if (pan.bottom > innerHeight + 1 || pan.top < -1) fuori.push('pannello fuori schermo');
            if (!(pan.right <= cmd.left || cmd.right <= pan.left || pan.bottom <= cmd.top || cmd.bottom <= pan.top)) fuori.push('pannello sopra i comandi');
            document.querySelectorAll('#incontro .opz').forEach((b, k) => {
              const r = b.getBoundingClientRect();
              if (r.top < pan.top - 1 || r.bottom > pan.bottom + 1 || r.left < pan.left - 1 || r.right > pan.right + 1) fuori.push(`opzione ${k + 1} fuori dal pannello`);
              const t = b.querySelector('.opz-t');
              if (t.scrollWidth > t.clientWidth + 1) fuori.push(`opzione ${k + 1} tagliata`);
              // anche in altezza: frazioni ed esponenti devono stare dentro la casella
              for (const f of b.querySelectorAll('.katex-html')) { const q = f.getBoundingClientRect(); if (q.top < r.top - 0.5 || q.bottom > r.bottom + 0.5 || q.left < r.left - 0.5 || q.right > r.right + 0.5) fuori.push(`opzione ${k + 1}: formula tagliata`); }
            });
            return fuori;
          });
          const aCapo = await formuleACapo(page);
          if (p.length || aCapo.length) problemi.push(`livello ${L}, stella ${i}: ${[...p, ...aCapo.map((f) => 'a capo: ' + f)].join('; ')}`);
          await page.evaluate(() => window.__astromath.giusta());
          await page.waitForTimeout(250);
          await page.evaluate(() => window.__astromath.pilota({ x: 0, y: 3, vx: 0, vy: 0 }));
          await page.waitForTimeout(1700);
        }
      }
      expect(problemi).toEqual([]);
      await ctx.close();
    });
  }

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
    expect(await formuleACapo(page)).toEqual([]);
    await ctx.close();
  });
});

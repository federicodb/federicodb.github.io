// Math Pool 3D: algebra dei passi, coerenza tra retta calcolata e fisica, feedback aptico, layout mobile.
// Uso: npx playwright test tests/math_pool.spec.js
const { test, expect } = require('@playwright/test');

const URL = '/content/apps/math_pool_retta_pianocartesiano.html?debug';

// soluzioni dei passi calcolate dai dati del livello (stringhe come le scriverebbe uno studente)
async function soluzione(page) {
  return page.evaluate(() => {
    const { S } = window.__orfini;
    const sf = S.sfida, d = sf.dati, i = sf.indice, p = sf.passi[i];
    const fr = (v) => { for (let den = 1; den <= 12; den++) { const n = Math.round(v * den); if (Math.abs(n / den - v) < 1e-9) return den === 1 ? String(n) : `${n}/${den}`; } return String(v); };
    if (p.tira) return null;
    if (sf.tab === 'tiro') {
      const { P, Q, B, m, q } = d;
      const xR = P.x + Math.sign(Q.x - P.x) * Math.floor(Math.abs(Q.x - P.x) / 2);
      return [{ m: fr(m) }, { y: fr(P.y), m: fr(m), x: fr(P.x) }, { q: fr(q) }, { m: fr(m), q: fr(q) }, { y: fr(m * B.x + q) }, { x: fr(xR), y: fr(m * xR + q) }][i];
    }
    const { B, Bs, c, m, q, I, mR, qR, tipo } = d, oriz = tipo === 'orizzontale';
    return [{ d: fr(Math.abs(c - (oriz ? B.y : B.x))) }, oriz ? { y: fr(Bs.y) } : { x: fr(Bs.x) }, { m: fr(m) }, { q: fr(q) },
      oriz ? { x: fr(I.x) } : { y: fr(I.y) }, { m: fr(mR) }, { q: fr(qR) }][i];
  });
}
async function risolviPassi(page) {
  for (let n = 0; n < 10; n++) {
    const sol = await soluzione(page);
    if (!sol) return;
    for (const [k, v] of Object.entries(sol)) await page.fill(`.passo.attivo .campo[data-k="${k}"]`, v);
    await page.click('.passo.attivo [data-azione="verifica"]');
  }
}
async function avvia(page, tab = 'tiro') {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await page.waitForSelector('#bGioca:not(.nascosto)');
  await page.click('#bGioca');
  await page.evaluate((t) => { if (window.__orfini.S.tab !== t) window.__orfini.cambiaTab(t); }, tab);
}

test('tiro: i passi algebrici sbloccano il tiro e la palla Q va nella buca chiamata', async ({ page }) => {
  await avvia(page, 'tiro');
  await risolviPassi(page);
  const esito = await page.evaluate(() => {
    const o = window.__orfini, d = o.direzioneAlgebrica();
    if (!d) return 'tiro non sbloccato';
    o.tira(d, 1); o.avanzaFinoAFermo();
    return o.S.sfida.esito ? o.S.sfida.esito.stelle : 'mancata';
  });
  expect(esito).toBe(3);
  await expect(page.locator('.esito')).toBeVisible();
});

test('tiro: con la palla R (urto a catena) la catena P → R → Q manda Q in buca', async ({ page }) => {
  await avvia(page, 'tiro');
  await page.evaluate(() => { window.__orfini.prog.tiro.max = 3; window.__orfini.nuovaSfida({ livello: 3 }); window.__orfini.renderPannello(); });
  await risolviPassi(page);
  const r = await page.evaluate(() => {
    const o = window.__orfini;
    const conR = o.palle.some((p) => p.ruolo === 'R');
    o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo();
    return { conR, ok: !!o.S.sfida.esito };
  });
  expect(r).toEqual({ conR: true, ok: true });
});

test('fisica: per molti tavoli generati il tiro lungo la retta calcolata va in buca', async ({ page }) => {
  await avvia(page, 'tiro');
  const falliti = await page.evaluate(() => {
    const o = window.__orfini, out = [];
    for (const tab of ['tiro', 'sponde']) {
      o.cambiaTab(tab);
      o.prog[tab].max = 8;
      for (let liv = 1; liv <= 8; liv++) for (let seme = 1; seme <= 6; seme++) {
        o.nuovaSfida({ livello: liv, seme: seme * 7919 + liv });
        const sf = o.S.sfida; sf.indice = sf.passi.length - 1;   // salta i calcoli: qui si prova solo la fisica
        o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo();
        if (!sf.esito) out.push(`${tab} liv ${liv} seme ${seme}`);
      }
    }
    return out;
  });
  expect(falliti).toEqual([]);
});

test('sponde: dopo il rimbalzo la pendenza della bianca è −m', async ({ page }) => {
  await avvia(page, 'sponde');
  await risolviPassi(page);
  const r = await page.evaluate(() => {
    const o = window.__orfini, d = o.S.sfida.dati;
    o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo();
    const rb = o.S.ultimoTiro.rimbalzi.find((x) => x.n === 0);
    return { m: d.m, mDopo: rb.vy / rb.vx, ok: !!o.S.sfida.esito };
  });
  expect(r.ok).toBe(true);
  expect(r.mDopo).toBeCloseTo(-r.m, 6);
});

test('errore produttivo: una pendenza sbagliata mostra la retta dello studente e non sblocca il passo', async ({ page }) => {
  await avvia(page, 'tiro');
  await page.fill('.passo.attivo .campo[data-k="m"]', '123');
  await page.click('.passo.attivo [data-azione="verifica"]');
  await expect(page.locator('.passo.attivo .msg.errore')).toBeVisible();
  await expect(page.locator('.etichetta.no')).toContainText('la tua');
  expect(await page.evaluate(() => window.__orfini.S.sfida.indice)).toBe(0);
});

test('sponde: l\'obiettivo è esplicito e il punto della sponda non è scambiato per il riflesso', async ({ page }) => {
  await avvia(page, 'sponde');
  await expect(page.locator('.obiettivo')).toContainText('un solo rimbalzo');
  await expect(page.locator('.etichetta.no')).toContainText('bloccata');
  await risolviPassi(page);   // risolve tutto, poi riprova da capo con l'errore tipico
  await page.evaluate(() => { window.__orfini.nuovaSfida({ livello: 1, seme: 4242 }); window.__orfini.renderPannello(); });
  const d = await page.evaluate(() => { const x = window.__orfini.S.sfida.dati; return { c: x.c, dist: Math.abs(x.c - (x.tipo === 'orizzontale' ? x.B.y : x.B.x)), k: x.tipo === 'orizzontale' ? 'y' : 'x' }; });
  await page.fill('.passo.attivo .campo[data-k="d"]', String(d.dist));
  await page.click('.passo.attivo [data-azione="verifica"]');
  await page.fill(`.passo.attivo .campo[data-k="${d.k}"]`, String(d.c));
  await page.click('.passo.attivo [data-azione="verifica"]');
  await expect(page.locator('.passo.attivo .msg.errore')).toContainText('non il suo riflesso');
});

// ogni riquadro con una formula deve restare su una sola riga
async function formuleSpezzate(page) {
  return page.evaluate(() => [...document.querySelectorAll('#contenuto .ris, #contenuto .formula, #contenuto .aiuto, #contenuto .coord, #contenuto .eq')]
    .filter((el) => el.offsetParent && el.getBoundingClientRect().height > parseFloat(getComputedStyle(el).lineHeight || '20') * 1.6 + 24)
    .map((el) => el.className + ': ' + el.textContent));
}
for (const [nome, vp] of [['desktop', { width: 1366, height: 768 }], ['telefono', { width: 360, height: 740 }]]) {
  test(`${nome}: nessuna formula del pannello va a capo, q e B' restano inquadrati`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize(vp);
    for (const tab of ['tiro', 'sponde']) {
      await avvia(page, tab);
      for (let n = 0; n < 10; n++) {
        const sol = await soluzione(page);
        if (!sol) break;
        for (let h = 0; h < 3; h++) await page.evaluate(() => { const b = document.querySelector('.passo.attivo [data-azione="aiuto"]'); if (b && !b.disabled) b.click(); });
        expect(await formuleSpezzate(page)).toEqual([]);
        for (const [k, v] of Object.entries(sol)) await page.fill(`.passo.attivo .campo[data-k="${k}"]`, v);
        await page.click('.passo.attivo [data-azione="verifica"]');
      }
      expect(await formuleSpezzate(page)).toEqual([]);
      await page.waitForTimeout(900);   // la camera si allarga con un'animazione
      const fuori = await page.evaluate(() => [...document.querySelectorAll('.etichetta')].filter((e) => /q|B'/.test(e.textContent))
        .filter((e) => { const r = e.getBoundingClientRect(); return r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight; }).map((e) => e.textContent));
      expect(fuori).toEqual([]);
    }
  });
}

test('set: un livello è fatto di 5 tavoli e il successivo si sblocca solo a set finito', async ({ page }) => {
  test.setTimeout(90000);
  await avvia(page, 'tiro');
  await expect(page.locator('.testa-liv .set')).toContainText('Tavolo 1 di 5');
  await expect(page.locator('#hudSx')).toContainText('tavolo 1/5');
  for (let n = 1; n <= 5; n++) {
    await risolviPassi(page);
    await page.evaluate(() => { const o = window.__orfini; o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo(); });
    await expect(page.locator('.esito')).toBeVisible();
    expect(await page.evaluate(() => window.__orfini.prog.tiro.max)).toBe(n < 5 ? 1 : 2);
    if (n < 5) {
      await expect(page.locator('.esito [data-azione="prossimo"]')).toContainText(`Prossimo tavolo (${n + 1} di 5)`);
      await page.click('.esito [data-azione="prossimo"]');
      await expect(page.locator('.testa-liv .set')).toContainText(`Tavolo ${n + 1} di 5`);
      await expect(page.locator('.testa-liv .liv b').first()).toHaveText('Livello 1');
    }
  }
  await expect(page.locator('.esito')).toContainText('Set completato!');
  await page.click('.esito [data-azione="prossimo"]');
  await expect(page.locator('.testa-liv .liv b').first()).toHaveText('Livello 2');
  await expect(page.locator('.testa-liv .set')).toContainText('Tavolo 1 di 5');
});

test('vista 3D: l\'orbita resta davanti al tavolo, senza giri completi né spostamenti', async ({ page }) => {
  test.setTimeout(90000);
  await avvia(page, 'lab');
  await page.click('#bVista');
  await page.waitForFunction(() => window.__orfini.orbita.enabled, null, { timeout: 8000 });
  await page.mouse.move(150, 120); await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(150 + i * 80, 120 + i * 40);
  await page.mouse.up(); await page.waitForTimeout(1500);
  const o = await page.evaluate(() => { const c = window.__orfini.orbita; return { az: c.getAzimuthalAngle(), pol: c.getPolarAngle(), pan: c.enablePan }; });
  expect(Math.abs(o.az)).toBeLessThanOrEqual(0.62);
  expect(o.pol).toBeLessThanOrEqual(1.09);
  expect(o.pan).toBe(false);
});

test('vista 3D: trascinare sul tavolo fa orbitare la camera, dalla bianca si mira', async ({ page }) => {
  test.setTimeout(90000);   // il rendering software dei test è lento in vista 3D
  await avvia(page, 'lab');
  await page.click('#bVista');
  await page.waitForFunction(() => window.__orfini.orbita.enabled, null, { timeout: 8000 });
  const prima = await page.evaluate(() => window.__orfini.camera.position.toArray());
  await page.mouse.move(300, 650); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(300 + i * 20, 650);
  await page.mouse.up(); await page.waitForTimeout(500);
  const dopo = await page.evaluate(() => window.__orfini.camera.position.toArray());
  expect(Math.hypot(dopo[0] - prima[0], dopo[2] - prima[2])).toBeGreaterThan(0.5);
  const bianca = await page.evaluate(() => { const o = window.__orfini, P = o.palle[0], v = new o.THREE.Vector3(P.x, 0.35, -P.y).project(o.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; });
  await page.mouse.move(bianca.x, bianca.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(bianca.x - i * 15, bianca.y + i * 4);
  expect(await page.evaluate(() => !!window.__orfini.S.mira?.dir)).toBe(true);
  await page.mouse.up();
});

test.describe('feedback aptico', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { window.__vibra = []; navigator.vibrate = (s) => { window.__vibra.push(s); return true; }; });
  });
  test('ogni evento ha la sua sequenza, la vibrazione spenta tace', async ({ page }) => {
    await avvia(page, 'tiro');
    await page.fill('.passo.attivo .campo[data-k="m"]', '999');
    await page.click('.passo.attivo [data-azione="verifica"]');
    expect(await page.evaluate(() => window.__vibra.at(-1))).toEqual([50, 40, 50]);
    await risolviPassi(page);
    expect(await page.evaluate(() => window.__vibra.some((s) => JSON.stringify(s) === '[12,60,12]'))).toBe(true);
    await page.evaluate(() => { const o = window.__orfini; o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo(); });
    const seq = await page.evaluate(() => window.__vibra.map((s) => JSON.stringify(s)));
    expect(seq).toContain('[40]');                   // tiro a piena potenza
    expect(seq).toContain('[30,40,15,25,10]');       // palla in buca
    await page.evaluate(() => { window.__orfini.Aptica.livello = 0; window.__vibra = []; window.__orfini.Aptica.vibra('buca', 1); window.__orfini.Aptica.vibra('errore', 1); });
    expect(await page.evaluate(() => window.__vibra.filter((s) => s !== 0).length)).toBe(0);
  });
  test('leggera dimezza gli impulsi', async ({ page }) => {
    await avvia(page, 'tiro');
    const s = await page.evaluate(() => { const A = window.__orfini.Aptica; A.livello = 1; return A.vibra('errore', 1); });
    expect(s).toEqual([25, 40, 25]);
  });
});

test.describe('telefono', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  test('niente scroll orizzontale, tastierino interno funzionante, pannello richiudibile', async ({ page }) => {
    await avvia(page, 'tiro');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator('#tastierino')).toBeVisible();
    await page.tap('#tastierino [data-t="−"]');
    await page.tap('#tastierino [data-t="3"]');
    await page.tap('#tastierino [data-t="/"]');
    await page.tap('#tastierino [data-t="2"]');
    expect(await page.inputValue('.passo.attivo .campo[data-k="m"]')).toBe('−3/2');
    await page.tap('#maniglia');
    await expect(page.locator('#pannello')).toHaveAttribute('data-stato', 'chiuso');
    await expect(page.locator('#tastierino')).toBeHidden();
    const piccoli = await page.evaluate(() => [...document.querySelectorAll('.barra .btn:not(.nascosto)')].filter((b) => b.getBoundingClientRect().height < 44).length);
    expect(piccoli).toBe(0);
  });
});

test.describe('telefono in orizzontale', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  test('testata su una riga, tastierino su due righe, Verifica visibile', async ({ page }) => {
    await avvia(page, 'tiro');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const r = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      return { testata: box('#testata').height, tast: box('#tastierino').height, verifica: box('.passo.attivo [data-azione="verifica"]'), tastTop: box('#tastierino').top, pann: box('#pannello').left, testDx: box('#testata').right };
    });
    expect(r.testata).toBeLessThan(60);
    expect(r.tast).toBeLessThan(100);
    await expect.poll(() => page.evaluate(() => document.querySelector('.passo.attivo [data-azione="verifica"]').getBoundingClientRect().bottom
      - document.querySelector('#tastierino').getBoundingClientRect().top)).toBeLessThanOrEqual(0);   // a scorrimento del pannello finito
    expect(r.testDx).toBeLessThanOrEqual(r.pann);
  });
});

test.describe('telefono in verticale', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  test('il pannello usa lo spazio libero: Verifica sopra il tastierino, tavolo intero sopra il pannello', async ({ page }) => {
    await avvia(page, 'tiro');
    const r = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      const o = window.__orfini, v = new o.THREE.Vector3(0, 0, 6.5).project(o.camera);
      return { verifica: box('.passo.attivo [data-azione="verifica"]').bottom, tastTop: box('#tastierino').top, pannTop: box('#pannello').top, bordoTavolo: (1 - v.y) / 2 * innerHeight };
    });
    await expect.poll(() => page.evaluate(() => document.querySelector('.passo.attivo [data-azione="verifica"]').getBoundingClientRect().bottom
      - document.querySelector('#tastierino').getBoundingClientRect().top)).toBeLessThanOrEqual(0);   // a scorrimento del pannello finito
    expect(r.bordoTavolo).toBeLessThanOrEqual(r.pannTop + 1);
  });
});

// Math Pool 3D: algebra dei passi, coerenza tra retta calcolata e fisica, feedback aptico, layout mobile.
// Uso: npx playwright test tests/math_pool.spec.js
const { test, expect } = require('@playwright/test');

const URL = '/content/apps/math_pool_retta_pianocartesiano.html?debug';

// soluzioni dei passi calcolate dai dati del livello (stringhe come le scriverebbe uno studente), per id del passo
async function soluzione(page) {
  return page.evaluate(() => {
    const { S } = window.__orfini;
    const sf = S.sfida, d = sf.dati, p = sf.passi[sf.indice];
    const fr = (v) => { for (let den = 1; den <= 12; den++) { const n = Math.round(v * den); if (Math.abs(n / den - v) < 1e-9) return den === 1 ? String(n) : `${n}/${den}`; } return String(v); };
    if (p.tira) return null;
    if (p.scelta) return 'scelta';
    if (sf.tab === 'tiro') {
      const { P, Q, B, m, q } = d;
      const xR = P.x + Math.sign(Q.x - P.x) * Math.floor(Math.abs(Q.x - P.x) / 2);
      return { m: { m: fr(m) }, sost: { y: fr(P.y), m: fr(m), x: fr(P.x) }, q: { q: fr(q) }, eq: { m: fr(m), q: fr(q) }, buca: { y: fr(m * B.x + q) }, R: { x: fr(xR), y: fr(m * xR + q) } }[p.id];
    }
    if (sf.tab === 'effetto') {
      const { V, a, P } = d;
      return { vertice: { h: fr(V.x), k: fr(V.y) }, a: { a: fr(a) }, P: { y: fr(P.y) }, zeri: { x1: fr(d.x1), x2: fr(d.x2) }, vertZ: { xv: fr(V.x), yv: fr(V.y) } }[p.id];
    }
    const { Bs, m, q, I, mR, tipo } = d, oriz = tipo === 'orizzontale';
    return { specchio: oriz ? { y: fr(Bs.y) } : { x: fr(Bs.x) }, m: { m: fr(m) }, q: { q: fr(q) }, I: oriz ? { x: fr(I.x) } : { y: fr(I.y) }, pendenze: { m: fr(m), mr: fr(mR) } }[p.id];
  });
}
async function risolviPassi(page) {
  for (let n = 0; n < 12; n++) {
    const sol = await soluzione(page);
    if (!sol) return;
    if (sol === 'scelta') { await page.click('.passo.attivo [data-azione="scegli"]'); continue; }
    for (const [k, v] of Object.entries(sol)) await page.fill(`.passo.attivo .campo[data-k="${k}"]`, v);
    await page.evaluate(() => window.__orfini.verificaPasso());
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
    for (const tab of ['tiro', 'sponde', 'effetto']) {
      o.cambiaTab(tab);
      o.prog[tab].max = 8;
      for (let liv = 1; liv <= 8; liv++) for (let seme = 1; seme <= 6; seme++) {
        o.nuovaSfida({ livello: liv, seme: seme * 7919 + liv });
        const scelte = o.S.sfida.dati.candidati?.length || 1;
        for (let j = 0; j < scelte; j++) {   // nei livelli con la scelta: ogni palla candidata deve andare in buca
          if (j) o.nuovaSfida({ livello: liv, seme: seme * 7919 + liv });
          if (o.S.sfida.dati.scelta) o.scegliPalla(j);
          const sf = o.S.sfida; sf.indice = sf.passi.length - 1;   // salta i calcoli: qui si prova solo la fisica
          o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo();
          if (!sf.esito) out.push(`${tab} liv ${liv} seme ${seme} palla ${j}`);
        }
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
  await expect(page.locator('.obiettivo')).toContainText('come in uno specchio');
  await page.evaluate(() => { const o = window.__orfini; o.prog.sponde.max = 2; o.nuovaSfida({ livello: 2, seme: 4242 }); o.renderPannello(); });
  const d = await page.evaluate(() => { const x = window.__orfini.S.sfida.dati; return { c: x.c, k: x.tipo === 'orizzontale' ? 'y' : 'x' }; });
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

test('set: un livello è fatto di 3 tavoli e il successivo si sblocca solo a set finito', async ({ page }) => {
  test.setTimeout(90000);
  await avvia(page, 'tiro');
  const N = await page.evaluate(() => window.__orfini.TAVOLI_SET);
  expect(N).toBe(3);
  await expect(page.locator('.testa-liv .set')).toContainText(`Tavolo 1 di ${N}`);
  await expect(page.locator('#hudSx')).toContainText(`tavolo 1/${N}`);
  for (let n = 1; n <= N; n++) {
    await risolviPassi(page);
    await page.evaluate(() => { const o = window.__orfini; o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo(); });
    await expect(page.locator('.esito')).toBeVisible();
    expect(await page.evaluate(() => window.__orfini.prog.tiro.max)).toBe(n < N ? 1 : 2);
    if (n < N) {
      await expect(page.locator('.esito [data-azione="prossimo"]')).toContainText(`Prossimo tavolo (${n + 1} di ${N})`);
      await page.click('.esito [data-azione="prossimo"]');
      await expect(page.locator('.testa-liv .set')).toContainText(`Tavolo ${n + 1} di ${N}`);
      await expect(page.locator('.testa-liv .liv b').first()).toHaveText('Livello 1');
    }
  }
  await expect(page.locator('.esito')).toContainText('Set completato!');
  await page.click('.esito [data-azione="prossimo"]');
  await expect(page.locator('.testa-liv .liv b').first()).toHaveText('Livello 2');
  await expect(page.locator('.testa-liv .set')).toContainText(`Tavolo 1 di ${N}`);
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
    await page.waitForTimeout(100);   // uno studente non tira entro 60 ms dalla risposta: il filtro anti-raffica non c'entra
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

// l'elemento è tutto visibile nel pannello, sopra il tastierino (a scorrimento finito)
function scopertoSopraTastierino(page, sel) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel); if (!el) return false;
    const r = el.getBoundingClientRect(), corpo = document.querySelector('#corpo').getBoundingClientRect(), t = document.querySelector('#tastierino').getBoundingClientRect();
    return r.top >= corpo.top - 1 && r.bottom <= Math.min(corpo.bottom, t.top) + 1;
  }, sel);
}

test.describe('telefono in orizzontale', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  test('testata su una riga, tastierino su due righe, Verifica visibile', async ({ page }) => {
    await avvia(page, 'tiro');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const r = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      return { testata: box('#testata').height, tast: box('#tastierino').height, pann: box('#pannello').left, testDx: box('#testata').right };
    });
    expect(r.testata).toBeLessThan(60);
    expect(r.tast).toBeLessThan(100);
    await expect.poll(() => scopertoSopraTastierino(page, '.passo.attivo .formula')).toBe(true);
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
      return { pannTop: box('#pannello').top, bordoTavolo: (1 - v.y) / 2 * innerHeight };
    });
    await expect.poll(() => scopertoSopraTastierino(page, '.passo.attivo .formula')).toBe(true);
    expect(r.bordoTavolo).toBeLessThanOrEqual(r.pannTop + 1);
  });
});

test.describe('telefono piccolo (360×640)', () => {
  test.use({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  for (const tab of ['tiro', 'sponde']) {
    test(`${tab}: il tastierino non copre mai campo, messaggio e tavolo`, async ({ page }) => {
      test.setTimeout(90000);
      await avvia(page, tab);
      await expect(page.locator('#tastierino')).toBeVisible();
      for (let n = 0; n < 8; n++) {
        const sol = await soluzione(page);
        if (!sol || sol === 'scelta') break;
        await expect.poll(() => scopertoSopraTastierino(page, '.passo.attivo .formula')).toBe(true);
        const k = Object.keys(sol)[0];
        await page.fill(`.passo.attivo .campo[data-k="${k}"]`, '97');
        await page.tap('#tastierino [data-t="ok"]');   // risposta sbagliata: il messaggio deve vedersi
        await expect.poll(() => scopertoSopraTastierino(page, '.passo.attivo .msg')).toBe(true);
        for (const [kk, v] of Object.entries(sol)) await page.fill(`.passo.attivo .campo[data-k="${kk}"]`, v);
        await page.tap('#tastierino [data-t="ok"]');
      }
      const r = await page.evaluate(() => { const o = window.__orfini, v = new o.THREE.Vector3(0, 0, 6.5).project(o.camera); return { pannTop: document.querySelector('#pannello').getBoundingClientRect().top, bordo: (1 - v.y) / 2 * innerHeight }; });
      expect(r.bordo).toBeLessThanOrEqual(r.pannTop + 1);
    });
  }
});

test('progressione del Tiro: pendenza intera, poi frazionaria, poi anche q frazionario; palle di disturbo per livello', async ({ page }) => {
  await avvia(page, 'tiro');
  const r = await page.evaluate(() => {
    const o = window.__orfini, out = {}, intero = (v) => Math.abs(v - Math.round(v)) < 1e-9;
    o.prog.tiro.max = 8;
    for (let liv = 1; liv <= 6; liv++) {
      const st = { mInt: 0, qInt: 0, decoro: 0, n: 0 };
      for (let seme = 1; seme <= 8; seme++) {
        o.nuovaSfida({ livello: liv, seme: seme * 31 + liv });
        const d = o.S.sfida.dati; st.n++;
        if (intero(d.m)) st.mInt++; if (intero(d.q)) st.qInt++;
        st.decoro = o.palle.filter((p) => p.ruolo === 'decoro').length;
      }
      out[liv] = st;
    }
    return out;
  });
  for (const l of [1, 2, 3]) expect(r[l].mInt).toBe(r[l].n);
  for (const l of [4, 5]) { expect(r[l].mInt).toBe(0); expect(r[l].qInt).toBe(r[l].n); }
  expect(r[6].qInt).toBe(0);
  expect(r[1].decoro).toBe(0);
  expect(r[6].decoro).toBeGreaterThan(r[1].decoro);
});

test('scegli la palla: più candidate allineate, si sceglie toccando, il resto dei passi segue la palla scelta', async ({ page }) => {
  await avvia(page, 'tiro');
  await page.evaluate(() => { const o = window.__orfini; o.prog.tiro.max = 7; o.nuovaSfida({ livello: 7, seme: 77 }); o.renderPannello(); });
  const n = await page.locator('.passo.attivo [data-azione="scegli"]').count();
  expect(n).toBeGreaterThanOrEqual(2);
  await page.locator('.passo.attivo [data-azione="scegli"]').nth(1).click();
  const d = await page.evaluate(() => { const x = window.__orfini.S.sfida.dati; return { nQ: x.nQ, n1: x.candidati[1].n, passo: window.__orfini.S.sfida.passi[1].id }; });
  expect(d.nQ).toBe(d.n1);
  expect(d.passo).toBe('m');
  await risolviPassi(page);
  const ok = await page.evaluate(() => { const o = window.__orfini; o.tira(o.direzioneAlgebrica(), 1); o.avanzaFinoAFermo(); return !!o.S.sfida.esito; });
  expect(ok).toBe(true);
});

test('sponde: mentre si scrive la x del punto I la traiettoria compare subito sul tavolo', async ({ page }) => {
  await avvia(page, 'sponde');
  const d = await page.evaluate(() => { const x = window.__orfini.S.sfida.dati; return { I: x.I, oriz: x.tipo === 'orizzontale' }; });
  expect(d.oriz).toBe(true);
  await page.fill('.passo.attivo .campo[data-k="x"]', String(d.I.x + 3));
  await expect(page.locator('.etichetta', { hasText: 'in buca!' })).toHaveCount(0);
  await page.fill('.passo.attivo .campo[data-k="x"]', String(d.I.x));
  await expect(page.locator('.etichetta', { hasText: 'in buca!' })).toHaveCount(1);
  expect(await page.evaluate(() => window.__orfini.S.sfida.indice)).toBe(0);   // l'anteprima non invia la risposta
});

test.describe('spiegami', () => {
  test('dalla home e dal pannello si apre la scena giusta; mentre è aperta Spazio non tira', async ({ page }) => {
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.goto(URL);
    await page.waitForSelector('#bGioca:not(.nascosto)');
    await page.click('#schermata [data-explain=""]');
    await expect(page.locator('#explain')).toBeVisible();
    await expect(page.locator('#explainFrame')).toHaveAttribute('src', 'math_pool_retta_pianocartesiano_spiegazione.html?embed=1');
    await page.keyboard.press('Escape');
    await expect(page.locator('#explain')).toBeHidden();
    await page.click('#bGioca');
    await page.evaluate(() => window.__orfini.cambiaTab('sponde'));
    await page.click('#contenuto [data-explain="mode"]');
    await expect(page.locator('#explainFrame')).toHaveAttribute('src', 'math_pool_retta_pianocartesiano_spiegazione.html?embed=1#sponde');
    await page.evaluate(() => { const o = window.__orfini; o.S.sfida.indice = o.S.sfida.passi.length - 1; });
    await page.keyboard.down(' '); await page.waitForTimeout(300); await page.keyboard.up(' ');
    expect(await page.evaluate(() => window.__orfini.S.stato)).toBe('mira');
  });

  test('la spiegazione disegna ogni scena senza errori e in embed parte dalla scena chiesta', async ({ page }) => {
    const errori = [];
    page.on('pageerror', (e) => errori.push(e.message));
    await page.goto('/content/apps/math_pool_retta_pianocartesiano_spiegazione.html');
    const scene = await page.evaluate(() => window.__spiega.SC.map((s) => ({ id: s.id, a: s.a, b: s.b })));
    expect(scene.map((s) => s.id)).toEqual(['intro', 'tiro', 'scelta', 'sponde', 'effetto', 'lab', 'end']);
    for (const s of scene) for (let x = s.a; x < s.b; x += 0.5) await page.evaluate((v) => { window.__spiega.t = v; }, x);
    expect(errori).toEqual([]);
    await page.goto('/content/apps/math_pool_retta_pianocartesiano_spiegazione.html?embed=1#scelta');
    await expect(page.locator('#cap')).toContainText('Nei livelli alti');
    await expect(page.locator('header')).toBeHidden();
  });
});

test.describe('effetto', () => {
  test('ogni livello genera una parabola: vertice ai primi livelli, zeri dal 3, sempre con la 8 sulla strada dritta', async ({ page }) => {
    await avvia(page, 'effetto');
    const r = await page.evaluate(() => {
      const o = window.__orfini, out = [];
      o.prog.effetto.max = 6;
      for (let liv = 1; liv <= 6; liv++) for (let seme = 1; seme <= 5; seme++) {
        o.nuovaSfida({ livello: liv, seme: seme * 13 + liv });
        const d = o.S.sfida.dati;
        out.push({ liv, forma: d.forma, inV: d.P.x === d.V.x && d.P.y === d.V.y, blocco: !!d.blocco, passaB: Math.abs(d.a * 0 + (d.forma === 'zeri' ? d.a * (d.B.x - d.x1) * (d.B.x - d.x2) : d.a * (d.B.x - d.V.x) ** 2 + d.V.y) - d.B.y) < 1e-9 });
      }
      return out;
    });
    for (const x of r) { expect(x.blocco).toBe(true); expect(x.passaB).toBe(true); }
    expect(r.filter((x) => x.liv === 1).every((x) => x.forma === 'vertice' && x.inV)).toBe(true);
    expect(r.filter((x) => x.liv === 2).every((x) => x.forma === 'vertice' && !x.inV)).toBe(true);
    expect(r.filter((x) => x.liv === 3 || x.liv === 4).every((x) => x.forma === 'zeri')).toBe(true);
  });

  test('vertice: con i passi risolti la bianca curva lungo la parabola e va in buca; il tiro dritto non vale', async ({ page }) => {
    await avvia(page, 'effetto');
    await risolviPassi(page);
    const r = await page.evaluate(() => {
      const o = window.__orfini, d = o.S.sfida.dati, c = { A: d.a, B: -2 * d.a * d.V.x, C: d.a * d.V.x ** 2 + d.V.y };
      o.tira(o.direzioneAlgebrica(), 1);
      let scarto = 0;
      for (let n = 0; n < 4000 && o.S.stato === 'tiro'; n++) {
        o.passoFisico();
        const P = o.palle[0];
        if (P.curva && Math.hypot(P.x - d.B.x, P.y - d.B.y) > d.B.R + 0.3) scarto = Math.max(scarto, Math.abs(P.y - (c.A * P.x * P.x + c.B * P.x + c.C)));   // fino all'imbocco della buca
        if (o.tuttoFermo()) { o.concludiTiro(); break; }
      }
      return { ok: !!o.S.sfida.esito, scarto };
    });
    expect(r.ok).toBe(true);
    expect(r.scarto).toBeLessThan(1e-9);
    // senza la 8 in mezzo un tiro dritto in buca entra, ma non vale
    const dritto = await page.evaluate(() => {
      const o = window.__orfini; o.nuovaSfida({ livello: 1, seme: 99 });
      const sf = o.S.sfida, d = sf.dati, P = o.palle[0];
      sf.indice = sf.passi.length - 1;
      o.palle.filter((p) => p.n !== 0).forEach((p) => { p.attiva = false; p.visibile = false; });
      const L = Math.hypot(d.B.x - P.x, d.B.y - P.y);
      o.tira({ x: (d.B.x - P.x) / L, y: (d.B.y - P.y) / L }, 1); o.avanzaFinoAFermo();
      return { buca: o.S.ultimoTiro.buche.some((b) => b.n === 0), esito: !!sf.esito };
    });
    expect(dritto).toEqual({ buca: true, esito: false });
    await expect(page.locator('#avviso')).toContainText('Dritta non vale');
  });

  test('zeri: anteprima della parabola mentre si scrive a, poi il prodotto di due rette sul piano', async ({ page }) => {
    await avvia(page, 'effetto');
    await page.evaluate(() => { const o = window.__orfini; o.prog.effetto.max = 3; o.nuovaSfida({ livello: 3, seme: 3 }); o.renderPannello(); });
    const d = await page.evaluate(() => { const x = window.__orfini.S.sfida.dati; return { x1: x.x1, x2: x.x2, a: x.a }; });
    await page.fill('.passo.attivo .campo[data-k="x1"]', String(d.x1));
    await page.fill('.passo.attivo .campo[data-k="x2"]', String(d.x2));
    await page.evaluate(() => window.__orfini.verificaPasso());
    await page.fill('.passo.attivo .campo[data-k="a"]', '7');
    await expect(page.locator('.etichetta', { hasText: 'non passa per B' })).toHaveCount(1);
    const sol = await soluzione(page);
    await page.fill('.passo.attivo .campo[data-k="a"]', sol.a);
    await expect(page.locator('.etichetta', { hasText: 'passa per B!' })).toHaveCount(1);
    await page.evaluate(() => window.__orfini.verificaPasso());
    await expect(page.locator('.etichetta', { hasText: 'r₁:' })).toHaveCount(1);
    await expect(page.locator('.etichetta', { hasText: 'r₂:' })).toHaveCount(1);
    await expect(page.locator('.etichetta', { hasText: /^[^:]+\s·\s[^:]+\s=\s[^:]+$/ })).toHaveCount(1);   // il cursore r₁ · r₂ = y
  });
});

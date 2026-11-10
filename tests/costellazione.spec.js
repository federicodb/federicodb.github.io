// @ts-check
// Home, vista costellazione (Fase 2): disposizione calcolata dal build, tela con i nodi HTML sopra,
// scheda della stella, zoom semantico, ricerca, tastiera, elasticità, scelta della vista.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ATTIVITA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/attivita.json'), 'utf8'));
const VOCABOLARIO = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/vocabolario.json'), 'utf8'));
const MAPPA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mappa.json'), 'utf8'));
const nodo = (page, id) => page.locator(`.nodo[data-nodo="${id}"]`);
const vista = (page) => page.evaluate(() => window.omCielo.vista());
const fermo = async (page) => { let prima = null; await expect.poll(async () => { const v = JSON.stringify(await vista(page)); const uguale = v === prima; prima = v; return uguale; }, { intervals: [150] }).toBe(true); };

test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] } });
test.beforeEach(async ({ page }, info) => {
  // la vista è scelta a mano, così la prova di fluidità (pensata per i dispositivi lenti) non interviene nei test;
  // fanno eccezione i test su quale vista si apre da sola
  const scelta = !info.titlePath.some((t) => t.includes('senza una scelta'));
  await page.addInitScript((sc) => { try { if (sc) localStorage.setItem('orfini_vista', 'costellazione'); localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' })); } catch (e) { /* senza archivio */ } }, scelta);
});

test('la disposizione è calcolata dal build: stessi dati, stessa mappa', async () => {
  const ricalcolata = execFileSync('node', ['tools/mappa.mjs', '--stampa'], { cwd: ROOT, encoding: 'utf8' });
  expect(ricalcolata).toBe(fs.readFileSync(path.join(ROOT, 'data/mappa.json'), 'utf8'));
  expect(MAPPA.parole.map((p) => p.id).sort()).toEqual(VOCABOLARIO.map((p) => p.id).sort());
  // le figlie restano vicine al padre: più vicine della distanza media tra due stelle qualsiasi
  const pos = Object.fromEntries(MAPPA.parole.map((p) => [p.id, p]));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const tutte = MAPPA.parole.flatMap((a, i) => MAPPA.parole.slice(i + 1).map((b) => dist(a, b)));
  const media = tutte.reduce((t, d) => t + d, 0) / tutte.length;
  for (const p of VOCABOLARIO.filter((x) => x.padre)) expect(dist(pos[p.id], pos[p.padre]), p.id).toBeLessThan(media * 0.45);
  // nessuna stella sopra un'altra
  for (const [i, a] of MAPPA.parole.entries()) for (const b of MAPPA.parole.slice(i + 1)) expect(dist(a, b), `${a.id} / ${b.id}`).toBeGreaterThan(a.r + b.r);
});

test('si apre la costellazione: tela disegnata, un pulsante per ogni sezione e parola, stessa mappa a ogni visita', async ({ page }) => {
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.goto('/index.html');
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
  await expect(page.locator('#cielo')).toBeVisible();
  await expect(page.locator('#main-grid')).toBeHidden();
  await expect(page.locator('.nodo-sezione')).toHaveCount(4);
  await expect(page.locator('.nodo-stella')).toHaveCount(VOCABOLARIO.length);
  await expect(nodo(page, 'numeri-irrazionali')).toHaveAttribute('aria-label', /numeri irrazionali, \d+ voci/);
  for (const s of ['Attività', 'Allenati', 'Journal', 'Archivio']) await expect(page.locator('.nodo-sezione.con-etichetta', { hasText: s })).toBeVisible();
  await fermo(page);
  // la tela non è vuota
  const colorati = await page.evaluate(() => { const c = document.getElementById('cielo-tela'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; });
  expect(colorati).toBeGreaterThan(5000);
  const prima = await page.evaluate(() => window.omCielo.nodi.map((n) => [n.id, Math.round(n.x), Math.round(n.y)]));
  await page.reload();
  await fermo(page);
  expect(await page.evaluate(() => window.omCielo.nodi.map((n) => [n.id, Math.round(n.x), Math.round(n.y)]))).toEqual(prima);
  expect(errori).toEqual([]);
});

test('zoom semantico: le figlie si leggono solo da vicino', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  await expect(nodo(page, 'funzione')).toHaveClass(/con-etichetta/);
  await expect(nodo(page, 'parabola')).toHaveClass(/nascosta/);
  await expect(nodo(page, 'parabola')).not.toHaveClass(/con-etichetta/);
  const c = await nodo(page, 'funzione').boundingBox();
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -180);
  await fermo(page);
  await expect(nodo(page, 'parabola')).not.toHaveClass(/nascosta/);
  await expect(nodo(page, 'parabola')).toHaveClass(/con-etichetta/);
  await page.locator('[data-comando="ricentra"]').click();
  await fermo(page);
  await expect(nodo(page, 'parabola')).toHaveClass(/nascosta/);
  const v = await vista(page);
  expect(Math.abs(v.k - v.k0)).toBeLessThan(0.001);
});

test('clic su una stella: scheda con nome completo, alias, attività per sezione e parole vicine', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  await nodo(page, 'frazione').click();
  const scheda = page.locator('#scheda');
  await expect(scheda).toBeVisible();
  await expect(scheda.locator('h2')).toHaveText('frazione');
  await expect(scheda.locator('h2')).toBeFocused();
  await expect(scheda.locator('.scheda-alias')).toContainText('Detto anche: frazioni');
  const attese = ATTIVITA.filter((a) => a.parole.includes('frazione'));
  await expect(scheda.locator('.scheda-voci a')).toHaveCount(attese.length);
  for (const s of [...new Set(attese.map((a) => a.sezione))]) await expect(scheda.locator(`section[data-sezione="${s}"] h3`)).toBeVisible();
  const lab = attese.find((a) => a.id === 'fractions-lab-001');
  await expect(scheda.locator('.scheda-voci a', { hasText: lab.titolo })).toHaveAttribute('href', lab.url);
  await expect(scheda.locator('.scheda-voci a', { hasText: lab.titolo }).locator('small')).toHaveText('Simulazione');
  // una parola vicina apre la sua scheda
  await scheda.locator('.scheda-vicine button', { hasText: 'percentuale' }).click();
  await expect(scheda.locator('h2')).toHaveText('percentuale');
  await expect(nodo(page, 'percentuale')).toHaveClass(/scelta/);
  // un padre comprende le figlie, e aprendolo le figlie diventano leggibili
  await nodo(page, 'numeri').click();
  await fermo(page);
  await expect(scheda.locator('h2')).toHaveText('numeri');
  const figlie = new Set(['numeri', ...VOCABOLARIO.filter((p) => p.padre === 'numeri').map((p) => p.id)]);
  await expect(scheda.locator('.scheda-voci a')).toHaveCount(ATTIVITA.filter((a) => a.parole.some((p) => figlie.has(p))).length);
  await expect(nodo(page, 'numeri-irrazionali')).toHaveClass(/con-etichetta/);
  // Esc chiude e riporta il fuoco sulla stella
  await page.keyboard.press('Escape');
  await expect(scheda).toBeHidden();
  await expect(nodo(page, 'numeri')).toBeFocused();
});

test('"Vedi nell\'elenco" e l\'interruttore passano all\'elenco con lo stesso filtro; la scelta si ricorda', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  await nodo(page, 'retta').dispatchEvent('click');
  await page.locator('#scheda [data-vista-elenco]').click();
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'elenco');
  await expect(page.locator('#main-grid')).toBeVisible();
  await expect(page.locator('#main-grid .card:visible')).toHaveCount(ATTIVITA.filter((a) => a.parole.includes('retta')).length);
  await expect(page.locator('.om-vista-voce[data-vista="elenco"]')).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => localStorage.getItem('orfini_vista'))).toBe('elenco');
  // e ritorno: la stella del filtro è aperta
  await page.locator('.om-vista-voce[data-vista="costellazione"]').click();
  await expect(page.locator('#cielo')).toBeVisible();
  await expect(page.locator('#scheda h2')).toHaveText('retta nel piano cartesiano');
  expect(await page.evaluate(() => localStorage.getItem('orfini_vista'))).toBe('costellazione');
});

test('la ricerca accende le stelle che corrispondono e spegne le altre', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  await page.locator('#cerca').fill('frazioni');
  await expect(nodo(page, 'frazione')).not.toHaveClass(/spenta/);
  await expect(nodo(page, 'frazione-algebrica')).not.toHaveClass(/spenta/);
  await expect(nodo(page, 'caos')).toHaveClass(/spenta/);
  await expect(page.locator('#cielo-stato')).toContainText('stelle per «frazioni»');
  // un tema che non è una stella accende le stelle delle sue attività
  await page.locator('#cerca').fill('mercatore');
  await expect(nodo(page, 'modelli')).not.toHaveClass(/spenta/);
  await expect(nodo(page, 'frattali')).toHaveClass(/spenta/);
  // una sola stella: Invio la apre
  await page.locator('#cerca').fill('invalsi');
  await page.keyboard.press('Enter');
  await expect(page.locator('#scheda h2')).toHaveText('prove INVALSI');
  await page.locator('#cerca').fill('');
  await expect(nodo(page, 'caos')).not.toHaveClass(/spenta/);
});

test('tastiera: Tab tra i nodi, Invio apre, Esc chiude; una figlia nascosta si porta in vista', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  await page.locator('.nodo-sezione').first().focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.nodo-sezione').nth(1)).toBeFocused();
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await expect(nodo(page, 'numeri')).toBeFocused();
  expect(await nodo(page, 'numeri').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab'); // prima figlia: da lontano è nascosta, il fuoco la porta in vista
  await expect(nodo(page, 'numeri-interi')).toBeFocused();
  await fermo(page);
  await expect(nodo(page, 'numeri-interi')).not.toHaveClass(/nascosta/);
  await page.keyboard.press('Enter');
  await expect(page.locator('#scheda h2')).toHaveText('numeri interi');
  await page.keyboard.press('Escape');
  await expect(page.locator('#scheda')).toBeHidden();
  await expect(nodo(page, 'numeri-interi')).toBeFocused();
  // frecce e tasti + − 0
  const prima = await vista(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('+');
  await fermo(page);
  const dopo = await vista(page);
  expect(dopo.k).toBeGreaterThan(prima.k);
  await page.keyboard.press('0');
  await fermo(page);
  expect(Math.abs((await vista(page)).k - prima.k0)).toBeLessThan(0.001);
});

test('elasticità: trascinando una stella quelle collegate la seguono, poi tutto torna a posto', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  const pos = (id) => page.evaluate((i) => { const n = window.omCielo.nodi.find((x) => x.id === i); return { x: n.x, y: n.y, rx: n.rx, ry: n.ry }; }, id);
  const b = await nodo(page, 'polinomi').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 90, b.y + b.height / 2 - 60, { steps: 6 });
  await page.mouse.move(b.x + b.width / 2 + 180, b.y + b.height / 2 - 120, { steps: 6 });
  await page.waitForTimeout(500);
  const figlia = await pos('scomposizione'), lontana = await pos('automi-cellulari');
  const spostamento = (p) => Math.hypot(p.x - p.rx, p.y - p.ry);
  expect(spostamento(await pos('polinomi'))).toBeGreaterThan(100);
  expect(spostamento(figlia)).toBeGreaterThan(40);                 // la figlia segue
  expect(spostamento(lontana)).toBeLessThan(spostamento(figlia) / 4); // chi non è collegato quasi non si muove
  await page.mouse.up();
  await expect(page.locator('#scheda')).toBeHidden();              // trascinare non apre la scheda
  // rimbalza e poi si ferma esattamente dov'era: tutte le stelle tornano alla posizione di riposo
  const massimo = () => page.evaluate(() => Math.max(...window.omCielo.nodi.map((n) => Math.hypot(n.x - n.rx, n.y - n.ry))));
  await expect.poll(massimo, { timeout: 10000 }).toBe(0);
  // lo sfondo si trascina: la mappa si sposta
  const prima = await vista(page);
  await page.mouse.move(40, 420); await page.mouse.down(); await page.mouse.move(140, 470, { steps: 4 }); await page.mouse.up();
  const dopo = await vista(page);
  expect(Math.round(dopo.tx - prima.tx)).toBe(100);
  expect(Math.round(dopo.ty - prima.ty)).toBe(50);
});

test('con "riduci movimento" resta la costellazione, ma ferma', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/index.html');
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
  await expect(page.locator('#cielo')).toBeVisible();
  await page.waitForFunction(() => window.omCielo);
  const b = await nodo(page, 'polinomi').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + 150, b.y + 100, { steps: 5 });
  const n = await page.evaluate(() => { const x = window.omCielo.nodi.find((i) => i.id === 'polinomi'); return Math.hypot(x.x - x.rx, x.y - x.ry); });
  expect(n).toBe(0); // la stella non si stacca: si sposta la mappa
  await page.mouse.up();
  const prima = await vista(page);
  await nodo(page, 'caos').dispatchEvent('click');
  const subito = await vista(page); // nessun volo: la vista cambia in un colpo
  await page.waitForTimeout(300);
  expect(await vista(page)).toEqual(subito);
  expect(subito).not.toEqual(prima);
  await ctx.close();
});

test('le voci del menu volano sulla sezione; il secondo clic apre la pagina', async ({ page }) => {
  await page.goto('/index.html');
  await fermo(page);
  await page.locator('#barra .om-voci a', { hasText: 'Journal' }).click();
  await expect(page).toHaveURL(/\/(index\.html)?(\?sezione=journal)?$/);
  await expect(page.locator('#scheda h2')).toHaveText('Journal');
  await expect(nodo(page, 'sezione:journal')).toHaveClass(/scelta/);
  await expect(page.locator('#scheda .scheda-azione.principale')).toHaveAttribute('href', 'journal/');
  await page.locator('#barra .om-voci a', { hasText: 'Journal' }).click();
  await expect(page).toHaveURL(/\/journal\/$/);
});

test('telefono (380 px): mappa verticale, scheda dal basso, attività in due tocchi, niente scorrimento orizzontale', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 380, height: 780 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('orfini_vista', 'costellazione'));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  expect((await vista(page)).verticale).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  // tutti i nodi stanno dentro lo schermo
  const fuori = await page.evaluate(() => { const v = window.omCielo.vista(); return window.omCielo.nodi.filter((n) => { const x = n.x * v.k + v.tx, y = n.y * v.k + v.ty; return x < 8 || x > v.W - 8 || y < 40 || y > v.H - 8; }).map((n) => n.id); });
  expect(fuori).toEqual([]);
  await nodo(page, 'frazione').tap();                                         // primo tocco: la stella
  const scheda = page.locator('#scheda');
  await expect(scheda).toBeVisible();
  const r = await scheda.boundingBox();
  expect(r.width).toBeGreaterThan(370);
  expect(r.y).toBeGreaterThan(250);                                           // sale dal basso, la mappa resta visibile sopra
  const voce = scheda.locator('.scheda-voci a').first();
  const href = await voce.getAttribute('href');
  await voce.tap();                                                           // secondo tocco: l'attività
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/#.*/, '')));
  await ctx.close();
});

test.describe('quale vista si apre senza una scelta', () => {
  test('poca memoria o risparmio dati: elenco, con un avviso e il pulsante per provare la mappa', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 }));
    await page.goto('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'elenco');
    await expect(page.locator('#main-grid .card').first()).toBeVisible();
    await expect(page.locator('#avviso-lento')).toBeVisible();
    await page.locator('#prova-mappa').click();
    await expect(page.locator('#cielo')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('orfini_vista'))).toBe('costellazione');
    await page.reload(); // la scelta fatta a mano vince sul controllo della memoria
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
  });

  test('risparmio dati attivo: elenco', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) }));
    await page.goto('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'elenco');
    await expect(page.locator('#avviso-lento')).toBeVisible();
  });

  test('meno di 20 fotogrammi nel primo secondo: si passa all\'elenco con l\'avviso', async ({ page }) => {
    // il browser di prova consegna un fotogramma ogni 100 ms
    await page.addInitScript(() => { window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 100); });
    await page.goto('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'elenco', { timeout: 5000 });
    await expect(page.locator('#avviso-lento')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('orfini_vista'))).toBeNull(); // non è una scelta dell'utente
  });

  test('dispositivo normale: costellazione, e resta', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
    await page.waitForTimeout(1500);
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
    await expect(page.locator('#avviso-lento')).toBeHidden();
  });
});

for (const tema of ['dark', 'light']) {
  test(`contrasto AA di etichette, legenda e scheda (tema ${tema})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('orfini_theme', t), tema);
    await page.goto('/index.html?parola=funzione');
    await expect(page.locator('#scheda h2')).toBeVisible();
    await page.locator('#cielo-legenda summary').click();
    const bassi = await page.evaluate(() => {
      const rgb = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const pagina = rgb(getComputedStyle(document.body).backgroundColor);
      const out = [];
      for (const el of document.querySelectorAll('.nodo.con-etichetta .nodo-etichetta, .cielo-legenda summary, .cielo-legenda li, .cielo-legenda p, .scheda h2, .scheda-occhiello, .scheda-desc, .scheda-alias, .scheda h3, .scheda-voci small, .scheda-voci span, .scheda-vicine button, .scheda-azione')) {
        if (!el.checkVisibility()) continue;
        // fondo: quello del pannello più vicino (scheda, legenda) oppure il cielo
        let f = pagina; for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.a > 0.9) { f = c; break; } }
        const t = rgb(getComputedStyle(el).color);
        const [a, b] = [lum(t), lum(f)].sort((x, y) => y - x);
        const rapporto = (a + 0.05) / (b + 0.05);
        if (rapporto < 4.5) out.push(`${el.className} «${el.textContent.trim().slice(0, 24)}» ${rapporto.toFixed(2)}`);
      }
      return [...new Set(out)];
    });
    expect(bassi).toEqual([]);
  });
}

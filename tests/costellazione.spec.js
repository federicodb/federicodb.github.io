// @ts-check
// Home, vista costellazione (Fasi 2 e 3): una nebulosa in tre dimensioni. Disposizione calcolata dal build, tela con i nodi
// HTML sopra, rotazione inerziale, stelle elastiche che restano dove le si lascia, scheda, zoom semantico, ricerca,
// tastiera, effetti (onda, percorso, transizione tra le viste), "Riduci effetti", scelta della vista.
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
/** Apre la home e ferma rotazione e battito con il pulsante di pausa: i test che non riguardano il movimento lavorano a scena ferma */
const apriFerma = async (page, url = '/index.html') => {
  await page.goto(url);
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  await page.locator('[data-comando="pausa"]').click();
  await fermo(page);
};
/** Una stella si apre con un clic sul suo pulsante (in tre dimensioni un'altra stella può passarle davanti: il clic va al pulsante) */
const apriStella = (page, id) => nodo(page, id).dispatchEvent('click');
/** La stella più avanti tra quelle libere (nessun'altra le passa davanti), per i gesti fatti davvero con il puntatore */
const stellaLibera = (page, filtro = '() => true') => page.evaluate((f) => {
  const ok = new Function('return ' + f)(), r = document.getElementById('cielo').getBoundingClientRect();
  const libere = window.omCielo.nodi.filter((n) => n.tipo === 'stella' && !n.nascosta && ok(n) && document.elementFromPoint(r.left + n.sx, r.top + n.sy)?.closest('.nodo') === n.el);
  const n = libere.sort((a, b) => b.prof - a.prof)[0];
  return n ? { id: n.id, x: r.left + n.sx, y: r.top + n.sy } : null;
}, filtro);
const stato = (page, id) => page.evaluate((i) => { const n = window.omCielo.nodi.find((x) => x.id === i); return { x: n.x, y: n.y, z: n.z, ox: n.ox, oy: n.oy, oz: n.oz, sx: n.sx, sy: n.sy }; }, id);
const lontano = (p) => Math.hypot(p.x - p.ox, p.y - p.oy, p.z - p.oz); // quanto una stella è lontana dal posto calcolato dal build

// Niente grafica software (swiftshader) qui: serve alle app WebGL, ma con una tela 2D che si ridisegna di continuo
// fa crollare i fotogrammi dopo pochi secondi e falsa i test sul movimento.
test.beforeEach(async ({ page }, info) => {
  // la vista è scelta a mano, così la prova di fluidità (pensata per i dispositivi lenti) non interviene nei test;
  // fanno eccezione i test su quale vista si apre da sola
  const scelta = !info.titlePath.some((t) => t.includes('senza una scelta'));
  await page.addInitScript((sc) => { try { if (sc) localStorage.setItem('orfini_vista', 'costellazione'); localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' })); } catch (e) { /* senza archivio */ } }, scelta);
});

test('la disposizione è calcolata dal build, in tre dimensioni: stessi dati, stessa nebulosa', async () => {
  const ricalcolata = execFileSync('node', ['tools/mappa.mjs', '--stampa'], { cwd: ROOT, encoding: 'utf8' });
  expect(ricalcolata).toBe(fs.readFileSync(path.join(ROOT, 'data/mappa.json'), 'utf8'));
  expect(MAPPA.parole.map((p) => p.id).sort()).toEqual(VOCABOLARIO.map((p) => p.id).sort());
  const pos = Object.fromEntries(MAPPA.parole.map((p) => [p.id, p]));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  // è davvero un volume: la profondità è paragonabile all'altezza
  const largo = (c) => Math.max(...MAPPA.parole.map((p) => p[c])) - Math.min(...MAPPA.parole.map((p) => p[c]));
  expect(largo('z')).toBeGreaterThan(largo('y') * 0.6);
  // le figlie restano vicine al padre: più vicine della distanza media tra due stelle qualsiasi
  const tutte = MAPPA.parole.flatMap((a, i) => MAPPA.parole.slice(i + 1).map((b) => dist(a, b)));
  const media = tutte.reduce((t, d) => t + d, 0) / tutte.length;
  for (const p of VOCABOLARIO.filter((x) => x.padre)) expect(dist(pos[p.id], pos[p.padre]), p.id).toBeLessThan(media * 0.45);
  // nessuna stella dentro un'altra
  for (const [i, a] of MAPPA.parole.entries()) for (const b of MAPPA.parole.slice(i + 1)) expect(dist(a, b), `${a.id} / ${b.id}`).toBeGreaterThan(a.r + b.r);
});

test('si apre la nebulosa: tela disegnata, un pulsante per ogni sezione e parola, stessa partenza a ogni visita', async ({ page }) => {
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await apriFerma(page);
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
  await expect(page.locator('#cielo')).toBeVisible();
  await expect(page.locator('#main-grid')).toBeHidden();
  await expect(page.locator('.nodo-sezione')).toHaveCount(4);
  await expect(page.locator('.nodo-stella')).toHaveCount(VOCABOLARIO.length);
  await expect(nodo(page, 'numeri-irrazionali')).toHaveAttribute('aria-label', /numeri irrazionali, \d+ voci/);
  for (const s of ['Attività', 'Allenati', 'Journal', 'Archivio']) await expect(page.locator('.nodo-sezione.con-etichetta', { hasText: s })).toBeVisible();
  const colorati = await page.evaluate(() => { const c = document.getElementById('cielo-tela'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; });
  expect(colorati).toBeGreaterThan(800); // fili e polvere: aloni e parole sono nel foglio di stile, non sulla tela
  // prospettiva: a parità di raggio, una stella più vicina all'osservatore è disegnata più grande
  const scale = await page.evaluate(() => window.omCielo.nodi.map((n) => ({ prof: n.prof, scala: n.scala })).sort((a, b) => a.prof - b.prof));
  expect(scale.at(-1).scala).toBeGreaterThan(scale[0].scala * 1.1);
  const posti = () => page.evaluate(() => window.omCielo.nodi.map((n) => [n.id, Math.round(n.x), Math.round(n.y), Math.round(n.z)]));
  const prima = await posti();
  expect(prima.filter(([id]) => !id.startsWith('sezione:') && id !== 'sole').map(([id, x, y, z]) => ({ id, x, y, z }))).toEqual(MAPPA.parole.map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z })));
  await apriFerma(page);
  expect(await posti()).toEqual(prima);
  expect(errori).toEqual([]);
});

test('rotazione lenta e inerziale: gira da sola, segue il trascinamento, si ferma con la pausa e mentre si legge', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  const angolo = async () => (await vista(page)).imbardata;
  // da sola: lenta (meno di 0,1 radianti al secondo), ma non ferma
  await page.waitForTimeout(1200);
  const a0 = await angolo(); await page.waitForTimeout(1000); const a1 = await angolo();
  expect(a1 - a0).toBeGreaterThan(0.005);
  expect(a1 - a0).toBeLessThan(0.1);
  // trascinando lo sfondo verso sinistra la nebulosa gira in quel verso, e dopo il rilascio continua (inerzia)
  const libero = await page.evaluate(() => { const r = document.getElementById('cielo').getBoundingClientRect(); for (let y = r.bottom - 120; y > r.top + 120; y -= 20) for (let x = r.left + 200; x < r.right - 200; x += 20) if (document.elementFromPoint(x, y)?.id === 'cielo-nodi') return { x, y }; return null; });
  await page.mouse.move(libero.x, libero.y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(libero.x - i * 22, libero.y, { steps: 1 });
  const durante = await angolo();
  expect(durante).toBeLessThan(a1 - 0.5);
  await page.mouse.up();
  const v = await vista(page);
  expect(v.giro).toBeLessThan(-0.05);                       // ha preso velocità nel verso del gesto
  await page.waitForTimeout(700);
  expect(await angolo()).toBeLessThan(durante - 0.02);       // e continua a girare
  // il verso resta quello dato: quando l'inerzia si esaurisce la crociera è lenta, all'indietro
  await expect.poll(async () => (await vista(page)).giro, { timeout: 15000 }).toBeGreaterThan(-0.08);
  expect((await vista(page)).giro).toBeLessThan(0);
  // pausa: tutto fermo; di nuovo pausa: riparte
  await page.locator('[data-comando="pausa"]').click();
  await expect(page.locator('[data-comando="pausa"]')).toHaveAttribute('aria-pressed', 'true');
  await fermo(page);
  await page.locator('[data-comando="pausa"]').click();
  const b0 = await angolo(); await page.waitForTimeout(900);
  expect(await angolo()).not.toBe(b0);
  // con una scheda aperta la nebulosa sta ferma, per leggere
  await apriStella(page, 'caos');
  await expect(page.locator('#scheda')).toBeVisible();
  await fermo(page);
});

test('il Sole: zoomando molto indietro resta sempre visibile la parola Matematica, e solo quella', async ({ page }) => {
  await apriFerma(page);
  const sole = page.locator('.nodo-sole');
  await expect(sole).toBeVisible();
  await expect(sole).toHaveText('Matematica');
  await page.mouse.move(640, 400);
  for (let i = 0; i < 14; i++) await page.mouse.wheel(0, 260);   // molto più indietro di prima, ma con un limite
  await fermo(page);
  const v = await vista(page);
  expect(v.k).toBeLessThan(v.k0 * 0.14);
  expect(v.k).toBeGreaterThanOrEqual(v.k0 * 0.12 - 1e-9);           // non all'infinito
  const luce = (id) => page.evaluate((i) => Number(getComputedStyle(document.querySelector(`.nodo[data-nodo="${i}"]`)).opacity), id);
  await expect.poll(() => luce('sole')).toBeGreaterThan(0.95);
  await expect.poll(() => luce('funzione'), { timeout: 8000 }).toBeLessThan(0.03);
  await expect.poll(() => luce('sezione:journal'), { timeout: 8000 }).toBeLessThan(0.05);
  expect(await sole.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(80);   // leggibile, non rimpicciolito
  // il Sole si apre come ogni nodo: scheda con le quattro sezioni
  await sole.dispatchEvent('click');
  await expect(page.locator('#scheda h2')).toHaveText('Matematica');
  await expect(page.locator('#scheda [data-vai^="sezione:"]')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await page.locator('[data-comando="ricentra"]').click();
  await fermo(page);
  await expect.poll(() => luce('funzione')).toBeGreaterThan(0.1);
});

test('le transizioni di luce sono graduali: nessuno scatto di opacità', async ({ page }) => {
  await apriFerma(page);
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector('.nodo[data-nodo="polinomi"]')).opacity))).toBeGreaterThan(0.1);
  // la ricerca spegne le stelle che non corrispondono: l'opacità scende per tappe, non in un colpo
  const serie = page.evaluate(() => new Promise((ok) => {
    const el = document.querySelector('.nodo[data-nodo="polinomi"]'), v = [], t0 = performance.now();
    const g = () => { v.push(Number(getComputedStyle(el).opacity)); if (performance.now() - t0 < 1800) requestAnimationFrame(g); else ok(v); };
    requestAnimationFrame(g);
  }));
  await page.locator('#cerca').fill('mercatore');
  const v = await serie;
  expect(v[0]).toBeGreaterThan(v.at(-1) + 0.1);
  expect(new Set(v.map((x) => x.toFixed(2))).size).toBeGreaterThan(6);          // molti valori intermedi
  const salto = Math.max(...v.slice(1).map((x, i) => Math.abs(x - v[i])));
  expect(salto).toBeLessThan(0.2);                                              // mai più di un quinto in un fotogramma
});

test('simboli matematici: solo simboli, in KaTeX, fissi nello spazio e ben distribuiti', async ({ page }) => {
  await apriFerma(page);
  const n = await page.locator('.cielo-simbolo').count();
  expect(n).toBeGreaterThanOrEqual(24);
  await expect(page.locator('.cielo-simbolo .katex-html')).toHaveCount(n);       // disegnati da KaTeX, non da un carattere qualsiasi
  expect(await page.locator('.cielo-simbolo .katex').first().evaluate((el) => getComputedStyle(el.querySelector('.mord, .mop, .mrel, .mbin') || el).fontFamily)).toContain('KaTeX');
  const testi = await page.locator('.cielo-simbolo').allTextContents();
  for (const t of testi) { expect(t.trim().length, t).toBeLessThanOrEqual(4); expect(t).not.toMatch(/[$\\=+]/); } // un simbolo, mai una formula
  const p = await page.evaluate(() => window.omCielo.simboli());
  let minima = Infinity;
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) minima = Math.min(minima, Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1], p[i][2] - p[j][2]));
  expect(minima).toBeGreaterThan(260);                                           // mai due simboli vicini
  // sparsi in tutte le direzioni attorno alla nebulosa
  for (const asse of [0, 1, 2]) { const v = p.map((q) => q[asse]); expect(Math.min(...v)).toBeLessThan(-300); expect(Math.max(...v)).toBeGreaterThan(300); }
  // fissi: ruotando la nebulosa non cambiano posto nello spazio
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.omCielo.simboli())).toEqual(p);
});

test('zoom semantico: le figlie si leggono solo da vicino', async ({ page }) => {
  await apriFerma(page);
  await expect(nodo(page, 'parabola')).toHaveClass(/nascosta/);
  await expect(nodo(page, 'parabola')).not.toHaveClass(/con-etichetta/);
  await page.mouse.move(640, 400);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -180);
  await fermo(page);
  await expect(nodo(page, 'parabola')).not.toHaveClass(/nascosta/);
  expect((await vista(page)).k).toBeGreaterThan((await vista(page)).k0 * 1.4);
  await page.locator('[data-comando="ricentra"]').click();
  await fermo(page);
  await expect(nodo(page, 'parabola')).toHaveClass(/nascosta/);
  const v = await vista(page);
  expect(Math.abs(v.k - v.k0)).toBeLessThan(0.001);
  expect(Math.abs(v.imbardata)).toBeLessThan(0.001);
});

test('clic su una stella: vola davanti, scheda con nome completo, alias, attività per sezione e parole vicine', async ({ page }) => {
  await apriFerma(page);
  // un clic vero, con il puntatore, sulla stella più avanti
  const libera = await stellaLibera(page);
  await page.mouse.click(libera.x, libera.y);
  const scheda = page.locator('#scheda');
  await expect(scheda).toBeVisible();
  await expect(nodo(page, libera.id)).toHaveClass(/scelta/);
  await page.keyboard.press('Escape');
  await apriStella(page, 'frazione');
  await expect(scheda.locator('h2')).toHaveText('frazione');
  await expect(scheda.locator('h2')).toBeFocused();
  await expect(scheda.locator('.scheda-alias')).toContainText('Detto anche: frazioni');
  const attese = ATTIVITA.filter((a) => a.parole.includes('frazione'));
  await expect(scheda.locator('.scheda-voci a')).toHaveCount(attese.length);
  for (const s of [...new Set(attese.map((a) => a.sezione))]) await expect(scheda.locator(`section[data-sezione="${s}"] h3`)).toBeVisible();
  const lab = attese.find((a) => a.id === 'fractions-lab-001');
  await expect(scheda.locator('.scheda-voci a', { hasText: lab.titolo })).toHaveAttribute('href', lab.url);
  await expect(scheda.locator('.scheda-voci a', { hasText: lab.titolo }).locator('small')).toHaveText('Simulazione');
  // la stella aperta è portata davanti all'osservatore, dentro lo spazio libero accanto alla scheda
  await fermo(page);
  const f = await page.evaluate(() => { const n = window.omCielo.nodi.find((x) => x.id === 'frazione'); return { prof: n.prof, sx: n.sx, piuAvanti: window.omCielo.nodi.filter((x) => x.prof > n.prof).length }; });
  expect(f.prof).toBeGreaterThan(0);
  expect(f.sx).toBeLessThan((await scheda.boundingBox()).x);
  // una parola vicina apre la sua scheda
  await scheda.locator('.scheda-vicine button', { hasText: 'percentuale' }).click();
  await expect(scheda.locator('h2')).toHaveText('percentuale');
  await expect(nodo(page, 'percentuale')).toHaveClass(/scelta/);
  // un padre comprende le figlie, e aprendolo le figlie diventano leggibili
  await apriStella(page, 'numeri');
  await fermo(page);
  await expect(scheda.locator('h2')).toHaveText('numeri');
  const figlie = new Set(['numeri', ...VOCABOLARIO.filter((p) => p.padre === 'numeri').map((p) => p.id)]);
  await expect(scheda.locator('.scheda-voci a')).toHaveCount(ATTIVITA.filter((a) => a.parole.some((p) => figlie.has(p))).length);
  await expect(nodo(page, 'numeri-irrazionali')).not.toHaveClass(/nascosta/);
  // Esc chiude e riporta il fuoco sulla stella
  await page.keyboard.press('Escape');
  await expect(scheda).toBeHidden();
  await expect(nodo(page, 'numeri')).toBeFocused();
});

test('"Vedi nell\'elenco" e l\'interruttore passano all\'elenco con lo stesso filtro; la scelta si ricorda; nessun nome di transizione resta', async ({ page }) => {
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.setViewportSize({ width: 1280, height: 1400 }); // schermo alto: nell'elenco si vedono anche le prime schede
  await apriFerma(page);
  await apriStella(page, 'retta');
  await page.locator('#scheda [data-vista-elenco]').click();
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'elenco');
  await expect(page.locator('#main-grid')).toBeVisible();
  await expect(page.locator('#main-grid .card:visible')).toHaveCount(ATTIVITA.filter((a) => a.parole.includes('retta')).length);
  await expect(page.locator('.om-vista-voce[data-vista="elenco"]')).toHaveAttribute('aria-current', 'true');
  expect(await page.evaluate(() => localStorage.getItem('orfini_vista'))).toBe('elenco');
  await expect(page.locator('[data-transizione]')).toHaveCount(0);
  // e ritorno: la stella del filtro è aperta. Durante il passaggio schede e parole hanno il nome della loro stella
  const nomi = await page.evaluate(() => new Promise((fatto) => {
    const visti = new Set();
    const guarda = new MutationObserver(() => { for (const el of document.querySelectorAll('[data-transizione]')) visti.add(el.style.viewTransitionName + '|' + (el.closest('.card') ? 'scheda' : el.closest('.filtri-parole') ? 'parola' : 'stella')); });
    guarda.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-transizione'] });
    document.querySelector('.om-vista-voce[data-vista="costellazione"]').click();
    setTimeout(() => { guarda.disconnect(); fatto([...visti]); }, 1500);
  }));
  await expect(page.locator('#cielo')).toBeVisible();
  await expect(page.locator('#scheda h2')).toHaveText('retta nel piano cartesiano');
  expect(await page.evaluate(() => localStorage.getItem('orfini_vista'))).toBe('costellazione');
  if (await page.evaluate(() => !!document.startViewTransition)) {
    expect(nomi.some((n) => n.endsWith('|scheda'))).toBe(true);   // una scheda dell'elenco…
    expect(nomi.some((n) => n.endsWith('|stella'))).toBe(true);   // …diventa una stella con lo stesso nome
    const diScheda = nomi.filter((n) => n.endsWith('|scheda')).map((n) => n.split('|')[0]);
    expect(nomi.filter((n) => n.endsWith('|stella')).map((n) => n.split('|')[0])).toEqual(expect.arrayContaining(diScheda.slice(0, 1)));
  }
  await expect(page.locator('[data-transizione]')).toHaveCount(0);
  expect(errori).toEqual([]);
});

test('la ricerca accende le stelle che corrispondono e spegne le altre', async ({ page }) => {
  await apriFerma(page);
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

test('tastiera: Tab tra i nodi, Invio apre, Esc chiude; il nodo col fuoco viene portato davanti', async ({ page }) => {
  await apriFerma(page);
  await page.locator('[data-comando="pausa"]').click(); // con la tastiera la nebulosa si ferma da sola: qui la pausa è tolta
  await page.locator('#cerca').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab'); // vista, vista, tema, Matematica (il Sole è il primo nodo)
  await expect(page.locator('.nodo-sole')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.nodo-sezione').first()).toBeFocused();
  await fermo(page);                                             // il fuoco da tastiera ferma la rotazione
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await expect(nodo(page, 'numeri')).toBeFocused();
  expect(await nodo(page, 'numeri').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  // le figlie da lontano sono nascoste e non prendono il fuoco: Tab passa alla parola dopo
  await page.keyboard.press('Tab');
  await expect(nodo(page, 'frazione')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  // aprendo il padre la vista si avvicina, le figlie compaiono e si raggiungono con Tab
  await page.keyboard.press('Enter');
  await expect(page.locator('#scheda h2')).toHaveText('numeri');
  await fermo(page);
  await page.keyboard.press('Escape');
  await expect(nodo(page, 'numeri')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nodo(page, 'numeri-interi')).toBeFocused();
  await fermo(page);
  await expect(nodo(page, 'numeri-interi')).not.toHaveClass(/nascosta/);
  const n = await stato(page, 'numeri-interi'), v0 = await vista(page);
  expect(n.sx).toBeGreaterThan(0); expect(n.sx).toBeLessThan(v0.W); expect(n.sy).toBeGreaterThan(0); expect(n.sy).toBeLessThan(v0.H);
  await page.keyboard.press('Enter');
  await expect(page.locator('#scheda h2')).toHaveText('numeri interi');
  await page.keyboard.press('Escape');
  await expect(page.locator('#scheda')).toBeHidden();
  await expect(nodo(page, 'numeri-interi')).toBeFocused();
  // frecce: ruotano; Maiusc + frecce: spostano; + − 0
  await fermo(page);
  const prima = await vista(page);
  await page.keyboard.press('ArrowRight');
  expect((await vista(page)).imbardata).toBeCloseTo(prima.imbardata + 0.2, 5);
  await page.keyboard.press('Shift+ArrowLeft');
  expect((await vista(page)).tx).toBeCloseTo(prima.tx + 70, 5);
  await page.keyboard.press('+');
  await fermo(page);
  expect((await vista(page)).k).toBeGreaterThan(prima.k);
  await page.keyboard.press('0');
  await fermo(page);
  expect(Math.abs((await vista(page)).k - prima.k0)).toBeLessThan(0.001);
  await expect(nodo(page, 'numeri')).toBeFocused(); // la figlia è tornata nascosta: il fuoco è passato al padre
});

test('elasticità: una stella trascinata porta con sé le collegate e resta dove la si lascia; "ricentra" rimette in ordine', async ({ page }) => {
  await apriFerma(page);
  // un padre con le figlie, libero da altre stelle davanti
  const padri = VOCABOLARIO.filter((p) => VOCABOLARIO.some((f) => f.padre === p.id)).map((p) => p.id);
  const presa = await stellaLibera(page, `(n) => ${JSON.stringify(padri)}.includes(n.id)`);
  expect(presa).not.toBeNull();
  const figlia = VOCABOLARIO.find((p) => p.padre === presa.id).id;
  // la più lontana nella rete dei fili (almeno tre legami di distanza): si muove, ma molto meno
  const estranea = await page.evaluate((id) => {
    const per = new Map(window.omCielo.nodi.map((n) => [n.id, n])), dist = new Map([[id, 0]]), coda = [id];
    while (coda.length) { const c = coda.shift(); for (const v of per.get(c).vicini.keys()) if (!dist.has(v)) { dist.set(v, dist.get(c) + 1); coda.push(v); } }
    return window.omCielo.nodi.filter((x) => x.tipo === 'stella' && (dist.get(x.id) ?? 99) >= 3).sort((a, b) => (dist.get(b.id) ?? 99) - (dist.get(a.id) ?? 99))[0].id;
  }, presa.id);
  await page.mouse.move(presa.x, presa.y);
  await page.mouse.down();
  await page.mouse.move(presa.x + 70, presa.y - 50, { steps: 6 });
  await page.mouse.move(presa.x + 140, presa.y - 100, { steps: 6 });
  await page.waitForTimeout(250);
  expect(lontano(await stato(page, presa.id))).toBeGreaterThan(100);
  expect(lontano(await stato(page, figlia))).toBeGreaterThan(40);                                   // la figlia segue
  expect(lontano(await stato(page, estranea))).toBeLessThan(lontano(await stato(page, figlia)) * 0.45); // chi è lontano nella rete si muove molto meno
  // al rilascio le collegate rimbalzano: oltrepassano il punto in cui si assesteranno, poi tornano indietro
  const serie = page.evaluate((i) => new Promise((ok) => { const n = window.omCielo.nodi.find((x) => x.id === i), v = [], t0 = performance.now(); const g = () => { v.push([n.x, n.y, n.z]); if (performance.now() - t0 < 3500) requestAnimationFrame(g); else ok(v); }; requestAnimationFrame(g); }), figlia);
  await page.mouse.up();
  await expect(page.locator('#scheda')).toBeHidden();                                               // trascinare non apre la scheda
  // si assesta e resta lì: la stella non torna al posto d'origine, e sta sotto il punto in cui è stata lasciata
  await expect.poll(async () => (await vista(page)).inMoto, { timeout: 10000 }).toBe(false);
  const dopo = await stato(page, presa.id);
  expect(lontano(dopo)).toBeGreaterThan(100);
  const r = await page.locator('#cielo').boundingBox();
  expect(Math.hypot(r.x + dopo.sx - (presa.x + 140), r.y + dopo.sy - (presa.y - 100))).toBeLessThan(12);
  expect(lontano(await stato(page, figlia))).toBeGreaterThan(30);                                   // anche la figlia resta vicina al padre
  const punti = await serie, F = punti.at(-1);
  const scarti = punti.map((q) => [q[0] - F[0], q[1] - F[1], q[2] - F[2]]);
  const k0 = scarti.reduce((m, q, i) => (Math.hypot(...q) > Math.hypot(...scarti[m]) ? i : m), 0);   // il punto di massimo scostamento
  const d0 = Math.hypot(...scarti[k0]);
  const progresso = scarti.slice(k0).map((q) => (q[0] * scarti[k0][0] + q[1] * scarti[k0][1] + q[2] * scarti[k0][2]) / (d0 * d0));
  expect(d0).toBeGreaterThan(5);
  expect(Math.min(...progresso)).toBeLessThan(-0.03);   // oltrepassa il punto d'arrivo: rimbalzo
  expect(Math.abs(progresso.at(-1))).toBeLessThan(0.02); // e poi si ferma lì
  await page.waitForTimeout(700);
  expect(lontano(await stato(page, presa.id))).toBeCloseTo(lontano(dopo), 3);
  // ricentra: ogni stella torna al posto calcolato dal build
  await page.locator('[data-comando="ricentra"]').click();
  await expect.poll(() => page.evaluate(() => Math.max(...window.omCielo.nodi.map((n) => Math.hypot(n.x - n.ox, n.y - n.oy, n.z - n.oz)))), { timeout: 10000 }).toBeLessThan(0.5);
  // Maiusc + trascinamento dello sfondo: la nebulosa si sposta senza ruotare
  await fermo(page);
  const prima = await vista(page);
  const libero = await page.evaluate(() => { const r2 = document.getElementById('cielo').getBoundingClientRect(); for (let y = r2.bottom - 120; y > r2.top + 120; y -= 20) for (let x = r2.left + 200; x < r2.right - 200; x += 20) if (document.elementFromPoint(x, y)?.id === 'cielo-nodi') return { x, y }; return null; });
  await page.keyboard.down('Shift');
  await page.mouse.move(libero.x, libero.y); await page.mouse.down(); await page.mouse.move(libero.x + 100, libero.y + 50, { steps: 4 }); await page.mouse.up();
  await page.keyboard.up('Shift');
  const poi = await vista(page);
  expect(Math.round(poi.tx - prima.tx)).toBe(100);
  expect(Math.round(poi.ty - prima.ty)).toBe(50);
  expect(poi.imbardata).toBe(prima.imbardata);
});

test('stelle visitate: restano accese, il percorso si ricorda e si può azzerare; un\'onda parte verso le vicine', async ({ page }) => {
  await apriFerma(page);
  await apriStella(page, 'frattali');
  await apriStella(page, 'caos');
  await apriStella(page, 'frattali'); // tornare su una stella la porta in fondo al percorso
  expect((await vista(page)).viste).toEqual(['caos', 'frattali']);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('orfini_stelle_viste')))).toEqual(['caos', 'frattali']);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  expect((await vista(page)).viste).toEqual(['caos', 'frattali']);
  await page.locator('#cielo-legenda summary').click();
  await expect(page.locator('#cielo-viste')).toHaveText('Stelle visitate: 2 di 40.');
  await page.locator('[data-comando="azzera"]').click();
  expect((await vista(page)).viste).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('orfini_stelle_viste'))).toBe('[]');
  await expect(page.locator('[data-comando="azzera"]')).toBeHidden();
});

test('"Riduci effetti" nel menu: niente rotazione, voli né elasticità; la scelta si ricorda in tutto il sito', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  await page.locator('#barra .om-altro summary').click();
  await page.locator('#om-effetti').click();
  await expect(page.locator('#om-effetti')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-effetti', 'ridotti');
  expect(await page.evaluate(() => localStorage.getItem('orfini_effetti'))).toBe('ridotti');
  await page.keyboard.press('Escape');
  await fermo(page);                                       // la nebulosa si ferma da sola
  await expect(page.locator('[data-comando="pausa"]')).toBeHidden();
  const prima = await vista(page);
  await apriStella(page, 'caos');
  const subito = await vista(page);                        // nessun volo: la vista cambia in un colpo
  await page.waitForTimeout(300);
  expect(await vista(page)).toEqual(subito);
  expect(subito.k === prima.k && subito.tx === prima.tx && subito.imbardata === prima.imbardata).toBe(false);
  await page.goto('/scuola.html');
  await expect(page.locator('html')).toHaveAttribute('data-effetti', 'ridotti');
  await page.locator('#barra .om-altro summary').click();
  await page.locator('#om-effetti').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-effetti', 'ridotti');
  expect(await page.evaluate(() => localStorage.getItem('orfini_effetti'))).toBeNull();
});

test('con "riduci movimento" del sistema resta la nebulosa, ma ferma', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('orfini_vista', 'costellazione'));
  await page.goto('/index.html');
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'costellazione');
  await expect(page.locator('#cielo')).toBeVisible();
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  await fermo(page);
  const libera = await stellaLibera(page);
  await page.mouse.move(libera.x, libera.y); await page.mouse.down(); await page.mouse.move(libera.x + 120, libera.y + 80, { steps: 5 });
  expect(lontano(await stato(page, libera.id))).toBe(0);   // la stella non si stacca: si sposta tutta la nebulosa
  await page.mouse.up();
  const prima = await vista(page);
  await apriStella(page, 'caos');
  const subito = await vista(page);
  await page.waitForTimeout(300);
  expect(await vista(page)).toEqual(subito);
  expect(subito).not.toEqual(prima);
  await ctx.close();
});

test('le voci del menu volano sulla sezione; il secondo clic apre la pagina', async ({ page }) => {
  await apriFerma(page);
  await page.locator('#barra .om-voci a', { hasText: 'Journal' }).click();
  await expect(page).toHaveURL(/\/(index\.html)?(\?sezione=journal)?$/);
  await expect(page.locator('#scheda h2')).toHaveText('Journal');
  await expect(nodo(page, 'sezione:journal')).toHaveClass(/scelta/);
  await expect(page.locator('#scheda .scheda-azione.principale')).toHaveAttribute('href', 'journal/');
  await page.locator('#barra .om-voci a', { hasText: 'Journal' }).click();
  await expect(page).toHaveURL(/\/journal\/$/);
});

test('telefono (380 px): nebulosa in piedi, scheda dal basso, attività in due tocchi, niente scorrimento orizzontale', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 380, height: 780 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  // contesto nuovo: vista scelta e banner dei cookie già chiuso (altrimenti copre i comandi in basso)
  await page.addInitScript(() => { localStorage.setItem('orfini_vista', 'costellazione'); localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' })); });
  await page.goto('/index.html');
  await page.waitForFunction(() => window.omCielo && window.omCielo.vista().W > 0);
  await page.locator('[data-comando="pausa"]').tap();
  await fermo(page);
  expect((await vista(page)).verticale).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  // tutti i nodi stanno dentro lo schermo
  const fuori = await page.evaluate(() => { const v = window.omCielo.vista(); return window.omCielo.nodi.filter((n) => n.sx < 8 || n.sx > v.W - 8 || n.sy < 40 || n.sy > v.H - 8).map((n) => n.id); });
  expect(fuori).toEqual([]);
  const libera = await stellaLibera(page);
  await page.touchscreen.tap(libera.x, libera.y);                             // primo tocco: la stella
  const scheda = page.locator('#scheda');
  await expect(scheda).toBeVisible();
  const r = await scheda.boundingBox();
  expect(r.width).toBeGreaterThan(370);
  expect(r.y).toBeGreaterThan(250);                                           // sale dal basso, la nebulosa resta visibile sopra
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

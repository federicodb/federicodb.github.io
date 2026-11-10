// @ts-check
// Home, vista elenco e menu (Fase 1 della home a costellazione).
// L'elenco è HTML scritto da tools/genera.mjs: si legge senza JavaScript, si filtra per sezione, parola chiave e ricerca
// (anche con gli alias), si usa da tastiera e da telefono. Il menu è lo stesso in tutte le pagine.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ATTIVITA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/attivita.json'), 'utf8'));
const VOCABOLARIO = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/vocabolario.json'), 'utf8'));
const PAGINE_CON_MENU = ['index.html', 'verifiche.html', 'competenze.html', 'scuola.html', 'calcolo-mentale.html', 'journal/', 'journal/2026-10-16-studio-plotter-cnc/'];
const visibili = (page) => page.locator('#main-grid .card:visible');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('orfini_vista', 'elenco'); localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' })); } catch (e) { /* senza archivio */ } });
});

test('senza JavaScript: tutte le voci, le sezioni e il menu si leggono e i link portano alle attività', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/index.html');
  await expect(page.locator('#main-grid .card')).toHaveCount(ATTIVITA.length);
  await expect(page.locator('#main-grid .card').first()).toBeVisible();
  await expect(page.locator('#main-grid .sezione h2')).toHaveCount(4);
  for (const voce of ['Esplora', 'Allenati', 'Journal', 'Archivio']) await expect(page.locator('#barra .om-voci > a', { hasText: voce })).toBeVisible();
  const a = ATTIVITA.find((x) => x.id === 'math-bubble-equazione-della-retta');
  const scheda = page.locator('#main-grid .card-link', { hasText: a.titolo }).first();
  await expect(scheda).toHaveAttribute('href', a.url);
  await expect(scheda.locator('.card-desc')).not.toBeEmpty();
  // "Chi sono" si apre con la sola ancora
  await page.goto('/index.html#chi-sono');
  await expect(page.locator('#chi-sono')).toBeVisible();
  await ctx.close();
});

test('i filtri per sezione e per parola si combinano; un padre comprende le figlie', async ({ page }) => {
  await page.goto('/index.html');
  // senza filtri ogni sezione mostra un'anteprima (8 attività, 12 lezioni, 4 note, 6 verifiche); "Mostra tutte" la apre
  await expect(visibili(page)).toHaveCount(30);
  const attivita = page.locator('.sezione[data-sezione="attivita"]');
  await attivita.locator('.mostra-tutte').click();
  await expect(attivita.locator('.card:visible')).toHaveCount(ATTIVITA.filter((a) => a.sezione === 'attivita').length);
  await expect(attivita.locator('.mostra-tutte')).toHaveAttribute('aria-expanded', 'true');
  await attivita.locator('.mostra-tutte').click();
  await expect(visibili(page)).toHaveCount(30);
  // le figlie di una parola compaiono solo quando si sceglie il padre
  await expect(page.locator('.filtri-parole .parola[data-parola="numeri-irrazionali"]')).toBeHidden();
  await page.locator('.filtri-parole .parola[data-parola="numeri"]').click();
  await expect(page.locator('.filtri-parole .parola[data-parola="numeri-irrazionali"]')).toBeVisible();
  const figlie = new Set(['numeri', ...VOCABOLARIO.filter((p) => p.padre === 'numeri').map((p) => p.id)]);
  const attesi = ATTIVITA.filter((a) => a.parole.some((p) => figlie.has(p)));
  await expect(visibili(page)).toHaveCount(attesi.length);
  expect(attesi.some((a) => !a.parole.includes('numeri'))).toBe(true); // ci sono voci che hanno solo una figlia
  await page.locator('.filtro[data-sezione="allenati"]').click();
  await expect(visibili(page)).toHaveCount(attesi.filter((a) => a.sezione === 'allenati').length);
  await expect(page).toHaveURL(/sezione=allenati/);
  await expect(page).toHaveURL(/parola=numeri/);
  await expect(page.locator('#esito')).toContainText('Allenati');
  // le sezioni rimaste vuote spariscono, l'indirizzo si può ricaricare
  await expect(page.locator('#main-grid .sezione:visible')).toHaveCount(1);
  await page.reload();
  await expect(visibili(page)).toHaveCount(attesi.filter((a) => a.sezione === 'allenati').length);
  await page.locator('#azzera').click();
  await expect(visibili(page)).toHaveCount(30);
  // la riga delle sezioni resta in alto mentre si scorre
  await page.mouse.wheel(0, 1600);
  await expect.poll(async () => (await page.locator('#filtri').boundingBox()).y).toBeLessThan(60);
  await page.locator('.filtro[data-sezione="journal"]').click();
  await expect(visibili(page)).toHaveCount(ATTIVITA.filter((a) => a.sezione === 'journal').length);
});

test('la ricerca accetta un alias e propone la forma canonica', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#cerca').fill('frazioni');
  const proposta = page.locator('#suggerimento a[data-parola="frazione"]');
  await expect(proposta).toBeVisible();
  await expect(proposta).toHaveText('frazione');
  await proposta.click();
  await expect(page.locator('.filtri-parole .parola[data-parola="frazione"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#cerca')).toHaveValue('');
  await expect(visibili(page)).toHaveCount(ATTIVITA.filter((a) => a.parole.includes('frazione')).length);
  // un alias che non compare in nessun titolo trova comunque le sue voci
  await page.locator('#azzera').click();
  await page.locator('#cerca').fill('PEMDAS');
  await expect(page.locator('#suggerimento')).toContainText('espressioni e ordine delle operazioni');
  await expect(page.locator('#suggerimento')).toContainText('detto anche «PEMDAS»');
  expect(await visibili(page).count()).toBeGreaterThanOrEqual(ATTIVITA.filter((a) => a.parole.includes('espressioni')).length);
  await page.locator('#cerca').fill('zzqq-niente');
  await expect(page.locator('#vuoto')).toBeVisible();
});

test('telefono (380 px): a un\'attività in due tocchi, senza scorrimento orizzontale', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 380, height: 780 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('orfini_vista', 'elenco'));
  await page.goto('/index.html');
  const larghezza = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(await larghezza()).toBeLessThanOrEqual(1);
  await page.locator('.filtri-parole .parola[data-parola="funzione"]').tap();    // primo tocco: la parola
  expect(await larghezza()).toBeLessThanOrEqual(1);
  const prima = visibili(page).first().locator('.card-link');
  const href = await prima.getAttribute('href');
  await prima.tap();                                                              // secondo tocco: la scheda
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  // il menu sta dietro un pulsante e porta alle sezioni
  await page.goto('/index.html');
  await expect(page.locator('#barra .om-voci')).toBeHidden();
  await page.locator('.om-apri-menu').tap();
  await expect(page.locator('#barra .om-voci a', { hasText: 'Competenze' })).toBeVisible();
  expect(await larghezza()).toBeLessThanOrEqual(1);
  await page.locator('#barra .om-voci a', { hasText: 'Journal' }).tap();
  await expect(page).toHaveURL(/\/journal\/$/);
  await ctx.close();
});

test('tastiera: fuoco visibile, "Altro" e "Chi sono" si aprono con Invio e si chiudono con Esc', async ({ page }) => {
  await page.goto('/index.html');
  await page.keyboard.press('Tab');
  await expect(page.locator('.om-salta')).toBeFocused();
  for (let i = 0; i < 2; i++) await page.keyboard.press('Tab'); // marchio, poi "Esplora"
  const fuoco = () => page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { testo: document.activeElement.textContent.trim(), bordo: s.outlineStyle, spessore: parseFloat(s.outlineWidth) }; });
  expect(await fuoco()).toMatchObject({ testo: 'Esplora', bordo: 'solid' });
  expect((await fuoco()).spessore).toBeGreaterThanOrEqual(2);
  await page.locator('#barra .om-altro summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#barra .om-altro-voci')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#barra .om-altro-voci')).toBeHidden();
  await page.keyboard.press('Enter');
  await page.locator('[data-apre="chi-sono"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#chi-sono')).toBeVisible();
  await expect(page.locator('#chi-sono h2')).toHaveText('Federico De Benedictis');
  await page.keyboard.press('Escape');
  await expect(page.locator('#chi-sono')).toBeHidden();
  // una scheda e le sue parole si raggiungono con Tab e hanno il fuoco visibile
  await page.locator('#main-grid .card-link').first().focus();
  await page.keyboard.press('Tab');
  expect((await fuoco()).bordo).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/parola=/);
});

test('la barra si nasconde scorrendo in giù e riappare scorrendo in su', async ({ page }) => {
  await page.goto('/index.html');
  const barra = page.locator('#barra');
  await page.mouse.move(600, 500);
  await page.mouse.wheel(0, 1400);
  await expect(barra).toHaveClass(/om-nascosta/);
  await page.mouse.wheel(0, -300);
  await expect(barra).not.toHaveClass(/om-nascosta/);
});

test('il tema si cambia dalla barra e si ricorda; il vecchio #about apre "Chi sono"', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('html')).not.toHaveClass(/theme-light/);
  await page.locator('#orfini-theme-toggle').click();
  await expect(page.locator('html')).toHaveClass(/theme-light/);
  await page.goto('/scuola.html');
  await expect(page.locator('html')).toHaveClass(/theme-light/);
  expect(await page.evaluate(() => localStorage.getItem('orfini_theme'))).toBe('light');
  await page.goto('/index.html#about');
  await expect(page.locator('#chi-sono')).toBeVisible();
});

test('lo stesso menu in tutte le pagine, con la voce giusta evidenziata', async ({ page }) => {
  const attese = { 'index.html': 'Esplora', 'verifiche.html': 'Archivio', 'competenze.html': 'Competenze', 'scuola.html': 'La Scuola', 'calcolo-mentale.html': 'Calcolo veloce', 'journal/': 'Journal', 'journal/2026-10-16-studio-plotter-cnc/': 'Journal' };
  for (const p of PAGINE_CON_MENU) {
    await page.goto('/' + p);
    const voci = await page.locator('#barra .om-voci a').allTextContents();
    expect(voci, p).toEqual(['Esplora', 'Allenati', 'Journal', 'Archivio', 'Calcolo veloce', 'Competenze', 'La Scuola', 'Chi sono']);
    await expect(page.locator('#barra .om-voci a[aria-current="page"]'), p).toHaveText(attese[p]);
    await expect(page.locator('#cerca'), p).toBeVisible();
    await expect(page.locator('#orfini-theme-toggle'), p).toBeVisible();
    await expect(page.locator('#barra .om-vista'), p).toBeVisible();
    await expect(page.locator('#contenuto'), p).toHaveCount(1);
  }
  // da un'altra pagina la ricerca porta all'elenco già filtrato
  await page.goto('/scuola.html');
  await page.locator('#cerca').fill('frattali');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/\?q=frattali$/);
  await expect(page.locator('#esito')).toContainText('ricerca «frattali»');
  await expect(visibili(page)).toHaveCount(await page.locator('#main-grid .card:not([hidden])').count()); // con un filtro si vede tutto ciò che corrisponde
  // l'interruttore segna la vista in uso solo nella home
  await expect(page.locator('#barra .om-vista-voce[aria-current="true"]')).toHaveAttribute('data-vista', 'elenco');
});

for (const tema of ['dark', 'light']) {
  test(`contrasto AA dei testi della home (tema ${tema})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('orfini_theme', t), tema);
    await page.goto('/index.html?parola=retta');
    const bassi = await page.evaluate(() => {
      const rgb = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const sopra = (su, giu) => ({ r: su.r * su.a + giu.r * (1 - su.a), g: su.g * su.a + giu.g * (1 - su.a), b: su.b * su.a + giu.b * (1 - su.a), a: 1 });
      const fondo = (el) => { const strati = []; for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.a > 0) { strati.push(c); if (c.a === 1) break; } } let f = { r: 255, g: 255, b: 255, a: 1 }; for (const s of strati.reverse()) f = sopra(s, f); return f; };
      const out = [];
      const sel = '.om-voci a, .om-altro summary, .om-cerca input, .om-vista-voce:not([aria-disabled]), .occhiello, .apertura h1, .apertura-sub, .training-card *, .tessera-testa, .tessera-n, .tessera-desc, .filtro, .filtro span, .parola:not(.spenta), .parola:not(.spenta) span, #esito, .azzera, .mostra-tutte, .filtri-etichetta, .figlie-titolo, .sezione-testa *, .card-tipo, .card-titolo, .card-desc, .card-parole a, .site-footer p, .site-footer a';
      for (const el of document.querySelectorAll(sel)) {
        if (!el.checkVisibility() || !el.textContent.trim() || el.closest('[hidden]')) continue;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const f = fondo(el), t = sopra(rgb(getComputedStyle(el).color), f);
        const [a, b] = [lum(t), lum(f)].sort((x, y) => y - x);
        const rapporto = (a + 0.05) / (b + 0.05);
        if (rapporto < 4.5) out.push(`${el.className || el.tagName} «${el.textContent.trim().slice(0, 30)}» ${rapporto.toFixed(2)}`);
      }
      return [...new Set(out)];
    });
    expect(bassi).toEqual([]);
  });
}

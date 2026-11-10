// @ts-check
// Controlli di base su tutto il sito: ogni app del catalogo si apre senza errori, i link interni rispondono,
// il catalogo si filtra, le pagine fisse funzionano a misura di telefono e di LIM, le librerie da CDN hanno versione e integrità.
// Nessuno screenshot: niente file scritti nel repository.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { expectFormuleDisegnate } = require('./helpers/formule');

const ROOT = path.join(__dirname, '..');
const db = new Function(fs.readFileSync(path.join(ROOT, 'database.js'), 'utf8') + '; return db;')();
const APPS = db.filter((i) => /^content\/.+\.html$/.test(i.url)).map((i) => i.url);
const SPIEGAZIONI = fs.readdirSync(path.join(ROOT, 'content/apps')).filter((f) => f.endsWith('_spiegazione.html')).map((f) => 'content/apps/' + f);
const NOTE = fs.readdirSync(path.join(ROOT, 'journal'), { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d{4}-/.test(d.name)).map((d) => `journal/${d.name}/`);
const SCHEDE = fs.readdirSync(path.join(ROOT, 'schede')).filter((f) => f.endsWith('.html')).map((f) => 'schede/' + f);
const PAGINE = ['index.html', 'competenze.html', 'verifiche.html', 'galaxy.html', 'scuola.html', 'calcolo-mentale.html', 'privacy-policy.html', '404.html', 'journal/', 'schede/'];

test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader'] } });
// il banner dei cookie non deve coprire nulla nei controlli
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('orfini_cookie_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: '2026-01-01' })); } catch (e) { /* */ } });
});

function sorveglia(page) {
  const errori = [];
  page.on('pageerror', (e) => errori.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /integrity|digest|Cross-Origin|CORS/i.test(m.text())) errori.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => { const u = r.url(); if (/^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.tailwindcss\.com)\//.test(u) && !/ERR_ABORTED/.test(r.failure()?.errorText || '')) errori.push('rete: ' + u + ' ' + r.failure()?.errorText); });
  page.on('response', (r) => { const u = new URL(r.url()); if (u.hostname === '127.0.0.1' && r.status() >= 400 && !/favicon/.test(u.pathname)) errori.push(`${r.status()} ${u.pathname}`); });
  return errori;
}

test.describe('ogni app si apre senza errori', () => {
  // al massimo 2 app WebGL insieme: con più contesti il browser dei test può chiudersi da solo su questa macchina
  test.describe.configure({ mode: 'parallel', retries: 1 });
  for (const url of [...APPS, ...SPIEGAZIONI]) {
    test(url, async ({ page }) => {
      test.setTimeout(90000);
      const errori = sorveglia(page);
      const res = await page.goto('/' + url.split('/').map(encodeURIComponent).join('/'), { waitUntil: 'load', timeout: 60000 });
      expect(res && res.status()).toBe(200);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { /* app con animazioni o polling */ });
      expect((await page.title()).trim().length).toBeGreaterThan(0);
      expect(errori).toEqual([]);
      await expectFormuleDisegnate(page, url);
    });
  }
});

// Note del Journal, schede da stampare e pagine fisse: formule tutte disegnate (criterio in tests/helpers/formule.js)
test.describe('formule disegnate in Journal, schede e pagine', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const url of [...NOTE, ...SCHEDE, 'journal/', 'calcolo-mentale.html', 'competenze.html', 'index.html']) {
    test(url, async ({ page }) => {
      const errori = sorveglia(page);
      await page.goto('/' + url);
      await expectFormuleDisegnate(page, url);
      expect(errori).toEqual([]);
    });
  }
});

test('i link interni delle pagine principali rispondono', async ({ page, request }) => {
  test.setTimeout(180000);
  const visti = new Set(), rotti = [];
  for (const p of PAGINE) {
    await page.goto('/' + p);
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
    for (const h of hrefs) {
      const u = new URL(h);
      if (u.origin !== new URL(page.url()).origin) continue;
      const k = u.pathname; if (visti.has(k)) continue; visti.add(k);
      const r = await request.get(k);
      if (r.status() >= 400) rotti.push(`${p} → ${k} (${r.status()})`);
    }
  }
  expect(rotti).toEqual([]);
  expect(visti.size).toBeGreaterThan(30);
});

test('home: l\'elenco ha tutte le voci dei dati e la ricerca le riduce', async ({ page }) => {
  const errori = sorveglia(page);
  const dati = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/attivita.json'), 'utf8'));
  await page.goto('/index.html');
  await expect(page.locator('#main-grid .card').first()).toBeVisible();
  await expect(page.locator('#main-grid .card')).toHaveCount(dati.length);
  // tutte le attività del catalogo (database.js, senza la normativa) sono nell'elenco, con lo stesso indirizzo
  const indirizzi = await page.locator('#main-grid .card-link').evaluateAll((a) => a.map((x) => decodeURIComponent(x.getAttribute('href'))));
  for (const i of db.filter((x) => x.type !== 'normativa')) expect(indirizzi, i.title).toContain(i.url);
  await page.locator('#cerca').pressSequentially('parabola', { delay: 20 });
  await expect.poll(() => page.locator('#main-grid .card:visible').count(), { timeout: 15000 }).toBeLessThan(dati.length);
  expect(await page.locator('#main-grid .card:visible').count()).toBeGreaterThan(3);
  // il vecchio indirizzo del catalogo filtrato (?tag=) vale ancora come ricerca
  await page.goto('/index.html?tag=frattali');
  await expect.poll(() => page.locator('#main-grid .card:visible').count()).toBeLessThan(dati.length);
  await expect(page.locator('#cerca')).toHaveValue('frattali');
  expect(errori).toEqual([]);
});

test('verifiche: l\'elenco arriva dal database e si filtra', async ({ page }) => {
  const errori = sorveglia(page);
  await page.goto('/verifiche.html');
  await expect(page.locator('#main-grid .card').first()).toBeVisible();
  const n = await page.locator('#main-grid .card').count();
  expect(n).toBeGreaterThan(0);
  await page.fill('#search-input', 'zzzz-nessuna');
  await expect.poll(() => page.locator('#main-grid .card').count()).toBeLessThan(n);
  expect(errori).toEqual([]);
});

test('404 riporta alla home, privacy e consenso cookie funzionano', async ({ page, context }) => {
  await page.goto('/una-pagina-che-non-esiste.html').catch(() => {});
  await page.goto('/404.html');
  await expect(page.locator('a[href$="index.html"], a[href="/"]').first()).toBeVisible();
  // senza consenso salvato il banner compare; "Rifiuta non essenziali" salva solo i necessari
  const p2 = await context.newPage();
  await p2.addInitScript(() => localStorage.removeItem('orfini_cookie_consent'));
  await p2.goto('/privacy-policy.html');
  await expect(p2.locator('#cookie-banner')).not.toHaveClass(/cookie-hidden/);
  await p2.click('#cookie-reject');
  const c = await p2.evaluate(() => JSON.parse(localStorage.getItem('orfini_cookie_consent')));
  expect(c).toMatchObject({ necessary: true, analytics: false, functional: false });
  await expect(p2.locator('#cookie-banner')).toHaveClass(/cookie-hidden/);
  await expect(p2.getByText('Servizi esterni usati dalle pagine')).toBeVisible();
});

for (const vp of [{ width: 390, height: 844, nome: 'telefono' }, { width: 1920, height: 1080, nome: 'LIM' }]) {
  test(`pagine principali senza scorrimento orizzontale (${vp.nome})`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const larghe = [];
    for (const p of PAGINE) {
      await page.goto('/' + p);
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
      if (w.s > w.i + 1) larghe.push(`${p}: ${w.s} > ${w.i}`);
    }
    expect(larghe).toEqual([]);
  });
}

test('librerie da CDN con versione esatta e controllo di integrità; nessun font da Google', () => {
  const { execSync } = require('child_process');
  const files = execSync("git ls-files -z '*.html' journal_build.py", { cwd: ROOT }).toString().split('\0')
    .filter((f) => f && !/\.bak|\.broken/.test(f));
  const problemi = [];
  for (const f of files) {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of s.matchAll(/<(script|link)\b[^>]*?\b(?:src|href)="(https:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.tailwindcss\.com)\/[^"]+)"[^>]*>/g)) {
      const [tag, , url] = m;
      if (!/@\d+\.\d+\.\d+|\/\d+\.\d+\.\d+(\/|$)|\/r\d+\//.test(url)) problemi.push(`${f}: senza versione esatta ${url}`);
      const css = tag.startsWith('<link');
      if (css && !/rel="stylesheet"/.test(tag)) continue;
      if (!/cdn\.tailwindcss\.com/.test(url) && !/integrity="sha384-/.test(tag)) problemi.push(`${f}: senza integrity ${url}`);
    }
    if (/fonts\.(googleapis|gstatic)\.com/.test(s)) problemi.push(`${f}: font da Google`);
  }
  expect(problemi).toEqual([]);
});

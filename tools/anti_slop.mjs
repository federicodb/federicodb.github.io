#!/usr/bin/env node
// Controllo Anti-AI Slop (semantico, estetico e strutturale) per Orfini Math Lab.
// Nessuna dipendenza esterna: usa solo moduli nativi Node per girare anche in CI (.github/workflows/pubblica.yml).
// Uso:
//   node tools/anti_slop.mjs          (esce con 0 se pulito, 1 se trova violazioni)
//   node tools/anti_slop.mjs --json   (stampa report JSON strutturato su stdout)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');

// Eccezioni esplicite per file che usano o documentano davvero servizi esterni Google AI Studio / Gemini
const AI_TRACE_ALLOWED = new Set([
  'content/apps/functions_lab_008.html',
  'content/links/ai_studio_analyzer.json',
  'content/journal/2026-11-01-lo-studio-di-funzione-con-funclab.md',
  'privacy-policy.html',
  'docs/SECONDBRAIN.md',
  'docs/ANTI_SLOP.md',
]);

// File da ignorare nella scansione contenuto
const isIgnoredFile = (rel) =>
  /\.bak(\.|$)|\.broken/i.test(rel) ||
  rel === 'content/apps/fly_guy_orfini_math_lab.html'; // bozza non pubblicata

const SLOP_LEXICAL_RULES = [
  { id: 'slop-aggettivo', re: /\b(?:sinottic[oaie]|olografic[oaie]|immersiv[oaie]|rivoluzionari[oaie]|avvincent[ei]|straordinari[oaie]|mozzi?afiato|cutting[- ]edge|next[- ]gen|seamless|ultra[- ]pulit[oaie]|potente\s+strumento)\b/gi, msg: 'aggettivo o formula promozionale da AI slop' },
  { id: 'slop-apertura', re: /\b(?:tuffati\s+(?:nel|in)|un\s+viaggio\s+(?:affascinante|incredibile|straordinario)|scopri\s+il\s+meraviglioso\s+mondo|smetti\s+di\s+indovinare,?\s*inizia\s+a\s+capire|ambiente\s+di\s+studio\s+sinottico|un['’]esperienza\s+(?:interattiva|visiva)\s+per)\b/gi, msg: 'formula retorica da copywriting AI' },
];

const AI_TOOL_TRACES_RE = /\b(?:gemini|claude|chatgpt|openai|worksproperly|ai\s+studio)\b/gi;
const BARE_LATEX_CMD_RE = /\\(?:pi|phi|varphi|Delta|sqrt|frac)\b/;
const DEAD_TAILWIND_CLASS_RE = /\b(?:bg-(?:slate|indigo|purple|violet|gray|zinc)-\d{2,3}(?:\/\d+)?|text-(?:slate|indigo|purple|violet|emerald|cyan)-\d{2,3}|rounded-(?:2xl|3xl)|space-y-\d+)\b/g;
const SITE_AI_GRADIENT_RE = /(?:#667eea|#764ba2|\b(?:indigo|purple|violet)-(?:400|500|600)\b)/gi;

const ROOT_PAGES = [
  'index.html',
  'privacy-policy.html',
  '404.html',
  'scuola.html',
  'competenze.html',
  'verifiche.html',
  'calcolo-mentale.html',
  'galaxy.html',
];

const findings = [];
function addFinding(file, categoria, regola, dettaglio, riga = null) {
  findings.push({ file, categoria, regola, dettaglio, ...(riga ? { riga } : {}) });
}

function readUtf8(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function checkLexicon(rel, text, label) {
  for (const rule of SLOP_LEXICAL_RULES) {
    rule.re.lastIndex = 0;
    const matches = [...text.matchAll(rule.re)].map((m) => m[0]);
    if (matches.length) {
      addFinding(rel, 'semantico', rule.id, `${label}: ${rule.msg} (${[...new Set(matches.map((x) => x.toLowerCase()))].join(', ')})`);
    }
  }
}

function checkAiTraces(rel, text, label) {
  if (AI_TRACE_ALLOWED.has(rel)) return;
  AI_TOOL_TRACES_RE.lastIndex = 0;
  const matches = [...text.matchAll(AI_TOOL_TRACES_RE)].map((m) => m[0]);
  if (matches.length) {
    addFinding(rel, 'semantico', 'ai-trace', `${label}: residuo di nome tool AI (${[...new Set(matches.map((x) => x.toLowerCase()))].join(', ')})`);
  }
}

function listFiles(dirRel, ext) {
  const full = join(ROOT, dirRel);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(ext) && !f.startsWith('_') && !f.startsWith('.'))
    .map((f) => `${dirRel}/${f}`)
    .filter((rel) => !isIgnoredFile(rel))
    .sort();
}

// 1. Controllo data/attivita.json (catalogo pubblico della home)
if (existsSync(join(ROOT, 'data/attivita.json'))) {
  const attivita = JSON.parse(readUtf8('data/attivita.json'));
  for (const a of attivita) {
    if (/\.bak|\.broken/i.test(a.url || '')) {
      addFinding('data/attivita.json', 'strutturale', 'bak-in-catalog', `voce «${a.id}» punta a file temporaneo ${a.url}`);
    }
    const text = `${a.titolo || ''} — ${a.descrizione || ''}`;
    checkLexicon('data/attivita.json', text, `voce «${a.id}»`);
    if (!AI_TRACE_ALLOWED.has(a.url)) {
      checkAiTraces('data/attivita.json', text, `voce «${a.id}»`);
    }
  }
}

// 2. Controllo app HTML in content/apps/*.html
for (const rel of listFiles('content/apps', '.html')) {
  const html = readUtf8(rel);
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const desc = descMatch ? descMatch[2].trim() : '';

  if (title) {
    const unbalancedDollar = (title.match(/\$/g) || []).length % 2 !== 0;
    const outsideDollars = title.replace(/\$[^$]+\$/g, '');
    if (unbalancedDollar || BARE_LATEX_CMD_RE.test(outsideDollars)) {
      addFinding(rel, 'semantico', 'title-raw-latex', `<title> contiene LaTeX sbilanciato o nudo fuori da $...$: «${title}»`);
    }
    checkLexicon(rel, title, '<title>');
    checkAiTraces(rel, title, '<title>');
  }
  if (desc) {
    checkLexicon(rel, desc, '<meta description>');
    checkAiTraces(rel, desc, '<meta description>');
  }

  // Controllo commenti/testi HTML visibili per parole slop
  const bodyHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  checkLexicon(rel, bodyHtml, 'HTML/commenti app');

  // Controlli strutturali & local-first
  if (/fonts\.(?:googleapis|gstatic)\.com/i.test(html)) {
    addFinding(rel, 'strutturale', 'google-fonts', 'carica font da Google invece di content/assets/fonts/');
  }
  if (/polyfill\.io/i.test(html)) {
    addFinding(rel, 'strutturale', 'polyfill-io', 'riferimento a polyfill.io non consentito');
  }
  if (/cdn\.jsdelivr\.net\/npm\/katex|unpkg\.com\/katex|cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX/i.test(html)) {
    addFinding(rel, 'strutturale', 'katex-cdn', 'KaTeX va caricato localmente da content/assets/vendor/katex/, non da CDN');
  }
  if (/@babel\/standalone|babel\.min\.js/i.test(html)) {
    addFinding(rel, 'strutturale', 'babel-runtime', 'Babel standalone nel browser invece di precompilazione JSX');
  }
  if (/src=["']https:\/\/cdn\.tailwindcss\.com\/?["']/.test(html)) {
    addFinding(rel, 'strutturale', 'tailwind-unversioned', 'Tailwind CDN senza versione esatta');
  }

  // Verifica allineamento JSX se presente
  const sorg = html.match(/<script type="text\/x-jsx-sorgente" id="jsx-sorgente">\n?([\s\S]*?)<\/script>/);
  const comp = html.match(/data-jsx-compilato="([0-9a-f]+)"/);
  if (sorg) {
    const expected = createHash('sha1').update(sorg[1], 'utf8').digest('hex').slice(0, 12);
    if (!comp || comp[1] !== expected) {
      addFinding(rel, 'strutturale', 'jsx-desync', 'sorgente JSX modificato ma non ricompilato con node tools/compila_jsx.mjs');
    }
  }

  // Classi Tailwind orfane (file senza Tailwind ma con classi utility tipiche)
  const hasTailwind = /cdn\.tailwindcss\.com/.test(html);
  const bodyOnly = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const classAttrs = [...bodyOnly.matchAll(/\bclass=["']([^"']+)["']/g)].map((m) => m[1]).join(' ');
  if (!hasTailwind) {
    const dead = [...classAttrs.matchAll(DEAD_TAILWIND_CLASS_RE)].map((m) => m[0]);
    if (dead.length >= 3) {
      addFinding(rel, 'estetico', 'dead-tailwind', `classi Tailwind orfane senza Tailwind caricato: ${[...new Set(dead)].slice(0, 8).join(', ')}`);
    }
  }
}

// 3. Controllo sidecar JSON (links, infografiche, images, video)
for (const dir of ['content/links', 'content/infografiche', 'content/images', 'content/video']) {
  for (const rel of listFiles(dir, '.json')) {
    try {
      const data = JSON.parse(readUtf8(rel));
      const text = `${data.title || ''} — ${data.description || ''} — ${data.excerpt || ''}`;
      checkLexicon(rel, text, 'sidecar JSON');
      checkAiTraces(rel, text, 'sidecar JSON');
    } catch (e) {
      addFinding(rel, 'strutturale', 'json-invalid', `JSON non valido: ${e.message}`);
    }
  }
}

// 4. Controllo pagine root (estetica, tema, Tailwind orfano, palette template AI)
for (const rel of ROOT_PAGES) {
  if (!existsSync(join(ROOT, rel))) continue;
  const html = readUtf8(rel);
  const hasTailwind = /cdn\.tailwindcss\.com/.test(html);
  const bodyNoScript = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  if (!hasTailwind) {
    const classAttrs = [...bodyNoScript.matchAll(/\bclass=["']([^"']+)["']/g)].map((m) => m[1]).join(' ');
    const dead = [...classAttrs.matchAll(DEAD_TAILWIND_CLASS_RE)].map((m) => m[0]);
    if (dead.length >= 3) {
      addFinding(rel, 'estetico', 'dead-tailwind', `classi Tailwind orfane senza Tailwind caricato: ${[...new Set(dead)].slice(0, 8).join(', ')}`);
    }
  }
  const gradMatches = [...html.matchAll(SITE_AI_GRADIENT_RE)].map((m) => m[0]);
  if (gradMatches.length) {
    addFinding(rel, 'estetico', 'ai-palette-stranger', `colori estranei a sito/tema.css: ${[...new Set(gradMatches)].join(', ')}`);
  }
  if (/fonts\.(?:googleapis|gstatic)\.com/i.test(html)) {
    addFinding(rel, 'strutturale', 'google-fonts', 'carica font da Google invece di content/assets/fonts/');
  }
  const visOnly = stripTags(bodyNoScript.replace(/<style[\s\S]*?<\/style>/gi, ''));
  checkLexicon(rel, visOnly, 'testo pagina');
}

// 5. Controllo Journal e Schede Markdown
for (const dir of ['content/journal', 'content/schede']) {
  for (const rel of listFiles(dir, '.md')) {
    const md = readUtf8(rel);
    checkLexicon(rel, md, dir === 'content/journal' ? 'nota Journal' : 'scheda stampabile');
    // In Journal/schede controlla anche residui AI nel testo narrativo (esclusi URL/link a file esistenti)
    const mdNoLinks = md.replace(/\]\([^)]+\)/g, ']').replace(/^attivita:.*$/gm, '');
    checkAiTraces(rel, mdNoLinks, dir === 'content/journal' ? 'nota Journal' : 'scheda stampabile');
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ ok: findings.length === 0, count: findings.length, findings }, null, 2));
} else if (findings.length === 0) {
  console.log('✓ Anti-AI Slop: nessun residuo semantico, estetico o strutturale rilevato.');
} else {
  console.error(`✗ Anti-AI Slop: rilevate ${findings.length} violazioni:`);
  for (const f of findings) {
    console.error(`  - [${f.categoria}/${f.regola}] ${f.file}: ${f.dettaglio}`);
  }
}
process.exit(findings.length === 0 ? 0 : 1);

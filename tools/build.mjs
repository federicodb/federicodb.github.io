#!/usr/bin/env node
// npm run build: rigenera tutto il sito in locale, senza rete.
//   1. build.py (catalogo, Journal, schede, Mappa, sitemap, data/attivita.json), senza Gemini;
//   2. tools/valida.mjs: se i dati non sono validi ci si ferma qui;
//   3. tools/mappa.mjs: disposizione della costellazione (data/mappa.json), poi un secondo controllo;
//   4. tools/genera.mjs: menu, elenco e costellazione della home.
// Mostra solo avvisi, errori e riepiloghi; con --tutto mostra ogni riga. Esce con 1 se un passo fallisce.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tutto = process.argv.includes('--tutto');
const python = existsSync(join(ROOT, '.venv/bin/python3')) ? join(ROOT, '.venv/bin/python3') : 'python3';
let avvisi = 0;

function passo(nome, comando, argomenti) {
  console.log(`\n▸ ${nome}`);
  const r = spawnSync(comando, argomenti, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const righe = `${r.stdout || ''}${r.stderr || ''}`.split('\n').filter((x) => x.trim());
  for (const riga of righe) {
    if (riga.includes('⚠️')) avvisi++;
    if (tutto || r.status !== 0 || !/^\s*✅ Indicizzato/.test(riga)) console.log(riga);
  }
  if (r.error || r.status !== 0) {
    console.error(`\n✗ Build interrotto al passo «${nome}»${r.error ? `: ${r.error.message}` : ''}`);
    process.exit(1);
  }
}

passo('Catalogo, Journal, schede, Mappa (build.py, senza Gemini)', python, ['-c', "import build; build.GEMINI_API_KEY=''; build.main()"]);
passo('Validazione dei dati', process.execPath, ['tools/valida.mjs', '--senza-mappa']);
passo('Disposizione della costellazione', process.execPath, ['tools/mappa.mjs']);
passo('Controllo della mappa', process.execPath, ['tools/valida.mjs']);
passo('Menu, elenco e costellazione della home', process.execPath, ['tools/genera.mjs']);
console.log(avvisi ? `\n⚠️ Build completato con ${avvisi} ${avvisi === 1 ? 'avviso' : 'avvisi'}: leggi le righe segnate qui sopra.` : '\n✓ Build completato senza avvisi.');

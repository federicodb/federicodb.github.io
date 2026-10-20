// TECNICHE DI CALCOLO VELOCE (activities/calcolo/trucchi.js), con il massimo rigore:
//  A. ogni identità delle dimostrazioni è vera simbolicamente (nerdamer: expand(lhs - rhs) = 0, oppure
//     simplify per le frazioni algebriche) e numericamente in punti casuali (math.js);
//  B. ogni esercizio generato ha la risposta uguale al calcolo indipendente (math.js sull'espressione `cas`);
//  C. ogni formula di ogni scheda (passi, esempi, dimostrazioni, errori) si compila con KaTeX;
//  D. la caccia all'errore indica un passaggio esistente, e i passaggi delle dimostrazioni sono tutti diversi
//     (servono per "rimetti in ordine la dimostrazione").
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import katex from 'katex';
import { TRUCCHI } from '../activities/calcolo/trucchi.js';
import { createRng } from '../js/engine/rng.js';
import { setClasse } from '../activities/contesti.js';
const require = createRequire(import.meta.url);
const nerdamer = require('nerdamer/all.js');
const math = require('mathjs');

const RUNS = Math.max(50, +(process.env.RUNS || 60) * 7);
const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);
let identities = 0, exercises = 0, formulas = 0;

function checkTex(where, str) {
  if (typeof str !== 'string') return;
  for (const m of str.matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)) {
    formulas++;
    try { katex.renderToString(m[1] ?? m[2], { throwOnError: true, strict: 'ignore' }); } catch (e) { fail(where, `KaTeX: ${e.message.split('\n')[0]} in «${m[1] ?? m[2]}»`); }
  }
}
function checkRawTex(where, tex) {
  formulas++;
  try { katex.renderToString(tex, { throwOnError: true, strict: 'ignore', displayMode: true }); } catch (e) { fail(where, `KaTeX: ${e.message.split('\n')[0]} in «${tex}»`); }
}
const warn = console.warn;
console.warn = (...a) => { if (!String(a[0]).startsWith('No character metrics')) warn(...a); };

for (const t of TRUCCHI) {
  const w = t.id;
  // A. identità
  for (const id of t.dimostrazione.verifica) {
    identities++;
    const diff = `(${id.lhs})-(${id.rhs})`;
    const sym = id.razionale ? nerdamer(`simplify(${diff})`).toString() : nerdamer(`expand(${diff})`).toString();
    if (sym !== '0') fail(w, `identità non verificata da nerdamer: ${id.lhs} = ${id.rhs} (differenza ${sym})`);
    for (let k = 0; k < 30; k++) {
      const scope = Object.fromEntries(id.vars.map((v) => [v, Math.round((Math.random() * 40 - 20) * 100) / 100 || 1.5]));
      const a = math.evaluate(id.lhs, scope), b = math.evaluate(id.rhs, scope);
      if (!(Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a)))) fail(w, `identità falsa in ${JSON.stringify(scope)}: ${a} ≠ ${b}`);
    }
  }
  // C. testi fissi
  checkTex(`${w}.idea`, t.idea); checkTex(`${w}.nome`, t.nome); checkTex(`${w}.limiti`, t.limiti);
  t.passi.forEach((p, i) => checkTex(`${w}.passi[${i}]`, p));
  checkTex(`${w}.premessa`, t.dimostrazione.premessa); checkTex(`${w}.conclusione`, t.dimostrazione.conclusione);
  t.dimostrazione.passi.forEach((p, i) => { checkRawTex(`${w}.dimostrazione[${i}]`, p.tex); checkTex(`${w}.dimostrazione[${i}].perche`, p.perche); });
  t.dimostrazione.verifica.forEach((v, i) => checkTex(`${w}.verifica[${i}].nota`, v.nota));
  // D. passaggi della dimostrazione tutti diversi
  if (new Set(t.dimostrazione.passi.map((p) => p.tex)).size !== t.dimostrazione.passi.length) fail(w, 'passaggi della dimostrazione ripetuti');
  // B e C sugli esercizi, a ogni classe
  for (let r = 0; r < RUNS; r++) {
    setClasse((r % 5) + 1);
    const rng = createRng(7919 * r + t.id.length);
    const e = t.genera(rng);
    exercises++;
    const expected = math.evaluate(e.cas);
    if (!(Number.isFinite(e.risposta) && Math.abs(e.risposta - expected) < 1e-9)) fail(w, `risposta ${e.risposta} ≠ ${expected} (${e.cas})`);
    if (!e.svolgimento?.length) fail(w, 'esercizio senza svolgimento');
    checkRawTex(`${w}.q`, e.q);
    e.svolgimento.forEach((s, i) => checkRawTex(`${w}.svolgimento[${i}]`, s));
    checkTex(`${w}.testo`, e.testo);
    const x = t.errore(rng);
    checkRawTex(`${w}.errore.q`, x.q);
    x.passi.forEach((p, i) => checkTex(`${w}.errore.passi[${i}]`, p));
    checkTex(`${w}.errore.perche`, x.perche);
    if (!(x.sbagliato >= 0 && x.sbagliato < x.passi.length)) fail(w, 'caccia all\'errore: passaggio inesistente');
    if (new Set(x.passi).size !== x.passi.length) fail(w, 'caccia all\'errore: passaggi uguali');
  }
}

if (problems.length) {
  console.error([...new Set(problems)].slice(0, 40).join('\n'));
  console.error(`${problems.length} problemi`);
  process.exit(1);
}
assert.ok(identities >= TRUCCHI.length);
console.log(`trucchi OK (${TRUCCHI.length} tecniche, ${identities} identità, ${exercises} esercizi, ${formulas} formule)`);

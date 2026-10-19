// VERIFICA DI CORRETTEZZA DI TUTTE LE ATTIVITÀ
// Per migliaia di lezioni generate a caso controlla che:
//  A. la soluzione attesa sia giusta secondo due motori esterni (nerdamer e math.js);
//  B. ogni risposta giusta, scritta in tutti i modi in cui la scriverebbe uno studente, venga accettata;
//  C. nessuna risposta giusta riceva il messaggio di un "errore tipico";
//  D. scelte multiple e vero/falso siano coerenti; nei testi non compaiano NaN o undefined.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const nerdamer = require('nerdamer/all.js');
const math = require('mathjs');
import { setCAS } from '../js/engine/cas.js';
setCAS({ math, nerdamer });
import { allActivities } from '../activities/catalogo.js';
import modello from '../activities/_modello.js';
import { invalsi10, invalsi13 } from '../activities/invalsi/invalsi.js';
import { createRng } from '../js/engine/rng.js';
import { setIndirizzo, INDIRIZZI } from '../activities/contesti.js';
const PROFILI = [null, ...INDIRIZZI.map((i) => i.id)];
import { checkNumber, checkExpr, checkNumbers } from '../js/engine/check.js';

const RUNS = +(process.env.RUNS || 120);
const stats = { steps: 0, variants: 0, cas: 0 };
const problems = [];
const fail = (where, msg) => { problems.push(`${where}: ${msg}`); };
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const itNum = (v, dec) => String(dec != null ? +v.toFixed(dec) : +v.toPrecision(12)).replace('.', ',');

function numberVariants(step) {
  const b = itNum(step.answer, step.decimals);
  const v = [b, `x = ${b}`, b.replace(',', '.'), ` ${b} `];
  if (step.unit) v.push(`${b} ${step.unit}`, `${b}${step.unit}`);
  if (step.decimals != null) v.push(itNum(step.answer, step.decimals + 2));
  if (Number.isInteger(step.answer) && Math.abs(step.answer) >= 1000) v.push(step.answer.toLocaleString('it-IT'));
  const f = toFraction(step.answer);
  if (f && f[1] !== 1) v.push(`${f[0]}/${f[1]}`, `${f[0]} : ${f[1]}`);
  return v;
}
function toFraction(x) {
  for (let d = 1; d <= 500; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return [n, d]; }
  return null;
}
function exprVariants(step) {
  const out = [step.answer];
  try {
    const exp = nerdamer(step.answer).expand().toString();
    out.push(exp, exp.replace(/\*/g, ''), `y = ${exp}`);
  } catch { /* nerdamer non riscrive */ }
  try { out.push(math.simplify(step.answer.replace(/π/g, 'pi').replace(/\b0([a-z])/g, '0*$1')).toString()); } catch { /* idem */ }
  return out;
}

function casCheck(step, where) {
  const c = step.cas;
  if (!c) return;
  stats.cas++;
  try {
    if (c.given) {
      const d = nerdamer(`expand((${c.given})-(${step.answer}))`).toString();
      if (d !== '0') fail(where, `nerdamer: ${c.given} ≠ ${step.answer} (differenza ${d})`);
    }
    if (c.eval) {
      const v = math.evaluate(c.eval);
      const expect = step.type === 'expr' ? math.evaluate(step.answer.replace(/π/g, 'pi').replace(/\b0([a-z])/g, '0*$1')) : step.answer;
      if (!close(v, expect)) fail(where, `math.js: ${c.eval} = ${v}, attesa ${expect}`);
    }
    if (c.solve) {
      const sols = nerdamer.solve(c.solve, 'x').symbol.elements.map((e) => +nerdamer(e).evaluate().text('decimals'));
      let want = step.type === 'numbers' ? step.answers : [step.answer];
      let got = c.pick === 'positive' ? sols.filter((s) => s > 0) : sols;
      got = got.filter((g, i) => got.findIndex((h) => close(g, h)) === i);
      const ok = want.length === got.length && want.every((w) => got.some((g) => close(g, w)));
      if (!ok) fail(where, `nerdamer.solve(${c.solve}) = [${sols}], attese [${want}]`);
    }
    if (c.system) {
      const sol = Object.fromEntries(nerdamer.solveEquations(c.system).map(([k, v]) => [k, +v]));
      if (!close(sol.x, step.answers[0]) || !close(sol.y, step.answers[1])) fail(where, `sistema ${c.system} → (${sol.x}; ${sol.y}), atteso (${step.answers})`);
    }
    if (c.vertex) {
      const d = math.derivative(c.vertex, 'x');
      const xv = -math.evaluate(d.toString(), { x: 0 }) / (math.evaluate(d.toString(), { x: 1 }) - math.evaluate(d.toString(), { x: 0 }));
      const yv = math.evaluate(c.vertex, { x: xv });
      if (!close(xv, step.answers[0]) || !close(yv, step.answers[1])) fail(where, `vertice di ${c.vertex}: (${xv}; ${yv}), atteso (${step.answers})`);
    }
    if (c.solveNum) {
      const r = math.evaluate(c.solveNum, { x: step.answer });
      if (Math.abs(r) > 1e-6) fail(where, `${c.solveNum} non si annulla in x = ${step.answer}`);
    }
  } catch (e) {
    fail(where, `errore CAS: ${e.message}`);
  }
}

function verify(step, where) {
  stats.steps++;
  if (!step.type) return fail(where, 'senza type');
  const text = [step.prompt, step.explain, step.hint, step.body, ...(step.options || []).map((o) => o.label + (o.why || '')), ...(step.statements || []).map((s) => s.text)].join(' ');
  if (/NaN|undefined|Infinity|\[object/.test(text)) fail(where, 'testo con NaN/undefined: ' + text.slice(0, 160));
  if (step.type === 'learn') return;
  if (!step.explain) fail(where, 'senza spiegazione');
  casCheck(step, where);
  if (step.type === 'number') {
    if (!Number.isFinite(step.answer)) return fail(where, 'risposta non finita');
    // risposte sbagliate: non devono passare
    const off = step.decimals != null ? 3 * 10 ** -step.decimals + Math.abs(step.answer) * 0.01 : Math.max(1, Math.abs(step.answer) * 0.1);
    for (const w of [step.answer + off, step.answer - off]) {
      if ((step.alts || []).some((a) => Math.abs(a - w) < off / 2)) continue;
      const r = checkNumber(itNum(w, step.decimals ?? 6), step);
      if (r.ok) fail(where, `risposta SBAGLIATA ${w} accettata (attesa ${step.answer})`);
    }
    for (const v of numberVariants(step)) {
      stats.variants++;
      const r = checkNumber(v, step);
      if (!r.ok) fail(where, `"${v}" rifiutata (attesa ${step.answer}): ${r.message || 'sbagliata'}`);
    }
  }
  if (step.type === 'expr') {
    const big = (() => { try { return Math.abs(math.evaluate(step.answer.replace(/π/g, 'pi'), { x: 1.3, y: 0.7, a: 1.1, b: 2.3, k: 0.6 })) > 1e8; } catch { return false; } })();
    for (const w of big ? [`2*(${step.answer})`, `(${step.answer})*1.001`] : [`(${step.answer})+1`, `2*(${step.answer})`]) {
      const r = checkExpr(w, { ...step, form: null });
      let val = 1;
      try { val = math.evaluate(step.answer.replace(/π/g, 'pi').replace(/\b0([a-z])/g, '0*$1'), { x: 1.3, y: 0.7, a: 1.1, b: 2.3, k: 0.6 }); } catch { /* math.js non legge questa scrittura */ }
      if (r.ok && Math.abs(val) > 1e-9) fail(where, `espressione SBAGLIATA ${w} accettata`);
    }
    for (const v of exprVariants(step)) {
      stats.variants++;
      const r = checkExpr(v, step);
      if (!r.ok && !(r.equivalent && v !== step.answer)) fail(where, `"${v}" rifiutata (attesa ${step.answer}): ${r.message || 'sbagliata'}`);
    }
  }
  if (step.type === 'numbers') {
    const a = step.answers.map((x) => itNum(x, step.decimals));
    const vs = [a.join('; '), a.join(';'), step.ordered ? `(${a.join('; ')})` : a.slice().reverse().join(' e '), a.join(', ').replace(/,(\d)/g, ',$1')];
    if (!step.ordered && a.length === 2) vs.push(`x1 = ${a[0]}; x2 = ${a[1]}`);
    const wrong = step.answers.map((x, i) => itNum(i === 0 ? x + 1 : x, step.decimals)).join('; ');
    if (checkNumbers(wrong, step).ok && step.answers.length > 1 && !step.answers.includes(step.answers[0] + 1)) fail(where, `soluzioni SBAGLIATE "${wrong}" accettate`);
    if (step.ordered) vs.push(`x = ${a[0]}; y = ${a[1]}`);
    for (const v of vs) {
      stats.variants++;
      const r = checkNumbers(v, step);
      if (!r.ok) fail(where, `"${v}" rifiutata (attese ${step.answers}): ${r.message || 'sbagliata'}`);
    }
  }
  if (step.type === 'choice') {
    const n = step.options.filter((o) => o.correct).length;
    if (n !== 1) fail(where, `${n} opzioni corrette`);
    const labels = step.options.map((o) => o.label);
    if (new Set(labels).size !== labels.length) fail(where, 'opzioni doppie: ' + labels.join(' | ').slice(0, 200));
    for (const o of step.options) if (!o.correct && !o.why) fail(where, 'opzione sbagliata senza spiegazione: ' + o.label.slice(0, 60));
  }
  if (step.type === 'truefalse') {
    if (!step.statements?.length) fail(where, 'nessuna affermazione');
    for (const s of step.statements) if (typeof s.value !== 'boolean') fail(where, 'affermazione senza valore');
  }
  if (step.type === 'order' && new Set(step.items).size !== step.items.length) fail(where, 'passaggi doppi');
}

const acts = [...allActivities, modello];
for (const act of acts) {
  for (let level = 1; level <= act.levels.length; level++) {
    for (let run = 0; run < RUNS; run++) {
      setIndirizzo(PROFILI[run % PROFILI.length]);
      let lesson;
      try { lesson = act.generate(createRng(run * 7919 + level * 13), level); } catch (e) { fail(`${act.id} L${level}`, 'generazione: ' + e.message); continue; }
      lesson.forEach((s, i) => {
        verify(s, `${act.id} L${level} step${i}`);
        if (s.twin) { try { verify(s.twin(), `${act.id} L${level} step${i} gemello`); } catch (e) { fail(`${act.id} L${level} step${i}`, 'gemello: ' + e.message); } }
      });
    }
  }
}
for (const [inv, name] of [[invalsi10, 'sim10'], [invalsi13, 'sim13']]) for (let r = 0; r < RUNS; r++) inv.simulation(createRng(r)).forEach((s, i) => verify(s, `${name} q${i}`));

const grouped = {};
for (const p of problems) { const k = p.replace(/ step\d+.*?:/, ':').replace(/"[^"]*"/, '"…"').replace(/\(atte[^)]*\)/, '').slice(0, 90); (grouped[k] ||= []).push(p); }
console.log(`step verificati: ${stats.steps}, risposte-studente provate: ${stats.variants}, controlli con nerdamer/math.js: ${stats.cas}`);
if (problems.length) {
  console.log(`PROBLEMI: ${problems.length}`);
  for (const [k, list] of Object.entries(grouped).slice(0, 40)) console.log(`  ${String(list.length).padStart(5)}  ${list[0].slice(0, 230)}`);
  process.exit(1);
}
console.log('correttezza OK');

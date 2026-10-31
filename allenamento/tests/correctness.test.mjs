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
import { allActivities, PREREQ, byId } from '../activities/catalogo.js';
import modello from '../activities/_modello.js';
import { invalsi10, invalsi13 } from '../activities/invalsi/invalsi.js';
import { createRng } from '../js/engine/rng.js';
import { setIndirizzo, setClasse, INDIRIZZI } from '../activities/contesti.js';
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
  if (step.powerBase != null) v.push(`${step.powerBase}^${step.answer < 0 ? `(${b})` : b}`);
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
  verifyInteractive(step, where);
}

// E. domande interattive (js/ui/interact.js): risolvibili, senza soluzione "gratis" all'inizio, coerenti
function verifyInteractive(step, where) {
  const t = step.type;
  if (t === 'slider') {
    const st = step.step ?? 1;
    if (!(step.min <= step.answer && step.answer <= step.max)) fail(where, 'cursore: soluzione fuori scala');
    if (Math.abs(Math.round((step.answer - step.min) / st) * st + step.min - step.answer) > 1e-9 && !(step.tol >= st / 2)) fail(where, 'cursore: soluzione non raggiungibile con il passo');
    if (Math.abs((step.start ?? step.min) - step.answer) <= (step.tol ?? 0)) fail(where, 'cursore: parte già sulla soluzione');
    if (step.scene) for (const v of [step.min, step.answer, step.max]) { const svg = step.scene(v, {}); if (/NaN|undefined/.test(svg)) fail(where, 'cursore: figura con NaN'); }
  }
  if (t === 'place') {
    if (!(step.min <= step.answer && step.answer <= step.max)) fail(where, 'retta: soluzione fuori scala');
    if (!(step.tol > 0 && step.tol <= (step.max - step.min) / 6)) fail(where, `retta: tolleranza ${step.tol} non adatta`);
    // con pochi riferimenti (stima a occhio) la soluzione non deve coincidere con uno di essi
    const labeled = (step.ticks || []).filter((tk) => tk.label != null);
    if (labeled.length <= 4 && labeled.some((tk) => Math.abs(tk.v - step.answer) < 1e-9)) fail(where, 'retta: la soluzione è già uno dei pochi segni di riferimento');
  }
  if (t === 'bins') {
    const ids = new Set(step.bins.map((b) => b.id));
    if (step.items.length < 4) fail(where, 'smista: meno di 4 schede');
    if (step.items.some((it) => !ids.has(it.bin))) fail(where, 'smista: scheda senza contenitore');
    if (new Set(step.items.map((it) => it.bin)).size < 2) fail(where, 'smista: tutte nello stesso contenitore');
    if (new Set(step.items.map((it) => it.label)).size !== step.items.length) fail(where, 'smista: schede doppie');
  }
  if (t === 'sort') {
    const v = step.items.map((it) => it.value).sort((a, b) => a - b);
    if (step.items.length < 3) fail(where, 'ordina: meno di 3 schede');
    if (v.some((x, k) => k && Math.abs(x - v[k - 1]) < 1e-9 * Math.max(1, Math.abs(x)))) fail(where, 'ordina: valori uguali');
    if (new Set(step.items.map((it) => it.label)).size !== step.items.length) fail(where, 'ordina: schede doppie');
  }
}

// F. calcolo mentale: nelle attività con numeri per classe i risultati restano "da fare a mente"
//    (al massimo due decimali, nessun numero enorme), a ogni classe
const MENTALE = new Set(['percentuali', 'proporzioni', 'statistica', 'probabilita']);
function verifyMental(step, where) {
  if (step.type !== 'number' || typeof step.answer !== 'number') return;
  const a = step.answer;
  // al massimo due decimali, oppure (probabilità) una frazione con denominatore piccolo, come 3/7
  //    (per gli eventi ripetuti anche 1/216 = 1/6 · 1/6 · 1/6: denominatori prodotto di dadi e monete)
  const dens = Array.from({ length: 36 }, (_, d) => d + 1).concat([64, 72, 108, 128, 144, 216, 288, 432, 1296]);
  const fraction = dens.some((d) => Math.abs(a * d - Math.round(a * d)) < 1e-9);
  if (Math.abs(a * 100 - Math.round(a * 100)) > 1e-6 && !fraction) fail(where, `risultato non da calcolo mentale: ${a}`);
  if (Math.abs(a) > 20000) fail(where, `risultato troppo grande per il calcolo mentale: ${a}`);
}

// monomi simili: verifica con nerdamer che il rapporto con il monomio dato sia un numero (simili) o no
function verifySimilar(step, where) {
  const base = step.prompt.match(/\$([^$]+)\$/)[1];
  const plain = (l) => l.replace(/\$/g, '').replace(/\^\{(\d+)\}/g, '^$1').replace(/(\d)([a-z])/g, '$1*$2').replace(/([a-z0-9])(?=[a-z])/g, '$1*').replace(/\)(?=[a-z])/g, ')*');
  for (const it of step.items) {
    const ratio = nerdamer(`(${plain(it.label)})/(${plain(base)})`).toString();
    const isNum = !/[a-z]/i.test(ratio);
    if (isNum !== (it.bin === 'si')) fail(where, `monomi simili: ${it.label} messo in "${it.bin}" ma il rapporto è ${ratio}`);
  }
}

// G. prerequisiti: attività esistenti e nessun ciclo (A richiede B che richiede A)
for (const [id, list] of Object.entries(PREREQ)) {
  if (!byId[id]) fail('prerequisiti', `attività inesistente: ${id}`);
  for (const p of list) if (!byId[p]) fail('prerequisiti', `${id} richiede un'attività inesistente: ${p}`);
}
const reaches = (from, to, seen = new Set()) => (PREREQ[from] || []).some((p) => p === to || (!seen.has(p) && (seen.add(p), reaches(p, to, seen))));
for (const id of Object.keys(PREREQ)) if (reaches(id, id)) fail('prerequisiti', `ciclo che passa da ${id}`);

const acts = [...allActivities, modello];
for (const act of acts) {
  for (let level = 1; level <= act.levels.length; level++) {
    for (let run = 0; run < RUNS; run++) {
      setIndirizzo(PROFILI[run % PROFILI.length]);
      setClasse((run % 5) + 1); // 7 profili e 5 classi: con abbastanza giri si provano tutte le combinazioni
      let lesson;
      try { lesson = act.generate(createRng(run * 7919 + level * 13), level); } catch (e) { fail(`${act.id} L${level}`, 'generazione: ' + e.message); continue; }
      lesson.forEach((s, i) => {
        verify(s, `${act.id} L${level} step${i}`);
        if (MENTALE.has(act.id)) verifyMental(s, `${act.id} L${level} step${i} (classe ${(run % 5) + 1})`);
        if (s.type === 'bins' && act.id === 'monomi') verifySimilar(s, `${act.id} L${level} step${i}`);
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

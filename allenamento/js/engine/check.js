// Verifica delle risposte.
// Percorso di una risposta:
//   1. normalizzazione (normalize.js): "x = 3", unità, migliaia, apici, "radice di"…
//   2. lettura con il parser interno (expr.js); se non ci riesce, con math.js
//   3. confronto: numeri con la tolleranza dell'arrotondamento richiesto;
//      espressioni per equivalenza numerica in molti punti, con nerdamer come seconda opinione
//   4. controllo di forma (es. "unica potenza", "scomposta"), solo se il valore è già giusto
//   5. trappole: errori tipici con un messaggio mirato

import { parse, evaluate, variables, ParseError } from './expr.js';
import { normalizeNumber, normalizeCommon, splitNumberList } from './normalize.js';
import { CAS, fromMathjs, symbolicEqual } from './cas.js';
export { parse };

const close = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

/** Legge un'espressione: prima il parser interno, poi math.js come rete di sicurezza */
export function readExpr(text) {
  try {
    return parse(text);
  } catch (e) {
    if (CAS.math) {
      try {
        const node = CAS.math.parse(text.replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/(\d),(\d)/g, '$1.$2').replace(/:/g, '/'));
        return fromMathjs(node);
      } catch {
        /* anche math.js non la capisce: vale il messaggio del parser interno */
      }
    }
    throw e;
  }
}

// unità di misura in coda a una risposta numerica: "4,8 A", "141 V", "160 px", "20 µm", "1500 giri/min"
const TAIL_UNIT = /^(.*?[\d)π])\s*(?:[a-zA-Zµμ°%€Ωàèéìòù²³]+(?:\s*\/\s*[a-zA-Z²³]+)?\.?)(?:\s+[a-zA-Zàèéìòù]+)?\s*$/;

function parseNumber(input, unit) {
  let raw = String(input ?? '');
  // l'unità richiesta dall'esercizio si toglie sempre, anche se è "strana" (giri/min, follower…)
  if (unit) raw = raw.replace(new RegExp(`\\s*${unit.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\.?\\s*$`, 'i'), '');
  let cleaned = normalizeNumber(raw);
  if (!cleaned) throw new ParseError('Scrivi un numero');
  // un calcolo con il risultato ("3*4 = 12", "1000·157/(3,14·50) = 1000"): conta l'ultimo membro
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=').map((p) => p.trim()).filter(Boolean);
    cleaned = parts[parts.length - 1] || cleaned;
  }
  let tree;
  try {
    tree = readExpr(cleaned);
  } catch (e) {
    const m = cleaned.match(TAIL_UNIT);
    if (!m) throw e;
    tree = readExpr(m[1]);
  }
  let vars = variables(tree);
  if (vars.size) {
    // una parola in coda è un'unità di misura: si prova senza
    const m = cleaned.match(TAIL_UNIT);
    const tail = m ? cleaned.slice(m[1].length).trim() : '';
    // una lettera sola come x, y, a, b è una variabile, non un'unità
    if (m && !/^[xyzabcknt]$/.test(tail)) {
      try {
        const t2 = readExpr(m[1]);
        if (!variables(t2).size) { tree = t2; vars = new Set(); }
      } catch { /* resta l'errore originale */ }
    }
  }
  if (vars.size) throw new ParseError(`Qui serve un numero: la lettera ${[...vars][0]} non va scritta`);
  const v = evaluate(tree);
  if (!Number.isFinite(v)) throw new ParseError('Il risultato non è un numero finito');
  return { tree, value: v };
}

/** Tolleranze: stretta = arrotondamento corretto; larga = arrotondamenti intermedi (accettata con nota) */
function tolerances(spec) {
  if (spec.decimals == null) return { strict: 1e-9, loose: 1e-9 };
  const strict = 0.5 * 10 ** -spec.decimals + 1e-12;
  return { strict, loose: (ans) => 10 ** -spec.decimals + Math.abs(ans) * 0.0005 + 1e-12 };
}

/**
 * @param {string} input risposta dello studente
 * @param {object} spec { answer:number, decimals?, alts?:number[], reduced?, traps?:[{value, msg}] }
 */
export function checkNumber(input, spec) {
  // "1.225" è ambiguo: migliaia all'italiana (1225) o decimale col punto (1,225)? Si provano entrambe.
  const raw = String(input).trim();
  if (/^-?[1-9]\d{0,2}\.\d{3}$/.test(raw.replace(/\s*[^\d.\-]+$/, ''))) {
    const asDecimal = checkNumberOnce(raw.replace('.', ','), spec);
    if (asDecimal.ok) return asDecimal;
  }
  return checkNumberOnce(input, spec);
}

function checkNumberOnce(input, spec) {
  let parsed;
  try {
    parsed = parseNumber(input, spec.unit);
  } catch (e) {
    return { ok: false, invalid: true, message: e.message };
  }
  // domanda sull'esponente (powerBase: la base): chi scrive la potenza intera, come 10^17, ha risposto 17
  let wholePower = false;
  if (spec.powerBase != null && parsed.tree.k === 'pow' && close(evaluate(parsed.tree.a), spec.powerBase, 1e-9)) {
    parsed = { ...parsed, value: evaluate(parsed.tree.b) };
    wholePower = true;
  }
  const { strict, loose } = tolerances(spec);
  const answers = [spec.answer, ...(spec.alts || [])];
  const exact = answers.some((ans) => Math.abs(parsed.value - ans) <= strict || close(parsed.value, ans, 1e-9));
  const nearly = !exact && spec.decimals != null && answers.some((ans) => Math.abs(parsed.value - ans) <= loose(ans));
  if (exact || nearly) {
    if (spec.reduced && parsed.tree.k === 'div' && parsed.tree.a.k === 'num' && parsed.tree.b.k === 'num') {
      const g = gcdInt(parsed.tree.a.v, parsed.tree.b.v);
      if (Number.isInteger(parsed.tree.a.v) && Number.isInteger(parsed.tree.b.v) && g > 1) {
        return { ok: false, equivalent: true, value: parsed.value, message: `Il valore è giusto, ma la frazione si semplifica ancora: dividi per ${g}.` };
      }
    }
    return {
      ok: true, value: parsed.value, tree: parsed.tree,
      message: wholePower ? `Giusto: bastava scrivere l'esponente, ${String(spec.answer).replace('.', ',')}.` : nearly ? `Accettata. Il valore preciso è circa ${String(+spec.answer.toFixed(spec.decimals + 1)).replace('.', ',')}: attenzione agli arrotondamenti intermedi.` : undefined,
    };
  }
  for (const trap of spec.traps || []) {
    if (Math.abs(parsed.value - trap.value) <= strict || close(parsed.value, trap.value, 1e-9)) {
      return { ok: false, value: parsed.value, tree: parsed.tree, message: trap.msg, trap: true };
    }
  }
  return { ok: false, value: parsed.value, tree: parsed.tree };
}

function samplePoints(vars, count, domain) {
  const pts = [];
  // punti "irregolari" per non cadere in coincidenze (es. x=1 rende uguali x e x²)
  const base = [1.37, -0.71, 2.13, 0.43, -1.9, 3.07, -2.61, 0.83, 1.71, -0.29];
  for (let i = 0; i < count; i++) {
    const p = {};
    [...vars].forEach((v, j) => {
      let val = base[(i * 3 + j * 7) % base.length] + i * 0.11;
      if (domain === 'positive') val = Math.abs(val) + 0.2;
      p[v] = val;
    });
    pts.push(p);
  }
  return pts;
}

/** Equivalenza: numerica in 12 punti; se non decidibile (domini), chiede a nerdamer */
function equivalent(t1, t2, vars, domain) {
  let compared = 0;
  for (const p of samplePoints(vars, 12, domain)) {
    let a, b;
    try {
      a = evaluate(t1, p);
      b = evaluate(t2, p);
    } catch {
      return symbolicEqual(t1, t2) === true;
    }
    if (!Number.isFinite(a) && !Number.isFinite(b)) continue;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    compared++;
    if (!close(a, b, 1e-10)) return false;
  }
  if (compared >= 4) return true;
  return symbolicEqual(t1, t2) === true;
}

/**
 * Equivalenza algebrica di espressioni.
 * @param {object} spec { answer:string, vars?:string[], form?(tree)=>string|null, domain?, traps?:[{expr,msg}] }
 *  form: controllo facoltativo della forma (es. "scrivi come unica potenza");
 *        restituisce un messaggio se la forma non va bene, null se va bene.
 */
export function checkExpr(input, spec) {
  let tree;
  const text = normalizeCommon(input);
  if (!text) return { ok: false, invalid: true, message: 'Risposta vuota' };
  try {
    tree = readExpr(text);
  } catch (e) {
    return { ok: false, invalid: true, message: e.message };
  }
  const expected = parse(spec.answer);
  const allowed = new Set(spec.vars || [...variables(expected)]);
  // lettere maiuscole usate al posto delle minuscole: le accettiamo
  const lower = (t) => (t.k === 'var' ? { ...t, v: t.v.toLowerCase() } : { ...t, ...(t.a ? { a: lower(t.a) } : {}), ...(t.b ? { b: lower(t.b) } : {}) });
  if ([...variables(tree)].some((v) => !allowed.has(v)) && [...variables(lower(tree))].every((v) => allowed.has(v))) tree = lower(tree);
  for (const v of variables(tree)) {
    if (!allowed.has(v)) {
      return { ok: false, invalid: true, message: allowed.size ? `La lettera ${v} non compare nel problema: usa ${[...allowed].join(', ')}` : `Qui non servono lettere: la risposta è un numero` };
    }
  }
  if (equivalent(tree, expected, allowed, spec.domain)) {
    const formMsg = spec.form ? spec.form(tree) : null;
    if (formMsg) return { ok: false, equivalent: true, tree, message: formMsg };
    return { ok: true, tree };
  }
  for (const trap of spec.traps || []) {
    if (equivalent(tree, parse(trap.expr), allowed, spec.domain)) return { ok: false, tree, message: trap.msg, trap: true };
  }
  return { ok: false, tree };
}

// ---------------------------------------------------------------------------
// Più numeri: soluzioni di un'equazione (ordine libero) o coordinate di un punto (ordine fisso)
// Separatore: punto e virgola (la virgola è il separatore decimale). Si accettano anche parentesi e "e".
// ---------------------------------------------------------------------------

/**
 * @param spec { answers:number[], decimals?, ordered?:boolean, traps?:[{values:number[], msg}] }
 */
export function checkNumbers(input, spec) {
  const parts = splitNumberList(input);
  if (!parts.length) return { ok: false, invalid: true, message: 'Scrivi i valori separati da punto e virgola, ad esempio 2; -3' };
  let vals;
  try {
    vals = parts.map((p) => {
      const tree = readExpr(p);
      if (variables(tree).size) throw new ParseError('Scrivi solo numeri, separati da punto e virgola');
      return evaluate(tree);
    });
  } catch (e) {
    return { ok: false, invalid: true, message: e.message };
  }
  const { loose } = tolerances(spec);
  const eq = (a, b) => Math.abs(a - b) <= (spec.decimals != null ? loose(b) : 1e-9) || close(a, b, 1e-9);
  const want = spec.answers;
  const sameSet = (got, exp) => {
    if (spec.ordered) return got.length === exp.length && got.every((v, i) => eq(v, exp[i]));
    const uniqGot = got.filter((v, i) => got.findIndex((w) => eq(v, w)) === i);
    return uniqGot.length === exp.length && exp.every((e) => uniqGot.some((g) => eq(g, e)));
  };
  if (sameSet(vals, want)) return { ok: true, values: vals };
  for (const t of spec.traps || []) if (sameSet(vals, t.values)) return { ok: false, message: t.msg, trap: true };
  if (spec.ordered && vals.length === 2 && sameSet([vals[1], vals[0]], want)) {
    return { ok: false, message: 'I valori sono giusti ma in ordine scambiato: prima la x, poi la y.' };
  }
  if (!spec.ordered && vals.length < want.length && vals.every((v) => want.some((w) => eq(v, w)))) {
    return { ok: false, message: `Ne manca ${want.length - vals.length === 1 ? 'una' : 'qualcuna'}: le soluzioni sono ${want.length}.` };
  }
  if (!spec.ordered && vals.length > want.length) return { ok: false, message: `Hai scritto ${vals.length} valori, ma le soluzioni sono ${want.length}.` };
  return { ok: false };
}

// ---------------------------------------------------------------------------
// Polinomi in una variabile: coefficienti (per controllare le scomposizioni)
// ---------------------------------------------------------------------------
/** Coefficienti [c0, c1, …, cn] di un polinomio a coefficienti razionali, ricavati per interpolazione. */
export function polyCoeffs(tree, v = 'x', deg = 6) {
  const n = deg + 1;
  const xs = Array.from({ length: n }, (_, i) => i - Math.floor(n / 2));
  const ys = xs.map((x) => evaluate(tree, { [v]: x }));
  // differenze divise di Newton -> coefficienti nella base delle potenze
  const coef = ys.slice();
  for (let j = 1; j < n; j++) for (let i = n - 1; i >= j; i--) coef[i] = (coef[i] - coef[i - 1]) / (xs[i] - xs[i - j]);
  let p = [0];
  for (let i = n - 1; i >= 0; i--) {
    // p = p * (x - xs[i]) + coef[i]
    const q = new Array(p.length + 1).fill(0);
    for (let k = 0; k < p.length; k++) { q[k + 1] += p[k]; q[k] -= xs[i] * p[k]; }
    q[0] += coef[i];
    p = q;
  }
  const out = p.map((c) => (Math.abs(c - Math.round(c)) < 1e-6 ? Math.round(c) : c));
  while (out.length > 1 && Math.abs(out[out.length - 1]) < 1e-9) out.pop();
  return out;
}

/** Fattori di un prodotto (appiattisce mul, neg, pow con esponente intero) */
export function factorsOf(tree) {
  if (tree.k === 'mul') return [...factorsOf(tree.a), ...factorsOf(tree.b)];
  if (tree.k === 'neg') return [{ k: 'num', v: -1 }, ...factorsOf(tree.a)];
  if (tree.k === 'pow' && tree.b.k === 'num' && Number.isInteger(tree.b.v) && tree.b.v > 0) return Array(tree.b.v).fill(tree.a);
  return [tree];
}

/**
 * Controllo di forma per le scomposizioni: la risposta deve essere un prodotto,
 * ogni fattore non deve avere un fattore numerico comune raccoglibile e,
 * se richiesto, deve avere almeno `minFactors` fattori non costanti.
 */
export function factoredForm({ v = 'x', minFactors = 2 } = {}) {
  return (tree) => {
    const fs = factorsOf(tree);
    const nonConst = fs.filter((f) => variables(f).size > 0);
    if (nonConst.length < minFactors) {
      return nonConst.length <= 1 && fs.length <= 1
        ? 'Il valore è giusto, ma va scritto come prodotto di fattori.'
        : 'È un prodotto, ma si può scomporre ancora.';
    }
    for (const f of nonConst) {
      if (variables(f).size !== 1) continue;
      const c = polyCoeffs(f, [...variables(f)][0]);
      const ints = c.every((x) => Number.isInteger(x));
      const g = ints ? c.reduce((a, b) => gcdInt(a, b), 0) : 1;
      if (Math.abs(g) > 1) return `Nel fattore con coefficienti multipli di ${Math.abs(g)} puoi raccogliere ancora.`;
      if (c.length === 3 && ints) {
        // trinomio di secondo grado: se ha radici razionali si poteva scomporre ancora
        const [cc, bb, aa] = c;
        const D = bb * bb - 4 * aa * cc;
        if (D >= 0 && Number.isInteger(Math.sqrt(D))) return 'Uno dei fattori di secondo grado si può scomporre ancora.';
      }
    }
    void v;
    return null;
  };
}
const gcdInt = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

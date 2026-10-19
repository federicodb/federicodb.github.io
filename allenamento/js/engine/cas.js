// Motori di calcolo simbolico open source usati come seconda opinione:
//   math.js  (Apache-2.0)  — parser molto tollerante e valutazione numerica
//   nerdamer (MIT)         — calcolo simbolico: espansione, semplificazione, risoluzione
// Nel browser si caricano in background; finché non sono pronti la correzione usa il motore interno,
// che da solo è già corretto per tutte le attività (lo verificano i test con gli stessi due motori).

export const CAS = { math: null, nerdamer: null };

export function setCAS({ math, nerdamer }) {
  if (math) CAS.math = math;
  if (nerdamer) CAS.nerdamer = nerdamer;
}

const URLS = {
  math: 'https://cdn.jsdelivr.net/npm/mathjs@12.4.2/lib/browser/math.js',
  nerdamer: [
    'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/nerdamer.core.js',
    'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Algebra.js',
    'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Calculus.js',
    'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/Solve.js',
  ],
};

function script(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false; // l'ordine conta per i moduli di nerdamer
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

let loading = null;
export function loadCAS() {
  if (typeof document === 'undefined') return Promise.resolve(CAS);
  loading ||= Promise.allSettled([
    script(URLS.math).then(() => (CAS.math = window.math)),
    URLS.nerdamer.reduce((p, u) => p.then(() => script(u)), Promise.resolve()).then(() => (CAS.nerdamer = window.nerdamer)),
  ]).then(() => CAS);
  return loading;
}

/** Converte un nodo di math.js nel nostro albero (per poter fare i controlli di forma). */
export function fromMathjs(node) {
  const T = node.type;
  if (T === 'ParenthesisNode') return fromMathjs(node.content);
  if (T === 'ConstantNode') return { k: 'num', v: Number(node.value) };
  if (T === 'SymbolNode') {
    if (node.name === 'pi') return { k: 'num', v: Math.PI };
    if (node.name === 'e') return { k: 'num', v: Math.E };
    return { k: 'var', v: node.name };
  }
  if (T === 'OperatorNode') {
    const [a, b] = node.args.map(fromMathjs);
    switch (node.fn) {
      case 'add': return { k: 'add', a, b };
      case 'subtract': return { k: 'sub', a, b };
      case 'multiply': return { k: 'mul', a, b };
      case 'divide': return { k: 'div', a, b };
      case 'pow': return { k: 'pow', a, b };
      case 'unaryMinus': return { k: 'neg', a };
      case 'unaryPlus': return a;
      default: throw new Error('operatore non gestito');
    }
  }
  if (T === 'FunctionNode') {
    const name = node.fn.name;
    const map = { sqrt: 'sqrt', abs: 'abs', sin: 'sin', cos: 'cos', tan: 'tan', log: 'ln', log10: 'log', ln: 'ln' };
    if (!map[name] || node.args.length !== 1) throw new Error('funzione non gestita');
    return { k: 'fn', f: map[name], a: fromMathjs(node.args[0]) };
  }
  throw new Error('espressione non gestita');
}

/** Albero → testo esplicito per i motori simbolici */
export function toPlain(t) {
  switch (t.k) {
    case 'num': return t.v < 0 ? `(${t.v})` : String(t.v);
    case 'var': return t.v;
    case 'add': return `(${toPlain(t.a)}+${toPlain(t.b)})`;
    case 'sub': return `(${toPlain(t.a)}-${toPlain(t.b)})`;
    case 'mul': return `(${toPlain(t.a)}*${toPlain(t.b)})`;
    case 'div': return `(${toPlain(t.a)}/${toPlain(t.b)})`;
    case 'pow': return `(${toPlain(t.a)}^${toPlain(t.b)})`;
    case 'neg': return `(-${toPlain(t.a)})`;
    case 'fn': return `${t.f === 'ln' ? 'log' : t.f === 'log' ? 'log10' : t.f}(${toPlain(t.a)})`;
    default: return '0';
  }
}

/**
 * Uguaglianza simbolica con nerdamer: true / false / null (non decidibile o motore assente).
 * Si usa solo per espressioni algebriche (polinomi, frazioni, radici, potenze).
 */
export function symbolicEqual(t1, t2) {
  const N = CAS.nerdamer;
  if (!N) return null;
  try {
    const d = N(`expand(simplify(${toPlain(t1)}-(${toPlain(t2)})))`).toString();
    if (d === '0') return true;
    // differenza costante non nulla o polinomio non nullo: diversi
    const v = N(d).evaluate().text('decimals');
    if (/^-?[\d.e+-]+$/.test(v) && Math.abs(parseFloat(v)) > 1e-9) return false;
    return null;
  } catch {
    return null;
  }
}

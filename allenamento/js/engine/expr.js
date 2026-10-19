// Parser di espressioni matematiche scritte dagli studenti.
// Accetta la scrittura "da quaderno": 2x, 3(x+1), x², √9, 2,5 (virgola decimale), ·, ×, :, ÷.
// Produce un albero (AST) che si può valutare o ispezionare per controllare la forma.

const FUNCS = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  ln: Math.log,
  log: Math.log10,
};
const CONSTS = { pi: Math.PI, π: Math.PI };

export class ParseError extends Error {}

function tokenize(src) {
  const s = src
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/[·×⋅*]/g, '*')
    .replace(/[:÷]/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    // numero: cifre con eventuale separatore decimale (punto o virgola)
    if (/[0-9]/.test(c) || ((c === '.' || c === ',') && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i;
      let seenSep = false;
      while (j < s.length) {
        if (/[0-9]/.test(s[j])) j++;
        else if ((s[j] === '.' || s[j] === ',') && !seenSep && /[0-9]/.test(s[j + 1] || '')) {
          seenSep = true;
          j++;
        } else break;
      }
      out.push({ t: 'num', v: parseFloat(s.slice(i, j).replace(',', '.')) });
      i = j;
      continue;
    }
    if (/[a-zA-Zπ]/.test(c)) {
      // nomi di funzione/costante riconosciuti, altrimenti lettere singole (variabili)
      const rest = s.slice(i);
      const name = Object.keys(FUNCS).concat(['pi']).find((n) => rest.startsWith(n));
      if (name) {
        out.push(FUNCS[name] ? { t: 'fn', v: name } : { t: 'num', v: CONSTS[name], name });
        i += name.length;
      } else if (c === 'π') {
        out.push({ t: 'num', v: Math.PI, name: 'π' });
        i++;
      } else {
        out.push({ t: 'var', v: c });
        i++;
      }
      continue;
    }
    if ('+-*/^()'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (c === '[' || c === '{') { out.push({ t: 'op', v: '(' }); i++; continue; }
    if (c === ']' || c === '}') { out.push({ t: 'op', v: ')' }); i++; continue; }
    throw new ParseError(`Simbolo non riconosciuto: "${c}"`);
  }
  // moltiplicazione implicita: 2x, x(…), )(, 2sqrt, )x
  const res = [];
  for (let k = 0; k < out.length; k++) {
    const a = out[k - 1];
    const b = out[k];
    const leftEnds = a && (a.t === 'num' || a.t === 'var' || (a.t === 'op' && a.v === ')'));
    const rightStarts = b.t === 'num' || b.t === 'var' || b.t === 'fn' || (b.t === 'op' && b.v === '(');
    if (leftEnds && rightStarts) res.push({ t: 'op', v: '*', implicit: true });
    res.push(b);
  }
  return res;
}

// Discesa ricorsiva:
// expr := term (('+'|'-') term)*
// term := unary (('*'|'/') unary)*
// unary := ('-'|'+') unary | power
// power := atom ('^' unary)?      (associativo a destra, -2^2 = -(2^2))
// atom := num | var | fn atom | '(' expr ')'
export function parse(src) {
  if (typeof src !== 'string' || !src.trim()) throw new ParseError('Risposta vuota');
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;

  function expr() {
    let node = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v;
      node = { k: op === '+' ? 'add' : 'sub', a: node, b: term() };
    }
    return node;
  }
  function term() {
    let node = unary();
    while (isOp('*') || isOp('/')) {
      const op = toks[p++].v;
      node = { k: op === '*' ? 'mul' : 'div', a: node, b: unary() };
    }
    return node;
  }
  function unary() {
    if (isOp('-')) { p++; return { k: 'neg', a: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power() {
    const base = atom();
    if (isOp('^')) {
      p++;
      return { k: 'pow', a: base, b: unary() };
    }
    return base;
  }
  function atom() {
    const tk = peek();
    if (!tk) throw new ParseError('Espressione incompleta');
    if (tk.t === 'num') { p++; return { k: 'num', v: tk.v }; }
    if (tk.t === 'var') { p++; return { k: 'var', v: tk.v }; }
    if (tk.t === 'fn') {
      p++;
      // sqrt9 oppure sqrt(9); sqrt 2x è ambiguo: prendiamo solo l'atomo
      return { k: 'fn', f: tk.v, a: isOp('(') ? atom() : power() };
    }
    if (isOp('(')) {
      p++;
      const e = expr();
      if (!isOp(')')) throw new ParseError('Manca una parentesi chiusa');
      p++;
      return e;
    }
    throw new ParseError(`Non mi aspettavo "${tk.v}"`);
  }

  const tree = expr();
  if (p < toks.length) throw new ParseError(`Non mi aspettavo "${toks[p].v}"`);
  return tree;
}

export function evaluate(node, scope = {}) {
  switch (node.k) {
    case 'num': return node.v;
    case 'var':
      if (!(node.v in scope)) throw new ParseError(`Lettera inattesa: ${node.v}`);
      return scope[node.v];
    case 'add': return evaluate(node.a, scope) + evaluate(node.b, scope);
    case 'sub': return evaluate(node.a, scope) - evaluate(node.b, scope);
    case 'mul': return evaluate(node.a, scope) * evaluate(node.b, scope);
    case 'div': return evaluate(node.a, scope) / evaluate(node.b, scope);
    case 'pow': return Math.pow(evaluate(node.a, scope), evaluate(node.b, scope));
    case 'neg': return -evaluate(node.a, scope);
    case 'fn': return FUNCS[node.f](evaluate(node.a, scope));
    default: throw new ParseError('Nodo sconosciuto');
  }
}

export function variables(node, acc = new Set()) {
  if (node.k === 'var') acc.add(node.v);
  for (const key of ['a', 'b']) if (node[key]) variables(node[key], acc);
  return acc;
}

/** Numero di operazioni nell'albero: utile per chiedere una forma "semplificata". */
export function opCount(node) {
  if (node.k === 'num' || node.k === 'var') return 0;
  return 1 + (node.a ? opCount(node.a) : 0) + (node.b ? opCount(node.b) : 0);
}

/** Converte un albero in LaTeX (per mostrare allo studente come è stata letta la risposta). */
export function toTex(node, parent = null) {
  const wrap = (s, need) => (need ? `\\left(${s}\\right)` : s);
  switch (node.k) {
    case 'num': {
      const s = Number.isInteger(node.v) ? String(node.v) : String(+node.v.toFixed(6)).replace('.', '{,}');
      return s;
    }
    case 'var': return node.v;
    case 'add': return wrap(`${toTex(node.a, 'add')}+${toTex(node.b, 'add')}`, parent === 'mul' || parent === 'pow' || parent === 'neg');
    case 'sub': return wrap(`${toTex(node.a, 'add')}-${toTex(node.b, 'sub')}`, parent === 'mul' || parent === 'pow' || parent === 'neg' || parent === 'sub');
    case 'mul': {
      const left = toTex(node.a, 'mul');
      const right = toTex(node.b, 'mul');
      const implicit = node.b.k === 'var' || node.b.k === 'pow' && node.b.a.k === 'var' || node.b.k === 'fn';
      return wrap(`${left}${implicit && node.a.k === 'num' ? '' : '\\cdot '}${right}`, parent === 'pow');
    }
    case 'div': return `\\dfrac{${toTex(node.a)}}{${toTex(node.b)}}`;
    case 'pow': return `${toTex(node.a, 'pow')}^{${toTex(node.b)}}`;
    case 'neg': return wrap(`-${toTex(node.a, 'neg')}`, parent === 'pow' || parent === 'mul');
    case 'fn': return node.f === 'sqrt' ? `\\sqrt{${toTex(node.a)}}` : `\\${node.f}\\left(${toTex(node.a)}\\right)`;
    default: return '?';
  }
}

import { poly, frac, gcd, par } from '../../js/engine/helpers.js';

// ---------- numeri razionali minimi per la bilancia ----------
const R = (n, d = 1) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
};
const add = (x, y) => R(x.n * y.d + y.n * x.d, x.d * y.d);
const mul = (x, y) => R(x.n * y.n, x.d * y.d);
const neg = (x) => R(-x.n, x.d);
const inv = (x) => R(x.d, x.n);
const isZero = (x) => x.n === 0;
const isOne = (x) => x.n === 1 && x.d === 1;
const rTex = (x) => frac(x.n, x.d);

/** lato dell'equazione: k·x + q */
function sideTex(k, q) {
  if (isZero(k)) return rTex(q);
  let s = isOne(k) ? 'x' : k.n === -1 && k.d === 1 ? '-x' : `${rTex(k)}x`;
  if (!isZero(q)) s += q.n < 0 ? ` - ${rTex(neg(q))}` : ` + ${rTex(q)}`;
  return s;
}

// ---------- widget: bilancia (stesse operazioni sui due membri) ----------
function balanceWidget(a, b, c, d, sol) {
  return (el, api) => {
    let L = { k: R(a), q: R(b) };
    let Rt = { k: R(c), q: R(d) };
    const history = [];
    el.innerHTML = `
      <div class="w-balance">
        <div class="w-eq" data-eq aria-live="polite"></div>
        <ol class="w-history" data-hist></ol>
        <p class="w-help">Scegli un'operazione: verrà applicata a entrambi i membri.</p>
        <div class="w-ops" data-ops></div>
        <button type="button" class="btn-ghost w-undo" data-undo disabled>Annulla l'ultima mossa</button>
      </div>`;
    const eq = el.querySelector('[data-eq]');
    const ops = el.querySelector('[data-ops]');
    const hist = el.querySelector('[data-hist]');
    const undo = el.querySelector('[data-undo]');
    const solved = () =>
      (isOne(L.k) && isZero(L.q) && isZero(Rt.k)) || (isOne(Rt.k) && isZero(Rt.q) && isZero(L.k));

    function options() {
      const list = [];
      const seen = new Set();
      const push = (label, fn) => {
        if (seen.has(label)) return;
        seen.add(label);
        list.push({ label, fn });
      };
      // il membro "principale" è quello dove resterà la x (di solito il primo)
      const main = !isZero(L.k) ? L : Rt;
      const other = main === L ? Rt : L;
      // 1) portare le x tutte dalla stessa parte
      if (!isZero(other.k)) {
        push(other.k.n > 0 ? `togli $${sideTex(other.k, R(0))}$` : `aggiungi $${sideTex(neg(other.k), R(0))}$`, () => shift(neg(other.k), R(0)));
      }
      // 2) togliere il numero che accompagna la x
      if (!isZero(main.q)) {
        const q = main.q;
        push(q.n > 0 ? `togli $${rTex(q)}$` : `aggiungi $${rTex(neg(q))}$`, () => shift(R(0), neg(q)));
        // distrattore: l'operazione col segno sbagliato (lecita, ma non aiuta)
        push(q.n > 0 ? `aggiungi $${rTex(q)}$` : `togli $${rTex(neg(q))}$`, () => shift(R(0), q));
      }
      // 3) dividere per il coefficiente della x (lecito anche prima, ma porta frazioni)
      if (!isZero(main.k) && !isOne(main.k)) push(`dividi per $${rTex(main.k)}$`, () => scale(inv(main.k)));
      return list;
    }
    function shift(dk, dq) {
      L = { k: add(L.k, dk), q: add(L.q, dq) };
      Rt = { k: add(Rt.k, dk), q: add(Rt.q, dq) };
    }
    function scale(f) {
      L = { k: mul(L.k, f), q: mul(L.q, f) };
      Rt = { k: mul(Rt.k, f), q: mul(Rt.q, f) };
    }
    function render() {
      api.tex(eq, `${sideTex(L.k, L.q)} = ${sideTex(Rt.k, Rt.q)}`);
      ops.innerHTML = '';
      if (!solved()) {
        for (const o of options()) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'chip';
          api.html(btn, o.label);
          btn.addEventListener('click', () => {
            history.push({ L, Rt, label: o.label });
            o.fn();
            render();
          });
          ops.appendChild(btn);
        }
      }
      hist.innerHTML = '';
      history.forEach((h) => {
        const li = document.createElement('li');
        api.html(li, h.label);
        hist.appendChild(li);
      });
      undo.disabled = history.length === 0;
      el.querySelector('.w-help').textContent = solved()
        ? 'La x è da sola: premi Verifica.'
        : 'Scegli un\'operazione: verrà applicata a entrambi i membri.';
      api.setReady(solved());
    }
    undo.addEventListener('click', () => {
      const h = history.pop();
      if (h) { L = h.L; Rt = h.Rt; render(); }
    });
    render();
    return {
      check() {
        const moves = history.length;
        return {
          ok: true,
          message: `$x = ${sol}$ in ${moves} ${moves === 1 ? 'mossa' : 'mosse'}. Ogni mossa ha mantenuto la bilancia in equilibrio.`,
        };
      },
    };
  };
}

// ---------- generatori: stessa struttura, numeri sempre diversi ----------
function genL1(rng) {
  const x = rng.intNot(-9, 9);
  const a = rng.int(2, 9);
  const b = rng.intNot(-15, 15, [0, a, -a]);
  return { a, b, c: 0, d: a * x + b, x };
}
function genL2(rng) {
  return rng.until(
    () => {
      const x = rng.intNot(-8, 8);
      const a = rng.intNot(-9, 9, [0, 1, -1]);
      const c = rng.intNot(-9, 9, [0, a]);
      const b = rng.intNot(-12, 12);
      return { a, b, c, d: (a - c) * x + b, x };
    },
    (v) => Math.abs(v.a - v.c) >= 2 && v.d !== 0,
  );
}
function genL3(rng) {
  // p(x + r) = c x + d  ->  sviluppato: px + pr = cx + d
  return rng.until(
    () => {
      const x = rng.intNot(-7, 7);
      const p = rng.int(2, 6);
      const r = rng.intNot(-6, 6);
      const c = rng.intNot(-5, 8, [0, p]);
      const d = p * (x + r) - c * x;
      return { a: p, b: p * r, c, d, x, p, r };
    },
    (v) => Math.abs(v.a - v.c) >= 2 && v.d !== 0,
  );
}
const GEN = { 1: genL1, 2: genL2, 3: genL3 };

function eqTex(v, expanded = false) {
  const right = v.c ? poly([[v.c, 'x'], [v.d, '']]) : String(v.d);
  if (v.p && !expanded) return `${v.p}\\left(${poly([[1, 'x'], [v.r, '']])}\\right) = ${right}`;
  return `${poly([[v.a, 'x'], [v.b, '']])} = ${right}`;
}

/** Catena di passaggi risolutivi (per l'esercizio di ordinamento e le spiegazioni) */
function chain(v) {
  const steps = [];
  if (v.p) steps.push(eqTex(v, false));
  steps.push(eqTex(v, true));
  const k = v.a - v.c;
  const q = v.d - v.b;
  if (v.c) steps.push(`${poly([[v.a, 'x'], [-v.c, 'x']])} = ${poly([[v.d, ''], [-v.b, '']])}`);
  else steps.push(`${poly([[v.a, 'x']])} = ${v.d} ${v.b > 0 ? '-' : '+'} ${Math.abs(v.b)}`);
  steps.push(`${poly([[k, 'x']])} = ${q}`);
  steps.push(`x = ${v.x}`);
  return steps;
}

function balanceStep(rng, level) {
  const v = GEN[level](rng);
  const shown = v.p ? { ...v } : v;
  return {
    type: 'widget',
    prompt: `Porta la $x$ da sola: $$${eqTex(v, true)}$$`,
    widget: balanceWidget(shown.a, shown.b, shown.c, shown.d, v.x),
    explain: `Una strada possibile: $$${chain(v).slice(v.p ? 1 : 0).join('\\\\ ')}$$`,
  };
}

function firstMove(rng, level) {
  const v = GEN[level](rng);
  if (level === 1) {
    return {
      type: 'choice',
      prompt: `Per risolvere $${eqTex(v)}$, qual è la prima mossa più comoda?`,
      options: [
        { label: v.b > 0 ? `Togliere $${v.b}$ da entrambi i membri` : `Aggiungere $${-v.b}$ a entrambi i membri`, correct: true },
        { label: v.b > 0 ? `Togliere $${v.b}$ solo a sinistra` : `Aggiungere $${-v.b}$ solo a sinistra`, why: 'Se cambi un solo membro la bilancia non è più in equilibrio: l\'uguaglianza non vale più.' },
        { label: `Togliere $${v.a}$ da entrambi i membri`, why: `${v.a} moltiplica la x: per eliminarlo si divide, non si sottrae.` },
        { label: v.b > 0 ? `Aggiungere $${v.b}$ a entrambi i membri` : `Togliere $${-v.b}$ da entrambi i membri`, why: 'Così il termine noto raddoppia invece di sparire.' },
      ],
      explain: `Prima si isola il termine con la $x$: $$${poly([[v.a, 'x']])} = ${v.d - v.b}$$ poi si divide per $${v.a}$.`,
      twin: () => firstMove(rng, level),
    };
  }
  if (level === 3) {
    return {
      type: 'choice',
      prompt: `Qual è lo sviluppo corretto di $${v.p}\\left(${poly([[1, 'x'], [v.r, '']])}\\right)$?`,
      options: [
        { label: `$${poly([[v.p, 'x'], [v.p * v.r, '']])}$`, correct: true },
        { label: `$${poly([[v.p, 'x'], [v.r, '']])}$`, why: `Il ${v.p} moltiplica anche ${par(v.r)}, non solo la x.` },
        { label: `$${poly([[v.p, 'x'], [-v.p * v.r, '']])}$`, why: 'Attenzione al segno: il prodotto di due numeri concordi è positivo, di discordi è negativo.' },
        { label: `$${poly([[1, 'x'], [v.p * v.r, '']])}$`, why: `Anche la x va moltiplicata per ${v.p}.` },
      ],
      explain: `Proprietà distributiva: $$${v.p}\\cdot x ${v.r < 0 ? '-' : '+'} ${v.p}\\cdot ${Math.abs(v.r)} = ${poly([[v.p, 'x'], [v.p * v.r, '']])}$$`,
      twin: () => firstMove(rng, level),
    };
  }
  const k = v.a - v.c;
  return {
    type: 'choice',
    prompt: `In $${eqTex(v)}$ portiamo i termini con la $x$ a sinistra. Cosa si ottiene a sinistra?`,
    options: [
      { label: `$${poly([[k, 'x']])}$`, correct: true },
      { label: `$${poly([[v.a + v.c, 'x']])}$`, why: `Spostare $${poly([[v.c, 'x']])}$ a sinistra significa togliere $${poly([[v.c, 'x']])}$ da entrambi i membri: il segno cambia.` },
      { label: `$${poly([[v.a, 'x']])}$`, why: 'Il termine con la x di destra non sparisce: va portato a sinistra.' },
    ],
    explain: `$$${poly([[v.a, 'x']])} - ${par(v.c)}x = ${poly([[k, 'x']])}$$`,
    twin: () => firstMove(rng, level),
  };
}

function orderStep(rng, level) {
  const v = GEN[level](rng);
  const items = chain(v);
  return {
    type: 'order',
    prompt: 'Metti in ordine i passaggi della risoluzione, dal primo all\'ultimo.',
    items,
    explain: `$$${items.join('\\\\ ')}$$`,
    twin: () => orderStep(rng, level),
  };
}

function solveStep(rng, level) {
  const v = GEN[level](rng);
  const k = v.a - v.c;
  const q = v.d - v.b;
  const traps = [{ value: -v.x, msg: 'Il valore è giusto ma il segno no. Controlla quando sposti un termine o dividi per un numero negativo.' }];
  if (q !== v.x) traps.push({ value: q, msg: `Hai isolato $${poly([[k, 'x']])}$ ma non hai diviso per ${par(k)}.` });
  const wrongMove = v.d + v.b;
  if (wrongMove % k === 0 && wrongMove / k !== v.x && wrongMove / k !== -v.x) {
    traps.push({ value: wrongMove / k, msg: `Hai spostato ${par(v.b)} senza cambiargli segno.` });
  }
  return {
    type: 'number',
    cas: { solve: `${v.a}*x+(${v.b})=${v.c}*x+(${v.d})` },
    prompt: `Risolvi: $$${eqTex(v)}$$ $x = $`,
    answer: v.x,
    traps,
    hint: level === 3 ? 'Prima sviluppa la parentesi, poi porta le x da una parte e i numeri dall\'altra.' : 'Porta le x da una parte e i numeri dall\'altra, poi dividi.',
    explain: `$$${chain(v).join('\\\\ ')}$$ Verifica: sostituendo $x = ${v.x}$ entrambi i membri valgono $${v.a * v.x + v.b}$.`,
    twin: () => solveStep(rng, level),
  };
}

/** Equazioni immediate: un solo passo (x + a = b, ax = b, x/a = b, −x = b) */
function immediateStep(rng) {
  const x = rng.intNot(-9, 9);
  const kind = rng.pick(['add', 'mul', 'div', 'neg']);
  if (kind === 'add') {
    const a = rng.intNot(-12, 12, [0, -x]);
    return {
      type: 'number', cas: { solve: `x+(${a})=${x + a}` },
      prompt: `Risolvi: $$${poly([[1, 'x'], [a, '']])} = ${x + a}$$ $x = $`,
      answer: x,
      traps: [{ value: x + 2 * a, msg: `Per togliere ${par(a)} dal primo membro si ${a > 0 ? 'sottrae' : 'aggiunge'} ${Math.abs(a)} a entrambi i membri: il segno cambia.` }],
      hint: `Cosa devi fare a entrambi i membri per lasciare la x da sola?`,
      explain: `$$x = ${x + a} ${a > 0 ? '-' : '+'} ${Math.abs(a)} = ${x}$$`,
      twin: () => immediateStep(rng),
    };
  }
  if (kind === 'mul') {
    const a = rng.intNot(-9, 9, [0, 1, -1]);
    const traps = [{ value: a * x * a, msg: `${a} moltiplica la x: per toglierlo si divide per ${par(a)}, non si moltiplica.` }];
    if (a * x - a !== x) traps.push({ value: a * x - a, msg: `${a} moltiplica la x: va diviso, non sottratto.` });
    return {
      type: 'number', cas: { solve: `${a}*x=${a * x}` },
      prompt: `Risolvi: $$${poly([[a, 'x']])} = ${a * x}$$ $x = $`,
      answer: x,
      traps: traps.filter((t) => t.value !== x),
      hint: `Dividi entrambi i membri per ${par(a)}.`,
      explain: `$$x = ${a * x} : ${par(a)} = ${x}$$`,
      twin: () => immediateStep(rng),
    };
  }
  if (kind === 'div') {
    const a = rng.int(2, 6), b = rng.intNot(-8, 8);
    return {
      type: 'number', cas: { solve: `x/${a}=${b}` },
      prompt: `Risolvi: $$\\dfrac{x}{${a}} = ${b}$$ $x = $`,
      answer: a * b,
      traps: [{ value: b / a, msg: `La x è divisa per ${a}: per liberarla si moltiplica per ${a}.` }].filter((t) => t.value !== a * b),
      hint: `Moltiplica entrambi i membri per ${a}.`,
      explain: `$$x = ${b} \\cdot ${a} = ${a * b}$$`,
      twin: () => immediateStep(rng),
    };
  }
  return {
    type: 'number', cas: { solve: `-x=${-x}` },
    prompt: `Risolvi: $$-x = ${-x}$$ $x = $`,
    answer: x,
    traps: [{ value: -x, msg: '$-x$ vuol dire $(-1)\\cdot x$: dividi (o moltiplica) entrambi i membri per $-1$.' }],
    hint: 'Cambia segno a entrambi i membri.',
    explain: `$$-x = ${-x} \\;\\Rightarrow\\; x = ${x}$$`,
    twin: () => immediateStep(rng),
  };
}

function verifyStep(rng, level) {
  const v = GEN[level](rng);
  const fake = v.x + rng.pick([-2, -1, 1, 2]);
  const lhs = v.a * fake + v.b;
  const rhs = v.c * fake + v.d;
  return {
    type: 'choice',
    prompt: `Un compagno dice che $x = ${fake}$ è la soluzione di $${eqTex(v)}$. Ha ragione?`,
    options: [
      { label: `No: sostituendo, i due membri valgono $${lhs}$ e $${rhs}$`, correct: true },
      { label: 'Sì: il valore è vicino a quello giusto', why: 'In matematica "vicino" non basta: o i due membri sono uguali o no.' },
      { label: 'Non si può sapere senza risolverla', why: 'Si può sempre verificare: basta sostituire il valore nei due membri.' },
    ],
    fixedOrder: true,
    explain: `Con $x = ${fake}$: a sinistra $${lhs}$, a destra $${rhs}$. Sono diversi, quindi non è la soluzione. La soluzione è $x = ${v.x}$.`,
    twin: () => verifyStep(rng, level),
  };
}

export default {
  id: 'equazioni-1',
  area: 'equazioni',
  years: [1],
  mat: ['MAT_A3', 'MAT_K1'],
  ambito: 'Relazioni e funzioni',
  title: 'Equazioni di primo grado',
  summary: 'La bilancia: stesse operazioni a destra e a sinistra.',
  glyph: 'x=?',
  levels: [
    { name: 'Immediate, poi a due passi', desc: 'x + a = b, ax = b, poi ax + b = c' },
    { name: 'x da tutte e due le parti', desc: 'Equazioni del tipo ax + b = cx + d' },
    { name: 'Con le parentesi', desc: 'Prima la distributiva, poi la bilancia' },
  ],
  generate(rng, level) {
    const learn = {
      type: 'learn',
      title: 'Un\'equazione è una bilancia in equilibrio',
      body: 'Qualsiasi cosa fai a un piatto, devi farla anche all\'altro: aggiungere, togliere, moltiplicare o dividere per lo stesso numero (diverso da zero). Così l\'uguaglianza resta vera.',
    };
    // livello 1: si parte dalle equazioni immediate (un solo passo), poi quelle a due passi
    if (level === 1) return [learn, immediateStep(rng), immediateStep(rng), balanceStep(rng, 1), firstMove(rng, 1), solveStep(rng, 1), verifyStep(rng, 1)];
    return [
      learn,
      balanceStep(rng, level),
      firstMove(rng, level),
      orderStep(rng, level),
      solveStep(rng, level),
      verifyStep(rng, level),
      solveStep(rng, level),
    ];
  },
};

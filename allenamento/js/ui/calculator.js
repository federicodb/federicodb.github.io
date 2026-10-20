// Calcolatrice su richiesta: si apre dal tasto in alto nelle lezioni.
// Telefono: pannello in basso, chiuso finché non serve. Tablet, PC, LIM: pannello laterale.
// Usa lo stesso lettore delle risposte (virgola decimale, π, √, potenze); seno, coseno e tangente in gradi.
// "Usa nella risposta" scrive il risultato nella casella della domanda.

import { parse, ParseError } from '../engine/expr.js';
import { normalizeNumber } from '../engine/normalize.js';
import { sfx, haptic } from './fx.js';
import { icons } from './dom.js';

const DEG = Math.PI / 180;
const F = {
  sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10,
  sin: (x) => Math.sin(x * DEG), cos: (x) => Math.cos(x * DEG), tan: (x) => Math.tan(x * DEG),
};
function ev(n) {
  switch (n.k) {
    case 'num': return n.v;
    case 'var': throw new ParseError(`La lettera ${n.v} non è un numero`);
    case 'add': return ev(n.a) + ev(n.b);
    case 'sub': return ev(n.a) - ev(n.b);
    case 'mul': return ev(n.a) * ev(n.b);
    case 'div': return ev(n.a) / ev(n.b);
    case 'pow': return Math.pow(ev(n.a), ev(n.b));
    case 'neg': return -ev(n.a);
    case 'fn': return F[n.f](ev(n.a));
    default: throw new ParseError('Espressione non valida');
  }
}
/** Numero in formato italiano, senza code di arrotondamento (0,1+0,2 = 0,3) */
export function fmtIt(v) {
  if (!Number.isFinite(v)) return '—';
  const r = +v.toPrecision(12);
  if (Math.abs(r) >= 1e12 || (Math.abs(r) < 1e-6 && r !== 0)) return r.toExponential(6).replace('.', ',').replace(/e\+?/, '·10^');
  return String(r).replace('.', ',');
}
export function calcEval(expr) {
  const s = normalizeNumber(String(expr).replace(/÷/g, '/').replace(/×/g, '*'));
  if (!s) return null;
  return ev(parse(s));
}

const KEYS = [
  ['sin', 'cos', 'tan', 'log', 'ln'],
  ['(', ')', 'x²', '^', '√'],
  ['7', '8', '9', '÷', '⌫'],
  ['4', '5', '6', '×', 'C'],
  ['1', '2', '3', '−', 'π'],
  ['0', ',', 'Ans', '+', '='],
];
const LABEL = { '⌫': 'Cancella', C: 'Azzera', '÷': 'diviso', '×': 'per', '−': 'meno', '√': 'radice quadrata', 'x²': 'al quadrato', '^': 'elevato a', '=': 'uguale', Ans: 'ultimo risultato', π: 'pi greco' };

let panel = null;

/** Apre o chiude la calcolatrice. target(): restituisce l'input della risposta attiva (o null). */
export function toggleCalculator(target) {
  if (panel) { closeCalculator(); return; }
  openCalculator(target);
}
export function closeCalculator() {
  // il pannello esce con un'animazione breve; intanto il resto dell'interfaccia torna al suo posto
  const old = panel;
  if (old) {
    old.classList.add('closing');
    const drop = () => old.remove();
    old.addEventListener('animationend', drop, { once: true });
    setTimeout(drop, 300); // senza animazioni (movimento ridotto) l'evento non arriva
  }
  panel = null;
  document.body.classList.remove('calc-open');
  document.querySelectorAll('[data-calc-btn]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
}

function openCalculator(target) {
  let expr = '';
  let last = null;
  const hist = [];
  panel = document.createElement('section');
  panel.className = 'calc';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Calcolatrice');
  panel.innerHTML = `
    <div class="calc-head"><b>Calcolatrice</b><span class="muted calc-mode">angoli in gradi</span><button type="button" class="icon-btn" data-close aria-label="Chiudi la calcolatrice">${icons.close}</button></div>
    <p class="calc-nudge">Prova prima a mente: spesso c'è un trucco, e la risposta vale <b>×1,2</b>.</p>
    <div class="calc-screen" aria-live="polite">
      <div class="calc-hist" data-hist></div>
      <input class="calc-expr" data-expr inputmode="none" autocomplete="off" spellcheck="false" aria-label="Calcolo" placeholder="0">
      <div class="calc-res" data-res></div>
    </div>
    <div class="calc-keys">${KEYS.map((r) => r.map((k) => `<button type="button" class="ck ${/^[0-9,]$/.test(k) ? 'n' : ''} ${k === '=' ? 'eq' : ''} ${['sin', 'cos', 'tan', 'log', 'ln'].includes(k) ? 'fn' : ''}" data-k="${k}" aria-label="${LABEL[k] || k}">${k}</button>`).join('')).join('')}</div>
    <button type="button" class="btn wide calc-use" data-use disabled>Usa nella risposta</button>`;
  document.body.appendChild(panel);
  document.body.classList.add('calc-open');
  document.querySelectorAll('[data-calc-btn]').forEach((b) => b.setAttribute('aria-pressed', 'true'));
  const exprEl = panel.querySelector('[data-expr]');
  const resEl = panel.querySelector('[data-res]');
  const histEl = panel.querySelector('[data-hist]');
  const useBtn = panel.querySelector('[data-use]');
  if (matchMedia('(pointer: fine)').matches) { exprEl.removeAttribute('inputmode'); exprEl.focus({ preventScroll: true }); }
  keepQuestionVisible(panel);

  const preview = () => {
    try {
      const v = calcEval(expr);
      resEl.textContent = v == null ? '' : '= ' + fmtIt(v);
      resEl.classList.remove('err');
    } catch {
      resEl.textContent = '';
    }
  };
  const sync = () => { exprEl.value = expr; preview(); };
  const ins = (t) => { expr += t; sync(); };
  const equals = () => {
    try {
      const v = calcEval(expr);
      if (v == null) return;
      if (!Number.isFinite(v)) throw new ParseError('Risultato non definito');
      hist.unshift(`${expr} = ${fmtIt(v)}`);
      histEl.innerHTML = hist.slice(0, 2).map((h) => `<div>${h.replace(/</g, '&lt;')}</div>`).join('');
      last = v;
      expr = fmtIt(v);
      sync();
      resEl.textContent = '';
      useBtn.disabled = !target();
      sfx.tap();
    } catch (e) {
      resEl.textContent = e.message || 'Calcolo non valido';
      resEl.classList.add('err');
      haptic(30);
    }
  };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    haptic(5);
    const k = b.dataset.k;
    if (k === '⌫') { expr = expr.slice(0, -1); sync(); return; }
    if (k === 'C') { expr = ''; sync(); return; }
    if (k === '=') { equals(); return; }
    if (k === 'Ans') { if (last != null) ins(fmtIt(last)); return; }
    if (k === 'x²') { ins('^2'); return; }
    if (k === '√') { ins('√('); return; }
    if (['sin', 'cos', 'tan', 'log', 'ln'].includes(k)) { ins(k + '('); return; }
    ins({ '÷': '/', '×': '*', '−': '-' }[k] ?? k);
  });
  panel.querySelectorAll('.ck').forEach((b) => b.addEventListener('pointerdown', (e) => e.preventDefault()));
  exprEl.addEventListener('input', () => { expr = exprEl.value; preview(); });
  exprEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); equals(); } if (e.key === 'Escape') closeCalculator(); });
  panel.querySelector('[data-close]').addEventListener('click', closeCalculator);
  useBtn.addEventListener('click', () => {
    const inp = target();
    if (!inp || last == null) return;
    inp.value = fmtIt(last);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    sfx.tap();
    closeCalculator();
    if (matchMedia('(pointer: fine)').matches) inp.focus();
  });
  useBtn.disabled = true;
}

/** Foglio dal basso (telefono, tablet verticale): se copre la risposta, la pagina scorre quanto basta,
 *  ma senza far uscire dall'alto l'inizio della domanda. */
function keepQuestionVisible(sheet) {
  if (matchMedia('(min-width: 900px)').matches) return;
  const card = document.querySelector('.lesson .card');
  const answer = card?.querySelector('.answer-row, .options, .tf') || card;
  if (!card || !answer) return;
  const top = document.getElementById('topbar')?.getBoundingClientRect().bottom ?? 0;
  const sheetTop = window.innerHeight - sheet.offsetHeight;
  const overlap = answer.getBoundingClientRect().bottom + 12 - sheetTop;
  const room = card.getBoundingClientRect().top - top - 8;
  const dy = Math.min(overlap, room);
  if (dy > 0) window.scrollBy({ top: dy, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

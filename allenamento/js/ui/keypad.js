// Tastierino matematico per touch (telefono, tablet, LIM).
// Sui dispositivi touch la tastiera di sistema resta chiusa (inputmode="none"): niente schermo coperto,
// tasti grandi e già i simboli giusti. Con "ABC" si torna alla tastiera di sistema.

import { sfx, haptic } from './fx.js';

const BASE = [
  ['7', '8', '9', '/', '⌫'],
  ['4', '5', '6', '^', '('],
  ['1', '2', '3', '−', ')'],
  ['0', ',', '√', 'π', '+'],
];

export const isTouch = () => matchMedia('(pointer: coarse)').matches;

/**
 * @param input  l'elemento <input>
 * @param opts   { letters: ['x'], list: true (mostra il tasto ;), onEnter }
 */
export function attachKeypad(container, input, opts = {}) {
  const pad = document.createElement('div');
  pad.className = 'keypad2';
  pad.setAttribute('role', 'group');
  pad.setAttribute('aria-label', 'Tastierino matematico');
  const rows = BASE.map((r) => r.slice());
  const extra = [...(opts.letters || [])];
  if (opts.list) extra.push(';');
  extra.push('·', '²');
  if (opts.sys !== false) extra.push('ABC');
  if (isTouch()) extra.push('⌄');
  const mk = (k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'k' + (/[0-9]/.test(k) ? ' num' : '') + (k === '⌫' ? ' del' : '') + (k === 'ABC' || k === '⌄' ? ' sys' : '');
    b.textContent = k;
    b.setAttribute('aria-label', { '⌫': 'Cancella', '−': 'meno', '√': 'radice quadrata', 'π': 'pi greco', '^': 'elevato a', ABC: 'Usa la tastiera del dispositivo', '⌄': 'Chiudi il tastierino', '·': 'per', '²': 'al quadrato', ';': 'punto e virgola' }[k] || k);
    b.addEventListener('pointerdown', (e) => e.preventDefault()); // non togliere il focus all'input
    b.addEventListener('click', () => press(k));
    return b;
  };
  for (const r of rows) {
    const row = document.createElement('div');
    row.className = 'krow';
    r.forEach((k) => row.appendChild(mk(k)));
    pad.appendChild(row);
  }
  const row = document.createElement('div');
  row.className = 'krow extra';
  extra.forEach((k) => row.appendChild(mk(k)));
  pad.appendChild(row);
  container.appendChild(pad);

  function insert(txt) {
    const s = input.selectionStart ?? input.value.length;
    const e = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + txt + input.value.slice(e);
    const p = s + txt.length;
    try { input.setSelectionRange(p, p); } catch { /* alcuni input non lo permettono */ }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function press(k) {
    sfx.tap();
    haptic(6);
    if (k === '⌫') {
      const s = input.selectionStart ?? input.value.length;
      const e = input.selectionEnd ?? s;
      if (s === e && s > 0) {
        input.value = input.value.slice(0, s - 1) + input.value.slice(e);
        try { input.setSelectionRange(s - 1, s - 1); } catch { /* idem */ }
      } else {
        input.value = input.value.slice(0, s) + input.value.slice(e);
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (k === '⌄') { pad.classList.add('collapsed'); input.blur(); return; }
    if (k === 'ABC') {
      input.setAttribute('inputmode', input.dataset.mode || 'text');
      pad.classList.add('hidden-pad');
      input.blur();
      setTimeout(() => input.focus(), 30);
      return;
    }
    if (k === '√') {
      // radice con parentesi già chiusa, cursore dentro
      insert('√()');
      const p = (input.selectionStart ?? input.value.length) - 1;
      try { input.setSelectionRange(p, p); } catch { /* idem */ }
      return;
    }
    insert({ '−': '-', '·': '·', '²': '²', 'π': 'π' }[k] ?? k);
  }
  if (isTouch()) {
    input.setAttribute('inputmode', 'none');
    // chiuso finché non si tocca la casella: non copre la domanda e le figure
    pad.classList.add('collapsed');
    const open = () => {
      if (input.getAttribute('inputmode') !== 'none' || input.disabled) return;
      if (!pad.classList.contains('collapsed')) return;
      pad.classList.remove('collapsed');
      setTimeout(() => pad.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30);
    };
    input.addEventListener('focus', open);
    input.addEventListener('pointerdown', open);
  }
  return pad;
}

// Domande interattive "alla Brilliant": si risponde manipolando, non scrivendo.
//   slider  cursore con obiettivo: la figura cambia dal vivo finché soddisfa la richiesta
//   place   posiziona un punto sulla retta dei numeri (stima, con tolleranza)
//   bins    smista schede nei contenitori giusti
//   sort    ordina schede trascinandole
// Tutto in SVG/HTML con Pointer Events: dito, mouse e penna della LIM funzionano allo stesso modo.
// Ogni tipo ha anche un'alternativa senza trascinamento (tocca e tocca, frecce, tastiera).
// Interfaccia uguale agli altri tipi: ready, check, markWrong, reveal, retry, lock, solve (per i test).

import { html, esc } from './dom.js';
import { sfx } from './fx.js';

const it = (v, dec = 2) => String(Math.round(v * 10 ** dec) / 10 ** dec).replace('.', ',');
const near = (a, b, tol) => Math.abs(a - b) <= tol + 1e-9;

function shuffleDiff(arr, same) {
  let r = arr.slice();
  for (let n = 0; n < 20; n++) {
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    if (!same(r)) return r;
  }
  return r.reverse();
}

/** Trascinamento con soglia: sotto i 6 px è un tocco. Restituisce una funzione che stacca gli eventi. */
function draggable(el, { onTap, onStart, onMove, onEnd, ignore }) {
  let start = null;
  let moving = false;
  const down = (e) => {
    if (e.button > 0 || el.disabled || el.closest('[data-locked]') || (ignore && e.target.closest(ignore))) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moving = false;
    el.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!moving && Math.hypot(dx, dy) < 6) return;
    if (!moving) { moving = true; onStart?.(e); }
    e.preventDefault();
    onMove?.(dx, dy, e);
  };
  const up = (e) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    if (moving) onEnd?.(e);
    else onTap?.(e);
    moving = false;
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
}

// ------------------------------------------------------------------ slider
function slider(box, step, setReady) {
  const fmt = step.format || ((v) => `${it(v, step.decimals ?? 2)}${step.unit ? ` ${step.unit}` : ''}`);
  box.innerHTML = `
    <div class="ia-scene" data-scene aria-hidden="true"></div>
    <label class="w-slider ia-slider"><span class="w-slider-head"><span>${esc(step.label || 'Valore')}</span><output data-out></output></span>
      <input type="range" min="${step.min}" max="${step.max}" step="${step.step ?? 1}" value="${step.start ?? step.min}" aria-label="${esc(step.label || 'Valore')}"></label>`;
  const input = box.querySelector('input');
  const scene = box.querySelector('[data-scene]');
  const out = box.querySelector('[data-out]');
  let touched = false;
  const draw = (v, extra = {}) => {
    out.textContent = fmt(v);
    if (step.scene) html(scene, step.scene(v, extra));
  };
  draw(+input.value);
  input.addEventListener('input', () => {
    if (!touched) { touched = true; setReady(true); }
    box.querySelector('.ia-slider').classList.remove('wrong');
    draw(+input.value);
  });
  return {
    ready: () => touched,
    check: () => {
      const v = +input.value;
      if (near(v, step.answer, step.tol ?? 0)) return { ok: true };
      return { ok: false, message: step.why?.(v) || (v > step.answer ? 'Un po\' troppo: torna indietro.' : 'Non basta ancora: vai avanti.') };
    },
    markWrong: () => box.querySelector('.ia-slider').classList.add('wrong'),
    reveal: () => { input.value = step.answer; draw(step.answer, { solution: true }); box.querySelector('.ia-slider').classList.replace('wrong', 'right'); },
    retry: () => input.focus(),
    lock: (ok) => { input.disabled = true; if (ok) { box.querySelector('.ia-slider').classList.add('right'); draw(+input.value, { solution: true }); } },
    focus: () => { if (matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true }); },
    solve: () => { input.value = step.answer; input.dispatchEvent(new Event('input')); },
  };
}

// ------------------------------------------------------------------ place (retta dei numeri)
/** Quanti punti uguali si impilano su ogni valore (per riservare spazio in alto) */
const countStack = (dots = []) => dots.map((v) => dots.filter((w) => w === v).length);
function place(box, step, setReady) {
  // larghezza interna del disegno pari allo spazio reale (fra 360 e 600): sul telefono numeri e punto restano grandi
  const W = Math.round(Math.min(600, Math.max(360, box.clientWidth || 600))), X0 = 34, X1 = W - 34, Y = 64;
  const { min, max } = step;
  const toX = (v) => X0 + ((v - min) / (max - min)) * (X1 - X0);
  const toV = (x) => min + ((Math.min(X1, Math.max(X0, x)) - X0) / (X1 - X0)) * (max - min);
  const snap = step.snap ?? (max - min) / 200;
  let value = null;
  const ticks = step.ticks || Array.from({ length: Math.round(max - min) + 1 }, (_, k) => ({ v: min + k, label: it(min + k) }));
  box.innerHTML = `
    <svg class="ia-line" viewBox="0 ${-Math.max(0, ...countStack(step.dots)) * 16} ${W} ${120 + Math.max(0, ...countStack(step.dots)) * 16}" role="slider" tabindex="0" aria-label="${esc(step.label || 'Posizione sulla retta')}" aria-valuemin="${min}" aria-valuemax="${max}">
      <line class="ia-axis" x1="${X0 - 12}" y1="${Y}" x2="${X1 + 12}" y2="${Y}"/>
      ${ticks.map((t) => `<line class="ia-tick ${t.major === false ? 'minor' : ''}" x1="${toX(t.v)}" y1="${Y - (t.major === false ? 6 : 11)}" x2="${toX(t.v)}" y2="${Y + (t.major === false ? 6 : 11)}"/>${t.label != null ? `<text class="ia-tick-lbl" x="${toX(t.v)}" y="${Y + 36}">${esc(t.label)}</text>` : ''}`).join('')}
      ${(step.dots || []).map((v, k, arr) => { const h = arr.slice(0, k).filter((w) => w === v).length; return `<circle class="ia-dot" cx="${toX(v)}" cy="${Y - 22 - h * 16}" r="7"/>`; }).join('')}
      <g data-sol hidden><line class="ia-sol" x1="${toX(step.answer)}" y1="${Y - 30}" x2="${toX(step.answer)}" y2="${Y + 14}"/><text class="ia-sol-lbl" x="${toX(step.answer)}" y="${Y - 36}">${esc(step.answerLabel || it(step.answer))}</text></g>
      <g class="ia-marker" data-marker hidden><path d="M0 0 l-13 -22 h26 z"/><circle r="7" cy="0"/></g>
      <rect class="ia-hit" x="0" y="0" width="${W}" height="120"/>
    </svg>
    <p class="ia-hint muted">${esc(step.instruction || 'Tocca o trascina sulla retta.')}</p>`;
  const svg = box.querySelector('svg');
  const marker = box.querySelector('[data-marker]');
  const setValue = (v) => {
    value = Math.round(Math.min(max, Math.max(min, v)) / snap) * snap;
    marker.removeAttribute('hidden'); // su SVG la proprietà .hidden non esiste: si toglie l'attributo
    marker.setAttribute('transform', `translate(${toX(value)} ${Y})`);
    svg.setAttribute('aria-valuenow', String(value));
    svg.setAttribute('aria-valuetext', it(value));
    svg.classList.remove('wrong');
    setReady(true);
  };
  const fromEvent = (e) => {
    const r = svg.getBoundingClientRect();
    setValue(toV(((e.clientX - r.left) / r.width) * W));
  };
  let locked = false;
  const detach = draggable(svg, {
    onTap: (e) => { if (!locked) { fromEvent(e); sfx.tap(); } },
    onStart: (e) => { if (!locked) fromEvent(e); },
    onMove: (dx, dy, e) => { if (!locked) fromEvent(e); },
  });
  svg.addEventListener('keydown', (e) => {
    if (locked) return;
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!k) return;
    e.preventDefault();
    setValue((value ?? (min + max) / 2) + k * (e.shiftKey ? 10 : 1) * snap * 2);
  });
  return {
    ready: () => value !== null,
    // entro un terzo della tolleranza la stima è "perfetta": moltiplicatore ×1,5
    check: () => (near(value, step.answer, step.tol) ? { ok: true, precise: near(value, step.answer, step.tol / 3) } : { ok: false, message: step.why?.(value) || (value > step.answer ? 'Troppo a destra.' : 'Troppo a sinistra.') }),
    markWrong: () => svg.classList.add('wrong'),
    reveal: () => { box.querySelector('[data-sol]').removeAttribute('hidden'); },
    retry: () => svg.focus({ preventScroll: true }),
    lock: (ok) => { locked = true; svg.setAttribute('data-locked', ''); if (ok) { svg.classList.add('right'); box.querySelector('[data-sol]').removeAttribute('hidden'); } },
    cleanup: detach,
    solve: () => setValue(step.answer),
  };
}

// ------------------------------------------------------------------ bins (smista)
function bins(box, step, setReady) {
  box.innerHTML = `
    <div class="ia-bins" style="--n:${step.bins.length}">${step.bins.map((b) => `<div class="ia-bin" data-bin="${esc(b.id)}" role="button" tabindex="0" aria-label="Metti in: ${esc(b.plain || b.label)}"><div class="ia-bin-head"></div><div class="ia-bin-body" data-body></div></div>`).join('')}</div>
    <div class="ia-pool" data-pool aria-label="Schede da sistemare"></div>
    <p class="ia-hint muted">Trascina ogni scheda nel contenitore giusto, oppure toccala e poi tocca il contenitore.</p>`;
  const pool = box.querySelector('[data-pool]');
  box.querySelectorAll('.ia-bin').forEach((el, k) => html(el.querySelector('.ia-bin-head'), step.bins[k].label));
  let selected = null;
  let locked = false;
  const detach = [];
  const chips = shuffleDiff(step.items, () => false).map((item) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'ia-chip';
    c.dataset.target = item.bin;
    html(c, item.label);
    pool.appendChild(c);
    c.addEventListener('click', (e) => { if (e.detail === 0 && !locked) select(selected === c ? null : c); }); // da tastiera
    detach.push(draggable(c, {
      onTap: () => { if (locked) return; select(selected === c ? null : c); },
      onStart: () => { if (locked) return; select(null); c.classList.add('dragging'); },
      onMove: (dx, dy) => { if (!locked) c.style.transform = `translate(${dx}px, ${dy}px)`; },
      onEnd: (e) => {
        c.classList.remove('dragging');
        c.style.transform = '';
        if (locked) return;
        c.style.visibility = 'hidden';
        const under = document.elementFromPoint(e.clientX, e.clientY);
        c.style.visibility = '';
        const bin = under?.closest('[data-bin]');
        if (bin && box.contains(bin)) put(c, bin);
        else if (under?.closest('[data-pool]')) put(c, null);
      },
    }));
    return c;
  });
  const update = () => {
    setReady(pool.children.length === 0);
    box.querySelectorAll('.ia-bin').forEach((b) => b.classList.toggle('armed', !!selected));
  };
  function select(c) {
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    selected = c;
    update();
  }
  function put(c, bin) {
    c.classList.remove('wrong');
    (bin ? bin.querySelector('[data-body]') : pool).appendChild(c);
    sfx.tap();
    select(null);
  }
  const onBin = (e) => {
    if (locked || !selected || e.target.closest('.ia-chip')) return;
    const bin = e.target.closest('[data-bin]');
    if (bin) put(selected, bin);
    else if (e.target.closest('[data-pool]')) put(selected, null);
  };
  box.addEventListener('click', onBin);
  box.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-bin]')) { e.preventDefault(); onBin(e); } });
  const binOf = (c) => c.closest('[data-bin]')?.dataset.bin ?? null;
  update();
  return {
    ready: () => pool.children.length === 0,
    check: () => {
      const wrong = chips.filter((c) => binOf(c) !== c.dataset.target).length;
      return wrong ? { ok: false, message: step.why || `${wrong === 1 ? 'Una scheda è' : `${wrong} schede sono`} nel contenitore sbagliato.` } : { ok: true };
    },
    markWrong: () => chips.forEach((c) => c.classList.toggle('wrong', binOf(c) !== c.dataset.target)),
    reveal: () => chips.forEach((c) => { box.querySelector(`[data-bin="${CSS.escape(c.dataset.target)}"] [data-body]`).appendChild(c); c.classList.remove('wrong'); c.classList.add('right'); }),
    // "Riprova": le schede sbagliate tornano da sistemare, quelle giuste restano
    retry: () => { chips.filter((c) => c.classList.contains('wrong')).forEach((c) => { c.classList.remove('wrong'); pool.appendChild(c); }); update(); },
    lock: (ok) => { locked = true; chips.forEach((c) => { c.disabled = true; if (ok) c.classList.add('right'); }); },
    cleanup: () => detach.forEach((f) => f()),
    solve: () => chips.forEach((c) => put(c, box.querySelector(`[data-bin="${CSS.escape(c.dataset.target)}"]`))),
  };
}

// ------------------------------------------------------------------ sort (ordina trascinando)
function sort(box, step, setReady) {
  const dir = step.dir === 'desc' ? -1 : 1;
  const sorted = (list) => list.every((x, k) => k === 0 || dir * (x.value - list[k - 1].value) >= 0);
  let order = shuffleDiff(step.items, sorted);
  let touched = false;
  let locked = false;
  box.innerHTML = `
    <div class="ia-sort-ends"><span>${esc(step.first || (dir > 0 ? 'Il più piccolo' : 'Il più grande'))}</span></div>
    <ol class="ia-sort" data-list></ol>
    <div class="ia-sort-ends"><span>${esc(step.last || (dir > 0 ? 'Il più grande' : 'Il più piccolo'))}</span></div>`;
  const list = box.querySelector('[data-list]');
  const detach = [];
  const els = new Map();
  for (const item of order) {
    const li = document.createElement('li');
    li.className = 'ia-sort-item';
    li.innerHTML = `<span class="ia-grip" aria-hidden="true">⋮⋮</span><span class="ia-sort-lbl"></span><span class="ia-sort-btns"><button type="button" data-up aria-label="Sposta su">▲</button><button type="button" data-down aria-label="Sposta giù">▼</button></span>`;
    html(li.querySelector('.ia-sort-lbl'), item.label);
    els.set(item, li);
    let startIdx = 0;
    let h = 0;
    let lastDy = 0;
    detach.push(draggable(li, {
      ignore: 'button',
      onStart: () => { if (locked) return; startIdx = order.indexOf(item); h = li.getBoundingClientRect().height + 8; lastDy = 0; li.classList.add('dragging'); },
      onMove: (dx, dy) => {
        if (locked) return;
        lastDy = dy;
        li.style.transform = `translateY(${dy}px)`;
        const target = Math.max(0, Math.min(order.length - 1, startIdx + Math.round(dy / h)));
        order.forEach((o, k) => {
          if (o === item) return;
          const from = k;
          let shift = 0;
          if (startIdx < target && from > startIdx && from <= target) shift = -h;
          if (startIdx > target && from < startIdx && from >= target) shift = h;
          els.get(o).style.transform = shift ? `translateY(${shift}px)` : '';
        });
      },
      onEnd: () => {
        li.classList.remove('dragging');
        els.forEach((x) => (x.style.transform = ''));
        if (!locked) move(item, Math.max(0, Math.min(order.length - 1, startIdx + Math.round(lastDy / h))));
      },
    }));
    li.querySelector('[data-up]').addEventListener('click', () => move(item, order.indexOf(item) - 1));
    li.querySelector('[data-down]').addEventListener('click', () => move(item, order.indexOf(item) + 1));
  }
  function draw() {
    order.forEach((o) => list.appendChild(els.get(o)));
    order.forEach((o, k) => { const li = els.get(o); li.querySelector('[data-up]').disabled = locked || k === 0; li.querySelector('[data-down]').disabled = locked || k === order.length - 1; });
  }
  function move(item, to) {
    const from = order.indexOf(item);
    if (to < 0 || to >= order.length || to === from) { draw(); return; }
    order.splice(from, 1);
    order.splice(to, 0, item);
    els.forEach((x) => x.classList.remove('wrong'));
    if (!touched) { touched = true; setReady(true); }
    sfx.tap();
    draw();
  }
  draw();
  const misplaced = () => {
    const ref = step.items.slice().sort((a, b) => dir * (a.value - b.value));
    return order.filter((o, k) => o.value !== ref[k].value);
  };
  return {
    ready: () => touched,
    check: () => {
      const bad = misplaced().length;
      return bad ? { ok: false, message: step.why || `${bad} schede non sono al loro posto.` } : { ok: true };
    },
    markWrong: () => misplaced().forEach((o) => els.get(o).classList.add('wrong')),
    reveal: () => { order = step.items.slice().sort((a, b) => dir * (a.value - b.value)); els.forEach((x) => { x.classList.remove('wrong'); x.classList.add('right'); }); draw(); },
    retry: () => {},
    lock: (ok) => { locked = true; draw(); if (ok) els.forEach((x) => x.classList.add('right')); },
    cleanup: () => detach.forEach((f) => f()),
    solve: () => { order = step.items.slice().sort((a, b) => dir * (a.value - b.value)); touched = true; setReady(true); draw(); },
  };
}

export const INTERACTIVE = { slider, place, bins, sort };

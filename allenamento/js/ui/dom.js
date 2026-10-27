// Strumenti dell'interfaccia: KaTeX, icone, avvisi, dialoghi.

export function renderMath(el) {
  if (!el || !window.renderMathInElement) return;
  window.renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  });
  fitMath(el);
}

/** Formule in display (e nei tasselli da ordinare) più larghe del loro spazio: si rimpiccioliscono fino al 72%;
 *  oltre, scorrono da sole (mai la pagina intera). Si ricalcola quando cambia la larghezza dello schermo. */
const MIN_FIT = 0.72;
export function fitMath(root = document) {
  for (const d of root.querySelectorAll('.katex-display, .order-chip > span')) {
    d.style.fontSize = '';
    d.classList.remove('math-scroll');
    const over = d.scrollWidth - d.clientWidth;
    if (over <= 1 || !d.clientWidth) continue;
    const k = Math.max(MIN_FIT, (d.clientWidth - 2) / d.scrollWidth);
    d.style.fontSize = `${(k * 100).toFixed(1)}%`;
    if (d.scrollWidth - d.clientWidth > 1) d.classList.add('math-scroll');
  }
}
let fitTimer = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => fitMath(document), 150); });
}
export function tex(el, latex, display = false) {
  if (window.katex) { window.katex.render(latex, el, { throwOnError: false, displayMode: display }); if (display) fitMath(el); }
  else el.textContent = latex;
}
export function html(el, str) {
  el.innerHTML = str;
  renderMath(el);
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const S = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true">${body}</svg>`;
const st = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** Glifi delle attività che nessun font del sito contiene (il browser li prendeva da un font di sistema, minuscoli):
 *  disegnati come le altre icone. "x̄" resta testo, con la barretta in CSS. I dati delle attività non cambiano. */
const GLYPH_SVG = {
  '⚙': S(`<circle cx="12" cy="12" r="6.5" ${st}/><circle cx="12" cy="12" r="2.2" ${st}/><path ${st} stroke-width="2.6" d="M12 5.5v-3M16.6 7.4l2.1-2.1M18.5 12h3M16.6 16.6l2.1 2.1M12 18.5v3M7.4 16.6l-2.1 2.1M5.5 12h-3M7.4 7.4 5.3 5.3"/>`),
  '▭': S(`<rect ${st} x="2.5" y="6" width="19" height="12" rx="1.5"/>`),
  '◷': S(`<circle cx="12" cy="12" r="9" ${st}/><path ${st} d="M12 12h9M12 12l5.5-5.5M16 12a4 4 0 0 0-1.2-2.8"/>`),
  '◺◺': S(`<path ${st} d="M2.5 20v-6l6 6zM11 20V5l11 15z"/>`),
};
export function glyphHTML(g) {
  if (GLYPH_SVG[g]) return GLYPH_SVG[g];
  if (g === 'x̄') return '<span class="ovl">x</span>';
  return esc(g);
}

export const icons = {
  // marchio: il Δ del discriminante in un quadrato
  brand: `<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="11" fill="var(--accent)"/><path d="M20 9 L31 30 L9 30 Z" fill="none" stroke="var(--on-accent, #050507)" stroke-width="3.4" stroke-linejoin="round"/><path d="M14 23h12" stroke="var(--on-accent, #050507)" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></svg>`,
  flame: S('<path fill="currentColor" d="M12.6 2.2c.4 3-1 4.6-2.4 6.2C8.8 10 7.4 11.6 7.4 14.3a4.6 4.6 0 0 0 9.2.2c0-1.6-.6-2.8-1.4-3.8.2 1.5-.3 2.6-1.2 3.1.3-2.7-.8-5-1.4-6.3 2.8.9 5.8 3.6 5.8 7.1A6.4 6.4 0 0 1 12 21a6.4 6.4 0 0 1-6.4-6.6c0-3.5 1.9-5.6 3.5-7.4 1.3-1.5 2.6-2.9 3.5-4.8Z"/>'),
  ice: S(`<path ${st} d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>`),
  coin: S('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.5 17 16H7Z" fill="none" stroke="#2a1d00" stroke-width="2" stroke-linejoin="round"/>'),
  star: S('<path fill="currentColor" d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>'),
  check: S(`<path ${st} stroke-width="3" d="m5 12.5 4.5 4.5L19 7.5"/>`),
  close: S(`<path ${st} stroke-width="2.4" d="M6 6l12 12M18 6 6 18"/>`),
  trash: S(`<path ${st} d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>`),
  back: S(`<path ${st} stroke-width="2.4" d="M15 5l-7 7 7 7"/>`),
  sun: S(`<circle cx="12" cy="12" r="4.5" ${st}/><path ${st} d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>`),
  map: S(`<path ${st} d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z M9 4v13.5 M15 6.5V20"/>`),
  bolt: S('<path fill="currentColor" d="M13.5 2 4 13.5h6.5L9 22l11-13h-6.8z"/>'),
  trophy: S(`<path ${st} d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5"/>`),
  gift: S(`<path ${st} d="M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-1-3-5-4-5-1.5S11 9 12 9zm0 0c1-3 5-4 5-1.5S13 9 12 9z"/>`),
  user: S(`<circle cx="12" cy="8" r="4" ${st}/><path ${st} d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>`),
  puzzle: S(`<path ${st} d="M9 3h6v3a2 2 0 1 0 4 0V3h2v6h-3a2 2 0 1 0 0 4h3v8h-6v-3a2 2 0 1 0-4 0v3H3v-8h3a2 2 0 1 0 0-4H3V3z"/>`),
  repeat: S(`<path ${st} d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"/>`),
  clipboard: S(`<path ${st} d="M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8.5 12l2.5 2.5L16 9.5"/>`),
  share: S(`<path ${st} d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>`),
  copy: S(`<path ${st} d="M8 8h12v12H8zM4 16V4h12"/>`),
  lock: S(`<path ${st} d="M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>`),
  shop: S(`<path ${st} d="M4 7h16l-1.5 13h-13zM9 7a3 3 0 0 1 6 0"/>`),
  calc: S(`<rect ${st} x="5" y="2.5" width="14" height="19" rx="2.5"/><path ${st} d="M8 6.5h8M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>`),
  teacher: S(`<path ${st} d="M3 5h18v11H3zM8 21l4-5 4 5M7 9h6M7 12h4"/>`),
  chest: (open = false, color = 'var(--gold)') => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 20h34v20H7z" fill="${color}" stroke="currentColor" stroke-width="2"/>${open ? '<path d="M7 20 11 9h26l4 11z" fill="var(--surface-3)" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="15" r="4" fill="#fff8"/>' : '<path d="M7 20c0-7 4-11 17-11s17 4 17 11z" fill="' + color + '" stroke="currentColor" stroke-width="2"/>'}<rect x="20" y="22" width="8" height="8" rx="2" fill="var(--surface)" stroke="currentColor" stroke-width="2"/></svg>`,
  medal: (tier) => {
    const c = ['var(--surface-3)', 'hsl(28 60% 50%)', 'hsl(210 10% 72%)', 'var(--gold)'][tier];
    return `<svg class="medal" viewBox="0 0 48 48" aria-hidden="true"><path d="M15 3h7l5 12h-7zM33 3h-7l-5 12h7z" fill="var(--c2)"/><circle cx="24" cy="30" r="14" fill="${c}" stroke="currentColor" stroke-width="2"/><path d="m24 21 2.6 5.4 5.9.8-4.3 4 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4 5.9-.8z" fill="var(--surface)" opacity=".85"/></svg>`;
  },
  gem: (hue, glow = false) => `<svg class="gem" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 18 18 8h12l8 10-14 22z" fill="hsl(${hue} 70% 55%)" stroke="hsl(${hue} 70% 30%)" stroke-width="2" stroke-linejoin="round"/><path d="M10 18h28M18 8l-2 10 8 22 8-22-2-10" fill="none" stroke="hsl(${hue} 80% 85%)" stroke-width="1.4" opacity=".7"/>${glow ? `<circle cx="24" cy="24" r="22" fill="none" stroke="hsl(${hue} 90% 60%)" stroke-width="2" opacity=".5"/>` : ''}</svg>`,
};

export function stars(n, max = 3) {
  let s = `<span class="stars" role="img" aria-label="${n} stelle su ${max}">`;
  for (let i = 1; i <= max; i++) s += `<span class="${i <= n ? 'on' : 'off'}">${icons.star}</span>`;
  return s + '</span>';
}

// avvisi in coda: al massimo due sullo schermo, gli altri arrivano man mano (un tocco li chiude)
const toastQueue = [];
const TOAST_MAX = 2;
export function toast(msg, kind = '', icon = '') {
  toastQueue.push({ msg, kind, icon });
  pumpToasts();
}
function pumpToasts() {
  const box = document.getElementById('toasts');
  if (!box) return;
  while (box.children.length < TOAST_MAX && toastQueue.length) {
    const { msg, kind, icon } = toastQueue.shift();
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = (icon || '') + '<div></div>';
    html(t.lastChild, msg);
    const close = () => { if (!t.isConnected) return; t.remove(); pumpToasts(); };
    t.addEventListener('click', close);
    box.appendChild(t);
    setTimeout(close, 3600);
  }
}

/** Dialogo nella pagina (i dialoghi del browser non funzionano ovunque) */
export function ask(message, yes = 'Conferma', no = 'Annulla') {
  return modal({ body: `<p>${esc(message)}</p>`, actions: [{ label: no, value: false, ghost: true }, { label: yes, value: true }] });
}

/** Modale generico. actions: [{label, value, ghost, kind}] → Promise del value scelto */
export function modal({ title = '', body = '', art = '', actions = [{ label: 'Continua', value: true }] }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-t">
      ${art ? `<div class="reward-art pop">${art}</div>` : ''}
      ${title ? `<h2 id="modal-t">${title}</h2>` : '<span id="modal-t" class="sr">Messaggio</span>'}
      <div class="modal-body"></div><div class="btn-row"></div></div>`;
    html(wrap.querySelector('.modal-body'), body);
    const row = wrap.querySelector('.btn-row');
    const done = (v) => {
      wrap.remove();
      document.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); done(actions.find((a) => a.ghost)?.value ?? false); }
    };
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = a.ghost ? 'btn-ghost' : 'btn' + (a.kind ? ' ' + a.kind : '');
      b.textContent = a.label;
      b.addEventListener('click', () => done(a.value));
      row.appendChild(b);
    });
    wrap.addEventListener('click', (e) => { if (e.target === wrap) done(actions.find((a) => a.ghost)?.value ?? false); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    row.lastChild?.focus();
  });
}

/** Copia negli appunti con ripiego sulla selezione */
export async function copyText(text, el) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (el) {
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
    return false;
  }
}

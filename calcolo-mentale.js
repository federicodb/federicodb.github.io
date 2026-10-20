// Calcolo veloce (calcolo-mentale.html): schede, tecniche dal modulo comune con la Quest,
// verifica simbolica dal vivo con nerdamer, esercizi senza cronometro.
// Indirizzi: #metodo · #tecniche · #storia · #docente · #<tecnica> · #<tecnica>/<vista>
// con vista ∈ algoritmo | esempi | perche | prova.

import { TRUCCHI, TRUCCHI_BY_ID } from './allenamento/activities/calcolo/trucchi.js';
import { createRng } from './allenamento/js/engine/rng.js';

const TABS = ['metodo', 'tecniche', 'storia', 'docente'];
const VIEWS = [
  { id: 'algoritmo', label: 'Algoritmo' },
  { id: 'esempi', label: 'Esempi' },
  { id: 'perche', label: 'Perché funziona' },
  { id: 'prova', label: 'Prova tu' },
];
const ANNI = [
  { label: 'Prima', test: (t) => Math.min(...t.anni) === 1 },
  { label: 'Seconda', test: (t) => Math.min(...t.anni) === 2 },
  { label: 'Dal terzo anno', test: (t) => Math.min(...t.anni) >= 3 },
];
const NERDAMER = ['nerdamer.core.js', 'Algebra.js'].map((f) => `https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/${f}`);
const ICON = {
  arrow: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  refresh: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/></svg>',
  check: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  print: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>',
  link: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
};

const $ = (q, el = document) => el.querySelector(q);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const state = { tab: 'metodo', trick: TRUCCHI[0].id, view: 'algoritmo' };
const rng = createRng();

// ------------------------------------------------------------------ formule
function renderMath(el) {
  if (!window.renderMathInElement) return;
  window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
}
const display = (tex) => `<div class="cm-math">$$${tex}$$</div>`;

// ------------------------------------------------------------------ progressi dalla Quest (stesso dispositivo)
function questStars() {
  try {
    const s = JSON.parse(localStorage.getItem('orfini_quest_v2'));
    return Object.fromEntries(TRUCCHI.map((t) => [t.id, s?.activities?.[`calcolo-${t.id}`]?.stars || 0]));
  } catch { return {}; }
}

// ------------------------------------------------------------------ indirizzi
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (TABS.includes(h)) return { tab: h };
  const [id, view] = h.split('/');
  if (TRUCCHI_BY_ID[id]) return { tab: 'tecniche', trick: id, view: VIEWS.some((v) => v.id === view) ? view : 'algoritmo' };
  return {};
}
function writeHash() {
  const h = state.tab === 'tecniche' ? `#${state.trick}${state.view !== 'algoritmo' ? '/' + state.view : ''}` : `#${state.tab}`;
  if (location.hash !== h) history.replaceState(null, '', h);
}

// ------------------------------------------------------------------ schede accessibili (WAI-ARIA tabs)
function wireTablist(list, onSelect) {
  list.addEventListener('click', (e) => { const b = e.target.closest('[role=tab]'); if (b) onSelect(b, true); });
  list.addEventListener('keydown', (e) => {
    const tabs = [...list.querySelectorAll('[role=tab]')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const go = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (go === undefined) return;
    e.preventDefault();
    const t = tabs[(go + tabs.length) % tabs.length];
    t.focus();
    onSelect(t, false);
  });
}
function selectTab(list, id) {
  list.querySelectorAll('[role=tab]').forEach((b) => {
    const on = (b.dataset.tab || b.dataset.view) === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
}

// ------------------------------------------------------------------ pagina
function showTab(id, { focus = false } = {}) {
  state.tab = id;
  selectTab($('.cm-tabs'), id);
  for (const t of TABS) $(`#panel-${t}`).hidden = t !== id;
  if (id === 'tecniche') renderTrick();
  writeHash();
  if (focus) $(`#panel-${id}`).focus({ preventScroll: true });
}

function renderIndex() {
  const stars = questStars();
  $('#cm-index-list').innerHTML = ANNI.map((g) => {
    const list = TRUCCHI.filter(g.test);
    return `<div class="cm-index-group"><h3>${g.label}</h3><ul>${list.map((t) => `<li><a href="#${t.id}" data-trick="${t.id}" ${t.id === state.trick ? 'aria-current="true"' : ''}><span>${esc(t.titolo)}</span>${stars[t.id] >= 3 ? `<span class="cm-done" title="Dimostrata nella Quest">${ICON.check}<span class="sr">dimostrata nella Quest</span></span>` : ''}</a></li>`).join('')}</ul></div>`;
  }).join('');
  const done = Object.values(stars).filter((s) => s >= 3).length;
  const started = Object.values(stars).filter((s) => s > 0).length;
  const p = $('#cm-progress');
  if (started) { p.hidden = false; p.innerHTML = `Nella Quest hai dimostrato <strong>${done}</strong> ${done === 1 ? 'tecnica' : 'tecniche'} su ${TRUCCHI.length}.`; }
}

function renderTrick() {
  const t = TRUCCHI_BY_ID[state.trick];
  $('#cm-index-list').querySelectorAll('a[data-trick]').forEach((a) => (a.dataset.trick === t.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  $('#cm-index-current').textContent = t.titolo;
  const art = $('#cm-technique');
  art.innerHTML = `
    <header class="cm-tech-head">
      <h2>${esc(t.titolo)}</h2>
      <p class="cm-tech-name">${t.nome}</p>
      <p class="cm-tech-idea">${esc(t.idea)}</p>
    </header>
    <div class="cm-subtabs" role="tablist" aria-label="Viste della tecnica">
      ${VIEWS.map((v) => `<button role="tab" id="vtab-${v.id}" aria-controls="view-${v.id}" data-view="${v.id}" aria-selected="${v.id === state.view}" ${v.id === state.view ? '' : 'tabindex="-1"'}>${v.label}</button>`).join('')}
    </div>
    ${VIEWS.map((v) => `<section class="cm-view" role="tabpanel" id="view-${v.id}" aria-labelledby="vtab-${v.id}" tabindex="0" ${v.id === state.view ? '' : 'hidden'}></section>`).join('')}
    <footer class="cm-tech-foot">
      <a class="main-cta-btn cm-quest" href="allenamento/#/lezione/calcolo-${t.id}/1">Allenati nella Quest ${ICON.arrow}</a>
      <button type="button" class="cm-link-btn" data-print>${ICON.print} Stampa la scheda</button>
      <button type="button" class="cm-link-btn" data-copy>${ICON.link} Copia il link</button>
    </footer>`;
  wireTablist(art.querySelector('.cm-subtabs'), (b) => showView(b.dataset.view));
  for (const v of VIEWS) fillView(t, v.id);
  renderMath(art);
  if (state.view === 'perche') verify(t);
  art.querySelector('[data-print]').addEventListener('click', printTrick);
  art.querySelector('[data-copy]').addEventListener('click', copyLink);
}

function showView(id) {
  state.view = id;
  selectTab($('.cm-subtabs'), id);
  for (const v of VIEWS) $(`#view-${v.id}`).hidden = v.id !== id;
  if (id === 'perche') verify(TRUCCHI_BY_ID[state.trick]);
  writeHash();
}

function fillView(t, id) {
  const el = $(`#view-${id}`);
  if (id === 'algoritmo') {
    el.innerHTML = `<ol class="cm-steps">${t.passi.map((p) => `<li>${p}</li>`).join('')}</ol>
      ${t.prereq.length ? `<p class="cm-note">Serve sapere: ${t.prereq.map((p) => `<a href="allenamento/#/lezione/${p}/1">${esc(PREREQ_NAMES[p] || p)}</a>`).join(', ')}.</p>` : ''}`;
  }
  if (id === 'esempi') {
    el.innerHTML = `<div class="cm-examples" data-examples></div><button type="button" class="cm-link-btn" data-more>${ICON.refresh} Altri esempi</button>`;
    const fill = () => {
      el.querySelector('[data-examples]').innerHTML = [0, 1, 2].map(() => {
        const e = t.genera(rng);
        return `<div class="cm-example">${e.testo ? `<p>${e.testo}</p>` : `<p class="cm-example-q">$${e.q}$</p>`}${display(`\\begin{aligned}${e.svolgimento.map((l) => `&${l}`).join('\\\\')}\\end{aligned}`)}</div>`;
      }).join('');
      renderMath(el);
    };
    fill();
    el.querySelector('[data-more]').addEventListener('click', fill);
  }
  if (id === 'perche') {
    const d = t.dimostrazione;
    el.innerHTML = `<p class="cm-measure">${d.premessa}</p>
      <ol class="cm-proof">${d.passi.map((p) => `<li><div class="cm-proof-math">$$${p.tex}$$</div><div class="cm-proof-why">${p.perche}</div></li>`).join('')}</ol>
      <p class="cm-measure"><strong>${d.conclusione}</strong></p>
      <div class="cm-verify" data-verify aria-live="polite">
        <h3>Verifica simbolica</h3>
        <p class="cm-verify-intro">Il calcolo simbolico (nerdamer) sviluppa i due membri di ogni identità e ne controlla la differenza, per ogni valore delle lettere.</p>
        <div data-verify-body><p class="cm-muted">Carico il motore simbolico…</p></div>
      </div>
      <div class="cm-note"><h3>Quando non funziona</h3><p>${t.limiti}</p></div>`;
  }
  if (id === 'prova') {
    el.innerHTML = `<form class="cm-try" data-try novalidate>
        <div class="cm-try-q" data-q></div>
        <div class="cm-try-row">
          <label class="sr" for="cm-answer">La tua risposta</label>
          <input id="cm-answer" class="cm-try-input" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="La tua risposta">
          <span class="cm-try-unit" data-unit></span>
          <button type="submit" class="main-cta-btn">Verifica</button>
        </div>
        <div class="cm-try-feedback" data-feedback aria-live="polite"></div>
        <button type="button" class="cm-link-btn" data-new>${ICON.refresh} Nuovo esercizio</button>
      </form>`;
    newExercise(t, el);
  }
}
const PREREQ_NAMES = {
  'prodotti-notevoli': 'prodotti notevoli', monomi: 'monomi e polinomi', percentuali: 'percentuali', frazioni: 'frazioni',
  radicali: 'radicali', proporzioni: 'proporzioni', 'equazioni-2': 'equazioni di secondo grado', scomposizioni: 'scomposizioni', combinatoria: 'calcolo combinatorio',
};

// ------------------------------------------------------------------ prova tu (senza cronometro, due tentativi prima della soluzione)
function parseAnswer(raw) {
  let s = String(raw).trim().replace(/\s+/g, '').replace(/[€%]|ore|giorni|m$/gi, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return Number(s);
}
function newExercise(t, el) {
  const e = t.genera(rng);
  let tries = 0;
  const q = el.querySelector('[data-q]');
  q.innerHTML = e.testo ? `<p>${e.testo}</p>` : `<p>Calcola a mente:</p>${display(e.q)}`;
  el.querySelector('[data-unit]').textContent = e.unit || '';
  const input = el.querySelector('#cm-answer');
  const fb = el.querySelector('[data-feedback]');
  input.value = '';
  input.removeAttribute('aria-invalid');
  fb.innerHTML = '';
  renderMath(q);
  const form = el.querySelector('[data-try]');
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const v = parseAnswer(input.value);
    if (Number.isNaN(v)) { fb.innerHTML = '<p class="cm-muted">Scrivi un numero (le virgole vanno bene: 2,5).</p>'; input.focus(); return; }
    tries++;
    const ok = Math.abs(v - e.risposta) < 1e-9;
    const steps = display(`\\begin{aligned}${e.svolgimento.map((l) => `&${l}`).join('\\\\')}\\end{aligned}`);
    if (ok) {
      input.setAttribute('aria-invalid', 'false');
      fb.innerHTML = `<p class="cm-ok">${ICON.check} Giusto.</p>${steps}`;
    } else if (tries === 1) {
      input.setAttribute('aria-invalid', 'true');
      fb.innerHTML = `<p class="cm-no">Non ancora. Riprova con il trucco: ${esc(t.idea)}</p>`;
      input.select();
    } else {
      input.setAttribute('aria-invalid', 'true');
      fb.innerHTML = `<p class="cm-no">Ecco come si fa:</p>${steps}`;
    }
    renderMath(fb);
  };
  el.querySelector('[data-new]').onclick = () => { newExercise(t, el); input.focus(); };
}

// ------------------------------------------------------------------ verifica simbolica con nerdamer (caricato solo quando serve)
let nerdamerReady = null;
function loadNerdamer() {
  if (window.nerdamer?.expand) return Promise.resolve();
  nerdamerReady ||= NERDAMER.reduce((p, src) => p.then(() => new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = ko;
    document.head.appendChild(s);
  })), Promise.resolve());
  return nerdamerReady;
}
async function verify(t) {
  const box = $('#view-perche [data-verify-body]');
  if (!box || box.dataset.done === t.id) return;
  try {
    await loadNerdamer();
    const N = window.nerdamer;
    box.innerHTML = t.dimostrazione.verifica.map((id) => {
      const diff = `(${id.lhs})-(${id.rhs})`;
      const zero = (id.razionale ? N(`simplify(${diff})`) : N(`expand(${diff})`)).toString() === '0';
      const L = id.razionale ? N(id.lhs).toTeX() : N(`expand(${id.lhs})`).toTeX();
      const R = id.razionale ? N(id.rhs).toTeX() : N(`expand(${id.rhs})`).toTeX();
      return `<div class="cm-identity">
        ${id.nota ? `<p class="cm-muted">${id.nota}</p>` : ''}
        <dl>
          <dt>Primo membro</dt><dd>$${N(id.lhs).toTeX()}$${id.razionale ? '' : ` sviluppato: $${L}$`}</dd>
          <dt>Secondo membro</dt><dd>$${N(id.rhs).toTeX()}$${id.razionale ? '' : ` sviluppato: $${R}$`}</dd>
          <dt>Differenza</dt><dd class="${zero ? 'cm-ok' : 'cm-no'}">${zero ? `${ICON.check} $0$: identità verificata` : 'non nulla: identità da rivedere'}</dd>
        </dl></div>`;
    }).join('');
    box.dataset.done = t.id;
  } catch {
    box.innerHTML = '<p class="cm-muted">Senza connessione il motore simbolico non si carica. Le stesse identità sono verificate dai test automatici del sito a ogni modifica.</p>';
  }
  renderMath(box);
}

// ------------------------------------------------------------------ stampa e link
function printTrick() {
  document.body.classList.add('cm-printing');
  verify(TRUCCHI_BY_ID[state.trick]).finally(() => {
    window.print();
    document.body.classList.remove('cm-printing');
  });
}
async function copyLink(e) {
  const url = `${location.origin}${location.pathname}#${state.trick}${state.view !== 'algoritmo' ? '/' + state.view : ''}`;
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(url); b.lastChild.textContent = ' Link copiato'; } catch { b.lastChild.textContent = ' ' + url; }
  setTimeout(() => { b.lastChild.textContent = ' Copia il link'; }, 2500);
}

// ------------------------------------------------------------------ elenco per il docente
function renderTeacher() {
  $('#cm-teacher-table tbody').innerHTML = TRUCCHI.map((t) => `<tr>
      <th scope="row"><a href="#${t.id}">${esc(t.titolo)}</a></th>
      <td>${t.anni.map((a) => `${a}ª`).join('–')}</td>
      <td>${esc(t.principio)}</td>
      <td><a href="competenze.html#${t.mat[0]}">${t.mat.join(', ')}</a></td>
      <td>${t.prereq.length ? t.prereq.map((p) => esc(PREREQ_NAMES[p] || p)).join(', ') : '—'}</td>
      <td class="cm-links"><a href="allenamento/#/lezione/calcolo-${t.id}/1">Quest</a> · <a href="#${t.id}/perche">dimostrazione</a></td>
    </tr>`).join('');
}

// ------------------------------------------------------------------ elenco delle tecniche: sul telefono si apre e si chiude
function wireIndex() {
  const toggle = $('#cm-index-toggle');
  const nav = $('#cm-index');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  $('#cm-index-list').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-trick]');
    if (!a) return;
    e.preventDefault();
    state.trick = a.dataset.trick;
    state.view = 'algoritmo';
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    renderTrick();
    writeHash();
    if (matchMedia('(max-width: 899px)').matches) $('#cm-technique').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
}

function fromHash() {
  const h = parseHash();
  if (h.trick) { state.trick = h.trick; state.view = h.view; }
  showTab(h.tab || state.tab);
}

// le schede di primo livello scorrono di lato se non ci stanno: sfumatura sul bordo che indica il resto
function wireTabsOverflow() {
  const list = $('.cm-tabs');
  const update = () => list.classList.toggle('cm-more', list.scrollWidth - list.scrollLeft - list.clientWidth > 4);
  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// altezza reale del menu del sito (fisso in alto): serve per non nascondere sotto di esso la tecnica
function trackNavHeight() {
  const nav = document.getElementById('main-nav');
  const set = () => document.documentElement.style.setProperty('--cm-nav-h', `${nav ? nav.offsetHeight : 0}px`);
  set();
  window.addEventListener('resize', set);
}

function init() {
  trackNavHeight();
  renderIndex();
  renderTeacher();
  wireIndex();
  wireTablist($('.cm-tabs'), (b, byClick) => showTab(b.dataset.tab, { focus: byClick && false }));
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { showTab(b.dataset.goto); $('.cm-tabs').scrollIntoView({ block: 'start' }); }));
  window.addEventListener('hashchange', fromHash);
  const deepLink = !!parseHash().trick;
  fromHash();
  renderMath(document.querySelector('main'));
  wireTabsOverflow();
  // arrivando da un QR code su una tecnica, la si mostra subito (sotto l'intestazione della pagina)
  if (deepLink) requestAnimationFrame(() => $('#cm-technique').scrollIntoView({ block: 'start' }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

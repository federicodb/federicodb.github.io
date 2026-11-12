// INTERFACCIA DI ASTROMATH — tutto ciò che è testo sta nel DOM (leggibile, accessibile, formule in KaTeX):
// HUD, pannello dell'incontro, etichette agganciate agli anelli e alle correnti, bussola, schermate e avvisi.

import { MONDO } from './mondo.js';
import { LIVELLI, STELLE_PER_LIVELLO } from './livelli.js';
import { BADGE, statoLivello, sbloccato } from './progressi.js';

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ------------------------------------------------------------------------------------------------
// Formule: KaTeX locale (auto-render). Se non è ancora pronto, si aspetta l'evento della pagina.
// ------------------------------------------------------------------------------------------------
const DELIM = [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }];
export function tipografa(el) {
  if (!el) return;
  const fai = () => { try { window.renderMathInElement(el, { delimiters: DELIM, throwOnError: false }); } catch (e) { console.warn('KaTeX', e); } };
  if (window.renderMathInElement) fai();
  else window.addEventListener('katex-pronto', fai, { once: true });
}

export class UI {
  constructor(az) {
    this.az = az; // azioni del gioco: { rispondi, aiuto, pausa, … }
    this.el = {
      hud: $('#hud'), nome: $('#hud-nome'), stelle: $('#hud-stelle'), punti: $('#hud-punti'), energia: $('#hud-energia'),
      comandi: $('#comandi'), etichette: $('#etichette'), bussola: $('#bussola'),
      inc: $('#incontro'), incCreatura: $('#inc-creatura'), incArg: $('#inc-argomento'), incDomanda: $('#inc-domanda'), incFig: $('#inc-fig'),
      incOpz: $('#inc-opzioni'), incEsito: $('#inc-esito'), incAiuto: $('#inc-aiuto'), incNota: $('#inc-nota'),
      intro: $('#intro'), toast: $('#avvisi'), joy: $('#joystick'),
      avvio: $('#schermo-avvio'), fine: $('#schermo-fine'), pausa: $('#schermo-pausa'), caricamento: $('#caricamento'),
    };
    this.anelli = [];
    this.corr = [];
    this.el.incAiuto.addEventListener('click', () => this.az.aiuto());
  }

  // ---------------------------------------------------------------- HUD
  mostraGioco(si) {
    for (const k of ['hud', 'comandi', 'etichette']) this.el[k].hidden = !si;
    document.body.classList.toggle('in-volo', si);
  }
  hud(mondo, nomeLivello) {
    const accese = mondo.stelle.filter((s) => s.stato === 'accesa').length;
    if (this._hudNome !== nomeLivello) { this.el.nome.textContent = nomeLivello; this._hudNome = nomeLivello; }
    const st = `${accese}/${STELLE_PER_LIVELLO}`;
    if (this._hudSt !== st) { this.el.stelle.textContent = st; this.el.stelle.parentElement.setAttribute('aria-label', `Stelle accese: ${accese} su ${STELLE_PER_LIVELLO}`); this._hudSt = st; }
    if (this._hudPt !== mondo.punti) { this.el.punti.textContent = mondo.punti; this._hudPt = mondo.punti; }
    const e = Math.round((mondo.pilota.energia / mondo.pilota.energiaMax) * 100);
    if (this._hudEn !== e) { this.el.energia.style.setProperty('--e', e / 100); this.el.energia.setAttribute('aria-valuenow', e); this._hudEn = e; }
  }

  // ---------------------------------------------------------------- incontro
  apriIncontro(stella, sfida, { nomeCreatura, nota = '' }) {
    clearTimeout(this._tChiudi); // un incontro nuovo annulla la chiusura ritardata del precedente
    const e = this.el;
    e.incCreatura.textContent = nomeCreatura;
    e.incArg.textContent = `${stella.titoloAttivita} · livello ${stella.livelloQuest}`;
    e.incDomanda.innerHTML = sfida.prompt;
    e.incFig.innerHTML = sfida.fig || '';
    e.incFig.hidden = !sfida.fig;
    e.incNota.innerHTML = nota;
    e.incNota.hidden = !nota;
    e.incEsito.textContent = '';
    e.incEsito.className = 'inc-esito';
    e.incAiuto.hidden = !sfida.aiuto;
    e.incAiuto.disabled = false;
    e.incOpz.innerHTML = '';
    sfida.opzioni.forEach((o, k) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opz';
      b.innerHTML = `<span class="opz-n" aria-hidden="true">${k + 1}</span><span class="opz-t">${o.label}</span>`;
      b.setAttribute('aria-keyshortcuts', String(k + 1));
      b.addEventListener('click', () => this.az.rispondi(k));
      li.appendChild(b);
      e.incOpz.appendChild(li);
    });
    e.inc.hidden = false;
    tipografa(e.inc);
    // etichette sugli anelli
    this.el.etichette.querySelectorAll('.et-anello').forEach((n) => n.remove());
    this.anelli = sfida.opzioni.map((o, k) => {
      const d = document.createElement('div');
      d.className = 'et-anello';
      d.innerHTML = `<span class="opz-n">${k + 1}</span><span class="et-t">${o.label}</span>`;
      this.el.etichette.appendChild(d);
      tipografa(d);
      return d;
    });
  }
  scarta(k, perche) {
    const b = this.el.incOpz.querySelectorAll('.opz')[k];
    if (b) { b.disabled = true; b.classList.add('scartata'); }
    if (this.anelli[k]) this.anelli[k].classList.add('scartata');
    this.esito(perche ? `Non è questa. ${perche}` : 'Non è questa: prova un altro anello.', 'no');
  }
  esito(html, tipo = '') {
    this.el.incEsito.innerHTML = html;
    this.el.incEsito.className = `inc-esito ${tipo}`;
    tipografa(this.el.incEsito);
  }
  giusta(k, testo) {
    const b = this.el.incOpz.querySelectorAll('.opz')[k];
    if (b) b.classList.add('giusta');
    this.el.incOpz.querySelectorAll('.opz').forEach((x) => { x.disabled = true; });
    this.esito(testo, 'si');
  }
  chiudiIncontro(ritardo = 0) {
    clearTimeout(this._tChiudi);
    const fai = () => { this.el.inc.hidden = true; this.el.etichette.querySelectorAll('.et-anello').forEach((n) => n.remove()); this.anelli = []; };
    if (ritardo) this._tChiudi = setTimeout(fai, ritardo); else fai();
  }

  // ---------------------------------------------------------------- etichette nel mondo
  preparaCorrenti(mondo) {
    this.el.etichette.querySelectorAll('.et-corrente').forEach((n) => n.remove());
    this.corr = mondo.correnti.map((c) => {
      const d = document.createElement('div');
      d.className = 'et-corrente';
      d.innerHTML = `$${c.tex}$`;
      this.el.etichette.appendChild(d);
      tipografa(d);
      return d;
    });
  }
  etichette(mondo, cam, W, H) {
    const metti = (d, x, y, z = 0) => {
      const q = cam.proietta(x, y, z, W, H);
      if (!q || q[0] < -200 || q[0] > W + 200 || q[1] < -100 || q[1] > H + 100) { d.style.visibility = 'hidden'; return; }
      d.style.visibility = 'visible';
      d.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px) translate(-50%, -50%)`;
    };
    const inc = mondo.incontro;
    if (inc) inc.anelli.forEach((a, k) => { if (this.anelli[k]) { metti(this.anelli[k], a.x, a.y + MONDO.raggioAnello + 2.6); this.anelli[k].classList.toggle('nato', inc.t > a.nasce + 0.3); } });
    mondo.correnti.forEach((c, k) => { if (!this.corr[k]) return; const xm = (c.x0 + c.x1) / 2; metti(this.corr[k], xm, c.f(xm) + 5); this.corr[k].classList.toggle('attiva', mondo.pilota.inSurf === c); });
    // bussola: verso la stella spenta più vicina, o verso il portale
    const p = mondo.pilota;
    let meta = null;
    if (mondo.portaleAperto) meta = MONDO.portale;
    else if (!inc) { let best = 1e9; for (const s of mondo.stelle) if (s.stato === 'spenta') { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < best) { best = d; meta = s; } } }
    const b = this.el.bussola;
    if (!meta) { b.hidden = true; return; }
    const q = cam.proietta(meta.x, meta.y, 0, W, H);
    const fuori = !q || q[0] < 30 || q[0] > W - 30 || q[1] < 70 || q[1] > H - 30;
    b.hidden = !fuori;
    if (!fuori) return;
    const c = cam.proietta(p.x, p.y, 0, W, H) || [W / 2, H / 2];
    const ang = Math.atan2((q ? q[1] : 0) - c[1], (q ? q[0] : 0) - c[0]);
    const R = Math.min(W, H) * 0.42;
    const bx = Math.max(36, Math.min(W - 36, W / 2 + Math.cos(ang) * R)), by = Math.max(84, Math.min(H - 36, H / 2 + Math.sin(ang) * R));
    b.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%) rotate(${ang}rad)`;
    b.classList.toggle('portale', !!mondo.portaleAperto);
  }

  // ---------------------------------------------------------------- avvisi, presentazioni
  avviso(html, { tipo = '', durata = 3200 } = {}) {
    const d = document.createElement('div');
    d.className = `avviso ${tipo}`;
    d.innerHTML = html;
    this.el.toast.appendChild(d);
    tipografa(d);
    setTimeout(() => d.classList.add('via'), durata);
    setTimeout(() => d.remove(), durata + 600);
  }
  badge(b) {
    this.avviso(`<span class="badge-glifo" style="--h:${b.tinta}">${esc(b.glifo)}</span><span><strong>Nuovo badge: ${esc(b.nome)}</strong><br>${esc(b.desc)}</span>`, { tipo: 'avviso-badge', durata: 4200 });
  }
  presenta(intro, nomeCreatura, livello) {
    const e = this.el.intro;
    if (!intro) { e.hidden = true; return; }
    e.innerHTML = `<p class="intro-chi">${esc(nomeCreatura)} ti presenta «${esc(livello.nome)}»</p><h2>${esc(intro.titolo)}</h2><div class="intro-testo">${intro.testo}</div>${intro.fig ? `<div class="intro-fig">${intro.fig}</div>` : ''}<button type="button" class="btn btn-primario" id="intro-ok">Ho capito, si vola</button>`;
    e.hidden = false;
    tipografa(e);
    $('#intro-ok', e).addEventListener('click', () => { e.hidden = true; this.az.focusTela(); });
    $('#intro-ok', e).focus({ preventScroll: true });
  }
  nascondiPresentazione() { this.el.intro.hidden = true; }

  joystick(attivo, x0, y0, x, y) {
    const j = this.el.joy;
    j.hidden = !attivo;
    if (!attivo) return;
    j.style.transform = `translate(${x0}px, ${y0}px)`;
    j.firstElementChild.style.transform = `translate(${x - x0}px, ${y - y0}px)`;
  }

  // ---------------------------------------------------------------- schermate
  caricamento(si, testo = 'Preparo la costellazione…') {
    this.el.caricamento.hidden = !si;
    this.el.caricamento.querySelector('p').textContent = testo;
  }

  avvio(stato, quest) {
    const e = this.el.avvio;
    const prossimo = LIVELLI.findIndex((l, i) => sbloccato(stato, quest, i).si && !stato.livelli[l.id]?.completo);
    const iProssimo = prossimo < 0 ? 0 : prossimo;
    $('#sigla', e).textContent = stato.sigla;
    $('#btn-vola', e).innerHTML = `Vola: <span>${esc(LIVELLI[iProssimo].nome)}</span>`;
    $('#btn-vola', e).dataset.livello = iProssimo;
    const q = $('#quest-legame', e);
    if (quest.presente) {
      const n = Object.values(quest.attivita).filter((a) => a.stelle >= 1).length;
      q.innerHTML = `<strong>Collegato alla Quest</strong> di questo dispositivo${quest.classe ? ` · classe ${quest.classe}ª` : ''}: ${n} ${n === 1 ? 'attività allenata' : 'attività allenate'}. Le stelle già conquistate nella Quest brillano d'oro e danno più energia; gli argomenti allenati sbloccano le costellazioni.`;
    } else {
      q.innerHTML = 'Se usi anche la <a href="/allenamento/">Quest</a> su questo dispositivo, AstroMath legge i tuoi progressi (solo qui, nel browser) e le stelle che hai già conquistato brillano d\'oro.';
    }
    const mappa = $('#mappa-livelli', e);
    mappa.innerHTML = '';
    LIVELLI.forEach((l, i) => {
      const sb = sbloccato(stato, quest, i);
      const st = statoLivello(stato, l.id);
      const max = st.massimo || 0;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `livello ${st.completo ? 'completo' : ''} ${sb.si ? '' : 'chiuso'}`;
      b.style.setProperty('--h', l.tinta);
      b.disabled = !sb.si;
      b.innerHTML = `<span class="liv-num">${i + 1}</span><span class="liv-nome">${esc(l.nome)}</span><span class="liv-sotto">${esc(l.sottotitolo)}</span>
        <span class="liv-stato">${sb.si ? `${'★'.repeat(st.completo ? STELLE_PER_LIVELLO : max)}${'☆'.repeat(st.completo ? 0 : STELLE_PER_LIVELLO - max)}${st.record ? ` · record ${st.record}` : ''}${sb.perQuest && !st.completo ? ' · aperta dalla Quest' : ''}` : 'Si apre completando la costellazione prima, o allenandone gli argomenti nella Quest'}</span>`;
      b.setAttribute('aria-label', `${i + 1}. ${l.nome}: ${sb.si ? (st.completo ? 'completata' : 'da esplorare') : 'chiusa'}`);
      b.addEventListener('click', () => this.az.avvia(i));
      mappa.appendChild(b);
    });
    const bd = $('#badge-griglia', e);
    const presi = BADGE.filter((x) => stato.badge[x.id]).length;
    $('#badge-conteggio', e).textContent = `${presi} su ${BADGE.length}`;
    bd.innerHTML = BADGE.map((x) => `<li class="badge ${stato.badge[x.id] ? 'preso' : ''}" style="--h:${x.tinta}" title="${esc(x.desc)}"><span class="badge-glifo">${esc(x.glifo)}</span><span class="badge-nome">${esc(x.nome)}</span><span class="badge-desc">${esc(x.desc)}</span></li>`).join('');
    const cl = $('#classifica', e);
    cl.innerHTML = stato.classifica.length
      ? stato.classifica.slice(0, 5).map((r) => `<li><span>${esc(r.sigla)}</span><span>${esc(LIVELLI.find((l) => l.id === r.livello)?.nome || '')}</span><strong>${r.punti}</strong></li>`).join('')
      : '<li class="vuota">Ancora nessun volo completato su questo dispositivo.</li>';
    e.hidden = false;
  }
  nascondiAvvio() { this.el.avvio.hidden = true; }

  fine(dati) {
    const e = this.el.fine;
    $('#fine-titolo', e).textContent = `Costellazione «${dati.livello.nome}» completa`;
    $('#fine-punti', e).textContent = dati.punti;
    $('#fine-primo', e).textContent = `${dati.primoColpo}/${STELLE_PER_LIVELLO}`;
    $('#fine-amente', e).textContent = dati.amente;
    $('#fine-badge', e).innerHTML = dati.nuovi.length ? dati.nuovi.map((b) => `<li class="badge preso" style="--h:${b.tinta}"><span class="badge-glifo">${esc(b.glifo)}</span><span class="badge-nome">${esc(b.nome)}</span></li>`).join('') : '';
    $('#fine-badge-blocco', e).hidden = !dati.nuovi.length;
    $('#fine-ripasso', e).innerHTML = dati.ripasso.map((r) => `<li><a href="/allenamento/#/lezione/${encodeURIComponent(r.id)}/${r.livello}">${esc(r.titolo)} · livello ${r.livello}</a>${r.errori ? ` <span class="ripasso-nota">(${r.errori === 1 ? 'un errore' : `${r.errori} errori`} in volo)</span>` : ''}</li>`).join('');
    $('#btn-prossimo', e).hidden = !dati.prossimo;
    if (dati.prossimo) $('#btn-prossimo', e).innerHTML = `Prossima costellazione: <span>${esc(dati.prossimo.nome)}</span>`;
    e.hidden = false;
    $('#btn-prossimo', e).hidden ? $('#btn-rigioca', e).focus() : $('#btn-prossimo', e).focus();
  }
  nascondiFine() { this.el.fine.hidden = true; }

  pausa(si) { this.el.pausa.hidden = !si; if (si) $('#btn-riprendi').focus(); }
}

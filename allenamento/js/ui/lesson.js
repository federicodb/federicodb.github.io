// Esecuzione di una lezione (o di un ripasso, o di una simulazione INVALSI).
// Uno step alla volta: figura, domanda, verifica, aiuto, spiegazione; dopo un errore arriva un gemello.
// In modalità "esame" non ci sono feedback né gemelli: il resoconto arriva alla fine, per ambito.

import { checkNumber, checkExpr, checkNumbers } from '../engine/check.js';
import { parse, toTex, variables } from '../engine/expr.js';
import { normalizeCommon, normalizeNumber } from '../engine/normalize.js';
import { XP, comboMultiplier } from '../game/game.js';
import { html, tex, renderMath, fitMath, icons, esc, ask } from './dom.js';
import { chart, board } from '../gfx/libs.js';
import { attachKeypad } from './keypad.js';
import { toggleCalculator, closeCalculator, calcEval, fmtIt } from './calculator.js';
import { sfx, haptic, flyText } from './fx.js';
import { INTERACTIVE } from './interact.js';

const TEST = typeof location !== 'undefined' && new URLSearchParams(location.search).has('test');
const PRAISE = ['Esatto!', 'Giusto!', 'Perfetto!', 'Ben fatto!', 'Proprio così!', 'Grande!', 'Sì!'];
const COMBO_PRAISE = { 3: 'Tris!', 5: 'Inarrestabile!', 8: 'In fiamme!', 10: 'Leggendario!' };

/** Schermo piccolo o basso: i pannelli che coprirebbero la domanda restano chiusi o si spostano nella scheda */
const compact = () => matchMedia('(max-width: 699px), (max-height: 620px)').matches;

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Figure, grafici Chart.js e lavagne JSXGraph di uno step */
export function renderVisuals(box, step, { after = false } = {}) {
  const wantFig = after ? step.figAfter : !step.figAfter;
  const wantChart = after ? step.chartAfter : !step.chartAfter;
  if (step.board && !after) {
    const el = document.createElement('div');
    box.appendChild(el);
    board(el, step.board).then((b) => {
      if (!b && step.fig) { el.innerHTML = step.fig; renderMath(el); }
    });
  }
  if (step.chart && wantChart) {
    const el = document.createElement('div');
    box.appendChild(el);
    chart(el, step.chart).then((c) => {
      if (!c && step.fig && step.figFallbackOnly) { el.innerHTML = step.fig; renderMath(el); }
    });
  }
  if (step.fig && wantFig && !((step.board && !after) || (step.chart && step.figFallbackOnly))) {
    const el = document.createElement('div');
    el.className = 'figure';
    el.innerHTML = step.fig;
    renderMath(el);
    box.appendChild(el);
  }
}

export function runLesson(root, ctx, opts) {
  const queue = opts.steps.slice();
  const exam = !!opts.exam;
  // log: un elemento per domanda valutata (tipo, al primo colpo?), per il radar di fine lezione
  // bets: scommesse "Sono sicuro" vinte e perse; learned: i titoli delle schede "scopri" (per la carta)
  const res = { graded: 0, firstTry: 0, xp: 0, bestCombo: 0, twins: 0, twinsOffered: 0, perStep: [], misses: [], answers: [], log: [], bets: { right: 0, wrong: 0 }, learned: [] };
  let i = 0;
  let combo = 0;
  let cleanupStep = () => {};
  let primary = null;

  document.body.classList.add('in-lesson');
  root.innerHTML = `
    <div class="lesson" style="--hue:${opts.hue}">
      <div class="lesson-top">
        <button type="button" class="icon-btn" data-exit aria-label="Esci">${icons.close}</button>
        <div class="progress" role="progressbar" aria-label="Avanzamento" aria-valuemin="0" aria-valuemax="100"><i style="width:0"></i></div>
        ${exam ? '<span class="num" data-count></span>' : `<span class="combo" data-combo aria-live="polite"></span>`}
        ${opts.calc ? `<button type="button" class="icon-btn" data-calc-btn aria-pressed="false" aria-label="Calcolatrice" title="Calcolatrice">${icons.calc}</button>` : ''}
      </div>
      <section class="card" data-card></section>
    </div>`;
  const card = root.querySelector('[data-card]');
  const prog = root.querySelector('.progress');
  const comboEl = root.querySelector('[data-combo]');
  const countEl = root.querySelector('[data-count]');
  const bar = document.createElement('div');
  bar.className = 'actionbar';
  bar.style.setProperty('--hue', opts.hue);
  document.body.appendChild(bar);

  // calcolatrice usata nella domanda in corso: senza, la risposta scritta vale ×1,2 ("a mente")
  let calcUsed = false;
  root.querySelector('[data-calc-btn]')?.addEventListener('click', () => { calcUsed = true; toggleCalculator(() => card.querySelector('input.answer:not(:disabled)')); });
  const cleanup = () => {
    closeCalculator();
    cleanupStep();
    bar.remove();
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('in-lesson');
  };
  root.querySelector('[data-exit]').addEventListener('click', async () => {
    if (i === 0 || (await ask(exam ? 'Vuoi abbandonare la simulazione? Le risposte date finora non verranno valutate.' : 'Vuoi uscire? Gli XP guadagnati restano, ma la lezione non risulterà completata.', 'Esci', 'Continua'))) {
      cleanup();
      opts.onExit();
    }
  });

  function onKey(ev) {
    if (document.querySelector('.modal')) return;
    if (ev.key === 'Enter' && primary && !ev.shiftKey) {
      const a = document.activeElement;
      if (a?.tagName === 'BUTTON' && !a.closest('.actionbar') && !a.classList.contains('k')) return;
      ev.preventDefault();
      primary();
    }
  }
  document.addEventListener('keydown', onKey);

  function drawProgress() {
    const pct = Math.round((i / queue.length) * 100);
    prog.firstElementChild.style.width = pct + '%';
    prog.setAttribute('aria-valuenow', pct);
    if (countEl) countEl.textContent = `${Math.min(i + 1, queue.length)}/${queue.length}`;
    if (comboEl) {
      if (combo >= 2) {
        comboEl.innerHTML = `${icons.flame}<span>${combo}</span>${comboMultiplier(combo) > 1 ? `<small>×${String(comboMultiplier(combo)).replace('.', ',')}</small>` : ''}`;
        comboEl.title = `${combo} risposte giuste di fila al primo colpo`;
      } else comboEl.innerHTML = '';
    }
  }

  function setBar(kind, inner, actions) {
    bar.className = 'actionbar' + (kind ? ' ' + kind : '');
    bar.innerHTML = `<div class="inner"><div class="feedback" aria-live="polite">${inner || ''}</div><div class="actions"></div></div>`;
    renderMath(bar);
    const box = bar.querySelector('.actions');
    primary = null;
    let primaryBtn = null;
    for (const a of actions) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = a.primary ? 'btn big' + (a.kind ? ' ' + a.kind : '') : 'btn-ghost' + (a.cls ? ' ' + a.cls : '');
      b.textContent = a.label;
      if (a.pressed != null) b.setAttribute('aria-pressed', String(a.pressed));
      if (a.title) b.title = a.title;
      if (a.disabled) b.disabled = true;
      b.addEventListener('click', a.run);
      if (a.primary) {
        primary = () => !b.disabled && a.run();
        primaryBtn = b;
        a.ref?.(b);
      }
      box.appendChild(b);
    }
    return { primaryBtn, feedback: bar.querySelector('.feedback') };
  }

  function next() {
    cleanupStep();
    cleanupStep = () => {};
    i++;
    if (i >= queue.length) {
      cleanup();
      opts.onFinish(res);
    } else show();
  }

  function show() {
    drawProgress();
    const step = queue[i];
    const kicker = step._isTwin
      ? `<p class="kicker twin">${icons.repeat.replace('<svg', '<svg width="18" height="18"')} Problema gemello: stessi passaggi, numeri nuovi</p>`
      : step._kicker || step.ambito
        ? `<p class="kicker">${step._kicker ? `<span>${esc(step._kicker)}</span>` : ''}${step.ambito ? `<span class="badge-tag">${esc(step.ambito)}</span>` : ''}${step.dimensione ? `<span class="badge-tag">${esc(step.dimensione)}</span>` : ''}</p>`
        : '';
    card.classList.remove('shake');
    window.scrollTo({ top: 0 });

    if (step.type === 'learn') {
      if (step.title) res.learned.push(step.title);
      card.innerHTML = `${kicker}<h2>${esc(step.title || '')}</h2><div class="prompt" data-body></div><div data-vis></div><div class="widget" data-w></div>`;
      html(card.querySelector('[data-body]'), step.body);
      renderVisuals(card.querySelector('[data-vis]'), step);
      if (step.widget) step.widget(card.querySelector('[data-w]'), widgetApi(() => {}));
      setBar('', '', [{ label: 'Continua', primary: true, run: () => { sfx.tap(); next(); } }]);
      return;
    }

    card.innerHTML = `${kicker}<div class="prompt" data-prompt></div><div data-vis></div><div data-input></div><div data-hint></div>`;
    html(card.querySelector('[data-prompt]'), step.prompt);
    renderVisuals(card.querySelector('[data-vis]'), step);
    if (TEST) window.__step = step;
    const inputBox = card.querySelector('[data-input]');
    let checkBtn;
    const setReady = (ok) => { if (checkBtn) checkBtn.disabled = !ok; };
    const ctl = RENDER[step.type](inputBox, step, setReady);
    if (TEST) window.__solve = ctl.solve || null;
    cleanupStep = ctl.cleanup || (() => {});
    let attempts = 0;
    let hintShown = false;
    let betOn = false; // "Sono sicuro": si può scommettere solo al primo tentativo
    calcUsed = !!document.querySelector('.calc:not(.closing)'); // se è già aperta, la domanda parte "con calcolatrice"

    const showHint = () => {
      if (hintShown || !step.hint) return;
      hintShown = true;
      const hb = card.querySelector('[data-hint]');
      hb.className = 'hint-box';
      html(hb, '<b>Aiuto.</b> ' + step.hint);
    };
    const canBet = !exam && !step._isTwin;
    const neutralBar = () =>
      setBar('', '', [
        ...(!exam && step.hint && !hintShown ? [{ label: 'Aiuto', run: () => { showHint(); neutralBar(); } }] : []),
        ...(canBet && attempts === 0 ? [{ label: 'Sono sicuro ×2', cls: 'bet', pressed: betOn, title: 'Se sei sicuro e hai ragione, il moltiplicatore raddoppia', run: () => { betOn = !betOn; sfx.tap(); neutralBar(); } }] : []),
        { label: exam ? 'Conferma' : 'Verifica', primary: true, disabled: !ctl.ready(), run: verify, ref: (b) => (checkBtn = b) },
      ]);

    function verify() {
      const r = ctl.check();
      if (r.invalid || r.equivalent) {
        ctl.say?.(r.message, !!r.equivalent);
        haptic(20);
        return;
      }
      attempts++;
      if (exam) {
        res.answers.push({ ambito: step.ambito || 'Altro', ok: !!r.ok, prompt: step.prompt, explain: step.explain });
        res.graded++;
        if (r.ok) res.firstTry++;
        sfx.tap();
        next();
        return;
      }
      const graded = !step._isTwin;
      const binary = (step.type === 'choice' && step.options.length <= 2) || step.type === 'truefalse';
      const bet = betOn && attempts === 1;
      if (r.ok) {
        const first = attempts === 1;
        // punteggio alla Balatro: fiches (valore della domanda) × moltiplicatore (combo, scommessa, stima perfetta)
        let chips;
        let mult = 1;
        if (step._isTwin) { chips = XP.twin; res.twins++; }
        else if (first) { combo++; chips = XP.firstTry; mult = comboMultiplier(combo); }
        else chips = XP.secondTry;
        if (bet) { mult *= 2; res.bets.right++; }
        if (r.precise) mult *= 1.5;
        // a mente: domanda con risposta scritta, calcolatrice disponibile ma non aperta
        const mental = !!opts.calc && ['number', 'numbers', 'expr'].includes(step.type) && !calcUsed;
        if (mental) { mult *= 1.2; res.mental = (res.mental || 0) + 1; }
        if (opts.calc && ['number', 'numbers', 'expr'].includes(step.type)) res.mentalOf = (res.mentalOf || 0) + 1;
        res.bestCombo = Math.max(res.bestCombo, combo);
        const got = ctx.addXp(chips * mult, { combo });
        res.xp += got;
        if (graded) {
          res.graded++;
          if (first) res.firstTry++;
          res.perStep.push({ act: step._act, first });
          res.log.push({ type: step.type, first });
        }
        if (!first) queueTwin(step);
        ctl.lock(true);
        sfx.good(Math.min(combo, 10));
        haptic([10, 30, 10]);
        flyText(checkBtn || bar, `+${got} XP`);
        if (comboEl && combo >= 2) { comboEl.classList.remove('hot'); void comboEl.offsetWidth; comboEl.classList.add('hot'); }
        const praise = bet ? 'Fiducia ben riposta!' : r.precise ? 'Stima perfetta!' : COMBO_PRAISE[combo] || (mental && Math.random() < 0.35 ? 'Tutto a mente!' : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
        const score = mult !== 1 ? `${chips} × ${String(Math.round(mult * 100) / 100).replace('.', ',')} = +${got} XP` : `+${got} XP`;
        const { feedback } = setBar(
          'good',
          `<h3>${ctx.mood ? ctx.mood(combo >= 3 ? 'great' : 'good') : icons.check.replace('<svg', '<svg width="26" height="26"')} ${praise} <span class="xp-chip">${score}</span>${mental ? '<span class="mental-tag" title="Risposta senza calcolatrice: ×1,2">a mente</span>' : ''}</h3>${r.message ? `<p>${r.message}</p>` : ''}
           ${step.explain ? `<details><summary>Rivedi il ragionamento</summary><div>${step.explain}</div><div data-after></div></details>` : ''}`,
          [{ label: 'Continua', primary: true, kind: 'good', run: next }],
        );
        afterVisuals(feedback, step);
        drawProgress();
        return;
      }
      combo = 0;
      if (bet) res.bets.wrong++;
      drawProgress();
      sfx.bad();
      haptic([40, 40, 40]);
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      if (attempts === 1 && !binary) {
        ctl.markWrong(r);
        setBar('bad', `<h3>${ctx.mood ? ctx.mood('think') : ''}Non ancora</h3>${bet ? '<p><b>Eri sicuro: rileggi il tuo ragionamento, passo per passo. Dove cede?</b></p>' : ''}<p>${r.message || 'Rileggi il testo e controlla i calcoli.'}</p>`, [
          ...(step.hint && !hintShown ? [{ label: 'Aiuto', run: () => { showHint(); retry(); } }] : []),
          { label: 'Riprova', primary: true, kind: 'bad', run: retry },
        ]);
        return;
      }
      ctl.markWrong(r);
      ctl.reveal?.();
      ctl.lock(false);
      if (graded) {
        res.graded++;
        res.perStep.push({ act: step._act, first: false });
        res.log.push({ type: step.type, first: false });
        res.misses.push({ prompt: step.prompt, explain: step.explain });
      }
      const twinQueued = queueTwin(step);
      const twinNote = twinQueued ? '<p class="muted">Subito dopo trovi un problema gemello per rimetterti in pari: vale XP extra.</p>' : '';
      if (compact()) {
        // telefono: la spiegazione va nella scheda (si scorre), la barra in basso resta piccola
        const ex = document.createElement('div');
        ex.className = 'explain-card';
        ex.innerHTML = `<h3>Ecco come si fa</h3>${r.message ? `<p>${r.message}</p>` : ''}<div>${step.explain || ''}</div><div data-after></div>${twinNote}`;
        card.appendChild(ex);
        renderMath(ex);
        afterVisuals(ex, step);
        setBar('bad', '<h3>Non è giusto</h3><p class="muted">La soluzione spiegata è qui sopra.</p>', [{ label: 'Ho capito', primary: true, kind: 'bad', run: next }]);
        setTimeout(() => ex.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      } else {
        const { feedback } = setBar(
          'bad',
          `<h3>Ecco come si fa</h3>${r.message ? `<p>${r.message}</p>` : ''}<div>${step.explain || ''}</div><div data-after></div>${twinNote}`,
          [{ label: 'Ho capito', primary: true, kind: 'bad', run: next }],
        );
        afterVisuals(feedback, step);
      }
    }

    function retry() {
      ctl.retry();
      neutralBar();
      ctl.focus?.();
    }
    neutralBar();
    ctl.focus?.();
  }

  function afterVisuals(feedback, step) {
    const slot = feedback.querySelector('[data-after]');
    if (!slot) return;
    if (step.explainFig) {
      const d = document.createElement('div');
      d.className = 'figure';
      d.innerHTML = step.explainFig;
      slot.appendChild(d);
    }
    renderVisuals(slot, step, { after: true });
  }

  function queueTwin(step) {
    if (exam || step._isTwin || !step.twin) return false;
    const t = step.twin();
    Object.assign(t, { _isTwin: true, _act: step._act, _kicker: step._kicker });
    res.twinsOffered++;
    queue.splice(i + 1, 0, t);
    drawProgress();
    return true;
  }

  function widgetApi(onReady) {
    return { tex: (el, latex) => tex(el, latex), html: (el, s) => html(el, s), renderMath, setReady: onReady };
  }

  // ---------- un renderer per tipo di domanda ----------
  const RENDER = {
    ...INTERACTIVE,
    choice(box, step, setReady) {
      const opts = shuffle(step.options); // la posizione della risposta giusta cambia sempre
      const figs = opts.some((o) => o.label.includes('opt-fig'));
      box.innerHTML = `<div class="options${figs ? ' figs' : ''}" role="group"></div>`;
      const wrap = box.firstChild;
      let sel = null;
      let wrong = null; // l'opzione sbagliata appena verificata: la si esclude al "Riprova", anche se nel frattempo se n'è toccata un'altra
      const btns = opts.map((o, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'option';
        b.setAttribute('aria-pressed', 'false');
        b.innerHTML = `<span class="key">${k + 1}</span><span class="lbl"></span>`;
        html(b.querySelector('.lbl'), o.label);
        if (TEST && o.correct) b.dataset.correct = '1';
        b.addEventListener('click', () => {
          sel = k;
          sfx.tap();
          btns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === k)));
          setReady(true);
        });
        wrap.appendChild(b);
        return b;
      });
      const keyPick = (ev) => {
        const n = +ev.key;
        if (n >= 1 && n <= btns.length && !btns[n - 1].disabled && !ev.target.closest?.('input')) btns[n - 1].click();
      };
      document.addEventListener('keydown', keyPick);
      return {
        ready: () => sel !== null,
        check: () => (opts[sel].correct ? { ok: true } : { ok: false, message: opts[sel].why }),
        markWrong: () => { wrong = sel; btns[sel]?.classList.add('wrong'); },
        reveal: () => btns[opts.findIndex((o) => o.correct)].classList.add('right'),
        retry: () => {
          if (wrong !== null) { btns[wrong].disabled = true; btns[wrong].setAttribute('aria-pressed', 'false'); }
          // se dopo l'errore è già stata scelta un'altra opzione, resta selezionata
          if (sel === wrong) sel = null;
          wrong = null;
          setReady(sel !== null);
        },
        lock: (ok) => { btns.forEach((b) => (b.disabled = true)); if (ok) btns[sel].classList.add('right'); },
        focus: () => {},
        cleanup: () => document.removeEventListener('keydown', keyPick),
      };
    },

    truefalse(box, step, setReady) {
      const sts = step.statements;
      const picks = sts.map(() => null);
      box.innerHTML = '<div class="tf"></div>';
      const rows = sts.map((s, k) => {
        const row = document.createElement('div');
        row.className = 'tf-row';
        row.innerHTML = `<div class="tf-text"></div><div class="tf-btns" role="group" aria-label="Vero o falso"><button type="button" data-v="1">V</button><button type="button" data-v="0">F</button></div>`;
        html(row.querySelector('.tf-text'), s.text);
        row.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-label', b.dataset.v === '1' ? 'Vero' : 'Falso');
          if (TEST && (b.dataset.v === '1') === s.value) b.dataset.correct = '1';
          b.addEventListener('click', () => {
            picks[k] = b.dataset.v === '1';
            sfx.tap();
            row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            setReady(picks.every((p) => p !== null));
          });
        });
        box.firstChild.appendChild(row);
        return row;
      });
      return {
        ready: () => picks.every((p) => p !== null),
        check: () => {
          const wrong = sts.filter((s, k) => s.value !== picks[k]).length;
          return wrong ? { ok: false, message: `${wrong === 1 ? 'Una risposta è sbagliata' : `${wrong} risposte sono sbagliate`}: in rosso le affermazioni da rivedere.` } : { ok: true };
        },
        markWrong: () => rows.forEach((r, k) => r.classList.toggle('wrong', sts[k].value !== picks[k])),
        reveal: () => rows.forEach((r, k) => { r.classList.remove('wrong'); r.classList.add(sts[k].value === picks[k] ? 'right' : 'wrong'); r.querySelector('.tf-text').insertAdjacentHTML('beforeend', ` <b>(${sts[k].value ? 'vera' : 'falsa'})</b>`); }),
        retry: () => {},
        lock: (ok) => { box.querySelectorAll('button').forEach((b) => (b.disabled = true)); if (ok) rows.forEach((r) => r.classList.add('right')); },
      };
    },

    number(box, step, setReady) {
      return freeInput(box, step, setReady, (v) => checkNumber(v, step), { list: false, letters: [] });
    },
    numbers(box, step, setReady) {
      return freeInput(box, step, setReady, (v) => checkNumbers(v, step), { list: true, letters: [] });
    },
    expr(box, step, setReady) {
      const letters = step.vars || [...variables(parse(step.answer))].sort();
      return freeInput(box, step, setReady, (v) => checkExpr(v, step), { list: false, letters });
    },

    order(box, step, setReady) {
      const correct = step.items;
      let pool = shuffle(correct.map((t, k) => ({ t, k })));
      if (pool.every((p, j) => p.k === j)) pool.reverse();
      let built = [];
      let locked = false;
      box.innerHTML = `<p class="order-label">La tua sequenza</p><div class="order-built" data-built></div><p class="order-label">Tocca i passaggi nell'ordine giusto</p><div class="order-pool" data-pool></div>`;
      const bEl = box.querySelector('[data-built]');
      const pEl = box.querySelector('[data-pool]');
      const draw = () => {
        bEl.innerHTML = '';
        pEl.innerHTML = '';
        const mk = (item, from) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'order-chip';
          b.disabled = locked;
          const span = document.createElement('span');
          tex(span, item.t);
          b.appendChild(span);
          b.setAttribute('aria-label', (from === 'pool' ? 'Aggiungi: ' : 'Togli: ') + item.t);
          b.addEventListener('click', () => {
            sfx.tap();
            if (from === 'pool') { pool = pool.filter((x) => x !== item); built.push(item); }
            else { built = built.filter((x) => x !== item); pool.push(item); }
            draw();
            setReady(pool.length === 0);
          });
          return b;
        };
        built.forEach((it) => bEl.appendChild(mk(it, 'built')));
        pool.forEach((it) => pEl.appendChild(mk(it, 'pool')));
        requestAnimationFrame(() => fitMath(box)); // a schermo: i passaggi lunghi si adattano al tassello
      };
      draw();
      return {
        ready: () => pool.length === 0,
        check: () => {
          if (built.every((it, j) => it.k === j)) return { ok: true };
          const firstBad = built.findIndex((it, j) => it.k !== j);
          return { ok: false, message: firstBad === 0 ? 'Già il primo passaggio non è quello giusto.' : `I primi ${firstBad} passaggi sono in ordine; dal passaggio ${firstBad + 1} qualcosa non torna.` };
        },
        markWrong: () => {},
        reveal: () => { built = correct.map((t, k) => ({ t, k })); pool = []; locked = true; draw(); },
        retry: () => {
          const keep = [];
          for (const [j, it] of built.entries()) { if (it.k === j) keep.push(it); else break; }
          pool = shuffle(pool.concat(built.slice(keep.length)));
          built = keep;
          draw();
          setReady(false);
        },
        lock: () => { locked = true; draw(); },
      };
    },

    widget(box, step, setReady) {
      box.className = 'widget';
      let ready = true;
      const api = widgetApi((ok) => { ready = !!ok; setReady(ready); });
      const w = step.widget(box, api) || {};
      return {
        ready: () => ready,
        check: () => (w.check ? w.check() : { ok: true }),
        markWrong: () => {},
        retry: () => {},
        lock: () => box.querySelectorAll('button, input').forEach((b) => (b.disabled = true)),
      };
    },
  };

  function freeInput(box, step, setReady, checker, padOpts) {
    const isNum = step.type !== 'expr';
    box.innerHTML = `
      <div class="answer-row">
        <input class="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"
          aria-label="Risposta" placeholder="${esc(step.placeholder || (step.type === 'numbers' ? (step.ordered ? '(x; y)' : 'es. 2; -3') : 'La tua risposta'))}">
        ${step.unit ? `<span class="unit">${esc(step.unit)}</span>` : ''}
      </div>
      <div class="preview" data-preview aria-live="polite"></div>`;
    const input = box.querySelector('input');
    input.dataset.mode = isNum ? 'decimal' : 'text';
    input.setAttribute('inputmode', input.dataset.mode);
    const preview = box.querySelector('[data-preview]');
    attachKeypad(box, input, padOpts);
    input.addEventListener('input', () => {
      input.classList.remove('wrong');
      setReady(input.value.trim() !== '');
      const raw = input.value.trim();
      if (!raw || step.type === 'numbers') { preview.textContent = ''; return; }
      // anteprima: lo studente vede come è stata letta la sua scrittura
      try {
        const t = parse(isNum ? normalizeNumber(raw) : normalizeCommon(raw));
        preview.innerHTML = '<span>Leggo: </span><span data-t></span><span data-v></span>';
        tex(preview.querySelector('[data-t]'), toTex(t));
        // un calcolo impostato: si mostra anche quanto fa
        if (isNum && t.k !== 'num' && !(t.k === 'neg' && t.a.k === 'num')) {
          try { const v = calcEval(raw); if (Number.isFinite(v)) preview.querySelector('[data-v]').textContent = ` = ${fmtIt(v)}`; } catch { /* solo la lettura */ }
        }
      } catch {
        preview.textContent = '';
      }
    });
    return {
      ready: () => input.value.trim() !== '',
      check: () => checker(input.value),
      say: (msg, soft) => { html(preview, `<span class="${soft ? '' : 'warn'}">${msg}</span>`); },
      markWrong: () => input.classList.add('wrong'),
      reveal: () => {},
      retry: () => { try { input.select(); } catch { /* ok */ } },
      lock: (ok) => { input.disabled = true; if (ok) input.classList.add('right'); box.querySelectorAll('.k').forEach((b) => (b.disabled = true)); box.querySelector('.keypad2')?.classList.add('collapsed'); },
      focus: () => { if (matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true }); },
    };
  }

  show();
  return cleanup;
}

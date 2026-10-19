// Sfide: sfida lampo a tempo, enigma del giorno, ripasso, simulazione INVALSI.
import * as G from '../game/game.js';
import { byId } from '../../activities/catalogo.js';
import { invalsi10, invalsi13 } from '../../activities/invalsi/invalsi.js';
import { lampoItem } from '../../activities/sfide/lampo.js';
import { puzzleOfDay } from '../../activities/sfide/enigma.js';
import { createRng } from '../engine/rng.js';
import { checkNumber } from '../engine/check.js';
import { runLesson } from '../ui/lesson.js';
import { attachKeypad } from '../ui/keypad.js';
import { icons, esc, html, renderMath, tex, copyText, toast } from '../ui/dom.js';
import { sfx, haptic, confetti, flyText } from '../ui/fx.js';

export function viewChallenges(app) {
  const s = app.state;
  const d = app.today();
  const due = G.dueReviews(s, d).filter((id) => byId[id]);
  const pz = puzzleOfDay(d);
  const solved = s.puzzle.day === d && s.puzzle.solved;
  app.main.innerHTML = `
    <h1>Sfide</h1>
    <p class="muted">Ogni giorno qualcosa di nuovo. I numeri cambiano sempre, l'enigma del giorno è uguale per tutta la classe.</p>
    <div class="challenge-grid">
      <section class="challenge paper" style="--hue:45">
        <span class="icon">${icons.bolt}</span>
        <h2>Sfida lampo</h2>
        <p class="muted">60 secondi, calcolo a mente. Ogni risposta giusta allunga la combo e la difficoltà sale.</p>
        <p>Il tuo record: <b class="num">${s.speed.best}</b></p>
        <a class="btn big" href="#/lampo">Gioca</a>
      </section>
      <section class="challenge paper" style="--hue:280">
        <span class="icon">${icons.puzzle}</span>
        <h2>Enigma del giorno</h2>
        <p class="muted">${esc(pz.title)}. Tre tentativi, un aiuto.${s.puzzle.streak > 1 ? ` Serie di enigmi: ${s.puzzle.streak}.` : ''}</p>
        <p>${solved ? '<b style="color:var(--good)">Risolto oggi</b>' : s.puzzle.day === d ? `Tentativi usati: ${s.puzzle.attempts} di 3` : 'Nuovo enigma disponibile'}</p>
        <a class="btn big" href="#/enigma">${solved ? 'Rivedi' : 'Risolvi'}</a>
      </section>
      <section class="challenge paper" style="--hue:160">
        <span class="icon">${icons.repeat}</span>
        <h2>Ripasso</h2>
        <p class="muted">${due.length ? `Oggi tocca a: ${due.slice(0, 3).map((id) => esc(byId[id].title)).join(', ')}.` : Object.keys(s.activities).length ? 'Niente in scadenza: fai un allenamento libero sulle attività meno solide.' : 'Dopo le prime lezioni qui arrivano i ripassi, a intervalli sempre più lunghi.'}</p>
        <a class="btn big" href="#/ripasso" ${Object.keys(s.activities).length ? '' : 'aria-disabled="true" style="pointer-events:none;opacity:.5"'}>${due.length ? 'Ripassa' : 'Allenati'}</a>
      </section>
      <section class="challenge paper" style="--hue:48">
        <span class="icon">${icons.clipboard}</span>
        <h2>Simulazione INVALSI</h2>
        <p class="muted">Quesiti originali nello stile della prova, a tempo, senza correzione fino alla fine. Resoconto per ambito.</p>
        <p>Migliori: seconda <b class="num">${s.invalsi.best10 ?? '–'}${s.invalsi.best10 != null ? '%' : ''}</b>, quinta <b class="num">${s.invalsi.best13 ?? '–'}${s.invalsi.best13 != null ? '%' : ''}</b></p>
        <div class="row"><a class="btn" href="#/simulazione/10">Seconda</a><a class="btn-ghost" href="#/simulazione/13">Quinta</a></div>
      </section>
    </div>`;
}

// ------------------------------------------------------------------ Sfida lampo
export function startLampo(app) {
  const s = app.state;
  const rng = createRng();
  const year = s.profile.year || 1;
  const DURATION = 60;
  let score = 0, streak = 0, best = s.speed.best, left = DURATION, answered = 0;
  let item = null;
  let timerId = null;
  document.body.classList.add('in-lesson');
  app.main.innerHTML = `
    <div class="lesson" style="--hue:45">
      <div class="hud">
        <button class="icon-btn" data-exit aria-label="Esci">${icons.close}</button>
        <div class="timer" style="--p:1" role="timer" aria-label="Tempo"><i></i></div>
        <span class="score-big" data-score aria-live="polite">0</span>
      </div>
      <p class="ghost" data-ghost>Record da battere: ${best}</p>
      <section class="card paper">
        <div class="lampo-q" data-q aria-live="polite"></div>
        <div class="answer-row"><input class="answer" data-in type="text" autocomplete="off" aria-label="Risposta" placeholder="?"><button class="btn big" data-ok>OK</button></div>
        <div data-pad></div>
        <p class="preview" data-msg></p>
      </section>
    </div>`;
  const qEl = app.main.querySelector('[data-q]');
  const input = app.main.querySelector('[data-in]');
  const msg = app.main.querySelector('[data-msg]');
  const scoreEl = app.main.querySelector('[data-score]');
  const timer = app.main.querySelector('.timer');
  attachKeypad(app.main.querySelector('[data-pad]'), input, { sys: false });
  const stop = () => { clearInterval(timerId); document.body.classList.remove('in-lesson'); document.removeEventListener('keydown', onKey); };
  app.stopLesson = stop;
  app.main.querySelector('[data-exit]').addEventListener('click', () => { stop(); location.hash = '#/sfide'; });
  const nextQ = () => {
    item = lampoItem(rng, year, streak);
    html(qEl, item.prompt);
    input.value = '';
    if (matchMedia('(pointer: fine)').matches) input.focus();
  };
  const submit = () => {
    if (!input.value.trim() || left <= 0) return;
    const r = checkNumber(input.value, { answer: item.answer, decimals: item.decimals });
    if (r.invalid) { msg.textContent = r.message; return; }
    answered++;
    if (r.ok) {
      streak++;
      const pts = streak >= 8 ? 3 : streak >= 4 ? 2 : 1;
      score += pts;
      scoreEl.textContent = score;
      sfx.good(Math.min(streak, 10));
      haptic(10);
      flyText(scoreEl, `+${pts}`);
      msg.textContent = streak >= 4 ? `Combo ${streak}: ogni risposta vale ${pts} punti` : '';
    } else {
      streak = 0;
      sfx.bad();
      haptic([30, 30, 30]);
      msg.innerHTML = '';
      const span = document.createElement('span');
      span.className = 'warn';
      msg.appendChild(span);
      span.textContent = 'Era ';
      const t = document.createElement('span');
      tex(t, String(item.display));
      span.appendChild(t);
    }
    nextQ();
  };
  const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
  document.addEventListener('keydown', onKey);
  app.main.querySelector('[data-ok]').addEventListener('click', submit);
  nextQ();
  timerId = setInterval(() => {
    left -= 0.25;
    timer.style.setProperty('--p', Math.max(0, left / DURATION));
    timer.classList.toggle('low', left <= 10);
    if (left <= 10 && Math.abs(left - Math.round(left)) < 0.01) sfx.tick();
    if (left <= 0) {
      stop();
      endLampo(app, score, answered, best);
    }
  }, 250);
}

function endLampo(app, score, answered, oldBest) {
  const s = app.state;
  const d = app.today();
  const events = G.recordSpeed(s, d, score);
  const xp = app.addXp(score * 2);
  events.push(...G.checkBadges(s, d));
  app.save();
  const record = score > oldBest;
  if (record) confetti();
  sfx.done();
  app.main.innerHTML = `
    <div class="summary" style="--hue:45">
      <p class="muted">Sfida lampo</p>
      <h1 class="verdict">${record ? 'Nuovo record!' : score >= oldBest * 0.8 && score > 0 ? 'Quasi record' : 'Tempo scaduto'}</h1>
      <p class="score num">${score}</p>
      <p class="muted">${answered} risposte in 60 secondi. Record: ${Math.max(score, oldBest)}.</p>
      <div class="tally"><div><b class="num">+${xp}</b><span>XP</span></div><div><b class="num">${s.speed.runs}</b><span>partite</span></div></div>
      <div class="btn-row"><a class="btn big" href="#/lampo" data-again>Rigioca</a><a class="btn-ghost" href="#/sfide">Sfide</a></div>
    </div>`;
  app.main.querySelector('[data-again]').addEventListener('click', (e) => { e.preventDefault(); startLampo(app); });
  app.handle(events);
}

// ------------------------------------------------------------------ Enigma del giorno
export function viewEnigma(app) {
  const s = app.state;
  const d = app.today();
  const pz = puzzleOfDay(d);
  if (s.puzzle.day !== d) { s.puzzle.day = d; s.puzzle.solved = false; s.puzzle.attempts = 0; app.save(); }
  const done = s.puzzle.solved || s.puzzle.attempts >= 3;
  app.main.innerHTML = `
    <div class="lesson" style="--hue:280">
      <a class="btn-ghost" href="#/sfide">${icons.back} Sfide</a>
      <section class="card paper" style="margin-top:14px">
        <p class="kicker">Enigma del ${new Date(d + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</p>
        <h2>${esc(pz.title)}</h2>
        <div class="prompt" data-p></div>
        ${pz.fig ? `<div class="figure">${pz.fig}</div>` : ''}
        ${done ? '' : `<div class="answer-row"><input class="answer" data-in type="text" autocomplete="off" aria-label="Risposta" placeholder="La tua risposta"><button class="btn big" data-ok>Prova</button></div><div data-pad></div>`}
        <div class="preview" data-msg aria-live="polite"></div>
        ${done ? '' : `<button class="btn-ghost" data-hint style="margin-top:8px">Aiuto</button>`}
        <div data-hintbox></div>
        <div data-sol></div>
      </section>
    </div>`;
  html(app.main.querySelector('[data-p]'), pz.prompt);
  renderMath(app.main);
  const msg = app.main.querySelector('[data-msg]');
  const showSolution = () => {
    const box = app.main.querySelector('[data-sol]');
    html(box, `<div class="hint-box" style="border-color:var(--good)"><b>Soluzione: ${String(+pz.answer.toFixed(2)).replace('.', ',')}</b><br>${pz.explain}</div>
      <div class="row" style="margin-top:12px"><button class="btn-ghost" data-share>${icons.share} Condividi il risultato</button></div>`);
    box.querySelector('[data-share]').addEventListener('click', async () => {
      const text = `Orfini Math Quest · Enigma del ${d}: ${s.puzzle.solved ? `risolto al ${s.puzzle.attempts}° tentativo ${'🟩'.repeat(1)}${'⬛'.repeat(Math.max(0, s.puzzle.attempts - 1))}` : 'non risolto ⬛⬛⬛'}`;
      try { await navigator.share?.({ text }); } catch { /* condivisione annullata */ }
      if (!navigator.share) { const ok = await copyText(text); toast(ok ? 'Risultato copiato: incollalo nella chat della classe.' : 'Copia il testo a mano.'); }
    });
  };
  if (done) {
    msg.innerHTML = s.puzzle.solved ? `<b style="color:var(--good)">Risolto al ${s.puzzle.attempts}° tentativo.</b> Torna domani per un nuovo enigma.` : 'Tentativi finiti per oggi.';
    showSolution();
    return;
  }
  const input = app.main.querySelector('[data-in]');
  attachKeypad(app.main.querySelector('[data-pad]'), input, { sys: true });
  app.main.querySelector('[data-hint]').addEventListener('click', (e) => { html(app.main.querySelector('[data-hintbox]'), `<div class="hint-box"><b>Aiuto.</b> ${pz.hint}</div>`); e.target.remove(); });
  const submit = () => {
    if (!input.value.trim()) return;
    const r = checkNumber(input.value, { answer: pz.answer, decimals: pz.decimals });
    if (r.invalid) { msg.textContent = r.message; return; }
    const events = G.recordPuzzle(s, app.today(), r.ok);
    if (r.ok) {
      app.addXp(G.XP.puzzle);
      confetti();
      sfx.level();
      events.push(...G.checkBadges(s, app.today()));
    } else {
      sfx.bad();
      haptic([30, 30, 30]);
    }
    app.save();
    app.handle(events);
    viewEnigma(app);
    if (!r.ok && s.puzzle.attempts < 3) app.main.querySelector('[data-msg]').innerHTML = `<span class="warn">No. Ti restano ${3 - s.puzzle.attempts} ${3 - s.puzzle.attempts === 1 ? 'tentativo' : 'tentativi'}.</span>`;
  };
  app.main.querySelector('[data-ok]').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
}

// ------------------------------------------------------------------ Simulazione INVALSI
export function startSimulation(app, grade) {
  const inv = grade === 13 ? invalsi13 : invalsi10;
  const steps = inv.simulation(createRng()).map((st) => ({ ...st, _act: inv.id }));
  const t0 = Date.now();
  app.stopLesson = runLesson(app.main, app, {
    calc: app.state.settings.calc !== false,
    hue: 48,
    exam: true,
    steps,
    onExit: () => { location.hash = '#/sfide'; },
    onFinish: (res) => endSimulation(app, grade, res, Date.now() - t0),
  });
}

function endSimulation(app, grade, res, ms) {
  const s = app.state;
  const pct = Math.round((res.firstTry / res.graded) * 100);
  const key = grade === 13 ? 'best13' : 'best10';
  const record = s.invalsi[key] == null || pct > s.invalsi[key];
  if (record) s.invalsi[key] = pct;
  s.stats.invalsiSims++;
  app.addXp(res.firstTry * 6);
  app.handle(G.markDayDone(s, app.today()));
  app.save();
  const by = {};
  for (const a of res.answers) (by[a.ambito] ||= { ok: 0, n: 0 }), by[a.ambito].n++, a.ok && by[a.ambito].ok++;
  const min = Math.round(ms / 60000);
  if (pct >= 70) confetti();
  sfx.done();
  app.main.innerHTML = `
    <div class="summary" style="--hue:48">
      <p class="muted">Simulazione INVALSI ${grade === 13 ? 'quinta' : 'seconda'} · ${min} min</p>
      <h1 class="verdict">${pct >= 80 ? 'Ottima prova' : pct >= 60 ? 'Buona prova' : 'Da allenare'}</h1>
      <p class="score num">${pct}%</p>
      <p class="muted">${res.firstTry} risposte giuste su ${res.graded}.${record ? ' È il tuo miglior risultato.' : ''}</p>
      <div class="panel" style="text-align:left">
        <h3>Per ambito</h3>
        ${Object.entries(by).map(([k, v]) => `<div style="margin:10px 0"><div class="spread"><span>${esc(k)}</span><span class="num">${v.ok}/${v.n}</span></div><div class="bar ${v.ok / v.n >= 0.6 ? 'good' : ''}"><i style="width:${(v.ok / v.n) * 100}%"></i></div></div>`).join('')}
      </div>
      <div class="panel review-list" style="margin-top:14px"><h3>Correzione</h3><ol>${res.answers.map((a) => `<li><b style="color:${a.ok ? 'var(--good)' : 'var(--bad)'}">${a.ok ? 'Giusta' : 'Sbagliata'}</b> <span class="badge-tag">${esc(a.ambito)}</span><div>${a.prompt}</div><details><summary>Soluzione</summary>${a.explain || ''}</details></li>`).join('')}</ol></div>
      <div class="btn-row"><a class="btn big" href="#/simulazione/${grade}">Nuova simulazione</a><a class="btn-ghost" href="#/sfide">Sfide</a></div>
    </div>`;
  renderMath(app.main);
}

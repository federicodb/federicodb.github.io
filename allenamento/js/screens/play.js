// Avvio delle lezioni e dei ripassi, e schermata di fine con i festeggiamenti.
import * as G from '../game/game.js';
import { byId } from '../../activities/catalogo.js';
import { createRng } from '../engine/rng.js';
import { runLesson } from '../ui/lesson.js';
import { icons, stars, esc, renderMath } from '../ui/dom.js';
import { sfx, confetti, countUp } from '../ui/fx.js';
import { skillScores, skillChart, discoveryCard, saveCard } from '../ui/summary.js';
import { levelOpen, prereqBlock } from './home.js';

export function startLesson(app, actId, level) {
  const act = byId[actId];
  if (!act || !act.levels[level - 1]) { location.hash = '#/'; return; }
  if (!levelOpen(app, act, level)) { location.hash = '#/'; return; }
  const steps = act.generate(createRng(), level).map((s) => ({ ...s, _act: act.id }));
  app.state.lastActivity = act.id;
  app.save();
  app.stopLesson = runLesson(app.main, app, {
    calc: app.state.settings.calc !== false && act.area !== 'calcolo', // i trucchi sono calcolo mentale
    hue: act.hue,
    steps,
    onExit: () => { location.hash = '#/'; },
    onFinish: (res) => finish(app, { res, kind: 'lesson', act, level }),
  });
}

/** Prova d'ingresso: 4 domande del livello scelto, senza correzione passo per passo.
 *  Con almeno 3 giuste il livello si sblocca (la padronanza dei livelli precedenti è dimostrata). */
export function startTestOut(app, actId, level) {
  const act = byId[actId];
  if (!act || level < 2 || !act.levels[level - 1]) { location.hash = '#/'; return; }
  if (levelOpen(app, act, level)) { location.hash = `#/lezione/${actId}/${level}`; return; }
  const rng = createRng();
  let pool = [];
  for (let k = 0; k < 3 && pool.length < 4; k++) pool = pool.concat(act.generate(rng, level).filter((st) => st.type !== 'learn' && st.type !== 'widget'));
  const steps = rng.shuffle(pool).slice(0, 4).map((st) => ({ ...st, _act: act.id, _kicker: `Prova d'ingresso: livello ${level}` }));
  app.stopLesson = runLesson(app.main, app, {
    calc: app.state.settings.calc !== false && act.area !== 'calcolo', // i trucchi sono calcolo mentale
    hue: act.hue,
    exam: true,
    steps,
    onExit: () => { location.hash = '#/'; },
    onFinish: (res) => endTestOut(app, act, level, res),
  });
}

function endTestOut(app, act, level, res) {
  const s = app.state;
  const ok = res.firstTry;
  const pass = ok >= 3;
  if (pass) {
    const a = G.activityState(s, act.id);
    a.stars = Math.max(a.stars, level - 1);
    a.level = Math.max(a.level, level);
    app.addXp(ok * 6);
    confetti();
  }
  app.save();
  sfx.done();
  const back = Math.max(1, Math.min(level - 1, (s.activities[act.id]?.stars || 0) + 1));
  app.main.innerHTML = `
    <div class="summary" style="--hue:${act.hue}">
      <p class="muted">${esc(act.title)}, prova d'ingresso al livello ${level}</p>
      <h1 class="verdict">${pass ? 'Prova superata!' : 'Non ancora'}</h1>
      <p class="score num">${ok}/4</p>
      <p class="muted">${pass ? `Il livello ${level} è sbloccato, e i livelli precedenti contano come superati.` : `Ne servivano 3 su 4. Conviene partire dal livello ${back}: è più veloce di quanto sembri.`}</p>
      <div class="panel review-list" style="text-align:left"><h3>Le risposte</h3><ol>${res.answers.map((x) => `<li><b style="color:${x.ok ? 'var(--good)' : 'var(--bad)'}">${x.ok ? 'Giusta' : 'Sbagliata'}</b><div>${x.prompt}</div>${x.ok ? '' : `<details><summary>Soluzione</summary>${x.explain || ''}</details>`}</li>`).join('')}</ol></div>
      <div class="btn-row">
        ${pass ? `<a class="btn big" href="#/lezione/${act.id}/${level}">Gioca il livello ${level}</a>` : `<a class="btn big" href="#/lezione/${act.id}/${back}">Parti dal livello ${back}</a><a class="btn-ghost" href="#/prova/${act.id}/${level}">Riprova la prova</a>`}
        <a class="btn-ghost" href="#/">Torna al percorso</a>
      </div>
    </div>`;
  renderMath(app.main);
}

export function startReview(app) {
  const s = app.state;
  const d = app.today();
  let ids = G.dueReviews(s, d);
  const free = ids.length === 0;
  if (free) ids = Object.entries(s.activities).sort((x, y) => (x[1].lastScore ?? 0) - (y[1].lastScore ?? 0)).map(([id]) => id);
  ids = ids.filter((id) => byId[id] && !byId[id].invalsi).slice(0, 3);
  if (!ids.length) { location.hash = '#/sfide'; return; }
  const rng = createRng();
  const steps = [];
  for (const id of ids) {
    const act = byId[id];
    const lvl = Math.max(1, Math.min(act.levels.length, s.activities[id].stars || 1));
    const graded = act.generate(rng, lvl).filter((st) => st.type !== 'learn' && st.type !== 'widget');
    const per = ids.length === 1 ? 5 : ids.length === 2 ? 3 : 2;
    rng.shuffle(graded).slice(0, per).forEach((st) => steps.push({ ...st, _act: id, _kicker: `Ripasso: ${act.title}` }));
  }
  app.stopLesson = runLesson(app.main, app, {
    calc: app.state.settings.calc !== false,
    hue: byId[ids[0]].hue,
    steps: rng.shuffle(steps),
    onExit: () => { location.hash = '#/sfide'; },
    onFinish: (res) => finish(app, { res, kind: free ? 'free' : 'review', ids }),
  });
}

function finish(app, { res, kind, act, level, ids }) {
  const s = app.state;
  const d = app.today();
  const score = res.graded ? res.firstTry / res.graded : 1;
  const events = [];
  let bonusXp = 0;
  let coins = 0;
  const xpBefore = s.xp;
  if (kind === 'lesson') {
    bonusXp += G.XP.lesson + (score === 1 ? G.XP.perfect : 0);
    coins += G.COINS.lesson + (score === 1 ? G.COINS.perfect : 0);
    events.push(...G.recordLesson(s, d, { id: act.id, level, maxLevel: act.levels.length, score }));
  } else {
    bonusXp += G.XP.review;
    coins += G.COINS.lesson;
    for (const id of ids) {
      const mine = res.perStep.filter((p) => p.act === id);
      if (!mine.length) continue;
      const sc = mine.filter((p) => p.first).length / mine.length;
      events.push(...G.recordLesson(s, d, { id, level: Math.max(1, s.activities[id].stars), maxLevel: byId[id].levels.length, score: sc, review: true }));
    }
  }
  G.addCoins(s, coins);
  const streakBefore = s.streak.current;
  events.push(...G.markDayDone(s, d));
  s.stats.answers += res.graded;
  s.stats.firstTry += res.firstTry;
  s.stats.twins += res.twins;
  s.stats.bestCombo = Math.max(s.stats.bestCombo, res.bestCombo);
  s.stats.betsRight += res.bets.right;
  s.stats.betsWrong += res.bets.wrong;
  // lezioni completate oggi: dopo la terza si suggerisce una pausa (si ricorda meglio a mente fresca)
  const today = (s.days[d] ||= { xp: 0, done: false });
  today.lessons = (today.lessons || 0) + 1;
  const discovery = res.learned[0] || (act ? act.summary : '');
  if (kind === 'lesson') {
    s.album.unshift({ id: act.id, level, day: d, pct: Math.round(score * 100), discovery });
    s.album.length = Math.min(s.album.length, 200);
  }
  events.push(...G.track(s, d, 'firstTry', res.firstTry));
  if (res.twins) events.push(...G.track(s, d, 'twins', res.twins));
  app.addXp(bonusXp);
  events.push(...G.checkBadges(s, d));
  app.save();
  app.chrome();

  const streakUp = s.streak.current !== streakBefore && s.streak.current > 0;
  const pct = Math.round(score * 100);
  const star = events.find((e) => e.type === 'star');
  const unlocked = events.find((e) => e.type === 'level-unlocked');
  const verdict = score === 1 ? 'Lezione perfetta!' : score >= 0.8 ? 'Livello superato!' : score >= 0.5 ? 'Ci sei quasi' : 'Serve ancora un po\' di pratica';
  const hue = act ? act.hue : byId[ids[0]].hue;
  const nextLevel = act && unlocked ? unlocked.level : null;

  app.main.innerHTML = `
    <div class="summary" style="--hue:${hue}">
      <p class="muted">${kind === 'lesson' ? `${esc(act.title)}, livello ${level}` : kind === 'review' ? 'Ripasso' : 'Allenamento libero'}</p>
      <h1 class="verdict">${verdict}</h1>
      <p class="score num"><span data-pct>0</span>%</p>
      <p class="muted">${res.firstTry} su ${res.graded} al primo tentativo${kind === 'lesson' && score < 0.8 ? '. Con l\'80% si supera il livello' : ''}.</p>
      ${streakUp ? `<div class="streak-moment pop">${icons.flame}<span class="num" data-streak>${streakBefore}</span><span>${s.streak.current === 1 ? 'giorno di serie' : 'giorni di fila'}</span></div>` : ''}
      <div class="tally">
        <div><b class="num">+<span data-xp>0</span></b><span>XP</span></div>
        <div><b class="num" style="color:var(--gold)">+${coins} Δ</b><span>gettoni</span></div>
        <div><b class="num">${res.bestCombo}</b><span>combo migliore</span></div>
        <div><b class="num">${res.twins}</b><span>gemelli risolti</span></div>
        ${star ? `<div><b>${stars(star.stars, act ? act.levels.length : 3)}</b><span>nuova stella</span></div>` : ''}
      </div>
      ${(() => {
        const sk = skillScores(res);
        const bets = res.bets.right + res.bets.wrong;
        return sk.length ? `<section class="panel skills"><h3>Le abilità di questa lezione</h3>${skillChart(sk)}${bets ? `<p class="muted">Quando hai detto «sono sicuro» avevi ragione ${res.bets.right} ${res.bets.right === 1 ? 'volta' : 'volte'} su ${bets}.</p>` : ''}</section>` : '';
      })()}
      ${kind === 'lesson' && (s.activities[act.id]?.lowRuns || 0) >= 2 ? `<section class="panel remedial">${prereqBlock(app, act.id, 'Prima di riprovare, ripassa le basi')}<p class="muted">Due lezioni di fila sotto l'80%: spesso il nodo sta in un argomento precedente. Una lezione di ripasso e poi si torna qui.</p></section>` : ''}
      ${today.lessons >= 3 ? `<p class="pause-note">Ottimo lavoro: ${today.lessons} lezioni oggi. Una pausa adesso aiuta a ricordare quello che hai imparato.</p>` : ''}
      ${res.misses.length ? `<div class="panel review-list"><h3>Da rivedere</h3><ol>${res.misses.map((m) => `<li><div>${m.prompt}</div><details><summary>Soluzione</summary>${m.explain || ''}</details></li>`).join('')}</ol></div>` : ''}
      <div class="btn-row">
        ${nextLevel ? `<a class="btn big" href="#/lezione/${act.id}/${nextLevel}">Livello ${nextLevel}</a>` : ''}
        ${act ? `<a class="${nextLevel ? 'btn-ghost' : 'btn big'}" href="#/lezione/${act.id}/${level}" data-again>Rigioca con numeri nuovi</a>` : ''}
        ${kind === 'lesson' ? '<button type="button" class="btn-ghost" data-card>Salva la carta</button>' : ''}
        <a class="btn-ghost" href="#/">Torna al percorso</a>
      </div>
    </div>`;
  renderMath(app.main);
  countUp(app.main.querySelector('[data-pct]'), 0, pct, 900);
  countUp(app.main.querySelector('[data-xp]'), 0, s.xp - xpBefore + res.xp, 900);
  if (streakUp) setTimeout(() => { countUp(app.main.querySelector('[data-streak]'), streakBefore, s.streak.current, 500); sfx.coin(); }, 700);
  if (score >= 0.8) { confetti(); sfx.done(); } else sfx.done();
  app.main.querySelector('[data-again]')?.addEventListener('click', (e) => { e.preventDefault(); startLesson(app, act.id, level); });
  app.main.querySelector('[data-card]')?.addEventListener('click', async (e) => {
    const svg = discoveryCard({
      hue, title: act.title, level, discovery, pct, combo: res.bestCombo, xp: s.xp - xpBefore + res.xp,
      nickname: s.profile.nickname || '', avatar: app.avatar(96), date: new Date().toLocaleDateString('it-IT'),
    });
    e.target.disabled = true;
    try { await saveCard(svg, `carta-${act.id}-${level}.png`); sfx.coin(); } catch { /* immagine non disponibile */ }
    e.target.disabled = false;
  });
  app.handle(events);
  app.flushModals();
}

// Primo avvio: avatar, nickname privato, classe (o area), obiettivo giornaliero.
import * as G from '../game/game.js';
import { areas, YEARS } from '../../activities/catalogo.js';
import { INDIRIZZI } from '../../activities/contesti.js';
import { avatarSVG, PARTS } from '../game/avatar.js';
import { icons, esc } from '../ui/dom.js';
import { sfx, confetti } from '../ui/fx.js';

export function viewOnboarding(app, step = 0) {
  const s = app.state;
  const eq = s.inventory.equipped;
  const dots = `<div class="dots" aria-hidden="true">${[0, 1, 2, 3, 4].map((k) => `<i class="${k === step ? 'on' : ''}"></i>`).join('')}</div>`;
  document.body.classList.add('in-lesson');
  const go = (n) => { sfx.tap(); viewOnboarding(app, n); };

  if (step === 0) {
    app.main.innerHTML = `<div class="onb">
      <div class="hero-mark">${icons.brand.replace('class="brand-mark"', 'style="width:96px;height:96px"')}</div>
      <h1>Orfini Math Quest</h1>
      <p>La matematica dell'IPIA Orfini, dalla prima alla quinta, a piccoli passi. Ogni esercizio ha numeri sempre nuovi, ogni giorno ci sono missioni, serie, leghe e premi.</p>
      <p class="muted">Crea il tuo personaggio: si sblocca altro giocando.</p>
      <div class="avatar-stage">${avatarSVG(eq, { size: 150 })}</div>
      <div class="pick-grid" data-shape>${PARTS.shape.filter((p) => p.price === 0).map((p) => `<button class="pick" data-v="${p.id}" aria-pressed="${eq.shape === p.id}">${esc(p.name)}</button>`).join('')}</div>
      <div class="pick-grid" data-color>${PARTS.color.filter((p) => p.price === 0).map((p) => `<button class="pick" data-v="${p.id}" aria-pressed="${eq.color === p.id}" style="--hue:${p.hue}"><span style="width:26px;height:26px;border-radius:50%;background:hsl(${p.hue} 80% 58%)"></span>${esc(p.name)}</button>`).join('')}</div>
      <div class="pick-grid" data-eyes>${PARTS.eyes.filter((p) => p.price === 0).map((p) => `<button class="pick" data-v="${p.id}" aria-pressed="${eq.eyes === p.id}">Occhi ${esc(p.name.toLowerCase())}</button>`).join('')}</div>
      <button class="btn big wide" data-next>Avanti</button>${dots}
    </div>`;
    for (const slot of ['shape', 'color', 'eyes']) {
      app.main.querySelector(`[data-${slot}]`).addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        eq[slot] = b.dataset.v;
        app.save();
        go(0);
      });
    }
    app.main.querySelector('[data-next]').addEventListener('click', () => go(1));
    return;
  }

  if (step === 1) {
    app.main.innerHTML = `<div class="onb">
      <div class="avatar-stage">${avatarSVG(eq, { size: 110 })}</div>
      <h1>Come ti chiami qui?</h1>
      <p class="muted">Il nickname lo vedi solo tu, su questo dispositivo. Al docente arriverà solo quello che deciderai di consegnare.</p>
      <div class="field" style="text-align:left"><label for="nick">Nickname</label><input id="nick" maxlength="20" autocomplete="nickname" value="${esc(s.profile.nickname)}" placeholder="es. Ipotenusa98"></div>
      <button class="btn big wide" data-next>Avanti</button>
      <button class="btn-ghost" data-back>Indietro</button>${dots}
    </div>`;
    const inp = app.main.querySelector('#nick');
    inp.focus();
    const next = () => { const v = inp.value.trim(); if (!v) { inp.focus(); inp.style.borderColor = 'var(--bad)'; return; } s.profile.nickname = v; app.save(); go(2); };
    app.main.querySelector('[data-next]').addEventListener('click', next);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') next(); });
    app.main.querySelector('[data-back]').addEventListener('click', () => go(0));
    return;
  }

  if (step === 2) {
    app.main.innerHTML = `<div class="onb">
      <h1>Che classe fai?</h1>
      <p class="muted">Ti proponiamo il programma della tua classe. Puoi comunque esplorare tutto, e cambiarla quando vuoi dal profilo.</p>
      <div class="pick-grid" data-year>${YEARS.map((y) => `<button class="pick" data-v="${y.y}" aria-pressed="${s.profile.year === y.y}">${y.y}ª<small>${esc(y.period)}</small></button>`).join('')}</div>
      <p class="muted" style="margin:6px 0 0">Oppure scegli direttamente un argomento:</p>
      <div class="pick-grid" data-area>${areas.filter((a) => a.id !== 'lavoro').map((a) => `<button class="pick" data-v="${a.id}" aria-pressed="${s.profile.focus === a.id}" style="--hue:${a.hue}">${esc(a.title)}</button>`).join('')}</div>
      <button class="btn big wide" data-next ${s.profile.year || s.profile.focus ? '' : 'disabled'}>Avanti</button>
      <button class="btn-ghost" data-back>Indietro</button>${dots}
    </div>`;
    app.main.querySelector('[data-year]').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; s.profile.year = +b.dataset.v; s.profile.focus = null; app.save(); app.applySettings(); go(2); });
    app.main.querySelector('[data-area]').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; s.profile.focus = b.dataset.v; app.save(); go(2); });
    app.main.querySelector('[data-next]').addEventListener('click', () => go(3));
    app.main.querySelector('[data-back]').addEventListener('click', () => go(1));
    return;
  }

  if (step === 3) {
    const cur = s.profile.indirizzo === undefined ? undefined : s.profile.indirizzo;
    app.main.innerHTML = `<div class="onb">
      <h1>Qual è il tuo indirizzo?</h1>
      <p class="muted">Sono gli indirizzi dell'Orfini. Se lo scegli, molti problemi parleranno del tuo laboratorio e del tuo futuro lavoro; se preferisci di no, useremo situazioni di tutti i giorni. Al serale: Fashion Factory o Servizi Socio-Sanitari.</p>
      <div class="pick-grid wide-picks" data-ind>
        ${INDIRIZZI.map((i) => `<button class="pick" data-v="${i.id}" aria-pressed="${cur === i.id}"><span class="pick-glyph" aria-hidden="true">${esc(i.glyph)}</span>${esc(i.name)}<small>${esc(i.official)}</small></button>`).join('')}
        <button class="pick" data-v="" aria-pressed="${cur === null}"><span class="pick-glyph" aria-hidden="true">€</span>Preferisco di no<small>Matematica della vita di tutti i giorni</small></button>
      </div>
      <button class="btn big wide" data-next ${cur === undefined ? 'disabled' : ''}>Avanti</button>
      <button class="btn-ghost" data-back>Indietro</button>${dots}
    </div>`;
    app.main.querySelector('[data-ind]').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; s.profile.indirizzo = b.dataset.v || null; app.save(); app.applySettings(); go(3); });
    app.main.querySelector('[data-next]').addEventListener('click', () => go(4));
    app.main.querySelector('[data-back]').addEventListener('click', () => go(2));
    return;
  }

  app.main.innerHTML = `<div class="onb">
    <h1>Quanto vuoi giocare al giorno?</h1>
    <p class="muted">Un obiettivo piccolo e costante batte una maratona ogni tanto. Si cambia quando vuoi.</p>
    <div class="pick-grid" data-goal>${G.DAILY_GOALS.map((g, k) => `<button class="pick" data-v="${g.xp}" aria-pressed="${s.dailyGoal === g.xp}">${esc(g.name)}<small>${g.xp} XP · circa ${[5, 10, 15, 25][k]} min</small></button>`).join('')}</div>
    <button class="btn big wide" data-next>Inizia</button>
    <button class="btn-ghost" data-back>Indietro</button>${dots}
  </div>`;
  app.main.querySelector('[data-goal]').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; s.dailyGoal = +b.dataset.v; app.save(); go(4); });
  app.main.querySelector('[data-back]').addEventListener('click', () => go(3));
  app.main.querySelector('[data-next]').addEventListener('click', () => {
    s.onboarded = true;
    app.save();
    document.body.classList.remove('in-lesson');
    confetti();
    sfx.level();
    // si resta sulla pagina richiesta (es. una lezione aperta da un link del sito), tranne il benvenuto
    if (!location.hash.startsWith('#/benvenuto')) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = '#/';
  });
}

// Profilo: statistiche, traguardi, calendario, codice per il docente, impostazioni, salvataggi.
import * as G from '../game/game.js';
import { YEARS } from '../../activities/catalogo.js';
import { codePayload, encode } from '../game/code.js';
import { avatarSVG } from '../game/avatar.js';
import { icons, esc, ask, toast, copyText } from '../ui/dom.js';
import { sfx } from '../ui/fx.js';
import { setTheme } from '../app.js';
import { INDIRIZZI, INDIRIZZI_BY_ID } from '../../activities/contesti.js';

export function viewProfile(app, section) {
  const s = app.state;
  const d = app.today();
  const lv = G.levelInfo(s.xp);
  const acc = s.stats.answers ? Math.round((s.stats.firstTry / s.stats.answers) * 100) : 0;
  const start = G.addDays(G.weekStart(d), -28);
  let heat = '';
  for (let k = 0; k < 35; k++) {
    const day = G.addDays(start, k);
    const xp = s.days[day]?.xp || 0;
    const l = !s.days[day]?.done ? 0 : xp >= s.dailyGoal ? 3 : xp >= s.dailyGoal / 2 ? 2 : 1;
    const fz = s.streak.frozen.includes(day);
    heat += `<i class="${fz ? 'fz' : l ? 'l' + l : ''}" title="${day}: ${xp} XP${fz ? ', congelato' : ''}" ${day > d ? 'style="opacity:.25"' : ''}></i>`;
  }
  const stars = Object.values(s.activities).reduce((n, a) => n + (a.stars || 0), 0);
  const light = document.documentElement.classList.contains('theme-light');

  app.main.innerHTML = `
    <div class="grid-2">
      <div class="stack">
        <div class="hello">${avatarSVG(s.inventory.equipped, { size: 76 })}
          <div><h1 style="margin:0">${esc(s.profile.nickname)}</h1><span class="muted">Livello ${lv.level}${s.profile.year ? ` · ${YEARS[s.profile.year - 1].name}` : ''}</span><br><span class="profile-links"><a href="#/premi/wardrobe">Cambia avatar</a><button type="button" data-switch>Cambia utente</button></span></div>
        </div>
        <div class="tally three" style="margin:0">
          <div><b class="num">${s.xp}</b><span>XP totali</span></div>
          <div><b class="num" style="color:var(--flame)">${s.streak.current}</b><span>giorni di serie (record ${s.streak.best})</span></div>
          <div><b class="num">${acc}%</b><span>giuste al primo colpo</span></div>
          <div><b class="num" style="color:var(--gold)">${stars}</b><span>stelle</span></div>
          <div><b class="num">${s.speed.best}</b><span>record lampo</span></div>
          <div><b class="num">${s.stats.lessons}</b><span>lezioni</span></div>
        </div>
        <section class="panel">
          <h2>Serie</h2>
          <p class="muted">Ogni ${G.FREEZE_EVERY} giorni di fila ricevi un congelamento (massimo ${G.FREEZE_MAX}): protegge la serie se salti un giorno. Se la serie si spezza, entro ${G.REPAIR_WINDOW} giorni puoi ripararla completando ${G.REPAIR_LESSONS} lezioni in un giorno.</p>
          <div class="heat" aria-label="Ultime cinque settimane">${heat}</div>
        </section>
        <section class="panel">
          <h2>Traguardi</h2>
          <div class="badges">${G.BADGES.map((b) => {
            const t = G.badgeTier(s, b);
            const v = b.value(s);
            const next = b.tiers[t] ?? null;
            return `<div class="badge t${t}">${icons.medal(t)}<b>${esc(b.name)}</b><small>${esc(b.desc)}: ${v}${next != null ? ` / ${next}` : ' (oro)'}</small></div>`;
          }).join('')}</div>
        </section>
      </div>
      <aside class="stack">
        <section class="panel" id="codice">
          <h2>Consegna al prof</h2>
          <p class="muted">Il codice contiene il nome che scrivi qui sotto, la classe e i risultati. Il tuo nickname resta privato.</p>
          <div class="field"><label for="tn">Nome e cognome per il docente</label><input id="tn" value="${esc(s.profile.teacherName)}" autocomplete="name" maxlength="60"></div>
          <div class="field"><label for="cl">Classe e sezione</label><input id="cl" value="${esc(s.profile.classLabel)}" placeholder="es. 2 EL" maxlength="12"></div>
          <button class="btn wide" data-gen>${icons.clipboard} Genera il codice</button>
          <div data-code style="margin-top:12px"></div>
        </section>
        <section class="panel">
          <h2>Impostazioni</h2>
          <div class="field"><label>Classe che frequenti</label><div class="segmented" data-year>${YEARS.map((y) => `<button type="button" data-y="${y.y}" aria-pressed="${s.profile.year === y.y}">${y.y}ª</button>`).join('')}</div></div>
          <div class="field" id="indirizzo"><label>Indirizzo di studio</label><div class="segmented" data-ind>${INDIRIZZI.map((i) => `<button type="button" data-i="${i.id}" aria-pressed="${s.profile.indirizzo === i.id}">${esc(i.name)}</button>`).join('')}<button type="button" data-i="" aria-pressed="${s.profile.indirizzo === null}">Nessuno: vita di tutti i giorni</button></div>
            <small class="muted">${INDIRIZZI_BY_ID[s.profile.indirizzo] ? esc(INDIRIZZI_BY_ID[s.profile.indirizzo].official) + '. I problemi parlano del tuo laboratorio.' : 'I problemi usano situazioni di tutti i giorni.'}</small></div>
          <div class="field"><label>Obiettivo giornaliero</label><div class="segmented" data-goal>${G.DAILY_GOALS.map((g) => `<button type="button" data-xp="${g.xp}" aria-pressed="${s.dailyGoal === g.xp}">${g.name} ${g.xp}</button>`).join('')}</div></div>
          <div class="field"><label>Schermo e suoni</label><div class="segmented">
            <button type="button" data-toggle="theme" aria-pressed="${light}">Tema chiaro</button>
            <button type="button" data-toggle="bigText" aria-pressed="${!!s.settings.bigText}">Testo grande</button>
            <button type="button" data-toggle="lim" aria-pressed="${!!s.settings.lim}">Modalità LIM</button>
            <button type="button" data-toggle="calc" aria-pressed="${s.settings.calc !== false}">Calcolatrice</button>
            <button type="button" data-toggle="sound" aria-pressed="${s.settings.sound}">Suoni</button>
            <button type="button" data-toggle="haptics" aria-pressed="${s.settings.haptics}">Vibrazione</button>
          </div></div>
          <div class="field"><label for="nn">Nickname (lo vedi solo tu)</label><input id="nn" value="${esc(s.profile.nickname)}" maxlength="20"></div>
        </section>
        <section class="panel">
          <h2>Utenti e salvataggi</h2>
          <p class="muted">I progressi sono salvati su questo dispositivo, separati da quelli dei giochi del sito. Su un dispositivo condiviso (LIM, tablet di classe) ognuno usa il suo utente. Per spostare i progressi: esporta il file e importalo sull'altro dispositivo.</p>
          <div class="row">
            <button class="btn-ghost" data-switch>Cambia utente</button>
            <button class="btn-ghost" data-export>Esporta</button>
            <label class="btn-ghost" style="cursor:pointer">Importa<input type="file" accept="application/json,.json" data-import hidden></label>
            <button class="btn-ghost" data-reset>Azzera questo utente</button>
          </div>
        </section>
        <section class="panel">
          <h2>Per il docente</h2>
          <div class="row"><a class="btn-ghost" href="#/docente">${icons.teacher} Registro e classifica</a>
          <button class="btn-ghost" data-toggle="teacher" aria-pressed="${!!s.settings.teacher}">Tutti i livelli aperti</button></div>
        </section>
      </aside>
    </div>`;

  const $ = (q) => app.main.querySelector(q);
  if (section === 'codice' || section === 'indirizzo') setTimeout(() => $('#' + section).scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  $('[data-ind]').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (!b) return; s.profile.indirizzo = b.dataset.i || null; app.save(); app.applySettings(); toast(s.profile.indirizzo ? `Indirizzo: ${INDIRIZZI_BY_ID[s.profile.indirizzo].name}.` : 'Problemi di vita quotidiana.'); viewProfile(app, 'indirizzo'); });
  $('[data-gen]').addEventListener('click', () => {
    s.profile.teacherName = $('#tn').value.trim();
    s.profile.classLabel = $('#cl').value.trim();
    if (!s.profile.teacherName) { toast('Scrivi nome e cognome: servono al docente per riconoscerti.'); $('#tn').focus(); return; }
    app.save();
    const code = encode(codePayload(s, d, G.levelInfo));
    const box = $('[data-code]');
    box.innerHTML = `<div class="codebox" data-cb>${esc(code)}</div><div class="row" style="margin-top:10px"><button class="btn" data-copy>${icons.copy} Copia</button>${navigator.share ? `<button class="btn-ghost" data-share>${icons.share} Condividi</button>` : ''}</div><p class="muted" style="font-size:.85rem;margin-top:8px">Incollalo dove ti ha chiesto il docente (Classroom, registro, email).</p>`;
    box.querySelector('[data-copy]').addEventListener('click', async () => toast((await copyText(code, box.querySelector('[data-cb]'))) ? 'Codice copiato.' : 'Il codice è selezionato: copialo con il menu del dispositivo.'));
    box.querySelector('[data-share]')?.addEventListener('click', () => navigator.share({ title: 'Codice Orfini Math Quest', text: code }).catch(() => {}));
    sfx.coin();
  });
  $('[data-year]').addEventListener('click', (e) => { const b = e.target.closest('[data-y]'); if (!b) return; s.profile.year = +b.dataset.y; s.profile.focus = null; app.save(); viewProfile(app); });
  $('[data-goal]').addEventListener('click', (e) => { const b = e.target.closest('[data-xp]'); if (!b) return; s.dailyGoal = +b.dataset.xp; app.save(); app.chrome(); viewProfile(app); });
  app.main.querySelectorAll('[data-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.toggle;
      if (k === 'theme') setTheme(!document.documentElement.classList.contains('theme-light'));
      else if (k === 'calc') s.settings.calc = s.settings.calc === false;
      else s.settings[k] = !s.settings[k];
      app.save();
      app.applySettings();
      viewProfile(app);
    }),
  );
  $('#nn').addEventListener('change', (e) => { const v = e.target.value.trim(); if (v) { s.profile.nickname = v; app.save(); toast('Nickname aggiornato.'); } });
  $('[data-export]').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orfini-math-quest-${d}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('[data-import]').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.version !== 2 || !data.streak || !data.league || !data.inventory) throw new Error();
      app.state = G.load({ getItem: () => JSON.stringify(data) }, d);
      app.handle(G.rollover(app.state, d));
      app.save();
      app.chrome();
      toast('Progressi importati.');
      viewProfile(app);
    } catch {
      toast('Questo file non contiene progressi di Orfini Math Quest.');
    }
  });
  app.main.querySelectorAll('[data-switch]').forEach((b) => b.addEventListener('click', () => openSwitcher(app)));
  $('[data-reset]').addEventListener('click', async () => {
    if (!(await ask(`Cancellare XP, serie, stelle, Δ e avatar di ${esc(s.profile.nickname || 'questo utente')}? Gli altri utenti e i dati dei giochi del sito restano. Non si può annullare.`, 'Cancella'))) return;
    app.state = G.freshState(d);
    G.rollover(app.state, d);
    app.save();
    if (location.hash === '#/benvenuto') window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = '#/benvenuto';
  });
}

/** Scelta dell'utente: quelli salvati su questo dispositivo, oppure uno nuovo */
function openSwitcher(app) {
  const s = app.state;
  const d = app.today();
  const others = G.loadProfiles(app.store).filter((p) => p.profileId !== s.profileId);
  const row = (p) => `<div class="user-row">
      ${avatarSVG(p.inventory.equipped, { size: 48 })}
      <span><b>${esc(p.profile.nickname || 'Senza nome')}</b><small>Livello ${G.levelInfo(p.xp).level} · ${p.xp} XP</small></span>
      <button class="btn" data-use="${esc(p.profileId)}">Usa</button>
      <button class="icon-btn" data-del="${esc(p.profileId)}" aria-label="Elimina ${esc(p.profile.nickname || 'utente')}" title="Elimina">${icons.trash}</button>
    </div>`;
  const wrap = document.createElement('div');
  wrap.className = 'sheet-backdrop';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sw-t">
    <div class="grab"></div>
    <div class="spread"><h2 id="sw-t" style="margin:0">Cambia utente</h2><button class="icon-btn" data-x aria-label="Chiudi">${icons.close}</button></div>
    <p class="muted">${s.onboarded ? `I progressi di <b>${esc(s.profile.nickname)}</b> restano salvati qui: puoi tornarci quando vuoi.` : 'Scegli un utente salvato su questo dispositivo.'}</p>
    <div class="user-list">${others.length ? others.map(row).join('') : '<p class="muted">Nessun altro utente su questo dispositivo.</p>'}</div>
    <button class="btn wide" data-new style="margin-top:16px">Nuovo utente</button>
  </div>`;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const activate = (id) => {
    app.state = G.switchProfile(app.store, s, id, d);
    app.applySettings();
    close();
    const target = app.state.onboarded ? '#/' : '#/benvenuto';
    if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = target;
    if (app.state.onboarded) toast(`Ciao, ${esc(app.state.profile.nickname)}!`);
  };
  wrap.addEventListener('click', async (e) => {
    if (e.target === wrap || e.target.closest('[data-x]')) return close();
    if (e.target.closest('[data-new]')) return activate(null);
    const use = e.target.closest('[data-use]');
    if (use) return activate(use.dataset.use);
    const del = e.target.closest('[data-del]');
    if (del) {
      const p = others.find((x) => x.profileId === del.dataset.del);
      if (!(await ask(`Eliminare l'utente ${esc(p?.profile.nickname || '')} e tutti i suoi progressi? Non si può annullare.`, 'Elimina'))) return;
      G.deleteProfile(app.store, del.dataset.del);
      close();
      openSwitcher(app);
    }
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
  wrap.querySelector('[data-x]').focus();
}

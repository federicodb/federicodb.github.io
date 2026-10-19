// Home "Percorso": saluto e livello, continua, obiettivo e serie, missioni e forziere, mappa delle aree.
import * as G from '../game/game.js';
import { areasFor, allActivities, byId, YEARS, MAT_LABELS, visibleFor } from '../../activities/catalogo.js';
import { INDIRIZZI_BY_ID } from '../../activities/contesti.js';
import { icons, stars, esc, html, modal } from '../ui/dom.js';
import { sfx, confetti, flyText } from '../ui/fx.js';
import { itemInfo, avatarSVG } from '../game/avatar.js';

export function levelOpen(app, act, level) {
  if (app.teacherMode() || level === 1) return true;
  return (app.state.activities[act.id]?.stars || 0) >= level - 1;
}

/** Prossima cosa da fare: ultima attività aperta, poi quelle dell'anno scelto */
export function nextUp(app) {
  const s = app.state;
  const y = s.profile.year;
  const pool = [
    ...(s.lastActivity && byId[s.lastActivity] ? [byId[s.lastActivity]] : []),
    ...(s.profile.focus ? allActivities.filter((a) => a.area === s.profile.focus) : []),
    ...(y ? allActivities.filter((a) => a.years.includes(y)) : []),
    ...allActivities,
  ];
  const ind = s.profile.indirizzo;
  for (const a of pool) {
    if (!visibleFor(a, ind, false)) continue;
    const st = s.activities[a.id]?.stars || 0;
    if (st < a.levels.length) return { act: a, level: st + 1 };
  }
  return null;
}

export function viewHome(app, filter) {
  const s = app.state;
  const d = app.today();
  const lv = G.levelInfo(s.xp);
  const p = G.dailyProgress(s, d);
  const nx = nextUp(app);
  const strip = G.weekStrip(s, d);
  const dn = ['lu', 'ma', 'me', 'gi', 've', 'sa', 'do'];
  const y = s.profile.year;
  const ind = INDIRIZZI_BY_ID[s.profile.indirizzo] || null;
  const areas = areasFor(s.profile.indirizzo, app.teacherMode());
  const mode = filter || (s.profile.focus ? 'area:' + s.profile.focus : y ? 'anno' : 'tutte');

  const list = (() => {
    if (mode === 'anno' && y) return areas.map((a) => ({ ...a, activities: a.activities.filter((x) => x.years.includes(y)) })).filter((a) => a.activities.length);
    if (mode === 'indirizzo' && ind) return areas.map((a) => ({ ...a, activities: a.activities.filter((x) => a.id === 'lavoro' || ind.focus[x.id]) })).filter((a) => a.activities.length);
    if (mode.startsWith('area:')) return areas.filter((a) => a.id === mode.slice(5));
    return areas;
  })();

  const continueCard = nx
    ? `<section class="continue" style="--hue:${nx.act.hue}">
        <span class="muted">${s.stats.lessons ? 'Riprendi da qui' : 'Inizia da qui'}</span>
        <h2>${esc(nx.act.title)}</h2>
        <p style="margin:0">Livello ${nx.level}: ${esc(nx.act.levels[nx.level - 1].name)}</p>
        <a class="btn big" href="#/lezione/${nx.act.id}/${nx.level}">Gioca</a>
        <span class="glyph-big" aria-hidden="true">${esc(nx.act.glyph)}</span>
      </section>`
    : `<section class="continue"><h2>Hai tre stelle ovunque</h2><p>Allenati con i ripassi e le sfide: i numeri cambiano ogni volta.</p><a class="btn" href="#/sfide">Vai alle sfide</a></section>`;

  app.main.innerHTML = `
    <div class="grid-2">
      <div class="stack">
        <div class="hello">
          ${avatarSVG(s.inventory.equipped, { size: 64 })}
          <div style="flex:1;min-width:0">
            <h1>Ciao, ${esc(s.profile.nickname || 'campione')}</h1>
            <div class="levelbar"><span class="lvl">Liv. ${lv.level}</span><div class="bar" role="progressbar" aria-label="Livello" aria-valuenow="${Math.round(lv.ratio * 100)}"><i style="width:${lv.ratio * 100}%"></i></div><span class="muted num" style="font-size:.8rem">${lv.into}/${lv.need}</span></div>
          </div>
        </div>
        ${s.profile.indirizzo === undefined ? `<a class="notice" href="#/profilo/indirizzo"><b>Novità: scegli il tuo indirizzo.</b> I problemi parleranno del tuo laboratorio, oppure della vita di tutti i giorni.</a>` : ''}
        ${continueCard}
        <div>
          <div class="chips" role="group" aria-label="Filtra le attività">
            ${y ? `<button class="chip" data-filter="anno" aria-pressed="${mode === 'anno'}">La mia classe: ${YEARS[y - 1].name}</button>` : ''}
            ${ind ? `<button class="chip" data-filter="indirizzo" aria-pressed="${mode === 'indirizzo'}">Per ${esc(ind.name)}</button>` : ''}
            <button class="chip" data-filter="tutte" aria-pressed="${mode === 'tutte'}">Tutto il programma</button>
            <button class="chip" data-topics aria-expanded="${mode.startsWith('area:')}">Per argomento ${icons.chevron || '▾'}</button>
          </div>
          <div class="chips topics" data-topic-list ${mode.startsWith('area:') ? '' : 'hidden'}>
            ${areas.map((a) => `<button class="chip" data-filter="area:${a.id}" aria-pressed="${mode === 'area:' + a.id}" style="--hue:${a.hue}">${esc(a.title)}</button>`).join('')}
          </div>
        </div>
        <div class="map" data-map>
          ${list.map((a) => areaBlock(app, a)).join('') || '<p>Nessuna attività per questo filtro.</p>'}
        </div>
      </div>
      <aside class="stack">
        <section class="panel">
          <div class="goalbox">
            <div class="big-ring" style="--p:${p.ratio}"><span>${p.xp}<br><small class="muted">/${p.goal}</small></span></div>
            <div><h3 style="margin:0">Obiettivo di oggi</h3><p class="muted" style="margin:0">${p.reached ? 'Raggiunto! Da qui è tutto extra.' : `Mancano ${p.goal - p.xp} XP.`}</p></div>
          </div>
          <div class="week" aria-label="Serie degli ultimi sette giorni">
            ${strip.map((w) => `<div class="${w.done ? 'done' : w.frozen ? 'frozen' : ''} ${w.today ? 'today' : ''}"><i>${w.done ? icons.flame : w.frozen ? icons.ice : ''}</i>${dn[(new Date(w.day + 'T12:00').getDay() + 6) % 7]}</div>`).join('')}
          </div>
          ${s.streak.lost ? `<p style="margin:12px 0 0;color:var(--flame)"><b>Ripara la serie:</b> completa ${G.REPAIR_LESSONS - s.streak.lost.progress} ${G.REPAIR_LESSONS - s.streak.lost.progress === 1 ? 'lezione' : 'lezioni'} oggi e torni a ${s.streak.lost.value + 1} giorni.</p>` : ''}
        </section>
        <section class="panel">
          <div class="spread"><h3 style="margin:0">Missioni di oggi</h3><span class="muted" style="font-size:.85rem">si rinnovano a mezzanotte</span></div>
          <div class="quests" style="margin-top:10px">
            ${s.quests.list.map((q, k) => `
              <div class="quest ${q.progress >= q.target ? 'done' : ''}">
                <b>${esc(q.text)}</b>
                ${q.claimed ? `<span class="muted">${icons.check.replace('<svg', '<svg width="20" height="20"')}</span>` : q.progress >= q.target ? `<button class="btn gold" data-claim="${k}">+${q.reward} Δ</button>` : `<span class="reward">${icons.coin}${q.reward}</span>`}
                <div class="bar gold"><i style="width:${(q.progress / q.target) * 100}%"></i></div>
              </div>`).join('')}
          </div>
          <div class="chestline" aria-label="Forziere della settimana">
            ${G.CHEST_TIERS.map((t, k) => {
              const opened = s.chest.opened.includes(k);
              const ready = !opened && s.chest.points >= t.points;
              return `<button class="chest ${ready ? 'ready' : ''} ${opened ? 'opened' : ''}" data-chest="${k}" ${ready ? '' : 'disabled'} aria-label="${t.name}">${icons.chest(opened, ['hsl(28 60% 50%)', 'hsl(210 10% 70%)', 'var(--gold)'][k])}<span class="num">${Math.min(s.chest.points, t.points)}/${t.points}</span></button>`;
            }).join('')}
          </div>
          <p class="muted" style="font-size:.82rem;margin:8px 0 0">Ogni missione riscattata vale un punto per i forzieri della settimana.</p>
        </section>
      </aside>
    </div>`;

  app.main.querySelector('[data-topics]').addEventListener('click', (e) => {
    const list = app.main.querySelector('[data-topic-list]');
    list.hidden = !list.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!list.hidden));
    sfx.tap();
  });
  app.main.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); viewHome(app, b.dataset.filter); }));
  app.main.querySelectorAll('[data-claim]').forEach((b) =>
    b.addEventListener('click', () => {
      const got = G.claimQuest(s, +b.dataset.claim);
      if (!got) return;
      sfx.coin();
      flyText(b, `+${got.coins} Δ`, 'gold');
      app.save();
      app.chrome();
      setTimeout(() => viewHome(app, mode), 350);
    }),
  );
  app.main.querySelectorAll('[data-chest]').forEach((b) =>
    b.addEventListener('click', async () => {
      const k = +b.dataset.chest;
      const got = G.openChest(s, k);
      if (!got) return;
      app.save();
      app.chrome();
      confetti();
      sfx.level();
      const parts = [`<b>${got.coins} Δ</b>`];
      if (got.freeze) parts.push('un congelamento della serie');
      if (got.item) parts.push(`l'oggetto <b>${esc(itemInfo(got.item)?.name || '')}</b>`);
      await modal({ art: icons.chest(true), title: G.CHEST_TIERS[k].name, body: `Dentro c'erano ${parts.join(', ')}.`, actions: [{ label: 'Evvai', value: true }] });
      viewHome(app, mode);
    }),
  );
  app.main.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); openActivity(app, byId[el.dataset.open]); }));
}

function areaBlock(app, area) {
  const s = app.state;
  const d = app.today();
  return `<section class="unit-area" style="--hue:${area.hue}">
    <div class="section-title" style="margin-top:4px"><h2>${esc(area.title)}</h2><span class="muted" style="font-size:.85rem">${esc(area.summary)}</span></div>
    ${area.activities.map((act) => {
      const st = s.activities[act.id];
      const isDue = st?.due && st.due <= d;
      return `<div class="unit">
        <button class="unit-head" data-open="${act.id}" aria-label="Dettagli: ${esc(act.title)}">
          <span class="unit-glyph">${esc(act.glyph)}</span>
          <span><h3>${esc(act.title)}</h3><small>${esc(act.summary)}</small></span>
          ${stars(st?.stars || 0, act.levels.length)}
        </button>
        <div class="path">
          ${act.levels.map((lv, k) => {
            const level = k + 1;
            const open = levelOpen(app, act, level);
            const done = (st?.stars || 0) >= level;
            const current = open && !done && (st?.stars || 0) === k;
            const x = [0, 1, 2, 1][k % 4];
            const sub = done ? (isDue && level === st.stars ? 'Da ripassare oggi' : 'Superato: rigioca con numeri nuovi') : open ? lv.desc : `Supera il livello ${level - 1} per sbloccarlo`;
            const inner = `<span class="sq">${done ? icons.check : open ? level : icons.lock.replace('<svg', '<svg width="26" height="26"')}</span><span class="label"><b>${esc(lv.name)}</b><small>${esc(sub)}</small></span>`;
            return open
              ? `<a class="node ${done ? 'done' : ''} ${current ? 'current' : ''} ${isDue && done ? 'due' : ''}" style="--x:${x}" href="#/lezione/${act.id}/${level}">${inner}</a>`
              : `<div class="node locked" style="--x:${x}" aria-disabled="true">${inner}</div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </section>`;
}

/** Scheda dell'attività: competenze, anni, livelli */
export function openActivity(app, act) {
  if (!act) return;
  const st = app.state.activities[act.id];
  const wrap = document.createElement('div');
  wrap.className = 'sheet-backdrop';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-t" style="--hue:${act.hue}">
    <div class="grab"></div>
    <div class="spread"><span class="unit-glyph">${esc(act.glyph)}</span><button class="icon-btn" data-x aria-label="Chiudi">${icons.close}</button></div>
    <h2 id="sheet-t" style="margin-top:10px">${esc(act.title)}</h2>
    <p class="muted">${esc(act.summary)}</p>
    <div class="mat-tags">
      <span class="badge-tag">${act.years.map((v) => v + 'ª').join(' ')} anno</span>
      <span class="badge-tag">INVALSI: ${esc(act.ambito)}</span>
      ${act.mat.map((m) => `<span class="badge-tag" title="${esc(MAT_LABELS[m] || '')}">${m}</span>`).join('')}
    </div>
    <p class="muted" style="font-size:.9375rem">${act.mat.map((m) => MAT_LABELS[m]).filter(Boolean).map(esc).join('; ')}.</p>
    ${(() => {
      const ind = INDIRIZZI_BY_ID[app.state.profile.indirizzo];
      if (!ind) return '';
      if (act.area === 'lavoro') return `<p class="for-you"><b>Per ${esc(ind.name)}.</b> Il profilo del tuo indirizzo chiede di: ${ind.pecup.map((x) => esc(x.charAt(0).toLowerCase() + x.slice(1))).join('; ')}.</p>`;
      return ind.focus[act.id] ? `<p class="for-you"><b>Utile per ${esc(ind.name)}:</b> ${esc(ind.focus[act.id].charAt(0).toLowerCase() + ind.focus[act.id].slice(1))}.</p>` : '';
    })()}
    <div class="levels">
      ${act.levels.map((lv, k) => {
        const open = levelOpen(app, act, k + 1);
        const done = (st?.stars || 0) > k;
        return `<a class="level-row ${open ? '' : 'locked'}" ${open ? `href="#/lezione/${act.id}/${k + 1}"` : 'aria-disabled="true"'}>
          <span class="n">${done ? icons.check.replace('<svg', '<svg width="22" height="22"') : k + 1}</span>
          <span><b>${esc(lv.name)}</b><br><small class="muted">${esc(lv.desc)}</small></span>
          ${open ? `<span class="btn" style="min-height:40px;padding:0 16px">${done ? 'Rigioca' : 'Gioca'}</span>` : icons.lock.replace('<svg', '<svg width="22" height="22"')}
        </a>`;
      }).join('')}
    </div>
    ${act.invalsi ? `<a class="btn-ghost wide" style="margin-top:12px;width:100%" href="#/simulazione/${act.invalsi}">Simulazione completa a tempo</a>` : ''}
  </div>`;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-x]')) close(); if (e.target.closest('a[href]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
  wrap.querySelector('[data-x]').focus();
  html(wrap.querySelector('.sheet .muted'), esc(act.summary));
}

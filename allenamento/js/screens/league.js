// Lega settimanale personale + classifica di classe (dai codici consegnati al docente).
import * as G from '../game/game.js';
import { icons, esc } from '../ui/dom.js';

const HUES = [28, 210, 45, 220, 350, 150, 190];

export function viewLeague(app) {
  const s = app.state;
  const lg = s.league;
  const tier = G.LEAGUES[lg.tier];
  const d = app.today();
  const end = G.addDays(lg.week, 7);
  const daysLeft = G.daysBetween(d, end);
  const goal = tier.promote;
  const floor = Math.round((goal === Infinity ? G.LEAGUES[lg.tier - 1].promote : goal) * 0.3);
  app.main.innerHTML = `
    <div class="grid-2">
      <div class="stack">
        <div class="spread"><h1 style="margin:0">Lega ${esc(tier.name)}</h1>${icons.gem(HUES[lg.tier], true)}</div>
        <section class="panel">
          <div class="spread"><b>Questa settimana</b><span class="muted">${daysLeft <= 1 ? 'termina stanotte' : `mancano ${daysLeft} giorni`}</span></div>
          <p class="num" style="font-size:2.4rem;margin:6px 0;font-weight:700">${lg.weekXp} <small class="muted" style="font-size:1rem">XP</small></p>
          ${goal !== Infinity ? `<div class="bar gold" role="progressbar" aria-valuenow="${Math.min(100, Math.round((lg.weekXp / goal) * 100))}"><i style="width:${Math.min(100, (lg.weekXp / goal) * 100)}%"></i></div>
            <p style="margin:8px 0 0">${lg.weekXp >= goal ? `<b style="color:var(--good)">Promozione assicurata</b>: lunedì passi in lega ${esc(G.LEAGUES[lg.tier + 1].name)}.` : `Con <b>${goal - lg.weekXp} XP</b> in più sali in lega ${esc(G.LEAGUES[lg.tier + 1].name)}.`}</p>` : '<p>Sei nella lega più alta: resta attivo per rimanerci.</p>'}
          ${lg.tier > 0 ? `<p class="muted" style="font-size:.88rem;margin:6px 0 0">${lg.weekXp < floor ? `Sotto i ${floor} XP si torna in lega ${esc(G.LEAGUES[lg.tier - 1].name)}.` : 'Sei al sicuro dalla retrocessione.'}</p>` : ''}
        </section>
        <section class="ladder" aria-label="Le leghe">
          ${G.LEAGUES.map((l, k) => `<div class="ladder-row ${k === lg.tier ? 'here' : k < lg.tier ? 'past' : ''}">${icons.gem(HUES[k], k === lg.tier)}<span><b>${esc(l.name)}</b><br><small class="muted">${l.promote === Infinity ? 'la vetta' : `${l.promote} XP a settimana per salire`}</small></span>${k === lg.tier ? '<span class="badge-tag">tu sei qui</span>' : ''}</div>`).reverse().join('')}
        </section>
      </div>
      <aside class="stack">
        <section class="panel">
          <h3>Classifica di classe</h3>
          <p>La classifica con i compagni la compone il docente: ognuno consegna il proprio <b>codice dei progressi</b> (dal Profilo) e la classifica appare sulla LIM.</p>
          <a class="btn wide" href="#/profilo/codice">Crea il mio codice</a>
        </section>
        ${lg.history.length ? `<section class="panel"><h3>Settimane passate</h3>${lg.history.slice(0, 8).map((h) => `<div class="spread" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="muted">dal ${new Date(h.week + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span><span class="num">${h.xp} XP</span><span>${h.result === 'up' ? 'promozione' : h.result === 'down' ? 'retrocessione' : 'stabile'}</span></div>`).join('')}</section>` : ''}
      </aside>
    </div>`;
}

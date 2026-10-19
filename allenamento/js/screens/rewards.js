// Premi: Δ, pass stagionale, negozio e armadio dell'avatar.
import * as G from '../game/game.js';
import { PARTS, SLOT_NAMES, avatarSVG, itemInfo, shopItems, unlockText } from '../game/avatar.js';
import { icons, esc, modal, toast } from '../ui/dom.js';
import { sfx, confetti, flyText } from '../ui/fx.js';

function preview(eq, id, size = 64) {
  const [slot, v] = id.split(':');
  return avatarSVG({ ...eq, [slot]: v }, { size, label: itemInfo(id)?.name || '' });
}

export function viewRewards(app, tab = 'pass') {
  const s = app.state;
  const eq = s.inventory.equipped;
  const tierNow = G.seasonTier(s);
  const rewards = G.seasonRewards(s.season.id);
  const into = s.season.xp - tierNow * G.SEASON_TIER_XP;
  const [y, m] = s.season.id.split('-').map(Number);
  const daysLeft = G.daysBetween(app.today(), G.dayKey(new Date(y, m, 1)));
  app.main.innerHTML = `
    <div class="spread"><h1 style="margin:0">Premi</h1><div class="coins-big" aria-label="${s.coins} Delta">${icons.coin}<span>${s.coins}</span></div></div>
    <p class="muted">I Δ si guadagnano con le lezioni, le missioni, i forzieri e la stagione. Non si comprano.</p>
    <div class="chips" role="tablist">
      <button class="chip" role="tab" data-tab="pass" aria-pressed="${tab === 'pass'}">Stagione</button>
      <button class="chip" role="tab" data-tab="shop" aria-pressed="${tab === 'shop'}">Negozio</button>
      <button class="chip" role="tab" data-tab="wardrobe" aria-pressed="${tab === 'wardrobe'}">Il mio avatar</button>
    </div>
    <div data-body></div>`;
  const body = app.main.querySelector('[data-body]');
  app.main.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); viewRewards(app, b.dataset.tab); }));

  if (tab === 'pass') {
    body.innerHTML = `
      <section class="panel">
        <div class="spread"><h2 style="margin:0">${esc(G.seasonName(s.season.id))}</h2><span class="muted">${daysLeft} giorni alla fine</span></div>
        <p style="margin:6px 0">Livello stagione <b class="num">${tierNow}</b>/30 · ${tierNow < 30 ? `${into}/${G.SEASON_TIER_XP} XP al prossimo` : 'completata'}</p>
        <div class="bar gold"><i style="width:${tierNow < 30 ? (into / G.SEASON_TIER_XP) * 100 : 100}%"></i></div>
        <div class="pass" style="margin-top:14px" data-pass>
          ${rewards.map((r) => {
            const reached = r.tier <= tierNow;
            const claimed = s.season.claimed.includes(r.tier);
            const prize = r.item ? preview(eq, r.item, 58) : r.freeze ? `<span style="color:var(--ice)">${icons.ice.replace('<svg', '<svg width="44" height="44"')}</span>` : `<span class="price" style="font-size:1.1rem">${icons.coin}${r.coins}</span>`;
            const name = r.item ? itemInfo(r.item)?.name : r.freeze ? 'Congelamento' : `${r.coins} Δ`;
            return `<div class="tier ${reached ? 'reached' : ''} ${claimed ? 'claimed' : ''}" ${r.tier === tierNow + 1 ? 'data-next' : ''}>
              <span class="t-n">${r.tier}</span><span class="t-prize">${prize}</span><small>${esc(name)}</small>
              ${claimed ? `<span class="muted">${icons.check.replace('<svg', '<svg width="20" height="20"')}</span>` : reached ? `<button class="btn gold" data-claim="${r.tier}">Prendi</button>` : `<span class="muted">${icons.lock.replace('<svg', '<svg width="18" height="18"')}</span>`}
            </div>`;
          }).join('')}
        </div>
      </section>`;
    const next = body.querySelector('[data-next]') || body.querySelector('.tier.reached:not(.claimed)');
    if (next) next.scrollIntoView({ inline: 'center', block: 'nearest' });
    body.querySelectorAll('[data-claim]').forEach((b) =>
      b.addEventListener('click', async () => {
        const t = +b.dataset.claim;
        const got = G.claimSeason(s, t);
        if (!got) return;
        app.save();
        app.chrome();
        sfx.coin();
        if (got.item) {
          confetti({ count: 70 });
          const ok = await modal({ art: preview(eq, got.item, 120), title: 'Nuovo oggetto!', body: `Hai sbloccato <b>${esc(itemInfo(got.item).name)}</b>.`, actions: [{ label: 'Dopo', value: false, ghost: true }, { label: 'Indossalo', value: true }] });
          if (ok) { G.equip(s, got.item); app.save(); }
        } else flyText(b, got.coins ? `+${got.coins} Δ` : '+1 congelamento', 'gold');
        viewRewards(app, 'pass');
      }),
    );
    return;
  }

  if (tab === 'shop') {
    const lvl = G.levelInfo(s.xp).level;
    const items = shopItems();
    body.innerHTML = `
      <section class="panel">
        <div class="spread"><div><h3 style="margin:0">Congelamento della serie</h3><small class="muted">Protegge la serie se salti un giorno. Ne hai ${s.streak.freezes} di ${G.FREEZE_MAX}.</small></div>
        <button class="btn" data-buy="freeze" ${s.streak.freezes >= G.FREEZE_MAX ? 'disabled' : ''}>${icons.coin.replace('<svg', '<svg width="18" height="18"')} ${G.FREEZE_PRICE}</button></div>
      </section>
      ${Object.keys(PARTS).map((slot) => {
        const list = items.filter((it) => it.slot === slot);
        if (!list.length) return '';
        return `<div class="section-title"><h2>${SLOT_NAMES[slot]}</h2></div><div class="shop">
          ${list.map((it) => {
            const owned = s.inventory.owned.includes(it.id);
            const locked = it.minLevel && lvl < it.minLevel;
            return `<div class="item">${preview(eq, it.id)}<b>${esc(it.name)}</b>
              ${owned ? '<span class="muted">Già tuo</span>' : locked ? `<span class="muted">${icons.lock.replace('<svg', '<svg width="16" height="16"')} livello ${it.minLevel}</span>` : `<button class="btn" data-buy="${it.id}" ${s.coins < it.price ? 'disabled' : ''}><span class="price" style="color:inherit">${icons.coin}${it.price}</span></button>`}
            </div>`;
          }).join('')}</div>`;
      }).join('')}
      <p class="muted" style="margin-top:16px">Alcuni oggetti si trovano solo nella stagione e nei forzieri.</p>`;
    body.querySelectorAll('[data-buy]').forEach((b) =>
      b.addEventListener('click', async () => {
        const id = b.dataset.buy;
        const item = id === 'freeze' ? { id } : items.find((x) => x.id === id);
        const r = G.buy(s, item);
        if (r.error) { toast(r.error); return; }
        app.save();
        app.chrome();
        sfx.coin();
        if (id !== 'freeze') {
          const ok = await modal({ art: preview(eq, id, 120), title: 'Acquistato!', body: `<b>${esc(item.name)}</b> è nel tuo armadio.`, actions: [{ label: 'Dopo', value: false, ghost: true }, { label: 'Indossalo', value: true }] });
          if (ok) { G.equip(s, id); app.save(); }
        } else toast('Congelamento aggiunto.', 'ice', icons.ice);
        viewRewards(app, 'shop');
      }),
    );
    return;
  }

  // armadio: tutti gli oggetti, con quelli ancora da sbloccare e il modo per averli
  const how = (slot, p) => (p.unlock ? `Regalo: ${unlockText(p.unlock)}` : p.season ? 'Nella stagione' : p.chest ? 'Nel forziere d\'oro' : p.price ? `Negozio${p.minLevel ? `, dal livello ${p.minLevel}` : ''}` : '');
  body.innerHTML = `
    <div class="grid-2">
      <section class="panel avatar-stage wardrobe-stage">${avatarSVG(eq, { size: 180 })}<p class="muted" style="margin-top:10px">${esc(s.profile.nickname)}</p></section>
      <div class="stack">
        ${Object.keys(PARTS).map((slot) => {
          const n = PARTS[slot].filter((p) => s.inventory.owned.includes(`${slot}:${p.id}`)).length;
          return `<section><div class="spread"><h3 style="margin:0">${SLOT_NAMES[slot]}</h3><span class="muted">${n}/${PARTS[slot].length}</span></div><div class="wardrobe">
            ${PARTS[slot].map((p) => {
              const id = `${slot}:${p.id}`;
              const own = s.inventory.owned.includes(id);
              return own
                ? `<button class="w-item" data-eq="${id}" aria-pressed="${eq[slot] === p.id}">${preview(eq, id, 56)}<span>${esc(p.name)}</span></button>`
                : `<div class="w-item locked" aria-disabled="true">${preview(eq, id, 56)}<span>${esc(p.name)}</span><small>${icons.lock.replace('<svg', '<svg width="13" height="13"')} ${esc(how(slot, p))}</small></div>`;
            }).join('')}
          </div></section>`;
        }).join('')}
      </div>
    </div>`;
  body.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => { G.equip(s, b.dataset.eq); app.save(); sfx.tap(); viewRewards(app, 'wardrobe'); }));
}

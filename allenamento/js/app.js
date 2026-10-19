// Stato condiviso dell'app, gestione degli eventi di gioco e barra superiore.
import * as G from './game/game.js';
import { avatarSVG, milestoneItems, itemInfo, unlockText } from './game/avatar.js';
import { icons, toast, modal, esc } from './ui/dom.js';
import { sfx, haptic, confetti, setFxSettings } from './ui/fx.js';
import { setIndirizzo } from '../activities/contesti.js';

const store = (() => {
  try {
    const s = window.localStorage;
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    const mem = {};
    return { getItem: (k) => mem[k] ?? null, setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k] };
  }
})();

export const app = {
  store,
  state: null,
  stopLesson: null,
  main: document.getElementById('main'),
  today: () => G.dayKey(new Date()),
  save() { G.save(store, this.state); },
  teacherMode() { return new URLSearchParams(location.search).has('docente') || this.state.settings.teacher; },
  avatar(size = 64) { return avatarSVG(this.state.inventory.equipped, { size }); },

  /** XP con gestione di livelli e missioni. Restituisce gli XP effettivi. */
  addXp(n, { combo = 0 } = {}) {
    const d = this.today();
    const before = G.dailyProgress(this.state, d).reached;
    const { xp, events } = G.addXp(this.state, d, n);
    if (combo) events.push(...G.track(this.state, d, 'combo', combo, true));
    if (!before && G.dailyProgress(this.state, d).reached) events.push({ type: 'goal-reached' });
    this.save();
    this.chrome();
    this.handle(events);
    return xp;
  },
  track(kind, amount = 1, max = false) {
    this.handle(G.track(this.state, this.today(), kind, amount, max));
    this.save();
  },

  /** Avvisi e festeggiamenti per gli eventi di gioco */
  /** Regali dei traguardi (livello, serie, lezioni perfette, lampo, lega): oggetti dell'avatar */
  milestones() {
    const s = this.state;
    if (!s) return [];
    const got = milestoneItems({ level: G.levelInfo(s.xp).level, streak: s.streak.best, perfect: s.stats.perfect, speed: s.speed.best, league: s.league.tier }, s.inventory.owned);
    for (const id of got) s.inventory.owned.push(id);
    if (got.length) this.save();
    return got.map((id) => ({ type: 'item-gift', item: id }));
  },
  async handle(events) {
    events = events.concat(this.milestones());
    // più livelli in un colpo solo: un unico festeggiamento per il livello più alto
    const ups = events.filter((e) => e.type === 'level-up');
    if (ups.length > 1) events = events.filter((e) => e.type !== 'level-up' || e === ups[ups.length - 1]).map((e) => (e === ups[ups.length - 1] ? { ...e, coins: ups.reduce((n, u) => n + u.coins, 0) } : e));
    for (const e of events) {
      switch (e.type) {
        case 'freeze-used': toast(`${e.count === 1 ? 'Un congelamento ha' : e.count + ' congelamenti hanno'} protetto la tua serie.`, 'ice', icons.ice); break;
        case 'streak-lost': toast(`La serie di ${e.was} giorni si è spezzata. Completa ${G.REPAIR_LESSONS} lezioni oggi per ripararla.`, 'flame', icons.flame); break;
        case 'repair-progress': toast(`Riparazione della serie: ${e.progress} di ${e.need} lezioni.`, 'flame', icons.flame); break;
        case 'streak-repaired': confetti({ count: 80 }); toast(`Serie riparata: ${e.current} giorni!`, 'flame', icons.flame); break;
        case 'freeze-earned': toast(`Hai guadagnato un congelamento: ne hai ${e.freezes}.`, 'ice', icons.ice); break;
        case 'league-up': this.queueModal({ art: icons.gem(G.LEAGUES[e.tier] ? 40 + e.tier * 45 : 45, true), title: `Promozione in lega ${G.LEAGUES[e.tier].name}!`, body: `La settimana scorsa hai fatto ${e.xp} XP.` }); break;
        case 'league-down': toast(`Settimana tranquilla: sei in lega ${G.LEAGUES[e.tier].name}. Si riparte!`); break;
        case 'level-up': this.queueModal({ art: this.avatar(120), title: `Livello ${e.level}!`, body: `Hai sbloccato nuovi oggetti nel negozio e guadagnato <b>${e.coins} Δ</b>.`, sound: 'level' }); break;
        case 'quest-done': toast(`Missione completata: <b>${esc(e.quest.text)}</b>. Riscatta il premio nella home.`, 'gold', icons.gift); haptic([20, 40, 20]); break;
        case 'goal-reached': toast('Obiettivo di oggi raggiunto!', 'good', icons.check); sfx.coin(); break;
        case 'badge': toast(`Nuovo traguardo: <b>${esc(e.badge.name)}</b> (${G.TIER_NAMES[e.tier - 1]}) +${e.coins} Δ`, 'gold', icons.medal(e.tier)); break;
        case 'speed-record': toast(`Nuovo record nella sfida lampo: ${e.score}! +${e.coins} Δ`, 'gold', icons.bolt); break;
        case 'item-gift': {
          const it = itemInfo(e.item);
          const preview = avatarSVG({ ...this.state.inventory.equipped, [it.slot]: it.id }, { size: 120 });
          this.queueModal({ art: preview, title: 'Regalo sbloccato!', body: `Per ${esc(unlockText(it.unlock))} ricevi <b>${esc(it.name)}</b>. Lo trovi nell'armadio, in Premi.`, sound: 'level' });
          break;
        }
        case 'puzzle-solved': toast(`Enigma risolto! +${e.coins} Δ`, 'gold', icons.puzzle); break;
        default: break;
      }
    }
    this.chrome();
  },
  _modals: [],
  _modalBusy: false,
  queueModal(m) {
    this._modals.push(m);
    // si aspetta un attimo: se sta partendo una lezione, i festeggiamenti restano in coda fino alla fine
    setTimeout(() => { if (!this._modalBusy && !document.body.classList.contains('in-lesson')) this.flushModals(); }, 60);
  },
  async flushModals() {
    this._modalBusy = true;
    while (this._modals.length) {
      // durante una lezione i festeggiamenti aspettano la fine: niente interruzioni a metà esercizio
      if (document.body.classList.contains('in-lesson')) break;
      const m = this._modals.shift();
      if (m.sound === 'level') { sfx.level(); confetti(); } else sfx.done();
      await modal({ art: m.art, title: m.title, body: m.body, actions: [{ label: 'Fantastico', value: true }] });
    }
    this._modalBusy = false;
  },

  /** Barra superiore e badge sulle schede */
  chrome() {
    const s = this.state;
    if (!s) return;
    const d = this.today();
    const p = G.dailyProgress(s, d);
    const top = document.getElementById('topbar');
    const done = s.streak.lastDay === d;
    top.innerHTML = `
      <a class="brand" href="#/" aria-label="Orfini Math Quest, home">${icons.brand}<span class="brand-words"><span class="brand-title">ORFINI</span><span class="brand-sub">MATH QUEST</span></span></a>
      <a class="site-link" href="../" title="Torna al sito Orfini Math Lab"><span class="site-link-long">Orfini </span>Math Lab</a>
      <a class="pill flame ${done ? '' : 'cold'}" href="#/profilo" title="${done ? 'Serie aggiornata oggi' : 'Completa una lezione per allungare la serie'}" aria-label="Serie: ${s.streak.current} giorni">${icons.flame}<span class="num">${s.streak.current}</span></a>
      <a class="pill coin" href="#/premi" aria-label="${s.coins} Delta">${icons.coin}<span class="num">${s.coins}</span></a>
      <a class="pill" href="#/" title="XP di oggi: ${p.xp} su ${p.goal}" aria-label="XP di oggi ${p.xp} su ${p.goal}"><span class="ring" style="--p:${p.ratio}"></span><span class="num">${p.xp}</span></a>`;
    const claimable = s.quests.list.some((q) => q.progress >= q.target && !q.claimed) || G.CHEST_TIERS.some((t, i) => s.chest.points >= t.points && !s.chest.opened.includes(i));
    const seasonClaim = G.seasonRewards(s.season.id).some((r) => r.tier <= G.seasonTier(s) && !s.season.claimed.includes(r.tier));
    const dueToday = G.dueReviews(s, d).length > 0 || s.puzzle.day !== d || !s.puzzle.solved;
    const route = location.hash.split('/')[1] || '';
    const tabs = [
      { id: '', label: 'Percorso', icon: icons.map, dot: claimable },
      { id: 'sfide', label: 'Sfide', icon: icons.bolt, dot: dueToday },
      { id: 'lega', label: 'Lega', icon: icons.trophy },
      { id: 'premi', label: 'Premi', icon: icons.gift, dot: seasonClaim },
      { id: 'profilo', label: 'Profilo', icon: icons.user },
    ];
    const active = ['area', 'lezione', 'ripasso'].includes(route) ? '' : ['lampo', 'enigma', 'simulazione'].includes(route) ? 'sfide' : route === 'docente' ? 'profilo' : route;
    document.getElementById('tabbar').innerHTML = tabs
      .map((t) => `<a class="tab" href="#/${t.id}" ${t.id === active ? 'aria-current="page"' : ''}>${t.icon}<span>${t.label}</span>${t.dot ? '<span class="dot" aria-label="novità"></span>' : ''}</a>`)
      .join('');
  },

  applySettings() {
    const s = this.state.settings;
    document.documentElement.classList.toggle('lim', !!s.lim);
    document.documentElement.classList.toggle('big-text', !!s.bigText);
    setIndirizzo(this.state.profile.indirizzo || null);
    setFxSettings(s);
  },
};

export function setTheme(light) {
  document.documentElement.classList.toggle('theme-light', light);
  document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
  try { localStorage.setItem('orfini_theme', light ? 'light' : 'dark'); } catch { /* niente memoria */ }
}

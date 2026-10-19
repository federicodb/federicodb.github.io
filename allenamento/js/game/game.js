// Dinamiche di gioco di Orfini Math Quest.
// Ispirate alle app più usate dai ragazzi (serie e missioni giornaliere, leghe, pass stagionale,
// forzieri, livelli, personalizzazione dell'avatar, sfide a tempo, enigma del giorno),
// ma con regole sane: niente acquisti, niente premi casuali, niente punizioni per gli errori.
// Ogni premio si guadagna facendo matematica.
// Le funzioni ricevono `today` (YYYY-MM-DD): niente dipendenze dall'orologio, quindi testabili.

export const STORAGE_KEY = 'orfini_quest_v2';
const OLD_KEY = 'orfini_percorsi_v1';

// ---------------------------------------------------------------------------
// Costanti di gioco
// ---------------------------------------------------------------------------
export const LEAGUES = [
  { id: 'bronzo', name: 'Bronzo', promote: 150 },
  { id: 'argento', name: 'Argento', promote: 250 },
  { id: 'oro', name: 'Oro', promote: 380 },
  { id: 'zaffiro', name: 'Zaffiro', promote: 520 },
  { id: 'rubino', name: 'Rubino', promote: 680 },
  { id: 'smeraldo', name: 'Smeraldo', promote: 850 },
  { id: 'diamante', name: 'Diamante', promote: Infinity },
];
const DEMOTE_FRACTION = 0.3;

export const XP = { firstTry: 10, secondTry: 5, twin: 8, lesson: 20, perfect: 15, review: 15, puzzle: 30 };
export const COINS = { lesson: 10, perfect: 5, levelUp: 25, puzzle: 15, speedRecord: 10, quest: 15 };

export function comboMultiplier(combo) {
  if (combo >= 10) return 2.5;
  if (combo >= 8) return 2;
  if (combo >= 5) return 1.5;
  if (combo >= 3) return 1.25;
  return 1;
}

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];
export const FREEZE_MAX = 3;
export const FREEZE_EVERY = 7;
export const FREEZE_PRICE = 60;
export const REPAIR_LESSONS = 3; // lezioni per riparare una serie appena persa
export const REPAIR_WINDOW = 2; // giorni entro cui si può riparare

export const DAILY_GOALS = [
  { xp: 20, name: 'Leggero' },
  { xp: 50, name: 'Regolare' },
  { xp: 90, name: 'Intenso' },
  { xp: 150, name: 'Da maratona' },
];

/** XP totali necessari per raggiungere il livello L (L=1 → 0) */
export const xpForLevel = (L) => 40 * (L - 1) * L;
export function levelInfo(xp) {
  let L = 1;
  while (xpForLevel(L + 1) <= xp) L++;
  const base = xpForLevel(L);
  const next = xpForLevel(L + 1);
  return { level: L, into: xp - base, need: next - base, ratio: (xp - base) / (next - base) };
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
export function addDays(k, n) {
  const dt = fromKey(k);
  dt.setDate(dt.getDate() + n);
  return dayKey(dt);
}
export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}
export function weekStart(k) {
  const dt = fromKey(k);
  return addDays(k, -((dt.getDay() + 6) % 7));
}
export const seasonId = (k) => k.slice(0, 7);

/** Numero pseudo-casuale deterministico da una stringa (stesso giorno => stesse missioni per tutti) */
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Stato
// ---------------------------------------------------------------------------
export function freshState(today) {
  return {
    version: 2,
    profileId: newProfileId(),
    created: today,
    profile: { nickname: '', year: null, focus: null, indirizzo: undefined, teacherName: '', classLabel: '' },
    onboarded: false,
    xp: 0,
    coins: 30,
    days: {},
    dailyGoal: 50,
    streak: { current: 0, best: 0, lastDay: null, freezes: 1, frozen: [], lost: null },
    league: { tier: 0, week: weekStart(today), weekXp: 0, history: [] },
    activities: {},
    badges: {},
    stats: { lessons: 0, perfect: 0, answers: 0, firstTry: 0, twins: 0, bestCombo: 0, reviews: 0, speedRuns: 0, puzzles: 0, invalsiSims: 0, quests: 0, chests: 0 },
    quests: { day: null, list: [] },
    chest: { week: weekStart(today), points: 0, opened: [] },
    season: { id: seasonId(today), xp: 0, claimed: [] },
    inventory: {
      owned: ['shape:circle', 'shape:triangle', 'shape:square', 'color:cyan', 'color:violet', 'color:green', 'eyes:dots', 'eyes:happy', 'mouth:none', 'mouth:smile', 'acc:none', 'sticker:none', 'bg:plain'],
      equipped: { shape: 'circle', color: 'cyan', eyes: 'dots', mouth: 'smile', acc: 'none', sticker: 'none', bg: 'plain' },
    },
    speed: { best: 0, bestDay: null, runs: 0 },
    puzzle: { day: null, solved: false, attempts: 0, streak: 0, lastSolved: null },
    invalsi: { best10: null, best13: null },
    settings: { sound: true, haptics: true, teacher: false, lim: false },
  };
}

export function load(storage, today) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 2) return upgrade(s, today);
    }
    const old = storage.getItem(OLD_KEY);
    if (old) return migrateV1(JSON.parse(old), today);
  } catch {
    /* dati illeggibili: si riparte */
  }
  return freshState(today);
}

/** Aggiunge campi nuovi a salvataggi di versioni precedenti dell'app */
function upgrade(s, today) {
  const f = freshState(today);
  for (const k of Object.keys(f)) if (s[k] === undefined) s[k] = f[k];
  for (const k of ['stats', 'settings', 'profile', 'speed', 'puzzle', 'invalsi']) s[k] = { ...f[k], ...s[k] };
  s.inventory.equipped = { ...f.inventory.equipped, ...s.inventory.equipped };
  for (const id of ['mouth:none', 'mouth:smile', 'sticker:none']) if (!s.inventory.owned.includes(id)) s.inventory.owned.push(id);
  return s;
}

function migrateV1(o, today) {
  const s = freshState(today);
  s.xp = o.xp || 0;
  s.days = o.days || {};
  s.dailyGoal = o.dailyGoal || 50;
  s.streak = { ...s.streak, ...(o.streak || {}), lost: null };
  s.activities = o.activities || {};
  s.badges = o.badges || {};
  s.stats = { ...s.stats, ...(o.stats || {}) };
  s.settings = { ...s.settings, ...(o.settings || {}) };
  if (o.league) s.league = { ...s.league, ...o.league, tier: Math.min(o.league.tier || 0, LEAGUES.length - 1) };
  return s;
}

// ---------------------------------------------------------------------------
// Più utenti sullo stesso dispositivo (es. LIM, tablet di classe)
// L'utente attivo resta in STORAGE_KEY (lo legge anche la home del sito); gli altri sono "parcheggiati"
// in PROFILES_KEY. Nessun'altra chiave del sito (giochi, classifiche) viene toccata.
// ---------------------------------------------------------------------------
export const PROFILES_KEY = 'orfini_quest_profili';

const newProfileId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

export function loadProfiles(storage) {
  try {
    const list = JSON.parse(storage.getItem(PROFILES_KEY) || '[]');
    return Array.isArray(list) ? list.filter((p) => p && p.version === 2 && p.profileId) : [];
  } catch {
    return [];
  }
}

function saveProfiles(storage, list) {
  try {
    if (list.length) storage.setItem(PROFILES_KEY, JSON.stringify(list));
    else storage.removeItem(PROFILES_KEY);
  } catch {
    /* memoria piena o non disponibile */
  }
}

/** Parcheggia l'utente attivo (se ha completato il primo avvio) e attiva `targetId`, o un utente nuovo se manca.
 *  Restituisce lo stato del nuovo utente attivo, già salvato. */
export function switchProfile(storage, current, targetId, today) {
  const list = loadProfiles(storage).filter((p) => p.profileId !== current.profileId);
  if (current.onboarded) list.push(current);
  const target = list.find((p) => p.profileId === targetId);
  const next = target ? load({ getItem: (k) => (k === STORAGE_KEY ? JSON.stringify(target) : null) }, today) : freshState(today);
  saveProfiles(storage, list.filter((p) => p.profileId !== next.profileId));
  save(storage, next);
  return next;
}

export function deleteProfile(storage, id) {
  saveProfiles(storage, loadProfiles(storage).filter((p) => p.profileId !== id));
}

export function save(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* memoria piena o non disponibile */
  }
}

// ---------------------------------------------------------------------------
// Passaggio dei giorni: serie, leghe, missioni, stagione
// ---------------------------------------------------------------------------
export function rollover(state, today) {
  const events = [];
  const st = state.streak;
  if (st.lastDay && st.current > 0) {
    const missed = daysBetween(st.lastDay, today) - 1;
    if (missed > 0) {
      if (missed <= st.freezes) {
        st.freezes -= missed;
        for (let i = 1; i <= missed; i++) st.frozen.push(addDays(st.lastDay, i));
        st.lastDay = addDays(today, -1);
        events.push({ type: 'freeze-used', count: missed });
      } else {
        // la serie si può riparare entro REPAIR_WINDOW giorni facendo REPAIR_LESSONS lezioni
        st.lost = { value: st.current, on: today, progress: 0, lastDay: st.lastDay };
        events.push({ type: 'streak-lost', was: st.current });
        st.current = 0;
      }
    }
  }
  if (st.lost && daysBetween(st.lost.on, today) >= REPAIR_WINDOW) st.lost = null;
  st.frozen = st.frozen.filter((d) => daysBetween(d, today) <= 40);

  // leghe settimanali
  const lg = state.league;
  const thisWeek = weekStart(today);
  while (lg.week < thisWeek) {
    const tier = LEAGUES[lg.tier];
    const floor = (tier.promote === Infinity ? LEAGUES[lg.tier - 1].promote : tier.promote) * DEMOTE_FRACTION;
    let result = 'stay';
    if (lg.weekXp >= tier.promote && lg.tier < LEAGUES.length - 1) { lg.tier++; result = 'up'; }
    else if (lg.tier > 0 && lg.weekXp < floor) { lg.tier--; result = 'down'; }
    lg.history.unshift({ week: lg.week, xp: lg.weekXp, tier: LEAGUES[lg.tier].id, result });
    lg.history = lg.history.slice(0, 12);
    if (result !== 'stay' || lg.weekXp > 0) events.push({ type: 'league-' + result, tier: lg.tier, xp: lg.weekXp });
    lg.weekXp = 0;
    lg.week = addDays(lg.week, 7);
  }
  // forziere settimanale
  if (state.chest.week !== thisWeek) state.chest = { week: thisWeek, points: 0, opened: [] };
  // stagione mensile
  if (state.season.id !== seasonId(today)) state.season = { id: seasonId(today), xp: 0, claimed: [] };
  // missioni del giorno
  if (state.quests.day !== today) state.quests = { day: today, list: makeQuests(state, today) };
  return events;
}

// ---------------------------------------------------------------------------
// XP, livelli, monete
// ---------------------------------------------------------------------------
export function addXp(state, today, amount) {
  const xp = Math.round(amount);
  const before = levelInfo(state.xp).level;
  state.xp += xp;
  const day = (state.days[today] ||= { xp: 0, done: false });
  day.xp += xp;
  state.league.weekXp += xp;
  state.season.xp += xp;
  const events = [];
  const after = levelInfo(state.xp).level;
  for (let L = before + 1; L <= after; L++) {
    state.coins += COINS.levelUp;
    events.push({ type: 'level-up', level: L, coins: COINS.levelUp });
  }
  events.push(...track(state, today, 'xp', xp));
  return { xp, events };
}

export function addCoins(state, n) {
  state.coins += n;
  return n;
}

// ---------------------------------------------------------------------------
// Serie
// ---------------------------------------------------------------------------
export function markDayDone(state, today) {
  const events = [];
  const day = (state.days[today] ||= { xp: 0, done: false });
  const st = state.streak;
  // riparazione di una serie appena persa
  if (st.lost) {
    st.lost.progress++;
    if (st.lost.progress >= REPAIR_LESSONS) {
      st.current = st.lost.value + 1;
      for (let d = addDays(st.lost.lastDay, 1); d < today; d = addDays(d, 1)) st.frozen.push(d);
      st.lastDay = today;
      st.lost = null;
      day.done = true;
      if (st.current > st.best) st.best = st.current;
      events.push({ type: 'streak-repaired', current: st.current });
      return events;
    }
    events.push({ type: 'repair-progress', progress: st.lost.progress, need: REPAIR_LESSONS });
  }
  if (st.lastDay === today) { day.done = true; return events; }
  day.done = true;
  const continuing = st.lastDay && daysBetween(st.lastDay, today) === 1;
  st.current = continuing ? st.current + 1 : 1;
  st.lastDay = today;
  if (st.current > st.best) st.best = st.current;
  events.push({ type: 'streak-up', current: st.current });
  if (st.current % FREEZE_EVERY === 0 && st.freezes < FREEZE_MAX) {
    st.freezes++;
    events.push({ type: 'freeze-earned', freezes: st.freezes });
  }
  return events;
}

export function dailyProgress(state, today) {
  const xp = state.days[today]?.xp || 0;
  return { xp, goal: state.dailyGoal, ratio: Math.min(1, xp / state.dailyGoal), reached: xp >= state.dailyGoal };
}

export function weekStrip(state, today) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ day: k, done: !!state.days[k]?.done, frozen: state.streak.frozen.includes(k), today: k === today });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Missioni giornaliere e forziere settimanale
// ---------------------------------------------------------------------------
const QUEST_POOL = [
  { id: 'xp', text: (n) => `Guadagna ${n} XP`, target: (s) => Math.round(s.dailyGoal * 1.2 / 10) * 10, reward: 15 },
  { id: 'lessons', text: (n) => `Completa ${n} ${n === 1 ? 'lezione' : 'lezioni'}`, target: () => 2, reward: 15 },
  { id: 'combo', text: (n) => `Fai una combo da ${n}`, target: () => 5, reward: 20 },
  { id: 'firstTry', text: (n) => `${n} risposte giuste al primo colpo`, target: () => 12, reward: 15 },
  { id: 'perfect', text: () => 'Una lezione senza errori', target: () => 1, reward: 25 },
  { id: 'speed', text: (n) => `Fai almeno ${n} punti nella sfida lampo`, target: () => 8, reward: 20 },
  { id: 'puzzle', text: () => 'Risolvi l\'enigma del giorno', target: () => 1, reward: 20 },
  { id: 'twins', text: () => 'Risolvi un problema gemello', target: () => 1, reward: 15 },
  { id: 'review', text: () => 'Completa un ripasso', target: () => 1, reward: 20 },
  { id: 'newActivity', text: () => 'Prova un\'attività nuova', target: () => 1, reward: 20 },
];

export function makeQuests(state, today) {
  // sempre una missione di XP, più due scelte in modo deterministico dal giorno
  let h = hashSeed('quest' + today);
  const others = QUEST_POOL.filter((q) => q.id !== 'xp');
  const picked = [];
  while (picked.length < 2) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    const q = others[h % others.length];
    if (!picked.includes(q)) picked.push(q);
  }
  return [QUEST_POOL[0], ...picked].map((q) => {
    const target = q.target(state);
    return { id: q.id, text: q.text(target), target, progress: 0, reward: q.reward, claimed: false };
  });
}

/** Registra un evento per le missioni. `max` = vale il valore massimo (es. combo), non la somma. */
export function track(state, today, kind, amount = 1, max = false) {
  if (state.quests.day !== today) state.quests = { day: today, list: makeQuests(state, today) };
  const events = [];
  for (const q of state.quests.list) {
    if (q.id !== kind || q.progress >= q.target) continue;
    q.progress = max ? Math.max(q.progress, amount) : q.progress + amount;
    if (q.progress >= q.target) {
      q.progress = q.target;
      events.push({ type: 'quest-done', quest: q });
    }
  }
  return events;
}

export function claimQuest(state, idx) {
  const q = state.quests.list[idx];
  if (!q || q.claimed || q.progress < q.target) return null;
  q.claimed = true;
  state.coins += q.reward;
  state.chest.points += 1;
  state.stats.quests++;
  return { coins: q.reward };
}

export const CHEST_TIERS = [
  { points: 5, name: 'Forziere di bronzo', coins: 60 },
  { points: 12, name: 'Forziere d\'argento', coins: 120, freeze: 1 },
  { points: 21, name: 'Forziere d\'oro', coins: 220, item: 'acc:crown' },
];
const CHEST_ITEMS = ['acc:crown', 'sticker:crown'];

export function openChest(state, i) {
  const t = CHEST_TIERS[i];
  if (!t || state.chest.opened.includes(i) || state.chest.points < t.points) return null;
  state.chest.opened.push(i);
  state.coins += t.coins;
  const got = { coins: t.coins };
  if (t.freeze && state.streak.freezes < FREEZE_MAX) { state.streak.freezes++; got.freeze = 1; }
  const item = t.item ? CHEST_ITEMS.find((x) => !state.inventory.owned.includes(x)) : null;
  if (item) { state.inventory.owned.push(item); got.item = item; }
  else if (t.item) { state.coins += 80; got.coins += 80; }
  state.stats.chests++;
  return got;
}

// ---------------------------------------------------------------------------
// Pass stagionale (gratuito): 30 livelli al mese, si avanza con gli XP
// ---------------------------------------------------------------------------
export const SEASON_TIER_XP = 120;
export const SEASON_NAMES = ['Stagione Fibonacci', 'Stagione Pitagora', 'Stagione Euclide', 'Stagione Ipazia', 'Stagione Archimede', 'Stagione Noether',
  'Stagione Gauss', 'Stagione Lovelace', 'Stagione Eulero', 'Stagione Agnesi', 'Stagione Turing', 'Stagione Cartesio'];
export function seasonName(id) {
  return SEASON_NAMES[(+id.slice(5, 7) - 1) % 12];
}
export function seasonRewards(id = seasonId(dayKey(new Date()))) {
  const out = [];
  // metà stagione: oggetti esclusivi a rotazione (stile emoji); il resto dal negozio
  const odd = +String(id).slice(5, 7) % 2 === 1;
  const cosmetics = odd
    ? ['mouth:grin', 'eyes:star', 'sticker:heart', 'bg:dots', 'acc:headphones', 'mouth:laugh', 'shape:hexagon', 'eyes:tears',
      'bg:stars', 'eyes:cool', 'sticker:trophy', 'acc:rainbow', 'bg:aurora', 'color:rainbow', 'shape:delta']
    : ['color:gold', 'eyes:side', 'shape:pentagon', 'acc:flower', 'mouth:tongue', 'color:magenta', 'acc:sparkles', 'eyes:tears',
      'sticker:clover', 'mouth:laugh', 'shape:star', 'acc:rainbow', 'sticker:trophy', 'color:rainbow', 'shape:delta'];
  for (let t = 1; t <= 30; t++) {
    if (t % 2 === 0) out.push({ tier: t, item: cosmetics[t / 2 - 1] });
    else if (t % 5 === 0) out.push({ tier: t, freeze: 1 });
    else out.push({ tier: t, coins: 15 + t * 2 });
  }
  return out;
}
export function seasonTier(state) {
  return Math.min(30, Math.floor(state.season.xp / SEASON_TIER_XP));
}
export function claimSeason(state, tier) {
  const r = seasonRewards(state.season.id)[tier - 1];
  if (!r || state.season.claimed.includes(tier) || seasonTier(state) < tier) return null;
  state.season.claimed.push(tier);
  const got = {};
  if (r.coins) { state.coins += r.coins; got.coins = r.coins; }
  if (r.freeze) {
    if (state.streak.freezes < FREEZE_MAX) { state.streak.freezes++; got.freeze = 1; }
    else { state.coins += 40; got.coins = 40; }
  }
  if (r.item) {
    if (!state.inventory.owned.includes(r.item)) { state.inventory.owned.push(r.item); got.item = r.item; }
    else { state.coins += 50; got.coins = 50; }
  }
  return got;
}

// ---------------------------------------------------------------------------
// Negozio
// ---------------------------------------------------------------------------
export function buy(state, item) {
  if (item.id === 'freeze') {
    if (state.streak.freezes >= FREEZE_MAX) return { error: `Hai già ${FREEZE_MAX} congelamenti, il massimo.` };
    if (state.coins < FREEZE_PRICE) return { error: 'Non hai abbastanza Δ.' };
    state.coins -= FREEZE_PRICE;
    state.streak.freezes++;
    return { ok: true };
  }
  if (state.inventory.owned.includes(item.id)) return { error: 'Ce l\'hai già.' };
  if (item.minLevel && levelInfo(state.xp).level < item.minLevel) return { error: `Si sblocca al livello ${item.minLevel}.` };
  if (state.coins < item.price) return { error: 'Non hai abbastanza Δ.' };
  state.coins -= item.price;
  state.inventory.owned.push(item.id);
  return { ok: true };
}

export function equip(state, id) {
  if (!state.inventory.owned.includes(id)) return false;
  const [slot, val] = id.split(':');
  state.inventory.equipped[slot] = val;
  return true;
}

// ---------------------------------------------------------------------------
// Padronanza e ripasso
// ---------------------------------------------------------------------------
export function activityState(state, id) {
  return (state.activities[id] ||= { level: 1, stars: 0, box: 0, due: null, sessions: 0, lastScore: null, best: 0 });
}

export function recordLesson(state, today, { id, level, maxLevel, score, review = false }) {
  const isNew = !state.activities[id];
  const a = activityState(state, id);
  const events = [];
  a.sessions++;
  a.lastScore = score;
  a.best = Math.max(a.best || 0, score);
  const passed = score >= 0.8;
  if (passed && level >= a.stars + 1 && a.stars < maxLevel) {
    a.stars = level;
    events.push({ type: 'star', id, stars: a.stars });
  }
  if (passed && level === a.level && a.level < maxLevel) {
    a.level++;
    events.push({ type: 'level-unlocked', id, level: a.level });
  }
  if (passed) a.box = Math.min(REVIEW_INTERVALS.length - 1, a.box + (review || a.due ? 1 : 0));
  else a.box = Math.max(0, a.box - 1);
  a.due = addDays(today, REVIEW_INTERVALS[a.box]);
  if (review) state.stats.reviews++;
  else state.stats.lessons++;
  if (score === 1) state.stats.perfect++;
  events.push(...track(state, today, review ? 'review' : 'lessons'));
  if (score === 1) events.push(...track(state, today, 'perfect'));
  if (isNew && !review) events.push(...track(state, today, 'newActivity'));
  return events;
}

export function dueReviews(state, today) {
  return Object.entries(state.activities)
    .filter(([, a]) => a.due && a.due <= today)
    .sort((x, y) => (x[1].due < y[1].due ? -1 : 1))
    .map(([id]) => id);
}

// ---------------------------------------------------------------------------
// Sfide
// ---------------------------------------------------------------------------
export function recordSpeed(state, today, score) {
  const events = [];
  state.speed.runs++;
  state.stats.speedRuns++;
  if (score > state.speed.best) {
    if (state.speed.best > 0) {
      state.coins += COINS.speedRecord;
      events.push({ type: 'speed-record', score, coins: COINS.speedRecord });
    }
    state.speed.best = score;
    state.speed.bestDay = today;
  }
  events.push(...track(state, today, 'speed', score, true));
  return events;
}

export function recordPuzzle(state, today, solved) {
  const p = state.puzzle;
  if (p.day !== today) { p.day = today; p.solved = false; p.attempts = 0; }
  if (p.solved) return [];
  p.attempts++;
  if (!solved) return [];
  p.solved = true;
  p.streak = p.lastSolved && daysBetween(p.lastSolved, today) === 1 ? p.streak + 1 : 1;
  p.lastSolved = today;
  state.stats.puzzles++;
  state.coins += COINS.puzzle;
  return [{ type: 'puzzle-solved', coins: COINS.puzzle }, ...track(state, today, 'puzzle')];
}

// ---------------------------------------------------------------------------
// Traguardi (a gradi: bronzo, argento, oro)
// ---------------------------------------------------------------------------
export const BADGES = [
  { id: 'lezioni', name: 'Studente', desc: 'Lezioni completate', tiers: [1, 25, 100], value: (s) => s.stats.lessons },
  { id: 'serie', name: 'Costanza', desc: 'Giorni di serie', tiers: [3, 14, 60], value: (s) => s.streak.best },
  { id: 'perfette', name: 'Impeccabile', desc: 'Lezioni senza errori', tiers: [1, 10, 50], value: (s) => s.stats.perfect },
  { id: 'combo', name: 'In fiamme', desc: 'Combo migliore', tiers: [5, 10, 20], value: (s) => s.stats.bestCombo },
  { id: 'gemelli', name: 'Rimonta', desc: 'Gemelli risolti dopo un errore', tiers: [5, 30, 100], value: (s) => s.stats.twins },
  { id: 'ripassi', name: 'Memoria lunga', desc: 'Ripassi completati', tiers: [3, 20, 60], value: (s) => s.stats.reviews },
  { id: 'lampo', name: 'Fulmine', desc: 'Record della sfida lampo', tiers: [10, 20, 30], value: (s) => s.speed.best },
  { id: 'enigmi', name: 'Detective', desc: 'Enigmi del giorno risolti', tiers: [1, 10, 40], value: (s) => s.stats.puzzles },
  { id: 'stelle', name: 'Collezionista', desc: 'Stelle conquistate', tiers: [5, 30, 80], value: (s) => Object.values(s.activities).reduce((n, a) => n + (a.stars || 0), 0) },
  { id: 'missioni', name: 'Missionario', desc: 'Missioni completate', tiers: [5, 40, 150], value: (s) => s.stats.quests },
];
export const TIER_NAMES = ['bronzo', 'argento', 'oro'];

export function badgeTier(state, b) {
  const v = b.value(state);
  let t = 0;
  b.tiers.forEach((th, i) => { if (v >= th) t = i + 1; });
  return t;
}

export function checkBadges(state, today) {
  const won = [];
  for (const b of BADGES) {
    const t = badgeTier(state, b);
    const had = state.badges[b.id]?.tier || 0;
    if (t > had) {
      state.badges[b.id] = { tier: t, on: today };
      state.coins += 20 * t;
      won.push({ type: 'badge', badge: b, tier: t, coins: 20 * t });
    }
  }
  return won;
}

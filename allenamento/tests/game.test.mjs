import assert from 'node:assert/strict';
import * as G from '../js/game/game.js';
import { encode, decode, decodeMany, codePayload } from '../js/game/code.js';

const d0 = '2026-10-19'; // lunedì
assert.equal(G.weekStart('2026-10-25'), '2026-10-19');
assert.equal(G.addDays('2026-10-31', 1), '2026-11-01');

// livelli
assert.equal(G.levelInfo(0).level, 1);
assert.equal(G.levelInfo(79).level, 1);
assert.equal(G.levelInfo(80).level, 2);
let s = G.freshState(d0);
G.rollover(s, d0);
const r = G.addXp(s, d0, 250);
assert.equal(r.events.filter((e) => e.type === 'level-up').length, 2);
assert.equal(s.coins, 30 + 2 * G.COINS.levelUp);

// serie + congelamento + riparazione
s = G.freshState(d0);
G.rollover(s, d0); G.markDayDone(s, d0);
G.rollover(s, '2026-10-20'); G.markDayDone(s, '2026-10-20');
assert.equal(s.streak.current, 2);
let ev = G.rollover(s, '2026-10-22');
assert.equal(ev[0].type, 'freeze-used');
G.markDayDone(s, '2026-10-22'); assert.equal(s.streak.current, 3);
ev = G.rollover(s, '2026-10-25'); // due giorni saltati, nessun congelamento
assert.equal(ev[0].type, 'streak-lost'); assert.equal(s.streak.current, 0);
G.markDayDone(s, '2026-10-25'); assert.equal(s.streak.current, 1);
G.markDayDone(s, '2026-10-25');
ev = G.markDayDone(s, '2026-10-25');
assert.equal(ev[0].type, 'streak-repaired');
assert.equal(s.streak.current, 4); // 3 di prima + oggi
assert.ok(s.streak.frozen.includes('2026-10-23') && s.streak.frozen.includes('2026-10-24'));
G.rollover(s, '2026-10-26'); G.markDayDone(s, '2026-10-26'); assert.equal(s.streak.current, 5);
// la riparazione scade
let t = G.freshState(d0); G.rollover(t, d0); G.markDayDone(t, d0); t.streak.freezes = 0;
G.rollover(t, '2026-10-22'); assert.ok(t.streak.lost);
G.rollover(t, '2026-10-24'); assert.equal(t.streak.lost, null);

// missioni deterministiche e tracciamento
const a = G.freshState(d0), b = G.freshState(d0);
G.rollover(a, d0); G.rollover(b, d0);
assert.deepEqual(a.quests.list.map((q) => q.id), b.quests.list.map((q) => q.id));
assert.equal(a.quests.list[0].id, 'xp');
assert.equal(new Set(a.quests.list.map((q) => q.id)).size, 3);
G.addXp(a, d0, 1000);
assert.equal(a.quests.list[0].progress, a.quests.list[0].target);
const coins = a.coins;
assert.ok(G.claimQuest(a, 0)); assert.equal(a.coins, coins + a.quests.list[0].reward);
assert.equal(G.claimQuest(a, 0), null);
G.rollover(a, '2026-10-20'); assert.equal(a.quests.day, '2026-10-20');
// combo come massimo
const q = G.freshState(d0); q.quests = { day: d0, list: [{ id: 'combo', target: 5, progress: 0, reward: 1, claimed: false }] };
G.track(q, d0, 'combo', 3, true); G.track(q, d0, 'combo', 2, true); assert.equal(q.quests.list[0].progress, 3);

// forziere
const c = G.freshState(d0); G.rollover(c, d0); c.chest.points = 12;
assert.ok(G.openChest(c, 0)); assert.ok(G.openChest(c, 1)); assert.equal(G.openChest(c, 2), null); assert.equal(G.openChest(c, 0), null);

// stagione
const se = G.freshState(d0); G.rollover(se, d0);
G.addXp(se, d0, G.SEASON_TIER_XP * 2);
assert.equal(G.seasonTier(se), 2);
assert.ok(G.claimSeason(se, 1)); assert.ok(G.claimSeason(se, 2).item);
assert.equal(G.claimSeason(se, 3), null);
G.rollover(se, '2026-11-02'); assert.equal(se.season.xp, 0); assert.equal(se.season.id, '2026-11');
assert.equal(G.seasonRewards().length, 30);

// negozio
const sh = G.freshState(d0); sh.coins = 100;
assert.ok(G.buy(sh, { id: 'freeze' }).ok); assert.equal(sh.coins, 40); assert.equal(sh.streak.freezes, 2);
assert.ok(G.buy(sh, { id: 'color:orange', price: 60 }).error);
sh.coins = 100; assert.ok(G.buy(sh, { id: 'color:orange', price: 60 }).ok);
assert.ok(G.equip(sh, 'color:orange')); assert.equal(sh.inventory.equipped.color, 'orange');
assert.ok(G.buy(sh, { id: 'shape:star', price: 1, minLevel: 8 }).error);

// leghe
const l = G.freshState(d0); G.rollover(l, d0);
G.addXp(l, d0, 160); G.rollover(l, '2026-10-26'); assert.equal(l.league.tier, 1);
G.rollover(l, '2026-11-02'); assert.equal(l.league.tier, 0);

// padronanza
const m = G.freshState(d0); G.rollover(m, d0);
G.recordLesson(m, d0, { id: 'pit', level: 1, maxLevel: 3, score: 0.9 });
assert.equal(m.activities.pit.stars, 1); assert.equal(m.activities.pit.level, 2);
assert.deepEqual(G.dueReviews(m, '2026-10-20'), ['pit']);

// sfide
const sp = G.freshState(d0); G.rollover(sp, d0);
G.recordSpeed(sp, d0, 5); ev = G.recordSpeed(sp, d0, 9);
assert.equal(sp.speed.best, 9); assert.equal(ev[0].type, 'speed-record');
const pz = G.freshState(d0);
G.recordPuzzle(pz, d0, false); G.recordPuzzle(pz, d0, true);
assert.ok(pz.puzzle.solved); assert.equal(pz.puzzle.attempts, 2);
assert.deepEqual(G.recordPuzzle(pz, d0, true), []);

// traguardi a gradi
const bg = G.freshState(d0); bg.stats.lessons = 30;
const won = G.checkBadges(bg, d0); assert.equal(won.find((w) => w.badge.id === 'lezioni').tier, 2);
assert.equal(G.checkBadges(bg, d0).length, 0);

// migrazione da v1
const store = { data: { orfini_percorsi_v1: JSON.stringify({ version: 1, xp: 300, streak: { current: 4, best: 6, lastDay: d0, freezes: 2, frozen: [] }, activities: { pitagora: { stars: 2 } }, stats: { lessons: 3 } }) }, getItem(k) { return this.data[k] ?? null; }, setItem() {} };
const mig = G.load(store, d0);
assert.equal(mig.version, 2); assert.equal(mig.xp, 300); assert.equal(mig.streak.current, 4); assert.equal(mig.activities.pitagora.stars, 2);

// codice docente
globalThis.btoa ||= (s) => Buffer.from(s, 'binary').toString('base64');
globalThis.atob ||= (s) => Buffer.from(s, 'base64').toString('binary');
const st = G.freshState(d0); st.profile.teacherName = 'Mario Rossi'; st.profile.classLabel = '2 EL'; st.xp = 1234;
st.activities = { pitagora: { stars: 3, best: 1 } };
const code = encode(codePayload(st, d0, G.levelInfo));
const dec = decode(code); assert.equal(dec.data.n, 'Mario Rossi'); assert.equal(dec.data.xp, 1234); assert.deepEqual(dec.data.a.pitagora, [3, 100]);
const tampered = code.replace(/\.([A-Za-z0-9_-])/, (m, ch) => '.' + (ch === 'A' ? 'B' : 'A'));
assert.ok(decode(tampered).error);
assert.equal(decodeMany(`ciao ${code}\n${code}`).length, 2);
console.log('game OK');

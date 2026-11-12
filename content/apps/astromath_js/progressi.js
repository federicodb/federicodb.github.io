// PROGRESSI DI ASTROMATH — salvati solo nel browser dello studente, in una chiave sola.
// Nessun nome: il pilota ha una sigla di volo generata (es. FALCO-π).
// Dalla Quest si LEGGE soltanto (orfini_quest_v2: classe, indirizzo, stelle delle attività): non si scrive mai.

import { LIVELLI, LIVELLO_QUEST, attivitaDelLivello } from './livelli.js';

export const CHIAVE = 'orfini_astromath_v1';
const CHIAVE_QUEST = 'orfini_quest_v2';

const ANIMALI = ['FALCO', 'LINCE', 'VOLPE', 'ORSA', 'AQUILA', 'GRIFO', 'DELFINO', 'CIGNO', 'LUPO', 'CORVO', 'GHEPPIO', 'RONDINE'];
const SIMBOLI = ['π', 'Σ', '√', '∞', 'Δ', 'φ', 'θ', 'λ', 'Ω', 'μ'];

export function nuovaSigla(caso = Math.random) {
  return `${ANIMALI[Math.floor(caso() * ANIMALI.length)]}-${SIMBOLI[Math.floor(caso() * SIMBOLI.length)]}`;
}

export function statoNuovo() {
  return {
    v: 1,
    sigla: nuovaSigla(),
    livelli: {},
    badge: {},
    giorni: [],
    stats: { risposte: 0, primoColpo: 0, amente: 0, serieAmente: 0, surf: 0, stelle: 0 },
    impostazioni: { qualita: 'auto', volume: 0.7, vibrazione: true, effetti: null, contrasto: false, joystick: false },
    classifica: [],
  };
}

export function statoLivello(stato, id) {
  return (stato.livelli[id] ||= { stelle: [false, false, false, false, false, false], completo: false, record: 0, perfetto: false, volte: 0 });
}

export function carica(storage) {
  const s = statoNuovo();
  try {
    const o = JSON.parse(storage.getItem(CHIAVE) || 'null');
    if (o && o.v === 1) {
      Object.assign(s, o);
      s.stats = { ...statoNuovo().stats, ...o.stats };
      s.impostazioni = { ...statoNuovo().impostazioni, ...o.impostazioni };
    }
  } catch { /* dati illeggibili o archivio non disponibile: si riparte */ }
  return s;
}

export function salva(storage, stato) {
  try { storage.setItem(CHIAVE, JSON.stringify(stato)); } catch { /* memoria piena o archivio bloccato */ }
}

/** Quello che serve dalla Quest (sola lettura). Nessun profilo → valori vuoti. */
export function leggiQuest(storage) {
  try {
    const q = JSON.parse(storage.getItem(CHIAVE_QUEST) || 'null');
    if (!q || q.version !== 2) return { presente: false, classe: null, indirizzo: null, attivita: {} };
    const attivita = {};
    for (const [id, a] of Object.entries(q.activities || {})) attivita[id] = { stelle: a.stars || 0, migliore: a.best || 0 };
    const y = q.profile && Number.isInteger(q.profile.year) ? q.profile.year : null;
    return { presente: true, classe: y, indirizzo: (q.profile && q.profile.indirizzo) || null, attivita };
  } catch {
    return { presente: false, classe: null, indirizzo: null, attivita: {} };
  }
}

/** La stella è già "allenata" nella Quest: la Quest ha la stella di quel livello per quell'attività */
export function stellaAllenata(quest, attivita, livelloQuest) {
  const a = quest.attivita[attivita];
  return !!a && a.stelle >= livelloQuest;
}

/** Livello sbloccato: il primo, quelli dopo un livello completato, o quelli i cui argomenti precedenti sono già allenati nella Quest */
export function sbloccato(stato, quest, indice) {
  if (indice === 0) return { si: true, perQuest: false };
  const prima = LIVELLI[indice - 1];
  if (stato.livelli[prima.id]?.completo) return { si: true, perQuest: false };
  const ids = attivitaDelLivello(prima, quest.indirizzo);
  const allenati = ids.every((id) => (quest.attivita[id]?.stelle || 0) >= 1);
  return { si: allenati, perQuest: allenati };
}

// ---------------------------------------------------------------------------------------------
// Badge: ognuno dice cosa si è imparato a fare, non quanto si è giocato
// ---------------------------------------------------------------------------------------------
export const BADGE = [
  ...LIVELLI.map((l) => ({ id: `costellazione-${l.id}`, nome: l.nome, desc: `Tutte le stelle della costellazione «${l.nome}».`, glifo: '✦', tinta: l.tinta })),
  { id: 'primo-volo', nome: 'Primo volo', desc: 'La prima stella accesa.', glifo: '★', tinta: 50 },
  { id: 'a-mente', nome: 'A mente', desc: 'Cinque risposte giuste di fila al primo colpo, senza suggerimenti.', glifo: '◎', tinta: 172 },
  { id: 'perfetto', nome: 'Rotta perfetta', desc: 'Un livello intero con tutte le risposte giuste al primo colpo.', glifo: '◆', tinta: 285 },
  { id: 'surfista', nome: 'Surfista delle funzioni', desc: 'Tre secondi di fila sul grafico di una funzione.', glifo: '∿', tinta: 190 },
  { id: 'ponte-quest', nome: 'Allenato nella Quest', desc: 'Hai portato in volo una stella già conquistata nella Quest.', glifo: '⚑', tinta: 38 },
  { id: 'ostinato', nome: 'Non mi arrendo', desc: 'Una stella accesa con il problema gemello, dopo due errori.', glifo: '↻', tinta: 330 },
  { id: 'biennio', nome: 'Biennio tra le stelle', desc: 'Le costellazioni da «Numeri» a «Dati e previsioni».', glifo: '♁', tinta: 160 },
  { id: 'astromath', nome: 'AstroMath', desc: 'Tutte le costellazioni del cielo.', glifo: 'Ω', tinta: 0 },
];
export const BADGE_BY_ID = Object.fromEntries(BADGE.map((b) => [b.id, b]));

const oggi = () => new Date().toISOString().slice(0, 10);

/** Assegna un badge (una volta sola). Restituisce il badge se è nuovo. */
export function assegna(stato, id) {
  if (stato.badge[id] || !BADGE_BY_ID[id]) return null;
  stato.badge[id] = oggi();
  return BADGE_BY_ID[id];
}

export function segnaGiorno(stato) {
  const g = oggi();
  if (!stato.giorni.includes(g)) stato.giorni = [...stato.giorni, g].slice(-60);
}

/**
 * Punti di una stella: 100 al primo colpo, 50 al secondo, 40 con il gemello; ×1,2 "a mente"
 * se non si è chiesto il suggerimento (come nella Quest: un bonus, mai una penalità).
 */
export function puntiStella({ tentativi, gemello, aiuto }) {
  const base = gemello ? 40 : tentativi <= 1 ? 100 : 50;
  return Math.round(base * (aiuto ? 1 : 1.2));
}

/** Registra la fine di un livello: record, perfetto, badge di livello e di percorso. Restituisce i badge nuovi. */
export function chiudiLivello(stato, idLivello, { punti, perfetto }) {
  const lv = statoLivello(stato, idLivello);
  lv.completo = true;
  lv.volte++;
  lv.record = Math.max(lv.record, punti);
  if (perfetto) lv.perfetto = true;
  const nuovi = [assegna(stato, `costellazione-${idLivello}`)];
  if (perfetto) nuovi.push(assegna(stato, 'perfetto'));
  const fatti = (ids) => ids.every((id) => stato.livelli[id]?.completo);
  if (fatti(LIVELLI.slice(0, 9).map((l) => l.id))) nuovi.push(assegna(stato, 'biennio'));
  if (fatti(LIVELLI.map((l) => l.id))) nuovi.push(assegna(stato, 'astromath'));
  stato.classifica = [...stato.classifica, { sigla: stato.sigla, livello: idLivello, punti, data: oggi() }]
    .sort((a, b) => b.punti - a.punti).slice(0, 10);
  return nuovi.filter(Boolean);
}

export { LIVELLO_QUEST };

// DOMANDE DI ASTROMATH — trasforma i passi delle lezioni della Quest in sfide "ad anelli":
// la risposta giusta e 2-3 sbagliate, scelte tra gli errori tipici previsti dalla Quest (traps, why).
// Modulo puro (nessun DOM): lo usano il gioco e i test in Node.
//
// Tipi della Quest usati:  choice → le sue opzioni;  number → risposta + traps (+ distrattori vicini);
// expr → risposta + traps (solo espressioni semplici);  truefalse → una affermazione, Vero/Falso;
// learn → il messaggio con cui la creatura presenta l'idea. Gli altri tipi (place, sort, bins, slider…)
// restano nella Quest, dove si manipolano con calma.

import { LIVELLO_QUEST, STELLE_PER_LIVELLO, ATTIVITA, attivitaDelLivello } from './livelli.js';

const QUEST = '../../../allenamento/';
let quest = null; // moduli della Quest caricati una volta sola

async function caricaQuest() {
  if (!quest) {
    const [rng, helpers, contesti] = await Promise.all([
      import(QUEST + 'js/engine/rng.js'),
      import(QUEST + 'js/engine/helpers.js'),
      import(QUEST + 'activities/contesti.js'),
    ]);
    quest = { rng, helpers, contesti, attivita: {} };
  }
  return quest;
}

async function attivita(id) {
  const q = await caricaQuest();
  if (!q.attivita[id]) q.attivita[id] = (await import(ATTIVITA[id])).default;
  return q.attivita[id];
}

/** Hash FNV-1a di una stringa: seme deterministico */
export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const quasi = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a));
const decimali = (n) => { const s = String(Math.round(n * 1e6) / 1e6); return s.includes('.') ? s.split('.')[1].length : 0; };

/** Frazione con denominatore piccolo che vale v, oppure null */
function comeFrazione(v) {
  for (let d = 2; d <= 60; d++) { const n = Math.round(v * d); if (quasi(n / d, v)) return [n, d]; }
  return null;
}
/** Etichetta di un numero con unità: la cifra in KaTeX, l'unità come testo; frazione se richiesto */
function etichettaNumero(v, unit, h, frazione) {
  const f = frazione && !Number.isInteger(v) ? comeFrazione(v) : null;
  const soldi = unit === '€' && !Number.isInteger(v); // 4,90 €, non 4,9 €
  const num = f ? h.frac(f[0], f[1]) : soldi ? v.toFixed(2).replace('.', '{,}') : h.tx(v, Math.min(2, decimali(v)));
  if (unit === '%') return `$${num}\\%$`;
  return unit ? `$${num}$ ${unit}` : `$${num}$`;
}

/** Distrattori numerici plausibili, dopo gli errori tipici della Quest */
function distrattoriNumero(a, esclusi, rng, frazione) {
  if (frazione) {
    const f = comeFrazione(a);
    if (f) {
      const [n, d] = f;
      const cand = rng.shuffle([(n + 1) / d, (n - 1) / d, d / n, n / (d + 1), (n + d) / d, n / (2 * d)]);
      return cand.filter((c, i) => Number.isFinite(c) && c > 0 && comeFrazione(c) && ![...esclusi, ...cand.slice(0, i)].some((e) => quasi(e, c)));
    }
  }
  const intero = Number.isInteger(a);
  const cifre = Math.floor(Math.log10(Math.abs(a) || 1));
  const u = intero ? Math.max(1, 10 ** Math.max(0, cifre - 1)) : (Math.abs(a) < 1 ? 0.1 : 1);
  const cand = rng.shuffle([a + u, a - u, a * 10, a / 10, a * 2, a + 2 * u]).concat([a / 2, -a, a + 3 * u]);
  const out = [];
  for (const raw of cand) {
    const c = Math.round(raw * 100) / 100;
    if (!Number.isFinite(c) || decimali(c) > 2) continue;
    if (a >= 0 && c < 0) continue;
    if (intero && !Number.isInteger(c)) continue; // risposta intera: niente distrattori con la virgola (31² ≠ 96,1)
    if (a !== 0 && c === 0) continue;
    if ([...esclusi, ...out].some((e) => quasi(e, c))) continue;
    out.push(c);
  }
  return out;
}

const ESPR_SEMPLICE = /^[0-9a-z^+\-() ]+$/i;
/** Espressione della Quest in forma leggibile: "4a^2 + -36a" → "4a^2 - 36a" */
export function normalizzaEspr(s) {
  return String(s).replace(/\+\s*-/g, '- ').replace(/-\s*-/g, '+ ').replace(/^\s*\+\s*/, '')
    .replace(/(^|[^0-9.^])1(?=[a-z])/gi, '$1') // 1a^2 → a^2 (non tocca 11a né gli esponenti)
    .replace(/\s+/g, ' ').trim();
}
const texEspr = (s) => normalizzaEspr(s).replace(/\^(\d{2,})/g, '^{$1}');
const chiaveEspr = (s) => normalizzaEspr(s).replace(/\s+/g, '');

/**
 * Un passo della Quest → sfida ad anelli, oppure null se il passo non si presta.
 * Esito: { tipo, prompt, fig, opzioni: [{ label, giusta, perche }], spiegazione, aiuto }
 */
export function aAnelli(step, rng, h) {
  if (!step || step.board || (step.chart && !step.fig)) return null;
  const base = { prompt: senzaIstruzioniScritte(step.prompt || ''), fig: step.fig || null, spiegazione: step.explain || '', aiuto: step.hint || '' };
  let opzioni = null;

  if (step.type === 'choice' && Array.isArray(step.options) && step.options.length >= 2) {
    const giusta = step.options.filter((o) => o.correct);
    if (giusta.length !== 1) return null;
    let sbagliate = step.options.filter((o) => !o.correct);
    if (!step.fixedOrder) sbagliate = rng.shuffle(sbagliate);
    const scelte = step.fixedOrder ? step.options.filter((o) => o.correct || sbagliate.slice(0, 3).includes(o)) : [giusta[0], ...sbagliate.slice(0, 3)];
    opzioni = scelte.map((o) => ({ label: String(o.label), giusta: !!o.correct, perche: o.why || '' }));
    if (!step.fixedOrder) opzioni = rng.shuffle(opzioni);
  } else if (step.type === 'number' && typeof step.answer === 'number' && Number.isFinite(step.answer)) {
    const a = step.answer;
    const esclusi = [a, ...(step.alts || []).filter((x) => typeof x === 'number')];
    const trappole = [];
    for (const t of step.traps || []) {
      if (typeof t.value !== 'number' || !Number.isFinite(t.value)) continue;
      if ([...esclusi, ...trappole.map((x) => x.value)].some((e) => quasi(e, t.value))) continue;
      trappole.push(t);
    }
    // frazioni: se lo chiede la Quest o se un valore non si scrive con al massimo due decimali
    const valori = [a, ...trappole.map((t) => t.value)];
    const frazione = !!step.reduced || valori.some((v) => decimali(v) > 2);
    if (frazione && valori.some((v) => !Number.isInteger(v) && !comeFrazione(v))) return null;
    const scelte = trappole.slice(0, 3).map((t) => ({ v: t.value, perche: t.msg || '' }));
    for (const v of distrattoriNumero(a, [...esclusi, ...scelte.map((s) => s.v)], rng, frazione)) {
      if (scelte.length >= 3) break;
      scelte.push({ v, perche: '' });
    }
    if (scelte.length < 2) return null;
    opzioni = rng.shuffle([{ v: a, giusta: true, perche: '' }, ...scelte]).map((s) => ({ label: etichettaNumero(s.v, step.unit, h, frazione), giusta: !!s.giusta, perche: s.perche }));
  } else if (step.type === 'expr' && typeof step.answer === 'string' && ESPR_SEMPLICE.test(step.answer)) {
    const visti = new Set([chiaveEspr(step.answer)]);
    const scelte = [];
    for (const t of step.traps || []) {
      if (typeof t.expr !== 'string' || !ESPR_SEMPLICE.test(t.expr)) continue;
      const k = chiaveEspr(t.expr);
      if (visti.has(k)) continue;
      visti.add(k);
      scelte.push({ label: `$${texEspr(t.expr)}$`, giusta: false, perche: t.msg || '' });
    }
    if (scelte.length < 2) return null;
    opzioni = rng.shuffle([{ label: `$${texEspr(step.answer)}$`, giusta: true, perche: '' }, ...scelte.slice(0, 3)]);
  } else if (step.type === 'numbers' && Array.isArray(step.answers) && step.answers.length === 2 && step.answers.every((v) => typeof v === 'number' && Number.isInteger(v))) {
    // due soluzioni (ordine libero) o una coppia di coordinate (ordered)
    const [p, q] = step.answers;
    const ordinata = !!step.ordered;
    const chiave = ([x, y]) => (ordinata ? `${x};${y}` : [x, y].sort((m, n) => m - n).join(';'));
    const testo = ([x, y]) => (ordinata ? `$(${x};\\,${y})$` : `$${Math.min(x, y)}$ e $${Math.max(x, y)}$`);
    const cand = rng.shuffle([[-p, -q], [p, -q], [-p, q], [q, p], [p + 1, q], [p, q - 1], [2 * p, q]]);
    const visti = new Set([chiave([p, q])]);
    const scelte = [];
    for (const c of cand) {
      if (scelte.length >= 3 || visti.has(chiave(c))) continue;
      visti.add(chiave(c));
      scelte.push({ label: testo(c), giusta: false, perche: '' });
    }
    opzioni = rng.shuffle([{ label: testo([p, q]), giusta: true, perche: '' }, ...scelte]);
  } else if (step.type === 'truefalse' && Array.isArray(step.statements) && step.statements.length) {
    const st = rng.pick(step.statements);
    const domanda = /vero o falso/i.test(step.prompt) ? '' : ' Vero o falso?';
    base.prompt = `${step.prompt} «${st.text}».${domanda}`;
    opzioni = [{ label: 'Vero', giusta: !!st.value, perche: '' }, { label: 'Falso', giusta: !st.value, perche: '' }];
  }
  if (!opzioni || opzioni.length < 2 || opzioni.filter((o) => o.giusta).length !== 1) return null;
  return { tipo: step.type, ...base, opzioni };
}

/** Le istruzioni per la risposta scritta della Quest non servono quando si sceglie tra opzioni */
export function senzaIstruzioniScritte(p) {
  return String(p)
    .replace(/\s*Puoi rispondere[^.?!]*[.?!]/gi, '')
    .replace(/\s*Scrivi (le soluzioni|i due valori|i valori|la risposta|il risultato)[^.?!$]*(\$[^$]*\$[^.?!$]*)?[.?!]?\s*$/i, '')
    .trim();
}

/** Il primo passo "learn" di una lezione: come la creatura presenta l'idea */
function presentazione(steps) {
  const l = steps.find((s) => s.type === 'learn');
  return l ? { titolo: l.title || '', testo: l.body || '', fig: l.fig || null } : null;
}

/**
 * Le 6 stelle di un livello: per ognuna una sfida generata dalla Quest, deterministica dato il seme.
 * opzioni: { seme, classe (1-5 o null), indirizzo (id Quest o null) }
 */
export async function generaStelle(livello, { seme = 'astromath', classe = null, indirizzo = null } = {}) {
  const q = await caricaQuest();
  q.contesti.setClasse(classe);
  q.contesti.setIndirizzo(indirizzo);
  // le attività del livello si distribuiscono sulle stelle in un ordine diverso a ogni partita
  // (la difficoltà resta quella della stella: LIVELLO_QUEST)
  const ids = q.rng.createRng(hash(`${seme}|ordine`)).shuffle(attivitaDelLivello(livello, indirizzo));
  const stelle = [];
  const usati = new Set();
  for (let i = 0; i < STELLE_PER_LIVELLO; i++) {
    const id = ids[i % ids.length];
    const act = await attivita(id);
    const voluto = Math.min(LIVELLO_QUEST[i], act.levels.length);
    // se a quel livello la Quest usa solo domande da manipolare, si prova il livello vicino
    const ordine = [voluto];
    for (let d = 1; d < act.levels.length; d++) for (const v of [voluto - d, voluto + d]) if (v >= 1 && v <= act.levels.length) ordine.push(v);
    let lv = voluto;
    let trovata = null;
    let intro = null;
    for (let tent = 0; tent < 30 * ordine.length && !trovata; tent++) {
      lv = ordine[Math.floor(tent / 30)];
      const rng = q.rng.createRng(hash(`${seme}|${livello.id}|${i}|${tent}`));
      let steps;
      try { steps = act.generate(rng, lv); } catch { continue; }
      intro ||= presentazione(steps);
      for (const st of rng.shuffle(steps)) {
        const sfida = aAnelli(st, rng, q.helpers);
        if (!sfida || usati.has(sfida.prompt)) continue;
        usati.add(sfida.prompt);
        trovata = { sfida, step: st, rng };
        break;
      }
    }
    if (!trovata) throw new Error(`Nessuna domanda ad anelli per ${id} (livello ${lv})`);
    stelle.push({
      indice: i,
      attivita: id,
      titoloAttivita: act.title,
      livelloQuest: lv,
      intro,
      sfida: trovata.sfida,
      // problema gemello dopo due errori: stessa idea, numeri nuovi (twin della Quest)
      gemello() {
        for (let k = 0; k < 6; k++) {
          const st = typeof trovata.step.twin === 'function' ? trovata.step.twin() : null;
          const s = st && aAnelli(st, trovata.rng, q.helpers);
          if (s) return s;
        }
        return trovata.sfida;
      },
    });
  }
  return stelle;
}

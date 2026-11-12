// ASTROMATH — avvio, ciclo di gioco, comandi, eventi.
// Moduli: livelli (curricolo) · domande (dalla Quest) · progressi (salvataggio, badge) · mondo (fisica)
// · creature · disegno (lista di segmenti, camera, particelle) · render (Three.js o Canvas 2D) · audio · ui.

import { LIVELLI, successivo } from './livelli.js';
import { generaStelle } from './domande.js';
import { carica, salva, leggiQuest, stellaAllenata, sbloccato, statoLivello, assegna, chiudiLivello, segnaGiorno, nuovaSigla, statoNuovo } from './progressi.js';
import { Mondo, MONDO } from './mondo.js';
import { Scena, hsl } from './disegno.js';
import { creaRenderer } from './render.js';
import { Audio, vibra } from './audio.js';
import { UI } from './ui.js';

const params = new URLSearchParams(location.search);
const TEST = params.has('test');
const archivio = (() => { try { const k = '__am'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; } })();

const stato = carica(archivio);
const quest = leggiQuest(archivio);
segnaGiorno(stato);

const stretto = matchMedia('(max-width: 640px), (pointer: coarse)').matches;
const sitoRidotto = (() => { try { return localStorage.getItem('orfini_effetti') === 'ridotti'; } catch { return false; } })();
const effettiRidotti = () => (stato.impostazioni.effetti ? stato.impostazioni.effetti === 'ridotti' : sitoRidotto || matchMedia('(prefers-reduced-motion: reduce)').matches);

const QUALITA = {
  alta: { prMax: 1.5, alone: 0.9, particelle: 1, sfoca: 0.2, polvere: true },
  media: { prMax: 1.25, alone: 0.5, particelle: 0.6, sfoca: 0.08, polvere: false },
  bassa: { prMax: 1, alone: 0.35, particelle: 0.3, sfoca: 0.04, polvere: false },
};
const ORDINE_Q = ['alta', 'media', 'bassa'];

let canvas = document.getElementById('tela');
const scena = new Scena();
const audio = new Audio();
let renderer = null;
let mondo = null;          // il livello in corso (null sulla schermata d'avvio)
let vetrina = null;        // mondo dimostrativo dietro la schermata d'avvio
let iLivello = 0;
let pausa = false;
let fermoImmagine = 0;     // hit-stop sulle risposte giuste
let schermo = 'avvio';
let qualitaAttiva = 'media';
let statLivello = null;    // { primoColpo, amente, errori: {attivita: n} }
let avviate = 0;           // partite avviate (per i test: sapere quando è pronta quella nuova)

const ui = new UI({
  rispondi: (k) => { if (mondo && !pausa) mondo.rispondi(k); },
  // scegliere non è rispondere: una seconda scelta della stessa risposta vale come conferma
  seleziona: (k) => { if (!mondo || pausa || !mondo.incontro) return; if (ui.selezionata === k) mondo.rispondi(k); else ui.seleziona(k); },
  aiuto: () => chiediAiuto(),
  avvia: (i) => avviaLivello(i),
  focusTela: () => canvas.focus({ preventScroll: true }),
});

// ------------------------------------------------------------------------------------------------
// Qualità grafica (automatica: scende se i fotogrammi superano i 20 ms per 2 secondi)
// ------------------------------------------------------------------------------------------------
function applicaQualita(q) {
  qualitaAttiva = q;
  const Q = QUALITA[q];
  renderer?.imposta({ prMax: Q.prMax, alone: effettiRidotti() ? Math.min(Q.alone, 0.6) : Q.alone, brilla: effettiRidotti() ? 0 : 1, sfoca: Q.sfoca });
  scena.qualita = { alone: Q.alone, particelle: Q.particelle, polvere: Q.polvere };
  scena.ridotti = effettiRidotti();
  document.documentElement.dataset.effetti = scena.ridotti ? 'ridotti' : 'pieni';
}
const misura = { somma: 0, n: 0, t: 0 };
function sorvegliaFotogrammi(ms) {
  if (stato.impostazioni.qualita !== 'auto' || document.hidden) return;
  misura.somma += ms; misura.n++; misura.t += ms;
  if (misura.t < 2000) return;
  const media = misura.somma / misura.n;
  misura.somma = 0; misura.n = 0; misura.t = 0;
  const i = ORDINE_Q.indexOf(qualitaAttiva);
  if (media > 20 && i < ORDINE_Q.length - 1) applicaQualita(ORDINE_Q[i + 1]);
}

// ------------------------------------------------------------------------------------------------
// Comandi: tastiera, trascinamento (mouse, LIM, dita), tasti di risposta
// ------------------------------------------------------------------------------------------------
const tasti = new Set();
const joy = { attivo: false, id: null, x0: 0, y0: 0, x: 0, y: 0 };
function inputCorrente() {
  let x = 0, y = 0;
  if (tasti.has('ArrowLeft') || tasti.has('KeyA')) x -= 1;
  if (tasti.has('ArrowRight') || tasti.has('KeyD')) x += 1;
  if (tasti.has('ArrowUp') || tasti.has('KeyW') || tasti.has('Space')) y += 1;
  if (tasti.has('ArrowDown') || tasti.has('KeyS')) y -= 1;
  if (joy.attivo) {
    const R = Math.min(90, Math.max(60, Math.min(innerWidth, innerHeight) * 0.12));
    const dx = (joy.x - joy.x0) / R, dy = -(joy.y - joy.y0) / R;
    const m = Math.hypot(dx, dy);
    x += m > 1 ? dx / m : dx; y += m > 1 ? dy / m : dy;
  }
  const m = Math.hypot(x, y);
  return m > 1 ? { x: x / m, y: y / m } : { x, y };
}

function legaComandi(tela) {
  tela.tabIndex = 0;
  tela.addEventListener('pointerdown', (e) => {
    audio.avvia();
    if (!mondo || pausa) return;
    joy.attivo = true; joy.id = e.pointerId; joy.x0 = joy.x = e.clientX; joy.y0 = joy.y = e.clientY;
    tela.setPointerCapture?.(e.pointerId);
    ui.nascondiPresentazione();
    ui.joystick(true, joy.x0, joy.y0, joy.x, joy.y);
  });
  tela.addEventListener('pointermove', (e) => {
    if (!joy.attivo || e.pointerId !== joy.id) return;
    joy.x = e.clientX; joy.y = e.clientY;
    ui.joystick(true, joy.x0, joy.y0, joy.x, joy.y);
  });
  const fine = (e) => { if (e.pointerId !== joy.id) return; joy.attivo = false; ui.joystick(false); };
  tela.addEventListener('pointerup', fine);
  tela.addEventListener('pointercancel', fine);
}

const TASTI_GIOCO = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS']);
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  audio.avvia();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (mondo) { impostaPausa(!pausa); e.preventDefault(); } return; }
  if (!mondo || pausa) return;
  if (/^Digit[1-4]$|^Numpad[1-4]$/.test(e.code) && mondo.incontro) {
    const k = Number(e.code.slice(-1)) - 1;
    if (k < mondo.incontro.anelli.length && !mondo.incontro.anelli[k].via) { if (ui.selezionata === k) mondo.rispondi(k); else ui.seleziona(k); }
    e.preventDefault(); return;
  }
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && mondo.incontro && ui.selezionata != null) { mondo.rispondi(ui.selezionata); e.preventDefault(); return; }
  if (e.code === 'KeyH') { chiediAiuto(); return; }
  if (TASTI_GIOCO.has(e.code)) {
    // Spazio/frecce non devono attivare il pulsante che ha il fuoco
    // in volo Spazio e frecce servono a volare: non devono mai premere un pulsante (nemmeno «Conferma»)
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    e.preventDefault();
    tasti.add(e.code);
    ui.nascondiPresentazione();
  }
});
addEventListener('keyup', (e) => tasti.delete(e.code));
addEventListener('resize', () => ui.adatta()); // rotazione del telefono: il pannello si riadatta
addEventListener('blur', () => { tasti.clear(); joy.attivo = false; ui.joystick(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mondo && !pausa) impostaPausa(true); });

// ------------------------------------------------------------------------------------------------
// Livelli
// ------------------------------------------------------------------------------------------------
/**
 * Seme delle domande: nuovo a ogni partita (numeri sempre diversi, stessa difficoltà).
 * Con ?seme=… nell'indirizzo il docente fa volare tutta la classe sullo stesso cielo: stesse domande per tutti,
 * e la partita successiva dello stesso studente cambia comunque (contatore delle partite).
 */
let partite = 0;
function semePartita(idLivello) {
  partite++;
  const casuale = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(2)).join('-') : `${Math.random()}-${Date.now()}`;
  return params.get('seme') ? `${params.get('seme')}|${idLivello}|${partite}` : `${casuale}|${idLivello}`;
}

async function avviaLivello(i) {
  if (!sbloccato(stato, quest, i).si && !TEST) return;
  audio.avvia();
  iLivello = i;
  const livello = LIVELLI[i];
  ui.nascondiAvvio(); ui.nascondiFine(); ui.chiudiIncontro();
  ui.caricamento(true);
  let stelle;
  try {
    stelle = await generaStelle(livello, { seme: semePartita(livello.id), classe: quest.classe, indirizzo: quest.indirizzo });
  } catch (e) {
    console.error(e);
    ui.caricamento(true, 'Non riesco a preparare le domande: controlla la connessione e riprova.');
    setTimeout(() => { ui.caricamento(false); tornaAllaMappa(); }, 2600);
    return;
  }
  ui.caricamento(false);
  const allenate = stelle.map((s) => stellaAllenata(quest, s.attivita, s.livelloQuest));
  mondo = new Mondo(livello, stelle, { allenate });
  vetrina = null;
  scena.sciarpa = null; scena.scia = []; scena.onde = []; scena.umori = {};
  scena.cam.x = 0; scena.cam.y = 30;
  statLivello = { primoColpo: 0, amente: 0, errori: {} };
  schermo = 'volo';
  pausa = false;
  ui.mostraGioco(true);
  ui.preparaCorrenti(mondo);
  audio.livello(livello.tinta);
  document.documentElement.style.setProperty('--tinta', livello.tinta);
  ui.presenta(stelle.find((s) => s.intro)?.intro, livello.nomeCreatura, livello);
  const nAll = allenate.filter(Boolean).length;
  avviate++;
  if (nAll) ui.avviso(`<strong>${nAll} ${nAll === 1 ? 'stella già conquistata' : 'stelle già conquistate'} nella Quest</strong>: brillano d'oro. Energia di partenza più alta.`, { tipo: 'avviso-oro' });
  salva(archivio, stato);
}

function tornaAllaMappa() {
  mondo = null;
  pausa = false;
  schermo = 'avvio';
  ui.pausa(false); ui.nascondiFine(); ui.chiudiIncontro(); ui.mostraGioco(false); ui.nascondiPresentazione();
  creaVetrina();
  ui.avvio(stato, quest);
}

function impostaPausa(si) {
  pausa = si;
  ui.pausa(si);
  if (!si) canvas.focus({ preventScroll: true });
}

function chiediAiuto() {
  if (!mondo || !mondo.incontro) return;
  const testo = mondo.chiediAiuto();
  if (testo) { ui.esito(`<strong>Suggerimento:</strong> ${testo}`, 'aiuto'); ui.el.incAiuto.disabled = true; }
}

/** Mondo dimostrativo per la schermata d'avvio: il pilota vola da solo tra le stelle del primo livello */
function creaVetrina() {
  const l = LIVELLI[0];
  const finte = l.forma.map((_, i) => ({ indice: i, attivita: '', titoloAttivita: '', livelloQuest: 1 + (i >> 1), intro: null, sfida: { opzioni: [] }, gemello: () => null }));
  vetrina = new Mondo(l, finte);
  vetrina.attesaIncontro = 1e9;
  vetrina.pilota.y = 60; vetrina.pilota.aTerra = false;
  vetrina.stelle.forEach((s, i) => { if (i % 2 === 0) { s.stato = 'accesa'; s.accesaDa = -10; } });
  vetrina.archi.forEach((a) => { if (vetrina.stelle[a.a].stato === 'accesa' && vetrina.stelle[a.b].stato === 'accesa') a.prog = 1; });
  vetrina.aggiornaIncontri = function aggiornaIncontri() {};
  scena.sciarpa = null; scena.scia = [];
}

// ------------------------------------------------------------------------------------------------
// Eventi del mondo → suono, particelle, vibrazione, interfaccia, badge
// ------------------------------------------------------------------------------------------------
function premia(id) {
  const b = assegna(stato, id);
  if (b) { ui.badge(b); audio.suona('badge'); salva(archivio, stato); }
}

function gestisci(ev) {
  const liv = mondo.livello;
  const tinta = hsl(liv.tinta, 95, 72), bianco = [1, 1, 1], oro = hsl(45, 100, 65);
  const vib = stato.impostazioni.vibrazione && !scena.ridotti;
  switch (ev.tipo) {
    case 'decollo': audio.suona('decollo'); scena.part.emetti(ev.x, 0.2, { n: 18, v: 9, vita: 0.7, tinta: [0.7, 0.75, 0.9], size: 0.8, dir: Math.PI / 2, spread: 2.6 }); scena.onda(ev.x, 0, 0.5); break;
    case 'atterra': scena.cam.scuoti(Math.min(0.35, ev.v / 60)); scena.part.emetti(ev.x, 0.2, { n: 14, v: 8, vita: 0.6, tinta: [0.7, 0.75, 0.9], size: 0.7, dir: Math.PI / 2, spread: 2.8 }); scena.onda(ev.x, 0, 0.6); break;
    case 'richiamata': audio.suona('richiamata'); scena.part.emetti(ev.x, ev.y, { n: 16, v: 12, vita: 0.5, tinta, size: 0.6 }); break;
    case 'surf-inizio': audio.suona('surf'); break;
    case 'badge': premia(ev.id); break;
    case 'incontro': {
      const s = mondo.stelle[ev.i];
      audio.suona('incontro');
      vibra(8, vib);
      ui.nascondiPresentazione();
      ui.apriIncontro(s, s.corrente, { nomeCreatura: liv.nomeCreatura, nota: s.allenata ? 'Questa stella l\'hai già conquistata nella Quest: dimostralo anche in volo.' : '' });
      scena.part.emetti(s.x, s.y, { n: 30, v: 16, vita: 0.9, tinta, size: 0.7 });
      break;
    }
    case 'incontro-sospeso': ui.chiudiIncontro(); ui.avviso('La stella ti aspetta: torna quando vuoi.'); break;
    case 'giusta': {
      const s = mondo.stelle[ev.i];
      audio.suona('giusta', { i: ev.i });
      vibra(14, vib);
      if (!scena.ridotti) fermoImmagine = 0.07;
      scena.cam.scuoti(0.28);
      scena.onda(ev.sx, ev.sy, 1.3);
      scena.umore(ev.i, 'felice', 1.8);
      scena.part.emetti(ev.x, ev.y, { n: 36, v: 22, vita: 0.9, tinta: bianco, size: 0.8 });
      scena.part.emetti(ev.sx, ev.sy, { n: 70, v: 30, vita: 1.4, tinta, size: 1.1, g: 4 });
      if (ev.allenata) scena.part.emetti(ev.sx, ev.sy, { n: 30, v: 18, vita: 1.2, tinta: oro, size: 1 });
      const k = s.corrente.opzioni.findIndex((o) => o.giusta);
      const lode = ev.amente ? 'Giusta, e a mente: bonus ×1,2.' : ev.primo ? 'Giusta al primo colpo.' : ev.gemello ? 'Giusta: ce l\'hai fatta con numeri nuovi.' : 'Giusta.';
      ui.giusta(k, `${lode} <strong>+${ev.punti}</strong> · energia ricaricata`);
      ui.chiudiIncontro(1100);
      stato.stats.risposte++; stato.stats.stelle++;
      if (ev.primo) { stato.stats.primoColpo++; statLivello.primoColpo++; }
      if (ev.amente) { stato.stats.amente++; statLivello.amente++; }
      const sl = statoLivello(stato, liv.id);
      sl.massimo = Math.max(sl.massimo || 0, mondo.stelle.filter((x) => x.stato === 'accesa').length);
      premia('primo-volo');
      if (ev.serie >= 5) premia('a-mente');
      if (ev.allenata) premia('ponte-quest');
      if (ev.gemello) premia('ostinato');
      salva(archivio, stato);
      break;
    }
    case 'sbagliata': {
      const s = mondo.stelle[ev.i];
      audio.suona('sbagliata');
      vibra([6, 40, 6], vib);
      scena.cam.scuoti(0.12);
      scena.umore(ev.i, 'triste', 0.9);
      scena.part.emetti(ev.x, ev.y, { n: 14, v: 8, vita: 0.6, tinta: [0.6, 0.6, 0.7], size: 0.6 });
      const k = mondo.incontro ? mondo.incontro.anelli.findIndex((a) => a.x === ev.x && a.y === ev.y) : -1;
      ui.scarta(k, ev.perche);
      statLivello.errori[s.attivita] = (statLivello.errori[s.attivita] || 0) + 1;
      break;
    }
    case 'gemello': {
      const s = mondo.stelle[ev.i];
      ui.apriIncontro(s, s.corrente, { nomeCreatura: liv.nomeCreatura, nota: `<strong>Ecco come si fa:</strong> ${ev.spiegazione || ''}<br><em>Ora prova con numeri nuovi.</em>` });
      break;
    }
    case 'arco': audio.suona('arco', ev); break;
    case 'completa':
      audio.suona('completa');
      vibra([20, 40, 60], vib);
      scena.cam.scuoti(0.4);
      mondo.stelle.forEach((s) => { scena.part.emetti(s.x, s.y, { n: 40, v: 26, vita: 1.6, tinta, size: 1.1 }); scena.onda(s.x, s.y, 0.9); });
      ui.avviso('<strong>Costellazione completa!</strong> Vola nel portale in alto, sopra l\'asse y.', { tipo: 'avviso-oro', durata: 5000 });
      break;
    case 'fine': finisciLivello(ev); break;
    default: break;
  }
}

function finisciLivello(ev) {
  const liv = mondo.livello;
  const nuovi = chiudiLivello(stato, liv.id, { punti: ev.punti, perfetto: ev.perfetto });
  salva(archivio, stato);
  nuovi.forEach(() => audio.suona('badge'));
  const visti = new Map();
  for (const s of mondo.stelle) {
    const k = `${s.attivita}|${s.livelloQuest}`;
    if (!visti.has(k)) visti.set(k, { id: s.attivita, titolo: s.titoloAttivita, livello: s.livelloQuest, errori: 0 });
    visti.get(k).errori += Math.max(0, s.tentativi - 1);
  }
  const ripasso = [...visti.values()].sort((a, b) => b.errori - a.errori);
  schermo = 'fine';
  ui.mostraGioco(false);
  ui.chiudiIncontro();
  ui.fine({ livello: liv, punti: ev.punti, primoColpo: statLivello.primoColpo, amente: statLivello.amente, nuovi, ripasso, prossimo: successivo(liv.id) });
  mondo = null;
  creaVetrina();
}

// ------------------------------------------------------------------------------------------------
// Card del pilota (PNG): sigla, costellazione, punti. Nessun nome.
// ------------------------------------------------------------------------------------------------
function scaricaCard(livello, punti) {
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 630;
  const g = c.getContext('2d');
  g.fillStyle = '#050507'; g.fillRect(0, 0, 1200, 630);
  const [r, gg, b] = hsl(livello.tinta, 90, 62).map((v) => Math.round(v * 255));
  g.strokeStyle = `rgb(${r},${gg},${b})`; g.lineWidth = 3; g.shadowColor = g.strokeStyle; g.shadowBlur = 18;
  const pt = livello.forma.map(([x, y]) => [760 + x * 360, 520 - y * 420]);
  for (const [a, bb] of livello.archi) { g.beginPath(); g.moveTo(...pt[a]); g.lineTo(...pt[bb]); g.stroke(); }
  g.fillStyle = '#fff'; for (const p of pt) { g.beginPath(); g.arc(p[0], p[1], 9, 0, Math.PI * 2); g.fill(); }
  g.shadowBlur = 0;
  g.font = '700 30px "Space Mono", monospace'; g.fillStyle = `rgb(${r},${gg},${b})`; g.fillText('ASTROMATH', 64, 100);
  g.font = '800 64px Inter, sans-serif'; g.fillStyle = '#fff'; g.fillText(livello.nome, 64, 190, 640);
  g.font = '400 30px Inter, sans-serif'; g.fillStyle = '#b8c0d0'; g.fillText('Costellazione completa', 64, 240);
  g.font = '700 96px "Space Mono", monospace'; g.fillStyle = '#fff'; g.fillText(String(punti), 64, 380);
  g.font = '400 28px Inter, sans-serif'; g.fillStyle = '#b8c0d0'; g.fillText('punti', 64, 420);
  g.font = '700 34px "Space Mono", monospace'; g.fillStyle = `rgb(${r},${gg},${b})`; g.fillText(stato.sigla, 64, 520);
  g.font = '400 22px Inter, sans-serif'; g.fillStyle = '#7d8699'; g.fillText('Orfini Math Lab · federicodb.github.io', 64, 580);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `astromath-${livello.id}.png`;
  a.click();
}

// ------------------------------------------------------------------------------------------------
// Ciclo
// ------------------------------------------------------------------------------------------------
let ultimo = performance.now();
function fotogramma(ora) {
  requestAnimationFrame(fotogramma);
  const dtReale = Math.min(0.1, (ora - ultimo) / 1000);
  sorvegliaFotogrammi(ora - ultimo);
  ultimo = ora;
  const W = innerWidth, H = innerHeight;
  renderer.dimensiona(W, H);
  // pannello della domanda: a destra sugli schermi larghi (stesso criterio del CSS), altrimenti in basso
  // stessa regola per la camera e per il CSS (classe pannello-destra): schermi larghi e telefoni in orizzontale
  const destra = (W >= 1000 && W / H >= 4 / 3) || (H <= 500 && W > H);
  if (destra !== document.documentElement.classList.contains('pannello-destra')) { document.documentElement.classList.toggle('pannello-destra', destra); ui.adatta(); }
  scena.cam.spostamento = destra ? [H <= 500 ? 0.42 : 0.3, 0] : [0, ui.pannelloAlto ? -0.58 : -0.3]; // pannello più largo in orizzontale, più alto se serve
  const m = mondo || vetrina;
  if (!m) return;
  if (mondo && !pausa) {
    mondo.input = inputCorrente();
    if (fermoImmagine > 0) fermoImmagine -= dtReale;
    else mondo.avanza(dtReale);
    for (const ev of mondo.prendiEventi()) { gestisci(ev); if (!mondo) break; }
    if (mondo) {
      ui.hud(mondo, mondo.livello.nome);
      audio.vento(Math.hypot(mondo.pilota.vx, mondo.pilota.vy), mondo.pilota.spinge);
    }
  } else if (!mondo && vetrina) {
    // il pilota della vetrina disegna un otto tra le stelle
    const t = vetrina.tempo;
    const tx = Math.sin(t * 0.35) * 70, ty = 90 + Math.sin(t * 0.7) * 50;
    const p = vetrina.pilota;
    vetrina.input = { x: Math.max(-1, Math.min(1, (tx - p.x) / 20)), y: Math.max(-1, Math.min(1, (ty - p.y) / 14 + 0.35)) };
    vetrina.avanza(dtReale);
    vetrina.prendiEventi();
    audio.vento(0, 0);
  }
  const attuale = mondo || vetrina;
  if (!attuale) return;
  if (!pausa) scena.aggiorna(dtReale, attuale);
  scena.costruisci(attuale, W, H);
  renderer.disegna(scena.lista, scena.cam, performance.now() / 1000);
  if (mondo) ui.etichette(mondo, scena.cam, W, H);
}

// ------------------------------------------------------------------------------------------------
// Pulsanti delle schermate e impostazioni
// ------------------------------------------------------------------------------------------------
function legaPulsanti() {
  const on = (id, f) => document.getElementById(id)?.addEventListener('click', f);
  on('btn-vola', (e) => avviaLivello(Number(e.currentTarget.dataset.livello) || 0));
  on('btn-sigla', () => { stato.sigla = nuovaSigla(); salva(archivio, stato); document.getElementById('sigla').textContent = stato.sigla; audio.avvia(); audio.suona('clic'); });
  on('btn-pausa', () => impostaPausa(true));
  on('btn-riprendi', () => impostaPausa(false));
  on('btn-ricomincia', () => { impostaPausa(false); avviaLivello(iLivello); });
  on('btn-mappa', () => tornaAllaMappa());
  on('btn-mappa-fine', () => tornaAllaMappa());
  on('btn-rigioca', () => avviaLivello(iLivello));
  on('btn-prossimo', () => avviaLivello(Math.min(LIVELLI.length - 1, iLivello + 1)));
  on('btn-card', () => scaricaCard(LIVELLI[iLivello], stato.livelli[LIVELLI[iLivello].id]?.record || 0));
  on('btn-audio', (e) => { audio.avvia(); audio.imposta({ muto: !audio.muto }); e.currentTarget.setAttribute('aria-pressed', String(audio.muto)); e.currentTarget.querySelector('span').textContent = audio.muto ? 'Audio spento' : 'Audio'; });
  const dlg = document.getElementById('dlg-impostazioni');
  const apri = () => { compilaImpostazioni(); dlg.showModal(); };
  on('btn-impostazioni', apri);
  on('btn-impostazioni-avvio', apri);
  on('btn-impostazioni-pausa', apri);
  on('btn-chiudi-impostazioni', () => dlg.close());
  dlg.addEventListener('change', (e) => {
    const t = e.target, imp = stato.impostazioni;
    if (t.name === 'qualita') { imp.qualita = t.value; applicaQualita(t.value === 'auto' ? (stretto ? 'media' : 'alta') : t.value); }
    if (t.name === 'effetti') { imp.effetti = t.value === 'sito' ? null : t.value; applicaQualita(qualitaAttiva); }
    if (t.name === 'vibrazione') imp.vibrazione = t.checked;
    if (t.name === 'volume') { imp.volume = Number(t.value); audio.imposta({ volume: imp.volume }); }
    salva(archivio, stato);
  });
  on('btn-cancella', () => {
    if (!confirm('Cancellare i progressi di AstroMath su questo dispositivo? (Quelli della Quest restano.)')) return;
    const s = statoNuovo();
    for (const k of Object.keys(stato)) delete stato[k];
    Object.assign(stato, s);
    salva(archivio, stato);
    dlg.close();
    tornaAllaMappa();
  });
}
function compilaImpostazioni() {
  const f = document.getElementById('dlg-impostazioni'), imp = stato.impostazioni;
  f.querySelector(`[name=qualita][value=${imp.qualita}]`).checked = true;
  f.querySelector(`[name=effetti][value=${imp.effetti || 'sito'}]`).checked = true;
  f.querySelector('[name=vibrazione]').checked = imp.vibrazione;
  f.querySelector('[name=volume]').value = imp.volume;
  f.querySelector('#vibrazione-nota').hidden = 'vibrate' in navigator;
}

// ------------------------------------------------------------------------------------------------
// Avvio
// ------------------------------------------------------------------------------------------------
async function avvio() {
  renderer = await creaRenderer(canvas, { maxSeg: 14000, maxPt: 3000, stretto, forza2d: params.has('2d'), conservaImmagine: TEST });
  canvas = renderer.canvas;
  document.documentElement.dataset.renderer = renderer.tipo;
  legaComandi(canvas);
  legaPulsanti();
  audio.imposta({ volume: stato.impostazioni.volume });
  applicaQualita(stato.impostazioni.qualita === 'auto' ? (stretto ? 'media' : 'alta') : stato.impostazioni.qualita);
  creaVetrina();
  ui.avvio(stato, quest);
  salva(archivio, stato);
  document.documentElement.dataset.pronto = '1';
  requestAnimationFrame(fotogramma);
}

// Gancio per i test automatici (solo con ?test): comandi diretti e stato leggibile
if (TEST) {
  window.__astromath = {
    stato: () => ({
      schermo, pausa, avviate, renderer: renderer?.tipo, qualita: qualitaAttiva, livello: mondo?.livello.id ?? null,
      stelle: mondo?.stelle.map((s) => s.stato) ?? [], incontro: mondo?.incontro ? mondo.incontro.i : null,
      punti: mondo?.punti ?? 0, portale: !!mondo?.portaleAperto, pilota: mondo ? { ...mondo.pilota, inSurf: !!mondo.pilota.inSurf } : null,
      badge: Object.keys(stato.badge), segmenti: scena.lista.nSeg,
    }),
    avvia: (i) => { avviaLivello(i); },
    /** porta il pilota vicino alla stella i (apre l'incontro) */
    vai: (i) => { const s = mondo.stelle[i]; Object.assign(mondo.pilota, { x: s.x + 4, y: s.y - 4, vx: 0, vy: 0, aTerra: false }); },
    giusta: () => { const s = mondo.stelle[mondo.incontro.i]; mondo.rispondi(s.corrente.opzioni.findIndex((o) => o.giusta)); },
    sbagliata: () => { const inc = mondo.incontro, s = mondo.stelle[inc.i]; const k = s.corrente.opzioni.findIndex((o, j) => !o.giusta && !inc.anelli[j].via); mondo.rispondi(k); },
    portale: () => Object.assign(mondo.pilota, { x: MONDO.portale.x, y: MONDO.portale.y, vx: 0, vy: 0 }),
    pilota: (o) => Object.assign(mondo.pilota, o),
    mondo: () => mondo,
  };
}

avvio();

// AUDIO DI ASTROMATH — tutto sintetizzato con Web Audio, nessun file.
// Ogni livello ha una sua tonalità pentatonica: ogni stella accesa aggiunge una nota, così la
// costellazione completa diventa una melodia. Le note cadono sul tempo (100 bpm), come in un brano.
// Il vento è un rumore filtrato che sale con la velocità: l'accelerazione si sente.

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const BPM = 100;

export class Audio {
  constructor() { this.ctx = null; this.volume = 0.7; this.muto = false; }

  avvia() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muto ? 0 : this.volume;
    // un riverbero leggero fatto con un ritardo in retroazione
    this.eco = this.ctx.createDelay(1); this.eco.delayTime.value = 0.27;
    const fb = this.ctx.createGain(); fb.gain.value = 0.28;
    const fl = this.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2400;
    this.eco.connect(fl); fl.connect(fb); fb.connect(this.eco);
    this.mandata = this.ctx.createGain(); this.mandata.gain.value = 0.35;
    this.mandata.connect(this.eco); fl.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.creaVento();
    this.radice = 48;
  }

  imposta({ volume, muto }) {
    if (volume != null) this.volume = volume;
    if (muto != null) this.muto = muto;
    if (this.master) this.master.gain.setTargetAtTime(this.muto ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  creaVento() {
    const c = this.ctx, n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = b; src.loop = true;
    this.ventoF = c.createBiquadFilter(); this.ventoF.type = 'bandpass'; this.ventoF.frequency.value = 400; this.ventoF.Q.value = 0.8;
    this.ventoG = c.createGain(); this.ventoG.gain.value = 0;
    src.connect(this.ventoF); this.ventoF.connect(this.ventoG); this.ventoG.connect(this.master);
    src.start();
  }

  /** Tonalità del livello: la tinta sceglie la nota di base */
  livello(tinta) {
    this.radice = 45 + Math.round((tinta / 360) * 12);
    if (!this.ctx) return;
    this.tappeto();
  }

  tappeto() {
    const c = this.ctx;
    if (this.pad) { const g = this.pad.g; g.gain.setTargetAtTime(0, c.currentTime, 0.6); const o = this.pad.o; setTimeout(() => o.forEach((x) => x.stop()), 3000); }
    const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.045, c.currentTime, 2);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const o = [0, 7, 12].map((st, i) => { const x = c.createOscillator(); x.type = i ? 'triangle' : 'sine'; x.frequency.value = this.hz(this.radice - 12 + st); x.detune.value = (i - 1) * 6; x.connect(f); x.start(); return x; });
    f.connect(g); g.connect(this.master);
    this.pad = { g, o };
  }

  hz(midi) { return 440 * 2 ** ((midi - 69) / 12); }

  /** Prossimo ottavo di battuta: le note cadono a tempo */
  aTempo() { const c = this.ctx, b = 60 / BPM / 2; return Math.ceil(c.currentTime / b + 0.05) * b; }

  nota(midi, quando, dur = 0.5, tipo = 'triangle', vol = 0.16) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.value = this.hz(midi);
    g.gain.setValueAtTime(0, quando); g.gain.linearRampToValueAtTime(vol, quando + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, quando + dur);
    o.connect(g); g.connect(this.master); g.connect(this.mandata);
    o.start(quando); o.stop(quando + dur + 0.05);
  }

  /** Breve soffio di rumore filtrato (botti, raffiche) */
  rumore(dur, freq, vol) {
    const c = this.ctx, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.7; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master); g.connect(this.mandata); src.start();
  }

  /** Nota che scivola da una altezza all'altra passando per una terza (boing, risucchio) */
  scivola(da, picco, a, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = 'sine';
    o.frequency.setValueAtTime(this.hz(da), t);
    o.frequency.exponentialRampToValueAtTime(this.hz(picco), t + dur * 0.3);
    o.frequency.exponentialRampToValueAtTime(this.hz(a), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); g.connect(this.mandata); o.start(t); o.stop(t + dur + 0.05);
  }

  vento(vel, spinge) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ventoG.gain.setTargetAtTime(Math.min(0.12, vel / 380 + spinge * 0.03), t, 0.15);
    this.ventoF.frequency.setTargetAtTime(250 + vel * 28, t, 0.15);
  }

  suona(tipo, dati = {}) {
    if (!this.ctx || this.muto) return;
    const r = this.radice, t0 = this.aTempo(), b = 60 / BPM / 2;
    switch (tipo) {
      case 'giusta': { // arpeggio a tempo, poi la nota della stella
        [0, 4, 7].forEach((st, i) => this.nota(r + 12 + st, t0 + i * b * 0.5, 0.35, 'triangle', 0.12));
        this.nota(r + 12 + PENTA[(dati.i ?? 0) % PENTA.length] + 12, t0 + b * 1.5, 1.2, 'sine', 0.18);
        break;
      }
      case 'sbagliata': this.nota(r - 5, this.ctx.currentTime, 0.4, 'sine', 0.12); this.nota(r - 7, this.ctx.currentTime + 0.12, 0.5, 'sine', 0.1); break;
      case 'incontro': this.nota(r + 24, this.ctx.currentTime, 0.6, 'sine', 0.08); this.nota(r + 31, this.ctx.currentTime + 0.08, 0.8, 'sine', 0.06); break;
      case 'completa': [0, 4, 7, 12, 16, 19].forEach((st, i) => this.nota(r + 12 + st, t0 + i * b * 0.5, 2.2, i % 2 ? 'sine' : 'triangle', 0.1)); break;
      case 'arco': this.nota(r + 19 + PENTA[(dati.a + dati.b) % 5], t0, 0.6, 'sine', 0.06); break;
      case 'decollo': { const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.4); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.5); break; }
      case 'richiamata': this.nota(r + 7, this.ctx.currentTime, 0.5, 'sawtooth', 0.025); break;
      case 'surf': this.nota(r + 14, t0, 0.4, 'sine', 0.07); break;
      case 'badge': [12, 16, 19, 24].forEach((st, i) => this.nota(r + 12 + st, t0 + i * b * 0.35, 0.9, 'sine', 0.09)); break;
      // oggetti liberi
      case 'freddura': this.nota(r + 19, this.ctx.currentTime, 0.18, 'sine', 0.07); this.nota(r + 24, this.ctx.currentTime + 0.1, 0.3, 'sine', 0.07); break;
      case 'boing': this.scivola(r + 12, r + 31, r + 19, 0.4, 0.13); break;
      case 'botto': this.rumore(0.35, 900, 0.18); [0, 7, 12, 16, 19, 24].forEach((st, i) => this.nota(r + 12 + st, t0 + i * b * 0.25, 0.8, 'triangle', 0.07)); break;
      case 'vento': this.rumore(0.5, 1800, 0.08); break;
      case 'buco': this.scivola(r + 24, r + 6, r - 12, 1.5, 0.1); break;
      case 'buco-fuori': [0, 4, 7, 12].forEach((st, i) => this.nota(r + st + 12, this.ctx.currentTime + i * 0.05, 0.4, 'sine', 0.08)); break;
      case 'segreto': [0, 7, 12, 16, 19, 24, 28, 31].forEach((st, i) => this.nota(r + 12 + st, t0 + i * b * 0.3, 1.6, 'sine', 0.07)); break;
      case 'clic': this.nota(r + 24, this.ctx.currentTime, 0.12, 'sine', 0.05); break;
      default: break;
    }
  }
}

/** Vibrazione (Android/Chrome). Su iOS Safari l'API non esiste: restano suono e immagine. */
export function vibra(schema, attiva) {
  if (!attiva || !('vibrate' in navigator)) return;
  try { navigator.vibrate(schema); } catch { /* ignorata */ }
}

// MONDO DI ASTROMATH — simulazione a passo fisso (1/60 s), senza DOM e senza disegno.
// Fisica tarata sulla sensazione, non sul realismo: spinta, gravità, attrito, planata,
// richiamata (la velocità di una picchiata si trasforma in quota) e correnti a forma di grafico.
// Tutto ciò che accade finisce in `eventi` (per suoni, particelle, vibrazione, interfaccia).

import { puntiStella } from './progressi.js';

export const PASSO = 1 / 60;
export const MONDO = {
  meta: 112,          // mezza larghezza del cielo esplorabile
  tetto: 250,         // quota oltre la quale l'aria spinge giù (finché il portale è chiuso)
  portale: { x: 0, y: 238, r: 7 },
  g: 16,              // gravità
  spinta: 40,         // accelerazione dei razzi
  attrito: 0.55,
  vmax: 44,
  consumo: 6,         // energia al secondo a spinta piena (ridotto: si esplora con calma)
  raggioIncontro: 10, // distanza a cui una stella "si accorge" del pilota
  raggioAnelli: 15,
  raggioAnello: 3.4,
  conferma: 1.0,      // secondi da passare dentro un anello per rispondere
  bolla: 26,          // vicino a una stella in incontro non si cade: si pensa con calma
  scalaPilota: 1.4,   // dimensione del disegno del pilota
  piedi: 2.75,        // dal centro del pilota ai piedi: a terra il centro sta a questa quota
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Posizioni degli anelli attorno alla stella, secondo quante sono le opzioni */
const ANGOLI = { 2: [180, 0], 3: [150, 30, 270], 4: [135, 45, 225, 315] };

export class Mondo {
  /**
   * @param livello   voce di LIVELLI
   * @param stelle    esito di generaStelle (domande)
   * @param opz       { allenate: [bool × 6] stelle già conquistate nella Quest }
   */
  constructor(livello, stelle, opz = {}) {
    this.livello = livello;
    this.tempo = 0;
    this.scalaTempo = 1;
    this.eventi = [];
    const bonus = (opz.allenate || []).some(Boolean) ? 25 : 0;
    this.pilota = { x: 0, y: MONDO.piedi, vx: 0, vy: 0, energia: 100 + bonus, energiaMax: 100 + bonus, aTerra: true, spinge: 0, rollio: 0, surf: 0, inSurf: null };
    this.stelle = stelle.map((s, i) => ({
      ...s,
      x: livello.forma[i][0] * 88,
      y: 34 + livello.forma[i][1] * 176,
      stato: 'spenta',
      allenata: !!(opz.allenate || [])[i],
      tentativi: 0,
      aiuto: false,
      usaGemello: false,
      corrente: s.sfida,
      fase: (i * 2.399963) % (Math.PI * 2), // battito sfasato con l'angolo aureo, come le stelle della home
      accesaDa: -1,
    }));
    this.archi = livello.archi.map(([a, b]) => ({ a, b, prog: 0 }));
    this.correnti = livello.correnti;
    this.incontro = null;
    this.attesaIncontro = 0;
    this.portaleAperto = false;
    this.finito = false;
    this.punti = 0;
    this.perfetto = true;
    this.serieAmente = 0;
    this.input = { x: 0, y: 0 };
  }

  emetti(tipo, dati = {}) { this.eventi.push({ tipo, t: this.tempo, ...dati }); }

  /** Avanza la simulazione di `dt` secondi reali (passi fissi; la scala del tempo rallenta il mondo negli incontri) */
  avanza(dt) {
    this._accu = (this._accu || 0) + Math.min(dt, 0.1);
    let n = 0;
    while (this._accu >= PASSO && n < 8) { this.passo(PASSO); this._accu -= PASSO; n++; }
  }

  passo(h) {
    if (this.finito) return;
    const dt = h * this.scalaTempo;
    this.tempo += dt;
    const p = this.pilota;
    const inp = this.input;
    const mag = Math.min(1, Math.hypot(inp.x, inp.y));

    // --- spinta ---
    const potenza = p.energia > 0 ? 1 : 0.3; // senza energia i razzi funzionano a un terzo: mai bloccati
    let ax = 0, ay = 0;
    if (mag > 0.12) {
      ax = (inp.x / Math.max(mag, 1e-6)) * mag * MONDO.spinta * potenza;
      ay = (inp.y / Math.max(mag, 1e-6)) * mag * MONDO.spinta * potenza;
      if (p.energia > 0) p.energia = Math.max(0, p.energia - MONDO.consumo * mag * Math.max(0.35, inp.y > 0 ? inp.y : 0.35) * dt);
      if (p.aTerra && inp.y > 0.2) { p.aTerra = false; p.vy = Math.max(p.vy, 11); this.emetti('decollo', { x: p.x, y: p.y }); } // salto di decollo
    }
    p.spinge = lerp(p.spinge, mag > 0.12 ? mag : 0, 0.2);

    // --- gravità con planata: la velocità orizzontale sostiene ---
    const portanza = Math.min(0.75, Math.abs(p.vx) / 30);
    let g = MONDO.g * (1 - portanza);
    const st = this.incontro && this.stelle[this.incontro.i];
    if (st && Math.hypot(p.x - st.x, p.y - st.y) < MONDO.bolla) {
      // sospensione morbida: niente caduta e, senza comandi, il pilota torna piano al centro della stella
      g = 0;
      // (non quando è dentro un anello: lì resta fermo per confermare la risposta)
      if (mag <= 0.12 && !this.incontro.dentro) { ax += (st.x - p.x) * 4; ay += (st.y - p.y) * 4; }
    }

    // --- richiamata: tirando su durante una picchiata veloce, la velocità ruota verso l'alto ---
    const v = Math.hypot(p.vx, p.vy);
    if (inp.y > 0.45 && v > 14 && p.vy < 6) {
      const ang = Math.atan2(p.vy, p.vx);
      const meta = Math.atan2(Math.max(0.6, inp.y), inp.x || Math.sign(p.vx) * 0.3);
      let d = meta - ang;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const nuova = ang + clamp(d, -2.4 * dt, 2.4 * dt);
      const vv = v * (1 - 0.12 * dt);
      p.vx = Math.cos(nuova) * vv;
      p.vy = Math.sin(nuova) * vv;
      if (v > 22 && this.tempo - (this._ultimaRichiamata || -9) > 1.2) { this._ultimaRichiamata = this.tempo; this.emetti('richiamata', { x: p.x, y: p.y, v }); }
    }

    // --- correnti: grafici di funzione che portano ---
    let inSurf = null;
    for (const c of this.correnti) {
      if (p.x < c.x0 || p.x > c.x1) continue;
      const m = c.df(p.x);
      const dist = (p.y - c.f(p.x)) / Math.sqrt(1 + m * m);
      if (Math.abs(dist) < 3.2) {
        inSurf = c;
        const verso = Math.sign(p.vx || inp.x || 1);
        const tx = verso / Math.sqrt(1 + m * m), ty = (verso * m) / Math.sqrt(1 + m * m);
        ax += tx * 30; ay += ty * 30;
        g = 0;
        // richiamo dolce verso la curva
        const nx = -m / Math.sqrt(1 + m * m), ny = 1 / Math.sqrt(1 + m * m);
        ax -= nx * dist * 6; ay -= ny * dist * 6;
        p.energia = Math.min(p.energiaMax, p.energia + 14 * dt);
        break;
      }
    }
    if (inSurf && !p.inSurf) this.emetti('surf-inizio', { x: p.x, y: p.y, tex: inSurf.tex });
    if (!inSurf && p.inSurf) { this.emetti('surf-fine', { durata: p.surf }); }
    p.surf = inSurf ? p.surf + dt : 0;
    if (inSurf && p.surf >= 3 && !this._surfPremio) { this._surfPremio = true; this.emetti('badge', { id: 'surfista' }); }
    p.inSurf = inSurf;

    // --- bordi morbidi ---
    if (Math.abs(p.x) > MONDO.meta) ax -= Math.sign(p.x) * (Math.abs(p.x) - MONDO.meta) * 9;
    if (p.y > MONDO.tetto && !this.portaleAperto) ay -= (p.y - MONDO.tetto) * 8;

    // --- integrazione (Eulero semi-implicito) ---
    p.vx += ax * dt;
    p.vy += (ay - g) * dt;
    // dentro un anello il pilota viene frenato e trattenuto al centro: fermarsi è facile, passare di corsa non risponde
    const anello = this.incontro && this.incontro.dentro ? this.incontro.anelli[this.incontro.dentro.k] : null;
    if (anello && mag <= 0.12) { p.vx += (anello.x - p.x) * 5 * dt; p.vy += (anello.y - p.y) * 5 * dt; }
    const k = 1 - MONDO.attrito * dt * (anello ? 5 : st ? 2.2 : 1);
    p.vx *= k; p.vy *= k;
    const vn = Math.hypot(p.vx, p.vy);
    if (vn > MONDO.vmax) { p.vx *= MONDO.vmax / vn; p.vy *= MONDO.vmax / vn; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rollio = lerp(p.rollio, clamp(p.vx / 30, -1, 1), 0.08);

    // --- terreno: l'asse x. Da fermi a terra l'energia si ricarica ---
    if (p.y <= MONDO.piedi) {
      if (!p.aTerra && p.vy < -6) this.emetti('atterra', { x: p.x, v: -p.vy });
      p.y = MONDO.piedi;
      p.vy = Math.max(0, -p.vy * 0.15);
      p.vx *= 0.9;
      p.aTerra = p.vy < 1;
    }
    else if (p.y > MONDO.piedi + 0.1) p.aTerra = false; // staccato dal suolo anche senza decollo (corrente, spinta laterale)
    if (p.aTerra) p.energia = Math.min(p.energiaMax, p.energia + 28 * dt);

    if (this.oggetti) this.oggetti.aggiorna(dt); // oggetti liberi (oggetti.js): freddure, molle, fuochi, buco nero, vento
    this.aggiornaIncontri(dt);
    this.aggiornaArchi(dt);

    // --- portale ---
    if (this.portaleAperto && Math.hypot(p.x - MONDO.portale.x, p.y - MONDO.portale.y) < MONDO.portale.r) {
      this.finito = true;
      this.emetti('fine', { punti: this.punti, perfetto: this.perfetto });
    }

    // scala del tempo: rallenta all'arrivo di un incontro, poi torna normale
    const voluta = this.incontro && this.incontro.t < 1.1 ? 0.45 : 1;
    this.scalaTempo = lerp(this.scalaTempo, voluta, 0.08);
  }

  aggiornaIncontri(dt) {
    const p = this.pilota;
    this.attesaIncontro = Math.max(0, this.attesaIncontro - dt);
    const inc = this.incontro;
    if (inc) {
      inc.t += dt;
      const s = this.stelle[inc.i];
      const d = Math.hypot(p.x - s.x, p.y - s.y);
      if (d > 48) { // il pilota si allontana: la stella aspetta, nessuna penalità
        this.incontro = null;
        this.attesaIncontro = 1.5;
        this.emetti('incontro-sospeso', { i: inc.i });
        return;
      }
      // risposta volontaria: non basta attraversare un anello, bisogna restarci dentro finché si riempie
      let dentro = null;
      if (inc.t > 0.9) for (const a of inc.anelli) if (!a.via && Math.hypot(p.x - a.x, p.y - a.y) < MONDO.raggioAnello) { dentro = a; break; }
      if (!dentro) inc.dentro = null;
      else {
        if (!inc.dentro || inc.dentro.k !== dentro.k) { inc.dentro = { k: dentro.k, carica: 0 }; this.emetti('anello-dentro', { k: dentro.k }); }
        inc.dentro.carica += dt / MONDO.conferma;
        if (inc.dentro.carica >= 1) { const k = inc.dentro.k; inc.dentro = null; this.rispondi(k); }
      }
      return;
    }
    if (this.attesaIncontro > 0) return;
    for (let i = 0; i < this.stelle.length; i++) {
      const s = this.stelle[i];
      if (s.stato !== 'spenta') continue;
      if (Math.hypot(p.x - s.x, p.y - s.y) < MONDO.raggioIncontro) { this.apriIncontro(i); break; }
    }
  }

  apriIncontro(i, silenzioso = false) {
    const s = this.stelle[i];
    const n = s.corrente.opzioni.length;
    const ang = ANGOLI[n] || ANGOLI[4];
    // gli anelli si aprono attorno alla stella; il pilota viene spinto piano verso l'esterno
    const anelli = s.corrente.opzioni.map((o, k) => {
      const a = (ang[k] * Math.PI) / 180;
      return { k, x: s.x + Math.cos(a) * MONDO.raggioAnelli, y: s.y + Math.sin(a) * MONDO.raggioAnelli * 0.8, via: false, nasce: k * 0.12 };
    });
    this.incontro = { i, anelli, t: 0 };
    // il pilota si ferma e resta sospeso al centro: verso un anello ci va solo se lo guida lo studente
    this.pilota.vx *= 0.2; this.pilota.vy *= 0.2;
    if (!silenzioso) this.emetti('incontro', { i, x: s.x, y: s.y });
  }

  /** Risposta: dall'anello attraversato, dal tasto 1-4 o dal tocco sull'opzione */
  rispondi(k) {
    const inc = this.incontro;
    if (!inc) return;
    const s = this.stelle[inc.i];
    const a = inc.anelli[k];
    if (!a || a.via) return;
    const o = s.corrente.opzioni[k];
    s.tentativi++;
    if (o.giusta) {
      s.stato = 'accesa';
      s.accesaDa = this.tempo;
      const pt = puntiStella({ tentativi: s.tentativi, gemello: s.usaGemello, aiuto: s.aiuto });
      this.punti += pt;
      const primo = s.tentativi === 1 && !s.usaGemello;
      if (!primo) this.perfetto = false;
      this.serieAmente = primo && !s.aiuto ? this.serieAmente + 1 : 0;
      this.pilota.energia = Math.min(this.pilota.energiaMax, this.pilota.energia + 35);
      this.incontro = null;
      this.attesaIncontro = 0.8;
      this.emetti('giusta', { i: inc.i, x: a.x, y: a.y, sx: s.x, sy: s.y, punti: pt, primo, amente: primo && !s.aiuto, gemello: s.usaGemello, serie: this.serieAmente, allenata: s.allenata });
      if (this.stelle.every((t) => t.stato === 'accesa')) {
        this.portaleAperto = true;
        this.punti += 200;
        this.emetti('completa', { punti: this.punti });
      }
      return;
    }
    this.perfetto = false;
    this.serieAmente = 0;
    a.via = true;
    this.emetti('sbagliata', { i: inc.i, x: a.x, y: a.y, perche: o.perche, tentativi: s.tentativi });
    // dopo due errori: la spiegazione e il problema gemello (stessa idea, numeri nuovi), come nella Quest
    if (s.tentativi >= 2 && !s.usaGemello) {
      const prima = s.corrente;
      s.usaGemello = true;
      s.corrente = s.gemello();
      this.emetti('gemello', { i: inc.i, spiegazione: prima.spiegazione });
      this.apriIncontro(inc.i, true); // la UI la aggiorna l'evento gemello, con la spiegazione
      this.incontro.t = 0.3;
    }
  }

  chiediAiuto() {
    if (!this.incontro) return null;
    const s = this.stelle[this.incontro.i];
    s.aiuto = true;
    return s.corrente.aiuto || '';
  }

  aggiornaArchi(dt) {
    for (const ar of this.archi) {
      const on = this.stelle[ar.a].stato === 'accesa' && this.stelle[ar.b].stato === 'accesa';
      if (on && ar.prog < 1) {
        if (ar.prog === 0) this.emetti('arco', { a: ar.a, b: ar.b });
        ar.prog = Math.min(1, ar.prog + dt * 1.4);
      }
    }
  }

  /** Eventi accumulati dall'ultima lettura */
  prendiEventi() { const e = this.eventi; this.eventi = []; return e; }
}

// Vista costellazione della home: una nebulosa in tre dimensioni, semantica e interattiva.
// - Le posizioni (x, y, z) arrivano da data/mappa.json, calcolate dal build: la nebulosa parte identica a ogni visita.
// - La tela disegna in prospettiva polvere, legami e stelle; i pulsanti HTML sopra la tela portano etichette,
//   fuoco da tastiera e nomi per i lettori di schermo.
// - Rotazione lenta e inerziale: trascinando lo sfondo la nebulosa gira, e continua piano nel verso dato.
//   Si ferma mentre si legge una scheda, si punta una stella o si usa la tastiera.
// - Le stelle sono elastiche: trascinandone una, quelle collegate la seguono; al rilascio resta dove è stata lasciata
//   e le altre si assestano attorno. "Ricentra" rimette tutto com'era.
// - Zoom semantico: da lontano sezioni e parole principali, da vicino anche le figlie.
// - Effetti sobri: particelle lungo i legami della stella scelta o puntata, un'onda verso i vicini al clic,
//   stelle visitate accese e scia del percorso (salvate nel browser).
// - Con "riduci movimento" del sistema o "Riduci effetti" del menu: niente rotazione, voli, elasticità né effetti.
// - Si disegna solo quando qualcosa si muove e solo se la pagina è in primo piano.
// Senza questo file la home mostra l'elenco.

const html = document.documentElement;
const cielo = document.getElementById('cielo');
const E = window.omElenco; // ricerca e schede dell'elenco (sito/elenco.js)

if (cielo && E) avviaTutto();

function avviaTutto() {
    const tela = document.getElementById('cielo-tela');
    const ctx = tela.getContext('2d');
    const scheda = document.getElementById('scheda');
    const statoEl = document.getElementById('cielo-stato');
    const visteEl = document.getElementById('cielo-viste');
    const cerca = document.getElementById('cerca');
    const dati = JSON.parse(document.getElementById('om-mappa').textContent);
    const mediaRiduci = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stretto = window.matchMedia('(max-width: 859px)');
    const quieto = () => mediaRiduci.matches || html.dataset.effetti === 'ridotti';
    const TAU = Math.PI * 2;
    const CHIAVE_VISTA = 'orfini_vista', CHIAVE_VISTE = 'orfini_stelle_viste';
    const VOCE_SEZIONE = { esplora: 'attivita', allenati: 'allenati', journal: 'journal', archivio: 'archivio' };
    const SOGLIA_FIGLIE = 1.4;   // ingrandimento (rispetto alla nebulosa intera) da cui si leggono le figlie
    const FUOCO = 2600;          // distanza dell'osservatore: più è grande, meno prospettiva
    const GIRO_LENTO = 0.045;    // radianti al secondo: un giro in poco più di due minuti
    const IMBARDATA_INIZIALE = 0, BECCHEGGIO_INIZIALE = 0.12;
    const forma = (s) => `<svg class="forma" viewBox="0 0 16 16" aria-hidden="true">${dati.forme[s]}</svg>`;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const limita = (v, a, b) => Math.min(b, Math.max(a, v));

    // ---------- nodi e legami ----------
    const nodi = [];
    const perId = new Map();
    for (const z of dati.sezioni) nodi.push({ id: `sezione:${z.id}`, tipo: 'sezione', sezione: z.id, m: [z.x, z.y, z.z], r: z.r, n: z.n, dati: z, figlia: false });
    for (const p of dati.parole) { const voc = E.parole.get(p.id); nodi.push({ id: p.id, tipo: 'stella', sezione: p.sezione, m: [p.x, p.y, p.z], r: p.r, n: p.n, quote: p.quote, voc, figlia: !!voc.p }); }
    for (const n of nodi) {
        perId.set(n.id, n);
        n.el = cielo.querySelector(`.nodo[data-nodo="${n.id}"]`);
        n.vicini = new Map(); // id -> peso
        n.vx = n.vy = n.vz = 0;
        n.fase = (nodi.indexOf(n) * 2.399963) % TAU; // fase del battito: diversa per ogni stella, uguale a ogni visita
    }
    const parolaDi = (i) => perId.get(dati.parole[i].id);
    const legami = dati.legami.map(([a, b, w]) => ({ a: parolaDi(a), b: parolaDi(b), w, famiglia: false }));
    for (const n of nodi) if (n.figlia) legami.push({ a: n, b: perId.get(n.voc.p), w: 0, famiglia: true });
    for (const l of legami) { l.a.vicini.set(l.b.id, Math.max(l.w, l.a.vicini.get(l.b.id) || 0)); l.b.vicini.set(l.a.id, Math.max(l.w, l.b.vicini.get(l.a.id) || 0)); }
    const stelle = nodi.filter((n) => n.tipo === 'stella');

    /** Rimette ogni nodo alla posizione calcolata dal build (o: posizione d'origine; r: dove tende a stare; x: dov'è ora) */
    function ordina() {
        for (const n of nodi) {
            const [mx, my, mz] = n.m;
            n.ox = verticale ? my : mx; n.oy = verticale ? mx : my; n.oz = mz; // su schermo verticale la nebulosa si alza in piedi
            n.x = n.rx = n.ox; n.y = n.ry = n.oy; n.z = n.rz = n.oz; n.vx = n.vy = n.vz = 0; n.posata = false;
        }
    }

    // ---------- polvere: la nebulosa attorno alle stelle (stessa a ogni visita: generatore con seme) ----------
    const polvere = [];
    function semina() {
        let seme = 20261110;
        const caso = () => { seme = (seme + 0x6D2B79F5) >>> 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        const gauss = () => (caso() + caso() + caso() + caso() - 2) / 2;
        polvere.length = 0;
        for (let i = 0; i < 320; i++) {
            const c = nodi[Math.floor(caso() * nodi.length)], largo = c.tipo === 'sezione' ? 260 : 90 + c.r * 3;
            polvere.push({ c, dx: gauss() * largo, dy: gauss() * largo * 0.8, dz: gauss() * largo, g: 0.5 + caso() * 1.3, a: 0.12 + caso() * 0.33 });
        }
    }

    // ---------- stato ----------
    let W = 0, H = 0, dpr = 1;
    let k = 1, tx = 0, ty = 0, k0 = 1;          // schermo = t + k · prospettiva · (punto ruotato)
    let imbardata = IMBARDATA_INIZIALE, beccheggio = BECCHEGGIO_INIZIALE;
    let giro = 0, giroSu = 0, verso = 1;         // velocità di rotazione (rad/s) e verso scelto dall'ultima interazione
    let verticale = null;
    let grande = 1;                              // sugli schermi piccoli le stelle sono un po' più grandi rispetto alle distanze
    let pausa = false;                           // rotazione e battito fermati con il pulsante
    let avviata = false, mosso = false, fuocoDentro = false;
    let scelto = null, sopra = null, trovati = null;
    let colori = {};
    let inCorso = false, volo = null, fisicaAttiva = false, ultimo = 0;
    let tornaA = null;
    let preso = null, gesto = null;
    let costo = 0;                               // millisecondi spesi a disegnare l'ultimo fotogramma
    const onde = [];                             // { n, da: ms }
    let viste = [];
    try { viste = JSON.parse(localStorage.getItem(CHIAVE_VISTE) || '[]').filter((id) => perId.has(id)); } catch (e) { viste = []; }

    // ---------- colori dal tema ----------
    function leggiColori() {
        const cs = getComputedStyle(html);
        const v = (n) => cs.getPropertyValue(n).trim();
        colori = { attivita: v('--om-attivita'), allenati: v('--om-allenati'), journal: v('--om-journal'), archivio: v('--om-archivio'), testo: v('--om-testo'), fondo: v('--om-fondo'), accento: v('--om-accento'), chiaro: html.classList.contains('theme-light') };
    }
    new MutationObserver(() => { leggiColori(); if (quieto()) { giro = giroSu = 0; } disegna(); }).observe(html, { attributes: true, attributeFilter: ['class', 'data-effetti'] });

    // ---------- prospettiva ----------
    /** Punto (x, y, z) -> posizione ruotata e fattore di prospettiva, con gli angoli dati */
    function ruota(x, y, z, im = imbardata, be = beccheggio) {
        const ci = Math.cos(im), si = Math.sin(im), cb = Math.cos(be), sb = Math.sin(be);
        const x1 = x * ci + z * si, z1 = -x * si + z * ci;
        const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
        return { x: x1, y: y2, z: z2, p: FUOCO / (FUOCO - z2) };
    }
    /** Spostamento sullo schermo (in pixel) -> spostamento nello spazio, alla profondità del nodo */
    function daSchermo(dx, dy, scala) {
        const a = dx / scala, b = dy / scala, ci = Math.cos(imbardata), si = Math.sin(imbardata), cb = Math.cos(beccheggio), sb = Math.sin(beccheggio);
        return { x: a * ci + b * sb * si, y: b * cb, z: a * si - b * sb * ci };
    }
    function proietta(n) {
        const q = ruota(n.x, n.y, n.z);
        n.sx = tx + k * q.p * q.x; n.sy = ty + k * q.p * q.y; n.scala = k * q.p; n.prof = q.z; n.sr = n.r * n.scala * grande;
    }

    // ---------- inquadrature ----------
    function margini() {
        const m = stretto.matches ? { alto: 84, destra: 50, basso: 96, sinistra: 50 } : { alto: 84, destra: 70, basso: 84, sinistra: 70 };
        if (!scheda.hidden) { if (stretto.matches) m.basso = scheda.offsetHeight + 16; else m.destra = scheda.offsetWidth + 24; }
        return m;
    }
    const centroLibero = () => { const m = margini(); return { x: (m.sinistra + W - m.destra) / 2, y: (m.alto + H - m.basso) / 2, lw: Math.max(80, W - m.sinistra - m.destra), lh: Math.max(80, H - m.alto - m.basso) }; };
    /** Ingrandimento con cui tutta la nebulosa sta nello schermo a qualunque angolo di rotazione */
    function scalaIntera() {
        const c = centroLibero();
        let orizzontale = 1, alto = 1;
        for (const n of nodi) { orizzontale = Math.max(orizzontale, Math.hypot(n.ox, n.oz) + n.r * 1.5); alto = Math.max(alto, Math.abs(n.oy) + n.r * 1.5); }
        return Math.min(c.lw / (2 * orizzontale * 1.04), c.lh / (2 * alto * 1.18));
    }
    const tutta = () => { const c = centroLibero(); return { k: k0, tx: c.x, ty: c.y, imbardata, beccheggio }; };
    /** Vista che porta un gruppo di nodi davanti all'osservatore e lo inquadra nello spazio libero */
    function inquadra(elenco, { min = 0, max = Infinity } = {}) {
        let cx = 0, cy = 0, cz = 0;
        for (const n of elenco) { cx += n.x; cy += n.y; cz += n.z; }
        cx /= elenco.length; cy /= elenco.length; cz /= elenco.length;
        const im = Math.hypot(cx, cz) > 30 ? Math.atan2(-cx, cz) : imbardata;
        const be = limita(Math.atan2(cy, Math.hypot(cx, cz) + 200) * 0.6, -0.35, 0.45);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of elenco) { const q = ruota(n.x, n.y, n.z, im, be), r = n.r * 1.6 * q.p; x0 = Math.min(x0, q.p * q.x - r); x1 = Math.max(x1, q.p * q.x + r); y0 = Math.min(y0, q.p * q.y - r); y1 = Math.max(y1, q.p * q.y + r); }
        const c = centroLibero();
        const kk = limita(Math.min(c.lw / (x1 - x0), c.lh / (y1 - y0)), min, max);
        return { k: kk, tx: c.x - kk * (x0 + x1) / 2, ty: c.y - kk * (y0 + y1) / 2, imbardata: im, beccheggio: be };
    }
    function vaiA(dest, animato = true) {
        dest.k = limita(dest.k, k0 * 0.7, k0 * 7);
        dest.imbardata ??= imbardata; dest.beccheggio ??= beccheggio;
        // la rotazione prende la strada più corta
        dest.imbardata = imbardata + Math.atan2(Math.sin(dest.imbardata - imbardata), Math.cos(dest.imbardata - imbardata));
        if (!animato || quieto()) { volo = null; ({ k, tx, ty, imbardata, beccheggio } = dest); disegna(); return; }
        volo = { da: { k, tx, ty, imbardata, beccheggio }, a: dest, t0: performance.now(), durata: 620 };
        disegna();
    }
    function ricentra(animato = true) {
        mosso = false;
        for (const n of nodi) { n.rx = n.ox; n.ry = n.oy; n.rz = n.oz; n.posata = false; }
        if (quieto()) for (const n of nodi) { n.x = n.ox; n.y = n.oy; n.z = n.oz; n.vx = n.vy = n.vz = 0; } else avviaFisica();
        k0 = scalaIntera();
        vaiA({ ...tutta(), imbardata: IMBARDATA_INIZIALE, beccheggio: BECCHEGGIO_INIZIALE }, animato);
    }
    function zoomSu(fattore, cx = W / 2, cy = H / 2, animato = false) {
        const kk = limita(k * fattore, k0 * 0.7, k0 * 7);
        const dest = { k: kk, tx: cx - (cx - tx) * (kk / k), ty: cy - (cy - ty) * (kk / k) };
        mosso = true;
        if (animato) vaiA(dest); else { volo = null; ({ k, tx, ty } = dest); disegna(); }
    }
    const visibileASchermo = (n) => { proietta(n); const m = margini(); return n.sx > m.sinistra && n.sx < W - m.destra && n.sy > m.alto - 30 && n.sy < H - m.basso + 30; };

    function ridimensiona() {
        const r = cielo.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const eraW = W;
        W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
        tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
        const v = W / H < 0.85;
        if (v !== verticale) { verticale = v; ordina(); semina(); mosso = false; }
        k0 = scalaIntera(); grande = limita(0.5 / k0, 1, 1.7);
        if (!mosso || !eraW) { volo = null; ({ k, tx, ty } = scelto ? destinazione(scelto) : tutta()); }
        disegna();
    }

    // ---------- ciclo: gira solo mentre qualcosa si muove ----------
    const rotazioneFerma = () => quieto() || pausa || !scheda.hidden || !!sopra || !!gesto || fuocoDentro;
    function disegna() { if (!inCorso) { inCorso = true; requestAnimationFrame(fotogramma); } }

    function fotogramma(ora) {
        inCorso = false;
        if (html.dataset.vista !== 'costellazione' || !W || document.visibilityState !== 'visible') { ultimo = 0; return; }
        const dt = ultimo ? Math.min(0.05, (ora - ultimo) / 1000) : 0.016; ultimo = ora;

        if (volo) {
            const t = Math.min(1, (ora - volo.t0) / volo.durata), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const tra = (c) => volo.da[c] + (volo.a[c] - volo.da[c]) * e;
            k = tra('k'); tx = tra('tx'); ty = tra('ty'); imbardata = tra('imbardata'); beccheggio = tra('beccheggio');
            if (t >= 1) volo = null;
            giro = giroSu = 0;
        } else if (!(gesto && gesto.tipo === 'ruota')) {
            // inerzia: la velocità tende piano a quella di crociera, nel verso dato dall'ultima interazione (a zero se si sta leggendo)
            const ferma = rotazioneFerma();
            giro += ((ferma ? 0 : verso * GIRO_LENTO) - giro) * Math.min(1, dt * (ferma ? 6 : 0.9));
            giroSu += (0 - giroSu) * Math.min(1, dt * 2.2);
            if (ferma && Math.abs(giro) < 0.002) giro = 0;         // ferma davvero, non quasi
            if (Math.abs(giroSu) < 0.002) giroSu = 0;
            imbardata += giro * dt;
            beccheggio = limita(beccheggio + giroSu * dt, -0.75, 0.75);
        }
        if (fisicaAttiva) passoFisica(dt);

        const t0 = performance.now();
        dipingi(ora);
        costo = performance.now() - t0;
        const effetti = !quieto() && !pausa && (sopra || scelto || onde.length);
        if (volo || fisicaAttiva || effetti || onde.length || gesto || !rotazioneFerma() || Math.abs(giro) > 0.0006 || Math.abs(giroSu) > 0.0006) disegna();
        else ultimo = 0;
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') disegna(); });

    // ---------- disegno ----------
    function traccia(sezione, x, y, r) {
        ctx.beginPath();
        if (sezione === 'allenati') { const R = r * 1.3; ctx.moveTo(x, y - R); ctx.lineTo(x + R * 0.92, y + R * 0.62); ctx.lineTo(x - R * 0.92, y + R * 0.62); ctx.closePath(); }
        else if (sezione === 'journal') { const R = r * 1.22; ctx.moveTo(x, y - R); ctx.lineTo(x + R, y); ctx.lineTo(x, y + R); ctx.lineTo(x - R, y); ctx.closePath(); }
        else if (sezione === 'archivio') { const q = r * 0.9; ctx.rect(x - q, y - q, q * 2, q * 2); }
        else ctx.arc(x, y, r, 0, TAU);
    }
    // quanto è vicino all'osservatore: 0 in fondo, 1 davanti
    const davanti = (z) => limita((z + 520) / 1040, 0, 1);

    function dipingi(ora) {
        const vicino = k >= k0 * SOGLIA_FIGLIE;
        const sfumaFiglie = limita((k / k0 - 1.1) / (SOGLIA_FIGLIE - 1.1), 0, 1);
        const evidenza = sopra || scelto;
        const attivo = (n) => !trovati || n.tipo === 'sezione' || trovati.has(n.id);
        const fermo = quieto() || pausa;
        for (const n of nodi) proietta(n);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.lineCap = 'round';

        // nubi delle sezioni e polvere
        if (!colori.chiaro) {
            for (const n of nodi) if (n.tipo === 'sezione') {
                const R = 300 * n.scala, g = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, R);
                g.addColorStop(0, colori[n.sezione]); g.addColorStop(1, 'transparent');
                ctx.globalAlpha = (0.05 + 0.06 * davanti(n.prof)) * (fermo ? 1 : 1 + 0.25 * Math.sin(ora / 2600 + n.fase)); ctx.fillStyle = g; ctx.fillRect(n.sx - R, n.sy - R, R * 2, R * 2);
            }
        }
        for (const p of polvere) {
            const q = ruota(p.c.x + p.dx, p.c.y + p.dy, p.c.z + p.dz);
            const x = tx + k * q.p * q.x, y = ty + k * q.p * q.y;
            if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
            ctx.globalAlpha = p.a * (0.35 + 0.65 * davanti(q.z)) * (trovati ? 0.4 : 1);
            ctx.fillStyle = colori[p.c.sezione];
            const g = Math.max(0.7, p.g * k * q.p * 1.4);
            ctx.fillRect(x - g / 2, y - g / 2, g, g);
        }

        // legami: più attività in comune, linea più spessa
        for (const l of legami) {
            const tocca = evidenza && (l.a === evidenza || l.b === evidenza);
            let alfa = l.famiglia ? 0.42 : (colori.chiaro ? 0.2 : 0.13);
            if (l.famiglia && !vicino) alfa *= 0.35 + 0.65 * sfumaFiglie;
            if ((l.a.figlia || l.b.figlia) && !l.famiglia) alfa *= 0.25 + 0.75 * sfumaFiglie;
            if (trovati && !(attivo(l.a) && attivo(l.b))) alfa *= 0.2;
            alfa *= 0.45 + 0.55 * davanti((l.a.prof + l.b.prof) / 2);
            if (evidenza) alfa = tocca ? 0.9 : alfa * 0.45;
            ctx.globalAlpha = alfa;
            ctx.strokeStyle = tocca ? colori[evidenza.sezione] : colori.testo;
            ctx.lineWidth = l.famiglia ? 1.5 : 0.6 + 0.75 * Math.min(l.w, 6);
            ctx.beginPath(); ctx.moveTo(l.a.sx, l.a.sy); ctx.lineTo(l.b.sx, l.b.sy); ctx.stroke();
            // particelle: scorrono dalla stella scelta (o puntata) verso le vicine
            if (tocca && !fermo) {
                const da = l.a === evidenza ? l.a : l.b, a = l.a === evidenza ? l.b : l.a;
                ctx.fillStyle = colori[evidenza.sezione];
                for (let j = 0; j < 2; j++) {
                    const t = ((ora / 1500) + j / 2 + (a.r % 7) / 7) % 1;
                    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.95;
                    ctx.beginPath(); ctx.arc(da.sx + (a.sx - da.sx) * t, da.sy + (a.sy - da.sy) * t, 2.2, 0, TAU); ctx.fill();
                }
            }
        }

        // scia del percorso: le ultime stelle visitate, in ordine
        if (viste.length > 1) {
            const ultime = viste.slice(-10).map((id) => perId.get(id));
            ctx.globalAlpha = colori.chiaro ? 0.5 : 0.4; ctx.strokeStyle = colori.accento; ctx.lineWidth = 1.6; ctx.setLineDash([2, 7]);
            ctx.beginPath(); ultime.forEach((n, i) => (i ? ctx.lineTo(n.sx, n.sy) : ctx.moveTo(n.sx, n.sy))); ctx.stroke();
            ctx.setLineDash([]);
        }

        // stelle e sezioni, dalla più lontana alla più vicina. Ogni stella pulsa piano, con una fase sua
        for (const n of [...nodi].sort((a, b) => a.prof - b.prof)) {
            const battito = fermo ? 0 : Math.sin(ora / (n.tipo === 'sezione' ? 1900 : 1150) + n.fase);
            const sr = n.sr * (1 + 0.055 * battito);
            let alfa = n.figlia ? 0.3 + 0.7 * sfumaFiglie : 1;
            alfa *= 0.5 + 0.5 * davanti(n.prof);
            if (!attivo(n)) alfa *= 0.16;
            else if (evidenza && n !== evidenza && !evidenza.vicini.has(n.id) && n.tipo === 'stella') alfa *= 0.5;
            if (n === evidenza) alfa = 1;
            const c = colori[n.sezione], vista = n.tipo === 'stella' && viste.includes(n.id);
            // alone: respira con il battito (più ampio e luminoso quando la stella si espande)
            if (alfa > 0.4) { ctx.globalAlpha = (colori.chiaro ? 0.09 : (vista ? 0.24 : 0.13)) * alfa * (1 + 0.35 * battito); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(n.sx, n.sy, n.sr * ((vista ? 2.3 : 1.9) + 0.28 * battito), 0, TAU); ctx.fill(); }
            ctx.globalAlpha = alfa;
            ctx.fillStyle = c;
            traccia(n.sezione, n.sx, n.sy, sr); ctx.fill();
            if (n.tipo === 'sezione') { ctx.fillStyle = colori.fondo; traccia(n.sezione, n.sx, n.sy, sr * 0.38); ctx.fill(); }
            else {
                // anello: quanto pesa ogni sezione tra le voci della parola
                const parti = Object.entries(n.quote).filter(([, q]) => q > 0);
                if (parti.length > 1 && (!n.figlia || sfumaFiglie > 0.5)) {
                    let a = -Math.PI / 2; const R = n.sr * 1.42 + 2, spazio = 0.09;
                    ctx.lineWidth = Math.max(2, n.sr * 0.13); ctx.lineCap = 'butt';
                    for (const [s, q] of parti) { const ampiezza = (q / n.n) * TAU; ctx.strokeStyle = colori[s]; ctx.beginPath(); ctx.arc(n.sx, n.sy, R, a + spazio / 2, a + ampiezza - spazio / 2); ctx.stroke(); a += ampiezza; }
                    ctx.lineCap = 'round';
                }
                // stella già visitata: un punto di luce al centro
                if (vista) { ctx.fillStyle = colori.chiaro ? '#fff' : colori.testo; ctx.beginPath(); ctx.arc(n.sx, n.sy, Math.max(2, n.sr * 0.24), 0, TAU); ctx.fill(); }
            }
            if (n === scelto) { ctx.globalAlpha = 1; ctx.strokeStyle = colori.testo; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(n.sx, n.sy, n.sr * 1.42 + 8, 0, TAU); ctx.stroke(); }
        }

        // onde: dal clic ai vicini, con un ritardo che cresce con la distanza
        for (let i = onde.length - 1; i >= 0; i--) {
            const o = onde[i], t = (ora - o.da) / 650;
            if (t >= 1) { onde.splice(i, 1); continue; }
            if (t < 0) continue;
            ctx.globalAlpha = (1 - t) * 0.8; ctx.strokeStyle = colori[o.n.sezione]; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(o.n.sx, o.n.sy, o.n.sr * (1.5 + 1.6 * t) + 4, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        sistemaNodi(vicino);
    }

    /** Posiziona i pulsanti sopra le stelle e sceglie quali etichette mostrare senza sovrapporle */
    function sistemaNodi(vicino) {
        const dischi = [], etichette = [];
        const tocca = (r, o) => !(r.x1 < o.x0 || r.x0 > o.x1 || r.y1 < o.y0 || r.y0 > o.y1);
        for (const n of nodi) {
            n.sd = Math.max(28, n.sr * 2 * 1.08); // area da toccare: il disco della stella, almeno 28 px
            n.el.style.transform = `translate(${n.sx.toFixed(1)}px, ${n.sy.toFixed(1)}px)`;
            n.el.style.setProperty('--d', `${n.sd.toFixed(1)}px`);
            n.el.style.zIndex = String(1000 + Math.round(n.prof));
            n.nascosta = n.figlia && !vicino && n !== scelto;
            // una figlia che sparisce mentre ha il fuoco lo passa al padre: chi usa la tastiera non perde il posto
            if (n.nascosta && document.activeElement === n.el) perId.get(n.voc.p).el.focus({ preventScroll: true });
            n.spenta = !!trovati && n.tipo === 'stella' && !trovati.has(n.id);
            n.el.classList.toggle('nascosta', n.nascosta);
            n.el.classList.toggle('spenta', n.spenta);
            n.el.classList.toggle('scelta', n === scelto);
            const rr = n.sr * 1.1;
            if (!n.nascosta) dischi.push({ n, x0: n.sx - rr, x1: n.sx + rr, y0: n.sy - rr, y1: n.sy + rr });
        }
        for (const n of [...nodi].sort((a, b) => priorita(b) - priorita(a))) {
            let mostra = false;
            if (!n.spenta && !n.nascosta) {
                n.largo ??= n.el.firstElementChild.offsetWidth || 60;
                const r = { x0: n.sx - n.largo / 2 - 2, x1: n.sx + n.largo / 2 + 2, y0: n.sy + n.sd / 2 + 2, y1: n.sy + n.sd / 2 + 23 };
                const forzata = n.tipo === 'sezione' || n === scelto || n === sopra;
                mostra = forzata || (etichette.every((o) => !tocca(r, o)) && dischi.every((o) => o.n === n || !tocca(r, o)));
                if (mostra) etichette.push(r);
            }
            n.el.classList.toggle('con-etichetta', mostra);
        }
    }
    function priorita(n) {
        if (n.tipo === 'sezione') return 1e6;
        if (n === scelto) return 9e5;
        if (n === sopra) return 8e5;
        // a parità, vince chi ha più voci ed è più avanti
        return (trovati && trovati.has(n.id) ? 1e5 : 0) + (n.figlia ? 0 : 1e4) + n.n * 10 + n.prof * 0.05;
    }

    // ---------- elasticità ----------
    // Ogni stella tende al suo posto (r); i legami tendono a mantenere la forma d'origine (o). Spostando una stella
    // il suo posto diventa quello nuovo: le collegate la seguono in parte e si assestano, niente torna indietro di scatto.
    function passoFisica(dt) {
        const passi = 2, h = dt / passi;
        for (let s = 0; s < passi; s++) {
            for (const n of nodi) { n.fx = -14 * (n.x - n.rx); n.fy = -14 * (n.y - n.ry); n.fz = -14 * (n.z - n.rz); }
            for (const l of legami) {
                const kk = l.famiglia ? 60 : 8 * Math.min(l.w, 4);
                const dx = (l.a.x - l.b.x) - (l.a.ox - l.b.ox), dy = (l.a.y - l.b.y) - (l.a.oy - l.b.oy), dz = (l.a.z - l.b.z) - (l.a.oz - l.b.oz);
                l.a.fx -= kk * dx; l.a.fy -= kk * dy; l.a.fz -= kk * dz; l.b.fx += kk * dx; l.b.fy += kk * dy; l.b.fz += kk * dz;
            }
            for (const n of nodi) {
                if (n.tipo === 'sezione' || n === preso || n.posata) { n.vx = n.vy = n.vz = 0; continue; }
                const freno = 1 - 4.2 * h; // smorzamento basso: oscilla un poco prima di fermarsi
                n.vx = (n.vx + n.fx * h) * freno; n.vy = (n.vy + n.fy * h) * freno; n.vz = (n.vz + n.fz * h) * freno;
                n.x += n.vx * h; n.y += n.vy * h; n.z += n.vz * h;
            }
        }
        if (!preso) {
            let moto = 0;
            for (const n of nodi) moto = Math.max(moto, Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(n.vz));
            if (moto < 0.4) { for (const n of nodi) n.vx = n.vy = n.vz = 0; fisicaAttiva = false; }
        }
    }
    function avviaFisica() { fisicaAttiva = true; disegna(); }
    /** Pulsante pausa: ferma rotazione, battito e particelle (chi vuole può fermare ciò che si muove da solo) */
    function mettiInPausa(si) {
        pausa = si;
        const b = cielo.querySelector('[data-comando="pausa"]');
        b.setAttribute('aria-pressed', String(si));
        b.setAttribute('aria-label', si ? 'Riprendi il movimento' : 'Ferma il movimento');
        b.title = si ? 'Riprendi il movimento' : 'Ferma il movimento';
        if (si) { giro = giroSu = 0; }
        disegna();
    }

    // ---------- puntatore ----------
    // sfondo: un dito o il mouse ruotano; due dita ingrandiscono e spostano; Maiusc o tasto destro spostano.
    // stella: si trascina (elastica). Rotella: ingrandisce.
    const puntatori = new Map();
    let ignoraClic = false;
    const locale = (e) => { const r = cielo.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    cielo.addEventListener('contextmenu', (e) => { if (!e.target.closest('.scheda, a')) e.preventDefault(); });
    cielo.addEventListener('pointerdown', (e) => {
        ignoraClic = false; // un nuovo gesto: il clic che lo chiude vale, a meno che diventi un trascinamento
        if (e.target.closest('.scheda, .cielo-legenda, .cielo-comandi') || (e.pointerType === 'mouse' && e.button === 1)) return;
        const p = locale(e);
        puntatori.set(e.pointerId, p);
        if (puntatori.size === 2) {
            const [a, b] = [...puntatori.values()];
            if (preso) rilasciaStella();
            gesto = { tipo: 'pizzico', dist: Math.hypot(a.x - b.x, a.y - b.y), k, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
            volo = null; ignoraClic = true;
        } else if (puntatori.size === 1) {
            const el = e.target.closest('.nodo');
            gesto = { tipo: 'forse', x: p.x, y: p.y, nodo: el ? perId.get(el.dataset.nodo) : null, sposta: e.shiftKey || e.button === 2, t: performance.now() };
            ignoraClic = false;
        }
    });
    cielo.addEventListener('pointermove', (e) => {
        if (!puntatori.has(e.pointerId) || !gesto) return;
        const p = locale(e), prima = puntatori.get(e.pointerId);
        puntatori.set(e.pointerId, p);
        if (gesto.tipo === 'pizzico') {
            if (puntatori.size < 2) return;
            const [a, b] = [...puntatori.values()];
            const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, dist = Math.hypot(a.x - b.x, a.y - b.y);
            const kk = limita(gesto.k * dist / gesto.dist, k0 * 0.7, k0 * 7);
            tx = cx - (gesto.cx - tx) * (kk / k); ty = cy - (gesto.cy - ty) * (kk / k); k = kk;
            gesto.cx = cx; gesto.cy = cy; mosso = true; disegna();
            return;
        }
        if (gesto.tipo === 'forse') {
            if (Math.hypot(p.x - gesto.x, p.y - gesto.y) < 6) return;
            const elastica = gesto.nodo && gesto.nodo.tipo === 'stella' && !quieto();
            gesto.tipo = elastica ? 'stella' : (gesto.sposta || quieto() ? 'sposta' : 'ruota');
            ignoraClic = true; volo = null;
            cielo.classList.add('trascina', 'usata');
            try { cielo.setPointerCapture(e.pointerId); } catch (err) { /* puntatore già rilasciato */ }
            if (elastica) { preso = gesto.nodo; preso.posata = false; avviaFisica(); }
        }
        const dx = p.x - prima.x, dy = p.y - prima.y, ora = performance.now(), dt = Math.max(0.008, (ora - gesto.t) / 1000);
        gesto.t = ora;
        if (gesto.tipo === 'sposta') { tx += dx; ty += dy; mosso = true; }
        else if (gesto.tipo === 'ruota') {
            const di = dx * 0.0052, db = dy * 0.004;
            imbardata += di; beccheggio = limita(beccheggio + db, -0.75, 0.75);
            // velocità del gesto: al rilascio la nebulosa continua a girare e rallenta piano
            giro = giro * 0.6 + (di / dt) * 0.4; giroSu = giroSu * 0.6 + (db / dt) * 0.4;
        } else if (gesto.tipo === 'stella' && preso) {
            const d = daSchermo(dx, dy, preso.scala);
            preso.x += d.x; preso.y += d.y; preso.z += d.z;
        }
        disegna();
    });
    function rilasciaStella() {
        // la stella resta esattamente dove è stata lasciata (posata): le collegate si assestano attorno a lei
        preso.rx = preso.x; preso.ry = preso.y; preso.rz = preso.z; preso.posata = true;
        preso = null; avviaFisica();
    }
    const rilascia = (e) => {
        if (!puntatori.delete(e.pointerId)) return;
        if (puntatori.size === 0) {
            if (preso) rilasciaStella();
            if (gesto && gesto.tipo === 'ruota') {
                if (performance.now() - gesto.t > 120) { giro = 0; giroSu = 0; } // fermo prima del rilascio: nessuna spinta
                giro = limita(giro, -2.6, 2.6); giroSu = limita(giroSu, -1.2, 1.2);
                if (Math.abs(giro) > 0.02) verso = Math.sign(giro);
            }
            gesto = null; cielo.classList.remove('trascina');
            disegna();
        } else if (gesto && gesto.tipo === 'pizzico') {
            const [p] = [...puntatori.values()];
            gesto = { tipo: 'sposta', x: p.x, y: p.y, t: performance.now() };
        }
    };
    cielo.addEventListener('pointerup', rilascia);
    cielo.addEventListener('pointercancel', rilascia);
    cielo.addEventListener('wheel', (e) => {
        if (e.target.closest('.scheda, .cielo-legenda')) return;
        e.preventDefault();
        const p = locale(e);
        cielo.classList.add('usata');
        zoomSu(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016)), p.x, p.y);
    }, { passive: false });

    cielo.addEventListener('click', (e) => {
        // il clic che il browser manda alla fine di un trascinamento non apre niente; i clic da tastiera (detail 0) valgono sempre
        if (ignoraClic && e.detail > 0) { ignoraClic = false; e.preventDefault(); e.stopPropagation(); return; }
        const comando = e.target.closest('[data-comando]');
        if (comando) {
            const c = comando.dataset.comando;
            if (c === 'piu') zoomSu(1.5, W / 2, H / 2, true);
            else if (c === 'meno') zoomSu(1 / 1.5, W / 2, H / 2, true);
            else if (c === 'azzera') { viste = []; salvaViste(); disegna(); }
            else if (c === 'pausa') mettiInPausa(!pausa);
            else ricentra();
            return;
        }
        if (e.target.closest('[data-informazioni]') && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
            // il piè di pagina (diario di bordo, licenza, privacy) sta sotto l'elenco: lo si mostra senza cambiare la vista preferita
            e.preventDefault(); imposta('elenco', false); document.getElementById('piede').scrollIntoView(); return;
        }
        const el = e.target.closest('.nodo');
        if (el) { apri(perId.get(el.dataset.nodo), { da: el, onda: true }); return; }
        if (e.target === tela || e.target === cielo || e.target.id === 'cielo-nodi') chiudi({ fuoco: false });
    }, true);

    cielo.addEventListener('pointerover', (e) => { const el = e.target.closest('.nodo'); const n = el ? perId.get(el.dataset.nodo) : null; if (n !== sopra && e.pointerType === 'mouse' && !gesto) { sopra = n; disegna(); } });
    cielo.addEventListener('pointerleave', () => { if (sopra) { sopra = null; disegna(); } });

    // ---------- tastiera ----------
    cielo.addEventListener('focusin', (e) => {
        const el = e.target.closest('.nodo');
        fuocoDentro = !!el && el.matches(':focus-visible');
        if (!el || gesto || !fuocoDentro) return;
        const n = perId.get(el.dataset.nodo);
        // con la tastiera il nodo viene portato davanti e, se è una figlia ancora nascosta, la vista si avvicina
        if (n.figlia && k < k0 * SOGLIA_FIGLIE) vaiA(destinazione(perId.get(n.voc.p)));
        else if (!visibileASchermo(n) || n.prof < -150) vaiA({ ...inquadra([n]), k });
        sopra = n; disegna();
    });
    cielo.addEventListener('focusout', () => { fuocoDentro = false; sopra = null; disegna(); });
    cielo.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !scheda.hidden) { e.preventDefault(); chiudi(); return; }
        if (e.target.closest('.scheda') || e.target.closest('summary')) return;
        const passo = 70;
        if (e.shiftKey && e.key.startsWith('Arrow')) { // Maiusc + frecce: sposta
            if (e.key === 'ArrowLeft') tx += passo; else if (e.key === 'ArrowRight') tx -= passo; else if (e.key === 'ArrowUp') ty += passo; else ty -= passo;
            mosso = true;
        }
        else if (e.key === 'ArrowLeft') imbardata -= 0.2; else if (e.key === 'ArrowRight') imbardata += 0.2;   // frecce: ruota
        else if (e.key === 'ArrowUp') beccheggio = limita(beccheggio - 0.12, -0.75, 0.75); else if (e.key === 'ArrowDown') beccheggio = limita(beccheggio + 0.12, -0.75, 0.75);
        else if (e.key === '+' || e.key === '=') { zoomSu(1.3, W / 2, H / 2, true); e.preventDefault(); return; }
        else if (e.key === '-') { zoomSu(1 / 1.3, W / 2, H / 2, true); e.preventDefault(); return; }
        else if (e.key === '0') { ricentra(); e.preventDefault(); return; }
        else return;
        e.preventDefault(); volo = null; disegna();
    });

    // ---------- scheda ----------
    /** Dove volare quando si apre un nodo: un padre con le sue figlie, una sezione con le sue parole, una stella con un po' di contesto */
    function destinazione(n) {
        if (n.tipo === 'sezione') return inquadra([n, ...stelle.filter((s) => !s.figlia && s.sezione === n.sezione)], { max: k0 * 2 });
        const famiglia = stelle.filter((s) => s.voc.p === n.id);
        if (famiglia.length) return inquadra([n, ...famiglia], { min: k0 * SOGLIA_FIGLIE * 1.06, max: k0 * 1.9 });
        if (n.figlia) return inquadra([n, perId.get(n.voc.p), ...stelle.filter((s) => s.voc.p === n.voc.p)], { min: k0 * SOGLIA_FIGLIE * 1.06, max: k0 * 1.9 });
        // stella sola: davanti all'osservatore, al centro dello spazio libero
        const d = inquadra([n]), kk = limita(Math.max(k, k0 * 1.25), k0, k0 * 2.2), q = ruota(n.x, n.y, n.z, d.imbardata, d.beccheggio), c = centroLibero();
        return { k: kk, tx: c.x - kk * q.p * q.x, ty: c.y - kk * q.p * q.y, imbardata: d.imbardata, beccheggio: d.beccheggio };
    }

    const vociDi = (ids) => E.schede.filter((s) => [...s.parole].some((p) => ids.has(p))).map((s) => s.el);
    function rigaVoce(card) {
        const a = card.querySelector('.card-link');
        const esterno = a.target === '_blank';
        return `<li><a href="${esc(a.getAttribute('href'))}"${esterno ? ' target="_blank" rel="noopener"' : ''}><small>${esc(dati.tipi[card.dataset.tipo] || '')}${esterno ? ' · sito esterno' : ''}</small><span>${card.querySelector('.card-titolo').innerHTML}</span></a></li>`;
    }
    const pulsanteParola = (m) => `<button type="button" data-vai="${m.id}" data-sezione="${m.sezione}">${forma(m.sezione)}${esc(m.voc.n)}</button>`;
    const chiudiSvg = '<svg class="icona" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

    function contenutoStella(n) {
        const v = n.voc;
        const cards = vociDi(new Set([n.id, ...E.figlie(n.id)]));
        const gruppi = dati.sezioni.map((z) => {
            const mie = cards.filter((c) => c.dataset.sezione === z.id);
            return mie.length ? `<section data-sezione="${z.id}"><h3>${forma(z.id)}${esc(z.nome)} <span>${mie.length}</span></h3><ul class="scheda-voci">${mie.map(rigaVoce).join('')}</ul></section>` : '';
        }).join('');
        const famiglia = v.p ? [perId.get(v.p), ...stelle.filter((s) => s.voc.p === v.p && s !== n)] : stelle.filter((s) => s.voc.p === n.id);
        const vicine = [...n.vicini].filter(([id]) => !famiglia.some((f) => f.id === id)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => perId.get(id));
        return `<div class="scheda-testa" data-sezione="${n.sezione}">
            <div><p class="scheda-occhiello">${forma(n.sezione)}Parola chiave · ${cards.length} ${cards.length === 1 ? 'voce' : 'voci'}</p><h2 id="scheda-titolo" tabindex="-1">${esc(v.n)}</h2></div>
            <button type="button" class="scheda-chiudi" data-chiudi aria-label="Chiudi la scheda">${chiudiSvg}</button>
        </div>
        <div class="scheda-corpo">
            <p class="scheda-desc">${esc(v.d)}</p>
            ${v.a.length ? `<p class="scheda-alias">Detto anche: ${v.a.map(esc).join(', ')}.</p>` : ''}
            ${famiglia.length ? `<section><h3>${v.p ? 'Fa parte di' : 'Comprende'}</h3><div class="scheda-vicine">${famiglia.map(pulsanteParola).join('')}</div></section>` : ''}
            ${gruppi}
            ${vicine.length ? `<section><h3>Parole vicine</h3><div class="scheda-vicine">${vicine.map(pulsanteParola).join('')}</div></section>` : ''}
            <a class="scheda-azione" href="?vista=elenco&amp;parola=${n.id}" data-vista-elenco>Vedi nell'elenco</a>
        </div>`;
    }
    function contenutoSezione(n) {
        const z = n.dati;
        const piu = stelle.filter((s) => s.quote[z.id] > 0).sort((a, b) => b.quote[z.id] - a.quote[z.id] || b.n - a.n).slice(0, 12);
        const vai = z.vai ? `<a class="scheda-azione principale" href="${esc(z.vai[0])}">${esc(z.vai[1])}</a>` : '';
        return `<div class="scheda-testa" data-sezione="${z.id}">
            <div><p class="scheda-occhiello">${forma(z.id)}Sezione · ${z.n} voci</p><h2 id="scheda-titolo" tabindex="-1">${esc(z.nome)}</h2></div>
            <button type="button" class="scheda-chiudi" data-chiudi aria-label="Chiudi la scheda">${chiudiSvg}</button>
        </div>
        <div class="scheda-corpo" data-sezione="${z.id}">
            <p class="scheda-desc">${esc(z.frase)}</p>
            ${vai}
            <section><h3>Le parole più presenti</h3><div class="scheda-vicine">${piu.map(pulsanteParola).join('')}</div></section>
            <a class="scheda-azione" href="?vista=elenco&amp;sezione=${z.id}" data-vista-elenco>Vedi tutte le ${z.n} voci nell'elenco</a>
        </div>`;
    }

    function salvaViste() {
        try { localStorage.setItem(CHIAVE_VISTE, JSON.stringify(viste)); } catch (e) { /* archivio del browser non disponibile: il percorso vale per questa visita */ }
        visteEl.textContent = viste.length ? `Stelle visitate: ${viste.length} di ${stelle.length}.` : 'Nessuna stella visitata: quelle che apri restano accese.';
        cielo.querySelector('[data-comando="azzera"]').hidden = viste.length === 0;
    }

    function apri(n, { da = null, fuoco = true, vola = true, onda = false } = {}) {
        if (!n) return;
        if (scheda.hidden) tornaA = da || document.activeElement;
        scelto = n;
        scheda.innerHTML = n.tipo === 'sezione' ? contenutoSezione(n) : contenutoStella(n);
        scheda.hidden = false; scheda.scrollTop = 0;
        cielo.classList.add('con-scheda', 'usata');
        if (n.tipo === 'stella') { viste = viste.filter((id) => id !== n.id); viste.push(n.id); if (viste.length > 60) viste.shift(); salvaViste(); }
        // un'onda parte dalla stella e raggiunge le vicine, prima le più vicine
        if (onda && !quieto()) {
            const ora = performance.now();
            for (const id of n.vicini.keys()) { const v = perId.get(id); onde.push({ n: v, da: ora + Math.min(700, Math.hypot(v.x - n.x, v.y - n.y, v.z - n.z) * 1.1) }); }
        }
        // l'elenco resta allineato alla stella aperta: cambiando vista si ritrova lo stesso filtro
        E.stato.parola = n.tipo === 'stella' ? n.id : ''; E.stato.sezione = n.tipo === 'sezione' ? n.sezione : '';
        E.applica();
        if (vola) { mosso = true; vaiA(destinazione(n)); } else disegna();
        if (fuoco) scheda.querySelector('h2').focus({ preventScroll: true });
        statoEl.textContent = `Aperta la scheda: ${n.tipo === 'sezione' ? n.dati.nome : n.voc.n}.`;
    }
    function chiudi({ fuoco = true } = {}) {
        if (scheda.hidden) return;
        const era = scelto;
        scheda.hidden = true; scheda.innerHTML = ''; scelto = null;
        cielo.classList.remove('con-scheda');
        E.stato.parola = ''; E.stato.sezione = ''; E.applica();
        if (fuoco) (era && era.el.isConnected ? era.el : tornaA)?.focus({ preventScroll: true });
        disegna();
    }
    scheda.addEventListener('click', (e) => {
        if (e.target.closest('[data-chiudi]')) { chiudi(); return; }
        const vai = e.target.closest('[data-vai]');
        if (vai) { apri(perId.get(vai.dataset.vai), { onda: true }); return; }
        const elenco = e.target.closest('[data-vista-elenco]');
        if (elenco && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); imposta('elenco', true, { tieni: scelto }); }
    });

    // ---------- ricerca: accende le stelle che corrispondono, spegne le altre ----------
    function evidenzia(q) {
        const testo = E.norma(q);
        if (testo.length < 2) { trovati = null; statoEl.textContent = ''; disegna(); return []; }
        const pezzi = testo.split(' ');
        // prima le parole del vocabolario (anche per alias); se non ce ne sono, le stelle delle attività che contengono il testo
        const ids = new Set(E.paroleTrovate(q).map((t) => t.p.id));
        if (!ids.size) for (const s of E.schede) if (pezzi.every((w) => s.testo.includes(w))) for (const p of s.parole) ids.add(p);
        trovati = ids;
        const elenco = nodi.filter((n) => ids.has(n.id));
        statoEl.textContent = elenco.length ? `${elenco.length} ${elenco.length === 1 ? 'stella' : 'stelle'} per «${q}».` : `Nessuna stella per «${q}».`;
        disegna();
        return elenco;
    }
    if (cerca) {
        cerca.addEventListener('input', () => { if (html.dataset.vista === 'costellazione') evidenzia(cerca.value); });
        cerca.form.addEventListener('submit', () => {
            if (html.dataset.vista !== 'costellazione') return;
            const elenco = evidenzia(cerca.value);
            if (elenco.length === 1) apri(elenco[0], { onda: true });
            else if (elenco.length) { mosso = true; vaiA(inquadra(elenco.flatMap((n) => (n.figlia ? [n, perId.get(n.voc.p)] : [n])), { min: k0, max: k0 * 2.4 })); }
        });
    }

    // ---------- voci del menu: un clic vola sulla sezione ----------
    document.getElementById('barra')?.addEventListener('click', (e) => {
        const a = e.target.closest('.om-voci a[data-voce]');
        if (!a || html.dataset.vista !== 'costellazione' || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        const sezione = VOCE_SEZIONE[a.dataset.voce];
        if (!sezione) return;
        const n = perId.get(`sezione:${sezione}`);
        if (scelto === n) return; // la scheda della sezione è già aperta: il secondo clic segue il link
        e.preventDefault();
        apri(n, { da: a, onda: true });
    });

    // ---------- quale vista ----------
    function aggiornaInterruttore() {
        for (const a of document.querySelectorAll('.om-vista-voce')) {
            if (a.dataset.vista === html.dataset.vista) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        }
    }
    function applicaVista(vista, tieni, avvio) {
        html.dataset.vista = vista;
        document.getElementById('avviso-lento').hidden = !(vista === 'elenco' && html.dataset.vistaAuto === 'lento');
        aggiornaInterruttore();
        if (vista === 'costellazione') {
            const parola = E.stato.parola, sezione = E.stato.sezione;
            avvia();
            if (parola && perId.has(parola)) apri(perId.get(parola), { fuoco: false, vola: false });
            else if (sezione) apri(perId.get(`sezione:${sezione}`), { fuoco: false, vola: false });
            if (scelto) { volo = null; ({ k, tx, ty, imbardata, beccheggio } = destinazione(scelto)); mosso = true; }
            if (E.stato.q) evidenzia(E.stato.q);
            // i nodi vanno al loro posto subito, senza aspettare il prossimo fotogramma (serve alla transizione tra le viste)
            if (W) { for (const n of nodi) proietta(n); sistemaNodi(k >= k0 * SOGLIA_FIGLIE); }
            disegna();
        } else {
            // si passa all'elenco tenendo il filtro della stella aperta
            scheda.hidden = true; scheda.innerHTML = ''; scelto = null; cielo.classList.remove('con-scheda');
            if (tieni) { E.stato.parola = tieni.tipo === 'stella' ? tieni.id : ''; E.stato.sezione = tieni.tipo === 'sezione' ? tieni.sezione : ''; }
            if (!avvio) { E.applica(); window.scrollTo(0, 0); }
        }
    }

    /** Le schede (o le parole dei filtri) dell'elenco e le stelle sono la stessa cosa in due forme: a ognuna un nome di transizione */
    function nomiTransizione(metti) {
        for (const el of document.querySelectorAll('[data-transizione]')) { el.style.viewTransitionName = ''; el.removeAttribute('data-transizione'); }
        if (!metti) return;
        const nome = (el, id) => { el.style.viewTransitionName = `stella-${id}`; el.setAttribute('data-transizione', ''); };
        if (html.dataset.vista === 'costellazione') { for (const n of stelle) if (!n.nascosta && n.sx > 0 && n.sx < W && n.sy > 0 && n.sy < H) nome(n.el, n.id); return; }
        const usate = new Set();
        // le schede che si vedono diventano la stella della loro prima parola…
        for (const s of E.schede) {
            const r = s.el.getBoundingClientRect();
            if (s.el.hidden || !r.width || r.bottom < 60 || r.top > window.innerHeight || usate.size >= 14) continue;
            const id = [...s.parole].find((p) => !usate.has(p) && !perId.get(p).figlia);
            if (id) { usate.add(id); nome(s.el, id); }
        }
        // …le altre stelle nascono dalle parole dei filtri
        for (const a of document.querySelectorAll('.filtri-parole .parola')) {
            const id = a.dataset.parola, r = a.getBoundingClientRect();
            if (!usate.has(id) && !perId.get(id).figlia && r.width && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth) { usate.add(id); nome(a, id); }
        }
    }

    function imposta(vista, manuale, { tieni = null, avvio = false } = {}) {
        if (manuale) { try { localStorage.setItem(CHIAVE_VISTA, vista); } catch (e) { /* archivio del browser non disponibile */ } html.removeAttribute('data-vista-auto'); }
        const cambia = () => applicaVista(vista, tieni, avvio);
        if (!avvio && manuale && document.startViewTransition && !quieto() && html.dataset.vista !== vista) {
            nomiTransizione(true);
            const t = document.startViewTransition(() => { nomiTransizione(false); cambia(); nomiTransizione(true); });
            t.finished.finally(() => nomiTransizione(false));
        } else cambia();
        const p = new URLSearchParams(location.search);
        if (p.has('vista')) { p.delete('vista'); const s = p.toString(); history.replaceState(null, '', location.pathname + (s ? `?${s}` : '') + location.hash); }
    }
    document.addEventListener('click', (e) => {
        const a = e.target.closest('.om-vista-voce[data-vista]');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        if (a.dataset.vista !== html.dataset.vista) imposta(a.dataset.vista, true, { tieni: scelto });
    });
    document.getElementById('prova-mappa').addEventListener('click', () => imposta('costellazione', true));

    function avvia() {
        if (!avviata) {
            avviata = true;
            leggiColori();
            salvaViste();
            new ResizeObserver(ridimensiona).observe(cielo);
        }
        ridimensiona();
    }

    /** Prova di un secondo all'avvio: sotto i 20 fotogrammi al secondo si passa all'elenco, con un avviso.
        Vale solo se nessuno ha scelto la vista a mano e se la pagina è rimasta in primo piano per tutta la prova. */
    function provaFluidita() {
        let fotogrammi = 0, valida = document.visibilityState === 'visible';
        const inizio = performance.now();
        const nascosta = () => { valida = false; };
        document.addEventListener('visibilitychange', nascosta);
        const giroProva = (ora) => {
            fotogrammi++;
            if (ora - inizio < 1000) { if (W) dipingi(ora); requestAnimationFrame(giroProva); return; }
            document.removeEventListener('visibilitychange', nascosta);
            if (valida && html.dataset.vistaAuto === 'si' && html.dataset.vista === 'costellazione' && fotogrammi < 20) {
                html.dataset.vistaAuto = 'lento';
                imposta('elenco', false);
            }
        };
        requestAnimationFrame(giroProva);
    }

    // ---------- partenza ----------
    window.omCielo = {
        nodi, apri: (id) => apri(perId.get(id)), chiudi, ricentra, pausa: mettiInPausa, costo: () => costo,
        vista: () => ({ k, tx, ty, k0, W, H, verticale, imbardata, beccheggio, giro, inMoto: !!volo || fisicaAttiva, pausa, viste: [...viste] }),
    };
    // ?vista= nell'indirizzo (l'interruttore delle altre pagine) è una scelta fatta a mano: si ricorda
    imposta(html.dataset.vista === 'costellazione' ? 'costellazione' : 'elenco', new URLSearchParams(location.search).has('vista'), { avvio: true });
    if (html.dataset.vista === 'costellazione' && html.dataset.vistaAuto === 'si') provaFluidita();
}

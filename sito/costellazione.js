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
    const FUOCO = 1700;          // distanza dell'osservatore: più è piccola, più prospettiva (campo visivo ampio)
    const ZOOM_MIN = 0.12;       // si può allontanare la vista fino a un ottavo: resta solo il Sole, la parola Matematica
    const GIRO_LENTO = 0.045;    // radianti al secondo: un giro in poco più di due minuti
    const IMBARDATA_INIZIALE = 0, BECCHEGGIO_INIZIALE = 0.12;
    const CORPO_MAX = Math.pow(1.7, 0.8);       // quanto cresce al massimo una parola avvicinandosi
    const forma = (s) => `<svg class="forma" viewBox="0 0 16 16" aria-hidden="true">${dati.forme[s]}</svg>`;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const limita = (v, a, b) => Math.min(b, Math.max(a, v));

    // ---------- nodi e legami ----------
    const nodi = [];
    const perId = new Map();
    for (const z of dati.sezioni) nodi.push({ id: `sezione:${z.id}`, tipo: 'sezione', sezione: z.id, m: [z.x, z.y, z.z], r: z.r, n: z.n, dati: z, figlia: false });
    for (const p of dati.parole) { const voc = E.parole.get(p.id); nodi.push({ id: p.id, tipo: 'stella', sezione: p.sezione, m: [p.x, p.y, p.z], r: p.r, n: p.n, quote: p.quote, voc, figlia: !!voc.p }); }
    if (dati.sole) nodi.push({ id: 'sole', tipo: 'sole', sezione: 'sole', m: [0, 0, 0], r: dati.sole.r, n: dati.sole.n, figlia: false });
    for (const n of nodi) {
        perId.set(n.id, n);
        n.el = cielo.querySelector(`.nodo[data-nodo="${n.id}"]`);
        n.vicini = new Map(); // id -> peso
        n.vx = n.vy = n.vz = 0;
        n.fase = (nodi.indexOf(n) * 2.399963) % TAU; // fase del battito: diversa per ogni stella, uguale a ogni visita
    }
    const nodiOrdinati = [...nodi];
    const parolaDi = (i) => perId.get(dati.parole[i].id);
    const legami = dati.legami.map(([a, b, w]) => ({ a: parolaDi(a), b: parolaDi(b), w, famiglia: false }));
    for (const n of nodi) if (n.figlia) legami.push({ a: n, b: perId.get(n.voc.p), w: 0, famiglia: true });
    for (const l of legami) { l.a.vicini.set(l.b.id, Math.max(l.w, l.a.vicini.get(l.b.id) || 0)); l.b.vicini.set(l.a.id, Math.max(l.w, l.b.vicini.get(l.a.id) || 0)); }
    const stelle = nodi.filter((n) => n.tipo === 'stella');
    const molle = [];   // le molle della fisica: una per ogni filo che si vede (anche i raggi del Sole), e nessun'altra
    {   // raggi dal Sole alle sezioni e alle parole principali (non contano come parole vicine)
        const sole = perId.get('sole');
        if (sole) for (const n of nodi) if (n.tipo === 'sezione' || (n.tipo === 'stella' && !n.figlia)) legami.push({ a: sole, b: n, w: 0, famiglia: false, sole: true });
    }
    // rigidezza: più attività in comune, più il legame è saldo; i figli stanno stretti al padre; il Sole tiene le sezioni
    for (const l of legami) molle.push({ a: l.a, b: l.b, k: l.sole ? (l.b.tipo === 'sezione' ? 14 : 2.2) : l.famiglia ? 45 : 6 * Math.min(l.w, 4) });
    for (const n of nodi) n.massa = n.tipo === 'sole' ? 4 : n.tipo === 'sezione' ? 2.5 : 1;
    const molleDaOrigine = () => { for (const m of molle) { m.vx = m.a.ox - m.b.ox; m.vy = m.a.oy - m.b.oy; m.vz = m.a.oz - m.b.oz; } };
    const molleDaOra = () => { for (const m of molle) { m.vx = m.a.x - m.b.x; m.vy = m.a.y - m.b.y; m.vz = m.a.z - m.b.z; } };

    /** Rimette ogni nodo alla posizione calcolata dal build (o: posizione d'origine; r: dove tende a stare; x: dov'è ora) */
    function ordina() {
        for (const n of nodi) {
            const [mx, my, mz] = n.m;
            n.ox = verticale ? my : mx; n.oy = verticale ? mx : my; n.oz = mz; // su schermo verticale la nebulosa si alza in piedi
            n.x = n.rx = n.ox; n.y = n.ry = n.oy; n.z = n.rz = n.oz; n.vx = n.vy = n.vz = 0; n.posata = false;
        }
        if (typeof molleDaOrigine === 'function') molleDaOrigine();
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
            polvere.push({ c, dx: gauss() * largo, dy: gauss() * largo * 0.8, dz: gauss() * largo, g: 0.5 + caso() * 1.3, a: 0.12 + caso() * 0.33, esagono: i % 11 === 0 });
        }
        distribuisciSimboli();
    }

    // ---------- stato ----------
    let W = 0, H = 0, dpr = 1;
    let k = 1, tx = 0, ty = 0, k0 = 1;          // schermo = t + k · prospettiva · (punto ruotato)
    let imbardata = IMBARDATA_INIZIALE, beccheggio = BECCHEGGIO_INIZIALE;
    let giro = 0, giroSu = 0, verso = 1;         // velocità di rotazione (rad/s) e verso scelto dall'ultima interazione
    let verticale = null;
    let testo = 1;                               // scala del testo: più grande sulla LIM, più piccolo sul telefono
    let grande = 1;                              // sugli schermi piccoli le stelle sono un po' più grandi rispetto alle distanze
    let pausa = false;                           // rotazione e battito fermati con il pulsante
    let avviata = false, mosso = false, fuocoDentro = false;
    let scelto = null, sopra = null, trovati = null;
    let colori = {};
    let inCorso = false, volo = null, fisicaAttiva = false, ultimo = 0, ultimoRaf = 0, emaVsync = 16.7;
    let tornaA = null;
    let preso = null, gesto = null, ricentrando = false;
    let costo = 0;                               // millisecondi spesi a disegnare l'ultimo fotogramma
    const onde = [];                             // { n, da: ms }
    let viste = [];
    try { viste = JSON.parse(localStorage.getItem(CHIAVE_VISTE) || '[]').filter((id) => perId.has(id)); } catch (e) { viste = []; }

    // ---------- colori dal tema ----------
    function leggiColori() {
        const cs = getComputedStyle(html);
        const v = (n) => cs.getPropertyValue(n).trim();
        colori = { attivita: v('--om-attivita'), allenati: v('--om-allenati'), journal: v('--om-journal'), archivio: v('--om-archivio'), testo: v('--om-testo'), fondo: v('--om-fondo'), accento: v('--om-accento'), sole: v('--om-sole'), chiaro: html.classList.contains('theme-light') };
    }
    new MutationObserver(() => { leggiColori(); if (quieto()) { giro = giroSu = 0; } disegna(); }).observe(html, { attributes: true, attributeFilter: ['class', 'data-effetti'] });

    // ---------- prospettiva ----------
    let ciF = Math.cos(imbardata), siF = Math.sin(imbardata), cbF = Math.cos(beccheggio), sbF = Math.sin(beccheggio);
    const qF = { x: 0, y: 0, z: 0, p: 1 };
    function preparaRotazione() {
        ciF = Math.cos(imbardata); siF = Math.sin(imbardata);
        cbF = Math.cos(beccheggio); sbF = Math.sin(beccheggio);
    }
    /** Punto (x, y, z) -> posizione ruotata e fattore di prospettiva con gli angoli del fotogramma corrente (zero allocazioni) */
    function ruotaVeloce(x, y, z) {
        const x1 = x * ciF + z * siF, z1 = -x * siF + z * ciF;
        const y2 = y * cbF - z1 * sbF, z2 = y * sbF + z1 * cbF;
        qF.x = x1; qF.y = y2; qF.z = z2; qF.p = FUOCO / (FUOCO - z2);
        return qF;
    }
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
        const q = ruotaVeloce(n.x, n.y, n.z);
        n.sx = tx + k * q.p * q.x; n.sy = ty + k * q.p * q.y; n.scala = k * q.p; n.prof = q.z; n.sr = n.r * n.scala * grande;
        // corpo del testo: cresce con il numero di voci e con la vicinanza all'osservatore
        n.riduci = Math.pow(limita(n.scala / k0, n.tipo === 'sole' ? 1 : 0.75, 1.7), 0.8) / CORPO_MAX; // tra 0,52 e 1: la parola è scritta al corpo massimo e rimpicciolita
        n.corpo = n.corpoPieno * n.riduci;
    }

    // ---------- inquadrature ----------
    function margini() {
        const m = stretto.matches ? { alto: 84, destra: 50, basso: 96, sinistra: 50 } : { alto: 84, destra: 70, basso: 84, sinistra: 70 };
        if (!scheda.hidden) { if (stretto.matches) m.basso = scheda.offsetHeight + 16; else m.destra = scheda.offsetWidth + 24; }
        return m;
    }
    const centroLibero = () => { const m = margini(); return { x: (m.sinistra + W - m.destra) / 2, y: (m.alto + H - m.basso) / 2, lw: Math.max(80, W - m.sinistra - m.destra), lh: Math.max(80, H - m.alto - m.basso) }; };
    /** Ingrandimento con cui tutta la nebulosa sta nello schermo a qualunque angolo di rotazione, prospettiva compresa */
    function scalaIntera() {
        const c = centroLibero();
        let migliore = Infinity;
        for (const im of [0, 0.35, -0.35, 0.7, -0.7]) { // l'inizio della rotazione: più avanti qualche parola passa vicina all'osservatore, ed è la prospettiva
            let mx = 1, my = 1;
            for (const n of nodi) {
                if (n.tipo === 'sole') continue;
                const q = ruota(n.ox, n.oy, n.oz, im, BECCHEGGIO_INIZIALE), r = n.r * 1.5 * q.p;
                mx = Math.max(mx, (Math.abs(q.x) * q.p + r) / (c.lw / 2)); my = Math.max(my, (Math.abs(q.y) * q.p + r) / (c.lh / 2));
            }
            migliore = Math.min(migliore, 1 / (Math.max(mx, my) * 1.02));
        }
        return migliore;
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
        dest.k = limita(dest.k, k0 * ZOOM_MIN, k0 * 7);
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
        molleDaOrigine(); ricentrando = true;
        if (quieto()) { for (const n of nodi) { n.x = n.ox; n.y = n.oy; n.z = n.oz; n.vx = n.vy = n.vz = 0; } ricentrando = false; } else avviaFisica();
        k0 = scalaIntera();
        vaiA({ ...tutta(), imbardata: IMBARDATA_INIZIALE, beccheggio: BECCHEGGIO_INIZIALE }, animato);
    }
    function zoomSu(fattore, cx = W / 2, cy = H / 2, animato = false) {
        const kk = limita(k * fattore, k0 * ZOOM_MIN, k0 * 7);
        const dest = { k: kk, tx: cx - (cx - tx) * (kk / k), ty: cy - (cy - ty) * (kk / k) };
        mosso = true;
        if (animato) vaiA(dest); else { volo = null; ({ k, tx, ty } = dest); disegna(); }
    }
    const visibileASchermo = (n) => { preparaRotazione(); proietta(n); const m = margini(); return n.sx > m.sinistra && n.sx < W - m.destra && n.sy > m.alto - 30 && n.sy < H - m.basso + 30; };

    function ridimensiona() {
        const r = cielo.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const eraW = W;
        W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 1.25); // fili e polvere sono sfumati: non serve la risoluzione piena
        tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
        const v = W / H < 0.85;
        if (v !== verticale) { verticale = v; ordina(); semina(); mosso = false; }
        if (!sprite.perla) creaSprite();
        if (!cupola.gruppi[0].length) creaCupola();
        k0 = scalaIntera(); grande = limita(0.5 / k0, 1, 1.7);
        const t = W >= 1800 ? 1.35 : stretto.matches ? 0.8 : 1;
        if (t !== testo || !nodi[0].corpoPieno) { testo = t; misura(); }
        if (!mosso || !eraW) { volo = null; ({ k, tx, ty } = scelto ? destinazione(scelto) : tutta()); }
        disegna();
    }

    // ---------- ciclo: gira solo mentre qualcosa si muove ----------
    const rotazioneFerma = () => quieto() || pausa || !scheda.hidden || !!sopra || !!gesto || fuocoDentro;
    function disegna() { if (!inCorso) { inCorso = true; requestAnimationFrame(fotogramma); } }

    function fotogramma(ora) {
        inCorso = false;
        if (html.dataset.vista !== 'costellazione' || !W || document.visibilityState !== 'visible') { ultimo = 0; ultimoRaf = 0; return; }
        // la nebulosa che gira da sola si muove di meno di un grado al secondo: la tela si ridisegna a circa 24 fotogrammi al secondo.
        // Con un gesto, un volo, l'elasticità o un'onda in corso si ridisegna a ogni fotogramma.
        // Si ridisegna a ogni fotogramma finché il sistema regge; se il ritmo dello schermo cala (macchina affaticata) e nulla si muove
        // in fretta, si scende a circa 28 fotogrammi al secondo.
        const vsync = ultimoRaf ? ora - ultimoRaf : 16.7; ultimoRaf = ora; emaVsync = emaVsync * 0.9 + vsync * 0.1;
        const lenta = !gesto && !volo && !fisicaAttiva && !onde.length && !sopra && !scelto;
        if (lenta && emaVsync > 22 && ultimo && ora - ultimo < 34) { disegna(); return; }
        const dt = ultimo ? Math.min(0.05, (ora - ultimo) / 1000) : 0.016; ultimo = ora; dtF = dt;

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
        if (volo || fisicaAttiva || inTransizione || effetti || onde.length || gesto || !rotazioneFerma() || Math.abs(giro) > 0.0006 || Math.abs(giroSu) > 0.0006) disegna();
        else { ultimo = 0; ultimoRaf = 0; }
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
    // ogni cambiamento di luce è un avvicinamento graduale (esponenziale) alla meta: niente scatti
    const passo = (v, meta, tau) => v + (meta - v) * (1 - Math.exp(-dtF / tau));
    const dolce = (x) => { x = limita(x, 0, 1); return x * x * (3 - 2 * x); };
    const generatore = (seme) => () => { seme = (seme + 0x6D2B79F5) >>> 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

    // piccoli disegni preparati una volta e ricopiati
    const sprite = {};
    function creaSprite() {
        const fai = (dim, fermi) => { const c = document.createElement('canvas'); c.width = c.height = dim; const x = c.getContext('2d'), g = x.createRadialGradient(dim / 2, dim / 2, 0, dim / 2, dim / 2, dim / 2); for (const [o, col] of fermi) g.addColorStop(o, col); x.fillStyle = g; x.fillRect(0, 0, dim, dim); return c; };
        const faiStriscia = (col) => { const c = document.createElement('canvas'); c.width = 256; c.height = 4; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 4); return c; };
        sprite.perla = fai(48, [[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
        sprite.fredda = fai(128, [[0, 'rgba(150,185,255,0.9)'], [0.4, 'rgba(110,150,255,0.35)'], [1, 'rgba(90,120,255,0)']]);
        sprite.calda = fai(128, [[0, 'rgba(255,225,170,0.9)'], [0.4, 'rgba(255,200,130,0.35)'], [1, 'rgba(255,170,100,0)']]);
        sprite.corona = fai(256, [[0, 'rgba(255,228,154,1)'], [0.35, 'rgba(255,190,90,0.25)'], [1, 'rgba(255,190,90,0)']]);
        sprite.strisciaBlu = faiStriscia('rgb(130,165,255)');
        sprite.strisce = new Map();
        sprite.striscia = (col) => { let s = sprite.strisce.get(col); if (!s) { s = faiStriscia(col); sprite.strisce.set(col, s); } return s; };
        sprite.stelle = [[205, 222, 255], [255, 255, 255], [255, 238, 196], [255, 206, 160]].map(([r, g, b]) => fai(64, [[0, `rgba(${r},${g},${b},1)`], [0.18, `rgba(${r},${g},${b},0.45)`], [1, `rgba(${r},${g},${b},0)`]]));
    }

    // ---------- cupola di stelle: il cielo dietro la nebulosa ----------
    // Scura e contrastata, per dare l'idea dell'infinito: moltissime stelle appena visibili, poche nitide e brillanti,
    // di colori diversi, e una Via Lattea molto tenue. Tre strati di profondità girano a velocità diverse (parallasse):
    // quello lontano è fermo e nitido, quello vicino scorre di più ed è sfocato, come lo vedrebbe un obiettivo.
    // La sfocatura è dinamica: cresce verso i bordi dell'immagine (campo visivo ampio, "occhio di pesce") e con la velocità
    // di rotazione (scia). Il cielo "respira" con lo zoom: avvicinandosi alla nebulosa le stelle si aprono appena verso i bordi.
    const cupola = { gruppi: [[], [], [], []], bande: [] };
    const STRATI = [{ f: 0.18, sfoca: 0, luce: 0.7 }, { f: 0.42, sfoca: 0.3, luce: 0.9 }, { f: 0.8, sfoca: 1.2, luce: 1 }];
    const TINTE = ['rgb(205,222,255)', 'rgb(255,255,255)', 'rgb(255,238,196)', 'rgb(255,206,160)'];
    function creaCupola() {
        const caso = generatore(4242), gauss = () => (caso() + caso() + caso() + caso() - 2) / 2;
        const inclina = (x, y, z) => { const c = Math.cos(1.1), s = Math.sin(1.1); return [x, y * c - z * s, y * s + z * c]; };
        for (const g of cupola.gruppi) g.length = 0;
        cupola.bande.length = 0;
        const N = stretto.matches ? 650 : 1300;
        for (let i = 0; i < N; i++) {
            let d;
            if (caso() < 0.38) { const a = caso() * TAU, lat = gauss() * 0.13; d = inclina(Math.cos(a) * Math.cos(lat), Math.sin(lat), Math.sin(a) * Math.cos(lat)); }
            else { const z = 2 * caso() - 1, a = caso() * TAU, r = Math.sqrt(1 - z * z); d = [r * Math.cos(a), r * Math.sin(a), z]; }
            const m = Math.pow(caso(), 4.2), t = caso(), u = caso();
            const tinta = t < 0.40 ? 0 : t < 0.72 ? 1 : t < 0.90 ? 2 : 3, strato = u < 0.62 ? 0 : u < 0.9 ? 1 : 2;
            cupola.gruppi[tinta].push({ dx: d[0], dy: d[1], dz: d[2], m, fase: caso() * TAU, vel: 0.6 + caso() * 1.8, strato });
        }
        for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU + gauss() * 0.05, d = inclina(Math.cos(a), gauss() * 0.05, Math.sin(a)); cupola.bande.push({ dx: d[0], dy: d[1], dz: d[2], r: 0.5 + caso() * 0.6, calda: i % 3 === 0 }); }
    }
    function dipingiCupola(ora, fermo) {
        const grande = W >= 1800 ? 1.3 : 1, rmax = Math.hypot(W, H) / 2;
        const S = Math.max(W, H) * 0.55 * (1 + 0.1 * Math.log2(limita(k / k0, 0.25, 4)));
        const cx = W / 2 + (tx - W / 2) * 0.12, cy = H / 2 + (ty - H / 2) * 0.12;
        const veloce = Math.abs(giro) > 0.15 || Math.abs(giroSu) > 0.15;
        const strato = (dt) => STRATI.map((L) => { const im = imbardata * L.f - giro * dt * L.f, be = beccheggio * L.f - giroSu * dt * L.f; return { ci: Math.cos(im), si: Math.sin(im), cb: Math.cos(be), sb: Math.sin(be) }; });
        const lay = strato(0), coda = veloce ? strato(0.04) : null;
        ctx.globalCompositeOperation = 'lighter';
        for (const b of cupola.bande) { // Via Lattea: nubi appena percettibili
            const L = lay[1], x1 = b.dx * L.ci + b.dz * L.si, z1 = -b.dx * L.si + b.dz * L.ci, y2 = b.dy * L.cb - z1 * L.sb, z2 = b.dy * L.sb + z1 * L.cb;
            if (z2 > 0.6) continue;
            const f = S / (1 - z2), R = (120 + 100 * b.r) * Math.sqrt(1 / (1 - z2)) * (Math.max(W, H) / 900);
            ctx.globalAlpha = 0.03; ctx.drawImage(b.calda ? sprite.calda : sprite.fredda, cx + x1 * f - R, cy + y2 * f - R, R * 2, R * 2);
        }
        for (let g = 0; g < 4; g++) {
            ctx.fillStyle = TINTE[g]; ctx.strokeStyle = TINTE[g];
            for (const s of cupola.gruppi[g]) {
                const L = lay[s.strato], x1 = s.dx * L.ci + s.dz * L.si, z1 = -s.dx * L.si + s.dz * L.ci, y2 = s.dy * L.cb - z1 * L.sb, z2 = s.dy * L.sb + z1 * L.cb;
                if (z2 > 0.6) continue;
                const f = S / (1 - z2), px = cx + x1 * f, py = cy + y2 * f;
                if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;
                const st = STRATI[s.strato], r = Math.hypot(px - cx, py - cy) / rmax;
                let a = (0.07 + 0.93 * Math.pow(s.m, 0.75)) * st.luce;
                if (!fermo && (s.m > 0.45 || s.vel > 2.1)) a *= 0.82 + 0.18 * Math.sin(ora * s.vel / 1000 + s.fase); // scintillio
                const sz = (0.6 + 1.9 * s.m) * grande * (1 + 0.22 * s.strato);
                const sfoca = st.sfoca + 1.2 * r * r; // più sfocata nello strato vicino e verso i bordi
                if (coda) { // rotazione veloce: ogni stella lascia una scia
                    const C = coda[s.strato], cx1 = s.dx * C.ci + s.dz * C.si, cz1 = -s.dx * C.si + s.dz * C.ci, cy2 = s.dy * C.cb - cz1 * C.sb, cz2 = s.dy * C.sb + cz1 * C.cb, cf = S / (1 - cz2);
                    ctx.globalAlpha = a * 0.75; ctx.lineWidth = Math.max(0.7, sz * (1 + 0.3 * sfoca)); ctx.beginPath(); ctx.moveTo(cx + cx1 * cf, cy + cy2 * cf); ctx.lineTo(px, py); ctx.stroke();
                } else if (sfoca < 0.5) { ctx.globalAlpha = a; ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz); } // nitida
                else { const R = sz * (1.5 + 2 * sfoca); ctx.globalAlpha = Math.min(1, a / (1 + 0.9 * sfoca)); ctx.drawImage(sprite.stelle[g], px - R, py - R, R * 2, R * 2); } // fuori fuoco: disco morbido
            }
        }
    }

    // ---------- riflessi dell'obiettivo (lens glare) ----------
    // Una striscia orizzontale anamorfica e, lungo la retta che passa dal centro dello schermo, tre-cinque
    // riflessi esagonali e circolari di tinte diverse. forza: 0 spento, 1 pieno.
    const FANTASMI = [[0.35, 15, 0.20, 195, 6], [0.62, 28, 0.12, 150, 0], [1.1, 10, 0.22, 42, 6], [1.45, 40, 0.08, 275, 0], [1.85, 18, 0.15, 330, 6]];
    function bagliore(x, y, forza, colore, ora) {
        if (forza < 0.02) return;
        const scala = (W >= 1800 ? 1.4 : stretto.matches ? 0.65 : 1), L = (150 + 230 * forza) * scala;
        const str = sprite.striscia(colore);
        ctx.globalAlpha = 0.55 * forza; ctx.drawImage(str, x - L, y - 1.1, L * 2, 2.2);   // striscia sottile e nitida
        ctx.globalAlpha = 0.13 * forza; ctx.drawImage(str, x - L * 1.35, y - 7, L * 2.7, 14);                  // alone della striscia
        ctx.globalAlpha = 0.18 * forza; ctx.drawImage(sprite.strisciaBlu, x - L * 0.7, y + 5, L * 1.4, 1.4);  // riga azzurra, come nelle lenti vere
        const cx = W / 2, cy = H / 2, dx = cx - x, dy = cy - y;
        for (const [t, r, a, hue, lati] of FANTASMI) {
            const px = x + dx * t, py = y + dy * t, R = r * scala * (0.8 + 0.4 * forza);
            ctx.globalAlpha = a * forza; ctx.strokeStyle = `hsl(${hue} 90% 72%)`; ctx.fillStyle = `hsla(${hue}, 90%, 70%, 0.16)`; ctx.lineWidth = 1.2;
            ctx.beginPath();
            if (lati) for (let i = 0; i < lati; i++) ctx.lineTo(px + R * Math.cos(i * TAU / lati + 0.5), py + R * Math.sin(i * TAU / lati + 0.5)); else ctx.arc(px, py, R, 0, TAU);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
    }

    // ---------- simboli: solo simboli, anche avanzati, fissi nello spazio e ben distribuiti ----------
    const simboli = [...cielo.querySelectorAll('.cielo-simbolo')].map((el) => ({ el, x: 0, y: 0, z: 0, op: 0 }));
    function distribuisciSimboli() {
        // reticolo a spirale d'oro sulla superficie di un ellissoide attorno alla nebulosa: distanze quasi uguali, mai due simboli vicini
        const N = simboli.length, RX = verticale ? 640 : 1250, RY = verticale ? 1150 : 700, RZ = 1000;
        simboli.forEach((s, i) => {
            const j = (i * 11) % N; // ordine mescolato, così simboli simili non finiscono accanto
            const y = 1 - ((j + 0.5) * 2) / N, r = Math.sqrt(1 - y * y), th = j * 2.399963 + 0.6, rad = 1 + 0.3 * ((j * 0.618034) % 1);
            s.x = Math.cos(th) * r * RX * rad; s.y = y * RY * rad; s.z = Math.sin(th) * r * RZ * rad;
        });
    }

    let dtF = 0.016, dimEv = 0, inTransizione = false, zoomFade = 1, zoomSez = 1, zoomSole = 1;

    function dipingi(ora) {
        const vicino = k >= k0 * SOGLIA_FIGLIE;
        const sfumaFiglie = limita((k / k0 - 1.1) / (SOGLIA_FIGLIE - 1.1), 0, 1);
        const evidenza = (sopra && sopra.tipo !== 'sole' ? sopra : null) || (scelto && scelto.tipo !== 'sole' ? scelto : null);
        const attivo = (n) => !trovati || n.tipo !== 'stella' || trovati.has(n.id);
        const fermo = quieto() || pausa;
        const sole = perId.get('sole');
        inTransizione = false;
        preparaRotazione();
        for (const n of nodi) proietta(n);
        // zoomando indietro le parole svaniscono una dopo l'altra, e resta la parola Matematica: il Sole della nebulosa
        zoomFade = dolce((k / k0 - 0.22) / 0.42); zoomSez = dolce((k / k0 - 0.12) / 0.3); zoomSole = dolce((k / k0 - 0.08) / 0.3);
        dimEv = passo(dimEv, evidenza ? 1 : 0, 0.35);
        if (Math.abs(dimEv - (evidenza ? 1 : 0)) > 0.01) inTransizione = true;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.lineCap = 'round';

        if (!colori.chiaro) dipingiCupola(ora, fermo);

        // polvere
        if (!colori.chiaro) ctx.globalCompositeOperation = 'lighter';
        for (const p of polvere) {
            const q = ruotaVeloce(p.c.x + p.dx, p.c.y + p.dy, p.c.z + p.dz);
            const x = tx + k * q.p * q.x, y = ty + k * q.p * q.y;
            if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
            ctx.globalAlpha = p.a * (0.35 + 0.65 * davanti(q.z)) * (trovati ? 0.4 : 1) * (0.4 + 0.6 * zoomFade);
            ctx.fillStyle = colori[p.c.sezione] || colori.sole;
            const g = Math.max(0.7, p.g * k * q.p * 1.4);
            if (p.esagono) { const r = 3 + g * 2.2; ctx.globalAlpha *= 1.3; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.beginPath(); for (let a = 0; a < 6; a++) ctx.lineTo(x + r * Math.cos(a * TAU / 6 + q.z * 0.004), y + r * Math.sin(a * TAU / 6 + q.z * 0.004)); ctx.closePath(); ctx.stroke(); }
            else ctx.fillRect(x - g / 2, y - g / 2, g, g);
        }

        // il Sole: una corona dorata dietro la parola Matematica
        if (sole && !colori.chiaro) {
            const batt = fermo ? 0 : Math.sin(ora / 2100), R = (170 + 90 * (1 - zoomFade)) * limita(sole.scala / k0, 0.8, 1.5) * (1 + 0.07 * batt);
            ctx.globalAlpha = 0.22; ctx.drawImage(sprite.corona, sole.sx - R, sole.sy - R, R * 2, R * 2);
        }

        // fili: curvi, che ondeggiano piano, con perle luminose che li percorrono; dal Sole partono raggi sottili
        legami.forEach((l, i) => {
            const tocca = !!evidenza && !l.sole && (l.a === evidenza || l.b === evidenza);
            l.t = passo(l.t || 0, tocca ? 1 : 0, 0.3);
            if (l.t > 0.01 && l.t < 0.99) inTransizione = true;
            let alfa = l.sole ? (l.b.tipo === 'sezione' ? 0.2 : 0.1) : l.famiglia ? 0.5 : (colori.chiaro ? 0.3 : 0.26);
            if (l.famiglia && !vicino) alfa *= 0.35 + 0.65 * sfumaFiglie;
            if ((l.a.figlia || l.b.figlia) && !l.famiglia && !l.sole) alfa *= 0.25 + 0.75 * sfumaFiglie;
            if (trovati && !l.sole && !(attivo(l.a) && attivo(l.b))) alfa *= 0.2;
            alfa *= 0.4 + 0.6 * davanti((l.a.prof + l.b.prof) / 2);
            alfa *= l.sole ? zoomSole : zoomFade;
            alfa = alfa * (1 - 0.6 * dimEv * (1 - l.t)) * (1 - l.t) + 0.95 * l.t * (l.sole ? 0 : zoomFade);
            if (alfa < 0.01) return;
            const ax = l.a.sx, ay = l.a.sy, bx = l.b.sx, by = l.b.sy, dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
            const onda = fermo ? 0 : Math.sin(ora / 2300 + i * 1.7);
            const piega = len * (0.13 + 0.07 * onda) * (i % 2 ? 1 : -1) * (l.sole ? 0.5 : 1);
            const cx = (ax + bx) / 2 - (dy / len) * piega, cy = (ay + by) / 2 + (dx / len) * piega;
            const ca = colori[l.a.sezione], cb = colori[l.b.sezione];
            ctx.globalAlpha = alfa;
            if (l.t > 0.05 && evidenza) ctx.strokeStyle = colori[evidenza.sezione];
            else if (!l.famiglia && l.w >= 2 && ca !== cb) { const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, ca); g.addColorStop(1, cb); ctx.strokeStyle = g; }
            else ctx.strokeStyle = l.a.prof > l.b.prof ? ca : cb;
            ctx.lineWidth = (l.famiglia ? 1.2 : l.sole ? 0.7 : 0.5 + 0.45 * Math.min(l.w, 6)) * (1 + l.t * 0.8);
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, bx, by); ctx.stroke();
            if (fermo || alfa < 0.04) return;
            // perle: ognuna con il suo passo, ogni tanto a riposo. Da una stella scelta partono verso le vicine, più veloci e con la coda
            const periodo = (l.sole ? 5400 : 3400) + ((i * 613) % 2800) - l.t * 1700;
            const fase = (ora / periodo + ((i * 0.381) % 1)) % 1.7;
            if (fase >= 1) return;
            const verso = tocca && l.b === evidenza ? -1 : 1, punti = tocca ? 4 : 1;
            for (let c = 0; c < punti; c++) {
                const f = fase - c * 0.035; if (f < 0) break;
                const t = verso > 0 ? f : 1 - f, u = 1 - t, px = u * u * ax + 2 * u * t * cx + t * t * bx, py = u * u * ay + 2 * u * t * cy + t * t * by;
                const s = (c ? 7 - c : 10 + 7 * l.t) * (c ? 1 : 1 + 0.3 * Math.sin(ora / 130 + i));
                ctx.globalAlpha = Math.min(1, alfa * 5 + l.t) * Math.sin(Math.min(1, f) * Math.PI) / (1 + c * 0.8);
                ctx.drawImage(sprite.perla, px - s, py - s, s * 2, s * 2);
            }
        });

        // scia del percorso: le ultime stelle visitate, in ordine
        if (viste.length > 1) {
            const ultime = viste.slice(-10).map((id) => perId.get(id));
            ctx.globalAlpha = (colori.chiaro ? 0.55 : 0.5) * zoomFade; ctx.strokeStyle = colori.accento; ctx.lineWidth = 1.6; ctx.setLineDash([2, 7]);
            ctx.beginPath(); ultime.forEach((n, i) => (i ? ctx.lineTo(n.sx, n.sy) : ctx.moveTo(n.sx, n.sy))); ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.globalCompositeOperation = 'source-over';

        // le sezioni hanno la loro forma, sopra il nome
        for (const n of nodi) if (n.tipo === 'sezione') {
            const battito = fermo ? 0 : Math.sin(ora / 1900 + n.fase);
            ctx.globalAlpha = (0.55 + 0.45 * davanti(n.prof)) * zoomSez; ctx.fillStyle = colori[n.sezione];
            traccia(n.sezione, n.sx, n.sy - n.corpo * 1.05, n.corpo * 0.5 * (1 + 0.06 * battito)); ctx.fill();
        }

        // onde: dal clic ai vicini, con un ritardo che cresce con la distanza
        for (let i = onde.length - 1; i >= 0; i--) {
            const o = onde[i], t = (ora - o.da) / 650;
            if (t >= 1) { onde.splice(i, 1); continue; }
            if (t < 0) continue;
            ctx.globalAlpha = (1 - t) * 0.8; ctx.strokeStyle = colori[o.n.sezione]; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(o.n.sx, o.n.sy, o.n.sr * (1.5 + 1.6 * t) + 4, 0, TAU); ctx.stroke();
        }

        // riflessi dell'obiettivo: sul Sole sempre (più forti da lontano), sulle stelle scelte o puntate con gradualità
        if (!colori.chiaro) {
            ctx.globalCompositeOperation = 'lighter';
            if (sole) bagliore(sole.sx, sole.sy, (0.5 + 0.5 * (1 - zoomFade)) * (1 + (fermo ? 0 : 0.08 * Math.sin(ora / 1700))), colori.sole, ora);
            for (const n of stelle) {
                n.gl = passo(n.gl || 0, n === evidenza ? 1 : 0, 0.35);
                if (n.gl > 0.01 && n.gl < 0.99) inTransizione = true;
                if (n.gl > 0.02) bagliore(n.sx, n.sy, 0.6 * n.gl, colori[n.sezione], ora);
            }
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = 1;
        sistemaNodi(vicino, evidenza);
    }

    /** Ogni parola è il suo nodo: la mette al suo posto, alla sua grandezza, e sceglie quali accendere senza sovrapporle.
        Le parole che ne coprirebbero un'altra restano in penombra: si accendono ruotando, ingrandendo o cercando.
        Ogni passaggio di luce è graduale. Si scrivono solo trasformazioni e opacità: niente reimpaginazione a ogni fotogramma. */
    function sistemaNodi(vicino) {
        const accese = [];
        const tocca = (r, o) => !(r.x1 < o.x0 || r.x0 > o.x1 || r.y1 < o.y0 || r.y0 > o.y1);
        const classe = (n, nome, si) => { if (n.classi[nome] !== si) { n.classi[nome] = si; n.el.classList.toggle(nome, si); } };
        for (const n of nodi) {
            n.nascT = n.tipo === 'stella' && n.figlia && !vicino && n !== scelto;
            n.fade = n.tipo === 'sole' ? 1 : n.tipo === 'sezione' ? zoomSez : zoomFade;
            n.spenta = !!trovati && n.tipo === 'stella' && !trovati.has(n.id);
            // si smette di poterla toccare solo quando è già sparita
            const nascosta = (n.nascT && (n.luce ?? 0) < 0.03) || n.fade < 0.03;
            // una figlia che sparisce mentre ha il fuoco lo passa al padre: chi usa la tastiera non perde il posto
            if (nascosta && n.figlia && document.activeElement === n.el) perId.get(n.voc.p).el.focus({ preventScroll: true });
            n.el.style.transform = `translate(${n.sx.toFixed(1)}px, ${n.sy.toFixed(1)}px) translate(-50%, -50%) scale(${n.riduci.toFixed(3)})`;
            const z = 1000 + Math.round(n.prof / 40);
            if (z !== n.z_) { n.el.style.zIndex = String(z); n.z_ = z; }
            classe(n, 'nascosta', nascosta); classe(n, 'spenta', n.spenta); classe(n, 'scelta', n === scelto);
            n.prio = priorita(n);
        }
        nodiOrdinati.sort((a, b) => b.prio - a.prio);
        for (const n of nodiOrdinati) {
            let accesa = n.tipo === 'sole';
            if (!accesa && !n.spenta && !n.nascT && n.fade > 0.03) {
                const w = n.largoPieno * n.riduci + 8, h = n.corpo * 1.15 + 6;
                const r = { x0: n.sx - w / 2, x1: n.sx + w / 2, y0: n.sy - h / 2, y1: n.sy + h / 2 };
                accesa = n.tipo === 'sezione' || n === scelto || n === sopra || accese.every((o) => !tocca(r, o));
                if (accesa) accese.push(r);
            } else if (accesa) { const w = n.largoPieno * n.riduci + 8, h = n.corpo * 1.15 + 6; accese.push({ x0: n.sx - w / 2, x1: n.sx + w / 2, y0: n.sy - h / 2, y1: n.sy + h / 2 }); }
            n.era = accesa;
            classe(n, 'con-etichetta', accesa);
            // luminosità: piena davanti, più tenue in fondo; in penombra se un'altra parola le sta sopra
            const d = davanti(n.prof), alto = colori.chiaro ? 0.86 + 0.14 * d : 0.66 + 0.34 * d, basso = 0.07 + 0.12 * d;
            const bersaglio = n.tipo === 'sole' ? 1 : n.nascT ? 0 : n.spenta ? 0.1 * n.fade : (accesa ? alto : basso) * n.fade;
            n.luce = n.luce === undefined ? bersaglio : passo(n.luce, bersaglio, bersaglio > n.luce ? 0.28 : 0.5);
            if (Math.abs(n.luce - bersaglio) > 0.008) inTransizione = true;
            const ot = n.luce.toFixed(2);
            if (ot !== n.opaco) { n.el.style.opacity = ot; n.opaco = ot; }
        }
        for (const s of simboli) {
            const q = ruotaVeloce(s.x, s.y, s.z), bersaglio = (scelto || trovati ? 0.1 : 0.16 + 0.34 * davanti(q.z)) * (0.35 + 0.65 * zoomFade);
            s.op = passo(s.op, bersaglio, 0.6);
            if (Math.abs(s.op - bersaglio) > 0.008) inTransizione = true;
            s.el.style.transform = `translate(${(tx + k * q.p * q.x).toFixed(1)}px, ${(ty + k * q.p * q.y).toFixed(1)}px) translate(-50%, -50%) scale(${limita((k * q.p) / k0, 0.55, 1.5).toFixed(2)})`;
            const ot = s.op.toFixed(2);
            if (ot !== s.opaco) { s.el.style.opacity = ot; s.opaco = ot; }
        }
    }
    /** Scrive ogni parola al suo corpo massimo (una volta sola) e ne misura la larghezza */
    function misura() {
        for (const n of nodi) {
            const base = n.tipo === 'sole' ? 30 : n.tipo === 'sezione' ? 21 : n.figlia ? 11.5 + 1.5 * Math.sqrt(n.n) : 12.5 + 2.1 * Math.sqrt(n.n);
            n.corpoPieno = Math.round(base * CORPO_MAX * testo);
            n.el.style.fontSize = `${n.corpoPieno}px`;
            // alone dietro la parola: più grande per chi ha più voci; il battito parte sfasato da stella a stella
            n.el.style.setProperty('--alone', `${n.tipo === 'sole' ? 11 : n.tipo === 'sezione' ? 9 : (2.4 + 0.42 * Math.sqrt(n.n)).toFixed(2)}em`);
            n.el.style.setProperty('--fase', `${(-n.fase * 0.75).toFixed(2)}s`);
            n.el.classList.toggle('pulsa', n.tipo === 'sole' || n.tipo === 'sezione' || (!n.figlia && n.n >= 9)); // il battito dell'alone solo per le parole grandi: 44 animazioni insieme pesano
            n.classi = {};
            for (const c of ['nascosta', 'spenta', 'scelta', 'con-etichetta']) n.classi[c] = n.el.classList.contains(c);
        }
        for (const n of nodi) n.largoPieno = n.el.offsetWidth || 80;
    }
    function priorita(n) {
        if (n.tipo === 'sole') return 1e7;
        if (n.tipo === 'sezione') return 1e6;
        if (n === scelto) return 9e5;
        if (n === sopra) return 8e5;
        // a parità, vince chi ha più voci ed è più avanti
        // chi era già accesa lo resta (isteresi): le parole non lampeggiano quando due si sfiorano
        return (trovati && trovati.has(n.id) ? 1e5 : 0) + (n.figlia ? 0 : 1e4) + n.n * 10 + n.prof * 0.05 + (n.era ? 60 : 0);
    }

    // ---------- elasticità e plasticità ----------
    // Ogni parola è un peso attaccato al suo posto da una molla debole e alle parole collegate da molle più o meno rigide
    // (in proporzione alle attività in comune). Trascinandone una, le collegate la seguono in proporzione alla rigidezza del
    // legame; poiché lo smorzamento è basso, oltrepassano il punto d'arrivo e rimbalzano prima di fermarsi. Quando tutto è fermo
    // la nuova forma diventa la forma di riposo: la deformazione resta (plastica) finché non si preme "Ricentra".
    // Anche le sezioni e il Sole si possono trascinare: sono più pesanti e si portano dietro le loro parole.
    function passoFisica(dt) {
        const passi = 2, h = dt / passi, ANCORA = 11, SMORZA = 2.1;
        let forzaMax = 0;
        for (let s = 0; s < passi; s++) {
            for (const n of nodi) { n.fx = -ANCORA * (n.x - n.rx); n.fy = -ANCORA * (n.y - n.ry); n.fz = -ANCORA * (n.z - n.rz); }
            for (const m of molle) {
                const dx = (m.a.x - m.b.x) - m.vx, dy = (m.a.y - m.b.y) - m.vy, dz = (m.a.z - m.b.z) - m.vz;
                m.a.fx -= m.k * dx; m.a.fy -= m.k * dy; m.a.fz -= m.k * dz; m.b.fx += m.k * dx; m.b.fy += m.k * dy; m.b.fz += m.k * dz;
            }
            for (const n of nodi) {
                if (n === preso || n.posata) { n.vx = n.vy = n.vz = 0; continue; }
                const freno = Math.max(0, 1 - SMORZA * h), a = h / n.massa;
                n.vx = (n.vx + n.fx * a) * freno; n.vy = (n.vy + n.fy * a) * freno; n.vz = (n.vz + n.fz * a) * freno;
                n.x += n.vx * h; n.y += n.vy * h; n.z += n.vz * h;
                forzaMax = Math.max(forzaMax, Math.abs(n.fx) + Math.abs(n.fy) + Math.abs(n.fz));
            }
        }
        if (!preso) {
            let moto = 0;
            for (const n of nodi) moto = Math.max(moto, Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(n.vz));
            if (moto < 0.45 && forzaMax < 4) {
                // fermi: la forma di adesso diventa quella di riposo (plastica). Dopo "Ricentra" si torna esattamente all'origine.
                for (const n of nodi) {
                    if (ricentrando) { n.x = n.ox; n.y = n.oy; n.z = n.oz; }
                    n.vx = n.vy = n.vz = 0; n.rx = n.x; n.ry = n.y; n.rz = n.z; n.posata = false;
                }
                if (ricentrando) molleDaOrigine(); else molleDaOra();
                ricentrando = false; fisicaAttiva = false;
            }
        }
    }
    function avviaFisica() { fisicaAttiva = true; disegna(); }
    /** Pulsante pausa: ferma rotazione, battito e particelle (chi vuole può fermare ciò che si muove da solo) */
    function mettiInPausa(si) {
        pausa = si;
        const b = cielo.querySelector('[data-comando="pausa"]');
        b.setAttribute('aria-pressed', String(si));
        b.title = si ? 'Riprendi il movimento' : 'Ferma il movimento';
        if (si) { giro = giroSu = 0; }
        cielo.classList.toggle('in-pausa', si);
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
            const kk = limita(gesto.k * dist / gesto.dist, k0 * ZOOM_MIN, k0 * 7);
            tx = cx - (gesto.cx - tx) * (kk / k); ty = cy - (gesto.cy - ty) * (kk / k); k = kk;
            gesto.cx = cx; gesto.cy = cy; mosso = true; disegna();
            return;
        }
        if (gesto.tipo === 'forse') {
            if (Math.hypot(p.x - gesto.x, p.y - gesto.y) < 6) return;
            const elastica = !!gesto.nodo && !quieto();
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
        if (n.tipo === 'sole') return tutta();
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
            return mie.length ? `<section data-sezione="${z.id}"><h3>${forma(z.id)}${esc(z.nome)} <span>${mie.length}</span></h3><ul class="scheda-voci" role="list">${mie.map(rigaVoce).join('')}</ul></section>` : '';
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
    function contenutoSole(n) {
        const sezioni = dati.sezioni.map((z) => `<button type="button" data-vai="sezione:${z.id}" data-sezione="${z.id}">${forma(z.id)}${esc(z.nome)} · ${z.n}</button>`).join('');
        return `<div class="scheda-testa" data-sezione="sole">
            <div><p class="scheda-occhiello">Il centro della nebulosa · ${n.n} voci</p><h2 id="scheda-titolo" tabindex="-1">Matematica</h2></div>
            <button type="button" class="scheda-chiudi" data-chiudi aria-label="Chiudi la scheda">${chiudiSvg}</button>
        </div>
        <div class="scheda-corpo">
            <p class="scheda-desc">Tutto il laboratorio gira attorno a lei: attività da aprire, lezioni per allenarsi, note di diario e verifiche già svolte. Ogni stella è una parola chiave, e più voci ha più è grande.</p>
            <section><h3>Le quattro sezioni</h3><div class="scheda-vicine">${sezioni}</div></section>
            <a class="scheda-azione" href="?vista=elenco" data-vista-elenco>Vedi tutto nell'elenco</a>
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
        for (const n of stelle) n.el.classList.toggle('vista', viste.includes(n.id));
    }

    function apri(n, { da = null, fuoco = true, vola = true, onda = false } = {}) {
        if (!n) return;
        if (scheda.hidden) tornaA = da || document.activeElement;
        scelto = n;
        scheda.innerHTML = n.tipo === 'sole' ? contenutoSole(n) : n.tipo === 'sezione' ? contenutoSezione(n) : contenutoStella(n);
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
        statoEl.textContent = `Aperta la scheda: ${n.tipo === 'sole' ? 'Matematica' : n.tipo === 'sezione' ? n.dati.nome : n.voc.n}.`;
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
        const pezzi = (E.radice ? E.radice(q) : testo).split(' ');
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
            if (W) { preparaRotazione(); for (const n of nodi) proietta(n); sistemaNodi(k >= k0 * SOGLIA_FIGLIE); }
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
            // una parola figlia da lontano non si vede: la scheda vola verso la stella del padre
            const id = [...s.parole].map((p) => (perId.get(p).figlia ? perId.get(p).voc.p : p)).find((p) => !usate.has(p));
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
            document.fonts?.ready.then(() => { misura(); disegna(); }); // i caratteri del sito arrivano dopo: si rimisura
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
            if (ora - inizio < 1000) { requestAnimationFrame(giroProva); return; } // il ciclo normale della nebulosa sta già disegnando: qui si contano solo i fotogrammi
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
        nodi, apri: (id) => apri(perId.get(id)), chiudi, ricentra, pausa: mettiInPausa, costo: () => costo, simboli: () => simboli.map((s) => [s.x, s.y, s.z]),
        vista: () => ({ k, tx, ty, k0, W, H, verticale, imbardata, beccheggio, giro, inMoto: !!volo || fisicaAttiva, pausa, viste: [...viste] }),
    };
    // ?vista= nell'indirizzo (l'interruttore delle altre pagine) è una scelta fatta a mano: si ricorda
    imposta(html.dataset.vista === 'costellazione' ? 'costellazione' : 'elenco', new URLSearchParams(location.search).has('vista'), { avvio: true });
    if (html.dataset.vista === 'costellazione' && html.dataset.vistaAuto === 'si') provaFluidita();
}

// Vista costellazione della home.
// - La disposizione di riposo arriva da data/mappa.json (calcolata dal build): è identica a ogni visita.
// - La tela disegna legami e stelle; i pulsanti HTML sopra la tela portano etichette, fuoco da tastiera e nomi per i lettori di schermo.
// - Le stelle sono elastiche: trascinandone una, quelle collegate la seguono; al rilascio tornano a posto rimbalzando.
//   Con "riduci movimento" la mappa resta ferma (si può solo spostare e ingrandire).
// - Zoom semantico: da lontano sezioni e parole principali, da vicino anche le figlie.
// - Si disegna solo quando qualcosa cambia: a mappa ferma il processore riposa.
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
    const legenda = document.getElementById('cielo-legenda');
    const cerca = document.getElementById('cerca');
    const dati = JSON.parse(document.getElementById('om-mappa').textContent);
    const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stretto = window.matchMedia('(max-width: 859px)');
    const TAU = Math.PI * 2;
    const CHIAVE_VISTA = 'orfini_vista';
    const VOCE_SEZIONE = { esplora: 'attivita', allenati: 'allenati', journal: 'journal', archivio: 'archivio' };
    const SOGLIA_FIGLIE = 1.4;       // ingrandimento (rispetto alla mappa intera) da cui si leggono le figlie
    const forma = (s) => `<svg class="forma" viewBox="0 0 16 16" aria-hidden="true">${dati.forme[s]}</svg>`;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // ---------- nodi e legami ----------
    const nodi = [];
    const perId = new Map();
    for (const z of dati.sezioni) nodi.push({ id: `sezione:${z.id}`, tipo: 'sezione', sezione: z.id, mx: z.x, my: z.y, r: z.r, n: z.n, dati: z, figlia: false });
    for (const p of dati.parole) { const voc = E.parole.get(p.id); nodi.push({ id: p.id, tipo: 'stella', sezione: p.sezione, mx: p.x, my: p.y, r: p.r, n: p.n, quote: p.quote, voc, figlia: !!voc.p }); }
    for (const n of nodi) {
        perId.set(n.id, n);
        n.el = cielo.querySelector(`.nodo[data-nodo="${n.id}"]`);
        n.x = n.rx = n.mx; n.y = n.ry = n.my; n.vx = n.vy = 0;
        n.vicini = new Map(); // id -> peso
    }
    const parolaDi = (i) => perId.get(dati.parole[i].id);
    const legami = dati.legami.map(([a, b, w]) => ({ a: parolaDi(a), b: parolaDi(b), w, famiglia: false }));
    for (const n of nodi) if (n.figlia) legami.push({ a: n, b: perId.get(n.voc.p), w: 0, famiglia: true });
    for (const l of legami) { l.a.vicini.set(l.b.id, Math.max(l.w, l.a.vicini.get(l.b.id) || 0)); l.b.vicini.set(l.a.id, Math.max(l.w, l.b.vicini.get(l.a.id) || 0)); }

    // ---------- stato ----------
    let W = 0, H = 0, dpr = 1;
    let k = 1, tx = 0, ty = 0, k0 = 1;      // schermo = mondo * k + t
    let verticale = null;                    // su schermo verticale la mappa scambia x e y
    let avviata = false, mosso = false;
    let scelto = null, sopra = null, trovati = null; // nodo aperto, nodo sotto il puntatore, Set dei nodi trovati dalla ricerca (null = nessuna ricerca)
    let colori = {};
    let daDisegnare = false, volo = null, fisicaAttiva = false, ultimoPasso = 0;
    let tornaA = null;

    // ---------- colori dal tema ----------
    function leggiColori() {
        const cs = getComputedStyle(html);
        const v = (n) => cs.getPropertyValue(n).trim();
        colori = { attivita: v('--om-attivita'), allenati: v('--om-allenati'), journal: v('--om-journal'), archivio: v('--om-archivio'), testo: v('--om-testo'), fondo: v('--om-fondo'), chiaro: html.classList.contains('theme-light') };
    }
    new MutationObserver(() => { leggiColori(); disegna(); }).observe(html, { attributes: true, attributeFilter: ['class'] });

    // ---------- geometria ----------
    function margini() {
        // spazio per il titolo in alto, per legenda e comandi in basso, per le etichette ai lati
        const m = stretto.matches ? { alto: 84, destra: 50, basso: 96, sinistra: 50 } : { alto: 84, destra: 70, basso: 84, sinistra: 70 };
        if (!scheda.hidden) { if (stretto.matches) m.basso = scheda.offsetHeight + 16; else m.destra = scheda.offsetWidth + 24; }
        return m;
    }
    function riquadro(elenco) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of elenco) { x0 = Math.min(x0, n.rx - n.r * 1.5); x1 = Math.max(x1, n.rx + n.r * 1.5); y0 = Math.min(y0, n.ry - n.r * 1.5); y1 = Math.max(y1, n.ry + n.r * 1.5); }
        return { x0, y0, x1, y1 };
    }
    /** Vista che inquadra un gruppo di nodi nello spazio libero (senza la scheda), con un ingrandimento minimo e massimo */
    function inquadra(elenco, { min = 0, max = Infinity } = {}) {
        const b = riquadro(elenco), m = margini();
        const lw = Math.max(80, W - m.sinistra - m.destra), lh = Math.max(80, H - m.alto - m.basso);
        const kk = Math.min(max, Math.max(min, Math.min(lw / (b.x1 - b.x0), lh / (b.y1 - b.y0))));
        return { k: kk, tx: m.sinistra + lw / 2 - kk * (b.x0 + b.x1) / 2, ty: m.alto + lh / 2 - kk * (b.y0 + b.y1) / 2 };
    }
    function vaiA(dest, animato = true) {
        dest.k = Math.min(k0 * 7, Math.max(k0 * 0.7, dest.k));
        if (!animato || riduci.matches) { volo = null; ({ k, tx, ty } = dest); disegna(); return; }
        volo = { da: { k, tx, ty }, a: dest, t0: performance.now(), durata: 520 };
        disegna();
    }
    const tutta = () => inquadra(nodi);
    function ricentra(animato = true) { mosso = false; k0 = tutta().k; vaiA(tutta(), animato); }
    function zoomSu(fattore, cx = W / 2, cy = H / 2, animato = false) {
        const kk = Math.min(k0 * 7, Math.max(k0 * 0.7, k * fattore));
        const dest = { k: kk, tx: cx - (cx - tx) * (kk / k), ty: cy - (cy - ty) * (kk / k) };
        mosso = true;
        if (animato) vaiA(dest); else { volo = null; ({ k, tx, ty } = dest); disegna(); }
    }
    const visibileASchermo = (n) => { const x = n.x * k + tx, y = n.y * k + ty, m = margini(); return x > m.sinistra && x < W - m.destra && y > m.alto - 30 && y < H - m.basso + 30; };

    function ridimensiona() {
        const r = cielo.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const eraW = W;
        W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
        tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
        const v = W / H < 0.85;
        if (v !== verticale) {
            verticale = v;
            for (const n of nodi) { n.rx = v ? n.my : n.mx; n.ry = v ? n.mx : n.my; n.x = n.rx; n.y = n.ry; n.vx = n.vy = 0; }
            mosso = false;
        }
        k0 = tutta().k;
        if (!mosso || !eraW) { ({ k, tx, ty } = scelto ? destinazione(scelto) : tutta()); volo = null; }
        disegna();
    }

    // ---------- disegno ----------
    function traccia(sezione, x, y, r) {
        ctx.beginPath();
        if (sezione === 'allenati') { const R = r * 1.3; ctx.moveTo(x, y - R); ctx.lineTo(x + R * 0.92, y + R * 0.62); ctx.lineTo(x - R * 0.92, y + R * 0.62); ctx.closePath(); }
        else if (sezione === 'journal') { const R = r * 1.22; ctx.moveTo(x, y - R); ctx.lineTo(x + R, y); ctx.lineTo(x, y + R); ctx.lineTo(x - R, y); ctx.closePath(); }
        else if (sezione === 'archivio') { const q = r * 0.9; ctx.rect(x - q, y - q, q * 2, q * 2); }
        else ctx.arc(x, y, r, 0, TAU);
    }
    function disegna() { if (!daDisegnare) { daDisegnare = true; requestAnimationFrame(fotogramma); } }

    function fotogramma(ora) {
        daDisegnare = false;
        if (html.dataset.vista !== 'costellazione' || !W) return;
        if (volo) {
            const t = Math.min(1, (ora - volo.t0) / volo.durata), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            k = volo.da.k + (volo.a.k - volo.da.k) * e; tx = volo.da.tx + (volo.a.tx - volo.da.tx) * e; ty = volo.da.ty + (volo.a.ty - volo.da.ty) * e;
            if (t >= 1) volo = null;
        }
        if (fisicaAttiva) passoFisica(ora);

        const vicino = k >= k0 * SOGLIA_FIGLIE;
        const sfumaFiglie = Math.min(1, Math.max(0, (k / k0 - 1.1) / (SOGLIA_FIGLIE - 1.1)));
        const evidenza = sopra || scelto;
        const attivo = (n) => !trovati || n.tipo === 'sezione' || trovati.has(n.id);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * tx, dpr * ty);
        ctx.lineCap = 'round';

        // legami: più attività in comune, linea più spessa
        for (const l of legami) {
            const tocca = evidenza && (l.a === evidenza || l.b === evidenza);
            let alfa = l.famiglia ? 0.42 : (colori.chiaro ? 0.2 : 0.13);
            if (l.famiglia && !vicino) alfa *= 0.35 + 0.65 * sfumaFiglie;
            if ((l.a.figlia || l.b.figlia) && !l.famiglia) alfa *= 0.25 + 0.75 * sfumaFiglie;
            if (trovati && !(attivo(l.a) && attivo(l.b))) alfa *= 0.2;
            if (evidenza) alfa = tocca ? 0.9 : alfa * 0.45;
            ctx.globalAlpha = alfa;
            ctx.strokeStyle = tocca ? colori[evidenza.sezione] : colori.testo;
            ctx.lineWidth = (l.famiglia ? 1.5 : 0.6 + 0.75 * Math.min(l.w, 6)) / k;
            ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.b.x, l.b.y); ctx.stroke();
        }

        // stelle e sezioni
        for (const n of nodi) {
            let alfa = n.figlia ? 0.3 + 0.7 * sfumaFiglie : 1;
            if (!attivo(n)) alfa *= 0.16;
            else if (evidenza && n !== evidenza && !evidenza.vicini.has(n.id) && n.tipo === 'stella') alfa *= 0.5;
            const c = colori[n.sezione];
            if (!colori.chiaro && alfa > 0.5) { ctx.globalAlpha = 0.12 * alfa; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 1.9, 0, TAU); ctx.fill(); }
            ctx.globalAlpha = alfa;
            ctx.fillStyle = c;
            traccia(n.sezione, n.x, n.y, n.r); ctx.fill();
            if (n.tipo === 'sezione') { ctx.fillStyle = colori.fondo; traccia(n.sezione, n.x, n.y, n.r * 0.38); ctx.fill(); }
            else if (n.n && (!n.figlia || sfumaFiglie > 0.5)) {
                // anello: quanto pesa ogni sezione tra le voci della parola
                const parti = Object.entries(n.quote).filter(([, q]) => q > 0);
                if (parti.length > 1) {
                    let a = -Math.PI / 2; const R = n.r * 1.42 + 2 / k, spazio = 0.09;
                    ctx.lineWidth = Math.max(2 / k, n.r * 0.13); ctx.lineCap = 'butt';
                    for (const [s, q] of parti) { const ampiezza = (q / n.n) * TAU; ctx.strokeStyle = colori[s]; ctx.beginPath(); ctx.arc(n.x, n.y, R, a + spazio / 2, a + ampiezza - spazio / 2); ctx.stroke(); a += ampiezza; }
                    ctx.lineCap = 'round';
                }
            }
            if (n === scelto) { ctx.globalAlpha = 1; ctx.strokeStyle = colori.testo; ctx.lineWidth = 2.5 / k; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 1.42 + 7 / k, 0, TAU); ctx.stroke(); }
        }
        ctx.globalAlpha = 1;

        sistemaNodi(vicino);
        if (volo || fisicaAttiva) disegna();
    }

    /** Posiziona i pulsanti sopra le stelle e sceglie quali etichette mostrare senza sovrapporle */
    function sistemaNodi(vicino) {
        const dischi = [], etichette = [];
        const tocca = (r, o) => !(r.x1 < o.x0 || r.x0 > o.x1 || r.y1 < o.y0 || r.y0 > o.y1);
        for (const n of nodi) {
            n.sx = n.x * k + tx; n.sy = n.y * k + ty;
            n.sd = Math.max(30, n.r * 2 * k * (n.tipo === 'stella' ? 1.25 : 1.1));
            n.el.style.transform = `translate(${n.sx.toFixed(1)}px, ${n.sy.toFixed(1)}px)`;
            n.el.style.setProperty('--d', `${n.sd.toFixed(1)}px`);
            n.nascosta = n.figlia && !vicino && n !== scelto;
            n.spenta = !!trovati && n.tipo === 'stella' && !trovati.has(n.id);
            n.el.classList.toggle('nascosta', n.nascosta);
            n.el.classList.toggle('spenta', n.spenta);
            n.el.classList.toggle('scelta', n === scelto);
            const rr = n.r * k * 1.1;
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
        return (trovati && trovati.has(n.id) ? 1e5 : 0) + (n.figlia ? 0 : 1e4) + n.n;
    }

    // ---------- elasticità: molle verso la posizione di riposo e tra nodi collegati ----------
    let preso = null;
    function passoFisica(ora) {
        const dt = Math.min(0.032, Math.max(0.001, (ora - ultimoPasso) / 1000)); ultimoPasso = ora;
        const passi = 2, h = dt / passi;
        for (let s = 0; s < passi; s++) {
            for (const n of nodi) { n.fx = -16 * (n.x - n.rx); n.fy = -16 * (n.y - n.ry); }
            for (const l of legami) {
                // la molla tende a mantenere la distanza di riposo tra i due nodi: se uno si sposta, l'altro lo segue
                const kk = l.famiglia ? 70 : 9 * Math.min(l.w, 4);
                const dx = (l.a.x - l.b.x) - (l.a.rx - l.b.rx), dy = (l.a.y - l.b.y) - (l.a.ry - l.b.ry);
                l.a.fx -= kk * dx; l.a.fy -= kk * dy; l.b.fx += kk * dx; l.b.fy += kk * dy;
            }
            for (const n of nodi) {
                if (n.tipo === 'sezione' || n === preso) { n.vx = n.vy = 0; continue; }
                n.vx = (n.vx + n.fx * h) * (1 - 4.2 * h); n.vy = (n.vy + n.fy * h) * (1 - 4.2 * h); // smorzamento basso: rimbalza
                n.x += n.vx * h; n.y += n.vy * h;
            }
        }
        if (!preso) {
            let energia = 0;
            for (const n of nodi) energia = Math.max(energia, Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(n.x - n.rx) + Math.abs(n.y - n.ry));
            if (energia < 0.6) { for (const n of nodi) { n.x = n.rx; n.y = n.ry; n.vx = n.vy = 0; } fisicaAttiva = false; }
        }
    }
    function avviaFisica() { if (!fisicaAttiva) { fisicaAttiva = true; ultimoPasso = performance.now(); } disegna(); }

    // ---------- puntatore: sposta la mappa, trascina una stella, ingrandisci con due dita o con la rotella ----------
    const puntatori = new Map();
    let gesto = null; // { tipo: 'forse' | 'mappa' | 'stella' | 'pizzico', … }
    let ignoraClic = false;
    const locale = (e) => { const r = cielo.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    cielo.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.scheda, .cielo-legenda, .cielo-comandi') || (e.pointerType === 'mouse' && e.button !== 0)) return;
        const p = locale(e);
        puntatori.set(e.pointerId, p);
        if (puntatori.size === 2) {
            const [a, b] = [...puntatori.values()];
            if (preso) { preso = null; }
            gesto = { tipo: 'pizzico', dist: Math.hypot(a.x - b.x, a.y - b.y), k, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
            volo = null; ignoraClic = true;
        } else if (puntatori.size === 1) {
            const el = e.target.closest('.nodo');
            gesto = { tipo: 'forse', x: p.x, y: p.y, nodo: el ? perId.get(el.dataset.nodo) : null, id: e.pointerId };
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
            const kk = Math.min(k0 * 7, Math.max(k0 * 0.7, gesto.k * dist / gesto.dist));
            tx = cx - (gesto.cx - tx) * (kk / k); ty = cy - (gesto.cy - ty) * (kk / k); k = kk;
            gesto.cx = cx; gesto.cy = cy; mosso = true; disegna();
            return;
        }
        if (gesto.tipo === 'forse') {
            if (Math.hypot(p.x - gesto.x, p.y - gesto.y) < 6) return;
            const elastica = gesto.nodo && gesto.nodo.tipo === 'stella' && !riduci.matches;
            gesto.tipo = elastica ? 'stella' : 'mappa';
            ignoraClic = true; volo = null;
            cielo.classList.add('trascina');
            try { cielo.setPointerCapture(e.pointerId); } catch (err) { /* puntatore già rilasciato */ }
            if (elastica) { preso = gesto.nodo; avviaFisica(); }
        }
        cielo.classList.add('usata');
        if (gesto.tipo === 'mappa') { tx += p.x - prima.x; ty += p.y - prima.y; mosso = true; disegna(); }
        else if (gesto.tipo === 'stella' && preso) { preso.x = (p.x - tx) / k; preso.y = (p.y - ty) / k; disegna(); }
    });
    const rilascia = (e) => {
        if (!puntatori.delete(e.pointerId)) return;
        if (puntatori.size === 0) {
            if (preso) { preso = null; avviaFisica(); }
            gesto = null; cielo.classList.remove('trascina');
            setTimeout(() => { ignoraClic = false; }, 0);
        } else if (gesto && gesto.tipo === 'pizzico') {
            const [p] = [...puntatori.values()];
            gesto = { tipo: 'mappa', x: p.x, y: p.y };
        }
    };
    cielo.addEventListener('pointerup', rilascia);
    cielo.addEventListener('pointercancel', rilascia);
    cielo.addEventListener('wheel', (e) => {
        if (e.target.closest('.scheda, .cielo-legenda')) return;
        e.preventDefault();
        const p = locale(e);
        zoomSu(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016)), p.x, p.y);
    }, { passive: false });

    cielo.addEventListener('click', (e) => {
        if (ignoraClic) { e.preventDefault(); e.stopPropagation(); return; }
        const comando = e.target.closest('[data-comando]');
        if (comando) {
            if (comando.dataset.comando === 'piu') zoomSu(1.5, W / 2, H / 2, true);
            else if (comando.dataset.comando === 'meno') zoomSu(1 / 1.5, W / 2, H / 2, true);
            else ricentra();
            return;
        }
        const el = e.target.closest('.nodo');
        if (el) { apri(perId.get(el.dataset.nodo), { da: el }); return; }
        if (e.target === tela || e.target === cielo || e.target.id === 'cielo-nodi') chiudi({ fuoco: false });
    }, true);

    cielo.addEventListener('pointerover', (e) => { const el = e.target.closest('.nodo'); const n = el ? perId.get(el.dataset.nodo) : null; if (n !== sopra && e.pointerType === 'mouse') { sopra = n; disegna(); } });
    cielo.addEventListener('pointerleave', () => { if (sopra) { sopra = null; disegna(); } });

    // ---------- tastiera ----------
    cielo.addEventListener('focusin', (e) => {
        const el = e.target.closest('.nodo');
        if (!el || gesto) return;
        const n = perId.get(el.dataset.nodo);
        // una figlia non ancora visibile, o un nodo fuori schermo, si porta in vista
        if (n.figlia && k < k0 * SOGLIA_FIGLIE) vaiA(destinazione(perId.get(n.voc.p)));
        else if (!visibileASchermo(n)) { const m = margini(); vaiA({ k, tx: (m.sinistra + W - m.destra) / 2 - n.x * k, ty: (m.alto + H - m.basso) / 2 - n.y * k }); }
        sopra = n; disegna();
    });
    cielo.addEventListener('focusout', () => { if (sopra) { sopra = null; disegna(); } });
    cielo.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !scheda.hidden) { e.preventDefault(); chiudi(); return; }
        if (e.target.closest('.scheda') || e.target.closest('summary')) return;
        const passo = 70;
        if (e.key === 'ArrowLeft') tx += passo; else if (e.key === 'ArrowRight') tx -= passo;
        else if (e.key === 'ArrowUp') ty += passo; else if (e.key === 'ArrowDown') ty -= passo;
        else if (e.key === '+' || e.key === '=') { zoomSu(1.3, W / 2, H / 2, true); e.preventDefault(); return; }
        else if (e.key === '-') { zoomSu(1 / 1.3, W / 2, H / 2, true); e.preventDefault(); return; }
        else if (e.key === '0') { ricentra(); e.preventDefault(); return; }
        else return;
        e.preventDefault(); mosso = true; volo = null; disegna();
    });

    // ---------- scheda ----------
    /** Dove volare quando si apre un nodo: un padre con le sue figlie, una sezione con le sue parole, una stella con un po' di contesto */
    function destinazione(n) {
        if (n.tipo === 'sezione') return inquadra([n, ...nodi.filter((s) => s.tipo === 'stella' && !s.figlia && s.sezione === n.sezione)], { max: k0 * 2.2 });
        const famiglia = nodi.filter((s) => s.voc && s.voc.p === n.id);
        if (famiglia.length) return inquadra([n, ...famiglia], { min: k0 * SOGLIA_FIGLIE * 1.06, max: k0 * 1.9 });
        if (n.figlia) return inquadra([n, perId.get(n.voc.p), ...nodi.filter((s) => s.voc && s.voc.p === n.voc.p)], { min: k0 * SOGLIA_FIGLIE * 1.06, max: k0 * 1.9 });
        const kk = Math.min(k0 * 2.2, Math.max(k, k0 * 1.25)), m = margini();
        return { k: kk, tx: (m.sinistra + W - m.destra) / 2 - n.rx * kk, ty: (m.alto + H - m.basso) / 2 - n.ry * kk };
    }

    const vociDi = (ids) => E.schede.filter((s) => [...s.parole].some((p) => ids.has(p))).map((s) => s.el);
    function rigaVoce(card) {
        const a = card.querySelector('.card-link');
        const esterno = a.target === '_blank';
        return `<li><a href="${esc(a.getAttribute('href'))}"${esterno ? ' target="_blank" rel="noopener"' : ''}><small>${esc(dati.tipi[card.dataset.tipo] || '')}${esterno ? ' · sito esterno' : ''}</small><span>${card.querySelector('.card-titolo').innerHTML}</span></a></li>`;
    }
    const pulsanteParola = (m) => `<button type="button" data-vai="${m.id}" data-sezione="${m.sezione}">${forma(m.sezione)}${esc(m.voc.n)}</button>`;

    function contenutoStella(n) {
        const v = n.voc;
        const ids = new Set([n.id, ...E.figlie(n.id)]);
        const cards = vociDi(ids);
        const gruppi = dati.sezioni.map((z) => {
            const mie = cards.filter((c) => c.dataset.sezione === z.id);
            return mie.length ? `<section data-sezione="${z.id}"><h3>${forma(z.id)}${esc(z.nome)} <span>${mie.length}</span></h3><ul class="scheda-voci">${mie.map(rigaVoce).join('')}</ul></section>` : '';
        }).join('');
        const famiglia = [v.p ? perId.get(v.p) : null, ...nodi.filter((s) => s.voc && s.voc.p === n.id)].filter(Boolean);
        const vicine = [...n.vicini].filter(([id]) => !famiglia.some((f) => f.id === id)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => perId.get(id));
        return `<div class="scheda-testa" data-sezione="${n.sezione}">
            <div><p class="scheda-occhiello">${forma(n.sezione)}Parola chiave · ${cards.length} ${cards.length === 1 ? 'voce' : 'voci'}</p><h2 id="scheda-titolo" tabindex="-1">${esc(v.n)}</h2></div>
            <button type="button" class="scheda-chiudi" data-chiudi aria-label="Chiudi la scheda"><svg class="icona" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="scheda-corpo">
            <p class="scheda-desc">${esc(v.d)}</p>
            ${v.a.length ? `<p class="scheda-alias">Detto anche: ${v.a.map(esc).join(', ')}.</p>` : ''}
            ${famiglia.length ? `<section><h3>${v.p ? 'Fa parte di' : 'Comprende'}</h3><div class="scheda-vicine">${[...(v.p ? [famiglia[0], ...nodi.filter((s) => s.voc && s.voc.p === v.p && s !== n)] : famiglia)].map(pulsanteParola).join('')}</div></section>` : ''}
            ${gruppi}
            ${vicine.length ? `<section><h3>Parole vicine</h3><div class="scheda-vicine">${vicine.map(pulsanteParola).join('')}</div></section>` : ''}
            <a class="scheda-azione" href="?vista=elenco&amp;parola=${n.id}" data-vista-elenco>Vedi nell'elenco</a>
        </div>`;
    }
    function contenutoSezione(n) {
        const z = n.dati;
        const stelle = nodi.filter((s) => s.tipo === 'stella' && s.quote[z.id] > 0).sort((a, b) => b.quote[z.id] - a.quote[z.id] || b.n - a.n).slice(0, 12);
        const vai = z.vai ? `<a class="scheda-azione principale" href="${esc(z.vai[0])}">${esc(z.vai[1])}</a>` : '';
        return `<div class="scheda-testa" data-sezione="${z.id}">
            <div><p class="scheda-occhiello">${forma(z.id)}Sezione · ${z.n} voci</p><h2 id="scheda-titolo" tabindex="-1">${esc(z.nome)}</h2></div>
            <button type="button" class="scheda-chiudi" data-chiudi aria-label="Chiudi la scheda"><svg class="icona" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="scheda-corpo" data-sezione="${z.id}">
            <p class="scheda-desc">${esc(z.frase)}</p>
            ${vai}
            <section><h3>Le parole più presenti</h3><div class="scheda-vicine">${stelle.map(pulsanteParola).join('')}</div></section>
            <a class="scheda-azione" href="?vista=elenco&amp;sezione=${z.id}" data-vista-elenco>Vedi tutte le ${z.n} voci nell'elenco</a>
        </div>`;
    }

    function apri(n, { da = null, fuoco = true, vola = true } = {}) {
        if (!n) return;
        if (scheda.hidden) tornaA = da || document.activeElement;
        scelto = n;
        scheda.innerHTML = n.tipo === 'sezione' ? contenutoSezione(n) : contenutoStella(n);
        scheda.hidden = false; scheda.scrollTop = 0;
        cielo.classList.add('con-scheda');
        // l'elenco resta allineato alla stella aperta: cambiando vista si ritrova lo stesso filtro
        E.stato.parola = n.tipo === 'stella' ? n.id : ''; E.stato.sezione = n.tipo === 'sezione' ? n.sezione : '';
        E.applica();
        cielo.classList.add('usata');
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
        if (vai) { apri(perId.get(vai.dataset.vai)); return; }
        const elenco = e.target.closest('[data-vista-elenco]');
        if (elenco && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); const n = scelto; imposta('elenco', true, { tieni: n }); }
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
            if (elenco.length === 1) apri(elenco[0]);
            else if (elenco.length) { mosso = true; vaiA(inquadra(elenco.flatMap((n) => (n.figlia ? [n, perId.get(n.voc.p)] : [n])), { min: k0, max: k0 * 3 })); }
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
        apri(n, { da: a });
    });

    // ---------- quale vista ----------
    function aggiornaInterruttore() {
        for (const a of document.querySelectorAll('.om-vista-voce')) {
            if (a.dataset.vista === html.dataset.vista) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        }
    }
    function imposta(vista, manuale, { tieni = null, avvio = false } = {}) {
        html.dataset.vista = vista;
        if (manuale) { try { localStorage.setItem(CHIAVE_VISTA, vista); } catch (e) { /* archivio del browser non disponibile */ } html.removeAttribute('data-vista-auto'); }
        document.getElementById('avviso-lento').hidden = !(vista === 'elenco' && html.dataset.vistaAuto === 'lento');
        aggiornaInterruttore();
        if (vista === 'costellazione') {
            const parola = E.stato.parola, sezione = E.stato.sezione;
            avvia();
            if (parola && perId.has(parola)) apri(perId.get(parola), { fuoco: false });
            else if (sezione) apri(perId.get(`sezione:${sezione}`), { fuoco: false });
            if (E.stato.q) evidenzia(E.stato.q);
        } else {
            // si passa all'elenco tenendo il filtro della stella aperta
            scheda.hidden = true; scheda.innerHTML = ''; scelto = null; cielo.classList.remove('con-scheda');
            if (tieni) { E.stato.parola = tieni.tipo === 'stella' ? tieni.id : ''; E.stato.sezione = tieni.tipo === 'sezione' ? tieni.sezione : ''; }
            if (!avvio) { E.applica(); window.scrollTo(0, 0); }
        }
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
        const giro = (ora) => {
            fotogrammi++;
            if (ora - inizio < 1000) { daDisegnare = false; fotogramma(ora); requestAnimationFrame(giro); return; }
            document.removeEventListener('visibilitychange', nascosta);
            if (valida && html.dataset.vistaAuto === 'si' && html.dataset.vista === 'costellazione' && fotogrammi < 20) {
                html.dataset.vistaAuto = 'lento';
                imposta('elenco', false);
            }
        };
        requestAnimationFrame(giro);
    }

    // ---------- partenza ----------
    window.omCielo = { nodi, vista: () => ({ k, tx, ty, k0, W, H, verticale }), apri: (id) => apri(perId.get(id)), chiudi, ricentra };
    // ?vista= nell'indirizzo (l'interruttore delle altre pagine) è una scelta fatta a mano: si ricorda
    imposta(html.dataset.vista === 'costellazione' ? 'costellazione' : 'elenco', new URLSearchParams(location.search).has('vista'), { avvio: true });
    if (html.dataset.vista === 'costellazione' && html.dataset.vistaAuto === 'si') provaFluidita();
}

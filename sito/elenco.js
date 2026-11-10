// Vista elenco della home: filtra le schede già presenti nella pagina (scritte da tools/genera.mjs).
// - sezione, parola chiave e ricerca si combinano; lo stato sta nell'indirizzo (?sezione= ?parola= ?q=), così si può condividere;
// - la ricerca accetta gli alias del vocabolario ("frazioni", "mcm") e mostra la forma canonica;
// - una parola "padre" (numeri) comprende le sue figlie (irrazionali, potenze…).
// Senza questo file la pagina mostra tutte le schede: resta leggibile.
(function () {
    'use strict';
    const griglia = document.getElementById('main-grid');
    const datiVoc = document.getElementById('om-vocabolario');
    if (!griglia || !datiVoc) return;

    const norma = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9φπ]+/g, ' ').trim();
    const radice = (s) => norma(s).split(' ').map((p) => (p.length >= 5 ? p.replace(/[aeiou]$/, '') : p)).join(' ');

    const vocabolario = JSON.parse(datiVoc.textContent);
    const parole = new Map(vocabolario.map((p) => [p.id, p]));
    const figlie = (id) => vocabolario.filter((p) => p.p === id).map((p) => p.id);

    const schede = [...griglia.querySelectorAll('.card')].map((el) => ({
        el,
        sezione: el.dataset.sezione,
        parole: new Set(el.dataset.parole.split(' ')),
        testo: norma(el.textContent),
    }));
    const sezioni = [...griglia.querySelectorAll('.sezione')];
    const cerca = document.getElementById('cerca');
    const esito = document.getElementById('esito');
    const suggerimento = document.getElementById('suggerimento');
    const azzera = document.getElementById('azzera');
    const vuoto = document.getElementById('vuoto');
    const raggruppa = document.getElementById('raggruppa');
    const filtriParole = document.getElementById('filtri-parole');
    const nomiSezione = Object.fromEntries([...document.querySelectorAll('.filtro[data-sezione]')].map((a) => [a.dataset.sezione, a.childNodes[1] ? a.childNodes[1].textContent.trim() : '']));

    // ---- stato, letto dall'indirizzo (?tag= è il vecchio parametro del catalogo: vale come ricerca) ----
    const qs = new URLSearchParams(location.search);
    const stato = {
        q: (qs.get('q') || qs.get('tag') || '').trim(),
        parola: parole.has(qs.get('parola')) ? qs.get('parola') : '',
        sezione: qs.get('sezione') in nomiSezione ? qs.get('sezione') : '',
    };

    /** Parole del vocabolario che corrispondono alla ricerca: per nome, etichetta o alias */
    function paroleTrovate(q) {
        const n = norma(q), r = radice(q);
        if (n.length < 2) return [];
        const trovate = [];
        for (const p of vocabolario) {
            const forme = [[p.n, false], [p.e, false], ...p.a.map((a) => [a, true])];
            let migliore = null;
            for (const [forma, alias] of forme) {
                const fn = norma(forma), fr = radice(forma);
                const uguale = fn === n || fr === r;
                const inizia = n.length >= 3 && (fn.startsWith(n) || fn.split(' ').some((w) => w.startsWith(n)));
                if (!uguale && !inizia) continue;
                const punti = (uguale ? 2 : 1) + (alias ? 0 : 0.5);
                if (!migliore || punti > migliore.punti) migliore = { punti, alias: alias && fn !== norma(p.n) ? forma : '' };
            }
            if (migliore) trovate.push({ p, ...migliore });
        }
        return trovate.sort((a, b) => b.punti - a.punti).slice(0, 4);
    }

    function applica({ scrivi = true } = {}) {
        const q = norma(stato.q);
        const pezzi = q ? q.split(' ') : [];
        const trovate = q ? paroleTrovate(stato.q) : [];
        const daRicerca = new Set(trovate.flatMap((t) => [t.p.id, ...figlie(t.p.id)]));
        const daFiltro = stato.parola ? new Set([stato.parola, ...figlie(stato.parola)]) : null;

        let visibili = 0;
        const perParola = new Map();
        for (const s of schede) {
            let ok = !stato.sezione || s.sezione === stato.sezione;
            if (ok && daFiltro) ok = [...s.parole].some((p) => daFiltro.has(p));
            if (ok && q) ok = pezzi.every((w) => s.testo.includes(w)) || [...s.parole].some((p) => daRicerca.has(p));
            s.el.hidden = !ok;
            if (ok) { visibili++; for (const p of s.parole) perParola.set(p, (perParola.get(p) || 0) + 1); }
        }
        for (const sez of sezioni) sez.hidden = !sez.querySelector('.card:not([hidden])');
        vuoto.hidden = visibili > 0;

        // filtri: stato attivo, e parole senza risultati attenuate
        for (const a of document.querySelectorAll('.filtro[data-sezione]')) {
            if (a.dataset.sezione === stato.sezione) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        }
        for (const a of document.querySelectorAll('.filtri-parole .parola')) {
            const id = a.dataset.parola;
            if (id === stato.parola) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            const n = (perParola.get(id) || 0) + figlie(id).reduce((t, f) => t + (perParola.get(f) || 0), 0);
            a.classList.toggle('spenta', n === 0 && id !== stato.parola);
        }

        // su telefono la parola scelta si porta in vista nella riga che scorre
        const attiva = filtriParole.querySelector('.parola[aria-current="true"]');
        const riga = filtriParole.querySelector('ul');
        if (attiva && riga.scrollWidth > riga.clientWidth) riga.scrollLeft += attiva.getBoundingClientRect().left - riga.getBoundingClientRect().left - 16;

        // riga di stato
        const attivi = [];
        if (stato.sezione) attivi.push(nomiSezione[stato.sezione]);
        if (stato.parola) attivi.push(`«${parole.get(stato.parola).n}»`);
        if (stato.q) attivi.push(`ricerca «${stato.q}»`);
        const voci = visibili === 1 ? '1 voce' : `${visibili} voci`;
        esito.textContent = attivi.length ? `${voci} su ${schede.length} · ${attivi.join(' · ')}` : `${schede.length} voci`;
        azzera.hidden = attivi.length === 0;

        // la ricerca ha trovato parole del vocabolario: si propone la forma canonica
        suggerimento.replaceChildren();
        const proposte = trovate.filter((t) => t.p.id !== stato.parola);
        suggerimento.hidden = proposte.length === 0;
        if (proposte.length) {
            suggerimento.append(proposte.length === 1 ? 'Parola chiave:' : 'Parole chiave:');
            for (const t of proposte) {
                const a = document.createElement('a');
                a.className = 'parola';
                a.href = `?parola=${t.p.id}`;
                a.dataset.parola = t.p.id;
                a.dataset.daRicerca = '1';
                a.textContent = t.p.n;
                suggerimento.append(a);
                if (t.alias) suggerimento.append(`(detto anche «${t.alias}»)`);
            }
        }

        if (scrivi) {
            const p = new URLSearchParams();
            if (stato.sezione) p.set('sezione', stato.sezione);
            if (stato.parola) p.set('parola', stato.parola);
            if (stato.q) p.set('q', stato.q);
            const s = p.toString();
            history.replaceState(null, '', location.pathname + (s ? `?${s}` : '') + location.hash);
        }
    }

    // ---- eventi ----
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-parola], a.filtro[data-sezione], #azzera, .vuoto a');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        if (a.dataset.parola !== undefined) {
            stato.parola = stato.parola === a.dataset.parola ? '' : a.dataset.parola;
            if (a.dataset.daRicerca) { stato.q = ''; if (cerca) cerca.value = ''; } // dalla ricerca alla parola canonica
        } else if (a.dataset.sezione !== undefined) {
            stato.sezione = a.dataset.sezione;
        } else {
            stato.q = ''; stato.parola = ''; stato.sezione = '';
            if (cerca) cerca.value = '';
        }
        applica();
        // dalla scheda si torna ai filtri, così si vede cosa è cambiato
        if (a.closest('.card')) document.getElementById('filtri').scrollIntoView({ block: 'start' });
    });

    if (cerca) {
        cerca.value = stato.q;
        let attesa = 0;
        cerca.addEventListener('input', () => {
            clearTimeout(attesa);
            attesa = setTimeout(() => { stato.q = cerca.value.trim(); applica(); }, 140);
        });
        cerca.form.addEventListener('submit', (e) => {
            e.preventDefault();
            clearTimeout(attesa);
            stato.q = cerca.value.trim();
            applica();
            cerca.blur(); // su telefono chiude la tastiera e mostra i risultati
            document.getElementById('filtri').scrollIntoView({ block: 'start' });
        });
    }

    // ---- raggruppa per sezione (si ricorda nel browser) ----
    const CHIAVE = 'orfini_elenco_gruppi';
    let gruppi = true;
    try { gruppi = localStorage.getItem(CHIAVE) !== 'no'; } catch (e) { /* archivio del browser non disponibile */ }
    const mostraGruppi = () => {
        griglia.classList.toggle('raggruppato', gruppi);
        raggruppa.setAttribute('aria-pressed', String(gruppi));
    };
    raggruppa.addEventListener('click', () => {
        gruppi = !gruppi;
        try { localStorage.setItem(CHIAVE, gruppi ? 'si' : 'no'); } catch (e) { /* come sopra */ }
        mostraGruppi();
    });
    mostraGruppi();

    // ---- su telefono le parole stanno su una riga che scorre; il pulsante le apre tutte ----
    const tutte = document.getElementById('tutte-le-parole');
    tutte.addEventListener('click', () => {
        const aperto = filtriParole.classList.toggle('aperto');
        tutte.setAttribute('aria-expanded', String(aperto));
        tutte.textContent = aperto ? 'Meno parole' : `Tutte le ${vocabolario.length} parole`;
    });

    // senza filtri nell'indirizzo la pagina è già nello stato giusto: niente lavoro all'avvio
    if (stato.q || stato.parola || stato.sezione) applica({ scrivi: false });

})();

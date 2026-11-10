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
        // il testo per la ricerca si prepara alla prima ricerca, non all'apertura della pagina
        get testo() { const t = norma(el.textContent); Object.defineProperty(this, 'testo', { value: t }); return t; },
    }));
    const sezioni = [...griglia.querySelectorAll('.sezione')];
    const cerca = document.getElementById('cerca');
    const esito = document.getElementById('esito');
    const suggerimento = document.getElementById('suggerimento');
    const azzera = document.getElementById('azzera');
    const vuoto = document.getElementById('vuoto');
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
        const pezzi = q ? radice(stato.q).split(' ') : [];
        const trovate = q ? paroleTrovate(stato.q) : [];
        const daRicerca = new Set(trovate.flatMap((t) => [t.p.id, ...figlie(t.p.id)]));
        const daFiltro = stato.parola ? new Set([stato.parola, ...figlie(stato.parola)]) : null;

        let visibili = 0;
        const perParola = new Map();
        const perSezione = { '': 0, attivita: 0, allenati: 0, journal: 0, archivio: 0 };
        for (const s of schede) {
            const okParola = !daFiltro || [...s.parole].some((p) => daFiltro.has(p));
            const okRicerca = !q || pezzi.every((w) => s.testo.includes(w)) || [...s.parole].some((p) => daRicerca.has(p));
            const okTema = okParola && okRicerca;
            if (okTema) {
                perSezione['']++;
                perSezione[s.sezione] = (perSezione[s.sezione] || 0) + 1;
            }
            const ok = (!stato.sezione || s.sezione === stato.sezione) && okTema;
            s.el.hidden = !ok;
            if (ok) { visibili++; for (const p of s.parole) perParola.set(p, (perParola.get(p) || 0) + 1); }
        }
        for (const sez of sezioni) {
            const cont = sez.querySelector('.sezione-n');
            if (cont) cont.textContent = String(perSezione[sez.dataset.sezione] ?? 0);
            sez.hidden = !sez.querySelector('.card:not([hidden])');
        }
        griglia.classList.toggle('filtrata', !!(stato.q || stato.parola || stato.sezione));
        vuoto.hidden = visibili > 0;

        // filtri: stato attivo, conteggi aggiornati e parole senza risultati attenuate
        for (const a of document.querySelectorAll('.filtro[data-sezione], .tessera-sezione')) {
            if (a.dataset.sezione === stato.sezione) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            const numEl = a.querySelector('.tessera-n, span:not(.tessera-testa):not(.tessera-desc)');
            if (numEl) numEl.textContent = String(perSezione[a.dataset.sezione] ?? 0);
        }
        // le figlie compaiono solo dentro il padre scelto (o quando è scelta una di loro)
        const padreAttivo = stato.parola ? (parole.get(stato.parola).p || stato.parola) : '';
        for (const b of document.querySelectorAll('.figlie')) b.hidden = b.dataset.padre !== padreAttivo;
        for (const a of document.querySelectorAll('.filtri-parole .parola')) {
            const id = a.dataset.parola;
            if (a.classList.contains('padre')) a.classList.toggle('in-famiglia', id === padreAttivo && id !== stato.parola);
            if (id === stato.parola) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            const n = (perParola.get(id) || 0) + figlie(id).reduce((t, f) => t + (perParola.get(f) || 0), 0);
            a.classList.toggle('spenta', n === 0 && id !== stato.parola);
        }

        // su telefono la parola scelta si porta in vista nella riga che scorre
        const attiva = filtriParole.querySelector('.radici .parola[aria-current="true"], .radici .in-famiglia');
        const riga = filtriParole.querySelector('.radici');
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
        const a = e.target.closest('a[data-parola], a.filtro[data-sezione], a.tessera-sezione, #azzera, .vuoto a');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        if (a.dataset.parola !== undefined) {
            stato.parola = stato.parola === a.dataset.parola ? '' : a.dataset.parola;
            if (a.dataset.daRicerca) { stato.q = ''; if (cerca) cerca.value = ''; } // dalla ricerca alla parola canonica
        } else if (a.dataset.sezione !== undefined) {
            stato.sezione = (a.classList.contains('tessera-sezione') && stato.sezione === a.dataset.sezione) ? '' : a.dataset.sezione;
        } else {
            stato.q = ''; stato.parola = ''; stato.sezione = '';
            if (cerca) cerca.value = '';
        }
        applica();
        // dalla scheda si torna ai filtri, così si vede cosa è cambiato
        if (a.closest('.card') || window.scrollY > document.getElementById('filtri').offsetTop) document.getElementById('filtri').scrollIntoView({ block: 'start' });
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
            if (document.documentElement.dataset.vista !== 'costellazione') {
                document.getElementById('filtri').scrollIntoView({ block: 'start' });
            }
        });
    }

    // ---- ogni sezione mostra un'anteprima; "Mostra tutte" la apre. Con un filtro attivo si vede tutto ciò che corrisponde ----
    griglia.addEventListener('click', (e) => {
        const b = e.target.closest('.mostra-tutte');
        if (!b) return;
        const sez = b.closest('.sezione'), aperta = sez.classList.toggle('aperta');
        b.setAttribute('aria-expanded', String(aperta));
        b.textContent = aperta ? 'Mostra meno' : `Mostra tutte le ${sez.querySelectorAll('.card').length}`;
        if (!aperta) sez.scrollIntoView({ block: 'start' });
    });

    // ---- su telefono le parole stanno su una riga che scorre; il pulsante le apre tutte ----
    const tutte = document.getElementById('tutte-le-parole');
    tutte.addEventListener('click', () => {
        const aperto = filtriParole.classList.toggle('aperto');
        tutte.setAttribute('aria-expanded', String(aperto));
        tutte.textContent = aperto ? 'Meno parole' : `Tutte le ${vocabolario.filter((p) => !p.p).length} parole`;
    });

    // ---- aprendo un'attività la scheda si allarga fino a riempire lo schermo, poi si apre la pagina ----
    const fermo = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.effetti === 'ridotti';
    griglia.addEventListener('click', (e) => {
        const a = e.target.closest('.card-link');
        if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button || fermo() || !a.animate) return;
        e.preventDefault();
        const r = a.closest('.card').getBoundingClientRect();
        const velo = document.createElement('div');
        velo.className = 'espansione';
        velo.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
        document.body.append(velo);
        const sx = window.innerWidth / r.width, sy = window.innerHeight / r.height;
        const dx = window.innerWidth / 2 - (r.left + r.width / 2), dy = window.innerHeight / 2 - (r.top + r.height / 2);
        const vai = () => { location.href = a.href; };
        velo.animate([{ transform: 'none', opacity: 0.4 }, { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 1 }], { duration: 300, easing: 'cubic-bezier(0.3, 0, 0.1, 1)', fill: 'forwards' }).finished.then(vai, vai);
    });
    // tornando indietro la pagina riappare dalla memoria del browser: il velo non deve restare
    window.addEventListener('pageshow', () => { for (const v of document.querySelectorAll('.espansione')) v.remove(); });

    // la costellazione (sito/costellazione.js) usa la stessa ricerca e gli stessi dati
    window.omElenco = { norma, radice, vocabolario, parole, figlie, schede, stato, paroleTrovate, applica };

    // senza filtri nell'indirizzo la pagina è già nello stato giusto: niente lavoro all'avvio
    if (stato.q || stato.parola || stato.sezione) applica({ scrivi: false });

})();

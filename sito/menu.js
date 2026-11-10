// Barra del menu di Orfini Math Lab: si nasconde scorrendo in giù e riappare scorrendo in su,
// su telefono si apre dal pulsante Menu, "Altro" e "Chi sono" si chiudono con Esc o con un clic fuori.
// Senza questo file il menu resta usabile: i link sono normali link, "Altro" è un <details>,
// "Chi sono" si apre con l'ancora #chi-sono.
(function () {
    'use strict';
    const barra = document.getElementById('barra');
    if (!barra) return;
    const voci = barra.querySelector('.om-voci');
    const altro = barra.querySelector('.om-altro');
    const apriMenu = barra.querySelector('.om-apri-menu');
    const stretto = window.matchMedia('(max-width: 859px)');

    // ---- menu su telefono ----
    function menu(aperto) {
        barra.classList.toggle('om-menu-aperto', aperto);
        apriMenu.setAttribute('aria-expanded', String(aperto));
        apriMenu.setAttribute('aria-label', aperto ? 'Chiudi il menu' : 'Menu');
        if (stretto.matches) altro.open = aperto; // su telefono le voci di "Altro" sono già in elenco
    }
    apriMenu.addEventListener('click', () => menu(!barra.classList.contains('om-menu-aperto')));
    stretto.addEventListener('change', () => { menu(false); altro.open = false; });

    document.addEventListener('click', (e) => {
        if (altro.open && !stretto.matches && !altro.contains(e.target)) altro.open = false;
        if (barra.classList.contains('om-menu-aperto') && !barra.contains(e.target)) menu(false);
    });
    voci.addEventListener('click', (e) => { if (e.target.closest('a')) { menu(false); if (!stretto.matches) altro.open = false; } });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (barra.classList.contains('om-menu-aperto')) { menu(false); apriMenu.focus(); }
        else if (altro.open && !stretto.matches) { altro.open = false; altro.querySelector('summary').focus(); }
    });

    // ---- la barra si nasconde scorrendo in giù ----
    let ultimo = window.scrollY, inAttesa = false;
    function scorri() {
        inAttesa = false;
        const y = window.scrollY;
        const fermo = barra.classList.contains('om-menu-aperto') || barra.contains(document.activeElement);
        if (y < 80 || fermo || y < ultimo - 6) barra.classList.remove('om-nascosta');
        else if (y > ultimo + 6) { barra.classList.add('om-nascosta'); altro.open = false; }
        if (Math.abs(y - ultimo) > 6) ultimo = y;
    }
    window.addEventListener('scroll', () => { if (!inAttesa) { inAttesa = true; requestAnimationFrame(scorri); } }, { passive: true });
    barra.addEventListener('focusin', () => barra.classList.remove('om-nascosta'));

    // ---- pannello "Chi sono" ----
    const pannello = document.getElementById('chi-sono');
    if (pannello && typeof pannello.showModal === 'function') {
        let tornaA = null;
        const apri = (da) => {
            if (pannello.open) return;
            tornaA = da || document.activeElement;
            menu(false);
            altro.open = false;
            pannello.showModal();
        };
        const chiudi = () => { if (pannello.open) pannello.close(); };
        document.addEventListener('click', (e) => {
            const a = e.target.closest('[data-apre="chi-sono"]');
            if (a) { e.preventDefault(); apri(a); }
        });
        pannello.addEventListener('click', (e) => {
            if (e.target === pannello || e.target.closest('[data-chiude]')) { e.preventDefault(); chiudi(); }
        });
        pannello.addEventListener('close', () => {
            if (/^#(chi-sono|about)$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
            if (tornaA && tornaA.focus) tornaA.focus();
        });
        // #chi-sono nell'indirizzo, e il vecchio #about della home
        if (/^#(chi-sono|about)$/.test(location.hash)) apri(null);
        window.addEventListener('hashchange', () => { if (/^#(chi-sono|about)$/.test(location.hash)) apri(null); });
    }
})();

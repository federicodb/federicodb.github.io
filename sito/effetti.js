// "Riduci effetti" (voce del menu, sotto Altro): la scelta si ricorda nel browser e vale per tutto il sito.
// Questo file è piccolo e si carica prima che la pagina si disegni, così nessuna animazione parte per sbaglio.
(function () {
    try {
        if (localStorage.getItem('orfini_effetti') !== 'ridotti') return;
        document.documentElement.setAttribute('data-effetti', 'ridotti');
        // niente transizione tra una pagina e l'altra
        var s = document.createElement('style');
        s.textContent = '@view-transition { navigation: none; }';
        document.head.appendChild(s);
    } catch (e) { /* archivio del browser non disponibile: restano le impostazioni del sistema */ }
})();

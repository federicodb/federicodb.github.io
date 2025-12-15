/* 
   ORFINI SHARED JS
   Gestisce la sincronizzazione del tema e la navigazione di ritorno.
*/

(function() {
    // 1. Sincronizzazione Tema
    function syncTheme() {
        // Cerca prima nell'URL (es. ?theme=dark), poi nel localStorage
        const params = new URLSearchParams(window.location.search);
        let theme = params.get('theme') || localStorage.getItem('theme') || 'dark'; // Default Dark
        
        document.documentElement.setAttribute('data-theme', theme);
        
        // Se l'app usa Tailwind con classe 'dark', aggiungiamola
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // 2. Iniezione Bottone Back (se non siamo in un iframe o se richiesto)
    function injectBackButton() {
        if (document.querySelector('.orfini-back-btn')) return; // Esiste già

        // Se siamo dentro un iframe (es. modale), forse non serve il bottone back
        // Ma per ora lo mettiamo sempre per sicurezza nei test standalone
        
        const btn = document.createElement('a');
        btn.className = 'orfini-back-btn';
        btn.href = '../../index.html'; // Percorso relativo standard da content/apps/
        btn.innerHTML = '<span>←</span> Home';
        btn.setAttribute('aria-label', 'Torna alla Dashboard');
        
        document.body.appendChild(btn);
    }

    // Init
    window.addEventListener('DOMContentLoaded', () => {
        syncTheme();
        // injectBackButton(); // Disabilitato su richiesta: usare tasto back del browser
    });

    // Ascolta cambiamenti storage (se utente cambia tema in un'altra tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') syncTheme();
    });

})();

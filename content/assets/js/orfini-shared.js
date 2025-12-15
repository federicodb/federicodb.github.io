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
        
        const btn = document.createElement('a');
        btn.className = 'orfini-back-btn';
        btn.href = '../../index.html'; // Percorso relativo standard da content/apps/
        btn.innerHTML = '<span>←</span> Home';
        btn.setAttribute('aria-label', 'Torna alla Dashboard');
        
        document.body.appendChild(btn);
    }

    // 3. Iniezione Toggle Tema
    function injectThemeToggle() {
        if (document.getElementById('orfini-theme-toggle')) return;

        const btn = document.createElement('button');
        btn.id = 'orfini-theme-toggle';
        btn.setAttribute('aria-label', 'Cambia Tema');
        
        // Stile inline per garantire isolamento e priorità (o spostare in CSS condiviso)
        Object.assign(btn.style, {
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: '10000',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid var(--md-sys-color-outline)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-background)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s, background-color 0.2s'
        });

        // Icona iniziale
        const currentTheme = document.documentElement.getAttribute('data-theme');
        btn.innerText = currentTheme === 'dark' ? '☀️' : '🌙';

        btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseout = () => btn.style.transform = 'scale(1.0)';

        btn.onclick = () => {
            const root = document.documentElement;
            const oldTheme = root.getAttribute('data-theme');
            const newTheme = oldTheme === 'dark' ? 'light' : 'dark';
            
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            btn.innerText = newTheme === 'dark' ? '☀️' : '🌙';

            // Tailwind support
            if (newTheme === 'dark') root.classList.add('dark');
            else root.classList.remove('dark');

            // Dispatch Event per app grafiche (Canvas/Three.js) che devono ridisegnarsi
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        };

        document.body.appendChild(btn);
    }

    // Init
    window.addEventListener('DOMContentLoaded', () => {
        syncTheme();
        // injectBackButton(); // Disabilitato su richiesta
        injectThemeToggle();
    });

    // Ascolta cambiamenti storage (se utente cambia tema in un'altra tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') syncTheme();
    });

})();

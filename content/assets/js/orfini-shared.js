/* 
   ORFINI SHARED JS
   Gestisce la sincronizzazione del tema (Dark Mode Only) e la navigazione di ritorno.
*/

(function() {
    // 1. Enforce Dark Mode (Policy: Always Dark)
    function enforceDarkTheme() {
        const root = document.documentElement;
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark'); // Tailwind support
        localStorage.setItem('ce_theme', 'dark'); // Force consistency
    }

    // 2. Iniezione Bottone Back (Material Design FAB - Top Right)
    function injectBackButton() {
        if (document.querySelector('.orfini-back-btn')) return; 
        
        const btn = document.createElement('a');
        btn.className = 'orfini-back-btn';
        
        // Calcolo robusto del percorso verso la root
        const pathParts = window.location.pathname.split('/');
        // In un sito tipo federicodb.github.io/sito/apps/app.html
        // Cerchiamo di tornare a index.html nella root del progetto.
        // Se siamo in content/apps/app.html (3 livelli dal root), servono ../../index.html
        // Se siamo in content/verifiche/4EL/app.html (4 livelli), servono ../../../index.html
        const depth = window.location.pathname.split('/').filter(p => p).length - 1;
        // Metodo più semplice: prova a tornare indietro finché non trovi la root o usa path relativo fisso se la struttura è nota
        // Ma qui il modo più sicuro è contare le cartelle dopo la root. 
        // Assumiamo che la root sia dove si trova index.html.
        btn.href = '../../index.html'; // Default per content/apps/
        
        // Verifica se siamo più profondi
        if (window.location.pathname.includes('/verifiche/')) {
            btn.href = '../../../index.html';
        }
        // SVG Icon for crisp rendering
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
        btn.setAttribute('aria-label', 'Torna alla Dashboard');
        btn.setAttribute('title', 'Torna alla Dashboard');
        
        // Stile Material FAB
        Object.assign(btn.style, {
            position: 'fixed',
            top: '20px',
            left: '20px', /* Spostato a sinistra per massima usabilità */
            zIndex: '2147483647',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 25, 35, 0.8)', // Semitrasparente scuro
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.12)', /* MD3 FAB Elevation */
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.28s',
            textDecoration: 'none',
            outline: 'none', // Focus gestito via box-shadow
            pointerEvents: 'auto'
        });

        // Hover & Focus
        btn.onmouseover = () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.backgroundColor = 'var(--md-sys-color-primary, #0061a4)'; 
            btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.15)';
            btn.style.borderColor = 'transparent';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'translateY(0)';
            btn.style.backgroundColor = 'rgba(20, 25, 35, 0.8)';
            btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.12)';
            btn.style.borderColor = 'rgba(255,255,255,0.1)';
        };
        
        // Active/Click Ripple Sim
        btn.onmousedown = () => { btn.style.transform = 'scale(0.95)'; };
        btn.onmouseup = () => { btn.style.transform = 'translateY(-2px)'; };

        // Focus Accessibility
        btn.addEventListener('focus', () => {
            btn.style.boxShadow = '0 0 0 3px rgba(0, 188, 212, 0.5), 0 4px 6px rgba(0,0,0,0.3)';
        });
        btn.addEventListener('blur', () => {
            btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.12)';
        });

        document.body.appendChild(btn);
    }

    // 3. Iniezione Bottone Toggle UI (per dare risalto alla grafica)
    function injectControlToggle() {
        const uiElements = ['#ui-layer', '#controls-area', '.panel'];
        const existingToggles = ['.ui-toggle-btn', '.toggle-ui', '#btn-toggle-ui', '.settings-toggle'];
        
        let target = null;
        for (const selector of uiElements) {
            target = document.querySelector(selector);
            if (target) break;
        }

        if (!target) return;
        
        // Verifica se esiste già un pulsante di toggle nell'app
        for (const sel of existingToggles) {
            if (document.querySelector(sel)) return;
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'ui-toggle-btn';
        toggleBtn.title = 'Mostra/Nascondi Controlli';
        
        // Stile base per il pulsante occhio (FAB)
        Object.assign(toggleBtn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '2147483647',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 25, 35, 0.85)',
            backdropFilter: 'blur(10px)',
            color: '#00ffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'auto',
            padding: '0'
        });

        const updateIcon = (isCollapsed) => {
            toggleBtn.innerHTML = !isCollapsed 
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>` // Eye slashed
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`; // Eye
        };

        let collapsed = false; /* Espanso di default per permettere l'input immediato */
        updateIcon(collapsed);
        
        // Lo stato iniziale è ora gestito dal CSS della pagina o rimosso per default
        // target.classList.add('collapsed'); // Rimosso l'auto-collapse

        toggleBtn.onclick = () => {
            collapsed = !collapsed;
            target.classList.toggle('collapsed', collapsed);
            updateIcon(collapsed);
            
            // Animazione feedback
            toggleBtn.style.transform = 'scale(0.9)';
            setTimeout(() => toggleBtn.style.transform = 'scale(1)', 100);
        };

        toggleBtn.onmouseover = () => {
            toggleBtn.style.backgroundColor = 'rgba(0, 255, 255, 0.15)';
            toggleBtn.style.borderColor = '#00ffff';
            toggleBtn.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3)';
        };
        toggleBtn.onmouseout = () => {
            toggleBtn.style.backgroundColor = 'rgba(20, 25, 35, 0.85)';
            toggleBtn.style.borderColor = 'rgba(255,255,255,0.1)';
            toggleBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
        };

        document.body.appendChild(toggleBtn);
    }

    // Init
    window.addEventListener('DOMContentLoaded', () => {
        enforceDarkTheme();
        injectBackButton(); 
        injectControlToggle();
    });

})();

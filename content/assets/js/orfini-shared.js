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
        btn.href = '../../index.html'; 
        // SVG Icon for crisp rendering
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
        btn.setAttribute('aria-label', 'Torna alla Dashboard');
        btn.setAttribute('title', 'Torna alla Dashboard');
        
        // Stile Material FAB
        Object.assign(btn.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '2147483647',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 25, 35, 0.6)', // Semitrasparente scuro
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            textDecoration: 'none',
            outline: 'none', // Focus gestito via box-shadow
            pointerEvents: 'auto'
        });

        // Hover & Focus
        btn.onmouseover = () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.backgroundColor = 'rgba(0, 188, 212, 0.8)'; // Primary color on hover
            btn.style.boxShadow = '0 6px 16px rgba(0, 188, 212, 0.4)';
            btn.style.borderColor = 'rgba(0, 188, 212, 0.5)';
        };
        btn.onmouseout = () => {
            btn.style.transform = 'scale(1)';
            btn.style.backgroundColor = 'rgba(20, 25, 35, 0.6)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            btn.style.borderColor = 'rgba(255,255,255,0.1)';
        };
        
        // Active/Click Ripple Sim
        btn.onmousedown = () => { btn.style.transform = 'scale(0.95)'; };
        btn.onmouseup = () => { btn.style.transform = 'scale(1.1)'; };

        // Focus Accessibility
        btn.addEventListener('focus', () => {
            btn.style.boxShadow = '0 0 0 3px rgba(0, 188, 212, 0.5), 0 4px 12px rgba(0,0,0,0.3)';
        });
        btn.addEventListener('blur', () => {
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        document.body.appendChild(btn);
    }

    // Init
    window.addEventListener('DOMContentLoaded', () => {
        enforceDarkTheme();
        injectBackButton(); 
        // Theme Toggle Removed: Dark mode is now mandatory.
    });

})();

/* ==========================================================================
   ORFINI MATH LAB - TEMA TOGGLE (JS)
   Gestisce la commutazione chiaro/scuro e la persistenza in localStorage.
   ========================================================================== */

(function () {
    'use strict';
    const STORAGE_KEY = 'orfini_theme';

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        return 'dark'; // Default garantito: DARK
    }

    function syncColorSchemeMeta(theme) {
        let metaCS = document.querySelector('meta[name="color-scheme"]');
        if (!metaCS && document.head) {
            metaCS = document.createElement('meta');
            metaCS.name = 'color-scheme';
            document.head.appendChild(metaCS);
        }
        if (metaCS) metaCS.setAttribute('content', theme === 'light' ? 'light' : 'dark');
    }

    function applyTheme(theme, persist = true) {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('theme-light');
            root.setAttribute('data-theme', 'light');
        } else {
            root.classList.remove('theme-light');
            root.setAttribute('data-theme', 'dark');
        }
        syncColorSchemeMeta(theme);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#ffffff' : '#050507');
        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* storage bloccato */ }
        }
    }

    function initToggle() {
        const toggleBtn = document.getElementById('orfini-theme-toggle');
        if (!toggleBtn) return;

        // Assicurati che lo stato iniziale sia applicato
        const currentTheme = getPreferredTheme();
        applyTheme(currentTheme, false);

        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const isCurrentlyLight = document.documentElement.classList.contains('theme-light');
            const newTheme = isCurrentlyLight ? 'dark' : 'light';
            applyTheme(newTheme, true);
        });

        window.addEventListener('storage', function (e) {
            if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
                applyTheme(e.newValue, false);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggle);
    } else {
        initToggle();
    }
})();

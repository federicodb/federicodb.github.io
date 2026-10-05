/* ==========================================================================
   ORFINI MATH LAB - TEMA TOGGLE (JS)
   Gestisce la commutazione chiaro/scuro e la persistenza in localStorage.
   ========================================================================== */

(function() {
    'use strict';
    const STORAGE_KEY = 'orfini_theme';

    function getPreferredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        return 'dark'; // Default garantito: DARK
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('theme-light');
            root.setAttribute('data-theme', 'light');
        } else {
            root.classList.remove('theme-light');
            root.setAttribute('data-theme', 'dark');
        }
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function initToggle() {
        const toggleBtn = document.getElementById('orfini-theme-toggle');
        if (!toggleBtn) return;

        // Assicurati che lo stato iniziale sia applicato
        const currentTheme = getPreferredTheme();
        applyTheme(currentTheme);

        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isCurrentlyLight = document.documentElement.classList.contains('theme-light');
            const newTheme = isCurrentlyLight ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggle);
    } else {
        initToggle();
    }
})();

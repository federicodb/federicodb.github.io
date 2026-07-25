/**
 * Laboratorio Matematico Orfini Foligno - GDPR Cookie Consent Manager
 * Client-Side Vanilla JS, conforme al GDPR UE 2016/679 ed alle Linee Guida del Garante Italiano.
 * Nessuna dipendenza CDN esterna.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'orfini_cookie_consent';

    const DEFAULT_CONSENT = {
        necessary: true,   // Cookie tecnici essenziali (sempre attivi)
        analytics: false,  // Statistiche ed analitici
        functional: false, // Widget ed embed interattivi
        timestamp: null
    };

    let currentConsent = getSavedConsent();

    function getSavedConsent() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Impossibile accedere a localStorage per il consenso cookie:', e);
        }
        return null;
    }

    function saveConsent(consentObj) {
        consentObj.necessary = true; // Forzato sempre true
        consentObj.timestamp = new Date().toISOString();
        currentConsent = consentObj;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(consentObj));
        } catch (e) {
            console.warn('Impossibile salvare il consenso cookie in localStorage:', e);
        }
        applyConsents();
        hideBanner();
        hideModal();
    }

    function applyConsents() {
        if (!currentConsent) return;

        // Se il consenso analitico o funzionale è fornito, sblocchiamo gli script condizionali
        const conditionalScripts = document.querySelectorAll('script[type="text/plain"][data-consent-category]');
        conditionalScripts.forEach(script => {
            const category = script.getAttribute('data-consent-category');
            if (category && currentConsent[category] === true) {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    if (attr.name !== 'type' && attr.name !== 'data-consent-category') {
                        newScript.setAttribute(attr.name, attr.value);
                    }
                });
                newScript.type = 'text/javascript';
                newScript.innerHTML = script.innerHTML;
                script.parentNode.replaceChild(newScript, script);
            }
        });
    }

    function injectUI() {
        if (document.getElementById('cookie-banner')) return;

        // 1. Banner HTML
        const bannerHTML = `
        <div id="cookie-banner" role="dialog" aria-live="polite" aria-labelledby="cookie-title" class="cookie-hidden">
            <div class="cookie-banner-container">
                <div class="cookie-text-content">
                    <h3 id="cookie-title" class="cookie-title">
                        <span>🍪 Rispetto della Privacy e dei Cookie</span>
                    </h3>
                    <p class="cookie-description">
                        Il <strong>Laboratorio Matematico Orfini Foligno</strong> utilizza cookie tecnici essenziali per garantire il corretto funzionamento delle applicazioni didattiche e dei simulatori. Previsto l'uso di cookie di terze parti solo previo tuo consenso. Puoi accettarli tutti, rifiutarli mantenendo solo i necessari, o personalizzare le tue preferenze. Consulta la nostra <a href="/privacy-policy.html" target="_blank" rel="noopener">Informativa Privacy e Cookie Policy</a>.
                    </p>
                </div>
                <div class="cookie-actions">
                    <button id="cookie-accept-all" class="cookie-btn cookie-btn-accept">Accetta tutti</button>
                    <button id="cookie-reject" class="cookie-btn cookie-btn-reject">Rifiuta non essenziali</button>
                    <button id="cookie-settings-btn" class="cookie-btn cookie-btn-settings">Personalizza</button>
                </div>
            </div>
        </div>
        `;

        // 2. Modale Preferenze HTML
        const modalHTML = `
        <div id="cookie-settings-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title" class="cookie-modal-hidden">
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h3 id="cookie-modal-title" class="cookie-modal-title">⚙️ Preferenze sui Cookie</h3>
                    <button id="cookie-modal-close-x" class="cookie-modal-close" aria-label="Chiudi modale">✕</button>
                </div>

                <div class="cookie-category-item">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Cookie Tecnici ed Essenziali</span>
                        <span class="cookie-category-badge badge-required">Sempre Attivi</span>
                    </div>
                    <p class="cookie-description">
                        Necessari per la navigazione, il salvataggio dello stato dei simulatori didattici ed il corretto funzionamento delle app vettoriali. Non possono essere disattivati.
                    </p>
                </div>

                <div class="cookie-category-item">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Cookie Analitici (Anonimizzati)</span>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="toggle-cookie-analytics">
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    <p class="cookie-description">
                        Ci aiutano a comprendere come gli studenti ed i docenti utilizzano i laboratori matematici per migliorare l'esperienza didattica.
                    </p>
                </div>

                <div class="cookie-category-item">
                    <div class="cookie-category-header">
                        <span class="cookie-category-title">Cookie Funzionali e Widget Terzi</span>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="toggle-cookie-functional">
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    <p class="cookie-description">
                        Abilitano contenuti multimediali integrati (video didattici, p5.js, Geogebra o risorse interattive esterne).
                    </p>
                </div>

                <div class="cookie-modal-footer">
                    <button id="cookie-save-preferences" class="cookie-btn cookie-btn-accept">Salva preferenze</button>
                    <button id="cookie-modal-close-cancel" class="cookie-btn cookie-btn-reject">Annulla</button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', bannerHTML + modalHTML);
        bindEvents();
    }

    function bindEvents() {
        const acceptAllBtn = document.getElementById('cookie-accept-all');
        const rejectBtn = document.getElementById('cookie-reject');
        const settingsBtn = document.getElementById('cookie-settings-btn');
        const savePrefBtn = document.getElementById('cookie-save-preferences');
        const closeX = document.getElementById('cookie-modal-close-x');
        const closeCancel = document.getElementById('cookie-modal-close-cancel');

        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', () => {
                saveConsent({ necessary: true, analytics: true, functional: true });
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                saveConsent({ necessary: true, analytics: false, functional: false });
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', showModal);
        }

        if (savePrefBtn) {
            savePrefBtn.addEventListener('click', () => {
                const analytics = document.getElementById('toggle-cookie-analytics')?.checked || false;
                const functional = document.getElementById('toggle-cookie-functional')?.checked || false;
                saveConsent({ necessary: true, analytics, functional });
            });
        }

        if (closeX) closeX.addEventListener('click', hideModal);
        if (closeCancel) closeCancel.addEventListener('click', hideModal);
    }

    function showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.remove('cookie-hidden');
    }

    function hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.add('cookie-hidden');
    }

    function showModal() {
        const modal = document.getElementById('cookie-settings-modal');
        if (!modal) return;
        const consent = currentConsent || DEFAULT_CONSENT;
        const analyticsToggle = document.getElementById('toggle-cookie-analytics');
        const functionalToggle = document.getElementById('toggle-cookie-functional');
        if (analyticsToggle) analyticsToggle.checked = consent.analytics;
        if (functionalToggle) functionalToggle.checked = consent.functional;
        modal.classList.remove('cookie-modal-hidden');
    }

    function hideModal() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) modal.classList.add('cookie-modal-hidden');
    }

    // Inizializzazione al caricamento del DOM
    function init() {
        injectUI();
        if (!currentConsent) {
            showBanner();
        } else {
            applyConsents();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Esposizione dell'API Globale OrfiniConsent
    window.OrfiniConsent = {
        hasConsent: function (category) {
            if (category === 'necessary') return true;
            return currentConsent ? !!currentConsent[category] : false;
        },
        openSettings: function () {
            showModal();
        },
        acceptAll: function () {
            saveConsent({ necessary: true, analytics: true, functional: true });
        },
        rejectAll: function () {
            saveConsent({ necessary: true, analytics: false, functional: false });
        }
    };
})();

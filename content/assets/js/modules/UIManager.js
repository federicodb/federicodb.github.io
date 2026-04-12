export class UIManager {
    constructor(db, sceneApp) {
        this.db = db;
        this.sceneApp = sceneApp; // Riferimento alla scena 3D per bloccare i controlli

        // State
        this.state = {
            searchQuery: '',
            activeCategory: 'all',
            filteredItems: [],
            renderedCount: 0,
            CHUNK_SIZE: 20 // Renderizza 20 item per volta
        };

        // DOM Elements
        this.els = {
            searchInput: document.getElementById('search-input'),
            listGrid: document.getElementById('full-list-grid'),
            modal: document.getElementById('media-modal'),
            modalBox: document.getElementById('modal-box')
        };

        // Bindings
        this.filterDebounced = this.debounce(this.filterList.bind(this), 300);
        this.initListeners();
    }

    // --- UTILS ---
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- LIFECYCLE ---
    initListeners() {
        // Infinite Scroll Observer (Native Window Scroll)
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.renderNextChunk();
            }
        }, { root: null, rootMargin: '300px', threshold: 0.1 });

        // Input testuale
        if (this.els.searchInput) {
            this.els.searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase();
                this.filterDebounced();
            });
        }

        // Nav Tabs (Categorie)
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if(tab.getAttribute('onclick')) return; 

                if(tab.getAttribute('id') === 'btn-bio') {
                    this.openBioModal();
                    return;
                }

                tabs.forEach(t => {
                    if(t.getAttribute('id') !== 'btn-bio') t.classList.remove('active');
                });
                tab.classList.add('active');
                this.state.activeCategory = tab.dataset.category || 'all';
                this.filterList();
                document.getElementById('main-content').scrollIntoView({behavior: 'smooth', block: 'start'});
            });
        });

        // Forza primo rendering!
        this.filterList();
    }

    set3DInteraction(isActive) {
        if (this.sceneApp && this.sceneApp.controls) {
            this.sceneApp.controls.enabled = isActive;
        }
    }

    // --- SEARCH LOGIC ---

    filterList() {
        const term = this.state.searchQuery.trim();
        const cat = this.state.activeCategory;
        
        let pool = this.db;
        
        // 1. Filtro Categoria ("Faceted logic" deterministico da build.py)
        if (cat !== 'all') {
            pool = pool.filter(i => i.game_type === cat);
        }
        
        // 2. Testo Ricerca
        if (!term) {
            this.state.filteredItems = pool;
        } else {
            this.state.filteredItems = pool.filter(item =>
                item.title.toLowerCase().includes(term) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(term)))
            );
        }
        
        this.resetListRender();
    }

    // --- RENDERING STRATEGY ---

    resetListRender() {
        this.els.listGrid.innerHTML = '';
        this.state.renderedCount = 0;
        this.sentinel = document.createElement('div');
        this.sentinel.style.height = '10px';
        this.sentinel.style.width = '100%';
        this.renderNextChunk();
    }

    renderNextChunk() {
        const { filteredItems, renderedCount, CHUNK_SIZE } = this.state;
        const total = filteredItems.length;
        if (renderedCount >= total) return;

        const nextBatch = filteredItems.slice(renderedCount, renderedCount + CHUNK_SIZE);
        const fragment = document.createDocumentFragment();

        nextBatch.forEach((item, idx) => {
            const card = this.createCardDOM(item);
            if (renderedCount === 0) card.style.animationDelay = `${Math.min(idx * 0.03, 0.5)}s`;
            fragment.appendChild(card);
        });

        if (this.sentinel) this.sentinel.remove();
        this.els.listGrid.appendChild(fragment);
        this.els.listGrid.appendChild(this.sentinel);
        this.state.renderedCount += nextBatch.length;

        this.observer.disconnect();
        if (this.state.renderedCount < total) this.observer.observe(this.sentinel);
    }

    // --- HELPERS ---
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    createCardDOM(item) {
        const el = document.createElement('div');
        el.className = 'project-card';
        el.tabIndex = 0; // A11y focusable

        let hue;
        let glowColor;
        let badgeHTML = '';

        if (item.game_type === 'arcade') { 
            hue = 340; glowColor = 'rgba(244, 63, 94, 0.2)'; 
            badgeHTML = `<div style="display:inline-block; line-height:1; background:#e11d48; color:white; padding:4px 10px; font-size:0.75rem; border-radius:12px; font-weight:bold;">🎮 Arcade</div>`;
        } 
        else if (item.game_type === 'memory') { 
            hue = 150; glowColor = 'rgba(16, 185, 129, 0.2)'; 
            badgeHTML = `<div style="display:inline-block; line-height:1; background:#059669; color:white; padding:4px 10px; font-size:0.75rem; border-radius:12px; font-weight:bold;">🃏 Memory</div>`;
        } 
        else if (item.game_type === 'sim') { 
            hue = 190; glowColor = 'rgba(14, 165, 233, 0.2)'; 
            badgeHTML = `<div style="display:inline-block; line-height:1; background:#0284c7; color:white; padding:4px 10px; font-size:0.75rem; border-radius:12px; font-weight:bold;">🧊 Simulatore</div>`;
        } 
        else if (item.game_type === 'document') { 
            hue = 220; glowColor = 'rgba(79, 70, 229, 0.3)'; 
            badgeHTML = `<div style="display:inline-block; line-height:1; background:#4f46e5; color:white; padding:4px 10px; font-size:0.75rem; border-radius:12px; font-weight:bold;">📄 Verifica</div>`;
        }
        else { 
            hue = this.hashString(item.title) % 360; glowColor = `hsla(${hue}, 40%, 30%, 0.3)`; 
            badgeHTML = '';
        }

        el.style.backgroundColor = `hsla(${hue}, 30%, 8%, 0.8)`;
        el.style.borderColor = glowColor;
        // el.style.boxShadow = `0 4px 15px ${glowColor}`; // Rimossa per look più flat/glass

        const tagsHtml = (item.tags || []).slice(0, 6).map(t => {
            if (t.includes(':')) {
                // Badge per Competenze Istituzionali
                const parts = t.split(':');
                const id = parts[0];
                const name = parts[1];
                return `<button class="filter-tag badge-institutional" data-tag="${t}" title="${name}">✦ ${id}</button>`;
            }
            if (t.match(/^[1-5]\s?[A-Z]{2,3}(\/[1-5]\s?[A-Z]{2,3})?$/i) || t.match(/^(Biennio|Triennio|Trasversale)$/i)) {
                // I codici classe non li mettiamo qui se li mettiamo nel badge top, 
                // ma lasciamoli comunque per filtraggio se l'utente clicca
                return `<button class="filter-tag badge-class" data-tag="${t}">${t}</button>`;
            }
            // Hashtag standard
            return `<button class="filter-tag" data-tag="${t}">#${t.toLowerCase()}</button>`;
        }).join('');

        const classTag = (item.tags || []).find(t => t.match(/^[1-5]\s?[A-Z]{2,3}(\/[1-5]\s?[A-Z]{2,3})?$/i) || t.match(/^(Biennio|Triennio|Trasversale)$/i));
        const classBadge = classTag ? `<div class="filter-tag badge-class" style="margin:0; cursor:default;">${classTag}</div>` : '';

        const bgHtml = item.thumbnail ? `<div class="card-bg" style="background-image: url('${item.thumbnail}')"></div>` : '';

        // Call To Action Specifica (Richiesta Task-Oriented)
        let ctaText = "Esplora Contenuto";
        if (item.type === 'app' || !item.type) ctaText = "Apri Laboratorio";
        else if (item.game_type === 'document') ctaText = "Apri Verifica";
        else if (item.type === 'document' || item.type === 'note' || item.url.endsWith('.pdf')) ctaText = "Vedi Documento";

        // Gestione versioni multiple (per Verifiche Raggruppate)
        let versionsHtml = '';
        if (item.versions && item.versions.length > 1) {
            const vlinks = item.versions.map((v, i) => {
                const label = v.label || `Fila ${String.fromCharCode(65 + i)}`;
                let icon = '📄';
                if (label.includes('Correttore')) icon = '🔑';
                else if (label.includes('Mappa')) icon = '🗺️';
                else if (label.includes('Recupero')) icon = '🔄';

                return `
                    <a href="${v.url}" target="_blank" class="version-btn" 
                       style="display:inline-flex; align-items:center; gap:6.4px; padding:8px 14px; border-radius:12px; background:rgba(255,255,255,0.05); color:#fff; text-decoration:none; font-size:0.85rem; font-weight:600; border:1px solid rgba(255,255,255,0.1); transition:all 0.2s;">
                       <span style="opacity:0.7;">${icon}</span> ${label}
                    </a>`;
            }).join('');
            
            versionsHtml = `
                <div style="margin-bottom:24px; padding:16px; background:rgba(255,255,255,0.03); border-radius:16px; border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.15em; color:#666; margin-bottom:12px; font-weight:800;">Risorse Disponibili</div>
                    <div style="display:flex; flex-wrap:wrap; gap:10px;">${vlinks}</div>
                </div>`;
        }

        el.innerHTML = `
            ${bgHtml}
            <div class="card-overlay"></div>
            <div class="card-content-wrap">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    ${badgeHTML}
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="card-date">${item.date || 'Recente'}</div>
                        ${classBadge}
                    </div>
                </div>
                <h3>${item.title}</h3>
                <p>${item.excerpt || item.description || 'Nessuna descrizione.'}</p>
                
                ${versionsHtml}

                <div class="card-tags">${tagsHtml}</div>
                
                <div style="margin-top:auto;">
                    <button class="card-cta">${item.icon || '🚀'} ${ctaText}</button>
                </div>
            </div>
        `;

        el.onclick = (e) => {
            // Se ho cliccato un tag, setto il filtro invece che navigare!
            if (e.target.classList.contains('filter-tag')) {
                e.stopPropagation();
                e.preventDefault();
                const tag = e.target.dataset.tag;
                if (this.els.searchInput) {
                    if (this.els.searchInput.value === tag) {
                        this.els.searchInput.value = ''; // Toggle off
                    } else {
                        this.els.searchInput.value = tag;
                    }
                    this.els.searchInput.dispatchEvent(new Event('input')); // trigga il ricalcolo nativo
                    document.getElementById('main-content').scrollIntoView({behavior: 'smooth', block: 'start'});
                }
                return;
            }
            
            // Se ho cliccato un pulsante versione, lascia che l'evento <a> faccia il suo lavoro
            if (e.target.closest('.version-btn')) {
                e.stopPropagation();
                return;
            }

            this.handleItemClick(item);
        };
        
        el.onkeydown = (e) => {
             if (e.key === 'Enter') this.handleItemClick(item);
        };
        
        return el;
    }

    handleItemClick(item) {
        if (item.url.startsWith('http')) {
            window.open(item.url, '_blank');
        } else if (item.type === 'app' || !item.type) {
            window.location.href = item.url;
        } else if (item.url.endsWith('.pdf')) {
            window.open(item.url, '_blank');
        } else {
            this.openModal(item);
        }
    }

    openModal(item) {
        this.els.modalBox.innerHTML = '';
        let content = '';
        if (item.type === 'video') content = `<video controls autoplay style="width:100%; border-radius:16px;"><source src="${item.url}" type="video/mp4"></video>`;
        else if (item.type === 'image' || item.type === 'infographic') content = `<img src="${item.url}" style="max-width:100%; max-height:85vh; border-radius:16px; display:block; margin:auto;">`;
        else content = `<iframe src="${item.url}" style="width:100%; height:80vh; border:none; border-radius:16px; background:white;"></iframe>`;

        this.els.modalBox.innerHTML = content;
        this.els.modal.classList.add('active');
        // Interaction stays ENABLED
    }

    closeModal() {
        this.els.modal.classList.remove('active');
        this.els.modalBox.innerHTML = '';
        this.set3DInteraction(true);
    }

    openBioModal() {
        this.els.modalBox.innerHTML = '';
        
        const bioMarkdown = `
### **Bio**
Federico De Benedictis è un docente di ruolo di Matematica presso l'Istituto Professionale "E. Orfini" di Foligno. Laureato in Ingegneria per l'Ambiente ed il Territorio, ha maturato una consolidata esperienza nelle metodologie STEM e nella progettazione didattica supportata da tecnologie digitali. Opera attivamente come docente esperto e formatore PNRR per la transizione digitale e la riduzione dei divari negli apprendimenti. Il suo approccio multidisciplinare unisce matematica, fisica, tecnologia e arte in un modello di apprendimento visivo e sperimentale.

---

### **Il Senso dell'Hub**
Questo ecosistema digitale è stato progettato per centralizzare le attività laboratoriali svolte all'IPIA Orfini, trasformando il caos creativo in strumenti concreti e accessibili. L'hub risponde a finalità specifiche:

* **Continuità e Accessibilità:** Permette agli studenti di fruire dei materiali didattici, come UDA e verifiche parametriche, direttamente dai propri dispositivi personali.
* **Didattica Inclusiva:** Offre supporti multisensoriali e strumenti digitali personalizzati per facilitare l'apprendimento e ridurre il carico cognitivo di studenti con DSA e ADHD.
* **Ricerca e Sperimentazione:** Funge da laboratorio per l'integrazione di AI generativa, pensiero computazionale e casi studio reali (Problem Based Learning).
* **Etica Open Source:** Promuove l'uso esclusivo di software libero e tecnologie accessibili per un'educazione digitale sostenibile e priva di barriere economiche.

---

### **Modellazione e Stampa 3D**
La modellazione algoritmica e la fabbricazione digitale sono pilastri fondamentali del laboratorio. Le competenze spaziano dalla progettazione parametrica con OpenSCAD alla programmazione didattica con Python e p5.js, fino allo slicing e alla stampa 3D professionale con PrusaSlicer. L'attività integra inoltre l'uso di hardware aperto come Arduino e Raspberry Pi per rendere tangibili i concetti astratti attraverso la creazione di prototipi fisici.
`;

        const htmlContent = window.marked ? window.marked.parse(bioMarkdown) : bioMarkdown;
        
        const cardUI = `
            <div style="background: rgba(10, 20, 30, 0.95); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); padding: 40px; color: #ddd; max-height: 85vh; overflow-y: auto; text-align: left; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid rgba(0, 188, 212, 0.3); padding-bottom: 15px; margin-bottom: 20px; flex-wrap:wrap; gap:10px;">
                    <h2 style="font-family:'Syne', sans-serif; font-size:2rem; color:#fff; margin:0; line-height:1.1;">Federico De Benedictis</h2>
                    <span style="background:rgba(255,64,129,0.2); color:#ff4081; padding:5px 15px; border-radius:20px; font-weight:bold; font-size:0.85rem; border:1px solid #ff4081;">Docente STEM & Maker</span>
                </div>
                <div class="bio-content" style="line-height:1.7; font-size:1.05rem;">
                    ${htmlContent}
                </div>
                <div style="margin-top:40px; display:flex; justify-content:center;">
                    <a href="https://instagram.com/meltingmath" target="_blank" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:white; font-weight:bold; padding: 12px 30px; border-radius:30px; text-decoration:none; display:flex; align-items:center; gap:10px; transition: transform 0.2s; box-shadow: 0 8px 25px rgba(220, 39, 67, 0.4);">
                        📷 Esplora il Dietro le Quinte su @meltingmath
                    </a>
                </div>
            </div>
            
            <style>
                .bio-content h3 { color: #00bcd4; margin-top: 2em; margin-bottom: 0.8em; font-family:'Syne', sans-serif; font-size: 1.4rem;}
                .bio-content ul { padding-left: 20px; margin-top: 10px; }
                .bio-content li { margin-bottom: 10px; }
                .bio-content hr { border: none; border-top: 1px dashed rgba(255,255,255,0.2); margin: 30px 0; }
                .bio-content p { margin-bottom: 15px; }
                .bio-content strong { color: #fff; }
                #modal-box::-webkit-scrollbar { width: 8px; }
                #modal-box::-webkit-scrollbar-thumb { background: rgba(0, 188, 212, 0.5); border-radius: 10px; }
            </style>
        `;
        
        this.els.modalBox.innerHTML = cardUI;
        this.els.modal.classList.add('active');
        this.set3DInteraction(false);
    }
}

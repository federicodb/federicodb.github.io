/*
    UIManager.js
    Gestione della logica di interfaccia, filtraggio e rendering delle card.
    Ottimizzato per performance mobile e design premium.
*/

export class UIManager {
    constructor(db) {
        this.db = db;
        this.semanticLabels = {
            'erroricomuni': 'Evitare gli Errori',
            'mappa': 'Mappa Concettuale',
            'correttore': 'Correttore Soluzioni',
            'en': 'English Version',
            'it': 'Versione Italiana',
            'mappa_en': 'Conceptual Map (EN)',
            'mappa_it': 'Mappa Concettuale (IT)',
            'fila_a': 'Fila A',
            'fila_b': 'Fila B',
            'versione_a': 'Fila A',
            'versione_b': 'Fila B'
        };
        this.state = {
            searchQuery: '',
            activeCategory: 'all',
            filteredItems: [],
            renderedCount: 0,
            CHUNK_SIZE: 12
        };

        // DOM Elements
        this.els = {
            searchInput: document.getElementById('search-input'),
            grid: document.getElementById('main-grid'),
            modal: document.getElementById('modal-overlay'),
            modalContent: document.getElementById('modal-content')
        };

        this.filterDebounced = this.debounce(this.filterList.bind(this), 300);
        this.init();
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    init() {
        // Infinite Scroll
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.renderNextChunk();
            }
        }, { rootMargin: '400px' });

        // Search Listener
        if (this.els.searchInput) {
            this.els.searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.toLowerCase();
                this.filterDebounced();
            });
            
            // Handle URL params (from Galaxy View)
            const urlParams = new URLSearchParams(window.location.search);
            const tagParam = urlParams.get('tag');
            if (tagParam) {
                this.els.searchInput.value = tagParam;
                this.state.searchQuery = tagParam.toLowerCase();
            }
        }

        this.filterList();
    }

    setFilter(type, value) {
        if (type === 'search') {
            this.state.searchQuery = value.toLowerCase();
            this.filterList();
        }
    }

    filterList() {
        const term = this.state.searchQuery.trim();
        
        // Always filter out normative items for the main grid
        const baseItems = this.db.filter(item => item.type !== 'normativa');

        if (!term) {
            this.state.filteredItems = baseItems;
        } else {
            this.state.filteredItems = baseItems.filter(item => {
                const title = item.title?.toLowerCase() || '';
                const excerpt = item.excerpt?.toLowerCase() || '';
                const tags = (item.tags || []).map(t => t.toLowerCase());
                return title.includes(term) || excerpt.includes(term) || tags.some(t => t.includes(term));
            });
        }
        
        this.resetGrid();
    }

    resetGrid() {
        this.els.grid.innerHTML = '';
        this.state.renderedCount = 0;
        
        // Sentinel for infinite scroll
        if (this.sentinel) this.sentinel.remove();
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'sentinel';
        this.sentinel.style.height = '1px';
        this.sentinel.style.width = '100%';
        
        this.renderNextChunk();
    }

    renderNextChunk() {
        const { filteredItems, renderedCount, CHUNK_SIZE } = this.state;
        const total = filteredItems.length;
        
        if (renderedCount >= total) return;

        const nextBatch = filteredItems.slice(renderedCount, renderedCount + CHUNK_SIZE);
        const fragment = document.createDocumentFragment();

        const themeColors = ['blue', 'green', 'purple', 'red', 'teal', 'yellow'];

        nextBatch.forEach((item, idx) => {
            const colorIndex = (renderedCount + idx) % themeColors.length;
            const themeColor = themeColors[colorIndex];
            const card = this.createCardDOM(item, themeColor);
            
            // Staggered animation for the first batch
            if (renderedCount === 0) {
                card.style.animationDelay = `${idx * 0.05}s`;
            }
            fragment.appendChild(card);
        });

        this.els.grid.appendChild(fragment);
        this.els.grid.appendChild(this.sentinel);
        this.state.renderedCount += nextBatch.length;

        this.observer.disconnect();
        if (this.state.renderedCount < total) {
            this.observer.observe(this.sentinel);
        }
    }

    getIcon(type, label = '') {
        const icons = {
            app: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM6 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3 3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/></svg>`,
            document: `<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
            link: `<svg class="icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
            image: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            infographic: `<svg class="icon" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
            normativa: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
            note: `<svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
        };

        if (label.includes('Correttore')) return `<svg class="icon" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z"/></svg>`;
        if (label.includes('Mappa')) return `<svg class="icon" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;
        
        return icons[type] || icons.app;
    }

    categorizeTags(tags = []) {
        const categories = { class: null, competencies: [], topics: [] };
        tags.forEach(t => {
            const tag = t.trim();
            if (/\d\s[A-Z]+/.test(tag)) categories.class = tag;
            else if (tag.includes(':') || tag.includes('_')) {
                // Pulizia descrittore competenza: MAT_A03: TESTO -> Riserva il testo pulito
                let text = tag.split(':').pop().trim();
                text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
                if (text.length > 50) text = text.substring(0, 47) + '...';
                categories.competencies.push({ code: tag.split(':')[0], text: text });
            }
            else categories.topics.push(tag);
        });
        return categories;
    }

    getCleanLabel(label = '') {
        const key = label.toLowerCase().replace(/\s+/g, '_');
        return this.semanticLabels[key] || label;
    }

    getClassTheme(className) {
        // Mappatura Artistica Desaturata
        const map = {
            '1 EL': { hue: 200, name: 'azure' },
            '2 EL': { hue: 140, name: 'sage' },
            '3 EL': { hue: 280, name: 'lavender' },
            '4 EL': { hue: 180, name: 'mint' },
            '5 EL': { hue: 40, name: 'sand' },
            '1 MEC': { hue: 220, name: 'slate' },
            '2 MEC': { hue: 210, name: 'ocean' },
            '3 MEC': { hue: 10, name: 'clay' },
            '4 MEC': { hue: 160, name: 'forest' },
            '5 MEC': { hue: 80, name: 'olive' },
            '2 GP': { hue: 340, name: 'rose' },
            '2 GR': { hue: 300, name: 'mauve' }
        };
        const theme = map[className] || { hue: 240, name: 'neutral' };
        return {
            bg: `hsl(${theme.hue}, 20%, 85%)`,
            fg: `hsl(${theme.hue}, 40%, 25%)`,
            border: `hsl(${theme.hue}, 25%, 75%)`
        };
    }

    createCardDOM(item, themeColor) {
        const el = document.createElement('div');
        el.className = 'card animate-in';
        el.setAttribute('data-color', themeColor);
        
        const categories = this.categorizeTags(item.tags);
        const classTheme = categories.class ? this.getClassTheme(categories.class) : null;

        if (classTheme) {
            el.style.setProperty('--class-bg', classTheme.bg);
            el.style.setProperty('--class-fg', classTheme.fg);
            el.style.setProperty('--class-border', classTheme.border);
        }

        const typeLabels = {
            app: 'Laboratorio',
            document: 'Verifica',
            normativa: 'Normativa',
            link: 'Risorsa',
            image: 'Visual',
            infographic: 'Infografica'
        };

        const competenciesHtml = categories.competencies.slice(0, 3).map(c => `
            <div class="competency-item">
                <span class="comp-dot"></span>
                <span class="comp-text"><strong>${c.code}:</strong> ${c.text}</span>
            </div>
        `).join('');

        const topicsHtml = categories.topics.slice(0, 3).map(t => `<button class="topic-chip" onclick="window.setGlobalFilter('${t.replace(/'/g, "\\'")}')">${t}</button>`).join('');
        
        let versionsHtml = '';
        if (item.versions && item.versions.length > 0) {
            versionsHtml = `
                <div class="version-selector">
                    <span class="version-label">Varianti</span>
                    <div class="version-buttons">
                        ${item.versions.map((v, i) => `
                            <a href="${v.url}" target="_blank" class="v-btn">
                                ${this.getCleanLabel(v.label) || ('V' + (i+1))}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            versionsHtml = `
                <a href="${item.url}" target="_blank" class="main-cta-btn">
                    Esplora Attività 
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
            `;
        }

        const bgStyle = item.thumbnail ? `style="background-image: url('${item.thumbnail}')"` : '';

        el.innerHTML = `
            <div class="card-bg" ${bgStyle}></div>
            <div class="card-overlay"></div>
            
            <div class="card-content">
                <div class="card-top-meta">
                    <span class="type-badge">${typeLabels[item.type] || 'Attività'}</span>
                    ${categories.class ? `<span class="class-badge">${categories.class}</span>` : ''}
                </div>

                <div class="card-main">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-desc">${item.excerpt || ''}</p>
                </div>

                <div class="card-competencies">
                    ${competenciesHtml}
                </div>

                <div class="card-footer">
                    <div class="topics-pills">${topicsHtml}</div>
                    ${versionsHtml}
                </div>
            </div>
        `;

        el.onclick = (e) => {
            if (e.target.closest('.v-btn')) return; 
            
            if (['image', 'infographic', 'video'].includes(item.type)) {
                e.preventDefault();
                this.openModal(item);
            } else {
                window.open(item.url, item.url.startsWith('http') || item.url.endsWith('.pdf') ? '_blank' : '_self');
            }
        };

        return el;
    }

    openModal(item) {
        let content = '';
        if (item.type === 'image' || item.type === 'infographic') {
            content = `<img src="${item.url}" style="max-width:100%; max-height:80vh; border-radius:12px; display:block; margin:0 auto;">`;
        } else if (item.type === 'video') {
            content = `<video src="${item.url}" controls autoplay style="width:100%; border-radius:12px;"></video>`;
        }
        
        this.els.modalContent.innerHTML = content;
        this.els.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.els.modal.classList.remove('active');
        this.els.modalContent.innerHTML = '';
        document.body.style.overflow = '';
    }
}

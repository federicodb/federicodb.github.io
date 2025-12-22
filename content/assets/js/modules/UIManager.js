export class UIManager {
    constructor(db, sceneApp) {
        this.db = db;
        this.sceneApp = sceneApp; // Riferimento alla scena 3D per bloccare i controlli
        
        // State
        this.state = {
            isSearchOpen: false,
            isPanelOpen: false,
            searchQuery: '',
            filteredItems: [],
            renderedCount: 0,
            CHUNK_SIZE: 20 // Renderizza 20 item per volta
        };

        // DOM Elements
        this.els = {
            searchOverlay: document.getElementById('list-overlay'),
            searchInput: document.getElementById('search-input'),
            listGrid: document.getElementById('full-list-grid'),
            sidePanel: document.getElementById('content-panel'),
            resultsContainer: document.getElementById('results-container'),
            panelTitle: document.getElementById('panel-title-text'),
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
        // Infinite Scroll Observer
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.renderNextChunk();
            }
        }, { root: this.els.listGrid, threshold: 0.1 });

        // Input
        this.els.searchInput.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value.toLowerCase();
            this.filterDebounced();
        });
    }

    // --- ACTIONS ---

    toggleSearch() {
        this.state.isSearchOpen = !this.state.isSearchOpen;
        const el = this.els.searchOverlay;
        
        if (this.state.isSearchOpen) {
            el.classList.add('active');
            this.els.searchInput.value = '';
            this.state.searchQuery = '';
            this.els.searchInput.focus();
            this.state.filteredItems = this.db;
            this.resetListRender();
            this.closePanel();
            // Interaction stays ENABLED
        } else {
            el.classList.remove('active');
            this.els.searchInput.blur();
        }
    }

    closeSearch() {
        if(this.state.isSearchOpen) this.toggleSearch();
    }

    openPanel(tag) {
        this.state.isPanelOpen = true;
        this.els.panelTitle.innerText = `Tag: ${tag}`;
        this.els.sidePanel.classList.add('active');
        
        const items = this.db.filter(item => item.tags.includes(tag));
        this.els.resultsContainer.innerHTML = '';
        items.forEach(item => {
            const card = this.createCardDOM(item);
            this.els.resultsContainer.appendChild(card);
        });

        this.closeSearch(); 
    }

    closePanel() {
        this.state.isPanelOpen = false;
        this.els.sidePanel.classList.remove('active');
    }

    set3DInteraction(isActive) {
        if (this.sceneApp && this.sceneApp.controls) {
            this.sceneApp.controls.enabled = isActive;
        }
    }

    // --- SEARCH LOGIC ---

    filterList() {
        const term = this.state.searchQuery;
        if (!term) {
            this.state.filteredItems = this.db;
        } else {
            this.state.filteredItems = this.db.filter(item => 
                item.title.toLowerCase().includes(term) || 
                item.tags.some(t => t.toLowerCase().includes(term))
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
        
        const hash = this.hashString(item.title);
        const hue = (hash % 360);
        el.style.backgroundColor = `hsla(${hue}, 30%, 15%, 0.8)`;
        el.style.borderColor = `hsla(${hue}, 40%, 30%, 0.5)`;

        const tagsHtml = item.tags.slice(0, 5).map(t => `<span class="mini-tag">#${t}</span>`).join('');
        const bgHtml = item.thumbnail ? `<div class="card-bg" style="background-image: url('${item.thumbnail}')"></div>` : '';

        el.innerHTML = `
            ${bgHtml}
            <div class="card-content-wrap">
                <div style="font-size:0.7rem; opacity:0.6; font-family:'Space Mono'">${item.date}</div>
                <h3>${item.title}</h3>
                <p>${item.excerpt || item.description || ''}</p>
                <div style="margin-top:auto;">${tagsHtml}</div>
            </div>
        `;
        
        el.onclick = () => this.handleItemClick(item);
        return el;
    }

    handleItemClick(item) {
        if (item.type === 'app' || !item.type) {
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
    }
}

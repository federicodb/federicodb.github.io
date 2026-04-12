import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class GalaxyScene {
    constructor(containerId, data, fullDb, onSelectCallback) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.fullDb = fullDb;
        this.onSelect = onSelectCallback;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.labelRenderer = null;
        this.controls = null;

        this.nodes = [];
        this.debris = [];
        this.connections = null;
        this.particles = null;
        this.frame = 0;

        const isMobile = window.innerWidth < 768;
        this.config = {
            starCount: isMobile ? 800 : 2000, // Reduced star count
            fogDensity: 0.0006,
            galaxyRadius: 180,
            focalDistance: 100,
            dofRange: 70
        };

        this.init();
    }

    init() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Pure Black for Void
        this.scene.fog = new THREE.FogExp2(0x000000, this.config.fogDensity);

        this.camera = new THREE.PerspectiveCamera(65, w / h, 2, 2500);
        this.camera.position.set(0, 30, 130);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.container.appendChild(this.renderer.domElement);

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(w, h);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0';
        this.labelRenderer.domElement.style.left = '0';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.container.appendChild(this.labelRenderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.6;
        this.controls.zoomSpeed = 1.0;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.1;
        this.controls.maxDistance = 600;
        this.controls.minDistance = 10;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        this.createStarfield();
        this.createTagCloud();
        this.createMathDebris();
        this.createConnections();

        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.container);
        
        this.animate();
    }

    createMathDebris() {
        const B = String.fromCharCode(92);
        // Extended Symbol Set for High Variety
        const symbols = [
            B + 'pi', 'e', B + 'phi', B + 'infty', B + 'sum', B + 'int', B + 'partial', B + 'sqrt{x}', B + 'Delta',
            B + 'sin x', B + 'cos x', B + 'ln n', B + 'frac{1}{2}', 'n!', 'E=mc^2', 'a^2+b^2=c^2', 'F=ma',
            B + 'forall x', B + 'exists y', 'x ' + B + 'in ' + B + 'mathbb{R}', B + 'nabla ' + B + 'cdot B', B + 'lambda',
            B + 'alpha', B + 'beta', B + 'gamma', B + 'theta', B + 'zeta', B + 'psi', B + 'omega', B + 'mu',
            B + 'int_{a}^{b}', B + 'oint', B + 'hbar', B + 'psi(x)', B + 'nabla^2', 'G_{' + B + 'mu' + B + 'nu}',
            'R_{' + B + 'mu' + B + 'nu}', B + 'Lambda', B + 'epsilon_0', B + 'mu_0', B + 'sigma', B + 'tau',
            B + 'prod', B + 'coprod', B + 'sqrt[n]{x}', 'log_b x', B + 'lim_{x' + B + 'to 0}'
        ];

        const group = new THREE.Group();
        this.scene.add(group);
        // Reduced count for lightness and clean look
        const count = window.innerWidth < 768 ? 30 : 60;

        // STRICT DEDUPLICATION: Shuffle Bag
        let bag = [...symbols].sort(() => Math.random() - 0.5);
        let bagIndex = 0;

        for (let i = 0; i < count; i++) {
            if (bagIndex >= bag.length) {
                bag = [...symbols].sort(() => Math.random() - 0.5);
                bagIndex = 0;
            }
            const latex = bag[bagIndex++];

            const wrapper = document.createElement('div');
            wrapper.className = 'math-debris';
            const hex = document.createElement('div');
            hex.className = 'debris-hex';
            const sym = document.createElement('span');
            sym.className = 'debris-sym';

            try {
                const k = window.katex || katex;
                if (k) k.render(latex, sym, { throwOnError: false, strict: false });
                else sym.textContent = latex;
            } catch (e) { sym.textContent = latex; }

            wrapper.appendChild(hex);
            wrapper.appendChild(sym);
            const label = new CSS2DObject(wrapper);
            // Intermediate radius for balanced depth
            const r = 120 + Math.pow(Math.random(), 2) * 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            label.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta) * 0.4, r * Math.cos(phi));
            label.userData = { hexElement: hex, symElement: sym, isDebris: true, phase: Math.random() * Math.PI * 2 };
            this.debris.push(label);
            group.add(label);
        }
    }

    createConnections() {
        const tagMap = {};
        const totalTags = this.data.length;
        
        // Helper per normalizzare i tag come facciamo in index.html (per il mapping delle connessioni)
        const normalizeTag = (t) => {
            let text = String(t).trim();
            if(text.includes(':')) {
                const id = text.split(':')[0].trim();
                text = id.length < 10 ? `✦ ${id}` : id;
            }
            return text.toLowerCase();
        };

        this.nodes.forEach((node, i) => {
                const hue = (i / totalTags) * 360;
                const text = normalizeTag(this.data[i].text);
                const key = text.toLowerCase();
                
                // Determinazione Colore Semantico Bauhaus & Area Disciplinare
                let semHue = hue;
                let discipline = 'GEN'; // Generica
                if (text.includes('MAT_')) { semHue = 190; discipline = 'MAT'; } 
                else if (text.includes('IND_')) { semHue = 55; discipline = 'IND'; } 
                else if (text.includes('CIT_')) { semHue = 160; discipline = 'CIT'; } 
                else if (text.includes('SOFT_')) { semHue = 320; discipline = 'SOFT'; } 
                
                tagMap[key] = { pos: node.position, links: 0, hue: semHue, discipline: discipline, count: this.data[i].count };
        });
        const correlation = {};
        this.fullDb.forEach(item => {
            const tags = item.tags || [];
            const nTags = [...new Set(tags.map(t => normalizeTag(t)).filter(t => t))];
            
            for (let i = 0; i < nTags.length; i++) {
                for (let j = i + 1; j < nTags.length; j++) {
                    const pair = [nTags[i], nTags[j]].sort().join('|');
                    correlation[pair] = (correlation[pair] || 0) + 1;
                }
            }
        });
        const points = [];
        const colors = [];
        const alphas = [];
        // const color = new THREE.Color(0x00e5ff); // Removed static color
        const sortedPairs = Object.entries(correlation).filter(([_, weight]) => weight >= 1).sort((a, b) => b[1] - a[1]);
        // FASE 1: Connessioni per Co-occorrenza (Legami Autentici)
        sortedPairs.forEach(([pair, weight]) => {
            const [t1, t2] = pair.split('|');
            const n1 = tagMap[t1], n2 = tagMap[t2];
            
            // "Rami" visivi: Democrazia per i Rami (Stessa Opacità per Tutti)
            if (n1 && n2 && n1.links < 12 && n2.links < 12) {
                const lightness = 0.5; // Valore medio costante
                const saturation = 0.4; // Valore medio costante
                
                const c1 = new THREE.Color().setHSL(n1.hue / 360, saturation, lightness);
                const c2 = new THREE.Color().setHSL(n2.hue / 360, saturation, lightness);

                points.push(n1.pos.x, n1.pos.y, n1.pos.z, n2.pos.x, n2.pos.y, n2.pos.z);
                colors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
                alphas.push(0.5, 0.5); // Uguaglianza totale: nessuna variazione di intensità
                
                n1.links++; n2.links++;
            }
        });

        // FASE 2: Orfano-Linker (Nessun nodo solo nel vuoto)
        Object.entries(tagMap).forEach(([key, n1]) => {
            if (n1.links === 0) {
                // Collega al polo "Matematica" se orfano, altrimenti al miglior genitore
                let candidateKey = Object.keys(tagMap).find(k => k.trim().toLowerCase() === 'matematica');
                if (!candidateKey) {
                    const found = Object.entries(tagMap)
                        .filter(([k, n]) => k !== key && n.discipline === n1.discipline)
                        .sort((a, b) => b[1].count - a[1].count)[0];
                    if (found) candidateKey = found[0];
                }

                const n2 = candidateKey ? tagMap[candidateKey] : null;
                
                if (n2) {
                    const c1 = new THREE.Color().setHSL(n1.hue / 360, 0.3, 0.5);
                    const c2 = new THREE.Color().setHSL(n2.hue / 360, 0.3, 0.5);
                    
                    points.push(n1.pos.x, n1.pos.y, n1.pos.z, n2.pos.x, n2.pos.y, n2.pos.z);
                    colors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
                    alphas.push(0.5, 0.5); 
                    n1.links++;
                }
            }
        });
        if (points.length === 0) return;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('alphaWeight', new THREE.Float32BufferAttribute(alphas, 1));

        // Shader for Distance Fading (Vanish Effect)
        const connectionVertexShader = `
            attribute vec3 color;
            attribute float alphaWeight;
            varying vec3 vColor;
            varying float vDist;
            varying float vAlphaWeight;
            void main() {
                vColor = color;
                vAlphaWeight = alphaWeight;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vDist = -mvPosition.z; // Depth
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const connectionFragmentShader = `
            varying vec3 vColor;
            varying float vDist;
            varying float vAlphaWeight;
            uniform float globalOpacity;
            
            void main() {
                // Fade start: 150, Fade end: 600 (Vanish point)
                float fade = 1.0 - smoothstep(150.0, 600.0, vDist);
                // Hard cut-off to save fragments if needed, or just let it fade
                if (fade < 0.01) discard;
                
                // Enhancement Alpha for heavy neural routes
                float enhancedAlpha = clamp((globalOpacity + (vAlphaWeight * 0.9)) * fade, 0.0, 1.0);
                gl_FragColor = vec4(vColor, enhancedAlpha);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader: connectionVertexShader,
            fragmentShader: connectionFragmentShader,
            uniforms: {
                globalOpacity: { value: 0.12 } // Opacità leggermente alzata per rami autentici
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.connections = new THREE.LineSegments(geometry, material);
        this.connections.frustumCulled = false;
        this.scene.add(this.connections);
    }

    createHexagonTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.lineTo(32 + 28 * Math.cos(angle), 32 + 28 * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF'; ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }

    createStarfield() {
        // Custom Shader for "Void" Stars: White, Fade Near, Twinkle, Bokeh
        const starVertexShader = `
            attribute float size;
            attribute float phase;
            varying float vAlpha;
            uniform float time;
            uniform float pixelRatio;
            
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float dist = length(mvPosition.xyz);
                
                // 1. Position
                gl_Position = projectionMatrix * mvPosition;
                
                // 2. Size Attenuation with "Bokeh" limit
                // Size scales with distance, but capped to avoid "mega hexagons"
                float sizeCalc = size * (300.0 / dist); 
                gl_PointSize = clamp(sizeCalc, 0.0, 50.0) * pixelRatio;
                
                // 3. Fade Near & Far
                // Deep Void Effect: Fade out if closer than 150 units or further than 1200
                float fadeNear = smoothstep(50.0, 150.0, dist); 
                float fadeFar = 1.0 - smoothstep(1000.0, 1800.0, dist);
                
                // 4. Twinkle Effect
                float twinkle = 0.5 + 0.5 * sin(time * 2.0 + phase);
                
                vAlpha = fadeNear * fadeFar * twinkle;
            }
        `;

        const starFragmentShader = `
            uniform sampler2D pointTexture;
            varying float vAlpha;
            
            void main() {
                // Get texture color
                vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                
                // Apply strict white color + calculated alpha
                // Force pure white (1.0, 1.0, 1.0) ignoring texture color tint if any
                gl_FragColor = vec4(1.0, 1.0, 1.0, texColor.a * vAlpha);
                
                // Discard fully transparent pixels for performance
                if (gl_FragColor.a < 0.05) discard;
            }
        `;

        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];
        const phases = [];

        const count = this.config.starCount; // ~3000

        for (let i = 0; i < count; i++) {
            // SPHERICAL DISTRIBUTION with "Void" gaps
            const r = 200 + Math.pow(Math.random(), 1.5) * 1800; // Push stars further out for void feel
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );

            // Random sizes: mostly small, few medium
            sizes.push(2.0 + Math.random() * 4.0);
            phases.push(Math.random() * Math.PI * 2);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

        this.starUniforms = {
            time: { value: 0 },
            pointTexture: { value: this.createHexagonTexture() },
            pixelRatio: { value: this.renderer.getPixelRatio() }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending // Glow effect
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createTagCloud() {
        const group = new THREE.Group();
        this.scene.add(group);
        const totalTags = this.data.length;

        // 1. Initialize Nodes with Random Spherical Distribution (Bauhaus Cluster)
        const nodes = this.data.map((tag, i) => {
            const r = Math.pow(Math.random(), 0.6) * 120; // Concentrazione interna
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            
            return {
                id: tag.text.toLowerCase().trim(),
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                count: tag.count,
                vx: 0, vy: 0, vz: 0
            };
        });

        // 2. Identify Edges
        const edges = [];
        const edgeStrength = {};
        this.fullDb.forEach(item => {
            const rawTags = item.tags || [];
            const nTags = [...new Set(rawTags.map(t => String(t).toLowerCase().trim()).filter(t => t))];
            const relevantTags = nTags.filter(t => this.data.some(d => d.text.toLowerCase().trim() === t));
            
            for (let i = 0; i < relevantTags.length; i++) {
                for (let j = i + 1; j < relevantTags.length; j++) {
                    const pair = [relevantTags[i], relevantTags[j]].sort().join('|');
                    edgeStrength[pair] = (edgeStrength[pair] || 0) + 1;
                }
            }
        });

        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        Object.entries(edgeStrength).forEach(([pair, count]) => {
            if (count < 1) return;
            const [t1, t2] = pair.split('|');
            const n1 = nodeMap.get(t1);
            const n2 = nodeMap.get(t2);
            if (n1 && n2) edges.push({ source: n1, target: n2, weight: count });
        });

        // 3. Run Physics Simulation
        this.runForceSimulation(nodes, edges);

        // 4. Create CSS2DObjects
        nodes.forEach((n, i) => {
            const tagItem = this.data[i];
            const wrapper = document.createElement('div');
            wrapper.className = 'galaxy-tag';
            const content = document.createElement('span');
            content.className = `tag-content font-${(Math.floor(Math.random() * 10) + 1)}`;
            content.textContent = tagItem.text;
            content.style.color = `hsl(${(i / totalTags) * 360}, 80%, 80%)`;
            content.onclick = () => this.onSelect && this.onSelect({ text: tagItem.text });

            // Hover
            content.onmouseenter = () => { label.userData.isHovered = true; };
            content.onmouseleave = () => { label.userData.isHovered = false; };

            wrapper.appendChild(content);

            const label = new CSS2DObject(wrapper);
            label.position.set(n.x, n.y, n.z);
            // BOOST di Gerarchia: i tag con più count salgono esponenzialmente di importanza in modo quadratico
            const boost = Math.pow(tagItem.count, 0.7); 
            label.userData = { contentElement: content, importance: boost, isHovered: false };
            this.nodes.push(label);
            group.add(label);
        });
    }

    runForceSimulation(nodes, edges) {
        const iterations = 450; 
        const repulsion = 9000; // Repulsione morbida per densità estrema
        const springLen = 40;   
        const kSpring = 0.45;   
        const centerGrav = 0.08; 
        const MAX_RADIUS = 160; 
        const dt = 0.35;
        
        // Identifica Polo Matematica per attrazione eliocentrica
        const matNode = nodes.find(n => n.id === 'matematica');

        for (let k = 0; k < iterations; k++) {
            // Repulsion (Node-Node)
            // Optimization: Only check neighbors if too slow, but for <200 nodes O(N^2) is fine (~40k ops)
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const n1 = nodes[i], n2 = nodes[j];
                    const dx = n1.x - n2.x, dy = n1.y - n2.y, dz = n1.z - n2.z;
                    const d2 = dx * dx + dy * dy + dz * dz + 100.0; // Softened singularity
                    const force = repulsion / d2;

                    const d = Math.sqrt(d2);
                    const fx = (dx / d) * force;
                    const fy = (dy / d) * force;
                    const fz = (dz / d) * force;

                    n1.vx += fx; n1.vy += fy; n1.vz += fz;
                    n2.vx -= fx; n2.vy -= fy; n2.vz -= fz;
                }
            }

            // Attraction (Edges)
            edges.forEach(e => {
                const n1 = e.source, n2 = e.target;
                const dx = n2.x - n1.x, dy = n2.y - n1.y, dz = n2.z - n1.z;
                const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (d < 0.1) return;

                const force = (d - springLen) * kSpring;
                const fx = (dx / d) * force;
                const fy = (dy / d) * force;
                const fz = (dz / d) * force;

                n1.vx += fx; n1.vy += fy; n1.vz += fz;
                n2.vx -= fx; n2.vy -= fy; n2.vz -= fz;
            });

            // Eliocentric Gravity & Boundary Constraint
            nodes.forEach(n => {
                const dx = matNode ? (matNode.x - n.x) : -n.x;
                const dy = matNode ? (matNode.y - n.y) : -n.y;
                const dz = matNode ? (matNode.z - n.z) : -n.z;
                
                const d = Math.sqrt(n.x*n.x + n.y*n.y + n.z*n.z);
                const noise = 1.0 + Math.sin(n.x * 0.08) * 0.1;
                let pull = centerGrav * noise;
                
                if (d > MAX_RADIUS) pull += (d - MAX_RADIUS) * 0.3;
                
                n.vx += dx * pull;
                n.vy += dy * pull;
                n.vz += dz * pull;

                // Prevent explosions (NaN / Infinity velocity)
                const vMag = Math.sqrt(n.vx * n.vx + n.vy * n.vy + n.vz * n.vz);
                if (vMag > 50) {
                    n.vx = (n.vx / vMag) * 50;
                    n.vy = (n.vy / vMag) * 50;
                    n.vz = (n.vz / vMag) * 50;
                }

                // Move
                n.x += n.vx * dt;
                n.y += n.vy * dt;
                n.z += n.vz * dt;

                // Damping
                n.vx *= 0.5; n.vy *= 0.5; n.vz *= 0.5;
            });
        }
    }

    hashString(str) {
        let hash = 0; if (!str) return 0;
        for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
        return Math.abs(hash);
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w === 0 || h === 0) return;
        
        this.camera.aspect = w / h;
        // Adattamento FOV per prevenire distorsioni ottiche ("letterbox squish")
        this.camera.fov = (w < h) ? 75 : 55;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(w, h);
        this.labelRenderer.setSize(w, h);
    }

    updateBokeh() {
        if (this.frame % 3 !== 0 || !this.camera) return;
        const camPos = this.camera.position;
        const focalDist = this.config.focalDistance, range = this.config.dofRange;
        const baseScale = 150;

        // 1. Tags
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const dist = camPos.distanceTo(node.position);
            const rawText = node.userData.contentElement.textContent.trim().toLowerCase();
            const isGodNode = (rawText === "matematica");
            
            // Zoom Semantico
            const maxVisibleDist = 400 + (node.userData.importance * 180);
            
            if (dist > maxVisibleDist && !isGodNode && !node.userData.isHovered) { 
                node.element.style.display = 'none'; 
                continue; 
            }
            
            let opacity = 1;
            const distDiff = Math.abs(dist - focalDist);
            if (distDiff > range && !isGodNode) opacity = 1 - Math.min(1, (distDiff - range) / 150);
            else if (isGodNode) opacity = 1; // Dio della matematica mai sfocato
            
            node.element.style.opacity = Math.max(0, opacity).toFixed(2);
            node.element.style.display = opacity < 0.05 ? 'none' : 'block';
            node.element.style.display = opacity < 0.05 ? 'none' : 'block';

            // Democrazia Visiva (Bauhaus): stessa scala per ogni nodo
            let s = 1.05; 

            // Attenuazione distanza (Sola correzione prospettica)
            const distScale = Math.min(Math.max(baseScale / dist, 0.5), 1.2);
            s *= distScale;

            // Apply Hover Boost
            if (node.userData.isHovered) {
                s *= 1.3;
                node.userData.contentElement.style.textShadow = "0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px var(--primary)";
                node.userData.contentElement.style.zIndex = "100";
            } else {
                node.userData.contentElement.style.textShadow = "";
                node.userData.contentElement.style.zIndex = "1";
            }

            node.userData.contentElement.style.transform = `scale(${s.toFixed(2)})`;
        }

        // 2. Math Debris
        for (let i = 0; i < this.debris.length; i++) {
            const node = this.debris[i];
            const dist = camPos.distanceTo(node.position);
            // Relaxed culling for deep background
            if (dist > 1000) {
                if (node.element.style.display !== 'none') node.element.style.display = 'none';
                continue;
            }

            const distDiff = Math.abs(dist - focalDist);
            // More forgiving opacity falloff (was / 150)
            const op = distDiff > range ? 1 - Math.min(1, (distDiff - range) / 300) : 1;
            // Relaxed proximity fade (was / 450)
            const proximity = Math.max(0, 1 - (dist / 750));

            const hex = node.userData.hexElement, sym = node.userData.symElement;

            hex.style.opacity = ((1 - Math.min(1, distDiff / range)) * 0.5 * proximity).toFixed(2);

            if (op > 0.05 && proximity > 0.05) {
                // Brighter lightness range
                const lightness = (60 + (Math.min(1, (range / distDiff) || 1) * 40)).toFixed(0);

                // Removed JS sin/cos translation - now handled by CSS
                sym.style.opacity = op.toFixed(2);
                sym.style.color = `hsl(190, ${Math.min(1, proximity) * 80}%, ${lightness}%)`;

                const s = Math.min(Math.max((baseScale / dist) * 1.4, 0.4), 2.5);
                sym.style.transform = `scale(${s.toFixed(2)})`;
                node.element.style.display = 'block';
            } else {
                if (node.element.style.display !== 'none') node.element.style.display = 'none';
            }
            node.element.style.opacity = (proximity * 2.0).toFixed(2);
        }

        if (this.connections && this.connections.material && this.connections.material.uniforms) {
            // Rami visibili solo da molto vicino (effetto scoperta)
            const distFactor = Math.max(0, Math.min(1, (400 - camPos.length()) / 400));
            this.connections.material.uniforms.globalOpacity.value = 0.2 * distFactor;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.frame++;
        const time = this.frame * 0.01;

        if (this.controls) this.controls.update();
        this.updateBokeh();

        // Rotate Starfield
        if (this.particles) {
            this.particles.rotation.y -= 0.00008; // Slower, more majestic rotation
            if (this.starUniforms) this.starUniforms.time.value = time;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
        }
    }
    resetCamera() {
        if (!this.camera || !this.controls) return;

        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        // Initial values from init()
        const endPos = new THREE.Vector3(0, 30, 130);
        const endTarget = new THREE.Vector3(0, 0, 0);

        const duration = 1500; // ms
        const startTime = performance.now();

        // Easing function: Ease Out Cubic
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animateReset = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutCubic(progress);

            this.camera.position.lerpVectors(startPos, endPos, ease);
            this.controls.target.lerpVectors(startTarget, endTarget, ease);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animateReset);
            }
        };

        requestAnimationFrame(animateReset);
    }
}
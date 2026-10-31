import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// Mappa dei temi (galaxy.html). I dati vengono da galaxy_data.js, generato da build.py (mappa_build.py):
// temi, legami pesati e famiglie. Qui c'è solo la scena: fisica viva (molle tra temi legati, rimbalzo elastico),
// trascinamento, filtro visivo (un tema → i temi e le attività che compaiono con lui; più temi → intersezione).

/** Generatore casuale con seme: la Mappa ha la stessa forma a ogni apertura */
function seeded(seed) {
    return () => {
        seed = (seed + 0x6D2B79F5) >>> 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2); // piccolo rimbalzo in arrivo
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export class GalaxyScene {
    constructor(containerId, data, { onSelectionChange } = {}) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.onSelectionChange = onSelectionChange;
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.rand = seeded(2026);

        this.nodes = [];      // { d: dati, x, y, z, vx, vy, vz, label, inner }
        this.debris = [];
        this.selected = new Set();
        this.alpha = 1;       // "temperatura" della fisica: alta all'inizio e quando si trascina, poi si calma
        this.drag = null;
        this.frame = 0;

        const isMobile = window.innerWidth < 768;
        this.config = { starCount: isMobile ? 800 : 2000, focalDistance: 140, dofRange: 110 };
        this.init();
    }

    init() {
        const w = this.container.clientWidth, h = this.container.clientHeight;
        if (w === 0 || h === 0) { requestAnimationFrame(() => this.init()); return; }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0006);

        this.camera = new THREE.PerspectiveCamera(w < h ? 75 : 55, w / h, 2, 6000);
        this.home = { pos: new THREE.Vector3(0, 60, 420), target: new THREE.Vector3(0, 0, 0) };
        this.camera.position.copy(this.home.pos);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        Object.assign(this.renderer.domElement.style, { position: 'absolute', top: '0', left: '0' });
        this.container.appendChild(this.renderer.domElement);

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(w, h);
        Object.assign(this.labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
        this.container.appendChild(this.labelRenderer.domElement);

        // inerzia: la rotazione continua e si smorza dopo aver lasciato
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.rotateSpeed = 0.6;
        this.controls.autoRotate = !this.reduced;
        this.controls.autoRotateSpeed = 0.25;
        this.controls.maxDistance = 2600; // da lontano resta leggibile solo "Matematica" al centro della costellazione
        this.controls.minDistance = 20;
        this.controls.addEventListener('start', () => { this.controls.autoRotate = false; });
        // la rotella sopra un'etichetta deve comunque fare zoom: la giro alla scena
        this.labelRenderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.renderer.domElement.dispatchEvent(new WheelEvent('wheel', e));
        }, { passive: false });

        this.createStarfield();
        this.createMathDebris();
        this.createNodes();
        this.createEdges();
        this.prewarm();

        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.container);
        window.addEventListener('pointermove', (e) => this.onDragMove(e));
        window.addEventListener('pointerup', (e) => this.onDragEnd(e));
        window.addEventListener('pointercancel', (e) => this.onDragEnd(e));

        this.animate();
    }

    // ------------------------------------------------------------------ temi

    createNodes() {
        const group = new THREE.Group();
        this.scene.add(group);
        const maxCount = Math.max(...this.data.nodes.slice(1).map((n) => n.count));
        // ogni famiglia parte da una direzione diversa: i gruppi si formano subito e la fisica li rifinisce
        const famDir = {};
        const dirFor = (f) => {
            if (!famDir[f]) {
                const phi = Math.acos(2 * this.rand() - 1), th = this.rand() * Math.PI * 2;
                famDir[f] = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.sin(phi) * Math.sin(th) * 0.7, Math.cos(phi));
            }
            return famDir[f];
        };

        this.data.nodes.forEach((d, i) => {
            const p = d.sole ? new THREE.Vector3() : dirFor(d.fam).clone().multiplyScalar(150 + this.rand() * 60)
                .add(new THREE.Vector3(this.rand() - 0.5, this.rand() - 0.5, this.rand() - 0.5).multiplyScalar(50));

            const wrapper = document.createElement('div');
            // i temi di una sola attività sono foglie: restano discreti finché non servono
            wrapper.className = 'galaxy-tag' + (d.count === 1 && !d.sole ? ' is-minor' : '');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tag-content' + (d.sole ? ' is-sun' : '');
            btn.textContent = d.label;
            btn.setAttribute('aria-pressed', 'false');
            btn.title = d.sole ? 'Tutte le attività' : `${d.count} ${d.count === 1 ? 'attività' : 'attività'}: tocca per filtrare`;
            const size = d.sole ? 2.1 : 0.85 + 0.75 * Math.sqrt(d.count / maxCount);
            btn.style.fontSize = `${size.toFixed(2)}rem`;
            btn.style.setProperty('--tag-color', d.sole ? 'hsl(45, 100%, 75%)' : `hsl(${d.hue}, 85%, 76%)`);
            wrapper.appendChild(btn);

            const label = new CSS2DObject(wrapper);
            label.position.copy(p);
            group.add(label);

            const node = { d, i, x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, label, wrapper, btn, neighbors: new Set() };
            btn.addEventListener('pointerdown', (e) => this.onDragStart(e, node));
            btn.addEventListener('click', (e) => { if (this.suppressClick) { e.preventDefault(); return; } this.toggle(node.i); });
            btn.addEventListener('pointerenter', () => this.hover(node, true));
            btn.addEventListener('pointerleave', () => this.hover(node, false));
            this.nodes.push(node);
        });
    }

    createEdges() {
        this.edges = this.data.edges.map(([a, b, w, kind]) => {
            const s = this.nodes[a], t = this.nodes[b];
            // le molle tengono la forma; "rete" e "raggio" si disegnano soltanto (la ragnatela)
            const spring = kind !== 'rete' && kind !== 'raggio';
            if (kind !== 'raggio') { s.neighbors.add(t.i); t.neighbors.add(s.i); }
            const rest = kind === 'ponte' ? 170 : 42 + 70 * (1 - w);
            const k = kind === 'ponte' ? 0.012 : 0.03 + 0.06 * w;
            return { s, t, w, kind, rest, k, spring };
        });
        this.springs = this.edges.filter((e) => e.spring);

        const n = this.edges.length;
        const geometry = new THREE.BufferGeometry();
        this.edgePos = new Float32Array(n * 6);
        this.edgeCol = new Float32Array(n * 6);
        this.edgeAlpha = new Float32Array(n * 2);
        this.edgeEnergy = new Float32Array(n * 2);
        const lineT = new Float32Array(n * 2), seed = new Float32Array(n * 2), speed = new Float32Array(n * 2);
        const c = new THREE.Color();
        this.edges.forEach((e, i) => {
            [e.s, e.t].forEach((node, j) => {
                if (node.d.sole) c.setHSL(45 / 360, 0.95, 0.62); else c.setHSL(node.d.hue / 360, 0.8, 0.62);
                this.edgeCol.set([c.r, c.g, c.b], i * 6 + j * 3);
            });
            lineT[i * 2 + 1] = 1;
            seed[i * 2] = seed[i * 2 + 1] = this.rand();
            // segnali: più rapidi sui legami forti, lenti e radi sulla ragnatela
            speed[i * 2] = speed[i * 2 + 1] = e.kind === 'rete' || e.kind === 'raggio' ? 0.08 + 0.06 * this.rand() : 0.16 + 0.22 * e.w;
        });
        geometry.setAttribute('position', new THREE.BufferAttribute(this.edgePos, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.edgeCol, 3));
        geometry.setAttribute('alphaWeight', new THREE.BufferAttribute(this.edgeAlpha, 1));
        geometry.setAttribute('energy', new THREE.BufferAttribute(this.edgeEnergy, 1));
        geometry.setAttribute('lineT', new THREE.BufferAttribute(lineT, 1));
        geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1));

        this.edgeUniforms = { time: { value: 0 } };
        const material = new THREE.ShaderMaterial({
            uniforms: this.edgeUniforms,
            vertexShader: `
                attribute vec3 color;
                attribute float alphaWeight;
                attribute float energy;
                attribute float lineT;
                attribute float seed;
                attribute float speed;
                varying vec3 vColor;
                varying float vDist;
                varying float vAlpha;
                varying float vEnergy;
                varying float vT;
                varying float vSeed;
                varying float vSpeed;
                void main() {
                    vColor = color; vAlpha = alphaWeight; vEnergy = energy;
                    vT = lineT; vSeed = seed; vSpeed = speed;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    vDist = -mv.z;
                    gl_Position = projectionMatrix * mv;
                }`,
            // un impulso luminoso scorre lungo ogni legame, come un segnale tra neuroni
            fragmentShader: `
                uniform float time;
                varying vec3 vColor;
                varying float vDist;
                varying float vAlpha;
                varying float vEnergy;
                varying float vT;
                varying float vSeed;
                varying float vSpeed;
                void main() {
                    float fade = 1.0 - smoothstep(1400.0, 3200.0, vDist);
                    float head = fract(time * vSpeed + vSeed * 7.0);
                    float d = vT - head;
                    float pulse = smoothstep(0.16, 0.0, abs(d)) * step(d, 0.0) + smoothstep(0.03, 0.0, abs(d));
                    float a = (vAlpha + pulse * vEnergy) * fade;
                    if (a < 0.008) discard;
                    gl_FragColor = vec4(vColor * (1.0 + pulse * vEnergy * 1.5), a);
                }`,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.lines = new THREE.LineSegments(geometry, material);
        this.lines.frustumCulled = false;
        this.scene.add(this.lines);
        this.createGlow();
        this.updateHighlight();
    }

    /** Un alone per ogni tema: il corpo del "neurone", grande quanto la frequenza del tema, che respira */
    createGlow() {
        const n = this.nodes.length;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.12, 'rgba(255,255,255,0.85)');
        g.addColorStop(0.35, 'rgba(255,255,255,0.25)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);

        this.glowPos = new Float32Array(n * 3);
        this.glowLevel = new Float32Array(n).fill(1);
        const col = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
        const maxCount = Math.max(...this.nodes.slice(1).map((x) => x.d.count));
        const c = new THREE.Color();
        this.nodes.forEach((node, i) => {
            if (node.d.sole) c.setHSL(45 / 360, 1, 0.62); else c.setHSL(node.d.hue / 360, 0.85, 0.62);
            col.set([c.r, c.g, c.b], i * 3);
            size[i] = node.d.sole ? 120 : 14 + 34 * Math.sqrt(node.d.count / maxCount);
            phase[i] = this.rand() * Math.PI * 2;
        });
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.glowPos, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
        geometry.setAttribute('level', new THREE.BufferAttribute(this.glowLevel, 1));
        this.glowUniforms = {
            time: { value: 0 },
            tex: { value: new THREE.CanvasTexture(canvas) },
            pixelRatio: { value: this.renderer.getPixelRatio() },
        };
        this.glow = new THREE.Points(geometry, new THREE.ShaderMaterial({
            uniforms: this.glowUniforms,
            vertexShader: `
                attribute vec3 color;
                attribute float size;
                attribute float phase;
                attribute float level;
                uniform float time;
                uniform float pixelRatio;
                varying vec3 vColor;
                varying float vLevel;
                void main() {
                    vColor = color; vLevel = level;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mv;
                    float breath = 0.82 + 0.18 * sin(time * 1.3 + phase);
                    gl_PointSize = size * breath * (0.6 + 0.4 * level) * (300.0 / -mv.z) * pixelRatio;
                }`,
            fragmentShader: `
                uniform sampler2D tex;
                varying vec3 vColor;
                varying float vLevel;
                void main() {
                    float a = texture2D(tex, gl_PointCoord).a * 0.55 * vLevel;
                    if (a < 0.01) discard;
                    gl_FragColor = vec4(vColor, a);
                }`,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        this.glow.frustumCulled = false;
        this.scene.add(this.glow);
    }

    // ------------------------------------------------------------------ fisica

    step(dt) {
        const N = this.nodes, a = this.alpha;
        // repulsione tra tutti i temi (pochi: O(N²) va bene)
        for (let i = 0; i < N.length; i++) {
            const p = N[i];
            for (let j = i + 1; j < N.length; j++) {
                const q = N[j];
                const dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z;
                const d2 = dx * dx + dy * dy + dz * dz + 25;
                const f = (1500 / d2) * a;
                const inv = 1 / Math.sqrt(d2);
                p.vx += dx * inv * f; p.vy += dy * inv * f; p.vz += dz * inv * f;
                q.vx -= dx * inv * f; q.vy -= dy * inv * f; q.vz -= dz * inv * f;
            }
        }
        // molle sui legami
        for (const e of this.springs) {
            const p = e.s, q = e.t;
            const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
            const f = (d - e.rest) * e.k * a;
            p.vx += (dx / d) * f; p.vy += (dy / d) * f; p.vz += (dz / d) * f;
            q.vx -= (dx / d) * f; q.vy -= (dy / d) * f; q.vz -= (dz / d) * f;
        }
        // Matematica resta al centro; tutti sentono un richiamo leggero verso di lei
        const friction = this.reduced ? 0.6 : 0.86; // sotto lo smorzamento critico: le molle rimbalzano
        for (const n of N) {
            if (n.d.sole) { n.x = n.y = n.z = 0; n.vx = n.vy = n.vz = 0; continue; }
            if (n === this.drag?.node) { n.vx = n.vy = n.vz = 0; continue; }
            n.vx -= n.x * 0.0012 * a; n.vy -= n.y * 0.0022 * a; n.vz -= n.z * 0.0012 * a;
            n.vx *= friction; n.vy *= friction; n.vz *= friction;
            n.x += n.vx * dt; n.y += n.vy * dt; n.z += n.vz * dt;
        }
    }

    prewarm() {
        for (let k = 0; k < 320; k++) this.step(1);
        this.alpha = 0.12;
        this.syncPositions();
    }

    syncPositions() {
        this.nodes.forEach((n, i) => {
            n.label.position.set(n.x, n.y, n.z);
            this.glowPos[i * 3] = n.x; this.glowPos[i * 3 + 1] = n.y; this.glowPos[i * 3 + 2] = n.z;
        });
        if (this.glow) this.glow.geometry.attributes.position.needsUpdate = true;
        this.edges.forEach((e, i) => {
            this.edgePos.set([e.s.x, e.s.y, e.s.z, e.t.x, e.t.y, e.t.z], i * 6);
        });
        this.lines.geometry.attributes.position.needsUpdate = true;
    }

    // ------------------------------------------------------------------ trascinamento

    onDragStart(e, node) {
        if (node.d.sole || e.button > 0) return;
        e.preventDefault();
        this.drag = { node, x0: e.clientX, y0: e.clientY, moved: false };
        this.controls.enabled = false;
        this.controls.autoRotate = false;
        // il piano su cui si trascina: perpendicolare alla vista, passante per il tema
        const normal = new THREE.Vector3();
        this.camera.getWorldDirection(normal);
        this.drag.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(node.x, node.y, node.z));
    }

    onDragMove(e) {
        if (!this.drag) return;
        if (Math.hypot(e.clientX - this.drag.x0, e.clientY - this.drag.y0) > 5) this.drag.moved = true;
        if (!this.drag.moved) return;
        const r = this.renderer.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        const ray = new THREE.Raycaster();
        ray.setFromCamera(ndc, this.camera);
        const hit = new THREE.Vector3();
        if (ray.ray.intersectPlane(this.drag.plane, hit)) {
            const n = this.drag.node;
            n.x = hit.x; n.y = hit.y; n.z = hit.z;
            this.alpha = Math.max(this.alpha, 0.45); // i vicini si svegliano e lo seguono
        }
    }

    onDragEnd() {
        if (!this.drag) return;
        this.suppressClick = this.drag.moved;
        setTimeout(() => { this.suppressClick = false; }, 0);
        this.drag = null;
        this.controls.enabled = true;
    }

    // ------------------------------------------------------------------ filtro visivo

    /** Attività che hanno tutti i temi scelti (Matematica non restringe) */
    matchingApps() {
        const scelti = [...this.selected].map((i) => this.nodes[i].d).filter((d) => !d.sole);
        if (!scelti.length) return this.selected.size ? this.data.apps.map((_, i) => i) : [];
        return scelti.reduce((acc, d) => acc.filter((a) => d.apps.includes(a)), scelti[0].apps.slice());
    }

    toggle(i) {
        const node = this.nodes[i];
        if (node.d.sole) this.selected.clear();
        if (this.selected.has(i)) this.selected.delete(i); else if (!node.d.sole) this.selected.add(i);
        this.updateHighlight();
        if (this.selected.has(i)) this.flyTo(node);
        else if (!this.selected.size) this.resetCamera();
        this.onSelectionChange?.(this.selection());
    }

    clear() {
        this.selected.clear();
        this.updateHighlight();
        this.resetCamera();
        this.onSelectionChange?.(this.selection());
    }

    selection() {
        return {
            tags: [...this.selected].map((i) => ({ i, label: this.nodes[i].d.label, id: this.nodes[i].d.id })),
            apps: this.matchingApps(),
        };
    }

    updateHighlight() {
        const active = this.selected.size > 0;
        const apps = new Set(this.matchingApps());
        // temi "vicini": compaiono in almeno un'attività rimasta dopo il filtro
        const near = new Set();
        if (active) this.nodes.forEach((n) => { if (n.d.apps.some((a) => apps.has(a))) near.add(n.i); });
        this.nodes.forEach((n) => {
            const sel = this.selected.has(n.i);
            n.wrapper.classList.toggle('is-selected', sel);
            n.wrapper.classList.toggle('is-near', active && !sel && near.has(n.i));
            n.wrapper.classList.toggle('is-dim', active && !sel && !near.has(n.i) && !n.d.sole);
            n.btn.setAttribute('aria-pressed', String(sel));
        });
        this.edges.forEach((e, i) => {
            const web = e.kind === 'rete' || e.kind === 'raggio';
            const touch = this.selected.has(e.s.i) || this.selected.has(e.t.i);
            const both = near.has(e.s.i) && near.has(e.t.i);
            let a, en;
            if (!active) {
                a = e.kind === 'raggio' ? 0.05 : web ? 0.06 + 0.12 * e.w : e.kind === 'ponte' ? 0.2 : 0.16 + 0.4 * e.w;
                en = web ? 0.35 : 0.8;
            } else if (touch) { a = both ? 0.75 : 0.18; en = both ? 1.6 : 0.4; }
            else { a = both ? 0.22 : 0.012; en = both ? 0.7 : 0; }
            this.edgeAlpha[i * 2] = this.edgeAlpha[i * 2 + 1] = a;
            this.edgeEnergy[i * 2] = this.edgeEnergy[i * 2 + 1] = en;
        });
        this.nodes.forEach((n) => {
            this.glowLevel[n.i] = !active ? 1 : this.selected.has(n.i) ? 2.2 : near.has(n.i) || n.d.sole ? 1.2 : 0.12;
        });
        if (this.glow) this.glow.geometry.attributes.level.needsUpdate = true;
        this.lines.geometry.attributes.energy.needsUpdate = true;
        this.lines.geometry.attributes.alphaWeight.needsUpdate = true;
    }

    hover(node, on) {
        node.wrapper.classList.toggle('is-hover', on);
        node.neighbors.forEach((j) => this.nodes[j].wrapper.classList.toggle('is-linked', on));
    }

    // ------------------------------------------------------------------ camera

    animateCamera(endPos, endTarget, duration, ease) {
        const startPos = this.camera.position.clone(), startTarget = this.controls.target.clone();
        const t0 = performance.now();
        const run = (now) => {
            const p = Math.min((now - t0) / duration, 1), k = ease(p);
            this.camera.position.lerpVectors(startPos, endPos, k);
            this.controls.target.lerpVectors(startTarget, endTarget, k);
            if (p < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
    }

    flyTo(node) {
        const target = new THREE.Vector3(node.x, node.y, node.z);
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        const pos = target.clone().add(dir.multiplyScalar(120));
        // su schermo largo il pannello occupa la destra: il tema scelto va un po' a sinistra del centro
        if (window.innerWidth > 700) {
            const right = new THREE.Vector3().crossVectors(this.camera.up, dir).normalize();
            const shift = right.multiplyScalar(38);
            target.add(shift); pos.add(shift);
        }
        this.controls.autoRotate = false;
        this.animateCamera(pos, target, this.reduced ? 1 : 1100, this.reduced ? easeOutCubic : easeOutBack);
    }

    resetCamera() {
        this.animateCamera(this.home.pos.clone(), this.home.target.clone(), this.reduced ? 1 : 1400, easeOutCubic);
        this.controls.autoRotate = !this.reduced;
    }

    // ------------------------------------------------------------------ sfondo (invariato nello stile)

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
        const geometry = new THREE.BufferGeometry();
        const positions = [], sizes = [], phases = [];
        for (let i = 0; i < this.config.starCount; i++) {
            const r = 300 + Math.pow(this.rand(), 1.5) * 1700;
            const theta = this.rand() * Math.PI * 2, phi = Math.acos(2 * this.rand() - 1);
            positions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
            sizes.push(2.0 + this.rand() * 4.0);
            phases.push(this.rand() * Math.PI * 2);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
        this.starUniforms = {
            time: { value: 0 },
            pointTexture: { value: this.createHexagonTexture() },
            pixelRatio: { value: this.renderer.getPixelRatio() },
        };
        const material = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: `
                attribute float size;
                attribute float phase;
                varying float vAlpha;
                uniform float time;
                uniform float pixelRatio;
                void main() {
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    float dist = length(mv.xyz);
                    gl_Position = projectionMatrix * mv;
                    gl_PointSize = clamp(size * (300.0 / dist), 0.0, 50.0) * pixelRatio;
                    float fadeNear = smoothstep(50.0, 150.0, dist);
                    float fadeFar = 1.0 - smoothstep(1000.0, 1800.0, dist);
                    vAlpha = fadeNear * fadeFar * (0.5 + 0.5 * sin(time * 2.0 + phase));
                }`,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vAlpha;
                void main() {
                    vec4 tex = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, tex.a * vAlpha);
                    if (gl_FragColor.a < 0.05) discard;
                }`,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createMathDebris() {
        const B = String.fromCharCode(92);
        const symbols = [
            B + 'pi', 'e', B + 'phi', B + 'infty', B + 'sum', B + 'int', B + 'sqrt{x}', B + 'Delta', B + 'sin x', B + 'cos x',
            B + 'frac{1}{2}', 'n!', 'a^2+b^2=c^2', 'y=mx+q', B + 'forall x', 'x ' + B + 'in ' + B + 'mathbb{R}', B + 'lambda',
            B + 'alpha', B + 'theta', B + 'sigma', 'log_b x', B + 'lim_{x' + B + 'to 0}', '(a+b)^2', B + 'frac{1+' + B + 'sqrt5}{2}',
        ];
        const group = new THREE.Group();
        this.scene.add(group);
        const count = window.innerWidth < 768 ? 24 : 48;
        for (let i = 0; i < count; i++) {
            const latex = symbols[i % symbols.length];
            const wrapper = document.createElement('div');
            wrapper.className = 'math-debris';
            const hex = document.createElement('div');
            hex.className = 'debris-hex';
            const sym = document.createElement('span');
            sym.className = 'debris-sym';
            try { window.katex.render(latex, sym, { throwOnError: false, strict: false }); } catch { sym.textContent = latex; }
            wrapper.append(hex, sym);
            const label = new CSS2DObject(wrapper);
            const r = 260 + Math.pow(this.rand(), 2) * 700;
            const theta = this.rand() * Math.PI * 2, phi = Math.acos(2 * this.rand() - 1);
            label.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta) * 0.4, r * Math.cos(phi));
            label.userData = { hex, sym };
            this.debris.push(label);
            group.add(label);
        }
    }

    // ------------------------------------------------------------------ ciclo

    updateDepth() {
        if (this.frame % 3 !== 0) return;
        const cam = this.camera.position;
        // profondità: i temi lontani sfumano e rimpiccioliscono (solo il contenitore: il bottone ha le sue transizioni)
        for (const n of this.nodes) {
            const dist = cam.distanceTo(n.label.position);
            // allontanandosi i temi rimpiccioliscono e sfumano fino a sparire; Matematica resta sempre leggibile
            const s = n.d.sole ? Math.min(Math.max(420 / dist, 0.75), 1.35) : Math.min(Math.max(330 / dist, 0.3), 1.35);
            const op = n.d.sole ? 1 : 1 - Math.min(1, Math.max(0, (dist - 420) / 650));
            n.wrapper.style.visibility = op < 0.03 ? 'hidden' : 'visible';
            n.wrapper.style.setProperty('--depth-scale', s.toFixed(2));
            n.wrapper.style.setProperty('--depth-opacity', op.toFixed(2));
            n.wrapper.style.zIndex = String(Math.round(1000 - dist));
        }
        for (const d of this.debris) {
            const dist = cam.distanceTo(d.position);
            const proximity = Math.max(0, 1 - dist / 900);
            d.element.style.display = proximity < 0.05 ? 'none' : 'block';
            d.element.style.opacity = (proximity * 0.9).toFixed(2);
            d.userData.sym.style.transform = `translate(-50%, -50%) scale(${Math.min(Math.max(250 / dist, 0.4), 2).toFixed(2)})`;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.frame++;
        // la fisica si calma da sola, ma non si spegne del tutto: la Mappa respira
        this.alpha = Math.max(this.drag ? 0.45 : 0.035, this.alpha * 0.985);
        this.step(this.reduced ? 0.5 : 1);
        this.syncPositions();
        this.controls.update();
        this.updateDepth();
        const t = this.frame / 60;
        this.edgeUniforms.time.value = t;
        if (this.glowUniforms) this.glowUniforms.time.value = t;
        if (this.particles) {
            this.particles.rotation.y -= 0.00008;
            this.starUniforms.time.value = this.frame * 0.01;
        }
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    }

    onResize() {
        const w = this.container.clientWidth, h = this.container.clientHeight;
        if (!w || !h) return;
        this.camera.aspect = w / h;
        this.camera.fov = w < h ? 75 : 55;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.labelRenderer.setSize(w, h);
    }
}

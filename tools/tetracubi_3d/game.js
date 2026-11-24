// Tetracubi 3D: i sette tetramini (pezzi da 4 quadrati) fatti di cubi, in un pozzo tridimensionale.
// Three.js (MIT). Nessuna altra dipendenza.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================== dati ============================== */

const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
// colori dei pezzi: palette di Orfini Math Lab, toni chiari leggibili sul fondo scuro
const COLORS = {
  I: 0xfb7185, O: 0x2dd4bf, T: 0xa3e635, S: 0x818cf8,
  Z: 0xfbbf24, J: 0xf0abfc, L: 0x38bdf8,
};
// offset interi rispetto al perno; pezzi piatti nel piano XZ (y = 0)
const SHAPES = {
  I: [[-1,0,0],[0,0,0],[1,0,0],[2,0,0]],
  O: [[0,0,0],[1,0,0],[0,0,1],[1,0,1]],
  T: [[-1,0,0],[0,0,0],[1,0,0],[0,0,1]],
  S: [[0,0,0],[1,0,0],[-1,0,1],[0,0,1]],
  Z: [[-1,0,0],[0,0,0],[0,0,1],[1,0,1]],
  J: [[-1,0,-1],[-1,0,0],[0,0,0],[1,0,0]],
  L: [[1,0,-1],[-1,0,0],[0,0,0],[1,0,0]],
};
const SIZES = {
  classic: { W: 5, D: 5, H: 12 },
  large:   { W: 7, D: 7, H: 14 },
};
const KICKS = [
  [0,0,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],
  [1,1,0],[-1,1,0],[0,1,1],[0,1,-1],[0,2,0],
  [2,0,0],[-2,0,0],[0,0,2],[0,0,-2],
];
const DAS = 160, ARR = 45, LOCK_DELAY = 500, MAX_RESETS = 12;

/* ============================== stato ============================== */

let W = 5, D = 5, H = 12;
let grid = new Uint8Array(W * D * H);
let pid = new Int32Array(W * D * H);   // numero del pezzo che occupa la cella (0 = nessuno)
let pieceSeq = 0;
let state = 'menu';           // menu | playing | clearing | paused | over
let cur = null;               // { type, cells, x, y, z }
let queue = [], bag = [];
let holdType = null, holdUsed = false;
let score = 0, lines = 0, level = 1;
let modo = localStorage.getItem('orfini_tetracubi_modo') === 'guidata' ? 'guidata' : 'auto';
let velocita = Math.min(2, Math.max(.5, +(localStorage.getItem('orfini_tetracubi_velocita') || 1) || 1));
// record separati: la discesa guidata non gareggia con quella automatica
const recordKey = () => modo === 'guidata' ? 'orfini_tetracubi_record_guidata' : 'orfini_tetracubi_record';
let best = +(localStorage.getItem(recordKey()) || 0);
let fallAcc = 0, lockTimer = 0, lockResets = 0, softDrop = false;
let clearing = null;
let selectedSize = localStorage.getItem('orfini_tetracubi_pozzo') || 'classic';
const das = {};               // tasti direzione premuti (auto-repeat)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const idx = (x, y, z) => (y * D + z) * W + x;
const cellToWorld = (x, y, z) => [x - W / 2 + .5, y + .5, z - D / 2 + .5];

/* ============================== DOM ============================== */

const $ = id => document.getElementById(id);
const scoreEl = $('score'), bestEl = $('best'), levelEl = $('level'), linesEl = $('lines');
const startOv = $('startOv'), pauseOv = $('pauseOv'), overOv = $('overOv');
const popups = $('popups');
const nextCv = $('next'), holdCv = $('hold');

function setState(s) { state = s; document.body.dataset.state = s; }
function updateHud() {
  scoreEl.textContent = score;
  bestEl.textContent = Math.max(best, score);
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

/* ============================== audio ============================== */

let actx = null;
let muted = localStorage.getItem('orfini_tetracubi_muto') === '1';
const btnMute = $('btnMute');
function paintMute() { btnMute.textContent = muted ? 'Audio: no' : 'Audio: sì'; }
function unlockAudio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* niente audio */ } }
  if (actx && actx.state === 'suspended') actx.resume();
}
function beep(f, d = .06, type = 'square', v = .05, slide = 0) {
  if (muted || !actx) return;
  const t = actx.currentTime;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(actx.destination);
  o.start(t); o.stop(t + d + .02);
}
const sfx = {
  move:   () => beep(210, .035, 'square', .022),
  rotate: () => beep(330, .05, 'square', .04),
  lock:   () => beep(140, .07, 'triangle', .07),
  drop:   () => beep(130, .08, 'sawtooth', .055, -70),
  clear:  n => [523, 659, 784, 1047].slice(0, Math.min(4, n + 1))
              .forEach((f, i) => setTimeout(() => beep(f, .09, 'square', .05), i * 70)),
  over:   () => [392, 311, 233, 155].forEach((f, i) => setTimeout(() => beep(f, .16, 'triangle', .06), i * 140)),
};
function toggleMute() {
  muted = !muted;
  localStorage.setItem('orfini_tetracubi_muto', muted ? '1' : '0');
  paintMute();
}
paintMute();

/* ============================== scena 3D ============================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);
scene.fog = new THREE.Fog(0x05070d, 34, 95);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 220);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
$('stage').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 48;
controls.maxPolarAngle = 1.52;
controls.autoRotateSpeed = .7;

/* orbita inerziale: rampa dolce dopo l'inattività, stop immediato al tocco */
let orbitOn = !reducedMotion, interacting = false, idleMs = 2000, orbitRamp = 0;
const btnOrbit = $('btnOrbit');
function paintOrbit() { btnOrbit.textContent = orbitOn ? 'Orbita: sì' : 'Orbita: no'; }
function tickOrbit(dt) {
  if (!interacting) idleMs += dt;
  const want = orbitOn && !reducedMotion && !interacting && idleMs > 1200;
  orbitRamp = want ? Math.min(1, orbitRamp + dt / 900) : 0;
  controls.autoRotate = orbitRamp > 0;
  controls.autoRotateSpeed = .9 * orbitRamp;
}
controls.addEventListener('start', () => { interacting = true; idleMs = 0; orbitRamp = 0; });
controls.addEventListener('end', () => { interacting = false; idleMs = 0; });
btnOrbit.addEventListener('click', () => { orbitOn = !orbitOn; paintOrbit(); });
paintOrbit();

scene.add(new THREE.AmbientLight(0x8899bb, .7));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(14, 26, 10);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -16, right: 16, top: 22, bottom: -8, near: 2, far: 70 });
scene.add(key);
const fill = new THREE.DirectionalLight(0x6688ff, .5);
fill.position.set(-12, 10, -14);
scene.add(fill);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .5, .45, .78);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* materiali e geometrie condivise */
/* Cubetto smussato. I sei bit di `mask` dicono quali facce toccano un cubetto
   dello stesso pezzo (+x, -x, +y, -y, +z, -z): lì il cubetto si allunga di `ov`
   dentro il vicino e lo smusso resta una scanalatura sottile, così il pezzo si
   legge come un blocco unico in cui i cubetti si contano ancora. Le facce libere
   rientrano di `inset`. Gli smussi sono a 45°: la stessa forma va in stampa. */
const DIRS6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
function maskOf(cells, c) {
  const set = cells instanceof Set ? cells : new Set(cells.map(k => k.join(',')));
  let m = 0;
  DIRS6.forEach((d, i) => { if (set.has([c[0] + d[0], c[1] + d[1], c[2] + d[2]].join(','))) m |= 1 << i; });
  return m;
}
function chamferBox(mask, inset, ov, ch) {
  const lo = [0, 1, 2].map(a => -.5 + (mask & (1 << (2 * a + 1)) ? -ov : inset));
  const hi = [0, 1, 2].map(a => .5 + (mask & (1 << (2 * a)) ? ov : -inset));
  const ctr = [0, 1, 2].map(a => (lo[a] + hi[a]) / 2);
  const verts = [], tris = [], ids = new Map();
  // V(s, a): vertice dell'angolo s (bit per asse) sulla faccia perpendicolare all'asse a
  const V = (s, a) => {
    const k = s * 3 + a;
    if (!ids.has(k)) {
      ids.set(k, verts.length);
      verts.push([0, 1, 2].map(b => {
        const up = (s >> b) & 1;
        return b === a ? (up ? hi[b] : lo[b]) : (up ? hi[b] - ch : lo[b] + ch);
      }));
    }
    return ids.get(k);
  };
  const poly = q => {
    const P = q.map(i => verts[i]);
    const c = [0, 1, 2].map(b => P.reduce((t, p) => t + p[b], 0) / P.length);
    const u = P[1].map((x, b) => x - P[0][b]), v = P[2].map((x, b) => x - P[0][b]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const out = n[0] * (c[0] - ctr[0]) + n[1] * (c[1] - ctr[1]) + n[2] * (c[2] - ctr[2]) > 0;
    const r = out ? q : q.slice().reverse();
    for (let i = 1; i < r.length - 1; i++) tris.push([r[0], r[i], r[i + 1]]);
  };
  const S = (bits) => bits[0] | (bits[1] << 1) | (bits[2] << 2);
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const sa of [0, 1]) {
      // faccia (a, sa)
      const corner = (sb, sc) => { const t = []; t[a] = sa; t[b] = sb; t[c] = sc; return S(t); };
      poly([V(corner(0, 0), a), V(corner(1, 0), a), V(corner(1, 1), a), V(corner(0, 1), a)]);
      // smusso fra la faccia (a, sa) e la faccia (b, sb), lungo l'asse c
      for (const sb of [0, 1]) poly([V(corner(sb, 0), a), V(corner(sb, 0), b), V(corner(sb, 1), b), V(corner(sb, 1), a)]);
    }
  }
  for (let s = 0; s < 8; s++) poly([V(s, 0), V(s, 1), V(s, 2)]);
  return { verts, tris };
}
const geoCache = new Map();
function cellGeometry(mask, inset, ov, ch) {
  const key = [mask, inset, ov, ch].join('|');
  if (!geoCache.has(key)) {
    const { verts, tris } = chamferBox(mask, inset, ov, ch);
    const pos = [];
    for (const t of tris) for (const i of t) pos.push(...verts[i]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    geoCache.set(key, g);
  }
  return geoCache.get(key);
}
const GAME_CUBE = { inset: .02, ov: .055, ch: .08 };
const gameGeo = mask => cellGeometry(mask, GAME_CUBE.inset, GAME_CUBE.ov, GAME_CUBE.ch);
const geo = gameGeo(0);
// contorno per il fantasma: solo gli spigoli fra due facce libere
const edgeCache = new Map();
function ghostEdges(mask) {
  if (!edgeCache.has(mask)) {
    const free = (a, s) => !(mask & (1 << (2 * a + (s ? 0 : 1))));
    const pts = [], h = .495;
    for (let a = 0; a < 3; a++) {
      const b = (a + 1) % 3, c = (a + 2) % 3;
      for (const sb of [0, 1]) for (const sc of [0, 1]) {
        if (!free(b, sb) || !free(c, sc)) continue;
        for (const sa of [0, 1]) {
          const p = []; p[a] = sa ? h : -h; p[b] = sb ? h : -h; p[c] = sc ? h : -h;
          pts.push(...p);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    edgeCache.set(mask, g);
  }
  return edgeCache.get(mask);
}
const footGeo = new THREE.PlaneGeometry(.9, .9);
const mats = {}, activeMats = {}, ghostMats = {}, footMats = {}, ghostEdgeMats = {};
for (const t of TYPES) {
  const c = new THREE.Color(COLORS[t]);
  mats[t] = new THREE.MeshStandardMaterial({ color: c, roughness: .38, metalness: .15, emissive: c, emissiveIntensity: .22 });
  activeMats[t] = new THREE.MeshStandardMaterial({ color: c, roughness: .3, metalness: .15, emissive: c, emissiveIntensity: .55 });
  ghostMats[t] = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .2, depthWrite: false });
  footMats[t] = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .3, depthWrite: false });
  ghostEdgeMats[t] = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .55 });
}
const flashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: .4 });

let wellGroup = new THREE.Group();
const lockedGroup = new THREE.Group();
const activeGroup = new THREE.Group();
const ghostGroup = new THREE.Group();
const footGroup = new THREE.Group();
scene.add(wellGroup, lockedGroup, activeGroup, ghostGroup, footGroup);

function disposeGroup(g) {
  g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}

function buildWell() {
  scene.remove(wellGroup);
  disposeGroup(wellGroup);
  wellGroup = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x0a101c, roughness: .95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.06;
  ground.receiveShadow = true;
  wellGroup.add(ground);

  const outer = new THREE.GridHelper(80, 80, 0x16203a, 0x0d1526);
  outer.position.y = -.05;
  outer.material.transparent = true;
  outer.material.opacity = .65;
  wellGroup.add(outer);

  // griglia del pavimento del pozzo
  const pts = [];
  for (let i = 0; i <= W; i++) pts.push(i - W / 2, 0, -D / 2, i - W / 2, 0, D / 2);
  for (let j = 0; j <= D; j++) pts.push(-W / 2, 0, j - D / 2, W / 2, 0, j - D / 2);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  wellGroup.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a3c5e, transparent: true, opacity: .9 })));

  // pareti appena visibili
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x33507e, transparent: true, opacity: .05, side: THREE.DoubleSide, depthWrite: false });
  const wall = (w, px, pz, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallMat);
    m.position.set(px, H / 2, pz);
    m.rotation.y = ry;
    wellGroup.add(m);
  };
  wall(W, 0, -D / 2, 0); wall(W, 0, D / 2, 0);
  wall(D, -W / 2, 0, Math.PI / 2); wall(D, W / 2, 0, Math.PI / 2);

  // spigoli del pozzo
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
    new THREE.LineBasicMaterial({ color: 0x3b5583, transparent: true, opacity: .8 })
  );
  edges.position.y = H / 2;
  wellGroup.add(edges);

  // bordo superiore più luminoso
  const r = [-W/2,H,-D/2, W/2,H,-D/2,  W/2,H,-D/2, W/2,H,D/2,  W/2,H,D/2, -W/2,H,D/2,  -W/2,H,D/2, -W/2,H,-D/2];
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(r, 3));
  wellGroup.add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0x6ea8ff, transparent: true, opacity: .9 })));

  scene.add(wellGroup);
}

function resetCamera() {
  camera.position.set(W * 1.9, H * 1.02, D * 2.55);
  controls.target.set(0, H * .42, 0);
  controls.update();
}

function rebuildLocked() {
  lockedGroup.clear();
  for (let y = 0; y < H; y++)
    for (let z = 0; z < D; z++)
      for (let x = 0; x < W; x++) {
        const v = grid[idx(x, y, z)];
        if (!v) continue;
        const p = pid[idx(x, y, z)];
        let mask = 0;
        if (p) DIRS6.forEach((d, i) => {
          const X = x + d[0], Y = y + d[1], Z = z + d[2];
          if (X >= 0 && X < W && Y >= 0 && Y < H && Z >= 0 && Z < D && pid[idx(X, Y, Z)] === p) mask |= 1 << i;
        });
        const m = new THREE.Mesh(gameGeo(mask), mats[TYPES[v - 1]]);
        m.position.set(...cellToWorld(x, y, z));
        m.castShadow = m.receiveShadow = true;
        m.userData = { x, y, z };
        lockedGroup.add(m);
      }
}

/* ============================== regole ============================== */

function collides(cells, x, y, z) {
  for (const c of cells) {
    const X = x + c[0], Y = y + c[1], Z = z + c[2];
    if (X < 0 || X >= W || Z < 0 || Z >= D || Y < 0 || Y >= H + 3) return true;
    if (Y < H && grid[idx(X, Y, Z)]) return true;
  }
  return false;
}

function refill() {
  while (queue.length < 5) {
    if (!bag.length) {
      bag = TYPES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    queue.push(bag.pop());
  }
}

function fillActive() {
  activeGroup.clear();
  const set = new Set(cur.cells.map(c => c.join(',')));
  for (const c of cur.cells) {
    const m = new THREE.Mesh(gameGeo(maskOf(set, c)), activeMats[cur.type]);
    m.position.set(...c);
    m.castShadow = true;
    activeGroup.add(m);
  }
}
function buildActive() {
  fillActive();
  activeGroup.position.set(...cellToWorld(cur.x, cur.y, cur.z));
}

// dopo una rotazione cambiano le facce di contatto: si rifanno i cubetti
function updateActiveOffsets() { fillActive(); }

function refreshGhost() {
  ghostGroup.clear();
  footGroup.clear();
  if (!cur) return;
  let gy = cur.y;
  while (!collides(cur.cells, cur.x, gy - 1, cur.z)) gy--;
  const seen = new Set();
  for (const c of cur.cells) {
    const gx = cur.x + c[0], gz = cur.z + c[2];
    const k = gx + ',' + gz;
    if (!seen.has(k)) {
      seen.add(k);
      const p = new THREE.Mesh(footGeo, footMats[cur.type]);
      p.rotation.x = -Math.PI / 2;
      const [wx, , wz] = cellToWorld(gx, 0, gz);
      p.position.set(wx, .02, wz);
      footGroup.add(p);
    }
    if (gy < cur.y) {
      const pos = cellToWorld(gx, gy + c[1], gz);
      const mask = maskOf(cur.cells, c);
      const m = new THREE.Mesh(gameGeo(mask), ghostMats[cur.type]);
      m.position.set(...pos);
      ghostGroup.add(m);
      const e = new THREE.LineSegments(ghostEdges(mask), ghostEdgeMats[cur.type]);
      e.position.set(...pos);
      ghostGroup.add(e);
    }
  }
}

function spawn(type) {
  refill();
  const t = type || queue.shift();
  refill();
  cur = { type: t, cells: SHAPES[t].map(c => c.slice()), x: Math.floor(W / 2), y: H - 1, z: Math.floor(D / 2) };
  for (let tries = 0; tries < 3 && collides(cur.cells, cur.x, cur.y, cur.z); tries++) cur.y++;
  if (collides(cur.cells, cur.x, cur.y, cur.z)) { gameOver(); return; }
  fallAcc = lockTimer = lockResets = 0;
  buildActive();
  refreshGhost();
  drawPreviews();
}

function grounded() { return cur && collides(cur.cells, cur.x, cur.y - 1, cur.z); }

function afterShift() {
  if (grounded() && lockResets < MAX_RESETS) { lockTimer = 0; lockResets++; }
}

function tryMove(dx, dy, dz) {
  if (state !== 'playing' || !cur) return false;
  if (collides(cur.cells, cur.x + dx, cur.y + dy, cur.z + dz)) return false;
  cur.x += dx; cur.y += dy; cur.z += dz;
  if (dy === 0) afterShift();
  refreshGhost();
  return true;
}

function rotCell(c, axis, dir) {
  let [x, y, z] = c;
  if (axis === 'y') [x, z] = dir > 0 ? [z, -x] : [-z, x];
  else if (axis === 'x') [y, z] = dir > 0 ? [-z, y] : [z, -y];
  else [x, y] = dir > 0 ? [-y, x] : [y, -x];
  return [x, y, z];
}

// confronto fra due insiemi di celle a meno di traslazione: serve a capire
// se una rotazione lascia il pezzo esattamente dove è (rotazione di simmetria)
function sameShape(a, b) {
  if (a.length !== b.length) return false;
  const key = cells => {
    const m = [0, 1, 2].map(i => Math.min(...cells.map(c => c[i])));
    return cells.map(c => [c[0] - m[0], c[1] - m[1], c[2] - m[2]].join(','))
      .sort().join('|');
  };
  return key(a) === key(b);
}

function tryRotate(axis, dir) {
  if (state !== 'playing' || !cur) return;
  const nc = cur.cells.map(c => rotCell(c, axis, dir));
  // rotazione di simmetria (es. quadrato attorno al proprio asse verticale):
  // il pezzo occupa già quelle celle → nessuno spostamento, solo il suono.
  if (sameShape(cur.cells, nc)) { sfx.rotate(); return; }
  for (const k of KICKS) {
    if (!collides(nc, cur.x + k[0], cur.y + k[1], cur.z + k[2])) {
      cur.cells = nc;
      cur.x += k[0]; cur.y += k[1]; cur.z += k[2];
      updateActiveOffsets();
      afterShift();
      refreshGhost();
      sfx.rotate();
      return;
    }
  }
}

function hardDrop() {
  if (state !== 'playing' || !cur) return;
  let d = 0;
  while (!collides(cur.cells, cur.x, cur.y - 1, cur.z)) { cur.y--; d++; }
  score += d * 2;
  updateHud();
  activeGroup.position.set(...cellToWorld(cur.x, cur.y, cur.z));
  sfx.drop();
  lockPiece();
}

// un passo verso il basso; se il pezzo è già appoggiato, si ferma lì
function stepDown() {
  if (state !== 'playing' || !cur) return;
  if (tryMove(0, -1, 0)) { score++; updateHud(); sfx.move(); }
  else lockPiece();
}

function doHold() {
  if (state !== 'playing' || !cur || holdUsed) return;
  const t = cur.type;
  if (holdType) { const h = holdType; holdType = t; spawn(h); }
  else { holdType = t; spawn(); }
  holdUsed = true;
  sfx.rotate();
  drawPreviews();
}

function lockPiece() {
  let topOut = false;
  pieceSeq++;
  for (const c of cur.cells) {
    const X = cur.x + c[0], Y = cur.y + c[1], Z = cur.z + c[2];
    if (Y >= H) { topOut = true; continue; }
    grid[idx(X, Y, Z)] = TYPES.indexOf(cur.type) + 1;
    pid[idx(X, Y, Z)] = pieceSeq;
  }
  cur = null;
  activeGroup.clear(); ghostGroup.clear(); footGroup.clear();
  holdUsed = false;
  rebuildLocked();
  sfx.lock();
  if (topOut) { gameOver(); return; }
  const full = [];
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (grid[idx(x, y, z)]) n++;
    if (n === W * D) full.push(y);
  }
  if (full.length) startClear(full);
  else spawn();
}

function startClear(layers) {
  clearing = { layers, t: 0, meshes: lockedGroup.children.filter(m => layers.includes(m.userData.y)) };
  for (const m of clearing.meshes) m.material = flashMat;
  setState('clearing');
}

function updateClear(dt) {
  clearing.t += dt / 380;
  const t = Math.min(1, clearing.t);
  const s = Math.max(.001, 1 - t * t);
  for (const m of clearing.meshes) { m.scale.setScalar(s); m.rotation.y = t * 1.5; }
  if (t >= 1) finishClear();
}

function finishClear() {
  const n = clearing.layers.length;
  const ls = new Set(clearing.layers);
  const ng = new Uint8Array(W * D * H), np = new Int32Array(W * D * H);
  let ny = 0;
  for (let y = 0; y < H; y++) {
    if (ls.has(y)) continue;
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      ng[idx(x, ny, z)] = grid[idx(x, y, z)];
      np[idx(x, ny, z)] = pid[idx(x, y, z)];
    }
    ny++;
  }
  grid = ng; pid = np;
  rebuildLocked();
  lines += n;
  level = 1 + Math.floor(lines / 10);
  const base = [0, 100, 300, 500, 800][Math.min(n, 4)] + (n > 4 ? (n - 4) * 200 : 0);
  const pts = base * level;
  score += pts;
  popup(n, pts);
  sfx.clear(n);
  updateHud();
  clearing = null;
  setState('playing');
  spawn();
}

function popup(n, pts) {
  const label = ['', 'Strato', 'Doppio', 'Triplo', 'Quad'][Math.min(n, 4)] || 'Oltre';
  const el = document.createElement('div');
  el.className = 'popup';
  el.innerHTML = `<small>${label}</small>+${pts}`;
  popups.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// Discesa automatica: l'intervallo si accorcia col livello; il cursore Velocità
// lo moltiplica (×0,5 … ×2), quindi la crescita col livello resta la stessa.
// Discesa guidata: il pezzo resta fermo finché non lo si fa scendere.
const gravMs = () => Math.max(45, Math.round(820 * Math.pow(.82, level - 1) / velocita));

function stepPlay(dt) {
  if (!cur) return;
  const fermo = modo === 'guidata' && !softDrop;
  if (grounded()) {
    fallAcc = 0;
    if (fermo) { lockTimer = 0; return; }
    lockTimer += dt;
    if (lockTimer >= LOCK_DELAY) lockPiece();
    return;
  }
  lockTimer = 0;
  if (fermo) { fallAcc = 0; return; }
  fallAcc += dt;
  const iv = softDrop ? 40 : gravMs();
  while (fallAcc >= iv) {
    fallAcc -= iv;
    if (!collides(cur.cells, cur.x, cur.y - 1, cur.z)) {
      cur.y--;
      if (softDrop) { score++; updateHud(); }
      refreshGhost();
    } else break;
  }
}

/* ============================== anteprime 2D ============================== */

function setupCanvas(cv, w, h) {
  const dpr = Math.min(devicePixelRatio, 2);
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
const nextCtx = setupCanvas(nextCv, 132, 264);
const holdCtx = setupCanvas(holdCv, 132, 104);

function shade(hex, f) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const m = v => Math.round(Math.max(0, Math.min(255, f > 0 ? v + (255 - v) * f : v * (1 + f))));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

function drawIso(ctx, cells, color, ox, oy, s) {
  const mx = Math.min(...cells.map(c => c[0]));
  const my = Math.min(...cells.map(c => c[1]));
  const mz = Math.min(...cells.map(c => c[2]));
  const cs = cells.map(c => [c[0] - mx, c[1] - my, c[2] - mz])
    .sort((a, b) => (a[0] + a[2]) - (b[0] + b[2]) || a[1] - b[1]);
  const hx = s * .866, hy = s * .5, vv = s * .95;
  const P = (x, y, z) => [(x - z) * hx, (x + z) * hy - y * vv];
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const c of cs) {
    const [px, py] = P(...c);
    minX = Math.min(minX, px - hx); maxX = Math.max(maxX, px + hx);
    minY = Math.min(minY, py - hy); maxY = Math.max(maxY, py + hy + vv);
  }
  const cx = ox - (minX + maxX) / 2, cy = oy - (minY + maxY) / 2;
  const top = shade(color, .3), right = shade(color, 0), left = shade(color, -.32);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(5,8,14,.55)';
  for (const [x, y, z] of cs) {
    const [px0, py0] = P(x, y, z);
    const px = px0 + cx, py = py0 + cy;
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(px - hx, py); ctx.lineTo(px, py + hy);
    ctx.lineTo(px, py + hy + vv); ctx.lineTo(px - hx, py + vv);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(px + hx, py); ctx.lineTo(px, py + hy);
    ctx.lineTo(px, py + hy + vv); ctx.lineTo(px + hx, py + vv);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(px, py - hy); ctx.lineTo(px + hx, py);
    ctx.lineTo(px, py + hy); ctx.lineTo(px - hx, py);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

function drawPreviews() {
  nextCtx.clearRect(0, 0, 132, 264);
  for (let i = 0; i < 3; i++) {
    const t = queue[i];
    if (t) drawIso(nextCtx, SHAPES[t], COLORS[t], 66, 46 + i * 88, i === 0 ? 15 : 12);
  }
  holdCtx.clearRect(0, 0, 132, 104);
  if (holdType) drawIso(holdCtx, SHAPES[holdType], COLORS[holdType], 66, 52, 13);
  else {
    holdCtx.fillStyle = 'rgba(143,161,189,.5)';
    holdCtx.font = '13px "Space Grotesk", sans-serif';
    holdCtx.textAlign = 'center';
    holdCtx.fillText('vuota', 66, 56);
  }
}

/* ============================== input ============================== */

function camDirs() {
  const f = new THREE.Vector3();
  camera.getWorldDirection(f);
  f.y = 0;
  let fx = 0, fz = 0;
  if (Math.abs(f.x) >= Math.abs(f.z)) fx = Math.sign(f.x) || 1;
  else fz = Math.sign(f.z) || 1;
  return { f: [fx, fz], r: [-fz, fx] };
}
function dirFor(code) {
  const { f, r } = camDirs();
  if (code === 'ArrowUp') return f;
  if (code === 'ArrowDown') return [-f[0], -f[1]];
  if (code === 'ArrowRight') return r;
  return [-r[0], -r[1]];
}

function dasUpdate(dt) {
  for (const k in das) {
    const d = das[k];
    d.t += dt;
    if (d.t > DAS) {
      d.rep += dt;
      while (d.rep > ARR) { d.rep -= ARR; tryMove(d.dx, 0, d.dz); }
    }
  }
}
function clearDas() { for (const k in das) delete das[k]; }

addEventListener('keydown', e => {
  unlockAudio();
  const c = e.code;
  if (document.body.dataset.mode === 'lab') { if (c === 'Escape') window.__lab.exit(); return; }
  if (e.repeat) {
    if (['Space', 'KeyC', 'KeyQ', 'KeyE', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(c)) e.preventDefault();
    return;
  }
  if (state === 'menu' && (c === 'Enter' || c === 'Space')) { e.preventDefault(); startGame(); return; }
  if (state === 'over' && (c === 'Enter' || c === 'Space' || c === 'KeyR')) { startGame(); return; }
  if (c === 'KeyM') { toggleMute(); return; }
  if (c === 'KeyP' || c === 'Escape') { togglePause(); return; }
  if (c === 'KeyR') { if (state !== 'menu') startGame(); return; }
  if (state !== 'playing') return;
  switch (c) {
    case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': case 'ArrowDown': {
      e.preventDefault();
      const d = dirFor(c);
      if (tryMove(d[0], 0, d[1])) sfx.move();
      das[c] = { dx: d[0], dz: d[1], t: 0, rep: 0 };
      break;
    }
    case 'KeyQ': tryRotate('y', 1); break;
    case 'KeyE': tryRotate('y', -1); break;
    case 'KeyW': tryRotate('x', 1); break;
    case 'KeyS': tryRotate('x', -1); break;
    case 'KeyA': tryRotate('z', 1); break;
    case 'KeyD': tryRotate('z', -1); break;
    case 'Space': e.preventDefault(); hardDrop(); break;
    case 'ShiftLeft': case 'ShiftRight': softDrop = true; break;
    case 'KeyC': doHold(); break;
  }
});
addEventListener('keyup', e => {
  delete das[e.code];
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') softDrop = false;
});
addEventListener('blur', () => { if (state === 'playing') togglePause(); clearDas(); softDrop = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') togglePause(); });

/* controlli touch */
const TOUCH_DIRS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
document.querySelectorAll('#touch button, #rotPad button').forEach(b => {
  const act = b.dataset.act;
  let iv = null, to = null;
  const fire = () => {
    unlockAudio();
    if (act === 'drop') hardDrop();
    else if (act === 'step') stepDown();
    else if (act === 'hold') doHold();
    else if (act.startsWith('rot')) tryRotate(act[3].toLowerCase(), act[4] === '+' ? 1 : -1);
    else {
      const d = dirFor(TOUCH_DIRS[act]);
      if (tryMove(d[0], 0, d[1])) sfx.move();
    }
  };
  b.addEventListener('pointerdown', e => {
    e.preventDefault();
    fire();
    if (TOUCH_DIRS[act] || act === 'step') to = setTimeout(() => { iv = setInterval(fire, 110); }, 220);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
    b.addEventListener(ev, () => { clearTimeout(to); clearInterval(iv); iv = null; }));
});

/* ============================== flusso ============================== */

function togglePause() {
  if (state === 'playing') {
    setState('paused');
    pauseOv.hidden = false;
    clearDas();
    softDrop = false;
  } else if (state === 'paused') {
    setState('playing');
    pauseOv.hidden = true;
  }
}

function startGame() {
  const sz = SIZES[selectedSize] || SIZES.classic;
  W = sz.W; D = sz.D; H = sz.H;
  grid = new Uint8Array(W * D * H);
  pid = new Int32Array(W * D * H); pieceSeq = 0;
  best = +(localStorage.getItem(recordKey()) || 0);
  score = 0; lines = 0; level = 1;
  holdType = null; holdUsed = false;
  queue = []; bag = []; cur = null; clearing = null;
  fallAcc = lockTimer = lockResets = 0;
  clearDas();
  lockedGroup.clear(); activeGroup.clear(); ghostGroup.clear(); footGroup.clear();
  buildWell();
  resetCamera();
  orbitOn = false;
  paintOrbit();
  startOv.hidden = overOv.hidden = pauseOv.hidden = true;
  setState('playing');
  updateHud();
  spawn();
}

function gameOver() {
  cur = null;
  activeGroup.clear(); ghostGroup.clear(); footGroup.clear();
  setState('over');
  orbitOn = !reducedMotion;
  paintOrbit();
  const record = score > best;
  if (record) { best = score; localStorage.setItem(recordKey(), best); }
  $('newRecord').hidden = !record;
  $('finalScore').textContent = score;
  $('finalLines').textContent = lines;
  $('finalLevel').textContent = level;
  $('finalBest').textContent = best;
  overOv.hidden = false;
  updateHud();
  sfx.over();
}

/* pulsanti */
$('btnPlay').addEventListener('click', () => { unlockAudio(); startGame(); });
$('btnAgain').addEventListener('click', () => { unlockAudio(); startGame(); });
$('btnPause').addEventListener('click', togglePause);
$('btnMute').addEventListener('click', toggleMute);
$('btnCam').addEventListener('click', resetView);
$('btnRestart').addEventListener('click', () => { unlockAudio(); startGame(); });
pauseOv.addEventListener('click', () => { if (state === 'paused') togglePause(); });
renderer.domElement.addEventListener('dblclick', resetView);
function resetView() {
  if (document.body.dataset.mode === 'lab' && window.__lab) window.__lab.resetCamera();
  else resetCamera();
}

document.querySelectorAll('.sizebtn[data-size]').forEach(b => {
  if (b.dataset.size === selectedSize) {
    document.querySelectorAll('.sizebtn[data-size]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }
  b.addEventListener('click', () => {
    selectedSize = b.dataset.size;
    localStorage.setItem('orfini_tetracubi_pozzo', selectedSize);
    document.querySelectorAll('.sizebtn[data-size]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const sz = SIZES[selectedSize];
    W = sz.W; D = sz.D; H = sz.H;
    grid = new Uint8Array(W * D * H);
    pid = new Int32Array(W * D * H);
    buildWell();
    resetCamera();
    seedMenuStack();
  });
});

/* discesa: automatica (con cursore della velocità) o guidata */
const speedEl = $('speed'), speedVal = $('speedVal');
function paintModo() {
  document.body.dataset.discesa = modo;
  document.querySelectorAll('.modebtn').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.modo === modo)));
  speedEl.value = Math.round(velocita * 100);
  speedVal.textContent = '×' + velocita.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  bestEl.textContent = Math.max(best, score);
}
function setModo(m) {
  modo = m === 'guidata' ? 'guidata' : 'auto';
  localStorage.setItem('orfini_tetracubi_modo', modo);
  best = +(localStorage.getItem(recordKey()) || 0);
  paintModo();
}
function setVelocita(v) {
  velocita = Math.min(2, Math.max(.5, v));
  localStorage.setItem('orfini_tetracubi_velocita', String(velocita));
  paintModo();
}
document.querySelectorAll('.modebtn').forEach(b => b.addEventListener('click', () => setModo(b.dataset.modo)));
speedEl.addEventListener('input', () => setVelocita(speedEl.value / 100));
// dopo il trascinamento il cursore lascia le frecce al gioco
speedEl.addEventListener('change', () => speedEl.blur());
speedEl.addEventListener('pointerup', () => speedEl.blur());
paintModo();

/* pila decorativa dietro il menu */
function seedMenuStack() {
  lockedGroup.clear();
  for (let y = 0; y < 2; y++)
    for (let z = 0; z < D; z++)
      for (let x = 0; x < W; x++)
        if (Math.random() < (y === 0 ? .55 : .25))
          grid[idx(x, y, z)] = 1 + Math.floor(Math.random() * 7);
  rebuildLocked();
}

/* ============================== avvio ============================== */

buildWell();
resetCamera();
seedMenuStack();
updateHud();
drawPreviews();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* hook di debug/test (console) */
window.__t3 = {
  start: startGame, drop: hardDrop, move: tryMove, rot: tryRotate, hold: doHold, spawn,
  set: (x, y, z, v) => { grid[idx(x, y, z)] = v; rebuildLocked(); },
  get state() { return state; }, get score() { return score; },
  get lines() { return lines; }, get cur() { return cur; },
  setModo, setVelocita, gravMs, stepDown,
  get modo() { return modo; }, get velocita() { return velocita; },
};
if (location.hash === '#play') startGame();

const _v = new THREE.Vector3();
let last = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(250, now - last);
  last = now;
  tickOrbit(dt);
  controls.update();
  if (window.__lab && window.__lab.active) window.__lab.update(dt);
  if (state === 'playing') { dasUpdate(dt); stepPlay(dt); }
  else if (state === 'clearing') updateClear(dt);
  if (cur) {
    _v.set(...cellToWorld(cur.x, cur.y, cur.z));
    activeGroup.position.lerp(_v, 1 - Math.exp(-dt / 40));
  }
  composer.render();
}
requestAnimationFrame(animate);

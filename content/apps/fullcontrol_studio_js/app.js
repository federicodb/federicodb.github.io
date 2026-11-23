// SPDX-License-Identifier: GPL-3.0-only — FullControl Studio, Orfini Math Lab (vedi LICENZA.txt)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { PRINTER_PRESETS } from './catalog.js';
import {
  HOTEND_PROFILES,
  EXTRUSION_MODES,
  VERTICAL_PROFILES,
  NONPLANAR_MODES,
  OBJECT_BLUEPRINTS,
  SHAPE_INFO,
  SHAPE_FAMILIES,
  createSceneObject,
  compileSceneToPython,
} from './wysiwyg_engine.js';
import { buildBambu3mf, loadManifest } from './export_3mf.js';

/* ======================================================================
 * Stato
 * ==================================================================== */
// Valori di ripiego; quelli veri arrivano dal manifest dei template (profili ufficiali Bambu per
// stampante e materiale). Gli intervalli restano vicini alle temperature con cui i template sono
// stati verificati: l'avvio ufficiale ha rami che dipendono dalla temperatura.
// firstBoost: gradi in più sul primo layer. bedBoost: gradi in più sul piatto, per stampante.
// PLA Matte: base ufficiale Bambu (220 °C; piatto Textured 65 °C su A1/A1 mini, 55 °C su P2S) con +5 °C
// al primo layer (le cariche opacizzanti rendono il fuso più viscoso: schiacciamento e presa migliori) e
// +5 °C di piatto sulla P2S, dove il profilo ufficiale è il più basso. Ventola come il profilo: 80% A1, 100% P2S.
const MATERIALS = {
  PLA: { label: 'PLA', nozzle: 220, bed: 65, maxSpeed: 200, fan: { a1_mini: 80, a1: 80, p2s: 100 }, firstBoost: 0, bedBoost: {}, range: [190, 240] },
  PLA_MATTE: { label: 'PLA Matte', nozzle: 220, bed: 65, maxSpeed: 200, fan: { a1_mini: 80, a1: 80, p2s: 100 }, firstBoost: 5, bedBoost: { p2s: 5 }, range: [195, 240] },
  PETG: { label: 'PETG', nozzle: 255, bed: 70, maxSpeed: 120, fan: { a1_mini: 50, a1: 50, p2s: 50 }, firstBoost: 0, bedBoost: {}, range: [230, 270] },
  TPU: { label: 'TPU', nozzle: 230, bed: 35, maxSpeed: 25, fan: { a1_mini: 100, a1: 100, p2s: 100 }, firstBoost: 0, bedBoost: {}, range: [210, 245] },
};
let bambuManifest = null;
loadManifest().then((m) => { bambuManifest = m; applyMaterialDefaults(); }).catch(() => { /* export 3MF segnalerà l'errore */ });


let sceneObjects = [];
let selectedObjectId = null;
let drawMode = false;
let material = 'PLA_MATTE';
let fullApiCatalog = null;
let lastResult = null;        // ultimo risultato (anteprima o completo)
let lastFull = null;          // ultimo risultato con G-code
let geo = null;               // percorsi in array tipizzati (vedi packResult in py_worker.js)
let geoPreview = false;       // true durante un trascinamento: si disegnano linee leggere, il cordone 3D al rilascio
let currentZMaxGlobal = 50;
let varyUndo = null;          // { id, params } per annullare "Varia"

const amsState = {};
for (const id of Object.keys(PRINTER_PRESETS)) {
  amsState[id] = { activeSlot: 1, colors: [...PRINTER_PRESETS[id].defaultAmsColors] };
}

const $ = (id) => document.getElementById(id);
const el = {
  preset: $('printer-preset'),
  objectTitle: $('object-title'),
  printStatus: $('print-status'),
  engineStatus: $('engine-status'),
  btnHelp: $('btn-help'),
  helpDialog: $('help-dialog'),
  btnExportGcode: $('btn-export-gcode'),
  btnExport3mf: $('btn-export-3mf'),
  objectList: $('scene-objects-list'),
  btnOpenShapes: $('btn-open-shapes'),
  shapeDialog: $('shape-dialog'),
  shapeGallery: $('shape-gallery'),
  shapeDescription: $('shape-description'),
  inspector: $('object-inspector-body'),
  btnVary: $('btn-vary'),
  btnUndoVary: $('btn-undo-vary'),
  colorMode: $('color-mode-select'),
  renderStyle: $('render-style-select'),
  camIso: $('btn-cam-iso'),
  camTop: $('btn-cam-top'),
  camFront: $('btn-cam-front'),
  scrub: $('scrub-slider'),
  scrubVal: $('scrub-val'),
  clip: $('clip-slider'),
  clipVal: $('clip-val'),
  toggleCone: $('toggle-hotend-cone'),
  toggleGizmo: $('toggle-gizmo'),
  toggleTravel: $('toggle-travel'),
  drawHint: $('draw-hint'),
  busy: $('busy'),
  drawer: $('drawer'),
  drawerToggle: $('btn-drawer-toggle'),
  consoleCount: $('console-count'),
  syncToggle: $('toggle-sync-wysiwyg'),
  btnCheck: $('btn-check-steps'),
  btnRun: $('btn-run'),
  btnExportPy: $('btn-export-py'),
  code: $('code-editor'),
  gcodePreview: $('gcode-preview'),
  console: $('console-output'),
  catalogSearch: $('catalog-search'),
  catalogTree: $('catalog-tree'),
  apiCount: $('api-count-badge'),
  checkFinding: $('check-finding'),
  checks: $('checks'),
  stats: $('stats'),
  nozzle: $('nozzle-temp'),
  bed: $('bed-temp'),
  speed: $('print-speed'),
  auxFanWrap: $('aux-fan-wrap'),
  auxFan: $('aux-fan'),
  amsTitle: $('ams-badge-title'),
  primer: $('primer-select'),
  clampToggle: $('toggle-hotend-clamp'),
  firstH: $('first-layer-h'),
  firstSpeed: $('first-layer-speed'),
  firstNozzle: $('first-layer-nozzle'),
};

const preset = () => PRINTER_PRESETS[el.preset.value];
const hotend = () => HOTEND_PROFILES[el.preset.value] || HOTEND_PROFILES.a1;
const fmt = (n, dec = 0) => Number(n || 0).toLocaleString('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const stripIndex = (s) => String(s).replace(/^\d+\.\s*/, '');
// "Altezza Totale (mm)" → "Altezza totale": via numerazione e parentesi tecniche, maiuscole all'italiana
// (restano maiuscole le sigle come XY, Z, AMS).
// Ultimo passaggio: le parole inglesi rimaste nelle etichette diventano italiane (solo il testo mostrato).
const ITALIANO = [
  [/non-planar/g, 'non planar'], [/\bbézier\b/g, 'Bézier'],
  [/^Layer fondo piatto sotto onda$/, "Strati piatti sotto l'onda"], [/^Layer fondo stagno$/, 'Strati del fondo'],
  [/^Layer fondo\b/, 'Strati del fondo'], [/^Altezza layer$/, 'Altezza dello strato'],
  [/^Passo Z layer$/, 'Passo in Z per strato'], [/^Rotazione riempimento per layer$/, 'Rotazione del riempimento a ogni strato'],
  [/^Numero layer$/, 'Numero di strati'],
  [/^Poligono \/ vaso \/ sweep universale$/, 'Poligono, vaso o traiettoria'], [/^Raggio sweep traiettoria Z$/, 'Raggio della traiettoria'],
  [/^Spire sweep lungo Z$/, 'Spire della traiettoria lungo Z'], [/\bsweep\b/g, 'traiettoria'],
  [/^Scala raggio top$/, 'Scala del raggio in cima'], [/^Scala top$/, 'Scala in cima'],
  [/texture increspata/, 'superficie increspata'], [/ riempimento lab convex$/, ''],
];
const tidy = (s) => {
  const t = stripIndex(s).replace(/\s*\([^)]*\)/g, '').replace(/\s*&\s*/g, ' e ').trim();
  const u = t.charAt(0) + t.slice(1).replace(/\b([A-ZÀ-Ý])([a-zà-ÿ]+)/g, (m, a, b) => a.toLowerCase() + b);
  return ITALIANO.reduce((x, [re, to]) => x.replace(re, to), u);
};
const SHORT = {
  amphora: 'ad anfora', bulb: 'a bulbo', hourglass: 'a clessidra', bamboo: 'a bambù', chalice: 'a calice',
  sine_wave: 'sinusoidale', saddle: 'a sella', arch_bridge: 'ad arco', dome: 'a cupola', crater: 'a cratere', tilted: 'inclinata', tri_wave: 'triangolare',
  wave_weave: 'intrecciata', knurl_tri: 'zigrinata', rib_square: 'a greca', variable_width: 'a larghezza variabile', ams_bands: 'a fasce di colore',
};

/* ======================================================================
 * Motore Python nel worker (la UI non si blocca mai)
 * ==================================================================== */
const worker = new Worker(new URL('./py_worker.js', import.meta.url));
let msgId = 0;
const pending = new Map();
let engineReady = false;

worker.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'progress') {
    el.engineStatus.textContent = m.text;
    return;
  }
  const p = pending.get(m.id);
  if (!p) return;
  pending.delete(m.id);
  if (m.ok) p.resolve(m.result);
  else p.reject(new Error(m.error));
};

function engine(type, payload) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, type, payload });
  });
}

// Esecuzioni: ne gira una alla volta e vince l'ultima richiesta. Durante un trascinamento si
// calcola solo l'anteprima; al rilascio parte il calcolo completo con G-code.
let running = false;
let queued = null; // { preview }
let debounce = null;

function requestRun({ preview = false, delay = 60 } = {}) {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    queued = queued ? { preview: queued.preview && preview } : { preview };
    pump();
  }, delay);
}

async function pump() {
  if (running || !queued || !engineReady) return;
  const job = queued;
  queued = null;
  running = true;
  el.busy.hidden = false;
  setStatus('busy');
  try {
    const result = await engine('run', { code: el.code.value, opts: runOptions(job.preview) });
    applyResult(result, job.preview);
  } catch (err) {
    showError(err);
  } finally {
    running = false;
    el.busy.hidden = !queued;
    if (queued) pump();
  }
}

function runOptions(preview) {
  const p = preset();
  const st = amsState[p.id];
  return {
    preview_only: preview,
    fc_printer: p.fcPrinter,
    bed_x: p.bedX,
    bed_y: p.bedY,
    bed_z: p.bedZ,
    ams_colors: st.colors,
    active_slot: st.activeSlot,
    material,
    init_data: {
      nozzle_temp: Number(el.firstNozzle.value), // primo layer; il codice generato passa a quella normale dal 2°
      bed_temp: Number(el.bed.value),
      print_speed: Math.round(Number(el.speed.value) * 60),
      travel_speed: p.defaultTravel,
      fan_percent: materialSpec().fanPercent,
      aux_fan_percent: Number(el.auxFan.value),
      ams_slot: st.activeSlot,
      primer: el.primer.value,
    },
  };
}

function syncCodeAndRun(preview = false) {
  if (el.syncToggle.checked) {
    el.code.value = compileSceneToPython(sceneObjects, el.preset.value, el.clampToggle.checked, printSettings());
  }
  requestRun({ preview, delay: preview ? 40 : 10 });
}

async function initEngine() {
  try {
    await engine('init');
    engineReady = true;
    el.engineStatus.textContent = 'Python pronto';
    el.btnRun.disabled = false;
    el.btnCheck.disabled = false;
    syncCodeAndRun(false);
  } catch (err) {
    el.engineStatus.textContent = 'Python non avviato';
    el.engineStatus.classList.add('error');
    showError(err);
  }
}

/* ======================================================================
 * Three.js — rendering su richiesta (0% di CPU a riposo)
 * ==================================================================== */
const wrap = $('three-canvas-wrap');
const scene = new THREE.Scene();

/* Tema chiaro / scuro AMOLED (nero puro), condiviso con tutto il sito nella chiave orfini_theme: scuro di partenza. */
const root = document.documentElement;
const btnTheme = document.getElementById('btn-theme');
const THEME_LABEL = { light: 'Tema chiaro: passa allo scuro', dark: 'Tema scuro: passa al chiaro' };
const readPref = () => { try { return localStorage.getItem('orfini_theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
const isDark = () => root.dataset.theme !== 'light';
const sceneColors = () => (isDark()
  ? { bg: 0x000000, plate: 0x121212, grid1: 0x363636, grid2: 0x222222, box: 0x3d3d3d, travel: 0x9a9a9a, shroud: 0x9a9a9a, selected: 0xffffff, cone: 0xb8924f, point: 0x46a9c2 }
  : { bg: 0xeceeed, plate: 0xd8dcda, grid1: 0xb4bab7, grid2: 0xc7ccc9, box: 0xa3a9a6, travel: 0x5b5f5d, shroud: 0x5b5f5d, selected: 0x131416, cone: 0x8c6a2f, point: 0x1b6c80 });
scene.background = new THREE.Color(sceneColors().bg);

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 3500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
renderer.localClippingEnabled = true;
wrap.appendChild(renderer.domElement);

const clipPlaneZ = new THREE.Plane(new THREE.Vector3(0, -1, 0), 500);
let renderRequested = false;
function requestRender() {
  if (renderRequested) return;
  renderRequested = true;
  requestAnimationFrame(() => {
    renderRequested = false;
    renderer.render(scene, camera);
  });
}

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.addEventListener('change', requestRender);

scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa09d, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(220, 420, 200);
const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-200, 180, -180);
scene.add(key, fill);

const bedGroup = new THREE.Group();
const pathGroup = new THREE.Group();
const handlesGroup = new THREE.Group();
const hotendGroup = new THREE.Group();
scene.add(bedGroup, pathGroup, handlesGroup, hotendGroup);

const gizmoAnchor = new THREE.Object3D();
scene.add(gizmoAnchor);
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setSize(0.7);
transformControls.attach(gizmoAnchor);
const gizmoHelper = transformControls.getHelper ? transformControls.getHelper() : transformControls;
scene.add(gizmoHelper);

let isDraggingGizmo = false;
transformControls.addEventListener('change', requestRender);
transformControls.addEventListener('dragging-changed', (e) => {
  isDraggingGizmo = e.value;
  orbit.enabled = !e.value;
  if (!e.value) syncCodeAndRun(false); // rilascio: calcolo completo
  requestRender();
});
transformControls.addEventListener('objectChange', () => {
  const obj = getSelectedObject();
  if (!obj) return;
  const p = preset();
  obj.params.x = Math.max(5, Math.min(p.bedX - 5, Math.round(gizmoAnchor.position.x * 2) / 2));
  obj.params.y = Math.max(5, Math.min(p.bedY - 5, Math.round(-gizmoAnchor.position.z * 2) / 2));
  obj.params.z = Math.max(0.1, Math.min(p.bedZ - 2, Math.round(gizmoAnchor.position.y * 100) / 100));
  for (const axis of ['x', 'y', 'z']) {
    const inp = $(`insp-pos-${axis}`);
    if (inp) inp.value = obj.params[axis];
  }
  updateHandles3D();
  syncCodeAndRun(true);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let plateMesh = null;
let pointerDown = { x: 0, y: 0 };
renderer.domElement.addEventListener('pointerdown', (e) => { pointerDown = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (isDraggingGizmo) return;
  if (Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 5) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (drawMode && plateMesh) {
    const hits = raycaster.intersectObject(plateMesh, false);
    if (hits.length) {
      addDrawnPoint(Math.round(hits[0].point.x * 10) / 10, Math.round(-hits[0].point.z * 10) / 10);
      return;
    }
  }
  const handleHits = raycaster.intersectObjects(handlesGroup.children, true);
  const hitId = handleHits[0]?.object.userData?.objectId;
  if (hitId && hitId !== selectedObjectId) selectObject(hitId);
});

new ResizeObserver(() => {
  const w = wrap.clientWidth || 640;
  const h = wrap.clientHeight || 420;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  requestRender();
}).observe(wrap);

const toThree = (x, y, z) => new THREE.Vector3(x, z, -y);

function clearGroup(group) {
  for (const child of group.children) {
    child.geometry?.dispose();
    if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose());
  }
  group.clear();
}

function buildBed(resetView = true) {
  clearGroup(bedGroup);
  const { bedX, bedY, bedZ, excludeZone } = preset();
  plateMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(bedX, bedY),
    new THREE.MeshBasicMaterial({ color: sceneColors().plate, side: THREE.DoubleSide })
  );
  plateMesh.rotation.x = -Math.PI / 2;
  plateMesh.position.set(bedX / 2, -0.05, -bedY / 2);
  bedGroup.add(plateMesh);

  const grid = new THREE.GridHelper(bedX, Math.round(bedX / 10), sceneColors().grid1, sceneColors().grid2);
  grid.position.set(bedX / 2, 0, -bedY / 2);
  bedGroup.add(grid);

  if (excludeZone) {
    const ex = new THREE.Mesh(
      new THREE.PlaneGeometry(excludeZone.x, excludeZone.y),
      new THREE.MeshBasicMaterial({ color: 0xc4242a, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    ex.rotation.x = -Math.PI / 2;
    ex.position.set(excludeZone.x / 2, 0.05, -excludeZone.y / 2);
    bedGroup.add(ex);
  }

  const box = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(bedX, bedZ, bedY)),
    new THREE.LineBasicMaterial({ color: sceneColors().box, transparent: true, opacity: 0.7 })
  );
  box.position.set(bedX / 2, bedZ / 2, -bedY / 2);
  bedGroup.add(box);

  buildHotendCone();
  if (resetView) resetCamera('iso');
}

function buildHotendCone() {
  clearGroup(hotendGroup);
  const hp = hotend();
  const coneGeo = new THREE.ConeGeometry(hp.coneRadiusMm, hp.coneHeightMm, 20, 1, true);
  coneGeo.rotateX(Math.PI);
  coneGeo.translate(0, hp.coneHeightMm / 2, 0);
  hotendGroup.add(new THREE.Mesh(coneGeo, new THREE.MeshLambertMaterial({ color: sceneColors().cone, transparent: true, opacity: 0.75, side: THREE.DoubleSide })));
  const shroudGeo = new THREE.CylinderGeometry(hp.shroudRadiusMm, hp.shroudRadiusMm, 6, 24, 1, true);
  shroudGeo.translate(0, hp.tipHeightMm + 3, 0);
  hotendGroup.add(new THREE.Mesh(shroudGeo, new THREE.MeshBasicMaterial({ color: sceneColors().shroud, wireframe: true, transparent: true, opacity: 0.3 })));
  hotendGroup.visible = false;
}

function updateHandles3D() {
  clearGroup(handlesGroup);
  const colors = amsState[el.preset.value].colors;
  for (const obj of sceneObjects) {
    if (!obj.visible) continue;
    const isSel = obj.id === selectedObjectId;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(isSel ? 2.4 : 1.8, 14, 14),
      new THREE.MeshBasicMaterial({ color: isSel ? sceneColors().selected : new THREE.Color(colors[(obj.params.amsSlot || 1) - 1]) })
    );
    marker.position.copy(toThree(obj.params.x, obj.params.y, obj.params.z));
    marker.userData = { objectId: obj.id };
    handlesGroup.add(marker);
    if (obj.type === 'plate_drawn_path' && Array.isArray(obj.params.pointsRel)) {
      for (const pr of obj.params.pointsRel) {
        const v = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: sceneColors().point }));
        v.position.copy(toThree(obj.params.x + pr[0], obj.params.y + pr[1], obj.params.z + 0.4));
        v.userData = { objectId: obj.id };
        handlesGroup.add(v);
      }
    }
  }
  const sel = getSelectedObject();
  const show = Boolean(sel && sel.visible && el.toggleGizmo.checked);
  gizmoHelper.visible = show;
  transformControls.enabled = show;
  if (show && !isDraggingGizmo) gizmoAnchor.position.copy(toThree(sel.params.x, sel.params.y, sel.params.z));
  requestRender();
}

function resetCamera(mode = 'iso') {
  const p = preset();
  const cx = p.bedX / 2;
  const cy = p.bedY / 2;
  const zT = Math.max(10, Math.min(p.bedZ * 0.5, currentZMaxGlobal * 0.45));
  if (mode === 'top') {
    camera.position.set(cx, Math.max(170, p.bedX * 1.15), -cy + 0.01);
    orbit.target.set(cx, 0, -cy);
  } else if (mode === 'front') {
    camera.position.set(cx, zT + 14, -cy + p.bedY * 0.85);
    orbit.target.set(cx, zT, -cy);
  } else {
    camera.position.set(cx + p.bedX * 0.62, Math.max(110, zT * 2.2 + 70), -cy + p.bedY * 0.78);
    orbit.target.set(cx, zT * 0.8, -cy);
  }
  orbit.update();
  for (const [btn, m] of [[el.camIso, 'iso'], [el.camTop, 'top'], [el.camFront, 'front']]) btn.classList.toggle('active', m === mode);
  requestRender();
}

// Geometria del percorso: costruita una volta per risultato/stile/colore, scrivendo in buffer
// preallocati (nessun oggetto per punto). Lo slider "Avanzamento stampa" cambia solo il drawRange.
// Coordinate FullControl (x, y, z) → Three.js (x, z, -y).
let segEnds = null; // Uint32Array per percorso: [tube, line, travel, ultimoPunto]
let tubeMesh = null;
let lineMesh = null;
let travelMesh = null;

function buildPathGeometry() {
  clearGroup(pathGroup);
  tubeMesh = lineMesh = travelMesh = null;
  segEnds = null;
  if (!geo || geo.offsets.length < 2) {
    hotendGroup.visible = false;
    requestRender();
    return;
  }
  const { xyz, w, h, col, slope, alarm, offsets, on } = geo;
  const nPaths = offsets.length - 1;
  const style = el.renderStyle.value;
  const colorMode = el.colorMode.value;
  const hp = hotend();
  const maxSlope = hp.maxSlopeDeg;
  const fb = new THREE.Color(amsState[el.preset.value].colors[0]);
  const sel = getSelectedObject();
  const ocx = sel ? sel.params.x : preset().bedX / 2;
  const ocy = sel ? sel.params.y : preset().bedY / 2;
  currentZMaxGlobal = Math.max(1, geo.zMax);
  updateClipPlane();

  // conteggi per preallocare
  let extPts = 0, extSegs = 0, travSegs = 0;
  for (let i = 0; i < nPaths; i++) {
    const n = offsets[i + 1] - offsets[i];
    if (n < 2) continue;
    if (on[i]) { extPts += n; extSegs += n - 1; } else travSegs += n - 1;
  }
  const tube = style !== 'line' && !geoPreview; // livello di dettaglio: linee mentre si trascina
  const tPos = tube ? new Float32Array(extPts * 9) : null;
  const tCol = tube ? new Float32Array(extPts * 9) : null;
  const tIdx = tube ? new Uint32Array(extSegs * 12) : null;
  const lPos = tube ? null : new Float32Array(extSegs * 6);
  const lCol = tube ? null : new Float32Array(extSegs * 6);
  const vPos = new Float32Array(travSegs * 6);
  segEnds = new Uint32Array(nPaths * 4);

  const c = new THREE.Color();
  const pc = new Float32Array(3);
  let tv = 0, ti = 0, lv = 0, vv = 0;

  const colorAt = (k, nx, nyv, nz) => {
    const s = slope[k];
    if (alarm[k]) c.setHex(0xc4242a);
    else if (colorMode === 'normal') c.setRGB(0.5 + 0.48 * nx, 0.52 + 0.45 * nyv, 0.5 + 0.48 * nz);
    else if (colorMode === 'slope') c.setHSL(Math.max(0, 0.35 - Math.min(1.2, s / maxSlope) * 0.35), 0.75, 0.45);
    else if (s > maxSlope + 0.3) c.setHex(0xc4242a);
    else if (colorMode === 'ams_normal') {
      if (col[3 * k] >= 0) c.setRGB(col[3 * k], col[3 * k + 1], col[3 * k + 2]);
      else c.copy(fb);
      const ndotl = 0.68 + 0.32 * (0.55 * nx + 0.65 * nyv + 0.52 * nz);
      const layer = Math.round(xyz[3 * k + 2] / 0.24) % 2 === 0 ? 1.04 : 0.93;
      c.multiplyScalar(Math.max(0.42, Math.min(1.18, ndotl * layer)));
    } else c.setHSL(0.55 - Math.min(1, Math.max(0, xyz[3 * k + 2] / currentZMaxGlobal)) * 0.45, 0.6, 0.45);
    pc[0] = c.r; pc[1] = c.g; pc[2] = c.b;
  };

  for (let i = 0; i < nPaths; i++) {
    const a0 = offsets[i];
    const n = offsets[i + 1] - a0;
    if (n >= 2 && !on[i]) {
      for (let j = 0; j < n - 1; j++) {
        const p = 3 * (a0 + j);
        vPos[vv++] = xyz[p]; vPos[vv++] = xyz[p + 2]; vPos[vv++] = -xyz[p + 1];
        vPos[vv++] = xyz[p + 3]; vPos[vv++] = xyz[p + 5]; vPos[vv++] = -xyz[p + 4];
      }
    } else if (n >= 2) {
      const base = tv / 3;
      let prevR = 0, prevG = 0, prevB = 0;
      for (let j = 0; j < n; j++) {
        const k = a0 + j;
        const ka = j < n - 1 ? k : k - 1;
        const kb = ka + 1;
        // tangente nel piano (fc x, y) e pendenza in z
        const dx = xyz[3 * kb] - xyz[3 * ka];
        const dy = xyz[3 * kb + 1] - xyz[3 * ka + 1];
        const dz = xyz[3 * kb + 2] - xyz[3 * ka + 2];
        const tl = Math.hypot(dx, dy) || 1;
        // normale laterale verso l'esterno dell'oggetto (in coordinate fc)
        let sx = dy / tl, sy = -dx / tl;
        if ((xyz[3 * k] - ocx) * sx + (xyz[3 * k + 1] - ocy) * sy < 0) { sx = -sx; sy = -sy; }
        const nyv = Math.min(0.65, Math.abs(dz) / (tl + 0.001));
        colorAt(k, sx, nyv, -sy);
        const X = xyz[3 * k], Y = xyz[3 * k + 2], Z = -xyz[3 * k + 1];
        if (tube) {
          const hw = w[k] * 0.55, hh = h[k] * 0.52;
          const ox = sx * hw, oz = -sy * hw;
          tPos.set([X, Y + hh, Z, X + ox, Y - hh * 0.45, Z + oz, X - ox, Y - hh * 0.45, Z - oz], tv);
          tCol.set([Math.min(1, pc[0] * 1.12), Math.min(1, pc[1] * 1.12), Math.min(1, pc[2] * 1.12), pc[0], pc[1], pc[2], pc[0] * 0.55, pc[1] * 0.55, pc[2] * 0.55], tv);
          tv += 9;
          if (j < n - 1) {
            const b0 = base + j * 3, b1 = b0 + 3;
            tIdx.set([b0, b1, b1 + 1, b0, b1 + 1, b0 + 1, b0 + 2, b1 + 2, b1, b0 + 2, b1, b0], ti);
            ti += 12;
          }
        } else if (j > 0) {
          const p = 3 * (k - 1);
          lPos[lv] = xyz[p]; lPos[lv + 1] = xyz[p + 2]; lPos[lv + 2] = -xyz[p + 1];
          lPos[lv + 3] = X; lPos[lv + 4] = Y; lPos[lv + 5] = Z;
          lCol[lv] = prevR; lCol[lv + 1] = prevG; lCol[lv + 2] = prevB;
          lCol[lv + 3] = pc[0]; lCol[lv + 4] = pc[1]; lCol[lv + 5] = pc[2];
          lv += 6;
        }
        prevR = pc[0]; prevG = pc[1]; prevB = pc[2];
      }
    }
    segEnds[4 * i] = ti;
    segEnds[4 * i + 1] = lv / 3;
    segEnds[4 * i + 2] = vv / 3;
    segEnds[4 * i + 3] = n ? offsets[i + 1] : 0; // indice (escluso) dell'ultimo punto
  }

  if (vv) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
    travelMesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: sceneColors().travel, transparent: true, opacity: 0.45, clippingPlanes: [clipPlaneZ] }));
    pathGroup.add(travelMesh);
  }
  if (lv) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
    lineMesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, clippingPlanes: [clipPlaneZ] }));
    pathGroup.add(lineMesh);
  }
  if (tv) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
    g.setIndex(new THREE.BufferAttribute(tIdx, 1));
    g.computeVertexNormals();
    tubeMesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, clippingPlanes: [clipPlaneZ] }));
    pathGroup.add(tubeMesh);
  }
  applyScrub();
}

function applyScrub() {
  if (!segEnds || !geo) return;
  const nPaths = segEnds.length / 4;
  const ratio = Number(el.scrub.value) / 100;
  // L'avanzamento conta i segmenti estrusi, non i percorsi: la parete di un vaso a spirale è un solo
  // percorso lunghissimo, e contando i percorsi comparirebbe tutta insieme solo al 100%.
  const segsUpTo = (i) => (i < 0 ? 0 : tubeMesh ? segEnds[4 * i] / 12 : segEnds[4 * i + 1] / 2);
  const total = segsUpTo(nPaths - 1);
  if (!total) { hotendGroup.visible = false; requestRender(); return; }
  const target = ratio >= 1 ? total : Math.max(1, Math.ceil(total * ratio));
  let k = 0;
  while (k < nPaths - 1 && segsUpTo(k) < target) k++;
  if (tubeMesh) tubeMesh.geometry.setDrawRange(0, target * 12);
  if (lineMesh) lineMesh.geometry.setDrawRange(0, target * 2);
  if (travelMesh) {
    travelMesh.visible = el.toggleTravel.checked;
    travelMesh.geometry.setDrawRange(0, ratio >= 1 ? segEnds[4 * (nPaths - 1) + 2] : k > 0 ? segEnds[4 * (k - 1) + 2] : 0);
  }
  // l'ugello sta sull'ultimo punto disegnato: il segmento j del percorso k finisce nel punto j + 1
  const idx = Math.min(geo.offsets[k + 1] - 1, geo.offsets[k] + (target - segsUpTo(k - 1)));
  const p = 3 * idx;
  hotendGroup.position.set(geo.xyz[p], geo.xyz[p + 2], -geo.xyz[p + 1]);
  hotendGroup.visible = el.toggleCone.checked && ratio < 1;
  requestRender();
}

function updateClipPlane() {
  const pct = Number(el.clip.value) / 100;
  clipPlaneZ.constant = pct >= 0.995 ? 500 : Math.max(0.25, currentZMaxGlobal * pct);
}

/* ======================================================================
 * Risultati: vista, controllo stampa, G-code
 * ==================================================================== */
function applyResult(data, preview) {
  lastResult = data;
  if (!preview) {
    lastFull = data;
    const lines = data.gcode.split('\n');
    el.gcodePreview.textContent = lines.length > 400
      ? `${lines.slice(0, 400).join('\n')}\n\n… altre ${fmt(lines.length - 400)} righe (scarica il file per vederle tutte)`
      : data.gcode;
    el.btnExportGcode.disabled = false;
    el.btnExport3mf.disabled = false;
  }
  const notes = [];
  if (data.stdout) notes.push(data.stdout.trim());
  if (!preview && data.warnings.length) notes.push(`Avvisi sul G-code:\n- ${data.warnings.join('\n- ')}`);
  if (notes.length || !preview) {
    el.console.textContent = notes.join('\n\n') || 'Nessun messaggio.';
    el.consoleCount.hidden = !(data.warnings && data.warnings.length && !preview);
    el.consoleCount.textContent = data.warnings ? String(data.warnings.length) : '';
  }

  geo = data.geo;
  geoPreview = preview;
  buildPathGeometry();
  renderChecks();
}

function evaluate(data) {
  const p = preset();
  const hp = hotend();
  const issues = [];
  if (data.z_collision) issues.push('Il percorso tocca o scende sotto il piatto (Z ≤ 0).');
  if (data.out_of_bounds) issues.push('Una parte del percorso esce dal volume di stampa.');
  if (data.max_slope_deg > hp.maxSlopeDeg + 0.3) issues.push(`Pendenza ${fmt(data.max_slope_deg, 1)}° oltre i ${fmt(hp.maxSlopeDeg)}° sicuri per l'ugello.`);
  if (data.pts_count === 0) issues.push('Lo script non produce nessun percorso.');
  const notes = [];
  if (sceneObjects.filter((o) => o.visible).length > 1) {
    notes.push('Gli oggetti vengono stampati uno dopo l\'altro, ognuno fino in cima: tienili lontani tra loro e lascia per ultimo il più alto, o la testina può urtarli.');
  }
  return { p, hp, issues, notes };
}

function renderChecks() {
  const data = lastResult;
  if (!data) return;
  const { p, hp, issues, notes } = evaluate(data);
  const ok = issues.length === 0;
  setStatus(ok ? 'ok' : 'bad');

  if (ok) {
    const layers = lastFull ? `${fmt(lastFull.layer_count)} strati, ` : '';
    el.checkFinding.innerHTML = `<strong>Pronto da stampare.</strong> ${layers}circa ${fmt(data.filament_g, 1)} g di ${MATERIALS[material].label} (${fmt(data.filament_m, 2)} m di filamento).${notes.length ? ` ${notes.join(' ')}` : ''}`;
  } else {
    el.checkFinding.innerHTML = `<strong>${issues[0]}</strong>${issues.length > 1 ? ` E altri ${issues.length - 1} problemi.` : ''}`;
  }

  const [fx, fy] = data.footprint;
  const rows = [
    {
      label: 'Altezza',
      value: `<strong>${fmt(data.z_max, 1)}</strong> su ${fmt(p.bedZ)} mm`,
      ratio: data.z_max / p.bedZ,
      bad: data.z_max > p.bedZ,
    },
    {
      label: 'Ingombro',
      value: `<strong>${fmt(fx)} × ${fmt(fy)}</strong> su ${fmt(p.bedX)} × ${fmt(p.bedY)} mm`,
      ratio: Math.max(fx / p.bedX, fy / p.bedY),
      bad: data.out_of_bounds,
    },
    {
      label: "Pendenza per l'ugello",
      value: `<strong>${fmt(data.max_slope_deg, 1)}°</strong> su ${fmt(hp.maxSlopeDeg)}°`,
      ratio: data.max_slope_deg / (hp.maxSlopeDeg * 1.5),
      tick: 1 / 1.5,
      bad: data.max_slope_deg > hp.maxSlopeDeg + 0.3,
    },
  ];
  el.checks.innerHTML = rows.map((r) => `
    <div class="check${r.bad ? ' bad' : ''}">
      <div class="check-top"><span class="check-label">${r.label}</span><span class="check-value">${r.value}</span></div>
      <div class="bullet" role="img" aria-label="${r.label}: ${Math.round(Math.min(1, r.ratio) * 100)}%">
        <div class="fill" style="width:${Math.max(0, Math.min(100, r.ratio * 100))}%"></div>
        ${r.tick ? `<div class="tick" style="left:calc(${r.tick * 100}% - 1px)"></div>` : ''}
      </div>
    </div>`).join('');

  const full = lastFull;
  const kb = full ? new Blob([full.gcode]).size / 1024 : null;
  el.stats.innerHTML = `
    <div><dt>Strati</dt><dd>${full ? fmt(full.layer_count) : '—'}</dd></div>
    <div><dt>Filamento</dt><dd>${fmt(data.filament_g, 1)}<em>g</em></dd></div>
    <div><dt>Percorso estruso</dt><dd>${fmt(data.extruded_length / 1000, 1)}<em>m</em></dd></div>
    <div><dt>File G-code</dt><dd>${kb === null ? '—' : fmt(kb)}<em>${kb === null ? '' : 'KB'}</em></dd></div>`;
}

function setStatus(kind) {
  const map = {
    busy: ['neutral', 'Ricalcolo'],
    ok: ['positive', 'Pronto da stampare'],
    bad: ['negative', 'Da sistemare'],
    error: ['negative', 'Errore nello script'],
  };
  const [cls, text] = map[kind];
  if (kind === 'busy' && lastResult) return; // tieni lo stato precedente, il ricalcolo è segnalato nella vista
  el.printStatus.className = `pill ${cls}`;
  el.printStatus.textContent = text;
}

function showError(err) {
  const msg = String(err.message || err);
  el.console.textContent = `Errore:\n${msg}`;
  el.consoleCount.hidden = false;
  el.consoleCount.textContent = '1';
  el.printStatus.className = 'pill negative';
  el.printStatus.textContent = 'Errore nello script';
  el.checkFinding.innerHTML = `<strong>Lo script si è fermato con un errore.</strong> Il dettaglio è nella Console sotto la vista.`;
  openDrawer('pane-console');
}

/* ======================================================================
 * Oggetti e pannello Forma
 * ==================================================================== */
function getSelectedObject() {
  return sceneObjects.find((o) => o.id === selectedObjectId) || sceneObjects[0] || null;
}

function selectObject(id) {
  selectedObjectId = id;
  const obj = getSelectedObject();
  if (obj) amsState[el.preset.value].activeSlot = obj.params.amsSlot || 1;
  if (varyUndo && varyUndo.id !== id) setVaryUndo(null);
  syncAmsUI();
  renderObjectList();
  renderInspector();
  updateHandles3D();
}

const ICONS = {
  eye: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
  eyeOff: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M2 2l12 12M6.6 4c.5-.1.9-.1 1.4-.1 4.1 0 6.5 4.5 6.5 4.5s-.7 1.3-2 2.5M4 5.2C2.4 6.4 1.5 8 1.5 8S3.9 12.5 8 12.5c1 0 1.9-.3 2.7-.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 10.5V3.8C3 3.4 3.4 3 3.8 3h6.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M2.5 4.5h11M6.5 4.5V3h3v1.5M4 4.5l.7 8.6c0 .5.4.9.9.9h4.8c.5 0 .9-.4.9-.9l.7-8.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function renderObjectList() {
  const colors = amsState[el.preset.value].colors;
  el.objectList.innerHTML = '';
  for (const obj of sceneObjects) {
    const li = document.createElement('li');
    li.className = `object-row${obj.id === selectedObjectId ? ' selected' : ''}${obj.visible ? '' : ' hidden-obj'}`;
    li.tabIndex = 0;
    li.setAttribute('aria-selected', String(obj.id === selectedObjectId));
    const h = obj.params.heightMm;
    li.innerHTML = `
      <span class="swatch" style="background:${colors[(obj.params.amsSlot || 1) - 1]}"></span>
      <span class="name"></span>
      <span class="size">${h ? `${fmt(h)} mm` : ''}</span>
      <span class="row-actions">
        <button type="button" data-act="vis" aria-label="${obj.visible ? 'Nascondi' : 'Mostra'}" title="${obj.visible ? 'Nascondi' : 'Mostra'}">${obj.visible ? ICONS.eye : ICONS.eyeOff}</button>
        <button type="button" data-act="dup" aria-label="Duplica" title="Duplica">${ICONS.copy}</button>
        <button type="button" data-act="del" aria-label="Elimina" title="Elimina"${sceneObjects.length <= 1 ? ' disabled' : ''}>${ICONS.trash}</button>
      </span>`;
    li.querySelector('.name').textContent = obj.name;
    li.addEventListener('click', (e) => {
      const act = e.target.closest('button')?.dataset.act;
      if (!act) return selectObject(obj.id);
      e.stopPropagation();
      if (act === 'vis') {
        obj.visible = !obj.visible;
        renderObjectList();
        updateHandles3D();
        syncCodeAndRun(false);
      } else if (act === 'dup') {
        const copy = structuredClone(obj);
        copy.id = `obj_${Date.now()}`;
        copy.name = `${obj.name} copia`;
        copy.params.x = Math.min(preset().bedX - 20, obj.params.x + 25);
        sceneObjects.push(copy);
        selectObject(copy.id);
        syncCodeAndRun(false);
      } else if (act === 'del' && sceneObjects.length > 1) {
        sceneObjects = sceneObjects.filter((o) => o.id !== obj.id);
        selectObject(sceneObjects[0].id);
        syncCodeAndRun(false);
      }
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectObject(obj.id); }
    });
    el.objectList.appendChild(li);
  }
}

// Frase descrittiva dell'oggetto, costruita dai suoi parametri.
function describe(obj) {
  const q = obj.params;
  const info = SHAPE_INFO[obj.blueprintKey] || {};
  const parts = [];
  if (q.heightMm) parts.push(`alto ${fmt(q.heightMm)} mm`);
  if (q.radius) parts.push(`raggio ${fmt(q.radius)} mm`);
  if (q.sides) parts.push(q.sides >= 60 ? 'base circolare' : `base a ${q.sides} lati`);
  if (SHORT[q.verticalProfile]) parts.push(`profilo ${SHORT[q.verticalProfile]}`);
  if (q.twistDeg) parts.push(`torsione di ${fmt(q.twistDeg)}°`);
  if (SHORT[q.nonplanarMode] && q.npAmpZ > 0) parts.push(`onda in Z ${SHORT[q.nonplanarMode]} di ${fmt(q.npAmpZ, 1)} mm`);
  if (SHORT[q.extrusionMode]) parts.push(`superficie ${SHORT[q.extrusionMode]}`);
  const lead = info.blurb || '';
  if (!parts.length) return lead;
  const s = parts.join(', ');
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

function renderInspector() {
  const obj = getSelectedObject();
  el.inspector.innerHTML = '';
  if (!obj) return;
  el.objectTitle.textContent = obj.name;
  el.shapeDescription.textContent = describe(obj);
  const bp = OBJECT_BLUEPRINTS[obj.blueprintKey || obj.type] || OBJECT_BLUEPRINTS.combinable_vessel;

  // Posizione
  const pos = document.createElement('div');
  pos.className = 'pos-grid';
  for (const axis of ['x', 'y', 'z']) {
    const lab = document.createElement('label');
    lab.innerHTML = `<span>${axis.toUpperCase()}</span>`;
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.id = `insp-pos-${axis}`;
    inp.step = axis === 'z' ? '0.05' : '1';
    inp.value = obj.params[axis];
    inp.setAttribute('aria-label', `Posizione ${axis.toUpperCase()} in mm`);
    inp.addEventListener('input', () => {
      obj.params[axis] = Number(inp.value);
      updateHandles3D();
      syncCodeAndRun(true);
    });
    inp.addEventListener('change', () => syncCodeAndRun(false));
    lab.appendChild(inp);
    pos.appendChild(lab);
  }
  el.inspector.appendChild(pos);

  // Scelte di forma
  const choice = (label, key, list) => {
    if (!(key in obj.params)) return;
    const wrapEl = document.createElement('label');
    wrapEl.className = 'choice';
    wrapEl.innerHTML = `<span>${label}</span>`;
    const sel = document.createElement('select');
    for (const m of list) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = tidy(m.label);
      o.selected = m.id === obj.params[key];
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      obj.params[key] = sel.value;
      el.shapeDescription.textContent = describe(obj);
      syncCodeAndRun(false);
    });
    wrapEl.appendChild(sel);
    el.inspector.appendChild(wrapEl);
  };
  choice('Profilo in altezza', 'verticalProfile', VERTICAL_PROFILES);
  choice('Superficie', 'extrusionMode', EXTRUSION_MODES);
  choice('Onda non planare', 'nonplanarMode', NONPLANAR_MODES);

  if (obj.type === 'plate_drawn_path') {
    const row = document.createElement('div');
    row.className = 'choice';
    row.innerHTML = `<span>${fmt(obj.params.pointsRel.length)} punti disegnati</span>`;
    const btns = document.createElement('div');
    btns.className = 'head-actions';
    const bDraw = document.createElement('button');
    bDraw.type = 'button';
    bDraw.className = 'btn small';
    bDraw.textContent = drawMode ? 'Fine disegno' : 'Aggiungi punti';
    bDraw.addEventListener('click', () => setDrawMode(!drawMode));
    const bClear = document.createElement('button');
    bClear.type = 'button';
    bClear.className = 'btn small ghost';
    bClear.textContent = 'Svuota';
    bClear.addEventListener('click', () => {
      obj.params.pointsRel = [[0, 0]];
      renderInspector();
      updateHandles3D();
      syncCodeAndRun(false);
    });
    btns.append(bDraw, bClear);
    row.appendChild(btns);
    el.inspector.appendChild(row);
  }

  // Gruppi di parametri (il primo aperto, gli altri chiusi: meno muro di cursori)
  (bp.groups || []).forEach((grp, gi) => {
    const det = document.createElement('details');
    det.className = 'group';
    det.open = gi === 0;
    const sum = document.createElement('summary');
    sum.textContent = tidy(grp.title);
    det.appendChild(sum);
    for (const cfg of grp.fields) {
      const val = obj.params[cfg.key] ?? bp.defaults[cfg.key];
      const id = `p-${obj.id}-${cfg.key}`;
      const row = document.createElement('div');
      row.className = 'param';
      row.innerHTML = `
        <div class="param-top">
          <label for="${id}" title="${cfg.label}">${tidy(cfg.label)}</label>
          <span class="param-value"><input type="number" aria-label="${cfg.label}" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${val}"><em>${cfg.unit || ''}</em></span>
        </div>
        <input id="${id}" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${val}">`;
      const range = row.querySelector('input[type="range"]');
      const num = row.querySelector('input[type="number"]');
      const set = (v, final) => {
        const n = Math.max(cfg.min, Math.min(cfg.max, Number(v)));
        if (Number.isNaN(n)) return;
        obj.params[cfg.key] = n;
        range.value = n;
        if (document.activeElement !== num || final) num.value = n;
        if (cfg.key === 'heightMm') renderObjectList();
        el.shapeDescription.textContent = describe(obj);
        syncCodeAndRun(!final);
      };
      range.addEventListener('input', () => set(range.value, false));
      range.addEventListener('change', () => set(range.value, true));
      num.addEventListener('change', () => set(num.value, true));
      det.appendChild(row);
    }
    el.inspector.appendChild(det);
  });
}

// "Varia": una variante casuale entro limiti stampabili, annullabile.
const KEEP_ON_VARY = new Set(['layerH', 'extrusionW', 'bottomLayers', 'wallLoops', 'segResolution', 'x', 'y', 'z', 'amsSlot']);
function varyObject() {
  const obj = getSelectedObject();
  if (!obj) return;
  const bp = OBJECT_BLUEPRINTS[obj.blueprintKey || obj.type];
  if (!bp) return;
  setVaryUndo({ id: obj.id, params: structuredClone(obj.params) });
  const p = preset();
  const pick = (lo, hi, step) => {
    const v = lo + Math.random() * (hi - lo);
    return Math.round(v / step) * step;
  };
  for (const grp of bp.groups || []) {
    for (const cfg of grp.fields) {
      if (KEEP_ON_VARY.has(cfg.key)) continue;
      let lo = cfg.min + (cfg.max - cfg.min) * 0.15;
      let hi = cfg.min + (cfg.max - cfg.min) * 0.7;
      if (cfg.key === 'heightMm') hi = Math.min(hi, p.bedZ * 0.5, 90);
      if (cfg.key === 'radius') hi = Math.min(hi, p.bedX * 0.22);
      if (hi < lo) hi = lo;
      obj.params[cfg.key] = Number(pick(lo, hi, cfg.step).toFixed(3));
    }
  }
  const anyOf = (list, skip = []) => {
    const pool = list.filter((m) => !skip.includes(m.id));
    return pool[Math.floor(Math.random() * pool.length)].id;
  };
  if ('verticalProfile' in obj.params) obj.params.verticalProfile = anyOf(VERTICAL_PROFILES);
  if ('nonplanarMode' in obj.params) obj.params.nonplanarMode = anyOf(NONPLANAR_MODES);
  if ('extrusionMode' in obj.params) obj.params.extrusionMode = anyOf(EXTRUSION_MODES, ['ams_bands']);
  renderObjectList();
  renderInspector();
  updateHandles3D();
  syncCodeAndRun(false);
}
function setVaryUndo(v) {
  varyUndo = v;
  el.btnUndoVary.disabled = !v;
}
el.btnVary.addEventListener('click', varyObject);
el.btnUndoVary.addEventListener('click', () => {
  const obj = sceneObjects.find((o) => o.id === varyUndo?.id);
  if (!obj) return;
  obj.params = varyUndo.params;
  setVaryUndo(null);
  renderObjectList();
  renderInspector();
  updateHandles3D();
  syncCodeAndRun(false);
});

/* Selettore forme: una galleria con disegni e frasi, invece di un menu a tendina */
const FAMILY_GLYPH = {
  'Vasi e contenitori': '<path d="M14 6h12M15 6c0 6-5 9-5 18 0 6 4 10 10 10s10-4 10-10c0-9-5-12-5-18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 20c5 2 11 2 16 0" fill="none" stroke="var(--accent)" stroke-width="1.6"/>',
  'Strutture e reticoli': '<path d="M6 30L20 8l14 22zM13 19h14M10 25l10-17 10 17M6 30h28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="20" cy="8" r="2" fill="var(--accent)"/>',
  'Pareti e superfici': '<path d="M4 26c4-8 8-8 12 0s8 8 12 0 6-8 8-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 18c4-8 8-8 12 0s8 8 12 0 6-8 8-4" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"/>',
  'Disegno libero': '<path d="M6 30l8-12 9 6 11-16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="6" cy="30" r="2.2" fill="var(--accent)"/><circle cx="14" cy="18" r="2.2" fill="var(--accent)"/><circle cx="23" cy="24" r="2.2" fill="var(--accent)"/><circle cx="34" cy="8" r="2.2" fill="var(--accent)"/>',
};

function renderGallery() {
  el.shapeGallery.innerHTML = '';
  for (const fam of SHAPE_FAMILIES) {
    const h = document.createElement('h3');
    h.textContent = fam;
    const list = document.createElement('div');
    list.className = 'gallery-list';
    for (const [k, info] of Object.entries(SHAPE_INFO)) {
      if (info.family !== fam || !OBJECT_BLUEPRINTS[k]) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'shape-option';
      b.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true">${FAMILY_GLYPH[fam]}</svg><div><strong></strong><span></span></div>`;
      b.querySelector('strong').textContent = info.name;
      b.querySelector('span').textContent = info.blurb;
      b.addEventListener('click', () => {
        el.shapeDialog.close();
        addShape(k);
      });
      list.appendChild(b);
    }
    el.shapeGallery.append(h, list);
  }
}

function addShape(key) {
  const p = preset();
  const offset = (sceneObjects.length % 3) * 22 - 22;
  const sameKind = sceneObjects.filter((o) => o.blueprintKey === key).length;
  const obj = createSceneObject(key, p.bedX / 2 + offset, p.bedY / 2 + offset, sameKind + 1);
  obj.params.amsSlot = amsState[p.id].activeSlot;
  if (obj.params.heightMm > p.bedZ - 10) obj.params.heightMm = p.bedZ - 10;
  sceneObjects.push(obj);
  selectObject(obj.id);
  if (key === 'plate_drawn_path') {
    obj.params.pointsRel = [[0, 0]];
    setDrawMode(true);
    resetCamera('top');
  }
  syncCodeAndRun(false);
}

function addDrawnPoint(fx, fy) {
  let obj = getSelectedObject();
  if (!obj || obj.type !== 'plate_drawn_path') {
    obj = createSceneObject('plate_drawn_path', fx, fy, sceneObjects.length + 1);
    obj.params.pointsRel = [[0, 0]];
    sceneObjects.push(obj);
    selectedObjectId = obj.id;
  } else {
    obj.params.pointsRel.push([Math.round((fx - obj.params.x) * 10) / 10, Math.round((fy - obj.params.y) * 10) / 10]);
  }
  renderObjectList();
  renderInspector();
  updateHandles3D();
  syncCodeAndRun(false);
}

function setDrawMode(on) {
  drawMode = on;
  el.drawHint.hidden = !on;
  renderInspector();
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawMode) setDrawMode(false);
});

el.btnOpenShapes.addEventListener('click', () => el.shapeDialog.showModal());
el.btnHelp.addEventListener('click', () => el.helpDialog.showModal());
for (const d of [el.shapeDialog, el.helpDialog]) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
}

/* ======================================================================
 * Stampante, materiale, filamento
 * ==================================================================== */
function syncAmsUI() {
  const p = preset();
  const st = amsState[p.id];
  el.amsTitle.textContent = `${p.amsType}, 4 slot`;
  document.querySelectorAll('.ams-slot').forEach((slotEl) => {
    const n = Number(slotEl.dataset.slot);
    const active = n === st.activeSlot;
    slotEl.classList.toggle('active', active);
    slotEl.querySelector('button').setAttribute('aria-checked', String(active));
    $(`ams-color-${n}`).value = st.colors[n - 1];
  });
}

document.querySelectorAll('.slot-select-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const n = Number(btn.dataset.slot);
    amsState[el.preset.value].activeSlot = n;
    const obj = getSelectedObject();
    if (obj) obj.params.amsSlot = n;
    syncAmsUI();
    renderObjectList();
    updateHandles3D();
    syncCodeAndRun(false);
  });
});
for (let s = 1; s <= 4; s++) {
  const sw = $(`ams-color-${s}`);
  sw.addEventListener('input', () => {
    amsState[el.preset.value].colors[s - 1] = sw.value;
    renderObjectList();
    updateHandles3D();
    syncCodeAndRun(true);
  });
  sw.addEventListener('change', () => syncCodeAndRun(false));
}

function materialSpec() {
  const base = MATERIALS[material];
  const pid = el.preset.value;
  const t = bambuManifest?.printers?.[pid]?.materials?.[material];
  const nozzle = t ? t.nozzle : base.nozzle;
  const bed = (t ? t.bed : base.bed) + (base.bedBoost[pid] || 0);
  return { ...base, nozzle, nozzleFirst: nozzle + base.firstBoost, bed, fanPercent: base.fan[pid] ?? 100 };
}
function applyMaterialDefaults() {
  const spec = materialSpec();
  for (const input of [el.nozzle, el.firstNozzle]) {
    input.min = spec.range[0];
    input.max = spec.range[1];
  }
  el.bed.max = 85; // sopra 89 °C l'avvio P2S cambia ramo: i template sono verificati sotto
  el.nozzle.value = spec.nozzle;
  el.firstNozzle.value = spec.nozzleFirst;
  el.bed.value = spec.bed;
  el.speed.value = Math.min(spec.maxSpeed, Math.round(preset().defaultSpeed / 60));
}
const clampNum = (input, lo, hi, dec = 0) => {
  const v = Math.max(lo, Math.min(hi, Number(input.value) || lo));
  input.value = dec ? v.toFixed(dec) : Math.round(v);
  return Number(input.value);
};
// Impostazioni che entrano nel codice generato (anche il .py scaricato le contiene).
function printSettings() {
  return {
    firstLayerH: clampNum(el.firstH, 0.12, 0.4, 2),
    firstLayerSpeed: clampNum(el.firstSpeed, 10, 60),
    printSpeed: Math.max(5, Number(el.speed.value) || 40),
    fanPercent: materialSpec().fanPercent,
    nozzle: Number(el.nozzle.value),
    nozzleFirst: Number(el.firstNozzle.value),
  };
}
function setMaterial(m) {
  material = m;
  document.querySelectorAll('[data-material]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.material === m)));
  applyMaterialDefaults();
  syncCodeAndRun(false);
}
// Tiene le temperature dentro l'intervallo verificato anche se scritte a mano.
for (const [input, lo, hi] of [[el.nozzle, () => materialSpec().range[0], () => materialSpec().range[1]], [el.firstNozzle, () => materialSpec().range[0], () => materialSpec().range[1]], [el.bed, () => 0, () => 85]]) {
  input.addEventListener('change', () => { input.value = Math.max(lo(), Math.min(hi(), Number(input.value) || lo())); });
}
document.querySelectorAll('[data-material]').forEach((b) => b.addEventListener('click', () => setMaterial(b.dataset.material)));

// Al cambio stampante gli oggetti restano nella stessa posizione relativa sul piatto (il centro resta il centro).
let lastPresetId = null;
function applyPreset(run = true) {
  const p = preset();
  const prev = lastPresetId && lastPresetId !== p.id ? PRINTER_PRESETS[lastPresetId] : null;
  lastPresetId = p.id;
  if (prev) {
    for (const obj of sceneObjects) {
      obj.params.x = Math.round((obj.params.x / prev.bedX) * p.bedX * 10) / 10;
      obj.params.y = Math.round((obj.params.y / prev.bedY) * p.bedY * 10) / 10;
    }
  }
  el.auxFan.value = p.defaultAuxFan;
  el.auxFanWrap.hidden = !p.hasAuxFan;
  applyMaterialDefaults();
  for (const obj of sceneObjects) {
    if (obj.params.x > p.bedX - 20) obj.params.x = Math.round(p.bedX / 2);
    if (obj.params.y > p.bedY - 20) obj.params.y = Math.round(p.bedY / 2);
    if (obj.params.heightMm > p.bedZ - 5) obj.params.heightMm = p.bedZ - 10;
  }
  syncAmsUI();
  buildBed();
  renderObjectList();
  renderInspector();
  updateHandles3D();
  if (run) syncCodeAndRun(false);
}
el.preset.addEventListener('change', () => applyPreset(true));
el.clampToggle.addEventListener('change', () => syncCodeAndRun(false));
[el.nozzle, el.bed, el.speed, el.auxFan, el.primer, el.firstH, el.firstSpeed, el.firstNozzle].forEach((x) => x.addEventListener('change', () => syncCodeAndRun(false)));

/* ======================================================================
 * Vista: controlli
 * ==================================================================== */
el.renderStyle.addEventListener('change', buildPathGeometry);
el.colorMode.addEventListener('change', buildPathGeometry);
el.scrub.addEventListener('input', () => {
  el.scrubVal.textContent = `${el.scrub.value}%`;
  applyScrub();
});
el.clip.addEventListener('input', () => {
  el.clipVal.textContent = `${el.clip.value}%`;
  updateClipPlane();
  requestRender();
});
el.toggleCone.addEventListener('change', applyScrub);
el.toggleTravel.addEventListener('change', applyScrub);
el.toggleGizmo.addEventListener('change', updateHandles3D);
el.camIso.addEventListener('click', () => resetCamera('iso'));
el.camTop.addEventListener('click', () => resetCamera('top'));
el.camFront.addEventListener('click', () => resetCamera('front'));

/* ======================================================================
 * Cassetto: codice, G-code, console, funzioni
 * ==================================================================== */
const tabs = [...document.querySelectorAll('.tab')];
function openDrawer(paneId) {
  el.drawer.classList.add('open');
  el.drawerToggle.setAttribute('aria-expanded', 'true');
  for (const t of tabs) {
    const on = t.dataset.pane === paneId;
    t.setAttribute('aria-selected', String(on));
    $(t.dataset.pane).classList.toggle('active', on);
  }
  if (paneId === 'pane-api' && !fullApiCatalog) loadApiCatalog();
}
function closeDrawer() {
  el.drawer.classList.remove('open');
  el.drawerToggle.setAttribute('aria-expanded', 'false');
}
for (const t of tabs) {
  t.addEventListener('click', () => {
    if (el.drawer.classList.contains('open') && t.getAttribute('aria-selected') === 'true') closeDrawer();
    else openDrawer(t.dataset.pane);
  });
}
el.drawerToggle.addEventListener('click', () => {
  if (el.drawer.classList.contains('open')) closeDrawer();
  else openDrawer(tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.pane || 'pane-code');
});

el.syncToggle.addEventListener('change', () => {
  if (el.syncToggle.checked) syncCodeAndRun(false);
});
el.code.addEventListener('input', () => {
  if (el.syncToggle.checked) el.syncToggle.checked = false; // l'utente sta scrivendo: non sovrascrivere
});
el.btnRun.addEventListener('click', () => requestRun({ preview: false, delay: 0 }));
el.btnCheck.addEventListener('click', async () => {
  try {
    el.console.textContent = await engine('check', { code: el.code.value, opts: runOptions(true) });
    openDrawer('pane-console');
  } catch (err) {
    showError(err);
  }
});

async function loadApiCatalog() {
  fullApiCatalog = [];
  try {
    const resp = await fetch(new URL('./api_catalog.json', import.meta.url));
    if (resp.ok) fullApiCatalog = (await resp.json()).items || [];
  } catch { /* catalogo opzionale */ }
  el.apiCount.textContent = `${fmt(fullApiCatalog.length)} funzioni`;
  renderCatalog('');
}
function renderCatalog(filter) {
  const q = filter.trim().toLowerCase();
  el.catalogTree.innerHTML = '';
  for (const item of fullApiCatalog || []) {
    const hay = `${item.name} ${item.doc || ''} ${item.category}`.toLowerCase();
    if (q && !hay.includes(q)) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fn-btn';
    b.innerHTML = '<strong></strong><small></small>';
    b.querySelector('strong').textContent = item.name;
    b.querySelector('small').textContent = `${item.category} · ${item.doc || item.module}`;
    b.title = 'Aggiungi al codice';
    b.addEventListener('click', () => {
      el.syncToggle.checked = false;
      el.code.value += `\n${item.snippet}\n`;
      openDrawer('pane-code');
    });
    el.catalogTree.appendChild(b);
  }
}
el.catalogSearch.addEventListener('input', (e) => renderCatalog(e.target.value));

/* ======================================================================
 * Export
 * ==================================================================== */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const baseName = () => `${(getSelectedObject()?.name || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${preset().id}`;

el.btnExportGcode.addEventListener('click', () => {
  if (lastFull) download(new Blob([lastFull.gcode], { type: 'text/plain' }), `${baseName()}.gcode`);
});
el.btnExportPy.addEventListener('click', () => download(new Blob([el.code.value], { type: 'text/x-python' }), `${baseName()}.py`));
// Miniatura per la stampante e Bambu Studio: la vista 3D senza maniglie, ritagliata al centro.
function captureThumbnails() {
  const src = renderer.domElement;
  const saved = [gizmoHelper.visible, handlesGroup.visible, hotendGroup.visible];
  gizmoHelper.visible = handlesGroup.visible = hotendGroup.visible = false;
  renderer.render(scene, camera);
  const side = Math.min(src.width, src.height);
  const make = (size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, size, size);
    return c;
  };
  const large = make(512);
  const small = make(128);
  [gizmoHelper.visible, handlesGroup.visible, hotendGroup.visible] = saved;
  requestRender();
  const toBlob = (c) => new Promise((res) => c.toBlob(res, 'image/png'));
  return Promise.all([toBlob(large), toBlob(small)]).then(([l, s]) => (l && s ? { large: l, small: s } : null));
}

el.btnExport3mf.addEventListener('click', async () => {
  if (!lastFull || typeof JSZip === 'undefined') return;
  const label = el.btnExport3mf.innerHTML;
  el.btnExport3mf.disabled = true;
  el.btnExport3mf.textContent = 'Preparo il file…';
  try {
    const p = preset();
    const st = amsState[p.id];
    const speed = Math.max(1, Number(el.speed.value));
    const { blob, info } = await buildBambu3mf({
      preset: p,
      material,
      gcode: lastFull.gcode,
      nozzle: Number(el.firstNozzle.value), // l'avvio Bambu scalda alla temperatura del primo layer
      bed: Number(el.bed.value),
      colorHex: st.colors[st.activeSlot - 1],
      layerCount: lastFull.layer_count,
      filamentMm: lastFull.filament_m * 1000,
      filamentG: lastFull.filament_g,
      zMax: lastFull.z_max,
      bbox: lastFull.bbox,
      // stima grezza: percorso alla velocità impostata + circa 6 minuti di avvio (riscaldamento, livellamento)
      printSeconds: (lastFull.length / speed) * 1.1 + 360,
      thumbnails: await captureThumbnails(),
      md5: (s) => engine('md5', s),
    });
    download(blob, `${baseName()}.gcode.3mf`);
    el.console.textContent = `File per Bambu Studio pronto: ${p.label} (${info.modelId}), ${MATERIALS[material].label}, ugello ${el.firstNozzle.value} °C al primo strato poi ${el.nozzle.value} °C, piatto ${el.bed.value} °C, primo strato ${el.firstH.value} mm a ${el.firstSpeed.value} mm/s.\n`
      + `Avvio e fine ufficiali Bambu (profili ${info.profilesVersion}), livellamento sull'area X${info.abl[0]} Y${info.abl[1]} ${info.abl[2]}×${info.abl[3]} mm.\n`
      + `In Bambu Studio scegli lo slot AMS nella finestra di invio (mappatura filamento).`;
  } catch (err) {
    showError(err);
  } finally {
    el.btnExport3mf.disabled = false;
    el.btnExport3mf.innerHTML = label;
  }
});

/* ======================================================================
 * Avvio
 * ==================================================================== */
function applyTheme(pref) {
  root.dataset.theme = pref;
  root.classList.toggle('theme-light', pref === 'light');
  btnTheme.dataset.pref = pref;
  btnTheme.title = btnTheme.ariaLabel = THEME_LABEL[pref];
  scene.background = new THREE.Color(sceneColors().bg);
  buildBed(false);
  updateHandles3D();
  buildPathGeometry();
}
btnTheme.addEventListener('click', () => {
  const next = readPref() === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('orfini_theme', next); } catch { /* resta per questa sessione */ }
  applyTheme(next);
});
btnTheme.dataset.pref = readPref();
btnTheme.title = btnTheme.ariaLabel = THEME_LABEL[readPref()];

renderGallery();
const first = createSceneObject('combinable_vessel', preset().bedX / 2, preset().bedY / 2, 1);
sceneObjects = [first];
selectedObjectId = first.id;
applyPreset(false);
setMaterial('PLA_MATTE');
el.code.value = compileSceneToPython(sceneObjects, el.preset.value, el.clampToggle.checked, printSettings());
initEngine();

// RENDERER DI ASTROMATH — disegna la lista di disegno (disegno.js).
// WebGL con Three.js: tre chiamate di disegno (cielo statico, segmenti, punti). Le linee al neon sono
// quadrilateri istanziati con uno shader nostro: nucleo nitido + alone gaussiano nello stesso passaggio,
// in somma additiva. Niente post-processing (il bloom costa troppo su GPU integrate e telefoni).
// Senza WebGL: ripiego su Canvas 2D con la stessa lista e la stessa camera.

import { SEG, PT } from './disegno.js';

const TINTE_CIELO = [[205, 222, 255], [255, 255, 255], [255, 238, 196], [255, 206, 160]]; // le stesse della home

/** Cielo stellato fisso a tre profondità: con la camera prospettica la parallasse è vera */
function creaCielo(n, seme = 7) {
  let s = seme;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = [];
  for (let i = 0; i < n; i++) {
    const strato = r();
    const z = -160 - strato * 760;
    const ampio = (95 - z) * 1.25;
    const c = TINTE_CIELO[Math.floor(r() * TINTE_CIELO.length)];
    out.push({ x: (r() * 2 - 1) * ampio * 1.4, y: 120 + (r() * 2 - 1) * ampio, z, size: (0.6 + r() * r() * 2.4) * (1 + strato * 2.2), c: c.map((v) => v / 255), fase: r() * 6.283, luce: 0.35 + r() * 0.65 });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------
// WebGL (Three.js)
// ------------------------------------------------------------------------------------------------
const VS_LINEE = /* glsl */ `
attribute vec2 quad;
attribute vec3 ia; attribute vec3 ib; attribute vec4 icol; attribute float iw;
uniform vec2 res; uniform float pr; uniform float alone; uniform float fuoco; uniform float sfoca;
varying vec2 vLoc; varying float vLen; varying float vHalf; varying float vGlow; varying vec4 vCol; varying float vBlur;
void main() {
  vec4 ma = modelViewMatrix * vec4(ia, 1.0), mb = modelViewMatrix * vec4(ib, 1.0);
  vec4 ca = projectionMatrix * ma;
  vec4 cb = projectionMatrix * mb;
  // profondità di campo: a fuoco il piano di gioco, sfocato ciò che sta davanti o dietro
  float blur = clamp(abs(0.5 * (-ma.z - mb.z) - fuoco) * sfoca, 0.0, 16.0) * pr;
  vec2 sa = (ca.xy / ca.w * 0.5 + 0.5) * res;
  vec2 sb = (cb.xy / cb.w * 0.5 + 0.5) * res;
  vec2 d = sb - sa; float len = length(d);
  vec2 dir = len > 0.001 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float wpx = iw * pr;
  float glow = (wpx * 2.0 + 3.0 * pr) * alone + blur * 1.2;
  float H = wpx * 0.5 + max(glow, pr) + blur;
  vec2 p = mix(sa, sb, quad.x) + dir * (quad.x * 2.0 - 1.0) * H + nrm * quad.y * H;
  vLoc = vec2(dot(p - sa, dir), quad.y * H); vLen = len; vHalf = max(wpx * 0.5, 0.5 * pr); vGlow = glow; vBlur = blur;
  vCol = vec4(icol.rgb, icol.a / (1.0 + blur * 0.09)); // la luce si spande: meno intensa dove è sfocata
  vec4 c = mix(ca, cb, quad.x);
  gl_Position = vec4((p / res * 2.0 - 1.0) * c.w, c.z, c.w);
}`;
const FS_LINEE = /* glsl */ `
uniform float pr;
varying vec2 vLoc; varying float vLen; varying float vHalf; varying float vGlow; varying vec4 vCol; varying float vBlur;
void main() {
  float along = clamp(vLoc.x, 0.0, vLen);
  float d = length(vec2(vLoc.x - along, vLoc.y));
  float morb = 0.8 * pr + vBlur;
  float core = (1.0 - smoothstep(vHalf - morb, vHalf + morb, d)) * (1.0 - 0.55 * clamp(vBlur / (6.0 * pr), 0.0, 1.0));
  float g = vGlow > 0.0 ? exp(-pow(d / (vGlow * 0.5 + 0.001), 2.0)) * 0.26 + exp(-pow(d / (vGlow * 1.3 + 0.001), 2.0)) * 0.05 : 0.0;
  float a = vCol.a * (core + g);
  if (a < 0.004) discard;
  gl_FragColor = vec4(vCol.rgb * a, a);
}`;
const VS_PUNTI = /* glsl */ `
attribute float size; attribute vec4 col; attribute float fase;
uniform float scala; uniform float tempo; uniform float brilla; uniform float fuoco; uniform float sfoca; uniform float sfocaMax;
varying vec4 vCol; varying float vBlur;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 1.0 - brilla * 0.35 * (0.5 + 0.5 * sin(tempo * 1.7 + fase * 3.0));
  float b = clamp(abs(-mv.z - fuoco) * sfoca * 0.06, 0.0, sfocaMax);
  float px = size * scala / -mv.z;
  gl_PointSize = clamp(px * (1.0 + b * 1.6) + b * 6.0, 1.0, 480.0);
  vBlur = b;
  vCol = vec4(col.rgb, col.a * tw / (1.0 + b * 1.8));
}`;
const FS_PUNTI = /* glsl */ `
varying vec4 vCol; varying float vBlur;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float nitido = exp(-r2 * 5.0) * 0.85 + (1.0 - smoothstep(0.0, 0.08, r2)) * 0.6;
  float bokeh = (1.0 - smoothstep(0.55, 1.0, r2)) * 0.55 + exp(-r2 * 2.0) * 0.25; // disco morbido dell'obiettivo
  float a = vCol.a * mix(nitido, bokeh, clamp(vBlur, 0.0, 1.0));
  gl_FragColor = vec4(vCol.rgb * a, a);
}`;

class RendererGL {
  constructor(THREE, canvas, opz) {
    this.T = THREE;
    this.canvas = canvas;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'default', preserveDrawingBuffer: !!opz.conservaImmagine });
    this.r.setClearColor(0x050507, 1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 4000);
    this.prMax = 1.5;
    this.alone = 1;
    this.brilla = 1;
    const blend = { transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

    // cielo statico
    const cielo = creaCielo(opz.stretto ? 650 : 1300);
    const gC = new THREE.BufferGeometry();
    gC.setAttribute('position', new THREE.Float32BufferAttribute(cielo.flatMap((s) => [s.x, s.y, s.z]), 3));
    gC.setAttribute('size', new THREE.Float32BufferAttribute(cielo.map((s) => s.size), 1));
    gC.setAttribute('col', new THREE.Float32BufferAttribute(cielo.flatMap((s) => [...s.c, s.luce]), 4));
    gC.setAttribute('fase', new THREE.Float32BufferAttribute(cielo.map((s) => s.fase), 1));
    this.fuoco = { value: 80 };
    this.sfoca = { value: 0.18 };
    this.uPunti = { scala: { value: 500 }, tempo: { value: 0 }, brilla: { value: 1 }, fuoco: this.fuoco, sfoca: this.sfoca, sfocaMax: { value: 0.45 } };
    this.matCielo = new THREE.ShaderMaterial({ vertexShader: VS_PUNTI, fragmentShader: FS_PUNTI, uniforms: this.uPunti, ...blend });
    const pc = new THREE.Points(gC, this.matCielo); pc.frustumCulled = false; this.scene.add(pc);

    // segmenti (istanziati, aggiornati a ogni fotogramma)
    this.maxSeg = opz.maxSeg; this.maxPt = opz.maxPt;
    const gL = new THREE.InstancedBufferGeometry();
    gL.setAttribute('quad', new THREE.Float32BufferAttribute([0, -1, 1, -1, 1, 1, 0, 1], 2));
    gL.setIndex([0, 1, 2, 0, 2, 3]);
    this.bufL = new THREE.InstancedInterleavedBuffer(new Float32Array(this.maxSeg * SEG), SEG, 1);
    this.bufL.setUsage(THREE.DynamicDrawUsage);
    gL.setAttribute('ia', new THREE.InterleavedBufferAttribute(this.bufL, 3, 0));
    gL.setAttribute('ib', new THREE.InterleavedBufferAttribute(this.bufL, 3, 3));
    gL.setAttribute('icol', new THREE.InterleavedBufferAttribute(this.bufL, 4, 6));
    gL.setAttribute('iw', new THREE.InterleavedBufferAttribute(this.bufL, 1, 10));
    gL.instanceCount = 0;
    this.gL = gL;
    this.uLinee = { res: { value: new THREE.Vector2(1, 1) }, pr: { value: 1 }, alone: { value: 1 }, fuoco: this.fuoco, sfoca: this.sfoca };
    const ml = new THREE.Mesh(gL, new THREE.ShaderMaterial({ vertexShader: VS_LINEE, fragmentShader: FS_LINEE, uniforms: this.uLinee, ...blend }));
    ml.frustumCulled = false; this.scene.add(ml);

    // punti dinamici (particelle, aloni, nebulose)
    const gP = new THREE.BufferGeometry();
    this.bufP = new THREE.InterleavedBuffer(new Float32Array(this.maxPt * PT), PT);
    this.bufP.setUsage(THREE.DynamicDrawUsage);
    gP.setAttribute('position', new THREE.InterleavedBufferAttribute(this.bufP, 3, 0));
    gP.setAttribute('size', new THREE.InterleavedBufferAttribute(this.bufP, 1, 3));
    gP.setAttribute('col', new THREE.InterleavedBufferAttribute(this.bufP, 4, 4));
    gP.setAttribute('fase', new THREE.Float32BufferAttribute(new Float32Array(this.maxPt), 1));
    gP.setDrawRange(0, 0);
    this.gP = gP;
    this.uPuntiDin = { scala: this.uPunti.scala, tempo: this.uPunti.tempo, brilla: { value: 0 }, fuoco: this.fuoco, sfoca: this.sfoca, sfocaMax: { value: 1.6 } };
    const mp = new THREE.Points(gP, new THREE.ShaderMaterial({ vertexShader: VS_PUNTI, fragmentShader: FS_PUNTI, uniforms: this.uPuntiDin, ...blend }));
    mp.frustumCulled = false; this.scene.add(mp);
    this.tipo = 'webgl';
  }

  imposta({ prMax, alone, brilla, sfoca }) {
    if (sfoca != null) this.sfoca.value = sfoca;
    if (prMax != null) { this.prMax = prMax; this.dimensiona(this.W, this.H, true); }
    if (alone != null) this.alone = alone;
    if (brilla != null) this.brilla = brilla;
  }

  dimensiona(W, H, forza = false) {
    if (!forza && W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    const pr = Math.min(window.devicePixelRatio || 1, this.prMax);
    this.pr = pr;
    this.r.setPixelRatio(pr);
    this.r.setSize(W, H, false);
  }

  disegna(lista, cam, tempo) {
    const T = this.T;
    this.camera.fov = cam.fov; this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
    const o = cam.occhio;
    this.camera.position.set(o.pos[0], o.pos[1], o.pos[2]);
    this.camera.lookAt(o.tgt[0], o.tgt[1], o.tgt[2]);
    this.fuoco.value = Math.hypot(o.pos[0] - o.tgt[0], o.pos[1] - o.tgt[1], o.pos[2] - o.tgt[2]);
    this.uLinee.res.value.set(this.W * this.pr, this.H * this.pr);
    this.uLinee.pr.value = this.pr;
    this.uLinee.alone.value = this.alone;
    this.uPunti.scala.value = (this.H * this.pr) / (2 * Math.tan((cam.fov * Math.PI) / 360));
    this.uPunti.tempo.value = tempo;
    this.uPunti.brilla.value = this.brilla;
    const nS = Math.min(lista.nSeg, this.maxSeg);
    this.bufL.array.set(lista.seg.subarray(0, nS * SEG));
    this.bufL.clearUpdateRanges?.();
    this.bufL.addUpdateRange ? this.bufL.addUpdateRange(0, nS * SEG) : (this.bufL.updateRange = { offset: 0, count: nS * SEG });
    this.bufL.needsUpdate = true;
    this.gL.instanceCount = nS;
    const nP = Math.min(lista.nPt, this.maxPt);
    this.bufP.array.set(lista.pt.subarray(0, nP * PT));
    this.bufP.clearUpdateRanges?.();
    this.bufP.addUpdateRange ? this.bufP.addUpdateRange(0, nP * PT) : (this.bufP.updateRange = { offset: 0, count: nP * PT });
    this.bufP.needsUpdate = true;
    this.gP.setDrawRange(0, nP);
    this.r.render(this.scene, this.camera);
    void T;
  }
}

// ------------------------------------------------------------------------------------------------
// Canvas 2D (ripiego)
// ------------------------------------------------------------------------------------------------
class Renderer2D {
  constructor(canvas, opz) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cielo = creaCielo(opz.stretto ? 300 : 600);
    this.prMax = 1.25;
    this.alone = 0.6;
    this.brilla = 1;
    this.tipo = '2d';
  }
  imposta({ prMax, alone, brilla }) {
    if (prMax != null) { this.prMax = Math.min(prMax, 1.25); this.dimensiona(this.W, this.H, true); }
    if (alone != null) this.alone = alone;
    if (brilla != null) this.brilla = brilla;
  }
  dimensiona(W, H, forza = false) {
    if (!forza && W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    this.pr = Math.min(window.devicePixelRatio || 1, this.prMax);
    this.canvas.width = Math.round(W * this.pr); this.canvas.height = Math.round(H * this.pr);
  }
  disegna(lista, cam, tempo) {
    const c = this.ctx, W = this.W, H = this.H, pr = this.pr;
    c.setTransform(pr, 0, 0, pr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#050507'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    const pro = (x, y, z) => cam.proietta(x, y, z, W, H);
    const rgba = (r, g, b, a) => `rgba(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0},${a.toFixed(3)})`;
    for (const s of this.cielo) {
      const q = pro(s.x, s.y, s.z); if (!q || q[0] < -4 || q[0] > W + 4 || q[1] < -4 || q[1] > H + 4) continue;
      const tw = 1 - this.brilla * 0.35 * (0.5 + 0.5 * Math.sin(tempo * 1.7 + s.fase * 3));
      c.fillStyle = rgba(s.c[0], s.c[1], s.c[2], s.luce * tw * 0.8);
      const r = Math.max(0.5, s.size * q[2] * 0.25); c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2);
    }
    const P = lista.pt;
    for (let i = 0; i < lista.nPt; i++) {
      const o = i * PT, q = pro(P[o], P[o + 1], P[o + 2]); if (!q) continue;
      const r = Math.min(240, (P[o + 3] * q[2]) / 2); if (q[0] < -r || q[0] > W + r || q[1] < -r || q[1] > H + r) continue;
      const g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
      g.addColorStop(0, rgba(P[o + 4], P[o + 5], P[o + 6], P[o + 7])); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2);
    }
    c.lineCap = 'round';
    const S = lista.seg;
    for (let pass = 0; pass < (this.alone > 0.3 ? 2 : 1); pass++) {
      for (let i = 0; i < lista.nSeg; i++) {
        const o = i * SEG;
        if (pass === 0 && S[o + 10] < 1.8) continue;
        const a = pro(S[o], S[o + 1], S[o + 2]), b = pro(S[o + 3], S[o + 4], S[o + 5]);
        if (!a || !b) continue;
        if ((a[0] < 0 && b[0] < 0) || (a[0] > W && b[0] > W) || (a[1] < 0 && b[1] < 0) || (a[1] > H && b[1] > H)) continue;
        c.strokeStyle = rgba(S[o + 6], S[o + 7], S[o + 8], pass === 0 ? S[o + 9] * 0.18 : S[o + 9]);
        c.lineWidth = pass === 0 ? S[o + 10] * 3.2 : S[o + 10];
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    }
  }
}

/** Prova WebGL con Three.js; se non c'è (o fallisce), ripiega su Canvas 2D */
export async function creaRenderer(canvas, opz) {
  if (!opz.forza2d) {
    try {
      const prova = document.createElement('canvas');
      const ok = !!(prova.getContext('webgl2') || prova.getContext('webgl'));
      if (ok) {
        const THREE = await import('three');
        return new RendererGL(THREE, canvas, opz);
      }
    } catch (e) {
      console.warn('AstroMath: WebGL non disponibile, uso il disegno 2D', e);
      // una tela che ha già un contesto WebGL non può dare un contesto 2D: si sostituisce
      const nuova = canvas.cloneNode(false);
      canvas.replaceWith(nuova);
      return new Renderer2D(nuova, opz);
    }
  }
  return new Renderer2D(canvas, opz);
}

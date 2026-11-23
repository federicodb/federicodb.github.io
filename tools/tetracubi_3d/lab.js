/* ================= LABORATORIO SET 3D =================
   Genera un set di tetracubi (pezzi da 4 cubi) partizionando un solido:
   la partizione è la soluzione, quindi il set si rimonta senza vuoti.
   Esporta un 3MF con i pezzi già disposti, piatti e senza supporti,
   su un solo piatto della stampante scelta. */

const LAB = (() => {
  const PRINTERS = { mini: 180, a1: 256, p2s: 256 };
  const SHAPES_L = { '444': [4, 4, 4], '442': [4, 4, 2], '432': [4, 3, 2], '222': [2, 2, 2] };
  const PALETTE = [0xfb7185, 0x2dd4bf, 0xa3e635, 0x818cf8, 0xfbbf24,
                   0xf0abfc, 0x38bdf8, 0xfdba74, 0x86efac, 0xe2e8f0];
  const GAP = 3, MARGIN = 6;           // mm fra pezzi e dal bordo piatto
  const CLEARANCE = 0.2;               // mm di gioco totale per pezzo (stampa PLA)
  // Dimensione di stampa fissa: il pezzo è disegnato con cubi da 20 mm (gioco 0,2 mm)
  // e poi scalato in modo uniforme, come «Scala» in Bambu Studio, finché i pezzi più
  // alti (due cubi sovrapposti, 1,96 unità con i bordi smussati) misurano 20 mm.
  // SCALA = 20 / (1,96 × 19,8) = 51,54 %, unità effettiva circa 10,3 mm.
  // Chi li vuole più grandi li scala nello slicer.
  const UNITA_MODELLO = 20, ALTEZZA_PEZZI_ALTI = 20;
  const SCALA = ALTEZZA_PEZZI_ALTI / (1.96 * (UNITA_MODELLO - CLEARANCE));
  const UNITA = UNITA_MODELLO * SCALA;

  /* ---- scena ---- */
  const labScene = new THREE.Scene();
  labScene.background = new THREE.Color(0x05070d);
  labScene.fog = new THREE.Fog(0x05070d, 70, 190);
  labScene.add(new THREE.AmbientLight(0x8899bb, .7));
  const lkey = new THREE.DirectionalLight(0xffffff, 1.8);
  lkey.position.set(20, 35, 15);
  lkey.castShadow = true;
  lkey.shadow.mapSize.set(2048, 2048);
  Object.assign(lkey.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 2, far: 140 });
  labScene.add(lkey);
  const lfill = new THREE.DirectionalLight(0x6688ff, .5);
  lfill.position.set(-18, 12, -20);
  labScene.add(lfill);

  const labRoot = new THREE.Group();
  labScene.add(labRoot);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x0a101c, roughness: .95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  labScene.add(ground);
  let boxOutline = null, plateVis = null;

  /* ---- stato ---- */
  let active = false, view = 'puzzle';
  let pieces = [], pieceMats = [];
  let box = [4, 4, 4], unit = UNITA, plate = 256, plateW = 0, plateD = 0;
  let asm = 1, exp = 0, playing = false;
  let hovered = -1;

  /* ---- utilità ---- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function mulberry(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---- le 24 rotazioni del cubo (riusa rotCell del gioco) ---- */
  const ROTS = (() => {
    const seen = new Map();
    const basis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
      const f = v => {
        let r = v;
        for (let i = 0; i < a; i++) r = rotCell(r, 'x', 1);
        for (let i = 0; i < b; i++) r = rotCell(r, 'y', 1);
        for (let i = 0; i < c; i++) r = rotCell(r, 'z', 1);
        return r;
      };
      const key = basis.map(f).flat().join(',');
      if (!seen.has(key)) seen.set(key, f);
    }
    return [...seen.values()];
  })();

  function canon(cells) {
    let best = null;
    for (const f of ROTS) {
      const cs = cells.map(f);
      const m = [0, 1, 2].map(i => Math.min(...cs.map(c => c[i])));
      const n = cs.map(c => [c[0] - m[0], c[1] - m[1], c[2] - m[2]])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      const k = n.map(c => c.join(',')).join('|');
      if (!best || k < best) best = k;
    }
    return best;
  }
  const BASE = {
    I: [[0,0,0],[1,0,0],[2,0,0],[3,0,0]],
    O: [[0,0,0],[1,0,0],[0,1,0],[1,1,0]],
    T: [[0,0,0],[1,0,0],[2,0,0],[1,1,0]],
    L: [[0,0,0],[1,0,0],[2,0,0],[0,1,0]],
    S: [[0,0,0],[1,0,0],[1,1,0],[2,1,0]],
    Torre: [[0,0,0],[1,0,0],[1,1,0],[1,0,1]],
    'Vite+': [[0,0,0],[1,0,0],[1,1,0],[0,0,1]],
    'Vite-': [[0,0,0],[1,0,0],[1,1,0],[1,1,1]],
  };
  const NAME_OF = {};
  for (const [n, cs] of Object.entries(BASE)) NAME_OF[canon(cs)] = n;

  /* ---- partizione randomica del solido (garanzia senza vuoti) ---- */
  function generate(bx, by, bz) {
    const total = bx * by * bz;
    const id = (x, y, z) => (y * bz + z) * bx + x;
    const cells = [];
    for (let y = 0; y < by; y++) for (let z = 0; z < bz; z++) for (let x = 0; x < bx; x++)
      cells.push([x, y, z]);
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (let attempt = 0; attempt < 40; attempt++) {
      const g = new Int8Array(total).fill(-1);
      const out = [];
      let nodes = 0;
      const placements = seed => {
        const found = [];
        const grow = (cs, set) => {
          if (cs.length === 4) { found.push(cs.slice()); return; }
          const opts = [];
          for (const c of cs) for (const d of dirs) {
            const n = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
            if (n[0] < 0 || n[0] >= bx || n[1] < 0 || n[1] >= by || n[2] < 0 || n[2] >= bz) continue;
            const k = n.join(',');
            if (g[id(...n)] !== -1 || set.has(k)) continue;
            opts.push([n, k]);
          }
          shuffle(opts);
          for (const [n, k] of opts) {
            set.add(k); cs.push(n);
            grow(cs, set);
            cs.pop(); set.delete(k);
          }
        };
        grow([seed], new Set([seed.join(',')]));
        const seen = new Set(), uniq = [];
        for (const cs of found) {
          const k = canon(cs);
          if (!seen.has(k)) { seen.add(k); uniq.push(cs); }
        }
        return shuffle(uniq);
      };
      const solve = () => {
        if (++nodes > 60000) return false;
        const seed = cells.find(c => g[id(...c)] === -1);
        if (!seed) return true;
        for (const cs of placements(seed)) {
          for (const c of cs) g[id(...c)] = out.length;
          out.push(cs);
          if (solve()) return true;
          out.pop();
          for (const c of cs) g[id(...c)] = -1;
        }
        return false;
      };
      if (solve()) return out;
    }
    return null;
  }

  /* ---- set minimo non banale: le tre partizioni del cubo 2x2x2 ----
     Verificate per esaustione: con un solo pezzo il solido è sempre un
     quadrato (2x2x1) o una barra (1x1x4); con due pezzi 8 cubi bastano e
     le uniche soluzioni non banali sono due pezzi IDENTICI:
     Torre+Torre, Vite+ + Vite+, Vite- + Vite- (e L+L in una lastra 1x2x4). */
  const MIN_TILINGS = [
    [ // Torre + Torre: due angoli 3D che si incastrano nel cubo
      [[0,0,1],[0,1,0],[0,1,1],[1,1,1]],
      [[0,0,0],[1,0,0],[1,0,1],[1,1,0]],
    ],
    [ // Vite + Vite (stesso verso)
      [[0,0,1],[0,1,0],[0,1,1],[1,1,0]],
      [[0,0,0],[1,0,0],[1,0,1],[1,1,1]],
    ],
    [ // Vite - + Vite - (verso opposto)
      [[0,0,1],[0,1,0],[0,1,1],[1,0,1]],
      [[0,0,0],[1,0,0],[1,1,0],[1,1,1]],
    ],
  ];
  function minimalSet() {
    const t = MIN_TILINGS[Math.floor(Math.random() * MIN_TILINGS.length)];
    return t.map(cs => cs.map(c => c.slice()));
  }

  /* ---- orientamento di stampa: più piatto possibile, niente sbalzi ---- */
  function flatten(cells) {
    let best = null;
    for (const f of ROTS) {
      const cs = cells.map(f);
      const m = [0, 1, 2].map(i => Math.min(...cs.map(c => c[i])));
      const n = cs.map(c => [c[0] - m[0], c[1] - m[1], c[2] - m[2]]);
      const w = Math.max(...n.map(c => c[0])) + 1;
      const h = Math.max(...n.map(c => c[1])) + 1;
      const d = Math.max(...n.map(c => c[2])) + 1;
      const set = new Set(n.map(c => c.join(',')));
      if (!n.every(c => c[1] === 0 || set.has([c[0], c[1] - 1, c[2]].join(',')))) continue;
      const score = [h, w * d, w];
      if (!best || score[0] < best.score[0] ||
          (score[0] === best.score[0] && score[1] < best.score[1]) ||
          (score[0] === best.score[0] && score[1] === best.score[1] && score[2] < best.score[2]))
        best = { cells: n, w, h, d, score };
    }
    return best;
  }

  /* ---- packing a corsie + unità massima che sta sul piatto ---- */
  function pack(items, size) {
    const sorted = items.slice().sort((a, b) => b.d - a.d);
    let x = MARGIN, y = MARGIN, rowD = 0, maxW = 0;
    for (const it of sorted) {
      if (x + it.w > size - MARGIN) { x = MARGIN; y += rowD + GAP; rowD = 0; }
      it.px = x; it.py = y;
      x += it.w + GAP;
      rowD = Math.max(rowD, it.d);
      maxW = Math.max(maxW, x - GAP);
    }
    return { W: maxW, D: y + rowD };
  }
  // il layout viene centrato sul piatto: leggibile anche in Bambu Studio
  function centerLayout(items, r) {
    const usedW = r.W - MARGIN, usedD = r.D - MARGIN;
    const dx = (plate - usedW) / 2 - MARGIN, dy = (plate - usedD) / 2 - MARGIN;
    for (const it of items) it.p.plate = { px: it.px + dx, py: it.py + dy };
    plateW = usedW; plateD = usedD;
  }
  function fitAndPack() {
    plate = PRINTERS[$('labPrinter').value] || 256;
    unit = UNITA;
    const items = pieces.map(p => ({ p, w: p.flat.w * unit, d: p.flat.d * unit }));
    centerLayout(items, pack(items, plate));
  }

  /* ---- costruzione mesh e scena ---- */
  function clearPieces() {
    labRoot.clear();
    pieceMats.forEach(m => m.dispose());
    pieceMats = [];
    pieces = [];
    hovered = -1;
  }

  function buildSet() {
    const dims = SHAPES_L[$('labShape').value] || SHAPES_L['444'];
    box = dims;
    const raw = $('labShape').value === '222' ? minimalSet() : generate(...dims);
    if (!raw) { $('labStats').innerHTML = '<div class="srow"><span>Generazione fallita, riprova</span></div>'; return; }
    clearPieces();
    const rnd = mulberry((Math.random() * 2 ** 32) >>> 0);
    const bc = [(dims[0] - 1) / 2, (dims[1] - 1) / 2, (dims[2] - 1) / 2];
    const diag = Math.hypot(...dims);
    raw.forEach((cells, i) => {
      const centroid = [0, 1, 2].map(k => cells.reduce((s, c) => s + c[k], 0) / 4);
      let dir = new THREE.Vector3(centroid[0] - bc[0], centroid[1] - bc[1], centroid[2] - bc[2]);
      if (dir.length() < .01) dir = new THREE.Vector3(rnd() - .5, rnd() - .5, rnd() - .5);
      dir.normalize();
      const mat = new THREE.MeshStandardMaterial({
        color: PALETTE[i % PALETTE.length], roughness: .35, metalness: .12,
        emissive: PALETTE[i % PALETTE.length], emissiveIntensity: .25,
      });
      pieceMats.push(mat);
      const group = new THREE.Group();
      const meshes = cells.map(() => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = m.receiveShadow = true;
        m.userData.pi = i;
        group.add(m);
        return m;
      });
      labRoot.add(group);
      const asmPos = new THREE.Vector3(centroid[0] - bc[0], centroid[1] - bc[1], centroid[2] - bc[2]);
      const startPos = asmPos.clone().addScaledVector(dir, diag * 1.5).add(new THREE.Vector3(0, diag * .5, 0));
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 1.2 - .6, rnd() * Math.PI * 2, rnd() * 1.2 - .6));
      pieces.push({
        cells, name: NAME_OF[canon(cells)] || '?', flat: flatten(cells),
        centroid, dir, group, meshes, mat, asmPos, startPos, q0,
        puzzleOffsets: cells.map(c => [c[0] - centroid[0], c[1] - centroid[1], c[2] - centroid[2]]),
        minOffY: Math.min(...cells.map(c => c[1] - centroid[1])),
        plate: { px: 0, py: 0 },
      });
    });
    fitAndPack();
    asm = 1; exp = 0; playing = false;
    $('asmSlider').value = 1000; $('expSlider').value = 0;
    $('btnPlayAsm').textContent = 'Monta';
    buildStatics();
    applyView(false);
    renderStats();
  }

  function buildStatics() {
    if (boxOutline) { labScene.remove(boxOutline); boxOutline.geometry.dispose(); }
    boxOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(...box)),
      new THREE.LineBasicMaterial({ color: 0x6ea8ff, transparent: true, opacity: .55 })
    );
    labScene.add(boxOutline);
    if (plateVis) { labScene.remove(plateVis); plateVis.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    plateVis = new THREE.Group();
    const pu = plate / unit, h = pu / 2;
    const pts = [];
    for (let i = 0; i <= Math.ceil(pu); i++) {
      const v = Math.min(i, pu) - h;
      pts.push(v, 0, -h, v, 0, h, -h, 0, v, h, 0, v);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    plateVis.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x1d2a40, transparent: true, opacity: .9 })));
    const rim = [-h,.02,-h, h,.02,-h, h,.02,-h, h,.02,h, h,.02,h, -h,.02,h, -h,.02,h, -h,.02,-h];
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(rim, 3));
    plateVis.add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0x6ea8ff })));
    labScene.add(plateVis);
  }

  function applyView(resetCam = true) {
    const puzzle = view === 'puzzle';
    boxOutline.visible = puzzle;
    plateVis.visible = !puzzle;
    ground.position.y = puzzle ? -box[1] / 2 - .06 : -.06;
    $('asmSlider').disabled = !puzzle;
    $('expSlider').disabled = !puzzle;
    $('btnPlayAsm').disabled = !puzzle;
    for (const p of pieces) {
      if (puzzle) {
        p.meshes.forEach((m, k) => m.position.set(...p.puzzleOffsets[k]));
      } else {
        const fc = [(p.flat.w - 1) / 2, 0, (p.flat.d - 1) / 2];
        p.meshes.forEach((m, k) => {
          const c = p.flat.cells[k];
          m.position.set(c[0] - fc[0], c[1] + .5, c[2] - fc[2]);
        });
        const pu = plate / unit;
        p.group.position.set(
          (p.plate.px + p.flat.w * unit / 2) / unit - pu / 2, 0,
          (p.plate.py + p.flat.d * unit / 2) / unit - pu / 2
        );
        p.group.quaternion.identity();
      }
    }
    if (!puzzle) { playing = false; $('btnPlayAsm').textContent = 'Monta'; }
    if (resetCam) resetLabCamera();
  }

  function plateFrame() {
    const pu = plate / unit;
    if (!pieces.length) return { cx: 0, cz: 0, span: pu };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pieces) {
      x0 = Math.min(x0, p.plate.px); y0 = Math.min(y0, p.plate.py);
      x1 = Math.max(x1, p.plate.px + p.flat.w * unit);
      y1 = Math.max(y1, p.plate.py + p.flat.d * unit);
    }
    return {
      cx: ((x0 + x1) / 2) / unit - pu / 2,
      cz: ((y0 + y1) / 2) / unit - pu / 2,
      span: Math.max(x1 - x0, y1 - y0) / unit,
    };
  }

  function resetLabCamera() {
    if (view === 'puzzle') {
      const diag = Math.hypot(...box);
      camera.position.set(diag * 1.3, diag * 1.0, diag * 1.5);
      controls.target.set(0, 0, 0);
    } else {
      // inquadra l'area occupata: i set piccoli non finiscono in un angolo
      const pu = plate / unit, f = plateFrame();
      const frame = clamp(f.span * 2.0, pu * .55, pu * 1.0);
      camera.position.set(f.cx, frame * 1.05, f.cz + frame * .9);
      controls.target.set(f.cx, 0, f.cz);
    }
    controls.update();
  }

  function renderStats() {
    const n = pieces.length;
    const V = n * 4 * unit ** 3;             // mm³ lordi
    const extr = V * .42;                    // pareti + top/bottom + infill 15%
    const secs = extr / 12 * 1.25;           // flusso medio ~12 mm³/s + overhead
    const grams = extr * 1.24 / 1000;
    const hh = Math.floor(secs / 3600), mm = Math.round((secs % 3600) / 60);
    const f1 = x => x.toLocaleString('it-IT', { maximumFractionDigits: 1 });
    const lati = [box[0], box[2], box[1]];
    const cubetti = box[0] * box[1] * box[2];
    const rows = [
      ['Cubetti', `${lati.join(' × ')} = ${cubetti} = ${n} × 4`],
      ['Lato del cubetto', `${f1(unit)} mm`],
      ['Pezzi più alti', `${f1(ALTEZZA_PEZZI_ALTI)} mm · ${(SCALA * 100).toLocaleString('it-IT', { maximumFractionDigits: 2 })}%`],
      ['Solido montato', `${lati.map(l => Math.round(l * unit)).join(' × ')} mm`],
      ['Ingombro sul piatto', `${Math.round(plateW)} × ${Math.round(plateD)} mm`],
      ['Stima di stampa', `${hh ? `${hh} h ${String(mm).padStart(2, '0')} min` : `${mm} min`} · ${Math.round(grams)} g`],
    ];
    $('labStats').innerHTML = rows.map(([a, b]) =>
      `<div class="srow"><span>${a}</span><span>${b}</span></div>`).join('');
  }

  /* ---- animazione montaggio / esplosione ---- */
  const _v = new THREE.Vector3();
  const _q = new THREE.Quaternion();
  function update(dt) {
    if (view !== 'puzzle') return;
    if (playing) {
      asm += dt / 7000;
      if (asm >= 1) { asm = 1; playing = false; $('btnPlayAsm').textContent = 'Monta'; }
      $('asmSlider').value = Math.round(asm * 1000);
    }
    const N = pieces.length;
    const diag = Math.hypot(...box);
    let minY = Infinity;
    pieces.forEach((p, i) => {
      const t = ease(clamp(asm * (N + 2) - i, 0, 1));
      _v.lerpVectors(p.startPos, p.asmPos, t);
      _v.addScaledVector(p.dir, exp * diag * .9);
      p.group.position.copy(_v);
      p.group.quaternion.slerpQuaternions(p.q0, _q.identity(), t);
      minY = Math.min(minY, _v.y + p.minOffY);
    });
    // il pavimento segue il pezzo più basso: nessun pezzo può finirgli sotto
    ground.position.y = Math.min(-box[1] / 2 - .06, minY - .54);
  }

  /* ---- hover ---- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tip = $('labTip');
  renderer.domElement.addEventListener('pointermove', e => {
    if (!active) { tip.hidden = true; return; }
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(labRoot.children, true)[0];
    const pi = hit ? hit.object.userData.pi : -1;
    if (pi !== hovered) {
      if (hovered >= 0 && pieces[hovered]) pieces[hovered].mat.emissiveIntensity = .25;
      hovered = pi;
      if (pi >= 0) pieces[pi].mat.emissiveIntensity = .65;
    }
    if (pi >= 0) {
      tip.hidden = false;
      tip.textContent = `Pezzo ${pi + 1} · ${pieces[pi].name} · 4 cubi`;
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top = (e.clientY + 10) + 'px';
    } else tip.hidden = true;
  });

  /* ================= export 3MF ================= */
  const enc = s => new TextEncoder().encode(s);
  function crc32(u8) {
    const t = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) crc = t[(crc ^ u8[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  async function deflateRaw(u8) {
    if (typeof CompressionStream === 'undefined') return null;
    try {
      const stream = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch { return null; }
  }
  async function zipStore(files) {
    const parts = [], central = [];
    let offset = 0;
    const d = new Date();
    const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const nameB = enc(f.name), crc = crc32(f.data), usize = f.data.length;
      let data = f.data, method = 0;
      const def = await deflateRaw(f.data);
      if (def && def.length < usize) { data = def; method = 8; }
      const csize = data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true);
      lh.setUint16(8, method, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, csize, true); lh.setUint32(22, usize, true);
      lh.setUint16(26, nameB.length, true);
      parts.push(new Uint8Array(lh.buffer), nameB, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
      ch.setUint16(10, method, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, csize, true); ch.setUint32(24, usize, true);
      ch.setUint16(28, nameB.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nameB);
      offset += 30 + nameB.length + csize;
    }
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const eo = new DataView(new ArrayBuffer(22));
    eo.setUint32(0, 0x06054b50, true);
    eo.setUint16(8, files.length, true); eo.setUint16(10, files.length, true);
    eo.setUint32(12, cdSize, true); eo.setUint32(16, offset, true);
    const all = [...parts, ...central, new Uint8Array(eo.buffer)];
    const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
    let o = 0;
    for (const p of all) { out.set(p, o); o += p.length; }
    return out;
  }

  const FACES = [
    [[1,0,0], [[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],
    [[-1,0,0], [[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],
    [[0,1,0], [[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],
    [[0,-1,0], [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],
    [[0,0,1], [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],
    [[0,0,-1], [[0,0,0],[0,1,0],[1,1,0],[1,0,0]]],
  ];
  // template identico al viewer: stessi cubi bevelati 0.96, raggio 0.07
  const CUBE = (() => {
    const g = new RoundedBoxGeometry(.96, .96, .96, 3, .07);
    const p = g.attributes.position;
    const verts = [];
    for (let i = 0; i < p.count; i++) verts.push([p.getX(i), p.getY(i), p.getZ(i)]);
    const tris = [];
    if (g.index) for (let i = 0; i < g.index.count; i += 3)
      tris.push([g.index.getX(i), g.index.getX(i + 1), g.index.getX(i + 2)]);
    else for (let i = 0; i < p.count; i += 3) tris.push([i, i + 1, i + 2]);
    g.dispose();
    return { verts, tris };
  })();

  // mesh in mm, z-up: cubi bevelati separati dai solchi (come a schermo)
  // + micro-ponti interni nelle giunzioni => un solo corpo stampabile
  function meshFor(cells, u) {
    const s = (u - CLEARANCE) / u;
    const mn = [0, 1, 2].map(i => Math.min(...cells.map(c => c[i])));
    const mx = [0, 1, 2].map(i => Math.max(...cells.map(c => c[i])) + 1);
    const center = [0, 1, 2].map(i => (mn[i] + mx[i]) / 2);
    const toPrint = c => [c[0] * u, c[2] * u, c[1] * u];
    const cp = toPrint(center);
    const verts = [], tris = [];
    const vmap = new Map();
    const push = cell => {
      const raw = toPrint(cell);
      const v = raw.map((x, i) => (x - cp[i]) * s + cp[i]);
      const k = v.map(x => x.toFixed(4)).join(',');
      if (vmap.has(k)) return vmap.get(k);
      vmap.set(k, verts.length);
      verts.push(v);
      return verts.length - 1;
    };
    for (const c of cells) {
      const ids = CUBE.verts.map(v => push([c[0] + v[0], c[1] + v[1], c[2] + v[2]]));
      // toPrint scambia y/z (riflessione): winding invertito per normali esterne
      for (const t of CUBE.tris) tris.push([ids[t[0]], ids[t[2]], ids[t[1]]]);
    }
    const set = new Set(cells.map(c => c.join(',')));
    const addBox = (center, half) => {
      const ids = [];
      for (let k = 0; k < 8; k++) {
        const kk = [k & 1, (k >> 1) & 1, (k >> 2) & 1];
        ids.push(push([
          center[0] + (kk[0] * 2 - 1) * half[0],
          center[1] + (kk[1] * 2 - 1) * half[1],
          center[2] + (kk[2] * 2 - 1) * half[2],
        ]));
      }
      for (const [d, cs] of FACES) {
        const q = cs.map(k => ids[k[0] + k[1] * 2 + k[2] * 4]);
        const [a, b, c] = q.map(i => verts[i]);
        const n = [
          (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
          (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
        ];
        const dp = toPrint(d);
        if (n[0] * dp[0] + n[1] * dp[1] + n[2] * dp[2] > 0)
          tris.push([q[0], q[1], q[2]], [q[0], q[2], q[3]]);
        else tris.push([q[0], q[2], q[1]], [q[0], q[3], q[2]]);
      }
    };
    for (const c of cells) for (const d of [[1,0,0],[0,1,0],[0,0,1]]) {
      const nb = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
      if (!set.has(nb.join(','))) continue;
      addBox(
        [c[0] + d[0] * .5, c[1] + d[1] * .5, c[2] + d[2] * .5],
        [0, 1, 2].map(i => d[i] ? .12 : .275)
      );
    }
    const min = [0, 1, 2].map(i => Math.min(...verts.map(v => v[i])));
    return { verts: verts.map(v => v.map((x, i) => x - min[i])), tris };
  }

  async function exportBytes() {
    const objs = [], items = [];
    pieces.forEach((p, i) => {
      const m = meshFor(p.flat.cells, UNITA_MODELLO);
      const verts = m.verts.map(v => v.map(x => x * SCALA)), tris = m.tris;
      const vx = verts.map(v => `<vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}"/>`).join('');
      const tx = tris.map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('');
      objs.push(`<object id="${i + 1}" type="model"><metadata name="name">P${String(i + 1).padStart(2, '0')} ${p.name}</metadata><mesh><vertices>${vx}</vertices><triangles>${tx}</triangles></mesh></object>`);
      items.push(`<item objectid="${i + 1}" transform="1 0 0 0 1 0 0 0 1 ${p.plate.px.toFixed(3)} ${p.plate.py.toFixed(3)} 0"/>`);
    });
    const model = `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="it-IT" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Application">Tetracubi 3D, Orfini Math Lab</metadata><resources>${objs.join('')}</resources><build>${items.join('')}</build></model>`;
    const ct = `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
    return zipStore([
      { name: '[Content_Types].xml', data: enc(ct) },
      { name: '_rels/.rels', data: enc(rels) },
      { name: '3D/3dmodel.model', data: enc(model) },
    ]);
  }

  async function download() {
    if (!pieces.length) return;
    const bytes = await exportBytes();
    const blob = new Blob([bytes], { type: 'model/3mf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tetracubi-set-${$('labShape').value}-${$('labPrinter').value}.3mf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ================= flusso / UI ================= */
  function enter() {
    active = true;
    document.body.dataset.mode = 'lab';
    if (state === 'clearing') finishClear();
    if (state === 'playing') { setState('paused'); clearDas(); softDrop = false; }
    pauseOv.hidden = true;
    renderPass.scene = labScene;
    orbitOn = !reducedMotion;
    paintOrbit();
    controls.minDistance = 3;
    controls.maxDistance = 220;
    if (!pieces.length) buildSet();
    resetLabCamera();
    tip.hidden = true;
  }
  function exit() {
    active = false;
    document.body.dataset.mode = 'game';
    renderPass.scene = scene;
    controls.minDistance = 7;
    controls.maxDistance = 48;
    resetCamera();
    tip.hidden = true;
    orbitOn = (state === 'menu' || state === 'over') && !reducedMotion;
    paintOrbit();
    if (state === 'paused') pauseOv.hidden = false;
  }

  $('btnLab').addEventListener('click', () => { unlockAudio(); active ? exit() : enter(); });
  $('btnBackGame').addEventListener('click', exit);
  $('btnGen').addEventListener('click', buildSet);
  $('labShape').addEventListener('change', buildSet);
  $('labPrinter').addEventListener('change', () => {
    if (!pieces.length) return;
    fitAndPack(); buildStatics(); applyView(false); renderStats();
  });
  $('viewPuzzle').addEventListener('click', () => {
    view = 'puzzle';
    $('viewPuzzle').setAttribute('aria-pressed', 'true');
    $('viewPlate').setAttribute('aria-pressed', 'false');
    applyView();
  });
  $('viewPlate').addEventListener('click', () => {
    view = 'plate';
    $('viewPlate').setAttribute('aria-pressed', 'true');
    $('viewPuzzle').setAttribute('aria-pressed', 'false');
    applyView();
  });
  $('asmSlider').addEventListener('input', e => {
    asm = e.target.value / 1000;
    playing = false;
    $('btnPlayAsm').textContent = 'Monta';
  });
  $('expSlider').addEventListener('input', e => { exp = e.target.value / 100; });
  $('btnPlayAsm').addEventListener('click', () => {
    if (playing) { playing = false; $('btnPlayAsm').textContent = 'Monta'; return; }
    if (asm >= 1) asm = 0;
    playing = true;
    $('btnPlayAsm').textContent = 'Ferma';
  });
  $('btnDownload').addEventListener('click', download);

  return {
    enter, exit, update, download,
    get active() { return active; },
    regenerate: buildSet,
    setAsm: v => { asm = clamp(v, 0, 1); $('asmSlider').value = Math.round(asm * 1000); },
    setExp: v => { exp = clamp(v, 0, 1); $('expSlider').value = Math.round(exp * 100); },
    setView: v => { view = v; applyView(); },
    resetCamera: resetLabCamera,
    debug: () => ({
      groundY: ground.position.y,
      minY: Math.min(...pieces.map(p => p.group.position.y + p.minOffY)),
      camX: camera.position.x, camZ: camera.position.z,
      auto: controls.autoRotate,
    }),
    info: () => {
      const total = box[0] * box[1] * box[2];
      const seen = new Set();
      let covered = 0;
      for (const p of pieces) for (const c of p.cells) {
        const k = c.join(',');
        if (!seen.has(k)) { seen.add(k); covered++; }
      }
      return {
        pieces: pieces.length, names: pieces.map(p => p.name),
        covered, total, gapFree: covered === total && pieces.length * 4 === total,
        unit, plate, plateW: Math.round(plateW), plateD: Math.round(plateD),
        fits: plateW <= plate && plateD <= plate,
        maxPrintH: Math.max(...pieces.map(p => p.flat.h)) * 1.96 * (UNITA_MODELLO - CLEARANCE) * SCALA / 2,
        scala: SCALA,
      };
    },
    exportBase64: async () => {
      const b = await exportBytes();
      let s = '';
      for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
      return btoa(s);
    },
  };
})();
window.__lab = LAB;
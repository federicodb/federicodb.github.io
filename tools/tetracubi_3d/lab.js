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
  // Dimensione di stampa fissa, in mm reali (scala 100% nello slicer):
  // - CLEARANCE: gioco fra due pezzi vicini (0,1 mm per lato);
  // - i pezzi più alti (due cubetti) misurano 20 mm: 2 × UNITA − gioco = 20;
  // - ogni pezzo è un blocco pieno: i cubetti si compenetrano di SOVRAPP e fra
  //   l'uno e l'altro resta solo una scanalatura a 45° profonda SMUSSO − SOVRAPP;
  // - tutti gli smussi sono a 45°, quindi nessuno sbalzo supera i 45°.
  // Chi li vuole più grandi li scala nello slicer.
  const CLEARANCE = 0.2, ALTEZZA_PEZZI_ALTI = 20;
  const UNITA = (ALTEZZA_PEZZI_ALTI + CLEARANCE) / 2;      // 10,1 mm
  const SMUSSO = 0.8, SOVRAPP = 0.4;                       // mm
  const labGeo = mask => cellGeometry(mask, CLEARANCE / 2 / UNITA, SOVRAPP / UNITA, SMUSSO / UNITA);
  const SOLIDI = { '444': 'Cubo 4 × 4 × 4', '442': 'Blocco 4 × 4 × 2', '432': 'Blocco 4 × 3 × 2', '222': 'Cubo 2 × 2 × 2' };

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
  function shuffle(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /* ---- codice del set: forma + seme (5 caratteri, 25 bit) ----
     Lo stesso codice rigenera sempre lo stesso set: compare nel nome del 3MF
     e del PDF e si può riaprire con ?set=CODICE. */
  const ALFA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const codeOf = (shape, seed) => {
    let t = '';
    for (let i = 0; i < 5; i++) t = ALFA[(seed >>> (5 * i)) & 31] + t;
    return `${shape}-${t}`;
  };
  function parseCode(str) {
    const m = String(str || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V')
      .match(/^\s*(444|442|432|222)\s*[-\s]?\s*([0-9A-Z]{5})\s*$/);
    if (!m) return null;
    let seed = 0;
    for (const ch of m[2]) seed = seed * 32 + ALFA.indexOf(ch);
    return { shape: m[1], seed: seed >>> 0 };
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
  function generate(bx, by, bz, rnd) {
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
          shuffle(opts, rnd);
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
        return shuffle(uniq, rnd);
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
  function minimalSet(rnd) {
    const t = MIN_TILINGS[Math.floor(rnd() * MIN_TILINGS.length)];
    return t.map(cs => cs.map(c => c.slice()));
  }

  /* ---- ordine di montaggio ----
     Si smonta il solido al contrario: a ogni passo si toglie un pezzo che esce
     in linea retta senza urtare gli altri (prima verso l'alto, poi di lato),
     partendo dai più alti. Il montaggio è la sequenza rovesciata: ogni pezzo
     entra dalla direzione da cui era uscito. Togliere un pezzo libera solo
     spazio, quindi la scelta golosa non si blocca mai se una sequenza esiste. */
  const VIE = [
    ['alto', [0, 1, 0], "entra dall'alto"],
    ['+x', [1, 0, 0], 'entra da destra'],
    ['+z', [0, 0, 1], 'entra da sinistra'],
    ['-x', [-1, 0, 0], 'entra da dietro, a sinistra'],
    ['-z', [0, 0, -1], 'entra da dietro, a destra'],
  ];
  function assemblyPlan(raw, dims) {
    const owner = new Map();
    raw.forEach((cs, i) => cs.forEach(c => owner.set(c.join(','), i)));
    const left = new Set(raw.map((_, i) => i));
    const inside = n => n.every((v, k) => v >= 0 && v < dims[k]);
    const free = (i, d) => raw[i].every(c => {
      for (let k = 1; ; k++) {
        const n = [c[0] + d[0] * k, c[1] + d[1] * k, c[2] + d[2] * k];
        if (!inside(n)) return true;
        const o = owner.get(n.join(','));
        if (o !== undefined && o !== i && left.has(o)) return false;
      }
    });
    const top = i => Math.max(...raw[i].map(c => c[1]));
    const front = i => raw[i].reduce((t, c) => t + c[0] + c[2], 0);
    const out = [];
    while (left.size) {
      let pick = null;
      for (const [via, d, testo] of VIE) {
        const cand = [...left].filter(i => free(i, d));
        if (!cand.length) continue;
        cand.sort((a, b) => top(b) - top(a) || front(b) - front(a) || a - b);
        pick = { i: cand[0], via, d, testo };
        break;
      }
      if (!pick) {
        const i = [...left].sort((a, b) => top(b) - top(a) || a - b)[0];
        pick = { i, via: 'alto', d: [0, 1, 0], testo: "entra dall'alto, inclinandolo", forzato: true };
      }
      left.delete(pick.i);
      out.push(pick);
    }
    return out.reverse();
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

  let code = '';
  function buildSet(wanted) {
    const parsed = parseCode(wanted);
    if (parsed) $('labShape').value = parsed.shape;
    const shape = $('labShape').value in SHAPES_L ? $('labShape').value : '444';
    const seed = parsed ? parsed.seed : (Math.random() * 2 ** 25) >>> 0;
    const dims = SHAPES_L[shape];
    box = dims;
    const gen = mulberry(seed);
    const raw0 = shape === '222' ? minimalSet(gen) : generate(...dims, gen);
    if (!raw0) { $('labStats').innerHTML = '<div class="srow"><span>Generazione fallita, riprova</span></div>'; return; }
    clearPieces();
    code = codeOf(shape, seed);
    $('labCode').value = code;
    $('labCode').removeAttribute('aria-invalid');
    // i pezzi vengono numerati nell'ordine di montaggio: P01 è il primo da mettere
    const plan = assemblyPlan(raw0, dims);
    const raw = plan.map(st => raw0[st.i]);
    const rnd = mulberry(seed ^ 0x5bd1e995);
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
      const own = new Set(cells.map(c => c.join(',')));
      const meshes = cells.map(c => {
        const m = new THREE.Mesh(labGeo(maskOf(own, c)), mat);
        m.castShadow = m.receiveShadow = true;
        m.userData.pi = i;
        group.add(m);
        return m;
      });
      labRoot.add(group);
      const asmPos = new THREE.Vector3(centroid[0] - bc[0], centroid[1] - bc[1], centroid[2] - bc[2]);
      // nel montaggio il pezzo arriva in linea retta dalla sua direzione d'ingresso
      const ins = plan[i];
      const startPos = asmPos.clone().addScaledVector(new THREE.Vector3(...ins.d), diag * 1.1);
      const q0 = new THREE.Quaternion();
      pieces.push({
        cells, name: NAME_OF[canon(cells)] || '?', flat: flatten(cells), ins,
        color: PALETTE[i % PALETTE.length],
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
      const cs = puzzle ? p.cells : p.flat.cells, own = new Set(cs.map(c => c.join(',')));
      p.meshes.forEach((m, k) => { m.geometry = labGeo(maskOf(own, cs[k])); });
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
      ['Pezzi più alti', `${f1(ALTEZZA_PEZZI_ALTI)} mm`],
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

  // mesh in mm, z in alto: un guscio smussato per cubetto, compenetrati di
  // SOVRAPP (lo slicer li unisce in un solo corpo). Stessa forma dell'anteprima.
  function meshFor(cells) {
    const own = new Set(cells.map(c => c.join(',')));
    const verts = [], tris = [];
    for (const c of cells) {
      const g = chamferBox(maskOf(own, c), CLEARANCE / 2 / UNITA, SOVRAPP / UNITA, SMUSSO / UNITA);
      const base = verts.length;
      // dal laboratorio (y in alto) alla stampante (z in alto): (x, y, z) → (x, −z, y)
      // è una rotazione, non uno specchio, quindi le Viti restano come a schermo
      for (const v of g.verts) {
        const x = (c[0] + .5 + v[0]) * UNITA, y = (c[1] + .5 + v[1]) * UNITA, z = (c[2] + .5 + v[2]) * UNITA;
        verts.push([x, -z, y]);
      }
      for (const t of g.tris) tris.push([t[0] + base, t[1] + base, t[2] + base]);
    }
    const min = [0, 1, 2].map(i => verts.reduce((m, v) => Math.min(m, v[i]), Infinity));
    return { verts: verts.map(v => v.map((x, i) => x - min[i])), tris };
  }

  async function exportBytes() {
    const objs = [], items = [];
    pieces.forEach((p, i) => {
      const { verts, tris } = meshFor(p.flat.cells);
      const vx = verts.map(v => `<vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}"/>`).join('');
      const tx = tris.map(t => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('');
      objs.push(`<object id="${i + 1}" type="model"><metadata name="name">P${String(i + 1).padStart(2, '0')} ${p.name}</metadata><mesh><vertices>${vx}</vertices><triangles>${tx}</triangles></mesh></object>`);
      items.push(`<item objectid="${i + 1}" transform="1 0 0 0 1 0 0 0 1 ${p.plate.px.toFixed(3)} ${p.plate.py.toFixed(3)} 0"/>`);
    });
    const model = `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="it-IT" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Application">Tetracubi 3D, Orfini Math Lab</metadata><metadata name="Title">Tetracubi 3D, set ${code}</metadata><resources>${objs.join('')}</resources><build>${items.join('')}</build></model>`;
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
    a.download = `tetracubi-${code}-${$('labPrinter').value}.3mf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }


  /* ================= istruzioni di montaggio (PDF) =================
     Pagine A4 disegnate su canvas (prospettiva isometrica, fondo bianco per
     la stampa) e impacchettate in un PDF minimo con immagini JPEG: nessuna
     libreria esterna. In ogni passo il pezzo nuovo è colorato, quelli già
     montati sono grigi; la freccia dice da dove entra, il tratteggio mostra
     le parti nascoste dagli altri pezzi. */
  const PG = { W: 1240, H: 1754, K: 1.25, M: 70 };
  const INK = '#111827', DIM = '#4b5563', FONT = '"Space Grotesk", system-ui, sans-serif';
  const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const tone = (h, f) => {
    const m = v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f));
    const [r, g, b] = rgb(h);
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };
  // colori dei pezzi sulla carta: stessi toni dello schermo, più scuri e mai grigi
  // (il grigio è riservato ai pezzi già montati)
  const CARTA = [0xe11d48, 0x0d9488, 0x65a30d, 0x4f46e5, 0xd97706,
                 0xc026d3, 0x0284c7, 0xea580c, 0x16a34a, 0x7c3aed];
  const paperColor = p => CARTA[pieces.indexOf(p) % CARTA.length];
  const styleOf = (hex, kind) => kind === 'grigio'
    ? { top: '#f1f3f6', right: '#d9dde4', left: '#c2c8d1', edge: '#7b8494', seam: '#aab1bd', lw: 1.6 }
    : { top: tone(hex, .35), right: tone(hex, 0), left: tone(hex, -.25), edge: '#111827', seam: tone(hex, -.45), lw: 2.6 };

  const SQ3 = Math.sqrt(3) / 2;
  const isoP = (s, ox, oy) => (x, y, z) => [ox + (x - z) * s * SQ3, oy + (x + z) * s / 2 - y * s];
  function isoExtent(pts3) {
    const P = isoP(1, 0, 0);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const q of pts3) {
      const [x, y] = P(...q);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
  }
  const corners = (a, b) => {
    const out = [];
    for (let k = 0; k < 8; k++) out.push([k & 1 ? b[0] : a[0], k & 2 ? b[1] : a[1], k & 4 ? b[2] : a[2]]);
    return out;
  };
  const cellsBox = cells => [
    [0, 1, 2].map(i => Math.min(...cells.map(c => c[i]))),
    [0, 1, 2].map(i => Math.max(...cells.map(c => c[i])) + 1),
  ];
  // centra e scala un insieme di punti 3D nel riquadro (x, y, w, h)
  function fit(pts3, x, y, w, h, smax = 80) {
    const e = isoExtent(pts3);
    const s = Math.min(w / e.w, h / e.h, smax);
    return { s, P: isoP(s, x + (w - e.w * s) / 2 - e.x0 * s, y + (h - e.h * s) / 2 - e.y0 * s) };
  }

  const FACCE_VISTE = [
    [[0, 1, 0], [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], 'top'],
    [[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], 'right'],
    [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], 'left'],
  ];
  // items: [{ cells, st }] disegnati insieme, dal fondo verso chi guarda
  function drawIso(ctx, P, items) {
    const occ = new Set();
    items.forEach(it => it.cells.forEach(c => occ.add(c.join(','))));
    const cubes = [];
    for (const it of items) {
      const own = new Set(it.cells.map(c => c.join(',')));
      for (const c of it.cells) cubes.push({ c, st: it.st, own });
    }
    cubes.sort((A, B) => (A.c[0] + A.c[1] + A.c[2]) - (B.c[0] + B.c[1] + B.c[2]) || A.c[1] - B.c[1]);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const { c, st, own } of cubes) for (const [n, q, t] of FACCE_VISTE) {
      if (occ.has([c[0] + n[0], c[1] + n[1], c[2] + n[2]].join(','))) continue;
      const pts = q.map(v => P(c[0] + v[0], c[1] + v[1], c[2] + v[2]));
      ctx.beginPath();
      pts.forEach((pt, i) => i ? ctx.lineTo(...pt) : ctx.moveTo(...pt));
      ctx.closePath();
      ctx.fillStyle = st[t];
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        const a = q[k], b = q[(k + 1) % 4];
        const m = [0, 1, 2].map(i => n[i] ? 0 : Math.sign((a[i] + b[i]) / 2 - .5));
        const nb = [c[0] + m[0], c[1] + m[1], c[2] + m[2]];
        // scanalatura fra due cubetti dello stesso pezzo: linea sottile
        const seam = own.has(nb.join(',')) && !own.has([nb[0] + n[0], nb[1] + n[1], nb[2] + n[2]].join(','));
        ctx.beginPath();
        ctx.moveTo(...pts[k]); ctx.lineTo(...pts[(k + 1) % 4]);
        ctx.strokeStyle = seam ? st.seam : st.edge;
        ctx.lineWidth = seam ? 1 : st.lw;
        ctx.stroke();
      }
    }
  }
  // spigoli del pezzo (convessi e concavi), anche quelli nascosti
  function creases(cells) {
    const own = new Set(cells.map(c => c.join(',')));
    const has = v => own.has(v.join(','));
    const segs = [];
    for (const c of cells) for (let a = 0; a < 3; a++) {
      const b = (a + 1) % 3, e = (a + 2) % 3;
      for (const sb of [-1, 1]) for (const se of [-1, 1]) {
        const d1 = [0, 0, 0], d2 = [0, 0, 0];
        d1[b] = sb; d2[e] = se;
        const n1 = has(c.map((v, i) => v + d1[i])), n2 = has(c.map((v, i) => v + d2[i]));
        const n12 = has(c.map((v, i) => v + d1[i] + d2[i]));
        if ((n1 || n2) && !(n1 && n2 && !n12)) continue;
        const p0 = c.slice(), p1 = c.slice();
        p0[b] = p1[b] = c[b] + (sb > 0 ? 1 : 0);
        p0[e] = p1[e] = c[e] + (se > 0 ? 1 : 0);
        p1[a] = c[a] + 1;
        segs.push([p0, p1]);
      }
    }
    return segs;
  }
  function arrow(ctx, from, to, color, w = 7) {
    const ang = Math.atan2(to[1] - from[1], to[0] - from[0]), hl = w * 3.2;
    const end = [to[0] - Math.cos(ang) * hl * .8, to[1] - Math.sin(ang) * hl * .8];
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...end); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(...to);
    ctx.lineTo(to[0] - Math.cos(ang - .45) * hl, to[1] - Math.sin(ang - .45) * hl);
    ctx.lineTo(to[0] - Math.cos(ang + .45) * hl, to[1] - Math.sin(ang + .45) * hl);
    ctx.closePath(); ctx.fill();
  }
  function wrapText(ctx, text, x, y, w, lh) {
    const words = text.split(' ');
    let line = '';
    for (const wd of words) {
      const t = line ? line + ' ' + wd : wd;
      if (ctx.measureText(t).width > w && line) { ctx.fillText(line, x, y); y += lh; line = wd; }
      else line = t;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }
  function newPage() {
    const cv = document.createElement('canvas');
    cv.width = Math.round(PG.W * PG.K); cv.height = Math.round(PG.H * PG.K);
    // canvas software: la codifica JPEG non deve rileggere dalla scheda grafica
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.scale(PG.K, PG.K);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, PG.W, PG.H);
    return { cv, ctx };
  }
  const font = (ctx, px, w = 400) => { ctx.font = `${w} ${px}px ${FONT}`; };
  function footer(ctx, n, tot) {
    font(ctx, 18);
    ctx.fillStyle = DIM;
    ctx.textAlign = 'left';
    ctx.fillText(`Tetracubi 3D · set ${code}`, PG.M, PG.H - 46);
    ctx.textAlign = 'right';
    ctx.fillText(`Orfini Math Lab · pagina ${n} di ${tot}`, PG.W - PG.M, PG.H - 46);
    ctx.textAlign = 'left';
  }
  const setUrl = () => {
    const base = /^https?:/.test(location.protocol) ? location.origin + location.pathname
      : 'https://federicodb.github.io/content/apps/tetracubi_3d.html';
    return `${base}?set=${code}`;
  };

  function coverPage(tot) {
    const { cv, ctx } = newPage(), M = PG.M;
    ctx.fillStyle = INK; font(ctx, 66, 700); ctx.fillText('Tetracubi 3D', M, 118);
    ctx.fillStyle = DIM; font(ctx, 30); ctx.fillText('Istruzioni di montaggio', M, 164);
    ctx.textAlign = 'right';
    font(ctx, 18, 700); ctx.fillText('CODICE DEL SET', PG.W - M, 82);
    ctx.fillStyle = INK; font(ctx, 54, 700); ctx.fillText(code, PG.W - M, 140);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d1d5db'; ctx.fillRect(M, 196, PG.W - 2 * M, 2);

    // il solido montato, ogni pezzo nel suo colore
    const all = pieces.map(p => ({ cells: p.cells, st: styleOf(paperColor(p), 'colore') }));
    const f = fit(corners([0, 0, 0], box), M, 236, 560, 500);
    drawIso(ctx, f.P, all);

    const lati = [box[0], box[2], box[1]], n = pieces.length, cub = lati[0] * lati[1] * lati[2];
    const f1 = x => x.toLocaleString('it-IT', { maximumFractionDigits: 1 });
    const facts = [
      ['Solido', SOLIDI[$('labShape').value]],
      ['Cubetti', `${lati.join(' × ')} = ${cub}`],
      ['Pezzi da 4 cubetti', `${cub} : 4 = ${n}`],
      ['Lato di un cubetto', `${f1(UNITA)} mm`],
      ['Pezzi più alti', `${f1(ALTEZZA_PEZZI_ALTI)} mm`],
      ['Solido montato', `${lati.map(l => Math.round(l * UNITA)).join(' × ')} mm`],
    ];
    let y = 270;
    for (const [k, v] of facts) {
      ctx.fillStyle = DIM; font(ctx, 20); ctx.fillText(k, 680, y);
      ctx.fillStyle = INK; font(ctx, 32, 700); ctx.fillText(v, 680, y + 38);
      y += 78;
    }

    // inventario per forma, nell'orientamento di stampa
    y = 790;
    ctx.fillStyle = INK; font(ctx, 34, 700); ctx.fillText('I pezzi del set', M, y);
    const groups = new Map();
    for (const p of pieces) {
      if (!groups.has(p.name)) groups.set(p.name, { p, n: 0 });
      groups.get(p.name).n++;
    }
    const cw = (PG.W - 2 * M) / 4, chh = 200;
    [...groups.values()].forEach(({ p, n }, i) => {
      const x = M + (i % 4) * cw, yy = y + 24 + Math.floor(i / 4) * chh;
      ctx.fillStyle = '#f3f4f6'; ctx.fillRect(x + 6, yy, cw - 12, chh - 14);
      const cells = p.flat.cells;
      const ff = fit(corners(...cellsBox(cells)), x + 26, yy + 14, cw - 52, chh - 80, 34);
      drawIso(ctx, ff.P, [{ cells, st: styleOf(0x64748b, 'colore') }]);
      ctx.fillStyle = INK; font(ctx, 24, 700); ctx.textAlign = 'center';
      ctx.fillText(`${p.name} × ${n}`, x + cw / 2, yy + chh - 34);
      ctx.textAlign = 'left';
    });
    const rows = Math.ceil(groups.size / 4);
    y = y + 24 + rows * chh + 40;

    ctx.fillStyle = INK; font(ctx, 28, 700); ctx.fillText('Come si leggono', M, y);
    y += 40;
    font(ctx, 21); ctx.fillStyle = INK;
    const notes = [
      'Il solido si rimonta un pezzo alla volta, nell’ordine dei passi. In ogni passo il pezzo nuovo è colorato e quelli già montati sono grigi; la freccia indica da dove entra, il tratteggio mostra le parti coperte dagli altri pezzi.',
      'Pezzi con la stessa forma sono uguali: al loro posto va bene uno qualunque. Se un pezzo non entra, giralo: in ogni passo è disegnato anche da solo, nella posizione giusta.',
      'Ogni pezzo si stampa senza supporti, appoggiato sul lato più piatto, come nella figura qui sopra.',
      `Per rivedere il set nel laboratorio: ${setUrl()}`,
    ];
    for (const t of notes) {
      ctx.fillStyle = '#9ca3af'; ctx.fillRect(M, y - 13, 8, 8);
      ctx.fillStyle = INK;
      y = wrapText(ctx, t, M + 24, y, PG.W - 2 * M - 24, 30) + 10;
    }
    footer(ctx, 1, tot);
    return cv;
  }

  function stepsPage(from, pageNo, tot) {
    const { cv, ctx } = newPage(), M = PG.M;
    ctx.fillStyle = INK; font(ctx, 30, 700); ctx.fillText('Montaggio', M, 104);
    ctx.fillStyle = DIM; font(ctx, 22); ctx.textAlign = 'right';
    ctx.fillText(`passi ${from + 1}-${Math.min(from + 6, pieces.length)} di ${pieces.length}`, PG.W - M, 104);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d1d5db'; ctx.fillRect(M, 126, PG.W - 2 * M, 2);
    const cw = (PG.W - 2 * M) / 2, chh = (PG.H - 160 - 90) / 3;
    // stessa scala in tutti i passi: il solido più lo spazio per le frecce
    const ref = corners([-1.1, 0, -1.1], [box[0] + 1.1, box[1] + 1.9, box[2] + 1.1]);
    for (let k = 0; k < 6; k++) {
      const i = from + k;
      if (i >= pieces.length) break;
      const p = pieces[i];
      const x = M + (k % 2) * cw, y = 150 + Math.floor(k / 2) * chh;
      if (k % 2) { ctx.fillStyle = '#e5e7eb'; ctx.fillRect(x - 1, y + 10, 2, chh - 30); }
      if (k >= 2 && k % 2 === 0) { ctx.fillStyle = '#e5e7eb'; ctx.fillRect(M, y - 2, PG.W - 2 * M, 2); }
      const col = paperColor(p);
      // numero del passo
      ctx.fillStyle = tone(col, 0);
      ctx.beginPath(); ctx.arc(x + 44, y + 56, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; font(ctx, 30, 700); ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x + 44, y + 67);
      ctx.textAlign = 'left';
      ctx.fillStyle = INK; font(ctx, 26, 700); ctx.fillText(`Pezzo ${p.name}`, x + 88, y + 50);
      ctx.fillStyle = DIM; font(ctx, 20); ctx.fillText(p.ins.testo, x + 88, y + 78);

      // il pezzo da solo, nella posizione in cui va messo
      const own = fit(corners(...cellsBox(p.cells)), x + cw - 150, y + 20, 120, 110, 26);
      drawIso(ctx, own.P, [{ cells: p.cells, st: styleOf(col, 'colore') }]);

      // il solido fino a questo passo
      const f = fit(ref, x + 16, y + 96, cw - 32, chh - 106);
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 5]);
      const B = box;
      for (const [a, b] of [
        [[0, 0, 0], [B[0], 0, 0]], [[0, 0, 0], [0, 0, B[2]]], [[B[0], 0, 0], [B[0], 0, B[2]]], [[0, 0, B[2]], [B[0], 0, B[2]]],
        [[0, B[1], 0], [B[0], B[1], 0]], [[0, B[1], 0], [0, B[1], B[2]]], [[B[0], B[1], 0], [B[0], B[1], B[2]]], [[0, B[1], B[2]], [B[0], B[1], B[2]]],
        [[0, 0, 0], [0, B[1], 0]], [[B[0], 0, 0], [B[0], B[1], 0]], [[0, 0, B[2]], [0, B[1], B[2]]], [[B[0], 0, B[2]], [B[0], B[1], B[2]]],
      ]) { ctx.beginPath(); ctx.moveTo(...f.P(...a)); ctx.lineTo(...f.P(...b)); ctx.stroke(); }
      ctx.setLineDash([]);
      const items = pieces.slice(0, i).map(q => ({ cells: q.cells, st: styleOf(0, 'grigio') }));
      items.push({ cells: p.cells, st: styleOf(col, 'colore') });
      drawIso(ctx, f.P, items);
      ctx.strokeStyle = 'rgba(17,24,39,.75)'; ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
      for (const [a, b] of creases(p.cells)) { ctx.beginPath(); ctx.moveTo(...f.P(...a)); ctx.lineTo(...f.P(...b)); ctx.stroke(); }
      ctx.setLineDash([]);
      // freccia d'ingresso: dal fuori del solido verso il pezzo
      const [lo, hi] = cellsBox(p.cells);
      const cen = [0, 1, 2].map(j => (lo[j] + hi[j]) / 2);
      const d = p.ins.d;
      const edge = j => d[j] > 0 ? hi[j] : lo[j];
      const j = d.findIndex(v => v !== 0);
      const near = cen.slice(), far = cen.slice();
      near[j] = edge(j) + d[j] * .35;
      far[j] = (d[j] > 0 ? box[j] : 0) + d[j] * (j === 1 ? 1.7 : 1);
      arrow(ctx, f.P(...far), f.P(...near), '#0e7490');
    }
    footer(ctx, pageNo, tot);
    return cv;
  }

  function pdfFromJpegs(jpegs, title) {
    const enc8 = s => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; };
    const parts = [], offs = [];
    let len = 0;
    const put = x => { const u = typeof x === 'string' ? enc8(x) : x; parts.push(u); len += u.length; };
    const obj = (n, body) => { offs[n] = len; put(`${n} 0 obj\n`); body(); put('\nendobj\n'); };
    const n = jpegs.length, Wp = 595.28, Hp = 841.89;
    put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => put('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => put(`<< /Type /Pages /Count ${n} /Kids [${jpegs.map((_, i) => `${4 + 3 * i} 0 R`).join(' ')}] >>`));
    obj(3, () => put(`<< /Title (${title}) /Producer (Orfini Math Lab) >>`));
    jpegs.forEach((j, i) => {
      const pg = 4 + 3 * i;
      obj(pg, () => put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${Wp} ${Hp}] /Resources << /XObject << /Im0 ${pg + 2} 0 R >> >> /Contents ${pg + 1} 0 R >>`));
      const cs = `q ${Wp} 0 0 ${Hp} 0 0 cm /Im0 Do Q`;
      obj(pg + 1, () => put(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
      obj(pg + 2, () => {
        put(`<< /Type /XObject /Subtype /Image /Width ${j.w} /Height ${j.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.bytes.length} >>\nstream\n`);
        put(j.bytes);
        put('\nendstream');
      });
    });
    const total = 4 + 3 * n, xref = len;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    put(x + `trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(len);
    let o = 0;
    for (const u of parts) { out.set(u, o); o += u.length; }
    return out;
  }

  async function pdfBytes() {
    if (document.fonts) {
      await Promise.all([document.fonts.load(`700 30px ${FONT}`), document.fonts.load(`400 20px ${FONT}`)]).catch(() => {});
    }
    const steps = Math.ceil(pieces.length / 6), tot = 1 + steps;
    const pages = [coverPage(tot)];
    for (let i = 0; i < steps; i++) pages.push(stepsPage(i * 6, i + 2, tot));
    const jpegs = [];
    for (const cv of pages) {
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .9));
      jpegs.push({ w: cv.width, h: cv.height, bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    return pdfFromJpegs(jpegs, `Tetracubi 3D - set ${code} - istruzioni di montaggio`);
  }

  async function downloadPdf() {
    if (!pieces.length) return;
    const btn = $('btnPdf'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Preparo il PDF…';
    try {
      const bytes = await pdfBytes();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      a.download = `tetracubi-${code}-istruzioni.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } finally { btn.disabled = false; btn.textContent = label; }
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
    if (!pieces.length) buildSet(new URLSearchParams(location.search).get('set'));
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
  $('btnGen').addEventListener('click', () => buildSet());
  $('labShape').addEventListener('change', () => buildSet());
  const openCode = () => {
    const v = $('labCode').value;
    if (parseCode(v)) buildSet(v);
    else $('labCode').setAttribute('aria-invalid', 'true');
  };
  $('btnCode').addEventListener('click', openCode);
  $('labCode').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openCode(); } e.stopPropagation(); });
  $('btnPdf').addEventListener('click', downloadPdf);
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
        maxPrintH: Math.max(...pieces.map(p => Math.max(...meshFor(p.flat.cells).verts.map(v => v[2])))),
        code,
      };
    },
    // passi di montaggio: celle, forma e direzione d'ingresso
    plan: () => pieces.map(p => ({ name: p.name, cells: p.cells, via: p.ins.via, d: p.ins.d, forzato: !!p.ins.forzato })),
    box: () => box.slice(),
    printMeshes: () => pieces.map(p => meshFor(p.flat.cells)),
    open: c => { if (!active) enter(); buildSet(c); },
    pdfBase64: async () => {
      const b = await pdfBytes();
      let s = '';
      for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
      return btoa(s);
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
// ?set=CODICE apre direttamente il laboratorio su quel set (link scritto nel PDF)
if (new URLSearchParams(location.search).get('set')) LAB.enter();

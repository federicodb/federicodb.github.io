// SPDX-License-Identifier: GPL-3.0-only — FullControl Studio, Orfini Math Lab (vedi LICENZA.txt)
// Motore WYSIWYG 3D FullControl: 12 Archetipi × 6 Sagome Z × 8 Non-Planari Z × 6 Texture XY + Fondo Stagno + Fix RAM Bambu Studio

export const HOTEND_PROFILES = {
  a1_mini: {
    name: 'A1 mini Quick-Swap Hotend',
    maxSlopeDeg: 28.0,
    maxSlopeTan: Math.tan((28.0 * Math.PI) / 180),
    tipHeightMm: 2.2,
    coneHeightMm: 6.5,
    coneRadiusMm: 4.5,
    shroudRadiusMm: 14.0,
  },
  a1: {
    name: 'A1 Quick-Swap Hotend',
    maxSlopeDeg: 28.0,
    maxSlopeTan: Math.tan((28.0 * Math.PI) / 180),
    tipHeightMm: 2.2,
    coneHeightMm: 6.5,
    coneRadiusMm: 4.5,
    shroudRadiusMm: 14.0,
  },
  p2s: {
    name: 'P2S CoreXY Enclosed Hotend',
    maxSlopeDeg: 25.0,
    maxSlopeTan: Math.tan((25.0 * Math.PI) / 180),
    tipHeightMm: 2.0,
    coneHeightMm: 6.0,
    coneRadiusMm: 5.0,
    shroudRadiusMm: 18.0,
  },
};

export const EXTRUSION_MODES = [
  { id: 'continuous', label: 'Continuo Liscio (Standard)' },
  { id: 'wave_weave', label: 'Intreccio Tessile (Knitted Weave Alternato)' },
  { id: 'knurl_tri', label: 'Zigrinatura Meccanica (Triangle Wave)' },
  { id: 'rib_square', label: 'Grecatura / Alette (Square Wave)' },
  { id: 'variable_width', label: 'Larghezza Variabile (Nervature 0.35–0.90 mm)' },
  { id: 'ams_bands', label: 'Fasce Multicolore AMS (Slot 1-2-3-4)' },
];

export const VERTICAL_PROFILES = [
  { id: 'straight', label: '1. Dritto / Conico (Taper Lineare)' },
  { id: 'amphora', label: '2. Anfora Classica (Onda Sin Verticale)' },
  { id: 'bulb', label: '3. Bulbo / Sfera Bombata al Centro' },
  { id: 'hourglass', label: '4. Clessidra (Stretta al Centro)' },
  { id: 'bamboo', label: '5. Bambù / Anelli Multipli Lungo Z' },
  { id: 'chalice', label: '6. Calice / Svasatura Parabolica' },
];

export const NONPLANAR_MODES = [
  { id: 'planar', label: '1. Planare Classico (Z piatto)' },
  { id: 'sine_wave', label: '2. Onda Sinusoidale Non-Planare Z' },
  { id: 'saddle', label: '3. Sella Iperbolica (2 Lobi Z)' },
  { id: 'arch_bridge', label: '4. Arco / Ponte Sospeso Non-Planare' },
  { id: 'dome', label: '5. Cupola / Bombatura Radiale Z' },
  { id: 'crater', label: '6. Cratere / Conca Inversa Z' },
  { id: 'tilted', label: '7. Piano Inclinato (Tilted Plane Z)' },
  { id: 'tri_wave', label: '8. Onda Triangolare Z (Zig-Zag Verticale)' },
];

const COMMON_VESSEL_GROUPS = [
  {
    title: '1. Dimensioni, Altezza (fino a 250mm) & Fondo Stagno',
    fields: [
      { key: 'heightMm', label: 'Altezza Totale (mm)', min: 1, max: 250, step: 1, unit: 'mm' },
      { key: 'radius', label: 'Raggio Base (mm)', min: 5, max: 110, step: 1, unit: 'mm' },
      { key: 'sides', label: 'Lati Poligono (3..64, 64=Cerchio)', min: 3, max: 64, step: 1, unit: 'lati' },
      { key: 'bottomLayers', label: 'Layer Fondo Stagno (0=Aperto, 1..10)', min: 0, max: 10, step: 1, unit: 'strati' },
      { key: 'wallLoops', label: 'Pareti Concentriche', min: 1, max: 4, step: 1, unit: 'loop' },
      { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
      { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
    ],
  },
  {
    title: '2. Combina Sagoma Z, Sweep & Torsione',
    fields: [
      { key: 'taper', label: 'Scala Raggio Top (Conicità)', min: 0.3, max: 2.2, step: 0.05, unit: '×' },
      { key: 'profileAmp', label: 'Ampiezza Sagoma Verticale', min: -25, max: 25, step: 0.5, unit: 'mm' },
      { key: 'twistDeg', label: 'Torsione Elicoidale (Twist)', min: -360, max: 360, step: 5, unit: '°' },
      { key: 'sweepRadius', label: 'Raggio Sweep Traiettoria Z', min: 0, max: 45, step: 1, unit: 'mm' },
      { key: 'sweepTurns', label: 'Spire Sweep lungo Z', min: 0.5, max: 4.0, step: 0.25, unit: 'giri' },
    ],
  },
  {
    title: '3. Combina Costolature XY + Non-Planare Z',
    fields: [
      { key: 'xyWaveAmp', label: 'Ampiezza Costolature/Onde XY', min: 0, max: 14, step: 0.2, unit: 'mm' },
      { key: 'xyWaveFreq', label: 'Numero Costolature/Petali XY', min: 1, max: 32, step: 1, unit: 'lobi' },
      { key: 'npAmpZ', label: 'Ampiezza Non-Planare Z', min: 0, max: 12, step: 0.2, unit: 'mm' },
      { key: 'npFreq', label: 'Creste Non-Planari Z', min: 1, max: 10, step: 1, unit: 'onde' },
      { key: 'segResolution', label: 'Risoluzione (36=Leggero, 72=Fine)', min: 24, max: 96, step: 6, unit: 'seg' },
    ],
  },
];

export const OBJECT_BLUEPRINTS = {
  combinable_vessel: {
    type: 'combinable_vessel',
    title: '1. Poligono / Vaso / Sweep Universale',
    icon: '🏺',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 1,
      heightMm: 45, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 3, sides: 6, radius: 26,
      taper: 1.15, verticalProfile: 'amphora', profileAmp: 4.5,
      sweepRadius: 0.0, sweepTurns: 1.0, twistDeg: 45,
      xyWaveAmp: 2.0, xyWaveFreq: 6,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 2.0, npFreq: 3, wallLoops: 1, segResolution: 36,
    },
    groups: COMMON_VESSEL_GROUPS,
  },

  star_polygon_lattice: {
    type: 'star_polygon_lattice',
    title: '2. Reticolo Poligonale Stellare (Move Polar)',
    icon: '⭐',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 2,
      heightMm: 35, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 2, sides: 4, radius: 28,
      petals: 5, twistDeg: 30, taper: 1.0,
      verticalProfile: 'straight', profileAmp: 0,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 1.8, npFreq: 4, segResolution: 36,
    },
    groups: [
      {
        title: '1. Stella Poligonale, Altezza & Fondo Stagno',
        fields: [
          { key: 'heightMm', label: 'Altezza Totale (mm)', min: 1, max: 250, step: 1, unit: 'mm' },
          { key: 'radius', label: 'Raggio Stella (mm)', min: 8, max: 105, step: 1, unit: 'mm' },
          { key: 'sides', label: 'Lati Poligono Base (3..12)', min: 3, max: 12, step: 1, unit: 'lati' },
          { key: 'petals', label: 'Copie Ruotate (Move Polar)', min: 2, max: 12, step: 1, unit: 'copie' },
          { key: 'bottomLayers', label: 'Layer Fondo Stagno (0..10)', min: 0, max: 10, step: 1, unit: 'strati' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
      {
        title: '2. Combina Sagoma Z, Torsione & Non-Planare Z',
        fields: [
          { key: 'taper', label: 'Scala Top (Conicità)', min: 0.4, max: 1.8, step: 0.05, unit: '×' },
          { key: 'profileAmp', label: 'Ampiezza Sagoma Verticale', min: -20, max: 20, step: 0.5, unit: 'mm' },
          { key: 'twistDeg', label: 'Torsione Elicoidale lungo Z', min: -180, max: 180, step: 5, unit: '°' },
          { key: 'npAmpZ', label: 'Ampiezza Non-Planare Z', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Lobi Non-Planari Z', min: 1, max: 8, step: 1, unit: 'onde' },
        ],
      },
    ],
  },

  ripple_texture_cylinder: {
    type: 'combinable_vessel',
    title: '3. Cilindro / Abat-Jour Texture Increspata (Ripple)',
    icon: '🌊',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 1,
      heightMm: 60, layerH: 0.24, extrusionW: 0.52,
      bottomLayers: 3, sides: 64, radius: 30,
      taper: 1.0, verticalProfile: 'bulb', profileAmp: 5.0,
      sweepRadius: 0.0, sweepTurns: 1.0, twistDeg: 20,
      xyWaveAmp: 1.8, xyWaveFreq: 24,
      extrusionMode: 'wave_weave', nonplanarMode: 'sine_wave',
      npAmpZ: 1.6, npFreq: 4, wallLoops: 1, segResolution: 72,
    },
    groups: COMMON_VESSEL_GROUPS,
  },

  fractional_polar_engine: {
    type: 'fractional_polar_engine',
    title: '4. Motore Polare Frazionario / Spirografo 3D',
    icon: '🌀',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 3,
      heightMm: 40, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 3, radius: 28, innerRadius: 14,
      lobes: 7, twistDeg: 90, taper: 1.1,
      verticalProfile: 'amphora', profileAmp: 3.5,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 2.0, npFreq: 3, segResolution: 60,
    },
    groups: [
      {
        title: '1. Parametri Spirografo Polare, Altezza & Fondo',
        fields: [
          { key: 'heightMm', label: 'Altezza Totale (mm)', min: 1, max: 250, step: 1, unit: 'mm' },
          { key: 'radius', label: 'Raggio Esterno Petali (mm)', min: 10, max: 105, step: 1, unit: 'mm' },
          { key: 'innerRadius', label: 'Raggio Interno Gola (mm)', min: 4, max: 90, step: 1, unit: 'mm' },
          { key: 'lobes', label: 'Petali Frazionari per Giro', min: 3, max: 24, step: 1, unit: 'petali' },
          { key: 'bottomLayers', label: 'Layer Fondo Stagno (0..10)', min: 0, max: 10, step: 1, unit: 'strati' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
      {
        title: '2. Combina Sagoma Z, Torsione & Non-Planare Z',
        fields: [
          { key: 'taper', label: 'Scala Top (Conicità)', min: 0.4, max: 2.0, step: 0.05, unit: '×' },
          { key: 'profileAmp', label: 'Ampiezza Sagoma Verticale', min: -20, max: 20, step: 0.5, unit: 'mm' },
          { key: 'twistDeg', label: 'Sfasamento Angolare Totale', min: -360, max: 360, step: 5, unit: '°' },
          { key: 'npAmpZ', label: 'Ampiezza Non-Planare Z', min: 0, max: 10, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Creste Non-Planari Z', min: 1, max: 8, step: 1, unit: 'onde' },
          { key: 'segResolution', label: 'Risoluzione Giro', min: 36, max: 96, step: 6, unit: 'seg' },
        ],
      },
    ],
  },

  helical_thread_screw: {
    type: 'helical_thread_screw',
    title: '5. Filettatura / Contenitore a Vite Elicoidale',
    icon: '🔩',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 4,
      heightMm: 36, layerH: 0.2, extrusionW: 0.5,
      bottomLayers: 3, radius: 18, threadDepth: 2.2,
      threadPitchMm: 4.0, threadStarts: 1,
      extrusionMode: 'continuous', nonplanarMode: 'planar',
      npAmpZ: 0.0, npFreq: 2, segResolution: 48,
    },
    groups: [
      {
        title: '1. Parametri Filettatura ISO / Elica & Fondo',
        fields: [
          { key: 'heightMm', label: 'Altezza Filettata (mm)', min: 4, max: 250, step: 1, unit: 'mm' },
          { key: 'radius', label: 'Raggio Nocciolo (mm)', min: 5, max: 80, step: 0.5, unit: 'mm' },
          { key: 'threadDepth', label: 'Profondità Cresta Filetto (mm)', min: 0.5, max: 6.0, step: 0.2, unit: 'mm' },
          { key: 'threadPitchMm', label: 'Passo Filettatura (mm/giro)', min: 1.5, max: 16.0, step: 0.5, unit: 'mm' },
          { key: 'threadStarts', label: 'Principi Filetto (1..4)', min: 1, max: 4, step: 1, unit: 'principi' },
          { key: 'bottomLayers', label: 'Layer Fondo / Testa Esagonale', min: 0, max: 10, step: 1, unit: 'strati' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.36, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.4, max: 1.0, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },

  nonplanar_torus_spacer: {
    type: 'nonplanar_torus_spacer',
    title: '6. Anello / Distanziale Radiale Non-Planare',
    icon: '🍩',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 1,
      heightMm: 18, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 2, outerRadius: 32, innerRadius: 16,
      radialWaves: 16, twistDeg: 25,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 2.5, npFreq: 4, segResolution: 48,
    },
    groups: [
      {
        title: '1. Raggi Anello, Nervature Radiali & Altezza',
        fields: [
          { key: 'heightMm', label: 'Altezza Distanziale (mm)', min: 1, max: 200, step: 1, unit: 'mm' },
          { key: 'outerRadius', label: 'Raggio Esterno (mm)', min: 10, max: 105, step: 1, unit: 'mm' },
          { key: 'innerRadius', label: 'Raggio Foro Interno (mm)', min: 4, max: 85, step: 1, unit: 'mm' },
          { key: 'radialWaves', label: 'Nervature Radiali Interne', min: 6, max: 36, step: 2, unit: 'raggi' },
          { key: 'bottomLayers', label: 'Layer Fondo Anulare Chiuso', min: 0, max: 8, step: 1, unit: 'strati' },
          { key: 'twistDeg', label: 'Torsione Nervature lungo Z', min: -180, max: 180, step: 5, unit: '°' },
          { key: 'npAmpZ', label: 'Onda Non-Planare Superiore Z', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Creste Non-Planari Z', min: 1, max: 8, step: 1, unit: 'onde' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },

  curve_extrusion: {
    type: 'curve_extrusion',
    title: '7. Parete / Ponte Lungo Curva di Bézier 3D',
    icon: '〰',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 2,
      heightMm: 28, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 0, spanX: 75, ctrlY: 30,
      xyWaveAmp: 0.0, xyWaveFreq: 4,
      extrusionMode: 'continuous', nonplanarMode: 'arch_bridge',
      npAmpZ: 5.0, npFreq: 1, wallLoops: 2, segResolution: 44,
    },
    groups: [
      {
        title: '1. Curva Bézier, Altezza & Passate',
        fields: [
          { key: 'heightMm', label: 'Altezza Parete (mm)', min: 0.5, max: 250, step: 0.5, unit: 'mm' },
          { key: 'spanX', label: 'Estensione Curva X', min: 15, max: 170, step: 2, unit: 'mm' },
          { key: 'ctrlY', label: 'Freccia Curvatura Y (Bézier)', min: -85, max: 85, step: 2, unit: 'mm' },
          { key: 'wallLoops', label: 'Pareti Affiancate (Offset Y)', min: 1, max: 12, step: 1, unit: 'linee' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
      {
        title: '2. Combina Onda XY + Non-Planare Z',
        fields: [
          { key: 'xyWaveAmp', label: 'Ondulazione Laterale Sulla Curva', min: 0, max: 12, step: 0.25, unit: 'mm' },
          { key: 'xyWaveFreq', label: 'Cicli Onda Laterale', min: 1, max: 16, step: 1, unit: 'cicli' },
          { key: 'npAmpZ', label: 'Altezza Arco/Onda Non-Planare Z', min: 0, max: 14, step: 0.25, unit: 'mm' },
          { key: 'npFreq', label: 'Archi Non-Planari Z', min: 1, max: 6, step: 1, unit: 'archi' },
          { key: 'segResolution', label: 'Punti lungo la Curva', min: 20, max: 80, step: 4, unit: 'seg' },
        ],
      },
    ],
  },

  arc_wave_shell: {
    type: 'arc_wave_shell',
    title: '8. Guscio Ondulato su Arco (Lab Arc Waves)',
    icon: '🌈',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 3,
      heightMm: 45, layerH: 0.24, extrusionW: 0.5,
      radius: 36, arcDeg: 220, waveAmp: 3.5, periods: 8,
      twistDeg: 25, extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 2.5, npFreq: 2, segResolution: 48,
    },
    groups: [
      {
        title: '1. Parametri Arco, Onde & Altezza',
        fields: [
          { key: 'heightMm', label: 'Altezza Guscio (mm)', min: 2, max: 250, step: 1, unit: 'mm' },
          { key: 'radius', label: 'Raggio Arco (mm)', min: 10, max: 100, step: 1, unit: 'mm' },
          { key: 'arcDeg', label: 'Angolo Apertura Arco (°)', min: 45, max: 340, step: 5, unit: '°' },
          { key: 'waveAmp', label: 'Ampiezza Onda Radiale (mm)', min: 0, max: 14, step: 0.25, unit: 'mm' },
          { key: 'periods', label: 'Numero Onde sull’Arco', min: 2, max: 24, step: 1, unit: 'onde' },
          { key: 'twistDeg', label: 'Scorrimento Onde lungo Z (°)', min: -180, max: 180, step: 5, unit: '°' },
          { key: 'npAmpZ', label: 'Altezza Non-Planare Z', min: 0, max: 10, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Creste Non-Planari Z', min: 1, max: 6, step: 1, unit: 'onde' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },

  metamaterial_grid: {
    type: 'metamaterial_grid',
    title: '9. Reticolo Metamateriale Flessibile / Auxetico',
    icon: '🕸',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 1,
      heightMm: 6.0, layerH: 0.24, extrusionW: 0.48,
      sizeX: 60, sizeY: 60, cells: 6, waveAmp: 2.4,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 1.5, npFreq: 2, segResolution: 36,
    },
    groups: [
      {
        title: '1. Cella Metamateriale Incrociata & Non-Planare Z',
        fields: [
          { key: 'sizeX', label: 'Dimensione X (mm)', min: 16, max: 160, step: 2, unit: 'mm' },
          { key: 'sizeY', label: 'Dimensione Y (mm)', min: 16, max: 160, step: 2, unit: 'mm' },
          { key: 'heightMm', label: 'Altezza Reticolo (mm)', min: 0.5, max: 80, step: 0.5, unit: 'mm' },
          { key: 'cells', label: 'Numero Celle per Lato', min: 3, max: 16, step: 1, unit: 'celle' },
          { key: 'waveAmp', label: 'Ampiezza Molla Sinusoidale XY', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'npAmpZ', label: 'Ondulazione 3D Non-Planare Z', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Frequenza Non-Planare Z', min: 1, max: 6, step: 1, unit: 'onde' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.15, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.0, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },

  spherical_dome: {
    type: 'spherical_dome',
    title: '10. Cupola / Calotta Sferica Geodetica (Lab Spherical)',
    icon: '🌐',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 2,
      heightMm: 30, layerH: 0.22, extrusionW: 0.52,
      bottomLayers: 2, radius: 34, sides: 32,
      xyWaveAmp: 1.2, xyWaveFreq: 10,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 1.5, npFreq: 4, segResolution: 48,
    },
    groups: [
      {
        title: '1. Geometria Cupola Sferica, Fondo & Onde',
        fields: [
          { key: 'radius', label: 'Raggio Base Cupola (mm)', min: 10, max: 100, step: 1, unit: 'mm' },
          { key: 'heightMm', label: 'Altezza Calotta Z (mm)', min: 4, max: 120, step: 1, unit: 'mm' },
          { key: 'sides', label: 'Lati Base (3..64, 64=Sfera)', min: 3, max: 64, step: 1, unit: 'lati' },
          { key: 'bottomLayers', label: 'Layer Fondo Stagno (0=Aperta)', min: 0, max: 8, step: 1, unit: 'strati' },
          { key: 'xyWaveAmp', label: 'Costolature Meridiani (mm)', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'xyWaveFreq', label: 'Numero Meridiani', min: 3, max: 24, step: 1, unit: 'lobi' },
          { key: 'npAmpZ', label: 'Ondulazione Non-Planare Z', min: 0, max: 6, step: 0.2, unit: 'mm' },
          { key: 'layerH', label: 'Passo Z Layer', min: 0.12, max: 0.4, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.4, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },

  nonplanar_surface: {
    type: 'nonplanar_surface',
    title: '11. Superficie / Tappeto Scolpito Non-Planare',
    icon: '🌊',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 3,
      heightMm: 2.4, layerH: 0.24, extrusionW: 0.52,
      bottomLayers: 1, sizeX: 65, sizeY: 50, passesY: 22,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 3.5, npFreq: 2, segResolution: 40,
    },
    groups: [
      {
        title: '1. Dimensioni Superficie, Fondo & Strati',
        fields: [
          { key: 'sizeX', label: 'Larghezza X (mm)', min: 15, max: 165, step: 2, unit: 'mm' },
          { key: 'sizeY', label: 'Profondità Y (mm)', min: 15, max: 165, step: 2, unit: 'mm' },
          { key: 'heightMm', label: 'Spessore Strati (mm)', min: 0.24, max: 40, step: 0.24, unit: 'mm' },
          { key: 'bottomLayers', label: 'Layer Fondo Piatto Sotto Onda', min: 0, max: 6, step: 1, unit: 'strati' },
          { key: 'passesY', label: 'Linee Scansione Y', min: 6, max: 60, step: 2, unit: 'linee' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.15, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
      {
        title: '2. Scolpitura Non-Planare Z',
        fields: [
          { key: 'npAmpZ', label: 'Escursione Onda Z Non-Planare', min: 0, max: 10, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Frequenza Onde 3D', min: 1, max: 6, step: 0.5, unit: 'onde' },
          { key: 'segResolution', label: 'Risoluzione lungo X', min: 20, max: 64, step: 4, unit: 'seg' },
        ],
      },
    ],
  },

  plate_drawn_path: {
    type: 'plate_drawn_path',
    title: '12. Percorso Disegnato sul Piatto (Click 3D)',
    icon: '✏',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 4,
      heightMm: 25, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 0,
      pointsRel: [[-30, -18], [-10, 24], [15, -14], [35, 20]],
      smoothBezier: 1, xyWaveAmp: 0.0, xyWaveFreq: 6,
      extrusionMode: 'continuous', nonplanarMode: 'sine_wave',
      npAmpZ: 2.0, npFreq: 2, segResolution: 48,
    },
    groups: [
      {
        title: '1. Altezza & Stile Curva Disegnata',
        fields: [
          { key: 'heightMm', label: 'Altezza Estrusione (mm)', min: 0.5, max: 250, step: 0.5, unit: 'mm' },
          { key: 'smoothBezier', label: 'Curva Bézier (1=Curva, 0=Spezzata)', min: 0, max: 1, step: 1, unit: 'bool' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
      {
        title: '2. Combina Onda XY + Non-Planare Z',
        fields: [
          { key: 'xyWaveAmp', label: 'Ampiezza Onda Laterale XY', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'xyWaveFreq', label: 'Cicli Onda XY', min: 1, max: 16, step: 1, unit: 'cicli' },
          { key: 'npAmpZ', label: 'Ampiezza Non-Planare Z', min: 0, max: 10, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Cicli Non-Planari Z', min: 1, max: 8, step: 1, unit: 'cicli' },
          { key: 'segResolution', label: 'Risoluzione Curva', min: 20, max: 80, step: 4, unit: 'seg' },
        ],
      },
    ],
  },

  elliptic_twisted_tower: {
    type: 'elliptic_twisted_tower',
    title: '13. Torre Ellittica Ritorta (Elliptical + Twist)',
    icon: '🧬',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 1,
      heightMm: 55, layerH: 0.24, extrusionW: 0.5,
      bottomLayers: 3, radiusA: 34, radiusB: 18,
      twistDeg: 180, taper: 1.0, verticalProfile: 'amphora', profileAmp: 3.0,
      xyWaveAmp: 1.2, xyWaveFreq: 8,
      extrusionMode: 'continuous', nonplanarMode: 'saddle',
      npAmpZ: 2.2, npFreq: 2, segResolution: 56,
    },
    groups: [
      {
        title: '1. Semiassi Ellisse, Altezza & Fondo Stagno',
        fields: [
          { key: 'heightMm', label: 'Altezza Totale (mm)', min: 2, max: 250, step: 1, unit: 'mm' },
          { key: 'radiusA', label: 'Semiasse Maggiore A (mm)', min: 8, max: 105, step: 1, unit: 'mm' },
          { key: 'radiusB', label: 'Semiasse Minore B (mm)', min: 6, max: 95, step: 1, unit: 'mm' },
          { key: 'bottomLayers', label: 'Layer Fondo Stagno (0..10)', min: 0, max: 10, step: 1, unit: 'strati' },
          { key: 'twistDeg', label: 'Rotazione Elicoidale Ellisse', min: -360, max: 360, step: 5, unit: '°' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
      {
        title: '2. Combina Sagoma Z, Onde XY & Non-Planare Z',
        fields: [
          { key: 'taper', label: 'Scala Top (Conicità)', min: 0.3, max: 2.0, step: 0.05, unit: '×' },
          { key: 'profileAmp', label: 'Ampiezza Sagoma Verticale', min: -20, max: 20, step: 0.5, unit: 'mm' },
          { key: 'xyWaveAmp', label: 'Costolature XY (mm)', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'xyWaveFreq', label: 'Numero Costolature', min: 2, max: 24, step: 1, unit: 'lobi' },
          { key: 'npAmpZ', label: 'Ampiezza Non-Planare Z', min: 0, max: 10, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Creste Non-Planari Z', min: 1, max: 8, step: 1, unit: 'onde' },
        ],
      },
    ],
  },

  concentric_infill_plate: {
    type: 'concentric_infill_plate',
    title: '14. Piastra / Sottobicchiere Riempimento Lab Convex',
    icon: '🔷',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 2,
      heightMm: 3.6, layerH: 0.24, extrusionW: 0.52,
      sides: 6, radius: 36, infillAngleDeg: 45,
      extrusionMode: 'continuous', nonplanarMode: 'dome',
      npAmpZ: 2.0, npFreq: 2,
    },
    groups: [
      {
        title: '1. Poligono, Riempimento Alternato & Cupola Z',
        fields: [
          { key: 'sides', label: 'Lati Poligono (3..24)', min: 3, max: 24, step: 1, unit: 'lati' },
          { key: 'radius', label: 'Raggio Esterno (mm)', min: 10, max: 105, step: 1, unit: 'mm' },
          { key: 'heightMm', label: 'Spessore Totale (mm)', min: 0.24, max: 40, step: 0.24, unit: 'mm' },
          { key: 'infillAngleDeg', label: 'Rotazione Riempimento per Layer', min: 0, max: 90, step: 5, unit: '°' },
          { key: 'npAmpZ', label: 'Bombatura Non-Planare Z', min: 0, max: 8, step: 0.2, unit: 'mm' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.14, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },

  compound_wave_wall: {
    type: 'compound_wave_wall',
    title: '15. Parete Onda Composta (Sine + Square + Triangle)',
    icon: '📈',
    defaults: {
      x: 128, y: 128, z: 0.2, amsSlot: 3,
      heightMm: 30, layerH: 0.24, extrusionW: 0.5,
      spanX: 80, sineAmp: 6.0, sinePeriods: 4,
      triAmp: 3.0, triPeriods: 8,
      extrusionMode: 'continuous', nonplanarMode: 'arch_bridge',
      npAmpZ: 4.0, npFreq: 2, segResolution: 64,
    },
    groups: [
      {
        title: '1. Somma Armonica di Onde & Altezza',
        fields: [
          { key: 'heightMm', label: 'Altezza Parete (mm)', min: 1, max: 250, step: 1, unit: 'mm' },
          { key: 'spanX', label: 'Lunghezza X (mm)', min: 20, max: 165, step: 2, unit: 'mm' },
          { key: 'sineAmp', label: 'Ampiezza Sinusoide Primaria', min: 0, max: 20, step: 0.5, unit: 'mm' },
          { key: 'sinePeriods', label: 'Periodi Sinusoide', min: 1, max: 16, step: 1, unit: 'cicli' },
          { key: 'triAmp', label: 'Ampiezza Modulazione Triangolare', min: 0, max: 12, step: 0.5, unit: 'mm' },
          { key: 'triPeriods', label: 'Periodi Triangolare', min: 1, max: 24, step: 1, unit: 'cicli' },
          { key: 'npAmpZ', label: 'Arco/Onda Non-Planare Z', min: 0, max: 12, step: 0.2, unit: 'mm' },
          { key: 'npFreq', label: 'Cicli Non-Planari Z', min: 1, max: 6, step: 1, unit: 'cicli' },
          { key: 'layerH', label: 'Altezza Layer', min: 0.12, max: 0.44, step: 0.02, unit: 'mm' },
          { key: 'extrusionW', label: 'Larghezza Estrusione', min: 0.35, max: 1.1, step: 0.05, unit: 'mm' },
        ],
      },
    ],
  },
};

// Schede delle forme per il selettore: nome breve, famiglia e cosa produce, in parole.
export const SHAPE_FAMILIES = ['Vasi e contenitori', 'Strutture e reticoli', 'Pareti e superfici', 'Disegno libero'];

export const SHAPE_INFO = {
  combinable_vessel: { name: 'Vaso', family: 'Vasi e contenitori', blurb: 'Poligono o cerchio che sale in altezza: sagoma, torsione, costolature e onda non planare si combinano.' },
  ripple_texture_cylinder: { name: 'Cilindro increspato', family: 'Vasi e contenitori', blurb: 'Parete tonda con una texture a onde fitte, adatta a paralumi e portapenne.' },
  helical_thread_screw: { name: 'Contenitore filettato', family: 'Vasi e contenitori', blurb: 'Barattolo con filetto elicoidale lungo la parete.' },
  elliptic_twisted_tower: { name: 'Torre ellittica ritorta', family: 'Vasi e contenitori', blurb: 'Sezione ellittica che ruota salendo, come un nastro avvolto.' },
  star_polygon_lattice: { name: 'Stella poligonale', family: 'Vasi e contenitori', blurb: 'Copie ruotate di un poligono che formano una stella in pianta.' },
  fractional_polar_engine: { name: 'Spirografo 3D', family: 'Strutture e reticoli', blurb: 'Curve polari a rapporto frazionario impilate in altezza.' },
  metamaterial_grid: { name: 'Reticolo flessibile', family: 'Strutture e reticoli', blurb: 'Griglia auxetica che si piega e si allunga.' },
  nonplanar_torus_spacer: { name: 'Anello non planare', family: 'Strutture e reticoli', blurb: 'Distanziale ad anello con strati che ondeggiano in Z.' },
  spherical_dome: { name: 'Cupola', family: 'Strutture e reticoli', blurb: 'Calotta sferica costruita per meridiani o paralleli.' },
  curve_extrusion: { name: 'Parete su curva', family: 'Pareti e superfici', blurb: 'Parete che segue una curva di Bézier: ponti, divisori, bordi.' },
  arc_wave_shell: { name: 'Guscio ondulato', family: 'Pareti e superfici', blurb: 'Parete ad arco con onde lungo il percorso.' },
  compound_wave_wall: { name: 'Parete a onda composta', family: 'Pareti e superfici', blurb: 'Somma di onda sinusoidale, quadra e triangolare.' },
  nonplanar_surface: { name: 'Superficie scolpita', family: 'Pareti e superfici', blurb: 'Tappeto a zig-zag con quota Z modellata: onde, cupole, selle.' },
  concentric_infill_plate: { name: 'Piastra concentrica', family: 'Pareti e superfici', blurb: 'Piastra piena a anelli concentrici, come un sottobicchiere.' },
  plate_drawn_path: { name: 'Percorso disegnato', family: 'Disegno libero', blurb: 'Clicca punti sul piatto 3D: il percorso diventa una parete.' },
};

export function shapeName(key) {
  return (SHAPE_INFO[key] && SHAPE_INFO[key].name) || 'Forma';
}

export function createSceneObject(type, cx, cy, index = 1) {
  const bp = OBJECT_BLUEPRINTS[type] || OBJECT_BLUEPRINTS.combinable_vessel;
  const params = structuredClone(bp.defaults);
  params.x = Math.round(cx);
  params.y = Math.round(cy);
  return {
    id: `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: bp.type,
    blueprintKey: type,
    name: index > 1 ? `${shapeName(type)} ${index}` : shapeName(type),
    visible: true,
    params,
  };
}

export function compileSceneToPython(sceneObjects, presetId, autoClampHotend = true, print = {}) {
  const pr = {
    firstLayerH: 0.2, firstLayerSpeed: 30, printSpeed: 40, fanPercent: 100, nozzle: 220, nozzleFirst: 220,
    ...print,
  };
  const hotend = HOTEND_PROFILES[presetId] || HOTEND_PROFILES.a1;
  const activeObjs = sceneObjects.filter((o) => o.visible);

  const serialized = JSON.stringify(
    activeObjs.map((o) => ({ id: o.id, type: o.type, name: o.name, params: o.params })),
    null,
    2
  );

  return `import fullcontrol as fc
import lab.fullcontrol as fclab
import math

# --- FULLCONTROL WYSIWYG ENGINE (12 Archetipi Combinabili, Fondo Stagno & Hotend-Safe) ---
HOTEND_MAX_SLOPE_DEG = ${hotend.maxSlopeDeg}
HOTEND_MAX_TAN = ${hotend.maxSlopeTan.toFixed(4)}
AUTO_CLAMP_HOTEND = ${autoClampHotend ? 'True' : 'False'}

SCENE_OBJECTS = ${serialized}

# --- Primo layer e stampabilità (uguali per tutte le forme) ---
FIRST_LAYER_H = ${pr.firstLayerH}          # altezza del primo layer (mm)
FIRST_LAYER_W = 0.5                        # linea del primo layer, come i profili Bambu
FIRST_LAYER_SPEED = ${Math.round(pr.firstLayerSpeed * 60)}   # mm/min
PRINT_SPEED = ${Math.round(pr.printSpeed * 60)}              # mm/min
FAN_PERCENT = ${pr.fanPercent}             # ventola dal secondo layer (spenta sul primo, per l'adesione)
NOZZLE_TEMP = ${pr.nozzle}                 # dal secondo layer
NOZZLE_TEMP_FIRST = ${pr.nozzleFirst}      # primo layer
NP_RAMP_LAYERS = 4                         # l'onda non planare entra gradualmente dopo il primo layer

_LAYER = {"k": 0, "h": FIRST_LAYER_H}

def np_ramp():
    return min(1.0, _LAYER["k"] / float(NP_RAMP_LAYERS))

def spiral_u(lyr, u):
    # il primo layer di un oggetto resta piatto: niente salita a spirale a contatto con il piatto
    return 0.0 if lyr == 0 else u

def geom(w):
    first = _LAYER["k"] == 0
    return fc.ExtrusionGeometry(area_model="stadium", width=max(w, FIRST_LAYER_W) if first else w, height=_LAYER["h"])

def begin_layer(steps_list, k, z, h_base, w, feature):
    first = (k == 0)
    h = FIRST_LAYER_H if first else h_base
    _LAYER["k"] = k
    _LAYER["h"] = h
    lw = max(w, FIRST_LAYER_W) if first else w
    steps_list.append(fc.ManualGcode(text=f"; CHANGE_LAYER\\n; Z_HEIGHT: {round(z, 3)}\\n; LAYER_HEIGHT: {h}\\n; FEATURE: {feature}\\n; LINE_WIDTH: {lw}"))
    steps_list.append(geom(w))
    if first:
        steps_list.append(fc.Printer(print_speed=FIRST_LAYER_SPEED))
        steps_list.append(fc.Fan(speed_percent=0))
    elif k == 1:
        steps_list.append(fc.Printer(print_speed=PRINT_SPEED))
        steps_list.append(fc.Fan(speed_percent=FAN_PERCENT))
        if NOZZLE_TEMP != NOZZLE_TEMP_FIRST:
            steps_list.append(fc.Hotend(temp=NOZZLE_TEMP, wait=False))

# --- Fondo stagno generico: segue il contorno reale della parete ---
class BottomSlot:
    def __init__(self, layers, cx, cy, base_z, w, h, slot, rings):
        self.layers, self.cx, self.cy, self.base_z, self.w, self.h, self.slot, self.rings = layers, cx, cy, base_z, w, h, slot, rings

def bottom_slot(steps_list, layers, cx, cy, base_z, w, h, slot, rings=None):
    """Segnaposto: il fondo si costruisce alla fine, dal primo giro di parete (rings=None) o da anelli espliciti
    [(punti, foro?)]. Il suo anello esterno coincide con la parete, quindi fondo e parete sono sempre uniti."""
    if layers > 0:
        steps_list.append(BottomSlot(layers, cx, cy, base_z, w, h, slot, rings))

def ring_circle(cx, cy, r, n=120):
    return [(cx + r * math.cos(2.0 * math.pi * i / n), cy + r * math.sin(2.0 * math.pi * i / n)) for i in range(n)]

def ring_polar(cx, cy, r_of_theta, n=240):
    out = []
    for i in range(n):
        th = 2.0 * math.pi * i / n
        r = r_of_theta(th)
        out.append((cx + r * math.cos(th), cy + r * math.sin(th)))
    return out

def _is_layer_marker(s):
    return isinstance(s, fc.ManualGcode) and (s.text or "").startswith("; CHANGE_LAYER")

def capture_contour(steps_list, start):
    """Primo giro della parete dopo il segnaposto: i punti del suo primo layer, per un giro completo."""
    i = start
    while i < len(steps_list) and not _is_layer_marker(steps_list[i]):
        i += 1
    i += 1
    pts = []
    while i < len(steps_list) and not _is_layer_marker(steps_list[i]):
        st = steps_list[i]
        if isinstance(st, fc.Point) and st.x is not None and st.y is not None:
            pts.append((st.x, st.y))
        i += 1
    if len(pts) < 3:
        return None
    gx = sum(q[0] for q in pts) / len(pts)
    gy = sum(q[1] for q in pts) / len(pts)
    ring = [pts[0]]
    acc = 0.0
    prev = math.atan2(pts[0][1] - gy, pts[0][0] - gx)
    for x, y in pts[1:]:
        a = math.atan2(y - gy, x - gx)
        acc += abs((a - prev + math.pi) % (2.0 * math.pi) - math.pi)
        prev = a
        if acc >= 2.0 * math.pi - 1e-6:
            break
        if math.hypot(x - ring[-1][0], y - ring[-1][1]) > 0.05:
            ring.append((x, y))
    return (ring, (gx, gy)) if len(ring) >= 3 else None

def inset_ring(ring, c, d):
    """Spostamento radiale verso il centro (d > 0) o verso l'esterno (d < 0, fori). Per contorni 'a stella'
    rispetto al centro non si auto-interseca e la distanza normale è <= d: niente fessure tra le linee."""
    out = []
    for x, y in ring:
        dx, dy = x - c[0], y - c[1]
        r = math.hypot(dx, dy)
        nr = r - d
        if r < 1e-6 or nr <= 0.25:
            return None
        out.append((c[0] + dx * nr / r, c[1] + dy * nr / r))
    return out

def _inside(x, y, rings):
    hit = False
    for ring in rings:
        n = len(ring)
        for i in range(n):
            x1, y1 = ring[i]
            x2, y2 = ring[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x1 + (y - y1) * (x2 - x1) / (y2 - y1) > x:
                hit = not hit
    return hit

def _scan_lines(rings, sp, angle):
    ca, sa = math.cos(angle), math.sin(angle)
    rot = [[(x * ca + y * sa, -x * sa + y * ca) for x, y in r] for r in rings]
    ys = [q[1] for r in rot for q in r]
    lines = []
    y = min(ys) + sp * 0.5
    while y < max(ys):
        xs = []
        for r in rot:
            n = len(r)
            for i in range(n):
                xa, ya = r[i]
                xb, yb = r[(i + 1) % n]
                if (ya > y) != (yb > y):
                    xs.append(xa + (y - ya) * (xb - xa) / (yb - ya))
        xs.sort()
        lines.append((y, [(xs[j], xs[j + 1]) for j in range(0, len(xs) - 1, 2) if xs[j + 1] - xs[j] > sp * 0.3]))
        y += sp
    return lines, (lambda u, v: (u * ca - v * sa, u * sa + v * ca))

def build_bottom(slot_obj, rings, center):
    out = []
    col = ams_rgb(slot_obj.slot)
    P = lambda x, y, z: fc.Point(x=round(x, 3), y=round(y, 3), z=round(z, 3), color=col)
    for b in range(slot_obj.layers):
        h = FIRST_LAYER_H if b == 0 else slot_obj.h
        w = max(slot_obj.w, FIRST_LAYER_W) if b == 0 else slot_obj.w
        sp = w - h * (1.0 - math.pi / 4.0)   # passo tra linee adiacenti (sezione 'stadium', come gli slicer)
        z = slot_obj.base_z + b * slot_obj.h
        begin_layer(out, b, z, slot_obj.h, slot_obj.w, "Bottom surface")
        n_perim = 0
        for k in range(2):
            loops = [inset_ring(r, center, -k * sp if hole else k * sp) for r, hole in rings]
            if any(l is None for l in loops):
                break
            for l in loops:
                out.extend(fc.travel_to(P(l[0][0], l[0][1], z)))
                out.extend(P(x, y, z) for x, y in l[1:] + [l[0]])
            n_perim = k + 1
        if n_perim == 0:
            continue
        d_e = (n_perim - 1) * sp + 0.85 * w   # le linee toccano l'ultimo perimetro con il 15% di sovrapposizione
        fill = [inset_ring(r, center, -d_e if hole else d_e) for r, hole in rings]
        if any(f is None for f in fill):
            continue
        lines, back = _scan_lines(fill, sp, math.radians(45.0 if b % 2 == 0 else -45.0))
        last = None
        flip = False
        for y, segs in lines:
            seq = [(xb, xa) for xa, xb in reversed(segs)] if flip else segs
            for xa, xb in seq:
                pa, pb = back(xa, y), back(xb, y)
                near = last is not None and math.hypot(pa[0] - last[0], pa[1] - last[1]) < 2.0 * sp
                if near and _inside((pa[0] + last[0]) / 2, (pa[1] + last[1]) / 2, fill):
                    out.append(P(pa[0], pa[1], z))
                else:
                    out.extend(fc.travel_to(P(pa[0], pa[1], z)))
                out.append(P(pb[0], pb[1], z))
                last = pb
            flip = not flip
    return out

def resolve_bottoms(steps_list):
    out = []
    for i, st in enumerate(steps_list):
        if not isinstance(st, BottomSlot):
            out.append(st)
            continue
        if st.rings is None:
            cap = capture_contour(steps_list, i)
            if cap is None:
                continue
            rings, center = [(cap[0], False)], cap[1]
        else:
            rings, center = st.rings, (st.cx, st.cy)
        out.extend(build_bottom(st, rings, center))
    return out

def calc_np_z(mode, u, angle, r_ratio, amp_z, freq, characteristic_xy):
    amp_z = float(amp_z) * np_ramp()
    if mode == "planar" or amp_z <= 0.001:
        return 0.0
    eff_amp = float(amp_z)
    if AUTO_CLAMP_HOTEND and characteristic_xy > 0.1:
        max_safe = (HOTEND_MAX_TAN * 0.90 * characteristic_xy) / max(1.0, float(freq) * 2.0 * math.pi)
        if eff_amp > max_safe:
            eff_amp = max_safe
    if mode == "sine_wave":
        return eff_amp * 0.5 * (1.0 - math.cos(angle * freq))
    elif mode == "arch_bridge":
        return eff_amp * math.sin(u * math.pi * max(1, int(freq)))
    elif mode == "saddle":
        return eff_amp * 0.5 * (1.0 + math.cos(2.0 * angle))
    elif mode == "dome":
        return eff_amp * max(0.0, 1.0 - r_ratio * r_ratio)
    elif mode == "crater":
        return eff_amp * min(1.0, r_ratio * r_ratio)
    elif mode == "tilted":
        return eff_amp * 0.5 * (1.0 + math.cos(angle))
    elif mode == "tri_wave":
        phase = ((angle * freq) / (2.0 * math.pi)) % 1.0
        return eff_amp * (2.0 * phase if phase < 0.5 else 2.0 * (1.0 - phase))
    return 0.0

def calc_vertical_scale(v_mode, t_norm, taper, prof_amp, base_r):
    linear_r = base_r * ((1.0 - t_norm) + t_norm * taper)
    if v_mode == "amphora":
        return max(3.0, linear_r + prof_amp * math.sin(t_norm * 2.0 * math.pi))
    elif v_mode == "bulb":
        return max(3.0, linear_r + abs(prof_amp) * math.sin(t_norm * math.pi))
    elif v_mode == "hourglass":
        return max(3.0, linear_r - abs(prof_amp) * math.sin(t_norm * math.pi))
    elif v_mode == "bamboo":
        return max(3.0, linear_r + prof_amp * 0.6 * abs(math.sin(t_norm * 4.0 * math.pi)))
    elif v_mode == "chalice":
        return max(3.0, base_r + prof_amp * (t_norm ** 2.2) + (taper - 1.0) * base_r * t_norm)
    return max(3.0, linear_r)

def polygon_radius_at_angle(sides, radius, theta):
    if sides >= 60:
        return radius
    alpha = (2.0 * math.pi) / sides
    local_a = (theta % alpha) - (0.5 * alpha)
    return radius * math.cos(0.5 * alpha) / max(0.2, math.cos(local_a))

def apply_texture_mod(ext_mode, r_val, u, segs, lyr, xy_freq):
    if ext_mode == "wave_weave":
        return r_val + 0.42 * math.sin(u * segs * math.pi + (lyr % 2) * math.pi)
    elif ext_mode == "knurl_tri":
        ph = (u * max(8, int(xy_freq) * 3)) % 1.0
        tri = (4.0 * ph - 1.0) if ph < 0.5 else (3.0 - 4.0 * ph)
        return r_val + 0.55 * tri
    elif ext_mode == "rib_square":
        sq = 1.0 if math.sin(u * max(6, int(xy_freq) * 2) * 2.0 * math.pi) >= 0 else -1.0
        return r_val + 0.55 * sq
    return r_val

def exact_contour_radius(sides, base_r, theta, rot_ang, xy_amp, xy_freq):
    r_p = polygon_radius_at_angle(sides, base_r, theta)
    if abs(xy_amp) > 0.01:
        r_p += xy_amp * math.sin(theta * xy_freq + rot_ang * 2.0)
    return max(1.5, r_p)

steps = []

for obj_idx, obj in enumerate(SCENE_OBJECTS):
    p = obj["params"]
    otype = obj["type"]
    cx, cy = float(p["x"]), float(p["y"])
    z_obj = float(p["z"])
    base_z = FIRST_LAYER_H + (z_obj - 0.2 if z_obj > 0.3 else 0.0)   # cima del primo layer (Z oggetto fino a 0,3 = appoggiato)
    slot = int(p.get("amsSlot", 1))
    ext_mode = p.get("extrusionMode", "continuous")
    np_mode = p.get("nonplanarMode", "sine_wave")
    w_base = float(p.get("extrusionW", 0.5))
    h_base = max(0.08, float(p.get("layerH", 0.24)))
    height_mm = max(h_base, float(p.get("heightMm", 45.0)))
    n_layers = max(1, int(round((height_mm - FIRST_LAYER_H) / h_base)) + 1)
    bottom_layers = max(0, min(n_layers, int(p.get("bottomLayers", 0))))
    amp_z = float(p.get("npAmpZ", 2.0))
    freq_z = float(p.get("npFreq", 3))
    xy_amp = float(p.get("xyWaveAmp", 0.0))
    xy_freq = float(p.get("xyWaveFreq", 6))
    seg_res = max(16, int(p.get("segResolution", 36)))

    steps.append(fc.GcodeComment(text=f"=== OBJECT {obj_idx + 1}: {obj['name']} ==="))
    steps.append(geom(w_base))

    if otype == "combinable_vessel":
        sides = max(3, int(p.get("sides", 6)))
        rad0 = float(p.get("radius", 26.0))
        taper = float(p.get("taper", 1.0))
        v_prof = p.get("verticalProfile", "straight")
        prof_amp = float(p.get("profileAmp", 0.0))
        sweep_r = float(p.get("sweepRadius", 0.0))
        sweep_turns = float(p.get("sweepTurns", 1.0))
        twist_rad = math.radians(float(p.get("twistDeg", 0.0)))
        loops = max(1, int(p.get("wallLoops", 1)))

        has_waves = (abs(xy_amp) > 0.02) or (np_mode != "planar" and amp_z > 0.02) or (ext_mode != "continuous")
        segs = max(seg_res, sides) if has_waves or sides > 32 else sides
        perim_xy = 2.0 * math.pi * rad0

        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot)

        steps.append(geom(w_base))
        seal_collar_layers = 2 if bottom_layers > 0 else 0

        for lyr in range(bottom_layers, n_layers):
            t_lyr = lyr / max(1, n_layers - 1)
            z_layer_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_layer_nom, h_base, w_base, "Outer wall")

            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            sw_ang = t_lyr * sweep_turns * 2.0 * math.pi
            gx = cx + sweep_r * math.cos(sw_ang)
            gy = cy + sweep_r * math.sin(sw_ang)
            r_layer = calc_vertical_scale(v_prof, t_lyr, taper, prof_amp, rad0)

            for lp in range(loops):
                r_base_loop = max(2.0, r_layer - lp * w_base * 0.90)
                for s in range(segs + 1):
                    if loops == 1 and s == segs and lyr < n_layers - 1:
                        continue
                    u = s / segs
                    t_cont = (lyr + u) / max(1, n_layers) if loops == 1 else t_lyr
                    ang = u * 2.0 * math.pi
                    rot_ang = t_cont * twist_rad

                    r_now = exact_contour_radius(sides, r_base_loop, ang, rot_ang, xy_amp, xy_freq)
                    r_now = apply_texture_mod(ext_mode, r_now, u, segs, lyr, xy_freq)

                    px = gx + r_now * math.cos(ang + rot_ang)
                    py = gy + r_now * math.sin(ang + rot_ang)

                    layers_above_collar = max(0.0, (lyr + (u if loops == 1 else 0.0)) - (bottom_layers + seal_collar_layers))
                    max_watertight_amp = layers_above_collar * (h_base * 0.22)
                    eff_amp_z = min(amp_z, max_watertight_amp) if bottom_layers > 0 else amp_z
                    np_dz = calc_np_z(np_mode, u, ang, 0.5, eff_amp_z, freq_z, perim_xy)

                    z_spiral = (lyr + (spiral_u(lyr, u) if loops == 1 else 0.0)) * h_base
                    pz = base_z + z_spiral + np_dz

                    if ext_mode == "variable_width" and s % 4 == 0:
                        vw = round(w_base * (0.75 + 0.55 * math.sin(ang * max(2, int(xy_freq)))), 2)
                        steps.append(geom(vw))

                    pt = fc.Point(x=round(px, 2), y=round(py, 2), z=round(pz, 3), color=ams_rgb(cur_slot))
                    if s == 0 and (loops > 1 or (lyr == bottom_layers and bottom_layers == 0 and obj_idx > 0)):
                        steps.extend(fc.travel_to(pt))
                    steps.append(pt)

    elif otype == "star_polygon_lattice":
        sides = max(3, int(p.get("sides", 4)))
        rad0 = float(p.get("radius", 28.0))
        petals = max(2, int(p.get("petals", 5)))
        taper = float(p.get("taper", 1.0))
        v_prof = p.get("verticalProfile", "straight")
        prof_amp = float(p.get("profileAmp", 0.0))
        twist_rad = math.radians(float(p.get("twistDeg", 30.0)))
        perim_xy = 2.0 * math.pi * rad0

        r_star0 = calc_vertical_scale(v_prof, bottom_layers / max(1, n_layers - 1), taper, prof_amp, rad0)
        rot_star0 = (bottom_layers / max(1, n_layers - 1)) * twist_rad
        star_r = lambda th: max(polygon_radius_at_angle(sides, r_star0, th - (rot_star0 + (k * 2.0 * math.pi) / (sides * petals))) for k in range(petals))
        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot, rings=[(ring_polar(cx, cy, star_r, 360), False)])
        steps.append(geom(w_base))

        for lyr in range(bottom_layers, n_layers):
            t_lyr = lyr / max(1, n_layers - 1)
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            r_layer = calc_vertical_scale(v_prof, t_lyr, taper, prof_amp, rad0)
            rot_ang = t_lyr * twist_rad
            layers_above = max(0.0, lyr - (bottom_layers + 1))
            eff_amp_z = min(amp_z, layers_above * h_base * 0.22) if bottom_layers > 0 else amp_z

            for pet in range(petals):
                pet_ang = rot_ang + (pet * 2.0 * math.pi) / (sides * petals)
                segs_p = sides * 8
                for s in range(segs_p + 1):
                    u = s / segs_p
                    ang = u * 2.0 * math.pi
                    r_p = polygon_radius_at_angle(sides, r_layer, ang)
                    r_p = apply_texture_mod(ext_mode, r_p, u, segs_p, lyr, sides)
                    px = cx + r_p * math.cos(ang + pet_ang)
                    py = cy + r_p * math.sin(ang + pet_ang)
                    np_dz = calc_np_z(np_mode, u, ang + pet_ang, 0.5, eff_amp_z, freq_z, perim_xy)
                    steps.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))

    elif otype == "fractional_polar_engine":
        rad0 = float(p.get("radius", 28.0))
        in_r = float(p.get("innerRadius", 14.0))
        lobes = max(3, int(p.get("lobes", 7)))
        taper = float(p.get("taper", 1.1))
        v_prof = p.get("verticalProfile", "amphora")
        prof_amp = float(p.get("profileAmp", 3.5))
        twist_rad = math.radians(float(p.get("twistDeg", 90.0)))
        segs = max(48, seg_res)
        perim_xy = 2.0 * math.pi * rad0

        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot)
        steps.append(geom(w_base))

        for lyr in range(bottom_layers, n_layers):
            t_lyr = lyr / max(1, n_layers - 1)
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            scale_f = calc_vertical_scale(v_prof, t_lyr, taper, prof_amp, rad0) / max(1.0, rad0)
            r_out = rad0 * scale_f
            r_in = min(r_out - 2.0, in_r * scale_f)
            r_mid = 0.5 * (r_out + r_in)
            r_amp = 0.5 * (r_out - r_in)
            layers_above = max(0.0, lyr - (bottom_layers + 1))
            eff_amp_z = min(amp_z, layers_above * h_base * 0.22) if bottom_layers > 0 else amp_z

            for s in range(segs):
                u = s / segs
                ang = u * 2.0 * math.pi
                phase = t_lyr * twist_rad + (lyr % 2) * (math.pi / lobes)
                r_now = r_mid + r_amp * math.cos(ang * lobes + phase)
                r_now = apply_texture_mod(ext_mode, r_now, u, segs, lyr, lobes)
                px = cx + r_now * math.cos(ang)
                py = cy + r_now * math.sin(ang)
                np_dz = calc_np_z(np_mode, u, ang, r_now / max(1.0, r_out), eff_amp_z, freq_z, perim_xy)
                z_sp = (lyr + spiral_u(lyr, u)) * h_base
                steps.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(base_z + z_sp + np_dz, 3), color=ams_rgb(cur_slot)))

    elif otype == "helical_thread_screw":
        rad0 = float(p.get("radius", 18.0))
        t_depth = float(p.get("threadDepth", 2.2))
        pitch_mm = max(1.0, float(p.get("threadPitchMm", 4.0)))
        starts = max(1, int(p.get("threadStarts", 1)))
        segs = max(48, seg_res)

        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot, rings=[(ring_polar(cx, cy, lambda th: polygon_radius_at_angle(6, (rad0 + t_depth + w_base) / math.cos(math.pi / 6.0), th), 360), False)])  # lati piatti oltre la cresta del filetto
        steps.append(geom(w_base))

        for lyr in range(bottom_layers, n_layers):
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            for s in range(segs):
                u = s / segs
                ang = u * 2.0 * math.pi
                z_sp = (lyr + spiral_u(lyr, u)) * h_base
                # Profilo cresta trapezoidale ISO lungo l'elica
                thread_phase = ((ang * starts) / (2.0 * math.pi) - (z_sp / pitch_mm)) % 1.0
                crest = max(0.0, 1.0 - abs(thread_phase - 0.5) * 3.2)
                r_now = rad0 + t_depth * crest
                px = cx + r_now * math.cos(ang)
                py = cy + r_now * math.sin(ang)
                steps.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(base_z + z_sp, 3), color=ams_rgb(cur_slot)))

    elif otype == "nonplanar_torus_spacer":
        r_out = float(p.get("outerRadius", 32.0))
        r_in = min(r_out - 3.0, float(p.get("innerRadius", 16.0)))
        r_waves = max(4, int(p.get("radialWaves", 16)))
        twist_rad = math.radians(float(p.get("twistDeg", 25.0)))
        segs = max(48, r_waves * 4)
        perim_xy = 2.0 * math.pi * r_out

        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot, rings=[(ring_circle(cx, cy, r_out), False), (ring_circle(cx, cy, r_in), True)])
        steps.append(geom(w_base))

        for lyr in range(bottom_layers, n_layers):
            t_lyr = lyr / max(1, n_layers - 1)
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            layers_above = max(0.0, lyr - (bottom_layers + 1))
            eff_amp_z = min(amp_z, layers_above * h_base * 0.22) if bottom_layers > 0 else amp_z
            rot_ang = t_lyr * twist_rad

            # 1) Anello esterno + 2) Anello interno + 3) Nervatura radiale sinusoidale (con travel_to puliti!)
            for ring_idx, ring_r in enumerate([r_out, r_in]):
                ring_pts = []
                for s in range(segs + 1):
                    u = s / segs
                    ang = u * 2.0 * math.pi
                    np_dz = calc_np_z(np_mode, u, ang, ring_r / r_out, eff_amp_z, freq_z, perim_xy)
                    ring_pts.append(fc.Point(x=round(cx + ring_r * math.cos(ang), 2), y=round(cy + ring_r * math.sin(ang), 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))
                if lyr > bottom_layers or ring_idx > 0 or obj_idx > 0:
                    steps.extend(fc.travel_to(ring_pts[0]))
                steps.extend(ring_pts)

            r_mid = 0.5 * (r_out + r_in)
            r_amp = 0.48 * (r_out - r_in)
            rad_pts = []
            for s in range(segs + 1):
                u = s / segs
                ang = u * 2.0 * math.pi
                r_w = r_mid + r_amp * math.sin(ang * r_waves + rot_ang)
                np_dz = calc_np_z(np_mode, u, ang, r_w / r_out, eff_amp_z, freq_z, perim_xy)
                rad_pts.append(fc.Point(x=round(cx + r_w * math.cos(ang), 2), y=round(cy + r_w * math.sin(ang), 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))
            steps.extend(fc.travel_to(rad_pts[0]))
            steps.extend(rad_pts)

    elif otype == "arc_wave_shell":
        rad0 = float(p.get("radius", 36.0))
        arc_rad = math.radians(float(p.get("arcDeg", 220.0)))
        w_amp = float(p.get("waveAmp", 3.5))
        periods = max(2, int(p.get("periods", 8)))
        twist_rad = math.radians(float(p.get("twistDeg", 25.0)))
        segs = max(40, periods * 8)
        arc_len = rad0 * arc_rad

        for lyr in range(n_layers):
            t_lyr = lyr / max(1, n_layers - 1)
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            pts = []
            for s in range(segs + 1):
                u = s / segs
                ang = -0.5 * arc_rad + u * arc_rad
                r_now = rad0 + w_amp * math.sin(u * periods * 2.0 * math.pi + t_lyr * twist_rad)
                r_now = apply_texture_mod(ext_mode, r_now, u, segs, lyr, periods)
                px = cx + r_now * math.cos(ang)
                py = cy + r_now * math.sin(ang)
                np_dz = calc_np_z(np_mode, u, u * 2.0 * math.pi, abs(u - 0.5) * 2.0, amp_z * t_lyr, freq_z, arc_len * 2.0)
                pts.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))
            if lyr % 2 == 1:
                pts.reverse()
            if lyr == 0 and obj_idx > 0:
                steps.extend(fc.travel_to(pts[0]))
            steps.extend(pts)

    elif otype == "metamaterial_grid":
        sx = float(p.get("sizeX", 60.0))
        sy = float(p.get("sizeY", 60.0))
        cells = max(2, int(p.get("cells", 6)))
        w_amp = float(p.get("waveAmp", 2.4))
        segs = max(28, cells * 8)

        for lyr in range(n_layers):
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr % 4) + 1) if ext_mode == "ams_bands" else slot
            is_x_dir = (lyr % 2 == 0)
            for c_idx in range(cells + 1):
                v = c_idx / cells
                line_pts = []
                for s in range(segs + 1):
                    u = s / segs
                    wave_off = w_amp * math.sin(u * cells * 2.0 * math.pi) * (1.0 if c_idx % 2 == 0 else -1.0)
                    if is_x_dir:
                        px = (cx - sx * 0.5) + u * sx
                        py = (cy - sy * 0.5) + v * sy + wave_off
                    else:
                        px = (cx - sx * 0.5) + v * sx + wave_off
                        py = (cy - sy * 0.5) + u * sy
                    np_dz = calc_np_z(np_mode, u, u * 2.0 * math.pi, math.hypot(u - 0.5, v - 0.5) * 2.0, amp_z, freq_z, sx * 2.0)
                    line_pts.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))
                if c_idx % 2 == 1:
                    line_pts.reverse()
                steps.extend(line_pts)

    elif otype == "spherical_dome":
        rad0 = float(p.get("radius", 34.0))
        sides = max(3, int(p.get("sides", 32)))
        segs = max(40, seg_res)
        perim_xy = 2.0 * math.pi * rad0

        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot)
        steps.append(geom(w_base))

        for lyr in range(bottom_layers, n_layers):
            t_lyr = (lyr - bottom_layers) / max(1, n_layers - bottom_layers - 1)
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            # Profilo calotta sferica/cosinusoidale morbida fino a chiusura
            lat_ang = t_lyr * 0.46 * math.pi
            r_dome = max(1.5, rad0 * math.cos(lat_ang))
            layers_above = max(0.0, lyr - (bottom_layers + 1))
            eff_amp_z = min(amp_z, layers_above * h_base * 0.22) * math.cos(lat_ang) if bottom_layers > 0 else amp_z * math.cos(lat_ang)

            for s in range(segs):
                u = s / segs
                ang = u * 2.0 * math.pi
                r_now = exact_contour_radius(sides, r_dome, ang, 0.0, xy_amp * math.cos(lat_ang), xy_freq)
                px = cx + r_now * math.cos(ang)
                py = cy + r_now * math.sin(ang)
                np_dz = calc_np_z(np_mode, u, ang, r_dome / rad0, eff_amp_z, freq_z, perim_xy)
                z_sp = (lyr + spiral_u(lyr, u)) * h_base
                steps.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(base_z + z_sp + np_dz, 3), color=ams_rgb(cur_slot)))

    elif otype == "curve_extrusion":
        span_x = float(p.get("spanX", 75.0))
        ctrl_y = float(p.get("ctrlY", 30.0))
        loops = max(1, int(p.get("wallLoops", 2)))
        segs = seg_res

        for lyr in range(n_layers):
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot

            for lp in range(loops):
                off_y = (lp - (loops - 1) * 0.5) * w_base * 0.94
                p0 = fc.Point(x=cx - span_x * 0.5, y=cy + off_y, z=base_z)
                p1 = fc.Point(x=cx, y=cy + ctrl_y + off_y, z=base_z)
                p2 = fc.Point(x=cx + span_x * 0.5, y=cy + off_y, z=base_z)
                curve_pts = fclab.bezier([p0, p1, p2], num_points=segs)
                if (lyr + lp) % 2 == 1:
                    curve_pts.reverse()
                for idx_pt, cpt in enumerate(curve_pts):
                    u = idx_pt / max(1, len(curve_pts) - 1)
                    if (lyr + lp) % 2 == 1:
                        u = 1.0 - u
                    if abs(xy_amp) > 0.01:
                        cpt.y += xy_amp * math.sin(u * xy_freq * 2.0 * math.pi)
                    np_dz = calc_np_z(np_mode, u, u * 2.0 * math.pi, abs(u - 0.5) * 2.0, amp_z, freq_z, span_x * 2.0)
                    cpt.x = round(cpt.x, 2)
                    cpt.y = round(cpt.y, 2)
                    cpt.z = round(base_z + lyr * h_base + np_dz, 3)
                    cpt.color = ams_rgb(cur_slot)
                if lyr == 0 and lp == 0 and obj_idx > 0:
                    steps.extend(fc.travel_to(curve_pts[0]))
                steps.extend(curve_pts)

    elif otype == "nonplanar_surface":
        sx = float(p.get("sizeX", 65.0))
        sy = float(p.get("sizeY", 50.0))
        passes = max(4, int(p.get("passesY", 22)))
        segs_x = seg_res

        rect = [(cx - sx * 0.5, cy - sy * 0.5), (cx + sx * 0.5, cy - sy * 0.5), (cx + sx * 0.5, cy + sy * 0.5), (cx - sx * 0.5, cy + sy * 0.5)]
        rect = [(rect[i][0] + (rect[(i + 1) % 4][0] - rect[i][0]) * t / 20.0, rect[i][1] + (rect[(i + 1) % 4][1] - rect[i][1]) * t / 20.0) for i in range(4) for t in range(20)]
        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot, rings=[(rect, False)])

        for lyr in range(max(1, n_layers - bottom_layers)):
            z_base_lyr = base_z + (bottom_layers + lyr) * h_base
            begin_layer(steps, bottom_layers + lyr, round(z_base_lyr, 3), h_base, w_base, "Outer wall")
            cur_slot = (((bottom_layers + lyr) % 4) + 1) if ext_mode == "ams_bands" else slot
            for row in range(passes):
                v = row / max(1, passes - 1)
                py = round((cy - sy * 0.5) + v * sy, 2)
                row_pts = []
                for i in range(segs_x + 1):
                    u = i / segs_x
                    px = round((cx - sx * 0.5) + u * sx, 2)
                    np_dz = calc_np_z(np_mode, u, u * 2.0 * math.pi, math.hypot(u - 0.5, v - 0.5) * 2.0, amp_z, freq_z, sx * 2.0)
                    np_dz *= math.cos((v - 0.5) * math.pi)
                    pz = round(z_base_lyr + max(0.0, np_dz), 3)
                    row_pts.append(fc.Point(x=px, y=py, z=pz, color=ams_rgb(cur_slot)))
                if row % 2 == 1:
                    row_pts.reverse()
                steps.extend(row_pts)

    elif otype == "plate_drawn_path":
        pts_rel = p.get("pointsRel", [[-25, -15], [0, 25], [25, -15]])
        use_bez = int(p.get("smoothBezier", 1)) == 1
        ctrl_pts = [fc.Point(x=cx + pr[0], y=cy + pr[1], z=base_z) for pr in pts_rel]
        if len(ctrl_pts) >= 2:
            base_curve = fclab.bezier(ctrl_pts, num_points=seg_res) if (use_bez and len(ctrl_pts) >= 3) else []
            if not base_curve:
                segs_per_seg = max(4, seg_res // max(1, len(ctrl_pts) - 1))
                for idx_c in range(len(ctrl_pts) - 1):
                    base_curve.extend(fc.segmented_line(ctrl_pts[idx_c], ctrl_pts[idx_c + 1], segments=segs_per_seg))
            span_est = max(20.0, fc.path_length(base_curve))
            for lyr in range(n_layers):
                z_nom = round(base_z + lyr * h_base, 3)
                begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
                cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
                lyr_pts = []
                for idx_pt, bpt in enumerate(base_curve):
                    u = idx_pt / max(1, len(base_curve) - 1)
                    px, py = bpt.x, bpt.y
                    if abs(xy_amp) > 0.01:
                        py += xy_amp * math.sin(u * xy_freq * 2.0 * math.pi)
                    np_dz = calc_np_z(np_mode, u, u * 2.0 * math.pi, 0.5, amp_z, freq_z, span_est)
                    pz = round(base_z + lyr * h_base + np_dz, 3)
                    lyr_pts.append(fc.Point(x=round(px, 2), y=round(py, 2), z=pz, color=ams_rgb(cur_slot)))
                if lyr % 2 == 1:
                    lyr_pts.reverse()
                if lyr == 0 and obj_idx > 0:
                    steps.extend(fc.travel_to(lyr_pts[0]))
                steps.extend(lyr_pts)

    elif otype == "elliptic_twisted_tower":
        ra = float(p.get("radiusA", 34.0))
        rb = float(p.get("radiusB", 18.0))
        taper = float(p.get("taper", 1.0))
        v_prof = p.get("verticalProfile", "amphora")
        prof_amp = float(p.get("profileAmp", 3.0))
        twist_rad = math.radians(float(p.get("twistDeg", 180.0)))
        segs = max(40, seg_res)
        perim_xy = math.pi * (ra + rb)

        bottom_slot(steps, bottom_layers, cx, cy, base_z, w_base, h_base, slot)
        steps.append(geom(w_base))

        for lyr in range(bottom_layers, n_layers):
            t_lyr = lyr / max(1, n_layers - 1)
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            scale_f = calc_vertical_scale(v_prof, t_lyr, taper, prof_amp, ra) / max(1.0, ra)
            rot_e = t_lyr * twist_rad
            cos_r, sin_r = math.cos(rot_e), math.sin(rot_e)
            layers_above = max(0.0, lyr - (bottom_layers + 1))
            eff_amp_z = min(amp_z, layers_above * h_base * 0.22) if bottom_layers > 0 else amp_z

            for s in range(segs):
                u = s / segs
                ang = u * 2.0 * math.pi
                mod = 1.0 + (xy_amp / max(8.0, ra)) * math.sin(ang * xy_freq)
                ex = ra * scale_f * mod * math.cos(ang)
                ey = rb * scale_f * mod * math.sin(ang)
                px = cx + ex * cos_r - ey * sin_r
                py = cy + ex * sin_r + ey * cos_r
                np_dz = calc_np_z(np_mode, u, ang, 0.5, eff_amp_z, freq_z, perim_xy)
                z_sp = (lyr + spiral_u(lyr, u)) * h_base
                steps.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(base_z + z_sp + np_dz, 3), color=ams_rgb(cur_slot)))

    elif otype == "concentric_infill_plate":
        sides = max(3, int(p.get("sides", 6)))
        rad0 = float(p.get("radius", 36.0))
        rot_step = math.radians(float(p.get("infillAngleDeg", 45.0)))
        step_over = w_base * 0.92
        n_lines = max(6, int(round((2.0 * rad0) / step_over)))
        perim_xy = 2.0 * math.pi * rad0

        for lyr in range(n_layers):
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Bottom surface")
            cur_slot = ((lyr % 4) + 1) if ext_mode == "ams_bands" else slot
            ang_rot = lyr * rot_step
            cos_a, sin_a = math.cos(ang_rot), math.sin(ang_rot)
            # Contorno poligonale esterno
            perim_pts = []
            for s in range(sides + 1):
                a_p = (s / sides) * 2.0 * math.pi
                px = cx + rad0 * math.cos(a_p)
                py = cy + rad0 * math.sin(a_p)
                np_dz = calc_np_z(np_mode, s / sides, a_p, 1.0, amp_z * (lyr / max(1, n_layers - 1)), freq_z, perim_xy)
                perim_pts.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))
            if lyr > 0 or obj_idx > 0:
                steps.extend(fc.travel_to(perim_pts[0]))
            steps.extend(perim_pts)

            # Riempimento interno inclinato dentro il raggio inscritto
            r_inscr = rad0 * math.cos(math.pi / sides) - w_base * 0.8
            for li in range(n_lines):
                v = (li / max(1, n_lines - 1)) * 2.0 - 1.0
                ly = v * r_inscr
                lx_max = math.sqrt(max(0.0, r_inscr * r_inscr - ly * ly))
                if lx_max < 1.0:
                    continue
                x0, x1 = (-lx_max, lx_max) if (li % 2 == 0) else (lx_max, -lx_max)
                for px_loc in (x0, x1):
                    px = cx + px_loc * cos_a - ly * sin_a
                    py = cy + px_loc * sin_a + ly * cos_a
                    r_rat = math.hypot(px_loc, ly) / max(1.0, rad0)
                    np_dz = calc_np_z(np_mode, 0.5, 0.0, r_rat, amp_z * (lyr / max(1, n_layers - 1)), freq_z, perim_xy)
                    steps.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))

    elif otype == "compound_wave_wall":
        sx = float(p.get("spanX", 80.0))
        s_amp = float(p.get("sineAmp", 6.0))
        s_per = max(1, int(p.get("sinePeriods", 4)))
        t_amp = float(p.get("triAmp", 3.0))
        t_per = max(1, int(p.get("triPeriods", 8)))
        segs = max(40, seg_res)

        for lyr in range(n_layers):
            z_nom = round(base_z + lyr * h_base, 3)
            begin_layer(steps, lyr, z_nom, h_base, w_base, "Outer wall")
            cur_slot = ((lyr // max(1, n_layers // 4)) % 4) + 1 if ext_mode == "ams_bands" else slot
            pts = []
            for s in range(segs + 1):
                u = s / segs
                px = (cx - sx * 0.5) + u * sx
                ph_t = (u * t_per) % 1.0
                tri = (4.0 * ph_t - 1.0) if ph_t < 0.5 else (3.0 - 4.0 * ph_t)
                py = cy + s_amp * math.sin(u * s_per * 2.0 * math.pi) + t_amp * tri
                np_dz = calc_np_z(np_mode, u, u * 2.0 * math.pi, abs(u - 0.5) * 2.0, amp_z, freq_z, sx * 2.0)
                pts.append(fc.Point(x=round(px, 2), y=round(py, 2), z=round(z_nom + np_dz, 3), color=ams_rgb(cur_slot)))
            if lyr % 2 == 1:
                pts.reverse()
            if lyr == 0 and obj_idx > 0:
                steps.extend(fc.travel_to(pts[0]))
            steps.extend(pts)

steps = resolve_bottoms(steps)
`;
}

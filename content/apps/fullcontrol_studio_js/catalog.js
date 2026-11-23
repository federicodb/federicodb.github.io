// SPDX-License-Identifier: GPL-3.0-only — FullControl Studio, Orfini Math Lab (vedi LICENZA.txt)
export const PRINTER_PRESETS = {
  a1_mini: {
    id: 'a1_mini',
    label: 'Bambu Lab A1 mini',
    shortLabel: 'A1 mini',
    kinematics: 'Bed-slinger',
    amsType: 'AMS lite',
    hasAuxFan: false,
    excludeZone: null,
    bedX: 180,
    bedY: 180,
    bedZ: 180,
    fcPrinter: 'bambulab_a1_mini',
    defaultNozzle: 220,
    defaultBed: 60,
    defaultSpeed: 1800,
    defaultTravel: 9000,
    defaultFan: 100,
    defaultAuxFan: 0,
    defaultAmsColors: ['#00ae42', '#f2f2ee', '#262626', '#ff6a13'],
  },
  a1: {
    id: 'a1',
    label: 'Bambu Lab A1',
    shortLabel: 'A1',
    kinematics: 'Bed-slinger',
    amsType: 'AMS lite',
    hasAuxFan: false,
    excludeZone: null,
    bedX: 256,
    bedY: 256,
    bedZ: 256,
    fcPrinter: 'bambulab_a1',
    defaultNozzle: 220,
    defaultBed: 60,
    defaultSpeed: 2400,
    defaultTravel: 10000,
    defaultFan: 100,
    defaultAuxFan: 0,
    defaultAmsColors: ['#00ae42', '#f2f2ee', '#262626', '#ff6a13'],
  },
  p2s: {
    id: 'p2s',
    label: 'Bambu Lab P2S',
    shortLabel: 'P2S',
    kinematics: 'CoreXY Chiusa',
    amsType: 'AMS',
    hasAuxFan: true,
    excludeZone: { x: 18, y: 28 },
    bedX: 256,
    bedY: 256,
    bedZ: 256,
    fcPrinter: 'bambulab_p2s',
    defaultNozzle: 220,
    defaultBed: 60,
    defaultSpeed: 3000,
    defaultTravel: 12000,
    defaultFan: 100,
    defaultAuxFan: 70,
    defaultAmsColors: ['#00ae42', '#f2f2ee', '#262626', '#ff6a13'],
  },
};

export const FUNCTION_MENU = [
  {
    category: '1. Stato, Macchina & AMS',
    items: [
      {
        name: 'ams_change(slot)',
        desc: 'Cambia bobina AMS / AMS lite (Slot 1..4) e colore 3D',
        params: [{ name: 'slot', label: 'Slot AMS (1-4)', default: 2, min: 1, max: 4, step: 1 }],
        buildSnippet: (p) => `steps.extend(ams_change(${p.slot}))`,
      },
      {
        name: 'Point(x, y, z)',
        desc: 'Punto target nello spazio 3D',
        params: [
          { name: 'x', label: 'X (mm)', default: 90, min: 0, max: 256, step: 0.5 },
          { name: 'y', label: 'Y (mm)', default: 90, min: 0, max: 256, step: 0.5 },
          { name: 'z', label: 'Z (mm)', default: 0.2, min: 0, max: 256, step: 0.05 },
        ],
        buildSnippet: (p) => `steps.append(fc.Point(x=${p.x}, y=${p.y}, z=${p.z}))`,
      },
      {
        name: 'Extruder(on)',
        desc: 'Attiva o disattiva estrusione',
        params: [{ name: 'on', label: 'Estrusione Attiva (True/False)', default: 'True', type: 'select', options: ['True', 'False'] }],
        buildSnippet: (p) => `steps.append(fc.Extruder(on=${p.on}))`,
      },
      {
        name: 'ExtrusionGeometry',
        desc: 'Larghezza e altezza del cordone estruso',
        params: [
          { name: 'width', label: 'Larghezza (mm)', default: 0.45, min: 0.15, max: 1.6, step: 0.05 },
          { name: 'height', label: 'Altezza (mm)', default: 0.2, min: 0.05, max: 0.8, step: 0.02 },
        ],
        buildSnippet: (p) => `steps.append(fc.ExtrusionGeometry(area_model="rectangle", width=${p.width}, height=${p.height}))`,
      },
      {
        name: 'Printer(print_speed, travel_speed)',
        desc: 'Velocità di stampa e travel (mm/min)',
        params: [
          { name: 'print_speed', label: 'Print Speed (mm/min)', default: 2000, min: 100, max: 18000, step: 100 },
          { name: 'travel_speed', label: 'Travel Speed (mm/min)', default: 9000, min: 500, max: 20000, step: 250 },
        ],
        buildSnippet: (p) => `steps.append(fc.Printer(print_speed=${p.print_speed}, travel_speed=${p.travel_speed}))`,
      },
      {
        name: 'StationaryExtrusion',
        desc: 'Estrusione da fermo (Blob printing / Spurgo)',
        params: [
          { name: 'volume', label: 'Volume (mm³)', default: 15, min: 1, max: 100, step: 1 },
          { name: 'speed', label: 'Velocità (mm/min)', default: 180, min: 30, max: 1000, step: 10 },
        ],
        buildSnippet: (p) => `steps.append(fc.StationaryExtrusion(volume=${p.volume}, speed=${p.speed}))`,
      },
      {
        name: 'Fan / Hotend / Buildplate',
        desc: 'Controllo ventola e temperature in corso di stampa',
        params: [
          { name: 'fan', label: 'Ventola (%)', default: 100, min: 0, max: 100, step: 5 },
          { name: 'nozzle', label: 'Ugello (°C)', default: 220, min: 0, max: 300, step: 5 },
        ],
        buildSnippet: (p) => `steps.extend([fc.Fan(speed_percent=${p.fan}), fc.Hotend(temp=${p.nozzle}, wait=False)])`,
      },
      {
        name: 'ManualGcode / GcodeComment',
        desc: 'Comando G-code grezzo o commento',
        params: [{ name: 'text', label: 'Codice / Commento', default: 'M400 ; attendi fine mosse', type: 'text' }],
        buildSnippet: (p) => `steps.append(fc.ManualGcode(text="${p.text}"))`,
      },
    ],
  },
  {
    category: '2. Geometria — Primitive & Archi',
    items: [
      {
        name: 'rectangleXY',
        desc: 'Rettangolo nel piano XY',
        params: [
          { name: 'x_size', label: 'Dimensione X (mm)', default: 40, min: 2, max: 200, step: 1 },
          { name: 'y_size', label: 'Dimensione Y (mm)', default: 40, min: 2, max: 200, step: 1 },
          { name: 'z', label: 'Quota Z (mm)', default: 0.2, min: 0.1, max: 200, step: 0.1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.rectangleXY(fc.Point(x=CX-${p.x_size / 2}, y=CY-${p.y_size / 2}, z=${p.z}), x_size=${p.x_size}, y_size=${p.y_size}))`,
      },
      {
        name: 'polygonXY',
        desc: 'Poligono regolare centrato in (CX, CY)',
        params: [
          { name: 'radius', label: 'Raggio (mm)', default: 24, min: 2, max: 120, step: 1 },
          { name: 'sides', label: 'Numero Lati', default: 6, min: 3, max: 32, step: 1 },
          { name: 'z', label: 'Quota Z (mm)', default: 0.2, min: 0.1, max: 200, step: 0.1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.polygonXY(fc.Point(x=CX, y=CY, z=${p.z}), enclosing_radius=${p.radius}, start_angle=0, sides=${p.sides}))`,
      },
      {
        name: 'circleXY',
        desc: 'Cerchio completo nel piano XY',
        params: [
          { name: 'radius', label: 'Raggio (mm)', default: 25, min: 2, max: 120, step: 1 },
          { name: 'segments', label: 'Segmenti', default: 64, min: 8, max: 360, step: 4 },
          { name: 'z', label: 'Quota Z (mm)', default: 0.2, min: 0.1, max: 200, step: 0.1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.circleXY(fc.Point(x=CX, y=CY, z=${p.z}), radius=${p.radius}, start_angle=0, segments=${p.segments}))`,
      },
      {
        name: 'arcXY / variable_arcXY',
        desc: 'Arco circolare o a raggio variabile',
        params: [
          { name: 'radius', label: 'Raggio (mm)', default: 25, min: 2, max: 120, step: 1 },
          { name: 'arc_angle', label: 'Angolo (rad)', default: 3.1416, min: 0.2, max: 6.2832, step: 0.1 },
          { name: 'segments', label: 'Segmenti', default: 48, min: 8, max: 200, step: 4 },
        ],
        buildSnippet: (p) => `steps.extend(fc.arcXY(fc.Point(x=CX, y=CY, z=0.2), radius=${p.radius}, start_angle=0, arc_angle=${p.arc_angle}, segments=${p.segments}))`,
      },
      {
        name: 'spiralXY',
        desc: 'Spirale piana di Archimede',
        params: [
          { name: 'start_r', label: 'Raggio Iniziale (mm)', default: 4, min: 1, max: 100, step: 1 },
          { name: 'end_r', label: 'Raggio Finale (mm)', default: 28, min: 2, max: 120, step: 1 },
          { name: 'turns', label: 'Spire', default: 8, min: 1, max: 50, step: 1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.spiralXY(fc.Point(x=CX, y=CY, z=0.2), start_radius=${p.start_r}, end_radius=${p.end_r}, start_angle=0, n_turns=${p.turns}, segments=${p.turns * 40}))`,
      },
      {
        name: 'helixZ',
        desc: 'Elica 3D continua lungo Z',
        params: [
          { name: 'radius', label: 'Raggio (mm)', default: 22, min: 2, max: 110, step: 1 },
          { name: 'turns', label: 'Giri (Layers)', default: 20, min: 1, max: 200, step: 1 },
          { name: 'pitch_z', label: 'Passo Z (mm/giro)', default: 0.22, min: 0.08, max: 1.0, step: 0.02 },
        ],
        buildSnippet: (p) => `steps.extend(fc.helixZ(fc.Point(x=CX, y=CY, z=0.2), start_radius=${p.radius}, end_radius=${p.radius}, start_angle=0, n_turns=${p.turns}, pitch_z=${p.pitch_z}, segments=${p.turns * 64}))`,
      },
    ],
  },
  {
    category: '3. Geometria — Onde & Polari',
    items: [
      {
        name: 'sinewaveXYpolar',
        desc: 'Onda sinusoidale lungo direzione polare',
        params: [
          { name: 'amplitude', label: 'Ampiezza (mm)', default: 4, min: 0.5, max: 30, step: 0.5 },
          { name: 'period_length', label: 'Lunghezza Periodo (mm)', default: 10, min: 2, max: 50, step: 1 },
          { name: 'periods', label: 'Numero Periodi', default: 6, min: 1, max: 30, step: 1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.sinewaveXYpolar(fc.Point(x=CX-30, y=CY, z=0.2), direction_polar=0, amplitude=${p.amplitude}, period_length=${p.period_length}, periods=${p.periods}, segments_per_period=20))`,
      },
      {
        name: 'squarewaveXY',
        desc: 'Onda quadra cartesiana (serpentina)',
        params: [
          { name: 'amplitude', label: 'Ampiezza (mm)', default: 12, min: 1, max: 60, step: 1 },
          { name: 'spacing', label: 'Passo Linea (mm)', default: 3, min: 0.4, max: 20, step: 0.2 },
          { name: 'periods', label: 'Periodi', default: 8, min: 1, max: 40, step: 1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.squarewaveXY(fc.Point(x=CX-24, y=CY, z=0.2), direction=fc.Vector(x=1, y=0), amplitude=${p.amplitude}, line_spacing=${p.spacing}, periods=${p.periods}))`,
      },
      {
        name: 'trianglewaveXYpolar',
        desc: 'Onda triangolare a zig-zag',
        params: [
          { name: 'amplitude', label: 'Ampiezza (mm)', default: 5, min: 0.5, max: 30, step: 0.5 },
          { name: 'period_length', label: 'Periodo (mm)', default: 8, min: 2, max: 40, step: 1 },
          { name: 'periods', label: 'Periodi', default: 6, min: 1, max: 30, step: 1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.trianglewaveXYpolar(fc.Point(x=CX-24, y=CY, z=0.2), direction_polar=0, amplitude=${p.amplitude}, period_length=${p.period_length}, periods=${p.periods}))`,
      },
    ],
  },
  {
    category: '4. Modificatori, Travel & Ripetizioni',
    items: [
      {
        name: 'travel_to',
        desc: 'Spostamento rapido senza estrudere',
        params: [
          { name: 'x', label: 'X Destinazione', default: 90, min: 0, max: 256, step: 1 },
          { name: 'y', label: 'Y Destinazione', default: 90, min: 0, max: 256, step: 1 },
          { name: 'z', label: 'Z Destinazione', default: 0.4, min: 0.1, max: 256, step: 0.1 },
        ],
        buildSnippet: (p) => `steps.extend(fc.travel_to(fc.Point(x=${p.x}, y=${p.y}, z=${p.z})))`,
      },
      {
        name: 'move (Stack Layers)',
        desc: 'Trasla o duplica il percorso lungo X/Y/Z',
        params: [
          { name: 'dz', label: 'Passo Z (mm)', default: 0.2, min: -10, max: 10, step: 0.05 },
          { name: 'copies', label: 'Numero Copie', default: 10, min: 1, max: 200, step: 1 },
        ],
        buildSnippet: (p) => `steps = fc.move(steps, fc.Vector(x=0, y=0, z=${p.dz}), copy=True, copy_quantity=${p.copies})`,
      },
      {
        name: 'move_polar (Array Circolare)',
        desc: 'Ruota e duplica attorno a (CX, CY)',
        params: [
          { name: 'angle', label: 'Angolo Passo (rad)', default: 0.5236, min: 0.05, max: 3.1416, step: 0.05 },
          { name: 'copies', label: 'Numero Copie', default: 6, min: 1, max: 64, step: 1 },
        ],
        buildSnippet: (p) => `steps = fc.move_polar(steps, fc.Point(x=CX, y=CY), radius=0, angle=${p.angle}, copy=True, copy_quantity=${p.copies})`,
      },
      {
        name: 'ramp_xyz',
        desc: 'Applica una variazione progressiva di Z ai punti',
        params: [{ name: 'z_change', label: 'Variazione Z Totale (mm)', default: 2.0, min: -20, max: 50, step: 0.2 }],
        buildSnippet: (p) => `steps = fc.ramp_xyz(steps, z_change=${p.z_change})`,
      },
      {
        name: 'reflectXY',
        desc: 'Specchia la geometria rispetto all’asse centrale X=CX',
        params: [],
        buildSnippet: () => `steps.extend(fc.reflectXY(steps, fc.Point(x=CX, y=0), fc.Point(x=CX, y=200)))`,
      },
    ],
  },
  {
    category: '5. Lab Avanzato (lab.fullcontrol)',
    items: [
      {
        name: 'fclab.bezier',
        desc: 'Curva di Bézier fluida attraverso punti di controllo',
        params: [{ name: 'num_points', label: 'Numero Punti', default: 50, min: 10, max: 200, step: 5 }],
        buildSnippet: (p) => `import lab.fullcontrol as fclab\nsteps.extend(fclab.bezier([fc.Point(x=CX-30, y=CY-20, z=0.2), fc.Point(x=CX, y=CY+35, z=4.0), fc.Point(x=CX+30, y=CY-20, z=0.2)], num_points=${p.num_points}))`,
      },
      {
        name: 'fclab.rotate',
        desc: 'Rotazione 3D attorno a un asse ("x", "y", "z")',
        params: [
          { name: 'axis', label: 'Asse', default: 'z', type: 'select', options: ['z', 'x', 'y'] },
          { name: 'angle', label: 'Angolo (rad)', default: 0.7854, min: -3.14, max: 3.14, step: 0.1 },
        ],
        buildSnippet: (p) => `import lab.fullcontrol as fclab\nsteps = fclab.rotate(steps, fc.Point(x=CX, y=CY, z=0), axis="${p.axis}", angle=${p.angle})`,
      },
      {
        name: 'fclab.fill_convex_XY',
        desc: 'Riempimento automatico di un contorno convesso',
        params: [{ name: 'line_width', label: 'Passo Riempimento (mm)', default: 0.6, min: 0.2, max: 3.0, step: 0.1 }],
        buildSnippet: (p) => `import lab.fullcontrol as fclab\npoly = fc.polygonXY(fc.Point(x=CX, y=CY, z=0.2), enclosing_radius=20, start_angle=0, sides=6)\nsteps.extend(fclab.convex_PathsXY(poly, poly[0], int(40 / ${p.line_width})))`,
      },
    ],
  },
];

export const EXAMPLE_MODELS = [
  {
    id: 'ams_multicolor_vase',
    title: 'Vaso Multicolore 4-Slot AMS / AMS lite',
    desc: 'Elica ondulata che alterna automaticamente i 4 colori AMS (Slot 1-2-3-4) con sliders parametrici',
    params: {
      radius: { label: 'Raggio Base', value: 26, min: 10, max: 75, step: 1, unit: 'mm' },
      layers: { label: 'Numero Layer', value: 48, min: 12, max: 160, step: 4, unit: 'strati' },
      wave_amp: { label: 'Ampiezza Onda', value: 2.8, min: 0.0, max: 10.0, step: 0.2, unit: 'mm' },
      wave_freq: { label: 'Lobi Onda', value: 8, min: 3, max: 20, step: 1, unit: 'lobi' },
      twist: { label: 'Torsione Elica', value: 0.35, min: -1.5, max: 1.5, step: 0.05, unit: 'rad' },
      layer_h: { label: 'Altezza Layer', value: 0.22, min: 0.12, max: 0.4, step: 0.02, unit: 'mm' },
    },
    code: `import fullcontrol as fc
import math

# I parametri in 'params' sono controllati dagli Sliders della Dashboard!
p = params
steps = [fc.ExtrusionGeometry(area_model="rectangle", width=0.48, height=p["layer_h"])]

segs_per_layer = 84
band_size = max(1, p["layers"] // 4)
current_slot = None

for layer in range(int(p["layers"])):
    slot = min(4, (layer // band_size) + 1)
    if slot != current_slot:
        steps.extend(ams_change(slot))
        current_slot = slot
    for s in range(segs_per_layer):
        t = layer + (s / segs_per_layer)
        angle = (s / segs_per_layer) * 2 * math.pi
        z = 0.2 + t * p["layer_h"]
        wave = p["wave_amp"] * math.sin(angle * p["wave_freq"] + t * p["twist"])
        r = p["radius"] + wave
        pt = fc.polar_to_point(fc.Point(x=CX, y=CY, z=z), r, angle)
        pt.color = ams_rgb(slot)
        steps.append(pt)
`,
  },
  {
    id: 'nonplanar_arch',
    title: 'Arco Non-Planare 3D Parametrico',
    desc: 'Stampa vero 3D con Z sinusoidale variabile lungo X',
    params: {
      span_x: { label: 'Larghezza X', value: 60, min: 20, max: 140, step: 2, unit: 'mm' },
      depth_y: { label: 'Profondità Y', value: 24, min: 8, max: 80, step: 2, unit: 'mm' },
      arch_z: { label: 'Freccia Arco Z', value: 6.5, min: 0.5, max: 18.0, step: 0.5, unit: 'mm' },
      passes: { label: 'Passate Y', value: 8, min: 3, max: 24, step: 1, unit: 'linee' },
    },
    code: `import fullcontrol as fc
import math

p = params
steps = [fc.ExtrusionGeometry(area_model="rectangle", width=0.5, height=0.25)]
steps.extend(ams_change(ACTIVE_AMS_SLOT))

n_passes = int(p["passes"])
for row in range(n_passes):
    y_pos = (CY - p["depth_y"] / 2) + row * (p["depth_y"] / max(1, n_passes - 1))
    pts = []
    for i in range(45):
        u = i / 44.0
        x_pos = (CX - p["span_x"] / 2) + u * p["span_x"]
        z_pos = 0.25 + p["arch_z"] * math.sin(u * math.pi)
        pts.append(fc.Point(x=x_pos, y=y_pos, z=z_pos, color=ams_rgb(ACTIVE_AMS_SLOT)))
    if row % 2 == 1:
        pts.reverse()
    steps.extend(fc.travel_to(pts[0]))
    steps.extend(pts)
`,
  },
  {
    id: 'star_polygon_lattice',
    title: 'Reticolo Stellare Multi-Colore',
    desc: 'Poligoni ruotati con cambio slot AMS per sezione',
    params: {
      radius: { label: 'Raggio Stella', value: 30, min: 10, max: 80, step: 1, unit: 'mm' },
      sides: { label: 'Lati Poligono', value: 5, min: 3, max: 10, step: 1, unit: 'lati' },
      petals: { label: 'Rotazioni', value: 4, min: 2, max: 12, step: 1, unit: 'copie' },
      layers: { label: 'Altezza Layer', value: 16, min: 4, max: 60, step: 2, unit: 'strati' },
    },
    code: `import fullcontrol as fc
import math

p = params
steps = [fc.ExtrusionGeometry(area_model="rectangle", width=0.45, height=0.2)]

base = fc.polygonXY(fc.Point(x=CX, y=CY, z=0.2), enclosing_radius=p["radius"], start_angle=0, sides=int(p["sides"]))
angle_step = math.pi / (int(p["sides"]) * int(p["petals"]) / 2)
star_2d = fc.move_polar(base, fc.Point(x=CX, y=CY), radius=0, angle=angle_step, copy=True, copy_quantity=int(p["petals"]))

for lyr in range(int(p["layers"])):
    slot = (lyr % 4) + 1
    steps.extend(ams_change(slot))
    layer_pts = fc.move(star_2d, fc.Vector(x=0, y=0, z=lyr * 0.2))
    for pt in layer_pts:
        if isinstance(pt, fc.Point):
            pt.color = ams_rgb(slot)
    steps.extend(layer_pts)
`,
  },
];

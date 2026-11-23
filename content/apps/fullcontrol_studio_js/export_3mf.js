// SPDX-License-Identifier: GPL-3.0-only — FullControl Studio, Orfini Math Lab (vedi LICENZA.txt)
/* Costruzione del .gcode.3mf per Bambu Studio dai template autentici in bambu_templates/.
 *
 * I template sono generati da bin/build_bambu_templates.py con la CLI di Bambu Studio e i profili
 * ufficiali: contengono header, config, avvio e fine della macchina esattamente come li scrive Bambu
 * Studio (homing, livellamento, caricamento filamento AMS, spurgo, parcheggio), con segnaposto per
 * ciò che dipende dal nostro oggetto. Qui si inserisce il percorso FullControl e si compilano i
 * segnaposto. Se ne resta uno non compilato, l'export si ferma.
 */
/* global JSZip */

let manifestPromise = null;
const templateCache = new Map();

export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(new URL('./bambu_templates/manifest.json', import.meta.url)).then((r) => {
      if (!r.ok) throw new Error(`manifest dei template Bambu non trovato (${r.status})`);
      return r.json();
    });
  }
  return manifestPromise;
}

async function loadTemplate(pid, material) {
  const manifest = await loadManifest();
  const entry = manifest.printers?.[pid]?.materials?.[material];
  if (!entry) throw new Error(`Nessun template Bambu per ${pid} con ${material}`);
  if (!templateCache.has(entry.file)) {
    const r = await fetch(new URL(`./bambu_templates/${entry.file}`, import.meta.url));
    if (!r.ok) throw new Error(`Template ${entry.file} non trovato (${r.status})`);
    templateCache.set(entry.file, await r.arrayBuffer());
  }
  return { zip: await JSZip.loadAsync(templateCache.get(entry.file)), entry, manifest };
}

const num = (v) => String(Math.round(v * 1000) / 1000);

// Quote di parcheggio a fine stampa: stesse formule e condizioni del machine_end_gcode ufficiale
// (vedi PARK_RULES in bin/build_bambu_templates.py). null = il profilo non emette quelle righe.
export function parkLines(pid, z) {
  if (pid === 'a1_mini') return z + 100 < 180 ? [z + 100, z + 98] : null;
  if (pid === 'a1') return z + 100 < 256 ? [z + 100, z + 98] : null;
  if (pid === 'p2s') {
    if (80 - z / 2 > 0) return z + 80 - z / 2 < 256 ? [z + 80 - z / 2, z + 78 - z / 2] : null;
    return z + 4 < 256 ? [z + 4, z + 2] : null;
  }
  throw new Error(`regola di parcheggio sconosciuta per ${pid}`);
}

// Il G-code di FullControl ha un suo avvio e una sua fine (profili bambulab_*.py): nel 3MF li
// sostituiscono quelli ufficiali, quindi si tiene solo il percorso tra i due marcatori.
export function extractBody(gcode) {
  const L = gcode.split('\n');
  const s = L.findIndex((l) => l.includes('END OF STARTING PROCEDURE'));
  const e = L.findIndex((l) => l.includes('START OF ENDING PROCEDURE'));
  if (s < 0 || e < 0 || e <= s) throw new Error('Il G-code non contiene i marcatori di avvio/fine di FullControl');
  let a = s + 1;
  if (L[a] && L[a].startsWith(';-----')) a += 1;
  let b = e;
  if (L[b - 1] && L[b - 1].startsWith(';-----')) b -= 1;
  return L.slice(a, b);
}

function formatTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}h ` : ''}${m}m ${s % 60}s`;
}

/**
 * @param {object} a
 * @param {object} a.preset        PRINTER_PRESETS[id]
 * @param {string} a.material      'PLA' | 'PETG' | 'TPU'
 * @param {string} a.gcode         G-code sanificato di FullControl (con i suoi marcatori)
 * @param {number} a.nozzle        °C del primo layer (l'avvio Bambu scalda a questa)
 * @param {number} a.bed           °C
 * @param {string} a.colorHex
 * @param {number} a.layerCount
 * @param {number} a.filamentMm
 * @param {number} a.filamentG
 * @param {number} a.zMax          quota massima del percorso (mm)
 * @param {number[]} a.bbox        [minx, miny, maxx, maxy] del materiale estruso
 * @param {number} a.printSeconds  stima grezza del tempo
 * @param {{large: Blob, small: Blob}|null} a.thumbnails
 * @param {(s: string) => Promise<string>} a.md5
 * @returns {Promise<{blob: Blob, info: object}>}
 */
export async function buildBambu3mf(a) {
  const { zip, entry, manifest } = await loadTemplate(a.preset.id, a.material);
  const p = a.preset;
  const color = a.colorHex.toUpperCase();
  const z = Math.max(0.2, a.zMax);
  const [x0, y0, x1, y1] = a.bbox || [p.bedX / 2 - 10, p.bedY / 2 - 10, p.bedX / 2 + 10, p.bedY / 2 + 10];
  const ablX = Math.max(0, Math.floor(x0));
  const ablY = Math.max(0, Math.floor(y0));
  const ablI = Math.max(1, Math.min(p.bedX - ablX, Math.ceil(x1 - ablX)));
  const ablJ = Math.max(1, Math.min(p.bedY - ablY, Math.ceil(y1 - ablY)));
  const park = parkLines(p.id, z);

  // Corpo FullControl con un preambolo: Bambu lascia l'ugello caldo e spurgato vicino al piatto.
  const body = [];
  let layer = 0;
  for (const line of extractBody(a.gcode)) {
    body.push(line);
    if (line.startsWith('; CHANGE_LAYER')) {
      layer += 1;
      body.push(`M73 L${layer}`, `M991 S0 P${layer - 1} ;notify layer change`);
    }
  }
  const plateBody = [
    '; ===== FullControl Studio: percorso =====',
    'G90',
    'M83 ; estrusione relativa (come FullControl)',
    `M104 S${a.nozzle}`,
    `M109 S${a.nozzle}`,
    'M106 S0 ; ventola spenta sul primo layer: la accende il percorso dal 2° layer',
    'G91',
    'G1 Z2 F1200 ; alza prima di raggiungere il primo punto',
    'G90',
    ...body,
    '; ===== FullControl Studio: fine percorso =====',
  ].join('\n');

  let g = await zip.file('Metadata/plate_1.gcode').async('string');
  g = g
    .replace(/\{\{NOZ:(-?[\d.]+)\}\}/g, (_, off) => num(a.nozzle + Number(off)))
    .replace(/\{\{BED:(-?[\d.]+)\}\}/g, (_, off) => num(a.bed + Number(off)))
    .replace(/\{\{ABL\}\}/g, `X${ablX} Y${ablY} I${ablI} J${ablJ}`)
    .replace(/\{\{ZMAX:(-?[\d.]+)\}\}/g, (_, off) => num(z + Number(off)))
    .replace(/^.*\{\{PARK:(\d)\}\}.*\n/gm, (line, n) => (park ? line.replace(/\{\{PARK:\d\}\}/, `G1 Z${num(park[Number(n)])}`) : ''))
    .replace('{{TIME}}', formatTime(a.printSeconds))
    .replace('{{TIME}}', formatTime(a.printSeconds))
    .replace('{{LAYERS}}', String(a.layerCount))
    .replace('{{FIL_MM}}', a.filamentMm.toFixed(2))
    .replace('{{FIL_CM3}}', ((a.filamentMm * Math.PI * 0.875 * 0.875) / 1000).toFixed(2))
    .replace('{{FIL_G}}', a.filamentG.toFixed(2))
    .replace('{{ZMAX_H}}', z.toFixed(2));
  if (!g.includes('; [FULLCONTROL GCODE HERE]')) throw new Error('Segnaposto del percorso assente nel template');
  g = g.replace('; [FULLCONTROL GCODE HERE]', () => plateBody);
  const left = g.match(/\{\{[A-Z_]+[^}]*\}\}/);
  if (left) throw new Error(`Segnaposto non compilato nel template: ${left[0]}`);

  const out = new JSZip();
  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    if (path === 'Metadata/plate_1.gcode') continue;
    if (path === 'Metadata/slice_info.config') {
      const xml = (await file.async('string'))
        .replace('{{PREDICTION}}', String(Math.round(a.printSeconds)))
        .replace(/\{\{FIL_G\}\}/g, a.filamentG.toFixed(2))
        .replace('{{COLOR}}', color)
        .replace('{{FIL_M}}', (a.filamentMm / 1000).toFixed(2))
        .replace('{{LAST_LAYER}}', String(Math.max(0, a.layerCount - 1)));
      out.file(path, xml);
    } else if (path === 'Metadata/project_settings.config') {
      const ps = JSON.parse(await file.async('string'));
      ps.filament_colour = [color];
      out.file(path, JSON.stringify(ps, null, 4));
    } else if (path === 'Metadata/plate_1.json') {
      const pj = JSON.parse(await file.async('string'));
      pj.bbox_all = [x0, y0, x1, y1];
      pj.filament_colors = [color];
      out.file(path, JSON.stringify(pj));
    } else if (a.thumbnails && path === 'Metadata/plate_1.png') {
      out.file(path, a.thumbnails.large);
    } else if (a.thumbnails && path === 'Metadata/plate_1_small.png') {
      out.file(path, a.thumbnails.small);
    } else {
      out.file(path, await file.async('uint8array'));
    }
  }
  out.file('Metadata/plate_1.gcode', g);
  out.file('Metadata/plate_1.gcode.md5', await a.md5(g));
  const blob = await out.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return { blob, info: { modelId: manifest.printers[p.id].model_id, profilesVersion: manifest.profiles_version, park, abl: [ablX, ablY, ablI, ablJ] } };
}

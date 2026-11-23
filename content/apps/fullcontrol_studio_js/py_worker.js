// SPDX-License-Identifier: GPL-3.0-only — FullControl Studio, Orfini Math Lab (vedi LICENZA.txt)
/* Worker Pyodide di FullControl Studio.
 * Tiene Python fuori dal thread della UI: slider, gizmo e vista 3D restano fluidi mentre il
 * percorso viene ricalcolato. Protocollo: { id, type, payload } → { id, ok, result | error }.
 * Tipi: init, run, check, template (bytes del 3MF modello), md5 (stringa → esadecimale).
 */
/* global importScripts, loadPyodide */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

let py = null;

function progress(text) {
  self.postMessage({ type: 'progress', text });
}

async function init() {
  progress('Carico Python (Pyodide)…');
  py = await loadPyodide();
  progress('Carico numpy e pydantic…');
  await py.loadPackage(['numpy', 'micropip']);
  await py.pyimport('micropip').install('pydantic');
  progress('Monto fullcontrol e i profili Bambu Lab…');
  const [pkg, runtime] = await Promise.all([
    fetch('./fullcontrol_pkg.zip').then((r) => {
      if (!r.ok) throw new Error(`fullcontrol_pkg.zip non scaricato (${r.status})`);
      return r.arrayBuffer();
    }),
    fetch('./studio_runtime.py').then((r) => {
      if (!r.ok) throw new Error(`studio_runtime.py non scaricato (${r.status})`);
      return r.text();
    }),
  ]);
  py.unpackArchive(pkg, 'zip');
  py.FS.writeFile('studio_runtime.py', runtime);
  await py.runPythonAsync(`
import sys
if '.' not in sys.path:
    sys.path.insert(0, '.')
import studio_runtime
`);
  return true;
}

// I percorsi arrivano da Python come JSON (liste di numeri). Qui, fuori dal thread della UI, li si
// impacchetta in array tipizzati trasferibili: il thread principale non deve creare milioni di
// oggetti (niente pause di garbage collection mentre si trascina un cursore).
function packResult(jsonStr) {
  const d = JSON.parse(jsonStr);
  const paths = d.paths || [];
  delete d.paths;
  let n = 0;
  for (const p of paths) n += p.x.length;
  const xyz = new Float32Array(n * 3);
  const w = new Float32Array(n);
  const h = new Float32Array(n);
  const col = new Float32Array(n * 3).fill(-1);
  const slope = new Float32Array(n);
  const alarm = new Uint8Array(n);
  const offsets = new Uint32Array(paths.length + 1);
  const on = new Uint8Array(paths.length);
  let k = 0;
  let zMax = 0;
  paths.forEach((p, i) => {
    offsets[i] = k;
    on[i] = p.on ? 1 : 0;
    for (let j = 0; j < p.x.length; j++, k++) {
      xyz[3 * k] = p.x[j];
      xyz[3 * k + 1] = p.y[j];
      xyz[3 * k + 2] = p.z[j];
      if (p.z[j] > zMax) zMax = p.z[j];
      w[k] = (p.w && p.w[j]) || 0.5;
      h[k] = (p.h && p.h[j]) || 0.24;
      const c = p.c && p.c[j];
      if (c && c.length === 3) {
        col[3 * k] = c[0];
        col[3 * k + 1] = c[1];
        col[3 * k + 2] = c[2];
      }
      slope[k] = p.slopes[j] || 0;
      alarm[k] = p.alarm[j] ? 1 : 0;
    }
  });
  offsets[paths.length] = k;
  d.geo = { xyz, w, h, col, slope, alarm, offsets, on, zMax };
  return { result: d, transfer: [xyz.buffer, w.buffer, h.buffer, col.buffer, slope.buffer, alarm.buffer, offsets.buffer, on.buffer] };
}

function callRuntime(fn, code, opts) {
  py.globals.set('_code', code);
  py.globals.set('_opts', JSON.stringify(opts));
  return py.runPythonAsync(`studio_runtime.${fn}(_code, _opts)`);
}

self.onmessage = async (e) => {
  const { id, type, payload } = e.data;
  try {
    let result;
    if (type === 'init') result = await init();
    else if (type === 'run') {
      const packed = packResult(await callRuntime('run_design', payload.code, payload.opts));
      self.postMessage({ id, ok: true, result: packed.result }, packed.transfer);
      return;
    }
    else if (type === 'check') result = await callRuntime('check_design', payload.code, payload.opts);
    else if (type === 'template') {
      const bytes = py.FS.readFile('lab/fullcontrol/controlcode_formats/FC_bambulab_template.3mf');
      self.postMessage({ id, ok: true, result: bytes }, [bytes.buffer]);
      return;
    } else if (type === 'md5') {
      py.globals.set('_s', payload);
      result = await py.runPythonAsync(`import hashlib; hashlib.md5(_s.encode('utf-8')).hexdigest()`);
    } else throw new Error(`Messaggio sconosciuto: ${type}`);
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};

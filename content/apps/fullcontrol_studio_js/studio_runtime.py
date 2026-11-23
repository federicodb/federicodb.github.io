# SPDX-License-Identifier: GPL-3.0-only — FullControl Studio, Orfini Math Lab (vedi LICENZA.txt)
"""
Runtime Python di FullControl Studio (eseguito da Pyodide dentro py_worker.js).

Prima era una stringa Python dentro app.js; ora è un modulo vero, testabile con CPython:
    PYTHONPATH=.. python -c "import studio_runtime"   (dalla cartella webapp/, con fullcontrol importabile)

API usate dal worker:
    run_design(user_code: str, opts_json: str) -> str (JSON)
    check_design(user_code: str, opts_json: str) -> str (testo)
"""

import contextlib
import io
import json
import math

import fullcontrol as fc
import lab.fullcontrol as fclab
from fullcontrol.common import fix
from fullcontrol.visualize.controls import PlotControls
from fullcontrol.visualize.steps2visualization import visualize
from lab.fullcontrol.controlcode_formats.bambu_sanitize import sanitize_bambu_gcode

FILAMENT_DIAMETER_MM = 1.75
FILAMENT_DENSITY_G_CM3 = {"PLA": 1.24, "PETG": 1.27, "TPU": 1.21}


def _hex_to_rgb(h: str):
    h = h.lstrip("#")
    return [round(int(h[i:i + 2], 16) / 255.0, 4) for i in (0, 2, 4)]


def _namespace(opts: dict):
    ams_hex = opts.get("ams_colors") or ["#ffffff"] * 4

    def ams_rgb(slot: int = 1):
        return _hex_to_rgb(ams_hex[max(0, min(3, int(slot) - 1))])

    def ams_change(slot: int = 1):
        idx = max(0, min(3, int(slot) - 1))
        return [fc.GcodeComment(text=f"; AMS_SLOT_MARKER: {slot} (Tray {idx})")]

    return {
        "fc": fc,
        "fclab": fclab,
        "math": math,
        "CX": opts.get("bed_x", 180) / 2,
        "CY": opts.get("bed_y", 180) / 2,
        "ACTIVE_AMS_SLOT": opts.get("active_slot", 1),
        "AMS_COLORS": ams_hex,
        "ams_rgb": ams_rgb,
        "ams_change": ams_change,
    }


def _exec_user_code(user_code: str, opts: dict):
    buf = io.StringIO()
    ns = _namespace(opts)
    with contextlib.redirect_stdout(buf):
        exec(user_code, ns)
    steps = ns.get("steps")
    if not isinstance(steps, list):
        raise ValueError("Lo script deve definire una lista chiamata 'steps'.")
    return steps, buf


def run_design(user_code: str, opts_json: str) -> str:
    opts = json.loads(opts_json)
    init_data = opts["init_data"]
    printer = opts["fc_printer"]
    bed_x, bed_y, bed_z = opts["bed_x"], opts["bed_y"], opts["bed_z"]
    preview_only = bool(opts.get("preview_only"))

    steps, stdout_buf = _exec_user_code(user_code, opts)

    gcode, layer_count, warnings = "", 1, []
    if not preview_only:
        controls = fc.GcodeControls(printer_name=printer, initialization_data=init_data, save_as=None)
        raw = fc.transform(steps, "gcode", controls, show_tips=False)
        gcode, layer_count, warnings = sanitize_bambu_gcode(raw)

    has_manual_color = any(isinstance(s, fc.Point) and s.color is not None for s in steps)
    vis_controls = PlotControls(
        raw_data=True,
        color_type="manual" if has_manual_color else "z_gradient",
        printer_name=printer,
        initialization_data=init_data,
    )
    plot_data = visualize(fix(steps, "plot", vis_controls), vis_controls, show_tips=False)

    paths_out = []
    min_x = min_y = min_z = float("inf")
    max_x = max_y = max_z = float("-inf")
    # ingombro del solo materiale estruso (i travel non occupano il piatto)
    ext_min_x = ext_min_y = float("inf")
    ext_max_x = ext_max_y = float("-inf")
    pts_count = 0
    z_collision = out_of_bounds = False
    max_slope_deg = 0.0
    total_len = 0.0
    extruded_len = 0.0
    extruded_vol_mm3 = 0.0

    for p in plot_data.paths:
        n = len(p.xvals)
        if n < 2:
            continue
        pts_count += n
        is_on = bool(p.extruder.on) if p.extruder and p.extruder.on is not None else True
        alarms = []
        slopes = [0.0] * n
        for i in range(n):
            x, y, z = p.xvals[i], p.yvals[i], p.zvals[i]
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)
            min_z, max_z = min(min_z, z), max(max_z, z)
            if is_on:
                ext_min_x, ext_max_x = min(ext_min_x, x), max(ext_max_x, x)
                ext_min_y, ext_max_y = min(ext_min_y, y), max(ext_max_y, y)
            z_bad = (z < 0.0) or (is_on and z <= 0.01)
            oob = x < 0.0 or x > bed_x or y < 0.0 or y > bed_y or z > bed_z
            z_collision = z_collision or z_bad
            out_of_bounds = out_of_bounds or oob
            alarms.append(bool(z_bad or oob))
            if i > 0:
                dx = x - p.xvals[i - 1]
                dy = y - p.yvals[i - 1]
                dz = z - p.zvals[i - 1]
                dxy = math.hypot(dx, dy)
                seg = math.hypot(dxy, dz)
                total_len += seg
                if is_on:
                    extruded_len += seg
                    w = p.widths[i] if p.widths else 0.4
                    h = p.heights[i] if p.heights else 0.2
                    extruded_vol_mm3 += seg * w * h
                    if dxy > 0.08:
                        s_deg = math.degrees(math.atan2(abs(dz), dxy))
                        slopes[i] = round(s_deg, 1)
                        max_slope_deg = max(max_slope_deg, s_deg)
        paths_out.append({
            "x": p.xvals, "y": p.yvals, "z": p.zvals,
            "w": p.widths, "h": p.heights, "c": p.colors,
            "alarm": alarms, "slopes": slopes, "on": is_on,
        })

    filament_area = math.pi * (FILAMENT_DIAMETER_MM / 2) ** 2
    material = opts.get("material", "PLA")
    density = FILAMENT_DENSITY_G_CM3.get(material, 1.24)
    has_ext = ext_max_x >= ext_min_x

    return json.dumps({
        "gcode": gcode,
        "layer_count": layer_count,
        "warnings": warnings,
        "paths": paths_out,
        "pts_count": pts_count,
        "length": round(total_len, 1),
        "extruded_length": round(extruded_len, 1),
        "filament_m": round(extruded_vol_mm3 / filament_area / 1000.0, 2),
        "filament_g": round(extruded_vol_mm3 / 1000.0 * density, 1),
        "footprint": [round(ext_max_x - ext_min_x, 1), round(ext_max_y - ext_min_y, 1)] if has_ext else [0, 0],
        # riquadro del materiale estruso: serve al livellamento G29 dell'avvio Bambu (area da sondare)
        "bbox": [round(ext_min_x, 2), round(ext_min_y, 2), round(ext_max_x, 2), round(ext_max_y, 2)] if has_ext else None,
        "z_max": round(max_z, 2) if pts_count else 0,
        "max_slope_deg": round(max_slope_deg, 1),
        "z_collision": z_collision,
        "out_of_bounds": out_of_bounds,
        "stdout": stdout_buf.getvalue(),
    })


def check_design(user_code: str, opts_json: str) -> str:
    opts = json.loads(opts_json)
    steps, buf = _exec_user_code(user_code, opts)
    with contextlib.redirect_stdout(buf):
        fc.check(steps)
    return buf.getvalue()

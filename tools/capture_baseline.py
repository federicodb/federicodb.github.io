#!/usr/bin/env python3
"""
tools/capture_baseline.py - Cattura screenshot baseline ed errori console
"""

import os
import sys
import json
import time
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORT = 8766
BASE_URL = f"http://127.0.0.1:{PORT}"
SCREENSHOT_DIR = os.path.join(BASE_DIR, "tools", "screenshots", "prima")
for i, arg in enumerate(sys.argv):
    if arg == "--outdir" and i + 1 < len(sys.argv):
        SCREENSHOT_DIR = os.path.abspath(sys.argv[i + 1])
    elif arg == "--dopo-fase4":
        SCREENSHOT_DIR = os.path.join(BASE_DIR, "tools", "screenshots", "dopo-fase4")

VIEWPORTS = [
    {"name": "lim", "width": 1920, "height": 1080},
    {"name": "proiettore", "width": 1280, "height": 720},
    {"name": "tablet", "width": 1024, "height": 768},
    {"name": "smartphone", "width": 390, "height": 844}
]

class QuietHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    server = HTTPServer(("127.0.0.1", PORT), QuietHTTPHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server

def get_targets():
    """Raccoglie pagine principali e app in content/apps/"""
    targets = [
        {"id": "index", "path": "index.html", "type": "main"},
        {"id": "verifiche", "path": "verifiche.html", "type": "main"},
        {"id": "competenze", "path": "competenze.html", "type": "main"},
        {"id": "galaxy", "path": "galaxy.html", "type": "main"}
    ]

    apps_dir = os.path.join(BASE_DIR, "content", "apps")
    if os.path.exists(apps_dir):
        for f in sorted(os.listdir(apps_dir)):
            if f.endswith(".html") and not f.startswith("."):
                safe_id = f.replace(".html", "").replace(" ", "_")
                targets.append({
                    "id": f"app_{safe_id}",
                    "path": f"content/apps/{f}",
                    "type": "app",
                    "filename": f
                })
    return targets

def capture_all():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    server = start_server()
    time.sleep(0.5)

    targets = get_targets()
    print(f"Totale pagine e app da catturare: {len(targets)}")

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Context senza ignoreHTTPSErrors, normale
        context = browser.new_context()

        for idx, target in enumerate(targets, 1):
            target_id = target["id"]
            rel_path = target["path"]
            encoded_path = urllib.parse.quote(rel_path)
            url = f"{BASE_URL}/{encoded_path}"

            print(f"[{idx}/{len(targets)}] Analisi {target['type']}: {rel_path}...")

            console_errors = []
            page_errors = []
            failed_requests = []

            page = context.new_page()

            def on_console(msg):
                if msg.type == "error":
                    console_errors.append(msg.text)

            def on_pageerror(err):
                page_errors.append(str(err))

            def on_requestfailed(req):
                # Ignora richieste opzionali di favicon se assenti
                if "favicon.ico" not in req.url:
                    failed_requests.append(f"{req.method} {req.url} - {req.failure}")

            def on_response(resp):
                if resp.status >= 400 and "favicon.ico" not in resp.url:
                    failed_requests.append(f"HTTP {resp.status} on {resp.url}")

            page.on("console", on_console)
            page.on("pageerror", on_pageerror)
            page.on("requestfailed", on_requestfailed)
            page.on("response", on_response)

            try:
                # Imposta prima viewport standard 1920x1080 per il load
                page.set_viewport_size({"width": 1920, "height": 1080})
                page.goto(url, wait_until="load", timeout=15000)
                # Piccola pausa per script Three.js, MathJax/KaTeX o animazioni
                page.wait_for_timeout(800)
            except Exception as e:
                page_errors.append(f"Errore caricamento pagina: {e}")

            # Scatta gli screenshot alle 4 risoluzioni
            screenshots_taken = []
            for vp in VIEWPORTS:
                w = vp["width"]
                h = vp["height"]
                vp_name = vp["name"]
                filename = f"{target_id}_{w}x{h}.png"
                out_path = os.path.join(SCREENSHOT_DIR, filename)

                try:
                    page.set_viewport_size({"width": w, "height": h})
                    page.wait_for_timeout(400)
                    page.screenshot(path=out_path, full_page=False)
                    screenshots_taken.append({
                        "viewport": vp_name,
                        "resolution": f"{w}x{h}",
                        "file": filename
                    })
                except Exception as e:
                    page_errors.append(f"Errore screenshot {w}x{h}: {e}")

            results[target_id] = {
                "id": target_id,
                "path": rel_path,
                "type": target["type"],
                "url": url,
                "console_errors": console_errors,
                "page_errors": page_errors,
                "failed_requests": failed_requests,
                "screenshots": screenshots_taken
            }

            page.close()

        context.close()
        browser.close()

    server.shutdown()

    out_file = os.path.join(os.path.dirname(__file__), "baseline_data.json")
    if "--dopo-fase4" in sys.argv:
        out_file = os.path.join(os.path.dirname(__file__), "fase4_data.json")
    for i, arg in enumerate(sys.argv):
        if arg == "--json" and i + 1 < len(sys.argv):
            out_file = os.path.abspath(sys.argv[i + 1])
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nSalvati dati baseline in {out_file}")
    return results

if __name__ == "__main__":
    capture_all()

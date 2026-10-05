#!/usr/bin/env python3
"""
tools/test_theme.py
Testa il tema chiaro e scuro sulle 4 pagine principali con Playwright.
Salva gli screenshot in tools/screenshots/theme_test/
"""

import os
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORT = 8768
BASE_URL = f"http://127.0.0.1:{PORT}"
OUT_DIR = os.path.join(BASE_DIR, "tools", "screenshots", "theme_test")
os.makedirs(OUT_DIR, exist_ok=True)

class QuietHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def run_tests():
    server = HTTPServer(("127.0.0.1", PORT), QuietHTTPHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    pages = ["index.html", "verifiche.html", "competenze.html", "galaxy.html"]
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        
        for page_name in pages:
            page = context.new_page()
            url = f"{BASE_URL}/{page_name}"
            print(f"Testing {page_name}...")
            
            # 1. Test Default (Dark Mode)
            page.goto(url)
            page.wait_for_timeout(1000)
            dark_path = os.path.join(OUT_DIR, f"{page_name.replace('.html', '')}_dark.png")
            page.screenshot(path=dark_path, full_page=False)
            print(f"  Saved {dark_path}")
            
            # 2. Click Toggle Button -> Light Mode
            toggle_btn = page.query_selector("#orfini-theme-toggle")
            if toggle_btn:
                toggle_btn.click()
                page.wait_for_timeout(1000)
                light_path = os.path.join(OUT_DIR, f"{page_name.replace('.html', '')}_light.png")
                page.screenshot(path=light_path, full_page=False)
                print(f"  Saved {light_path}")
                
                # Check localStorage
                stored = page.evaluate("localStorage.getItem('orfini_theme')")
                print(f"  localStorage orfini_theme: {stored}")
                
                # 3. Reload page to test persistence and anti-FOUC
                page.reload()
                page.wait_for_timeout(1000)
                is_light = page.evaluate("document.documentElement.classList.contains('theme-light')")
                print(f"  After reload, is theme-light present: {is_light}")
                
                # 4. Click Toggle Button again -> Back to Dark Mode
                toggle_btn = page.query_selector("#orfini-theme-toggle")
                toggle_btn.click()
                page.wait_for_timeout(500)
                stored_back = page.evaluate("localStorage.getItem('orfini_theme')")
                print(f"  After clicking again, localStorage orfini_theme: {stored_back}")
            else:
                print(f"  WARNING: Toggle button not found on {page_name}")
                
            page.close()
            
        context.close()
        browser.close()
        
    server.shutdown()
    print("\nTest completato con successo!")

if __name__ == "__main__":
    run_tests()

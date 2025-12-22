import os
import sys
import time
import asyncio
from datetime import datetime

# Configurazione
CONTENT_DIR = "content"
THUMB_DIR = "content/assets/thumbnails"
THUMB_SIZE = (600, 400) # Risoluzione Target
WAIT_TIME = 3000 # Ms da attendere per caricamento App (Three.js/Canvas)

# Dipendenze opzionali (Gestione errori se mancano)
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("⚠️  PIL (Pillow) non installato. Impossibile processare immagini.")

try:
    from pdf2image import convert_from_path
    HAS_PDF = True
except ImportError:
    HAS_PDF = False
    print("⚠️  pdf2image non installato. Impossibile processare PDF.")

try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False
    print("⚠️  Playwright non installato. Impossibile processare App Web.")

def get_thumb_path(file_path):
    """Calcola il percorso di destinazione della thumbnail basato sul nome file."""
    filename = os.path.basename(file_path)
    name, _ = os.path.splitext(filename)
    return os.path.join(THUMB_DIR, f"{name}.jpg")

def get_semantic_selector(filename):
    """Restituisce un selettore CSS specifico basato sul nome del file."""
    fname = filename.lower()
    
    # --- REGOLE SPECIFICHE UTENTE ---
    if "percent" in fname:
        # La card principale "glass" contiene la visualizzazione
        return [".glass", ".relative.w-full.h-12", "#root"]
        
    if "voto" in fname:
        # Tension bar o container principale
        return ["#tension-bar", ".tension-container", ".meter", "main"]
        
    if "underground" in fname:
        # Mappa SVG
        return ["svg", "#subway-map", ".map-container"]
        
    if "tart" in fname:
        # Tavola pitagorica
        return ["table", ".grid-container", "#grid"]
        
    if "gonio" in fname:
        # Briefing card iniziale
        return [".card", ".modal", "#briefing", ".intro-box"]
        
    if "funzion" in fname:
        # Grafico JSXGraph o canvas
        return [".jxgbox", "#box", "#function-plot", ".graph-container"]

    # --- REGOLE GENERALI ---
    if "venn" in fname or "insiemi" in fname:
        return ["#venn-container", ".venn-diagram", "svg"]
    if "frazioni" in fname or "fraction" in fname:
        return [".pie-chart", ".fraction-visual", "svg"]
    if "algebra" in fname or "polinomi" in fname:
        return ["#algebra-tiles", ".tiles-area", "canvas"]
    if "sketch" in fname or "albero" in fname or "simulazione" in fname or "invaders" in fname or "mcd" in fname or "attrattori" in fname:
        return ["canvas", "#game-canvas"]
    
    # Selettori Generici "High Value"
    return ["main", "#app", "#root", ".container", "svg", "canvas"]

def generate_app_thumbnail(file_path, thumb_path):
    if not HAS_PLAYWRIGHT: return False
    
    filename = os.path.basename(file_path)
    print(f"📸 Snapshot App (Semantic): {filename}...")
    
    try:
        abs_path = os.path.abspath(file_path)
        url = f"file://{abs_path}"
        
        with sync_playwright() as p:
            # Lancia browser headless con viewport HD
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1280, 'height': 800})
            
            page.goto(url)
            try:
                page.wait_for_load_state('networkidle', timeout=5000)
            except:
                pass
            
            # --- SMART INTERACTION ---
            # Muovi mouse al centro per attivare eventuali hover/p5.js
            page.mouse.move(640, 400)
            page.mouse.down()
            page.wait_for_timeout(200)
            page.mouse.up()
            
            # Attesa rendering
            page.wait_for_timeout(WAIT_TIME)
            
            # --- SEMANTIC CAPTURE STRATEGY ---
            screenshot_done = False
            
            # 1. Cerca Selettori Semantici Specifici
            target_selectors = get_semantic_selector(filename)
            
            # Aggiungi Canvas e Scene Container come fallback prioritari
            target_selectors.extend(['canvas', '#scene-container'])
            
            for selector in target_selectors:
                if screenshot_done: break
                
                elements = page.locator(selector).all()
                for el in elements:
                    if el.is_visible():
                        # Controllo dimensioni minime per evitare icone o elementi vuoti
                        bbox = el.bounding_box()
                        if bbox and bbox['width'] > 100 and bbox['height'] > 100:
                            print(f"   -> Target Semantico rilevato: '{selector}' ({int(bbox['width'])}x{int(bbox['height'])})")
                            try:
                                el.screenshot(path=thumb_path, quality=85, type='jpeg')
                                screenshot_done = True
                                break
                            except Exception as e:
                                print(f"      Errore capture '{selector}': {e}")
            
            # 2. Fallback: Full Page (Se nessun elemento specifico è valido)
            if not screenshot_done:
                print("   -> Fallback: Full Page.")
                page.screenshot(path=thumb_path, quality=80, type='jpeg')
                
            browser.close()
            
        # Resize post-processo
        if HAS_PIL:
            with Image.open(thumb_path) as img:
                img.thumbnail(THUMB_SIZE)
                img.save(thumb_path, "JPEG", quality=85)
                
        return True
    except Exception as e:
        print(f"  ❌ Errore Playwright: {e}")
        return False

def generate_pdf_thumbnail(file_path, thumb_path):
    if not HAS_PDF: return False
    
    print(f"📑 Snapshot PDF: {os.path.basename(file_path)}...")
    try:
        # Converte solo la prima pagina
        images = convert_from_path(file_path, first_page=1, last_page=1)
        if images:
            image = images[0]
            image.thumbnail(THUMB_SIZE)
            image.save(thumb_path, "JPEG", quality=85)
            return True
    except Exception as e:
        print(f"  ❌ Errore PDF: {e}")
        return False
    return False

def generate_image_thumbnail(file_path, thumb_path):
    if not HAS_PIL: return False
    
    print(f"🖼️  Resize Immagine: {os.path.basename(file_path)}...")
    try:
        with Image.open(file_path) as img:
            img = img.convert('RGB') # Assicura compatibilità JPEG
            img.thumbnail(THUMB_SIZE)
            img.save(thumb_path, "JPEG", quality=85)
            return True
    except Exception as e:
        print(f"  ❌ Errore Immagine: {e}")
        return False

def main():
    if not os.path.exists(THUMB_DIR):
        os.makedirs(THUMB_DIR)

    print("🚀 Avvio Generazione Thumbnails...")
    
    count_new = 0
    count_skip = 0
    
    for root, dirs, files in os.walk(CONTENT_DIR):
        if "thumbnails" in root or "assets" in root: continue # Salta cartelle asset
        
        for file in files:
            if file.startswith("."): continue
            
            file_path = os.path.join(root, file)
            thumb_path = get_thumb_path(file_path)
            
            # Se esiste già, salta (Incremental build)
            if os.path.exists(thumb_path):
                # Opzionale: controlla data modifica per rigenerare se file originale è più nuovo
                if os.path.getmtime(file_path) <= os.path.getmtime(thumb_path):
                    count_skip += 1
                    continue
            
            ext = file.lower().split('.')[-1]
            success = False
            
            if ext == 'html':
                success = generate_app_thumbnail(file_path, thumb_path)
            elif ext == 'pdf':
                success = generate_pdf_thumbnail(file_path, thumb_path)
            elif ext in ['jpg', 'jpeg', 'png', 'webp']:
                success = generate_image_thumbnail(file_path, thumb_path)
            
            if success:
                count_new += 1

    print(f"\n✅ Finito. Nuovi: {count_new}, Saltati: {count_skip}")
    
    # Check dipendenze mancanti
    if not HAS_PLAYWRIGHT or not HAS_PDF or not HAS_PIL:
        print("\n⚠️  NOTA: Alcune thumbnails non sono state generate per mancanza di librerie.")
        print("   Esegui: pip install playwright pdf2image Pillow")
        print("   Esegui: playwright install chromium")
        print("   Esegui: sudo apt-get install poppler-utils")

if __name__ == "__main__":
    main()

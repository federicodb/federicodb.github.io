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

def generate_app_thumbnail(file_path, thumb_path):
    if not HAS_PLAYWRIGHT: return False
    
    print(f"📸 Snapshot App: {os.path.basename(file_path)}...")
    try:
        abs_path = os.path.abspath(file_path)
        url = f"file://{abs_path}"
        
        with sync_playwright() as p:
            # Lancia browser headless
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1200, 'height': 800}) # Risoluzione alta per screenshot
            
            # Vai alla pagina
            page.goto(url)
            
            # Attendi caricamento network
            # page.wait_for_load_state('networkidle')
            
            # Attesa esplicita per animazioni (Three.js start, etc.)
            page.wait_for_timeout(WAIT_TIME)
            
            # Screenshot
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

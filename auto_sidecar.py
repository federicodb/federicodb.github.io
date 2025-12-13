import os
import json
import re
from datetime import datetime

# --- CONFIGURAZIONE ---
CONTENT_DIR = "content"

# Mappa le cartelle ai Tag automatici da aggiungere
WATCH_DIRS = {
    "video":        ["Video", "Tutorial"],
    "audio":        ["Audio", "Podcast"],
    "documents":    ["Dispensa", "PDF"],
    "infografiche": ["Infografica", "Visual"],
    # 'apps' è esclusa perché usa i <meta> nell'HTML
    # 'notes' è esclusa perché usa il frontmatter YAML nel Markdown
}

# Estensioni da ignorare (non vogliamo json per questi file)
IGNORE_EXT = {".json", ".py", ".js", ".html", ".css", ".md", ".txt", ".DS_Store"}

def parse_filename(filename):
    """
    Deduce i metadati dal nome del file.
    Formato ideale: "2025-12-14_Titolo_Della_Lezione_TAG1_TAG2.ext"
    Funziona anche con: "Titolo_Lezione.ext"
    """
    name_no_ext, _ = os.path.splitext(filename)
    parts = name_no_ext.split('_')
    
    meta = {
        "title": "",
        "date": datetime.now().strftime('%Y-%m-%d'),
        "tags": [],
        "description": "" 
    }

    # 1. Cerca la data all'inizio (YYYY-MM-DD)
    date_match = re.match(r'^\d{4}-\d{2}-\d{2}$', parts[0])
    if date_match:
        meta["date"] = parts[0]
        parts.pop(0) # Rimuovi la data dalla lista parti

    # 2. Analisi parti rimanenti (Titolo vs Tags)
    # Euristica: Parole tutte maiuscole (es. 5EL, LAB) o con numeri (3A) sono TAG.
    # Il resto è TITOLO.
    title_parts = []
    
    for part in parts:
        # Se è corto e tutto maiuscolo o contiene numeri, lo considero un Tag
        if (part.isupper() and len(part) <= 5) or (any(c.isdigit() for c in part) and len(part) <= 4):
            meta["tags"].append(part)
        else:
            title_parts.append(part)
            
    # Ricostruisce il titolo mettendo le maiuscole alle prime lettere
    meta["title"] = " ".join(title_parts).title() if title_parts else name_no_ext
    
    # Descrizione di default (segnaposto)
    meta["description"] = f"Risorsa didattica: {meta['title']}."

    return meta

def process_directory(category, default_tags):
    dir_path = os.path.join(CONTENT_DIR, category)
    
    # Se la cartella non esiste (es. non hai ancora audio), passa oltre
    if not os.path.exists(dir_path):
        return

    count = 0
    # Scansiona file
    for filename in os.listdir(dir_path):
        file_path = os.path.join(dir_path, filename)
        _, ext = os.path.splitext(filename)

        # Ignora cartelle, file nascosti o estensioni non media
        if os.path.isdir(file_path) or filename.startswith(".") or ext.lower() in IGNORE_EXT:
            continue
            
        # Calcola il percorso del JSON atteso
        json_path = os.path.join(dir_path, os.path.splitext(filename)[0] + ".json")
        
        # --- BLOCCO DI SICUREZZA ---
        # Crea il JSON SOLO se NON esiste già.
        # Se esiste, rispetta le tue modifiche manuali e non fa nulla.
        if not os.path.exists(json_path):
            try:
                # Genera dati dal nome file
                meta = parse_filename(filename)
                
                # Aggiungi tag di categoria (senza duplicati)
                all_tags = set(meta["tags"] + default_tags)
                meta["tags"] = list(all_tags)
                
                # Scrivi JSON su disco
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(meta, f, indent=4, ensure_ascii=False)
                
                print(f"   [+] Generato JSON per: {filename}")
                count += 1
            except Exception as e:
                print(f"   [!] Errore su {filename}: {e}")
        # else:
            # print(f"   [=] Saltato (esiste già): {filename}") # Decommenta per debug

    if count > 0:
        print(f"📂 {category.upper()}: Creati {count} nuovi file descrittivi.")

def main():
    print("🤖 Auto-Sidecar: Controllo nuovi file multimediali...")
    if not os.path.exists(CONTENT_DIR):
        print(f"❌ Errore: Cartella '{CONTENT_DIR}' non trovata.")
        return

    for category, tags in WATCH_DIRS.items():
        process_directory(category, tags)

if __name__ == "__main__":
    main()
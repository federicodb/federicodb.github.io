import os
import json
import re
from datetime import datetime
import html

# --- CONFIGURAZIONE ---
CONTENT_DIR = "content"
DB_FILE = "database.js"
SITEMAP_FILE = "sitemap.xml"
OUTPUT_VAR_NAME = "db"
BASE_URL = "https://federicodb.github.io/"

# Mappa delle cartelle ai tipi di contenuto
TYPE_MAP = {
    "apps": "app",
    "studio_appz": "app",
    "video": "video",
    "audio": "audio",
    "infografiche": "infographic",
    "documents": "document",
    "images": "image",
    "notes": "note",
    "links": "link"
}

def extract_markdown_meta(file_path):
    """
    Legge un file Markdown e ne estrae i metadati dal Frontmatter (YAML).
    ---
    title: Titolo
    description: Descrizione
    ---
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        meta = {
            "title": os.path.basename(file_path).replace(".md", "").replace("_", " ").title(),
            "excerpt": "Nota di studio.",
            "tags": ["Appunti"],
            "date": datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d')
        }

        # Parsing Frontmatter artigianale (per non dipendere da librerie esterne)
        if content.startswith("---"):
            end_idx = content.find("---", 3)
            if end_idx != -1:
                yaml_block = content[3:end_idx]
                for line in yaml_block.strip().split('\n'):
                    if ':' in line:
                        key, val = line.split(':', 1)
                        key = key.strip()
                        val = val.strip()
                        
                        if key == "title": meta["title"] = val
                        elif key == "description": meta["excerpt"] = val
                        elif key == "date": meta["date"] = val
                        elif key == "tags": 
                            # Gestione array semplice [a, b] o lista a,b
                            val = val.replace("[", "").replace("]", "").replace('"', "")
                            meta["tags"] = [t.strip() for t in val.split(',')]
                            
        return meta
    except Exception as e:
        print(f"  ⚠️ Errore parsing MD {file_path}: {e}")
        return None

def extract_html_meta(file_path):
    """
    Legge un file HTML e ne estrae i metadati per il database.
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # 1. Titolo
        title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
        title = html.unescape(title_match.group(1)) if title_match else os.path.basename(file_path)
        title = title.split("-")[0].strip()
        
        # 2. Descrizione
        desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
        description = html.unescape(desc_match.group(1)) if desc_match else "Attività interattiva."
        
        # 3. Tags
        tags_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
        tags_str = tags_match.group(1) if tags_match else ""
        tags = [t.strip() for t in tags_str.split(',') if t.strip()]
        
        # 4. Data
        date_match = re.search(r'<meta\s+name=["\']date["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
        if date_match:
            date_str = date_match.group(1)
        else:
            timestamp = os.path.getmtime(file_path)
            date_str = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')

        return {
            "title": title,
            "excerpt": description,
            "tags": tags,
            "date": date_str
        }
    except Exception as e:
        print(f"  ⚠️ Errore parsing HTML {file_path}: {e}")
        return None

def extract_sidecar_meta(file_path):
    """
    Cerca un file .json con lo stesso nome del file multimediale.
    Es: video.mp4 -> video.json
    """
    base_path = os.path.splitext(file_path)[0]
    json_path = base_path + ".json"
    
    if not os.path.exists(json_path):
        return None
        
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Normalizza i campi se necessario
            if "description" in data and "excerpt" not in data:
                data["excerpt"] = data["description"]
            return data
    except Exception as e:
        print(f"  ⚠️ Errore lettura JSON {json_path}: {e}")
        return None

# Mappa avanzata per icone contestuali
ICON_MAP = {
    # Matematica Specifica
    "frazioni": "🍰", "torta": "🍰", "percentuali": "🍰",
    "polinomi": "🧱", "algebra": "🧱", "scomposizione": "🧱", "tiles": "🧱",
    "funzioni": "📈", "analisi": "📈", "grafico": "📈", "studio": "📈", "limiti": "📈", "derivate": "📈",
    "geometria": "📐", "pitagora": "📐", "triangolo": "📐", "angoli": "📐", "goniometria": "📐",
    "logica": "🔴", "insiemi": "🔴", "venn": "🔴",
    "statistica": "📊", "dati": "📊",
    "mcd": "🔢", "mcm": "🔢", "numeri": "🔢", "calcolo": "🔢", "aritmetica": "🔢", "divisibilità": "🔢",
    
    # Fisica & Scienze
    "fisica": "⚡", "elettricità": "⚡", "corrente": "⚡", "fasori": "⚡", "onde": "🌊",
    "caos": "🌀", "attrattori": "🌀", "sistemi": "🌀",
    "spazio": "🚀", "astronomia": "🪐",
    
    # Informatica & Tech
    "coding": "💻", "algoritmi": "💻", "binario": "0️⃣1️⃣",
    "3d": "🧊", "stampa": "🧊", "modelli": "🧊",
    
    # Altro
    "gioco": "🎮", "game": "🎮", "videogioco": "👾", "invaders": "👾",
    "memory": "🧩", "puzzle": "🧩",
    "mappa": "🌍", "geografia": "🌍", "mercatore": "🌍", "cartografia": "🌍",
    "arte": "🎨", "pattern": "🎨", "design": "🎨", "colore": "🎨",
    "civica": "⚖️", "voto": "⚖️", "costituzione": "⚖️", "diritto": "⚖️", "nash": "🧠",
    "podcast": "🎧", "audio": "🎧",
    "video": "🎬", "tutorial": "🎬",
    "infografica": "🖼️", "immagine": "🖼️",
    "documento": "📄", "pdf": "📄", "dispensa": "📄"
}

def get_icon_for_type(content_type, tags=[], title=""):
    # 1. Priorità al tipo di file se non è un'app
    if content_type == "link": return "🌐"
    if content_type == "video": return "🎬"
    if content_type == "audio": return "🎧"
    if content_type == "infographic": return "🖼️"
    if content_type == "document": return "📄"
    if content_type == "image": return "🖼️"
    if content_type == "note": return "📝"

    # 2. Analisi Contestuale (Tags + Titolo)
    # Uniamo tutto in un set di parole chiave normalizzate
    search_corpus = set([t.lower() for t in tags] + [w.lower() for w in title.split()])
    
    # Cerca match specifici nel dizionario
    for key, icon in ICON_MAP.items():
        if key in search_corpus:
            return icon
            
    # 3. Fallback generici per App
    if "matematica" in search_corpus: return "📐"
    if "fisica" in search_corpus: return "⚡"
    if "chimica" in search_corpus: return "🧪"
    
    return "🧩" # Icona di default per app generiche

def main():
    if not os.path.exists(CONTENT_DIR):
        print(f"❌ Errore: Cartella '{CONTENT_DIR}' non trovata.")
        return

    items = []
    print(f"🔄 Scansione '{CONTENT_DIR}' in corso...")

    # Scansione ricorsiva
    for root, dirs, files in os.walk(CONTENT_DIR):
        # Modifica in-place della lista dirs per escludere cartelle nascoste dal walk
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        # Determina la categoria basandosi sulla cartella genitore diretta
        folder_name = os.path.basename(root)
        
        # Salta la root 'content' se ci sono file sparsi, o gestiscili come generici
        if folder_name == CONTENT_DIR:
            continue
            
        content_type = TYPE_MAP.get(folder_name, "unknown")
        
        for filename in files:
            file_path = os.path.join(root, filename)
            
            meta = None
            
            # CASO SPECIALE: Link Esterni (Solo JSON)
            if content_type == "link":
                if filename.endswith(".json"):
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            meta = json.load(f)
                            # Se l'URL non è nel JSON (errore), lo ignoriamo
                            if "url" not in meta:
                                print(f"  ⚠️ Ignorato link senza URL: {filename}")
                                continue
                            # Normalizza
                            if "description" in meta and "excerpt" not in meta: meta["excerpt"] = meta["description"]
                    except Exception as e:
                        print(f"  ⚠️ Errore JSON Link {filename}: {e}")
                else:
                    continue # Ignora file non json nella cartella links

            # CASO STANDARD: File Media o App
            else:
                # Ignora i file .json (sono metadati sidecar per i media)
                if filename.endswith(".json"):
                    continue
                    
                # Ignora file nascosti o di sistema
                if filename.startswith("."):
                    continue

                # Strategia di estrazione in base al tipo
                if content_type == "app" and filename.endswith(".html"):
                    meta = extract_html_meta(file_path)
                elif content_type == "note" and filename.endswith(".md"):
                    meta = extract_markdown_meta(file_path)
                elif content_type != "app" and content_type != "note":
                    # Per media files, cerca il JSON sidecar
                    meta = extract_sidecar_meta(file_path)
            
            if meta:
                # Aggiungi campi comuni calcolati
                # Se l'URL non c'è (media locale), calcolalo. Se c'è (link esterno), usalo.
                if "url" not in meta:
                    meta["url"] = file_path.replace("\\", "/") # Path relativo per il web
                
                meta["type"] = content_type
                meta["icon"] = get_icon_for_type(content_type, meta.get("tags", []), meta.get("title", ""))
                
                # Fallback data se mancante nel JSON
                if "date" not in meta:
                     timestamp = os.path.getmtime(file_path)
                     meta["date"] = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')

                # --- NEW: Thumbnail Linking ---
                # Cerca se esiste una thumbnail generata automaticamente
                base_name = os.path.splitext(filename)[0]
                thumb_rel_path = f"content/assets/thumbnails/{base_name}.jpg"
                if os.path.exists(thumb_rel_path):
                    meta["thumbnail"] = thumb_rel_path
                # ------------------------------

                # --- NEW: Data Consistency Check ---
                if "tags" not in meta or meta["tags"] is None:
                    meta["tags"] = []
                if not meta.get("tags"):
                    print(f"  ⚠️  WARNING: Tags mancanti o vuoti per '{filename}'")
                if not meta.get("excerpt") and not meta.get("description"):
                    print(f"  ⚠️  WARNING: Descrizione mancante per '{filename}'")
                # -----------------------------------

                items.append(meta)
                print(f"  ✅ Indicizzato [{content_type}]: {meta['title']}")

    # Ordina per data (dal più recente)
    items.sort(key=lambda x: x.get('date', ''), reverse=True)

    # Scrive il file JS
    js_content = f"/* \n   ⚠️ GENERATO AUTOMATICAMENTE DA build.py \n   Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n*/\n\nconst {OUTPUT_VAR_NAME} = " + json.dumps(items, indent=4, ensure_ascii=False) + ";"
    
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    # Scrive la Sitemap XML
    generate_sitemap(items)
    
    print(f"\n✨ Successo! {len(items)} elementi salvati in '{DB_FILE}' e '{SITEMAP_FILE}'.")

def generate_sitemap(items):
    """ Genera la sitemap XML standard per i motori di ricerca """
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Home Page
    xml += '  <url>\n'
    xml += f'    <loc>{BASE_URL}</loc>\n'
    xml += f'    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'
    
    for item in items:
        # Codifica URL per sicurezza
        safe_url = item['url'].replace(" ", "%20")
        # Se è un'app HTML, l'URL è diretto. Se è un media, potrebbe essere gestito diversamente, 
        # ma per ora puntiamo al file fisico che è comunque accessibile.
        full_url = BASE_URL + safe_url
        
        priority = "0.8" if item.get('type') == 'app' else "0.6"
        
        xml += '  <url>\n'
        xml += f'    <loc>{full_url}</loc>\n'
        xml += f'    <lastmod>{item.get("date", datetime.now().strftime("%Y-%m-%d"))}</lastmod>\n'
        xml += '    <changefreq>monthly</changefreq>\n'
        xml += f'    <priority>{priority}</priority>\n'
        xml += '  </url>\n'

    xml += '</urlset>'
    
    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write(xml)

if __name__ == "__main__":
    main()

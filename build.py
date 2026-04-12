import os
import json
import re
from datetime import datetime
import html
import subprocess

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
    "verifiche": "document",
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
        desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=(["\'])(.*?)\1', content, re.IGNORECASE)
        description = html.unescape(desc_match.group(2)) if desc_match else "Attività interattiva."
        
        # 3. Tags
        tags_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=(["\'])(.*?)\1', content, re.IGNORECASE)
        tags_str = tags_match.group(2) if tags_match else ""
        tags = [t.strip() for t in tags_str.split(',') if t.strip()]
        
        # 4. Data
        date_match = re.search(r'<meta\s+name=["\']date["\']\s+content=(["\'])(.*?)\1', content, re.IGNORECASE)
        if date_match:
            date_str = date_match.group(2)
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

def get_game_type(content_type, tags=[], title="", excerpt=""):
    """ Assegna deterministica del target UX (arcade, memory, sim, document) da usare nel frontend UI. """
    search_corpus = set([t.lower() for t in tags] + [w.lower() for w in title.split()] + [w.lower() for w in excerpt.split()])
    
    if content_type == "document" or any(k in search_corpus for k in ['verifica', 'pdf', 'prova', 'test']):
        return "document"
        
    # Matching Memory/Carte
    if any(k in search_corpus for k in ['memory', 'match', 'carte', 'card', 'puzzle']):
        return "memory"
        
    # Matching Arcade/Videogiocoso
    if any(k in search_corpus for k in ['gamification', 'videogioco', 'gioco', 'challenge', 'sfida', 'arcade']):
        return "arcade"
        
    # Matching Simulatori & WebGL
    if any(k in search_corpus for k in ['3d', 'webgl', 'simulatore', 'simulazione', 'laboratorio', 'simulazioni']):
        return "sim"
        
    # Fallback standard
    return "standard"

def infer_classes_from_competencies(tags):
    """ Estrapola target espliciti (1EL, 2EL, 3MEC, 4EL, 5EL) in base all'argomento. """
    has_class = False
    for t in tags:
        # Checka se c'è già una classe dichiarata o un livello macro
        if re.match(r'^[1-5][A-Z]{2,3}$', t, re.IGNORECASE) or t.lower() in ['biennio', 'triennio', 'trasversale'] or "/" in t:
            has_class = True
            break
            
    if has_class:
        return tags
        
    tags_lower = [t.lower() for t in tags]
    
    # Dizionari Argomenti -> Indirizzi (Riforma Tecnici/Professionali)
    # Classi 1/2 (Basi, Algebra, Polinomi, Insiemistica)
    base_kw = ['aritmetica', 'calcolo', 'frazioni', 'insiemi', 'potenze', 'polinomi', 'scomposizion', 'mcd', 'mcm', 'algebra']
    # Classe 3 (Geometria analitica base)
    terza_kw = ['retta', 'parabola', 'geometria analitica']
    # Classe 4 (Funzioni, Goniometria, Elettrotecnica in Alternata)
    quarta_kw = ['funzioni', 'studio di funzione', 'dominio', 'disequazioni', 'fasori', 'onda', 'goniometria', 'trigonometria', 'seno', 'coseno']
    # Classe 5 (Analisi, Sistemi Dinamici, Caos)
    quinta_kw = ['limiti', 'derivate', 'caos', 'sistemi dinamici', 'attrattori', 'integrali']
    
    if any(k in t for k in quinta_kw for t in tags_lower):
        tags.append("5EL")
    elif any(k in t for k in quarta_kw for t in tags_lower):
        tags.append("4EL")
    elif any(k in t for k in terza_kw for t in tags_lower):
        tags.append("3MEC")
    elif any(k in t for k in base_kw for t in tags_lower):
        tags.append("1EL/2EL")
    elif len(tags) > 0:
        tags.append("Trasversale")
        
    return tags

def main():
    if not os.path.exists(CONTENT_DIR):
        print(f"❌ Errore: Cartella '{CONTENT_DIR}' non trovata.")
        return

    items = []
    print(f"🔄 Scansione '{CONTENT_DIR}' in corso...")

    # Scansione ricorsiva
    for root, dirs, files in os.walk(CONTENT_DIR):
        # Modifica in-place della lista dirs per escludere cartelle nascoste e assets dal walk
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'assets']

        # Determina la categoria basandosi sul percorso
        path_parts = root.split(os.sep)
        content_type = "unknown"
        for part in reversed(path_parts):
            if part in TYPE_MAP:
                content_type = TYPE_MAP[part]
                break
        
        if root == CONTENT_DIR:
            continue
        
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
                    
                    # Strategia avanzata: Estrazione testo reale dal PDF
                    extracted_text = ""
                    try:
                        result = subprocess.run(["pdftotext", file_path, "-"], capture_output=True, text=True, timeout=5)
                        extracted_text = result.stdout
                    except Exception as e:
                        print(f"  ⚠️ Errore pdftotext su {filename}: {e}")

                    # --- PARSING AVANZATO FILENAME ---
                    # Esempi: 2GP___verifica_31_marzo_2026_fila_A.pdf, verifica 2gp 24 feb 2026_fila A.pdf
                    fn_clean = filename.lower().replace("___", " ").replace("_", " ").replace("-", " ")
                    
                    found_class = None
                    class_match = re.search(r'\b([1-5][a-z]{2,3})\b', fn_clean)
                    if class_match:
                        found_class = class_match.group(1).upper()
                    
                    # Estrazione Data (anno opzionale)
                    months_it = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                                 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
                                 'gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
                    month_pattern = "|".join(months_it)
                    date_match = re.search(rf'(\d{{1,2}})\s*({month_pattern})\s*(\d{{4}})?', fn_clean)
                    
                    day, month, year = "", "", ""
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                    
                    if date_match:
                        day, month, year = date_match.groups()
                        if not year: year = str(file_mtime.year) 
                        # Normalizza mese
                        for m in ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']:
                            if month.startswith(m):
                                idx = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'].index(m)
                                month = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                                         'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'][idx]
                                break
                    else:
                        # Fallback se non c'è data nel nome
                        month = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'][file_mtime.month-1]
                        year = str(file_mtime.year)
                        day = str(file_mtime.day)
                    
                    # Estrazione Fila o Tipologia (spazio opzionale)
                    fila_match = re.search(r'fila\s?([a-z0-9])', fn_clean)
                    if fila_match:
                        fila_label = f"Fila {fila_match.group(1).upper()}"
                    elif "mappa" in fn_clean:
                        lang_match = re.search(r'\b(it|en|ukr)\b', fn_clean)
                        fila_label = f"Mappa {lang_match.group(1).upper()}" if lang_match else "Mappa"
                    elif "correttore" in fn_clean:
                        fila_label = "Correttore"
                    elif "recupero" in fn_clean or "debito" in fn_clean:
                        fila_label = "Recupero"
                    else:
                        fila_label = "Versione Unica"

                    # --- ESTRAZIONE ARGOMENTI DAL TESTO ---
                    topics = []
                    # Cerca "Verifica di matematica - Argomenti..."
                    subject_match = re.search(r'Verifica di\s+[^-\n]+\s*-\s*([^\n.]+)', extracted_text, re.IGNORECASE)
                    if subject_match:
                        topic_line = subject_match.group(1).strip()
                        topics = [t.strip().capitalize() for t in re.split(r'[,;]', topic_line) if len(t.strip()) > 2]
                    
                    # Fallback temi dal nome file
                    raw_words = fn_clean[:-4].split()
                    stopwords = ['verifica', 'fila', 'a', 'b', 'c', 'correttore', 'mappa', 'pdf', 'di', 'del', 'recupero', 'debito', 'it', 'en', 'ukr', 'classe'] + months_it
                    meaningful_words = [w for w in raw_words if w.lower() not in stopwords and not re.match(r'^\d+$', w) and len(w) > 2]
                    
                    if not topics:
                        topics = [w.capitalize() for w in meaningful_words[:3]]

                    # Titolo formattato: "Verifica Classe 2GP, Marzo 2026"
                    is_in_verifiche = "verifiche" in root.lower()
                    if found_class:
                        clean_title = f"{'Verifica ' if is_in_verifiche else ''}Classe {found_class}, {month} {year}"
                    else:
                        prefix = "Verifica " if is_in_verifiche else ""
                        clean_title = prefix + " ".join(meaningful_words).title()
                    
                    tags = list(set(topics + ([found_class] if found_class else [])))
                    # Aggiungi meta-tag per raggruppamento
                    group_ref = f"{found_class}_{month}_{year}".lower().replace(" ", "_") if found_class else clean_title.lower()

                    # Excerpt: Solo gli argomenti puliti
                    excerpt = "Argomenti: " + ", ".join(topics) if topics else "Verifica multimediale."

                    # Validazione minima data
                    try:
                        day_int = int(day) if day else 1
                        if day_int > 31: day_int = 1 # Fallback semplice
                        date_str = f"{year}-{['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].index(month)+1:02d}-{day_int:02d}"
                    except:
                        date_str = file_mtime.strftime('%Y-%m-%d')

                    meta = {
                         "title": clean_title.strip(),
                         "excerpt": excerpt,
                         "tags": list(set(tags)),
                         "date": date_str,
                         "group_ref": group_ref,
                         "version_label": fila_label
                    }
            
            if meta and content_type != "unknown":
                # Aggiungi campi comuni calcolati
                # Se l'URL non c'è (media locale), calcolalo. Se c'è (link esterno), usalo.
                if "url" not in meta:
                    meta["url"] = file_path.replace("\\", "/") # Path relativo per il web
                
                meta["type"] = content_type
                meta["icon"] = get_icon_for_type(content_type, meta.get("tags", []), meta.get("title", ""))
                meta["game_type"] = get_game_type(content_type, meta.get("tags", []), meta.get("title", ""), meta.get("excerpt", ""))
                
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
                    
                meta["tags"] = infer_classes_from_competencies(meta["tags"])
                
                if not meta.get("tags"):
                    print(f"  ⚠️  WARNING: Tags mancanti o vuoti per '{filename}'")
                if not meta.get("excerpt") and not meta.get("description"):
                    print(f"  ⚠️  WARNING: Descrizione mancante per '{filename}'")
                # -----------------------------------

                items.append(meta)
                print(f"  ✅ Indicizzato [{content_type}]: {meta['title']}")

    # Ordina per data (dal più recente)
    items.sort(key=lambda x: x.get('date', ''), reverse=True)

    # --- FILTRO RIGIDO PER CARTELLA ---
    # Qualsiasi cosa sia nella cartella verifiche finisce in db_verifiche, il resto in db_main
    db_main = [item for item in items if "content/verifiche" not in item.get('url', '')]
    raw_verifiche = [item for item in items if "content/verifiche" in item.get('url', '')]

    # --- RAGGRUPPAMENTO VERSIONI ---
    verifiche_grouped = {}
    for v in raw_verifiche:
        # Usa il group_ref calcolato prima
        group_key = v.get('group_ref', v['title'].lower().strip())
        
        if group_key not in verifiche_grouped:
            # Crea una copia per evitare side effects
            entry = v.copy()
            entry['versions'] = []
            verifiche_grouped[group_key] = entry
        
        verifiche_grouped[group_key]['versions'].append({
            "url": v['url'],
            "date": v['date'],
            "label": v.get('version_label', 'File')
        })

    # Raffina i gruppi: se un gruppo ha più versioni, ordinale
    db_verifiche = []
    for key in verifiche_grouped:
        group = verifiche_grouped[key]
        
        # Filtro intelligente: se esistono file contrassegnati come "Fila X", 
        # rimuoviamo il generico "Versione Unica" (che spesso è il file di testata o un duplicato)
        has_fila = any("Fila" in v['label'] for v in group['versions'])
        if has_fila:
            group['versions'] = [v for v in group['versions'] if v['label'] != "Versione Unica"]
            
        # Sort versions by label (A before B) then date
        group['versions'].sort(key=lambda x: (x['label'], x['date']), reverse=False)
        # L'URL principale punta alla prima versione utile
        group['url'] = group['versions'][0]['url']
        group['date'] = group['versions'][0]['date']
        db_verifiche.append(group)

    # Scrive il file JS (Main)
    js_content = f"/* \n   ⚠️ GENERATO AUTOMATICAMENTE DA build.py \n   Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n*/\n\nconst {OUTPUT_VAR_NAME} = " + json.dumps(db_main, indent=4, ensure_ascii=False) + ";"
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    # Scrive il file JS (Verifiche)
    js_verifiche_content = f"/* \n   ⚠️ GENERATO AUTOMATICAMENTE DA build.py \n   Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n*/\n\nconst db_verifiche = " + json.dumps(db_verifiche, indent=4, ensure_ascii=False) + ";"
    with open("database_verifiche.js", 'w', encoding='utf-8') as f:
        f.write(js_verifiche_content)
        
    # Scrive la Sitemap XML
    generate_sitemap(db_main)
    
    print(f"\n✨ Successo! Salvati {len(db_main)} Laboratori e {len(db_verifiche)} Verifiche.")

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

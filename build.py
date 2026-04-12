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
RIFORMA_JSON_PATH = "riforma2017.json"

# Caricamento Riforma 2017
def load_riforma_data():
    if os.path.exists(RIFORMA_JSON_PATH):
        try:
            with open(RIFORMA_JSON_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Errore caricamento {RIFORMA_JSON_PATH}: {e}")
    return None

RIFORMA_DATA = load_riforma_data()

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
    
def normalize_class_tag(tag):
    """ Normalizza '2el' o '2EL' in '2 EL'. """
    if not tag: return tag
    # Regex per trovare Numero e Lettere e inserire uno spazio se manca
    s = str(tag).upper().strip()
    return re.sub(r'^([1-5])([A-Z]{2,3})$', r'\1 \2', s)
def infer_classes_from_competencies(tags):
    """ Estrapola target espliciti (1 EL, 2 EL, etc.) in base all'argomento. """
    has_class = False
    for t in tags:
        # Checka se c'è già una classe dichiarata o un livello macro (formato X YY o XYY)
        if re.match(r'^[1-5]\s?[A-Z]{2,3}$', t, re.IGNORECASE) or t.lower() in ['biennio', 'triennio', 'trasversale'] or "/" in t:
            has_class = True
            break
            
    if has_class:
        # Comunque normalizza i tag esistenti
        return [normalize_class_tag(t) if re.match(r'^[1-5]\s?[A-Z]{2,3}$', t, re.IGNORECASE) else t for t in tags]
        
    tags_lower = [t.lower() for t in tags]
    
    # Dizionari Argomenti -> Indirizzi (Riforma Tecnici/Professionali)
    base_kw = ['aritmetica', 'calcolo', 'frazioni', 'insiemi', 'potenze', 'polinomi', 'scomposizion', 'mcd', 'mcm', 'algebra']
    terza_kw = ['retta', 'parabola', 'geometria analitica']
    quarta_kw = ['funzioni', 'studio di funzione', 'dominio', 'disequazioni', 'fasori', 'onda', 'goniometria', 'trigonometria', 'seno', 'coseno']
    quinta_kw = ['limiti', 'derivate', 'caos', 'sistemi dinamici', 'attrattori', 'integrali']
    
    if any(k in t for k in quinta_kw for t in tags_lower):
        tags.append("5 EL")
    elif any(k in t for k in quarta_kw for t in tags_lower):
        tags.append("4 EL")
    elif any(k in t for k in terza_kw for t in tags_lower):
        tags.append("3 MEC")
    elif any(k in t for k in base_kw for t in tags_lower):
        tags.append("1 EL / 2 EL")
    elif len(tags) > 0:
        tags.append("Trasversale")
        
    return tags

# --- KNOWLEDGE BASE RIFORMA 2017 (Integrazione Dinamica) ---
KEYWORD_TO_RIFORMA_ID = {
    # Matematica Generale
    "equazioni": "MAT_A03", "disequazioni": "MAT_A03", "sistemi": "MAT_A03",
    "algebra": "MAT_K01", "letterale": "MAT_K01", "polinomi": "MAT_K01", "scomposizione": "MAT_K01",
    "funzioni": "MAT_K02", "dominio": "MAT_A02", "grafico": "MAT_A02", "andamento": "MAT_K02",
    "geometria": "MAT_K03", "pitagora": "MAT_A04", "euclidea": "MAT_K03", "spaziale": "MAT_C4",
    "statistica": "MAT_K04", "probabilità": "MAT_K04", "dati": "MAT_C3", "interpretare": "MAT_C3",
    "logica": "MAT_C2", "problemi": "CIT_06", "situazioni": "MAT_C2",
    
    # Indirizzo Tecnico & Soft Skills
    "3d": "IND_C1", "openscad": "IND_C1", "parametr": "IND_C1", "modellazione": "IND_C1",
    "python": "IND_C2", "p5.js": "IND_C2", "algoritmo": "IND_C2", "computazionale": "IND_C2",
    "stampa": "IND_C3", "slicing": "IND_C3", "fabbricazione": "IND_C3",
    "dsa": "IND_C4", "adhd": "IND_C4", "accessibil": "IND_C4", "inclusiv": "IND_C4",
    "open source": "IND_K01", "arduino": "IND_K03", "raspberry": "IND_K03",
    "ai": "SOFT_03", "intelligenza": "SOFT_03", "metacognizion": "SOFT_02"
}

def get_riforma_label(ref_id):
    """ Cerca l'etichetta corrispondente all'ID nel database della riforma. """
    if not RIFORMA_DATA: return None
    
    # Cerca ricorsivamente in tutte le sezioni
    sections = [
        RIFORMA_DATA.get("competenze_cittadinanza", []),
        RIFORMA_DATA.get("area_generale_matematica", {}).get("competenze", []),
        RIFORMA_DATA.get("area_generale_matematica", {}).get("abilita", []),
        RIFORMA_DATA.get("area_generale_matematica", {}).get("conocenze", []), # Nota: 'conocenze' o 'conoscenze' nel JSON? Controllo sopra
        RIFORMA_DATA.get("area_indirizzo_tecnico", {}).get("competenze_professionali", []),
        RIFORMA_DATA.get("area_indirizzo_tecnico", {}).get("conoscenze_tecniche", []),
        RIFORMA_DATA.get("competenze_trasversali_soft_skills", [])
    ]
    
    # Fallback per typo comune nel JSON se presente
    if "conoscenze" in RIFORMA_DATA.get("area_generale_matematica", {}):
        sections.append(RIFORMA_DATA["area_generale_matematica"]["conoscenze"])
    
    for section in sections:
        for item in section:
            if item.get("id") == ref_id:
                return item.get("label")
    return None

def map_topics_to_riforma(topics):
    """ Incrocia gli argomenti/parole chiave con le competenze della riforma 2017. """
    if not RIFORMA_DATA: return []
    
    extra_tags = []
    text_to_search = " ".join([t.lower() for t in topics])
    
    for keyword, ref_id in KEYWORD_TO_RIFORMA_ID.items():
        if keyword in text_to_search:
            label = get_riforma_label(ref_id)
            if label:
                # Formato: ID:Label_Breve (troncata se troppo lunga per la UI)
                short_label = label[:45] + "..." if len(label) > 48 else label
                extra_tags.append(f"{ref_id}:{short_label}")
    
    return list(set(extra_tags))

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
                    class_match = re.search(r'\b([1-5])([a-z]{2,3})\b', fn_clean)
                    if class_match:
                        found_class = f"{class_match.group(1)} {class_match.group(2).upper()}"
                    
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
                    subject = "Matematica" # Fallback
                    duration = ""
                    calc_info = ""

                    # 1. Materia e Argomenti
                    # Cerchiamo "Verifica di [Materia] [: -] [Argomenti]", "Mappa Operativa: [Argomenti]" o "Manuale di Analisi: [Argomenti]"
                    subj_match = re.search(r'(?:Verifica di|Mappa Operativa|Manuale di Analisi)[:\s-]\s*([^:\- \n]+)', extracted_text, re.IGNORECASE)
                    if subj_match:
                        subject = subj_match.group(1).strip().capitalize()

                    # Supporta sia il trattino che i due punti, e gestisce più righe
                    subject_regex = r'(?:Verifica di|Mappa Operativa|Manuale di Analisi)\s*[^-\n:]*[:\-]\s*([^\n]+(?:\n\s*[^\n]+)?)'
                    subject_match = re.search(subject_regex, extracted_text, re.IGNORECASE)
                    if subject_match:
                        topic_line = subject_match.group(1).replace('\n', ' ').strip()
                        # Pulisce dalla riga successiva (es. se cattura Cognome/Nome)
                        topic_line = re.split(r'Cognome:|Nome:|Istruzioni', topic_line, flags=re.IGNORECASE)[0].strip()
                        # Pulisce dai punti finali e spazi extra
                        topics = [t.strip().rstrip('.').capitalize() for t in re.split(r'[,;]', topic_line) if len(t.strip()) > 2]
                    
                    # 2. Durata
                    dur_match = re.search(r'(?:durata|tempo a disposizione).*?(\d+)\s*minuti', extracted_text, re.IGNORECASE)
                    if dur_match:
                        duration = f"Durata: {dur_match.group(1)} min"

                    # 3. Calcolatrice
                    if re.search(r'calcolatrice\b.*?ammess|usare\s+la\s+calcolatrice', extracted_text, re.IGNORECASE):
                        calc_info = "Calcolatrice ammessa"
                    elif "sconsigliato" in extracted_text.lower() and "calcolatrice" in extracted_text.lower():
                        calc_info = "Calcolatrice sconsigliata"

                    # Fallback temi dal nome file
                    raw_words = fn_clean[:-4].split()
                    stopwords = ['verifica', 'fila', 'a', 'b', 'c', 'correttore', 'mappa', 'pdf', 'di', 'del', 'recupero', 'debito', 'it', 'en', 'ukr', 'classe', 'manuale', 'operativa'] + months_it
                    # Filtra anche codici classe (es. 2el, 4gp)
                    meaningful_words = [w for w in raw_words if w.lower() not in stopwords and not re.match(r'^\d+$', w) and not re.match(r'^[1-5][a-z]{2,3}$', w) and len(w) > 2]
                    
                    if not topics:
                        topics = [w.capitalize() for w in meaningful_words[:3]]

                    # Mappatura Competenze Riforma 2017
                    riforma_tags = map_topics_to_riforma(topics)

                    # Titolo formattato: "Verifica Classe 2GP, Marzo 2026"
                    is_in_verifiche = "verifiche" in root.lower()
                    if found_class:
                        clean_title = f"{'Verifica ' if is_in_verifiche else ''}Classe {found_class}, {month} {year}"
                    else:
                        prefix = "Verifica " if is_in_verifiche else ""
                        clean_title = prefix + " ".join(meaningful_words).title()
                    
                    # Excerpt: Narrativo e professionale
                    topic_str = ", ".join(topics) if topics else ""
                    parts = []
                    
                    if is_in_verifiche:
                        if topic_str:
                            parts.append(f"Verifica di {subject} su {topic_str}")
                        else:
                            parts.append(f"Verifica di {subject}")
                    else:
                        # Materiale didattico standard (Infografiche, Link, ecc.)
                        if topics:
                            parts.append(f"Approfondimento su {topic_str}")
                        else:
                            parts.append(meta.get("description", "Materiale didattico interattivo."))
                        
                    if duration and is_in_verifiche: parts.append(duration)
                    if calc_info and is_in_verifiche: parts.append(calc_info)
                    
                    # Unisci le parti con il punto e spazio
                    excerpt = ". ".join(parts).replace("..", ".") + "."
                    if not topics and is_in_verifiche:
                        excerpt = f"Verifica multimediale di {subject}."
                    
                    # Validazione minima data
                    try:
                        day_int = int(day) if day else 1
                        if day_int > 31: day_int = 1 # Fallback semplice
                        date_str = f"{year}-{['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].index(month)+1:02d}-{day_int:02d}"
                    except:
                        date_str = file_mtime.strftime('%Y-%m-%d')

                    # --- NEW: Tagging Semantico Specializzato ---
                    if "Mappa" in fila_label: topics.append("Mappa")
                    if "Correttore" in fila_label: topics.append("Correttore")
                    if "Recupero" in fila_label: topics.append("Recupero")

                    # Aggiungi meta-tag per raggruppamento raffinato (Classe + DataEsatta + PrimoArgomento o SlugFilename)
                    topic_slug = topics[0].lower().replace(" ", "_") if topics else "generica"
                    fn_slug = "_".join(meaningful_words[:2]).lower() if not topics else ""
                    group_ref = f"{found_class}_{date_str}_{topic_slug}_{fn_slug}".lower().replace(" ", "_").strip("_") if found_class else clean_title.lower()
                    
                    tags = list(set(topics + ([found_class] if found_class else [])))

                    meta = {
                         "title": clean_title.strip(),
                         "excerpt": excerpt,
                         "tags": list(set([normalize_class_tag(t) for t in tags + riforma_tags])),
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
                
                # Normalizzazione Case per evitare duplicati (es. "Algebra" vs "ALGEBRA")
                meta["tags"] = list(set([t.strip().rstrip('.') for t in meta["tags"]]))
                    
                # Estrazione semantica riforma 2017 (per App e altri tipi basandosi sui tag esistenti)
                riforma_extra = map_topics_to_riforma(meta.get("tags", []) + [meta.get("title", "")])
                if riforma_extra:
                    meta["tags"] = list(set(meta.get("tags", []) + riforma_extra))
                    
                # Ri-normalizzazione post-riforma per sicurezza
                meta["tags"] = list(set([normalize_class_tag(t) for t in meta["tags"]]))
                
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
        
        # Logica di priorità: Fila A/B > Versione Unica > Mappa > Correttore
        def get_priority(label):
            l = label.lower()
            if "fila" in l: return 10
            if "unica" in l: return 8
            if "mappa" in l: return 5
            if "correttore" in l: return 3
            return 1

        if group_key not in verifiche_grouped:
            # Crea una copia per evitare side effects
            entry = v.copy()
            entry['versions'] = []
            verifiche_grouped[group_key] = entry
        else:
            # Se la nuova versione ha priorità maggiore, aggiorna i metadati della card
            current_prio = get_priority(verifiche_grouped[group_key].get('version_label', ''))
            new_prio = get_priority(v.get('version_label', ''))
            if new_prio > current_prio:
                # Mantieni 'versions', ma aggiorna il resto
                new_entry = v.copy()
                new_entry['versions'] = verifiche_grouped[group_key]['versions']
                verifiche_grouped[group_key] = new_entry
        
        # Evita duplicati nella stessa card (stesso URL già presente)
        if not any(v['url'] == v_info['url'] for v_info in verifiche_grouped[group_key]['versions']):
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
        has_multiple_real_versions = len(set(v['label'] for v in group['versions'])) > 1
        
        if has_fila:
            group['versions'] = [v for v in group['versions'] if v['label'] != "Versione Unica"]
        
        # Se dopo il filtro resta solo una versione, resettiamo l'URL principale su quella
        # e (nello script UI) nasconderemo i bottoni versioni se non c'è reale molteplicità
            
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

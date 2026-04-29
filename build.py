import os
import json
import re
from datetime import datetime
import html
import subprocess

# --- GESTIONE VARIABILI D'AMBIENTE (TENTATIVO .ENV) ---
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                try:
                    k, v = line.strip().split("=", 1)
                    os.environ[k.strip()] = v.strip()
                except: pass

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

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
    "links": "link",
    "rif_norm_2017": "normativa"
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

# --- DEEP CONTENT SCANNER (Motore Euristico Offline) ---
class DeepContentScanner:
    """ 
    Esplora immagini e PDF per estrarre parole chiave senza IA. 
    Usa Tesseract per le immagini se installato, altrimenti si affida a pdftotext.
    """
    def __init__(self):
        self.knowledge_base = {
            "3 MEC": ["parabola", "retta", "geometria analitica", "sistemi", "equazioni fratte"],
            "4 EL": ["funzioni", "dominio", "segno", "disequazioni", "goniometria", "seno", "coseno", "fasori", "corrente", "onda"],
            "5 EL": ["limiti", "derivate", "caos", "attrattori", "integrali", "max", "min"],
            "1 EL / 2 EL": ["frazioni", "percentuali", "insiemi", "polinomi", "scomposizioni", "mcd", "mcm", "algebra", "geometria"]
        }
        
        self.keywords_dictionary = [
            "equazion", "disequazion", "funzion", "derivata", "limite", "dominio", 
            "grafico", "parabola", "retta", "polinom", "scomposizion", "frizion", 
            "trigonometri", "seno", "coseno", "fasor", "corrente", "elettric", 
            "pitagora", "geometria", "insiem", "probabilità", "statistica"
        ]

    def scan_file(self, file_path):
        """ Scansiona un file e restituisce il testo grezzo estratto. """
        ext = os.path.splitext(file_path)[1].lower()
        extracted_text = ""
        
        if ext == ".pdf":
            try:
                result = subprocess.run(["pdftotext", file_path, "-"], capture_output=True, text=True, timeout=5)
                extracted_text = result.stdout
            except: pass
            
        elif ext in [".png", ".jpg", ".jpeg"]:
            # Tenta OCR tramite Tesseract (Richiede pytesseract e tesseract-ocr)
            try:
                import pytesseract
                from PIL import Image
                extracted_text = pytesseract.image_to_string(Image.open(file_path), lang='ita+eng')
            except ImportError:
                print(f"  ⚠️ OCR saltato per {os.path.basename(file_path)}: Moduli Python 'pytesseract' o 'Pillow' mancanti.")
            except Exception as e:
                pass # Tesseract non installato a livello OS

        return extracted_text

    def analyze_content(self, text, baseline_topics):
        """ Legge il testo estratto e deduce la classe e veri argomenti (VIA GEMINI AI OPPURE OFFLINE). """
        if not text.strip(): return None, baseline_topics, ""
        
        text_lower = text.lower()
        found_class = None
        new_topics = list(baseline_topics)
        
        # --- GEMINI AI EXTRACTION (Se chiave presente) ---
        global GEMINI_API_KEY
        if GEMINI_API_KEY and GEMINI_API_KEY != "inserisci_qui_la_tua_chiave_selettivamente":
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel('gemini-1.5-flash')
                prompt = (
                    "Sei un assistente didattico esperto di matematica e fisica in un istituto tecnico italiano. "
                    "Leggi il testo crudo seguente estratto da un file PDF o Immagine. "
                    "Restituisci UNICAMENTE un JSON valido senza formattazioni markdown, contenente: "
                    "{ \"classe\": \"Una stringa esatta tra '1 EL', '2 EL', '3 MEC', '4 EL', '5 EL', '2 GP' oppure null\", "
                    "\"topics\": [ \"Lista\", \"Di\", \"Argomenti\", \"Chiave\" (Massimo 4, capitalizzati) ], "
                    "\"sintesi\": \"Una frase altamente professionale di 10 parole che riassume sinteticamente i temi trattati. (Esempio: Argomenti trattati: Equazioni differenziali e Fisica nucleare)\" } \n\n"
                    "Testo crudo:\n" + text[:4000]
                )
                response = model.generate_content(prompt)
                # Cleanup robusto da JSON generato da LLM
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                res = json.loads(clean_json)
                
                final_topics = list(set([t.capitalize() for t in res.get("topics", [])] + baseline_topics))
                sintesi = res.get("sintesi", "")
                
                print("  ✨ Gemini ha analizzato con successo il documento.")
                return res.get("classe"), final_topics, sintesi
            except Exception as e:
                print(f"  ⚠️ Errore o Timeout API Gemini (fallback su locale euristico in corso): {e}")
        
        # --- OFFLINE FALLBACK ENGINE ---
        # 1. Deduzione Classe dai pattern
        for classe, keywords in self.knowledge_base.items():
            for kw in keywords:
                if kw in text_lower:
                    found_class = classe
                    break
            if found_class: break
            
        # 2. Estrazione Keywords Ricorrenti (Frequenza)
        word_counts = {}
        for kw in self.keywords_dictionary:
            count = len(re.findall(kw, text_lower))
            if count > 0:
                # Ricostruzione della parola in leggibile
                true_word = next((w for w in SEMANTIC_MAP.values() if w.lower().startswith(kw)), kw.capitalize())
                if true_word not in new_topics:
                    new_topics.append(true_word)
                    
        # 3. Generazione di una sintesi organica basata sui contenuti trovati
        sintesi = ""
        if new_topics:
            sintesi = f"Punto focale sulle tematiche di: {', '.join(new_topics[:3])}."
            
        return found_class, list(set(new_topics)), sintesi

scanner = DeepContentScanner()

SEMANTIC_MAP = {
    "eq": "Equazioni",
    "diseq": "Disequazioni",
    "sincos": "Seno e Coseno",
    "gonio": "Goniometria",
    "trigo": "Trigonometria",
    "geom": "Geometria",
    "lab": "Laboratorio",
    "erroricomuni": "Evitare gli Errori Comuni",
    "tart": "Generatore di Tartaglia",
    "invaders": "Space Invaders",
    "mcd": "Massimo Comune Divisore",
    "mcm": "Minimo Comune Multiplo",
    "caos": "Teoria del Caos",
    "attrattori": "Attrattori",
    "frazionarie": "Frazionarie",
    "sistemi": "Sistemi",
    "decodifica": "Decodifica",
    "tattoo": "Tattoo Matematico",
    "delta": "Delta",
    "pip": "Picture in Picture",
    "math": "Matematica"
}

def semantic_title_generator(raw_filename):
    """ Interprete NLP per nomi file didattici. """
    base = os.path.splitext(raw_filename)[0].lower()
    
    # 1. Filtro clean-up spazzatura file name
    base = re.sub(r'(v\d+|bozza|final|copia|gemini|worksproperly)', '', base)
    
    # 2. Split separatori
    base = base.replace('_', ' ').replace('-', ' ').replace('.', ' ')
    
    # 3. Spaziatura camelCase residua e TestoNumero (erroricomuni02 -> erroricomuni 02)
    base = re.sub(r'([a-z])(\d+)', r'\1 \2', base)
    
    # 4. Traduzione
    translated = []
    for w in base.split():
        if w in SEMANTIC_MAP:
            translated.append(SEMANTIC_MAP[w])
        elif len(w) > 2 or w.isdigit():
            translated.append(w.capitalize())
            
    # 5. Formattazione moduli (es. 02 -> Parte 2)
    parts = []
    for w in translated:
        if w.isdigit():
            num = int(w)
            if num > 1900 and num < 2100:
                parts.append(str(num)) # È un anno
            elif num > 100:
                parts.append(str(num)) # Suffisso generico
            else:
                parts.append(f"(Parte {num})")
        else:
            parts.append(w)
            
    # Cleanup doppi spazi o stringa vuota
    out = " ".join(parts).strip()
    return out if out else "Strumento Espolrativo"

# --- KNOWLEDGE BASE RIFORMA 2017 (Integrazione Dinamica) ---
KEYWORD_TO_RIFORMA_ID = {
    # Matematica Generale
    "equazioni": "MAT_A3", "disequazioni": "MAT_A3", "sistemi": "MAT_A3",
    "algebra": "MAT_K1", "letterale": "MAT_K1", "polinomi": "MAT_K1", "scomposizione": "MAT_K1",
    "funzioni": "MAT_K2", "dominio": "MAT_A2", "grafico": "MAT_A2", "andamento": "MAT_K2",
    "geometria": "MAT_K3", "pitagora": "MAT_A4", "euclidea": "MAT_K3", "spaziale": "MAT_C4",
    "statistica": "MAT_K4", "probabilità": "MAT_K4", "dati": "MAT_C3", "interpretare": "MAT_C3",
    "logica": "MAT_C2", "problemi": "CIT_6", "situazioni": "MAT_C2",
    
    # Indirizzo Tecnico & Soft Skills
    "3d": "IND_C1", "openscad": "IND_C1", "parametr": "IND_C1", "modellazione": "IND_C1",
    "python": "IND_C2", "p5.js": "IND_C2", "algoritmo": "IND_C2", "computazionale": "IND_C2",
    "stampa": "IND_C3", "slicing": "IND_C3", "fabbricazione": "IND_C3",
    "dsa": "IND_C4", "adhd": "IND_C4", "accessibil": "IND_C4", "inclusiv": "IND_C4",
    "open source": "IND_K1", "arduino": "IND_K3", "raspberry": "IND_K3",
    "ai": "SOFT_3", "intelligenza": "SOFT_3", "metacognizion": "SOFT_2",
    
    # Competenze di Cittadinanza
    "civica": "CIT_6", "costituzione": "CIT_6", "comunicazione": "CIT_1", "imparare": "CIT_5", "digitale": "CIT_4"
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
    items = []
    print(f"🔄 Scansione '{CONTENT_DIR}' e altre cartelle in corso...")

    # Cartelle da scansionare
    target_dirs = [CONTENT_DIR, "rif_norm_2017"]

    for target_dir in target_dirs:
        if not os.path.exists(target_dir):
            print(f"⚠️ Cartella '{target_dir}' non trovata, salto.")
            continue
        
        # Scansione ricorsiva
        for root, dirs, files in os.walk(target_dir):
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
                        
                        # Strategia avanzata: Estrazione testo reale dal PDF e Immagini (Motore Euristico)
                        extracted_text = scanner.scan_file(file_path)

                        # --- PARSING AVANZATO FILENAME ---
                        # Generazione semantica dal nome del file grezzo per il fallback
                        semantic_filename = semantic_title_generator(filename)
                        
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

                        # Iniezione Deep Scanner se abbiamo estratto dei dati e non stiamo trattando un verifca pre-stampata
                        ai_class, ai_topics, ai_sintesi = scanner.analyze_content(extracted_text, topics)
                        
                        # Il Deep Scanner ha l'ultima parola sulla classificazione, unificandola alle keywords del file
                        if not found_class and ai_class:
                            found_class = ai_class
                        if ai_topics:
                            topics = ai_topics
                            
                        # Mappatura Competenze Riforma 2017 (Molto più ricca adesso grazie all'OCR)
                        riforma_tags = map_topics_to_riforma(topics)

                        # Titolo formattato
                        is_in_verifiche = "verifiche" in root.lower()
                        if found_class and is_in_verifiche:
                            clean_title = f"Verifica Classe {found_class}, {month} {year}"
                        else:
                            prefix = "Verifica " if is_in_verifiche else ""
                            clean_title = prefix + semantic_filename
                        
                        # Excerpt: Narrativo e professionale
                        parts = []
                        
                        if is_in_verifiche:
                            topic_str = ", ".join(topics) if topics else ""
                            if topic_str:
                                parts.append(f"Verifica sommativa strutturata su {topic_str}")
                            else:
                                parts.append(f"Verifica strutturata di {subject}")
                        else:
                            # Se non è una verifica, usa la vera sintesi estratta
                            if ai_sintesi:
                                parts.append(f"Laboratorio interattivo. {ai_sintesi}")
                            else:
                                parts.append(f"Materiale didattico esplorativo relativo a: {semantic_filename}.")
                            
                        if duration and is_in_verifiche: parts.append(f"Tempo a disposizione stimato: {duration.split(':')[-1].strip()}")
                        if calc_info and is_in_verifiche: parts.append(f"Nota: {calc_info.lower()}")
                        
                        # Unisci le parti con il punto e spazio
                        excerpt = ". ".join(parts).replace("..", ".") + "."
                        if not topics and is_in_verifiche:
                            excerpt = f"Sessione di verifica multimediale di {subject}."
                        
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

                        # Se abbiamo già i metadati dal sidecar JSON, usiamoli come base e integriamo
                        if meta:
                            if "title" in meta: clean_title = meta["title"]
                            if "excerpt" in meta: excerpt = meta["excerpt"]
                            if "tags" in meta: tags = list(set(tags + meta["tags"]))
                        
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
    
    # Iniezione SEO nell'index.html
    update_index_seo(db_main)
    
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

def update_index_seo(items):
    """ Inietta un catalogo testuale nascosto nell'index.html per favorire il crawling """
    try:
        index_path = "index.html"
        if not os.path.exists(index_path): return
        
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        catalog_html = ""
        for item in items:
            tags_str = ", ".join(item.get('tags', []))
            # Utilizzo di tag semantici article e microdati Schema.org
            catalog_html += f"""<article itemscope itemtype="https://schema.org/LearningResource">
                <h3 itemprop="name">{item['title']}</h3>
                <p itemprop="description">{item.get('excerpt', '')}</p>
                <meta itemprop="learningResourceType" content="InteractiveResource">
                <meta itemprop="keywords" content="{tags_str}">
            </article>\n"""
        
        print(f"  🔍 SEO Catalog: generati {len(items)} elementi")
            
        pattern = re.compile(r'<!-- SEO_CATALOG_START -->.*?<!-- SEO_CATALOG_END -->', re.DOTALL)
        # Escapiamo le backslash per evitare che re.sub le interpreti come sequenze di escape (es. \p in LaTeX)
        safe_catalog = catalog_html.replace('\\', '\\\\')
        new_content = pattern.sub(f'<!-- SEO_CATALOG_START -->\n{safe_catalog}        <!-- SEO_CATALOG_END -->', content)
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("  🔍 SEO Catalog aggiornato in index.html")
    except Exception as e:
        print(f"  ⚠️ Errore aggiornamento SEO in index.html: {e}")

if __name__ == "__main__":
    main()

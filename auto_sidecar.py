import os
import json
import re
import shutil
from datetime import datetime

# --- CONFIGURAZIONE ---
CONTENT_DIR = "content"

# Mappa cartelle -> Tag default
WATCH_DIRS = {
    "video":        ["Video", "Tutorial"],
    "audio":        ["Audio", "Podcast"],
    "documents":    ["Dispensa", "PDF"],
    "infografiche": ["Infografica", "Visual"],
    "images":       ["Immagine", "Gallery"],
    "links":        ["Link", "Risorsa"]
}

IGNORE_EXT = {".json", ".py", ".js", ".html", ".css", ".md", ".txt", ".ds_store", ".gitkeep"}

# Schema Semplificato (Pure Python validator per evitare dipendenze extra)
REQUIRED_FIELDS = {
    "title": str,
    "description": str,
    "date": str,
    "tags": list
}

OPTIONAL_FIELDS = {
    "url": str,
    "thumbnail": str,
    "icon": str,
    "author": str,
    "type": str
}

def sanitize_filename(filename):
    """
    Trasforma 'Il Mio File!.pdf' in 'il_mio_file.pdf'.
    """
    name, ext = os.path.splitext(filename)
    clean_name = name.lower().replace(" ", "_")
    clean_name = re.sub(r'[^a-z0-9_\-]', '', clean_name)
    clean_name = re.sub(r'_+', '_', clean_name)
    return f"{clean_name}{ext.lower()}"

def generate_meta(filename, clean_name):
    """ Crea i metadati basandosi sul nome originale """
    name_no_ext, _ = os.path.splitext(filename)
    parts = name_no_ext.replace("_", " ").split(" ")
    
    date_str = datetime.now().strftime('%Y-%m-%d')
    title_parts = []
    tags = []
    
    for part in parts:
        if re.match(r'^\d{4}-\d{2}-\d{2}$', part):
            date_str = part
        elif (part.isupper() and len(part) <= 4) or (any(c.isdigit() for c in part) and len(part) <= 3):
            tags.append(part)
        else:
            title_parts.append(part)
            
    title = " ".join(title_parts).title() if title_parts else clean_name
    
    return {
        "title": title,
        "description": f"Risorsa: {title}",
        "date": date_str,
        "tags": tags,
        "url": ""
    }

def validate_and_fix_data(data, filename):
    """
    Verifica lo schema, corregge i tipi e aggiunge campi mancanti.
    Ritorna (is_valid, fixed_data)
    """
    fixed = data.copy()
    modified = False
    messages = []

    # 1. Verifica Campi Obbligatori
    for field, expected_type in REQUIRED_FIELDS.items():
        if field not in fixed:
            messages.append(f"Mancante '{field}', aggiunto default.")
            if expected_type == list: fixed[field] = []
            elif expected_type == str: fixed[field] = "N/A"
            modified = True
        elif not isinstance(fixed[field], expected_type):
            messages.append(f"Tipo errato per '{field}', corretto.")
            # Casting forzato o reset
            if expected_type == list: fixed[field] = [str(fixed[field])]
            elif expected_type == str: fixed[field] = str(fixed[field])
            modified = True

    # 2. Verifica Formato Data (YYYY-MM-DD)
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', fixed["date"]):
        messages.append(f"Data '{fixed['date']}' non valida, reimpostata a oggi.")
        fixed["date"] = datetime.now().strftime('%Y-%m-%d')
        modified = True

    # 3. Pulizia Tags
    if "tags" in fixed:
        original_len = len(fixed["tags"])
        fixed["tags"] = sorted(list(set(str(t).strip() for t in fixed["tags"] if t)))
        if len(fixed["tags"]) != original_len:
            modified = True

    return modified, fixed, messages

def save_json(path, data):
    """ Salva JSON con formattazione standard e UTF-8 reale (no escape) """
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=False)

def process_directory(category, default_tags):
    dir_path = os.path.join(CONTENT_DIR, category)
    if not os.path.exists(dir_path): return 0

    changes = 0
    
    # 1. Scansione file per rinomina e creazione JSON mancanti
    file_list = os.listdir(dir_path)
    for filename in file_list:
        if filename.startswith(".") or filename.lower() in IGNORE_EXT: continue
        
        file_path = os.path.join(dir_path, filename)
        _, ext = os.path.splitext(filename)
        if os.path.isdir(file_path) or ext.lower() in IGNORE_EXT: continue

        # Rinomina (Sanitization)
        clean_name = sanitize_filename(filename)
        clean_path = os.path.join(dir_path, clean_name)
        if filename != clean_name:
            if not os.path.exists(clean_path):
                print(f"🧹 Rinomino: '{filename}' -> '{clean_name}'")
                os.rename(file_path, clean_path)
                filename = clean_name
                file_path = clean_path
                changes += 1
            else:
                print(f"⚠️ Skip rinomina '{filename}': destinazione esiste.")

        # Creazione JSON se manca
        json_path = os.path.splitext(file_path)[0] + ".json"
        if not os.path.exists(json_path):
            meta = generate_meta(filename, clean_name)
            meta["tags"].extend(default_tags)
            save_json(json_path, meta)
            print(f"✨ Creato sidecar: {os.path.basename(json_path)}")
            changes += 1

    # 2. Validazione e Formattazione di TUTTI i JSON (esistenti e nuovi)
    # Rileggiamo la directory per prendere anche i nuovi
    for filename in os.listdir(dir_path):
        if not filename.endswith(".json"): continue
        
        json_path = os.path.join(dir_path, filename)
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            modified, fixed_data, msgs = validate_and_fix_data(data, filename)
            
            # Controllo Formattazione (leggo file raw per vedere se è indentato/utf8)
            with open(json_path, 'r', encoding='utf-8') as f:
                raw_content = f.read()
            
            # Simuliamo il dump per vedere se il contenuto binario cambierebbe
            dummy_str = json.dumps(fixed_data, indent=2, sort_keys=True, ensure_ascii=False)
            
            needs_save = modified or (dummy_str.strip() != raw_content.strip())

            if needs_save:
                save_json(json_path, fixed_data)
                if modified:
                    print(f"🔧 Corretto {filename}: {', '.join(msgs)}")
                else:
                    print(f"🎨 Riformattato {filename} (Indentazione/UTF-8)")
                changes += 1
                
        except json.JSONDecodeError:
            print(f"❌ JSON Corrotto: {filename}. Rigenerazione forzata.")
            # Tentativo di recupero dal nome file del media associato (se esiste)
            base_media = os.path.splitext(filename)[0] # senza .json
            # Cerca un file con quel nome base
            media_found = False
            for m in os.listdir(dir_path):
                if m.startswith(base_media) and not m.endswith(".json"):
                    meta = generate_meta(m, base_media)
                    meta["tags"].extend(default_tags)
                    save_json(json_path, meta)
                    print(f"   ↳ Rigenerato da {m}")
                    media_found = True
                    changes += 1
                    break
            if not media_found:
                print(f"   ↳ ☠️ Impossibile recuperare, file orfano.")

    return changes

def main():
    print("🔍 [Auto-Sidecar v2] Validazione Schema & UTF-8...")
    total_changes = 0
    for cat, tags in WATCH_DIRS.items():
        total_changes += process_directory(cat, tags)
    
    if total_changes == 0:
        print("✅ Tutti i file sono validi e conformi.")
    else:
        print(f"🚀 Applicate {total_changes} ottimizzazioni.")

if __name__ == "__main__":
    main()
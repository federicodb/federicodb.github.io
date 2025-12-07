import os
import json
import re
from datetime import datetime
import html

# --- CONFIGURAZIONE ---
LESSONS_DIR = "lezioni"
DB_FILE = "database.js"
OUTPUT_VAR_NAME = "db"

def extract_meta(file_path):
    """
    Legge un file HTML e ne estrae i metadati per il database.
    Cerca tags tipo: <meta name="keywords" content="...">
    """
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 1. Titolo (<title>)
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    title = html.unescape(title_match.group(1)) if title_match else os.path.basename(file_path)
    # Rimuove eventuali suffissi come "- Pure Black" o emoji se vuoi pulire
    title = title.split("-")[0].strip() 
    
    # 2. Descrizione (<meta name="description">)
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    description = html.unescape(desc_match.group(1)) if desc_match else "Attività di laboratorio interattiva."
    
    # 3. Tags/Keywords (<meta name="keywords">)
    tags_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    tags_str = tags_match.group(1) if tags_match else ""
    tags = [t.strip() for t in tags_str.split(',') if t.strip()]
    
    # 4. Data (<meta name="date">) o Ultima Modifica file
    date_match = re.search(r'<meta\s+name=["\']date["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    if date_match:
        date_str = date_match.group(1)
    else:
        # Se manca il meta data, usa la data di modifica del file
        timestamp = os.path.getmtime(file_path)
        date_str = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')

    # 5. Icona (Dedotta dai tag se non specificata)
    icon = "📄"
    if "Gioco" in tags or "Memory" in tags or "Game" in tags: icon = "🧩"
    elif "Matematica" in tags or "Algebra" in tags: icon = "📐"
    elif "Fisica" in tags or "Lab" in tags: icon = "🧪"
    elif "Civica" in tags or "Voto" in tags: icon = "⚖️"

    return {
        "title": title,
        "excerpt": description,
        "tags": tags,
        "url": f"{LESSONS_DIR}/{os.path.basename(file_path)}",
        "date": date_str,
        "icon": icon
    }

def main():
    if not os.path.exists(LESSONS_DIR):
        print(f"❌ Errore: Cartella '{LESSONS_DIR}' non trovata.")
        return

    lessons = []
    print(f"🔄 Scansione cartella '{LESSONS_DIR}' in corso...")

    files = [f for f in os.listdir(LESSONS_DIR) if f.endswith(".html")]
    
    for filename in files:
        file_path = os.path.join(LESSONS_DIR, filename)
        try:
            data = extract_meta(file_path)
            lessons.append(data)
            print(f"  ✅ Indicizzato: {data['title']} ({data['date']})")
        except Exception as e:
            print(f"  ⚠️ Errore su {filename}: {e}")

    # Ordina per data (dal più recente)
    lessons.sort(key=lambda x: x['date'], reverse=True)

    # Scrive il file JS
    js_content = f"/* \n   ⚠️ GENERATO AUTOMATICAMENTE DA build.py \n   Non modificare manualmente. Aggiorna i <meta> nei file HTML.\n*/\n\nconst {OUTPUT_VAR_NAME} = " + json.dumps(lessons, indent=4, ensure_ascii=False) + ";"
    
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"\n✨ Successo! {len(lessons)} lezioni salvate in '{DB_FILE}'.")

if __name__ == "__main__":
    main()

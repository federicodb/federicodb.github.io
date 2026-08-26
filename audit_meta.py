import os
import re
import json

APPS_DIR = "content/apps"

def audit_html_apps():
    print("=== 🔍 AUDIT APPS HTML (content/apps) ===")
    if not os.path.exists(APPS_DIR):
        print("❌ Directory content/apps non trovata.")
        return

    files = sorted([f for f in os.listdir(APPS_DIR) if f.endswith(".html") and not f.startswith(".")])
    issue_count = 0

    for filename in files:
        filepath = os.path.join(APPS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        issues = []

        # 1. Title
        title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
        if not title_match or not title_match.group(1).strip():
            issues.append("Tag <title> mancante o vuoto")

        # 2. Description
        desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=(["\'])(.*?)\1', content, re.IGNORECASE | re.DOTALL)
        if not desc_match or len(desc_match.group(2).strip()) < 10:
            issues.append("Meta description mancante o troppo breve (< 10 char)")

        # 3. Keywords / Tags
        kw_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=(["\'])(.*?)\1', content, re.IGNORECASE | re.DOTALL)
        if not kw_match:
            issues.append("Meta keywords mancante")
        else:
            kws = [k.strip() for k in kw_match.group(2).split(',') if k.strip()]
            if len(kws) < 2:
                issues.append(f"Meta keywords scarse ({len(kws)} keyword)")

        # 4. Orfini Design System Shared Assets
        if "orfini-shared.js" not in content:
            issues.append("Manca script orfini-shared.js")
        if "orfini-shared.css" not in content:
            issues.append("Manca stylesheet orfini-shared.css")

        # 5. Viewport
        if "viewport" not in content.lower():
            issues.append("Manca meta viewport")

        if issues:
            issue_count += 1
            print(f"❌ {filename}:")
            for iss in issues:
                print(f"   - {iss}")

    if issue_count == 0:
        print(f"✅ Tutte le {len(files)} Single Page App HTML sono conformi.")

def extract_json_from_js(filepath, var_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()
    c = re.sub(r'/\*.*?\*/', '', c, flags=re.DOTALL).strip()
    match = re.search(rf'const\s+{var_name}\s*=\s*(.*);', c, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())
    raise ValueError(f"Impossibile trovare {var_name} in {filepath}")

def audit_database():
    print("\n=== 🔍 AUDIT DATABASE GENERATI ===")
    
    db_file = "database.js"
    db_verifiche_file = "database_verifiche.js"
    
    if os.path.exists(db_file):
        try:
            db_data = extract_json_from_js(db_file, "db")
            print(f"📊 Main Database (database.js): {len(db_data)} elementi indicizzati")
            
            missing_files = []
            stemmed_tags = []
            
            for item in db_data:
                url = item.get("url", "")
                if not url.startswith("http") and not os.path.exists(url):
                    missing_files.append((item.get("title"), url))
                
                tags = item.get("tags", [])
                for t in tags:
                    if t.isupper() and t in ["FUNZION", "INSIEM", "POLINOM", "SCOMPOSIZION", "ELETTRIC", "DISEQ", "EQUAZION", "FRIZION"]:
                        stemmed_tags.append((item.get("title"), t))

            if missing_files:
                print(f"⚠️ {len(missing_files)} file non trovati su disco:")
                for t, u in missing_files: print(f"   - {t}: {u}")
            else:
                print("✅ Tutti gli URL ed elementi in database.js puntano a risorse valide.")

            if stemmed_tags:
                print(f"⚠️ Tag troncati trovati nel database:")
                for t_name, tag in stemmed_tags:
                    print(f"   - {t_name} -> {tag}")
            else:
                print("✅ Nessun tag troncato trovato nel database.")

        except Exception as e:
            print(f"❌ Errore durante l'audit di database.js: {e}")

    if os.path.exists(db_verifiche_file):
        try:
            db_v_data = extract_json_from_js(db_verifiche_file, "db_verifiche")
            print(f"📊 Verifiche Database (database_verifiche.js): {len(db_v_data)} gruppi indicizzati")
            missing_v = []
            for group in db_v_data:
                for v in group.get("versions", []):
                    if not os.path.exists(v.get("url", "")):
                        missing_v.append(v.get("url"))
            if missing_v:
                print(f"⚠️ {len(missing_v)} file di verifiche mancanti su disco:")
                for u in missing_v: print(f"   - {u}")
            else:
                print("✅ Tutti i file in database_verifiche.js esistono su disco.")
        except Exception as e:
            print(f"❌ Errore durante l'audit di database_verifiche.js: {e}")

if __name__ == "__main__":
    audit_html_apps()
    audit_database()

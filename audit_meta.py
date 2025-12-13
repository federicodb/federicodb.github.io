import os
import re

APPS_DIR = "content/apps"

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    issues = []
    
    # Check Description
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not desc_match or len(desc_match.group(1)) < 10:
        issues.append("Descrizione mancante o troppo breve")
        
    # Check Keywords
    kw_match = re.search(r'<meta\s+name=["\']keywords["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not kw_match or len(kw_match.group(1).split(',')) < 2:
        issues.append("Keywords scarse (< 2)")
        
    # Check Back Button (Standardization check)
    if "orfini-shared.js" not in content:
        issues.append("Manca orfini-shared.js (No Back Button?)")

    if issues:
        print(f"❌ {os.path.basename(filepath)}:")
        for i in issues: print(f"   - {i}")

def main():
    if not os.path.exists(APPS_DIR): return
    files = [f for f in os.listdir(APPS_DIR) if f.endswith(".html")]
    for f in files:
        check_file(os.path.join(APPS_DIR, f))

if __name__ == "__main__":
    main()

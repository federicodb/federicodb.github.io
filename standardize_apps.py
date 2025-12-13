import os
import re

APPS_DIR = "content/apps"
SHARED_ASSETS_REL_PATH = "../assets" # Percorso relativo da content/apps

# Blocchi da iniettare
SHARED_HEAD = f"""
    <!-- Shared Orfini Design System -->
    <link rel="stylesheet" href="{SHARED_ASSETS_REL_PATH}/style/orfini-shared.css">
    <script src="{SHARED_ASSETS_REL_PATH}/js/orfini-shared.js"></script>
"""

TAILWIND_CONFIG = """
    <!-- Configurazione Tailwind con Colori Semantici -->
    <script>
        tailwind.config = {
            darkMode: ["class", "[data-theme=\"dark\"]"],
            theme: {
                extend: {
                    colors: {
                        background: 'var(--md-sys-color-background)',
                        'on-background': 'var(--md-sys-color-on-background)',
                        surface: 'var(--md-sys-color-surface)',
                        'surface-container': 'var(--md-sys-color-surface-container)',
                        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
                        'outline-variant': 'var(--md-sys-color-outline-variant)',
                        primary: 'var(--md-sys-color-primary)',
                        'on-primary': 'var(--md-sys-color-on-primary)',
                    }
                }
            }
        }
    </script>
"""

def standardize_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Check se già aggiornato
    if "orfini-shared.css" in content:
        print(f"⏭️  Saltato (già standardizzato): {os.path.basename(file_path)}")
        return

    print(f"🔧 Standardizzazione: {os.path.basename(file_path)}")

    # 2. Iniezione Asset Condivisi (dopo <title> o prima di </head>)
    if "<title>" in content:
        content = re.sub(r'(</title>)', r'\1' + SHARED_HEAD, content, count=1)
    else:
        content = content.replace("</head>", SHARED_HEAD + "\n</head>")

    # 3. Iniezione Tailwind Config (se usa Tailwind ma non ha config avanzata)
    if "cdn.tailwindcss.com" in content and "tailwind.config" not in content:
        content = content.replace("</head>", TAILWIND_CONFIG + "\n</head>")

    # 4. Rimozione Stili Hardcoded dannosi
    # Rimuove body { background-color: ... }
    content = re.sub(r'body\s*\{[^}]*background-color:\s*#[0-9a-fA-F]+;[^}]*\}', 'body { margin: 0; padding: 0; }', content)
    content = re.sub(r'html,\s*body\s*\{[^}]*background-color:\s*#[0-9a-fA-F]+;[^}]*\}', 'html, body { margin: 0; padding: 0; width: 100%; height: 100%; }', content)

    # 5. Sostituzioni CSS Tailwind di base (Best Effort)
    # Sostituisce bg-black/bg-slate-50 con variabili semantiche
    replacements = {
        'bg-black': 'bg-background',
        'bg-white': 'bg-surface',
        'text-white': 'text-on-background',
        'text-black': 'text-on-background',
        'bg-slate-50': 'bg-background',
        'bg-neutral-900': 'bg-surface',
        'border-neutral-800': 'border-outline-variant',
        'text-neutral-200': 'text-on-surface-variant'
    }
    
    for old, new in replacements.items():
        content = content.replace(f'"' + old + '"', f'"' + new + '"') # Solo se classe esatta
        content = content.replace(f' ' + old + ' ', f' ' + new + ' ')
        content = content.replace(f'"' + old + ' ', f'"' + new + ' ')
        content = content.replace(f' ' + old + '"', f' ' + new + '"')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    if not os.path.exists(APPS_DIR):
        print("Errore: Directory non trovata.")
        return

    files = [f for f in os.listdir(APPS_DIR) if f.endswith(".html")]
    for f in files:
        standardize_file(os.path.join(APPS_DIR, f))

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
tools/standardize_apps.py
Analizza le app in content/apps/ e integra in modo idempotente e non invasivo
il pulsante di ritorno "← Orfini Math Lab" verso ../../index.html.
"""

import os
import re
import sys
import glob

APPS_DIR = os.path.join(os.path.dirname(__file__), "..", "content", "apps")

# Regole di posizionamento personalizzate per ciascuna app in base all'analisi del layout
CUSTOM_RULES = {
    # Integrazioni in header / nav esistenti
    "corrente_4el_sincos.html": {
        "pos": "header-left",
        "reason": "Header flex orizzontale esistente (justify-between), inserimento all'inizio a sinistra prima del titolo."
    },
    "disequazioni_frazionarie_vs_sistemi.html": {
        "pos": "header-left",
        "reason": "Header esistente, inserimento nel flusso di intestazione."
    },
    "eq_2_gr_teoria_giochi_01.html": {
        "pos": "nav-left",
        "reason": "Nav bar fissa in alto esistente (glass-panel), inserimento come primo elemento a sinistra."
    },
    "fibonacci_anim.html": {
        "pos": "header-left",
        "reason": "Header superiore flex esistente, inserimento prima del titolo su sfondo scuro."
    },
    "insiemi004.html": {
        "pos": "header-left",
        "reason": "Header orizzontale flex esistente, inserimento all'inizio a sinistra."
    },
    "le_fasi_della_luna.html": {
        "pos": "header-left",
        "reason": "Header classe 'top' esistente, inserimento integrato a sinistra."
    },
    "mercatore_correzione_001_gemini_worksproperly.html": {
        "pos": "header-left",
        "reason": "Header flex (justify-between) esistente, inserimento a sinistra del titolo."
    },
    "operazioni_polinomi_graph.html": {
        "pos": "header-left",
        "reason": "Pannello header 'control-panel' esistente, inserimento come primo pulsante a sinistra."
    },
    "parabola e disequazioni di secondo grado maggio 2026.html": {
        "pos": "header-left",
        "reason": "Header mb-4 esistente, inserimento prima del blocco titolo."
    },
    "polinomi_challenge_v2_pro.html": {
        "pos": "header-left",
        "reason": "Header m3-top-bar esistente, inserimento prima della scritta ORFINI MATH LAB."
    },
    "retta_fallout_002.html": {
        "pos": "header-left",
        "reason": "Header vector-panel fallout esistente, inserimento a sinistra prima dell'identificativo agente."
    },
    "voto_cosapevole.2.5.html": {
        "pos": "nav-left",
        "reason": "Nav bar glass-panel sticky top-0 esistente, inserimento come primo elemento a sinistra."
    },
    "math_underground003_4el.html": {
        "pos": "nav-left",
        "reason": "Nav bar absolute top-0 esistente, inserimento nel contenitore flex sinistro con pointer-events:auto."
    },

    # App con link già integrato nativamente
    "functions_lab_008.html": {
        "pos": "already-present",
        "reason": "Link '← Orfini' verso ../../index.html già presente nativamente nella navbar React (funclab_app.js)."
    },

    # Posizionamento floating top-right (perché a sinistra ci sono pannelli o controlli vitali)
    "random_walk.html": {
        "pos": "fixed-top-right",
        "reason": "In alto a sinistra c'è l'HUD delle statistiche 3D (stats fixed top-6 left-6). Angolo destro totalmente libero."
    },
    "scomp_3d_grafica_002.html": {
        "pos": "fixed-top-right",
        "reason": "A sinistra c'è il cassetto laterale retrattile 3D (w-96). Angolo superiore destro della viewport 3D libero."
    },
    "soglie_particelle_automa_cellulare.html": {
        "pos": "fixed-top-right",
        "reason": "In alto a sinistra c'è il box HUD parametri (sg-hud top:12px left:14px). Angolo destro completamente libero."
    },
    "pen_plotter__23v2_8K.html": {
        "pos": "fixed-top-right",
        "reason": "In alto a sinistra nell'area canvas ci sono i controlli zoom (+/- 100%). Angolo destro pulito."
    },
    "scale_logaritmiche.html": {
        "pos": "fixed-top-right",
        "reason": "In alto a sinistra c'è il badge chartStateLabel (top-4 left-6). Angolo in alto a destra libero."
    },
    "esaustione_01.html": {
        "pos": "fixed-top-right",
        "reason": "Il pannello comandi laterale è a sinistra (w-80) e il toggle FAB in basso a destra. In alto a destra è sgombro."
    },

    # Posizionamento floating top-left (canvas 3D e card game con sinistra libera)
    "MCD_mcm_1el_001.html": {
        "pos": "fixed-top-left",
        "reason": "In alto a destra ci sono score e vite arcade (top-4 right-4); in alto a sinistra lo spazio è completamente libero."
    },
    "math_pool_retta_pianocartesiano.html": {
        "pos": "fixed-top-left",
        "reason": "I controlli di gioco sono posizionati a destra (top-4 right-4); in alto a sinistra lo spazio è libero."
    },
    "disequazioni grafiche 4el.html": {
        "pos": "fixed-top-left",
        "reason": "In alto a destra c'è il badge di stato (top-2 right-2); in alto a sinistra libero."
    },
    "pi_is_irrational.html": {
        "pos": "fixed-top-left",
        "reason": "Il pannello di configurazione parametri (#ui-layer) è posizionato a destra (top:20px right:20px). Sinistra libera."
    },
    "sqrt2_is_irrational.html": {
        "pos": "fixed-top-left",
        "reason": "Pannello parametri (#ui-layer) a destra (top:20px right:20px). Angolo superiore sinistro libero."
    },
    "phi_is_irrational_01.html": {
        "pos": "fixed-top-left",
        "reason": "Pannello parametri (#ui-layer) a destra. Angolo superiore sinistro libero."
    },
    "attrattori_001_dec25.html": {
        "pos": "fixed-top-left",
        "reason": "Pannello lil-gui parametri 3D posizionato in alto a destra. Angolo superiore sinistro libero."
    },
    "albero_pitagorico_3d_gemini_001.html": {
        "pos": "fixed-top-left",
        "reason": "Canvas 3D a tutto schermo con controlli in basso; angolo superiore sinistro pulito."
    },
    "card_frazioni_algebriche_005.html": {
        "pos": "fixed-top-left",
        "reason": "App React con carte centrate; pulsante discreto pill in alto a sinistra sopra il container."
    },
    "cards_polinomi_memory004.html": {
        "pos": "fixed-top-left",
        "reason": "Memory card centrato; pulsante discreto pill in alto a sinistra."
    },
    "fractions_lab_001.html": {
        "pos": "fixed-top-left",
        "reason": "Laboratorio frazioni centrato; pulsante in alto a sinistra."
    },
    "gioco_sin_cos_01.html": {
        "pos": "fixed-top-left",
        "reason": "GonioMatch cards centrate; pulsante pill in alto a sinistra."
    },
    "lissajous_curves_01.html": {
        "pos": "fixed-top-left",
        "reason": "Canvas 3D con controlli collassati; angolo in alto a sinistra libero."
    },
    "memory_1el_numeri_004.html": {
        "pos": "fixed-top-left",
        "reason": "Interfaccia memory a griglia; angolo in alto a sinistra libero."
    },
    "percentuali_001.html": {
        "pos": "fixed-top-left",
        "reason": "App React percentuali; angolo in alto a sinistra ideale."
    },
    "sketch_to_pattern_gemini_005.html": {
        "pos": "fixed-top-left",
        "reason": "Canvas pattern con controlli centrali; angolo superiore sinistro libero."
    },
    "tavola_tart_canva0003.html": {
        "pos": "fixed-top-left",
        "reason": "Tavola pitagorica / Tartaglia centrata; angolo in alto a sinistra libero."
    },
    "visualizzatore polinomi 2d 3d 001.html": {
        "pos": "fixed-top-left",
        "reason": "Controlli 3D sul pannello laterale/inferiore; angolo superiore sinistro libero."
    }
}

TEMPLATE = """<!-- ORFINI-BACK START -->
<style>
.orfini-back-btn {{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0 !important;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 9999px;
  padding: 6px 14px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;
  cursor: pointer;
  pointer-events: auto;
  line-height: 1.2;
}}
.orfini-back-btn:hover {{
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}}
.orfini-back-btn-fixed-left {{
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 10000;
}}
.orfini-back-btn-fixed-right {{
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
}}
.orfini-back-btn-header {{
  margin-right: 12px;
  flex-shrink: 0;
}}
.orfini-back-arrow {{
  font-size: 14px;
  line-height: 1;
}}
:fullscreen .orfini-back-btn, 
:-webkit-full-screen .orfini-back-btn,
:fullscreen-ancestor .orfini-back-btn {{
  display: none !important;
}}
@media (max-width: 640px) {{
  .orfini-back-btn .orfini-back-text {{
    display: none;
  }}
  .orfini-back-btn {{
    padding: 6px 10px;
  }}
}}
</style>
<a href="../../index.html" class="orfini-back-btn {extra_class}" title="Torna a Orfini Math Lab" aria-label="Torna a Orfini Math Lab">
  <span class="orfini-back-arrow">←</span>
  <span class="orfini-back-text">Orfini Math Lab</span>
</a>
<!-- ORFINI-BACK END -->"""

def generate_block(pos_type):
    if pos_type == "fixed-top-left":
        cls = "orfini-back-btn-fixed-left"
    elif pos_type == "fixed-top-right":
        cls = "orfini-back-btn-fixed-right"
    elif pos_type in ("header-left", "nav-left"):
        cls = "orfini-back-btn-header"
    else:
        cls = ""
    return TEMPLATE.format(extra_class=cls)

def remove_existing_marker(content):
    pattern = re.compile(r"<!-- ORFINI-BACK START -->.*?<!-- ORFINI-BACK END -->\s*", re.DOTALL)
    return pattern.sub("", content)

def apply_button(filepath, pos_type):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    # 1. Pulizia blocco esistente se presente (per garantire idempotenza assoluta)
    clean_content = remove_existing_marker(content)
    
    if pos_type == "already-present":
        # Non modifichiamo nulla
        return False, "Nessuna modifica necessaria (link nativo già presente)"
    
    block = generate_block(pos_type)
    
    # 2. Inserimento in base alla posizione scelta
    new_content = None
    if pos_type == "header-left":
        # Inserisci come primo figlio di <header...>
        m = re.search(r"(<header\b[^>]*>)", clean_content, re.IGNORECASE)
        if m:
            idx = m.end()
            new_content = clean_content[:idx] + "\n" + block + "\n" + clean_content[idx:]
        else:
            # Fallback a body
            m = re.search(r"(<body\b[^>]*>)", clean_content, re.IGNORECASE)
            if m:
                idx = m.end()
                new_content = clean_content[:idx] + "\n" + generate_block("fixed-top-left") + "\n" + clean_content[idx:]
    elif pos_type == "nav-left":
        # Inserisci come primo figlio di <nav...>
        m = re.search(r"(<nav\b[^>]*>)", clean_content, re.IGNORECASE)
        if m:
            idx = m.end()
            new_content = clean_content[:idx] + "\n" + block + "\n" + clean_content[idx:]
        else:
            m = re.search(r"(<body\b[^>]*>)", clean_content, re.IGNORECASE)
            if m:
                idx = m.end()
                new_content = clean_content[:idx] + "\n" + generate_block("fixed-top-left") + "\n" + clean_content[idx:]
    else: # fixed-top-left o fixed-top-right
        # Inserisci subito dopo <body...>
        m = re.search(r"(<body\b[^>]*>)", clean_content, re.IGNORECASE)
        if m:
            idx = m.end()
            new_content = clean_content[:idx] + "\n" + block + "\n" + clean_content[idx:]
        else:
            # Fallback in cima al file se body assente
            new_content = block + "\n" + clean_content
            
    if new_content and new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True, "Pulsante inserito con successo"
    return False, "Nessun cambiamento apportato"

def main():
    apply_mode = "--apply" in sys.argv
    files = sorted(glob.glob(os.path.join(APPS_DIR, "*.html")))
    print(f"Modalità: {'APPLICA MODIFICHE' if apply_mode else 'DRY RUN'}")
    print(f"Totale app analizzate: {len(files)}\n")
    
    modified_count = 0
    for f in files:
        fname = os.path.basename(f)
        rule = CUSTOM_RULES.get(fname, {"pos": "fixed-top-left", "reason": "Default"})
        pos = rule["pos"]
        
        if apply_mode:
            changed, msg = apply_button(f, pos)
            if changed:
                modified_count += 1
                print(f"[OK] {fname} -> {pos} ({msg})")
            else:
                print(f"[SKIP] {fname} -> {msg}")
        else:
            print(f"[DRY-RUN] {fname} -> {pos} | Motivo: {rule['reason']}")
            
    if apply_mode:
        print(f"\nOperazione completata. File modificati: {modified_count}/{len(files)}")

if __name__ == "__main__":
    main()

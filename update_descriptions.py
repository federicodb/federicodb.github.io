import os
import re

descriptions = {
    "albero_pitagorico_3d_gemini_001.html": "Simulazione WebGL dell'Albero di Pitagora in 3D. Un'esplorazione visiva dei frattali e delle relazioni geometriche tra i quadrati.",
    "cardiode001.html": "Laboratorio interattivo per la generazione e manipolazione parametrica della curva Cardioide e di altre roulette matematiche.",
    "corrente_4el_sincos.html": "Simulatore interattivo del comportamento in Corrente Alternata (Sfasamento, Valori Efficaci, Potenza) per il corso di macchine elettriche.",
    "disequazioni_grafiche_4el.html": "Risolutore ed esploratore grafico per lo studio del segno delle funzioni razionali e l'individuazione di intervalli di positività.",
    "eq_2_gr_teoria_giochi_01.html": "Applicazione di Game Theory all'analisi delle radici nelle equazioni di secondo grado, esplorando l'ottimizzazione e le strategie dominanti.",
    "gioco_sin_cos_01.html": "Arcade educativo per allenare il riconoscimento immediato dei valori trigonometrici (Seno, Coseno) sulla circonferenza goniometrica.",
    "math_underground003_4el.html": "Mappa interattiva della metropolitana per lo studio teorico delle funzioni analitiche e delle loro principali proprietà (Dominio, Codominio).",
    "MCD_mcm_1el_001.html": "Laboratorio procedurale per il calcolo del Massimo Comune Divisore e Minimo Comune Multiplo tramite scomposizione in fattori primi.",
    "mercatore_correzione_001_gemini_worksproperly.html": "Modello interattivo in D3.js per esplorare le distorsioni della proiezione di Mercatore confrontando le aree reali dei paesi.",
    "operazioni_polinomi_graph.html": "Esploratore grafico per polinomi che permette di visualizzare l'effetto delle operazioni (Addizione, Sottrazione) sulle funzioni risultanti."
}

base_dir = "content/apps"
for filename, desc in descriptions.items():
    path = os.path.join(base_dir, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check if description exists
        if re.search(r'<meta\s+name=["\']description["\']', content):
            content = re.sub(r'<meta\s+name=["\']description["\']\s+content=(["\'])(.*?)\1.*?>', f'<meta name="description" content="{desc}">', content)
        else:
            content = content.replace("</title>", f'</title>\n    <meta name="description" content="{desc}">')
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {filename}")

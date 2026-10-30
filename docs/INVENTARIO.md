# Inventario di Orfini Math Lab

Stato al 2026-10-30, ramo `riorganizzazione` (commit `4c42990`). Documento in sola lettura: descrive il sito com'è, non cambia nulla.

## Come è stato compilato

- **Titolo, formato, classi, date, competenze MAT** vengono da `database.js`, che `build.py` genera dai meta delle pagine e dai sidecar JSON. Le classi sono i tag tipo `1 EL`, `3 MEC`; "MAT_K/A/C" sono i codici di conoscenze/abilità/competenze della Riforma 2017.
- **Argomento matematico** è ricavato da titolo, tag e contenuto. Dove non è certo è segnato [DA VERIFICARE].
- **Dipendenze** sono lette dai `<script>`/`<link>` di ogni file e dai caricamenti dinamici trovati nel codice.
- **Stato** viene da due passaggi automatici in Chromium: desktop 1366×768 e iPhone 13 (390×844, touch). Ogni pagina è stata aperta, si sono attesi 2,5 s e si sono registrati errori JS, risorse fallite e scorrimento orizzontale. "Si carica senza errori" **non** significa che ogni interazione sia stata provata: il gioco vero e proprio non è stato giocato. Le sole app con test funzionali sono Math Bubble, il Pen Plotter e la Quest.
- **Data** è quella di `database.js`. 11 app hanno la stessa data, 2025-12-08: probabilmente è la data di un caricamento in blocco, non quella di creazione [DA VERIFICARE].

## Numeri in sintesi

- **55 schede nel catalogo** della home: 42 app HTML, 2 video, 3 infografiche, 1 immagine, 2 link esterni, 5 documenti normativi.
- **10 spiegazioni animate** (`*_spiegazione.html`), fuori catalogo: si aprono dal pulsante "Spiegami" dell'app madre (iframe).
- **Pagine del sito**: 9 (home, Quest, Calcolo veloce, Archivio verifiche, Mappa 3D, Competenze, La Scuola, Privacy, 404).
- **Orfini Math Quest** (`/allenamento/`): app a sé, 56 attività in 11 aree, dalla prima alla quinta.
- **Archivio verifiche**: 18 verifiche (32 PDF) per 1EL, 2EL, 2GP, 3MEC, 4EL.
- **Normativa**: 5 PDF in `rif_norm_2017/`, più la mappatura `riforma2017.json`.

## Pagine del sito

| File | Titolo | Ruolo | Dipendenze | Stato |
|---|---|---|---|---|
| `404.html` | 404 - Funzione Non Definita / Orfini Lab | Pagina di errore | nessuna | si carica senza errori |
| `allenamento/index.html` | Orfini Math Quest | Orfini Math Quest (SPA, voce "Allenati") | Google Fonts, katex@0.16.9 | si carica senza errori |
| `calcolo-mentale.html` | Calcolo veloce: tecniche di calcolo mentale e perché funzionano / Orfini Math Lab | Tecniche di calcolo mentale (voce "Calcolo veloce") | Google Fonts, katex@0.16.9 | si carica senza errori |
| `competenze.html` | Decodifica Competenze Riforma 2017 / Orfini Lab | Decodifica competenze Riforma 2017 (voce "Competenze") | Google Fonts, katex@0.16.9, marked@15.0.12 | si carica senza errori |
| `galaxy.html` | Esplora Orfini Math Lab - Galaxy View | Mappa 3D del catalogo (voce "Mappa") | Google Fonts, katex@0.16.9, marked@15.0.12, three@0.160.0 | si carica senza errori |
| `index.html` | Orfini Math Lab / Innovazione Didattica e Gamification | Home e catalogo filtrabile (voce "Journal") | Google Fonts, katex@0.16.9, marked@15.0.12 | si carica senza errori |
| `privacy-policy.html` | Informativa sulla Privacy & Cookie Policy - Laboratorio Matematico Orfini | Privacy e cookie policy | nessuna | si carica senza errori |
| `scuola.html` | La Scuola: IPIA "E. Orfini" Foligno / Orfini Math Lab | Presentazione dell'istituto (voce "La Scuola") | Google Fonts | si carica senza errori |
| `verifiche.html` | Archivio Verifiche / Orfini Math Lab | Archivio verifiche (voce "Archivio") | Google Fonts, katex@0.16.9, marked@15.0.12 | si carica senza errori |

La voce di menu "Video" non è una pagina: applica il filtro "video" alla home. "Chi Sono" è un'ancora (`#about`) che apre un pannello della home.

## Attività interattive (catalogo)

| File | Titolo nel catalogo | Argomento | Classi (tag) | Formato | Dispositivi | Dipendenze | Servizi esterni / AI | Data | Stato |
|---|---|---|---|---|---|---|---|---|---|
| `albero_pitagorico_3d_gemini_001.html` | Albero di Pitagora: Frattali 3D | Geometria: teorema di Pitagora, frattali | 1EL, 2EL, 2GP, 3MEC | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, katex@0.16.9, three@0.165.0 | — | 2025-12-08 | si carica senza errori |
| `arcade_challenge_scomposizioni_parabola.html` | Arcade Challenge: Scomposizioni & Parabola | Algebra: scomposizioni; parabola | 1EL, 1GP, 1MA, 2EL, 2GP, 2MA | Gioco arcade | PC/LIM, telefono (layout ok) | Google Fonts, chart.js@4.4.1, three@0.160.0 | — | 2026-10-16 | si carica senza errori |
| `arcade_challenge_unita_di_misura.html` | Arcade Challenge: Unità di misura | Misura: unità ed equivalenze | 1EL, 1GP, 1MA | Gioco arcade | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts | — | 2026-10-26 | si carica senza errori |
| `attrattori_001_dec25.html` | Chaos Lab: Sistemi Dinamici | Sistemi dinamici e caos | 2EL, 2GP, 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, mathjax@3, three@0.160.0 | — | 2025-10-24 | si carica senza errori |
| `card_frazioni_algebriche_005.html` | C.E. Match | Algebra: frazioni algebriche, condizioni di esistenza | 1EL, 2EL, 2GP | Memory | PC/LIM, telefono (layout ok) | React/Babel (unpkg) ⚠️senza versione esatta, Tailwind CDN ⚠️senza versione, katex@0.16.9 | — | 2026-04-24 | si carica senza errori |
| `cards_polinomi_memory004.html` | Palestra: Memory delle Scomposizioni | Algebra: scomposizione di polinomi | 1EL, 2EL, 2GP | Memory | PC/LIM, telefono (layout ok) | React/Babel (unpkg) ⚠️senza versione esatta, Tailwind CDN ⚠️senza versione, katex@0.16.9 | — | 2026-05-04 | si carica senza errori |
| `corrente_4el_sincos.html` | Simulazione CA: Fasori & Onde | Goniometria: seno/coseno, corrente alternata (fasori) | 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, katex@0.16.9, p5.js@1.9.0 | — | 2025-12-08 | si carica senza errori |
| `dimostrazione_geometrica_prodotti_notevoli.html` | Prodotti Notevoli: dimostrazioni geometriche 2D e 3D | Algebra: prodotti notevoli (dimostrazioni geometriche) | 1EL, 1GP, 1MA, 2EL, 2GP, 2MA | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, three.js@r128, three@0.128.0 | — | 2026-10-16 | si carica senza errori |
| `disequazioni grafiche 4el.html` | Parabola Challenge: Disequazioni | Disequazioni di 2° grado (metodo grafico) | 3MEC, 4EL | Gioco arcade | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, p5.js@1.9.0 | — | 2025-12-08 | si carica senza errori |
| `disequazioni_frazionarie_vs_sistemi.html` | Laboratorio Interattivo: Sistemi vs Disequazioni frazionarie | Disequazioni frazionarie e sistemi di disequazioni | 1EL, 2EL, 2GP, 3MEC, 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, katex@0.16.8, nerdamer@1.1.13 | — | 2026-10-30 | si carica senza errori |
| `esaustione_01.html` | Il metodo di esaustione | Geometria: metodo di esaustione (area del cerchio) | [DA VERIFICARE] | Esplorazione/animazione | PC/LIM, telefono (layout ok) | Tailwind CDN ⚠️senza versione, katex@0.16.8, p5.js@1.9.0 | — | 2026-04-03 | si carica senza errori |
| `fibonacci_anim.html` | Experience Fibonacci | Successione di Fibonacci, sezione aurea | [DA VERIFICARE] | Esplorazione/animazione | PC/LIM, telefono (layout ok) | Tailwind CDN ⚠️senza versione, mathjax@3, p5.js@1.9.0 | — | 2026-05-27 | si carica senza errori |
| `fractions_lab_001.html` | Laboratorio di operazioni tra Frazioni | Aritmetica: operazioni con le frazioni | 1EL, 2EL, 2GP | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | React/Babel (unpkg) ⚠️senza versione esatta, Tailwind CDN ⚠️senza versione, katex@0.16.8 | — | 2025-12-08 | si carica senza errori |
| `functions_lab_008.html` | FuncLab AI: Esploratore di Funzioni | Funzioni: grafici e analisi (app esterna AI Studio) | [DA VERIFICARE] | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | nessuna | ai.studio (Google AI Studio, iframe) | 2026-10-22 | si carica senza errori |
| `gioco_sin_cos_01.html` | GonioMatch: Memory su valori notevoli di funzioni goniometriche | Goniometria: valori notevoli | 3MEC, 4EL | Memory | PC/LIM, telefono (layout ok) | React/Babel (unpkg) ⚠️senza versione esatta, Tailwind CDN ⚠️senza versione, katex@0.16.9 | — | 2025-12-08 | si carica senza errori |
| `il-filo-di-dedalo_2.5D_claude_2.html` | Il Filo di Dedalo: Labirinto Matematico 2.5D | Logica e calcolo in un labirinto [DA VERIFICARE] | 1EL, 2EL | Gioco arcade | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts | — | 2026-10-11 | si carica senza errori |
| `insiemi004.html` | Logic Lab: Insiemi & Venn | Insiemi e diagrammi di Venn, logica | 1EL, 2EL, 2GP | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, p5.js@1.9.0 | — | 2025-12-08 | si carica senza errori |
| `le_fasi_della_luna.html` | Le fasi della Luna | Geometria nello spazio: fasi lunari | 1EL, 1MA, 2EL, 2MA | Simulazione/laboratorio | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts, gsap@3.12.5, three@0.160.0 | — | 2026-09-30 | si carica senza errori |
| `math_bubble_equazione_della_retta.html` | Math Bubble: La Retta Esplicita / Orfini Math Lab | Geometria analitica: equazione esplicita della retta | [DA VERIFICARE] | Gioco arcade | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, canvas-confetti@1.6.0, font-awesome@6.4.0 | geogebra.org | 2026-10-07 | si carica senza errori |
| `math_pool_retta_pianocartesiano.html` | Math Pool: Biliardo Cartesiano e retta | Geometria analitica: retta (pendenza, simmetrie), parabola | 2GP, 3MEC | Gioco arcade | PC/LIM, telefono (layout ok), gesti touch dedicati | three@0.186.1 | — | 2026-10-29 | si carica senza errori |
| `math_underground003_4el.html` | Math Underground: Mappa per la classificazione di Funzioni | Funzioni: classificazione | 4EL | Esplorazione/animazione | PC/LIM, telefono: layout da sistemare, gesti touch dedicati | Google Fonts, Tailwind CDN ⚠️senza versione, cdn.jsdelivr.net /npm/chart.js ⚠️senza versione, chartjs-plugin-annotation@1.0.2, mathjax@3 | — | 2025-12-06 | si carica senza errori · scorre in orizzontale al telefono (+390 px) |
| `MCD_mcm_1el_001.html` | Arcade Challenge: MCM & MCD | Aritmetica: MCD e mcm | 1EL, 1GP, 1MA | Gioco arcade | PC/LIM, telefono (layout ok) | Google Fonts | — | 2026-10-16 | si carica senza errori |
| `memory_1el_numeri_004.html` | Caccia all'Errore: Memory su Operazioni in Z | Aritmetica: operazioni in Z, errori tipici | 1EL | Memory | PC/LIM, telefono (layout ok) | React/Babel (unpkg) ⚠️senza versione esatta, Tailwind CDN ⚠️senza versione, katex@0.16.9 | — | 2025-10-20 | si carica senza errori |
| `mercatore_correzione_001_gemini_worksproperly.html` | Mappe & Distorsioni: Mercatore | Geometria: proiezioni cartografiche (Mercatore) | 1EL, 2EL, 2GP | Esplorazione/animazione | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts, Tailwind CDN ⚠️senza versione, d3@7, topojson-client@3 | — | 2025-12-08 | si carica senza errori |
| `operazioni_polinomi_graph.html` | Esploratore Grafico: Operazioni con i Polinomi | Algebra: operazioni con i polinomi (lettura grafica) | 1EL, 2EL, 2GP, 3MEC, 4EL | Esplorazione/animazione | PC/LIM, telefono (layout ok) | Google Fonts, KaTeX@0.16.8, Tailwind CDN ⚠️senza versione, d3js.org, mathjs@11.8.0, nerdamer@1.1.13 | — | 2026-04-02 | si carica senza errori |
| `parabola e disequazioni di secondo grado maggio 2026.html` | Laboratorio Scomposizioni e Disequazioni di secondo grado / Parabola | Disequazioni di 2° grado, scomposizioni, parabola | 3MEC, 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts, katex@0.16.8, nerdamer@1.1.13 | — | 2026-10-30 | si carica senza errori |
| `pen_plotter__23v2_8K.html` | Studio Plotter CNC | Arte+codice: plotter CNC, geometria generativa | 3MEC, 4EL, 5EL | Simulazione/laboratorio | PC (strumento per plotter) | Google Fonts, Tailwind CDN ⚠️senza versione, d3js.org, opentype.js@1.3.4, pdf.js@3.4.120, three.js@r128, three@0.128.0 | raw.githubusercontent.com (geojson), openscad-wasm | 2026-08-27 | si carica senza errori |
| `percentuali_001.html` | Percent Lab | Aritmetica: percentuali | 1EL | Gioco arcade | PC/LIM, telefono (layout ok) | React/Babel (unpkg) ⚠️senza versione esatta, Tailwind CDN ⚠️senza versione | — | 2025-12-10 | si carica senza errori |
| `phi_is_irrational_01.html` | φ è irrazionale: il rapporto aureo | Numeri irrazionali: φ, sezione aurea | [DA VERIFICARE] | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, katex@0.16.9, three.js@r128, three@0.128.0 | — | 2026-10-30 | si carica senza errori |
| `pi_is_irrational.html` | \pi is irrational: perché π non è una frazione | Numeri irrazionali: π | 1EL, 1GP, 1MA, 2EL, 2GP, 2MA | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, katex@0.16.9 | — | 2026-10-28 | si carica senza errori |
| `polinomi_challenge_v2_pro.html` | Challenge: Scomposizione di Polinomi (PRO) | Algebra: scomposizione di polinomi | 1EL | Gioco arcade | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, katex@0.16.9, nerdamer@1.1.13, three.js@r128, three@0.128.0 | — | 2026-05-27 | si carica senza errori |
| `random_walk.html` | Random Walk 3D / Hypercaos & Chromatic Memory | Probabilità: passeggiata aleatoria 3D [DA VERIFICARE] | 4EL, 5EL | Memory | PC/LIM, telefono (layout ok), gesti touch dedicati | Tailwind CDN ⚠️senza versione, three.js@r128, three@0.128.0 | — | 2026-05-16 | si carica senza errori |
| `retta_fallout_002.html` | PIP | Geometria analitica: retta [DA VERIFICARE] | 3MEC, 4EL | Gioco arcade | PC/LIM, telefono: layout da sistemare, gesti touch dedicati | Google Fonts, Tailwind CDN ⚠️senza versione | — | 2025-12-12 | si carica senza errori · scorre in orizzontale al telefono (+69 px) |
| `scale_logaritmiche.html` | Esploratore di Scale Logaritmiche | Logaritmi: scale logaritmiche | 4EL, 5EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, cdn.jsdelivr.net /npm/chart.js ⚠️senza versione, katex@0.16.9 | — | 2026-05-22 | si carica senza errori |
| `scomp_3d_grafica_002.html` | AlgebraLab 3D: Scomposizione di polinomi attraverso prodotti notevoli e trinomio speciale | Algebra: scomposizione con modelli 3D | 1EL, 2EL, 2GP, 3MEC, 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, three@0.160.0 | — | 2025-12-08 | si carica senza errori |
| `sketch_to_pattern_gemini_005.html` | Sketch to Pattern: Arte Generativa | Arte generativa: simmetrie e pattern | [DA VERIFICARE] | Esplorazione/animazione | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts, Tailwind CDN ⚠️senza versione, d3js.org | — | 2025-12-08 | si carica senza errori |
| `snake_conway_self.html` | Snake of Life | Automi cellulari: gioco della vita di Conway | 3MEC, 4EL | Gioco arcade | PC/LIM, telefono (layout ok), gesti touch dedicati | Google Fonts | — | 2026-10-29 | si carica senza errori |
| `soglie_particelle_automa_cellulare.html` | Simulatore di Automi Cellulari e Particelle | Automi cellulari e particelle (soglie) | 3MEC, 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok), gesti touch dedicati | @tabler/icons-webfont@3.42.0, Google Fonts | — | 2026-10-29 | si carica senza errori |
| `sqrt2_is_irrational.html` | \sqrt{2} is irrational: la diagonale incommensurabile | Numeri irrazionali: √2, incommensurabilità | [DA VERIFICARE] | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | katex@0.16.9, three.js@r128, three@0.128.0 | — | 2026-04-21 | da verificare (errori JS) |
| `tavola_tart_canva0003.html` | Esploratore Numerico: Pitagora & Tartaglia | Aritmetica: terne pitagoriche, triangolo di Tartaglia | 1EL, 2EL, 2GP, 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Tailwind CDN ⚠️senza versione | — | 2025-12-08 | si carica senza errori |
| `visualizzatore polinomi 2d 3d 001.html` | Guida 3D: Scomposizione di Polinomi (Algebra Tiles) | Algebra: scomposizione con algebra tiles 2D/3D | 1EL, 2EL, 2GP | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Tailwind CDN ⚠️senza versione, three@0.160.0 | — | 2025-12-08 | si carica senza errori |
| `voto_cosapevole.2.5.html` | Teoria dei giochi e valutazione consapevole | Teoria dei giochi, valutazione | 4EL | Simulazione/laboratorio | PC/LIM, telefono (layout ok) | Google Fonts, Tailwind CDN ⚠️senza versione, alpinejs@3.13.3, cdn.jsdelivr.net /npm/chart.js ⚠️senza versione, katex@0.16.9 | — | 2026-08-26 | si carica senza errori |

## Spiegazioni animate ("Spiegami")

| File | App madre | Stato |
|---|---|---|
| `MCD_mcm_spiegazione.html` | `MCD_mcm.html` | si carica senza errori |
| `arcade_challenge_scomposizioni_parabola_spiegazione.html` | `arcade_challenge_scomposizioni_parabola.html` | si carica senza errori |
| `arcade_challenge_unita_di_misura_spiegazione.html` | `arcade_challenge_unita_di_misura.html` | si carica senza errori |
| `disequazioni_frazionarie_vs_sistemi_spiegazione.html` | `disequazioni_frazionarie_vs_sistemi.html` | si carica senza errori |
| `math_pool_retta_pianocartesiano_spiegazione.html` | `math_pool_retta_pianocartesiano.html` | si carica senza errori |
| `parabola e disequazioni di secondo grado maggio 2026_spiegazione.html` | `parabola e disequazioni di secondo grado maggio 2026.html` | si carica senza errori |
| `phi_is_irrational_01_spiegazione.html` | `phi_is_irrational_01.html` | si carica senza errori |
| `pi_is_irrational_spiegazione.html` | `pi_is_irrational.html` | si carica senza errori |
| `snake_conway_self_spiegazione.html` | `snake_conway_self.html` | si carica senza errori |
| `soglie_particelle_automa_cellulare_spiegazione.html` | `soglie_particelle_automa_cellulare.html` | si carica senza errori |

Tutte contengono link **assoluti** a `https://federicodb.github.io/...` (pulsante "← Orfini Math Lab" e invito a giocare): vedi AUDIT.

## Contenuti non interattivi del catalogo

| File / URL | Titolo | Tipo | Data | Note |
|---|---|---|---|---|
| `https://www.geogebra.org/m/mcfvzdfx` | Esercitazione GeoGebra: Retta per due punti | link | 2026-05-13 | link esterno, risponde (HTTP 200 il 2026-10-30) |
| `rif_norm_2017/Allegato-A_dlgs61_2017.pdf` | Allegato A - Profilo Educativo, Culturale e Professionale (PECUP) | normativa | 2026-04-19 | 0.3 MB |
| `rif_norm_2017/ALLEGATO-1_-Competenze-pecup-professionali-area-generale-Def-1.pdf` | Allegato 1 - Competenze Area Generale (PECUP) | normativa | 2026-04-19 | 0.3 MB |
| `rif_norm_2017/decreto-legislativo-13-04-2017-n-61.pdf` | D.Lgs. 61/2017 - Revisione Percorsi Istruzione Professionale | normativa | 2026-04-19 | 0.2 MB |
| `rif_norm_2017/Linee-guida_PARTE-PRIMA-e-SECONDA.pdf` | Linee Guida Nazionali - Parte I e II | normativa | 2026-04-19 | 1.3 MB |
| `rif_norm_2017/dlgs-61-2017.pdf` | D.Lgs. 61/2017 - Testo Integrale | normativa | 2026-04-19 | 0.7 MB |
| `content/video/sierpinski01.mp4` | Il Triangolo di Sierpinski (Video) | video | 2026-04-10 | 1.6 MB |
| `content/video/diseq_duesfighe.mp4` | Video: Sistemi vs Disequazioni frazionarie ("Due sfighe non fanno una gioia") | video | 2026-04-03 | 5.3 MB |
| `content/infografiche/errori_comuni02.png` | Errori Comuni - Potenze, Espressioni | infographic | 2025-12-20 | 6.0 MB |
| `content/infografiche/decodifica_la_matematica.pdf` | Decodifica la Matematica: grammatica dei simboli | infographic | 2025-12-15 | 3.6 MB |
| `https://ais-pre-evi2uqxownrirtwtzubadt-238287108414.europe-west2.run.app/` | AI Math Assistant: Tutor Didattico Sperimentale | link | 2025-12-12 | link esterno, risponde (HTTP 200 il 2026-10-30); servizio Cloud Run con AI, URL di anteprima ("ais-pre-..."), può sparire |
| `content/infografiche/guida_al_mondo_delle_funzioni_matematiche.pdf` | Guida al Mondo delle Funzioni Matematiche | infographic | 2025-12-12 | 3.5 MB |
| `content/images/tattoo_delta.png` | Formula del Delta: \Delta = b^2 - 4ac (Tattoo) | image | 2025-12-12 | 5.9 MB |

## Altri file pubblicati (fuori catalogo)

- `orfini-games/` (`SKILL.md`, `templates/game-2d.html`, `game-3d.html`, `references/`, `scripts/`): una skill di sviluppo per giochi, pubblicata sul sito anche se non è collegata da nessuna pagina.
- `orfini-math-quest.zip` (532 KB): archivio tracciato da git e quindi scaricabile da chiunque all'indirizzo `/orfini-math-quest.zip`.
- `database_verifiche.js`, `riforma2017.json`, `manifest.json`, `sitemap.xml`, `robots.txt`, `cookie-consent.*`.


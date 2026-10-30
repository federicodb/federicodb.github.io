# Audit di Orfini Math Lab

Stato al 2026-10-30, ramo `riorganizzazione`. Sola lettura: nessun file del sito è stato modificato per questo audit. Fanno eccezione le tre correzioni già approvate e registrate in `DECISIONI.md`. I dati per attività sono in `INVENTARIO.md`.

**Metodo.** Analisi statica di tutti i file HTML (meta, link, dipendenze). Apertura automatica in Chromium di 63 pagine su desktop (1366×768) e su smartphone (iPhone 13, 390×844, touch), registrando errori JS, risorse fallite e scorrimento orizzontale. Controllo HTTP dei link esterni del catalogo. Lettura del testo visibile senza JavaScript. Estrazione del testo dalla prima pagina dei PDF delle verifiche. Lighthouse non è ancora stato eseguito: è previsto in Fase 4.

## In breve

1. **Tecnicamente il sito è sano.** Non ci sono link locali rotti, nessuna pagina dà errori JS (dopo le correzioni) e tutte le app hanno un link per tornare alla home.
2. **Il problema vero è l'orientamento**, come dice il brief: 9 voci di menu allo stesso livello, la home organizzata per formato e niente percorso per argomento o per classe.
3. **Parte dei problemi "noti" del brief è già risolta.** `sitemap.xml` e `robots.txt` esistono e li genera `build.py`. Il tema chiaro esiste già, con la chiave `orfini_theme`, ma copre solo 10 app su 57.
4. **SEO:** il catalogo per i crawler c'è ma è nascosto e senza link; Mappa e Quest sono quasi vuote senza JavaScript.
5. **Fragilità:** 28 app dipendono dal CDN di Tailwind senza versione e 6 compilano React nel browser. Due attività dipendono da servizi AI esterni che possono sparire.

---

## 1. Orientamento e navigazione

| Problema | Dove | Effetto |
|---|---|---|
| 9 voci di menu allo stesso livello | `index.html:110-119` (e copie nelle altre pagine) | Chi arriva non capisce da dove partire |
| La voce **"Journal"** porta alla home | `index.html:110` | L'etichetta promette note di lavoro che non esistono ancora |
| **"Video"** non è una pagina, ma un filtro JS sulla home | `index.html:117` | Non ha un URL condivisibile e senza JS non funziona |
| **"Chi Sono"** è un'ancora (`#about`) che apre un pannello | `index.html:119` | Autore e ruolo non hanno una pagina propria (serve al portfolio) |
| Filtri della home **per formato** (Arcade, Simulazioni, Memory, Immagini, Infografiche) | home | Manca la ricerca per argomento e per classe |
| **Titoli poco parlanti** nel catalogo | "PIP" (`retta_fallout_002`), "C.E. Match", "Percent Lab", "Experience Fibonacci", "Random Walk 3D / Hypercaos & Chromatic Memory" | Da soli non dicono l'argomento |
| **Lingua mista** nei titoli | "$\pi$ is irrational", "$\sqrt{2}$ is irrational", "Logic Lab", "Chaos Lab" | Incoerenza; il simbolo `$...$` appare nel `<title>` del browser come testo grezzo |
| **Classi assenti** in 7 app su 42 | `esaustione_01`, `fibonacci_anim`, `functions_lab_008`, `math_bubble_equazione_della_retta`, `phi_is_irrational_01`, `sketch_to_pattern_gemini_005`, `sqrt2_is_irrational` | Senza classe non si possono filtrare |
| **Codici classe misti** | `1EL`, `1GP`, `1MA`, `2MA`, `3MEC`, `5EL` | Serve una tabella "anno + indirizzo" (es. 1EL → 1ª, Elettrico): **[DA COMPILARE DAL DOCENTE]** il significato di `MA` e `GP` |
| **Date poco affidabili** | 11 app con 2025-12-08, 5 con 2026-04-19 | Sembrano date di caricamento in blocco: per il portfolio servono le date vere **[DA VERIFICARE]** |
| La Quest ha la sua barra e il suo mondo | `/allenamento/` | Per lo studente va benissimo; nel sito va presentata come "Studenti → Allenati" |

**Sovrapposizioni di contenuto** (non sono duplicati: sono materiale per i futuri "Percorsi"):
- *Scomposizione di polinomi*: `visualizzatore polinomi 2d 3d 001`, `scomp_3d_grafica_002`, `cards_polinomi_memory004`, `polinomi_challenge_v2_pro`, `arcade_challenge_scomposizioni_parabola`, `dimostrazione_geometrica_prodotti_notevoli`, `operazioni_polinomi_graph`.
- *Disequazioni e parabola*: `parabola e disequazioni di secondo grado maggio 2026`, `disequazioni grafiche 4el`, `disequazioni_frazionarie_vs_sistemi`, più il video `diseq_duesfighe.mp4`.
- *Retta nel piano*: `math_bubble_equazione_della_retta`, `math_pool_retta_pianocartesiano`, `retta_fallout_002`, link GeoGebra "Retta per due punti".
- *Numeri irrazionali*: `sqrt2_is_irrational`, `pi_is_irrational`, `phi_is_irrational_01`, `fibonacci_anim`, `esaustione_01`.
- *Laboratorio arte+codice*: `pen_plotter__23v2_8K`, `attrattori_001_dec25`, `random_walk`, `snake_conway_self`, `soglie_particelle_automa_cellulare`, `sketch_to_pattern_gemini_005`, `albero_pitagorico_3d_gemini_001`, video Sierpinski.

## 2. SEO e contenuto leggibile senza JavaScript

| Verifica | Esito |
|---|---|
| `sitemap.xml` | ✅ Esiste, 60 URL, generata da `build.py`. ⚠️ `lastmod` presa dalle date di catalogo (vedi sopra); mancano le 11 spiegazioni animate, ed è corretto se restano contenuti incorporati. |
| `robots.txt` | ✅ Esiste e punta alla sitemap. Blocca `/build.py` e `/.git/` (inutile: non sono serviti da Pages, ma non fa danni). |
| Catalogo per i crawler in home | ⚠️ È un blocco di 55 `<article>` con `display:none` e `aria-hidden="true"` (`index.html:206`) **senza nessun link** alle attività. I motori di ricerca tendono a ignorare il testo nascosto, e senza link non scoprono le pagine (se non dalla sitemap). |
| Home senza JS | ⚠️ 686 caratteri visibili (menu e filtri), nessuna scheda di attività. |
| Mappa (`galaxy.html`) senza JS | ❌ 27 caratteri: pagina vuota. |
| Quest (`allenamento/`) senza JS | ❌ 56 caratteri. Accettabile per un'app, ma serve una pagina d'ingresso statica che ne descriva il contenuto. |
| Archivio verifiche, Competenze senza JS | ⚠️ 379 e 454 caratteri: l'elenco delle verifiche e la decodifica arrivano solo via JS. |
| La Scuola, Calcolo veloce senza JS | ✅ 7.400–7.900 caratteri di testo vero. |
| `<title>` e `meta description` | ✅ Presenti su tutte le pagine tranne `404.html` (è giusto così). ⚠️ Molte description delle app sono generiche o in stile promozionale; i titoli contengono LaTeX grezzo (`$\pi$`). |
| `rel="canonical"` | ⚠️ Presente su 7 pagine (index, scuola, galaxy, calcolo-mentale e 3 app: prodotti notevoli, Math Bubble, π). Manca su `competenze.html`, `verifiche.html`, sulla Quest e su 54 dei 57 file in `content/apps/`. |
| Open Graph | ⚠️ Presente su 10 pagine: le 6 pagine principali del sito e 4 app (prodotti notevoli, Math Bubble, π, Filo di Dedalo). Manca sulle altre app, quindi la condivisione su Instagram/WhatsApp/Classroom mostra un'anteprima povera. |
| Autore visibile | ⚠️ Nome e ruolo compaiono solo nel pannello "Chi Sono" (aperto via JS) e nei dati strutturati. |
| Data di aggiornamento visibile | ❌ Assente sulle pagine. |

## 3. Modalità chiara (LIM)

Il tema chiaro **esiste già**. C'è il pulsante sole/luna (`content/assets/js/theme-toggle.js`) con il foglio `content/assets/style/theme-light.css`, e la scelta si conserva nella chiave `orfini_theme`.

- ✅ Pagine del sito: index, competenze, verifiche, galaxy, scuola, calcolo-mentale, Quest.
- ⚠️ App: solo 10 file su 57 lo rispettano. Sono 6 app (Math Bubble, Snake of Life, Parabola e disequazioni, Disequazioni frazionarie, π, Prodotti notevoli) e 4 spiegazioni.
- ❌ `404.html` e `privacy-policy.html` non hanno il tema.

Quindi il passo 6 della Fase 3 non deve creare una modalità chiara da zero. Deve completarla e renderla più visibile, decidendo app per app se adattarla: è un intervento visivo, da fare caso per caso.

## 4. Link

- ✅ **Nessun link locale rotto** su 63 pagine (l'unico segnalato, `about:blank` in `soglie_particelle_automa_cellulare`, è un falso positivo).
- ✅ Tutte le voci del catalogo puntano a file esistenti.
- ✅ I link esterni del catalogo rispondono (GeoGebra, AI Math Assistant, FuncLab): HTTP 200 il 2026-10-30.
- ⚠️ **Link assoluti a `https://federicodb.github.io/...` usati per la navigazione**: si trovano in tutte le 11 spiegazioni animate (pulsante "← Orfini Math Lab" e invito a giocare). Vanno resi relativi. Vengono dallo stampo della skill `spiegami`, quindi va corretto anche lo stampo, altrimenti le prossime spiegazioni li ripeteranno.
- ℹ️ Gli altri link assoluti sono `canonical`, `og:url`, `og:image` e i dati strutturati: **devono restare assoluti**, altrimenti le anteprime social e i canonical smettono di funzionare.
- ℹ️ **Nomi di file con spazi** (URL pubblici, non vanno rinominati): `disequazioni grafiche 4el.html`, `parabola e disequazioni di secondo grado maggio 2026.html` (+ spiegazione), `visualizzatore polinomi 2d 3d 001.html`, `content/verifiche/2GP/verifica 2gp 24 feb 2026_fila A/B.pdf`. Funzionano, ma sono scomodi da scrivere a mano e nei QR code.

## 5. Pagine orfane, duplicati, file in più

- ℹ️ Le 11 `*_spiegazione.html` non compaiono nel catalogo né in link statici: si aprono in iframe dal pulsante "Spiegami" dell'app madre. Non sono orfane, ma senza JS sono irraggiungibili.
- ⚠️ `orfini-games/` (skill di sviluppo: `SKILL.md`, `templates/game-2d.html`, `game-3d.html`, script) è pubblicata sul sito senza essere collegata da nessuna parte.
- ⚠️ `orfini-math-quest.zip` (532 KB) è tracciato da git, quindi chiunque può scaricarlo da `/orfini-math-quest.zip`. Va deciso se deve restare pubblico.
- ⚠️ Sidecar duplicato con maiuscole diverse: `content/infografiche/guida_al_mondo_delle_funzioni_matematiche.json` e `Guida_al_Mondo_delle_Funzioni_Matematiche.json` (cambia solo la data, 12 contro 13 dicembre). Su sistemi che non distinguono le maiuscole (Windows, macOS) i due file collidono.
- ⚠️ Manca `.nojekyll`: GitHub elabora il sito con Jekyll. Così i file `.md` (anche questi in `docs/`) diventano pagine pubblicate, mentre file e cartelle che iniziano con `_` non vengono pubblicati (es. `allenamento/activities/_modello.js`: oggi non è servito, ed è corretto perché è un modello). È un punto da decidere in Fase 2.

## 6. Dipendenze fragili

**Servizi esterni e AI** (segnalati, da non riscrivere):

| Attività | Dipende da | Rischio |
|---|---|---|
| `functions_lab_008.html` (FuncLab AI) | iframe su `funclab-ai-esploratore-di-funzioni.ai.studio` | Se l'app su AI Studio viene tolta o cambia, la scheda resta vuota. Carica anche contenuti di Google senza passare dal consenso cookie. |
| Link "AI Math Assistant" | `ais-pre-…europe-west2.run.app` (Cloud Run) | È un URL di **anteprima** ("ais-pre"): può scadere senza preavviso. |
| `pen_plotter__23v2_8K.html` | `raw.githubusercontent.com` (confini geografici), `openscad-wasm@0.3.0` | Funzioni secondarie: senza rete non funzionano. |
| `math_bubble_equazione_della_retta.html` | `geogebra.org` | Solo per i link/embed GeoGebra. |

**Librerie** (contro la regola "librerie via CDN con versione esplicita"):
- ⚠️ **28 app** usano `cdn.tailwindcss.com` **senza versione**. È la versione "Play CDN", pensata per prototipi: compila il CSS nel browser a ogni apertura (più lenta su LIM e telefoni vecchi) e può cambiare da un giorno all'altro.
- ⚠️ **6 app** (`card_frazioni_algebriche_005`, `cards_polinomi_memory004`, `fractions_lab_001`, `gioco_sin_cos_01`, `memory_1el_numeri_004`, `percentuali_001`) caricano **React 18 in versione di sviluppo e Babel standalone**, che compila il codice nel browser. Si aprono lentamente sui dispositivi deboli e le versioni non sono esatte (`react@18`, Babel senza versione).
- ⚠️ `chart.js` senza versione in `scale_logaritmiche`, `math_underground003_4el`, `voto_cosapevole.2.5`; `mathjax@3` solo con la versione principale in `attrattori_001_dec25`, `fibonacci_anim`, `math_underground003_4el`; `d3@7` e `topojson-client@3` in `mercatore_correzione_001_gemini_worksproperly`.
- ℹ️ Three.js in 5 versioni diverse (r128, 0.160, 0.165, 0.186.1): non è un problema finché ogni versione è fissata.
- ✅ Corretto il 2026-10-30: `polyfill.io` (compromesso) rimosso da 2 app.

## 7. Prestazioni e dispositivi

- ⚠️ Immagini molto pesanti nel catalogo: `content/infografiche/errori_comuni02.png` (6,0 MB) e `content/images/tattoo_delta.png` (5,9 MB). Video `diseq_duesfighe.mp4` 5,3 MB. Con la rete della scuola o i dati del telefono si caricano lentamente.
- ⚠️ `pen_plotter__23v2_8K.html` pesa 1 MB di HTML (strumento da PC, accettabile).
- ⚠️ A risoluzione smartphone **2 app scorrono in orizzontale**: `math_underground003_4el` (+390 px, la pagina è larga il doppio dello schermo) e `retta_fallout_002` (+69 px). Tutte le altre 61 pagine non scorrono.
- ℹ️ Le prove a risoluzione LIM (1920×1080) e Lighthouse sono previste in Fase 4.

## 8. Privacy e cookie

- ✅ Nessun tracciatore o strumento di statistica trovato (niente Google Analytics, Tag Manager, Clarity, Plausible…). Il gestore dei consensi `cookie-consent.js` non ha dipendenze esterne.
- ⚠️ Il banner dei cookie è incluso solo in 5 pagine: index, scuola, calcolo-mentale, privacy-policy, pen plotter. Non c'è un problema immediato, perché senza tracciatori non c'è niente da autorizzare. Da valutare: Google Fonts (caricati dai server Google in 44 pagine), l'iframe di AI Studio e gli embed GeoGebra trasmettono a terzi l'indirizzo IP del visitatore. **[DA VERIFICARE con il docente / DPO della scuola]**: l'audit non dà un parere legale.
- ✅ **Verifiche in PDF:** su 32 PDF i campi Nome/Cognome sono vuoti e i metadati "Autore" sono vuoti. Non risultano dati personali di studenti.
- ✅ La Quest salva i progressi solo in `localStorage` (`orfini_quest_v2`, `orfini_quest_profili`), sul dispositivo dello studente.

---

## Ciò che funziona e non va toccato

Questi elementi restano come sono in tutta la riorganizzazione. Si cambiano solo navigazione, pagine indice e metadati.

1. **Tutti gli URL pubblici attuali**: i 57 file in `content/apps/`, le pagine root (`index.html`, `allenamento/`, `calcolo-mentale.html`, `verifiche.html`, `galaxy.html`, `competenze.html`, `scuola.html`, `privacy-policy.html`), i PDF delle verifiche, la normativa, i video. Compresi i nomi con spazi e quelli "storici" come `MCD_mcm_1el_001.html`.
2. **Il contenuto delle 42 app** (calcoli, modelli, regole di gioco, correzione delle risposte, salvataggi in `localStorage`). In particolare le app con test automatici: Math Bubble, Pen Plotter, Quest, Calcolo veloce.
3. **Orfini Math Quest** (`/allenamento/`): 56 attività in 11 aree, con i suoi test (`npm test`) e le sue chiavi di salvataggio.
4. **La pipeline `build.py`** come fonte di `database.js`, `sitemap.xml` e della SEO di `index.html`. La nuova scheda metadati va integrata in questa pipeline, non affiancata a mano.
5. **Il tema scuro "laboratorio"** (palette scura/AMOLED, font Syne/Inter/Space Mono), il pulsante del tema e la chiave `orfini_theme`.
6. **Cookie consent e privacy policy** (`cookie-consent.js/.css`, `privacy-policy.html`, chiave `orfini_cookie_consent`).
7. **Il pulsante "← Orfini Math Lab"** presente in tutte le 57 app (`orfini-back-btn`, da `content/assets/js/orfini-shared.js`): oggi riporta alla home, e la nuova home deve restare il suo punto di arrivo.
8. **Il meccanismo "Spiegami"** (spiegazione in iframe dall'app madre) e la serie **Arcade Challenge** con le sue convenzioni.
9. **La mappatura alla Riforma 2017** (`riforma2017.json`, codici MAT_K/A/C, `competenze.html`).
10. **Le pagine con testo vero già leggibile senza JS**: `scuola.html` e `calcolo-mentale.html`.

## Proposte rinviate alle fasi successive (non eseguite)

| Tema | Fase |
|---|---|
| Catalogo statico con link veri al posto del blocco nascosto; pagine indice leggibili senza JS | 2–4 |
| Tabella dei codici classe (anno + indirizzo) e classi mancanti | 2 (schema), 3.1 |
| Link assoluti delle spiegazioni → relativi, e correzione dello stampo `spiegami` | 3 / 4 |
| `.nojekyll`, `orfini-games/`, `orfini-math-quest.zip`, sidecar duplicato | 2 (decisione) |
| Tailwind/React senza versione: fissare le versioni senza riscrivere le app | da decidere, app per app |
| Immagini pesanti: versioni WebP per il catalogo, mantenendo l'originale all'URL attuale | 4 |
| Overflow su telefono di `math_underground003_4el` e `retta_fallout_002` | da decidere |

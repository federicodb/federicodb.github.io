# Riorganizzazione del sito — registro delle decisioni

Ogni voce: data, decisione, motivo.

## 2026-10-30 — Fase 0

- **Il ramo pubblicato è `master`, non `main`.** Nel piano "main" va letto come `master`. Motivo: è il ramo predefinito del repository e l'unico da cui GitHub Pages ha mai pubblicato.
- **Pubblicazione: modalità classica "Deploy from a branch".** L'unico workflow è `pages-build-deployment` (generato da GitHub, nessun file in `.github/workflows`). Le ultime 100 esecuzioni sono tutte su `master`; il ramo `feat/quest-rotazione-settimanale`, pushato il 2026-10-22, non ne ha avviata nessuna. Un push su `riorganizzazione` quindi non pubblica nulla.
- **Backup fuori dal repository** in `../backup_riorganizzazione_2026-10-30/`: archivio `tar.gz` completo (inclusi file ignorati, `.env`, `.venv`, `node_modules`) e `git clone --mirror` del repository locale (tutti i rami locali, anche quelli mai pushati). Motivo: il mirror del remoto non conterrebbe i rami solo locali.
- **Tag `pre-riorganizzazione-2026-10-30`** (annotato) su `b3a7835`, ultimo commit di `master` prima della riorganizzazione.
- **Lavoro solo sul ramo `riorganizzazione`**, creato da `master` a `b3a7835`.
- **I file in `docs/` vanno aggiunti con `git add -f`**: `.gitignore` esclude `*.md`.

## 2026-10-30 — Correzioni prima della Fase 1

- **`sqrt2_is_irrational.html`: i pulsanti Zoom In/Zoom Out davano errore** perché le funzioni venivano assegnate a `controls` prima che `init()` lo creasse. Le assegnazioni sono state spostate dentro `init()`, con la stessa logica di zoom.
- **Rimosso `polyfill.io`** da `attrattori_001_dec25.html` e `math_underground003_4el.html`. Motivo: il dominio è stato compromesso nel 2024 (serviva codice malevolo) e oggi i browser lo bloccano. MathJax 3 non ne ha bisogno: dopo la rimozione si carica come prima.
- **`.nojekyll` rimandato alla Fase 2.** Aggiungerlo cambierebbe la pubblicazione dei file `.md` e di quelli che iniziano con `_`, che sono già online.

## 2026-10-30 — Fase 2 (proposte, in attesa di approvazione)

- **Nessuno spostamento di file nella riorganizzazione.** La struttura Studenti/Docenti/Laboratorio vive nei metadati e nelle pagine indice, quindi non servono stub di redirect. Motivo: gli URL attuali sono in QR code, Classroom e materiali stampati.
- **Niente `.nojekyll` (proposta D5).** `laboratoriomatematicoOrfini.html` e `tools/report_finale.html` esistono solo perché Jekyll trasforma i `.md`: con `.nojekyll` darebbero 404 (verificato con HTTP sul sito pubblico).
- **`index.html?tag=` va conservato**: lo usano 9 link di `scuola.html` e la Mappa 3D. `UIManager.js` lo legge come ricerca testuale.

## 2026-10-30 — Fase 2, revisione 2 (indicazioni del docente)

- **Il sito è prima di tutto uno strumento operativo per gli studenti.** Niente sezione "Docenti": i colleghi, formati nelle sessioni di formazione, usano la pagina Attività con i filtri. Verifiche, Competenze e Scuola passano nel piè di pagina e in "Chi sono".
- **Nessuna etichetta di classe o di livello visibile allo studente.** Motivo: con le quarte capita di proporre attività da prima o da seconda, e nessuno deve sentirsi mortificato. La classe resta nel campo `programma`, usato solo dal filtro docenti (chiuso per impostazione predefinita). Oggi le schede della home la mostrano (`UIManager.js:353`): nella nuova pagina non ci sarà.
- **Percorsi per argomento, in tre momenti neutri** (Capire / Allenarsi / Mettersi alla prova) invece di livelli. "Algebra del biennio" diventa "Polinomi e scomposizioni".
- **Codici classe**: GP = Grafica, MA = Manutenzione (da confermare).

## 2026-10-30 — Fase 2, revisione 3

- **Basta scatole cinesi**: al massimo tre livelli. Tolti i percorsi composti a mano con passi numerati e le schede-pagina per attività. Motivo: il sito cambia spesso e la struttura non deve rompersi quando si aggiunge o si toglie un'attività.
- **Allenati è una sezione a parte**: la Quest è la palestra di tutto il sito. Ogni attività mostra "Allenati su questo" con le lezioni collegate, che `build.py` già calcola, quindi la sezione cresce da sola.
- **Le pagine d'argomento sono generate dai dati**, ordinate per formato (spiega → allena → sfida).
- **Il Diario di bordo entra nell'architettura**: articoli Markdown in `content/diario/`, convertiti in HTML statico dal build; immagini ricompresse e ripulite dai metadati EXIF. Gli articoli puntano alle attività per `id` stabile, così non perdono senso quando l'attività cambia.
- **Scheda minima per attività**: obbligatorio solo `url`; date, collegamenti alla Quest, spiegazioni e articoli sono calcolati.

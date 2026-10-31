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

## 2026-10-30 — Fase 2, revisione 4 (nuovo brief: laboratorio artigianale)

- **Non si parte più dai ruoli, ma da tag liberi e viste generate.** Le revisioni 1-3 sono superate.
- **I tag delle viste sono solo quelli scritti dall'autore** (campo `tag`). Motivo: oggi `database.js` ha 295 tag diversi, 169 usati una volta, nati da keyword SEO e Gemini; generare viste da quelli produrrebbe centinaia di pagine quasi vuote. Le keyword restano per la SEO, i codici `MAT_*` per `competenze.html`.
- **Metadati in testo semplice** (`dati/attivita.txt`, blocchi `campo: valore`) invece di JSON: niente virgolette e virgole da sbagliare, nessuna libreria. Le app nuove possono descriversi da sole nel `<head>`; se un dato è in entrambi i posti, vince il file.
- **"Più usate" non si fa**: richiederebbe statistiche d'uso, che il sito non raccoglie (scelta di privacy).
- **Raccomandata l'alternativa 2** (una pagina `attivita/` con HTML completo e filtri nel browser), perché riusa ciò che la home già fa (`UIManager.js`) e permette filtri combinati. È reversibile verso l'alternativa 1 senza toccare i dati.

## 2026-10-30 — Fase 2, revisione 5: minimo lavoro

- **Si aggiunge solo il Journal**, collegato all'esistente tramite `build.py`. Menu, catalogo, app e metadati restano come sono; la riorganizzazione delle revisioni 1-4 è rimandata (resta nella storia git). Motivo, dal docente: "meno danni e meno lavoro possibile".
- **Le note citano le app con il nome del file**: nessun codice nuovo da inventare né scheda da compilare.
- **Immagini: mai visi di studenti**, solo foto di spalle o ritoccate. Lo script cancella i metadati (GPS) ma non riconosce i visi: il controllo resta del docente.
- **YouTube solo come link**, non incorporato: nessun contenuto di terzi caricato, nessuna modifica a cookie consent e privacy policy.
- **`markdown` 3.10.3** è già nel sistema (pacchetto Manjaro); va aggiunto al `.venv`, che non vede i pacchetti di sistema.

## 2026-10-30 — Journal, passi 1-2 (implementazione)

- **Modulo `journal_build.py`**, chiamato da `build.py` prima di scrivere `database.js`. Non si chiama `journal.py` per non confondersi con la cartella generata `journal/`. Se la libreria `markdown` manca, il build del catalogo continua e il Journal viene saltato con un avviso.
- **`journal/` si rigenera solo se contiene il file `.generato-da-build`**: il build non cancella mai una cartella che non ha creato lui.
- **Le note con `stato: esempio` o `bozza`** si vedono in anteprima, ma hanno `noindex` e non entrano nella sitemap. Le 4 note d'esempio descrivono solo fatti ricavati da app e commit; le parti "In classe" e "Cosa cambio" sono `[DA COMPILARE DAL DOCENTE]`.
- **`.gitignore`**: aggiunte le eccezioni `!content/journal/*.md` e `!journal_build.py`. Senza, le note sarebbero state ignorate da git senza avviso.
- **Difetto trovato dal test e corretto**: codificando gli URL, il `#` dei link alla Quest diventava `%23` (404).
- **Correzione dell'audit**: `orfini-games/` non è pubblicata (è in `.gitignore`, il sito risponde 404). Lo zip invece è pubblico.
- **Problema esistente reso visibile**: per φ e Fibonacci il build suggerisce come allenamento "Pendenza di una retta" e "Rette parallele" (collegamenti sbagliati di `link_allenamento`). Per ora non è stato corretto.

## 2026-10-31 — Menu del Journal e allenamento per φ e Fibonacci

- **Menu**: la voce "Journal" portava al catalogo (la home), quindi il diario non era raggiungibile. Ora il menu è *Attività* (catalogo, `index.html`) · *Allenati* · *Journal* (`journal/`) nelle 6 pagine con il menu, nel footer della home e nelle pagine generate da `journal_build.py`. "Allenati" resta la seconda voce: `tests/allenamento.spec.js` lo verifica.
- **Nuova lezione della Quest** `fibonacci` ("Successione di Fibonacci e rapporto aureo", area Numeri, MAT_K1 e MAT_K3, prerequisito: frazioni), file `allenamento/activities/numeri/fibonacci.js`. I tre livelli sono: la regola; gli schemi nascosti (andare all'indietro, quadrati a spirale, somma dei primi termini); il rapporto aureo. Numeri sempre risolvibili a mente: su 27.000 domande generate per le classi 1-5 la risposta più grande è 117. Dalla terza classe cambia il ragionamento, non il peso dei conti: due passi invece di uno, successioni con partenza qualunque, somma dei quadrati vista come area.
- **build.py**: le lezioni elencate in `ALLENAMENTO_SOLO_ARGOMENTO` (per ora solo `fibonacci`) compaiono solo dove l'argomento coincide e, in quel caso, sono l'unico allenamento proposto. Rispetto al commit precedente cambiano solo `phi_is_irrational_01` e `fibonacci_anim`, che passano da Pendenza/Rette parallele/Aree/Pitagora a Fibonacci. Scartata la regola generale "solo per argomento": avrebbe cambiato 17 voci, in parte in peggio (per esempio "Rette parallele" tolta da Retta Fallout).

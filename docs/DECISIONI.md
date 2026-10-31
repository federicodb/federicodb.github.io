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

## 2026-10-31 (2) — Fibonacci in due lezioni, falsi errori sugli esponenti, Journal più ricco

- **Quest, due lezioni da 3 livelli** (tutte le lezioni hanno 3 livelli: stelle e progressi salvati sono costruiti così):
  - `fibonacci` "Successione di Fibonacci" (Numeri): la regola; quadrati e somme (quadrati a spirale, $F_n^2 + F_{n+1}^2$ ancora di Fibonacci, somma dei primi termini); invarianti (identità di Cassini, anche per successioni qualunque; somma di 10 termini = 11 × il settimo; divisibilità per 3 e per 5 a posti fissi).
  - `rapporto-aureo` "Rapporto aureo e sezione aurea" (Geometria, MAT_K3, MAT_C4, prerequisito `fibonacci`): il numero φ ($\varphi^2 = \varphi + 1$, $1/\varphi = \varphi - 1$); nella natura (spirali di girasoli e pigne, angolo aureo 137,5°, "vero o leggenda" con il nautilo); progettare con φ (rettangolo aureo con il cursore, Modulor di Le Corbusier, Pacioli, "vero o leggenda" con l'A4 e il Partenone).
  - Su 27.000 domande per classi 1-5: risposta massima 1287 (11 × 117, con il trucco del per 11) per Fibonacci, 296 per il rapporto aureo.
  - `build.py`: `ALLENAMENTO_SOLO_ARGOMENTO = {"fibonacci", "rapporto-aureo"}`. φ → Rapporto aureo; Experience Fibonacci → tutte e due. Nessun'altra app cambia.
- **Falsi errori sugli esponenti** (segnalato dal docente: `10^17` rifiutato per "completa con l'esponente"): nuovo campo `powerBase` nelle domande numeriche (`js/engine/check.js`). La potenza scritta per intero con la base giusta vale come l'esponente. Il valore della potenza non vale ("8" non passa per $2^3$, altrimenti si accetterebbe un esponente sbagliato). Usato in potenze ("completa l'esponente") e logaritmi (definizione). Test in `engine.test.mjs`; `correctness.test.mjs` prova la forma `b^n` su tutte le domande con `powerBase`.
- **Menu**: tolta la voce "Video" dalla home.
- **Journal**:
  - Ricerca e filtro per attività nella seconda riga del menu, come nella home. Sono un form GET e dei link verso `journal/`, quindi funzionano da ogni pagina; nell'elenco si filtra mentre si scrive, senza badare agli accenti, e la ricerca resta nell'indirizzo (`?q=`, `?attivita=`).
  - Su schermo largo l'elenco è a schede su più colonne con copertina; nella nota le attività stanno nella colonna di destra (≥ 1100 px).
- **Immagini del Journal**:
  - Il build crea `journal/<nota>/copertina.webp` (1200×630, senza EXIF) dal campo `copertina:`, poi dalla prima immagine della nota, poi dalla miniatura della prima attività.
  - Avvisi per immagini mancanti, senza testo alternativo, esterne, più strette di 600 px, HEIC, video oltre 20 MB, file in `media/` non usati, e copertina presa da una miniatura del catalogo.
  - Regola del docente nel modello: le immagini mostrano fasi interessanti dell'attività, mai la schermata d'avvio, l'inserimento del nome o i menu.

## 2026-10-31 (3) — Nove note, copertine dalle attività, collegamenti incrociati, colophon

- **Nove note d'esempio** per vedere la griglia 3×3 (`stato: esempio`, parti in classe da compilare).
- **Copertine catturate dentro le attività**, non dalle miniature del catalogo, che mostrano l'app appena aperta. Criterio del docente: lo studente deve distinguere le attività a colpo d'occhio. Gli Arcade Challenge si somigliano nell'interfaccia, quindi la copertina è un momento del gioco (modello ad aree, ascensore). Parabola e frazionarie si distinguono per il grafico rispetto alle bande dei segni. Catture con Playwright e generatore casuale fissato solo nel browser di cattura; file in `content/journal/media/`, campo `copertina:`. Manca ancora Snake, che usa la miniatura (il build avvisa).
- **Unire le due app sulle disequazioni**: scartato. Cambierebbe gli URL pubblici e rischia regressioni; le copertine bastano a distinguerle.
- **Collegamenti calcolati dal build**, per ogni nota:
  - tag principali sotto il titolo, che portano alla ricerca nel catalogo (`index.html?tag=`). Esclusi classi, codici, indirizzi ed etichette generiche (`TAG_GENERICI`);
  - competenze dalla Riforma 2017 con link a `competenze.html#CODICE`;
  - "Potrebbe interessarti anche": attività con almeno 2 temi in comune;
  - "Altre note": stesse attività o almeno 2 temi in comune.
- **Colophon nel footer del Journal**: diario di bordo, ultimo aggiornamento (data più recente tra attività e note), strumenti open source, sorgenti su GitHub, licenza MIT del codice (dal README; manca un file LICENSE).
  - Logo Creative Commons non messo: dichiarerebbe una licenza per i contenuti che il docente non ha ancora scelto.
  - Logo dell'Open Source Initiative non messo: è un marchio registrato con regole d'uso.
- Segnalato, non toccato: `retta_fallout_002.html` ha `<title>PIP</title>`, quindi nel catalogo si chiama "PIP".

## 2026-10-31 (4) — Licenze, PIP, metadati, Mappa

- **Licenze**: `LICENSE` (MIT) per il codice, `LICENSE-CONTENUTI` (CC BY-SA 4.0) per i contenuti. Il colophon (diario di bordo, ultimo aggiornamento, GitHub, MIT, CC BY-SA) lo scrive il build in tutte le pagine, tra `<!-- COLOPHON_START -->` e `<!-- COLOPHON_END -->` (`build.COLOPHON_PAGES`). Nella Mappa sta nel pannello "Informazioni"; la Quest è esclusa (app a schermo intero).
- **Journal**: le schede prendono il colore dal titolo con la stessa tavolozza e lo stesso calcolo del catalogo; un'attività ha lo stesso colore in tutte e due le pagine.
- **PIP eliminata** su richiesta del docente (`retta_fallout_002.html` e la sua miniatura). Tolto il link da Math Bubble; il vecchio indirizzo dà la pagina 404.
- **Metadati**:
  - codici MAT aggiunti a 10 app; titoli puliti (Math Bubble, Parabola, Random Walk);
  - `<meta name="allenamento">` ha la precedenza sulla scelta automatica (usato per φ, Fibonacci, Arcade scomposizioni);
  - a ogni build un controllo avvisa per codici mancanti, titoli da rivedere, Tailwind senza versione, React di sviluppo;
  - `docs/ALLENAMENTI.md`: proposta di allenamenti per tutte le 41 app, **da approvare** prima di scriverla nelle app.
- **Mappa (galaxy.html) riscritta**:
  - Diagnosi del motore precedente:
    - un tetto di 12 linee per tema faceva sparire i legami di Matematica, quindi gruppi apparentemente isolati;
    - legami pesati a conteggio, colori senza significato, disposizione casuale;
    - il clic portava via dalla pagina.
  - Ora i dati li calcola il build (`mappa_build.py` → `galaxy_data.js`):
    - temi con le regole del Journal; singolare e plurale uniti;
    - legami pesati con l'indice di Jaccard; colori per famiglia (propagazione delle etichette);
    - albero dei legami più forti, più ponti e raggi verso Matematica: nessun tema isolato, verificato dal test.
  - Scena (`GalaxyScene.js`):
    - fisica viva con molle sottosmorzate (trascinando un tema i vicini seguono e rimbalzano);
    - impulsi luminosi lungo i legami e aloni pulsanti (effetto rete neurale/costellazione);
    - filtro visivo a intersezione con pannello delle attività e link al catalogo filtrato;
    - zoom indietro fino a vedere solo "Matematica"; la rotella funziona anche sopra le etichette;
    - forma identica a ogni apertura (generatore con seme); rispetto di `prefers-reduced-motion`.
  - Test: `tests/mappa.spec.js`.

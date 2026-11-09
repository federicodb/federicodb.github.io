# Ricognizione — home a costellazione (Fase 0)

Stato al 2026-11-09, ramo `costellazione` creato da `master` (`c7aae03`). Questa fase non cambia nessuna pagina del sito: aggiunge solo `data/`, `tools/valida.mjs`, lo script `npm run valida` e due documenti.

Documenti già presenti e ancora validi, che qui non ripeto: `docs/INVENTARIO.md` (ogni app, con dipendenze e stato), `docs/DECISIONI.md` (registro delle scelte), `docs/ARCHITETTURA.md`, `docs/AUDIT.md`.

## 1. Struttura delle cartelle

| Percorso | Contenuto | Chi lo scrive |
|---|---|---|
| `index.html`, `index.css` | home con il catalogo filtrabile | a mano; `build.py` riscrive la parte SEO e il colophon |
| `competenze.html`, `verifiche.html`, `scuola.html`, `calcolo-mentale.html`, `galaxy.html`, `404.html`, `privacy-policy.html` | pagine del sito | a mano (colophon dal build) |
| `content/apps/` | 51 pagine HTML: 40 app nel catalogo e 11 spiegazioni animate ("Spiegami") | a mano, una per file |
| `content/infografiche/`, `images/`, `video/`, `links/` | contenuti non interattivi del catalogo | a mano, con sidecar JSON |
| `content/verifiche/` | 34 PDF delle verifiche | a mano |
| `content/journal/`, `content/schede/` | sorgenti Markdown di note e schede (non pubblicati: `_config.yml`) | a mano |
| `content/assets/` | font locali, KaTeX locale, miniature, `js/` e `style/` comuni | a mano e `thumbnails.py` |
| `journal/`, `schede/` | pagine generate (16 note, 40 schede e il loro indice) | `journal_build.py` |
| `allenamento/` | Orfini Math Quest, app a sé con i suoi test e il suo service worker | a mano; `catalogo.json` generato |
| `database.js`, `database_verifiche.js`, `galaxy_data.js`, `sitemap.xml` | dati generati | `build.py`, `mappa_build.py` |
| `rif_norm_2017/`, `riforma2017.json` | normativa e mappatura delle competenze | a mano |
| `tests/` | 20 file di test Playwright | a mano |
| `tools/` | controlli, catture, `compila_jsx.mjs` | a mano |
| `docs/` | documenti di lavoro (non pubblicati) | a mano |

Non esistevano `data/`, `.github/workflows/` né uno script `build` in `package.json`.

## 2. Come sono costruiti oggi home e menu

**Home (`index.html`, 64 KB).** Carica `database.js` (101 KB, variabile globale `db`) e `content/assets/js/modules/UIManager.js`, che disegna le schede nel browser a blocchi, mentre si scorre. Senza JavaScript la griglia è vuota; per i motori di ricerca `build.py` scrive in pagina un elenco SEO statico.
- `database.js` ha 53 voci. La griglia esclude le 5 di normativa, quindi **le schede in home sono 48**: 40 app, 2 link esterni, 2 video, 3 infografiche, 1 immagine.
- Filtri per categoria: Arcade (9), Simulazioni (20), Memory (5), Immagini (1), Infografiche (3). Dieci voci non rientrano in nessun filtro: 8 app con `game_type: standard` e i 2 video.
- La ricerca è testuale su titolo, descrizione e tag. `index.html?tag=…` è usato da `scuola.html`, dal Journal e dalla Mappa: va conservato.
- I tag in `database.js` sono 307, di cui la maggior parte usata una volta sola (parole chiave SEO, codici `MAT_…`, classi). Non sono un vocabolario.

**Menu.** Nove voci allo stesso livello, ripetute a mano in 5 pagine (`index`, `competenze`, `verifiche`, `scuola`, `calcolo-mentale`) e scritte da `journal_build.py` nelle pagine del Journal: Attività · Allenati · Journal · Calcolo veloce · Archivio · Mappa · Competenze · La Scuola · Chi Sono. "Chi Sono" è un'ancora (`#about`) che apre un pannello della home, non una pagina.

**Tema.** `content/assets/js/theme-toggle.js` e `content/assets/style/theme-light.css`, classe `html.theme-light`, chiave `orfini_theme` condivisa con la Quest. I colori non stanno in un solo file: sono in `index.css`, `journal.css`, `schede.css`, `calcolo-mentale.css`.

## 3. Librerie

| Dove | Libreria | Come è caricata |
|---|---|---|
| home, competenze, verifiche, galaxy | marked 15.0.12 | CDN jsDelivr, con `integrity` |
| home, competenze, verifiche, galaxy, calcolo veloce, Journal | KaTeX 0.16.9 | locale (`content/assets/vendor/katex/`) |
| galaxy | three 0.160.0 | CDN unpkg, tramite importmap |
| tutte le pagine | Inter, Syne, Space Mono | font locali |
| app | Three.js, p5, d3, Chart.js, Nerdamer, MathJax, React, Tailwind… | CDN con versione esatta (vedi `INVENTARIO.md`) |
| sviluppo | `@playwright/test`, `@babel/standalone` | `node_modules` |

Node 24.13.1 e npm 11.8.0 sono installati. `d3-force` non c'è ancora: servirà in Fase 2 come dipendenza di sviluppo, usata solo durante la generazione.

## 4. Cosa fa `galaxy.html`

Mappa 3D dei temi, riscritta il 31 ottobre. `mappa_build.py` (chiamato da `build.py`) legge le app da `database.js`, ricava i temi dai tag, unisce singolare e plurale, pesa i legami con l'indice di Jaccard, assegna un colore per famiglia e scrive `galaxy_data.js` (42 KB). `GalaxyScene.js` (654 righe, Three.js) disegna la scena: molle tra i temi, trascinamento, impulsi lungo i legami, filtro a intersezione con il pannello delle attività. La forma è uguale a ogni apertura (generatore con seme) e rispetta "riduci movimento". Test in `tests/mappa.spec.js`.

Differenze rispetto alla costellazione richiesta: considera solo le app (non Quest, Journal, Archivio), i temi nascono dai tag liberi e non da un vocabolario, la disposizione è calcolata nel browser e non salvata, non c'è una versione per tastiera e lettori di schermo.

## 5. Metadati, sitemap, robots

- **Home**: `title`, `description`, `canonical`, Open Graph, Twitter Card, JSON-LD (`Organization`, `WebSite` con `SearchAction`). `manifest.json` dichiara l'icona come `image/jpeg` ma il file è WebP.
- **`sitemap.xml`**: 74 indirizzi, generata da `build.py` (46 in `content/`, 16 note del Journal, 5 PDF di normativa, 6 pagine, la Quest). Le date mancanti vengono dall'ultimo commit: il build è deterministico.
- **`robots.txt`**: scritto a mano, permette tutto, esclude `/build.py` e `/.git/`, indica la sitemap.
- **Pubblicazione**: GitHub Pages in modalità "Deploy from a branch" dal ramo `master`, con Jekyll. `_config.yml` esclude `content/journal`, `content/schede` e `docs`. Due pagine esistono solo perché Jekyll converte i `.md`: `laboratoriomatematicoOrfini.html` e `tools/report_finale.html`.
- **Offline**: `sw.js` (sito) e `allenamento/sw.js` (Quest), prima la rete.

## 6. I dati estratti

`data/attivita.json` ha **139 voci** in quattro sezioni:

| Sezione | Voci | Fonte | `tipo` |
|---|---|---|---|
| `attivita` | 48 | `database.js` senza la normativa | `arcade` 9, `simulazione` 20, `memory` 5, `immagine` 1, `infografica` 3, `video` 2, `app` 8 |
| `allenati` | 58 | `allenamento/activities/catalogo.js` (titolo e riga di descrizione) | `lezione` |
| `journal` | 15 | `content/journal/*.md`, senza la bozza del 5 novembre | `nota` |
| `archivio` | 18 | `database_verifiche.js` | `verifica` |

- `id`: nome del file in minuscolo con i trattini; prefissi `quest-`, `nota-`, `verifica-` per le altre sezioni.
- `url`: relativo alla radice del sito, identico a quello pubblicato oggi. Le lezioni della Quest usano `allenamento/#/lezione/<id>/1`, come fa già `build.py`.
- `parole`: id del vocabolario, da 1 a 7 per voce. Le ho assegnate leggendo titolo, descrizione e tag; **per le verifiche solo dai tag**, senza aprire i PDF.
- Tre titoli contengono formule (`$\pi$`, `$\phi$`, `$\Delta = b^2 - 4ac$`): in Fase 1 andranno disegnate con KaTeX, come nel resto del sito.

`data/vocabolario.json` ha **40 parole**: 24 senza padre e 16 figlie.

| Padre | Figlie |
|---|---|
| **numeri** | interi, irrazionali, potenze, MCM e MCD, espressioni |
| **polinomi** | scomposizione, prodotti notevoli, frazione algebrica |
| **equazione** | primo grado, secondo grado |
| **funzione** | retta, parabola, goniometrica, logaritmo, studio |
| **geometria** | Pitagora |

Senza padre né figlie: frazione, percentuale, proporzione, calcolo mentale, Fibonacci, disequazione, insiemi, unità di misura, probabilità, frattali, caos, automi cellulari, algoritmi, arte generativa, stampa 3D, intelligenza artificiale, modelli, lavoro, INVALSI.

Il conteggio per parola e per sezione si ottiene con `node tools/valida.mjs --riepilogo`.

### Dove mi sono allontanato dalla bozza, e perché

| Bozza | Proposta | Motivo |
|---|---|---|
| polinomi → operazioni | tolta | due sole voci; stanno su **polinomi** |
| numeri → interi, primi | **interi** resta, *primi* no | nessuna attività sui numeri primi oltre a MCM e MCD |
| random walk | non è una stella | una sola attività; sta su **probabilità**, **caos**, **frattali** |
| teoria dei giochi | non è una stella | una sola attività; sta su **modelli** |
| cartografia | non è una stella | una sola attività (Mercatore); sta su **modelli**, **proporzione**, **geometria** |
| plotter | **stampa 3D** ("stampa 3D e plotter") | il plotter è una sola app; con la stampa 3D le voci sono 6 |
| Pitagora | figlia di **geometria** | resta vicina alle altre attività di geometria |
| — | **equazione** con *primo grado* e *secondo grado* | 13 voci tra Quest e verifiche |
| — | **frazione algebrica** sotto polinomi | 10 voci; raccoglie anche equazioni e disequazioni frazionarie |
| — | **calcolo mentale**, **lavoro**, **INVALSI** | aree intere della Quest (14, 7 e 2 lezioni) |
| — | **algoritmi**, **intelligenza artificiale**, **modelli**, **espressioni**, **proporzione** | temi con 4-9 voci che altrimenti non avrebbero casa |
| Fibonacci | "successione di Fibonacci e sezione aurea" | le due parole avrebbero avuto quasi le stesse attività |
| — | **probabilità** = "probabilità e statistica" | la statistica ha una sola lezione |

Per restare a 40 non sono stelle: pi greco, radicali, esponenziale, sistema, area, solidi, piano cartesiano. Sono alias della parola più vicina, quindi la ricerca li trova.

## 7. Il validatore

`node tools/valida.mjs` (oppure `npm run valida`) esce con errore se:
- un'attività usa una parola fuori vocabolario, e in quel caso suggerisce la più vicina;
- compare un alias o il nome completo al posto dell'id;
- due parole sono quasi-duplicate (singolare e plurale, o una lettera di differenza), due stelle hanno la stessa etichetta, un alias appartiene a due parole;
- un indirizzo locale non esiste, o una lezione non è nel catalogo della Quest;
- una parola ha zero attività, oppure una sola (regola "non diventa stella");
- mancano campi, un id è ripetuto, un padre non esiste o è a sua volta figlio, un'etichetta supera le due parole o ha maiuscole non previste.

Un padre conta anche le attività delle figlie. Gli indirizzi esterni (i 2 link) sono controllati solo nella forma, perché il validatore non usa la rete.

Provato con dati sbagliati di proposito: 13 errori su 13 attesi.

## 8. Contraddizioni e punti da decidere prima della Fase 1

1. **`main` è `master`.** Il ramo pubblicato si chiama `master` (già annotato in `DECISIONI.md`). Leggo "main" come `master`.
2. **Quattro sezioni nei dati.** Il brief dice "estrai le attività dalla home" (48), ma chiede sezioni come nodi, colore per sezione prevalente e attività raggruppate per sezione. Con le sole 48 voci tutte le stelle avrebbero lo stesso colore, quindi ho incluso anche Quest, Journal e Archivio. Se preferisci le sole 48, il vocabolario si restringe: restano senza attività *primo grado*, *lavoro*, *INVALSI* e con una sola attività altre sette parole (interi, calcolo mentale, logaritmo, Pitagora, insiemi, unità di misura, probabilità).
3. **Due fonti per le stesse attività.** Oggi titolo e descrizione nascono dai meta di ogni app e passano per `build.py` → `database.js`. Il brief vuole che aggiungere un'attività richieda una sola voce in `data/attivita.json`. Le due cose insieme vogliono dire scrivere due volte, oppure scegliere chi comanda. Tre strade:
   - a. `attivita.json` comanda per la costellazione e l'elenco; `build.py` resta per Journal, schede, competenze. Titoli scritti in due posti, il validatore avvisa se divergono.
   - b. `build.py` resta la fonte e genera `attivita.json`; a mano si scrivono solo le `parole` (per esempio in un `<meta name="parole">` dell'app, come già si fa per `allenamento`). Una sola scrittura, ma non in `attivita.json`.
   - c. `attivita.json` diventa la fonte unica e `build.py` la legge. È la più pulita e la più invasiva.
   
   Consiglio **b** per le app e per le sezioni generate (Quest, Journal, Archivio), perché non duplica nulla e rispetta "content/ è riservata a build.py".
4. **Sitemap e robots.** Li genera già `build.py`. Se li genera anche `tools/genera.mjs`, due script scrivono lo stesso file. Propongo che resti `build.py` e che `npm run build` lo chiami.
5. **GitHub Actions al posto di Jekyll.** Passando a "Source = GitHub Actions" Jekyll non gira più da solo: spariscono le due pagine nate dai `.md` e l'esclusione di `docs/` e dei sorgenti del Journal, a meno che il workflow non lanci Jekyll o copi solo i file giusti. Va deciso come, e il workflow deve avere Python oltre a Node se chiama `build.py`.
6. **Librerie in locale.** `CLAUDE.md` chiede CDN con versione e `integrity` (tranne KaTeX); il brief chiede librerie in locale. Per le pagine nuove seguo il brief. Le app non si toccano. `marked` sulla home e `three` su `galaxy.html` restano da CDN finché non decidi diversamente.
7. **Classe nei titoli delle verifiche.** I titoli dell'Archivio sono del tipo "Verifica Classe 1 EL, Maggio 2026". La regola del 30 ottobre è "nessuna etichetta di classe visibile allo studente". Nel Journal i titoli sono già mostrati senza classe: propongo lo stesso per elenco e costellazione.
8. **"Chi sono"** oggi è un pannello della home. Con la home a costellazione serve una destinazione: una pagina nuova `chi-sono.html`, oppure un pannello che si apre dal menu.
9. **`tipo` per le voci senza filtro.** Otto app hanno `game_type: standard` e nessun filtro in home. Le ho segnate `app`. Per le altre sezioni ho usato `lezione`, `nota`, `verifica`.
10. **Una sola attività = errore.** Il validatore blocca una parola con una sola attività. È la tua regola, ma significa che un'attività nuova su un tema nuovo va agganciata a una parola esistente finché non ne arriva una seconda.
11. **La nota in bozza** ("Ruote che non sobbalzano") non è nei dati. Entra quando togli `stato: bozza`.

## 9. Strumenti disponibili in questa sessione

- Skill `frontend-design`: **non installata**. Ci sono `impeccable` e `design-taste-frontend`, che `CLAUDE.md` riserva a una tua richiesta esplicita.
- Playwright: disponibile come `@playwright/test` (i test del repo). Il plugin MCP non c'è, ma per screenshot a 380, 1280 e 1920 px basta quello che c'è.
- Chrome DevTools MCP: **non disponibile**. Per Lighthouse servirà installare `lighthouse` come dipendenza di sviluppo, oppure misurare a mano da Chrome.

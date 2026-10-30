# Proposta di architettura — Orfini Math Lab

Fase 2, revisione 3 (2026-10-30). **Solo documento: nessun file del sito è stato modificato.** Le versioni precedenti sono nella storia git del ramo `riorganizzazione`. Le decisioni da approvare sono raccolte in fondo.

## Cosa vuole il docente (in sintesi)

- Il sito è uno **strumento operativo per gli studenti**. I colleghi li forma il docente di persona; poi trovano ciò che serve con i filtri.
- Si organizza **per argomento**. Niente etichette di classe o di livello visibili: con le quarte capita di riprendere attività da prima, e nessuno deve sentirsi mortificato.
- **Allenati è una sezione a parte**: la palestra di tutte le altre attività, e cresce da sola.
- **Niente scatole cinesi.** Il sito è vivo: si devono poter aggiungere o cambiare attività senza rifare la struttura.
- **Diario di bordo**: piccoli articoli su come un'app è stata usata in classe, con immagini e video di istruzioni. È uno strumento didattico ricorsivo, il diario di bordo di un diario di bordo.

## Principi

1. **Al massimo tre livelli.** Home → sezione → attività, oppure Home → Diario → articolo → attività.
2. **La struttura si genera da sola.** Pagine d'argomento, collegamenti alla palestra e collegamenti al Diario li calcola il build dai dati. Aggiungere un'attività o un articolo non richiede di toccare nessun'altra pagina.
3. **Scheda minima.** Per un'attività bastano titolo, descrizione, argomento e formato; tutto il resto è automatico. Senza scheda l'attività entra comunque nel catalogo, come oggi.
4. **Nessun file di attività si sposta né si rinomina.** QR code, Classroom, Instagram e circolari continuano a funzionare.
5. **HTML statico prima, JavaScript dopo.** Ogni pagina esce dal build già leggibile senza JS; il JS aggiunge i filtri istantanei.
6. **Nessuna classe visibile allo studente.** La classe resta nei dati, per il filtro "programma" dei docenti, chiuso per impostazione predefinita.
7. **Si rifinisce l'esistente**: tema scuro "laboratorio", font, pulsante del tema (`orfini_theme`), cookie consent.

---

## 1. Mappa del sito

```
Home  (index.html)
 ├── Attività        /attivita/              tutto il materiale, filtri per argomento e formato
 │    └── argomento  /attivita/polinomi/     pagina generata: tutto ciò che riguarda i polinomi
 ├── Allenati        allenamento/            la palestra: Orfini Math Quest + Calcolo veloce
 ├── Laboratorio     /laboratorio/           arte + codice, "Esplora in 3D" (galaxy.html)
 ├── Diario di bordo /diario/                articoli datati
 │    └── articolo   /diario/2026-11-12-math-pool-retta/
 └── Chi sono        /chi-sono/              autore, perché queste scelte, La scuola
piè di pagina:  Verifiche · Competenze Riforma 2017 · Normativa · La scuola · Privacy
```

**Menu: 5 voci** (`Attività · Allenati · Laboratorio · Diario · Chi sono`) più il pulsante del tema. La voce "Journal" di oggi, che porta alla home, diventa finalmente il Diario.

### Home
1. Due righe su cos'è il sito; nome e ruolo dell'autore.
2. **Parti da qui**: 6-8 attività scelte dal docente.
3. **Dal diario**: gli ultimi 3 articoli.
4. **Argomenti**: riquadri verso le pagine d'argomento (Numeri, Polinomi, Disequazioni, Retta, Funzioni, Irrazionali, Geometria, Logica).
5. **Allenati** e **Laboratorio** in evidenza.
6. Piè di pagina con la data dell'ultimo aggiornamento.

### Attività e pagine d'argomento
- `/attivita/` mostra tutto. Filtri **argomento** e **formato**, più la ricerca; "Filtri per docenti" (programma, indirizzo) è chiuso.
- `/attivita/<argomento>/` è generata dai dati. Le attività si ordinano in modo neutro per formato: prima ciò che **spiega** (simulazioni, spiegazioni animate, video), poi ciò che **allena** (memory), poi le **sfide** (arcade). Le date di aggiornamento e gli articoli del Diario non cambiano l'ordine. Nessun passo numerato: aggiungi un'attività con quell'argomento e compare da sola al suo posto.
- **Ogni scheda di attività** (riquadro nella griglia, non una pagina in più) mostra:
  - titolo, descrizione e pulsante **Apri**;
  - **Allenati su questo**: le lezioni della Quest collegate, che `build.py` già calcola nel campo `allenamento`;
  - **Dal diario (n)**: gli articoli che ne parlano;
  - **Spiegami**: la spiegazione animata, se c'è.

  Nessuna etichetta di classe (oggi la mette `UIManager.js:353`).

### Allenati (la palestra)
- La voce di menu porta alla Quest (`allenamento/`), invariata. Calcolo veloce ne fa già parte come area, e la pagina `calcolo-mentale.html` resta dov'è.
- **Cresce da sola.** Quando si aggiunge una lezione alla Quest (da `activities/_modello.js`, importata in `catalogo.js`), il build successivo la collega alle attività del sito che trattano lo stesso argomento, e ogni attività mostra "Allenati su questo".
- Possibile più avanti: il collegamento inverso, cioè nella Quest un "vedi l'attività sul sito" accanto alla lezione. Toccherebbe la Quest, quindi è da decidere a parte.

### Laboratorio
Una pagina generata: tutte le attività con `laboratorio: true` (Pen Plotter, Chaos Lab, Random Walk 3D, Snake of Life, Automi e particelle, Sketch to Pattern, Albero di Pitagora, Sierpinski), più l'ingresso "Esplora in 3D".

---

## 2. Il Diario di bordo

### Cosa è
Articoli brevi e datati, firmati dall'autore:
- **In classe**: "come abbiamo usato Math Pool in quarta: cosa ha funzionato, cosa no";
- **Istruzioni**: video o immagini su come si usa un'app;
- **Dietro le quinte**: perché un'app è nata o è cambiata. È il diario di bordo del diario di bordo: il sito racconta anche la propria evoluzione.

### Come si scrive un articolo
Un file Markdown in `content/diario/`, scritto in VS Code partendo da un modello:

```markdown
---
titolo: Math Pool in classe: la retta diventa un tiro di sponda
data: 2026-11-12
tipo: in-classe            # in-classe | istruzioni | dietro-le-quinte
attivita: [math-pool-retta]
sommario: Un'ora di laboratorio sul coefficiente angolare, giocando a biliardo sulla LIM.
copertina: lim-tiro.jpg
---

Testo dell'articolo, con **grassetto**, elenchi, formule come $m = \frac{\Delta y}{\Delta x}$…

![La traiettoria proiettata sulla LIM](lim-tiro.jpg)

[video istruzioni-math-pool.mp4]
```

Immagini e video si mettono nella cartella `content/diario/media/`. Poi si lancia il build e si guarda l'anteprima in locale: l'articolo è online al prossimo push su `master`.

Nell'esempio "in quarta" è il docente che scrive. Nei testi rivolti agli studenti vale lo stesso principio di sempre: la classe si nomina solo se serve al racconto.

### Cosa fa il build
- Converte il Markdown in una pagina HTML statica `/diario/<data>-<titolo>/`, con canonical, anteprima social, autore e data visibili.
- **Ricomprime le immagini** in WebP con Pillow (già nel `.venv`) e **cancella i metadati EXIF**, tra cui la posizione GPS delle foto fatte col telefono. L'originale non viene pubblicato.
- Rende le formule con KaTeX, come nel resto del sito.
- Aggiorna `/diario/` (elenco per data, filtrabile per tipo e per attività), "Dal diario" in home e "Dal diario (n)" sulle schede delle attività.
- **Ricorsività senza rotture.** Ogni articolo punta all'attività con il suo `id` stabile, non con l'URL del file. Ricorda anche la data in cui è stato scritto. Se l'attività viene aggiornata dopo, l'articolo mostra in automatico "L'attività è stata aggiornata dopo questo articolo". Se viene archiviata, il link porta all'archivio. Così gli articoli non perdono significato quando le attività cambiano.

### Video
- **Brevi (≤ 20 MB, 1-2 minuti)**: file mp4 nel repository. Il sito pubblicato pesa oggi 46 MB su 1 GB disponibile, ma ogni video resta per sempre nella storia git (oggi 148 MB).
- **Lunghi**: YouTube non in elenco, incorporato con `youtube-nocookie.com` e **caricato solo dopo il consenso** (categoria "funzionali" del cookie consent, che esiste già). Prima del consenso c'è un riquadro con l'anteprima e il link.

### Privacy (vincolante)
- **Mai volti, nomi, voci o lavori firmati degli studenti** senza liberatoria. Vanno bene foto della LIM, del quaderno senza nome, delle mani, dello schermo.
- Il modello dell'articolo contiene un promemoria di controllo prima della pubblicazione.
- Regole della scuola su foto e video in classe: **[DA VERIFICARE con la scuola]**.
- Nessun risultato di classe inventato: dove serve un dato, `[DA COMPILARE DAL DOCENTE]`.

### Motore: proposta
Il Markdown va trasformato in HTML. Le opzioni:

| Opzione | Pro | Contro |
|---|---|---|
| **A. `build.py` + libreria Python `markdown`** (open source, BSD) | una sola pipeline; l'anteprima locale è identica al sito; immagini ottimizzate | da installare nel `.venv` con versione fissata |
| B. Jekyll di GitHub Pages | nessuna installazione | l'anteprima locale richiede Ruby; due motori diversi nello stesso sito; niente ottimizzazione immagini |
| C. Markdown convertito nel browser (`marked`, già usato) | nessuna installazione | contenuto invisibile senza JS: contro i vincoli del brief |

**Consigliata: A.** `build.py` legge già Markdown con intestazione (oggi per `content/notes/`): si estende quel codice.

---

## 3. Metadati

### Scheda minima (`dati/attivita.json`)
Solo ciò che il build non può indovinare. Ogni campo è facoltativo tranne `url`; se una scheda manca, l'attività resta nel catalogo con i dati che `build.py` ricava già oggi.

| Campo | Note |
|---|---|
| `url` | percorso attuale del file (chiave, non cambia) |
| `id` | nome breve stabile (`math-pool-retta`), usato dal Diario; se manca si ricava dal nome del file |
| `titolo` | parlante, senza LaTeX grezzo e senza classi |
| `descrizione` | 1-2 frasi (≤ 160 caratteri) |
| `argomenti` | 1-3 voci da `dati/argomenti.json`: generano le pagine d'argomento |
| `formato` | `simulazione`, `spiegazione`, `video`, `memory`, `arcade`, `esplorazione`, `infografica`, `link` |
| `laboratorio` | `true` per farla comparire in Laboratorio |
| `in_evidenza` | posizione in "Parti da qui" (1-8) |
| `stato` | `stabile` (predefinito), `in-prova`, `archiviata` |
| `nota` | promemoria interni, non pubblicati |

**Calcolati in automatico:** date di creazione e aggiornamento (dalla storia git), lezioni della Quest collegate, spiegazione animata (file `*_spiegazione.html`), articoli del Diario, miniatura, classi del programma (dai tag esistenti, solo per il filtro docenti), dipendenze esterne (avviso "serve la connessione a …").

Dove un dato è incerto si scrive `"[DA VERIFICARE]"`; il build lo segnala in un rapporto.

### Esempio
```json
{
  "url": "content/apps/math_pool_retta_pianocartesiano.html",
  "id": "math-pool-retta",
  "titolo": "Math Pool: biliardo sul piano cartesiano",
  "descrizione": "Calcola pendenza ed equazione della retta per mandare la palla in buca, anche di sponda.",
  "argomenti": ["retta", "parabola"],
  "formato": "arcade"
}
```
```json
{
  "url": "content/apps/pen_plotter__23v2_8K.html",
  "id": "studio-plotter-cnc",
  "titolo": "Studio Plotter CNC",
  "descrizione": "Dal disegno generativo al G-code: tracciati per pen plotter e CNC, con anteprima 3D.",
  "argomenti": ["arte-generativa", "geometria-3d"],
  "formato": "simulazione",
  "laboratorio": true,
  "nota": "Strumento da PC per la Ender 3 V2."
}
```

### Argomenti (`dati/argomenti.json`, bozza)
Otto pagine d'argomento per lo studente, ognuna con i suoi sotto-argomenti per il filtro:

| Pagina | Sotto-argomenti |
|---|---|
| Numeri e calcolo | operazioni in Z, frazioni, percentuali, MCD e mcm, misura |
| Polinomi | operazioni, prodotti notevoli, scomposizioni, frazioni algebriche |
| Equazioni e disequazioni | 1° grado, 2° grado, frazionarie, sistemi |
| Retta e piano cartesiano | retta, pendenza |
| Funzioni e grafici | classificazione, parabola, goniometria, logaritmi |
| Numeri irrazionali | √2, π, sezione aurea e Fibonacci, esaustione |
| Geometria e spazio | Pitagora, proiezioni, solidi, fasi lunari |
| Logica e insiemi | insiemi, logica, teoria dei giochi, probabilità |

Più gli argomenti del Laboratorio (arte generativa, frattali, automi cellulari, sistemi dinamici, fabbricazione digitale), che non hanno una pagina propria: stanno in `/laboratorio/`.

### Programma (solo filtro docenti)
`EL` Elettrico-Elettronico · `MEC` Meccanico · `GP` Grafica [DA VERIFICARE] · `MA` Manutenzione [DA VERIFICARE].

---

## 4. Vecchio URL → nuovo URL

**Nessun file cambia indirizzo.**

| Vecchio | Nuovo | Come resta funzionante |
|---|---|---|
| `content/**`, `rif_norm_2017/**`, `allenamento/`, `calcolo-mentale.html`, `verifiche.html`, `competenze.html`, `galaxy.html`, `scuola.html`, `privacy-policy.html`, `404.html` | identici | cambia solo il menu |
| `laboratoriomatematicoOrfini.html`, `tools/report_finale.html` (generati da Jekyll) | identici | restano (D5); il primo è la base del testo di `/chi-sono/` |
| `index.html` | identico, nuovi contenuti | — |
| `index.html?tag=1%20EL` (9 link in `scuola.html`, Mappa 3D) | `attivita/?programma=1EL` | la home riconosce `?tag=`; senza JS c'è un link |
| `index.html#about` | `chi-sono/` | la home riconosce `#about` |
| filtro "Video" | `attivita/?formato=video` | nuovo indirizzo condivisibile |
| `/?q=` (dati strutturati) | `attivita/?q=` | si corregge il `SearchAction` |

**Nuovi indirizzi:** `attivita/` e 8 pagine d'argomento, `laboratorio/`, `diario/` e un indirizzo per articolo, `chi-sono/`, `archivio/`. **Stub di redirect: nessuno** (nessun file si sposta); il passo finale controlla che ogni vecchio URL risponda 200.

---

## 5. File che verrebbero toccati

**Nuovi:**
- `dati/attivita.json`, `dati/argomenti.json`;
- `content/diario/` (articoli, `_modello.md`, `media/`);
- `pagine.py`: modulo del build che scrive le pagine;
- `modelli/` (indice, argomento, articolo);
- `indici.css` e `indici.js`;
- `tools/controlla_metadati.py`;
- `tests/navigazione.spec.js`: menu, filtri, pagine senza JS, vecchi URL a 200, nessuna etichetta di classe nelle pagine per studenti;
- `_config.yml`: solo `exclude:` per `docs/` e per i sorgenti Markdown del diario.

Le pagine generate sono `attivita/**`, `laboratorio/`, `diario/**`, `chi-sono/` e `archivio/`.

**Modificati:**

| File | Cosa cambia |
|---|---|
| `build.py` | legge `dati/` e `content/diario/`, date da git, chiama `pagine.py`, sitemap con le nuove pagine, catalogo per i crawler visibile e con link |
| `index.html`, `index.css` | menu e nuova home |
| `competenze.html`, `verifiche.html`, `scuola.html`, `calcolo-mentale.html`, `404.html`, `galaxy.html` | solo menu e piè di pagina (sostituiti dal build tra marcatori `<!-- NAV_START -->…<!-- NAV_END -->`) |
| `privacy-policy.html` | tema chiaro e voce sugli eventuali video YouTube |
| `database.js`, `sitemap.xml` | rigenerati dal build |
| `.venv` | libreria `markdown` con versione fissata (se D3 = A) |

**Non toccati:** `content/apps/` (le app che fanno eccezione sono un lavoro a parte), la Quest, gli script `auto_sidecar.py`, `standardize_apps.py` e `thumbnails.py`, il cookie consent, i PDF.

---

## 6. Ordine di lavoro (Fase 3)

1. **Metadati** (`dati/`), senza cambiamenti visibili.
2. **Menu, home, Attività e pagine d'argomento**, Laboratorio, Chi sono. *Cambia l'aspetto: mi fermo per il via libera.*
3. **Filtri** in Attività. *Mi fermo.*
4. **Parti da qui**: ti chiedo la selezione. *Mi fermo.*
5. **Diario**: motore, modello d'articolo e un primo articolo di prova con testo `[DA COMPILARE DAL DOCENTE]`. *Mi fermo.*
6. **Tema chiaro** su pagine nuove, privacy e 404. *Mi fermo.*
7. **Controllo** dei vecchi URL e del contenuto senza JS.

---

## Decisioni da approvare

| # | Decisione | Proposta |
|---|---|---|
| D1 | Menu `Attività · Allenati · Laboratorio · Diario · Chi sono`; Verifiche, Competenze e Scuola nel piè di pagina | ✅ consigliata |
| D2 | Scheda minima in JSON (`dati/attivita.json`), tutto il resto calcolato | ✅ consigliata |
| D3 | Motore del Diario: **A** (`build.py` + libreria `markdown`) | ✅ consigliata |
| D4 | Pagine d'argomento generate, ordinate per formato (spiega → allena → sfida), senza passi numerati | ✅ consigliata |
| D5 | Niente `.nojekyll`; `_config.yml` con `exclude:`. Da decidere se `orfini-games/` e `orfini-math-quest.zip` restano pubblici | ✅ consigliata, il resto da decidere |
| D6 | GP = Grafica, MA = Manutenzione | da confermare |
| D7 | Video brevi nel repository, lunghi su YouTube con consenso | ✅ consigliata |
| D8 | Regole della scuola su foto e video in classe | [DA VERIFICARE con la scuola] |

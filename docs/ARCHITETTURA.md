# Proposta di architettura — Orfini Math Lab

Fase 2, revisione 2 (2026-10-30). **Solo documento: nessun file del sito è stato modificato.** Parte dalla bozza del brief, adattata ai dati di `INVENTARIO.md` e `AUDIT.md` e alle indicazioni del docente dopo la prima versione:

> Il sito deve essere uno **strumento operativo per gli studenti**. I colleghi li formo io nelle sessioni di formazione: se qualcosa serve loro, lo trovano con i filtri. Bene i percorsi sensati, purché sia facile orientarsi. Con le quarte a volte propongo attività da prima o da seconda, e **non voglio mortificare nessuno**.

Le scelte che richiedono il via libera sono raccolte in fondo ("Decisioni da approvare").

## Principi

1. **Prima gli studenti.** La navigazione serve a chi deve *usare* un'attività in classe o a casa, spesso da telefono o su LIM, con il docente che dice "aprite il percorso sulla retta". Non c'è una sezione "Docenti": i colleghi usano la stessa pagina Attività, con i filtri.
2. **Si organizza per argomento, mai per classe, in tutto ciò che vede lo studente.** Niente "1 EL", "Prima", "Biennio" o "livello base" su schede, percorsi e titoli. La classe resta nei metadati e serve solo al filtro "anno del programma", che è chiuso per impostazione predefinita. Così una quarta che ripassa le frazioni apre il percorso "Numeri e frazioni" come chiunque altro.
3. **Nessun file di attività si sposta né si rinomina.** Cambiano navigazione, pagine indice e metadati. I QR code, Classroom, Instagram e le circolari continuano a funzionare e non servono redirect.
4. **Una sola fonte di verità**: `dati/attivita.json`. Da lì `build.py` genera `database.js`, `sitemap.xml`, le pagine indice, i percorsi, i filtri e il catalogo per i crawler.
5. **HTML statico prima, JavaScript dopo.** Ogni pagina indice esce dal build già completa di link veri, leggibile senza JS. Il JS aggiunge solo i filtri istantanei.
6. **Si rifinisce l'esistente**: stesso tema scuro "laboratorio", stessi font, stesso pulsante del tema (`orfini_theme`), stesso cookie consent.

---

## 1. Mappa del sito

```
Orfini Math Lab  (index.html)
│
├── PERCORSI  /percorsi/ ───────── per argomento, ognuno in tre momenti: Capire · Allenarsi · Mettersi alla prova
│   ├── Numeri e calcolo           /percorsi/numeri/
│   ├── Polinomi e scomposizioni   /percorsi/polinomi/          ← primo percorso (era "Algebra del biennio")
│   ├── Equazioni e disequazioni   /percorsi/disequazioni/
│   ├── La retta nel piano         /percorsi/retta/
│   ├── Funzioni e grafici         /percorsi/funzioni/
│   ├── Numeri irrazionali         /percorsi/irrazionali/
│   ├── Geometria e spazio         /percorsi/geometria/
│   └── Logica e insiemi           /percorsi/logica/
│
├── ATTIVITÀ  /attivita/ ───────── tutte le attività, filtri: ARGOMENTO · FORMATO · ricerca
│                                  "Filtri per docenti" (chiuso): anno del programma, indirizzo, durata
│
├── ALLENATI  allenamento/ ─────── Orfini Math Quest (invariata) + Calcolo veloce (calcolo-mentale.html)
│
├── LABORATORIO  /laboratorio/ ─── arte + codice: Pen Plotter, Chaos Lab, Random Walk 3D, Snake of Life,
│                                  Automi e particelle, Sketch to Pattern, Albero di Pitagora, Sierpinski
│                                  + "Esplora in 3D" (galaxy.html)
│
├── CHI SONO  /chi-sono/ ───────── autore, ruolo, perché queste scelte [DA COMPILARE DAL DOCENTE];
│                                  portfolio (attività per data, con versione); La scuola (scuola.html)
│
├── piè di pagina, "Per i docenti": Verifiche (verifiche.html) · Competenze Riforma 2017 (competenze.html) ·
│                                  Normativa (rif_norm_2017/) · Materiali (infografiche, video)
│
├── /journal/ ──────────────────── RISERVATO, non in menu finché non esiste (fuori ambito)
├── /archivio/ ─────────────────── ciò che esce dalla struttura (vuoto all'inizio)
└── privacy-policy.html, 404.html (invariate, + tema chiaro)
```

**Menu principale (5 voci invece di 9):** `Percorsi · Attività · Allenati · Laboratorio · Chi sono`, più il pulsante del tema. Il logo riporta alla home.
- "Journal" esce dal menu finché non esiste: oggi l'etichetta porta alla home.
- "Calcolo veloce" entra in "Allenati" (pagina della Quest e pulsante in home).
- "Archivio" (verifiche), "Competenze" e "La Scuola" passano nel piè di pagina e in "Chi sono". Restano a un clic, ma non affollano il menu di chi studia.
- "Video" diventa un formato filtrabile: `/attivita/?formato=video`.
- "Mappa" diventa "Esplora in 3D" (in home e in Laboratorio).

Su telefono il menu resta a scomparsa come oggi. Su LIM le 5 voci stanno su una riga con caratteri grandi.

### Perché niente sezione "Docenti"

Hai ragione: chi ha fatto la formazione sa cosa cerca e la pagina Attività con i filtri basta. Servono due condizioni:
1. **Gli argomenti devono avere le parole dei docenti** ("scomposizioni", "disequazioni frazionarie", "retta"), non nomi di gioco. Per questo si usa il vocabolario controllato (§2).
2. **Ogni attività ha 2-3 righe d'uso** (quando usarla, quanto dura, su quali dispositivi), visibili nella scheda. Servono al collega dopo la formazione, e anche a te per il portfolio.

Verifiche, competenze e normativa restano raggiungibili dal piè di pagina e da "Chi sono".

### Home (`index.html`, stesso URL)

1. **Intestazione breve**: cos'è il sito, in due righe; nome e ruolo dell'autore visibili.
2. **Parti da qui**: 6-8 attività scelte da te (campo `in_evidenza`; ti chiederò la selezione al passo 3.4).
3. **Percorsi**: gli 8 riquadri per argomento, il cuore del sito.
4. **Allenati** (Quest e Calcolo veloce) e **Laboratorio** (con "Esplora in 3D").
5. **Ultimi aggiornamenti**: le 4-5 attività aggiornate più di recente.
6. **Piè di pagina**: "Per i docenti", autore, scuola, Instagram, privacy, data dell'ultimo aggiornamento.

La griglia filtrabile di oggi si sposta in `/attivita/`, **senza l'etichetta di classe sulle schede**: oggi la mette `UIManager.js:353`, nella nuova pagina non c'è.

### Come è fatto un percorso (senza far sentire nessuno "indietro")

Ogni percorso è una pagina statica con:
- **una frase d'ingresso** che parla dell'argomento, non del livello: "Scomporre un polinomio vuol dire…" [DA COMPILARE DAL DOCENTE, con bozza proposta];
- **tre momenti**, invece dei livelli di difficoltà:
  - **Capire**: simulazioni, dimostrazioni visive, spiegazioni animate;
  - **Allenarsi**: memory e lezioni della Quest collegate;
  - **Mettersi alla prova**: le sfide arcade;
- **passi numerati** dentro ogni momento, con un indirizzo diretto per ciascuno (`/percorsi/polinomi/#passo-6`). Così puoi dire "aprite il passo 6", o metterlo in un QR, senza che la classe veda da dove parte.

Ripassare cose del primo anno in quarta diventa "apriamo *Capire* del percorso polinomi", che non porta nessuna etichetta. Le attività con grafica e ambientazione da gioco adulto (arcade, laboratorio) aiutano: niente nel percorso dice "questa è roba da prima".

### Scheda attività (proposta D4)

Una pagina statica per attività, generata dai metadati: `/attivita/<id>/` (es. `/attivita/arcade-mcd-mcm/`). Contiene:
- titolo, descrizione, argomento, uso in classe, durata, dispositivi;
- data, versione, motivazioni;
- "Apri l'attività" verso l'URL attuale, la spiegazione animata, i percorsi in cui compare;
- in futuro, la nota del Journal.

Le classi del programma compaiono solo in una riga discreta in fondo ("Nel programma di: …"), utile ai colleghi. **[DA DECIDERE: mostrarla o no.]**

---

## 2. Schema dei metadati

**Formato: JSON**, in `dati/` nella root. Motivi:
- `content/` è riservata a `build.py`.
- JSON è già usato per i sidecar.
- Python e JavaScript lo leggono senza librerie nuove (PyYAML non è installato in `.venv`).

| File | Contenuto |
|---|---|
| `dati/attivita.json` | una scheda per attività (fonte di verità) |
| `dati/argomenti.json` | vocabolario controllato: ambiti e argomenti |
| `dati/classi.json` | codici classe → anno + indirizzo (solo per il filtro docenti) |
| `dati/percorsi.json` | percorsi: id, titolo, frase d'ingresso, passi divisi in Capire / Allenarsi / Mettersi alla prova |

**Priorità nel build:** `dati/attivita.json` > meta dell'HTML > sidecar > euristiche di `build.py` (tag dedotti, Gemini). Un'attività assente dal file resta nel catalogo come oggi: niente sparisce per una scheda dimenticata.

**Campi incerti:** si scrive letteralmente `"[DA VERIFICARE]"` (dato da controllare) o `"[DA COMPILARE DAL DOCENTE]"` (testo che solo tu puoi scrivere). Il build li tratta come vuoti e li elenca in un rapporto.

### Campi della scheda

| Campo | Tipo | Obbl. | Visibile allo studente? | Note |
|---|---|---|---|---|
| `id` | testo | ✔ | (URL) | stabile e leggibile (`arcade-mcd-mcm`), diventa `/attivita/<id>/` |
| `url` | testo | ✔ | (link) | percorso attuale del file, non cambia |
| `titolo` | testo | ✔ | sì | parlante, senza LaTeX grezzo e senza classi |
| `descrizione` | testo | ✔ | sì | 1-2 frasi, massimo 160 caratteri (diventa la `meta description`) |
| `ambito` | id | ✔ | sì | da `argomenti.json`, allineato alle aree della Quest |
| `argomenti` | lista di id | ✔ | sì | 1-3 argomenti; sono i filtri principali |
| `formato` | id | ✔ | sì | `arcade`, `memory`, `simulazione`, `esplorazione`, `spiegazione`, `video`, `infografica`, `immagine`, `link`, `documento` |
| `etichette` | lista | | sì | secondarie: `Arcade Challenge`, `3D`, `AI`… |
| `sezioni` | lista | ✔ | — | dove compare: `laboratorio`, `allenati` (le attività stanno tutte in Attività) |
| `programma` | lista di codici | ✔ | **no** (solo filtro docenti) | classi in cui l'argomento è in programma: `1EL`, `3MEC`… Prima si chiamava `classi`. |
| `durata_min` | numero | | sì | durata indicativa in classe |
| `dispositivi` | lista | ✔ | sì | `pc`, `lim`, `tablet`, `telefono` |
| `data_creazione` | AAAA-MM-GG | ✔ | sì (scheda) | primo commit git del file |
| `data_aggiornamento` | AAAA-MM-GG | ✔ | sì (scheda) | ultimo commit git (calcolabile dal build) |
| `versione` | testo | | sì (scheda) | etichetta libera scelta da te |
| `stato` | id | ✔ | solo se ≠ stabile | `stabile`, `in-prova`, `da-verificare`, `archiviata` |
| `dipendenze_esterne` | lista | | avviso | es. "richiede connessione a ai.studio" |
| `competenze` | lista | | no | codici Riforma 2017 (`MAT_K1`…) per `competenze.html` |
| `spiegazione` | testo | | sì | URL della spiegazione animata |
| `allenamento` | lista di id | | sì | lezioni della Quest collegate |
| `percorsi` | lista | | sì | `{ "id": "polinomi", "momento": "capire", "passo": 3 }` |
| `in_evidenza` | numero o `null` | | sì | posizione in "Parti da qui" (1-8) |
| `uso_in_classe` | testo | | sì (scheda) | 2-3 righe: quando e come usarla |
| `motivazioni` | testo | | sì (scheda) | perché esiste e perché è fatta così (portfolio) |
| `journal` | testo o `null` | | sì | **riservato**: URL della futura nota del Journal |
| `nota` | testo | | no | promemoria interni |

### Esempio 1: `MCD_mcm_1el_001.html`

```json
{
  "id": "arcade-mcd-mcm",
  "url": "content/apps/MCD_mcm_1el_001.html",
  "titolo": "Arcade Challenge: MCD e mcm",
  "descrizione": "Gioco arcade a sfida per allenare m.c.m., M.C.D. e scomposizione in fattori primi.",
  "ambito": "numeri",
  "argomenti": ["mcd-mcm", "fattori-primi"],
  "formato": "arcade",
  "etichette": ["Arcade Challenge", "Spiegazione animata"],
  "sezioni": ["allenati"],
  "programma": ["1EL", "1GP", "1MA"],
  "durata_min": "[DA VERIFICARE]",
  "dispositivi": ["pc", "lim", "telefono"],
  "data_creazione": "2025-12-08",
  "data_aggiornamento": "2026-10-25",
  "versione": "[DA COMPILARE DAL DOCENTE]",
  "stato": "stabile",
  "dipendenze_esterne": [],
  "competenze": "[DA VERIFICARE]",
  "spiegazione": "content/apps/MCD_mcm_spiegazione.html",
  "allenamento": [],
  "percorsi": [{ "id": "numeri", "momento": "mettersi-alla-prova", "passo": 1 }],
  "in_evidenza": null,
  "uso_in_classe": "[DA COMPILARE DAL DOCENTE]",
  "motivazioni": "[DA COMPILARE DAL DOCENTE]",
  "journal": null,
  "nota": "URL storico: non rinominare. 'competenze' vuoto: i tag attuali non hanno codici MAT_."
}
```

### Esempio 2: `pen_plotter__23v2_8K.html`

```json
{
  "id": "studio-plotter-cnc",
  "url": "content/apps/pen_plotter__23v2_8K.html",
  "titolo": "Studio Plotter CNC",
  "descrizione": "Dal disegno generativo al G-code: tracciati per pen plotter e CNC, con anteprima 3D.",
  "ambito": "arte-codice",
  "argomenti": ["arte-generativa", "geometria-3d", "fabbricazione-digitale"],
  "formato": "simulazione",
  "etichette": ["3D", "G-code", "Strumento"],
  "sezioni": ["laboratorio"],
  "programma": ["3MEC", "4EL", "5EL"],
  "durata_min": "[DA VERIFICARE]",
  "dispositivi": ["pc"],
  "data_creazione": "2026-07-15",
  "data_aggiornamento": "2026-10-16",
  "versione": "[DA COMPILARE DAL DOCENTE]",
  "stato": "stabile",
  "dipendenze_esterne": ["openscad-wasm (export OpenSCAD)", "raw.githubusercontent.com (confini geografici)"],
  "competenze": ["MAT_C4"],
  "spiegazione": null,
  "allenamento": ["trigonometria", "solidi", "aree-perimetri", "pitagora"],
  "percorsi": [],
  "in_evidenza": null,
  "uso_in_classe": "[DA COMPILARE DAL DOCENTE]",
  "motivazioni": "[DA COMPILARE DAL DOCENTE]",
  "journal": null,
  "nota": "Strumento da PC per la Ender 3 V2: il telefono non è un obiettivo."
}
```

Le date degli esempi vengono dalla storia git (primo e ultimo commit del file), non dal campo `date` attuale, che dipende dalla data di modifica del file.

### Vocabolario degli argomenti (bozza di `dati/argomenti.json`)

| Ambito | Argomenti |
|---|---|
| `numeri` Numeri | `operazioni-z`, `frazioni`, `percentuali`, `mcd-mcm`, `fattori-primi`, `misura` |
| `polinomi` Polinomi | `operazioni-polinomi`, `prodotti-notevoli`, `scomposizioni`, `frazioni-algebriche` |
| `equazioni` Equazioni e disequazioni | `disequazioni-primo-grado`, `disequazioni-secondo-grado`, `disequazioni-frazionarie`, `sistemi-disequazioni` |
| `rette` Funzioni lineari e rette | `retta`, `pendenza` |
| `funzioni` Funzioni e modelli | `classificazione-funzioni`, `parabola`, `goniometria`, `logaritmi` |
| `irrazionali` Numeri irrazionali | `radice-di-2`, `pi-greco`, `sezione-aurea`, `fibonacci`, `esaustione` |
| `geometria` Geometria | `pitagora`, `proiezioni`, `geometria-3d`, `fasi-lunari` |
| `dati` Dati e previsioni | `probabilita`, `teoria-dei-giochi` |
| `logica` Logica e insiemi | `insiemi`, `logica` |
| `arte-codice` Arte e codice | `arte-generativa`, `frattali`, `automi-cellulari`, `sistemi-dinamici`, `fabbricazione-digitale` |

I primi sei ambiti e `dati`, `geometria` corrispondono alle aree della Quest. `irrazionali`, `logica` e `arte-codice` esistono solo nel sito.

### Programma (`dati/classi.json`, solo per il filtro docenti)

| Codice | Indirizzo |
|---|---|
| `EL` | Elettrico-Elettronico |
| `MEC` | Meccanico |
| `GP` | Grafica [DA VERIFICARE] |
| `MA` | Manutenzione [DA VERIFICARE] |

---

## 3. Percorsi (bozza: l'ordine va confermato da te)

Gli 8 percorsi coprono tutte le 42 app tranne quelle del Laboratorio; un'attività può stare in più percorsi. Il primo da costruire (passo 3.5) è **Polinomi e scomposizioni**: è il vecchio "Algebra del biennio", rinominato perché "biennio" è proprio l'etichetta che non vogliamo mostrare.

### Polinomi e scomposizioni (il primo da costruire)

| Momento | Passo | Attività | Lezione Quest |
|---|---|---|---|
| Capire | 1 | Esploratore grafico: operazioni con i polinomi (`operazioni_polinomi_graph`) | monomi |
| Capire | 2 | Prodotti notevoli: dimostrazioni geometriche 2D e 3D (`dimostrazione_geometrica_prodotti_notevoli`) | prodotti notevoli |
| Capire | 3 | Guida 3D: scomposizione con algebra tiles (`visualizzatore polinomi 2d 3d 001`) | scomposizioni |
| Capire | 4 | AlgebraLab 3D: scomposizione (`scomp_3d_grafica_002`) | scomposizioni |
| Allenarsi | 5 | Memory delle scomposizioni (`cards_polinomi_memory004`) | scomposizioni |
| Allenarsi | 6 | C.E. Match: frazioni algebriche (`card_frazioni_algebriche_005`) | — |
| Mettersi alla prova | 7 | Challenge: scomposizione di polinomi PRO (`polinomi_challenge_v2_pro`) | — |
| Mettersi alla prova | 8 | Arcade Challenge: scomposizioni e parabola (`arcade_challenge_scomposizioni_parabola`) + spiegazione animata | — |

### Gli altri percorsi (composizione proposta)

| Percorso | Capire | Allenarsi | Mettersi alla prova |
|---|---|---|---|
| **Numeri e calcolo** | Laboratorio frazioni (`fractions_lab_001`), Pitagora & Tartaglia (`tavola_tart_canva0003`) | Caccia all'errore in Z (`memory_1el_numeri_004`), Calcolo veloce | Arcade MCD/mcm, Arcade Unità di misura, Percent Lab (`percentuali_001`) |
| **Equazioni e disequazioni** | Sistemi vs disequazioni frazionarie, Laboratorio disequazioni di 2° grado (`parabola e disequazioni…`), video "Due sfighe" | lezioni Quest disequazioni | Parabola Challenge (`disequazioni grafiche 4el`) |
| **La retta nel piano** | GeoGebra "Retta per due punti" | lezioni Quest retta/pendenza | Math Bubble, Math Pool, PIP (`retta_fallout_002`) |
| **Funzioni e grafici** | Math Underground (classificazione), FuncLab AI, Scale logaritmiche, Fasori & onde (`corrente_4el_sincos`), infografica "Guida al mondo delle funzioni" | GonioMatch (`gioco_sin_cos_01`) | — |
| **Numeri irrazionali** | √2, π, metodo di esaustione, φ e Fibonacci (`fibonacci_anim`) + spiegazioni | — | — |
| **Geometria e spazio** | Albero di Pitagora, Fasi della Luna, Mappe & distorsioni (Mercatore) | lezioni Quest aree/Pitagora | — |
| **Logica e insiemi** | Logic Lab: insiemi e Venn (`insiemi004`), Teoria dei giochi (`voto_cosapevole.2.5`) | — | Il Filo di Dedalo |

Dove un momento è vuoto (—), la pagina lo omette invece di mostrare un riquadro vuoto.

---

## 4. Vecchio URL → nuovo URL

**Nessun file cambia indirizzo.** Cambiano solo il punto del menu da cui si raggiunge e, per tre casi, il comportamento della home.

| Vecchio indirizzo | Nuovo | Come resta funzionante |
|---|---|---|
| `content/apps/*.html` (57 file) | identico | non si toccano |
| `content/verifiche/**`, `content/video/**`, `content/infografiche/**`, `content/images/**`, `rif_norm_2017/**` | identico | non si toccano |
| `allenamento/`, `calcolo-mentale.html` | identici (in "Allenati") | cambia solo il menu |
| `verifiche.html`, `competenze.html` (anche `#<id>`), `scuola.html` | identici (piè di pagina, Chi sono) | cambia solo il menu |
| `galaxy.html` | identico ("Esplora in 3D") | invariata |
| `privacy-policy.html`, `404.html` | identici | + tema chiaro |
| `laboratoriomatematicoOrfini.html`, `tools/report_finale.html` (generati da Jekyll dai `.md`) | identici | restano (vedi D5); il primo diventa la base del testo di `/chi-sono/` |
| `index.html` | identico, nuovi contenuti | home con Parti da qui e Percorsi |
| `index.html?tag=1%20EL` (9 link in `scuola.html`, link dalla Mappa) | `attivita/?programma=1EL` | la home riconosce `?tag=` e porta ad Attività con il filtro docenti aperto; senza JS mostra un link. In `scuola.html` i 9 link restano (è la pagina della scuola, rivolta a famiglie e colleghi) ma puntano direttamente al nuovo indirizzo. |
| `index.html#about` (4 link interni) | `chi-sono/` | la home riconosce `#about`; i link interni si aggiornano |
| filtro "Video" (nessun URL) | `attivita/?formato=video` | nuovo indirizzo condivisibile |
| `/?q=…` (dichiarato nei dati strutturati, oggi ignorato) | `attivita/?q=…` | si corregge il `SearchAction` |

**Nuovi indirizzi:** `percorsi/` e gli 8 percorsi, `attivita/` (e `attivita/<id>/` se approvate), `laboratorio/`, `chi-sono/`, `archivio/`; `journal/` riservato (non creato).

**Stub di redirect:** con questa proposta **non ne servono**. Il passo 3.7 diventa un controllo automatico: ogni URL della `sitemap.xml` attuale, ogni voce di `database.js` e i 9 link `?tag=` devono rispondere 200 e portare al contenuto giusto.

---

## 5. File che verrebbero toccati

### Nuovi
| File | Cosa |
|---|---|
| `dati/attivita.json`, `argomenti.json`, `classi.json`, `percorsi.json` | metadati (passo 3.1) |
| `percorsi/index.html` e `percorsi/<id>/index.html`, `attivita/index.html`, `laboratorio/index.html`, `chi-sono/index.html`, `archivio/index.html` | pagine **generate dal build** |
| `attivita/<id>/index.html` | schede attività, generate (solo se approvate, D4) |
| `pagine.py` | modulo chiamato da `build.py` che scrive le pagine dai modelli |
| `modelli/indice.html`, `modelli/percorso.html`, `modelli/scheda.html` | modelli HTML |
| `indici.css`, `indici.js` | stile e filtri delle pagine generate (accanto a `index.css`) |
| `tools/controlla_metadati.py` | validazione: schede complete, id unici, vocabolario rispettato, elenco dei `[DA …]` |
| `tests/navigazione.spec.js` | Playwright: menu, filtri, contenuto senza JS, vecchi URL a 200, **nessuna etichetta di classe nelle pagine per studenti** |
| `_config.yml` | solo `exclude:` per non pubblicare `docs/` (vedi D5) |

### Modificati
| File | Cosa cambia |
|---|---|
| `build.py` | legge `dati/`, dà priorità ai metadati, date da git, chiama `pagine.py`, aggiunge le nuove pagine alla sitemap, catalogo per i crawler visibile e con link, `SearchAction` corretto |
| `index.html`, `index.css` | nuovo menu; home con Parti da qui, Percorsi, Allenati, Laboratorio; gestione di `?tag=` e `#about` |
| `competenze.html`, `verifiche.html`, `scuola.html`, `calcolo-mentale.html`, `404.html` | solo menu e piè di pagina, sostituiti dal build tra marcatori `<!-- NAV_START -->…<!-- NAV_END -->`; in `scuola.html` anche i 9 link `?tag=` |
| `galaxy.html` | link di ritorno coerente con il nuovo menu |
| `privacy-policy.html`, `404.html` | tema chiaro (passo 3.6) |
| `content/assets/style/theme-light.css` | estensione alle nuove pagine |
| `database.js`, `sitemap.xml` | rigenerati dal build, mai a mano |
| `docs/DECISIONI.md` | registro delle scelte |

### Non toccati
Tutti i file in `content/apps/` (le "app che fanno eccezione" sono un lavoro a parte), la Quest in `allenamento/`, `auto_sidecar.py`, `standardize_apps.py`, `thumbnails.py`, `cookie-consent.*`, `riforma2017.json`, i PDF.

Per il principio 2 restano due scritte visibili **dentro le app**, da sistemare nel lavoro sulle eccezioni:
- `tavola_tart_canva0003.html:358`: sottotitolo "Laboratorio Matematico 1EL-2EL";
- 5 spiegazioni animate con "· Biennio" nell'intestazione: MCD/mcm, Arcade scomposizioni, Arcade unità di misura, Math Pool, π.

---

## 6. Ordine di lavoro (Fase 3)

1. **Metadati** `dati/*.json` compilati dall'inventario, date da git, `[DA VERIFICARE]` dove serve. Nessun cambiamento visibile.
2. **Menu e pagine** Percorsi / Attività / Laboratorio / Chi sono. *Cambia l'aspetto: mi fermo.*
3. **Filtri** per argomento e formato in Attività, più "Filtri per docenti" chiusi. *Mi fermo.*
4. **Parti da qui**: ti chiedo la selezione. *Mi fermo.*
5. **Percorso Polinomi e scomposizioni** (ordine confermato da te), poi gli altri. *Mi fermo.*
6. **Tema chiaro** sulle pagine nuove, su privacy e su 404. *Mi fermo.*
7. **Controllo dei vecchi URL.**

---

## Decisioni da approvare

| # | Decisione | Proposta |
|---|---|---|
| D1 | Menu `Percorsi · Attività · Allenati · Laboratorio · Chi sono`; niente sezione Docenti; Verifiche, Competenze e Scuola nel piè di pagina | ✅ consigliata |
| D2 | Metadati in **JSON** in `dati/`, con priorità sulle euristiche di `build.py` | ✅ consigliata |
| D3 | Pagine in cartelle (`/percorsi/…`), **generate dal build** come HTML statico | ✅ consigliata |
| D4 | Schede statiche `/attivita/<id>/`; mostrare o no la riga "Nel programma di" | consigliata, riga "programma" a tua scelta |
| D5 | **Niente `.nojekyll`** (romperebbe `laboratoriomatematicoOrfini.html` e `tools/report_finale.html`); `_config.yml` con `exclude: [docs, …]`. `allenamento/vendor/` resta pubblicata e il passo 3.7 lo verifica. | ✅ consigliata; dimmi se `orfini-games/` e `orfini-math-quest.zip` devono restare pubblici |
| D6 | GP = Grafica, MA = Manutenzione | da confermare |
| D7 | Percorsi per argomento in tre momenti (Capire / Allenarsi / Mettersi alla prova), nessuna etichetta di classe o livello; composizione e ordine (§3) | da confermare |
| D8 | Nessuna classe visibile sulle schede (oggi `UIManager.js:353` la mostra); classe solo nel filtro docenti chiuso | ✅ consigliata |

# Proposta di architettura — Orfini Math Lab

Fase 2, 2026-10-30. **Solo documento: nessun file del sito è stato modificato.** Parte dalla bozza del brief, adattata ai dati di `INVENTARIO.md` e `AUDIT.md`. Le scelte che richiedono il tuo via libera sono raccolte in fondo ("Decisioni da approvare").

## Principi

1. **Nessun file di attività si sposta né si rinomina.** Cambiano navigazione, pagine indice e metadati. La struttura logica (Studenti / Docenti / Laboratorio) vive nei metadati, non nelle cartelle. Così non servono redirect per le attività, e QR code, Classroom, Instagram e circolari continuano a funzionare.
2. **Una sola fonte di verità**: il file `dati/attivita.json`. Da lì `build.py` genera `database.js`, `sitemap.xml`, le pagine indice, i filtri, i percorsi e il catalogo per i crawler.
3. **HTML statico prima, JavaScript dopo.** Ogni pagina indice esce dal build già completa di link veri a ogni attività, leggibile senza JS. Il JS aggiunge solo i filtri istantanei.
4. **Si rifinisce l'esistente**: stesso tema scuro "laboratorio", stessi font, stesso pulsante del tema (`orfini_theme`), stesso cookie consent.

---

## 1. Mappa del sito

```
Orfini Math Lab  (index.html)
│
├── Parti da qui ─────────── 6-8 lavori scelti dal docente (in home)
├── Esplora in 3D ────────── galaxy.html  (ingresso visivo, dalla home e da Laboratorio)
│
├── STUDENTI  /studenti/
│   ├── Allenati ─────────── allenamento/          (Orfini Math Quest, invariata)
│   ├── Calcolo veloce ───── calcolo-mentale.html  (invariata)
│   ├── Sfide arcade ─────── Arcade Challenge, Math Bubble, Math Pool, Filo di Dedalo, Parabola Challenge…
│   └── Memory ───────────── Caccia all'errore, Memory scomposizioni, C.E. Match, GonioMatch
│       (filtro semplice: Prima · Seconda · Terza · Quarta · Quinta)
│
├── DOCENTI  /docenti/
│   ├── Attività ─────────── tutte le attività didattiche, filtri ARGOMENTO + CLASSE (formato = etichetta)
│   ├── Percorsi ─────────── /docenti/percorsi/algebra-del-biennio/  (primo percorso)
│   ├── Verifiche ────────── verifiche.html   (invariata; oggi voce "Archivio")
│   ├── Competenze ───────── competenze.html  (invariata)
│   ├── Materiali ────────── infografiche PDF/PNG, video, normativa rif_norm_2017/
│   └── Schede d'uso ─────── campo `uso_in_classe` di ogni attività (si riempie nel tempo)
│
├── LABORATORIO  /laboratorio/
│   └── arte + codice ────── Pen Plotter, Chaos Lab, Random Walk 3D, Snake of Life,
│                            Automi e particelle, Sketch to Pattern, Albero di Pitagora, Sierpinski
│
├── JOURNAL  /journal/  ──── RISERVATO, non in menu finché non esiste (fuori ambito)
│
├── CHI SONO  /chi-sono/
│   ├── autore, ruolo, motivazioni ("perché queste scelte") — testi [DA COMPILARE DAL DOCENTE]
│   ├── portfolio: attività in ordine di data, con versione e stato (generato)
│   └── La scuola ────────── scuola.html (invariata)
│
├── /archivio/ ───────────── ciò che esce dalla struttura (vuoto all'inizio)
└── privacy-policy.html, 404.html (invariate, + tema chiaro)
```

**Menu principale (5 voci invece di 9):** `Studenti · Docenti · Laboratorio · Chi sono` e il pulsante del tema. Il logo riporta alla home.
- "Journal" esce dal menu finché la sezione non esiste: oggi l'etichetta porta alla home e confonde.
- "Allenati" resta raggiungibile in un clic, come pulsante evidenziato nella home e in Studenti (c'è già: "Inizia ad allenarti").
- "Video" diventa un'etichetta di formato: `/docenti/?formato=video`.
- "Archivio" diventa "Verifiche", dentro Docenti, così non si confonde con la nuova cartella `/archivio/`.
- "Mappa" diventa "Esplora in 3D" (riquadro in home e in Laboratorio).

Su telefono il menu resta a scomparsa come oggi. Su LIM le 5 voci stanno su una riga con caratteri grandi.

### Home (`index.html`, stesso URL)

1. **Intestazione breve**: cos'è il sito e per chi è, in due righe. Nome e ruolo dell'autore visibili.
2. **Parti da qui**: 6-8 schede scelte da te (campo `in_evidenza` nei metadati; ti chiederò la selezione al passo 3.4).
3. **Tre porte per ruolo**: Studenti / Docenti / Laboratorio, ognuna con 2-3 esempi.
4. **Esplora in 3D** (galaxy.html) e **Ultimi aggiornamenti** (le 4-5 attività con la data di aggiornamento più recente).
5. **Piè di pagina**: autore, scuola, Instagram, privacy, data dell'ultimo aggiornamento del sito.

La griglia filtrabile di oggi si sposta in `/docenti/`. Gli indirizzi vecchi che la usavano continuano a funzionare (vedi §4).

### Pagina attività: proposta da approvare

Per l'obiettivo "portfolio vivo" propongo **una scheda statica per attività** generata dai metadati: `/attivita/<id>/`, per esempio `/attivita/arcade-mcd-mcm/`. Contiene:
- titolo, descrizione, argomento, classi, durata, dispositivi;
- data, versione, stato, motivazioni e uso in classe;
- link "Apri l'attività" all'URL attuale e link alla spiegazione animata;
- in futuro, la nota del Journal.

L'app resta dov'è; la scheda è una pagina in più, ottima per i motori di ricerca (testo vero, canonical, anteprima social) e da linkare nel Journal. Se preferisci rimandarla, si può aggiungere dopo il passo 3.5 senza cambiare nulla del resto.

---

## 2. Schema dei metadati

**Formato: JSON**, in `dati/` nella root. Motivi:
- `content/` è riservata a `build.py`.
- JSON è già usato per i sidecar.
- Python e JavaScript lo leggono senza librerie nuove (PyYAML non è installato in `.venv`).

Il limite di JSON (niente commenti) si aggira con il campo `nota`.

| File | Contenuto |
|---|---|
| `dati/attivita.json` | una scheda per attività (fonte di verità) |
| `dati/argomenti.json` | vocabolario controllato: ambiti e argomenti |
| `dati/classi.json` | codici classe → anno + indirizzo |
| `dati/percorsi.json` | percorsi ordinati (id, titolo, introduzione, passi) |

**Priorità nel build:** `dati/attivita.json` > meta dell'HTML > sidecar > euristiche di `build.py` (tag dedotti, Gemini). Un'attività assente da `attivita.json` resta nel catalogo come oggi, con quello che `build.py` ricava da solo: niente sparisce per una scheda dimenticata.

**Campi incerti:** si scrive letteralmente `"[DA VERIFICARE]"` (dato da controllare) o `"[DA COMPILARE DAL DOCENTE]"` (testo che solo tu puoi scrivere). Il build li tratta come vuoti e li elenca in un rapporto, così sai cosa manca.

### Campi della scheda

| Campo | Tipo | Obbl. | Note |
|---|---|---|---|
| `id` | testo | ✔ | identificativo stabile e leggibile (`arcade-mcd-mcm`). Diventa l'URL della scheda `/attivita/<id>/`. Non cambia mai. |
| `url` | testo | ✔ | percorso attuale del file (o URL esterno). Non cambia. |
| `titolo` | testo | ✔ | titolo parlante, senza LaTeX grezzo |
| `descrizione` | testo | ✔ | 1-2 frasi, massimo 160 caratteri (diventa la `meta description`) |
| `ambito` | id | ✔ | da `argomenti.json`; gli ambiti coincidono con le aree della Quest, così sito e Quest usano le stesse parole |
| `argomenti` | lista di id | ✔ | 1-3 argomenti da `argomenti.json` (es. `mcd-mcm`) |
| `classi` | lista di codici | ✔ | `1EL`, `3MEC`… da `classi.json`; il filtro usa anno e indirizzo |
| `formato` | id | ✔ | `arcade`, `memory`, `simulazione`, `esplorazione`, `spiegazione`, `video`, `infografica`, `immagine`, `link`, `documento` |
| `etichette` | lista | | etichette secondarie: `Arcade Challenge`, `3D`, `AI`, `Video`… |
| `sezioni` | lista | ✔ | `studenti`, `docenti`, `laboratorio` (anche più di una) |
| `durata_min` | numero | | durata indicativa in classe, in minuti |
| `dispositivi` | lista | ✔ | `pc`, `lim`, `tablet`, `telefono` |
| `data_creazione` | AAAA-MM-GG | ✔ | prima pubblicazione: primo commit git del file |
| `data_aggiornamento` | AAAA-MM-GG | ✔ | ultimo commit git che tocca il file (calcolabile in automatico dal build) |
| `versione` | testo | | etichetta libera scelta da te (`1.0`, `2.1`…) |
| `stato` | id | ✔ | `stabile`, `in-prova`, `da-verificare`, `archiviata` |
| `dipendenze_esterne` | lista | | servizi o CDN critici (`ai.studio`, `geogebra.org`…) |
| `competenze` | lista | | codici Riforma 2017 (`MAT_K1`…), già presenti nei tag |
| `spiegazione` | testo | | URL della spiegazione animata, se c'è |
| `allenamento` | lista di id | | lezioni della Quest collegate (oggi calcolate da `build.py`) |
| `percorsi` | lista | | `{ "id": "algebra-del-biennio", "passo": 3 }` |
| `in_evidenza` | numero o `null` | | posizione in "Parti da qui" (1-8) |
| `uso_in_classe` | testo | | scheda d'uso breve: quando e come usarla |
| `motivazioni` | testo | | perché esiste e perché è fatta così (portfolio) |
| `journal` | testo o `null` | | **riservato**: URL della futura nota del Journal |
| `nota` | testo | | promemoria interni, non pubblicati |

### Esempio 1: `MCD_mcm_1el_001.html` (studenti + docenti)

```json
{
  "id": "arcade-mcd-mcm",
  "url": "content/apps/MCD_mcm_1el_001.html",
  "titolo": "Arcade Challenge: MCD e mcm",
  "descrizione": "Gioco arcade a sfida per allenare m.c.m., M.C.D. e scomposizione in fattori primi.",
  "ambito": "numeri",
  "argomenti": ["mcd-mcm", "fattori-primi"],
  "classi": ["1EL", "1GP", "1MA"],
  "formato": "arcade",
  "etichette": ["Arcade Challenge", "Spiegazione animata"],
  "sezioni": ["studenti", "docenti"],
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
  "percorsi": [{ "id": "algebra-del-biennio", "passo": 3 }],
  "in_evidenza": null,
  "uso_in_classe": "[DA COMPILARE DAL DOCENTE]",
  "motivazioni": "[DA COMPILARE DAL DOCENTE]",
  "journal": null,
  "nota": "URL storico: non rinominare. 'competenze' vuoto: i tag attuali non hanno codici MAT_."
}
```

### Esempio 2: `pen_plotter__23v2_8K.html` (laboratorio)

```json
{
  "id": "studio-plotter-cnc",
  "url": "content/apps/pen_plotter__23v2_8K.html",
  "titolo": "Studio Plotter CNC",
  "descrizione": "Dal disegno generativo al G-code: tracciati per pen plotter e CNC, con anteprima 3D.",
  "ambito": "arte-codice",
  "argomenti": ["arte-generativa", "geometria-3d", "fabbricazione-digitale"],
  "classi": ["3MEC", "4EL", "5EL"],
  "formato": "simulazione",
  "etichette": ["3D", "G-code", "Strumento"],
  "sezioni": ["laboratorio"],
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

### Vocabolario degli argomenti (bozza, da `dati/argomenti.json`)

Gli **ambiti** coincidono con le aree della Quest. Gli **argomenti** coprono tutte le 42 app.

| Ambito | Argomenti |
|---|---|
| `numeri` Numeri | `operazioni-z`, `frazioni`, `percentuali`, `mcd-mcm`, `fattori-primi`, `irrazionali`, `misura` |
| `polinomi` Polinomi | `operazioni-polinomi`, `prodotti-notevoli`, `scomposizioni`, `frazioni-algebriche` |
| `equazioni` Equazioni e disequazioni | `disequazioni-primo-grado`, `disequazioni-secondo-grado`, `disequazioni-frazionarie`, `sistemi-disequazioni` |
| `rette` Funzioni lineari e rette | `retta`, `pendenza` |
| `geometria` Geometria | `pitagora`, `esaustione`, `proiezioni`, `geometria-3d`, `fasi-lunari` |
| `dati` Dati e previsioni | `probabilita`, `teoria-dei-giochi` |
| `funzioni` Funzioni e modelli | `classificazione-funzioni`, `parabola`, `goniometria`, `logaritmi`, `fibonacci` |
| `logica` Logica e insiemi | `insiemi`, `logica` |
| `arte-codice` Arte e codice | `arte-generativa`, `frattali`, `automi-cellulari`, `sistemi-dinamici`, `fabbricazione-digitale` |

`logica` e `arte-codice` non sono aree della Quest: si aggiungono solo al sito.

### Classi (`dati/classi.json`)

| Codice | Anno | Indirizzo |
|---|---|---|
| `EL` | 1-5 | Elettrico-Elettronico |
| `MEC` | 1-5 | Meccanico |
| `GP` | 1-2 | Graphic Design? **[DA COMPILARE DAL DOCENTE]** |
| `MA` | 1-2 | **[DA COMPILARE DAL DOCENTE]** |

Nel filtro di `/docenti/` si sceglie l'**anno** (Prima…Quinta) e, a richiesta, l'**indirizzo**: così "prima superiore" trova `1EL`, `1GP` e `1MA` insieme.

---

## 3. Percorso "Algebra del biennio" (bozza dell'ordine didattico)

Va confermato da te: è l'ordine che ricavo da argomenti e classi, non un dato.

| Passo | Attività | Lezione Quest collegata |
|---|---|---|
| 1 | Caccia all'errore: Memory su operazioni in Z (`memory_1el_numeri_004`) | numeri relativi |
| 2 | Laboratorio di operazioni tra frazioni (`fractions_lab_001`) | frazioni |
| 3 | Arcade Challenge: MCD e mcm (`MCD_mcm_1el_001`) | — |
| 4 | Esploratore grafico: operazioni con i polinomi (`operazioni_polinomi_graph`) | monomi |
| 5 | Prodotti notevoli: dimostrazioni geometriche (`dimostrazione_geometrica_prodotti_notevoli`) | prodotti notevoli |
| 6 | Guida 3D: scomposizione con algebra tiles (`visualizzatore polinomi 2d 3d 001`) | scomposizioni |
| 7 | AlgebraLab 3D: scomposizione (`scomp_3d_grafica_002`) | scomposizioni |
| 8 | Memory delle scomposizioni (`cards_polinomi_memory004`) | scomposizioni |
| 9 | Challenge: scomposizione di polinomi PRO (`polinomi_challenge_v2_pro`) | scomposizioni |
| 10 | Arcade Challenge: scomposizioni e parabola (`arcade_challenge_scomposizioni_parabola`) | — |
| 11 | C.E. Match: frazioni algebriche (`card_frazioni_algebriche_005`) | — |
| 12 | Sistemi vs disequazioni frazionarie (`disequazioni_frazionarie_vs_sistemi`) + video "Due sfighe" | disequazioni di primo grado |

La pagina del percorso è statica: un'introduzione [DA COMPILARE DAL DOCENTE], i passi numerati con link all'attività e alla lezione della Quest, e frecce "passo precedente / successivo".

---

## 4. Vecchio URL → nuovo URL

**Nessun file cambia indirizzo.** Cambiano solo il punto del menu da cui si raggiunge e, per tre casi, il comportamento della home.

| Vecchio indirizzo | Nuovo | Come resta funzionante |
|---|---|---|
| `content/apps/*.html` (57 file) | identico | non si toccano |
| `content/verifiche/**`, `content/video/**`, `content/infografiche/**`, `content/images/**`, `rif_norm_2017/**` | identico | non si toccano |
| `allenamento/` | identico (in Studenti) | invariata |
| `calcolo-mentale.html` | identico (in Studenti) | cambia solo il menu |
| `verifiche.html` | identico (Docenti → Verifiche) | cambia solo il menu |
| `competenze.html` (anche `#<id>`) | identico (Docenti → Competenze) | cambia solo il menu |
| `galaxy.html` | identico ("Esplora in 3D") | invariata |
| `scuola.html` | identico (Chi sono → La scuola) | cambia solo il menu |
| `privacy-policy.html`, `404.html` | identico | + tema chiaro |
| `laboratoriomatematicoOrfini.html` (generato da Jekyll dal `.md`) | identico | resta; il testo diventa la base di `/chi-sono/` |
| `tools/report_finale.html` (generato da Jekyll) | identico | resta; vedi decisione D5 |
| `index.html` | identico, nuovi contenuti | home con "Parti da qui" e porte per ruolo |
| `index.html?tag=1%20EL` (9 link in `scuola.html`, link dalla Mappa) | `docenti/?classe=1EL` | la home riconosce `?tag=` e porta al catalogo filtrato. Senza JS mostra un link "Vedi le attività di 1 EL". I link di `scuola.html` si aggiornano direttamente. |
| `index.html#about` (4 link interni) | `chi-sono/` | la home riconosce `#about` e porta a Chi sono; i link interni si aggiornano |
| filtro "Video" (nessun URL) | `docenti/?formato=video` | nuovo indirizzo condivisibile |
| `/?q=…` (dichiarato nei dati strutturati, oggi ignorato) | `docenti/?q=…` | si corregge il `SearchAction` |

**Nuovi indirizzi:** `studenti/`, `docenti/`, `docenti/percorsi/algebra-del-biennio/`, `laboratorio/`, `chi-sono/`, `archivio/`, eventualmente `attivita/<id>/`, e `journal/` riservato (non creato).

**Stub di redirect:** con questa proposta **non ne servono**, perché nessun file si sposta. Il passo 3.7 diventa un controllo automatico: ogni URL di `sitemap.xml` attuale, ogni voce di `database.js` e i 9 link `?tag=` devono rispondere 200 e portare al contenuto giusto. Se in futuro un file andrà spostato, al vecchio indirizzo resterà una pagina con meta refresh e canonical.

---

## 5. File che verrebbero toccati

### Nuovi
| File | Cosa |
|---|---|
| `dati/attivita.json`, `argomenti.json`, `classi.json`, `percorsi.json` | metadati (passo 3.1) |
| `studenti/index.html`, `docenti/index.html`, `laboratorio/index.html`, `chi-sono/index.html`, `archivio/index.html` | pagine indice **generate dal build** (passo 3.2) |
| `docenti/percorsi/algebra-del-biennio/index.html` | percorso, generato (passo 3.5) |
| `attivita/<id>/index.html` | schede attività, generate (solo se approvate) |
| `pagine.py` | modulo chiamato da `build.py` che scrive le pagine indice dai modelli |
| `modelli/indice.html`, `modelli/percorso.html`, `modelli/scheda.html` | modelli HTML delle pagine generate |
| `indici.css`, `indici.js` | stile e filtri delle pagine indice (accanto a `index.css`, come le altre pagine root) |
| `tools/controlla_metadati.py` | validazione: schede complete, id unici, vocabolario rispettato, elenco dei `[DA …]` |
| `tests/navigazione.spec.js` | Playwright: menu, filtri, contenuto senza JS, vecchi URL tutti a 200 |
| `_config.yml` | solo `exclude:` per non pubblicare `docs/` (vedi D5) |

### Modificati
| File | Cosa cambia |
|---|---|
| `build.py` | legge `dati/`, dà priorità ai metadati, calcola le date da git, chiama `pagine.py`, aggiunge le nuove pagine alla sitemap, rende il catalogo per i crawler visibile e con link, corregge `SearchAction` |
| `index.html`, `index.css` | nuovo menu; home con Parti da qui, porte per ruolo, ultimi aggiornamenti; gestione di `?tag=` e `#about` |
| `competenze.html`, `verifiche.html`, `scuola.html`, `calcolo-mentale.html`, `404.html` | solo il menu (sostituito dal build tra marcatori `<!-- NAV_START -->…<!-- NAV_END -->`, così resta uguale ovunque); in `scuola.html` anche i 9 link `?tag=` |
| `galaxy.html` | link di ritorno e "Esplora in 3D" coerenti con il nuovo menu |
| `privacy-policy.html`, `404.html` | tema chiaro (passo 3.6) |
| `content/assets/style/theme-light.css` | estensione alle nuove pagine indice |
| `database.js`, `sitemap.xml` | rigenerati dal build, mai a mano |
| `docs/DECISIONI.md` | registro delle scelte |

### Non toccati
Tutti i file in `content/apps/` (le correzioni sulle "app che fanno eccezione" sono un lavoro a parte), la Quest in `allenamento/`, `auto_sidecar.py`, `standardize_apps.py`, `thumbnails.py`, `cookie-consent.*`, `riforma2017.json`, i PDF.

---

## 6. Ordine di lavoro (Fase 3, confermato dal brief)

1. **Metadati**: `dati/*.json` compilati dall'inventario, date da git, `[DA VERIFICARE]` dove serve. Un commit, nessun cambiamento visibile.
2. **Menu e pagine indice** Studenti / Docenti / Laboratorio / Chi sono. *Cambia l'aspetto: mi fermo per il tuo via libera.*
3. **Filtri** per argomento e classe in Docenti. *Visibile: mi fermo.*
4. **Parti da qui**: ti chiedo la selezione. *Visibile: mi fermo.*
5. **Percorso Algebra del biennio** (con l'ordine confermato da te). *Visibile: mi fermo.*
6. **Tema chiaro** completato su pagine indice, privacy e 404. *Visibile: mi fermo.*
7. **Controllo dei vecchi URL** e degli stub (se ne serviranno).

---

## Decisioni da approvare

| # | Decisione | Proposta |
|---|---|---|
| D1 | Menu a 5 voci (Studenti, Docenti, Laboratorio, Chi sono + tema), "Journal" nascosto finché non esiste | ✅ consigliata |
| D2 | Metadati in **JSON** in `dati/`, con priorità sulle euristiche di `build.py` | ✅ consigliata |
| D3 | Pagine indice in cartelle (`/docenti/`), **generate dal build** come HTML statico | ✅ consigliata |
| D4 | Schede statiche per attività `/attivita/<id>/` | consigliata, ma puoi rimandarla |
| D5 | **Jekyll: niente `.nojekyll`.** Due URL pubblici (`laboratoriomatematicoOrfini.html`, `tools/report_finale.html`) esistono solo perché Jekyll trasforma i `.md`: con `.nojekyll` darebbero 404. Propongo invece un `_config.yml` con `exclude: [docs, orfini-games, orfini-math-quest.zip]`, per non pubblicare i documenti di lavoro. | ✅ consigliata; dimmi se `orfini-games/` e lo zip devono restare pubblici. Precauzione: `allenamento/vendor/` (KaTeX e JSXGraph della Quest) deve restare pubblicata, perché le esclusioni predefinite di Jekyll riguardano solo `vendor/bundle` e simili. Il controllo dei vecchi URL (passo 3.7) la verifica subito dopo l'unione. |
| D6 | Significato dei codici **GP** e **MA** | [DA COMPILARE DAL DOCENTE] |
| D7 | Ordine del percorso Algebra del biennio (§3) | da confermare |
| D8 | Etichetta "Archivio" → "Verifiche", per liberare `/archivio/` | ✅ consigliata |

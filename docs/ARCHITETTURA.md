# Proposta di architettura — Orfini Math Lab

Fase 2, revisione 4 (2026-10-30). **Solo documento: nessun file del sito è stato modificato.** Le revisioni precedenti, organizzate per ruoli, sono nella storia git del ramo `riorganizzazione` e sono superate.

## Da dove parte

Il sito è un **laboratorio artigianale**, non un catalogo né un corso. Docente e studenti usano lo stesso spazio e le stesse attività. Deve crescere seguendo l'istinto dell'autore: una nuova idea entra in pochi minuti, senza ristrutturare niente. Il **Journal** è il quaderno di lavoro pubblico: note brevi e cronologiche che attraversano le attività invece di stare in una sezione della gerarchia.

Le regole che ne discendono, applicate in tutto il documento:
- **tag liberi**: si inventano scrivendoli;
- **tre campi obbligatori**: titolo, data, una riga di descrizione;
- **le viste si generano dai dati**;
- **niente sezioni per ruolo**;
- **niente framework**: un piccolo script Python (`build.py`, che esiste già) produce HTML statico leggibile e modificabile a mano.

### Un dato che orienta la proposta
Oggi le 55 voci del catalogo hanno **295 tag diversi**, in media 14 per attività, e 169 sono usati una sola volta. Vengono dalle keyword SEO e dai suggerimenti di Gemini ("MATEMATICA", "CIT_4:COMPETENZA DIGITALE", "WEBGL"…). Viste generate da questi tag sarebbero centinaia di pagine quasi vuote.

Quindi i **tag del nuovo sistema sono solo quelli scritti dall'autore**, in un campo a parte. Le keyword restano nel `<head>` delle app per i motori di ricerca. I codici della Riforma 2017 (`MAT_K1`…) restano per `competenze.html`. Nessuno dei due genera viste.

---

## (a) Voci fisse di navigazione

| Voce | Indirizzo | Cosa contiene |
|---|---|---|
| Home (il logo) | `index.html` | Parti da qui (curata) + novità e Journal (automatici) |
| **Attività** | `attivita/` | tutte le attività, e da qui tutte le viste |
| **Allenati** | `allenamento/` | la Quest, invariata |
| **Journal** | `journal/` | le note, in ordine cronologico |
| **Chi sono** | `chi-sono/` | autore, metodo, La scuola |

**Allenati come quinta voce:** nel brief le voci sono "indicativamente" quattro, ma prima avevi chiesto che Allenati fosse una sezione a parte, la palestra del sito. Con cinque voci il menu sta ancora su una riga (LIM e PC) e resta a scomparsa sul telefono. Se preferisci quattro voci, Allenati diventa un riquadro fisso in home e un pulsante "Allenati su questo" su ogni attività (decisione D1).

**Fuori dal menu**, nel piè di pagina di ogni pagina: Verifiche (`verifiche.html`), Competenze Riforma 2017 (`competenze.html`), Esplora in 3D (`galaxy.html`), Calcolo veloce (`calcolo-mentale.html`), La scuola (`scuola.html`), Privacy. Restano tutte all'indirizzo di oggi.

## (b) Viste dinamiche generate dai dati

Tutte nascono da tre sorgenti: le schede delle attività, le note del Journal e due file di curatela. Nessun elenco si scrive a mano.

| Vista | Da dove nasce | Dove si vede |
|---|---|---|
| **Tutte le attività** | tutte le schede, dalla più recente | `attivita/` |
| **Per tag** (argomento, classe, formato, tema, progetto, mood…) | ogni tag usato almeno una volta | filtro in `attivita/` e link sui tag delle schede |
| **Novità** | data dell'ultima modifica (dalla storia git) | home, `attivita/?ordine=novita` |
| **Percorsi** | file `dati/percorsi.txt`: sequenze ordinate scelte dall'autore | `attivita/percorsi/<nome>/` e banner "fa parte del percorso…" sulle attività |
| **Journal** | le note, dalla più recente | `journal/`, home, scheda di ogni attività ("2 note") |
| **Note per attività / attività per nota** | campo `attivita` delle note | in entrambe le direzioni, in automatico |
| **Mappa 3D** | `database.js`, come oggi | `galaxy.html` |
| **Parti da qui** | file `dati/parti-da-qui.txt` | home |

**I tag non hanno liste chiuse, ma hanno un'unica convenzione facoltativa** per raggrupparli nel pannello dei filtri. Se scrivi `chiave:valore`, il tag finisce nel gruppo della chiave:
- `formato:arcade`, `progetto:plotter`, `mood:relax`: la chiave è il gruppo;
- un codice classe (`1EL`, `3MEC`…) va da solo nel gruppo **classe**;
- un tag senza chiave (`frazioni`, `retta`) va nel gruppo **argomento**.

Una chiave nuova crea da sola un gruppo nuovo. Maiuscole e accenti non contano per il confronto (`Frazioni` = `frazioni`). Lo script segnala, senza bloccare, i tag quasi uguali (`scomposizione` / `scomposizioni`).

**Classe e "non mortificare":** la classe è un tag e una vista come le altre, utile a te e ai colleghi. Proposta: le schede **non mostrano** i tag di classe (oggi le schede della home li mostrano, `UIManager.js:353`); il filtro "classe" c'è, ma in fondo al pannello. Così una quarta che ripassa le frazioni non vede "1EL" sulle attività (D6).

**Percorsi come suggerimenti, non binari:** un percorso è una pagina con l'elenco ordinato e una frase d'introduzione. Ogni attività resta raggiungibile anche da sola. Sulla sua scheda compare "fa parte del percorso Polinomi (passo 3 di 8) →", senza obbligo di seguirlo.

**"Più usate": non si può fare senza statistiche.** Il sito oggi non ha tracciamento, ed è un pregio per la privacy. Alternative proposte per la zona automatica della home:
- "aggiornate di recente";
- "più citate nel Journal".

Se un giorno vorrai dati d'uso, esiste un contatore open source che non usa cookie (GoatCounter), ma è un servizio esterno e richiede di aggiornare la privacy policy (D7).

## (c) Schema minimo dei metadati

### Dove stanno
Due posti possibili, con una regola sola: **se un dato è scritto in entrambi, vince la scheda in `dati/attivita.txt`**.
1. **Nel `<head>` dell'app**, per le app nuove: `<title>`, `<meta name="description">`, `<meta name="date">` e il nuovo `<meta name="tag">`. L'app si descrive da sola e non serve toccare altri file. `build.py` legge già titolo, descrizione e data.
2. **In `dati/attivita.txt`**, per le 42 app esistenti (senza toccare i loro file), per i contenuti non HTML (PDF, video, immagini, link esterni) e per correggere qualcosa senza aprire l'app.

### Formato di `dati/attivita.txt`
Testo semplice: un blocco per attività, separati da una riga vuota, `#` per i commenti. Niente virgolette né parentesi da chiudere, e nessuna libreria da installare.

```text
# Una scheda per attività. La prima riga è il nome del file (o l'URL), poi i campi.

math_pool_retta_pianocartesiano
titolo: Math Pool: biliardo sul piano cartesiano
data: 2026-10-29
descrizione: Calcola pendenza ed equazione della retta per mandare la palla in buca, anche di sponda.
tag: retta, parabola, formato:arcade, 2GP, 3MEC, lim
spiegazione: math_pool_retta_pianocartesiano_spiegazione

pen_plotter__23v2_8K
titolo: Studio Plotter CNC
data: 2026-07-15
descrizione: Dal disegno generativo al G-code: tracciati per pen plotter e CNC, con anteprima 3D.
tag: arte-e-codice, progetto:plotter, formato:strumento, solo-pc
nota: Strumento per la Ender 3 V2.
```

### Campi dell'attività

| Campo | Obbligatorio | Se manca |
|---|---|---|
| prima riga: nome del file (senza `.html`) o URL | ✔ | — (è l'identità dell'attività; non cambia mai perché i file non si rinominano) |
| `titolo` | ✔ | si usa il `<title>` dell'app, poi il nome del file |
| `data` | ✔ | si usa `<meta name="date">`, poi il primo commit git del file |
| `descrizione` (una riga) | ✔ | si usa la `meta description`; se manca anche quella, la scheda appare senza descrizione e lo script lo segnala |
| `tag` | | l'attività compare solo in "Tutte" e in "Novità" |
| `immagine` | | miniatura generata da `thumbnails.py`, come oggi |
| `spiegazione` | | si cerca un file `<nome>_spiegazione.html` |
| `stato` | | `attiva`; altri valori: `in-prova` (etichetta "in prova"), `archiviata` (esce dalle viste, resta raggiungibile) |
| `nota` | | promemoria interni, mai pubblicati |

**Calcolati in automatico:** data dell'ultima modifica (git), lezioni della Quest collegate ("Allenati su questo", che `build.py` già calcola), note del Journal collegate, percorsi di cui fa parte, avviso "serve la connessione a …" per le app con servizi esterni. Un campo mancante non rompe mai una pagina: la parte corrispondente semplicemente non compare.

### Campi della nota del Journal
Un file Markdown, in `content/journal/AAAA-MM-GG-titolo-breve.md`:

| Campo | Obbligatorio | Se manca |
|---|---|---|
| `titolo` | ✔ | dal nome del file |
| `data` | ✔ | dal nome del file |
| `descrizione` (una riga) | ✔ | la prima frase del testo |
| `attivita` | | la nota è generale (sul metodo o sul sito stesso) |
| `tag` | | — |
| testo | 200-300 parole consigliate; nessun limite imposto | — |

### File di curatela (gli unici scritti a mano, e brevi)

```text
# dati/parti-da-qui.txt — una attività per riga, nell'ordine in cui compaiono in home
arcade_challenge_scomposizioni_parabola
math_pool_retta_pianocartesiano
snake_conway_self
```

```text
# dati/percorsi.txt — un blocco per percorso
percorso: Polinomi e scomposizioni
descrizione: Dal modello geometrico alla sfida: capire, allenarsi, mettersi alla prova.
- operazioni_polinomi_graph
- dimostrazione_geometrica_prodotti_notevoli
- visualizzatore polinomi 2d 3d 001
- scomp_3d_grafica_002
- cards_polinomi_memory004
- polinomi_challenge_v2_pro
- arcade_challenge_scomposizioni_parabola
```

## (d) Aggiungere un'attività o una nota in meno di 5 minuti

### Una nuova attività
1. **Salva l'app** in `content/apps/nome_nuovo.html`. Nel `<head>` scrivi titolo, descrizione, data e tag: c'è un modello di 6 righe da copiare in `modelli/head-app.html`. In alternativa aggiungi un blocco di 4 righe in `dati/attivita.txt`.
2. **Lancia** `./aggiorna.sh`, un nuovo script breve che sostituisce l'uso manuale di `update.sh`. Fa tre cose:
   - crea la miniatura **solo per i file nuovi**;
   - esegue il build senza Gemini;
   - controlla link e campi obbligatori, e segnala i tag quasi duplicati.
   Non riscrive le altre app e non rinomina file, a differenza di `standardize_apps.py` e `auto_sidecar.py`.
3. **Guarda l'anteprima**: lo script avvia il server locale e stampa il link a `attivita/`. Lo fermi con Ctrl+C.
4. **Pubblica**: `git add`, `git commit -m "feat(app): …"`, `git push`.

Facoltativo, una riga ciascuno: aggiungerla a `dati/parti-da-qui.txt` o a un percorso.
**Tempo:** 2-3 minuti oltre alla scrittura dell'app. Menu, filtri, home, Novità, sitemap e Mappa 3D si aggiornano da soli.

### Una nuova nota del Journal
1. **Copia il modello**: `cp content/journal/_modello.md content/journal/2026-11-12-math-pool-in-classe.md`.
2. **Compila** titolo, una riga di descrizione e `attivita: math_pool_retta_pianocartesiano`. Scrivi 200-300 parole e metti le immagini nella stessa cartella.
3. **Lancia** `./aggiorna.sh` e guarda la nota in anteprima. Lo script ricomprime le immagini e cancella i metadati delle foto, tra cui la posizione GPS.
4. **Pubblica** con commit e push.

**Tempo:** quello della scrittura, più un minuto. La nota compare in `journal/`, in home e sulla scheda di Math Pool ("1 nota").

Più avanti, se ti è comodo: un comando `/nota` di Claude Code che crea il file dal modello e compila l'intestazione.

**Privacy nelle note:** mai volti, nomi o voci di studenti. Il modello contiene un promemoria. Regole della scuola su foto e video in classe: **[DA VERIFICARE con la scuola]**.

## (e) Vecchi URL

**Nessun file cambia indirizzo.** Tutti gli URL di oggi restano validi; non servono stub di redirect.

| Vecchio | Nuovo | Come resta funzionante |
|---|---|---|
| `content/**` (app, verifiche, video, infografiche, immagini), `rif_norm_2017/**` | identici | non si toccano |
| `allenamento/`, `calcolo-mentale.html`, `verifiche.html`, `competenze.html` (anche `#<id>`), `galaxy.html`, `scuola.html`, `privacy-policy.html`, `404.html` | identici | cambiano solo menu e piè di pagina |
| `laboratoriomatematicoOrfini.html`, `tools/report_finale.html` (pagine create da Jekyll dai `.md`) | identici | restano (D5); il primo è la base di `chi-sono/` |
| `index.html` | identico | nuova home |
| `index.html?tag=1%20EL` (9 link in `scuola.html`, link dalla Mappa 3D) | `attivita/?tag=1EL` | la home riconosce `?tag=` e porta alla vista; senza JS mostra un link |
| `index.html#about` (4 link interni) | `chi-sono/` | la home riconosce `#about` |
| filtro "Video" del menu (nessun URL) | `attivita/?tag=formato:video` | nuovo indirizzo condivisibile |
| `/?q=` (dichiarato nei dati strutturati, oggi ignorato) | `attivita/?q=` | si corregge il `SearchAction` |

**Nuovi indirizzi:** `attivita/`, `attivita/percorsi/<nome>/`, `journal/` e `journal/<nota>/`, `chi-sono/`, `archivio/`. Più `attivita/tag/<tag>/` solo nell'alternativa 1.

---

## Due alternative

Le due alternative condividono tutto quanto sopra: dati, flusso di lavoro, Journal, URL. Cambia solo **come si producono le viste per tag**.

### Alternativa 1 — Indici statici generati dallo script

`build.py` scrive **una pagina HTML per ogni vista**: `attivita/` (tutte), `attivita/tag/frazioni/`, `attivita/tag/1el/`, `attivita/tag/formato-arcade/`… I tag sulle schede sono link a queste pagine. Nessun JavaScript per navigare.

| Pro | Contro |
|---|---|
| Funziona ovunque, anche su browser vecchi delle LIM e con JS bloccato | **Un tag alla volta**: "frazioni **e** 1EL" richiederebbe una pagina per ogni combinazione |
| Ogni vista ha un indirizzo vero, perfetta per QR code e motori di ricerca | Molti file generati: con tag usati poco, molte pagine con 1-2 attività |
| La logica sta tutta nello script: facile da capire e da correggere | Ogni build cambia decine di file, quindi i commit "rumorosi" sono difficili da leggere |
| Nessun codice JS da mantenere | Niente ricerca testuale istantanea |

### Alternativa 2 — Filtri nel browser con HTML di riserva

`build.py` scrive **una sola pagina** `attivita/` con **tutte** le attività in HTML statico, ognuna con i suoi tag come link e come attributi. Un piccolo script (`attivita.js`, senza framework) aggiunge:
- i filtri combinabili (argomento **e** classe **e** formato);
- la ricerca testuale;
- l'indirizzo condivisibile (`attivita/?tag=frazioni&tag=1EL`).

Senza JavaScript si vede l'elenco completo, leggibile, ordinato per data, con i tag scritti. Le pagine statiche restano solo per percorsi e note del Journal.

| Pro | Contro |
|---|---|
| **Filtri combinabili** e ricerca istantanea, utili alla LIM ("frazioni + arcade") | Senza JS il filtro non funziona: si vede tutto l'elenco (comunque completo e leggibile) |
| Pochi file generati, commit leggibili | Le viste per tag non sono pagine distinte per i motori di ricerca (le attività sì, tramite la pagina unica e la sitemap) |
| È ciò che la home fa già oggi (`UIManager.js` filtra nel browser e legge `?tag=`): meno cambiamento, si riusa codice esistente | Un po' di JS da mantenere (circa 150 righe) |
| Una nuova chiave di tag compare da sola come nuovo gruppo di filtri | Con molte centinaia di attività la pagina unica diventerebbe pesante (oggi 55: nessun problema) |

### Raccomandazione: alternativa 2

Il sito ha 55 attività, si usa in classe con filtri combinati e già oggi filtra nel browser. L'HTML di riserva garantisce che motori di ricerca e browser senza JS vedano tutto. I percorsi e il Journal, che sono testi da leggere e da linkare, restano pagine statiche vere in entrambe le alternative.

La scelta è **reversibile**: i dati sono gli stessi. Passare all'alternativa 1 vuol dire aggiungere a `build.py` la generazione delle pagine per tag, senza toccare né i dati né il resto.

---

## File che verrebbero toccati (alternativa 2)

**Nuovi:**
- `dati/attivita.txt`, `dati/parti-da-qui.txt`, `dati/percorsi.txt`;
- `content/journal/` (con `_modello.md`);
- `modelli/head-app.html`, `aggiorna.sh`;
- `attivita.js`, `attivita.css`;
- pagine generate: `attivita/`, `attivita/percorsi/*/`, `journal/**`, `chi-sono/`, `archivio/`;
- `tests/navigazione.spec.js`: viste, filtri, pagine senza JS, vecchi URL a 200, nessun tag di classe sulle schede;
- `_config.yml`: solo `exclude:` per `docs/`, `dati/` e i sorgenti `.md` del Journal.

**Modificati:**

| File | Cosa cambia |
|---|---|
| `build.py` | legge `dati/*.txt`, `<meta name="tag">` e `content/journal/`; date da git; genera le pagine; non aggiunge tag inventati alle attività che hanno tag propri |
| `index.html`, `index.css` | menu e nuova home |
| `competenze.html`, `verifiche.html`, `scuola.html`, `calcolo-mentale.html`, `galaxy.html`, `404.html`, `privacy-policy.html` | solo menu e piè di pagina, scritti dal build tra marcatori `<!-- NAV_START -->…<!-- NAV_END -->` |
| `database.js`, `sitemap.xml` | rigenerati |

**Non toccati:** `content/apps/` (le app che fanno eccezione sono un lavoro a parte), la Quest, cookie consent, PDF.

**Libreria da installare:** `markdown` (Python, open source, versione fissata) per convertire le note in HTML. Senza di essa le note dovrebbero essere scritte in HTML (D3).

## Ordine di lavoro (Fase 3)

1. **Dati**: `dati/attivita.txt` compilato dall'inventario con tag ripuliti; i dati incerti come `[DA VERIFICARE]`. Nessun cambiamento visibile.
2. **`build.py` e `aggiorna.sh`**: lettura dei nuovi dati, pagine generate. *Ti mostro l'anteprima.*
3. **Menu, home e `attivita/` con i filtri.** *Cambia l'aspetto: mi fermo.*
4. **Parti da qui**: ti chiedo la selezione.
5. **Journal**: modello, motore e una nota di prova con testo `[DA COMPILARE DAL DOCENTE]`. *Mi fermo.*
6. **Primo percorso** (Polinomi e scomposizioni, ordine da confermare).
7. **Tema chiaro** sulle pagine nuove; **controllo** dei vecchi URL e del contenuto senza JS.

## Decisioni da approvare

| # | Decisione | Proposta |
|---|---|---|
| D1 | Voci fisse: Attività · Allenati · Journal · Chi sono (5 con il logo-Home), oppure 4 senza Allenati | 5, per la tua richiesta precedente |
| D2 | Alternativa 1 (statica) o 2 (filtri nel browser con HTML di riserva) | **2** |
| D3 | Note del Journal in Markdown, con la libreria `markdown` | ✅ consigliata |
| D4 | Metadati nel `<head>` delle app nuove **e/o** in `dati/attivita.txt` (vince il file) | ✅ consigliata |
| D5 | Niente `.nojekyll`; `_config.yml` con `exclude:`. Da decidere se `orfini-games/` e `orfini-math-quest.zip` restano pubblici | ✅ consigliata, il resto da decidere |
| D6 | Tag di classe nascosti sulle schede, filtro "classe" disponibile in fondo al pannello | ✅ consigliata |
| D7 | Niente "più usate" (richiederebbe statistiche); al suo posto "aggiornate di recente" e "più citate nel Journal" | ✅ consigliata |
| D8 | Codici classe GP = Grafica, MA = Manutenzione | da confermare |

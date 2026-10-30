# Proposta di architettura — Orfini Math Lab

Fase 2, revisione 5 (2026-10-30): **ipotesi di minimo lavoro**. Solo documento, nessun file del sito modificato. Le revisioni 1-4 (riorganizzazione di menu, sezioni, tag e metadati) sono nella storia git del ramo `riorganizzazione` e restano disponibili per il futuro. **Per ora non si fanno.**

## Indicazione del docente

> Proviamo a fare meno danni e meno lavoro possibile. Mi interessa avere un giornale-blog a cui collegare quello che c'è già. L'ipotesi di minimo lavoro è aggiungere solo quello, e collegarlo in maniera sensata con gli strumenti che ci sono già, come lo script di build. Niente visi di ragazzi: solo immagini di spalle o ritoccate.

## Cosa si fa

**Si aggiunge il Journal e lo si collega al sito esistente. Nient'altro cambia.** Restano come sono:
- menu e home (tranne due piccoli punti, sotto);
- il catalogo e i suoi filtri;
- le app;
- la Quest;
- `database.js`, prodotto da `build.py` come oggi;
- gli URL.

### 1. Le note
- Un file Markdown per nota, in `content/journal/` (cartella nuova, letta da `build.py`). Il nome è `AAAA-MM-GG-titolo-breve.md`.
- Le immagini stanno accanto, in `content/journal/media/`.
- Intestazione con 3 campi obbligatori e 2 facoltativi:

```markdown
---
titolo: Math Pool in classe: la retta diventa un tiro di sponda
data: 2026-11-12
descrizione: Un'ora sul coefficiente angolare giocando a biliardo sulla LIM.
attivita: math_pool_retta_pianocartesiano, arcade_challenge_scomposizioni_parabola
video: https://youtu.be/…        # facoltativo
---

Testo libero, 200-300 parole: perché l'ho costruita, come è andata, cosa cambio.

![La traiettoria proiettata sulla LIM](media/lim-tiro.jpg)
```

`attivita` contiene i **nomi dei file** delle app (senza `.html`), cioè gli stessi nomi che già esistono. Non serve inventare codici né compilare schede.

### 2. Cosa aggiunge `build.py` (un blocco nuovo, il resto invariato)
Dopo il catalogo, come già fa per sitemap e SEO della home:
1. **Legge le note** e converte il Markdown in HTML con la libreria `markdown`, la stessa versione già presente nel sistema (3.10.3), da aggiungere al `.venv`.
2. **Scrive le pagine statiche**, leggibili senza JavaScript, con canonical, anteprima social, autore e data:
   - `journal/index.html`: elenco cronologico;
   - `journal/<nome-nota>/index.html`: una pagina per nota.
3. **Collega in automatico, nei due sensi:**
   - nella nota, in fondo, le **attività collegate** con miniatura e titolo presi da `database.js`, il pulsante "Apri" e, se c'è, "Allenati su questo" (le lezioni della Quest che `build.py` già calcola);
   - in `database.js`, ogni attività riceve l'elenco delle note che la citano. La sua scheda in home mostra un piccolo link "📓 2 note", che porta alla nota se è una sola e all'elenco filtrato se sono di più.
4. **Immagini**: le ricomprime in WebP e cancella i metadati delle foto (tra cui la posizione GPS), con Pillow, già usato da `thumbnails.py`.
5. **Sitemap**: aggiunge le note.
6. **Controlli che segnalano senza bloccare**: un'attività citata che non esiste, un campo obbligatorio mancante, un'immagine troppo pesante.

### 3. Due ritocchi alle pagine esistenti
- **Menu**: la voce **"Journal"** c'è già. Oggi punta alla home; diventa `journal/`. È un cambio di link nelle 6 pagine con quel menu: index, competenze, verifiche, scuola, calcolo-mentale, 404.
- **Home**: una striscia **"Dal Journal"** con le ultime 3 note, scritta dal build tra due marcatori, come fa già per il catalogo SEO. Se non ci sono note, la striscia non compare.

### 4. Video
- File brevi (mp4 fino a circa 20 MB) nella cartella `media/`, mostrati con il lettore del browser.
- Video lunghi su YouTube, **solo come link con anteprima**, senza incorporarli. Così non si caricano contenuti di terzi e non serve toccare il cookie consent né la privacy policy.

### 5. Privacy delle immagini (regola vincolante)
- **Mai visi di studenti.** Solo foto **di spalle**, **ritoccate** (sfocate o coperte), oppure di LIM, quaderni senza nome, mani, schermi.
- Niente nomi, voci, registri, compiti con il nome visibile.
- Il modello della nota (`content/journal/_modello.md`) riporta la regola in cima, come promemoria da controllare prima di pubblicare.
- Lo script non riconosce i visi: il controllo resta del docente. Lo script si limita a cancellare i metadati delle foto.

### 6. Pubblicazione dei sorgenti
Senza precauzioni, GitHub Pages pubblicherebbe anche i file `.md` delle note e i documenti di lavoro in `docs/`. Si aggiunge un `_config.yml` di una riga:

```yaml
exclude: [content/journal, docs]
```

Effetto: si pubblicano solo le pagine generate e le immagini ricompresse. Le immagini restano visibili perché il build le copia in `journal/`. Le due pagine che oggi esistono grazie a Jekyll (`laboratoriomatematicoOrfini.html`, `tools/report_finale.html`) restano. `allenamento/vendor/` resta pubblicata. Dopo l'unione su `master` lo si verifica aprendo questi indirizzi.

## Scrivere una nota (meno di 5 minuti oltre al testo)
1. Copia `content/journal/_modello.md` con il nome `AAAA-MM-GG-titolo.md`.
2. Compila titolo, data, una riga di descrizione e le app collegate; scrivi il testo; metti le foto (di spalle o ritoccate) in `media/`.
3. Lancia il build offline: `.venv/bin/python3 -c "import build; build.GEMINI_API_KEY=''; build.main()"`. È lo stesso comando di oggi, descritto in `CLAUDE.md`; si può accorciare in uno script `./journal.sh`, se ti è comodo.
4. Guarda l'anteprima: `python3 -m http.server 8080` e apri `http://localhost:8080/journal/`.
5. Commit e push.

## Vecchi URL
**Nessuno cambia.** Si aggiungono soltanto `journal/` e `journal/<nota>/`. Il link "Journal" del menu cambia destinazione: non apre più la home, che resta comunque raggiungibile dal logo.

## File toccati

| File | Cosa |
|---|---|
| `content/journal/_modello.md`, `content/journal/media/` | **nuovi**: modello e cartella immagini |
| `content/journal/AAAA-MM-GG-prova.md` | **nuovo**: una nota di prova con testo `[DA COMPILARE DAL DOCENTE]`, da cancellare o sostituire |
| `journal/` | **generata** dal build |
| `journal.css` | **nuovo**: stile delle pagine del Journal, con le stesse variabili e lo stesso tema chiaro/scuro del sito |
| `_config.yml` | **nuovo**: una riga di `exclude` |
| `build.py` | blocco nuovo per il Journal; aggiunta del campo `journal` alle voci di `database.js` e delle note alla sitemap |
| `content/assets/js/modules/UIManager.js` | link "📓 n note" sulle schede (poche righe) |
| `index.html` | marcatori della striscia "Dal Journal"; link del menu |
| `competenze.html`, `verifiche.html`, `scuola.html`, `calcolo-mentale.html`, `404.html` | solo il link "Journal" del menu |
| `database.js`, `sitemap.xml` | rigenerati dal build |
| `.venv` | `markdown==3.10.3` |
| `tests/journal.spec.js` | **nuovo**: pagina del Journal leggibile senza JS, collegamenti nota↔attività, nessun URL esistente rotto |

**Non toccati:** app, Quest, catalogo e filtri della home, cookie consent, privacy policy, pagine dei contenuti.

## Ordine di lavoro
1. `_config.yml`, cartella `content/journal/` e modello.
2. Blocco del Journal in `build.py` e nota di prova. *Ti mostro l'anteprima.*
3. Collegamenti: link del menu, striscia in home, "📓 n note" sulle schede. *Cambia l'aspetto: mi fermo.*
4. Test e controllo dei vecchi URL.

Poi, separatamente: le app che fanno eccezione (`AUDIT.md`), una alla volta.

## Decisioni da approvare
| # | Decisione | Proposta |
|---|---|---|
| D1 | Solo il Journal, collegato all'esistente; il resto della riorganizzazione è rimandato | ✅ |
| D2 | `markdown==3.10.3` nel `.venv` | ✅ |
| D3 | YouTube solo come link, non incorporato | ✅ |
| D4 | `_config.yml` con `exclude: [content/journal, docs]` | ✅ |
| D5 | La voce "Journal" del menu punta a `journal/` | ✅ |

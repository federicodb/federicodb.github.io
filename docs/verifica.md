# Verifica dei criteri di accettazione

Aggiornato a ogni fase. Legenda: ✅ verificato · ⏳ non ancora applicabile · ❌ non passa.

## Fase 3 — Nebulosa 3D, movimento, effetti (2026-11-10)

Su indicazione del docente la costellazione è diventata una **nebulosa in tre dimensioni**: ruota piano con inerzia, pulsa, e una stella trascinata resta dove la si lascia. La Fase 2 qui sotto descrive la versione piana da cui si è partiti.

| Criterio | Esito | Come è stato verificato |
|---|---|---|
| Tutti gli URL presenti su `master` rispondono ancora | ✅ | Nessun file cancellato o rinominato; `tests/smoke_sito.spec.js` 118 su 119 (la stessa app 3D in timeout nel giro completo) |
| Da telefono si arriva a un'attività in tre tocchi | ✅ | Due tocchi: stella, poi attività nella scheda. Test a 380 px con tocco vero |
| Home ed elenco funzionano con JavaScript spento | ✅ | Test della Fase 1, ancora verde |
| Tutto raggiungibile da tastiera, con fuoco visibile | ✅ | Tab tra sezioni e parole, Invio apre, Esc chiude; il nodo col fuoco viene portato davanti e la rotazione si ferma; frecce ruotano, Maiusc + frecce spostano. Le figlie si raggiungono dopo aver aperto il padre. Il piè di pagina è nell'elenco (link "Informazioni e licenza" nella legenda) |
| Contrasto AA nei due temi | ✅ | Test su etichette, legenda e scheda nei due temi |
| Lighthouse mobile sulla home: prestazioni ≥ 90, accessibilità ≥ 95 | ✅ | Nebulosa: prestazioni **97-100**, accessibilità **96**. Elenco: prestazioni 97, accessibilità 100. Il punto perso è "dimensione dei bersagli": in tre dimensioni due stelle possono sovrapporsi |
| Mappa fluida a 380 px su un telefono di fascia media | ⚠️ non provato su un telefono vero | Disegnare un fotogramma costa circa 2 ms di JavaScript; 60 fotogrammi al secondo in Chromium senza scheda grafica. Trovato e tolto un collo di bottiglia: i pannelli con sfondo sfocato sopra la tela. Va provata su un telefono reale |
| Nessuno scorrimento orizzontale | ✅ | Test a 380 px; tutti i nodi dentro lo schermo |
| `npm run build` passa senza avvisi | ✅ | |
| Il workflow blocca la pubblicazione se la validazione fallisce | ⚠️ non provato | Come nelle fasi precedenti |

### Limiti chiesti dal brief

| Limite | Esito |
|---|---|
| Tutto il movimento si spegne con `prefers-reduced-motion` | ✅ test: la nebulosa si apre ferma, niente voli, niente elasticità |
| Interruttore "Riduci effetti" nel menu | ✅ sotto "Altro"; vale per tutto il sito e si ricorda. Test |
| Solo `transform` e `opacity` nelle animazioni CSS | ✅ scheda, pannello, rivelazioni allo scroll, velo di espansione |
| La mappa si ferma quando la scheda del browser non è visibile | ✅ il ciclo di disegno si interrompe se la pagina non è in primo piano (non c'è un test automatico) |
| In più: pulsante di pausa | ✅ ferma rotazione, battito e particelle (ciò che si muove da solo per più di 5 secondi deve potersi fermare) |

### Che cosa c'è

- **Tre dimensioni**: `tools/mappa.mjs` usa `d3-force-3d` e salva x, y, z. Le sezioni sono i vertici di un tetraedro schiacciato. Il sito disegna in prospettiva su una tela 2D, senza librerie.
- **Rotazione inerziale**: gira da sola a 0,045 rad/s (un giro in poco più di due minuti). Trascinando lo sfondo gira con il dito, al rilascio continua e rallenta fino alla velocità di crociera, nel verso dato. Si ferma con una scheda aperta, con il puntatore su una stella, con il fuoco da tastiera, con la pausa.
- **Stella trascinata**: le collegate la seguono; al rilascio resta esattamente lì e le altre si assestano. "Ricentra" rimette tutto com'era. A ogni visita si riparte dalla disposizione salvata.
- **Battito**: ogni stella e ogni alone pulsano piano, con una fase propria.
- **Polvere**: 320 punti attorno alle stelle e una nube per sezione, uguali a ogni visita.
- **Effetti**: particelle sui legami della stella scelta o puntata; onda verso le vicine al clic; stelle visitate accese e scia delle ultime dieci, salvate nel browser, con "Azzera il percorso" nella legenda.
- **Stessa cosa in due forme**: cambiando vista, le schede visibili e le parole dei filtri prendono lo stesso nome di transizione della loro stella (View Transitions API) e volano al suo posto. Dove il browser non la supporta il cambio è immediato.
- **Aprire un'attività dall'elenco**: la scheda si allarga fino a riempire lo schermo, poi si apre la pagina. Tra le pagine del sito che hanno il menu c'è anche la dissolvenza del browser; le app non sono state toccate.
- **Rivelazioni allo scroll** in Journal, Scuola e Calcolo veloce, dentro `@supports (animation-timeline: view())`.

### Test eseguiti

| Comando | Esito |
|---|---|
| `npx playwright test tests/costellazione.spec.js` | 20 su 20 |
| `npx playwright test tests/elenco.spec.js` | 10 su 10 |
| `tests/journal`, `offline`, `competenze`, `mappa`, `calcolo_mentale` | 49 su 49 |
| `npx playwright test tests/smoke_sito.spec.js` | 118 su 119 (stessa app 3D in timeout nel giro completo) |
| `tests/allenamento.spec.js -g "home|cambia utente"` | 2 su 2 |

Senza test automatico: il battito, le particelle e l'onda (si vedono, non sono misurati); l'aspetto della transizione tra le viste (il test controlla solo che i nomi siano assegnati e poi tolti); la pausa quando la scheda del browser è nascosta; le rivelazioni allo scroll. Nessuna prova su telefono o LIM reali.

Nota sui test: quelli della nebulosa non usano la grafica software (`swiftshader`) degli altri file. Con quella, una tela 2D ridisegnata di continuo scende a pochi fotogrammi al secondo dopo una decina di secondi, e i test sul movimento fallivano per questo.

## Fase 2 — Costellazione 2D (2026-11-10)

| Criterio | Esito | Come è stato verificato |
|---|---|---|
| Tutti gli URL presenti su `master` rispondono ancora | ✅ | Nessun file cancellato o rinominato. `tests/smoke_sito.spec.js` come in Fase 1 (stessa app in timeout nel giro completo) |
| Da telefono si arriva a un'attività in tre tocchi | ✅ | Due tocchi sulla mappa (stella, poi attività nella scheda) e due nell'elenco. Test a 380 px con tocco vero |
| Home ed elenco funzionano con JavaScript spento | ✅ | Senza JavaScript la home mostra l'elenco (test della Fase 1, ancora verde) |
| Tutto raggiungibile da tastiera, con fuoco visibile | ✅ | Test: Tab tra i 44 nodi, Invio apre, Esc chiude e riporta il fuoco sulla stella; una figlia nascosta si porta in vista; frecce, `+`, `−`, `0` |
| Contrasto AA nei due temi | ✅ | Test su etichette, legenda e scheda nei due temi; Lighthouse accessibilità 100 |
| Etichette leggibili a 1920 px da lontano | ✅ | Da 1800 px le etichette passano a 18 px (sezioni 21,6 px). Schermata a 1920 px. Da provare sulla LIM vera |
| Lighthouse mobile sulla home: prestazioni ≥ 90, accessibilità ≥ 95 | ✅ | Vista costellazione: prestazioni **97-98**, accessibilità **100**. Vista elenco: prestazioni tra 92 e 97 su tre misure (su questo portatile il tempo di blocco oscilla), accessibilità 100 |
| Mappa fluida a 380 px su un telefono di fascia media | ⚠️ non provato su un telefono vero | La mappa si ridisegna solo quando cambia qualcosa e ha 44 nodi e 118 linee. In emulazione Lighthouse (processore rallentato 4 volte) resta nella vista costellazione. Va provata su un telefono reale |
| Nessuno scorrimento orizzontale | ✅ | Test a 380 px; tutti i nodi stanno dentro lo schermo |
| `npm run build` passa senza avvisi | ✅ | Ora comprende il calcolo della mappa e un secondo controllo |
| Il workflow blocca la pubblicazione se la validazione fallisce | ⚠️ non provato | Come in Fase 1. In più la validazione fallisce se `data/mappa.json` non corrisponde ai dati |

### Cosa fa la costellazione

- **Disposizione**: calcolata da `tools/mappa.mjs` con d3-force e salvata in `data/mappa.json`. Test: ricalcolandola si ottiene lo stesso file, byte per byte. Su schermo verticale la stessa mappa è ruotata (x e y scambiate).
- **Tre livelli**: 4 sezioni fisse con forma e colore propri, 40 stelle, attività solo nella scheda.
- **Stelle**: grandezza secondo il numero di voci; colore e forma della sezione che ne ha di più; un anello mostra le quote delle altre sezioni.
- **Legami**: 102 tra parole con attività in comune (più spessi se sono di più) e 16 tra padre e figlia.
- **Zoom semantico**: le figlie si leggono da un ingrandimento di 1,4 volte in su; le etichette non si sovrappongono mai (si nasconde quella della stella più piccola).
- **Elasticità** (richiesta del 10 novembre): trascinando una stella, quelle collegate la seguono; al rilascio tutto torna alla posizione salvata. Test: la figlia segue, una stella non collegata quasi non si muove, alla fine lo spostamento è zero.
- **Riduci movimento**: la mappa si apre, ma senza voli né elasticità (trascinare una stella sposta la mappa).
- **Quale vista**: costellazione; elenco con avviso se `deviceMemory` ≤ 2, risparmio dati, oppure meno di 20 fotogrammi nel primo secondo. La scelta fatta a mano vince e si ricorda. Quattro test.

### Test eseguiti

| Comando | Esito |
|---|---|
| `npx playwright test tests/costellazione.spec.js` | 17 su 17 |
| `npx playwright test tests/elenco.spec.js` | 10 su 10 |
| `tests/journal`, `offline`, `competenze`, `mappa`, `calcolo_mentale` | 49 su 49 |
| `npx playwright test tests/smoke_sito.spec.js` | 118 su 119: la stessa app 3D della Fase 1 va in timeout solo nel giro completo |
| `tests/allenamento.spec.js -g "home|cambia utente"` | 2 su 2 |

Non eseguiti: il resto dei test della Quest, Math Bubble, Pen Plotter. Nessuna prova su telefono o LIM reali.

### Come provarlo in locale

```
npm run build
python3 -m http.server 8080      # http://localhost:8080/
npm run test:home
```

Da provare a mano: trascinare una stella grande (polinomi, funzione); rotella o due dita per ingrandire finché compaiono le figlie; cercare "frazioni", "mercatore", "invalsi" + Invio; Tab tra i nodi; "Vedi nell'elenco" dalla scheda e ritorno; il telefono in verticale; il tema chiaro; `http://localhost:8080/?vista=elenco` e `?vista=costellazione`.

## Fase 1 — Struttura, menu, vista elenco (2026-11-10)

| Criterio | Esito | Come è stato verificato |
|---|---|---|
| Tutti gli URL presenti su `master` rispondono ancora | ✅ | `git diff --name-status master` non ha file cancellati né rinominati. `tests/smoke_sito.spec.js`: le 40 app, le 11 spiegazioni, le note, le schede e i link interni delle pagine principali rispondono (un'app va in timeout solo nel giro completo, vedi sotto). Restano validi `index.html?tag=…` (vale come ricerca) e `index.html#about` (apre "Chi sono") |
| Da telefono si arriva a un'attività in tre tocchi | ✅ | Due tocchi: parola chiave, poi scheda. Test a 380 px con tocco vero in `tests/elenco.spec.js` |
| Home ed elenco funzionano con JavaScript spento | ✅ | Test con JavaScript disattivato: 139 schede, 4 sezioni, menu, link alle attività, "Chi sono" con la sola ancora |
| Tutto raggiungibile da tastiera, con fuoco visibile | ✅ | Test: "Vai al contenuto", voci del menu, "Altro" e "Chi sono" con Invio ed Esc, schede e parole con Tab; contorno di 3 px |
| Contrasto AA nei due temi | ✅ | Test che misura ogni testo della home nei due temi (soglia 4,5:1) e Lighthouse (accessibilità 100) |
| Etichette leggibili a 1920 px da lontano | ✅ in parte | Da 1800 px il testo dell'elenco cresce del 13% e le schede si allargano (schermata a 1920 px). Le etichette della mappa sono della Fase 2 |
| Lighthouse mobile sulla home: prestazioni ≥ 90, accessibilità ≥ 95 | ✅ | Prestazioni **98**, accessibilità **100**, buone pratiche 100, SEO 100. Misurato con `lighthouse` 13 in emulazione mobile, su un server locale che comprime come GitHub Pages |
| Mappa fluida a 380 px, nessuno scorrimento orizzontale | ⏳ / ✅ | La mappa è della Fase 2. Nessuno scorrimento orizzontale a 380, 390, 1280 e 1920 px su home, Journal, Archivio, Competenze, Scuola, Calcolo veloce |
| `npm run build` passa senza avvisi | ✅ | "Build completato senza avvisi" |
| Il workflow blocca la pubblicazione se la validazione fallisce | ⚠️ non provato | `.github/workflows/pubblica.yml`: la pubblicazione è un lavoro separato che parte solo se validazione e generazione riescono. Non si può provare prima del merge e del passaggio di Pages a "GitHub Actions" |
| Aggiungere un'attività richiede una sola voce | ✅ modificato | Per decisione del 9 novembre la voce non si scrive in `data/attivita.json` (generato) ma accanto al contenuto: una riga `<meta name="parole">` nell'app. Vedi `come-aggiungere-attivita.md` |

### Misure

- Lighthouse, home, mobile: FCP 1,1 s · LCP 2,4 s · blocco totale 60 ms · spostamento cumulativo 0,03.
- Con `python3 -m http.server` (che non comprime) le prestazioni scendono: la prima misura, prima delle correzioni, era 58 con spostamento 0,47. La causa era la riga delle parole chiave che si richiudeva dopo il caricamento; ora lo stato di partenza è nel CSS.
- Peso della home: `index.html` 170 KB non compressi; niente `database.js`, `marked` né KaTeX. Le formule dei titoli sono MathML scritto dal generatore.

### Test eseguiti

| Comando | Esito |
|---|---|
| `npx playwright test tests/elenco.spec.js` | 10 su 10 |
| `npx playwright test tests/smoke_sito.spec.js` | 118 su 119 nel giro completo, due volte: `scomp_3d_grafica_002.html` supera i 30 s dopo 35 app 3D aperte di fila. Da sola passa in 6 s. Non ho controllato se succede anche su `master`; in quell'app è cambiata solo la riga del meta |
| `npx playwright test tests/journal.spec.js tests/offline.spec.js tests/competenze.spec.js tests/mappa.spec.js tests/calcolo_mentale.spec.js` | 49 su 49 |
| `npx playwright test tests/allenamento.spec.js -g "home|cambia utente"` | 2 su 2 |
| `npm test` in `allenamento/` | tutti i gruppi OK |

Non eseguiti: il resto di `tests/allenamento*.spec.js` (la Quest non è stata toccata, a parte la tabella delle parole in `catalogo.js`) e i test di Math Bubble e del Pen Plotter.

### Come provarlo in locale

```
npm run build                          # rigenera tutto e valida
python3 -m http.server 8080            # poi http://localhost:8080/
npm run test:home                      # i test dell'elenco e del menu
```

Da provare a mano: ricerca "frazioni" o "pemdas", una parola padre come *numeri*, "Raggruppa per sezione", il tema dalla barra, "Altro → Chi sono", il telefono (menu, riga delle parole che scorre), JavaScript disattivato.

## Fase 0 — Ricognizione (2026-11-09)

La Fase 0 non cambia nessuna pagina: aggiunge `data/attivita.json`, `data/vocabolario.json`, `tools/valida.mjs`, lo script `npm run valida` e i documenti.

| Criterio | Esito | Come è stato verificato |
|---|---|---|
| Tutti gli URL presenti su `master` rispondono ancora | ✅ | `git diff --stat master` mostra solo file nuovi e una riga in `package.json`; nessun file esistente spostato, rinominato o cancellato |
| Da telefono si arriva a un'attività in tre tocchi | ⏳ | Fase 1 |
| Home ed elenco funzionano con JavaScript spento | ⏳ | Fase 1 (oggi la griglia della home è vuota senza JavaScript) |
| Tutto raggiungibile da tastiera, con fuoco visibile | ⏳ | Fasi 1 e 2 |
| Contrasto AA nei due temi, etichette leggibili a 1920 px | ⏳ | Fasi 1 e 2 |
| Lighthouse mobile: prestazioni ≥ 90, accessibilità ≥ 95 | ⏳ | Fase 1. Chrome DevTools MCP non è disponibile: servirà `lighthouse` da riga di comando o una misura manuale |
| Mappa fluida a 380 px, nessuno scorrimento orizzontale | ⏳ | Fase 2 |
| `npm run build` passa senza avvisi; il workflow blocca se la validazione fallisce | ⏳ | Fase 1. Per ora `npm run valida` passa: 139 attività, 40 parole, 0 errori |
| Aggiungere un'attività richiede una sola voce in `data/attivita.json` | ⏳ | Dipende dalla scelta sulla fonte dei dati (`ricognizione.md`, punto 8.3) |

### Controlli fatti in questa fase

- `node tools/valida.mjs`: esito positivo sui dati reali.
- Stesso comando su una copia dei dati con 8 difetti inseriti di proposito (alias al posto della parola, parola inesistente, nome completo al posto dell'id, file inesistente, lezione della Quest inesistente, parola quasi-duplicata, parola senza attività, parola con una sola attività): 13 errori segnalati, uscita con codice 1.
- Tutti i 137 indirizzi locali di `data/attivita.json` esistono nel repository; le 58 lezioni sono nel catalogo della Quest. I 2 indirizzi esterni non sono stati aperti.

### Come provarlo in locale

```
npm run valida                      # deve stampare "✓ Dati validi: 139 attività, 40 parole"
node tools/valida.mjs --riepilogo   # quante attività ha ogni parola, per sezione
```

Per vedere un errore: in `data/attivita.json` cambia una parola in `frazioni` e rilancia.

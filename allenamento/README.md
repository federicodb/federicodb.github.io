# Orfini Math Quest

La matematica dell'istituto professionale, dalla prima alla quinta, in forma di gioco.
Lezioni a piccoli passi con figure e grafici veri, esercizi sempre nuovi a parità di difficoltà, quesiti nello stile INVALSI, e tutte le dinamiche delle app più usate dai ragazzi: serie, missioni, leghe, stagione, forzieri, avatar.

File statici (HTML, CSS, moduli JavaScript): niente compilazione, pronti per GitHub Pages.

## Pubblicazione sul sito

La Quest vive in `/allenamento/` del repository `federicodb.github.io` (non in `content/`, che è riservata a `build.py`). Il tema chiaro/scuro usa la chiave `orfini_theme` come il resto del sito.

- Dopo aver cambiato `activities/catalogo.js`: `node tools/genera-catalogo.mjs` rigenera `catalogo.json` (id, titolo, area, codici MAT, anni). Lo leggono `build.py` (campo `allenamento` del database), `competenze.html` e la home del sito.
- `?indirizzo=<id>` (meccanico, elettrico, moda, grafica, odonto, socio, vita) preimposta l'indirizzo, anche al primo avvio: lo usano i link di `scuola.html`.
- I progressi stanno in `localStorage['orfini_quest_v2']`: la home del sito ne legge serie, XP, obiettivo e ultima attività.
- Test del sito: `npx playwright test tests/allenamento.spec.js` dalla root.

Per provarla in locale:

```bash
python3 -m http.server 8000   # nella cartella, poi apri http://localhost:8000
```

## Curricolo

38 attività in 10 aree, ognuna con 3 livelli, allineate a:
- **D.Lgs. 61/2017 e D.M. 92/2018** (Allegato 1, asse matematico), con i codici del sito: conoscenze MAT_K1–K4, abilità MAT_A1–A4, competenze MAT_C1–C4;
- **contenuti del secondo biennio e del quinto anno** dei professionali (disequazioni, sistemi, geometria analitica, esponenziali e logaritmi, goniometria, statistica e probabilità, calcolo combinatorio, studio di funzione, problemi di scelta);
- **ambiti e formati INVALSI** (Numeri, Relazioni e funzioni, Spazio e figure, Dati e previsioni; scelta multipla, vero/falso multiplo, risposta univoca, argomentazione).

| Area | Attività | Anni |
|---|---|---|
| Numeri | Frazioni, Percentuali, Potenze, Proporzioni, Notazione scientifica, Radicali | 1–2 |
| Polinomi | Monomi e polinomi, Prodotti notevoli, Scomposizioni | 1–2 |
| Equazioni e disequazioni | 1° grado, disequazioni 1° grado, 2° grado, disequazioni 2° grado | 1–3 |
| Funzioni lineari e rette | Funzioni lineari, Pendenza, Parallele e perpendicolari | 1–3 |
| Sistemi lineari | Metodo grafico, sostituzione, problemi | 2 |
| Geometria | Aree e perimetri, Pitagora, Similitudine e Talete, Solidi, Trigonometria | 1–4 |
| Dati e previsioni | Statistica, Probabilità, Calcolo combinatorio | 1–5 |
| Funzioni e modelli | Parabola, Esponenziali, Logaritmi, Goniometria, Studio di funzione, Problemi di scelta | 3–5 |
| Allenamento INVALSI | Seconda (grado 10), Quinta (grado 13), con simulazione a tempo | 2, 5 |
| Matematica al lavoro | Un'attività per ogni indirizzo dell'Orfini, oppure Matematica di tutti i giorni | 1–5 |

## Indirizzi dell'IIS «E. Orfini» (PTOF 2025-2028)

Al primo avvio (e dal Profilo) lo studente sceglie il suo indirizzo, tra quelli della scuola:

| Indirizzo | Denominazione ufficiale | Attività "al lavoro" |
|---|---|---|
| Meccanico | Industria e artigianato per il Made in Italy, Meccanica | scale del disegno, tolleranze, giri del mandrino, ingranaggi, convenienza CNC, scarti |
| Elettrico-Elettronico | Manutenzione e assistenza tecnica | Ohm, potenza e bolletta, serie/parallelo, partitore, valore efficace, decibel, condensatori |
| Fashion Factory | Industria e artigianato per il Made in Italy, Fashion Factory | figurini in scala, metri di tessuto, gonna a ruota, ricarico e IVA, taglie, pareggio, piazzamento |
| Graphic Design | Servizi commerciali, Design della comunicazione visiva e pubblicitaria | formati, pixel e dpi, colonne, preventivi, CTR, costo per clic, follower |
| Odontotecnico | Arti ausiliarie delle professioni sanitarie: Odontotecnico | gesso e acqua, micron, leghe e carati, ritiro della zirconia, diluizioni, precisione |
| Servizi Socio-Sanitari | Servizi per la sanità e l'assistenza sociale | porzioni, liquidi, rampe all'8%, indice di vecchiaia, media ponderata, budget |

Con un indirizzo scelto: i problemi "con le parole" di tutto il programma (percentuali, frazioni, proporzioni, statistica, probabilità, funzioni lineari, solidi, similitudine, notazione scientifica…) usano situazioni di quel laboratorio; la home ha il filtro "Per (indirizzo)" con le attività più utili e la scheda di ogni attività dice perché serve. Le competenze citate sono quelle dichiarate dalla scuola per ciascun indirizzo.
Senza indirizzo ("Preferisco di no"): nessuna personalizzazione di indirizzo, solo matematica della vita reale (spesa, viaggi, bollette, abbonamenti, interessi, rate, valore atteso dei giochi d'azzardo).
I contesti stanno in `activities/contesti.js`: per aggiungerne basta una riga.

**Numeri da calcolo mentale.** I valori cambiano a ogni sessione ma sono scelti perché il conto si faccia a mente: terne pitagoriche, angoli notevoli (sin 30° = 0,5), π lasciato nel risultato ("49π") o con 3,14 su numeri costruiti apposta, medie e percentuali "tonde". Durante lo sviluppo un controllo automatico ha passato in rassegna tutti i generatori per scovare quelli che richiedevano arrotondamenti da calcolatrice.

I quesiti INVALSI sono **originali e parametrici**, costruiti sugli stessi ambiti e formati delle prove: non sono copie delle prove ufficiali (che si trovano su Gestinv e sul sito INVALSI) e cambiano valori a ogni sessione.

## Correzione delle risposte: come si evita di confondere il giocatore

1. **Normalizzazione**: si accettano `x = 3`, `y = 2x + 1`, `25 dm`, `4,8 A`, `1500 giri/min`, `12,50 €`, `1.250`, `b⁷`, `3,2 × 10^5`, `4.2e+7`, `2 e -3`, `(2; 5)`, `radice di 2`, `3/4`, `0,75`…
   Si può scrivere anche **il calcolo impostato** al posto del risultato: `230/46`, `20% di 150`, `3/4 di 80`, `120 x 3`, `[2+3]·4`, `1000·157/(3,14·50)`, `3·4 = 12`. Sotto la casella compare "Leggo: … = valore".
2. **Lettura**: parser interno; se non basta, **math.js** (Apache-2.0).
3. **Confronto**: numeri con la tolleranza dell'arrotondamento richiesto, accettando anche piccoli arrotondamenti intermedi (con una nota); espressioni per equivalenza algebrica, con **nerdamer** (MIT) come seconda opinione simbolica.
4. **Forma**: solo se il valore è giusto (es. "scomponi completamente", "unica potenza", "frazione ridotta"). Una risposta giusta ma non nella forma richiesta non conta come errore: compare un suggerimento.
5. **Errori tipici**: messaggi mirati (sconto sottratto in euro, esponenti moltiplicati, verso della disequazione…).

### Verifica automatica (`npm test`)

Dopo `npm install`, `npm test` genera migliaia di lezioni e controlla che:
- la soluzione attesa sia giusta **secondo nerdamer e math.js**, risolvendo da capo equazioni, sistemi, vertici, scomposizioni, radicali, logaritmi;
- ogni risposta giusta, scritta in tutti i modi in cui la scriverebbe uno studente, venga accettata;
- le risposte sbagliate non passino mai;
- scelte multiple e vero/falso siano coerenti, e nei testi non compaiano `NaN` o `undefined`.

Ultima esecuzione grande: 343.200 esercizi, 1.194.075 risposte-studente, 63.600 verifiche simboliche, zero problemi.

## Calcolatrice

Tasto in alto a destra in ogni lezione (e nella simulazione INVALSI, dove la calcolatrice è ammessa). Pannello in basso sul telefono, laterale su PC e LIM; seno, coseno e tangente in gradi; "Usa nella risposta" copia il risultato. Si disattiva dal Profilo. Non c'è nella sfida lampo, che è calcolo mentale.

## Grafici

Sui piani cartesiani compaiono i **punti notevoli** con le coordinate: intersezioni con gli assi e vertice delle parabole, quando hanno coordinate esatte. Nelle domande che chiedono proprio quei valori vengono nascosti (si vedono nella spiegazione). Le lavagne JSXGraph hanno cursori grandi sotto (o accanto) al grafico e mostrano vertice e intersezioni mentre si muovono i cursori. Le etichette hanno un alone del colore di fondo e si dispongono senza sovrapporsi.

## Dinamiche di gioco

- **Serie giornaliera** con congelamenti (uno ogni 7 giorni, max 3) e **riparazione**: se si spezza, entro 2 giorni la si recupera completando 3 lezioni in un giorno.
- **XP e livelli**, **combo** fino a ×2,5 per le risposte giuste di fila, **problemi gemelli** che premiano il recupero dopo un errore.
- **Missioni giornaliere** (uguali per tutta la classe nello stesso giorno) e **forzieri settimanali** a tre livelli.
- **Leghe settimanali** da Bronzo a Diamante, con promozioni e retrocessioni.
- **Stagione mensile** gratuita a 30 livelli (Stagione Fibonacci, Pitagora, Ipazia…), con oggetti esclusivi.
- **Δ (delta)**, la moneta del gioco: si guadagna solo giocando e si spende in negozio (avatar, congelamenti). Nessun acquisto vero, nessun premio casuale.
- **Avatar** geometrico personalizzabile (forma, colore, occhi, bocca, accessori, adesivi, sfondi), con pezzi ispirati alle emoji più usate (occhi a cuore, lacrime di gioia, linguaccia, cappello da festa, testa in fiamme, 100, fulmine, diamante…) ridisegnati in SVG. Si ottengono nel negozio, nella stagione, nel forziere d'oro e come **regali dei traguardi** (livello 3, 5, 12; serie di 3, 7, 30 giorni; 10 lezioni perfette; 20 punti nella sfida lampo; lega Diamante). L'armadio mostra anche i pezzi ancora da sbloccare e come ottenerli.
- **Sfida lampo** (60 secondi, difficoltà crescente, record personale), **enigma del giorno** (uguale per tutti, si condivide il risultato), **ripasso a intervalli crescenti**, **simulazione INVALSI** con resoconto per ambito.
- **Traguardi** a tre gradi (bronzo, argento, oro).

Sono le meccaniche delle app che i ragazzi usano di più, scelte per far tornare ogni giorno e premiare lo sforzo. Restano fuori quelle che fanno leva sulla compulsione: niente premi a sorpresa, niente acquisti, niente vite che si perdono sbagliando, niente notifiche.

## Studenti e docente

- **Nickname** visibile solo allo studente, sul suo dispositivo.
- **Classe** (1ª–5ª) o area preferita: decide cosa viene proposto, ma tutto resta esplorabile.
- **Salvataggio locale** automatico; esportazione/importazione per cambiare dispositivo.
- **Codice per il docente** (Profilo → Consegna al prof): contiene nome e cognome scritti apposta, classe e risultati (XP, livello, serie, record, INVALSI, stelle per attività). È firmato: una modifica a mano lo rende non valido. Non è crittografia forte: va usato come registro, non come prova d'esame.
- **Area docente** (`#/docente`): incolli i codici della classe e ottieni classifica (da proiettare sulla LIM), stelle per attività ed export CSV.
- **Modalità docente** (`?docente` nell'indirizzo, o dal Profilo): tutti i livelli aperti.

## Dispositivi e leggibilità

- **Telefono**: barra delle sezioni in basso; tastierino matematico al posto della tastiera di sistema, chiuso finché non si tocca la casella (tasto ⌄ per richiuderlo, ABC per la tastiera normale); la spiegazione di un errore va nella scheda, così la barra in basso non copre la domanda; i filtri per argomento sono raccolti; pulsanti da almeno 48 px.
- **Tablet e PC**: colonna laterale, tastiera fisica (Invio per verificare, 1–4 per le risposte).
- **LIM**: Profilo → Modalità LIM (testi e pulsanti più grandi) con il tema chiaro per il proiettore.
- **Leggibilità**: testo base 17 px (Testo grande: +12,5%), Inter per testi e titoli di sezione, nessuna sillabazione automatica, pulsanti che vanno a capo tra parole intere, superfici lisce senza quadrettatura, contrasto verificato nei due temi (anche cursori e testi delle lavagne).
- **Verifica automatica** su 6 schermi (360, 390, 768, 1024, 1366 px, LIM 1920) e due temi: nessuna sovrapposizione tra elementi, nessuno scorrimento orizzontale.

## Grafica

- Figure SVG generate con i numeri veri di ogni esercizio (piani cartesiani, triangoli, solidi, rette dei numeri, circonferenza goniometrica, alberi, tessere algebriche).
- **Chart.js** per i grafici statistici, **JSXGraph** per le lavagne interattive (parabola con cursori, rette trascinabili, circonferenza goniometrica). Si caricano solo quando servono; senza connessione resta la figura SVG.
- **KaTeX** per le formule.

## Aggiungere un'attività

1. Copia `activities/_modello.js` (commentato riga per riga, con un esempio per ogni tipo di domanda).
2. Importala in `activities/catalogo.js`, nell'area giusta.
3. `npm test`.
4. `node tools/genera-catalogo.mjs`, poi il build del sito per aggiornare i collegamenti.

## Struttura

```
index.html                 guscio dell'app
css/app.css                stile (token Orfini Math Lab)
js/main.js                 avvio e navigazione
js/app.js                  stato, eventi di gioco, barra superiore
js/screens/                home, lezione, sfide, lega, premi, profilo, docente, primo avvio
js/ui/                     motore delle lezioni, tastierino, effetti, dialoghi
js/engine/                 casualità, parser, normalizzazione, correzione, ponte con nerdamer/math.js
js/gfx/                    figure SVG e caricamento di Chart.js/JSXGraph
js/game/                   regole di gioco, avatar, codici per il docente
activities/                attività e catalogo del curricolo
vendor/                    stili di KaTeX e JSXGraph
tests/                     test automatici
```

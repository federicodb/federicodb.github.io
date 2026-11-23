---
titolo: Tetracubi 3D: un cubo che si smonta in pezzi da quattro
data: 2026-11-23
descrizione: Un gioco a strati con i tetramini fatti di cubi e un laboratorio che divide un cubo in pezzi da 4 cubetti e li prepara per la stampa 3D: contare, ruotare nello spazio e capire che cosa succede al volume quando si ingrandisce.
attivita: tetracubi_3d
copertina: media/tetracubi-partita.png
---

## Cosa è

Due attività nella stessa pagina.

- **Il gioco**: i sette tetramini, fatti di cubi, cadono in un pozzo a tre dimensioni. Si ruotano di 90° attorno a tre assi e si incastrano; uno strato pieno sparisce. Il pozzo può essere $5 \times 5$ o $7 \times 7$.
- **Il laboratorio "Un cubo in pezzi"**: si sceglie un solido (cubo $4 \times 4 \times 4$, blocchi $4 \times 4 \times 2$ e $4 \times 3 \times 2$, cubo $2 \times 2 \times 2$) e l'app lo divide a caso in pezzi da 4 cubetti. Un cursore smonta e rimonta il puzzle, un altro lo fa esplodere; la vista **Piatto** mostra i pezzi come usciranno dalla stampante. Il file 3MF si apre in Bambu Studio e si stampa senza supporti.

![Una partita in corso: un pezzo verde scende mentre gli strati in basso si riempiono](media/tetracubi-partita.png)

## L'idea matematica: contare i cubetti

Un **tetracubo** è un pezzo di 4 cubetti uniti faccia contro faccia. Il conto del laboratorio è sempre in vista: $4 \cdot 4 \cdot 4 = 64 = 16 \cdot 4$. Un solido si divide in tetracubi solo se il numero dei suoi cubetti è un **multiplo di 4**: il cubo $3 \times 3 \times 3$ ha $27$ cubetti, e quindi non si può. È una condizione necessaria ma non sufficiente: il conto può tornare e l'incastro non esserci.

Il laboratorio non cerca la soluzione: parte dalla soluzione. Divide il solido e poi mescola i pezzi, quindi il puzzle si rimonta sempre.

![Il montaggio a metà: i pezzi tornano al loro posto dentro il contorno del cubo](media/tetracubi-montaggio.png)

**Girare nello spazio.** Nel piano i tetramini J e L sono uno lo specchio dell'altro, e nessuna rotazione li sovrappone. Nello spazio sì: basta capovolgere il pezzo, come si gira una pagina. Lo stesso vale per S e Z. Le due **Viti** del laboratorio invece restano diverse anche in 3D: sono speculari come la mano destra e la sinistra.

**Ingrandire.** I pezzi più alti escono dalla stampante alti $20$ mm, cioè il lato di un cubetto è circa $10$ mm. Se in Bambu Studio si raddoppia la scala, ogni lato raddoppia, ma il volume diventa $2^3 = 8$ volte più grande: otto volte la plastica e, più o meno, otto volte il tempo.

![La vista Piatto: i sedici pezzi disposti in file, ognuno appoggiato sul lato più piatto](media/tetracubi-piatto.png)

## Per prepararti alla verifica

- Nel laboratorio cambia il solido e leggi la prima riga dei dati: **cubetti = pezzi × 4**. Prova a prevedere il numero di pezzi prima di guardarlo.
- Il volume di un blocco si ottiene moltiplicando i tre lati, che siano in cubetti o in centimetri.
- **Attenzione**: raddoppiare i lati non raddoppia il volume. Le lunghezze si moltiplicano per $2$, le superfici per $4$, i volumi per $8$.

**Prova tu.** Un blocco $4 \times 4 \times 2$: quanti pezzi da 4 cubetti servono? Se in Bambu Studio raddoppi la scala di tutti i pezzi, quanti pezzi stampi? Quanta plastica serve rispetto a prima?

<details markdown="1"><summary>Soluzione</summary>

$4 \cdot 4 \cdot 2 = 32$ cubetti, $32 : 4 = 8$ pezzi. Con la scala doppia i pezzi restano $8$: cambia la loro grandezza, non il loro numero. Il volume di ogni pezzo diventa $2 \cdot 2 \cdot 2 = 8$ volte più grande, quindi serve circa $8$ volte la plastica.

</details>

## Come usarla in classe

Una proposta per iniziare: alla LIM si apre il laboratorio sul cubo $2 \times 2 \times 2$, il puzzle più piccolo, e si chiede alla classe quanti pezzi servono e perché sono uguali. Poi si passa al cubo $4 \times 4 \times 4$ e alla domanda del pannello: il cubo $3 \times 3 \times 3$ si può dividere in pezzi da 4? La risposta arriva contando, prima ancora di provare.

Il passo successivo è la stampa: secondo la stima dell'app, il set di sedici pezzi si stampa in meno di un'ora, e poi passa di mano in mano. Rimontare il cubo è un esercizio di visione spaziale, e il gioco allena la stessa abilità: ruotare un pezzo nella testa prima di farlo sullo schermo.

Il filo con le altre attività: la scala che fa crescere il volume come il cubo del lato è il rovescio della [proporzionalità diretta](../2026-11-23-proporzionalita-che-cosa-resta-uguale/), perché il volume **non** è proporzionale al lato. Per un altro oggetto da stampare e far girare ci sono le [ruote che non sobbalzano](../2026-11-05-ruote-che-non-sobbalzano/). Le regole e quattro esercizi sono nella [scheda da stampare](/schede/tetracubi_3d.html). Per allenarsi: **Solidi e volumi** e **Proporzionalità diretta e inversa** nella Quest.

## A cosa fare attenzione

- **Il gioco tra i pezzi** è di $0{,}2$ mm alla scala piena e si riduce con la scala: con una stampante poco tarata i pezzi possono entrare a fatica. Conviene provare prima il cubo $2 \times 2 \times 2$.
- **Il conto non basta**: che i cubetti siano un multiplo di 4 è necessario, non sufficiente. È un buon momento per distinguere le due parole.
- **Nel gioco le frecce si muovono rispetto alla camera**: se la vista ruota, cambia anche la direzione delle frecce, e all'inizio confonde.

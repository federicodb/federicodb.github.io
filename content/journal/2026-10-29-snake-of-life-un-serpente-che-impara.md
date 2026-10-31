---
titolo: Snake of Life: un serpente che impara da solo
data: 2026-10-29
descrizione: Un esperimento del laboratorio: il Gioco della Vita di Conway incontra un algoritmo evolutivo.
attivita: snake_conway_self, soglie_particelle_automa_cellulare
copertina: media/snake-of-life-il-serpente-pensa.png
---

## Cosa è

Snake of Life è nato come esperimento di arte e codice. Il campo di gioco è il **Gioco della Vita** di Conway, una griglia in cui ogni cella vive o muore in base alle vicine:

- una cella viva con 2 o 3 vicine vive sopravvive;
- una cella vuota con esattamente 3 vicine vive nasce;
- in tutti gli altri casi la cella muore o resta vuota.

Dentro questo mondo che cambia da solo si muove un serpente. Nessuno gli spiega le regole. In ogni generazione giocano 16 serpenti; quelli che sopravvivono più a lungo fanno figli, e generazione dopo generazione il loro "cervello" migliora.

![Snake of Life](/content/assets/thumbnails/snake_conway_self.webp)

## Perché sta nel laboratorio

È un modo concreto per parlare di **evoluzione** e di **intelligenza artificiale** senza formule: si vede una popolazione che migliora per selezione, non perché qualcuno l'ha programmata a mano. Ha la stessa famiglia di idee dell'app sugli automi cellulari a soglie: regole locali semplici, comportamenti globali complessi.

## Per prepararti alla verifica

- Snake non è un argomento di verifica, ma allena una cosa che in verifica serve sempre: **leggere un grafico**.
- Nel grafico **Come sta imparando** chiediti: cosa c'è sugli assi? Perché la linea del migliore sta sopra quella della media?
- **Attenzione**: la media e il valore più alto raccontano cose diverse. Il campione può migliorare anche se la media resta bassa.

**Prova tu.** In cinque generazioni il serpente migliore mangia $2,\ 4,\ 4,\ 7,\ 8$ volte. Qual è la media?

<details markdown="1"><summary>Soluzione</summary>

$\dfrac{2+4+4+7+8}{5} = \dfrac{25}{5} = 5$.

</details>

## Come usarla in classe

Non è un esercizio di calcolo: è un'osservazione guidata. Lo si proietta e si chiede di prevedere cosa farà il serpente. Poi si apre **Cosa sta pensando**: ogni mossa è una somma di pesi, e si vede quale vince.

Il grafico **Come sta imparando** (il migliore e la media di ogni generazione) è un piccolo esercizio di lettura di dati. Il simulatore di automi cellulari, nella stessa nota, mostra da dove viene il "mondo" in cui il serpente vive. È anche un'occasione per parlare di intelligenza artificiale senza miti, utile per l'educazione civica e digitale.

## A cosa fare attenzione

- **Il serpente non "capisce"**: ottimizza un punteggio. Cambiando i punti del voto (cibo, passi, morte) cambia il comportamento. È il modo più concreto per discutere di che cosa si chiede a una macchina.
- **Su computer lenti** meglio usarlo alla LIM che sui telefoni, e a velocità bassa.
- **Non c'è un allenamento della Quest collegato**: il lavoro sta nel discutere e nel leggere i dati.

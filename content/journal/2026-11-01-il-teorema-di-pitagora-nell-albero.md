---
titolo: Il teorema di Pitagora, dal triangolo all'albero frattale
data: 2026-11-01
descrizione: Un quadrato, un triangolo rettangolo, due quadrati più piccoli, e di nuovo: l'albero di Pitagora fa vedere il teorema e lo trasforma in un frattale da stampare in 3D.
attivita: albero_pitagorico_3d_gemini_001, sqrt2_is_irrational, tavola_tart_canva0003
copertina: media/albero-pitagora-3d.png
verifiche: 2GP___verifica_13_maggio_2026
---

## Cosa è

Un laboratorio sul teorema di Pitagora che diventa un albero. Sopra un quadrato si appoggia un triangolo rettangolo; sui suoi cateti nascono due quadrati più piccoli, e su ognuno si ripete la costruzione. I **parametri** sono cinque:

- i livelli di **ricorsione**;
- l'**angolo**;
- la **dimensione** della base;
- lo **spessore** in 3D;
- una **torsione**.

L'albero si vede insieme in **geometria 2D** e come **modello 3D**, e si può scaricare in formato STL per la stampa 3D. Il pannello **Analisi algoritmo** mostra la costruzione e lo pseudocodice ricorsivo.

## L'idea matematica

Se il quadrato ha lato $L$ e l'angolo è $\alpha$, i due nuovi lati sono

$$L_{sx} = L\cos\alpha \qquad L_{dx} = L\sin\alpha$$

e per il teorema di Pitagora le loro aree insieme valgono quanto il quadrato di partenza:

$$L^2\cos^2\alpha + L^2\sin^2\alpha = L^2$$

Così, a ogni livello, l'area totale dei quadrati nuovi resta la stessa: l'albero cresce senza "consumare" area. Con $\alpha = 45°$ è simmetrico; con $35°$, come nella copertina, si piega da una parte.

**Il filo rosso.** Lato e diagonale del quadrato sono l'esempio più antico di grandezze **incommensurabili**: nessuna tacca comune li misura, e il loro rapporto $\sqrt2$ non è una frazione. È il rovescio delle [quattro facce dello stesso discorso](../2026-11-01-fractions-lab-frazioni-in-torte-e-sulla-retta/).

## Per prepararti alla verifica

- Il teorema serve ogni volta che una lunghezza è il lato obliquo di un triangolo rettangolo nascosto: diagonali, altezze, distanze sul piano cartesiano. Cerca sempre il triangolo prima di calcolare.
- Da sapere: $c^2 = a^2 + b^2$, il cateto $a = \sqrt{c^2 - b^2}$, il teorema inverso, la distanza $AB = \sqrt{\Delta x^2 + \Delta y^2}$.
- **Attenzione**: l'ipotenusa è sempre il lato più lungo, opposto all'angolo retto. Se ti viene più corta di un cateto, hai sommato invece di sottrarre.

**Prova tu.** Un rettangolo misura $6 \times 8$ cm: quanto è lunga la diagonale? E qual è la distanza tra $A(-1;\ 2)$ e $B(4;\ 14)$?

<details markdown="1"><summary>Soluzione</summary>

Diagonale: $\sqrt{36 + 64} = \sqrt{100} = 10$ cm. Distanza: $\Delta x = 5$, $\Delta y = 12$, $\ AB = \sqrt{25 + 144} = \sqrt{169} = 13$.

</details>

## Come usarla in classe

Si parte da un solo livello di ricorsione: un quadrato, un triangolo, due quadrati. Con la calcolatrice si verifica che le due aree piccole fanno quella grande, poi si cambia l'angolo e si riprova: l'uguaglianza tiene sempre. Solo dopo si alzano i livelli e si guarda nascere il frattale.

Con l'**Analisi algoritmo** si legge lo pseudocodice: è un buon esempio di ricorsione, cioè di una funzione che chiama sé stessa su un problema più piccolo. Il modello STL, stampato, diventa un oggetto da tenere in mano. Per allenarsi: **Il teorema di Pitagora** e **Aree e perimetri**.

## A cosa fare attenzione

- **Il frattale affascina**: conviene fermarsi al primo livello finché il teorema non è chiaro.
- **Seno e coseno**: compaiono nelle formule dell'app; in prima e seconda si possono leggere come "le parti del lato" senza nominarli.
- **Livelli alti**: oltre 9-10 livelli il modello 3D diventa pesante sui computer lenti.

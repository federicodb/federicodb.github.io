---
titolo: Studio Plotter CNC: dalla curva alla penna
data: 2026-10-16
descrizione: Curve, frattali e solidi diventano istruzioni per una stampante 3D con la penna: la matematica che si tiene in mano.
attivita: pen_plotter__23v2_8K
copertina: media/plotter-spirale-fibonacci.png
---

## Cosa è

Uno studio per trasformare la matematica in disegni veri. Si sceglie un generatore e si regolano i parametri; l'app traduce il disegno in **G-code**, le istruzioni che una stampante 3D con una penna al posto dell'ugello esegue punto per punto. I generatori sono tanti:

- curve armoniche e attrattori;
- la spirale di Fibonacci;
- frattali, tassellazioni, L-system, algoritmi Turtle;
- flow field e pattern generativi;
- testi, mappe, solidi platonici in 3D con le linee nascoste.

Si può esportare in SVG e in G-code, e i solidi anche per OpenSCAD.

## L'idea matematica

Ogni tratto è una sequenza di punti nel **piano cartesiano**, in millimetri. `G1 X40 Y25` vuol dire: porta la penna nel punto $(40;\ 25)$. Il disegno viene ingrandito o rimpicciolito per stare nell'area utile: è una **proporzione**.

La spirale della copertina è costruita su quadrati di lato $1, 1, 2, 3, 5, 8$, con un quarto di cerchio in ognuno: la stessa idea della nota su $\varphi$, ma tracciata davvero con la penna. E prima di stampare l'app riordina i tratti per fare meno strada a penna alzata: un problema di ottimizzazione.

## Per prepararti alla verifica

- Questa attività non è un argomento di verifica, ma allena due cose che servono sempre: **le coordinate** e **la scala**.
- Guarda l'anteprima del G-code e cerca le righe con `X` e `Y`: prova a dire dove si trova la penna.
- **Attenzione**: in una scala tutte le misure si moltiplicano per lo stesso numero, anche le coordinate.

**Prova tu.** Un disegno largo $50$ unità deve diventare largo $120$ mm. Qual è il fattore di scala? Dove finisce un punto che stava a $x = 10$?

<details markdown="1"><summary>Soluzione</summary>

$120 : 50 = 2{,}4$. Il punto va a $10 \cdot 2{,}4 = 24$ mm.

</details>

## Come usarla in classe

È un'attività da laboratorio, da fare con la stampante o anche solo con l'anteprima alla LIM. Si sceglie un generatore, si cambia **un parametro alla volta** e si chiede alla classe di prevedere cosa succederà al disegno. Con la spirale di Fibonacci, prima di stampare, si può far contare i quadrati e misurarne i lati.

Il disegno stampato diventa un oggetto che si porta a casa: la matematica che resta.

## A cosa fare attenzione

- **La sicurezza**: la stampante si muove da sola; mani lontane dal piatto durante la stampa.
- **Un parametro alla volta**: cambiarne tanti insieme rende impossibile capire cosa ha fatto cosa.
- **Le dimensioni**: controllare sempre che il disegno stia nell'area utile del piatto, indicata nell'anteprima.

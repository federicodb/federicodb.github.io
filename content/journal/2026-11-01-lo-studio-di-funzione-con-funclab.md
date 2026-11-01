---
titolo: Lo studio di funzione con FuncLab: un'onda chiusa in un cerchio
data: 2026-11-01
descrizione: Si chiede all'intelligenza artificiale "una funzione periodica di frequenza 10x, inclusa in un cerchio di raggio 10" e poi la si studia davvero: dominio, simmetria, zeri, inviluppo, con il tutor socratico.
attivita: functions_lab_008, math_underground003_4el, parabola e disequazioni di secondo grado maggio 2026
copertina: media/funclab-onda-nel-cerchio.png
verifiche: 4EL___verifica_27_marzo_2026_fila_A, 3MEC___verifica_26_marzo_2026_fila_A, 3MEC___verifica_3_ottobre_2025
stato: bozza
---

## Cosa è

**FuncLab** è un esploratore di funzioni con l'intelligenza artificiale: si descrive una funzione a parole, si preme **Genera** e la funzione compare sul piano, con una scheda che ne riassume le proprietà. Il piano si trascina e si ingrandisce con la rotella (con Shift solo l'asse $x$, con Alt solo l'asse $y$); un clic sulla curva fissa un punto. A destra c'è il **tutor socratico**: non dà le risposte, fa domande sulla funzione che si vede.

## L'idea matematica

Abbiamo chiesto: *"dammi una funzione periodica di frequenza 10x, inclusa in un cerchio di raggio 10"*. FuncLab ha proposto

$$f(x) = \sin(10x)\,\sqrt{100 - x^2}$$

e la si può studiare come qualunque altra funzione:

- **Dominio**: la radice esiste solo se $100 - x^2 \geq 0$, cioè $-10 \leq x \leq 10$.
- **Inviluppo**: $|\sin(10x)| \leq 1$, quindi $|f(x)| \leq \sqrt{100 - x^2}$, cioè $x^2 + y^2 \leq 100$: l'onda non esce mai dal cerchio di raggio 10.
- **Simmetria**: il seno è dispari e la radice è pari, quindi $f(-x) = -f(x)$: la funzione è **dispari**.
- **Zeri**: dove $\sin(10x) = 0$, cioè $x = \frac{k\pi}{10}$, più gli estremi $x = \pm 10$.
- **Periodo** del seno: $\frac{2\pi}{10} = \frac{\pi}{5} \approx 0{,}63$: per questo le oscillazioni sono così fitte.

È lo stesso percorso di **Math Underground**: c'è una radice di indice pari (dominio), c'è una funzione goniometrica (periodicità), e il prodotto delle due eredita le proprietà di entrambe.

## Il dialogo con il tutor

[DA INSERIRE: alcune battute scambiate con il tutor socratico, copiate dalla cattura.]

## Per prepararti alla verifica

- Lo studio di funzione segue sempre lo stesso ordine: tipo di funzione, dominio, simmetrie, intersezioni con gli assi, segno, asintoti, crescenza. Scrivilo come scaletta prima di cominciare.
- Usa FuncLab per **controllare** il tuo studio, non per farlo: prima i conti, poi il grafico.
- **Attenzione**: l'intelligenza artificiale può sbagliare una formula o una proprietà. Ogni affermazione della scheda di FuncLab si può verificare con un conto, come quelle qui sopra.

**Prova tu.** Studia $g(x) = \sqrt{9 - x^2}$: dominio, simmetria, intersezioni con gli assi. Che figura è il suo grafico?

<details markdown="1"><summary>Soluzione</summary>

Dominio: $9 - x^2 \geq 0$, cioè $-3 \leq x \leq 3$. È pari: $g(-x) = g(x)$. Asse $y$: $g(0) = 3$; zeri: $x = \pm 3$. Da $y = \sqrt{9 - x^2}$ si ha $x^2 + y^2 = 9$ con $y \geq 0$: è la semicirconferenza superiore di raggio 3.

</details>

## Come usarla in classe

Alla LIM si fa scrivere alla classe la descrizione della funzione da chiedere, poi si studia insieme quella che FuncLab propone: la scheda di FuncLab diventa un elenco di affermazioni da **verificare**, una per una. Il tutor si può interrogare a turno, a voce alta, e la classe giudica se le sue domande portano avanti il ragionamento.

Per classificare la funzione prima di studiarla c'è **Math Underground**; per il segno della parabola, **Parabola e disequazioni di secondo grado**. Per allenarsi: **Funzioni lineari**, **La parabola**, **Studio di funzione**. La scheda da stampare raccoglie lo studio di funzione in sette passi.

## A cosa fare attenzione

- **La fiducia nell'AI**: FuncLab disegna bene, ma la scheda che accompagna il grafico va verificata. È proprio lì il valore didattico.
- **Le descrizioni ambigue**: "frequenza 10x" si può leggere in modi diversi. Chiedere alla classe che cosa intendeva è già matematica.
- **La connessione**: FuncLab gira su Google AI Studio e ha bisogno della rete.

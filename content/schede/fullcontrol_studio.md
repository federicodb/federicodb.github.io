---
attivita: fullcontrol_studio
figura: vaso_polare
didascalia: Il bordo di uno strato è una curva in coordinate polari; il filo che sale strato dopo strato è un'elica.
---

## Ripasso

La stampante segue un percorso, punto dopo punto. Per un oggetto rotondo ogni punto si descrive con la **distanza** $r$ dal centro e l'**angolo** $\theta$, poi si traduce con seno e coseno. Se il raggio cambia con l'angolo il bordo si increspa; a ogni giro il filo sale di uno strato, e il percorso è un'elica.

## Regole

- da polari a cartesiane: $x = r \cos\theta$, $y = r \sin\theta$
- bordo ondulato: $r = R + A \sin(n\theta)$, con $n$ onde in un giro, raggio tra $R - A$ e $R + A$
- numero di strati: $\frac{\text{altezza dell'oggetto}}{\text{altezza di uno strato}}$
- pendenza del percorso: $\tan\alpha = \frac{\Delta z}{\Delta s}$, dove $\Delta s$ è la strada fatta in orizzontale; l'ugello urta il pezzo se $\alpha$ supera circa $28°$

## Esercizi

1. Un punto del percorso ha $r = 20$ mm e $\theta = 60°$. Quanto valgono $x$ e $y$? Usa $\sqrt3 \approx 1{,}73$.
2. Il bordo di uno strato è $r = 30 + 3 \sin(6\theta)$ mm. Quante onde ci sono in un giro? Qual è il raggio più grande e quello più piccolo?
3. Un vaso è alto $45$ mm e ogni strato è alto $0{,}2$ mm. Quanti strati servono?
4. Un vaso cilindrico ha raggio $20$ mm e $200$ strati. Quanto filo deposita l'ugello, più o meno? Usa $\pi \approx 3{,}14$.
5. In un tratto di onda l'ugello si sposta di $5$ mm in orizzontale e sale di $5$ mm. Qual è la pendenza? Si può stampare con un limite di $28°$?

## Soluzioni

1. $x = 20 \cdot \cos 60° = 20 \cdot \frac12 = 10$ mm; $y = 20 \cdot \sin 60° \approx 20 \cdot 0{,}865 = 17{,}3$ mm.
2. $6$ onde; il raggio va da $30 - 3 = 27$ mm a $30 + 3 = 33$ mm.
3. $45 : 0{,}2 = 225$ strati.
4. Un giro è lungo $2\pi r \approx 2 \cdot 3{,}14 \cdot 20 = 125{,}6$ mm; $200$ giri fanno circa $25\,120$ mm, cioè circa $25$ m.
5. $\tan\alpha = \frac55 = 1$, quindi $\alpha = 45°$: troppo ripido, l'ugello urterebbe il pezzo. Bisogna ridurre l'ampiezza dell'onda o allungarla.

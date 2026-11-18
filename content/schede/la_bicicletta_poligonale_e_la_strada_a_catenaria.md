---
attivita: la_bicicletta_poligonale_e_la_strada_a_catenaria
figura: ruota_poligonale
didascalia: Una ruota pentagonale di raggio $R$ e apotema $a$ rotola sugli archi $y = R - a\cosh\frac{x}{a}$ e il mozzo resta sulla retta tratteggiata.
---

## Ripasso

Una ruota a poligono regolare su una strada piatta fa sobbalzare il mozzo: sta più in basso quando la ruota poggia su un lato, più in alto quando poggia su un vertice. Se la strada è fatta di archi di **catenaria** capovolta, ogni sobbalzo è compensato e il mozzo resta sempre alla stessa quota.

- $R$ è la distanza tra il mozzo e un vertice, $a$ (l'**apotema**) quella tra il mozzo e il centro di un lato.
- Il lato appoggiato in piano sta in cima a un arco; un vertice cade nell'avvallamento tra due archi.
- Più lati ha la ruota, più gli archi sono bassi: con tanti lati la strada è quasi piatta e la ruota quasi un cerchio.

## Regole

- $\cosh x = \frac{e^x + e^{-x}}{2}$: funzione pari, con il minimo $1$ in $x = 0$
- apotema di un poligono regolare di $n$ lati: $a = R\cos\frac{180°}{n}$
- esagono regolare: il lato è uguale a $R$
- strada: archi $y = R - a\cosh\frac{x}{a}$, il mozzo resta a quota $R$
- ogni arco, misurato lungo la strada, è lungo quanto un lato; in un giro la ruota percorre $n$ archi, cioè il suo perimetro
- su strada piatta il mozzo sale e scende di $R - a$

## Esercizi

1. Una ruota esagonale ha $R = 10$ cm. Quanto misura il lato? Quanto misura l'apotema? Usa $\cos 30° \approx 0{,}87$.
2. La stessa ruota corre su una strada piatta: di quanto sale e scende il mozzo?
3. Ora la ruota esagonale corre sulla strada a catenaria giusta. Quanto è lungo un arco, misurato lungo la strada? Quanta strada percorre la bicicletta in un giro di ruota?
4. Una ruota quadrata ha $R = 10$ cm. Calcola apotema e lato (usa $\cos 45° \approx 0{,}71$) e la strada percorsa in un giro.
5. Una ruota da $36$ lati ha $R = 10$ cm, e $\cos 5° \approx 0{,}996$. Quanto sono profondi gli avvallamenti della strada? Perché nell'app sembra quasi un cerchio?

## Soluzioni

1. Nell'esagono il lato è uguale a $R$: $10$ cm. Apotema: $a = 10 \cdot \cos 30° \approx 10 \cdot 0{,}87 = 8{,}7$ cm.
2. $R - a \approx 10 - 8{,}7 = 1{,}3$ cm.
3. Un arco è lungo quanto un lato: $10$ cm. In un giro la ruota percorre $6$ archi: $6 \cdot 10 = 60$ cm, il perimetro dell'esagono.
4. $a = 10 \cdot \cos 45° \approx 7{,}1$ cm; il lato è il doppio dell'apotema: $14{,}2$ cm. In un giro: $4 \cdot 14{,}2 = 56{,}8$ cm.
5. $a \approx 10 \cdot 0{,}996 = 9{,}96$ cm, quindi $R - a \approx 0{,}04$ cm, meno di mezzo millimetro: la strada è quasi piatta e la ruota quasi rotonda.

---
layout: post
title: Funzioni di variabile reale
subtitle: Appunti del corso di matematica 22/23
tags: [STEAM, math, geometry, 3dprint]
comments: false
---


# Funzioni di variabile reale
![Firefly math functions plots handwriting sketched 43940.jpg](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/Firefly_math_functions_plots_handwriting_sketched_43940.jpg)

## Cosa è una funzione

Una funzione di **variabile reale** è una relazione tra due insiemi numerici, uno dei quali è chiamato **dominio** e l'altro **codominio**. Ad ogni elemento del dominio, la funzione associa un elemento del codominio. 

Ecco alcuni esempi di funzioni nella realtà che ci circonda: 

- l'altezza di una persona in funzione dell'età
- la velocità di un oggetto in funzione del tempo
- il costo di un bene al variare della quantità

![https://upload.wikimedia.org/wikipedia/commons/6/67/Funcao_venn.png](https://upload.wikimedia.org/wikipedia/commons/6/67/Funcao_venn.png)

## Classificazione di una funzione

Le funzioni posso essere classificate secondo diversi aspetti che le caratterizzano. Riguardo le funzioni che abbiamo visto durante l’anno, possiamo distinguerle in diverse sottocategorie, rispondendo di volta in volta alle opportune domande.

Chiaramente possono verificarsi diverse combinazioni delle seguenti categorie.

È importante imparare a classificare correttamente una funzione per poter procedere al suo studio.

### Algebrica o trascendente?

- una funzione ******************algebrica****************** è rappresentata da una espressione che contiene solo le operazioni dell’algebra (somma/sottrazione, prodotto/divisione)
    
    $$
    ⁍
    $$
    
- una funzione **trascendente** contiene espressioni logaritmiche, esponenziali o trigonometriche
    
    $$
    ⁍
    $$
    

### Intera o frazionaria?

- una funzione è **intera** se non contiene la variabile al denominatore
    
    $$
    ⁍
    $$
    
- una funzione è **frazionaria** se contiene la variabile al denominatore

$$
⁍
$$

### Pari o dispari?

Cosa significa pari o dispari nel contesto delle funzioni?

- Una funzione è **pari** se $f(x)=f(-x)$

Significa che la funzione è simmetrica rispetto all’asse delle ordinate.

![geogebra-export (36).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(36).png)

- Una funzione è ****************dispari**************** se $f(-x)=-f(x)$, ossia se l’opposto di un valore input restituisce l’opposto del valore di output.

Significa che la funzione è *anti-simmetrica*.

![geogebra-export (37).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(37).png)

- Una funzione non è ************************************nè pari nè dispari************************************ quando non succede nessuna delle due cose che abbiamo appena visto.

![geogebra-export (38).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(38).png)

### Razionale o irrazionale?

- una funzione **razionale** è una funzione esprimibile come rapporto fra polinomi, in modo analogo ad un numero razionale che è un numero esprimibile come rapporto fra interi
    
    $$
    f(x)=\dfrac{3x}{2x-5}
    $$
    
- una funzione **************************************irrazionale************************************** contiene la variabile sotto segno di ********radicale********

$$
f(x)=\sqrt{\dfrac{3-x}{x+5}}
$$

### Funzioni iniettive, suriettive, biiettive (invertibilità)

Una ulteriore classificazione delle funzioni di variabile reale può essere fatta secondo i seguenti aspetti:

- esistono valori del codominio che si ripetono in corrispondenza di valori del dominio diversi?
- ogni valore del codominio proviene da almeno un valore del dominio?

Facciamo un esempio: 

La ricetta della carbonara prevede di usare un uovo per ogni porzione, più uno (per la padella). Possiamo scrivere la funzione che associa al numero di porzioni il numero di uova necessarie. 

$$
f(x)=1\cdot x+1
$$

Dopo aver notato che è una funzione polinomiale intera, e quindi che avrebbe per dominio tutti i valori reali, possiamo pensare che concretamente ha senso preparare la carbonara per un numero minimo di 1 porzione, per cui il dominio della funzione è limitato a $x\geq1$.

Fatta questa premessa, vediamo che non è possibile che due diversi numeri di porzioni abbiano bisogno dello stesso numero di uova. 

Viceversa, se guardiamo nella ciotola in cui stiamo per sbattere le uova, possiamo risalire al numero di porzioni semplicemente sottraendo una unità al numero di uova.

Cioè $x=f(x)-1$, e semplicemente **invertendo le variabili** possiamo scrivere il numero di persone in funzione delle uova contate: $f(x)=x-1$.

<aside>
💡 Questa è una funzione **iniettiva**:  non esistono ambiguità.

</aside>

Ora, per fare un controesempio, pensiamo a questa situazione:

Un calciatore calcia il pallone verso la porta, descrivendo una parabola. Esistono due punti in cui il pallone abbia raggiunto esattamente la stessa altezza? 

La risposta è sì, ne esistono sempre 2 distinti, uno relativo alla fase di ascesa ed uno a quella di discesa.

Quindi la funzione che esprime la traiettoria del pallone è iniettiva?

## **Dominio**

Il ****************dominio**************** di una funzione è l'insieme dei valori di input per cui la funzione è definita.

Possiamo riassumere i casi possibili, limitandoci ai casi studiati in classe.

### Funzioni polinomiali

In genere le funzioni polinomiali hanno per dominio tutto l’insieme $\R$. Non ci soffermiamo oltre.

### Funzioni razionali frazionarie

Se una funzione contiene una variabile al denominatore, dobbiamo essere sicuri di non correre il rischio di **[dividere per zero](https://www.notion.so/Dividere-per-0-1702c7eade9d4c989a2a158c645b1039?pvs=21).**

Facciamo un esempio.

$$
f(x)=\dfrac{3x-9}{x-1}
$$

Come si vede, il denominatore è $x-1$. Se il dominio non avesse nessuna limitazione, in corrispondenza di $x=1$ otterremmo $1-1=0$.

In questo caso l’espressione della funzione perde di significato, e quindi dobbiamo eliminare il valore che annulla il denominatore. In questo caso, quindi, il dominio è costituito da tutti i valori reali, tranne $x=1$. In simboli, 

$$
D=\R-\{1\} \\ x\neq1
$$

### Funzioni irrazionali (intere e frazionarie)

Quando una funzione è irrazionale, dobbiamo distinguere due casi:

- radice di indice pari [l’**argomento** deve essere positivo]
- radice di indice dispari [nessuna limitazione]

Da cosa deriva questa distinzione? Dal fatto che studiamo funzioni di variabile **********reale**********, e nel mondo dei numeri reali c’è una sola limitazione: non possiamo calcolare radici con indice pari di numeri negativi.

Facciamo degli esempi.

- $\sqrt{-4}$ non ha senso in $\R$, infatti non esiste alcun numero che moltiplicato per se stesso restituisca $-4$.
- $\sqrt[3]{-8}$ invece esiste, infatti $(-2)(-2)(-2)=-8$

Questo si può generalizzare a tutti gli indici, ragionando in generale di indici pari o dispari.

Allora facciamo un esempio di funzione irrazionale e studiamone il dominio.

$$
f(x)=\sqrt{x^2-9}
$$

L’argomento, $x^2-9$, è già stato studiato in un altro esercizio, e sappiamo che è una quantità positiva solo se $x<-3 \vee x>3$. Quindi il dominio della funzione, includendo i due estremi di tale intervallo (in cui la funzione assume valore nullo) è 

$$
D=\{x\in\R, x\leq-3\vee x\geq3\}
$$

Il concetto è più chiaro se vediamo il grafico di tale funzione. L’intervallo fra -3 e 3 non è rappresentato in rosso. Corrisponde ai valori negativi dell’argomento.

![geogebra-export (10).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(10).png)

Per renderci conto delle differenze, studiamo il dominio di una funzione irrazionale con indice **************dispari**************.

$$
f(x)=\sqrt[3]{x^2-9}
$$

In questo caso il dominio è tutto $\R$, come è possibile dedurre dal grafico seguente.

![geogebra-export (11).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(11).png)

### Funzioni trascendenti

Abbiamo studiato solo alcune funzioni trascendenti: funzioni logaritmiche e funzioni goniometriche.

Ricordiamo che quella logaritmica è semplicemente una forma diversa del problema esponenziale.

<aside>
💡 Se $a^x=b$, dobbiamo porre limitazioni sulla base pensando ad $a>0 \wedge a\neq 1$. Sotto queste ipotesi siamo sicuri che $b>0$.

</aside>

Possiamo quindi definire il ******************logaritmo****************** di b in base a il numero x, ossia l’esponente a cui elevare la base a per ottenere la quantità b.

In simboli:

$$
a^x=b \Rightarrow x=\log_a{b}
$$

Se studiamo una funzione logaritmica, dobbiamo sempre porre condizioni sull’argomento del logaritmo, imponendo che sia strettamente positivo.

Ad esempio, studiamo la funzione 

$$
f(x)=\log{(x^2-9)}
$$

Dobbiamo individuare gli intervalli di $\R$ in cui $x^2-9>0$.

Come sappiamo già, gli intervalli in cui l’argomento è positivo sono $x<-3\vee x>3$.

Possiamo averne conferma nel grafico seguente; fra i valori -3 e 3 compresi la funzione non esiste.

Quindi il dominio è 

$$
D=\{x\in \R, x<-3\vee x>3\}
$$

![geogebra-export (12).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(12).png)

## Segno

Cosa significa studiare il segno di una funzione? Significa individuare se e quando la funzione assuma valori positivi. 

Facciamo un esempio. Abbiamo una **funzione ricavo** di espressione $R(x)=5x$ ed una **funzione costo** $C(x)=2x+3$, dove x è il numero di unità (in migliaia). Se vogliamo sapere quando il ricavo supererà i costi, dobbiamo costruire una funzione guadagno, sottraendo i costi al ricavo:

$$
G(x)=R(x)-C(x) \\ G(x)=5x-(2x+3)=5x-2x-3=3x-3
$$

Quindi ci basta studiare il **********segno********** della funzione guadagno. Saremo in una situazione di utile se questa è positiva. Operativamente si deve scrivere la disequazione

$$
G(x)>0 \\ 3x-3>0\\ 3x>3 \\x>1
$$

Abbiamo quindi scoperto che il guadagno è positivo per valori di $x>1$, ovvero 1000 unità.

Come studiamo il segno di una funzione? Impostando e risolvendo una disequazione.

Proviamo con un esempio più complesso.

 

$$
f(x)=\dfrac{x-5}{x+3}
$$

Scrivere $f(x)>0$ ci porta alla **disequazione frazionaria** 

$$
\dfrac{x-5}{x+3}>0
$$

Ci stiamo chiedendo dove numeratore e denominatore siano ****************concordi****************, quindi studiamo separatamente numeratore e denominatore e cerchiamo gli intervalli in cui siano concordi.

![vademecum 5 de carolis.png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/vademecum_5_de_carolis.png)

Possiamo confermare tali risultati osservando il grafico della funzione, dove sono evidenziati in verde i tratti in cui la funzione assume valori positivi, in rosso gli altri.

![geogebra-export (13).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(13).png)

Se studiamo il segno di una **funzione irrazionale** bisogna ancora una volta distinguere due casi, legati all’*indice del radicale* che contiene x. Se questo è pari, allora il segno in uscita sarà sempre positivo, viceversa può assumere anche valori negativi (come si vede [qui](https://www.notion.so/Funzioni-di-variabile-reale-705a294fa349458b8054fe9305283594?pvs=21)).

## Intersezioni con gli assi

Si chiamano ********************************************intersezioni con gli assi******************************************** i punti, se esistono, in cui il grafico della funzione interseca l’asse x, delle ascisse, o l’asse y, delle ordinate.

<aside>
💡 Esistono sempre le intersezioni con gli assi? In generale possiamo dire di no, e vedremo esempi che lo confermano.

</aside>

Come possiamo individuarli, quando esistono? Attraverso i **sistemi di equazioni**.

Partiamo attribuendo un’equazione agli assi cartesiani:

- l’asse x ha equazione $y=0$, essendo costituito da tutti i punti che hanno coordinata y nulla
- l’asse y ha equazione $x=0$, essendo costituito da tutti i punti di ascissa x nulla

Allora proviamo subito con un esempio:

$$
f(x)=\dfrac {x-5}{x+3}
$$

Teniamo presente il seguente grafico, in cui sono evidenziate le intersezioni che verranno individuate.

![geogebra-export (15).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(15).png)

### Intersezioni con l’asse x

Si stanno cercando gli ********zeri******** della funzione, e questo è chiaro scrivendo

$$
\begin{cases}f(x)=\dfrac{x-5}{x+3} \\ f(x)=0 \end{cases}
$$

Come abbiamo visto qui, possiamo risolvere semplicemente attraverso il metodo del confronto, ossia uguagliando a zero la funzione.

<aside>
💡 Se una funzione razionale frazionaria assume il valore nullo, è il numeratore che si annulla.

</aside>

Infatti basta considerare il numeratore e constatare che si annulla per $x=5$.

Quindi il punto $I_{x}=(5,0)$ è intersezione della funzione con l’asse x.

### Intersezioni con l’asse y

In questo caso useremo il metodo della sostituzione per risolvere il sistema

$$
\begin{cases}f(x)=\dfrac{x-5}{x+3} \\ x=0 \end{cases} \\ \dfrac{0-5}{0+3}=-\dfrac {5}{3}
$$

Quindi il punto $I_{y}=\Bigg(0,-\dfrac{5}{3}\Bigg)$ è intersezione della funzione con l’asse x.

## Limite di una funzione

### Limite per x che tende ad un valore finito

Il limite di una funzione rappresenta il valore al quale la funzione si avvicina quando l'input (solitamente indicato come x) si avvicina a un certo punto. 

$$
\lim_{x\to x_0}f(x)=L
$$

Una scrittura molto compatta, che si pronuncia così:

> Il **limite** per $x$ che **tende** ad $x_0$ di $f(x)$ esiste e vale L
> 

In parole semplici, questo significa che quando x si avvicina al valore a, la funzione f(x) si avvicina al valore L.

1. Limite sinistro:
Il limite sinistro di una funzione rappresenta il valore al quale la funzione si avvicina quando l'input x si avvicina a un certo punto da valori inferiori. 
2. Limite destro:
Il limite destro di una funzione rappresenta il valore al quale la funzione si avvicina quando l'input x si avvicina a un certo punto da valori superiori. 

In sostanza,:

<aside>
💡 il **limite sinistro** e il **limite destro** sono due concetti che descrivono il comportamento della funzione quando l'input si avvicina a un certo punto da diverse direzioni. Se il limite sinistro e il limite destro di una funzione coincidono e sono uguali al limite di funzione, allora diciamo che la funzione ha un **limite** in quel punto.

</aside>

### Limite per x che tende ad infinito (e oltre)

![https://www.1843magazine.com/sites/default/files/styles/il_manual_crop_16_9/public/201612_DE_INF_90-HEADER-V2.jpg](https://www.1843magazine.com/sites/default/files/styles/il_manual_crop_16_9/public/201612_DE_INF_90-HEADER-V2.jpg)

In questo caso, attraverso il limite cerchiamo di “prevedere” quale sarà il comportamento di una funzione quando l’**********input********** è molto grande, talmente grande che non esiste un numero più grande.

In matematica esiste un simbolo per indicare tale valore, $\infty$.

Possiamo indicare in quale direzione intendiamo indagare aggiungendo $+,-$ davanti ala simbolo $\infty$.

Se vogliamo scrivere che il limite per x che tende ad infinito di una funzione sia il numero L, possiamo tradurre, in simboli, come

$$
\lim_{x\to +\infty}f(x)=L \\ \lim_{x\to -\infty}f(x)=L
$$

Proviamo con la funzione 

$$
f(x)=\dfrac{x+5}{x-2}
$$

Come si vede nella seguente tabella, al crescere del valore dell’**********input**********, rapidamente il valore dell’************output************ “si assesta” intorno al valore 1. Possiamo allora dire che il limite, per x che tende ad infinito, della funzione studiata vale 1. 

Vale la pena di notare che in questo caso è superfluo ragionare anche di numeri molto negativi: essendo dello stesso segno le variabili al numeratore ed al denominatore, si tratta comunque di quantità ****************concordi.**************** 

| input | output |
| --- | --- |
| 1 | -6.0000000 |
| 10 | 1.8750000 |
| 100 | 1.0714286 |
| 1000 | 1.0070140 |
| 10000 | 1.0007001 |
| 100000 | 1.0000700 |
| 1000000 | 1.0000070 |
| 10000000 | 1.0000007 |
| 100000000 | 1.0000001 |
| 1000000000 | 1.0000000 |

Possiamo rappresentare il nostro studio sul piano cartesiano. Vediamo che già in corrispondenza del valore 100 della variabile indipendente, la funzione si confonde con la retta tratteggiata, di equazione $y=1$.

![geogebra-export (39).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(39).png)

## Continuità

<aside>
💡 Possiamo dire che una funzione è **continua** in un punto se il **limite** della funzione in quel punto esiste (e quindi esistono sia il *limite sinistro* che il *limite destro*, coincidenti) e questo coincide con il valore della funzione in quel punto.

</aside>

Intuitivamente, un criterio molto rudimentale per capire se una funzione è continua è il seguente: 

> se riesco a disegnare la funzione senza interrompere il tratto, allora molto probabilmente questa è continua.
> 

Un primo concetto da stabilire è questo: di una funzione possiamo cercare i cosiddetti ********************************************punti di discontinuità********************************************, nel senso che al massimo le funzioni che trattiamo sono non continue in qualche punto.

Come selezioniamo i punti da studiare? A seconda della funzione che ci si presenta possiamo adottare diverse strategie.

Iniziamo con due grandi categorie di funzioni che possono presentare discontinuità puntuali.

Quali sono gli strumenti per questo tipo di analisi? I **limiti**, per x che si avvicina indefinitamente al valore che studiamo (”da sinistra” o “da destra”).

In simboli, dimostrare la continuità di una funzione in un punto significa verificare la seguente catena di uguaglianze:

$$
l=\lim_{x\to x_{0}+}f(x)=\lim_{x\to x_{0}^-}f(x)=f(x_{0})
$$

Come si legge questa catena di uguaglianze?

<aside>
💡 Una funzione è continua in un punto $x_{0}$ se esiste ed è finito un valore $l$, pari sia al limite *********sinistro********* che a quello *******destro******* della funzione per x che tende al punto, ed uguale al valore assunto dalla funzione proprio in $x_{0}$.

</aside>

### **Funzioni definite a tratti (prima specie)**

Appartengono a questa categoria le funzioni la cui legge rende chiara una ********************partizione******************** del dominio. Ad esempio consideriamo la funzione seguente assume definizioni (e valori) diversi a seconda del valore della variabile x:

$$
f(x)=\begin{cases}x-3, x<0 \\ x+3, x\geq0 \end{cases} 
$$

È  continua? Da dove si comincia? Il miglior candidato è il valore che fa da spartiacque, $x=0$. 

Proviamo a studiare i limiti sinistro e destro per la variabile che tende al valore 0.

$$
\lim_{x\to 0^-}f(x)=-3 \neq \lim_{x\to 0^+}f(x)=+3
$$

Quindi il limite sinistro ed il limite destro danno due valori finiti ma diversi fra loro. Inoltre $f(0)=3$.

Allora la funzione presenta una discontinuità di ************************************************************prima specie************************************************************  in 0, caratterizzata da un vero e proprio ******salto,****** come si vede nel grafico seguente******.******

![geogebra-export (16).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(16).png)

### Funzioni razionali frazionarie (seconda specie)

È poi possibile incontrare una seconda categoria di funzioni discontinue, quelle che presentano una **discontinuità di seconda specie**. In questo caso, avvicinandoci ad un punto di discontinuità i limiti forniranno valori non finiti. Un ottimo esempio di questo tipo di funzioni è rappresentato dalle funzioni razionali frazionarie.

Studiamo ad esempio la funzione **** 

$$
f(x)=\dfrac{1-x}{x-2}
$$

Il dominio di questa funzione è costituito da tutti i valori $x\in\R, x\neq2$.

Andiamo a vedere cosa succede proprio intorno a tale punto.

$$
\lim_{x\to2^-}f(x)=\lim_{x\to2^-}\dfrac{1-x}{x-2}=+\infty \\ \lim_{x\to2^+}f(x)=\lim_{x\to2^-}\dfrac{1-x}{x-2}=-\infty
$$

![geogebra-export (17).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(17).png)

Significa che avvicinandoci al valore 2 da sinistra, ossia per valori più piccoli, la funzione cresce velocemente fino a diventare quasi verticale. Avvicinandoci invece da destra, per valori più grandi, la funzione si “inabissa” e il suo valore precipita velocemente.

La funzione non è definita in 2, quindi la funzione è senz’altro discontinua per $x_{0}=2$, e la discontinuità è classificabile come di **seconda specie**.

## Asintoti

Si parla di ****************asintoti****************, in generale, quando una delle due variabili rappresentate sul piano cartesiano raggiunge un valore infinito.

Possiamo distinguere:

- asintoti orizzontali ($x\to\infty$)
- asintoti verticali ($y\to\infty$)
- asintoti obliqui

### Asintoti orizzontali

![Schermata del 2023-06-18 09-32-20.png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/Schermata_del_2023-06-18_09-32-20.png)

Un asintoto orizzontale è una retta orizzontale ($m=0$), che approssima la funzione per valori del dominio ******************************************lontani dall’origine******************************************. Abbiamo già affrontato il problema [qua](https://www.notion.so/Funzioni-di-variabile-reale-705a294fa349458b8054fe9305283594?pvs=21).

Per individuarli usiamo ancora i limiti.

Facciamo un esempio:

$$
f(x)=\dfrac{x-5}{x-3}
$$

Vediamo il suo grafico:

![geogebra-export (18).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(18).png)

È evidente che quando ci allontaniamo dall’origine, la funzione si confonde con una retta orizzontale, in questo caso di equazione $y=1$.

Formalmente dobbiamo scrivere

$$
\lim_{z\to\infty}\dfrac{x-5}{x-3}=1
$$

Significa che inserendo al posto di x valori molto grandi, il rapporto fra numeratore e denominatore ********************tende ad 1********************, ossia si avvicina, senza mai raggiungerlo, al valore 1.

È  possibile scoprire se una funzione ha o meno un asintoto orizzontale semplicemente guardando la sua espressione. 

<aside>
💡 Se f è una funzione razionale frazionaria, esiste un asintoto orizzontale solo se il grado del numeratore è minore o al massimo uguale al grado del denominatore.

</aside>

Nel nostro caso, sia numeratore che denominatore hanno grado pari ad 1, quindi l’asintoto orizzontale è determinato dal rapporto fra i coefficienti dei termini di grado 1.

Vediamo con un esempio cosa succede quando il numeratore ha grado minore di quello del denominatore.

$$
f(x)=\dfrac{x-5}{x^2-9}
$$

In questo caso il grado del numeratore è 1, quello del denominatore è 2. Allora possiamo essere certi che l’asintoto orizzontale esista, e che la sua equazione è quella dell’asse delle ascisse, ossi $y=0$.

Infatti 

$$
\lim_{x\to\infty}\dfrac{x-5}{x^2-9}=0
$$

Quindi la funzione “si schiaccia” sull’asse delle x, senza mai toccarlo.

![geogebra-export (19).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(19).png)

Quindi, **per questo tipo di funzioni**, chiamati $n$ il grado del numeratore e $d$ il grado del denominatore, possiamo dire che:

<aside>
💡 se $n<d$ l’asintoto orizzontale è $y=0$, se invece $n=d$ allora l’asintoto orizzontale sarà $y=k$, dove $k$ rappresenta il rapporto fra i coefficienti del grado più alto di numeratore e denominatore.

</aside>

### Asintoti verticali

Un asintoto verticale corrisponde ad una retta verticale, di equazione $x=h$.

Si manifesta in diverse situazioni, ad esempio nello studio di funzioni razionali frazionarie o logaritmiche, oltre ad alcune funzioni goniometriche.

Corrisponde al tendere delle ordinate ad infinito quando le ascisse tendono ad un valore finito.

$$
f(x)=\dfrac{x-5}{x^2-9}
$$

La funzione esaminata prima presenta due asintoti verticali, in corrispondenza degli zeri del denominatore, ossia $x=\pm3$. Quando il denominatore tende a 0, comunque otteniamo un valore infinito, per determinarne il segno basta effettuare prima lo studio del segno della funzione.

Dal diagramma del segno possiamo già dedurre uno **************pseudo-grafico************** della funzione.

![vademecum 5 de carolis (1).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/vademecum_5_de_carolis_(1).png)

Per determinarli in maniera formale, bisogna scrivere:

$$
\lim_{x\to-3^-} f(x)=-\infty \\ \lim_{x\to-3^+} f(x)=+\infty \\ \lim_{x\to+3^-} f(x)=+\infty \\ \lim_{x\to+3^+} f(x)=-\infty
$$

### Asintoti obliqui

Esiste un asintoto obliquo in un caso soltanto: la funzione (razionale frazionaria) è crescente, ed il grado del numeratore supera di 1 il grado del denominatore. In simboli, usando le stesse convenzioni già viste, $n=d+1$.

Facciamo un esempio:

$$
f(x)=\dfrac{x^2-9}{x-5}
$$

Il grado del numeratore è 2, il grado del denominatore è 1.

Ecco il grafico che rappresenta la funzione studiata:

![geogebra-export (21).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(21).png)

Se studiamo il limite della funzione agli estremi del dominio, otteniamo, essendo $n>d$, 

$$
\lim_{x\to +\infty}\dfrac{x^2-9}{x-5}=+\infty \\ \lim_{x\to -\infty}\dfrac{x^2-9}{x-5}=-\infty
$$

Come si vede, aldilà di quello che succede in prossimità di $x=5$, dove è presente un asintoto verticale dovuto all’annullarsi del denominatore, la funzione, per valori lontani dall’origine, può essere approssimata da una retta ******************non orizzontale.****************** È possibile determinare l’equazione di questa retta in forma esplicita, ossia come $y=mx+q$.

Vediamo brevemente come trovare il parametro $m$.

Basta risolvere il limite

$$
\lim_{x\to +\infty}\dfrac{1}{x}\cdot\dfrac{x^2-9}{x-5}=\lim_{x\to +\infty}\dfrac{x^2-9}{x^2-5x}=1
$$

Abbiamo aumentato di un grado il denominatore, moltiplicandolo per $x$. Così numeratore e denominatore hanno lo stesso grado, e il limite ha valore 1. Significa che $m=1$.

Resta da esplicitare il valore di $q$.

È possibile farlo studiando il limite seguente: 

$$
q=\lim_{x\to +\infty}[f(x)-mx]=\lim_{x\to +\infty}\Bigg[\dfrac{x^2-9}{x-5}-1\cdot x\Bigg]=\lim_{x\to +\infty}\Bigg[\dfrac{x^2-9-x^2+5x}{x-5}\Bigg]=5
$$

Quindi la retta che fa da asintoto obliquo in questo caso è la retta di equazione $y=x+5$.

## Intervalli di crescenza e di decrescenza, retta tangente e derivata

![Firefly a flat bidimensional rollercoaster in a park sideview intricate 1547.jpg](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/Firefly_a_flat_bidimensional_rollercoaster_in_a_park_sideview_intricate_1547.jpg)

### Crescenza e decrescenza

Un ultimo aspetto trattato, riguardo lo studio di una funzione, è il suo ******************andamento******************.

Vogliamo cioè capire se è possibile determinare i cosiddetti intervalli di ********************crescenza******************** e di ************************decrescenza************************.

Se da nella vita reale è immediato capire quando una grandezza stia crescendo o decrescendo in funzione di un’altra, quando parliamo di funzioni dobbiamo innanzitutto stabilire un criterio formale per definire una funzione crescente o decrescente in un intervallo.

Formalmente possiamo dire che una funzione **cresce** se scelti $x_{2}>x_{1}, f(x_{2})>f(x_{1})$.

![geogebra-export (22).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(22).png)

Viceversa, una funzione **decresce** in un intervallo se scelti $x_{2}>x_{1}, f(x_{2})<f(x_{1})$.

![geogebra-export (23).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(23).png)

### La retta tangente

In generale, le funzioni che si studiano sono più complicate di una funzione lineare.

Pensiamo, ad esempio, alla funzione 

$$
f(x)=x^3-2x^2
$$

Il grafico della funzione è riportato nella seguente immagine

![geogebra-export (24).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(24).png)

È immediato notare che la funzione non ha un andamento regolare, ossia non è ****************monotòna****************.

<aside>
💡 In matematica, una **funzione monotòna** è una funzione che mantiene l'ordinamento tra insiemi ordinati. Significa che se una funzione è crescente (o decrescente), lo è in ogni intervallo del suo dominio.

</aside>

Un modo per valutare l’andamento di una funzione è quello di “seguire” la funzione con una ****************************retta tangente****************************, ossia una retta con un solo punto di contatto con la funzione. Se associamo al valore dell’ascissa del punto di tangenza il valore della pendenza della retta tangente, otteniamo una nuova funzione, analizzando la quale possiamo prevedere il comportamento della funzione originale.

[Video del 2023-06-16 12-53-48.webm](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/Video_del_2023-06-16_12-53-48.webm)

Come si vede in questa animazione, la funzione $f(x)=x^2-1$ è decrescente ($m<0$) per $x<0$, è crescente ($m>0$) per $x>0$.

Notiamo subito che in un punto “speciale” la retta tangente è orizzontale. Torneremo [più avanti](https://www.notion.so/Funzioni-di-variabile-reale-705a294fa349458b8054fe9305283594?pvs=21) su questo aspetto.

C’è un aspetto importante da notare, che giustifica l’uso del limite nel calcolo della derivata:

Per avere una retta sono necessari almeno due punti.

1. Il punto $x_0$, quello in cui stiamo valutando la derivata
2. Un punto $x_0+h$, dove $h$ è una quantità ****************************infinitesimale****************************

Vediamo, nell’applet Geogebra seguente, cosa succede se non prendiamo il secondo punto “sufficientemente vicino” ad $x_0$: la retta ottenuta, in nero, non coincide assolutamente con la retta tangente, in fucsia.

[https://www.geogebra.org/classic/uvynm3d3?embed](https://www.geogebra.org/classic/uvynm3d3?embed)

Provate a modificare lo slider a, che gestisce la distanza fra due punti del grafico della funzione, e a spostare il punto $x_0$ con l’altro slider. È possibile inserire, nella casella di immissione testo, qualsiasi funzione.

Notiamo che solo per valori di a alti il rapporto incrementale in $x_0$ coincide con la pendenza $m$ della retta tangente. 

A questo punto dovrebbe essere chiaro il significato geometrico di **[derivata](https://www.notion.so/Funzioni-di-variabile-reale-705a294fa349458b8054fe9305283594?pvs=21)**.

### La funzione derivata

Se associamo il valore della pendenza della retta tangente all’ascissa del punto di tangenza, possiamo arrivare ad una vera e propria funzione, detta ****************derivata****************. La derivata “misura” l’andamento, punto per punto, della funzione che studiamo.

<aside>
💡 Negli intervalli in cui la funzione derivata ha **segno positivo**,  la funzione è ******************crescente******************. Negli intervalli in cui la funzione ha ****************************segno negativo****************************, la funzione è ************************decrescente************************.

</aside>

Quindi ci basta studiare il segno della derivata per descrivere l’andamento della funzione studiata.

Partiamo dal concetto di ******************************************rapporto incrementale******************************************. Formalmente assomiglia molto al concetto di ****************pendenza**************** di una retta.

La pendenza della retta ha espressione 

$$
m=\dfrac{\Delta y}{\Delta x}=\dfrac{y_{2}-y_{1}}{x_{2}-x_{1}}
$$

Quando studiamo una funzione più complessa di una funzione lineare, abbiamo bisogno di un indicatore più sofisticato per scoprire se e dove questa cresca o decresca. Costruiamo quindi la formula del rapporto incrementale:

$$
r_{i}=\dfrac{f(x_0+h)-f(x_0)}{x_0+h-x_0}=\dfrac{f(x_0+h)-f(x_0)}{h}
$$

La lettera $h>0, h\rightarrow0$ rappresenta una quantità ****************************infinitesimale (****************************tende a 0****************************)****************************, la distanza fra le due ascisse dei punti che ci servono per costruire la retta tangente.

Se passiamo al ************limite************ per $h\rightarrow0$, otteniamo proprio **derivata nel punto** $x_0$, ossia il valore della pendenza della retta tangente in questo punto.

$$
f'(x_0)=\lim_{h\to0}\dfrac{f(x_0+h)-f(x_0)}{h}
$$

 Questa non è ancora una funzione, essendo un singolo valore calcolato per $x_0$. Ma ci basta considerare una generica $x$ invece di $x_0$ per ottenere la funzione derivata:

$$
f'(x)=\lim_{h\to0}\dfrac{f(x+h)-f(x)}{h}
$$

### Derivabilità

Non tutte le funzioni sono derivabili ovunque. Innanzitutto non ha senso considerare la derivabilità nei punti esclusi dal dominio di una funzione.

Inoltre esistono dei casi in cui non è possibile calcolare la derivata neanche in punti inclusi nel dominio di una funzione. Questo succede per la definizione di derivata come limite del rapporto incrementale. È possibile che non esista un limite unico, ossia che il limite sinistro e quello destro siano diversi. Facciamo qualche esempio di funzioni non derivabili, e vediamone i grafici.

1. La funzione “modulo”, o valore assoluto, che presentano nel loro grafico un “punto angoloso”:

$$
f(x)=|x|
$$

![geogebra-export (29).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(29).png)

1. Le funzioni che presentino una “cuspide”, come 

$$
f(x)=\sqrt{|x-5|}
$$

![geogebra-export (30).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(30).png)

### Derivata della funzione costante

Una funzione costante, non mostrando alcuna variazione, non può che avere una derivata ovunque nulla:

$$
f(x)=k \Rightarrow f'(x)=0
$$

![geogebra-export (31).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(31).png)

### Derivata della funzione lineare

Una funzione lineare, non avendo variazioni nell’andamento (una retta rappresenta una direzione costante), restituisce, una volta derivata, il coefficiente angolare della retta che ne rappresenta il grafico.

 

$$
f(x)=2x \Rightarrow f'(x)=2
$$

![geogebra-export (32).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(32).png)

### Derivata della funzione potenza

Se dovessimo costruire la derivata di una funzione punto per punto attraverso la definizione di rapporto incrementale, avremmo bisogno ogni volta di ore di lavoro. È invece possibile sfruttare alcune semplici strategie per derivare qualsiasi funzione derivabile.

Cominciamo a studiare la derivata della ********************************funzione potenza********************************. Intendiamo funzioni riconducibili alla forma

$$
f(x)=k\cdot x^\alpha
$$

Sfruttando la definizione di rapporto incrementale, arriviamo a determinare la derivata di tali funzioni: 

$$
f(x)=k\cdot x^\alpha \Rightarrow f'(x)=k\cdot \alpha\cdot x^{\alpha-1}
$$

La lettera k rappresenta un eventuale coefficiente della funzione potenza, ma ci dà la possibilità di introdurre una prima importante proprietà della derivazione:

<aside>
💡 L’******************operatore derivata****************** è ****************lineare**************** rispetto al prodotto per un costante.

</aside>

Significa che possiamo fare finta di trascurare inizialmente il coefficiente k per poi applicarlo alla derivata.

Facciamo un esempio concreto. Diciamo di voler studiare la derivata della funzione $f(x)=3x^2$.

Allora $\alpha=2, k=3$. Applicando la formula di derivazione della funzione potenza otteniamo 

$$
f'(x)=3\cdot 2\cdot x^{2-1}=6x
$$

![geogebra-export (27).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(27).png)

### Derivata della funzione somma

Proviamo a complicare le cose. Studiamo ora la funzione $s(x)=x^3-2x^2$.

Questa volta abbiamo una somma (algebrica) di due oggetti. Sfruttiamo la seguente proprietà: 

<aside>
💡 La derivata di una somma di funzioni è pari alla somma delle derivate calcolate singolarmente.

</aside>

$$
D\Big[f(x)+g(x)\Big]=f'(x)+g'(x)
$$

Come sfruttiamo questa proprietà? Derivando ciascun addendo della funzione singolarmente, e rimettendoli poi insieme rispettando i segni.

Quindi $s(x)=x^3-2x$ può essere derivata pensando  di derivare prima $f(x)=x^3$ e poi $g(x)=-2x$, per sommare i risultati alla fine.

$$
s(x)=f(x)+g(x) \\f(x)=x^3 \Rightarrow f'(x)=3x^{3-1} =3x^2\\g(x)=-2x^2 \Rightarrow g'(x)=-2\cdot 2x^{2-1}=-4x^1=-4x \\ \Rightarrow s'(x)=3x^2-4x
$$

La derivata della funzione studiata è ancora una funzione nella variabile x, ma come possiamo notare il grado della funzione si è abbassato di una unità.

![geogebra-export (33).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(33).png)

### Derivata della funzione prodotto

Con la somma è facile! Funziona anche con il prodotto? Magari!!

Quando la nostra funzione ha la forma di un prodotto di due funzioni, non possiamo moltiplicare fra loro le derivate, non avrebbe senso!

Si può invece seguire la seguente strategia:

$$
D\Big[f(x)\cdot g(x)\Big]=f'(x)\cdot g(x)+f(x)\cdot g'(x)
$$

Quindi procediamo con un esempio.

$$
p(x)=(3x-5)(x^2-3x)
$$

![vademecum 5 de carolis (4).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/vademecum_5_de_carolis_(4).png)

![geogebra-export (28).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(28).png)

### Derivata della funzione quoziente

Analogamente a quello che succede con il prodotto, **non è vero** che la derivata del quoziente di due funzioni sia il quoziente delle due derivate. La formula è un po’ più complicata, ma se siamo ordinati non è difficile calcolarla.

Scriviamo in simboli la regola di derivazione: 

$$
D\Bigg[\dfrac{f(x)}{g(x)}\Bigg]=\dfrac{f'(x)\cdot g(x)-f(x)\cdot g'(x)}{[g(x)]^2}
$$

Facciamo un esempio concreto:

$$
q(x)=\dfrac {x-4}{x^2-9}
$$

![vademecum 5 de carolis (5).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/vademecum_5_de_carolis_(5).png)

![geogebra-export (34).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(34).png)

È utile notare che sia la funzione che la sua derivata non esistono in corrispondenza dei valori $x=\pm3$. Per rapidità, nello studio del segno della derivata non si è tenuto conto del segno del denominatore, che dove è diverso da 0 è sempre positivo.

### Studio del segno della derivata

Abbiamo detto che il segno della funzione derivata ci dice se la funzione stia crescendo o decrescendo.

Allora vediamo in concreto come applicare questa strategia nello studio di una funzione, ad esempio 

$$
s(x)=x^3-2x^2
$$

Abbiamo già visto [qui](https://www.notion.so/Funzioni-di-variabile-reale-705a294fa349458b8054fe9305283594?pvs=21) che $s'(x)=3x^2-4x$, studiamone il segno come facciamo di solito per una funzione di secondo grado.

![vademecum 5 de carolis (2).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/vademecum_5_de_carolis_(2).png)

Quindi la funzione studiata ************cresce************ per $x<0\vee x>\dfrac{4}{3}$, come è possibile capire dal seguente grafico. In verde sono rappresentate le porzioni del grafico in cui la funzione cresce, in rosso le porzioni in cui decresce.

A queste, come si vede, corrispondono le zone in cui la derivata, tratteggiata, assume valori positivi o negativi.

![geogebra-export (25).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(25).png)

### Punti stazionari, massimi e minimi locali

Finora abbiamo usato la derivazione per determinare gli intervalli di crescenza e quelli di decrescenza. È possibile ottenere un’altra importantissima informazione a proposito di una funzione, sfruttando gli **************************************zeri della derivata**************************************. Come separazione fra valori di segno diverso , gli zeri della derivata, insieme allo studio del suo segno, possono dirci se un punto in cui a derivata si annulla (*****************punto stazionario*****************) ******sia un ************************************************massimo o minimo locale************************************************.

Proviamo con un esempio numerico:

$$
f(x)=2x-x^2
$$

Il grafico di questa funzione è una parabola con concavità rivolta verso il basso. Ci aspettiamo quindi di trovare un punto di massimo, corrispondente al vertice della parabola, che sappiamo avere coordinate 

$$
V=\Bigg(-\dfrac{b}{2a}, -\dfrac{\Delta}{4a} \Bigg)
$$

Ma rimaniamo all’analisi della funzione: la derivata è $f'(x)=2-2x$. È immediato studiarne il segno: $f'(x)>0$ se $x<1$. Quindi significa che la funzione cresce fino che l’ascissa raggiunge tale valore, decresce subito dopo. Notiamo che se studiamo l’equazione $f'(x)=0$ abbiamo per soluzione proprio $x=1$. Allora ne deduciamo che in corrispondenza di tale valore la funzione presenti un **massimo locale**, o ********************************massimo relativo********************************.

![vademecum 5 de carolis (6).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/vademecum_5_de_carolis_(6).png)

![geogebra-export (35).png](Funzioni%20di%20variabile%20reale%20705a294fa349458b8054fe9305283594/geogebra-export_(35).png)

[Limiti di funzioni a variabile reale](https://www.notion.so/Limiti-di-funzioni-a-variabile-reale-80d622e1b0194888b469b32de93656ae?pvs=21)

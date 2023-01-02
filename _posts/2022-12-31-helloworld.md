---
layout: post
title: LaTeX, GitHub e Markdown
subtitle: Come scrivere la matematica in classe nel 2023
tags: [math, latex, github, markdown, coding]
comments: false
---

Come docente di matematica, ho spesso bisogno di scrivere, controllare e condividere velocemente appunti contenenti equazioni, tabelle o schemi. 

In questo spazio voglio condividere i miei strumenti, i miei flussi di lavoro, per tenerne traccia io stesso, e per fornire tali strumenti ai miei studenti, per primi, ai miei colleghi o a chiunque trovi interessante produrre documenti in ambiente *classroom* attraverso GitHub, con il solo esclusivo uso di strumenti *Open Source*.

## $$\LaTeX$$
Confesso una forte avversione nei confronti degli editor di testo *tradizionali*. 

Spesso capita di lavorare su documenti word elaborati da colleghi che si smontano letteralmente ad ogni carattere aggiunto, tabelle che impazziscono e pagine vuote stampate in pdf. 

Se libero di scegliere, cerco di produrre i miei testi in $$\LaTeX$$. Certo, ha una curva di apprendimento ripida, ma è ben documentato da una comunità meravigliosa che condivide informazioni e fornisce volentieri supporto.

La guida  di [Overleaf](https://www.overleaf.com/learn/latex/Mathematical_expressions) è un ottimo riferimento per imparare facilmente i comandi che permettono di scrivere la matematica con $$\LaTeX$$.

Un primo vantaggio evidente: non è necessario creare la formula in un editor incontrollabile, trasformarla in immagine, inserirla in un editor di testo *WYSIWYG*, sperando che tutto rimanga in equilibrio. Basta conoscere un po' di sintassi e si può scrivere la formula in codice $$\LaTeX$$.

Anche Geogebra accetta il codice $$\LaTeX$$, è bene a conoscerlo e abituarsi ad usarlo.

Ad esempio, per ottenere il render dell'equazione $$(3x-5)^2=5$$ è sufficiente immettere il seguente codice:

{% highlight latex %}
$$(3x-5)^2=5$$
{% endhighlight %}

È possibile passare a scritture più complicate e più sofisticate, come un sistema di disequazioni del tipo: 

$$\begin{cases}
    (3x-5)^2 \geq 5 \\
    x<9 \\
    x-4>x^2-2 
\end{cases}$$

per il quale basta il codice:

{% highlight latex %}
$$\begin{cases}
    (3x-5)^2 \geq 5 \\
    x<9 \\
    x-4>x^2-2
\end{cases}$$
{% endhighlight %}

All'integrale

$$\int_{a}^{b} x^2 \,dx$$

corrisponde il codice:

{% highlight latex %}
$$\int_{a}^{b} x^2 \,dx$$
{% endhighlight %}

C'è una bella differenza fra una formula scritta con caratteri renderizzati in un browser ed una trasformata in pixel, spesso deformata o sottodimesionata rispetto alla risoluzione di visualizzazione o di stampa.
Provate a selezionare il testo delle equazioni scritte sopra, o provate ad ingrandire i caratteri dello schermo. La formula rimane là, ferma, imperturbabile.

Un secondo vantaggio (ce ne sono molti altri) nell'usare $$\LaTeX$$, e nel poterlo fare direttamente in un browser, consiste nella libertà di scrivere una formula in bella scrittura, seguendo una logica di priorità ed usando, di fatto, procedure di coding anche solo per prendere appunti o per preparare delle lezioni ed avere in tempo reale il materiale condiviso fra studenti e con il docente.

## Github e Markdown

La lezione può diventare, in tempo reale, una risorsa autentica per la classe che ha contribuito a crearla. Il prodotto istantaneo è una pagina web vera e propria. Un sito che si aggiorna come un diario di bordo collettivo e al tempo stesso personalissimo.

Posso preparare del codice $$\LaTeX$$ in [OverLeaf](https://www.overleaf.com) e condividerlo attraverso un copia e incolla. Il browser, presente su qualsiasi dispositivo mobile, si occupa del *render* del codice che genera la formula.

Il linguaggio che mette insieme web e matematica in questo caso è il *Markdown*, che permette di pre-formattare una pagina web privilegiando la cura dei contenuti rispetto all'impaginazione e ad aspetti grafici.

Il codice scritto viene poi renderizzato come *html* prima di finire sullo schermo.

Per scrivere in *Markdown* non é necessario conoscere le equazioni, ma per scrivere un'equazione in linea è necessario conoscere il linguaggio *Markdown*, oltre che la matematica.

È possibile imparare in breve tempo la sintassi necessaria a preparare una pagina web, ad esempio seguendo gli esempi presenti su [Markdown Guide](https://www.markdownguide.org/). 

[GitHub](https://www.github.com) è una piattaforma che permette di scrivere, revisionare, pubblicare in maniera condivisa qualsiasi contenuto possa essere scritto in forma di codice, dal semplice sito al software più specializzato e sofisticato che si possa immaginare. Inoltre Github offre un servizio di *file hosting* gratuito, al quale può corrispondere una pagina web o un *repository*.

Con GitHub, $$\LaTeX$$ e Markdown è possibile realizzare una filiera fra produzione e condivisione di contenuti corta ed efficiente. Il codice può facilmente essere riadattato e riutilizzato ogni volta che sia necessario.

Inoltre, attraverso gli strumenti di GitHub è possibile tenere traccia dei contributi di ogni utente. Questo permette di immaginare verifiche programmate e monitorate in maniera trasparente ed efficace, basate su risorse condivise, alle quali tutti hanno portato un contributo in maniera documentata.

È evidente che lo sviluppo di competenze matematiche è il pretesto e l'occasione per la costruzione ed il consolidamento di competenze legate alla logica e all'informatica, in senso lato.
Lo studente ha l'occasione di confrontarsi con la logica rigorosa di diversi linguaggi di programmazione.


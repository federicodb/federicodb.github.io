---
titolo: Titolo della nota
data: AAAA-MM-GG
descrizione: Una riga: di cosa parla la nota.
attivita: nome_file_app_senza_html, altro_nome_file
video:
copertina:
stato: bozza
---

<!--
PRIMA DI PUBBLICARE
- Foto e video: MAI visi di studenti. Solo di spalle, ritoccate (sfocate/coperte), oppure LIM, quaderni senza nome, mani, schermi.
- Niente nomi, voci, registri, compiti con il nome visibile.
- Schermate e foto mostrano una FASE INTERESSANTE dell'attività: il gioco in corso, un risultato, un grafico,
  un errore istruttivo. Mai la schermata d'avvio, l'inserimento del nome, i menu, le schermate vuote.
  (Le miniature del catalogo sono l'app appena aperta: il build avvisa se finiscono in copertina.)
- Togli "stato: bozza" quando la nota è pronta (le bozze non vanno nella sitemap e non compaiono nei motori di ricerca).

COME SI USA
- Copia questo file come content/journal/AAAA-MM-GG-titolo-breve.md (il modello, che inizia con "_", viene ignorato).
- attivita: i nomi dei file delle app in content/apps/, senza ".html" (anche più di uno, separati da virgole).
- Immagini: mettile in content/journal/media/ e scrivi ![Didascalia](media/foto.jpg).
  Il build le ricomprime e cancella i metadati (anche la posizione GPS).
  Una schermata di un'app già sul sito: ![Didascalia](/content/assets/thumbnails/nome.webp)
- copertina: l'immagine della scheda nell'elenco (facoltativa, es. media/foto.jpg). Se manca si usa la prima
  immagine della nota, poi la miniatura della prima attività. Il build la ritaglia 1200×630.
- Il build controlla e avvisa: immagini mancanti, senza didascalia, prese da altri siti, troppo piccole,
  foto HEIC dell'iPhone (salvale come JPG), video troppo pesanti, file in media/ non usati da nessuna nota.
- video: media/clip.mp4 (breve, al massimo circa 20 MB) oppure un link YouTube (mostrato solo come link).
- Formule come nel resto del sito: $m = \frac{\Delta y}{\Delta x}$
- Poi: .venv/bin/python3 -c "import build; build.GEMINI_API_KEY=''; build.main()"
  e anteprima con python3 -m http.server 8080 → http://localhost:8080/journal/
-->

Perché l'ho costruita, in che classe l'ho provata, cosa è successo, cosa cambio (200-300 parole).

# Tetracubi 3D: sorgenti

Pagina pubblicata: `content/apps/tetracubi_3d.html` (file unico, **generato**: non modificarlo a mano).

```bash
python3 tools/tetracubi_3d/compila.py   # index.html + game.js + lab.js → content/apps/tetracubi_3d.html
```

- `index.html`: struttura, stile, testi, metadati del catalogo, importmap di Three.js 0.169.0 con `integrity`.
- `game.js`: il gioco (sette tetramini fatti di cubi, pozzo 5×5×12 o 7×7×14, rotazioni di ±90° sui tre assi).
- `lab.js`: il laboratorio "Un cubo in pezzi": divide un solido in pezzi da 4 cubetti (la divisione è la soluzione,
  quindi il puzzle si rimonta sempre), dispone i pezzi sul piatto ed esporta il 3MF.

Scelte da non disfare:
- **Dimensione di stampa fissa**: i pezzi più alti (due cubi) escono alti 20 mm a scala 100%: passo del cubetto
  `UNITA` = (20 + 0,2) / 2 = 10,1 mm, gioco 0,2 mm fra pezzi (`CLEARANCE`). Chi li vuole più grandi li scala in
  Bambu Studio. Niente ingrandimento automatico fino a riempire il piatto.
- **Stampabilità**: ogni pezzo è un blocco pieno; i cubetti sono gusci smussati (`chamferBox` in `game.js`) che si
  compenetrano di `SOVRAPP` = 0,4 mm, con smusso `SMUSSO` = 0,8 mm a 45°: fra cubetti resta una scanalatura di 0,4 mm.
  Nessuno sbalzo oltre 45° (verificato da `tests/tetracubi.spec.js`). L'anteprima usa la stessa geometria.
- Passaggio laboratorio → stampante: (x, y, z) → (x, −z, y), una rotazione (mai uno specchio: Vite+ e Vite− si scambierebbero).
- **Codice del set** (`444-7KQ2M`: forma + 5 caratteri del seme): stesso codice, stesso set e stesse istruzioni;
  nel nome del 3MF e del PDF; `?set=CODICE` apre il laboratorio.
- **Istruzioni PDF**: ordine di montaggio calcolato smontando il solido (ogni pezzo esce in linea retta), pagine
  disegnate su canvas e impacchettate in un PDF minimo con JPEG (nessuna libreria). I pezzi sono numerati in quell'ordine.
- Gioco: i cubetti di uno stesso pezzo restano uniti anche dopo l'atterraggio (`pid`); discesa automatica con
  cursore Velocità (×0,5…×2 sull'intervallo del livello) o guidata (scende solo con Shift, Spazio o «Scendi»).
- Nome e colori propri (palette del sito), non quelli di giochi commerciali.
- Chiavi salvate: `orfini_tetracubi_record` (e `_record_guidata`), `orfini_tetracubi_pozzo`, `orfini_tetracubi_muto`,
  `orfini_tetracubi_modo`, `orfini_tetracubi_velocita`.
- Ganci di prova: `window.__lab` (`info()`, `plan()`, `printMeshes()`, `open(codice)`, `pdfBase64()`, `exportBase64()`)
  e `window.__t3` (`setModo`, `setVelocita`, `gravMs`, `stepDown`). Test: `npx playwright test tests/tetracubi.spec.js`.

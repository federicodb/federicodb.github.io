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
- **Dimensione di stampa fissa**: i pezzi più alti (due cubi) escono alti 20 mm, cioè la geometria con cubi da 20 mm
  e gioco 0,2 mm scalata del 51,54% (`SCALA` in `lab.js`). Chi li vuole più grandi li scala in Bambu Studio.
  Niente ingrandimento automatico fino a riempire il piatto.
- Nome e colori propri (palette del sito), non quelli di giochi commerciali.
- Chiavi salvate: `orfini_tetracubi_record`, `orfini_tetracubi_pozzo`, `orfini_tetracubi_muto`.
- Gancio di prova: `window.__lab.info()` (pezzi, copertura, `maxPrintH`, `scala`) ed `exportBase64()`.

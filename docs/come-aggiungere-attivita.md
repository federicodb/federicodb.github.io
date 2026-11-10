# Come aggiungere un'attività

Guida di una pagina. Titolo, descrizione e indirizzo si scrivono una volta sola, dove stanno già oggi. In più serve **una riga con le parole chiave**, cioè gli `id` di `data/vocabolario.json` (per esempio `retta`, `numeri-irrazionali`, `mcm-mcd`).

`data/attivita.json` non si tocca: lo riscrive il build.

## 1. Scrivi le parole chiave accanto al contenuto

| Che cosa aggiungi | Dove scrivi le parole |
|---|---|
| **App** in `content/apps/` | nel `<head>` dell'app: `<meta name="parole" content="retta, parabola">` |
| **Video, immagine, infografica, link** | nel file `.json` che li accompagna: `"parole": ["frattali"]` |
| **Lezione della Quest** | tabella `PAROLE` in `allenamento/activities/catalogo.js` |
| **Nota del Journal** | niente: prende le parole della prima attività collegata. Per sceglierle, aggiungi `parole: retta, parabola` nell'intestazione |
| **Verifica** | una riga in `data/parole_verifiche.json` |

Per un'app nuova restano validi i passi di sempre: `<title>`, `description`, `keywords` con i codici `MAT_…`, `<meta name="allenamento">`, miniatura.

## 2. Rigenera e controlla

```
npm run build
```

Fa tre cose in ordine: `build.py` (catalogo, Journal, schede, Mappa, sitemap, `data/attivita.json`), la validazione, poi menu ed elenco della home. Deve finire con **"Build completato senza avvisi"**.

Per guardare il risultato: `python3 -m http.server 8080` e apri `http://localhost:8080/`.

## 3. Se la validazione si ferma

| Messaggio | Cosa fare |
|---|---|
| «frazioni» è un alias, la forma canonica è «frazione» | scrivi `frazione` |
| «…» non è nel vocabolario (forse «…»?) | usa la parola suggerita, oppure aggiungila al vocabolario (sotto) |
| serve almeno una parola chiave | hai dimenticato la riga del punto 1 |
| una sola attività… non diventa una stella | la parola nuova ha una sola voce: usa il tema più vicino finché non ne arriva una seconda |
| l'indirizzo «…» non esiste nel sito | il file ha un altro nome o non è stato salvato |

## 4. Aggiungere una parola al vocabolario

In `data/vocabolario.json`, una voce:

```json
{ "id": "sistema", "etichetta": "sistema", "nomeCompleto": "sistema di equazioni",
  "padre": "equazione", "alias": ["sistemi", "sistema lineare"],
  "descrizione": "Più equazioni che devono valere insieme." }
```

- `id`: minuscole e trattini. È quello che scrivi nelle attività.
- `etichetta`: una o due parole, quelle che si leggono sulla stella. Minuscole, tranne nomi propri e sigle.
- `padre`: facoltativo, uno solo.
- `alias`: i modi in cui la gente la cerca. La ricerca li accetta e mostra la forma canonica.
- Servono almeno due attività che la usano.

## 5. Pubblicare

Commit e push su `master`. Il workflow `Valida e pubblica` ripete validazione e generazione: se falliscono, online resta la versione di prima.

Se in un commit cambi **solo** i metadati di un'app (per esempio aggiungi le parole), scrivi `[metadati]` nel messaggio: così la data dell'attività nel catalogo non cambia.

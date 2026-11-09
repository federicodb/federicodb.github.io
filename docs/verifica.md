# Verifica dei criteri di accettazione

Aggiornato a ogni fase. Legenda: ✅ verificato · ⏳ non ancora applicabile · ❌ non passa.

## Fase 0 — Ricognizione (2026-11-09)

La Fase 0 non cambia nessuna pagina: aggiunge `data/attivita.json`, `data/vocabolario.json`, `tools/valida.mjs`, lo script `npm run valida` e i documenti.

| Criterio | Esito | Come è stato verificato |
|---|---|---|
| Tutti gli URL presenti su `master` rispondono ancora | ✅ | `git diff --stat master` mostra solo file nuovi e una riga in `package.json`; nessun file esistente spostato, rinominato o cancellato |
| Da telefono si arriva a un'attività in tre tocchi | ⏳ | Fase 1 |
| Home ed elenco funzionano con JavaScript spento | ⏳ | Fase 1 (oggi la griglia della home è vuota senza JavaScript) |
| Tutto raggiungibile da tastiera, con fuoco visibile | ⏳ | Fasi 1 e 2 |
| Contrasto AA nei due temi, etichette leggibili a 1920 px | ⏳ | Fasi 1 e 2 |
| Lighthouse mobile: prestazioni ≥ 90, accessibilità ≥ 95 | ⏳ | Fase 1. Chrome DevTools MCP non è disponibile: servirà `lighthouse` da riga di comando o una misura manuale |
| Mappa fluida a 380 px, nessuno scorrimento orizzontale | ⏳ | Fase 2 |
| `npm run build` passa senza avvisi; il workflow blocca se la validazione fallisce | ⏳ | Fase 1. Per ora `npm run valida` passa: 139 attività, 40 parole, 0 errori |
| Aggiungere un'attività richiede una sola voce in `data/attivita.json` | ⏳ | Dipende dalla scelta sulla fonte dei dati (`ricognizione.md`, punto 8.3) |

### Controlli fatti in questa fase

- `node tools/valida.mjs`: esito positivo sui dati reali.
- Stesso comando su una copia dei dati con 8 difetti inseriti di proposito (alias al posto della parola, parola inesistente, nome completo al posto dell'id, file inesistente, lezione della Quest inesistente, parola quasi-duplicata, parola senza attività, parola con una sola attività): 13 errori segnalati, uscita con codice 1.
- Tutti i 137 indirizzi locali di `data/attivita.json` esistono nel repository; le 58 lezioni sono nel catalogo della Quest. I 2 indirizzi esterni non sono stati aperti.

### Come provarlo in locale

```
npm run valida                      # deve stampare "✓ Dati validi: 139 attività, 40 parole"
node tools/valida.mjs --riepilogo   # quante attività ha ogni parola, per sezione
```

Per vedere un errore: in `data/attivita.json` cambia una parola in `frazioni` e rilancia.

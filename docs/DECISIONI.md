# Riorganizzazione del sito — registro delle decisioni

Ogni voce: data, decisione, motivo.

## 2026-10-30 — Fase 0

- **Il ramo pubblicato è `master`, non `main`.** Nel piano "main" va letto come `master`. Motivo: è il ramo predefinito del repository e l'unico da cui GitHub Pages ha mai pubblicato.
- **Pubblicazione: modalità classica "Deploy from a branch".** L'unico workflow è `pages-build-deployment` (generato da GitHub, nessun file in `.github/workflows`). Le ultime 100 esecuzioni sono tutte su `master`; il ramo `feat/quest-rotazione-settimanale`, pushato il 2026-10-22, non ne ha avviata nessuna. Un push su `riorganizzazione` quindi non pubblica nulla.
- **Backup fuori dal repository** in `../backup_riorganizzazione_2026-10-30/`: archivio `tar.gz` completo (inclusi file ignorati, `.env`, `.venv`, `node_modules`) e `git clone --mirror` del repository locale (tutti i rami locali, anche quelli mai pushati). Motivo: il mirror del remoto non conterrebbe i rami solo locali.
- **Tag `pre-riorganizzazione-2026-10-30`** (annotato) su `b3a7835`, ultimo commit di `master` prima della riorganizzazione.
- **Lavoro solo sul ramo `riorganizzazione`**, creato da `master` a `b3a7835`.
- **I file in `docs/` vanno aggiunti con `git add -f`**: `.gitignore` esclude `*.md`.

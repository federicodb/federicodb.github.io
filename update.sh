#!/bin/bash
# Aggiornamento del sito: sidecar → miniature → (standardizzazione) → build.
#
# Uso:
#   ./update.sh                 percorso sicuro: sidecar senza rinomine, miniature, build offline
#   ./update.sh --standardizza  riscrive anche tutte le app con standardize_apps.py (controllare il diff!)
#   ./update.sh --rinomina      lascia rinominare ad auto_sidecar.py i file con nomi non conformi (CAMBIA GLI URL)
#   ./update.sh --ai            build con Gemini (invia i testi a Google; serve GEMINI_API_KEY nel .env)
#
# Si ferma al primo errore: un passo fallito non deve produrre un sito pubblicato a metà.
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

STANDARDIZZA=0; RINOMINA=0; AI=0
for arg in "$@"; do
    case "$arg" in
        --standardizza) STANDARDIZZA=1 ;;
        --rinomina) RINOMINA=1 ;;
        --ai) AI=1 ;;
        -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
        *) echo -e "${RED}❌ Opzione sconosciuta: $arg${NC}"; exit 2 ;;
    esac
done

trap 'echo -e "\n${RED}❌ Aggiornamento interrotto: un passo è fallito (vedi sopra). Nessun file da pubblicare finché non è risolto.${NC}"' ERR

if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Errore: non sei nella root del repository git.${NC}"
    exit 1
fi

if [ -d ".venv" ]; then
    PYTHON_CMD=".venv/bin/python3"
    echo -e "${GREEN}✅ Utilizzo ambiente virtuale Python (.venv)${NC}"
else
    PYTHON_CMD="python3"
    echo -e "${YELLOW}⚠️  Ambiente virtuale non trovato, uso python3 di sistema.${NC}"
fi

echo -e "${YELLOW}🚀 ORFINI UPDATE SYSTEM v3${NC}"
echo "========================================"

echo -e "\n${YELLOW}1. Ingestion dati (auto-sidecar)${NC}"
if [ "$RINOMINA" = 1 ]; then
    echo -e "${RED}⚠️  --rinomina: i file con nomi non conformi verranno rinominati e cambieranno URL.${NC}"
    $PYTHON_CMD auto_sidecar.py --rinomina
else
    $PYTHON_CMD auto_sidecar.py
fi

echo -e "\n${YELLOW}2. Miniature${NC}"
$PYTHON_CMD thumbnails.py

echo -e "\n${YELLOW}3. Standardizzazione delle app${NC}"
if [ "$STANDARDIZZA" = 1 ]; then
    $PYTHON_CMD standardize_apps.py
else
    echo "Saltata (riscrive tutte le app: usare --standardizza e controllare il diff)."
fi

echo -e "\n${YELLOW}4. Build del sito${NC}"
if [ "$AI" = 1 ]; then
    $PYTHON_CMD build.py --ai
else
    $PYTHON_CMD build.py
fi

echo -e "\n${GREEN}✨ Aggiornamento completato.${NC}"
echo "Controlla le modifiche prima di pubblicare:"
echo "  git status"
echo "  git diff --stat"
echo "Poi aggiungi solo i file voluti (mai .bak, .broken*, .gcode):"
echo "  git add <file>   &&   git commit -m 'feat(...): ...'"

#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurazione Interprete Python
if [ -d ".venv" ]; then
    PYTHON_CMD=".venv/bin/python3"
    echo -e "${GREEN}✅ Utilizzo ambiente virtuale Python (.venv)${NC}"
else
    PYTHON_CMD="python3"
    echo -e "${YELLOW}⚠️  Ambiente virtuale non trovato, uso python3 di sistema.${NC}"
fi

echo -e "${YELLOW}🚀 ORFINI UPDATE SYSTEM v2.1${NC}"
echo "========================================"

# 0. Check Environment
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Errore: Non sei nella root del repository git.${NC}"
    exit 1
fi

# 1. Ingestion & Normalization
echo -e "\n${YELLOW}1. Ingestion Dati (Auto-Sidecar)${NC}"
if [ -f "auto_sidecar.py" ]; then
    $PYTHON_CMD auto_sidecar.py
else
    echo -e "${RED}⚠️  Manca auto_sidecar.py! Salto.${NC}"
fi

# 2. Thumbnails
echo -e "\n${YELLOW}2. Gestione Media (Thumbnails)${NC}"
if [ -f "thumbnails.py" ]; then
    $PYTHON_CMD thumbnails.py
fi

# 3. Standardize Apps
echo -e "\n${YELLOW}3. Standardizzazione Apps${NC}"
if [ -f "standardize_apps.py" ]; then
    $PYTHON_CMD standardize_apps.py
fi

# 4. Build System
echo -e "\n${YELLOW}4. Costruzione Sito (Build)${NC}"
if [ -f "build.py" ]; then
    $PYTHON_CMD build.py
else
    echo -e "${RED}❌ CRITICO: build.py non trovato!${NC}"
    exit 1
fi

# 5. Report e Istruzioni
echo -e "\n${GREEN}✨ AGGIORNAMENTO COMPLETATO CON SUCCESSO! ✨${NC}"
echo "I file sono stati rinominati (se necessario), i JSON generati e il database aggiornato."
echo "Ora puoi procedere con:"
echo "  git add ."
echo "  git commit -m 'Aggiunti nuovi contenuti'"
echo "  git push"

#!/bin/bash

# Colori per output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== 🚀 AGGIORNAMENTO LABORATORIO MATEMATICO ===${NC}"

# 1. Standardizza le WebApp (CSS, Tailwind, ecc)
echo -e "\n${GREEN}[1/3] Standardizzazione WebApp...${NC}"
python3 standardize_apps.py

# 2. Genera i JSON per i nuovi file media (Video, Pdf, ecc)
echo -e "\n${GREEN}[2/3] Generazione Metadati Media...${NC}"
python3 auto_sidecar.py

# 3. Costruisce il database finale e la sitemap
echo -e "\n${GREEN}[3/3] Indicizzazione e Build...${NC}"
python3 build.py

echo -e "\n${CYAN}=== ✅ AGGIORNAMENTO COMPLETATO ===${NC}"
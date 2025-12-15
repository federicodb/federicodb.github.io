#!/bin/bash

echo "🚀 Inizio procedura di aggiornamento..."

# 1. Generazione Thumbnails (opzionale, non blocca se fallisce)
if [ -f "thumbnails.py" ]; then
    echo "📸 Controllo e generazione Thumbnails mancanti..."
    python3 thumbnails.py
else
    echo "⚠️  Script thumbnails.py non trovato."
fi

# 2. Standardizzazione App (CSS/Temi)
if [ -f "standardize_apps.py" ]; then
    echo "🔧 Standardizzazione codice Apps..."
    python3 standardize_apps.py
fi

# 3. Build Database e Sitemap
if [ -f "build.py" ]; then
    echo "🏗️  Rigenerazione Database e Sitemap..."
    python3 build.py
fi

echo "✨ Aggiornamento completato!"

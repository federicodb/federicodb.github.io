#!/usr/bin/env python3
"""Ricompila content/apps/tetracubi_3d.html (file unico) dai sorgenti in questa cartella.

    python3 tools/tetracubi_3d/compila.py
"""
from pathlib import Path

root = Path(__file__).parent
out = root.parent.parent / 'content' / 'apps' / 'tetracubi_3d.html'
tpl = (root / 'index.html').read_text()
for name in ('game.js', 'lab.js'):
    marker = f'/*INLINE:{name}*/'
    assert marker in tpl, f'marker {marker} mancante'
    tpl = tpl.replace(marker, (root / name).read_text())
out.write_text(tpl)
print('build OK:', out, len(tpl), 'byte')

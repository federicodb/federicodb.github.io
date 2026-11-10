"""
Dati della home (elenco e costellazione): data/attivita.json.
Lo chiama build.py alla fine e mette insieme le quattro sezioni del sito:

- attivita: le voci del catalogo (database.js) senza la normativa;
- allenati: le lezioni della Quest (allenamento/catalogo.json);
- journal:  le note pubblicabili (content/journal/*.md);
- archivio: le verifiche (database_verifiche.js).

Titolo, descrizione e indirizzo arrivano da dove sono già scritti. A mano si scrivono solo le PAROLE CHIAVE
(id di data/vocabolario.json), una volta sola e accanto al contenuto:

- app HTML:                 <meta name="parole" content="retta, parabola">
- video, immagini, link:    "parole": ["retta"] nel file .json che li accompagna
- lezioni della Quest:      tabella PAROLE in allenamento/activities/catalogo.js
- note del Journal:         riga "parole:" nell'intestazione; se manca valgono quelle della prima attività collegata
- verifiche:                data/parole_verifiche.json (una riga per verifica)

Il file prodotto non si modifica a mano. Lo controlla tools/valida.mjs: una voce senza parole ferma la pubblicazione.
"""

import glob
import json
import os
import re
import unicodedata

OUT = "data/attivita.json"
PAROLE_VERIFICHE = "data/parole_verifiche.json"
TIPO_GIOCO = {"arcade": "arcade", "sim": "simulazione", "memory": "memory"}
TIPO_MEDIA = {"image": "immagine", "infographic": "infografica", "video": "video"}


def _slug(testo):
    testo = unicodedata.normalize("NFD", testo)
    testo = "".join(c for c in testo if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", testo).strip("-")


def _lista(testo):
    return [p.strip() for p in (testo or "").split(",") if p.strip()]


def _json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _parole_html(path):
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            testa = f.read(20000)
    except OSError:
        return []
    m = re.search(r'<meta\s+name=["\']parole["\']\s+content=(["\'])(.*?)\1', testa, re.I)
    return _lista(m.group(2)) if m else []


def _voce(id_, titolo, descrizione, url, sezione, tipo, parole, miniatura="", data=""):
    v = {"id": id_, "titolo": titolo, "descrizione": descrizione, "url": url, "sezione": sezione, "tipo": tipo,
         "parole": list(parole)}
    if miniatura and os.path.exists(miniatura):
        v["miniatura"] = miniatura
    if data:
        v["data"] = data
    return v


def build_dati(db_main, db_verifiche):
    voci, senza = [], []

    # 1. Catalogo. I link esterni si riconoscono dal loro file in content/links
    link = {}
    for path in sorted(glob.glob("content/links/*.json")):
        d = _json(path)
        if d.get("url"):
            link[d["url"]] = (os.path.splitext(os.path.basename(path))[0], d.get("parole", []))
    parole_per_file = {}
    for it in db_main:
        if it.get("type") == "normativa":
            continue
        url = it.get("url", "")
        if url in link:
            nome, parole = link[url]
        else:
            nome = os.path.splitext(os.path.basename(url))[0]
            parole = _parole_html(url) if url.endswith(".html") else _json(os.path.splitext(url)[0] + ".json").get("parole", [])
        parole_per_file[nome] = parole
        tipo = TIPO_MEDIA.get(it.get("type")) or TIPO_GIOCO.get(it.get("game_type"), "app")
        voci.append(_voce(_slug(nome), it.get("title", ""), it.get("excerpt", ""), url, "attivita", tipo, parole,
                          it.get("thumbnail", ""), it.get("date", "")))

    # 2. Quest
    for lez in _json("allenamento/catalogo.json") or []:
        voci.append(_voce(f"quest-{lez['id']}", lez.get("titolo", ""), lez.get("descrizione", ""),
                          f"allenamento/#/lezione/{lez['id']}/1", "allenati", "lezione", lez.get("parole", [])))

    # 3. Journal: le bozze e gli esempi non si pubblicano, quindi non entrano
    import journal_build
    for path in sorted(glob.glob("content/journal/*.md")):
        if not re.match(r"\d{4}-", os.path.basename(path)):
            continue
        n = journal_build._leggi_nota(path)
        if n["stato"] in ("bozza", "esempio"):
            continue
        parole = _lista(n.get("parole")) or next((parole_per_file[a] for a in n["attivita"] if parole_per_file.get(a)), [])
        voci.append(_voce(f"nota-{n['slug']}", n["titolo"], n["descrizione"], f"journal/{n['slug']}/", "journal", "nota",
                          parole, f"journal/{n['slug']}/copertina.webp", n.get("data", "")))

    # 4. Archivio: titolo senza la classe, come nel Journal
    parole_verifiche = _json(PAROLE_VERIFICHE)
    for v in db_verifiche:
        voci.append(_voce(f"verifica-{_slug(v.get('group_ref', ''))}", journal_build._nome_verifica(v), v.get("excerpt", ""),
                          v.get("url", ""), "archivio", "verifica", parole_verifiche.get(v.get("group_ref"), []),
                          v.get("thumbnail", ""), v.get("date", "")))

    senza = [v["id"] for v in voci if not v["parole"]]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(voci, f, ensure_ascii=False, indent=2)
        f.write("\n")
    per = {}
    for v in voci:
        per[v["sezione"]] = per.get(v["sezione"], 0) + 1
    print(f"  ✨ Dati della home: {len(voci)} voci (" + ", ".join(f"{k} {n}" for k, n in per.items()) + ")")
    if senza:
        print("  ⚠️ Senza parole chiave (vedi dati_build.py per dove scriverle): " + ", ".join(senza))
    return voci

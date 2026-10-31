"""
journal_build.py - Journal di Orfini Math Lab (diario di bordo delle attività).

Chiamato da build.py. Legge le note Markdown in content/journal/ e scrive pagine statiche in journal/:
  journal/index.html          elenco cronologico (filtrabile per attività con ?attivita=<nome file>)
  journal/<nota>/index.html   una pagina per nota, con le attività collegate prese da database.js

Una nota: content/journal/AAAA-MM-GG-titolo.md, con intestazione tra due righe '---':
  titolo, data, descrizione (obbligatori); attivita (nomi dei file delle app, separati da virgole),
  video (media/file.mp4 o link YouTube), stato (esempio | bozza) facoltativi.
I file che iniziano con '_' (il modello) sono ignorati. Le immagini in content/journal/media/ vengono
ricompresse in WebP senza metadati (niente posizione GPS) e copiate in journal/media/.
"""

import html
import os
import re
import shutil
import urllib.parse
from datetime import datetime

import markdown
from PIL import Image, ImageOps

SRC_DIR = os.path.join("content", "journal")
OUT_DIR = "journal"
MARKER = ".generato-da-build"  # journal/ viene ricreata solo se contiene questo file
IMG_MAX_PX = 1600
IMG_WARN_KB = 400
AUTHOR = "Prof. Federico De Benedictis"
MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio",
        "agosto", "settembre", "ottobre", "novembre", "dicembre"]
STATI_NON_PUBBLICI = {"esempio", "bozza"}


def _data_it(iso):
    try:
        d = datetime.strptime(iso, "%Y-%m-%d")
        return f"{d.day} {MESI[d.month - 1]} {d.year}"
    except ValueError:
        return iso


def _stem(url):
    """ 'content/apps/Math Pool.html' -> 'math pool' (chiave per collegare note e attività) """
    base = os.path.basename(urllib.parse.unquote(url.split("?")[0]))
    return re.sub(r"\.html?$", "", base, flags=re.I).strip().lower()


def _href(root, url):
    # gli spazi dei nomi di file vanno codificati, '#' e '?' no (i link alla Quest sono allenamento/#/lezione/...)
    return url if url.startswith(("http://", "https://")) else root + urllib.parse.quote(url, safe="/#?=&")


def _leggi_nota(path):
    with open(path, encoding="utf-8") as f:
        testo = f.read()
    meta, corpo = {}, testo
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", testo, re.S)
    if m:
        corpo = m.group(2)
        for riga in m.group(1).splitlines():
            if ":" in riga and not riga.lstrip().startswith("#"):
                k, v = riga.split(":", 1)
                meta[k.strip().lower()] = re.sub(r"\s+#.*$", "", v).strip()
    corpo = re.sub(r"<!--.*?-->", "", corpo, flags=re.S)  # le istruzioni del modello non vanno pubblicate
    nome = os.path.splitext(os.path.basename(path))[0]
    data_nome = re.match(r"^(\d{4}-\d{2}-\d{2})", nome)
    meta.setdefault("data", data_nome.group(1) if data_nome else "")
    meta.setdefault("titolo", re.sub(r"^\d{4}-\d{2}-\d{2}-?", "", nome).replace("-", " ").capitalize())
    if not meta.get("descrizione"):
        prima = re.split(r"(?<=[.!?])\s", re.sub(r"[#*_>\[\]!()]", "", corpo).strip(), maxsplit=1)
        meta["descrizione"] = prima[0][:200] if prima else ""
    meta["attivita"] = [a.strip() for a in meta.get("attivita", "").split(",") if a.strip()]
    meta["slug"] = nome
    meta["corpo"] = corpo
    meta["stato"] = meta.get("stato", "").lower()
    return meta


def _markdown_con_formule(corpo):
    """ Protegge $...$ e $$...$$ dal Markdown; KaTeX li rende nel browser come nel resto del sito """
    formule = []

    def tieni(m):
        formule.append(m.group(0))
        return f"\x00{len(formule) - 1}\x00"

    protetto = re.sub(r"\$\$.+?\$\$|(?<!\\)\$[^$\n]+?\$", tieni, corpo, flags=re.S)
    out = markdown.markdown(protetto, extensions=["extra", "sane_lists"], output_format="html")
    return re.sub(r"\x00(\d+)\x00", lambda m: html.escape(formule[int(m.group(1))], quote=False), out)


def _prepara_media(rel, avvisi, nota):
    """ media/foto.jpg -> journal/media/foto.webp (ridimensionata, senza EXIF). Restituisce il nuovo percorso. """
    src = os.path.join(SRC_DIR, rel)
    if not os.path.exists(src):
        avvisi.append(f"{nota}: file non trovato '{rel}'")
        return rel
    base, ext = os.path.splitext(os.path.basename(rel))
    os.makedirs(os.path.join(OUT_DIR, "media"), exist_ok=True)
    if ext.lower() in (".jpg", ".jpeg", ".png", ".webp"):
        dest = os.path.join("media", base + ".webp")
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)  # rispetta la rotazione del telefono prima di buttare l'EXIF
            im.thumbnail((IMG_MAX_PX, IMG_MAX_PX))
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            im.save(os.path.join(OUT_DIR, dest), "WEBP", quality=80, method=6)  # senza exif=: metadati eliminati
        kb = os.path.getsize(os.path.join(OUT_DIR, dest)) // 1024
        if kb > IMG_WARN_KB:
            avvisi.append(f"{nota}: '{rel}' pesa ancora {kb} KB dopo la compressione")
    else:
        dest = os.path.join("media", os.path.basename(rel))
        shutil.copy2(src, os.path.join(OUT_DIR, dest))
    return dest


def _sistema_immagini(corpo_html, root, avvisi, nota):
    def img(m):
        tag, src = m.group(0), html.unescape(m.group(1))
        if src.startswith("media/"):
            nuovo = "../" + _prepara_media(src, avvisi, nota)
        elif src.startswith("/"):
            nuovo = root + src.lstrip("/")  # percorso dalla radice del sito, es. /content/assets/thumbnails/x.webp
        else:
            nuovo = src
        return tag.replace(m.group(1), html.escape(nuovo), 1).replace("<img ", '<img loading="lazy" ', 1)

    corpo_html = re.sub(r'<img[^>]*\ssrc="([^"]+)"[^>]*>', img, corpo_html)
    # un'immagine da sola in un paragrafo diventa una figura con didascalia (il testo alternativo)
    return re.sub(r'<p>(<img[^>]*alt="([^"]*)"[^>]*>)</p>',
                  lambda m: f'<figure>{m.group(1)}<figcaption>{m.group(2)}</figcaption></figure>' if m.group(2)
                  else f'<figure>{m.group(1)}</figure>', corpo_html)


def _video(v, root, avvisi, nota):
    if not v:
        return ""
    if re.match(r"https?://(www\.)?(youtube\.com|youtu\.be)/", v):
        # solo link: nessun contenuto di terzi caricato nella pagina, quindi niente consenso cookie da chiedere
        return (f'<p class="jr-video-link"><a href="{html.escape(v)}" target="_blank" rel="noopener">'
                f'▶ Guarda il video su YouTube</a> <span>(si apre su youtube.com)</span></p>')
    if v.startswith("media/"):
        dest = _prepara_media(v, avvisi, nota)
        return f'<video class="jr-video" controls preload="metadata" src="../{html.escape(dest)}"></video>'
    avvisi.append(f"{nota}: video non riconosciuto '{v}'")
    return ""


def _scheda_attivita(item, root):
    titolo = html.escape(item.get("title", ""))
    desc = html.escape(item.get("excerpt", ""))
    thumb = item.get("thumbnail")
    img = f'<img src="{_href(root, thumb)}" alt="" loading="lazy">' if thumb else ""
    extra = []
    spieg = re.sub(r"\.html$", "_spiegazione.html", item["url"])
    if item["url"].endswith(".html") and os.path.exists(spieg):
        extra.append(f'<a href="{_href(root, spieg)}">Spiegami come funziona</a>')
    for a in item.get("allenamento", [])[:3]:
        extra.append(f'<a href="{_href(root, a["url"])}">Allenati: {html.escape(a["titolo"])}</a>')
    extra_html = f'<p class="jr-act-more">{" · ".join(extra)}</p>' if extra else ""
    return (f'<li class="jr-act">{img}<div><h3><a href="{_href(root, item["url"])}">{titolo}</a></h3>'
            f'<p>{desc}</p>{extra_html}</div></li>')


def _nav(root):
    return f"""    <nav id="main-nav">
        <div class="container nav-container">
            <div class="nav-row-1">
                <a href="{root}index.html" class="brand">
                    <span class="brand-title">ORFINI</span>
                    <span class="brand-sub">JOURNAL</span>
                </a>
                <div class="nav-links">
                    <a href="{root}index.html" class="nav-link">Attività</a>
                    <a href="{root}allenamento/" class="nav-link nav-link-cta">Allenati</a>
                    <a href="{root}journal/" class="nav-link active" aria-current="page">Journal</a>
                    <a href="{root}calcolo-mentale.html" class="nav-link">Calcolo veloce</a>
                    <a href="{root}verifiche.html" class="nav-link">Archivio</a>
                    <a href="{root}galaxy.html" class="nav-link">Mappa</a>
                    <a href="{root}competenze.html" class="nav-link">Competenze</a>
                    <a href="{root}scuola.html" class="nav-link">La Scuola</a>
                    <a href="{root}index.html#about" class="nav-link">Chi Sono</a>
                    <button id="orfini-theme-toggle" class="orfini-theme-toggle" aria-label="Cambia tema chiaro/scuro" title="Cambia tema chiaro/scuro">
                        <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    </nav>"""


def _pagina(root, titolo, descrizione, canonical, immagine, corpo, extra_head=""):
    return f"""<!DOCTYPE html>
<html lang="it">
<!-- ⚠️ GENERATO AUTOMATICAMENTE DA build.py (journal_build.py): modificare la nota in content/journal/ -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{html.escape(titolo)} | Journal · Orfini Math Lab</title>
    <meta name="description" content="{html.escape(descrizione)}">
    <meta name="author" content="{AUTHOR}">
    <link rel="canonical" href="{canonical}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical}">
    <meta property="og:title" content="{html.escape(titolo)}">
    <meta property="og:description" content="{html.escape(descrizione)}">
    <meta property="og:image" content="{immagine}">
{extra_head}    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&family=Space+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
        onload="renderMathInElement(document.body, {{delimiters: [{{left: '$$', right: '$$', display: true}}, {{left: '$', right: '$', display: false}}]}});"></script>
    <link rel="stylesheet" href="{root}index.css">
    <link rel="stylesheet" href="{root}cookie-consent.css">
    <script>
        if (localStorage.getItem('orfini_theme') === 'light') {{
            document.documentElement.classList.add('theme-light');
            document.documentElement.setAttribute('data-theme', 'light');
        }}
    </script>
    <link rel="stylesheet" href="{root}content/assets/style/theme-light.css">
    <link rel="stylesheet" href="{root}journal.css">
    <script src="{root}content/assets/js/theme-toggle.js" defer></script>
</head>

<body>

{_nav(root)}

    <main class="container jr" id="contenuto">
{corpo}
    </main>

    <footer class="site-footer">
        <div class="container">
            <div class="footer-top">
                <div class="brand">
                    <span class="brand-title">ORFINI MATH LAB</span>
                    <p>Laboratorio matematico digitale<br>Istituto Professionale "E. Orfini" · Foligno</p>
                </div>
                <div class="footer-social">
                    <a href="https://instagram.com/meltingmath" target="_blank" rel="noopener" class="social-circle" aria-label="Instagram @meltingmath">
                        <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; {datetime.now().year} Laboratorio Matematico Orfini Foligno · {AUTHOR}. Progetto Open Source.</p>
            </div>
        </div>
    </footer>

    <script src="{root}cookie-consent.js"></script>
</body>

</html>
"""


def build_journal(items, base_url):
    """
    Genera journal/ dalle note. Restituisce:
      note_per_url: {url attività: [{titolo, url, data}]}  (per il campo 'journal' di database.js)
      sitemap:      [(url, data)] delle note pubblicabili (niente esempi né bozze)
      ultime:       le note pubblicabili più recenti, per la home
    """
    if not os.path.isdir(SRC_DIR):
        return {}, [], []
    if os.path.exists(OUT_DIR):
        if not os.path.exists(os.path.join(OUT_DIR, MARKER)):
            print(f"  ⚠️ Journal: '{OUT_DIR}/' esiste ma non è stata generata dal build, non la tocco.")
            return {}, [], []
        shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR)
    open(os.path.join(OUT_DIR, MARKER), "w").close()

    per_stem = {_stem(it["url"]): it for it in items if it.get("url")}
    note = [_leggi_nota(os.path.join(SRC_DIR, f)) for f in sorted(os.listdir(SRC_DIR))
            if f.endswith(".md") and not f.startswith("_")]
    note.sort(key=lambda n: (n["data"], n["slug"]), reverse=True)

    avvisi, note_per_url, sitemap = [], {}, []
    cover_default = base_url + "content/assets/social_share_cover.webp"

    for n in note:
        root = "../../"
        url = f"{OUT_DIR}/{n['slug']}/"
        canonical = base_url + url
        pubblica = n["stato"] not in STATI_NON_PUBBLICI
        for campo in ("titolo", "data", "descrizione"):
            if not n.get(campo):
                avvisi.append(f"{n['slug']}: manca '{campo}'")

        collegate = []
        for a in n["attivita"]:
            it = per_stem.get(_stem(a))
            if it is None:
                avvisi.append(f"{n['slug']}: attività '{a}' non trovata nel catalogo")
                continue
            collegate.append(it)
            note_per_url.setdefault(it["url"], []).append({"titolo": n["titolo"], "url": url, "data": n["data"]})
        n["collegate"] = collegate

        corpo = _sistema_immagini(_markdown_con_formule(n["corpo"]), root, avvisi, n["slug"])
        video = _video(n.get("video", ""), root, avvisi, n["slug"])
        prima_img = re.search(r'<img[^>]*src="([^"]+)"', corpo)
        immagine = cover_default
        if prima_img and not prima_img.group(1).startswith("http"):
            immagine = base_url + os.path.normpath(os.path.join(url, prima_img.group(1))).replace(os.sep, "/")
        elif collegate and collegate[0].get("thumbnail"):
            immagine = base_url + collegate[0]["thumbnail"]
        n["immagine"] = immagine

        avviso = ""
        if n["stato"] == "esempio":
            avviso = ('        <p class="jr-flag">Nota d\'esempio, scritta per vedere come appare il Journal. '
                      'Le parti sull\'uso in classe sono da compilare.</p>\n')
        elif n["stato"] == "bozza":
            avviso = '        <p class="jr-flag">Bozza: non ancora pubblicata.</p>\n'
        sezione_att = ""
        if collegate:
            sezione_att = ('        <section class="jr-acts" aria-labelledby="att">\n'
                           '            <h2 id="att">Le attività di cui parla</h2>\n            <ul>'
                           + "".join(_scheda_attivita(it, root) for it in collegate) + "</ul>\n        </section>\n")
        corpo_pagina = f"""        <p class="jr-back"><a href="../">← Tutte le note</a></p>
        <article class="jr-note">
            <header>
                <p class="jr-meta"><time datetime="{n['data']}">{_data_it(n['data'])}</time> · {AUTHOR}</p>
                <h1>{html.escape(n['titolo'])}</h1>
                <p class="jr-lead">{html.escape(n['descrizione'])}</p>
            </header>
{avviso}            <div class="jr-body">
{corpo}
{video}
            </div>
        </article>
{sezione_att}"""
        extra_head = f'    <meta property="article:published_time" content="{n["data"]}">\n'
        if not pubblica:
            extra_head += '    <meta name="robots" content="noindex">\n'
        os.makedirs(os.path.join(OUT_DIR, n["slug"]), exist_ok=True)
        with open(os.path.join(OUT_DIR, n["slug"], "index.html"), "w", encoding="utf-8") as f:
            f.write(_pagina(root, n["titolo"], n["descrizione"], canonical, immagine, corpo_pagina, extra_head))
        if pubblica:
            sitemap.append((url, n["data"]))

    # elenco: tutte le note, filtrabile per attività (?attivita=<nome file>) con poche righe di JS
    righe = []
    for n in note:
        chips = "".join(f'<li>{html.escape(it.get("title", ""))}</li>' for it in n["collegate"])
        stems = " ".join(_stem(it["url"]).replace(" ", "_") for it in n["collegate"])
        flag = ' <span class="jr-tag">esempio</span>' if n["stato"] == "esempio" else (
            ' <span class="jr-tag">bozza</span>' if n["stato"] == "bozza" else "")
        righe.append(f"""            <li class="jr-item" data-attivita="{html.escape(stems)}">
                <p class="jr-meta"><time datetime="{n['data']}">{_data_it(n['data'])}</time>{flag}</p>
                <h2><a href="{n['slug']}/">{html.escape(n['titolo'])}</a></h2>
                <p>{html.escape(n['descrizione'])}</p>
                {'<ul class="jr-chips" aria-label="Attività">' + chips + '</ul>' if chips else ''}
            </li>""")
    vuoto = '            <li class="jr-item"><p>Ancora nessuna nota.</p></li>' if not righe else ""
    corpo_indice = f"""        <header class="jr-hero">
            <h1>Journal</h1>
            <p class="jr-lead">Il quaderno di lavoro del laboratorio: perché è nata un'attività, come è andata in classe, cosa cambia.</p>
            <p class="jr-filter" hidden>Note su <strong></strong> · <a href="./">tutte le note</a></p>
        </header>
        <ol class="jr-list" reversed>
{chr(10).join(righe) or vuoto}
        </ol>
        <script>
            (function () {{
                var a = new URLSearchParams(location.search).get('attivita');
                if (!a) return;
                a = a.toLowerCase().replace(/\\.html$/, '').replace(/ /g, '_');
                var shown = 0;
                document.querySelectorAll('.jr-item').forEach(function (li) {{
                    var ok = (' ' + li.dataset.attivita + ' ').indexOf(' ' + a + ' ') !== -1;
                    li.hidden = !ok; if (ok) shown++;
                }});
                var f = document.querySelector('.jr-filter');
                f.querySelector('strong').textContent = shown + (shown === 1 ? ' nota' : ' note') + ' su questa attività';
                f.hidden = false;
            }})();
        </script>"""
    with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(_pagina("../", "Journal", "Diario di bordo di Orfini Math Lab: note brevi sulle attività, su come sono "
                        "nate e su come sono andate in classe.", base_url + OUT_DIR + "/", cover_default, corpo_indice))
    pubblicabili = len(sitemap)
    if sitemap:
        sitemap.insert(0, (OUT_DIR + "/", sitemap[0][1]))

    ultime = [n for n in note if n["stato"] not in STATI_NON_PUBBLICI][:3]
    print(f"  📓 Journal: {len(note)} note ({pubblicabili} pubblicabili), "
          f"{sum(len(v) for v in note_per_url.values())} collegamenti ad attività")
    for a in avvisi:
        print(f"  ⚠️ Journal: {a}")
    return note_per_url, sitemap, ultime

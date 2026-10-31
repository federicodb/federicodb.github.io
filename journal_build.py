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
import unicodedata
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
IMG_MIN_PX = 600          # sotto questa larghezza una foto appare sgranata a tutta colonna
COVER_PX = (1200, 630)    # copertina della nota: scheda dell'elenco e anteprima quando si condivide il link
VIDEO_WARN_MB = 20
THUMBS_DIR = "content/assets/thumbnails/"  # miniature del catalogo (thumbnails.py)
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
    if ext.lower() in (".heic", ".heif"):
        avvisi.append(f"{nota}: '{rel}' è una foto HEIC (iPhone), i browser non la mostrano: salvala come JPG")
        return rel
    if ext.lower() in (".jpg", ".jpeg", ".png", ".webp"):
        dest = os.path.join("media", base + ".webp")
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)  # rispetta la rotazione del telefono prima di buttare l'EXIF
                if im.width < IMG_MIN_PX:
                    avvisi.append(f"{nota}: '{rel}' è larga solo {im.width} px: a tutta colonna sembrerà sgranata")
                im.thumbnail((IMG_MAX_PX, IMG_MAX_PX))
                if im.mode not in ("RGB", "RGBA"):
                    im = im.convert("RGB")
                im.save(os.path.join(OUT_DIR, dest), "WEBP", quality=80, method=6)  # senza exif=: metadati eliminati
        except OSError as e:
            avvisi.append(f"{nota}: '{rel}' non si apre come immagine ({e.__class__.__name__}): file rovinato o formato sconosciuto")
            return rel
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
        src = os.path.join(SRC_DIR, v)
        if os.path.exists(src) and os.path.getsize(src) > VIDEO_WARN_MB * 1024 * 1024:
            avvisi.append(f"{nota}: il video '{v}' pesa {os.path.getsize(src) // (1024 * 1024)} MB: meglio sotto {VIDEO_WARN_MB} MB, o su YouTube")
        dest = _prepara_media(v, avvisi, nota)
        return f'<video class="jr-video" controls preload="metadata" src="../{html.escape(dest)}"></video>'
    avvisi.append(f"{nota}: video non riconosciuto '{v}'")
    return ""


def _immagini_della_nota(n, avvisi):
    """ Controlla le immagini scritte nella nota e restituisce, in ordine, i file locali che esistono.
        Quelle in media/ vengono poi ricompresse da _prepara_media, che segnala anche i file mancanti. """
    nota, locali = n["slug"], []
    for alt, src in re.findall(r'!\[([^\]]*)\]\(\s*<?([^)\s>]+)', n["corpo"]):
        if re.match(r"https?://", src):
            avvisi.append(f"{nota}: immagine da un altro sito '{src}': può sparire o cambiare, meglio salvarla in media/")
            continue
        if not alt.strip():
            avvisi.append(f"{nota}: '{src}' senza testo alternativo (serve a chi non vede e diventa la didascalia)")
        path = os.path.join(SRC_DIR, src) if src.startswith("media/") else src.lstrip("/")
        if os.path.exists(path):
            locali.append(path)
        elif not src.startswith("media/"):
            avvisi.append(f"{nota}: immagine non trovata '{src}'")
    return locali


def _copertina(n, fonti, avvisi):
    """ journal/<nota>/copertina.webp, ritagliata a COVER_PX dalla prima fonte che si apre. Restituisce il percorso
        dalla radice del sito, oppure "" se non c'è nessuna immagine (la scheda resta senza copertina). """
    for src in fonti:
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                if im.width < COVER_PX[0] // 2:
                    avvisi.append(f"{n['slug']}: la copertina viene da '{src}', larga solo {im.width} px")
                # il centro un po' in alto: nelle foto di classe e nelle schermate la parte utile sta lì
                ImageOps.fit(im, COVER_PX, Image.LANCZOS, centering=(0.5, 0.4)).save(
                    os.path.join(OUT_DIR, n["slug"], "copertina.webp"), "WEBP", quality=78, method=6)
            if src.replace(os.sep, "/").startswith(THUMBS_DIR):
                # le miniature del catalogo sono catturate all'apertura dell'app: spesso schermata iniziale o menu
                avvisi.append(f"{n['slug']}: la copertina è la miniatura del catalogo ({os.path.basename(src)}), cioè l'app appena "
                              "aperta: meglio una cattura di una fase interessante in media/, indicata con 'copertina:'")
            return f"{OUT_DIR}/{n['slug']}/copertina.webp"
        except OSError:
            continue
    return ""


def _chiave(url):
    """ Nome dell'attività nei filtri (?attivita=): il nome del file, senza spazi """
    return _stem(url).replace(" ", "_")


def _per_ricerca(testo):
    """ Testo per la ricerca nell'elenco: minuscolo, senza accenti né spazi ripetuti (lo script fa lo stesso con la query) """
    testo = unicodedata.normalize("NFD", testo.lower())
    return re.sub(r"\s+", " ", "".join(c for c in testo if not unicodedata.combining(c))).strip()


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


def _nav(root, attivita=()):
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
{_filtri(root, attivita)}
        </div>
    </nav>"""


def _filtri(root, attivita):
    """ Ricerca e filtro per attività, con l'aspetto della home. Sono link e un form GET verso journal/:
        funzionano da ogni pagina del Journal; nell'elenco lo script filtra mentre si scrive. """
    chips = "".join(f'\n                        <a class="filter-chip" href="{root}journal/?attivita={html.escape(stem)}" data-attivita="{html.escape(stem)}">{html.escape(titolo)}</a>'
                    for stem, titolo in attivita)
    return f"""            <div class="nav-row-2">
                <form class="search-filter-wrapper" action="{root}journal/" method="get" role="search">
                    <button type="button" id="filter-burger-btn" class="burger-btn" aria-label="Filtra per attività" aria-expanded="false" aria-controls="filter-dropdown">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <div class="search-container">
                        <input type="search" id="search-input" name="q" class="search-input" placeholder="Cerca nelle note..." aria-label="Cerca nelle note">
                        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y2="21" x2="16.65" y1="16.65"></line></svg>
                    </div>
                </form>
                <div id="filter-dropdown" class="filter-dropdown">
                    <div class="filter-group">
                        <span class="filter-group-title">Filtra per attività</span>
                        <a class="filter-chip" href="{root}journal/" data-attivita="">Tutte le note</a>{chips}
                    </div>
                </div>
            </div>"""


def _pagina(root, titolo, descrizione, canonical, immagine, corpo, extra_head="", attivita=()):
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

{_nav(root, attivita)}

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

    <script>
        (function () {{
            var btn = document.getElementById('filter-burger-btn'), menu = document.getElementById('filter-dropdown');
            btn.addEventListener('click', function (e) {{
                e.stopPropagation();
                btn.setAttribute('aria-expanded', menu.classList.toggle('active'));
            }});
            document.addEventListener('click', function (e) {{
                if (!menu.contains(e.target)) {{ menu.classList.remove('active'); btn.setAttribute('aria-expanded', 'false'); }}
            }});
        }})();
    </script>
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
    # attività citate da almeno una nota: sono le voci del filtro, in ordine alfabetico
    citate = {_chiave(it["url"]): it.get("title", "") for n in note for a in n["attivita"]
              for it in [per_stem.get(_stem(a))] if it}
    filtro = sorted(citate.items(), key=lambda x: x[1].lower())
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
        # copertina: il campo "copertina:", poi la prima immagine della nota, poi la miniatura della prima attività
        os.makedirs(os.path.join(OUT_DIR, n["slug"]), exist_ok=True)
        fonti = []
        if n.get("copertina"):
            c = n["copertina"]
            c = os.path.join(SRC_DIR, c) if c.startswith("media/") else c.lstrip("/")
            if os.path.exists(c):
                fonti.append(c)
            else:
                avvisi.append(f"{n['slug']}: copertina non trovata '{n['copertina']}'")
        fonti += _immagini_della_nota(n, avvisi) + [it["thumbnail"] for it in collegate if it.get("thumbnail")]
        n["img_rel"] = _copertina(n, fonti, avvisi)
        immagine = base_url + n["img_rel"] if n["img_rel"] else cover_default
        n["immagine"] = immagine
        n["testo"] = _per_ricerca(" ".join([n["titolo"], n["descrizione"], re.sub(r"<[^>]+>", " ", corpo)]
                                           + [it.get("title", "") for it in collegate]))

        avviso = ""
        if n["stato"] == "esempio":
            avviso = ('        <p class="jr-flag">Nota d\'esempio, scritta per vedere come appare il Journal. '
                      'Le parti sull\'uso in classe sono da compilare.</p>\n')
        elif n["stato"] == "bozza":
            avviso = '        <p class="jr-flag">Bozza: non ancora pubblicata.</p>\n'
        sezione_att = ""
        if collegate:
            sezione_att = ('        <aside class="jr-acts" aria-labelledby="att">\n'
                           '            <h2 id="att">Le attività di cui parla</h2>\n            <ul>'
                           + "".join(_scheda_attivita(it, root) for it in collegate) + "</ul>\n        </aside>\n")
        corpo_pagina = f"""        <p class="jr-back"><a href="../">← Tutte le note</a></p>
        <div class="jr-layout">
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
{sezione_att}        </div>"""
        extra_head = f'    <meta property="article:published_time" content="{n["data"]}">\n'
        if not pubblica:
            extra_head += '    <meta name="robots" content="noindex">\n'
        os.makedirs(os.path.join(OUT_DIR, n["slug"]), exist_ok=True)
        with open(os.path.join(OUT_DIR, n["slug"], "index.html"), "w", encoding="utf-8") as f:
            f.write(_pagina(root, n["titolo"], n["descrizione"], canonical, immagine, corpo_pagina, extra_head, filtro))
        if pubblica:
            sitemap.append((url, n["data"]))

    # elenco: schede di tutte le note; ricerca (?q=) e filtro per attività (?attivita=<nome file>) con poche righe di JS
    righe = []
    for n in note:
        chips = "".join(f'<li>{html.escape(it.get("title", ""))}</li>' for it in n["collegate"])
        stems = " ".join(_chiave(it["url"]) for it in n["collegate"])
        flag = ' <span class="jr-tag">esempio</span>' if n["stato"] == "esempio" else (
            ' <span class="jr-tag">bozza</span>' if n["stato"] == "bozza" else "")
        img = (f'<img src="../{_href("", n["img_rel"])}" alt="" loading="lazy">' if n["img_rel"] else "")
        righe.append(f"""            <li class="jr-item" data-attivita="{html.escape(stems)}" data-testo="{html.escape(n['testo'])}">
                <a class="jr-cover" href="{n['slug']}/" tabindex="-1" aria-hidden="true">{img}</a>
                <div class="jr-item-text">
                    <p class="jr-meta"><time datetime="{n['data']}">{_data_it(n['data'])}</time>{flag}</p>
                    <h2><a href="{n['slug']}/">{html.escape(n['titolo'])}</a></h2>
                    <p>{html.escape(n['descrizione'])}</p>
                    {'<ul class="jr-chips" aria-label="Attività">' + chips + '</ul>' if chips else ''}
                </div>
            </li>""")
    vuoto = '            <li class="jr-item"><p>Ancora nessuna nota.</p></li>' if not righe else ""
    corpo_indice = f"""        <header class="jr-hero">
            <h1>Journal</h1>
            <p class="jr-lead">Il quaderno di lavoro del laboratorio: perché è nata un'attività, come è andata in classe, cosa cambia.</p>
            <p class="jr-filter" role="status" hidden><strong></strong> · <a href="./">tutte le note</a></p>
        </header>
        <ol class="jr-list" reversed>
{chr(10).join(righe) or vuoto}
        </ol>
        <p class="jr-none" hidden>Nessuna nota trovata. <a href="./">Mostra tutte le note</a></p>
        <script>
            (function () {{
                // stessa normalizzazione di _per_ricerca: minuscole, senza accenti
                function norm(t) {{ return (t || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''); }}
                var input = document.getElementById('search-input');
                var info = document.querySelector('.jr-filter'), none = document.querySelector('.jr-none');
                var items = document.querySelectorAll('.jr-item[data-testo]');
                var p = new URLSearchParams(location.search);
                var att = (p.get('attivita') || '').toLowerCase().replace(/\\.html$/, '').replace(/ /g, '_');
                input.value = p.get('q') || '';
                function aggiorna() {{
                    var parole = norm(input.value).split(/\\s+/).filter(Boolean), shown = 0;
                    items.forEach(function (li) {{
                        var ok = (!att || (' ' + li.dataset.attivita + ' ').indexOf(' ' + att + ' ') !== -1)
                            && parole.every(function (w) {{ return li.dataset.testo.indexOf(w) !== -1; }});
                        li.hidden = !ok; if (ok) shown++;
                    }});
                    var chip = att && document.querySelector('.filter-chip[data-attivita="' + att + '"]');
                    var filtri = [];
                    if (chip) filtri.push('attività: ' + chip.textContent);
                    if (parole.length) filtri.push('ricerca: "' + input.value.trim() + '"');
                    document.querySelectorAll('.filter-chip').forEach(function (c) {{ c.classList.toggle('active', c.dataset.attivita === att); }});
                    info.hidden = !filtri.length;
                    info.querySelector('strong').textContent = shown + (shown === 1 ? ' nota' : ' note') + ' · ' + filtri.join(' · ');
                    none.hidden = shown > 0 || !items.length;
                    var q = new URLSearchParams();
                    if (att) q.set('attivita', att);
                    if (input.value.trim()) q.set('q', input.value.trim());
                    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
                }}
                input.addEventListener('input', aggiorna);
                input.form.addEventListener('submit', function (e) {{ e.preventDefault(); aggiorna(); }});
                document.querySelectorAll('.filter-chip').forEach(function (c) {{
                    c.addEventListener('click', function (e) {{
                        e.preventDefault(); att = c.dataset.attivita;
                        document.getElementById('filter-dropdown').classList.remove('active');
                        aggiorna();
                    }});
                }});
                aggiorna();
            }})();
        </script>"""
    with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(_pagina("../", "Journal", "Diario di bordo di Orfini Math Lab: note brevi sulle attività, su come sono "
                        "nate e su come sono andate in classe.", base_url + OUT_DIR + "/", cover_default, corpo_indice,
                        attivita=filtro))
    media_dir = os.path.join(SRC_DIR, "media")
    if os.path.isdir(media_dir):
        citati = " ".join(n["corpo"] + " " + n.get("video", "") + " " + n.get("copertina", "") for n in note)
        for f in sorted(os.listdir(media_dir)):
            if not f.startswith(".") and f"media/{f}" not in citati:
                avvisi.append(f"media/{f} non è usata da nessuna nota: non viene pubblicata")
    pubblicabili = len(sitemap)
    if sitemap:
        sitemap.insert(0, (OUT_DIR + "/", sitemap[0][1]))

    ultime = [n for n in note if n["stato"] not in STATI_NON_PUBBLICI][:3]
    print(f"  📓 Journal: {len(note)} note ({pubblicabili} pubblicabili), "
          f"{sum(len(v) for v in note_per_url.values())} collegamenti ad attività")
    for a in avvisi:
        print(f"  ⚠️ Journal: {a}")
    return note_per_url, sitemap, ultime

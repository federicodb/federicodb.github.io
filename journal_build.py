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
import json
import unicodedata
import os
import re
import shutil
import urllib.parse
from datetime import datetime

import markdown
from PIL import Image, ImageOps, ImageStat

SRC_DIR = os.path.join("content", "journal")
OUT_DIR = "journal"
MARKER = ".generato-da-build"  # journal/ viene ricreata solo se contiene questo file
IMG_MAX_PX = 1600
IMG_WARN_KB = 400
IMG_MIN_PX = 600          # sotto questa larghezza una foto appare sgranata a tutta colonna
COVER_PX = (1200, 630)    # copertina della nota: scheda dell'elenco e anteprima quando si condivide il link
VIDEO_WARN_MB = 20
COVER_MAX_LUMA = 110       # luminosità media massima (0-255): le copertine sono in tema scuro, come il sito
REPO_URL = "https://github.com/federicodb/federicodb.github.io"
ULTIMO_AGGIORNAMENTO = ""  # data più recente tra attività e note, la imposta build_journal
RIFORMA_JSON = "riforma2017.json"
TAG_MAX = 6               # tag mostrati sotto il titolo della nota
CORRELATE_MAX = 3         # attività suggerite e altre note
# tag che non dicono di cosa parla un'attività: esclusi da tag principali e affinità
TAG_GENERICI = {"MATEMATICA", "LAB", "BIENNIO", "TRIENNIO", "SIMULAZIONE", "ORFINI", "DIDATTICA LABORATORIALE",
                "GAMIFICATION", "VIDEOGIOCO", "ARCADE", "ARCADE CHALLENGE", "3D", "WEBGL", "INTERATTIVO", "APP",
                "IPIA ORFINI FOLIGNO", "ALGEBRA", "GEOMETRIA", "NUMERI", "TRASVERSALE",
                # indirizzi e etichette pedagogiche: non sono temi (e nessuna etichetta di classe va mostrata)
                "MECCANICO", "ELETTRICO", "ELETTRICO-ELETTRONICO", "MODA", "ODONTOTECNICO", "SOCIO-SANITARIO",
                "GRAFICA", "GRAPHIC DESIGN", "MANUTENZIONE", "DIDATTICA INCLUSIVA", "LABORATORIO METACOGNITIVO",
                "INCLUSIONE", "DSA", "BES",
                # strumenti e contesto, non temi matematici
                "LIM", "AI", "GEMINI", "EDUCATION", "LABORATORIO", "TUTOR", "TUTOR SOCRATICO", "RISOLUTORE"}
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
    # leggibilità alla LIM: frazioni sempre a grandezza piena (\frac -> \dfrac); \tfrac resta piccola di proposito
    return re.sub(r"\x00(\d+)\x00",
                  lambda m: html.escape(re.sub(r"\\frac(?![a-zA-Z])", r"\\dfrac", formule[int(m.group(1))]), quote=False), out)


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
    """ journal/<nota>/copertina.webp, ritagliata a COVER_PX dalla prima fonte che si apre ed è in tema scuro.
        Restituisce il percorso dalla radice del sito, oppure "" se non c'è nessuna immagine scura (la scheda resta
        senza copertina: meglio niente che una schermata chiara in mezzo alle altre). """
    for src in fonti:
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                # il centro un po' in alto: nelle foto di classe e nelle schermate la parte utile sta lì
                cop = ImageOps.fit(im, COVER_PX, Image.LANCZOS, centering=(0.5, 0.4))
                luma = ImageStat.Stat(cop.convert("L")).mean[0]
                if luma > COVER_MAX_LUMA:
                    avvisi.append(f"{n['slug']}: '{src}' è chiara (luminosità {luma:.0f} su 255): le copertine sono in tema "
                                  "scuro, la salto. Cattura l'attività con il tema scuro")
                    continue
                if im.width < COVER_PX[0] // 2:
                    avvisi.append(f"{n['slug']}: la copertina viene da '{src}', larga solo {im.width} px")
                cop.save(os.path.join(OUT_DIR, n["slug"], "copertina.webp"), "WEBP", quality=78, method=6)
            if src.replace(os.sep, "/").startswith(THUMBS_DIR):
                # le miniature del catalogo sono catturate all'apertura dell'app: spesso schermata iniziale o menu
                avvisi.append(f"{n['slug']}: la copertina è la miniatura del catalogo ({os.path.basename(src)}), cioè l'app appena "
                              "aperta: meglio una cattura di una fase interessante in media/, indicata con 'copertina:'")
            return f"{OUT_DIR}/{n['slug']}/copertina.webp"
        except OSError:
            continue
    if fonti:
        avvisi.append(f"{n['slug']}: nessuna immagine in tema scuro per la copertina: la scheda resta senza")
    return ""


GITHUB_SVG = ('<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>')
CODICE_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" '
              'stroke-linecap="round" stroke-linejoin="round" d="M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>')
# segni CC, BY e SA disegnati a tratto (cerchio con due "c", persona, freccia circolare): sobri e monocromi
CC_SVG = ('<svg viewBox="0 0 64 22" aria-hidden="true" class="jr-cc"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
          '<circle cx="11" cy="11" r="9.2"/><path d="M9.6 8.4a3.2 3.2 0 1 0 0 5.2M15.4 8.4a3.2 3.2 0 1 0 0 5.2"/>'
          '<circle cx="32" cy="11" r="9.2"/><circle cx="32" cy="6.2" r="1.4" fill="currentColor" stroke="none"/><path d="M29.4 9.2h5.2v4.6h-1.6v4.2h-2v-4.2h-1.6z" fill="currentColor" stroke="none"/>'
          '<circle cx="53" cy="11" r="9.2"/><path d="M57.2 11a4.2 4.2 0 1 1-1.3-3"/><path d="M56.3 5.4l-.3 2.8-2.8-.3"/></g></svg>')


def colophon(root):
    """ Colophon del sito: diario di bordo, ultimo aggiornamento, open source, licenze (e la registrazione del service
        worker per l'uso offline, così arriva a tutte le pagine del sito). Lo stesso in tutte le pagine
        (le pagine fisse lo ricevono da build.py tra <!-- COLOPHON_START --> e <!-- COLOPHON_END -->). """
    agg = (f' Ultimo aggiornamento: <time datetime="{ULTIMO_AGGIORNAMENTO}">{_data_it(ULTIMO_AGGIORNAMENTO)}</time>.'
           if ULTIMO_AGGIORNAMENTO else "")
    return f"""            <div class="jr-colophon">
                <p><strong>Un diario di bordo.</strong> Orfini Math Lab raccoglie una sperimentazione didattica di matematica
                    all'Istituto Professionale "E. Orfini" di Foligno: attività costruite, provate in classe, corrette.{agg}</p>
                <p>Fatto con strumenti open source, ed è a sua volta un progetto open source: il codice è pubblico su GitHub.</p>
                <ul class="jr-badges" aria-label="Progetto aperto e licenze">
                    <li><a href="{REPO_URL}" target="_blank" rel="noopener">{GITHUB_SVG}Sorgenti su GitHub</a></li>
                    <li><a href="{REPO_URL}/blob/master/LICENSE" target="_blank" rel="noopener" title="Il codice delle app e del sito">{CODICE_SVG}Codice: licenza MIT</a></li>
                    <li><a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="license noopener" title="Testi, note, schede e immagini">{CC_SVG}Contenuti: CC BY-SA 4.0</a></li>
                </ul>
            </div>
            <script src="{root}content/assets/js/offline.js" defer></script>"""


def ultimo_aggiornamento(items, extra=()):
    """ Data più recente tra attività e note (AAAA-MM-GG), per il colophon """
    global ULTIMO_AGGIORNAMENTO
    date = [str(it.get("date", ""))[:10] for it in items] + list(extra)
    ULTIMO_AGGIORNAMENTO = max((d for d in date if re.match(r"^\d{4}-\d{2}-\d{2}$", d)), default="")
    return ULTIMO_AGGIORNAMENTO


def date_note():
    """ Date delle note pubblicabili, senza ricostruire il Journal """
    if not os.path.isdir(SRC_DIR):
        return []
    note = [_leggi_nota(os.path.join(SRC_DIR, f)) for f in os.listdir(SRC_DIR) if f.endswith(".md") and not f.startswith("_")]
    return [n["data"] for n in note if n["stato"] not in STATI_NON_PUBBLICI]


def _competenze_riforma():
    """ {codice: etichetta} dalla mappatura della Riforma 2017, la stessa letta da competenze.html """
    voci = {}

    def cerca(x):
        if isinstance(x, dict):
            if "id" in x and "label" in x:
                voci[x["id"]] = x["label"]
            else:
                for v in x.values():
                    cerca(v)
        elif isinstance(x, list):
            for v in x:
                cerca(v)
    try:
        with open(RIFORMA_JSON, encoding="utf-8") as f:
            cerca(json.load(f))
    except (OSError, ValueError):
        pass
    return voci


def _tag_tematici(item):
    """ I tag che dicono di cosa parla l'attività: niente classi (1 EL), codici (MAT_K1, EU:...), formule, generici """
    out = []
    for t in item.get("tags", []):
        t = t.strip().upper()
        if (not t or t in TAG_GENERICI or "$" in t or ":" in t or re.match(r"^[1-5] [A-Z]+$", t)
                or re.match(r"^(MAT|CIT|EU|IND|SOFT)[_ ]", t)):
            continue
        out.append(t)
    return out


def _tag_principali(collegate):
    """ Tag più frequenti tra le attività della nota, a parità nell'ordine in cui compaiono """
    conta, ordine = {}, []
    for it in collegate:
        for t in _tag_tematici(it):
            if t not in conta:
                ordine.append(t)
            conta[t] = conta.get(t, 0) + 1
    return sorted(ordine, key=lambda t: (-conta[t], ordine.index(t)))[:TAG_MAX]


def _codici(item, riforma):
    """ Codici di competenza dell'attività presenti nella Riforma 2017 (MAT_K1, CIT_4, ...) """
    return [c for c in dict.fromkeys(t.split(":")[0].strip().upper() for t in item.get("tags", [])) if c in riforma]


def _correlate(collegate, catalogo):
    """ Attività non citate con più tag tematici in comune (almeno 2), per "Potrebbe interessarti anche" """
    citate = {it["url"] for it in collegate}
    temi = {t for it in collegate for t in _tag_tematici(it)}
    if not temi:
        return []
    punti = []
    for it in catalogo:
        if it.get("url") in citate or it.get("type") != "app":
            continue
        comuni = len(temi & set(_tag_tematici(it)))
        if comuni >= 2:
            punti.append((comuni, it.get("date", ""), it))
    punti.sort(key=lambda x: (-x[0], x[1]), reverse=False)
    return [it for _, _, it in punti[:CORRELATE_MAX]]


def _testo_tag(t):
    return t[:1] + t[1:].lower()


def _blocco_competenze(codici, riforma, root):
    if not codici:
        return ""
    ordine = ["MAT_K", "MAT_A", "MAT_C", "CIT_", "IND_", "SOFT_"]
    codici = sorted(codici, key=lambda c: (next((i for i, p in enumerate(ordine) if c.startswith(p)), 9), c))
    voci = "".join(f'<li><a href="{_href(root, "competenze.html#" + c)}"><span class="jr-code">{c}</span> '
                   f'{html.escape(riforma[c])}</a></li>' for c in codici)
    return ('            <h2 class="jr-side-title">Competenze in gioco</h2>\n'
            f'            <ul class="jr-skills">{voci}</ul>\n')


def _blocco_correlate(correlate, root):
    if not correlate:
        return ""
    voci = "".join(
        f'<li><a href="{_href(root, it["url"])}">'
        + (f'<img src="{_href(root, it["thumbnail"])}" alt="" loading="lazy">' if it.get("thumbnail") else "")
        + f'<span>{html.escape(it.get("title", ""))}</span></a></li>' for it in correlate)
    return ('            <h2 class="jr-side-title">Potrebbe interessarti anche</h2>\n'
            f'            <ul class="jr-related">{voci}</ul>\n')


def _blocco_altre_note(n, note):
    """ Note sulle stesse attività, poi note con almeno due temi in comune; mai la nota stessa """
    altre = []
    for m in note:
        if m is n:
            continue
        punti = 10 * len(n["chiavi"] & m["chiavi"]) + len(set(n["tag"]) & set(m["tag"]))
        if punti >= 2:
            altre.append((punti, m["data"], m))
    altre.sort(key=lambda x: (-x[0], x[1]), reverse=False)
    if not altre:
        return ""
    voci = "".join(f'<li><a href="../{m["slug"]}/">{html.escape(m["titolo"])}</a>'
                   f' <time datetime="{m["data"]}">{_data_it(m["data"])}</time></li>' for _, _, m in altre[:CORRELATE_MAX])
    return ('        <nav class="jr-more" aria-labelledby="altre">\n            <h2 id="altre">Altre note</h2>\n'
            f'            <ul>{voci}</ul>\n        </nav>')


# stessa tavolozza e stesso calcolo di createCardDOM in content/assets/js/modules/UIManager.js:
# il colore dipende dal titolo, quindi un'attività ha lo stesso colore nel catalogo e nel Journal
PALETTE = ["hsl(330, 80%, 65%)", "hsl(280, 85%, 65%)", "hsl(190, 100%, 55%)", "hsl(155, 80%, 50%)",
           "hsl(38, 100%, 60%)", "hsl(10, 90%, 65%)", "hsl(220, 90%, 70%)"]


def _colore(titolo):
    def int32(x):
        x &= 0xFFFFFFFF
        return x - (1 << 32) if x >= (1 << 31) else x
    h = 0
    for c in titolo or "":
        h = ord(c) + (int32(int32(h) << 5) - h)  # come charCodeAt + ((hash << 5) - hash) in JavaScript
    return PALETTE[abs(h) % len(PALETTE)]


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
    return (f'<li class="jr-act" style="--jr-accent: {_colore(item.get("title", ""))}">{img}<div><h3><a href="{_href(root, item["url"])}">{titolo}</a></h3>'
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
{colophon(root)}
            <div class="footer-bottom">
                <p>&copy; {datetime.now().year} Laboratorio Matematico Orfini Foligno · {AUTHOR} · <a href="{root}privacy-policy.html">Privacy e cookie</a></p>
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
    ultimo_aggiornamento(items, [n["data"] for n in note if n["stato"] not in STATI_NON_PUBBLICI])
    riforma = _competenze_riforma()
    for n in note:
        att = [per_stem[_stem(a)] for a in n["attivita"] if _stem(a) in per_stem]
        n["tag"] = _tag_principali(att)
        n["competenze"] = list(dict.fromkeys(c for it in att for c in _codici(it, riforma)))
        n["correlate"] = _correlate(att, items)
        n["chiavi"] = {_chiave(it["url"]) for it in att}
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
        # copertina: il campo "copertina:", poi le immagini della nota, poi la miniatura della prima attività;
        # sempre in tema scuro (COVER_MAX_LUMA)
        os.makedirs(os.path.join(OUT_DIR, n["slug"]), exist_ok=True)
        fonti = []
        if n.get("copertina"):
            c = n["copertina"]
            c = os.path.join(SRC_DIR, c) if c.startswith("media/") else c.lstrip("/")
            if os.path.exists(c):
                fonti.append(c)
            else:
                avvisi.append(f"{n['slug']}: copertina non trovata '{n['copertina']}'")
        # ripiego: solo la miniatura dell'attività principale (la prima citata), mai quella di un'altra app
        fonti += _immagini_della_nota(n, avvisi) + [it["thumbnail"] for it in collegate[:1] if it.get("thumbnail")]
        n["img_rel"] = _copertina(n, list(dict.fromkeys(fonti)), avvisi)
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
        tag_html = ""
        if n["tag"]:
            tag_html = ('                <ul class="jr-tags" aria-label="Temi">' + "".join(
                f'<li><a href="{root}index.html?tag={urllib.parse.quote(t.lower())}">{html.escape(_testo_tag(t))}</a></li>'
                for t in n["tag"]) + "</ul>\n")
        sezione_att = ""
        if collegate:
            sezione_att = ('        <aside class="jr-acts" aria-labelledby="att">\n'
                           '            <h2 id="att">Le attività di cui parla</h2>\n            <ul>'
                           + "".join(_scheda_attivita(it, root) for it in collegate) + "</ul>\n"
                           + _blocco_competenze(n["competenze"], riforma, root)
                           + _blocco_correlate(n["correlate"], root)
                           + "        </aside>\n")
        corpo_pagina = f"""        <p class="jr-back"><a href="../">← Tutte le note</a></p>
        <div class="jr-layout">
        <article class="jr-note">
            <header>
                <p class="jr-meta"><time datetime="{n['data']}">{_data_it(n['data'])}</time> · {AUTHOR}</p>
                <h1>{html.escape(n['titolo'])}</h1>
                <p class="jr-lead">{html.escape(n['descrizione'])}</p>
{tag_html}            </header>
{avviso}            <div class="jr-body">
{corpo}
{video}
            </div>
        </article>
{sezione_att}        </div>
{_blocco_altre_note(n, note)}"""
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
        righe.append(f"""            <li class="jr-item" style="--jr-accent: {_colore(n['titolo'])}" data-attivita="{html.escape(stems)}" data-testo="{html.escape(n['testo'])}">
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

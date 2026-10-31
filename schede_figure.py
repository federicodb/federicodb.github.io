"""
Figure vettoriali (SVG) per le schede da stampare (schede/), una per argomento. Le usa journal_build._scrivi_schede
con il campo "figura:" dei file in content/schede/. Pensate per la carta: tratto nero, un colore d'accento, niente
sfondi pieni; dimensioni in un viewBox, così la figura si adatta alla colonna.
"""

import math

INK = "#1b1b1b"
ACC = "#0b7285"
ACC2 = "#c2410c"
GRID = "#d4d4d4"
FILL = "rgba(11,114,133,0.13)"
FONT = "font-family=\"Inter, sans-serif\""


def _svg(w, h, corpo, alt):
    return (f'<svg class="sc-fig" viewBox="0 0 {w} {h}" role="img" aria-label="{alt}" xmlns="http://www.w3.org/2000/svg">'
            f'<title>{alt}</title>{corpo}</svg>')


def _t(x, y, s, size=13, anchor="middle", color=INK, weight=400, italic=False):
    st = ' font-style="italic"' if italic else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" fill="{color}" '
            f'font-weight="{weight}" {FONT}{st}>{s}</text>')


def _line(x1, y1, x2, y2, color=INK, w=1.4, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}"{d}/>'


def _path(pts, color=ACC, w=2.2, fill="none", close=False):
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + (" Z" if close else "")
    return f'<path d="{d}" stroke="{color}" stroke-width="{w}" fill="{fill}" stroke-linejoin="round" stroke-linecap="round"/>'


def _dot(x, y, r=4, color=ACC2, fill=None):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill or color}" stroke="{color}" stroke-width="1.5"/>'


def _rect(x, y, w, h, fill="none", color=INK, sw=1.4):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" stroke="{color}" stroke-width="{sw}"/>'


class _Assi:
    """ Piano cartesiano in un riquadro: converte coordinate matematiche in pixel """
    def __init__(self, x0, y0, w, h, xr, yr):
        self.x0, self.y0, self.w, self.h, self.xr, self.yr = x0, y0, w, h, xr, yr

    def p(self, x, y):
        return (self.x0 + (x - self.xr[0]) / (self.xr[1] - self.xr[0]) * self.w,
                self.y0 + self.h - (y - self.yr[0]) / (self.yr[1] - self.yr[0]) * self.h)

    def griglia(self, passo=1, etichette=True):
        out = []
        x = math.ceil(self.xr[0])
        while x <= self.xr[1]:
            a, _ = self.p(x, 0)
            out.append(_line(a, self.y0, a, self.y0 + self.h, GRID, 0.8))
            x += passo
        y = math.ceil(self.yr[0])
        while y <= self.yr[1]:
            _, b = self.p(0, y)
            out.append(_line(self.x0, b, self.x0 + self.w, b, GRID, 0.8))
            y += passo
        return "".join(out) + self.assi(etichette)

    def assi(self, etichette=False):
        ox, oy = self.p(0, 0)
        out = []
        if self.yr[0] <= 0 <= self.yr[1]:
            out.append(_line(self.x0, oy, self.x0 + self.w, oy, INK, 1.3))
            out.append(_t(self.x0 + self.w - 6, oy - 6, "x", 12, "end", italic=True))
        if self.xr[0] <= 0 <= self.xr[1]:
            out.append(_line(ox, self.y0, ox, self.y0 + self.h, INK, 1.3))
            out.append(_t(ox + 8, self.y0 + 12, "y", 12, "start", italic=True))
        return "".join(out)

    def curva(self, f, a=None, b=None, n=120, color=ACC, w=2.2):
        a = self.xr[0] if a is None else a
        b = self.xr[1] if b is None else b
        pts = []
        for i in range(n + 1):
            x = a + (b - a) * i / n
            y = f(x)
            if self.yr[0] - 2 <= y <= self.yr[1] + 2:
                pts.append(self.p(x, max(min(y, self.yr[1] + 0.5), self.yr[0] - 0.5)))
        return _path(pts, color, w)


# ------------------------------------------------------------------ algebra e funzioni

def parabola_casi():
    """ I sei casi: segno di a (righe) per segno di Δ (colonne), con le soluzioni di ax²+bx+c > 0 """
    cw, ch, top, left = 175, 118, 34, 70
    out = [_t(left + cw * 0.5, 20, "Δ &gt; 0", 14, weight=700), _t(left + cw * 1.5, 20, "Δ = 0", 14, weight=700),
           _t(left + cw * 2.5, 20, "Δ &lt; 0", 14, weight=700),
           _t(34, top + ch * 0.5 + 4, "a &gt; 0", 14, weight=700), _t(34, top + ch * 1.5 + 4, "a &lt; 0", 14, weight=700)]
    casi = {(1, 0): ("x &lt; x₁ ∨ x &gt; x₂", [(-1.5, 1.5)]), (1, 1): ("x ≠ x₀", [(0, 0)]), (1, 2): ("∀x ∈ ℝ", []),
            (-1, 0): ("x₁ &lt; x &lt; x₂", [(-1.5, 1.5)]), (-1, 1): ("nessuna", [(0, 0)]), (-1, 2): ("nessuna", [])}
    for r, a in enumerate((1, -1)):
        for c in range(3):
            x0, y0 = left + c * cw, top + r * ch
            out.append(_rect(x0 + 4, y0 + 4, cw - 8, ch - 8, "none", GRID, 1))
            k = [-2.2, 0, 1.2][c]
            ax = _Assi(x0 + 12, y0 + 10, cw - 24, ch - 46, (-3, 3), (-3.2, 3.2))
            out.append(ax.assi())
            out.append(ax.curva(lambda x, a=a, k=k: a * (0.9 * x * x + k), color=ACC))
            sol, radici = casi[(a, c)]
            for rx, _ in radici:
                for xx in ([rx, -rx] if rx else [0]):
                    out.append(_dot(*ax.p(xx, 0), r=3.2))
            out.append(_t(x0 + cw / 2, y0 + ch - 14, sol, 12.5, color=ACC2, weight=600))
    out.append(_t(left + cw * 1.5, top + 2 * ch + 22, "in arancio: le soluzioni di ax² + bx + c &gt; 0", 12, color="#555"))
    return _svg(left + 3 * cw + 10, top + 2 * ch + 32, "".join(out), "I sei casi della parabola secondo il segno di a e del delta")


def retta_pendenza():
    ax = _Assi(40, 15, 300, 250, (-1, 5), (-1, 9))
    out = [ax.griglia()]
    out.append(ax.curva(lambda x: 2 * x + 1, -1, 4, color=ACC))
    p, q = ax.p(1, 3), ax.p(3, 7)
    c = ax.p(3, 3)
    out += [_line(*p, *c, ACC2, 1.8, "5 4"), _line(*c, *q, ACC2, 1.8, "5 4"),
            _t((p[0] + c[0]) / 2, c[1] + 18, "Δx = 2", 13, color=ACC2, weight=600),
            _t(c[0] + 10, (c[1] + q[1]) / 2, "Δy = 4", 13, "start", ACC2, 600),
            _dot(*p), _dot(*q), _t(p[0] - 8, p[1] - 8, "(1; 3)", 12, "end"), _t(q[0] - 8, q[1] - 6, "(3; 7)", 12, "end"),
            _dot(*ax.p(0, 1), 3.5, ACC), _t(ax.p(0, 1)[0] + 8, ax.p(0, 1)[1] + 16, "q = 1", 12, "start", ACC, 600)]
    box = [_t(370, 70, "m = Δy / Δx", 17, "start", weight=700), _t(370, 98, "m = 4 / 2 = 2", 15, "start", ACC2),
           _t(370, 140, "y = m x + q", 17, "start", weight=700), _t(370, 168, "y = 2x + 1", 15, "start", ACC)]
    return _svg(560, 280, "".join(out + box), "Pendenza di una retta come rapporto tra delta y e delta x")


def biliardo_retta():
    ax = _Assi(30, 15, 420, 230, (-6, 12), (-4, 7))
    out = [_rect(24, 9, 432, 242, "none", INK, 2.5), ax.griglia(2, False)]
    out.append(ax.curva(lambda x: x - 5, 1, 11, color=ACC))
    for (x, y, nome, col) in [(3, -2, "P (bianca)", INK), (7, 2, "Q", ACC2), (10, 5, "B (buca)", ACC)]:
        out.append(_dot(*ax.p(x, y), 6 if nome.startswith("B") else 5, col, "#fff" if col == INK else None))
        out.append(_t(ax.p(x, y)[0] + 10, ax.p(x, y)[1] - 8, f"{nome} ({x}; {y})", 12, "start"))
    out.append(_t(470, 60, "1. m = (2 − (−2)) / (7 − 3) = 1", 13, "start"))
    out.append(_t(470, 84, "2. −2 = 1·3 + q  →  q = −5", 13, "start"))
    out.append(_t(470, 108, "3. y = x − 5", 13, "start", ACC, 700))
    out.append(_t(470, 132, "4. B: 5 = 10 − 5 ✓", 13, "start", ACC2, 600))
    return _svg(700, 262, "".join(out), "La retta per la palla bianca e la palla colpita passa per la buca")


def binomio_quadrato():
    a, b, x0, y0 = 150, 80, 30, 25
    out = [_rect(x0, y0, a, a, FILL), _rect(x0 + a, y0, b, a), _rect(x0, y0 + a, a, b), _rect(x0 + a, y0 + a, b, b, FILL),
           _t(x0 + a / 2, y0 + a / 2 + 6, "a²", 22, weight=700), _t(x0 + a + b / 2, y0 + a / 2 + 6, "ab", 18),
           _t(x0 + a / 2, y0 + a + b / 2 + 6, "ab", 18), _t(x0 + a + b / 2, y0 + a + b / 2 + 6, "b²", 18, weight=700),
           _t(x0 + a / 2, y0 - 8, "a", 14, italic=True), _t(x0 + a + b / 2, y0 - 8, "b", 14, italic=True),
           _t(x0 - 12, y0 + a / 2, "a", 14, italic=True), _t(x0 - 12, y0 + a + b / 2, "b", 14, italic=True)]
    out += [_t(300, 90, "(a + b)² = a² + 2ab + b²", 18, "start", weight=700),
            _t(300, 125, "(a − b)² = a² − 2ab + b²", 16, "start", ACC),
            _t(300, 160, "(a + b)(a − b) = a² − b²", 16, "start", ACC2),
            _t(300, 205, "(a + b)³ = a³ + 3a²b + 3ab² + b³", 15, "start"),
            _t(300, 228, "il cubo di lato a + b si divide in 8 pezzi", 12.5, "start", "#555")]
    return _svg(560, 265, "".join(out), "Il quadrato del binomio come somma di aree")


def tiles_trinomio():
    x0, y0, u, X = 30, 20, 22, 110
    out = [_rect(x0, y0, X, X, FILL), _t(x0 + X / 2, y0 + X / 2 + 6, "x²", 20, weight=700)]
    for i in range(3):
        out += [_rect(x0 + X + i * u, y0, u, X), _t(x0 + X + i * u + u / 2, y0 + X / 2 + 4, "x", 12)]
    for j in range(2):
        out += [_rect(x0, y0 + X + j * u, X, u), _t(x0 + X / 2, y0 + X + j * u + u / 2 + 4, "x", 12)]
        for i in range(3):
            out.append(_rect(x0 + X + i * u, y0 + X + j * u, u, u, "rgba(194,65,12,0.15)"))
    out += [_t(x0 + X + 1.5 * u, y0 - 6, "+3", 13, color=ACC2, weight=600), _t(x0 - 14, y0 + X + u, "+2", 13, color=ACC2, weight=600),
            _t(x0 + X / 2, y0 - 6, "x", 13, italic=True), _t(x0 - 10, y0 + X / 2, "x", 13, italic=True)]
    out += [_t(290, 70, "x² + 5x + 6", 19, "start", weight=700), _t(290, 100, "= (x + 2)(x + 3)", 18, "start", ACC),
            _t(290, 145, "1. raccogli se puoi", 13, "start"), _t(290, 167, "2. quadrato o differenza di quadrati?", 13, "start"),
            _t(290, 189, "3. trinomio: somma e prodotto", 13, "start"), _t(290, 211, "4. controlla rimoltiplicando", 13, "start", ACC2)]
    return _svg(560, 200, "".join(out), "Algebra tiles: il trinomio come rettangolo")


def segni_frazione():
    x0, w, xs = 110, 400, {-2: 0.32, 1: 0.68}
    X = lambda t: x0 + w * t
    out = [_line(x0, 30, x0 + w, 30, INK, 1.4), _t(X(0.32), 20, "−2", 13), _t(X(0.68), 20, "1", 13)]
    righe = [("x − 1", [("−", 0, 0.68), ("+", 0.68, 1)], None), ("x + 2", [("−", 0, 0.32), ("+", 0.32, 1)], None),
             ("(x−1)/(x+2)", [("+", 0, 0.32), ("−", 0.32, 0.68), ("+", 0.68, 1)], True)]
    for i, (nome, tratti, fin) in enumerate(righe):
        y = 62 + i * 38
        out.append(_t(x0 - 10, y + 4, nome, 13, "end", weight=700 if fin else 400))
        for s, a, b in tratti:
            col = ACC if s == "+" else ACC2
            out.append(_line(X(a), y, X(b), y, col, 3 if fin else 2, None if s == "+" else "6 4"))
            out.append(_t((X(a) + X(b)) / 2, y - 7, s, 15, color=col, weight=700))
    for t in (0.32, 0.68):
        out.append(_line(X(t), 30, X(t), 150, GRID, 1, "3 3"))
    out += [_dot(X(0.32), 138, 4.5, ACC2, "#fff"), _dot(X(0.68), 138, 4.5, ACC2, ACC2),
            _t(x0 + w / 2, 175, "≥ 0 per x &lt; −2 oppure x ≥ 1   (−2 escluso: annulla il denominatore)", 12.5, color="#333")]
    return _svg(540, 188, "".join(out), "Studio del segno di una frazione")


def condizioni_esistenza():
    x0, w = 40, 480
    X = lambda v: x0 + (v + 4) / 8 * w
    out = [_line(x0, 70, x0 + w, 70, INK, 1.6)]
    for v in range(-4, 5):
        out += [_line(X(v), 65, X(v), 75), _t(X(v), 92, str(v).replace("-", "−"), 12)]
    for v in (-2, 2):
        out += [_dot(X(v), 70, 6, ACC2, "#fff"), _t(X(v), 50, "escluso", 12, color=ACC2, weight=600)]
    out += [_t(x0 + w / 2, 22, "1 / (x² − 4)  esiste per  x ≠ −2  e  x ≠ 2", 15, weight=700),
            _t(x0 + w / 2, 122, "C.E.: il denominatore non deve mai valere 0  →  x² − 4 ≠ 0  →  (x − 2)(x + 2) ≠ 0", 12.5, color="#333")]
    return _svg(560, 135, "".join(out), "Condizioni di esistenza: i valori che annullano il denominatore")


def iperbole_frazionaria():
    ax = _Assi(40, 10, 300, 250, (-3, 5), (-5, 5))
    out = [ax.griglia(1, False), _line(*ax.p(1, -5), *ax.p(1, 5), ACC2, 1.5, "6 4"),
           ax.curva(lambda x: 1 / (x - 1), -3, 0.83), ax.curva(lambda x: 1 / (x - 1), 1.17, 5),
           _t(ax.p(1, 4.5)[0] + 6, ax.p(1, 4.5)[1], "x = 1 (asintoto)", 12, "start", ACC2)]
    box = [_t(370, 80, "y = 1 / (x − 1)", 17, "start", weight=700), _t(370, 110, "dominio: x ≠ 1", 14, "start", ACC2),
           _t(370, 150, "polinomi: (x² − 1) / (x − 1)", 14, "start"), _t(370, 172, "= (x − 1)(x + 1) / (x − 1)", 14, "start"),
           _t(370, 194, "= x + 1   con x ≠ 1", 14, "start", ACC, 700)]
    return _svg(580, 270, "".join(out + box), "Funzione frazionaria con asintoto verticale")


def funzioni_famiglie():
    out = []
    fam = [("lineare", lambda x: 0.8 * x + 0.5, "y = mx + q"), ("quadratica", lambda x: 0.5 * x * x - 1.5, "y = ax² + bx + c"),
           ("esponenziale", lambda x: 2 ** x * 0.5, "y = aˣ"), ("logaritmica", lambda x: math.log(x, 2) if x > 0.02 else -9, "y = logₐ x")]
    for i, (nome, f, formula) in enumerate(fam):
        x0 = 15 + i * 140
        ax = _Assi(x0, 30, 125, 125, (-3, 3), (-3, 3))
        out += [_rect(x0 - 4, 26, 133, 133, "none", GRID, 1), ax.assi(), ax.curva(f, 0.02 if nome == "logaritmica" else -3, 3),
                _t(x0 + 62, 18, nome, 13, weight=700), _t(x0 + 62, 178, formula, 13, color=ACC2)]
    return _svg(580, 190, "".join(out), "Famiglie di funzioni: lineare, quadratica, esponenziale, logaritmica")


def scala_log():
    out = [_t(20, 30, "scala lineare", 13, "start", weight=700), _t(20, 110, "scala logaritmica", 13, "start", weight=700)]
    out.append(_line(20, 60, 560, 60))
    for v in (0, 250, 500, 750, 1000):
        x = 20 + v / 1000 * 540
        out += [_line(x, 55, x, 65), _t(x, 82, str(v), 12)]
    for v in (1, 10, 100):
        out.append(_dot(20 + v / 1000 * 540, 60, 3.5))
    out.append(_line(20, 140, 560, 140))
    for i, v in enumerate(("1", "10", "100", "1000", "10 000")):
        x = 20 + i * 135
        out += [_line(x, 135, x, 145), _t(x, 162, v, 12), _dot(x, 140, 3.5)]
    out.append(_t(290, 190, "a ogni passo uguale si moltiplica per 10: log₁₀ 100 = 2", 13, color=ACC))
    return _svg(580, 200, "".join(out), "Scala lineare e scala logaritmica a confronto")


def circonferenza_goniometrica():
    cx, cy, r = 150, 150, 115
    a = math.radians(30)
    px, py = cx + r * math.cos(a), cy - r * math.sin(a)
    out = [_line(cx - r - 20, cy, cx + r + 20, cy), _line(cx, cy - r - 20, cx, cy + r + 20),
           f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="1.6"/>',
           _line(cx, cy, px, py, ACC, 2.2), _line(px, py, px, cy, ACC2, 2, "5 4"), _line(cx, cy, px, cy, ACC, 3),
           _dot(px, py), _t(px + 8, py - 6, "P", 13, "start", weight=700),
           _t((cx + px) / 2, cy + 18, "cos α", 13, color=ACC, weight=600), _t(px + 8, (py + cy) / 2 + 4, "sin α", 13, "start", ACC2, 600),
           _t(cx + 40, cy - 8, "α", 13, italic=True)]
    tab = [("α", "0°", "30°", "45°", "60°", "90°"), ("sin", "0", "1/2", "√2/2", "√3/2", "1"), ("cos", "1", "√3/2", "√2/2", "1/2", "0")]
    for i, riga in enumerate(tab):
        for j, v in enumerate(riga):
            out.append(_t(330 + j * 48, 90 + i * 30, v, 13, color=ACC if i and j else INK, weight=700 if not j or not i else 400))
    out.append(_t(450, 205, "sin² α + cos² α = 1", 15, weight=700))
    return _svg(580, 300, "".join(out), "Circonferenza goniometrica con seno e coseno")


def onde_fasori():
    ax = _Assi(30, 20, 520, 170, (0, 2 * math.pi * 1.5), (-1.3, 1.3))
    out = [ax.assi(), ax.curva(lambda t: math.sin(t), color=ACC, n=200),
           ax.curva(lambda t: 0.7 * math.sin(t - math.pi / 3), color=ACC2, n=200),
           _t(60, 18, "v(t) = V sin(ωt)", 13, "start", ACC, 600), _t(260, 18, "i(t) = I sin(ωt − φ)", 13, "start", ACC2, 600),
           _t(290, 212, "sfasamento φ = 60°: la corrente arriva in ritardo di un sesto di periodo", 12.5, color="#333")]
    return _svg(580, 222, "".join(out), "Tensione e corrente alternata sfasate")


def esponenziale_crescita():
    return funzioni_famiglie()


# ------------------------------------------------------------------ numeri

def scala_unita():
    unita = ["km", "hm", "dam", "m", "dm", "cm", "mm"]
    out = []
    for i, u in enumerate(unita):
        y = 20 + i * 34
        out += [_rect(30, y, 70, 28, FILL if u == "m" else "none"), _t(65, y + 19, u, 15, weight=700 if u == "m" else 400)]
        if i < len(unita) - 1:
            out += [_t(120, y + 37, "×10 ↓", 11, "start", ACC), _t(170, y + 37, "÷10 ↑", 11, "start", ACC2)]
    out += [_t(250, 50, "lunghezze: ogni gradino ×10", 14, "start", weight=700),
            _t(250, 80, "superfici (m²): ogni gradino ×100", 14, "start", ACC),
            _t(250, 110, "volumi (m³): ogni gradino ×1000", 14, "start", ACC2),
            _t(250, 155, "3,5 m = 350 cm", 14, "start"), _t(250, 180, "2 m² = 200 dm²", 14, "start"),
            _t(250, 205, "1 dm³ = 1 L", 15, "start", weight=700)]
    return _svg(560, 262, "".join(out), "La scala delle unità di misura")


def multipli_mcm():
    out = []
    for r, (n, col) in enumerate(((6, ACC), (8, ACC2))):
        y = 40 + r * 50
        out += [_t(20, y + 5, f"ogni {n}", 13, "start", col, 600), _line(80, y, 560, y, GRID, 1)]
        for k in range(0, 49, n):
            x = 80 + k * 10
            out.append(_dot(x, y, 6 if k == 24 or k == 48 else 4, col, col if k in (24, 48) else "#fff"))
            out.append(_t(x, y - 10, str(k), 11, color=col))
    out += [_line(320, 20, 320, 105, INK, 1.2, "4 3"), _t(320, 125, "mcm(6, 8) = 24: di nuovo insieme", 13, color=INK, weight=700)]
    x0, y0, s = 120, 150, 3
    out += [_rect(x0, y0, 40 * s, 20 * s, "none", INK, 2), _line(x0 + 20 * s, y0, x0 + 20 * s, y0 + 20 * s, ACC, 2, "5 4"),
            _t(x0 + 20 * s, y0 - 6, "40 cm", 12), _t(x0 - 8, y0 + 10 * s + 4, "20", 12, "end"),
            _t(300, y0 + 25, "MCD(40, 20) = 20: due quadrati 20 × 20", 13, "start", weight=700),
            _t(300, y0 + 50, "360 = 2³ · 3² · 5", 14, "start", ACC2)]
    return _svg(580, 222, "".join(out), "Multipli comuni e massimo comun divisore")


def frazioni_torte():
    out = []
    for i, (n, k) in enumerate(((2, 1), (3, 2), (4, 3), (8, 3))):
        cx, cy, r = 60 + i * 120, 70, 45
        for j in range(n):
            a0, a1 = 2 * math.pi * j / n - math.pi / 2, 2 * math.pi * (j + 1) / n - math.pi / 2
            fill = FILL if j < k else "none"
            out.append(f'<path d="M{cx},{cy} L{cx + r * math.cos(a0):.1f},{cy + r * math.sin(a0):.1f} '
                       f'A{r},{r} 0 0 1 {cx + r * math.cos(a1):.1f},{cy + r * math.sin(a1):.1f} Z" fill="{fill}" stroke="{INK}" stroke-width="1.3"/>')
        out.append(_t(cx, cy + 66, f"{k}/{n}", 15, weight=700))
    out.append(_line(30, 175, 520, 175))
    for v, lab in ((0, "0"), (0.5, "1/2"), (0.75, "3/4"), (1, "1")):
        x = 30 + v * 490
        out += [_line(x, 169, x, 181), _t(x, 198, lab, 12)]
    out.append(_t(275, 222, "2/4 = 1/2   ·   1/4 + 1/2 = 1/4 + 2/4 = 3/4", 14, color=ACC))
    return _svg(560, 232, "".join(out), "Frazioni come parti di un intero e sulla retta dei numeri")


def percentuali_griglia():
    out = []
    for i in range(10):
        for j in range(10):
            out.append(_rect(30 + j * 18, 20 + i * 18, 18, 18, FILL if i < 2 or (i == 2 and j < 5) else "none", GRID, 1))
    out += [_rect(30, 20, 180, 180, "none", INK, 1.6),
            _t(250, 50, "25% = 25/100 = 1/4", 17, "start", weight=700),
            _t(250, 85, "10% di 80 = 8", 14, "start"), _t(250, 108, "5% di 80 = 4", 14, "start"),
            _t(250, 131, "15% di 80 = 8 + 4 = 12", 14, "start", ACC, 700),
            _t(250, 170, "sconto 20% su 50 €: paghi 40 €", 14, "start", ACC2),
            _t(250, 193, "(il 20% di 50 è 10)", 12, "start", "#555")]
    return _svg(560, 215, "".join(out), "Percentuali su una griglia di cento quadretti")


def interi_retta():
    x0, w = 30, 500
    X = lambda v: x0 + (v + 6) / 12 * w
    out = [_line(x0, 60, x0 + w, 60, INK, 1.6)]
    for v in range(-6, 7):
        out += [_line(X(v), 55, X(v), 65), _t(X(v), 82, str(v).replace("-", "−"), 12)]
    out += [f'<path d="M{X(2):.1f},50 Q{X(-0.5):.1f},5 {X(-3):.1f},50" fill="none" stroke="{ACC2}" stroke-width="2" marker-end=""/>',
            _t(X(-0.5), 22, "2 − 5 = −3", 13, color=ACC2, weight=600),
            _t(280, 118, "(−2)² = 4   ma   −2² = −4", 15, weight=700), _t(280, 145, "(−3) · (−4) = +12", 14, color=ACC),
            _t(280, 170, "2³ · 2² = 2⁵   ·   (2³)² = 2⁶", 14, color=ACC2)]
    return _svg(560, 182, "".join(out), "Numeri interi sulla retta e regole dei segni")


def pi_ruota():
    out = [f'<circle cx="60" cy="80" r="40" fill="none" stroke="{INK}" stroke-width="1.6"/>', _line(20, 80, 100, 80, ACC, 2),
           _t(60, 74, "d = 1", 12, color=ACC), _line(60, 120, 60 + 3.14159 * 130, 120, ACC2, 3)]
    for k in range(4):
        out += [_line(60 + k * 130, 114, 60 + k * 130, 126), _t(60 + k * 130, 140, str(k), 12)]
    out += [_t(60 + 3.14159 * 130, 108, "π ≈ 3,14159…", 13, "end", ACC2, 700),
            _t(300, 30, "un giro della ruota = π diametri", 14, weight=700),
            _t(300, 172, "22/7 = 3,142857142857…  (periodico)   ·   π = 3,141592…  (mai periodico)", 12.5, color="#333")]
    return _svg(560, 185, "".join(out), "La ruota di diametro 1 srotolata misura pi greco")


def radice2_quadrato():
    out = [_rect(40, 30, 150, 150, FILL), _line(40, 180, 190, 30, ACC2, 2.6),
           _t(115, 198, "1", 14), _t(28, 108, "1", 14), _t(130, 100, "√2", 16, color=ACC2, weight=700)]
    out += [_t(240, 60, "d² = 1² + 1² = 2", 16, "start", weight=700), _t(240, 90, "d = √2 ≈ 1,41421…", 15, "start", ACC2),
            _t(240, 130, "razionale: frazione, decimale finito o periodico", 13, "start"),
            _t(240, 152, "irrazionale: nessuna frazione lo scrive (√2, π, φ)", 13, "start", ACC, 600)]
    return _svg(560, 210, "".join(out), "La diagonale del quadrato di lato 1 misura radice di 2")


def pitagora_triangolo():
    s = 22
    A, B, C = (90, 170), (90 + 4 * s, 170), (90, 170 - 3 * s)
    out = [_path([A, B, C], INK, 2, FILL, True), _rect(A[0], A[1], 4 * s, 4 * s, "rgba(194,65,12,0.12)"),
           _rect(A[0] - 3 * s, C[1], 3 * s, 3 * s, "rgba(194,65,12,0.12)"),
           _t(A[0] + 2 * s, A[1] + 2 * s + 5, "16", 15), _t(A[0] - 1.5 * s, C[1] + 1.5 * s + 5, "9", 15),
           _t(A[0] + 2 * s + 10, C[1] + 1.5 * s - 6, "5", 15, color=ACC2, weight=700),
           _t(A[0] + 2 * s, A[1] - 6, "4", 13), _t(A[0] - 8, C[1] + 1.5 * s + 4, "3", 13, "end")]
    out += [_t(300, 60, "a² + b² = c²", 18, "start", weight=700), _t(300, 92, "3² + 4² = 9 + 16 = 25 = 5²", 14, "start", ACC2),
            _t(300, 130, "altre terne: 8-15-17, 7-24-25", 13, "start"),
            _t(300, 165, "albero di Pitagora: su ogni lato", 13, "start", "#555"), _t(300, 183, "un nuovo quadrato, all'infinito", 13, "start", "#555")]
    return _svg(560, 280, "".join(out), "Teorema di Pitagora con la terna 3 4 5")


def fibonacci_quadrati():
    lati = [1, 1, 2, 3, 5, 8]
    u = 15
    x0, y0 = 30, 20
    w = h = 1
    quadr = [(0, 0, 1)]
    for i in range(1, 6):
        if i % 2:
            quadr.append((w, 0, lati[i]))
            w += lati[i]
        else:
            quadr.append((0, h, lati[i]))
            h += lati[i]
    out = []
    for (qx, qy, s) in quadr:
        X, Y = x0 + qx * u, y0 + (h - qy - s) * u
        out += [_rect(X, Y, s * u, s * u, "none", INK, 1.3), _t(X + s * u / 2, Y + s * u / 2 + 4, str(s), 10 + s, color="#666")]
    out += [_t(300, 50, "1, 1, 2, 3, 5, 8, …", 15, "start", weight=700),
            _t(300, 78, "ogni numero = somma dei due prima", 13, "start"),
            _t(300, 112, "5 / 3 ≈ 1,667   8 / 5 = 1,6", 13, "start", ACC),
            _t(300, 138, "φ = (1 + √5) / 2 ≈ 1,618", 15, "start", ACC2, 700),
            _t(300, 170, "1² + 1² + 2² + 3² + 5² = 5 · 8", 13, "start", "#555")]
    return _svg(560, max(h * u + 40, 190), "".join(out), "Quadrati di Fibonacci che formano un rettangolo quasi aureo")


def tartaglia():
    out = []
    righe = [[1]]
    for _ in range(6):
        p = righe[-1]
        righe.append([1] + [p[i] + p[i + 1] for i in range(len(p) - 1)] + [1])
    for r, riga in enumerate(righe):
        for k, v in enumerate(riga):
            x = 150 + (k - r / 2) * 36
            out.append(_t(x, 26 + r * 28, str(v), 14, color=ACC if r == 2 else INK, weight=700 if r == 2 else 400))
    out += [_t(330, 60, "(a + b)² = 1a² + 2ab + 1b²", 14, "start", ACC, 700),
            _t(330, 90, "riga n: coefficienti di (a + b)ⁿ", 13, "start"),
            _t(330, 125, "ogni numero = somma dei due sopra", 13, "start"),
            _t(330, 155, "somma della riga n = 2ⁿ", 13, "start", ACC2)]
    return _svg(580, 210, "".join(out), "Triangolo di Tartaglia")


# ------------------------------------------------------------------ geometria, dati, modelli

def esaustione():
    cx, cy, r = 120, 115, 90
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="1.6"/>']
    for n, col, dash in ((6, ACC2, None), (12, ACC, "4 3")):
        pts = [(cx + r * math.cos(2 * math.pi * k / n), cy + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
        out.append(_path(pts, col, 1.8, "none", True) if not dash else _path(pts, col, 1.6, "none", True).replace("/>", f' stroke-dasharray="{dash}"/>'))
    out += [_t(270, 50, "esagono: perimetro 6r", 13, "start", ACC2, 600), _t(270, 75, "12 lati: più vicino al cerchio", 13, "start", ACC, 600),
            _t(270, 115, "più lati → più vicino a 2πr", 15, "start", weight=700),
            _t(270, 150, "A cerchio = π r²", 15, "start"), _t(270, 175, "Archimede: 3 + 10/71 &lt; π &lt; 3 + 1/7", 12.5, "start", "#555")]
    return _svg(560, 230, "".join(out), "Poligoni inscritti che si avvicinano al cerchio")


def venn():
    out = [f'<circle cx="150" cy="105" r="80" fill="{FILL}" stroke="{ACC}" stroke-width="2"/>',
           f'<circle cx="250" cy="105" r="80" fill="rgba(194,65,12,0.12)" stroke="{ACC2}" stroke-width="2"/>',
           _rect(30, 10, 340, 190, "none", INK, 1.4), _t(48, 30, "U", 14, weight=700),
           _t(110, 110, "A", 18, weight=700), _t(290, 110, "B", 18, weight=700), _t(200, 110, "A ∩ B", 13, weight=700)]
    out += [_t(400, 60, "A ∪ B: almeno uno", 13, "start"), _t(400, 85, "A ∩ B: tutti e due", 13, "start"),
            _t(400, 110, "A − B: solo A", 13, "start"),
            _t(400, 150, "|A ∪ B| = |A| + |B| − |A ∩ B|", 13, "start", ACC2, 600)]
    return _svg(600, 210, "".join(out), "Diagramma di Venn con unione e intersezione")


def automa_glider():
    def passo(vive):
        conta = {}
        for (x, y) in vive:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if dx or dy:
                        conta[(x + dx, y + dy)] = conta.get((x + dx, y + dy), 0) + 1
        return {c for c, n in conta.items() if n == 3 or (n == 2 and c in vive)}
    gen = [{(1, 0), (2, 1), (0, 2), (1, 2), (2, 2)}]
    for _ in range(2):
        gen.append(passo(gen[-1]))
    out = []
    for g, cells in enumerate(gen):
        x0 = 20 + g * 140
        for i in range(6):
            for j in range(6):
                out.append(_rect(x0 + i * 18, 20 + j * 18, 18, 18, ACC if (i - 1, j - 1) in cells else "none", GRID, 1))
        out.append(_t(x0 + 54, 145, f"generazione {g}", 12))
    out += [_t(450, 40, "una cellula viva resta viva", 12.5, "start"), _t(450, 58, "con 2 o 3 vicine;", 12.5, "start"),
            _t(450, 82, "una morta nasce con 3", 12.5, "start"), _t(450, 100, "vicine esatte.", 12.5, "start"),
            _t(450, 135, "regole semplici,", 13, "start", ACC2, 600), _t(450, 153, "forme che si muovono", 13, "start", ACC2, 600)]
    return _svg(600, 162, "".join(out), "Gioco della vita: un aliante in tre generazioni")


def grafico_generazioni():
    migliore = [2, 3, 5, 5, 8, 9, 12, 12, 15]
    media = [1, 1.5, 2, 3, 3.5, 5, 5.5, 7, 8]
    ax = _Assi(50, 15, 330, 200, (0, 8), (0, 16))
    out = [ax.griglia(2, False)]
    for v in (0, 4, 8, 12, 16):
        out.append(_t(ax.p(0, v)[0] - 8, ax.p(0, v)[1] + 4, str(v), 11, "end"))
    for g in (0, 2, 4, 6, 8):
        out.append(_t(ax.p(g, 0)[0], ax.p(g, 0)[1] + 16, str(g), 11))
    out += [_path([ax.p(i, v) for i, v in enumerate(migliore)], ACC2, 2.4), _path([ax.p(i, v) for i, v in enumerate(media)], ACC, 2.4)]
    out += [_dot(*ax.p(i, v), 3, ACC2) for i, v in enumerate(migliore)] + [_dot(*ax.p(i, v), 3, ACC) for i, v in enumerate(media)]
    out += [_t(215, 250, "generazione", 12), _t(410, 60, "migliore", 14, "start", ACC2, 700), _t(410, 85, "media", 14, "start", ACC, 700),
            _t(410, 125, "punteggio = cibo + passi/100", 13, "start"), _t(410, 160, "il migliore sale a scatti,", 12.5, "start", "#555"),
            _t(410, 178, "la media più lentamente", 12.5, "start", "#555")]
    return _svg(600, 260, "".join(out), "Punteggio del serpente migliore e media per generazione")


def random_walk():
    import random
    rnd = random.Random(7)
    x = y = 0
    pts = [(0, 0)]
    for _ in range(60):
        dx, dy = rnd.choice(((1, 0), (-1, 0), (0, 1), (0, -1)))
        x, y = x + dx, y + dy
        pts.append((x, y))
    ax = _Assi(20, 10, 300, 230, (-8, 8), (-7, 7))
    out = [ax.griglia(1, False), _path([ax.p(a, b) for a, b in pts], ACC, 2), _dot(*ax.p(0, 0), 5, INK, "#fff"), _dot(*ax.p(x, y), 5)]
    out += [_t(350, 60, "a ogni passo: 4 direzioni,", 13, "start"), _t(350, 80, "probabilità 1/4 ciascuna", 13, "start", ACC2, 600),
            _t(350, 120, "dopo n passi la distanza", 13, "start"), _t(350, 140, "tipica cresce come √n", 13, "start", ACC, 600)]
    return _svg(580, 250, "".join(out), "Passeggiata casuale su una griglia")


def attrattore_spirale():
    ax = _Assi(20, 10, 300, 230, (-3, 3), (-2.3, 2.3))
    pts = [ax.p(2.6 * math.exp(-0.12 * t) * math.cos(t), 2 * math.exp(-0.12 * t) * math.sin(t)) for t in [i * 0.08 for i in range(400)]]
    out = [ax.assi(), _path(pts, ACC, 1.8), _dot(*ax.p(0, 0), 4, ACC2)]
    out += [_t(350, 60, "un sistema dinamico:", 13, "start", weight=700), _t(350, 82, "lo stato di domani dipende", 13, "start"),
            _t(350, 102, "da quello di oggi", 13, "start"), _t(350, 140, "attrattore: dove finisce", 13, "start", ACC2, 600),
            _t(350, 160, "il moto, da quasi ovunque", 13, "start", ACC2, 600), _t(350, 195, "caos: piccole differenze,", 12.5, "start", "#555"),
            _t(350, 213, "grandi conseguenze", 12.5, "start", "#555")]
    return _svg(580, 250, "".join(out), "Traiettoria che spiraleggia verso un attrattore")


def plotter_coordinate():
    ax = _Assi(30, 10, 280, 230, (0, 60), (0, 50))
    out = [ax.griglia(10, False)]
    for v in (0, 20, 40, 60):
        out.append(_t(ax.p(v, 0)[0], ax.p(v, 0)[1] + 16, str(v), 11))
    p = ax.p(40, 25)
    out += [_line(*ax.p(0, 0), *p, ACC2, 1.4, "5 4"), _dot(*p, 5), _t(p[0] + 8, p[1] - 8, "(40; 25)", 12, "start"),
            _t(340, 60, "G1 X40 Y25", 17, "start", ACC, 700), _t(340, 86, "porta la penna nel punto", 13, "start"),
            _t(340, 104, "(40; 25), in millimetri", 13, "start"), _t(340, 145, "scala: 100 unità → 200 mm", 13, "start", ACC2, 600),
            _t(340, 165, "fattore 2: ogni misura raddoppia", 13, "start", ACC2)]
    return _svg(580, 255, "".join(out), "Coordinate della penna nel G-code")


def fasi_luna():
    out = [f'<circle cx="290" cy="120" r="22" fill="none" stroke="{INK}" stroke-width="1.6"/>', _t(290, 125, "Terra", 11),
           _t(30, 125, "luce del Sole →", 12, "start", ACC2, 600)]
    nomi = ["piena", "calante", "ultimo q.", "", "nuova", "", "primo q.", "crescente"]
    for k in range(8):
        a = math.pi * k / 4
        x, y = 290 + 95 * math.cos(a), 120 - 85 * math.sin(a)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="13" fill="none" stroke="{INK}" stroke-width="1.3"/>')
        out.append(f'<path d="M{x:.1f},{y - 13:.1f} A13,13 0 0 0 {x:.1f},{y + 13:.1f} Z" fill="{INK}"/>')
        if nomi[k]:
            out.append(_t(x, y + (28 if y > 120 else -20), nomi[k], 11, color="#555"))
    out.append(_t(480, 120, "metà sempre illuminata;", 12.5, "start"))
    out.append(_t(480, 138, "cambia quanta ne vediamo", 12.5, "start", ACC, 600))
    return _svg(640, 240, "".join(out), "Le fasi della Luna attorno alla Terra")


def mercatore():
    out = []
    for i in range(7):
        x = 30 + i * 30
        out.append(_line(x, 30, x, 210, GRID, 1))
    for lat in (0, 20, 40, 60):
        y = 120 - 90 * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) / 2
        y2 = 240 - y
        out += [_line(30, y, 210, y, ACC, 1.4), _t(220, y + 4, f"{lat}°", 11, "start", ACC)]
        if lat:
            out.append(_line(30, y2, 210, y2, ACC, 1.4))
    out += [_rect(30, 30, 180, 180, "none", INK, 1.4),
            _t(300, 60, "i paralleli si allontanano", 13, "start"), _t(300, 80, "verso i poli", 13, "start"),
            _t(300, 120, "fattore di scala ≈ 1 / cos(lat)", 14, "start", ACC2, 700),
            _t(300, 150, "a 60°: tutto appare doppio", 13, "start"),
            _t(300, 185, "la Groenlandia sembra grande", 12.5, "start", "#555"), _t(300, 203, "quanto l'Africa: non lo è", 12.5, "start", "#555")]
    return _svg(580, 230, "".join(out), "Proiezione di Mercatore: paralleli sempre più distanti")


def matrice_giochi():
    out = [_t(250, 22, "B coopera", 13, weight=700), _t(400, 22, "B tradisce", 13, weight=700),
           _t(110, 75, "A coopera", 13, "end", weight=700), _t(110, 145, "A tradisce", 13, "end", weight=700)]
    val = [["3 ; 3", "0 ; 5"], ["5 ; 0", "1 ; 1"]]
    for i in range(2):
        for j in range(2):
            out += [_rect(175 + j * 150, 35 + i * 70, 150, 70, "rgba(194,65,12,0.12)" if (i, j) == (1, 1) else "none"),
                    _t(250 + j * 150, 75 + i * 70, val[i][j], 17, weight=700 if (i, j) == (1, 1) else 400)]
    out += [_t(520, 60, "punti (A ; B)", 12, "start", "#555"), _t(520, 95, "equilibrio di Nash:", 13, "start", ACC2, 600),
            _t(520, 113, "nessuno migliora", 13, "start", ACC2), _t(520, 131, "cambiando da solo", 13, "start", ACC2),
            _t(520, 165, "ma 3;3 è meglio", 13, "start", ACC, 600), _t(520, 183, "per tutti e due", 13, "start", ACC)]
    return _svg(680, 190, "".join(out), "Matrice dei guadagni del dilemma del prigioniero")


def labirinto():
    rows = ["#########", "#...#...#", "#.#.#.#.#", "#.#...#.#", "#.#####.#", "#.......#", "#########"]
    s = 22
    out = []
    for j, r in enumerate(rows):
        for i, c in enumerate(r):
            if c == "#":
                out.append(_rect(20 + i * s, 15 + j * s, s, s, "rgba(27,27,27,0.75)", INK, 0.5))
    filo = [(1, 1), (1, 5), (7, 5), (7, 1), (5, 1), (5, 3), (3, 3), (3, 1)]
    out.append(_path([(20 + (x + 0.5) * s, 15 + (y + 0.5) * s) for x, y in filo], ACC2, 2.6))
    out += [_t(250, 45, "ogni sigillo, un calcolo:", 13, "start", weight=700), _t(250, 72, "15% di 80 = 8 + 4 = 12", 13, "start", ACC),
            _t(250, 96, "3 : 4 = x : 20  →  x = 15", 13, "start", ACC), _t(250, 120, "2/4 = 1/2 = 50%", 13, "start", ACC),
            _t(250, 155, "il filo più corto vale di più", 13, "start", ACC2, 600)]
    return _svg(560, 175, "".join(out), "Labirinto con il filo di Arianna")


def pattern_tassellazione():
    out = []
    for i in range(6):
        for j in range(4):
            cx, cy = 40 + i * 40, 30 + j * 40
            ang = (i + j) * 15
            out.append(f'<rect x="{cx - 14}" y="{cy - 14}" width="28" height="28" fill="none" stroke="{ACC if (i + j) % 2 else INK}" '
                       f'stroke-width="1.5" transform="rotate({ang} {cx} {cy})"/>')
    out += [_t(300, 50, "una regola + ripetizione", 14, "start", weight=700), _t(300, 78, "ogni quadrato ruota di 15°", 13, "start"),
            _t(300, 98, "rispetto al vicino", 13, "start"), _t(300, 135, "traslazione, rotazione,", 13, "start", ACC2, 600),
            _t(300, 155, "simmetria: le isometrie", 13, "start", ACC2, 600)]
    return _svg(560, 180, "".join(out), "Pattern generativo con rotazioni")


FIGURE = {name: fn for name, fn in globals().items() if callable(fn) and not name.startswith("_") and name.islower()
          and name not in ("FIGURE",)}

"""
Dati della Mappa (galaxy.html): temi delle app, legami tra temi e famiglie di temi.
Lo chiama build.py dopo il Journal e scrive galaxy_data.js (window.GALAXY), letto da GalaxyScene.js.

- Temi: le stesse regole del Journal (journal_build._tag_tematici): niente classi, codici, indirizzi, etichette generiche.
  Singolare e plurale dello stesso tema diventano un tema solo (SCOMPOSIZIONE / SCOMPOSIZIONI).
- Legame tra due temi: quanto spesso compaiono insieme rispetto a quante app ne parlano (indice di Jaccard),
  così i temi specifici contano quanto quelli frequenti.
- Linee: l'albero dei legami più forti (nessun tema resta isolato nel suo gruppo), i due legami più forti di ogni tema
  e un "ponte" da Matematica a ogni gruppo di temi che non ha legami con gli altri tengono la forma (molle);
  tutti gli altri legami ("rete") si disegnano soltanto, più tenui: la Mappa resta una ragnatela.
- Famiglie: gruppi di temi che compaiono nelle stesse app (propagazione delle etichette, deterministica): un colore
  per famiglia.
"""

import json
import re
from collections import Counter, defaultdict

from journal_build import _tag_tematici, _testo_tag

OUT = "galaxy_data.js"
SOLE = "MATEMATICA"
LEGAMI_PER_TEMA = 2
# tonalità delle famiglie, in ordine di grandezza (le prime sono quelle della tavolozza delle schede)
TONALITA = [190, 330, 155, 38, 280, 10, 220, 95, 260, 175, 350, 60, 125, 300, 25, 205]


def _unisci_plurali(per_app):
    """ Temi che differiscono solo per l'ultima vocale (FUNZIONE / FUNZIONI) diventano il più frequente """
    conta = Counter(t for temi in per_app for t in temi)
    radice = defaultdict(list)
    for t in conta:
        if len(t) >= 6 and t[-1] in "AEIOU":
            radice[t[:-1]].append(t)
    alias = {}
    for varianti in radice.values():
        if len(varianti) > 1:
            principale = max(varianti, key=lambda t: (conta[t], t))
            for v in varianti:
                alias[v] = principale
    return [sorted({alias.get(t, t) for t in temi}) for temi in per_app]


def _famiglie(temi, vicini):
    """ Propagazione delle etichette pesata: ogni tema prende la famiglia più forte tra i vicini (ordine fisso) """
    fam = {t: t for t in temi}
    for _ in range(20):
        cambiati = 0
        for t in temi:
            peso = defaultdict(float)
            for u, w in vicini[t].items():
                peso[fam[u]] += w
            if not peso:
                continue
            migliore = max(peso.items(), key=lambda x: (x[1], x[0]))[0]
            if peso[migliore] > peso.get(fam[t], 0) and migliore != fam[t]:
                fam[t] = migliore
                cambiati += 1
        if not cambiati:
            break
    return fam


def build_mappa(items):
    apps = [it for it in items if it.get("type") == "app"]
    per_app = _unisci_plurali([[t for t in _tag_tematici(a) if t != "LABORATORIO"] for a in apps])
    conta = Counter(t for temi in per_app for t in temi)
    temi = sorted(conta, key=lambda t: (-conta[t], t))

    insieme = Counter()
    for lista in per_app:
        for i in range(len(lista)):
            for j in range(i + 1, len(lista)):
                insieme[(lista[i], lista[j])] += 1
    jaccard = {k: n / (conta[k[0]] + conta[k[1]] - n) for k, n in insieme.items()}
    vicini = defaultdict(dict)
    for (a, b), w in jaccard.items():
        vicini[a][b] = w
        vicini[b][a] = w

    # albero dei legami più forti (Kruskal): collega tutto ciò che è collegabile
    capo = {t: t for t in temi}

    def trova(t):
        while capo[t] != t:
            capo[t] = capo[capo[t]]
            t = capo[t]
        return t
    linee = {}
    for (a, b), w in sorted(jaccard.items(), key=lambda x: (-x[1], x[0])):
        ra, rb = trova(a), trova(b)
        if ra != rb:
            capo[ra] = rb
            linee[(a, b)] = ("albero", w)
    # i legami più forti di ogni tema
    for t in temi:
        for u, w in sorted(vicini[t].items(), key=lambda x: (-x[1], x[0]))[:LEGAMI_PER_TEMA]:
            k = (t, u) if (t, u) in jaccard else (u, t)
            linee.setdefault(k, ("forte", w))
    # ponti da Matematica: un legame per ogni gruppo separato, verso il suo tema più frequente
    gruppi = defaultdict(list)
    for t in temi:
        gruppi[trova(t)].append(t)
    for membri in gruppi.values():
        principale = min(membri, key=lambda t: (-conta[t], t))
        linee[(SOLE, principale)] = ("ponte", 0.0)

    # tutti gli altri legami: non tirano le molle (la forma resta leggibile), ma disegnano la rete
    for k, w in jaccard.items():
        linee.setdefault(k, ("rete", w))
    # raggi da Matematica ai temi che compaiono in più attività: Matematica è in quasi tutte
    for t in temi:
        if conta[t] >= 2:
            linee.setdefault((SOLE, t), ("raggio", 0.0))

    fam = _famiglie(temi, vicini)
    dimensione = Counter(fam.values())
    ordine_fam = sorted(dimensione, key=lambda f: (-dimensione[f], f))
    tono = {f: TONALITA[i % len(TONALITA)] for i, f in enumerate(ordine_fam)}

    indice = {t: i + 1 for i, t in enumerate(temi)}  # 0 è Matematica
    nodi = [{"id": SOLE.lower(), "label": "Matematica", "count": len(apps), "hue": 0, "sole": True,
             "apps": list(range(len(apps)))}]
    for t in temi:
        nodi.append({"id": t.lower(), "label": _testo_tag(t), "count": conta[t], "hue": tono[fam[t]],
                     "fam": ordine_fam.index(fam[t]),
                     "apps": [i for i, lista in enumerate(per_app) if t in lista]})
    archi = []
    for (a, b), (tipo, w) in sorted(linee.items()):
        ia = 0 if a == SOLE else indice[a]
        ib = 0 if b == SOLE else indice[b]
        archi.append([ia, ib, round(w, 3), tipo])
    schede = [{"t": a.get("title", ""), "u": a.get("url", ""), "th": a.get("thumbnail", ""),
               "d": a.get("excerpt", "")[:140]} for a in apps]

    dati = {"nodes": nodi, "edges": archi, "apps": schede}
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// ⚠️ GENERATO DA build.py (mappa_build.py): non modificare a mano\n")
        f.write("window.GALAXY = " + json.dumps(dati, ensure_ascii=False, separators=(",", ":")) + ";\n")
    ponti = sum(1 for _, (tipo, _) in linee.items() if tipo == "ponte")
    print(f"  🌌 Mappa: {len(temi)} temi, {len(archi)} legami, {len(ordine_fam)} famiglie, {ponti} gruppi agganciati a Matematica")
    return dati

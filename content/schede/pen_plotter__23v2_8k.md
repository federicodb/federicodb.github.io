---
attivita: pen_plotter__23v2_8k
figura: plotter_coordinate
didascalia: La penna nel piano cartesiano: la riga di G-code `G1 X40 Y25` la porta nel punto $(40;\ 25)$.
---

## Ripasso

Lo Studio Plotter trasforma curve, frattali e solidi in G-code: ogni riga porta la penna in un punto del piano cartesiano, in millimetri. Il disegno si adatta al foglio con una proporzione.

## Regole

- `G1 X40 Y25`: penna nel punto $(40;\ 25)$
- scala: tutte le misure per lo stesso fattore
- lunghezza di un tratto: teorema di Pitagora

## Esercizi

1. Un disegno largo $50$ unità diventa largo $120$ mm. Fattore di scala? Dove va $x = 10$?
2. La penna va da `X0 Y0` a `X30 Y40`. Quanto è lungo il tratto?

## Soluzioni

1. $120 : 50 = 2{,}4$; $\ 10 \cdot 2{,}4 = 24$ mm.
2. $\sqrt{30^2 + 40^2} = 50$ mm.

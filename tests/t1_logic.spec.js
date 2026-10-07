// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('T1: Logica pura', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');
  });

  test('parseMathInput converte correttamente e rifiuta input non validi', async ({ page }) => {
    const results = await page.evaluate(() => {
      const fn = window.parseMathInput;
      return {
        val2: fn('2'),
        valNeg3: fn('-3'),
        valHalf: fn('1/2'),
        valNegHalf: fn('-1/2'),
        valNegHalfDen: fn('1/-2'),
        valComma: fn('0,5'),
        valSpaces: fn(' 3 '),
        empty: fn(''),
        abc: fn('abc'),
        divZero: fn('1/0'),
        multipleSlash: fn('1/2/3'),
      };
    });

    expect(results.val2).toBe(2);
    expect(results.valNeg3).toBe(-3);
    expect(results.valHalf).toBeCloseTo(0.5);
    expect(results.valNegHalf).toBeCloseTo(-0.5);
    expect(results.valNegHalfDen).toBeCloseTo(-0.5);
    expect(results.valComma).toBeCloseTo(0.5);
    expect(results.valSpaces).toBe(3);

    expect(results.empty).toBeNull();
    expect(results.abc).toBeNull();
    expect(results.divZero).toBeNull();
    expect(results.multipleSlash).toBeNull();
  });

  test('getDistancePointToLine calcola la distanza corretta', async ({ page }) => {
    const dist = await page.evaluate(() => {
      // Punto (0,0) e retta y = x + 1 (m=1, q=1) => d = |1*0 - 0 + 1| / sqrt(1^2 + 1) = 1/sqrt(2) = sqrt(2)/2
      return window.getDistancePointToLine(0, 0, 1, 1);
    });

    expect(dist).toBeCloseTo(Math.SQRT1_2, 5); // Math.SQRT1_2 = 1/sqrt(2) = sqrt(2)/2
  });

  test('computeHits rileva colpi esatti ed esclude bolle oltre il raggio', async ({ page }) => {
    const res = await page.evaluate(() => {
      const bubbles = [
        { id: 1, x: 2, y: 3, isTarget: true },  // su y = 1*x + 1 (passa per 2, 3) -> d = 0
        { id: 2, x: 5, y: 10, isTarget: false }, // su y = x + 1 => d(5,10, 1, 1) = |5 - 10 + 1| / sqrt(2) = 4 / 1.414 ~ 2.82 > 0.6
      ];
      const radius = 0.6;
      return window.computeHits(bubbles, 1, 1, radius, { level: 1, targetId: 1 });
    });

    expect(res.hits.length).toBe(1);
    expect(res.hits[0].id).toBe(1);
    expect(res.targetHit).toBe(true);
  });

  test('Scorciatoia m = 0 al livello 3 non assegna il bersaglio se bersaglio non è su y = q', async ({ page }) => {
    const res = await page.evaluate(() => {
      const bubbles = [
        { id: 1, x: 2, y: 4, isTarget: true },  // Bersaglio a y = 4
        { id: 2, x: 5, y: 1, isTarget: false }, // Bolla secondaria a y = 1
      ];
      // Studente prova scorciatoia: m = 0, q = 1 (colpisce bolla 2 su y = 1, ma non il bersaglio su y = 4)
      return window.computeHits(bubbles, 0, 1, 0.6, { level: 3, targetId: 1 });
    });

    // La bolla 2 è colpita, ma targetHit deve essere false perché non è il bersaglio e non vale per avanzare
    expect(res.targetHit).toBe(false);
    expect(res.isValidProgress).toBe(false);
  });

  test('Livello 5 genera terne allineate con m razionale semplice', async ({ page }) => {
    const result = await page.evaluate(() => {
      const bubbles = window.spawnBubbles(8, {
        xRange: [-10, 10],
        yRange: [-6, 6],
        bubbleRadius: 0.6,
        level: 5,
      });

      // Troviamo se esistono almeno 2 terne allineate
      function areCollinear(p1, p2, p3) {
        // Area triangolo = 0 <=> x1(y2-y3) + x2(y3-y1) + x3(y1-y2) === 0
        const area2 = p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y);
        return Math.abs(area2) < 1e-6;
      }

      let collinearTriplets = 0;
      const simpleSlopes = [];

      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          for (let k = j + 1; k < bubbles.length; k++) {
            if (areCollinear(bubbles[i], bubbles[j], bubbles[k])) {
              collinearTriplets++;
              const dx = bubbles[j].x - bubbles[i].x;
              const dy = bubbles[j].y - bubbles[i].y;
              if (dx !== 0) {
                simpleSlopes.push(dy / dx);
              }
            }
          }
        }
      }

      return {
        count: bubbles.length,
        collinearTriplets,
        simpleSlopes,
      };
    });

    expect(result.count).toBeGreaterThanOrEqual(6);
    expect(result.collinearTriplets).toBeGreaterThanOrEqual(2);
  });

  test('Punteggio non scende mai sotto zero', async ({ page }) => {
    const score = await page.evaluate(() => {
      // Partendo da punteggio 1, penalità -2 -> non deve diventare negativo
      return window.scoreForHits({
        currentScore: 1,
        hits: [],
        level: 1,
        targetHit: false,
      });
    });

    expect(score.newScore).toBe(0);
    expect(score.pointsDelta).toBe(-1); // perde solo 1 punto fino a 0, oppure delta nominale -2 ma punteggio floor 0
  });

  test('classifyError riconosce m inverso, segno opposto e q dimenticato', async ({ page }) => {
    const res = await page.evaluate(() => {
      // Bersaglio in (2, 4) con q = 0 => m_corretto = 4/2 = 2 (dy=4, dx=2)
      // 1. m inverso: dx/dy = 2/4 = 0.5
      const errInv = window.classifyError({ m: 0.5, q: 0, target: { x: 2, y: 4 }, level: 1 });
      
      // 2. segno opposto: m = -2
      const errSign = window.classifyError({ m: -2, q: 0, target: { x: 2, y: 4 }, level: 1 });
      
      // 3. q dimenticato: q = 2, target in (2, 6) -> m_corretto = (6-2)/2 = 2.
      // Se lo studente dimentica q, fa m = y/x = 6/2 = 3.
      const errForgotQ = window.classifyError({ m: 3, q: 2, target: { x: 2, y: 6 }, level: 2 });

      return {
        errInv: errInv.type,
        errSign: errSign.type,
        errForgotQ: errForgotQ.type,
      };
    });

    expect(res.errInv).toBe('INVERTED_SLOPE');
    expect(res.errSign).toBe('OPPOSITE_SIGN');
    expect(res.errForgotQ).toBe('FORGOT_Q');
  });
});

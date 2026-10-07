// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('T2: Generazione robusta spawnBubbles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/content/apps/math_bubble_equazione_della_retta.html');
  });

  test('spawnBubbles termina entro 50ms anche con range angusti o degeneri', async ({ page }) => {
    const results = await page.evaluate(() => {
      // Semplice LCG seedato per riproducibilità
      function createSeededRandom(seed = 123456789) {
        let s = seed;
        return function () {
          s = (s * 1664525 + 1013904223) % 4294967296;
          return s / 4294967296;
        };
      }

      const ranges = [
        { xRange: [-10, 10], yRange: [0, 0] },
        { xRange: [-10, 10], yRange: [-0.5, 0.5] },
        { xRange: [-10, 10], yRange: [-2, 2] },
      ];

      const outcomes = [];

      for (const r of ranges) {
        const rand = createSeededRandom(42);
        const t0 = performance.now();
        const bubbles = window.spawnBubbles(6, {
          xRange: r.xRange,
          yRange: r.yRange,
          bubbleRadius: 0.6,
          level: 1,
        }, rand);
        const elapsed = performance.now() - t0;

        // Verifica nessuna bolla su assi (x != 0 && y != 0)
        const onAxes = bubbles.filter(b => b.x === 0 || b.y === 0);

        // Verifica sovrapposizioni
        let overlap = false;
        for (let i = 0; i < bubbles.length; i++) {
          for (let j = i + 1; j < bubbles.length; j++) {
            if (Math.hypot(bubbles[i].x - bubbles[j].x, bubbles[i].y - bubbles[j].y) < 0.6 * 2) {
              overlap = true;
            }
          }
        }

        outcomes.push({
          yRange: r.yRange,
          count: bubbles.length,
          elapsed,
          onAxesCount: onAxes.length,
          overlap,
        });
      }

      return outcomes;
    });

    for (const res of results) {
      expect(res.elapsed).toBeLessThan(50);
      expect(res.onAxesCount).toBe(0);
      expect(res.overlap).toBe(false);
    }
  });
});

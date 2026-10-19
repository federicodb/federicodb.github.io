// npm test: tutti i test, uno dopo l'altro
import { execFileSync } from 'node:child_process';
for (const f of ['engine.test.mjs', 'check2.test.mjs', 'game.test.mjs', 'calcoli.test.mjs', 'correctness.test.mjs', 'latex.test.mjs']) {
  process.stdout.write(`• ${f}: `);
  const out = execFileSync(process.execPath, [new URL(f, import.meta.url).pathname], { env: { ...process.env, RUNS: process.env.RUNS || '60' }, encoding: 'utf8' });
  console.log(out.trim().split('\n').pop());
}

// FORMULE: ogni testo generato (domande, spiegazioni, aiuti, opzioni, messaggi sugli errori tipici)
// deve contenere LaTeX che KaTeX sa leggere. Con throwOnError: false (come nell'app) una formula rotta
// non dà errore: compare il sorgente LaTeX in chiaro. Qui invece si compila tutto con throwOnError: true,
// e si controlla che fuori dalle formule non restino comandi LaTeX (\cdot, \frac...) mai renderizzati.
import katex from 'katex';
import { allActivities } from '../activities/catalogo.js';
import { createRng } from '../js/engine/rng.js';
import { setIndirizzo, INDIRIZZI } from '../activities/contesti.js';

// "€" dentro \text{} non ha metriche nei font di KaTeX: il browser usa un font di riserva, non è un errore
const warn = console.warn;
console.warn = (...a) => { if (!String(a[0]).startsWith('No character metrics')) warn(...a); };

const RUNS = Math.max(4, Math.round(+(process.env.RUNS || 60) / 6));
const PROFILI = [null, ...INDIRIZZI.map((i) => i.id)];
const problems = new Map();
let formulas = 0;

/** Divide un testo come fa auto-render di KaTeX: prima $$…$$, poi $…$ */
function segments(str) {
  const out = [];
  let text = '';
  let i = 0;
  while (i < str.length) {
    const display = str.startsWith('$$', i);
    if (str[i] === '$') {
      const open = display ? 2 : 1;
      const end = str.indexOf(display ? '$$' : '$', i + open);
      if (end < 0) { text += str.slice(i); break; }
      out.push({ math: str.slice(i + open, end), display });
      i = end + open;
    } else text += str[i++];
  }
  return { math: out, text };
}

function checkString(where, str) {
  if (typeof str !== 'string' || !str) return;
  const { math, text } = segments(str);
  for (const m of math) {
    formulas++;
    try {
      katex.renderToString(m.math, { throwOnError: true, displayMode: m.display, strict: 'ignore' });
    } catch (e) {
      problems.set(`${where}: ${e.message.split('\n')[0]} in «${m.math}»`, 1);
    }
  }
  const stray = text.replace(/<[^>]*>/g, '').match(/\\[a-zA-Z]+|\^\{|_\{|\{,\}/);
  if (stray) problems.set(`${where}: LaTeX fuori dalle formule («${stray[0]}») in «${text.slice(0, 120)}»`, 1);
}

function checkStep(where, st) {
  for (const k of ['prompt', 'explain', 'hint', 'body', 'title']) checkString(`${where}.${k}`, st[k]);
  for (const o of st.options || []) { checkString(`${where}.option`, o.label); checkString(`${where}.why`, o.why); }
  for (const s of st.statements || []) checkString(`${where}.statement`, s.text);
  for (const t of st.traps || []) checkString(`${where}.trap`, t.msg);
}

for (const ind of PROFILI) {
  setIndirizzo(ind);
  for (const act of allActivities) {
    for (let level = 1; level <= act.levels.length; level++) {
      for (let r = 0; r < RUNS; r++) {
        const rng = createRng(1000 * r + level * 7 + act.id.length);
        const steps = act.generate(rng, level);
        for (const [k, st] of steps.entries()) {
          const where = `${act.id}/${level} passo ${k + 1}${ind ? ` (${ind})` : ''}`;
          checkStep(where, st);
          if (st.twin) checkStep(`${where} gemello`, st.twin());
        }
      }
    }
    if (act.simulation) for (let r = 0; r < RUNS; r++) act.simulation(createRng(r)).forEach((st, k) => checkStep(`${act.id} simulazione ${k + 1}`, st));
  }
}

if (problems.size) {
  console.error([...problems.keys()].slice(0, 40).join('\n'));
  console.error(`${problems.size} problemi di LaTeX`);
  process.exit(1);
}
console.log(`latex OK (${formulas} formule)`);

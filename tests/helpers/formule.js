// Criterio delle formule (vale per tutto il sito e per la Quest): dopo il caricamento nessuna formula deve restare
// scritta in chiaro. Una pagina fallisce se un testo visibile, fuori da script/codice/campi di input e fuori da KaTeX:
//   - contiene una coppia di delimitatori $…$ o $$…$$, oppure \( … \) o \[ … \];
//   - contiene un comando LaTeX scritto in chiaro (\frac, \sqrt, \cdot, …);
// oppure se KaTeX ha segnalato un errore (.katex-error).
// Le eccezioni volute vanno marcate nella pagina con data-latex-ok (es. un esempio di sorgente LaTeX da mostrare).
const { expect } = require('@playwright/test');

function formuleNonDisegnate() {
  const CMD = /\\(frac|dfrac|tfrac|sqrt|cdot|times|div|pm|mp|pi|varphi|phi|alpha|beta|gamma|delta|Delta|theta|lambda|mu|sigma|omega|left|right|leq?|geq?|neq|approx|equiv|infty|sum|prod|int|lim|log|ln|sin|cos|tan|text|textbf|mathrm|mathbb|overline|underline|vec|hat|bar|circ|degree|quad|qquad|begin|end|to|rightarrow|Rightarrow|cup|cap|in|notin|subset|forall|exists)(?![a-zA-Z])/;
  const DELIM = /\$\$?[^$\n]+?\$\$?|\\\(.+?\\\)|\\\[.+?\\\]/;
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const p = n.parentElement;
    if (!p || p.closest('script,style,noscript,textarea,code,pre,kbd,samp,.katex,.katex-mathml,[data-latex-ok]')) continue;
    const t = n.textContent;
    if (!t || !/[$\\]/.test(t)) continue;
    if (p.checkVisibility && !p.checkVisibility({ visibilityProperty: true, opacityProperty: false })) continue;
    if (DELIM.test(t) || CMD.test(t)) out.push(t.trim().replace(/\s+/g, ' ').slice(0, 90));
  }
  for (const e of document.querySelectorAll('.katex-error')) out.push('errore KaTeX: ' + (e.getAttribute('title') || e.textContent).slice(0, 90));
  return [...new Set(out)];
}

/** Aspetta (fino a timeout) che le formule siano disegnate, poi verifica che non ne resti nessuna in chiaro */
async function expectFormuleDisegnate(page, dove = '', timeout = 6000) {
  let resto = [];
  try {
    await expect.poll(async () => (resto = await page.evaluate(formuleNonDisegnate)).length, { timeout, intervals: [150, 300, 600] }).toBe(0);
  } catch {
    expect(resto, `formule non disegnate ${dove}`).toEqual([]);
  }
}

module.exports = { formuleNonDisegnate, expectFormuleDisegnate };

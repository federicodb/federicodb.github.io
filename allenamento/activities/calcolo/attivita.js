// AREA "CALCOLO VELOCE": un'attività della Quest per ogni tecnica di activities/calcolo/trucchi.js.
// Livello 1 Scopri (idea, algoritmo, esempio, esercizi guidati), 2 Applica (esercizi e caccia all'errore),
// 3 Dimostra (rimettere in ordine la dimostrazione, riconoscere il principio). Niente cronometro.
import { TRUCCHI } from './trucchi.js';

const GLYPH = {
  'dividi-e-sposta': '×9', 'per-11': '×11', 'per-5-e-25': '×25', 'raddoppia-e-dimezza': '½·2', 'quadrato-del-5': '5²',
  'somma-per-differenza': 'a²−b²', 'percentuali-scambiate': '%⇄', 'vicino-a-100': '100', 'prova-del-9': '≡9',
  'ricarico-e-margine': '€', 'lavorare-insieme': '√xy', 'costo-uguale-guadagno': 'x²', 'cosa-resta-costante': 'v·t', 'triangolo-dei-coefficienti': 'ⁿCₖ',
};
const PRINCIPI = TRUCCHI.map((t) => t.principio);

function esercizio(t, rng) {
  const e = t.genera(rng);
  return {
    type: 'number',
    ...(e.unit ? { unit: e.unit } : {}),
    prompt: e.testo || `Calcola a mente: $${e.q}$`,
    answer: e.risposta,
    hint: `Trucco: ${t.idea}`,
    explain: e.svolgimento.map((l) => `$$${l}$$`).join(''),
    cas: { eval: e.cas },
    twin: () => esercizio(t, rng),
  };
}

function cacciaErrore(t, rng) {
  const x = t.errore(rng);
  return {
    type: 'choice',
    prompt: `Questo calcolo di $${x.q}$ contiene un errore. In quale passaggio?`,
    options: x.passi.map((p, i) => ({ label: p, correct: i === x.sbagliato, why: i === x.sbagliato ? undefined : 'Questo passaggio è corretto: guarda quelli dopo.' })),
    fixedOrder: true,
    explain: x.perche,
    twin: () => cacciaErrore(t, rng),
  };
}

function ordinaDimostrazione(t) {
  return {
    type: 'order',
    prompt: 'Rimetti in ordine i passaggi della dimostrazione, dal primo all\'ultimo.',
    items: t.dimostrazione.passi.map((p) => p.tex),
    explain: t.dimostrazione.passi.map((p) => `$$${p.tex}$$<p class="muted">${p.perche}</p>`).join('') + `<p>${t.dimostrazione.conclusione}</p>`,
  };
}

function principio(t, rng) {
  const altri = rng.shuffle(PRINCIPI.filter((p) => p !== t.principio)).slice(0, 3);
  return {
    type: 'choice',
    prompt: `Perché funziona il trucco «${t.titolo}»? Su quale principio si regge?`,
    options: [{ label: t.principio, correct: true }, ...altri.map((p) => ({ label: p, why: 'Questo principio regge un altro trucco.' }))],
    explain: `${t.dimostrazione.premessa} $$${t.dimostrazione.passi.map((p) => p.tex).join('\\\\ ')}$$ ${t.dimostrazione.conclusione}`,
    twin: () => principio(t, rng),
  };
}

function attivita(t) {
  return {
    id: `calcolo-${t.id}`,
    area: 'calcolo',
    years: t.anni,
    mat: t.mat,
    ambito: 'Numeri',
    title: t.titolo,
    summary: t.idea,
    glyph: GLYPH[t.id] || '∑',
    trucco: t.id,
    levels: [
      { name: 'Scopri', desc: 'L\'idea, i passi, un esempio' },
      { name: 'Applica', desc: 'A mente, e caccia all\'errore' },
      { name: 'Dimostra', desc: 'Perché funziona sempre' },
    ],
    generate(rng, level) {
      if (level === 1) {
        const es = t.genera(rng);
        const learn = {
          type: 'learn',
          title: t.titolo,
          body: `<p><b>${t.idea}</b></p><ol>${t.passi.map((p) => `<li>${p}</li>`).join('')}</ol><p class="muted">Esempio: $${es.q}$</p>${es.svolgimento.map((l) => `$$${l}$$`).join('')}`,
        };
        return [learn, esercizio(t, rng), esercizio(t, rng), esercizio(t, rng), esercizio(t, rng)];
      }
      if (level === 2) return [esercizio(t, rng), cacciaErrore(t, rng), esercizio(t, rng), esercizio(t, rng), esercizio(t, rng)];
      const learn = { type: 'learn', title: 'Perché funziona sempre', body: `${t.dimostrazione.premessa} Un trucco che si sa dimostrare non si dimentica: si ricostruisce.` };
      const steps = [learn];
      if (t.dimostrazione.passi.length >= 3) steps.push(ordinaDimostrazione(t));
      steps.push(principio(t, rng), esercizio(t, rng), cacciaErrore(t, rng), esercizio(t, rng));
      return steps;
    },
  };
}

export const CALCOLO = TRUCCHI.map(attivita);

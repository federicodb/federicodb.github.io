import { G10, G13 } from './items.js';

const pickN = (rng, fns, n) => rng.shuffle(Object.values(fns)).slice(0, n).map((f) => f(rng));

const ambitoFilter = (fns, ambiti) => Object.fromEntries(Object.entries(fns).filter(([, f]) => ambiti.includes(f.ambito ?? '')));
void ambitoFilter;

export const invalsi10 = {
  id: 'invalsi-10',
  area: 'invalsi',
  years: [2],
  mat: ['MAT_C1', 'MAT_C2', 'MAT_C3', 'MAT_C4'],
  ambito: 'Tutti gli ambiti',
  title: 'Allenamento INVALSI – seconda',
  summary: 'Quesiti originali nello stile della prova di grado 10.',
  glyph: 'G10',
  invalsi: 10,
  levels: [
    { name: 'Numeri e relazioni', desc: 'Percentuali, controesempi, tabelle' },
    { name: 'Spazio, figure e dati', desc: 'Griglie, quadrilateri, grafici' },
    { name: 'Prova mista', desc: '8 quesiti da tutti gli ambiti' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Come è fatta la prova', body: 'La prova INVALSI di matematica è al computer e mescola quattro ambiti: <b>Numeri</b>, <b>Relazioni e funzioni</b>, <b>Spazio e figure</b>, <b>Dati e previsioni</b>. Oltre a calcolare, chiede di <b>argomentare</b> (scegliere la giustificazione giusta, trovare un controesempio) e di valutare più affermazioni vero/falso. Questi quesiti sono originali, costruiti sugli stessi formati.' };
    if (level === 1) return [learn, G10.doubleDiscount(rng), G10.between(rng), G10.counterexample(rng), G10.taxi(rng), G10.lineFromPoints(rng)];
    if (level === 2) return [learn, G10.gridTriangle(rng), G10.quadrilaterals(rng), G10.addData(rng), G10.barPercent(rng), G10.diagonal(rng), G10.urnRatio(rng)];
    return [learn, ...pickN(rng, G10, 8)];
  },
  simulation: (rng) => pickN(rng, G10, 11),
};

export const invalsi13 = {
  id: 'invalsi-13',
  area: 'invalsi',
  years: [5],
  mat: ['MAT_C1', 'MAT_C2', 'MAT_C3', 'MAT_C4'],
  ambito: 'Tutti gli ambiti',
  title: 'Allenamento INVALSI – quinta',
  summary: 'Manutenzione e ricontestualizzazione, come nella prova di grado 13.',
  glyph: 'G13',
  invalsi: 13,
  levels: [
    { name: 'Manutenzione', desc: 'Percentuali, equazioni, statistica di base' },
    { name: 'Ricontestualizzazione', desc: 'Esponenziali, logaritmi, trigonometria' },
    { name: 'Prova mista', desc: '8 quesiti da tutti gli ambiti' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Manutenzione e ricontestualizzazione', body: 'In quinta la prova verifica che la matematica di base sia ancora solida (<b>manutenzione</b>) e che gli strumenti del triennio si sappiano usare in situazioni nuove (<b>ricontestualizzazione</b>): crescite esponenziali, scale logaritmiche, trigonometria, funzioni, probabilità condizionata.' };
    if (level === 1) return [learn, G13.percentChange(rng), G13.equationContext(rng), G13.medianRobust(rng), G13.slopeMeaning(rng), G13.combinatoricsQuick(rng)];
    if (level === 2) return [learn, G13.decay(rng), G13.logScale(rng), G13.heightAngle(rng), G13.parabolaMax(rng), G13.readFunction(rng), G13.doubleTable(rng)];
    return [learn, ...pickN(rng, G13, 8)];
  },
  simulation: (rng) => pickN(rng, G13, 12),
};

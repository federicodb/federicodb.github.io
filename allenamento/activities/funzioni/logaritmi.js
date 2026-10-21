import { tx } from '../../js/engine/helpers.js';
import { settimana } from '../../js/engine/rng.js';
import { plane } from '../../js/gfx/svg.js';

function definition(rng) {
  const b = rng.pick([2, 3, 5, 10]);
  const n = rng.int(-2, b === 2 ? 7 : 4);
  const arg = b ** n;
  const argTex = n >= 0 ? String(arg) : `\\dfrac{1}{${b ** -n}}`;
  return {
    type: 'number',
    cas: { eval: `log(${arg}, ${b})` },
    prompt: `Quanto vale $\\log_{${b}} ${argTex}$?`,
    answer: n,
    traps: [{ value: arg / b, msg: 'Il logaritmo è un esponente: a quale potenza va elevato ' + b + '?' }],
    hint: `Cerca l'esponente: $${b}^{\\,?} = ${argTex}$`,
    explain: `$$${b}^{${n}} = ${argTex} \\Rightarrow \\log_{${b}} ${argTex} = ${n}$$`,
    twin: () => definition(rng),
  };
}

function properties(rng) {
  const b = rng.pick([2, 3, 10]);
  const m = rng.int(1, 4), n = rng.int(1, 4);
  const kind = rng.pick(['sum', 'diff', 'pow']);
  if (kind === 'pow') {
    const k = rng.int(2, 5);
    return {
      type: 'number',
      prompt: `Calcola $\\log_{${b}}\\left(${b ** m}^{${k}}\\right)$.`,
      answer: m * k,
      traps: [{ value: m + k, msg: 'Logaritmo di una potenza: l\'esponente esce come fattore, non si somma.' }],
      hint: '$\\log_b(x^k) = k\\cdot\\log_b x$',
      explain: `$$\\log_{${b}}\\left(${b ** m}^{${k}}\\right) = ${k}\\cdot\\log_{${b}} ${b ** m} = ${k}\\cdot ${m} = ${m * k}$$`,
      twin: () => properties(rng),
    };
  }
  const x = b ** (m + (kind === 'diff' ? n : 0)), y = b ** n;
  return {
    type: 'number',
    prompt: kind === 'sum' ? `Calcola $\\log_{${b}} ${b ** m} + \\log_{${b}} ${y}$.` : `Calcola $\\log_{${b}} ${x} - \\log_{${b}} ${y}$.`,
    answer: kind === 'sum' ? m + n : m,
    hint: kind === 'sum' ? '$\\log_b x + \\log_b y = \\log_b(xy)$' : '$\\log_b x - \\log_b y = \\log_b\\dfrac{x}{y}$',
    explain: kind === 'sum' ? `$$\\log_{${b}}(${b ** m}\\cdot ${y}) = \\log_{${b}} ${b ** (m + n)} = ${m + n}$$` : `$$\\log_{${b}}\\dfrac{${x}}{${y}} = \\log_{${b}} ${x / y} = ${m}$$`,
    twin: () => properties(rng),
  };
}

function solveWithLog(rng) {
  // basi e risultati "puliti": il logaritmo si calcola a mente (2^5 = 32, 3^4 = 81, 10^3 = 1000)
  const [what, b, unit] = rng.pick([['Una colonia di batteri raddoppia ogni ora', 2, 'ore'], ['Il numero di follower di un profilo triplica ogni mese', 3, 'mesi'], ['Una catena di messaggi decuplica ogni giorno', 10, 'giorni']]);
  const t = b === 2 ? rng.int(3, 7) : b === 3 ? rng.int(2, 5) : rng.int(2, 6);
  const k = b ** t;
  return {
    type: 'number', unit,
    prompt: `${what}. Dopo quanti ${unit} sarà diventata ${k.toLocaleString('it-IT')} volte più grande? Risolvi $${b}^t = ${k}$.`,
    answer: t,
    cas: { eval: `log(${k})/log(${b})` },
    traps: [{ value: k / b, msg: `Non si divide per ${b}: bisogna chiedersi a quale potenza elevare ${b} per ottenere ${k}.` }].filter((x) => x.value !== t),
    hint: `$t = \\log_{${b}} ${k}$: quante volte devi moltiplicare ${b} per sé stesso per arrivare a ${k}?`,
    explain: `$$${b}^{${t}} = ${k} \\Rightarrow t = \\log_{${b}} ${k} = ${t}$$ Con un numero non "tondo" si usa la calcolatrice: $t = \\dfrac{\\log k}{\\log ${b}}$.`,
    twin: () => solveWithLog(rng),
  };
}

function decibel(rng, kind = rng.pick(['db', 'ph'])) {
  if (kind === 'ph') {
    const pH = rng.int(2, 12);
    const c = 10 ** -pH;
    return {
      type: 'number',
      prompt: `Il pH è $-\\log_{10}[H^+]$. Una soluzione ha $[H^+] = 10^{-${pH}}$ mol/L. Qual è il pH?`,
      answer: pH,
      traps: [{ value: -pH, msg: 'C\'è un segno meno davanti al logaritmo.' }],
      hint: `$\\log_{10} 10^{-${pH}} = -${pH}$`,
      explain: `$$pH = -\\log_{10} 10^{-${pH}} = -(-${pH}) = ${pH}$$ ${pH < 7 ? 'È acida.' : pH > 7 ? 'È basica.' : 'È neutra.'}`,
      twin: () => decibel(rng, kind),
    };
    void c;
  }
  const n = rng.int(1, 4);
  return {
    type: 'number', unit: 'volte',
    prompt: `Ogni 10 decibel in più l'intensità di un suono si moltiplica per 10. Di quante volte è più intenso un suono di ${60 + 10 * n} dB rispetto a uno di 60 dB?`,
    answer: 10 ** n,
    traps: [{ value: n * 10, msg: 'La scala è logaritmica: ogni 10 dB si moltiplica per 10, non si aggiunge 10.' }],
    hint: `${10 * n} dB in più = ${n} volte "per 10".`,
    explain: `$$10^{${n}} = ${10 ** n}$$ Per questo il passaggio da 80 a 100 dB (cuffie al massimo) è molto più pericoloso di quanto sembri.`,
    twin: () => decibel(rng, kind),
  };
}

function graphLog(rng) {
  const b = rng.pick([2, 3, 10]);
  return {
    type: 'choice',
    fig: plane({ xmin: -1, xmax: 9, ymin: -4, ymax: 4, width: 300, height: 220, fns: [{ f: (x) => Math.log(x) / Math.log(b), domain: [0.02, 9], label: `y = log${b === 10 ? '' : ['', '', '₂', '₃'][b]} x` }], points: [{ x: 1, y: 0, label: '(1; 0)' }] }),
    prompt: `Quale affermazione sul grafico di $y = \\log_{${b}} x$ è vera?`,
    options: rng.shuffle([
      { label: 'È definita solo per $x > 0$ e passa per $(1;\\,0)$', correct: true },
      { label: 'Passa per $(0;\\,1)$', why: 'Quella è la proprietà dell\'esponenziale. Il logaritmo passa per (1; 0).' },
      { label: 'È definita per ogni $x$ reale', why: 'Non esiste l\'esponente che dà un numero negativo o zero: il dominio è x > 0.' },
      { label: 'È decrescente', why: `Con base ${b} > 1 il logaritmo è crescente.` },
    ]),
    explain: `$\\log_{${b}} x$ è l'inversa di $${b}^x$: il grafico è il simmetrico rispetto alla bisettrice $y = x$. Dominio $x > 0$, passa per $(1;\\,0)$, crescente.`,
    twin: () => graphLog(rng),
  };
}

// ---------- varianti: stesse competenze, formati diversi (scelte una volta a settimana) ----------
const db = (rng) => decibel(rng, 'db');
const ph = (rng) => decibel(rng, 'ph');
const logTex = (b, n) => (n >= 0 ? `\\log_{${b}} ${b ** n}` : `\\log_{${b}} \\dfrac{1}{${b ** -n}}`);

/** Dalla potenza al logaritmo: quale scrittura dice la stessa cosa? */
function logFromExp(rng) {
  const [b, n] = rng.until(() => [rng.pick([2, 3, 5]), rng.int(2, 4)], ([x, y]) => x !== y && x ** y <= 625);
  const a = b ** n;
  return {
    type: 'choice',
    prompt: `Sapendo che $${b}^{${n}} = ${a}$, quale uguaglianza è vera?`,
    options: rng.shuffle([
      { label: `$\\log_{${b}} ${a} = ${n}$`, correct: true },
      { label: `$\\log_{${n}} ${a} = ${b}$`, why: 'La base del logaritmo è la base della potenza.' },
      { label: `$\\log_{${b}} ${n} = ${a}$`, why: 'Il risultato di un logaritmo è un esponente, non la potenza.' },
      { label: `$\\log_{${a}} ${b} = ${n}$`, why: 'Base e argomento sono scambiati.' },
    ]),
    explain: `$$${b}^{${n}} = ${a} \\iff \\log_{${b}} ${a} = ${n}$$ Il logaritmo restituisce l'esponente.`,
    twin: () => logFromExp(rng),
  };
}

/** Ordina logaritmi: ognuno è un esponente da trovare */
function logSort(rng) {
  const items = rng.until(() => Array.from({ length: 4 }, () => {
    const b = rng.pick([2, 3, 5, 10]);
    return [b, rng.int(-2, b === 2 ? 5 : 3)];
  }), (v) => new Set(v.map((x) => x[1])).size === 4);
  return {
    type: 'sort',
    prompt: 'Ordina dal più piccolo al più grande.',
    items: items.map(([b, n]) => ({ label: `$${logTex(b, n)}$`, value: n })),
    hint: 'Calcola ogni logaritmo: a quale esponente va elevata la base?',
    explain: `$$${items.slice().sort((x, y) => x[1] - y[1]).map(([b, n]) => `${logTex(b, n)} = ${n}`).join(' \;<\; ')}$$ Conta l'esponente, non quanto è grande l'argomento.`,
    twin: () => logSort(rng),
  };
}

/** Proprietà vere e "proprietà" inventate */
function propertiesTF(rng) {
  const b = rng.pick([2, 3]);
  const [m, n] = rng.until(() => [rng.int(2, 4), rng.int(1, 3)], ([x, y]) => x > y);
  const x = b ** m, y = b ** n, k = rng.int(2, 4);
  const statements = rng.shuffle([
    { text: `$\\log_{${b}}(${x}\\cdot ${y}) = \\log_{${b}} ${x} + \\log_{${b}} ${y}$`, value: true },
    { text: `$\\log_{${b}}(${x} + ${y}) = \\log_{${b}} ${x} + \\log_{${b}} ${y}$`, value: false },
    { text: `$\\log_{${b}} \\dfrac{${x}}{${y}} = \\dfrac{\\log_{${b}} ${x}}{\\log_{${b}} ${y}}$`, value: false },
    { text: `$\\log_{${b}} ${x}^{${k}} = ${k}\\cdot\\log_{${b}} ${x}$`, value: true },
    { text: `$\\log_{${b}} ${x} - \\log_{${b}} ${y} = \\log_{${b}} ${x / y}$`, value: true },
  ]).slice(0, 4);
  return {
    type: 'truefalse',
    prompt: 'Indica se ogni uguaglianza è vera o falsa.',
    statements,
    hint: 'Il logaritmo trasforma prodotti in somme e quozienti in differenze. Non ci sono regole per la somma.',
    explain: `Con i numeri: $\\log_{${b}} ${x} = ${m}$ e $\\log_{${b}} ${y} = ${n}$. Il prodotto ${x}·${y} = ${x * y} ha logaritmo ${m + n} (la somma), il quoziente ha logaritmo ${m - n} (la differenza, non il rapporto $${m}/${n}$); per la somma ${x} + ${y} = ${x + y} non c'è nessuna regola.`,
    twin: () => propertiesTF(rng),
  };
}

/** Decibel al contrario: dall'intensità alla scala */
function dbInverse(rng) {
  const L0 = rng.pick([30, 40, 50, 60]), n = rng.int(1, 4);
  const [a, bb] = rng.pick([['il traffico in città', 'una conversazione'], ['un concerto', 'una strada trafficata'], ['un asciugacapelli', 'una biblioteca']]);
  return {
    type: 'number', unit: 'dB',
    cas: { eval: `${L0} + 10*log10(${10 ** n})` },
    prompt: `${a[0].toUpperCase() + a.slice(1)} produce un suono ${(10 ** n).toLocaleString('it-IT')} volte più intenso di ${bb}, che misura ${L0} dB. Quanti decibel misura?`,
    answer: L0 + 10 * n,
    traps: [{ value: L0 * 10 ** n, msg: 'La scala dei decibel è logaritmica: non si moltiplicano i decibel.' }, { value: L0 + 10 ** n, msg: `Ogni fattore 10 aggiunge 10 dB: ${(10 ** n).toLocaleString('it-IT')} = $10^{${n}}$.` }],
    hint: `$${(10 ** n).toLocaleString('it-IT').replace('.', '{.}')} = 10^{${n}}$: ogni "per 10" sono 10 dB in più.`,
    explain: `$$L = ${L0} + 10\\cdot\\log_{10} ${10 ** n} = ${L0} + 10\\cdot ${n} = ${L0 + 10 * n}\\ \\text{dB}$$`,
    twin: () => dbInverse(rng),
  };
}

/** Confronto di acidità: ogni punto di pH è un fattore 10 */
function phCompare(rng) {
  const p1 = rng.int(2, 5), d = rng.int(1, 3);
  const p2 = p1 + d;
  const [x, y] = rng.pick([['Il succo di limone', 'l\'aranciata'], ['L\'aceto', 'il pomodoro'], ['Una pioggia acida', 'la pioggia normale']]);
  return {
    type: 'number', unit: 'volte',
    prompt: `${x} ha pH ${p1}, ${y} ha pH ${p2}. Quante volte è più grande la concentrazione $[H^+]$ nel primo? ($pH = -\\log_{10}[H^+]$)`,
    answer: 10 ** d,
    traps: [{ value: d, msg: `${d} è la differenza di pH: ogni punto vale un fattore 10.` }, { value: p2 / p1, msg: 'I pH non si dividono: sono esponenti.' }].filter((t) => t.value !== 10 ** d),
    hint: `$[H^+] = 10^{-${p1}}$ e $10^{-${p2}}$: dividi.`,
    explain: `$$\\dfrac{10^{-${p1}}}{10^{-${p2}}} = 10^{${d}} = ${10 ** d}$$ Il pH più basso indica la soluzione più acida.`,
    twin: () => phCompare(rng),
  };
}

export default {
  id: 'logaritmi',
  area: 'funzioni',
  years: [4],
  mat: ['MAT_K2', 'MAT_A3'],
  ambito: 'Relazioni e funzioni',
  title: 'Logaritmi',
  summary: 'L\'esponente nascosto: decibel, pH, tempi di crescita.',
  glyph: 'log',
  levels: [
    { name: 'Che cos\'è', desc: 'Il logaritmo come esponente' },
    { name: 'Proprietà', desc: 'Somme, differenze, potenze' },
    { name: 'Applicazioni', desc: 'Equazioni, decibel e pH' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Una domanda sugli esponenti', body: '$\\log_2 8 = 3$ perché $2^3 = 8$. Il logaritmo risponde alla domanda: "a quale esponente devo elevare la base per ottenere questo numero?"' };
    const pick = (...gens) => settimana(rng).pick(gens)(rng);
    if (level === 1) return [learn, pick(definition, logFromExp), definition(rng), pick(graphLog, logSort), pick(definition, logSort), pick(definition, logFromExp)];
    if (level === 2) return [learn, properties(rng), pick(properties, propertiesTF), pick(definition, logFromExp, logSort), properties(rng), pick(graphLog, propertiesTF)];
    return [learn, solveWithLog(rng), pick(db, dbInverse), pick(solveWithLog, ph), pick(ph, phCompare, dbInverse), pick(properties, propertiesTF)];
  },
};

import { tx } from '../../js/engine/helpers.js';
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

function decibel(rng) {
  const kind = rng.pick(['db', 'ph']);
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
      twin: () => decibel(rng),
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
    twin: () => decibel(rng),
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
    if (level === 1) return [learn, definition(rng), definition(rng), graphLog(rng), definition(rng), definition(rng)];
    if (level === 2) return [learn, properties(rng), properties(rng), definition(rng), properties(rng), graphLog(rng)];
    return [learn, solveWithLog(rng), decibel(rng), solveWithLog(rng), decibel(rng), properties(rng)];
  },
};

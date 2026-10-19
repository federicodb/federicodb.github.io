import { scene } from '../contesti.js';
import { tx } from '../../js/engine/helpers.js';
import { table, bars } from '../../js/gfx/svg.js';

const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

function meanStep(rng) {
  const n = rng.int(5, 8);
  const vals = rng.until(() => Array.from({ length: n }, () => rng.int(3, 10)), (v) => Number.isInteger((avg(v) * 10)) || Number.isInteger(avg(v) * 4));
  const m = avg(vals);
  return {
    type: 'number', decimals: 2,
    fig: table(['Verifica', ...vals.map((_, i) => String(i + 1))], [['Voto', ...vals.map(String)]]),
    prompt: 'Questi sono i voti di uno studente in matematica. Qual è la media?',
    answer: m,
    traps: [{ value: median(vals), msg: 'Questa è la mediana: la media è la somma diviso il numero dei voti.' }],
    hint: `Somma i ${n} voti e dividi per ${n}.`,
    explain: `$$\\bar x = \\dfrac{${vals.join(' + ')}}{${n}} = \\dfrac{${vals.reduce((s, x) => s + x, 0)}}{${n}} = ${tx(m)}$$`,
    twin: () => meanStep(rng),
  };
}

function medianStep(rng) {
  const n = rng.pick([7, 8, 9, 10]);
  const ds = scene(rng, 'dati');
  const vals = Array.from({ length: n }, () => rng.int(ds.min, ds.max));
  return {
    type: 'number', decimals: 2,
    fig: `<p class="data-row">${vals.join('&ensp;')}</p>`,
    prompt: `${ds.intro}: ${ds.what}. Qual è la mediana?`,
    answer: median(vals),
    traps: [{ value: vals[Math.floor(n / 2)], msg: 'Prima di prendere il valore centrale i dati vanno messi in ordine.' }, { value: avg(vals), msg: 'Questa è la media.' }],
    hint: n % 2 ? 'Ordina i dati e prendi quello centrale.' : 'Ordina i dati: con un numero pari di dati la mediana è la media dei due centrali.',
    explain: `In ordine: ${vals.slice().sort((a, b) => a - b).join(', ')}. ${n % 2 ? `Il valore centrale (il ${(n + 1) / 2}°) è ${median(vals)}.` : `I due centrali sono ${vals.slice().sort((a, b) => a - b)[n / 2 - 1]} e ${vals.slice().sort((a, b) => a - b)[n / 2]}: la mediana è ${tx(median(vals))}.`}`,
    twin: () => medianStep(rng),
  };
}

function modeChart(rng) {
  const cat = scene(rng, 'categorie');
  const labels = cat.labels;
  const vals = rng.until(() => labels.map(() => rng.int(1, 12)), (v) => v.filter((x) => x === Math.max(...v)).length === 1);
  const top = labels[vals.indexOf(Math.max(...vals))];
  const total = vals.reduce((s, x) => s + x, 0);
  return {
    type: 'choice',
    chart: { type: 'bar', alt: 'Grafico a barre delle risposte', data: { labels, datasets: [{ label: 'Studenti', data: vals, colorEach: true }] }, legend: false },
    fig: bars(labels, vals),
    figFallbackOnly: true,
    prompt: `Il grafico mostra le risposte di ${total} studenti alla domanda «${cat.q}». Qual è la moda?`,
    options: labels.slice(0, 4).includes(top) ? labels.slice(0, 4).map((l) => ({ label: l, correct: l === top, why: l === top ? undefined : 'La moda è il valore con la frequenza più alta: la barra più alta.' })) : [top, ...labels.slice(0, 3)].map((l) => ({ label: l, correct: l === top, why: l === top ? undefined : 'La moda è la barra più alta.' })),
    explain: `La barra più alta è "${top}" con ${Math.max(...vals)} risposte: è la moda.`,
    twin: () => modeChart(rng),
  };
}

function percentPie(rng) {
  const labels = ['Sì', 'No', 'Non so'];
  const total = rng.pick([20, 25, 40, 50]);
  const yes = rng.int(Math.round(total * 0.3), Math.round(total * 0.6));
  const no = rng.int(1, total - yes - 1);
  const vals = [yes, no, total - yes - no];
  const ask = rng.int(0, 2);
  const pct = (vals[ask] / total) * 100;
  return {
    type: 'number', unit: '%', decimals: 1,
    chart: { type: 'doughnut', alt: 'Grafico a torta del sondaggio', data: { labels, datasets: [{ data: vals }] } },
    fig: table(['Risposta', 'Frequenza'], labels.map((l, i) => [l, String(vals[i])])),
    prompt: `Sondaggio su ${total} studenti: "Vorresti più ore di laboratorio?". Che percentuale ha risposto "${labels[ask]}"?`,
    answer: pct,
    traps: [{ value: vals[ask], msg: 'Questa è la frequenza assoluta: per la percentuale dividi per il totale e moltiplica per 100.' }],
    hint: `Frequenza relativa = ${vals[ask]} : ${total}`,
    explain: `$$\\dfrac{${vals[ask]}}{${total}}\\cdot 100 = ${tx(pct)}\\%$$`,
    twin: () => percentPie(rng),
  };
}

function needed(rng) {
  const have = rng.until(() => Array.from({ length: rng.int(3, 4) }, () => rng.int(4, 8)), (v) => true);
  const target = rng.pick([6, 6.5, 7]);
  const n = have.length + 1;
  const x = target * n - have.reduce((s, a) => s + a, 0);
  if (x < 3 || x > 10 || !Number.isInteger(x * 2)) return needed(rng);
  return {
    type: 'number', decimals: 1,
    prompt: `Hai preso ${have.join(', ')}. Che voto ti serve nella prossima verifica per avere esattamente la media ${tx(target).replace('{,}', ',')}?`,
    answer: x,
    traps: [{ value: target, msg: 'Non basta prendere la media che vuoi: devi compensare i voti precedenti.' }],
    hint: `Con ${n} voti, la somma deve essere $${tx(target)}\\cdot ${n} = ${tx(target * n)}$.`,
    explain: `Somma necessaria: $${tx(target)}\\cdot ${n} = ${tx(target * n)}$. Somma attuale: $${have.reduce((s, a) => s + a, 0)}$. Serve $${tx(target * n)} - ${have.reduce((s, a) => s + a, 0)} = ${tx(x)}$.`,
    twin: () => needed(rng),
  };
}

function weighted(rng) {
  const cats = [['Verifiche scritte', 50], ['Interrogazioni', 30], ['Laboratorio', 20]];
  const marks = cats.map(() => rng.int(4, 9));
  const w = cats.reduce((s, c, i) => s + (c[1] * marks[i]) / 100, 0);
  return {
    type: 'number', decimals: 2,
    fig: table(['Voce', 'Peso', 'Voto'], cats.map((c, i) => [c[0], c[1] + '%', String(marks[i])])),
    prompt: 'Il voto finale è una media ponderata con i pesi in tabella. Quanto vale?',
    answer: w,
    traps: [{ value: avg(marks), msg: 'Questa è la media semplice: ogni voto va moltiplicato per il suo peso.' }],
    hint: 'Moltiplica ogni voto per il peso (in decimali) e somma.',
    explain: `$$${marks.map((m, i) => `${m}\\cdot ${tx(cats[i][1] / 100)}`).join(' + ')} = ${tx(w)}$$`,
    twin: () => weighted(rng),
  };
}

function lineTrend(rng) {
  const months = ['Set', 'Ott', 'Nov', 'Dic', 'Gen', 'Feb'];
  const base = rng.int(20, 50);
  const vals = months.map((_, i) => base + i * rng.int(-3, 6) + rng.int(-4, 4));
  const i = rng.int(1, 5);
  const d = vals[i] - vals[i - 1];
  return {
    type: 'number',
    chart: { type: 'line', alt: 'Andamento mensile', data: { labels: months, datasets: [{ label: 'Ore di studio', data: vals }] }, legend: false, yTitle: 'ore' },
    fig: table(['Mese', ...months], [['Ore', ...vals.map(String)]]),
    prompt: `Il grafico mostra le ore di studio di una classe al mese. Di quante ore sono cambiate da ${months[i - 1]} a ${months[i]}? (scrivi un numero negativo se sono diminuite)`,
    answer: d,
    traps: [{ value: -d, msg: 'Controlla il segno: aumento positivo, calo negativo.' }],
    hint: `Valore di ${months[i]} meno valore di ${months[i - 1]}.`,
    explain: `$$${vals[i]} - ${vals[i - 1]} = ${d}$$`,
    twin: () => lineTrend(rng),
  };
}

export default {
  id: 'statistica',
  area: 'dati',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_K4', 'MAT_C3', 'MAT_A2'],
  ambito: 'Dati e previsioni',
  title: 'Statistica',
  summary: 'Media, mediana, moda e grafici veri.',
  glyph: 'x̄',
  levels: [
    { name: 'Indici', desc: 'Media, mediana, moda' },
    { name: 'Leggere i grafici', desc: 'Barre, torte e linee' },
    { name: 'Medie che servono', desc: 'Pesi e voti da raggiungere' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Tre modi di dire "il valore tipico"', body: 'La <b>media</b> distribuisce il totale in parti uguali. La <b>mediana</b> è il valore centrale dei dati ordinati: non si lascia influenzare da un valore estremo. La <b>moda</b> è il valore più frequente.' };
    if (level === 1) return [learn, meanStep(rng), medianStep(rng), modeChart(rng), meanStep(rng), medianStep(rng)];
    if (level === 2) return [learn, modeChart(rng), percentPie(rng), lineTrend(rng), percentPie(rng), lineTrend(rng)];
    return [learn, weighted(rng), needed(rng), weighted(rng), needed(rng), meanStep(rng)];
  },
};

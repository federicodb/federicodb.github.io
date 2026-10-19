import { tree } from '../../js/gfx/svg.js';

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const perm = (n, k) => fact(n) / fact(n - k);
const comb = (n, k) => perm(n, k) / fact(k);

function menu(rng) {
  const a = rng.int(2, 5), b = rng.int(2, 4), c = rng.int(2, 4);
  return {
    type: 'number',
    fig: a * b <= 12 ? tree([Array.from({ length: a }, (_, i) => `P${i + 1}`), Array.from({ length: b }, (_, i) => `S${i + 1}`)]) : undefined,
    prompt: `Il bar della scuola offre ${a} panini, ${b} bibite e ${c} dolci. Quanti menù diversi (un panino, una bibita, un dolce) si possono comporre?`,
    answer: a * b * c,
    traps: [{ value: a + b + c, msg: 'Per ogni panino ci sono tutte le bibite: le scelte si moltiplicano.' }],
    hint: 'Principio moltiplicativo: scelte in sequenza si moltiplicano.',
    explain: `$$${a}\\cdot ${b}\\cdot ${c} = ${a * b * c}$$ L'albero mostra i primi due livelli: ${a * b} combinazioni panino–bibita, ognuna con ${c} dolci.`,
    twin: () => menu(rng),
  };
}

function podium(rng) {
  const n = rng.int(5, 12), k = rng.pick([2, 3]);
  return {
    type: 'number',
    prompt: `${n} atleti corrono una gara. In quanti modi diversi può essere composto il podio dei primi ${k}${k === 3 ? ' (oro, argento, bronzo)' : ' (primo e secondo)'}?`,
    answer: perm(n, k),
    traps: [{ value: comb(n, k), msg: 'Qui l\'ordine conta: oro e argento non sono la stessa cosa.' }, { value: n ** k, msg: 'Lo stesso atleta non può occupare due posti.' }],
    hint: `Per il primo posto ci sono ${n} possibilità, per il secondo ${n - 1}…`,
    explain: `$$${Array.from({ length: k }, (_, i) => n - i).join('\\cdot ')} = ${perm(n, k)}$$ Sono disposizioni semplici: l'ordine conta.`,
    twin: () => podium(rng),
  };
}

function pin(rng) {
  const len = rng.int(3, 5);
  const rep = rng.chance(0.5);
  return {
    type: 'number',
    prompt: `Quanti codici di ${len} cifre (da 0 a 9) si possono formare ${rep ? 'se le cifre si possono ripetere' : 'se le cifre devono essere tutte diverse'}?`,
    answer: rep ? 10 ** len : perm(10, len),
    traps: rep ? [{ value: perm(10, len), msg: 'Le cifre possono ripetersi: ogni posizione ha sempre 10 scelte.' }] : [{ value: 10 ** len, msg: 'Le cifre non si ripetono: ogni posizione ha una scelta in meno.' }],
    hint: rep ? 'Ogni posizione: 10 scelte.' : 'Prima cifra 10 scelte, seconda 9, …',
    explain: rep ? `$$10^{${len}} = ${10 ** len}$$` : `$$${Array.from({ length: len }, (_, i) => 10 - i).join('\\cdot ')} = ${perm(10, len)}$$`,
    twin: () => pin(rng),
  };
}

function anagram(rng) {
  const n = rng.int(3, 6);
  return {
    type: 'number',
    prompt: `In quanti modi diversi si possono mettere in fila ${n} studenti?`,
    answer: fact(n),
    traps: [{ value: n * n, msg: 'Il primo posto ha n scelte, il secondo n−1, e così via.' }],
    hint: `$${n}! = ${Array.from({ length: n }, (_, i) => n - i).join('\\cdot ')}$`,
    explain: `$$${n}! = ${Array.from({ length: n }, (_, i) => n - i).join('\\cdot ')} = ${fact(n)}$$`,
    twin: () => anagram(rng),
  };
}

function handshakes(rng) {
  const n = rng.int(4, 15);
  return {
    type: 'number',
    prompt: `Alla fine del torneo ognuno dei ${n} partecipanti stringe la mano a tutti gli altri, una volta sola. Quante strette di mano in tutto?`,
    answer: comb(n, 2),
    traps: [{ value: n * (n - 1), msg: 'Così ogni stretta di mano è contata due volte (A con B e B con A).' }],
    hint: 'Ognuno stringe la mano a n − 1 persone, ma ogni stretta coinvolge due persone.',
    explain: `$$\\binom{${n}}{2} = \\dfrac{${n}\\cdot ${n - 1}}{2} = ${comb(n, 2)}$$ L'ordine non conta: sono combinazioni.`,
    twin: () => handshakes(rng),
  };
}

function groups(rng) {
  const n = rng.int(6, 12), k = rng.int(2, 4);
  return {
    type: 'number',
    prompt: `Da una classe di ${n} studenti bisogna scegliere un gruppo di ${k} per rappresentare la scuola. Quanti gruppi diversi sono possibili?`,
    answer: comb(n, k),
    traps: [{ value: perm(n, k), msg: 'Nel gruppo non c\'è un ordine: dividi per i modi di ordinare i ' + k + ' scelti.' }],
    hint: `Le scelte ordinate sono $${Array.from({ length: k }, (_, i) => n - i).join('\\cdot ')}$; ogni gruppo compare ${fact(k)} volte.`,
    explain: `$$\\binom{${n}}{${k}} = \\dfrac{${Array.from({ length: k }, (_, i) => n - i).join('\\cdot ')}}{${k}!} = ${comb(n, k)}$$`,
    twin: () => groups(rng),
  };
}

function ordersMatter(rng) {
  const cases = [
    { t: 'Scegliere presidente e vice tra 10 candidati', c: 'disp' },
    { t: 'Scegliere 3 libri da portare in vacanza tra 10', c: 'comb' },
    { t: 'Creare una password di 4 lettere diverse', c: 'disp' },
    { t: 'Formare una squadra di 5 giocatori tra 12', c: 'comb' },
    { t: 'Assegnare i primi 3 posti di una classifica', c: 'disp' },
    { t: 'Scegliere 2 gusti di gelato su 8 per una coppetta', c: 'comb' },
  ];
  const c = rng.pick(cases);
  return {
    type: 'choice',
    prompt: `"${c.t}": l'ordine conta?`,
    options: [
      { label: 'Sì: disposizioni', correct: c.c === 'disp', why: c.c === 'disp' ? undefined : 'Scambiando gli elementi scelti il risultato non cambia: l\'ordine non conta.' },
      { label: 'No: combinazioni', correct: c.c === 'comb', why: c.c === 'comb' ? undefined : 'Scambiando due elementi si ottiene un risultato diverso: l\'ordine conta.' },
    ],
    fixedOrder: true,
    explain: c.c === 'disp' ? 'Scambiare due elementi produce un risultato diverso: sono disposizioni.' : 'Lo stesso gruppo in ordine diverso è sempre lo stesso gruppo: sono combinazioni.',
    twin: () => ordersMatter(rng),
  };
}

export default {
  id: 'combinatoria',
  area: 'dati',
  years: [4],
  mat: ['MAT_K4', 'MAT_C3'],
  ambito: 'Dati e previsioni',
  title: 'Calcolo combinatorio',
  summary: 'Contare senza contare: menù, podi, codici, gruppi.',
  glyph: 'n!',
  levels: [
    { name: 'Principio moltiplicativo', desc: 'Menù e codici' },
    { name: 'L\'ordine conta', desc: 'Disposizioni e permutazioni' },
    { name: 'L\'ordine non conta', desc: 'Combinazioni' },
  ],
  generate(rng, level) {
    const learn = { type: 'learn', title: 'Scelte in fila', body: 'Se una scelta si può fare in $a$ modi e la successiva in $b$ modi, insieme si fanno in $a\\cdot b$ modi. Tutto il calcolo combinatorio parte da qui.', fig: tree([['T', 'C'], ['T', 'C']]) };
    if (level === 1) return [learn, menu(rng), pin(rng), menu(rng), pin(rng), anagram(rng)];
    if (level === 2) return [learn, podium(rng), anagram(rng), ordersMatter(rng), podium(rng), pin(rng)];
    return [learn, handshakes(rng), groups(rng), ordersMatter(rng), groups(rng), handshakes(rng)];
  },
};

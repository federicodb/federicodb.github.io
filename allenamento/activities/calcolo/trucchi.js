// TECNICHE DI CALCOLO VELOCE: una sola fonte per la Quest (area "Calcolo veloce") e per la pagina del sito
// calcolo-mentale.html. Ogni tecnica ha: idea, algoritmo, generatore di esercizi da fare a mente (con lo
// svolgimento), caccia all'errore, dimostrazione passo per passo, identità verificate con nerdamer
// (tests/trucchi.test.mjs e, dal vivo, nella pagina del sito), limiti di validità.
//
// Formato delle identità: { lhs, rhs, vars } in sintassi nerdamer; si verifica expand(lhs - rhs) = 0.
// I nomi tra parentesi (Ekadhikena Purvena, Nikhilam…) vengono dal libro di Bharati Krishna Tirtha (1965):
// vedi la nota storica nella pagina del sito, il libro non è un testo vedico.

const g = (n) => {
  const s = String(Math.abs(n));
  const grouped = s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : s;
  return (n < 0 ? '-' : '') + grouped;
};
const sg = (d) => (d >= 0 ? `+${d}` : `${d}`);
const pct = (x) => String(x).replace('.', '{,}');

// ------------------------------------------------------------------ 1. dividi e sposta
const splitShift = {
  id: 'dividi-e-sposta',
  principio: 'scrittura posizionale e proprietà distributiva',
  titolo: 'Dividi e sposta',
  nome: 'Split & shift: un numero di due cifre per una cifra',
  anni: [1], mat: ['MAT_K1', 'MAT_A1'], prereq: [],
  idea: 'Moltiplica separatamente unità e decine; il riporto delle unità si sposta sulle decine.',
  passi: [
    'Dividi il numero in decine e unità: $AB = A\\,|\\,B$.',
    'Moltiplica le unità: $B\\times k$. La sua ultima cifra è l\'ultima cifra del risultato; la cifra delle decine è il riporto.',
    'Moltiplica le decine: $A\\times k$, e aggiungi il riporto.',
    'Scrivi le decine così ottenute seguite dall\'ultima cifra.',
  ],
  genera(rng) {
    const A = rng.int(2, 9), B = rng.int(2, 9), k = rng.int(3, 9);
    const Bk = B * k, q = Math.floor(Bk / 10), r = Bk % 10, Ak = A * k;
    return {
      q: `${10 * A + B}\\times ${k}`, cas: `${10 * A + B}*${k}`, risposta: (10 * A + B) * k,
      svolgimento: [`${B}\\times ${k} = ${Bk} \\;\\Rightarrow\\; \\text{scrivo } ${r},\\ \\text{riporto } ${q}`, `${A}\\times ${k} = ${Ak}`, `${Ak} + ${q} = ${Ak + q}`, `${10 * A + B}\\times ${k} = ${(10 * A + B) * k}`],
    };
  },
  errore(rng) {
    const { A, B, k } = rng.until(() => ({ A: rng.int(2, 9), B: rng.int(2, 9), k: rng.int(3, 9) }), (v) => v.B * v.k >= 10);
    const Bk = B * k, q = Math.floor(Bk / 10), r = Bk % 10, Ak = A * k;
    return {
      q: `${10 * A + B}\\times ${k}`,
      passi: [`$${B}\\times ${k} = ${Bk}$: scrivo ${r}, riporto ${q}`, `$${A}\\times ${k} = ${Ak}$`, `Risultato: $${Ak}$ seguito da ${r}, cioè $${Ak * 10 + r}$`],
      sbagliato: 2,
      perche: `Manca lo spostamento del riporto: le decine sono $${Ak} + ${q} = ${Ak + q}$, quindi il risultato è $${(10 * A + B) * k}$.`,
    };
  },
  dimostrazione: {
    premessa: 'Un numero di due cifre con decine $A$ e unità $B$ vale $10A + B$. Sia $k$ una cifra.',
    passi: [
      { tex: 'N\\cdot k = (10A + B)\\,k', perche: 'scrittura posizionale' },
      { tex: '= 10Ak + Bk', perche: 'proprietà distributiva' },
      { tex: '= 10Ak + (10q + r)', perche: 'le unità $Bk$ hanno decine $q$ (il riporto) e unità $r$' },
      { tex: '= 10\\,(Ak + q) + r', perche: 'si raccoglie 10: le decine sono $Ak + q$, le unità sono $r$' },
    ],
    conclusione: 'Lo "spostamento" del riporto è solo il raccoglimento di 10: le decine del risultato sono $Ak + q$.',
    verifica: [{ lhs: '(10*A+B)*k', rhs: '10*(A*k+q)+(B*k-10*q)', vars: ['A', 'B', 'k', 'q'], nota: 'con $r = Bk - 10q$' }],
  },
  limiti: 'Funziona per qualunque cifra $k$; con un moltiplicatore di due cifre si applica due volte (decine e unità di $k$) e si sommano i risultati.',
};

// ------------------------------------------------------------------ 2. quadrato del 5
const quadrato5 = {
  id: 'quadrato-del-5',
  principio: 'quadrato del binomio',
  titolo: 'Quadrati che finiscono per 5',
  nome: 'Ekadhikena Purvena, "uno più del precedente"',
  anni: [1, 2], mat: ['MAT_K1', 'MAT_A1'], prereq: ['prodotti-notevoli'],
  idea: 'Il quadrato di un numero che finisce per 5 è: (decine) × (decine + 1), seguito da 25.',
  passi: [
    'Togli il 5 finale: resta il numero $a$ (per $35$ è $3$, per $115$ è $11$).',
    'Moltiplica $a$ per il suo successivo: $a\\,(a+1)$.',
    'Scrivi $25$ in fondo.',
  ],
  genera(rng) {
    const a = rng.int(1, 9) + (rng.chance(0.25) ? 10 : 0);
    const n = 10 * a + 5;
    return {
      q: `${n}^2`, cas: `${n}^2`, risposta: n * n,
      svolgimento: [`a = ${a}`, `${a}\\times ${a + 1} = ${a * (a + 1)}`, `${a * (a + 1)}\\,|\\,25 \\;\\Rightarrow\\; ${n}^2 = ${g(n * n)}`],
    };
  },
  errore(rng) {
    const a = rng.int(2, 9), n = 10 * a + 5;
    return {
      q: `${n}^2`,
      passi: [`Tolgo il 5: resta $${a}$`, `$${a}\\times ${a} = ${a * a}$`, `Scrivo 25 in fondo: $${a * a}25$`],
      sbagliato: 1,
      perche: `Si moltiplica per il successivo, non per sé stesso: $${a}\\times ${a + 1} = ${a * (a + 1)}$, quindi $${n}^2 = ${g(n * n)}$.`,
    };
  },
  dimostrazione: {
    premessa: 'Un numero che finisce per 5 si scrive $N = 10a + 5$, con $a$ naturale.',
    passi: [
      { tex: '(10a + 5)^2 = 100a^2 + 2\\cdot 10a\\cdot 5 + 25', perche: 'quadrato del binomio' },
      { tex: '= 100a^2 + 100a + 25', perche: 'si calcola $2\\cdot 10a\\cdot 5$' },
      { tex: '= 100\\,a\\,(a + 1) + 25', perche: 'si raccoglie $100a$' },
    ],
    conclusione: 'Moltiplicare per 100 sposta $a(a+1)$ di due posti a sinistra: le ultime due cifre sono sempre 25.',
    verifica: [
      { lhs: '(10*a+5)^2', rhs: '100*a*(a+1)+25', vars: ['a'] },
      { lhs: '(10*a+b)*(10*a+10-b)', rhs: '100*a*(a+1)+b*(10-b)', vars: ['a', 'b'], nota: 'estensione: stesse decine, unità che sommano 10' },
    ],
  },
  limiti: 'Si generalizza: con le stesse decine e le unità che sommano 10 (es. $43\\times 47$) si ottiene $a(a+1)$ seguito dal prodotto delle unità su due cifre ($4\\cdot 5\\,|\\,21 = 2021$).',
};

// ------------------------------------------------------------------ 3. vicino a 100
const base100 = {
  id: 'vicino-a-100',
  principio: 'prodotto di due binomi con gli scarti dalla base',
  titolo: 'Numeri vicini a 100',
  nome: 'Calcolo con gli scarti dalla base (Nikhilam)',
  anni: [2, 3], mat: ['MAT_K1', 'MAT_A1'], prereq: ['monomi'],
  idea: 'Lavora con gli scarti da 100: somma incrociata a sinistra, prodotto degli scarti a destra.',
  passi: [
    'Calcola gli scarti da 100: $d_1 = N_1 - 100$ e $d_2 = N_2 - 100$.',
    'Parte sinistra: un numero più lo scarto dell\'altro, $N_1 + d_2$.',
    'Parte destra: il prodotto degli scarti $d_1 d_2$, scritto su due cifre.',
    'Risultato: $100\\cdot(\\text{sinistra}) + \\text{destra}$.',
  ],
  genera(rng) {
    const discordi = rng.chance(0.25);
    const d1 = rng.intNot(-9, 9), d2 = discordi ? -Math.sign(d1) * rng.int(1, 9) : Math.sign(d1) * rng.int(1, 9);
    const n1 = 100 + d1, n2 = 100 + d2, L = n1 + d2, R = d1 * d2;
    return {
      q: `${n1}\\times ${n2}`, cas: `${n1}*${n2}`, risposta: n1 * n2,
      svolgimento: [`d_1 = ${sg(d1)},\\quad d_2 = ${sg(d2)}`, `${n1} ${d2 >= 0 ? '+' : '-'} ${Math.abs(d2)} = ${L}`, `(${sg(d1)})\\cdot(${sg(d2)}) = ${sg(R)}`, R >= 0 ? `${L}\\,|\\,${String(R).padStart(2, '0')} = ${g(n1 * n2)}` : `${L}\\cdot 100 - ${-R} = ${g(n1 * n2)}`],
    };
  },
  errore(rng) {
    const d1 = rng.int(1, 3), d2 = rng.int(1, 3), n1 = 100 + d1, n2 = 100 + d2, L = n1 + d2;
    return {
      q: `${n1}\\times ${n2}`,
      passi: [`Scarti: $+${d1}$ e $+${d2}$`, `Sinistra: $${n1} + ${d2} = ${L}$`, `Destra: $${d1}\\cdot ${d2} = ${d1 * d2}$, quindi il risultato è $${L}${d1 * d2}$`],
      sbagliato: 2,
      perche: `La parte destra va scritta su due cifre: $0${d1 * d2}$. Il risultato è $${g(n1 * n2)}$.`,
    };
  },
  dimostrazione: {
    premessa: 'Si scrive ogni numero come base più scarto: $N_1 = 100 + d_1$ e $N_2 = 100 + d_2$.',
    passi: [
      { tex: 'N_1 N_2 = (100 + d_1)(100 + d_2)', perche: 'scrittura con gli scarti' },
      { tex: '= 10\\,000 + 100\\,d_1 + 100\\,d_2 + d_1 d_2', perche: 'prodotto di due binomi' },
      { tex: '= 100\\,(100 + d_1 + d_2) + d_1 d_2', perche: 'si raccoglie 100 dai primi tre termini' },
      { tex: '= 100\\,(N_1 + d_2) + d_1 d_2', perche: 'perché $100 + d_1 = N_1$' },
    ],
    conclusione: 'La "somma incrociata" $N_1 + d_2$ conta le centinaia; il prodotto degli scarti occupa le ultime due cifre.',
    verifica: [{ lhs: '(100+d1)*(100+d2)', rhs: '100*(100+d1+d2)+d1*d2', vars: ['d1', 'd2'] }],
  },
  limiti: 'Con scarti di segno opposto il prodotto $d_1d_2$ è negativo e si sottrae. Con base 1000 la parte destra va scritta su tre cifre; con scarti oltre 10 la destra "trabocca" e il riporto va sommato a sinistra.',
};

// ------------------------------------------------------------------ 4. somma per differenza
const differenzaQuadrati = {
  id: 'somma-per-differenza',
  principio: 'prodotto notevole somma per differenza',
  titolo: 'Simmetrici attorno a un numero tondo',
  nome: 'Somma per differenza: $48\\times 52 = 50^2 - 2^2$',
  anni: [1, 2], mat: ['MAT_K1', 'MAT_A1'], prereq: ['prodotti-notevoli'],
  idea: 'Due numeri alla stessa distanza da un numero tondo: quadrato del tondo meno quadrato della distanza.',
  passi: [
    'Trova il numero tondo che sta esattamente in mezzo: $m$.',
    'Trova la distanza $d$ di ciascun numero da $m$.',
    'Risultato: $m^2 - d^2$.',
  ],
  genera(rng) {
    const m = rng.pick([20, 30, 40, 50, 60, 70, 80, 90, 100]), d = rng.int(1, 4);
    return {
      q: `${m - d}\\times ${m + d}`, cas: `${m - d}*${m + d}`, risposta: (m - d) * (m + d),
      svolgimento: [`m = ${m},\\quad d = ${d}`, `${m}^2 - ${d}^2 = ${g(m * m)} - ${d * d}`, `= ${g(m * m - d * d)}`],
    };
  },
  errore(rng) {
    const m = rng.pick([30, 40, 50, 60, 70]), d = rng.int(2, 4);
    return {
      q: `${m - d}\\times ${m + d}`,
      passi: [`In mezzo c'è $${m}$, distanza $${d}$`, `$${m}^2 = ${g(m * m)}$`, `$${g(m * m)} + ${d * d} = ${g(m * m + d * d)}$`],
      sbagliato: 2,
      perche: `Il quadrato della distanza si sottrae: $${g(m * m)} - ${d * d} = ${g(m * m - d * d)}$.`,
    };
  },
  dimostrazione: {
    premessa: 'I due numeri sono $m - d$ e $m + d$.',
    passi: [
      { tex: '(m - d)(m + d) = m^2 + md - md - d^2', perche: 'prodotto di due binomi' },
      { tex: '= m^2 - d^2', perche: 'i termini $md$ si annullano' },
    ],
    conclusione: 'È il prodotto notevole "somma per differenza", letto al contrario: serve a calcolare.',
    verifica: [{ lhs: '(m-d)*(m+d)', rhs: 'm^2-d^2', vars: ['m', 'd'] }],
  },
  limiti: 'Se la somma dei due numeri è dispari non c\'è un intero esattamente in mezzo (es. $49\\times 52$): si può usare il mezzo $50{,}5$, ma conviene un altro trucco.',
};

// ------------------------------------------------------------------ 5. percentuali scambiate
const percentualiScambiate = {
  id: 'percentuali-scambiate',
  principio: 'proprietà commutativa della moltiplicazione',
  titolo: 'Percentuali che si scambiano',
  nome: 'L\'$x\\%$ di $y$ è uguale all\'$y\\%$ di $x$',
  anni: [1, 2], mat: ['MAT_K1', 'MAT_C2'], prereq: ['percentuali'],
  idea: 'Se una percentuale è scomoda, scambiala con il numero: 8% di 50 = 50% di 8 = 4.',
  passi: ['Guarda i due numeri: quale dei due è una percentuale comoda (10, 20, 25, 50…)?', 'Scambiali: l\'$x\\%$ di $y$ diventa l\'$y\\%$ di $x$.', 'Calcola la percentuale comoda.'],
  genera(rng) {
    const y = rng.pick([10, 20, 25, 50]);
    const x = rng.until(() => rng.pick([4, 6, 8, 12, 14, 16, 18, 24, 28, 32, 36, 44, 48]), (v) => Number.isInteger((v * y) / 10)); // al massimo un decimale: 8% di 10 = 0,8
    return {
      q: `${x}\\%\\ \\text{di}\\ ${y}`, cas: `${x}*${y}/100`, risposta: (x * y) / 100,
      svolgimento: [`${x}\\%\\ \\text{di}\\ ${y} = ${y}\\%\\ \\text{di}\\ ${x}`, `${y}\\%\\ \\text{di}\\ ${x} = ${pct((x * y) / 100)}`],
    };
  },
  errore(rng) {
    const x = rng.pick([8, 12, 16, 24]), y = 50;
    return {
      q: `${x}\\%\\ \\text{di}\\ ${y}`,
      passi: [`Scambio: $${x}\\%$ di $${y}$ = $${y}\\%$ di $${x}$`, `Il $${y}\\%$ è la metà`, `La metà di $${x}$ è $${x * 2}$`],
      sbagliato: 2,
      perche: `La metà di $${x}$ è $${x / 2}$, non il doppio.`,
    };
  },
  dimostrazione: {
    premessa: 'La percentuale $x\\%$ di $y$ vale $\\dfrac{x}{100}\\cdot y$.',
    passi: [
      { tex: '\\dfrac{x}{100}\\cdot y = \\dfrac{x\\,y}{100}', perche: 'definizione di percentuale' },
      { tex: '= \\dfrac{y}{100}\\cdot x', perche: 'proprietà commutativa della moltiplicazione' },
    ],
    conclusione: 'Il risultato dipende solo dal prodotto $x\\,y$: i due numeri hanno lo stesso ruolo.',
    verifica: [{ lhs: 'x/100*y', rhs: 'y/100*x', vars: ['x', 'y'] }],
  },
  limiti: 'Vale sempre. Conviene quando uno dei due numeri è "tondo" come percentuale (10, 20, 25, 50) e l\'altro no.',
};

// ------------------------------------------------------------------ 6. per 5 e per 25
const per25 = {
  id: 'per-5-e-25',
  principio: 'scrivere un fattore come frazione (25 = 100 : 4)',
  titolo: 'Per 5, per 25, per 50',
  nome: 'Moltiplicare passando da 10 o da 100',
  anni: [1], mat: ['MAT_K1', 'MAT_A1'], prereq: ['frazioni'],
  idea: '×5 = ×10 : 2;   ×25 = ×100 : 4;   ×50 = ×100 : 2.',
  passi: ['Riconosci il fattore: $5 = \\frac{10}{2}$, $25 = \\frac{100}{4}$, $50 = \\frac{100}{2}$.', 'Moltiplica per 10 o per 100 (aggiungi zeri).', 'Dividi per 2 o per 4 (metà, o metà della metà).'],
  genera(rng) {
    const f = rng.pick([5, 25, 50]);
    const n = f === 25 ? rng.int(3, 24) * 4 : f === 5 ? rng.int(12, 98) * 2 : rng.int(6, 49) * 2;
    const [big, div] = f === 5 ? [10, 2] : f === 25 ? [100, 4] : [100, 2];
    return {
      q: `${n}\\times ${f}`, cas: `${n}*${f}`, risposta: n * f,
      svolgimento: [`${f} = \\dfrac{${big}}{${div}}`, `${n}\\times ${big} = ${g(n * big)}`, `${g(n * big)} : ${div} = ${g(n * f)}`],
    };
  },
  errore(rng) {
    const n = rng.int(3, 24) * 4;
    return {
      q: `${n}\\times 25`,
      passi: [`$25 = 100 : 4$`, `$${n}\\times 100 = ${g(n * 100)}$`, `$${g(n * 100)} : 2 = ${g(n * 50)}$`],
      sbagliato: 2,
      perche: `Si divide per 4, non per 2: $${g(n * 100)} : 4 = ${g(n * 25)}$.`,
    };
  },
  dimostrazione: {
    premessa: 'Si riscrive il fattore come frazione con numeratore 10 o 100.',
    passi: [
      { tex: 'n\\cdot 25 = n\\cdot \\dfrac{100}{4}', perche: '$25 = 100 : 4$' },
      { tex: '= \\dfrac{n\\cdot 100}{4}', perche: 'si moltiplica il numeratore' },
    ],
    conclusione: 'Moltiplicare per 100 è facile (due zeri); dividere per 4 è metà della metà.',
    verifica: [{ lhs: 'n*25', rhs: 'n*100/4', vars: ['n'] }, { lhs: 'n*5', rhs: 'n*10/2', vars: ['n'] }],
  },
  limiti: 'Funziona per ogni $n$, perché $n\\cdot 100$ è sempre divisibile per 4: $37\\times 25 = 3700 : 4 = 925$. Se $n$ è multiplo di 4 conviene dividere prima: $36\\times 25 = 9\\times 100 = 900$.',
};

// ------------------------------------------------------------------ 7. raddoppia e dimezza
const raddoppiaDimezza = {
  id: 'raddoppia-e-dimezza',
  principio: 'moltiplicare per 1 = 2 : 2 (proprietà associativa)',
  titolo: 'Raddoppia e dimezza',
  nome: 'Il prodotto non cambia se un fattore raddoppia e l\'altro si dimezza',
  anni: [1], mat: ['MAT_K1', 'MAT_A1'], prereq: [],
  idea: 'Dimezza un fattore pari e raddoppia l\'altro finché il conto non diventa tondo: 16 × 35 = 8 × 70.',
  passi: ['Scegli il fattore pari da dimezzare.', 'Raddoppia l\'altro: cerca di farlo diventare tondo (5 → 10, 15 → 30, 25 → 50, 35 → 70…).', 'Ripeti se serve, poi calcola.'],
  genera(rng) {
    const b = rng.pick([15, 25, 35, 45, 5, 55, 65]);
    const a = rng.int(3, 14) * 2;
    return {
      q: `${a}\\times ${b}`, cas: `${a}*${b}`, risposta: a * b,
      svolgimento: [`${a}\\times ${b} = ${a / 2}\\times ${2 * b}`, `${a / 2}\\times ${2 * b} = ${g(a * b)}`],
    };
  },
  errore(rng) {
    const a = rng.int(3, 9) * 2, b = rng.pick([15, 25, 35, 45]);
    return {
      q: `${a}\\times ${b}`,
      passi: [`Dimezzo ${a}: $${a / 2}$`, `Dimezzo anche ${b}: $${b / 2}$`, `$${a / 2}\\times ${pct(b / 2)} = ${pct((a * b) / 4)}$`],
      sbagliato: 1,
      perche: `Se un fattore si dimezza, l'altro deve raddoppiare: $${a / 2}\\times ${2 * b} = ${g(a * b)}$.`,
    };
  },
  dimostrazione: {
    premessa: 'Siano $a$ e $b$ i due fattori, con $a$ pari.',
    passi: [
      { tex: 'a\\cdot b = \\dfrac{a}{2}\\cdot 2\\cdot b', perche: 'si moltiplica per $\\frac{2}{2} = 1$' },
      { tex: '= \\dfrac{a}{2}\\cdot (2b)', perche: 'proprietà associativa' },
    ],
    conclusione: 'Moltiplicare un fattore per 2 e dividere l\'altro per 2 è moltiplicare per 1: il prodotto non cambia.',
    verifica: [{ lhs: 'a*b', rhs: '(a/2)*(2*b)', vars: ['a', 'b'] }],
  },
  limiti: 'Vale con qualunque fattore $c$ al posto di 2 ($a\\cdot b = \\frac{a}{c}\\cdot cb$): con 3, $27\\times 4 = 9\\times 12$.',
};

// ------------------------------------------------------------------ 8. per 11
const per11 = {
  id: 'per-11',
  principio: '11 = 10 + 1 e proprietà distributiva',
  titolo: 'Per 11',
  nome: 'La somma delle cifre va in mezzo',
  anni: [1, 2], mat: ['MAT_K1', 'MAT_A1'], prereq: [],
  idea: 'Per moltiplicare per 11 un numero di due cifre, scrivi la loro somma in mezzo: 36 × 11 = 3|9|6.',
  passi: ['Scrivi la prima e l\'ultima cifra del numero, lasciando spazio in mezzo.', 'In mezzo metti la somma delle due cifre.', 'Se la somma è 10 o più, scrivi le unità e aggiungi 1 alla prima cifra.'],
  genera(rng) {
    const a = rng.int(1, 9), b = rng.int(1, 9), n = 10 * a + b, s = a + b;
    return {
      q: `${n}\\times 11`, cas: `${n}*11`, risposta: n * 11,
      svolgimento: s < 10 ? [`${a} + ${b} = ${s}`, `${a}\\,|\\,${s}\\,|\\,${b} = ${n * 11}`] : [`${a} + ${b} = ${s}\\quad(\\text{riporto } 1)`, `${a + 1}\\,|\\,${s - 10}\\,|\\,${b} = ${g(n * 11)}`],
    };
  },
  errore(rng) {
    const { a, b } = rng.until(() => ({ a: rng.int(4, 9), b: rng.int(4, 9) }), (v) => v.a + v.b >= 10);
    const s = a + b;
    return {
      q: `${10 * a + b}\\times 11`,
      passi: [`Prima e ultima cifra: $${a}$ e $${b}$`, `In mezzo la somma: $${a} + ${b} = ${s}$`, `Risultato: $${a}\\,${s}\\,${b} = ${a}${s}${b}$`],
      sbagliato: 2,
      perche: `La somma $${s}$ ha due cifre: si scrive ${s - 10} e si aggiunge 1 alla prima cifra. Il risultato è $${g((10 * a + b) * 11)}$.`,
    };
  },
  dimostrazione: {
    premessa: 'Il numero è $10a + b$; si moltiplica per $11 = 10 + 1$.',
    passi: [
      { tex: '(10a + b)\\cdot 11 = (10a + b)(10 + 1)', perche: '$11 = 10 + 1$' },
      { tex: '= 100a + 10b + 10a + b', perche: 'proprietà distributiva' },
      { tex: '= 100a + 10\\,(a + b) + b', perche: 'si raccoglie 10 tra i termini centrali' },
    ],
    conclusione: 'Centinaia $a$, decine $a + b$, unità $b$: se $a + b \\ge 10$ una centinaia "passa" a sinistra.',
    verifica: [{ lhs: '(10*a+b)*11', rhs: '100*a+10*(a+b)+b', vars: ['a', 'b'] }],
  },
  limiti: 'Con numeri di tre cifre $abc$ si scrive $a\\,|\\,a+b\\,|\\,b+c\\,|\\,c$, sempre gestendo i riporti da destra.',
};

// ------------------------------------------------------------------ 9. prova del 9
const digitRoot = (n) => (n === 0 ? 0 : 1 + ((n - 1) % 9));
const sumDigits = (n) => String(n).split('').reduce((s, c) => s + +c, 0);
const prova9 = {
  id: 'prova-del-9',
  principio: 'resto nella divisione per 9, perché 10 = 9 + 1',
  titolo: 'La prova del 9',
  nome: 'Controllare un calcolo con la somma delle cifre',
  anni: [2], mat: ['MAT_K1', 'MAT_C1'], prereq: [],
  idea: 'Ogni numero ha lo stesso resto nella divisione per 9 della somma delle sue cifre: si usa per scoprire errori.',
  passi: ['Riduci ogni fattore: somma le cifre, e ripeti finché resta una cifra (se resta 9, il resto nella divisione per 9 è 0).', 'Moltiplica le due cifre e riduci di nuovo.', 'Riduci il risultato che vuoi controllare: se non coincide, il calcolo è sicuramente sbagliato.'],
  genera(rng) {
    // niente multipli di 9: la cifra finale sarebbe ambigua (9, oppure 0 come resto)
    const n = rng.until(() => rng.int(1000, 9999), (x) => x % 9 !== 0);
    const steps = [];
    let x = n;
    while (x > 9) { const y = sumDigits(x); steps.push(`${String(x).split('').join(' + ')} = ${y}`); x = y; }
    return {
      testo: `Riduci $${n}$ a una sola cifra sommando le cifre (prova del 9).`,
      q: `${n}`, cas: `${digitRoot(n)}`, risposta: digitRoot(n),
      svolgimento: steps,
    };
  },
  errore(rng) {
    const a = rng.int(21, 98), b = rng.int(3, 9), giusto = a * b;
    const sbagliato = giusto + 9 * rng.int(1, 3);
    return {
      q: `${a}\\times ${b} = ${sbagliato}?`,
      passi: [`$${a}$ si riduce a $${digitRoot(a)}$, $${b}$ a $${digitRoot(b)}$`, `$${digitRoot(a)}\\cdot ${digitRoot(b)} = ${digitRoot(a) * digitRoot(b)}$, che si riduce a $${digitRoot(digitRoot(a) * digitRoot(b))}$`, `$${sbagliato}$ si riduce a $${digitRoot(sbagliato)}$: le cifre coincidono, quindi il calcolo è giusto`],
      sbagliato: 2,
      perche: `La prova del 9 trova solo gli errori che cambiano il resto nella divisione per 9. Qui l'errore è un multiplo di 9: $${a}\\times ${b} = ${giusto}$, non $${sbagliato}$. Se la prova "torna", il calcolo non è sicuramente giusto.`,
    };
  },
  dimostrazione: {
    premessa: 'Un numero di tre cifre $abc$ vale $100a + 10b + c$ (con più cifre il ragionamento è lo stesso).',
    passi: [
      { tex: '(100a + 10b + c) - (a + b + c) = 99a + 9b', perche: 'si toglie la somma delle cifre' },
      { tex: '= 9\\,(11a + b)', perche: 'si raccoglie 9' },
      { tex: '100a + 10b + c \\equiv a + b + c \\pmod 9', perche: 'la differenza è un multiplo di 9' },
    ],
    conclusione: 'Perché $10 = 9 + 1$: ogni potenza di 10 ha resto 1 nella divisione per 9. Il resto di un prodotto è il prodotto dei resti.',
    verifica: [{ lhs: '(100*a+10*b+c)-(a+b+c)', rhs: '9*(11*a+b)', vars: ['a', 'b', 'c'] }],
  },
  limiti: 'Se la prova non torna, c\'è sicuramente un errore. Se torna, non è garantito: gli errori che sono multipli di 9 (cifre scambiate come $54 \\leftrightarrow 45$, un 9 al posto di uno 0) passano inosservati.',
};

// ------------------------------------------------------------------ 10. ricarico e margine
const ricarico = {
  id: 'ricarico-e-margine',
  principio: 'somma di frazioni algebriche con denominatore comune',
  titolo: 'Guadagni e perdite in percentuale',
  nome: 'Prezzo di vendita e prezzo di costo (SP/CP)',
  anni: [2, 3], mat: ['MAT_K1', 'MAT_C2'], prereq: ['percentuali'],
  idea: 'Le percentuali di guadagno si calcolano sul costo; un +x% e un −x% sullo stesso prezzo di vendita fanno perdere x²/100 %.',
  passi: ['Rapporta tutto a 100: prezzo di vendita (SP) e prezzo di costo (CP).', 'Guadagno o perdita % $= \\left(\\dfrac{SP}{CP} - 1\\right)\\cdot 100$: si divide per il costo.', 'Due articoli venduti allo stesso prezzo, uno al $+x\\%$ e uno al $-x\\%$: in totale si perde il $\\frac{x^2}{100}\\%$.'],
  genera(rng) {
    if (rng.chance(0.5)) {
      const x = rng.pick([10, 20, 30, 40]);
      return {
        testo: `Un laboratorio vende due capi allo stesso prezzo: sul primo guadagna il ${x}%, sul secondo perde il ${x}%. In totale, che percentuale perde?`,
        q: `x = ${x}`, cas: `${x}^2/100`, risposta: (x * x) / 100, unit: '%',
        svolgimento: [`\\dfrac{x^2}{100} = \\dfrac{${x * x}}{100} = ${(x * x) / 100}\\%`],
      };
    }
    const [L, W, v] = rng.pick([[44, 30, -20], [28, 20, -10], [10, 25, 20], [36, 20, -20], [25, 40, 25], [20, 20, 0], [52, 40, -20], [4, 20, 20]]);
    const SP = 100 - L, CP = 100 - W;
    return {
      testo: `Un negozio dichiara uno sconto del ${L}%, ma la bilancia pesa il ${W}% in meno del dovuto. Qual è il vero guadagno (positivo) o perdita (negativo) del negozio, in percentuale sul costo?`,
      q: `SP = ${SP},\\ CP = ${CP}`, cas: `(${SP}/${CP}-1)*100`, risposta: v, unit: '%',
      svolgimento: [`SP = 100 - ${L} = ${SP},\\quad CP = 100 - ${W} = ${CP}`, `\\left(\\dfrac{${SP}}{${CP}} - 1\\right)\\cdot 100 = ${v}\\%`],
    };
  },
  errore() {
    return {
      q: '\\text{prezzo di vendita } 120\\ €,\\ \\text{costo } 100\\ €',
      passi: ['Guadagno: $120 - 100 = 20$ €', 'Percentuale: $\\dfrac{20}{120}\\cdot 100 \\approx 16{,}7\\%$', 'Il guadagno è circa il $16{,}7\\%$'],
      sbagliato: 1,
      perche: 'La percentuale di guadagno si calcola sul costo: $\\dfrac{20}{100}\\cdot 100 = 20\\%$.',
    };
  },
  dimostrazione: {
    premessa: 'Due articoli vengono venduti allo stesso prezzo $S$; sul primo si guadagna il $x\\%$, sul secondo si perde il $x\\%$. I costi sono $CP_1 = \\frac{100S}{100 + x}$ e $CP_2 = \\frac{100S}{100 - x}$.',
    passi: [
      { tex: 'CP_1 + CP_2 = 100S\\left(\\dfrac{1}{100 + x} + \\dfrac{1}{100 - x}\\right)', perche: 'somma dei costi' },
      { tex: '= \\dfrac{20\\,000\\,S}{10\\,000 - x^2}', perche: 'denominatore comune: $(100 + x)(100 - x) = 10\\,000 - x^2$' },
      { tex: '\\dfrac{SP}{CP} = \\dfrac{2S\\,(10\\,000 - x^2)}{20\\,000\\,S} = 1 - \\dfrac{x^2}{10\\,000}', perche: 'rapporto tra ricavo ($2S$) e costo' },
      { tex: '\\text{perdita} = \\dfrac{x^2}{10\\,000}\\cdot 100 = \\dfrac{x^2}{100}\\ \\%', perche: 'si esprime in percentuale' },
    ],
    conclusione: 'Il rapporto è sempre minore di 1 (perché $x^2 > 0$): si perde sempre, e la perdita dipende solo da $x$.',
    verifica: [{ lhs: '100/(100+x)+100/(100-x)', rhs: '20000/(10000-x^2)', vars: ['x'], razionale: true }],
  },
  limiti: 'Il +x% e il −x% sono calcolati sui rispettivi costi, che sono diversi: per questo non si compensano. Con sconti e bilance si confronta sempre ciò che si incassa (SP) con ciò che si cede davvero (CP).',
};

// ------------------------------------------------------------------ 11. lavorare insieme
const giorniExtra = {
  id: 'lavorare-insieme',
  principio: 'equazione fratta: le velocità di lavoro si sommano',
  titolo: 'Lavorare insieme',
  nome: 'Regola dei tempi in più: $t = \\sqrt{x\\,y}$',
  anni: [3, 4], mat: ['MAT_A3', 'MAT_C2'], prereq: ['radicali', 'proporzioni'],
  idea: 'Se da soli due impiegano x e y giorni in più che insieme, insieme impiegano √(xy) giorni.',
  passi: ['Leggi i tempi in più: da solo il primo impiega $t + x$, il secondo $t + y$.', 'Moltiplica: $x\\cdot y$.', 'La radice quadrata è il tempo insieme: $t = \\sqrt{xy}$.'],
  genera(rng) {
    const [x, y] = rng.pick([[9, 4], [25, 4], [16, 9], [18, 8], [27, 12], [49, 4], [36, 1], [20, 5], [50, 8], [12, 3], [45, 5], [32, 2]]);
    const t = Math.sqrt(x * y);
    const chi = rng.pick([['due stampanti 3D', 'stampano il lotto', 'ore'], ['due operai', 'finiscono l\'impianto', 'giorni'], ['due pompe', 'riempiono la vasca', 'ore'], ['due sarte', 'completano l\'ordine', 'giorni']]);
    return {
      testo: `Insieme, ${chi[0]} ${chi[1]} in $t$ ${chi[2]}. Da sola la prima impiegherebbe ${x} ${chi[2]} in più, la seconda ${y} ${chi[2]} in più. Quanto vale $t$?`,
      q: `x = ${x},\\ y = ${y}`, cas: `sqrt(${x}*${y})`, risposta: t, unit: chi[2],
      svolgimento: [`t = \\sqrt{${x}\\cdot ${y}} = \\sqrt{${x * y}} = ${t}`],
    };
  },
  errore() {
    return {
      q: 'x = 9,\\ y = 4',
      passi: ['Da soli: $t + 9$ e $t + 4$ giorni', 'Insieme il tempo è la media dei tempi in più: $\\frac{9 + 4}{2} = 6{,}5$', 'Insieme impiegano $6{,}5$ giorni'],
      sbagliato: 1,
      perche: 'Non è la media aritmetica ma la media geometrica: $t = \\sqrt{9\\cdot 4} = 6$ giorni.',
    };
  },
  dimostrazione: {
    premessa: 'Il lavoro totale vale 1. In un giorno insieme si fa $\\frac1t$ del lavoro; da soli $\\frac{1}{t + x}$ e $\\frac{1}{t + y}$.',
    passi: [
      { tex: '\\dfrac{1}{t + x} + \\dfrac{1}{t + y} = \\dfrac{1}{t}', perche: 'le velocità di lavoro si sommano' },
      { tex: 't\\,(t + y) + t\\,(t + x) = (t + x)(t + y)', perche: 'si moltiplica per $t(t+x)(t+y)$' },
      { tex: '2t^2 + tx + ty = t^2 + tx + ty + xy', perche: 'si sviluppano i prodotti' },
      { tex: 't^2 = xy \\;\\Rightarrow\\; t = \\sqrt{xy}', perche: 'si semplifica; $t > 0$' },
    ],
    conclusione: 'Il tempo insieme è la media geometrica dei tempi in più.',
    verifica: [{ lhs: 't*(t+y)+t*(t+x)-(t+x)*(t+y)', rhs: 't^2-x*y', vars: ['t', 'x', 'y'] }],
  },
  limiti: 'I tempi in più si misurano rispetto al tempo insieme, non tra loro. Con tre soggetti la formula non vale più.',
};

// ------------------------------------------------------------------ 12. costo uguale al guadagno %
const trinomio = {
  id: 'costo-uguale-guadagno',
  principio: 'scomposizione del trinomio di secondo grado',
  titolo: 'Costo uguale al guadagno percentuale',
  nome: 'Scomposizione istantanea di $x^2 + 100x - 100\\,SP$',
  anni: [3, 4], mat: ['MAT_A3', 'MAT_K1'], prereq: ['equazioni-2', 'scomposizioni'],
  idea: 'Scrivi il prezzo di vendita come prodotto di due numeri che differiscono di 10: il minore × 10 è il costo.',
  passi: ['Prendi il prezzo di vendita $SP$.', 'Scrivilo come $F_1\\cdot F_2$ con $F_1 - F_2 = 10$.', 'Il costo è $10\\cdot F_2$ (il fattore minore per 10).'],
  genera(rng) {
    const f = rng.int(2, 9), SP = f * (f + 10), CP = 10 * f;
    return {
      testo: `Un artigiano vende un oggetto a ${SP} €. La sua percentuale di guadagno sul costo è uguale al costo in euro. Quanto gli è costato l'oggetto?`,
      q: `SP = ${SP}`, cas: `10*${f}`, risposta: CP, unit: '€',
      svolgimento: [`${SP} = ${f + 10}\\cdot ${f},\\quad ${f + 10} - ${f} = 10`, `CP = 10\\cdot ${f} = ${CP}`, `\\text{verifica: } ${CP} + \\dfrac{${CP}^2}{100} = ${CP} + ${(CP * CP) / 100} = ${SP}`],
    };
  },
  errore() {
    return {
      q: 'SP = 144',
      passi: ['$144 = 18\\cdot 8$ e $18 - 8 = 10$', 'Il costo è il fattore maggiore per 10: $180$', 'Costo: $180$ €'],
      sbagliato: 1,
      perche: 'Il costo è il fattore minore per 10: $80$ €. Verifica: $80 + \\frac{80^2}{100} = 80 + 64 = 144$.',
    };
  },
  dimostrazione: {
    premessa: 'Sia $x$ il costo; il guadagno è il $x\\%$ di $x$, cioè $\\frac{x^2}{100}$.',
    passi: [
      { tex: 'SP = x + \\dfrac{x^2}{100}', perche: 'costo più guadagno' },
      { tex: 'x^2 + 100x - 100\\,SP = 0', perche: 'si moltiplica per 100 e si porta tutto a sinistra' },
      { tex: '(x + 10F_1)(x - 10F_2) = x^2 + 10(F_1 - F_2)\\,x - 100F_1F_2', perche: 'prodotto di due binomi' },
      { tex: 'F_1 - F_2 = 10,\\ F_1F_2 = SP \\;\\Rightarrow\\; x = 10F_2', perche: 'i coefficienti coincidono; si scarta la soluzione negativa' },
    ],
    conclusione: 'Il trucco è una scomposizione del trinomio: i due fattori di $SP$ con differenza 10 danno le due soluzioni.',
    verifica: [{ lhs: '(x+10*(f+10))*(x-10*f)', rhs: 'x^2+100*x-100*f*(f+10)', vars: ['x', 'f'] }],
  },
  limiti: 'Vale solo quando il guadagno percentuale è numericamente uguale al costo. Per un $SP$ qualsiasi due fattori con differenza 10 possono non esistere: allora si usa la formula risolutiva.',
};

// ------------------------------------------------------------------ 13. qualcosa resta costante
const moto = {
  id: 'cosa-resta-costante',
  principio: 'proporzionalità: la grandezza costante si semplifica',
  titolo: 'Cosa resta costante',
  nome: 'Problemi di moto: $d = v\\cdot t$ e le proporzioni',
  anni: [3, 4], mat: ['MAT_K2', 'MAT_C2'], prereq: ['proporzioni'],
  idea: 'Trova la grandezza che non cambia: allora le altre due sono in proporzione diretta o inversa.',
  passi: ['Chiediti: è costante la distanza, la velocità o il tempo?', 'Velocità costante: distanze proporzionali ai tempi. Distanza costante: velocità inversamente proporzionali ai tempi.', 'Ragiona per "parti" invece di impostare equazioni.'],
  genera(rng) {
    const [a, b] = rng.pick([[3, 5], [2, 3], [4, 5], [3, 4], [2, 5]]);
    const k = rng.int(2, 4), u = rng.pick([20, 30, 40, 50, 60]);
    const t1 = k * a, t2 = k * b, P = u * (b - a), L = u * a;
    return {
      testo: `Un treno a velocità costante supera un palo in ${t1} s e un ponte lungo ${P} m in ${t2} s. Quanto è lungo il treno?`,
      q: `t_1 = ${t1},\\ t_2 = ${t2},\\ P = ${P}`, cas: `${P}*${a}/(${b}-${a})`, risposta: L, unit: 'm',
      svolgimento: [`\\dfrac{L}{L + P} = \\dfrac{${t1}}{${t2}} = \\dfrac{${a}}{${b}}`, `L = ${a}\\ \\text{parti},\\ P = ${b - a}\\ \\text{parti} = ${P}\\ \\text{m}`, `1\\ \\text{parte} = ${u}\\ \\text{m} \\;\\Rightarrow\\; L = ${L}\\ \\text{m}`],
    };
  },
  errore() {
    return {
      q: '\\text{palo } 9\\ s,\\ \\text{ponte di } 240\\ m \\text{ in } 15\\ s',
      passi: ['Velocità costante: $\\frac{L}{L + 240} = \\frac{9}{15} = \\frac{3}{5}$', 'Il treno è 3 parti, il ponte è 5 parti', '$240 : 5 = 48$, treno $= 3\\cdot 48 = 144$ m'],
      sbagliato: 1,
      perche: 'Il ponte è la differenza: $5 - 3 = 2$ parti. $240 : 2 = 120$, treno $= 3\\cdot 120 = 360$ m.',
    };
  },
  dimostrazione: {
    premessa: 'A velocità costante $v$: per il palo il treno percorre la sua lunghezza $L$ in $t_1$; per il ponte percorre $L + P$ in $t_2$.',
    passi: [
      { tex: 'L = v\\,t_1,\\qquad L + P = v\\,t_2', perche: '$d = v\\cdot t$ due volte' },
      { tex: '\\dfrac{L}{L + P} = \\dfrac{v\\,t_1}{v\\,t_2} = \\dfrac{t_1}{t_2}', perche: '$v$ si semplifica perché è costante' },
      { tex: 'P = v\\,(t_2 - t_1)', perche: 'differenza delle due uguaglianze' },
    ],
    conclusione: 'Ciò che è costante si semplifica: resta una proporzione tra le altre grandezze.',
    verifica: [{ lhs: '(v*t1)/(v*t2)', rhs: 't1/t2', vars: ['v', 't1', 't2'], razionale: true }, { lhs: '(v*t2)-(v*t1)', rhs: 'v*(t2-t1)', vars: ['v', 't1', 't2'] }],
  },
  limiti: 'Serve che la grandezza "costante" lo sia davvero (velocità uniforme, stesso percorso). Con accelerazioni le proporzioni non valgono più.',
};

// ------------------------------------------------------------------ 14. triangolo di Pingala-Pascal
const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const meru = {
  id: 'triangolo-dei-coefficienti',
  principio: 'binomio di Newton',
  titolo: 'Il triangolo dei coefficienti',
  nome: 'Meru Prastara (Halayudha, X sec.), triangolo di Tartaglia-Pascal',
  anni: [4, 5], mat: ['MAT_K4', 'MAT_C3'], prereq: ['combinatoria'],
  idea: 'Ogni numero è la somma dei due sopra; la riga n somma a 2ⁿ e contiene i coefficienti di (a + b)ⁿ.',
  passi: ['La riga 0 è $1$; ogni riga inizia e finisce con $1$.', 'Ogni numero interno è la somma dei due che ha sopra.', 'La somma della riga $n$ è $2^n$; il $k$-esimo numero è $\\binom{n}{k}$.'],
  genera(rng) {
    if (rng.chance(0.5)) {
      const n = rng.int(3, 8);
      return {
        testo: `Quanto vale la somma dei numeri della riga ${n} del triangolo (la riga che inizia con 1, ${n}, …)?`,
        q: `\\sum_k \\binom{${n}}{k}`, cas: `2^${n}`, risposta: 2 ** n,
        svolgimento: [`${Array.from({ length: n + 1 }, (_, k) => binom(n, k)).join(' + ')} = 2^{${n}} = ${2 ** n}`],
      };
    }
    const n = rng.int(4, 8), k = rng.int(2, n - 2);
    return {
      testo: `Quanto vale $\\binom{${n}}{${k}}$? (Pensa alla riga ${n} del triangolo, posizione ${k} partendo da 0.)`,
      q: `\\binom{${n}}{${k}}`, cas: `${binom(n, k)}`, risposta: binom(n, k),
      svolgimento: [`\\binom{${n}}{${k}} = \\binom{${n - 1}}{${k - 1}} + \\binom{${n - 1}}{${k}} = ${binom(n - 1, k - 1)} + ${binom(n - 1, k)} = ${binom(n, k)}`],
    };
  },
  errore() {
    return {
      q: '\\text{riga } 5',
      passi: ['La riga 4 è $1\\ 4\\ 6\\ 4\\ 1$', 'La riga 5 è $1\\ 5\\ 10\\ 10\\ 5\\ 1$', 'La sua somma è $5^2 = 25$'],
      sbagliato: 2,
      perche: 'La somma della riga $n$ è $2^n$: $1 + 5 + 10 + 10 + 5 + 1 = 32 = 2^5$.',
    };
  },
  dimostrazione: {
    premessa: 'Il numero in riga $n$, posto $k$ è $\\binom{n}{k}$, il coefficiente di $a^{n-k}b^k$ in $(a + b)^n$.',
    passi: [
      { tex: '(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k}\\, a^{n-k}\\, b^{k}', perche: 'binomio di Newton' },
      { tex: '2^n = (1 + 1)^n = \\sum_{k=0}^{n} \\binom{n}{k}', perche: 'si pone $a = b = 1$' },
      { tex: '\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}', perche: 'regola di costruzione: si sceglie o no un elemento fissato' },
    ],
    conclusione: 'La regola "somma dei due sopra" e la somma di riga $2^n$ discendono dal binomio di Newton.',
    verifica: [{ lhs: '(a+b)^4', rhs: 'a^4+4*a^3*b+6*a^2*b^2+4*a*b^3+b^4', vars: ['a', 'b'] }, { lhs: '(1+x)^5', rhs: '1+5*x+10*x^2+10*x^3+5*x^4+x^5', vars: ['x'] }],
  },
  limiti: 'Le somme lungo le diagonali "basse" danno la successione $1, 1, 2, 3, 5, 8, \\dots$ (Virahanka, poi Fibonacci). Il triangolo era noto anche in Cina (Yang Hui, XIII sec.), in Persia e in Italia (Tartaglia) prima di Pascal.',
};

export const TRUCCHI = [splitShift, per11, per25, raddoppiaDimezza, quadrato5, differenzaQuadrati, percentualiScambiate, base100, prova9, ricarico, giorniExtra, trinomio, moto, meru];
export const TRUCCHI_BY_ID = Object.fromEntries(TRUCCHI.map((t) => [t.id, t]));
export { binom, digitRoot };

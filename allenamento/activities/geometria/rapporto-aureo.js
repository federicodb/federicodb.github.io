import { perClasse } from '../contesti.js';
import { tx } from '../../js/engine/helpers.js';
import { polygon, table } from '../../js/gfx/svg.js';
import { FIB, seq, start, list } from '../numeri/fibonacci.js';

const PHI = (1 + Math.sqrt(5)) / 2;

// ---------------------------------------------------------------- livello 1: il numero φ

/** I rapporti tra numeri consecutivi si avvicinano a φ, saltando sopra e sotto */
function ratioChoice(rng) {
  // dalla terza: anche partendo da due numeri qualunque si arriva allo stesso valore
  const s = perClasse({ 1: () => FIB.slice(0, 8), 3: () => seq(...start(rng), 8) })();
  const righe = s.slice(1).map((v, i) => [`$${v} : ${s[i]}$`, `$${tx(v / s[i], 3)}$`]).slice(1);
  return {
    type: 'choice',
    fig: table(['Rapporto', 'Valore'], righe),
    prompt: `Divido ogni numero di $${list(s)}$ per quello prima. Come si comportano i rapporti?`,
    options: [
      { label: 'Si avvicinano a un numero vicino a 1,62, saltando un po\' sopra e un po\' sotto', correct: true },
      { label: 'Crescono sempre', why: 'Guarda la colonna dei valori: salgono e scendono.' },
      { label: 'Diminuiscono sempre', why: 'Guarda la colonna dei valori: salgono e scendono.' },
      { label: 'Si avvicinano a 2', why: 'Gli ultimi valori restano vicini a 1,62, lontani da 2.' },
    ],
    explain: 'I rapporti si avvicinano sempre di più a $\\varphi = \\dfrac{1+\\sqrt5}{2} \\approx 1{,}618$, il <b>rapporto aureo</b>, una volta per eccesso e una per difetto. Succede qualunque siano i due numeri di partenza.',
    twin: () => ratioChoice(rng),
  };
}

function ratioNumber(rng) {
  const [num, den] = rng.pick([[3, 2], [8, 5], [13, 8]]);
  return {
    type: 'number', decimals: 3,
    prompt: `Quanto fa $${num} : ${den}$? Scrivi il risultato con la virgola.`,
    answer: num / den,
    hint: den === 8 ? `$${num} : 8$: metà di metà di metà. Oppure $1/8 = 0{,}125$.` : `$${num} : ${den}$: $1/${den} = ${tx(1 / den, 3)}$.`,
    explain: `$$${num} : ${den} = ${tx(num / den, 3)}$$ È già vicino a $\\varphi \\approx 1{,}618$: più avanti si va nella successione, più ci si avvicina.`,
    cas: { eval: `${num}/${den}` },
    twin: () => ratioNumber(rng),
  };
}

function placeRatio(rng) {
  const [label, tex, v] = rng.pick([['φ', '\\varphi', PHI], ['5/3', '\\dfrac{5}{3}', 5 / 3], ['8/5', '\\dfrac{8}{5}', 1.6], ['13/8', '\\dfrac{13}{8}', 13 / 8]]);
  return {
    type: 'place',
    prompt: `Dove si trova $${tex}$ sulla retta?`,
    min: 1, max: 2, snap: 0.01, tol: 0.06,
    ticks: [{ v: 1, label: '1' }, { v: 1.5, major: false }, { v: 2, label: '2' }],
    answer: v, answerLabel: `${label} ≈ ${tx(v, 3).replace('{,}', ',')}`,
    label: `Posizione di ${label}`,
    hint: 'Il segno piccolo è 1,5. Il valore è un po\' più grande.',
    explain: `$${tex} \\approx ${tx(v, 3)}$: poco oltre la metà tra 1 e 2.`,
    twin: () => placeRatio(rng),
  };
}

/** φ² = φ + 1 e 1/φ = φ − 1: le cifre dopo la virgola restano le stesse */
function phiSame(rng) {
  const quadrato = rng.chance(0.5);
  return {
    type: 'number', decimals: 3,
    prompt: quadrato
      ? 'Sapendo che $\\varphi \\approx 1{,}618$ e che $\\varphi^2 = \\varphi + 1$, quanto vale $\\varphi^2$, senza moltiplicare?'
      : 'Sapendo che $\\varphi \\approx 1{,}618$ e che $\\dfrac{1}{\\varphi} = \\varphi - 1$, quanto vale $\\dfrac{1}{\\varphi}$, senza dividere?',
    answer: quadrato ? PHI + 1 : PHI - 1,
    traps: [{ value: quadrato ? 3.236 : 0.809, msg: quadrato ? 'Questo è il doppio di φ: al quadrato si aggiunge 1.' : 'Questa è la metà di φ: si toglie 1.' }],
    hint: quadrato ? 'Aggiungi 1.' : 'Togli 1.',
    explain: quadrato
      ? '$$\\varphi^2 = \\varphi + 1 \\approx 1{,}618 + 1 = 2{,}618$$ Le cifre dopo la virgola non cambiano: $\\varphi$ è l\'unico numero positivo che, elevato al quadrato, aumenta esattamente di 1.'
      : '$$\\frac{1}{\\varphi} = \\varphi - 1 \\approx 0{,}618$$ Le cifre dopo la virgola non cambiano: è l\'unico numero positivo con questa proprietà.',
    cas: { eval: quadrato ? '((1+sqrt(5))/2)^2' : '1/((1+sqrt(5))/2)' },
    twin: () => phiSame(rng),
  };
}

function tfPhi(rng) {
  const tutte = [
    { text: '$\\varphi^2 = \\varphi + 1$', value: true },
    { text: '$\\dfrac{1}{\\varphi} = \\varphi - 1$', value: true },
    { text: '$\\varphi$ si può scrivere come frazione di due numeri interi', value: false },
    { text: '$\\dfrac{13}{8}$ è esattamente uguale a $\\varphi$', value: false },
    { text: '$\\varphi$ è compreso tra $1{,}6$ e $1{,}7$', value: true },
  ];
  return {
    type: 'truefalse',
    prompt: 'Il rapporto aureo $\\varphi = \\dfrac{1+\\sqrt5}{2} \\approx 1{,}618$:',
    statements: rng.shuffle(tutte).slice(0, 4),
    explain: '$\\varphi$ è la soluzione positiva di $x^2 = x + 1$; dividendo per $\\varphi$ si ottiene $\\varphi = 1 + \\dfrac{1}{\\varphi}$. Contiene $\\sqrt5$, quindi è irrazionale: $\\dfrac{13}{8} = 1{,}625$ ci va vicino, ma nessuna frazione lo raggiunge.',
    twin: () => tfPhi(rng),
  };
}

// ---------------------------------------------------------------- livello 2: nella natura

/** Fillotassi: le spirali di semi e squame si contano con due numeri di Fibonacci consecutivi */
function spiralsChoice(rng) {
  const [cosa, a, b] = rng.pick([['un girasole', 34, 55], ['un girasole', 55, 89], ['una pigna', 8, 13], ['un ananas', 8, 13]]);
  const k = Math.round(a * 0.9);
  return {
    type: 'choice',
    prompt: `In ${cosa} si contano le spirali di ${cosa === 'una pigna' || cosa === 'un ananas' ? 'squame' : 'semi'} che girano in senso orario e quelle in senso antiorario. Quale coppia di numeri si trova di solito?`,
    options: [
      { label: `${a} e ${b}`, correct: true },
      { label: `${k} e ${Math.round(k * 1.6)}`, why: `Il rapporto è quasi lo stesso, ma ${k} e ${Math.round(k * 1.6)} non sono numeri di Fibonacci.` },
      { label: `${a} e ${2 * a}`, why: 'Uno è il doppio dell\'altro: non sono due numeri di Fibonacci vicini.' },
      { label: `${a} e ${a}`, why: 'I due versi hanno quasi sempre numeri diversi.' },
    ],
    explain: `Di solito sono due numeri di Fibonacci consecutivi, come $${a}$ e $${b}$. Succede perché ogni nuovo seme nasce ruotato di circa $137{,}5°$ rispetto al precedente: così i semi riempiono lo spazio senza lasciare buchi.`,
    twin: () => spiralsChoice(rng),
  };
}

/** Angolo aureo: ogni foglia ruota di circa 137,5° rispetto alla precedente */
function goldenAngle(rng) {
  // prima: dopo due foglie (si resta sotto il giro); dalla terza: dopo tre, togliendo il giro completo
  const n = perClasse({ 1: 2, 3: 3 });
  const tot = 137.5 * n, ans = tot % 360;
  return {
    type: 'number', unit: '°', decimals: 1,
    prompt: `Su un ramo ogni foglia spunta ruotata di $137{,}5°$ rispetto a quella prima. Di quanti gradi è ruotata la foglia ${n === 2 ? 'due posti' : 'tre posti'} più in alto rispetto alla prima?${n === 3 ? ' (Togli i giri completi: rispondi con un angolo minore di $360°$.)' : ''}`,
    answer: ans,
    traps: n === 3 ? [{ value: tot, msg: 'Hai superato il giro completo: togli 360°.' }] : [{ value: 137.5, msg: 'Questa è solo la prima rotazione: le foglie sono due.' }],
    hint: n === 2 ? '$137{,}5 + 137{,}5$: prima $137 + 137$, poi i due mezzi.' : `$137{,}5\\cdot 3 = ${tx(tot, 1)}$, poi togli $360$.`,
    explain: n === 2
      ? '$$137{,}5° \\cdot 2 = 275°$$ Nessuna foglia finisce esattamente sopra un\'altra: $137{,}5°$ è l\'<b>angolo aureo</b>, $\\dfrac{360°}{\\varphi^2}$, e così ogni foglia prende luce.'
      : `$$137{,}5° \\cdot 3 = ${tx(tot, 1)}° \\quad\\Rightarrow\\quad ${tx(tot, 1)}° - 360° = ${tx(ans, 1)}°$$ Nessuna foglia finisce esattamente sopra un'altra: $137{,}5°$ è l'<b>angolo aureo</b>, $\\dfrac{360°}{\\varphi^2}$, e così ogni foglia prende luce.`,
    cas: { eval: n === 2 ? '137.5*2' : '137.5*3-360' },
    twin: () => goldenAngle(rng),
  };
}

/** Vero o leggenda: φ in natura c'è, ma non dappertutto */
function tfNature(rng) {
  const tutte = [
    { text: 'Nel girasole le spirali dei due versi sono di solito due numeri di Fibonacci consecutivi', value: true },
    { text: 'Le foglie ruotano di circa $137{,}5°$ una dall\'altra, così non si coprono del tutto', value: true },
    { text: 'Molti fiori hanno 3, 5 o 8 petali, ma esistono anche fiori con 4 o 6 petali', value: true },
    { text: 'La conchiglia del nautilo è una spirale aurea perfetta', value: false },
    { text: 'Tutte le piante seguono i numeri di Fibonacci', value: false },
    { text: 'Le proporzioni del corpo umano sono esattamente auree', value: false },
  ];
  return {
    type: 'truefalse',
    prompt: 'Vero o leggenda? Il rapporto aureo nella natura:',
    statements: rng.shuffle(tutte).slice(0, 4),
    explain: 'Nelle piante φ c\'è davvero: semi, squame e foglie crescono ruotando dell\'angolo aureo. Ma è una tendenza, non una legge: molte piante fanno diversamente. Il nautilo è una spirale, ma misurata davvero non è aurea; i corpi umani variano troppo per avere un rapporto esatto.',
    twin: () => tfNature(rng),
  };
}

// ---------------------------------------------------------------- livello 3: progettare con φ

/** Rettangolo aureo: lato lungo ≈ 1,6 × lato corto */
function goldenRect(rng) {
  const corto = rng.pick([5, 10, 15, 20, 25, 30]), lungo = corto * 1.6;
  const inverso = perClasse({ 1: false, 3: rng.chance(0.5) });
  return {
    type: 'number', unit: 'cm',
    prompt: inverso
      ? `Un grafico disegna un riquadro con le proporzioni del rettangolo aureo. Il lato lungo misura ${lungo} cm. Quanto misura il lato corto? (Usa $\\varphi \\approx 1{,}6$.)`
      : `Un grafico disegna un riquadro con le proporzioni del rettangolo aureo. Il lato corto misura ${corto} cm. Quanto misura il lato lungo? (Usa $\\varphi \\approx 1{,}6$.)`,
    answer: inverso ? corto : lungo,
    traps: inverso ? [{ value: lungo / 2, msg: 'Non è la metà: si divide per 1,6.' }] : [{ value: corto * 2, msg: 'Non è il doppio: si moltiplica per 1,6.' }],
    hint: inverso ? `Quale numero, per 1,6, fa ${lungo}? Prova con i multipli di 5.` : `${corto} per 1,6: ${corto} più ${corto} per 0,6.`,
    explain: inverso ? `$$${lungo} : 1{,}6 = ${corto}\\ \\text{cm}$$` : `$$${corto}\\cdot 1{,}6 = ${corto} + ${tx(corto * 0.6)} = ${lungo}\\ \\text{cm}$$`,
    cas: { eval: inverso ? `${lungo}/1.6` : `${corto}*1.6` },
    twin: () => goldenRect(rng),
  };
}

function closestGolden(rng) {
  const s = rng.pick([5, 10, 20]);
  const r = (k) => `${s} × ${Math.round(s * k)}`;
  return {
    type: 'choice',
    prompt: 'Quale di questi rettangoli (misure in cm) è più vicino a un rettangolo aureo?',
    options: [
      { label: r(1.6), correct: true },
      { label: r(1.4), why: 'Rapporto 1,4: è quasi il formato dei fogli A4, che ha i lati in rapporto $\\sqrt2 \\approx 1{,}41$.' },
      { label: r(2), why: 'Rapporto 2: sono due quadrati affiancati.' },
      { label: r(1.2), why: 'Rapporto 1,2: è troppo vicino a un quadrato.' },
    ],
    hint: 'Dividi il lato lungo per il lato corto e confronta con 1,618.',
    explain: `$${Math.round(s * 1.6)} : ${s} = 1{,}6$, il più vicino a $\\varphi \\approx 1{,}618$. Un rettangolo aureo ha una proprietà da progettista: se ne togli un quadrato, quello che resta è ancora un rettangolo aureo, più piccolo.`,
    twin: () => closestGolden(rng),
  };
}

/** Il Modulor di Le Corbusier (1948): misure del corpo che seguono la regola di Fibonacci */
function modulor(rng) {
  const rossa = [16, 27, 43, 70, 113, 183, 296];
  const i = rng.int(0, 2);
  const shown = rossa.slice(i, i + 4), ans = rossa[i + 4];
  return {
    type: 'number', unit: 'cm',
    prompt: `Nel <i>Modulor</i> l'architetto Le Corbusier ricava le misure di porte, mobili e stanze dal corpo umano. Ogni misura è la somma delle due precedenti: $$${list(shown)},\\ ?$$ Qual è la misura successiva?`,
    answer: ans,
    traps: [{ value: 2 * shown[3] - shown[2], msg: 'Non si aggiunge sempre la stessa quantità: si sommano le ultime due misure.' }],
    hint: `$${shown[2]} + ${shown[3]}$.`,
    explain: `$$${shown[2]} + ${shown[3]} = ${ans}\\ \\text{cm}$$ Nella "serie rossa" del Modulor $183$ cm è l'altezza di un uomo e $113$ cm l'altezza del suo ombelico: $183 : 113 \\approx 1{,}62$. Le Corbusier ne fece un criterio di progetto, per esempio nell'Unité d'habitation di Marsiglia.`,
    cas: { eval: `${shown[2]}+${shown[3]}` },
    twin: () => modulor(rng),
  };
}

/** Disegnare un rettangolo aureo con il cursore: togliendo il quadrato resta un rettangolo simile */
function sliderGolden(rng) {
  const s = rng.pick([5, 10, 15]), ans = s * 1.6;
  return {
    type: 'slider',
    prompt: `Il lato corto misura ${s} cm. Sposta il cursore per avere un rettangolo aureo (usa $\\varphi \\approx 1{,}6$).`,
    min: s, max: 3 * s, step: 0.5, start: 2.5 * s, answer: ans, tol: 0.5,
    label: 'Lato lungo', decimals: 1, unit: 'cm',
    scene: (v) => polygon({ pts: [[0, 0], [v, 0], [v, s], [0, s]], extra: [{ seg: [[s, 0], [s, s]], dash: true }], sides: [`${String(v).replace('.', ',')} cm`, `${s} cm`, '', ''], alt: `Rettangolo ${s} per ${v} con il quadrato di lato ${s} tratteggiato` }),
    why: (v) => (v > ans ? 'Troppo lungo: il rapporto supera 1,6.' : 'Troppo corto: il rapporto è sotto 1,6.'),
    hint: `$${s}\\cdot 1{,}6$.`,
    explain: `$$${s}\\cdot 1{,}6 = ${tx(ans, 1)}\\ \\text{cm}$$ La parte a destra del tratteggio misura $${tx(ans - s, 1)} \\times ${s}$: ancora quasi un rettangolo aureo ($${s} : ${tx(ans - s, 1)} \\approx ${tx(s / (ans - s), 2)}$).`,
    twin: () => sliderGolden(rng),
  };
}

/** Vero o leggenda: φ in arte, architettura e oggetti di tutti i giorni */
function tfDesign(rng) {
  const tutte = [
    { text: 'Il foglio A4 è un rettangolo aureo', value: false },
    { text: 'Le Corbusier ha costruito il Modulor sul rapporto aureo', value: true },
    { text: 'È dimostrato che il Partenone fu progettato con il rapporto aureo', value: false },
    { text: 'Un rettangolo $8 \\times 13$ è quasi aureo', value: true },
    { text: 'La <i>Divina proporzione</i> di Luca Pacioli (1509) fu illustrata da Leonardo da Vinci', value: true },
  ];
  return {
    type: 'truefalse',
    prompt: 'Vero o leggenda? Il rapporto aureo nel progetto:',
    statements: rng.shuffle(tutte).slice(0, 4),
    explain: 'L\'A4 ha i lati in rapporto $\\sqrt2 \\approx 1{,}41$, scelto perché piegato a metà dà ancora la stessa forma. Le Corbusier e Pacioli hanno usato φ di proposito. Per il Partenone non ci sono prove: dipende da quali punti si scelgono per misurare, e cercando bene si trova "φ" quasi dappertutto.',
    twin: () => tfDesign(rng),
  };
}

export default {
  id: 'rapporto-aureo',
  area: 'geometria',
  years: [1, 2],
  mat: ['MAT_K3', 'MAT_C4'],
  ambito: 'Spazio e figure',
  title: 'Rapporto aureo e sezione aurea',
  summary: 'Il numero φ nelle piante, nei progetti e nelle leggende.',
  glyph: 'φ',
  levels: [
    { name: 'Il numero φ', desc: 'Rapporti tra numeri di Fibonacci' },
    { name: 'Nella natura', desc: 'Girasoli, pigne e angolo aureo' },
    { name: 'Progettare con φ', desc: 'Rettangoli aurei, Modulor, vero o leggenda' },
  ],
  generate(rng, level) {
    if (level === 1) return [{ type: 'learn', title: 'Il numero aureo', body: 'Dividendo un numero di Fibonacci per quello prima: $8 : 5 = 1{,}6$, $13 : 8 = 1{,}625$, $21 : 13 \\approx 1{,}615$… I rapporti si avvicinano a $$\\varphi = \\frac{1+\\sqrt5}{2} \\approx 1{,}618$$' }, ratioChoice(rng), ratioNumber(rng), placeRatio(rng), phiSame(rng), tfPhi(rng)];
    if (level === 2) return [{ type: 'learn', title: 'Piante che contano', body: 'Ogni nuovo seme, squama o foglia nasce ruotato di circa $137{,}5°$ rispetto al precedente: è l\'<b>angolo aureo</b>, $\\dfrac{360°}{\\varphi^2}$. Per questo nei girasoli e nelle pigne si contano spirali in numero di Fibonacci. Attenzione però alle leggende: non tutto ciò che è a spirale è aureo.' }, spiralsChoice(rng), goldenAngle(rng), tfNature(rng), goldenAngle(rng), spiralsChoice(rng)];
    return [{ type: 'learn', title: 'Un criterio di progetto', body: 'Un rettangolo è <b>aureo</b> se il lato lungo è circa $1{,}618$ volte il corto. Luca Pacioli, nato a Sansepolcro, ne scrisse nel 1509 nella <i>Divina proporzione</i>; nel Novecento Le Corbusier ne fece un sistema di misure per l\'architettura. Ma tante "prove" famose sono leggende: un buon progettista misura prima di crederci.' }, closestGolden(rng), goldenRect(rng), modulor(rng), sliderGolden(rng), tfDesign(rng)];
  },
};

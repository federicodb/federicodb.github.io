// LIVELLI DI ASTROMATH — una costellazione per livello, nell'ordine del curricolo della Quest
// (allenamento/activities/catalogo.js: aree, anni consigliati e PREREQ).
// Ogni livello prende le domande dai generatori della Quest: stessa fonte, stessi numeri "a mente",
// stessi errori tipici (traps), stessa difficoltà per classe (perClasse in contesti.js).
//
// stelle: 6 stelle per livello. La stella i usa il livello Quest LIVELLO_QUEST[i] (1, 1, 2, 2, 3, 3)
// e le attività del livello a rotazione. forma: posizioni delle stelle in [-1, 1] × [0, 1]
// (il mondo le scala), archi: le linee che si accendono quando entrambe le stelle sono accese.
// creatura: chiave del disegno in creature.js. correnti: grafici di funzione su cui si fa surf.

export const STELLE_PER_LIVELLO = 6;
export const LIVELLO_QUEST = [1, 1, 2, 2, 3, 3];

/** Percorso del modulo Quest di un'attività, relativo a questo file */
const Q = (p) => `../../../allenamento/activities/${p}.js`;

export const ATTIVITA = {
  'numeri-relativi': Q('numeri/numeri-relativi'),
  frazioni: Q('numeri/frazioni'),
  potenze: Q('numeri/potenze'),
  percentuali: Q('numeri/percentuali'),
  proporzioni: Q('numeri/proporzioni'),
  'notazione-scientifica': Q('numeri/notazione-scientifica'),
  monomi: Q('polinomi/monomi'),
  'prodotti-notevoli': Q('polinomi/prodotti-notevoli'),
  scomposizioni: Q('polinomi/scomposizioni'),
  'equazioni-1': Q('equazioni/equazioni-primo-grado'),
  'equazioni-1-speciali': Q('equazioni/equazioni-primo-grado-speciali'),
  'disequazioni-1': Q('equazioni/disequazioni-primo-grado'),
  'funzioni-lineari': Q('rette/funzioni-lineari'),
  'retta-pendenza': Q('rette/retta-pendenza'),
  'aree-perimetri': Q('geometria/aree-perimetri'),
  pitagora: Q('geometria/pitagora'),
  similitudine: Q('geometria/similitudine'),
  solidi: Q('geometria/solidi'),
  statistica: Q('dati/statistica'),
  probabilita: Q('dati/probabilita'),
  radicali: Q('numeri/radicali'),
  'equazioni-2': Q('equazioni/equazioni-secondo-grado'),
  'sistemi-lineari': Q('sistemi/sistemi-lineari'),
  parabola: Q('funzioni/parabola'),
  'disequazioni-2': Q('equazioni/disequazioni-secondo-grado'),
  'vita-reale': Q('lavoro/vita'),
  'lavoro-meccanico': Q('lavoro/meccanico'),
  'lavoro-elettrico': Q('lavoro/elettrico'),
  'lavoro-moda': Q('lavoro/moda'),
  'lavoro-grafica': Q('lavoro/grafica'),
  'lavoro-odonto': Q('lavoro/odonto'),
  'lavoro-socio': Q('lavoro/socio'),
};

// Correnti: f(x) nel riferimento del livello (x e y in unità del mondo), con la formula da mostrare.
// Le formule sono scritte per lo studente (unità del grafico = 10 unità del mondo).
const retta = (m, q, x0, x1, tex) => ({ f: (x) => m * x + q, df: () => m, x0, x1, tex });
const parab = (a, xv, yv, x0, x1, tex) => ({ f: (x) => a * (x - xv) ** 2 + yv, df: (x) => 2 * a * (x - xv), x0, x1, tex });
const onda = (A, k, y0, x0, x1, tex) => ({ f: (x) => y0 + A * Math.sin(k * x), df: (x) => A * k * Math.cos(k * x), x0, x1, tex });

export const LIVELLI = [
  {
    id: 'numeri', nome: 'Numeri', sottotitolo: 'Relativi, frazioni, potenze', tinta: 190, creatura: 'contastelle',
    nomeCreatura: 'Contastelle', mat: ['MAT_K1', 'MAT_A1'],
    attivita: ['numeri-relativi', 'frazioni', 'potenze'],
    forma: [[-0.85, 0.15], [-0.45, 0.42], [-0.1, 0.2], [0.25, 0.55], [0.6, 0.35], [0.9, 0.8]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    correnti: [retta(0.5, 20, -30, 30, 'y = \\tfrac{1}{2}x + 2')],
  },
  {
    id: 'percentuali', nome: 'Percentuali e proporzioni', sottotitolo: 'Sconti, aumenti, rapporti, notazione scientifica', tinta: 160, creatura: 'medusa',
    nomeCreatura: 'Medusa Percento', mat: ['MAT_K1', 'MAT_A1', 'MAT_C2'],
    attivita: ['percentuali', 'proporzioni', 'notazione-scientifica'],
    forma: [[-0.8, 0.85], [-0.5, 0.55], [-0.15, 0.25], [0.15, 0.7], [0.5, 0.45], [0.8, 0.15]],
    archi: [[0, 1], [1, 2], [2, 4], [4, 5], [1, 3], [3, 4]],
    correnti: [retta(-0.6, 120, 20, 100, 'y = -0{,}6x + 12')],
  },
  {
    id: 'calcolo-letterale', nome: 'Calcolo letterale', sottotitolo: 'Monomi: somme, prodotti, potenze', tinta: 255, creatura: 'monomio',
    nomeCreatura: 'Monomio', mat: ['MAT_K1', 'MAT_A1'],
    attivita: ['monomi'],
    forma: [[-0.75, 0.2], [-0.35, 0.5], [0, 0.8], [0.35, 0.5], [0.75, 0.2], [0, 0.35]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3]],
    correnti: [onda(14, 0.06, 70, -90, 90, 'y = 7 + 1{,}4\\sin\\left(\\tfrac{3}{5}x\\right)')],
  },
  {
    id: 'prodotti-notevoli', nome: 'Prodotti notevoli', sottotitolo: 'Quadrato di binomio, somma per differenza', tinta: 285, creatura: 'quadrato',
    nomeCreatura: 'Quadrato del binomio', mat: ['MAT_K1', 'MAT_A1'],
    attivita: ['prodotti-notevoli'],
    forma: [[-0.6, 0.15], [0.6, 0.15], [0.6, 0.85], [-0.6, 0.85], [0, 0.5], [0, 0.15]],
    archi: [[0, 5], [5, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 1]],
    correnti: [parab(0.012, 0, 25, -70, 70, 'y = \\tfrac{3}{25}x^2 + 2{,}5')],
  },
  {
    id: 'scomposizioni', nome: 'Scomposizioni', sottotitolo: 'Dal polinomio ai suoi fattori', tinta: 315, creatura: 'scompositore',
    nomeCreatura: 'Scompositore', mat: ['MAT_K1', 'MAT_A1'],
    attivita: ['scomposizioni', 'prodotti-notevoli'],
    forma: [[-0.85, 0.5], [-0.5, 0.8], [-0.5, 0.2], [0.5, 0.8], [0.5, 0.2], [0.85, 0.5]],
    archi: [[0, 1], [0, 2], [1, 2], [3, 4], [3, 5], [4, 5]],
    correnti: [retta(0, 50, -40, 40, 'y = 5')],
  },
  {
    id: 'equazioni', nome: 'Equazioni di primo grado', sottotitolo: 'Principi di equivalenza, disequazioni', tinta: 205, creatura: 'bilancia',
    nomeCreatura: 'Bilancia', mat: ['MAT_K1', 'MAT_A3'],
    attivita: ['equazioni-1', 'equazioni-1-speciali', 'disequazioni-1'],
    forma: [[-0.8, 0.35], [-0.27, 0.35], [0.27, 0.35], [0.8, 0.35], [-0.5, 0.75], [0.5, 0.75]],
    archi: [[0, 1], [2, 3], [4, 5], [1, 4], [2, 5]],
    correnti: [retta(1, 0, 10, 90, 'y = x')],
  },
  {
    id: 'rette', nome: 'Rette e pendenze', sottotitolo: 'Funzioni lineari, coefficiente angolare', tinta: 140, creatura: 'aquilone',
    nomeCreatura: 'Aquilone', mat: ['MAT_K2', 'MAT_A2'],
    attivita: ['funzioni-lineari', 'retta-pendenza'],
    forma: [[-0.9, 0.12], [-0.55, 0.27], [-0.2, 0.42], [0.15, 0.57], [0.5, 0.72], [0.85, 0.87]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    correnti: [retta(2, -40, 30, 80, 'y = 2x - 4'), retta(-0.5, 60, -90, -10, 'y = -\\tfrac{1}{2}x + 6')],
  },
  {
    id: 'geometria', nome: 'Geometria', sottotitolo: 'Aree, Pitagora, similitudine, solidi', tinta: 28, creatura: 'squadra',
    nomeCreatura: 'Squadra 3-4-5', mat: ['MAT_K3', 'MAT_A4', 'MAT_C4'],
    attivita: ['aree-perimetri', 'pitagora', 'similitudine', 'solidi'],
    forma: [[-0.7, 0.15], [0, 0.15], [0.7, 0.15], [0.7, 0.5], [0.7, 0.85], [0, 0.5]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
    correnti: [retta(0.75, 0, 10, 80, 'y = \\tfrac{3}{4}x')],
  },
  {
    id: 'dati', nome: 'Dati e previsioni', sottotitolo: 'Media, moda, mediana, probabilità', tinta: 335, creatura: 'stormo',
    nomeCreatura: 'Stormo della media', mat: ['MAT_K4', 'MAT_C3'],
    attivita: ['statistica', 'probabilita'],
    forma: [[-0.85, 0.15], [-0.5, 0.45], [-0.15, 0.85], [0.15, 0.85], [0.5, 0.45], [0.85, 0.15]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    correnti: [onda(18, 0.045, 60, -100, 100, 'y = 6 + 1{,}8\\sin\\left(\\tfrac{9}{20}x\\right)')],
  },
  {
    id: 'secondo-grado', nome: 'Radicali e secondo grado', sottotitolo: 'Radici, equazioni di secondo grado, sistemi', tinta: 48, creatura: 'radice',
    nomeCreatura: 'Uccello Radice', mat: ['MAT_K1', 'MAT_A3'],
    attivita: ['radicali', 'equazioni-2', 'sistemi-lineari'],
    forma: [[-0.85, 0.45], [-0.6, 0.25], [-0.3, 0.85], [0.1, 0.85], [0.5, 0.85], [0.85, 0.6]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    correnti: [parab(-0.01, 0, 110, -80, 80, 'y = -\\tfrac{1}{10}x^2 + 11')],
  },
  {
    id: 'parabola', nome: 'La parabola', sottotitolo: 'Vertice, concavità, disequazioni di secondo grado', tinta: 225, creatura: 'manta',
    nomeCreatura: 'Manta parabolica', mat: ['MAT_K2', 'MAT_A3'],
    attivita: ['parabola', 'disequazioni-2'],
    forma: [[-0.9, 0.85], [-0.6, 0.45], [-0.25, 0.2], [0.25, 0.2], [0.6, 0.45], [0.9, 0.85]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    correnti: [parab(0.008, 0, 20, -90, 90, 'y = \\tfrac{2}{25}x^2 + 2')],
  },
  {
    id: 'officina', nome: 'Officina', sottotitolo: 'La matematica del tuo indirizzo', tinta: 18, creatura: 'ingranaggio',
    nomeCreatura: 'Ingranaggio', mat: ['MAT_C2'],
    // l'attività vera si sceglie con l'indirizzo del profilo Quest (vedi attivitaDelLivello)
    attivita: ['vita-reale'],
    forma: [[-0.5, 0.2], [0.5, 0.2], [0.85, 0.5], [0.5, 0.8], [-0.5, 0.8], [-0.85, 0.5]],
    archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
    correnti: [onda(10, 0.08, 50, -80, 80, 'y = 5 + \\sin\\left(\\tfrac{4}{5}x\\right)')],
  },
];

export const LIVELLI_BY_ID = Object.fromEntries(LIVELLI.map((l) => [l.id, l]));

const LAVORO = { meccanico: 'lavoro-meccanico', elettrico: 'lavoro-elettrico', moda: 'lavoro-moda', grafica: 'lavoro-grafica', odonto: 'lavoro-odonto', socio: 'lavoro-socio' };

/** Attività di un livello: per l'Officina quella dell'indirizzo scelto nella Quest (se c'è) */
export function attivitaDelLivello(livello, indirizzo) {
  if (livello.id !== 'officina') return livello.attivita;
  const id = indirizzo && Object.entries(LAVORO).find(([k]) => String(indirizzo).includes(k))?.[1];
  return id ? [id, 'vita-reale'] : ['vita-reale'];
}

/** Il livello successivo (null all'ultimo) */
export function successivo(id) {
  const i = LIVELLI.findIndex((l) => l.id === id);
  return i >= 0 && i < LIVELLI.length - 1 ? LIVELLI[i + 1] : null;
}

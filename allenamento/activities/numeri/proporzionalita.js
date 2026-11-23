// PROPORZIONALITÀ DIRETTA E INVERSA — Orfini Math Quest
// Riconoscere il legame tra due grandezze (diretta, inversa, nessuna), lavorare su tabelle, costanti,
// grafici e formule, risolvere problemi della vita reale e del laboratorio dell'indirizzo.
//
// Contesti: le banche qui sotto hanno, per la vita reale e per ogni indirizzo, situazioni dirette (d),
// inverse (i) e coppie non proporzionali (NESSUNA). Le situazioni con `text` diventano problemi;
// quelle con la sola `coppia` servono solo da schede da smistare.
//   d: y = k·x  → ks (valori per uno), xs (valori realistici di x)
//   i: x·y = P  → P (prodotti costanti), xs (valori realistici di x, divisori di qualche P)
// Numeri sempre da fare a mente; la difficoltà cresce per classe nel ragionamento (perClasse):
//   1ª fattori interi (doppio, triplo, metà) · 2ª anche "una volta e mezza" · dalla 3ª qualunque coppia,
//   passando dal valore per uno o dal prodotto, e tabelle in cui il tipo di legame va scoperto.

import { scene, perClasse, indirizzoAttivo, VITA, INDIRIZZI_BY_ID } from '../contesti.js';
import { tx, euro } from '../../js/engine/helpers.js';
import { plane, table } from '../../js/gfx/svg.js';

const r2 = (v) => Math.round(v * 100) / 100;
const dec2 = (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
const minuscola = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// ---------------------------------------------------------------------------------------------
// Banche di contesti
// ---------------------------------------------------------------------------------------------
const CONTESTI = {
  vita: {
    d: [
      { coppia: 'Litri di benzina e prezzo pagato', ks: [1.8, 1.9, 2], xs: [5, 10, 15, 20, 25, 30, 40], unit: '€', dec: 2,
        text: (a, b, c) => `Con ${a} litri di benzina paghi ${euro(b)}. Quanto paghi ${c} litri allo stesso prezzo?` },
      { coppia: 'Numero di pizze e farina che serve', ks: [150, 200, 250], xs: [2, 3, 4, 5, 6, 8, 10, 12], unit: 'g',
        text: (a, b, c) => `Per ${a} pizze servono ${b} g di farina. Quanta farina serve per ${c} pizze?` },
      { coppia: 'Ore di lavoro e paga, a paga oraria fissa', ks: [7, 8, 9, 10, 12], xs: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20], unit: '€', dec: 2,
        text: (a, b, c) => `Con un lavoretto estivo guadagni ${euro(b)} in ${a} ore. Con la stessa paga oraria, quanto guadagni in ${c} ore?` },
      { coppia: 'Chilometri percorsi in bici e tempo, alla stessa velocità', ks: [3, 4, 5], xs: [2, 3, 4, 5, 6, 8, 10, 12], unit: 'minuti',
        text: (a, b, c) => `In bici, andando sempre alla stessa velocità, percorri ${a} km in ${b} minuti. Quanti minuti ti servono per ${c} km?` },
      { coppia: 'Lato di un quadrato e il suo perimetro' },
    ],
    i: [
      { coppia: 'Velocità e tempo per fare lo stesso tragitto', P: [120, 180, 240, 360], xs: [30, 40, 60, 80, 90, 120], unit: 'ore',
        text: (a, b, c) => `Un pullman fa un tragitto in ${b} ore andando a ${a} km/h di media. Quante ore impiega a ${c} km/h di media?` },
      { coppia: 'Amici che dividono un regalo e quota a testa', P: [60, 72, 90, 120, 144, 180], xs: [2, 3, 4, 5, 6, 8, 9, 10, 12], unit: '€', dec: 2,
        text: (a, b, c) => `Un regalo viene diviso in parti uguali: se gli amici sono ${a}, ognuno paga ${euro(b)}. Quanto paga ognuno se gli amici sono ${c}?` },
      { coppia: 'Rubinetti uguali aperti e tempo per riempire la vasca', P: [60, 72, 120], xs: [1, 2, 3, 4, 5, 6], unit: 'minuti',
        text: (a, b, c) => `Con ${a} rubinett${a === 1 ? 'o aperto' : 'i uguali aperti'} una vasca si riempie in ${b} minuti. Quanti minuti servono con ${c} rubinetti uguali?` },
      { coppia: 'Giga usati al giorno e giorni che dura l\'offerta', P: [60, 120], xs: [1, 2, 3, 4, 5, 6, 10], unit: 'giorni',
        text: (a, b, c) => `Usando ${a} GB al giorno, i giga della tua offerta durano ${b} giorni. Quanti giorni durano usando ${c} GB al giorno?` },
      { coppia: 'Larghezza e lunghezza di rettangoli con la stessa area' },
    ],
  },
  meccanico: {
    d: [
      { coppia: 'Pezzi prodotti e tempo macchina, con lo stesso ciclo', ks: [3, 4, 5, 6], xs: [5, 10, 12, 15, 20, 25, 30, 40], unit: 'minuti',
        text: (a, b, c) => `Una macchina CNC produce ${a} pezzi in ${b} minuti, sempre con lo stesso ciclo. Quanti minuti servono per ${c} pezzi?` },
      { coppia: 'Lunghezza di una barra d\'acciaio e sua massa', ks: [1.5, 2, 2.5, 4], xs: [1, 2, 3, 4, 5, 6], unit: 'kg', dec: 2,
        text: (a, b, c) => `Una barra tonda d'acciaio lunga ${a} m pesa ${tx(b).replace('{,}', ',')} kg. Quanto pesa una barra uguale lunga ${c} m?` },
      { coppia: 'Misura sul disegno e misura reale, nella stessa scala' },
      { coppia: 'Giri del mandrino e millimetri di avanzamento, ad avanzamento fisso' },
    ],
    i: [
      { coppia: 'Denti della ruota condotta e suoi giri al minuto', P: [1200, 2400, 3600], xs: [12, 15, 20, 24, 30, 40, 48, 60], unit: 'giri/min',
        text: (a, b, c) => `Una ruota motrice gira sempre allo stesso modo e trascina una ruota condotta da ${a} denti, che fa ${b} giri/min. Se la condotta viene sostituita con una da ${c} denti, quanti giri/min fa?` },
      { coppia: 'Diametro del pezzo e giri del mandrino, a velocità di taglio costante', P: [6000, 12000, 24000], xs: [20, 25, 30, 40, 50, 60, 80, 100, 120], unit: 'giri/min',
        text: (a, b, c) => `Al tornio la velocità di taglio deve restare la stessa: con un pezzo di diametro ${a} mm il mandrino gira a ${b} giri/min. A quanti giri/min deve girare con un diametro di ${c} mm?` },
      { coppia: 'Macchine uguali al lavoro e ore per finire lo stesso lotto', P: [24, 36, 48, 60], xs: [2, 3, 4, 5, 6], unit: 'ore',
        text: (a, b, c) => `${a} centri di lavoro uguali finiscono un lotto in ${b} ore. In quante ore lo finiscono ${c} centri di lavoro uguali?` },
    ],
  },
  elettrico: {
    d: [
      { coppia: 'Tensione e corrente in un resistore, a resistenza fissa', ks: [1, 2, 4, 5], xs: [2, 3, 4, 5, 6, 9, 10, 12, 15, 24], unit: 'mA',
        text: (a, b, c) => `Ai capi di un resistore applichi ${a} V e circolano ${b} mA. Quanti mA circolano nello stesso resistore con ${c} V?` },
      { coppia: 'Ore di accensione e energia consumata, alla stessa potenza', ks: [1.5, 2, 2.5], xs: [2, 3, 4, 5, 6, 8], unit: 'kWh', dec: 2,
        text: (a, b, c) => `Una stufa elettrica accesa per ${a} ore consuma ${tx(b).replace('{,}', ',')} kWh. Quanti kWh consuma in ${c} ore, alla stessa potenza?` },
      { coppia: 'Lunghezza di un cavo e sua resistenza, a parità di sezione', ks: [0.02, 0.05], xs: [10, 20, 25, 40, 50, 100], unit: 'Ω', dec: 2,
        text: (a, b, c) => `Un cavo di rame lungo ${a} m ha una resistenza di ${tx(b).replace('{,}', ',')} Ω. Quanto vale la resistenza di un cavo uguale lungo ${c} m?` },
    ],
    i: [
      { coppia: 'Resistenza e corrente, a tensione fissa', P: [12, 24, 36, 48], xs: [1, 2, 3, 4, 6, 8, 12], unit: 'mA',
        text: (a, b, c) => `Con una tensione fissa, un resistore da ${a} kΩ è attraversato da ${b} mA. Quanti mA passano in un resistore da ${c} kΩ, con la stessa tensione?` },
      { coppia: 'Potenza della lampada e ore di autonomia, con la stessa batteria', P: [120, 240, 360, 480], xs: [5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60], unit: 'ore',
        text: (a, b, c) => `Con una batteria carica, una lampada da ${a} W resta accesa ${b} ore. Quante ore resta accesa una lampada da ${c} W con la stessa batteria?` },
      { coppia: 'Elettricisti al lavoro e ore per cablare lo stesso impianto', P: [24, 36, 48], xs: [2, 3, 4, 6], unit: 'ore',
        text: (a, b, c) => `${a} elettricisti cablano un impianto in ${b} ore. Allo stesso ritmo, quante ore servono a ${c} elettricisti?` },
    ],
  },
  moda: {
    d: [
      { coppia: 'Capi dello stesso modello e metri di tessuto', ks: [1.2, 1.5, 2, 2.5], xs: [2, 4, 5, 6, 8, 10, 12, 20], unit: 'm', dec: 2,
        text: (a, b, c) => `Per ${a} gonne dello stesso modello servono ${tx(b).replace('{,}', ',')} m di tessuto. Quanti metri servono per ${c} gonne?` },
      { coppia: 'Capi cuciti e tempo di lavoro, allo stesso ritmo', ks: [20, 25, 30, 40], xs: [2, 3, 4, 5, 6, 8], unit: 'minuti',
        text: (a, b, c) => `Una sarta cuce ${a} camicie in ${b} minuti, sempre allo stesso ritmo. Quanti minuti le servono per ${c} camicie?` },
      { coppia: 'Numero di bottoni e spesa', ks: [0.15, 0.2, 0.25, 0.4], xs: [10, 12, 20, 24, 30, 50, 100], unit: '€', dec: 2,
        text: (a, b, c) => `${a} bottoni uguali costano ${euro(b)}. Quanto costano ${c} bottoni dello stesso tipo?` },
    ],
    i: [
      { coppia: 'Altezza della pezza e metri da comprare, per la stessa superficie', P: [720, 1440, 1800], xs: [90, 120, 144, 150, 180], unit: 'm',
        text: (a, b, c) => `Per un ordine serve sempre la stessa superficie di tessuto: con una pezza alta ${a} cm bisogna comprarne ${b} m. Quanti metri servono con una pezza alta ${c} cm?` },
      { coppia: 'Sarte al lavoro e giorni per completare lo stesso ordine', P: [24, 30, 36, 48, 60], xs: [2, 3, 4, 5, 6], unit: 'giorni',
        text: (a, b, c) => `${a} sarte completano un ordine in ${b} giorni. Allo stesso ritmo, quanti giorni servono a ${c} sarte?` },
      { coppia: 'Capi prodotti al giorno e giorni per completare l\'ordine', P: [120, 180, 240, 360], xs: [10, 12, 15, 20, 24, 30, 40, 60], unit: 'giorni',
        text: (a, b, c) => `Producendo ${a} capi al giorno, un ordine si completa in ${b} giorni. In quanti giorni si completa producendo ${c} capi al giorno?` },
    ],
  },
  grafica: {
    d: [
      { coppia: 'Copie stampate e costo, a prezzo per copia fisso', ks: [0.1, 0.15, 0.2, 0.25], xs: [20, 40, 50, 80, 100, 200, 250, 500], unit: '€', dec: 2,
        text: (a, b, c) => `${a} copie di un volantino costano ${euro(b)}. Allo stesso prezzo per copia, quanto costano ${c} copie?` },
      { coppia: 'Larghezza e altezza di un\'immagine ingrandita senza deformarla', ks: [0.5, 0.75, 1.25, 1.5], xs: [400, 600, 800, 1000, 1200, 1600, 2000], unit: 'px',
        text: (a, b, c) => `Un'immagine larga ${a} px e alta ${b} px viene ridimensionata senza deformarla. Quanto diventa alta, se diventa larga ${c} px?` },
      { coppia: 'Pagine stampate e minuti, alla stessa velocità di stampa' },
    ],
    i: [
      { coppia: 'Risoluzione di stampa e dimensione della foto, con gli stessi pixel', P: [2400, 3600, 4800], xs: [60, 80, 100, 120, 150, 200, 240], unit: 'cm',
        text: (a, b, c) => `Una foto ha sempre gli stessi pixel: stampata a ${a} pixel per cm è larga ${b} cm. Quanto è larga stampata a ${c} pixel per cm?` },
      { coppia: 'Velocità della connessione e tempo per scaricare lo stesso file', P: [600, 1200, 2400], xs: [10, 20, 30, 40, 50, 60, 100, 200], unit: 'secondi',
        text: (a, b, c) => `Un file si scarica in ${b} secondi a ${a} Mbit/s. Quanti secondi servono a ${c} Mbit/s?` },
      { coppia: 'Numero di colonne e larghezza di ogni colonna, nella stessa pagina', P: [120, 180, 240], xs: [2, 3, 4, 5, 6, 8, 10, 12], unit: 'mm',
        text: (a, b, c) => `Una pagina è divisa in colonne uguali, senza spazi tra l'una e l'altra: con ${a} colonne ognuna è larga ${b} mm. Quanto è larga ogni colonna con ${c} colonne?` },
    ],
  },
  odonto: {
    d: [
      { coppia: 'Grammi di gesso e millilitri di acqua, con lo stesso rapporto', ks: [0.2, 0.25, 0.3], xs: [50, 100, 150, 200, 250, 300], unit: 'ml',
        text: (a, b, c) => `Per ${a} g di gesso servono ${tx(b).replace('{,}', ',')} ml di acqua. Quanti ml di acqua servono per ${c} g dello stesso gesso?` },
      { coppia: 'Numero di corone e grammi di lega', ks: [2.5, 3, 4], xs: [2, 3, 4, 5, 6, 8, 10], unit: 'g', dec: 2,
        text: (a, b, c) => `Per fondere ${a} corone uguali servono ${tx(b).replace('{,}', ',')} g di lega. Quanti grammi servono per ${c} corone?` },
      { coppia: 'Misura sul modello e misura reale, nella stessa scala' },
    ],
    i: [
      { coppia: 'Odontotecnici al lavoro e ore per lo stesso ordine', P: [24, 36, 48], xs: [2, 3, 4, 6], unit: 'ore',
        text: (a, b, c) => `${a} odontotecnici completano un ordine di protesi in ${b} ore. Allo stesso ritmo, quante ore servono a ${c} odontotecnici?` },
      { coppia: 'Grammi per busta e numero di buste, dallo stesso sacco di gesso', P: [3000, 6000], xs: [100, 150, 200, 250, 300, 500], unit: 'buste',
        text: (a, b, c) => `Un sacco di gesso viene diviso in buste uguali: con buste da ${a} g se ne riempiono ${b}. Quante buste da ${c} g si riempiono con lo stesso sacco?` },
      { coppia: 'Fornetti uguali e ore per cuocere lo stesso lotto' },
    ],
  },
  socio: {
    d: [
      { coppia: 'Porzioni della mensa e grammi di pasta', ks: [80, 100, 120], xs: [10, 12, 15, 20, 25, 30, 40, 50], unit: 'g',
        text: (a, b, c) => `Per ${a} porzioni di pasta della mensa servono ${b} g. Quanti grammi servono per ${c} porzioni?` },
      { coppia: 'Litri d\'acqua e millilitri di disinfettante, alla stessa diluizione', ks: [10, 20, 25, 40], xs: [2, 3, 4, 5, 8, 10], unit: 'ml',
        text: (a, b, c) => `Per pulire i pavimenti, in ${a} litri d'acqua si sciolgono ${b} ml di disinfettante. Quanti ml servono per ${c} litri, alla stessa diluizione?` },
      { coppia: 'Ore di assistenza e compenso, a tariffa oraria fissa', ks: [18, 20, 22], xs: [2, 3, 4, 5, 6, 8, 10], unit: '€', dec: 2,
        text: (a, b, c) => `Per ${a} ore di assistenza un operatore riceve ${euro(b)}. Con la stessa tariffa oraria, quanto riceve per ${c} ore?` },
    ],
    i: [
      { coppia: 'Ospiti che dividono la stessa torta e porzione a testa', P: [600, 720, 900, 1200], xs: [4, 5, 6, 8, 9, 10, 12, 15], unit: 'g',
        text: (a, b, c) => `La torta della merenda viene divisa in parti uguali: con ${a} ospiti ognuno riceve ${b} g. Quanti grammi a testa, se gli ospiti sono ${c}?` },
      { coppia: 'Operatori al lavoro e tempo per lo stesso servizio', P: [120, 180, 240], xs: [2, 3, 4, 5, 6], unit: 'minuti',
        text: (a, b, c) => `${a} operatori preparano la sala per una festa in ${b} minuti. Allo stesso ritmo, quanti minuti servono a ${c} operatori?` },
      { coppia: 'Millilitri a lavaggio e numero di lavaggi, con lo stesso flacone', P: [400, 600, 1000], xs: [2, 4, 5, 8, 10], unit: 'lavaggi',
        text: (a, b, c) => `Usando ${a} ml di sapone a lavaggio, un flacone basta per ${b} lavaggi. Per quanti lavaggi basta lo stesso flacone usando ${c} ml a lavaggio?` },
    ],
  },
};

/** Coppie di grandezze legate, ma non proporzionali: il tranello classico */
const NESSUNA = {
  vita: [
    { coppia: 'Minuti di taxi e prezzo, con lo scatto alla partenza', why: 'C\'è una quota fissa: raddoppiando i minuti il prezzo cresce, ma meno del doppio.' },
    { coppia: 'Età di un ragazzo e sua altezza', why: 'Crescono insieme, ma non in proporzione: a 16 anni non si è alti il doppio che a 8.' },
    { coppia: 'Ora del giorno e temperatura dell\'aria', why: 'La temperatura sale e scende durante il giorno: nessun rapporto o prodotto costante.' },
    { coppia: 'Lato di un quadrato e la sua area', why: 'Raddoppiando il lato l\'area diventa quattro volte tanto, non il doppio.' },
  ],
  meccanico: [{ coppia: 'Ore di noleggio di un compressore e costo, con quota fissa', why: 'La quota fissa si paga una volta sola: raddoppiando le ore il costo non raddoppia.' }, { coppia: 'Diametro di un tondino e sua massa al metro', why: 'La massa dipende dall\'area della sezione: raddoppiando il diametro diventa quattro volte tanto.' }],
  elettrico: [{ coppia: 'Ore di intervento e costo dell\'elettricista, con diritto di chiamata', why: 'Il diritto di chiamata è fisso: raddoppiando le ore il costo non raddoppia.' }, { coppia: 'kWh consumati e importo della bolletta, con quota fissa', why: 'La quota fissa c\'è anche a consumo zero: l\'importo non è proporzionale ai kWh.' }],
  moda: [{ coppia: 'Capi ricamati e costo del laboratorio, con quota fissa', why: 'La quota fissa si paga comunque: raddoppiando i capi il costo non raddoppia.' }],
  grafica: [{ coppia: 'Copie stampate e costo della tipografia, con spese di avviamento', why: 'Le spese di avviamento sono fisse: raddoppiando le copie il costo non raddoppia.' }],
  odonto: [{ coppia: 'Consegne del corriere e costo, con quota fissa mensile', why: 'La quota fissa si paga comunque: raddoppiando le consegne il costo non raddoppia.' }],
  socio: [{ coppia: 'Ore di assistenza domiciliare e costo, con quota fissa di uscita', why: 'La quota di uscita è fissa: raddoppiando le ore il costo non raddoppia.' }],
};

const INDIRIZZI_PROF = ['meccanico', 'elettrico', 'moda', 'grafica', 'odonto', 'socio'];
const SINGOLARE = { minuti: 'minuto', ingressi: 'ingresso', ore: 'ora', pezzi: 'pezzo', capi: 'capo', metri: 'metro', copie: 'copia', giorni: 'giorno', consegne: 'consegna', chilometri: 'chilometro' };

/** Banca di contesti: 'vita', 'lavoro' (indirizzo attivo, o tutti se non c'è) o 'tutti' (vita + indirizzo) */
function banca(dove) {
  const ind = indirizzoAttivo();
  const keys = dove === 'vita' ? ['vita'] : dove === 'lavoro' ? (ind ? [ind] : INDIRIZZI_PROF) : ['vita', ...(ind ? [ind] : [])];
  return {
    d: keys.flatMap((k) => CONTESTI[k].d),
    i: keys.flatMap((k) => CONTESTI[k].i),
    n: keys.flatMap((k) => NESSUNA[k]),
  };
}

// ---------------------------------------------------------------------------------------------
// Numeri: sempre da calcolo mentale, con fattori adatti alla classe
// ---------------------------------------------------------------------------------------------
const fattoreOk = (x1, x2, band) => {
  const r = x2 / x1;
  if (band === 'interi') return [2, 3, 4, 1 / 2, 1 / 3, 1 / 4].some((f) => Math.abs(r - f) < 1e-9);
  if (band === 'mezzi') return [1.5, 2, 2.5, 3, 4, 1 / 2, 2 / 3, 1 / 3, 1 / 4].some((f) => Math.abs(r - f) < 1e-9);
  return true;
};
const bandaClasse = () => perClasse({ 1: 'interi', 2: 'mezzi', 3: 'qualunque' });

function numeriDiretta(rng, sc, band = bandaClasse()) {
  return rng.until(() => {
    const k = rng.pick(sc.ks), x1 = rng.pick(sc.xs), x2 = rng.pick(sc.xs);
    return { k, x1, x2, y1: r2(k * x1), y2: r2(k * x2) };
  }, (v) => v.x1 !== v.x2 && fattoreOk(v.x1, v.x2, band) && dec2(v.k * v.x1) && dec2(v.k * v.x2));
}

function numeriInversa(rng, sc, band = bandaClasse()) {
  return rng.until(() => {
    const P = rng.pick(sc.P), x1 = rng.pick(sc.xs), x2 = rng.pick(sc.xs);
    return { P, x1, x2, y1: P / x1, y2: P / x2 };
  }, (v) => v.x1 !== v.x2 && v.P % v.x1 === 0 && v.P % v.x2 === 0 && fattoreOk(v.x1, v.x2, band));
}

/** "il doppio", "il triplo", "la metà"… quando il fattore è semplice */
function nomeFattore(r) {
  const nomi = [[2, 'il doppio'], [3, 'il triplo'], [4, 'il quadruplo'], [0.5, 'la metà'], [1 / 3, 'un terzo'], [0.25, 'un quarto'], [1.5, 'una volta e mezza'], [2.5, 'due volte e mezza']];
  const f = nomi.find(([v]) => Math.abs(v - r) < 1e-9);
  return f ? f[1] : null;
}

// ---------------------------------------------------------------------------------------------
// Generatori
// ---------------------------------------------------------------------------------------------

/** Problema con le parole: lo studente deve capire da solo se è diretta o inversa */
function problema(rng, dove, tipo) {
  const B = banca(dove);
  const t = tipo || (rng.chance(0.5) ? 'd' : 'i');
  const sc = rng.pick(B[t].filter((s) => s.text));
  const unit = sc.unit;
  const coppia = minuscola(sc.coppia);
  if (t === 'd') {
    const { k, x1, x2, y1, y2 } = numeriDiretta(rng, sc);
    const f = nomeFattore(x2 / x1);
    const sbagliata = r2((y1 * x1) / x2);
    const traps = [{ value: sbagliata, msg: 'Hai usato la proporzionalità inversa: qui le due grandezze crescono insieme, e resta costante il rapporto.' }];
    const somma = r2(y1 + (x2 - x1));
    if (Math.abs(somma - y2) > 0.02 && Math.abs(somma - sbagliata) > 0.02) traps.push({ value: somma, msg: 'Non si aggiunge la stessa quantità: le grandezze crescono nello stesso rapporto, non della stessa differenza.' });
    return {
      type: 'number', unit, ...(sc.dec ? { decimals: sc.dec } : {}),
      prompt: sc.text(x1, y1, x2),
      answer: y2,
      traps,
      hint: 'Prima decidi: se la prima grandezza raddoppia, la seconda raddoppia o si dimezza?',
      explain: `Proporzionalità diretta (${coppia}): resta costante il rapporto. ${f ? `${x2} è ${f} di ${x1}, quindi anche il risultato è ${f} di ${it2(y1)}. ` : ''}Valore per uno: $${tx(y1)} : ${x1} = ${tx(k)}$; poi $${tx(k)}\\cdot ${x2} = ${tx(y2)}$ (${unit}).`,
      cas: { eval: `${y1}/${x1}*${x2}` },
      twin: () => problema(rng, dove, t),
    };
  }
  const { P, x1, x2, y1, y2 } = numeriInversa(rng, sc);
  const f = nomeFattore(x2 / x1);
  const sbagliata = r2((y1 * x2) / x1);
  return {
    type: 'number', unit, ...(sc.dec ? { decimals: sc.dec } : {}),
    prompt: sc.text(x1, y1, x2),
    answer: y2,
    traps: [{ value: sbagliata, msg: 'Hai usato la proporzionalità diretta: qui quando una grandezza aumenta l\'altra diminuisce, e resta costante il prodotto.' }],
    hint: 'Prima decidi: se la prima grandezza raddoppia, la seconda raddoppia o si dimezza?',
    explain: `Proporzionalità inversa (${coppia}): resta costante il prodotto. ${f ? `${x2} è ${f} di ${x1}, quindi il risultato fa il contrario. ` : ''}$${x1}\\cdot ${tx(y1)} = ${P}$; poi $${P} : ${x2} = ${tx(y2)}$ (${unit}).`,
    cas: { eval: `${x1}*${y1}/${x2}` },
    twin: () => problema(rng, dove, 'i'),
  };
}
const it2 = (v) => tx(v).replace('{,}', ',');

/** Smista le coppie di grandezze: diretta, inversa (e dalla 2ª anche "nessuna") */
function smista(rng, dove) {
  const B = banca(dove);
  const conNessuna = perClasse({ 1: false, 2: true });
  const quanti = conNessuna ? 2 : 3;
  const pesca = (arr, n) => rng.shuffle([...new Map(arr.map((s) => [s.coppia, s])).values()]).slice(0, n);
  const fill = (arr, extra, n) => (arr.length >= n ? arr : arr.concat(extra.filter((e) => !arr.includes(e))));
  const V = CONTESTI.vita;
  const items = [
    ...pesca(fill(B.d, V.d, quanti), quanti).map((s) => ({ label: s.coppia, bin: 'diretta' })),
    ...pesca(fill(B.i, V.i, quanti), quanti).map((s) => ({ label: s.coppia, bin: 'inversa' })),
    ...(conNessuna ? pesca(fill(B.n, NESSUNA.vita, 2), 2).map((s) => ({ label: s.coppia, bin: 'nessuna' })) : []),
  ];
  return {
    type: 'bins',
    prompt: 'Smista le coppie di grandezze: che legame c\'è?',
    bins: [{ id: 'diretta', label: 'Diretta' }, { id: 'inversa', label: 'Inversa' }, ...(conNessuna ? [{ id: 'nessuna', label: 'Nessuna proporzionalità' }] : [])],
    items: rng.shuffle(items),
    hint: 'Immagina di raddoppiare la prima grandezza: la seconda raddoppia, si dimezza, o fa altro?',
    explain: `Diretta: se una raddoppia anche l'altra raddoppia (rapporto costante). Inversa: se una raddoppia l'altra si dimezza (prodotto costante).${conNessuna ? ' Nessuna: crescono o calano insieme, ma non nello stesso rapporto (quote fisse, quadrati, temperature…).' : ''}`,
    twin: () => smista(rng, dove),
  };
}

/** Il test del raddoppio su una coppia di grandezze */
function raddoppio(rng) {
  const B = banca('tutti');
  const conNessuna = perClasse({ 1: false, 2: true });
  const tipo = rng.pick(conNessuna ? ['d', 'i', 'n'] : ['d', 'i']);
  const sc = rng.pick(B[tipo]);
  const msg = {
    d: 'Le due grandezze crescono insieme e nello stesso rapporto: è una proporzionalità diretta.',
    i: 'Più cresce la prima, meno serve della seconda, e il prodotto resta lo stesso: è una proporzionalità inversa.',
    n: sc.why,
  };
  return {
    type: 'choice',
    prompt: `${sc.coppia}. Se la prima grandezza raddoppia, la seconda…`,
    options: [
      { label: 'raddoppia', correct: tipo === 'd', why: tipo === 'd' ? undefined : msg[tipo] },
      { label: 'si dimezza', correct: tipo === 'i', why: tipo === 'i' ? undefined : msg[tipo] },
      { label: 'cambia, ma non raddoppia e non si dimezza', correct: tipo === 'n', why: tipo === 'n' ? undefined : msg[tipo] },
      { label: 'resta uguale', why: 'Le due grandezze sono legate: se una cambia, cambia anche l\'altra.' },
    ],
    fixedOrder: true,
    explain: `${msg[tipo]} ${tipo === 'd' ? 'Rapporto costante.' : tipo === 'i' ? 'Prodotto costante.' : 'Né il rapporto né il prodotto restano costanti.'}`,
    twin: () => raddoppio(rng),
  };
}

/** Legami da tabella e grafico: diretta, inversa, retta che non passa per l'origine, retta che scende */
function legame(rng, tipo) {
  const k = rng.int(2, 5);
  const xs = [1, 2, 3, 4, 6];
  const forme = {
    d: { f: (x) => k * x, ymax: k * 7 },
    i: { f: (x) => (12 * k) / x, ymax: 12 * k + 2 },
    q: { q: rng.pick([2, 3, 4, 5]) },
    giu: { c: rng.pick([20, 24, 30]), m: rng.pick([2, 3]) },
  };
  if (tipo === 'q') { forme.q.f = (x) => k * x + forme.q.q; forme.q.ymax = k * 7 + forme.q.q; }
  if (tipo === 'giu') { forme.giu.f = (x) => forme.giu.c - forme.giu.m * x; forme.giu.ymax = forme.giu.c + 2; }
  const F = forme[tipo];
  const rows = xs.map((x) => [x, r2(F.f(x))]);
  return { k, rows, F, q: forme.q.q, c: forme.giu.c, m: forme.giu.m };
}

function perche(tipo, L) {
  if (tipo === 'd') return { ok: `$y/x = ${L.k}$ per ogni coppia: proporzionalità diretta, $y = ${L.k}x$. Il grafico è una retta che passa per l'origine.` };
  if (tipo === 'i') return { ok: `$x\\cdot y = ${12 * L.k}$ per ogni coppia: proporzionalità inversa, $y = \\dfrac{${12 * L.k}}{x}$. Il grafico è un ramo di iperbole.` };
  if (tipo === 'q') return { ok: `$y = ${L.k}x + ${L.q}$: $y$ cresce sempre di ${L.k}, ma il rapporto $y/x$ non è costante ($${L.rows[0][1]}/1$ e $${L.rows[1][1]}/2$ sono diversi). È una retta che non passa per l'origine: $y$ non è proporzionale a $x$. Sono proporzionali solo gli aumenti ($y$ cresce di ${L.k} per ogni passo di 1) e $y - ${L.q}$, che vale sempre $${L.k}x$.` };
  return { ok: `$y = ${L.c} - ${L.m}x$: $y$ diminuisce, ma il prodotto $x\\cdot y$ non è costante ($1\\cdot ${L.rows[0][1]}$ e $2\\cdot ${L.rows[1][1]}$ sono diversi). Una retta che scende non è una proporzionalità inversa.` };
}

function tabellaTipo(rng, { soloGrafico = false } = {}) {
  const tipi = perClasse({ 1: ['d', 'i', 'q'], 2: ['d', 'i', 'q', 'giu'] });
  const tipo = rng.pick(tipi);
  const L = legame(rng, tipo);
  const isD = tipo === 'd', isI = tipo === 'i';
  const graf = plane({ xmin: 0, xmax: 7, ymin: 0, ymax: L.F.ymax, width: 320, height: 220, notable: false, fns: [{ f: L.F.f, domain: isI ? [0.4, 7] : [0, 7] }], points: L.rows.map(([x, y]) => ({ x, y })) });
  const tab = table(['$x$', '$y$'], L.rows.map((r) => [r[0], String(r[1]).replace('.', ',')]));
  const spiega = perche(tipo, L).ok;
  return {
    type: 'choice',
    fig: soloGrafico ? graf : tab + graf,
    prompt: soloGrafico ? 'Guarda i punti del grafico: che legame c\'è tra $x$ e $y$?' : 'Che legame c\'è tra $x$ e $y$?',
    options: [
      { label: 'Proporzionalità diretta', correct: isD, why: isD ? undefined : spiega },
      { label: 'Proporzionalità inversa', correct: isI, why: isI ? undefined : spiega },
      { label: 'Nessuna proporzionalità', correct: !isD && !isI, why: isD || isI ? spiega : undefined },
    ],
    fixedOrder: true,
    hint: 'Controlla due coppie: il rapporto $y/x$ è sempre lo stesso? E il prodotto $x\\cdot y$?',
    explain: spiega,
    twin: () => tabellaTipo(rng, { soloGrafico }),
  };
}

/** Completa la tabella: dalla 3ª il tipo di legame non viene detto */
function completa(rng) {
  const detto = perClasse({ 1: true, 3: false });
  const isD = rng.chance(0.5);
  let xs, ys, k, P;
  if (isD) {
    k = perClasse({ 1: rng.int(2, 9), 2: rng.pick([1.5, 2.5, 3, 4, 6, 0.5]) });
    xs = rng.shuffle([2, 3, 4, 5, 6, 8, 10]).slice(0, 4).sort((a, b) => a - b);
    ys = xs.map((x) => r2(k * x));
  } else {
    P = rng.pick([24, 36, 48, 60, 72, 120]);
    const div = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20].filter((d) => P % d === 0 && d * d !== P);
    xs = rng.shuffle(div).slice(0, 4).sort((a, b) => a - b);
    ys = xs.map((x) => P / x);
  }
  const pos = rng.int(2, 3);
  const answer = ys[pos];
  const cell = (v) => String(v).replace('.', ',');
  const sbagliata = isD ? r2((ys[0] * xs[0]) / xs[pos]) : r2((ys[0] * xs[pos]) / xs[0]);
  return {
    type: 'number',
    fig: table(['$x$', ...xs.map((x) => `$${x}$`)], [['$y$', ...ys.map((y, i) => (i === pos ? '?' : `$${tx(y)}$`))]]),
    prompt: detto ? `In questa tabella $x$ e $y$ sono ${isD ? 'direttamente' : 'inversamente'} proporzionali. Quale numero va al posto di "?"` : 'In questa tabella $x$ e $y$ sono proporzionali, ma non si dice come: scoprilo dalle coppie complete. Quale numero va al posto di "?"',
    answer,
    ...(dec2(answer) && !Number.isInteger(answer) ? { decimals: 2 } : {}),
    traps: Math.abs(sbagliata - answer) > 1e-9 ? [{ value: sbagliata, msg: isD ? 'Così il prodotto resterebbe costante: qui invece è costante il rapporto.' : 'Così il rapporto resterebbe costante: qui invece è costante il prodotto.' }] : [],
    hint: detto ? (isD ? 'Diretta: calcola $y$ per $x = 1$, cioè il rapporto $y/x$.' : 'Inversa: il prodotto $x\\cdot y$ è sempre lo stesso.') : 'Confronta le prime due coppie: resta uguale il rapporto o il prodotto?',
    explain: isD
      ? `Diretta: $y/x = ${tx(ys[0])} : ${xs[0]} = ${tx(k)}$. Quindi $y = ${tx(k)}\\cdot ${xs[pos]} = ${tx(answer)}$.`
      : `Inversa: $x\\cdot y = ${xs[0]}\\cdot ${ys[0]} = ${P}$. Quindi $y = ${P} : ${xs[pos]} = ${tx(answer)}$.`,
    cas: { eval: isD ? `${ys[0]}/${xs[0]}*${xs[pos]}` : `${xs[0]}*${ys[0]}/${xs[pos]}` },
    twin: () => completa(rng),
  };
}

/** La costante di proporzionalità */
function costante(rng) {
  const detto = perClasse({ 1: true, 3: false });
  const isD = rng.chance(0.5);
  const xs = [2, 3, 4, 6];
  const k = isD ? perClasse({ 1: rng.int(2, 9), 2: rng.pick([1.5, 2.5, 3, 4, 5, 0.5]) }) : rng.pick([12, 24, 36, 48, 60]);
  const ys = xs.map((x) => r2(isD ? k * x : k / x));
  const sbagliata = r2(isD ? xs[0] * ys[0] : ys[0] / xs[0]);
  return {
    type: 'number',
    fig: table(['$x$', ...xs.map((x) => `$${x}$`)], [['$y$', ...ys.map((y) => `$${tx(y)}$`)]]),
    prompt: detto
      ? (isD ? 'Qui $x$ e $y$ sono direttamente proporzionali. Quanto vale la costante $k = \\dfrac{y}{x}$?' : 'Qui $x$ e $y$ sono inversamente proporzionali. Quanto vale la costante $k = x\\cdot y$?')
      : 'Qui $x$ e $y$ sono proporzionali. Trova la costante di proporzionalità: il rapporto o il prodotto, quello dei due che resta uguale.',
    answer: k,
    ...(Number.isInteger(k) ? {} : { decimals: 2 }),
    traps: Math.abs(sbagliata - k) > 1e-9 ? [{ value: sbagliata, msg: isD ? 'Questo è il prodotto della prima coppia: ma il prodotto cambia da una coppia all\'altra, è costante il rapporto.' : 'Questo è il rapporto della prima coppia: ma il rapporto cambia da una coppia all\'altra, è costante il prodotto.' }] : [],
    hint: 'Prova con due coppie diverse: il numero che resta uguale è la costante.',
    explain: isD
      ? `$\\dfrac{${tx(ys[0])}}{${xs[0]}} = \\dfrac{${tx(ys[1])}}{${xs[1]}} = ${tx(k)}$: il rapporto è costante, $k = ${tx(k)}$ e $y = ${tx(k)}x$.`
      : `$${xs[0]}\\cdot ${tx(ys[0])} = ${xs[1]}\\cdot ${tx(ys[1])} = ${k}$: il prodotto è costante, $k = ${k}$ e $y = \\dfrac{${k}}{x}$.`,
    cas: { eval: isD ? `${ys[1]}/${xs[1]}` : `${xs[1]}*${ys[1]}` },
    twin: () => costante(rng),
  };
}

/** Dalla tabella alla formula */
function formula(rng) {
  const isD = rng.chance(0.5);
  const xs = [1, 2, 3, 4, 6];
  const k = isD ? rng.int(2, 9) : rng.pick([12, 24, 36, 48, 60]);
  const ys = xs.map((x) => (isD ? k * x : k / x));
  const giusta = isD ? `$y = ${k}x$` : `$y = \\dfrac{${k}}{x}$`;
  const opzioni = isD
    ? [[giusta, true], [`$y = \\dfrac{${k}}{x}$`, false, 'Con questa formula, se $x$ raddoppia $y$ si dimezza: in tabella invece raddoppia.'], [`$y = x + ${k - 1}$`, false, `Va bene solo per $x = 1$: per $x = 2$ darebbe ${k + 1}, non ${2 * k}.`], [`$y = ${k}x + ${k}$`, false, `Per $x = 1$ darebbe ${2 * k}, non ${k}.`]]
    : [[giusta, true], [`$y = ${k}x$`, false, 'Con questa formula $y$ cresce con $x$: in tabella invece diminuisce.'], [`$y = ${k} - x$`, false, `Per $x = 2$ darebbe ${k - 2}, non ${k / 2}: $y$ si dimezza, non cala di 1.`], [`$y = \\dfrac{x}{${k}}$`, false, 'Con questa formula $y$ cresce con $x$: è una proporzionalità diretta.']];
  return {
    type: 'choice',
    fig: table(['$x$', ...xs.map((x) => `$${x}$`)], [['$y$', ...ys.map((y) => `$${y}$`)]]),
    prompt: 'Quale formula descrive la tabella?',
    options: opzioni.map(([label, correct, why]) => ({ label, correct, why })),
    hint: 'Guarda il valore di $y$ per $x = 1$: è la costante. Poi chiediti se $y$ cresce o cala.',
    explain: isD ? `Per $x = 1$, $y = ${k}$, e $y/x$ vale sempre ${k}: $y = ${k}x$.` : `Per $x = 1$, $y = ${k}$, e $x\\cdot y$ vale sempre ${k}: $y = \\dfrac{${k}}{x}$.`,
    twin: () => formula(rng),
  };
}

/** Il tranello della quota fissa (tariffe dell'indirizzo o della vita reale) */
function quotaFissa(rng, dove) {
  const t = dove === 'vita' ? rng.pick(VITA.pools.tariffa)
    : indirizzoAttivo() ? scene(rng, 'tariffa') : rng.pick(INDIRIZZI_PROF.flatMap((k) => INDIRIZZI_BY_ID[k].pools.tariffa));
  const { fixed, per, n1 } = rng.until(() => {
    const fixed = rng.pick(t.fixed), per = rng.pick(t.per);
    const n1 = rng.int(t.n[0], Math.max(t.n[0], Math.floor(t.n[1] / 2)));
    return { fixed, per, n1 };
  }, (v) => Math.abs(v.per * v.n1 * 10 - Math.round(v.per * v.n1 * 10)) < 1e-6);
  const c1 = r2(fixed + per * n1), n2 = 2 * n1, c2 = r2(fixed + per * n2);
  const u1 = SINGOLARE[t.u] || t.u;
  return {
    type: 'truefalse',
    prompt: `${t.s} costa ${euro(fixed)} fissi più ${euro(per)} per ogni ${u1}: con ${n1} ${t.u} si spendono ${euro(c1)}. Vero o falso?`,
    statements: [
      { text: `Con ${n2} ${t.u} si spendono ${euro(2 * c1)}, il doppio.`, value: false },
      { text: `Con ${n2} ${t.u} si spendono ${euro(c2)}.`, value: true },
      { text: `Il costo è direttamente proporzionale ai ${t.u}.`, value: false },
      { text: `Senza la quota fissa, costo e ${t.u} sarebbero direttamente proporzionali.`, value: true },
    ],
    explain: `La quota fissa di ${euro(fixed)} si paga una volta sola: con ${n2} ${t.u} si spendono $${tx(fixed)} + ${tx(per)}\\cdot ${n2} = ${tx(c2)}$ €, non il doppio di ${euro(c1)}. È una funzione lineare ($y = ${tx(per)}x + ${tx(fixed)}$), ma il costo non è proporzionale ai ${t.u}: la retta non passa per l'origine. Sono proporzionali, invece, gli aumenti: ogni ${u1} in più costa sempre ${euro(per)}.`,
    twin: () => quotaFissa(rng, dove),
  };
}

/** Smista le formule */
function smistaFormule(rng) {
  const k = rng.int(2, 6), P = rng.pick([12, 24, 36]), q = rng.int(2, 6), c = rng.pick([10, 20]);
  const d = [`$y = ${k}x$`, `$y = \\dfrac{x}{${k}}$`, `$\\dfrac{y}{x} = ${k}$`];
  const i = [`$y = \\dfrac{${P}}{x}$`, `$x\\cdot y = ${P}$`, `$y = \\dfrac{1}{${k}x}$`];
  const n = [`$y = x + ${q}$`, `$y = ${c} - x$`, '$y = x^2$', `$y = ${k}x + ${q}$`];
  const items = [
    ...rng.shuffle(d).slice(0, 2).map((label) => ({ label, bin: 'diretta' })),
    ...rng.shuffle(i).slice(0, 2).map((label) => ({ label, bin: 'inversa' })),
    ...rng.shuffle(n).slice(0, 2).map((label) => ({ label, bin: 'nessuna' })),
  ];
  return {
    type: 'bins',
    prompt: 'Smista le formule: che legame c\'è tra $x$ e $y$?',
    bins: [{ id: 'diretta', label: 'Diretta' }, { id: 'inversa', label: 'Inversa' }, { id: 'nessuna', label: 'Nessuna proporzionalità' }],
    items: rng.shuffle(items),
    hint: 'Diretta: $y = k\\cdot x$ (anche $y = x/k$). Inversa: $y = k/x$, cioè $x\\cdot y = k$.',
    explain: `Diretta: $y$ è $x$ moltiplicato per un numero fisso ($y/x$ costante; anche $\\dfrac{x}{${k}}$ è $x$ per $\\dfrac{1}{${k}}$). Inversa: $y$ è un numero fisso diviso $x$ ($x\\cdot y$ costante). Un termine aggiunto o tolto rompe la proporzionalità tra $x$ e $y$ (in $y = x + ${q}$ restano proporzionali solo gli aumenti), e un quadrato la rompe del tutto.`,
    twin: () => smistaFormule(rng),
  };
}

/** Quale formula lega due grandezze reali */
function formulaContesto(rng) {
  const B = banca('tutti');
  const tipo = rng.pick(['d', 'i', 'n']);
  const sc = rng.pick(B[tipo]);
  const why = {
    d: 'Le due grandezze crescono nello stesso rapporto: $y = kx$.',
    i: 'Quando una raddoppia l\'altra si dimezza: il prodotto è costante, $y = \\dfrac{k}{x}$.',
    n: `${sc.why} Serve una formula con un termine in più (o un quadrato).`,
  };
  return {
    type: 'choice',
    prompt: `${sc.coppia}. Chiama $x$ la prima grandezza e $y$ la seconda: quale formula descrive il legame? ($k$ e $q$ sono numeri fissi positivi.)`,
    options: [
      { label: '$y = kx$', correct: tipo === 'd', why: tipo === 'd' ? undefined : why[tipo] },
      { label: '$y = \\dfrac{k}{x}$', correct: tipo === 'i', why: tipo === 'i' ? undefined : why[tipo] },
      { label: 'Né l\'una né l\'altra: per esempio $y = kx + q$ o $y = kx^2$', correct: tipo === 'n', why: tipo === 'n' ? undefined : why[tipo] },
    ],
    fixedOrder: true,
    explain: why[tipo],
    twin: () => formulaContesto(rng),
  };
}

// ---------------------------------------------------------------------------------------------
export default {
  id: 'proporzionalita',
  area: 'numeri',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_K2', 'MAT_A2', 'MAT_C2'],
  ambito: 'Relazioni e funzioni',
  title: 'Proporzionalità diretta e inversa',
  summary: 'Diretta, inversa o nessuna? Tabelle, grafici e problemi di realtà e di laboratorio.',
  glyph: 'k/x',
  levels: [
    { name: 'Diretta o inversa?', desc: 'Il test del raddoppio su situazioni vere' },
    { name: 'Tabelle e costante', desc: 'Rapporto costante, prodotto costante' },
    { name: 'Problemi di tutti i giorni', desc: 'Prima capisci il legame, poi calcola' },
    { name: 'Al lavoro', desc: 'Problemi del tuo laboratorio' },
    { name: 'Grafici e formule', desc: 'Retta, iperbole e tranelli' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Il test del raddoppio', body: 'Raddoppia una grandezza e guarda l\'altra. Se raddoppia anche lei è una <b>proporzionalità diretta</b>: resta costante il rapporto. Se si dimezza è una <b>proporzionalità inversa</b>: resta costante il prodotto. Se fa qualcos\'altro, non c\'è proporzionalità.' },
        raddoppio(rng), smista(rng, 'tutti'), raddoppio(rng), tabellaTipo(rng), raddoppio(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'Rapporto o prodotto?', body: 'Diretta: $\\dfrac{y}{x} = k$, cioè $y = kx$. Inversa: $x\\cdot y = k$, cioè $y = \\dfrac{k}{x}$. Il numero $k$ è la <b>costante di proporzionalità</b>: trovala con una coppia, controllala con un\'altra.' },
        completa(rng), costante(rng), completa(rng), formula(rng), tabellaTipo(rng),
      ];
    }
    if (level === 3) {
      const tipi = rng.shuffle(['d', 'd', 'i', 'i']);
      return [
        { type: 'learn', title: 'Prima il legame, poi il conto', body: '1. Chiediti: se la prima grandezza raddoppia, la seconda raddoppia o si dimezza? 2. Diretta: calcola il valore per uno e moltiplica. Inversa: calcola il prodotto e dividi. 3. Controlla: il risultato cresce o cala come ti aspetti?' },
        problema(rng, 'vita', tipi[0]), problema(rng, 'vita', tipi[1]), quotaFissa(rng, 'vita'), problema(rng, 'vita', tipi[2]), problema(rng, 'vita', tipi[3]),
      ];
    }
    if (level === 4) {
      const tipi = rng.shuffle(['d', 'd', 'i', 'i']);
      return [
        { type: 'learn', title: 'Proporzioni in laboratorio', body: 'Ruote dentate, resistori, tessuti, stampe, dosi, servizi: in ogni laboratorio ci sono grandezze direttamente o inversamente proporzionali. Il metodo è lo stesso: prima il legame, poi il conto. Attenzione alle quote fisse.' },
        problema(rng, 'lavoro', tipi[0]), smista(rng, 'lavoro'), problema(rng, 'lavoro', tipi[1]), problema(rng, 'lavoro', tipi[2]), quotaFissa(rng, 'lavoro'), problema(rng, 'lavoro', tipi[3]),
      ];
    }
    return [
      { type: 'learn', title: 'Retta o iperbole', body: 'Il grafico di una proporzionalità diretta è una <b>retta che passa per l\'origine</b>; quello di una inversa è un <b>ramo di iperbole</b>, che si avvicina agli assi senza toccarli. Attenzione: una retta che scende non è una proporzionalità inversa, e una retta che non passa per l\'origine non è una diretta.' },
      tabellaTipo(rng, { soloGrafico: true }), smistaFormule(rng), tabellaTipo(rng, { soloGrafico: true }), formulaContesto(rng), formulaContesto(rng),
    ];
  },
};

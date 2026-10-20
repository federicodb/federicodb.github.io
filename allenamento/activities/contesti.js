// CONTESTI DEI PROBLEMI — indirizzi di studio dell'IPIA «E. Orfini» e matematica della vita reale.
//
// Se lo studente sceglie il suo indirizzo, i problemi "con le parole" usano situazioni del suo
// laboratorio e del suo futuro lavoro (profilo in uscita, D.M. 92/2018, Allegato 2) e compare
// l'attività "Matematica al lavoro" del suo indirizzo.
// Se non lo sceglie, nessuna personalizzazione di indirizzo: i problemi usano situazioni della
// vita di tutti i giorni (spesa, bollette, viaggi, sport, risparmio).
//
// Le attività chiedono un contesto con  scene(rng, 'chiave')  e ricevono un elemento coerente
// con l'indirizzo attivo. Ogni chiave deve esistere in VITA; gli indirizzi possono ridefinirla.

let current = null;

/** Imposta l'indirizzo attivo (null = matematica della vita reale) */
export function setIndirizzo(id) {
  current = INDIRIZZI_BY_ID[id] ? id : null;
}
export function indirizzoAttivo() {
  return current;
}
/** Un contesto a caso per la chiave richiesta, preso dall'indirizzo attivo */
// Classe dello studente attivo (1–5). I generatori scelgono fasce di numeri e strategie adatte alla classe,
// sempre risolvibili a mente: la difficoltà cresce nel ragionamento e negli schemi da riconoscere
// (15% = 10% + 5%, 37,5% = 3/8…), non nella pesantezza dei conti. Nessuna classe scelta vale come la prima.
let currentYear = null;
export function setClasse(y) { currentYear = Number.isInteger(y) && y >= 1 && y <= 5 ? y : null; }
export function classe() { return currentYear || 1; }
/** perClasse({ 1: a, 3: b, 4: c }): la fascia della classe attiva, cioè la più alta che non supera la classe */
export function perClasse(bands) {
  const keys = Object.keys(bands).map(Number).sort((a, b) => a - b);
  let best = bands[keys[0]];
  for (const k of keys) if (k <= classe()) best = bands[k];
  return best;
}

export function scene(rng, key) {
  const own = current ? INDIRIZZI_BY_ID[current].pools[key] : null;
  return rng.pick(own && own.length ? own : VITA.pools[key]);
}

// ----------------------------------------------------------------------------------------------
// Vita reale (nessun indirizzo scelto)
// ----------------------------------------------------------------------------------------------
export const VITA = {
  id: null,
  name: 'Matematica di tutti i giorni',
  pools: {
    // "Su N {tot}, il p% {uno}" · "Su N {tot}, i n/d {molti}"
    gruppo: [
      { tot: 'studenti dell\'istituto', uno: 'viene a scuola in autobus', molti: 'vengono a scuola in autobus' },
      { tot: 'iscritti a un torneo di videogiochi', uno: 'arriva alla fase finale', molti: 'arrivano alla fase finale' },
      { tot: 'euro di paghetta del mese', uno: 'va in ricariche e abbonamenti', molti: 'vanno in ricariche e abbonamenti', q: 'Quanti euro sono?' },
      { tot: 'minuti di allenamento', uno: 'è dedicato alla corsa', molti: 'sono dedicati alla corsa', q: 'Quanti minuti sono?' },
    ],
    prezzo: ['una felpa', 'uno zaino', 'un paio di cuffie wireless', 'un paio di sneakers', 'una giacca a vento'],
    aumento: ['L\'abbonamento in palestra', 'La bolletta della luce', 'Il biglietto del concerto', 'L\'abbonamento annuale dell\'autobus'],
    squadra: [['amici', 'tinteggiare una stanza'], ['volontari', 'allestire la festa del quartiere'], ['studenti', 'preparare la mostra di fine anno']],
    dati: [
      { intro: 'Dati raccolti in classe', what: 'minuti di viaggio da casa a scuola', min: 8, max: 55 },
      { intro: 'Dati raccolti in classe', what: 'euro spesi in una settimana', min: 5, max: 40 },
      { intro: 'Dati raccolti in classe', what: 'messaggi ricevuti in un\'ora', min: 3, max: 40 },
    ],
    categorie: [
      { q: 'Come vieni a scuola?', labels: ['Bus', 'Treno', 'Auto', 'Bici', 'A piedi'] },
      { q: 'Che sport pratichi?', labels: ['Calcio', 'Volley', 'Basket', 'Nuoto', 'Palestra'] },
      { q: 'Che musica ascolti di più?', labels: ['Pop', 'Rap', 'Rock', 'Elettronica', 'Indie'] },
    ],
    evento: ['domani piova', 'il treno sia in ritardo', 'la tua squadra perda la partita'],
    rettangolo: ['Uno schermo rettangolare', 'Un\'aiuola rettangolare', 'Un tappeto rettangolare'],
    vasca: ['un acquario', 'una cassetta per l\'orto', 'un serbatoio per l\'acqua piovana'],
    alto: [['un albero', 'l\'albero'], ['il campanile', 'il campanile'], ['un lampione', 'il lampione']],
    tariffa: [
      { s: 'Il noleggio di un monopattino', u: 'minuti', fixed: [1, 1.5], per: [0.15, 0.2, 0.25], n: [10, 40] },
      { s: 'Una palestra', u: 'ingressi', fixed: [20, 25, 30], per: [2, 3, 4], n: [6, 20] },
      { s: 'Un parcheggio', u: 'ore', fixed: [1, 2], per: [1.5, 2], n: [2, 10] },
    ],
    prodotto: ['magliette personalizzate', 'tazze serigrafate', 'cover per smartphone'],
    // notazione scientifica: e = [esponente minimo, massimo] realistico per quella grandezza
    grande: [
      { t: 'I byte di un archivio di foto sono circa', e: [8, 10] },
      { t: 'Le visualizzazioni di un video virale sono circa', e: [6, 8] },
      { t: 'Gli spettatori di una finale in TV sono circa', e: [6, 7] },
    ],
    piccolo: [
      { t: 'Lo spessore di un foglio di carta, in metri, è circa', e: [-4, -4] },
      { t: 'Lo spessore di un capello, in metri, è circa', e: [-5, -4] },
      { t: 'Il diametro di un granello di polline, in metri, è circa', e: [-5, -5] },
    ],
  },
};

// ----------------------------------------------------------------------------------------------
// Indirizzi dell'IIS «E. Orfini» di Foligno (www.iisorfini.edu.it, PTOF 2025-2028):
// nome usato dalla scuola e denominazione ufficiale. Il corso serale ha Produzioni tessili-sartoriali
// (→ Fashion Factory) e Servizi socio-sanitari.
// pecup: competenze in uscita dichiarate dalla scuola a cui la matematica contribuisce
// focus: attività del curricolo comune più utili per l'indirizzo, con il perché
// ----------------------------------------------------------------------------------------------
export const INDIRIZZI = [
  {
    id: 'meccanico',
    name: 'Meccanico',
    official: 'Industria e artigianato per il Made in Italy, declinazione Meccanica',
    glyph: '⚙',
    pecup: [
      'Leggere e interpretare un disegno tecnico',
      'Definire il ciclo produttivo nel rispetto di economicità, qualità e sicurezza',
      'Usare CAD, CAM, CNC, modellazione solida e prototipazione',
    ],
    focus: {
      proporzioni: 'Scale del disegno tecnico e rapporti di trasmissione',
      'notazione-scientifica': 'Tolleranze e grandezze molto piccole',
      pitagora: 'Quote e diagonali nei pezzi meccanici',
      solidi: 'Volumi e masse dei pezzi',
      trigonometria: 'Smussi, conicità e angoli di lavorazione',
      'funzioni-lineari': 'Costi e tempi di produzione',
      'problemi-scelta': 'Convenienza tra due lavorazioni',
      statistica: 'Controllo qualità sui pezzi prodotti',
    },
    pools: {
      gruppo: [
        { tot: 'pezzi torniti in un turno', uno: 'viene scartato al controllo qualità', molti: 'vengono scartati al controllo qualità' },
        { tot: 'bulloni di una fornitura', uno: 'è in acciaio inox', molti: 'sono in acciaio inox' },
        { tot: 'ore di laboratorio dell\'anno', uno: 'si svolge alle macchine CNC', molti: 'si svolgono alle macchine CNC', q: 'Quante ore sono?' },
        { tot: 'minuti di un ciclo di lavorazione', uno: 'serve per attrezzare la macchina', molti: 'servono per attrezzare la macchina', q: 'Quanti minuti sono?' },
      ],
      prezzo: ['un calibro digitale', 'un set di frese', 'una morsa da banco', 'una chiave dinamometrica'],
      aumento: ['Una fornitura di barre d\'acciaio', 'Il costo di un\'ora di lavorazione CNC', 'Una scatola di inserti per tornio'],
      squadra: [['operai', 'montare una linea di assemblaggio'], ['tecnici', 'revisionare le macchine utensili']],
      dati: [
        { intro: 'Rilevazione in officina', what: 'minuti per completare un pezzo al tornio', min: 8, max: 30 },
        { intro: 'Rilevazione in officina', what: 'pezzi prodotti in ogni turno', min: 20, max: 60 },
      ],
      categorie: [
        { q: 'Quale lavorazione preferisci?', labels: ['Tornio', 'Fresa', 'Saldatura', 'CAD', 'Montaggio'] },
        { q: 'Quale macchina hai usato di più in stage?', labels: ['Tornio', 'Trapano', 'Fresa', 'Pressa', 'CNC'] },
      ],
      evento: ['un pezzo sia difettoso', 'un utensile si rompa durante il turno'],
      rettangolo: ['Una piastra d\'acciaio', 'Il piano di un banco da lavoro'],
      vasca: ['una vasca per il raffreddamento dei pezzi', 'un serbatoio per l\'olio da taglio'],
      alto: [['il capannone dell\'officina', 'il capannone'], ['una gru da cantiere', 'la gru']],
      tariffa: [
        { s: 'Il noleggio di un compressore', u: 'ore', fixed: [20, 25, 30], per: [4, 5, 6], n: [3, 12] },
        { s: 'Una lavorazione al taglio laser', u: 'pezzi', fixed: [40, 50, 60], per: [1.5, 2, 2.5], n: [10, 60] },
      ],
      prodotto: ['portachiavi stampati in 3D', 'supporti in alluminio fresati'],
      grande: [
        { t: 'I giri compiuti in un anno dal mandrino di un tornio sono circa', e: [7, 8] },
        { t: 'I pezzi prodotti in un anno da una linea automatica sono circa', e: [5, 6] },
      ],
      piccolo: [
        { t: 'Una tolleranza di lavorazione, in metri, è circa', e: [-5, -4] },
        { t: 'La rugosità di una superficie rettificata, in metri, è circa', e: [-7, -6] },
      ],
    },
  },
  {
    id: 'elettrico',
    name: 'Elettrico-Elettronico',
    official: 'Manutenzione e assistenza tecnica: apparati, impianti e servizi tecnici industriali e civili',
    glyph: '⚡',
    pecup: [
      'Leggere e interpretare gli schemi degli impianti',
      'Installare, collaudare e mettere a punto impianti e macchine',
      'Usare strumenti di misura e diagnosi e gestire i costi degli interventi',
    ],
    focus: {
      proporzioni: 'Legge di Ohm e proporzionalità diretta e inversa',
      'notazione-scientifica': 'Milliampere, microfarad, gigahertz',
      'equazioni-1': 'Ricavare una grandezza da una formula',
      'funzioni-lineari': 'Caratteristica di un resistore e tariffe dell\'energia',
      goniometria: 'Tensione alternata sinusoidale',
      esponenziali: 'Carica e scarica di un condensatore',
      logaritmi: 'Decibel e guadagno degli amplificatori',
      statistica: 'Misure ripetute ed errori',
    },
    pools: {
      gruppo: [
        { tot: 'punti luce di un impianto', uno: 'è a LED', molti: 'sono a LED' },
        { tot: 'interventi di manutenzione del mese', uno: 'riguarda i quadri elettrici', molti: 'riguardano i quadri elettrici' },
        { tot: 'metri di cavo acquistati', uno: 'serve per la linea delle prese', molti: 'servono per la linea delle prese', q: 'Quanti metri sono?' },
        { tot: 'componenti testati', uno: 'risulta fuori tolleranza', molti: 'risultano fuori tolleranza' },
      ],
      prezzo: ['un multimetro', 'una pinza amperometrica', 'una stazione saldante', 'un set di cacciaviti isolati'],
      aumento: ['Il costo di un quadro elettrico', 'Una bobina di cavo', 'Il costo di un intervento di manutenzione'],
      squadra: [['elettricisti', 'cablare un quadro elettrico'], ['tecnici', 'installare l\'impianto di un appartamento']],
      dati: [
        { intro: 'Rilevazione in laboratorio', what: 'minuti per un intervento di manutenzione', min: 15, max: 60 },
        { intro: 'Rilevazione in laboratorio', what: 'potenza assorbita da alcuni apparecchi, in watt', min: 10, max: 60 },
      ],
      categorie: [
        { q: 'Quale impianto ti piace di più?', labels: ['Civile', 'Industriale', 'Domotica', 'Fotovoltaico', 'Allarmi'] },
      ],
      evento: ['un componente sia guasto', 'un interruttore differenziale scatti durante la prova'],
      rettangolo: ['Un pannello solare', 'Il frontale di un quadro elettrico'],
      vasca: ['un serbatoio di accumulo dell\'acqua calda', 'un serbatoio di un impianto solare termico'],
      alto: [['un palo della linea elettrica', 'il palo'], ['un traliccio', 'il traliccio']],
      tariffa: [
        { s: 'Un intervento di un elettricista', u: 'ore', fixed: [30, 40], per: [25, 30, 35], n: [2, 8] },
        { s: 'Una bolletta della luce', u: 'kWh', fixed: [8, 10, 12], per: [0.2, 0.25, 0.3], n: [100, 300] },
      ],
      prodotto: ['lampade LED da scrivania', 'caricabatterie solari'],
      grande: [
        { t: 'I transistor di un chip sono circa', e: [8, 10] },
        { t: 'La frequenza di una rete wi-fi, in hertz, è circa', e: [9, 9] },
      ],
      piccolo: [
        { t: 'La corrente in un sensore, in ampere, è circa', e: [-6, -3] },
        { t: 'La capacità di un condensatore, in farad, è circa', e: [-8, -5] },
      ],
    },
  },
  {
    id: 'moda',
    name: 'Fashion Factory',
    official: 'Industria e artigianato per il Made in Italy, curricolo Fashion Factory',
    glyph: '✂',
    pecup: [
      'Riconoscere e selezionare i materiali per progettare una collezione',
      'Usare software per disegno e modellistica',
      'Gestire il ciclo produttivo e la vendita di capi e accessori',
    ],
    focus: {
      proporzioni: 'Scale del figurino e sviluppo delle taglie',
      percentuali: 'Ricarichi, sconti e scarti di tessuto',
      'aree-perimetri': 'Consumo di tessuto e piazzamento',
      similitudine: 'Ingrandire e ridurre un cartamodello',
      'funzioni-lineari': 'Costi fissi e variabili di una produzione',
      'problemi-scelta': 'Quanti capi vendere per andare in pareggio',
      statistica: 'Misure del corpo e tabelle delle taglie',
    },
    pools: {
      gruppo: [
        { tot: 'capi della collezione', uno: 'è in tessuto riciclato', molti: 'sono in tessuto riciclato' },
        { tot: 'metri di tessuto acquistati', uno: 'serve per le fodere', molti: 'servono per le fodere', q: 'Quanti metri sono?' },
        { tot: 'capi cuciti in laboratorio', uno: 'richiede una correzione dopo la prova', molti: 'richiedono una correzione dopo la prova' },
      ],
      prezzo: ['un rotolo di tessuto', 'un paio di forbici da sarto', 'un manichino da sartoria', 'una macchina da cucire portatile'],
      aumento: ['Un rotolo di tessuto', 'Il prezzo di una giacca della collezione', 'Una fornitura di cerniere'],
      squadra: [['sarte', 'confezionare un ordine di camicie'], ['modellisti', 'preparare i cartamodelli della collezione']],
      dati: [
        { intro: 'Rilevazione in laboratorio', what: 'minuti per cucire una camicia', min: 25, max: 60 },
        { intro: 'Misure prese in classe', what: 'centimetri di circonferenza vita', min: 60, max: 92 },
      ],
      categorie: [
        { q: 'Quale tessuto preferisci?', labels: ['Cotone', 'Lino', 'Lana', 'Seta', 'Denim'] },
        { q: 'Quale capo vorresti progettare?', labels: ['Giacca', 'Abito', 'Gonna', 'Camicia', 'Pantalone'] },
      ],
      evento: ['un rotolo di tessuto abbia un difetto', 'un capo debba essere modificato dopo la prova'],
      rettangolo: ['Un telo di tessuto', 'Un pannello di stoffa per una tenda'],
      vasca: ['una vasca per la tintura dei tessuti', 'una vasca per il lavaggio dei campioni'],
      alto: [['il palazzo della sfilata', 'il palazzo'], ['un albero del cortile', 'l\'albero']],
      tariffa: [
        { s: 'Un laboratorio di ricamo', u: 'capi', fixed: [30, 40, 50], per: [3, 4, 5], n: [10, 50] },
        { s: 'Un servizio di taglio dei tessuti', u: 'metri', fixed: [15, 20], per: [1.5, 2, 2.5], n: [10, 60] },
      ],
      prodotto: ['borse in tessuto riciclato', 'foulard stampati'],
      grande: [
        { t: 'I metri di filo prodotti in un anno da una filatura sono circa', e: [6, 8] },
        { t: 'I capi venduti in un anno da un grande marchio sono circa', e: [6, 7] },
      ],
      piccolo: [
        { t: 'Il diametro di una fibra di seta, in metri, è circa', e: [-5, -5] },
        { t: 'Lo spessore di un filo di cotone, in metri, è circa', e: [-4, -4] },
      ],
    },
  },
  {
    id: 'grafica',
    name: 'Graphic Design',
    official: 'Servizi commerciali, percorso Design della comunicazione visiva e pubblicitaria',
    glyph: 'Aa',
    pecup: [
      'Pianificare ed elaborare progetti di comunicazione visiva',
      'Applicare strategie comunicative tradizionali e digitali',
      'Collaborare ad azioni di marketing e valutare le campagne pubblicitarie',
    ],
    focus: {
      proporzioni: 'Formati, rapporti d\'aspetto e ridimensionamenti',
      percentuali: 'Preventivi, IVA e risultati delle campagne',
      similitudine: 'Ingrandire un\'immagine senza deformarla',
      'notazione-scientifica': 'Pixel, byte e visualizzazioni',
      statistica: 'Leggere i dati di una campagna',
      esponenziali: 'Crescita dei follower e diffusione virale',
      'funzioni-lineari': 'Costi di stampa e tariffe',
    },
    pools: {
      gruppo: [
        { tot: 'visualizzazioni di un post', uno: 'arriva da smartphone', molti: 'arrivano da smartphone' },
        { tot: 'copie di un volantino', uno: 'finisce nei negozi del centro', molti: 'finiscono nei negozi del centro' },
        { tot: 'iscritti alla newsletter', uno: 'apre l\'ultima email', molti: 'aprono l\'ultima email' },
        { tot: 'ore di un progetto grafico', uno: 'va nella fase di bozza', molti: 'vanno nella fase di bozza', q: 'Quante ore sono?' },
      ],
      prezzo: ['una tavoletta grafica', 'un set di pennarelli professionali', 'un hard disk esterno', 'un monitor calibrato'],
      aumento: ['Il preventivo per un logo', 'La stampa di 500 volantini', 'L\'abbonamento a un software di grafica'],
      squadra: [['grafici', 'impaginare un catalogo'], ['allestitori', 'montare uno stand in fiera']],
      dati: [
        { intro: 'Dati di una campagna', what: 'like ricevuti dai post della settimana', min: 10, max: 80 },
        { intro: 'Rilevazione in laboratorio', what: 'minuti per impaginare una pagina', min: 10, max: 40 },
      ],
      categorie: [
        { q: 'Quale programma usi di più?', labels: ['Illustrator', 'Photoshop', 'InDesign', 'Figma', 'Canva'] },
        { q: 'Che social usi di più?', labels: ['Instagram', 'TikTok', 'YouTube', 'WhatsApp', 'Twitch'] },
      ],
      evento: ['un utente clicchi sull\'annuncio', 'un file di stampa contenga un errore'],
      rettangolo: ['Un manifesto', 'Un pannello pubblicitario'],
      vasca: ['una vasca per la serigrafia', 'una vasca per lo sviluppo dei telai serigrafici'],
      alto: [['un cartellone pubblicitario', 'il cartellone'], ['l\'insegna di un centro commerciale', 'l\'insegna']],
      tariffa: [
        { s: 'Una tipografia', u: 'copie', fixed: [20, 25, 30], per: [0.1, 0.15, 0.2], n: [100, 500] },
        { s: 'Una campagna sponsorizzata', u: 'giorni', fixed: [10, 15], per: [5, 8, 10], n: [5, 20] },
      ],
      prodotto: ['poster illustrati', 'set di adesivi'],
      grande: [
        { t: 'I pixel di uno schermo ad altissima risoluzione sono circa', e: [6, 7] },
        { t: 'Le visualizzazioni di una campagna online sono circa', e: [5, 7] },
      ],
      piccolo: [
        { t: 'Il lato di un pixel di uno smartphone, in metri, è circa', e: [-5, -5] },
        { t: 'Il diametro di un punto di retino di stampa, in metri, è circa', e: [-5, -4] },
      ],
    },
  },
  {
    id: 'odonto',
    name: 'Odontotecnico',
    official: 'Arti ausiliarie delle professioni sanitarie: Odontotecnico',
    glyph: '◇',
    pecup: [
      'Costruire protesi secondo le indicazioni dell\'odontoiatra',
      'Eseguire lavorazioni in gesso, sviluppare impronte, impiegare materiali e leghe',
      'Usare strumenti di precisione e software di modellazione odontotecnica',
    ],
    focus: {
      proporzioni: 'Dosi di polvere e liquido, scale dei modelli',
      percentuali: 'Composizione delle leghe e ritiro dei materiali',
      'notazione-scientifica': 'Micron e precisione degli scanner',
      solidi: 'Volumi e masse dei manufatti',
      similitudine: 'Ingrandimenti e modelli in scala',
      statistica: 'Misure ripetute e controllo della precisione',
      esponenziali: 'Crescita dei batteri e disinfezione',
    },
    pools: {
      gruppo: [
        { tot: 'grammi di una lega dentale', uno: 'è oro', molti: 'sono oro', q: 'Quanti grammi sono?' },
        { tot: 'manufatti consegnati nel mese', uno: 'è una corona in zirconia', molti: 'sono corone in zirconia' },
        { tot: 'ore di laboratorio settimanali', uno: 'serve per la modellazione digitale', molti: 'servono per la modellazione digitale', q: 'Quante ore sono?' },
        { tot: 'impronte ricevute', uno: 'è digitale', molti: 'sono digitali' },
      ],
      prezzo: ['un set di spatole per ceramica', 'una confezione di gesso extraduro', 'un micromotore da laboratorio', 'una lampada fotopolimerizzatrice'],
      aumento: ['Una confezione di dischi in zirconia', 'Il listino di una corona in ceramica', 'Una fornitura di gesso'],
      squadra: [['odontotecnici', 'completare un ordine di protesi'], ['tecnici', 'rifinire una serie di bite']],
      dati: [
        { intro: 'Rilevazione in laboratorio', what: 'minuti per modellare una corona', min: 20, max: 55 },
        { intro: 'Rilevazione in laboratorio', what: 'manufatti consegnati ogni giorno', min: 5, max: 20 },
      ],
      categorie: [
        { q: 'Quale materiale preferisci lavorare?', labels: ['Zirconia', 'Ceramica', 'Resina', 'Metallo', 'Cera'] },
      ],
      evento: ['una corona debba essere ritoccata', 'un\'impronta sia da rifare'],
      rettangolo: ['Il piano di un banco da laboratorio', 'Un pannello fonoassorbente'],
      vasca: ['un serbatoio di acqua demineralizzata', 'una vasca per il lavaggio dei modelli'],
      alto: [['l\'edificio del laboratorio', 'l\'edificio'], ['un albero del cortile', 'l\'albero']],
      tariffa: [
        { s: 'Il noleggio di una fresatrice', u: 'ore', fixed: [50, 60], per: [12, 15, 20], n: [2, 10] },
        { s: 'Un corriere per le impronte', u: 'consegne', fixed: [10, 15, 20], per: [4, 5, 6], n: [5, 20] },
      ],
      prodotto: ['modellini didattici in resina', 'portaspazzolini stampati in 3D'],
      grande: [
        { t: 'I batteri in un millilitro di saliva sono circa', e: [7, 8] },
        { t: 'I cicli di masticazione in un anno sono circa', e: [5, 6] },
      ],
      piccolo: [
        { t: 'La precisione di uno scanner intraorale, in metri, è circa', e: [-5, -5] },
        { t: 'Il diametro di un granulo di zirconia, in metri, è circa', e: [-7, -6] },
      ],
    },
  },
  {
    id: 'socio',
    name: 'Servizi Socio-Sanitari',
    official: 'Servizi per la sanità e l\'assistenza sociale',
    glyph: '♡',
    pecup: [
      'Rilevare i bisogni socio-sanitari del territorio',
      'Assistere bambini, persone con disabilità e anziani e curarne l\'ambiente di vita',
      'Registrare, archiviare e trasmettere dati per il monitoraggio dei servizi',
    ],
    focus: {
      percentuali: 'Dati sulla popolazione e sui servizi',
      proporzioni: 'Diluizioni, porzioni e ricette per la mensa',
      statistica: 'Indagini sul territorio, medie e grafici',
      probabilita: 'Leggere rischi e previsioni',
      'funzioni-lineari': 'Tariffe e costi dei servizi',
      esponenziali: 'Andamento della popolazione e dei contagi',
      'aree-perimetri': 'Spazi accessibili e ambienti di vita',
    },
    pools: {
      gruppo: [
        { tot: 'ospiti di una residenza per anziani', uno: 'partecipa al laboratorio di musica', molti: 'partecipano al laboratorio di musica' },
        { tot: 'bambini di un centro estivo', uno: 'pranza alla mensa', molti: 'pranzano alla mensa' },
        { tot: 'ore di servizio settimanali', uno: 'si svolge a domicilio', molti: 'si svolgono a domicilio', q: 'Quante ore sono?' },
        { tot: 'utenti del trasporto sociale', uno: 'usa la carrozzina', molti: 'usano la carrozzina' },
      ],
      prezzo: ['un saturimetro', 'un kit di primo soccorso', 'un set di giochi educativi', 'un cuscino antidecubito'],
      aumento: ['La retta mensile del centro diurno', 'Il costo di un\'ora di assistenza domiciliare', 'L\'abbonamento al trasporto sociale'],
      squadra: [['operatori', 'preparare la sala per la festa della residenza'], ['volontari', 'consegnare i pasti a domicilio']],
      dati: [
        { intro: 'Indagine sul territorio', what: 'minuti di attesa allo sportello', min: 5, max: 40 },
        { intro: 'Dati della residenza', what: 'età degli ospiti', min: 68, max: 95 },
      ],
      categorie: [
        { q: 'Quale attività proponi agli ospiti?', labels: ['Musica', 'Pittura', 'Ginnastica', 'Giochi', 'Lettura'] },
        { q: 'Dove vorresti fare lo stage?', labels: ['Nido', 'Residenza', 'Centro diurno', 'Ospedale', 'Domicilio'] },
      ],
      evento: ['un ospite scelga l\'attività all\'aperto', 'piova il giorno della gita'],
      rettangolo: ['Il tappeto della sala giochi', 'Un orto rialzato per gli ospiti'],
      vasca: ['un serbatoio dell\'acqua per l\'orto della residenza', 'una piscina gonfiabile per il centro estivo'],
      alto: [['il campanile del paese', 'il campanile'], ['l\'albero del giardino della residenza', 'l\'albero']],
      tariffa: [
        { s: 'Un trasporto per persone con disabilità', u: 'chilometri', fixed: [5, 8, 10], per: [0.5, 0.6, 0.8], n: [10, 60] },
        { s: 'Un servizio di assistenza domiciliare', u: 'ore', fixed: [10, 15], per: [18, 20, 22], n: [3, 15] },
      ],
      prodotto: ['kit di giochi sensoriali', 'calendari illustrati per una raccolta fondi'],
      grande: [
        { t: 'Gli abitanti di una regione italiana sono circa', e: [5, 6] },
        { t: 'I battiti del cuore in un anno sono circa', e: [7, 7] },
      ],
      piccolo: [
        { t: 'Il diametro di un globulo rosso, in metri, è circa', e: [-6, -6] },
        { t: 'Il diametro di un virus, in metri, è circa', e: [-7, -7] },
      ],
    },
  },
];
export const INDIRIZZI_BY_ID = Object.fromEntries(INDIRIZZI.map((i) => [i.id, i]));

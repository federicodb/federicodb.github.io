/* CATALOGO COMPETENZE - RIFORMA PROFESSIONALI 2017 (D.Lgs 61/2017)
   Da utilizzare come riferimento per i TAG delle lezioni e la progettazione UDA.
*/

const catalogoCompetenze = {

    // 1. COMPETENZE CHIAVE EUROPEE (Raccomandazione UE 22/05/2018)
    europee: [
        { id: "EU_ALFA", label: "Competenza alfabetica funzionale", tag: "EU:Alfabetica" },
        { id: "EU_MULTI", label: "Competenza multilinguistica", tag: "EU:Multilinguistica" },
        { id: "EU_STEM",  label: "Competenza matematica e competenza in scienze, tecnologie e ingegneria", tag: "EU:STEM" },
        { id: "EU_DIGI",  label: "Competenza digitale", tag: "EU:Digitale" },
        { id: "EU_PERS",  label: "Competenza personale, sociale e capacità di imparare a imparare", tag: "EU:ImparareImparare" },
        { id: "EU_CITT",  label: "Competenza in materia di cittadinanza", tag: "EU:Cittadinanza" },
        { id: "EU_IMPR",  label: "Competenza imprenditoriale", tag: "EU:Imprenditoriale" },
        { id: "EU_CULT",  label: "Competenza in materia di consapevolezza ed espressione culturali", tag: "EU:Culturale" }
    ],

    // 2. ASSE MATEMATICO (Area di Istruzione Generale - D.Lgs 61/2017)
    // Riferimento: Risultato di Apprendimento Intermedio (Biennio) e Finale (Quinto Anno)
    matematica: {
        biennio: [
            { id: "MAT_B1", label: "Utilizzare le tecniche e le procedure del calcolo aritmetico ed algebrico", tag: "Mat:Calcolo" },
            { id: "MAT_B2", label: "Confrontare ed analizzare figure geometriche, individuando invarianti e relazioni", tag: "Mat:Geometria" },
            { id: "MAT_B3", label: "Individuare le strategie appropriate per la soluzione di problemi", tag: "Mat:ProblemSolving" },
            { id: "MAT_B4", label: "Analizzare dati e interpretarli sviluppando deduzioni e ragionamenti", tag: "Mat:Dati" }
        ],
        triennio: [
            { id: "MAT_T1", label: "Utilizzare il linguaggio e i metodi propri della matematica per organizzare e valutare informazioni qualitative e quantitative", tag: "Mat:Modellizzazione" },
            { id: "MAT_T2", label: "Applicare i concetti e i metodi dell'analisi matematica (funzioni, limiti, derivate, integrali) per risolvere problemi", tag: "Mat:Analisi" },
            { id: "MAT_T3", label: "Utilizzare i concetti e i modelli della probabilità e della statistica", tag: "Mat:Statistica" },
            { id: "MAT_T4", label: "Individuare e applicare modelli matematici a situazioni reali e contesti professionali", tag: "Mat:Realtà" }
        ]
    },

    // 3. EDUCAZIONE CIVICA (Legge 92/2019) - Trasversale
    civica: [
        { id: "CIV_COST", label: "Costituzione, diritto (nazionale e internazionale), legalità e solidarietà", tag: "Civ:Costituzione" },
        { id: "CIV_SOST", label: "Sviluppo sostenibile, educazione ambientale, conoscenza e tutela del patrimonio e del territorio", tag: "Civ:Sostenibilità" },
        { id: "CIV_DIGI", label: "Cittadinanza digitale", tag: "Civ:Digitale" }
    ],

    // 4. COMPETENZE DI INDIRIZZO (Area Tecnologica / Manutenzione - Esempio per 4EL)
    indirizzo: [
        { id: "IND_TEC1", label: "Analizzare e interpretare schemi e documentazione tecnica", tag: "Ind:SchemiTecnici" },
        { id: "IND_TEC2", label: "Utilizzare strumenti e tecnologie specifiche di settore", tag: "Ind:Strumentazione" },
        { id: "IND_TEC3", label: "Applicare la normativa sulla sicurezza e la tutela ambientale", tag: "Ind:Sicurezza" },
        { id: "IND_TEC4", label: "Collaborare alla gestione dei processi produttivi e di manutenzione", tag: "Ind:Processi" }
    ]
};

// Funzione helper per ottenere tutti i tag come array semplice (per l'autocompletamento o la ricerca)
function getAllTags() {
    let tags = [];
    Object.values(catalogoCompetenze.europee).forEach(c => tags.push(c.tag));
    Object.values(catalogoCompetenze.matematica.biennio).forEach(c => tags.push(c.tag));
    Object.values(catalogoCompetenze.matematica.triennio).forEach(c => tags.push(c.tag));
    Object.values(catalogoCompetenze.civica).forEach(c => tags.push(c.tag));
    Object.values(catalogoCompetenze.indirizzo).forEach(c => tags.push(c.tag));
    return tags;
}

// Esporta per Node.js (se usato in build.py) o Browser
if (typeof module !== 'undefined') module.exports = catalogoCompetenze;

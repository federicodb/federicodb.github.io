// CATALOGO DEL CURRICOLO — Orfini Math Quest
// Allineato a: D.Lgs. 61/2017 e D.M. 92/2018 (Allegato 1, area generale, asse matematico),
// codici del sito Orfini Math Lab (MAT_K1–K4 conoscenze, MAT_A1–A4 abilità, MAT_C1–C4 competenze),
// e agli ambiti delle prove INVALSI (Numeri, Relazioni e funzioni, Spazio e figure, Dati e previsioni).
//
// PER AGGIUNGERE UN'ATTIVITÀ: crea il file (copia activities/_modello.js), importalo qui
// e aggiungilo alla lista `activities` dell'area giusta. L'ordine è quello della mappa.

import frazioni from './numeri/frazioni.js';
import percentuali from './numeri/percentuali.js';
import potenze from './numeri/potenze.js';
import proporzioni from './numeri/proporzioni.js';
import notazione from './numeri/notazione-scientifica.js';
import radicali from './numeri/radicali.js';
import monomi from './polinomi/monomi.js';
import prodotti from './polinomi/prodotti-notevoli.js';
import scomposizioni from './polinomi/scomposizioni.js';
import eq1 from './equazioni/equazioni-primo-grado.js';
import dis1 from './equazioni/disequazioni-primo-grado.js';
import eq2 from './equazioni/equazioni-secondo-grado.js';
import dis2 from './equazioni/disequazioni-secondo-grado.js';
import lineari from './rette/funzioni-lineari.js';
import pendenza from './rette/retta-pendenza.js';
import parallele from './rette/rette-parallele-perpendicolari.js';
import sistemi from './sistemi/sistemi-lineari.js';
import aree from './geometria/aree-perimetri.js';
import pitagora from './geometria/pitagora.js';
import similitudine from './geometria/similitudine.js';
import solidi from './geometria/solidi.js';
import trigonometria from './geometria/trigonometria.js';
import statistica from './dati/statistica.js';
import probabilita from './dati/probabilita.js';
import combinatoria from './dati/combinatoria.js';
import parabola from './funzioni/parabola.js';
import esponenziali from './funzioni/esponenziali.js';
import logaritmi from './funzioni/logaritmi.js';
import goniometria from './funzioni/goniometria.js';
import studio from './funzioni/studio-funzione.js';
import scelta from './funzioni/problemi-scelta.js';
import { invalsi10, invalsi13 } from './invalsi/invalsi.js';
import vita from './lavoro/vita.js';
import meccanico from './lavoro/meccanico.js';
import elettrico from './lavoro/elettrico.js';
import moda from './lavoro/moda.js';
import grafica from './lavoro/grafica.js';
import odonto from './lavoro/odonto.js';
import socio from './lavoro/socio.js';
import { INDIRIZZI_BY_ID } from './contesti.js';

export const areas = [
  // matematica al lavoro: si vede solo l'attività dell'indirizzo scelto (o quella della vita reale)
  { id: 'lavoro', title: 'Matematica al lavoro', summary: 'Problemi veri del tuo indirizzo.', hue: 18, mat: 'MAT_C2', activities: [vita, meccanico, elettrico, moda, grafica, odonto, socio] },
  { id: 'numeri', title: 'Numeri', summary: 'Frazioni, percentuali, potenze, radicali.', hue: 190, mat: 'MAT_K1', activities: [frazioni, percentuali, potenze, proporzioni, notazione, radicali] },
  { id: 'polinomi', title: 'Polinomi', summary: 'Il calcolo con le lettere.', hue: 255, mat: 'MAT_K1', activities: [monomi, prodotti, scomposizioni] },
  { id: 'equazioni', title: 'Equazioni e disequazioni', summary: 'Primo e secondo grado.', hue: 285, mat: 'MAT_A3', activities: [eq1, dis1, eq2, dis2] },
  { id: 'rette', title: 'Funzioni lineari e rette', summary: 'Grafici, pendenze, rette nel piano.', hue: 160, mat: 'MAT_K2', activities: [lineari, pendenza, parallele] },
  { id: 'sistemi', title: 'Sistemi lineari', summary: 'Due equazioni, due incognite.', hue: 130, mat: 'MAT_A3', activities: [sistemi] },
  { id: 'geometria', title: 'Geometria', summary: 'Aree, solidi, Pitagora, trigonometria.', hue: 28, mat: 'MAT_K3', activities: [aree, pitagora, similitudine, solidi, trigonometria] },
  { id: 'dati', title: 'Dati e previsioni', summary: 'Statistica, probabilità, combinatoria.', hue: 335, mat: 'MAT_K4', activities: [statistica, probabilita, combinatoria] },
  { id: 'funzioni', title: 'Funzioni e modelli', summary: 'Parabola, esponenziali, logaritmi, goniometria, scelte.', hue: 210, mat: 'MAT_K2', activities: [parabola, esponenziali, logaritmi, goniometria, studio, scelta] },
  { id: 'invalsi', title: 'Allenamento INVALSI', summary: 'Quesiti nello stile delle prove di seconda e quinta.', hue: 48, mat: 'MAT_C1–C4', activities: [invalsi10, invalsi13] },
];

export const YEARS = [
  { y: 1, name: 'Prima', period: 'Primo biennio' },
  { y: 2, name: 'Seconda', period: 'Primo biennio' },
  { y: 3, name: 'Terza', period: 'Secondo biennio' },
  { y: 4, name: 'Quarta', period: 'Secondo biennio' },
  { y: 5, name: 'Quinta', period: 'Quinto anno' },
];

export const MAT_LABELS = {
  MAT_K1: 'Insiemi numerici e calcolo letterale',
  MAT_K2: 'Funzioni elementari e loro rappresentazione',
  MAT_K3: 'Geometria euclidea e analitica',
  MAT_K4: 'Statistica descrittiva e probabilità',
  MAT_A1: 'Eseguire calcoli con diversi insiemi numerici',
  MAT_A2: 'Rappresentare dati con tabelle, grafici e funzioni',
  MAT_A3: 'Risolvere equazioni, disequazioni e sistemi',
  MAT_A4: 'Applicare proprietà geometriche in contesti operativi',
  MAT_C1: 'Linguaggio e metodi della matematica',
  MAT_C2: 'Pensiero razionale in contesti reali',
  MAT_C3: 'Dati e strumenti statistici e probabilistici',
  MAT_C4: 'Modelli geometrici per interpretare la realtà',
};

export const allActivities = areas.flatMap((a) => a.activities.map((act) => ({ ...act, areaInfo: a, hue: a.hue })));
export const byId = Object.fromEntries(allActivities.map((a) => [a.id, a]));

/** L'attività "al lavoro" è visibile solo per il proprio indirizzo (il docente le vede tutte) */
export function visibleFor(act, indirizzo, teacher = false) {
  if (act.area !== 'lavoro' || teacher) return true;
  return (act.indirizzo ?? null) === (indirizzo ?? null);
}
/** Aree come le vede lo studente, con titolo dell'area "lavoro" adatto all'indirizzo */
export function areasFor(indirizzo, teacher = false) {
  return areas.map((a) => {
    if (a.id !== 'lavoro') return a;
    const ind = INDIRIZZI_BY_ID[indirizzo];
    return {
      ...a,
      title: ind ? `Matematica al lavoro: ${ind.name}` : 'Matematica di tutti i giorni',
      summary: ind ? 'Problemi veri del tuo laboratorio e della tua professione.' : 'Spesa, viaggi, bollette, risparmio.',
      activities: a.activities.filter((x) => visibleFor(x, indirizzo, teacher)),
    };
  });
}

/** Attività consigliate per un anno: quelle del suo anno, poi quelle degli anni precedenti da consolidare */
export function forYear(y) {
  return allActivities.filter((a) => a.years.includes(y));
}

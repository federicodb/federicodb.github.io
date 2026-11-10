// Genera catalogo.json da activities/catalogo.js: lo leggono build.py e le pagine del sito.
// Uso: node tools/genera-catalogo.mjs (dalla cartella della Quest)
import { writeFileSync } from 'node:fs';
import { allActivities, PREREQ, PAROLE } from '../activities/catalogo.js';

const catalogo = allActivities.map((a) => ({
  id: a.id,
  titolo: a.title,
  descrizione: a.summary ?? '', // riga dell'elenco del sito
  area: a.area,
  mat: Array.isArray(a.mat) ? a.mat : [a.mat],
  anni: a.years,
  ...(PREREQ[a.id]?.length ? { prereq: PREREQ[a.id] } : {}), // per il percorso "prima / dopo" delle schede del sito
  ...(a.area === 'lavoro' ? { indirizzo: a.indirizzo ?? null } : {}),
  parole: PAROLE[a.id] ?? (a.area === 'calcolo' ? ['calcolo-mentale'] : []), // parole chiave del sito (data/vocabolario.json)
}));

const out = new URL('../catalogo.json', import.meta.url);
writeFileSync(out, JSON.stringify(catalogo, null, 2) + '\n');
console.log(`catalogo.json: ${catalogo.length} attività`);

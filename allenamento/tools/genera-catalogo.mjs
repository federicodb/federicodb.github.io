// Genera catalogo.json da activities/catalogo.js: lo leggono build.py e le pagine del sito.
// Uso: node tools/genera-catalogo.mjs (dalla cartella della Quest)
import { writeFileSync } from 'node:fs';
import { allActivities } from '../activities/catalogo.js';

const catalogo = allActivities.map((a) => ({
  id: a.id,
  titolo: a.title,
  area: a.area,
  mat: Array.isArray(a.mat) ? a.mat : [a.mat],
  anni: a.years,
  ...(a.area === 'lavoro' ? { indirizzo: a.indirizzo ?? null } : {}),
}));

const out = new URL('../catalogo.json', import.meta.url);
writeFileSync(out, JSON.stringify(catalogo, null, 2) + '\n');
console.log(`catalogo.json: ${catalogo.length} attività`);

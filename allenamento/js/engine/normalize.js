// Normalizzazione della risposta prima della correzione.
// Obiettivo: accettare TUTTE le scritture ragionevoli di una risposta giusta.
//   "x = 3", "y = 2x+1", "f(x) = …"        → si toglie il membro sinistro
//   "25 dm", "12,50 €", "€ 12,50", "15 %"  → si tolgono le unità (solo dove serve un numero)
//   "1.250" (migliaia all'italiana)        → 1250
//   "b⁷", "10⁻⁴", "x²"                     → potenze
//   "3,2 x 10^5", "3,2 × 10^5"             → prodotto
//   "radice di 2", "pi greco"              → √2, π

const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const UNITS = [
  'cm²', 'cm2', 'cm³', 'cm3', 'cmq', 'mq', 'mc', 'm²', 'm2', 'm³', 'm3', 'dm²', 'dm2', 'dm³', 'dm3', 'mm²', 'mm', 'cm', 'dm', 'km/h', 'km', 'm/s', 'm',
  'kg', 'mg', 'g', 'ml', 'litri', 'litro', 'l', 'ore', 'ora', 'h', 'minuti', 'minuto', 'min', 'secondi', 's', 'anni', 'anno', 'giorni',
  'euro', 'eur', '€', '%', '°', 'gradi', 'grado', 'pezzi', 'pezzo', 'piastrelle', 'volte', 'quadretti', 'persone', 'studenti', 'partite', 'db', 'mol/l',
  'u', 'unità', 'punti',
];
const unitRe = new RegExp(`\\s*(?:${UNITS.map((u) => u.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|')})\\.?\\s*$`, 'i');

function superscripts(s) {
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => `^(${[...m].map((c) => SUP[c]).join('')})`);
}

/** Pulizia comune a numeri ed espressioni */
export function normalizeCommon(raw) {
  let s = String(raw ?? '').trim();
  s = s
    .replace(/[−‒–—]/g, '-')
    .replace(/[∙•·⋅]/g, '*')
    .replace(/×/g, '*')
    .replace(/÷/g, ':')
    .replace(/\bpi\s*greco\b/gi, 'π')
    .replace(/\bradice\s+(?:quadrata\s+)?di\s+/gi, '√')
    .replace(/\s+per\s+/gi, '*')
    .replace(/[₁₂]/g, '');
  // notazione esponenziale delle calcolatrici: 4.2e+7, 3E-5
  s = s.replace(/(\d+(?:[.,]\d+)?)[eE]([+-]?\d+)\b/g, '($1*10^($2))');
  s = superscripts(s);
  // membro sinistro "x =", "y =", "x1 =", "x_2 =", "f(x) =", "h =", "P =" …
  s = s.replace(/^\s*(?:[a-zA-Z](?:_?\d)?|[a-zA-Z]\s*\(\s*[a-zA-Z]\s*\)|[a-zA-Z]{1,3}_?[a-zA-Z]?)\s*=\s*/, '');
  // un eventuale "= …" finale (es. "2x+1 = y") non è previsto: lo lasciamo al parser
  return s;
}

/** Per le risposte numeriche: anche unità di misura e separatori delle migliaia */
export function normalizeNumber(raw) {
  // le unità si tolgono prima di convertire gli apici (cm² non deve diventare cm^2)
  let s = String(raw ?? '').trim().replace(/^\s*(?:€|eur|euro)\s*/i, '');
  for (let i = 0; i < 3; i++) s = s.replace(unitRe, '');
  s = normalizeCommon(s);
  // unità davanti ("€ 12") o dietro ("12 €", "25 dm", "3,5m")
  s = s.replace(/^\s*(?:€|eur|euro)\s*/i, '');
  for (let i = 0; i < 3; i++) s = s.replace(unitRe, '');
  s = s.trim();
  // "3,2 x 10^5"  → 3,2*10^5; "120 x 3" → 120*3 (x tra due numeri è un "per")
  s = s.replace(/(\d|\))\s*[xX]\s*(?=[\d(√π])/g, '$1*');
  // calcoli impostati a parole o con simboli da tastiera
  s = s.replace(/\*\*/g, '^').replace(/\[/g, '(').replace(/\]/g, ')');
  // "20% di 150", "3/4 di 80", "il 15% del prezzo…": percentuale e "di" diventano prodotti
  s = s.replace(/^(?:il|lo|la|l'|i|gli|le)\s*(?=\d)/i, '');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*%\s*(?:di|del|della|dei|delle|degli)?\s*(?=[\d(√π])/gi, '($1/100)*');
  s = s.replace(/([\d)])\s+(?:di|del|della|dei|delle|degli)\s+(?=[\d(√π])/gi, '$1*');
  // migliaia all'italiana: 1.250 / 12.500.000 / 1.250,5  (non 0.125, non 2.5)
  if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
  // migliaia con apostrofo o spazio stretto
  s = s.replace(/(\d)['  ](?=\d{3}\b)/g, '$1');
  return s;
}

/** Elenchi di numeri: separatori ; e "e", "oppure"; la virgola seguita da spazio separa (la virgola decimale no) */
export function splitNumberList(raw) {
  let s = String(raw ?? '').replace(/\s+(?:e|oppure|o|ed)\s+|∨|\|/gi, ';');
  s = normalizeCommon(s);
  s = s.replace(/[()[\]{}]/g, ' ');
  s = s.replace(/,\s+(?=[-+]?\s*[\d√π(])/g, ';');
  return s
    .split(';')
    .map((p) => p.replace(/^\s*[a-zA-Z](?:_?\d)?\s*=\s*/, '').trim())
    .filter(Boolean)
    .map(normalizeNumber);
}

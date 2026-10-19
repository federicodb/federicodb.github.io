// MATEMATICA AL LAVORO — Odontotecnico (Arti ausiliarie delle professioni sanitarie)
// Dosi di gesso e acqua, millimetri e micron, leghe e carati, ritiro della zirconia,
// massa di un manufatto, diluizioni, precisione delle misure, costo di un lavoro.
import { it, tx, euro } from '../../js/engine/helpers.js';
import { table, bars } from '../../js/gfx/svg.js';

// ---------- livello 1: dosi e misure ----------
function gessoAcqua(rng) {
  const r = rng.pick([20, 22, 24, 25, 30]);
  const g = rng.pick([50, 100, 150, 200, 250, 300]);
  const ml = (g * r) / 100;
  return {
    type: 'number', unit: 'ml', decimals: 1,
    prompt: `Le istruzioni di un gesso extraduro dicono: ${r} ml di acqua ogni 100 g di polvere. Quanti ml di acqua servono per ${g} g di polvere?`,
    answer: ml,
    traps: [{ value: (100 * r) / g, msg: 'Proporzione capovolta: più polvere richiede più acqua.' }].filter((t) => Math.abs(t.value - ml) > 0.05),
    hint: `$100 : ${r} = ${g} : x$`,
    explain: `$$x = \\dfrac{${r}\\cdot ${g}}{100} = ${tx(ml)}\\ \\text{ml}$$ Rispettare il rapporto acqua/polvere decide la durezza e l'espansione del modello.`,
    cas: { eval: `${r}*${g}/100` },
    twin: () => gessoAcqua(rng),
  };
}

function micron(rng) {
  const toMicron = rng.chance(0.5);
  const mm = rng.pick([0.02, 0.05, 0.08, 0.1, 0.15, 0.3, 0.5, 1.2]);
  const um = Math.round(mm * 1000);
  return {
    type: 'number', unit: toMicron ? 'µm' : 'mm',
    prompt: toMicron ? `Lo spessore minimo di una cappetta è ${it(mm)} mm. Quanto vale in micron (µm)? Ricorda: 1 mm = 1000 µm.` : `Lo spazio per il cemento è di ${um} µm. Quanto vale in millimetri? Ricorda: 1 mm = 1000 µm.`,
    answer: toMicron ? um : mm,
    traps: [{ value: toMicron ? mm / 1000 : um * 1000, msg: toMicron ? 'Il micron è più piccolo del millimetro: il numero deve diventare più grande.' : 'Il millimetro è più grande del micron: il numero deve diventare più piccolo.' }],
    hint: toMicron ? 'Moltiplica per 1000: la virgola si sposta di tre posti a destra.' : 'Dividi per 1000: la virgola si sposta di tre posti a sinistra.',
    explain: toMicron ? `$$${tx(mm)}\\cdot 1000 = ${um}\\ \\mu\\text{m}$$` : `$$${um} : 1000 = ${tx(mm)}\\ \\text{mm}$$`,
    twin: () => micron(rng),
  };
}

function scalaFoto(rng) {
  const k = rng.pick([2, 3, 4, 5]);
  const real = rng.pick([6, 7, 8, 9, 10, 11]);
  const shown = real * k;
  return {
    type: 'number', unit: 'mm',
    prompt: `In una foto ingrandita ${k} volte (scala ${k}:1) un incisivo è largo ${shown} mm. Quanto è largo il dente vero?`,
    answer: real,
    traps: [{ value: shown * k, msg: 'La foto è già ingrandita: per tornare alla misura vera si divide.' }],
    hint: `Dividi per ${k}.`,
    explain: `$$${shown} : ${k} = ${real}\\ \\text{mm}$$`,
    cas: { eval: `${shown}/${k}` },
    twin: () => scalaFoto(rng),
  };
}

// ---------- livello 2: materiali ----------
function lega(rng) {
  const p = rng.pick([40, 50, 60, 75, 80]);
  const m = rng.pick([4, 5, 8, 10, 12, 20]);
  const oro = (m * p) / 100;
  return {
    type: 'number', unit: 'g', decimals: 2,
    fig: bars(['oro', 'altri metalli'], [p, 100 - p], { unit: '%' }),
    prompt: `Una lega dentale contiene il ${p}% di oro. Per una fusione si usano ${m} g di lega. Quanti grammi di oro contiene?`,
    answer: oro,
    traps: [{ value: m - oro, msg: 'Questi sono gli altri metalli: la domanda chiede l\'oro.' }].filter((t) => t.value !== oro),
    hint: `$${tx(p / 100)}\\cdot ${m}$`,
    explain: `$$\\dfrac{${p}}{100}\\cdot ${m} = ${tx(oro)}\\ \\text{g}$$`,
    cas: { eval: `${p}/100*${m}` },
    twin: () => lega(rng),
  };
}

function carati(rng) {
  const k = rng.pick([6, 12, 18, 24, 9, 15]);
  const p = (k / 24) * 100;
  return {
    type: 'number', unit: '%', decimals: 1,
    prompt: `L'oro puro è a 24 carati. Che percentuale di oro contiene una lega a ${k} carati?`,
    answer: p,
    traps: [{ value: k, msg: 'I carati non sono una percentuale: sono ventiquattresimi.' }].filter((t) => t.value !== p),
    hint: `${k} carati = $\\dfrac{${k}}{24}$ di oro.`,
    explain: `$$\\dfrac{${k}}{24}\\cdot 100 = ${tx(p, 1)}\\%$$ L'oro "750" dei gioielli è a 18 carati: 750 parti su 1000.`,
    cas: { eval: `${k}/24*100` },
    twin: () => carati(rng),
  };
}

function ritiroZirconia(rng) {
  const s = rng.pick([20, 25]);
  const fin = rng.pick([6, 8, 9, 12, 15, 18, 24, 30]);
  const pre = fin / (1 - s / 100);
  return {
    type: 'number', unit: 'mm', decimals: 2,
    prompt: `Durante la sinterizzazione la zirconia si ritira del ${s}% in ogni direzione. Il ponte finito deve essere lungo ${fin} mm. Quanto va fresato lungo prima della cottura?`,
    answer: pre,
    traps: [{ value: fin * (1 + s / 100), msg: `Aggiungere il ${s}% non basta: il ritiro si calcola sulla misura prima della cottura, che è più grande.` }],
    hint: `Dopo la cottura resta il ${100 - s}%: $${tx(1 - s / 100)}\\cdot x = ${fin}$.`,
    explain: `$$x = \\dfrac{${fin}}{${tx(1 - s / 100)}} = ${tx(pre, 2)}\\ \\text{mm}$$ Il software CAD applica proprio questo ingrandimento prima di fresare.`,
    cas: { eval: `${fin}/(1-${s}/100)` },
    twin: () => ritiroZirconia(rng),
  };
}

// ---------- livello 3: laboratorio ----------
function diluizione(rng) {
  const c1 = rng.pick([10, 20, 25, 50]);
  const c2 = rng.pick([1, 2, 5]);
  const V2 = rng.pick([500, 1000, 2000]);
  const V1 = (c2 * V2) / c1;
  return {
    type: 'number', unit: 'ml',
    prompt: `Un disinfettante concentrato al ${c1}% va diluito per ottenere ${V2} ml di soluzione al ${c2}%. Quanti ml di concentrato servono? Usa $c_1\\cdot V_1 = c_2\\cdot V_2$.`,
    answer: V1,
    traps: [{ value: (c1 * V2) / c2, msg: 'La soluzione finale è meno concentrata: serve poco concentrato, non tanto.' }],
    hint: `$${c1}\\cdot V_1 = ${c2}\\cdot ${V2}$`,
    explain: `$$V_1 = \\dfrac{${c2}\\cdot ${V2}}{${c1}} = ${tx(V1)}\\ \\text{ml}$$ Il resto, ${tx(V2 - V1)} ml, è acqua.`,
    cas: { eval: `${c2}*${V2}/${c1}` },
    twin: () => diluizione(rng),
  };
}

function precisione(rng) {
  const lim = rng.pick([50, 80, 100]);
  const vals = rng.until(() => Array.from({ length: 5 }, () => rng.int(3, 12) * 10), (v) => v.reduce((a, b) => a + b, 0) % 5 === 0);
  const mean = vals.reduce((a, b) => a + b, 0) / 5;
  const max = Math.max(...vals);
  return {
    type: 'truefalse',
    fig: table(['Punto', 'A', 'B', 'C', 'D', 'E'], [['Fessura (µm)', ...vals]], { caption: 'Misure della chiusura marginale di una corona' }),
    prompt: `Il laboratorio accetta fessure fino a ${lim} µm. Vero o falso?`,
    statements: [
      { text: `La media delle fessure è ${it(mean)} µm`, value: true },
      { text: `Tutte le misure sono entro ${lim} µm`, value: max <= lim },
      { text: `La misura più grande è ${max} µm`, value: true },
    ].map((s, i) => (i === 0 && rng.chance(0.5) ? { text: `La media delle fessure è ${it(mean + 10)} µm`, value: false } : s)),
    hint: 'Somma le cinque misure e dividi per 5; poi controlla la più grande.',
    explain: `Somma: ${vals.join(' + ')} = ${vals.reduce((a, b) => a + b, 0)}; media: ${it(mean)} µm. La misura più grande è ${max} µm, ${max <= lim ? 'entro' : 'oltre'} il limite di ${lim} µm: la media da sola non basta per accettare un lavoro.`,
    twin: () => precisione(rng),
  };
}

function costoLavoro(rng) {
  const mat = rng.pick([20, 30, 40, 60]);
  const h = rng.pick([1, 1.5, 2, 3]);
  const t = rng.pick([20, 30, 40]);
  const r = rng.pick([20, 30, 50]);
  const costo = mat + h * t;
  const prezzo = costo * (1 + r / 100);
  return {
    type: 'number', unit: '€', decimals: 2,
    prompt: `Una corona richiede ${euro(mat)} di materiali e ${it(h)} ore di lavoro a ${euro(t)} l'ora. Il laboratorio aggiunge il ${r}% per spese generali e guadagno. Quale prezzo chiede all'odontoiatra?`,
    answer: prezzo,
    traps: [{ value: costo, msg: `Questo è il costo: aggiungi il ${r}%.` }, { value: mat + h * t * (1 + r / 100), msg: `Il ${r}% si applica a tutto il costo, materiali compresi.` }],
    hint: `Costo: $${mat} + ${tx(h)}\\cdot ${t} = ${tx(costo)}$ €.`,
    explain: `$$${mat} + ${tx(h)}\\cdot ${t} = ${tx(costo)}\\ € \\qquad ${tx(costo)}\\cdot ${tx(1 + r / 100)} = ${tx(prezzo)}\\ €$$`,
    cas: { eval: `(${mat}+${h}*${t})*(1+${r}/100)` },
    twin: () => costoLavoro(rng),
  };
}

export default {
  id: 'lavoro-odonto',
  area: 'lavoro',
  indirizzo: 'odonto',
  years: [1, 2, 3, 4, 5],
  mat: ['MAT_C2', 'MAT_A1'],
  ambito: 'Numeri',
  title: 'Matematica in laboratorio odontotecnico',
  summary: 'Gesso e acqua, micron, leghe e carati, ritiro della zirconia, diluizioni, costi.',
  glyph: '◇',
  levels: [
    { name: 'Dosi e misure', desc: 'Rapporto acqua/polvere, micron, ingrandimenti' },
    { name: 'Materiali', desc: 'Leghe, carati, ritiro in cottura' },
    { name: 'Il lavoro finito', desc: 'Diluizioni, precisione, prezzo' },
  ],
  generate(rng, level) {
    if (level === 1) {
      return [
        { type: 'learn', title: 'Precisione al micron', body: 'In laboratorio si lavora con proporzioni (acqua e polvere) e con misure piccolissime: 1 mm = 1000 µm (micron). Una corona ben fatta chiude con fessure di poche decine di micron.' },
        gessoAcqua(rng), micron(rng), scalaFoto(rng), gessoAcqua(rng), micron(rng),
      ];
    }
    if (level === 2) {
      return [
        { type: 'learn', title: 'Percentuali nei materiali', body: 'Una lega al 75% d\'oro contiene 75 g di oro ogni 100 g. La zirconia si ritira in cottura: se si ritira del 20%, del pezzo fresato resta l\'80%, quindi prima della cottura va fatto più grande, dividendo per 0,8.' },
        lega(rng), carati(rng), ritiroZirconia(rng), lega(rng), ritiroZirconia(rng),
      ];
    }
    return [
      { type: 'learn', title: 'Controllo e costi', body: 'Per diluire un prodotto: concentrazione × volume resta uguale ($c_1 V_1 = c_2 V_2$). Per valutare un lavoro non basta la media delle misure: conta anche la peggiore.' },
      diluizione(rng), precisione(rng), costoLavoro(rng), diluizione(rng), costoLavoro(rng),
    ];
  },
};

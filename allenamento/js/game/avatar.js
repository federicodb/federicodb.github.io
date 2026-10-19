// Avatar: una creatura geometrica personalizzabile (forma, colore, occhi, bocca, accessorio, adesivo, sfondo).
// Tutto in SVG disegnato qui, nessuna immagine esterna. Molti pezzi riprendono le espressioni e i simboli
// delle emoji più usate (occhi a cuore, linguaccia, fuoco, 100…), ridisegnati in stile geometrico.
// Si sbloccano con Δ nel negozio, con i traguardi (unlock), con la stagione e con i forzieri.
// unlock: { kind: 'level' | 'streak' | 'perfect' | 'speed' | 'league', n } -> regalo automatico al traguardo.

export const PARTS = {
  shape: [
    { id: 'circle', name: 'Cerchio', price: 0 },
    { id: 'triangle', name: 'Triangolo', price: 0 },
    { id: 'square', name: 'Quadrato', price: 0 },
    { id: 'pentagon', name: 'Pentagono', price: 150, minLevel: 3 },
    { id: 'hexagon', name: 'Esagono', price: 220, minLevel: 5 },
    { id: 'star', name: 'Stella', price: 400, minLevel: 8 },
    { id: 'delta', name: 'Delta', season: true },
  ],
  color: [
    { id: 'cyan', name: 'Ciano', hue: 190, price: 0 },
    { id: 'violet', name: 'Viola', hue: 275, price: 0 },
    { id: 'green', name: 'Menta', hue: 155, price: 0 },
    { id: 'orange', name: 'Arancio', hue: 28, price: 60 },
    { id: 'pink', name: 'Rosa', hue: 330, price: 60 },
    { id: 'lime', name: 'Lime', hue: 85, price: 80 },
    { id: 'blue', name: 'Blu', hue: 220, price: 80 },
    { id: 'magenta', name: 'Magenta', hue: 300, price: 140, minLevel: 4 },
    { id: 'gold', name: 'Oro', hue: 45, price: 260, minLevel: 6 },
    { id: 'rainbow', name: 'Arcobaleno', hue: 0, season: true },
  ],
  eyes: [
    { id: 'dots', name: 'Puntini', price: 0 },
    { id: 'happy', name: 'Felici', price: 0 },
    { id: 'wink', name: 'Occhiolino', price: 50 },
    { id: 'sleepy', name: 'Assonnati', price: 50 },
    { id: 'star', name: 'Stellati', price: 120, minLevel: 4 },
    { id: 'cool', name: 'Occhiali da sole', price: 200, minLevel: 6 },
    { id: 'side', name: 'Sguardo di lato', price: 70 },
    { id: 'hearts', name: 'Occhi a cuore', price: 150, minLevel: 3 },
    { id: 'spiral', name: 'Spirale', price: 120, minLevel: 4 },
    { id: 'tears', name: 'Lacrime di gioia', season: true },
    { id: 'monocle', name: 'Monocolo', unlock: { kind: 'level', n: 12 } },
  ],
  mouth: [
    { id: 'none', name: 'Nessuna', price: 0 },
    { id: 'smile', name: 'Sorriso', price: 0 },
    { id: 'grin', name: 'Sorrisone', price: 60 },
    { id: 'wow', name: 'Stupore', price: 80 },
    { id: 'tongue', name: 'Linguaccia', price: 90, minLevel: 2 },
    { id: 'smirk', name: 'Ghigno', unlock: { kind: 'streak', n: 7 } },
    { id: 'laugh', name: 'Risata', season: true },
  ],
  acc: [
    { id: 'none', name: 'Nessuno', price: 0 },
    { id: 'cap', name: 'Cappellino', price: 90 },
    { id: 'headphones', name: 'Cuffie', price: 160, minLevel: 3 },
    { id: 'glasses', name: 'Occhiali', price: 110 },
    { id: 'mortarboard', name: 'Tocco da laureato', price: 350, minLevel: 10 },
    { id: 'halo', name: 'Aureola', price: 300, minLevel: 7 },
    { id: 'crown', name: 'Corona', chest: true },
    { id: 'compass', name: 'Compasso', price: 240, minLevel: 5 },
    { id: 'bow', name: 'Fiocco', price: 100 },
    { id: 'flower', name: 'Fiore', price: 90 },
    { id: 'sparkles', name: 'Scintille', price: 130, minLevel: 2 },
    { id: 'antennae', name: 'Antenne', price: 160, minLevel: 5 },
    { id: 'horns', name: 'Cornetti', price: 200, minLevel: 6 },
    { id: 'party', name: 'Cappello da festa', unlock: { kind: 'level', n: 5 } },
    { id: 'fire', name: 'Testa in fiamme', unlock: { kind: 'streak', n: 30 } },
    { id: 'rainbow', name: 'Arcobaleno', season: true },
  ],
  sticker: [
    { id: 'none', name: 'Nessuno', price: 0 },
    { id: 'heart', name: 'Cuore', price: 50 },
    { id: 'clover', name: 'Quadrifoglio', price: 110, minLevel: 3 },
    { id: 'rocket', name: 'Razzo', price: 250, minLevel: 7 },
    { id: 'flame', name: 'Fiamma', unlock: { kind: 'streak', n: 3 } },
    { id: 'star', name: 'Stella', unlock: { kind: 'level', n: 3 } },
    { id: 'hundred', name: 'Cento', unlock: { kind: 'perfect', n: 10 } },
    { id: 'bolt', name: 'Fulmine', unlock: { kind: 'speed', n: 20 } },
    { id: 'gem', name: 'Diamante', unlock: { kind: 'league', n: 6 } },
    { id: 'trophy', name: 'Coppa', season: true },
    { id: 'crown', name: 'Coroncina', chest: true },
  ],
  bg: [
    { id: 'plain', name: 'Tinta unita', price: 0 },
    { id: 'grid', name: 'Righe', price: 70 },
    { id: 'dots', name: 'Puntinato', price: 70 },
    { id: 'stars', name: 'Notte stellata', price: 180, minLevel: 4 },
    { id: 'aurora', name: 'Aurora', price: 280, minLevel: 6 },
  ],
};
export const SLOT_NAMES = { shape: 'Forma', color: 'Colore', eyes: 'Occhi', mouth: 'Bocca', acc: 'Accessorio', sticker: 'Adesivo', bg: 'Sfondo' };

/** Testo del traguardo che regala un oggetto */
export function unlockText(u) {
  return { level: `livello ${u.n}`, streak: `serie di ${u.n} giorni`, perfect: `${u.n} lezioni perfette`, speed: `${u.n} punti nella sfida lampo`, league: 'lega Diamante' }[u.kind] || '';
}
/** Oggetti regalati dai traguardi raggiunti e non ancora posseduti */
export function milestoneItems(values, owned) {
  const out = [];
  for (const [slot, list] of Object.entries(PARTS)) {
    for (const it of list) {
      const id = `${slot}:${it.id}`;
      if (it.unlock && !owned.includes(id) && (values[it.unlock.kind] ?? 0) >= it.unlock.n) out.push(id);
    }
  }
  return out;
}

export function itemInfo(id) {
  const [slot, v] = id.split(':');
  const it = PARTS[slot]?.find((p) => p.id === v);
  return it ? { ...it, slot, full: id } : null;
}

export function shopItems() {
  const out = [];
  for (const [slot, list] of Object.entries(PARTS)) {
    for (const it of list) if (it.price > 0) out.push({ ...it, slot, id: `${slot}:${it.id}`, name: it.name });
  }
  return out;
}

const SHAPES = {
  circle: '<circle cx="50" cy="54" r="34"/>',
  triangle: '<path d="M50 14 L88 84 Q90 88 85 88 L15 88 Q10 88 12 84 Z"/>',
  square: '<rect x="17" y="21" width="66" height="66" rx="14"/>',
  pentagon: '<path d="M50 15 L87 42 L73 87 L27 87 L13 42 Z" stroke-linejoin="round"/>',
  hexagon: '<path d="M50 16 L84 35 L84 73 L50 92 L16 73 L16 35 Z"/>',
  star: '<path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38 Z" stroke-linejoin="round"/>',
  delta: '<path d="M50 12 L90 86 L10 86 Z M50 36 L72 76 L28 76 Z" fill-rule="evenodd"/>',
};

function eyes(kind) {
  switch (kind) {
    case 'happy': return '<path d="M36 55 q5 -7 10 0 M54 55 q5 -7 10 0" class="av-line"/>';
    case 'wink': return '<circle cx="41" cy="54" r="4.5" class="av-ink"/><path d="M54 55 q5 -6 10 0" class="av-line"/>';
    case 'sleepy': return '<path d="M36 55 q5 5 10 0 M54 55 q5 5 10 0" class="av-line"/>';
    case 'star': return '<path d="M41 48 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z M59 48 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z" class="av-ink"/>';
    case 'cool': return '<path d="M31 50 h38 v4 q-1 8 -9 8 h-4 q-6 0 -6 -6 q0 6 -6 6 h-4 q-8 0 -9 -8z" class="av-ink"/>';
    case 'side': return `<ellipse cx="41" cy="54" rx="6.5" ry="7.5" fill="#fff" ${INK}/><ellipse cx="59" cy="54" rx="6.5" ry="7.5" fill="#fff" ${INK}/><circle cx="44.5" cy="55" r="3.3" class="av-ink"/><circle cx="62.5" cy="55" r="3.3" class="av-ink"/>`;
    case 'hearts': return heart(41, 55, 0.9) + heart(59, 55, 0.9);
    case 'spiral': return [41, 59].map((x) => `<path d="M${x} 55 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3.2 3.2 0 1 1 -6.4 0 a5 5 0 1 1 10 0" fill="none" stroke="#12121a" stroke-width="2" stroke-linecap="round"/>`).join('');
    case 'tears': return '<path d="M35 56 q6 -8 12 0 M53 56 q6 -8 12 0" class="av-line"/><path d="M33 59 q-4 7 0 9 q4 -2 0 -9z M67 59 q4 7 0 9 q-4 -2 0 -9z" fill="#4fc3ff" stroke="#12121a" stroke-width="1"/>';
    case 'monocle': return '<circle cx="41" cy="55" r="4.5" class="av-ink"/><circle cx="59" cy="55" r="4" class="av-ink"/><circle cx="59" cy="55" r="9" fill="none" stroke-width="2.6" class="av-gold-line"/><path d="M67 59 q5 12 -1 24" fill="none" stroke-width="1.6" class="av-gold-line"/>';
    default: return '<circle cx="41" cy="55" r="4.5" class="av-ink"/><circle cx="59" cy="55" r="4.5" class="av-ink"/>';
  }
}

const INK = 'stroke="#12121a" stroke-width="1.6" stroke-linejoin="round"';
const heart = (x, y, k = 1, fill = '#ff3d6e') => `<path d="M${x} ${y + 6 * k} C${x - 9 * k} ${y - 1 * k} ${x - 7 * k} ${y - 8 * k} ${x - 3 * k} ${y - 8 * k} C${x - 1 * k} ${y - 8 * k} ${x} ${y - 6 * k} ${x} ${y - 5 * k} C${x} ${y - 6 * k} ${x + 1 * k} ${y - 8 * k} ${x + 3 * k} ${y - 8 * k} C${x + 7 * k} ${y - 8 * k} ${x + 9 * k} ${y - 1 * k} ${x} ${y + 6 * k}Z" fill="${fill}" ${INK}/>`;
const spark = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28}Z" fill="#ffd23f" ${INK}/>`;
const star5 = (r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(rr * Math.cos(a)).toFixed(2)} ${(rr * Math.sin(a)).toFixed(2)}`; } return d + 'Z'; };

function mouth(kind) {
  switch (kind) {
    case 'smile': return '<path d="M40 67 q10 9 20 0" class="av-line"/>';
    case 'grin': return `<path d="M36 64 h28 q-2 12 -14 12 q-12 0 -14 -12z" fill="#fff" ${INK}/><path d="M37 68.5 h26" stroke="#12121a" stroke-width="1.4"/>`;
    case 'wow': return '<ellipse cx="50" cy="71" rx="5.5" ry="7" class="av-ink"/>';
    case 'tongue': return `<path d="M38 65 q12 9 24 0" class="av-line"/><path d="M51 69 q-1 10 5 10 q6 0 5 -10" fill="#ff6b8a" ${INK}/>`;
    case 'smirk': return '<path d="M41 70 q10 3 19 -6" class="av-line"/>';
    case 'laugh': return `<path d="M35 63 h30 q-2 15 -15 15 q-13 0 -15 -15z" class="av-ink"/><path d="M42 73 q8 -5 16 0 q-3 5 -8 5 q-5 0 -8 -5z" fill="#ff6b8a"/>`;
    default: return '';
  }
}

function sticker(kind) {
  const icon = {
    heart: heart(0, 1, 1.15),
    flame: `<path d="M0 -11 c5 6 9 8 7 15 c-1 4 -4 6 -7 6 c-3 0 -6 -2 -7 -6 c-2 -6 3 -8 4 -12 c1 2 1 4 3 5 c0 -3 -1 -5 0 -8z" fill="#ff7a1a" ${INK}/><path d="M0 0 c2 3 4 4 3 7 c-1 2 -2 2 -3 2 c-1 0 -3 0 -3 -2 c-1 -2 1 -3 2 -5 c0 1 1 1 1 1z" fill="#ffd23f"/>`,
    hundred: '<text y="3.5" text-anchor="middle" font-size="11.5" font-weight="900" font-style="italic" fill="#e8364a" font-family="Inter, system-ui, sans-serif">100</text><path d="M-9 7.5 h18 M-7 10.5 h14" stroke="#e8364a" stroke-width="1.7" stroke-linecap="round"/>',
    star: `<path d="${star5(11)}" fill="#ffd23f" ${INK}/>`,
    bolt: `<path d="M2 -11 L-7 2 H-1 L-3 11 L7 -3 H1 Z" fill="#ffd23f" ${INK}/>`,
    rocket: `<g transform="rotate(45)"><path d="M0 -12 q6 6 5 16 h-10 q-1 -10 5 -16z" fill="#e9eef5" ${INK}/><circle cy="-3" r="2.6" fill="#4fc3ff" ${INK}/><path d="M-5 2 l-4 6 h4z M5 2 l4 6 h-4z" fill="#e8364a" ${INK}/><path d="M-3 4 q3 8 6 0z" fill="#ff7a1a"/></g>`,
    clover: `<g fill="#2fbf5b" ${INK}>${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a})">${heart(0, -5, 0.6, '#2fbf5b')}</g>`).join('')}</g><path d="M1 2 q3 6 7 8" stroke="#1d7a39" stroke-width="2" fill="none"/>`,
    gem: `<path d="M-10 -3 L-5 -9 H5 L10 -3 L0 11 Z" fill="#5ad1ff" ${INK}/><path d="M-10 -3 H10 M-5 -9 L-2 -3 L0 11 M5 -9 L2 -3 L0 11" stroke="#12121a" stroke-width="1" fill="none"/>`,
    trophy: `<path d="M-7 -10 h14 v5 q0 8 -7 9 q-7 -1 -7 -9z" fill="#ffd23f" ${INK}/><path d="M-7 -7 h-4 q0 6 5 6 M7 -7 h4 q0 6 -5 6" fill="none" stroke="#12121a" stroke-width="1.5"/><path d="M-2 4 h4 v4 h4 v3 h-12 v-3 h4z" fill="#ffd23f" ${INK}/>`,
    crown: `<path d="M-10 6 L-11 -7 L-5 -1 L0 -10 L5 -1 L11 -7 L10 6 Z" fill="#ffd23f" ${INK}/>`,
  }[kind];
  if (!icon) return '';
  return `<g transform="translate(79 80)"><circle r="15" fill="#fff" stroke="#12121a" stroke-width="2"/>${icon}</g>`;
}

/** Accessori disegnati dietro la forma (aureole, antenne, fiamme, arcobaleni) */
function accBack(kind) {
  switch (kind) {
    case 'rainbow': return ['#ff5d5d', '#ffa23f', '#ffd23f', '#3ee8b5', '#4f9dff'].map((c, i) => `<path d="M${10 + i * 4} 46 a${40 - i * 4} ${40 - i * 4} 0 0 1 ${80 - i * 8} 0" fill="none" stroke="${c}" stroke-width="4"/>`).join('');
    case 'fire': return `<path d="M50 0 c9 11 19 15 15 29 c-2 7 -9 10 -15 10 c-6 0 -13 -3 -15 -10 c-4 -11 5 -14 7 -21 c2 5 2 8 4 9 c1 -7 0 -11 4 -17z" fill="#ff7a1a"/><path d="M50 14 c5 7 8 10 6 16 c-1 3 -3 5 -6 5 c-3 0 -5 -2 -6 -5 c-1 -5 2 -6 3 -9 c1 2 1 3 2 3 c0 -3 -1 -6 1 -10z" fill="#ffd23f"/>`;
    case 'antennae': return `<path d="M40 26 L30 6 M60 26 L70 6" stroke="#12121a" stroke-width="2.6"/><circle cx="30" cy="6" r="5" fill="#7dff8a" ${INK}/><circle cx="70" cy="6" r="5" fill="#7dff8a" ${INK}/>`;
    default: return '';
  }
}

function acc(kind) {
  switch (kind) {
    case 'party': return `<path d="M38 27 L57 1 L67 31 Z" fill="#ff4f9a" ${INK}/><path d="M45 18 L61 22 M51 10 L59 13" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><circle cx="57" cy="2" r="4" fill="#ffd23f" ${INK}/>`;
    case 'sparkles': return spark(15, 22, 8) + spark(85, 16, 6) + spark(89, 40, 4.5);
    case 'horns': return `<path d="M30 31 q-5 -15 6 -20 q-2 9 5 15z M70 31 q5 -15 -6 -20 q2 9 -5 15z" fill="#e8364a" ${INK}/>`;
    case 'bow': return `<path d="M50 23 L35 14 Q30 23 35 32 Z M50 23 L65 14 Q70 23 65 32 Z" fill="#ff4f9a" ${INK}/><circle cx="50" cy="23" r="4.5" fill="#ff8ab8" ${INK}/>`;
    case 'flower': return `<g transform="translate(72 26)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="4.5" ry="7" transform="rotate(${a}) translate(0 -6)" fill="#ffb3d1" ${INK}/>`).join('')}<circle r="4" fill="#ffd23f" ${INK}/></g>`;
    case 'cap': return '<path d="M26 32 q24 -22 48 0 z" class="av-acc"/><rect x="48" y="30" width="34" height="5" rx="2.5" class="av-acc"/>';
    case 'headphones': return '<path d="M20 52 q0 -38 30 -38 q30 0 30 38" fill="none" stroke-width="5" class="av-acc-line"/><rect x="13" y="46" width="12" height="20" rx="5" class="av-acc"/><rect x="75" y="46" width="12" height="20" rx="5" class="av-acc"/>';
    case 'glasses': return '<circle cx="41" cy="55" r="9" fill="none" stroke-width="3" class="av-acc-line"/><circle cx="59" cy="55" r="9" fill="none" stroke-width="3" class="av-acc-line"/><path d="M50 55 h0" stroke-width="3" class="av-acc-line"/>';
    case 'mortarboard': return '<path d="M20 22 L50 10 L80 22 L50 34 Z" class="av-acc"/><path d="M78 23 v14" stroke-width="2.5" class="av-gold-line"/><circle cx="78" cy="38" r="3" class="av-gold"/>';
    case 'halo': return '<ellipse cx="50" cy="10" rx="20" ry="5" fill="none" stroke-width="3.5" class="av-gold-line"/>';
    case 'crown': return '<path d="M30 26 L34 8 L42 18 L50 4 L58 18 L66 8 L70 26 Z" class="av-gold"/>';
    case 'compass': return '<path d="M76 18 L66 46 M76 18 L86 46" stroke-width="3" class="av-acc-line"/><circle cx="76" cy="16" r="4" class="av-acc"/>';
    default: return '';
  }
}

function bg(kind, hue) {
  switch (kind) {
    case 'grid': return `<rect width="100" height="100" class="av-bg"/><path d="${Array.from({ length: 12 }, (_, i) => `M${i * 18 - 100} 100L${i * 18} 0`).join('')}" class="av-bg-line" style="stroke-width:5"/>`;
    case 'dots': return `<rect width="100" height="100" class="av-bg"/>${Array.from({ length: 25 }, (_, i) => `<circle cx="${10 + (i % 5) * 20}" cy="${10 + Math.floor(i / 5) * 20}" r="1.6" class="av-bg-dot"/>`).join('')}`;
    case 'stars': return `<rect width="100" height="100" fill="hsl(240 40% 12%)"/>${[[12, 14], [80, 20], [25, 80], [88, 70], [60, 8], [8, 50], [92, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join('')}`;
    case 'aurora': return `<defs><linearGradient id="au${hue}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 80% 35%)"/><stop offset="1" stop-color="hsl(${(hue + 120) % 360} 80% 30%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#au${hue})"/>`;
    default: return '<rect width="100" height="100" class="av-bg"/>';
  }
}

/** SVG dell'avatar. eq = { shape, color, eyes, mouth, acc, sticker, bg } */
export function avatarSVG(eq, { size = 64, label = 'Il tuo avatar' } = {}) {
  const col = PARTS.color.find((c) => c.id === eq.color) || PARTS.color[0];
  const fill = col.id === 'rainbow' ? 'url(#rb)' : `hsl(${col.hue} 80% 58%)`;
  const rb = col.id === 'rainbow' ? '<defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#ff5d8f"/><stop offset=".35" stop-color="#ffd23f"/><stop offset=".7" stop-color="#3ee8b5"/><stop offset="1" stop-color="#7d6bff"/></linearGradient></defs>' : '';
  return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${label}">${rb}
    <clipPath id="avclip"><rect width="100" height="100" rx="24"/></clipPath>
    <g clip-path="url(#avclip)">${bg(eq.bg, col.hue)}${accBack(eq.acc)}</g>
    <g style="fill:${fill};stroke:hsl(${col.hue} 70% 30%);stroke-width:2.5">${SHAPES[eq.shape] || SHAPES.circle}</g>
    ${eyes(eq.eyes)}${mouth(eq.mouth)}${acc(eq.acc)}${sticker(eq.sticker)}</svg>`;
}

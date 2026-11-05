// Codice dei progressi da consegnare al docente.
// Contiene solo ciò che serve alla valutazione (nome scelto per il docente, classe, risultati):
// il nickname resta privato sul dispositivo.
// La firma (checksum) scoraggia le modifiche a mano del codice. Non è crittografia forte:
// chi conosce il codice sorgente potrebbe falsificarla, quindi va usata come registro, non come prova d'esame.

const SALT = 'orfini-math-lab|ipia-foligno|A026';
const PREFIX = 'ORF2';

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).padStart(7, '0').slice(-7);
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Costruisce i dati del codice a partire dallo stato di gioco */
export function codePayload(state, today, levelInfo) {
  const stars = {};
  for (const [id, a] of Object.entries(state.activities)) if (a.stars || a.best) stars[id] = [a.stars || 0, Math.round((a.best || 0) * 100)];
  return {
    n: state.profile.teacherName || '',
    c: state.profile.classLabel || '',
    y: state.profile.year || 0,
    i: state.profile.indirizzo || '',
    d: today,
    xp: state.xp,
    lv: levelInfo(state.xp).level,
    s: state.streak.current,
    sb: state.streak.best,
    sp: state.speed.best,
    i10: state.invalsi.best10,
    i13: state.invalsi.best13,
    pf: state.stats.perfect,
    ls: state.stats.lessons,
    rv: state.stats.reviews,
    en: state.stats.puzzles,
    a: stars,
  };
}

export function encode(payload) {
  const body = b64urlEncode(JSON.stringify(payload));
  return `${PREFIX}.${body}.${fnv(SALT + body)}`;
}

export function decode(code) {
  const clean = String(code).trim().replace(/\s+/g, '');
  const parts = clean.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return { error: 'Non sembra un codice Orfini (deve iniziare con ORF2.)' };
  const [, body, sum] = parts;
  if (fnv(SALT + body) !== sum) return { error: 'Codice modificato o copiato male: la firma non corrisponde.' };
  let raw;
  try {
    raw = JSON.parse(b64urlDecode(body));
  } catch {
    return { error: 'Codice illeggibile.' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'Codice illeggibile.' };
  return { data: sanitize(raw) };
}

/* La firma si può rifare (il sorgente è pubblico): ogni campo viene ricondotto al suo tipo,
   così un codice costruito a mano non può portare HTML o formule nel registro del docente. */
const txt = (v, max = 60) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').slice(0, max);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0; };
function sanitize(r) {
  const a = {};
  if (r.a && typeof r.a === 'object' && !Array.isArray(r.a)) {
    for (const [id, v] of Object.entries(r.a)) {
      if (!/^[a-z0-9_-]{1,40}$/i.test(id) || !Array.isArray(v)) continue;
      a[id] = [Math.min(10, num(v[0])), Math.min(100, num(v[1]))];
    }
  }
  return {
    n: txt(r.n), c: txt(r.c, 20), y: num(r.y), i: txt(r.i, 30),
    d: /^\d{4}-\d{2}-\d{2}$/.test(String(r.d)) ? String(r.d) : '',
    xp: num(r.xp), lv: num(r.lv), s: num(r.s), sb: num(r.sb), sp: num(r.sp),
    i10: r.i10 == null ? null : Math.min(100, num(r.i10)), i13: r.i13 == null ? null : Math.min(100, num(r.i13)),
    pf: num(r.pf), ls: num(r.ls), rv: num(r.rv), en: num(r.en), a,
  };
}

/** Più codici incollati insieme (uno per riga, o separati da spazi) */
export function decodeMany(text) {
  const found = String(text).match(/ORF2\.[A-Za-z0-9_-]+\.[a-z0-9]{7}/g) || [];
  return found.map((c) => ({ code: c, ...decode(c) }));
}

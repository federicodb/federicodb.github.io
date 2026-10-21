// Generatore pseudo-casuale con seed (mulberry32).
// Stesso seed => stessi valori: utile per riprodurre una sessione o fare debug.
// Ogni nuova sessione di lezione usa un seed nuovo => nuovi numeri, stessa difficoltà.

export function newSeed() {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}

export function createRng(seed = newSeed()) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng = {
    seed,
    next,
    /** Intero in [min, max] estremi inclusi */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** Intero in [min, max] escluso lo zero (e gli eventuali valori in `exclude`) */
    intNot(min, max, exclude = [0]) {
      for (let i = 0; i < 1000; i++) {
        const v = rng.int(min, max);
        if (!exclude.includes(v)) return v;
      }
      throw new Error('intNot: nessun valore disponibile');
    },
    /** Segno casuale: +1 o -1 */
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** true con probabilità p */
    chance(p) {
      return next() < p;
    },
    /**
     * Ripete `gen` finché `accept` non è soddisfatto.
     * È il cuore della "stessa difficoltà": si generano valori casuali
     * e si scartano quelli che renderebbero il problema più facile o più difficile.
     */
    until(gen, accept, maxTries = 5000) {
      for (let i = 0; i < maxTries; i++) {
        const v = gen();
        if (accept(v)) return v;
      }
      throw new Error('rng.until: vincoli impossibili da soddisfare');
    },
  };
  return rng;
}

/**
 * Generatore delle varianti della settimana: decide *quale tipo* di esercizio compare in ogni posto
 * della lezione (i numeri li decide sempre `rng`). L'app lo aggancia come `rng.week` con un seed
 * ricavato da settimana + attività + livello: per sette giorni la classe trova le stesse varianti,
 * la settimana dopo cambiano. Senza `rng.week` (test, anteprime) coincide con `rng`, così i test
 * provano tutte le varianti.
 *   const pick = (...gens) => settimana(rng).pick(gens)(rng);
 */
export const settimana = (rng) => rng.week || rng;

// Effetti di gioco: suoni sintetizzati, vibrazione, coriandoli, "+XP" che vola.
// Tutto rispetta "riduci movimento" del sistema e le impostazioni dell'utente.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let settings = { sound: true, haptics: true };
export function setFxSettings(s) { settings = s; }

let ctx;
function tone(freqs, { type = 'sine', gap = 0.08, dur = 0.16, vol = 0.12 } = {}) {
  if (!settings.sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * gap;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    });
  } catch {
    /* audio non disponibile */
  }
}

// Do maggiore pentatonico (do re mi sol la) su tre ottave
const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637, 3136];
export const sfx = {
  tap: () => tone([880], { dur: 0.05, vol: 0.04 }),
  // giusto: arpeggio sulla scala pentatonica, che parte più in alto a ogni risposta della combo
  good: (combo = 0) => { const k = Math.min(combo, 9); tone([PENTA[k], PENTA[k + 2], PENTA[k + 4]], { gap: 0.06, dur: 0.18 }); },
  // sbagliato: niente "buzzer", un accordo aperto basso e morbido (quinta), che invita a ricontrollare
  bad: () => tone([196, 294], { gap: 0.03, dur: 0.32, vol: 0.07 }),
  done: () => tone([523, 659, 784, 1047], { gap: 0.09, dur: 0.22 }),
  level: () => tone([392, 523, 659, 784, 1047, 1319], { gap: 0.07, dur: 0.25 }),
  coin: () => tone([1319, 1760], { gap: 0.05, dur: 0.1, vol: 0.07 }),
  tick: () => tone([1200], { dur: 0.03, vol: 0.03 }),
};

export function haptic(pattern = 12) {
  if (!settings.haptics) return;
  try { navigator.vibrate?.(pattern); } catch { /* non supportato */ }
}

/** "+15 XP" che sale da un elemento */
export function flyText(fromEl, text, cls = '') {
  if (!fromEl || reduced()) return;
  const r = fromEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'fly ' + cls;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/** Coriandoli geometrici (triangoli, quadrati, cerchi, Δ) su canvas */
export function confetti({ count = 120, duration = 2200 } = {}) {
  if (reduced()) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'].map((v) => cs.getPropertyValue(v).trim() || '#3cf');
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 13 - 4,
    r: Math.random() * 7 + 4,
    a: Math.random() * Math.PI,
    va: (Math.random() - 0.5) * 0.3,
    s: Math.floor(Math.random() * 4),
    col: cols[Math.floor(Math.random() * cols.length)],
  }));
  const t0 = performance.now();
  function frame(t) {
    const k = (t - t0) / duration;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      g.save();
      g.globalAlpha = Math.max(0, 1 - k * k);
      g.translate(p.x, p.y);
      g.rotate(p.a);
      g.fillStyle = p.col;
      g.beginPath();
      if (p.s === 0) g.arc(0, 0, p.r / 2, 0, Math.PI * 2);
      else if (p.s === 1) g.rect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      else { g.moveTo(0, -p.r / 1.6); g.lineTo(p.r / 1.6, p.r / 2); g.lineTo(-p.r / 1.6, p.r / 2); g.closePath(); }
      g.fill();
      g.restore();
    }
    if (k < 1) requestAnimationFrame(frame);
    else c.remove();
  }
  requestAnimationFrame(frame);
}

/** Contatore che sale (per XP, Δ, serie) */
export function countUp(el, from, to, ms = 700) {
  if (!el) return;
  if (reduced() || from === to) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

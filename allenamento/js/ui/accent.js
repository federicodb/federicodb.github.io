// Colore degli accenti scelto dallo studente (Profilo → Impostazioni).
// Per ogni tinta si cerca la luminosità che garantisce il contrasto WCAG AA (4,5:1) del testo sui pulsanti:
// testo scuro su accento chiaro nel tema scuro, testo bianco su accento scuro nel tema chiaro (LIM).

export const ACCENTS = [
  { id: 'ciano', name: 'Ciano', h: 190 },
  { id: 'blu', name: 'Blu', h: 220 },
  { id: 'viola', name: 'Viola', h: 270 },
  { id: 'rosa', name: 'Rosa', h: 325 },
  { id: 'rosso', name: 'Rosso', h: 355 },
  { id: 'arancio', name: 'Arancio', h: 25 },
  { id: 'oro', name: 'Oro', h: 45 },
  { id: 'verde', name: 'Verde', h: 150 },
];
export const DEFAULT_HUE = 190;

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}
const luminance = ([r, g, b]) => {
  const c = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const DARK_TEXT = luminance([5 / 255, 5 / 255, 7 / 255]);
const WHITE = 1;

/** Luminosità (in %) dell'accento per il tema scuro e per quello chiaro */
export function accentLightness(h) {
  let dark = 55;
  while (dark < 85 && contrast(luminance(hslToRgb(h, 95, dark)), DARK_TEXT) < 4.5) dark++;
  let light = 36;
  while (light > 15 && contrast(luminance(hslToRgb(h, 85, light)), WHITE) < 4.5) light--;
  return { dark, light };
}

/** Valori da salvare nelle impostazioni (letti anche dallo script iniziale, prima del primo disegno) */
export function accentSetting(h) {
  const hue = ((Math.round(h) % 360) + 360) % 360;
  const { dark, light } = accentLightness(hue);
  return { h: hue, ld: dark, ll: light };
}

export function applyAccent(acc) {
  const a = acc && Number.isFinite(acc.h) ? acc : accentSetting(DEFAULT_HUE);
  const st = document.documentElement.style;
  st.setProperty('--acc-h', a.h);
  st.setProperty('--acc-l-d', `${a.ld}%`);
  st.setProperty('--acc-l-l', `${a.ll}%`);
}

/** Sfumatura piena di una card o di un banner nel colore di un'area, con testo sempre leggibile:
 *  testo scuro nel tema scuro, bianco nel tema chiaro. Entrambi gli estremi rispettano 4,5:1. */
export function gradientVars(h) {
  const h2 = (h + 30) % 360;
  const [a, b] = [accentLightness(h), accentLightness(h2)];
  return `--g1d:hsl(${h},95%,${Math.min(80, a.dark + 10)}%);--g2d:hsl(${h2},95%,${b.dark}%);--g1l:hsl(${h},85%,${a.light}%);--g2l:hsl(${h2},85%,${Math.max(12, b.light - 6)}%)`;
}

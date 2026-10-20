// Fine lezione: radar delle abilità mostrate nella sessione e "carta della scoperta" da salvare.
// Il radar usa solo dati veri della lezione (risposte al primo colpo per tipo di domanda, gemelli, scommesse):
// gli assi senza dati non compaiono.

import { esc } from './dom.js';

const AXES = [
  { id: 'calcolo', label: 'Calcolo', types: ['number', 'numbers', 'expr'] },
  { id: 'ragionamento', label: 'Ragionamento', types: ['choice', 'truefalse', 'order'] },
  { id: 'stima', label: 'Stima', types: ['place', 'slider', 'widget'] },
  { id: 'organizzare', label: 'Classificare', types: ['bins', 'sort'] },
];

/** Valori 0–1 per asse, solo dove la lezione ha dati */
export function skillScores(res) {
  const out = [];
  for (const a of AXES) {
    const items = res.log.filter((l) => a.types.includes(l.type));
    if (items.length) out.push({ label: a.label, value: items.filter((l) => l.first).length / items.length, n: items.length });
  }
  if (res.mentalOf) out.push({ label: 'A mente', value: (res.mental || 0) / res.mentalOf, n: res.mentalOf });
  if (res.twinsOffered) out.push({ label: 'Ripresa', value: Math.min(1, res.twins / res.twinsOffered), n: res.twinsOffered });
  const bets = res.bets.right + res.bets.wrong;
  if (bets) out.push({ label: 'Fiducia', value: res.bets.right / bets, n: bets });
  return out;
}

/** Radar SVG (con almeno 3 assi), altrimenti barre orizzontali */
export function skillChart(scores) {
  if (!scores.length) return '';
  const pct = (v) => `${Math.round(v * 100)}%`;
  if (scores.length < 3) {
    return `<div class="skill-bars">${scores.map((s) => `<div><span>${esc(s.label)}</span><div class="bar good"><i style="width:${pct(s.value)}"></i></div><b class="num">${pct(s.value)}</b></div>`).join('')}</div>`;
  }
  const C = 150, R = 78, n = scores.length;
  const pt = (k, r) => { const a = -Math.PI / 2 + (2 * Math.PI * k) / n; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const ring = (f) => scores.map((_, k) => pt(k, R * f).map((v) => v.toFixed(1)).join(',')).join(' ');
  const data = scores.map((s, k) => pt(k, R * Math.max(0.06, s.value)).map((v) => v.toFixed(1)).join(',')).join(' ');
  const labels = scores.map((s, k) => {
    const [x, y] = pt(k, R + 26);
    const anchor = Math.abs(x - C) < 8 ? 'middle' : x > C ? 'start' : 'end';
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="sk-lbl">${esc(s.label)}</text><text x="${x.toFixed(1)}" y="${(y + 20).toFixed(1)}" text-anchor="${anchor}" class="sk-val">${pct(s.value)}</text>`;
  }).join('');
  // riquadro calcolato dalle etichette (circa 10 px per carattere a 17 px): niente tagli ai lati
  let x0 = C - R - 10, x1 = C + R + 10;
  scores.forEach((s, k) => {
    const [x] = pt(k, R + 26);
    const w = Math.max(s.label.length, 4) * 10;
    const anchor = Math.abs(x - C) < 8 ? 'middle' : x > C ? 'start' : 'end';
    const [a, b] = anchor === 'middle' ? [x - w / 2, x + w / 2] : anchor === 'start' ? [x, x + w] : [x - w, x];
    x0 = Math.min(x0, a); x1 = Math.max(x1, b);
  });
  return `<svg class="skill-radar" viewBox="${Math.floor(x0 - 6)} 6 ${Math.ceil(x1 - x0 + 12)} 290" role="img" aria-label="Abilità mostrate nella lezione: ${scores.map((s) => `${s.label} ${pct(s.value)}`).join(', ')}">
    ${[0.25, 0.5, 0.75, 1].map((f) => `<polygon class="sk-grid" points="${ring(f)}"/>`).join('')}
    ${scores.map((_, k) => { const [x, y] = pt(k, R); return `<line class="sk-axis" x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('')}
    <polygon class="sk-data" points="${data}"/>
    ${scores.map((s, k) => { const [x, y] = pt(k, R * Math.max(0.06, s.value)); return `<circle class="sk-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>`; }).join('')}
    ${labels}
  </svg>`;
}

// colori fissi per l'immagine esportata (fuori dall'app le variabili CSS non esistono)
const AVATAR_CSS = `.av-bg{fill:#2b2b33}.av-bg-line{stroke:rgba(255,255,255,.12);stroke-width:1;fill:none}.av-bg-dot{fill:#9d9da6;opacity:.6}.av-ink{fill:#12121a}.av-line{stroke:#12121a;stroke-width:3.2;fill:none;stroke-linecap:round}.av-acc{fill:#2a2a35;stroke:#12121a;stroke-width:1.5}.av-acc-line{stroke:#2a2a35;fill:none;stroke-linecap:round}.av-gold{fill:hsl(45,100%,58%);stroke:hsl(40,90%,32%);stroke-width:1.5}.av-gold-line{stroke:hsl(45,100%,58%);fill:none}`;

/** Carta della scoperta (SVG autonomo, 360×504): cosa si è scoperto, quanto bene, quando */
export function discoveryCard({ hue, title, level, discovery, pct, combo, xp, nickname, avatar, date }) {
  const wrap = (text, max) => {
    const words = String(text).split(/\s+/);
    const lines = [''];
    for (const w of words) { if ((lines[lines.length - 1] + ' ' + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); }
    return lines.slice(0, 3);
  };
  const t = wrap(title, 20);
  const disc = wrap(discovery, 28);
  // l'avatar ha già larghezza e altezza: si sostituiscono (attributi doppi rendono l'SVG illeggibile)
  const av = avatar.replace(/<svg([^>]*)>/, (m, attrs) => `<svg${attrs.replace(/\s(width|height|x|y)="[^"]*"/g, '')} x="132" y="300" width="96" height="96">`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 504" width="720" height="1008">
  <style>${AVATAR_CSS}text{font-family:'Baloo 2','Inter',Arial,sans-serif}</style>
  <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},90%,58%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},85%,40%)"/></linearGradient></defs>
  <rect width="360" height="504" rx="28" fill="#0b0b10"/>
  <rect x="10" y="10" width="340" height="484" rx="22" fill="url(#cg)"/>
  <rect x="24" y="24" width="312" height="456" rx="16" fill="#0b0b10" fill-opacity=".86"/>
  <text x="180" y="62" text-anchor="middle" fill="hsl(${hue},90%,70%)" font-size="13" font-weight="800" letter-spacing="3">CARTA DELLA SCOPERTA</text>
  ${t.map((l, k) => `<text x="180" y="${102 + k * 30}" text-anchor="middle" fill="#fff" font-size="28" font-weight="800">${esc(l)}</text>`).join('')}
  <text x="180" y="${118 + t.length * 30}" text-anchor="middle" fill="#c9c9d1" font-size="15" font-weight="600">Livello ${level}</text>
  <text x="180" y="${158 + t.length * 30}" text-anchor="middle" fill="hsl(${hue},90%,70%)" font-size="12" font-weight="800" letter-spacing="2">LA SCOPERTA DI OGGI</text>
  ${disc.map((l, k) => `<text x="180" y="${184 + t.length * 30 + k * 22}" text-anchor="middle" fill="#fff" font-size="18" font-weight="700">${esc(l)}</text>`).join('')}
  ${av}
  <g font-weight="800" text-anchor="middle">
    <text x="80" y="432" fill="#fff" font-size="26">${pct}%</text><text x="80" y="452" fill="#9d9da6" font-size="11">AL PRIMO COLPO</text>
    <text x="180" y="432" fill="#fff" font-size="26">${combo}</text><text x="180" y="452" fill="#9d9da6" font-size="11">COMBO</text>
    <text x="280" y="432" fill="#fff" font-size="26">+${xp}</text><text x="280" y="452" fill="#9d9da6" font-size="11">XP</text>
  </g>
  <text x="180" y="474" text-anchor="middle" fill="#9d9da6" font-size="11" font-weight="600">${esc(nickname)} · ${esc(date)} · Orfini Math Quest</text>
</svg>`;
}

/** Converte la carta in PNG e la condivide (telefono) o la scarica (PC, LIM) */
export async function saveCard(svg, filename) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1008;
  canvas.getContext('2d').drawImage(img, 0, 0, 720, 1008);
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], title: 'La mia carta della scoperta' }); return 'shared'; } catch { /* annullato: si scarica */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}

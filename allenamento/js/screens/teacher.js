// Area docente: si incollano i codici degli studenti, si ottengono registro e classifica (anche per la LIM).
import { decodeMany } from '../game/code.js';
import { allActivities, byId } from '../../activities/catalogo.js';
import { icons, esc, toast, copyText } from '../ui/dom.js';
import { INDIRIZZI_BY_ID } from '../../activities/contesti.js';
const indName = (i) => INDIRIZZI_BY_ID[i]?.name || '';

const KEY = 'orfini_docente_codici';

export function viewTeacher(app) {
  let saved = '';
  try { saved = app.store.getItem(KEY) || ''; } catch { /* niente memoria */ }
  app.main.innerHTML = `
    <div class="teacher stack">
      <a class="btn-ghost" href="#/profilo" style="justify-self:start">${icons.back} Profilo</a>
      <h1>Registro della classe</h1>
      <p class="muted">Incolla qui i codici che ti hanno consegnato gli studenti (anche tutti insieme, da un foglio o da Classroom). Restano solo su questo dispositivo. I codici con firma non valida vengono segnalati.</p>
      <textarea id="codes" aria-label="Codici degli studenti" placeholder="ORF2.…">${esc(saved)}</textarea>
      <div class="row"><button class="btn" data-go>Aggiorna</button><button class="btn-ghost" data-clear>Svuota</button></div>
      <div data-out></div>
    </div>`;
  const ta = app.main.querySelector('#codes');
  const out = app.main.querySelector('[data-out]');
  const render = () => {
    try { app.store.setItem(KEY, ta.value); } catch { /* niente memoria */ }
    const all = decodeMany(ta.value);
    const bad = all.filter((c) => c.error);
    // un solo codice per studente: il più recente
    const map = new Map();
    for (const c of all.filter((c) => c.data)) {
      const k = (c.data.n || '?').toLowerCase() + '|' + (c.data.c || '');
      if (!map.has(k) || map.get(k).d < c.data.d) map.set(k, c.data);
    }
    const rows = [...map.values()].sort((a, b) => b.xp - a.xp);
    if (!rows.length && !bad.length) { out.innerHTML = '<p class="muted">Nessun codice ancora.</p>'; return; }
    const acts = allActivities.filter((a) => rows.some((r) => r.a?.[a.id]));
    const csv = [['Studente', 'Classe', 'Indirizzo', 'Data', 'Livello', 'XP', 'Serie', 'Serie max', 'Lampo', 'INVALSI 2ª %', 'INVALSI 5ª %', 'Lezioni', 'Perfette', 'Ripassi', 'Enigmi', ...acts.map((a) => `${a.title} (stelle)`)]]
      .concat(rows.map((r) => [r.n, r.c, indName(r.i), r.d, r.lv, r.xp, r.s, r.sb, r.sp, r.i10 ?? '', r.i13 ?? '', r.ls, r.pf, r.rv, r.en, ...acts.map((a) => r.a?.[a.id]?.[0] ?? 0)]))
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    out.innerHTML = `
      ${bad.length ? `<p style="color:var(--bad)">${bad.length} ${bad.length === 1 ? 'codice non valido' : 'codici non validi'}: ${bad.map((b) => esc(b.error)).join('; ')}</p>` : ''}
      <section class="panel">
        <div class="spread"><h2 style="margin:0">Classifica</h2><span class="muted">${rows.length} studenti</span></div>
        <div class="table-scroll"><table class="board-table">
          <thead><tr><th>#</th><th>Studente</th><th>Classe</th><th>Indirizzo</th><th class="n">Livello</th><th class="n">XP</th><th class="n">Serie</th><th class="n">Lampo</th><th class="n">INVALSI</th><th>Aggiornato</th></tr></thead>
          <tbody>${rows.map((r, k) => `<tr class="${k === 0 ? 'top1' : ''}"><td>${k + 1}</td><td><b>${esc(r.n || '—')}</b></td><td>${esc(r.c || '')}</td><td>${esc(indName(r.i))}</td><td class="n">${r.lv}</td><td class="n">${r.xp}</td><td class="n">${r.s} <small class="muted">(${r.sb})</small></td><td class="n">${r.sp}</td><td class="n">${r.i10 != null ? r.i10 + '%' : '–'} / ${r.i13 != null ? r.i13 + '%' : '–'}</td><td>${esc(r.d)}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>
      ${acts.length ? `<section class="panel" style="margin-top:14px"><h2>Stelle per attività</h2><div class="table-scroll"><table class="board-table">
        <thead><tr><th>Studente</th>${acts.map((a) => `<th title="${esc(a.title)}">${esc(a.glyph)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${esc(r.n)}</td>${acts.map((a) => `<td class="n" title="${esc(byId[a.id].title)}: miglior risultato ${r.a?.[a.id]?.[1] ?? 0}%">${'★'.repeat(r.a?.[a.id]?.[0] ?? 0) || '·'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div></section>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn" data-csv>Scarica CSV</button><button class="btn-ghost" data-copycsv>Copia per il foglio di calcolo</button></div>`;
    out.querySelector('[data-csv]').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `orfini-registro-${app.today()}.csv`;
      a.click();
    });
    out.querySelector('[data-copycsv]').addEventListener('click', async () => toast((await copyText(csv.replace(/;/g, '\t').replace(/"/g, ''))) ? 'Copiato: incollalo in un foglio di calcolo.' : 'Copia non riuscita.'));
  };
  app.main.querySelector('[data-go]').addEventListener('click', render);
  app.main.querySelector('[data-clear]').addEventListener('click', () => { ta.value = ''; render(); });
  ta.addEventListener('paste', () => setTimeout(render, 50));
  render();
}

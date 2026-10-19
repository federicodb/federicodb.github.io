// Librerie open source caricate solo quando servono (la prima schermata resta leggera).
//   Chart.js 4.4.1 (MIT)   -> grafici statistici interattivi
//   JSXGraph 1.8.0 (MIT/LGPL) -> lavagne matematiche interattive (funzioni, geometria)

const URLS = {
  chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js',
  jsx: 'https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraphcore.js',
};
const loading = {};

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Impossibile caricare ' + url));
    document.head.appendChild(s);
  });
}

export function lib(name) {
  if (name === 'chart' && window.Chart) return Promise.resolve(window.Chart);
  if (name === 'jsx' && window.JXG) return Promise.resolve(window.JXG);
  loading[name] ||= loadScript(URLS[name]).then(() => (name === 'chart' ? window.Chart : window.JXG));
  return loading[name];
}

/** Colori del tema corrente, letti dalle variabili CSS */
export function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    text: v('--text'),
    muted: v('--muted'),
    line: v('--line'),
    bg: v('--surface'),
    series: [v('--c1'), v('--c2'), v('--c3'), v('--c4'), v('--c5')],
    good: v('--good'),
    bad: v('--bad'),
  };
}

/**
 * Grafico Chart.js nel contenitore. `config` è una configurazione Chart.js senza colori:
 * i colori vengono dal tema. Restituisce una Promise con l'istanza.
 */
export async function chart(el, config) {
  el.classList.add('g-chart');
  el.innerHTML = '<canvas role="img"></canvas>';
  el.querySelector('canvas').setAttribute('aria-label', config.alt || 'Grafico');
  try {
    const Chart = await lib('chart');
    const t = themeColors();
    Chart.defaults.color = t.muted;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 13;
    const ds = config.data.datasets.map((d, i) => {
      const many = config.type === 'pie' || config.type === 'doughnut' || d.colorEach;
      const c = many ? d.data.map((_, j) => t.series[j % t.series.length]) : t.series[i % t.series.length];
      return { borderWidth: config.type === 'line' ? 3 : 1, borderColor: many ? t.bg : c, backgroundColor: c, pointRadius: 4, tension: 0.25, ...d };
    });
    const scales = config.type === 'pie' || config.type === 'doughnut' ? {} : {
      x: { grid: { color: t.line }, ticks: { color: t.muted }, title: config.xTitle ? { display: true, text: config.xTitle, color: t.muted } : undefined },
      y: { grid: { color: t.line }, ticks: { color: t.muted }, beginAtZero: true, title: config.yTitle ? { display: true, text: config.yTitle, color: t.muted } : undefined },
    };
    return new Chart(el.querySelector('canvas'), {
      type: config.type,
      data: { labels: config.data.labels, datasets: ds },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: config.aspectRatio || (config.type === 'pie' || config.type === 'doughnut' ? 1.6 : 1.7),
        animation: { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600 },
        plugins: { legend: { display: config.legend ?? (ds.length > 1 || config.type === 'pie' || config.type === 'doughnut'), labels: { color: t.text } } },
        scales,
        ...(config.options || {}),
      },
    });
  } catch {
    el.innerHTML = '<p class="muted">Il grafico interattivo non si è caricato (serve la connessione). I dati sono nella tabella.</p>';
    return null;
  }
}

/**
 * Lavagna JSXGraph: build(board, JXG, colors, ctl) disegna gli oggetti.
 * `controls` = cursori HTML sotto la lavagna (grandi, leggibili, comodi col dito):
 *   [{ id: 'm', label: 'm', min: -3, max: 3, step: 0.5, value: 1 }]  ->  ctl.m() restituisce il valore.
 * La lavagna supporta trascinamento con dito o mouse e zoom con due dita.
 */
export async function board(el, { bbox = [-6, 6, 6, -6], build, alt, keepAspect = true, controls = [] }) {
  const id = 'jxg' + Math.random().toString(36).slice(2, 9);
  el.classList.add('g-board-wrap');
  const fmt = (v) => String(+(+v).toFixed(2)).replace('.', ',').replace('-', '−');
  el.innerHTML = `<div id="${id}" class="jxgbox g-board" role="application" aria-label="${alt || 'Lavagna interattiva'}"></div>
    ${controls.length ? `<div class="board-controls">${controls.map((c, i) => `
      <label class="w-slider c${i + 1}"><span class="w-slider-head"><span class="w-slider-name">${c.label}</span><output>${fmt(c.value)}</output></span>
        <input type="range" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${c.value}" data-c="${c.id}" aria-label="${c.aria || c.label}"></label>`).join('')}</div>` : ''}`;
  const inputs = Object.fromEntries([...el.querySelectorAll('[data-c]')].map((inp) => [inp.dataset.c, inp]));
  const ctl = Object.fromEntries(controls.map((c) => [c.id, () => +inputs[c.id].value]));
  try {
    const JXG = await lib('jsx');
    const t = themeColors();
    // tutti i testi, le etichette e i cursori interni prendono i colori del tema (mai nero su nero)
    JXG.Options.text.cssDefaultStyle = `font-family:inherit;color:${t.text}`;
    JXG.Options.text.highlightCssDefaultStyle = JXG.Options.text.cssDefaultStyle;
    JXG.Options.text.strokeColor = t.text;
    JXG.Options.text.highlightStrokeColor = t.text;
    JXG.Options.text.fontSize = 15;
    JXG.Options.label.strokeColor = t.text;
    JXG.Options.label.highlightStrokeColor = t.text;
    JXG.Options.label.fontSize = 15;
    const brd = JXG.JSXGraph.initBoard(id, {
      boundingbox: bbox,
      axis: true,
      keepAspectRatio: keepAspect,
      showCopyright: false,
      showNavigation: false,
      pan: { enabled: true, needTwoFingers: true },
      zoom: { pinch: true, wheel: false },
      defaultAxes: {
        x: { strokeColor: t.muted, highlightStrokeColor: t.muted, ticks: { strokeColor: t.line, majorHeight: -1, label: { strokeColor: t.muted, fontSize: 13 } } },
        y: { strokeColor: t.muted, highlightStrokeColor: t.muted, ticks: { strokeColor: t.line, majorHeight: -1, label: { strokeColor: t.muted, fontSize: 13 } } },
      },
    });
    build(brd, JXG, t, ctl);
    for (const inp of Object.values(inputs)) {
      inp.addEventListener('input', () => {
        inp.closest('label').querySelector('output').textContent = fmt(inp.value);
        brd.update();
      });
    }
    return brd;
  } catch {
    el.innerHTML = '<p class="muted">La lavagna interattiva non si è caricata (serve la connessione).</p>';
    return null;
  }
}

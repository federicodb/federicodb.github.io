/**
 * Studio Plotter CNC - Modulo UI Manager & Preset Casuali
 * Inizializzazione controlli, sincronizzazione numerica e preset generativi all'avvio.
 */

function safeSetVal(id, val) {
    const el = document.getElementById(id);
    if (el) {
        el.value = val;
        const valLbl = document.getElementById('val' + id.replace('param', ''));
        if (valLbl) {
            if (valLbl.tagName === 'INPUT') valLbl.value = val;
            else valLbl.innerText = val;
        }
    }
}

function loadRandomAppealingPreset() {
    const presets = [
        // Preset 1: Flow Field Cosmico
        () => {
            setMode('flowfield', false);
            safeSetVal('paramFlowCount', Math.floor(150 + Math.random() * 100));
            safeSetVal('paramFlowStep', (0.8 + Math.random() * 0.4).toFixed(1));
            safeSetVal('paramFlowLength', Math.floor(80 + Math.random() * 40));
            safeSetVal('paramFlowNoiseScale', (0.015 + Math.random() * 0.015).toFixed(3));
            executeSimulationDirect();
        },
        // Preset 2: Einstein Hat Aperiodico con Spirale Delaunay
        () => {
            setMode('tessellation', false);
            safeSetVal('paramTessPattern', 'einstein_hat');
            safeSetVal('paramTessFillType', 'spiral');
            safeSetVal('paramTessSpacing', (1.4 + Math.random() * 0.6).toFixed(1));
            safeSetVal('paramTessDensity', '5');
            toggleTessControls();
            executeSimulationDirect();
        },
        // Preset 3: Generative Noodles (Cadin Over-Under)
        () => {
            setMode('noodles', false);
            safeSetVal('paramNoodlesCount', Math.floor(12 + Math.random() * 8));
            safeSetVal('paramNoodlesComplexity', Math.floor(6 + Math.random() * 4));
            safeSetVal('paramNoodlesMargin', '8');
            executeSimulationDirect();
        },
        // Preset 4: Harmonograph Armonico a 4 Pendoli
        () => {
            setMode('harmonograph', false);
            safeSetVal('paramHarmF1', (1 + Math.floor(Math.random() * 3)).toString());
            safeSetVal('paramHarmF2', (2 + Math.floor(Math.random() * 3)).toString());
            safeSetVal('paramHarmF3', (1 + Math.floor(Math.random() * 2)).toString());
            safeSetVal('paramHarmF4', (3 + Math.floor(Math.random() * 3)).toString());
            safeSetVal('paramHarmP1', (Math.random() * 180).toFixed(0));
            safeSetVal('paramHarmP2', (Math.random() * 90).toFixed(0));
            safeSetVal('paramHarmDamp', '0.0015');
            executeSimulationDirect();
        },
        // Preset 5: Frattale Curva Arrowhead di Sierpinski
        () => {
            setMode('fractal', false);
            safeSetVal('fractalType', 'sierpinski_arrowhead');
            safeSetVal('paramFractalLevel', '5');
            adjustFractalLevelLimits();
            executeSimulationDirect();
        },
        // Preset 6: Spirale di Fibonacci Aurea
        () => {
            setMode('fibonacci', false);
            safeSetVal('paramFibPoints', Math.floor(500 + Math.random() * 300));
            safeSetVal('paramFibScale', '1.2');
            safeSetVal('paramFibFill', 'spiral');
            executeSimulationDirect();
        },
        // Preset 7: Tassellazione Esagonale con Spirale ad Inseguimento Omogenea
        () => {
            setMode('tessellation', false);
            safeSetVal('paramTessPattern', 'hexagonal');
            safeSetVal('paramTessFillType', 'spiral');
            safeSetVal('paramTessSpacing', (1.2 + Math.random() * 0.5).toFixed(1));
            safeSetVal('paramTessDensity', '5');
            toggleTessControls();
            executeSimulationDirect();
        },
        // Preset 8: Harmonograph Bilanciato
        () => {
            setMode('harmonograph', false);
            safeSetVal('paramHarmF1', '3');
            safeSetVal('paramHarmF2', '4');
            safeSetVal('paramHarmF3', '2');
            safeSetVal('paramHarmF4', '5');
            safeSetVal('paramHarmP1', '45');
            safeSetVal('paramHarmDamp', '0.0008');
            executeSimulationDirect();
        }
    ];

    try {
        const chosen = presets[Math.floor(Math.random() * presets.length)];
        if (typeof chosen === 'function') chosen();
    } catch (e) {
        console.warn("Preset init fallback:", e);
        if (typeof setMode === 'function') setMode('harmonograph', true);
    }
}

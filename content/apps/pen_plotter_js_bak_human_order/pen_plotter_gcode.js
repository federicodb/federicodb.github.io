/**
 * Studio Plotter CNC - Modulo G-Code Engine & TSP Export
 * Generatore di G-Code per Klipper/Marlin con ottimizzazione Nearest Neighbor TSP.
 */

function formatGCodeHeader(modeName, bedX, bedY, offsetX, offsetY, tspEnabled) {
    return [
        `; ===================================================`,
        `; Generato da Plotter Studio CNC v2.8K (Klipper/Marlin)`,
        `; Modalita: ${modeName.toUpperCase()}`,
        `; Piatto: X${bedX} Y${bedY}`,
        `; Offset Penna Relativo Ugello: X${offsetX} Y${offsetY}`,
        `; Ottimizzato Tracciato (Nearest Neighbor TSP): ${tspEnabled ? 'SI' : 'NO'}`,
        `; ===================================================`,
        ``,
        `; --- START G-CODE ---`
    ].join('\n');
}

/**
 * Ottimizzazione del tracciato basata sull'algoritmo Nearest Neighbor (Greedy TSP).
 * Riduce al minimo la distanza dei movimenti a vuoto (Pen-Up travel)
 * invertendo la direzione del segmento se l'estremo finale è più vicino.
 */
function optimizePathTSP(paths) {
    if (!paths || paths.length <= 1) return paths;

    let unvisited = paths.map((path) => {
        let pts = Array.isArray(path) ? path : (path.points || []);
        return pts.map(p => ({ x: p.x, y: p.y }));
    }).filter(p => p.length > 0);

    if (unvisited.length === 0) return [];

    let result = [];
    let current = unvisited.shift();
    result.push(current);

    while (unvisited.length > 0) {
        let lastPt = current[current.length - 1];
        let bestDist = Infinity;
        let bestIdx = -1;
        let shouldReverse = false;

        for (let i = 0; i < unvisited.length; i++) {
            let candidate = unvisited[i];
            let startPt = candidate[0];
            let endPt = candidate[candidate.length - 1];

            let dStart = Math.hypot(startPt.x - lastPt.x, startPt.y - lastPt.y);
            let dEnd = Math.hypot(endPt.x - lastPt.x, endPt.y - lastPt.y);

            if (dStart < bestDist) {
                bestDist = dStart;
                bestIdx = i;
                shouldReverse = false;
            }
            if (dEnd < bestDist) {
                bestDist = dEnd;
                bestIdx = i;
                shouldReverse = true;
            }
        }

        let nextPath = unvisited.splice(bestIdx, 1)[0];
        if (shouldReverse) {
            nextPath.reverse();
        }
        result.push(nextPath);
        current = nextPath;
    }

    return result;
}

/**
 * Generatore G-Code Singolo Tracciato Pulito con ottimizzazione Nearest Neighbor TSP.
 */
function generateGCodeEngine(elements, config) {
    if (!elements || elements.length === 0) return "";

    const bedX = config.bedSizeX || 235;
    const bedY = config.bedSizeY || 235;
    const offsetX = config.offsetX || 0;
    const offsetY = config.offsetY || 0;
    const travelSpeed = config.travelSpeed || 4000;
    const feedrate = config.defaultFeedrate || 3000;
    const safetyZ = "10.00";
    const printZHop = (zHop > 0 ? zHop : 3.0).toFixed(2);
    const cmdUp = useCustom ? (config.penUpCmd || 'PEN_UP') : `G1 Z${printZHop} F${travelSpeed}`;
    const cmdDown = useCustom ? (config.penDownCmd || 'PEN_DOWN') : `G1 Z0.00 F${plungeSpeed}`;

    let gcode = [
        formatGCodeHeader(config.modeName || 'STUDIO', bedX, bedY, offsetX, offsetY, optimizeTSP),
        "G90             ; Coordinate assolute",
        `M204 S${accel}      ; Imposta accelerazione`,
        "M107            ; Disattiva ventole",
        "G28             ; Auto Home di calibrazione iniziale",
        `G1 Z${safetyZ} F${travelSpeed} ; Sicurezza sollevamento penna iniziale a 10mm`,
        "G92 E0          ; Azzera estrusore virtuale",
        "",
        "; --- INIZIO TRACCIATURA ---"
    ];

    const toNozzle = pt => ({
        x: pt.x - offsetX,
        y: pt.y - offsetY
    });

    let paths = [];
    elements.forEach(el => {
        if (el.type === 'path' || el.type === 'axis' || el.type === 'grid' || el.type === 'gcode-text') {
            if (el.points && el.points.length > 0) {
                paths.push(el.points);
            }
        } else if (el.type === 'point') {
            const r = 0.4;
            paths.push([
                { x: el.x - r, y: el.y },
                { x: el.x + r, y: el.y }
            ]);
        }
    });

    if (optimizeTSP && paths.length > 1) {
        paths = optimizePathTSP(paths);
    }

    let penIsDown = false;
    let lastPos = null;
    let isFirstMove = true;

    paths.forEach(points => {
        if (!points || points.length === 0) return;
        const start = toNozzle(points[0]);

        let isClose = false;
        if (lastPos) {
            const dist = Math.hypot(start.x - lastPos.x, start.y - lastPos.y);
            if (dist < 0.8) {
                isClose = true;
            }
        }

        if (isClose && penIsDown) {
            gcode.push(`G1 X${start.x.toFixed(3)} Y${start.y.toFixed(3)} F${feedrate} ; Spostamento continuo (no Z-Hop)`);
        } else {
            if (penIsDown) {
                gcode.push(`${cmdUp} ; Sollevamento Z-Hop (${printZHop}mm)`);
                penIsDown = false;
            }

            if (isFirstMove) {
                gcode.push(`G0 X${start.x.toFixed(3)} Y${start.y.toFixed(3)} Z${safetyZ} F${travelSpeed} ; Primo spostamento da Home ad altezza 10mm`);
                isFirstMove = false;
            } else {
                gcode.push(`G0 X${start.x.toFixed(3)} Y${start.y.toFixed(3)} F${travelSpeed} ; Spostamento rapido G0`);
            }

            gcode.push(`${cmdDown} ; Abbassamento penna a quota Z=0.00mm`);
            penIsDown = true;
        }

        if (points.length === 1) {
            const r = 0.3;
            gcode.push(`G1 X${(start.x - r).toFixed(3)} Y${start.y.toFixed(3)} F${feedrate}`);
            gcode.push(`G1 X${(start.x + r).toFixed(3)} Y${start.y.toFixed(3)} F${feedrate}`);
        } else {
            for (let i = 1; i < points.length; i++) {
                const pt = toNozzle(points[i]);
                gcode.push(`G1 X${pt.x.toFixed(3)} Y${pt.y.toFixed(3)} F${feedrate}`);
            }
        }

        lastPos = toNozzle(points[points.length - 1]);
    });

    const zSpeed = 600;
    if (penIsDown) {
        gcode.push(`G1 Z${safetyZ} F${zSpeed} ; Sollevamento finale di sicurezza a 10mm`);
        penIsDown = false;
    }

    gcode.push(
        "",
        "; --- FINE TRACCIATURA ---",
        `G1 Z${safetyZ} F${zSpeed} ; Sollevamento di sicurezza penna a 10mm`,
        `G0 X0.000 Y0.000 F${travelSpeed} ; Ritorno ad Home XY a penna alzata di 10mm`,
        "G28 X0 Y0       ; Auto Home finale per azzeramento e parcheggio sicuro",
        "END_PRINT       ; Macro Klipper per Mainsail/Moonraker",
        "; --- END G-CODE ---"
    );

    return gcode.join("\n");
}

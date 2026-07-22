/**
 * Studio Plotter CNC - Modulo G-Code Engine, TSP & SVG Export
 * Generatore di G-Code per Klipper/Marlin, ottimizzazione tracciato e parser vettoriali.
 */

function formatGCodeHeader(modeName, bedX, bedY, offsetX, offsetY, tspEnabled) {
    return [
        `; ===================================================`,
        `; Generato da Plotter Studio CNC v2.8K (Klipper/Marlin)`,
        `; Modalita: ${modeName.toUpperCase()}`,
        `; Piatto: X${bedX} Y${bedY}`,
        `; Offset Penna Relativo Ugello: X${offsetX} Y${offsetY}`,
        `; Ottimizzato Tracciato (TSP): ${tspEnabled ? 'SI' : 'NO'}`,
        `; ===================================================`,
        ``,
        `--- START G-CODE ---`
    ].join('\n');
}

function optimizePathTSP(paths) {
    if (!paths || paths.length <= 1) return paths;

    let unvisited = paths.map((path, idx) => ({ path, idx }));
    let result = [];

    let current = unvisited.shift();
    result.push(current.path);

    while (unvisited.length > 0) {
        let lastPt = current.path[current.path.length - 1];
        let bestDist = Infinity;
        let bestIdx = -1;
        let shouldReverse = false;

        for (let i = 0; i < unvisited.length; i++) {
            let candidate = unvisited[i].path;
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

        let nextItem = unvisited.splice(bestIdx, 1)[0];
        if (shouldReverse) {
            nextItem.path.reverse();
        }
        result.push(nextItem.path);
        current = nextItem;
    }

    return result;
}

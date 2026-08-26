/**
 * Studio Plotter CNC - Modulo Sorgente Vettoriale Esterna (GIS / SVG Import Engine)
 * Ispirato a "Applied Craft Line & Form"
 * Importa tracciati vettoriali da file SVG o coordinate geografiche GeoJSON / GIS,
 * convertendoli nel formato coordinato interno per il rendering e l'esportazione G-code.
 */

function parseGeoJSONToPaths(geoJson, targetWidth = 180, targetHeight = 180) {
    let paths = [];
    if (!geoJson) return paths;

    let features = geoJson.type === 'FeatureCollection' ? geoJson.features : [geoJson];

    // Trova i limiti sferici (BBox) lon/lat
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

    function extractCoords(coords) {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            let lon = coords[0], lat = coords[1];
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        } else {
            coords.forEach(c => extractCoords(c));
        }
    }

    features.forEach(f => {
        if (f.geometry && f.geometry.coordinates) {
            extractCoords(f.geometry.coordinates);
        }
    });

    if (minLon === Infinity || maxLon === Infinity) return paths;

    let lonSpan = (maxLon - minLon) || 1;
    let latSpan = (maxLat - minLat) || 1;
    let scale = Math.min(targetWidth / lonSpan, targetHeight / latSpan);

    let centerX = 115;
    let centerY = 115;

    function projectPoint(lon, lat) {
        let x = centerX + (lon - (minLon + maxLon) / 2) * scale;
        let y = centerY - (lat - (minLat + maxLat) / 2) * scale; // Inverte Y per coordinata cartesiana
        return { x: x, y: y };
    }

    function processGeometry(geom) {
        if (!geom || !geom.coordinates) return;

        if (geom.type === 'LineString') {
            let pts = geom.coordinates.map(c => projectPoint(c[0], c[1]));
            paths.push(pts);
        } else if (geom.type === 'MultiLineString' || geom.type === 'Polygon') {
            geom.coordinates.forEach(ring => {
                let pts = ring.map(c => projectPoint(c[0], c[1]));
                paths.push(pts);
            });
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => {
                poly.forEach(ring => {
                    let pts = ring.map(c => projectPoint(c[0], c[1]));
                    paths.push(pts);
                });
            });
        }
    }

    features.forEach(f => processGeometry(f.geometry));
    return paths;
}

function parseSvgPathStringToPoints(dString, sampleStep = 1.0) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', dString);
    const totalLen = pathEl.getTotalLength();
    if (!totalLen || isNaN(totalLen)) return [];

    let points = [];
    const steps = Math.max(10, Math.ceil(totalLen / sampleStep));

    for (let i = 0; i <= steps; i++) {
        const pt = pathEl.getPointAtLength((i / steps) * totalLen);
        points.push({ x: pt.x, y: pt.y });
    }

    return points;
}

function handleGisImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const geoJson = JSON.parse(e.target.result);
            const rawPaths = parseGeoJSONToPaths(geoJson, 180, 180);
            if (!rawPaths || rawPaths.length === 0) {
                alert("Nessun tracciato valido trovato nel file GeoJSON.");
                return;
            }

            if (typeof setMode === 'function') setMode('svg', false);
            currentRawElements = rawPaths.map(pts => ({ type: 'path', points: pts }));
            if (window.orfiniLayerManager) window.orfiniLayerManager.assignDefaultLayer(currentRawElements);
            if (typeof applyGlobalTransformAndRender === 'function') applyGlobalTransformAndRender();
        } catch (err) {
            alert("Errore nel parsing del file GeoJSON: " + err.message);
        }
    };
    reader.readAsText(file);
}

function handleSvgImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, 'image/svg+xml');
            const pathEls = doc.querySelectorAll('path');
            
            let rawPaths = [];
            pathEls.forEach(p => {
                const d = p.getAttribute('d');
                if (d) {
                    const pts = parseSvgPathStringToPoints(d, 1.5);
                    if (pts && pts.length > 0) rawPaths.push(pts);
                }
            });

            if (rawPaths.length === 0) {
                alert("Nessun tracciato <path d='...'> trovato nel file SVG.");
                return;
            }

            if (typeof setMode === 'function') setMode('svg', false);
            currentRawElements = rawPaths.map(pts => ({ type: 'path', points: pts }));
            if (window.orfiniLayerManager) window.orfiniLayerManager.assignDefaultLayer(currentRawElements);
            if (typeof applyGlobalTransformAndRender === 'function') applyGlobalTransformAndRender();
        } catch (err) {
            alert("Errore nel parsing del file SVG: " + err.message);
        }
    };
    reader.readAsText(file);
}

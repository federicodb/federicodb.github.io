/**
 * Studio Plotter CNC - Modulo Campiture Concentriche e Geometria (Fill Engine)
 * Algoritmi di inset, Delaunay e Chase-Curve ad angolo di deviazione costante.
 */

function insetPolygon(poly, dist) {
    let n = poly.length;
    if (n < 3) return null;

    let area = 0;
    for (let i = 0; i < n; i++) {
        let p1 = poly[i];
        let p2 = poly[(i + 1) % n];
        area += p1.x * p2.y - p2.x * p1.y;
    }

    if (Math.abs(area) < 1e-5) return null;
    let ccw = area > 0;

    let normals = [];
    for (let i = 0; i < n; i++) {
        let p1 = poly[i];
        let p2 = poly[(i + 1) % n];
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let len = Math.hypot(dx, dy);
        if (len < 1e-6) return null;

        let nx = ccw ? -dy / len : dy / len;
        let ny = ccw ? dx / len : -dx / len;
        normals.push({ nx, ny });
    }

    let lines = [];
    for (let i = 0; i < n; i++) {
        let p = poly[i];
        let norm = normals[i];
        lines.push({
            p: { x: p.x + norm.nx * dist, y: p.y + norm.ny * dist },
            v: { x: poly[(i + 1) % n].x - poly[i].x, y: poly[(i + 1) % n].y - poly[i].y }
        });
    }

    let newPoly = [];
    for (let i = 0; i < n; i++) {
        let l1 = lines[(i - 1 + n) % n];
        let l2 = lines[i];

        let det = l1.v.x * l2.v.y - l1.v.y * l2.v.x;
        if (Math.abs(det) < 1e-6) return null;

        let dx = l2.p.x - l1.p.x;
        let dy = l2.p.y - l1.p.y;
        let t = (dx * l2.v.y - dy * l2.v.x) / det;

        newPoly.push({
            x: l1.p.x + t * l1.v.x,
            y: l1.p.y + t * l1.v.y
        });
    }

    let newArea = 0;
    for (let i = 0; i < n; i++) {
        let p1 = newPoly[i];
        let p2 = newPoly[(i + 1) % n];
        newArea += p1.x * p2.y - p2.x * p1.y;
    }
    if ((area > 0 && newArea <= 1e-5) || (area < 0 && newArea >= -1e-5)) return null;

    if (Math.abs(newArea) >= Math.abs(area)) return null;

    return newPoly;
}

function isPointInPolygon(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        let xi = poly[i].x, yi = poly[i].y;
        let xj = poly[j].x, yj = poly[j].y;
        let intersect = ((yi > p.y) !== (yj > p.y))
            && (p.x < (xj - xi) * (p.y - yi) / (yj - yi + 0.0001) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function generateConcentricDelaunayFill(contour, spacing) {
    if (contour.length < 3) return [];
    let uniquePts = [];
    for (let p of contour) {
        if (uniquePts.length === 0 || Math.hypot(p.x - uniquePts[uniquePts.length - 1].x, p.y - uniquePts[uniquePts.length - 1].y) > 1e-3) {
            uniquePts.push(p);
        }
    }
    if (uniquePts.length > 2 && Math.hypot(uniquePts[0].x - uniquePts[uniquePts.length - 1].x, uniquePts[0].y - uniquePts[uniquePts.length - 1].y) < 1e-3) {
        uniquePts.pop();
    }
    if (uniquePts.length < 3) return [];

    let delaunay;
    try {
        delaunay = d3.Delaunay.from(uniquePts.map(p => [p.x, p.y]));
    } catch (e) {
        return [];
    }
    const triangles = delaunay.triangles;
    let spiralPath = [];

    for (let i = 0; i < triangles.length; i += 3) {
        let t1 = triangles[i];
        let t2 = triangles[i + 1];
        let t3 = triangles[i + 2];
        let poly = [uniquePts[t1], uniquePts[t2], uniquePts[t3]];

        let bary = { x: (poly[0].x + poly[1].x + poly[2].x) / 3, y: (poly[0].y + poly[1].y + poly[2].y) / 3 };
        if (!isPointInPolygon(bary, uniquePts)) continue;

        let a = Math.hypot(poly[1].x - poly[0].x, poly[1].y - poly[0].y);
        let b = Math.hypot(poly[2].x - poly[1].x, poly[2].y - poly[1].y);
        let c = Math.hypot(poly[0].x - poly[2].x, poly[0].y - poly[2].y);
        let s = (a + b + c) / 2;
        let area = Math.abs(poly[0].x * (poly[1].y - poly[2].y) + poly[1].x * (poly[2].y - poly[0].y) + poly[2].x * (poly[0].y - poly[1].y)) / 2;
        if (s < 1e-5 || area < 1e-5) continue;
        let inradius = area / s;

        let step = Math.min(spacing, inradius * 0.35);
        if (step < 1e-4) continue;

        let isClockwise = (i / 3) % 2 === 0;
        let curPoly = poly;

        spiralPath.push({ x: curPoly[0].x, y: curPoly[0].y });
        let iters = 0;
        while (curPoly && iters < 200) {
            let nextPoly = insetPolygon(curPoly, step);
            if (!nextPoly) {
                let cx = (curPoly[0].x + curPoly[1].x + curPoly[2].x) / 3;
                let cy = (curPoly[0].y + curPoly[1].y + curPoly[2].y) / 3;
                spiralPath.push({ x: cx, y: cy });
                break;
            }
            if (isClockwise) {
                spiralPath.push(curPoly[1], curPoly[2], curPoly[0]);
                spiralPath.push(nextPoly[0]);
            } else {
                spiralPath.push(curPoly[2], curPoly[1], curPoly[0]);
                spiralPath.push(nextPoly[0]);
            }
            curPoly = nextPoly;
            iters++;
        }
    }
    return spiralPath;
}

function generateConcentricChaseFill(poly, spacing, reverseSpiral = false) {
    if (poly.length < 3) return [];

    let cur = poly.map(p => ({ ...p }));
    let n = cur.length;
    let cx = cur.reduce((sum, p) => sum + p.x, 0) / n;
    let cy = cur.reduce((sum, p) => sum + p.y, 0) / n;

    let initialSides = [];
    for (let j = 0; j < n; j++) {
        let p1 = cur[j];
        let p2 = cur[(j + 1) % n];
        initialSides.push(Math.hypot(p2.x - p1.x, p2.y - p1.y));
    }
    let L0 = initialSides.reduce((sum, s) => sum + s, 0) / n;
    if (L0 < 1e-4) return [];

    let t = spacing / L0;
    t = Math.max(0.02, Math.min(0.25, t));

    let firstNext = [];
    for (let j = 0; j < n; j++) {
        let p1 = cur[j];
        let p2 = reverseSpiral ? cur[(j - 1 + n) % n] : cur[(j + 1) % n];
        firstNext.push({
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        });
    }
    let path = [...firstNext];
    cur = firstNext;

    for (let i = 0; i < 250; i++) {
        let maxDist = 0;
        for (let j = 0; j < n; j++) {
            let dBary = Math.hypot(cur[j].x - cx, cur[j].y - cy);
            if (dBary > maxDist) maxDist = dBary;
        }

        if (maxDist < 0.05) {
            path.push({ x: cx, y: cy });
            break;
        }

        let next = [];
        for (let j = 0; j < n; j++) {
            let p1 = cur[j];
            let p2 = reverseSpiral ? cur[(j - 1 + n) % n] : cur[(j + 1) % n];
            next.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            });
        }
        path.push(...next);
        cur = next;
    }
    return path;
}

function generateConcentricFill(poly, spacing, isEinsteinHat = false, reverseSpiral = false) {
    if (isEinsteinHat) {
        return generateConcentricDelaunayFill(poly, spacing);
    } else {
        return generateConcentricChaseFill(poly, spacing, reverseSpiral);
    }
}

/**
 * Studio Plotter CNC - Modulo Post-Processing Vettoriale (Linework Modifiers)
 * Ispirato a "Applied Craft Line & Form"
 * Implementa modificatori di tracciato: Douglas-Peucker simplification, fixed-step resampling,
 * Noise Field deformation, Clipper.js offsetting e riempimenti a tratteggio (Hatching).
 */

// 1. Algoritmo di Semplificazione Douglas-Peucker
function getSqDist(p1, p2) {
    const dx = p1.x - p2.x, dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

function getSqSegDist(p, p1, p2) {
    let x = p1.x, y = p1.y;
    let dx = p2.x - x, dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
        let t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = p2.x;
            y = p2.y;
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }
    dx = p.x - x;
    dy = p.y - y;
    return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    let maxSqDist = sqTolerance;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
        let sqDist = getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

function simplifyPath(points, tolerance = 0.5) {
    if (!points || points.length <= 2) return points;
    const sqTolerance = tolerance * tolerance;
    let simplified = [points[0]];
    simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
    simplified.push(points[points.length - 1]);
    return simplified;
}

// 2. Ricampionamento a Passo Fisso (Fixed-Step Resampling)
function resamplePath(points, stepLength = 2.0) {
    if (!points || points.length < 2) return points;

    let resampled = [{ x: points[0].x, y: points[0].y }];
    let accumulatedDist = 0;

    for (let i = 0; i < points.length - 1; i++) {
        let p1 = points[i];
        let p2 = points[i + 1];
        let segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        if (segDist === 0) continue;

        let curStep = stepLength - accumulatedDist;

        while (curStep <= segDist) {
            let t = curStep / segDist;
            let nx = p1.x + t * (p2.x - p1.x);
            let ny = p1.y + t * (p2.y - p1.y);
            resampled.push({ x: nx, y: ny });
            curStep += stepLength;
        }

        accumulatedDist = segDist - (curStep - stepLength);
    }

    let lastPt = points[points.length - 1];
    let endResampled = resampled[resampled.length - 1];
    if (Math.hypot(lastPt.x - endResampled.x, lastPt.y - endResampled.y) > 0.01) {
        resampled.push({ x: lastPt.x, y: lastPt.y });
    }

    return resampled;
}

// 3. Simple Pseudo-Perlin Noise per Deformazione di Campo
class FastNoise {
    constructor(seed = 12345) {
        this.seed = seed;
    }
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453123;
        return n - Math.floor(n);
    }
    smoothNoise(x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        
        const n00 = this.noise2D(xi, yi);
        const n10 = this.noise2D(xi + 1, yi);
        const n01 = this.noise2D(xi, yi + 1);
        const n11 = this.noise2D(xi + 1, yi + 1);

        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        return (1 - u) * (1 - v) * n00 + u * (1 - v) * n10 + (1 - u) * v * n01 + u * v * n11;
    }
}

function applyNoiseFieldDeformation(points, scale = 0.05, strength = 2.0, seed = 42) {
    if (!points || points.length === 0) return points;
    const noise = new FastNoise(seed);

    return points.map(pt => {
        const nVal = noise.smoothNoise(pt.x * scale, pt.y * scale);
        const angle = nVal * Math.PI * 2;
        const dx = Math.cos(angle) * strength;
        const dy = Math.sin(angle) * strength;
        return {
            x: pt.x + dx,
            y: pt.y + dy
        };
    });
}

// 4. Offsetting e Hatching Tratteggiato (Clipper.js o Fallback Matematico)
function offsetPathNative(points, delta = 0.5) {
    if (!points || points.length < 2) return points;
    let offsetPoints = [];

    for (let i = 0; i < points.length; i++) {
        let prev = points[Math.max(0, i - 1)];
        let next = points[Math.min(points.length - 1, i + 1)];

        let dx = next.x - prev.x;
        let dy = next.y - prev.y;
        let len = Math.hypot(dx, dy) || 1;

        // Normale ortogonale
        let nx = -dy / len;
        let ny = dx / len;

        offsetPoints.push({
            x: points[i].x + nx * delta,
            y: points[i].y + ny * delta
        });
    }

    return offsetPoints;
}

function generateHatchingFill(polygon, spacing = 2.0, angleDeg = 45) {
    if (!polygon || polygon.length < 3) return [];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    polygon.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
    });

    const rad = angleDeg * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    let hatchingLines = [];
    const diag = Math.hypot(maxX - minX, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    for (let d = -diag; d <= diag; d += spacing) {
        // Linea di scansione
        let x1 = cx + d * cosA - diag * sinA;
        let y1 = cy + d * sinA + diag * cosA;
        let x2 = cx + d * cosA + diag * sinA;
        let y2 = cy + d * sinA - diag * cosA;

        // Trova intersezioni con i segmenti del poligono
        let intersects = [];
        for (let i = 0; i < polygon.length; i++) {
            let p3 = polygon[i];
            let p4 = polygon[(i + 1) % polygon.length];

            let inter = getLineSegmentIntersection(x1, y1, x2, y2, p3.x, p3.y, p4.x, p4.y);
            if (inter) intersects.push(inter);
        }

        intersects.sort((a, b) => (a.x - b.x) || (a.y - b.y));

        for (let i = 0; i < intersects.length - 1; i += 2) {
            hatchingLines.push([intersects[i], intersects[i + 1]]);
        }
    }

    return hatchingLines;
}

function getLineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            x: x1 + ua * (x2 - x1),
            y: y1 + ua * (y2 - y1)
        };
    }
    return null;
}

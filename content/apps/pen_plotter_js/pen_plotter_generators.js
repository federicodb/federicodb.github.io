/**
 * Studio Plotter CNC - Modulo Generatori Matematici ed Algoritmi Generativi (Generators Engine)
 * Frattali, Tassellazioni, Harmonograph, Flow Field, Fibonacci, Noodles, Turtle, GeoJSON, Cubi 3D.
 */

// --- GENERATORE FRACTALI ---
function generateFractalElements(type, level, fillEnabled, spacingVirtual, penWidth, randVal = 0, currentRawElements = [], addSafetyPoint = () => {}) {
    if (type === 'sierpinski') {
        const fillStyle = document.getElementById('paramFractalFillStyle')?.value || 'spiral';
        const outlineEnabled = document.getElementById('paramFractalOutline')?.checked ?? true;

        function recurseSierpinski(p1, p2, p3, lvl) {
            addSafetyPoint();
            if (lvl === 0) {
                if (fillEnabled) {
                    if (outlineEnabled) {
                        currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: [p1, p2, p3, p1] });
                    }
                    if (fillStyle === 'spiral') {
                        const spiralPoints = generateConcentricFill([p1, p2, p3], spacingVirtual);
                        if (spiralPoints.length >= 2) {
                            currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: spiralPoints });
                        }
                    } else {
                        const hatchPoints = generateHatching45Fill([p1, p2, p3], spacingVirtual);
                        if (hatchPoints.length > 0) {
                            currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: hatchPoints });
                        }
                    }
                } else {
                    currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: [p1, p2, p3, p1] });
                }
            } else {
                let m12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                let m23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
                let m31 = { x: (p3.x + p1.x) / 2, y: (p3.y + p1.y) / 2 };

                if (randVal > 0) {
                    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                    const jitter = dist * randVal * 0.25;
                    m12.x += (Math.random() - 0.5) * jitter;
                    m12.y += (Math.random() - 0.5) * jitter;
                    m23.x += (Math.random() - 0.5) * jitter;
                    m23.y += (Math.random() - 0.5) * jitter;
                    m31.x += (Math.random() - 0.5) * jitter;
                    m31.y += (Math.random() - 0.5) * jitter;
                }

                recurseSierpinski(p1, m12, m31, lvl - 1);
                recurseSierpinski(m12, p2, m23, lvl - 1);
                recurseSierpinski(m31, m23, p3, lvl - 1);
            }
        }
        recurseSierpinski({ x: 10, y: 80 }, { x: 90, y: 80 }, { x: 50, y: 80 - 80 * Math.sqrt(3) / 2 }, level);
    }
    else if (type === 'carpet') {
        const fillStyle = document.getElementById('paramFractalFillStyle')?.value || 'spiral';
        const outlineEnabled = document.getElementById('paramFractalOutline')?.checked ?? true;

        function recurseCarpet(x, y, size, lvl) {
            addSafetyPoint();
            if (lvl === 0) {
                let p1 = { x: x, y: y }, p2 = { x: x + size, y: y }, p3 = { x: x + size, y: y + size }, p4 = { x: x, y: y + size };
                if (randVal > 0) {
                    const j = () => (Math.random() - 0.5) * randVal * size * 0.4;
                    p1.x += j(); p1.y += j();
                    p2.x += j(); p2.y += j();
                    p3.x += j(); p3.y += j();
                    p4.x += j(); p4.y += j();
                }
                if (fillEnabled) {
                    if (outlineEnabled) {
                        currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: [p1, p2, p3, p4, p1] });
                    }
                    if (fillStyle === 'spiral') {
                        const spiralPoints = generateConcentricFill([p1, p2, p3, p4], spacingVirtual);
                        if (spiralPoints.length >= 2) {
                            currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: spiralPoints });
                        }
                    } else {
                        const hatchPoints = generateHatching45Fill([p1, p2, p3, p4], spacingVirtual);
                        if (hatchPoints.length > 0) {
                            currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: hatchPoints });
                        }
                    }
                } else {
                    currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: [p1, p2, p3, p4, p1] });
                }
            } else {
                let s = size / 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (i === 1 && j === 1) continue;
                        recurseCarpet(x + i * s, y + j * s, s, lvl - 1);
                    }
                }
            }
        }
        recurseCarpet(10, 10, 80, level);
    }
    else if (type === 'ricorsione_quadrati') {
        const ox = 10, oy = 10;
        const L0 = 80;
        const fillStyle = document.getElementById('paramFractalFillStyle')?.value || 'spiral';
        const outlineEnabled = document.getElementById('paramFractalOutline')?.checked ?? true;

        if (outlineEnabled) {
            currentRawElements.push({
                type: 'path',
                stroke: '#818cf8',
                width: penWidth,
                points: [
                    { x: ox, y: oy },
                    { x: ox + L0, y: oy },
                    { x: ox + L0, y: oy + L0 },
                    { x: ox, y: oy + L0 },
                    { x: ox, y: oy }
                ]
            });
        }

        function drawFractalSquares(x, y, L, depth) {
            if (depth === 0) return;
            addSafetyPoint();

            const halfL = L / 2;
            const p1 = { x: x + halfL, y: y + halfL };
            const p2 = { x: x + L, y: y + halfL };
            const p3 = { x: x + L, y: y + L };
            const p4 = { x: x + halfL, y: y + L };

            if (fillEnabled) {
                if (outlineEnabled) {
                    currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: [p1, p2, p3, p4, p1] });
                }
                if (fillStyle === 'spiral') {
                    const spiralPoints = generateConcentricFill([p1, p2, p3, p4], spacingVirtual);
                    if (spiralPoints.length >= 2) {
                        currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: spiralPoints });
                    }
                } else {
                    const hatchPoints = generateHatching45Fill([p1, p2, p3, p4], spacingVirtual);
                    if (hatchPoints.length > 0) {
                        currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: hatchPoints });
                    }
                }
            } else {
                currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: [p1, p2, p3, p4, p1] });
            }

            drawFractalSquares(x, y + halfL, halfL, depth - 1);
            drawFractalSquares(x + halfL, y, halfL, depth - 1);
        }

        drawFractalSquares(ox, oy, L0, level);
    }
    else if (type === 'sierpinski_arrowhead') {
        let commands = "X";
        for (let i = 0; i < level; i++) {
            let next = "";
            for (let c = 0; c < commands.length; c++) {
                let ch = commands[c];
                if (ch === 'X') next += "YF+XF+Y";
                else if (ch === 'Y') next += "XF-YF-X";
                else next += ch;
            }
            commands = next;
        }

        let pts = [];
        let x = 10, y = 80;
        pts.push({ x: x, y: y });

        let angle = (level % 2 === 1) ? -60 : 0;
        let stepSize = 80 / Math.pow(2, level);

        for (let i = 0; i < commands.length; i++) {
            let cmd = commands[i];
            if (cmd === 'F') {
                x += stepSize * Math.cos(angle * Math.PI / 180);
                y += stepSize * Math.sin(angle * Math.PI / 180);
                pts.push({ x: x, y: y });
            } else if (cmd === '+') {
                angle += 60;
            } else if (cmd === '-') {
                angle -= 60;
            }
        }

        let minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
        let minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
        let w = maxX - minX, h = maxY - minY;
        let scale = 80 / Math.max(w, h || 1);

        let finalPts = pts.map(p => ({
            x: 50 + (p.x - (minX + w / 2)) * scale,
            y: 50 + (p.y - (minY + h / 2)) * scale
        }));

        currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: finalPts });
    }
}

                let rootsLaTeX = "\\text{nessuna}";
                let periodicity = findFunctionPeriodicity(evalExpr);
                let rootsText = "Nessuna";
                let yIntText = "Nessuna";
                let signText = "Non calcolato";
                let periodText = "Non periodica";
                let posLaTeX = "\\emptyset";

                if (periodicity) {
                    periodText = "T = " + periodicity.periodText;
                }

                if (nerdamerLoaded) {
                    try {
                        let yZero = node.evaluate({x: 0});
                        let isDefZero = !domainExcluded.some(pt => Math.abs(pt) < 1e-4);
                        if (isDefZero && !isNaN(yZero) && isFinite(yZero)) {
                            yIntText = "y = " + formatMathNumber(yZero);
                        }
                    } catch(e){}

                    let foundRoots = [];
                    try {
                        let sol = nerdamer.solve(cleanedExpr + ' = 0', 'x');
                        let solText = sol.text();
                        if (solText.startsWith('[') && solText.endsWith(']')) {
                            foundRoots = solText.slice(1, -1).split(',').map(s => parseFloat(nerdamer(s.trim()).evaluate().text()));
                        } else if (solText) {
                            foundRoots.push(parseFloat(nerdamer(solText).evaluate().text()));
                        }
                        foundRoots = foundRoots.filter(r => !isNaN(r) && !domainExcluded.some(pt => Math.abs(pt - r) < 1e-4));
                        foundRoots = [...new Set(foundRoots)].sort((a,b)=>a-b);
                        
                        if (foundRoots.length > 0) {
                            let rootStrs = foundRoots.map(r => formatMathNumber(r));
                            if (periodicity) {
                                rootsText = rootStrs.map(r => `x=${r} + k*${periodicity.periodText}`).join(", ");
                                rootsLaTeX = rootStrs.map(r => `x=${r} + k${periodicity.periodLaTeX}`).join(",\\quad ") + ",\\quad k \\in \\mathbb{Z}";
                            } else {
                                rootsText = rootStrs.map(r => `x=${r}`).join(", ");
                                rootsLaTeX = rootStrs.map(r => `x=${r}`).join(",\\quad ");
                            }
                        }
                    } catch(e){}

                    try {
                        let signCriticals = [...new Set([...domainExcluded, ...foundRoots])].sort((a, b) => a - b);
                        let signPts = [-Infinity, ...signCriticals, Infinity];
                        let posIntervals = [];
                        let posLatexInts = [];
                        for (let i = 0; i < signPts.length - 1; i++) {
                            let start = signPts[i];
                            let end = signPts[i+1];
                            let testPt = (start === -Infinity && end === Infinity) ? 0 :
                                         (start === -Infinity) ? end - 2 :
                                         (end === Infinity) ? start + 2 :
                                         (start + end) / 2;
                            let yTest = NaN;
                            try { yTest = node.evaluate({x: testPt}); } catch(e){}
                            if (typeof yTest === 'number' && !isNaN(yTest) && yTest > 1e-6) {
                                posIntervals.push(`(${start === -Infinity ? '-inf' : formatMathNumber(start)}, ${end === Infinity ? '+inf' : formatMathNumber(end)})`);
                                posLatexInts.push(`\\left(${start === -Infinity ? '-\\infty' : formatMathNumber(start)}, ${end === Infinity ? '+\\infty' : formatMathNumber(end)}\\right)`);
                            }
                        }
                        if (posIntervals.length > 0) {
                            if (periodicity) {
                                signText = posIntervals.map(i => i + " + k*" + periodicity.periodText).join(" U ");
                                posLaTeX = posLatexInts.map(i => i + " + k" + periodicity.periodLaTeX).join(" \\cup ") + ",\\quad k \\in \\mathbb{Z}";
                            } else {
                                signText = posIntervals.join(" U ");
                                posLaTeX = posLatexInts.join(" \\cup ");
                            }
                        } else {
                            signText = "Mai positiva";
                        }
                    } catch(e) {
                        signText = "Errore simbolico";
                        posLaTeX = "\\text{errore}";
                    }
                } else {
                    posLaTeX = "\\text{non supportato}";
                }

                let derivStr = "calcolo non supportato";
                let derivLaTeX = "\\text{calcolo non supportato}";
                if (nerdamerLoaded && document.getElementById('chkMathDeriv')?.checked) {
                    try {
                        let diffNode = nerdamer.diff(cleanedExpr, 'x');
                        derivStr = diffNode.text();
                        derivLaTeX = formatStrictLaTeX(diffNode.toTeX());
                    } catch (e) {}
                }

                let displayTexString = texString.replace(/\\frac/g, '\\dfrac');
                const analysisPanel = document.getElementById('math-analysis-panel');
                const gcodePanel = document.getElementById('gcode-preview-panel');
                if (analysisPanel) {
                    analysisPanel.classList.remove('hidden-mode');
                    if (gcodePanel) {
                        gcodePanel.classList.remove('md:w-full');
                        gcodePanel.classList.add('md:w-[55%]');
                    }
                    let htmlReport = `
                        <div class="space-y-3">
                            <div><strong>Funzione:</strong> $$ f(x) = ${displayTexString} $$</div>
                            <div><strong>Dominio Analitico:</strong> $$ D: ${domainLaTeX} $$</div>
                            <div><strong>Intersezione X:</strong> $$ ${rootsLaTeX} $$</div>
                            <div><strong>Segno ($f(x) > 0$):</strong> $$ ${posLaTeX} $$</div>
                            <div><strong>Derivata Prima:</strong> $$ f'(x) = ${derivLaTeX} $$</div>
                        </div>
                    `;
                    document.getElementById('mathAnalysisContent').innerHTML = htmlReport;
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        MathJax.typesetPromise([document.getElementById('mathAnalysisContent')]).catch(e => console.log(e));
                    }
                }

                const chkShowTextVal = document.getElementById('chkShowMathText')?.checked || false;
                const textScale = parseFloat(document.getElementById('mathTextSize').value);
                const textStartX = parseFloat(document.getElementById('mathTextX').value);
                let textCursorY = parseFloat(document.getElementById('mathTextY').value);
                const isFlipped = document.getElementById('paramFlip180')?.checked || false;

                if (chkShowTextVal) {
                    let summaryLines = [
                        `Funzione: f(x) = ${exprStrRaw}`,
                        `1. Dominio: ${domainText}`,
                        `2. Segno: f(x) > 0 per x in ${signText}`,
                        `3. Int. Assi: X: ${rootsText} ; Y: ${yIntText}`,
                        `4. Periodo: ${periodText}`
                    ];
                    
                    summaryLines.forEach(line => {
                        let paths = generateSingleLineTextPaths(line, textStartX, textCursorY, textScale * 0.9, false);
                        paths.forEach(p => currentRawElements.push({ type: 'path', stroke: '#818cf8', width: penWidth, points: p }));
                        textCursorY += 8 * textScale;
                    });
                }

                const baseGraphElements = [...currentRawElements];

                if (isFlipped) {
                    const cx = bedSizeX / 2;
                    const cy = bedSizeY / 2;
                    for (let i = 0; i < currentRawElements.length; i++) {
                        const el = currentRawElements[i];
                        if (el.type === 'path') {
                            el.points = el.points.map(pt => ({ x: 2 * cx - pt.x, y: 2 * cy - pt.y }));
                        }
                    }
                }

                applyGlobalTransformAndRender();

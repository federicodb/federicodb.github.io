import assert from 'node:assert/strict';
import { parse, evaluate, toTex } from '../js/engine/expr.js';
import { checkNumber, checkExpr } from '../js/engine/check.js';
import { createRng, settimana } from '../js/engine/rng.js';
import parabola from '../activities/funzioni/parabola.js';

const ev = (s, sc={}) => evaluate(parse(s), sc);
assert.equal(ev('2+3*4'), 14);
assert.equal(ev('-2^2'), -4);
assert.equal(ev('2^3^2'), 512);
assert.equal(ev('2,5*2'), 5);
assert.equal(ev('3/4'), 0.75);
assert.equal(ev('√9'), 3);
assert.equal(ev('sqrt(16)+1'), 5);
assert.equal(ev('2x', {x:3}), 6);
assert.equal(ev('3(x+1)', {x:2}), 9);
assert.equal(ev('(x+1)(x-1)', {x:3}), 8);
assert.equal(ev('x²', {x:5}), 25);
assert.equal(ev('12 : 4'), 3);
assert.equal(ev('2·3×4'), 24);
assert.equal(ev('[2+(3)]*2'), 10);

assert.ok(checkNumber('3/4', {answer:0.75}).ok);
// domande sull'esponente: la potenza scritta per intero vale come l'esponente, ma solo con la base giusta
assert.ok(checkNumber('10^17', {answer:17, powerBase:10}).ok);
assert.ok(checkNumber('2^-2', {answer:-2, powerBase:2}).ok);
assert.ok(!checkNumber('3^5', {answer:5, powerBase:2}).ok);
assert.ok(!checkNumber('8', {answer:3, powerBase:2}).ok);
assert.equal(checkNumber('2^12', {answer:7, powerBase:2, traps:[{value:12, msg:'somma'}]}).message, 'somma');
assert.ok(checkNumber('0,75', {answer:0.75}).ok);
assert.ok(checkNumber('12,35', {answer:12.3456, decimals:2}).ok);
assert.ok(!checkNumber('12,4', {answer:12.3456, decimals:2}).ok);
assert.ok(checkNumber('15%', {answer:15}).ok);
assert.equal(checkNumber('x', {answer:1}).invalid, true);
assert.equal(checkNumber('2+', {answer:1}).invalid, true);
assert.equal(checkNumber('7', {answer:5, traps:[{value:7,msg:'t'}]}).message, 't');

assert.ok(checkExpr('a^3*a^4', {answer:'a^7'}).ok);
const form = t => t.k==='pow' && t.a.k==='var' && t.b.k==='num' ? null : 'Scrivila come unica potenza';
assert.equal(checkExpr('a^3*a^4', {answer:'a^7', form}).message, 'Scrivila come unica potenza');
assert.ok(checkExpr('a^7', {answer:'a^7', form}).ok);
assert.equal(checkExpr('a^12', {answer:'a^7', traps:[{expr:'a^12', msg:'mult'}]}).message, 'mult');
assert.ok(checkExpr('2(x+3)', {answer:'2x+6'}).ok);
assert.ok(!checkExpr('2x+3', {answer:'2x+6'}).ok);
assert.equal(checkExpr('y+1', {answer:'x+1'}).invalid, true);

const r1 = createRng(42), r2 = createRng(42);
for (let i=0;i<10;i++) assert.equal(r1.int(1,100), r2.int(1,100));
const r = createRng(1); const seen = new Set();
for (let i=0;i<2000;i++){ const v=r.int(-3,3); assert.ok(v>=-3&&v<=3); seen.add(v); }
assert.equal(seen.size, 7);
// varianti della settimana: stessa settimana => stessi tipi di esercizio, numeri nuovi; settimane diverse => varianti diverse
const rs = createRng(5);
assert.equal(settimana(rs), rs);
const lesson = (seed, week) => { const g = createRng(seed); g.week = createRng(week); return parabola.generate(g, 1); };
const kinds = (steps) => steps.map((st) => st.type).join();
const prompts = (steps) => steps.map((st) => st.prompt + JSON.stringify(st.items || st.statements || '')).join();
assert.equal(kinds(lesson(1, 777)), kinds(lesson(2, 777)));
assert.notEqual(prompts(lesson(1, 777)), prompts(lesson(2, 777)));
assert.ok(new Set(Array.from({ length: 20 }, (_, w) => kinds(lesson(1, w)))).size > 1);
console.log(toTex(parse('3x^2-(x+1)/2')));
console.log('engine OK');

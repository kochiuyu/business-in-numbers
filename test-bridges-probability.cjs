'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const eq = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const files = ['src/probability.html'];
if (process.argv.includes('--built')) files.push('dist/probability.html');
const plain = html => html.replace(/<[^>]*>/g, '').trim();
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const block = html.match(/<section class="c2-depth-worked" id="c2-overlap-cells"[\s\S]*?<\/section>/)?.[0];
  ok(block, `${file}: four-region explanation exists`);
  ok(block.includes('aria-labelledby="c2-overlap-cells-title"') && block.includes('id="c2-overlap-cells-title"'), 'named section');
  eq((html.match(/id="c2-overlap-cells"/g) || []).length, 1, 'unique section ID');
  ok(html.indexOf('id="c2-overlap-cells"') > html.indexOf('id="rules"') && html.indexOf('id="c2-overlap-cells"') < html.indexOf('id="prob-step-3"'), 'placement after rules in step two');
  eq((block.match(/<li>/g) || []).length, 3, 'three paced reasoning steps');
  ok(block.includes('<caption>') && block.includes('tabindex="0" role="region" aria-label='), 'captioned keyboard-scrollable table');
  eq((block.match(/scope="col"/g) || []).length, 4, 'four column headers');
  eq((block.match(/scope="row"/g) || []).length, 4, 'four named regions');
  const rows = [...block.matchAll(/<tr><th scope="row">([\s\S]*?)<\/tr>/g)].map(match => [...match[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(cell => plain(cell[1])));
  eq(rows.map(row => row[0]), ['Both', 'A only', 'B only', 'Neither'], 'region order');
  eq(rows.map(row => row[2]), ['0.3', '−0.1: impossible', '0.2', '0.6'], 'displayed original regions');
  eq(rows.map(row => row[3]), ['0.3', '0.1', '0.2', '0.4'], 'displayed repaired regions');
  for (const phrase of ['Adding to one is necessary, not sufficient.', '0.3/0.5 = 0.6', '0.8 + 0.7 − 0.4 = 1.1', '0.5 must overlap', '0.5 ≤ x ≤ 0.7']) ok(block.includes(phrase), `reasoning retained: ${phrase}`);
  ok(block.includes('<details class="c2-check"><summary>Check:'), 'native practice disclosure');
  ok(!/\bhidden\b|<script|<input|<button/.test(block), 'complete without JavaScript');
  ok(html.includes('Spot the impossible input:') && html.includes('0.3 &gt; 0.2'), 'original technical example preserved');
}
const source = fs.readFileSync('src/probability.html', 'utf8');
const restored = require('./scripts/readability-preservation.cjs').restore(source, 'probability').replace(/<section class="c2-depth-worked" id="c2-overlap-cells"[\s\S]*?<\/section>/, '');
eq(require('node:crypto').createHash('sha256').update(restored).digest('hex'), 'a4225d5fe8037620a2cdbf4b5676c477506f2843f8a58dab1ce24a9e89c91fe3', 'all previous Class 2 content preserved byte for byte');
// Exact integer arithmetic in tenths, independent of the displayed decimal work.
const regions = (a, b, x) => [x, a - x, b - x, 10 - a - b + x];
eq(regions(2, 5, 3), [3, -1, 2, 6], 'original impossible case');
eq(regions(4, 5, 3), [3, 1, 2, 4], 'repaired case');
eq(regions(8, 7, 4), [4, 4, 3, -1], 'lower-bound failure');
eq(regions(8, 7, 5), [5, 3, 2, 0], 'minimum feasible overlap');
eq(regions(8, 7, 7), [7, 1, 0, 2], 'maximum feasible overlap');
for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) for (let x = 0; x <= 10; x++) {
  const cells = regions(a, b, x);
  eq(cells.reduce((sum, cell) => sum + cell, 0), 10, 'four regions sum to one');
  eq(cells.every(cell => cell >= 0), x >= Math.max(0, a + b - 10) && x <= Math.min(a, b), 'bounds exactly match nonnegative regions');
}
// Count a concrete repaired 10-outcome model rather than reusing the formula.
const A = new Set([0, 1, 2, 3]), B = new Set([0, 1, 2, 4, 5]);
const overlap = [...A].filter(outcome => B.has(outcome)).length;
eq(overlap, 3, 'three overlapping outcomes');
eq(overlap / B.size, 0.6, 'repaired conditional');
console.log(`Probability overlap bridge: ${checks} checks passed (${files.join(', ')}).`);

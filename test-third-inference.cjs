'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
let checks = 0;
const ok = (x, message) => { checks++; assert.ok(x, message); };
const near = (a, b, tolerance = 1e-10) => ok(Math.abs(a - b) < tolerance, `${a} ≈ ${b}`);
function originalTopics(html) {
  const topics = []; let depth = 0, start = -1;
  for (const match of html.matchAll(/<\/?details\b[^>]*>/g)) {
    if (match[0].startsWith('</')) {
      depth--;
      if (!depth && start !== -1) { topics.push(html.slice(start, match.index + match[0].length)); start = -1; }
    } else { if (!depth && match[0].includes('class="lesson"')) start = match.index; depth++; }
  }
  ok(depth === 0, 'Balanced native disclosures');
  return topics;
}
for (const [n, file, id, marker] of [
  [4, 'sampling-distributions', 'sampling-composition', 'samvisual:design'],
  [5, 'estimation', 'estimation-prediction', 'estvisual:coverage'],
  [6, 'hypothesis-testing', 'hypothesis-threshold', 'hypvisual:decision']
]) {
  const html = fs.readFileSync(`src/${file}.html`, 'utf8');
  const block = html.match(new RegExp(`<aside class="lesson-bridge" id="${id}-check"[\\s\\S]*?<\\/aside>`))?.[0];
  ok(block, `${file}: added bridge exists`);
  const restored=require('./scripts/readability-preservation.cjs').restore(html,file);
  ok(restored.includes(`{{${marker}}}${block}`), 'Bridge retains its relevant learning scene through the reviewed optional wrapper');
  ok(block.includes(`aria-labelledby="${id}-title"`), 'Named region');
  ok(block.includes(`<h3 id="${id}-title">`), 'Label target exists');
  ok(block.includes('<strong>Predict:</strong>'), 'Prediction precedes feedback');
  ok((block.match(/<details>/g) || []).length === 1, 'One native feedback disclosure');
  ok(/<details><summary>[^<]+<\/summary><p>/.test(block), 'Feedback uses an accessible native summary');
  ok(!/onclick|hidden|<script|{{/.test(block), 'Exposition and feedback require no JavaScript or rendering macros');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  ok(ids.length === new Set(ids).size, 'No duplicate source IDs');
  assert.deepEqual(originalTopics(html).map(t => crypto.createHash('sha256').update(t).digest('hex')),
    JSON.parse(fs.readFileSync(`test-class${n}-reference.json`, 'utf8')).topic_sha256);
  checks++;
}
// Design arithmetic: within-group sampling, fixed population weights.
near(.8 * 10 + .2 * 30, 14);
near(.5 * 10 + .5 * 30, 20);
for (const perGroup of [50, 500]) near((perGroup * 10 + perGroup * 30) / (2 * perGroup) - 14, 6);
// Independent numerical integration checks the normal critical value used in the prediction example.
function normalCDF(z) {
  const a = -10, n = 20000, h = (z - a) / n;
  const density = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  let sum = density(a) + density(z);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * density(a + i * h);
  return sum * h / 3;
}
const z = 1.959963984540054;
near(normalCDF(z) - normalCDF(-z), .95, 1e-11);
near(18 / Math.sqrt(81), 2); near(18 / Math.sqrt(324), 1);
near(18 ** 2 + 18 ** 2 / 81, 328);
near(18 ** 2 + 18 ** 2 / 324, 325);
ok((72 - z * Math.sqrt(328)).toFixed(2) === '36.50');
ok((72 + z * Math.sqrt(328)).toFixed(2) === '107.50');
ok(Math.sqrt(328).toFixed(2) === '18.11');
ok(Math.sqrt(325).toFixed(2) === '18.03');
const includes = ([lo, hi], x) => lo <= x && x <= hi;
const A = [-.5, .5], B = [-3, 5];
ok(includes(A, 0) && includes(B, 0));
ok(!includes(A, 2) && A[1] < 2);
ok(includes(B, 2) && includes(B, -3));
console.log(`Passed ${checks} third-round inference checks: preserved original lessons, native feedback, sampling weights, prediction uncertainty and practical thresholds.`);

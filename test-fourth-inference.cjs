'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const H = require('./src/hypothesis-core');
const V = require('./src/class-six-visuals');
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const near = (actual, expected, tolerance = 1e-9) => ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);
// Independent Simpson integration and bisection, not the course's normal routines.
function cdf(z) {
  const a = -10, n = 20000, h = (z - a) / n;
  const f = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  let sum = f(a) + f(z);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return sum * h / 3;
}
let lo = 0, hi = 4;
for (let i = 0; i < 50; i++) {
  const mid = (lo + hi) / 2;
  if (cdf(mid) < .95) lo = mid; else hi = mid;
}
const critical = (lo + hi) / 2;
const cutoff = 50 + critical * 8 / Math.sqrt(64);
const power = 1 - cdf((cutoff - 52) / (8 / Math.sqrt(64)));
near(1 - cdf((cutoff - 50) / 1), .05);
near(H.power({n: 64}).upper, cutoff);
near(H.power({n: 64}).power, power);
near(H.power({n: 64}).beta, 1 - power);
const html = fs.readFileSync('src/hypothesis-testing.html', 'utf8');
const start = html.indexOf('<div class="lesson-bridge" id="hypothesis-error-denominators"');
const end = html.indexOf('</div>', start) + '</div>'.length;
const block = html.slice(start, end);
ok(start >= 0 && end > start, 'Visible error-denominator explanation exists');
ok(html.includes('{{hypvisual:power}}' + block), 'Explanation stays in existing power step, directly after its chart');
ok(html.indexOf('id="errors-power"', start) > end, 'Original technical lesson still follows the concrete transition');
ok(block.includes('role="region" aria-labelledby="hypothesis-error-denominators-title"'), 'Exposition has an accessible name');
ok(block.includes('<h3 id="hypothesis-error-denominators-title">'), 'Region label resolves');
ok(!/hidden|<script|onclick|{{/.test(block), 'All new learning content works without JavaScript');
ok(/<details><summary>[^<]+<\/summary><p>[\s\S]+<\/p><\/details>/.test(block), 'Feedback uses a native disclosure');
ok(block.indexOf('<strong>Predict:</strong>') < block.indexOf('<details>'), 'Learner predicts before revealing feedback');
ok(block.includes('64-observation plan') && block.includes('IID normal times with known population SD 8 minutes'), 'Worked plan and model are explicit');
ok(block.includes('1,000 counts studies; 64 counts observations'), 'Study and observation denominators distinguished');
ok(block.includes('not a claim that half of real processes have a delay'), 'Two worlds are not an assumed real-world mixture');
ok(block.includes('expected, rounded counts, not guaranteed totals'), 'Expected frequencies are not promises');
const shownCutoff = Number(block.match(/<strong>([\d.]+) minutes<\/strong>/)[1]);
near(shownCutoff, Number(cutoff.toFixed(4)), 1e-12);
const shownNullAlarms = Number(block.match(/<strong>(\d+) false alarms<\/strong>/)[1]);
const shownDetections = Number(block.match(/<strong>(\d+) detections<\/strong>/)[1]);
const shownMisses = Number(block.match(/<strong>(\d+) misses<\/strong>/)[1]);
ok(shownNullAlarms === Math.round(1000 * .05), 'False alarms use true-null studies as denominator');
ok(shownDetections === Math.round(1000 * power), 'Detection count independently reproduced');
ok(shownMisses === Math.round(1000 * (1 - power)), 'Miss count independently reproduced');
ok(shownDetections + shownMisses === 1000, 'Alternative-world outcomes partition its repetitions');
ok(block.includes(`${(100 * power).toFixed(1)}%`), 'Displayed power agrees with independent calculation');
ok(block.replaceAll("−", "-").includes(`${((cutoff - 52) / 1).toFixed(4)} SE`), 'Alternative standardization uses the alternative mean');
ok(V.views.power('64').includes(`${(100 * power).toFixed(1)}%`), 'Worked frequencies agree with the existing chart');
// Denominator inversion is not valid: the fraction of alerts that are false changes
// with the real-world mixture even when alpha and power remain unchanged.
const falseShare = trueNullFraction => (.05 * trueNullFraction) /
  (.05 * trueNullFraction + power * (1 - trueNullFraction));
ok(falseShare(.9) > falseShare(.1), 'Same error rates do not determine the false share among alerts');
ok(Math.abs(falseShare(.9) - .05) > .1, 'Five percent alpha need not mean five percent of alerts are false');
// Protect all original technical lessons and unique IDs in every audited class.
function topics(source) {
  const out = []; let depth = 0, from = -1;
  for (const m of source.matchAll(/<\/?details\b[^>]*>/g)) {
    if (m[0].startsWith('</')) {
      depth--;
      if (!depth && from !== -1) { out.push(source.slice(from, m.index + m[0].length)); from = -1; }
    } else { if (!depth && m[0].includes('class="lesson"')) from = m.index; depth++; }
    ok(depth >= 0, 'Disclosure nesting is valid');
  }
  ok(depth === 0, 'Disclosures are balanced');
  return out;
}
for (const [n, name] of [[4, 'sampling-distributions'], [5, 'estimation'], [6, 'hypothesis-testing']]) {
  const source = fs.readFileSync(`src/${name}.html`, 'utf8');
  assert.deepEqual(topics(source).map(t => crypto.createHash('sha256').update(t).digest('hex')),
    JSON.parse(fs.readFileSync(`test-class${n}-reference.json`, 'utf8')).topic_sha256);
  checks++;
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  ok(ids.length === new Set(ids).size, `Class ${n} IDs remain unique`);
}
console.log(`Passed ${checks} fourth-round inference checks: independent power oracle, conditional denominators, native feedback and original lesson preservation.`);

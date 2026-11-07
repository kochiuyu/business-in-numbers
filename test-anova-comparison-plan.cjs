'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
for (const dir of ['src', 'dist']) {
  const html = fs.readFileSync(`${dir}/anova.html`, 'utf8');
  ok(!html.includes('before any planned, appropriately adjusted follow-up comparisons'), 'No mandatory omnibus gate in introduction');
  ok(html.includes('Specific comparisons answer different questions; plan them and any multiplicity adjustment before seeing the data.'), 'Comparison planning explained');
  const match = html.match(/<p id="anova-comparison-plan">[\s\S]*?<\/p>/);
  ok(match, 'Stable anchor for the comparison-plan distinction');
  const note = match[0];
  for (const phrase of [
    'A single prespecified contrast',
    'a family of comparisons with suitable error control',
    'does not require a significant omnibus F first',
    'Planning several comparisons does not by itself remove multiplicity',
    'Bonferroni protection used below does not depend on the global test rejecting',
    'before inspecting the results'
  ]) ok(note.includes(phrase), phrase);
  const start = html.indexOf('id="anova-step-6"');
  const end = html.indexOf('id="anova-step-7"');
  ok(start < match.index && match.index < end, 'Distinction appears in the decision step');
  ok(html.includes('Choose the comparison family before seeing results.</p></div>'+note), 'Static explanation is outside the dynamically replaced result');
  ok(html.includes('Each specific contrast needs its own analysis and suitable error control for the comparison family.'), 'Answer preserves pairwise-inference limitation');
}
console.log(`Passed ${checks} ANOVA comparison-plan regression assertions.`);

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

let total = 0;
for (const page of ['descriptive-statistics.html','probability.html','random-variables.html','anova.html']) {
  const html = fs.readFileSync(`dist/${page}`,'utf8');
  const match = html.match(/<script type="application\/json" data-presentation-config>(.*?)<\/script>/s);
  assert(match, `${page}: presentation manifest`);
  const config = JSON.parse(match[1]);
  for (const slide of config.slides) {
    if (!slide.lineHtml) continue;
    total++;
    assert(slide.line, `${page}: original readable line`);
    assert.match(slide.lineHtml, /<math\b/, `${page}: accessible MathML`);
    assert.doesNotMatch(slide.lineHtml, /katex-error/, `${page}: no failed equation`);
  }
  assert.match(html, /vendor\/katex\/katex/, `${page}: bundled fonts`);
}
assert(total >= 120, `Expected slide math coverage, got ${total}`);
console.log(`Passed ${total} pre-rendered slide equations with MathML and local fonts.`);

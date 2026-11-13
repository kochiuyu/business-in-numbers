'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

let total = 0;
for (const page of ['descriptive-statistics.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','anova.html']) {
  const html = fs.readFileSync(`dist/${page}`,'utf8');
  const match = html.match(/<script type="application\/json" data-presentation-config>(.*?)<\/script>/s);
  assert(match, `${page}: presentation manifest`);
  const config = JSON.parse(match[1]);
  if (page === 'sampling-distributions.html' || page === 'estimation.html') {
    assert.equal(config.slides.length,page === 'sampling-distributions.html' ? 57 : 65);
    assert.equal(new Set(config.slides.map(slide => slide.id)).size,config.slides.length);
    assert.equal(config.slides.filter(slide => slide.kind === 'scene').length,page === 'sampling-distributions.html' ? 13 : 11);
    for (const slide of config.slides.filter(slide => slide.id.endsWith('-calculate') && slide.id !== 'sampling-step-1-calculate')) assert(slide.lineHtml,`${slide.id}: rendered equation`);
  }
  for (const slide of config.slides) {
    if (!slide.lineHtml) continue;
    total++;
    assert(slide.line, `${page}: original readable line`);
    assert.match(slide.lineHtml, /<math\b/, `${page}: accessible MathML`);
    assert.doesNotMatch(slide.lineHtml, /katex-error/, `${page}: no failed equation`);
  }
  assert.match(html, /vendor\/katex\/katex/, `${page}: bundled fonts`);
}
assert(total >= 145, `Expected slide math coverage, got ${total}`);
console.log(`Passed ${total} pre-rendered slide equations with MathML and local fonts.`);

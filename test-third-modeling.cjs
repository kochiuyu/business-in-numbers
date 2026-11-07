'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
let checks = 0;
const ok = (v, m) => { checks++; assert.ok(v, m); };
const near = (a, b) => ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
function topics(s) {
  s=s.replace(/<!-- normal-depth:start -->[\s\S]*?<!-- normal-depth:end -->/,'').replace(/<!-- coefficient-weights-depth:start -->[\s\S]*?<!-- coefficient-weights-depth:end -->/,'');

  const out = [], re = /<\/?details\b[^>]*>/g;
  let m, depth = 0, start = -1;
  while ((m = re.exec(s))) {
    if (m[0].startsWith('</')) {
      depth--;
      if (depth === 0 && start !== -1) { out.push(s.slice(start, re.lastIndex)); start = -1; }
    } else { if (depth === 0 && m[0].includes('class="lesson"')) start = m.index; depth++; }
  }
  return out;
}
for (const [page, number, name, step] of [
  ['anova', 7, 'interaction-scale', 11], ['regression', 8, 'future-check', 10]
]) {
  const html = fs.readFileSync(`src/${page}.html`, 'utf8');
  const reference = JSON.parse(fs.readFileSync(`test-class${number}-reference.json`, 'utf8'));
  assert.deepEqual(topics(html).map(t => crypto.createHash('sha256').update(t).digest('hex')).sort(), [...reference.topic_sha256].sort()); checks++;
  const marker = `id="em-${name}-bridge"`, start = html.indexOf(marker), end = html.indexOf('</aside>', start);
  ok(start > html.indexOf(page==='anova'?'id="anova-interaction-contrast"':`id="${page}-step-${step}"`) && end < html.indexOf(page==='anova'?'id="anova-step-11"':`id="${page}-step-${step + 1}"`), 'Bridge is in intended learning step');
  const block = html.slice(start, end);
  ok(block.includes(`aria-labelledby="em-${name}-heading"`) && block.includes(`id="em-${name}-heading"`), 'Named landmark');
  ok(block.includes('<ol class="em-worked-path">'), 'Ordered conceptual bridge');
  ok(block.includes('<details><summary>') && block.includes('</summary><p>'), 'Native disclosure with feedback');
  ok(!/\bhidden\b|<script|<button|<select|<details[^>]*\bopen\b/.test(block), 'Prediction feedback initially closed; no JS dependency');
  ok(!topics(html).some(t => t.includes(marker)), 'Original technical lesson is untouched');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  ok(ids.length === new Set(ids).size, 'Unique IDs');
}
const anovaText = fs.readFileSync('src/anova.html', 'utf8');
ok(anovaText.includes('within-cell standard deviation doubles'), 'Noise change names the SD scale');
ok(anovaText.includes('8 residual df under the original normal-error model'), 'Exact t reference retains its distributional assumption');
// Independent calculation from the original cell observations, without course cores.
const cells = [[[18,20,22],[24,26,28]],[[22,24,26],[36,38,40]]];
const mean = a => a.reduce((s,v) => s+v,0)/a.length;
const means = cells.map(row => row.map(mean));
const weekday = means[1][0]-means[0][0], weekend = means[1][1]-means[0][1];
const contrast = weekend-weekday;
const errorSS = cells.flat().reduce((s,c) => s+c.reduce((t,v) => t+(v-mean(c))**2,0),0);
const df = cells.flat().reduce((s,c) => s+c.length-1,0), mse = errorSS/df;
const se = Math.sqrt(cells.flat().reduce((s,c) => s+mse/c.length,0));
near(weekday,4); near(weekend,12); near(contrast,8); near(df,8); near(mse,4);
near(se,Math.sqrt(16/3)); near((contrast/se)**2,12); near((contrast/(2*se))**2,3);
ok(se.toFixed(2)==='2.31'); ok((2*se).toFixed(2)==='4.62');
// Freeze training estimates, then score one untouched hypothetical ninth week.
const pairs = [[1,11],[2,12],[3,16],[4,15],[5,19],[6,20],[7,23],[8,24]];
const mx = mean(pairs.map(p=>p[0])), my = mean(pairs.map(p=>p[1]));
const b = pairs.reduce((s,[x,y])=>s+(x-mx)*(y-my),0)/pairs.reduce((s,[x])=>s+(x-mx)**2,0), a = my-b*mx;
const forecast = (a+b*6)*10, baseline = my*10, actual = 180;
near(forecast,2855/14); near(baseline,175);
ok(forecast.toFixed(2)==='203.93'); ok(((actual-forecast)**2).toFixed(2)==='572.58'); near((actual-baseline)**2,25);
ok(Math.abs(actual-baseline)<Math.abs(actual-forecast), 'Training-fit winner need not win a future comparison');
console.log(`Passed ${checks} third-round modeling checks: preserved lessons, no-JS feedback, interaction uncertainty and frozen future prediction arithmetic.`);

'use strict';
// Check the assumptions in formative feedback as well as the answer keys.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const eq = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
function questions(file) {
  const source = fs.readFileSync(`src/${file}.js`, 'utf8');
  const start = source.indexOf('const questions=') + 'const questions='.length;
  const end = source.indexOf('];', start) + 1;
  return JSON.parse(JSON.stringify(vm.runInNewContext(source.slice(start, end))));
}
const regression = questions('regression')[5];
ok(regression[0].includes('E(ε|x)=0'), 'The conditional-mean conclusion has its conditional-mean assumption');
eq(regression[1][regression[2]], 'E(y|x)=α+βx.');
ok(regression[3].includes('E(ε)=0, is not enough'), 'Feedback distinguishes overall from conditional error means');
// Counterexample independent of the course cores: equally likely X = -1,+1,
// error = X, alpha = 10, beta = 2. Overall error mean is zero but both
// conditional response means differ from alpha + beta*x.
const population = [-1, 1].map(x => ({x, error: x, y: 10 + 2*x + x}));
eq(population.reduce((sum, row) => sum + row.error, 0) / 2, 0);
for (const row of population) ok(row.y !== 10 + 2*row.x, 'Unconditional zero mean does not identify the conditional response line');
// With symmetric errors at EACH x, the claimed conditional mean does hold.
for (const x of [-1, 1]) eq(((10 + 2*x - 1) + (10 + 2*x + 1))/2, 10 + 2*x);

const views = require('./src/class-eight-visuals.js');
ok(views.specs.fit[6].includes('sum of their squares'), 'The pause answer names the OLS objective without reversing operations');
ok(!views.specs.fit[6].includes('squared sum'));
const residuals = [-1, 1];
eq(residuals.reduce((sum, residual) => sum + residual, 0)**2, 0);
eq(residuals.reduce((sum, residual) => sum + residual**2, 0), 2);
ok(views.render('fit').includes('sum of their squares'), 'Correct objective appears in static, no-JavaScript feedback');
ok(fs.readFileSync('dist/regression.html', 'utf8').includes('sum of their squares'), 'Correct objective reaches the built lesson');

const probability = questions('probability')[7];
eq(probability.a[probability.correct], 'Undefined.');
ok(probability.why.includes('elementary ratio is undefined'));
ok(probability.why.includes('Probability zero does not always mean impossible'));
ok(probability.why.includes('continuous density model'));
// Uniform[0,1]: a single interior point has zero area, despite being a
// value in the support. Shrinking intervals around it have positive area.
const uniformCDF = x => Math.max(0, Math.min(1, x));
eq(uniformCDF(.5) - uniformCDF(.5), 0);
for (const radius of [.1, .01, .001]) ok(uniformCDF(.5 + radius) - uniformCDF(.5 - radius) > 0);

const activity = require('./scripts/activities-foundations.cjs').find(item => item.id === 'c2-language-events');
ok(activity.prompt.includes('only delivered orders'));
ok(activity.prompt.includes('each classified as on time or late against a defined deadline'));
eq(activity.pairs.map(pair => pair.answer), [2, 0, 1, 3], 'Event-matching key remains unchanged');
// The explicit binary outcome universe makes on-time exactly the complement
// of late, for both shipping modes. A pending record must not enter it.
const delivered = [false, true].flatMap(express => [false, true].map(late => ({express, late, onTime: !late})));
for (const order of delivered) eq(order.onTime, !order.late);
const pending = {late: false, onTime: false};
ok(pending.onTime !== !pending.late, 'Without a defined universe, not late need not mean on time');
ok(fs.readFileSync('dist/probability.html', 'utf8').includes(activity.prompt), 'The defined event universe reaches the built activity');
console.log(`Passed ${checks} assessment assumptions, feedback, independent counterexample, and built-content assertions.`);

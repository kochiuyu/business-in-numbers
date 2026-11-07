'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const near = (actual, expected) => ok(Math.abs(actual - expected) < 1e-12, `${actual} = ${expected}`);
function lessons(source) {
  const out = []; let depth = 0, start = -1;
  for (const m of source.matchAll(/<\/?details\b[^>]*>/g)) {
    if (m[0].startsWith('</')) {
      depth--;
      if (start >= 0 && depth === 0) { out.push(source.slice(start, m.index + m[0].length)); start = -1; }
    } else {
      if (depth === 0 && m[0].includes('class="lesson"')) start = m.index;
      depth++;
    }
  }
  return out;
}
// Reviewed snapshots: Class 1 shape/rate explanations are intentionally deepened.
// test-bridges-shape.cjs reconstructs the full prior page; test-depth-shape.cjs
// also reconstructs the earlier shape lesson. Class 3 fixes only the phrase
// "raw fourth central moment"; test-bridges-random.cjs proves other text retained.
const baseline = {
  "index.html": [
    "b5f8d3050d25e4cce8119bf2732c5fbf721530ae54b2c9fc98a5906ba89f40c9",
    "51588b597e73dcb3deb503517b1e49d7723e9e522211ab54710c921c92818127",
    "a1241ebb4c7ba8329e7053448f6d7b0fa4662a5276efc154ee6b885f1e735b9d",
    "8abf65b2ce59470220eba61ae975fcf78da6e4ace8e37b998c8599decac17dbe",
    "0a76071b55d59121606cffaac59d88da81a0272fe475782cd878ab25c7b9d4ac",
    "6e8f7599e9d9a173f5631697cf8fc3904b6ab2a8d25b85e2c8e82b0bd1884920"
  ],
  "probability.html": [
    "c89b84b56fe36ebf6bcbc8b7111b5c9b1b3ccd8f7e55414bf190d4944750568e",
    "03cbf7fcbff551fa5b6a9d1a5c3603d1e7a71cf1db4f1a0c11b94ca2db99c3a6",
    "191003e0989185863b2bc00f013b9cff5724d4ee3b68f926740f928c7d28f64a",
    "9f202a47bedaf5b770cb9391c4437c4afa6b27a2038c042180ac1ca88e481a70",
    "f71f4bade4a968d26f9af8cb1ff621a9c42d514ef046938c0379906a5d237ee8",
    "87314217636c1b5da8da6368c0485a98233ebf08f7cb77f7f46d62d1448cebf9",
    "257524515bd51a6b1d4a19030fbcbae1eca27aebc28dc8c28548e6933f7e6626",
    "0fda037654da3fbe7805518e4691991b253cb09c18a9a10d7a2395b785fbb470",
    "ba99d286ca1eb26f73012404797a8d29ca41fb7211ea121640e000f2b63ec0b0",
    "0d2577ac4c141f891f0198efc5b6bc0273a46b25dc19787d494ec552886a00a8"
  ],
  "random-variables.html": [
    "dff43bd3ce6e2c55069f7fab203bdfd03594e40dfa1d1f98b8021169dae7397d",
    "53d84a624babb518aca54ed8afd5b8422139c488156d0516c8943f5d3fe2212f",
    "bfc0871790f606b283a7c891f3c46c34ffd6e6b64dee93d63aae8b2c37216dee",
    "ace3893d3c0fbd3d194eb0f098152daa6e5d72b0ff23bb6094adc7b2114bb028",
    "c1a1f984db636689ce0d605944766378a9a210e417fb35c1bf33ac177d2acbda",
    "cea4c142a48ea399096dd94b056ee678bfda9e0d2ac9b4bb388702ca5ab3a60e",
    "4b2e63c4a0ebf56169785cfca6fc401fd81727656ed291db6377d98989772734",
    "61c07529f66501c3234fe77906b9e2fad8178c6148d2ca4ab1aa2de0d5df9625",
    "e7321a96230cefffac822feea0ff155ad21d4fd65fc8204cd8ad02ec1c164053",
    "5c6f50e40cc85f128c9f06a0552d659c5a930ed7a0bec28a033fbe2a6283d5f1",
    "f3cd4e20903795291a76bd6debe8fdc1fab6c10b461290cd0983dbd72c6a7844",
    "7cf36d1afae4520c4b751514d099ee293a48e6b8a2eb1a321d8a66b733bce167"
  ]
};
for (const [i, file] of ['index.html', 'probability.html', 'random-variables.html'].entries()) {
  const source = fs.readFileSync('src/' + file, 'utf8').replace(/<!-- shape-contribution-visual:start -->[\s\S]*?<!-- shape-contribution-visual:end -->/g,'').replace(/<section class="shape-log-worked" id="shape-log-worked"[\s\S]*?<\/section>\n/,'');
  const snapshotSource = file === 'index.html' ? require('./scripts/class-one-preservation.cjs').restore(fs.readFileSync('src/' + file, 'utf8')).replace(/<!-- shape-contribution-visual:start -->[\s\S]*?<!-- shape-contribution-visual:end -->/g,'').replace(/<section class="shape-log-worked" id="shape-log-worked"[\s\S]*?<\/section>\n/,'') : source;
  assert.deepEqual(lessons(snapshotSource).map(s => crypto.createHash('sha256').update(s).digest('hex')), baseline[file], 'Reviewed lesson disclosures match the protected baseline: ' + file); checks++;
  const blocks = source.match(/<section class="second-foundation"[\s\S]*?<\/section>/g) || [];
  ok(blocks.length === 1, 'One purposeful bridge per class');
  const block = blocks[0];
  ok(!/<[^>]+\shidden(?:\s|=|>)|<script|<button/.test(block), 'All worked interpretation visible without JS; native disclosure only');
  ok(block.includes('<figure>') && block.includes('<figcaption>'), 'Visible caption');
  ok(block.includes('tabindex="0" role="region"') && block.includes('Scroll horizontally'), 'Keyboard scroll region');
  ok(block.includes('<title') && block.includes('<desc') && block.includes('role="img"'), 'SVG accessible name and full text description');
  ok(block.includes('<details><summary>Check:'), 'Native keyboard-accessible retrieval question');
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  ok(ids.length === new Set(ids).size, 'Unique anchors: ' + file);
  const css = fs.readFileSync('src/' + ['class-one', 'class-two', 'class-three'][i] + '.css', 'utf8').split('/* Second review:')[1];
  ok(css.includes('min-width:580px') && css.includes('overflow-x:auto'), 'Legible narrow-screen horizontal chart');
  ok(css.includes(':focus-visible'), 'Visible keyboard focus');
  ok(!/animation|transition|@keyframes/.test(css), 'No motion; respects reduced-motion without special toggle');
}
// Independent arithmetic, not calls to presentation functions.
const days = [4, 5, 5, 5, 6], mean = days.reduce((a, b) => a + b, 0) / days.length;
const d = days.map(x => x - mean), ss = d.reduce((a, b) => a + b * b, 0);
near(d.reduce((a, b) => a + b, 0), 0); near(d[4], -d.slice(0,4).reduce((a,b)=>a+b,0)); near(ss, 2);
near(ss/5, .4); near(ss/4, .5);
ok(Math.sqrt(ss/5).toFixed(2) === '0.63' && Math.sqrt(ss/4).toFixed(2) === '0.71', 'Displayed SD rounding');
const firstPositive = .4 * .8 + .6 * .4, bothPositive = .4 * .8 ** 2 + .6 * .4 ** 2;
near(firstPositive, .56); near(bothPositive, .352); near(firstPositive ** 2, .3136);
near(bothPositive/firstPositive, 22/35); near(.4*.8**2/bothPositive, 8/11);
ok((bothPositive/firstPositive).toFixed(3) === '0.629', 'Displayed conditional probability');
const mass = [.1,.3,.4,.2];
function quantile(target) { let sum=0; return mass.findIndex(p => (sum+=p) + 1e-12 >= target); }
near(quantile(.75), 2); near(quantile(.8), 2); near(quantile(.81), 3); near(mass.slice(0,3).reduce((a,b)=>a+b,0), .8);
const graph = fs.readFileSync('src/random-variables.html','utf8').match(/<section class="second-foundation"[\s\S]*?<\/section>/)[0];
for(const [x, p] of [[100,.1],[230,.4],[360,.8],[490,1]]) ok(graph.includes(`class="second-filled" cx="${x}" cy="${210-180*p}"`), 'CDF dot matches cumulative mass');
console.log(`Second foundations review: ${checks} checks passed.`);

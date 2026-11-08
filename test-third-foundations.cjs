'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
let checks = 0;
const ok = (condition, message) => { checks++; assert.ok(condition, message); };
const near = (a, b) => ok(Math.abs(a-b)<1e-12, `${a} matches ${b}`);
const cases = [
  ['descriptive-statistics.html','third-supplier-mix',['4.4 days','6.6 days','4.8 days','3.8 days','standardized comparisons','six-day target']],
  ['probability.html','third-alert-decision',['15.38%','$7.69','$15.69','16%','p &gt; 8%','Class 3']],
  ['random-variables.html','third-overload-cost',['0.20 orders per slot','$6 per slot','$10 per slot','$40 per excess order','nonlinear','queueing model']]
];
for(const [file,id,expected] of cases){
  const html=fs.readFileSync('src/'+file,'utf8');
  const blocks=html.match(/<section class="lesson-bridge third-foundation"[\s\S]*?<\/section>/g)||[];
  ok(blocks.length===1,'Exactly one bounded new bridge: '+file);
  const block=blocks[0];
  ok(block.includes(`id="${id}"`) && block.includes(`aria-labelledby="${id}-title"`) && block.includes(`id="${id}-title"`),'Named section');
  ok(block.includes('<ol>') && (block.match(/<li>/g)||[]).length===3,'Three-step worked reasoning');
  ok(block.includes('Predict first:') && /<details><summary>Check[\s\S]*?<\/summary><p>/.test(block),'Prediction and native feedback');
  ok(!/<script|<button|\bhidden\b/.test(block),'Available without JavaScript');
  for(const content of expected) ok(block.includes(content),'Verified interpretation: '+content);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  ok(ids.length===new Set(ids).size,'Unique IDs');
}
// Independent arithmetic oracles for all new decision examples.
near((90*4+10*8)/100,4.4); near((10*3+90*7)/100,6.6);
near(.5*4+.5*8,6); near(.5*3+.5*7,5);
near(.8*4+.2*8,4.8); near(.8*3+.2*7,3.8);
const posterior=90/585;
ok((posterior*100).toFixed(2)==='15.38','Posterior percent and full-loss dollars');
near(8/100,.08);near(8/50,.16);
ok(posterior*100>8 && posterior*50<8,'Effectiveness changes preferred action');
ok((posterior*50).toFixed(2)==='7.69','Expected partial saving');
ok((8+posterior*50).toFixed(2)==='15.69','Residual plus review cost');
const mass=[.1,.3,.4,.2];
near(mass.reduce((s,p)=>s+p,0),1);
const mean=mass.reduce((s,p,x)=>s+p*x,0);
const excess=mass.reduce((s,p,x)=>s+p*Math.max(x-2,0),0);
near(mean,1.7);near(excess,.2);near(Math.max(mean-2,0),0);
near(excess*30,6);near(excess*50,10);near(8/excess,40);
near(mass.reduce((s,p,x)=>s+p*Math.max(x-3,0),0),0);
console.log(`Third foundations review: ${checks} checks passed.`);

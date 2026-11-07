'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
let checks = 0;
const ok = (v, m) => { checks++; assert.ok(v, m); };
const near = (a,b) => ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);
const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
for (const [page, id, step] of [['anova','f',4],['regression','se',8]]) {
 const html = fs.readFileSync(`src/${page}.html`,'utf8');
 const start = html.indexOf(`<aside class="em-activity em-worked" id="em-${id}-bridge"`);
 const end = html.indexOf('</aside>',start);
 const block = html.slice(start,end);
 ok(start>html.indexOf(page==='anova'?'id="anova-mean-squares"':`id="${page}-step-${step}"`), 'Bridge follows intended step start');
 ok(end<html.indexOf(page==='anova'?'id="anova-step-4"':`id="${page}-step-${step+1}"`), 'Bridge stays in intended step');
 ok(block.includes(`aria-labelledby="em-${id}-heading"`) && block.includes(`id="em-${id}-heading"`),'Named explanation');
 ok(block.includes('<details><summary>') && block.includes('</summary><p>'),'Native learner feedback');
 ok(!/<details[^>]*\bopen\b|\bhidden\b|<script|<button/.test(block),'Feedback closed and content independent of JS');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 ok(ids.length===new Set(ids).size,'Unique IDs');
 if(page==='anova') {
  for(const text of ['12 − 3','3 − 1','24/9','98⅔','49⅓','2⅔','18.5','not the average processing time','not “18.5 times faster.”']) ok(block.includes(text), `ANOVA explanation retains ${text}`);
 } else {
  for(const text of ['8 − 2 = 6','2 × (3.5² + 2.5² + 1.5² + 0.5²) = 42','squared $100 units','even though their spends differ','away from that center','1.52 orders per $100','3.47 orders']) ok(block.includes(text),`SE explanation retains ${text}`);
 }
}
// Independently derive every denominator and displayed result from raw observations.
const groups=[[18,20,22,20],[22,24,26,24],[25,27,29,27]], all=groups.flat(), grand=mean(all);
const dfWithin=groups.reduce((s,g)=>s+g.length-1,0),dfBetween=groups.length-1;
const within=groups.reduce((s,g)=>s+g.reduce((t,y)=>t+(y-mean(g))**2,0),0);
const between=groups.reduce((s,g)=>s+g.length*(mean(g)-grand)**2,0);
near(dfWithin,9);near(dfBetween,2);near(within,24);near(between,296/3);
near(within/dfWithin,8/3);near(between/dfBetween,148/3);near((between/dfBetween)/(within/dfWithin),18.5);near(within/all.length,2);
for(const g of groups){const d=g.map(y=>y-mean(g));near(d[3],-d.slice(0,3).reduce((s,v)=>s+v,0));}
const pairs=[[1,11],[2,12],[3,16],[4,15],[5,19],[6,20],[7,23],[8,24]];
const mx=mean(pairs.map(p=>p[0])),my=mean(pairs.map(p=>p[1]));
const sxx=pairs.reduce((s,[x])=>s+(x-mx)**2,0),sxy=pairs.reduce((s,[x,y])=>s+(x-mx)*(y-my),0);
const slope=sxy/sxx,intercept=my-slope*mx;
const sse=pairs.reduce((s,[x,y])=>s+(y-intercept-slope*x)**2,0), df=pairs.length-2,sd=Math.sqrt(sse/df);
near(mx,4.5);near(sxx,42);near(2*(3.5**2+2.5**2+1.5**2+.5**2),sxx);near(df,6);near(sse,81/14);near(intercept+slope*mx,my);
ok((sd*10).toFixed(2)==='9.82');ok((sd/Math.sqrt(sxx)*10).toFixed(2)==='1.52');ok((sd/Math.sqrt(pairs.length)*10).toFixed(2)==='3.47');
// The central-mean shortcut must not be silently extended to another x.
const meanSE=x=>sd*Math.sqrt(1/pairs.length+(x-mx)**2/sxx);
near(meanSE(mx),sd/Math.sqrt(pairs.length));ok(meanSE(8)>meanSE(mx));
console.log(`Passed ${checks} fourth-round modeling checks: denominators, units, arithmetic and native feedback.`);

'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},near=(a,b)=>ok(Math.abs(a-b)<1e-12,`${a} = ${b}`);
const src=fs.readFileSync('src/probability.html','utf8'),built=fs.readFileSync('dist/probability.html','utf8');
for(const [id,step,phrases] of [
 ['c2-bag-weights',5,['50/80','5/11','1/24','selection process','branch uniformly']],
 ['c2-odds-parts',6,['32/56','4/(4 + 3)','57.14%','8/11','relative weights']],
 ['c2-count-allowed',7,['16 allowed meals','18 − 2 = 16','4/16 = 25%','6/16 = 37.5%','equally likely']]
]){
 const pattern=new RegExp('<section class="c2-depth-worked" id="'+id+'"[\\s\\S]*?</section>');
 for(const [name,html]of [['source',src],['built',built]]){
  const block=html.match(pattern)?.[0];ok(block,`${name} has ${id}`);
  ok(block.includes(`aria-labelledby="${id}-title"`)&&block.includes(`id="${id}-title"`),'section is named');
  ok(block.includes('<ol>')&&(block.match(/<li>/g)||[]).length>=3,'paced worked steps');
  ok(block.includes('<details class="c2-check"><summary>Check:'),'native disclosure for practice');
  ok(!/\bhidden\b|<script|<input|<button/.test(block),'complete static explanation without scripts');
  for(const phrase of phrases)ok(block.includes(phrase),'retained numerical reasoning: '+phrase);
  const start=html.indexOf(`id="prob-step-${step}"`),end=html.indexOf(`id="prob-step-${step+1}"`);ok(html.indexOf(`id="${id}"`)>start&&html.indexOf(`id="${id}"`)<end,'correct lesson step');
 }
}
// Independent weighted enumeration over individual balls, not just the displayed formula.
function greenPosterior(pickA,a,b){let green=0,greenA=0;for(const [balls,weight,isA]of [[a,pickA,true],[b,1-pickA,false]])for(const color of balls){if(color==='G'){green+=weight/balls.length;if(isA)greenA+=weight/balls.length;}}return greenA/green;}
const a=['G','G','G','G','G','R'],b=['G','G','G','R','R','R'];
near(greenPosterior(.5,a,b),5/8);near(greenPosterior(.5,a,b.concat(b)),5/8);near(greenPosterior(1/3,a,b.concat(b)),5/11);
near(.5/a.length,1/12);near(.5/(b.length*2),1/24);
// Normalize the two groups after successive positive likelihood weights.
let groups=[40,60];const posteriors=[.4,4/7,8/11];
for(let n=0;n<3;n++){near(groups[0]/(groups[0]+groups[1]),posteriors[n]);near(groups[0]/groups[1],(2/3)*2**n);groups=groups.map((v,i)=>v*[.8,.4][i]);}
near((.2/.8*2)/(1+.2/.8*2),1/3);
// Enumerate complete meals, then compare uniform-meal and uniform-protein mechanisms.
const all=[],allowed=[];for(let base=0;base<2;base++)for(let protein=0;protein<3;protein++)for(let sauce=0;sauce<3;sauce++){const meal={base,protein,sauce};all.push(meal);if(!(protein===2&&sauce===2))allowed.push(meal);}
eq(all.length,18);eq(allowed.length,16);eq([0,1,2].map(p=>allowed.filter(m=>m.protein===p).length),[6,6,4]);near(allowed.filter(m=>m.protein===2).length/allowed.length,.25);
const staged=allowed.map(m=>({protein:m.protein,p:.5*(1/3)*(1/(m.protein===2?2:3))}));near(staged.reduce((s,m)=>s+m.p,0),1);for(let p=0;p<3;p++)near(staged.filter(m=>m.protein===p).reduce((s,m)=>s+m.p,0),1/3);
console.log(`Probability deepening: ${checks} static, accessibility and independent enumeration checks passed.`);

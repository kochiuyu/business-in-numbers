'use strict';
// Independently calculate each group's contribution; then verify the actual marks.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const Stats=require('./src/stats.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-10,m||`${a} ≈ ${b}`);
const source=fs.readFileSync('src/index.html','utf8'),built=fs.readFileSync('dist/index.html','utf8');
function groups(reflected){const data=reflected?[30,30,30,30,10]:[10,10,10,10,30];const mean=data.reduce((a,b)=>a+b,0)/5,sd=Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/5);return {data,z:data.map(v=>(v-mean)/sd)};}
function figures(html){return [...html.matchAll(/<!-- shape-contribution-visual:start -->([\s\S]*?)<!-- shape-contribution-visual:end -->/g)].map(m=>m[1]);}
for(const html of [source,built]){
 const views=figures(html);ok(views.length===2,'two small figures, not another activity');
 views.forEach((fig,index)=>{
  const key=index?'reflected':'original',g=groups(index),stat=Stats.describe(g.data);
  ok(fig.includes(`id="shape-contributions-${key}" aria-labelledby="shape-contributions-${key}-caption"`),'figure has accessible caption');
  ok(fig.includes(`id="shape-contributions-${key}-caption"`),'caption target exists');
  ok(fig.includes('Bars show group totals, not dollar amounts or final shape statistics.'),'meaning of the bars explicit');
  ok(!/<button|<script|<details|\shidden(?:\s|=|>)/.test(fig),'static figure works with no scripting');
  const panels=[...fig.matchAll(/<div class="moment-contribution-panel" data-contribution-power="(\d)">([\s\S]*?)<p class="moment-axis-title">([\s\S]*?)<\/p><\/div>/g)];
  ok(panels.length===2,'both powers drawn');
  panels.forEach(([,pow,content,axis])=>{
   const power=Number(pow),values=[g.z.slice(0,4).reduce((a,z)=>a+z**power,0),g.z[4]**power];
   const bars=[...content.matchAll(/<rect x="([\d.]+)" y="3" width="([\d.]+)" height="14"\/>/g)];
   ok(bars.length===2,'two frequency-weighted groups');
   const labels=[...content.matchAll(/<p><span>(.*?)<\/span><b>(.*?)<\/b><\/p>/g)];
   ok(labels.length===2,'each bar has readable HTML group and value');
   ok(labels[0][1]===`Four $${index?30:10} orders combined`,'four orders correctly grouped');
   ok(labels[1][1]===`One $${index?10:30} order`,'one order correctly identified');
   values.forEach((value,i)=>{
    const zero=power===3?160:0,expectedX=zero+Math.min(0,value)*20;
    near(Number(bars[i][1]),expectedX,'bar starts at zero or negative endpoint');
    near(Number(bars[i][2]),Math.abs(value)*20,'true 20-pixel-per-unit bar length');
    near(Number(labels[i][2].replace('−','-')),value,'label equals independently computed group contribution');
   });
   const ticks=[...content.matchAll(/<span style="left:([\d]+)%">([^<]*)<\/span>/g)].map(m=>[Number(m[1]),m[2]]);
   assert.deepEqual(ticks,power===3?[[0,'−8'],[25,'−4'],[50,'0'],[75,'4'],[100,'8']]:[[0,'0'],[25,'4'],[50,'8'],[75,'12'],[100,'16']]);checks++;
   ok(axis.includes(`Count × z${power===3?'³':'⁴'}`),'axis describes transformed total');
   near(values.reduce((a,b)=>a+b,0)/5,power===3?stat.skew:stat.excess+3,'group totals divide by all five, not two rows');
   ok((content.match(/aria-hidden="true" focusable="false"/g)||[]).length===2,'decorative marks do not duplicate readable labels');
  });
 });
}
const restored=source.replace(/<!-- shape-contribution-visual:start -->[\s\S]*?<!-- shape-contribution-visual:end -->/g,'');
ok(crypto.createHash('sha256').update(restored).digest('hex')==='792640739bb9abd552ba36d02dc8ea78f45810a2cc061445ad4f3dd95fe89181','all pre-revision Class 1 source retained exactly');
const css=fs.readFileSync('src/class-one.css','utf8');
for(const phrase of ['.moment-contribution-grid{display:grid','@media(max-width:800px)','grid-template-columns:1fr','width:100%;height:22px','flex-wrap:wrap','stroke:none','print-color-adjust:exact'])ok(css.includes(phrase),'responsive/static style '+phrase);
console.log(`Passed ${checks} shape contribution assertions: exact group arithmetic, proportional signed geometry, labels, fixed axes, reflection, static access and source preservation.`);

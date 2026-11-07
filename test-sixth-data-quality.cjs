'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);};
const blocks=[
 ['index','records-missing-check','case-part-1',['0</td>','Blank','10/3 ≈ 3.33','2.50','18/4 = 4.50','3 of 4 pickups measured','does not establish','sampling-distributions.html#sampling-nonresponse-check']],
 ['sampling-distributions','sampling-nonresponse-check','sampling-step-1',['60/100 = 60%','48/60 = 80%','48/100 = 48%','88/100 = 88%','one-percentage-point steps','not a 95% confidence interval','68%','All 100 target customers were invited','index.html#records-missing-check']],
 ['hypothesis-testing','testing-quantile-bridge','hypothesis-statistic',['upper-tail area','lower-tail probability','≈ +1.96','≈ −1.96','t<sub>ν,.025</sub>','t<sub>ν,.975</sub>','estimation.html#known-variance']],
 ['hypothesis-testing','paired-calculation-check','hypothesis-step-9',['3, 4, 0, 5, 4, 1, 3, 4','20/7','1.6903','0.5976','5.020','7 degrees of freedom','unrounded values','n = 16','independent differences from the same normal distribution','Match by ID','n counts those complete pairs']]
];
for(const dir of ['src','dist'])for(const[file,id,step,terms]of blocks){
 const html=fs.readFileSync(`${dir}/${file}.html`,'utf8');const start=html.indexOf(`id="${id}"`),end=html.indexOf('</aside>',start),block=html.slice(start,end);
 ok(start>html.indexOf(`id="${step}"`),'Block belongs in its learning step');
 ok(end>start,'Complete aside');
 for(const term of terms)ok(block.includes(term),`${id}: ${term}`);
 ok(!/<script|<button|\bhidden\b|\bopen[=>\s]/.test(block),'Static explanations and closed native feedback');
 if(id!=='testing-quantile-bridge')ok(block.includes('<details><summary>'),'Native feedback');
 const label=block.match(/aria-labelledby="([^"]+)"/)[1];ok(html.includes(`id="${label}"`),'Accessible label resolves');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);ok(ids.length===new Set(ids).size,'Unique IDs');
 for(const m of block.matchAll(/href="([^"]+)"/g)){const[f,anchor]=m[1].split('#');ok(fs.readFileSync(`${dir}/${f}`,'utf8').includes(`id="${anchor}"`),'Cross-lesson link resolves');}
}
const data=[3,4,0,5,4,1,3,4],mean=data.reduce((a,b)=>a+b)/data.length;
const ss=data.reduce((s,d)=>s+(d-mean)**2,0),sd=Math.sqrt(ss/7),se=sd/Math.sqrt(8);
for(const[a,b]of [[mean,3],[ss,20],[sd.toFixed(4),'1.6903'],[se.toFixed(4),'0.5976'],[(mean/se).toFixed(3),'5.020']])ok(a===b,'Paired arithmetic independently reduced');
ok((10/3).toFixed(2)==='3.33'&&10/4===2.5&&18/4===4.5,'Missing is not zero');
for(let missingYes=0;missingYes<=40;missingYes++)ok((48+missingYes)/100>=.48&&(48+missingYes)/100<=.88,'Every compatible integer outcome lies inside the stated bounds');
ok((48+20)/100===.68&&(48+32)/100===.80,'Nonresponse sensitivity assumptions');
console.log(`Sixth data-quality bridges: ${checks} checks passed.`);

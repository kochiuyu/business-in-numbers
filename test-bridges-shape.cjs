'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const Stats=require('./src/stats.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-10,m||`${a} ≈ ${b}`);
function independent(x){const mean=x.reduce((a,b)=>a+b,0)/x.length;const d=x.map(v=>v-mean);const variance=d.reduce((a,b)=>a+b*b,0)/x.length;const sd=Math.sqrt(variance),z=d.map(v=>v/sd);return {mean,variance,sd,z,skew:z.reduce((a,b)=>a+b**3,0)/x.length,pearson:z.reduce((a,b)=>a+b**4,0)/x.length};}
const old=[10,10,10,10,30],changed=[10,10,10,10,50],a=independent(old),b=independent(changed);
near(a.mean,14);near(a.sd,8);near(b.mean,18);near(b.variance,256);near(b.sd,16);
for(let i=0;i<old.length;i++){near(changed[i],2*old[i]-10);near(a.z[i],b.z[i]);}
near(b.skew,1.5);near(b.pearson,3.25);near(b.pearson-3,.25);
near(Stats.describe(changed).skew,b.skew);near(Stats.describe(changed).excess,.25);
near(Math.max(...old)-a.mean,16);near(Math.max(...changed)-b.mean,32);
const distances=[60,60],speeds=[30,60],times=distances.map((d,i)=>d/speeds[i]);
near(times[0],2);near(times[1],1);near(distances.reduce((x,y)=>x+y)/times.reduce((x,y)=>x+y),40);near(2/speeds.reduce((sum,v)=>sum+1/v,0),40);
near((30*1+60*1)/(1+1),45);
const source=fs.readFileSync('src/descriptive-statistics.html','utf8');
const documents=[source];if(process.argv.includes('--built'))documents.push(fs.readFileSync('dist/descriptive-statistics.html','utf8'));
for(const html of documents){
 for(const id of ['harmonic-rate-bridge','harmonic-rate-heading','shape-scale-bridge'])ok(html.includes(`id="${id}"`),id+' exists');
 for(const phrase of ['256 dollars²','2X − 10','Absolute spread has increased','not a currency conversion','Equal times justify the arithmetic mean here','equal distances justify the harmonic mean','2 ÷ (1/30 + 1/60)'])ok(html.includes(phrase),phrase+' preserved');
 ok(html.includes('id="harmonic-rate-bridge" aria-labelledby="harmonic-rate-heading"'),'named teaching section');
 ok(html.includes('<details class="visual-check" id="shape-scale-bridge"><summary>'),'native disclosure works without JavaScript');
}
const restored=require('./scripts/readability-preservation.cjs').restore(source,'index').replace(/<!-- shape-contribution-visual:start -->[\s\S]*?<!-- shape-contribution-visual:end -->/g,'').replace(/<section class="shape-log-worked" id="shape-log-worked"[\s\S]*?<\/section>\n/,'').replace(/<section class="case-worked" id="harmonic-rate-bridge"[\s\S]*?<\/section>/,'').replace(/<details class="visual-check" id="shape-scale-bridge">[\s\S]*?<\/details>\n/,'');
ok(crypto.createHash('sha256').update(restored).digest('hex')==='689c8e0653e6380210b4cdd555d45d992bc5986fff149858b69884444c831a34','all prior Class 1 content preserved byte for byte');
console.log(`Passed ${checks} Class 1 bridges assertions (independent moments, rates, production parity, readable content, complete source preservation${process.argv.includes('--built')?', built HTML':''}).`);

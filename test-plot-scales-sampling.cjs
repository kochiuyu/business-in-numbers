'use strict';
const assert=require('node:assert/strict');
const S=require('./src/sampling-core.js'),E=require('./src/estimation-core.js');
let checks=0;
function ok(value,message){checks++;assert.ok(value,message);}
function texts(svg,y){return [...svg.matchAll(/<text\b([^>]*)>(.*?)<\/text>/g)].filter(m=>new RegExp(`\\by="${y}"`).test(m[1])).map(m=>m[2]);}
function valid(svg){
 ok(!/NaN|Infinity|undefined/.test(svg),'All SVG values finite');
 ok(/role="img" aria-labelledby="[^" ]+-title [^" ]+-desc"/.test(svg),'Accessible name and description');
 for(const m of svg.matchAll(/\b(?:x|x1|x2|cx)="([^"]+)"/g))ok(Number(m[1])>=0&&Number(m[1])<=620,'Horizontal coordinate within viewport');
}
for(const mean of [-1e6,-.000001,0,40,1e6])for(const sd of [1e-6,.1,12,1e6])for(const n of [1,36,10000]){
 const d=S.known(mean,sd,n,mean),before=JSON.stringify(d),svg=S.normalSvg(d);
 valid(svg);ok(JSON.stringify(d)===before,'Rendering does not change statistical result');
 const ticks=texts(svg,264);
 ok(ticks.length===5&&new Set(ticks).size===5,'Normal x ticks distinguish nearby values');
 ok(ticks.every(t=>t.length<=10),'Normal tick labels fit spaced axis');
 ok(svg.includes(`standard error ${d.se}`),'Description retains nonzero standard error');
 const density=[...svg.matchAll(/<text x="68"[^>]*>(.*?)<\/text>/g)].map(m=>m[1]);
 ok(density.length===5&&new Set(density).size===5,'Density ticks remain distinct');
 ok(density.every(t=>t.length<=8),'Density labels fit reserved left margin');
 for(const method of ['z','t'])for(const confidence of [.9,.95,.99]){
  if(method==='t'&&n===1)continue;
  const ci=E.meanCI(method,mean,sd,n,confidence),snapshot=JSON.stringify(ci),interval=E.meanSvg(ci);
  valid(interval);ok(JSON.stringify(ci)===snapshot,'CI rendering does not alter arithmetic');
  const ends=interval.match(/<line x1="([^"]+)" x2="([^"]+)" y1="110"/);
  ok(Number(ends[2])-Number(ends[1])>300,'CI remains visible at every supported scale');
  const labels=texts(interval,230),endLabels=texts(interval,150);
  ok(labels.length===5&&new Set(labels).size===5,'CI ticks distinguish nearby values');
  ok(labels.every(t=>t.length<=10),'CI ticks fit narrow layouts');
  ok(endLabels.length===2&&endLabels[0]!==endLabels[1],'CI endpoints distinguishable');
 }
}
const extreme=S.normalSvg(S.known(1e6,1e-6,10000,1e6));
ok(extreme.includes('Sample mean − 1000000 (× 1e-8)'),'Explicit centered-axis scale');
ok(extreme.includes('Density ticks must be multiplied by 10000000'),'Density scaling explained');
ok(texts(extreme,264).join(',')==='-4,-2,0,2,4','Symmetric exact offset ticks');
const tiny=E.meanSvg(E.meanCI('z',1e6,1e-6,10000,.95));
ok(tiny.includes('Offset from estimate (× 1e-8)'),'CI offset units explicit');
ok(tiny.includes('offsets from the estimate 1000000'),'CI description explains reconstruction');
ok(!S.normalSvg(S.known()).includes('offsets from'),'Normal default retains raw scale');
ok(!E.meanSvg(E.meanCI()).includes('Offset from estimate'),'CI default retains raw scale');
// Cutoffs outside and inside the plotted window retain the full probability,
// and shading never introduces path points outside the horizontal viewport.
for(const cut of [-1e6,39,40,41,1e6]){
 const svg=S.normalSvg(S.known(40,12,36,cut));valid(svg);
 for(const path of svg.matchAll(/d="([ML][^"]+)"/g))for(const point of path[1].matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)){
  ok(+point[1]>=76&&+point[1]<=552,'Tail path stays in viewport');
  ok(+point[2]>=32&&+point[2]<=244,'Tail height stays in viewport');
 }
}
// Formatting boundaries at powers of ten can collapse five-significant-digit
// absolute labels even when the offset threshold ratio has not been exceeded.
for(const [mean,me] of [[10001,1.0001],[100000,10],[-10001,1.0001],[-100000,10]]){
 const ci=E.meanCI('z',mean,me/E.zcrit(.95),1,.95),svg=E.meanSvg(ci);
 ok(new Set(texts(svg,230)).size===5,'Boundary CI ticks are distinct');
 ok(svg.includes('Offset from estimate'),'Duplicate-label fallback uses explained offsets');
}
for(const sign of [-1,1])for(const power of [0,1,2,3,4,5])for(const shift of [-.0001,0,.0001,.001])for(const ratio of [999,1000,9999,10000,10001]){
 const mean=sign*10**power*(1+shift),scale=Math.abs(mean)/ratio;
 const normal=S.normalSvg(S.known(mean,scale,1,mean));
 ok(new Set(texts(normal,264)).size===5,'Normal threshold ticks remain distinct');
 const ci=E.meanSvg(E.meanCI('z',mean,scale/E.zcrit(.95),1,.95));
 ok(new Set(texts(ci,230)).size===5,'CI threshold ticks remain distinct');
}
// Execute the known-model UI renderer with lightweight DOM hooks: positive
// SD and SE values must not become zero in the accompanying metric cards.
const fs=require('node:fs'),vm=require('node:vm');
const knownRenderer=fs.readFileSync('src/sampling.js','utf8').split('\n').find(line=>line.startsWith('function known()'));
for(const sd of [1e-6,.00009999,.0001,12])for(const n of [1,36,10000]){
 const nodes={},values={'known-mu':1e6,'known-sd':sd,'known-n':n,'known-cut':1e6};
 vm.runInNewContext(knownRenderer+';known();',{S,$:id=>nodes[id]??={},num:id=>values[id],action:(_,render)=>render()});
 const metrics=nodes['known-metrics'].innerHTML;
 for(const name of ['Standard error','Individual population SD']){
  const value=metrics.match(new RegExp(`<span>${name}</span><strong>([^<]+)</strong>`))[1];
  ok(Number(value.replaceAll(',',''))>0,`${name} remains visibly nonzero`);
 }
}
console.log(`Passed ${checks} sampling and confidence-interval scale assertions.`);

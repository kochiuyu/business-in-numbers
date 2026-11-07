'use strict';
const assert=require('node:assert/strict');
const H=require('./src/hypothesis-core.js');
let checks=0;
function check(args){
 const d=H.power(args),before=JSON.stringify(d),s=H.powerSvg(d);
 assert.equal(JSON.stringify(d),before,'Rendering must not change statistical results');
 assert(!/NaN|Infinity/.test(s),'All output coordinates must remain finite');
 assert(s.includes('aria-labelledby="power-plot-title power-plot-desc"'));
 assert(s.includes('All tails included in probabilities'));
 const split=Math.abs(d.shift)>8;
 assert.equal(s.includes('Separate centered panels'),split);
 const curves=[...s.matchAll(/<path data-power-curve="(null|chosen)" d="([^"]+)"/g)];
 assert.equal(curves.length,2);
 for(const [,kind,path]of curves){
  const pairs=[...path.matchAll(/[ML]([\d.e+-]+),([\d.e+-]+)/g)].map(m=>[+m[1],+m[2]]);
  const base=split&&kind==='chosen'?510:240;
  assert(Math.abs(Math.min(...pairs.map(p=>p[1]))-(base-140))<1e-9,'Every density must reach its peak, even for extreme SE');
  assert(pairs.every(([x,y])=>x>=60-1e-9&&x<=590+1e-9&&y>=base-140-1e-9&&y<=base));
 }
 const groups=[...s.matchAll(/<g data-power-panel="[^"]+">([\s\S]*?)<\/g>/g)].map(m=>m[1]);
 const chosen=groups.at(-1),base=split?510:240;
 const lo=split?-4:Math.min(0,d.shift)-4,hi=split?4:Math.max(0,d.shift)+4;
 const origin=split?d.mu1:d.mu0,cuts=[d.lower,d.upper].map(c=>c===null?null:(c-origin)/d.se);
 // Check shading polygons against the exact rejection rule and integrate their
 // area to independently compare with full-distribution probability (4-SE tails clipped).
 let area=0;
 for(const m of chosen.matchAll(/<path data-power-shade="true" d="M([^,]+),([^ ]+) L([^,]+),([^ ]+) L([^,]+),([^ ]+) L([^,]+),([^ ]+) Z"/g)){
  const x1=+m[3],y1=+m[4],x2=+m[5],y2=+m[6],mid=lo+((x1+x2)/2-60)/530*(hi-lo);
  assert((cuts[0]!==null&&mid<=cuts[0])||(cuts[1]!==null&&mid>=cuts[1]),'Shade must stay inside the rejection region');
  area+=(x2-x1)/530*(hi-lo)*((base-y1)+(base-y2))/280/Math.sqrt(2*Math.PI);
 }
 assert(Math.abs(area-d.power)<.00015,`Shaded area ${area} must match probability ${d.power}`);
 for(const c of cuts)if(c!==null){
  if(c>=lo&&c<=hi)assert(chosen.includes(`data-power-cutoff="${c}"`));
  else assert(chosen.includes(c<lo?'off left':'off right'));
 }
 checks++;
}
for(const tail of ['less','greater','two'])for(const alpha of [.001,.05,.2]){
 for(const mu1 of [48,50,52])check({mu1,tail,alpha});
 for(const mu1 of [-1e6,50,52,1e6])check({mu0:50,mu1,sd:1e-6,n:10000,tail,alpha});
 for(const mu0 of [-1e6,1e6])for(const offset of [0,1e-8,-1e-8]){
  if(Math.abs(mu0+offset)<=1e6)check({mu0,mu1:mu0+offset,sd:1e-6,n:10000,tail,alpha});
 }
 for(const mu1 of [-1e6,0,1e6])check({mu0:0,mu1,sd:1e6,n:2,tail,alpha});
 // Exercise both sides of the panel switch and near the rejection boundary.
 for(const shift of [-8.000001,-8,8,8.000001,H.zQuant(1-alpha)])check({mu0:0,mu1:shift,sd:8,n:64,tail,alpha});
}
console.log(`Passed ${checks} power-plot scale, peak, cutoff, shading, and accessibility cases.`);

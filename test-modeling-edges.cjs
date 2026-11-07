'use strict';
const assert=require('node:assert/strict'),A=require('./src/anova-core'),R=require('./src/regression-core');
const close=(a,b,t=1e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(Math.abs(a),Math.abs(b),Number.MIN_VALUE),`${a} != ${b}`);
// All translated observations here are exactly representable doubles. The
// intermediate means need not be: never subtract a rounded absolute mean.
const groups=[[0,1],[2,3],[4,5]].map(g=>g.map(v=>v*2**-13));
const plain=A.oneWay(groups),shift=A.oneWay(groups.map(g=>g.map(v=>999999999999+v)));
close(plain.F,16);close(shift.F,16);close(shift.p,plain.p);assert.equal(shift.reject,true);
for(const k of ['ss','ms']){close(shift.between[k],plain.between[k]);close(shift.within[k],plain.within[k]);close(shift.total[k],plain.total[k]);}
close(shift.eta2,plain.eta2);close(shift.omega2,plain.omega2);
const translated=A.PARALLEL.map(row=>row.map(g=>g.map(v=>1e12-100+v*.001)));
const centered=translated.map(row=>row.map(g=>g.map(v=>v-(1e12-100))));
const two=A.twoWay(translated),twoRef=A.twoWay(centered);
for(const k of ['A','B','AB'])for(const field of ['ss','F','p'])close(two[k][field],twoRef[k][field]);
close(two.A.ss+two.B.ss+two.AB.ss+two.error.ss,two.total.ss);
for(const scale of [1,1e-100,2**-23]){
 const pairs=R.DEFAULT_PAIRS.map(([x,y])=>[x*scale,y*scale]);
 const ref=R.fit(pairs,.05,4*scale);
 close(ref.b,27/14);close(ref.r2,27/28);close(ref.pB,R.fit().pB);
 if(scale===2**-23){
  for(const [ox,oy] of [[999999999,0],[0,999999999],[999999999,999999999]]){
   const d=R.fit(pairs.map(([x,y])=>[x+ox,y+oy]),.05,ox+4*scale);
   for(const k of ['b','Sxx','Sxy','SST','SSE','SSR','r2','pB','F','pF','meanSE','predSE'])close(d[k],ref[k]);
   assert.ok(Math.abs(d.residuals.reduce((a,b)=>a+b,0))<1e-20);
   for(const k of ['tA','tB','pA','pB','F','pF'])assert.ok(Number.isFinite(d[k]),k);
  }
 }
}
for(const scale of [1e-160,1e-170]){
 assert.throws(()=>A.oneWay(A.ONE_WAY.map(g=>g.map(v=>v*scale))),/Rescale/);
 assert.throws(()=>A.twoWay(A.TWO_WAY.map(row=>row.map(g=>g.map(v=>v*scale)))),/Rescale/);
 assert.throws(()=>R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x,y*scale])),/Rescale/);
 assert.throws(()=>R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x*scale,y]),.05,4*scale),/Rescale/);
}
assert.equal(A.oneWay([[2,2],[2,2]]).F,null);
assert.equal(A.oneWay([[2,2],[3,3]]).F,Infinity);
assert.equal(A.twoWay([[[2,2],[2,2]],[[2,2],[2,2]]]).AB.F,null);
assert.equal(R.fit([[1,1e-170],[2,1e-170],[3,1e-170]]).status,'constant-response');
assert.equal(R.fit([[1,2],[2,4],[3,6]]).status,'perfect-fit');
// At x0 equal to the right endpoint, the prediction marker must be on the
// plotted fitted line, including when the absolute sample mean rounds.
const V=require('./src/regression-view'),plotPairs=R.DEFAULT_PAIRS.map(([x,y])=>[999999999+x*2**-23,y*2**-23]);
const pd=R.fit(plotPairs,.05,plotPairs.at(-1)[0]),svg=V.plot(pd);
const line=svg.match(/<path d="M[^ ]+ [^L]+L[^ ]+ ([^"]+)" stroke="#173f36" stroke-width="3" fill="none"/);
const marker=svg.match(/<circle cx="[^"]+" cy="([^"]+)" r="5" fill="#bc4f24"/);
assert.ok(line&&marker);close(Number(line[1]),Number(marker[1]));assert.doesNotMatch(svg,/NaN|Infinity/);
const legacy={...R.fit()};for(const k of ['xAnchor','yAnchor','xOffset','yOffset'])delete legacy[k];
assert.doesNotMatch(V.plot(legacy),/NaN|Infinity/);
// Negligible individual contributions must not invalidate a well-resolved sum.
const mixedOne=A.oneWay([[0,1e-200,1],[2,3,4]]),mixedOneRef=A.oneWay([[0,0,1],[2,3,4]]);
close(mixedOne.F,mixedOneRef.F);close(mixedOne.p,mixedOneRef.p);
const mixedTwo=[[[0,1e-200,1],[2,3,4]],[[3,4,6],[4,6,8]]];
close(A.twoWay(mixedTwo).AB.F,A.twoWay([[[0,0,1],[2,3,4]],[[3,4,6],[4,6,8]]]).AB.F);
for(const pairs of [ [[-1,1],[1,1],[1e-200,-2]], [[1,-1],[1,1],[-2,1e-200]], [[-1,1],[0,1e-200],[1,1],[2,3]] ]){
 const d=R.fit(pairs),ref=R.fit(pairs.map(p=>p.map(v=>Math.abs(v)<1e-190?0:v)));
 close(d.SSE,ref.SSE);close(d.pB,ref.pB);assert.equal(d.status,'ok');
}
// A resolved predictor must never conceal an unresolved response variance.
assert.throws(()=>R.fit([[1,1e-200],[2,2e-200],[3,4e-200]]),/Rescale/);
// Nonzero within-cell noise cannot become a fictitious zero-error ANOVA.
assert.throws(()=>A.oneWay([[0,1e-200],[1,1]]),/Rescale/);
// Determine perfect-fit status before tiny residual squares can underflow.
const tinyNoise=[[1,1e-150],[2,2e-150+1e-162],[3,3e-150]];
assert.throws(()=>R.fit(tinyNoise,.05,2),/Rescale/);
assert.equal(R.fit(tinyNoise.map(([x,y])=>[x,y*1e150]),.05,2).status,'ok');
assert.equal(R.fit([[1,1e-150],[2,2e-150],[3,3e-150]],.05,2).status,'perfect-fit');
assert.equal(R.fit([[0,.1],[1,.3],[2,.5],[3,.7]]).status,'perfect-fit');
console.log('Modeling edge checks passed: exact translations, scaling, decomposition, underflow rejection, and degenerate semantics.');

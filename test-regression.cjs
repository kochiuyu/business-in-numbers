'use strict';
const assert=require('node:assert/strict');const R=require('./src/regression-core.js');
let checks=0;const close=(a,b,tol=1e-10)=>{checks++;assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);};
const d=R.fit();close(d.b,27/14);close(d.a,247/28);close(d.Sxx,42);close(d.Sxy,81);close(d.SST,162);close(d.SSE,81/14);close(d.F,162);close(d.r2,27/28);
for(const p of [R.DEFAULT_PAIRS,R.DEFAULT_PAIRS.map(([x,y])=>[x,-y]),[[-2,1],[-1,-2],[0,2],[1,-2],[2,1]]]){const f=R.fit(p);close(f.F,f.tB*f.tB);close(f.pF,f.pB);close(f.r2,f.r*f.r);close(f.SST,f.SSE+f.SSR);close(f.residuals.reduce((a,b)=>a+b,0),0);close(f.leverage.reduce((a,b)=>a+b,0),2);close(f.residuals.reduce((a,e,i)=>a+e*p[i][0],0),0);assert.ok(f.predSE>f.meanSE);}
const scaled=R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[2*x,y]),.05,8);close(scaled.b,d.b/2);close(scaled.a,d.a);close(scaled.prediction,d.prediction);close(scaled.meanSE,d.meanSE);
const centered=R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x-d.xbar,y-d.ybar]),.05,-.5);close(centered.b,d.b);close(centered.a,0);close(centered.covAB,0);close(centered.prediction,d.prediction-d.ybar);
const shifted=R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x,y+100]),.05,4);close(shifted.b,d.b);close(shifted.a,d.a+100);close(shifted.prediction,d.prediction+100);
const wide=R.fit(R.DEFAULT_PAIRS,.01);assert.ok(wide.ciB[1]>d.ciB[1]);assert.equal(R.fit(R.DEFAULT_PAIRS,.05,20).inRange,false);
for(const p of [[[1,2],[2,4],[3,6]],[[1,9],[2,9],[3,9]],[[1,0],[2,0],[3,0]],[[0,.1],[1,.3],[2,.5],[3,.7]]]){const f=R.fit(p);close(f.SSE,0);for(const k of ['tA','tB','pA','pB','ciA','ciB','F','pF','meanCI','predPI'])assert.equal(f[k],null);assert.equal(f.status,p[0][1]===p[1][1]?'constant-response':'perfect-fit');if(f.status==='constant-response'){assert.equal(f.r,null);assert.equal(f.r2,null);}else close(f.r2,1);}
assert.deepEqual(R.parsePairs('1, 2\n3,4;5 6'),[[1,2],[3,4],[5,6]]);assert.deepEqual(R.parsePairs('1e2 -2.5\n+.5,.3'),[[100,-2.5],[.5,.3]]);
for(const text of ['','1,','1,2,','x,y','1 2 3','1 2\n\n3 4','1,,2','1;2','NaN 2','1 Infinity','1e99 2','0x10 2','1,2;'])assert.throws(()=>R.parsePairs(text));
for(const p of [[],[[1,2],[2,3]],[[1,1],[1,2],[1,3]],[[1,2],[2,3],[3,Infinity]],[[1,2],[2,3],['3',4]],[[1,2],[2,3],[3,4,5]],Array.from({length:1001},(_,i)=>[i,i])])assert.throws(()=>R.fit(p));
for(const a of [0,.0001,.21,NaN,'0.05'])assert.throws(()=>R.fit(R.DEFAULT_PAIRS,a));assert.throws(()=>R.fit(R.DEFAULT_PAIRS,.05,1e10));
// Big offsets with modest spread must not suffer raw-sum cancellation.
const offset=R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x+1e8,y+1e8]),.05,1e8+4);close(offset.b,d.b);close(offset.SSE,d.SSE);close(offset.prediction,1e8+d.prediction);
assert.equal(R.esc('<b>&"'), '&lt;b&gt;&amp;&quot;');assert.equal(R.fmt(null),'Not defined');
console.log(`Regression invariants, strict parsing, degenerate cases and validation passed (${checks} numeric assertions).`);

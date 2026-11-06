const assert=require('node:assert/strict'),A=require('./src/anova-core');
const close=(x,y,t=1e-10)=>assert.ok(Math.abs(x-y)<=t*Math.max(1,Math.abs(y)),`${x} != ${y}`);
let d=A.oneWay();close(d.F,18.5);close(d.between.ss,296/3);close(d.total.ss,368/3);close(d.eta2,37/46);close(d.omega2,35/47);
let t=A.twoWay();assert.deepEqual(t.cellMeans,[[20,26],[24,38]]);assert.deepEqual(t.interactions,[[2,-2],[-2,2]]);assert.deepEqual(t.additive,[[18,28],[26,36]]);close(t.total.ss,572);close(t.A.F,48);close(t.B.F,75);close(t.AB.F,12);close(A.twoWay(A.PARALLEL).AB.F,0);close(A.twoWay(A.CROSSOVER).A.F,0);close(A.twoWay(A.CROSSOVER).B.F,0);
for(const groups of [A.ONE_WAY,[[1,4],[2,7,9,8],[7]],[[1e12-2,1e12],[1e12-5,1e12-3]],[[1e-100,2e-100],[4e-100,5e-100]]]){d=A.oneWay(groups);close(d.between.ss+d.within.ss,d.total.ss,1e-4);assert.equal(d.between.df+d.within.df,d.total.df);close(d.counts.reduce((s,n,i)=>s+n*d.effects[i],0),0,.01);}
for(const cells of [A.TWO_WAY,A.PARALLEL,A.CROSSOVER,Array.from({length:3},(_,i)=>Array.from({length:2},(_,j)=>[i+j,2*i-j,3*i+j,2*i+4*j]))]){t=A.twoWay(cells);close(t.A.ss+t.B.ss+t.AB.ss+t.error.ss,t.total.ss);assert.equal(t.A.df+t.B.df+t.AB.df+t.error.df,t.total.df);t.interactions.forEach(row=>close(row.reduce((s,x)=>s+x,0),0));for(let j=0;j<t.r;j++)close(t.interactions.reduce((s,row)=>s+row[j],0),0);}
assert.equal(A.oneWay([[2,2],[2,2]]).F,null);assert.equal(A.oneWay([[2,2],[3,3]]).F,Infinity);assert.equal(A.oneWay([[2,2],[2,2]]).eta2,null);
for(const bad of [[],[[1],[2]],[[1,2],['',3]],[[1,2],[NaN,3]],[[1,2],[Infinity,3]],[[1,2],[null,3]],[[1,2],[1e13,3]],[[1,2],[]]])assert.throws(()=>A.oneWay(bad));
for(const bad of [[],[[[1],[2]],[[3],[4]]],[[[1,2],[3,4]],[[5,6]]],[[[1,2],[3,4]],[[5,6],[7,8,9]]]])assert.throws(()=>A.twoWay(bad));
for(const alpha of [0,1,NaN,'',null])assert.throws(()=>A.oneWay(A.ONE_WAY,alpha));
for(const html of [A.groupPlot(A.oneWay()),A.interactionPlot(A.twoWay()),A.variancePlot(A.oneWay()),A.variancePlot(A.twoWay())]){assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity/);}
assert.match(A.table(A.oneWay([[1,2],[100,101]])),/&lt;0.000001|0\.000/);
console.log('ANOVA JS invariants, validation, degeneracy and SVG tests passed.');

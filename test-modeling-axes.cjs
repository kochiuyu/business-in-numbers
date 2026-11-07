'use strict';
const assert=require('node:assert/strict');
const A=require('./src/anova-core'),R=require('./src/regression-core'),V=require('./src/regression-view');
let checks=0;
function ok(v,message){checks++;assert.ok(v,message);}
function ticks(svg,axis='y'){
 return [...svg.matchAll(/<text\b([^>]*)>(.*?)<\/text>/g)].filter(m=>axis==='y'?/text-anchor="end"/.test(m[1]):/y="295"/.test(m[1])).map(m=>m[2]);
}
function check(svg,both=false){
 ok(!/NaN|Infinity|undefined/.test(svg),'Finite SVG');
 for(const axis of both?['x','y']:['y']){
  const labels=ticks(svg,axis),numbers=labels.map(v=>Number(v.replaceAll(',','')));
  ok(labels.length===5&&new Set(labels).size===5,'Five distinct '+axis+' ticks');
  ok(labels.every(v=>v.length<=7),'Labels fit margins');
  ok(labels.every(v=>v!=='-0'),'No negative zero');
  ok(numbers.every((v,i)=>!i||v>numbers[i-1]),'Tick values ordered');
 }
 const height=Number(svg.match(/viewBox="0 0 640 ([\d.]+)"/)[1]);
 for(const m of svg.matchAll(/<text\b([^>]*)>(.*?)<\/text>/g)){
  const y=Number(m[1].match(/\by="([^"]+)"/)[1]);ok(y+5<=height,'Text baseline fits SVG');
 }
 if(/tick ×|ticks ×/.test(svg))ok(/<desc[^>]*>[^<]*(?:tick ×|ticks ×)/.test(svg),'Scaled axes explained accessibly');
}
const baseline=A.oneWay(),reg=R.fit(R.DEFAULT_PAIRS,.05,4.5);
for(const scale of [1e-8,.0001,.01,1,1000,1e6])for(const sign of [-1,1]){
 const f=scale*sign;
 const a=A.oneWay(A.ONE_WAY.map(g=>g.map(v=>v*f))),before=JSON.stringify(a);
 check(A.groupPlot(a));ok(JSON.stringify(a)===before,'ANOVA rendering is read-only');
 ok(Math.abs(a.F-baseline.F)<1e-10,'Unit conversion preserves F');
 const two=A.twoWay(A.TWO_WAY.map(row=>row.map(g=>g.map(v=>v*f))));check(A.interactionPlot(two));
 for(const xscale of [.0001,1,1000]){
  const d=R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x*xscale,y*f]),.05,4.5*xscale),snapshot=JSON.stringify(d);
  check(V.plot(d),true);check(V.residualPlot(d),true);
  ok(JSON.stringify(d)===snapshot,'Regression rendering is read-only');
  ok(Math.abs(d.r2-reg.r2)<1e-12&&Math.abs(d.pB-reg.pB)<1e-12,'Unit conversion preserves inference');
 }
}
for(const constant of [-1e6,-.001,0,.001,1e6]){
 check(A.groupPlot(A.oneWay([[constant,constant],[constant,constant]])));
 check(A.interactionPlot(A.twoWay([[[constant,constant],[constant,constant]],[[constant,constant],[constant,constant]]])));
 const d=R.fit([[1,constant],[2,constant],[3,constant]],.05,2);check(V.plot(d),true);check(V.residualPlot(d),true);
}
// Currency around a large base needs explained offsets, not long clipped ticks.
check(A.groupPlot(A.oneWay(A.ONE_WAY.map(g=>g.map(v=>1e9+v*.01)))));
const offset=R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[1e8+x*.01,1e8+y*.01]),.05,1e8+.045);
check(V.plot(offset),true);check(V.residualPlot(offset),true);
ok(V.plot(offset).includes('Predictor = '),'Predictor offset explained');
ok(A.groupPlot(baseline).includes('16.24'),'Default ANOVA raw tick preserved');
ok(!A.groupPlot(baseline).includes('ticks ×'),'Default ANOVA raw units');
ok(!V.plot(reg).includes('ticks ×'),'Default regression raw units');
// At the offset-ratio threshold, scaled absolute ticks can still be too long.
for(const sign of [-1,1]){
 const low=.12177,high=.121893,span=(high-low)/1.32,minimum=low+.16*span,maximum=high-.16*span;
 const groups=[[minimum,minimum+span/4],[minimum+span/2,maximum]].map(g=>g.map(v=>sign*v));
 const chart=A.groupPlot(A.oneWay(groups));check(chart);
 ok(chart.includes('Response = '),'Wide scaled ANOVA labels fall back to offsets');
 const rspan=(high-low)/1.24,rmin=low+.12*rspan,rmax=high-.12*rspan;
 const d=R.fit([[1,sign*rmin],[2,sign*(rmin+rspan/3)],[3,sign*rmax]],.05,2);
 const fit=V.plot(d,{bands:false});check(fit,true);
 ok(fit.includes('Response = '),'Wide scaled regression labels fall back to offsets');
}
const largeResiduals=V.residualPlot(R.fit(R.DEFAULT_PAIRS.map(([x,y])=>[x,y*1e6]),.05,4.5));
ok(largeResiduals.includes('Residual ticks ×'),'Scaled residual axis names residual units');
ok(!largeResiduals.includes('Response ticks ×'),'Residual axis never mislabeled response');
console.log(`Modeling axes: ${checks} checks passed`);

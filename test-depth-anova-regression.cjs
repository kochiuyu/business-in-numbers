'use strict';
// Source-preserving exposition checks plus independent calculations from raw data.
// --built also checks the coordinator's fresh static output. This script never builds.
const assert=require('node:assert/strict'), fs=require('node:fs'), crypto=require('node:crypto');
const {compile,renderMath}=require('./scripts/build.cjs');
const A=require('./src/anova-core.js'), R=require('./src/regression-core.js');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-10,m||`${a} differs from ${b}`);
const mean=x=>x.reduce((s,v)=>s+v,0)/x.length;
const sum=x=>x.reduce((s,v)=>s+v,0);
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const baseline={
 anova:{html:'d56aaf54c645dec40714f211dc74ac9fe679f7126ae0ab927553bdaeba5eb052',math:'84640b947d5c888a787df7aa6e49d78faae19bbe95fb52589816eaaf4d932eab',
  blocks:[['weighting',2],['constraints',8]],formulas:['depth-weighted-means','depth-weighted-effects','depth-interaction-constraints']},
 regression:{html:'1f828ae86ae10180dd96c3f09ab2ca2b66992d037c37cf942b73638ae2b01011',math:'6ec32443700cd46fa49c1256b195625535baa8f51c74645718999637ad15d747',
  blocks:[['weights',6],['covariance',12]],formulas:['depth-slope-weights','depth-slope-unbiased','depth-mean-covariance']}
};
for(const [name,expected] of Object.entries(baseline)){
 const source=fs.readFileSync(`src/${name}.html`,'utf8');
 const equations=JSON.parse(fs.readFileSync(`src/${name}-math.json`,'utf8'));
 let original=require('./scripts/readability-preservation.cjs').restore(source,name);
 if(name==='regression')original=original.replace(/<!-- normal-depth:start -->[\s\S]*?<!-- normal-depth:end -->/,'').replace(/<!-- coefficient-weights-depth:start -->[\s\S]*?<!-- coefficient-weights-depth:end -->/,'');
 for(const [label,step] of expected.blocks){
  const start=`<!-- depth48:${label}:start -->`,end=`<!-- depth48:${label}:end -->`;
  const i=source.indexOf(start),j=source.indexOf(end,i)+end.length;
  ok(i>=0&&j>i,`${name}/${label}: bounded insertion`);
  ok(source.indexOf(start,i+1)===-1&&source.indexOf(end,j)===-1,'unique insertion markers');
  const part=source.slice(i,j),id=`depth-${name}-${label}`;
  ok(i>source.indexOf(`id="${name}-step-${step}"`)&&j<source.indexOf(name==='anova'&&step===8?'id="anova-step-12"':`id="${name}-step-${step+1}"`),'bridge belongs to intended lesson step');
  ok(part.includes(`id="${id}"`)&&part.includes(`aria-labelledby="${id}-title"`)&&part.includes(`id="${id}-title"`),'accessible named bridge');
  ok(part.includes('<details><summary>')&&part.includes('</summary><p>'),'native reasoning feedback');
  ok(!/\bhidden\b|<script|<button|<details[^>]+\bopen\b/.test(part),'explanation needs no JavaScript and feedback starts closed');
  const legacyStart=original.indexOf(start),legacyEnd=original.indexOf(end,legacyStart)+end.length;
  ok(legacyStart>=0&&legacyEnd>legacyStart,'restored insertion has exact boundaries');
  original=original.slice(0,legacyStart)+original.slice(legacyEnd);
 }
 ok(digest(original)===expected.html,`${name}: every pre-existing lesson, exercise, technical block and activity remains byte-identical`);
 const oldEquations={...equations};
 if(name==='regression')for(const id of ['depth-normal-balance','depth-normal-centering','depth-normal-numbers','depth-normal-minimum','depth-intercept-weight-square','depth-intercept-weight-product'])delete oldEquations[id];
 for(const id of expected.formulas){
  ok(equations[id]&&equations[id].display===true&&equations[id].text.length>40,'formula has full text alternative');
  const rendered=renderMath(id,equations[id]);
  ok(rendered.includes('<math xmlns=')&&rendered.includes('class="katex-html" aria-hidden="true"'),'semantic MathML with visual duplicate hidden');
  ok(rendered.includes('tabindex="0"')&&rendered.includes('Read formula / LaTeX'),'keyboard scrolling and formula fallback');
  delete oldEquations[id];
 }
 ok(digest(JSON.stringify(oldEquations))===expected.math,`${name}: all original mathematics preserved`);
 const compiled=compile(source,equations);
 ok(!compiled.includes('{{math:')&&!compiled.includes('katex-error'),'entire source math compiles without building');
 for(const html of [source,compiled,...(process.argv.includes('--built')?[fs.readFileSync(`dist/${name}.html`,'utf8')]:[])]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  ok(new Set(ids).size===ids.length,'unique IDs after expansion');
  for(const [label] of expected.blocks)ok(html.includes(`id="depth-${name}-${label}"`),'worked bridge survives rendering');
 }
}
// Independent unequal-sample arithmetic. These raw observations realize the
// stated counts and means; no fitted-model code is used to derive expectations.
const groups=[[18,22],[22,24,26,24],[25,27,29,25,27,29]], counts=groups.map(g=>g.length),means=groups.map(mean);
assert.deepEqual(counts,[2,4,6]);assert.deepEqual(means,[20,24,27]);checks+=2;
assert.deepEqual(groups.map(sum),[40,96,162]);checks++;
const all=groups.flat(),grand=mean(all),equal=mean(means),effects=means.map(v=>v-grand);
near(sum(all),298);near(grand,149/6);near(equal,71/3);
for(const [v,e] of effects.map((v,i)=>[v,[-29/6,-5/6,13/6][i]]))near(v,e);
near(sum(effects.map((v,i)=>counts[i]*v)),0);ok(Math.abs(sum(effects))>0,'unweighted effect sum is not the weighted constraint');
const within=sum(groups.map((g,i)=>sum(g.map(v=>(v-means[i])**2))));
const total=sum(all.map(v=>(v-grand)**2));
const between=sum(means.map((v,i)=>counts[i]*(v-grand)**2));
near(total,within+between);near(A.oneWay(groups).grandMean,grand);near(A.oneWay(groups).between.ss,between);
const wrongBetween=sum(means.map((v,i)=>counts[i]*(v-equal)**2));
ok(Math.abs(total-within-wrongBetween)>1,'substituting equal-process average changes the usual decomposition');
// Independent two-by-two constraints and dimensions, including the tempting
// but insufficient grand-total-only condition.
for(const d of [-3,0,2,7.5]){
 const t=[[d,-d],[-d,d]];
 for(const row of t)near(sum(row),0);
 for(let j=0;j<2;j++)near(t[0][j]+t[1][j],0);
}
const additive=[[18,28],[26,36]],tau=[[2,-2],[-2,2]],cell=additive.map((row,i)=>row.map((v,j)=>v+tau[i][j]));
assert.deepEqual(cell,[[20,26],[24,38]]);checks++;
for(let i=0;i<2;i++)near(mean(additive[i]),mean(cell[i]));
for(let j=0;j<2;j++)near(mean(additive.map(row=>row[j])),mean(cell.map(row=>row[j])));
assert.deepEqual(A.twoWay().interactions,tau);checks++;
const bad=[[1,1],[-1,-1]];near(sum(bad.flat()),0);near(mean(bad[0]),1);near(mean(bad[1]),-1);
for(const [c,r] of [[2,2],[3,2],[3,4]])near(1+(c-1)+(r-1)+(c-1)*(r-1),c*r);
near((2-1)*(2-1),1);
// Independently calculate the slope weights and coefficient covariance from
// the eight original pairs, then compare production outputs separately.
const pairs=[[1,11],[2,12],[3,16],[4,15],[5,19],[6,20],[7,23],[8,24]],n=pairs.length;
const x=pairs.map(p=>p[0]),y=pairs.map(p=>p[1]),mx=mean(x),my=mean(y),sxx=sum(x.map(v=>(v-mx)**2));
const w=x.map(v=>(v-mx)/sxx);
for(let i=0;i<n;i++)near(w[i],[-7,-5,-3,-1,1,3,5,7][i]/84);
near(sum(w),0);near(sum(w.map((v,i)=>v*x[i])),1);near(sum(w.map(v=>v*v)),1/42);near(w[0],-1/12);near(w[7],1/12);
const b=sum(w.map((v,i)=>v*y[i])),a=my-b*mx;
near(b,27/14);near(a,247/28);
near(sum(w.map((v,i)=>v*(y[i]+10))),b);
near(sum(w.map((v,i)=>v*(y[i]+(i===7?1:0))))-b,1/12);
for(const [alpha,beta] of [[4,-2],[100,3],[7,0]])near(sum(w.map((v,i)=>v*(alpha+beta*x[i]))),beta);
const sse=sum(pairs.map(([v,z])=>(z-a-b*v)**2)),s2=sse/(n-2);
near(sse,81/14);near(s2,27/28);near(mx,4.5);near(my,17.5);near(sxx,42);
const va=s2*(1/n+mx*mx/sxx),vb=s2/sxx,cov=-mx*s2/sxx;
near(va,459/784);near(vb,9/392);near(cov,-81/784);
const naive=va+mx*mx*vb,full=naive+2*mx*cov;
near(naive,1647/1568);near(full,27/224);near(full,s2/n);
ok(va.toFixed(6)==='0.585459');ok(vb.toFixed(6)==='0.022959');ok(cov.toFixed(6)==='-0.103316');
ok(naive.toFixed(6)==='1.050383');ok(full.toFixed(6)==='0.120536');
ok(Math.sqrt(naive).toFixed(4)==='1.0249');ok(Math.sqrt(full).toFixed(4)==='0.3472');
const fit=R.fit(pairs,.05,mx),centered=R.fit(pairs.map(([v,z])=>[v-mx,z]),.05,0);
near(fit.a,a);near(fit.b,b);near(fit.covAB,cov);near(fit.meanSE,Math.sqrt(full));
near(centered.a,my);near(centered.b,b);near(centered.covAB,0);near(centered.meanSE,fit.meanSE);
near(centered.seA,Math.sqrt(s2/n));
const zeroOriginal=R.fit(pairs,.05,0),zeroCentered=R.fit(pairs.map(([v,z])=>[v-mx,z]),.05,-mx);
near(zeroOriginal.meanSE,zeroCentered.meanSE);near(zeroOriginal.prediction,zeroCentered.prediction);
console.log(`Passed ${checks} Class 7–8 depth checks: exact preservation, math rendering, weighting, interaction constraints, slope weights and coefficient covariance${process.argv.includes('--built')?', including built pages':''}.`);

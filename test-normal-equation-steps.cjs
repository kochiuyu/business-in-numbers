'use strict';
// Source preservation plus independent arithmetic for the expanded proof.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {compile,renderMath}=require('./scripts/build.cjs'),R=require('./src/regression-core.js');
let checks=0;
function ok(v,m){checks++;assert.ok(v,m);}
function near(a,b,m){ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),m||`${a} != ${b}`);}
const sum=x=>x.reduce((a,b)=>a+b,0),mean=x=>sum(x)/x.length;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=fs.readFileSync('src/regression.html','utf8'),math=JSON.parse(fs.readFileSync('src/regression-math.json','utf8'));
const start='<!-- normal-depth:start -->',end='<!-- normal-depth:end -->';
const i=source.indexOf(start),j=source.indexOf(end,i)+end.length;
ok(i>=0&&j>i,'bounded explanation exists');ok(source.indexOf(start,i+1)===-1&&source.indexOf(end,j)===-1,'unique boundaries');
const block=source.slice(i,j);
ok(hash(source.replace(block,''))==='0ec3f181618b9b32eeb68a115b1a7a1fc2243648cd20fb7fb7f2fe72d76a15a7','all earlier HTML, explanations and activities remain byte-identical');
ok(i>source.indexOf('Technical depth · The minimizing equations')&&j<source.indexOf('id="regression-step-5"'),'inside original technical proof');
ok(block.includes('aria-labelledby="depth-regression-normal-title"')&&block.includes('id="depth-regression-normal-title"'),'accessible heading');
ok(block.includes('<details><summary>Check:')&&!/<script|<button|\bhidden\b|<details[^>]+\bopen\b/.test(block),'native reasoning disclosure, no script dependency');
const newIds=['depth-normal-balance','depth-normal-centering','depth-normal-numbers','depth-normal-minimum'],originalMath={...math};
for(const id of newIds){
 const item=math[id];ok(item&&item.display===true&&item.title&&item.text.length>80,'full formula and fallback');ok(block.includes(`{{math:${id}}}`),'formula belongs here');
 const rendered=renderMath(id,item);ok(rendered.includes('<math xmlns=')&&rendered.includes('class="katex-html" aria-hidden="true"'),'MathML, hidden visual duplicate');
 ok(rendered.includes('tabindex="0"')&&rendered.includes('Read formula / LaTeX'),'keyboard scrolling and formula fallback');ok(!rendered.includes('katex-error'),'renders');delete originalMath[id];
}
ok(hash(JSON.stringify(originalMath))==='70ed057ecef2cc12ebed3cf68e8c8515e724e2f10d907b4b92501b3631427423','all original math unchanged');
for(const html of [compile(source,math),...(process.argv.includes('--built')?[fs.readFileSync('dist/regression.html','utf8')]:[])]){
 ok(!html.includes('{{math:')&&!html.includes('katex-error'),'math compiles');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);ok(new Set(ids).size===ids.length,'unique page IDs');
 ok(html.includes('id="depth-regression-normal"')&&html.includes('No probability assumption is needed'),'explanation retained');
 for(const id of newIds)ok(html.includes(`data-math="${id}"`),'new formula retained');
}
const pairs=[[1,11],[2,12],[3,16],[4,15],[5,19],[6,20],[7,23],[8,24]],x=pairs.map(p=>p[0]),y=pairs.map(p=>p[1]);
const n=x.length,mx=mean(x),my=mean(y),sx=sum(x),sy=sum(y),sx2=sum(x.map(z=>z*z)),sxy=sum(pairs.map(([u,v])=>u*v));
near(sx,36);near(sy,140);near(sx2,204);near(sxy,711);near(mx,4.5);near(my,17.5);
const sxx=sx2-sx*sx/n,centerxy=sxy-sx*sy/n,b=centerxy/sxx,a=my-b*mx;
near(sxx,42);near(centerxy,81);near(b,27/14);near(a,247/28);near(8*a+36*b,140);near(36*a+204*b,711);
near(36*17.5,630);near(36*4.5,162);near(204-162,42);near(711-630,81);
const residuals=pairs.map(([u,v])=>v-a-b*u);
for(let k=0;k<n;k++)near(residuals[k],[7,-19,39,-43,15,-11,19,-7][k]/28);
near(sum(residuals),0);near(sum(residuals.map((e,k)=>e*x[k])),0);near(sum(residuals.map(e=>e*e)),81/14);
const horizontal=y.map(z=>z-my);near(sum(horizontal),0);near(sum(horizontal.map((e,k)=>x[k]*e)),81);near(sum(horizontal.map(e=>e*e)),162);
const fit=R.fit(pairs);near(fit.a,a);near(fit.b,b);near(fit.SSE,81/14);
// Derive expectations directly from raw numbers, not production fitting code.
// Check changes of sign, scale and means, two-point fits and flat responses.
for(const data of [pairs,[[2,5],[2,4],[4,1],[8,-1]],[[10,3],[13,3],[14,3]],[[1,3],[2,5]],[[0,-1],[-2,6],[3,5],[7,8]]]){
 const xs=data.map(p=>p[0]),ys=data.map(p=>p[1]),count=xs.length,xbar=mean(xs),ybar=mean(ys);
 const xx=sum(xs.map(v=>(v-xbar)**2)),xy=sum(data.map(([u,v])=>(u-xbar)*(v-ybar))),slope=xy/xx,intercept=ybar-slope*xbar;
 const errors=data.map(([u,v])=>v-intercept-slope*u),sse=sum(errors.map(e=>e*e));
 const D=(aa,bb)=>sum(data.map(([u,v])=>(v-aa-bb*u)**2));
 near(sum(xs.map(v=>v-xbar)),0);near(sum(ys.map(v=>v-ybar)),0);near(sum(data.map(([u,v])=>u*(v-ybar))),xy);near(sum(xs.map(u=>u*(u-xbar))),xx);
 near(sum(errors),0);near(sum(errors.map((e,k)=>xs[k]*e)),0);
 for(const u of [-7,-1,0,0.1,3])for(const v of [-2,-0.5,0,0.2,4]){
  const delta=D(intercept+u,slope+v)-sse,direct=sum(xs.map(z=>(u+v*z)**2)),centered=count*(u+v*xbar)**2+v*v*xx;
  near(delta,direct);near(direct,centered);ok((u===0&&v===0)?Math.abs(delta)<1e-10:delta>0,'unique minimum');
  const aa=intercept+u,bb=slope+v,eps=1e-3,ea=data.map(([z,w])=>w-aa-bb*z);
  near((D(aa+eps,bb)-D(aa-eps,bb))/(2*eps),-2*sum(ea),'intercept derivative');
  near((D(aa,bb+eps)-D(aa,bb-eps))/(2*eps),-2*sum(ea.map((e,k)=>e*xs[k])),'slope derivative');
 }
}
// Degenerate designs: the same a + b c gives the same predictions and SSE.
for(const c of [-3,0,4]){
 const ys=[2,4,9],ybar=mean(ys),sse=sum(ys.map(z=>(z-ybar)**2));
 for(const slope of [-5,0,8]){const intercept=ybar-slope*c;near(intercept+slope*c,ybar);near(sum(ys.map(z=>(z-intercept-slope*c)**2)),sse);}
}
console.log(`Passed ${checks} normal-equation checks: exact preservation, accessible math, raw totals, centered cancellation, derivatives, unique minimum and constant-x boundary${process.argv.includes('--built')?', including built output':''}.`);

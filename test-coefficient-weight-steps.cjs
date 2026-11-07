'use strict';
// Preserve the existing lesson and verify the newly expanded weight algebra.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {compile,renderMath}=require('./scripts/build.cjs');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(a),Math.abs(b)),m||`${a} != ${b}`);
const sum=a=>a.reduce((s,v)=>s+v,0),mean=a=>sum(a)/a.length;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=fs.readFileSync('src/regression.html','utf8'),math=JSON.parse(fs.readFileSync('src/regression-math.json','utf8'));
const start='<!-- coefficient-weights-depth:start -->',end='<!-- coefficient-weights-depth:end -->',i=source.indexOf(start),j=source.indexOf(end,i)+end.length;
ok(i>=0&&j>i,'bounded addition');ok(source.indexOf(start,i+1)===-1&&source.indexOf(end,j)===-1,'unique markers');
const block=source.slice(i,j);
ok(hash(require('./scripts/readability-preservation.cjs').restore(source,'regression').replace(block,''))==='da0c88944c74de59b29e53ec97cc4ba4a0ee3bda35b3d1912150d986da63c39a','every earlier explanation and activity preserved byte-for-byte');
ok(i>source.indexOf('Technical depth · Linear weights give the variances')&&j<source.indexOf('id="regression-step-9"'),'inside existing coefficient technical proof');
ok(block.includes('aria-labelledby="depth-intercept-weights-title"')&&block.includes('id="depth-intercept-weights-title"'),'named block and heading');
ok(!/<script|<button|\bhidden\b|<details/.test(block),'no new interaction or JavaScript dependency');
for(const phrase of ['square these weights <em>before</em> summing','common conditional variance','different observations','Normality is not needed'])ok(block.includes(phrase),phrase);
const ids=['depth-intercept-weight-square','depth-intercept-weight-product'],old={...math};
for(const id of ids){const m=math[id];ok(m&&m.display&&m.title&&m.text.length>120,'complete accessible formula');ok(block.includes(`{{math:${id}}}`),'formula referenced once');
 const html=renderMath(id,m);ok(html.includes('<math xmlns=')&&html.includes('class="katex-html" aria-hidden="true"'),'MathML and hidden visual duplicate');
 ok(html.includes('tabindex="0"')&&html.includes('Read formula / LaTeX'),'keyboard scrolling and spoken fallback');ok(!html.includes('katex-error'),'formula renders');delete old[id];}
ok(hash(JSON.stringify(old))==='d34238f8562829f046fd67dd3ee5ab5c99e2e090c3f33e023222b257d2e1d409','all earlier equations preserved');
for(const html of [compile(source,math),...(process.argv.includes('--built')?[fs.readFileSync('dist/regression.html','utf8')]:[])]){
 ok(!html.includes('{{math:')&&!html.includes('katex-error'),'complete math rendering');
 const allIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);ok(new Set(allIds).size===allIds.length,'unique page IDs');
 for(const id of ids)ok(html.includes(`data-math="${id}"`),'equation survives build');
 ok(html.includes('id="depth-intercept-weights"'),'explanation survives build');}
// Compute coefficients directly from centered raw data, independently of production code.
function fit(x,y){const mx=mean(x),my=mean(y),xx=sum(x.map(v=>(v-mx)**2));const b=sum(x.map((v,k)=>(v-mx)*(y[k]-my)))/xx;return {a:my-b*mx,b};}
for(const x of [[1,2,3,4,5,6,7,8],[-3,0,4],[-2,-1,0,1,2],[100,101,103,109],[0,1],[-15,-12,-8,-1]]){
 const n=x.length,mx=mean(x),xx=sum(x.map(v=>(v-mx)**2)),w=x.map(v=>(v-mx)/xx),v=w.map(z=>1/n-mx*z);
 const sw=sum(w),sw2=sum(w.map(z=>z*z)),sv2=sum(v.map(z=>z*z)),svw=sum(v.map((z,k)=>z*w[k]));
 near(sw,0);near(sw2,1/xx);near(sum(v),1);near(sum(v.map((z,k)=>z*x[k])),0);
 const constant=n/n**2,cross=-2*mx/n*sw,last=mx**2*sw2;
 near(constant,1/n);near(cross,0);near(last,mx**2/xx);near(sv2,constant+cross+last);near(sv2,1/n+mx**2/xx);
 near(svw,sw/n-mx*sw2);near(svw,-mx/xx);
 // A unit perturbation in each response reveals that observation's coefficient weights.
 const perturbations=x.map((_,k)=>fit(x,x.map((_,j)=>Number(k===j))));
 for(let k=0;k<n;k++){near(perturbations[k].a,v[k]);near(perturbations[k].b,w[k]);}
 for(const sigma2 of [.25,1,9]){
  near(sigma2*sum(perturbations.map(z=>z.a*z.a)),sigma2*(1/n+mx**2/xx));
  near(sigma2*sum(perturbations.map(z=>z.b*z.b)),sigma2/xx);
  near(sigma2*sum(perturbations.map(z=>z.a*z.b)),-sigma2*mx/xx);
 }
 if(mx===0){near(svw,0);near(sv2,1/n);}else ok(Math.abs(svw)>0,'uncorrelated observations can give correlated coefficients');
}
// Original eight market-weeks, with the existing estimated noise variance.
near((27/28)*(1/8+4.5**2/42),459/784);
near(-(27/28)*4.5/42,-81/784);
console.log(`Passed ${checks} coefficient-weight checks: preservation, accessible rendering, expanded sums, covariance, and independent response perturbations${process.argv.includes('--built')?', including built output':''}.`);

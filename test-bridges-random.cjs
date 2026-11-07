'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-12,`${x} differs from ${y}`);
// Independent enumeration of every joint outcome, including boundary models.
for (let qTicks=0;qTicks<=50;qTicks++) {
 const q=qTicks/100;
 const rows=[[0,0,q],[1,0,.5-q],[0,1,.5-q],[1,1,q]];
 const mean=k=>rows.reduce((a,r)=>a+r[k]*r[2],0);
 near(rows.reduce((a,r)=>a+r[2],0),1);
 near(mean(0),.5);near(mean(1),.5);
 const covariance=rows.reduce((a,[x,y,p])=>a+(x-.5)*(y-.5)*p,0);
 const sumMean=rows.reduce((a,[x,y,p])=>a+(x+y)*p,0);
 const sumVariance=rows.reduce((a,[x,y,p])=>a+(x+y-sumMean)**2*p,0);
 near(sumMean,1);near(covariance,q-.25);near(sumVariance,2*q);
 near(sumVariance,.25+.25+2*covariance);
}
near(.45*.25,.1125);near(.05*(-.25),-.0125);
near(.1125-.0125-.0125+.1125,.20);
near(.45*(0-1)**2+.1*(1-1)**2+.45*(2-1)**2,.90);
const source=fs.readFileSync('src/random-variables.html','utf8');
const html=fs.readFileSync('dist/random-variables.html','utf8');
const id='bridge-joint-arithmetic';
for (const s of [source,html]) {
 const start=s.indexOf(`id="${id}"`);
 assert.ok(start>s.indexOf('id="rv-step-4"')&&start<s.indexOf('id="foundation-zero-covariance"'));
 assert.equal(s.split(`id="${id}"`).length,2);
 assert.ok(s.includes(`aria-labelledby="${id}-title"`));
 assert.ok(s.includes(`id="${id}-title"`));
 const bridge=s.slice(start,s.indexOf('id="foundation-zero-covariance"'));
 for(const phrase of ['.1125 − .0125 − .0125 + .1125','Do not divide by four again','The factor 2 comes from','not the 45% probability','probability .25, covariance is 0','<b>.90 (busy counters)²</b>'])assert.ok(bridge.includes(phrase),phrase);
 assert.equal((bridge.match(/<th scope="row">/g)||[]).length,4);
 assert.ok(bridge.includes('tabindex="0" role="region"'));
 assert.ok(!s.includes('raw fourth central moment'));
 assert.ok(s.includes('The fourth central moment'));
}
console.log('Passed 51 independently enumerated joint models, weighted covariance arithmetic, sum variance and static bridge structure.');

const restored=source.replace(/<!-- poisson-limit-steps:start -->[\s\S]*?<!-- poisson-limit-steps:end -->/,'').replace(/<section class="second-foundation c3-depth" id="bridge-joint-arithmetic"[\s\S]*?<\/section>\n/,'').replace('The fourth central moment','The raw fourth central moment');
assert.equal(require('node:crypto').createHash('sha256').update(restored).digest('hex'),'46b55b68ddeb04a422ae1d0fd6066d366db5e94814abe760799eedac46564ef3','all prior Class 3 material retained, apart from explicitly corrected moment terminology');

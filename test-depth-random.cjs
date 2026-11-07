'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('dist/random-variables.html','utf8');
const css=fs.readFileSync('src/class-three.css','utf8');
const {mass}=require('./src/class-three-visuals.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} ≠ ${b}`);
const mean=mass.reduce((s,p,x)=>s+x*p,0);
const second=mass.reduce((s,p,x)=>s+x*x*p,0);
near(mean,1.7);near(second,3.7);near(second-mean*mean,.81);
near(mass.reduce((s,p,x)=>s+(x-mean)**2*p,0),second-mean*mean);
near(100*mean,170);near(2*.25,.5);near(15/30,.5);
const cdf=t=>t<0?0:t>30?1:t/30;
near(cdf(-1),0);near(cdf(31),1);near(cdf(21)-cdf(6),.5);near(cdf(27),.9);near(27/60,.45);
for(const [id,step,next] of [['depth-model-moments',3,4],['depth-density-deadline',6,7]]){
 const start=html.indexOf(`id="${id}"`);
 assert.ok(start>html.indexOf(`id="rv-step-${step}"`)&&start<html.indexOf(`id="rv-step-${next}"`),'bridge in intended step');
 assert.equal(html.split(`id="${id}"`).length,2,'unique bridge anchor');
 assert.ok(html.includes(`aria-labelledby="${id}-title"`));
 assert.ok(html.includes(`id="${id}-title"`));
}
for(const phrase of ['3.70 orders²','0.81 orders²','27 minutes','same probability to the same wait','does not report a fitted shop dataset','independence is not needed','rounded to “15 minutes”'])assert.ok(html.includes(phrase),phrase);
assert.ok(css.includes('.c3-depth-pair{grid-template-columns:1fr}'));
assert.ok(!/\{\{rvvisual:|\{\{math:/.test(html),'built bridges and formulas available without JS');
console.log('Passed Class 3 deeper model/moment arithmetic, density/CDF boundaries, static markup and narrow-layout assertions.');

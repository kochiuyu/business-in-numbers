'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const Stats=require('./src/stats.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)};
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-10,m||`${a} ≈ ${b}`);
const x=[18,22,24,25,28,30,32,35,38,42,46,200],logged=x.map(Math.log);
function independent(a){const n=a.length,mean=a.reduce((p,v)=>p+v,0)/n,dev=a.map(v=>v-mean),m2=dev.reduce((p,v)=>p+v*v,0)/n;return {mean,sd:Math.sqrt(m2),skew:dev.reduce((p,v)=>p+v**3,0)/n/m2**1.5,excess:dev.reduce((p,v)=>p+v**4,0)/n/m2**2-3}}
const raw=independent(x),log=independent(logged);
near(raw.mean,45);near(raw.sd,47.404289538676416);near(raw.skew,2.8654449916042997);near(raw.excess,6.547348190044465);
near(log.mean,3.5529203553036677);near(log.sd,.5878979698637263);near(log.skew,1.9894341825320074);near(log.excess,3.669807152945234);
near(Math.exp(log.mean),34.91513334083755);near(Math.exp(log.mean),x.reduce((a,b)=>a*b,1)**(1/x.length));
near(Math.log(30)-Math.log(25),Math.log(42)-Math.log(35));near(Math.log(1.2),.1823215567939546);near(Math.expm1(Math.log(1.2)),.2);
for(let i=0;i<x.length;i++)near(Math.exp(logged[i]),x[i]);
for(const key of ['mean','sd','skew','excess']){near(Stats.describe(x)[key],raw[key]);near(Stats.describe(logged)[key],log[key]);}
for(const points of [[10,10,10,10,30],[1,1,1,1,9],[.001,.001,.001,.001,8]]){const transformed=independent(points.map(Math.log));near(transformed.skew,1.5);near(transformed.excess,.25);}
const cents=independent(x.map(v=>Math.log(100*v)));
near(cents.mean,log.mean+Math.log(100));near(cents.skew,log.skew);near(cents.excess,log.excess);
const source=fs.readFileSync('src/index.html','utf8'),built=fs.readFileSync('dist/index.html','utf8');
for(const html of [source,built]){
 const block=html.match(/<section class="shape-log-worked" id="shape-log-worked"[\s\S]*?<\/section>/)?.[0];ok(block,'log worked example retained');
 for(const value of ['3.5529','0.5879','2.8654','1.9894','6.5473','3.6698','$34.92','0.1823','20%','1.5','0.25'])ok(block.includes(value),'checked numerical display '+value);
 for(const phrase of ['same twelve records','not a change to your purchase lab','not a percentage change','Recompute their mean, SD','not the $45 arithmetic mean','requires x &gt; 0','Do not silently drop','corrected sample excess','geometric mean'])ok(block.includes(phrase),'teaching safeguard '+phrase);
 ok(block.includes('tabindex="0" role="region"'),'table keyboard scroll access');ok(block.includes('<caption>'),'table caption');ok(block.includes('scope="row"'),'table row headings');
 ok(block.includes('id="shape-log-worked" aria-labelledby="shape-log-heading"'),'section accessible name');
 ok((block.match(/<details class="visual-check"><summary>/g)||[]).length===2,'two native disclosures');
 ok(!/\bhidden\b|<script|<button/.test(block),'whole addition available without JavaScript');
}
const restored=source.replace(/<section class="shape-log-worked" id="shape-log-worked"[\s\S]*?<\/section>\n/,'');
ok(crypto.createHash('sha256').update(restored).digest('hex')==='b0d4035d0aeb62eaf6e54d1e3fecacd287cc1c85f16141ee615f655043e06493','all prior Class 1 source preserved byte for byte');
console.log(`Passed ${checks} log-transformation checks: independent arithmetic, production parity, inverse/ratios, geometric mean, no-guarantee example, source preservation, accessible static and built content.`);

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const near = (a,b) => ok(Math.abs(a-b)<1e-12, `${a} matches ${b}`);
const plain = s => s.replace(/<[^>]+>/g,'');
for (const dir of ['src','dist']) {
  const probability = fs.readFileSync(`${dir}/probability.html`,'utf8');
  const random = fs.readFileSync(`${dir}/random-variables.html`,'utf8');
  const paths = probability.slice(probability.indexOf('<h3 id="fourth-warehouse-paths"'),probability.indexOf('</details></div>',probability.indexOf('<h3 id="fourth-warehouse-paths"'))+16);
  const variance = random.slice(random.indexOf('<h3 id="fourth-shop-variance"'),random.indexOf('<p>Revenue R='));
  for (const [block,title] of [[paths,'warehouse mix'],[variance,'weights before averaging']]) {
    ok(block.length>500,'Worked exposition exists in '+dir);
    ok(block.includes(`<details><summary>Check the ${title}</summary><p>`),'Native feedback exists');
    ok(!/<script|<button|\bhidden\b/.test(block),'Explanation works without JavaScript');
  }
  for(const value of ['A’s orders','B’s orders','all orders','expected-count illustration','not a promise','joint probabilities','44/1,000','32/1,000','Neither warehouse became more reliable']) ok(paths.includes(value),'Warehouse interpretation: '+value);
  for(const value of ['possible count, not one observed slot','deviation','do not divide this sum by four','n − 1','25% weight','mean 1.5','not the variance of either model','does not guarantee']) ok(variance.includes(value),'Variance interpretation: '+value);
  ok(variance.includes('class="table-wrap table-scroll" tabindex="0" role="region"'), 'Variance table has keyboard scroll access');
  const table = variance.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
  const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  ok(rows.length===4,'All possible shop outcomes included');
  const data=rows.map(row=>[...row[1].matchAll(/<(?:td|th)(?: [^>]*)?>(.*?)<\/(?:td|th)>/g)].map(m=>plain(m[1])));
  const mean=data.reduce((s,r)=>s+Number(r[0])*Number(r[1]),0);near(mean,1.7);
  let varianceSum=0, unweighted=0, mass=0;
  for(const [x,p,dev,squared,weighted] of data){
    near(Number(dev.replace('−','-')),Number(x)-mean);
    near(Number(squared),(Number(x)-mean)**2);
    const parts=weighted.match(/^([\d.]+) × ([\d.]+) = ([\d.]+)$/);
    ok(parts,'Explicit multiplication in weighted column');
    near(Number(parts[1]),Number(p)); near(Number(parts[2]),Number(squared));
    near(Number(parts[3]),Number(p)*Number(squared));
    varianceSum+=Number(parts[3]);unweighted+=Number(squared);mass+=Number(p);
  }
  near(mass,1);near(varianceSum,.81);near(Math.sqrt(varianceSum),.9);near(unweighted,5.16);near(unweighted/4,1.29);
  const uniformMean=data.reduce((s,r)=>s+Number(r[0])/4,0);near(uniformMean,1.5);
  const uniformVariance=data.reduce((s,r)=>s+(Number(r[0])-uniformMean)**2/4,0);near(uniformVariance,1.25);
  for(const html of [probability,random]){
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    ok(ids.length===new Set(ids).size,'IDs remain unique in '+dir);
  }
}
// Independent expected-count enumeration checks both warehouse mixes.
for (const [a,b,lateA,lateB,rate] of [[600,400,12,32,.044],[800,200,16,16,.032]]) {
 near(a+b,1000);near(a*.02,lateA);near(b*.08,lateB);near((lateA+lateB)/1000,rate);
}
near((.02+.08)/2,.05);
console.log(`Fourth foundations review: ${checks} checks passed.`);

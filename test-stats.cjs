const assert = require('node:assert/strict');
const s = require('./dist/stats.js');
let checks=0;
function near(a,b){checks++;assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);}
function equal(a,b){checks++;assert.deepEqual(a,b);}
const d=s.describe([18,22,24,25,28,30,32,35,38,42,46,200]);near(d.mean,45);near(d.median,31);near(d.q1,24.25);near(d.q3,41);
let a=s.describe([1,2,3,4,5]);near(a.variance,2);near(a.sd,Math.sqrt(2));near(a.skew,0);near(a.excess,-1.3);near(a.q1,1.5);near(a.q3,4.5);equal(a.modes,[]);
a=s.describe([1,2,3,4,5],true);near(a.variance,2.5);near(a.excess,-1.2);near(a.sd,Math.sqrt(2.5));
near(s.quantile([1,2,3,4,5,6],.25,'exc'),1.75);near(s.quantile([1,2,3,4,5,6],.75,'inc'),4.75);
near(s.correlation([1,2,3,4,5],[4,7,6,4,9]),7/Math.sqrt(180));near(s.correlation([-2,-1,0,1,2],[4,1,0,1,4]),0);
equal(s.describe([5,5,5,5]).skew,null);equal(s.describe([5,5,5,5]).excess,null);equal(s.correlation([1,1,1],[2,3,4]),null);
equal(s.describe([1,2,2,3,3,4]).modes,[2,3]);equal(s.parseValues('1,2; 3 4'),[1,2,3,4]);
for(const t of ['1,2,3','1,2,foo,4','1,2,3,Infinity','1,2,3,1000001','']){checks++;assert.throws(()=>s.parseValues(t));}
near(s.describe([4,5,5,5,6]).sd,Math.sqrt(.4));near(s.describe([1,2,5,8,9]).sd,Math.sqrt(10));
near(5/[1,2,3,4,5].reduce((a,x)=>a+1/x,0),2.18978102189781);
near(s.describe([1,2,3,4,10]).skew,1.1384199576606167);near(s.describe([1,2,3,4,10],true).skew,1.697056274847714);
near(s.describe([1,2,3,4,15]).excess,0.06331360946745557);
near(s.describe([1,2,3,4,15],true).excess,4.253254437869821);
console.log(`Passed ${checks} arithmetic and input-validation assertions.`);

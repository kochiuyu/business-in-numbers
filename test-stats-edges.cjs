'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Stats=require('./src/stats.js');
let checks=0;
const ok=(v,message)=>{checks++;assert.ok(v,message);};
const near=(a,b)=>ok(Math.abs(a-b)<=1e-12*Math.max(Math.abs(b),1e-300),`${a} ~= ${b}`);
for(const value of [.1,.3,-.1,1e-100,0,1000000])for(const sample of [false,true]){
 const result=Stats.describe(Array(6).fill(value),sample);
 ok(result.mean===value,'Constant mean is exact');
 ok(result.sd===0&&result.variance===0,'Constant spread is zero');
 ok(result.skew===null&&result.excess===null,'Constant shape is undefined');
}
for(const scale of [1,1e-20,1e-80,1e-100,1e-150])for(const sample of [false,true]){
 const result=Stats.describe([1,2,3,4].map(x=>x*scale),sample);
 near(result.mean,2.5*scale);near(result.sd,Math.sqrt(sample?5/3:1.25)*scale);
 near(result.variance,(sample?5/3:1.25)*scale*scale);
 ok(Math.abs(result.skew)<1e-12,'Symmetric shape stays symmetric');
 near(result.excess,sample?-1.2:-1.36);
 near(result.cv,Math.sqrt(sample?5/3:1.25)/2.5*100);
}
for(const sample of [false,true]){
 checks++;assert.throws(()=>Stats.describe(Stats.parseValues('1e-200 2e-200 3e-200 4e-200'),sample),/Rescale/);
}
for(const sample of [false,true]){
 const d=Stats.describe([-1000000,-1000000,1000000,1000000],sample);
 near(d.variance,sample?4e12/3:1e12);near(d.mean,0);
}
const ordinary=Stats.describe([18,22,24,25,28,30,32,35,38,42,46,200]);
near(ordinary.mean,45);near(ordinary.median,31);near(ordinary.q1,24.25);near(ordinary.q3,41);
// Execute the complete app, including its startup calls and actual submit handler.
function app(hash){
 const nodes=new Map(),listeners={};
 function get(id){
  if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,handlers:{},classList:{toggle(){},remove(){}},addEventListener(k,f){this.handlers[k]=f;},setAttribute(){},focus(){}});
  return nodes.get(id);
 }
 const context={Stats,document:{getElementById:get,querySelectorAll:()=>[],body:{classList:{toggle(){}}}},window:{matchMedia:()=>({matches:false}),addEventListener(k,f){listeners[k]=f;}},location:{hash}};
 vm.runInNewContext(fs.readFileSync('src/app.js','utf8'),context);
 return {get,listeners,context};
}
for(const hash of ['','#%','#%E0%A4%A']){
 const {get,listeners}=app(hash);
 ok(get('order-chart').innerHTML.includes('<svg'),'Orders initialize despite malformed fragment');
 ok(get('scatter').innerHTML.includes('<svg'),'Correlation initializes despite malformed fragment');
 ok(get('quiz').innerHTML.includes('QUESTION 1'),'Quiz initializes despite malformed fragment');
 listeners.hashchange();
}
const {get,context}=app('');
get('custom-data').value='0.1 0.1 0.1 0.1 0.1 0.1';
get('custom-form').handlers.submit({preventDefault(){}});
ok(get('sd').textContent==='0','Constant custom SD is zero');
ok((get('shape-values').innerHTML.match(/Undefined/g)||[]).length===2,'UI shows both undefined shapes');
const priorChart=get('order-chart').innerHTML,priorShape=get('shape-values').innerHTML;
get('custom-data').value='1e-200 2e-200 3e-200 4e-200';
get('custom-form').handlers.submit({preventDefault(){}});
ok(get('data-error').textContent.includes('Rescale'),'UI offers actionable rescaling guidance');
ok(get('order-chart').innerHTML===priorChart&&get('shape-values').innerHTML===priorShape,'Rejected input retains last results');
vm.runInNewContext('update()',context);
ok(get('order-chart').innerHTML===priorChart,'Rejected input does not change committed data');
get('custom-data').value='1e-100 2e-100 3e-100 4e-100';
get('custom-form').handlers.submit({preventDefault(){}});
ok(get('data-error').textContent==='','Valid small data recover after rejection');
ok(!/NaN|Infinity/.test(get('shape-values').innerHTML+get('order-chart').innerHTML),'Small valid data render finite results');
console.log(`Stats edge regressions: ${checks} checks passed.`);

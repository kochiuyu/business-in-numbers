'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ref=require('./test-class5-restructure-reference.json');
const source=fs.readFileSync('src/estimation.html','utf8'),built=fs.readFileSync('dist/estimation.html','utf8');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=["estimation-step-1","estimation-step-2","estimation-efficiency","estimation-consistency","estimation-step-3","estimation-standard-error","estimation-step-4","estimation-rate-error","estimation-step-5","estimation-step-6","estimation-step-7","estimation-step-8","estimation-step-9","estimation-rate-plan","estimation-step-10"];
const cores=["target","bias","efficiency","quality","spread","standarderror","binaryvariance","binary","interval","coverage","student","proportion","planning","rateplanning","decision"];
function parse(html){
 const nodes=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  if(m[0].startsWith('<!'))continue;
  if(m[0].startsWith('</')){const n=stack.pop();assert.equal(n?.tag,m[1].toLowerCase(),'balanced closing '+m[1]);n.end=m.index+m[0].length;continue;}
  const attrs={};for(const a of m[0].matchAll(/([\w:-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
  const n={tag:m[1].toLowerCase(),attrs,parent:stack.at(-1),start:m.index,end:m.index+m[0].length};nodes.push(n);
  if(!voids.has(n.tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 assert.equal(stack.length,0);return{nodes,byId:id=>nodes.find(n=>n.attrs.id===id),fragment:n=>html.slice(n.start,n.end)};
}
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c),ancestors=n=>{const out=[];for(let p=n.parent;p;p=p.parent)out.push(p);return out;};
const baseline=require('./scripts/class-five-preservation.cjs').restore(source);
const old=parse(baseline);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical')))ok(source.includes(old.fragment(n)),'original complete topic/technical section retained '+(n.attrs.id||''));
for(const kind of ['math','estpython','estoutput'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),'original tokens retained '+kind);
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy anchor '+id);
for(const [name,html]of [['source',source],['built',built]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c5-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+' semantic route');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const[i,part]of parts.entries()){
  const alias=t.byId('class5-step-'+(i+1));ok(alias&&ancestors(alias).includes(part),name+' canonical alias '+(i+1));
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class5-step-'+(i+1)),name+' reachable step '+(i+1));
  if(name==='built'){
   const core=t.byId('c5-core-'+cores[i]);ok(core&&ancestors(core).includes(part),name+' core in correct step '+cores[i]);
   ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' core visible without disclosure '+cores[i]);
  }
 }
 if(name==='built')ok(!/\{\{(?:estvisual|estpython|estoutput|math|activity):|katex-error/.test(html),'no unresolved teaching templates');
}
const t=parse(built);

const claims={target:['250/5 = $50','unknown parameter'],bias:['linearity','+$2'],efficiency:['2.5','1.5811','fixed linear unbiased'],quality:['min(1, 16/n)','5.44 dollars²','1.4544 dollars²','in probability'],spread:['40/(5−1)','10 dollars²','does not discard'],standarderror:['$3.16','$1.41','neither S nor S/√n'],binaryvariance:['36.48','183317','individual-outcome variances'],binary:['.000912','.030199','percentage points','.000916583'],interval:['$3.92','$7.84','justified CLT'],coverage:['$4.70','exactly 19'],student:['42.74–51.26','15','IID normal'],proportion:['18.08%–29.92%','1.88%'],planning:['138.2925','139','553.1701','554'],rateplanning:['437.9263','438','600.2279','601','not exact coverage'],decision:['$1.92','does not establish']};
for(const[id,needles]of Object.entries(claims)){const f=t.fragment(t.byId('c5-core-'+id)).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');for(const text of needles)ok(f.includes(text),'visible calculation and condition '+id+' '+text);}
const near=(a,b,tol=1e-9)=>ok(Math.abs(a-b)<tol,`independent arithmetic ${a} = ${b}`);
near(144/100+4,5.44);near(144/100+(12/100)**2,1.4544);near(144/(3**2),16);near((1/2)/(1/5),2.5);near(Math.sqrt(10)/Math.sqrt(5),Math.sqrt(2));
near(48*.76**2+152*.24**2,36.48);near(.24*.76,.1824);near(36.48/199,.18331658291457287);near(.24*.76/200,.000912);near(.24*.76/199,.0009165829145728643);near(Math.sqrt(.000912),.030199337741083);
const z=1.959963984540054;
for(const[sd,margin,n]of [[18,3,139],[18,1.5,554]]){eq(Math.ceil((z*sd/margin)**2),n);ok(z*sd/Math.sqrt(n)<=margin&&z*sd/Math.sqrt(n-1)>margin,'minimal mean sample');}
for(const[p,n]of [[.24,438],[.5,601]]){eq(Math.ceil(z*z*p*(1-p)/.04**2),n);ok(z*Math.sqrt(p*(1-p)/n)<=.04&&z*Math.sqrt(p*(1-p)/(n-1))>.04,'minimal rate sample');}
for(const[id,step]of [['estimator',1],['properties',2],['mean-estimator',3],['variance-estimator',5],['binary',7],['known-variance',9],['confidence',10],['unknown-variance',11],['proportion-interval',12],['plan-mean',13],['plan-proportion',14],['plan-lab',14],['tools',15],['practice',15]])ok(ancestors(t.byId(id)).includes(t.byId(expected[step-1])),'legacy subject destination '+id);
const commentTokens=s=>[...s.matchAll(/<!-- depth48:[^>]+ -->/g)].map(m=>m[0]).sort();eq(commentTokens(source),commentTokens(baseline),'all original depth marker comments');
for(const n of old.nodes.filter(n=>n.tag==='a'&&n.attrs.href))ok(source.includes('href="'+n.attrs.href.replaceAll('index.html','descriptive-statistics.html')+'"')||/^#estimation-step-/.test(n.attrs.href),'original linked resource retained '+n.attrs.href);
console.log(`Passed ${checks} Class 5 fifteen-step route, topic and formula preservation, visible arithmetic, independent math and deep-link checks.`);

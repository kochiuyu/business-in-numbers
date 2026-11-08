'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ref=require('./test-class3-restructure-reference.json');
const source=fs.readFileSync('src/random-variables.html','utf8'),built=fs.readFileSync('dist/random-variables.html','utf8');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=['rv-step-1','rv-step-2','rv-cdf','rv-step-3','rv-variance','rv-step-4','rv-covariance','rv-step-5','rv-arrivals','rv-step-6','rv-waits','rv-step-7','rv-quantiles','rv-step-8','rv-step-9'];
const cores=['mapping','pmf','cdf','expectation','variance','jointtable','covariance','finitecounts','arrivals','density','waits','normalprobability','quantile','families','decision'];
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
const baseline=require('./scripts/class-three-preservation.cjs').restore(source);
const old=parse(baseline);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical')))ok(source.includes(old.fragment(n)),'original complete topic/technical section retained '+(n.attrs.id||''));
for(const kind of ['math','rvpython','rvoutput'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),'original tokens retained '+kind);
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy anchor '+id);
for(const [name,html]of [['source',source],['built',built]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c3-part'));
 eq(parts.map(n=>n.attrs.id),name==='built'?[...expected.slice(0,13),'rv-step-9','rv-step-8']:expected,name+' semantic route');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const[i,part]of parts.entries()){
  const originalIndex=expected.indexOf(part.attrs.id);const alias=t.byId('class3-step-'+(originalIndex+1));ok(alias&&ancestors(alias).includes(part),name+' canonical alias '+(i+1));
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class3-step-'+(i+1)),name+' reachable step '+(i+1));
  if(name==='built'){
   const core=t.byId('c3-core-'+cores[originalIndex]);ok(core&&ancestors(core).includes(part),name+' core in correct step '+cores[i]);
   ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' core visible without disclosure '+cores[i]);
  }
 }
 if(name==='built')ok(!/\{\{(?:rvvisual|rvpython|rvoutput|math|activity):|katex-error/.test(html),'no unresolved teaching templates');
}
const t=parse(built);
const claims={pmf:['0.10 + 0.30 + 0.40 + 0.20 = 1','p(2) = 0.40'],cdf:['F(2) = 0.10 + 0.30 + 0.40 = 0.80','1 − F(1) = 0.60','F(1.5) = 0.40'],expectation:['1.70 orders','even without independence'],variance:['0.289 + 0.147 + 0.036 + 0.338 = 0.810','3.70 − 2.89 = 0.81','|b|SD(X)'],jointtable:['0.25/0.50 = 0.50','0.45, 0.05, 0.05 and 0.45'],covariance:['q − 0.25','= 2q','not'],finitecounts:['0.2581','0.4197','0.8369'],arrivals:['0.1804','0.6767','0.3233','separate teaching models'],density:['2 × 0.25 = 0.50','P(T = 0.25) = 0'],waits:['1/3','0.3679','0.6321','λ = 60 × 0.1 = 6'],normalprobability:['0.1587','0.6827','√16 = 4 mL'],quantile:['1.644854','506.5794 mL','[492.16, 507.84] mL'],families:['ν &gt; 1','ν &gt; 2','numerator m and denominator n'],decision:['0.20 × $30 = $6','$40 per excess order','max(E[X] − 2, 0) = 0']};
for(const[id,needles]of Object.entries(claims)){const fragment=t.fragment(t.byId('c3-core-'+id)).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');for(const text of needles)ok(fragment.includes(text),'visible arithmetic/condition '+id+' '+text);}
const near=(a,b,tol=1e-12)=>ok(Math.abs(a-b)<tol,`independent arithmetic: ${a} = ${b}`),factorial=n=>n<2?1:n*factorial(n-1),choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const p=[.1,.3,.4,.2],mean=p.reduce((s,v,i)=>s+v*i,0),variance=p.reduce((s,v,i)=>s+v*(i-mean)**2,0);near(mean,1.7);near(variance,.81);near(Math.sqrt(variance),.9);near(p.reduce((s,v,i)=>s+v*i*i,0),3.7);
for(const q of [.05,.25,.45]){const cells=[q,.5-q,.5-q,q];near(cells.reduce((a,b)=>a+b),1);near(cells[0]+cells[1],.5);near(cells[0]+cells[2],.5);const esq=cells[1]+cells[2]+4*q;near(esq-1,2*q);near(q-.25+q-.25+.5,2*q);}
near(choose(12,3)*.25**3*.75**9,.258103609085083);near(choose(8,1)*choose(32,5)/choose(40,6),.4197103986577671);near(6*.2*.8*34/39,.8369230769230769);near(Math.exp(-2)*8/6,.1804470443154836);near(Math.exp(-2)*5,.6766764161830635);near(1-Math.exp(-2)*5,.3233235838169365);near(Math.exp(-1.8)/Math.exp(-.8),Math.exp(-1));near(500+4*1.6448536269514722,506.5794145078059);near(500+4*1.959963984540054,507.8398559381602);near(.2*30,6);near(8/.2,40);
for(const [id,step]of [['variables',1],['mass-cdf',3],['moments',5],['joint',7],['discrete-models',8],['count-proofs',9],['count-lab',9],['density',10],['wait-models',11],['normal',12],['normal-foundations',12],['continuous-lab',13],['inference-families',14],['tools',15],['practice',15]])ok(ancestors(t.byId(id)).includes(t.byId(expected[step-1])),'legacy subject destination '+id);
console.log(`Passed ${checks} Class 3 fifteen-step route, original detail preservation, visible arithmetic, independent math and deep-link placement checks.`);

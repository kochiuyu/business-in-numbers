'use strict';
// Test the delivered twelve-step lesson as well as exact historical preservation.
const fs=require('node:fs'),assert=require('node:assert/strict');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const read=p=>fs.readFileSync(p,'utf8'),source=read('src/index.html');
const original=require('./scripts/class-one-twelve-preservation.cjs').restore(source);
const expected=['case-part-1','case-part-2','case-median','case-mode','case-part-4','case-part-3','case-sd-cv','case-skewness','case-kurtosis','case-covariance','case-part-5','case-part-6'];
const topics=['records','mean','median','mode','quartiles','variance','sd-cv','skewness','kurtosis','covariance','correlation','briefing'];
function parse(html){
 const nodes=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  if(m[0].startsWith('<!'))continue;
  if(m[0].startsWith('</')){const n=stack.pop();assert.equal(n.tag,m[1].toLowerCase());n.end=m.index+m[0].length;continue;}
  const attrs={};for(const a of m[0].matchAll(/([\w:-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
  const n={tag:m[1].toLowerCase(),attrs,parent:stack.at(-1),start:m.index,end:m.index+m[0].length};nodes.push(n);
  if(!voids.has(n.tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 assert.equal(stack.length,0);return{nodes,byId:id=>nodes.find(n=>n.attrs.id===id),fragment:n=>html.slice(n.start,n.end)};
}
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c);
const ancestors=n=>{const out=[];for(let p=n.parent;p;p=p.parent)out.push(p);return out;};

const attrs=(html,name)=>[...html.matchAll(new RegExp('\\b'+name+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(original,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'original ID retained once '+id);
eq([...source.matchAll(/\{\{math:([^}]+)\}\}/g)].map(m=>m[1]).sort(),[...original.matchAll(/\{\{math:([^}]+)\}\}/g)].map(m=>m[1]).sort(),'original mathematical placeholders unchanged');
const leaves=html=>{const m=new Map();for(const s of html.split(/<[^>]*>/).map(x=>x.trim()).filter(Boolean))m.set(s,(m.get(s)||0)+1);return m;};
const before=leaves(original),after=leaves(source),missing={};for(const [s,n]of before)if(n>(after.get(s)||0))missing[s]=n-(after.get(s)||0);
const reference=JSON.parse(read('test-class1-twelve-reference.json'));
eq(missing,reference.reviewed_changed_leaves,'only reviewed heading, navigation and local-reference text changes');
for(const [name,html]of [['source',source],['built',read('dist/index.html')]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'case-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+' twelve semantic steps');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const [i,part]of parts.entries()){
  const alias=t.byId('class1-'+topics[i]);ok(alias&&ancestors(alias).includes(part),name+' semantic alias '+topics[i]);
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class1-'+topics[i]),name+' reachable semantic step '+topics[i]);
  eq(t.nodes.filter(n=>has(n,'lesson')&&ancestors(n).includes(part)).length,1,name+' one optional topic '+topics[i]);
  ok(t.nodes.some(n=>n.tag==='details'&&!has(n,'lesson')&&ancestors(n).includes(part)&&!ancestors(n).some(p=>has(p,'lesson'))),name+' learner-controlled check '+topics[i]);
 }
 for(const [i,position]of [0,1,4,5,7,8,10,11].entries())ok(ancestors(t.byId('class1-step-'+(i+1))).includes(parts[position]),name+' stable old numbered alias '+(i+1));
 if(name==='built')ok(!/\{\{(?:math|classonevisual|activity):|katex-error/.test(html),'built teaching renders without unresolved formulas');
}
eq(require('./scripts/activities.cjs').data().filter(a=>a.file==='index.html').map(a=>[a.id,a.afterTopic]),[['c1-measurements',1],['c1-weighted-orders',2],['c1-change-units',7],['c1-preserve-pairs',11]],'practice remains with matching subject');
// Independent original-record arithmetic protects the lesson's numerical claims.
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-12,m),sum=xs=>xs.reduce((a,b)=>a+b,0),mean=xs=>sum(xs)/xs.length;
const orders=[18,22,24,25,28,30,32,35,38,42,46,200];
eq(sum(orders),540,'order revenue');eq(mean(orders),45,'arithmetic mean');eq((orders[5]+orders[6])/2,31,'even-count median');eq(new Set(orders).size,orders.length,'no repeated mode');
const modeCounts=new Map();for(const v of [10,10,20,20,30])modeCounts.set(v,(modeCounts.get(v)||0)+1);const maxFrequency=Math.max(...modeCounts.values());eq([...modeCounts].filter(([,n])=>n===maxFrequency).map(([v])=>v),[10,20],'tied modes are observed values, not their average');
const A=[4,5,5,5,6],B=[1,2,5,8,9],ss=xs=>sum(xs.map(x=>(x-mean(xs))**2));
eq(mean(A),5,'supplier A mean');eq(mean(B),5,'supplier B mean');eq(ss(A),2,'supplier A squared deviations');eq(ss(B),50,'supplier B squared deviations');
near(ss(A)/5,.4,'population variance A');eq(ss(B)/5,10,'population variance B');near(ss(A)/4,.5,'sample variance A');eq(ss(B)/4,12.5,'sample variance B');
eq(Math.sqrt(ss(A)/5).toFixed(4),'0.6325','population SD A');eq(Math.sqrt(ss(B)/5).toFixed(4),'3.1623','population SD B');eq((Math.sqrt(ss(A)/5)/5*100).toFixed(2),'12.65','population CV A');eq((Math.sqrt(ss(B)/5)/5*100).toFixed(2),'63.25','population CV B');
const x=[1,2,3,4,5],y=[4,7,6,4,9],products=x.map((v,i)=>(v-mean(x))*(y[i]-mean(y)));
eq(mean(x),3,'advertising mean');eq(mean(y),6,'sales mean');eq(products,[4,-1,0,-2,6],'paired deviation products');eq(sum(products),7,'cross-product total');eq(sum(products)/5,1.4,'population covariance');eq(sum(products)/4,1.75,'sample covariance');eq(ss(x),10,'advertising squared deviations');eq(ss(y),18,'sales squared deviations');eq((sum(products)/Math.sqrt(ss(x)*ss(y))).toFixed(4),'0.5217','Pearson correlation');
near((sum(products)/5)/Math.sqrt((ss(x)/5)*(ss(y)/5)),(sum(products)/4)/Math.sqrt((ss(x)/4)*(ss(y)/4)),'consistent population/sample conventions give identical correlation');
const historicalTree=parse(original);
for(const node of historicalTree.nodes.filter(n=>has(n,'technical')))ok(source.includes(historicalTree.fragment(node)),'original technical section retained byte for byte '+(node.attrs.id||node.attrs.class));
for(const [name,html]of [['source',source],['built',read('dist/index.html')]]){
 const t=parse(html);
 const claims={
  'mean-core':[1,['$540 ÷ 12 = $45','12 × $45 = $540','not twelve new observed purchases','$390 ÷ 12 = $32.50']],
  'median-core':[2,['positions 6 and 7','($30 + $32) ÷ 2 = $31','does not reconstruct','not a rule that the median never changes']],
  'mode-core':[3,['no repeated mode','$10, $10, $20, $20, $30','Do not average them into $15','most common payment method']],
  'variance-core':[5,['2 days²','50 days²','0.4 days²','10 days²','2/4=0.5 days²','50/4=12.5 days²','cannot fix unrepresentative data']],
  'sd-cv-core':[6,['0.6325 days','3.1623 days','5 times','12.65%','63.25%','120 hours','15.18 hours','unstable near zero','Celsius']],
  'covariance-core':[9,['paired deviations','units of x multiplied by the units of y']],
  'case-pairs-worked':[9,['products total 7','1.4','multiplied units']],
  'covariance-check':[9,['1.4','1.75','1400','magnitude depends on measurement scales']],
  'correlation-core':[10,['0.5217','unit-free','undefined','not zero','Do not mix a sample covariance with population SDs']]
 };
 const parts=t.nodes.filter(n=>has(n,'case-part'));
 for(const [id,[position,needles]]of Object.entries(claims)){
  const core=t.byId(id);ok(core,name+' worked teaching '+id);ok(ancestors(core).includes(parts[position]),name+' own step '+id);
  ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' visible without disclosures '+id);
  const text=t.fragment(core).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  for(const needle of needles)ok(text.includes(needle),name+' visible arithmetic/caveat '+id+': '+needle);
  if(['covariance-core','case-pairs-worked'].includes(id))continue;
  const check=t.nodes.find(n=>n.tag==='details'&&ancestors(n).includes(core));ok(check,name+' deliberate self-check '+id);ok(!/\sopen(?:[\s=>])/.test(t.fragment(check).split('>')[0]+'>'),name+' answer starts collapsed '+id);
 }
}
console.log(`Passed ${checks} delivered twelve-step topology, independent arithmetic, visible teaching and content-preservation assertions.`);

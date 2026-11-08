'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/hypothesis-testing.html','utf8'),built=fs.readFileSync('dist/hypothesis-testing.html','utf8');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=['hypothesis-step-1','hypothesis-step-2','hypothesis-power','hypothesis-statistic','hypothesis-step-3','hypothesis-step-4','hypothesis-student','hypothesis-step-5','hypothesis-step-6','hypothesis-step-7','hypothesis-pooled','hypothesis-step-8','hypothesis-step-9','hypothesis-step-10','hypothesis-step-11','hypothesis-step-12','hypothesis-tools'];
const cores=['claim','errors','power','statistic','tails','known','student','interval','proportion','design','pooled','independent','paired','twoprop','variance','decision','tools'];
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
const baseline=require('./scripts/class-six-preservation.cjs').restore(source),old=parse(baseline);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical')))ok(source.includes(old.fragment(n)),'original complete topic/technical section retained '+(n.attrs.id||''));
for(const kind of ['math','hyppython','hypoutput'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),'original tokens retained '+kind);
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy anchor '+id);
for(const [name,html]of [['source',source],['built',built]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c6-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+' semantic route');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const[i,part]of parts.entries()){
  const alias=t.byId('class6-step-'+(i+1));ok(alias&&ancestors(alias).includes(part),name+' canonical alias '+(i+1));
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class6-step-'+(i+1)),name+' reachable step '+(i+1));
  if(name==='built'){
   const core=t.byId('c6-core-'+cores[i]);ok(core&&ancestors(core).includes(part),name+' core in correct step '+cores[i]);
   ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' core visible without disclosure '+cores[i]);
   ok(t.fragment(core).includes('<ol>')&&t.fragment(core).includes('<summary>Check'),'visible worked sequence and learner check '+cores[i]);
  }
 }
 if(name==='built')ok(!/\{\{(?:hypvisual|hyppython|hypoutput|math|activity):|katex-error/.test(html),'no unresolved teaching templates');
}
const t=parse(built);
const claims={claim:['μ ≤ 24','before collecting'],errors:['50 false alarms','361 misses','not one table'],power:['51.64485','−.35515','.88171'],statistic:['z ≥ 1.64485','|z| ≥ 1.95996','Before seeing'],tails:['.02275','.04550','.97725'],known:['50.35515','genuinely known','justified CLT'],student:['15','.06395','.03197','exact t'],interval:['49.86855','50.24695','no upper bound'],proportion:['50 successes','150 failures','.030619','8 percentage points'],design:['54 observations','eight matched','2Cov'],pooled:['3177/52','61.09615','2.14061','.16701'],independent:['4.2²','50.51468','−7.11528','approximate t'],paired:['20/7','.597614','5.01996','normal differences'],twoprop:['.027166','.027083','.006918','not guaranteed'],variance:['2.327271','.05966','.444444','nonnormality'],decision:['[−.5, .5]','[−3, 5]','equivalence or causation'],tools:['T.DIST.RT(2,15)','T.DIST.2T(ABS(2),15)','.9680275','scipy.stats.t.sf']};
for(const[id,needles]of Object.entries(claims)){const f=t.fragment(t.byId('c6-core-'+id)).replace(/<[^>]*>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/\s+/g,' ');for(const text of needles)ok(f.includes(text),'visible calculation and condition '+id+' '+text);}
const near=(a,b,tol=1e-8)=>ok(Math.abs(a-b)<tol,`independent arithmetic ${a} = ${b}`);
near(8/Math.sqrt(64),1);near(50+1.644853626951468,51.64485362695147);near(50+1.644853626951468*8/Math.sqrt(128),51.16308715367667);near(52-1.7530503556925547,50.24694964430745);near(Math.sqrt(.25*.75/200),.030618621784789725);
near((23*36+29*81)/52,61.09615384615385);near(Math.sqrt((3177/52)*(1/24+1/30)),2.140610085574096);near(4.2**2/(1.5**2/23+2.7**2/29),50.514683153013905);near(Math.sqrt(20/7/8),.5976143046671968);near((84+60)/800,.18);near(Math.sqrt(.18*.82*(1/400+1/400)),.027166155414412252);near(Math.sqrt(.21*.79/400+.15*.85/400),.02708320512790168);near(6**2/4**2,2.25);
for(const[id,step]of [['hypotheses',1],['errors-power',2],['testing-quantile-bridge',4],['testing-procedure',5],['known-variance',6],['unknown-variance',7],['mean-lab',7],['test-and-interval',8],['one-proportion',9],['two-sample-design',10],['pooled-means',11],['welch-means',12],['paired-means',13],['two-proportions',14],['variance-ratio',15],['reporting',16],['tools',17]])ok(ancestors(t.byId(id)).includes(t.byId(expected[step-1])),'legacy subject destination '+id);
const commentTokens=s=>[...s.matchAll(/<!-- DEPTH48:[^>]+ -->/g)].map(m=>m[0]).sort();eq(commentTokens(source),commentTokens(baseline),'all original depth marker comments');
for(const n of old.nodes.filter(n=>n.tag==='a'&&n.attrs.href))ok(source.includes('href="'+n.attrs.href.replaceAll('index.html','descriptive-statistics.html')+'"')||/^#hypothesis-step-/.test(n.attrs.href),'original linked resource retained '+n.attrs.href);
console.log(`Passed ${checks} Class 6 seventeen-step route, topic and formula preservation, visible arithmetic, independent math and deep-link checks.`);

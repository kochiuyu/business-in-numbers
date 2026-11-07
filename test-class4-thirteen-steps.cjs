'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ref=require('./test-class4-restructure-reference.json');
const source=fs.readFileSync('src/sampling-distributions.html','utf8'),built=fs.readFileSync('dist/sampling-distributions.html','utf8');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=["sampling-step-1", "sampling-step-2", "sampling-center", "sampling-step-3", "sampling-step-4", "sampling-step-5", "sampling-step-6", "sampling-step-7", "sampling-count-event", "sampling-step-8", "sampling-student", "sampling-step-9", "sampling-step-10"];
const cores=["design", "pairs", "center", "precision", "lln", "clt", "known", "binary", "proportion", "scale", "student", "diagnosis", "decision"];
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
const baseline=require('./scripts/class-four-preservation.cjs').restore(source);
const old=parse(baseline);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical')))ok(source.includes(old.fragment(n)),'original complete topic/technical section retained '+(n.attrs.id||''));
for(const kind of ['math','sampython','samoutput'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),'original tokens retained '+kind);
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy anchor '+id);
for(const [name,html]of [['source',source],['built',built]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c4-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+' semantic route');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const[i,part]of parts.entries()){
  const alias=t.byId('class4-step-'+(i+1));ok(alias&&ancestors(alias).includes(part),name+' canonical alias '+(i+1));
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class4-step-'+(i+1)),name+' reachable step '+(i+1));
  if(name==='built'){
   const core=t.byId('c4-core-'+cores[i]);ok(core&&ancestors(core).includes(part),name+' core in correct step '+cores[i]);
   ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' core visible without disclosure '+cores[i]);
  }
 }
 if(name==='built')ok(!/\{\{(?:samvisual|sampython|samoutput|math|activity):|katex-error/.test(html),'no unresolved teaching templates');
}
const t=parse(built);
const claims={center:['180/9 = $20','Equal means are enough','not that each estimate is correct'],precision:['5.76 minutes²','2.4 minutes','nσ²/n²'],lln:['min(1, 16/n)','at least .84','not the exact probability'],clt:['(14.4 − 12)/1.2 = 2','finite-positive-variance'],binary:['.002625','5.12 percentage points','no normal approximation'],proportion:['19.5','13.52%'],scale:['752/16','960/(16 − 1) = 64','64/16 = 4','8/4 = 2','Neither S nor S/√n'],student:['df = 15','1.753','2.131','.0772','not t'],diagnosis:['does not prove normality','validates independence']};
for(const[id,needles]of Object.entries(claims)){const fragment=t.fragment(t.byId('c4-core-'+id)).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');for(const text of needles)ok(fragment.includes(text),'visible calculation and condition '+id+' '+text);}
const near=(a,b,tol=1e-10)=>ok(Math.abs(a-b)<tol,`independent arithmetic: ${a} = ${b}`);
const means=[10,15,20,25,30],weights=[1,2,3,2,1];near(means.reduce((s,x,i)=>s+x*weights[i]/9,0),20);near(means.reduce((s,x,i)=>s+(x-20)**2*weights[i]/9,0),100/3);
const rows=[[35,2],[39,2],[43,4],[51,4],[55,2],[59,2]],n=rows.reduce((s,r)=>s+r[1],0),sum=rows.reduce((s,[x,f])=>s+x*f,0),mean=sum/n,ss=rows.reduce((s,[x,f])=>s+f*(x-mean)**2,0);near(n,16);near(sum,752);near(mean,47);near(ss,960);near(ss/(n-1),64);near(Math.sqrt(ss/(n-1))/Math.sqrt(n),2);near((47-50)/2,-1.5);near(.3*.7/80,.002625);near(Math.sqrt(.002625)*100,5.123475382979799);near(144/25,5.76);near(16/100,.16);
for(const[id,step]of [['sampling',1],['statistics',2],['mean-and-se',4],['lln',5],['clt',6],['known-sigma',7],['proportions',8],['binomial-approximation',9],['unknown-sigma',10],['student-t',11],['diagnostics',12],['tools',13],['practice',13]])ok(ancestors(t.byId(id)).includes(t.byId(expected[step-1])),'legacy subject destination '+id);
console.log(`Passed ${checks} Class 4 thirteen-step route, original-detail preservation, visible arithmetic, independent math and deep-link checks.`);

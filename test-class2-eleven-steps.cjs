'use strict';
// Check the delivered route, not the historical-layout restoration used by older tests.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const reference=require('./test-class2-restructure-reference.json');
const read=p=>fs.readFileSync(p,'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=['prob-step-1','prob-step-2','prob-step-3','prob-independence','prob-step-4','prob-step-5','prob-odds','prob-step-6','prob-sequential','prob-step-7','prob-step-8'];
function parse(html){
 const nodes=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  if(m[0].startsWith('<!'))continue;
  if(m[0].startsWith('</')){const n=stack.pop();assert.equal(n?.tag,m[1].toLowerCase(),'balanced HTML closing '+m[1]);n.end=m.index+m[0].length;continue;}
  const attrs={};for(const a of m[0].matchAll(/([\w:-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
  const n={tag:m[1].toLowerCase(),attrs,parent:stack.at(-1),start:m.index,end:m.index+m[0].length};nodes.push(n);
  if(!voids.has(n.tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 assert.equal(stack.length,0);return{nodes,byId:id=>nodes.find(n=>n.attrs.id===id),fragment:n=>html.slice(n.start,n.end)};
}
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c);
const ancestors=n=>{const out=[];for(let p=n.parent;p;p=p.parent)out.push(p);return out;};
const baseline=reference.original_source,source=read('src/probability.html');
eq(hash(baseline),reference.baseline_sha256,'trusted pre-restructure source snapshot');
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
const counts=xs=>{const m=new Map();for(const x of xs)m.set(x,(m.get(x)||0)+1);return m;};
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy ID remains once: '+id);
for(const attr of ['href','src']){const before=counts(attrs(baseline,attr)),after=counts(attrs(source,attr));for(const [value,count]of before)if(!/^#prob-step-[1-8]$/.test(value))ok((after.get(value)||0)>=count,'retained '+attr+' '+value);}
for(const kind of ['math','probpython','proboutput','activity'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+':([^}]+)\\}\\}','g'))].map(m=>m[1]).sort(),'all original '+kind+' placeholders unchanged');
for(const [file,digest]of Object.entries(reference.unchanged_files)){let text=read(file);if(file==='scripts/activities-foundations.cjs')text=text.replace("id: 'c2-mix-rates', file: 'probability.html', afterTopic: 6,","id: 'c2-mix-rates', file: 'probability.html', afterTopic: 5,");eq(hash(text),digest,'original computation/data/exercises unchanged except semantic placement: '+file);}
// Exact source slices retain technical markup, datasets, formulas and text even when moved.
const old=parse(baseline),current=parse(source);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical'))){const fragment=old.fragment(n);ok(source.includes(fragment),'complete original '+(n.attrs.id||n.attrs.class)+' disclosure retained byte for byte');}
const leafCounts=s=>counts(s.split(/<[^>]*>/).map(t=>t.trim()).filter(Boolean));
const before=leafCounts(baseline),after=leafCounts(source),missing={};for(const [leaf,n]of before){const delta=n-(after.get(leaf)||0);if(delta>0)missing[leaf]=delta;}
eq(missing,reference.reviewed_changed_leaves,'all historical teaching text retained except explicitly reviewed navigation changes');
for(const [name,html]of [['source',source],['built',read('dist/probability.html')]]){
 if(name==='built')ok(!/\{\{(?:probvisual|probpython|proboutput|math|activity):|katex-error/.test(html),'all rendering tokens expand without errors');
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c2-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+': eleven semantic steps');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+': unique anchors');
 for(const [i,part]of parts.entries()){
  const alias=t.byId('class2-step-'+(i+1));ok(alias&&ancestors(alias).includes(part),name+': canonical alias belongs to intended section');
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class2-step-'+(i+1)),name+': canonical step reachable');
 }
 for(const [id,index]of [['foundation-event-relationship',3],['c2-odds-parts',6],['c2-count-allowed',8]])ok(ancestors(t.byId(id)).includes(parts[index]),name+': moved optional content '+id);
 if(name==='built')for(const [id,index]of [['outcomes',0],['overlap',1],['condition',2],['independence',3],['paths',4],['odds-first',6],['repeated',7],['sequential',8],['counting',9],['brief',10]]){
  const core=t.byId('c2-core-'+id);ok(core,name+': worked arithmetic '+id);ok(ancestors(core).includes(parts[index]),name+': arithmetic in proper step');ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+': essential arithmetic visible without optional disclosure');
 }
}

const delivered=parse(read('dist/probability.html'));
const visibleClaims={
 outcomes:['3 favorable outcomes','1/2 = 50%','four labels do not imply four equal shares'],
 overlap:['3/6 + 3/6 − 2/6 = 4/6 = 2/3','0.3 &gt; 0.2','[0, 0.2]'],
 condition:['15/80 = 18.75%','15/40 = 37.5%','15/35 ≈ 42.86%','must be positive'],
 independence:['1/4 = (1/2) × (1/2)','0 ≠ (1/2) × (1/2)','0.25 ≠ 0.6 × 0.5 = 0.30','0.25, 0.35, 0.25 and 0.15'],
 paths:['0.01 × 0.90 = 0.009','0.99 × 0.05 = 0.0495','0.0585 = 5.85%','585 expected alerts'],
 'odds-first':['40/60 = 2/3','0.80/0.40 = 2','4/(4 + 3) = 4/7 ≈ 57.14%','32/56 = 4/7'],
 repeated:['conditionally independent within each true state','8/(8 + 3) = 8/11 ≈ 72.73%','0.256/0.352 = 8/11','same report again has multiplier 1'],
 sequential:['2 × 9 = 2 × 3 × 3 = 18','2 × (3 + 3 + 2) = 16','18 − 2 forbidden','does not require equally likely choices'],
 counting:['60 assignments','6 assignments','10 teams','nCr = nPr/r!'],
 brief:['90/585','15.38%','585/10,000','5.85%']
};
for(const [id,claims]of Object.entries(visibleClaims)){const text=delivered.fragment(delivered.byId('c2-core-'+id)).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');for(const claim of claims)ok(text.includes(claim),'visible worked arithmetic/caveat '+id+': '+claim);}
const near=(a,b)=>ok(Math.abs(a-b)<1e-12,`${a} agrees with independent oracle ${b}`);
const coins=['HH','HT','TH','TT'],both=coins.filter(c=>c[0]==='H'&&c[1]==='H');near(both.length/coins.length,.25);near(both.length/coins.filter(c=>c[1]==='H').length,.5);
near(.25+.35+.25+.15,1);near(.25+.35,.6);near(.25+.25,.5);ok(.25!==.6*.5,'valid dependent overlapping counterexample');
near(.01*.9+.99*.05,.0585);near(.009/.0585,2/13);near((.4*.8)/(.4*.8+.6*.4),4/7);near((.4*.8**2)/(.4*.8**2+.6*.4**2),8/11);
const meals=[];for(let base=0;base<2;base++)for(let protein=0;protein<3;protein++)for(let sauce=0;sauce<3;sauce++)meals.push({base,protein,sauce});eq(meals.length,18);eq(meals.filter(m=>!(m.protein===2&&m.sauce===2)).length,16);
const assignments=[],teams=new Set();for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let c=0;c<5;c++)if(new Set([a,b,c]).size===3){assignments.push([a,b,c]);teams.add([a,b,c].sort().join(','));}eq(assignments.length,60);eq(teams.size,10);

const activities=require('./scripts/activities.cjs').data().filter(a=>a.file==='probability.html');
eq(activities.map(a=>[a.id,a.afterTopic]),[['c2-language-events',2],['c2-mix-rates',6],['c2-negative-alert',7],['c2-distinct-roles',9]],'activities follow semantic topics after independence move');
console.log(`Passed ${checks} Class 2 eleven-step route, legacy content, formulas, datasets and visible teaching assertions.`);

'use strict';
// Historical eight-step arithmetic and preservation checks. The delivered
// twelve-step route is independently checked by test-class1-twelve-steps.cjs.
const fs=require('node:fs'),assert=require('node:assert/strict');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const read=p=>fs.readFileSync(p,'utf8');
const source=require('./scripts/class-one-twelve-preservation.cjs').restore(read('src/descriptive-statistics.html')); 
const expected=['case-part-1','case-part-2','case-part-4','case-part-3','case-skewness','case-kurtosis','case-part-5','case-part-6'];
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
for(const [name,html] of [['restored eight-step source',source]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'case-part'));
 eq(parts.map(p=>p.attrs.id),expected,name+': explicit pedagogical sequence');
 for(const [i,part] of parts.entries()){
  const alias=t.byId('class1-step-'+(i+1));ok(alias,name+': canonical step alias');
  ok(alias===part||ancestors(alias).includes(part),name+': canonical alias belongs to correct legacy section');
  const lessons=t.nodes.filter(n=>has(n,'lesson')&&ancestors(n).includes(part));eq(lessons.length,1,name+': one optional topic per step');
  const checksHere=t.nodes.filter(n=>n.tag==='details'&&!has(n,'lesson')&&ancestors(n).includes(part)&&!ancestors(n).some(p=>has(p,'lesson')));
  ok(checksHere.length>0,name+': each visible step offers a learner-controlled check');
 }
 for(const [id,owner] of [['case-record-check',0],['case-center-worked',1],['case-fence-worked',2],['case-supplier-worked',3],['skewness-core',4],['kurtosis-core',5],['case-pairs-worked',6],['case-write-brief',7]]){
  const n=t.byId(id);ok(n,name+': worked stage '+id);ok(ancestors(n).includes(parts[owner]),name+': correct worked-stage destination');
  ok(!ancestors(n).some(p=>p.tag==='details'||has(p,'technical')),name+': essential worked stage is visible without disclosures or technical mode');
 }
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+': unique IDs');
 for(const i of [1,2,3,4,5,6,7,8])ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class1-step-'+i),name+': reachable canonical step '+i);
}
const baseline=JSON.parse(read('course-structure.json'))['descriptive-statistics.html'];
for(const id of baseline.ids)eq([...source.matchAll(/\bid="([^"]+)"/g)].filter(m=>m[1]===id).length,1,'original ID retained exactly once: '+id);
eq([...source.matchAll(/\{\{math:([^}]+)\}\}/g)].map(m=>m[1]).sort(),baseline.math,'all original formula placeholders retained');
const activities=require('./scripts/activities.cjs').data().filter(a=>a.file==='descriptive-statistics.html');
eq(activities.map(a=>[a.id,a.afterTopic]),[['c1-measurements',1],['c1-weighted-orders',4],['c1-change-units',9],['c1-preserve-pairs',13]],'practice follows semantic topics, not stale numeric positions');
// Deliberate navigation, headings and local-reference wording only. Everything
// else is compared as a multiset of exact text leaves, independent of location.
const allowedChangedLeaves={
  "See the numbers before learning the formulas. Follow one retailer through six short, visual steps, at your own pace.": 1,
  "Six visual steps · one business case": 1,
  "What can these records tell us?": 2,
  "Define rows, units and comparisons.": 1,
  "Is $45 an ordinary purchase?": 2,
  "Separate the middle order from revenue.": 1,
  "Which supplier fits the target?": 1,
  "Compare spread and missed deadlines.": 1,
  "What is the $200 order telling us?": 2,
  "Investigate shape and unusual values.": 1,
  "Should advertising spend rise?": 1,
  "Separate association from causal evidence.": 1,
  "What can we recommend now?": 2,
  "Reproduce the evidence and write the brief.": 1,
  "Start at 1. Each step has a picture, a pause question, and an optional full explanation. Open a labeled worked example when you want more detail; Technical depth adds formal material inside explanations. No coding is needed.": 1,
  "One picture. One question. One next step.": 1,
  "Step 1 of 6 · What can these records tell us?": 1,
  "Show all six steps": 1,
  "PART 1 OF 6 · BUSINESS QUESTION": 1,
  "You do not need to work through all five views now. Use the boxplot for Record A in Part 4 and the scatter plot for Record C in Part 5. The category, time-series and minute-based delivery examples are separate practice data. You can return here from the later parts.": 1,
  "PART 2 OF 6 · BUSINESS QUESTION": 1,
  "No. Investigate whether it is an error or a different type of customer. A real large order belongs in total revenue. Report mean and median with the reason they differ. Part 4 will turn “unusual” into an explicit check.": 1,
  "Next: see why even the right average can hide an operational problem.": 1,
  "Next: Compare suppliers": 1,
  "PART 3 OF 6 · BUSINESS QUESTION": 1,
  "Which supplier fits a six-day target?": 1,
  "Part 2 showed how a center can hide a large value. Operations has the same problem: both suppliers average five days, but delivery times may cluster tightly or vary widely. First measure that variation; then count actual misses of the six-day target.": 1,
  "current order values from Part 2": 1,
  "A quartile cuts the sorted data near a quarter of the way through. Q₁ and Q₃ bound the middle half; their difference is the IQR. “Exclusive” and “inclusive” are different interpolation rules, so they can give different quartiles on the same values. The technical panel below works through those ranks.": 1,
  "Next: investigate the unusual observations rather than hiding them.": 1,
  "Next: Investigate the large order": 1,
  "PART 4 OF 6 · BUSINESS QUESTION": 1,
  "The large purchase matters to revenue. Decide whether it signals an error, a different order type, or a genuine tail of the distribution.": 1,
  "Notice shape and extremes": 1,
  "A summary can hide an important tail.": 1,
  ". These are not replacements for the twelve orders above. Treat these five as the entire order book being described, so every moment divides by": 1,
  "current Part 2 lab values": 1,
  "and the population/sample choice in Part 3. They may differ from the fixed original boxplot above. Return to “One large order” in the lab to compare that scenario. The formulas and corrections are in technical depth.": 1,
  "already introduced in Part 2: exponentiating an average of logs gives the twelfth root of the product of the twelve amounts. It is not the $45 arithmetic mean, so multiplying $34.92 by twelve would not recover the $540 revenue. Choose the scale for the question, and keep the original amounts for revenue reporting.": 1,
  "Next: distinguish a pattern in the branch data from evidence that advertising caused sales.": 1,
  "Next: Question the advertising claim": 1,
  "PART 5 OF 6 · BUSINESS QUESTION": 1,
  "Should the advertising budget rise?": 1,
  "Next: Build your recommendation": 1,
  "PART 6 OF 6 · BUSINESS QUESTION": 1,
  "Write your briefing": 1
};
const historical=require('./scripts/class-one-preservation.cjs').restore(source);
const leafCounts=html=>{const counts=new Map();for(const raw of html.split(/<[^>]*>/)){const text=raw.trim();if(text)counts.set(text,(counts.get(text)||0)+1);}return counts;};
const beforeLeaves=leafCounts(historical),afterLeaves=leafCounts(source),missingLeaves={};
for(const [leaf,count] of beforeLeaves){const missing=count-(afterLeaves.get(leaf)||0);if(missing>0)missingLeaves[leaf]=missing;}
eq(missingLeaves,allowedChangedLeaves,'all historical source text retained except explicit reviewed navigation/local-reference wording');
const t=parse(source),plain=n=>t.fragment(n).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
for(const [id,claims] of [
 ['skewness-core',['$10, $10, $10, $10, $30','64 dollars²','−0.5, −0.5, −0.5, −0.5, 2','7.5 ÷ 5 = 1.5','−1.5','not prove symmetry']],
 ['kurtosis-core',['0.0625','16.25','3.25 − 3 = 0.25','corrected sample excess','Zero excess does not prove normality.']]
]){const core=t.byId(id);for(const claim of claims)ok(plain(core).includes(claim),id+': visible arithmetic/caveat '+claim);
 const check=t.nodes.find(n=>has(n,'visual-check')&&ancestors(n).includes(core));ok(check,'native check within '+id);ok(!/\sopen(?:[\s=>])/.test(t.fragment(check).split('>')[0]+'>'),'answer initially collapsed');}
const values=[10,10,10,10,30],mean=values.reduce((a,b)=>a+b)/values.length;
const variance=values.reduce((sum,v)=>sum+(v-mean)**2,0)/values.length,sd=Math.sqrt(variance),z=values.map(v=>(v-mean)/sd);
eq(mean,14,'worked mean');eq(variance,64,'worked population variance');eq(sd,8,'worked SD');
eq(z,[-.5,-.5,-.5,-.5,2],'worked standardized values');eq(z.reduce((s,v)=>s+v**3,0)/5,1.5,'worked third moment');eq(z.reduce((s,v)=>s+v**4,0)/5,3.25,'worked fourth moment');
// A chart help link must follow the subject after the former spread lesson
// is split. Keeping a valid but stale #spread target sends learners to SD.
for(const [name,html] of [['chart source',read('src/graphs-section.html')],['built page',read('dist/descriptive-statistics.html')]]){
 const link=html.match(/<a href="([^"]+)">The spread lesson explains quartiles and IQR\.<\/a>/);
 ok(link,name+': quartile explanation link exists');
 eq(link[1],'#case-fence-worked',name+': chart help reaches visible quartile calculation');
}
const quartileTarget=t.byId('case-fence-worked');
ok(ancestors(quartileTarget).includes(t.byId('case-part-4')),'quartile help stays in Step 3');
ok(!ancestors(quartileTarget).some(n=>n.tag==='details'||has(n,'technical')),'quartile help does not require optional disclosures');
console.log(`Passed ${checks} eight-step topology, visible teaching, canonical anchors, legacy IDs and mathematical preservation assertions.`);

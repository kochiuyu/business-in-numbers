'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),R=require('./scripts/lesson-roadmaps.cjs');
let checks=0;const ok=(x,m)=>{checks++;assert.ok(x,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c),inside=(n,p)=>n.start>p.start&&n.end<=p.end;
for(const [file,plan]of Object.entries(R.plans)){
 const source=fs.readFileSync('src/'+file,'utf8'),enhanced=R.enhance(source,file),built=fs.readFileSync('dist/'+file,'utf8');
 const old=R.nodes(source),current=R.nodes(enhanced),delivered=R.nodes(built);
 const ids=current.map(n=>n.attrs.id).filter(Boolean);eq(new Set(ids).size,ids.length,file+' unique IDs');
 for(const n of old.filter(n=>n.attrs.id))eq(ids.filter(id=>id===n.attrs.id).length,1,file+' preserves anchor '+n.attrs.id);
 for(const n of old.filter(n=>n.tag==='details'))ok(enhanced.includes(source.slice(n.start,n.end)),file+' preserves complete explanation/check '+(n.attrs.id||n.start));
 for(const attr of ['math','activity','python','output'])eq([...source.matchAll(new RegExp('\\{\\{'+attr+':([^}]+)\\}\\}','g'))].map(x=>x[1]).sort(),[...enhanced.matchAll(new RegExp('\\{\\{'+attr+':([^}]+)\\}\\}','g'))].map(x=>x[1]).sort(),file+' preserves '+attr);
 for(const [label,ns,html]of [['enhanced',current,enhanced],['built',delivered,built]]){
  const parts=ns.filter(n=>has(n,plan.partClass)),route=ns.find(n=>has(n,plan.routeClass));eq(parts.map(n=>n.attrs.id),plan.steps.map(s=>s.id),file+' '+label+' planned order');
  const links=ns.filter(n=>n.tag==='a'&&inside(n,route));eq(links.map(n=>n.attrs.href),plan.steps.map(s=>'#'+s.anchor),file+' '+label+' indexed route matches viewer');
  for(const [i,n]of links.entries()){const description=ns.find(d=>has(d,'route-purpose')&&inside(d,n));ok(description,file+' '+label+' description '+i);ok(!ns.some(d=>d.tag==='details'&&inside(n,d)),file+' '+label+' card always visible');}
  for(const [i,n]of parts.entries()){const bridges=ns.filter(d=>has(d,'step-bridge')&&inside(d,n));eq(bridges.length,1,file+' bridge '+i);ok(!ns.some(d=>d.tag==='details'&&inside(bridges[0],d)),file+' visible bridge '+i);}
  const map=ns.find(n=>has(n,'lesson-roadmap'));ok(map&&!ns.some(n=>n.tag==='details'&&inside(map,n)),file+' visible overview');
  for(const a of ns.filter(n=>n.tag==='a'&&inside(n,map)))ok(ns.some(n=>n.attrs.id===a.attrs.href.slice(1)),file+' roadmap destination '+a.attrs.href);
  if(plan.reorder)for(const [i,part]of parts.entries()){
   ok(html.slice(part.start,part.end).includes(`STEP ${i+1} / ${parts.length}`),'displayed heading number matches route');
   if(label==='built'){const kicker=ns.find(n=>has(n,`c${plan.classNumber}-kicker`)&&inside(n,part));ok(kicker&&html.slice(kicker.openEnd,kicker.end).startsWith(String(i+1).padStart(2,'0')+' /'),'picture and displayed step numbers agree');}
   const nav=ns.find(n=>has(n,`c${plan.classNumber}-step-nav`)&&inside(n,part)),a=ns.filter(n=>n.tag==='a'&&inside(n,nav));
   if(i)eq(a[0].attrs.href,'#'+plan.steps[i-1].anchor,file+' previous follows displayed order '+i);
   eq(a.at(-1).attrs.href,i+1<parts.length?'#'+plan.steps[i+1].anchor:plan.nextFile,file+' next follows displayed order '+i);
  }
 }
 const owners=ns=>{const result={};for(const n of ns.filter(n=>n.attrs.id)){let p=n;while(p&&!has(p,plan.partClass))p=p.parent;if(p)result[n.attrs.id]=p.attrs.id;}return result;};
 const priorOwners=owners(old),nowOwners=owners(current);for(const [id,owner]of Object.entries(priorOwners))eq(nowOwners[id],owner,file+' old deep link still denotes same subject '+id);
}
const first=fs.readFileSync('dist/descriptive-statistics.html','utf8'),n=R.nodes(first),mini=n.find(n=>n.attrs.id==='standard-deviation-units');
ok(mini,'standardized-distance mini-lesson');ok(!n.some(d=>d.tag==='details'&&inside(mini,d)),'standardized distance visible');ok(mini.start<n.find(n=>n.attrs.id==='case-skewness').start,'standardized units before shape');
const x=[1,2,5,8,9],mean=x.reduce((a,b)=>a+b)/5,variance=x.reduce((s,v)=>s+(v-mean)**2,0)/5;eq(mean,5);eq(variance,10);eq(((9-mean)/Math.sqrt(variance)).toFixed(4),'1.2649');eq(((1-mean)/Math.sqrt(variance)).toFixed(4),'-1.2649');eq((5-mean)/Math.sqrt(variance),0);
ok(first.includes('does <b>not</b> make a distribution normal'),'no normality implied by standardization');
const css=fs.readFileSync('src/lesson-roadmaps.css','utf8');ok(css.includes('a small.route-purpose{display:block'),'descriptions override old hidden style');ok(css.includes('@media(max-width:700px)'),'narrow layout');ok(css.includes('outline:3px solid'),'keyboard focus');
const repeatCode=fs.readFileSync('src/class-one.js','utf8');ok(repeatCode.includes('if(a&&a.hash===location.hash){e.preventDefault();reveal(true);}'),'same-anchor click cancels native focus reset before revealing heading');
if(R.plans['probability.html'])ok(R.plans['probability.html'].steps.find(s=>s.id==='prob-step-6').bridge.includes('independent conditional on the true state'),'repeated-signal bridge states conditional independence');
// Distinct branches and preview checks are visible teaching, not hidden guidance.
const branchChecks={
 'sampling-distributions.html':['class4-design-preview','different modeling situations'],
 'estimation.html':['class5-parallel-paths','parallel estimation paths','Known-SD z and estimated-SD t'],
 'hypothesis-testing.html':['class6-method-preview','24-hour'],
 'anova.html':['class7-design-preview'],
 'regression.html':['class8-evaluation-preview','em-future-check-bridge','Carry this into your next analysis']
};
for(const [file,tokens]of Object.entries(branchChecks))if(R.plans[file]){
 const html=fs.readFileSync('dist/'+file,'utf8');for(const token of tokens)ok(html.includes(token),file+' branch or preview '+token);
 const ns=R.nodes(html),preview=ns.find(n=>has(n,'roadmap-preview'));ok(preview&&!ns.some(n=>n.tag==='details'&&inside(preview,n)),file+' preview visible');
}
if(R.plans['regression.html']){
 const html=fs.readFileSync('dist/regression.html','utf8'),ns=R.nodes(html),exercise=ns.find(n=>n.attrs.id==='em-future-check-bridge');
 ok(exercise&&!ns.some(n=>n.tag==='details'&&inside(exercise,n)),'future-data evaluation stays visible');
 eq(ns.filter(n=>has(n,'c8-part')).length,19,'no redundant twentieth step');
 ok(html.includes('Check fit and future errors'),'step card explicitly names evaluation');
 const step13=ns.find(n=>n.attrs.id==='regression-step-10'),heading=ns.find(n=>n.tag==='h2'&&inside(n,step13));eq(html.slice(heading.openEnd,heading.end-5),'Check fit and future errors','step heading matches evaluation card');
 const forecast=(247/28+(27/14)*6)*10;
 eq(forecast.toFixed(4),'203.9286','independent fixed-line prediction for hypothetical $600 week');
 eq(((180-forecast)**2).toFixed(4),'572.5765','future squared error, not training error');
 eq((180-175)**2,25,'frozen mean-only baseline error');
 ok(!html.includes('Carry this into the next class'),'course ends without fictitious next class');
}
// Intercept an ordinary repeated anchor, but preserve modified-click browser behavior.
const names=['one','two','three','four','five','six','seven','eight'];
for(const p of Object.values(R.plans)){
 const js=fs.readFileSync('src/class-'+names[p.classNumber-1]+'.js','utf8');
 const snippet=js.match(/document\.addEventListener\('click',e=>\{[^\n]*?reveal\(true\);\}\}\);/)[0];
 let handler,reveals=0,prevented=false;
 require('node:vm').runInNewContext(snippet,{document:{addEventListener:(_,f)=>handler=f},location:{hash:'#same'},reveal:()=>reveals++});
 const event=extra=>({button:0,target:{closest:()=>({hash:'#same'})},preventDefault(){prevented=true},...extra});
 handler(event({}));eq(reveals,1,'ordinary repeated click reveals heading');ok(prevented,'ordinary repeated click cancels native focus reset');
 for(const extra of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]){prevented=false;reveals=0;handler(event(extra));eq(reveals,0,'modified/already-handled click stays native');eq(prevented,false,'modified click is not canceled');}
}
console.log(`Passed ${checks} roadmap, description, bridge, preservation, stable-anchor and arithmetic assertions.`);

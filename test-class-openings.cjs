'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {nodes,plans}=require('./scripts/lesson-roadmaps.cjs'),{data,render}=require('./scripts/activities.cjs');
const reference=require('./test-openings-reference.json');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
for(const [file,p] of Object.entries(plans)){
 const html=fs.readFileSync('dist/'+file,'utf8'),ns=nodes(html),has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c);
 for(const retired of ['class="course-guide"','class="course-map"','class="reading-controls"','data-reading-mode','id="reading-status"','Your four practice challenges','How would you like to study?','Open all explanations','Close explanations','data-practice-progress'])ok(!html.includes(retired),file+' omits '+retired);
 const header=ns.find(n=>n.tag==='header'),hero=ns.find(n=>has(n,'hero')),strip=ns.find(n=>has(n,'course-strip'));
 eq(ns.filter(n=>has(n,'course-menu')).length,1,file+' one class menu');
 ok(header.end<=hero.start&&hero.end<=strip.start,file+' header, hero and study strip');
 eq(html.slice(hero.end,strip.start).trim(),'',file+' no setup panel between hero and lesson');
 eq(ns.filter(n=>has(n,'lesson-roadmap')).length,1,file+' one current class roadmap');
 eq(ns.filter(n=>has(n,p.partClass)).length,p.steps.length,file+' full step sequence');
 eq(ns.filter(n=>has(n,p.partClass)).map(n=>crypto.createHash('sha256').update(html.slice(n.start,n.end)).digest('hex')),reference[file].step_sha256,file+' every full teaching step remains byte-identical');
 eq(ns.filter(n=>has(n,'active-practice')).length,4,file+' four contextual activities retained');
 eq(ns.filter(n=>n.attrs['data-math']).length,reference[file].math_count,file+' all equations');
 eq(ns.filter(n=>n.tag==='details'&&has(n,'lesson')).length,reference[file].lesson_count,file+' all explanations');
 const ids=ns.filter(n=>n.attrs.id).map(n=>n.attrs.id).sort();eq(crypto.createHash('sha256').update(JSON.stringify(ids)).digest('hex'),reference[file].ids_sha256,file+' preserves every anchor outside the retired panel');
 for(const a of data().filter(a=>a.file===file)){
  ok(html.includes(render(a)),file+' complete question, feedback and answer '+a.id);
  const activity=ns.find(n=>n.attrs.id===a.id);let part=activity.parent,practice=false;while(part&&!has(part,p.partClass)){if(has(part,'visual-practice'))practice=true;part=part.parent;}
  ok(part&&practice,file+' practice still beside its concept '+a.id);
 }
 for(const n of ns.filter(n=>has(n,p.partClass)))ok(!('hidden'in n.attrs),file+' no-JS step remains readable');
 ok(html.includes('id="depth"'),file+' technical-depth control retained');
 ok(html.includes('answer on paper and open “Reveal worked answer”'),file+' no-JS practice instructions');
}
const intro=fs.readFileSync('dist/index.html','utf8');ok(intro.includes('Open individual explanations and optional extensions'),'updated start-here instructions');
console.log(`Passed ${checks} concise-opening, preserved teaching, contextual practice and no-JavaScript assertions.`);

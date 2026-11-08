'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {nodes,plans}=require('./scripts/lesson-roadmaps.cjs'),{enhance}=require('./scripts/lesson-references.cjs');
const reference=require('./test-lesson-references-reference.json');
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let checks=0,total=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
for(const [file,p]of Object.entries(plans)){
 const source=fs.readFileSync('src/'+file,'utf8'),html=fs.readFileSync('dist/'+file,'utf8'),ns=nodes(html),cards=ns.filter(n=>n.tag==='details'&&has(n,'lesson'));
 total+=cards.length;
 eq(cards.map(n=>({id:n.attrs.id||null,sha256:hash(html.slice(n.start,n.end))})),reference[file].cards,file+' original cards unchanged except obsolete number badges');
 eq(ns.filter(n=>n.tag==='ol').map(n=>hash(html.slice(n.start,n.end))),reference[file].ordered_lists,file+' all numbered calculation lists and route order preserved');
 eq(ns.filter(n=>has(n,p.partClass)).length,p.steps.length,file+' current lesson steps unchanged');
 ok(!html.includes('class="lesson-number"'),file+' no obsolete numbers in rendered or accessible content');
 for(const card of cards){
  const summary=ns.find(n=>n.parent===card&&n.tag==='summary');ok(summary,file+' native disclosure summary');
  const content=html.slice(summary.openEnd,summary.end-10);ok(content.startsWith('<span><b>'),file+' title comes first');ok(content.includes('<small>'),file+' subtitle retained');ok(content.includes('<span class="plus" aria-hidden="true">+</span>'),file+' expansion affordance retained');
  if(card.attrs.id)ok(source.includes('id="'+card.attrs.id+'"'),file+' original deep-link ID');
 }
 eq(enhance(html),html,file+' normalization is idempotent');
}
eq(total,104,'all eight classes and 104 reference cards');
const fixture='<details id="topic" class="extra lesson"><summary><span class="lesson-number">09</span><span><b>Case 2</b></span><span class="plus" aria-hidden="true">+</span></summary><ol><li>Step 1</li><li>Step 2</li></ol><p><span class="lesson-number">3</span></p><details><summary>1. First calculation</summary><p>2 + 3 = 5</p></details></details><details><summary><span class="lesson-number">4</span>Other numbered sequence</summary></details>';
eq(enhance(fixture),fixture.replace('<span class="lesson-number">09</span>',''),'only direct legacy badges are removed, never nested teaching numbering');
const label='<details class="lesson"><summary><span class="lesson-number">Model 2</span></summary></details>';
eq(enhance(label),label,'non-numeric labels are preserved');
const css=fs.readFileSync('src/styles.css','utf8');ok(css.includes('.lesson-body{margin:0 0 32px;'),'body aligns with title without an empty number gutter');ok(css.includes('.lesson>summary>span:not(.plus){min-width:0}'),'title can shrink and wrap on narrow screens');
console.log(`Passed ${checks} title-only reference, exact-content, nested-numbering and native disclosure assertions.`);

'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {lessons,enhance}=require('./scripts/learning.cjs');let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
for(const [file] of lessons){
 const src=fs.readFileSync('src/'+file,'utf8'),html=fs.readFileSync('dist/'+file,'utf8');
 const base=JSON.parse(fs.readFileSync('course-structure.json','utf8'))[file];
 const match=(s,re)=>[...s.matchAll(re)].map(m=>m[1]).sort();
 eq(match(src,/\{\{math:([^}]+)\}\}/g),base.math,file+' preserved mathematics');
 for(const id of base.ids)ok(src.includes('id="'+id+'"'),file+' preserved '+id);
 eq((src.match(/class="lesson"/g)||[]).length,base.topics+(file==='descriptive-statistics.html'?8:0),file+' original topic coverage plus separately taught tables, charts, median, mode, quartiles, SD/CV, skewness and covariance');
 const ids=match(html,/\bid="([^"]+)"/g);eq(ids.length,new Set(ids).size,file+' unique IDs');
 for(const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:[a-z]+:|\/\/)/i.test(ref))continue;
  const [asset,anchor]=ref.split('#');
  const target=asset||file;ok(fs.existsSync('dist/'+target),file+' asset '+target);
  if(anchor && target.endsWith('.html'))ok(fs.readFileSync('dist/'+target,'utf8').includes('id="'+decodeURIComponent(anchor)+'"'),file+' fragment '+ref);
 }
 eq((html.match(/class="course-guide"/g)||[]).length,0,file+' no duplicate course guide');
 eq((html.match(/class="course-menu"/g)||[]).length,1,file+' single shared class menu');
 ok(html.includes('id="learning-start"'),file+' starting path');
 ok(html.includes('guided-try'),file+' guided experiment');
 ok(html.includes('lesson-bridge'),file+' conceptual transitions');
 ok(html.includes('self-check')||html.includes('learning-summary'),file+' transfer check');
 for(const [topic] of html.matchAll(/<details class="lesson"[^>]*>/g))ok(['descriptive-statistics.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','hypothesis-testing.html','anova.html','regression.html'].includes(file) ? !/\bopen(?:\s|>)/.test(topic) : /\bopen(?:\s|>)/.test(topic),file+' core topics use intended native disclosure default');
 ok(!/\{\{[a-z][a-z:-]*\}\}|\{\{math:|katex-error/.test(html),file+' fully compiled');
 ok(/href="learning\.[a-f0-9]{16}\.css"/.test(html));ok(/src="learning\.[a-f0-9]{16}\.js"/.test(html));
}
// The introduction must describe the controls that learners actually encounter.
const introduction=fs.readFileSync('dist/course-introduction.html','utf8');
ok(!/Read-in-order mode|compact review/i.test(introduction),'introduction does not name retired reading modes');
ok(!/Open all explanations|Close explanations|How would you like to study/i.test(introduction),'introduction does not name retired bulk controls');
ok(introduction.includes('Open individual explanations and optional extensions'),'introduction explains local disclosures');
ok(introduction.includes('The technical-depth switch reveals extra mathematics inside explanations.'),'introduction locates technical depth');
ok(introduction.includes('Check answers stay closed until you choose to reveal them.'),'introduction preserves learner-controlled answers');
ok(introduction.includes('full reading route without opening explanations'),'introduction separates route length from depth');

// A worked extension must name and link a separately collapsed explorer.
const randomSource=fs.readFileSync('src/random-variables.html','utf8');
ok(randomSource.includes('open <a href="#joint">Shared risk does not disappear by addition</a> and move q, the probability that both channels sell'),'joint-risk task names its explorer and defines q');
ok(!randomSource.includes('below, move q'),'joint-risk task does not rely on physical adjacency');
const samplingSource=fs.readFileSync('src/sampling-distributions.html','utf8');
ok(samplingSource.includes('Open <a href="#statistics">One population. Many possible sample means.</a> and select n=3'),'enumeration task names its separately closed explorer');
ok(!samplingSource.includes('The explorer below lets you check these bars'),'enumeration task does not imply its explorer is already open');

// Shared anchor revealing remains independent of the retired toolbar.
class Node{constructor(tag='DIV'){this.tagName=tag;this.open=false;this.parentElement=null;}}
const outer=new Node('DETAILS'),topic=new Node('DETAILS'),child=new Node('H3'),other=new Node('DETAILS');
topic.parentElement=outer;child.parentElement=topic;
const listeners={},location={hash:''};
const document={getElementById:id=>id==='inside'?child:null};
vm.runInNewContext(fs.readFileSync('src/learning.js','utf8'),{document,location,window:{addEventListener:(k,f)=>listeners[k]=f}});
eq(topic.open,false,'initial explanations remain closed');
location.hash='#inside';listeners.hashchange();eq(topic.open,true);eq(outer.open,true);eq(other.open,false,'unrelated answers stay closed');
topic.open=false;outer.open=false;listeners.hashchange();eq(topic.open,true,'repeated anchor restores topic');eq(outer.open,true,'repeated anchor restores ancestor');
location.hash='#%bad';listeners.hashchange();ok(true,'malformed hash ignored');location.hash='#missing';listeners.hashchange();ok(true,'missing anchor ignored');
outer.open=false;topic.open=false;location.hash='#%69nside';listeners.hashchange();eq(topic.open,true,'encoded anchor works');
vm.runInNewContext(fs.readFileSync('src/learning.js','utf8'),{document:{getElementById:()=>null},location:{hash:''},window:{addEventListener(){}}});ok(true,'empty page is safe');
const css=fs.readFileSync('src/learning.css','utf8');ok(css.includes('prefers-reduced-motion'));ok(css.includes('@media print'));ok(css.includes('min-height:44px'));ok(css.includes('@media(max-width:700px)'));
console.log(`Passed ${checks} learning content, all-page links/anchors, static accessibility and individual-disclosure assertions.`);

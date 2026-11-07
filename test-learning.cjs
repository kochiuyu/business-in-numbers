'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {lessons,enhance}=require('./scripts/learning.cjs');let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
for(const [file] of lessons){
 const src=fs.readFileSync('src/'+file,'utf8'),html=fs.readFileSync('dist/'+file,'utf8');
 const base=JSON.parse(fs.readFileSync('course-structure.json','utf8'))[file];
 const match=(s,re)=>[...s.matchAll(re)].map(m=>m[1]).sort();
 eq(match(src,/\{\{math:([^}]+)\}\}/g),base.math,file+' preserved mathematics');
 for(const id of base.ids)ok(src.includes('id="'+id+'"'),file+' preserved '+id);
 eq((src.match(/class="lesson"/g)||[]).length,base.topics,file+' original topic coverage');
 const ids=match(html,/\bid="([^"]+)"/g);eq(ids.length,new Set(ids).size,file+' unique IDs');
 for(const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:[a-z]+:|\/\/)/i.test(ref))continue;
  const [asset,anchor]=ref.split('#');
  const target=asset||file;ok(fs.existsSync('dist/'+target),file+' asset '+target);
  if(anchor && target.endsWith('.html'))ok(fs.readFileSync('dist/'+target,'utf8').includes('id="'+decodeURIComponent(anchor)+'"'),file+' fragment '+ref);
 }
 eq((html.match(/class="course-guide"/g)||[]).length,1);eq((html.match(/<aside class="course-guide"[\s\S]*?<\/aside>/)[0].match(/aria-current="page"/g)||[]).length,1);
 ok(html.includes('id="learning-start"'),file+' starting path');
 ok(html.includes('guided-try'),file+' guided experiment');
 ok(html.includes('lesson-bridge'),file+' conceptual transitions');
 ok(html.includes('self-check')||html.includes('learning-summary'),file+' transfer check');
 for(const [topic] of html.matchAll(/<details class="lesson"[^>]*>/g))ok(['index.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','hypothesis-testing.html','anova.html','regression.html'].includes(file) ? !/\bopen(?:\s|>)/.test(topic) : /\bopen(?:\s|>)/.test(topic),file+' core topics use intended native disclosure default');
 ok(!/\{\{[a-z][a-z:-]*\}\}|\{\{math:|katex-error/.test(html),file+' fully compiled');
 ok(html.includes('<link rel="stylesheet" href="learning.css">'));ok(html.includes('<script src="learning.js"></script>'));
}
// Shared reading controls: repeated mode changes, custom state, malformed anchor,
// deep linking into a closed panel, and absent toolbar all remain safe.
class Node{constructor(tag='DIV'){this.tagName=tag;this.open=true;this.hidden=true;this.attrs={};this.handlers={};this.dataset={};this.parentElement=null;this.textContent='';}addEventListener(k,f){this.handlers[k]=f;}setAttribute(k,v){this.attrs[k]=v;}}
const topics=[new Node('DETAILS'),new Node('DETAILS'),new Node('DETAILS')],toolbar=new Node(),status=new Node(),read=new Node('BUTTON'),review=new Node('BUTTON');read.dataset.readingMode='read';review.dataset.readingMode='review';
const child=new Node('H3');child.parentElement=topics[1];const listeners={},location={hash:''};
const document={querySelectorAll:s=>s==='details.lesson'?topics:s==='[data-reading-mode]'?[read,review]:[],querySelector:()=>toolbar,getElementById:id=>id==='reading-status'?status:id==='inside'?child:null};
vm.runInNewContext(fs.readFileSync('src/learning.js','utf8'),{document,location,window:{addEventListener:(k,f)=>listeners[k]=f}});
eq(toolbar.hidden,false);eq(read.attrs['aria-pressed'],'true');ok(status.textContent.startsWith('3 of 3'));
review.handlers.click();eq(topics.map(t=>t.open),[false,false,false]);eq(review.attrs['aria-pressed'],'true');
review.handlers.click();eq(topics.map(t=>t.open),[false,false,false]);read.handlers.click();eq(topics.map(t=>t.open),[true,true,true]);
topics[0].open=false;topics[0].handlers.toggle();eq(read.attrs['aria-pressed'],'false');eq(review.attrs['aria-pressed'],'false');
review.handlers.click();location.hash='#inside';listeners.hashchange();eq(topics.map(t=>t.open),[false,true,false]);
location.hash='#%bad';listeners.hashchange();ok(true,'malformed hash ignored');location.hash='#missing';listeners.hashchange();ok(true,'missing anchor ignored');
vm.runInNewContext(fs.readFileSync('src/learning.js','utf8'),{document:{querySelectorAll:()=>[],querySelector:()=>null,getElementById:()=>null},location:{hash:''},window:{addEventListener(){}}});ok(true,'no lesson controls is safe');
const css=fs.readFileSync('src/learning.css','utf8');ok(css.includes('prefers-reduced-motion'));ok(css.includes('@media print'));ok(css.includes('min-height:44px'));ok(css.includes('@media(max-width:700px)'));
console.log(`Passed ${checks} learning-path, preserved-content, all-page links/anchors, static accessibility and reading-mode assertions.`);

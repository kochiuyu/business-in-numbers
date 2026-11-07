'use strict';
// Shared regression coverage for the six-class readability rollout.
// Uses each class's existing DOM/VM harness, not a browser substitute.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
module.exports=function check({run,dom,html,partSelector,progressId,showAllId,expectedExtensions}){
 let count=0;const ok=(v,m)=>{count++;assert.ok(v,m);},eq=(a,b,m)=>{count++;assert.deepEqual(a,b,m);};
 const raw=dom(),extensions=raw.querySelectorAll('[data-reading-extension]');
 eq(extensions.length,expectedExtensions,'reviewed number of optional extensions');
 ok(extensions.every(x=>x.tagName==='DETAILS'&&!x.open),'native closed disclosures without JavaScript');
 ok(raw.querySelectorAll(partSelector).every(x=>!x.hidden),'all steps remain visible without JavaScript');
 ok(html.includes('Show all steps changes only the reading route'),'route and explanation depth distinguished');
 ok(html.includes('check answers stay closed'),'answers remain learner-controlled');
 const targets=extensions.map(ext=>{const target=ext.attrs.id?ext:ext.querySelector('[id]');ok(target,'each extension has a linkable section');return target.attrs.id;});
 for(const reduced of [false,true]){
  const {d,loc,events}=run(reduced,'#'+targets[0]);
  for(const id of targets){
   loc.hash='#'+id;(events.hashchange||[]).forEach(fn=>fn());
   const node=d.getElementById(id),part=node.closest(partSelector);
   ok(part&&!part.hidden,id+' selects its lesson step');
   for(let p=node;p;p=p.parentElement)if(p.tagName==='DETAILS')ok(p.open,id+' reveals every disclosure ancestor');
   const title=part.querySelector('h2').textContent.trim();ok(title.length>0,'harness retains actual step title');
   ok(d.getElementById(progressId).textContent.includes(title),id+' identifies selected step');
  }
  // Direct technical anchors switch the visible depth control on.
  for(const t of raw.querySelectorAll('.technical')){
   const target=t.attrs.id?t:t.querySelector('[id]');if(!target)continue;
   d.body.classList.remove('depth-on');d.getElementById('depth').checked=false;
   loc.hash='#'+target.attrs.id;(events.hashchange||[]).forEach(fn=>fn());
   ok(d.body.classList.contains('depth-on'),'technical hash reveals depth');
   eq(d.getElementById('depth').checked,true,'technical hash updates visible control');
  }
 }
 const {d,events}=run(false),panels=d.querySelectorAll('[data-reading-extension]');
 d.getElementById(showAllId).fire('click');ok(d.querySelectorAll(partSelector).every(x=>!x.hidden),'show all steps');
 ok(panels.every(x=>!x.open),'show all does not force extensions open');
 vm.runInNewContext(fs.readFileSync('src/learning.js','utf8'),{document:d,location:{hash:''},window:{addEventListener:(k,f)=>(events[k]||=[]).push(f)}});
 const topics=d.querySelectorAll('details.lesson'),answers=d.querySelectorAll('details').filter(x=>!panels.includes(x)&&!topics.includes(x));
 const answerState=answers.map(x=>x.open);
 d.querySelector('[data-reading-mode="read"]').fire('click');ok(panels.every(x=>x.open),'open-all includes optional extensions');
 ok(topics.every(x=>x.open),'open-all retains original topic explanations');
 eq(answers.map(x=>x.open),answerState,'open-all does not change check answers or unrelated disclosures');
 d.querySelector('[data-reading-mode="review"]').fire('click');ok(panels.every(x=>!x.open)&&topics.every(x=>!x.open),'close explanations includes extensions');
 vm.runInNewContext(fs.readFileSync('src/math-ui.js','utf8'),{document:d,window:{addEventListener:(k,f)=>(events[k]||=[]).push(f)}});
 const fire=k=>(events[k]||[]).forEach(fn=>fn());panels[0].open=true;
 fire('beforeprint');ok(d.querySelectorAll('details').every(x=>x.open),'printing exposes all detail content');
 fire('afterprint');ok(panels[0].open&&panels.slice(1).every(x=>!x.open),'printing restores exact extension state');
 ok(topics.every(x=>!x.open),'printing restores original topic state');
 return count;
};

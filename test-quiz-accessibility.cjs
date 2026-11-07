'use strict';
// Exercise the actual quiz controllers without a browser dependency. This small
// DOM fixture models replacement, identity, attributes, events, and keyboard focus.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;
const eq=(actual,expected,message)=>{checks++;assert.equal(actual,expected,message);};
const ok=(value,message)=>{checks++;assert.ok(value,message);};
function fixture(){
 const document={activeElement:null};
 class Element{
  constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.children=[];this.handlers={};this.writes=0;this.dataset={};for(const [key,value]of Object.entries(attrs))if(key.startsWith('data-'))this.dataset[key.slice(5)]=value;
   this.classList={contains:name=>(this.attrs.class||'').split(/\s+/).includes(name),toggle:(name,on)=>{const classes=new Set((this.attrs.class||'').split(/\s+/).filter(Boolean));if(on)classes.add(name);else classes.delete(name);this.attrs.class=[...classes].join(' ');}};
  }
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  removeAttribute(name){delete this.attrs[name];}
  addEventListener(name,handler){this.handlers[name]=handler;}
  focus(){document.activeElement=this;}
  click(){if(this.getAttribute('disabled')!==null)return;this.handlers.click?.();}
  all(){return [this,...this.children.filter(x=>typeof x!=='string').flatMap(x=>x.all())];}
  get textContent(){return this.children.map(x=>typeof x==='string'?x:x.textContent).join('');}
  set textContent(value){this.children=[String(value)];this.writes++;}
  set innerHTML(markup){
   if(this.all().includes(document.activeElement))document.activeElement=null;
   this.children=[];this.writes++;const stack=[this];
   for(const token of markup.match(/<\/?[a-z][^>]*>|[^<]+|</gi)||[]){
    if(token.startsWith('</')){stack.pop();continue;}
    if(token.startsWith('<')&&/^<[a-z]/i.test(token)){
     const tag=token.match(/^<([a-z0-9-]+)/i)[1],attrs={};
     for(const [,key,value]of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[key]=value??'';
     const node=new Element(tag,attrs);stack.at(-1).children.push(node);stack.push(node);
    }else stack.at(-1).children.push(token);
   }
  }
 }
 const root=new Element('div',{id:'quiz'});
 document.getElementById=id=>root.all().find(x=>x.getAttribute('id')===id)||null;
 document.querySelectorAll=selector=>{assert.equal(selector,'[data-answer]');return root.all().filter(x=>x.getAttribute('data-answer')!==null);};
 return {document,root};
}
for(const file of ['app','probability','random','sampling','estimation','hypothesis','anova','regression']){
 const source=fs.readFileSync(`src/${file}.js`,'utf8'),start=source.indexOf('const questions='),end=source.indexOf('function openAnchor()',start);
 ok(start>=0&&end>start,`${file}: locate actual quiz source`);
 const {document,root}=fixture(),render=file==='app'?'renderQuiz':'quiz',index=file==='probability'?'index':'qi';
 const context={document,$:document.getElementById};
 vm.runInNewContext(source.slice(start,end)+`\n${render}();globalThis.getState=()=>({index:${index},answers,questions});`,context);
 const state=()=>context.getState(),node=id=>document.getElementById(id),buttons=()=>document.querySelectorAll('[data-answer]');
 const question=i=>{const q=state().questions[i];return Array.isArray(q)?{q:q[0],a:q[1],correct:q[2],why:q[3]}:q;};
 const count=state().questions.length;
 eq(node('quiz-feedback').textContent,'',`${file}: status exists before answering`);
 eq(node('quiz-feedback').getAttribute('role'),'status');eq(node('quiz-feedback').getAttribute('aria-atomic'),'true');
 eq(node('previous-question').getAttribute('disabled'),'');
 node('previous-question').click();eq(state().index,0,`${file}: disabled Previous does not navigate`);
 for(let i=0;i<count;i++){
  const q=question(i),heading=node('quiz-question'),feedback=node('quiz-feedback'),explored=node('quiz-explored'),originalButtons=buttons(),renderWrites=root.writes;
  eq(state().index,i);eq(heading.textContent,q.q,`${file}: question text preserved`);
  eq(feedback.textContent,'',`${file}: new question starts with empty status`);
  for(let option=0;option<q.a.length;option++)eq(originalButtons[option].textContent,q.a[option],`${file}: option text preserved`);
  for(const chosen of [(q.correct+1)%q.a.length,q.correct,(q.correct+2)%q.a.length,q.correct]){
   const button=originalButtons[chosen];button.focus();button.click();
   eq(root.writes,renderWrites,`${file}: answers do not rerender quiz`);
   eq(node('quiz-question'),heading);eq(node('quiz-feedback'),feedback,`${file}: persistent live node`);eq(node('quiz-explored'),explored);
   eq(document.activeElement,button,`${file}: keyboard focus stays on answer`);
   eq(feedback.textContent,(chosen===q.correct?'Yes.':'Reconsider that choice.')+' '+q.why,`${file}: complete feedback text preserved`);
   eq(explored.textContent,`${i+1} explored`);
   originalButtons.forEach((candidate,j)=>{
    eq(buttons()[j],candidate,`${file}: persistent answer button`);
    eq(candidate.getAttribute('aria-pressed'),String(j===chosen));
    eq(candidate.getAttribute('aria-describedby'),j===chosen?'quiz-feedback':null,`${file}: stale feedback description removed`);
    eq(candidate.classList.contains('selected'),j===chosen&&chosen===q.correct);
    eq(candidate.classList.contains('wrong'),j===chosen&&chosen!==q.correct);
   });
   const writes=feedback.writes;button.click();eq(feedback.writes,writes,`${file}: repeated choice does not reannounce unchanged feedback`);eq(document.activeElement,button);
  }
  if(i>0){
   node('previous-question').click();eq(state().index,i-1);eq(document.activeElement,node('quiz-question'),`${file}: Previous focuses question`);
   eq(buttons()[question(i-1).correct].getAttribute('aria-describedby'),'quiz-feedback');
   eq(node('quiz-feedback').textContent,'Yes. '+question(i-1).why,`${file}: previous response restored`);
   node('next-question').click();eq(state().index,i);eq(document.activeElement,node('quiz-question'));
   eq(node('quiz-feedback').textContent,'Yes. '+q.why,`${file}: next response restored`);
  }
  if(i===count-1)eq(node('next-question').textContent,'Start again ↺');
  node('next-question').click();eq(document.activeElement,node('quiz-question'),`${file}: Next/reset focuses question`);
 }
 eq(state().index,0,`${file}: restart returns to first question`);eq(Object.keys(state().answers).length,0,`${file}: restart clears every answer`);
 eq(node('quiz-explored').textContent,'0 explored');eq(node('quiz-feedback').textContent,'');
 buttons().forEach(button=>{eq(button.getAttribute('aria-pressed'),'false');eq(button.getAttribute('aria-describedby'),null);ok(!button.classList.contains('selected')&&!button.classList.contains('wrong'));});
 buttons()[0].focus();buttons()[0].click();eq(node('quiz-explored').textContent,'1 explored',`${file}: answering after restart works`);
}
console.log(`Passed ${checks} quiz identity, live-feedback, selection, text, focus, navigation, and reset assertions across all eight classes.`);

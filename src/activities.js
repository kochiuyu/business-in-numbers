'use strict';
(() => {
 const forms=[...document.querySelectorAll('form[data-activity]')];const completed=new Set();
 const progress=document.querySelector('[data-practice-progress]');
 function updateProgress(){if(progress)progress.textContent=`${completed.size} of ${forms.length} challenges checked correctly on this page.`;}
 document.querySelectorAll('.practice-progress').forEach(el=>{el.hidden=false;});
 forms.forEach(form=>{
  const id=form.dataset.activity;let config;try{config=JSON.parse(document.getElementById(id+'-config').textContent);}catch{return;}
  if(!config||typeof config!=='object'||!['choice','number','match'].includes(config.kind))return;
  if(config.kind==='choice'&&(!Array.isArray(config.options)||!Number.isInteger(config.answer)||!config.options[config.answer]||config.options.some(o=>!o||typeof o.feedback!=='string')))return;
  if(config.kind==='number'&&(!Number.isFinite(config.answer)||!Number.isFinite(config.tolerance)||config.tolerance<0||typeof config.hint!=='string'))return;
  if(config.kind==='match'&&(!Array.isArray(config.pairs)||!config.pairs.length||!Array.isArray(config.options)||config.pairs.some(p=>!p||!Number.isInteger(p.answer)||!config.options[p.answer])))return;
  const feedback=document.getElementById(id+'-feedback'),actions=form.querySelector('.activity-actions'),panel=form.closest('.active-practice');
  if(!feedback||!actions)return;
  function clear(){feedback.textContent='';feedback.removeAttribute('data-result');form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));completed.delete(id);updateProgress();}
  function report(text,result){feedback.textContent=text;feedback.dataset.result=result;if(result==='correct')completed.add(id);else completed.delete(id);updateProgress();}
  form.addEventListener('input',clear);form.addEventListener('change',clear);
  form.addEventListener('submit',event=>{
   event.preventDefault();clear();
   if(config.kind==='choice'){
    const checked=form.querySelector('input[type="radio"]:checked');
    if(!checked){report('Choose an explanation before checking.','incomplete');form.querySelector('input')?.focus();return;}
    if(!/^\d+$/.test(checked.value)||!config.options[Number(checked.value)]){report('Choose one of the available explanations before checking.','incomplete');return;}
    const value=Number(checked.value),correct=value===config.answer;
    report((correct?'Correct. ':'Not yet. ')+config.options[value].feedback+(correct?' '+config.explanation:''),correct?'correct':'retry');
   }else if(config.kind==='number'){
    const input=form.querySelector('input[name="answer"]'),raw=input.value.trim();
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)||!Number.isFinite(Number(raw))){input.setAttribute('aria-invalid','true');report('Enter a finite number without units, commas, or a percent sign.','incomplete');input.focus();return;}
    const correct=Math.abs(Number(raw)-config.answer)<=config.tolerance+Number.EPSILON*Math.max(1,Math.abs(config.answer))*4;
    if(!correct)input.setAttribute('aria-invalid','true');
    report(correct?'Correct. '+config.explanation:'Not yet. '+config.hint+' You can change your answer or reveal the worked solution.',correct?'correct':'retry');
   }else{
    const selects=[...form.querySelectorAll('select')];const missing=selects.find(s=>s.value==='');
    if(missing){report('Choose a description for every situation before checking.','incomplete');missing.focus();return;}
    const wrong=selects.map((s,i)=>Number(s.value)!==config.pairs[i].answer?i:-1).filter(i=>i>=0);
    wrong.forEach(i=>selects[i].setAttribute('aria-invalid','true'));
    report(wrong.length?`${selects.length-wrong.length} of ${selects.length} matches are correct. Reconsider: ${wrong.map(i=>config.pairs[i].prompt).join('; ')}. Try again or reveal the worked answer.`:'All matches are correct. '+config.explanation,wrong.length?'retry':'correct');
   }
  });
  form.querySelector('[data-activity-reset]').addEventListener('click',()=>{form.reset();clear();panel.querySelectorAll('details').forEach(el=>{el.open=false;});form.querySelector('input,select')?.focus();});
  form.reset();form.querySelectorAll('input,select').forEach(el=>{el.disabled=false;});actions.hidden=false;
 });
 updateProgress();
 // Question finder is an optional shortcut. The complete learning path remains visible below.
 const finder=document.getElementById('question-finder'),recommendation=document.getElementById('question-recommendation');
 if(finder&&recommendation){document.querySelector('.question-finder-controls').hidden=false;finder.addEventListener('change',()=>{const index=Number(finder.value);const destination=document.getElementById('course-stop-'+index);if(!destination){recommendation.textContent='New to statistics? Begin at Class 1. This finder is a shortcut for review, not a prerequisite test.';document.querySelectorAll('.course-stop').forEach(el=>el.classList.remove('recommended'));return;}const summary=destination.querySelector('summary b');recommendation.textContent=`Start with ${summary.textContent.trim()}. On a first pass, return to Class 1 and follow the full sequence so the methods have a foundation.`;document.querySelectorAll('.course-stop').forEach(el=>{el.classList.toggle('recommended',el===destination);});destination.open=true;});}
})();

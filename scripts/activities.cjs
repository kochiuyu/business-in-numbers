'use strict';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(a){
 if(!/^[a-z0-9-]+$/.test(a.id)||!a.title||!a.prompt||!a.explanation)throw Error('Incomplete activity '+a.id);
 if(a.kind==='choice'&&(!a.options?.length||!Number.isInteger(a.answer)||!a.options[a.answer]||a.options.some(o=>!o.text||!o.feedback)))throw Error('Invalid choice '+a.id);
 else if(a.kind==='number'&&(!Number.isFinite(a.answer)||!Number.isFinite(a.tolerance)||a.tolerance<0||!a.unit||!a.hint))throw Error('Invalid number '+a.id);
 else if(a.kind==='match'&&(!a.pairs?.length||!a.options?.length||a.pairs.some(p=>!p.prompt||!Number.isInteger(p.answer)||!a.options[p.answer])))throw Error('Invalid match '+a.id);
 else if(!['choice','number','match'].includes(a.kind))throw Error('Unknown activity kind '+a.id);
}
function render(a){
 validate(a);const id=esc(a.id);let inputs='',answer='';
 if(a.kind==='choice'){
  inputs=`<fieldset><legend>Choose the best explanation.</legend><div class="activity-options">${a.options.map((o,i)=>`<label for="${id}-option-${i}"><input disabled type="radio" id="${id}-option-${i}" name="${id}-choice" value="${i}"><span>${esc(o.text)}</span></label>`).join('')}</div></fieldset>`;
  answer=esc(a.options[a.answer].text);
 } else if(a.kind==='number'){
  inputs=`<label class="activity-number-label" for="${id}-number">Your answer (${esc(a.unit)})</label><input disabled class="activity-number" type="text" inputmode="decimal" autocomplete="off" id="${id}-number" name="answer" aria-describedby="${id}-precision"><p class="activity-help" id="${id}-precision">Enter a number without units. ${a.tolerance?`Answers within ${esc(a.tolerance)} ${esc(a.unit)} are accepted.`:'Use the exact value.'}</p><details class="activity-hint"><summary>Need a hint?</summary><p>${esc(a.hint)}</p></details>`;
  answer=`${esc(a.tolerance>0?Number(a.answer.toFixed(Math.min(10,Math.max(0,Math.ceil(-Math.log10(a.tolerance)))))):a.answer)} ${esc(a.unit)}`;
 } else {
  inputs=`<fieldset><legend>Match each situation to the best description.</legend><div class="activity-matches">${a.pairs.map((p,i)=>`<label for="${id}-match-${i}"><span>${esc(p.prompt)}</span><select disabled id="${id}-match-${i}" name="match-${i}"><option value="">Choose a description</option>${a.options.map((o,j)=>`<option value="${j}">${esc(o)}</option>`).join('')}</select></label>`).join('')}</div></fieldset>`;
  answer=`<ul>${a.pairs.map(p=>`<li><b>${esc(p.prompt)}</b>: ${esc(a.options[p.answer])}</li>`).join('')}</ul>`;
 }
 const config=JSON.stringify(a).replace(/</g,'\\u003c');
 return `<article class="active-practice" id="${id}" aria-labelledby="${id}-title"><div class="activity-kicker">TRY · CHECK · EXPLAIN</div><h3 id="${id}-title">${esc(a.title)}</h3><p id="${id}-prompt">${esc(a.prompt)}</p>${a.link?`<p class="activity-lab-link"><a href="${esc(a.link.href)}">${esc(a.link.label)} →</a></p>`:''}<form data-activity="${id}" aria-describedby="${id}-prompt">${inputs}<div class="activity-actions" hidden><button type="submit">Check my reasoning</button><button type="button" data-activity-reset>Try again</button></div><p class="activity-feedback" id="${id}-feedback" role="status" aria-live="polite" aria-atomic="true"></p></form><details class="activity-solution"><summary>Reveal worked answer</summary>${a.kind==='match'?answer:`<p><b>${answer}</b></p>`}<p>${esc(a.explanation)}</p><p class="activity-help">Pause before moving on: explain why another answer would be misleading.</p></details><script type="application/json" id="${id}-config">${config}</script></article>`;
}
function data(){return [...require('./activities-foundations.cjs'),...require('./activities-inference.cjs'),...require('./activities-modeling.cjs')];}
function enhance(html,file){
 const activities=data().filter(a=>a.file===file);const seen=new Set();
 for(const a of activities){validate(a);if(seen.has(a.id))throw Error('Duplicate activity '+a.id);seen.add(a.id);}
 // Count nested details, so inserted activities follow the full topic, not a worked-answer disclosure within it.
 const re=/<\/?details\b[^>]*>/g;let m,depth=0,topic=0,tracked=false;const insertions=[];
 while((m=re.exec(html))){
  if(m[0].startsWith('</')){depth--;if(tracked&&depth===0){for(const a of activities.filter(a=>a.afterTopic===topic))insertions.push([re.lastIndex,['index.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','hypothesis-testing.html','anova.html','regression.html'].includes(file)?`<details class="visual-practice"><summary>Practice this idea · ${esc(a.title)}</summary>${render(a)}</details>`:render(a)]);tracked=false;}}
  else {if(depth===0&&/class="lesson"/.test(m[0])){topic++;tracked=true;}depth++;}
 }
 if(insertions.length!==activities.length)throw Error(`Activity insertion mismatch ${file}: ${insertions.length}/${activities.length} topics=${topic}`);
 for(const [position,markup]of insertions.reverse())html=html.slice(0,position)+markup+html.slice(position);
 const progress=`<noscript><p class="activity-help">For the new active-practice questions, answer on paper and open “Reveal worked answer” to compare. Automatic checks need JavaScript, so answer controls stay disabled without it.</p></noscript><div class="practice-progress" hidden><b>Active practice</b><p>Four short challenges are woven into this lesson. Try first, check, then explain. All answers remain available without JavaScript.</p><p data-practice-progress role="status" aria-live="polite">0 of 4 challenges checked correctly on this page.</p><p class="activity-help">This is practice, not a grade. This course does not save your answers or progress between study sessions.</p></div>`;
 html=html.replace('<div class="reading-controls"',(['index.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','hypothesis-testing.html','anova.html','regression.html'].includes(file)?`<details class="c1-practice-status"><summary>Your four practice challenges</summary>${progress}</details>`:progress)+'<div class="reading-controls"');
 return html.replace('</head>','<link rel="stylesheet" href="activities.css"></head>').replace('</body>','<script src="activities.js"></script></body>');
}
module.exports={render,enhance,data,validate};

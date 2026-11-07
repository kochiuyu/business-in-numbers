'use strict';
(function(){
const H=HypothesisModels,config=HypothesisConfig,$=id=>document.getElementById(id);
function input(id){const values={};for(const f of config[id].fields){const s=$(id+'-'+f.key).value.trim();if(!s)throw Error('Fill in every required field.');values[f.key]=f.type==='number'||f.key==='alpha'?Number(s):s;}return values;}
function show(id,d){const v=H.view(id,d);$(id+'-chart').innerHTML=id==='power'?H.powerSvg(d):H.tailSvg(d,id);$(id+'-metrics').innerHTML=v.metrics;$(id+'-note').textContent=v.note;if(id==='paired')$('paired-data').textContent='Before − after: '+d.differences.map(x=>H.fmt(x)).join(', ')+'.';}
function update(id){try{show(id,H[id](input(id)));$(id+'-error').textContent='';}catch(e){$(id+'-error').textContent=e.message+' The last valid result is retained.';}}
function set(id,values){for(const[k,v]of Object.entries(values))$(id+'-'+k).value=v;}
for(const[id,cfg]of Object.entries(config)){$(id+'-form').addEventListener('submit',e=>{e.preventDefault();update(id);});$(id+'-reset').addEventListener('click',()=>{set(id,Object.fromEntries(cfg.fields.map(f=>[f.key,f.value])));update(id);});}
$('mean-demo-t').addEventListener('click',()=>{set('mean',{method:'t',mean:52,mu0:50,sd:4,n:16,tail:'two',alpha:.05});update('mean');});
$('power-larger').addEventListener('click',()=>{const n=Number($('power-n').value);if(!Number.isInteger(n)||n<2||n>5000){$('power-error').textContent='Enter a sample size from 2 to 5,000 before doubling. The last valid result is retained.';return;}$('power-n').value=2*n;update('power');});
$('variance-swap').addEventListener('click',()=>{for(const key of ['s','n']){const a=$(key==='s'?'variance-s1':'variance-n1'),b=$(key==='s'?'variance-s2':'variance-n2'),v=a.value;a.value=b.value;b.value=v;}const t=$('variance-tail');if(t.value!=='two')t.value=t.value==='greater'?'less':'greater';update('variance');});
$('depth').addEventListener('change',()=>document.body.classList.toggle('depth-on',$('depth').checked));
const questions=[
['A p-value of .03 means…',['There is a 3% chance that H₀ is true.','Under H₀ and the model, results at least as extreme in the specified direction occur with probability .03.','The effect has a 97% chance of paying off.'],1,'A p-value is a tail probability under a specified null model, not a probability assigned to H₀ or business success.'],
['When should the one-sided direction be chosen?',['After seeing which sample mean is bigger.','Before inspecting the outcome data, based on the question.','Only after a two-sided test fails.'],1,'Choosing a favorable direction after seeing the result changes the false-positive behavior.'],
['A Type I error is…',['Rejecting a true null.','Not rejecting a false null.','Any disappointing business outcome.'],0,'In the usual rejection-as-positive convention, a Type I error is a false positive; Type II is a false negative.'],
['A nonsignificant result establishes…',['The groups are equal.','There is no economically important difference.','Insufficient evidence to reject with this test and α.'],2,'Low power can miss meaningful effects. Equality and equivalence require their own appropriate designs.'],
['At fixed α, how can power improve?',['Increase sample size or reduce noise with a better design.','Hide the unfavorable observations.','Call β the significance level.'],0,'Power depends on effect size, variability, sample size, test and design. A larger n is not the only route.'],
['Unknown σ, 16 IID normal observations. Use…',['An exact z test with sample SD.','t with 15 degrees of freedom.','F with 16 and 16 degrees of freedom.'],1,'Estimating σ adds uncertainty. The exact normal-model statistic uses t with n−1 degrees of freedom.'],
['For a one-proportion score z test, the SE uses…',['The null proportion π₀.','Always 0.5.','Only the observed rate p̂.'],0,'Under H₀, Var(p̂)=π₀(1−π₀)/n. This differs from the plug-in Wald CI SE.'],
['Default comparison of two independent means without equal-variance evidence?',['Pair rows by their current order.','Always pool the sample variances.','Welch t, with fractional degrees of freedom.'],2,'Welch does not require equal population variances. Real pairing comes from the study design, not row order.'],
['For matched before/after data, calculate…',['A one-sample t test of within-unit differences.','Two unrelated samples and discard the matching.','An F test of the two means.'],0,'The difference variance includes covariance. Exact t needs normal differences and independent pairs.'],
['Why do the two-proportion test and displayed Wald CI use different SEs?',['It is a rounding mistake.','The equality null supports pooling; the general CI estimates separate rates.','Pooling is always more conservative.'],1,'The test pools under π₁=π₂. The Wald CI is unpooled and is not an exact inversion of that pooled test.'],
['Swap A and B in a two-sided F test. What should happen?',['F is unchanged.','F reciprocates, df swap, and the two-sided p-value stays the same.','The p-value must become one minus the old value.'],1,'F is asymmetric. Reciprocal ratios require exchanged numerator and denominator degrees of freedom.'],
['A tiny p-value with a $0.01 gain per sale means…',['The change must be worth deploying.','The model is automatically correct.','Assess the effect, CI, costs and design before deciding.'],2,'Statistical evidence and practical importance answer different questions.']
];let qi=0;const answers={};
function quiz(){
 const [question,options,correct,why]=questions[qi];
 const q={q:question,a:options,correct,why};
 $('quiz').innerHTML=`<div class="quiz-top"><span>QUESTION ${qi+1} OF ${questions.length}</span><span id="quiz-explored">${Object.keys(answers).length} explored</span></div><h3 id="quiz-question" tabindex="-1">${q.q}</h3><div class="quiz-answers" role="group" aria-labelledby="quiz-question">${q.a.map((answer,i)=>`<button data-answer="${i}" aria-pressed="false">${answer}</button>`).join('')}</div><p id="quiz-feedback" class="quiz-feedback" role="status" aria-atomic="true"></p><div class="quiz-nav"><button id="previous-question" ${qi===0?'disabled':''}>← Previous</button><button id="next-question">${qi===questions.length-1?'Start again ↺':'Next question →'}</button></div>`;
 const buttons=[...document.querySelectorAll('[data-answer]')],feedback=$('quiz-feedback');
 function updateAnswer(){
  const chosen=answers[qi],answered=chosen!==undefined,right=chosen===q.correct;
  buttons.forEach(button=>{
   const selected=Number(button.dataset.answer)===chosen;
   button.setAttribute('aria-pressed',String(selected));
   button.classList.toggle('selected',selected&&right);
   button.classList.toggle('wrong',selected&&!right);
   if(selected)button.setAttribute('aria-describedby','quiz-feedback');
   else button.removeAttribute('aria-describedby');
  });
  $('quiz-explored').textContent=`${Object.keys(answers).length} explored`;
  // Keep the live region and answer buttons mounted: only its content changes.
  if(answered)feedback.innerHTML=`<b>${right?'Yes.':'Reconsider that choice.'}</b> ${q.why}`;
 }
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const chosen=Number(button.dataset.answer);
  if(answers[qi]===chosen)return;
  answers[qi]=chosen;
  updateAnswer();
 }));
 $('previous-question').addEventListener('click',()=>{qi--;quiz();$('quiz-question').focus({preventScroll:true});});
 $('next-question').addEventListener('click',()=>{
  if(qi===questions.length-1){qi=0;Object.keys(answers).forEach(key=>delete answers[key]);}
  else qi++;
  quiz();$('quiz-question').focus({preventScroll:true});
 });
 updateAnswer();
}
function openAnchor(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}let el=$(id);while(el){if(el.tagName==='DETAILS')el.open=true;el=el.parentElement;}}
window.addEventListener('hashchange',openAnchor);openAnchor();quiz();
})();

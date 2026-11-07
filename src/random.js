'use strict';
(function(){
const R=RandomModels,$=id=>document.getElementById(id),num=id=>{const raw=$(id).value.trim();if(!raw)throw Error('Enter a number in each visible field.');return Number(raw);};
function showParams(attribute,keys){document.querySelectorAll('['+attribute+']').forEach(label=>{const on=keys.includes(label.getAttribute(attribute));label.hidden=!on;const input=label.querySelector('input');input.disabled=!on;input.required=on;});}
const countDefaults={binomial:{n:12,p:.25,k:3},bernoulli:{p:.25,k:0},poisson:{lambda:4,k:3},hypergeometric:{N:40,K:8,n:6,k:1},uniform:{n:6,k:3}};
const countKeys={binomial:['n','p'],bernoulli:['p'],poisson:['lambda'],hypergeometric:['N','K','n'],uniform:['n']};
function countUpdate(){try{const model=$('count-model').value,params={};countKeys[model].forEach(k=>params[k]=num('count-'+k));const k=num('count-k');if(!Number.isInteger(k)||Math.abs(k)>100)throw Error('Threshold k must be an integer from −100 to 100.');const d=R.discrete(model,params);$('count-label').textContent=d.label;$('count-pmf').innerHTML=R.discreteSvg(d,k,'mass','count-mass');$('count-cdf').innerHTML=R.discreteSvg(d,k,'cdf','count-cumulative');$('count-summary').innerHTML=R.countSummary(d,k);$('count-table').innerHTML=R.countTable(d);$('count-note').textContent=model==='poisson'?'The Poisson support is infinite. The plot stops near the mean plus 4 SD; the longer table leaves less than 10⁻¹² probability unlisted. Calculations retain that negligible tail in complements.':'The plot and table show the full possible-value range; zero-probability endpoints may appear in degenerate models.';$('count-error').textContent='';}catch(e){$('count-error').textContent=e.message+' The last valid chart is retained.';}}
function countReset(){const model=$('count-model').value;Object.entries(countDefaults[model]).forEach(([k,v])=>$('count-'+k).value=v);showParams('data-count-param',countKeys[model]);countUpdate();}
$('count-form').addEventListener('submit',e=>{e.preventDefault();countUpdate();});$('count-model').addEventListener('change',countReset);$('count-reset').addEventListener('click',countReset);showParams('data-count-param',countKeys[$('count-model').value]);
const contDefaults={normal:{mu:500,sd:4,lower:496,upper:504},uniform:{a:2,b:8,lower:3,upper:5},exponential:{rate:.1,lower:5,upper:15}},contKeys={normal:['mu','sd'],uniform:['a','b'],exponential:['rate']};
function contUpdate(){try{const model=$('continuous-model').value,params={};contKeys[model].forEach(k=>params[k]=num('cont-'+k));const l=num('cont-lower'),u=num('cont-upper'),d=R.continuous(model,params);R.interval(d,l,u);$('continuous-label').textContent=d.label;$('continuous-pdf').innerHTML=R.continuousSvg(d,l,u,'pdf','area-density');$('continuous-cdf').innerHTML=R.continuousSvg(d,l,u,'cdf','area-cumulative');$('continuous-summary').innerHTML=R.continuousSummary(d,l,u);$('continuous-calculation').textContent=R.continuousCalculation(d,l,u);$('continuous-note').textContent=model==='normal'?'Plots show μ ± 4σ. Calculations use the entire distribution, including tails outside the plot.':model==='exponential'?'Plots show zero through seven mean waiting times. Calculations include the unbounded right tail; a chosen interval can extend beyond the visible plot.':'The density is zero outside the specified endpoints. Calculations also handle intervals extending outside the support.';$('continuous-error').textContent='';}catch(e){$('continuous-error').textContent=e.message+' The last valid chart is retained.';}}
function contReset(){const model=$('continuous-model').value;Object.entries(contDefaults[model]).forEach(([k,v])=>$('cont-'+k).value=v);showParams('data-cont-param',contKeys[model]);contUpdate();}
$('continuous-form').addEventListener('submit',e=>{e.preventDefault();contUpdate();});$('continuous-model').addEventListener('change',contReset);$('continuous-reset').addEventListener('click',contReset);showParams('data-cont-param',contKeys[$('continuous-model').value]);
$('joint-q').addEventListener('input',()=>{const q=num('joint-q');$('joint-q-value').textContent=q.toFixed(2);$('joint-table').innerHTML=R.jointTable(q);$('joint-result').textContent=R.jointResult(q);});
$('depth').addEventListener('change',()=>document.body.classList.toggle('depth-on',$('depth').checked));
const questions=[
['A continuous density reaches a height of 2. Is the model necessarily invalid?',['Yes, all probability-related numbers must be at most 1.','No. The total area must be 1; density height can exceed 1.','No, because a point can have probability 2.'],1,'Density has units per unit of x. Area is probability. A point has zero probability in these density models.'],
['X is an integer count. Which gives the probability of at least 3?',['1 − F(3)','F(3) − F(2)','1 − F(2)'],2,'At least 3 excludes 0, 1 and 2, so subtract the CDF at 2.'],
['Count purchases among 12 independent visits, each with probability .25. Which model fits these assumptions?',['Binomial','Hypergeometric','Continuous uniform'],0,'A fixed trial count, independence, binary outcomes and common p are the binomial assumptions.'],
['Sample 6 distinct items randomly from 40, exactly 8 of which are tagged. What models the tagged count?',['Exponential','Hypergeometric','Binomial exactly, because each draw is independent'],1,'Without replacement, later draws depend on earlier selections. Known finite composition gives the hypergeometric model.'],
['Which variable can a Poisson model represent?',['0.2 hours of outage duration','The weight of a parcel','The integer count of outages in a week'],2,'Poisson is a count distribution. A duration requires an appropriate continuous model.'],
['An exponential wait has mean 10 minutes. What rate goes into Excel EXPON.DIST?',['10 per minute','0.1 per minute','100 per minute'],1,'Rate is the reciprocal of the mean in the same time unit. SciPy instead takes scale=10.'],
['Cov(X,Y)=0. What follows in general?',['X and Y are independent.','Their linear covariance is zero; dependence may still exist.','X and Y cannot affect the same business outcome.'],1,'For example, a symmetric X and Y=X² can be dependent but uncorrelated.'],
['X~N(500,16). How should 496 be standardized?',['(496−500)/16','496/4','(496−500)/4'],2,'The second normal parameter is variance 16; divide by SD 4 to get z=−1.'],
['For a standard normal right-tail probability .025, which inverse-CDF input is correct?',['.975','.025','.95'],0,'CDF inverses use the left-tail probability. One minus .025 is .975, giving about 1.96.'],
['Student t with one degree of freedom is symmetric about zero. What is its mean?',['0, because every symmetric distribution has mean zero.','Undefined. Symmetry does not guarantee a finite mean.','1, because there is one degree of freedom.'],1,'The t mean exists only above one degree of freedom. The median is still zero.']];
let qi=0;const answers={};function quiz(){
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
function openAnchor(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const el=$(id);if(!el)return;let p=el;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}}
window.addEventListener('hashchange',openAnchor);openAnchor();quiz();
})();

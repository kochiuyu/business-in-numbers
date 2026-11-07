'use strict';
(function(){
const S=SamplingModels,$=id=>document.getElementById(id),num=id=>{const s=$(id).value.trim();if(!s)throw Error('Enter a number in every field.');return Number(s);};
function action(prefix,fn){try{fn();$(prefix+'-error').textContent='';}catch(e){$(prefix+'-error').textContent=e.message+' The last valid result is retained.';}}
function exact(){action('exact',()=>{const d=S.exact(num('exact-n'));$('exact-chart').innerHTML=S.exactSvg(d);$('exact-table').innerHTML=S.exactTable(d);$('exact-metrics').innerHTML=S.metrics([['Expected sample mean ($)',d.mean],['Variance of mean ($²)',d.variance],['Standard error ($)',Math.sqrt(d.variance)],['Equally likely samples',d.total]]);});}
$('exact-form').addEventListener('submit',e=>{e.preventDefault();exact();});$('exact-n').addEventListener('change',exact);
let seed=4204;
function simulation(){action('simulation',()=>{const s=S.simulate(num('simulation-n'),num('simulation-b'),seed);$('simulation-chart').innerHTML=S.histogramSvg(s);$('running-chart').innerHTML=S.pathSvg(s);$('simulation-metrics').innerHTML=S.metrics([['Mean of simulated means',s.center],['SD of simulated means',s.sd],['Theoretical SE',s.se],['Tickets per sample / samples',`${s.n} / ${s.reps}`]]);$('simulation-note').textContent=simNote(s);});}
function simNote(s){const out=s.means.filter(x=>x>=72).length;return `Seed ${s.seed}. ${out} of ${s.reps} sample means are beyond the visible 0–72 minute range; all means are included in summaries. These are simulated results, not exact probabilities. Changing n changes precision; changing B changes the smoothness of this estimate.`;}
$('simulation-form').addEventListener('submit',e=>{e.preventDefault();simulation();});$('simulation-new').addEventListener('click',()=>{seed=(seed+1)>>>0;simulation();});$('simulation-reset').addEventListener('click',()=>{seed=4204;$('simulation-n').value=30;$('simulation-b').value=2000;simulation();});
function known(){action('known',()=>{const d=S.known(num('known-mu'),num('known-sd'),num('known-n'),num('known-cut'));$('known-chart').innerHTML=S.normalSvg(d);$('known-metrics').innerHTML=S.metrics([['Standard error',d.se],['Standardized cutoff z',d.z],['P(mean ≤ cutoff)',S.fmt(d.p,6)],['Individual population SD',d.sd]]);});}
$('known-form').addEventListener('submit',e=>{e.preventDefault();known();});$('known-reset').addEventListener('click',()=>{for(const[k,v]of Object.entries({mu:40,sd:12,n:36,cut:37}))$('known-'+k).value=v;known();});
function proportion(){action('proportion',()=>{const d=S.proportions(num('proportion-n'),num('proportion-p'),num('proportion-k'));$('proportion-chart').innerHTML=S.proportionSvg(d);$('proportion-metrics').innerHTML=S.metrics([['Exact P(K ≤ k)',S.fmt(d.exact,6)],['Normal at k + 0.5',d.approx===null?'Not defined':S.fmt(d.approx,6)],['SE of sample proportion',S.fmt(d.se,6)],['Expected successes / failures',`${S.fmt(d.n*d.p)} / ${S.fmt(d.n*(1-d.p))}`]]);$('proportion-note').textContent=propNote(d);});}
function propNote(d){return d.approx===null?'The population proportion is 0 or 1, so the sample is deterministic. Standard error is zero; do not divide by it. Use the exact probability.':`${d.adequate?'Both expected counts are at least 10, a common rule of thumb.':'At least one expected count is below 10. The normal approximation can be poor; prefer the exact result.'} Absolute approximation error here: ${S.fmt(Math.abs(d.approx-d.exact),6)}. A count threshold k corresponds to sample proportion k/n = ${S.fmt(d.k/d.n,6)}.`;}
$('proportion-form').addEventListener('submit',e=>{e.preventDefault();proportion();});$('proportion-reset').addEventListener('click',()=>{for(const[k,v]of Object.entries({n:80,p:.3,k:19}))$('proportion-'+k).value=v;proportion();});
function student(){action('student',()=>{const d=S.student(num('student-n'),num('student-mean'),num('student-sd'),num('student-mu'));$('student-chart').innerHTML=S.tSvg(d);$('student-metrics').innerHTML=S.metrics([['Estimated SE',d.se],['Observed t',d.t],['Degrees of freedom',d.df],['Left tail P(T ≤ t)',S.fmt(d.left,6)],['Two tails P(|T| ≥ |t|)',S.fmt(d.two,6)],['Benchmark population mean',d.mu]]);});}
$('student-form').addEventListener('submit',e=>{e.preventDefault();student();});$('student-reset').addEventListener('click',()=>{for(const[k,v]of Object.entries({n:16,mean:47,sd:8,mu:50}))$('student-'+k).value=v;student();});
$('depth').addEventListener('change',()=>document.body.classList.toggle('depth-on',$('depth').checked));
const questions=[
['Sample 20 different customers without replacement from a list of 50. Are the selections independent?',['Yes, because they are random.','No. Without replacement, later selections depend on earlier ones.','Only when every customer responds.'],1,'A finite-population simple random sample has dependent draws. The variance of its mean has a finite-population correction.'],
['What does the sampling distribution of a mean describe?',['The histogram of one observed sample.','The values of all individual customers.','The possible sample means across repeated samples of the same size.'],2,'A sampling distribution belongs to a statistic over repeated samples, not to the individual observations.'],
['An unbiased sample mean must…',['Equal the population mean in every sample.','Have expectation equal to the population mean under the sampling model.','Have zero standard error.'],1,'Unbiasedness concerns the center over repeated sampling. An individual sample can be above or below the target.'],
['Under the same IID model, what halves the standard error?',['Double n.','Halve n.','Multiply n by four.'],2,'Standard error is sigma divided by the square root of n. Four times as many observations halves it.'],
['The running mean moves farther from μ after one more observation. Does that contradict the LLN?',['No. LLN does not promise monotone improvement.','Yes. Every extra observation must improve the mean.','Only if n is already above 35.'],0,'The LLN is a probability limit. A particular path can move toward or away from the target at any step.'],
['Which CLT statement is defensible?',['Every population becomes normal at n=35.','Under IID finite-positive-variance conditions, the standardized mean approaches normality.','The CLT repairs biased sampling when n is large.'],1,'Conditions and standardization matter. No fixed n works for every population, and the population shape itself does not change.'],
['Hold sample size n fixed and increase simulation repetitions B. What changes?',['The theoretical SE becomes smaller.','The population becomes less skewed.','The simulated picture becomes smoother; theoretical SE is unchanged.'],2,'B is how often the experiment is repeated, not how much information each sample contains.'],
['For a binomial count, fewer than 20 means K≤19. Which continuity-correction boundary fits?',['19.5','20.5','19'],0,'The unit-width cells for counts through 19 end at 19.5. Translate the discrete event before using the normal curve.'],
['For n=16 IID normal observations with unknown population SD, the exact t pivot has how many df?',['16','15','14'],1,'Estimating the sample mean leaves n minus one degrees of freedom in the sample variance.'],
['A left-tail t p-value of .077 means…',['There is a 7.7% probability that the benchmark mean is true.','A future raw sample mean is below today’s mean with probability 7.7%.','Under the benchmark and sampling assumptions, a studentized statistic this low occurs about 7.7% of the time.'],2,'A null tail describes the statistic under a benchmark model. It is neither a posterior probability of the benchmark nor a predictive probability for a future raw mean.']
];
let qi=0;const answers={};
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

'use strict';
(()=>{
 const $=id=>document.getElementById(id),pct=x=>x===null?'Undefined':(100*x).toFixed(2)+'%',num=x=>x.toLocaleString('en-US',{maximumFractionDigits:2});
 $('depth').addEventListener('change',e=>document.body.classList.toggle('depth-on',e.target.checked));
 const presets={rare:[1,90,5],common:[20,90,5],source:[40,80,40]},inputs=['prior','sensitivity','false-positive'];
 let treeStep=1,treeEvidence='positive';
 const shortPct=x=>num(100*x)+'%';
 function updateTree(prior,s,f,b){
  const positive=treeEvidence==='positive',signal=positive?'alert':'no alert',symbol=positive?'+':'−';
  const issue=positive?b.tp:b.fn,noIssue=positive?b.fp:b.tn,total=positive?b.positive:b.negative,posterior=positive?b.posteriorPositive:b.posteriorNegative;
  const groups=[{name:'Issue H',plain:'issue',within:'issue',notation:'H',prior,rate:s,counts:[b.tp,b.fn]},{name:'No issue Hᶜ',plain:'no issue',within:'no-issue',notation:'Hᶜ',prior:1-prior,rate:f,counts:[b.fp,b.tn]}];
  $('bayes-tree').setAttribute('data-tree-step',String(treeStep));
  $('alert-tree').innerHTML='<div class="tree-root"><span>START</span><strong>10,000</strong><span>orders · 100%</span></div><ol class="tree-branches" aria-label="Actual states and their possible signals">'+groups.map(group=>`<li class="tree-branch"><div class="tree-state"><small>PRIOR · P(${group.notation})</small><strong>${group.name}</strong><span>${shortPct(group.prior)} · ${num(group.prior*10000)} orders</span></div><ul class="tree-leaves">${[true,false].map((isAlert,i)=>{const rate=isAlert?group.rate:1-group.rate,match=isAlert===positive,mark=treeStep===1?'Joint path':match?'✓ Kept':'× Set aside';return `<li class="tree-leaf ${treeStep===1?'':match?'is-match':'is-excluded'}"><div><b>${isAlert?'Alert +':'No alert −'}</b><span class="tree-path-status">${mark}</span></div><span>${shortPct(rate)} of ${group.within} orders · P(${isAlert?'+':'−'} | ${group.notation})</span><strong>${shortPct(group.prior)} × ${shortPct(rate)} = ${pct(group.counts[i]/10000)}</strong><span>${num(group.counts[i])} orders · ${group.plain} AND ${isAlert?'alert':'no alert'}</span></li>`;}).join('')}</ul></li>`).join('')+'</ol>';
  $('tree-model-note').textContent='Branch percentages are within their parent group; end-path percentages are out of all 10,000 orders. This factorization does not, by itself, establish causation.'+(prior===0||prior===1?' A group with zero prior has no orders: its branch rates are hypothetical model inputs, not conditional ratios computed for that empty group.':'');
  let working;
  if(treeStep===1){working=`<div class="tree-working-copy"><span class="tree-kicker">STEP 1 / MULTIPLY</span><h4>Read forward: state, then signal.</h4><p>For issue AND alert: ${shortPct(prior)} × ${shortPct(s)} = <b>${pct(b.tp/10000)}</b>, or ${num(b.tp)} of 10,000 orders. Each end path is a joint probability, not a probability given the signal.</p><p class="micro">The four end-path counts add to 10,000. The probabilities leaving each split add to 100%. Next, keep the paths consistent with the observed result.</p></div><div class="tree-rule"><span>ALONG A PATH</span><strong>Prior × likelihood</strong><span>= joint probability</span></div>`;}
  else if(treeStep===2){working=`<div class="tree-working-copy"><span class="tree-kicker">STEP 2 / ADD THE MATCHING PATHS</span><h4>Keep only the ${positive?'alert':'no-alert'} paths.</h4><p>${num(issue)} + ${num(noIssue)} = <b>${num(total)} ${positive?'alerted':'unflagged'} orders</b>. Add the matching path from each actual state. The other two paths are set aside for this conditional question.</p><p class="micro">The observed result has probability P(${symbol}) = ${pct(total/10000)}. ${total===0?'There are no matching orders, so conditioning on this result is undefined.':'Next, use this matching total as the new denominator.'}</p></div><div class="tree-rule"><span>NEW DENOMINATOR</span><strong>${num(total)}</strong><span>of 10,000 orders match</span></div>`;}
  else if(posterior===null){working=`<div class="tree-working-copy"><span class="tree-kicker">STEP 3 / ZERO DENOMINATOR</span><h4>No ${positive?'alerts':'unflagged orders'} occur in this model.</h4><p>${num(issue)} ÷ (${num(issue)} + ${num(noIssue)}) has a zero denominator. P(H | ${symbol}) is <b>undefined, not 0%</b>.</p><p class="micro">Change the observed result or the model rates to make the conditioning event possible.</p></div><div class="tree-rule"><span>ISSUE GIVEN ${signal.toUpperCase()}</span><strong>Undefined</strong><span>No matching outcomes</span></div>`;}
  else{working=`<div class="tree-working-copy"><span class="tree-kicker">STEP 3 / NORMALIZE</span><h4>Among the ${positive?'alerts':'unflagged orders'}, what share are real issues?</h4><p>${num(issue)} ÷ (${num(issue)} + ${num(noIssue)}) = ${num(issue)} ÷ ${num(total)} = <b>${pct(posterior)}</b>. The denominator is all ${positive?'alerts':'unflagged orders'}, not all orders or all issues.</p><p class="micro">Equivalently: ${pct(issue/10000)} ÷ (${pct(issue/10000)} + ${pct(noIssue/10000)}). Dividing the kept paths by their total makes their new probabilities add to 100%.</p></div><div class="tree-posterior"><span>ISSUE GIVEN ${signal.toUpperCase()} · P(H | ${symbol})</span><strong>${pct(posterior)}</strong><div class="tree-share" aria-hidden="true"><i style="width:${100*posterior}%"></i></div><p>Issue: ${pct(posterior)} · No issue: ${pct(1-posterior)}</p></div>`;}
  $('tree-working').innerHTML=working;
  document.querySelectorAll('button[data-tree-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.treeStep)===treeStep)));
  document.querySelectorAll('[data-tree-evidence]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.treeEvidence===treeEvidence)));
 }

 function updateBayes(){
  const values=inputs.map(id=>Number($(id).value));inputs.forEach((id,i)=>$(id+'-value').textContent=values[i]+'%');
  const [prior,s,f]=values.map(v=>v/100),b=Probability.bayes(prior,s,f);
  updateTree(prior,s,f,b);
  $('alert-table').innerHTML=`<tr><th scope="row">Issue H</th><td>${num(b.tp)}</td><td>${num(b.fn)}</td><td>${num(prior*10000)}</td></tr><tr><th scope="row">No issue Hᶜ</th><td>${num(b.fp)}</td><td>${num(b.tn)}</td><td>${num((1-prior)*10000)}</td></tr><tr><th scope="row">Total</th><td>${num(b.positive)}</td><td>${num(b.negative)}</td><td>10,000</td></tr>`;
  $('posterior-positive').textContent=pct(b.posteriorPositive);$('posterior-negative').textContent=pct(b.posteriorNegative);$('alert-rate').textContent=pct(b.alertRate);
  let insight=b.posteriorPositive===null?'No alerts occur under this model, so the probability of an issue given an alert is undefined.':`${num(b.tp)} of ${num(b.positive)} expected alerts concern real issues. `+(Math.abs(b.posteriorPositive-prior)<1e-12?'An alert leaves the prior probability unchanged.':`An alert ${b.posteriorPositive>prior?'raises':'lowers'} the issue probability from ${pct(prior)} to ${pct(b.posteriorPositive)}.`);
  if(b.posteriorNegative===null)insight+=' No unflagged orders occur, so the probability given no alert is undefined.';
  $('bayes-insight').textContent=insight;$('bayes-calculation').textContent=`Positive: ${num(b.tp)} ÷ (${num(b.tp)} + ${num(b.fp)}). Negative: ${num(b.fn)} ÷ (${num(b.fn)} + ${num(b.tn)}). A zero denominator means undefined.`;
  document.querySelectorAll('[data-bayes]').forEach(button=>{const match=presets[button.dataset.bayes].every((v,i)=>v===values[i]);button.setAttribute('aria-pressed',String(match));});
 }
 function refreshTree(){const [p,s,f]=inputs.map(id=>Number($(id).value)/100);updateTree(p,s,f,Probability.bayes(p,s,f));}
 document.querySelectorAll('button[data-tree-step]').forEach(button=>button.addEventListener('click',()=>{treeStep=Number(button.dataset.treeStep);refreshTree();}));
 document.querySelectorAll('[data-tree-evidence]').forEach(button=>button.addEventListener('click',()=>{treeEvidence=button.dataset.treeEvidence;refreshTree();}));
 inputs.forEach(id=>$(id).addEventListener('input',updateBayes));document.querySelectorAll('[data-bayes]').forEach(button=>button.addEventListener('click',()=>{presets[button.dataset.bayes].forEach((v,i)=>$(inputs[i]).value=v);updateBayes();}));
 function selectEvent(key){const event=Probability.events[key];$('die-space').innerHTML=[1,2,3,4,5,6].map(n=>`<span class="die ${event.selected.includes(n)?'selected':''} ${event.possible.includes(n)?'':'excluded'}" role="img" aria-label="Outcome ${n}, ${event.possible.includes(n)?event.selected.includes(n)?'in event':'not in event':'excluded by conditioning'}"><b>${n}</b><small>${event.possible.includes(n)?event.selected.includes(n)?'✓ selected':'not selected':'× excluded'}</small></span>`).join('');$('event-explanation').textContent=event.text;document.querySelectorAll('[data-event]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.event===key)));}
 document.querySelectorAll('[data-event]').forEach(button=>button.addEventListener('click',()=>selectEvent(button.dataset.event)));
 function showCounts(){try{if($('count-n').value.trim()===''||$('count-r').value.trim()==='')throw Error('Enter both n and r.');const n=Number($('count-n').value),r=Number($('count-r').value),c=Probability.counts(n,r);$('count-error').textContent='';$('count-results').innerHTML=[['Ordered, with replacement',c.replacement],['Ordered, without replacement',c.permutations],['Unordered, without replacement',c.combinations]].map(([name,count])=>`<span>${name}<b>${count.toLocaleString('en-US')}</b></span>`).join('');}catch(error){$('count-error').textContent=error.message;$('count-results').textContent='No result: correct the inputs and compare again.';}}
 $('calculate-counts').addEventListener('click',showCounts);['count-n','count-r'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showCounts();}}));
 const questions=[
 {q:'The system catches 90% of real issues. What does 90% mean?',a:['P(issue | alert)','P(alert | issue)','P(issue and alert)'],correct:1,why:'Sensitivity conditions on a real issue. To reverse the conditioning, you also need the prior and the false-positive rate.'},
 {q:'In the 80-order table, what is P(on time | express)?',a:['15/80','15/35','15/40'],correct:2,why:'Conditioning limits the denominator to the 40 express orders. Of those, 15 were on time.'},
 {q:'One fair die: what is P(even or greater than 3)?',a:['4/6','6/6','2/6'],correct:0,why:'The union is {2, 4, 5, 6}. Outcomes 4 and 6 are in both events and must not be counted twice.'},
 {q:'P(A) = 0.2, P(B) = 0.5, P(A and B) = 0.3. What should you do first?',a:['Calculate 0.3/0.5.','Check the model: the overlap cannot exceed P(A).','Treat the events as independent.'],correct:1,why:'These inputs are inconsistent. An intersection is a subset of A, so its probability cannot exceed 0.2.'},
 {q:'Two mutually exclusive events both have positive probability. Are they independent?',a:['Yes, because they are separate events.','Only if their probabilities are equal.','No: one occurring rules out the other.'],correct:2,why:'Their joint probability is zero but the product of their positive probabilities is greater than zero.'},
 {q:'With prior 0.4, sensitivity 0.8 and false-positive rate 0.4, what follows from two conditionally independent positive results?',a:['Posterior 8/11, about 72.73%.','Posterior about 81.63%, using the same probability multiplier twice.','Posterior 100%, because two results agree.'],correct:0,why:'The weighted likelihoods are 0.4 × 0.8² and 0.6 × 0.4². Normalize them. The next signal’s marginal changes after the first result.'},
 {q:'Choose a 3-person committee from 5 people, with no distinct roles. How many committees?',a:['60','10','125'],correct:1,why:'Order does not matter and no person is repeated: C(5,3) = 10. Sixty would assign three distinct roles.'},
 {q:'An event B has probability zero in the model. What is P(A | B) using the elementary ratio?',a:['Zero.','One.','Undefined.'],correct:2,why:'P(A ∩ B)/P(B) has a zero denominator. Do not silently turn an impossible conditioning event into a zero conditional probability.'}
 ];
 let index=0;const answers={};
 function quiz(){
 const q=questions[index];
 $('quiz').innerHTML=`<div class="quiz-top"><span>QUESTION ${index+1} OF ${questions.length}</span><span id="quiz-explored">${Object.keys(answers).length} explored</span></div><h3 id="quiz-question" tabindex="-1">${q.q}</h3><div class="quiz-answers" role="group" aria-labelledby="quiz-question">${q.a.map((answer,i)=>`<button data-answer="${i}" aria-pressed="false">${answer}</button>`).join('')}</div><p id="quiz-feedback" class="quiz-feedback" role="status" aria-atomic="true"></p><div class="quiz-nav"><button id="previous-question" ${index===0?'disabled':''}>← Previous</button><button id="next-question">${index===questions.length-1?'Start again ↺':'Next question →'}</button></div>`;
 const buttons=[...document.querySelectorAll('[data-answer]')],feedback=$('quiz-feedback');
 function updateAnswer(){
  const chosen=answers[index],answered=chosen!==undefined,right=chosen===q.correct;
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
  if(answers[index]===chosen)return;
  answers[index]=chosen;
  updateAnswer();
 }));
 $('previous-question').addEventListener('click',()=>{index--;quiz();$('quiz-question').focus({preventScroll:true});});
 $('next-question').addEventListener('click',()=>{
  if(index===questions.length-1){index=0;Object.keys(answers).forEach(key=>delete answers[key]);}
  else index++;
  quiz();$('quiz-question').focus({preventScroll:true});
 });
 updateAnswer();
}
function openAnchor(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=$(id);if(target?.tagName==='DETAILS')target.open=true;}
 window.addEventListener('hashchange',openAnchor);openAnchor();updateBayes();selectEvent('intersection');showCounts();quiz();
})();

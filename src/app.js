'use strict';
const $ = id => document.getElementById(id);
const base=[18,22,24,25,28,30,32,35,38,42,46];
let data=[...base,200], custom=false, sample=false, convention='exc';
const number=(x,d=2)=>x===null?'Undefined':(x!==0&&Math.abs(x)<10**(-d)?x.toLocaleString('en-US',{maximumSignificantDigits:3}):x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));
const money=x=>custom?x.toLocaleString('en-US',{maximumSignificantDigits:10}):'$'+number(x);
function chart(values,s) {
  const mobile=window.matchMedia('(max-width:700px)').matches;const w=mobile?400:620,h=mobile?300:275,left=45,right=16,top=25,bottom=42;
  const min=Math.min(0,...values), max=Math.max(0,...values);
  const extent=max-min || 1, lo=min<0?min-extent*.08:0, hi=max+extent*.12;
  const y=v=>top+(hi-v)/(hi-lo)*(h-top-bottom);
  const step=(w-left-right)/values.length, bar=Math.max(2,step*.62);
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="orders-title orders-desc"><title id="orders-title">${custom?'Your observations':'Order values'}, with mean and median</title><desc id="orders-desc">Values: ${values.join(', ')}. Mean ${number(s.mean)}, median ${number(s.median)}. The full data are listed below.</desc>`;
  for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,py=y(v);svg+=`<line x1="${left}" y1="${py}" x2="${w-right}" y2="${py}" stroke="#e5e9df"/><text x="${left-8}" y="${py+4}" text-anchor="end" fill="#617169" font-size="${mobile?14:10}">${number(v,0)}</text>`;}
  values.forEach((v,i)=>{const yy=Math.min(y(v),y(0)),bh=Math.max(1,Math.abs(y(v)-y(0)));svg+=`<rect x="${left+step*i+(step-bar)/2}" y="${yy}" width="${bar}" height="${bh}" rx="2" stroke="#637c66" stroke-width="1.4" fill="${(v>s.q3+1.5*s.iqr||v<s.q1-1.5*s.iqr)?'#bc4f24':'#b2c4ae'}"/><text x="${left+step*(i+.5)}" y="${h-bottom+19}" text-anchor="middle" fill="#617169" font-size="${values.length>20?(mobile?10:8):(mobile?14:10)}">${i+1}</text>`;});
  [[s.mean,'#173f36','4 3'],[s.median,'#bc4f24','2 3']].forEach(([v,c,d])=>{svg+=`<line x1="${left}" y1="${y(v)}" x2="${w-right}" y2="${y(v)}" stroke="${c}" stroke-width="2" stroke-dasharray="${d}"/>`;});
  svg+=`<text x="${left}" y="13" fill="#617169" font-size="${mobile?14:10}">${custom?'Value':'Order value ($)'}</text><text x="${(w+left)/2}" y="${h-5}" text-anchor="middle" fill="#617169" font-size="${mobile?14:10}">${custom?'Observation':'Order'} number</text></svg>`;
  $('order-chart').innerHTML=svg;
}
function update(){
  const s=Stats.describe(data,sample,convention);
  $('mean-caption').textContent=custom?'Total divided by count':'Revenue per order';$('mean').textContent=money(s.mean);$('median').textContent=money(s.median);$('sd').textContent=money(s.sd);$('sd-label').textContent=sample?'Sample SD':'Population SD';
  $('chart-title').textContent=custom?'Your observations':'The order book';$('observation-count').textContent=s.n+' observations';
  const gap=s.mean-s.median;const tolerance=Number.EPSILON*32*Math.max(1,Math.abs(s.mean),Math.abs(s.median));const flagged=s.sorted.filter(v=>v<s.q1-1.5*s.iqr||v>s.q3+1.5*s.iqr);$('chart-foot').textContent=flagged.length?'Values outside the 1.5 × IQR fences: '+flagged.map(money).join(', ')+'. Shown in orange. Investigate these values; do not remove them automatically.':'No values lie outside the 1.5 × IQR fences. This rule is only one way to flag unusual observations.';
  $('insight').textContent=gap>tolerance?`The mean is ${money(gap)} above the median. Check the chart: high values can pull the average upward.`:gap < -tolerance?`The mean is ${money(Math.abs(gap))} below the median. Check the chart for low values and other features.`:'The mean and median are the same at the displayed precision. That alone does not prove the distribution is symmetric.';
  $('data-values').textContent='Sorted values: '+s.sorted.map(x=>x.toLocaleString('en-US',{maximumSignificantDigits:12})).join(', ')+'.';
  $('mean-calculation').textContent=`Mean = total ÷ count = ${number(data.reduce((a,b)=>a+b,0))} ÷ ${s.n} = ${number(s.mean)}.`;
  const mid=Math.floor(s.n/2);
  $('median-calculation').textContent=s.n%2?`Median = the observation at position ${mid+1} in the sorted data = ${number(s.median)}.`:`Median = average of sorted positions ${mid} and ${mid+1} = (${number(s.sorted[mid-1])} + ${number(s.sorted[mid])}) ÷ 2 = ${number(s.median)}.`;
  $('mode-calculation').textContent=s.modes.length?'Repeated mode'+(s.modes.length>1?'s':'')+': '+s.modes.join(', ')+'.':'No repeated mode: all observed values occur once.';
  $('spread-values').innerHTML=[['Range',s.range],['Q₁',s.q1],['Q₃',s.q3],['IQR',s.iqr],[sample?'Sample variance':'Population variance',s.variance],['CV*',s.cv]].map(([label,value])=>`<span>${label}<b>${number(value)}${label==='CV*'&&value!==null?'%':''}</b></span>`).join('')+`<span class="micro">Current lab data · ${convention==='exc'?'exclusive':'inclusive'} quartiles.<br>*CV is meaningful only for suitable ratio-scale data with a positive mean.</span>`;
  $('shape-values').innerHTML=`<span>${sample?'Corrected sample':'Population-moment'} skewness<b>${number(s.skew,3)}</b></span><span>${sample?'Corrected sample':'Population-moment'} excess kurtosis<b>${number(s.excess,3)}</b></span><span class="micro">Current lab data. Constant data have undefined standardized shape measures.</span>`;
  chart(data,s);
}
function setScenario(name){
  custom=false; const vals={large:[...base,200],ordinary:[...base,50],repeat:[18,22,25,25,25,30,32,35,38,42,46,50]};data=vals[name];
  document.querySelectorAll('[data-scenario]').forEach(b=>{const active=b.dataset.scenario===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  $('slider-control').hidden=name==='repeat';$('outlier').value=data.at(-1);$('outlier-value').textContent='$'+data.at(-1);$('custom-data').value=data.join(', ');$('data-error').textContent='';update();
}
document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>setScenario(b.dataset.scenario)));
$('outlier').addEventListener('input',e=>{custom=false;data=[...base,Number(e.target.value)];$('outlier-value').textContent='$'+e.target.value;$('custom-data').value=data.join(', ');document.querySelectorAll('[data-scenario]').forEach(b=>{const active=(data.at(-1)===50&&b.dataset.scenario==='ordinary')||(data.at(-1)===200&&b.dataset.scenario==='large');b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});update();});
$('custom-form').addEventListener('submit',e=>{e.preventDefault();try{const values=Stats.parseValues($('custom-data').value);data=values;custom=true;$('data-error').textContent='';$('slider-control').hidden=true;document.querySelectorAll('[data-scenario]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});update();}catch(error){$('data-error').textContent=error.message;}});
$('sample').addEventListener('change',e=>{sample=e.target.checked;update();});$('quartile').addEventListener('change',e=>{convention=e.target.value;update();});$('depth').addEventListener('change',e=>document.body.classList.toggle('depth-on',e.target.checked));
const pairs={positive:{x:[1,2,3,4,5],y:[4,7,6,4,9],text:'An overall positive linear association, with substantial variation. These are the five original branches: advertising (x) and sales (y), both in $ thousands.'},negative:{x:[1,2,3,4,5],y:[9,7,6,4,2],text:'Larger x values tend to pair with smaller y values. This is a separate teaching example. The direction is negative; the near-straight pattern makes the magnitude close to 1.'},curve:{x:[-2,-1,0,1,2],y:[4,1,0,1,4],text:'In this separate teaching example, every y value equals x², yet the linear correlation is zero. A scatter plot reveals the relationship the summary misses.'}};
function plotPair(key){const p=pairs[key], r=Stats.correlation(p.x,p.y);$('r-value').textContent=number(r,4);$('r-insight').textContent=p.text;document.querySelectorAll('[data-pair]').forEach(b=>{const a=b.dataset.pair===key;b.classList.toggle('active',a);b.setAttribute('aria-pressed',a);});const w=390,h=230,L=35,R=20,T=18,B=35;const xmin=Math.min(...p.x),xmax=Math.max(...p.x),ymax=Math.max(...p.y);const px=x=>L+15+(x-xmin)/(xmax-xmin)*(w-L-R-30),py=y=>h-B-y/(ymax+1)*(h-B-T);let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="scatter-title scatter-desc"><title id="scatter-title">${key==='curve'?'Nonlinear':key} relationship</title><desc id="scatter-desc">Pairs: ${p.x.map((x,i)=>`(${x}, ${p.y[i]})`).join(', ')}. Pearson correlation ${number(r,4)}.</desc>`;for(let y=0;y<=ymax;y+=ymax>5?2:1){svg+=`<line x1="${L}" y1="${py(y)}" x2="${w-R}" y2="${py(y)}" stroke="#e4e8dd"/><text x="${L-10}" y="${py(y)+4}" text-anchor="end" fill="#617169" font-size="10">${y}</text>`;}p.x.forEach((x,i)=>{svg+=`<circle cx="${px(x)}" cy="${py(p.y[i])}" r="6" fill="#bc4f24"/><text x="${px(x)}" y="${h-B+20}" text-anchor="middle" fill="#617169" font-size="10">${x}</text>`;});svg+=`<text x="${w/2}" y="${h-2}" fill="#617169" font-size="10">x</text><text x="10" y="20" fill="#617169" font-size="10">y</text></svg>`;$('scatter').innerHTML=svg;}
document.querySelectorAll('[data-pair]').forEach(b=>b.addEventListener('click',()=>plotPair(b.dataset.pair)));
const questions=[{q:'You need a one-number description of a typical purchase on the $200 day. Which is the strongest answer?',a:['The median, $31, with a note about the large order.','The mean, $45, because it always describes a typical purchase.','Delete the $200 order before calculating anything.'],correct:0,why:'The median describes the middle purchase without letting the one large order dominate it. The mean still matters for revenue. Check unusual observations rather than deleting them automatically.'},{q:'Suppliers A and B both average five delivery days. What should you check next?',a:['Nothing: equal means imply equal reliability.','The spread and the actual delivery-time pattern.','Only which supplier has the larger maximum.'],correct:1,why:'Averages hide variation. The standard deviation, IQR and the distribution help assess consistency. Context, data quality and the number of observations also matter.'},{q:'A dataset has zero skewness and zero excess kurtosis. What can you conclude?',a:['The observations must follow a normal distribution.','Its mean must equal its median.','These two numbers alone do not establish normality.'],correct:2,why:'Matching these moments is not enough to identify a distribution. Inspect the data and use appropriate diagnostics. Even zero skewness alone does not establish symmetry.'},{q:'Ice-cream and summer-clothing sales are positively correlated. What is justified?',a:['Increasing ice-cream sales will cause more clothing sales.','The sales move together; weather may affect both.','One of the two datasets must be incorrect.'],correct:1,why:'Correlation is association. A common cause, such as weather, can drive both. A causal claim needs a credible design and assumptions, not just a correlation.'}];
let qi=0;const answers={};
function renderQuiz(){
 const q=questions[qi];
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
 $('previous-question').addEventListener('click',()=>{qi--;renderQuiz();$('quiz-question').focus({preventScroll:true});});
 $('next-question').addEventListener('click',()=>{
  if(qi===questions.length-1){qi=0;Object.keys(answers).forEach(key=>delete answers[key]);}
  else qi++;
  renderQuiz();$('quiz-question').focus({preventScroll:true});
 });
 updateAnswer();
}
function openAnchor(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const target=$(id);if(target&&target.tagName==='DETAILS')target.open=true;}
window.addEventListener('hashchange',openAnchor);openAnchor();update();plotPair('positive');renderQuiz();

window.addEventListener('resize',update);

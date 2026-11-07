'use strict';
(() => {
 const body=document.body;
 if(!body.classList.contains('class-one-case'))return;
 const parts=[...document.querySelectorAll('.case-part')];
 if(parts.length!==6)return;
 const controls=document.querySelector('.visual-path-controls');
 const all=document.getElementById('visual-show-all'),motion=document.getElementById('visual-motion');
 const progress=document.getElementById('visual-progress');
 const tail=[...document.querySelectorAll('.case-brief,.practice,.roadmap')];
 let current=0,showAll=false;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c1-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);
 reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){
  parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);
  tail.forEach(p=>p.hidden=!showAll&&current!==5);
  document.querySelectorAll('.case-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  progress.textContent=showAll?'All six steps · read at your pace':`Step ${current+1} of 6`;
  all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all six steps';
 }
 function reveal(focus=false){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=id&&document.getElementById(id);if(!target)return;
  const part=target.closest('.case-part');
  if(part)current=parts.indexOf(part);
  else if(tail.some(p=>p===target||p.contains(target)))current=5;
  display();
  for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  if(focus){const heading=target.matches('.case-part')?target.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}
 }
 all.addEventListener('click',()=>{showAll=!showAll;display();});
 window.addEventListener('hashchange',()=>reveal(true));
 // Same-anchor navigation still reveals a step if its display state was changed.
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 body.classList.add('c1-ready');controls.hidden=false;document.querySelectorAll('.visual-controls').forEach(c=>c.hidden=false);display();reveal(false);
 const values=[18,22,24,25,28,30,32,35,38,42,46,200];
 const centerCaptions={original:'Each bar is one purchase. Eleven are $18–$46; one is $200.',equal:'Picture the same $540 shared equally: 12 × $45. These equal shares illustrate the mean; they are not new observed orders.',middle:'Keep the original orders sorted. Positions 6 and 7 are $30 and $32. Their midpoint, $31, is the median.'};
 const spreadCaptions={spread:'One shared day scale. A clusters around five days; B is more spread out.',means:'Concept illustration only: all dots are stacked at their supplier’s mean of five days. This hides the actual variation. Show every delivery to restore it.',target:'Day 6 is included in the target. Only the two dots strictly beyond it, B’s 8 and 9 days, are late.'};
 const shapeCaptions={points:'Each dot is a purchase. Vertical spacing only separates the dots. The dollar scale stays fixed.',box:'Exclusive quartiles: the box runs from $24.25 to $41, with median $31. Whiskers stop at actual observations $18 and $46.',fence:'Upper fence: $41 + 1.5 × $16.75 = $66.125. The $200 purchase is beyond it. The fence is not the $46 whisker.'};
 function center(view){
  const root=document.getElementById('center-chart');
  root.querySelectorAll('.order-column').forEach((g,i)=>{const v=view==='equal'?45:values[i],bar=g.querySelector('rect'),label=g.querySelector('.bar-value');bar.style.y=(195-v*.7)+'px';bar.style.height=(v*.7)+'px';bar.classList.toggle('unusual',i===11&&view!=='equal');g.classList.toggle('middle-order',view==='middle'&&(i===5||i===6));label.style.transform=`translateY(${(values[i]-v)*.7}px)`;label.textContent='$'+v;});
  document.getElementById('center-caption').textContent=centerCaptions[view];
  root.querySelector('title').textContent=view==='equal'?'Same revenue redistributed into equal shares':view==='middle'?'The original orders with middle positions highlighted':'Twelve original order values';
  root.querySelector('desc').textContent=centerCaptions[view]+' Original orders: '+values.join(', ')+'. Mean $45. Median $31.';
 }
 function spread(view){const root=document.getElementById('supplier-chart');root.dataset.state=view;const raw=[[4,5,5,5,6],[1,2,5,8,9]],dots=[...root.querySelectorAll('.supplier-dot')];raw.forEach((row,r)=>{const stacks={};row.forEach((v,i)=>{const originalStack=stacks[v]||0;stacks[v]=originalStack+1;const dx=view==='means'?(5-v)*34:0,dy=view==='means'?(originalStack-i)*15:0;dots[r*5+i].style.transform=`translate(${dx}px,${dy}px)`;dots[r*5+i].classList.toggle('is-late',view==='target'&&v>6);});});document.getElementById('supplier-caption').textContent=spreadCaptions[view];root.querySelector('title').textContent=view==='means'?'Concept illustration: both suppliers average five days':'Observed supplier delivery times';root.querySelector('desc').textContent=spreadCaptions[view]+' Actual records: A 4, 5, 5, 5, 6. B 1, 2, 5, 8, 9 days.';}
 function shape(view){const root=document.getElementById('shape-chart');root.dataset.state=view;document.getElementById('shape-labels').dataset.state=view;document.getElementById('shape-caption').textContent=shapeCaptions[view];root.querySelector('title').textContent=view==='points'?'Twelve original purchases':view==='box'?'Original purchases and exclusive-quartile boxplot':'Original purchases, boxplot and upper outlier fence';root.querySelector('desc').textContent=shapeCaptions[view]+' Original order values in dollars: '+values.join(', ')+'.';}
 document.querySelectorAll('[data-visual]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.visual,view=button.dataset.view;document.querySelectorAll(`[data-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(key==='center')center(view);if(key==='spread')spread(view);if(key==='shape')shape(view);}));
 shape('points');
 // Print the original records, not a temporary redistributing/mean illustration.
 let printViews;
 window.addEventListener('beforeprint',()=>{printViews=[...document.querySelectorAll('[data-visual][aria-pressed="true"]')].map(b=>[b.dataset.visual,b.dataset.view]);body.classList.add('c1-printing');center('original');spread('target');shape('fence');});
 window.addEventListener('afterprint',()=>{if(printViews){for(const[key,view]of printViews){if(key==='center')center(view);if(key==='spread')spread(view);if(key==='shape')shape(view);}printViews=null;body.classList.remove('c1-printing');}});
})();

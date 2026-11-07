'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-two-case'))return;
 const parts=[...document.querySelectorAll('.c2-part')];if(parts.length!==8)return;
 const $=id=>document.getElementById(id),all=$('c2-show-all'),motion=$('c2-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;
 motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c2-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c2-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});$('c2-progress').textContent=showAll?'All eight steps · read at your pace':`Step ${current+1} of 8`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all eight steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=id&&$(id);if(!target)return;const part=target.closest('.c2-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(focus){const heading=target.matches('.c2-part')?target.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 function events(view){const selected={intersection:[4,6],union:[2,4,5,6],complement:[1,3,5]}[view];const cap={intersection:'AND keeps only 4 and 6: 2 of 6 equally likely outcomes.',union:'OR keeps 2, 4, 5 and 6. The overlap, 4 and 6, is counted once: 4 of 6.',complement:'NOT even keeps 1, 3 and 5: 3 of 6. Every outcome is either even or not even.'}[view];document.querySelectorAll('[data-die]').forEach(g=>{const keep=selected.includes(Number(g.dataset.die));g.classList.toggle('chosen',keep);g.querySelector('.c2-die-mark').textContent=keep?'✓ kept':'not kept';});$('c2-die-caption').textContent=cap;$('c2-die-title').textContent={intersection:'Even and greater than three',union:'Even or greater than three',complement:'Not even'}[view]+' on one fair die';$('c2-die-desc').textContent=cap;}
 function condition(view){const cap={joint:'Express AND on time: keep all 80 orders in the denominator. The 15 matching orders give 15/80 = 18.75%.',express:'On time GIVEN express: set aside standard orders. Of 40 express orders, 15 were on time: 15/40 = 37.5%.',ontime:'Express GIVEN on time: set aside late orders. Of 35 on-time orders, 15 were express: 15/35 ≈ 42.86%.'}[view];document.querySelectorAll('.c2-order-dot').forEach(dot=>dot.classList.toggle('outside',view==='express'?dot.dataset.orderGroup!=='express':view==='ontime'?dot.dataset.ontime!=='true':false));$('c2-condition-caption').textContent=cap;$('c2-orders-desc').textContent=cap+' Express: 15 on time and 25 late. Standard: 20 on time and 20 late. Each dot is one order.';const [label,denominator,result]={joint:['EXPRESS AND ON TIME',80,'18.75%'],express:['ON TIME GIVEN EXPRESS',40,'37.5%'],ontime:['EXPRESS GIVEN ON TIME',35,'42.86%']}[view];$('c2-condition-question').textContent=label;$('c2-condition-fraction').textContent=`15 / ${denominator}`;$('c2-condition-result').textContent=result;}
 function repeated(view){const n=Number(view),cap=['Before any signal: probability 40%, or odds 2:3.','One positive: odds 2:3 × 2 = 4:3. Convert to probability: 4/(4 + 3) ≈ 57.14%.','Two conditionally independent positives: odds 4:3 × 2 = 8:3. Probability is 8/(8 + 3) ≈ 72.73%, not 81.63%.'][n];document.querySelectorAll('.c2-signal').forEach(g=>{const visible=Number(g.dataset.signal)<=n;g.style.opacity=visible?'1':'0';g.setAttribute('aria-hidden',String(!visible));});$('c2-repeat-caption').textContent=cap;$('c2-repeat-desc').textContent=cap+' Fixed model: prior 40%, sensitivity 80%, false-positive rate 40%; results independent within each true state.';}
 const views={events:'intersection',condition:'express',repeated:'0'},actions={events,condition,repeated};
 function select(key,view){actions[key](view);views[key]=view;document.querySelectorAll(`[data-c2-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c2-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c2Visual,b.dataset.view)));
 body.classList.add('c2-ready');document.querySelector('.c2-path-controls').hidden=false;document.querySelectorAll('.c2-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};select('events','intersection');select('condition','joint');select('repeated','2');});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
})();

// Small comparisons leave every worked case visible without JavaScript.
(() => {
 document.querySelectorAll('.foundation-lab').forEach(lab => {
  const buttons=[...lab.querySelectorAll('[data-foundation-choice]')];
  const panels=[...lab.querySelectorAll('[data-foundation-panel]')];
  const controls=lab.querySelector('.foundation-controls');
  if(!controls || buttons.length!==panels.length || !buttons.length)return;
  function choose(index){
   panels.forEach((panel,i)=>{panel.hidden=i!==index;});
   buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  }
  buttons.forEach((button,i)=>button.addEventListener('click',()=>choose(i)));
  choose(0);controls.hidden=false;
 });
})();

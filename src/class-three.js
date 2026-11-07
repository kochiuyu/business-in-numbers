'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-three-case'))return;
 const parts=[...document.querySelectorAll('.c3-part')];if(parts.length!==15)return;
 const $=id=>document.getElementById(id),all=$('c3-show-all'),motion=$('c3-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c3-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c3-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});const title=parts[current].querySelector('h2').textContent.trim();$('c3-progress').textContent=showAll?`All fifteen steps · selected: ${title}`:`Step ${current+1} of ${parts.length} · ${title}`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all fifteen steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}// The hashless URL represents the first step, including after browser Back.
  // Leave scroll restoration to the browser and preserve the chosen reading mode.
  if(!id){current=0;display();return;}
  const target=id&&$(id);if(!target)return;const part=target.closest('.c3-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('technical')){body.classList.add('depth-on');$('depth').checked=true;}}if(focus){const heading=target.matches('.c3-part')||target.classList.contains('c3-step-anchor')?part.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 const views={distribution:'exact',moments:'mean',joint:'0.25',counts:'binomial',area:'half',normal:'center',decision:'2'};
 function select(key,view){if(!ClassThreeViews.views[key])return;$( `c3-${key}-result`).innerHTML=ClassThreeViews.views[key](view);views[key]=view;document.querySelectorAll(`[data-c3-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c3-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c3Visual,b.dataset.view)));
 body.classList.add('c3-ready');document.querySelector('.c3-path-controls').hidden=false;document.querySelectorAll('.c3-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};for(const[key,view]of Object.entries({distribution:'atmost',moments:'spread',joint:'0.25',counts:'binomial',area:'half',normal:'center',decision:'2'}))select(key,view);});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
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

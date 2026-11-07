'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-six-case'))return;

 // Added demonstrations retain their static default when JavaScript is unavailable.
 document.querySelectorAll('[data-c6-extra]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.c6Extra,value=button.dataset.value;
  document.getElementById('c6-extra-'+key).innerHTML=ClassSixViews.extraViews[key](value);
  document.querySelectorAll('[data-c6-extra="'+key+'"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
 document.querySelectorAll('.c6-extra-controls').forEach(group=>group.hidden=false);
 const parts=[...document.querySelectorAll('.c6-part')];if(parts.length!==12)return;
 const $=id=>document.getElementById(id),all=$('c6-show-all'),motion=$('c6-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c6-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c6-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});$('c6-progress').textContent=showAll?'All twelve steps · read at your pace':`Step ${current+1} of 12`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all twelve steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=id&&$(id);if(!target)return;const part=target.closest('.c6-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(focus){const heading=target.matches('.c6-part')?target.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 const views=Object.fromEntries(Object.entries(ClassSixViews.specs).map(([k,s])=>[k,s[3]]));
 function select(key,view){if(!ClassSixViews.views[key])return;$( `c6-${key}-result`).innerHTML=ClassSixViews.views[key](view);views[key]=view;document.querySelectorAll(`[data-c6-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c6-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c6Visual,b.dataset.view)));
 body.classList.add('c6-ready');document.querySelector('.c6-path-controls').hidden=false;document.querySelectorAll('.c6-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};for(const[key,view]of Object.entries({claim:'rule',power:'128',tails:'two',student:'t',interval:'two',proportion:'observed',design:'paired',independent:'welch',paired:'original',twoprop:'double',variance:'swap',decision:'plan'}))select(key,view);});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
})();

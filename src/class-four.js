'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-four-case'))return;

 // Added demonstrations retain their static default when JavaScript is unavailable.
 document.querySelectorAll('[data-c4-extra]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.c4Extra,value=button.dataset.value;
  document.getElementById('c4-extra-'+key).innerHTML=ClassFourViews.extraViews[key](value);
  document.querySelectorAll('[data-c4-extra="'+key+'"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
 document.querySelectorAll('.c4-extra-controls').forEach(group=>group.hidden=false);
 const parts=[...document.querySelectorAll('.c4-part')];if(parts.length!==10)return;
 const $=id=>document.getElementById(id),all=$('c4-show-all'),motion=$('c4-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c4-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c4-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});$('c4-progress').textContent=showAll?'All ten steps · read at your pace':`Step ${current+1} of 10`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all ten steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=id&&$(id);if(!target)return;const part=target.closest('.c4-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(focus){const heading=target.matches('.c4-part')?target.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 const views={design:'weekday',pairs:'20',precision:'1',lln:'4',clt:'1',known:'36',proportion:'count',student:'8',diagnosis:'outage',decision:'baseline'};
 function select(key,view){if(!ClassFourViews.views[key])return;$( `c4-${key}-result`).innerHTML=ClassFourViews.views[key](view);views[key]=view;document.querySelectorAll(`[data-c4-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c4-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c4Visual,b.dataset.view)));
 body.classList.add('c4-ready');document.querySelector('.c4-path-controls').hidden=false;document.querySelectorAll('.c4-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};for(const[key,view]of Object.entries({design:'all',pairs:'20',precision:'100',lln:'20',clt:'30',known:'36',proportion:'count',student:'8',diagnosis:'outage',decision:'larger'}))select(key,view);});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
})();

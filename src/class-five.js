'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-five-case'))return;

 // Added demonstrations retain their static default when JavaScript is unavailable.
 document.querySelectorAll('[data-c5-extra]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.c5Extra,value=button.dataset.value;
  document.getElementById('c5-extra-'+key).innerHTML=ClassFiveViews.extraViews[key](value);
  document.querySelectorAll('[data-c5-extra="'+key+'"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
 document.querySelectorAll('.c5-extra-controls').forEach(group=>group.hidden=false);
 const parts=[...document.querySelectorAll('.c5-part')];if(parts.length!==15)return;
 const $=id=>document.getElementById(id),all=$('c5-show-all'),motion=$('c5-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c5-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c5-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});const title=parts[current].querySelector('h2').textContent.trim();$('c5-progress').textContent=showAll?`All fifteen steps · selected: ${title}`:`Step ${current+1} of ${parts.length} · ${title}`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all fifteen steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}// The hashless URL represents the first step, including after browser Back.
  // Leave scroll restoration to the browser and preserve the chosen reading mode.
  if(!id){current=0;display();return;}
  const target=id&&$(id);if(!target)return;const part=target.closest('.c5-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('technical')){body.classList.add('depth-on');$('depth').checked=true;}}if(focus){const heading=target.matches('.c5-part')||target.classList.contains('c5-step-anchor')?part.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 const views={target:'sample',quality:'25',spread:'deviations',binary:'count',interval:'point',coverage:'one',student:'t',proportion:'48',planning:'3',rateplanning:'rate24',decision:'range'};
 function select(key,view){if(!ClassFiveViews.views[key])return;$( `c5-${key}-result`).innerHTML=ClassFiveViews.views[key](view);views[key]=view;document.querySelectorAll(`[data-c5-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c5-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c5Visual,b.dataset.view)));
 body.classList.add('c5-ready');document.querySelector('.c5-path-controls').hidden=false;document.querySelectorAll('.c5-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};for(const[key,view]of Object.entries({target:'estimate',quality:'100',spread:'variance',binary:'rate',interval:'95',coverage:'many',student:'t',proportion:'0',planning:'1.5',rateplanning:'rate50',decision:'range'}))select(key,view);});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
})();

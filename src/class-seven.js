'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-seven-case'))return;
 const parts=[...document.querySelectorAll('.c7-part')];if(parts.length!==18)return;
 const $=id=>document.getElementById(id),all=$('c7-show-all'),motion=$('c7-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c7-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c7-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});const title=parts[current].querySelector('h2').textContent.trim();$('c7-progress').textContent=showAll?`All eighteen steps · selected: ${title}`:`Step ${current+1} of ${parts.length} · ${title}`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all eighteen steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}// The hashless URL represents the first step, including after browser Back.
  // Leave scroll restoration to the browser and preserve the chosen reading mode.
  if(!id){current=0;display();return;}
  const target=id&&$(id);if(!target)return;const part=target.closest('.c7-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('technical')){body.classList.add('depth-on');$('depth').checked=true;}}if(focus){const heading=target.matches('.c7-part')||target.classList.contains('c7-step-anchor')?part.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)reveal(true);});
 const views=Object.fromEntries(Object.entries(ClassSevenViews.specs).map(([k,s])=>[k,s[3]]));
 function select(key,view){if(!ClassSevenViews.views[key])return;$( `c7-${key}-result`).innerHTML=ClassSevenViews.views[key](view);views[key]=view;document.querySelectorAll(`[data-c7-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c7-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c7Visual,b.dataset.view)));
 body.classList.add('c7-ready');document.querySelector('.c7-path-controls').hidden=false;document.querySelectorAll('.c7-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};for(const[key,view]of Object.entries({orders:'means',baseline:'equal',split:'parts',ratio:'original',reference:'original',report:'careful',cells:'replicated',additive:'actual',averages:'marginal',pieces:'whole',tests:'interaction',interaction:'default',design:'independent',decision:'report'}))select(key,view);});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
})();

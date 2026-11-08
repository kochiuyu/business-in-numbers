'use strict';
(() => {
 const body=document.body;if(!body.classList.contains('class-eight-case'))return;
 const parts=[...document.querySelectorAll('.c8-part')];if(parts.length!==19)return;
 const $=id=>document.getElementById(id),all=$('c8-show-all'),motion=$('c8-motion'),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,showAll=false;motion.checked=!reduce.matches;
 const setMotion=()=>body.classList.toggle('c8-no-motion',!motion.checked||reduce.matches);
 motion.addEventListener('change',setMotion);reduce.addEventListener?.('change',()=>{motion.checked=!reduce.matches;setMotion();});setMotion();
 function display(){parts.forEach((p,i)=>p.hidden=!showAll&&i!==current);document.querySelectorAll('.c8-route a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});const title=parts[current].querySelector('h2').textContent.trim();$('c8-progress').textContent=showAll?`All nineteen steps · selected: ${title}`:`Step ${current+1} of ${parts.length} · ${title}`;all.setAttribute('aria-pressed',String(showAll));all.textContent=showAll?'Return to one step':'Show all nineteen steps';}
 function reveal(focus=false){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}// The hashless URL represents the first step, including after browser Back.
  // Leave scroll restoration to the browser and preserve the chosen reading mode.
  if(!id){current=0;display();return;}
  const target=id&&$(id);if(!target)return;const part=target.closest('.c8-part');if(part)current=parts.indexOf(part);display();for(let p=target;p;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;if(p.classList.contains('technical')){body.classList.add('depth-on');$('depth').checked=true;}}if(focus){const heading=target.matches('.c8-part')||target.classList.contains('c8-step-anchor')?part.querySelector('h2'):target;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});target.scrollIntoView({behavior:reduce.matches||!motion.checked?'instant':'smooth',block:'start'});}}
 all.addEventListener('click',()=>{showAll=!showAll;display();});window.addEventListener('hashchange',()=>reveal(true));document.addEventListener('click',e=>{if(e.defaultPrevented||e.button>0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash){e.preventDefault();reveal(true);}});
 const views=Object.fromEntries(Object.entries(ClassEightViews.specs).map(([k,s])=>[k,s[3]]));
 function select(key,view){if(!ClassEightViews.views[key])return;$( `c8-${key}-result`).innerHTML=ClassEightViews.views[key](view);views[key]=view;document.querySelectorAll(`[data-c8-visual="${key}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));}
 document.querySelectorAll('[data-c8-visual]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.c8Visual,b.dataset.view)));
 body.classList.add('c8-ready');document.querySelector('.c8-path-controls').hidden=false;document.querySelectorAll('.c8-visual-controls').forEach(c=>c.hidden=false);for(const[key,view]of Object.entries(views))select(key,view);display();reveal(false);
 let printState;window.addEventListener('beforeprint',()=>{if(printState)return;printState={...views};for(const[key,view]of Object.entries({pairs:'trend',line:'slope',fit:'line',center:'tilt',units:'hundreds',assumptions:'inference',residuals:'squared',inference:'original',partition:'line',fitshare:'original',tests:'positive',mean:'center',individual:'both',challenge:'inside',decision:'report'}))select(key,view);});window.addEventListener('afterprint',()=>{if(!printState)return;for(const[key,view]of Object.entries(printState))select(key,view);printState=undefined;});
})();

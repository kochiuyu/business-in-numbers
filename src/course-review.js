(function(){'use strict';
 const slides=[...document.querySelectorAll('[data-review-slide]')];
 const start=document.getElementById('review-present');
 if(!start||!slides.length)return;
 const controls=document.querySelector('.review-controls'),count=document.getElementById('review-count');
 let active=0;
 function show(index){active=Math.max(0,Math.min(slides.length-1,index));slides.forEach((s,i)=>{s.classList.toggle('is-active',i===active);s.setAttribute('aria-hidden',i===active?'false':'true')});count.textContent=`${active+1} / ${slides.length}`;document.getElementById('review-prev').disabled=active===0;document.getElementById('review-next').disabled=active===slides.length-1;history.replaceState(null,'',`?present=1&slide=${slides[active].id}`);slides[active].querySelector('h2').setAttribute('tabindex','-1');slides[active].querySelector('h2').focus({preventScroll:true});window.scrollTo(0,0)}
 function enter(id){document.body.classList.add('review-present');controls.hidden=false;const index=slides.findIndex(s=>s.id===id);show(index<0?0:index)}
 function exit(){document.body.classList.remove('review-present');controls.hidden=true;slides.forEach(s=>{s.classList.remove('is-active');s.removeAttribute('aria-hidden')});history.replaceState(null,'',location.pathname);start.focus()}
 start.addEventListener('click',()=>enter('route'));document.getElementById('review-prev').addEventListener('click',()=>show(active-1));document.getElementById('review-next').addEventListener('click',()=>show(active+1));document.getElementById('review-exit').addEventListener('click',exit);
 document.addEventListener('keydown',e=>{if(!document.body.classList.contains('review-present')||e.altKey||e.ctrlKey||e.metaKey)return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();show(active+1)}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(active-1)}else if(e.key==='Home'){e.preventDefault();show(0)}else if(e.key==='End'){e.preventDefault();show(slides.length-1)}else if(e.key==='Escape'){e.preventDefault();exit()}});
 const params=new URLSearchParams(location.search);if(params.get('present')==='1')enter(params.get('slide'));
})();

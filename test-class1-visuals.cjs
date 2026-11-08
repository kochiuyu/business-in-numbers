'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const V=require('./scripts/class-one-visuals.cjs');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
const source=fs.readFileSync('src/class-one.js','utf8'),html=fs.readFileSync('dist/index.html','utf8'),css=fs.readFileSync('src/class-one.css','utf8');
const values=[18,22,24,25,28,30,32,35,38,42,46,200];eq(V.orders,values);eq(V.orders.reduce((a,b)=>a+b),540);eq(V.orders.reduce((a,b)=>a+b)/12,45);eq((V.orders[5]+V.orders[6])/2,31);
for(const name of ['records','center','shape','spread','relationship','briefing']){const h=V.render(name);ok(h.includes('visual-scene'),'scene '+name);ok(h.includes('<summary>'),'each scene includes a pause/reveal');ok(!h.includes('autoplay'));}
for(const mode of ['original','equal','middle']){const s=V.ordersChart(mode);const bars=[...s.matchAll(/class="visual-bar[^"]*" x="([\d.]+)" y="([\d.]+)" width="20" height="([\d.]+)"/g)];eq(bars.length,12);bars.forEach((b,i)=>{eq(+b[1],45+i*29);eq(+b[2]+ +b[3],195);eq(+b[3],(mode==='equal'?45:values[i])*.7);});}
for(const mode of ['spread','means','target']){const s=V.supplierChart(mode);const dots=[...s.matchAll(/class="supplier-dot[^"]*" cx="([\d.]+)" cy="([\d.]+)"/g)];eq(dots.length,10);[4,5,5,5,6,1,2,5,8,9].forEach((v,i)=>eq(+dots[i][1],40+(mode==='means'?5:v)*34));}
const shape=V.shapeChart('fence');const box=shape.match(/<rect x="([\d.]+)" y="150" width="([\d.]+)"/);ok(Math.abs(+box[1]-(30+24.25*1.7))<1e-10,'exclusive Q1 coordinate');ok(Math.abs(+box[2]-16.75*1.7)<1e-10,'IQR width');ok(shape.includes('x1="142.4125"'),'upper fence coordinate');
ok(css.includes('prefers-reduced-motion'));ok(css.includes('.c1-no-motion'));ok(css.includes('@media print'));ok(!/setInterval|setTimeout|requestAnimationFrame/.test(source),'no automatic animation or advance');
// Minimal DOM, built from the actual published HTML, executes real runtime.
class Element{
 constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.hidden='hidden'in attrs;this.open='open'in attrs;this.checked='checked'in attrs;this.style={};this.handlers={};this.dataset={};this.textContent='';this.focused=false;this.scrolled=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={contains:n=>(this.attrs.class||'').split(/\s/).includes(n),add:n=>this.attrs.class=(this.attrs.class||'')+' '+n,remove:n=>this.attrs.class=(this.attrs.class||'').split(/\s/).filter(c=>c!==n).join(' '),toggle:(n,v)=>{if(v===undefined)v=!this.classList.contains(n);if(v)this.classList.add(n);else this.classList.remove(n);}};}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}fire(k,event={}){for(const fn of this.handlers[k]||[])fn({target:this,...event});}
 matches(s){return s.split(',').some(sel=>{const attrs=[...sel.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,k,v])=>!(k in this.attrs)||(v!==undefined&&this.attrs[k]!==v)))return false;sel=sel.replace(/\[[^\]]+\]/g,'');const id=sel.match(/#([\w-]+)/);if(id&&this.attrs.id!==id[1])return false;const classes=[...sel.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);if(classes.some(c=>!this.classList.contains(c)))return false;const tag=sel.match(/^[a-z][a-z0-9-]*/i);return !tag||this.tagName===tag[0].toUpperCase();});}
 querySelectorAll(s){let result=[];for(const child of this.children){if(child.matches(s))result.push(child);result.push(...child.querySelectorAll(s));}return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){for(let p=this;p;p=p.parentElement)if(p.matches(s))return p;return null;}contains(n){for(let p=n;p;p=p.parentElement)if(p===this)return true;return false;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function dom(){const root=new Element('document'),stack=[root],voids=new Set(['META','LINK','BR','INPUT','HR','IMG','SOURCE','WBR']);let clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'');for(const m of clean.matchAll(/<\/?([a-z][a-z\d-]*)\b([^>]*?)>/gi)){const closing=m[0].startsWith('</');if(closing){if(stack.at(-1).tagName===m[1].toUpperCase())stack.pop();continue;}const attrs={};for(const a of m[2].matchAll(/([a-z][\w:-]*)(?:="([^"]*)")?/gi))attrs[a[1]]=a[2]??'';const el=new Element(m[1],attrs);el.parentElement=stack.at(-1);el.parentElement.children.push(el);if(!voids.has(el.tagName)&&!m[0].endsWith('/>'))stack.push(el);}root.body=root.querySelector('body');root.getElementById=id=>root.querySelector('#'+id);for(const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)){const el=root.getElementById(m[1]);if(el)el.textContent=m[2].replace(/<[^>]*>/g,'');}return root;}
function run(reduced,hash=''){const d=dom(),events={},loc={hash},media={matches:reduced,addEventListener:(k,f)=>media[k]=f};const w={matchMedia:()=>media,addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(source,{document:d,window:w,location:loc});return{d,events,loc,media};}
for(const reduced of [false,true]){
 const{d,events,loc,media}=run(reduced);const parts=d.querySelectorAll('.case-part'),visible=()=>parts.map((p,i)=>!p.hidden?i+1:null).filter(Boolean),fire=k=>(events[k]||[]).forEach(fn=>fn());
 eq(visible(),[1]);eq(d.getElementById('visual-motion').checked,!reduced);eq(d.body.classList.contains('c1-no-motion'),reduced);
 for(const [i,topic] of ['records','tables','charts','mean','median','mode','quartiles','variance','sd-cv','skewness','kurtosis','covariance','correlation','briefing'].entries()){loc.hash='#class1-'+topic;fire('hashchange');eq(visible(),[i+1]);ok(parts[i].querySelector('h2').focused);ok(d.getElementById('visual-progress').textContent.includes('of 14'),'progress uses actual fourteen-step total');}
 for(const [i,n] of [1,4,7,8,10,11,13,14].entries()){loc.hash='#class1-step-'+(i+1);fire('hashchange');eq(visible(),[n],'old numbered aliases retain semantic meaning');}
 for(const [id,n] of [['case-part-1',1],['case-part-2',4],['case-part-3',8],['case-part-4',7],['case-part-5',13],['case-part-6',14]]){loc.hash='#'+id;fire('hashchange');eq(visible(),[n],'legacy link retains semantic destination');}
 loc.hash='#lab';fire('hashchange');eq(visible(),[4]);ok(d.getElementById('lab').closest('details').open);
 loc.hash='#graph-panel-box';fire('hashchange');eq(visible(),[3]);ok(!d.getElementById('graph-panel-box').closest('details'),'chart is not hidden in a disclosure');
 d.getElementById('visual-show-all').fire('click');eq(visible(),[1,2,3,4,5,6,7,8,9,10,11,12,13,14]);d.getElementById('visual-show-all').fire('click');eq(visible(),[3]);
 loc.hash='#practice';fire('hashchange');eq(visible(),[14]);ok(!d.getElementById('practice').hidden);
 const pick=(key,view)=>d.querySelector(`[data-visual="${key}"][data-view="${view}"]`).fire('click');
 pick('center','equal');for(const b of d.querySelectorAll('.visual-bar'))eq(b.style.height,'31.499999999999996px');ok(d.getElementById('center-caption').textContent.includes('not new observed orders'));
 pick('center','middle');eq(d.querySelectorAll('.middle-order').length,2);d.querySelectorAll('.visual-bar').forEach((b,i)=>eq(b.style.height,(values[i]*.7)+'px'));
 pick('spread','means');eq(d.getElementById('supplier-chart').dataset.state,'means');ok(d.getElementById('supplier-caption').textContent.includes('Concept illustration only'));pick('spread','target');eq(d.querySelectorAll('.is-late').length,2);
 for(const state of ['box','fence','points']){pick('shape',state);eq(d.getElementById('shape-chart').dataset.state,state);eq(d.getElementById('shape-labels').dataset.state,state);ok(d.getElementById('shape-chart').querySelector('desc').textContent.includes(state==='points'?'Each dot':state==='box'?'Whiskers stop':'Upper fence:'));}
 pick('center','equal');pick('spread','means');fire('beforeprint');d.querySelectorAll('.visual-bar').forEach((b,i)=>eq(b.style.height,(values[i]*.7)+'px'));eq(d.getElementById('supplier-chart').dataset.state,'target');fire('afterprint');d.querySelectorAll('.visual-bar').forEach(b=>eq(b.style.height,'31.499999999999996px'));eq(d.getElementById('supplier-chart').dataset.state,'means');
 d.getElementById('visual-motion').checked=false;d.getElementById('visual-motion').fire('change');ok(d.body.classList.contains('c1-no-motion'));
 loc.hash='#%bad';fire('hashchange');loc.hash='#missing';fire('hashchange');ok(true,'malformed and absent anchors safe');
}
for(const hash of ['#lab','#graph-panel-box','#case-brief']){const{d}=run(false,hash);const target=d.getElementById(hash.slice(1));ok(!target.closest('.case-part')?.hidden,'deep link visible');}
const staticDOM=dom();eq(staticDOM.querySelectorAll('.case-part').filter(p=>!p.hidden).length,14,'all scenes available with no JS');eq(staticDOM.querySelectorAll('.visual-controls').filter(p=>p.hidden).length,3,'inactive controls hidden without JS');eq(staticDOM.querySelectorAll('.visual-practice').length,4,'original practice retained');
// Browser history can return to the original URL without a fragment.
for(const reduced of [false,true]){
 const {d,events,loc}=run(reduced),parts=d.querySelectorAll('.case-part');
 const visible=()=>parts.filter(p=>!p.hidden).map(p=>p.attrs.id);
 const navigate=hash=>{loc.hash=hash;for(const fn of events.hashchange||[])fn();};
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'advance from initial URL');
 navigate('');eq(visible(),[parts[0].attrs.id],'Back to hashless URL restores first step');
 eq(d.querySelectorAll('.case-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'Forward restores later step');
 navigate('#main');eq(visible(),[parts[1].attrs.id],'Back to top preserves current step');
 navigate('#');eq(visible(),[parts[0].attrs.id],'empty fragment uses initial step');
 d.getElementById('visual-show-all').fire('click');navigate('#'+parts[1].attrs.id);navigate('');
 eq(visible(),parts.map(p=>p.attrs.id),'history preserves the show-all preference');
 d.getElementById('visual-show-all').fire('click');eq(visible(),[parts[0].attrs.id],'return to one step uses restored history');
 navigate('#'+parts[1].attrs.id);navigate('#missing');eq(visible(),[parts[1].attrs.id],'unknown anchor does not reset lesson');
}
ok(html.includes('<a href="#main">Back to top'),'top link remains separate from the initial history state');

checks+=require('./scripts/test-readability.cjs')({run,dom,html,partSelector:'.case-part',progressId:'visual-progress',showAllId:'visual-show-all',expectedExtensions:6});

console.log(`Passed ${checks} Class 1 visual arithmetic, graph geometry, progressive disclosure, no-JS markup, reduced-motion, navigation, keyboard-focus and print-state assertions.`);

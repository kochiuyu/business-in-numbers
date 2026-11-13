'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const V=require('./scripts/class-two-visuals.cjs');
const legacyStepIDs=['prob-step-1','prob-step-2','prob-step-3','prob-independence','prob-step-4','prob-step-5','prob-odds','prob-step-6','prob-sequential','prob-step-7','prob-step-8'];
const stepIDs=['prob-step-1','prob-step-2','prob-sequential','prob-step-7','prob-step-3','prob-independence','prob-step-4','prob-step-5','prob-odds','prob-step-6','prob-step-8'];
const newPosition=n=>stepIDs.indexOf(legacyStepIDs[n-1])+1;
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
const source=fs.readFileSync('src/class-two.js','utf8'),html=fs.readFileSync('dist/probability.html','utf8'),css=fs.readFileSync('src/class-two.css','utf8');
for(const name of ['outcomes','overlap','condition','independence','paths','odds-first','repeated','sequential','counting','brief']){const h=V.render(name);ok(h.includes('c2-scene'));ok(h.includes('<summary>'));}
function topics(s){const out=[];const re=/<\/?details\b[^>]*>/g;let m,depth=0,start=-1;while((m=re.exec(s))){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,re.lastIndex).replace(' open>','>'));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
eq(topics(fs.readFileSync('src/probability.html','utf8')).map(text=>crypto.createHash('sha256').update(text).digest('hex')).sort(),JSON.parse(fs.readFileSync('test-class2-reference.json','utf8')).topic_sha256.slice().sort(),'all ten complete original topic disclosures preserved');
eq((html.match(/class="lesson"/g)||[]).length,10);eq((html.match(/class="visual-practice"/g)||[]).length,4);eq((html.match(/data-math="/g)||[]).length,23);
ok(css.includes('prefers-reduced-motion'));ok(css.includes('.c2-no-motion'));ok(css.includes('@media print'));ok(!/setInterval|setTimeout|requestAnimationFrame/.test(source),'no autoplay or timed progression');
class Element{
 constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.hidden='hidden'in attrs;this.open='open'in attrs;this.checked='checked'in attrs;this.style={};this.handlers={};this.dataset={};this.textContent='';this.focused=false;this.scrolled=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={contains:n=>(this.attrs.class||'').split(/\s/).includes(n),add:n=>this.attrs.class=(this.attrs.class||'')+' '+n,remove:n=>this.attrs.class=(this.attrs.class||'').split(/\s/).filter(c=>c!==n).join(' '),toggle:(n,v)=>{if(v===undefined)v=!this.classList.contains(n);if(v)this.classList.add(n);else this.classList.remove(n);}};}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}fire(k,event={}){for(const fn of this.handlers[k]||[])fn({target:this,...event});}
 matches(s){return s.split(',').some(sel=>{sel=sel.trim();if(sel.includes(' ')){const bits=sel.split(/\s+/),last=bits.pop();return this.matches(last)&&!!this.parentElement?.closest(bits.join(' '));}const attrs=[...sel.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,k,v])=>!(k in this.attrs)||(v!==undefined&&this.attrs[k]!==v)))return false;sel=sel.replace(/\[[^\]]+\]/g,'');const id=sel.match(/#([\w-]+)/);if(id&&this.attrs.id!==id[1])return false;const classes=[...sel.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);if(classes.some(c=>!this.classList.contains(c)))return false;const tag=sel.match(/^[a-z][a-z0-9-]*/i);return !tag||this.tagName===tag[0].toUpperCase();});}
 querySelectorAll(s){let result=[];for(const child of this.children){if(child.matches(s))result.push(child);result.push(...child.querySelectorAll(s));}return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){for(let p=this;p;p=p.parentElement)if(p.matches(s))return p;return null;}contains(n){for(let p=n;p;p=p.parentElement)if(p===this)return true;return false;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function dom(){const root=new Element('document'),stack=[root],voids=new Set(['META','LINK','BR','INPUT','HR','IMG','SOURCE','WBR']);let clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'');for(const m of clean.matchAll(/<\/?([a-z][a-z\d-]*)\b([^>]*?)>/gi)){const closing=m[0].startsWith('</');if(closing){if(stack.at(-1).tagName===m[1].toUpperCase())stack.pop();continue;}const attrs={};for(const a of m[2].matchAll(/([a-z][\w:-]*)(?:="([^"]*)")?/gi))attrs[a[1]]=a[2]??'';const el=new Element(m[1],attrs);el.parentElement=stack.at(-1);el.parentElement.children.push(el);if(!voids.has(el.tagName)&&!m[0].endsWith('/>'))stack.push(el);}root.body=root.querySelector('body');root.getElementById=id=>root.querySelector('#'+id);for(const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)){const el=root.getElementById(m[1]);if(el)el.textContent=m[2].replace(/<[^>]*>/g,'');}return root;}
function run(reduced,hash=''){const d=dom(),events={},loc={hash},media={matches:reduced,addEventListener:(k,f)=>media[k]=f};const w={matchMedia:()=>media,addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(source,{document:d,window:w,location:loc});return{d,events,loc,media};}

for(const reduced of [false,true]){
 const{d,events,loc}=run(reduced);const parts=d.querySelectorAll('.c2-part'),visible=()=>parts.map((p,i)=>!p.hidden?i+1:null).filter(Boolean),fire=k=>(events[k]||[]).forEach(fn=>fn());
 eq(visible(),[1]);eq(d.getElementById('c2-motion').checked,!reduced);eq(d.body.classList.contains('c2-no-motion'),reduced);eq(d.querySelectorAll('.c2-route a').length,11);
 for(let n=2;n<=11;n++){loc.hash='#'+stepIDs[n-1];fire('hashchange');eq(visible(),[n]);ok(parts[n-1].querySelector('h2').focused);eq(d.querySelectorAll('.c2-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);}
 for(const[id,n]of [['events',1],['event-operations',2],['rules',2],['conditional',3],['total-probability',5],['independence',4],['bayes-lab',6],['bayes',6],['odds',8],['counting',10],['tools',11],['practice',11],['c2-language-events',2],['c2-mix-rates',5],['c2-negative-alert',6],['c2-distinct-roles',10]]){loc.hash='#'+id;fire('hashchange');eq(visible(),[newPosition(n)],id+' visible');let el=d.getElementById(id);for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')ok(p.open,id+' ancestor opened');}
 d.getElementById('c2-show-all').fire('click');eq(visible(),Array.from({length:11},(_,i)=>i+1));d.getElementById('c2-show-all').fire('click');eq(visible(),[newPosition(10)]);
 const pick=(key,view)=>d.querySelector(`[data-c2-visual="${key}"][data-view="${view}"]`).fire('click');
 for(const[key,count]of [['intersection',2],['union',4],['complement',3],['union',4]]){pick('events',key);eq(d.querySelectorAll('.c2-die-tile.chosen').length,count);ok(d.getElementById('c2-die-desc').textContent.includes('6'));}
 eq(d.querySelectorAll('.c2-order-dot').length,80);eq(d.querySelectorAll('.c2-order-dot.ontime').length,35);eq(d.querySelectorAll('.c2-order-dot.numerator').length,15);
 for(const[key,count,den]of [['express',40,40],['ontime',45,35],['joint',0,80],['express',40,40]]){pick('condition',key);eq(d.querySelectorAll('.c2-order-dot.outside').length,count);eq(d.getElementById('c2-condition-fraction').textContent,'15 / '+den);}
 for(const n of ['0','1','2','0']){pick('repeated',n);eq(d.querySelectorAll('.c2-signal').filter(g=>g.style.opacity==='1').length,Number(n)+1);eq(d.querySelectorAll('.c2-signal').filter(g=>g.getAttribute('aria-hidden')==='false').length,Number(n)+1);}
 pick('events','union');pick('condition','ontime');pick('repeated','1');fire('beforeprint');eq(d.querySelectorAll('.c2-die-tile.chosen').length,2);eq(d.querySelectorAll('.c2-order-dot.outside').length,0);eq(d.querySelectorAll('.c2-signal').filter(g=>g.style.opacity==='1').length,3);fire('afterprint');eq(d.querySelectorAll('.c2-die-tile.chosen').length,4);eq(d.querySelectorAll('.c2-order-dot.outside').length,45);eq(d.querySelectorAll('.c2-signal').filter(g=>g.style.opacity==='1').length,2);
 d.getElementById('c2-motion').checked=false;d.getElementById('c2-motion').fire('change');ok(d.body.classList.contains('c2-no-motion'));
 loc.hash='#%bad';fire('hashchange');loc.hash='#missing';fire('hashchange');ok(true);
}
for(const[id,n]of [['c2-negative-alert',6],['tools',11],['bayes-tree',6],['prob-step-6',8]]){const{d}=run(false,'#'+id);ok(!d.getElementById(legacyStepIDs[n-1]).hidden,id+' direct deep link');}
for(const [i,id] of stepIDs.entries()){for(const anchor of [id,'class2-step-'+(legacyStepIDs.indexOf(id)+1)]){const {d}=run(false,'#'+anchor);eq(d.querySelectorAll('.c2-part').filter(p=>!p.hidden).map(p=>p.attrs.id),[id],anchor+' direct route');}}
const staticDOM=dom();eq(staticDOM.querySelectorAll('.c2-part').filter(p=>!p.hidden).length,11,'all scenes visible without JS');eq(staticDOM.querySelectorAll('.c2-visual-controls').filter(p=>p.hidden).length,3,'inactive controls hidden without JS');eq(staticDOM.querySelectorAll('.c2-signal').length,3,'all repeated-evidence points rendered without JS');
const plot=V.repeatedChart();for(const [i,p]of [.4,4/7,8/11].entries())ok(plot.includes(`cx="${90+i*120}" cy="${220-p*180}"`),'independent probability coordinate '+i);
// Browser history can return to the original URL without a fragment.
for(const reduced of [false,true]){
 const {d,events,loc}=run(reduced),parts=d.querySelectorAll('.c2-part');
 const visible=()=>parts.filter(p=>!p.hidden).map(p=>p.attrs.id);
 const navigate=hash=>{loc.hash=hash;for(const fn of events.hashchange||[])fn();};
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'advance from initial URL');
 navigate('');eq(visible(),[parts[0].attrs.id],'Back to hashless URL restores first step');
 eq(d.querySelectorAll('.c2-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'Forward restores later step');
 navigate('#main');eq(visible(),[parts[1].attrs.id],'Back to top preserves current step');
 navigate('#');eq(visible(),[parts[0].attrs.id],'empty fragment uses initial step');
 d.getElementById('c2-show-all').fire('click');navigate('#'+parts[1].attrs.id);navigate('');
 eq(visible(),parts.map(p=>p.attrs.id),'history preserves the show-all preference');
 d.getElementById('c2-show-all').fire('click');eq(visible(),[parts[0].attrs.id],'return to one step uses restored history');
 navigate('#'+parts[1].attrs.id);navigate('#missing');eq(visible(),[parts[1].attrs.id],'unknown anchor does not reset lesson');
}
ok(html.includes('<a href="#main">Back to top'),'top link remains separate from the initial history state');

// Readability pilot: named progress, all moved anchors, and complete print restoration.
ok(html.includes('all orders, all issue orders, or all alerted orders?'),'live prediction uses groups, not stale default counts');
ok(!html.includes('all 10,000 orders, the 100 issues, or the 585 alerts?'),'no stale static denominator in live prediction');
for(const[id,step]of [['c2-overlap-cells', 2], ['foundation-replacement', 3], ['foundation-event-relationship', 4], ['third-alert-decision', 6], ['c2-bag-weights', 6], ['second-conditional-signals', 8], ['c2-odds-parts', 7], ['foundation-dice', 10], ['c2-count-allowed', 9]]){const{d}=run(false,'#'+id);const target=d.getElementById(id);ok(!target.closest('.c2-part').hidden,id+' first-load step visible');let outer=target.closest('[data-reading-extension]');ok(outer&&outer.open,id+' native extension opens');ok(d.getElementById('c2-progress').textContent.includes('Step '+newPosition(step)+' of 11'),id+' step progress');ok(d.getElementById('c2-progress').textContent.includes(target.closest('.c2-part').querySelector('h2').textContent),id+' named current step');}
{const{d,events}=run(false),extensions=d.querySelectorAll('[data-reading-extension]');eq(extensions.length,9);ok(extensions.every(x=>!x.open),'extensions initially closed');const mathWindow={addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(fs.readFileSync('src/math-ui.js','utf8'),{document:d,window:mathWindow});const fire=k=>(events[k]||[]).forEach(fn=>fn());extensions[0].open=true;fire('beforeprint');ok(extensions.every(x=>x.open),'print opens all extensions');fire('afterprint');ok(extensions[0].open&&!extensions.slice(1).some(x=>x.open),'print restores extension state');}

console.log(`Passed ${checks} Class 2 visual math, content preservation, staged navigation, deep links, motion, static fallback and print restoration assertions.`);

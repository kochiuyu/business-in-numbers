"use strict";
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const V=require('./src/class-seven-visuals.js'),A=require('./src/anova-core.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},near=(a,b)=>ok(Math.abs(a-b)<1e-10);
const source=fs.readFileSync('src/class-seven.js','utf8'),html=fs.readFileSync('dist/anova.html','utf8'),css=fs.readFileSync('src/class-seven.css','utf8'),reference=JSON.parse(fs.readFileSync('test-class7-reference.json','utf8'));
function topics(s){const out=[];const re=/<\/?details\b[^>]*>/g;let m,depth=0,start=-1;while((m=re.exec(s))){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,re.lastIndex));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
eq(topics(fs.readFileSync('src/anova.html','utf8')).map(t=>crypto.createHash('sha256').update(t).digest('hex')),reference.topic_sha256,'all 14 original topic bodies unchanged');
for(const[f,hash]of Object.entries(reference.other_pages).filter(([f])=>f!=='regression.html'))eq(crypto.createHash('sha256').update(fs.readFileSync('dist/'+f)).digest('hex'),hash,'unchanged page '+f);
eq((html.match(/<math xmlns=/g)||[]).length,29);eq((html.match(/class="visual-practice"/g)||[]).length,4);
const choices=Object.fromEntries(Object.entries(V.specs).map(([k,s])=>[k,s[4].map(b=>b[0])]));
for(const[key,values]of Object.entries(choices)){ok(V.render(key).includes('Pause'));ok(V.render(key).includes('c7-scene'));for(const v of values){const out=V.views[key](v);ok(out.length>200);ok(!/NaN|undefined/.test(out),key+' '+v);for(const match of out.matchAll(/<svg[\s\S]*?<\/svg>/g)){ok(match[0].includes('role="img"'));ok(match[0].includes('<title'));ok(match[0].includes('<desc'));}}}
// SVG geometry is serialized deterministically across supported JavaScript runtimes.
for(const view of ['observed','noise']){const curve=V.views.reference(view).match(/class="c7-curve" d="([^"]+)"/)[1];ok(!/\d+\.\d{7,}/.test(curve),'stable SVG coordinate precision');}
// Independent hand arithmetic and SciPy reference values, not rounded before decisions.
const d=A.oneWay(),n=A.oneWay(V.noisy()),two=A.twoWay(),parallel=A.twoWay(A.PARALLEL),cross=A.twoWay(A.CROSSOVER);
near(d.grandMean,71/3);near(d.between.ss,296/3);near(d.within.ss,24);near(d.total.ss,368/3);near(d.F,18.5);near(d.p,.0006481582449937734);near(d.crit,4.25649472909375);
near(n.between.ss,d.between.ss);near(n.within.ss,96);near(n.F,4.625);near(n.p,.041534442254147215);eq(n.means,d.means);
near(two.A.ss,192);near(two.B.ss,300);near(two.AB.ss,48);near(two.error.ss,32);near(two.total.ss,572);near(two.error.ms,4);
near(two.A.F,48);near(two.B.F,75);near(two.AB.F,12);near(two.AB.p,.00851626337090127);eq(two.interactions,[[2,-2],[-2,2]]);eq(two.additive,[[18,28],[26,36]]);
near(parallel.AB.F,0);near(parallel.AB.p,1);near(cross.A.F,0);near(cross.AB.F,108);eq(cross.meansA,[26,26]);
ok(V.views.ratio('noise').includes('4.625'));ok(V.views.reference('original').includes('0.000648'));ok(V.views.reference('noise').includes('0.041534'));
ok(V.views.baseline('weighted').includes('24.83'));ok(V.views.baseline('weighted').includes('hypothetical'));ok(V.views.split('parts').includes('cross-terms cancel'));
ok(V.views.report('careful').includes('which pairs'));ok(V.views.cells('single').includes('0 error df'));ok(V.views.additive('actual').includes('38'));ok(V.views.additive('additive').includes('36'));
ok(V.views.averages('marginal').includes('Plain $23'));ok(V.views.averages('marginal').includes('Weekend $32'));ok(V.views.pieces('within').includes('32/8 = 4'));
for(const view of ['default','parallel','crossover'])ok(V.views.interaction(view).includes('same 16–40 dollar scale'));
ok(V.views.interaction('crossover').includes('−$12'));ok(V.views.interaction('crossover').includes('zero average'));ok(V.views.interaction('parallel').includes('not prove population interaction is zero'));
ok(V.views.design('copies').includes('1 independent unit'));ok(V.views.decision('report').includes('Spend is not profit'));
ok(css.includes('prefers-reduced-motion'));ok(css.includes('.c7-no-motion'));ok(css.includes('@media print'));ok(css.includes('.c7-part[hidden]{display:block!important}'));ok(!/setTimeout|setInterval|requestAnimationFrame/.test(source));
class Element{
 constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.hidden='hidden'in attrs;this.open='open'in attrs;this.checked='checked'in attrs;this.style={};this.handlers={};this.dataset={};this.textContent='';this.focused=false;this.scrolled=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={contains:n=>(this.attrs.class||'').split(/\s/).includes(n),add:n=>this.attrs.class=(this.attrs.class||'')+' '+n,remove:n=>this.attrs.class=(this.attrs.class||'').split(/\s/).filter(c=>c!==n).join(' '),toggle:(n,v)=>{if(v===undefined)v=!this.classList.contains(n);if(v)this.classList.add(n);else this.classList.remove(n);}};}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}fire(k,event={}){for(const fn of this.handlers[k]||[])fn({target:this,...event});}
 matches(s){return s.split(',').some(sel=>{sel=sel.trim();if(sel.includes(' ')){const bits=sel.split(/\s+/),last=bits.pop();return this.matches(last)&&!!this.parentElement?.closest(bits.join(' '));}const attrs=[...sel.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,k,v])=>!(k in this.attrs)||(v!==undefined&&this.attrs[k]!==v)))return false;sel=sel.replace(/\[[^\]]+\]/g,'');const id=sel.match(/#([\w-]+)/);if(id&&this.attrs.id!==id[1])return false;const classes=[...sel.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);if(classes.some(c=>!this.classList.contains(c)))return false;const tag=sel.match(/^[a-z][a-z0-9-]*/i);return !tag||this.tagName===tag[0].toUpperCase();});}
 querySelectorAll(s){let result=[];for(const child of this.children){if(child.matches(s))result.push(child);result.push(...child.querySelectorAll(s));}return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){for(let p=this;p;p=p.parentElement)if(p.matches(s))return p;return null;}contains(n){for(let p=n;p;p=p.parentElement)if(p===this)return true;return false;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function dom(){const root=new Element('document'),stack=[root],voids=new Set(['META','LINK','BR','INPUT','HR','IMG','SOURCE','WBR']);let clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'');for(const m of clean.matchAll(/<\/?([a-z][a-z\d-]*)\b([^>]*?)>/gi)){const closing=m[0].startsWith('</');if(closing){if(stack.at(-1).tagName===m[1].toUpperCase())stack.pop();continue;}const attrs={};for(const a of m[2].matchAll(/([a-z][\w:-]*)(?:="([^"]*)")?/gi))attrs[a[1]]=a[2]??'';const el=new Element(m[1],attrs);el.parentElement=stack.at(-1);el.parentElement.children.push(el);if(!voids.has(el.tagName)&&!m[0].endsWith('/>'))stack.push(el);}root.body=root.querySelector('body');root.getElementById=id=>root.querySelector('#'+id);for(const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)){const el=root.getElementById(m[1]);if(el)el.textContent=m[2].replace(/<[^>]*>/g,'');}return root;}
function run(reduced,hash=''){const d=dom(),events={},loc={hash},media={matches:reduced,addEventListener:(k,f)=>media[k]=f};const w={matchMedia:()=>media,addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(source,{document:d,window:w,location:loc,ClassSevenViews:V});return{d,events,loc,media};}
const anchors=[['grouped-data',1],['one-model',2],['one-decomposition',3],['one-test',4],['one-form',4],['one-proof',5],['one-interpretation',6],['two-design',7],['two-model',8],['two-estimation',9],['two-decomposition',10],['two-tests',11],['interaction-lab',12],['two-form',12],['model-checks',13],['tools',14],['practice',14]];
for(const reduced of [false,true]){
 const{d,events,loc,media}=run(reduced),parts=d.querySelectorAll('.c7-part'),visible=()=>parts.map((p,i)=>!p.hidden?i+1:null).filter(Boolean),fire=k=>(events[k]||[]).forEach(fn=>fn());
 eq(visible(),[1]);eq(d.getElementById('c7-motion').checked,!reduced);eq(d.body.classList.contains('c7-no-motion'),reduced);
 for(let n=2;n<=14;n++){loc.hash='#anova-step-'+n;fire('hashchange');eq(visible(),[n]);ok(parts[n-1].querySelector('h2').focused);eq(d.querySelectorAll('.c7-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);}
 for(const[id,n]of anchors){loc.hash='#'+id;fire('hashchange');eq(visible(),[n],id);for(let p=d.getElementById(id);p;p=p.parentElement)if(p.tagName==='DETAILS')ok(p.open,id+' open ancestor');}
 d.getElementById('c7-show-all').fire('click');eq(visible(),Array.from({length:14},(_,i)=>i+1));d.getElementById('c7-show-all').fire('click');eq(visible(),[14]);
 for(const b of d.querySelectorAll('[data-c7-visual]')){b.fire('click');eq(b.getAttribute('aria-pressed'),'true');eq(d.querySelectorAll(`[data-c7-visual="${b.dataset.c7Visual}"]`).filter(x=>x.getAttribute('aria-pressed')==='true').length,1);ok(d.getElementById('c7-'+b.dataset.c7Visual+'-result').innerHTML.length>200);}
 const pick=(key,v)=>d.querySelector(`[data-c7-visual="${key}"][data-view="${v}"]`).fire('click');
 for(const[key,values]of Object.entries(choices))for(const v of values){pick(key,v);eq(d.getElementById('c7-'+key+'-result').innerHTML,V.views[key](v));}
 pick('interaction','crossover');pick('reference','noise');const saved=Object.fromEntries(Object.keys(choices).map(k=>[k,d.getElementById('c7-'+k+'-result').innerHTML]));fire('beforeprint');ok(d.getElementById('c7-reference-result').innerHTML.includes('0.000648'));ok(d.getElementById('c7-interaction-result').innerHTML.includes('Original')===false);ok(d.getElementById('c7-interaction-result').innerHTML.includes('bundle is $4 higher'));fire('beforeprint');fire('afterprint');for(const key of Object.keys(choices))eq(d.getElementById('c7-'+key+'-result').innerHTML,saved[key]);fire('afterprint');
 d.getElementById('c7-motion').checked=false;d.getElementById('c7-motion').fire('change');ok(d.body.classList.contains('c7-no-motion'));media.matches=true;media.change();eq(d.getElementById('c7-motion').checked,false);
 loc.hash='#%bad';fire('hashchange');loc.hash='#missing';fire('hashchange');ok(true);
}
for(const[id,n]of anchors){const{d}=run(false,'#'+id);ok(!d.getElementById('anova-step-'+n).hidden,id+' direct link');}
const staticDOM=dom();eq(staticDOM.querySelectorAll('.c7-part').filter(p=>!p.hidden).length,14);eq(staticDOM.querySelectorAll('.c7-visual-controls').filter(p=>p.hidden).length,14);ok(staticDOM.querySelectorAll('.c7-part').every(p=>p.querySelector('.c7-scene')));
// Browser history can return to the original URL without a fragment.
for(const reduced of [false,true]){
 const {d,events,loc}=run(reduced),parts=d.querySelectorAll('.c7-part');
 const visible=()=>parts.filter(p=>!p.hidden).map(p=>p.attrs.id);
 const navigate=hash=>{loc.hash=hash;for(const fn of events.hashchange||[])fn();};
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'advance from initial URL');
 navigate('');eq(visible(),[parts[0].attrs.id],'Back to hashless URL restores first step');
 eq(d.querySelectorAll('.c7-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'Forward restores later step');
 navigate('#main');eq(visible(),[parts[1].attrs.id],'Back to top preserves current step');
 navigate('#');eq(visible(),[parts[0].attrs.id],'empty fragment uses initial step');
 d.getElementById('c7-show-all').fire('click');navigate('#'+parts[1].attrs.id);navigate('');
 eq(visible(),parts.map(p=>p.attrs.id),'history preserves the show-all preference');
 d.getElementById('c7-show-all').fire('click');eq(visible(),[parts[0].attrs.id],'return to one step uses restored history');
 navigate('#'+parts[1].attrs.id);navigate('#missing');eq(visible(),[parts[1].attrs.id],'unknown anchor does not reset lesson');
}
ok(html.includes('<a href="#main">Back to top'),'top link remains separate from the initial history state');

checks+=require('./scripts/test-readability.cjs')({run,dom,html,partSelector:'.c7-part',progressId:'c7-progress',showAllId:'c7-show-all',expectedExtensions:8});

console.log(`Passed ${checks} Class 7 visual math, original-content preservation, navigation, controls, deep links, reduced-motion, no-JS and print-restoration assertions.`);

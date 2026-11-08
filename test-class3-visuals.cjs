'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const V=require('./src/class-three-visuals.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},near=(a,b)=>ok(Math.abs(a-b)<1e-12);
const source=fs.readFileSync('src/class-three.js','utf8'),html=fs.readFileSync('dist/random-variables.html','utf8'),css=fs.readFileSync('src/class-three.css','utf8');
const legacyStepIds=['rv-step-1','rv-step-2','rv-cdf','rv-step-3','rv-variance','rv-step-4','rv-covariance','rv-step-5','rv-arrivals','rv-step-6','rv-waits','rv-step-7','rv-quantiles','rv-step-8','rv-step-9'];
const stepIds=[...legacyStepIds.slice(0,13),'rv-step-9','rv-step-8'];
const newPosition=n=>stepIds.indexOf(legacyStepIds[n-1])+1;
function topics(s){const out=[];const re=/<\/?details\b[^>]*>/g;let m,depth=0,start=-1;while((m=re.exec(s))){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,re.lastIndex));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
eq(topics(fs.readFileSync('src/random-variables.html','utf8')).map(t=>crypto.createHash('sha256').update(t).digest('hex')),JSON.parse(fs.readFileSync('test-class3-reference.json','utf8')).topic_sha256,'all 12 complete original topics unchanged');
eq((html.match(/<math xmlns=/g)||[]).length,47);eq((html.match(/class="visual-practice"/g)||[]).length,4);eq((html.match(/class="lesson-bridge"/g)||[]).length,12);
for(const name of ['mapping','distribution','moments','joint','counts','area','normal','families','decision']){ok(V.render(name).includes('c3-scene'));ok(V.render(name).includes('Pause'));}
for(const name of ['cdf','variance','jointtable','arrivals','waits','quantiles'])ok(V.render(name).includes('c3-scene'),name+' static scene');
near(V.mass.reduce((a,b)=>a+b),1);near(V.mass.reduce((s,p,i)=>s+i*p,0),1.7);near(V.mass.reduce((s,p,i)=>s+(i-1.7)**2*p,0),.81);
for(const[k,v]of Object.entries({exact:40,atmost:80,atleast:60}))ok(V.views.distribution(k).includes(`${v}%.</b>`));
for(const[q,risk,variance]of [[.05,5,.1],[.25,25,.5],[.45,45,.9]]){const cells=[q,.5-q,.5-q,q];near(cells.reduce((s,p)=>s+p),1);near(cells[0]+cells[1],.5);near(cells[1]+cells[3],.5);ok(V.views.joint(q).includes(`${risk}% of the time`));ok(V.views.joint(q).includes(variance.toFixed(2)));}
for(const[c,risk,excess]of [[0,90,1.7],[1,60,.8],[2,20,.2],[3,0,0]]){ok(V.views.decision(c).includes(`${risk}% chance`));ok(V.views.decision(c).includes(`${excess.toFixed(1)} orders per slot`));}
ok(V.views.moments('spread').includes('0.81 orders²'));ok(V.views.area('point').includes('probability 0'));ok(V.views.area('whole').includes('2 × 0.50 = 1'));ok(V.views.normal('tail').includes('506.58'));ok(V.views.normal('left').includes('15.87%'));
for(const model of Object.keys(V.countModels))ok(V.views.counts(model).includes(V.countModels[model][2]));
ok(css.includes('prefers-reduced-motion'));ok(css.includes('.c3-no-motion'));ok(css.includes('@media print'));ok(!/setTimeout|setInterval|requestAnimationFrame/.test(source));
class Element{
 constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.hidden='hidden'in attrs;this.open='open'in attrs;this.checked='checked'in attrs;this.style={};this.handlers={};this.dataset={};this.textContent='';this.focused=false;this.scrolled=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={contains:n=>(this.attrs.class||'').split(/\s/).includes(n),add:n=>this.attrs.class=(this.attrs.class||'')+' '+n,remove:n=>this.attrs.class=(this.attrs.class||'').split(/\s/).filter(c=>c!==n).join(' '),toggle:(n,v)=>{if(v===undefined)v=!this.classList.contains(n);if(v)this.classList.add(n);else this.classList.remove(n);}};}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}fire(k,event={}){for(const fn of this.handlers[k]||[])fn({target:this,...event});}
 matches(s){return s.split(',').some(sel=>{sel=sel.trim();if(sel.includes(' ')){const bits=sel.split(/\s+/),last=bits.pop();return this.matches(last)&&!!this.parentElement?.closest(bits.join(' '));}const attrs=[...sel.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,k,v])=>!(k in this.attrs)||(v!==undefined&&this.attrs[k]!==v)))return false;sel=sel.replace(/\[[^\]]+\]/g,'');const id=sel.match(/#([\w-]+)/);if(id&&this.attrs.id!==id[1])return false;const classes=[...sel.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);if(classes.some(c=>!this.classList.contains(c)))return false;const tag=sel.match(/^[a-z][a-z0-9-]*/i);return !tag||this.tagName===tag[0].toUpperCase();});}
 querySelectorAll(s){let result=[];for(const child of this.children){if(child.matches(s))result.push(child);result.push(...child.querySelectorAll(s));}return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){for(let p=this;p;p=p.parentElement)if(p.matches(s))return p;return null;}contains(n){for(let p=n;p;p=p.parentElement)if(p===this)return true;return false;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function dom(){const root=new Element('document'),stack=[root],voids=new Set(['META','LINK','BR','INPUT','HR','IMG','SOURCE','WBR']);let clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'');for(const m of clean.matchAll(/<\/?([a-z][a-z\d-]*)\b([^>]*?)>/gi)){const closing=m[0].startsWith('</');if(closing){if(stack.at(-1).tagName===m[1].toUpperCase())stack.pop();continue;}const attrs={};for(const a of m[2].matchAll(/([a-z][\w:-]*)(?:="([^"]*)")?/gi))attrs[a[1]]=a[2]??'';const el=new Element(m[1],attrs);el.parentElement=stack.at(-1);el.parentElement.children.push(el);if(!voids.has(el.tagName)&&!m[0].endsWith('/>'))stack.push(el);}root.body=root.querySelector('body');root.getElementById=id=>root.querySelector('#'+id);for(const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)){const el=root.getElementById(m[1]);if(el)el.textContent=m[2].replace(/<[^>]*>/g,'');}return root;}
function run(reduced,hash=''){const d=dom(),events={},loc={hash},media={matches:reduced,addEventListener:(k,f)=>media[k]=f};const w={matchMedia:()=>media,addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(source,{document:d,window:w,location:loc,ClassThreeViews:V});return{d,events,loc,media};}
for(const reduced of [false,true]){
 const{d,events,loc,media}=run(reduced),parts=d.querySelectorAll('.c3-part'),visible=()=>parts.map((p,i)=>!p.hidden?i+1:null).filter(Boolean),fire=k=>(events[k]||[]).forEach(fn=>fn());
 eq(visible(),[1]);eq(d.getElementById('c3-motion').checked,!reduced);eq(d.body.classList.contains('c3-no-motion'),reduced);
 for(let n=2;n<=15;n++){loc.hash='#'+stepIds[n-1];fire('hashchange');eq(visible(),[n]);ok(parts[n-1].querySelector('h2').focused);eq(d.querySelectorAll('.c3-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);}
 for(const[id,n]of [['variables',1],['mass-cdf',3],['moments',5],['joint',7],['discrete-models',8],['count-proofs',9],['count-lab',9],['density',10],['wait-models',11],['normal',12],['normal-foundations',12],['continuous-lab',13],['inference-families',14],['tools',15],['practice',15],['c3-revenue-transform',5],['c3-capacity-tail',8],['c3-model-assumptions',11],['c3-sd-not-variance',12]]){loc.hash='#'+id;fire('hashchange');eq(visible(),[newPosition(n)],id);for(let p=d.getElementById(id);p;p=p.parentElement)if(p.tagName==='DETAILS')ok(p.open,id+' open ancestor');}
 d.getElementById('c3-show-all').fire('click');eq(visible(),Array.from({length:15},(_,i)=>i+1));d.getElementById('c3-show-all').fire('click');eq(visible(),[12]);
 const pick=(key,v)=>d.querySelector(`[data-c3-visual="${key}"][data-view="${v}"]`).fire('click');
 for(const b of d.querySelectorAll('[data-c3-visual]')){b.fire('click');eq(b.getAttribute('aria-pressed'),'true');eq(d.querySelectorAll(`[data-c3-visual="${b.dataset.c3Visual}"]`).filter(x=>x.getAttribute('aria-pressed')==='true').length,1);ok(d.getElementById('c3-'+b.dataset.c3Visual+'-result').innerHTML.length>200);}
 pick('distribution','atleast');pick('normal','tail');pick('decision','1');fire('beforeprint');ok(d.getElementById('c3-decision-result').innerHTML.includes('20% chance'));fire('afterprint');ok(d.getElementById('c3-decision-result').innerHTML.includes('60% chance'));ok(d.getElementById('c3-normal-result').innerHTML.includes('506.58'));
 d.getElementById('c3-motion').checked=false;d.getElementById('c3-motion').fire('change');ok(d.body.classList.contains('c3-no-motion'));media.matches=true;media.change();eq(d.getElementById('c3-motion').checked,false);
 loc.hash='#%bad';fire('hashchange');loc.hash='#missing';fire('hashchange');ok(true);
}
for(const[id,n]of [['count-lab',9],['continuous-lab',13],['c3-revenue-transform',5],['practice',15]]){const{d}=run(false,'#'+id);ok(!d.getElementById(legacyStepIds[n-1]).hidden,id+' direct link');}
for(const reduced of [false,true])for(let n=1;n<=15;n++)for(const id of [stepIds[n-1],'class3-step-'+(legacyStepIds.indexOf(stepIds[n-1])+1)]){const{d,events,loc}=run(reduced,'#'+id);eq(d.querySelectorAll('.c3-part').filter(p=>!p.hidden).map(p=>p.attrs.id),[stepIds[n-1]],id+' direct route');loc.hash='#'+id;for(const fn of events.hashchange||[])fn();ok(d.getElementById(stepIds[n-1]).querySelector('h2').focused,id+' navigation focuses actual heading');}
const staticDOM=dom();eq(staticDOM.querySelectorAll('.c3-part').filter(p=>!p.hidden).length,15);eq(staticDOM.querySelectorAll('.c3-visual-controls').filter(p=>p.hidden).length,7);ok(staticDOM.querySelectorAll('.c3-part').every(p=>p.querySelector('.c3-scene')));
// Browser history can return to the original URL without a fragment.
for(const reduced of [false,true]){
 const {d,events,loc}=run(reduced),parts=d.querySelectorAll('.c3-part');
 const visible=()=>parts.filter(p=>!p.hidden).map(p=>p.attrs.id);
 const navigate=hash=>{loc.hash=hash;for(const fn of events.hashchange||[])fn();};
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'advance from initial URL');
 navigate('');eq(visible(),[parts[0].attrs.id],'Back to hashless URL restores first step');
 eq(d.querySelectorAll('.c3-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'Forward restores later step');
 navigate('#main');eq(visible(),[parts[1].attrs.id],'Back to top preserves current step');
 navigate('#');eq(visible(),[parts[0].attrs.id],'empty fragment uses initial step');
 d.getElementById('c3-show-all').fire('click');navigate('#'+parts[1].attrs.id);navigate('');
 eq(visible(),parts.map(p=>p.attrs.id),'history preserves the show-all preference');
 d.getElementById('c3-show-all').fire('click');eq(visible(),[parts[0].attrs.id],'return to one step uses restored history');
 navigate('#'+parts[1].attrs.id);navigate('#missing');eq(visible(),[parts[1].attrs.id],'unknown anchor does not reset lesson');
}
ok(html.includes('<a href="#main">Back to top'),'top link remains separate from the initial history state');

checks+=require('./scripts/test-readability.cjs')({run,dom,html,partSelector:'.c3-part',progressId:'c3-progress',showAllId:'c3-show-all',expectedExtensions:8});

console.log(`Passed ${checks} Class 3 visual arithmetic, content preservation, navigation, deep-link, reduced-motion, no-JS and print restoration assertions.`);

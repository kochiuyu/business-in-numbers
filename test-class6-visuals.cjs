
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const V=require('./src/class-six-visuals.js'),H=require('./src/hypothesis-core.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},near=(a,b)=>ok(Math.abs(a-b)<1e-10);
const source=fs.readFileSync('src/class-six.js','utf8'),html=fs.readFileSync('dist/hypothesis-testing.html','utf8'),css=fs.readFileSync('src/class-six.css','utf8');
function topics(s){const out=[];const re=/<\/?details\b[^>]*>/g;let m,depth=0,start=-1;while((m=re.exec(s))){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,re.lastIndex));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
eq(topics(fs.readFileSync('src/hypothesis-testing.html','utf8')).map(t=>crypto.createHash('sha256').update(t).digest('hex')),JSON.parse(fs.readFileSync('test-class6-reference.json','utf8')).topic_sha256,'all 15 original topic bodies unchanged');
eq((html.match(/<math xmlns=/g)||[]).length,32);eq((html.match(/class="visual-practice"/g)||[]).length,4);

const choices=Object.fromEntries(Object.entries(V.specs).map(([k,s])=>[k,s[4].map(b=>b[0])]));
for(const[key,values]of Object.entries(choices)){ok(V.render(key).includes('Pause'));ok(V.render(key).includes('c6-scene'));for(const v of values){const out=V.views[key](v);ok(out.length>200);ok(!/NaN|undefined/.test(out),key+' '+v);for(const match of out.matchAll(/<svg[\s\S]*?<\/svg>/g)){ok(match[0].includes('role="img"'));ok(match[0].includes('<title'));ok(match[0].includes('<desc'));}}}
// Values independently reproduced with SciPy, not rounded before decisions.
for(const[fn,args,expected]of [
 ['mean',{}, {stat:2,p:.022750131948179195,se:1}],
 ['mean',{tail:'less'}, {p:.9772498680518208}],
 ['mean',{tail:'two'}, {p:.04550026389635839}],
 ['mean',{method:'t',mean:32,mu0:30,sd:4,n:16,tail:'two'},{stat:2,p:.0639450072847203,df:15}],
 ['power',{n:64},{power:.6387600313123356,beta:.3612399686876644}],
 ['power',{n:128},{power:.8817090317783474}],
 ['proportion',{}, {stat:2.612789058968724,p:.00449033562094943}],
 ['independent',{}, {stat:-1.4638501094227996,df:50.514683153013905,p:.1494304355195889}],
 ['independent',{method:'pooled'}, {stat:-1.4014696185061755,df:52,p:.1670142444622383}],
 ['paired',{}, {mean:3,sd:1.6903085094570331,se:.5976143046671968,p:.001530521555676081}],
 ['twoprop',{}, {stat:2.208630521496931,p:.027200350616306494,se:.027166155414412252,ciSE:.02708320512790168}],
 ['variance',{}, {stat:2.25,p:.05966125888372156,lower:.41535801939856726,upper:2.3272714446086087}],
])for(const[key,value]of Object.entries(expected))near(H[fn](args)[key],value);
for(const [view,text] of [['greater','0.02275'],['two','0.04550'],['less','0.97725']])ok(V.views.tails(view).includes(text));
ok(V.views.student('z').includes('0.04550'));ok(V.views.student('t').includes('0.06395'));
ok(V.views.interval('two').includes('29.87–34.13'));ok(V.views.interval('one').includes('30.25'));ok(V.views.interval('one').includes('0.03197'));ok(V.views.interval('one').includes('no upper bound'));
for(const n of ['64','128']){ok(V.views.power(n).includes('Axis fixed 46 to 56'));ok(V.views.power(n).includes(n==='64'?'63.9%':'88.2%'));}
ok(V.views.proportion('observed').includes('0.00449'));ok(V.views.proportion('null').includes('50 / 150'));
ok(V.views.independent('welch').includes('50.515'));ok(V.views.independent('pooled').includes('61.10'));ok(V.views.independent('welch').includes('-7.12 to 1.12'));
for(const v of ['original','shifted']){const out=V.views.paired(v);ok(out.includes('0.00153'));eq((out.match(/minutes saved/g)||[]).length,8);}
ok(V.views.paired('shifted').includes('42 − 39'));ok(V.views.paired('original').includes('32 − 29'));
const a=H.variance(),b=H.variance({s1:4,n1:25,s2:6,n2:21});near(a.stat*b.stat,1);near(a.p,b.p);near(a.lower*b.upper,1);near(a.upper*b.lower,1);
for(const v of ['original','swap']){const out=V.views.variance(v);ok(out.includes('0.05966'));ok(out.includes('variance 36'));ok(out.includes('variance 16'));}
const twice=H.twoprop({k1:168,n1:800,k2:120,n2:800});near(twice.effect,.06);near(twice.se,H.twoprop().se/Math.sqrt(2));ok(V.views.twoprop('double').includes((twice.p).toFixed(5)));ok(V.views.twoprop('double').includes('percentage points'));
ok(css.includes('prefers-reduced-motion'));ok(css.includes('.c6-no-motion'));ok(css.includes('@media print'));ok(css.includes('.c6-part[hidden]{display:block!important}'));ok(!/setTimeout|setInterval|requestAnimationFrame/.test(source));
class Element{
 constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.hidden='hidden'in attrs;this.open='open'in attrs;this.checked='checked'in attrs;this.style={};this.handlers={};this.dataset={};this.textContent='';this.focused=false;this.scrolled=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={contains:n=>(this.attrs.class||'').split(/\s/).includes(n),add:n=>this.attrs.class=(this.attrs.class||'')+' '+n,remove:n=>this.attrs.class=(this.attrs.class||'').split(/\s/).filter(c=>c!==n).join(' '),toggle:(n,v)=>{if(v===undefined)v=!this.classList.contains(n);if(v)this.classList.add(n);else this.classList.remove(n);}};}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}fire(k,event={}){for(const fn of this.handlers[k]||[])fn({target:this,...event});}
 matches(s){return s.split(',').some(sel=>{sel=sel.trim();if(sel.includes(' ')){const bits=sel.split(/\s+/),last=bits.pop();return this.matches(last)&&!!this.parentElement?.closest(bits.join(' '));}const attrs=[...sel.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,k,v])=>!(k in this.attrs)||(v!==undefined&&this.attrs[k]!==v)))return false;sel=sel.replace(/\[[^\]]+\]/g,'');const id=sel.match(/#([\w-]+)/);if(id&&this.attrs.id!==id[1])return false;const classes=[...sel.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);if(classes.some(c=>!this.classList.contains(c)))return false;const tag=sel.match(/^[a-z][a-z0-9-]*/i);return !tag||this.tagName===tag[0].toUpperCase();});}
 querySelectorAll(s){let result=[];for(const child of this.children){if(child.matches(s))result.push(child);result.push(...child.querySelectorAll(s));}return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){for(let p=this;p;p=p.parentElement)if(p.matches(s))return p;return null;}contains(n){for(let p=n;p;p=p.parentElement)if(p===this)return true;return false;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function dom(){const root=new Element('document'),stack=[root],voids=new Set(['META','LINK','BR','INPUT','HR','IMG','SOURCE','WBR']);let clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'');for(const m of clean.matchAll(/<\/?([a-z][a-z\d-]*)\b([^>]*?)>/gi)){const closing=m[0].startsWith('</');if(closing){if(stack.at(-1).tagName===m[1].toUpperCase())stack.pop();continue;}const attrs={};for(const a of m[2].matchAll(/([a-z][\w:-]*)(?:="([^"]*)")?/gi))attrs[a[1]]=a[2]??'';const el=new Element(m[1],attrs);el.parentElement=stack.at(-1);el.parentElement.children.push(el);if(!voids.has(el.tagName)&&!m[0].endsWith('/>'))stack.push(el);}root.body=root.querySelector('body');root.getElementById=id=>root.querySelector('#'+id);return root;}
function run(reduced,hash=''){const d=dom(),events={},loc={hash},media={matches:reduced,addEventListener:(k,f)=>media[k]=f};const w={matchMedia:()=>media,addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(source,{document:d,window:w,location:loc,ClassSixViews:V});return{d,events,loc,media};}


const anchors=[['hypotheses',1],['errors-power',2],['power-lab',2],['testing-procedure',3],['known-variance',4],['unknown-variance',4],['mean-lab',4],['test-and-interval',5],['one-proportion',6],['proportion-lab',6],['two-sample-design',7],['pooled-means',8],['welch-means',8],['independent-lab',8],['paired-means',9],['paired-lab',9],['two-proportions',10],['twoprop-lab',10],['variance-ratio',11],['variance-lab',11],['reporting',12],['tools',12]];
for(const reduced of [false,true]){
 const{d,events,loc,media}=run(reduced),parts=d.querySelectorAll('.c6-part'),visible=()=>parts.map((p,i)=>!p.hidden?i+1:null).filter(Boolean),fire=k=>(events[k]||[]).forEach(fn=>fn());
 eq(visible(),[1]);eq(d.getElementById('c6-motion').checked,!reduced);eq(d.body.classList.contains('c6-no-motion'),reduced);
 for(let n=2;n<=12;n++){loc.hash='#hypothesis-step-'+n;fire('hashchange');eq(visible(),[n]);ok(parts[n-1].querySelector('h2').focused);eq(d.querySelectorAll('.c6-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);}
 for(const[id,n]of anchors){loc.hash='#'+id;fire('hashchange');eq(visible(),[n],id);for(let p=d.getElementById(id);p;p=p.parentElement)if(p.tagName==='DETAILS')ok(p.open,id+' open ancestor');}
 d.getElementById('c6-show-all').fire('click');eq(visible(),Array.from({length:12},(_,i)=>i+1));d.getElementById('c6-show-all').fire('click');eq(visible(),[12]);
 for(const b of d.querySelectorAll('[data-c6-visual]')){b.fire('click');eq(b.getAttribute('aria-pressed'),'true');eq(d.querySelectorAll(`[data-c6-visual="${b.dataset.c6Visual}"]`).filter(x=>x.getAttribute('aria-pressed')==='true').length,1);ok(d.getElementById('c6-'+b.dataset.c6Visual+'-result').innerHTML.length>200);}
 const pick=(key,v)=>d.querySelector(`[data-c6-visual="${key}"][data-view="${v}"]`).fire('click');
 for(const[key,values]of Object.entries(choices))for(const v of values){pick(key,v);eq(d.getElementById('c6-'+key+'-result').innerHTML,V.views[key](v));}
 pick('power','64');pick('interval','one');const saved=Object.fromEntries(Object.keys(choices).map(k=>[k,d.getElementById('c6-'+k+'-result').innerHTML]));fire('beforeprint');ok(d.getElementById('c6-power-result').innerHTML.includes('88.2%'));ok(d.getElementById('c6-interval-result').innerHTML.includes('29.87–34.13'));fire('beforeprint');fire('afterprint');for(const key of Object.keys(choices))eq(d.getElementById('c6-'+key+'-result').innerHTML,saved[key]);fire('afterprint');
 d.getElementById('c6-motion').checked=false;d.getElementById('c6-motion').fire('change');ok(d.body.classList.contains('c6-no-motion'));media.matches=true;media.change();eq(d.getElementById('c6-motion').checked,false);
 loc.hash='#%bad';fire('hashchange');loc.hash='#missing';fire('hashchange');ok(true);
}
for(const[id,n]of anchors){const{d}=run(false,'#'+id);ok(!d.getElementById('hypothesis-step-'+n).hidden,id+' direct link');}
const staticDOM=dom();eq(staticDOM.querySelectorAll('.c6-part').filter(p=>!p.hidden).length,12);eq(staticDOM.querySelectorAll('.c6-visual-controls').filter(p=>p.hidden).length,12);ok(staticDOM.querySelectorAll('.c6-part').every(p=>p.querySelector('.c6-scene')));
console.log(`Passed ${checks} Class 6 visual math, original-content preservation, navigation, controls, deep links, reduced-motion, no-JS and print-restoration assertions.`);

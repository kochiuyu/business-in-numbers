'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const V=require('./src/class-five-visuals.js'),E=require('./src/estimation-core.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},near=(a,b)=>ok(Math.abs(a-b)<1e-10);
const source=fs.readFileSync('src/class-five.js','utf8'),html=fs.readFileSync('dist/estimation.html','utf8'),css=fs.readFileSync('src/class-five.css','utf8');
function topics(s){const out=[];const re=/<\/?details\b[^>]*>/g;let m,depth=0,start=-1;while((m=re.exec(s))){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,re.lastIndex));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
eq(topics(fs.readFileSync('src/estimation.html','utf8')).map(t=>crypto.createHash('sha256').update(t).digest('hex')),JSON.parse(fs.readFileSync('test-class5-reference.json','utf8')).topic_sha256,'all 12 original topics are unchanged');
eq((html.match(/<math xmlns=/g)||[]).length,29);eq((html.match(/class="visual-practice"/g)||[]).length,4);
const choices={target:['sample','estimate'],quality:['25','100','shrinking'],spread:['deviations','variance'],binary:['count','rate'],interval:['point','95','99'],coverage:['one','many'],student:['z','t'],proportion:['48','0'],planning:['3','1.5','rate24','rate50'],decision:['point','range']};
for(const [name,values] of Object.entries(choices)){ok(V.render(name).includes('c5-scene'));ok(V.render(name).includes('Pause'));for(const value of values){const out=V.views[name](value);ok(out.length>200);ok(!/NaN|Infinity|undefined/.test(out),name+' '+value);for(const svg of out.matchAll(/<svg[\s\S]*?<\/svg>/g)){ok(svg[0].includes('role="img"'));ok(svg[0].includes('<title'));ok(svg[0].includes('<desc'));}}}
eq(V.values,[46,52,48,54,50]);near(V.values.reduce((a,b)=>a+b)/5,50);near(V.values.reduce((a,b)=>a+(b-50)**2,0),40);ok(V.views.target('estimate').includes('$250 ÷ 5 = $50'));
ok(V.views.spread('variance').includes('10 dollars²'));ok(V.views.spread('variance').includes('$1.41'));ok(V.views.spread('deviations').includes('No order is discarded'));
for(const [v,se,bias,mse] of [['25','2.4','2.00','9.7600'],['100','1.2','2.00','5.4400'],['shrinking','1.2','0.12','1.4544']]){const s=V.views.quality(v);ok(s.includes('SE = '+se));ok(s.includes('bias = $'+bias));ok(s.includes(mse+' dollars²'));ok(s.includes('38 to 64 is fixed'));}
for(const v of choices.binary){const s=V.views.binary(v);eq((s.match(/class="c5-converted"/g)||[]).length,48);eq((s.match(/<i class=/g)||[]).length,200);ok(s.includes('3.02 percentage points'));}
for(const [c,lo,hi,me] of [[.95,68.0800720309199,75.9199279690801,3.919927969080108],[.99,66.8483413929022,77.1516586070978,5.151658607097801]]){const d=E.meanCI('z',72,18,81,c);near(d.lower,lo);near(d.upper,hi);near(d.me,me);near(d.se,2);const out=V.views.interval(String(c*100));ok(out.includes('$'+lo.toFixed(2)));ok(out.includes('$'+hi.toFixed(2)));ok(out.includes('Fixed horizontal scale 60 to 84'));}
ok(!V.views.interval('point').includes('c5-interval-rail'));ok(V.views.interval('point').includes('No interval is drawn yet'));
const t=E.meanCI('t',47,8,16,.95);near(t.critical,2.131449545559776);near(t.lower,42.73710090888045);near(t.upper,51.26289909111955);eq(t.df,15);ok(V.views.student('t').includes('42.74–51.26'));ok(V.views.student('z').includes('COUNTERFACTUAL'));ok(V.views.student('t').includes('SAMPLE SD'));
const p=E.proportion(48,200);for(const [key,value] of Object.entries({se:.030199337741083,lower:.1808103856705161,upper:.2991896143294839,wlower:.1860661599241369,wupper:.30373340979204166}))near(p[key],value);near(E.proportion(0,200).wupper,.018845326377266575);ok(V.views.proportion('48').includes('18.08%–29.92%'));ok(V.views.proportion('48').includes('18.61%–30.37%'));ok(V.views.proportion('0').includes('[0%, 0%]'));ok(V.views.proportion('0').includes('1.88%'));
for(const [view,kind,p,margin,raw,n,achieved] of [['3','mean',.5,3,138.2925175449885,139,2.9923555576649754],['1.5','mean',.5,1.5,553.170070179954,554,1.498876027694996],['rate24','proportion',.24,.04,437.9263055591302,438,null],['rate50','proportion',.5,.04,600.2279407334571,601,null]]){const d=E.plan(kind,18,p,margin,.95);near(d.raw,raw);eq(d.n,n);if(achieved!==null)near(d.achieved,achieved);ok(d.achieved<=margin);ok(V.views.planning(view).includes('<strong>'+n+'</strong>'));ok(V.views.planning(view).includes('round '+raw.toFixed(2)+' upward'));const width=Number(V.views.planning(view).match(/style="width:([\d.]+)%/)[1]);near(width,n/7);ok(width<=100);}
eq(V.coverageData.rows.length,20);eq(V.coverageData.hits,V.coverageData.rows.filter(r=>r.lower<=50&&r.upper>=50).length);eq(V.coverageData,E.coverage(25,.95,20,5205,'z'));for(const r of V.coverageData.rows){near(r.upper-r.lower,2*1.959963984540054*12/5);ok(r.lower>=35&&r.upper<=65,'coverage fits fixed axis');}eq((V.views.coverage('one').match(/class="c5-cover-line/g)||[]).length,1);eq((V.views.coverage('many').match(/class="c5-cover-line/g)||[]).length,20);ok(V.views.coverage('many').includes(V.coverageData.hits+' of these 20'));
ok(V.views.decision('range').includes('$68.08–$75.92'));ok(!V.views.decision('point').includes('c5-interval-rail'));
ok(css.includes('prefers-reduced-motion'));ok(css.includes('.c5-no-motion'));ok(css.includes('@media print'));ok(css.includes('.c5-part[hidden]{display:block!important}'));ok(!/setTimeout|setInterval|requestAnimationFrame/.test(source));ok(!source.includes('c4Visual'));
class Element{
 constructor(tag,attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.hidden='hidden'in attrs;this.open='open'in attrs;this.checked='checked'in attrs;this.style={};this.handlers={};this.dataset={};this.textContent='';this.focused=false;this.scrolled=false;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.classList={contains:n=>(this.attrs.class||'').split(/\s/).includes(n),add:n=>this.attrs.class=(this.attrs.class||'')+' '+n,remove:n=>this.attrs.class=(this.attrs.class||'').split(/\s/).filter(c=>c!==n).join(' '),toggle:(n,v)=>{if(v===undefined)v=!this.classList.contains(n);if(v)this.classList.add(n);else this.classList.remove(n);}};}
 setAttribute(k,v){this.attrs[k]=String(v);}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,fn){(this.handlers[k]||=[]).push(fn);}fire(k,event={}){for(const fn of this.handlers[k]||[])fn({target:this,...event});}
 matches(s){return s.split(',').some(sel=>{sel=sel.trim();if(sel.includes(' ')){const bits=sel.split(/\s+/),last=bits.pop();return this.matches(last)&&!!this.parentElement?.closest(bits.join(' '));}const attrs=[...sel.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,k,v])=>!(k in this.attrs)||(v!==undefined&&this.attrs[k]!==v)))return false;sel=sel.replace(/\[[^\]]+\]/g,'');const id=sel.match(/#([\w-]+)/);if(id&&this.attrs.id!==id[1])return false;const classes=[...sel.matchAll(/\.([\w-]+)/g)].map(m=>m[1]);if(classes.some(c=>!this.classList.contains(c)))return false;const tag=sel.match(/^[a-z][a-z0-9-]*/i);return !tag||this.tagName===tag[0].toUpperCase();});}
 querySelectorAll(s){let result=[];for(const child of this.children){if(child.matches(s))result.push(child);result.push(...child.querySelectorAll(s));}return result;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){for(let p=this;p;p=p.parentElement)if(p.matches(s))return p;return null;}contains(n){for(let p=n;p;p=p.parentElement)if(p===this)return true;return false;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
}
function dom(){const root=new Element('document'),stack=[root],voids=new Set(['META','LINK','BR','INPUT','HR','IMG','SOURCE','WBR']);let clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<!--[\s\S]*?-->/g,'');for(const m of clean.matchAll(/<\/?([a-z][a-z\d-]*)\b([^>]*?)>/gi)){const closing=m[0].startsWith('</');if(closing){if(stack.at(-1).tagName===m[1].toUpperCase())stack.pop();continue;}const attrs={};for(const a of m[2].matchAll(/([a-z][\w:-]*)(?:="([^"]*)")?/gi))attrs[a[1]]=a[2]??'';const el=new Element(m[1],attrs);el.parentElement=stack.at(-1);el.parentElement.children.push(el);if(!voids.has(el.tagName)&&!m[0].endsWith('/>'))stack.push(el);}root.body=root.querySelector('body');root.getElementById=id=>root.querySelector('#'+id);for(const m of html.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)){const el=root.getElementById(m[1]);if(el)el.textContent=m[2].replace(/<[^>]*>/g,'');}return root;}
function run(reduced,hash=''){const d=dom(),events={},loc={hash},media={matches:reduced,addEventListener:(k,f)=>media[k]=f};const w={matchMedia:()=>media,addEventListener:(k,f)=>(events[k]||=[]).push(f)};vm.runInNewContext(source,{document:d,window:w,location:loc,ClassFiveViews:V});return{d,events,loc,media};}

const anchors=[['estimator',1],['properties',2],['mean-estimator',2],['quality-lab',2],['variance-estimator',3],['binary',4],['known-variance',5],['confidence',6],['coverage-lab',6],['unknown-variance',7],['mean-lab',7],['proportion-interval',8],['proportion-lab',8],['plan-mean',9],['plan-proportion',9],['plan-lab',9],['tools',10],['practice',10]];
for(const reduced of [false,true]){
 const{d,events,loc,media}=run(reduced),parts=d.querySelectorAll('.c5-part'),visible=()=>parts.map((p,i)=>!p.hidden?i+1:null).filter(Boolean),fire=k=>(events[k]||[]).forEach(fn=>fn());
 eq(visible(),[1]);eq(d.getElementById('c5-motion').checked,!reduced);eq(d.body.classList.contains('c5-no-motion'),reduced);
 for(let n=2;n<=10;n++){loc.hash='#estimation-step-'+n;fire('hashchange');eq(visible(),[n]);ok(parts[n-1].querySelector('h2').focused);eq(d.querySelectorAll('.c5-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);}
 for(const[id,n]of anchors){loc.hash='#'+id;fire('hashchange');eq(visible(),[n],id);for(let p=d.getElementById(id);p;p=p.parentElement)if(p.tagName==='DETAILS')ok(p.open,id+' open ancestor');}
 d.getElementById('c5-show-all').fire('click');eq(visible(),[1,2,3,4,5,6,7,8,9,10]);d.getElementById('c5-show-all').fire('click');eq(visible(),[10]);
 for(const b of d.querySelectorAll('[data-c5-visual]')){b.fire('click');eq(b.getAttribute('aria-pressed'),'true');eq(d.querySelectorAll(`[data-c5-visual="${b.dataset.c5Visual}"]`).filter(x=>x.getAttribute('aria-pressed')==='true').length,1);ok(d.getElementById('c5-'+b.dataset.c5Visual+'-result').innerHTML.length>200);}
 const pick=(key,v)=>d.querySelector(`[data-c5-visual="${key}"][data-view="${v}"]`).fire('click');
 for(const [key,values] of Object.entries(choices))for(const v of values){pick(key,v);eq(d.getElementById('c5-'+key+'-result').innerHTML,V.views[key](v));}
 pick('planning','rate24');pick('proportion','48');const saved=Object.fromEntries(Object.keys(choices).map(k=>[k,d.getElementById('c5-'+k+'-result').innerHTML]));fire('beforeprint');ok(d.getElementById('c5-planning-result').innerHTML.includes('<strong>554</strong>'));ok(d.getElementById('c5-proportion-result').innerHTML.includes('[0%, 0%]'));fire('beforeprint');fire('afterprint');for(const key of Object.keys(choices))eq(d.getElementById('c5-'+key+'-result').innerHTML,saved[key]);fire('afterprint');
 d.getElementById('c5-motion').checked=false;d.getElementById('c5-motion').fire('change');ok(d.body.classList.contains('c5-no-motion'));media.matches=true;media.change();eq(d.getElementById('c5-motion').checked,false);
 loc.hash='#%bad';fire('hashchange');loc.hash='#missing';fire('hashchange');ok(true);
}
for(const[id,n]of anchors){const{d}=run(false,'#'+id);ok(!d.getElementById('estimation-step-'+n).hidden,id+' direct link');}
const staticDOM=dom();eq(staticDOM.querySelectorAll('.c5-part').filter(p=>!p.hidden).length,10);eq(staticDOM.querySelectorAll('.c5-visual-controls').filter(p=>p.hidden).length,10);ok(staticDOM.querySelectorAll('.c5-part').every(p=>p.querySelector('.c5-scene')));
// Browser history can return to the original URL without a fragment.
for(const reduced of [false,true]){
 const {d,events,loc}=run(reduced),parts=d.querySelectorAll('.c5-part');
 const visible=()=>parts.filter(p=>!p.hidden).map(p=>p.attrs.id);
 const navigate=hash=>{loc.hash=hash;for(const fn of events.hashchange||[])fn();};
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'advance from initial URL');
 navigate('');eq(visible(),[parts[0].attrs.id],'Back to hashless URL restores first step');
 eq(d.querySelectorAll('.c5-route a').filter(a=>a.getAttribute('aria-current')==='step').length,1);
 navigate('#'+parts[1].attrs.id);eq(visible(),[parts[1].attrs.id],'Forward restores later step');
 navigate('#main');eq(visible(),[parts[1].attrs.id],'Back to top preserves current step');
 navigate('#');eq(visible(),[parts[0].attrs.id],'empty fragment uses initial step');
 d.getElementById('c5-show-all').fire('click');navigate('#'+parts[1].attrs.id);navigate('');
 eq(visible(),parts.map(p=>p.attrs.id),'history preserves the show-all preference');
 d.getElementById('c5-show-all').fire('click');eq(visible(),[parts[0].attrs.id],'return to one step uses restored history');
 navigate('#'+parts[1].attrs.id);navigate('#missing');eq(visible(),[parts[1].attrs.id],'unknown anchor does not reset lesson');
}
ok(html.includes('<a href="#main">Back to top'),'top link remains separate from the initial history state');

checks+=require('./scripts/test-readability.cjs')({run,dom,html,partSelector:'.c5-part',progressId:'c5-progress',showAllId:'c5-show-all',expectedExtensions:8});

console.log(`Passed ${checks} Class 5 visual arithmetic, geometry, original-content preservation, navigation, controls, deep links, reduced-motion, no-JS and print-restoration assertions.`);

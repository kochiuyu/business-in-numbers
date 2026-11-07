'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),H=require('./src/hypothesis-core'),config=require('./src/hypothesis-config');let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b)=>{checks++;assert.deepEqual(a,b)},near=(a,b,t=1e-9)=>ok(Math.abs(a-b)<t,`${a} != ${b}`);
for(const id of Object.keys(config)){const d=H[id]();ok(!/NaN|Infinity/.test(id==='power'?H.powerSvg(d):H.tailSvg(d,id)));const v=H.view(id,d);ok(v.note.length>100);ok(v.metrics.includes('<strong>'));}
for(const tail of ['less','greater','two'])for(const alpha of [.001,.01,.05,.1,.2]){for(const method of ['z','t','wald'])for(const mean of [-20,50,52,200])for(const n of [2,16,64,10000]){const d=H.mean({method,mean,n,tail,alpha});ok(d.p>=0&&d.p<=1);eq(d.reject,d.p<=alpha);if(mean!==50)eq(d.reject,(d.lower!==null&&d.stat<=d.lower)||(d.upper!==null&&d.stat>=d.upper));ok(!/NaN|Infinity/.test(H.tailSvg(d,'m')));}for(const mu1 of [45,50,52,60]){const p=H.power({mu1,tail,alpha});ok(p.power>=0&&p.power<=1);near(p.power+p.beta,1);if(mu1===50)near(p.power,alpha,1e-12);}for(const s1 of [.000001,1,6,30,1000000]){const a=H.variance({s1,tail,alpha}),b=H.variance({s1:4,n1:25,s2:s1,n2:21,tail:tail==='two'?'two':tail==='greater'?'less':'greater',alpha});near(a.p,b.p,1e-9);near(a.stat*b.stat,1);ok(!/NaN|Infinity/.test(H.tailSvg(a,'f')));}}
// Classify the chosen mean before interpreting a rejection probability.
for(const tail of ['less','greater','two'])for(const mu1 of [48,50,52]){
 const d=H.power({mu0:50,mu1,sd:8,n:64,tail,alpha:.05}),note=H.view('power',d).note;
 const insideNull=(tail==='greater'&&mu1<50)||(tail==='less'&&mu1>50);
 if(mu1===50){ok(note.includes('rejection probability equals α'));ok(note.includes('Non-rejection is a correct decision'));near(d.power,.05,1e-12);}
 else if(insideNull){ok(note.includes('inside H₀'));ok(note.includes('Type I error (false-alarm) rate'));ok(note.includes('not a Type II error'));ok(!note.includes('this specific alternative'));ok(d.power<d.alpha);}
 else {ok(note.includes('this specific alternative'));ok(note.includes('is β at this alternative'));ok(d.power>d.alpha);}
 const svg=H.powerSvg(d);ok(!svg.includes('shaded alternative area'));ok(svg.includes('Rejection probability at a specified true mean'));ok(svg.includes('rejection probability at chosen mean'));
}
near(H.power({mu1:48,tail:'greater'}).power,.00013377201459869903,1e-12);
near(H.power({mu1:52,tail:'less'}).power,.00013377201459869903,1e-12);
for(const method of ['welch','pooled']){const a=H.independent({method}),b=H.independent({method,m1:31,s1:9,n1:30,m2:28,s2:6,n2:24});near(a.p,b.p);near(a.stat,-b.stat);near(a.ci[0],-b.ci[1]);}near(H.paired().mean,3);eq(H.paired().differences,[3,4,0,5,4,1,3,4]);near(H.paired({before:H.AFTER,after:H.BEFORE}).stat,-H.paired().stat);ok(H.proportion({k:0,n:20,p0:.01}).adequate===false);ok(H.twoprop({k1:1,n1:10,k2:0,n2:20}).ciAdequate===false);
for(const f of [()=>H.mean({n:1}),()=>H.mean({sd:0}),()=>H.mean({mean:Infinity}),()=>H.mean({method:'bad'}),()=>H.proportion({k:201}),()=>H.proportion({p0:0}),()=>H.proportion({k:1.5}),()=>H.independent({n1:1}),()=>H.independent({method:'bad'}),()=>H.paired({before:[1,2],after:[1]}),()=>H.paired({before:[1,2],after:[0,1]}),()=>H.paired({before:'1, bad',after:'2, 3'}),()=>H.twoprop({k1:0,k2:0}),()=>H.variance({s2:0}),()=>H.power({alpha:0}),()=>H.power({tail:'bad'})]){checks++;assert.throws(f);}
// Delimiters must not fabricate observations or silently shift matched rows.
const pairedReference=H.paired({before:[13,14,15],after:[10,10,10]});
eq(pairedReference.n,3);near(pairedReference.mean,4);near(pairedReference.p,.020204102886728796);ok(pairedReference.reject);
for(const [before,after] of [
 ['13, 14, 15','10, 10, 10'],['13; 14; 15','10; 10; 10'],
 [' 13  14\t15 \n',' 10  10\t10 \n'],['13\r\n14\r\n15\r\n','10\r\n10\r\n10\r\n'],
 ['13,\n14; 15','10,\n10; 10']
]){const d=H.paired({before,after});eq(d.differences,[3,4,5]);near(d.p,pairedReference.p);}
const missingPairs=[
 ['13,14,15,','10,10,10,'],[',13,14,15',',10,10,10'],
 ['13;14;15;','10;10;10;'],[';13;14;15',';10;10;10'],
 ['10,,30,40','8,20,,35'],['10; ;30;40','8;20; ;35'],
 ['13,;14,15','10,10,10'],['13\n\n14\n15','10\n10\n\n10'],
 ['13\r\n \r\n14\r\n15','10\r\n10\r\n10'],['13,14,15','10,10,10,']
];
for(const [before,after] of missingPairs){checks++;assert.throws(()=>H.paired({before,after}),/Missing observation/);}
const html=fs.readFileSync('dist/hypothesis-testing.html','utf8');eq((html.match(/class="lesson"/g)||[]).length,15);ok((html.match(/<math /g)||[]).length>=30);eq((html.match(/class="code-block"/g)||[]).length,8);ok(!/\{\{|katex-error/.test(html));const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);eq(ids.length,new Set(ids).size);for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g))if(!m[1].includes(':'))ok(fs.existsSync('dist/'+m[1].split('#')[0]),m[1]);for(const f of ['index.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html'])ok(fs.readFileSync('dist/'+f,'utf8').includes('hypothesis-testing.html'));for(const w of ['Welch','covariance','T.TEST','F.TEST','Z.TEST','ToolPak','power','false positive','Technical depth'])ok(html.includes(w),w);
class Node{set value(v){this._value=String(v)}get value(){return this._value}constructor(id){this.id=id;this.value='';this.innerHTML='';this.textContent='';this.handlers={};this.dataset={};this.classList={toggle(){}};this.tagName='DIV';this.parentElement=null;}addEventListener(k,f){this.handlers[k]=f}fire(k){this.handlers[k]?.({preventDefault(){},target:this})}setAttribute(k,v){(this.attrs??={})[k]=v;}removeAttribute(k){delete (this.attrs??={})[k];}focus(){}}
const nodes={},get=id=>nodes[id]??=new Node(id),answers=[0,1,2].map(i=>{const n=new Node('a'+i);n.dataset.answer=''+i;return n});for(const[id,cfg]of Object.entries(config))for(const f of cfg.fields)get(id+'-'+f.key).value=f.value;
let depth=false;const listeners={},location={hash:''},document={getElementById:get,body:{classList:{toggle:(k,v)=>depth=v}},querySelectorAll:s=>s==='[data-answer]'?answers:[],querySelector:()=>new Node('focus')};vm.runInNewContext(fs.readFileSync('src/hypothesis.js','utf8'),{HypothesisModels:H,HypothesisConfig:config,document,window:{addEventListener:(k,f)=>listeners[k]=f},location});
for(const id of Object.keys(config)){get(id+'-form').fire('submit');eq(get(id+'-error').textContent,'');ok(get(id+'-chart').innerHTML.includes('<svg'));const valid=get(id+'-chart').innerHTML,f=config[id].fields.find(x=>x.type!=='select');get(id+'-'+f.key).value='';get(id+'-form').fire('submit');ok(get(id+'-error').textContent.includes('last valid'));eq(get(id+'-chart').innerHTML,valid);get(id+'-reset').fire('click');eq(get(id+'-error').textContent,'');}
get('mean-demo-t').fire('click');ok(get('mean-note').textContent.includes('Exact t'));ok(get('mean-metrics').innerHTML.includes('Do not reject'));get('mean-reset').fire('click');get('power-larger').fire('click');eq(get('power-n').value,'128');get('power-reset').fire('click');eq(get('power-n').value,'64');get('variance-form').fire('submit');const v=get('variance-metrics').innerHTML;get('variance-swap').fire('click');eq(get('variance-s1').value,'4');get('variance-swap').fire('click');eq(get('variance-metrics').innerHTML,v);get('paired-after').value='1,2';get('paired-form').fire('submit');ok(get('paired-error').textContent.includes('same number'));get('paired-reset').fire('click');get('depth').checked=true;get('depth').fire('change');ok(depth);
// Invalid paired input retains every last-valid output; reset restores defaults.
get('paired-before').value='13,14,15';get('paired-after').value='10,10,10';get('paired-form').fire('submit');
const pairedOutputs=['chart','metrics','note','data'],pairedLast=pairedOutputs.map(k=>[get('paired-'+k).innerHTML,get('paired-'+k).textContent]);
for(const [before,after] of missingPairs){
 get('paired-before').value=before;get('paired-after').value=after;get('paired-form').fire('submit');
 ok(get('paired-error').textContent.includes('Missing observation'));ok(get('paired-error').textContent.includes('last valid'));
 eq(pairedOutputs.map(k=>[get('paired-'+k).innerHTML,get('paired-'+k).textContent]),pairedLast);
}
get('paired-before').value='13\n14\n15\n';get('paired-after').value='10\n10\n10\n';get('paired-form').fire('submit');
eq(get('paired-error').textContent,'');eq(pairedOutputs.map(k=>[get('paired-'+k).innerHTML,get('paired-'+k).textContent]),pairedLast);
get('paired-reset').fire('click');eq(get('paired-error').textContent,'');ok(get('paired-data').textContent.includes('3, 4, 0, 5, 4, 1, 3, 4'));
// Exercise both interior-null directions through the actual form handlers.
for(const [tail,mu1] of [['greater',48],['less',52]]){
 get('power-tail').value=tail;get('power-mu1').value=mu1;get('power-form').fire('submit');
 eq(get('power-error').textContent,'');ok(get('power-note').textContent.includes('inside H₀'));
 ok(get('power-note').textContent.includes('not a Type II error'));
 ok(!get('power-chart').innerHTML.includes('shaded alternative area'));
}
get('power-reset').fire('click');ok(get('power-note').textContent.includes('this specific alternative'));
answers[0].fire('click');ok(get('quiz-feedback').innerHTML.includes('Reconsider'));answers[1].fire('click');ok(get('quiz-feedback').innerHTML.includes('<b>Yes.</b>'));get('next-question').fire('click');get('previous-question').fire('click');ok(get('quiz').innerHTML.includes('1 explored'));for(let i=0;i<12;i++)get('next-question').fire('click');ok(get('quiz').innerHTML.includes('0 explored'));location.hash='#%bad';listeners.hashchange();location.hash='#paired-lab';get('paired-lab').parentElement=get('paired-section');get('paired-section').tagName='DETAILS';listeners.hashchange();ok(get('paired-section').open);
console.log(`Passed ${checks} Class 6 arithmetic, tail, boundary, content, link, accessibility structure, UI-state and regression assertions.`);

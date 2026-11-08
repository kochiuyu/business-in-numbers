'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),R=require('./src/random-core');let checks=0;const ok=(x,m)=>{checks++;assert.ok(x,m)},eq=(a,b)=>{checks++;assert.deepEqual(a,b)},near=(a,b,t=1e-10)=>ok(Math.abs(a-b)<t,`${a} != ${b}`);
for(const n of [1,2,12,60])for(const p of [0,.01,.25,.5,.99,1]){const d=R.discrete('binomial',{n,p});near(d.mass.reduce((a,b)=>a+b),1);near(d.x.reduce((s,x,i)=>s+x*d.mass[i],0),n*p);near(d.x.reduce((s,x,i)=>s+(x-d.mean)**2*d.mass[i],0),n*p*(1-p));near(R.cdfDiscrete(d,-1),0);near(R.cdfDiscrete(d,n),1);for(const k of [0,1,n]){for(const kind of ['mass','cdf']){const svg=R.discreteSvg(d,k,kind);ok(!/NaN|Infinity/.test(svg));ok(svg.includes('<title')&&svg.includes('<desc'));}ok(R.countSummary(d,k).includes('P(X ≥'));}}
for(const N of [2,10,40,100])for(const K of [0,1,N])for(const n of [0,1,N]){const d=R.discrete('hypergeometric',{N,K,n});near(d.mass.reduce((a,b)=>a+b),1);eq(d.x[0],Math.max(0,n-(N-K)));eq(d.x.at(-1),Math.min(n,K));near(d.x.reduce((s,x,i)=>s+x*d.mass[i],0),n*K/N);}
for(const lambda of [.001,.1,1,4,30]){const d=R.discrete('poisson',{lambda});near(d.mass.reduce((a,b)=>a+b),1,1e-12);ok(d.tail<1e-12);near(d.mass.reduce((s,p,i)=>s+p*d.x[i],0),lambda,1e-10);}
for(const n of [1,6,60]){const d=R.discrete('uniform',{n});near(d.mass.reduce((a,b)=>a+b),1);near(d.mean,(n+1)/2);}
for(const q of [0,.1,.25,.4,.5]){const j=R.joint(q);near(j.cells.reduce((a,b)=>a+b),1);near(j.cells[0]+j.cells[1],.5);near(j.variance,2*q);}
for(const z of [-8,-4,-2,-1,0,1,2,4,8])near(R.normalCdf(z)+R.normalCdf(-z),1);near(R.normalCdf(1),.8413447460685,8e-8);
for(const model of ['normal','uniform','exponential']){const d=R.continuous(model);for(const [l,u] of [[d.lo,d.hi],[0,1],[-100,100],[5,5]]){const p=R.interval(d,l,u);ok(p>=0&&p<=1);for(const kind of ['pdf','cdf']){const svg=R.continuousSvg(d,l,u,kind);ok(!/NaN|Infinity/.test(svg));ok(svg.includes('<title')&&svg.includes('<desc'));}}}
// Narrow continuous models must keep distinct coordinates and nonzero moments visible.
const axisLabels=svg=>[...svg.matchAll(/<text x="[^"]+" y="255"[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
for(const mu of [500,1000000]){
 const d=R.continuous('normal',{mu,sd:.001});
 for(const kind of ['pdf','cdf']){
  const labels=axisLabels(R.continuousSvg(d,mu-.001,mu+.001,kind));
  if(mu===500)eq(labels.length,5);else ok([3,5].includes(labels.length));eq(new Set(labels).size,labels.length);
  labels.forEach((label,i)=>near(Number(label.replaceAll(',','')),mu-.004+i*.008/(labels.length-1),1e-9));
 }
 ok(R.continuousSummary(d,mu-.001,mu+.001).includes('<span>Variance</span><strong>0.000001</strong>'));
}
const broadNormal=R.continuous('normal',{mu:0,sd:1000000});
const densityTicks=[...R.continuousSvg(broadNormal,-1000000,1000000).matchAll(/<text x="[^"]+" y="[^"]+" text-anchor="end" font-size="14"[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]);
eq(densityTicks.length,5);eq(new Set(densityTicks).size,5);
// All tick strings have room within the viewBox, including small density labels
// and large-baseline/small-spread endpoints. Geometry uses the same 8px budget.
for(const d of [broadNormal,R.continuous('normal',{mu:500,sd:.001}),R.continuous('normal',{mu:1000000,sd:.001})]){
 for(const kind of ['pdf','cdf']){
  const svg=R.continuousSvg(d,d.lo,d.hi,kind);
  for(const m of svg.matchAll(/<text x="([^"]+)" y="([^"]+)" text-anchor="(end|middle)" font-size="14"[^>]*>([^<]+)<\/text>/g)){
   const x=Number(m[1]),width=m[4].length*8,left=x-width/(m[3]==='middle'?2:1),right=m[3]==='middle'?x+width/2:x;
   ok(left>=0&&right<=560,`Tick ${m[4]} fits horizontally`);
  }
 }
}
// Dense precision labels reduce in number instead of overlapping adjacent ticks.
for(const d of [R.continuous('uniform',{a:999999.99999,b:1000000}),R.continuous('uniform',{a:-1000000,b:-999999.99999}),R.continuous('normal',{mu:1000000,sd:.001}),broadNormal]){
 for(const kind of ['pdf','cdf']){
  const svg=R.continuousSvg(d,d.lo,d.hi,kind),ticks=[...svg.matchAll(/<text x="([^"]+)" y="255"[^>]*>([^<]+)<\/text>/g)].map(m=>({x:Number(m[1]),width:m[2].length*8}));
  ok([2,3,5].includes(ticks.length));
  ticks.forEach((tick,i)=>{ok(tick.x-tick.width/2>=0&&tick.x+tick.width/2<=560);if(i)ok(tick.x-tick.width/2>=ticks[i-1].x+ticks[i-1].width/2+8,'Adjacent x ticks have an 8px gap');});
 }
}
eq(axisLabels(R.continuousSvg(R.continuous('uniform',{a:999999.99999,b:1000000}),999999.99999,1000000)).length,3);
const fastWait=R.continuous('exponential',{rate:1000});
eq(new Set(axisLabels(R.continuousSvg(fastWait,0,.001))).size,5);
ok(R.continuousSummary(fastWait,0,.001).includes('<span>Variance</span><strong>0.000001</strong>'));
const narrowUniform=R.continuous('uniform',{a:1,b:1.00001});
ok(R.continuousCalculation(narrowUniform,1,1.00001).startsWith('P(1 ≤ X ≤ 1.00001) = F(1.00001) − F(1)'));
eq(new Set(axisLabels(R.continuousSvg(narrowUniform,1,1.00001))).size,5);
ok(!R.continuousSummary(narrowUniform,1,1.00001).includes('<span>Variance</span><strong>0</strong>'));
ok(!R.continuousSummary(narrowUniform,1,1.00001).includes('<span>Standard deviation</span><strong>0</strong>'));
// Default teaching coordinates and probabilities keep their familiar presentation.
eq(axisLabels(R.continuousSvg(R.continuous('normal'),496,504)),['484','492','500','508','516']);
eq(R.continuousCalculation(R.continuous('normal'),496,504),'P(496 ≤ X ≤ 504) = F(504) − F(496) = 0.841345 − 0.158655 ≈ 0.682689. The probability at any one exact value is zero.');
for(const fn of [()=>R.discrete('binomial',{n:1.5}),()=>R.discrete('binomial',{p:NaN}),()=>R.discrete('binomial',{p:1.1}),()=>R.discrete('poisson',{lambda:0}),()=>R.discrete('hypergeometric',{N:40,K:41}),()=>R.discrete('hypergeometric',{N:40,n:41}),()=>R.continuous('uniform',{a:8,b:2}),()=>R.continuous('normal',{sd:0}),()=>R.continuous('exponential',{rate:0}),()=>R.interval(R.continuous('normal'),2,1),()=>R.joint(.6)]){checks++;assert.throws(fn);}
const html=fs.readFileSync('dist/random-variables.html','utf8'),src=fs.readFileSync('src/random-variables.html','utf8'),math=JSON.parse(fs.readFileSync('src/random-math.json','utf8'));
eq(Object.keys(math).length,47);eq((html.match(/class="lesson"/g)||[]).length,12);ok((html.match(/class="code-block"/g)||[]).length>=10);ok(!/\{\{|katex-error/.test(html));ok(!/<script[^>]+src="https?:|<link\b(?=[^>]*rel="stylesheet")[^>]+href="https?:/i.test(html));const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);eq(new Set(ids).size,ids.length);for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(!m[1].includes(':'))ok(fs.existsSync('dist/'+m[1].split('#')[0]),m[1]);}for(const token of ['random-variables.html','Class 3'])ok(fs.readFileSync('dist/probability.html','utf8').includes(token));ok(fs.readFileSync('dist/descriptive-statistics.html','utf8').includes('random-variables.html'));ok(src.includes('.rv-lab{display:block!important}'));
// Event-driven UI state tests with a minimal DOM stand-in; real browser checks are separate.
class Node{set value(v){this._value=String(v)}get value(){return this._value}constructor(id){this.id=id;this.value='';this.innerHTML='';this.textContent='';this.handlers={};this.dataset={};this.classList={toggle(){}};this.tagName='DIV';this.parentElement=null;this.hidden=false;}addEventListener(k,f){this.handlers[k]=f;}fire(k){this.handlers[k]?.({preventDefault(){},target:this});}setAttribute(k,v){(this.attrs??={})[k]=v;}removeAttribute(k){delete (this.attrs??={})[k];}focus(){}getAttribute(a){return this[a];}querySelector(){return this.input??=new Node('input');}}
const nodes={},get=id=>nodes[id]??=new Node(id),countparams=['n','p','lambda','N','K'].map(k=>{const n=new Node(k);n['data-count-param']=k;n.input=get('count-'+k);return n}),contparams=['mu','sd','a','b','rate'].map(k=>{const n=new Node(k);n['data-cont-param']=k;n.input=get('cont-'+k);return n}),answers=[0,1,2].map(i=>{const n=new Node('answer'+i);n.dataset.answer=''+i;return n});
for(const [id,v]of Object.entries({'count-model':'binomial','count-n':12,'count-p':.25,'count-k':3,'count-lambda':4,'count-N':40,'count-K':8,'continuous-model':'normal','cont-mu':500,'cont-sd':4,'cont-a':2,'cont-b':8,'cont-rate':.1,'cont-lower':496,'cont-upper':504,'joint-q':.25}))get(id).value=''+v;
const listeners={},location={hash:''};const doc={getElementById:get,body:{classList:{toggle(){}}},querySelectorAll:s=>s==='[data-count-param]'?countparams:s==='[data-cont-param]'?contparams:s==='[data-answer]'?answers:[],querySelector:()=>new Node('focus')};vm.runInNewContext(fs.readFileSync('src/random.js','utf8'),{document:doc,window:{addEventListener:(k,f)=>listeners[k]=f},location,RandomModels:R});
ok(get('quiz').innerHTML.includes('QUESTION 1 OF 10'));for(const m of ['hypergeometric','bernoulli','poisson','uniform','binomial']){get('count-model').value=m;get('count-model').fire('change');ok(get('count-summary').innerHTML.includes('Mean'));eq(get('count-error').textContent,'');}
get('count-n').value='1.5';get('count-form').fire('submit');ok(get('count-error').textContent.includes('integer'));get('count-n').value='';get('count-form').fire('submit');ok(get('count-error').textContent.includes('Enter a number'));get('count-reset').fire('click');eq(get('count-error').textContent,'');get('count-p').value='0';get('count-form').fire('submit');ok(!/NaN|Infinity/.test(get('count-summary').innerHTML));
for(const m of ['exponential','uniform','normal','uniform']){get('continuous-model').value=m;get('continuous-model').fire('change');ok(get('continuous-summary').innerHTML.includes('Mean'));eq(get('continuous-error').textContent,'');}get('cont-a').value='10';get('continuous-form').fire('submit');ok(get('continuous-error').textContent.includes('a < b'));get('continuous-reset').fire('click');get('cont-lower').value='9';get('continuous-form').fire('submit');ok(get('continuous-error').textContent.includes('must not exceed'));get('continuous-reset').fire('click');eq(get('continuous-error').textContent,'');
get('continuous-model').value='normal';get('continuous-model').fire('change');
for(const [id,value]of Object.entries({'cont-mu':500,'cont-sd':.001,'cont-lower':499.999,'cont-upper':500.001}))get(id).value=value;
get('continuous-form').fire('submit');eq(get('continuous-error').textContent,'');
eq(new Set(axisLabels(get('continuous-pdf').innerHTML)).size,5);
ok(get('continuous-summary').innerHTML.includes('<span>Variance</span><strong>0.000001</strong>'));
get('continuous-reset').fire('click');eq(get('cont-sd').value,'4');
eq(axisLabels(get('continuous-pdf').innerHTML),['484','492','500','508','516']);
for(const q of ['0','.5','.25']){get('joint-q').value=q;get('joint-q').fire('input');ok(get('joint-result').textContent.includes('Var(X+Y)'));}ok(get('joint-result').textContent.includes('independent'));
answers[0].fire('click');ok(get('quiz-feedback').innerHTML.includes('Reconsider'));answers[1].fire('click');ok(get('quiz-feedback').innerHTML.includes('<b>Yes.</b>'));for(let i=0;i<9;i++)get('next-question').fire('click');ok(get('quiz').innerHTML.includes('QUESTION 10 OF 10'));get('next-question').fire('click');ok(get('quiz').innerHTML.includes('0 explored'));get('next-question').fire('click');get('previous-question').fire('click');ok(get('quiz').innerHTML.includes('QUESTION 1 OF 10'));
location.hash='#%invalid';listeners.hashchange();location.hash='#joint';get('joint').tagName='DETAILS';listeners.hashchange();ok(get('joint').open);new vm.Script(fs.readFileSync('src/random-core.js','utf8'));
console.log(`Passed ${checks} Class 3 arithmetic, boundary, markup, coverage, asset and UI-state assertions.`);

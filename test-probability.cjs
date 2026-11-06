'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('./src/probability-core.js'),{renderMath}=require('./scripts/build.cjs');let checks=0;
const ok=(value,message)=>{checks++;assert.ok(value,message);},near=(a,b)=>ok(Math.abs(a-b)<1e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`),equal=(a,b)=>{checks++;assert.deepEqual(a,b);},throws=f=>{checks++;assert.throws(f);};
const b=P.bayes(.01,.9,.05);near(b.tp,90);near(b.fn,10);near(b.fp,495);near(b.tn,9405);near(b.posteriorPositive,2/13);near(b.posteriorNegative,10/9415);near(b.alertRate,.0585);
near(P.bayes(.4,.8,.4).posteriorPositive,4/7);near(P.bayes(.4,.8,.4).posteriorNegative,2/11);near(P.bayes(4/7,.8,.4).posteriorPositive,8/11);near(P.bayes(.2,.9,.05).posteriorPositive,9/11);
for(const p of [0,.01,.2,.4,1])for(const s of [0,.3,.9,1])for(const f of [0,.05,.4,1]){const x=P.bayes(p,s,f);near(x.tp+x.fn+x.fp+x.tn,10000);near(x.positive+x.negative,10000);for(const y of [x.posteriorPositive,x.posteriorNegative])ok(y===null||(y>=0&&y<=1));}
equal(P.bayes(.3,0,0).posteriorPositive,null);equal(P.bayes(.3,1,1).posteriorNegative,null);equal(P.bayes(0,1,.3).posteriorPositive,0);equal(P.bayes(1,.3,0).posteriorPositive,1);
for(const args of [[-1,.2,.3],[.2,NaN,.3],[.2,.3,Infinity],[.2,.3,1.1],[.2,.3,.4,0]])throws(()=>P.bayes(...args));
equal(P.counts(5,3),{permutations:60n,combinations:10n,replacement:125n});equal(P.counts(0,0),{permutations:1n,combinations:1n,replacement:1n});equal(P.counts(20,20).permutations,2432902008176640000n);equal(P.counts(4,2).combinations,6n);
for(const args of [[-1,0],[4,5],[21,1],[5,1.5],[Infinity,1],[NaN,0]])throws(()=>P.counts(...args));
const factorial=n=>n?BigInt(n)*factorial(n-1):1n;
for(let n=0;n<=12;n++)for(let r=0;r<=n;r++){const c=P.counts(n,r);equal(c.permutations,factorial(n)/factorial(n-r));equal(c.combinations,factorial(n)/(factorial(r)*factorial(n-r)));}
equal(P.events.intersection.selected,[4,6]);equal(P.events.union.selected,[2,4,5,6]);equal(P.events.complement.selected,[1,3,5]);equal(P.events.conditional.possible,[4,5,6]);
const eqs=JSON.parse(fs.readFileSync('src/probability-math.json','utf8')),html=fs.readFileSync('dist/probability.html','utf8');
for(const [id,e]of Object.entries(eqs)){const out=renderMath(id,e);ok(out.includes('application/x-tex'));ok(out.includes('Read formula / LaTeX'));ok(out.includes('<math xmlns='));ok(!out.includes('katex-error'));}
equal((html.match(/<math xmlns=/g)||[]).length,23);ok(!/\{\{(?:math|probpython|proboutput):/.test(html));ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);equal(ids.length,new Set(ids).size);
for(const [,ref]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(ref.startsWith('#')){if(ref.length>1)ok(ids.includes(ref.slice(1)),'Missing anchor '+ref);}else if(!ref.includes('://'))ok(fs.existsSync('dist/'+ref.split('#')[0]),'Missing asset '+ref);}
for(const token of ['source','rare','common'])ok(html.includes(`data-bayes="${token}"`));
// Event-driven UI smoke checks with a small DOM stand-in, not a substitute for browser QA.
class Node {constructor(id){this.id=id;this.value='';this.textContent='';this.innerHTML='';this.handlers={};this.dataset={};this.attrs={};this.tagName='DIV';this.open=false;}addEventListener(k,fn){this.handlers[k]=fn;}setAttribute(k,v){this.attrs[k]=v;}focus(){}fire(k,e={}){this.handlers[k]?.({target:this,...e});}}
const nodes={};const get=id=>nodes[id]??=new Node(id);for(const[id,val]of [['prior','1'],['sensitivity','90'],['false-positive','5'],['count-n','5'],['count-r','3']])get(id).value=val;
const buttons=(key,values)=>values.map(v=>{const n=new Node(v);n.dataset[key]=v;return n;});const bayesButtons=buttons('bayes',['rare','common','source']),eventButtons=buttons('event',Object.keys(P.events)),treeSteps=buttons('treeStep',['1','2','3']),treeEvidence=buttons('treeEvidence',['positive','negative']),answerButtons=buttons('answer',['0','1','2']);const body={classList:{toggle(){}}};const listeners={};
const document={body,getElementById:get,querySelectorAll:s=>s==='[data-bayes]'?bayesButtons:s==='[data-event]'?eventButtons:s==='[data-answer]'?answerButtons:s==='button[data-tree-step]'?treeSteps:s==='[data-tree-evidence]'?treeEvidence:[],querySelector:()=>new Node('focus')};
vm.runInNewContext(fs.readFileSync('src/probability.js','utf8'),{document,window:{addEventListener:(k,fn)=>listeners[k]=fn},location:{hash:''},Probability:P,console});
equal(get('posterior-positive').textContent,'15.38%');equal(get('posterior-negative').textContent,'0.11%');ok(get('count-results').innerHTML.includes('125'));ok(get('quiz').innerHTML.includes('QUESTION 1 OF 8'));
bayesButtons[1].fire('click');equal(get('posterior-positive').textContent,'81.82%');bayesButtons[2].fire('click');equal(get('posterior-positive').textContent,'57.14%');get('sensitivity').value='0';get('false-positive').value='0';get('prior').fire('input');equal(get('posterior-positive').textContent,'Undefined');bayesButtons[0].fire('click');equal(get('posterior-positive').textContent,'15.38%');
eventButtons[3].fire('click');ok(get('event-explanation').textContent.includes('denominator is now three'));equal((get('die-space').innerHTML.match(/× excluded/g)||[]).length,3);
get('count-r').value='6';get('calculate-counts').fire('click');ok(get('count-error').textContent.includes('whole numbers'));get('count-r').value='';get('calculate-counts').fire('click');equal(get('count-error').textContent,'Enter both n and r.');get('count-r').value='3';get('count-r').fire('keydown',{key:'Enter',preventDefault(){}});equal(get('count-error').textContent,'');
answerButtons[1].fire('click');ok(get('quiz').innerHTML.includes('<b>Yes.</b>'));for(let i=0;i<7;i++)get('next-question').fire('click');ok(get('quiz').innerHTML.includes('QUESTION 8 OF 8'));get('next-question').fire('click');ok(get('quiz').innerHTML.includes('0 explored'));ok(get('quiz').innerHTML.includes('QUESTION 1 OF 8'));
// Tree rendering, progressive explanation, reverse conditioning and repeated flows.
ok(html.includes('Bayes is a tree read backward.'));
ok(html.includes('chance, not a player’s choices'));
ok(html.includes('Multiply along. Add matching paths. Divide by their total.'));
equal((html.match(/class="tree-branch"/g)||[]).length,2);
equal((html.match(/class="tree-leaf /g)||[]).length,4);
ok(html.includes('90 ÷ (90 + 495) = 90 ÷ 585'));
ok(html.includes('aria-label="Probability tree walkthrough"'));
ok(html.includes('id="tree-working" aria-live="polite" aria-atomic="true"'));
equal(get('bayes-tree').attrs['data-tree-step'],'1');
equal(treeSteps.map(b=>b.attrs['aria-pressed']),['true','false','false']);
ok(get('alert-tree').innerHTML.includes('1% × 90% = 0.90%'));
equal((get('alert-tree').innerHTML.match(/Joint path/g)||[]).length,4);
treeSteps[1].fire('click');
equal((get('alert-tree').innerHTML.match(/✓ Kept/g)||[]).length,2);
equal((get('alert-tree').innerHTML.match(/× Set aside/g)||[]).length,2);
ok(get('tree-working').innerHTML.includes('90 + 495'));
ok(get('tree-working').innerHTML.includes('585 alerted orders'));
treeSteps[2].fire('click');ok(get('tree-working').innerHTML.includes('15.38%'));
ok(get('tree-working').innerHTML.includes('No issue: 84.62%'));
treeEvidence[1].fire('click');ok(get('tree-working').innerHTML.includes('10 ÷ (10 + 9,405)'));
ok(get('tree-working').innerHTML.includes('P(H | −)'));ok(get('tree-working').innerHTML.includes('0.11%'));
equal(treeEvidence.map(b=>b.attrs['aria-pressed']),['false','true']);
// Sliders/presets update the diagram without resetting the walkthrough or observed result.
bayesButtons[2].fire('click');equal(get('bayes-tree').attrs['data-tree-step'],'3');ok(get('tree-working').innerHTML.includes('18.18%'));
treeSteps[0].fire('click');ok(get('tree-working').innerHTML.includes('40% × 80%'));
equal((get('alert-tree').innerHTML.match(/Joint path/g)||[]).length,4);
for(const prior of [0,1,20,40,100])for(const sensitivity of [0,90,100])for(const falsePositive of [0,5,100]){
 get('prior').value=String(prior);get('sensitivity').value=String(sensitivity);get('false-positive').value=String(falsePositive);get('prior').fire('input');
 for(const [evidenceIndex,field]of [[0,'posteriorPositive'],[1,'posteriorNegative']]){
  treeEvidence[evidenceIndex].fire('click');treeSteps[2].fire('click');
  const current=P.bayes(prior/100,sensitivity/100,falsePositive/100),posterior=current[field],work=get('tree-working').innerHTML;
  ok(!/NaN|Infinity/.test(work+get('alert-tree').innerHTML));
  equal((get('alert-tree').innerHTML.match(/✓ Kept/g)||[]).length,2);
  equal((get('alert-tree').innerHTML.match(/× Set aside/g)||[]).length,2);
  if(posterior===null){ok(work.includes('undefined, not 0%'));ok(!work.includes('class="tree-share"'));}
  else{ok(work.includes((posterior*100).toFixed(2)+'%'));ok(work.includes('Dividing the kept paths by their total'));}
  if(prior===0||prior===100)ok(get('tree-model-note').textContent.includes('hypothetical model inputs'));
  treeSteps[1].fire('click');if(posterior===null)ok(get('tree-working').innerHTML.includes('conditioning on this result is undefined'));
 }
}
// A repeat click and a backwards/forwards cycle keep selected states and recover from 0/0.
bayesButtons[0].fire('click');treeEvidence[0].fire('click');treeSteps[2].fire('click');treeSteps[2].fire('click');
ok(get('tree-working').innerHTML.includes('15.38%'));equal(treeSteps.map(b=>b.attrs['aria-pressed']),['false','false','true']);
for(const i of [1,0,1,2])treeSteps[i].fire('click');ok(get('tree-working').innerHTML.includes('15.38%'));
equal(get('tree-model-note').textContent.includes('empty group'),false);
new vm.Script(fs.readFileSync('src/probability.js','utf8'));new vm.Script(fs.readFileSync('src/probability-core.js','utf8'));
console.log(`Passed ${checks} probability, boundary, content, math, asset and UI-state assertions.`);

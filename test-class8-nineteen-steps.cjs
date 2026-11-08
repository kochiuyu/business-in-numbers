'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/regression.html','utf8'),built=fs.readFileSync('dist/regression.html','utf8');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=['regression-step-1','regression-step-2','regression-step-3','regression-centered-sums','regression-step-4','regression-step-5','regression-step-6','regression-step-7','regression-noise','regression-step-8','regression-intercept','regression-step-9','regression-step-10','regression-step-11','regression-step-12','regression-step-13','regression-step-14','regression-step-15','regression-software'];
const cores=['pairs','line','fit','center','coefficients','units','assumptions','residuals','noise','inference','intercept','partition','fitshare','tests','mean','individual','challenge','decision','software'];
function parse(html){
 const nodes=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  if(m[0].startsWith('<!'))continue;
  if(m[0].startsWith('</')){const n=stack.pop();assert.equal(n?.tag,m[1].toLowerCase(),'balanced closing '+m[1]);n.end=m.index+m[0].length;continue;}
  const attrs={};for(const a of m[0].matchAll(/([\w:-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
  const n={tag:m[1].toLowerCase(),attrs,parent:stack.at(-1),start:m.index,end:m.index+m[0].length};nodes.push(n);
  if(!voids.has(n.tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 assert.equal(stack.length,0);return{nodes,byId:id=>nodes.find(n=>n.attrs.id===id),fragment:n=>html.slice(n.start,n.end)};
}
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c),ancestors=n=>{const out=[];for(let p=n.parent;p;p=p.parent)out.push(p);return out;};

const baseline=require('./scripts/class-eight-preservation.cjs').restore(source),old=parse(baseline);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical')))ok(source.includes(old.fragment(n)),'original complete topic/technical section retained '+(n.attrs.id||''));
for(const kind of ['math','regression-tools','line-lab','model-lab'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+'(?::([^}]+))?\\}\\}','g'))].map(m=>m[0]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+'(?::([^}]+))?\\}\\}','g'))].map(m=>m[0]).sort(),'original tokens retained '+kind);
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy anchor '+id);
for(const [name,html]of [['source',source],['built',built]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c8-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+' semantic route');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const[i,part]of parts.entries()){
  const alias=t.byId('class8-step-'+(i+1));ok(alias&&ancestors(alias).includes(part),name+' canonical alias '+(i+1));
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class8-step-'+(i+1)),name+' reachable step '+(i+1));
  if(name==='built'){
   const core=t.byId('c8-core-'+cores[i]);ok(core&&ancestors(core).includes(part),name+' core in correct step '+cores[i]);
   ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' core visible without disclosure '+cores[i]);
   ok(t.fragment(core).includes('<ol>')&&t.fragment(core).includes('<summary>Check'),'visible worked sequence and learner check '+cores[i]);
  }
 }
 if(name==='built')ok(!/\{\{(?:regvisual|regcore|math|activity):|katex-error/.test(html),'no unresolved teaching templates');
}
const t=parse(built);
// The first-pass transition must define the population model before its proof.
// Checking text outside details prevents these essentials moving into an optional panel.
const modelCore=t.byId('c8-core-assumptions');
const modelVisible=t.fragment(modelCore).replace(/<details\b[\s\S]*?<\/details>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
for(const needle of ['yᵢ = α + βxᵢ + εᵢ','unknown population intercept','unknown population slope','week’s departure from its population mean','fitted a and b estimate α and β','not a test’s significance level','E(yᵢ | x) means','E(εᵢ | x) = 0','Common error variance σ²','Step 9 estimates it with s²','treating the observed spend values as fixed','weights determined only by the predictors','across repeated samples','smallest sampling variance within that class','linear in the observed outcomes'])ok(modelVisible.includes(needle),'first-pass population-model meaning '+needle);
ok(modelVisible.indexOf('yᵢ = α + βxᵢ + εᵢ')<modelVisible.indexOf('b = Σwᵢyᵢ'),'define model before using weighted-slope proof');
const claims={pairs:['(3,16)','n = 8'],line:['17.5','19.29'],fit:['SSE = 8','81/14'],center:['36/8','Sxx = 2','Sxy = 22.75'],coefficients:['bSxx = Sxy','247/28','42δb²'],units:['27/28','x* = 9'],assumptions:['Σwᵢ = 0','1/42','independent normal'],residuals:['39/28','−43/28'],noise:['4536/784','8 − 2 = 6','27/28'],inference:['0.151523','12.727922','[1.557808, 2.299335]'],intercept:['0.765153','[6.949167, 10.693691]','0.347183'],partition:['2187/14','162'],fitshare:['27/28','96.43%'],tests:['162','0.000007215'],mean:['0.347183','[16.650475, 18.349525]','0.633866'],individual:['1.041548','[14.951425, 20.048575]'],challenge:['31.964286','5/12','11/84'],decision:['19.29','149.51–200.49'],software:['F.DIST.RT(162,1,6)','scipy.stats.t.sf']};
for(const[id,needles]of Object.entries(claims)){const f=t.fragment(t.byId('c8-core-'+id)).replace(/<[^>]*>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/\s+/g,' ');for(const text of needles)ok(f.includes(text),'visible calculation and condition '+id+' '+text);}
const near=(a,b,tol=1e-8)=>ok(Math.abs(a-b)<tol,`independent arithmetic ${a} = ${b}`);
const xs=[1,2,3,4,5,6,7,8],ys=[11,12,16,15,19,20,23,24],sx=xs.reduce((s,x)=>s+(x-4.5)**2,0),sy=xs.reduce((s,x,i)=>s+(x-4.5)*(ys[i]-17.5),0),b=sy/sx,a=17.5-b*4.5,e=xs.map((x,i)=>ys[i]-a-b*x),sse=e.reduce((s,x)=>s+x*x,0),sd=Math.sqrt(sse/6),seb=sd/Math.sqrt(sx),sea=sd*Math.sqrt(1/8+4.5**2/sx),tc=2.4469118511449692;
near(sx,42);near(sy,81);near(b,27/14);near(a,247/28);near(sse,81/14);near(sd**2,27/28);near(seb,.1515228816828316);near((b/seb)**2,162);near(a-tc*sea,6.94916651543874);near(17.5-tc*sd/Math.sqrt(8),16.650474934689374);near(17.5+tc*sd*Math.sqrt(1+1/8),20.04857519593188);
for(const[id,step]of [['relationship',1],['line',2],['least-squares',3],['coefficients',5],['units',6],['assumptions',7],['em-residual-bridge',8],['residuals',9],['inference',10],['regression-anova',12],['r-square',13],['f-test',14],['mean-response',15],['individual-response',16],['model-lab',17],['regression-causal-check',18],['tools',19],['practice',19],['regression-source-example',19]])ok(ancestors(t.byId(id)).includes(t.byId(expected[step-1])),'legacy subject destination '+id);
for(const n of old.nodes.filter(n=>n.tag==='a'&&n.attrs.href))ok(source.includes('href="'+n.attrs.href.replaceAll('index.html','descriptive-statistics.html')+'"')||/^#regression-step-/.test(n.attrs.href),'original linked resource retained '+n.attrs.href);
const appendix=t.fragment(t.byId('regression-source-example'));ok(appendix.includes('tabindex="0" role="region" aria-label="Original five-point regression data.'),'source table keyboard scroll region');for(const needle of ['13.1','0.367198','−1.402985','3.028201','extrapolation','xTx5VeFzg7I','VeRj47DHn0s'])ok(appendix.includes(needle),'source example restored '+needle);
const alt=require('./src/regression-core.js').fit([[1,4],[2,7],[3,6],[4,4],[5,9]],.05,6);near(alt.a,3.9);near(alt.b,.7);near(alt.SSE,13.1);near(alt.SST,18);near(alt.SSR,4.9);near(alt.pB,.3671975610337104);near(alt.F,1.1221374045801524);near(alt.meanCI[0],1.12518893342);near(alt.predPI[1],17.737086402889);
console.log(`Passed ${checks} Class 8 nineteen-step route, topic/formula preservation, visible arithmetic, independent math and deep-link checks.`);

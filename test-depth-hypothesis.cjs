'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {compile}=require('./scripts/build.cjs');
const H=require('./src/hypothesis-core.js');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,tol=1e-10)=>ok(Math.abs(a-b)<=tol,`${a} differs from ${b}`);
const source=fs.readFileSync('src/hypothesis-testing.html','utf8');
const math=JSON.parse(fs.readFileSync('src/hypothesis-math.json','utf8'));
ok((source.match(/<!-- DEPTH48:c6-[a-z-]+:START -->/g)||[]).length===4,'four independently removable additions');
const originalHtml=require('./scripts/readability-preservation.cjs').restore(source,'hypothesis-testing').replace(/<!-- DEPTH48:c6-[a-z-]+:START -->[\s\S]*?<!-- DEPTH48:c6-[a-z-]+:END -->/g,'');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
ok(digest(originalHtml)==='704d1fa9bce8ed3e9f4662a6a47f378bd8829ab296911cf6b7ad13ca48d4ad14','all pre-revision Class 6 HTML preserved byte-for-byte');
const originalMath=Object.fromEntries(Object.entries(math).filter(([key])=>!key.startsWith('depth-')));
ok(digest(JSON.stringify(originalMath,null,2)+'\n')==='a04568c9407717b8561bb54600e6cb483d71c66491a4ef31edcbde3681cb8799','every pre-revision Class 6 formula preserved');
const compiled=compile(source,math); // In-memory KaTeX validation; never writes dist.
const variants=[['source',source],['compiled in memory',compiled]];
if(process.argv.includes('--built'))variants.push(['built',fs.readFileSync('dist/hypothesis-testing.html','utf8')]);
const cases=[
 ['c6-pooled-steps',11,['784','351','1135','49/88','88 residual degrees','−3.5140','−0.4860'],['depth-pooled-variance','depth-pooled-test']],
 ['c6-welch-steps',12,['.320','.225','87.6730','−3.4672','−0.5328','not guaranteed'],['depth-welch-se','depth-welch-df']],
 ['c6-proportion-steps',14,['30 of 50','28 of 40','32.22/17.78','25.78/14.22','−29.65, 9.65','each visitor the same weight'],['depth-prop-pool','depth-prop-test','depth-prop-interval']],
 ['c6-f-tail-steps',15,['49 numerator df and 39 denominator df','.19274','.55303 and 1.84629','.54163 and 1.80821','1.2247'],['depth-f-reciprocal']]
];
for(const [name,html] of variants){
 for(const [id,step,phrases,keys] of cases){
  const block=html.match(new RegExp(`<section class="c6-depth-worked" id="${id}"[\\s\\S]*?</section>`))?.[0];
  ok(block,`${name}: ${id} present`);
  ok(html.includes(`<!-- DEPTH48:${id}:START -->`)&&html.includes(`<!-- DEPTH48:${id}:END -->`),`${id} has preservation markers`);
  ok(html.split(`id="${id}"`).length===2,`${name}: ${id} unique`);
  ok(block.includes(`aria-labelledby="${id}-title"`)&&block.includes(`id="${id}-title"`),`${id} has an accessible name`);
  ok((block.match(/<li>/g)||[]).length>=3,`${id} explains intermediate steps`);
  ok(block.includes('<details><summary>Check:'),`${id} has a native reasoning check`);
  ok(!/<script|<button|<input|\shidden(?:\s|=|>)/.test(block),`${id} remains useful without JavaScript`);
  ok(html.indexOf(`id="${id}"`)>html.indexOf(`id="class6-step-${step}"`)&&html.indexOf(`id="${id}"`)<html.indexOf(`id="class6-step-${step+1}"`),`${id} stays in its lesson`);
  for(const phrase of phrases)ok(block.includes(phrase),`${name}: ${id} retains ${phrase}`);
  for(const key of keys){
   ok(math[key]?.display===true&&math[key].text.length>40,`${key} has accessible equation metadata`);
   if(name==='source')ok(block.includes(`{{math:${key}}}`),`${key} uses existing math pipeline`);
   else ok(block.includes(`data-math="${key}"`),`${key} rendered in ${name}`);
  }
 }
 for(const id of ['hypotheses','errors-power','testing-procedure','known-variance','unknown-variance','test-and-interval','one-proportion','two-sample-design','pooled-means','welch-means','paired-means','two-proportions','variance-ratio','reporting','tools'])ok(html.includes(`id="${id}"`),`${name}: original topic ${id} retained`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 ok(ids.length===new Set(ids).size,`${name} has no duplicate IDs`);
}
for(const token of ['power-lab','mean-lab','proportion-lab','independent-lab','paired-lab','twoprop-lab','variance-lab','hypothesis-tools'])ok(source.includes(`{{${token}}}`),`original ${token} retained`);
const css=fs.readFileSync('src/class-six.css','utf8');
ok(css.includes('@media(max-width:700px){.c6-depth-worked'), 'narrow-screen worked-example padding');
ok(css.includes('.c6-depth-worked>details>summary:focus-visible'),'visible keyboard focus');
ok(!/\{\{math:|katex-error/.test(compiled),'all formulas render without errors');
// Derive quantities independently from the original example's summaries.
const nA=50,nB=40,sdA=4,sdB=3,gap=40-42;
const ssA=(nA-1)*sdA**2,ssB=(nB-1)*sdB**2;
near(ssA,784);near(ssB,351);near(ssA+ssB,1135);
const pooledVariance=(ssA+ssB)/(nA+nB-2),pooledSE=Math.sqrt(pooledVariance*(1/nA+1/nB));
near(pooledVariance,12.897727272727273);near(pooledSE,.7618383865838786);near(gap/pooledSE,-2.6252287036468456);
const a=sdA**2/nA,b=sdB**2/nB,welchSE=Math.sqrt(a+b),welchDF=(a+b)**2/(a*a/(nA-1)+b*b/(nB-1));
near(a,.320);near(b,.225);near(welchSE,.73824115301167);near(welchDF,87.67300719391125);
ok(a>b,'more observations alone do not imply the more precise mean');
// Tail and interval constants independently obtained with SciPy 1.17.0 (stats.t/normal/F).
// Compare the actual interactive implementation with these external oracles.
const inputs={n1:nA,m1:40,s1:sdA,n2:nB,m2:42,s2:sdB,delta0:0,tail:'two',alpha:.05};
for(const [method,se,df,p,lo,hi] of [
 ['pooled',pooledSE,88,.010209852449239396,-3.513993704297472,-.48600629570252796],
 ['welch',welchSE,welchDF,.008112062703460167,-3.467175428758461,-.5328245712415394]
]){
 const r=H.independent({...inputs,method});near(r.se,se);near(r.df,df);near(r.p,p);near(r.ci[0],lo);near(r.ci[1],hi);ok(r.reject,`${method} two-sided conclusion`);
 const reverse=H.independent({method,n1:nB,m1:42,s1:sdB,n2:nA,m2:40,s2:sdA,delta0:0,tail:'two',alpha:.05});
 near(reverse.p,r.p);near(reverse.stat,-r.stat);near(reverse.ci[0],-r.ci[1]);
}
const pool=58/90,p1=30/50,p2=28/40;
near(pool,(50/90)*p1+(40/90)*p2);ok(Math.abs(pool-(p1+p2)/2)>.001,'unequal sample sizes require unequal pooling weights');
const se0=Math.sqrt(pool*(1-pool)*(1/50+1/40)),seCI=Math.sqrt(p1*(1-p1)/50+p2*(1-p2)/40);
near(se0,.10154364141151877);near(seCI,.10024968827881711);
const prop=H.twoprop({k1:30,n1:50,k2:28,n2:40,tail:'two',alpha:.05});
near(prop.pooled,pool);near(prop.effect,-.1);near(prop.se,se0);near(prop.ciSE,seCI);near(prop.stat,-.984798246447919);
near(prop.p,.324723182160536);near(prop.ci[0],-.29648577848784874);near(prop.ci[1],.09648577848784873);
ok(!prop.reject&&prop.adequate&&prop.ciAdequate,'non-rejection with adequate expected and observed counts');
for(const [i,e]of [32.22222222222222,17.777777777777775,25.77777777777778,14.222222222222221].entries())near(prop.expected[i],e);
const f=H.variance({s1:Math.sqrt(30),n1:50,s2:Math.sqrt(20),n2:40,tail:'two',alpha:.05});
const reciprocal=H.variance({s1:Math.sqrt(20),n1:40,s2:Math.sqrt(30),n2:50,tail:'two',alpha:.05});
near(f.stat,1.5);near(reciprocal.stat,2/3);near(f.left,.903630777610538);near(f.right,.09636922238946198);near(f.p,.19273844477892396);
near(reciprocal.p,f.p);near(reciprocal.left,f.right);near(reciprocal.upper,1/f.lower);near(reciprocal.lower,1/f.upper);
ok(f.d1===49&&f.d2===39&&reciprocal.d1===39&&reciprocal.d2===49,'reciprocation swaps df');
ok(!f.reject&&!reciprocal.reject,'both ratio directions give the same two-sided decision');
near(Math.sqrt(1.5),1.224744871391589);
console.log(`Class 6 deepening: ${checks} preservation, static accessibility, rendered math, arithmetic, independent-oracle and reciprocal checks passed${process.argv.includes('--built')?' including built output':''}.`);

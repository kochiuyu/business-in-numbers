'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},near=(a,b,t=1e-12)=>ok(Math.abs(a-b)<=t,`${a} versus ${b}`);
const factorial=n=>{let out=1;for(let k=2;k<=n;k++)out*=k;return out};
// Independent closed-form PMFs, not the course's recurrence implementation.
const choose=(n,k)=>{let out=1;for(let j=1;j<=k;j++)out*=((n-j+1)/j);return out};
const binomial=(n,p,x)=>choose(n,x)*p**x*(1-p)**(n-x);
const poisson=(lambda,x)=>Math.exp(-lambda)*lambda**x/factorial(x);
for(const lambda of [.05,.5,2,7.5]){
 for(const x of [0,1,2,3,7]){
  for(const n of [20,100,1000]){
   const p=lambda/n;
   near(binomial(n,p,x+1)/binomial(n,p,x),(n-x)*p/((x+1)*(1-p)),1e-11);
   near((n-x)*p/((x+1)*(1-p)),lambda/(x+1)*(1-x/n)/(1-lambda/n),1e-12);
  }
  let recurrence=Math.exp(-lambda);
  for(let j=1;j<=x;j++)recurrence*=lambda/j;
  near(recurrence,poisson(lambda,x));
  const far=binomial(100000,lambda/100000,x);
  near(far,poisson(lambda,x),5e-6);
 }
 let normalization=0;
 for(let x=0;x<=100;x++)normalization+=poisson(lambda,x);
 near(normalization,1);
 near(binomial(100000,lambda/100000,0),Math.exp(-lambda),3e-6);
}
near(binomial(100,.02,1)/binomial(100,.02,0),2/.98);
near(poisson(2,1)/poisson(2,0),2);
eq((2/.98).toFixed(4),'2.0408');
for(const n of [1,10,100]){near(binomial(n,0,0),1);for(let x=1;x<=n;x++)near(binomial(n,0,x),0)}
const source=fs.readFileSync('src/random-variables.html','utf8'),html=fs.readFileSync('dist/random-variables.html','utf8');
const marker=/<!-- poisson-limit-steps:start -->[\s\S]*?<!-- poisson-limit-steps:end -->/;
const sourceBlock=source.match(marker)?.[0];ok(sourceBlock,'one bounded derivation inserted');
eq(source.split('id="poisson-limit-steps"').length,2);
const start=source.indexOf('<!-- poisson-limit-steps:start -->');
ok(start>source.indexOf('Technical depth · Poisson as a rare-event limit')&&start<source.indexOf('{{math:poisson-limit}}'),'within existing optional Poisson technical block');
for(const s of [source,html]){
 for(const phrase of ['Compare neighboring counts.','Anchor the probability of zero.','Build the other probabilities.','Check that these masses total one.','keep the nonnegative integer count x fixed','not an exact equality for a finite binomial model','does not assume we can exchange an infinite sum and a limit','2/.98 ≈ 2.0408','without dividing zero probabilities'])ok(s.includes(phrase),phrase);
 ok(s.includes('aria-labelledby="poisson-limit-steps-title"'),'named section');
}
const keys=['poisson-limit-ratio','poisson-limit-zero','poisson-limit-recurrence','poisson-limit-normalization'];
const math=JSON.parse(fs.readFileSync('src/random-math.json','utf8'));
const katex=require('katex');
for(const key of keys){
 ok(sourceBlock.includes('{{math:'+key+'}}'),'used formula '+key);
 ok(math[key].text.length>80&&math[key].title===math[key].text,'plain-language accessible formula '+key);
 const rendered=katex.renderToString(math[key].tex,{displayMode:true,throwOnError:true,output:'htmlAndMathml'});
 ok(rendered.includes('<math')&&!rendered.includes('katex-error'),'valid MathML '+key);
 delete math[key];
}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
eq(hash(source.replace(marker,'')),'aa0608ae68212b8d983403ae0f6cde1b814b1e375f3c155639779aa5dfbca2f1','every pre-revision Class 3 source byte remains unchanged');
eq(hash(JSON.stringify(math,null,2)+'\n'),'a7d4d68a2efd82c005eda05105ebd81be5c5332aa320e86833d9bfa9900852af','all 43 previous formulas remain unchanged');
ok(!/\{\{math:|katex-error/.test(html),'all formulas built');
console.log(`Passed ${checks} Poisson-limit assertions: finite ratios, fixed-count convergence, recurrence, normalization, zero boundary, accessible formulas and exact source preservation.`);

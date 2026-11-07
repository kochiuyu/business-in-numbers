'use strict';
// These arithmetic oracles enumerate observations directly rather than copying
// production formulas. No build occurs here; --built also checks the final pages.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {compile}=require('./scripts/build.cjs');
const Sampling=require('./src/sampling-core.js'),Estimation=require('./src/estimation-core.js');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const equal=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const near=(a,b,tol=1e-10)=>ok(Math.abs(a-b)<tol,`${a} ≈ ${b}`);
const average=x=>x.reduce((s,v)=>s+v,0)/x.length;
const variance=x=>average(x.map(v=>(v-average(x))**2));
function samples(values,n){if(n===0)return [[]];return samples(values,n-1).flatMap(xs=>values.map(v=>[...xs,v]));}

// Three draws: independent enumeration checks every bar, its center and variance.
const triples=samples([10,20,30],3),totals=new Map();
for(const xs of triples){const sum=xs.reduce((s,v)=>s+v,0);totals.set(sum,(totals.get(sum)||0)+1);}
equal(triples.length,27);
equal([...totals.keys()],[30,40,50,60,70,80,90]);
equal([...totals.values()],[1,3,6,7,6,3,1]);
equal(triples.filter(xs=>xs.reduce((a,b)=>a+b,0)===60).length,7);
const means=triples.map(average);near(average(means),20);near(variance(means),200/9);
near(2*(100+3*(20/3)**2+6*(10/3)**2)/27,variance(means));
near(Math.sqrt(variance(means)),4.714045207910317);
const production=Sampling.exact(3);equal(production.counts,[...totals.values()]);
production.x.forEach((x,i)=>near(x,[...totals.keys()][i]/3));near(production.variance,variance(means));
for(let n=1;n<=5;n++){
 const xs=samples([10,20,30],n),sums=xs.map(x=>x.reduce((a,b)=>a+b,0));
 near(variance(sums),n*(200/3));near(variance(sums.map(s=>s/n)),200/(3*n));
}
// The complement uses strict success and non-strict failure at the tolerance.
const lowerBound=n=>Math.max(0,1-144/(n*3**2));
near(lowerBound(1),0);near(lowerBound(16),0);near(lowerBound(100),.84);
near(lowerBound(320),.95);near(lowerBound(400),.96);
ok(lowerBound(319)<.95,'320 is the smallest integer that makes this bound at least .95');
for(const x of [8.999,9,9.001,12,14.999,15,15.001])
 equal(Math.abs(x-12)<3,!(Math.abs(x-12)>=3),'success and failure are exact complements');

// The five observed orders are used as a finite test population only for this
// exhaustive oracle. This does not assert that the lesson's sample is a census.
const orders=[46,52,48,54,50];near(average(orders),50);near((orders[0]+orders[3])/2,50);
const draws=samples(orders,5),all=draws.map(average),partial=draws.map(x=>(x[0]+x[3])/2);
near(average(all),50);near(average(partial),50);
near(variance(all),variance(orders)/5);near(variance(partial),variance(orders)/2);
near(variance(partial)/variance(all),2.5);near(Math.sqrt(variance(partial)/variance(all)),1.5811388300841898);
const rss=orders.reduce((s,x)=>s+(x-50)**2,0),other=orders.reduce((s,x)=>s+(x-52)**2,0);
near(rss,40);near(other,60);near(other-rss,5*(50-52)**2);
equal(orders.map(x=>(x-52)**2),[36,0,16,4,4]);
near(average(draws.map(x=>x.reduce((s,v)=>s+(v-average(x))**2,0)/4)),variance(orders));
near(average(draws.map(x=>x.reduce((s,v)=>s+(v-average(x))**2,0)/5)),4/5*variance(orders));
for(const xs of samples([0,2,7],3))for(const mu of [-1,0,3,9]){
 const mean=average(xs),res=xs.reduce((s,x)=>s+(x-mean)**2,0);
 near(xs.reduce((s,x)=>s+(x-mu)**2,0),res+xs.length*(mean-mu)**2);
 near(xs.reduce((s,x)=>s+x-mean,0),0);
}

// Grouping binary residuals and separating individual spread from rate variance.
const binary=[...Array(48).fill(1),...Array(152).fill(0)],p=average(binary);
near(p,.24);near(48*(1-p)**2,27.7248);near(152*p*p,8.7552);
const binaryRss=binary.reduce((s,x)=>s+(x-p)**2,0);
near(binaryRss,36.48);near(binaryRss/200,.1824);near(binaryRss/199,.18331658291457287);
near(binaryRss/200**2,.000912);near(binaryRss/199/200,.0009165829145728644);
near(Math.sqrt(binaryRss/200**2),.030199337741083);
near(Estimation.proportion(48,200).se,Math.sqrt(binaryRss/200**2));
// Check the unbiased correction over all zero-one samples of a small fixed size.
let expectedPlug=0,expectedCorrected=0;
for(const xs of samples([0,1],5)){
 const k=xs.reduce((a,b)=>a+b,0),prob=.24**k*.76**(5-k),rate=k/5;
 expectedPlug+=prob*rate*(1-rate);expectedCorrected+=prob*5/4*rate*(1-rate);
}
near(expectedPlug,4/5*.24*.76);near(expectedCorrected,.24*.76);

// Independent normal quantile constant checks printed endpoints and event algebra.
const z=1.959963984540054,se=18/Math.sqrt(81),margin=z*se;
near(se,2);near(margin,3.919927969080108);near(72-margin,68.0800720309199);
near(72+margin,75.9199279690801);near(Estimation.meanCI('z',72,18,81,.95).me,margin);
for(const a of [.5,2,10])for(const c of [1,1.96,2.576])for(const mean of [-3,0,72])
 for(const mu of [mean-c*a-1,mean-c*a,mean,mean+c*a,mean+c*a+1]){
  const central=Math.abs((mean-mu)/a)<=c+1e-12;
  const interval=mean-c*a-1e-12<=mu&&mu<=mean+c*a+1e-12;
  equal(central,interval,'pivot event and parameter interval are equivalent, including endpoints');
 }

const configs=[
 {page:'sampling-distributions',math:'sampling',step:'sampling',hash:'163dcd86a734ea48998d5c09e22d44b9eb158d7f364500443818ed7a46e50a41',
  blocks:[['depth-sampling-three-draws',2],['depth-sampling-variance-steps',3],['depth-sampling-error-bound',4]],
  formulas:['depth-three-draw-distribution','depth-three-draw-variance','depth-sum-to-average','depth-lln-precision'],
  phrases:['three independent draws with replacement','7/27','4.7140','variance of the <em>average</em>','at least .95','estimated moments or a biased sample']},
 {page:'estimation',math:'estimation',step:'estimation',hash:'00cb494aff8cdf81d6fd575b594c09e3037ba7f3c5fd7786a67dc60ad5c3deee',
  blocks:[['depth-estimation-equal-results',2],['depth-estimation-fitted-center',3],['depth-estimation-binary-spread',4],['depth-estimation-invert-interval',5]],
  formulas:['depth-fixed-weight-comparison','depth-centered-squares','depth-binary-residuals','depth-interval-rearrangement'],
  phrases:['before seeing their values','2.5 times the variance','1.5811 times as large','not a claim about the true population mean','36.48','.000916583','It supplies the <em>upper</em> endpoint','approximate</em> coverage statement']}
];
for(const config of configs){
 const source=fs.readFileSync(`src/${config.page}.html`,'utf8');
 const math=JSON.parse(fs.readFileSync(`src/${config.math}-math.json`,'utf8'));
 let original=source;
 for(const [id,step] of config.blocks){
  const start=`<!-- depth48:${id}:start -->`,end=`<!-- depth48:${id}:end -->`;
  equal(source.split(start).length,2,`${id} unique start`);equal(source.split(end).length,2,`${id} unique end`);
  const i=source.indexOf(start),j=source.indexOf(end)+end.length,block=source.slice(i,j);
  ok(i>source.indexOf(`id="${config.step}-step-${step}"`)&&j<source.indexOf(`id="${config.step}-step-${step+1}"`),`${id} correct step`);
  ok(block.includes(`aria-labelledby="${id}-title"`)&&block.includes(`id="${id}-title"`),`${id} labelled`);
  ok(block.includes('<details><summary>'),`${id} native disclosure`);
  ok(!/class="lesson"| hidden|<script|<button/.test(block),`${id} no duplicate lesson or JS-only content`);
  original=original.replace(block,'');
 }
 equal(crypto.createHash('sha256').update(original).digest('hex'),config.hash,'removing additions recovers entire original HTML exactly');
 // Render equations in memory, without changing dist or invoking the build.
 const compiled=compile(source,math);
 for(const id of config.formulas){
  equal(source.split(`{{math:${id}}}`).length,2,`${id} source once`);
  equal(compiled.split(`data-math="${id}"`).length,2,`${id} compiled once`);
  ok(compiled.includes('class="math-scroll" tabindex="0" role="region"'),'keyboard-scrollable math');
  ok(math[id].text.length>70&&math[id].title.length>10,`${id} meaningful text alternative`);
 }
 ok(!compiled.includes('{{math:')&&!compiled.includes('katex-error'),'math complete and valid');
 for(const phrase of config.phrases)ok(source.includes(phrase),phrase);
 const pages=[compiled];
 if(process.argv.includes('--built'))pages.push(fs.readFileSync(`dist/${config.page}.html`,'utf8'));
 for(const html of pages){
  for(const [id]of config.blocks)equal(html.split(`id="${id}"`).length,2,`${id} rendered exactly once`);
  for(const id of config.formulas)equal(html.split(`data-math="${id}"`).length,2,`${id} rendered exactly once`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);equal(ids.length,new Set(ids).size,'unique IDs');
 }
 if(process.argv.includes('--built')){
  const built=pages[1];ok(!built.includes('{{'),'no unresolved build tokens');
  equal((built.match(/data-math="/g)||[]).length,Object.keys(math).length,'complete built math inventory');
 }
}
console.log(`Passed ${checks} Class 4–5 depth checks: exact enumeration, variance steps, Chebyshev bounds, fixed-weight efficiency, fitted-center and binary identities, interval algebra, accessible math and exact source preservation${process.argv.includes('--built')?', including built pages':''}.`);

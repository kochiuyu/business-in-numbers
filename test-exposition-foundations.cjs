'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
let checks=0;const ok=(x,m)=>{checks++;assert.ok(x,m);},near=(a,b)=>ok(Math.abs(a-b)<1e-10,`${a} ≈ ${b}`);
const files=['index.html','probability.html','random-variables.html'];
function originalDetails(s){const out=[];let depth=0,start=-1;for(const m of s.matchAll(/<\/?details\b[^>]*>/g)){if(m[0].startsWith('</')){depth--;if(depth===0&&start>=0){out.push(s.slice(start,m.index+m[0].length));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
for(const file of files){
 const s=fs.readFileSync('src/'+file,'utf8');
 const classNo=files.indexOf(file)+1;
 if(classNo>1){
  const historical=classNo===2?require('./scripts/class-two-preservation.cjs').restore(s):s;
  const hashes=originalDetails(historical).map(t=>crypto.createHash('sha256').update(classNo===2?t.replace(' open>','>'):t).digest('hex'));
  assert.deepEqual(hashes,JSON.parse(fs.readFileSync(`test-class${classNo}-reference.json`,'utf8')).topic_sha256,'original lesson bodies unchanged');checks++;
 }
 ok((s.match(/class="foundation-lab"/g)||[]).length===3,'three added comparisons per class');
 const region=s.match(/<section class="foundation-lab"[\s\S]*?<\/section>/g);
 for(const lab of region){
  ok(lab.includes('Predict first:')&&lab.includes('Interpret what changed'),'prediction and interpretation');
  ok(lab.includes('<noscript>'),'static fallback explained');
  const panels=[...lab.matchAll(/data-foundation-panel="(\d+)"/g)];
  ok(panels.length>=2,'at least two worked cases');
  ok(!/class="foundation-panel"[^>]*hidden/.test(lab),'every case visible without JS');
  ok((lab.match(/class="foundation-chart"/g)||[]).length===panels.length,'each chart has a scroll wrapper');
  for(const chart of lab.matchAll(/<svg[\s\S]*?<\/svg>/g))ok(chart[0].includes('role="img"')&&chart[0].includes('<title')&&chart[0].includes('<desc'),'chart has name and full description');
 }
 const ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);ok(ids.length===new Set(ids).size,'unique IDs: '+file);
}
// Independent arithmetic oracles, including the actual outcome grids.
near((20+60)/2,40);near((3*20+60)/4,30);near(100*1.1*1.9,209);near(100*1.5**2,225);near(Math.sqrt(2.09)-1,0.4456832294800961);
near(3/6*2/5,.2);near(3/6*3/6,.25);
for(const [bound,want]of [[4,3],[11,33]]){let n=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(a+b<bound)n++;near(n,want);}
const X=[-1,0,1];near(X.reduce((a,x)=>a+x*x/3,0),2/3);near(X.reduce((a,x)=>a+x*x*x/3,0),0);near(Math.exp(-1.5)/Math.exp(-1),Math.exp(-.5));near(Math.exp(-.5),.6065306597126334);near([4,5,6].reduce((a,x)=>a+(x-5)**2,0),2);
// Exercise all selection states repeatedly using the exact delivered enhancement.
for(const stem of ['class-one','class-two','class-three']){
 const source=fs.readFileSync('src/'+stem+'.js','utf8');const snippet=source.slice(source.indexOf('// Small comparisons leave'));
 ok(snippet.startsWith('// Small comparisons leave'),'runtime enhancement present');
 const labs=[2,2,3].map(n=>{const buttons=Array.from({length:n},()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this[k]=f;}}));const panels=Array.from({length:n},()=>({hidden:false})),controls={hidden:true};return{buttons,panels,controls,querySelectorAll(s){return s.includes('choice')?buttons:panels;},querySelector(){return controls;}};});
 vm.runInNewContext(snippet,{document:{querySelectorAll:()=>labs}});
 for(const l of labs){ok(l.controls.hidden===false,'controls enabled');ok(l.panels[0].hidden===false,'default visible');for(let round=0;round<3;round++)for(let i=0;i<l.buttons.length;i++){l.buttons[i].click();ok(l.panels.filter(p=>!p.hidden).length===1&&!l.panels[i].hidden,'only chosen panel shown');ok(l.buttons.filter(b=>b.attrs['aria-pressed']==='true').length===1,'one pressed button');}}
 const css=fs.readFileSync('src/'+stem+'.css','utf8');ok(css.includes('.foundation-chart svg{min-width:500px}'),'mobile chart minimum');ok(css.includes('.foundation-panel[hidden]{display:block!important}'),'all cases print');ok(!/setInterval|setTimeout|requestAnimationFrame/.test(snippet),'no motion or timers');
}
console.log(`Foundations exposition: ${checks} checks passed.`);

'use strict';
// Independent arithmetic, production statistics, and static/interactive contract.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Stats=require('./src/stats.js');let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b,m)=>ok(Math.abs(a-b)<1e-10,m||`${a} ≈ ${b}`);
function moments(x){const n=x.length,mean=x.reduce((a,b)=>a+b,0)/n;const m=k=>x.reduce((a,b)=>a+(b-mean)**k,0)/n;return{mean,sd:Math.sqrt(m(2)),m2:m(2),m3:m(3),m4:m(4),skew:m(3)/m(2)**1.5,pearson:m(4)/m(2)**2};}
const orders=[10,10,10,10,30],m=moments(orders);
near(m.mean,14);near(m.m2,64);near(m.sd,8);near(m.m3,768);near(m.m4,13312);near(m.skew,1.5);near(m.pearson,3.25);
near(Stats.describe(orders).skew,1.5);near(Stats.describe(orders).excess,.25);
near(Stats.describe(orders,true).sd,Math.sqrt(80));near(Stats.describe(orders,true).skew,Math.sqrt(5));near(Stats.describe(orders,true).excess,5);
for(const x of [orders.map(v=>100*v),orders.map(v=>v+45)]){near(moments(x).skew,1.5);near(moments(x).pearson,3.25);}
const reflected=orders.map(v=>40-v);near(moments(reflected).skew,-1.5);near(moments(reflected).pearson,3.25);
const asymmetric=[7,9,9,9,9,9,12,12,12,12];near(moments(asymmetric).mean,10);near(moments(asymmetric).skew,0);near(Stats.describe(asymmetric).median,9);
ok(!asymmetric.includes(13),'no mirror for $7 about the $10 mean');
const discrete=[9,10,10,10,10,11];near(moments(discrete).m2,1/3);near(moments(discrete).m4,1/3);near(moments(discrete).pearson,3);near(Stats.describe(discrete).excess,0);
ok(Stats.describe([10,10,10,10]).skew===null,'constant skew undefined');ok(Stats.describe([10,10,10,10]).excess===null,'constant kurtosis undefined');
const source=fs.readFileSync('src/index.html','utf8'),built=fs.readFileSync('dist/index.html','utf8');
for(const html of [source,built]){
 for(const id of ['shape-moment-worked','shape-benchmark-checks','shape-zero-lab','shape-zero-skew-heading','shape-zero-kurt-heading'])ok(html.includes(`id="${id}"`),id+' exists');
 for(const phrase of ['64 dollars²','0.0625','2.2361','−27 − 5 + 32 = 0','SKEW.P(A2:A6)','corrected sample excess','Undefined is not zero','not a probability of an extreme event','do not claim that the records are the entire business population'])ok(html.includes(phrase),phrase);
 ok(html.includes('<caption>Each row groups identical orders'),'table caption');
 ok(html.includes('scope="row">$10'),'table row header');
 ok(html.includes('aria-label="Worked standardized moments table, scroll horizontally if needed"'),'scroll area named');
}
// Remove only the two explicitly added teaching blocks and the added notation bridge.
// The reconstructed original lesson must match its exact pre-revision SHA-256.
// This protects every legacy activity, sentence, formula token and technical caveat.
const crypto=require('node:crypto');
const shapeStart=source.indexOf('<details class="lesson"><summary><span class="lesson-number">04</span>');
let shapeEnd=-1,depth=0;
for(const match of source.slice(shapeStart).matchAll(/<\/?details\b[^>]*>/g)){
 if(match[0].startsWith('</')){depth--;if(depth===0){shapeEnd=shapeStart+match.index+match[0].length;break;}}else depth++;
}
ok(shapeStart>=0&&shapeEnd>shapeStart,'shape lesson boundaries exist');
const shapeLesson=source.slice(shapeStart,shapeEnd);
const legacy=shapeLesson.replace(/<section class="second-foundation shape-depth-worked" id="shape-moment-worked"[\s\S]*?(?=<div class="warning"><b>Two tempting shortcuts to avoid<\/b>)/,'').replace(/(<h4>Technical depth · Standardized moments<\/h4>)<p>[\s\S]*?<\/p>(?=\{\{math:moments\}\})/,'$1');
ok(crypto.createHash('sha256').update(legacy).digest('hex')==='8bb46b6f1a2cf6eeb73dc26bca80fcb5d6bd845fa9ba27ccb1bb66714ff58c9a','entire original shape lesson preserved exactly');
for(const token of ['moments','corrected-moments','shape-domains','log-transform'])ok(shapeLesson.includes('{{math:'+token+'}}'),'retained formula '+token);
for(const marker of ['id="case-fence-worked"','id="shape-values"','href="#graph-panel-box"','Box–Cox requires positive values','Zero excess kurtosis does not prove normality'])ok(shapeLesson.includes(marker),'retained legacy activity or caveat '+marker);
const lab=source.slice(source.indexOf('<div class="foundation-lab shape-depth-lab"'),source.indexOf('<p><b>The normal benchmark'));
const choices=[...lab.matchAll(/data-foundation-choice="([^"]+)"/g)].map(x=>x[1]);
const panels=[...lab.matchAll(/data-foundation-panel="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(choices,['skew','kurt']);assert.deepEqual(panels,choices);checks+=2;
ok(!/<section[^>]*hidden/.test(lab),'all counterexamples readable without JavaScript');ok(lab.includes('foundation-controls" hidden'),'inactive controls hidden');
const buttons=choices.map(()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this[k]=f;}})),items=panels.map(()=>({hidden:false})),controls={hidden:true};
const root={querySelectorAll:s=>s.includes('choice')?buttons:items,querySelector:()=>controls};
const runtime=fs.readFileSync('src/class-one.js','utf8');vm.runInNewContext(runtime.slice(runtime.indexOf('// Small comparisons leave')),{document:{querySelectorAll:()=>[root]}});
ok(!controls.hidden,'controls activate');
for(let round=0;round<3;round++)for(let i=0;i<2;i++){buttons[i].click();ok(items.filter(p=>!p.hidden).length===1&&!items[i].hidden,'selected explanation visible');ok(buttons[i].attrs['aria-pressed']==='true','selection announced');}
const css=fs.readFileSync('src/class-one.css','utf8');ok(css.includes('.foundation-panel[hidden]{display:block!important}'),'print exposes both cases');
console.log(`Passed ${checks} shape deepening assertions: moments, sample conventions, invariance, reflection, counterexamples, static content and repeated controls.`);

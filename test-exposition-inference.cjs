'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const V4=require('./src/class-four-visuals.js'),V5=require('./src/class-five-visuals.js'),V6=require('./src/class-six-visuals.js');
let count=0;const ok=(v,m)=>{count++;assert.ok(v,m)},near=(a,b,e=1e-10)=>ok(Math.abs(a-b)<e,`${a} ≈ ${b}`);
for(const n of [10,50,100]){const d=V4.finiteData(n);near(d.base,12/Math.sqrt(n));near(d.corrected**2,144/n*(100-n)/99);ok(d.corrected<=d.base);}
near(V4.finiteData(100).corrected,0);ok(V4.extraViews.finite('100').includes('recording errors'));
for(const rho of [0,.5,1]){const d=V4.dependenceData(rho);near(d.variance,(4*144+12*rho*144)/16);near(d.se**2,d.variance);}
near(V4.dependenceData(1).se,12);near(V4.dependenceData(0).se,6);
for(const view of ['equal','unequal']){const d=V5.weightsData(view);near(d.weights.reduce((a,b)=>a+b),1);near(d.variance,144*d.weights.reduce((a,b)=>a+b*b,0));}
near(V5.weightsData('equal').variance,36);near(V5.weightsData('unequal').variance,74.88);
for(const[p,n]of [[.1,139],[.3,323],[.5,385]]){const d=V5.ratePlanData(p);near(d.n,n);ok(1.96*Math.sqrt(p*(1-p)/n)<=.05);ok(1.96*Math.sqrt(p*(1-p)/(n-1))>.05);near(d.variance,.25-(p-.5)**2);}
const below=V6.nullData(22),edge=V6.nullData(24),above=V6.nullData(26);near(edge.power,.05,1e-7);ok(below.power<edge.power&&edge.power<above.power);near(below.upper,edge.upper);near(above.upper,edge.upper);near(edge.upper,25.644853626951,1e-5);near(above.power,.638760,1e-5);
for(const n of [64,128]){const d=V6.errorData(n);near(d.beta+d.power,1);near(d.alpha,.05);}ok(V6.errorData(128).power>V6.errorData(64).power);
const configs=[
 {word:'four',n:4,V:V4,file:'sampling-distributions',scenes:['design','diagnosis'],choices:{finite:['10','50','100'],dependence:['0','0.5','1']}},
 {word:'five',n:5,V:V5,file:'estimation',scenes:['efficiency','rateplanning'],choices:{weights:['equal','unequal'],rateplan:['0.1','0.3','0.5']}},
 {word:'six',n:6,V:V6,file:'hypothesis-testing',scenes:['claim','power'],choices:{nullset:['22','24','26'],errors:['64','128']}}
];
function topics(s){const out=[];let depth=0,start=-1;for(const m of s.matchAll(/<\/?details\b[^>]*>/g)){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,m.index+m[0].length));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
for(const {word,n,V,file,scenes,choices} of configs){
 const source=fs.readFileSync(`src/class-${word}.js`,'utf8'),css=fs.readFileSync(`src/class-${word}.css`,'utf8');
 const html=fs.readFileSync(`src/${file}.html`,'utf8'),ref=JSON.parse(fs.readFileSync(`test-class${n}-reference.json`,'utf8'));
 assert.deepEqual(topics(html).map(t=>crypto.createHash('sha256').update(t).digest('hex')),ref.topic_sha256);count++;
 const panels=scenes.map(s=>V.extraFor(s)).join('');ok((panels.match(new RegExp('class="c'+n+'-extra-controls"','g'))||[]).length===2);ok((panels.match(/hidden/g)||[]).length===2);ok(!panels.includes('undefined'));ok(!panels.includes('NaN'));ok((panels.match(/aria-live="polite"/g)||[]).length===2);
 for(const scene of scenes){ok(V.render(scene).includes(V.extraFor(scene)));ok(V.extraFor(scene).includes('Predict.'));}
 for(const[key,values]of Object.entries(choices))for(const value of values){const rendered=V.extraViews[key](value);ok(rendered.includes('Observe.'));ok(rendered.includes('Interpret.'));ok(!/NaN|undefined|Infinity/.test(rendered));if(rendered.includes('<svg')){ok(rendered.includes('role="img"'));ok(rendered.includes('role="region"'));ok(rendered.includes('tabindex="0"'));ok(rendered.includes('swipe sideways'));ok(rendered.includes('<title'));ok(rendered.includes('<desc'));for(const m of rendered.matchAll(/<rect[^>]*width="([\d.]+)"/g))ok(Number(m[1])<=380&&Number(m[1])>=0);}}
 const buttons=Object.entries(choices).flatMap(([key,values])=>values.map((v,i)=>({dataset:{[`c${n}Extra`]:key,value:v},attrs:{'aria-pressed':String(i===0)},listeners:{},addEventListener(k,f){this.listeners[k]=f},setAttribute(k,v){this.attrs[k]=v}})));
 const results=Object.fromEntries(Object.keys(choices).map(k=>[`c${n}-extra-${k}`,{innerHTML:V.extraViews[k](choices[k][0])}]));
 const groups=[{hidden:true},{hidden:true}];
 const document={getElementById:id=>results[id],querySelectorAll:selector=>{if(selector===`.c${n}-extra-controls`)return groups;const m=selector.match(/="([^"]+)"/);return m?buttons.filter(b=>b.dataset[`c${n}Extra`]===m[1]):buttons;}};
 const code=source.slice(source.indexOf(' // Added demonstrations'),source.indexOf(' const parts='));ok(code.length>400);
 vm.runInNewContext(code,{document,[`Class${word[0].toUpperCase()+word.slice(1)}Views`]:V});ok(groups.every(g=>!g.hidden));
 for(const b of [...buttons,...buttons.slice().reverse()]){const key=b.dataset[`c${n}Extra`];b.listeners.click();ok(results[`c${n}-extra-${key}`].innerHTML===V.extraViews[key](b.dataset.value));ok(buttons.filter(x=>x.dataset[`c${n}Extra`]===key&&x.attrs['aria-pressed']==='true').length===1);ok(b.attrs['aria-pressed']==='true');}
 ok(css.includes(`.c${n}-extra-controls[hidden]`));ok(css.includes(`.c${n}-extra-controls button:focus-visible`));ok(css.includes('@media print'));ok(css.includes('prefers-reduced-motion'));ok(css.includes('min-width:440px'));ok(css.includes('min-width:0;width:100%;max-width:100%'));ok(css.includes('overflow-x:auto'));ok(!/setTimeout|setInterval|requestAnimationFrame/.test(code));
}
console.log(`Passed ${count} inference exposition checks: arithmetic, finite endpoints, original lesson preservation, default content, accessible controls, repeated selection and print/reduced-motion styles.`);

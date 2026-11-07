'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('./src/exposition-modeling.js');
const R=require('./src/regression-core.js');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);};
const near=(a,b)=>ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);
near(M.mix(0).gain,4);near(M.mix(.5).gain,8);near(M.mix(1).gain,12);
for(const n of [1,2,4,8]){const d=M.degrees(n);near(d.total,d.between+d.within);near(d.within,3*n-3);}
near(M.multiplicity(1).any,.05);near(M.multiplicity(3).any,.142625);near(M.multiplicity(10).any,1-.95**10);
for(const n of [8,32,128,512]){const d=M.noise(n);near(d.future*d.future-d.mean*d.mean,100);ok(d.future>10);}
assert.deepEqual(M.leverage(false,false).pairs.slice(0,8),R.DEFAULT_PAIRS);checks++;
near(M.leverage(false,false).slope,81/42);near(M.leverage(true,false).slope,81/42);
near(M.leverage(false,true).slope,81/42);
near(M.leverage(true,false).h,M.leverage(true,true).h);
ok(M.leverage(true,true).h>M.leverage(false,true).h);
ok(M.leverage(true,true).slope>81/42);
for(const far of [false,true])for(const miss of [false,true]){const d=M.leverage(far,miss),fit=R.fit(d.pairs,.05,4.5);near(d.slope,fit.b);near(d.intercept,fit.a);near(d.residual,d.y-fit.a-fit.b*d.x);}
const choices={mix:['0','25','50','75','100'],degrees:['1','2','4','8'],multiplicity:['1','3','10','20'],patterns:['scatter','curve','funnel','runs'],leverage:['center-line','center-miss','far-line','far-miss'],noise:['8','32','128','512']};
for(const [name,values]of Object.entries(choices))for(const value of values){const html=M.views[name](value);ok(!/NaN|undefined|Infinity/.test(html));ok(html.includes('role="img"'));ok(html.includes('class="em-chart-scroll" role="region" tabindex="0"'));ok(html.includes('Scrollable diagram'));ok(html.includes('em-scroll-hint')); ok(html.includes('<title'));ok(html.includes('<desc'));ok(html.includes('Observe:'));ok(html.includes('Interpret:'));}
// Each mounted select is keyboard-native and updates only its own result.
for(const[name,values]of Object.entries(choices)){
 const result={innerHTML:M.views[name](values[0])},controls={hidden:true};let handler;
 const select={value:values[0],addEventListener:(type,fn)=>{assert.equal(type,'change');handler=fn;}};
 const element={dataset:{emActivity:name},querySelector:s=>s==='select'?select:s==='[data-em-result]'?result:controls};
 M.mount({querySelectorAll:()=>[element]});ok(!controls.hidden);
 for(const value of [...values,...values].reverse()){select.value=value;handler();assert.equal(result.innerHTML,M.views[name](value));checks++;}
}
for(const[page,names]of Object.entries({anova:['mix','degrees','multiplicity'],regression:['patterns','leverage','noise']})){
 const html=fs.readFileSync(`src/${page}.html`,'utf8');
 for(const name of names){ok(html.includes(`data-em-activity="${name}"`),`${name} activity exists`);ok(html.includes(`id="em-${({degrees:'df',multiplicity:'multiple',patterns:'pattern'})[name]||name}-title"`),'static accessible figure exists');}
}
const css=fs.readFileSync('src/exposition-modeling.css','utf8');ok(css.includes('@media print'));ok(css.includes('min-width:480px'));ok(css.includes('min-width:0;width:100%;max-width:450px')); ok(css.includes('prefers-reduced-motion'));
console.log(`Passed ${checks} exposition modeling calculations, states, accessibility and static-content assertions.`);

'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},read=p=>fs.readFileSync(p,'utf8');
const source=read('src/index.html'),html=read('dist/index.html'),css=read('src/class-one.css');
const before=require('./test-class1-tables-reference.json').baseline_table;
const table=s=>s.slice(s.indexOf('<section class="case-part" id="case-tables"'),s.indexOf('<section class="case-part" id="case-charts"'));
const leaves=s=>{const m=new Map();for(const x of s.split(/<[^>]*>/).map(x=>x.trim()).filter(Boolean))m.set(x,(m.get(x)||0)+1);return m};
const current=leaves(table(source));for(const [text,n]of leaves(before))ok((current.get(text)||0)>=n,'retained original text: '+text);
require('./scripts/class-one-tables-preservation.cjs').restore(source);checks++;
for(const [name,s]of [['source',source],['build',html]]){
 const step=table(s),ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);eq(new Set(ids).size,ids.length,name+' unique IDs');
 for(const id of ['table-from-records','table-tally','tables-core','payment-count-table','table-question-map','table-denominator-lab','table-grouped-values','table-business-check'])ok(step.includes('id="'+id+'"'),name+' core section '+id);
 for(const region of step.matchAll(/<div class="table-scroll"([^>]*)>/g)){ok(region[1].includes('tabindex="0"'),name+' keyboard scroll');ok(region[1].includes('role="region"')&&region[1].includes('aria-label='),name+' named region');}
 for(const token of ['6 + 44','3 + 27','1 + 19','0.20 × 100','20 out of 80 is 25%','37.5%','75%','60%','62.5%','91.67%','8.33%','50 of the 80','marginal totals','Do not add the margins','Do not add the cumulative column','not an unknown method','exact $45 mean or $31 median','not three observations'])ok(step.includes(token),name+' visible claim '+token);
 ok(step.includes('<noscript>'),'no-JS explanation');
 ok(step.indexOf('data-table-question="all"')<step.indexOf('id="payment-count-table"'),'controls precede table');
 ok(step.indexOf('id="table-question-result"')>step.indexOf('id="payment-count-table"'),'result follows table');
 eq((step.match(/data-table-question=/g)||[]).length,3,'three denominator questions');
}
// The table route must stay five native links, styled as the graph lesson's boxed choices.
for(const [name,s] of [['source',source],['build',html]]){
 const route=s.match(/<nav class="table-mini-route"[^>]*>([\s\S]*?)<\/nav>/)[1];
 const links=[...route.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)];
 eq(links.map(x=>x[1]),['#table-from-records','#tables-core','#two-way-table-title','#table-denominator-check','#table-grouped-values'],name+' five unchanged route destinations');
 eq(links.map(x=>x[2]),['1. Count records','2. Turn counts into shares','3. Cross two categories','4. Choose the whole','5. Group numeric values'],name+' five unchanged route labels');
 for(const [,href]of links)ok(s.includes('id="'+href.slice(1)+'"'),name+' route target exists '+href);
}
const routeGrid=css.match(/\.table-mini-route\{([^}]+)\}/)[1],routeCard=css.match(/\.table-mini-route a\{([^}]+)\}/)[1];
for(const token of ['display:grid','grid-template-columns:repeat(5,minmax(0,1fr))','gap:9px'])ok(routeGrid.includes(token),'boxed route grid '+token);
for(const token of ['min-width:0','min-height:94px','padding:16px 12px','background:var(--white)','border:1px solid var(--line)','border-radius:4px','text-decoration:none','overflow-wrap:anywhere'])ok(routeCard.includes(token),'boxed route card '+token);
ok(css.includes('@media(max-width:900px){.table-mini-route{grid-template-columns:repeat(3,minmax(0,1fr))}}'),'three-column tablet route');
ok(css.includes('.table-mini-route{grid-template-columns:repeat(2,minmax(0,1fr))}'),'two-column phone route');
ok(css.includes('.table-mini-route>span{grid-column:1/-1'),'route label spans the grid');
ok(css.includes('.table-mini-route a:hover{border-color:var(--green)'),'boxed hover affordance');
// Independent arithmetic from individual records, not the rendered answers.
const extract=['Online','In store','Online','Phone','Online','In store','Online','Online','In store','Online'];
eq(['Online','In store','Phone'].map(k=>extract.filter(v=>v===k).length),[6,3,1],'extract tallies');
eq([6+44,3+27,1+19],[50,30,20],'complete counts');eq(44+27+19,90,'remaining records');
const counts=[[30,10],[20,20]],row=counts.map(x=>x.reduce((a,b)=>a+b)),col=counts[0].map((_,j)=>counts.reduce((s,r)=>s+r[j],0));eq(row,[40,40]);eq(col,[50,30]);eq(row.reduce((a,b)=>a+b),80);eq(col.reduce((a,b)=>a+b),80);
eq([30/80*100,30/40*100,30/50*100,50/80*100,20/40*100],[37.5,75,60,62.5,50]);
const purchases=[18,22,24,25,28,30,32,35,38,42,46,200],bins=[0,50,100,150,200].map(lower=>purchases.filter(v=>v>=lower&&v<lower+50).length);eq(bins,[11,0,0,0,1],'nonoverlapping complete interval counts');eq(bins.map((_,i)=>bins.slice(0,i+1).reduce((a,b)=>a+b)),[11,11,11,11,12],'cumulative totals');eq(bins.map(v=>(100*v/12).toFixed(2)),['91.67','0.00','0.00','0.00','8.33']);
for(const value of purchases)eq([0,50,100,150,200].filter(lower=>value>=lower&&value<lower+50).length,1,'each purchase placed once');
// Run the exact enhancement in a small DOM fixture, including repeated selections.
const js=read('src/class-one.js'),snippet=js.slice(js.indexOf('// Table questions:'),js.indexOf('// Small comparisons leave'));
const makeCell=count=>({dataset:{count:String(count)},classes:new Set(),classList:{add(...v){v.forEach(x=>this.owner.classes.add(x))},remove(...v){v.forEach(x=>this.owner.classes.delete(x))}}});
const cells={};for(const [id,count]of Object.entries({'online-card':30,'online-other':10,'store-card':20,'store-other':20,'online-total':40,'store-total':40,'card-total':50,'other-total':30,'grand-total':80})){cells['payment-'+id]=makeCell(count);cells['payment-'+id].classList.owner=cells['payment-'+id];}
const buttons=['all','online','card'].map(key=>({dataset:{tableQuestion:key},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this[k]=fn}})),controls={hidden:true},result={textContent:''};
const elements={...cells,'payment-count-table':{querySelectorAll:()=>Object.values(cells)},'table-denominator-lab':{querySelectorAll:()=>buttons,querySelector:()=>controls},'table-question-result':result};
vm.runInNewContext(snippet,{document:{getElementById:id=>elements[id]}});eq(controls.hidden,false);
for(let round=0;round<4;round++)for(const [i,expected]of [[0,[80,'37.5',4,'grand-total']],[1,[40,'75',2,'online-total']],[2,[50,'60',2,'card-total']]]){buttons[i].click();ok(result.textContent.includes('÷ '+expected[0]+' orders × 100 = '+expected[1]+'%.'),'complete calculation');eq(Object.values(cells).filter(c=>c.classes.has('table-in-whole')).length,expected[2]);eq(Object.values(cells).filter(c=>c.classes.has('table-is-part')).length,1);eq(Object.values(cells).filter(c=>c.classes.has('table-is-total')).length,1);ok(cells['payment-'+expected[3]].classes.has('table-is-total'));eq(buttons.filter(b=>b.attrs['aria-pressed']==='true').length,1);eq(buttons[i].attrs['aria-pressed'],'true');}
vm.runInNewContext(snippet,{document:{getElementById:()=>null}});checks++;
for(const token of ['outline:3px solid','outline:3px dashed','.table-question-controls[hidden]','@media(max-width:700px)','@media print','.table-question-controls button:focus-visible'])ok(css.includes(token),'accessible presentation '+token);
ok(!/setInterval|setTimeout|requestAnimationFrame/.test(snippet),'no automatic motion');
console.log(`Passed ${checks} table-depth arithmetic, preservation, accessibility and repeated interaction checks.`);

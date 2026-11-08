'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('./src/graphs-core'),S=require('./src/stats');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b)=>{checks++;assert.deepEqual(a,b);},throws=f=>{checks++;assert.throws(f);};
eq(G.histogram(G.deliveries,10).map(b=>b.count),[4,13,2,1]);
eq(G.histogram([0,10,20,30,40],10).map(b=>b.count),[1,1,1,2]);
for(const width of [5,10,20]){
 const bins=G.histogram(G.deliveries,width);eq(bins.reduce((s,b)=>s+b.count,0),20);eq(bins[0].lo,0);eq(bins.at(-1).hi,40);
 for(let v=0;v<=40;v+=.25)eq(G.histogram([v],width).reduce((s,b)=>s+b.count,0),1);
 for(const b of bins){eq(b.hi-b.lo,width);eq(b.mid,(b.lo+b.hi)/2);}
 for(const polygon of [true,false]){const svg=G.distribution(width,polygon);ok(!/NaN|Infinity|undefined/.test(svg));eq(svg.includes('<polyline'),polygon);ok(svg.includes('Number of deliveries'));}
}
for(const input of [[G.deliveries,3],[[41],10],[[-1],10],[[NaN],10],[[Infinity],10]])throws(()=>G.histogram(...input));
for(const convention of ['exc','inc']){
 for(const data of [G.orders,[1,2,3,4,5],[0,0,0,0],[1,1,1,1,2],[-10,-3,-2,1,4,99]]){
  const b=G.boxSummary(data,convention),s=S.describe(data,false,convention);eq(b.q1,s.q1);eq(b.median,s.median);eq(b.q3,s.q3);eq(b.iqr,s.iqr);eq(b.min,s.min);eq(b.max,s.max);
  ok(b.lowerWhisker>=b.lowerFence&&b.upperWhisker<=b.upperFence);eq(b.outliers,s.sorted.filter(v=>v<b.lowerFence||v>b.upperFence));
 }
 eq(G.boxSummary(G.orders,convention).outliers,[200]);
}
eq(G.boxSummary(G.orders).upperWhisker,46);eq(G.boxSummary(G.orders).upperFence,66.125);
throws(()=>G.boxSummary([1,2,3]));throws(()=>G.boxSummary(G.orders,'invalid'));throws(()=>G.category('wrong'));throws(()=>G.render('wrong'));
for(const name of ['category','distribution','time','scatter','box']){const svg=G.render(name);ok(svg.includes('role="img"'));ok(svg.includes('<title'));ok(svg.includes('<desc'));ok(!/NaN|Infinity|undefined/.test(svg));}
const html=fs.readFileSync('dist/descriptive-statistics.html','utf8');
for(const token of ['Frequency polygon','frequency polygon','zero baseline','upper-inclusive','frequency density','modified boxplot','graph-category-mode','graph-bin-width','graph-polygon','graph-quartile'])ok(html.includes(token),'Missing content '+token);
ok(!/\{\{(?:graph|graphs|python|output):?/.test(html),'Uncompiled placeholder');
for(const name of ['graphs.css','graphs-core.js','graphs.js'])ok(fs.existsSync('dist/'+name));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);eq(ids.length,new Set(ids).size);
const svgIds=['graph-category','graph-distribution','graph-time','graph-scatter','graph-box'];for(const id of svgIds){ok(html.includes(`aria-labelledby="${id}-title ${id}-desc"`));ok(html.includes(`id="${id}-desc"`));}
// Event-driven state checks complement browser QA, and exercise repeated navigation.
class Node {constructor(id){this.id=id;this.value='';this.checked=false;this.hidden=false;this.dataset={};this.attrs={};this.handlers={};this.innerHTML='';this.textContent='';}addEventListener(k,f){this.handlers[k]=f;}setAttribute(k,v){this.attrs[k]=v;}fire(k){this.handlers[k]?.({target:this});}}
const nodes={},get=id=>nodes[id]??=new Node(id),keys=['category','distribution','time','scatter','box'];
const panels=keys.map(k=>get('graph-panel-'+k)),buttons=keys.map(k=>{const n=new Node(k);n.dataset.graphChoice=k;return n;}),answers=['pie','histogram','line'].map(k=>{const n=new Node(k);n.dataset.chartAnswer=k;return n;});
get('charts').querySelectorAll=selector=>selector==='[data-graph-panel]'?panels:selector==='[data-graph-choice]'?buttons:selector==='[data-chart-answer]'?answers:[];
get('graph-bin-width').value='10';get('graph-quartile').value='exc';
const listeners={},location={hash:''};vm.runInNewContext(fs.readFileSync('src/graphs.js','utf8'),{document:{getElementById:id=>id==='graph-panel-bogus'?null:get(id)},window:{addEventListener:(k,f)=>listeners[k]=f},Graphs:G,location});
eq(panels.map(p=>p.hidden),[false,true,true,true,true]);
for(const i of [1,2,3,4,0,0,4,1]){buttons[i].fire('click');eq(panels.filter(p=>!p.hidden).map(p=>p.id),['graph-panel-'+keys[i]]);eq(buttons.map(b=>b.attrs['aria-pressed']),keys.map((_,j)=>String(i===j)));}
for(const mode of ['pie','bar','pie','bar']){get('graph-category-mode').value=mode;get('graph-category-mode').fire('change');ok(get('graph-category-picture').innerHTML.includes(mode==='pie'?'pie chart':'bar chart'));}
for(const width of ['5','20','10'])for(const polygon of [true,false]){get('graph-bin-width').value=width;get('graph-polygon').checked=polygon;get('graph-bin-width').fire('change');ok(get('graph-bin-insight').textContent.includes(`minutes wide`));eq((get('graph-frequency-body').innerHTML.match(/<tr>/g)||[]).length,40/Number(width));eq(get('graph-distribution-picture').innerHTML.includes('<polyline'),polygon);}
get('graph-polygon').checked=true;get('graph-polygon').fire('change');ok(get('graph-bin-insight').textContent.includes('not a time trend'));
for(const c of ['inc','exc','inc']){get('graph-quartile').value=c;get('graph-quartile').fire('change');ok(get('graph-box-numbers').textContent.includes(c==='exc'?'$24.25':'$24.75'));ok(get('graph-box-numbers').textContent.includes('The $200 order is flagged.'));}
for(const i of [0,1,2,1]){answers[i].fire('click');ok(get('graph-check-feedback').textContent.startsWith(i===1?'Yes.':'Try again.'));eq(answers.map(a=>a.attrs['aria-pressed']),answers.map((_,j)=>String(i===j)));}
location.hash='#graph-panel-box';listeners.hashchange();eq(panels.filter(p=>!p.hidden).map(p=>p.id),['graph-panel-box']);
location.hash='#graph-panel-bogus';listeners.hashchange();eq(panels.filter(p=>!p.hidden).map(p=>p.id),['graph-panel-box']);
ok(fs.readFileSync('src/graphs.css','utf8').includes('.graph-panel[hidden]{display:block!important}'),'Print must reveal all chart panels');
console.log(`Passed ${checks} graph arithmetic, boundaries, semantics, asset and UI-state assertions.`);

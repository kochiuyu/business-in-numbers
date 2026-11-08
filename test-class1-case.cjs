'use strict';
// Focused regression checks for the business-first Class 1 case.
// Run after `npm run build`: node test-class1-case.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const Stats = require('./src/stats.js');
const Graphs = require('./src/graphs-core.js');
const {data: activities, enhance: addActivities} = require('./scripts/activities.cjs');
const {sections} = require('./scripts/navigation.cjs');
let checks = 0;
const ok = (condition, message) => { checks++; assert.ok(condition, message); };
const eq = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const near = (actual, expected, message) => ok(Math.abs(actual - expected) < 1e-10, message || `${actual} != ${expected}`);
const read = name => fs.readFileSync(name, 'utf8');
const source = read('src/descriptive-statistics.html');
const graphs = read('src/graphs-section.html');
const built = read('dist/descriptive-statistics.html');
const app = read('src/app.js');
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// A small structural parser, deliberately dependency-free. It checks the actual
// nesting of the new sections, not just the presence of eight matching strings.
function tree(html) {
  html = html.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/g, '$1$2');
  const root = {tag: 'root', attrs: {}, children: [], start: 0, end: html.length};
  const stack = [root], nodes = [];
  const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>/gi)) {
    if (m[0].startsWith('<!')) continue;
    const closing = /^<\//.test(m[0]);
    const tag = m[0].match(/^<\/?([a-z][a-z0-9:-]*)/i)[1].toLowerCase();
    if (closing) {
      assert.equal(stack.at(-1).tag, tag, `HTML nesting: expected </${stack.at(-1).tag}>, found </${tag}>`);
      stack.pop().end = m.index + m[0].length;
      continue;
    }
    const attrs = {};
    for (const a of m[0].matchAll(/([a-z][a-z0-9:-]*)="([^"]*)"/gi)) attrs[a[1]] = a[2];
    const n = {tag, attrs, children: [], parent: stack.at(-1), start: m.index, end: m.index + m[0].length};
    n.parent.children.push(n); nodes.push(n);
    if (!voids.has(tag) && !/\/>$/.test(m[0])) stack.push(n);
  }
  eq(stack.length, 1, 'all HTML elements closed');
  const has = (node, name) => (node.attrs.class || '').split(' ').includes(name);
  const within = (node, ancestor) => { for (let p = node.parent; p; p = p.parent) if (p === ancestor) return true; return false; };
  return {nodes, has, within, fragment: node => html.slice(node.start, node.end), byId: id => nodes.find(n => n.attrs.id === id)};
}

for (const [name, html] of [['source', source], ['built', built]]) {
  const t = tree(html), parts = t.nodes.filter(n => t.has(n, 'case-part'));
  eq(parts.length, 14, name + ': fourteen case parts');
  eq(parts.map(n => n.attrs.id), ['case-part-1','case-tables','case-charts','case-part-2','case-median','case-mode','case-part-4','case-part-3','case-sd-cv','case-skewness','case-kurtosis','case-covariance','case-part-5','case-part-6'], name + ': consecutive part order');
  const lessons = t.nodes.filter(n => t.has(n, 'lesson'));
  eq(lessons.length, 14, name + ': fourteen statistical topics');
  const brief = t.byId('case-brief');
  ok(t.byId('learning-start').start < parts[0].start && parts.at(-1).end <= brief.start, name + ': situation, fourteen parts, final brief');
  for (const [i, part] of parts.entries()) {
    const title = t.byId(part.attrs['aria-labelledby']);
    ok(t.within(title, part), name + ': each part owns its heading');
    eq(part.attrs['aria-labelledby'], title.attrs.id, name + ': part accessible name');
    const ownedLessons = lessons.filter(n => t.within(n, part));
    eq(ownedLessons.length, 1, name + ': one core statistical topic per business question');
    const answers = t.nodes.filter(n => t.has(n, 'case-answer') && t.within(n, part));
    eq(answers.length, 1, name + ': one interim answer per part');
    ok(answers[0].start >= ownedLessons[0].end, name + ': answer follows evidence');
    ok(t.nodes.some(n => t.has(n, 'case-next') && t.within(n, answers[0])), name + ': explicit next step');
  }
  ok(t.within(t.byId('lab'), parts[3]), name + ': original order lab belongs to Part 2');
  eq(t.nodes.filter(n => n.tag === 'article' && t.within(n, brief)).length, 3, name + ': final brief resolves three decisions');
  const ids = t.nodes.filter(n => n.attrs.id).map(n => n.attrs.id);
  eq(ids.length, new Set(ids).size, name + ': no duplicate IDs');
  for (const link of t.nodes.filter(n => n.tag === 'a' && /^#case-/.test(n.attrs.href || ''))) {
    ok(t.byId(link.attrs.href.slice(1)), name + ': working case link ' + link.attrs.href);
  }
  if (name === 'built') {
    ok(t.within(t.byId('charts'), parts[2]), 'charts own a dedicated visible step');
    for (const a of activities().filter(a => a.file === 'descriptive-statistics.html')) {
      const activity = t.byId(a.id), part = parts[a.afterTopic-1];
      ok(t.within(activity, part), a.id + ': practice remains in its matching part');
      const answer = t.nodes.find(n => t.has(n, 'case-answer') && t.within(n, part));
      ok(activity.end <= answer.start, a.id + ': practice precedes carry-forward answer');
    }
    for (const [id] of sections['descriptive-statistics.html']) ok(t.byId(id), 'navigation target ' + id);
  }
}

// The progression must be usable with technical depth hidden and optional
// references closed. Keep case work on the core route, before its experiment,
// response and transfer exercise; adjacency is valid, not missing separation.
for (const [name, html] of [['source', source], ['built', built]]) {
  const t = tree(html);
  const required = id => { const n = t.byId(id); ok(n, name + ': progression stage ' + id); return n; };
  const ancestors = n => { const result=[]; for(let p=n.parent;p;p=p.parent)result.push(p); return result; };
  const initiallyOpen = n => /\sopen(?:\s|=|>)/i.test(t.fragment(n).split('>')[0]+'>');
  const coreIds = ['case-record-check','tables-core','charts-core','mean-core','median-core','mode-core','variance-core','sd-cv-core','covariance-core','correlation-core','case-center-worked','case-weighted-prep','case-supplier-worked','case-unit-prep','case-fence-worked','case-pairs-worked','case-write-brief'];
  for (const id of coreIds) {
    const n=required(id), parents=ancestors(n);
    ok(!parents.some(p=>t.has(p,'technical')), name + ': ' + id + ' does not require technical depth');
    ok(!parents.some(p=>p.tag==='details'&&(!['case-center-worked','case-weighted-prep','case-unit-prep'].includes(id)||!t.has(p,'lesson'))), name + ': ' + id + ' uses only its intended explanation depth');
  }
  for (const [before,after] of [['case-center-worked','lab'],['variance-core','sample'],['case-fence-worked','shape-values'],['case-pairs-worked','r-value'],['case-write-brief','case-brief']]) {
    ok(required(before).end <= required(after).start, name + ': ' + before + ' precedes ' + after);
  }
  const part6=required('case-part-6');
  const tutorial=t.nodes.find(n=>n.tag==='details'&&!t.has(n,'lesson')&&t.within(n,part6)&&/New to Excel or Python\?/.test(text(t.fragment(n.children.find(c=>c.tag==='summary')||n))));
  ok(tutorial, name + ': software tutorial remains an explicitly optional disclosure');
  ok(!initiallyOpen(tutorial), name + ': optional software tutorial starts collapsed');
  ok(required('case-write-brief').end <= tutorial.start, name + ': visible briefing composition precedes optional software tutorial');
  for (const partNumber of [2,5]) {
    const part=required('case-part-'+partNumber);
    const feedback=t.nodes.find(n=>n.tag==='details'&&t.has(n,'case-feedback')&&t.within(n,part));
    ok(feedback, name + ': Part ' + partNumber + ' has a revealable experiment explanation');
    ok(!initiallyOpen(feedback), name + ': Part ' + partNumber + ' experiment answer starts collapsed');
    const experiment=required(partNumber===2?'lab':'r-value');
    ok(feedback.start > experiment.start, name + ': experiment appears before its answer disclosure');
  }
  const brief=required('case-brief');
  const decisions=t.nodes.find(n=>t.has(n,'case-decisions')&&t.within(n,brief));
  ok(decisions, name + ': planning recommendations retained');
  const reveal=ancestors(decisions).find(n=>n.tag==='details'&&t.within(n,brief));
  ok(reveal, name + ': final recommendations require an intentional reveal');
  ok(!initiallyOpen(reveal), name + ': final briefing starts collapsed');
  if(name==='built') {
    for(const [prep,exercise] of [['case-record-check','c1-measurements'],['case-weighted-prep','c1-weighted-orders'],['case-unit-prep','c1-change-units'],['case-pairs-worked','c1-preserve-pairs']]) {
      ok(required(prep).end <= required(exercise).start, 'built: prerequisite '+prep+' precedes '+exercise);
    }
  }
}

// Preserve the existing mathematical and technical coverage, original controls,
// Python examples and four active challenges through the structural rewrite.
const baseline = JSON.parse(read('course-structure.json'))['descriptive-statistics.html'];
eq([...source.matchAll(/\{\{math:([^}]+)\}\}/g)].map(m => m[1]).sort(), baseline.math, 'all original formula placeholders retained');
for (const id of baseline.ids) ok(source.includes(`id="${id}"`), 'original control/anchor retained: ' + id);
for (const name of ['quickstart','orders','paired','shape','case']) {
  ok(source.includes(`{{python:${name}}}`), 'Python example retained: ' + name);
  ok(source.includes(`{{output:${name}}}`), 'checked Python output retained: ' + name);
}
eq(activities().filter(a => a.file === 'descriptive-statistics.html').map(a => a.id), ['c1-measurements','c1-weighted-orders','c1-change-units','c1-preserve-pairs'], 'four original activities retained');
ok(addActivities(source, 'descriptive-statistics.html').includes('c1-preserve-pairs'), 'activity insertion still succeeds');
ok(!/\{\{(?:math|python|output|graphs-section):?|katex-error/.test(built), 'built case has no unresolved lesson expressions');

// Independent arithmetic on the fixed case, cross-checked against both runtime
// statistics implementations and the original values rendered in the lesson.
const orders = [18,22,24,25,28,30,32,35,38,42,46,200];
const A = [4,5,5,5,6], B = [1,2,5,8,9];
const pairs = [[1,4],[2,7],[3,6],[4,4],[5,9]];
const average = values => values.reduce((a,b) => a+b, 0) / values.length;
const populationSD = values => Math.sqrt(average(values.map(v => (v-average(values))**2)));
const median = values => { const a = [...values].sort((x,y)=>x-y); return (a[(a.length-1)>>1] + a[a.length>>1]) / 2; };
eq(orders.reduce((a,b)=>a+b,0), 540, 'original revenue');
eq(average(orders), 45, 'original mean'); eq(median(orders), 31, 'original median');
eq(Graphs.orders, orders, 'fixed graph orders match briefing'); eq(Graphs.pairs, pairs, 'fixed graph branch pairs match briefing');
for (const [values, misses, sd] of [[A,0,Math.sqrt(.4)],[B,2,Math.sqrt(10)]]) {
  eq(average(values), 5, 'supplier mean'); eq(values.filter(v=>v>6).length, misses, 'strictly later than day six');
  near(populationSD(values), sd); near(Stats.describe(values).sd, sd);
}
const cross = pairs.reduce((sum,[x,y])=>sum+(x-3)*(y-6),0);
eq(cross, 7, 'paired cross-products');
near(Stats.correlation(pairs.map(p=>p[0]),pairs.map(p=>p[1])), cross/Math.sqrt(10*18));
eq((cross/Math.sqrt(180)).toFixed(4), '0.5217', 'briefing correlation rounding');
for (const method of ['exc','inc']) {
  const b = Graphs.boxSummary(orders,method), d = Stats.describe(orders,false,method);
  eq(b.outliers,[200], method + ': flagged order'); near(b.q1,d.q1); near(b.q3,d.q3);
}
near(Graphs.boxSummary(orders,'exc').upperFence,66.125,'exclusive upper fence');
// Independently reconstruct the new worked stages rather than trusting rounded
// prose or a second implementation of the same summary function.
const squaredDistances = values => values.map(v=>(v-average(values))**2);
eq(squaredDistances(A),[1,0,0,0,1],'supplier A worked squared deviations');
eq(squaredDistances(B),[16,9,0,9,16],'supplier B worked squared deviations');
eq(squaredDistances(A).reduce((a,b)=>a+b,0),2,'supplier A squared-deviation sum');
eq(squaredDistances(B).reduce((a,b)=>a+b,0),50,'supplier B squared-deviation sum');
const exclusiveAt = p => { const rank=p*(orders.length+1), lower=Math.floor(rank); return orders[lower-1]+(rank-lower)*(orders[lower]-orders[lower-1]); };
const workedQ1=exclusiveAt(.25), workedQ3=exclusiveAt(.75), workedIQR=workedQ3-workedQ1;
near(workedQ1,24.25,'worked exclusive Q1'); near(workedQ3,41,'worked exclusive Q3');
near(workedIQR,16.75,'worked IQR');
near(workedQ1-1.5*workedIQR,-.875,'worked lower fence');
near(workedQ3+1.5*workedIQR,66.125,'worked upper fence');
eq((populationSD(A)*24).toFixed(2),'15.18','supplier SD converted to hours');
eq((100*populationSD(A)/average(A)).toFixed(2),'12.65','supplier CV percentage');
near((100*populationSD(A)*24)/(average(A)*24),100*populationSD(A)/average(A),'CV invariant under hours conversion');
eq((3*20+1*60)/(3+1),30,'weighted prerequisite combines revenue and order counts');
eq(pairs.map(([x,y])=>(x-average(pairs.map(p=>p[0])))*(y-average(pairs.map(p=>p[1])))),[4,-1,0,-2,6],'worked branch cross-products');
eq([4,-1,0,-2,6].reduce((a,b)=>a+b,0),7,'worked branch cross-product sum');
const workedTree=tree(source);
for(const [id,claims] of [
  ['case-supplier-worked',['total 2','total 50','0.4','10']],
  ['case-fence-worked',['24.25','41','16.75','−$0.875','66.125']],
  ['case-unit-prep',['15.18','12.65%']],
  ['case-weighted-prep',['$120','4','$30']],
  ['case-pairs-worked',['7','1.4']],
  ['correlation-core',['0.5217']]
]) {
  const stage=workedTree.byId(id);ok(stage,'worked numeric stage '+id);
  const prose=text(workedTree.fragment(stage));
  for(const claim of claims)ok(prose.includes(claim),id+': rendered worked value '+claim);
}
const caseText = text(source), graphText = text(graphs);
for (const claim of ['including day six','observed shares, not known future','0/5 = 0%','2/5 = 40%','$66.125']) ok(caseText.includes(claim), 'fixed-case arithmetic/scope: ' + claim);
for (const guard of ['must not be merged row by row','separate what-if experiments','not extra rows in this case','not necessarily unique customers','not extra branch records','does not update when you change','not proof that A caused better performance','does not estimate the incremental return on advertising']) ok(caseText.includes(guard), 'guardrail retained: ' + guard);
for (const guard of ['Fixed original 12-order example','separate from changes in the order-book lab','same period, both in $ thousands']) ok(graphText.includes(guard), 'chart scope: ' + guard);

// The business audit reproduces every case record before the smaller function
// tutorial. Verify the Python execution and the exact code/output learners see.
const casePython=read('src/examples/case.py'), caseOutput=read('src/examples/case.txt');
eq(execFileSync('python3',['src/examples/case.py'],{cwd:__dirname,encoding:'utf8'}),caseOutput,'case Python stdout matches checked output');
eq(caseOutput.trim().split('\n'),[
  'Orders: n=12, total=$540, mean=$45.00, median=$31.00',
  'Supplier A: mean=5.00 days, observed SD=0.6325 days, later than six days=0/5 (0%)',
  'Supplier B: mean=5.00 days, observed SD=3.1623 days, later than six days=2/5 (40%)',
  'Branches: r=0.5217',
  'These summaries describe observed records, not future guarantees or causal effects.'
],'independently checked case-audit outputs');
const escape = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const content of [casePython,caseOutput]) ok(built.includes('<code>'+escape(content)+'</code>'),'built audit shows tested source/output');
const auditTree=tree(source), audit=auditTree.nodes.find(n=>auditTree.has(n,'case-reproduce'));
ok(auditTree.within(audit,auditTree.byId('case-part-6')),'case audit belongs to Part 6');
ok(audit.end < source.indexOf('{{python:quickstart}}'),'business audit precedes abstract tutorial');
for (const formula of ['=SUM(A2:A13)','=AVERAGE(A2:A13)','=MEDIAN(A2:A13)','=STDEV.P(A2:A6)','=COUNTIF(A2:A6,"&gt;6")/COUNT(A2:A6)','=CORREL(A2:A6,B2:B6)']) ok(auditTree.fragment(audit).includes(formula),'Excel case audit: '+formula);
ok(text(auditTree.fragment(audit)).includes('three separate sheets'),'case audit keeps unlike records separate');
ok(text(auditTree.fragment(audit)).includes('separate practice dataset'),'five-value tutorial is not confused with case');
const graphTree=tree(graphs);
for (const [key,part] of [['category',1],['distribution',3],['time',1],['scatter',5],['box',4]]) {
  const panel=graphTree.byId('graph-panel-'+key);
  ok(graphTree.nodes.some(n=>n.tag==='a' && n.attrs.href==='#case-part-'+part && graphTree.within(n,panel)),key+': return to relevant business question');
}

// Execute the real order-lab and relationship scripts in a minimal DOM. Changes
// must affect the sandbox data, while the fixed final brief remains untouched.
class Element {
  constructor(tag='DIV') { this.tagName=tag; this.dataset={}; this.attrs={}; this.handlers={}; this.value=''; this.checked=false; this.hidden=false; this.open=false; this.parentElement=null; this.textContent=''; this.innerHTML=''; this.classList={toggle(){},remove(){},add(){}}; }
  addEventListener(type, fn) { (this.handlers[type] ||= []).push(fn); }
  setAttribute(key,value) { this.attrs[key]=String(value); }
  removeAttribute(key) { delete this.attrs[key]; }
  focus() {}
  fire(type) { for (const fn of this.handlers[type] || []) fn({target:this,preventDefault(){}}); }
}
const nodes = new Map();
const node = id => { if (!nodes.has(id)) nodes.set(id,new Element()); return nodes.get(id); };
const scenarios = ['large','ordinary','repeat'].map(name=>Object.assign(new Element('BUTTON'),{dataset:{scenario:name}}));
const relationshipButtons = ['positive','negative','curve'].map(name=>Object.assign(new Element('BUTTON'),{dataset:{pair:name}}));
const answerButtons = [0,1,2].map(name=>Object.assign(new Element('BUTTON'),{dataset:{answer:String(name)}}));
const events = {};
const document = {getElementById:node,body:new Element('BODY'),querySelectorAll:s=>s==='[data-scenario]'?scenarios:s==='[data-pair]'?relationshipButtons:s==='[data-answer]'?answerButtons:[],querySelector:s=>s.startsWith('[data-answer=')?answerButtons[0]:null};
const window = {matchMedia:()=>({matches:false}),addEventListener:(type,fn)=>(events[type]||=[]).push(fn)};
const location = {hash:''};
const context = vm.createContext({document,window,location,Stats});
const briefMarkup = source.slice(source.indexOf('<section class="block learning-synthesis case-brief"'),source.indexOf('<section class="block practice"'));
node('case-brief').innerHTML=briefMarkup;
vm.runInContext(app,context);
eq(node('mean').textContent,'$45.00'); eq(node('median').textContent,'$31.00');
eq(node('r-value').textContent,'0.5217');
scenarios[1].fire('click'); eq(node('mean').textContent,'$32.50'); eq(node('median').textContent,'$31.00');
node('outlier').value='250'; node('outlier').fire('input'); eq(node('mean').textContent,'$49.17');
node('custom-data').value='2, 4, 6, 8'; node('custom-form').fire('submit'); eq(node('mean').textContent,'5');
node('sample').checked=true; node('sample').fire('change'); eq(node('sd-label').textContent,'Sample SD');
node('quartile').value='inc'; node('quartile').fire('change'); ok(node('spread-values').innerHTML.includes('inclusive quartiles'));
relationshipButtons[1].fire('click'); ok(node('r-insight').textContent.includes('separate teaching example'));
relationshipButtons[2].fire('click'); eq(node('r-value').textContent,'0.0000');
relationshipButtons[0].fire('click'); eq(node('r-value').textContent,'0.5217');
scenarios[0].fire('click'); eq(node('mean').textContent,'$45.00');
eq(node('case-brief').innerHTML,briefMarkup,'all lab experiments leave original final brief unchanged');
eq(Graphs.orders,orders,'lab experiments leave graph case orders unchanged');

// The graph toolkit now lives inside a closed disclosure. New part links must
// reveal both the correct graph panel and its ancestor disclosure on initial load
// and repeated hash navigation. Test real graphs.js and learning.js together.
for (const initial of ['', '#graph-panel-box']) {
  const gallery=new Element('DETAILS'), root=new Element(), panels={}, buttons=[];
  for (const key of ['category','distribution','time','scatter','box']) {
    const panel=new Element(); panel.parentElement=root; panels[key]=panel;
    buttons.push(Object.assign(new Element('BUTTON'),{dataset:{graphChoice:key}}));
  }
  root.parentElement=gallery;
  root.querySelectorAll=s=>s==='[data-graph-panel]'?Object.values(panels):s==='[data-graph-choice]'?buttons:[];
  const localNodes=new Map(); const get=id=>id==='charts'?root:id.startsWith('graph-panel-')?panels[id.slice(12)]||null:localNodes.get(id)||localNodes.set(id,new Element()).get(id);
  const localEvents={}, loc={hash:initial};
  const doc={getElementById:get,querySelector:()=>null,querySelectorAll:()=>[]};
  const win={addEventListener:(type,fn)=>(localEvents[type]||=[]).push(fn)};
  const ctx=vm.createContext({document:doc,window:win,location:loc,Graphs});
  vm.runInContext(read('src/graphs.js'),ctx); vm.runInContext(read('src/learning.js'),ctx);
  if (initial) { ok(gallery.open,'direct graph link opens gallery'); ok(!panels.box.hidden,'direct graph link selects boxplot'); }
  for (const key of ['distribution','box','scatter','box']) {
    gallery.open=false; loc.hash='#graph-panel-'+key;
    for (const fn of localEvents.hashchange) fn();
    ok(gallery.open,key+': graph link opens ancestor disclosure');
    eq(Object.entries(panels).filter(([,p])=>!p.hidden).map(([k])=>k),[key],key+': exactly requested graph visible');
  }
}
console.log(`Passed ${checks} Class 1 business-case structure, preservation, arithmetic, fixed-record and graph-link assertions.`);

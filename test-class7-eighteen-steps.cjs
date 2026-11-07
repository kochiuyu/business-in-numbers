'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/anova.html','utf8'),built=fs.readFileSync('dist/anova.html','utf8');
let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m);},eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const expected=['anova-step-1','anova-step-2','anova-step-3','anova-mean-squares','anova-step-4','anova-step-5','anova-step-6','anova-comparisons','anova-step-7','anova-step-9','anova-step-8','anova-step-12','anova-step-10','anova-interaction-contrast','anova-step-11','anova-step-13','anova-step-14','anova-software'];
const cores=['orders','baseline','split','freedom','ratio','reference','report','comparisons','cells','averages','additive','interaction','pieces','contrast','tests','design','decision','software'];
function parse(html){
 const nodes=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  if(m[0].startsWith('<!'))continue;
  if(m[0].startsWith('</')){const n=stack.pop();assert.equal(n?.tag,m[1].toLowerCase(),'balanced closing '+m[1]);n.end=m.index+m[0].length;continue;}
  const attrs={};for(const a of m[0].matchAll(/([\w:-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
  const n={tag:m[1].toLowerCase(),attrs,parent:stack.at(-1),start:m.index,end:m.index+m[0].length};nodes.push(n);
  if(!voids.has(n.tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 assert.equal(stack.length,0);return{nodes,byId:id=>nodes.find(n=>n.attrs.id===id),fragment:n=>html.slice(n.start,n.end)};
}
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c),ancestors=n=>{const out=[];for(let p=n.parent;p;p=p.parent)out.push(p);return out;};

const baseline=require('./scripts/class-seven-preservation.cjs').restore(source),old=parse(baseline);
for(const n of old.nodes.filter(n=>has(n,'lesson')||has(n,'technical')))ok(source.includes(old.fragment(n)),'original complete topic/technical section retained '+(n.attrs.id||''));
for(const kind of ['math','anova-tools','anova-python','anova-output'])eq([...source.matchAll(new RegExp('\\{\\{'+kind+'(?::([^}]+))?\\}\\}','g'))].map(m=>m[0]).sort(),[...baseline.matchAll(new RegExp('\\{\\{'+kind+'(?::([^}]+))?\\}\\}','g'))].map(m=>m[0]).sort(),'original tokens retained '+kind);
const attrs=(s,a)=>[...s.matchAll(new RegExp('\\b'+a+'="([^"]+)"','g'))].map(m=>m[1]);
for(const id of attrs(baseline,'id'))eq(attrs(source,'id').filter(x=>x===id).length,1,'legacy anchor '+id);
for(const [name,html]of [['source',source],['built',built]]){
 const t=parse(html),parts=t.nodes.filter(n=>has(n,'c7-part'));
 eq(parts.map(n=>n.attrs.id),expected,name+' semantic route');
 const ids=t.nodes.map(n=>n.attrs.id).filter(Boolean);eq(ids.length,new Set(ids).size,name+' unique IDs');
 for(const[i,part]of parts.entries()){
  const alias=t.byId('class7-step-'+(i+1));ok(alias&&ancestors(alias).includes(part),name+' canonical alias '+(i+1));
  ok(t.nodes.some(n=>n.tag==='a'&&n.attrs.href==='#class7-step-'+(i+1)),name+' reachable step '+(i+1));
  if(name==='built'){
   const core=t.byId('c7-core-'+cores[i]);ok(core&&ancestors(core).includes(part),name+' core in correct step '+cores[i]);
   ok(!ancestors(core).some(n=>n.tag==='details'||has(n,'technical')),name+' core visible without disclosure '+cores[i]);
   ok(t.fragment(core).includes('<ol>')&&t.fragment(core).includes('<summary>Check'),'visible worked sequence and learner check '+cores[i]);
  }
 }
 if(name==='built')ok(!/\{\{(?:anovavisual|anovacore|math|activity):|katex-error/.test(html),'no unresolved teaching templates');
}
const t=parse(built);
const claims={orders:['80 minutes','12 independent'],baseline:['284/12','162','24⅚'],split:['−5⅔','296/3','368/3'],freedom:['12 − 3','368/33','2⅔'],ratio:['18.5','96/9','4.625'],reference:['4.2565','.000648'],report:['37/46','80.4%'],comparisons:['1.1547','2.9333','3.3871','[−0.3871, 6.3871]'],cells:['2 × 2 × 3','0 residual df'],averages:['.25 × $4 + .75 × $12','27'],additive:['27 + 4 + 5','40 − 38'],interaction:['−$24','+$12'],pieces:['572','4(3 − 1)','32/8'],contrast:['√(16/3)','3.4641','4.6188'],tests:['192/4','300/4','.008516'],design:['12 − 4','Random assignment'],decision:['0.6129','3 minutes'],software:['F.DIST.RT(18.5,2,9)','scipy.stats.f.sf(12,1,8)']};
for(const[id,needles]of Object.entries(claims)){const f=t.fragment(t.byId('c7-core-'+id)).replace(/<[^>]*>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/\s+/g,' ');for(const text of needles)ok(f.includes(text),'visible calculation and condition '+id+' '+text);}
// Essential first-pass explanations must not depend on opening a disclosure.
const comprehension={comparisons:[
 'three planned differences as one family',
 'all three intervals to contain their true population differences together',
 'Three ordinary 95% intervals do not guarantee that joint coverage',
 'each interval a miss probability of .05/3',
 '3 × (.05/3) = .05',
 'does not require independent comparisons',
 '.05/6 in each tail',
 '98⅓% confidence',
 'wider than an ordinary 95% interval'
],pieces:[
 'cross-products between the offer, day, interaction and residual components sum to zero',
 'what orthogonal means here',
 'without leftover cross-terms',
 'error mean square is MSE = 32/8',
 'estimates the common within-cell variance',
 'not Class 5’s estimator mean squared error (variance + bias²)'
]};
for(const [id,phrases]of Object.entries(comprehension)){
 const core=t.byId('c7-core-'+id);
 for(const phrase of phrases)ok(t.nodes.some(n=>['p','li'].includes(n.tag)&&ancestors(n).includes(core)&&!ancestors(n).some(a=>a.tag==='details')&&t.fragment(n).includes(phrase)),'first-pass meaning outside disclosures: '+phrase);
}
const near=(a,b,tol=1e-8)=>ok(Math.abs(a-b)<tol,`independent arithmetic ${a} = ${b}`);
near(284/12,71/3);near((40+96+162)/12,149/6);near(4*((-11/3)**2+(1/3)**2+(10/3)**2),296/3);near(296/3+24,368/3);near((296/3/2)/(24/9),18.5);near((296/3/2)/(96/9),4.625);near((296/3)/(368/3),37/46);near(Math.sqrt((8/3)*(.25+.25)),1.1547005383792515);near(6*(16+16),192);near(6*(25+25),300);near(3*(4+4+4+4),48);near(192+300+48+32,572);near((8/Math.sqrt(16/3))**2,12);
for(const[id,step]of [['grouped-data',1],['one-model',2],['one-decomposition',3],['em-f-bridge',4],['one-test',5],['one-proof',6],['one-interpretation',7],['anova-followup-check',8],['two-design',9],['two-estimation',10],['two-model',11],['interaction-lab',12],['two-decomposition',13],['em-interaction-scale-bridge',14],['two-tests',15],['model-checks',16],['tools',18],['practice',18]])ok(ancestors(t.byId(id)).includes(t.byId(expected[step-1])),'legacy subject destination '+id);
for(const n of old.nodes.filter(n=>n.tag==='a'&&n.attrs.href))ok(source.includes('href="'+n.attrs.href+'"')||/^#anova-step-/.test(n.attrs.href),'original linked resource retained '+n.attrs.href);
console.log(`Passed ${checks} Class 7 eighteen-step route, topic/formula preservation, visible arithmetic, independent math and deep-link checks.`);

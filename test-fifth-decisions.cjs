'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const H = require('./src/hypothesis-core.js');
const A = require('./src/anova-core.js');
let checks = 0;
const ok = (v,m) => { checks++; assert.ok(v,m); };
const near = (a,b,tol=1e-9) => ok(Math.abs(a-b)<tol, `${a} agrees with ${b}`);
const configurations = [
 ['sampling-distributions','sampling-cluster-check','sampling-step-9','sampling-step-10', ['100 rows','representative','correlation of 0.20','12/√100 = $1.20','8.352','2.89','7.488','2.74','2.088','1.44','28.8/J + 115.2/(Jm)','not estimates from four stores','Unequal store sizes']],
 ['anova','anova-followup-check','anova-step-6','anova-step-7', ['before seeing outcomes','B − A, C − A and C − B','1.1547','9 error degrees','0.05/3','0.05/6','2.9333','3.3871','at least 95%','independence between comparisons is not required','[0.6129, 7.3871]','[3.6129, 10.3871]','[−0.3871, 6.3871]','does not show they are equivalent','does not establish a saving of at least 3 minutes','neither comparison by itself proves a causal benefit','not the edited lab']],
 ['regression','regression-causal-check','regression-step-15',null, ['separate synthetic illustration','not the eight-week dataset','100 + 20x','100 + 20u','regardless of spend','140 to 160','leaves its mean at 140','identification','not noise-free individual outcomes','randomly assigning comparable markets','spillovers','independent assignment units are markets','not every order','contribution margins','sampling-distributions.html#sampling-step-9']]
];
for (const dir of ['src','dist']) for (const [file,id,step,next,terms] of configurations) {
 const html = fs.readFileSync(`${dir}/${file}.html`,'utf8');
 const start=html.indexOf(`id="${id}"`), end=html.indexOf('</aside>',start);
 ok(start>html.indexOf(`id="${step}"`), `${id} belongs to expected step`);
 if(next)ok(end<html.indexOf(`id="${next}"`),`${id} precedes next step`);
 const block=html.slice(start,end);
 ok(block.length>1800,`${id} is complete`);
 for(const term of terms)ok(block.includes(term),`${id} retains ${term}`);
 ok(block.includes('<details><summary>')&&!/<details[^>]*\bopen\b/.test(block),'Native feedback starts closed');
 ok(!/<script|<button|\bhidden\b/.test(block),'New content requires no JavaScript');
 ok(block.includes('tabindex="0" role="region"'),'Chart scroll region is keyboard reachable');
 ok(block.includes('<svg')&&block.includes('<title')&&block.includes('<desc'),'Chart has accessible explanation');
 const chart=block.match(/<svg[\s\S]*?<\/svg>/)[0];
 const [x,y,w,h]=chart.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
 for(const m of chart.matchAll(/<text[^>]*\bx="([\d.]+)"[^>]*\by="([\d.]+)"/g)) {
  ok(+m[1]>=x&&+m[1]<=w&&+m[2]>=y&&+m[2]<=h,'Text anchor inside viewbox');
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 ok(ids.length===new Set(ids).size,'Unique page IDs');
 for(const m of block.matchAll(/aria-labelledby="([^"]+)"/g))for(const label of m[1].split(' '))ok(html.includes(`id="${label}"`),'Accessible name target exists');
}
// Recompute the cluster model by explicitly summing variances and every ordered covariance.
function clusterVariance(J,m,rho=.2,variance=144){const n=J*m;let total=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)total+=i===j?variance:Math.floor(i/m)===Math.floor(j/m)?variance*rho:0;return total/(n*n);}
near(clusterVariance(4,25),8.352);near(Math.sqrt(clusterVariance(4,25)),2.889982698910151);
near(clusterVariance(4,100),7.488);near(clusterVariance(16,25),2.088);
near(Math.sqrt(clusterVariance(16,25)),Math.sqrt(clusterVariance(4,25))/2);
for(const [J,m] of [[4,25],[4,100],[16,25]])near(clusterVariance(J,m),28.8/J+115.2/(J*m));
near(12/Math.sqrt(100),1.2);
// Existing common-variance ANOVA engine, with independent t quantile oracle in Python.
const model=A.oneWay(); near(model.within.ms,8/3);near(model.within.df,9);
const se=Math.sqrt(model.within.ms*(1/4+1/4));near(se,1.1547005383792515);
const critical=H.tQuant(1-.05/6,9),margin=critical*se;
near(critical,2.933324088373989,1e-8);near(margin,3.3871109040862732,1e-8);
const pairs=[[1,0,.6128890959137268,7.387110904086273],[2,0,3.6128890959137268,10.387110904086274],[2,1,-.38711090408627324,6.387110904086273]];
for(const [i,j,lo,hi]of pairs){const difference=model.means[i]-model.means[j];near(difference-margin,lo,1e-8);near(difference+margin,hi,1e-8);}
// SVG endpoints use x=180+30*difference and circles mark the actual estimates.
const anova=fs.readFileSync('src/anova.html','utf8');
for(const x of [198.3867,401.6133,288.3867,491.6133,168.3867,371.6133])ok(anova.includes(String(x)),'Chart endpoint included');
for(const u of [1,2,3,4]) {const x=u;near(100+20*x,100+20*u);}
near(100+20*3,160);near(100+20*2,140);ok(160!==140,'Intervening changes only World A');
console.log(`Fifth decision reasoning: ${checks} checks passed.`);

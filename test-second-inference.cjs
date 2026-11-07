'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const V4=require('./src/class-four-visuals'),V5=require('./src/class-five-visuals'),V6=require('./src/class-six-visuals');
let checks=0;const ok=(x,m)=>{checks++;assert.ok(x,m)},near=(a,b,tol=1e-7)=>ok(Math.abs(a-b)<tol,`${a} ≈ ${b}`);
// Independent probability oracle: Simpson integration, not course CDF/quantile functions.
function cdf(z){const a=-10,n=20000,h=(z-a)/n,f=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);let sum=f(a)+f(z);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
near(cdf(-1.5),.066807201268858,1e-12);ok(V4.timelineExtra('after').includes('6.68%'));ok(V4.timelineExtra('before').includes('exact point has probability zero'));
for(const [mu,z,inside]of [[68,2,false],[70,1,true],[76,-2,false]]){const a=V5.candidateData(mu),b=V6.agreementData(mu);near(a.se,18/9);near(a.z,z);ok(a.inside===inside);near(a.lower,72-1.959963984540054*2);near(a.upper,72+1.959963984540054*2);near(b.p,2*cdf(-Math.abs(z)));ok(b.reject===!inside);near(b.ci[0],a.lower);near(b.ci[1],a.upper);}
near(V6.agreementData(68).p,V6.agreementData(76).p);near(cdf(1.959963984540054),.975,1e-12);
function topics(s){const out=[];let depth=0,start=-1;for(const m of s.matchAll(/<\/?details\b[^>]*>/g)){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,m.index+m[0].length));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
for(const [n,word,file,V,scene,key,values]of [[4,'four','sampling-distributions',V4,'known','timeline',['before','after']],[5,'five','estimation',V5,'interval','candidate',['70','68','76']],[6,'six','hypothesis-testing',V6,'tails','agreement',['70','68','76']]]){
 const source=fs.readFileSync(`src/class-${word}.js`,'utf8'),css=fs.readFileSync(`src/class-${word}.css`,'utf8'),html=fs.readFileSync(`src/${file}.html`,'utf8');
 assert.deepEqual(topics(html).map(t=>crypto.createHash('sha256').update(t).digest('hex')),JSON.parse(fs.readFileSync(`test-class${n}-reference.json`)).topic_sha256);checks++;
 const panel=V.extraFor(scene);ok(panel.includes('hidden'));ok(panel.includes('aria-live="polite"'));ok(panel.includes(V.extraViews[key](values[0])));ok(V.render(scene).includes(panel));
 for(const value of values){const s=V.extraViews[key](value);ok(!/NaN|undefined|Infinity/.test(s));ok(s.includes('Observe.'));ok(s.includes('Interpret.'));for(const svg of s.matchAll(/<svg[\s\S]*?<\/svg>/g)){ok(svg[0].includes('role="img"'));ok(svg[0].includes('<title'));ok(svg[0].includes('<desc'));ok(s.includes('tabindex="0"'));ok(s.includes('role="region"'));}}
 const buttons=values.map((v,i)=>({dataset:{[`c${n}Extra`]:key,value:v},attrs:{'aria-pressed':String(!i)},listeners:{},addEventListener(k,f){this.listeners[k]=f},setAttribute(k,v){this.attrs[k]=v}}));
 const output={innerHTML:V.extraViews[key](values[0])},group={hidden:true},document={getElementById:id=>{assert.equal(id,`c${n}-extra-${key}`);return output},querySelectorAll:s=>s===`.c${n}-extra-controls`?[group]:buttons};
 const code=source.slice(source.indexOf(' // Added demonstrations'),source.indexOf(' const parts='));vm.runInNewContext(code,{document,[`Class${word[0].toUpperCase()+word.slice(1)}Views`]:V});ok(!group.hidden);
 for(const b of [...buttons,...buttons.slice().reverse()]){b.listeners.click();ok(output.innerHTML===V.extraViews[key](b.dataset.value));ok(b.attrs['aria-pressed']==='true');ok(buttons.filter(x=>x.attrs['aria-pressed']==='true').length===1);}
 ok(css.includes('prefers-reduced-motion'));ok(css.includes(`.c${n}-extra-controls[hidden]`));ok(css.includes('button:focus-visible'));ok(css.includes('overflow-x:auto'));ok(css.includes('min-width:440px'));ok(css.includes('@media print'));
}
ok(V5.extraViews.candidate('70').includes('upper-tail notation'));ok(V5.extraViews.candidate('70').includes('z<sub>.975</sub>'));ok(V6.extraViews.agreement('70').includes('one-sided confidence bound'));ok(V6.extraViews.agreement('70').includes('equality convention'));
// Sampling desk table: focusable horizontal region, explicit header associations, unchanged cells.
const samplingTools=fs.readFileSync('src/sampling-tools.html','utf8');
const samplingRegion=samplingTools.match(/<div class="table-wrap"[^>]*><table><caption>Choose the random object first<\/caption>[\s\S]*?<\/table><\/div>/)[0];
ok(samplingRegion.includes('tabindex="0"'));ok(samplingRegion.includes('role="region"'));ok(samplingRegion.includes('aria-label="Choose the random object first:'));ok(samplingRegion.includes('Scroll sideways with arrow keys'));
ok((samplingRegion.match(/<th scope="col">/g)||[]).length===4);
const samplingTable=samplingRegion.match(/<table>[\s\S]*?<\/table>/)[0].replace(/ scope="col"/g,'');
ok(crypto.createHash('sha256').update(samplingTable).digest('hex')==='97f3188d266acbf6cec5ccd8e04364230bebd8d6e521ef77c8c4256d7afd6f07','sampling table text and cells unchanged');
ok(fs.readFileSync('src/sampling.css','utf8').includes('#sampling-tools .table-wrap:focus-visible{outline:3px solid #b45a25;outline-offset:3px}'));
console.log(`Passed ${checks} second-round inference checks: independent normal integration, interval/test inversion, source preservation, all new interaction states, no-JS content and accessibility contracts.`);

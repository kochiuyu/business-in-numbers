'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let checks=0;
const ok=(v,m)=>{checks++;assert.ok(v,m)},near=(a,b)=>ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function topics(s){
  s=s.replace(/<!-- normal-depth:start -->[\s\S]*?<!-- normal-depth:end -->/,'');
const out=[];const re=/<\/?details\b[^>]*>/g;let m,depth=0,start=-1;while((m=re.exec(s))){if(m[0].startsWith('</')){depth--;if(depth===0&&start!==-1){out.push(s.slice(start,re.lastIndex));start=-1;}}else{if(depth===0&&m[0].includes('class="lesson"'))start=m.index;depth++;}}return out;}
for(const [page,number,ids] of [['anova',7,['square','f']],['regression',8,['residual','se']]]){
 const html=fs.readFileSync(`src/${page}.html`,'utf8'),reference=JSON.parse(fs.readFileSync(`test-class${number}-reference.json`,'utf8'));
 assert.deepEqual(topics(html).map(t=>crypto.createHash('sha256').update(t).digest('hex')),reference.topic_sha256);checks++;
 for(const id of ids){const marker=`id="em-${id}-bridge"`,start=html.indexOf(marker),end=html.indexOf('</aside>',start),block=html.slice(start,end);
 ok(start>=0&&end>start);ok(block.includes(`aria-labelledby="em-${id}-heading"`));ok(block.includes(`id="em-${id}-heading"`));ok(!/\bhidden\b|<script|<button|<select/.test(block),'Static worked content needs no JS');ok(!topics(html).some(t=>t.includes(marker)),'New bridge outside preserved lesson');
 }
 const idsAll=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);ok(new Set(idsAll).size===idsAll.length,'No duplicate IDs');
}
// Independent arithmetic from raw rows, not values returned by the course cores.
const groups=[[18,20,22,20],[22,24,26,24],[25,27,29,27]],all=groups.flat(),mean=a=>a.reduce((s,v)=>s+v,0)/a.length,grand=mean(all);
let within=0,between=0,total=0;
for(const group of groups){const m=mean(group),cross=group.map(y=>2*(y-m)*(m-grand));near(cross.reduce((s,v)=>s+v,0),0);for(const y of group){within+=(y-m)**2;total+=(y-grand)**2;}between+=group.length*(m-grand)**2;}
near(grand,71/3);near(total,within+between);near((between/2)/(within/9),18.5);
near((18-grand)**2,289/9);near((18-20)**2+(20-grand)**2,157/9);
near(2*(18-20)*(20-grand),132/9);near(2*(22-20)*(20-grand),-132/9);
near(groups[0].reduce((s,y)=>s+(y-grand)**2,0),556/9);near(8+484/9,556/9);
const pairs=[[1,11],[2,12],[3,16],[4,15],[5,19],[6,20],[7,23],[8,24]],mx=mean(pairs.map(p=>p[0])),my=mean(pairs.map(p=>p[1]));
const xx=pairs.reduce((s,[x])=>s+(x-mx)**2,0),xy=pairs.reduce((s,[x,y])=>s+(x-mx)*(y-my),0),b=xy/xx,a=my-b*mx;
const residuals=pairs.map(([x,y])=>y-a-b*x),sse=residuals.reduce((s,r)=>s+r*r,0),s=Math.sqrt(sse/6);
near(a,247/28);near(b,27/14);near(a+b*3,409/28);near(residuals[2],39/28);near(residuals[2]**2,1521/784);near(sse,81/14);near(residuals.reduce((s,r)=>s+r,0),0);
ok((s*10).toFixed(2)==='9.82');ok((s/Math.sqrt(xx)*10).toFixed(2)==='1.52');ok((s/Math.sqrt(8)*10).toFixed(2)==='3.47');
const css=fs.readFileSync('src/exposition-modeling.css','utf8');ok(css.includes('@media(max-width:640px){.em-worked-grid{grid-template-columns:1fr}'));ok(css.includes('prefers-reduced-motion'));ok(css.includes('summary:focus-visible'));ok(css.includes('@media print'));
console.log(`Passed ${checks} second-round modeling checks: preserved original lessons, static semantics, responsive rules and independent arithmetic.`);

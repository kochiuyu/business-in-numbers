'use strict';
// Build-time navigation: every roadmap, description and bridge works without JS.
const plans=require('../src/lesson-roadmaps.json');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function nodes(html){
 const out=[],stack=[],voids=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
 for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b[^>]*>/gi)){
  if(m[0].startsWith('<!'))continue;
  if(m[0].startsWith('</')){const n=stack.pop();if(!n||n.tag!==m[1].toLowerCase())throw Error('Unbalanced roadmap input: '+m[1]);n.end=m.index+m[0].length;continue;}
  const attrs={};for(const a of m[0].matchAll(/([\w:-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
  const n={tag:m[1].toLowerCase(),attrs,parent:stack.at(-1),start:m.index,openEnd:m.index+m[0].length,end:m.index+m[0].length};out.push(n);if(!voids.has(n.tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 if(stack.length)throw Error('Unclosed roadmap input');return out;
}
const has=(n,c)=>(n.attrs.class||'').split(/\s+/).includes(c);
function enhance(html,file){
 const p=plans[file];if(!p)return html;
 const ns=nodes(html),parts=ns.filter(n=>has(n,p.partClass)),route=ns.find(n=>has(n,p.routeClass));
 if(!route||parts.length!==p.steps.length)throw Error('Roadmap step mismatch: '+file);
 const byId=new Map(parts.map(n=>[n.attrs.id,n]));
 const edits=[];const patch=(start,end,text)=>edits.push({start,end,text});
 const routeLinks=ns.filter(n=>n.tag==='a'&&n.start>route.start&&n.end<route.end);
 if(routeLinks.length!==p.steps.length)throw Error('Roadmap link mismatch');
 const originalLinks=new Map(routeLinks.map(n=>[n.attrs.href,html.slice(n.start,n.end)]));
 const link=s=>{const old=originalLinks.get('#'+s.anchor);if(!old)throw Error('Missing legacy route anchor: '+s.anchor);return old.replace(/<span>\d+<\/span>/,'<span>'+String(p.steps.indexOf(s)+1).padStart(2,'0')+'</span>').replace('</a>','<small class="route-purpose">'+esc(s.description)+'</small></a>');};
 const routeBody=p.steps.map(s=>route.tag==='ol'?'<li>'+link(s)+'</li>':link(s)).join('');
 patch(route.openEnd,route.end-('</'+route.tag+'>').length,routeBody);
 const roadmap=`<section class="lesson-roadmap" id="class-${p.classNumber}-roadmap" aria-labelledby="roadmap-question"><p class="roadmap-kicker">THE QUESTION BEHIND THE STEPS</p><h3 id="roadmap-question">${esc(p.question)}</h3><p class="roadmap-outcome"><b>By the end:</b> ${esc(p.outcome)}</p><ol class="roadmap-phases">${p.phases.map((phase,i)=>`<li><a href="#${esc(phase.anchor)}"><span class="roadmap-phase-number">${i+1}</span><b>${esc(phase.title)}</b><span>${esc(phase.description)}</span></a>${i<p.phases.length-1?'<span class="roadmap-connector" aria-hidden="true">↓</span>':''}</li>`).join('')}</ol><p class="roadmap-logic"><b>How the pieces connect:</b> ${esc(p.logic)}</p><p class="roadmap-data"><b>Keep the examples straight:</b> ${esc(p.data)}</p>${p.preview||''}</section>`;
 const routeContainer=route.tag==='ol'?route.parent:route;
 patch(routeContainer.start,routeContainer.start,roadmap);
 const ordered=p.steps.map((s,i)=>{
  const n=byId.get(s.id);if(!n)throw Error('Unknown semantic step: '+s.id);
  let frag=html.slice(n.start,n.end);
  if(p.reorder){
   frag=frag.replace(/STEP \d+ (?:\/|OF) \d+/,`STEP ${i+1} / ${parts.length}`);
   frag=frag.replace(new RegExp(`(<span class="c${p.classNumber}-kicker">)\\d+ /`),`$1${String(i+1).padStart(2,'0')} /`);
   const navClass=p.classNumber===1?'visual-step-nav':`c${p.classNumber}-step-nav`;
   const local=nodes(frag),nav=local.find(n=>has(n,navClass));
   if(!nav)throw Error('Missing next navigation '+s.id);
   const previous=i?`<a class="c${p.classNumber}-back" href="#${esc(p.steps[i-1].anchor)}">← ${esc(p.steps[i-1].short)}</a>`:'<a class="c'+p.classNumber+'-back" href="#class-'+p.classNumber+'-roadmap">← Class roadmap</a>';
   const next=i<parts.length-1?`<a class="button" href="#${esc(p.steps[i+1].anchor)}">Next · ${esc(p.steps[i+1].short)} →</a>`:`<a class="button" href="${esc(p.nextFile)}">Next · Class ${p.classNumber+1} →</a>`;
   frag=frag.slice(0,nav.start)+`<nav class="${navClass}" aria-label="Continue class lesson">${previous}${next}</nav>`+frag.slice(nav.end);
  }
  const local=nodes(frag),nav=local.find(n=>has(n,p.classNumber===1?'visual-step-nav':`c${p.classNumber}-step-nav`));
  if(!nav)throw Error('Missing step navigation '+s.id);
  const addition=(s.addition||'')+`<aside class="step-bridge" aria-label="Connection to the next idea"><b>${i===parts.length-1?'Carry this into the next class':'Why this leads to the next step'}</b><p>${esc(s.bridge)}</p></aside>`;
  return frag.slice(0,nav.start)+addition+frag.slice(nav.start);
 });
 if(p.reorder){
  const region=html.slice(parts[0].start,parts.at(-1).end),joined=parts.map(n=>html.slice(n.start,n.end)).join('');
  if(region.replace(/\s/g,'')!==joined.replace(/\s/g,''))throw Error('Cannot reorder interleaved sections');
  patch(parts[0].start,parts.at(-1).end,ordered.join('\n'));
 }else parts.forEach((n,i)=>patch(n.start,n.end,ordered[i]));
 for(const e of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,e.start)+e.text+html.slice(e.end);
 return html.replace('</head>','<link rel="stylesheet" href="lesson-roadmaps.css"></head>');
}
module.exports={enhance,nodes,plans};

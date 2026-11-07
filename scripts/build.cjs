'use strict';
const fs = require('node:fs');
const path = require('node:path');
const katex = require('katex');
const learning = require('./learning.cjs');
const graphs = require('../src/graphs-core.js');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options = Object.freeze({output:'htmlAndMathml',throwOnError:true,strict:'error',trust:false,maxExpand:1000,maxSize:20});
function renderMath(id, equation) {
  if (!/^[a-z0-9-]+$/.test(id) || !equation.tex || !equation.text || !equation.title) throw Error(`Incomplete equation: ${id}`);
  const rendered = katex.renderToString(equation.tex,{...options, displayMode:!!equation.display});
  if (!equation.display) return `<span class="math-inline" data-math="${id}" title="${esc(equation.text)}">${rendered}</span>`;
  return `<figure class="equation" data-math="${id}"><div class="math-scroll" tabindex="0" role="region" aria-label="${esc(equation.title)}. Scroll horizontally if needed.">${rendered}</div><figcaption><details class="math-reading"><summary>Read formula / LaTeX</summary><p>${esc(equation.text)}</p><pre><code>${esc(equation.tex)}</code></pre></details></figcaption></figure>`;
}
function compile(template, equations) {
  const used = new Set();
  const html = template.replace(/\{\{math:([a-z0-9-]+)\}\}/g,(_,id)=>{
    if (!equations[id]) throw Error(`Unknown equation: ${id}`);
    if (used.has(id)) throw Error(`Duplicate equation reference: ${id}`);
    used.add(id);
    return renderMath(id,equations[id]);
  });
  if (/\{\{math:/.test(html)) throw Error('Malformed math placeholder');
  const unused = Object.keys(equations).filter(id=>!used.has(id));
  if (unused.length) throw Error(`Unused equations: ${unused.join(', ')}`);
  return html;
}
function build() {
  const read = name => fs.readFileSync(path.join(src,name),'utf8');
  const equations=JSON.parse(read('math.json'));
  const fixtures=JSON.parse(read('math-fixtures.json'));
  const references=JSON.parse(read('tool-reference.json'));
  const toolTable='<div class="table-scroll tool-reference" tabindex="0" role="region" aria-label="Excel and Python reference. Scroll horizontally if needed."><table><caption>Same five numbers: 1, 2, 3, 4, 5</caption><thead><tr><th scope="col">Question</th><th scope="col">Excel · A2:A6</th><th scope="col">Python · x</th><th scope="col">Result / interpretation</th></tr></thead><tbody>'+references.map(([question,excel,python,result])=>`<tr><th scope="row">${esc(question)}</th><td>${excel.split(' / ').map(formula=>`<code>${esc(formula)}</code>`).join(' / ')}</td><td><code>${esc(python)}</code></td><td>${esc(result)}</td></tr>`).join('')+'</tbody></table></div>';
  const template=read('index.html').replace(/\{\{visual:([a-z]+)\}\}/g,(_,name)=>require('./class-one-visuals.cjs').render(name)).replace('{{graphs-section}}',read('graphs-section.html')).replace(/\{\{graph:([a-z]+)\}\}/g,(_,name)=>graphs.render(name)).replace('{{tool-reference}}',toolTable).replace(/\{\{(python|output):([a-z]+)\}\}/g,(_,kind,name)=>{
    const text=read(`examples/${name}.${kind==='python'?'py':'txt'}`);
    return `<pre class="code-block" tabindex="0" role="region" aria-label="${kind==='python'?'Python code':'Checked Python output'}: ${esc(name)}. Scroll horizontally if needed."><code>${esc(text)}</code></pre>`;
  });
  const html=learning.enhance(compile(template,equations),'index.html');
  const css=read('styles.css');
  const graphsCss=read('graphs.css');
  const fixtureHtml=compile(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mathematics typesetting check</title><link rel="stylesheet" href="vendor/katex/katex.min.css"><link rel="stylesheet" href="styles.css"></head><body class="math-test-page"><main class="block"><h1>Mathematics typesetting check</h1><p>Typesetting examples, not a new lesson or a claim of source coverage. These examples exercise conditional probability, fractions, limits, sums, binomial coefficients, matrices and aligned derivations.</p>${Object.keys(fixtures).map(id=>`<section><h2>${esc(fixtures[id].title)}</h2>{{math:${id}}}</section>`).join('')}</main><script src="math-ui.js"></script></body></html>`,fixtures);
  // Validate every expression before changing any generated output.
  const vendor=path.join(path.dirname(require.resolve('katex/package.json')),'dist');
  const vendorCss=fs.readFileSync(path.join(vendor,'katex.min.css'),'utf8');
  const inlineCss=vendorCss.replace(/url\(([^)]+)\)/g, (_,url)=>{
    const file=url.replace(/["']/g,'');
    if(!file.startsWith('fonts/')) throw Error(`Unexpected font path: ${file}`);
    const mime=file.endsWith('.woff2')?'font/woff2':file.endsWith('.woff')?'font/woff':'font/ttf';
    return `url(data:${mime};base64,${fs.readFileSync(path.join(vendor,file)).toString('base64')})`;
  });
  const license=fs.readFileSync(path.join(vendor,'../LICENSE'),'utf8');
  const standalone=html.replace('<head>','<head><!-- Bundled KaTeX license:\n'+license.replace(/--/g,'—')+'\n-->').replace('<link rel="stylesheet" href="vendor/katex/katex.min.css">',`<style>${inlineCss}</style>`).replace('<link rel="stylesheet" href="styles.css">',`<style>${css}</style>`).replace('<link rel="stylesheet" href="graphs.css">',`<style>${graphsCss}</style>`).replace('<link rel="stylesheet" href="class-one.css">',`<style>${read('class-one.css')}</style>`).replace('<link rel="stylesheet" href="learning.css">',`<style>${read('learning.css')}</style>`).replace('<link rel="stylesheet" href="activities.css">',`<style>${read('activities.css')}</style>`).replace('<link rel="stylesheet" href="navigation.css">',`<style>${read('navigation.css')}</style>`).replace(/<script src="(stats|app|math-ui|graphs-core|graphs|learning|activities|navigation|class-one)\.js"><\/script>/g,(_,name)=>`<script>${read(name+'.js').replace(/<\/script/gi,'<\\/script')}</script>`);
  fs.mkdirSync(path.join(dist,'vendor/katex'),{recursive:true});
  fs.cpSync(path.join(vendor,'fonts'),path.join(dist,'vendor/katex/fonts'),{recursive:true});
  fs.copyFileSync(path.join(vendor,'katex.min.css'),path.join(dist,'vendor/katex/katex.min.css'));
  fs.copyFileSync(path.join(vendor,'../LICENSE'),path.join(dist,'vendor/katex/LICENSE'));
  fs.writeFileSync(path.join(dist,'index.html'),html);
  fs.writeFileSync(path.join(dist,'math-check.html'),fixtureHtml);
  for(const name of ['styles.css','stats.js','app.js','math-ui.js','graphs.css','graphs-core.js','graphs.js','learning.css','learning.js','activities.css','activities.js','navigation.css','navigation.js','class-one.css','class-one.js']) fs.copyFileSync(path.join(src,name),path.join(dist,name));
  fs.writeFileSync(path.join(root,'class1-standalone.html'),standalone);
  fs.writeFileSync(path.join(dist,'MATH-NOTICE.txt'),`Mathematics pre-rendered using KaTeX ${katex.version}.\nKaTeX is Copyright (c) 2013-2020 Khan Academy and other contributors, under the MIT License.\nSee vendor/katex/LICENSE for the complete bundled license.\nNo external fonts, CDN, runtime renderer, analytics or network request is needed for the mathematics.\n`);
  fs.writeFileSync(path.join(dist,'course-introduction.html'),require('./navigation.cjs').enhance(require('./introduction.cjs').build(),'course-introduction.html'));
  buildProbability();
  buildRandom();
  buildSampling();
  buildEstimation();
  buildHypothesis();
  buildAnova();
  buildRegression();
  require('./fingerprint-assets.cjs').fingerprintAssets(dist);
  console.log(`Rendered ${Object.keys(equations).length} lesson expressions and ${Object.keys(fixtures).length} QA expressions with KaTeX ${katex.version}.`);
}
function buildProbability() {
  const read=name=>fs.readFileSync(path.join(src,name),'utf8');
  const equations=JSON.parse(read('probability-math.json'));
  const template=read('probability.html').replace(/\{\{probvisual:([a-z-]+)\}\}/g,(_,name)=>require('./class-two-visuals.cjs').render(name)).replace(/\{\{prob(python|output):([a-z]+)\}\}/g,(_,kind,name)=>{
    const text=read(`probability-examples/${name}.${kind==='python'?'py':'txt'}`);
    return `<pre class="code-block" tabindex="0" role="region" aria-label="${kind==='python'?'Python code':'Checked Python output'}: ${esc(name)}. Scroll horizontally if needed."><code>${esc(text)}</code></pre>`;
  });
  const html=learning.enhance(compile(template,equations),'probability.html');
  if(/\{\{(?:math|probpython|proboutput):/.test(html))throw Error('Uncompiled probability placeholder');
  fs.writeFileSync(path.join(dist,'probability.html'),html);
  for(const name of ['probability.css','probability-core.js','probability.js','class-two.css','class-two.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
  console.log(`Rendered ${Object.keys(equations).length} probability expressions.`);
}
function buildRandom() {
  const R=require('../src/random-core.js');
  const read=name=>fs.readFileSync(path.join(src,name),'utf8');
  const d=R.discrete('binomial'),c=R.continuous('normal');
  const defaults={'count-pmf':R.discreteSvg(d,3,'mass','count-mass'),'count-cdf':R.discreteSvg(d,3,'cdf','count-cumulative'),'count-summary':R.countSummary(d,3),'count-table':R.countTable(d),'continuous-pdf':R.continuousSvg(c,496,504,'pdf','area-density'),'continuous-cdf':R.continuousSvg(c,496,504,'cdf','area-cumulative'),'continuous-summary':R.continuousSummary(c,496,504),'continuous-calculation':R.continuousCalculation(c,496,504),'joint-default':R.jointTable(.25),'joint-result':R.jointResult(.25)};
  let template=read('random-variables.html').replace(/\{\{rvvisual:([a-z]+)\}\}/g,(_,name)=>require('../src/class-three-visuals.js').render(name)).replace('{{random-tools}}',read('random-tools.html')).replace(/\{\{rv(python|output):([a-z]+)\}\}/g,(_,kind,name)=>{
    const text=read(`random-examples/${name}.${kind==='python'?'py':'txt'}`);
    return `<pre class="code-block" tabindex="0" role="region" aria-label="${kind==='python'?'Python code':'Checked Python output'}: ${esc(name)}. Scroll horizontally if needed."><code>${esc(text)}</code></pre>`;
  });
  for(const [key,value] of Object.entries(defaults))template=template.replace('{{'+key+'}}',value);
  const equations=JSON.parse(read('random-math.json')),html=learning.enhance(compile(template,equations),'random-variables.html');
  if(/\{\{/.test(html))throw Error('Uncompiled Class 3 placeholder');
  fs.writeFileSync(path.join(dist,'random-variables.html'),html);
  for(const name of ['random.css','random-core.js','random.js','class-three.css','class-three.js','class-three-visuals.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
  console.log(`Rendered ${Object.keys(equations).length} Class 3 expressions and default charts.`);
}

function buildSampling(){
  const S=require('../src/sampling-core.js'), read=name=>fs.readFileSync(path.join(src,name),'utf8');
  const e=S.exact(),sim=S.simulate(),k=S.known(),p=S.proportions(),t=S.student();
  const defaults={
    'exact-chart-default':S.exactSvg(e),'exact-table-default':S.exactTable(e),'exact-metrics-default':S.metrics([['Expected sample mean ($)',e.mean],['Variance of mean ($²)',e.variance],['Standard error ($)',Math.sqrt(e.variance)],['Equally likely samples',e.total]]),
    'population-chart-default':S.populationSvg(),'simulation-chart-default':S.histogramSvg(sim),'running-chart-default':S.pathSvg(sim),'simulation-metrics-default':S.metrics([['Mean of simulated means',sim.center],['SD of simulated means',sim.sd],['Theoretical SE',sim.se],['Tickets per sample / samples',`${sim.n} / ${sim.reps}`]]),
    'simulation-note-default':`Seed ${sim.seed}. ${sim.means.filter(x=>x>=72).length} of ${sim.reps} sample means are beyond the visible 0–72 minute range; all means are included in summaries. These are simulated results, not exact probabilities. Changing n changes precision; changing B changes the smoothness of this estimate.`,
    'known-chart-default':S.normalSvg(k),'known-metrics-default':S.metrics([['Standard error',k.se],['Standardized cutoff z',k.z],['P(mean ≤ cutoff)',S.fmt(k.p,6)],['Individual population SD',k.sd]]),
    'proportion-chart-default':S.proportionSvg(p),'proportion-metrics-default':S.metrics([['Exact P(K ≤ k)',S.fmt(p.exact,6)],['Normal at k + 0.5',S.fmt(p.approx,6)],['SE of sample proportion',S.fmt(p.se,6)],['Expected successes / failures',`${p.n*p.p} / ${p.n*(1-p.p)}`]]),
    'proportion-note-default':`Both expected counts are at least 10, a common rule of thumb. Absolute approximation error here: ${S.fmt(Math.abs(p.approx-p.exact),6)}. A count threshold k corresponds to sample proportion k/n = ${S.fmt(p.k/p.n,6)}.`,
    'student-chart-default':S.tSvg(t),'student-metrics-default':S.metrics([['Estimated SE',t.se],['Observed t',t.t],['Degrees of freedom',t.df],['Left tail P(T ≤ t)',S.fmt(t.left,6)],['Two tails P(|T| ≥ |t|)',S.fmt(t.two,6)],['Benchmark population mean',t.mu]])
  };
  let template=read('sampling-distributions.html').replace(/\{\{samvisual:([a-z]+)\}\}/g,(_,name)=>require('../src/class-four-visuals.js').render(name)).replace(/(<details class="lesson"[^>]*?) open(?=>)/g,'$1').replace('{{sampling-tools}}',read('sampling-tools.html')).replace(/\{\{sam(python|output):([a-z]+)\}\}/g,(_,kind,name)=>{
    const text=read(`sampling-examples/${name}.${kind==='python'?'py':'txt'}`);
    return `<pre class="code-block" tabindex="0" role="region" aria-label="${kind==='python'?'Python code':'Checked Python output'}: ${esc(name)}. Scroll horizontally if needed."><code>${esc(text)}</code></pre>`;
  });
  for(const[key,value]of Object.entries(defaults))template=template.replace('{{'+key+'}}',value);
  const equations=JSON.parse(read('sampling-math.json')),html=learning.enhance(compile(template,equations),'sampling-distributions.html');
  if(/\{\{/.test(html))throw Error('Uncompiled Class 4 placeholder');
  fs.writeFileSync(path.join(dist,'sampling-distributions.html'),html);
  for(const name of ['sampling.css','sampling-core.js','sampling.js','class-four.css','class-four.js','class-four-visuals.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
  console.log(`Rendered ${Object.keys(equations).length} Class 4 expressions and default charts.`);
}

function buildEstimation(){
 const E=require('../src/estimation-core.js'),read=name=>fs.readFileSync(path.join(src,name),'utf8');
 const defs={quality:E.qualities(),mean:E.meanCI(),coverage:E.coverage(),proportion:E.proportion(),plan:E.plan()};
 let template=read('estimation.html').replace(/\{\{estvisual:([a-z]+)\}\}/g,(_,name)=>require('../src/class-five-visuals.js').render(name)).replace(/(<details class="lesson"[^>]*?) open(?=>)/g,'$1').replace('{{estimation-tools}}',read('estimation-tools.html')).replace(/\{\{est(python|output):([a-z]+)\}\}/g,(_,kind,name)=>`<pre class="code-block" tabindex="0" role="region" aria-label="${kind==='python'?'Python code':'Checked Python output'}: ${name}. Scroll horizontally if needed."><code>${esc(read(`estimation-examples/${name}.${kind==='python'?'py':'txt'}`))}</code></pre>`);
 for(const[id,d]of Object.entries(defs)){const view=E.views(id,d);template=template.replace('{{'+id+'-chart-default}}',E[id==='quality'?'qualitiesSvg':id==='mean'?'meanSvg':id+'Svg'](d)).replace('{{'+id+'-metrics-default}}',view.metrics).replace('{{'+id+'-note-default}}',esc(view.note));}
 const equations=JSON.parse(read('estimation-math.json')),html=learning.enhance(compile(template,equations),'estimation.html');if(/\{\{/.test(html))throw Error('Uncompiled Class 5 placeholder');
 fs.writeFileSync(path.join(dist,'estimation.html'),html);
 for(const name of ['estimation.css','estimation-core.js','estimation.js','class-five.css','class-five.js','class-five-visuals.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
 fs.mkdirSync(path.join(dist,'estimation-examples'),{recursive:true});
 for(const name of ['estimators','intervals','coverage','planning'])for(const ext of ['py','txt'])fs.copyFileSync(path.join(src,`estimation-examples/${name}.${ext}`),path.join(dist,`estimation-examples/${name}.${ext}`));
 console.log(`Rendered ${Object.keys(equations).length} Class 5 expressions and default experiments.`);
}

function buildHypothesis(){
 const L=require('../src/hypothesis-labs.cjs'),read=name=>fs.readFileSync(path.join(src,name),'utf8');
 let template=read('hypothesis-testing.html').replace(/\{\{hypvisual:([a-z]+)\}\}/g,(_,name)=>require('../src/class-six-visuals.js').render(name)).replace(/(<details class="lesson"[^>]*?) open(?=>)/g,'$1').replace('{{hypothesis-tools}}',read('hypothesis-tools.html')).replace(/\{\{(mean|power|proportion|independent|paired|twoprop|variance)-lab\}\}/g,(_,id)=>L.lab(id)).replace(/\{\{hyp(python|output):([a-z-]+)\}\}/g,(_,kind,name)=>`<pre class="code-block" tabindex="0" role="region" aria-label="${kind==='python'?'Python code':'Checked Python output'}: ${name}. Scroll horizontally if needed."><code>${esc(read(`hypothesis-examples/${name}.${kind==='python'?'py':'txt'}`))}</code></pre>`);
 const equations=JSON.parse(read('hypothesis-math.json')),html=learning.enhance(compile(template,equations),'hypothesis-testing.html');if(/\{\{/.test(html))throw Error('Uncompiled Class 6 placeholder');
 fs.writeFileSync(path.join(dist,'hypothesis-testing.html'),html);
 for(const name of ['hypothesis.css','hypothesis-core.js','hypothesis-config.js','hypothesis.js','class-six.css','class-six.js','class-six-visuals.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
 fs.mkdirSync(path.join(dist,'hypothesis-examples'),{recursive:true});
 for(const name of ['means','proportions','paired-variance','power'])for(const ext of ['py','txt'])fs.copyFileSync(path.join(src,`hypothesis-examples/${name}.${ext}`),path.join(dist,`hypothesis-examples/${name}.${ext}`));
 console.log(`Rendered ${Object.keys(equations).length} Class 6 expressions and seven interactive labs.`);
}

function buildAnova(){
 const V=require('../src/anova-view.js'),read=name=>fs.readFileSync(path.join(src,name),'utf8');
 let template=read('anova.html').replace(/\{\{anovacore:([a-z]+)\}\}/g,(_,name)=>require('../src/class-seven-cores.cjs').render(name)).replace(/\{\{anovavisual:([a-z]+)\}\}/g,(_,name)=>require('../src/class-seven-visuals.js').render(name)).replace(/(<details class="lesson"[^>]*?) open(?=>)/g,'$1').replace('{{anova-tools}}',read('anova-tools.html')).replace('{{one-lab}}',V.lab('one')).replace('{{two-lab}}',V.lab('two'));
 for(const [key,name] of [['anova-python','anova.py'],['anova-output','anova-output.txt']])template=template.replace('{{'+key+'}}',`<pre class="code-block" tabindex="0" role="region" aria-label="${key==='anova-python'?'Complete Python ANOVA example':'Checked ANOVA output'}. Scroll horizontally if needed."><code>${esc(read('downloads/'+name))}</code></pre>`);
 const equations=JSON.parse(read('anova-math.json')),html=learning.enhance(compile(template,equations),'anova.html');if(/\{\{/.test(html))throw Error('Uncompiled Class 7 placeholder');
 fs.writeFileSync(path.join(dist,'anova.html'),html);
 for(const name of ['anova.css','anova-core.js','anova-view.js','anova.js','class-seven.css','class-seven.js','class-seven-visuals.js','exposition-modeling.css','exposition-modeling.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
 fs.mkdirSync(path.join(dist,'downloads'),{recursive:true});fs.copyFileSync(path.join(src,'downloads/anova.py'),path.join(dist,'downloads/anova.py'));
 console.log(`Rendered ${Object.keys(equations).length} Class 7 expressions, two interactive labs and all default charts.`);
}

function buildRegression(){
 const R=require('../src/regression-core.js'),V=require('../src/regression-view.js'),read=name=>fs.readFileSync(path.join(src,name),'utf8');
 let template=read('regression.html').replace(/\{\{regvisual:([a-z]+)\}\}/g,(_,name)=>require('../src/class-eight-visuals.js').render(name)).replace(/(<details class="lesson"[^>]*?) open(?=>)/g,'$1').replace('{{regression-tools}}',read('regression-tools.html')).replace('{{line-lab}}',V.lab('line')).replace('{{model-lab}}',V.lab('model')).replace('{{hero-chart}}',V.plot(R.fit(R.DEFAULT_PAIRS,.05,4.5),{id:'reg-hero',bands:false,showPrediction:false}));
 for(const [key,name] of [['regression-python','regression.py'],['regression-output','regression-output.txt']])template=template.replace('{{'+key+'}}',`<pre class="code-block" tabindex="0" role="region" aria-label="${key==='regression-python'?'Complete Python regression example':'Checked regression output'}. Scroll horizontally if needed."><code>${esc(read('downloads/'+name))}</code></pre>`);
 const equations=JSON.parse(read('regression-math.json')),html=learning.enhance(compile(template,equations),'regression.html');if(/\{\{/.test(html))throw Error('Uncompiled Week 8 placeholder');
 fs.writeFileSync(path.join(dist,'regression.html'),html);
 for(const name of ['regression.css','regression-core.js','regression-view.js','regression.js','class-eight.css','class-eight.js','class-eight-visuals.js','exposition-modeling.css','exposition-modeling.js'])fs.copyFileSync(path.join(src,name),path.join(dist,name));
 fs.mkdirSync(path.join(dist,'downloads'),{recursive:true});fs.copyFileSync(path.join(src,'downloads/regression.py'),path.join(dist,'downloads/regression.py'));
 console.log(`Rendered ${Object.keys(equations).length} Week 8 expressions, two interactive labs and all default charts.`);
}

if(require.main===module) build();
module.exports={renderMath,compile,options};

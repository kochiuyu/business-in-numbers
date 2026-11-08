'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { classes } = require('./scripts/navigation.cjs');
const plans = require('./src/lesson-roadmaps.json');
const firstStep = file => `${file}#${plans[file].steps[0].anchor}`;
let checks = 0;
const ok = (value, label) => { checks++; assert.ok(value, label); };
const eq = (value, expected, label) => { checks++; assert.deepEqual(value, expected, label); };
const read = file => fs.readFileSync('dist/' + file, 'utf8');
const home = read('index.html'), alias = read('course-introduction.html');
const lesson = read('descriptive-statistics.html'), redirect = read('legacy-class-one.js');
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const oldIds = ids(lesson), homeIds = ids(home);
eq(classes[0][0], 'descriptive-statistics.html', 'Class 1 has its own URL');
for (const [file, html] of [['index.html', home], ['course-introduction.html', alias]]) {
  ok(html.includes('<body class="course-intro">'), file + ' serves the real introduction');
  ok(html.includes('BUSINESS STATISTICS, ONE QUESTION AT A TIME'), file + ' Start Here');
  ok(!html.includes('class="case-part"'), file + ' is not Class 1');
  ok(!/http-equiv="refresh"/i.test(html), file + ' is not a redirect shell');
  ok(html.includes(`href="${firstStep('descriptive-statistics.html')}">Begin Class 1`), file + ' direct start');
  for (let i = 1; i <= 8; i++) ok(html.includes('id="course-stop-' + i + '"'), file + ' course stop ' + i);
}
ok(home.indexOf('legacy-class-one.') < home.indexOf('</head>'), 'legacy redirect loads before content');
ok(!alias.includes('legacy-class-one.'), 'introduction alias never redirects Class 1 hashes');
ok(alias.includes('id="main"') && alias.includes('id="learning-start"'), 'old introduction anchors remain');
ok(home.includes('href="#start-here-main"') && home.includes('id="start-here-main"'), 'homepage skip target');
eq(new Set(homeIds).size, homeIds.length, 'unique homepage IDs');
for (const [, ref] of home.matchAll(/href="#([^"]+)"/g)) {
  ok(homeIds.includes(ref), 'homepage anchor exists ' + ref);
  ok(!oldIds.includes(ref), 'homepage link cannot trigger legacy redirect ' + ref);
}
function run(hash, search = '') {
  const calls = [], events = {};
  const location = { hash, search, replace: value => calls.push(value) };
  vm.runInNewContext(redirect, { location, window: { addEventListener: (name, fn) => { events[name] = fn; } } });
  return { calls, events, location };
}
for (const id of oldIds) {
  eq(run('#' + id, '?review=1').calls, ['descriptive-statistics.html?review=1#' + id], 'preserves old bookmark ' + id);
}
for (const hash of ['', '#', '#course-route', '#readiness', '#start-here-overview', '#unknown', '#%bad']) {
  eq(run(hash).calls, [], 'keeps homepage destination ' + hash);
}
eq(run('#%63lass1-mean').calls, ['descriptive-statistics.html#%63lass1-mean'], 'encoded legacy fragment retained verbatim');
const later = run(''); later.location.hash = '#case-part-4'; later.events.hashchange();
eq(later.calls, ['descriptive-statistics.html#case-part-4'], 'later legacy fragment follows same rule');
for (const [file] of classes) {
  const html = read(file);
  ok(!html.includes('class="course-start"'), file + ' no duplicate Start Here link');
  ok(html.includes('class="brand" href="index.html"'), file + ' brand goes home');
  ok(html.includes('href="descriptive-statistics.html"'), file + ' Class 1 reachable');
  ok(!html.includes('href="index.html#learning-start"'), file + ' no ambiguous Class 1 link');
}
console.log(`Passed ${checks} homepage, course navigation and legacy bookmark assertions.`);

// The landing page is a short entry point; optional depth is retained in native HTML.
const intro = require('./scripts/introduction.cjs');
for (const [file, html] of [['index.html', home], ['course-introduction.html', alias]]) {
  eq((html.match(/class="course-card-link"/g)||[]).length,8,file+' eight direct class cards');
  eq((html.match(/class="intro-resource"/g)||[]).length,4,file+' four optional guidance sections');
  ok(!/<details class="(?:intro-resource|course-stop)"[^>]*\bopen/.test(html),file+' starts compact');
  for (const [lessonFile] of classes) ok(html.includes(`class="course-card-link" href="${firstStep(lessonFile)}"`),file+' immediate lesson link '+lessonFile);
  for (const id of ['course-guide','study-loop','readiness','course-destination']) ok(html.includes(`class="intro-resource" id="${id}"`),file+' named native resource '+id);
  for (const a of [...intro.readiness,intro.capstone]) ok(html.includes(require('./scripts/activities.cjs').render(a)),file+' full unchanged activity '+a.id);
  ok(/href="introduction\.[a-f0-9]{16}\.css"/.test(html),file+' isolated fingerprinted layout');
  ok(/src="introduction\.[a-f0-9]{16}\.js"/.test(html),file+' bookmark enhancement');
  ok(html.includes('Five illustrative orders, separate from the lesson datasets.'),file+' honest example boundary');
}
const values=[20,25,30,35,90]; eq(values.reduce((a,b)=>a+b,0)/values.length,40,'hero mean');eq(values[2],30,'hero median');
const disclosureScript=fs.readFileSync('src/introduction.js','utf8');
function disclosureHarness(hash) {
  const parent={open:false,parentElement:null,matches:tag=>tag==='details'};
  const child={open:false,parentElement:parent,matches:tag=>tag==='details'};
  const target={parentElement:child,matches:()=>false};
  const events={},clicks=[],location={hash};
  const document={getElementById:id=>id==='activity'?target:id==='resource'?parent:null,querySelectorAll:()=>[{hash:'#resource',addEventListener:(_,fn)=>clicks.push(fn)}]};
  vm.runInNewContext(disclosureScript,{document,location,window:{addEventListener:(event,fn)=>events[event]=fn}});
  return {parent,child,target,events,click:clicks[0],location};
}
for (const hash of ['#activity','#%61ctivity']) {const h=disclosureHarness(hash);ok(h.parent.open&&h.child.open,'nested bookmark opens ancestors '+hash);}
for (const hash of ['','#unknown','#%bad']) {const h=disclosureHarness(hash);ok(!h.parent.open&&!h.child.open,'unrelated fragment is safe '+hash);}
const h=disclosureHarness('#resource');ok(h.parent.open,'resource bookmark opens');h.parent.open=false;h.click({button:0});ok(h.parent.open,'same-hash shortcut reopens');
for (const flag of ['defaultPrevented','ctrlKey','metaKey','shiftKey','altKey']) {h.parent.open=false;h.click({[flag]:true});ok(!h.parent.open,'modified link untouched '+flag);}
h.parent.open=false;h.click({button:1});ok(!h.parent.open,'middle-click untouched');h.location.hash='#activity';h.events.hashchange();ok(h.parent.open&&h.child.open,'later fragment reveals content');h.parent.open=false;h.events.pageshow();ok(h.parent.open,'history restoration reveals target');
for(const [file]of classes)ok(!read(file).includes('introduction.'),'homepage-only assets do not affect '+file);
console.log(`Passed ${checks} total homepage, compact layout, illustration and disclosure assertions.`);

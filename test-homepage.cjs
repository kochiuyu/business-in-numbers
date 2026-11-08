'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { classes } = require('./scripts/navigation.cjs');
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
  ok(html.includes('START HERE / A CONNECTED EIGHT-CLASS COURSE'), file + ' Start Here');
  ok(!html.includes('class="case-part"'), file + ' is not Class 1');
  ok(!/http-equiv="refresh"/i.test(html), file + ' is not a redirect shell');
  ok(html.includes('href="descriptive-statistics.html#learning-start">Begin Class 1'), file + ' direct start');
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
  ok(html.includes('class="course-start" href="index.html"'), file + ' Start Here goes home');
  ok(html.includes('class="brand" href="index.html"'), file + ' brand goes home');
  ok(html.includes('href="descriptive-statistics.html"'), file + ' Class 1 reachable');
  ok(!html.includes('href="index.html#learning-start"'), file + ' no ambiguous Class 1 link');
}
console.log(`Passed ${checks} homepage, course navigation and legacy bookmark assertions.`);

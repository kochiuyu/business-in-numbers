'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {classes, sections, enhance} = require('./scripts/navigation.cjs');
let checks = 0;
function ok(value, label) { checks++; assert.ok(value, label); }
function eq(value, expected, label) { checks++; assert.deepEqual(value, expected, label); }
for (const [file, shortcuts] of Object.entries(sections)) {
  const html = fs.readFileSync('dist/' + file, 'utf8');
  const header = html.match(/<header class="course-header">[\s\S]*?<\/header>/)?.[0];
  ok(header, file + ': built header');
  eq((html.match(/<header class="course-header">/g) || []).length, 1, file + ': one header');
  ok(!html.includes('<header class="top">'), file + ': old header removed');
  ok(header.includes('<details class="course-picker">'), file + ': native no-JS disclosure');
  ok(header.includes('<summary aria-controls="course-menu">'), file + ': disclosure relationship');
  ok(header.includes('<nav aria-label="All classes">'), file + ': named course navigation');
  const courseNav = header.match(/<nav aria-label="All classes">([\s\S]*?)<\/nav>/)[1];
  eq((courseNav.match(/<li>/g) || []).length, 8, file + ': all eight classes');
  eq((courseNav.match(/aria-current="page"/g) || []).length, file === 'course-introduction.html' ? 0 : 1, file + ': current class');
  for (const [href, title] of classes) {
    ok(courseNav.includes('href="' + href + '"'), file + ': class URL ' + href);
    ok(courseNav.includes(title), file + ': title ' + title);
    ok(fs.existsSync('dist/' + href), file + ': class page exists');
  }
  for (const [id, label] of shortcuts) {
    ok(header.includes('<a href="#' + id + '">' + label + '</a>'), file + ': native shortcut ' + id);
    eq((html.match(new RegExp('\\bid="' + id + '"', 'g')) || []).length, 1, file + ': unique shortcut target ' + id);
  }
  eq((html.match(/href="navigation.css"/g) || []).length, 1, file + ': navigation CSS');
  eq((html.match(/src="navigation.js"/g) || []).length, 1, file + ': navigation JS');
  ok(html.indexOf('src="navigation.js"') > html.indexOf('</main>'), file + ': script after content');
}
for (const asset of ['navigation.js', 'navigation.css']) eq(fs.readFileSync('dist/' + asset, 'utf8'), fs.readFileSync('src/' + asset, 'utf8'), asset + ': build copies latest source');
assert.throws(() => enhance('<html></html>', 'unknown.html'), /Unknown navigation page/); checks++;
assert.throws(() => enhance('<html></html>', 'index.html'), /Missing course header/); checks++;

// Dependency-free DOM harness. Browser layout and native history are covered by
// manual browser QA; this exercises only our JS behavior, not emulated layout.
class Element {
  constructor(order = 0) { this.order = order; this.top = 1000; this.scrollMarginTop = '8px'; this.height = 136; this.attrs = {}; this.handlers = {}; this.open = false; this.focusCalls = []; this.children = []; }
  addEventListener(type, fn, options) { (this.handlers[type] ||= []).push({fn, once: !!options?.once}); }
  emit(type, event = {}) { for (const h of [...(this.handlers[type] || [])]) { h.fn(event); if(h.once) this.handlers[type] = this.handlers[type].filter(x => x !== h); } }
  getBoundingClientRect() { return {top:this.top, height:this.height}; }
  compareDocumentPosition(other) { return other.order < this.order ? 2 : 4; }
  contains(target) { return target === this || this.children.includes(target); }
  setAttribute(name, value) { this.attrs[name] = value; }
  hasAttribute(name) { return Object.hasOwn(this.attrs, name); }
  removeAttribute(name) { delete this.attrs[name]; }
  focus(options) { this.focusCalls.push(options); }
}
const header = new Element(), picker = new Element(), trigger = new Element(), menuLink = new Element();
const first = new Element(0), second = new Element(1), third = new Element(2);
const links = ['second','first','third','missing'].map(id => Object.assign(new Element(), {hash:'#' + id}));
const targets = {first, second, third};
picker.children = [trigger, menuLink];
picker.querySelector = () => trigger;
picker.querySelectorAll = () => [menuLink];
header.querySelector = () => picker;
header.querySelectorAll = () => links;
const doc = new Element(), win = new Element(), frames = [], properties = {};
doc.querySelector = () => header;
doc.getElementById = id => targets[id] || null;
doc.documentElement = {style:{setProperty:(name, value) => {properties[name] = value;}}};
let observerCallback, observed;
class ResizeObserver { constructor(callback) { observerCallback = callback; } observe(target) { observed = target; } }
win.ResizeObserver = ResizeObserver;
const code = fs.readFileSync('src/navigation.js', 'utf8');
vm.runInNewContext(code, {document:doc, window:win, Node:{DOCUMENT_POSITION_PRECEDING:2}, ResizeObserver, getComputedStyle: target => ({scrollMarginTop:target.scrollMarginTop}), requestAnimationFrame: fn => frames.push(fn)});
function flush() { while(frames.length) frames.shift()(); }
eq(properties['--course-header-height'], '136px', 'measures sticky header');
eq(observed, header, 'observes header reflow');
ok(links.every(link => !link.hasAttribute('aria-current')), 'nothing selected above first section');
first.top = -200; second.top = -100; third.top = 500;
win.emit('scroll'); win.emit('scroll'); win.emit('resize');
eq(frames.length, 1, 'coalesces layout work'); flush();
eq(links[0].attrs['aria-current'], 'location', 'active shortcut follows content order, not menu order');
ok(!links[1].hasAttribute('aria-current'), 'previous shortcut cleared');
// A large target-specific scroll margin (such as the charts section) moves
// the anchor landing position below the ordinary section threshold.
third.scrollMarginTop = '80px'; third.top = 239;
win.emit('scroll'); flush();
ok(!links[2].hasAttribute('aria-current'), 'margin threshold excludes section one pixel below boundary');
third.top = 238; win.emit('scroll'); flush();
eq(links[2].attrs['aria-current'], 'location', 'includes target at header + padding + own margin + tolerance');
third.scrollMarginTop = '8px'; win.emit('scroll'); flush();
ok(!links[2].hasAttribute('aria-current'), 'smaller computed margin restores ordinary threshold');
third.scrollMarginTop = 'auto'; third.top = 159; win.emit('scroll'); flush();
ok(!links[2].hasAttribute('aria-current'), 'nonnumeric margin safely falls back to zero');
third.top = 158; win.emit('scroll'); flush();
eq(links[2].attrs['aria-current'], 'location', 'zero fallback threshold includes exact boundary');
third.scrollMarginTop = '8px';
third.top = 100; win.emit('hashchange'); flush();
eq(links[2].attrs['aria-current'], 'location', 'hash/scroll updates current section');
header.height = 156.2; observerCallback(); flush();
eq(properties['--course-header-height'], '157px', 'rounds and updates responsive height');
picker.open = true; let prevented = false;
picker.emit('keydown', {key:'Escape', preventDefault() {prevented = true;}});
ok(!picker.open && prevented, 'Escape dismisses menu'); eq(trigger.focusCalls.length, 1, 'Escape restores trigger focus');
picker.open = true; doc.emit('click', {target:menuLink}); ok(picker.open, 'inside click remains open until link activation');
doc.emit('click', {target:new Element()}); ok(!picker.open, 'outside click dismisses menu');
picker.open = true; doc.emit('focusin', {target:trigger}); ok(picker.open, 'inside focus keeps menu');
doc.emit('focusin', {target:new Element()}); ok(!picker.open, 'Tab outside dismisses menu');
eq(trigger.focusCalls.length, 1, 'outside dismissal does not steal focus');
picker.open = true; menuLink.emit('click'); ok(!picker.open, 'class selection dismisses menu');
picker.open = true; win.emit('pageshow'); ok(!picker.open, 'bfcache restore closes stale menu');
for (const event of [{ctrlKey:true}, {metaKey:true}, {shiftKey:true}, {altKey:true}, {button:1}, {button:2}, {defaultPrevented:true}]) {
  links[1].emit('click', event);
  eq(first.focusCalls.length, 0, 'modified or canceled click preserves focus: ' + JSON.stringify(event));
  ok(!first.hasAttribute('tabindex'), 'modified or canceled click leaves target untouched');
}
links[1].emit('click', {button:0}); eq(first.attrs.tabindex, '-1', 'shortcut target made programmatically focusable');
eq(first.focusCalls.length, 1, 'shortcut moves keyboard focus');
first.emit('blur'); ok(!first.hasAttribute('tabindex'), 'temporary tabindex removed');
second.setAttribute('tabindex', '0'); links[0].emit('click'); second.emit('blur'); eq(second.attrs.tabindex, '0', 'existing tabindex preserved');
links[3].emit('click'); ok(true, 'missing target does not throw');
vm.runInNewContext(code, {document:{querySelector:() => null}}); ok(true, 'no course header is safe');
console.log(`Passed ${checks} navigation structure, assets, disclosure, focus, and scroll-state assertions.`);

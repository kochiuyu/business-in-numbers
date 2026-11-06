'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = new URL('https://kochiuyu.github.io/business-in-numbers/');
let count = 0;
for (const name of fs.readdirSync('dist').filter(n => n.endsWith('.html') || n.endsWith('.css'))) {
  const source = fs.readFileSync(path.join('dist', name), 'utf8');
  assert(!/PRIVATE REVIEW|owner-private|not publicly shared|remains private to its owner/i.test(source), name + ': stale privacy wording');
  const refs = [...source.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]);
  if (name.endsWith('.css')) refs.push(...[...source.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]));
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(ref)) continue;
    const url = new URL(ref, new URL(name, base));
    assert(url.pathname.startsWith(base.pathname), name + ': escapes project path: ' + ref);
    const local = decodeURIComponent(url.pathname.slice(base.pathname.length));
    assert(fs.existsSync(path.join('dist', local)), name + ': missing local target: ' + ref);
    count++;
  }
}
assert(fs.existsSync('dist/vendor/katex/LICENSE'));
console.log('Passed ' + count + ' relative links/assets under /business-in-numbers/.');

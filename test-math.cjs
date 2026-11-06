'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {renderMath,compile,options}=require('./scripts/build.cjs');
let checks=0;
function check(value,message){checks++;assert.ok(value,message);}
function equal(a,b,message){checks++;assert.deepEqual(a,b,message);}
function throws(fn){checks++;assert.throws(fn);}
const lesson=JSON.parse(fs.readFileSync('src/math.json','utf8'));
const fixtures=JSON.parse(fs.readFileSync('src/math-fixtures.json','utf8'));
for(const [id,e] of Object.entries({...lesson,...fixtures})){
 const out=renderMath(id,e);
 check(out.includes('<math xmlns="http://www.w3.org/1998/Math/MathML"'),`${id}: missing semantic MathML`);
 check(out.includes('class="katex-html" aria-hidden="true"'),`${id}: visual duplicate must be hidden from assistive technology`);
 check(out.includes('<annotation encoding="application/x-tex">'),`${id}: source annotation missing`);
 check(!out.includes('katex-error'),`${id}: render error`);
 if(e.display){check(out.includes('tabindex="0"'),`${id}: keyboard scrolling missing`);check(out.includes('Read formula / LaTeX'),`${id}: fallback missing`);}
}
throws(()=>renderMath('broken',{title:'Broken',text:'Broken',tex:'\\frac{1}{'}));
throws(()=>compile('{{math:missing}}',{}));
throws(()=>compile('{{math:x}} {{math:x}}',{x:lesson.mean}));
throws(()=>compile('',{unused:lesson.mean}));
equal(options.trust,false);equal(options.throwOnError,true);equal(options.strict,'error');
const unsafe=renderMath('unsafe',{title:'Unsafe',text:'No active content',tex:'\\href{javascript:alert(1)}{x}'});
check(!unsafe.includes('<a '),'Untrusted TeX must not create links');
throws(()=>renderMath('unsafe-html',{title:'Unsafe',text:'No raw HTML',tex:'\\htmlStyle{color:red}{x}'}));
const html=fs.readFileSync('dist/index.html','utf8');
const standalone=fs.readFileSync('class1-standalone.html','utf8');
equal((html.match(/<math xmlns=/g)||[]).length,Object.keys(lesson).length);
check(!html.includes('{{math:'),'Uncompiled source placeholder');
check(!/<script[^>]+src="https?:/i.test(html),'Remote script dependency');
check(!/<link[^>]+href="https?:/i.test(html),'Remote stylesheet dependency');
check(!/<(?:script|link)[^>]+(?:src|href)=/i.test(standalone),'Standalone references external asset');
check(!/url\((?!data:)/i.test(standalone),'Standalone has non-embedded fonts');
check(html.includes('<noscript>'),'No-JavaScript explanation missing');
check(fs.existsSync('dist/vendor/katex/LICENSE'),'KaTeX license missing');
const original=fs.readFileSync('src/index.html','utf8');
const ids=t=>[...t.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).sort();
const currentIds=new Set(ids(html));
for(const id of ids(original)) check(currentIds.has(id),`Existing interaction ID removed: ${id}`);
equal(ids(html).length,currentIds.size,'Duplicate IDs in expanded lesson');
for(const m of fs.readFileSync('dist/vendor/katex/katex.min.css','utf8').matchAll(/url\(([^)]+)\)/g)) check(fs.existsSync(path.join('dist/vendor/katex',m[1].replace(/["']/g,''))),'Missing local font');
const listeners={};const panels=[{open:false},{open:true},{open:false}];
vm.runInNewContext(fs.readFileSync('src/math-ui.js','utf8'),{document:{querySelectorAll:()=>panels},window:{addEventListener:(name,fn)=>listeners[name]=fn}});
listeners.beforeprint();check(panels.every(p=>p.open),'Print does not expand every disclosure');
listeners.beforeprint();listeners.afterprint();equal(panels.map(p=>p.open),[false,true,false],'Print does not restore pre-print state');
listeners.afterprint();equal(panels.map(p=>p.open),[false,true,false],'Repeated print event changes state');
console.log(`Passed ${checks} math, security, asset, preservation and print-state assertions.`);

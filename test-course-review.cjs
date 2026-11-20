'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const synthesis=fs.readFileSync('dist/course-review.html','utf8');
const equations=fs.readFileSync('dist/equation-guide.html','utf8');
assert.equal((synthesis.match(/data-review-slide/g)||[]).length,7);
for(const id of ['route','choose','inference','worked','compare','brief','next'])assert(synthesis.includes(`id="${id}"`),id);
for(const id of ['eq-1','eq-2','eq-3','eq-4','eq-5','eq-6','eq-7','eq-8','test-direction'])assert(equations.includes(`id="${id}"`),id);
for(const topic of ['Sampling variation','Design and model limits','Causation','recommendation'])assert(synthesis.includes(topic),topic);
for(const phrase of ['p-value is a tail probability under the null model','Nonrejection does not prove','n−1 degrees of freedom','does not establish causation'])assert(equations.includes(phrase),phrase);
assert((equations.match(/class="katex-mathml"/g)||[]).length>=18,'MathML missing');
for(const page of ['index.html','regression.html','course-review.html','equation-guide.html']){
 const html=fs.readFileSync('dist/'+page,'utf8');
 assert(html.includes('href="course-review.html"'),page+' synthesis link');
 assert(html.includes('href="equation-guide.html"'),page+' equation link');
}
console.log('Course synthesis and equation guide structure passed.');

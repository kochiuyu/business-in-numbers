'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let checks=0;
function check(value,message){checks++;assert.ok(value,message);}
// Naming-prohibited generic elements need an explicit semantic role. Image
// roles are reserved for visual marks whose label replaces their whole content;
// groups keep meaningful child text available to assistive technology.
const required={
 'src/index.html':[['case-evidence','group']],
 'src/anova.html':[['anova-hero-chart','group']],
 'src/class-four-visuals.js':[['c4-inbox','group'],['c4-pairs','group']],
 'src/class-five-visuals.js':[['c5-order-cards','group'],['c5-conversion-grid','img']]
};
for(const[file,rules]of Object.entries(required))for(const[cls,role]of rules)check(fs.readFileSync(file,'utf8').includes(`class="${cls}" role="${role}" aria-label=`),`${file}: ${cls} preserves its label and children appropriately`);
check(fs.readFileSync('src/class-seven-visuals.js','utf8').includes('<div role="img" aria-label="${n} orders">'),'ANOVA dot counts have an image alternative');
check(/class="die [^\n]*?role="img" aria-label="Outcome/.test(fs.readFileSync('src/probability.js','utf8')),'Die outcome states have an image alternative');
for(const dir of ['src','scripts','dist'])for(const file of fs.readdirSync(dir)){
 if(!/\.(?:html|c?js)$/.test(file))continue;
 const source=fs.readFileSync(path.join(dir,file),'utf8');
 for(const match of source.matchAll(/<(?:div|span)\b[^>]*\baria-label="[^>]*>/g))check(/\brole="(?:group|img|region|status|alert|note|radiogroup|toolbar|progressbar|list|listitem|tablist)"/.test(match[0]),`${dir}/${file}: named generic element needs a role: ${match[0]}`);
}
for(const file of ['index','probability','random-variables','sampling-distributions','estimation','hypothesis-testing','anova','regression']){
 const html=fs.readFileSync(`dist/${file}.html`,'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 check(new Set(ids).size===ids.length,`${file}: unique IDs`);
 for(const [,refs]of html.matchAll(/\baria-(?:labelledby|describedby|controls)="([^"]+)"/g))for(const id of refs.split(/\s+/))check(ids.includes(id),`${file}: ARIA reference ${id} exists`);
}
const css=fs.readFileSync('src/styles.css','utf8');
check(css.includes('.quiz-feedback:empty{margin:0;padding:0}'),'Empty feedback has no unwanted panel spacing');
check(!/\.quiz-feedback:empty\s*\{[^}]*\b(?:display\s*:\s*none|visibility\s*:\s*hidden)/.test(css),'Empty live feedback remains in the accessibility tree');
console.log(`Passed ${checks} semantic-role, ARIA-reference, ID, and live-region styling assertions.`);

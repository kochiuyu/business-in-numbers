'use strict';
// Reverse only the reviewed additive table-step expansion for historical checks.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const reference=require('../test-class1-tables-reference.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function restore(source){
 source=source.replaceAll('descriptive-statistics.html','index.html');
 if(!source.includes('id="table-from-records"'))return source;
 assert.equal(hash(source),reference.reviewed_sha256,'reviewed table-step source');
 const a=source.indexOf('<section class="case-part" id="case-tables"'),b=source.indexOf('<section class="case-part" id="case-charts"');
 assert.ok(a>=0&&b>a,'table-step boundaries');
 assert.equal(hash(source.slice(a,b)),reference.reviewed_table_sha256,'reviewed table step intact');
 const result=source.slice(0,a)+reference.baseline_table+source.slice(b);
 assert.equal(hash(result),reference.baseline_sha256,'all source outside the table step unchanged');
 return result;
}
module.exports={restore};

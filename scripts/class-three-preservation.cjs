'use strict';
// Historical regression suites compare the prior layout. Validate the delivered
// source and each explicitly reviewed layout patch before recovering that layout.
// Original topic hashes and earlier regression baselines are never regenerated.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const reference=require('../test-class3-restructure-reference.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function restore(source){
 source=source.replaceAll('descriptive-statistics.html','index.html');
 assert.equal(hash(source),reference.reviewed_sha256,'fifteen-step Class 3 source matches reviewed layout');
 const tokens=source.match(/<[^>]*>|[^<]+/g)||[];
 for(const patch of [...reference.patches].reverse()){
  assert.equal(tokens.slice(patch.token_start,patch.token_end).join(''),patch.after,'reviewed Class 3 layout change intact');
  tokens.splice(patch.token_start,patch.token_end-patch.token_start,patch.before);
 }
 const baseline=tokens.join('');
 assert.equal(hash(baseline),reference.baseline_sha256,'historical Class 3 source recovered exactly');
 return baseline;
}
module.exports={restore};

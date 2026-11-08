'use strict';
// Undo only the reviewed eight-step layout when running historical snapshots.
// Actual teaching, interactions and figures are tested against the delivered page.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const reference=require('../test-class1-restructure-reference.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function restore(source){
 source=source.replaceAll('descriptive-statistics.html','index.html');
 source=require('./class-one-twelve-preservation.cjs').restore(source);
 assert.equal(hash(source),reference.reviewed_sha256,'eight-step source matches reviewed layout');
 const tokens=source.match(/<[^>]*>|[^<]+/g)||[];
 for(const patch of [...reference.patches].reverse()){
  assert.equal(tokens.slice(patch.token_start,patch.token_end).join(''),patch.after,'reviewed layout change intact');
  tokens.splice(patch.token_start,patch.token_end-patch.token_start,patch.before);
 }
 const baseline=tokens.join('');
 assert.equal(hash(baseline),reference.baseline_sha256,'historical Class 1 source recovered exactly');
 return baseline;
}
module.exports={restore};

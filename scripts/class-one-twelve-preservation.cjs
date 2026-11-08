'use strict';
// Restore the exact eight-step source only for historical preservation tests.
// Delivered twelve-step teaching and behavior have separate direct tests.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const reference=require('../test-class1-twelve-reference.json');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function restore(source){
 if(hash(source)===reference.baseline_sha256)return source;
 assert.equal(hash(source),reference.reviewed_sha256,'twelve-step source matches reviewed layout');
 const tokens=source.match(/<[^>]*>|[^<]+/g)||[];
 for(const patch of [...reference.patches].reverse()){
  assert.equal(tokens.slice(patch.token_start,patch.token_end).join(''),patch.after,'reviewed twelve-step layout change intact');
  tokens.splice(patch.token_start,patch.token_end-patch.token_start,patch.before);
 }
 const result=tokens.join('');
 assert.equal(hash(result),reference.baseline_sha256,'exact eight-step source recovered');
 return result;
}
module.exports={restore};

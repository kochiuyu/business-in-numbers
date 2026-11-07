'use strict';
// Restore only the explicitly reviewed readability changes before applying historical
// byte-preservation checks. Reject changed/missing patch text rather than masking it.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const reference = require('../test-readability-reference.json');
function restore(source, page) {
  if (page === 'index') source = require('./class-one-preservation.cjs').restore(source);
  if (page === 'probability') source = require('./class-two-preservation.cjs').restore(source);
  if (page === 'random-variables') source = require('./class-three-preservation.cjs').restore(source);
  if (page === 'sampling-distributions') source = require('./class-four-preservation.cjs').restore(source);
  if (page === 'estimation') source = require('./class-five-preservation.cjs').restore(source);
  const record = reference.pages[page];
  if (!record) return source;
  const tokens = source.match(/<[^>]*>|[^<]+/g) || [];
  for (const patch of [...record.patches].reverse()) {
    assert.equal(tokens.slice(patch.token_start, patch.token_end).join(''), patch.after,
      `${page}: reviewed readability change is intact at token ${patch.token_start}`);
    tokens.splice(patch.token_start, patch.token_end - patch.token_start, patch.before);
  }
  const baseline = tokens.join('');
  assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'), record.baseline_sha256,
    `${page}: all source outside reviewed readability changes is byte-identical`);
  return baseline;
}
module.exports = {restore};

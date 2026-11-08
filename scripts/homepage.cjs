'use strict';
const fs = require('node:fs');
const path = require('node:path');
const intro = require('./introduction.cjs');
const navigation = require('./navigation.cjs');

// index.html used to be Class 1. Keep every known lesson fragment working,
// including bookmarks into explanations, while serving a real introduction at /.
function legacyRedirect(ids) {
  return `/* Compatibility for previously shared Class 1 bookmarks. */
(function () {
  'use strict';
  var lessonIds = new Set(${JSON.stringify(ids)});
  function followLegacyBookmark() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    if (lessonIds.has(id)) location.replace('descriptive-statistics.html' + location.search + location.hash);
  }
  followLegacyBookmark();
  window.addEventListener('hashchange', followLegacyBookmark);
})();
`;
}

function build(dist) {
  const lesson = fs.readFileSync(path.join(dist, 'descriptive-statistics.html'), 'utf8');
  const ids = [...new Set([...lesson.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))].sort();
  let home = intro.build()
    .replace(/id="main"/g, 'id="start-here-main"')
    .replace(/href="#main"/g, 'href="#start-here-main"')
    .replace(/id="learning-start"/g, 'id="start-here-overview"')
    .replace(/href="#learning-start"/g, 'href="#start-here-overview"');
  home = navigation.enhance(home, 'index.html');
  // Run before content paints. The redirect is limited to real Class 1 anchors.
  home = home.replace('<head>', '<head><script src="legacy-class-one.js"></script>');
  home = home.replace('<noscript>', '<noscript><p class="no-script">Following an older Class 1 bookmark? <a href="descriptive-statistics.html">Open Class 1: Descriptive statistics</a> and use its topic links.</p>');
  fs.writeFileSync(path.join(dist, 'legacy-class-one.js'), legacyRedirect(ids));
  fs.writeFileSync(path.join(dist, 'index.html'), home);
}

module.exports = { build, legacyRedirect };

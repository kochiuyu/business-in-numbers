'use strict';
const fs = require('node:fs');
const path = require('node:path');

function addPresentations(dist, src) {
  const manifest = JSON.parse(fs.readFileSync(path.join(src, 'presentation-content.json'), 'utf8'));
  for (const [page, config] of Object.entries(manifest)) {
    const file = path.join(dist, page);
    let html = fs.readFileSync(file, 'utf8');
    const seen = new Set();
    for (const slide of config.slides) {
      const id = slide.id || `${slide.part}--${slide.kind}`;
      if (!/^[a-z0-9-]+$/.test(id) || seen.has(id) || !slide.title || slide.title.length > 95 || !slide.context || slide.context.length > 180) throw Error(`Invalid slide: ${id}`);
      if (slide.kind !== 'scene' && (!slide.line || !Array.isArray(slide.points) || slide.points.length !== 2)) throw Error(`Missing teaching content: ${id}`);
      seen.add(id);
      const marker = `id="${slide.part}"`;
      if (html.indexOf(marker) < 0 || html.indexOf(marker) !== html.lastIndexOf(marker)) throw Error(`Missing or duplicate slide source: ${slide.part}`);
      const start = html.indexOf(marker);
      const next = html.indexOf(`<section class="${config.partClass}"`, start + marker.length);
      const section = html.slice(start, next < 0 ? undefined : next);
      const sourceKind = slide.kind === 'reason' ? 'scene' : slide.kind;
      if (!section.includes(`class="${config.partClass === 'c2-part' ? 'c2-' : 'c7-'}${sourceKind}`)) {
        throw Error(`Missing ${slide.kind} in ${slide.part}`);
      }
    }
    if (!html.includes(`class="${config.controlsClass}"`)) throw Error(`Missing presentation launch location: ${page}`);
    html = html.replace('</head>', '<link rel="stylesheet" href="presentation.css"></head>');
    html = html.replace('</body>', `<script type="application/json" data-presentation-config>${JSON.stringify(config)}</script><script src="presentation.js"></script></body>`);
    fs.writeFileSync(file, html);
  }
  for (const asset of ['presentation.css', 'presentation.js']) fs.copyFileSync(path.join(src, asset), path.join(dist, asset));
}

module.exports = {addPresentations};

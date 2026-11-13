'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {renderLine} = require('./presentation-math.cjs');

function addPresentations(dist, src) {
  const manifest = {
    ...JSON.parse(fs.readFileSync(path.join(src, 'presentation-content.json'), 'utf8')),
    ...JSON.parse(fs.readFileSync(path.join(src, 'presentation-foundations.json'), 'utf8')),
    ...require('./presentation-later.cjs').presentations(),
    ...require('./presentation-final.cjs').presentations().manifest
  };
  const framing = {...JSON.parse(fs.readFileSync(path.join(src, 'presentation-framing.json'), 'utf8')),...require('./presentation-later.cjs').framing,...require('./presentation-final.cjs').framing};
  const math = {...JSON.parse(fs.readFileSync(path.join(src, 'presentation-math.json'), 'utf8')),...require('./presentation-later.cjs').math,...require('./presentation-final.cjs').presentations().math};
  const usedMath = new Set();
  for (const page of Object.keys(framing)) if (!manifest[page]) throw Error(`Framing has no presentation: ${page}`);
  for (const [page, config] of Object.entries(manifest)) {
    const bookends = framing[page];
    if (bookends) {
      if (!Array.isArray(bookends.opening) || !Array.isArray(bookends.closing) || bookends.opening.length !== 3 || bookends.closing.length !== 2) throw Error(`Incomplete presentation framing: ${page}`);
      config.slides = [...bookends.opening, ...config.slides, ...bookends.closing];
    }
    const file = path.join(dist, page);
    let html = fs.readFileSync(file, 'utf8');
    const seen = new Set();
    for (const slide of config.slides) {
      const id = slide.id || `${slide.part}--${slide.kind}`;
      if (!/^[a-z0-9-]+$/.test(id) || seen.has(id) || !slide.title || slide.title.length > 95 || !slide.context || slide.context.length > 180 || (slide.phase && slide.phase.length > 40)) throw Error(`Invalid slide: ${id}`);
      if (slide.kind === 'graphic' ? !slide.visual || !Array.isArray(slide.visual.items) || slide.visual.items.length < 2 || slide.visual.items.length > 8 : slide.kind !== 'scene' && (!slide.line || !Array.isArray(slide.points) || slide.points.length < 2 || slide.points.length > 4)) throw Error(`Missing teaching content: ${id}`);
      if (math[id]) { slide.lineTex = math[id]; usedMath.add(id); }
      if (![6,8].includes(config.classNumber) || slide.lineTex) renderLine(slide, id);
      seen.add(id);
      const marker = `id="${slide.part}"`;
      if (html.indexOf(marker) < 0 || html.indexOf(marker) !== html.lastIndexOf(marker)) throw Error(`Missing or duplicate slide source: ${slide.part}`);
      const start = html.indexOf(marker);
      const next = html.indexOf(`<section class="${config.partClass}"`, start + marker.length);
      const section = html.slice(start, next < 0 ? undefined : next);
      const sourceKind = slide.kind === 'reason' ? 'scene' : slide.kind;
      const prefix = {'c2-part': 'c2-', 'c7-part': 'c7-'}[config.partClass];
      if (prefix && !section.includes(`class="${prefix}${sourceKind}`)) {
        throw Error(`Missing ${slide.kind} in ${slide.part}`);
      }
    }
    if (!html.includes(`class="${config.controlsClass}"`)) throw Error(`Missing presentation launch location: ${page}`);
    html = html.replace('</head>', '<link rel="stylesheet" href="presentation.css"></head>');
    html = html.replace('</body>', `<script type="application/json" data-presentation-config>${JSON.stringify(config)}</script><script src="presentation.js"></script></body>`);
    fs.writeFileSync(file, html);
  }
  for (const id of Object.keys(math)) if (!usedMath.has(id)) throw Error(`Unused slide math: ${id}`);
  for (const asset of ['presentation.css', 'presentation.js']) fs.copyFileSync(path.join(src, asset), path.join(dist, asset));
}

module.exports = {addPresentations};

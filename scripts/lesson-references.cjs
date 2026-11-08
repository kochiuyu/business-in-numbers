'use strict';
const {nodes}=require('./lesson-roadmaps.cjs');
const has=(node,name)=>(node?.attrs.class||'').split(/\s+/).includes(name);
// The current route owns lesson order. The original source numbering remains
// in archival/source-preservation checks, but is not a second learner sequence.
// Target only number badges directly inside a lesson disclosure's summary;
// numbered calculations, nested lists, equations and anchors are untouched.
function enhance(html){
 const badges=nodes(html).filter(n=>n.tag==='span'&&has(n,'lesson-number')&&n.parent?.tag==='summary'&&n.parent.parent?.tag==='details'&&has(n.parent.parent,'lesson')&&/^\s*\d+\s*$/.test(html.slice(n.openEnd,n.end-7)));
 for(const n of badges.reverse())html=html.slice(0,n.start)+html.slice(n.end);
 return html;
}
module.exports={enhance};

'use strict';
const katex = require('katex');

// Slide copy remains plain text in the source manifest. The build turns lines
// with mathematical relations into offline KaTeX HTML and accessible MathML.
const identifiers = new Set(['P','E','A','B','C','F','H','I','L','N','S','T','U','V','X','Y','Z','a','b','c','e','k','m','n','p','q','r','t','x','z']);
const operators = new Set(['Var','Cov','SD','CV','IQR','SE','LR','MS','SS','min','max','df']);
const superscript = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+'};
const subscript = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','ᵢ':'i','ⱼ':'j'};
const symbol = {'≥':'\\ge ','≤':'\\le ','≈':'\\approx ','≠':'\\ne ','∼':'\\sim ','∩':'\\cap ','∪':'\\cup ','×':'\\times ','÷':'\\div ','−':'-','±':'\\pm ','→':'\\to ','Σ':'\\sum ','Φ':'\\Phi ','χ':'\\chi ','μ':'\\mu ','α':'\\alpha ','η':'\\eta ','√':'\\sqrt','·':'\\cdot ','∈':'\\in ','∞':'\\infty '};
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function texFromPlain(line) {
  let tex = line.replace(/x̄/g, 'XBAR');
  tex = tex.replace(/[A-Za-z]+(?:[ '-][A-Za-z]+)*/g, word => {
    const trimmed = word.trim();
    if (trimmed === 'XBAR') return '\\bar{x}';
    if (identifiers.has(trimmed)) return trimmed;
    if (operators.has(trimmed)) return `\\operatorname{${trimmed}}`;
    return `\\text{${trimmed.replace(/[\\{}$%&#_]/g,'\\$&')}}`;
  });
  tex = tex.replace(/(\$?\d[\d,.]*)\/(\d[\d,.]*)/g, (_,a,b)=>`\\frac{${a}}{${b}}`);
  tex = tex.replace(/[₀-₉ᵢⱼ]+(?:,[₀-₉ᵢⱼ]+)*/g, chunk=>`_{${[...chunk].map(c=>subscript[c]||c).join('')}}`);
  tex = tex.replace(/[⁰-⁹⁻⁺]+/g, chunk=>`^{${[...chunk].map(c=>superscript[c]).join('')}}`);
  tex = tex.replace(/[≥≤≈≠∼∩∪×÷−±→ΣΦχμαη√·∈∞]/g,c=>symbol[c]);
  tex = tex.replace(/⅔/g,'\\frac{2}{3}').replace(/⅓/g,'\\frac{1}{3}');
  tex = tex.replace(/(?<!\\)\$/g,'\\$').replace(/%/g,'\\%');
  tex = tex.replace(/\|/g,'\\mid ').replace(/;/g,'\\;;\\quad ');
  tex = tex.replace(/\\sqrt\[([^\]]*)\]/g,'\\sqrt{$1}').replace(/\\sqrt\(([^()]*)\)/g,'\\sqrt{$1}').replace(/\\sqrt(\d+(?:\.\d+)?|[a-z])/g,'\\sqrt{$1}');
  return tex;
}

function splitLine(line) {
  return line.split(/;\s*|\s+·\s+|:\s+/).filter(Boolean).flatMap(part => {
    if (part.length <= 42) return [part];
    const terms = [];
    let depth = 0, start = 0;
    for (let i = 0; i < part.length; i++) {
      if ('([{'.includes(part[i])) depth++;
      if (')]}'.includes(part[i])) depth--;
      if (part[i] === '=' && depth === 0) {
        terms.push(part.slice(start, i).trim());
        start = i + 1;
      }
    }
    terms.push(part.slice(start).trim());
    if (terms.length < 2) return [part];
    const rows = [terms.shift()];
    for (const term of terms) {
      const next = `${rows[rows.length - 1]} = ${term}`;
      if (next.length <= 42) rows[rows.length - 1] = next;
      else rows.push(`= ${term}`);
    }
    return rows;
  });
}

function renderLine(slide, id) {
  if (!slide.line || slide.format === 'question') return;
  if (id.endsWith('-decide') && !slide.lineTex) return;
  if (!slide.lineTex && !/[=≤≥≈≠∼∩∪×÷Σ√Φχμ±]/.test(slide.line)) return;
  if (!slide.lineTex && /≠/.test(slide.line) && !/[=≤≥≈]/.test(slide.line)) return;
  const rows = slide.lineTex ? (Array.isArray(slide.lineTex) ? slide.lineTex : [slide.lineTex]).map(tex=>({tex}))
    : splitLine(slide.line).map(text=>({tex:/[=≤≥≈≠∼∩∪×÷Σ√Φχμ±]|\d\s*\/\s*\d/.test(text)?texFromPlain(text):null,text}));
  const rendered = rows.map(({tex,text})=>{
    if (!tex) return `<span class="presentation-text-row">${esc(text)}</span>`;
    try { return `<span class="presentation-math-row">${katex.renderToString(tex,{output:'htmlAndMathml',throwOnError:true,strict:'error',trust:false,maxExpand:1000,maxSize:20})}</span>`; }
    catch (error) { throw Error(`Invalid slide math ${id}: ${error.message}\n${tex}`); }
  }).join('');
  slide.lineHtml = `<span class="presentation-math" data-slide-math="${id}" tabindex="0" title="${esc(slide.line)}">${rendered}</span>`;
}

module.exports = {renderLine,texFromPlain};

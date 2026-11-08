'use strict';
// One navigation definition for the introduction and every lesson.
const classes = [
  ['index.html', 'Descriptive statistics', 'Describe the data you have'],
  ['probability.html', 'Probability', 'Reason about uncertainty'],
  ['random-variables.html', 'Random variables', 'Model possible outcomes'],
  ['sampling-distributions.html', 'Sampling distributions', 'Understand sample variation'],
  ['estimation.html', 'Estimation', 'Estimate with uncertainty'],
  ['hypothesis-testing.html', 'Hypothesis testing', 'Evaluate a business claim'],
  ['anova.html', 'ANOVA', 'Compare several groups'],
  ['regression.html', 'Regression', 'Explain and predict']
];
const sections = {
  'course-introduction.html': [['learning-start', 'Overview'], ['course-route', 'Eight classes'], ['study-loop', 'How to study'], ['readiness', 'Warm-up']],
  'index.html': [['learning-start', 'Business case'], ['lessons', 'Twelve steps'], ['lab', 'Order lab'], ['charts', 'Charts'], ['case-brief', 'Decision brief'], ['practice', 'Practice']],
  'probability.html': [['learning-start', 'Overview'], ['bayes-lab', 'Explore'], ['lessons', 'Learn'], ['tools', 'Tools'], ['practice', 'Practice']],
  'random-variables.html': [['learning-start', 'Overview'], ['count-lab', 'Explore'], ['lessons', 'Learn'], ['tools', 'Tools'], ['practice', 'Practice']],
  'sampling-distributions.html': [['learning-start', 'Overview'], ['lessons', 'Learn'], ['sampling-lab', 'Explore'], ['tools', 'Tools'], ['practice', 'Practice']],
  'estimation.html': [['learning-start', 'Overview'], ['estimator', 'Learn'], ['quality-lab', 'Explore'], ['tools', 'Tools'], ['practice', 'Practice']],
  'hypothesis-testing.html': [['learning-start', 'Overview'], ['hypotheses', 'Learn'], ['tools', 'Tools'], ['knowledge-check', 'Practice']],
  'anova.html': [['learning-start', 'Overview'], ['grouped-data', 'Learn'], ['interaction-lab', 'Explore'], ['tools', 'Tools'], ['practice', 'Practice']],
  'regression.html': [['learning-start', 'Overview'], ['relationship', 'Learn'], ['model-lab', 'Explore'], ['tools', 'Tools'], ['practice', 'Practice']]
};
function enhance(html, file) {
  if (!sections[file]) throw Error('Unknown navigation page: '+file);
  const index = classes.findIndex(c => c[0] === file);
  const intro = index < 0;
  const current = intro ? 'Course introduction' : classes[index][1];
  const number = intro ? 'Start here' : `Class ${index + 1} of 8`;
  const next = classes[intro ? 0 : index + 1];
  const header = `<header class="course-header">
  <div class="course-header-main">
    <a class="brand" href="course-introduction.html" aria-label="Business in Numbers · course home"><span class="brandmark" aria-hidden="true">▥</span><span>BUSINESS<br><b>IN NUMBERS</b></span></a>
    <div class="course-header-actions">
      <a class="course-start" href="course-introduction.html"${intro ? ' aria-current="page"' : ''}>Start here</a>
      <details class="course-picker">
        <summary aria-controls="course-menu"><span>Browse classes</span><span class="course-picker-count" aria-hidden="true">${intro ? '01–08' : String(index+1).padStart(2,'0')+' / 08'}</span><svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></summary>
        <div class="course-menu" id="course-menu">
          <div class="course-menu-heading"><div><span class="course-menu-eyebrow">THE LEARNING PATH</span><p>From data to decisions.</p></div><a href="course-introduction.html"${intro ? ' aria-current="page"' : ''}>Course introduction <span aria-hidden="true">↗</span></a></div>
          <nav aria-label="All classes"><ol>${classes.map(([href,title,description],i)=>`<li><a href="${href}"${index===i?' aria-current="page"':''}><span class="course-menu-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="course-menu-copy"><span class="course-menu-title"><span class="sr-only">Class ${i+1}: </span>${title}</span><small>${description}</small></span>${index===i?'<span class="course-menu-current">Current</span>':''}</a></li>`).join('')}</ol></nav>
          <div class="course-menu-footer"><span>Follow in order, or revisit any class.</span>${next?`<a href="${next[0]}">${intro?'Begin Class 1':'Next: Class '+(index+2)} <span aria-hidden="true">→</span></a>`:'<a href="course-introduction.html">Back to course overview <span aria-hidden="true">→</span></a>'}</div>
        </div>
      </details>
    </div>
  </div>
  <div class="course-header-context">
    <div class="course-location"><span>${number}</span><b>${current}</b></div>
    <nav class="lesson-shortcuts" aria-label="On this page">${sections[file].map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>
  </div>
</header>`;
  if (!/<header class="top">[\s\S]*?<\/header>/.test(html)) throw Error('Missing course header: '+file);
  return html.replace(/<header class="top">[\s\S]*?<\/header>/, header)
    .replace('</head>','<link rel="stylesheet" href="navigation.css"></head>')
    .replace('</body>','<script src="navigation.js"></script></body>');
}
module.exports = {classes, sections, enhance};

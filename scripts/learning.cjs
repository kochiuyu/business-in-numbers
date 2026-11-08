'use strict';
const activities = require('./activities.cjs');
const lessons = [
  ['descriptive-statistics.html','Describe what happened','Center, spread, shape and relationships'],
  ['probability.html','Reason about uncertainty','Events, conditioning and updated beliefs'],
  ['random-variables.html','Model possible outcomes','Random variables and distributions'],
  ['sampling-distributions.html','Understand sample variation','Sampling distributions and standard error'],
  ['estimation.html','Estimate with uncertainty','Estimators, confidence intervals and planning'],
  ['hypothesis-testing.html','Evaluate a business claim','Tests, errors, power and study design'],
  ['anova.html','Compare several groups','Variation, factors and interactions'],
  ['regression.html','Explain and predict a response','Least squares, inference and diagnostics']
];
function enhance(html, file) {
  const index = lessons.findIndex(x => x[0] === file);
  if (index < 0) throw Error('Unknown lesson: '+file);
  const path = `<aside class="course-guide" aria-label="Study navigation"><p class="course-intro-link"><a href="index.html">Start here · The eight-class introduction →</a><br>See the connected story, refresh the basics, and choose your learning route.</p><details class="course-map"><summary><span>YOUR LEARNING PATH</span><b>Lesson ${index+1} of 8 · ${lessons[index][1]}</b></summary><p>Follow the sequence on a first pass. Each lesson answers a question the previous one leaves open.</p><nav aria-label="Eight-lesson course"><ol>${lessons.map((x,i)=>`<li><a href="${x[0]}#learning-start"${i===index?' aria-current="page"':''}><span class="course-step">${i+1}</span><span><b>${x[1]}</b><small>${x[2]}</small></span></a></li>`).join('')}</ol></nav></details><div class="reading-controls" hidden><div><b>How would you like to study?</b><p>Read in order opens the core explanations. Worked answers stay closed until you choose to reveal them.</p></div><div class="reading-actions" role="group" aria-label="Reading mode"><button type="button" data-reading-mode="read" aria-pressed="true">Read in order</button><button type="button" data-reading-mode="review" aria-pressed="false">Compact review</button></div><p id="reading-status" class="reading-status" role="status" aria-live="polite"></p></div></aside>`;
  html=html.replace(/(<section\b[^>]*class="[^"]*\bhero\b[^"]*"[^>]*>[\s\S]*?<\/section>)/, '$1'+path);
  if(!html.includes('class="course-guide"'))throw Error('Missing lesson hero: '+file);
  if(!['descriptive-statistics.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','hypothesis-testing.html','anova.html','regression.html'].includes(file)) html=html.replace(/<details class="lesson"(?![^>]*\bopen\b)/g,'<details class="lesson" open');
  if(['descriptive-statistics.html','probability.html','random-variables.html','sampling-distributions.html','estimation.html','hypothesis-testing.html','anova.html','regression.html'].includes(file)) html=html.replace('Read in order opens the core explanations. Worked answers stay closed until you choose to reveal them.','Pictures come first. Open full explanations when you want the calculations or practice.').replace('>Read in order<','>Open all explanations<').replace('>Compact review<','>Close explanations<');
  // Distinguish route length from explanation depth consistently across the course.
  if (lessons.some(([lesson]) => lesson === file)) {
    html=html.replace(`Lesson ${index+1} of 8`, `Class ${index+1} of 8`)
      .replace('Pictures come first. Open full explanations when you want the calculations or practice.',
        'First pass: follow the pictures, make a prediction, then check your reasoning. Open all explanations opens topic explanations and optional extensions; check answers stay closed. Show technical depth reveals extra mathematics inside explanations; Show all steps changes only the reading route.');
  }
  if(file==='descriptive-statistics.html')html=html.replace('First pass: follow the pictures, make a prediction, then check your reasoning.','First pass: work through each visible example, make a prediction, then check your reasoning.');
  html=html.replace('</head>','<link rel="stylesheet" href="learning.css"></head>');
  html=html.replace('</body>','<script src="learning.js"></script></body>');
  return require('./navigation.cjs').enhance(require('./lesson-roadmaps.cjs').enhance(activities.enhance(html,file),file),file);
}
module.exports={lessons,enhance};

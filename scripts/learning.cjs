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
  // The header owns course navigation; the class roadmap owns the step sequence.
  // Keep explanations local to their topic rather than adding another setup panel.
  html=html.replace('</head>','<link rel="stylesheet" href="learning.css"></head>');
  html=html.replace('</body>','<script src="learning.js"></script></body>');
  return require('./navigation.cjs').enhance(require('./lesson-roadmaps.cjs').enhance(activities.enhance(html,file),file),file);
}
module.exports={lessons,enhance};

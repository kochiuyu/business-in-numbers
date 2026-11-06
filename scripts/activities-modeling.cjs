'use strict';

module.exports = [
  {
    id: 'c7-independent-orders', file: 'anova.html', afterTopic: 1,
    title: 'Count experiments, not stopwatch readings', kind: 'choice',
    prompt: 'A warehouse randomly assigns 18 orders to three packing processes, six orders per process. Two observers time each order independently, producing 36 readings. A colleague wants to treat all 36 readings as independent orders in a one-way ANOVA. What is the best response?',
    options: [
      {text: 'Use all 36 readings as independent observations because the observers are different.', feedback: 'Different observers do not create different orders. The two readings share the same underlying order and its packing time.'},
      {text: 'Use one pre-specified combined time per order, or model the repeated measurements explicitly.', feedback: 'Yes. There are 18 independently assigned orders. Combining each pair, for example by its mean if appropriate for the measurement protocol, preserves the experimental unit.'},
      {text: 'Use only the three process means as the entire dataset for an ordinary one-way ANOVA.', feedback: 'This discards the order-to-order variation. With one value per process, the ordinary one-way ANOVA has no residual degrees of freedom to estimate its error variance.'}
    ], answer: 1,
    explanation: 'The process was assigned to an order, not to an observer reading. An order-level analysis has N = 18, k = 3 and residual df = 18 − 3 = 15. A repeated-measurement model can retain both readings, but must account for readings from the same order being related. Random assignment supports a causal comparison for this experiment; counting extra readings does not increase the number of independent orders.'
  },
  {
    id: 'c7-build-f', file: 'anova.html', afterTopic: 4,
    title: 'Build the signal-to-noise comparison', kind: 'number',
    prompt: 'Explore the one-way variation lab and identify the between-group and within-group mean squares. Then solve this separate fixed case, regardless of the lab settings: independent delivery times in minutes are A = [3, 5, 7], B = [5, 7, 9], C = [7, 9, 11]. Calculate the one-way ANOVA F statistic. Give a value to two decimal places.',
    link: {href: '#one-test', label: 'Explore the one-way variation lab'},
    answer: 3, tolerance: 0.01, unit: 'F units (dimensionless)',
    hint: 'The three means are 5, 7 and 9; the grand mean is 7. Divide each sum of squares by its own degrees of freedom before taking the ratio.',
    explanation: 'Between-group SS = 3[(5 − 7)² + (7 − 7)² + (9 − 7)²] = 24. Within each group, deviations are −2, 0, 2, so within-group SS = 3(4 + 0 + 4) = 24. The df are 3 − 1 = 2 and 9 − 3 = 6. Thus MS between = 24/2 = 12 minutes², MS within = 24/6 = 4 minutes², and F = 12/4 = 3.00. Dividing the raw sums of squares would incorrectly give 1. Equal sums of squares do not imply equal mean squares.'
  },
  {
    id: 'c7-map-variation', file: 'anova.html', afterTopic: 10,
    title: 'Assign each question to its variation component', kind: 'match',
    prompt: 'A balanced experiment crosses training format A (video or live) with shift B (morning or evening), with four independent workers in each combination. The response is a task score. Match each description to the component of the full two-way ANOVA.',
    options: ['Factor A main effect', 'Factor B main effect', 'A × B interaction', 'Within-cell error'],
    pairs: [
      {prompt: 'Average score differs between training formats, averaging equally over both shifts.', answer: 0},
      {prompt: 'The live-minus-video score difference is larger in the evening than in the morning.', answer: 2},
      {prompt: 'Workers with the same training format and shift still have different scores.', answer: 3},
      {prompt: 'Average score differs between shifts, averaging equally over both training formats.', answer: 1}
    ],
    explanation: 'Main effects compare marginal means. Interaction asks whether the effect of one factor changes across levels of the other. Within-cell error describes variation among independent workers sharing both factor levels. Here N = 2 × 2 × 4 = 16: the three model components each have 1 df and error has 2 × 2 × (4 − 1) = 12 df, summing to total df = 15. These descriptions identify targets, not whether a test will be significant.'
  },
  {
    id: 'c7-contextual-rollout', file: 'anova.html', afterTopic: 12,
    title: 'Turn an interaction into a careful recommendation', kind: 'choice',
    prompt: 'In a randomized balanced trial, mean basket values are: weekday without offer $30, weekday with offer $32, weekend without offer $40, weekend with offer $50. The interaction test has p = 0.01. Sending an offer costs $4 per customer. Which is the best next step before deciding on a rollout?',
    options: [
      {text: 'Roll out on both day types because the offer raises average basket value by $6.', feedback: 'The equal-weight average gain is $6, but it hides gains of $2 and $10. Basket revenue also is not profit, so subtracting only the sending cost is not a full profitability analysis.'},
      {text: 'Rule out weekdays and guarantee that weekends are profitable.', feedback: 'The sample means suggest different opportunities, but neither a significant interaction nor a $10 sample revenue gain guarantees a positive population profit gain.'},
      {text: 'Estimate the offer effect and uncertainty separately by day type, then compare expected margin gains with costs.', feedback: 'Yes. The day-specific effects are the decision-relevant quantities, and the business target is incremental margin after all relevant costs.'}
    ], answer: 2,
    explanation: 'The observed weekday gain is $32 − $30 = $2; the weekend gain is $50 − $40 = $10. Their difference is $8, so a single $6 average does not describe either context. The interaction p-value supplies evidence that population effects differ under the model, not separate proof of each effect or profitability. Use planned or appropriately adjusted follow-up intervals and a margin calculation before committing.'
  },
  {
    id: 'c8-intercept-boundary', file: 'regression.html', afterTopic: 2,
    title: 'Read the intercept within the evidence', kind: 'choice',
    prompt: 'A bakery fits daily sales = −120 + 8 × daily visitors, using days with 40–80 visitors. Sales are measured in dollars. A manager says, “The model proves we lose $120 on days with no visitors.” Which response is most defensible?',
    options: [
      {text: 'Correct: every fitted intercept is an observed business outcome.', feedback: 'The fitted intercept is the model value at x = 0, not necessarily an observed value. No zero-visitor day was in these data.'},
      {text: 'The intercept locates the fitted line; zero visitors is outside the observed range, and sales are not profit.', feedback: 'Yes. Both the extrapolation and the change from sales to profit undermine the manager’s claim.'},
      {text: 'A negative intercept means the line cannot be useful anywhere.', feedback: 'The line can still be useful in the observed range: at 40 visitors it predicts $200 and at 80 it predicts $520. A questionable extrapolation does not automatically invalidate those in-range predictions.'}
    ], answer: 1,
    explanation: 'At zero visitors, the algebraic prediction is −$120, but the data only cover 40–80 visitors. The straight-line pattern may not extend to zero. Even a credible sales prediction would not establish a profit or loss without costs. Report the slope with units and restrict practical interpretation to a range where the relationship is supported.'
  },
  {
    id: 'c8-estimate-slope', file: 'regression.html', afterTopic: 4,
    title: 'Fit a new line from its center', kind: 'number',
    prompt: 'Explore the movable-line lab to see how slope changes vertical misses. Then use these fixed data, not the current lab data: staff hours x = [1, 2, 3, 4] and completed tasks y = [3, 5, 4, 8] for four independent trial sessions. Find the least-squares slope with an intercept. Report tasks per staff hour to two decimal places.',
    link: {href: '#least-squares', label: 'Explore the movable-line lab'},
    answer: 1.4, tolerance: 0.01, unit: 'tasks per staff hour',
    hint: 'First find x̄ = 2.5 and ȳ = 5. Then calculate Sxy = Σ(x − x̄)(y − ȳ) and Sxx = Σ(x − x̄)².',
    explanation: 'The centered x values are −1.5, −0.5, 0.5, 1.5 and the centered y values are −2, 0, −1, 3. Therefore Sxy = 3 + 0 − 0.5 + 4.5 = 7 and Sxx = 2.25 + 0.25 + 0.25 + 2.25 = 5. The slope is 7/5 = 1.40 tasks per staff hour. The intercept is 5 − 1.4(2.5) = 1.5 tasks. The fitted line is ŷ = 1.5 + 1.4x, with residuals 0.1, 0.7, −1.7, 0.9 and SSE = 4.20 tasks². The slope is a fitted association, not a guaranteed causal productivity gain.'
  },
  {
    id: 'c8-fan-residuals', file: 'regression.html', afterTopic: 7,
    title: 'Diagnose a widening fan', kind: 'choice',
    prompt: 'A straight-line sales model has residuals centered near zero throughout the observed visitor range. Their typical size grows from about $10 at low visitor counts to about $70 at high visitor counts. Sessions are independent, and the scatter does not show obvious curvature. What should you investigate first?',
    options: [
      {text: 'Unequal error variance: conventional constant-variance standard errors and intervals may be misleading.', feedback: 'Yes. A widening residual fan suggests that uncertainty changes with the predictor, even if the mean relationship remains roughly linear.'},
      {text: 'A nonzero mean error, because some residuals are large.', feedback: 'Size and center are different. Large positive and negative residuals can remain centered near zero while their spread changes.'},
      {text: 'Delete high-visitor sessions until the residual spread is constant.', feedback: 'Removing legitimate observations to improve a diagnostic distorts the evidence. Investigate measurement issues and suitable models or uncertainty methods instead.'}
    ], answer: 0,
    explanation: 'The first concern is heteroskedasticity, meaning nonconstant conditional error variance. A roughly straight mean pattern does not ensure constant noise. Investigate the process and consider an appropriate variance model, transformation or heteroskedasticity-robust coefficient inference. Robust coefficient standard errors alone do not provide an individual prediction interval with correctly varying spread. The course lab’s classical intervals assume constant variance.'
  },
  {
    id: 'c8-report-targets', file: 'regression.html', afterTopic: 13,
    title: 'Match the output to the planning question', kind: 'match',
    prompt: 'A delivery firm models route duration in minutes from distance in kilometers for comparable independent routes observed between 5 and 30 km. Match each planning question to the most relevant model output. Assume diagnostics support the model; no output by itself proves causation or guarantees an outcome.',
    options: ['Slope confidence interval', 'Mean-response confidence interval at 20 km', 'Individual prediction interval at 20 km', 'Residual diagnostic plots'],
    pairs: [
      {prompt: 'How uncertain is the estimated change in mean duration associated with one extra kilometer?', answer: 0},
      {prompt: 'What uncertainty should accompany the expected average duration of comparable 20 km routes?', answer: 1},
      {prompt: 'What range describes uncertainty for the duration of one new 20 km route?', answer: 2},
      {prompt: 'Does the unexplained variation curve, widen, or show a pattern over time?', answer: 3}
    ],
    explanation: 'The slope interval targets a coefficient in minutes per kilometer. The mean-response interval targets the conditional population mean in minutes. The prediction interval targets one new response, also in minutes, and adds that route’s own noise. Diagnostic plots assess whether the modeling assumptions are plausible; they are not intervals. A long-run average across many future routes has small but nonzero future-sampling variation, so the mean-response interval here targets the population expectation rather than an exact finite-batch average.'
  }
];

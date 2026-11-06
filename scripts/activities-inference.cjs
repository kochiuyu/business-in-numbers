'use strict';

// Fixed-data transfer tasks. Answers do not depend on a lab's current settings.
module.exports = [
  {
    id: 'c4-coverage-design', file: 'sampling-distributions.html', afterTopic: 1,
    title: 'Choose the sample that answers the staffing question', kind: 'choice',
    prompt: 'A retailer wants the mean handling time across all orders next month. Phone orders are 30% of orders and take longer than app orders. Which plan best addresses coverage of the target population?',
    options: [
      {text: 'Take 10,000 app orders because a large sample removes bias.', feedback: 'More app orders reduce noise about app orders. They still omit the slower phone orders and answer a different question.'},
      {text: 'Sample randomly within both channels and combine their means using the target population’s 70% app / 30% phone weights.', feedback: 'Correct. Both channels enter the design, and population weights connect the channel estimates to the overall target.'},
      {text: 'Sample equal numbers from both channels and always take the unweighted average of their means.', feedback: 'Equal sample sizes can be useful, but an unweighted average represents a 50/50 population, not the stated 70/30 population.'}
    ], answer: 1,
    explanation: 'Estimate the overall mean as 0.70 × app mean + 0.30 × phone mean. This addresses channel coverage under the stated target mix; it still requires suitable sampling within channels, a stable target mix and attention to nonresponse.'
  },
  {
    id: 'c4-se-transfer', file: 'sampling-distributions.html', afterTopic: 5,
    title: 'Separate the simulation from the business sample', kind: 'number',
    prompt: 'Explore the simulation lab: change observations per sample, then repetitions. Now use this separate fixed scenario: independent package weights have population SD 18 grams. Each estimate averages 144 packages. What is the theoretical standard error of that average? The computer repeats the experiment 2,000 times.',
    link: {href: '#simulation-lab', label: 'Explore the sampling simulation'},
    answer: 1.5, tolerance: 0.01, unit: 'grams',
    hint: 'Divide the population SD by the square root of observations in one sample. Repetitions are not extra packages in that sample.',
    explanation: 'SE = 18 / √144 = 18 / 12 = 1.5 grams. The 2,000 repetitions stabilize the simulated picture, not the theoretical SE of one 144-package average. Finite population variance and independence justify this SE formula; a normal population is not needed for the formula itself.'
  },
  {
    id: 'c4-binomial-boundary', file: 'sampling-distributions.html', afterTopic: 8,
    title: 'Translate a service promise before approximating', kind: 'choice',
    prompt: 'Let K count late deliveries among 100 independent deliveries, each late with probability 0.20. The manager asks for the probability of “at least 25 late deliveries.” Which boundary belongs in a continuity-corrected normal approximation?',
    options: [
      {text: 'P(Y > 25.5), for Y with mean 20 and SD 4.', feedback: 'That excludes the count 25 and approximates 26 or more. “At least” includes the boundary count.'},
      {text: 'P(Y < 24.5), for Y with mean 20 and SD 4.', feedback: '24.5 is the correct dividing boundary, but this is the opposite tail: 24 or fewer.'},
      {text: 'P(Y > 24.5), for Y with mean 20 and SD 4.', feedback: 'Correct. The continuous bar representing count 25 begins at 24.5, and the requested event continues to the right.'}
    ], answer: 2,
    explanation: 'K ≥ 25 includes the full mass at 25. Approximate it with Y > 24.5, where E(K) = 100 × 0.20 = 20 and SD(K) = √(100 × 0.20 × 0.80) = 4. Both expected counts, 20 and 80, exceed 10. The normal result is still an approximation, not an exact binomial probability.'
  },
  {
    id: 'c4-name-the-distribution', file: 'sampling-distributions.html', afterTopic: 10,
    title: 'Name what varies', kind: 'match',
    prompt: 'An analyst studies invoice amounts using independent samples of 40 invoices. Match each quantity or plot to what it represents.',
    options: ['Population distribution of individual amounts', 'Observed sample distribution', 'Sampling distribution of the sample mean', 'Estimated standard error of the sample mean'],
    pairs: [
      {prompt: 'A histogram of the 40 amounts actually selected this morning.', answer: 1},
      {prompt: 'A distribution of averages across repeated independent samples of size 40.', answer: 2},
      {prompt: 'The distribution from which each individual invoice amount is drawn.', answer: 0},
      {prompt: 'The sample SD divided by √40.', answer: 3}
    ],
    explanation: 'The observation and the average are different random variables. The morning histogram records one realized sample. Repeating the entire sample-selection process produces the sampling distribution of its mean. With unknown population SD, s/√40 estimates that mean’s standard error; it does not describe the spread of individual invoices.'
  },
  {
    id: 'c5-mse-decision', file: 'estimation.html', afterTopic: 2,
    title: 'Do not rank estimators by spread alone', kind: 'choice',
    prompt: 'Two estimators target mean delivery time. Estimator A is unbiased with variance 9 minutes². Estimator B has bias +2 minutes and variance 4 minutes². At this sample size, which has lower mean squared error?',
    options: [
      {text: 'A, because an unbiased estimator always has lower MSE.', feedback: 'Unbiasedness removes one source of error, but a sufficiently large variance can still produce greater total squared error.'},
      {text: 'B, because its MSE is 8 minutes² versus A’s 9 minutes².', feedback: 'Correct. MSE adds variance and squared bias: 4 + 2² = 8, while A has 9 + 0² = 9.'},
      {text: 'B, because its MSE is just its variance, 4 minutes².', feedback: 'The ranking happens to be right, but the calculation ignores systematic error. The two-minute bias contributes four minutes².'}
    ], answer: 1,
    explanation: 'MSE(A) = 9; MSE(B) = 4 + 4 = 8 minutes². This is a comparison at the given sample size, not a claim that B is consistent or always preferable. A fixed two-minute bias would remain even if its variance later shrank to zero.'
  },
  {
    id: 'c5-interval-parts', file: 'estimation.html', afterTopic: 6,
    title: 'Audit the parts of an interval', kind: 'match',
    prompt: 'For an independent normal sample of 100 orders, the sample mean is $80 and the known population SD is $20. A 95% z interval uses critical value 1.96. Match the reported number to its role.',
    options: ['Point estimate', 'Standard error', 'Margin of error', 'Full interval width'],
    pairs: [
      {prompt: '$3.92', answer: 2},
      {prompt: '$80', answer: 0},
      {prompt: '$7.84', answer: 3},
      {prompt: '$2', answer: 1}
    ],
    explanation: 'SE = 20/√100 = $2. Margin = 1.96 × 2 = $3.92. The interval is $76.08 to $83.92, so its full width is $7.84. The point estimate is $80. Do not confuse a one-sided distance from the center with the full width.'
  },
  {
    id: 'c5-threshold-claim', file: 'estimation.html', afterTopic: 8,
    title: 'Turn an interval into an honest recommendation', kind: 'choice',
    prompt: 'A valid 95% two-sided t interval for mean packing time is 20 to 26 minutes. Management will promise customers that the population mean is below 25 minutes. Which recommendation is justified by this interval?',
    options: [
      {text: 'Make the promise because the interval midpoint is below 25.', feedback: 'The estimate may be below 25, but values above 25 remain inside the reported interval. A point estimate alone does not resolve uncertainty.'},
      {text: 'Say that 95% of individual orders take between 20 and 26 minutes.', feedback: 'This interval targets a population mean. It is not an interval containing 95% of individual packing times.'},
      {text: 'Do not use this interval alone to justify the promise: it still permits population means above 25.', feedback: 'Correct. The upper endpoint of 26 shows that the reported two-sided interval has not confined plausible mean values below the promised threshold.'}
    ], answer: 2,
    explanation: 'An interval reports uncertainty about the mean, not a guarantee about individual orders. This 95% two-sided interval alone does not establish the proposed claim. A preplanned one-sided analysis has a different cutoff and requires the underlying data or standard error and degrees of freedom; do not silently reinterpret a two-sided interval as that analysis.'
  },
  {
    id: 'c5-plan-completions', file: 'estimation.html', afterTopic: 10,
    title: 'Budget completed observations, not just invitations', kind: 'number',
    prompt: 'Explore the sample-size planning lab. Then solve this fixed design: use planning population SD $10, a 95% z critical value of exactly 1.96 and desired margin no larger than $2 for an independent sample mean. What is the smallest whole number of completed observations required under this planning model?',
    link: {href: '#plan-lab', label: 'Explore the sample-size planning lab'},
    answer: 97, tolerance: 0, unit: 'completed observations',
    hint: 'Solve 1.96 × 10 / √n ≤ 2, then round upward. Requested precision must still hold after rounding.',
    explanation: 'n ≥ (1.96 × 10 / 2)² = 9.8² = 96.04, so use 97 completed observations. At n = 96 the margin is about $2.0004, just above the target; at 97 it is about $1.9901. Invitations are not completions. This calculation assumes the planning SD and independent-sampling model are appropriate; it does not correct nonresponse bias.'
  },
  {
    id: 'c6-error-consequences', file: 'hypothesis-testing.html', afterTopic: 2,
    title: 'Connect decisions to their real consequences', kind: 'match',
    prompt: 'A quality team tests H₀: the defect rate is at most 2% against H₁: it exceeds 2%. Rejection triggers an investigation. Match each outcome. The stated true rates are hypothetical population facts, not estimates.',
    options: ['Type I error', 'Type II error', 'Correct rejection', 'Correct non-rejection'],
    pairs: [
      {prompt: 'True rate 1%; the test triggers an investigation.', answer: 0},
      {prompt: 'True rate 4%; the test does not trigger an investigation.', answer: 1},
      {prompt: 'True rate 4%; the test triggers an investigation.', answer: 2},
      {prompt: 'True rate 1%; the test does not trigger an investigation.', answer: 3}
    ],
    explanation: 'An error label requires both the decision and the unknown truth. Type I rejects a true null; Type II fails to reject a false null. Power at a specified rate such as 4% is the probability of correct rejection at that rate. The significance level does not give the probability that a particular triggered investigation is a false alarm.'
  },
  {
    id: 'c6-lock-the-direction', file: 'hypothesis-testing.html', afterTopic: 6,
    title: 'Keep the question fixed when the data surprise you', kind: 'choice',
    prompt: 'Before collecting data, a team specifies H₁: mean recovery time is below 40 minutes. The resulting estimate is above 40, and software reports a small right-tail p-value. What should the team do?',
    options: [
      {text: 'Use the right-tail result as evidence for the planned improvement.', feedback: 'A right-tail result concerns longer times, the opposite of the planned improvement. A small probability does not erase its direction.'},
      {text: 'Report the planned left-tail result and flag the unexpected increase as a separate finding needing appropriate follow-up.', feedback: 'Correct. Preserve the planned test, report the estimated change and uncertainty, and distinguish an unexpected finding from a preplanned confirmatory claim.'},
      {text: 'Switch to whichever tail is smaller and keep the original false-alarm claim.', feedback: 'Choosing the tail after seeing the sign changes the testing procedure. Its error rate is not the stated one-sided rate.'}
    ], answer: 1,
    explanation: 'A positive standardized statistic cannot support the stated left-sided improvement. The team should not hide a possible deterioration, but must label it honestly and use a valid two-sided or follow-up procedure where appropriate rather than retroactively claiming a preselected direction.'
  },
  {
    id: 'c6-paired-statistic', file: 'hypothesis-testing.html', afterTopic: 11,
    title: 'Build the statistic from the unit of change', kind: 'number',
    prompt: 'Explore the paired-means lab in this topic. Then use a separate fixed study of 25 employees: define each difference as before minus after. The mean difference is 3 minutes and the sample SD of differences is 6 minutes. Assume independent employees and normal differences. For H₀: mean difference = 0, calculate the paired t-statistic.',
    link: {href: '#paired-means', label: 'Explore the paired-means topic and lab'},
    answer: 2.5, tolerance: 0.01, unit: 'standard errors (unitless t)',
    hint: 'There are 25 independent differences, not 50 independent changes. First calculate 6/√25.',
    explanation: 'Estimated SE = 6/√25 = 1.2 minutes. Therefore t = (3 − 0)/1.2 = 2.5 with 25 − 1 = 24 degrees of freedom. Positive differences indicate shorter times after the change because subtraction is before minus after. The statistic is unitless; a decision additionally requires the predeclared alternative and significance level.'
  },
  {
    id: 'c6-many-metrics', file: 'hypothesis-testing.html', afterTopic: 14,
    title: 'Spot the hidden extra chances to find significance', kind: 'choice',
    prompt: 'A team tests 20 unrelated business metrics at 5% each, reports only the smallest p-value of .03, and claims a confirmed benefit. No primary outcome or multiplicity plan was specified. What is the strongest review comment?',
    options: [
      {text: 'A p-value below .05 automatically confirms a benefit regardless of how many tests were searched.', feedback: 'Searching many tests creates extra opportunities for a small p-value. A single-test threshold does not control the whole search’s false-alarm risk.'},
      {text: 'The team must have made exactly one false discovery because 20 × .05 = 1.', feedback: 'One is an expected count when all 20 nulls are true and tests have size .05, not a guaranteed count in this study.'},
      {text: 'Disclose all tested outcomes, assess multiplicity and effect sizes, and treat the selected result cautiously rather than as a standalone confirmation.', feedback: 'Correct. The selection process matters. Report the search and use an appropriate multiplicity strategy or independent confirmation.'}
    ], answer: 2,
    explanation: 'For illustration only, if all 20 nulls are true and the tests are independent with false-rejection probability .05, the chance of at least one false rejection is 1 − .95²⁰ ≈ 64.2%. Real metrics may be dependent, so this percentage is not automatically the study’s actual risk. A useful effect estimate, uncertainty and a transparent analysis plan matter alongside p-values.'
  }
];

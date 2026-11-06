'use strict';
// Fixed-scenario practice: answers do not depend on current laboratory controls.
module.exports = [
  {
    id: 'c1-measurements', file: 'index.html', afterTopic: 1,
    title: 'Match the variable to its meaning', kind: 'match',
    prompt: 'A shop records four fields for each order. Match each field to its data type. A numerical label is not automatically a measurement.',
    options: ['Continuous measurement', 'Nominal category', 'Discrete count', 'Ordinal category'],
    pairs: [
      {prompt: 'Payment code: 1 = cash, 2 = card, 3 = voucher', answer: 1},
      {prompt: 'Number of items in the order', answer: 2},
      {prompt: 'Satisfaction: poor, fair, good, excellent', answer: 3},
      {prompt: 'Parcel mass in kilograms, measured to the nearest gram', answer: 0}
    ],
    explanation: 'Payment codes name categories, so their numerical average has no useful meaning. Item counts have whole-number outcomes. Satisfaction has an order but no established equal spacing. Mass is modeled as a continuous measurement even when the instrument rounds it.'
  },
  {
    id: 'c1-weighted-orders', file: 'index.html', afterTopic: 2,
    title: 'Combine two branches fairly', kind: 'number',
    prompt: 'Explore the order lab and notice that its mean divides total revenue by the number of orders. Now use this fixed scenario: Branch A has 8 orders averaging $30 each; Branch B has 2 orders averaging $80 each. What is the mean value across all 10 orders? Enter dollars per order.',
    link: {href: '#lab', label: 'Explore the order lab'},
    answer: 40, tolerance: 0.01, unit: 'dollars per order',
    hint: 'Recover each branch’s total revenue first. Divide combined revenue by combined order count, not by two branches.',
    explanation: 'A contributes 8 × $30 = $240; B contributes 2 × $80 = $160. Combined mean = ($240 + $160)/(8 + 2) = $40 per order. The unweighted mean $55 treats a two-order branch like an eight-order branch and answers a different question.'
  },
  {
    id: 'c1-change-units', file: 'index.html', afterTopic: 3,
    title: 'Separate a unit change from new variation', kind: 'choice',
    prompt: 'The same parcel weights are recorded first in kilograms and then in grams. Their mean is 2 kg and their standard deviation is 0.3 kg. Which report is correct after the conversion?',
    options: [
      {text: 'Mean 2,000 g; SD 300 g; coefficient of variation still 15%.', feedback: 'Correct. Both mean and SD scale by 1,000; their ratio stays 0.15.'},
      {text: 'Mean 2,000 g; SD 300,000 g; coefficient of variation is larger.', feedback: 'You applied the squared scale factor to SD. Variance scales by 1,000 squared; SD scales by 1,000.'},
      {text: 'Mean 2,000 g; SD 0.3 g; the weights are now more consistent.', feedback: 'Changing the label does not change the parcels. Every deviation, and hence the SD, must also be converted to grams.'}
    ], answer: 0,
    explanation: 'Multiplication by a positive constant c multiplies the mean and SD by c and variance by c². CV = 100 × 0.3/2 = 15%, unchanged at 100 × 300/2,000. These positive ratio-scale measurements support a meaningful CV.'
  },
  {
    id: 'c1-preserve-pairs', file: 'index.html', afterTopic: 5,
    title: 'Protect the relationship before calculating', kind: 'choice',
    prompt: 'Three stores have (advertising spend, sales) pairs (1, 9), (2, 3), (3, 6), in thousands of dollars. An analyst sorts each column separately, producing (1, 3), (2, 6), (3, 9). What should you do?',
    options: [
      {text: 'Use the sorted columns because both sets of individual values are unchanged.', feedback: 'The individual summaries are unchanged, but the links between stores have been destroyed. Correlation depends on those links.'},
      {text: 'Restore each store’s original pair before measuring association.', feedback: 'Correct. Sorting entire rows is safe; sorting the two columns independently invents new pairs.'},
      {text: 'Average the correlation before sorting and after sorting.', feedback: 'The second correlation describes invented records. Averaging it with the valid one does not repair the loss of pairing.'}
    ], answer: 1,
    explanation: 'Original means are 2 and 6. The cross-products of deviations sum to −3, giving correlation −3/√(2 × 18) = −0.5. Independently sorted columns produce correlation +1. A data-processing choice has manufactured the apparent relationship.'
  },
  {
    id: 'c2-language-events', file: 'probability.html', afterTopic: 2,
    title: 'Translate a shipping request into events', kind: 'match',
    prompt: 'Let A mean “an order uses express shipping” and B mean “an order is late.” Match each request to its event. “Or” includes both unless explicitly excluded.',
    options: ['A and B', 'A or B (or both)', 'A and not B', 'Neither A nor B'],
    pairs: [
      {prompt: 'Express orders that arrived on time', answer: 2},
      {prompt: 'Late express orders', answer: 0},
      {prompt: 'Orders that are express, late, or both', answer: 1},
      {prompt: 'On-time orders using non-express shipping', answer: 3}
    ],
    explanation: '“And” is intersection; inclusive “or” is union. Express and on time is A ∩ Bᶜ. Neither express nor late is Aᶜ ∩ Bᶜ, equivalently the complement of A ∪ B. Specify the event before selecting a denominator or formula.'
  },
  {
    id: 'c2-mix-rates', file: 'probability.html', afterTopic: 5,
    title: 'Audit a tempting average', kind: 'choice',
    prompt: 'A retailer sends 80% of parcels by Route A, where 5% arrive late, and 20% by Route B, where 25% arrive late. Routes cover all parcels and do not overlap. An analyst reports an overall late rate of 15%, the average of 5% and 25%. Which response is justified?',
    options: [
      {text: 'Agree: two routes deserve equal weight.', feedback: 'Equal weights would describe equal route volumes. Here four times as many parcels use Route A.'},
      {text: 'Replace it with 30%, because lateness on either route counts.', feedback: 'Adding conditional rates ignores how often each route is used. Multiply each rate by its route’s share before adding.'},
      {text: 'Replace it with 9%: weight each late rate by the route’s parcel share.', feedback: 'Correct. For 100 expected parcels, 80 × 0.05 = 4 and 20 × 0.25 = 5 are late; together that is 9.'}
    ], answer: 2,
    explanation: 'Total probability gives P(late) = 0.80 × 0.05 + 0.20 × 0.25 = 0.09. The unweighted 15% assumes a 50:50 route mix. A change in route mix can change the overall rate even when both route-specific rates stay fixed.'
  },
  {
    id: 'c2-negative-alert', file: 'probability.html', afterTopic: 7,
    title: 'What can a missing alert tell you?', kind: 'number',
    prompt: 'Explore the Bayes lab’s no-alert branch. Then solve this fixed case: among 1,000 expected orders, 10% have an issue. Sensitivity is 80% and the false-positive rate is 10%. What percentage of orders with NO alert actually have an issue? Enter a percentage, not a decimal probability.',
    link: {href: '#bayes-lab', label: 'Explore the Bayes lab'},
    answer: 100 * 20 / 830, tolerance: 0.01, unit: 'percent',
    hint: 'Count missed issues and correctly unflagged ordinary orders. Both belong in the no-alert denominator.',
    explanation: 'There are 100 issues and 900 ordinary orders. Missed issues = 100 × 0.20 = 20. Correctly unflagged ordinary orders = 900 × 0.90 = 810. Thus P(issue | no alert) = 20/(20 + 810) = 20/830 ≈ 0.024096, or 2.41%. The 20% false-negative rate conditions on issues, not on no-alert orders.'
  },
  {
    id: 'c2-distinct-roles', file: 'probability.html', afterTopic: 9,
    title: 'Does swapping people create a new outcome?', kind: 'choice',
    prompt: 'A team has six eligible people. Choose one shift leader and a different person as safety checker. Each person can hold only one role. How many assignments are possible?',
    options: [
      {text: '15 assignments', feedback: 'That counts unordered pairs. A leader/checker swap creates a different assignment, so each pair has two role allocations.'},
      {text: '30 assignments', feedback: 'Correct. There are six choices for leader and five remaining choices for checker: 6 × 5.'},
      {text: '36 assignments', feedback: 'This allows the same person to occupy both roles. The second choice has only five eligible people after the first is chosen.'}
    ], answer: 1,
    explanation: 'Distinct roles make order matter; the no-repeat condition removes the first person from the second choice. The count is 6P2 = 6 × 5 = 30, rather than 6C2 = 15 or 6² = 36.'
  },
  {
    id: 'c3-revenue-transform', file: 'random-variables.html', afterTopic: 3,
    title: 'Price a random number of jobs', kind: 'number',
    prompt: 'A service center completes X jobs in an hour: P(X = 0) = 0.20, P(X = 1) = 0.50, and P(X = 2) = 0.30. Each job earns $40 and the fixed hourly operating cost is $25. What is expected hourly profit? Enter dollars per hour.',
    answer: 19, tolerance: 0.01, unit: 'dollars per hour',
    hint: 'Find E(X) by weighting each job count by its probability, then apply profit = 40X − 25.',
    explanation: 'E(X) = 0 × 0.20 + 1 × 0.50 + 2 × 0.30 = 1.1 jobs. Expected profit = 40 × 1.1 − 25 = $19 per hour. Equivalently, profits −$25, $15 and $55 have weighted average −5 + 7.5 + 16.5 = $19. No single hour need realize exactly $19.'
  },
  {
    id: 'c3-capacity-tail', file: 'random-variables.html', afterTopic: 5,
    title: 'Turn capacity into the right tail', kind: 'choice',
    prompt: 'Explore the count lab’s binomial model and compare its exact and cumulative probabilities. Now use a fixed scenario: four independent customers each request a demonstration with probability 0.5. One employee can handle at most two demonstrations. Which calculation gives the chance that demand exceeds capacity?',
    link: {href: '#count-lab', label: 'Explore the count lab'},
    options: [
      {text: 'P(X ≥ 2) = 11/16, because two is the capacity.', feedback: 'Two requests can still be handled. Exceeding capacity requires three or four, so including exactly two overstates overload.'},
      {text: 'P(X = 3) = 4/16, because three is the first overload count.', feedback: 'Three is an overload, but four is also possible. Include every count that exceeds two.'},
      {text: 'P(X = 3) + P(X = 4) = 5/16, or 31.25%.', feedback: 'Correct. There are four equally likely patterns with three requests and one with four, out of sixteen patterns.'}
    ], answer: 2,
    explanation: 'X has a binomial distribution with n = 4 and p = 0.5. P(X > 2) = [C(4,3) + C(4,4)] × (0.5)^4 = 5/16 = 0.3125. The same result is 1 − F(2). Mean demand is 2, but this does not mean capacity is always sufficient.'
  },
  {
    id: 'c3-model-assumptions', file: 'random-variables.html', afterTopic: 8,
    title: 'Match the mechanism, not the vocabulary', kind: 'match',
    prompt: 'Match each explicitly stated mechanism to its distribution. These are modeling assumptions to check in practice, not guarantees supplied by a variable’s name.',
    options: ['Exponential waiting time', 'Binomial count', 'Continuous uniform measurement', 'Poisson count'],
    pairs: [
      {prompt: 'Count responses among 20 independent invitations, each with the same response probability.', answer: 1},
      {prompt: 'Count arrivals in one hour from a constant-rate Poisson process.', answer: 3},
      {prompt: 'Wait for the next arrival in that constant-rate Poisson process.', answer: 0},
      {prompt: 'A simulated dispatch time gives equal density to every instant between 2 pm and 3 pm.', answer: 2}
    ],
    explanation: 'A fixed number of independent binary trials gives a binomial count. A constant-rate Poisson process gives Poisson counts over fixed intervals and exponential waits between arrivals. Equal density on a bounded time interval gives a continuous uniform model. Counts and waits from the same process use different distributions.'
  },
  {
    id: 'c3-sd-not-variance', file: 'random-variables.html', afterTopic: 9,
    title: 'Audit a tighter filling process', kind: 'choice',
    prompt: 'Two processes produce normally distributed fill volumes, both with mean 100 mL. Old-process SD is 4 mL; new-process SD is 2 mL. The acceptable interval stays 96–104 mL. What changes under these models?',
    options: [
      {text: 'The acceptable share rises from about 68.27% to 95.45%.', feedback: 'Correct. The same fixed interval changes from one SD to two SDs on either side of the mean.'},
      {text: 'The acceptable share stays 68.27% because the mean is unchanged.', feedback: 'The mean fixes the center, not the spread. A smaller SD puts more probability inside this fixed interval.'},
      {text: 'The acceptable share becomes exactly 100% because the new SD is only 2 mL.', feedback: 'A normal model has tails extending beyond any finite interval. Two SDs covers about 95.45%, not all outcomes.'}
    ], answer: 0,
    explanation: 'Old standardized limits are (96 − 100)/4 = −1 and +1. New limits are (96 − 100)/2 = −2 and +2. Normal CDF differences give approximately 0.6827 and 0.9545. Unlike widening a specification, this scenario changes the assumed process spread while holding the specification fixed.'
  }
];

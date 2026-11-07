'use strict';
// Static essentials: every concept and worked calculation is visible without JavaScript.
const cores = {
 pairs: ['Keep each outcome with its predictor', 'One row is one market-week, not two unrelated measurements.', [
  'The eight original pairs are (1,11), (2,12), (3,16), (4,15), (5,19), (6,20), (7,23), (8,24).',
  'x measures advertising in $100 units; y measures weekly orders in tens. Thus (3,16) means $300 and 160 orders in the same market-week.',
  'There are n = 8 paired observations. This synthetic teaching model treats them as independent; repeated weeks from the same market may need a dependence model.'
 ], 'May we sort the two columns separately?', 'No. That changes which spend goes with which outcome and therefore changes the relationship.'],
 line: ['Translate a line into business units', 'The fitted line describes a conditional mean, not a promise for each week.', [
  'Write ŷ = a + bx. Here a = 8.821429 and b = 1.928571, so ŷ = 8.821429 + 1.928571x in tens of orders.',
  'At x = 4.5 ($450), ŷ = 8.821429 + 1.928571 × 4.5 = 17.5, or 175 orders.',
  'Increasing x by 1 changes the fitted mean by 1.928571 tens: about 19.29 orders per additional $100. The observational line alone does not establish a causal gain.'
 ], 'Does ŷ = 17.5 mean a week must have exactly 175 orders?', 'No. It is an estimated mean for comparable weeks at that spend. Individual weeks vary around it.'],
 fit: ['Choose the line by squared vertical misses', 'Ordinary least squares minimizes departures in the response direction.', [
  'For any proposed line, residual eᵢ = yᵢ − (a + bxᵢ). Square each vertical miss and add: SSE(a,b) = Σ[yᵢ − (a + bxᵢ)]².',
  'Try a = 9, b = 2. The first three residuals are 0, −1, +1; all eight are 0, −1, +1, −2, 0, −1, 0, −1, giving SSE = 8.',
  'The fitted line reduces SSE to 81/14 ≈ 5.785714. Squaring prevents positive and negative misses from cancelling and penalizes larger misses more.'
 ], 'Does OLS minimize horizontal or perpendicular distances?', 'Neither. Regressing y on x minimizes squared vertical y residuals; reversing the variables solves a different problem.'],
 center: ['Build the two centered sums', 'Subtract the sample means before measuring spread and co-movement.', [
  'Σx = 36 and Σy = 140, so x̄ = 36/8 = 4.5 and ȳ = 140/8 = 17.5.',
  'The x deviations are −3.5, −2.5, −1.5, −0.5, 0.5, 1.5, 2.5, 3.5. Sxx = 2(12.25 + 6.25 + 2.25 + 0.25) = 42.',
  'The y deviations are −6.5, −5.5, −1.5, −2.5, 1.5, 2.5, 5.5, 6.5. Sxy = 22.75 + 13.75 + 2.25 + 1.25 + 0.75 + 3.75 + 13.75 + 22.75 = 81.'
 ], 'Why must Sxy use the original row pairing?', 'Each term multiplies the x and y deviations from the same market-week. Re-pairing the rows changes those products.'],
 coefficients: ['Solve the two least-squares balances', 'With an intercept and Sxx > 0, the fitted line is the unique least-squares minimum.', [
  'The normal equations require Σeᵢ = 0 and Σxᵢeᵢ = 0. The first gives a = ȳ − bx̄; the second then gives bSxx = Sxy.',
  'Therefore b = 81/42 = 27/14 ≈ 1.928571 and a = 17.5 − (27/14)4.5 = 247/28 ≈ 8.821429. The line passes through (4.5,17.5).',
  'For changes δa and δb from this fit, SSE increases by 8(δa + 4.5δb)² + 42δb². This is positive unless both changes are zero, proving the unique minimum.'
 ], 'Do zero residual balances prove the population model is correct?', 'No. These are algebraic properties of the fitted OLS line, not evidence that the underlying mean is linear or the errors independent.'],
 units: ['Change units without changing predictions', 'A coefficient’s numerical size depends on the units used to measure its predictor.', [
  'Let x* = 2x, so spend is now measured in $50 rather than $100 units. Then b* = b/2 = 27/28 ≈ 0.964286 and a* = 247/28.',
  'At $450, x* = 9. The prediction is 247/28 + (27/28)9 = 17.5 tens, exactly the original forecast.',
  'Fitted values and residuals stay fixed. The slope standard error also halves, leaving the zero-slope t statistic, F and R² unchanged.'
 ], 'Did the business relationship weaken because the slope halved?', 'No. Only its measurement scale changed: the printed coefficient now measures tens of orders per $50 rather than per $100.'],
 assumptions: ['Separate fitting from statistical guarantees', 'OLS arithmetic needs predictor variation; its inferential claims need a model.', [
  'The population model is yᵢ = α + βxᵢ + εᵢ. Here α is the unknown population intercept, β is the unknown population slope, and εᵢ is a week’s departure from its population mean. The fitted a and b estimate α and β. Here α names the intercept, not a test’s significance level.',
  'E(yᵢ | x) means the average response at the stated predictor values. The model assumes this mean is α + βxᵢ, so E(εᵢ | x) = 0. Common error variance σ² means the same population error spread at each spend; Step 9 estimates it with s². Conditional on x means treating the observed spend values as fixed when describing repeated samples.',
  'Write b = Σwᵢyᵢ with wᵢ = (xᵢ − 4.5)/42: a weighted sum of outcomes, with weights determined only by the predictors. Here Σwᵢ = 0, Σwᵢxᵢ = 42/42 = 1, and Σwᵢ² = 42/42² = 1/42.',
  'If E(yᵢ | x) = α + βxᵢ, then E(b | x) = α × 0 + β × 1 = β. This is unbiasedness: across repeated samples at these x values, b averages to β. With uncorrelated, equal-variance errors, Var(b | x) = σ²/42; Gauss–Markov makes OLS best among linear unbiased estimators. “Best” means smallest sampling variance within that class, not the best forecast among all possible methods. “Linear” here means linear in the observed outcomes, as the weighted sum shows.',
  'Exact small-sample t/F inference additionally uses independent normal errors with common variance and the correct linear mean, conditional on x. Normality is not needed just to fit the line or for the Gauss–Markov result.'
 ], 'Does a good-looking fitted line establish these conditions?', 'No. Study design and diagnostics must assess the mean, dependence and spread; eight observations give limited diagnostic power.'],
 residuals: ['Read the sign before diagnosing the pattern', 'A residual is an observed departure from the fitted line, not the unobserved population error.', [
  'At x = 3, ŷ = 409/28 ≈ 14.607143 and e = 16 − 409/28 = 39/28 ≈ +1.392857: about 13.93 orders above the fit.',
  'At x = 4, ŷ = 463/28 ≈ 16.535714 and e = 15 − 463/28 = −43/28 ≈ −1.535714: about 15.36 orders below the fit.',
  'Plot residuals against x or fitted values for curvature and changing spread, and in time order for dependence. A normal quantile plot helps assess the normal-error inference assumption.'
 ], 'Are residuals independent just because the model errors are independent?', 'No. Fitting the line imposes residual balances and induces dependence among residuals. The population errors and fitted residuals are different objects.'],
 noise: ['Estimate noise after fitting two coefficients', 'Two fitted parameters use two residual degrees of freedom.', [
  'The residuals are (7, −19, 39, −43, 15, −11, 19, −7)/28. Their squared sum is 4536/784 = 81/14 ≈ 5.785714 tens-of-orders squared.',
  'Residual df = n − 2 = 8 − 2 = 6. Thus s² = SSE/6 = 27/28 ≈ 0.964286, not SSE/8.',
  'The residual standard error is s = √(27/28) ≈ 0.981981 tens, or about 9.82 orders. It estimates error spread under the model, not the uncertainty of every forecast target.'
 ], 'Why not divide by eight?', 'The intercept and slope were estimated from these same eight observations. Dividing by six corrects for those two fitted parameters under the classical model.'],
 inference: ['Estimate and test the population slope', 'The estimate, standard error, interval and test describe one target: β.', [
  'b = 27/14 ≈ 1.928571 and SE(b) = s/√Sxx = √[(27/28)/42] ≈ 0.151523, in tens of orders per $100.',
  'For H₀: β = 0, t = b/SE(b) ≈ 12.727922 with 6 df. The two-sided p-value is 2P(t₆ ≥ |12.727922|) ≈ 0.00001443.',
  'The 95% interval is b ± 2.446912 SE(b) = [1.557808, 2.299335]. Under the classical model it excludes zero, matching the two-sided 5% test.'
 ], 'Does that small p-value establish a causal advertising effect?', 'No. It is evidence against a zero population slope within the specified model, not evidence of random assignment or protection against confounding.'],
 intercept: ['Ask what zero spend means', 'An intercept can be estimated precisely yet refer to an unobserved business setting.', [
  'a = 247/28 ≈ 8.821429. SE(a) = s√(1/8 + 4.5²/42) ≈ 0.765153; the 95% interval is [6.949167, 10.693691] tens of orders.',
  'For H₀: α = 0, t = 8.821429/0.765153 ≈ 11.528973 with 6 df and two-sided p ≈ 0.00002560. This tests the mean at x = 0, outside the observed x range 1–8.',
  'Center instead at z = x − 4.5: ŷ = 17.5 + (27/14)z. The new intercept is the mean at $450, with SE = s/√8 ≈ 0.347183; predictions and slope are unchanged.'
 ], 'Does centering preserve the intercept’s zero-null test?', 'No. It changes the intercept’s target from the mean at $0 to the mean at $450. It preserves the fitted line, not the meaning of that null hypothesis.'],
 partition: ['Split total variation around the mean', 'With an OLS intercept, fitted departures and residuals are orthogonal.', [
  'Total variation is SST = Σ(yᵢ − 17.5)² = 162. Fitted variation is SSR = b²Sxx = (27/14)² × 42 = 2187/14 ≈ 156.214286.',
  'Residual variation is SSE = 81/14 ≈ 5.785714. Therefore SST = SSR + SSE = 2187/14 + 81/14 = 162.',
  'The cross-term cancels because Σeᵢ = Σxᵢeᵢ = 0. This is a sample algebra identity for this fitted model, not an assumption of normal errors.'
 ], 'Must the two squared pieces add for one observation?', 'No. The cross-term vanishes only after summing the complete sample; an individual observation can have a nonzero cross-term.'],
 fitshare: ['Read R² as a sample fit share', 'R² compares this fitted line with the sample-mean-only prediction.', [
  'R² = SSR/SST = (2187/14)/162 = 27/28 ≈ 0.964286. Equivalently, 1 − SSE/SST = 1 − 1/28.',
  'About 96.43% of the sample squared variation around ȳ is accounted for by the fitted linear relationship. Here r = +√R² ≈ 0.981981 because the slope is positive.',
  'This fit share does not say advertising causes 96.43% of orders, nor that a future forecast is 96.43% accurate. Check the target, residuals and out-of-sample performance.'
 ], 'Can low R² rule out every relationship?', 'No. A strong curved relationship may have poor linear fit. R² describes the chosen model and sample.'],
 tests: ['Connect the ANOVA ratio to the slope test', 'In simple regression with an intercept, the zero-slope F test and two-sided t test agree.', [
  'Regression df = 1 and error df = 6. MSR = (2187/14)/1 ≈ 156.214286 and MSE = (81/14)/6 = 27/28 ≈ 0.964286.',
  'F = MSR/MSE = 162 = (12.727922…)² = t², with (1,6) df. Its right-tail p ≈ 0.00001443 equals the two-sided slope-test p.',
  'Squaring removes the slope’s sign, so F detects either direction. It does not directly equal a one-sided t-test p-value; for the prespecified positive alternative here that p is about 0.000007215.'
 ], 'Is the regression F test an additional independent piece of evidence?', 'No. With one slope it is the same zero-slope evidence expressed as a squared t statistic.'],
 mean: ['Put an interval around average demand', 'A confidence interval for the conditional mean measures uncertainty in the fitted line.', [
  'At x₀ = 4.5, ŷ₀ = 17.5. SE(mean) = s√[1/8 + (x₀ − 4.5)²/42] = s/√8 ≈ 0.347183 tens.',
  'Using t₆,₀.₉₇₅ = 2.446912, the 95% interval is 17.5 ± 2.446912 × 0.347183 = [16.650475, 18.349525], about 166.50–183.50 orders.',
  'At x₀ = 8, ŷ₀ = 24.25 and SE(mean) ≈ 0.633866, giving [22.698987, 25.801013]. The mean is less precisely estimated farther from x̄.'
 ], 'Should we add intercept and slope variances and ignore their covariance?', 'No. Their covariance matters. The centered expression s²[1/n + (x₀ − x̄)²/Sxx] already incorporates it correctly.'],
 individual: ['Add fresh noise for one future week', 'A new observation varies around its population mean as well as around our estimated mean.', [
  'For one new independent comparable week at x₀ = 4.5, SE(prediction) = s√[1 + 1/8 + 0²/42] ≈ 1.041548 tens.',
  'The 95% prediction interval is 17.5 ± 2.446912 × 1.041548 = [14.951425, 20.048575], about 149.51–200.49 orders.',
  'The extra 1 inside the square root represents the new week’s error variance. Even with a precisely estimated mean, an individual week retains this fresh noise.'
 ], 'Can the narrower mean interval be used for next week’s staffing demand?', 'Not as an interval for that week’s outcome. Use the prediction interval under the model, then account for the costs of insufficient or excess capacity.'],
 challenge: ['Check range, leverage and residual separately', 'A valid calculation does not ensure that a fitted line transfers to a new setting.', [
  'The observed spend range is x = 1–8 ($100–$800). At x₀ = 12 ($1,200), the line predicts 247/28 + (27/14)12 = 31.964286 tens, but this is extrapolation.',
  'For an observed point, leverage is hᵢ = 1/8 + (xᵢ − 4.5)²/42. At x = 8 it is 5/12 ≈ 0.416667; at x = 4 it is 11/84 ≈ 0.130952.',
  'Yet the residual at x = 8 is only −0.25, while at x = 4 it is −43/28 ≈ −1.535714. Leverage measures predictor location; a large residual measures response departure. Influence depends on both.'
 ], 'Does a model interval at x = 12 protect against the line bending beyond x = 8?', 'No. It quantifies uncertainty assuming the model remains valid, not uncertainty about a structural change outside the observed range.'],
 decision: ['Match the evidence to the business decision', 'Use association for a cautious planning baseline, not an automatic spending recommendation.', [
  'The fitted association is 10 × 27/14 ≈ 19.29 orders per extra $100. Its precision does not establish causal lift or profit.',
  'At $450, the estimated mean is 175 orders: mean interval about 166.50–183.50, individual-week prediction interval about 149.51–200.49. Choose the interval that matches the decision.',
  'For budgeting, assess contribution margin and seek a randomized or otherwise credible causal design. For capacity, assess service-risk costs, residual patterns and performance on new comparable weeks.'
 ], 'Should a significant positive slope alone trigger more advertising?', 'No. A spending decision needs evidence of causal return and its costs, while a staffing decision needs uncertainty for the actual future demand target.'],
 software: ['Audit the calculation before interpreting output', 'Keep the original pairing and reproduce the quantities in dependency order.', [
  'In Excel, keep x in A2:A9 and y in B2:B9. SLOPE(B2:B9,A2:A9) gives 27/14; INTERCEPT(B2:B9,A2:A9) gives 247/28. Check means 4.5 and 17.5, Sxx = 42 and Sxy = 81 first.',
  'Then compare coefficients, residuals, SSE = 81/14, df = 6, s² = 27/28 and SE(b) ≈ 0.151523. T.DIST.2T(12.727922061357855,6) and F.DIST.RT(162,1,6) both give about 0.00001443045.',
  'In Python, 2*scipy.stats.t.sf(abs(t),6) and scipy.stats.f.sf(162,1,6) compute the tails directly. Finally compare slope/intercept intervals and distinguish mean confidence from individual prediction intervals at the same x₀.'
 ], 'Why compute a survival function rather than subtract a rounded CDF from one?', 'A direct tail calculation avoids cancellation and rounding loss for small p-values. Use the observed statistic, not the critical value, to calculate the observed p-value.']
};
function render(key) {
 const c = cores[key];
 if (!c) throw Error('Unknown regression core ' + key);
 const [title, lead, steps, question, answer] = c;
 return `<aside class="c8-core" id="c8-core-${key}" aria-labelledby="c8-core-${key}-title"><h3 id="c8-core-${key}-title">${title}</h3><p>${lead}</p><ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol><details><summary>Check · ${question}</summary><p>${answer}</p></details></aside>`;
}
module.exports = {cores, render};

'use strict';
// Static essential calculations: the first reading does not require opening details.
const cores={
 orders:['Start with the measurement and its label','A process name alone is not a measurement. Keep every independent order attached to its process.',[
 'Process A has 18, 20, 22, 20 minutes: four orders, totaling 80 minutes.',
 'B totals 96 and C totals 108. There are 3 groups and 4 + 4 + 4 = 12 independent orders.',
 'The question concerns the three population mean times, not whether these twelve observed values are identical.'
 ],'Would copying every row double the independent sample size?','No. Copies add no independent orders or information.'],
 baseline:['Use a baseline that matches the target','An average order and an equally weighted average process need not answer the same question.',[
 'Original sample: A = 80/4 = 20, B = 96/4 = 24, C = 108/4 = 27 minutes. The grand sample mean is 284/12 = 23⅔ minutes.',
 'Separate unequal-count illustration: with counts 2, 4, 6 and those same means, the overall mean is (40 + 96 + 162)/12 = 24⅚, not (20 + 24 + 27)/3 = 23⅔.',
 'Use the count-weighted sample mean in the usual ANOVA sums of squares. A business forecast needs the intended future process mix.'
 ],'Did any process get slower in the unequal-count illustration?','No. Only the mix changed. Each process mean stayed fixed.'],
 split:['From one departure to three sums of squares','First split a deviation. Then square and sum complete groups; the identity is not true for one order’s squared pieces.',[
 'For the 18-minute order: 18 − 23⅔ = (18 − 20) + (20 − 23⅔), or −5⅔ = −2 − 3⅔ minutes.',
 'Within each group, the residuals are −2, 0, +2, 0. SSW = 3 × (4 + 0 + 4 + 0) = 24 min².',
 'Between groups: SSG = 4[(−11/3)² + (1/3)² + (10/3)²] = 296/3 = 98⅔ min². Total SST = 368/3 = 122⅔ = 98⅔ + 24.'
 ],'Why can the squared components add across the dataset?','Within deviations sum to zero in each complete group, so the cross-terms cancel. The derivation below shows this without any normality assumption.'],
 freedom:['Count constraints before estimating noise','A fitted mean makes the last deviation in its group predictable from the others. Degrees of freedom count the remaining independent directions.',[
 'Process A residuals −2, 0, +2 force the fourth to be 0. Four observations minus one fitted mean leave 3 residual df. Three groups leave 3 × 3 = 9, or n − c = 12 − 3.',
 'Three group means around one grand mean leave c − 1 = 2 between df. The total is 11 = 2 + 9.',
 'Divide each sum by its own df: MSW = 24/9 = 2⅔ min²; MSG = (98⅔)/2 = 49⅓ min². The total mean square, if wanted, is (122⅔)/11 = 368/33 min²; it is not the F denominator.'
 ],'Why not use 24/12 as the noise estimate?','It ignores the three means fitted from these observations. Under independent errors with common variance, 24/9 estimates that error variance without this downward bias.'],
 ratio:['Compare two estimates on the same scale','The numerator includes sampling noise too. Under equal population means, both mean squares estimate the same common error variance.',[
 'F = MSG/MSW = (148/3)/(8/3) = 18.5. The min² units cancel; F is not a processing time or a speed multiplier.',
 'Double every departure from its own group mean: the means and SSG stay fixed, while SSW becomes 4 × 24 = 96. Then F = (148/3)/(96/9) = 4.625.',
 'The same mean gaps are less persuasive with more noise. Compare the ratio with the F reference for numerator df 2 and denominator df 9.'
 ],'Is F = 1 the rejection threshold?','No. It is a scale comparison. The threshold depends on both df and the chosen significance level; the next step gives it.'],
 reference:['Distinguish the cutoff from the observed tail','For this exact reference, use independent normal errors within groups and a common population variance.',[
 'At α = .05, the upper-tail F(2,9) cutoff is 4.2565. The observed F = 18.5 exceeds it.',
 'The observed p-value is P(F(2,9) ≥ 18.5) ≈ .000648. The tail beyond 4.2565 is .05 by construction, not the observed p-value.',
 'Reject equal population means under the model. The upper tail detects separation in either direction because the mean deviations were squared.'
 ],'If one group becomes faster, must the test use the left tail?','No. A larger separation increases squared between-group variation regardless of its direction.'],
 report:['Keep the global claim within its scope','A global test answers whether all means are equal. It does not name the pairs that differ.',[
 'Report the pattern first: sample means are A 20, B 24 and C 27 minutes, with F(2,9) = 18.5 and p ≈ .000648.',
 'A sample effect-size summary is SSG/SST = (296/3)/(368/3) = 37/46 ≈ .8043. About 80.4% of the sample squared variation is associated with group differences.',
 'This is neither a causal fraction nor proof that A beats every competitor. Planned comparisons, precision, costs and study design answer the next business questions.'
 ],'Does rejecting equal means establish that all three means differ?','No. It establishes evidence that not all are equal, subject to the model.'],
 comparisons:['Turn a planned family into intervals','Treat the three planned differences as one family: B − A, C − A and C − B. We want all three intervals to contain their true population differences together in at least 95% of repeated samples. Three ordinary 95% intervals do not guarantee that joint coverage. Choose the family before seeing outcomes; this analysis does not require a significant global F first.',[
 'Each difference uses SE = √[(8/3)(1/4 + 1/4)] = √(4/3) ≈ 1.1547 minutes, with 9 error df.',
 'Bonferroni allows each interval a miss probability of .05/3. The chance that any of the three misses is at most their sum: 3 × (.05/3) = .05. This bound does not require independent comparisons.',
 'Split each interval’s miss probability between its two tails: .05/6 in each tail. Each interval therefore has 98⅓% confidence, making it wider than an ordinary 95% interval. t(9, 1 − .05/6) ≈ 2.9333 gives margin 2.9333 × 1.1547 ≈ 3.3871 minutes.',
 'B − A: 4 ± 3.3871 = [0.6129, 7.3871]. C − A: [3.6129, 10.3871]. C − B: [−0.3871, 6.3871]. The family has at least 95% repeated-sample simultaneous coverage under the normal common-variance model, even though comparisons share data.'
 ],'Does B − A establish a saving of at least 3 minutes?','No. Its lower endpoint is only about 0.61 minutes. Excluding zero is different from exceeding a useful business threshold; C − B crossing zero also does not establish equivalence.'],
 cells:['Cross the factors, then replicate','The second case has offers and day types. Each combination is a cell, not a separate factor.',[
 'Two offers × two day types = four cells: plain-weekday, plain-weekend, bundle-weekday and bundle-weekend.',
 'Three independent transactions per cell give 2 × 2 × 3 = 12 observations. Plain-weekday has $18, $20, $22 and cell mean $20.',
 'With only one observation per cell, four fitted cell means would use all four observations, leaving 4 − 4 = 0 residual df. Replication supplies a noise estimate.'
 ],'Are three repeated copies of one transaction three replications?','No. Replications must be independent experimental or sampling units for this model.'],
 averages:['Read combinations before averages','Start with the four choices a manager could actually make, then identify exactly what each marginal mean averages.',[
 'The cell means are [[20, 26], [24, 38]] dollars, with plain/bundle in rows and weekday/weekend in columns.',
 'Offer means: plain (20 + 26)/2 = 23; bundle (24 + 38)/2 = 31. Day means: weekday (20 + 24)/2 = 22; weekend (26 + 38)/2 = 32. Grand mean: (20 + 26 + 24 + 38)/4 = 27.',
 'The equal-day offer difference is 31 − 23 = $8. A separate planning mix with 75% weekend transactions gives .25 × $4 + .75 × $12 = $10; that changes the target, not the cell means.'
 ],'Can the equal-day $8 average be promised on weekdays?','No. The weekday sample difference is $4; the weekend difference is $12.'],
 additive:['Build a mean, not an individual observation','Main effects describe averages. The interaction corrects an additive prediction for a specific combination.',[
 'From grand mean $27, offer effects are 23 − 27 = −4 and 31 − 27 = +4. Day effects are −5 and +5.',
 'Bundle-weekend additive prediction: 27 + 4 + 5 = $36. Its actual sample cell mean is $38, so its interaction correction is +$2.',
 'The interaction matrix [[+2, −2], [−2, +2]] has zero row and column sums. An individual bundle-weekend value $40 then has residual 40 − 38 = $2, separate from the cell interaction.'
 ],'Is every extra dollar above the additive prediction unexplained noise?','No. The systematic cell correction is interaction; individual residuals are departures from the full cell mean.'],
 interaction:['Compare an effect across contexts','Nonparallel lines show changing sample effects. They need not cross; uncertainty still matters.',[
 'Original data: bundle gain is 24 − 20 = $4 on weekdays and 38 − 26 = $12 on weekends. Change in gain: 12 − 4 = $8.',
 'The parallel illustration has equal sample gains, so its interaction sum of squares is zero. That does not prove the population interaction is zero.',
 'The crossover illustration has gains +$12 and −$12: their average is $0, yet the gain changes by −$24. Averaging can conceal a large interaction.'
 ],'Does a zero marginal offer difference rule out a useful offer in one context?','No. Opposite conditional effects can cancel in the average. Read the cells and their uncertainty.'],
 pieces:['Separate patterns from within-cell noise','In this balanced design, cross-products between the offer, day, interaction and residual components sum to zero. This is what orthogonal means here: the four sums of squares add without leftover cross-terms, as in the earlier one-way split. Count how many observations share each fitted effect.',[
 'Each offer or day effect repeats 6 times: SSA = 6[(−4)² + 4²] = 192 and SSB = 6[(−5)² + 5²] = 300 dollars².',
 'Each interaction repeats 3 times: SSAB = 3[2² + (−2)² + (−2)² + 2²] = 48. Every cell contributes (−2)² + 0² + 2² = 8 residual dollars²; SSE = 4 × 8 = 32. Total: 192 + 300 + 48 + 32 = 572.',
 'The df are 1, 1, 1 and 4(3 − 1) = 8, totaling 11. The error mean square is MSE = 32/8 = 4 dollars²; the other mean squares are 192, 300 and 48. Here MSE estimates the common within-cell variance. It is not Class 5’s estimator mean squared error (variance + bias²). The F denominator is within-cell error, not interaction.'
 ],'Can the same decomposition be used unchanged with unequal or missing cells?','No. These simple orthogonal formulas require the balanced replicated design. An unbalanced model needs explicit hypotheses and weighting.'],
 contrast:['Put the changing gain on a noise scale','A difference of differences isolates whether the offer advantage changes by day. It is not the ordinary weekend increase.',[
 'Contrast = (38 − 26) − (24 − 20) = 12 − 4 = $8. Under no interaction in this two-by-two design, its population value is zero.',
 'Each cell mean has estimated variance MSE/3 = 4/3. Independent mean variances add even for subtraction: SE = √(4/3 + 4/3 + 4/3 + 4/3) = √(16/3) ≈ $2.3094.',
 't = 8/√(16/3) = √12 ≈ 3.4641, with 8 error df. Squaring gives interaction F(1,8) = 12. This identity uses one interaction contrast in this two-by-two design.'
 ],'If within-cell SD doubles with cell means fixed, what changes?','MSE quadruples to 16, SE doubles to about $4.6188, t halves and F falls to 3. The $8 contrast is unchanged, but its evidence is weaker.'],
 tests:['Name the null before reading its row','Use the balanced fixed-effects model with independent normal errors and a common within-cell variance.',[
 'Offer averages: F = 192/4 = 48, p ≈ .000121. Day averages: F = 300/4 = 75, p ≈ .0000246.',
 'Interaction: F = 48/4 = 12, p ≈ .008516. Each has (1,8) df and a nominal .05 cutoff near 5.3177.',
 'All three reject their own null at nominal 5%. Interpret interaction before making a universal offer claim. Three tests at 5% each are not a joint 5% familywise guarantee.'
 ],'Does the offer main-effect row claim a constant $8 gain on every day?','No. It tests the equal-weight marginal contrast; the interaction row asks whether conditional effects change.'],
 design:['Count independent units before trusting the table','An arithmetically valid table cannot repair dependence or a mismatched experimental design.',[
 'Twelve independent transactions across four cells leave 12 − 4 = 8 residual df in this balanced model.',
 'If repeated records are copies or repeated measurements of the same units, counting rows as independent inflates information. The 8-df calculation is then not justified by row count alone.',
 'Check assignment, residual patterns, normality within cells and similar error spread. Random assignment supports causal comparisons; observational grouping alone does not.'
 ],'Does a tidy ANOVA table verify all its assumptions?','No. The sampling and assignment history and residual diagnostics supply evidence the table cannot.'],
 decision:['Compare uncertainty with the decision threshold','Report the measured outcome and the conditions under which the result could support action.',[
 'For packing, the planned B − A interval is [0.6129, 7.3871] minutes: evidence of a time difference, but not a guaranteed saving of at least 3 minutes.',
 'For retail, the sample bundle gains are $4 on weekdays and $12 on weekends, with interaction p ≈ .008516. Use conditional comparisons rather than a universal $8 promise.',
 'Spending is not profit. Margin, implementation costs, order mix, uncertainty and causal design still matter before a rollout.'
 ],'Is the smallest p-value automatically the most profitable option?','No. A p-value assesses evidence under a model, not the size, cost or business value of a change.'],
 software:['Audit the table before trusting the output','Reproduce the structure and reference tail, not just a printed “significant” label.',[
 'One-way Excel: calculate group means, SSG = 98⅔, SSW = 24, df 2 and 9, then F = 18.5. F.DIST.RT(18.5,2,9) ≈ .000648158.',
 'Two-way with replication: four cells with 3 observations each. Check error df = 8, MSE = 4, and interaction F = 12. F.DIST.RT(12,1,8) ≈ .008516263.',
 'In Python, scipy.stats.f.sf(18.5,2,9) and scipy.stats.f.sf(12,1,8) reproduce those right tails. The full Excel instructions, datasets, code and checked output remain below.'
 ],'Why not evaluate the tail at the critical value instead?','That returns α, not the observed p-value. Use the statistic calculated from the data.']
};
function render(key){const c=cores[key];if(!c)throw Error('Unknown ANOVA core '+key);const [title,lead,steps,q,a]=c;return `<section class="c7-core" id="c7-core-${key}" aria-labelledby="c7-core-${key}-title"><h3 id="c7-core-${key}-title">${title}</h3><p>${lead}</p><ol>${steps.map(x=>`<li>${x}</li>`).join('')}</ol><details><summary>Check · ${q}</summary><p>${a}</p></details></section>`;}
module.exports={cores,render};

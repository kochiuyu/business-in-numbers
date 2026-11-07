# Business in Numbers

An interactive eight-class business statistics course: descriptive statistics, probability, random variables, sampling distributions, estimation, hypothesis testing, ANOVA, and regression.

Start with [the course introduction](https://kochiuyu.github.io/business-in-numbers/course-introduction.html), or [Class 1](https://kochiuyu.github.io/business-in-numbers/). Examples are synthetic teaching cases, not business forecasts.

## Privacy

Calculations, answers, and progress stay in the current browser page. The course has no accounts, analytics, or backend and does not persist learner answers or progress between sessions. Copy work you want to retain. GitHub Pages, as the hosting provider, may log request metadata such as IP addresses. Optional external links are subject to their destination's practices.

## Build and test

Use Node.js 22.12 or newer. Reading and using the course needs only a browser; Python is optional for learners who want to reproduce examples.

- Install build dependencies: `npm ci`
- Build the static course: `npm run build`
- Serve locally: `python3 -m http.server 8000 --directory dist`
- Run all checks: install Python 3.11 and `python3 -m pip install -r requirements-test.txt`, then `npm test`
- Check project-path compatibility only: `npm run test:paths`

The full suite uses NumPy, SciPy, and Matplotlib to reproduce examples and independently check numerical results. The build emits `dist/` plus an optional local, self-contained Class 1 file (`class1-standalone.html`, not committed). All runtime course assets, including math fonts, are bundled locally. Every generated HTML page loads JavaScript and CSS through content-fingerprinted filenames, so a returning browser can keep its cache while fetching the new release’s exact assets. `dist/asset-manifest.json` records the full SHA-256 digests. Canonical filenames remain for legacy links; the standalone Class 1 file remains entirely self-contained. A browser still needs refreshed HTML to discover a new release.

## Navigation

The shared header in `scripts/navigation.cjs` separates the eight-class course menu from in-page lesson shortcuts. It marks the current class and follows the section being read. All menu links and the native disclosure work without JavaScript; JavaScript adds Escape/outside-click dismissal, keyboard focus handling, and section highlighting.

Class 1 follows eight teaching steps: records, center, quartiles and boxplots, variance and standard deviation, skewness, kurtosis, relationships, and a manager briefing. The core calculation or action stays visible in every step; complete explanations remain available below it. Sequential links use `#class1-step-1` through `#class1-step-8`. The original `#case-part-*` links retain their subject destinations, so their numeric suffixes no longer describe the reading order.

Class 2 follows eleven teaching steps: outcomes and events, event operations and validity, conditioning, independence, weighted paths, Bayes, odds and a first update, repeated evidence, sequential choices, arrangements and selections, and a business decision. Each core calculation stays visible. Sequential links use `#class2-step-1` through `#class2-step-11`; original `#prob-step-*` links keep their subject destinations.

Class 3 follows fifteen focused steps: mapping, PMF, CDF, expectation, variance, joint probabilities, covariance, trials and draws, arrivals, density, waits, normal probabilities, normal cutoffs, inference families, and a capacity decision. Essential calculations remain visible; full explanations, proofs and all eleven distribution families remain available. Sequential links use `#class3-step-1` through `#class3-step-15`; original `#rv-step-*` and topic links keep their subjects.

Class 4 follows thirteen focused steps: sampling design, exact sampling distributions, unbiasedness, variance and SE, LLN, CLT, known-SD probabilities, proportion moments, integer events and continuity correction, estimated scale, Student t, diagnostics, and a business decision. Essential arithmetic stays visible; complete explanations and proofs remain available. Sequential links use `#class4-step-1` through `#class4-step-13`; original `#sampling-step-*` and topic links retain their subjects.

Class 5 follows fifteen focused steps: target, unbiasedness, efficiency, consistency, individual spread, mean SE, binary estimation, rate SE, mean interval, confidence interpretation, t interval, rate interval, mean planning, rate planning, and the business decision. Essential calculations stay visible; all original details and exercises remain. Sequential links use `#class5-step-1` through `#class5-step-15`; original `#estimation-step-*` and topic links retain their subjects.

Class 6 follows seventeen focused steps: claim, decision errors, power, statistic and cutoffs, p-value, known-SD z, estimated-SD t, test–interval matching, one rate, comparison design, pooled means, Welch means, paired means, two rates, variances, reporting, and software audit. Core calculations stay visible; all original explanations and proofs remain. Sequential links use `#class6-step-1` through `#class6-step-17`; original `#hypothesis-step-*` and topic links retain their subjects.

Class 7 follows eighteen focused steps: data, grand mean, sum-of-squares decomposition, degrees of freedom and mean squares, F ratio, right tail, global conclusion, planned comparisons, factorial design, cell and marginal means, effects, interaction patterns, four sources, interaction contrast, three tests, replication, business recommendation, and software audit. Core arithmetic stays visible and all original explanations remain. Sequential links use `#class7-step-1` through `#class7-step-18`; original `#anova-step-*` and topic links retain their subjects.

Class 8 follows nineteen focused steps: paired data, line interpretation, least squares, centered sums, fitted coefficients, units, assumptions, residual diagnostics, noise estimation, slope inference, intercept inference, variation decomposition, R², F versus t, mean response, individual response, model limits, business recommendation, and software audit. Essential calculations stay visible; full explanations and proofs remain available. Sequential links use `#class8-step-1` through `#class8-step-19`; original `#regression-step-*` and topic links retain their subjects.

Run `npm run test:navigation` after building for navigation structure and interaction regression checks. Browser QA should also check narrow phone layouts, keyboard focus, Back/Forward, and the no-JavaScript fallback.

## GitHub Pages

The workflow builds and tests pushes to `main`, then deploys `dist/` using GitHub Actions. Select **GitHub Actions** in the repository's Pages settings. Pull requests run the checks without deployment. Links are relative and tested under `/business-in-numbers/`; `index.html` remains Class 1, with Start Here links to the introduction.

## Sources and third-party notices

This is an interactive adaptation of Chiu Yu Ko's business statistics teaching materials. Lesson source and coverage notes identify the relevant materials and limitations. Original slides and internal review documents are not included. No general content license is granted by this repository.

Mathematics is rendered with KaTeX. Its MIT license is retained at `dist/vendor/katex/LICENSE`; see also `dist/MATH-NOTICE.txt`.

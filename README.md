# Business in Numbers

An interactive eight-class business statistics course: descriptive statistics, probability, random variables, sampling distributions, estimation, hypothesis testing, ANOVA, and regression.

Start with [Start Here](https://kochiuyu.github.io/business-in-numbers/), or open [Class 1](https://kochiuyu.github.io/business-in-numbers/descriptive-statistics.html). Examples are synthetic teaching cases, not business forecasts.

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

### Presentation pilot

Classes 2 and 7 have a **Present lesson** button beside their step controls. Each class has 40 teaching slides for a three-hour lecture, including prediction prompts, focused live visuals, worked calculations and transfer checks. Each slide shows one takeaway and at most two concise explanation points. The visual uses the original lesson element, so chart controls retain their state; the full explanations remain in reading mode and the on-screen Notes panel. Prediction-slide Notes show facilitation guidance without revealing the worked answer. Class 2 has a visual and a reasoning slide for most steps; Class 7 pairs scenes with worked cores where both exist. The authored takeaway titles, teaching lines, points and stable slide IDs are in `src/presentation-content.json`. `scripts/presentation.cjs` validates the source anchors and adds the shared `presentation.js` and `presentation.css` assets during the build.

Use Previous/Next, the slide menu, Left/Right or Page Up/Down, and Home/End. Notes displays the corresponding reading explanation on the same screen. **Read this section** returns to the current lesson step. A direct link such as `probability.html?present=1&slide=prob-step-3--scene` opens a specific slide; the lesson remains fully readable without JavaScript. Print slides produces a landscape slide handout. This is a pilot for two classes; the other six classes retain their current reading paths.

Suggested three-hour pacing: teach slides 1–13 for about 55 minutes, pause for 10, teach slides 14–27 for 55, pause for 10, then teach slides 28–40 for 50. In Class 7, the first pause may come after slide 12, just before the F reference curve. Adjust discussion and practice time to the class; the count is a guide rather than an autoplay timer.

The shared header in `scripts/navigation.cjs` separates the eight-class course menu from in-page lesson shortcuts. The Business in Numbers brand returns to the course home; Browse classes also keeps an explicit Course introduction link, without a duplicate Start here link in the top row. It marks the current class and follows the section being read. All menu links and the native disclosure work without JavaScript; JavaScript adds Escape/outside-click dismissal, keyboard focus handling, and section highlighting.

Class 1 follows fourteen focused steps: records, tabular representation, graphical representation, mean, median, mode, quartiles and boxplots, variance, standard deviation with coefficient of variation, skewness, kurtosis, covariance, correlation, and a manager briefing. Every step has visible teaching, a worked calculation or action, and a check. New route links use stable subject names such as `#class1-mean` and `#class1-covariance`. Earlier `#case-part-*` and eight-step `#class1-step-*` links retain their subject destinations; their numeric suffixes no longer describe the reading order.

Tables and charts each have a dedicated Class 1 step, with the complete chart gallery and its matching data tables visible rather than nested in the records reference. The 100-order channel example carries from raw-record tallies to a frequency table and then to a graph; the separate 80-order payment table teaches cells, margins and question-specific denominators. Three optional buttons highlight the same 30 matching orders against all-order, online-order and card-order totals. A static question table preserves all explanations without JavaScript. Grouped and cumulative counts return to the original twelve purchase amounts, with explicit interval boundaries, empty intervals and information loss. Run `node test-class1-tables-depth.cjs` after building for the table-step arithmetic, preservation and interaction checks. Kurtosis links standardized dots to five individual fourth-power contributions, then explains averaging and the normal reference.

Class 1’s median, mode, skewness, kurtosis, and covariance steps include visible, static-first picture panels before their calculation notes. The pictures preserve the original records and clearly label the separate practice shop. Keyboard-accessible, horizontally scrollable charts keep axis labels readable on narrow screens; all essential values and interpretations also appear in ordinary text. Run `node test-class1-concept-pictures.cjs` after building to check their arithmetic, geometry, placement and accessibility contracts.

Class 2 follows eleven teaching steps: outcomes and events, event operations and validity, sequential choices, arrangements and selections, conditioning, independence, weighted paths, Bayes, odds and a first update, repeated evidence, and a business decision. Each core calculation stays visible. The original `#class2-step-*` and `#prob-step-*` links keep their subject destinations; their numeric suffixes no longer describe the displayed order.

Class 3 follows fifteen focused steps: mapping, PMF, CDF, expectation, variance, joint probabilities, covariance, trials and draws, arrivals, density, waits, normal probabilities, normal cutoffs, a capacity decision, and a clearly labeled inference-family preview. Essential calculations remain visible; full explanations, proofs and all eleven distribution families remain available. The original `#class3-step-*`, `#rv-step-*` and topic links keep their subjects; their numeric suffixes no longer describe the displayed order.

Class 4 follows thirteen focused steps: sampling design, exact sampling distributions, unbiasedness, variance and SE, LLN, CLT, known-SD probabilities, proportion moments, integer events and continuity correction, estimated scale, Student t, diagnostics, and a business decision. Essential arithmetic stays visible; complete explanations and proofs remain available. Sequential links use `#class4-step-1` through `#class4-step-13`; original `#sampling-step-*` and topic links retain their subjects.

Class 5 follows fifteen focused steps: target, unbiasedness, efficiency, consistency, individual spread, mean SE, binary estimation, rate SE, mean interval, confidence interpretation, t interval, rate interval, mean planning, rate planning, and the business decision. Essential calculations stay visible; all original details and exercises remain. Sequential links use `#class5-step-1` through `#class5-step-15`; original `#estimation-step-*` and topic links retain their subjects.

Class 6 follows seventeen focused steps: claim, decision errors, power, statistic and cutoffs, p-value, known-SD z, estimated-SD t, test–interval matching, one rate, comparison design, pooled means, Welch means, paired means, two rates, variances, reporting, and software audit. Core calculations stay visible; all original explanations and proofs remain. Sequential links use `#class6-step-1` through `#class6-step-17`; original `#hypothesis-step-*` and topic links retain their subjects.

Class 7 follows eighteen focused steps: data, grand mean, sum-of-squares decomposition, degrees of freedom and mean squares, F ratio, right tail, global conclusion, planned comparisons, factorial design, cell and marginal means, effects, interaction patterns, four sources, interaction contrast, three tests, replication, business recommendation, and software audit. Core arithmetic stays visible and all original explanations remain. Sequential links use `#class7-step-1` through `#class7-step-18`; original `#anova-step-*` and topic links retain their subjects.

Class 8 follows nineteen focused steps: paired data, line interpretation, least squares, centered sums, fitted coefficients, units, assumptions, residual diagnostics, noise estimation, slope inference, intercept inference, variation decomposition, R², F versus t, mean response, individual response, model limits, business recommendation, and software audit. Essential calculations stay visible; full explanations and proofs remain available. Sequential links use `#class8-step-1` through `#class8-step-19`; original `#regression-step-*` and topic links retain their subjects.

Run `npm run test:navigation` after building for navigation structure and interaction regression checks. Browser QA should also check narrow phone layouts, keyboard focus, Back/Forward, and the no-JavaScript fallback.

## GitHub Pages

The workflow builds and tests pushes to `main`, then deploys `dist/` using GitHub Actions. Select **GitHub Actions** in the repository's Pages settings. Pull requests run the checks without deployment. Links are relative and tested under `/business-in-numbers/`; `index.html` is Start Here, and `descriptive-statistics.html` is Class 1. The original `course-introduction.html` address remains readable. Previously shared root/index Class 1 anchors automatically continue to the same subject on the new Class 1 URL when JavaScript is enabled, preserving query strings and fragments. The homepage also includes an explicit Class 1 link for readers without JavaScript.

## Sources and third-party notices

This is an interactive adaptation of Chiu Yu Ko's business statistics teaching materials. Lesson source and coverage notes identify the relevant materials and limitations. Original slides and internal review documents are not included. No general content license is granted by this repository.

Mathematics is rendered with KaTeX. Its MIT license is retained at `dist/vendor/katex/LICENSE`; see also `dist/MATH-NOTICE.txt`.

## Visible lesson roadmaps

`src/lesson-roadmaps.json` records each implemented class's business question, outcome, phases, route-card descriptions and connections between steps. `scripts/lesson-roadmaps.cjs` adds this static-first navigation during the build, after practice is attached to its original topic. The source teaching blocks, equations and original anchors remain intact. New overview links use a separate selector from the indexed one-step route.

Class 1's roadmap connects fourteen steps in four phases. A visible standard-deviation-units mini-lesson in the SD/CV step prepares learners for skewness and kurtosis without adding an artificial top-level step. Run `npm run test:roadmaps` after building for static visibility, old-anchor ownership, complete explanation preservation, route order and independent arithmetic checks.

Classes 2 and 3 now have visible roadmaps, card descriptions and purposeful bridges. Counting follows event operations in Class 2; Class 3 completes its capacity decision before the inference preview. New next/back links follow the displayed order without changing existing deep-link meanings.

Classes 4–8 now expose their business questions, phase connections and data boundaries before the step cards. The sampling and ANOVA lessons preview design checks early; estimation shows parallel mean/rate paths; hypothesis tests are conditional method choices rather than a list to run. Regression explicitly links its visible future-data evaluation in step13 and retains nineteen steps. Class8 ends with course synthesis rather than a nonexistent next class. Repeated-step links retain heading focus across all eight viewers.

## Simple class openings

The shared header is the only eight-class menu. Each class opens directly into its current business brief and roadmap, without a second learning-path list, practice counter, or global open/close-explanations toolbar. The four contextual practice activities per class remain beside their topics, including hints, feedback, retries and worked answers. Individual native disclosures, technical depth, one-step/full-route viewing, deep links, printing and no-JavaScript reading remain available. Run `node test-class-openings.cjs` after building to check that the opening stays concise and all lesson content is preserved.

## Title-only explanation cards

Numbering belongs to the current class roadmap and teaching steps. The 104 expandable explanation cards use their titles and subtitles rather than a second, outdated sequence. The build removes only legacy number badges directly inside those card summaries; original source snapshots remain available for preservation checks. Native plus/minus disclosures, topic anchors, numbered calculation steps, mathematical labels and complete explanations are unchanged. Card bodies align with their titles. Run `npm run test:references` after building for exact-content, anchor, nested-numbering and title-only regressions.

## Compact course landing page

The home page and its `course-introduction.html` alias open with one business question, a small mean/median illustration, and a direct Class 1 start. Eight class cards offer immediate lesson links; each keeps its full outcome and bridge in a native disclosure. Orientation, study instructions, all four warm-ups and the final decision activity remain in labeled optional sections. All eight lessons are unchanged by this presentation update.

Home-only `introduction.css` and `introduction.js` keep this layout separate from lesson styles. Direct guidance/activity bookmarks and repeated same-page shortcuts open the relevant disclosure. Without JavaScript, the summaries, class links and worked answers still work. Print styles reveal the reference content. Run `npm run test:homepage` after building for the compact layout, disclosure behavior, class links and legacy-bookmark regressions.

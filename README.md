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

The full suite uses NumPy, SciPy, and Matplotlib to reproduce examples and independently check numerical results. The build emits `dist/` plus an optional local, self-contained Class 1 file (`class1-standalone.html`, not committed). All runtime course assets, including math fonts, are bundled locally.

## GitHub Pages

The workflow builds and tests pushes to `main`, then deploys `dist/` using GitHub Actions. Select **GitHub Actions** in the repository's Pages settings. Pull requests run the checks without deployment. Links are relative and tested under `/business-in-numbers/`; `index.html` remains Class 1, with Start Here links to the introduction.

## Sources and third-party notices

This is an interactive adaptation of Chiu Yu Ko's business statistics teaching materials. Lesson source and coverage notes identify the relevant materials and limitations. Original slides and internal review documents are not included. No general content license is granted by this repository.

Mathematics is rendered with KaTeX. Its MIT license is retained at `dist/vendor/katex/LICENSE`; see also `dist/MATH-NOTICE.txt`.

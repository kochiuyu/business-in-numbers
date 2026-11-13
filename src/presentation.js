'use strict';
(() => {
  const source = document.querySelector('[data-presentation-config]');
  if (!source || !HTMLDialogElement.prototype.showModal) return;
  const config = JSON.parse(source.textContent);
  const frames = config.slides.map((slide, index) => ({...slide, index, id: slide.id || `${slide.part}--${slide.kind}`}));
  const parts = new Map([...document.querySelectorAll(`.${config.partClass}`)].map(part => [part.id, part]));
  if (frames.some(frame => !parts.has(frame.part))) return;
  const launchAt = document.querySelector(`.${config.controlsClass}`);
  if (!launchAt) return;

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'present-launch';
  launch.textContent = 'Present lesson';
  launchAt.append(launch);
  const dialog = document.createElement('dialog');
  dialog.id = 'lesson-presentation';
  dialog.setAttribute('aria-label', 'Lesson presentation');
  dialog.innerHTML = `<div class="presentation-toolbar"><label for="presentation-chooser">Slide</label><select id="presentation-chooser" aria-label="Choose slide"></select><span class="presentation-counter" aria-live="polite"></span><button type="button" data-presentation-close>Close</button></div><div class="presentation-layout"><div class="presentation-main"><p class="presentation-phase"></p><h2 class="presentation-title" tabindex="-1"></h2><p class="presentation-prompt"></p><div class="presentation-explanation"><p class="presentation-line"></p><ul class="presentation-points"></ul></div><div class="presentation-graphic"></div><div class="presentation-stage"></div></div><aside class="presentation-notes" aria-label="Teaching notes" hidden></aside></div><div class="presentation-controls"><div><button type="button" data-presentation-prev>Previous</button><button type="button" data-presentation-next>Next</button></div><details class="presentation-more"><summary>More options</summary><div><button type="button" data-presentation-notes aria-pressed="false">Notes</button><button type="button" data-presentation-read>Read this section</button><button type="button" data-presentation-print>Print slides</button><button type="button" data-presentation-fullscreen>Full screen</button></div></details></div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const chooser = $('#presentation-chooser');
  frames.forEach(frame => {
    const option = document.createElement('option');
    option.value = frame.id;
    option.textContent = `${frame.index + 1}. ${frame.title}`;
    chooser.append(option);
  });
  const original = new Map([...parts.values()].map(part => [part, {parent: part.parentNode, next: part.nextSibling, hidden: part.hidden, labelledby: part.getAttribute('aria-labelledby')} ]));
  let current = -1;
  let activePart = null;
  let notesOpen = false;
  let ownsFullscreen = false;
  const main = $('.presentation-main');
  const stage = $('.presentation-stage');
  const more = $('.presentation-more');
  let compactControls = innerWidth <= 600;
  more.open = !compactControls;
  more.addEventListener('click', event => {
    if (compactControls && event.target.closest('button')) more.open = false;
  });
  function fitScene() {
    stage.style.zoom = '';
    if (stage.hidden || innerWidth > 600 || notesOpen) return;
    // Preserve readable controls and text on short screens; scrolling remains
    // available when a visual cannot fit at the minimum readable scale.
    for (let scale = 1; scale >= .7; scale -= .05) {
      stage.style.zoom = scale.toFixed(2);
      if (main.scrollHeight <= main.clientHeight &&
          stage.getBoundingClientRect().bottom <= main.getBoundingClientRect().bottom - 5) return;
    }
    stage.style.zoom = '.7';
  }
  window.addEventListener('resize', () => {
    const compact = innerWidth <= 600;
    if (compact !== compactControls) {
      compactControls = compact;
      more.open = !compact;
    }
    fitScene();
  });

  function sectionFor(frame) {
    const part = parts.get(frame.part);
    if (config.classNumber === 1 || config.classNumber === 3) return part;
    return part.querySelector(`:scope > .${config.partClass === 'c2-part' ? 'c2' : 'c7'}-${frame.kind === 'reason' ? 'scene' : frame.kind}`);
  }
  function cleanCopy(node) {
    const copy = node.cloneNode(true);
    for (const element of [copy, ...copy.querySelectorAll('*')]) {
      element.removeAttribute('id');
      element.removeAttribute('for');
      element.removeAttribute('aria-labelledby');
      element.removeAttribute('aria-describedby');
      if (element.tagName === 'DETAILS') element.open = true;
    }
    copy.querySelectorAll('button,input,select,textarea,script,template,.interactive-only').forEach(element => element.remove());
    return copy;
  }
  function fillNotes(part, frame) {
    const notes = $('.presentation-notes');
    notes.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'Teaching notes';
    notes.append(heading);
    if (frame.format === 'question') {
      const guidance = document.createElement('p');
      guidance.textContent = frame.notes || 'Invite a prediction, then advance to discuss the visual and calculation.';
      notes.append(guidance);
      return;
    }
    if (frame.phase) {
      const explanation = document.createElement('p');
      explanation.textContent = frame.notes;
      notes.append(explanation);
      return;
    }
    const headingClass = {'case-part': 'case-part-heading', 'c2-part': 'c2-part-heading', 'c3-part': 'c3-part-heading', 'c7-part': 'c7-part-heading'}[config.partClass];
    const intro = part.querySelector(`:scope > .${headingClass} > p`);
    if (intro) notes.append(cleanCopy(intro));
    for (const lesson of part.querySelectorAll(':scope > details.lesson')) {
      const title = document.createElement('h4');
      title.textContent = lesson.querySelector('summary b')?.textContent || lesson.querySelector('summary')?.textContent || 'Explanation';
      notes.append(title);
      const body = lesson.querySelector('.lesson-body');
      if (body) notes.append(cleanCopy(body));
    }
    const bridge = part.querySelector(':scope > .step-bridge');
    if (bridge) notes.append(cleanCopy(bridge));
  }
  function returnPart() {
    if (!activePart) return;
    const state = original.get(activePart);
    state.parent.insertBefore(activePart, state.next);
    activePart.hidden = state.hidden;
    activePart.classList.remove('presentation-part');
    activePart.removeAttribute('data-presentation-kind');
    if (state.labelledby === null) activePart.removeAttribute('aria-labelledby');
    else activePart.setAttribute('aria-labelledby', state.labelledby);
    activePart = null;
  }
  function makeGraphic(visual) {
    const figure = document.createElement('figure');
    figure.className = 'presentation-bars';
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-label', visual.title + ': ' + visual.items.map(item => `${item[0]} ${item[2]}`).join(', '));
    const caption = document.createElement('figcaption');
    caption.textContent = visual.title;
    figure.append(caption);
    const maximum = Math.max(...visual.items.map(item => item[1]));
    for (const [label, value, display] of visual.items) {
      const row = document.createElement('div');
      row.className = 'presentation-bar-row';
      const name = document.createElement('span'); name.textContent = label;
      const track = document.createElement('div'); track.className = 'presentation-bar-track';
      const fill = document.createElement('span'); fill.style.width = `${100 * value / maximum}%`; track.append(fill);
      const amount = document.createElement('strong'); amount.textContent = display;
      row.append(name, track, amount); figure.append(row);
    }
    return figure;
  }
  function address(frame) {
    const url = new URL(location.href);
    url.searchParams.set('present', '1');
    url.searchParams.set('slide', frame.id);
    url.hash = '';
    history.replaceState(null, '', url);
  }
  function render(index) {
    current = Math.max(0, Math.min(frames.length - 1, index));
    const frame = frames[current];
    const part = parts.get(frame.part);
    if (part !== activePart) {
      returnPart();
      activePart = part;
      part.hidden = false;
      part.removeAttribute('aria-labelledby');
      part.classList.add('presentation-part');
      $('.presentation-stage').append(part);
    }
    fillNotes(part, frame);
    part.dataset.presentationKind = frame.kind;
    if (!sectionFor(frame)) throw Error(`Presentation source missing: ${frame.id}`);
    $('.presentation-title').textContent = frame.title;
    const classNumber = config.classNumber || (config.partClass === 'c2-part' ? 2 : 7);
    $('.presentation-phase').textContent = `Class ${classNumber} · ${frame.phase || part.querySelector('h2')?.textContent.trim() || 'Lesson'}`;
    const isScene = frame.kind === 'scene';
    $('.presentation-prompt').textContent = frame.context;
    $('.presentation-line').textContent = frame.line || '';
    $('.presentation-line').hidden = !frame.line;
    $('.presentation-explanation').dataset.mode = frame.format || 'explain';
    $('.presentation-points').replaceChildren(...(frame.points || []).map(point => {
      const item = document.createElement('li');
      item.textContent = point;
      return item;
    }));
    $('.presentation-explanation').hidden = isScene || frame.kind === 'graphic';
    const graphic = $('.presentation-graphic');
    graphic.hidden = frame.kind !== 'graphic';
    graphic.replaceChildren(...(frame.visual ? [makeGraphic(frame.visual)] : []));
    $('.presentation-stage').hidden = !isScene;
    $('.presentation-counter').textContent = `${current + 1} / ${frames.length}`;
    chooser.value = frame.id;
    $('[data-presentation-prev]').disabled = current === 0;
    $('[data-presentation-next]').disabled = current === frames.length - 1;
    main.scrollTop = 0;
    fitScene();
    address(frame);
    $('.presentation-title').focus({preventScroll: true});
  }
  function open(index) {
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('presenting');
    render(index);
  }
  function close(anchor) {
    if (!dialog.open) return;
    const partId = anchor || frames[current].part;
    if (ownsFullscreen && document.fullscreenElement === document.documentElement) document.exitFullscreen().catch(() => {});
    dialog.close();
    returnPart();
    document.documentElement.classList.remove('presenting');
    const url = new URL(location.href);
    url.searchParams.delete('present');
    url.searchParams.delete('slide');
    url.hash = partId;
    history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    ownsFullscreen = false;
  }
  function firstSlideFor(partId) { return frames.findIndex(frame => frame.part === partId); }
  launch.addEventListener('click', () => {
    let hash = '';
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore a malformed bookmark. */ }
    const selected = [...parts.values()].find(part => part.contains(document.getElementById(hash || 'unmatched')));
    open(Math.max(0, firstSlideFor(selected?.id)));
  });
  $('[data-presentation-prev]').addEventListener('click', () => render(current - 1));
  $('[data-presentation-next]').addEventListener('click', () => render(current + 1));
  chooser.addEventListener('change', () => render(frames.findIndex(frame => frame.id === chooser.value)));
  $('[data-presentation-close]').addEventListener('click', () => close());
  $('[data-presentation-read]').addEventListener('click', () => close());
  $('[data-presentation-notes]').addEventListener('click', event => {
    notesOpen = !notesOpen;
    $('.presentation-notes').hidden = !notesOpen;
    event.currentTarget.setAttribute('aria-pressed', String(notesOpen));
    fitScene();
  });
  $('[data-presentation-fullscreen]').addEventListener('click', async () => {
    try {
      if (ownsFullscreen && document.fullscreenElement === document.documentElement) await document.exitFullscreen();
      else { await document.documentElement.requestFullscreen(); ownsFullscreen = true; }
    } catch { $('[data-presentation-fullscreen]').textContent = 'Full screen unavailable'; }
  });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) ownsFullscreen = false; });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    const part = target?.closest(`.${config.partClass}`);
    event.preventDefault();
    if (part) render(firstSlideFor(part.id));
    else close(link.hash.slice(1));
  });
  for (const type of ['click', 'change', 'input']) {
    stage.addEventListener(type, () => requestAnimationFrame(fitScene));
  }
  dialog.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.target.closest('button,select,input,textarea,summary,a')) return;
    if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); render(current + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); render(current - 1); }
    if (event.key === 'Home') { event.preventDefault(); render(0); }
    if (event.key === 'End') { event.preventDefault(); render(frames.length - 1); }
  });
  $('[data-presentation-print]').addEventListener('click', () => {
    document.getElementById('printed-slides')?.remove();
    const deck = document.createElement('div');
    deck.id = 'printed-slides';
    frames.forEach((frame, index) => {
      const page = document.createElement('section');
      page.className = 'presentation-print-page';
      const heading = document.createElement('h2');
      heading.textContent = `${index + 1}. ${frame.title}`;
      page.append(heading);
      const context = document.createElement('p');
      context.className = 'presentation-print-prompt';
      context.textContent = frame.context;
      page.append(context);
      if (frame.kind === 'graphic') {
        page.append(makeGraphic(frame.visual));
      } else if (frame.kind === 'scene') {
        const content = cleanCopy(sectionFor(frame));
        const visual = config.partClass === 'c2-part'
          ? '.c2-outcome-grid, .c2-choice-stages, .c2-role-labels, .c2-assignments, .c2-team-arrow, .c2-one-team, .c2-compare-cards, .c2-paths, .c2-contributions, .c2-figure, .bayes-tree-card, .c2-brief'
          : '.c7-result';
        for (const child of [...content.children]) if (!child.matches(visual)) child.remove();
        if (config.partClass === 'c7-part') {
          const result = content.querySelector('.c7-result');
          for (const child of [...(result?.children || [])].slice(frame.part === 'anova-step-11' ? 2 : 1)) child.remove();
        }
        page.append(content);
      } else {
        const line = document.createElement('p');
        line.className = 'presentation-print-line';
        line.textContent = frame.line;
        const points = document.createElement('ul');
        points.className = 'presentation-print-points';
        for (const text of frame.points) {
          const point = document.createElement('li');
          point.textContent = text;
          points.append(point);
        }
        page.append(line, points);
      }
      deck.append(page);
    });
    document.body.append(deck);
    document.documentElement.classList.add('printing-presentation');
    window.print();
  });
  window.addEventListener('afterprint', () => {
    document.documentElement.classList.remove('printing-presentation');
    document.getElementById('printed-slides')?.remove();
  });
  const params = new URLSearchParams(location.search);
  if (params.get('present') === '1') {
    const requested = frames.findIndex(frame => frame.id === params.get('slide'));
    open(requested < 0 ? 0 : requested);
  }
})();


'use strict';
(() => {
  const extensions = [...document.querySelectorAll('[data-reading-extension]')];
  const topics = [...document.querySelectorAll('details.lesson'), ...extensions];
  const toolbar = document.querySelector('.reading-controls');
  const buttons = [...document.querySelectorAll('[data-reading-mode]')];
  const status = document.getElementById('reading-status');
  function update() {
    const count = topics.filter(topic => topic.open).length;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readingMode === 'read' ? count === topics.length : count === 0)));
    if (status) status.textContent = `${count} of ${topics.length} ${extensions.length ? 'explanations and extensions' : 'topic explanations'} open. You can also open or close each ${extensions.length ? 'panel' : 'topic'} separately.`;
  }
  if (toolbar && topics.length) {
    toolbar.hidden = false;
    buttons.forEach(button => button.addEventListener('click', () => {
      topics.forEach(topic => { topic.open = button.dataset.readingMode === 'read'; });
      update();
    }));
    topics.forEach(topic => topic.addEventListener('toggle', update));
    update();
  }
  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    let parent = target;
    while (parent) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    update();
  }
  window.addEventListener('hashchange', revealAnchor);
  revealAnchor();
})();

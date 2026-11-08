'use strict';
(() => {
  // A link into a closed explanation still reveals its native disclosure.
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
  }
  window.addEventListener('hashchange', revealAnchor);
  revealAnchor();
})();

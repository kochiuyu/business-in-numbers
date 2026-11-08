'use strict';
(() => {
  // Keep bookmarked guidance and activities reachable after progressive disclosure.
  // Without JS the same native summaries and all worked answers remain available.
  function reveal(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let element = target;
    while (element) {
      if (element.matches('details')) element.open = true;
      element = element.parentElement;
    }
  }
  function followHash() { reveal(location.hash); }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
      reveal(link.hash);
    });
  });
  window.addEventListener('hashchange', followHash);
  window.addEventListener('pageshow', followHash);
  followHash();
})();

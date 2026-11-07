'use strict';
(() => {
  const header = document.querySelector('.course-header');
  if (!header) return;
  const picker = header.querySelector('.course-picker');
  const trigger = picker.querySelector('summary');
  const links = [...header.querySelectorAll('.lesson-shortcuts a')];
  const sections = links.map(link => ({link, target: document.getElementById(link.hash.slice(1))})).filter(item => item.target);
  // Track content order, which can differ from the order of the shortcuts.
  sections.sort((a,b) => a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1);
  function closeMenu(restoreFocus) {
    if (!picker.open) return;
    picker.open = false;
    if (restoreFocus) trigger.focus({preventScroll:true});
  }
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && picker.open) { event.preventDefault(); closeMenu(true); }
  });
  document.addEventListener('click', event => {
    if (!picker.contains(event.target)) closeMenu(false);
  });
  document.addEventListener('focusin', event => {
    if (!picker.contains(event.target)) closeMenu(false);
  });
  picker.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu(false)));
  // Back/forward can restore a previously open disclosure from the page cache.
  window.addEventListener('pageshow', () => closeMenu(false));
  let queued = false;
  function updateLocation() {
    queued = false;
    const height = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--course-header-height', height+'px');
    let current = null;
    for (const item of sections) {
      if (item.target.getClientRects && !item.target.getClientRects().length) continue;
      const margin = parseFloat(getComputedStyle(item.target).scrollMarginTop) || 0;
      if (item.target.getBoundingClientRect().top <= height + 20 + margin + 2) current = item;
    }
    links.forEach(link => {
      if (current && current.link === link) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleUpdate() {
    if (!queued) { queued = true; requestAnimationFrame(updateLocation); }
  }
  window.addEventListener('scroll', scheduleUpdate, {passive:true});
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleUpdate).observe(header);
  // Native links preserve history and no-JS behavior. Move keyboard focus to the
  // destination, without adding lesson headings to the normal Tab sequence.
  links.forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex','-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once:true});
    }
    target.focus({preventScroll:true});
  }));
  updateLocation();
})();

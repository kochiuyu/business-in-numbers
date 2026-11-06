'use strict';
// Math is already rendered. JavaScript is only used to make print include closed panels.
(() => {
  let printState;
  function preparePrint() {
    if (printState) return;
    printState = [...document.querySelectorAll('details')].map(node => [node, node.open]);
    printState.forEach(([node]) => { node.open = true; });
  }
  function restoreView() {
    if (!printState) return;
    printState.forEach(([node, open]) => { node.open = open; });
    printState = undefined;
  }
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',restoreView);
})();

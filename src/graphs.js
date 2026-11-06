(function () {
  'use strict';
  const $=id=>document.getElementById(id);
  const root=$('charts');
  if(!root)return;
  function choose(key) {
    const target=$('graph-panel-'+key);
    if(!target)return;
    root.querySelectorAll('[data-graph-panel]').forEach(panel=>{panel.hidden=panel!==target;});
    root.querySelectorAll('[data-graph-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.graphChoice===key)));
  }
  root.querySelectorAll('[data-graph-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.graphChoice)));
  $('graph-category-mode').addEventListener('change',e=>{
    const pie=e.target.value==='pie';
    $('graph-category-picture').innerHTML=Graphs.category(e.target.value);
    $('graph-category-insight').textContent=pie?'Online orders account for 50% of the whole. The three mutually exclusive categories total 100%. Compare the same data as bars to judge differences more easily.':'Online has the most orders: 50, compared with 30 in store and 20 by phone. Gaps separate categories. The numerical axis starts at zero so bar lengths represent counts honestly.';
  });
  function updateHistogram(){
    const width=Number($('graph-bin-width').value),polygon=$('graph-polygon').checked,bins=Graphs.histogram(Graphs.deliveries,width);
    $('graph-distribution-picture').innerHTML=Graphs.distribution(width,polygon);
    $('graph-frequency-body').innerHTML=bins.map((bin,i)=>`<tr><th scope="row">${bin.lo} ≤ time ${i===bins.length-1?'≤':'<'} ${bin.hi}</th><td>${bin.count}</td><td>${bin.count*5}%</td></tr>`).join('');
    $('graph-bin-insight').textContent=`${bins.length} bins, ${width} minutes wide. Counts: ${bins.map(b=>b.count).join(', ')}. All 20 deliveries are still present. ${width===20?'Two wide bins hide much of the detail.':width===5?'Narrow bins reveal more detail, but small samples can look irregular.':'The busiest interval is 10 to under 20 minutes: 13 of 20 deliveries (65%).'} ${polygon?'The line joins the midpoint frequency of each bin; it is not a time trend.':''}`;
  }
  $('graph-bin-width').addEventListener('change',updateHistogram);
  $('graph-polygon').addEventListener('change',updateHistogram);
  $('graph-quartile').addEventListener('change',e=>{
    const b=Graphs.boxSummary(Graphs.orders,e.target.value);
    $('graph-box-picture').innerHTML=Graphs.box(e.target.value);
    $('graph-box-numbers').textContent=`Q₁ = $${b.q1.toFixed(2)}; median = $${b.median.toFixed(2)}; Q₃ = $${b.q3.toFixed(2)}; IQR = $${b.iqr.toFixed(2)}. Fences: $${b.lowerFence.toFixed(2)} to $${b.upperFence.toFixed(2)}. Whiskers: $${b.lowerWhisker} and $${b.upperWhisker}. The $200 order is flagged.`;
  });
  root.querySelectorAll('[data-chart-answer]').forEach(button=>button.addEventListener('click',()=>{
    root.querySelectorAll('[data-chart-answer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('graph-check-feedback').textContent=button.dataset.chartAnswer==='histogram'?'Yes. A histogram groups delivery times into adjacent numeric intervals and shows how many fall in each. A bar chart of individual order IDs answers a different question.':'Try again. We want the distribution of one numerical variable: delivery time. A histogram reveals where values cluster, their spread and a possible long tail.';
  }));
  choose('category');
  // The default diagrams and data are pre-rendered, so all lessons still work without JS.
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#graph-panel-'))choose(location.hash.slice('#graph-panel-'.length));});
  if(location.hash.startsWith('#graph-panel-'))choose(location.hash.slice('#graph-panel-'.length));
})();

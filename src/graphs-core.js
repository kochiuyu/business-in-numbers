(function (root) {
  'use strict';
  // All examples are fixed, synthetic teaching data, separate from the order-book lab.
  const deliveries = [4,6,7,9,10,11,12,12,13,14,14,15,15,16,17,18,19,22,26,38];
  const orders = [18,22,24,25,28,30,32,35,38,42,46,200];
  const channels = [['Online',50],['In store',30],['Phone',20]];
  const monthly = [['Jan',40],['Feb',48],['Mar',44],['Apr',58],['May',64],['Jun',60]];
  const pairs = [[1,4],[2,7],[3,6],[4,4],[5,9]];
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = x => Number(x.toFixed(2)).toLocaleString('en-US');
  function histogram(values, width) {
    if (![5,10,20].includes(width)) throw Error('Choose a bin width of 5, 10 or 20 minutes.');
    if (!Array.isArray(values) || values.some(v=>!Number.isFinite(v)||v<0||v>40)) throw Error('This teaching histogram accepts values from 0 to 40.');
    return Array.from({length:40/width},(_,i)=>({lo:i*width,hi:(i+1)*width,mid:(i+.5)*width,count:values.filter(v=>v>=i*width&&(v<(i+1)*width||(i===40/width-1&&v===40))).length}));
  }
  function boxSummary(values, convention='exc') {
    if(!['exc','inc'].includes(convention)||values.length<4||values.some(v=>!Number.isFinite(v))) throw Error('Use at least four finite observations and a supported quartile convention.');
    const sorted=[...values].sort((a,b)=>a-b);
    const quantile=p=>{const rank=convention==='exc'?p*(sorted.length+1)-1:p*(sorted.length-1);const lo=Math.floor(rank),hi=Math.ceil(rank);return sorted[lo]+(rank-lo)*(sorted[hi]-sorted[lo]);};
    const q1=quantile(.25),median=(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.ceil((sorted.length-1)/2)])/2,q3=quantile(.75),iqr=q3-q1;
    const lowerFence=q1-1.5*iqr,upperFence=q3+1.5*iqr;
    const within=sorted.filter(v=>v>=lowerFence&&v<=upperFence);
    return {min:sorted[0],q1,median,q3,max:sorted.at(-1),iqr,lowerFence,upperFence,lowerWhisker:within[0],upperWhisker:within.at(-1),outliers:sorted.filter(v=>v<lowerFence||v>upperFence)};
  }
  const start=(id,title,desc,h=280)=>`<svg viewBox="0 0 480 ${h}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc>`;
  const text=(x,y,value,anchor='start',extra='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="#344d43" font-size="15" ${extra}>${esc(value)}</text>`;
  const line=(x1,y1,x2,y2,color='#d7ddd3',extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
  function category(mode='bar') {
    if(!['bar','pie'].includes(mode)) throw Error('Unknown category chart.');
    let svg=start('graph-category',mode==='bar'?'Orders by sales channel: bar chart':'Share of orders by channel: pie chart','Synthetic data: Online 50 orders, 50%; in store 30 orders, 30%; phone 20 orders, 20%. Total: 100 orders.');
    if(mode==='bar') {
      [0,20,40,60].forEach(v=>{const x=105+v*5;svg+=line(x,30,x,222)+text(x,248,v,'middle');});
      channels.forEach(([name,n],i)=>{const y=49+i*62;svg+=text(93,y+24,name,'end')+`<rect x="105" y="${y}" width="${n*5}" height="36" rx="2" fill="#173f36"/>`+text(115+n*5,y+24,n);});
      svg+=text(255,274,'Number of orders','middle');
    } else {
      let angle=-Math.PI/2;
      channels.forEach(([name,n],i)=>{const next=angle+Math.PI*2*n/100;const x1=130+95*Math.cos(angle),y1=135+95*Math.sin(angle),x2=130+95*Math.cos(next),y2=135+95*Math.sin(next);const color=['#173f36','#bc4f24','#eddba6'][i];svg+=`<path d="M130 135 L${x1} ${y1} A95 95 0 ${n>50?1:0} 1 ${x2} ${y2} Z" fill="${color}" stroke="#fffef9" stroke-width="2"/>`;const mid=(angle+next)/2;svg+=text(130+63*Math.cos(mid),140+63*Math.sin(mid),n+'%','middle',`style="fill:${i===2?'#172c2a':'#ffffff'};font-weight:bold"`);svg+=text(255,90+i*42,`${name}: ${n} (${n}%)`);angle=next;});
      svg+=text(255,235,'100 orders = 100%');
    }
    return svg+'</svg>';
  }
  function distribution(width=10,polygon=false) {
    const bins=histogram(deliveries,width), ymax=20,x=v=>50+v/40*400,y=v=>225-v/ymax*180;
    let svg=start('graph-distribution','Delivery times: histogram'+(polygon?' and frequency polygon':''),`20 synthetic deliveries. Bin width ${width} minutes. ${bins.map((b,i)=>`${b.lo} to ${b.hi}${i===bins.length-1?' inclusive':''}: ${b.count} deliveries`).join('; ')}. Intervals include their lower limit and exclude their upper limit, except the final interval includes 40.`);
    [0,5,10,15,20].forEach(v=>svg+=line(50,y(v),450,y(v))+text(40,y(v)+5,v,'end'));
    bins.forEach(b=>{svg+=`<rect x="${x(b.lo)}" y="${y(b.count)}" width="${x(b.hi)-x(b.lo)}" height="${225-y(b.count)}" fill="#b2c4ae" stroke="#173f36" stroke-width="1.2"/>`+text(x(b.mid),y(b.count)-8,b.count,'middle');});
    [0,10,20,30,40].forEach(v=>svg+=text(x(v),249,v,'middle'));
    if(polygon){svg+=`<polyline points="${bins.map(b=>`${x(b.mid)},${y(b.count)}`).join(' ')}" fill="none" stroke="#963d1b" stroke-width="3"/>`;bins.forEach(b=>svg+=`<circle cx="${x(b.mid)}" cy="${y(b.count)}" r="4" fill="#963d1b"/>`);}
    svg+=text(50,20,'Number of deliveries')+text(250,275,'Delivery time (minutes)','middle');
    return svg+'</svg>';
  }
  function box(convention='exc') {
    const b=boxSummary(orders,convention),x=v=>45+v/220*405;
    let svg=start('graph-box','Order values: modified boxplot',`Fixed 12 synthetic order values. ${convention==='exc'?'Exclusive':'Inclusive'} quartiles: Q1 ${fmt(b.q1)}, median ${fmt(b.median)}, Q3 ${fmt(b.q3)}. Whiskers at ${b.lowerWhisker} and ${b.upperWhisker} dollars. ${b.outliers.join(', ')} dollars flagged beyond 1.5 IQR fences.`,250);
    [0,50,100,150,200].forEach(v=>svg+=line(x(v),42,x(v),190)+text(x(v),214,v,'middle'));
    svg+=line(x(b.lowerWhisker),110,x(b.upperWhisker),110,'#173f36','stroke-width="3"');
    [b.lowerWhisker,b.upperWhisker].forEach(v=>svg+=line(x(v),85,x(v),135,'#173f36','stroke-width="3"'));
    svg+=`<rect x="${x(b.q1)}" y="75" width="${x(b.q3)-x(b.q1)}" height="70" fill="#b2c4ae" stroke="#173f36" stroke-width="2"/>`+line(x(b.median),75,x(b.median),145,'#963d1b','stroke-width="4"');
    b.outliers.forEach(v=>svg+=`<circle cx="${x(v)}" cy="110" r="6" fill="#bc4f24"/>`+text(x(v),86,'$'+v,'middle'));
    svg+=text(x(110),35,'The middle half sits inside the box.','middle')+text(x(200),148,'Flagged','middle')+text(240,244,'Order value ($)','middle');
    return svg+'</svg>';
  }
  function time() {
    const x=i=>55+i*78,y=v=>225-v/80*180;
    let svg=start('graph-time','Monthly revenue, January to June',`Synthetic revenue in thousands of dollars: ${monthly.map(([month,value])=>`${month} ${value}`).join(', ')}. The time order is preserved. Overall increase from 40 to 60, with falls in March and June.`);
    [0,20,40,60,80].forEach(v=>svg+=line(55,y(v),445,y(v))+text(45,y(v)+5,v,'end'));
    svg+=`<polyline points="${monthly.map(([,v],i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="#173f36" stroke-width="3"/>`;
    monthly.forEach(([month,v],i)=>svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#bc4f24"/>`+text(x(i),y(v)-11,v,'middle')+text(x(i),249,month,'middle'));
    return svg+text(55,20,'Revenue ($ thousands)')+text(250,275,'Month (Jan–Jun, same synthetic year)','middle')+'</svg>';
  }
  function scatter() {
    const x=v=>55+v/6*390,y=v=>225-v/10*180;
    let svg=start('graph-scatter','Advertising spend and sales for five branches','Synthetic paired observations, in thousands of dollars: (1,4), (2,7), (3,6), (4,4), (5,9). Each point is one branch. There is an imperfect positive association, not proof of causation.');
    [0,2,4,6,8,10].forEach(v=>svg+=line(55,y(v),445,y(v))+text(45,y(v)+5,v,'end'));
    [0,1,2,3,4,5,6].forEach(v=>svg+=text(x(v),249,v,'middle'));
    pairs.forEach(([a,b])=>svg+=`<circle cx="${x(a)}" cy="${y(b)}" r="7" fill="#bc4f24"/>`);
    return svg+text(55,20,'Sales ($ thousands)')+text(250,275,'Advertising spend ($ thousands)','middle')+'</svg>';
  }
  const renderers={category,distribution,box,time,scatter};
  const api={deliveries,orders,channels,monthly,pairs,histogram,boxSummary,category,distribution,box,time,scatter,render:name=>{if(!renderers[name])throw Error('Unknown graph: '+name);return renderers[name]();}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Graphs=api;
})(typeof window!=='undefined'?window:globalThis);

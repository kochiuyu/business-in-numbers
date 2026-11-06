(function (root) {
  'use strict';
  function quantile(values, p, convention = 'exc') {
    const a = [...values].sort((x,y) => x-y);
    const rank = convention === 'exc' ? p*(a.length+1)-1 : p*(a.length-1);
    if (rank < 0 || rank > a.length-1) return null;
    const lo = Math.floor(rank), hi = Math.ceil(rank);
    return a[lo] + (rank-lo)*(a[hi]-a[lo]);
  }
  function describe(values, sample = false, convention = 'exc') {
    const a = [...values].sort((x,y) => x-y), n=a.length;
    const mean=a.reduce((s,x)=>s+x,0)/n;
    const sums=[2,3,4].map(k=>a.reduce((s,x)=>s+(x-mean)**k,0));
    const variance=sums[0]/(sample?n-1:n), sd=Math.sqrt(variance);
    const popVariance=sums[0]/n;
    const skew=popVariance ? (sums[1]/n)/(popVariance**1.5) : null;
    const kurt=popVariance ? (sums[2]/n)/(popVariance**2) : null;
    const freq = new Map(); a.forEach(x=>freq.set(x,(freq.get(x)||0)+1));
    const highest=Math.max(...freq.values());
    const q1=quantile(a,.25,convention),q3=quantile(a,.75,convention);
    return {n,sorted:a,mean,median:quantile(a,.5,'inc'),min:a[0],max:a[n-1],range:a[n-1]-a[0],q1,q3,iqr:q3-q1,variance,sd,cv:mean>0?sd/mean*100:null,
      modes:highest===1?[]:[...freq].filter(([,f])=>f===highest).map(([x])=>x),freq:[...freq],
      skew:skew===null?null:sample?Math.sqrt(n*(n-1))/(n-2)*skew:skew,
      excess:kurt===null?null:sample?((n+1)*(n-1)*kurt-3*(n-1)**2)/((n-2)*(n-3)):kurt-3};
  }
  function correlation(x,y) {
    if(x.length!==y.length || x.length<2) return null;
    const mx=x.reduce((a,b)=>a+b)/x.length,my=y.reduce((a,b)=>a+b)/y.length;
    const xx=x.reduce((s,v)=>s+(v-mx)**2,0), yy=y.reduce((s,v)=>s+(v-my)**2,0);
    if(!xx || !yy) return null;
    return x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/Math.sqrt(xx*yy);
  }
  function parseValues(text) {
    const tokens=text.trim().split(/[\s,;]+/);
    if(tokens.length<4 || tokens.length>40) throw Error('Please enter 4 to 40 numbers, separated by commas or spaces.');
    if(tokens.some(t=>!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t))) throw Error('Use numbers only, separated by commas or spaces. Leave out currency symbols.');
    const values=tokens.map(Number);
    if(values.some(v=>!Number.isFinite(v)||Math.abs(v)>1000000)) throw Error('Use finite values between −1,000,000 and 1,000,000.');
    return values;
  }
  const api={quantile,describe,correlation,parseValues};
  if(typeof module!=='undefined' && module.exports) module.exports=api; else root.Stats=api;
})(typeof window!=='undefined'?window:globalThis);

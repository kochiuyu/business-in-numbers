import json, subprocess, math
import numpy as np
from scipy.stats import t, binom, norm
script="""const S=require('./src/sampling-core'); const out=[];
for(const df of [1,2,3,5,15,30,99,199,9999])for(const x of [-100,-10,-5,-2,-1.5,-.01,0,.01,1.5,2,5,10,100])out.push(['t',df,x,S.tCdf(x,df)]);
for(const n of [1,2,16,80,200])for(const p of [0,.001,.01,.1,.3,.5,.9,.99,.999,1])for(const k of [-1,0,1,Math.floor(n/2),n-1,n]){const d=S.proportions(n,p,k);out.push(['b',n,p,k,d.exact]);}
for(let z=-8;z<=8;z+=.05)out.push(['z',z,S.known(0,1,1,z).p]);console.log(JSON.stringify(out));"""
rows=json.loads(subprocess.check_output(['node','-e',script],text=True));max_t=0
for row in rows:
 if row[0]=='t':
  _,df,x,value=row;error=abs(value-t.cdf(x,df));max_t=max(max_t,error);assert error<2e-10,row
 elif row[0]=='b':
  _,n,p,k,value=row;assert abs(value-binom.cdf(k,n,p))<2e-12,row
 else:
  _,z,value=row;assert abs(value-norm.cdf(z))<8e-8,row
print(f'Passed {len(rows)} independent SciPy oracle comparisons; maximum t CDF absolute error {max_t:.3g}.')

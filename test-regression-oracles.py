"""Independent NumPy least-squares + SciPy distribution oracle; no browser math reused."""
import json, subprocess
from pathlib import Path
import numpy as np
from scipy import stats
ROOT=Path(__file__).resolve().parent
rng=np.random.default_rng(8042026)
cases=[{'pairs':[[i+1,y] for i,y in enumerate([11,12,16,15,19,20,23,24])], 'alpha':.05,'x0':4}, {'pairs':[[i+1,y] for i,y in enumerate([4,7,6,4,9])],'alpha':.05,'x0':6}]
for n in [3,4,8,30,100,1000]:
 for slope in [-3,0,.001,2]:
  x=rng.normal(3,2,n);y=7+slope*x+rng.normal(0,1.4,n)
  for alpha in [.001,.01,.05,.2]:cases.append({'pairs':np.column_stack([x,y]).tolist(),'alpha':alpha,'x0':float(rng.uniform(-3,12))})
for scale,shift,yshift in [(2,0,0),(-3,4,0),(.01,100,20),(1,1e7,1e7)]:
 p=np.asarray(cases[0]['pairs'],float);p[:,0]=scale*p[:,0]+shift;p[:,1]+=yshift
 cases.append({'pairs':p.tolist(),'alpha':.05,'x0':scale*4+shift})
script="const R=require('./src/regression-core.js');let t='';process.stdin.on('data',c=>t+=c).on('end',()=>console.log(JSON.stringify(JSON.parse(t).map(c=>R.fit(c.pairs,c.alpha,c.x0)))));"
results=json.loads(subprocess.check_output(['node','-e',script],input=json.dumps(cases).encode(),cwd=ROOT))
checks=0
for case,result in zip(cases,results):
 p=np.array(case['pairs']);x,y=p.T;n=len(x);df=n-2;xm=x.mean();ym=y.mean();dx=x-xm
 # Solve centered design using LAPACK, then reconstruct original intercept.
 design=np.column_stack([np.ones(n),dx]);coeff=np.linalg.lstsq(design,y-ym,rcond=None)[0];b=coeff[1];a=ym+coeff[0]-b*xm
 residuals=(y-ym)-design@coeff;sse=float(residuals@residuals);sxx=float(dx@dx);sst=float((y-ym)@(y-ym));ssr=b*b*sxx;s2=sse/df;s=np.sqrt(s2)
 seb=s/np.sqrt(sxx);sea=s*np.sqrt(1/n+xm*xm/sxx);ta=a/sea;tb=b/seb;f=ssr/s2
 crit=stats.t.ppf(1-case['alpha']/2,df);prediction=ym+coeff[0]+b*(case['x0']-xm);mse=s*np.sqrt(1/n+(case['x0']-xm)**2/sxx);pse=np.hypot(s,mse)
 expect=dict(a=a,b=b,Sxx=sxx,SSE=sse,SSR=ssr,SST=sst,s2=s2,s=s,seA=sea,seB=seb,covAB=-xm*s2/sxx,r=np.corrcoef(x,y)[0,1],r2=ssr/sst,tA=ta,tB=tb,F=f,pA=2*stats.t.sf(abs(ta),df),pB=2*stats.t.sf(abs(tb),df),pF=stats.f.sf(f,1,df),criticalT=crit,prediction=prediction,meanSE=mse,predSE=pse,ciA=[a-crit*sea,a+crit*sea],ciB=[b-crit*seb,b+crit*seb],meanCI=[prediction-crit*mse,prediction+crit*mse],predPI=[prediction-crit*pse,prediction+crit*pse],residuals=residuals,leverage=1/n+dx**2/sxx)
 for key,expected in expect.items():
  np.testing.assert_allclose(result[key],expected,rtol=2e-8,atol=1e-9,err_msg=f'{key}, n={n}');checks+=1
print(f'PASS: {len(cases)} independent NumPy/SciPy cases; {checks} scalar/vector/interval comparisons.')

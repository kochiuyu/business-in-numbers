"""Independent SciPy oracle for estimation browser core. Run from project root."""
import json, math, subprocess
from scipy.stats import norm,t
cases=[]
for c in [.9,.95,.99]:
 for df in [1,2,3,5,15,24,100,500,1000,9999]:cases.append(['tcrit',[c,df],float(t.ppf((1+c)/2,df))])
 for method,n,mean,sd in [('z',81,72,18),('t',16,47,8),('t',2,-100,1e6),('t',10000,1e6,.000001)]:
  critical=norm.ppf((1+c)/2) if method=='z' else t.ppf((1+c)/2,n-1)
  cases.append(['meanCI',[method,mean,sd,n,c],dict(critical=float(critical),se=sd/math.sqrt(n),me=float(critical*sd/math.sqrt(n)),lower=float(mean-critical*sd/math.sqrt(n)),upper=float(mean+critical*sd/math.sqrt(n)))])
 for k,n in [(48,200),(0,1),(1,1),(0,200),(200,200),(1,1000000),(999999,1000000)]:
  p=k/n;z=norm.ppf((1+c)/2);se=math.sqrt(p*(1-p)/n);den=1+z*z/n;center=(p+z*z/(2*n))/den;half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
  cases.append(['proportion',[k,n,c],dict(p=p,se=se,me=float(z*se),lower=float(p-z*se),upper=float(p+z*se),wlower=float(max(0,center-half)),wupper=float(min(1,center+half)))])
 for kind,sd,p,e in [('mean',18,.5,3),('proportion',18,.24,.04),('proportion',18,.5,.04),('proportion',18,.5,.01)]:
  z=norm.ppf((1+c)/2);v=sd*sd if kind=='mean' else p*(1-p);raw=z*z*v/e**2;n=math.ceil(raw)
  cases.append(['plan',[kind,sd,p,e,c],dict(raw=float(raw),n=n,achieved=float(z*math.sqrt(v/n)),halfN=math.ceil(4*raw))])
js="const E=require('./src/estimation-core.js');let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(s).map(([f,a])=>E[f](...a)))));"
results=json.loads(subprocess.run(['node','-e',js],input=json.dumps(cases),capture_output=True,text=True,check=True).stdout)
checks=0;max_t_rel=0
for (f,args,expected),actual in zip(cases,results):
 if isinstance(expected,dict):
  for k,v in expected.items():
   assert math.isclose(actual[k],v,rel_tol=2e-9,abs_tol=1e-9),(f,args,k,actual[k],v)
   checks+=1
 else:
  max_t_rel=max(max_t_rel,abs(actual-expected)/expected)
  assert math.isclose(actual,expected,rel_tol=2e-9,abs_tol=1e-9),(f,args,actual,expected)
  checks+=1
print(f'PASS: {len(cases)} calculator cases, {checks} scalar checks; maximum relative t-critical error={max_t_rel:.3g}')

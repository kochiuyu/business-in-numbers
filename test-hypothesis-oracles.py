"""Independent SciPy oracle for browser Class 6 mathematics.
Run from any working directory: python test-hypothesis-oracles.py.
Tests distribution grids, seeded randomized tests, directional tails, confidence
intervals, alpha-boundary power and variance-ratio swap invariance.
"""
import json
from pathlib import Path
import subprocess
import numpy as np
from scipy.stats import norm, t, f

ROOT = Path(__file__).resolve().parent
rng = np.random.default_rng(6102025)
cases, expected = [], []


def add(method,args,answer):
    cases.append({'method':method,'args':args})
    expected.append(answer)


def pvalue(distribution,stat,tail):
    return float(distribution.cdf(stat) if tail=='less' else distribution.sf(stat) if tail=='greater' else 2*min(distribution.cdf(stat),distribution.sf(stat)))


def base(stat,dist,tail,alpha):
    p=pvalue(dist,stat,tail)
    return {'stat':stat,'p':p,'reject':p<=alpha,
            'lower':None if tail=='greater' else dist.ppf(alpha/2 if tail=='two' else alpha),
            'upper':None if tail=='less' else dist.ppf(1-(alpha/2 if tail=='two' else alpha))}


for x in [-12,-8,-5,-2,0,.001,.5,2,5,8,12]:
    add('normalCdf',[x],norm.cdf(x))
for df in [1,2,2.7,7,15,40.855492956,100,1000,19998]:
    for x in [-20,-5,-1,-1e-5,-1e-8,-1e-12,0,1e-12,1e-8,1e-5,.5,3,10,30]:
        add('tCdf',[x,df],t.cdf(x,df))
for d1,d2 in [(2,2),(3,7),(17,21),(49,39),(39,49),(1999,1999)]:
    for x in [.0001,.05,.5,1,2,20,1000]:
        add('fCdf',[x,d1,d2],f.cdf(x,d1,d2))
        add('fSf',[x,d1,d2],f.sf(x,d1,d2))
for q in [.0005,.001,.025,.5,.975,.999,.9995]:
    add('zQuant',[q],norm.ppf(q))
    for df in [1,2.7,15,87.673,19998]:
        add('tQuant',[q,df],t.ppf(q,df))
    for d1,d2 in [(2,3),(17,21),(49,39),(1999,1999)]:
        add('fQuant',[q,d1,d2],f.ppf(q,d1,d2))

for iteration in range(24):
    n1,n2=map(int,rng.integers(3,200,size=2))
    s1,s2=map(float,rng.uniform(.2,20,size=2))
    m1,m2=map(float,rng.normal(40,5,size=2))
    delta=float(rng.normal(0,2))
    alpha=float(rng.choice([.001,.01,.05,.1,.2]))
    for tail in ['less','greater','two']:
        for method in ['z','t','wald']:
            se=s1/np.sqrt(n1); stat=(m1-m2)/se
            dist=t(n1-1) if method=='t' else norm()
            answer=base(stat,dist,tail,alpha)
            margin=dist.ppf(1-alpha/2)*se
            answer.update(se=se,ci=[m1-margin,m1+margin])
            add('mean',dict(method=method,mean=m1,mu0=m2,sd=s1,n=n1,tail=tail,alpha=alpha),answer)
        for method in ['pooled','welch']:
            pooled=((n1-1)*s1*s1+(n2-1)*s2*s2)/(n1+n2-2)
            a,b=s1*s1/n1,s2*s2/n2
            df=n1+n2-2 if method=='pooled' else (a+b)**2/(a*a/(n1-1)+b*b/(n2-1))
            se=np.sqrt(pooled*(1/n1+1/n2)) if method=='pooled' else np.sqrt(a+b)
            stat=(m1-m2-delta)/se
            answer=base(stat,t(df),tail,alpha)
            margin=t.ppf(1-alpha/2,df)*se
            answer.update(df=df,se=se,ci=[m1-m2-margin,m1-m2+margin])
            add('independent',dict(method=method,m1=m1,s1=s1,n1=n1,m2=m2,s2=s2,n2=n2,delta0=delta,tail=tail,alpha=alpha),answer)
        k=int(rng.integers(0,n1+1)); p0=float(rng.uniform(.01,.99))
        se=np.sqrt(p0*(1-p0)/n1); stat=(k/n1-p0)/se
        answer=base(stat,norm(),tail,alpha);answer['se']=se
        add('proportion',dict(k=k,n=n1,p0=p0,tail=tail,alpha=alpha),answer)
        k1,k2=int(rng.integers(1,n1)),int(rng.integers(1,n2))
        pooled=(k1+k2)/(n1+n2);effect=k1/n1-k2/n2
        se=np.sqrt(pooled*(1-pooled)*(1/n1+1/n2));stat=effect/se
        ci_se=np.sqrt(k1/n1*(1-k1/n1)/n1+k2/n2*(1-k2/n2)/n2)
        answer=base(stat,norm(),tail,alpha)
        answer.update(se=se,ciSE=ci_se,ci=[effect-norm.ppf(1-alpha/2)*ci_se,effect+norm.ppf(1-alpha/2)*ci_se])
        add('twoprop',dict(k1=k1,n1=n1,k2=k2,n2=n2,tail=tail,alpha=alpha),answer)
        stat=(s1/s2)**2;dist=f(n1-1,n2-1)
        answer=base(stat,dist,tail,alpha)
        answer['ci']=[stat/dist.ppf(1-alpha/2),stat/dist.ppf(alpha/2)]
        add('variance',dict(s1=s1,n1=n1,s2=s2,n2=n2,tail=tail,alpha=alpha),answer)
        if tail=='two':
            swap=base(1/stat,f(n2-1,n1-1),tail,alpha)
            assert np.isclose(swap['p'],answer['p'])
            add('variance',dict(s1=s2,n1=n2,s2=s1,n2=n1,tail=tail,alpha=alpha),swap)
        before=rng.normal(30,5,size=8);after=before-rng.normal(2,3,size=8)
        diff=before-after;se=diff.std(ddof=1)/np.sqrt(8);stat=(diff.mean()-delta)/se
        answer=base(stat,t(7),tail,alpha)
        answer.update(se=se,df=7)
        add('paired',dict(before=before.tolist(),after=after.tolist(),delta0=delta,tail=tail,alpha=alpha),answer)
        for mu1 in [m1,m2]:
            se=s1/np.sqrt(n1);c=norm.ppf(1-(alpha/2 if tail=='two' else alpha))
            lo=None if tail=='greater' else m1-c*se
            hi=None if tail=='less' else m1+c*se
            power=(0 if lo is None else norm.cdf((lo-mu1)/se))+(0 if hi is None else norm.sf((hi-mu1)/se))
            add('power',dict(mu0=m1,mu1=mu1,sd=s1,n=n1,tail=tail,alpha=alpha),dict(power=power,beta=1-power,lower=lo,upper=hi))

script="const H=require('./src/hypothesis-core.js');let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(s).map(c=>Array.isArray(c.args)?H[c.method](...c.args):H[c.method](c.args)))));"
actual=json.loads(subprocess.check_output(['node','-e',script],input=json.dumps(cases),text=True,cwd=ROOT))
checks=0
failures=[]
for index,(case,want,got) in enumerate(zip(cases,expected,actual)):
    items=want.items() if isinstance(want,dict) else [('value',want)]
    for key,value in items:
        observed=got[key] if isinstance(want,dict) else got
        if value is None or isinstance(value,bool):
            assert observed==value,(index,case,key,observed,value)
        else:
            if not np.allclose(observed,value,rtol=3e-8,atol=3e-10): failures.append((index,case,key,observed,value))
        checks+=1
assert not failures, failures[:20]
print(f'Passed {len(cases)} independent SciPy oracle cases and {checks} comparisons.')
print('Covered all three tails, z/t/Wald, pooled/Welch, paired, proportions, F swaps, fractional df, quantiles, CIs and power.')

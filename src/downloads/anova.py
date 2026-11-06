#!/usr/bin/env python3
"""Original business ANOVA examples. Run python3 anova.py; SciPy optional.
Classical inference assumes independent normal errors with equal variance.
Two-way model is balanced, replicated, and fixed-effects.
"""
import math
from statistics import mean
try:
    from scipy.stats import f as f_distribution
except ImportError:
    f_distribution=None
ONE_WAY=[[18,20,22,20],[22,24,26,24],[25,27,29,27]]
TWO_WAY=[[[18,20,22],[24,26,28]],[[22,24,26],[36,38,40]]]
PARALLEL=[[[v-2,v,v+2] for v in row] for row in [[20,26],[24,30]]]
CROSSOVER=[[[v-2,v,v+2] for v in row] for row in [[20,32],[32,20]]]
def validate(g):
    if not isinstance(g,(list,tuple)) or not 1<=len(g)<=10000: raise ValueError('Need 1–10000 numeric observations.')
    if any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or abs(x)>1e12 for x in g): raise ValueError('Every observation must be a finite number in [-1e12,1e12].')
def settings(alpha):
    if isinstance(alpha,bool) or not isinstance(alpha,(int,float)) or not 1e-6<=alpha<=.5: raise ValueError('alpha must be between 0.000001 and 0.5.')
def component(ss,df): return dict(ss=ss,df=df,ms=ss/df)
def test(row,error,alpha):
    f=row['ms']/error['ms'] if error['ms'] else (math.inf if row['ms'] else None)
    p=float(f_distribution.sf(f,row['df'],error['df'])) if f_distribution and f is not None else None
    if f==math.inf: p=0.
    crit=float(f_distribution.isf(alpha,row['df'],error['df'])) if f_distribution else None
    return dict(row,F=f,p=p,crit=crit,reject=p<=alpha if p is not None else None)
def one_way(groups=ONE_WAY,alpha=.05):
    settings(alpha)
    if not isinstance(groups,(list,tuple)) or not 2<=len(groups)<=30: raise ValueError('Need 2–30 groups.')
    for g in groups: validate(g)
    n=sum(map(len,groups));c=len(groups)
    if not c<n<=10000: raise ValueError('Need replication and at most 10000 observations.')
    values=[x for g in groups for x in g];grand=mean(values);means=list(map(mean,groups))
    within=component(sum((x-means[i])**2 for i,g in enumerate(groups) for x in g),n-c)
    between=test(component(sum(len(g)*(means[i]-grand)**2 for i,g in enumerate(groups)),c-1),within,alpha)
    total=component(sum((x-grand)**2 for x in values),n-1)
    return dict(n=n,c=c,means=means,grandMean=grand,between=between,within=within,total=total,eta2=between['ss']/total['ss'] if total['ss'] else None,omega2=(between['ss']-(c-1)*within['ms'])/(total['ss']+within['ms']) if total['ss'] else None)
def two_way(cells=TWO_WAY,alpha=.05):
    settings(alpha)
    if not isinstance(cells,(list,tuple)) or not 2<=len(cells)<=12: raise ValueError('Need 2–12 A levels.')
    if not isinstance(cells[0],(list,tuple)) or not 2<=len(cells[0])<=12: raise ValueError('Need 2–12 B levels.')
    validate(cells[0][0]);c=len(cells);r=len(cells[0]);m=len(cells[0][0]);n=c*r*m
    if not 2<=m<=1000 or n>10000: raise ValueError('Need 2–1000 replicates and at most 10000 observations.')
    for row in cells:
        if not isinstance(row,(list,tuple)) or len(row)!=r: raise ValueError('Every A level needs all B levels.')
        for cell in row:
            validate(cell)
            if len(cell)!=m: raise ValueError('Equal replication required.')
    values=[x for row in cells for cell in row for x in cell];grand=mean(values)
    cm=[list(map(mean,row)) for row in cells];ma=list(map(mean,cm));mb=[mean(row[j] for row in cm) for j in range(r)]
    additive=[[a+b-grand for b in mb] for a in ma]
    interaction=[[cm[i][j]-additive[i][j] for j in range(r)] for i in range(c)]
    error=component(sum((x-cm[i][j])**2 for i,row in enumerate(cells) for j,cell in enumerate(row) for x in cell),c*r*(m-1))
    return dict(n=n,c=c,r=r,m=m,grandMean=grand,cellMeans=cm,meansA=ma,meansB=mb,additive=additive,interactions=interaction,A=test(component(r*m*sum((a-grand)**2 for a in ma),c-1),error,alpha),B=test(component(c*m*sum((b-grand)**2 for b in mb),r-1),error,alpha),AB=test(component(m*sum(v*v for row in interaction for v in row),(c-1)*(r-1)),error,alpha),error=error,total=component(sum((x-grand)**2 for x in values),n-1))
def display(name,result):
    print('\n'+name);print('Grand mean:',result['grandMean'])
    for key in ['between','within','A','B','AB','error','total']:
        if key in result: print(key,result[key])
    if 'omega2' in result: print('eta squared:',result['eta2'],'omega squared:',result['omega2'])
if __name__=='__main__':
    if f_distribution is None: print('SciPy not installed: SS, df, MS and F computed; p-values and critical values unavailable. Optional: pip install scipy')
    display('Processing minutes: one-way ANOVA',one_way())
    display('Campaign spend dollars: two-way ANOVA',two_way())
    display('Parallel cell means',two_way(PARALLEL))
    display('Crossover cell means',two_way(CROSSOVER))
    print('\nAn omnibus rejection does not identify every differing pair. Non-rejection does not prove equality.')

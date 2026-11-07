"""Independent numerical and structural checks of the shipped JavaScript models."""
import subprocess, json, math
from pathlib import Path
from scipy import stats
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
cases=[]
for n in [1,2,12,60]:
 for p in [0,.01,.25,.5,.99,1]: cases.append(['binomial',dict(n=n,p=p)])
for lam in [.001,.1,1,4,30]:cases.append(['poisson',dict(lambda_=lam)])
for N in [2,10,40,100]:
 for K in [0,1,N//2,N]:
  for n in [0,1,N//2,N]:cases.append(['hypergeometric',dict(N=N,K=K,n=n)])
js="const R=require('./src/random-core');const cases="+json.dumps(cases)+"; console.log(JSON.stringify({data:cases.map(([m,p])=>R.discrete(m, {...p,lambda:p.lambda_})),normal:Array.from({length:1601},(_,i)=>R.normalCdf((i-800)/100)),svgs:[R.discreteSvg(R.discrete('binomial'),3),R.discreteSvg(R.discrete('poisson'),3,'cdf'),R.continuousSvg(R.continuous('uniform'),3,5),R.continuousSvg(R.continuous('normal'),496,504)]}));"
r=json.loads(subprocess.check_output(['node','-e',js],text=True));count=0
for (model,p),d in zip(cases,r['data']):
 law=stats.binom(p['n'],p['p']) if model=='binomial' else stats.poisson(p['lambda_']) if model=='poisson' else stats.hypergeom(p['N'],p['K'],p['n'])
 for x,m,c in zip(d['x'],d['mass'],d['cumulative']):
  assert math.isclose(m,law.pmf(x),abs_tol=1e-12),(model,p,x,m,law.pmf(x))
  assert math.isclose(c,law.cdf(x),abs_tol=1e-12),(model,p,x,c,law.cdf(x));count+=2
for i,v in enumerate(r['normal']):assert abs(v-stats.norm.cdf((i-800)/100))<8e-8;count+=1
for svg in r['svgs']:ET.fromstring(svg)
class Structure(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.refs=[];self.svg=0;self.math=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if 'aria-labelledby' in a:self.refs+=a['aria-labelledby'].split()
  if tag=='svg':self.svg+=1
  if tag=='math':self.math+=1
s=Structure();s.feed(Path('dist/random-variables.html').read_text());assert len(s.ids)==len(set(s.ids));assert all(x in s.ids for x in s.refs);assert s.svg>=7;assert s.math==47
print(f'Passed {count} SciPy oracle comparisons, 4 SVG parses, all ID references, 7 diagrams and 47 MathML formulas.')

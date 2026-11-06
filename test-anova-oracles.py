"""Independent SciPy/numpy least-squares oracles; does not import the downloadable code."""
import json, subprocess
import numpy as np
from scipy import stats
rng=np.random.default_rng(7914)
def js(method,data):
    code='const A=require("./src/anova-core");console.log(JSON.stringify(A.'+method+'('+json.dumps(data)+')));'
    return json.loads(subprocess.check_output(['node','-e',code],text=True))
def close(a,b): np.testing.assert_allclose(a,b,rtol=2e-9,atol=2e-10)
cases=[[[18,20,22,20],[22,24,26,24],[25,27,29,27]]]
for _ in range(35): cases.append([rng.normal(i*2,1.2,int(rng.integers(2,15))).tolist() for i in range(int(rng.integers(2,7)))])
for data in cases:
    d=js('oneWay',data); f,p=stats.f_oneway(*data);close(d['F'],f);close(d['p'],p);close(d['crit'],stats.f.isf(.05,len(data)-1,sum(map(len,data))-len(data)))
    if len(data)==2: close(d['F'],stats.ttest_ind(*data,equal_var=True).statistic**2)
for shape in [(2,2,3),(3,2,4),(4,3,5)]:
    data=rng.normal(size=shape)+np.arange(shape[0])[:,None,None]*2+np.arange(shape[1])[None,:,None]
    d=js('twoWay',data.tolist())
    # Independent nested least-squares projection oracle (dummy-coded design).
    indices=[(i,j) for i in range(shape[0]) for j in range(shape[1]) for k in range(shape[2])]
    ones=np.ones((len(indices),1))
    xa=np.array([[int(i==a) for a in range(1,shape[0])] for i,j in indices])
    xb=np.array([[int(j==b) for b in range(1,shape[1])] for i,j in indices])
    xab=np.array([[int(i==a and j==b) for a in range(1,shape[0]) for b in range(1,shape[1])] for i,j in indices])
    y=data.ravel()
    def rss(*columns):
        x=np.column_stack((ones,*columns)); return np.sum((y-x@np.linalg.lstsq(x,y,rcond=None)[0])**2)
    e=rss(xa,xb,xab); additive=rss(xa,xb)
    ss={'A':rss(xb)-additive,'B':rss(xa)-additive,'AB':additive-e}
    for key in ['A','B','AB']:
        close(d[key]['ss'],ss[key]); f=(ss[key]/d[key]['df'])/(e/d['error']['df'])
        close(d[key]['F'],f);close(d[key]['p'],stats.f.sf(f,d[key]['df'],d['error']['df']))
    close(d['error']['ss'],e)
print('SciPy/numpy least-squares ANOVA oracles passed: 36 one-way cases, balanced 2×2×3, 3×2×4 and 4×3×5.')

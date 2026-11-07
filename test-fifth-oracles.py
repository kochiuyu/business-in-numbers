"""Independent calculations for design, comparison and intervention examples."""
import math
from pathlib import Path
import numpy as np
from scipy import stats

for stores, receipts, expected in [(4,25,8.352),(4,100,7.488),(16,25,2.088)]:
    n=stores*receipts
    covariance=np.eye(n)*115.2
    for store in range(stores):
        a,b=store*receipts,(store+1)*receipts
        covariance[a:b,a:b]+=28.8
    # Blocks are independent; checking one identical store block verifies positivity.
    assert np.linalg.eigvalsh(covariance[:receipts,:receipts]).min()>0
    assert math.isclose(covariance.sum()/n**2,expected,rel_tol=1e-12)
    assert math.isclose(covariance[0,1]/covariance[0,0],.2)
    assert covariance[0,receipts]==0

groups=np.array([[18,20,22,20],[22,24,26,24],[25,27,29,27]])
means=groups.mean(axis=1)
msw=((groups-means[:,None])**2).sum()/9
se=math.sqrt(msw/2)
critical=stats.t.ppf(1-.05/6,9)
margin=critical*se
assert math.isclose(margin,3.3871109040862732,rel_tol=1e-12)
html=Path('src/anova.html').read_text()
for i,j in [(1,0),(2,0),(2,1)]:
    difference=means[i]-means[j]
    bounds=[difference-margin,difference+margin]
    for endpoint in bounds:
        printed=f'{endpoint:.4f}'.replace('-','−')
        assert printed in html, printed
    # Bonferroni-adjusted two-sided p-value yields the same zero-exclusion decision.
    adjusted=min(1,3*2*stats.t.sf(abs(difference/se),9))
    assert (adjusted<=.05)==(bounds[0]>0 or bounds[1]<0)
assert 4-margin<3 and 7-margin>3
print('Fifth independent oracles passed: valid cluster covariance, three simultaneous intervals and threshold interpretation.')

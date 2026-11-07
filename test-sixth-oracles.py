"""Independent numerical checks of data-quality and notation bridges."""
import math
import numpy as np
from scipy import stats
from pathlib import Path

d=np.array([3,4,0,5,4,1,3,4],dtype=float)
assert d.mean()==3 and ((d-d.mean())**2).sum()==20
result=stats.ttest_1samp(d,0)
assert math.isclose(result.statistic,5.019960159204453)
assert math.isclose(result.pvalue,0.001530521555676081)
assert stats.sem(d).round(4)==.5976
assert d.std(ddof=1).round(4)==1.6903
for df in [7,15,30]:
 assert math.isclose(stats.t.isf(.025,df),stats.t.ppf(.975,df))
 assert math.isclose(stats.t.ppf(.025,df),-stats.t.ppf(.975,df))
assert round(stats.norm.ppf(.975),2)==1.96
assert round(stats.norm.ppf(.025),2)==-1.96
possible=(48+np.arange(41))/100
assert possible[0]==.48 and possible[-1]==.88
assert np.allclose(np.diff(possible),.01)
assert math.isclose(np.nanmean([0,4,6,np.nan]),10/3)
assert np.mean([0,4,6,0])==2.5
assert np.mean([0,4,6,8])==4.5
print('Sixth independent NumPy/SciPy oracles passed: missing-data means, finite-population bounds, paired t and quantile conventions.')

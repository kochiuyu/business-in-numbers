import importlib.util, subprocess, sys
import numpy as np
from scipy import stats
spec=importlib.util.spec_from_file_location('anova','src/downloads/anova.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
d=a.one_way();np.testing.assert_allclose(d['between']['F'],18.5);np.testing.assert_allclose(d['between']['p'],stats.f.sf(18.5,2,9))
t=a.two_way();assert t['A']['F']==48 and t['B']['F']==75 and t['AB']['F']==12
assert a.two_way(a.PARALLEL)['AB']['F']==0
assert a.two_way(a.CROSSOVER)['A']['F']==0
assert a.one_way([[2,2],[2,2]])['between']['F'] is None
assert a.one_way([[2,2],[3,3]])['between']['F']==float('inf')
a.f_distribution=None;assert a.one_way()['between']['p'] is None;assert a.two_way()['AB']['F']==12
for v in ['',None,float('nan'),True]:
    try: a.one_way([[1,2],[v,3]]);raise AssertionError('invalid accepted')
    except ValueError: pass
# -S suppresses installed packages: real standard-library-only execution.
out=subprocess.check_output([sys.executable,'-S','src/downloads/anova.py'],text=True)
assert 'SciPy not installed' in out and 'Crossover' in out
print('Downloadable Python normal and standard-library-only modes passed.')

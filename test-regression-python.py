"""Run python3 test-regression-python.py from the project directory."""
import builtins
import contextlib
import importlib.util
import io
import math
from pathlib import Path
import subprocess
import sys
import unittest
ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT/'src/downloads/regression.py'

def load(block_scipy=False):
    spec = importlib.util.spec_from_file_location('regression_example', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    original = builtins.__import__
    def guarded(name, *args, **kwargs):
        if name == 'scipy' or name.startswith('scipy.'):
            raise ImportError('Simulated missing optional SciPy')
        return original(name, *args, **kwargs)
    try:
        if block_scipy:
            builtins.__import__ = guarded
        spec.loader.exec_module(module)
    finally:
        builtins.__import__ = original
    return module

class RegressionTests(unittest.TestCase):
    def test_algebra_with_and_without_scipy(self):
        for blocked in (False, True):
            m = load(blocked); r = m.fit()
            for key, expected in dict(slope=27/14, intercept=247/28, SSE=81/14,
                                      SSR=2187/14, SST=162, MSE=27/28,
                                      F=162, R2=27/28, prediction=17.5).items():
                self.assertAlmostEqual(r[key], expected, places=10)
            self.assertAlmostEqual(sum(r['residuals']), 0, places=10)
            self.assertAlmostEqual(sum(x*e for x,e in zip(m.X,r['residuals'])),0,places=10)
            self.assertAlmostEqual(r['SSR']+r['SSE'],r['SST'],places=10)
            self.assertAlmostEqual(r['t_slope']**2,r['F'],places=10)
            self.assertAlmostEqual(r['se_prediction']**2-r['se_mean']**2,r['MSE'])
            if blocked:
                self.assertFalse(r['inference_available'])
                for key in ('p_slope','p_intercept','p_F','slope_CI','intercept_CI',
                            'mean_CI','individual_PI','t_critical'):
                    self.assertIsNone(r[key])
                stream=io.StringIO()
                with contextlib.redirect_stdout(stream): m.display(r)
                self.assertIn('p-values and intervals unavailable',stream.getvalue())
    def test_scipy_inference(self):
        m=load()
        if m.t_distribution is None: self.skipTest('Optional SciPy not installed')
        r=m.fit()
        self.assertAlmostEqual(r['p_F'],1.443044997e-5,places=13)
        self.assertAlmostEqual(r['p_F'],r['p_slope'],places=13)
        for key, expected in [('mean_CI',(16.65047493,18.34952507)),
                              ('individual_PI',(14.9514248,20.0485752)),
                              ('slope_CI',(1.557808294,2.299334563))]:
            for got,want in zip(r[key],expected): self.assertAlmostEqual(got,want,places=7)
    def test_saved_output(self):
        m=load()
        if m.t_distribution is None: self.skipTest('Saved output requires optional SciPy')
        actual=subprocess.check_output([sys.executable,str(SCRIPT)],text=True)
        self.assertEqual(actual,(ROOT/'src/downloads/regression-output.txt').read_text())
    def test_validation(self):
        m=load(True)
        for kwargs in [dict(x=[1,2]),dict(y=[1]*8),dict(x=[1]*8),dict(alpha=0),
                       dict(alpha=True),dict(x0=math.nan),dict(x0=True),
                       dict(x=[1,2,3],y=[2,4,6]),dict(y=[None]*8),
                       dict(x='123'),dict(x0=math.inf),dict(alpha=.9)]:
            with self.assertRaises(ValueError): m.fit(**kwargs)

if __name__=='__main__': unittest.main(verbosity=2)

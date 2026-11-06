"""Run all Class 3 scripts, check saved output, and test independent oracles."""
from pathlib import Path
import importlib.util
from math import comb, exp, isclose, sqrt
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import scipy
from scipy.stats import binom, expon, hypergeom, norm, poisson, uniform, chi2, t, f

ROOT = Path(__file__).resolve().parent
EXAMPLES = ROOT / "src" / "random-examples"
for name in ("moments", "discrete", "continuous", "reference"):
    result = subprocess.run([sys.executable, str(EXAMPLES / f"{name}.py")],
                            check=True, capture_output=True, text=True)
    assert result.stdout == (EXAMPLES / f"{name}.txt").read_text(), name
spec = importlib.util.spec_from_file_location("moments", EXAMPLES / "moments.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
mean, variance = module.moments([0, 1, 2, 3], [.1, .3, .4, .2])
assert isclose(mean, 1.7) and isclose(variance, .81)
assert all(isclose(a, b) for a, b in zip(module.moments([5, 25, 45, 65], [.1,.3,.4,.2]), (39,324)))
for x, p in [([], []), ([0], [.9]), ([0], [-1]), ([float('nan')], [1]), ([0,1], [1])]:
    try:
        module.moments(x, p)
    except ValueError:
        pass
    else:
        raise AssertionError("Invalid distribution accepted")
assert isclose(binom.pmf(3,12,.25), comb(12,3)*.25**3*.75**9)
assert isclose(poisson.pmf(0,2), exp(-2))
assert isclose(hypergeom.pmf(2,40,8,6), comb(8,2)*comb(32,4)/comb(40,6))
assert isclose(hypergeom.var(40,8,6), 6*.2*.8*(40-6)/(40-1))
assert isclose(uniform.cdf(5,2,6)-uniform.cdf(3,2,6), 1/3)
assert isclose(expon.sf(15,scale=10), exp(-1.5))
assert isclose(norm.cdf(504,500,4)-norm.cdf(496,500,4), .6826894921370859)
assert isclose(norm.ppf(.95,500,4), 506.5794145078059)
for law in [norm(), expon(scale=10), chi2(9), t(9), f(5,10)]:
    assert isclose(law.sf(law.isf(.05)), .05, rel_tol=1e-10)
    assert isclose(law.cdf(law.ppf(.95)), .95, rel_tol=1e-10)
for law in [binom(12,.25), poisson(4), hypergeom(40,8,6)]:
    k = law.ppf(.95)
    assert law.cdf(k) >= .95 and law.cdf(k-1) < .95
with tempfile.TemporaryDirectory() as temporary:
    result = subprocess.run([sys.executable, str(EXAMPLES / "plots.py"), "--output-dir", temporary],
                            check=True, capture_output=True, text=True)
    assert result.stdout == (EXAMPLES / "plots.txt").read_text()
    fragment = (ROOT / "src" / "random-tools.html").read_text()
    for name in ("chisquare", "studentt", "fdistribution"):
        svg = (Path(temporary) / f"{name}.svg").read_text()
        assert svg == (EXAMPLES / "plots" / f"{name}.svg").read_text()
        assert svg in fragment
        tree = ET.fromstring(svg)
        ns = {"svg": "http://www.w3.org/2000/svg"}
        assert tree.find("svg:title", ns).text and tree.find("svg:desc", ns).text
        curves = [p for p in tree.findall("svg:path", ns) if p.get("stroke-width") == "2.6"]
        assert len(curves) == 3 and all(p.get("d").count("L") == 500 for p in curves)
print(f"PASS: 5 saved outputs, 3 deterministic accessible SVGs, validation, math oracles, and tail/quantile checks (SciPy {scipy.__version__})")

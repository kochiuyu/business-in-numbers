"""Class 5: sample-size planning from a target margin of error.

Run: python planning.py (requires NumPy and SciPy).
Use independent observations, no finite-population correction, and a two-sided
95% interval. Mean planning assumes known sigma and normal/large-sample inference.
Proportion planning uses the normal approximation: achieved margins are planning
approximations, not guaranteed widths of a future Wilson or other interval.
"""
from math import ceil
import numpy as np
from scipy.stats import norm


def main():
    confidence = 0.95
    z = norm.ppf((1+confidence)/2)
    print(f"Confidence={confidence:.2f}; normal critical value={z:.9f}")
    sigma, target = 18, 3
    raw = (z*sigma/target)**2
    n = ceil(raw)
    achieved = z*sigma/np.sqrt(n)
    print(f"\nMean: known sigma={sigma}, target margin={target}")
    print(f"Unrounded n={raw:.6f}; round UP to n={n}")
    print(f"Achieved margin={achieved:.6f}; margin at n-1={z*sigma/np.sqrt(n-1):.6f}")
    assert achieved <= target
    target = 0.04
    for p0 in [0.24, 0.5]:
        raw = z*z*p0*(1-p0)/(target*target)
        n = ceil(raw)
        achieved = z*np.sqrt(p0*(1-p0)/n)
        print(f"\nProportion: planning p0={p0:.2f}, target margin={target:.2f}")
        print(f"Unrounded n={raw:.6f}; round UP to n={n}")
        print(f"Achieved approximate margin={achieved:.6f}; at n-1={z*np.sqrt(p0*(1-p0)/(n-1)):.6f}")
        assert achieved <= target
    print("p0=0.5 is conservative because p(1-p) is maximized at 0.5.")
    print("Planning at p0=0.24 depends on that guess; a true rate closer to 0.5 needs more observations.")
    baseline = 1000
    first = z*np.sqrt(0.25/baseline)
    second = z*np.sqrt(0.25/(4*baseline))
    print(f"\nConservative n={baseline}: approximate margin={first:.6f} ({100*first:.4f} percentage points)")
    print(f"Conservative n={4*baseline}: approximate margin={second:.6f} ({100*second:.4f} percentage points)")
    print("At fixed confidence and variance, halving the margin requires four times the sample size.")


if __name__ == "__main__":
    main()

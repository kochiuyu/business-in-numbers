"""Class 5: seeded Monte Carlo demonstration of confidence-interval coverage.

Run: python coverage.py (requires NumPy and SciPy).
Independent repetitions each draw n=16 iid normal observations, mu=50, sigma=12.
Normality makes both the known-sigma z and unknown-sigma t procedures exact.
Monte Carlo SE measures simulation error across repetitions, not data-level SE.
The two methods share samples: their coverage estimates are paired, not independent.
"""
import numpy as np
from scipy.stats import norm, t


def main():
    seed, repetitions, n = 20261106, 20000, 16
    mu, sigma, confidence = 50.0, 12.0, 0.95
    rng = np.random.default_rng(seed)
    samples = rng.normal(mu, sigma, size=(repetitions, n))
    means = samples.mean(axis=1)
    z = norm.ppf((1+confidence)/2)
    critical_t = t.ppf((1+confidence)/2, df=n-1)
    z_margins = np.full(repetitions, z*sigma/np.sqrt(n))
    t_margins = critical_t*samples.std(axis=1, ddof=1)/np.sqrt(n)
    print(f"Seed={seed}; repetitions={repetitions}; n={n}; normal mu={mu:g}, sigma={sigma:g}")
    print(f"Nominal confidence={confidence:.2f}; z critical={z:.9f}; t critical(df={n-1})={critical_t:.9f}")
    for name, margins in [("Known-sigma z", z_margins), ("Unknown-sigma t", t_margins)]:
        count = np.count_nonzero((means-margins <= mu) & (mu <= means+margins))
        coverage = count/repetitions
        mc_se = np.sqrt(coverage*(1-coverage)/repetitions)
        low, high = coverage-z*mc_se, coverage+z*mc_se
        print(f"{name}: covered={count}/{repetitions}; coverage={coverage:.6f}; MC SE={mc_se:.6f}")
        print(f"  Approximate 95% Monte Carlo uncertainty interval=[{low:.6f}, {high:.6f}]")
        print(f"  Average interval width={2*margins.mean():.6f}")
    print("MC SE = sqrt(observed coverage * (1-observed coverage) / repetitions).")
    print("These uncertainty intervals concern simulated coverage, not the population mean.")
    print("Theoretical coverage is 0.95 here; finite simulation results need not equal 0.95.")
    print("Repetitions are independent; z and t results within each repetition are paired.")


if __name__ == "__main__":
    main()

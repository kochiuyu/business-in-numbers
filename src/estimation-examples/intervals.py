"""Class 5: confidence intervals for means and a binary conversion rate.

Run: python intervals.py (requires NumPy and SciPy).
Observations must be independent and representative. The z mean interval is
exact for normal observations with known population sigma; the t interval is
exact for normal observations with unknown sigma. Other distributions require
appropriate large-sample justification. Wald and Wilson are approximate
binomial intervals; Wilson avoids zero width at zero observed successes.
"""
import numpy as np
from scipy.stats import norm, t


def wilson(successes, n, confidence=0.95):
    z = norm.ppf((1 + confidence) / 2)
    p = successes / n
    denominator = 1 + z*z/n
    center = (p + z*z/(2*n)) / denominator
    half_width = z * np.sqrt(p*(1-p)/n + z*z/(4*n*n)) / denominator
    return max(0.0, center-half_width), min(1.0, center+half_width)


def main():
    confidence = 0.95
    z = norm.ppf((1+confidence)/2)
    mean, sigma, n = 72, 18, 81
    se = sigma / np.sqrt(n)
    me = z * se
    print(f"95% normal critical value = {z:.9f}")
    print(f"Order value: mean={mean}, known sigma={sigma}, n={n}")
    print(f"SE={se:.6f}; margin={me:.6f}; z interval=[{mean-me:.6f}, {mean+me:.6f}]")
    mean, s, n = 47, 8, 16
    critical_t = t.ppf((1+confidence)/2, df=n-1)
    se = s / np.sqrt(n)
    me = critical_t * se
    print(f"\nRepair time: mean={mean}, sample s={s}, n={n}, df={n-1}")
    print(f"95% t critical value = {critical_t:.9f}")
    print(f"SE={se:.6f}; margin={me:.6f}; t interval=[{mean-me:.6f}, {mean+me:.6f}]")
    successes, n = 48, 200
    p = successes/n
    me = z*np.sqrt(p*(1-p)/n)
    lower, upper = wilson(successes, n, confidence)
    print(f"\nConversion: {successes}/{n}, p-hat={p:.6f}")
    print(f"Wald interval=[{p-me:.6f}, {p+me:.6f}]")
    print(f"Wilson interval=[{lower:.6f}, {upper:.6f}]")
    lower, upper = wilson(0, n, confidence)
    print(f"Zero-success case, 0/{n}: Wald=[0, 0], Wilson=[{lower:.6f}, {upper:.6f}]")
    print("Zero observed successes do not imply zero uncertainty; prefer Wilson over Wald near boundaries.")
    print("95% confidence describes long-run coverage of this interval procedure, not a 95% probability")
    print("assigned to the fixed parameter after observing this particular interval.")


if __name__ == "__main__":
    main()

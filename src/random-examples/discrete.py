#!/usr/bin/env python3
"""Synthetic counts; Python 3.10+ and SciPy. Run: python discrete.py"""
from scipy.stats import binom, hypergeom, poisson


def main():
    # Independent trials with a fixed conversion probability.
    orders = binom(n=12, p=0.25)
    print("Binomial: 12 independent leads, conversion probability .25")
    print(f"P(X = 3) = {orders.pmf(3):.6f}")
    print(f"P(X <= 3) = {orders.cdf(3):.6f}")
    # sf(k) = P(X > k), so at least 4 is sf(3), NOT sf(4).
    print(f"P(X >= 4) = {orders.sf(3):.6f}")
    print(f"E[X] = {orders.mean():.6f}; Var(X) = {orders.var():.6f}")
    print(f"Smallest k with P(X <= k) >= .95: {orders.ppf(.95):.0f}")
    # Homogeneous independent arrivals, rate 4 per hour; half-hour mean = 2.
    calls = poisson(mu=4)
    print("Poisson: mean 4 calls per hour")
    print(f"P(X = 3) = {calls.pmf(3):.6f}; P(X >= 6) = {calls.sf(5):.6f}")
    print(f"P(no calls in half an hour) = {poisson.pmf(0, mu=4 * .5):.6f}")
    # SciPy: M = population size, n = successes in population, N = draws.
    sample = hypergeom(M=40, n=8, N=6)
    print("Hypergeometric: 6 items without replacement, 8 defective among 40")
    print(f"P(X = 2) = {sample.pmf(2):.6f}; P(X >= 1) = {sample.sf(0):.6f}")
    print(f"E[X] = {sample.mean():.6f}; Var(X) = {sample.var():.6f}")


if __name__ == "__main__":
    main()

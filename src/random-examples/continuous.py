#!/usr/bin/env python3
"""Synthetic waits and fill quantities; Python 3.10+ and SciPy."""
from scipy.stats import expon, norm, uniform


def main():
    # SciPy scale is interval width, NOT upper endpoint.
    wait = uniform(loc=2, scale=8 - 2)
    print("Uniform wait from 2 to 8 minutes")
    print(f"P(3 <= X <= 5) = {wait.cdf(5) - wait.cdf(3):.6f}")
    print(f"E[X] = {wait.mean():.6f}; Var(X) = {wait.var():.6f}")
    print(f"Density at 4 = {wait.pdf(4):.6f} per minute; P(X = 4) = 0")
    # Exponential scale is the MEAN: 1/rate, in minutes here.
    rate = 0.1
    arrival = expon(scale=1 / rate)
    print("Exponential wait: rate .1 per minute, mean 10 minutes")
    print(f"P(X <= 5) = {arrival.cdf(5):.6f}; P(X > 15) = {arrival.sf(15):.6f}")
    print(f"95th percentile = {arrival.ppf(.95):.6f} minutes")
    # Normal scale is standard deviation, not variance.
    fill = norm(loc=500, scale=4)
    print("Normal fill: mean 500 mL, standard deviation 4 mL")
    print(f"P(496 <= X <= 504) = {fill.cdf(504) - fill.cdf(496):.6f}")
    print(f"P(X > 504) = {fill.sf(504):.6f}")
    print(f"95th percentile = {fill.ppf(.95):.6f} mL")
    print(f"Z scores at bounds: {(496 - 500) / 4:.0f}, {(504 - 500) / 4:.0f}")


if __name__ == "__main__":
    main()

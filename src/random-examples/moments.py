#!/usr/bin/env python3
"""Synthetic orders per customer. Python 3.10+, standard library only."""
from math import isclose, isfinite, sqrt


def moments(values, probabilities):
    if not values or len(values) != len(probabilities):
        raise ValueError("Use equal, nonempty value and probability lists.")
    if not all(isfinite(x) for x in values):
        raise ValueError("Values must be finite.")
    if not all(isfinite(p) and 0 <= p <= 1 for p in probabilities):
        raise ValueError("Probabilities must be finite and in [0, 1].")
    if not isclose(sum(probabilities), 1, rel_tol=0, abs_tol=1e-12):
        raise ValueError("Probabilities must sum to 1.")
    mean = sum(x * p for x, p in zip(values, probabilities))
    variance = sum((x - mean) ** 2 * p for x, p in zip(values, probabilities))
    return mean, variance


def main():
    x, p = [0, 1, 2, 3], [0.1, 0.3, 0.4, 0.2]
    mean, variance = moments(x, p)
    print("Synthetic orders X: 0, 1, 2, 3; probabilities: .1, .3, .4, .2")
    print(f"E[X] = {mean:.6f}; Var(X) = {variance:.6f}; SD(X) = {sqrt(variance):.6f}")
    # Revenue Y = fixed fee 5 + 20 per order. Variance has squared units.
    revenue_mean, revenue_variance = moments([5 + 20 * v for v in x], p)
    print(f"Y = 5 + 20X: E[Y] = {revenue_mean:.6f}; Var(Y) = {revenue_variance:.6f}")
    print(f"P(X <= 1) = {sum(w for v, w in zip(x, p) if v <= 1):.6f}")
    print(f"P(X >= 2) = {sum(w for v, w in zip(x, p) if v >= 2):.6f}")


if __name__ == "__main__":
    main()

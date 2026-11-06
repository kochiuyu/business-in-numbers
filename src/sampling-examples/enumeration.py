#!/usr/bin/env python3
"""Exact sampling laws for equally likely $10, $20, $30 service credits."""
from itertools import product
from collections import Counter
import numpy as np


def main():
    population = np.array([10., 20., 30.])
    mu, variance = population.mean(), population.var(ddof=0)
    print(f"Population mean=${mu:.6f}; variance={variance:.6f}; SD=${variance**.5:.6f}")
    print("Independent draws WITH replacement; ordered samples are equally likely.")
    for n in range(1, 6):
        # Integer sums keep equal outcomes together without floating-point keys.
        counts = Counter(sum(draw) for draw in product((10, 20, 30), repeat=n))
        sums = np.array(sorted(counts))
        means = sums / n
        probabilities = np.array([counts[k] for k in sums]) / 3**n
        expectation = np.dot(means, probabilities)
        var_mean = np.dot((means-expectation)**2, probabilities)
        assert np.isclose(probabilities.sum(), 1)
        assert np.isclose(expectation, mu)
        assert np.isclose(var_mean, variance/n)
        print(f"\nn={n}; ordered samples={3**n}; E[mean]={expectation:.6f}; Var(mean)={var_mean:.6f}; SE={var_mean**.5:.6f}")
        print("mean : count / total = probability")
        for total, mean, probability in zip(sums, means, probabilities):
            print(f"{mean:9.6f} : {counts[total]:3d} / {3**n} = {probability:.6f}")
    print("Checks passed: probabilities sum to 1, E[mean]=20, Var(mean)=(200/3)/n.")


if __name__ == '__main__':
    main()

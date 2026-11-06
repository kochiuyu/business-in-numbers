#!/usr/bin/env python3
"""Known-SD delivery mean and exact/approximate conversion count tails."""
from math import sqrt, isclose
from scipy.stats import norm, binom


def main():
    mu, sigma, n, cutoff = 40., 12., 36, 37.
    se = sigma/sqrt(n)
    z = (cutoff-mu)/se
    tail = norm.cdf(z)
    print(f'Delivery mean: SE={se:.6f}; z={z:.6f}; left tail={tail:.9f}')
    print('Exact for independent normal deliveries; a CLT approximation otherwise.')
    assert isclose(tail, .06680720126885807, abs_tol=1e-12)
    n, pi = 80, .3
    mean_count, sd_count = n*pi, sqrt(n*pi*(1-pi))
    se_prop = sqrt(pi*(1-pi)/n)
    exact = binom.cdf(19, n, pi)
    corrected = norm.cdf(19.5, loc=mean_count, scale=sd_count)
    uncorrected = norm.cdf(20, loc=mean_count, scale=sd_count)
    print(f'\nConversion: n*pi={n*pi:.0f}; n*(1-pi)={n*(1-pi):.0f}')
    print(f'E[K]={mean_count:.6f}; SD(K)={sd_count:.6f}; E[p_hat]={pi:.6f}; SE(p_hat)={se_prop:.6f}')
    print('Fewer than 20 means K<20, or K<=19, or p_hat<0.25.')
    print(f'Exact Binomial P(K<=19) = {exact:.9f}')
    print(f'Continuity-corrected normal at 19.5 = {corrected:.9f}; absolute error={abs(corrected-exact):.9f}')
    print(f'Uncorrected normal at 20 = {uncorrected:.9f}; absolute error={abs(uncorrected-exact):.9f}')
    print(f'Wrong event P(K<=20) = {binom.cdf(20,n,pi):.9f}')
    assert abs(corrected-exact) < abs(uncorrected-exact)
    assert isclose(norm.cdf(19.5/n, pi, se_prop), corrected, abs_tol=1e-12)


if __name__ == '__main__':
    main()

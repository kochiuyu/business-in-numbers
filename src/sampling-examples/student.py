#!/usr/bin/env python3
"""Studentized inference under independent normal sampling, not prediction."""
from math import sqrt, isclose
from scipy.stats import t, norm


def main():
    n, observed_mean, sample_sd, benchmark = 16, 47., 8., 50.
    estimated_se = sample_sd/sqrt(n)
    statistic = (observed_mean-benchmark)/estimated_se
    df = n-1
    left = t.cdf(statistic, df)
    two = 2*t.sf(abs(statistic), df)
    print(f'n={n}; mean={observed_mean:.6f}; sample SD={sample_sd:.6f}; estimated SE={estimated_se:.6f}')
    print(f'T={statistic:.6f}; df={df}; left-tail p={left:.9f}; two-sided p={two:.9f}')
    print('These are null-reference tail areas for the studentized statistic.')
    print('They are NOT the probability that mu<50 or a predictive probability for a future raw mean.')
    assert isclose(statistic, -1.5) and isclose(two, 2*left)
    print('\nPositive cutoffs c with P(-c<T<c)=1-alpha; each tail has alpha/2.')
    print(' df       alpha=.10     alpha=.05     alpha=.01')
    for df in (1, 2, 5, 10, 15, 20, 30, 60, 120, 1000):
        cutoffs = t.isf([.05, .025, .005], df)
        print(f'{df:4d}      '+ '      '.join(f'{v:.6f}' for v in cutoffs))
        assert all(isclose(2*t.sf(c,df),a,abs_tol=1e-10) for c,a in zip(cutoffs,(.1,.05,.01)))
    print('Normal    '+ '      '.join(f'{v:.6f}' for v in norm.isf([.05,.025,.005])))
    print('At df=15, 1.340606 < |T|=1.5 < 1.753050: one-sided p is between .05 and .10.')


if __name__ == '__main__':
    main()

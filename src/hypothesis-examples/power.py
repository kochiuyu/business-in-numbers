"""Exact normal-model power for a prespecified right-tail z test.
Requires SciPy. This is planning power at a specified true mean, not a
probability that the observed null or alternative is true.
"""
from math import sqrt
from scipy.stats import norm


def main():
    null, true_mean, sigma, alpha = 500,504,12,.05
    for n in [36,100]:
        se = sigma/sqrt(n)
        cutoff = null+norm.isf(alpha)*se
        power = norm.sf((cutoff-true_mean)/se)
        actual_type_one = norm.sf((cutoff-null)/se)
        print(f'n={n}: reject if sample mean >= {cutoff:.6f}')
        print(f'Type I error={actual_type_one:.6f}; power at true mean {true_mean}={power:.6f}; beta={1-power:.6f}')
    print('Power also depends on effect size, variability, design and the chosen test, not only n.')


if __name__ == '__main__':
    main()

"""Synthetic paired-mean and variance tests; requires NumPy and SciPy.
Pairs are independent across people; differences (not both margins) must be
normal for exact paired t. F and chi-square variance tests require normal
populations and are sensitive to nonnormality. Chi-square is an extension.
"""
import numpy as np
from scipy.stats import t, ttest_rel, f, chi2


def main():
    before = np.array([28,32,30,35,29,31,34,33],dtype=float)
    after = np.array([25,30,31,31,27,30,29,31],dtype=float)
    d = before-after  # positive means a reduction in completion time
    n = len(d)
    se = d.std(ddof=1)/np.sqrt(n)
    statistic = d.mean()/se
    p = t.sf(statistic,n-1)  # prespecified reduction
    assert np.isclose(p,ttest_rel(before,after,alternative='greater').pvalue)
    print('Paired times: D=before-after, H0: mean D=0; H1: mean D>0')
    print('Differences: '+', '.join(f'{v:g}' for v in d))
    print(f'mean D={d.mean():.6f}, SD(D)={d.std(ddof=1):.6f}, t={statistic:.6f}, df={n-1}, p={p:.6f}')
    print('Decision: '+('reject H0' if p<=.05 else 'fail to reject H0')+' at alpha=.05')
    n1, n2, v1, v2 = 18, 22, 36, 16
    ratio = v1/v2
    left,right = f.cdf(ratio,n1-1,n2-1),f.sf(ratio,n1-1,n2-1)
    p = min(1.,2*min(left,right))
    lower,upper = f.ppf([.025,.975],n1-1,n2-1)
    print(f'\nIndependent variance ratio: F={ratio:.6f}, df=({n1-1},{n2-1}), two-tail p={p:.6f}')
    print(f'Rejection region: F <= {lower:.6f} or F >= {upper:.6f}')
    reverse_p = 2*min(f.cdf(1/ratio,n2-1,n1-1),f.sf(1/ratio,n2-1,n1-1))
    assert np.isclose(p,reverse_p)
    print(f'Swapping samples AND degrees of freedom preserves p={reverse_p:.6f}')
    # Extension, separate sample: test population variance=16 using s^2=25.
    n, variance, null_variance = 20,25,16
    q = (n-1)*variance/null_variance
    p = min(1.,2*min(chi2.cdf(q,n-1),chi2.sf(q,n-1)))
    print(f'\nExtension: one normal variance, chi-square={q:.6f}, df={n-1}, two-tail p={p:.6f}')
    print('Two-sided F/chi-square convention: twice the smaller tail, capped at 1.')


if __name__ == '__main__':
    main()

"""Synthetic Class 6 mean tests. Run with Python, NumPy and SciPy.
Choose the alternative before seeing the data. Independent, representative
observations are required. Small-sample t tests assume normal populations;
pooled t also assumes a common population variance. Welch is approximate.
"""
import numpy as np
from scipy.stats import norm, t, ttest_ind_from_stats


def report(label, statistic, distribution, alternative='two-sided', alpha=.05):
    left, right = distribution.cdf(statistic), distribution.sf(statistic)
    p = {'less': left, 'greater': right, 'two-sided': min(1., 2*min(left, right))}[alternative]
    print(f'{label}: statistic={statistic:.6f}, alternative={alternative}, p={p:.6f}; '
          f'{"reject H0" if p <= alpha else "fail to reject H0"} at alpha={alpha}')
    return p


def main():
    # Filling line: known population SD 12 mL; target mean 500 mL.
    mean, sigma, n, null = 504, 12, 36, 500
    report('One-sample z, known sigma', (mean-null)/(sigma/np.sqrt(n)), norm(), 'greater')
    # Service times: sample SD 6 min, n=16, target mean 30 min.
    mean, s, n, null = 27, 6, 16, 30
    report('One-sample t, df=15', (mean-null)/(s/np.sqrt(n)), t(n-1), 'less')
    # Independent process samples; same data, different variance assumptions.
    m1, s1, n1, m2, s2, n2 = 42, 8, 25, 37, 5, 20
    pooled = ((n1-1)*s1*s1+(n2-1)*s2*s2)/(n1+n2-2)
    tp = (m1-m2)/np.sqrt(pooled*(1/n1+1/n2))
    p = report('Independent pooled t, df=43', tp, t(n1+n2-2))
    assert np.isclose(p, ttest_ind_from_stats(m1,s1,n1,m2,s2,n2,equal_var=True).pvalue)
    a, b = s1*s1/n1, s2*s2/n2
    df = (a+b)**2/(a*a/(n1-1)+b*b/(n2-1))
    tw = (m1-m2)/np.sqrt(a+b)
    print(f'Welch df={df:.9f} (keep fractional degrees of freedom)')
    p = report('Independent Welch t', tw, t(df))
    assert np.isclose(p, ttest_ind_from_stats(m1,s1,n1,m2,s2,n2,equal_var=False).pvalue)
    # Extension: same numeric SDs are now assumed KNOWN population SDs.
    report('Extension: independent known-variance z', tw, norm())
    print('Do not choose pooled versus Welch by first testing sample variances.')


if __name__ == '__main__':
    main()

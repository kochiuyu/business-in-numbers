"""Synthetic binomial proportion tests; requires NumPy and SciPy.
Independent binary observations, fixed n, and a common probability within each
sample are assumed. Normal approximations use null, not observed, expected
counts. No continuity correction. Avoid z when expected counts are small.
"""
import numpy as np
from scipy.stats import norm, binomtest


def main():
    x, n, p0 = 62, 200, .25
    phat = x/n
    z = (phat-p0)/np.sqrt(p0*(1-p0)/n)
    p = norm.sf(z)  # prespecified increase
    print(f'One proportion: x={x}, n={n}, p0={p0}; H1: p > p0')
    print(f'Null expected counts: {n*p0:.1f} successes, {n*(1-p0):.1f} failures')
    print(f'z={z:.6f}, right-tail p={p:.6f}; {"reject H0" if p<=.05 else "fail to reject H0"}')
    print(f'Exact binomial comparison: p={binomtest(x,n,p0,alternative="greater").pvalue:.6f}')
    x1, n1, x2, n2 = 72, 240, 45, 200
    p1, p2 = x1/n1, x2/n2
    pooled = (x1+x2)/(n1+n2)
    se_null = np.sqrt(pooled*(1-pooled)*(1/n1+1/n2))
    z = (p1-p2)/se_null
    p = 2*norm.sf(abs(z))
    expected = [n1*pooled,n1*(1-pooled),n2*pooled,n2*(1-pooled)]
    assert min(expected)>=10
    print(f'\nTwo independent proportions: {x1}/{n1} versus {x2}/{n2}; H1: p1 != p2')
    print(f'Pooled p={pooled:.6f}, null SE={se_null:.6f}, z={z:.6f}, two-tail p={p:.6f}')
    print('Null expected counts: '+', '.join(f'{value:.3f}' for value in expected))
    print('Decision: '+('reject H0' if p<=.05 else 'fail to reject H0')+' at alpha=.05')
    se_ci = np.sqrt(p1*(1-p1)/n1+p2*(1-p2)/n2)
    margin = norm.ppf(.975)*se_ci
    print(f'Unpooled 95% Wald CI for p1-p2: [{p1-p2-margin:.6f}, {p1-p2+margin:.6f}]')
    print('This unpooled Wald CI is not the exact inversion of the pooled z test.')
    print('Failing to reject equality does not establish equivalence.')


if __name__ == '__main__':
    main()

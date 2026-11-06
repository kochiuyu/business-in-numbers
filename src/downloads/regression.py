#!/usr/bin/env python3
"""Synthetic simple OLS teaching example. Run: python3 regression.py
Optional: python3 -m pip install scipy. No network or files are read.
X: advertising spend in $100 units; Y: weekly orders in tens.
Eight independently sampled market-weeks are a teaching assumption, not
proof of independence. Association does not establish a causal effect.
"""
import math
from statistics import mean
try:
    from scipy.stats import t as t_distribution, f as f_distribution
except ImportError:
    t_distribution = f_distribution = None

X = list(range(1, 9))
Y = [11, 12, 16, 15, 19, 20, 23, 24]

def numeric(value):
    return (not isinstance(value, bool) and isinstance(value, (int, float))
            and math.isfinite(value) and abs(value) <= 1e12)

def fit(x=X, y=Y, x0=4.5, alpha=.05):
    """Fit intercept + one slope; reject degenerate/unsupported inputs explicitly.
    Classical inference requires a linear conditional mean, independent normal
    errors with common variance, and an appropriate sampling design.
    Interval predictions also assume a new independent case from that model.
    """
    if not isinstance(x, (list, tuple)) or not isinstance(y, (list, tuple)):
        raise ValueError('x and y must be numeric lists or tuples.')
    if len(x) != len(y) or not 3 <= len(x) <= 10000:
        raise ValueError('Need 3–10000 paired observations of equal length.')
    if not all(numeric(v) for v in (*x, *y)) or not numeric(x0):
        raise ValueError('Values must be finite numbers in [-1e12, 1e12], not booleans.')
    if not numeric(alpha) or not 1e-6 <= alpha <= .5:
        raise ValueError('alpha must be between 0.000001 and 0.5.')
    n = len(x)
    xb, yb = mean(x), mean(y)
    sxx = math.fsum((v-xb)**2 for v in x)
    syy = math.fsum((v-yb)**2 for v in y)
    sxy = math.fsum((a-xb)*(b-yb) for a, b in zip(x, y))
    if sxx == 0 or syy == 0:
        raise ValueError('Both x and y must vary; this lesson excludes degenerate fits.')
    slope = sxy/sxx
    intercept = yb-slope*xb
    fitted = [intercept+slope*v for v in x]
    residuals = [v-p for v, p in zip(y, fitted)]
    sse = math.fsum(e*e for e in residuals)
    if sse <= 1e-24*syy:
        raise ValueError('Perfect or numerically near-perfect fit: inference is degenerate.')
    ssr = slope*sxy
    df = n-2
    mse = sse/df
    s = math.sqrt(mse)
    se_slope = s/math.sqrt(sxx)
    se_intercept = s*math.sqrt(1/n+xb*xb/sxx)
    t_slope, t_intercept = slope/se_slope, intercept/se_intercept
    F = ssr/mse
    r2 = 1-sse/syy
    prediction = intercept+slope*x0
    se_mean = s*math.sqrt(1/n+(x0-xb)**2/sxx)
    se_prediction = math.sqrt(mse+se_mean**2)
    available = t_distribution is not None and f_distribution is not None
    critical = float(t_distribution.isf(alpha/2, df)) if available else None
    def pvalue(t):
        return float(2*t_distribution.sf(abs(t), df)) if available else None
    def interval(center, se):
        return (center-critical*se, center+critical*se) if available else None
    return dict(n=n, xbar=xb, ybar=yb, Sxx=sxx, Sxy=sxy, slope=slope,
                intercept=intercept, fitted=fitted, residuals=residuals,
                SST=syy, SSR=ssr, SSE=sse, regression_df=1, error_df=df,
                total_df=n-1, MSR=ssr, MSE=mse, s=s, F=F,
                p_F=float(f_distribution.sf(F, 1, df)) if available else None,
                R2=r2, adjusted_R2=1-(1-r2)*(n-1)/df,
                se_slope=se_slope, se_intercept=se_intercept,
                t_slope=t_slope, t_intercept=t_intercept,
                p_slope=pvalue(t_slope), p_intercept=pvalue(t_intercept),
                slope_CI=interval(slope, se_slope),
                intercept_CI=interval(intercept, se_intercept),
                x0=x0, prediction=prediction, se_mean=se_mean,
                se_prediction=se_prediction, mean_CI=interval(prediction, se_mean),
                individual_PI=interval(prediction, se_prediction),
                alpha=alpha, t_critical=critical, inference_available=available)

def display(result):
    def fmt(value):
        if value is None:
            return 'unavailable (install SciPy for tails and quantiles)'
        if isinstance(value, (tuple, list)):
            return '['+', '.join(fmt(v) for v in value)+']'
        if isinstance(value, float):
            return format(value, '.10g')
        return str(value)
    print('Synthetic advertising spend / weekly orders: simple OLS with intercept')
    print('X in $100 units; Y in tens of orders. alpha=0.05 for the default run.')
    print('Classical inference assumes independent normal errors with common variance.')
    if not result['inference_available']:
        print('SciPy absent: algebra, SE, t and F work; p-values and intervals unavailable.')
    for key, value in result.items():
        print(f'{key}: {fmt(value)}')
    print('The slope describes association, not a demonstrated causal effect.')
    print('The intercept is at x=0, outside the observed x range [1, 8].')
    print('A mean confidence interval is not an individual prediction interval.')

if __name__ == '__main__':
    display(fit())

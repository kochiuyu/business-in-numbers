#!/usr/bin/env python3
"""Continuous reference distributions; Python 3.10+ and SciPy."""
from scipy.stats import chi2, f, norm, t


def main():
    # Positive degrees of freedom; F has numerator then denominator df.
    # These are reference laws, not interchangeable models for raw sales.
    for name, law, value in [
        ("Standard normal", norm(), 1.96),
        ("Chi-square df=9", chi2(df=9), 12),
        ("Student t df=9", t(df=9), 2),
        ("F df1=5 df2=10", f(dfn=5, dfd=10), 2),
    ]:
        print(name)
        print(f"  PDF({value}) = {law.pdf(value):.6f} (density, not probability)")
        print(f"  CDF({value}) = {law.cdf(value):.6f}; SF({value}) = {law.sf(value):.6f}")
        print(f"  Left-tail .95 cutoff = {law.ppf(.95):.6f}")
        print(f"  Right-tail .05 cutoff = {law.isf(.05):.6f}")
    print(f"Two-sided t critical value, total alpha=.05, df=9: {t.isf(.05 / 2, 9):.6f}")


if __name__ == "__main__":
    main()

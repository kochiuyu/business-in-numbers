"""Class 5: point estimators, sampling variance, bias, and MSE.

Run: python estimators.py (requires NumPy and SciPy).
Treat observations as independent draws with finite population variance.
The Bernoulli example also assumes a common success probability.
Analytic estimator comparisons use a hypothetical population, not a fitted model.
"""
import numpy as np


def main():
    data = np.array([46, 52, 48, 54, 50], dtype=float)
    n = data.size
    print("Observed sample:", data.astype(int).tolist())
    print(f"Sample mean = {data.mean():.6f}")
    print(f"Variance with ddof=0 (divide by n) = {data.var(ddof=0):.6f}")
    print(f"Sample variance with ddof=1 (divide by n-1) = {data.var(ddof=1):.6f}")
    print(f"Estimated standard error of mean, s/sqrt(n) = {data.std(ddof=1)/np.sqrt(n):.6f}")
    print("ddof=1 makes sample variance unbiased for population variance; it does not make s unbiased.")
    successes, trials = 48, 200
    phat = successes / trials
    plugin = phat * (1 - phat)
    unbiased = trials / (trials - 1) * plugin
    print(f"\nBinary sample: {successes}/{trials}, p-hat = {phat:.6f}")
    print(f"Plug-in Bernoulli observation variance, p-hat(1-p-hat) = {plugin:.6f}")
    print(f"Unbiased Bernoulli observation variance, n/(n-1) times plug-in = {unbiased:.6f}")
    print(f"Plug-in variance of p-hat, p-hat(1-p-hat)/n = {plugin/trials:.6f}")
    print(f"Unbiased estimate of variance of p-hat, p-hat(1-p-hat)/(n-1) = {plugin/(trials-1):.6f}")
    print(f"Plug-in SE of p-hat = {np.sqrt(plugin/trials):.6f}")
    print("\nAnalytic comparison: independent observations, population mean 50, variance 100, n=5.")
    print("Bias = E[estimator] - target; MSE = variance + squared bias.")
    population_variance, sample_size = 100.0, 5
    for name, bias, variance in [
        ("Sample mean", 0.0, population_variance/sample_size),
        ("First observation", 0.0, population_variance),
        ("Sample mean + 2", 2.0, population_variance/sample_size),
    ]:
        print(f"{name}: bias={bias:.2f}, variance={variance:.2f}, MSE={variance+bias**2:.2f}")
    print("Averaging reduces variance; adding 2 leaves variance unchanged but increases MSE by 4.")
    print("Bias is a repeated-sampling property, not the error in a single observed estimate.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""LLN and CLT for exponential support minutes. Writes two SVG figures."""
from pathlib import Path
import argparse
import numpy as np
from scipy.stats import norm, skew, gamma
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', default='sampling-plots')
    args = parser.parse_args()
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({'svg.fonttype': 'none', 'svg.hashsalt': 'sampling-class-four'})
    rng = np.random.default_rng(20261106)
    mu = sigma = 12.
    repetitions = 30000
    # One growing sample: LLN concerns n, not the number of repetitions.
    observations = rng.exponential(scale=mu, size=10000)
    sizes = np.arange(1, len(observations)+1)
    running_mean = observations.cumsum()/sizes
    print('Exponential support durations: population mean=12 min; SD=12 min.')
    print('One LLN path (not guaranteed to improve at every step):')
    for n in (10, 100, 1000, 10000):
        print(f'n={n:5d}: running mean={running_mean[n-1]:.6f}')
    fig, ax = plt.subplots(figsize=(8, 3.3), layout='constrained')
    ax.plot(sizes, running_mean, color='#166a83', linewidth=1)
    ax.axhline(mu, color='#a34320', linestyle='--', label='Population mean = 12')
    ax.set(xscale='log', xlabel='Observations in one growing sample (n)', ylabel='Running mean (minutes)', title='LLN: one path toward the population mean')
    ax.legend()
    fig.savefig(out/'lln.svg', metadata={'Date': None})
    plt.close(fig)
    fig, axes = plt.subplots(2, 2, figsize=(9, 6), layout='constrained')
    print(f'\nRepeated independent samples: R={repetitions} per n; each row is one sample.')
    print(' n    simulated mean   simulated SE   theoretical SE   skewness  P(|mean-12|<2)')
    for n, ax in zip((1, 5, 30, 100), axes.flat):
        samples = rng.exponential(scale=mu, size=(repetitions, n))
        means = samples.mean(axis=1)
        se = sigma/np.sqrt(n)
        z = (means-mu)/se
        print(f'{n:3d}   {means.mean():14.6f}   {means.std(ddof=1):12.6f}   {se:14.6f}   {skew(means):8.4f}   {np.mean(abs(means-mu)<2):.6f}')
        assert abs(means.mean()-mu) < 6*se/np.sqrt(repetitions)
        assert abs(means.std(ddof=1)/se-1) < .05
        ax.hist(z, bins=np.linspace(-4, 6, 65), weights=np.ones(repetitions)/(repetitions*(10/64)), color='#c0dce5', label='Simulation')
        grid = np.linspace(-4, 6, 400)
        ax.plot(grid, norm.pdf(grid), color='#a34320', label='Standard normal')
        # Exact gamma law, transformed into standardized coordinates.
        ax.plot(grid, gamma.pdf(mu+se*grid, a=n, scale=mu/n)*se, color='#166a83', linestyle='--', label='Exact gamma')
        ax.set(xlim=(-4, 6), xlabel='Standardized sample mean Z', ylabel='Density', title=f'n = {n}; SE = {se:.3f} min')
    axes.flat[0].legend(fontsize=8)
    fig.savefig(out/'clt.svg', metadata={'Date': None})
    plt.close(fig)
    print('More repetitions smooth the estimated law; larger n reduces its true SE.')
    print('Normality is approximate here, not a universal rule at n=30 or n=35.')
    print('Wrote lln.svg and clt.svg in the requested output directory.')


if __name__ == '__main__':
    main()

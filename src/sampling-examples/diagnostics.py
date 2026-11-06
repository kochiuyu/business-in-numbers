#!/usr/bin/env python3
"""Normality diagnostics on synthetic samples; no test proves normality."""
from pathlib import Path
import argparse
import numpy as np
from scipy.stats import probplot, skew, kurtosis, jarque_bera
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', default='sampling-plots')
    args = parser.parse_args()
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({'svg.fonttype':'none', 'svg.hashsalt':'sampling-class-four'})
    rng = np.random.default_rng(20261107)
    datasets = [('Normal, n=16', rng.normal(50, 8, 16)),
                ('Exponential, n=16', rng.exponential(12, 16)),
                ('Exponential, n=500', rng.exponential(12, 500))]
    fig, axes = plt.subplots(1, 3, figsize=(11, 3.5), layout='constrained')
    print('Synthetic datasets, separate from the observed mean=47, SD=8 case.')
    for ax, (label, data) in zip(axes, datasets):
        s = data.std(ddof=1)
        jb = jarque_bera(data)
        # Biased central moments below reproduce the conventional JB statistic.
        g1 = skew(data, bias=True)
        raw = kurtosis(data, fisher=False, bias=True)
        excess = kurtosis(data, fisher=True, bias=True)
        manual_jb = len(data)/6*(g1*g1 + excess*excess/4)
        assert np.isclose(jb.statistic, manual_jb)
        assert np.isclose(raw-excess, 3)
        print(f'\n{label}: mean={data.mean():.6f}; s(ddof=1)={s:.6f}; estimated SE={s/np.sqrt(len(data)):.6f}')
        print(f'skewness={g1:.6f}; raw kurtosis={raw:.6f}; excess kurtosis={excess:.6f}')
        print(f'JB={jb.statistic:.6f}; asymptotic p={jb.pvalue:.9g}')
        probplot(data, dist='norm', plot=ax)
        ax.set(title=label, xlabel='Theoretical standard-normal quantiles', ylabel='Ordered observations')
    fig.savefig(out/'qq.svg', metadata={'Date': None})
    plt.close(fig)
    print('\nNormal population targets: skewness=0; raw kurtosis=3; excess kurtosis=0.')
    print('JB uses an asymptotic chi-square(2) reference; small-sample calibration can be poor.')
    print('At n=16 a test has little power: failure to reject does not establish normality.')
    print('Inspect Q-Q curvature, tail outliers, and how the data were sampled; tests do not check independence.')
    print('Wrote qq.svg in the requested output directory.')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Draw accessible SVG density comparisons with SciPy; no plotting dependency.
Run: python plots.py --output-dir ./distribution-plots
"""
import argparse
from html import escape
from pathlib import Path
from scipy.stats import chi2, f, norm, t


def chart(key, title, description, curves, domain, ymax, xticks, yticks):
    # SVG paths are sampled PDFs, not probability calculations.
    left, top, width, height = 74, 78, 650, 220
    xmin, xmax = domain
    def sx(x):
        return left + (x - xmin) / (xmax - xmin) * width
    def sy(y):
        return top + height - y / ymax * height
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 350" role="img" aria-labelledby="{key}-title {key}-desc" style="display:block;width:100%;height:auto;min-width:560px">',
             f'<title id="{key}-title">{escape(title)}</title>',
             f'<desc id="{key}-desc">{escape(description)}</desc>',
             '<rect width="760" height="350" fill="#ffffff"/>',
             f'<text x="74" y="24" fill="#172b3a" font-size="17" font-family="sans-serif" font-weight="bold">{escape(title)}</text>']
    for value in yticks:
        y = sy(value)
        parts += [f'<path d="M{left},{y:.2f}H{left+width}" stroke="#dce5e9"/>',
                  f'<text x="64" y="{y+4:.2f}" text-anchor="end" fill="#334155" font-size="12" font-family="sans-serif">{value:g}</text>']
    for value in xticks:
        x = sx(value)
        parts += [f'<path d="M{x:.2f},{top+height}v5" stroke="#64748b"/>',
                  f'<text x="{x:.2f}" y="318" text-anchor="middle" fill="#334155" font-size="12" font-family="sans-serif">{value:g}</text>']
    parts += [f'<path d="M{left},{top}V{top+height}H{left+width}" fill="none" stroke="#64748b"/>',
              '<text x="400" y="341" text-anchor="middle" fill="#334155" font-size="13" font-family="sans-serif">x (reference statistic)</text>',
              '<text transform="translate(19 190) rotate(-90)" text-anchor="middle" fill="#334155" font-size="13" font-family="sans-serif">Probability density</text>']
    for index, (label, law, color, dashed) in enumerate(curves):
        dash = ' stroke-dasharray="8 5"' if dashed else ''
        legend = left + index * 218
        parts += [f'<path d="M{legend},51h26" stroke="{color}" stroke-width="3"{dash}/>',
                  f'<text x="{legend+32}" y="55" fill="#334155" font-size="12" font-family="sans-serif">{escape(label)}</text>']
        points = []
        for i in range(501):
            x = xmin + (xmax - xmin) * i / 500
            y = float(law.pdf(x))
            if not 0 <= y <= ymax:
                raise ValueError(f"Plot range clips density: {label}, {x}, {y}")
            points.append(f'{"M" if i == 0 else "L"}{sx(x):.2f},{sy(y):.2f}')
        parts.append(f'<path d="{" ".join(points)}" fill="none" stroke="{color}" stroke-width="2.6"{dash}/>')
    return '\n'.join(parts + ['</svg>'])


def make_charts():
    return {
        'chisquare': chart('rv-chi-plot', 'Chi-square: degrees of freedom change the shape',
            'PDFs with df 3, 9, and 15 on x from 0 to 35. All are nonnegative and right-skewed. Modes are 1, 7, and 13; tails continue beyond the displayed range.',
            [('df = 3',chi2(3),'#166a83',False), ('df = 9',chi2(9),'#a34320',True), ('df = 15',chi2(15),'#7552a3',False)],
            (0,35), .26, range(0,36,5), [0,.05,.1,.15,.2,.25]),
        'studentt': chart('rv-t-plot', 'Student t approaches normal as df increases',
            'PDFs of standard normal, t with df 3, and t with df 9, from minus 5 to 5. The t curves have lower centers and heavier tails. Tails extend outside this window.',
            [('Standard normal',norm(),'#166a83',False), ('t: df = 3',t(3),'#a34320',True), ('t: df = 9',t(9),'#7552a3',False)],
            (-5,5), .42, range(-5,6), [0,.1,.2,.3,.4]),
        'fdistribution': chart('rv-f-plot', 'F: numerator and denominator df both matter',
            'PDFs of F with numerator and denominator df pairs 5 and 10, 10 and 5, and 20 and 20, from 0 to 6. F is nonnegative and right-skewed; swapping df changes the law. Tails continue beyond 6.',
            [('df1=5, df2=10',f(5,10),'#166a83',False), ('df1=10, df2=5',f(10,5),'#a34320',True), ('df1=20, df2=20',f(20,20),'#7552a3',False)],
            (0,6), 1.02, range(7), [0,.2,.4,.6,.8,1]),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=Path('distribution-plots'))
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for name, svg in make_charts().items():
        (args.output_dir / f'{name}.svg').write_text(svg, encoding='utf-8')
        print(f'Created {name}.svg (501 density points per curve)')
    print(f'Chi-square df=9: upper 5% cutoff = {chi2.isf(.05,9):.6f}')
    print(f'P(|Z| > 2) = {2*norm.sf(2):.6f}; P(|t(3)| > 2) = {2*t.sf(2,3):.6f}')
    print(f'F(5,10): upper 5% cutoff = {f.isf(.05,5,10):.6f}')


if __name__ == '__main__':
    main()

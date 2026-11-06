"""Execute every displayed Python example and cross-check the existing lab."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from html.parser import HTMLParser
import json
import math
import runpy
import statistics as st
import subprocess
import sys

assert sys.version_info >= (3, 10)
root = Path(__file__).resolve().parent
checks = 0

def check(test, message):
    global checks
    checks += 1
    assert test, message

def close(actual, expected):
    if isinstance(expected, (list, tuple)):
        check(len(actual) == len(expected), 'length mismatch')
        for a, e in zip(actual, expected):
            close(a, e)
    else:
        check(math.isclose(actual, expected, abs_tol=1e-10, rel_tol=1e-10), (actual, expected))

for name in ['quickstart', 'shape', 'paired', 'orders']:
    output = subprocess.check_output([sys.executable, str(root / f'src/examples/{name}.py')], text=True)
    check(output == (root / f'src/examples/{name}.txt').read_text(), f'{name}: stale checked output')
with redirect_stdout(StringIO()):
    shape = runpy.run_path(str(root / 'src/examples/shape.py'))['shape']
x = [1, 2, 3, 4, 5]
expected = [(5, 15), (3, 3), [], (120 ** .2, 5 / sum(1 / v for v in x)), 4, [1.5, 4.5], [2, 4], (2, 2.5), (2 ** .5, 2.5 ** .5), (0, 0), -1.2]
rows = json.loads((root / 'src/tool-reference.json').read_text())
for row, target in zip(rows, expected, strict=True):
    close(eval(row[2], {'st': st, 'x': x, 'shape': shape}), target)
for values in [[1,2,3], [2,2,2,2]]:
    try:
        shape(values)
    except ValueError:
        check(True, 'domain rejected')
    else:
        raise AssertionError('invalid shape input accepted')
mode_expression = rows[2][2]
for values, target in [([1,2,3,4,5], []), ([1,1,2,3], [1]), ([1,1,2,2], [1,2]), ([3,3,3,3], [3])]:
    check(eval(mode_expression, {'st': st, 'x': values}) == target, 'mode convention')
# Reconcile Python results with the existing tested JavaScript arithmetic.
js = r'''const s=require('./src/stats.js'); console.log(JSON.stringify([[1,2,3,4,5],[18,22,24,25,28,30,32,35,38,42,46,200],[1,2,3,4,15],[1,2,3,4]].map(x=>({x,p:s.describe(x,false,'exc'),s:s.describe(x,true,'exc'),i:s.describe(x,false,'inc')}))));'''
for case in json.loads(subprocess.check_output(['node', '-e', js], cwd=root, text=True)):
    x = case['x']
    close(st.mean(x), case['p']['mean'])
    close(st.median(x), case['p']['median'])
    close(st.pvariance(x), case['p']['variance'])
    close(st.variance(x), case['s']['variance'])
    close(st.pstdev(x), case['p']['sd'])
    close(st.stdev(x), case['s']['sd'])
    close(st.quantiles(x, n=4, method='exclusive')[::2], [case['p']['q1'], case['p']['q3']])
    close(st.quantiles(x, n=4, method='inclusive')[::2], [case['i']['q1'], case['i']['q3']])
    close(shape(x), [case['p']['skew'], case['s']['skew'], case['p']['excess'], case['s']['excess']])
# Verify the actual built code, output, and formulas, not just their source files.
class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(); self.blocks=[]; self.capture=False; self.value=''; self.label=''
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='pre' and a.get('class')=='code-block':
            self.capture=True; self.value=''; self.label=a['aria-label']
            check(a.get('tabindex')=='0' and a.get('role')=='region', 'code keyboard access')
    def handle_data(self, text):
        if self.capture: self.value+=text
    def handle_endtag(self, tag):
        if tag=='pre' and self.capture:
            self.blocks.append((self.label,self.value)); self.capture=False
for file in ['dist/index.html', 'class1-standalone.html']:
    html=(root/file).read_text(); parser=Blocks();parser.feed(html)
    check(len(parser.blocks)==10, 'missing displayed code/output')
    check('{{python:' not in html and '{{output:' not in html and '{{tool-reference}}' not in html, 'unbuilt placeholder')
    for label, content in parser.blocks:
        name=label.split(': ')[1].split('.')[0]
        suffix='py' if label.startswith('Python code') else 'txt'
        check(content==(root/f'src/examples/{name}.{suffix}').read_text(), 'displayed code differs from tested code')
print(f'Passed {checks} executed Python, output, convention, cross-tool and accessible-markup assertions on Python {sys.version.split()[0]}.')

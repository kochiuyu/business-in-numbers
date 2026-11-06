"""Execute standalone Class 6 examples and compare recorded stdout."""
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent
examples = root/'src'/'hypothesis-examples'
with tempfile.TemporaryDirectory() as temporary:
    for name in ['means','proportions','paired-variance','power']:
        actual = subprocess.check_output([sys.executable,str(examples/f'{name}.py')],text=True,cwd=temporary)
        assert actual == (examples/f'{name}.txt').read_text(), f'{name}: recorded stdout differs'
        print(f'Checked executed output: {name}')
print('All four Class 6 examples passed; recorded stdout matches execution.')

"""Execute each standalone Class 5 example and verify its recorded stdout."""
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent
examples = root / 'src' / 'estimation-examples'
with tempfile.TemporaryDirectory() as temporary:
    for name in ['estimators', 'intervals', 'coverage', 'planning']:
        actual = subprocess.check_output(
            [sys.executable, str(examples / f'{name}.py')],
            text=True, cwd=temporary,
        )
        expected = (examples / f'{name}.txt').read_text()
        assert actual == expected, f'{name}: recorded stdout differs from execution'
        print(f'Checked executed output: {name}')
print('All four Class 5 examples passed; recorded stdout matches execution.')

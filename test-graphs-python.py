"""Execute the displayed chart code with a headless renderer and cross-check results."""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix="class1-chart-check-") as directory:
    env = {**os.environ, "MPLBACKEND": "Agg", "MPLCONFIGDIR": directory,
           "XDG_CACHE_HOME": directory}
    result = subprocess.run([sys.executable, str(root / "src/examples/graphs.py")],
                            cwd=directory, env=env, text=True, capture_output=True,
                            check=True)
    assert result.stdout == (root / "src/examples/graphs.txt").read_text()
    image = Path(directory) / "class1-charts.png"
    assert image.exists() and image.stat().st_size > 10000
    assert image.read_bytes().startswith(b"\x89PNG\r\n\x1a\n")
print("Passed displayed graph Python execution, checked output and PNG-render checks.")

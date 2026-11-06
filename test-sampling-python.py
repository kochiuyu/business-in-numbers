import os, subprocess, sys, tempfile
from pathlib import Path
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent
examples=root/'src/sampling-examples'
with tempfile.TemporaryDirectory() as tmp:
 env={**os.environ,'MPLCONFIGDIR':tmp+'/mpl','XDG_CACHE_HOME':tmp+'/cache'}
 for name in ['enumeration','simulation','tails','student','diagnostics']:
  cmd=[sys.executable,str(examples/(name+'.py'))]
  if name in ['simulation','diagnostics']:cmd+=['--output-dir',tmp+'/'+name]
  actual=subprocess.check_output(cmd,env=env,text=True,cwd=tmp)
  assert actual==(examples/(name+'.txt')).read_text(),name
  print('Checked executed output:',name)
 for svg in Path(tmp).rglob('*.svg'):ET.parse(svg)
print('All five Class 4 examples and generated SVG XML passed.')

"""One original synthetic case against a pinned, MIT-licensed tablemd wheel."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.request

url = 'https://files.pythonhosted.org/packages/4d/54/5d60adceeb222b65a2b5f675b4cf77db26b6aac817b731443e27a88f6b22/tablemd-0.1.0-py3-none-any.whl'
expected_sha = 'bc145b6b0d6182e20b71ee4db5f957e7bae059d18db7a3e177ca2c6f99512ff2'
source = '| SKU | Description | Qty |\n| --- | --- | ---: |\n| 0017 | Cedar | Oak | 12 |\n| 0021 | Spruce | 8 |'
with urllib.request.urlopen(url, timeout=25) as response:
    data = response.read()
assert hashlib.sha256(data).hexdigest() == expected_sha
with tempfile.TemporaryDirectory(prefix='cell-comparison-') as temporary:
    wheel = Path(temporary) / 'tablemd.whl'
    wheel.write_bytes(data)
    code = 'import sys,json;sys.path.insert(0,sys.argv[1]);import tablemd;t=tablemd.parse_one(sys.argv[2]);print(json.dumps({"headers":t.header,"rows":t.rows}))'
    prior = json.loads(subprocess.check_output([sys.executable, '-I', '-c', code, str(wheel), source], text=True))
assert prior['rows'][0] == ['0017', 'Cedar', 'Oak']
root = Path(__file__).resolve().parents[1]
code = 'const C=require("./core.js");const p=C.parse(process.argv[1]);console.log(JSON.stringify(p));'
current = json.loads(subprocess.check_output(['node', '-e', code, source], cwd=root, text=True))
assert current['rows'][0]['cells'] == ['0017', 'Cedar', 'Oak', '12']
assert current['issues'][0]['code'] == 'width'
report = {'fixture': source, 'tablemd_version': '0.1.0', 'wheel_sha256': expected_sha,
          'tablemd': prior, 'keep_every_cell': current,
          'scope': 'One original ragged-row case. Documented GFM-style normalization versus strict schema review; not a general accuracy ranking or a tablemd bug claim.'}
(root / 'runs').mkdir(exist_ok=True)
(root / 'runs' / 'tablemd-comparison.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'comparison': 'passed', 'tablemd_first_row_cells': 3, 'review_first_row_cells': 4, 'review_export_blocked': True}))

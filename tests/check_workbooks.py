import json
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1] / 'runs'
expected = [
    ['SKU', 'Description', 'Qty'],
    ['0017', 'Cedar | Oak', '12'],
    ['0099', '=2+2', '3'],
    ['12345678901234567', '中文 & < >', '0.25'],
]
for name, numeric in [('text-fixture.xlsx', False), ('typed-fixture.xlsx', True)]:
    workbook = openpyxl.load_workbook(root / name, data_only=False)
    sheet = workbook.active
    actual = [list(row) for row in sheet.values]
    target = [list(row) for row in expected]
    if numeric:
        for row in target[1:]:
            row[2] = float(row[2])
    assert actual == target, (name, actual)
    assert sheet['A2'].data_type == sheet['B3'].data_type == sheet['A4'].data_type == 's'
    assert sheet['C2'].data_type == ('n' if numeric else 's')
    assert sheet.freeze_panes == 'A2'
    assert not workbook._external_links
    workbook.close()
browser = root / 'browser-review.xlsx'
if browser.exists():
    workbook = openpyxl.load_workbook(browser, data_only=False)
    sheet = workbook.active
    assert list(sheet.values) == [
        ('SKU', 'Description', 'Qty'),
        ('0017', 'Cedar | Oak', 12),
        ('0021', 'Spruce', 8),
        ('0099', '=2+2', 3),
    ]
    assert sheet['B4'].data_type == 's'
    workbook.close()
print(json.dumps({'fixture_workbooks_checked': 2, 'browser_download_checked': browser.exists(),
                  'leading_zeros_preserved': True, 'formula_like_text_is_string': True,
                  'scope': 'openpyxl readback; native Excel and Numbers are not tested'}))

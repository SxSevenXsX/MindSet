"""Check the PDFs produced by book-electron.cjs. Requires pypdf; no user data."""
import json
import re
from pathlib import Path
from pypdf import PdfReader

output = Path(__file__).resolve().parents[1] / 'output' / 'book-tests'
for filename, mapping, pattern, count, size in [
    ('book-a4.pdf', 'screen-map.json', r'Paragraphe \d{3}\.', 100, (21, 29.7)),
    ('book-custom.pdf', 'mixed-screen-map.json', r'TOKEN_\d{3}', 64, (22, 14)),
]:
    pdf = PdfReader(output / filename)
    expected = json.loads((output / mapping).read_text(encoding='utf-8'))
    actual = {}
    for page_number, page in enumerate(pdf.pages, 1):
        for label in re.findall(pattern, page.extract_text()):
            assert label not in actual, f'Duplicate content: {label}'
            actual[label] = page_number
    assert len(actual) == len(expected) == count
    for entry in expected:
        assert actual[entry['text'].strip()] == entry['page'], entry
    width, height = (float(value) / 72 * 2.54 for value in pdf.pages[0].mediabox[2:])
    assert abs(width-size[0]) < .03 and abs(height-size[1]) < .03
    if filename == 'book-custom.pdf':
        assert len(pdf.pages[0].images) == 1
    print(f'{filename}: {len(pdf.pages)} pages, {count}/{count} markers on matching pages')
empty = PdfReader(output / 'book-empty.pdf')
assert len(empty.pages) == 1 and empty.pages[0].extract_text().strip() == '1'
print('Empty note: one page, page number only')

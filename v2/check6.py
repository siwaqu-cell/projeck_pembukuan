import os
V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'
for fname in ['Code.gs', 'StatusForm.html']:
    fpath = os.path.join(V2_DIR, fname)
    with open(fpath, 'rb') as f:
        raw = f.read()
    idx = raw.find(b'\xc3\xa2')
    if idx >= 0:
        start = max(0, idx-5)
        end = min(len(raw), idx+30)
        hex_ctx = ' '.join(f'{b:02X}' for b in raw[start:end])
        print(f'{fname} @{idx}: {hex_ctx}')
        text_ctx = raw[start:end].decode('utf-8', errors='replace')
        print(f'  Text: {repr(text_ctx)}')
    else:
        print(f'{fname}: CLEAN (no C3A2)')
    print()

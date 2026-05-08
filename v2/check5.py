import os

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

for fname in ['KasirForm.html', 'StatusForm.html', 'Code.gs']:
    fpath = os.path.join(V2_DIR, fname)
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    target = b'\xc3\xa2'
    idx = 0
    count = 0
    while idx < len(raw) and count < 20:
        idx = raw.find(target, idx)
        if idx < 0:
            break
        start = max(0, idx - 2)
        end = min(len(raw), idx + 25)
        hex_ctx = ' '.join(f'{b:02X}' for b in raw[start:end])
        print(f'{fname} @{idx}: {hex_ctx}')
        idx += 2
        count += 1
    print()

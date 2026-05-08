import os

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

for fname in ['KasirForm.html', 'StatusForm.html', 'Code.gs']:
    fpath = os.path.join(V2_DIR, fname)
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    # Find C3 A2 sequences
    target = b'\xc3\xa2'
    idx = 0
    count = 0
    while idx < len(raw):
        idx = raw.find(target, idx)
        if idx < 0:
            break
        # Show context
        start = max(0, idx - 3)
        end = min(len(raw), idx + 20)
        hex_ctx = ' '.join(f'{b:02X}' for b in raw[start:end])
        try:
            text_ctx = raw[start:end].decode('utf-8', errors='replace')
        except:
            text_ctx = '?'
        print(f'{fname} @{idx}: {hex_ctx} -> {text_ctx}')
        idx += 2
        count += 1
        if count >= 10:
            print(f'  ... (and more)')
            break
    print(f'  Total C3 A2: {raw.count(target)}')
    print()

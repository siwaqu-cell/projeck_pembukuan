import os

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

for f in sorted(os.listdir(V2_DIR)):
    if not (f.endswith('.html') or f.endswith('.gs')):
        continue
    with open(os.path.join(V2_DIR, f), 'rb') as fh:
        raw = fh.read()
    
    has_double = b'\xc3\xa2' in raw
    emoji_count = raw.count(b'\xf0\x9f')
    
    try:
        text = raw.decode('utf-8')
        has_garbled = '\u00e2\u20ac\u201d' in text
    except:
        has_garbled = True
    
    status = 'CLEAN' if not has_garbled and not has_double else 'ISSUE'
    print(f'{status:6s} emoji={emoji_count:2d} dbl={has_double} garb={has_garbled} {f}')

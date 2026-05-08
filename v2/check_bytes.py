import os

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

with open(os.path.join(V2_DIR, 'Dashboard.html'), 'rb') as f:
    raw = f.read()

# Find bytes around the title
idx = raw.find(b'page-title')
if idx >= 0:
    start = max(0, idx - 5)
    end = min(len(raw), idx + 40)
    chunk = raw[start:end]
    hex_str = ' '.join(f'{b:02X}' for b in chunk)
    decoded = chunk.decode('utf-8', errors='replace')
    print(f'Hex: {hex_str}')
    print(f'UTF8: {decoded}')
    
    # Try latin1
    decoded_latin = chunk.decode('latin-1', errors='replace')
    print(f'Latin1: {decoded_latin}')

# Check: is 0xF0 present? (4-byte UTF-8 for emoji like 📊)
f0_count = raw.count(b'\xf0')
print(f'\nF0 byte count: {f0_count}')
# Check for 0xE2 (3-byte UTF-8 prefix)
e2_count = raw.count(b'\xe2')
print(f'E2 byte count: {e2_count}')
# Check for C3 A2 (double-encoded)
c3a2_count = raw.count(b'\xc3\xa2')
print(f'C3 A2 count: {c3a2_count}')

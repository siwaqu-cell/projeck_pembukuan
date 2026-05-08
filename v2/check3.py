import os

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

# The issue might be that the read tool is corrupting the display
# Let's check the ACTUAL bytes in the files

for fname in ['Dashboard.html', 'KasirForm.html', 'StatusForm.html', 'Code.gs']:
    fpath = os.path.join(V2_DIR, fname)
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    # Check for the double-encoding signature: C3 A2
    has_c3a2 = b'\xc3\xa2' in raw
    # Check for actual emoji (F0 9F = start of 4-byte UTF-8 for emoji)
    has_emoji = b'\xf0\x9f' in raw
    
    # Decode as UTF-8 and check for garbled text
    text = raw.decode('utf-8', errors='replace')
    has_garbled = '\u00c3\u00a2' in text  # the â sequence
    
    # Check if there are actual emoji characters
    emoji_count = sum(1 for c in text if ord(c) > 0x1F000)
    
    print(f'{fname}: c3a2={has_c3a2} emoji_bytes={has_emoji} garbled={has_garbled} emoji_chars={emoji_count}')
    
    # Show first non-ASCII sequence in the file
    for i, c in enumerate(text):
        if ord(c) > 127:
            context = text[max(0,i-5):i+10]
            hex_ctx = ' '.join(f'{ord(x):04X}' for x in context)
            print(f'  First non-ASCII at pos {i}: {hex_ctx}')
            print(f'  Context: {repr(context)}')
            break

"""Final cleanup: remove ALL remaining non-ASCII characters from Code.gs and StatusForm.html
and replace with appropriate ASCII equivalents."""
import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

def clean_non_ascii(text):
    """Replace all non-ASCII characters with safe equivalents."""
    result = []
    for ch in text:
        cp = ord(ch)
        if cp <= 127:
            result.append(ch)
        elif cp == 0xA0:  # non-breaking space
            result.append(' ')
        elif cp in (0xE2, 0xC3, 0xC5, 0xC2):  # Common double-encoding leftovers (â, Ã, Å, Â)
            # These are almost certainly parts of garbled encoding
            result.append('-')
        elif 0x80 <= cp <= 0xFF:
            # Latin supplement range - map common ones
            mapping = {
                0xA9: '(C)', 0xAE: '(R)', 0xB0: ' deg ',
                0xBA: 'a', 0xBB: '>>', 0xBC: '1/4', 0xBD: '1/2',
                0xBE: '3/4', 0xBF: '?',
                0xC0: 'A', 0xC1: 'A', 0xC2: 'A', 0xC3: 'A', 0xC4: 'Ae',
                0xC5: 'A', 0xC6: 'Ae', 0xC7: 'C', 0xC8: 'E', 0xC9: 'E',
                0xCA: 'E', 0xCB: 'E', 0xCC: 'I', 0xCD: 'I', 0xCE: 'I',
                0xCF: 'I', 0xD0: 'D', 0xD1: 'N', 0xD2: 'O', 0xD3: 'O',
                0xD4: 'O', 0xD5: 'O', 0xD6: 'Oe', 0xD7: 'x',
                0xD8: 'Oe', 0xD9: 'U', 0xDA: 'U', 0xDB: 'U',
                0xDC: 'Ue', 0xDD: 'Y', 0xDE: 'Th', 0xDF: 'ss',
                0xE0: 'a', 0xE1: 'a', 0xE2: 'a', 0xE3: 'a', 0xE4: 'ae',
                0xE5: 'a', 0xE6: 'ae', 0xE7: 'c', 0xE8: 'e', 0xE9: 'e',
                0xEA: 'e', 0xEB: 'e', 0xEC: 'i', 0xED: 'i', 0xEE: 'i',
                0xEF: 'i', 0xF0: 'o', 0xF1: 'n', 0xF2: 'o', 0xF3: 'o',
                0xF4: 'o', 0xF5: 'o', 0xF6: 'oe', 0xF7: '/',
                0xF8: 'oe', 0xF9: 'u', 0xFA: 'u', 0xFB: 'u',
                0xFC: 'ue', 0xFD: 'y', 0xFE: 'th', 0xFF: 'y',
            }
            result.append(mapping.get(cp, ''))
        else:
            # High Unicode (emoji, special chars) - just remove
            result.append('')
    
    text = ''.join(result)
    # Clean up
    text = re.sub(r'-{2,}', '-', text)  # Multiple dashes
    text = re.sub(r'\s{2,}', ' ', text)  # Multiple spaces
    text = re.sub(r'\(C\)\s*2026', '(C) 2026', text)  # Fix copyright
    return text

for fname in ['Code.gs', 'StatusForm.html']:
    fpath = os.path.join(V2_DIR, fname)
    print(f'Cleaning {fname}...')
    
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text = clean_non_ascii(text)
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    
    # Verify
    with open(fpath, 'rb') as f:
        raw = f.read()
    non_ascii = sum(1 for b in raw if b > 127)
    has_c3a2 = b'\xc3\xa2' in raw
    print(f'  Non-ASCII bytes: {non_ascii}, has C3A2: {has_c3a2}')

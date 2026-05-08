"""Fix double-encoded UTF-8 using CP1252 byte mapping.

The encoding chain was:
1. Original text has UTF-8 bytes like E2 80 94 (em dash —)
2. These bytes were interpreted as CP1252 characters: â (0xE2), € (0x80 in CP1252), " (0x94 in CP1252)
3. Those characters were then encoded as UTF-8: C3 A2, E2 82 AC, 22

To fix: we need to map each character BACK to its CP1252 byte value,
then combine those bytes and decode as UTF-8.
"""
import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

# Build CP1252 -> byte value mapping
CP1252_TO_BYTE = {}
for b in range(256):
    try:
        ch = bytes([b]).decode('cp1252')
        CP1252_TO_BYTE[ch] = b
    except:
        pass

# Also add ASCII characters that map to themselves (for byte values 0x80-0x9F in CP1252)
# In CP1252: 0x80=€, 0x81=undef, 0x82=‚, 0x83=ƒ, 0x84=„, 0x85=…, 0x86=†, 0x87=‡, 0x88=ˆ, 0x89=‰
# 0x8A=Š, 0x8B=‹, 0x8C=Œ, 0x8E=Ž, 0x91=' , 0x92=' , 0x93=" , 0x94=" , 0x95=•, 0x96=–, 0x97=—, 0x98=˜, 0x99=™
# 0x9A=š, 0x9B=›, 0x9C=œ, 0x9E=ž, 0x9F=Ÿ
CP1252_HIGH_BYTES = {
    0x80: '\u20AC',  # €
    0x82: '\u201A',  # ‚
    0x83: '\u0192',  # ƒ
    0x84: '\u201E',  # „
    0x85: '\u2026',  # …
    0x86: '\u2020',  # †
    0x87: '\u2021',  # ‡
    0x88: '\u02C6',  # ˆ
    0x89: '\u2030',  # ‰
    0x8A: '\u0160',  # Š
    0x8B: '\u2039',  # ‹
    0x8C: '\u0152',  # Œ
    0x8E: '\u017D',  # Ž
    0x91: '\u2018',  # '
    0x92: '\u2019',  # '
    0x93: '\u201C',  # "
    0x94: '\u201D',  # "
    0x95: '\u2022',  # •
    0x96: '\u2013',  # –
    0x97: '\u2014',  # —
    0x98: '\u02DC',  # ˜
    0x99: '\u2122',  # ™
    0x9A: '\u0161',  # š
    0x9B: '\u203A',  # ›
    0x9C: '\u0153',  # œ
    0x9E: '\u017E',  # ž
    0x9F: '\u0178',  # Ÿ
}

# Build reverse map: Unicode char -> CP1252 byte value
UNICODE_TO_CP1252_BYTE = {}
for byte_val, char in CP1252_HIGH_BYTES.items():
    UNICODE_TO_CP1252_BYTE[char] = byte_val
# Also add standard Latin-1 range (0xA0-0xFF map to themselves)
for b in range(0xA0, 0x100):
    char = chr(b)
    UNICODE_TO_CP1252_BYTE[char] = b

print(f'CP1252 reverse mapping has {len(UNICODE_TO_CP1252_BYTE)} entries')

def fix_double_encoding_text(text):
    """Fix text with double-encoded UTF-8 by reversing the CP1252 interpretation."""
    result = []
    i = 0
    fixes = 0
    
    while i < len(text):
        ch = text[i]
        
        # Check if this character could be a CP1252 byte interpretation
        byte_val = UNICODE_TO_CP1252_BYTE.get(ch)
        
        if byte_val is not None:
            # Start collecting bytes
            byte_list = [byte_val]
            j = i + 1
            
            while j < len(text):
                next_ch = text[j]
                next_byte = UNICODE_TO_CP1252_BYTE.get(next_ch)
                if next_byte is not None:
                    byte_list.append(next_byte)
                    j += 1
                else:
                    break
            
            # Try to decode collected bytes as UTF-8
            raw_bytes = bytes(byte_list)
            try:
                decoded = raw_bytes.decode('utf-8')
                
                # Check if this produced meaningful content
                # (contains non-ASCII or is longer than the original would suggest)
                has_non_ascii = any(ord(c) > 127 for c in decoded)
                is_reasonable = len(decoded) < len(byte_list) * 0.8  # UTF-8 decoded should be shorter
                
                if has_non_ascii and is_reasonable:
                    result.append(decoded)
                    fixes += 1
                    i = j
                    continue
            except UnicodeDecodeError:
                # Try smaller chunks
                pass
            
            # If full decode failed, try just the first few bytes
            if len(byte_list) >= 2:
                for length in range(min(6, len(byte_list)), 1, -1):
                    try:
                        decoded = bytes(byte_list[:length]).decode('utf-8')
                        if any(ord(c) > 127 for c in decoded):
                            result.append(decoded)
                            fixes += 1
                            # Put remaining bytes back
                            for k in range(length, len(byte_list)):
                                result.append(chr(byte_list[k]) if byte_list[k] < 128 else text[i + k])
                            i = j
                            break
                    except UnicodeDecodeError:
                        continue
                else:
                    result.append(ch)
                    i += 1
            else:
                result.append(ch)
                i += 1
        else:
            result.append(ch)
            i += 1
    
    return ''.join(result), fixes

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Multiple passes to handle triple-encoding
    for pass_num in range(5):
        new_text, fixes = fix_double_encoding_text(text)
        if fixes == 0:
            break
        text = new_text
        print(f'  Pass {pass_num + 1}: fixed {fixes} sequences')
    
    # Replace emoji with safe text
    EMOJI_MAP = {
        '\U0001F4CA': '[Dashboard]', '\U0001F4B0': '[Keuangan]',
        '\U0001F527': '[Service]', '\U0001F4C8': '[Grafik]',
        '\U0001F4E6': '[Stok]', '\U0001F4F1': '[HP]',
        '\U0001F4B5': '[Kas]', '\u2705': '[OK]',
        '\u23F3': '[Tunggu]', '\U0001F528': '[Alat]',
        '\U0001F4CB': '[Daftar]', '\U0001F5A8': '[Cetak]',
        '\U0001F3EA': '[Toko]', '\U0001F3ED': '[Pabrik]',
        '\U0001F6E0': '[Perkakas]', '\U0001F6D2': '[Keranjang]',
        '\U0001F4B3': '[Kartu]', '\U0001F48E': '[Permata]',
        '\u2B06': '[Naik]', '\u2B07': '[Turun]',
        '\U0001F6A8': '[Darurat]', '\u274C': '[Batal]',
        '\u26A0': '[Peringatan]', '\u2795': '[Tambah]',
        '\u26A1': '[Listrik]', '\u21A9': '[Kembali]',
        '\U0001F500': '[Acak]', '\U0001F5C2': '[Map]',
        '\U0001F4E5': '[Unduh]', '\U0001F310': '[Global]',
        '\U0001F504': '[Refresh]', '\U0001F4BE': '[Simpan]',
        '\U0001F6AA': '[Keluar]', '\U0001F4C4': '[Berkas]',
        '\U0001F3E0': '[Rumah]', '\U0001F4DD': '[Catatan]',
        '\U0001F4CD': '[Lokasi]', '\U0001F4E8': '[Email]',
        '\U0001F6D1': '[Hapus]', '\U0001F514': '[Lonceng]',
        '\U0001F4A1': '[Ide]', '\U0001F4B8': '[Bon]',
        '\U0001F195': '[Tanggal]', '\U0001F3AF': '[Target]',
        '\U0001F468\u200D\U0001F527': '[Teknisi]',
        '\U0001F504': '[Refresh]',
        '\u2022': '-', '\u2026': '...',
        '\u00A9': '(C)', '\u00AE': '(R)',
        '\u2014': ' -- ', '\u2013': ' - ',
        '\u201C': '"', '\u201D': '"',
        '\u2018': "'", '\u2019': "'",
        '\u00A0': ' ', '\uFE0F': '', '\u200D': '', '\u200B': '',
        '\u2122': '(TM)',
    }
    
    for emoji, replacement in sorted(EMOJI_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(emoji, replacement)
    
    # Remove any remaining emoji
    emoji_ranges = [
        (0x1F600, 0x1F64F), (0x1F300, 0x1F5FF), (0x1F680, 0x1F6FF),
        (0x1F900, 0x1F9FF), (0x1FA00, 0x1FAFF), (0x2600, 0x26FF),
        (0x2700, 0x27BF), (0xFE00, 0xFE0F), (0x1F700, 0x1F7FF),
        (0x1F1E0, 0x1F1FF),
    ]
    text = ''.join(c for c in text if not any(s <= ord(c) <= e for s, e in emoji_ranges))
    
    # Clean up
    text = re.sub(r'\s{2,}', ' ', text)
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    
    with open(filepath, 'rb') as f:
        vraw = f.read()
    still_double = b'\xc3\xa2' in vraw
    return still_double

FILES = ['KasirForm.html', 'StatusForm.html', 'Code.gs']
for fname in FILES:
    fpath = os.path.join(V2_DIR, fname)
    print(f'Processing {fname}...')
    try:
        still = process_file(fpath)
        print(f'  Result: {"STILL HAS ISSUES" if still else "CLEAN"}')
    except Exception as e:
        print(f'  ERROR: {e}')
        import traceback
        traceback.print_exc()

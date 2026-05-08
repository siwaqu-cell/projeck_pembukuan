"""Fix double-encoded files using CP1252 (Windows Latin-1) which includes Euro sign."""
import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

CORRUPTED_FILES = ['Dashboard.html', 'KasirForm.html', 'StatusForm.html', 'Code.gs']

# Emojis that should be replaced after fixing encoding
EMOJI_TO_TEXT = [
    ('\U0001F4CA', '[Dashboard]'),
    ('\U0001F4B0', '[Keuangan]'),
    ('\U0001F527', '[Service]'),
    ('\U0001F4C8', '[Grafik]'),
    ('\U0001F4E6', '[Stok]'),
    ('\U0001F4F1', '[HP]'),
    ('\U0001F4B5', '[Kas]'),
    ('\u2705', '[OK]'),
    ('\u23F3', '[Tunggu]'),
    ('\U0001F528', '[Alat]'),
    ('\U0001F4CB', '[Daftar]'),
    ('\U0001F5A8', '[Cetak]'),
    ('\U0001F3EA', '[Toko]'),
    ('\U0001F3ED', '[Pabrik]'),
    ('\U0001F6E0', '[Perkakas]'),
    ('\U0001F6D2', '[Keranjang]'),
    ('\U0001F4B3', '[Kartu]'),
    ('\U0001F48E', '[Permata]'),
    ('\u2B06', '[Naik]'),
    ('\u2B07', '[Turun]'),
    ('\U0001F6A8', '[Darurat]'),
    ('\u274C', '[Batal]'),
    ('\u26A0', '[Peringatan]'),
    ('\u2795', '[Tambah]'),
    ('\u26A1', '[Listrik]'),
    ('\u21A9', '[Kembali]'),
    ('\U0001F500', '[Acak]'),
    ('\U0001F5C2', '[Map]'),
    ('\U0001F4E5', '[Unduh]'),
    ('\U0001F310', '[Global]'),
    ('\U0001F504', '[Refresh]'),
    ('\U0001F4BE', '[Simpan]'),
    ('\U0001F6AA', '[Keluar]'),
    ('\U0001F4C4', '[Berkas]'),
    ('\U0001F3E0', '[Rumah]'),
    ('\U0001F4DD', '[Catatan]'),
    ('\U0001F4CD', '[Lokasi]'),
    ('\U0001F4E8', '[Email]'),
    ('\U0001F6D1', '[Hapus]'),
    ('\U0001F514', '[Lonceng]'),
    ('\U0001F4A1', '[Ide]'),
    ('\U0001F4B8', '[Bon]'),
    ('\U0001F195', '[Tanggal]'),
    ('\U0001F3AF', '[Target]'),
    ('\u2022', '-'),
    ('\u2026', '...'),
    ('\u00A9', '(C)'),
    ('\u00AE', '(R)'),
    ('\u2014', ' -- '),
    ('\u2013', ' - '),
    ('\u201C', '"'),
    ('\u201D', '"'),
    ('\u2018', "'"),
    ('\u2019', "'"),
    ('\u00A0', ' '),
    ('\uFE0F', ''),
    ('\u200D', ''),
    ('\u200B', ''),
    ('\u200C', ''),
    # ZWJ sequences for compound emoji
    ('\U0001F468\u200D\U0001F527', '[Teknisi]'),
    ('\U0001F468\u200D\U0001F52C', '[Ilmuwan]'),
]

def fix_double_encoding(text):
    """Fix text that was UTF-8, decoded as CP1252, then re-encoded as UTF-8."""
    try:
        # Encode back to CP1252 to get original UTF-8 bytes
        raw = text.encode('cp1252')
        # Decode those bytes as UTF-8
        return raw.decode('utf-8', errors='replace')
    except (UnicodeEncodeError, UnicodeDecodeError):
        # Some chars might not be in CP1252, try segment by segment
        result = []
        i = 0
        segments_ok = 0
        segments_fail = 0
        while i < len(text):
            if ord(text[i]) > 127:
                # Collect consecutive high-byte chars
                j = i
                while j < len(text) and ord(text[j]) > 127:
                    j += 1
                segment = text[i:j]
                try:
                    decoded = segment.encode('cp1252').decode('utf-8')
                    result.append(decoded)
                    segments_ok += 1
                except (UnicodeEncodeError, UnicodeDecodeError):
                    # Try just replacing known garbled sequences
                    result.append(segment)
                    segments_fail += 1
                i = j
            else:
                result.append(text[i])
                i += 1
        return ''.join(result)

def remove_emoji(text):
    """Replace all emoji with safe text."""
    # First handle compound emoji (sort by length desc)
    for emoji, replacement in sorted(EMOJI_TO_TEXT, key=lambda x: -len(x[0])):
        text = text.replace(emoji, replacement)
    
    # Remove remaining emoji using Unicode ranges
    ranges = [
        (0x1F600, 0x1F64F),  # Emoticons
        (0x1F300, 0x1F5FF),  # Misc Symbols
        (0x1F680, 0x1F6FF),  # Transport
        (0x1F700, 0x1F77F),  # Alchemical
        (0x1F780, 0x1F7FF),  # Geometric
        (0x1F800, 0x1F8FF),  # Supplemental Arrows
        (0x1F900, 0x1F9FF),  # Supplemental Symbols
        (0x1FA00, 0x1FA6F),  # Chess
        (0x1FA70, 0x1FAFF),  # Symbols Extended
        (0x1F1E0, 0x1F1FF),  # Flags
        (0x2600, 0x26FF),    # Misc Symbols
        (0x2700, 0x27BF),    # Dingbats
        (0xFE00, 0xFE0F),    # Variation selectors
    ]
    text_list = []
    for c in text:
        cp = ord(c)
        in_range = any(start <= cp <= end for start, end in ranges)
        if in_range:
            text_list.append('')
        else:
            text_list.append(c)
    text = ''.join(text_list)
    
    # Clean up
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'\(\s*\)', '', text)
    text = re.sub(r'\[\s*\]', '', text)
    
    return text

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Step 1: Fix double encoding (may need multiple passes)
    for _ in range(3):
        new_text = fix_double_encoding(text)
        if new_text == text:
            break
        text = new_text
    
    # Step 2: Replace emoji
    text = remove_emoji(text)
    
    # Step 3: Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Write
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    
    # Verify
    with open(filepath, 'rb') as f:
        verify = f.read()
    still_double = b'\xc3\xa2' in verify
    has_emoji_bytes = b'\xf0\x9f' in verify
    
    return not still_double, not has_emoji_bytes

for fname in CORRUPTED_FILES:
    fpath = os.path.join(V2_DIR, fname)
    print(f'Processing {fname}...')
    try:
        no_double, no_emoji = process_file(fpath)
        print(f'  No double-encoding: {no_double}, No emoji bytes: {no_emoji}')
    except Exception as e:
        print(f'  ERROR: {e}')
        import traceback
        traceback.print_exc()

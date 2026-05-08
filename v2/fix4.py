"""Aggressively fix double-encoded files - handle all remaining garbled sequences."""
import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

FILES = ['KasirForm.html', 'StatusForm.html', 'Code.gs']

# Direct byte-level mapping from known double-encoded sequences
# These are the common patterns we see in the files
BYTE_FIXES = {
    # Em dash: original UTF-8 E2 80 94 -> double encoded as C3 A2 E2 82 AC 22
    # -> actually: E2 80 94 in Latin-1 reads as â€" -> in UTF-8: C3 A2 E2 82 AC E2 80 9C
    # But the files show: C3 A2 E2 82 AC 22 -> this is â€" with just 3 chars
    # Actually: â (E2) + € (AC 22?) hmm
    # Let me just map the known garbled text patterns to their intended characters
    
    # These are the TEXT patterns (after UTF-8 decode) that represent garbled encoding
    '\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2': '',  # garbage
    '\u00c3\u00a2\u00e2\u20ac\u0153': '',  # garbage  
}

# Known garbled emoji -> replacement text
GARBLED_MAP = {
    '\u00c3\u00b0\u00c5\u00b8\xe2\x80\x9c\xc5\xa0': '[Dashboard]',  # 📊 double-encoded
    # We'll use a different approach
}

def aggressive_fix(filepath):
    """Fix remaining double-encoding by working directly with bytes."""
    with open(filepath, 'rb') as f:
        raw = f.read()
    
    # The double-encoding pattern: UTF-8 bytes were read as cp1252/latin1, 
    # producing characters with code points 0x80-0xFF.
    # Then these were encoded as UTF-8 again.
    # To fix: find byte sequences C3 A2, C3 A9, etc. (which represent high bytes
    # in the 0x80-0xFF range) and try to reassemble the original UTF-8 bytes.
    
    # Strategy: decode the entire file as UTF-8, then for each character in the 
    # 0x80-0xFF range, try to convert it back to the original UTF-8 byte.
    # If consecutive such characters form valid UTF-8, replace them.
    
    text = raw.decode('utf-8', errors='replace')
    
    # Find all runs of "high" characters that look like double-encoded bytes
    # Characters in range 0x80-0xFF when decoded from cp1252 map to single bytes
    # When these single bytes are concatenated, they might form valid UTF-8
    
    result = []
    i = 0
    fixes = 0
    while i < len(text):
        cp = ord(text[i])
        if cp >= 0x80 and cp <= 0xFF:
            # Start of a potential double-encoded sequence
            # Collect consecutive characters in this range
            j = i
            byte_list = []
            while j < len(text) and 0x80 <= ord(text[j]) <= 0xFF:
                # Map cp1252 characters back to their byte values
                c = text[j]
                byte_val = ord(c)
                # Some characters above 0x7F are already single-byte values in cp1252
                byte_list.append(byte_val)
                j += 1
            
            # Try to decode these bytes as UTF-8
            try:
                utf8_bytes = bytes(byte_list)
                decoded = utf8_bytes.decode('utf-8')
                # Check if it contains emoji or special chars
                if any(ord(c) > 0x7F for c in decoded):
                    # This was a valid double-encoded sequence
                    result.append(decoded)
                    fixes += 1
                else:
                    # It decoded to ASCII, probably not double-encoded
                    result.append(text[i:j])
            except UnicodeDecodeError:
                # Not valid UTF-8, keep as-is
                result.append(text[i:j])
            
            i = j
        else:
            result.append(text[i])
            i += 1
    
    text = ''.join(result)
    print(f'  Fixed {fixes} double-encoded sequences')
    
    # Now replace actual emoji with text
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
        '\u2022': '-', '\u2026': '...',
        '\u00A9': '(C)', '\u00AE': '(R)',
        '\u2014': ' -- ', '\u2013': ' - ',
        '\u201C': '"', '\u201D': '"',
        '\u2018': "'", '\u2019': "'",
        '\u00A0': ' ', '\uFE0F': '', '\u200D': '', '\u200B': '',
    }
    
    for emoji, replacement in sorted(EMOJI_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(emoji, replacement)
    
    # Remove any remaining high Unicode chars (emoji ranges)
    ranges = [
        (0x1F600, 0x1F64F), (0x1F300, 0x1F5FF), (0x1F680, 0x1F6FF),
        (0x1F900, 0x1F9FF), (0x1FA00, 0x1FAFF), (0x2600, 0x26FF),
        (0x2700, 0x27BF), (0xFE00, 0xFE0F), (0x1F700, 0x1F7FF),
    ]
    text = ''.join(c for c in text if not any(s <= ord(c) <= e for s, e in ranges))
    
    # Clean up
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'\(\s*\)', '', text)
    text = re.sub(r'\[\s*\]', '', text)
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    
    # Verify
    with open(filepath, 'rb') as f:
        vraw = f.read()
    return b'\xc3\xa2' not in vraw

for fname in FILES:
    fpath = os.path.join(V2_DIR, fname)
    print(f'Processing {fname}...')
    ok = aggressive_fix(fpath)
    print(f'  Result: {"CLEAN" if ok else "STILL HAS ISSUES"}')

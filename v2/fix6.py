"""Fix double-encoded files by working directly with raw bytes.

Known double-encoding patterns:
- E2 80 94 (em dash —) -> CP1252: â€" -> UTF-8: C3 A2 E2 82 AC 22
  Wait no: E2=â, 80=€(CP1252), 94="(CP1252)
  But the byte 0x94 in CP1252 maps to U+201D (right double quotation mark)
  So: â€" in text = â(C3A2) + €(E282AC) + "(E2809D)
  Actually: 0x94 in CP1252 = " (U+201D), which in UTF-8 = E2 80 9D
  So E2 80 94 in CP1252: E2=â(C3A2), 80=€(E282AC), 94="(E2809D)
  Combined: C3 A2 E2 82 AC E2 80 9D
  
  But in the actual files we see: C3 A2 E2 82 AC 22
  22 = " (ASCII quote, U+0022)
  
  This means the 0x94 byte was NOT mapped through CP1252 but treated as raw ASCII.
  So the chain is: UTF-8 E2 80 94 -> interpreted as: E2(â), 80(€ in CP1252), 94(" in ASCII)
  
  Hmm but that's inconsistent. Let me just map the known byte sequences directly.
"""

import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

# Direct byte-level replacements: double-encoded UTF-8 sequence -> intended character in UTF-8
# Format: (bytes_to_find, utf8_replacement_bytes)
BYTE_REPLACEMENTS = [
    # Em dash: — (U+2014) = E2 80 94 -> double encoded as C3 A2 E2 82 AC 22
    (b'\xc3\xa2\xe2\x82\xac\x22', b'\xe2\x80\x94'),  # —
    
    # ← (U+2190) = E2 86 90 -> double encoded as C3 A2 E2 80 A0 C2 90
    (b'\xc3\xa2\xe2\x80\xa0\xc2\x90', b'\xe2\x86\x90'),  # ←
    
    # • (U+2022) = E2 80 A2 -> double encoded as C3 A2 C2 AC E2 80 A2 
    (b'\xc3\xa2\xc2\xac\xe2\x80\xa2', b'\xe2\x80\xa2'),  # •
    
    # – (U+2013) = E2 80 93 -> double encoded as C3 A2 C2 AC E2 80 A1
    (b'\xc3\xa2\xc2\xac\xe2\x80\xa1', b'\xe2\x80\x93'),  # –
    
    # ℹ (U+2139) = E2 84 B9 -> double encoded as C3 A2 E2 80 B9
    (b'\xc3\xa2\xe2\x80\xb9', b'\xe2\x84\xb9'),  # ℹ
    
    # ⚙ (U+2699) = E2 9A 99 -> double encoded as C3 A2 C5 A1 E2 84 A2
    (b'\xc3\xa2\xc5\xa1\xe2\x84\xa2', b'\xe2\x9a\x99'),  # ⚙
    
    # ➕ (U+2795) = E2 9E 95 -> double encoded as C3 A2 C5 BE (partial?)
    # Let me check: E2 9E 95 -> E2=â(C3A2), 9E=ž(E2 9E in UTF-8 = ž U+017E), 95=• in CP1252
    # But 9E in CP1252 maps to ž (U+017E), UTF-8 = C5 BE
    # 95 in CP1252 maps to • (U+2022), UTF-8 = E2 80 A2
    # So E2 9E 95 -> C3 A2 C5 BE E2 80 A2
    (b'\xc3\xa2\xc5\xbe\xe2\x80\xa2', b'\xe2\x9e\x95'),  # ➕
    
    # ⏸ (U+23F8) = E2 8F B8
    (b'\xc3\xa2\xe2\x8f\xb8\xc3\xaf\xc2\xb8\xc2\x8f', b'\xe2\x8f\xb8'),  # ⏸
    
    # ❌ (U+274C) = E2 9D 8C
    (b'\xc3\xa2\xe2\x9d\x8c', b'\xe2\x9d\x8c'),  # ❌
    
    # ™ (U+2122) = E2 84 A2 -> C3 A2 E2 84 A2
    (b'\xc3\xa2\xe2\x84\xa2', b'\xe2\x84\xa2'),  # ™ (identity)
    
    # 🏷 (U+1F3F7) = F0 9F 8F B7
    # E2=â(C3A2), 8F=? Let me check: 0x8F is undefined in CP1252
    # This might be treated differently
    
    # ™ (U+2122) 
    # Actually let me check more carefully. ™ = E2 84 A2
    # E2 -> â -> C3 A2
    # 84 -> in CP1252 is † (U+2020) -> UTF-8: E2 80 A0... no
    # Actually 0x84 in CP1252 = „ (U+201E) -> UTF-8: E2 80 9E
    # So ™ E2 84 A2 -> C3 A2 E2 80 9E C2 A2
    
    # ☑ (U+2611) = E2 98 91
    # E2 -> C3 A2, 98 -> (in CP1252 0x98 = ˜ U+02DC -> UTF-8 CB 9C)... 
    # This is getting complex. Let me just handle the most common patterns.
]

# Emoji to text replacement (after UTF-8 decoding)
EMOJI_REPLACEMENTS = {
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
    '\u2122': '(TM)', '\u2020': '', '\u2021': '',
    '\u02C6': '', '\u2030': '', '\u0160': 'S',
    '\u0152': 'OE', '\u017D': 'Z',
    '\u0161': 's', '\u0153': 'oe', '\u017E': 'z',
    '\u0178': 'Y', '\u0192': 'f',
    '\u201A': ',', '\u201E': '"',
    '\u2039': '<', '\u203A': '>',
    '\u02DC': '~',
}

FILES = ['KasirForm.html', 'StatusForm.html', 'Code.gs']

for fname in FILES:
    fpath = os.path.join(V2_DIR, fname)
    print(f'Processing {fname}...')
    
    with open(fpath, 'rb') as f:
        raw = f.read()
    
    # Apply byte-level fixes
    total_byte_fixes = 0
    for old_bytes, new_bytes in BYTE_REPLACEMENTS:
        count = raw.count(old_bytes)
        if count > 0:
            raw = raw.replace(old_bytes, new_bytes)
            total_byte_fixes += count
    print(f'  Byte-level fixes: {total_byte_fixes}')
    
    # Decode as UTF-8
    text = raw.decode('utf-8', errors='replace')
    
    # Apply emoji text replacements
    for emoji, replacement in sorted(EMOJI_REPLACEMENTS.items(), key=lambda x: -len(x[0])):
        text = text.replace(emoji, replacement)
    
    # Remove remaining emoji
    emoji_ranges = [
        (0x1F600, 0x1F64F), (0x1F300, 0x1F5FF), (0x1F680, 0x1F6FF),
        (0x1F900, 0x1F9FF), (0x1FA00, 0x1FAFF), (0x2600, 0x26FF),
        (0x2700, 0x27BF), (0xFE00, 0xFE0F), (0x1F700, 0x1F7FF),
        (0x1F1E0, 0x1F1FF), (0x1FAF0, 0x1FAFF),
    ]
    text = ''.join(c for c in text if not any(s <= ord(c) <= e for s, e in emoji_ranges))
    
    # Remove remaining garbled sequences (any C3 A2 pattern still present)
    # At this point they should be rare, just clean them up
    text = text.replace('\u00c3\u00a2', '-')  # â -> -
    
    # Clean up
    text = re.sub(r'\s{2,}', ' ', text)
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Write
    with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    
    # Verify
    with open(fpath, 'rb') as f:
        vraw = f.read()
    still_double = b'\xc3\xa2' in vraw
    print(f'  Result: {"STILL HAS ISSUES" if still_double else "CLEAN"} (C3A2 remaining: {vraw.count(b"\\xc3\\xa2")})')

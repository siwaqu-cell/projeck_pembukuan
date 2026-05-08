"""Fix double-encoded UTF-8 in the 4 remaining corrupted files.

The issue: UTF-8 text was decoded as ISO-8859-1, then re-encoded as UTF-8.
Example: 📊 (U+1F4CA) -> UTF-8: F0 9F 93 CA -> read as Latin-1: ðŸ"Š -> UTF-8: C3 B0 C5 B8 E2 80 9C C5 A0

To fix: encode current string as Latin-1 (get back the original UTF-8 bytes), then decode as UTF-8.
"""
import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

CORRUPTED_FILES = ['Dashboard.html', 'KasirForm.html', 'StatusForm.html', 'Code.gs']

# After fixing double-encoding, these are the real emoji we'll replace
EMOJI_TO_TEXT = {
    '\U0001F4CA': '[Dashboard]',   # 📊
    '\U0001F4B0': '[Keuangan]',    # 💰
    '\U0001F527': '[Service]',     # 🔧
    '\U0001F4C8': '[Grafik]',      # 📈
    '\U0001F4E6': '[Stok]',        # 📦
    '\U0001F4F1': '[HP]',          # 📱
    '\U0001F4B5': '[Kas]',         # 💵
    '\u2705': '[OK]',              # ✅
    '\u23F3': '[Tunggu]',          # ⏳
    '\U0001F528': '[Alat]',        # 🔨
    '\U0001F4CB': '[Daftar]',      # 📋
    '\U0001F5A8': '[Cetak]',       # 🖨
    '\U0001F3EA': '[Toko]',        # 🏪
    '\U0001F468\u200D\U0001F527': '[Teknisi]',  # 👨‍🔧
    '\U0001F3ED': '[Pabrik]',      # 🏭
    '\U0001F6E0\uFE0F': '[Perkakas]',  # 🛠️
    '\U0001F6D2': '[Keranjang]',   # 🛒
    '\U0001F4B3': '[Kartu]',       # 💳
    '\U0001F48E': '[Permata]',     # 💎
    '\u2B06\uFE0F': '[Naik]',      # ⬆️
    '\u2B07\uFE0F': '[Turun]',     # ⬇️
    '\U0001F6A8': '[Darurat]',     # 🚨
    '\u274C': '[Batal]',           # ❌
    '\u26A0\uFE0F': '[Peringatan]', # ⚠️
    '\u2795': '[Tambah]',          # ➕
    '\u26A1': '[Listrik]',         # ⚡
    '\u21A9\uFE0F': '[Kembali]',   # ↩️
    '\U0001F500': '[Acak]',        # 🔀
    '\U0001F5C2\uFE0F': '[Map]',   # 🗂️
    '\U0001F4E5': '[Unduh]',       # 📥
    '\U0001F310': '[Global]',      # 🌐
    '\U0001F504': '[Refresh]',     # 🔄
    '\U0001F4BE': '[Simpan]',      # 💾
    '\U0001F6AA': '[Keluar]',      # 🚪
    '\U0001F4C4': '[Berkas]',      # 📄
    '\U0001F3E0': '[Rumah]',       # 🏠
    '\U0001F4DD': '[Catatan]',     # 📝
    '\U0001F4CD': '[Lokasi]',      # 📍
    '\U0001F4E8': '[Email]',       # 📨
    '\U0001F6D1': '[Tempat Sampah]', # 🗑
    '\U0001F514': '[Lonceng]',     # 🔔
    '\U0001F4A1': '[Ide]',         # 💡
    '\U0001F4B8': '[Bon]',         # 💸
    '\U0001F195': '[Tanggal]',     # 📅
    '\U0001F504': '[Segar]',       # 🔄
    '\U0001F3AF': '[Target]',      # 🎯
    '\u00AE': '(R)',               # ®
    '\u00A9': '(C)',               # ©
    '\u2014': ' -- ',              # —
    '\u2013': ' - ',               # –
    '\u201C': '"',                 # "
    '\u201D': '"',                 # "
    '\u2018': "'",                 # '
    '\u2019': "'",                 # '
    '\u2026': '...',               # …
    '\u2022': ' * ',               # •
    '\u2032': "'",                 # ′
    '\u2033': '"',                 # ″
    '\u2716': '[X]',               # ✖
    '\u2714': '[Cek]',             # ✔
    '\u2713': '[Cek]',             # ✓
    '\u25CF': '*',                 # ●
    '\u25CB': 'o',                 # ○
    '\u00A0': ' ',                 # non-breaking space
    '\uFE0F': '',                  # variation selector (invisible)
    '\u200D': '',                  # zero-width joiner
    '\u200B': '',                  # zero-width space
    '\u200C': '',                  # zero-width non-joiner
}

def fix_file(filepath):
    """Read file as UTF-8, fix double-encoding, replace emoji, save as UTF-8 with LF."""
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Step 1: Fix double-encoding
    # The current text has sequences like C3 B0 C5 B8 which represent
    # the byte sequence F0 9F when read as Latin-1 and re-encoded as UTF-8
    # To fix: we need to encode the text back to Latin-1 (reproducing the original UTF-8 bytes)
    # then decode as UTF-8.
    try:
        # Try to encode as latin-1 (this should work since the double-encoded text
        # only contains latin-1 compatible characters)
        raw_bytes = text.encode('latin-1')
        fixed = raw_bytes.decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError) as e:
        # If that fails, try a byte-by-byte approach for the problematic chars
        print(f"  Standard fix failed: {e}, trying fallback...")
        fixed = text
        # Try to fix character by character
        result = []
        i = 0
        while i < len(text):
            ch = text[i]
            code = ord(ch)
            if code > 127:
                # High byte - might be part of double-encoding
                # Collect consecutive high-byte chars
                segment = ch
                j = i + 1
                while j < len(text) and ord(text[j]) > 127:
                    segment += text[j]
                    j += 1
                try:
                    # Try to decode this segment as latin-1 -> utf-8
                    decoded = segment.encode('latin-1').decode('utf-8')
                    result.append(decoded)
                except:
                    result.append(segment)
                i = j
            else:
                result.append(ch)
                i += 1
        fixed = ''.join(result)
    
    # Step 2: Replace emoji with safe text
    # Sort by length (longest first) to handle compound emoji
    for emoji, replacement in sorted(EMOJI_TO_TEXT.items(), key=lambda x: -len(x[0])):
        fixed = fixed.replace(emoji, replacement)
    
    # Step 3: Remove any remaining emoji using regex
    # BMP emoji ranges
    fixed = re.sub(r'[\U00002702-\U000027B0]', '', fixed)  # Dingbats
    fixed = re.sub(r'[\U00002600-\U000026FF]', '', fixed)  # Misc symbols
    fixed = re.sub(r'[\U0000FE00-\U0000FE0F]', '', fixed)  # Variation selectors
    # Supplementary emoji ranges
    fixed = re.sub(r'[\U0001F600-\U0001F64F]', '', fixed)  # Emoticons
    fixed = re.sub(r'[\U0001F300-\U0001F5FF]', '', fixed)  # Misc Symbols & Pictographs
    fixed = re.sub(r'[\U0001F680-\U0001F6FF]', '', fixed)  # Transport & Map
    fixed = re.sub(r'[\U0001F900-\U0001F9FF]', '', fixed)  # Supplemental Symbols
    fixed = re.sub(r'[\U0001FA00-\U0001FA6F]', '', fixed)  # Chess
    fixed = re.sub(r'[\U0001FA70-\U0001FAFF]', '', fixed)  # Symbols Extended
    fixed = re.sub(r'[\U0001F1E0-\U0001F1FF]', '', fixed)  # Flags
    fixed = re.sub(r'[\U0001FAF0-\U0001FAFF]', '', fixed)  # Symbols Extended-A
    
    # Step 4: Clean up artifacts
    fixed = re.sub(r'\s{2,}', ' ', fixed)  # Multiple spaces
    fixed = fixed.replace('\r\n', '\n').replace('\r', '\n')  # Normalize line endings
    # Remove empty parentheses/brackets left by emoji removal
    fixed = re.sub(r'\(\s*\)', '', fixed)
    fixed = re.sub(r'\[\s*\]', '', fixed)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(fixed)
    
    # Verify
    with open(filepath, 'rb') as f:
        verify = f.read()
    still_corrupt = b'\xc3\xa2' in verify
    emoji_remaining = verify.count(b'\xf0\x9f')
    
    return not still_corrupt, emoji_remaining

for fname in CORRUPTED_FILES:
    fpath = os.path.join(V2_DIR, fname)
    print(f'Processing {fname}...')
    try:
        ok, emojis = fix_file(fpath)
        print(f'  Result: {"OK" if ok else "STILL CORRUPT"}, remaining emoji: {emojis}')
    except Exception as e:
        print(f'  ERROR: {e}')

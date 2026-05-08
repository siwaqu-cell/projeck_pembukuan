#!/usr/bin/env python3
"""Fix double-encoded UTF-8 files and replace all emoji with safe text labels."""
import os
import re
import sys

V2_DIR = r"C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2"

# Mapping from actual emoji (in correct UTF-8) to safe text replacements
# We map from the intended emoji to safe text
EMOJI_MAP = {
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
    '\U0001F6E0': '[Perkakas]',    # 🛠
    '\U0001F6D2': '[Keranjang]',   # 🛒
    '\U0001F4B3': '[Kartu]',       # 💳
    '\U0001F48E': '[Permata]',     # 💎
    '\u2B06': '[Naik]',            # ⬆
    '\u2B07': '[Turun]',           # ⬇
    '\U0001F6A8': '[Darurat]',     # 🚨
    '\u274C': '[Batal]',           # ❌
    '\u26A0': '[Peringatan]',      # ⚠
    '\u2795': '[Tambah]',          # ➕
    '\u26A1': '[Listrik]',         # ⚡
    '\u21A9': '[Kembali]',         # ↩
    '\U0001F500': '[Acak]',        # 🔀
    '\U0001F5C2': '[Map]',         # 🗂
    '\U0001F4E5': '[Unduh]',       # 📥
    '\U0001F310': '[Global]',      # 🌐
    '\U0001F504': '[Refresh]',     # 🔄
    '\U0001F4BE': '[Simpan]',      # 💾
    '\U0001F6AA': '[Keluar]',      # 🚪
    '\U0001F4C4': '[Berkas]',      # 📄
    '\U0001F3E0': '[Rumah]',       # 🏠
    '\U0001F9F9': '[Kunci]',       # 🔒
    '\U0001F510': '[Gembok]',      # 🔐
    '\u2139': '[Info]',            # ℹ
    '\u2022': '-',                 # •
    '\u2026': '...',               # …
    '\u2190': '[Kiri]',            # ←
    '\u2192': '[Kanan]',           # →
    '\u2716': '[X]',               # ✖
    '\u00D7': 'x',                 # ×
    '\u25CF': '-',                 # ●
    '\u2714': '[Cek]',             # ✔
    '\u2611': '[Centang]',         # ☑
    '\U0001F4DD': '[Catatan]',     # 📝
    '\U0001F4C1': '[Folder]',      # 📁
    '\U0001F3D7': '[Bangunan]',    # 🏷
    '\U0001F4E8': '[Email]',       # 📨
    '\U0001F6D1': '[Cadangan]',    # 🗑
    '\U0001F514': '[Lonceng]',     # 🔔
    '\U0001F4A1': '[Ide]',         # 💡
    '\U0001F5B1': '[Klik]',        # 🖱
    '\U0001F381': '[Hadiah]',      # 🎁
    '\U0001F3C6': '[Piala]',       # 🏆
    '\U0001F4CD': '[Lokasi]',      # 📍
    '\U0001F4AF': '[Wow]',         # 💯
    '\U0001F517': '[Link]',        # 🔗
    '\U0001F4CE': '[Klip]',        # 📎
    '\U0001F51D': '[Top]',         # 🔝
    '\U0001F6E2': '[Database]',    # 🗂️
    '\U0001F4CA': '[Laporan]',     # 📊 duplicate key
    '\U0001F3D7': '[Tag]',         # 🏷
    '\U0001F4C9': '[Trend Down]',  # 📉
    '\U0001F680': '[Roket]',       # 🚀
    '\U0001F916': '[Robot]',       # 🤖
    '\U0001F3AF': '[Target]',      # 🎯
    '\U0001F525': '[Api]',         # 🔥
    '\U00002795': '[Plus]',        # ➕
    '\U0001F4B8': '[Bon]',         # 💸
    '\U0001F4D1': '[Baru]',        # 📑
    '\U0001F422': '[Kura]',        # 🐢
    '\U0001F3AF': '[Goal]',        # 🎯
    '\U0001F195': '[Tanggal]',     # 📅
    '\U0001F6D2': '[Shopping]',    # 🛒
}

def fix_double_encoding(text):
    """Fix double-encoded UTF-8 by reading as latin-1 bytes and re-decoding as UTF-8."""
    try:
        # The text contains characters that are the result of UTF-8 bytes 
        # being decoded as ISO-8859-1. To fix: encode back to latin-1, decode as UTF-8.
        fixed = text.encode('iso-8859-1').decode('utf-8', errors='replace')
        return fixed
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text

def replace_emojis(text):
    """Replace all known emoji with safe text labels."""
    for emoji, replacement in sorted(EMOJI_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(emoji, replacement)
    
    # Also catch any remaining emoji-like characters (Unicode ranges)
    # Common emoji ranges that might remain after fixing
    text = re.sub(r'[\U0001F600-\U0001F64F]', '', text)  # Emoticons
    text = re.sub(r'[\U0001F300-\U0001F5FF]', '', text)  # Misc Symbols
    text = re.sub(r'[\U0001F680-\U0001F6FF]', '', text)  # Transport
    text = re.sub(r'[\U0001F700-\U0001F77F]', '', text)  # Alchemical
    text = re.sub(r'[\U0001F780-\U0001F7FF]', '', text)  # Geometric
    text = re.sub(r'[\U0001F800-\U0001F8FF]', '', text)  # Supplemental Arrows
    text = re.sub(r'[\U0001F900-\U0001F9FF]', '', text)  # Supplemental Symbols
    text = re.sub(r'[\U0001FA00-\U0001FA6F]', '', text)  # Chess
    text = re.sub(r'[\U0001FA70-\U0001FAFF]', '', text)  # Symbols Extended
    text = re.sub(r'[\U00002702-\U000027B0]', '', text)  # Dingbats
    text = re.sub(r'[\U0000FE00-\U0000FE0F]', '', text)  # Variation selectors
    
    return text

def process_file(filepath):
    """Process a single file: fix encoding and replace emojis."""
    # Read as binary
    with open(filepath, 'rb') as f:
        raw = f.read()
    
    # Try to decode as UTF-8 first (the current state)
    try:
        text = raw.decode('utf-8', errors='replace')
    except:
        text = raw.decode('latin-1', errors='replace')
    
    # Fix double encoding
    fixed = fix_double_encoding(text)
    
    # Replace emojis with safe text
    fixed = replace_emojis(fixed)
    
    # Clean up extra whitespace around replacements
    fixed = re.sub(r'\[\w+\]\s+\[', '[', fixed)  # Merge adjacent brackets
    fixed = re.sub(r'\s{2,}', ' ', fixed)  # Multiple spaces -> single
    
    # Write back as UTF-8
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(fixed)
    
    return True

def main():
    fixed_count = 0
    
    for filename in os.listdir(V2_DIR):
        filepath = os.path.join(V2_DIR, filename)
        if not os.path.isfile(filepath):
            continue
        if not (filename.endswith('.html') or filename.endswith('.gs')):
            continue
        
        # Check if file has encoding issues
        with open(filepath, 'rb') as f:
            raw = f.read()
        
        # Check for double-encoding pattern (0xC3 0xA2 = â in UTF-8)
        has_issue = b'\xc3\xa2' in raw or b'\xe2\x82' in raw or b'\xe2\x80' in raw
        if not has_issue:
            # Also check for emoji characters
            try:
                text = raw.decode('utf-8', errors='replace')
                has_emoji = any(ord(c) > 0x2000 and ord(c) < 0xFFFF for c in text)
            except:
                has_emoji = False
        
        if has_issue or has_emoji:
            try:
                process_file(filepath)
                print(f"FIXED: {filename}")
                fixed_count += 1
            except Exception as e:
                print(f"ERROR: {filename}: {e}")
        else:
            print(f"OK: {filename}")
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()

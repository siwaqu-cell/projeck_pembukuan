"""Replace [Text] icon labels with cleaner text-based icons in WebApp.html."""
import os
import re

V2_DIR = r'C:\Users\siwa\.openclaw-autoclaw\workspace\projeck_pembukuan\v2'

# Read file
with open(V2_DIR + '/WebApp.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace icon spans with cleaner text labels (no brackets)
icon_replacements = [
    # Sidebar navigation icons
    ('<span class="icon">[Laporan]</span> Dashboard', '<span class="icon">LBL</span> Dashboard'),
    ('<span class="icon">[Kas]</span> Manajemen Kasir', '<span class="icon">KAS</span> Manajemen Kasir'),
    ('<span class="icon">[Plus]</span> Transaksi Baru', '<span class="icon">+TRX</span> Transaksi Baru'),
    ('<span class="icon">[Shopping]</span> Penjualan Aksesoris', '<span class="icon">JUAL</span> Penjualan Aksesoris'),
    ('<span class="icon">[Refresh]</span> Update Status', '<span class="icon">STS</span> Update Status'),
    ('<span class="icon">[Stok]</span> Pembelian Part', '<span class="icon">BELI</span> Pembelian Part'),
    ('<span class="icon">[Kembali]</span> Return Supplier', '<span class="icon">RET</span> Return Supplier'),
    ('<span class="icon">[Acak]</span> Transfer Cabang', '<span class="icon">TRF</span> Transfer Cabang'),
    ('<span class="icon">[Map]</span> Master Data', '<span class="icon">DATA</span> Master Data'),
    ('<span class="icon">[Keuangan]</span> Laporan Kas', '<span class="icon">KAS</span> Laporan Kas'),
    ('<span class="icon">[Stok]</span> Laporan Stok', '<span class="icon">STK</span> Laporan Stok'),
    ('<span class="icon">[Daftar]</span> Stock Opname', '<span class="icon">OPN</span> Stock Opname'),
    ('<span class="icon">[Laporan]</span> Laporan Lengkap', '<span class="icon">LAP</span> Laporan Lengkap'),
    ('<span class="icon">[Grafik]</span> Laporan Laba Rugi', '<span class="icon">LR</span> Laporan Laba Rugi'),
    ('<span class="icon">[Service]</span> Laporan Servisan', '<span class="icon">SVC</span> Laporan Servisan'),
    ('<span class="icon">[Rumah]</span> Ringkasan Tutup Toko', '<span class="icon">TT</span> Ringkasan Tutup Toko'),
    ('<span class="icon">[Daftar]</span> Riwayat Part', '<span class="icon">RWT</span> Riwayat Part'),
    ('<span class="icon">[Unduh]</span> Import Stok', '<span class="icon">IMP</span> Import Stok'),
    ('<span class="icon">[Peringatan]</span> Pembatalan / Void', '<span class="icon">VOI</span> Pembatalan / Void'),
    # Footer
    ('<span class="icon">[Keluar]</span>', '<span class="icon">OUT</span>'),
    # Top bar
    ('[Refresh] Segarkan Data', 'Segarkan Data'),
]

for old, new in icon_replacements:
    text = text.replace(old, new)

# Also replace other [Text] patterns
text = re.sub(r'\[Dashboard\]', 'LBL', text)
text = re.sub(r'\[Service\]', 'SVC', text)
text = re.sub(r'\[Keuangan\]', 'FIN', text)
text = re.sub(r'\[Grafik\]', 'GRA', text)
text = re.sub(r'\[Stok\]', 'STK', text)
text = re.sub(r'\[HP\]', 'HP', text)
text = re.sub(r'\[Kas\]', 'KAS', text)
text = re.sub(r'\[OK\]', 'OK', text)
text = re.sub(r'\[Batal\]', 'X', text)
text = re.sub(r'\[Peringatan\]', '!', text)
text = re.sub(r'\[Tambah\]', '+', text)
text = re.sub(r'\[Hapus\]', 'DEL', text)
text = re.sub(r'\[Catatan\]', 'NOTE', text)
text = re.sub(r'\[Global\]', 'GLB', text)
text = re.sub(r'\[Simpan\]', 'SAV', text)
text = re.sub(r'\[Keluar\]', 'OUT', text)
text = re.sub(r'\[Refresh\]', 'REF', text)
text = re.sub(r'\[Laporan\]', 'RPT', text)
text = re.sub(r'\[Daftar\]', 'LST', text)
text = re.sub(r'\[Berkas\]', 'DOC', text)
text = re.sub(r'\[Rumah\]', 'HOME', text)
text = re.sub(r'\[Target\]', 'TGT', text)
text = re.sub(r'\[Bon\]', 'BON', text)
text = re.sub(r'\[Alat\]', 'TL', text)

# Write back
with open(V2_DIR + '/WebApp.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print('WebApp.html icons updated')

# Also update Dashboard.html and other HTML files
for fname in ['Dashboard.html', 'KasirForm.html', 'StatusForm.html']:
    fpath = V2_DIR + '/' + fname
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Replace remaining [Text] labels
    for old, new in [
        ('[Dashboard]', 'Dashboard'), ('[Keuangan]', 'Kas'),
        ('[Grafik]', 'Grafik'), ('[Stok]', 'Stok'),
        ('[Kas]', 'Kas'), ('[Service]', 'Servis'),
        ('[HP]', 'HP'), ('[OK]', 'OK'),
        ('[Batal]', 'Batal'), ('[Daftar]', 'Daftar'),
        ('[Tambah]', '+'), ('[Hapus]', 'Hapus'),
        ('[Peringatan]', '!'), ('[Simpan]', 'Simpan'),
        ('[Keluar]', 'Keluar'), ('[Refresh]', 'Refresh'),
        ('[Laporan]', 'Laporan'), ('[Catatan]', 'Catatan'),
        ('[Berkas]', 'Berkas'), ('[Rumah]', 'Rumah'),
        ('[Global]', 'Global'), ('[Target]', 'Target'),
        ('[Bon]', 'Bon'), ('[Alat]', 'Alat'),
        ('[Keranjang]', 'Keranjang'), ('[Kartu]', 'Kartu'),
        ('[Toko]', 'Toko'), ('[Cetak]', 'Cetak'),
        ('[Teknisi]', 'Teknisi'), ('[Map]', 'Map'),
        ('[Unduh]', 'Unduh'), ('[Acak]', 'Acak'),
        ('[Kembali]', 'Kembali'), ('[Lokasi]', 'Lokasi'),
        ('[Email]', 'Email'), ('[Lonceng]', 'Lonceng'),
        ('[Ide]', 'Ide'), ('[Tanggal]', 'Tanggal'),
        ('[Permata]', 'Permata'), ('[Pabrik]', 'Pabrik'),
        ('[Perkakas]', 'Perkakas'), ('[Darurat]', 'DARURAT'),
        ('[Tunggu]', 'Tunggu'), ('[Naik]', '^'),
        ('[Turun]', 'v'), ('[Listrik]', 'Listrik'),
        ('[Shopping]', 'Jual'), ('[Trending]', 'Trend'),
    ]:
        text = text.replace(old, new)
    
    with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print(f'{fname} labels cleaned')

import os

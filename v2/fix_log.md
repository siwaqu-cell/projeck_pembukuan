# FIX LOG — v2 Batch Fix

## 2026-05-06

### FIX 1: Scripts.html — Timezone fix + utility tambahan
- **getTodayStr()** & **getMonthStartStr()**: Diganti dari `toISOString().split('T')[0]` ke manual `getFullYear()/getMonth()/getDate()` agar menggunakan timezone lokal (bukan UTC).
- **getLast30DaysStr()**: Ditambahkan sebagai utility baru untuk default filter 30 hari.
- **escHtml()**: Ditambahkan — fungsi escape HTML untuk mencegah XSS.
- **navigateTo()**: Ditambahkan cleanup `document.querySelectorAll('[id$="_portal_"]').forEach(el => el.remove())` sebelum navigasi.

### FIX 2: Dashboard.html — Hapus debug log + fix simbol
- Dihapus: 2 baris `console.log('[DASH DEBUG] ...')`
- Diganti emoji: 📱🔄📊💳📋💰📦✅ → teks biasa di judul/label.

### FIX 3: StatusForm.html — Hapus debug log + fix DOM ID
- **Bug fix**: `document.getElementById('trxDetailPanel')` diganti ke `statusDetailPanel` di fungsi `konfirmasiVoidTrx()`.
- Dihapus: 2 baris `console.log('[STATUS] ...')`
- Diganti emoji: 🔄🔍📋⚡💾🔧✏️💰🖨️🗑️💵🏦 → teks biasa.

### FIX 4: KasirForm.html — Hapus debug log + fix simbol
- Dihapus: 3 baris `console.log('[KASIR DEBUG] ...')`
- Diganti emoji: 💵💳⬆️⬇️💸🏪📋 → teks biasa di judul/KPI label.

### FIX 5: RiwayatPart.html — Verifikasi
- `getLast30DaysStr()` sudah dipakai sebagai default date.
- `savedOnChange` pattern sudah ada di `setOpts()`.

### FIX 6: ServiceForm.html — Verifikasi
- `onSupplierChange(rid)` sudah ada.
- `pMerk` sudah punya `onchange="onFilter(${rid});onSupplierChange(${rid})"`.
- `pSup` sudah punya `onchange="onSupplierChange(${rid})"`.

### FIX 7: WebApp.html — Hapus emoji sidebar
- Diganti semua emoji di sidebar navigation icons (📊💵➕🛒🔄📦↩️🔀🗂️💰📦📋📊📈🔧🏠📥⚠️🚪) → bullet `•` atau teks biasa.

### FIX 8: File Laporan — Verifikasi
- LaporanKas, LaporanLabaRugi, LaporanServisan, RingkasanHarian: Sudah bersih (tidak ada emoji, pesan data kosong sudah jelas).
- LaporanLengkap: Improved empty state message dari "Tidak ada data" → "Belum ada data untuk periode ini".
- Semua sudah menggunakan `getMonthStartStr()` yang sekarang timezone-correct.

### FIX 9: Code.gs — Tambah diagData
- Ditambahkan fungsi `diagData()` di akhir file untuk debugging — mengembalikan jumlah baris data per sheet.
- "Force push v2" tidak ditemukan (sudah bersih).

# 🚀 PANDUAN SETUP SERVICEPRO HP v2 (BERSIH + BUG FIX)

## STEP 1: Siapkan Google Spreadsheet Baru

1. Login ke akun Gmail **BARU** di browser
2. Buka: https://sheets.google.com
3. Klik **"+ (Blank)"** untuk buat spreadsheet baru
4. Rename sheet jadi: **"ServicePro HP Database v2"**
5. Copy **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/INI_SPREADSHEET_ID/edit
   ```
6. Simpan ID tersebut

## STEP 2: Buat Project Google Apps Script

1. Buka: https://script.google.com (login akun Gmail baru)
2. Klik **"New Project"**
3. Hapus file `Code.gs` default (klik kanan > Delete)
4. Klik ikon **"+"** di kiri > pilih **"Script"**
5. Rename project jadi **"ServicePro HP v2"** (klik nama project di atas)

## STEP 3: Hubungkan Spreadsheet ke Script

1. Di Apps Script editor, klik menu **⏰ (Project Settings / Jam)** — ikon roda gigi
   - atau: **Overview** > **Project Settings**
2. Di bagian **"Script Properties"**, klik **"Add script property"**
   - **Name:** `SS_ID`
   - **Value:** paste Spreadsheet ID dari Step 1
3. Klik **Save**

## STEP 4: Copy Semua File .gs ke Apps Script

Buat file .gs satu per satu di Apps Script editor (**"+"** > **"Script"**), lalu copy-paste konten dari folder `projeck_pembukuan/v2/`:

### Urutan pembuatan file:

| No | Nama File (tanpa .gs) | Source File |
|----|----------------------|-------------|
| 1 | `Code` | `v2/Code.gs` |
| 2 | `Setup` | `v2/Setup.gs` |
| 3 | `RoleHelper` | `v2/RoleHelper.gs` |
| 4 | `DataHelper` | `v2/DataHelper.gs` |
| 5 | `TransaksiHelperV2` | `v2/TransaksiHelperV2.gs` |
| 6 | `StatusHelper` | `v2/StatusHelper.gs` |
| 7 | `PembelianHelper` | `v2/PembelianHelper.gs` |
| 8 | `MasterDataHelper` | `v2/MasterDataHelper.gs` |
| 9 | `TransferHelper` | `v2/TransferHelper.gs` |
| 10 | `RiwayatHelperV2` | `v2/RiwayatHelperV2.gs` |
| 11 | `AutoHelper` | `v2/AutoHelper.gs` |
| 12 | `BackupHelper` | `v2/BackupHelper.gs` |
| 13 | `ResetHelper` | `v2/ResetHelper.gs` |
| 14 | `Trigger` | `v2/Trigger.gs` |

### Cara copy-paste:
1. Klik **"+"** > **"Script"**
2. Rename file (klik nama file di atas editor, hapus `.gs`)
3. Buka file source dari folder `v2/` di komputer
4. Select All (Ctrl+A) > Copy > Paste ke editor
5. Klik **💾 Save** (Ctrl+S)

## STEP 5: Copy Semua File .html ke Apps Script

Buat file HTML satu per satu (**"+"** > **"HTML"**), copy-paste dari folder `projeck_pembukuan/v2/`:

| No | Nama File (tanpa .html) | Source File |
|----|------------------------|-------------|
| 1 | `Styles` | `v2/Styles.html` |
| 2 | `Scripts` | `v2/Scripts.html` |
| 3 | `WebApp` | `v2/WebApp.html` |
| 4 | `Dashboard` | `v2/Dashboard.html` |
| 5 | `ServiceForm` | `v2/ServiceForm.html` |
| 6 | `StatusForm` | `v2/StatusForm.html` |
| 7 | `BatalTransaksi` | `v2/BatalTransaksi.html` |
| 8 | `MasterData` | `v2/MasterData.html` |
| 9 | `PembelianFormV2` | `v2/PembelianFormV2.html` |
| 10 | `ReturnForm` | `v2/ReturnForm.html` |
| 11 | `TransferForm` | `v2/TransferForm.html` |
| 12 | `LaporanKas` | `v2/LaporanKas.html` |
| 13 | `LaporanLabaRugi` | `v2/LaporanLabaRugi.html` |
| 14 | `LaporanLengkap` | `v2/LaporanLengkap.html` |
| 15 | `LaporanServisan` | `v2/LaporanServisan.html` |
| 16 | `LaporanStok` | `v2/LaporanStok.html` |
| 17 | `RingkasanHarian` | `v2/RingkasanHarian.html` |
| 18 | `RiwayatPart` | `v2/RiwayatPart.html` |
| 19 | `ImportStok` | `v2/ImportStok.html` |
| 20 | `KasirForm` | `v2/KasirForm.html` |
| 21 | `PenjualanForm` | `v2/PenjualanForm.html` |
| 22 | `StockOpname` | `v2/StockOpname.html` |
| 23 | `NotaHelper` | `v2/NotaHelper.html` |

## STEP 6: Jalankan Setup Awal

1. Di Apps Script editor, dropdown function selector (atas) pilih **`setupAll`**
2. Klik **▶ Run**
3. Google akan minta izin (Authorization) — klik **Review permissions** > **Advanced** > **Go to ServicePro HP v2 (unsafe)** > **Allow**
4. Tunggu sampai muncul "✅ Setup Berhasil"
5. Buka Google Spreadsheet — seharusnya sudah ada **18 sheet** baru

## STEP 7: Deploy sebagai Web App

1. Klik **Deploy** (kanan atas) > **New deployment**
2. Klik ikon roda gigi ⚙️ > pilih **"Web app"**
3. Isi:
   - **Description:** `ServicePro HP v2`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone**
4. Klik **Deploy**
5. Copy **Web app URL** — ini link untuk membuka aplikasi
6. Test buka URL di browser

## STEP 8: Ganti Password Default (PENTING!)

Login pertama kali:
- Username: `admin` / Password: `admin123`

**SEGERA ganti password** di menu **Master Data > tab Users** atau langsung di sheet USERS di Google Spreadsheet.

> Password v2 sudah di-hash (SHA-256). Jika lupa password, bisa reset langsung di spreadsheet.

---

## ✅ Checklist Setelah Deploy

- [ ] Spreadsheet punya 18 sheet
- [ ] Web App bisa dibuka
- [ ] Login admin berhasil
- [ ] Dashboard tampil (bukan kosong)
- [ ] Coba buat 1 transaksi servis
- [ ] Coba update status ke SELESAI_DIAMBIL
- [ ] Cek KAS_HARIAN — ada entri kas masuk?
- [ ] Cek RIWAYAT_PART — ada riwayat stok keluar?
- [ ] Ganti password admin

---

## 🔧 Troubleshooting

### "Spreadsheet tidak ditemukan"
- Pastikan SS_ID di Script Properties sudah benar
- Coba paste tanpa spasi di awal/akhir

### "Authorization required" terus muncul
- Deploy ulang: Deploy > Manage deployments > Edit > versi baru

### Dashboard kosong
- Jalankan `setupAll()` lagi
- Cek apakah sheet TRANSAKSI dan KAS_HARIAN punya header yang benar

### Error saat login
- Buka sheet USERS di spreadsheet
- Cek password sudah di-hash atau belum
- Password v2 format: 64 karakter hex (SHA-256)

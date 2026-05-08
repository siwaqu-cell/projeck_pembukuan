# Code Review — ServicePro HP v5.3

**Tanggal Review:** 2026-05-06  
**Reviewer:** Senior Code Reviewer  
**Scope:** Seluruh file `.gs` (backend) dan `.html` (frontend)  
**Total File Direview:** 18 file `.gs` + 15 file `.html` (functional, excluding documentation/story)

---

## Ringkasan Eksekutif

ServicePro HP adalah sistem manajemen servis HP multi-cabang yang cukup komprehensif. Secara arsitektur, sistem menggunakan pendekatan yang benar — **double-entry bookkeeping** untuk kas (KAS_HARIAN), **RBAC** berbasis role (OWNER/ADMIN/TEKNISI), dan **LockService** untuk operasi write yang kritis (stok, transaksi).

Namun, review ini menemukan **23 temuan** yang perlu diperhatikan, terdiri dari:
- **4 temuan Kritis** 🔴 — potensi kehilangan data akuntansi, kebocoran data sensitif
- **11 temuan Sedang** 🟡 — bug UX, inkonsistensi logika, masalah akurasi laporan
- **8 temuan Ringan** 🟢 — code smell, best practice, optimasi

### Temuan Paling Urgen:
1. **Password disimpan plaintext** — seluruh user password tersimpan tanpa hash di Google Sheets
2. **RBAC hanya di frontend** — banyak fungsi write backend tidak validasi role/permission
3. **Pembelian tanpa tanggal** bisa tercatat di database tanpa tanggal, merusak laporan
4. **Batal/void transaksi** tidak memiliki protection dari eksekusi ganda (idempotency)

---

## 🔴 Temuan Kritis (4)

### K-01: Password Disimpan Plain Text di Google Sheets
- **File:** `Setup.gs` (baris setupDefaultUsers), `MasterDataHelper.gs` (saveUser)
- **Penjelasan:** Semua password user tersimpan sebagai teks biasa di sheet USERS. Fungsi `setupDefaultUsers()` menulis `"admin123"`, `"sib123"`, dll. Fungsi `saveUser()` menyimpan `data.password` langsung tanpa hashing. Siapa pun yang memiliki akses ke Google Sheets bisa membaca semua password.
- **Risiko:** Kebocoran kredensial seluruh user sistem. Jika spreadsheet di-share ke orang yang salah, atau ada kebocoran akses Google, semua password terekspos.
- **Saran:**
  ```javascript
  // Setup.gs — Ganti password default dengan hash
  // MasterDataHelper.gs — Hash password sebelum simpan
  function hashPassword(plain) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plain)
      .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); })
      .join('');
  }
  
  // Di login(), bandingkan hash:
  // if (hashPassword(inputPassword) !== storedHash) return error
  ```

### K-02: RBAC Hanya Dieksekusi di Frontend, Banyak Fungsi Backend Tanpa Validasi
- **File:** `TransaksiHelperV2.gs`, `PembelianHelper.gs`, `TransferHelper.gs`, `MasterDataHelper.gs`, `StatusHelper.gs`, `DataHelper.gs`
- **Penjelasan:** Hampir semua fungsi backend (`saveTransaksi`, `savePembelian`, `saveTransfer`, `savePart`, `updateStatus`, `editPart`, `batalTransaksi`, `saveConfig`, `saveUser`, dll) **tidak memvalidasi role/permission** pemanggil. RBAC hanya diimplementasi di frontend (menyembunyikan tombol/menu berdasarkan role).
- **Risiko:** User dengan role TEKNISI atau bahkan non-user yang tahu nama fungsi bisa memanggil `google.script.run.saveUser()`, `google.script.run.batalTransaksi()`, dll langsung dari browser console. Ini adalah **celah authorization bypass** yang serius.
- **Saran:** Tambahkan validasi role di setiap fungsi backend yang write:
  ```javascript
  function saveTransaksi(data) {
    var session = validateSession(data.createdBy);
    if (!session) return {success:false, message:'Akses ditolak'};
    if (!hasPermission(session.role, 'transaksi_write')) 
      return {success:false, message:'Anda tidak memiliki izin'};
    // ... existing logic
  }
  
  function validateSession(username) {
    var users = getSheetData(SHEET_NAMES.USERS);
    return users.find(function(u) {
      return u.USERNAME === username && u.STATUS === 'AKTIF';
    });
  }
  ```

### K-03: Batal/Void Transaksi Rentan Eksekusi Ganda (Tidak Idempotent)
- **File:** `StatusHelper.gs` (fungsi `batalTransaksi`), `BatalTransaksi.html` (frontend)
- **Penjelasan:** Fungsi `batalTransaksi()` mengembalikan stok dan mereverse kas. Jika user mengklik dua kali (atau network timeout menyebabkan retry), void akan dieksekusi dua kali — stok dikembalikan double dan kas direverse double.
- **Risiko:** **Kerusakan akuntansi serius** — stok jadi lebih banyak dari seharusnya, dan kas mencatat pengeluaran dua kali padahal hanya satu transaksi yang di-void.
- **Saran:**
  ```javascript
  function batalTransaksi(id, keterangan) {
    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      var trx = findTrxById(id);
      if (!trx) return {success:false, message:'Transaksi tidak ditemukan'};
      if (trx.STATUS === 'BATAL') return {success:false, message:'Sudah dibatalkan sebelumnya'};
      // ... existing void logic
    } finally {
      lock.releaseLock();
    }
  }
  ```
  Tambahkan pengecekan status BATAL sebelum memproses, dan gunakan LockService.

### K-04: Fungsi `saveCabang`, `saveKaryawan`, `savePelanggan`, `saveConfig`, `saveUser` Tidak Menggunakan LockService
- **File:** `MasterDataHelper.gs`
- **Penjelasan:** Semua fungsi CRUD di MasterDataHelper.gs **tidak menggunakan LockService**. Hanya `savePart` yang pakai lock. Jika dua user membuka Master Data secara bersamaan dan mengedit karyawan/cabang yang sama secara paralel, bisa terjadi race condition.
- **Risiko:** Data bisa saling timpa (lost update). Pada skenario tertentu, ini bisa menyebabkan data master rusak (misalnya cabang dihapus oleh dua orang, atau config kritis di-overwrite).
- **Saran:** Tambahkan `LockService.getScriptLock()` di semua fungsi write di `MasterDataHelper.gs`.

---

## 🟡 Temuan Sedang (11)

### S-01: Validasi Stok Minus Tidak Konsisten
- **File:** `TransaksiHelperV2.gs` (saveTransaksi), `PembelianHelper.gs` (saveReturn)
- **Penjelasan:** Di `saveTransaksi()`, stok dikurangi tanpa validasi apakah stok mencukupi. Jika stok 2 tapi user input qty 5, stok akan jadi -3. Di `saveReturn()`, stok ditambah tapi tidak ada batas maksimum. Di `saveTransfer()`, ada validasi `qty > stokTersedia` — tapi di transaksi servis tidak ada.
- **Dampak:** Stok bisa jadi negatif, menyebabkan laporan stok tidak akurat dan bisa menyesatkan keputusan pembelian.
- **Saran:** Tambahkan validasi di `saveTransaksi()`:
  ```javascript
  if (newStok < 0) {
    return {success:false, message:'Stok '+namaPart+' tidak mencukupi. Sisa: '+oldStok};
  }
  ```

### S-02: Error Message Mengekspos Internal Stack Trace
- **File:** Semua file `.gs` (pattern: `'Error: '+e.message`)
- **Penjelasan:** Hampir semua catch block mengembalikan `e.message` langsung ke frontend. Error Google Apps Script bisa berisi informasi sensitif seperti nama sheet, range, bahkan snippet data.
- **Dampak:** User biasa bisa melihat struktur internal database. Dalam konteks keamanan, ini adalah information disclosure.
- **Saran:**
  ```javascript
  catch(e) {
    console.error('saveTransaksi error: ' + e.message); // log detail ke console
    return {success:false, message:'Terjadi kesalahan sistem. Silakan coba lagi.'}; // pesan generik
  }
  ```

### S-03: Session Hanya Disimpan di localStorage (Frontend-Side Only)
- **File:** `Scripts.html` (objek Session), `Code.gs` (fungsi login)
- **Penjelasan:** Session disimpan di `localStorage` browser. Backend tidak melakukan validasi token/session pada setiap pemanggilan fungsi. Backend hanya menerima `createdBy` (username string) dari frontend tanpa verifikasi bahwa user benar-benar login.
- **Dampak:** User bisa memanipulasi localStorage untuk mengubah role, cabang, bahkan memalsukan identitas. Bersama K-02, ini membuat seluruh RBAC bypass-able.
- **Saran:** Implementasi token-based session sederhana menggunakan `PropertiesService` atau `CacheService`:
  ```javascript
  // Di login():
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('session:'+token, JSON.stringify(session), 28800); // 8 jam
  
  // Di setiap fungsi write:
  function validateRequest(token) {
    var data = CacheService.getScriptCache().get('session:'+token);
    if (!data) return null;
    return JSON.parse(data);
  }
  ```

### S-04: Input Angka Negatif Tidak Divalidasi
- **File:** `ServiceForm.html`, `PembelianFormV2.html`, `KasirForm.html`, `PenjualanForm.html`
- **Penjelasan:** Input harga (hargaBeli, hargaJual, ongkos, qty) menggunakan `type="number"` dengan `min="0"` di HTML, tapi **backend tidak memvalidasi** nilai negatif. `type="number"` di browser bisa di-bypass melalui developer tools atau direct API call.
- **Dampak:** User jahat bisa input harga -1000000 untuk mencatat "pengembalian" palsu, atau qty negatif untuk menambah stok tanpa pembelian.
- **Saran:** Validasi di backend:
  ```javascript
  if (Number(data.ongkosKerja) < 0) return {success:false, message:'Ongkos kerja tidak boleh negatif'};
  data.parts.forEach(function(p) {
    if (p.qty < 1) throw new Error('Qty harus minimal 1');
    if (p.hargaJual < 0) throw new Error('Harga jual tidak boleh negatif');
  });
  ```

### S-05: Pembelian Bisa Disimpan Tanpa Tanggal
- **File:** `PembelianFormV2.html`, `PembelianHelper.gs`
- **Penjelasan:** Field tanggal pembelian (`beliTgl`) tidak required di HTML maupun di backend `savePembelian()`. Jika user tidak mengisi tanggal, `data.tanggal` akan menjadi string kosong `""`, dan di backend akan fallback ke `getTimestamp()` (yang menghasilkan format datetime, bukan date). Ini bisa menyebabkan inkonsistensi di laporan.
- **Dampak:** Laporan pembelian harian/bulanan bisa tidak akurat jika ada transaksi tanpa tanggal yang jelas.
- **Saran:** Jadikan tanggal wajib:
  ```javascript
  // Frontend: Tambah required attribute
  // Backend:
  if (!data.tanggal) return {success:false, message:'Tanggal pembelian wajib diisi'};
  ```

### S-06: Komisi Default Hardcoded 10% di Frontend
- **File:** `ServiceForm.html` (baris: `document.getElementById('trxKomisi').value=Math.round(lk*10/100)`)
- **Penjelasan:** Komisi teknisi selalu dihitung 10% dari laba kotor secara hardcoded. Padahal di sheet CONFIG ada key `KOMISI_DEFAULT_PERSEN` dan di sheet KARYAWAN ada kolom `KOMISI_PERSEN` per individu.
- **Dampak:** Komisi tidak mengikuti konfigurasi yang sudah disetup, menyebabkan penggajian tidak akurat.
- **Saran:** Kirim komisi persen dari backend dan gunakan:
  ```javascript
  // Di getTransaksiFormData(), sertakan komisiPersen dari karyawan
  // Di frontend:
  var komisiPersen = trxFormData.teknisiKomisi || 10;
  document.getElementById('trxKomisi').value = Math.round(lk * komisiPersen / 100);
  ```

### S-07: Potongan XSS via innerHTML dengan Data User
- **File:** `ServiceForm.html`, `StatusForm.html`, `Dashboard.html`, `PenjualanForm.html`, `MasterData.html`
- **Penjelasan:** Banyak tempat dimana data dari server (nama pelanggan, catatan, kerusakan) di-render langsung ke DOM via `innerHTML` tanpa escaping:
  - `StatusForm.html`: `dc.innerHTML = ... ${t.NAMA_PELANGGAN} ... ${t.TELEPON} ...`
  - `Dashboard.html`: `html += ... ${t.NAMA_PELANGGAN||''} ...`
  - `NotaHelper.html`: `container.innerHTML = ... ${n.pelanggan} ... ${n.kerusakan} ...`
  - `Modal.confirm()`: `overlay.innerHTML = ... ${title} ... ${message} ...`
- **Dampak:** Jika user memasukkan `<script>alert('xss')</script>` di field nama pelanggan atau catatan, kode tersebut bisa dieksekusi saat data ditampilkan (stored XSS).
- **Saran:** Buat fungsi escaping:
  ```javascript
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  // Gunakan: escHtml(t.NAMA_PELANGGAN) alih-alih t.NAMA_PELANGGAN
  ```

### S-08: Transfer Part Tidak Mengurangi Stok Cabang Asal dengan Benar Saat Batch
- **File:** `TransferHelper.gs` (saveTransferMasal)
- **Penjelasan:** Di `saveTransferMasal()`, setiap item transfer mengurangi stok cabang asal dan menambah stok cabang tujuan. Jika item pertama berhasil tapi item kedua gagal (misalnya stok tidak cukup), maka sebagian transfer terjadi dan sebagian gagal — **partial commit**.
- **Dampak:** Data stok inkonsisten — cabang asal sudah berkurang untuk beberapa item tapi cabang tujuan belum bertambah.
- **Saran:** Implementasikan pattern "validasi semua dulu, baru eksekusi":
  ```javascript
  // 1. Validasi semua stok dulu
  items.forEach(function(item) {
    var currentStok = getStokById(item.id, cabangAsal);
    if (currentStok < item.qty) throw new Error('Stok ' + item.nama + ' tidak cukup');
  });
  // 2. Jika semua valid, baru eksekusi semua
  items.forEach(function(item) { /* kurangi/tambah stok */ });
  ```

### S-09: `getTransaksiList` Memuat Semua Data (Performance Issue)
- **File:** `DataHelper.gs` (getTransaksiList), `StatusHelper.gs` (getTransaksiDetail)
- **Penjelasan:** Fungsi `getTransaksiList()` memuat seluruh sheet TRANSAKSI ke memory lalu memfilter di JavaScript. Untuk 5000+ transaksi, ini akan melebihi quota Google Apps Script (6 menit execution time) dan berpotensi timeout.
- **Dampak:** Sistem akan sangat lambat atau bahkan error saat data transaksi sudah besar (6-12 bulan operasional).
- **Saran:** Gunakan `sheet.getRange()` dengan filter yang lebih spesifik, atau implementasi paginasi server-side.

### S-10: Duplicate API Call di loadTransferStok
- **File:** `TransferForm.html` (baris dalam fungsi loadTransferStok)
- **Penjelasan:** 
  ```javascript
  transferStokList = await API.call('getStokByCabang', asal);
  transferStokList = await API.call('getStokByCabang', asal); // duplicate!
  ```
  API call yang sama dijalankan dua kali berturut-turut.
- **Dampak:** Pemborosan quota Google Apps Script API call dan membuat load time 2x lebih lambat.
- **Saran:** Hapus baris duplikat kedua.

### S-11: Ref Element yang Salah di konfirmasiVoidTrx
- **File:** `StatusForm.html` (fungsi konfirmasiVoidTrx, baris akhir)
- **Penjelasan:** Setelah void berhasil, kode mencoba menyembunyikan `trxDetailPanel`:
  ```javascript
  document.getElementById('trxDetailPanel').style.display = 'none';
  ```
  Tapi ID yang benar di halaman Status adalah `statusDetailPanel`. Jadi panel detail tidak akan disembunyikan setelah void.
- **Dampak:** UX bug — setelah void, panel detail tetap terlihat dengan data yang sudah dibatalkan.
- **Saran:** Ganti `trxDetailPanel` dengan `statusDetailPanel`.

---

## 🟢 Temuan Ringan (8)

### L-01: Konsistensi Naming Convention Tidak Seragam
- **File:** Seluruh file `.gs` dan `.html`
- **Penjelasan:** Mix antara camelCase (`saveTransaksi`) dan snake_case (`SHEET_NAMES`), mix bahasa Indonesia (`logActivity`) dan Inggris (`StatusHelper`). Kolom sheet menggunakan UPPER_SNAKE_CASE (`NAMA_PELANGGAN`) tapi property objek JavaScript menggunakan camelCase (`namaPelanggan`).
- **Saran:** Pilih satu konvensi dan konsisten. Ini bukan bug tapi mempengaruhi maintainability jangka panjang.

### L-02: Magic Numbers di Kode
- **File:** `StatusForm.html` (`3000` max wait), `ServiceForm.html` (komisi `10`), `Code.gs` (timeout `30000`)
- **Penjelasan:** Angka-angka spesifik di-hardcode di berbagai tempat tanpa konstanta.
- **Saran:** Ekstrak ke konstanta bernama.

### L-03: Console.log Debug yang Tertinggal
- **File:** `Dashboard.html` (`[DASH DEBUG]`), `StatusForm.html` (`[STATUS]`), `KasirForm.html` (`[KASIR DEBUG]`)
- **Penjelasan:** Banyak console.log dengan prefix debug yang seharusnya dihapus sebelum production.
- **Saran:** Hapus atau ganti dengan conditional `if (window.DEBUG)`.

### L-04: Autocomplete Portal Div Tidak Di-Cleanup
- **File:** `ServiceForm.html`, `PembelianFormV2.html`, `PenjualanForm.html`
- **Penjelasan:** Setiap kali autocomplete dibuat, div portal baru (`pAC_portal_X`, `bAC_portal_X`, `pnjAC_portal_X`) ditambahkan ke `<body>` tapi tidak pernah dihapus saat halaman berpindah. Jika user berpindah halaman berkali-kali, DOM akan terisi div orphan.
- **Dampak:** Memory leak minor. Pada penggunaan intensif, bisa menyebabkan DOM bengkak.
- **Saran:** Cleanup semua portal div saat `loadPage()` dipanggil:
  ```javascript
  // Di loadPage():
  document.querySelectorAll('[id$="_portal_"]').forEach(el => el.remove());
  ```

### L-05: Fungsi `deleteCabang` Tidak Cek Referensi
- **File:** `MasterDataHelper.gs` (deleteCabang)
- **Penjelasan:** `deleteCabang()` hanya menonaktifkan cabang (soft delete), tapi tidak mengecek apakah ada karyawan, stok, atau transaksi yang masih mereferensi cabang tersebut.
- **Dampak:** Cabang yang sudah dinonaktifkan masih bisa muncul di laporan historis transaksi (ini mungkin diinginkan, tapi perlu dokumentasi).

### L-06: Validasi Kolom Tidak Handle Sheet yang Sudah Di-Edit Manual
- **File:** `Trigger.gs` (onEditTrigger)
- **Penjelasan:** `onEditTrigger` memanggil `setupValidasi()` setiap ada edit di sheet master. Ini memicu update data validation yang bisa memperlambat penggunaan spreadsheet langsung.
- **Saran:** Tambahkan debounce timer atau hanya sync jika kolom yang diedit adalah kolom yang mempengaruhi dropdown.

### L-07: Format CSV Parser Sederhana
- **File:** `AutoHelper.gs` (parseCSV), `MasterDataHelper.gs` (importPersamaanCSV)
- **Penjelasan:** CSV parser menggunakan `split(',')` yang tidak handle quoted fields dengan koma di dalamnya.
- **Saran:** Gunakan regex CSV parser yang lebih robust, atau batasi input user agar tidak menggunakan koma dalam nilai field.

### L-08: `unformatRupiah` Menghapus Titik (Pemisah Ribuan) DAN Koma
- **File:** `Scripts.html` (fungsi unformatRupiah)
- **Penjelasan:** 
  ```javascript
  return Number(String(str).replace(/\./g, '').replace(/,/g, '')) || 0;
  ```
  Kedua regex ini menghapus titik DAN koma. Padahal di format Indonesia, titik adalah pemisah ribuan dan koma adalah desimal. Fungsi ini akan menghapus koma desimal juga. Ini membuat angka desimal (seperti harga 1.500,50) akan menjadi 150050 (tidak ada desimal).
- **Dampak:** Jika sistem digunakan dengan harga desimal, perhitungan akan salah. Namun untuk Rupiah yang biasanya bulat, ini jarang jadi masalah.
- **Saran:** Pisahkan penanganan ribuan dan desimal, atau pastikan seluruh sistem hanya menggunakan angka bulat.

---

## Matriks Prioritas Perbaikan

| # | Temuan | Kategori | Prioritas | Estimasi Effort |
|---|--------|----------|-----------|----------------|
| K-01 | Password Plain Text | Kritis | 🔴 P1 | 2-3 jam |
| K-02 | RBAC Backend Missing | Kritis | 🔴 P1 | 4-6 jam |
| K-03 | Void Tidak Idempotent | Kritis | 🔴 P1 | 1 jam |
| K-04 | LockService Missing di Master CRUD | Kritis | 🔴 P1 | 1 jam |
| S-03 | Session Backend | Sedang | 🔴 P1 | 3-4 jam |
| S-07 | XSS via innerHTML | Sedang | 🟡 P2 | 2-3 jam |
| S-01 | Validasi Stok Minus | Sedang | 🟡 P2 | 30 menit |
| S-04 | Input Negatif | Sedang | 🟡 P2 | 1 jam |
| S-06 | Komisi Hardcode | Sedang | 🟡 P2 | 30 menit |
| S-08 | Transfer Partial Commit | Sedang | 🟡 P2 | 1 jam |
| S-05 | Pembelian Tanpa Tanggal | Sedang | 🟡 P2 | 15 menit |
| S-02 | Error Message Exposure | Sedang | 🟡 P2 | 1 jam |
| S-09 | Performance Query | Sedang | 🟡 P3 | 3-4 jam |
| S-10 | Duplicate API Call | Sedang | 🟡 P3 | 5 menit |
| S-11 | Wrong DOM ID | Sedang | 🟡 P3 | 5 menit |
| L-04 | Portal Div Leak | Ringan | 🟢 P4 | 15 menit |
| L-03 | Debug Console.log | Ringan | 🟢 P4 | 15 menit |
| L-08 | Rupiah Unformat | Ringan | 🟢 P4 | 30 menit |
| L-01 | Naming Convention | Ringan | 🟢 P5 | Ongoing |
| L-02 | Magic Numbers | Ringan | 🟢 P5 | Ongoing |
| L-05 | Delete Cabang Ref Check | Ringan | 🟢 P5 | 30 menit |
| L-06 | Validation Debounce | Ringan | 🟢 P5 | 30 menit |
| L-07 | CSV Parser | Ringan | 🟢 P5 | 1 jam |

---

## Catatan Arsitektur Positif

Meskipun ada temuan di atas, beberapa aspek arsitektur sudah **bagus**:

1. ✅ **LockService** digunakan di fungsi kritis: `saveTransaksi()`, `savePart()`, `savePembelian()`, `saveReturn()`, `saveTransferMasal()`
2. ✅ **Sheet caching** (`getSheetData`, `clearSheetCache`) mengurangi read operations ke Google Sheets
3. ✅ **Double-entry bookkeeping** untuk kas: setiap transaksi mencatat KAS_HARIAN (per cabang) dan KAS_PUSAT (agregat)
4. ✅ **Riwayat tracking** lengkap: RIWAYAT_PART mencatat semua pergerakan stok
5. ✅ **Activity logging** mencatat semua aksi user
6. ✅ **Soft delete** untuk data master (STATUS = NONAKTIF) bukan hard delete
7. ✅ **Backup otomatis** dengan retention policy
8. ✅ **Portal pattern** untuk autocomplete yang menyelesaikan stacking context issue

---

## Ringkasan Perbaikan Roadmap

### Sprint 1 (Minggu Ini) — Security & Data Integrity
- [ ] Implementasi hash password (K-01)
- [ ] Tambahkan RBAC validation di semua fungsi backend write (K-02)
- [ ] Buat void transaksi idempotent (K-03)
- [ ] Tambahkan LockService di MasterData CRUD (K-04)

### Sprint 2 (Minggu Depan) — Bug Fix & Validation
- [ ] Implementasi backend session/token validation (S-03)
- [ ] Escape semua output innerHTML (S-07)
- [ ] Tambahkan validasi stok minus di saveTransaksi (S-01)
- [ ] Validasi input negatif di backend (S-04)
- [ ] Perbaiki komisi hardcoded (S-06)
- [ ] Perbaiki transfer partial commit (S-08)

### Sprint 3 — UX & Performance
- [ ] Perbaiki semua temuan sedang lainnya
- [ ] Implementasi paginasi server-side untuk data besar (S-09)
- [ ] Cleanup code smell

---

*Review selesai. Total 23 temuan: 4 kritis, 11 sedang, 8 ringan.*
# 📘 Tutorial Lengkap ServicePro HP — Panduan OWNER

> **Versi Aplikasi:** ServicePro HP v5.1  
> **Untuk:** OWNER (akses penuh ke semua fitur)  
> **Bahasa:** Bahasa Indonesia

---

## 📋 Daftar Isi

1. [Pengantar & Alur Kerja Umum](#1-pengantar--alur-kerja-umum)
2. [5 Role Pengguna](#2-5-role-pengguna)
3. [Struktur Data (Google Spreadsheet)](#3-struktur-data-google-spreadsheet)
4. [Dashboard](#4-dashboard)
5. [Kasir / Manajemen Kasir](#5-kasir--manajemen-kasir)
6. [Transaksi Baru (ServiceForm)](#6-transaksi-baru-serviceform)
7. [Penjualan Aksesoris (PenjualanForm)](#7-penjualan-aksesoris-penjualanform)
8. [Update Status (StatusForm)](#8-update-status-statusform)
9. [Master Data](#9-master-data)
10. [Pembelian Part](#10-pembelian-part)
11. [Return Supplier](#11-return-supplier)
12. [Transfer Cabang](#12-transfer-cabang)
13. [Laporan Kas](#13-laporan-kas)
14. [Laporan Stok](#14-laporan-stok)
15. [Stock Opname](#15-stock-opname)
16. [Laporan Lengkap](#16-laporan-lengkap)
17. [Laporan Laba Rugi](#17-laporan-laba-rugi)
18. [Laporan Servisan](#18-laporan-servisan)
19. [Ringkasan Harian](#19-ringkasan-harian)
20. [Riwayat Part](#20-riwayat-part)
21. [Piutang / BON](#21-piutang--bon)
22. [Import Stok](#22-import-stok)
23. [Riwayat Log](#23-riwayat-log)
24. [Pembatalan / Void (Batal Transaksi)](#24-pembatalan--void-batal-transaksi)
25. [Tips & FAQ](#25-tips--faq)

---

## 1. Pengantar & Alur Kerja Umum

### Apa itu ServicePro HP?
ServicePro HP adalah aplikasi web untuk mengelola **toko reparasi HP** multi-cabang. Aplikasi ini mencatat seluruh aktivitas toko mulai dari:
- 📱 Service HP masuk → proses → selesai
- 🛒 Penjualan aksesoris/part langsung
- 📦 Stok barang (sparepart, tool, aksesoris)
- 💰 Arus kas (cash, transfer, bon)
- 👨‍🔧 Komisi teknisi
- 📊 Laporan keuangan

### Alur Kerja Umum

```
Pelanggan datang
       │
       ▼
┌──────────────┐
│ Input Transaksi│ ← Isi data pelanggan, HP, kerusakan
│ (Status: ANTRI)│ ← Pilih part, ongkos, teknisi
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Update Status │ ← Teknisi mengerjakan
│ (PROSES →     │ ← Edit part jika perlu
│ SEDANG_PROSES)│ ← Update ongkos/komisi
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ HP Selesai Dikerjakan│ ← Status: SELESAI_BELUM_DIAMBIL
└──────┬─────────────┘
       │
       ▼
┌──────────────────┐
│ Pelanggan Ambil HP │ ← Status: SELESAI_DIAMBIL
│ + Pembayaran       │ ← Cash/Transfer → Uang masuk Kas
│                    │ ← BON → Masuk Piutang
└──────┬─────────────┘
       │
       ▼
┌──────────────────┐
│ Laporan & Tutup  │ ← Cek ringkasan harian
│ Toko             │ ← Setor ke owner
└──────────────────┘
```

---

## 2. 5 Role Pengguna

Aplikasi memiliki 5 level akses yang berbeda. Sebagai **OWNER**, Anda memiliki akses ke **semua fitur**.

| Role | Akses | Penjelasan |
|------|-------|------------|
| **OWNER** | 🔓 Penuh | Akses semua halaman: laporan keuangan, laba rugi, pembatalan transaksi, manajemen user, dll |
| **ADMIN** | 🔓 Hampir Penuh | Sama seperti OWNER, tapi **tidak bisa** membatalkan (void) transaksi |
| **ADMIN_NO_EDIT** | 🔒 Terbatas | Bisa lihat data dan update status, tapi **tidak bisa edit** harga, ongkos, komisi, dan part di StatusForm |
| **ADMIN_LIMITED** | 🔒 Sangat Terbatas | Hanya bisa input transaksi baru dan update status dasar |
| **TEKNISI** | 🔒 Minimal | Hanya bisa melihat transaksi yang ditugaskan kepadanya |

> 💡 **Tips OWNER:** Gunakan role yang tepat untuk setiap karyawan. Jangan berikan akses OWNER sembarangan — hanya pemilik toko yang seharusnya memiliki role ini.

---

## 3. Struktur Data (Google Spreadsheet)

Semua data ServicePro HP disimpan di **Google Spreadsheet** dengan beberapa sheet. Sebagai OWNER, penting untuk memahami hubungan antar sheet:

| Sheet | Fungsi | ID Prefix |
|-------|--------|-----------|
| **Config** | Pengaturan sistem (komisi default, nama toko, dll) | — |
| **Cabang** | Data cabang toko | CBG- |
| **Users** | Akun pengguna & password | — |
| **Karyawan** | Data karyawan teknisi & admin | KRY- |
| **Pelanggan** | Database pelanggan | PEL- |
| **Stok_Part** | Master stok barang per cabang | PT- |
| **Transaksi** | Data transaksi servis HP | TRX- |
| **Transaksi_Detail** | Detail part per transaksi | — |
| **Penjualan** | Data penjualan aksesoris langsung | PNJ- |
| **Penjualan_Detail** | Detail part per penjualan | — |
| **Pembelian** | Data pembelian dari supplier | BLI- |
| **Return** | Data return barang ke supplier | RET- |
| **Transfer_Part** | Transfer barang antar cabang | TRF- |
| **Kas_Harian** | Arus kas masuk & keluar per cabang | KS- |
| **Kas_Pusat** | Kas pusat owner (setoran cabang) | KPT- |
| **Piutang** | Hutang pelanggan (BON) | PTG- |
| **Hutang_Supplier** | Hutang ke supplier | HUT- |
| **Riwayat_Part** | Tracking masuk/keluar stok | — |
| **Activity_Log** | Log aktivitas pengguna | — |

### Hubungan Antar Sheet

```
ServiceForm → Transaksi + Transaksi_Detail
                 ↓
           Stok_Part (stok berkurang)
           Kas_Harian (jika sudah bayar)
           Piutang (jika BON)

PembelianForm → Pembelian
                  ↓
            Stok_Part (stok bertambah)
            Kas_Harian (kas keluar)
            Hutang_Supplier (jika BON)

TransferForm → Transfer_Part
                  ↓
            Stok_Part (cabang asal kurang, tujuan bertambah)
            Riwayat_Part
```

---

## 4. Dashboard

### Tujuan Halaman
Dashboard adalah **halaman utama** yang menampilkan ringkasan keseluruhan operasional toko. Anda bisa langsung melihat performa bisnis tanpa harus membuka laporan satu per satu.

### Komponen/Kolom

#### Filter Bar
| Komponen | Fungsi |
|----------|--------|
| **🔄 Refresh** | Memuat ulang semua data dashboard |
| **Cabang** | Pilih cabang tertentu atau "Semua Cabang" (hanya muncul jika akun tidak terkunci ke 1 cabang) |
| **Dari** | Tanggal awal periode yang ingin dilihat |
| **Sampai** | Tanggal akhir periode yang ingin dilihat |

#### KPI Cards (Kartu Indikator)
| KPI | Artinya |
|-----|---------|
| **Total Servis** | Jumlah unit HP yang masuk servis di periode tersebut |
| **Pendapatan** | Total uang masuk dari servis + penjualan aksesoris *(hanya OWNER)* |
| **Laba Bersih** | Keuntungan setelah dikurangi modal part dan komisi teknisi *(hanya OWNER)* |
| **Piutang** | Total uang yang masih ditagih ke pelanggan (BON belum lunas) |
| **Kas Masuk** | Total uang cash & transfer yang masuk ke laci/rekening |
| **Kas Keluar** | Total uang yang keluar (pembelian part, pengeluaran, dll) |
| **Saldo** | Selisih Kas Masuk dikurangi Kas Keluar |
| **Hutang Supplier** | Total hutang yang masih harus dibayar ke supplier |

#### Status Servisan (Chart Donut)
Menampilkan distribusi status transaksi: Antri, Proses, Selesai, Batal.

#### Pendapatan per Metode (Chart) *(hanya OWNER)*
Menampilkan perbandingan pendapatan dari Cash, Transfer, BON, dan Split.

#### 10 Transaksi Terbaru
Tabel menampilkan 10 transaksi servis terakhir dengan ID, tanggal, pelanggan, HP, status, dan nominal.

#### 10 Kas Terbaru
Tabel menampilkan 10 catatan kas terakhir (masuk/keluar).

#### Stok Rendah
Daftar barang yang stoknya di bawah batas minimum (default: 3 unit). Sangat berguna untuk mengingatkan stok harus segera di-reorder.

### Tips
- 🔍 Biasakan cek Dashboard setiap pagi untuk melihat kondisi toko
- 📊 Klik tanggal untuk mengubah periode — bisa lihat performa harian, mingguan, atau bulanan
- ⚠️ Perhatikan angka **Piutang** dan **Hutang Supplier** — jika besar, segera tindak lanjuti

---

## 5. Kasir / Manajemen Kasir

### Tujuan Halaman
Mengelola **kas fisik di laci kasir** — mulai dari buka toko (modal awal), catat pengeluaran harian, hingga tutup toko (setor ke owner). Ini adalah halaman utama untuk **kasir** di setiap cabang.

### Komponen/Kolom

#### KPI Cards
| KPI | Artinya |
|-----|---------|
| **💵 Cash di Laci** | Jumlah uang tunai fisik yang seharusnya ada di laci saat ini (akumulasi semua kas CASH) |
| **💳 Non-Tunai (Transfer)** | Saldo akumulasi dari pembayaran transfer |
| **⬆️ Cash Masuk Hari Ini** | Total uang tunai yang masuk hari ini |
| **⬇️ Cash Keluar Hari Ini** | Total uang tunai yang keluar hari ini |
| **💳 Transfer Masuk Hari Ini** | Total transfer yang masuk hari ini |

#### Input Pengeluaran
| Kolom | Fungsi |
|-------|--------|
| **Jumlah Pengeluaran (Rp)** | Nominal yang dikeluarkan |
| **Sumber Dana (Metode)** | CASH (dari laci) atau TRANSFER (dari rekening) |
| **Keterangan / Tujuan** | Alasan pengeluaran (wajib diisi) |
| **💳 Catat Pengeluaran** | Tombol untuk menyimpan pengeluaran |

#### Buka / Tutup Toko
| Komponen | Fungsi |
|----------|--------|
| **Aksi Kasir (dropdown)** | Pilih: Buka Laci / Tutup Toko / Setor Non-Tunai |
| **Jumlah** | Modal awal (saat buka) atau jumlah disetor (saat tutup) |
| **Estimasi Sisa** | Otomatis muncul saat tutup toko — memperkirakan sisa uang |

#### Riwayat Kas Hari Ini
Tabel berisi semua transaksi kas hari ini: waktu, metode, kategori, sumber, keterangan, dan jumlah masuk/keluar.

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Catat Pengeluaran** | Mencatat pengeluaran kas (keluar dari laci atau rekening) |
| **Proses Modal Awal** | Mencatat uang modal yang dimasukkan ke laci saat buka toko |
| **Proses Setor Tunai** | Mencatat setoran tunai dari laci ke owner saat tutup toko |
| **Proses Setor Non-Tunai** | Mencatat setoran transfer dari rekening cabang ke owner |

### Flow/Dampak
- **Buka Laci** → Sheet `Kas_Harian` (MASUK, kategori MODAL_KASIR)
- **Tutup Toko** → Sheet `Kas_Harian` (KELUAR, kategori SETOR_OWNER) + Sheet `Kas_Pusat` (MASUK, kategori SETORAN_CABANG)
- **Pengeluaran** → Sheet `Kas_Harian` (KELUAR, kategori PENGELUARAN_OPERASIONAL atau PENGELUARAN_BIAYA)

### Tips
- 💡 Selalu **Buka Laci** di pagi hari sebelum melayani pelanggan
- 💡 Saat **Tutup Toko**, cek fisik uang di laci — harus cocok dengan angka "Cash di Laci"
- 💡 Jika ada kelebihan/kurang, segera investigasi lewat **Riwayat Kas Hari Ini**
- ⚠️ Jangan biarkan angka "Cash di Laci" negatif — artinya ada masalah pencatatan

---

## 6. Transaksi Baru (ServiceForm)

### Tujuan Halaman
Halaman ini adalah **inti operasional toko servis**. Di sini Anda mencatat setiap HP yang masuk untuk diservis — mulai dari data pelanggan, kerusakan, part yang dipakai, hingga ongkos dan metode pembayaran.

### Komponen/Kolom

#### ⚡ Metode Service
| Opsi | Kapan Digunakan |
|------|----------------|
| **📥 Ditinggal (Antri/Menginap)** | HP ditinggal, pelanggan pulang. Status otomatis: ANTRI |
| **⚡ Ditunggu (Langsung Selesai)** | HP dikerjakan di tempat. Status otomatis: SELESAI_DIAMBIL |

#### 👤 Data Pelanggan
| Kolom | Fungsi |
|-------|--------|
| **Nama Pelanggan** | Nama pelanggan (wajib). Ada autocomplete dari pelanggan lama |
| **Telepon** | Nomor WhatsApp/HP (opsional) |
| **Tipe Pelanggan** | Jenis pelanggan (Umum, dll) |

#### 📱 Data HP & Kerusakan
| Kolom | Fungsi |
|-------|--------|
| **Merk HP** | Merk HP (Samsung, iPhone, Oppo, dll) dari dropdown |
| **Tipe HP** | Tipe spesifik (iPhone 13, Samsung A54, dll) — ketik manual (wajib) |
| **Kerusakan** | Deskripsi kerusakan (LCD pecah, baterai drop, dll) — ketik manual (wajib) |
| **Penerima** | Siapa yang menerima HP di toko (wajib) |
| **Teknisi** | Teknisi yang mengerjakan (bisa dipilih nanti) |
| **Cabang** | Cabang tempat transaksi |

#### 🔧 Barang / Sparepart (Tabel)
| Kolom | Fungsi |
|-------|--------|
| **Jenis** | Jenis barang (SPAREPART, TOOL, ACCESSORIES) |
| **Kategori** | Sub-kategori (LCD, BATERAI, CASING, dll) |
| **Merk** | Merk barang (OEM, Original, Compatible, dll) |
| **Nama Barang** | Nama part (ketik/cari dari autocomplete stok) |
| **Supplier** | Supplier barang |
| **Qty** | Jumlah yang dipakai |
| **H.Beli** | Harga beli/modal (otomatis terisi saat pilih barang) |
| **H.Jual** | Harga jual ke pelanggan (otomatis terisi, bisa diubah) |
| **✕** | Hapus baris part |

#### Panel Kalkulasi (otomatis)
| Baris | Artinya |
|------|---------|
| **Total Modal** | Total harga beli × qty semua part |
| **Total Jual** | Total harga jual × qty semua part |
| **Ongkos Kerja** | Biaya jasa servis (diinput manual) |
| **Laba Kotor** | Total Jual + Ongkos − Total Modal |
| **Laba Bersih** | Laba Kotor − Komisi Teknisi |

#### 💳 Pembayaran & Status
| Kolom | Fungsi |
|-------|--------|
| **Status** | Status awal transaksi (ANTRI, PROSES, SELESAI, dll) |
| **Metode Bayar** | CASH, TRANSFER, BON, atau SPLIT (campuran) |
| **Split Payment** | Muncul jika pilih SPLIT — isi masing-masing: Cash, Transfer, BON |
| **Garansi Service** | Pilihan garansi (3 Hari s/d 3 Bulan) |
| **Catatan** | Catatan tambahan |

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **+ Tambah Barang** | Menambah baris part baru |
| **✕** (per baris) | Menghapus baris part tersebut |
| **💾 Simpan Transaksi** | Menyimpan transaksi ke database |
| **🔄 Reset** | Mengosongkan semua form |
| **← Dashboard** | Kembali ke dashboard |

Setelah simpan, akan muncul konfirmasi **"Cetak Nota?"** — jika Ya, struk akan dicetak.

### Flow/Dampak
1. **Sheet Transaksi** — Baris baru dengan ID `TRX-XXXXXXXX-XXXX`
2. **Sheet Transaksi_Detail** — Detail setiap part yang dipakai
3. **Sheet Stok_Part** — Stok **berkurang** sesuai qty part
4. **Sheet Riwayat_Part** — Catatan penggunaan part (tipe: KELUAR)
5. **Sheet Kas_Harian** — Jika status `SELESAI_DIAMBIL` + bukan BON → kas MASUK
6. **Sheet Piutang** — Jika status `SELESAI_DIAMBIL` + BON → piutang tercatat
7. **Sheet Pelanggan** — Pelanggan otomatis ditambahkan jika belum ada

### Tips
- 🔍 Gunakan **autocomplete** di kolom Nama Barang — ketik nama part dan sistem akan menampilkan stok yang tersedia
- 📱 Jika pelanggan **ditunggu**, part akan langsung dipotong dari stok dan uang masuk kas
- 💰 Kolom **Ongkos Kerja** adalah uang jasa yang Anda kenakan ke pelanggan
- ⚠️ **Mode Ditinggal** → Kas BELUM masuk sampai pelanggan bayar saat ambil HP
- 📝 Selalu isi **Garansi Service** untuk perlindungan toko

---

## 7. Penjualan Aksesoris (PenjualanForm)

### Tujuan Halaman
Untuk mencatat **penjualan langsung** part/aksesoris tanpa servis. Contoh: pelanggan hanya beli casing, charger, tempered glass, dll.

### Komponen/Kolom

#### 👤 Data Pelanggan
| Kolom | Fungsi |
|-------|--------|
| **Cabang Transaksi** | Cabang tempat penjualan |
| **Nama Pelanggan** | Nama pembeli (wajib, ada autocomplete) |
| **No. WhatsApp** | Nomor HP (opsional) |

#### 🛒 Item Penjualan (Tabel)
| Kolom | Fungsi |
|-------|--------|
| **NAMA BARANG** | Cari dari stok yang tersedia (autocomplete) |
| **QTY** | Jumlah yang dibeli (otomatis dicek vs stok) |
| **HARGA** | Harga jual per item (bisa diubah) |
| **TOTAL** | Qty × Harga (otomatis) |
| **✕** | Hapus item |

**Grand Total** muncul di bawah tabel.

#### 💳 Pembayaran
| Kolom | Fungsi |
|-------|--------|
| **Metode Pembayaran** | CASH, TRANSFER, atau BON |
| **Catatan** | Catatan opsional (contoh: "Garansi 3 hari") |

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **+ Tambah Item** | Tambah baris item |
| **💾 Simpan Penjualan** | Simpan ke database |
| **Batal** | Reset form |

Setelah simpan, akan muncul konfirmasi **"Cetak Nota?"** — jika Ya, struk akan dicetak.

### Flow/Dampak
- **Sheet Penjualan** + **Penjualan_Detail** — Data penjualan
- **Sheet Stok_Part** — Stok **berkurang**
- **Sheet Kas_Harian** — Kas MASUK (jika CASH/TRANSFER)
- **Sheet Piutang** — Piutang tercatat (jika BON)

### Tips
- ⚠️ Hanya stok yang **masih tersedia** (>0) yang muncul di autocomplete
- 💡 Metode BON → uang BELUM masuk kas, tapi stok SUDAH keluar
- 🧾 Sistem otomatis menawarkan cetak nota setelah simpan

---

## 8. Update Status (StatusForm)

### Tujuan Halaman
Halaman ini digunakan untuk **melacak dan memperbarui progres servis** HP. Setiap kali teknisi menyelesaikan tahapan, Anda update status di sini. Ini juga tempat untuk **edit part**, **ubah pembayaran**, dan **lunasi BON**.

### Komponen/Kolom

#### Pencarian
| Komponen | Fungsi |
|----------|--------|
| **Kolom pencarian** | Cari berdasarkan ID, nama pelanggan, tipe HP, atau kerusakan |

#### Tabel Transaksi
Menampilkan daftar transaksi yang bisa di-filter berdasarkan status. Klik baris untuk melihat detail.

#### Modal Detail Transaksi (setelah klik)
Menampilkan data pelanggan, HP, part yang dipakai, ongkos, komisi, laba, dan tombol-tombol aksi.

#### Status yang Tersedia
| Status | Artinya |
|--------|---------|
| **ANTRI** | HP baru masuk, belum dikerjakan |
| **PROSES** | Mulai dikerjakan |
| **SEDANG_PROSES** | Sedang dalam pengerjaan |
| **SELESAI_BELUM_DIAMBIL** | Servis selesai, menunggu pelanggan ambil |
| **SELESAI_BELUM_LUNAS** | HP sudah diambil tapi belum bayar (BON) |
| **SELESAI_DIAMBIL** | HP sudah diambil dan sudah bayar |
| **BATAL** | Transaksi dibatalkan |

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Edit Part** | Mengubah part yang dipakai (stok lama dikembalikan, stok baru dipotong) |
| **Update Status** | Mengubah status transaksi (dropdown) |
| **Edit Harga/Ongkos** | Mengubah ongkos kerja, komisi, dan metode pembayaran |
| **💵 Lunasi BON** | Mencatat pelunasan piutang — pilih CASH atau TRANSFER |
| **🧾 Cetak Nota** | Mencetak struk/nota thermal |

### Flow/Dampak Update Status

| Transisi Status | Dampak |
|----------------|--------|
| → **SELESAI_DIAMBIL** + CASH/TRANSFER | Kas MASUK tercatat. Jika sebelumnya BON → piutang otomatis LUNAS |
| → **SELESAI_DIAMBIL** + BON | Status otomatis jadi SELESAI_BELUM_LUNAS, piutang tercatat |
| → **SELESAI_BELUM_LUNAS** | Piutang tercatat |
| **💵 Lunasi BON** | Piutang diubah ke LUNAS, kas MASUK, status → SELESAI_DIAMBIL |

### Edit Part
Saat Anda mengedit part:
1. Part lama → **stok dikembalikan** ke gudang
2. Part baru → **stok dipotong** dari gudang
3. Semua kalkulasi (modal, jual, laba, komisi) **otomatis dihitung ulang**

### Tips
- ⚠️ Uang **baru masuk kas** saat status berubah ke **SELESAI_DIAMBIL** (pelanggan bayar)
- 📝 Jangan lupa update teknisi sebelum servis selesai
- 💡 Gunakan **Lunasi BON** saat pelanggan datang bayar hutang

---

## 9. Master Data

### Tujuan Halaman
Master Data adalah **pusat pengelolaan data dasar** aplikasi. Di sinilah Anda mengatur cabang, karyawan, barang, dropdown, dan konfigurasi sistem.

### 5 Tab Master Data

---

### Tab 1: 🏢 Cabang
| Kolom | Fungsi |
|-------|--------|
| **ID Cabang** | Kode unik cabang (contoh: BL, ML, BD) |
| **Nama Cabang** | Nama lengkap cabang |
| **Alamat** | Alamat cabang |
| **Telepon** | Nomor telepon cabang |
| **Status** | AKTIF / NONAKTIF |

**Aksi:** Tambah, Edit, Nonaktifkan cabang.

---

### Tab 2: 👨‍🔧 Karyawan
| Kolom | Fungsi |
|-------|--------|
| **Nama** | Nama karyawan |
| **Peran** | TEKNISI, ADMIN, PENAMPUNG, dll |
| **Cabang** | Cabang tempat karyawan bekerja |
| **Telepon** | Nomor HP |
| **Komisi (%)** | Persentase komisi dari laba kotor (default 10%) |
| **Status** | AKTIF / NONAKTIF |

---

### Tab 3: 📦 Part (Stok Barang)
| Kolom | Fungsi |
|-------|--------|
| **Jenis Barang** | SPAREPART / TOOL / ACCESSORIES |
| **Nama Barang** | Nama part (contoh: LCD iPhone 13) |
| **Sub Kategori** | Kategori (LCD, BATERAI, CASING, FLEKSIBEL, dll) |
| **Merk Barang** | OEM, Original, Compatible, dll |
| **Supplier** | Nama supplier |
| **Cabang** | Cabang tempat stok |
| **Stok** | Jumlah stok saat ini |
| **Harga Beli** | Harga modal/beli |
| **Harga Jual** | Harga jual ke pelanggan |
| **Persamaan** | Alias/nama lain (contoh: "LCD A15 = LCD A14 same") |
| **Status** | AKTIF / NONAKTIF |

> ⚠️ **Penting:** Mengubah stok di Master Data akan otomatis mencatat **Riwayat Part** (penyesuaian stok).

---

### Tab 4: 📝 Dropdown
Berisi daftar nilai untuk dropdown di seluruh aplikasi:
- Tipe Pelanggan (Umum, Reseller, dll)
- Merk HP (Samsung, Apple, dll)
- Jenis Barang (SPAREPART, TOOL, ACCESSORIES)
- Kategori Barang (LCD, BATERAI, dll)
- Supplier

> 💡 Data dropdown diambil otomatis dari data yang sudah ada. Tidak perlu input manual.

---

### Tab 5: ⚙️ Config / Users

#### Config (Pengaturan Sistem)
| Key | Fungsi | Default |
|-----|--------|---------|
| **KOMISI_DEFAULT_PERSEN** | Persentase komisi default teknisi | 10 |
| **LOW_STOCK_THRESHOLD** | Batas stok rendah untuk peringatan | 3 |
| **NAMA_TOKO** | Nama toko yang muncul di nota | ServicePro HP |

#### Users (Akun Pengguna)
| Kolom | Fungsi |
|-------|--------|
| **Username** | Username untuk login |
| **Password** | Password (hashed) |
| **Role** | OWNER / ADMIN / ADMIN_NO_EDIT / ADMIN_LIMITED / TEKNISI |
| **Cabang** | Cabang yang bisa diakses (kosong = semua cabang) |
| **Nama** | Nama lengkap pengguna |
| **Status** | AKTIF / NONAKTIF |

> 🔐 **Hanya OWNER** yang bisa mengakses tab Config/Users.

### Tips
- 📦 Tambahkan barang baru di tab **Part** sebelum transaksi — stok awal bisa diisi langsung
- 🏷️ Kolom **Persamaan** sangat berguna — ketik nama alias/nama alternatif part agar mudah ditemukan saat input transaksi
- 👨‍🔧 Komisi bisa diatur per karyawan dan juga di-override manual per transaksi

---

## 10. Pembelian Part

### Tujuan Halaman
Mencatat pembelian barang dari **supplier**. Stok akan otomatis bertambah di gudang.

### Komponen/Kolom

| Kolom | Fungsi |
|-------|--------|
| **📅 Tanggal Pembelian** | Tanggal pembelian (WAJIB isi!) |
| **Supplier** | Pilih dari daftar supplier atau ketik manual |
| **Cabang** | Cabang tujuan barang |
| **Metode Bayar** | CASH / TRANSFER / BON (hutang) |

#### Item Pembelian (Tabel)
| Kolom | Fungsi |
|-------|--------|
| **Jenis** | SPAREPART / TOOL / ACCESSORIES |
| **Kategori** | Sub-kategori |
| **Merk** | Merk barang |
| **Nama Barang** | Nama part (autocomplete dari stok yang sudah ada, atau input baru) |
| **Persamaan** | Alias/nama alternatif |
| **Qty** | Jumlah yang dibeli |
| **H.Beli** | Harga beli per unit |
| **H.Jual** | Harga jual yang akan dipakai |
| **Total** | Qty × H.Beli |
| **✕** | Hapus baris |

**Grand Total** di bawah tabel. Ada kolom **Catatan** di bawah.

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **+ Tambah Item** | Tambah baris pembelian |
| **💾 Simpan Pembelian** | Simpan ke database |
| **💰 Bayar Hutang** | Membuka modal daftar hutang supplier yang belum lunas |

#### Modal Bayar Hutang
Menampilkan daftar hutang supplier. Tombol **💵 Bayar** di setiap baris untuk melunasi.

### Flow/Dampak
- **Sheet Pembelian** — Data pembelian
- **Sheet Stok_Part** — Stok **bertambah** (jika barang sudah ada) atau **baris baru** (jika barang baru)
- **Sheet Kas_Harian** — Kas **keluar** (jika CASH/TRANSFER)
- **Sheet Hutang_Supplier** — Hutang tercatat (jika BON)
- **Sheet Riwayat_Part** — Catatan stok masuk

### Tips
- 📅 **Selalu isi tanggal pembelian** agar laporan akurat
- 🏪 Pilih supplier dari dropdown — jika supplier baru, pilih "+ Ketik manual"
- 💰 Jika beli **BON**, hutang akan muncul di tombol "Bayar Hutang" dan di **Dashboard**

---

## 11. Return Supplier

### Tujuan Halaman
Mengembalikan barang yang rusak/salah kirim ke **supplier**. Stok akan berkurang dan bisa dipotong dari hutang.

### Komponen/Kolom

| Kolom | Fungsi |
|-------|--------|
| **Supplier** | Supplier tujuan return |
| **Cabang** | Cabang asal barang |
| **ID Pembelian Ref** | ID pembelian terkait (opsional) |
| **Alasan Return** | Alasan pengembalian (wajib) |
| **☐ Potong dari hutang** | Checkbox — jika dicentang, nilai return mengurangi hutang ke supplier |

#### Barang yang di-Return (Tabel)
| Kolom | Fungsi |
|-------|--------|
| **Jenis / Kategori / Merk** | Filter untuk mencari barang |
| **Nama Barang** | Cari barang yang akan di-return |
| **Stok** | Jumlah stok saat ini |
| **Qty Ret** | Jumlah yang di-return |
| **H.Beli** | Harga beli (readonly, untuk perhitungan) |
| **✕** | Hapus baris |

### Flow/Dampak
- **Sheet Stok_Part** — Stok **berkurang**
- **Sheet Return** — Data return tersimpan
- **Sheet Hutang_Supplier** — Jika dicentang "Potong dari hutang" → hutang berkurang

### Tips
- 🔍 Pilih supplier dulu — baru daftar barang akan muncul
- ✅ Centang **"Potong dari hutang"** agar return mengurangi tagihan supplier
- 📝 Selalu isi **alasan return** untuk referensi

---

## 12. Transfer Cabang

### Tujuan Halaman
**Memindahkan stok barang** dari satu cabang ke cabang lain. Berguna jika satu cabang kelebihan stok dan cabang lain kekurangan.

### Komponen/Kolom

| Kolom | Fungsi |
|-------|--------|
| **Cabang Asal** | Cabang pengirim |
| **Cabang Tujuan** | Cabang penerima (tidak boleh sama!) |
| **Jenis / Kategori / Merk / Supplier** | Filter untuk mempersempit pencarian |
| **Barang** | Cari nama barang dari stok cabang asal |
| **Qty** | Jumlah yang ditransfer |
| **➕ Tambah** | Masukkan ke keranjang transfer |

#### Keranjang Transfer
Tabel berisi semua barang yang sudah dipilih untuk ditransfer. Bisa menambah beberapa barang sekaligus (**transfer masal**).

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **➕ Tambah** | Masukkan barang ke keranjang |
| **✕** (per item) | Hapus dari keranjang |
| **💾 Simpan & Transfer Semua** | Proses transfer semua barang di keranjang |

### Flow/Dampak
- **Sheet Transfer_Part** — Data transfer tersimpan
- **Sheet Stok_Part** — Stok **berkurang** di cabang asal, **bertambah** di cabang tujuan
- **Sheet Riwayat_Part** — 2 catatan: TRANSFER_KELUAR (asal) dan TRANSFER_MASUK (tujuan)

### Tips
- 🔀 Bisa transfer **lebih dari 1 barang** sekaligus (transfer masal)
- ⚠️ Stok cabang asal akan dicek otomatis — tidak bisa transfer melebihi stok
- 📋 Riwayat transfer muncul di bawah form

---

## 13. Laporan Kas

### Tujuan Halaman
Melihat **seluruh arus kas** masuk dan keluar secara detail. Ini adalah laporan keuangan harian/bulanan yang paling sering digunakan.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang atau semua |
| **Jenis** | Semua / Masuk / Keluar |
| **Metode** | Semua / Cash / Transfer / BON |
| **Dari / Sampai** | Periode tanggal |

#### KPI Cards
| KPI | Artinya |
|-----|---------|
| **Total Masuk** | Seluruh uang yang masuk di periode tersebut |
| **Total Keluar** | Seluruh uang yang keluar di periode tersebut |
| **Saldo** | Total Masuk − Total Keluar |

#### Tabel Kas
| Kolom | Artinya |
|-------|---------|
| **Tanggal** | Tanggal transaksi kas |
| **Cabang** | Cabang terkait |
| **Jenis** | MASUK / KELUAR |
| **Metode** | CASH / TRANSFER / BON |
| **Kategori** | SERVICE, PENJUALAN_LANGSUNG, PEMBELIAN, MODAL_KASIR, SETOR_OWNER, dll |
| **Keterangan** | Detail transaksi |
| **Jumlah** | Nominal |

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **💸 Input Pengeluaran** | Membuka modal untuk mencatat pengeluaran toko |
| **📥 Export CSV** | Download laporan ke file CSV |
| **🖨️ Cetak** | Cetak laporan via browser |
| **🔄 Refresh** | Muat ulang data |

#### Modal Input Pengeluaran
| Kolom | Fungsi |
|-------|--------|
| **Tanggal Pengeluaran** | Tanggal (default hari ini) |
| **Nominal Pengeluaran (Rp)** | Jumlah uang |
| **Keterangan / Deskripsi** | Alasan pengeluaran |
| **Metode Bayar** | Laci Kasir (CASH) / Rekening Bank (TRANSFER) / Uang Owner |

### Tips
- 💡 Gunakan filter **Metode = CASH** untuk cek uang tunai saja
- 📊 **Saldo** menunjukkan net cash flow — jika negatif, artinya lebih banyak keluar dari masuk
- 🏪 Kategori **SETOR_OWNER** = setor dari cabang ke owner saat tutup toko

---

## 14. Laporan Stok

### Tujuan Halaman
Melihat **kondisi stok** barang lengkap — jumlah, harga, dan nilai persediaan per cabang.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang |
| **Dari / Sampai** | Periode (untuk data pergerakan) |
| **Cari Part** | Pencarian cepat berdasarkan nama |

#### KPI Cards
| KPI | Artinya |
|-----|---------|
| **Total Qty Stok** | Jumlah total semua unit barang |
| **Nilai Stok (Modal)** | Total nilai modal semua stok (Qty × Harga Beli) |
| **Masuk (Periode)** | Total barang masuk di periode |
| **Keluar (Periode)** | Total barang keluar di periode |

#### Tabel Stok
| Kolom | Artinya |
|-------|---------|
| **Nama Barang** | Nama part |
| **Merk** | Merk barang |
| **Kategori** | Sub-kategori |
| **Supplier** | Nama supplier |
| **Cabang** | Cabang penyimpanan |
| **Stok** | Jumlah stok (🔴 HABIS = 0, kuning = rendah ≤3) |
| **H.Beli** | Harga beli/modal per unit |
| **H.Jual** | Harga jual per unit |
| **Nilai** | Stok × H.Beli |

### Tips
- 🔴 Perhatikan item yang bertanda **"HABIS"** — mungkin perlu di-reorder
- ⚙️ Klik tombol **"Edit/Tambah Barang"** untuk langsung ke Master Data

---

## 15. Stock Opname

### Tujuan Halaman
Mencetak **lembar pengecekan stok fisik** untuk dibandingkan dengan data sistem. Digunakan saat tutup bulan atau audit stok.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Pilih cabang yang akan diopname |
| **Jenis Barang** | Filter: SPAREPART / TOOL / ACCESSORIES |
| **Kategori** | Filter kategori |
| **Supplier** | Filter supplier |

#### Tabel Stock Opname
| Kolom | Artinya |
|-------|---------|
| **☐ Cek** | Kotak centang untuk ditandai saat cek fisik |
| **Jenis / Kategori / Supplier** | Info part |
| **Nama Barang** | Nama part (diurutkan A-Z) |
| **Merk** | Merk barang |
| **Tgl Beli** | Tanggal pembelian terakhir |
| **Harga Beli** | Harga modal |
| **Sistem** | Stok menurut sistem |
| **Fisik** | Kolom kosong untuk diisi manual saat opname |

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **Tampilkan Data** | Memuat data stok sesuai filter |
| **🖨️ Cetak Lembar SO** | Mencetak lembar untuk diisi manual |

### Tips
- 🖨️ Cetak lembar SO, bawa ke gudang, dan **centang satu per satu** sambil cek fisik
- 📊 Bandingkan angka **Sistem** vs **Fisik** — jika beda, sesuaikan di Master Data
- 💡 Disarankan lakukan stock opname **minimal 1x sebulan**

---

## 16. Laporan Lengkap

### Tujuan Halaman
Laporan **komprehensif per cabang** yang menampilkan ringkasan pendapatan, pengeluaran, laba, kinerja teknisi, top pelanggan, dan daftar transaksi rugi.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang atau semua |
| **Dari / Sampai** | Periode |

#### KPI Cards *(hanya OWNER)*
| KPI | Artinya |
|-----|---------|
| **Pendapatan** | Total pendapatan (service + ongkos) |
| **Pengeluaran (Part)** | Total modal part yang dikeluarkan |
| **Laba Bersih** | Pendapatan − Pengeluaran − Komisi |

#### KPI Kas (semua role)
| KPI | Artinya |
|-----|---------|
| **Kas Masuk** | Total kas masuk |
| **Kas Keluar** | Total kas keluar |
| **Saldo Kas** | Selisih |

#### 👨‍🔧 Kinerja Teknisi *(hanya OWNER)*
| Kolom | Artinya |
|-------|---------|
| **Teknisi** | Nama teknisi |
| **Servis** | Jumlah unit yang dikerjakan |
| **Revenue** | Total pendapatan dari servis tersebut |
| **Komisi** | Total komisi yang diterima |

#### 🏆 Top 10 Pelanggan
Pelanggan yang paling sering datang dan total belanjanya.

#### 📉 Daftar Transaksi Rugi / Nihil Margin *(hanya OWNER)*
Menampilkan transaksi yang laba kotornya Rp 0 atau minus. Sangat berguna untuk menganalisis kerugian.

### Tips
- 🔒 Role selain OWNER hanya bisa melihat **Kas** dan **Kinerja Teknisi** (tanpa revenue/komisi)
- 📉 Perhatikan **transaksi rugi** — mungkin harga jual part terlalu murah atau ada kesalahan input

---

## 17. Laporan Laba Rugi

### Tujuan Halaman
Laporan keuangan **paling detail** — menampilkan pendapatan, HPP (modal barang), komisi, pengeluaran, dan laba bersih **per hari**.

### Komponen/Kolom

#### KPI Cards
| KPI | Artinya |
|-----|---------|
| **Total Pendapatan** | Dari servis + penjualan aksesoris |
| **HPP / Modal Barang** | Total harga beli part yang terpakai |
| **Komisi Teknisi** | Total komisi yang harus dibayar |
| **Pengeluaran Toko** | Biaya operasional (listrik, dll) |
| **Total Laba Bersih** | Pendapatan − HPP − Komisi − Pengeluaran |

#### Tabel Rincian Harian
| Kolom | Artinya |
|-------|---------|
| **Tanggal** | Tanggal |
| **Jml Trx** | Jumlah transaksi |
| **Pendptn Servis** | Pendapatan dari jasa servis |
| **Pendptn Jual** | Pendapatan dari jual part |
| **Total Pendptn** | Servis + Jual |
| **Modal Part** | HPP barang yang terpakai |
| **Laba Kotor** | Total Pendapatan − Modal Part |
| **Komisi Tek** | Komisi teknisi |
| **Pengeluaran** | Biaya operasional |
| **Laba Bersih** | Laba Kotor − Komisi − Pengeluaran |

Baris **TOTAL KESELURUHAN** di bagian bawah.

### Tips
- 🔒 Hanya **OWNER** dan **ADMIN** yang bisa mengakses halaman ini
- 📊 Gunakan laporan ini untuk **analisis profitabilitas harian**
- 💰 Jika laba bersih negatif, cek apakah pengeluaran operasional terlalu besar atau harga jual terlalu rendah

---

## 18. Laporan Servisan

### Tujuan Halaman
Laporan **detail setiap unit servis** yang masuk — lengkap dengan part, modal, laba, dan status.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang |
| **Status** | Filter status (Antri, Proses, Selesai, Batal, dll) |
| **Dari / Sampai** | Periode |
| **Cari** | Cari berdasarkan nama, ID, HP |

#### KPI Cards
| KPI | Artinya |
|-----|---------|
| **Total Masuk** | Jumlah unit servis masuk |
| **Selesai** | Jumlah yang sudah selesai |
| **Proses** | Jumlah yang sedang dikerjakan |
| **Batal** | Jumlah yang dibatalkan |
| **Total Pendapatan** | Pendapatan total |
| **Total Modal Part** | Modal part yang terpakai |
| **Total Laba Kotor** | Pendapatan − Modal |
| **Total Laba Bersih** | Setelah dikurangi komisi |

#### Tabel Detail Servisan
| Kolom | Artinya |
|-------|---------|
| **ID** | ID transaksi (klik untuk ke detail) |
| **Tgl Masuk** | Tanggal masuk |
| **Cabang** | Cabang |
| **Pelanggan** | Nama pelanggan |
| **Tipe HP** | Model HP |
| **Kerusakan** | Jenis kerusakan |
| **Teknisi** | Teknisi pengerja |
| **Part** | Part yang dipakai |
| **Metode** | Metode pembayaran |
| **H.Jual Part** | Total harga jual part |
| **Ongkos** | Ongkos kerja |
| **Modal** | Total modal part |
| **Laba Kotor** | H.Jual + Ongkos − Modal |
| **Komisi** | Komisi teknisi |
| **Laba Bersih** | Laba Kotor − Komisi |
| **Status** | Status terakhir |

#### 📊 Breakdown Status per Cabang
Tabel silang cabang vs status — sangat berguna untuk OWNER multi-cabang.

### Tips
- 🖱️ Klik baris tabel untuk langsung ke **halaman Update Status**
- 📊 Breakdown per cabang membantu membandingkan performa antar cabang

---

## 19. Ringkasan Harian

### Tujuan Halaman
Halaman yang **paling penting saat tutup toko**. Menampilkan ringkasan lengkap: uang yang harus disisihkan per supplier, ongkos per teknisi, dan panduan pembagian uang.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Pilih cabang |
| **Tanggal Awal / Akhir** | Bisa 1 hari atau range tanggal |

#### KPI Utama
| KPI | Artinya |
|-----|---------|
| **💰 Total Pendapatan** | Part + Ongkos Jasa |
| **🔧 Modal Part Terpakai** | Uang yang harus disisihkan ke supplier |
| **👨‍🔧 Total Ongkos Jasa** | Jasa teknisi hari ini |
| **📊 Laba Bersih** | Profit toko setelah modal & komisi |

#### 🏭 Uang Part per Supplier
Detail **berapa uang yang harus disisihkan** untuk masing-masing supplier, lengkap dengan persentase.

#### 👨‍🔧 Uang Jasa per Teknisi
Ongkos jasa per teknisi dan persentasenya.

#### 🛒 Pembelian Part Hari Ini
Part yang dibeli hari ini dan sudah dibayar tunai.

#### 💰 Ringkasan Saldo Kas
| KPI | Artinya |
|-----|---------|
| **Total Masuk** | Semua kas masuk hari ini |
| **Total Keluar** | Semua kas keluar hari ini |
| **Saldo Akhir** | Selisih |

#### 📋 Panduan Pembagian Uang Tutup Toko
Kotak panduan visual:
- 🔴 **Sisihkan untuk Part** — bayar ke supplier
- 🟡 **Ongkos Teknisi** — jasa servis hari ini
- 🔵 **Laba Bersih Toko** — profit murni

### Tips
- 🏪 **Gunakan halaman ini SETIAP HARI** saat tutup toko
- 💰 Uang di laci = Modal Awal + Masuk − Keluar. Cocokkan dengan fisik!
- 📝 Gunakan fitur **Cetak** untuk cetak ringkasan sebagai bukti

---

## 20. Riwayat Part

### Tujuan Halaman
**Tracking lengkap** setiap pergerakan stok barang — kapan masuk, kapan keluar, dari transaksi apa, dsb.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang |
| **Tipe** | MASUK / KELUAR / TRANSFER_MASUK / TRANSFER_KELUAR |
| **Dari / Sampai** | Periode |
| **Jenis / Kategori / Merk / Supplier** | Filter atribut barang |
| **Cari Part** | Pencarian nama part |

#### KPI Cards
| KPI | Artinya |
|-----|---------|
| **Total Barang Masuk** | Total qty semua barang masuk |
| **Total Barang Keluar** | Total qty semua barang keluar |

#### Tabel Riwayat
| Kolom | Artinya |
|-------|---------|
| **Tanggal** | Tanggal pergerakan |
| **Jenis** | Jenis transaksi (SERVICE, PEMBELIAN, TRANSFER, dll) |
| **Part** | Nama barang |
| **Merk / Supplier / Cabang** | Info detail |
| **Qty** | Jumlah (+ masuk, − keluar) |
| **Tipe** | MASUK / KELUAR / TRANSFER_MASUK / TRANSFER_KELUAR |
| **Referensi** | ID transaksi terkait |
| **Keterangan** | Keterangan pergerakan |

### Tips
- 🔍 Gunakan filter **Tipe = KELUAR** untuk cek part apa saja yang terpakai
- 📥 **Tipe = MASUK** untuk cek barang dari pembelian supplier
- 📥 Klik **Export CSV** untuk analisis di Excel

---

## 21. Piutang / BON

### Tujuan Halaman
Melihat dan mengelola **daftar hutang pelanggan** (BON) yang belum dilunasi.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang |
| **Dari / Sampai** | Periode |
| **Cari** | Cari nama, No HP, atau ID transaksi |

#### Tabel Piutang
| Kolom | Artinya |
|-------|---------|
| **ID Transaksi** | ID transaksi terkait |
| **Tanggal** | Tanggal transaksi |
| **Pelanggan** | Nama pelanggan |
| **No HP** | Nomor telepon |
| **Tipe HP** | Model HP |
| **Cabang** | Cabang |
| **Nominal** | Jumlah hutang |
| **Status** | BELUM LUNAS / LUNAS |
| **Aksi** | Tombol lunasi |

**Total Piutang** ditampilkan di kanan atas tabel.

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **💵 Lunasi** | Melunasi piutang — uang masuk kas sebagai CASH |

### Tips
- 🔒 Hanya **OWNER** dan **ADMIN** yang bisa mengakses halaman ini
- 📞 Gunakan No HP untuk menghubungi pelanggan yang masih punya piutang
- 💡 Bisa juga lunasi BON langsung dari halaman **Update Status**

---

## 22. Import Stok

### Tujuan Halaman
Mengimport data stok **secara masal** dari file CSV. Berguna saat pindah sistem atau input data awal dalam jumlah besar.

### Format CSV yang Diperlukan
```
tanggal,nama,jenis,kategori,merk,supplier,stok,hargaBeli,hargaJual
```

| Kolom | Format | Contoh |
|-------|--------|--------|
| **tanggal** | YYYY-MM-DD | 2024-05-20 |
| **nama** | Nama barang | LCD iPhone 13 |
| **jenis** | SPAREPART / TOOL / ACCESSORIES | SPAREPART |
| **kategori** | Sub-kategori | LCD |
| **merk** | Merk | OEM |
| **supplier** | Nama supplier | TokoSupplier |
| **stok** | Angka | 10 |
| **hargaBeli** | Angka (tanpa titik/koma) | 150000 |
| **hargaJual** | Angka (tanpa titik/koma) | 350000 |

#### Upload
| Komponen | Fungsi |
|----------|--------|
| **Cabang Tujuan** | Cabang tempat stok diimport |
| **File CSV** | Upload file CSV |

Setelah upload, muncul **preview** 10 baris pertama. Klik **Import Data** untuk memproses.

### Tips
- 📄 Gunakan **Google Sheets** atau Excel untuk membuat file CSV
- 💾 Simpan file sebagai **CSV (Comma Separated Values)**
- ⚠️ Cek preview sebelum import — data yang salah bisa merusak stok

---

## 23. Riwayat Log

### Tujuan Halaman
Melihat **semua aktivitas pengguna** — siapa yang melakukan apa dan kapan. Sangat berguna untuk audit dan troubleshooting.

### Komponen/Kolom

#### Filter
| Komponen | Fungsi |
|----------|--------|
| **Cabang** | Filter per cabang |
| **Aksi** | Filter jenis aktivitas |
| **Cari** | Cari user atau detail |
| **Tanggal Start / End** | Periode |

#### Tabel Log
| Kolom | Artinya |
|-------|---------|
| **Waktu** | Timestamp aktivitas |
| **User** | Username yang melakukan aksi |
| **Aksi** | Jenis aktivitas (badge berwarna) |
| **Detail** | Keterangan aktivitas |
| **Cabang** | Cabang terkait |
| **Ref ID** | ID referensi |

#### Jenis Aksi yang Tercatat
| Aksi | Warna | Artinya |
|------|-------|---------|
| 🟢 LOGIN | Hijau | User login |
| 🔵 TRANSAKSI | Biru | Transaksi baru |
| 🟡 UPDATE_STATUS | Kuning | Update status transaksi |
| 🟣 PEMBELIAN | Ungu | Pembelian dari supplier |
| 🔵 TRANSFER | Biru | Transfer antar cabang |
| 🟢 IMPORT | Hijau | Import data stok |
| 🟢 TAMBAH_PART | Hijau | Tambah barang baru |
| 🔴 HAPUS_PART | Merah | Penghapusan part |
| 🟠 RETURN | Oranye | Return barang |
| 🔴 VOID / BATAL | Merah | Pembatalan transaksi |
| 🟢 LUNASI_BON | Hijau | Pelunasan piutang |

### Tips
- 🔍 Gunakan untuk **melacak siapa** yang melakukan perubahan
- 📊 Filter **Aksi = VOID** untuk audit pembatalan
- ⏱️ Filter per tanggal untuk investigasi masalah

---

## 24. Pembatalan / Void (Batal Transaksi)

### Tujuan Halaman
**Membatalkan transaksi** yang salah input. Proses ini akan:
1. Mengembalikan stok barang ke gudang
2. Mencatat pembalikan kas
3. Membatalkan piutang (jika ada)
4. Menandai transaksi sebagai **BATAL**

> ⚠️ **Hanya OWNER** yang bisa mengakses halaman ini. Tindakan ini **tidak bisa di-undo!**

### Komponen/Kolom

#### Pencarian
| Komponen | Fungsi |
|----------|--------|
| **Kolom pencarian** | Cari berdasarkan ID, Nama, No HP, atau Tipe HP |

#### Daftar Transaksi
Menampilkan transaksi yang bisa dibatalkan. Transaksi yang sudah BATAL ditampilkan abu-abu dan tidak bisa diklik.

#### Detail Transaksi (setelah klik)
Menampilkan data lengkap: ID, tanggal, pelanggan, cabang, status, total, dan rincian part.

### Tombol dan Aksi

| Tombol | Aksi |
|--------|------|
| **🚨 VOID / BATALKAN TRANSAKSI INI** | Membatalkan transaksi secara permanen |

Akan muncul konfirmasi sebelum proses.

### Flow/Dampak Pembatalan
1. **Stok_Part** — Semua part dikembalikan ke stok
2. **Kas_Harian** — Entry pembalikan dibuat (jika ada kas terkait)
3. **Piutang** — Status diubah ke BATAL, jumlah → 0
4. **Transaksi** — Status → BATAL, semua nominal → 0
5. **Transaksi_Detail** — Semua qty & harga → 0
6. **Riwayat_Part** — Catatan VOID_MASUK tercatat
7. **Activity_Log** — Log VOID tercatat

### Tips
- 🚨 **SANGAT BERHATI-HATI** — tindakan ini tidak bisa dibatalkan!
- 💡 Sebelum void, pastikan sudah **cek detail** transaksi dengan teliti
- 📋 Setiap void akan tercatat di **Riwayat Log**

---

## 25. Tips & FAQ

### 💡 Tips Harian untuk OWNER

1. **Pagi:** Buka **Dashboard** → cek kondisi toko (piutang, hutang, stok rendah)
2. **Buka Toko:** Buka **Kasir** → klik **Buka Laci** → masukkan modal awal
3. **Operasional:** Input transaksi di **Transaksi Baru** atau **Penjualan Aksesoris**
4. **Update Status:** Pantau progres servis di **Update Status**
5. **Tutup Toko:** Buka **Ringkasan Harian** → cek pembagian uang → setor via **Kasir → Tutup Toko**
6. **Mingguan:** Cek **Laporan Laba Rugi** dan **Laporan Lengkap**
7. **Bulanan:** Lakukan **Stock Opname** dan cek **Riwayat Part**

### ❓ FAQ

**Q: Bedanya CASH, TRANSFER, dan BON?**
- **CASH** = uang tunai, langsung masuk laci kasir
- **TRANSFER** = uang non-tunai (BCA, QRIS, dll), tercatat terpisah
- **BON** = pelanggan belum bayar → masuk piutang, stok sudah keluar

**Q: Apa itu Split Payment?**
Pembayaran campuran. Contoh: Rp 200.000 cash + Rp 100.000 bon. Sistem mencatat kas masuk untuk bagian cash, dan piutang untuk bagian bon.

**Q: Kapan stok berkurang?**
- Saat **Simpan Transaksi** (ServiceForm) — status berapa pun
- Saat **Simpan Penjualan** (PenjualanForm)
- Stok TIDAK berkurang saat input pembelian (malah bertambah)

**Q: Kapan uang masuk kas?**
- Status **SELESAI_DIAMBIL** + metode bukan BON → kas masuk
- Metode **BON** → uang masuk **piutang**, bukan kas
- Saat **Lunasi BON** → baru kas masuk

**Q: Apa bedanya Stok Rendah di Dashboard vs Stock Opname?**
- **Dashboard Stok Rendah** = peringatan otomatis (stok ≤ batas dari Config)
- **Stock Opname** = cek fisik manual untuk audit stok

**Q: Bagaimana jika teknisi salah pakai part?**
1. Buka **Update Status** → cari transaksi
2. Klik **Edit Part** → ubah part yang benar
3. Sistem otomatis mengembalikan stok lama dan memotong stok baru

**Q: Bisa bayar hutang supplier?**
Ya! Di halaman **Pembelian Part** → klik **💰 Bayar Hutang** → pilih hutang → bayar.

**Q: Bagaimana cara menambah user baru?**
1. Buka **Master Data** → tab **Config / Users**
2. Isi username, password, role, dan cabang
3. Simpan

**Q: Bagaimana jika salah input transaksi?**
- Jika belum ada kas → edit di **Update Status**
- Jika sudah ada kas → **VOID** di halaman **Pembatalan** (hanya OWNER)

---

> **📧 Butuh bantuan?** Hubungi developer atau cek **Riwayat Log** untuk melacak masalah.
>
> **© ServicePro HP v5.1 — Panduan Owner** | Terakhir diperbarui: Mei 2026
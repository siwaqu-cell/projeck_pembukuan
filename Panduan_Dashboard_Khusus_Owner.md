# 📊 PANDUAN MEMBACA DASHBOARD & LAPORAN (KHUSUS OWNER)

Sistem ServicePro HP didesain untuk menyajikan rangkuman ratusan baris data menjadi angka-angka sederhana yang langsung bisa dipahami. Dokumen ini adalah panduan lengkap cara *membaca* angka di setiap jenis layar Dashboard dan Laporan, serta bagaimana cara melacak masalah jika ada angka yang "terasa salah".

---

## 1. DASHBOARD UTAMA (Halaman Depan)

Dashboard adalah ringkasan performa cabang secara *real-time*. Anda bisa mengubah cabang (untuk melihat SIB saja, atau SEMUA CABANG sekaligus) dan rentang tanggal (dari-sampai).

### 💡 Penjelasan Setiap Kotak Angka (KPI)
- **Total Servis:** Jumlah seluruh unit HP yang diinput pada rentang tanggal tersebut, tidak peduli statusnya apa (Antri, Proses, Batal, Selesai).
- **Pendapatan (Khusus Owner):** Total nilai uang dari seluruh transaksi (Servis + Jualan Part) yang berstatus `SELESAI_DIAMBIL`. Jika pelanggan belum ambil barangnya, angkanya tidak masuk ke sini.
- **Laba Bersih (Khusus Owner):** (Pendapatan - Modal Part - Ongkos/Komisi Teknisi). Ini adalah uang keuntungan bersih murni yang Anda dapatkan.
- **Piutang:** Uang dari pelanggan yang berstatus transaksi BON/Kredit. Angka ini menandakan "Berapa banyak uang toko yang masih ada di tangan pelanggan".
- **Kas Masuk & Kas Keluar:** Uang tunai/transfer yang bergerak hari ini (termasuk modal laci, bayar listrik, dll).
- **Saldo:** (Kas Masuk - Kas Keluar). Angka inilah yang seharusnya persis sama dengan uang fisik yang ada di laci ditambah mutasi rekening hari ini.
- **Hutang Supplier:** Total nilai barang yang sudah masuk ke gudang tapi belum Anda lunasi ke distributor.

### 🔍 Analisis & Deteksi Masalah via Dashboard Utama
1. **Masalah:** Uang di laci lebih banyak/sedikit daripada kotak **Saldo**.
   - **Penyebab:** Kasir lupa input uang masuk (modal laci) atau lupa input uang keluar (beli makan/kertas).
   - **Penyelesaian:** Cek tabel **10 Kas Terbaru** di bagian bawah dashboard. Jika ada pengeluaran/pemasukan yang belum tercatat, segera suruh admin ke menu Manajemen Kasir untuk menginputnya mundur.
2. **Masalah:** Kotak **Stok Rendah** sangat penuh (berwarna merah/kuning).
   - **Penyelesaian:** Segera ambil tindakan restock ke supplier untuk menghindari penolakan pelanggan karena part habis.

---

## 2. LAPORAN LABA RUGI (Nett Profit)

Ini adalah fitur paling rahasia yang **hanya bisa dibuka oleh akun Owner**. Laporan ini menghitung *kesehatan finansial toko*.

### 💡 Cara Membaca
- **Pemasukan Jasa (Ongkos Kerja):** Total ongkos servis murni di luar harga part.
- **Pemasukan Penjualan Part:** Total harga jual part ke pelanggan.
- **Modal Part Terjual:** Uang yang Anda keluarkan dulu untuk membeli part-part tersebut dari distributor.
- **Komisi Teknisi:** Total hak/gaji yang harus dibayarkan ke teknisi atas jasa mereka.
- **Pengeluaran Operasional Toko:** Semua catatan uang keluar dari laci Kasir Harian (listrik, wifi, ATK, konsumsi).
- **LABA BERSIH (NET PROFIT):** Hasil akhir setelah semua Pemasukan dikurangi semua Pengeluaran di atas.

### 🔍 Analisis Laba Rugi
- **Jika Laba Bersih terlihat Minus/Sangat Kecil:** Cek bagian **Pengeluaran Operasional Toko**. Seringkali kasir menginput pengeluaran tidak wajar, atau pembelian part secara tunai ikut terinput sebagai "Pengeluaran Operasional" padahal seharusnya diinput di menu Pembelian.
- **Cara cross-check:** Klik Export CSV dan periksa baris per baris pengeluaran mana yang menyedot profit.

---

## 3. RINGKASAN TUTUP TOKO (Fitur Wajib Harian)

Fitur ini (di menu Ringkasan Harian) berguna setiap kali toko akan tutup (jam 9 malam) untuk membagi porsi uang laci.

### 💡 Penjelasan Tabel
- **Tabel 1 (Hak Supplier):** Menampilkan rincian part apa saja yang dipakai hari itu, dan berapa Modal Belinya. Angka ini adalah **Uang Mati** yang harus disisihkan di kotak/amplop terpisah karena akan dipakai untuk kulakan/bayar hutang ke supplier keesokan harinya.
- **Tabel 2 (Hak Teknisi):** Total ongkos kerja yang telah dikumpulkan. Jika Anda menggunakan sistem bagi hasil harian, ini adalah jumlah yang harus langsung diserahkan ke teknisi sebelum mereka pulang.
- **Tabel 4 (Saldo Kasir Akhir):** Setelah Uang Supplier dan Uang Teknisi dipotong, sisa di laci adalah Laba Kotor toko. Dari sinilah Owner mengambil setoran (Tarik Setoran ke Owner via Manajemen Kasir).

---

## 4. LAPORAN KAS

Seluruh urat nadi pergerakan uang toko tercatat di sini, detik per detik.

- **Filter Metode:** Anda bisa memilih memfilter khusus `CASH` atau khusus `TRANSFER`.
- **Analisis Masalah:** Saat ada mutasi bank (Transfer) yang masuk tapi Anda tidak tahu dari mana asalnya, buka Laporan Kas ➡️ filter `TRANSFER`. Semua keterangan pelanggan dan ID Servis yang membayar transfer hari itu akan berjajar rapi. 

---

## 5. LAPORAN SERVISAN (Kinerja Servis)

Laporan ini bukan tentang uang, tapi tentang performa teknisi dan antrean barang.

### 💡 Membaca Indikator Status
Di bagian atas ada rangkuman:
- **Total Antri:** Bahaya jika angka ini terlalu tinggi, berarti teknisi kewalahan atau part lama datang dari pusat.
- **Total Batal:** Jika angka Batal sangat tinggi dalam seminggu, itu adalah indikasi masalah besar. Mungkin teknisi tidak kompeten menyelesaikan masalah, part langka, atau harga yang ditawarkan kasir terlalu mahal untuk pelanggan.

### 🔍 Deteksi Masalah
- Di tabel bawah, perhatikan kolom **Laba**. Jika ada angka Laba yang minus (merah) atau Rp 0 padahal ada pengerjaan, klik baris tersebut (akan diarahkan ke Update Status). Biasanya kasir lupa menginput Harga Jual part (masih Rp 0) atau Ongkos Kerja lupa diisi.

---

## 6. LAPORAN STOK & RIWAYAT PART

Digunakan jika ada kecurigaan barang hilang, dicuri, atau rusak tanpa dilaporkan.

- **Menu Laporan Stok:** Menampilkan stok barang *real-time* dan nilai uang mengendap (Berapa juta Rupiah uang Anda yang "mati" di rak kaca cabang tersebut). Jika nilai stok sangat tinggi tapi laba rendah, berarti manajemen *Restock*/Pembelian kurang bagus (barang mati / *dead stock* terlalu banyak).
- **Menu Riwayat Part:** Ini adalah CCTV sistem. Cari nama part tertentu (contoh: `LCD Oppo A5s`). Sistem akan membeberkan kronologi lengkap barang itu dari lahir sampai habis: 
  - *Tgl 1: Dibeli dari Supplier X (Masuk +5)*
  - *Tgl 3: Ditransfer ke cabang SIB (Keluar -2)*
  - *Tgl 5: Dipakai di transaksi TRX-0001 (Keluar -1)*
  - Jika ada *miss* stok, Riwayat Part tidak akan pernah berbohong tentang siapa kasir terakhir yang menggunakannya.

---
**Kesimpulan untuk Owner:** Biasakan untuk membuka **Dashboard Utama** dan **Ringkasan Tutup Toko** setiap hari. Dua menu ini sudah merangkum 90% seluruh aktivitas harian karyawan Anda.

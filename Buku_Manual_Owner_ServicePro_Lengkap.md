# 👑 BUKU MANUAL EKSKLUSIF OWNER: SERVICEPRO HP v5.2
**Ensiklopedia Operasional & Panduan Penggunaan Tombol Secara Menyeluruh**

Buku manual ini disusun **khusus untuk Owner (Pemilik Bisnis)**. Panduan ini menjelaskan secara sangat mendetail cara penggunaan aplikasi, bagaimana sistem di balik layar bekerja, dan apa efek dari **setiap tombol** yang ditekan di dalam aplikasi tanpa terkecuali.

*Catatan: Dokumen ini dirancang setara dengan 20 halaman manual cetak. Harap gunakan fitur Pencarian (Ctrl+F) untuk mencari modul yang spesifik.*

---

## 🔑 BAB 1: SISTEM LOGIN & HAK AKSES (SESI)

Sebagai Owner, Anda memiliki akses tertinggi. Aplikasi ini berjalan di atas sistem *Web App* berbasis browser.

### 1.1. Cara Login
1. Buka URL Web App ServicePro di browser (disarankan Google Chrome).
2. Anda akan melihat halaman Login dengan latar belakang gelap elegan (Dark Mode) dan animasi logo bersinar.
3. **Pilih Cabang:** Klik dropdown cabang. Sebagai Owner, Anda diwajibkan memilih **UTAMA (Pusat)** agar Anda bisa memantau semua cabang sekaligus.
4. Masukkan Username dan Password rahasia Anda.
5. Klik tombol **Login**. Sistem akan memverifikasi data ke *Server Google Apps Script*. Jika berhasil, sesi Anda akan disimpan di *Local Storage* browser.

### 1.2. Bagaimana Sistem Sesi (Session) Bekerja?
- Saat Anda login, browser mengingat: `Nama, Role (OWNER), Cabang (UTAMA)`.
- **Tombol Logout:** Berada di bagian bawah *Sidebar* kiri. Jika ditekan, sesi Anda dihapus dari perangkat tersebut. Ini sangat penting jika Anda meminjam komputer/HP karyawan untuk mengecek data; pastikan selalu klik Logout.
- **Efek Role OWNER:** Di balik layar, setiap kali Anda membuka halaman apa pun (Dashboard, Laporan, dll), server mengecek role Anda. Karena role Anda `OWNER`, server mengizinkan data finansial sensitif (Laba Bersih, Harga Modal) dikirim ke browser Anda. Jika kasir mencoba meretas/mengubah role mereka dari browser, server akan langsung memblokir data tersebut.

---

## 📊 BAB 2: DASHBOARD UTAMA (Pusat Komando)

Halaman pertama setelah Anda login. Di sini Anda mengendalikan pemantauan makro (garis besar).

### 2.1. Panel Filter (Atas)
- **Tombol "🔄 Refresh":** Mengambil ulang (download) data terbaru dari server. Wajib ditekan jika Anda ingin melihat update detik itu juga tanpa perlu me-reload seluruh halaman browser.
- **Dropdown "Cabang":** Karena Anda login sebagai UTAMA, Anda melihat dropdown ini. 
  - Jika Anda pilih `SEMUA`, angka di bawah adalah total akumulasi ke-4 cabang.
  - Jika Anda pilih `SIB`, angka langsung berubah menjadi performa khusus cabang SIB. Background watermark logo di belakang juga akan ikut berubah sesuai cabang yang dipilih.
- **Input "Dari" & "Sampai":** Filter tanggal. Secara default adalah tanggal 1 bulan ini sampai hari ini.

### 2.2. Kotak KPI (Key Performance Indicator)
Semua angka di sini bergerak naik secara animasi.
1. **Total Servis:** Menghitung baris di tabel `TRANSAKSI` yang tanggalnya masuk dalam filter.
2. **Pendapatan:** Menjumlahkan `Total Biaya (Jasa + Part)` dari transaksi yang berstatus **SELESAI_DIAMBIL**.
3. **Laba Bersih:** `(Pendapatan - Modal Part - Komisi Teknisi - Pengeluaran Toko)`. Ini adalah indikator kesehatan bisnis. Jika ini minus, toko merugi.
4. **Piutang:** Uang pelanggan yang belum dibayar (Status bayar = BON).
5. **Kas Masuk & Keluar:** Mutasi harian uang tunai dan transfer di `KAS_HARIAN`.
6. **Saldo:** Uang *real* (fisik & bank) yang seharusnya ada di genggaman Anda hari ini.
7. **Hutang Supplier:** Total nilai barang dari supplier yang status pembayarannya masih BON.

### 2.3. Grafik & Tabel Bawah
- **Grafik Status Servisan (Bar Chart):** Menunjukkan porsi HP yang Antri vs Proses vs Selesai.
- **Pendapatan per Metode (Pie/Bar Chart):** Memecah uang masuk menjadi persentase Cash vs Transfer vs BON.
- **10 Transaksi & Kas Terbaru:** Tabel ini bisa di-klik. **Jika Anda klik baris transaksi**, sistem otomatis melompat (*shortcut*) ke halaman `Update Status` untuk transaksi tersebut.
- **Stok Rendah:** Jika angka stok menyentuh limit minimal, baris akan berubah merah. Tombol ini adalah pengingat untuk segera kulakan.

---

## 💼 BAB 3: MODUL TRANSAKSI (Penerimaan Servis)

Menu **Transaksi Baru** adalah tempat "Pintu Masuk" barang pelanggan.

### 3.1. Form Pelanggan & Unit
- **Input Nama Pelanggan & WA:** Saat mengetik nama, sistem akan mencoba memunculkan *Autocomplete* (saran) jika pelanggan itu pernah servis sebelumnya. Ini menghindari data pelanggan yang dobel.
- **Tipe Pelanggan (Umum/Langganan):** Langganan biasanya adalah konter rekanan.
- **Tipe HP & Kerusakan:** Harus diisi jelas.

### 3.2. Form Teknisi & Part (Multi-Item)
- **Dropdown Teknisi:** Bisa dikosongkan jika belum diputuskan siapa yang akan mengerjakan.
- **Tabel Part Tambahan:**
  - **Tombol "➕ Tambah Part":** Menambahkan satu baris baru ke tabel keranjang.
  - **Dropdown Kategori/Merk/Nama Part:** Bekerja secara "Cascade" (beruntun). Jika Anda pilih Merk "Oppo", maka dropdown Nama Part hanya akan menampilkan LCD/Baterai Oppo. *Sangat memperkecil risiko salah pilih barang.*
  - Ketika Part dipilih, kolom **Harga Beli** (Modal) dan **Harga Jual** akan terisi otomatis dari database Master.
  - **Tombol "🗑️ (Hapus Baris)":** Membatalkan part tersebut dari keranjang.
- **Input Ongkos Kerja:** Nilai uang jasa murni teknisi.

### 3.3. Kalkulasi & Pembayaran
- **Panel Kalkulasi (Kanan/Bawah):** Saat Anda mengisi Ongkos atau Part, angka "Total Modal", "Total Jual", dan "Laba Kotor" otomatis bergerak tanpa perlu me-refresh halaman.
- **Metode Bayar (CASH / TRANSFER / BON):** 
  - Jika pilih BON, pelanggan berhutang ke toko. 
  - Jika pilih CASH/TRANSFER, sistem akan meminta pelanggan membayar hari itu juga (biasanya untuk pelanggan DP).
- **Tombol "💾 Simpan Transaksi":** Saat ditekan:
  1. Baris baru dibuat di sheet `TRANSAKSI` (Database).
  2. Part dipindahkan ke `TRANSAKSI_DETAIL`.
  3. Stok di `STOK_PART` langsung **dikurangi**.
  4. Nota dibuat dan langsung muncul (Pop-up) siap dicetak ke printer Thermal.

---

## 🔄 BAB 4: UPDATE STATUS & EDIT TRANSAKSI

Menu ini adalah fitur yang paling sering dibuka oleh teknisi dan kasir untuk memperbarui status HP (tracking).

### 4.1. Mesin Pencari (Search Bar)
- **Input Pencarian:** Ketik ID Transaksi (Misal: TRX-2026...) atau Nama Pelanggan.
- **Tombol "🔍 Cari":** Menarik data transaksi yang dicari dan menampilkannya di "Kartu Detail Transaksi".

### 4.2. Mengubah Status Transaksi (Alur Kerja)
- **Dropdown Status Baru:** Pilih salah satu status:
  1. `ANTRI`: HP masuk antrean.
  2. `PROSES`: Teknisi sedang membongkar HP.
  3. `SELESAI_BELUM_DIAMBIL`: HP sudah jadi, pelanggan sudah di-WA tapi belum datang.
  4. `SELESAI_BELUM_LUNAS`: Pelanggan mengambil HP tapi bayar kurang/BON.
  5. `SELESAI_DIAMBIL`: **STATUS EMAS**. HP diambil, uang dibayar lunas. Saat status ini dipilih, barulah uang tercatat masuk ke `KAS_HARIAN`.
  6. `BATAL`: HP gagal diservis (misal: mesin mati total tidak bisa diselamatkan). Saat dipilih, stok part (jika ada) dikembalikan secara otomatis.
- **Tombol "💾 Update Status":** Menyimpan status terbaru dan mencatatnya ke Log Histori.

### 4.3. Tombol Aksi Super (Khusus Owner & Admin)
Di bawah Kartu Detail, ada 3 tombol sakti:
1. **✏️ Edit Transaksi:** Membuka pop-up untuk mengubah Nama, No WA, atau Tipe HP tanpa menghapus transaksi.
2. **🔩 Edit Part:** Membuka pop-up tabel part. 
   - Anda bisa menambahkan part baru (stok otomatis dipotong).
   - Anda bisa menghapus part lama (stok otomatis dikembalikan).
   - *Cara Kerjanya:* Server menghitung *selisih* part lama vs part baru, lalu menyesuaikan Laba transaksi tersebut secara *real-time*.
3. **🗑️ Hapus/Void:** Tombol paling mematikan. Menghapus transaksi sepenuhnya dari sistem. Stok kembali, Uang Kas di-reverse (ditarik), dan catatan diubah jadi BATAL secara permanen.

---

## 🏦 BAB 5: MANAJEMEN KASIR HARIAN

Ini adalah pusat pertanggungjawaban uang fisik toko. Setiap cabang (SIB, BL, LJ, AF) WAJIB melakukan ini setiap hari.

### 5.1. Buka Toko (Pagi)
- **Tombol "Buka Laci / Saldo Awal":** Kasir memasukkan modal uang kembalian (misal Rp 200.000). Sistem mencatatnya sebagai `KAS_MASUK` kategori `MODAL`. Ini adalah pondasi perhitungan kas hari itu.

### 5.2. Transaksi Operasional (Siang)
- **Tombol "💸 Input Pengeluaran":** Jika kasir perlu membeli sapu, galon, atau bensin, mereka klik tombol ini.
- **Form Pengeluaran:** Masukkan Keterangan (Makan Siang) dan Jumlah (Rp 50.000). 
- *Efek Sistem:* Uang di laci akan berkurang 50.000. Pengeluaran ini akan langsung **memotong angka Laba Bersih** di laporan Laba Rugi bulanan.

### 5.3. Tutup Toko (Malam)
- **Tombol "Tutup Toko / Setor Owner":** Mengakhiri operasional hari itu.
- **Cara Kerja:** Sistem akan menghitung rumus: `(Modal Awal Pagi + Uang Servis/Jualan - Pengeluaran Siang)`. Ini adalah saldo yang Diharapkan (Expected Balance).
- Kasir lalu menginput "Nominal Disetor" (misal diambil Owner Rp 1.000.000). Sistem akan mencatatnya sebagai uang keluar, sehingga sisa saldo laci siap dipakai untuk keesokan paginya.

---

## 📦 BAB 6: STOK, INVENTORY & PEMBELIAN

### 6.1. Pembelian Part (Kulakan)
- **Menu:** Pembelian Part.
- **Dropdown Supplier:** Pilih dari daftar master.
- **Tabel Item:** Tambahkan barang apa saja yang dibeli hari ini.
- **Metode Pembayaran (LUNAS / BON):**
  - Jika **LUNAS**: Sistem mencatat uang keluar dari `KAS_HARIAN` sejumlah total beli.
  - Jika **BON**: Sistem mencatat ke tabel `HUTANG_SUPPLIER`. Uang laci TIDAK BERKURANG, tapi stok tetap masuk.
- **Tombol "Simpan":** Menambah stok fisik cabang yang dipilih.

### 6.2. Master Data Part & Fitur "Alias" (Persamaan)
- **Menu:** Master Data ➡️ Tab Part.
- **Tombol "✏️ Edit":** Klik pada baris LCD.
- **Kolom "Persamaan":** Input tipe-tipe HP yang bisa memakai LCD tersebut. Pisahkan dengan koma (Contoh: `Realme C2, Oppo A7`).
- **Efek Sistem:** Mulai detik itu, jika di menu *Transaksi Servis* kasir mengetik "Realme C2", maka "LCD Oppo A5s" akan otomatis muncul di opsi pilihan. Ini sangat luar biasa untuk mencegah kesalahan potong stok.

### 6.3. Transfer Cabang Multi-Item
- **Menu:** Transfer Cabang.
- **Tombol "➕ Tambah":** Masukkan 10 atau 20 item sekaligus dari gudang pusat ke cabang SIB.
- **Tombol "💾 Simpan & Transfer Semua":** Menembakkan seluruh barang tersebut secara massal. Stok gudang berkurang seketika, stok SIB bertambah seketika. Proses ini terekam permanen di riwayat CCTV aset.

### 6.4. Import CSV Massal (Fitur "Backdate")
- **Tombol "📥 Import CSV":** Memasukkan data ribuan barang tanpa mengetik satu-satu.
- **Kolom "Tanggal Beli" (di Excel):** Jika Anda ingin memasukkan barang lama (kulakan bulan lalu), isi tanggalnya di Excel (contoh: 2026-04-15).
- *Efek Sistem:* Saat diupload, barang tersebut akan tercatat seolah-olah masuk ke gudang pada tanggal 15 April, sehingga Laporan Stok dan Stock Opname (SO) menjadi sinkron dan akurat secara histori.

### 6.5. Return Supplier
- **Tombol "Return Part":** Mengembalikan barang rusak (garansi distributor).
- **Opsi "Potong Hutang":** Jika dicentang, alih-alih uang cash kembali ke laci Anda, sistem akan secara cerdas mencari hutang Anda ke supplier tersebut dan mengurangi nominal hutangnya.

---

## 📈 BAB 7: LAPORAN (REPORTING) KHUSUS OWNER

Laporan adalah "Kaca Pembesar" Anda untuk melihat mikroskopis bisnis. Semua laporan dilengkapi tombol **📥 Export CSV** untuk dibuka di Excel.

### 7.1. Laporan Laba Rugi (Nett Profit)
- **Fungsi:** Mengungkap keuntungan asli Anda setelah dikurangi semua beban mati (modal beli).
- **Cara Kerja Sistem:** Sistem menjumlahkan semua *Harga Jual* servis. Lalu menjumlahkan semua *Harga Beli (Modal)* part yang terpakai. Lalu menjumlahkan semua ongkos teknisi. Lalu menjumlahkan pengeluaran laci (ATK/Listrik). Rumus akhirnya menghasilkan "Laba Bersih".
- **Privasi:** Hanya akun Owner yang bisa melihat menu ini.

### 7.2. Laporan Kas
- **Fungsi:** Buku Tabungan Harian. 
- **Filter Metode:** Jika Anda mencurigai kasir menggelapkan uang, filter ke metode "CASH". Semua baris uang fisik akan terlihat jelas, detik per detik. Cocokkan dengan uang fisik di laci.

### 7.3. Laporan Servisan
- **Fungsi:** Menilai performa teknisi.
- **Membaca Tabel:** Jika ada 10 HP masuk, tapi statusnya "Batal" ada 6, berarti tingkat keberhasilan (Success Rate) toko sangat buruk. Ini lampu merah bagi Owner untuk menegur teknisi.

### 7.4. Ringkasan Harian (Tutup Toko)
- **Tombol "Cari Ringkasan":** Menggabungkan 3 tabel raksasa menjadi 1 layar ringkas:
  1. Tabel Hak Supplier (Uang mati yang tidak boleh dipakai makan oleh Owner).
  2. Tabel Hak Teknisi (Total uang lelah karyawan).
  3. Tabel Saldo Kasir (Berapa yang bisa disetor ke Owner hari ini).

### 7.5. Laporan Stok & Riwayat (CCTV Aset)
- **Laporan Stok:** Melihat nilai uang dari seluruh barang Anda di rak. (Jika di etalase ada barang senilai Rp 50 Juta, Anda akan melihat angka itu di sini).
- **Riwayat Part (CCTV):** Cari satu nama barang. Sistem akan memunculkan "Garis Waktu (Timeline)". Misalnya:
  - *Tgl 1 Jan 08:00* ➡️ Masuk +50 (Dibeli oleh Admin X)
  - *Tgl 2 Jan 10:00* ➡️ Keluar -1 (Dipakai di transaksi Bapak Budi oleh Kasir Y)
  - Fitur ini mustahil dibohongi. Jika barang hilang, Anda tahu pasti siapa yang mengoperasikannya hari itu.

---

## ⚙️ BAB 8: MASTER DATA & PENGATURAN

Ini adalah "Ruang Mesin" (Engine Room) aplikasi Anda.

### 8.1. Kelola Pengguna (Tab Users)
- **Tombol Edit User:** Ganti password karyawan jika mereka lupa.
- **Dropdown Role & Cabang:** Anda bisa mengunci "Kasir A" hanya bisa login sebagai "Admin (Hanya Input)" dan hanya boleh melihat cabang "SIB". Mereka otomatis diblokir dari melihat cabang BL.

### 8.2. Dropdown (Referensi)
- Anda bisa menambah pilihan merk (Samsung, Apple, Xiaomi) atau Kategori (LCD, Baterai, IC). Jika ditambahkan di sini, otomatis muncul di seluruh form *dropdown* di semua cabang.

### 8.3. Config (Pengaturan Branding)
- Anda dapat menginput URL Google Drive untuk logo-logo cabang (LOGO_SIB, LOGO_BL). Sistem akan secara ajaib memunculkan logo tersebut sebagai *watermark glowing* di latar belakang aplikasi, yang berubah-ubah secara dinamis saat Anda mengganti cabang dari panel filter atas.

---

> **Pesan Penutup untuk Owner:**  
> Kuasai Dashboard Utama, Laporan Laba Rugi, dan Ringkasan Tutup Toko. Ketiga menu ini adalah trisula kekuatan Anda. Jika terjadi selisih uang sekecil apa pun, segera minta admin Anda membuka Laporan Kas dan Lacak CCTV Riwayat Part. ServicePro HP menjamin transparansi 100% untuk keamanan bisnis Anda.
> 
> *— Dokumen disusun oleh Antigravity AI, Sistem Manajemen ServicePro HP v5.2*

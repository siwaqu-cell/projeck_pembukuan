# 🧠 ANATOMI SISTEM SERVICEPRO: PANDUAN PELATIHAN KHUSUS OWNER (VERSI LENGKAP 18 MENU)

*Dokumen ini adalah "Kunci Jawaban" untuk Owner. Pelajari dokumen ini agar Anda paham betul 100% alur kerja aplikasi sebelum Anda mengajarkan SOP (Standard Operating Procedure) kepada Kasir atau Karyawan.*

Dalam sistem ini, **setiap tombol dan setiap form memiliki konsekuensi langsung terhadap keuangan atau stok Anda**. Tidak ada tombol yang diciptakan tanpa alasan. Berikut adalah pembedahan total SETIAP HALAMAN (dari atas ke bawah sesuai menu di samping kiri), kenapa form itu ada di sana, dan apa efek dari setiap tombol.

---

## BAGIAN I: MENU UTAMA (OPERASIONAL DEPAN)

### 1. 📊 DASHBOARD (Pusat Komando)
Halaman pertama setelah Login. Memberikan gambaran besar.
*   **Dropdown `Filter Cabang`**: Jika Anda login sebagai Owner, Anda bisa memilih "SEMUA". Jika kasir login, tombol ini terkunci.
*   **Tombol `🔄 Refresh`**: Diklik saat Anda menatap layar dan ingin update data detik itu juga tanpa me-reload browser.
*   **Grafik Bar Status Servisan**: Visualisasi jumlah HP yang Antri, Proses, Selesai. **Bisa Di-KLIK**. Jika diklik, halaman melompat ke daftar HP yang statusnya sama.
*   **Tabel "10 Transaksi Terbaru"**: Jalan pintas. Tombol `Cetak Nota` & `Update Status` ada di sini agar kasir tidak usah pindah halaman jika HP tersebut baru saja masuk hari itu.

### 2. 💵 MANAJEMEN KASIR (Uang Laci Fisik)
Halaman ini adalah **nyawa kedisiplinan kasir**. Tujuannya mengunci tanggung jawab kasir terhadap uang fisik lembaran di laci.
*   **Form Kiri: `💸 Input Pengeluaran`**:
    *   *Fungsi:* Tempat kasir mencatat pengeluaran harian (beli lakban, galon).
    *   *Efek:* Langsung mengurangi uang fisik di laci dan **MEMOTONG LABA BERSIH OWNER**.
*   **Form Kanan: `🏪 Buka / Tutup Toko`**:
    *   *Fungsi `Buka Laci (Modal Awal)`:* Kasir input uang receh kembalian di pagi hari.
    *   *Fungsi `Tutup Toko (Setor Tunai ke Owner)`:* Saat kasir menyerahkan uang ke Anda. Efeknya: Uang laci dipotong, TAPI **Tidak memotong laba bersih** (karena ini adalah uang bagi hasil, bukan biaya).

### 3. ➕ TRANSAKSI BARU (Penerimaan Servis)
Tempat kasir mendaftarkan HP pelanggan.
*   **Tombol `➕ Tambah Servisan`**: Membuka form input data pelanggan.
*   **Tombol Rahasia di Form: `➕ Tambah Part`**:
    *   *Fungsi:* Untuk menumpuk (stack) banyak barang (misal: ganti LCD + Baterai sekaligus). Harga modal tertarik otomatis dari gudang.
    *   *Efek:* Jika disimpan, stok LCD dan Baterai tersebut otomatis terpotong (minus) dari gudang.

### 4. 🛒 PENJUALAN AKSESORIS (Direct Selling)
*   *Kenapa menu ini dipisah dari Servis?* Karena ini untuk pelanggan yang hanya beli Anti Gores, Charger, atau Case tanpa membongkar HP. Laporan keuangannya dipisah agar Anda tahu mana omset dari jasa teknisi, mana omset dari jualan murni.
*   *Efek:* Memotong stok aksesoris, dan menambah uang kas tanpa ada hitungan komisi teknisi.

### 5. 🔄 UPDATE STATUS
Halaman khusus teknisi.
*   *Fungsi:* Berisi deretan tabel HP yang masih di bengkel. Teknisi hanya perlu fokus ke halaman ini.
*   **Tombol `Status (Misal: 🟡 ANTRI)`**: Diklik teknisi saat pekerjaan selesai (pilih "SELESAI_DIAMBIL"). Laba kotor dan komisi teknisi dihitung detik itu juga.

---

## BAGIAN II: STOK & PEMBELIAN (LOGISTIK)

### 6. 📦 PEMBELIAN PART (Restock)
*   *Kenapa formnya berbentuk Keranjang Belanja?* Karena saat Anda belanja ke Supplier (misal: Roxy), Anda membeli 50 macam barang sekaligus. 
*   *Fungsi:* Meng-input nota bon supplier. Jika harga kulakan naik, harga lama di sistem otomatis tertimpa (ter-update). Menambah kuantitas stok.

### 7. ↩️ RETURN SUPPLIER
*   *Kapan digunakan?* Beli LCD ternyata layarnya bergaris, Anda kembalikan ke Supplier.
*   *Tombol `Potong Hutang` vs `Tukar Barang`*:
    *   *Tukar Barang:* Stok Anda tetap, Anda hanya menukar fisik.
    *   *Potong Hutang:* Stok Anda dikurangi, dan tagihan (BON) ke supplier tersebut dianggap lunas sebesar nilai LCD tersebut.

### 8. 🔀 TRANSFER CABANG
*   *Kenapa ada?* Kekuatan sistem Multi-Cabang. Cabang B kehabisan barang, Pusat punya sisa 10.
*   *Efek:* Anda klik tombol transfer, pilih dari Pusat ke Cabang B. Stok Pusat otomatis -2, Stok Cabang B otomatis +2 lengkap dengan harga modal yang sama persis tanpa perlu input ulang.

---

## BAGIAN III: DATA & LAPORAN (RUANG AUDIT OWNER)

### 9. 🗂️ MASTER DATA
Jantung pengaturan aplikasi.
*   **Sub-Menu Karyawan/User**: Tempat Owner membuat username & password.
*   **Sub-Menu Persamaan (Alias)**: *Sangat Krusial!* Teknisi sering pakai "LCD Realme C1" untuk "Oppo A3s". Jika fitur ini diisi, kasir boleh memotong stok LCD A saat pelanggan servis HP tipe B.
*   **Sub-Menu Kategori & Supplier**: Mengatur data baku agar ketikan kasir seragam (tidak ada yang ngetik "Roxi", "Roxy", "Roksy").

### 10. 💰 LAPORAN KAS
*   *Fungsi:* Melihat histori kemana uang mengalir.
*   **Tombol Khusus: `💸 Input Pengeluaran` (Warna Kuning)**:
    *   *Kenapa ada lagi?* Ini jalan pintas untuk Owner. Di sini ada fitur **BACKDATE (Tanggal Mundur)** dan opsi sumber dana **"Uang Pribadi Owner"**.
    *   *Kapan digunakan?* Anda bayar tagihan WiFi cabang pakai m-banking Anda sendiri kemarin. Anda input di sini. Efeknya: Laba cabang dipotong, TAPI saldo kasir/mutasi tidak ikut minus (karena pakai uang Anda sendiri).

### 11. 📦 LAPORAN STOK & 📋 STOCK OPNAME
*   *Laporan Stok:* Melihat total nilai aset uang Anda yang mati dalam bentuk barang (Nilai Valuasi Gudang).
*   **Stock Opname**: 
    *   *Kapan digunakan?* Setiap akhir bulan saat kasir menghitung fisik. Anda tinggal klik **🖨️ Cetak**, kasir bawa kertasnya keliling toko menghitung barang.

### 12. 📊 LAPORAN LENGKAP & 📈 LABA RUGI
*   **Laporan Lengkap:** Halaman raport bulanan. Melihat teknisi mana yang menghasilkan komisi paling besar, dan pelanggan mana yang paling sering datang (Top 10 Customers).
*   **Laporan Laba Rugi:** Rahasia Owner.
    *   *Cara kerjanya:* Harga Jual - Modal Part - Komisi Teknisi - **Biaya Pengeluaran (Makan/Listrik)** = Laba Bersih yang masuk kantong Anda. Disajikan per hari agar Anda tahu di tanggal berapa omset anjlok.

### 13. 🔧 LAPORAN SERVISAN
*   Hanya menampilkan deretan HP pelanggan. Digunakan jika ada pelanggan komplain garansi sebulan kemudian. Anda cari nama mereka di sini.

### 14. 🏠 RINGKASAN TUTUP TOKO
*   *Kapan diklik?* Setiap malam pukul 21:00. Halaman ini adalah rangkuman dari semua aktivitas hari itu. Membantu kasir mencocokkan total setoran tanpa harus buka kalkulator.

### 15. 📋 RIWAYAT PART (CCTV GUDANG)
*   *Kenapa penting?* Ini adalah "CCTV Digital". Jika stok LCD kurang 1, Anda buka halaman ini, filter "LCD". Sistem akan mencetak daftar: Tanggal sekian, jam sekian, Kasir A memotong stok ini untuk Servisan HP B. Ketahuan siapa yang mencuri atau lupa input.

### 16. 📥 IMPORT STOK
*   *Fungsi:* Saat Anda baru pertama kali memakai aplikasi ini, dan punya ribuan data di Excel. Anda tidak perlu input satu per satu. Cukup upload file CSV di sini, dan semua barang akan masuk.

### 17. ⚠️ PEMBATALAN / VOID (Khusus Owner)
*   *Kenapa menu ini berwarna merah dan ditaruh di paling bawah?*
*   *Fungsi:* Jika ada pelanggan marah dan membatalkan servis setelah nota dicetak, atau kasir salah input nota fatal.
*   *Apa yang terjadi saat transaksi dibatalkan?* Mesin bekerja keras: 
    1. Mengembalikan stok part (yang tadinya minus jadi plus lagi).
    2. Menarik uang kembali dari Laporan Kas (Reverse).
    3. Mengosongkan perhitungan laba.
    4. Mengganti status menjadi BATAL agar karyawan tahu.

---
### PENUTUP
Dengan membaca anatomi di atas, Anda sekarang telah menguasai "nyawa" dan logika mesin dari aplikasi ServicePro HP Anda. Saat karyawan Anda beralasan *"Aduh pak, sistemnya error saldonya kurang"*, Anda akan langsung tahu bahwa karyawan tersebut pasti salah menekan tombol Pengeluaran alih-alih Setoran Owner. Selamat memimpin!

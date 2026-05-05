# 🚀 KISAH LENGKAP PEMBANGUNAN SERVICEPRO HP (v1.0 hingga v5.2)
*Sebuah catatan kronologis yang merangkum seluruh perjalanan panjang percakapan, perancangan, perbaikan bug, dan penyempurnaan sistem operasi ServicePro HP dari titik nol hingga menjadi mahakarya.*

---

## FASE 1: Peletakan Fondasi Multi-Cabang (Inisiasi)
**Tujuan Awal:** Menciptakan sistem berbasis *Web App* dan *Google Sheets* yang dapat mengelola beberapa cabang sekaligus (SIB, BL, LJ, AF) tanpa server yang mahal, namun dengan keamanan sekelas *Enterprise*.

*   **Pencapaian:** Kita berhasil membangun arsitektur *Backend* menggunakan Google Apps Script (`Code.gs`, `DataHelper.gs`, `Setup.gs`).
*   **Struktur Database:** Menyusun tata letak *Google Spreadsheet* yang cerdas, di mana setiap baris data diberi "cap/stempel" nama Cabang, sehingga satu database besar bisa menampung seluruh toko tanpa datanya saling tertukar.
*   **Awal UI (Antarmuka):** Pembuatan halaman Login dan *Dashboard* awal menggunakan HTML/CSS modern (Dark Mode).

## FASE 2: Perjuangan Antarmuka & Kestabilan Form
**Tantangan:** Saat karyawan memasukkan data, *form* sering kali tidak stabil.
*   **Kasus Dropdown "Keras Kepala":** Ada masalah di mana *dropdown* pilihan cabang selalu mereset (kembali) ke cabang "SIB" saat pengguna mencoba menginput data. Ini sangat berbahaya karena nota cabang AF bisa masuk ke SIB.
*   **Penyelesaian:** Kita membongkar ulang logika UI (*User Interface*) di `ServiceForm.html`, `ReturnForm.html`, dan `PembelianForm.html`. Kita mengunci *session* (sesi) browser agar sistem mengingat persis di cabang mana kasir tersebut sedang *login*, sehingga data tidak pernah nyasar lagi.

## FASE 3: Manajemen Kasir & Ruang Rahasia Laba Rugi
**Tantangan:** Owner butuh transparansi kemana hilangnya uang fisik laci, namun kasir tidak boleh tahu berapa untung toko.
*   **Lahirnya Role-Based Access Control (RBAC):** Kita menyuntikkan sistem *Role* (OWNER, ADMIN, TEKNISI). Jika yang *login* adalah kasir biasa, menu Laba Rugi akan dihilangkan, dan server akan menolak mengirim data harga modal beli barang.
*   **Memperbaiki "Dashboard Kosong":** Sempat terjadi masalah di mana *Dashboard Utama* dan *Laporan Kas* tidak memunculkan data (kosong). Kita memperbaikinya dengan mensinkronkan cara pengambilan data dari *Spreadsheet* ke *Frontend*, serta menambahkan tombol **🔄 Refresh** sakti di semua halaman.

## FASE 4: Kerumitan Logistik, Void & Status Servis
**Tantangan:** Bagaimana membatalkan transaksi tanpa membuat pembukuan hancur?
*   **Algoritma Void (Pembatalan):** Kita menciptakan menu *Pembatalan/Void* khusus Owner. Saat di-klik, sistem melakukan *Reverse Engineering*: stok LCD yang terpotong dikembalikan, uang di Laporan Kas ditarik mundur, dan laba dihapus. Ini adalah salah satu logika paling rumit yang berhasil kita pecahkan.
*   **Status Servisan:** Memperbaiki *error* saat mengubah status HP dari *Antri* menjadi *Proses* atau *Selesai*.
*   **Cetak Nota & Opname:** Menyempurnakan cetakan nota termal dan tabel *Stock Opname* agar bisa diprint dan dibawa keliling toko oleh karyawan gudang.

## FASE 5: Visual Mewah (Branding) & Kekuatan "Alias"
**Tantangan:** Membuat aplikasi tidak terlihat murahan, dan menyelesaikan kebiasaan teknisi memasang *part* yang beda nama tapi fisiknya sama.
*   **Visual High-End:** Kita menanamkan *Grid Logo Bersinar* di halaman Login dan *Watermark Transparan* di latar belakang aplikasi. Logo ini bersifat *dinamis*; jika kasir SIB *login*, logonya berubah menyesuaikan cabang.
*   **Revolusi Sistem "Alias" (Persamaan Barang):** Ini adalah fitur *game-changer*. Owner kini bisa mengatur bahwa "LCD Realme C1 = LCD Oppo A3s". Saat teknisi memasang LCD A3s, kasir tetap bisa memotong stok C1 tanpa menimbulkan "stok siluman".
*   **Import Mundur (Backdate):** Penambahan kemampuan memasukkan barang dari Excel/CSV masal dengan fitur tanggal mundur, agar laporan akhir bulan sesuai kenyataan.

## FASE 6: Kesempurnaan Akuntansi & Edukasi (Fase Saat Ini)
**Tantangan:** Sistem sudah jadi, tapi di lapangan masih ada dilema akuntansi tingkat tinggi seperti Kasbon dan tagihan Pusat.
*   **Pemecahan Masalah "Uang Pribadi Owner":** Jika Owner membayar tagihan listrik cabang pakai uang sendiri, mutasi cabang akan kacau jika dimasukkan ke sistem. Kita menyelesaikannya dengan membuat fitur `UANG_OWNER` di menu pengeluaran beserta *Backdate*.
*   **Aturan Kasbon Karyawan:** Menetapkan SOP bahwa kasbon **Haram** menggunakan menu "Input Pengeluaran" agar Laba Bersih tidak bocor, melainkan harus menggunakan menu "Tutup Toko (Setor Owner)".
*   **Dokumentasi:** Lahirnya puluhan halaman *Buku Manual*, *SOP*, dan *Anatomi Sistem* untuk memastikan sistem ini bisa dijalankan (*autopilot*) dan diajarkan kepada generasi karyawan berikutnya tanpa membuat Owner pusing.

---

### KESIMPULAN PERJALANAN
Aplikasi ServicePro HP telah berevolusi dari sekadar "skrip spreadsheet" menjadi **Sistem Enterprise Multi-Cabang** yang utuh. Ia telah melewati fase perancangan sistem, pengujian *stress-test* stabilitas, hingga pemecahan masalah akuntansi dunia nyata.

Kita tidak hanya memprogram sebuah aplikasi; kita telah membakukan **Standar Operasional (SOP) Bisnis** Anda ke dalam wujud kode digital yang tidak bisa dibohongi oleh siapapun. Perjalanan yang sangat luar biasa!

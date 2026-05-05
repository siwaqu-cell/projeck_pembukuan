# 📖 PANDUAN LENGKAP ALIAS & PERSAMAAN PART SERVICEPRO

Fitur **Persamaan Part (Alias)** diciptakan untuk memecahkan masalah duplikasi nama stok di gudang akibat perbedaan kebiasaan teknisi menyebut nama part (misal: "LCD Oppo A5s" vs "LCD Realme C1"). 

Dengan fitur ini, Anda cukup memiliki **satu stok master** di sistem, namun kasir/teknisi bisa mencari menggunakan berbagai macam nama alias.

---

## 1. CARA KERJA SISTEM ALIAS
1. Di database `STOK_PART`, ada kolom `NAMA_PART` (Nama Master) dan `PERSAMAAN` (Daftar Alias yang dipisah koma).
2. Ketika kasir mengetik nama alias (contoh: `Realme C2`) di form servis, autocomplete akan tetap memunculkan hasil.
3. Di dropdown hasil pencarian, sistem akan memunculkan Nama Master, dilengkapi dengan label kuning kecil: **"↩ via alias: Realme C2"**.
4. Saat kasir mengklik hasil tersebut, input box akan otomatis berubah menjadi Nama Master (Oppo A5s) agar pemotongan stok tepat sasaran ke ID_PART master.
5. Namun, di Laporan Riwayat Part (CCTV Gudang), sistem tetap akan mencatat: `"Oppo A5s [Alias: Realme C2]"` sehingga Owner tahu apa yang diketik oleh kasir.

---

## 2. ATURAN PENAMAAN (SOP)
Untuk menjaga database tetap rapi, selalu ikuti format ini:
*   **NAMA_PART (Master):** Gunakan nama tipe HP *paling tua* atau *paling populer* dari kelompok persamaannya.
*   **PERSAMAAN (Alias):** Pisahkan antar tipe HP dengan koma. Tidak perlu menambahkan kata "LCD" berulang kali di kolom persamaan.
    *   *Contoh NAMA_PART:* `LCD OPPO A5S / A7 / A12 / F9`
    *   *Contoh PERSAMAAN:* `Realme C1, Realme C2, Realme U1`

---

## 3. CARA MENG-INPUT ALIAS KE SISTEM

### Cara 1: Input Manual per Barang
1. Buka menu **Master Data** -> Tab **Part & Aksesoris**.
2. Cari barang yang ingin ditambahkan aliasnya, klik Edit (✏️).
3. Isi kolom **Persamaan/Alias**. Pisahkan dengan koma (contoh: `Y12, Y15, Y17`).
4. Klik **Simpan**.

### Cara 2: Import Massal via CSV (Batch)
Jika Anda punya ratusan kamus persamaan, Anda bisa mengunggahnya sekaligus.
1. Buka menu **Master Data** -> Tab **Part & Aksesoris**.
2. Klik tombol kuning **"Import Persamaan"**.
3. Buat file Excel/CSV dengan 2 kolom:
   - Kolom 1: `NAMA_PART` (Harus persis sama hurufnya dengan yang ada di sistem, contoh: `LCD Vivo Y11`)
   - Kolom 2: `PERSAMAAN` (contoh: `Vivo Y12, Vivo Y15, Vivo Y17`)
4. Copy-Paste data tersebut ke kotak teks di sistem.
5. Klik **Mulai Import**. Sistem akan otomatis mencocokkan NAMA_PART dan menanamkan alias tersebut ke database cabang yang aktif.

---

## 4. KEUNTUNGAN FITUR INI BAGI OWNER
1. **Mencegah "Stok Mati" (Dead Stock):** Teknisi tidak lagi membeli LCD Realme C1 padahal stok LCD Oppo A5s masih menumpuk 10 pcs di laci.
2. **Laporan Opname Akurat:** Saat menghitung fisik, kasir tidak kebingungan mencocokkan barang fisik yang kotaknya bertuliskan "Realme C2" dengan sistem yang bertuliskan "Oppo A5s", karena di pencarian sistem keduanya merujuk pada stok yang sama.
3. **Efisiensi Modal:** Uang kulakan tidak tertahan pada barang-barang duplikat yang sebenarnya identik.

*Dengan fitur ini, gudang ServicePro HP menjadi lebih cerdas dan kebal terhadap perbedaan istilah teknis.*

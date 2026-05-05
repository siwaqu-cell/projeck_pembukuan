# 💰 SOP KASBON KARYAWAN & DANA PRIBADI OWNER

Dokumen ini adalah standar operasional prosedur (SOP) untuk mencatat arus keluar-masuk uang yang bersifat non-operasional (bukan hasil servis/kulakan), yaitu: Kasbon Karyawan, Injeksi Modal Owner, dan Penarikan Laba (Drawing).

Pencatatan yang ketat di area ini sangat krusial agar **Laporan Kas Harian** (uang fisik di laci) selalu sinkron dengan kenyataan, dan **Laporan Laba Rugi** tidak menjadi kacau akibat uang yang tercampur.

---

## 1. KASBON KARYAWAN (Pinjaman)

Kasbon adalah uang toko yang ditarik oleh karyawan sebagai pinjaman dan akan dipotong dari gaji/komisi bulanan. Kasbon **akan mengurangi uang fisik di laci**.

### Cara Mencatat Kasbon
Kasbon tidak boleh dicatat sebagai "Pengeluaran Operasional" karena kasbon bukan kerugian toko, melainkan **Piutang Karyawan**.

1. Karyawan meminta kasbon kepada Owner/Admin.
2. Kasir membuka menu **Manajemen Kasir** -> **Input Pengeluaran**.
3. *Catatan Penting:* Karena saat ini sistem mencatat semua pengeluaran laci sebagai Opex (mengurangi laba bersih), maka Owner/Admin **wajib mengetikkan kata sandi "[KASBON]"** di awal keterangan.
4. Contoh Pengisian Form Pengeluaran:
   - **Keterangan:** `[KASBON] Budi Teknisi`
   - **Jumlah:** `500000`
5. Uang fisik di laci akan berkurang Rp 500.000.
6. Di akhir bulan, saat menghitung gaji Budi, Owner cukup mencari kata `[KASBON] Budi` di laporan kas untuk memotong gajinya.

*Saran Pembaruan Sistem Mendatang: Jika kasbon sangat sering terjadi, sistem ServicePro bisa di-upgrade untuk menambahkan kategori khusus `KASBON_KARYAWAN` di dropdown pengeluaran.*

---

## 2. DANA PRIBADI OWNER (Injeksi Modal Tambahan)

Ada kalanya Owner menaruh uang pribadinya ke dalam laci toko karena toko sedang kekurangan pecahan kecil, atau untuk menalangi pembelian part yang mahal.

### Cara Mencatat Injeksi Dana Owner
1. Owner memberikan uang tunai (misal: Rp 1.000.000) ke kasir untuk dimasukkan ke laci.
2. Kasir dilarang memasukkannya diam-diam tanpa dicatat. Kasir WAJIB membuka menu **Manajemen Kasir** -> **Buka Laci / Saldo Awal**.
3. Di form tersebut, kasir mencatat sebagai penambahan modal (pilih metode CASH/TRANSFER sesuai wujud uangnya).
4. **Keterangan:** `Suntikan Dana Pribadi Bos`
5. Uang di sistem laci akan bertambah, sehingga saat "Tutup Toko" nanti malam, tidak ada kelebihan uang misterius.

---

## 3. PENARIKAN LABA OLEH OWNER (Prive / Drawing)

Ini adalah kebalikan dari injeksi. Owner mengambil uang dari laci untuk keperluan pribadinya (belanja pribadi, bayar cicilan rumah owner, dsb).

### Cara Mencatat Penarikan Laba (Tutup Toko)
Jalur paling direkomendasikan untuk mengambil uang toko adalah **saat Tutup Toko (Malam Hari)**.

1. Kasir menghitung total uang laci di malam hari.
2. Kasir menekan tombol **Tutup Toko / Setor Owner**.
3. Kasir menginput **Nominal Disetor** sesuai uang fisik yang diambil/ditransfer oleh Owner ke rekening pribadinya.
4. Uang yang diambil ini akan dicatat oleh sistem sebagai kategori `SETOR_OWNER`.
5. Sisanya (jika laci tidak dikosongkan) akan otomatis tercatat sebagai "Saldo Terakhir" yang ditinggalkan untuk pagi harinya.

### Cara Mencatat Penarikan Laba (Siang Hari)
Jika Owner tiba-tiba datang di siang hari dan mengambil Rp 2.000.000 dari laci kasir SIB:
1. Kasir membuka menu **Manajemen Kasir** -> **Input Pengeluaran**.
2. **Keterangan:** `[PRIVE] Diambil Bos`
3. Hal ini akan mengurangi laci seketika. (Sama seperti kasbon, Owner harus mengabaikan baris `[PRIVE]` saat membaca Laporan Laba Rugi, karena uang yang diambil bos bukanlah kerugian/biaya operasional toko).

---

## RINGKASAN ATURAN EMAS KASIR
*   **Ada uang fisik MASUK laci** di luar hasil servis → Harus dicatat via tombol `Buka Laci / Saldo Awal` (Modal Masuk).
*   **Ada uang fisik KELUAR laci** di luar kulakan part → Harus dicatat via tombol `Input Pengeluaran`. Gunakan tag `[KASBON]` atau `[PRIVE]` jika uang itu bukan dipakai untuk keperluan toko.
*   **Tidak Boleh Menunda Input** → Begitu uang fisik berpindah tangan, detik itu juga harus diketik di sistem untuk menghindari amnesia.

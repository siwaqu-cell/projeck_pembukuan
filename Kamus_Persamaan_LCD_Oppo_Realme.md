# 📱 KAMUS PERSAMAAN LCD OPPO & REALME TERLENGKAP
*Dokumen ini khusus dibuat sebagai panduan lengkap persamaan fisik layar (LCD) untuk keluarga besar merk OPPO dan REALME (yang berasal dari induk perusahaan yang sama).*

Admin Gudang dapat menggunakan daftar ini untuk mendaftarkan "Nama Alias" di Master Data aplikasi ServicePro HP, sehingga kasir tidak kebingungan saat stok satu nama kosong padahal fisiknya tersedia di nama lain.

---

## 🟢 DAFTAR GRUP LCD YANG BISA SALING PASANG (PNP)

### GRUP 1: Keluarga A3s (Poni Lebar)
*Ini adalah salah satu LCD paling legendaris dan paling banyak dipasang saling silang di pasaran.*
*   **OPPO A3s** *(Rekomendasi dijadikan Nama Utama di aplikasi)*
*   OPPO A5
*   OPPO A12e
*   Realme C1
*   Realme 2

### GRUP 2: Keluarga A5s (Poni Tetesan Air / Waterdrop)
*Sangat umum, pastikan teknisi mengecek apakah ada perbedaan panjang fleksibel pada versi tertentu, namun umumnya 99% PNP.*
*   **OPPO A5s** *(Rekomendasi dijadikan Nama Utama)*
*   OPPO A7
*   OPPO A12
*   OPPO A11k
*   Realme 3
*   Realme 3i

### GRUP 3: Keluarga A1k
*   **OPPO A1k**
*   Realme C2

### GRUP 4: Keluarga Layar Besar 6.5 Inch (Waterdrop Seri 5)
*Grup ini sangat masif karena Realme dan Oppo merilis sangat banyak varian dari cetakan bodi yang sama.*
*   **OPPO A5 2020** *(Rekomendasi Nama Utama)*
*   OPPO A9 2020
*   OPPO A31 (2020)
*   OPPO A8
*   Realme 5
*   Realme 5i
*   Realme 5s
*   Realme 6i
*   Realme C3
*   Realme Narzo 10 / 10A

### GRUP 5: Keluarga A15 / Realme Seri C Baterai Besar
*   **OPPO A15** *(Rekomendasi Nama Utama)*
*   OPPO A15s
*   OPPO A16k
*   OPPO A16e
*   Realme C11 (2020)
*   Realme C12
*   Realme C15
*   Realme Narzo 20
*   Realme Narzo 50i

### GRUP 6: Keluarga Layar Punch-Hole Kiri (90Hz)
*   **OPPO A53 2020** *(Rekomendasi Nama Utama)*
*   OPPO A53s
*   OPPO A32
*   OPPO A33 (2020)
*   Realme 7i
*   Realme C17

### GRUP 7: Keluarga A17 & A57 Modern (Tipe Layar Baru)
*   **OPPO A57 (2022)** *(Rekomendasi Nama Utama)*
*   OPPO A57s
*   OPPO A17
*   OPPO A17k
*   OPPO A18
*   OPPO A38
*   OPPO A77 (4G)
*   OPPO A77s

### GRUP 8: Keluarga A52 / A92 (Punch-Hole Kiri)
*   **OPPO A92**
*   OPPO A52
*   OPPO A72

### GRUP 9: Keluarga AMOLED / In-Display Fingerprint
*Hati-hati: Ada kualitas OLED murni (Bisa sidik jari layar) dan ada kualitas INCELL (Sidik jari layar tidak berfungsi, lebih tebal).*
*   **OPPO A74 4G**
*   OPPO A95
*   OPPO F19
*   Realme 7 Pro
*   Realme 8 (4G)
*   Realme 8 Pro

### GRUP 10: Keluarga F Series Lama
*   **Grup F7:** OPPO F7 = Realme U1
*   **Grup F9:** OPPO F9 = Realme 2 Pro *(Terkadang kompatibel 100%, kadang frame Realme 2 Pro butuh sedikit papasan tergantung jenis LCD OEM yang dibeli)*
*   **Grup F11:** OPPO F11 = OPPO A9

---

## 🛠️ TIPS MENERAPKANNYA DI SERVICEPRO HP

Agar rapi, jangan memasukkan semua nama di atas ke dalam tabel Gudang / Stok. Lakukan langkah ini:

1. **Pilih 1 Nama Induk:** Misalnya untuk GRUP 1, sepakati bersama teknisi bahwa nama induknya adalah **`LCD OPPO A3S`**. Masukkan nama ini saja saat menginput/belanja part ke dalam tabel `STOK_PART`.
2. **Isi Menu Persamaan:** Buka menu **Master Data** -> **Persamaan Part**. 
3. Tambahkan aturan baru: 
   * `LCD REALME C1` = `LCD OPPO A3S`
   * `LCD REALME 2` = `LCD OPPO A3S`
   * `LCD OPPO A5` = `LCD OPPO A3S`
4. **Hasilnya:** Ketika kasir mengetik "Realme C1" di menu Transaksi Servis, sistem ServicePro akan langsung mencarikan harga dan memotong stok milik "Oppo A3s". Kasir tidak akan pernah salah potong!

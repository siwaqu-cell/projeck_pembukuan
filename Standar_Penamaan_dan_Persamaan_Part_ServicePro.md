# 📖 STANDAR PENAMAAN & DAFTAR PERSAMAAN PART HP
*Dokumen ini adalah referensi (kamus) bagi Owner dan Admin Gudang untuk membakukan cara pengetikan nama barang di aplikasi ServicePro HP, guna mencegah duplikasi nama dan memudahkan pelacakan stok.*

---

## ATURAN BAKU PENAMAAN BARANG (SOP GUDANG)
Agar fitur pencarian (Search) di aplikasi kasir berjalan cepat dan mulus, Admin Gudang **WAJIB** mengikuti format pengetikan nama barang berikut ini saat melakukan *Tambah Part* atau *Import Stok*:

**`[KATEGORI] [MERK] [TIPE HP] [KETERANGAN TAMBAHAN/WARNA/KUALITAS]`**

*   **Contoh Benar:** `LCD OPPO A3S ORI OGS HITAM`
*   **Contoh Salah:** `Lcd a3s item`, `layar oppo A3S`, `Opo a3s lcd`

### Kategori Part Baku (Jangan disingkat):
1.  **LCD** (Layar sentuh + Tampilan)
2.  **BATERAI**
3.  **FLEXIBLE** (Fleksibel On/Off, Volume, Mainboard)
4.  **KONEKTOR** (Konektor Cas/Papan Cas/Board UI)
5.  **BACKDOOR** (Tutup Belakang)
6.  **KACA KAMERA**
7.  **IC** (IC Power, IC EMMC, IC CPU, IC PA)
8.  **SPEAKER** (Buzzer/Earpiece)
9.  **KAMERA** (Kamera Depan/Belakang)
10. **SIM TRAY** (Tempat Kartu)

---

## 📋 DAFTAR KUMPULAN PART & PERSAMAAN (ALIAS) POPULER
Berikut adalah daftar beberapa merk, tipe, dan komponen yang **memiliki fisik sama persis (bisa saling pasang)**. Daftarkan "Persamaan (Alias)" ini di menu Master Data agar teknisi bebas memakai barang subsidi silang tanpa merusak akuntansi stok.

### 🟢 1. KELOMPOK OPPO & REALME (Paling sering sama)

**Kategori: LCD (Layar)**
*   **Keluarga A3s:** `LCD OPPO A3S` = `LCD REALME C1` = `LCD REALME 2`
*   **Keluarga A1k:** `LCD OPPO A1K` = `LCD REALME C2`
*   **Keluarga F7:** `LCD OPPO F7` = `LCD REALME U1`
*   **Keluarga F9:** `LCD OPPO F9` = `LCD REALME 2 PRO` = `LCD REALME U1` *(Terkadang kompatibel tergantung frame)*
*   **Keluarga A5s:** `LCD OPPO A5S` = `LCD OPPO A7` = `LCD OPPO A12` = `LCD REALME 3`
*   **Keluarga A15:** `LCD OPPO A15` = `LCD OPPO A15S`
*   **Keluarga A5 2020:** `LCD OPPO A5 2020` = `LCD OPPO A9 2020`

**Kategori: BATERAI**
*   **Kode BLP673:** `BATERAI OPPO A3S` = `BATERAI OPPO A5S` = `BATERAI REALME C1` = `BATERAI REALME 2`
*   **Kode BLP729:** `BATERAI REALME 5` = `BATERAI REALME 5I` = `BATERAI REALME C3`
*   **Kode BLP771:** `BATERAI REALME 6I` = `BATERAI REALME C11` = `BATERAI REALME C15`

---

### 🔵 2. KELOMPOK VIVO

**Kategori: LCD (Layar)**
*   **Keluarga Y91:** `LCD VIVO Y91` = `LCD VIVO Y93` = `LCD VIVO Y95`
*   **Keluarga Y12:** `LCD VIVO Y12` = `LCD VIVO Y15` = `LCD VIVO Y17`
*   **Keluarga Y20:** `LCD VIVO Y20` = `LCD VIVO Y20S` = `LCD VIVO Y12S`
*   **Keluarga Y91C:** `LCD VIVO Y91C` = `LCD VIVO Y1S`

**Kategori: BATERAI**
*   **Kode B-E8:** `BATERAI VIVO Y91` = `BATERAI VIVO Y93` = `BATERAI VIVO Y95`
*   **Kode B-G2:** `BATERAI VIVO Y12` = `BATERAI VIVO Y15` = `BATERAI VIVO Y17`

---

### 🟠 3. KELOMPOK XIAOMI (REDMI / POCO)

**Kategori: LCD (Layar)**
*   **Keluarga 4X:** `LCD REDMI 4X` (Tidak ada persamaan khusus, tapi sangat umum)
*   **Keluarga Note 4:** `LCD REDMI NOTE 4` = `LCD REDMI NOTE 4X` *(Catatan: Snapdragon vs Mediatek beda posisi soket/frame, harus hati-hati)*
*   **Keluarga 5A:** `LCD REDMI 5A`
*   **Keluarga Note 5:** `LCD REDMI NOTE 5 PRO` = `LCD REDMI NOTE 5 AI`
*   **Keluarga Note 8:** `LCD REDMI NOTE 8` = `LCD REDMI NOTE 8T`
*   **Keluarga Note 9:** `LCD REDMI NOTE 9` = `LCD REDMI 10X (4G)`
*   **Keluarga Poco:** `LCD POCO X3` = `LCD POCO X3 PRO` = `LCD POCO X3 NFC`

**Kategori: BATERAI**
*   **Kode BN43:** `BATERAI REDMI NOTE 4X (Snapdragon)`
*   **Kode BN45:** `BATERAI REDMI NOTE 5 PRO`
*   **Kode BM4J:** `BATERAI REDMI NOTE 8 PRO`
*   **Kode BN57:** `BATERAI POCO X3 NFC`

---

### 🍏 4. KELOMPOK APPLE (IPHONE)
*(Catatan: Layar iPhone jarang memiliki persamaan lintas seri, namun sering dipisahkan berdasarkan kualitas: ORI COPOTAN, ORI TIANMA, GX OLED, INCELL).*

**Kategori: BATERAI**
*   Seri iPhone sama sekali tidak bisa saling silang. Harus diinput persis: `BATERAI IPHONE 7`, `BATERAI IPHONE 7 PLUS`, `BATERAI IPHONE X`.
*   *(Keterangan Kualitas)* Tambahkan suffix kualitas, misal: `BATERAI IPHONE 7 VIZZ`, `BATERAI IPHONE 7 HIPPO`, `BATERAI IPHONE 7 ORI OEM`.

---

### 🟣 5. KELOMPOK INFINIX / TECNO / ITEL (Transsion Holdings)
Kelompok ini sangat sering berbagi suku cadang karena satu induk pabrik.

**Kategori: LCD (Layar)**
*   **Keluarga Hot 9 Play:** `LCD INFINIX HOT 9 PLAY` = `LCD INFINIX HOT 10 PLAY`
*   **Keluarga Hot 10:** `LCD INFINIX HOT 10` = `LCD INFINIX HOT 10S`
*   **Keluarga Smart 5:** `LCD INFINIX SMART 5` = `LCD TECNO SPARK 6 GO`

---

## TIPS KHUSUS UNTUK ADMIN GUDANG

1.  **Daftarkan Nama Utama (Primary Name):** 
    Pilih satu nama yang paling terkenal sebagai nama utama di Gudang. Misalnya, "Oppo A3s" lebih populer daripada "Realme C1". Maka catat di gudang: `LCD OPPO A3S`. Lalu daftarkan "Realme C1" dan "Realme 2" di kolom "Alias" pada Menu Master Data.
2.  **Bedakan Resolusi & Konektor (Peringatan):** 
    Beberapa HP bentuknya sama, tapi beda versi (contoh: *Xiaomi Redmi Note 4 Mediatek* vs *Snapdragon*). Jangan disamakan aliasnya karena teknisi tidak akan bisa merakitnya (konektor berbeda).
3.  **Kategori UNIVERSAL:** 
    Untuk barang seperti "Timah", "Lem T7000", atau "Anti Gores Universal", buat nama merknya `UNIVERSAL` agar mudah dicari (Contoh: `LEM UNIVERSAL T7000 15ML`).

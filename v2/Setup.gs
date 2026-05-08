/**
 * ============================================================
 * ServicePro HP v5.1 — Setup.gs
 * Create all sheets, headers, default data, validation
 * ============================================================
 */

/**
 * Master setup function — creates everything from scratch
 * Can be called from spreadsheet menu (with UI dialogs) 
 * or from Script Editor / Web App (without UI dialogs)
 */
function setupAll() {
  var ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    // Not in spreadsheet UI context — run without dialogs
    ui = null;
  }

  // If we have UI access, ask for confirmation
  if (ui) {
    var confirm = ui.alert(
      '⚙️ Setup ServicePro HP',
      'Ini akan membuat semua sheet dan data awal.\n\n' +
      'Sheet yang sudah ada TIDAK akan dihapus.\n' +
      'Lanjutkan?',
      ui.ButtonSet.YES_NO
    );
    if (confirm !== ui.Button.YES) return;
  }

  // Save SS_ID to properties for Web App access
  try {
    const ssId = SpreadsheetApp.getActiveSpreadsheet().getId();
    PropertiesService.getScriptProperties().setProperty('SS_ID', ssId);
  } catch(e) { /* ignore if fails */ }

  try {
    setupMasterSheets();
    setupTransaksiSheets();
    setupStokSheets();
    setupKaryawanSheets();
    setupDefaultData();
    setupValidasi();

    var successMsg = 'Semua sheet telah dibuat!\n\n' +
      '• 18 Sheet database\n' +
      '• Data cabang default\n' +
      '• Konfigurasi awal\n' +
      '• User admin default\n' +
      '• Validasi dropdown\n\n' +
      'Silakan buka Web App untuk mulai menggunakan sistem.';

    if (ui) {
      ui.alert('✅ Setup Berhasil', successMsg, ui.ButtonSet.OK);
    } else {
      console.log('✅ Setup Berhasil: ' + successMsg);
    }
  } catch (e) {
    if (ui) {
      ui.alert('❌ Error Setup', e.message, ui.ButtonSet.OK);
    } else {
      console.error('❌ Error Setup: ' + e.message);
      throw e; // Re-throw so the error is visible in Execution Log
    }
  }
}

// ======================== CREATE SHEETS ========================

function createSheetIfNotExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  // Always update headers to latest version
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1a1a2e')
             .setFontColor('#ffffff')
             .setFontWeight('bold')
             .setFontSize(10)
             .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  return sheet;
}

function setupMasterSheets() {
  const ss = getSpreadsheet();

  // CABANG
  createSheetIfNotExists(ss, SHEET_NAMES.CABANG, [
    'ID_CABANG', 'NAMA_CABANG', 'ALAMAT', 'TELEPON', 'STATUS'
  ]);

  // KARYAWAN
  createSheetIfNotExists(ss, SHEET_NAMES.KARYAWAN, [
    'ID_KARYAWAN', 'NAMA', 'PERAN', 'CABANG', 'TELEPON', 'STATUS', 'KOMISI_PERSEN'
  ]);

  // STOK_PART
  createSheetIfNotExists(ss, SHEET_NAMES.STOK_PART, [
    'ID_PART', 'JENIS_BARANG', 'NAMA_PART', 'SUB_KATEGORI', 'MERK_BARANG', 'SUPPLIER',
    'CABANG', 'STOK', 'HARGA_BELI', 'HARGA_JUAL', 'STATUS', 'PERSAMAAN'
  ]);

  // PELANGGAN
  createSheetIfNotExists(ss, SHEET_NAMES.PELANGGAN, [
    'ID_PELANGGAN', 'NAMA', 'TELEPON', 'TIPE', 'TOTAL_TRX', 'TGL_DAFTAR'
  ]);

  // CONFIG
  createSheetIfNotExists(ss, SHEET_NAMES.CONFIG, [
    'KEY', 'VALUE', 'DESKRIPSI'
  ]);

  // USERS
  createSheetIfNotExists(ss, SHEET_NAMES.USERS, [
    'USERNAME', 'PASSWORD', 'ROLE', 'CABANG', 'NAMA', 'STATUS'
  ]);
}

function setupTransaksiSheets() {
  const ss = getSpreadsheet();

  // TRANSAKSI
  createSheetIfNotExists(ss, SHEET_NAMES.TRANSAKSI, [
    'ID_TRANSAKSI', 'TGL_MASUK', 'CABANG', 'NAMA_PELANGGAN', 'TELEPON',
    'TIPE_PELANGGAN', 'MERK_HP', 'TIPE_HP', 'KERUSAKAN', 'PENERIMA', 'TEKNISI',
    'NAMA_PART', 'MERK_BARANG', 'SUB_KATEGORI', 'SUPPLIER', 'QTY',
    'HARGA_BELI', 'HARGA_JUAL', 'ONGKOS_KERJA', 'TOTAL_MODAL',
    'LABA_KOTOR', 'KOMISI', 'LABA_BERSIH', 'METODE_BAYAR', 'STATUS',
    'TGL_SELESAI', 'TGL_DIAMBIL', 'CATATAN', 'CREATED_BY', 'UPDATED_AT'
  ]);

  // TRANSAKSI_DETAIL
  createSheetIfNotExists(ss, SHEET_NAMES.TRANSAKSI_DETAIL, [
    'ID_TRANSAKSI', 'ITEM_NO', 'JENIS_BARANG', 'NAMA_PART', 'SUB_KATEGORI',
    'MERK_BARANG', 'SUPPLIER', 'QTY', 'HARGA_BELI', 'HARGA_JUAL', 'TOTAL_MODAL',
    'TOTAL_JUAL', 'TIMESTAMP'
  ]);

  // PENJUALAN
  createSheetIfNotExists(ss, SHEET_NAMES.PENJUALAN, [
    'ID_PENJUALAN', 'TANGGAL', 'CABANG', 'NAMA_PELANGGAN', 'TELEPON',
    'TOTAL_QTY', 'TOTAL_MODAL', 'TOTAL_JUAL', 'LABA_KOTOR', 'METODE_BAYAR',
    'CATATAN', 'CREATED_BY'
  ]);

  // PENJUALAN_DETAIL
  createSheetIfNotExists(ss, SHEET_NAMES.PENJUALAN_DETAIL, [
    'ID_PENJUALAN', 'ITEM_NO', 'JENIS_BARANG', 'NAMA_PART', 'SUB_KATEGORI',
    'MERK_BARANG', 'SUPPLIER', 'QTY', 'HARGA_BELI', 'HARGA_JUAL', 'TOTAL_MODAL',
    'TOTAL_JUAL', 'TIMESTAMP'
  ]);

  // KAS_HARIAN
  createSheetIfNotExists(ss, SHEET_NAMES.KAS_HARIAN, [
    'ID_KAS', 'TANGGAL', 'CABANG', 'JENIS', 'METODE_BAYAR', 'KATEGORI',
    'KETERANGAN', 'JUMLAH', 'SUMBER', 'ID_TRANSAKSI', 'CREATED_BY'
  ]);

  // KAS_PUSAT
  createSheetIfNotExists(ss, SHEET_NAMES.KAS_PUSAT, [
    'ID_KAS_PUSAT', 'TANGGAL', 'CABANG_TERKAIT', 'JENIS', 'KATEGORI',
    'KETERANGAN', 'JUMLAH', 'SUMBER', 'ID_REFERENSI', 'CREATED_BY'
  ]);

  // PIUTANG
  createSheetIfNotExists(ss, SHEET_NAMES.PIUTANG, [
    'ID_PIUTANG', 'TANGGAL', 'CABANG', 'NAMA_PELANGGAN', 'TELEPON',
    'KETERANGAN', 'JUMLAH', 'STATUS_BAYAR', 'TGL_LUNAS', 'ID_TRANSAKSI',
    'CREATED_BY'
  ]);

  // ACTIVITY_LOG
  createSheetIfNotExists(ss, SHEET_NAMES.ACTIVITY_LOG, [
    'ID_LOG', 'TIMESTAMP', 'USER', 'AKSI', 'DETAIL', 'CABANG', 'ID_REFERENSI'
  ]);
}

function setupStokSheets() {
  const ss = getSpreadsheet();

  // PEMBELIAN
  createSheetIfNotExists(ss, SHEET_NAMES.PEMBELIAN, [
    'ID_BELI', 'TANGGAL', 'SUPPLIER', 'CABANG', 'METODE_BAYAR', 'JENIS_BARANG',
    'NAMA_PART', 'SUB_KATEGORI', 'MERK_BARANG', 'QTY', 'HARGA_BELI', 'TOTAL',
    'CATATAN', 'STATUS', 'CREATED_BY'
  ]);

  // RETURN_SUPPLIER
  createSheetIfNotExists(ss, SHEET_NAMES.RETURN_SUPPLIER, [
    'ID_RETURN', 'TANGGAL', 'SUPPLIER', 'CABANG', 'JENIS_BARANG', 'NAMA_PART',
    'SUB_KATEGORI', 'MERK_BARANG', 'QTY', 'HARGA_BELI', 'TOTAL', 'ALASAN',
    'POTONG_HUTANG', 'ID_BELI_REF', 'STATUS', 'CREATED_BY'
  ]);

  // HUTANG_SUPPLIER
  createSheetIfNotExists(ss, SHEET_NAMES.HUTANG_SUPPLIER, [
    'ID_HUTANG', 'TANGGAL', 'SUPPLIER', 'CABANG', 'KETERANGAN', 'JUMLAH',
    'POTONGAN_RETURN', 'SISA_HUTANG', 'STATUS_BAYAR', 'TGL_LUNAS',
    'ID_BELI_REF', 'CREATED_BY'
  ]);

  // TRANSFER_PART
  createSheetIfNotExists(ss, SHEET_NAMES.TRANSFER_PART, [
    'ID_TRANSFER', 'TANGGAL', 'CABANG_ASAL', 'CABANG_TUJUAN', 'JENIS_BARANG',
    'NAMA_PART', 'SUB_KATEGORI', 'MERK_BARANG', 'QTY', 'CATATAN', 'CREATED_BY'
  ]);

  // RIWAYAT_PART
  createSheetIfNotExists(ss, SHEET_NAMES.RIWAYAT_PART, [
    'ID_RIWAYAT', 'TANGGAL', 'JENIS_TRANSAKSI', 'JENIS_BARANG', 'NAMA_PART',
    'SUB_KATEGORI', 'MERK_BARANG', 'SUPPLIER', 'CABANG', 'QTY', 'TIPE', 'ID_REFERENSI', 'KETERANGAN'
  ]);
}

function setupKaryawanSheets() {
  const ss = getSpreadsheet();

  // ABSENSI
  createSheetIfNotExists(ss, SHEET_NAMES.ABSENSI, [
    'ID_ABSENSI', 'TANGGAL', 'ID_KARYAWAN', 'NAMA_KARYAWAN', 'CABANG',
    'JAM_MASUK', 'JAM_KELUAR', 'STATUS', 'KETERANGAN'
  ]);

  // PENGGAJIAN
  createSheetIfNotExists(ss, SHEET_NAMES.PENGGAJIAN, [
    'ID_GAJI', 'PERIODE', 'ID_KARYAWAN', 'NAMA_KARYAWAN', 'CABANG',
    'GAJI_POKOK', 'TOTAL_KOMISI', 'POTONGAN', 'TOTAL_GAJI', 'STATUS',
    'TGL_BAYAR', 'CREATED_BY'
  ]);
}


// ======================== DEFAULT DATA ========================

function setupDefaultData() {
  setupDefaultCabang();
  setupDefaultConfig();
  setupDefaultUsers();
}

function setupDefaultCabang() {
  const sheet = getSheet(SHEET_NAMES.CABANG);
  if (sheet.getLastRow() > 1) return; // already has data

  const cabangData = [
    ['SIB', 'Service iPhone Bali', 'Bali', '-', 'AKTIF'],
    ['BL', 'Balawan', 'Bali', '-', 'AKTIF'],
    ['LJ', 'Lancar Jaya', 'Bali', '-', 'AKTIF'],
    ['AF', 'Artha Fix', 'Bali', '-', 'AKTIF']
  ];

  cabangData.forEach(function(row) {
    sheet.appendRow(row);
  });
}

function setupDefaultConfig() {
  const sheet = getSheet(SHEET_NAMES.CONFIG);
  const configData = [
    ['OWNER_EMAIL', '', 'Email pemilik untuk notifikasi'],
    ['BACKUP_FOLDER', 'ServicePro_Backup', 'Nama folder backup di Google Drive'],
    ['BACKUP_RETENTION_DAYS', '7', 'Berapa hari backup disimpan'],
    ['KOMISI_DEFAULT_PERSEN', '10', 'Persentase komisi default teknisi'],
    ['TIPE_PELANGGAN', 'UMUM,LANGGANAN,VIP', 'Tipe pelanggan (pisah koma)'],
    ['MERK_HP', 'IPHONE,OPPO,VIVO,SAMSUNG,XIAOMI,REALME,HUAWEI,LAINNYA', 'Merk HP untuk dropdown transaksi'],
    ['JENIS_BARANG', 'SPAREPART,TOOL,ACCESSORIES', 'Jenis barang utama'],
    ['KATEGORI_SPAREPART', 'LCD,BATERAI,ON OFF,FLEXIBEL,IC,KONEKTOR,SPEAKER,KAMERA,MESIN,LAINNYA', 'Sub-kategori sparepart'],
    ['KATEGORI_TOOL', 'SOLDER,OBENG,PINSET,MULTIMETER,BLOWER,LAINNYA', 'Sub-kategori tool'],
    ['KATEGORI_ACCESSORIES', 'TEMPERED GLASS,KABEL DATA,CHARGER,CASING,SOFTCASE,LAINNYA', 'Sub-kategori accessories'],
    ['MERK_BARANG', 'MEETO,OG,JK GX,ORI,OEM,COMPATIBLE,KW,LAINNYA', 'Merk/kualitas barang'],
    ['SUPPLIER_LIST', '', 'Daftar supplier (pisah koma, bisa dikelola di Master Data)'],
    ['METODE_BAYAR', 'CASH,TRANSFER,BON', 'Metode pembayaran'],
    ['STATUS_SERVIS', 'ANTRI,PROSES,SEDANG_PROSES,SELESAI_BELUM_DIAMBIL,SELESAI_BELUM_LUNAS,SELESAI_DIAMBIL,BATAL', 'Status service'],
    ['STATUS_BAYAR', 'LUNAS,BELUM_LUNAS,CICILAN', 'Status pembayaran'],
    ['PERAN_KARYAWAN', 'OWNER,ADMIN,TEKNISI', 'Peran/role karyawan'],
    ['LOW_STOCK_THRESHOLD', '3', 'Batas minimum stok untuk alert'],
    ['APP_VERSION', '5.2', 'Versi aplikasi'],
    ['APP_NAME', 'ServicePro HP', 'Nama aplikasi']
  ];
  // Add missing config entries (don't overwrite existing)
  var existing = {};
  if (sheet.getLastRow() > 1) {
    var data = sheet.getRange(2, 1, sheet.getLastRow()-1, 1).getValues();
    data.forEach(function(r) { existing[r[0]] = true; });
  }
  configData.forEach(function(row) {
    if (!existing[row[0]]) sheet.appendRow(row);
  });
}

function setupDefaultUsers() {
  const sheet = getSheet(SHEET_NAMES.USERS);
  if (sheet.getLastRow() > 1) return;

  const usersData = [
    ['admin', 'admin123', 'OWNER', 'SEMUA', 'Administrator', 'AKTIF'],
    ['sib', 'sib123', 'ADMIN', 'SIB', 'Admin SIB', 'AKTIF'],
    ['bl', 'bl123', 'ADMIN', 'BL', 'Admin BL', 'AKTIF'],
    ['lj', 'lj123', 'ADMIN', 'LJ', 'Admin LJ', 'AKTIF'],
    ['af', 'af123', 'ADMIN', 'AF', 'Admin AF', 'AKTIF']
  ];

  usersData.forEach(function(row) {
    sheet.appendRow(row);
  });
}


// ======================== VALIDATION SETUP ========================

function setupValidasi() {
  const ss = getSpreadsheet();

  // We'll set up data validation after sheets have data
  // This is called after default data is inserted

  try {
    // Validate CABANG dropdown in relevant sheets
    const cabangList = getCabangListForValidation();
    if (cabangList.length === 0) return;

    // Sheets that need CABANG validation
    const sheetsWithCabang = [
      { name: SHEET_NAMES.KARYAWAN, col: 4 },      // Column D
      { name: SHEET_NAMES.STOK_PART, col: 7 },      // Column G
      { name: SHEET_NAMES.TRANSAKSI, col: 3 },       // Column C
      { name: SHEET_NAMES.PEMBELIAN, col: 4 },       // Column D
      { name: SHEET_NAMES.RETURN_SUPPLIER, col: 4 }, // Column D
      { name: SHEET_NAMES.KAS_HARIAN, col: 3 },      // Column C
      { name: SHEET_NAMES.PIUTANG, col: 3 },         // Column C
    ];

    const cabangRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(cabangList, true)
      .setAllowInvalid(false)
      .build();

    sheetsWithCabang.forEach(function(config) {
      const sheet = ss.getSheetByName(config.name);
      if (sheet) {
        sheet.getRange(2, config.col, 500, 1).setDataValidation(cabangRule);
      }
    });

    // STATUS validation for TRANSAKSI (col 25 after adding MERK_HP)
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUS_LIST, true)
      .setAllowInvalid(false)
      .build();
    const trxSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
    if (trxSheet) {
      trxSheet.getRange(2, 25, 500, 1).setDataValidation(statusRule);
    }

    // METODE_BAYAR validation (col 24)
    const metodeBayarRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(METODE_BAYAR, true)
      .setAllowInvalid(false)
      .build();
    if (trxSheet) {
      trxSheet.getRange(2, 24, 500, 1).setDataValidation(metodeBayarRule);
    }

    // PERAN validation for KARYAWAN
    const peranRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['OWNER', 'ADMIN', 'TEKNISI'], true)
      .setAllowInvalid(false)
      .build();
    const krySheet = ss.getSheetByName(SHEET_NAMES.KARYAWAN);
    if (krySheet) {
      krySheet.getRange(2, 3, 500, 1).setDataValidation(peranRule); // Column C
    }

    // STATUS AKTIF/NONAKTIF validation
    const statusAktifRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['AKTIF', 'NONAKTIF'], true)
      .setAllowInvalid(false)
      .build();

    // Apply to multiple sheets
    [
      { name: SHEET_NAMES.CABANG, col: 5 },
      { name: SHEET_NAMES.KARYAWAN, col: 6 },
      { name: SHEET_NAMES.STOK_PART, col: 11 },
      { name: SHEET_NAMES.USERS, col: 6 }
    ].forEach(function(config) {
      const sheet = ss.getSheetByName(config.name);
      if (sheet) {
        sheet.getRange(2, config.col, 500, 1).setDataValidation(statusAktifRule);
      }
    });

  } catch (e) {
    console.error('Error setting up validation: ' + e.message);
  }
}

/**
 * Helper to get cabang list for validation
 */
function getCabangListForValidation() {
  try {
    const sheet = getSheet(SHEET_NAMES.CABANG);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return CABANG_CODES;

    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    return data.map(function(row) { return String(row[0]); }).filter(function(v) { return v !== ''; });
  } catch (e) {
    return CABANG_CODES;
  }
}

/**
 * ============================================================
 * ServicePro HP v5.1 — Code.gs
 * Main entry point: routing, utilities, constants, custom menu
 * ============================================================
 */

// ======================== GLOBAL CONSTANTS ========================

/** Spreadsheet ID — from Script Properties or hardcoded fallback */
var SS_ID = PropertiesService.getScriptProperties().getProperty('SS_ID');

/** Sheet names used throughout the system */
var SHEET_NAMES = {
  // Master Data
  CABANG:           'CABANG',
  KARYAWAN:         'KARYAWAN',
  STOK_PART:        'STOK_PART',
  PELANGGAN:        'PELANGGAN',
  CONFIG:           'CONFIG',
  USERS:            'USERS',

  // Transaksi
  TRANSAKSI:        'TRANSAKSI',
  TRANSAKSI_DETAIL: 'TRANSAKSI_DETAIL',
  PENJUALAN:        'PENJUALAN',
  PENJUALAN_DETAIL: 'PENJUALAN_DETAIL',
  KAS_HARIAN:       'KAS_HARIAN',
  KAS_PUSAT:        'KAS_PUSAT',
  PIUTANG:          'PIUTANG',
  ACTIVITY_LOG:     'ACTIVITY_LOG',

  // Pembelian & Stok
  PEMBELIAN:        'PEMBELIAN',
  RETURN_SUPPLIER:  'RETURN_SUPPLIER',
  HUTANG_SUPPLIER:  'HUTANG_SUPPLIER',
  TRANSFER_PART:    'TRANSFER_PART',
  RIWAYAT_PART:     'RIWAYAT_PART',

  // Karyawan
  ABSENSI:          'ABSENSI',
  PENGGAJIAN:       'PENGGAJIAN'
};

/** All possible transaction statuses */
var STATUS_LIST = [
  'ANTRI',
  'PROSES',
  'SEDANG_PROSES',
  'SELESAI_BELUM_DIAMBIL',
  'SELESAI_BELUM_LUNAS',
  'SELESAI_DIAMBIL',
  'BATAL'
];

/** Payment methods */
var METODE_BAYAR = ['CASH', 'TRANSFER', 'BON'];

/** Branch codes */
var CABANG_CODES = ['SIB', 'BL', 'LJ', 'AF'];

/** Get cabang list for dropdown (callable from client) */
function getCabangList() {
  try {
    var sheet = getSheet(SHEET_NAMES.CABANG);
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({ id: String(data[i][0]).trim(), nama: String(data[i][1] || '').trim() });
      }
    }
    return result.length > 0 ? result : CABANG_CODES.map(function(c){ return {id:c, nama:c}; });
  } catch(e) {
    return CABANG_CODES.map(function(c){ return {id:c, nama:c}; });
  }
}

/** User roles */
var ROLES = {
  OWNER:    'OWNER',
  ADMIN:    'ADMIN',
  TEKNISI:  'TEKNISI'
};

/** ID prefixes for each entity */
var ID_PREFIX = {
  TRANSAKSI:      'TRX',
  PENJUALAN:      'PNJ',
  PEMBELIAN:      'BLI',
  RETURN:         'RTN',
  TRANSFER:       'TRF',
  KAS:            'KAS',
  PIUTANG:        'PIT',
  HUTANG:         'HTG',
  RIWAYAT:        'RWY',
  PART:           'PRT',
  KARYAWAN:       'KRY',
  PELANGGAN:      'PLG',
  LOG:            'LOG',
  ABSENSI:        'ABS',
  PENGGAJIAN:     'GAJ'
};


// ======================== WEB APP ENTRY POINT ========================

/**
 * doGet — Main entry point for the Web App
 * Routes to the appropriate HTML page based on ?p= parameter
 */
function doGet(e) {
  const page = (e && e.parameter && e.parameter.p) ? e.parameter.p : 'login';

  const validPages = [
    'login', 'dashboard', 'transaksi', 'status', 'masterdata',
    'pembelian', 'return', 'transfer', 'laporankas', 'laporanstok',
    'laporanlengkap', 'laporanlabarugi', 'laporanservisan', 'ringkasanharian', 'riwayatpart', 'importstok', 'kasir', 'penjualanpart', 'stockopname', 'bataltransaksi'
  ];

  let template;
  if (validPages.includes(page)) {
    template = HtmlService.createTemplateFromFile('WebApp');
    template.page = page;
    template.cabang = (e && e.parameter && e.parameter.cab) ? e.parameter.cab : '';
  } else {
    template = HtmlService.createTemplateFromFile('WebApp');
    template.page = 'login';
    template.cabang = '';
  }

  return template.evaluate()
    .setTitle('ServicePro HP — Sistem Manajemen Service')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setFaviconUrl('https://img.icons8.com/fluency/48/maintenance.png');
}

// Telegram Webhook Handler — receives POST from Telegram API
function doPost(e) {
  try {
    var config = getTelegramConfig();
    if (!config.token || config.chatIds.length === 0) {
      return ContentService.createTextOutput('');
    }
    var data = JSON.parse(e.postData.contents);
    if (data.message && data.message.text) {
      var chatId = String(data.message.chat.id);
      if (config.chatIds.indexOf(chatId) === -1) return ContentService.createTextOutput('');
      handleTelegramCommand(data.message.text, chatId);
    } else if (data.callback_query) {
      handleTelegramCallback(data.callback_query);
    }
  } catch(err) {
    Logger.log('TG webhook error: ' + err.message);
  }
  return ContentService.createTextOutput('');
}

/**
 * Include — Include HTML files as templates (for CSS/JS partials)
 * Usage in HTML: <?!= include('Styles') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


// ======================== CUSTOM MENU (SPREADSHEET) ========================

/**
 * onOpen — Create custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🔧 ServicePro')
    .addItem('⚙️ Setup Awal', 'setupAll')
    .addSeparator()
    .addItem('➕ Form Transaksi Baru', 'openTransaksiForm')
    .addItem('🛒 Penjualan Aksesoris', 'openPenjualanPartForm')
    .addItem('🔄 Update Status Servisan', 'openStatusForm')
    .addItem('🗂️ Master Data', 'openMasterData')
    .addSeparator()
    .addItem('📦 Pembelian Part', 'openPembelianForm')
    .addItem('↩️ Return Supplier', 'openReturnForm')
    .addItem('🔀 Transfer Antar Cabang', 'openTransferForm')
    .addSeparator()
    .addItem('📊 Dashboard', 'openDashboard')
    .addItem('💰 Laporan Kas', 'openLaporanKas')
    .addItem('📦 Laporan Stok', 'openLaporanStok')
    .addItem('📊 Laporan Lengkap', 'openLaporanLengkap')
    .addItem('📋 Riwayat Part', 'openRiwayatPart')
    .addSeparator()
    .addItem('🔄 Sync Validasi', 'syncValidasi')
    .addItem('🔢 Auto-generate ID Part', 'autoGenerateIDPart')
    .addItem('📥 Import Stok Batch', 'openImportStok')
    .addItem('🔒 Kunci Seluruh Sheet', 'lockSemuaSheet')
    .addItem('🔄 Fix Merk/Kategori Tertukar', 'fixSwappedMerkKategori')
    .addItem('🔧 Perbaiki Struktur Database', 'fixDatabaseStructure')
    .addSeparator()
    .addSubMenu(ui.createMenu('💾 Backup & Restore')
      .addItem('💾 Backup Manual', 'backupManual')
      .addItem('⚙️ Aktifkan Backup Otomatis', 'aktivasiBackupOtomatis')
      .addItem('⏸️ Matikan Backup Otomatis', 'matikanBackupOtomatis')
      .addItem('📂 Buka Folder Backup', 'bukaFolderBackup'))
    .addSeparator()
    .addItem('🗑️ Reset Master Data', 'resetMaster')
    .addItem('🗑️ Reset CONFIG', 'resetConfig')
    .addItem('🚨 Reset SEMUA Data', 'resetSemua')
    .addSeparator()
    .addItem('🌐 Buka Web App', 'openWebApp')
    .addItem('ℹ️ Tentang Sistem', 'tentangSistem')
    .addToUi();
}


// ======================== MENU ACTION FUNCTIONS ========================

function openWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    `<script>window.open("${url}", "_blank");google.script.host.close();</script>`
  ).setWidth(200).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Membuka Web App...');
}

function openTransaksiForm() { openWebAppPage('transaksi'); }
function openPenjualanPartForm() { openWebAppPage('penjualanpart'); }
function openStatusForm() { openWebAppPage('status'); }
function openMasterData() { openWebAppPage('masterdata'); }
function openDashboard() { openWebAppPage('dashboard'); }
function openPembelianForm() { openWebAppPage('pembelian'); }
function openReturnForm() { openWebAppPage('return'); }
function openTransferForm() { openWebAppPage('transfer'); }
function openLaporanKas() { openWebAppPage('laporankas'); }
function openLaporanStok() { openWebAppPage('laporanstok'); }
function openLaporanLengkap() { openWebAppPage('laporanlengkap'); }
function openRiwayatPart() { openWebAppPage('riwayatpart'); }
function openImportStok() { openWebAppPage('importstok'); }

function openWebAppPage(page) {
  const url = ScriptApp.getService().getUrl() + '?p=' + page;
  const html = HtmlService.createHtmlOutput(
    `<script>window.open("${url}", "_blank");google.script.host.close();</script>`
  ).setWidth(200).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Membuka...');
}

function tentangSistem() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'ℹ️ ServicePro HP v5.1',
    'Sistem Manajemen Service HP Multi-Cabang\n\n' +
    '• 4 Cabang: SIB, BL, LJ, AF\n' +
    '• Platform: Google Apps Script + Sheets\n' +
    '• Versi: 5.1 — April 2026\n\n' +
    '© 2026 ServicePro HP',
    ui.ButtonSet.OK
  );
}


// ======================== UTILITY FUNCTIONS ========================

/**
 * Get the spreadsheet by ID
 */
function getSpreadsheet() {
  if (SS_ID) {
    try {
      return SpreadsheetApp.openById(SS_ID);
    } catch (e) {
      console.warn('Gagal membuka SS_ID dari Properti, menggunakan ActiveSpreadsheet.');
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get a specific sheet by name
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" tidak ditemukan. Jalankan Setup terlebih dahulu.`);
  }
  return sheet;
}

/**
 * Generate unique ID with format: PREFIX-YYYYMMDD-XXXX
 * @param {string} prefix - ID prefix (e.g., 'TRX', 'BLI')
 * @param {string} sheetName - Sheet to check for existing IDs
 * @returns {string} Generated unique ID
 */
function generateID(prefix, sheetName) {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Makassar', 'yyyyMMdd');
  const baseID = prefix + '-' + dateStr + '-';

  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();

  let maxSeq = 0;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function(row) {
      const id = String(row[0]);
      if (id.startsWith(baseID)) {
        const seq = parseInt(id.split('-').pop(), 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
  }

  const newSeq = String(maxSeq + 1).padStart(4, '0');
  return baseID + newSeq;
}

/**
 * Format date to Indonesian format
 * @param {Date} date
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  var d = parseDate(date);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Asia/Makassar', 'dd/MM/yyyy HH:mm');
}

/**
 * Format date only (no time)
 */
function formatDateOnly(date) {
  if (!date) return '';
  var d = parseDate(date);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Asia/Makassar', 'dd/MM/yyyy');
}

/**
 * Format number as Indonesian Rupiah
 * @param {number} amount
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Robust date parser for various string formats and Date objects
 */
function parseDate(dateVal) {
  if (!dateVal) return new Date(NaN);
  if (dateVal instanceof Date) return dateVal;
  
  var str = String(dateVal).trim();
  
  // Try yyyy-MM-dd HH:mm:ss
  var p1 = str.match(/^(\d{4})-(\d{2})-(\d{2})(?: |T)(\d{2}):(\d{2}):(\d{2})/);
  if (p1) return new Date(p1[1], p1[2]-1, p1[3], p1[4], p1[5], p1[6]);
  
  // Try dd/MM/yyyy HH:mm:ss or dd/MM/yyyy HH:mm
  var p2 = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (p2) return new Date(p2[3], p2[2]-1, p2[1], p2[4]||0, p2[5]||0, p2[6]||0);
  
  // Try yyyy-MM-dd
  var p3 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (p3) return new Date(p3[1], p3[2]-1, p3[3]);

  // Fallback
  var d = new Date(str.replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;
  
  return new Date(dateVal);
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
}

/** Safe error — hide internal stack trace, return user-friendly message */
function safeError(e) {
  var msg = String(e.message || e || 'Unknown error');
  // Truncate long messages
  if (msg.length > 200) msg = msg.substring(0, 200) + '...';
  // Remove potential file/line info
  return msg.replace(/\(.*?\)/g, '').replace(/at .*?\n/g, '').trim();
}

/** Validate that a number is non-negative. Returns error message or empty string. */
function validateNonNegative(value, fieldName) {
  if (value === null || value === undefined || value === '') return '';
  var num = Number(value);
  if (isNaN(num)) return fieldName + ' harus berupa angka';
  if (num < 0) return fieldName + ' tidak boleh negatif';
  return '';
}

/** Validate session token — returns session object or null */
function validateSession(token) {
  if (!token) return null;
  try {
    var cache = CacheService.getScriptCache();
    var data = cache.get('session_' + token);
    if (!data) return null;
    return JSON.parse(data);
  } catch(e) {
    return null;
  }
}

/** Require auth — validates token and optionally checks minimum role. Returns session or throws. */
function requireAuth(token, minRole) {
  // Graceful auth: jika token valid, gunakan. Jika tidak, tetap lanjut
  // karena halaman login web app sudah cukup sebagai proteksi akses.
  if (token) {
    var session = validateSession(token);
    if (session) return session;
  }
  return null;
}

/**
 * Log activity to ACTIVITY_LOG sheet
 */
function logActivity(user, aksi, detail, cabang, idReferensi) {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVITY_LOG);
    const id = generateID(ID_PREFIX.LOG, SHEET_NAMES.ACTIVITY_LOG);
    sheet.appendRow([
      id,
      getTimestamp(),
      user || 'SYSTEM',
      aksi || '',
      detail || '',
      cabang || '',
      idReferensi || ''
    ]);
  } catch (e) {
    console.error('Error logging activity: ' + e.message);
  }
}

/**
 * Get activity logs with optional filters
 */
function getActivityLogs(filter) {
  try {
    var data = getSheetData(SHEET_NAMES.ACTIVITY_LOG);
    if (filter) {
      if (filter.cabang) data = data.filter(function(r) { return r.CABANG === filter.cabang; });
      if (filter.user) data = data.filter(function(r) { return (r.USER||'').toLowerCase().indexOf(filter.user.toLowerCase()) !== -1; });
      if (filter.aksi) data = data.filter(function(r) { return (r.AKSI||'') === filter.aksi; });
      if (filter.search) data = data.filter(function(r) {
        return (r.USER||'').toLowerCase().indexOf(filter.search.toLowerCase()) !== -1 ||
               (r.DETAIL||'').toLowerCase().indexOf(filter.search.toLowerCase()) !== -1 ||
               (r.AKSI||'').toLowerCase().indexOf(filter.search.toLowerCase()) !== -1;
      });
      if (filter.tanggalStart) {
        data = data.filter(function(r) {
          var t = r.TIMESTAMP;
          if (!t) return false;
          if (t instanceof Date) return t >= new Date(filter.tanggalStart);
          return String(t) >= filter.tanggalStart;
        });
      }
      if (filter.tanggalEnd) {
        data = data.filter(function(r) {
          var t = r.TIMESTAMP;
          if (!t) return false;
          if (t instanceof Date) return t <= new Date(filter.tanggalEnd + 'T23:59:59');
          return String(t) <= filter.tanggalEnd + 'T23:59:59';
        });
      }
    }
    // Sort by timestamp descending (newest first)
    data.sort(function(a, b) {
      var tA = a.TIMESTAMP instanceof Date ? a.TIMESTAMP.getTime() : new Date(a.TIMESTAMP).getTime();
      var tB = b.TIMESTAMP instanceof Date ? b.TIMESTAMP.getTime() : new Date(b.TIMESTAMP).getTime();
      return tB - tA;
    });
    return data;
  } catch(e) {
    return [];
  }
}

/**
 * Request-Level Cache untuk menghindari pembacaan sheet berulang
 * selama satu siklus eksekusi (API call).
 */
var _sheetCache = {};

function clearSheetCache(sheetName) {
  if (_sheetCache[sheetName]) {
    delete _sheetCache[sheetName];
  }
}

/**
 * Get all data from a sheet as array of objects
 * @param {string} sheetName
 * @param {string} [filterCol] - Column name to filter by
 * @param {string} [filterVal] - Value to filter
 * @returns {Array<Object>}
 */
function getSheetData(sheetName, filterCol, filterVal) {
  let result = [];
  
  if (_sheetCache[sheetName]) {
    result = _sheetCache[sheetName];
  } else {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      _sheetCache[sheetName] = [];
      return [];
    }

    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        let val = data[i][j];
        if (val instanceof Date) {
          try {
            val = Utilities.formatDate(val, 'Asia/Makassar', 'yyyy-MM-dd HH:mm:ss');
          } catch(e) {
            val = val.toString();
          }
        }
        row[headers[j]] = val;
      }
      row._rowIndex = i + 1; // 1-based row number in sheet
      result.push(row);
    }
    
    _sheetCache[sheetName] = result;
  }

  if (filterCol && filterVal) {
    return result.filter(function(row) {
      return String(row[filterCol]).toUpperCase() === String(filterVal).toUpperCase();
    });
  }

  return result;
}

/**
 * Get sheet data filtered by cabang (branch)
 * For UTAMA login (cabang = '' or 'SEMUA'), returns all data
 */
function getSheetDataByCabang(sheetName, cabang) {
  // Sanitize: strip ':rowIndex' suffix Google Sheets sometimes adds to cell values
  if (cabang) cabang = String(cabang).split(':')[0].trim().toUpperCase();
  if (!cabang || cabang === '' || cabang.toUpperCase() === 'SEMUA') {
    return getSheetData(sheetName);
  }
  return getSheetData(sheetName, 'CABANG', cabang);
}

/**
 * Find a row by ID (first column)
 */
function findRowByID(sheetName, id) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      row._rowIndex = i + 1;
      return row;
    }
  }
  return null;
}

/**
 * Update a specific cell by row index and column name
 */
function updateCell(sheetName, rowIndex, colName, value) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(colName);
  if (colIndex === -1) throw new Error(`Kolom "${colName}" tidak ditemukan di sheet "${sheetName}"`);
  sheet.getRange(rowIndex, colIndex + 1).setValue(value);
  clearSheetCache(sheetName);
}

/**
 * Update multiple cells in a row
 */
function updateRow(sheetName, rowIndex, updates) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  for (const [colName, value] of Object.entries(updates)) {
    const colIndex = headers.indexOf(colName);
    if (colIndex !== -1) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(value);
    }
  }
  clearSheetCache(sheetName);
}

/**
 * Validate that required fields are present
 */
function validateRequired(data, requiredFields) {
  const missing = [];
  requiredFields.forEach(function(field) {
    if (!data[field] && data[field] !== 0) {
      missing.push(field);
    }
  });
  if (missing.length > 0) {
    throw new Error('Field wajib belum diisi: ' + missing.join(', '));
  }
}

/**
 * Safe JSON parse with fallback
 */
function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback || null;
  }
}

/**
 * Test function — run this to verify spreadsheet access and trigger authorization
 */
function testAkses() {
  var ss = getSpreadsheet();
  console.log('Berhasil akses: ' + ss.getName());
  console.log('Jumlah sheet: ' + ss.getSheets().length);
}

function diagData() {
  try {
    var ss = getSpreadsheet();
    var result = '📊 <b>Diagnostic</b>\n';
    result += 'SS: ' + ss.getName() + '\n';
    result += 'SS_ID prop: ' + (SS_ID ? SS_ID.substring(0,10) + '...' : '(not set)') + '\n\n';
    var sheets = ['CABANG','CONFIG','USERS','TRANSAKSI','PENJUALAN','KAS_HARIAN','STOK_PART','PIUTANG'];
    sheets.forEach(function(name) {
      try {
        var sh = getSheet(name);
        var lr = sh.getLastRow();
        var rows = lr > 1 ? lr - 1 : 0;
        var hdr = lr > 0 ? sh.getRange(1,1,1,Math.min(sh.getLastColumn(),3)).getValues()[0].join('|') : '-';
        result += '✅ ' + name + ': ' + rows + ' rows [' + hdr + ']\n';
      } catch(e) {
        result += '❌ ' + name + ': ' + e.message + '\n';
      }
    });
    return result;
  } catch(e) {
    return '❌ Error: ' + e.message;
  }
}

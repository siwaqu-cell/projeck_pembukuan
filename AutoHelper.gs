/**
 * ============================================================
 * ServicePro HP v5.1 — AutoHelper.gs
 * Auto-generate IDs, sync validation, batch import
 * ============================================================
 */

function autoGenerateIDPart() {
  var sh = getSheet(SHEET_NAMES.STOK_PART);
  var lr = sh.getLastRow();
  if (lr < 2) { 
    try { SpreadsheetApp.getUi().alert('Tidak ada data part'); } catch(e) {}
    return; 
  }

  var data = sh.getRange(2, 1, lr-1, 1).getValues();
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0] || String(data[i][0]).trim() === '') {
      var id = generateID(ID_PREFIX.PART, SHEET_NAMES.STOK_PART);
      sh.getRange(i+2, 1).setValue(id);
      count++;
    }
  }
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert('✅ '+count+' ID berhasil di-generate');
  }
  return count;
}

function syncValidasi() {
  try {
    setupValidasi();
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert('✅ Validasi dropdown berhasil di-sync');
    }
    return {success:true, message:'Validasi berhasil di-sync'};
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function importBatch(csvData, cabang, createdBy) {
  try {
    if (!csvData || csvData.length === 0) return {success:false, message:'Data CSV kosong'};

    var sh = getSheet(SHEET_NAMES.STOK_PART);
    var count = 0, errors = [];

    csvData.forEach(function(row, idx) {
      try {
        if (!row.nama) { errors.push('Baris '+(idx+1)+': Nama part kosong'); return; }
        
        var hBeli = Number(row.hargabeli || row.hargaBeli) || 0;
        var hJual = Number(row.hargajual || row.hargaJual) || 0;
        var stokQty = Number(row.stok) || 0;

        var id = generateID(ID_PREFIX.PART, SHEET_NAMES.STOK_PART);
        // Kolom sheet: ID_PART, JENIS_BARANG, NAMA_PART, SUB_KATEGORI, MERK_BARANG, SUPPLIER, CABANG, STOK, HARGA_BELI, HARGA_JUAL, STATUS
        sh.appendRow([id, row.jenis||'', row.nama, row.kategori||'', row.merk||'',
          row.supplier||'', cabang, stokQty, hBeli, hJual, 'AKTIF']);

        if (stokQty > 0) {
          catatRiwayatPart({
            jenisTransaksi: 'IMPORT', 
            jenisBarang: row.jenis || '',
            namaPart: row.nama, 
            subKategori: row.kategori || '',
            merkBarang: row.merk || '',
            supplier: row.supplier || '',
            cabang: cabang, 
            qty: stokQty, 
            tipe: 'MASUK', 
            idReferensi: id, 
            keterangan: 'Import Batch CSV',
            tanggal: row.tanggal || ''
          });
        }
        count++;
      } catch(e) { errors.push('Baris '+(idx+1)+': '+e.message); }
    });

    logActivity(createdBy||'','IMPORT','Import '+count+' part ke '+cabang,cabang,'');
    return {success:true, message:'Import berhasil: '+count+' item', errors:errors};
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function parseCSV(csvText) {
  if (!csvText) return [];
  var lines = csvText.split('\n');
  if (lines.length < 2) return [];

  var headers = lines[0].split(',').map(function(h){return h.trim().toLowerCase();});
  var result = [];

  for (var i = 1; i < lines.length; i++) {
    var vals = lines[i].split(',');
    if (vals.length < 2) continue;
    var row = {};
    headers.forEach(function(h, j) { row[h] = vals[j] ? vals[j].trim() : ''; });
    result.push(row);
  }
  return result;
}

/**
 * Perbaiki data STOK_PART yang MERK_BARANG dan SUB_KATEGORI-nya tertukar
 * akibat bug di versi lama importBatch.
 * Cara deteksi: nilai yang ada di kolom SUB_KATEGORI tapi cocok dengan
 * daftar merk umum (OG, OEM, Compatible, dll) → berarti terbalik.
 * Jalankan sekali dari menu atau Script Editor untuk fix data lama.
 */
function fixSwappedMerkKategori() {
  try {
    var sh = getSheet(SHEET_NAMES.STOK_PART);
    var data = sh.getDataRange().getValues();
    var headers = data[0];

    var colSubKat = headers.indexOf('SUB_KATEGORI');  // col index 3 (0-based)
    var colMerk   = headers.indexOf('MERK_BARANG');   // col index 4 (0-based)

    if (colSubKat === -1 || colMerk === -1) {
      throw new Error('Kolom SUB_KATEGORI atau MERK_BARANG tidak ditemukan di header sheet');
    }

    // Daftar nilai yang lazimnya ada di MERK_BARANG (bukan kategori)
    var merkKeywords = ['OG','OEM','KW','COMPATIBLE','ORIGINAL','MEETO','JK GX','ORI','PALAPA','LAINNYA'];
    // Daftar nilai yang lazimnya ada di SUB_KATEGORI (bukan merk)
    var katKeywords  = ['LCD','BATERAI','ON OFF','FLEXIBEL','IC','KONEKTOR','SPEAKER','KAMERA','MESIN',
                        'TEMPERED GLASS','KABEL DATA','CHARGER','CASING','SOFTCASE',
                        'SOLDER','OBENG','PINSET','MULTIMETER','BLOWER'];

    var fixedCount = 0;
    var batchUpdates = [];

    for (var i = 1; i < data.length; i++) {
      var subKat = String(data[i][colSubKat] || '').toUpperCase().trim();
      var merk   = String(data[i][colMerk]   || '').toUpperCase().trim();

      // Cek apakah nilai di SUB_KATEGORI seharusnya adalah merk (tanda terbalik)
      var subKatIsMerk = merkKeywords.some(function(m) { return subKat === m || subKat.indexOf(m) === 0; });
      var merkIsKat    = katKeywords.some(function(k) { return merk === k || merk.indexOf(k) === 0; });

      if (subKatIsMerk && merkIsKat) {
        // Tukar nilainya
        batchUpdates.push({ row: i + 1, newSubKat: data[i][colMerk], newMerk: data[i][colSubKat] });
        fixedCount++;
      }
    }

    // Apply fixes
    batchUpdates.forEach(function(upd) {
      sh.getRange(upd.row, colSubKat + 1).setValue(upd.newSubKat);
      sh.getRange(upd.row, colMerk + 1).setValue(upd.newMerk);
    });

    clearSheetCache(SHEET_NAMES.STOK_PART);

    var msg = '✅ Perbaikan selesai: ' + fixedCount + ' baris difix (merk & kategori ditukar kembali ke posisi yang benar).';
    console.log(msg);
    try { SpreadsheetApp.getUi().alert(msg); } catch(e) {}
    return { success: true, fixed: fixedCount, message: msg };
  } catch(e) {
    var errMsg = '❌ Error saat memperbaiki data: ' + e.message;
    console.error(errMsg);
    try { SpreadsheetApp.getUi().alert(errMsg); } catch(ex) {}
    return { success: false, message: errMsg };
  }
}

function lockSemuaSheet() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert('Konfirmasi Kunci Keamanan', 'Apakah Anda yakin ingin mengunci semua sheet agar tidak ada yang tidak sengaja mengetik manual?', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var count = 0;
    
    sheets.forEach(function(sheet) {
      // Hapus protection lama jika ada
      var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      for (var i = 0; i < protections.length; i++) {
        protections[i].remove();
      }
      
      // Buat perlindungan baru dengan peringatan
      var protection = sheet.protect().setDescription('Kunci Sistem ServicePro');
      protection.setWarningOnly(true);
      count++;
    });
    
    ui.alert('✅ Berhasil!\n\n' + count + ' Sheet telah dikunci. Sekarang jika Anda (atau siapa pun) tidak sengaja mencoba mengetik di kotak Google Sheets, sistem akan memunculkan pop-up peringatan untuk mencegah salah ketik.');
  } catch(e) {
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert('❌ Gagal mengunci: ' + e.message);
    }
  }
}

/**
 * Perbaiki struktur database dengan menambahkan kolom yang kurang secara diam-diam (tanpa UI).
 */
function fixDatabaseStructureSilent() {
  try {
    const ss = getSpreadsheet();
    const requiredColumns = [ { sheet: SHEET_NAMES.STOK_PART, columns: ['PERSAMAAN'] } ];
    requiredColumns.forEach(function(item) {
      const sheet = ss.getSheetByName(item.sheet);
      if (!sheet) return;
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) return;
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      
      item.columns.forEach(function(colName) {
        if (headers.indexOf(colName) === -1) {
          sheet.getRange(1, lastCol + 1).setValue(colName);
          sheet.getRange(1, lastCol + 1)
               .setBackground('#1a1a2e')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setFontSize(10)
               .setHorizontalAlignment('center');
          // Update the in-memory cache variable if it exists in the execution context
          Utilities.sleep(100); // Tunggu sebentar agar sheet terupdate
        }
      });
    });
  } catch(e) {}
}

/**
 * Perbaiki struktur database dengan menambahkan kolom yang kurang.
 * Fungsi ini aman karena tidak menghapus data, hanya menambah kolom di akhir header jika belum ada.
 */
function fixDatabaseStructure() {
  try {
    const ss = getSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    
    // Daftar sheet dan kolom wajib yang harus ada
    const requiredColumns = [
      { sheet: SHEET_NAMES.STOK_PART, columns: ['PERSAMAAN'] }
    ];
    
    let logs = [];
    let addedCount = 0;
    
    requiredColumns.forEach(function(item) {
      const sheet = ss.getSheetByName(item.sheet);
      if (!sheet) return;
      
      const lastCol = sheet.getLastColumn();
      if (lastCol === 0) return;
      
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      
      item.columns.forEach(function(colName) {
        if (headers.indexOf(colName) === -1) {
          // Kolom belum ada, tambahkan di akhir
          sheet.getRange(1, lastCol + 1).setValue(colName);
          // Beri styling header
          sheet.getRange(1, lastCol + 1)
               .setBackground('#1a1a2e')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setFontSize(10)
               .setHorizontalAlignment('center');
          
          logs.push('Sheet ' + item.sheet + ': Menambahkan kolom ' + colName);
          addedCount++;
        }
      });
    });
    
    if (addedCount === 0) {
      ui.alert('✅ Selesai', 'Struktur database sudah benar. Tidak ada kolom yang perlu ditambahkan.', ui.ButtonSet.OK);
    } else {
      ui.alert('✅ Perbaikan Selesai', 'Berhasil menambahkan ' + addedCount + ' kolom:\n\n' + logs.join('\n'), ui.ButtonSet.OK);
    }
    
    return { success: true, added: addedCount };
  } catch(e) {
    const errMsg = '❌ Gagal memperbaiki struktur: ' + e.message;
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
      SpreadsheetApp.getUi().alert(errMsg);
    }
    return { success: false, message: errMsg };
  }
}

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

function importBatch(csvData, cabang, createdBy, _token) {
  try {
    requireAuth(_token);
    if (!csvData || csvData.length === 0) return {success:false, message:'Data CSV kosong'};

    // === PRE-MERGE: Gabungkan baris CSV dengan kriteria identik ===
    // Kriteria: nama + jenis + kategori + merk + supplier
    var mergedCSV = [];
    var csvMap = {};
    csvData.forEach(function(row, idx) {
      if (!row.nama) return;
      var key = [
        String(row.nama).trim().toUpperCase(),
        String(row.jenis || '').trim().toUpperCase(),
        String(row.kategori || '').trim().toUpperCase(),
        String(row.merk || '').trim().toUpperCase(),
        String(row.supplier || '').trim().toUpperCase()
      ].join('|||');

      if (csvMap[key]) {
        // Gabungkan: tambah stok, pakai harga terakhir yang valid
        csvMap[key].stok = (Number(csvMap[key].stok) || 0) + (Number(row.stok) || 0);
        if (Number(row.hargabeli || row.hargaBeli) > 0) csvMap[key].hargaBeli = Number(row.hargabeli || row.hargaBeli);
        if (Number(row.hargajual || row.hargaJual) > 0) csvMap[key].hargaJual = Number(row.hargajual || row.hargaJual);
        csvMap[key]._sourceRows.push(idx + 1);
      } else {
        csvMap[key] = {
          nama: row.nama,
          jenis: row.jenis || '',
          kategori: row.kategori || '',
          merk: row.merk || '',
          supplier: row.supplier || '',
          stok: Number(row.stok) || 0,
          hargaBeli: Number(row.hargabeli || row.hargaBeli) || 0,
          hargaJual: Number(row.hargajual || row.hargaJual) || 0,
          tanggal: row.tanggal || '',
          _sourceRows: [idx + 1]
        };
      }
    });
    Object.keys(csvMap).forEach(function(k) { mergedCSV.push(csvMap[k]); });

    // === PROSES IMPORT (dengan data yang sudah di-merge) ===
    var sh = getSheet(SHEET_NAMES.STOK_PART);
    var allStok = getSheetDataByCabang(SHEET_NAMES.STOK_PART, cabang);
    var count = 0, merged = 0, csvPreMerged = csvData.length - mergedCSV.length, errors = [];

    mergedCSV.forEach(function(row) {
      try {
        var hBeli = row.hargaBeli;
        var hJual = row.hargaJual;
        var stokQty = row.stok;
        var namaTrim = row.nama.toUpperCase();
        var jenisTrim = (row.jenis || '').toUpperCase();
        var katTrim = (row.kategori || '').toUpperCase();
        var merkTrim = (row.merk || '').toUpperCase();
        var supTrim = (row.supplier || '').toUpperCase();

        // Cek apakah barang sudah ada (match by nama + jenis + kategori + merk + supplier + cabang)
        var existing = allStok.filter(function(s) {
          return String(s.NAMA_PART || '').trim().toUpperCase() === namaTrim &&
                 String(s.JENIS_BARANG || '').trim().toUpperCase() === jenisTrim &&
                 String(s.SUB_KATEGORI || '').trim().toUpperCase() === katTrim &&
                 String(s.MERK_BARANG || '').trim().toUpperCase() === merkTrim &&
                 String(s.SUPPLIER || '').trim().toUpperCase() === supTrim &&
                 s.STATUS === 'AKTIF';
        });

        if (existing.length > 0) {
          // Gabung — tambah stok ke baris yang sudah ada
          var ex = existing[0];
          var oldStok = Number(ex.STOK) || 0;
          var newStok = oldStok + stokQty;

          // Update harga jika ada nilai baru
          var updates = { STOK: newStok };
          if (hBeli > 0) updates.HARGA_BELI = hBeli;
          if (hJual > 0) updates.HARGA_JUAL = hJual;
          if (row.jenis) updates.JENIS_BARANG = row.jenis;
          if (row.kategori) updates.SUB_KATEGORI = row.kategori;
          if (row.merk) updates.MERK_BARANG = row.merk;
          if (row.supplier) updates.SUPPLIER = row.supplier;
          updateRow(SHEET_NAMES.STOK_PART, ex._rowIndex, updates);

          if (stokQty > 0) {
            catatRiwayatPart({
              jenisTransaksi: 'IMPORT',
              jenisBarang: row.jenis || ex.JENIS_BARANG || '',
              namaPart: row.nama,
              subKategori: row.kategori || ex.SUB_KATEGORI || '',
              merkBarang: row.merk || ex.MERK_BARANG || '',
              supplier: row.supplier || ex.SUPPLIER || '',
              cabang: cabang,
              qty: stokQty,
              tipe: 'MASUK',
              idReferensi: ex.ID_PART || '-',
              keterangan: 'Import Batch (digabung CSV baris ' + row._sourceRows.join(',') + ', stok ' + oldStok + ' → ' + newStok + ')',
              tanggal: row.tanggal || ''
            });
          }
          merged++;
        } else {
          // Barang baru — buat baris baru
          var id = generateID(ID_PREFIX.PART, SHEET_NAMES.STOK_PART);
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
              keterangan: 'Import Batch CSV (baru, baris ' + row._sourceRows.join(',') + ')',
              tanggal: row.tanggal || ''
            });
          }
        }
        count++;
      } catch(e) { errors.push('Baris '+(row._sourceRows ? row._sourceRows.join(',') : '?')+': '+e.message); }
    });

    SpreadsheetApp.flush();
    logActivity(createdBy||'','IMPORT','Import '+count+' part ke '+cabang+' (pre-merge CSV:'+csvPreMerged+', gabung stok:'+merged+', baru:'+(count-merged)+')',cabang,'');
    // Telegram notification
    try { sendTelegramNotif('IMPORT_STOK', {count:count, cabang:cabang}); } catch(e) {}
    return {success:true, message:'Import berhasil: '+count+' item ('+csvPreMerged+' baris CSV di-merge, '+merged+' digabung dengan stok lama, '+(count-merged)+' baru)', errors:errors};
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
 * Deduplikasi STOK_PART — Gabungkan baris duplikat yang punya kriteria identik.
 * Kriteria: NAMA_PART + JENIS_BARANG + SUB_KATEGORI + MERK_BARANG + SUPPLIER + CABANG
 * Baris pertama yang ditemukan akan dipertahankan, baris duplikat stoknya ditambahkan ke baris pertama.
 * Jalankan dari Script Editor: deduplicateStok() atau deduplicateStok('BL')
 */
function deduplicateStok(targetCabang) {
  try {
    var sh = getSheet(SHEET_NAMES.STOK_PART);
    var allData = sh.getDataRange().getValues();
    if (allData.length < 2) {
      console.log('Tidak ada data stok');
      return {success:true, message:'Tidak ada data stok', merged:0};
    }

    var headers = allData[0];
    var colIdx = {
      id: headers.indexOf('ID_PART'),
      jenis: headers.indexOf('JENIS_BARANG'),
      nama: headers.indexOf('NAMA_PART'),
      kat: headers.indexOf('SUB_KATEGORI'),
      merk: headers.indexOf('MERK_BARANG'),
      supplier: headers.indexOf('SUPPLIER'),
      cabang: headers.indexOf('CABANG'),
      stok: headers.indexOf('STOK'),
      hBeli: headers.indexOf('HARGA_BELI'),
      hJual: headers.indexOf('HARGA_JUAL'),
      status: headers.indexOf('STATUS'),
      persamaan: headers.indexOf('PERSAMAAN')
    };

    // Group by key: nama + jenis + kategori + merk + supplier + cabang
    var groups = {};
    for (var i = 1; i < allData.length; i++) {
      var row = allData[i];
      var cabVal = String(row[colIdx.cabang] || '').trim().toUpperCase();
      var namaVal = String(row[colIdx.nama] || '').trim().toUpperCase();
      if (!namaVal) continue; // skip empty rows

      // Filter cabang jika ditentukan
      if (targetCabang && cabVal !== targetCabang.toUpperCase()) continue;

      var key = [
        namaVal,
        String(row[colIdx.jenis] || '').trim().toUpperCase(),
        String(row[colIdx.kat] || '').trim().toUpperCase(),
        String(row[colIdx.merk] || '').trim().toUpperCase(),
        String(row[colIdx.supplier] || '').trim().toUpperCase(),
        cabVal
      ].join('|||');

      if (!groups[key]) {
        groups[key] = { keepRow: i, rows: [], totalStok: 0 };
      }
      groups[key].rows.push(i);
      groups[key].totalStok += (Number(row[colIdx.stok]) || 0);
    }

    // Find groups with duplicates (more than 1 row)
    var dupGroups = [];
    Object.keys(groups).forEach(function(k) {
      if (groups[k].rows.length > 1) dupGroups.push(groups[k]);
    });

    if (dupGroups.length === 0) {
      var msg = '✅ Tidak ada duplikat ditemukan' + (targetCabang ? ' di cabang ' + targetCabang : '') + '.';
      console.log(msg);
      try { SpreadsheetApp.getUi().alert(msg); } catch(e) {}
      return {success:true, message:msg, merged:0};
    }

    // Process: update keepRow stok, then delete duplicate rows (from bottom up)
    var totalMerged = 0;
    var rowsToDelete = [];

    dupGroups.forEach(function(group) {
      var keepIdx = group.keepRow;
      var currentStok = Number(allData[keepIdx][colIdx.stok]) || 0;

      // Update stok on keep row
      sh.getRange(keepIdx + 1, colIdx.stok + 1).setValue(group.totalStok);

      // Collect rows to delete (all except keepRow)
      for (var j = 1; j < group.rows.length; j++) {
        rowsToDelete.push(group.rows[j]);
      }
      totalMerged += (group.rows.length - 1);
    });

    // Delete rows from bottom to top to preserve row indices
    rowsToDelete.sort(function(a, b) { return b - a; });
    rowsToDelete.forEach(function(rowIdx) {
      sh.deleteRow(rowIdx + 1);
    });

    clearSheetCache(SHEET_NAMES.STOK_PART);

    var resultMsg = '✅ Deduplikasi selesai: ' + totalMerged + ' baris duplikat digabungkan (' + dupGroups.length + ' grup)' + (targetCabang ? ' di cabang ' + targetCabang : '') + '.';
    console.log(resultMsg);
    try { SpreadsheetApp.getUi().alert(resultMsg); } catch(e) {}
    return {success:true, message:resultMsg, merged:totalMerged, groups:dupGroups.length};
  } catch(e) {
    var errMsg = '❌ Error deduplikasi: ' + e.message;
    console.error(errMsg);
    try { SpreadsheetApp.getUi().alert(errMsg); } catch(ex) {}
    return {success:false, message:errMsg};
  }
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

/**
 * ============================================================
 * ServicePro HP v5.1 — MasterDataHelper.gs
 * CRUD for Cabang, Karyawan, Part, Config, Users
 * ============================================================
 */

// ======================== CABANG CRUD ========================
function saveCabang(data) {
  try {
    var sh = getSheet(SHEET_NAMES.CABANG);
    if (data.isEdit && data.rowIndex) {
      updateRow(SHEET_NAMES.CABANG, data.rowIndex, {
        NAMA_CABANG:data.nama, ALAMAT:data.alamat||'', TELEPON:data.telepon||'', STATUS:data.status||'AKTIF'
      });
      return {success:true, message:'Cabang berhasil diupdate'};
    }
    sh.appendRow([data.id, data.nama, data.alamat||'', data.telepon||'', 'AKTIF']);
    logActivity(data.createdBy,'TAMBAH_CABANG','Cabang baru: '+data.id,'',data.id);
    return {success:true, message:'Cabang berhasil ditambahkan'};
  } catch(e) { return {success:false, message:'Error: '+e.message}; }
}

function deleteCabang(id) {
  var row = findRowByID(SHEET_NAMES.CABANG, id);
  if (!row) return {success:false, message:'Cabang tidak ditemukan'};
  updateCell(SHEET_NAMES.CABANG, row._rowIndex, 'STATUS', 'NONAKTIF');
  return {success:true, message:'Cabang dinonaktifkan'};
}

function getCabangAll() { return getSheetData(SHEET_NAMES.CABANG); }

// ======================== KARYAWAN CRUD ========================
function saveKaryawan(data) {
  try {
    var sh = getSheet(SHEET_NAMES.KARYAWAN);
    if (data.isEdit && data.rowIndex) {
      updateRow(SHEET_NAMES.KARYAWAN, data.rowIndex, {
        NAMA:data.nama, PERAN:data.peran, CABANG:data.cabang, TELEPON:data.telepon||'',
        STATUS:data.status||'AKTIF', KOMISI_PERSEN:Number(data.komisi)||0
      });
      return {success:true, message:'Karyawan berhasil diupdate'};
    }
    var id = generateID(ID_PREFIX.KARYAWAN, SHEET_NAMES.KARYAWAN);
    sh.appendRow([id, data.nama, data.peran, data.cabang, data.telepon||'', 'AKTIF', Number(data.komisi)||0]);
    logActivity(data.createdBy,'TAMBAH_KARYAWAN','Karyawan baru: '+data.nama,data.cabang,id);
    return {success:true, id:id, message:'Karyawan berhasil ditambahkan'};
  } catch(e) { return {success:false, message:'Error: '+e.message}; }
}

function deleteKaryawan(id) {
  var row = findRowByID(SHEET_NAMES.KARYAWAN, id);
  if (!row) return {success:false, message:'Karyawan tidak ditemukan'};
  updateCell(SHEET_NAMES.KARYAWAN, row._rowIndex, 'STATUS', 'NONAKTIF');
  return {success:true, message:'Karyawan dinonaktifkan'};
}

function getKaryawanAll(cabang) { return getSheetDataByCabang(SHEET_NAMES.KARYAWAN, cabang); }

// ======================== STOK PART CRUD ========================
function savePart(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sh = getSheet(SHEET_NAMES.STOK_PART);
    if (data.isEdit && data.rowIndex) {
      // Cek stok lama untuk mendeteksi penyesuaian stok
      var oldPart = getSheetData(SHEET_NAMES.STOK_PART).filter(function(r){return r._rowIndex === data.rowIndex;})[0];
      var oldStok = oldPart ? Number(oldPart.STOK) || 0 : 0;
      var newStok = Number(data.stok) || 0;
      var selisih = newStok - oldStok;

      updateRow(SHEET_NAMES.STOK_PART, data.rowIndex, {
        JENIS_BARANG:data.jenisBarang||'', NAMA_PART:data.nama, SUB_KATEGORI:data.subKategori||'',
        MERK_BARANG:data.merkBarang||'', SUPPLIER:data.supplier||'', CABANG:data.cabang,
        STOK:newStok, HARGA_BELI:Number(data.hargaBeli)||0,
        HARGA_JUAL:Number(data.hargaJual)||0, STATUS:data.status||'AKTIF',
        PERSAMAAN: data.persamaan||''
      });

      // Jika ada perubahan stok, catat ke riwayat
      if (selisih !== 0 && oldPart) {
        catatRiwayatPart({
          jenisTransaksi: 'PENYESUAIAN_STOK',
          jenisBarang: data.jenisBarang||'', namaPart: data.nama, subKategori: data.subKategori||'',
          merkBarang: data.merkBarang||'', supplier: data.supplier || '', cabang: data.cabang,
          qty: Math.abs(selisih),
          tipe: selisih > 0 ? 'MASUK' : 'KELUAR',
          idReferensi: oldPart.ID_PART || '-',
          keterangan: 'Penyesuaian stok (Edit Part): ' + oldStok + ' -> ' + newStok
        });
      }

      lock.releaseLock();
      return {success:true, message:'Barang berhasil diupdate'};
    }
    var id = generateID(ID_PREFIX.PART, SHEET_NAMES.STOK_PART);
    sh.appendRow([id, data.jenisBarang||'', data.nama, data.subKategori||'', data.merkBarang||'',
      data.supplier||'', data.cabang, Number(data.stok)||0, Number(data.hargaBeli)||0,
      Number(data.hargaJual)||0, 'AKTIF', data.persamaan||'']);
    logActivity(data.createdBy,'TAMBAH_PART','Barang baru: '+data.nama,data.cabang,id);
    // Telegram notification
    try { sendTelegramNotif('TAMBAH_PART', {namaPart:data.nama, stok:data.stok, cabang:data.cabang}); } catch(e) {}
    lock.releaseLock();
    return {success:true, id:id, message:'Barang berhasil ditambahkan'};
  } catch(e) {
    if (lock) lock.releaseLock();
    return {success:false, message:'Error: '+e.message};
  }
}

/**
 * Import / update persamaan nama barang secara massal dari CSV.
 * Format CSV: baris pertama = header (NAMA_PART,PERSAMAAN), baris berikutnya = data.
 * Jika nama_part ditemukan, kolom PERSAMAAN-nya diupdate. Jika tidak ditemukan, dilewati.
 * @param {string} csvText - Teks CSV mentah
 * @returns {Object} {success, totalProses, totalUpdate, totalTidakDitemukan, message}
 */
function importPersamaanCSV(csvText) {
  try {
    // Pastikan struktur database (kolom PERSAMAAN) sudah ada secara otomatis (mode diam)
    fixDatabaseStructureSilent();

    if (!csvText) return {success:false, message:'Data CSV kosong'};
    // Menghapus BOM dan \r (Windows line endings)
    var cleanText = csvText.replace(/^\uFEFF/, '').trim();
    var lines = cleanText.replace(/\r/g, '').split('\n');
    if (lines.length < 2) return {success:false, message:'CSV harus memiliki header dan minimal 1 baris data'};

    // Parse header
    var headers = lines[0].split(',').map(function(h){ return h.trim().replace(/"/g,'').toUpperCase(); });
    var idxNama = headers.indexOf('NAMA_PART');
    var idxPer  = headers.indexOf('PERSAMAAN');
    if (idxNama < 0 || idxPer < 0) return {success:false, message:'Header CSV harus memiliki kolom NAMA_PART dan PERSAMAAN'};

    var allStok = getSheetData(SHEET_NAMES.STOK_PART);
    var totalUpdate = 0;
    var totalTidakDitemukan = 0;

    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].split(',').map(function(c){ return c.trim().replace(/^"|"$/g,''); });
      var namaPart = cols[idxNama];
      var persamaan = cols.slice(idxPer).join(',').replace(/^"|"$/g,'').trim();
      if (!namaPart) continue;

      var matches = allStok.filter(function(r){ return String(r.NAMA_PART).trim().toUpperCase() === namaPart.toUpperCase(); });
      if (matches.length === 0) {
        totalTidakDitemukan++;
      } else {
        matches.forEach(function(m) {
          updateCell(SHEET_NAMES.STOK_PART, m._rowIndex, 'PERSAMAAN', persamaan);
        });
        totalUpdate++;
      }
    }

    return {
      success: true,
      totalProses: lines.length - 1,
      totalUpdate: totalUpdate,
      totalTidakDitemukan: totalTidakDitemukan,
      message: 'Import selesai! ' + totalUpdate + ' barang diupdate. ' + totalTidakDitemukan + ' nama barang tidak ditemukan di database.'
    };
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function deletePart(id) {
  var row = findRowByID(SHEET_NAMES.STOK_PART, id);
  if (!row) return {success:false, message:'Part tidak ditemukan'};
  var oldStok = Number(row.STOK) || 0;
  updateCell(SHEET_NAMES.STOK_PART, row._rowIndex, 'STATUS', 'NONAKTIF');
  // Catat riwayat penghapusan
  catatRiwayatPart({
    jenisTransaksi: 'HAPUS_PART',
    jenisBarang: row.JENIS_BARANG || '',
    namaPart: row.NAMA_PART || '',
    subKategori: row.SUB_KATEGORI || '',
    merkBarang: row.MERK_BARANG || '',
    supplier: row.SUPPLIER || '',
    cabang: row.CABANG || '',
    qty: oldStok,
    tipe: 'HAPUS',
    idReferensi: id,
    keterangan: 'Part dihapus dari stok (sisa stok: ' + oldStok + ')'
  });
  // Telegram notification
  try { sendTelegramNotif('HAPUS_PART', {namaPart:row.NAMA_PART, cabang:row.CABANG}); } catch(e) {}
  return {success:true, message:'Part dinonaktifkan'};
}

function getPartAll(cabang) { return getSheetDataByCabang(SHEET_NAMES.STOK_PART, cabang); }

// ======================== CONFIG CRUD ========================
function saveConfig(key, value) {
  try {
    var data = getSheetData(SHEET_NAMES.CONFIG);
    var found = data.filter(function(r){return r.KEY===key;});
    if (found.length > 0) {
      updateCell(SHEET_NAMES.CONFIG, found[0]._rowIndex, 'VALUE', value);
    } else {
      getSheet(SHEET_NAMES.CONFIG).appendRow([key, value, '']);
    }
    return {success:true, message:'Config berhasil disimpan'};
  } catch(e) { return {success:false, message:'Error: '+e.message}; }
}

function getConfigAll() { return getSheetData(SHEET_NAMES.CONFIG); }

// ======================== USERS CRUD ========================
function saveUser(data) {
  try {
    var sh = getSheet(SHEET_NAMES.USERS);
    if (data.isEdit) {
      var users = getSheetData(SHEET_NAMES.USERS);
      var found = users.filter(function(u){return u.USERNAME===data.username;});
      if (found.length > 0) {
        var updates = {ROLE:data.role, CABANG:data.cabang, NAMA:data.nama, STATUS:data.status||'AKTIF'};
        if (data.password) updates.PASSWORD = hashPassword(data.password);
        updateRow(SHEET_NAMES.USERS, found[0]._rowIndex, updates);
        return {success:true, message:'User berhasil diupdate'};
      }
    }
    // Check duplicate username
    var existing = getSheetData(SHEET_NAMES.USERS).filter(function(u){return u.USERNAME===data.username;});
    if (existing.length > 0) return {success:false, message:'Username sudah digunakan'};
    
    sh.appendRow([data.username, hashPassword(data.password), data.role, data.cabang, data.nama, 'AKTIF']);
    // Telegram notification
    try { sendTelegramNotif('USER_BARU', {username:data.username, role:data.role, cabang:data.cabang}); } catch(e) {}
    return {success:true, message:'User berhasil ditambahkan'};
  } catch(e) { return {success:false, message:'Error: '+e.message}; }
}

function deleteUser(username) {
  var users = getSheetData(SHEET_NAMES.USERS);
  var found = users.filter(function(u){return u.USERNAME===username;});
  if (found.length === 0) return {success:false, message:'User tidak ditemukan'};
  updateCell(SHEET_NAMES.USERS, found[0]._rowIndex, 'STATUS', 'NONAKTIF');
  return {success:true, message:'User dinonaktifkan'};
}

function getUsersAll() {
  return getSheetData(SHEET_NAMES.USERS).map(function(u){
    return {username:u.USERNAME, role:u.ROLE, cabang:u.CABANG, nama:u.NAMA, status:u.STATUS};
  });
}

// ======================== PELANGGAN ========================
function getPelangganAll(cabang) { return getSheetData(SHEET_NAMES.PELANGGAN); }

function savePelanggan(data) {
  try {
    if (data.isEdit && data.rowIndex) {
      updateRow(SHEET_NAMES.PELANGGAN, data.rowIndex, {
        NAMA:data.nama, TELEPON:data.telepon||'', TIPE:data.tipe||'UMUM'
      });
      return {success:true, message:'Pelanggan berhasil diupdate'};
    }
    var id = generateID(ID_PREFIX.PELANGGAN, SHEET_NAMES.PELANGGAN);
    getSheet(SHEET_NAMES.PELANGGAN).appendRow([id, data.nama, data.telepon||'', data.tipe||'UMUM', 0, getTimestamp()]);
    return {success:true, id:id, message:'Pelanggan berhasil ditambahkan'};
  } catch(e) { return {success:false, message:'Error: '+e.message}; }
}

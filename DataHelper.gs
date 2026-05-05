/**
 * ============================================================
 * ServicePro HP v5.1 — DataHelper.gs
 * Dropdown cascading, autocomplete, data fetching utilities
 * ============================================================
 */

// ======================== CABANG DATA ========================

/**
 * Get list of all active branches
 * @returns {Array<Object>} [{id, nama, alamat, telepon}]
 */
function getCabangList() {
  const data = getSheetData(SHEET_NAMES.CABANG, 'STATUS', 'AKTIF');
  return data.map(function(row) {
    // Sanitize ID — strip ':rowIndex' suffix that Sheets sometimes appends
    var rawId = String(row.ID_CABANG || '').split(':')[0].trim().toUpperCase();
    return {
      id: rawId,
      nama: row.NAMA_CABANG,
      alamat: row.ALAMAT,
      telepon: row.TELEPON
    };
  }).filter(function(c) { return c.id; }); // remove empty entries
}

function getBranchLogos() {
  try {
    const data = getSheetData(SHEET_NAMES.CONFIG);
    const logos = {};
    data.forEach(function(r) {
      if (r.KEY && r.KEY.indexOf('LOGO_') === 0) {
        logos[r.KEY.replace('LOGO_', '')] = r.VALUE;
      }
    });
    return logos;
  } catch(e) { return {}; }
}


// ======================== KARYAWAN DATA ========================

/**
 * Get employees filtered by branch
 * @param {string} cabang - Branch code or 'SEMUA'
 * @returns {Array<Object>}
 */
function getKaryawanByCabang(cabang) {
  // Rolling system: always return ALL active employees regardless of branch
  var data = getSheetData(SHEET_NAMES.KARYAWAN, 'STATUS', 'AKTIF');
  return data.map(function(row) {
    return {
      id: row.ID_KARYAWAN,
      nama: row.NAMA,
      peran: row.PERAN,
      cabang: row.CABANG,
      telepon: row.TELEPON,
      komisi: row.KOMISI_PERSEN
    };
  });
}

/**
 * Get teknisi list by branch
 */
function getTeknisiByCabang(cabang) {
  return getKaryawanByCabang(cabang).filter(function(k) {
    return k.peran === 'TEKNISI' || k.peran === 'ADMIN' || k.peran === 'OWNER';
  });
}

/**
 * Get admin/penerima list by branch
 */
function getPenerimaByCabang(cabang) {
  return getKaryawanByCabang(cabang).filter(function(k) {
    return k.peran === 'ADMIN' || k.peran === 'OWNER';
  });
}


// ======================== STOK PART DATA ========================

/**
 * Get stock filtered by branch
 * @param {string} cabang - Branch code or 'SEMUA'
 * @returns {Array<Object>}
 */
function getStokByCabang(cabang) {
  let data;
  if (!cabang || cabang === 'SEMUA') {
    data = getSheetData(SHEET_NAMES.STOK_PART, 'STATUS', 'AKTIF');
  } else {
    data = getSheetData(SHEET_NAMES.STOK_PART).filter(function(row) {
      return row.STATUS === 'AKTIF' && row.CABANG === cabang;
    });
  }
  return data.map(function(row) {
    return {
      id: row.ID_PART,
      jenisBarang: row.JENIS_BARANG,
      nama: row.NAMA_PART,
      subKategori: row.SUB_KATEGORI,
      merkBarang: row.MERK_BARANG,
      supplier: row.SUPPLIER,
      cabang: row.CABANG,
      stok: Number(row.STOK) || 0,
      hargaBeli: Number(row.HARGA_BELI) || 0,
      hargaJual: Number(row.HARGA_JUAL) || 0,
      persamaan: row.PERSAMAAN || '',
      _rowIndex: row._rowIndex
    };
  });
}

function getAllStokHistory() {
  const data = getSheetData(SHEET_NAMES.STOK_PART);
  return data.map(function(row) {
    return {
      id: row.ID_PART,
      jenisBarang: row.JENIS_BARANG,
      nama: row.NAMA_PART,
      subKategori: row.SUB_KATEGORI,
      merkBarang: row.MERK_BARANG,
      supplier: row.SUPPLIER,
      cabang: row.CABANG,
      stok: Number(row.STOK) || 0,
      hargaBeli: Number(row.HARGA_BELI) || 0,
      hargaJual: Number(row.HARGA_JUAL) || 0,
      persamaan: row.PERSAMAAN || '',
      _rowIndex: row._rowIndex
    };
  });
}


// ======================== CASCADE DROPDOWN (5 LEVEL) ========================

/**
 * Get cascade dropdown options for part selection
 * Level 1: Cabang (pre-selected / locked)
 * Level 2: Nama Part
 * Level 3: Kategori
 * Level 4: Merk
 * Level 5: Supplier
 *
 * @param {string} cabang - Branch code
 * @param {string} level - Which level to fetch ('nama', 'kategori', 'merk', 'supplier')
 * @param {Object} filters - Current selections {nama, kategori, merk}
 * @returns {Array<string>} List of options
 */
function getCascadeOptions(cabang, level, filters) {
  const stok = getStokByCabang(cabang);

  // Apply filters progressively
  let filtered = stok;

  if (filters && filters.nama) {
    filtered = filtered.filter(function(p) { return p.nama === filters.nama; });
  }
  if (filters && filters.kategori) {
    filtered = filtered.filter(function(p) { return p.kategori === filters.kategori; });
  }
  if (filters && filters.merk) {
    filtered = filtered.filter(function(p) { return p.merk === filters.merk; });
  }

  // Extract unique values for requested level
  const values = [];
  const seen = {};
  filtered.forEach(function(p) {
    let val;
    switch (level) {
      case 'nama': val = p.nama; break;
      case 'subKategori': val = p.subKategori; break;
      case 'merkBarang': val = p.merkBarang; break;
      case 'supplier': val = p.supplier; break;
      default: val = '';
    }
    if (val && !seen[val]) {
      seen[val] = true;
      values.push(val);
    }
  });

  return values.sort();
}

/**
 * Get full part details after all cascade levels are selected
 * @param {string} cabang
 * @param {string} nama
 * @param {string} kategori
 * @param {string} merk
 * @param {string} supplier
 * @returns {Object|null} Part details with hargaBeli, hargaJual, stok
 */
function getPartDetail(cabang, nama, kategori, merk, supplier) {
  const stok = getStokByCabang(cabang);

  const match = stok.filter(function(p) {
    return p.nama === nama &&
           (!kategori || p.kategori === kategori) &&
           (!merk || p.merk === merk) &&
           (!supplier || p.supplier === supplier);
  });

  if (match.length > 0) {
    return match[0];
  }
  return null;
}


// ======================== AUTOCOMPLETE ========================

/**
 * Autocomplete for customer name
 * @param {string} query - Search text
 * @param {number} limit - Max results
 * @returns {Array<Object>} [{nama, telepon, tipe}]
 */
function autocompletePelanggan(query, limit) {
  limit = limit || 15;
  const data = getSheetData(SHEET_NAMES.PELANGGAN);
  let results = [];
  
  if (!query || query.trim() === '') {
    // If empty query, return top customers by total transactions or most recent
    results = data.slice().sort(function(a, b) {
      return (Number(b.TOTAL_TRX) || 0) - (Number(a.TOTAL_TRX) || 0);
    }).slice(0, limit);
  } else {
    const q = query.trim().toUpperCase();
    results = data.filter(function(row) {
      return String(row.NAMA).toUpperCase().indexOf(q) !== -1 ||
             String(row.TELEPON).indexOf(q) !== -1;
    }).slice(0, limit);
  }

  return results.map(function(row) {
    return {
      nama: row.NAMA,
      telepon: row.TELEPON,
      tipe: row.TIPE || 'UMUM',
      totalTrx: row.TOTAL_TRX || 0
    };
  });
}

/**
 * Autocomplete for part name
 * @param {string} cabang - Branch code
 * @param {string} query - Search text
 * @param {number} limit - Max results
 * @returns {Array<Object>}
 */
function autocompleteNamaPart(cabang, query, limit) {
  if (!query || query.length < 1) return [];
  limit = limit || 20;

  var stok = getStokByCabang(cabang);
  var q = query.toUpperCase();

  var results = [];
  var seen = {};

  stok.forEach(function(p) {
    if (p.stok <= 0) return;
    var key = p.id || p.nama;
    if (seen[key]) return;

    // Cek cocok di NAMA_PART
    var namaMatch = p.nama.toUpperCase().indexOf(q) !== -1;

    // Cek cocok di PERSAMAAN (alias)
    var aliasMatch = '';
    if (!namaMatch && p.persamaan) {
      var aliasList = p.persamaan.split(',').map(function(a) { return a.trim(); });
      for (var i = 0; i < aliasList.length; i++) {
        if (aliasList[i].toUpperCase().indexOf(q) !== -1) {
          aliasMatch = aliasList[i];
          break;
        }
      }
    }

    if (namaMatch || aliasMatch) {
      seen[key] = true;
      results.push({
        id: p.id,
        nama: p.nama,
        jenisBarang: p.jenisBarang,
        subKategori: p.subKategori,
        merkBarang: p.merkBarang,
        supplier: p.supplier,
        cabang: p.cabang,
        stok: p.stok,
        hargaBeli: p.hargaBeli,
        hargaJual: p.hargaJual,
        persamaan: p.persamaan,
        isAlias: !!aliasMatch,
        aliasMatch: aliasMatch
      });
    }
  });

  // Prioritaskan hasil yang cocok di nama utama, baru alias
  results.sort(function(a, b) {
    if (!a.isAlias && b.isAlias) return -1;
    if (a.isAlias && !b.isAlias) return 1;
    return 0;
  });

  return results.slice(0, limit);
}

/**
 * Autocomplete for supplier name
 * @param {string} query
 * @param {number} limit
 * @returns {Array<string>}
 */
function autocompleteSupplier(query, limit) {
  if (!query || query.length < 1) return [];
  limit = limit || 10;

  const data = getSheetData(SHEET_NAMES.STOK_PART);
  const q = query.toUpperCase();
  const seen = {};
  const results = [];

  data.forEach(function(row) {
    const sup = String(row.SUPPLIER);
    if (sup && sup.toUpperCase().indexOf(q) !== -1 && !seen[sup]) {
      seen[sup] = true;
      results.push(sup);
    }
  });

  return results.slice(0, limit);
}


// ======================== DROPDOWN OPTIONS ========================

/**
 * Get generic dropdown options from any sheet
 * @param {string} sheetName
 * @param {string} column - Column name to get values from
 * @param {string} [filterCol] - Optional filter column
 * @param {string} [filterVal] - Optional filter value
 * @returns {Array<string>} Unique values
 */
function getDropdownOptions(sheetName, column, filterCol, filterVal) {
  const data = getSheetData(sheetName, filterCol, filterVal);
  const seen = {};
  const values = [];

  data.forEach(function(row) {
    const val = String(row[column] || '');
    if (val && !seen[val]) {
      seen[val] = true;
      values.push(val);
    }
  });

  return values.sort();
}

/**
 * Get CONFIG value by key
 * @param {string} key
 * @returns {string} Value
 */
function getConfigValue(key) {
  const data = getSheetData(SHEET_NAMES.CONFIG);
  const found = data.filter(function(row) { return row.KEY === key; });
  return found.length > 0 ? String(found[0].VALUE) : '';
}

/**
 * Get CONFIG values as comma-separated list (for dropdown options)
 * @param {string} key - CONFIG key
 * @returns {Array<string>}
 */
function getConfigList(key) {
  const val = getConfigValue(key);
  if (!val) return [];
  return val.split(',').map(function(v) { return v.trim(); }).filter(function(v) { return v !== ''; });
}

/**
 * Get all CONFIG as object
 */
function getAllConfig() {
  const data = getSheetData(SHEET_NAMES.CONFIG);
  const config = {};
  data.forEach(function(row) {
    config[row.KEY] = row.VALUE;
  });
  return config;
}


// ======================== SUPPLIER DATA ========================

/**
 * Get unique supplier list
 */
function getSupplierList() {
  return getDropdownOptions(SHEET_NAMES.STOK_PART, 'SUPPLIER');
}

/**
 * Get supplier list filtered by branch
 */
function getSupplierByCabang(cabang) {
  if (!cabang || cabang === 'SEMUA') {
    return getSupplierList();
  }
  return getDropdownOptions(SHEET_NAMES.STOK_PART, 'SUPPLIER', 'CABANG', cabang);
}


// ======================== PELANGGAN DATA ========================

/**
 * Get or create pelanggan record
 * Returns existing pelanggan or creates new one
 */
function getOrCreatePelanggan(nama, telepon, tipe) {
  const data = getSheetData(SHEET_NAMES.PELANGGAN);

  // Try to find existing
  const existing = data.filter(function(row) {
    return String(row.NAMA).toUpperCase() === String(nama).toUpperCase() ||
           (telepon && String(row.TELEPON) === String(telepon));
  });

  if (existing.length > 0) {
    // Update total_trx
    const row = existing[0];
    updateCell(SHEET_NAMES.PELANGGAN, row._rowIndex, 'TOTAL_TRX', (Number(row.TOTAL_TRX) || 0) + 1);
    return row.ID_PELANGGAN;
  }

  // Create new pelanggan
  const id = generateID(ID_PREFIX.PELANGGAN, SHEET_NAMES.PELANGGAN);
  const sheet = getSheet(SHEET_NAMES.PELANGGAN);
  sheet.appendRow([
    id,
    nama,
    telepon || '',
    tipe || 'UMUM',
    1,
    getTimestamp()
  ]);

  return id;
}


// ======================== INITIAL DATA FOR FORMS ========================

/**
 * Get all initial data needed for the transaction form
 * Sent to client in one call to reduce server round-trips
 */
function getTransaksiFormData(cabang) {
  return {
    cabangList: getCabangList(),
    karyawan: getKaryawanByCabang(cabang),
    teknisi: getTeknisiByCabang(cabang),
    penerima: getPenerimaByCabang(cabang),
    stokList: getStokByCabang(cabang),
    tipePelanggan: getConfigList('TIPE_PELANGGAN'),
    metodeBayar: getConfigList('METODE_BAYAR'),
    statusList: STATUS_LIST,
    merkHPList: getConfigList('MERK_HP'),
    jenisBarangList: getConfigList('JENIS_BARANG'),
    kategoriSparepart: getConfigList('KATEGORI_SPAREPART'),
    kategoriTool: getConfigList('KATEGORI_TOOL'),
    kategoriAccessories: getConfigList('KATEGORI_ACCESSORIES'),
    merkBarangList: getConfigList('MERK_BARANG'),
    supplierList: getUniqueSuppliers()
  };
}

function getUniqueSuppliers() {
  var fromConfig = getConfigList('SUPPLIER_LIST');
  var fromStok = getDropdownOptions(SHEET_NAMES.STOK_PART, 'SUPPLIER');
  var seen = {};
  var result = [];
  fromConfig.concat(fromStok).forEach(function(s) {
    if (s && !seen[s]) { seen[s] = true; result.push(s); }
  });
  return result.sort();
}

/**
 * Get all initial data for pembelian form
 */
function getPembelianFormData(cabang) {
  return {
    cabangList: getCabangList(),
    supplierList: getUniqueSuppliers(),
    stokList: getAllStokHistory(),
    metodeBayar: getConfigList('METODE_BAYAR'),
    jenisBarangList: getConfigList('JENIS_BARANG'),
    kategoriSparepart: getConfigList('KATEGORI_SPAREPART'),
    kategoriTool: getConfigList('KATEGORI_TOOL'),
    kategoriAccessories: getConfigList('KATEGORI_ACCESSORIES'),
    merkBarangList: getConfigList('MERK_BARANG')
  };
}

/**
 * Get data for transfer form
 */
function getTransferFormData(cabang) {
  return {
    cabangList: getCabangList(),
    stokList: getStokByCabang(cabang)
  };
}

/**
 * Get data for dashboard
 */
function getDashboardFormData(cabang, periode) {
  return getDashboardData(cabang, periode);
}

/**
 * Get data for master data page
 */
function getMasterDataFormData(cabang) {
  return {
    cabangList: getSheetData(SHEET_NAMES.CABANG),
    karyawanList: getKaryawanByCabang(cabang),
    stokList: getStokByCabang(cabang),
    configList: getSheetData(SHEET_NAMES.CONFIG),
    usersList: getSheetData(SHEET_NAMES.USERS),
    supplierList: getUniqueSuppliers()
  };
}

// ======================== STOCK OPNAME ========================

function getOpnameData(filter) {
  try {
    var stokData = getSheetData(SHEET_NAMES.STOK_PART);
    var riwayatData = getSheetData(SHEET_NAMES.RIWAYAT_PART);
    
    // Filter stok
    if (filter.cabang) {
      stokData = stokData.filter(function(r) { return r.CABANG === filter.cabang; });
      riwayatData = riwayatData.filter(function(r) { return r.CABANG === filter.cabang; });
    }
    if (filter.jenis) {
      stokData = stokData.filter(function(r) { return r.JENIS_BARANG === filter.jenis; });
    }
    if (filter.kategori) {
      stokData = stokData.filter(function(r) { return r.SUB_KATEGORI === filter.kategori; });
    }
    if (filter.supplier) {
      stokData = stokData.filter(function(r) { return r.SUPPLIER === filter.supplier; });
    }
    
    // Create a map for latest purchase date
    var lastBeliMap = {};
    riwayatData.forEach(function(r) {
      if (r.TIPE !== 'MASUK') return;
      
      var key = r.NAMA_PART;
      var tglStr = '';
      try {
        if (r.TANGGAL instanceof Date) {
          tglStr = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
        } else {
          tglStr = String(r.TANGGAL || '').substring(0, 10);
        }
      } catch(e) {}
      
      if (tglStr && (!lastBeliMap[key] || tglStr > lastBeliMap[key])) {
        lastBeliMap[key] = tglStr;
      }
    });
    
    // Map stokData
    var result = stokData.map(function(s) {
      return {
        JENIS_BARANG: s.JENIS_BARANG,
        SUB_KATEGORI: s.SUB_KATEGORI,
        SUPPLIER: s.SUPPLIER,
        NAMA_PART: s.NAMA_PART,
        MERK_BARANG: s.MERK_BARANG,
        HARGA_BELI: Number(s.HARGA_BELI) || 0,
        STOK: Number(s.STOK) || 0,
        CABANG: s.CABANG,
        TGL_BELI_TERAKHIR: lastBeliMap[s.NAMA_PART] || '-'
      };
    });
    
    // Sort logic: Jenis -> Kategori -> Supplier -> Nama Part
    result.sort(function(a, b) {
      var jA = String(a.JENIS_BARANG||''); var jB = String(b.JENIS_BARANG||'');
      if (jA !== jB) return jA.localeCompare(jB);
      
      var kA = String(a.SUB_KATEGORI||''); var kB = String(b.SUB_KATEGORI||'');
      if (kA !== kB) return kA.localeCompare(kB);
      
      var sA = String(a.SUPPLIER||''); var sB = String(b.SUPPLIER||'');
      if (sA !== sB) return sA.localeCompare(sB);
      
      var nA = String(a.NAMA_PART||''); var nB = String(b.NAMA_PART||'');
      return nA.localeCompare(nB);
    });
    
    return {success: true, data: result};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

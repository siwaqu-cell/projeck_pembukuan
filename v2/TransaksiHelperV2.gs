/**
 * ============================================================
 * ServicePro HP v5.1 — TransaksiHelper.gs
 * Save transaction, multi-part, stock deduction, kas, piutang
 * ============================================================
 */

function saveTransaksi(data, _token) {
  var lock = LockService.getScriptLock();
  try {
    requireAuth(_token);
    // Tunggu maksimal 30 detik untuk mendapatkan kunci
    lock.waitLock(30000);
    
    validateRequired(data, ['cabang', 'namaPelanggan', 'tipeHP', 'kerusakan', 'penerima']);
    var id = generateID(ID_PREFIX.TRANSAKSI, SHEET_NAMES.TRANSAKSI);
    var ts = getTimestamp();
    var parts = data.parts || [];
    var totalModal = 0, totalJual = 0, totalQty = 0;
    var pNames = [], pMerks = [], pKats = [], pSups = [];

    parts.forEach(function(p) {
      var q = Number(p.qty)||0, hb = Number(p.hargaBeli)||0, hj = Number(p.hargaJual)||0;
      totalModal += hb*q; totalJual += hj*q; totalQty += q;
      if(p.nama) pNames.push(p.nama);
      if(p.merkBarang) pMerks.push(p.merkBarang);
      if(p.subKategori) pKats.push(p.subKategori);
      if(p.supplier) pSups.push(p.supplier);
    });

    var ongkos = Number(data.ongkosKerja)||0;
    var pendapatan = totalJual + ongkos;
    var labaKotor = pendapatan - totalModal;
    var komisi = 0;
    if (data.komisiNominal !== undefined && data.komisiNominal !== '') {
      komisi = Number(data.komisiNominal);
    } else {
      var komisiPct = Number(data.komisiPersen) || Number(getConfigValue('KOMISI_DEFAULT_PERSEN')) || 10;
      komisi = Math.round(labaKotor * komisiPct / 100);
    }
    var labaBersih = labaKotor - komisi;
    var status = data.status || 'ANTRI';
    var metode = data.metodeBayar || '';
    // Handle split payment — encode ke string "SPLIT:CASH:100000:TRANSFER:100000:BON:100000"
    if (metode === 'SPLIT' && data.splitPay) {
      var sp = data.splitPay;
      var splitParts = [];
      if (sp.cash > 0) splitParts.push('CASH:' + sp.cash);
      if (sp.transfer > 0) splitParts.push('TRANSFER:' + sp.transfer);
      if (sp.bon > 0) splitParts.push('BON:' + sp.bon);
      metode = 'SPLIT:' + splitParts.join(':');
    }

    getSheet(SHEET_NAMES.TRANSAKSI).appendRow([
      id, ts, data.cabang, data.namaPelanggan, data.telepon||'',
      data.tipePelanggan||'UMUM', data.merkHP||'', data.tipeHP, data.kerusakan,
      data.penerima, data.teknisi||'',
      pNames.join(', '), pMerks.join(', '), pKats.join(', '), pSups.join(', '),
      totalQty, totalModal, totalJual, ongkos, totalModal,
      labaKotor, komisi, labaBersih, metode, status,
      '', '', data.catatan||'', data.createdBy||'', ts
    ]);

    if (parts.length > 0) saveTransaksiDetail(id, parts);

    parts.forEach(function(p) {
      if (p.nama && p.qty > 0) {
        deductStock(data.cabang, p.nama, p.merkBarang, p.subKategori, p.supplier, Number(p.qty));
        catatRiwayatPart({jenisTransaksi:'SERVICE', jenisBarang:p.jenisBarang||'', namaPart:p.nama, subKategori:p.subKategori||'', merkBarang:p.merkBarang||'',
          supplier: p.supplier || '',
          cabang:data.cabang, qty:Number(p.qty), tipe:'KELUAR', idReferensi:id,
          keterangan:'Service: '+data.tipeHP+' - '+data.kerusakan,
          aliasDigunakan: p.aliasDigunakan||''});
      }
    });


    // ===== ATURAN WORKFLOW KAS =====
    // Kas/Piutang HANYA dibuat jika status sudah final:
    // - SELESAI_DIAMBIL + CASH/TRANSFER → masuk KAS_HARIAN
    // - SELESAI_DIAMBIL + BON → masuk PIUTANG (status jadi SELESAI_BELUM_LUNAS)
    // - SELESAI_BELUM_LUNAS → masuk PIUTANG
    // - ANTRI/PROSES/SELESAI_BELUM_DIAMBIL → BELUM ada kas/piutang (akan dibuat saat updateStatus)
    if (status === 'SELESAI_DIAMBIL' && pendapatan > 0) {
      // Handle split payment
      if (metode.indexOf('SPLIT:') === 0) {
        var splitParts = metode.substring(6).split(':');
        for (var si = 0; si < splitParts.length - 1; si += 2) {
          var splitMetode = splitParts[si];
          var splitJumlah = Number(splitParts[si + 1]) || 0;
          if (splitJumlah > 0 && splitMetode === 'BON') {
            createPiutangEntry({cabang:data.cabang, namaPelanggan:data.namaPelanggan,
              telepon:data.telepon||'', keterangan:'Service '+data.tipeHP+' (BON)',
              jumlah:splitJumlah, idTransaksi:id, createdBy:data.createdBy||''});
          } else if (splitJumlah > 0) {
            createKasEntry({cabang:data.cabang, jenis:'MASUK', metodeBayar:splitMetode,
              kategori:'SERVICE', keterangan:'Service '+data.tipeHP+' - '+data.namaPelanggan,
              jumlah:splitJumlah, sumber:'TRANSAKSI', idTransaksi:id, createdBy:data.createdBy||''});
          }
        }
      } else if (metode && metode !== 'BON') {
        createKasEntry({cabang:data.cabang, jenis:'MASUK', metodeBayar:metode,
          kategori:'SERVICE', keterangan:'Service '+data.tipeHP+' - '+data.namaPelanggan,
          jumlah:pendapatan, sumber:'TRANSAKSI', idTransaksi:id, createdBy:data.createdBy||''});
      } else if (metode === 'BON') {
        // BON di status SELESAI_DIAMBIL → tetap masuk piutang
        createPiutangEntry({cabang:data.cabang, namaPelanggan:data.namaPelanggan,
          telepon:data.telepon||'', keterangan:'Service '+data.tipeHP,
          jumlah:pendapatan, idTransaksi:id, createdBy:data.createdBy||''});
      }
    } else if (status === 'SELESAI_BELUM_LUNAS' && pendapatan > 0) {
      createPiutangEntry({cabang:data.cabang, namaPelanggan:data.namaPelanggan,
        telepon:data.telepon||'', keterangan:'Service '+data.tipeHP,
        jumlah:pendapatan, idTransaksi:id, createdBy:data.createdBy||''});
    }
    // Status ANTRI/PROSES/SEDANG_PROSES/SELESAI_BELUM_DIAMBIL:
    // Kas dan piutang BELUM dibuat — akan dibuat saat updateStatus()

    getOrCreatePelanggan(data.namaPelanggan, data.telepon, data.tipePelanggan);
    logActivity(data.createdBy, 'TRANSAKSI_BARU', id+' - '+data.tipeHP, data.cabang, id);
    SpreadsheetApp.flush();
    // Telegram notification
    try {
      sendTelegramNotif('TRANSAKSI_BARU', {id:id, nama:data.namaPelanggan, tipeHp:data.tipeHP, kerusakan:data.kerusakan, teknisi:data.teknisi, cabang:data.cabang});
      if (data.metodeBayar === 'BON' || !data.metodeBayar) {
        sendTelegramNotif('BON_DIBERIKAN', {id:id, nama:data.namaPelanggan, teknisi:data.teknisi, cabang:data.cabang});
      }
    } catch(e) { Logger.log('TG notif: '+e.message); }
    return {success:true, id:id, message:'Transaksi berhasil disimpan!'};
  } catch(e) {
    return {success:false, id:'', message:'Error: '+e.message};
  } finally {
    // Lepaskan kunci
    lock.releaseLock();
  }
}

function saveTransaksiDetail(idTrx, parts) {
  var sh = getSheet(SHEET_NAMES.TRANSAKSI_DETAIL), ts = getTimestamp();
  parts.forEach(function(p,i) {
    if(!p.nama) return;
    var q=Number(p.qty)||0, hb=Number(p.hargaBeli)||0, hj=Number(p.hargaJual)||0;
    sh.appendRow([idTrx, i+1, p.jenisBarang||'', p.nama, p.subKategori||'',
      p.merkBarang||'', p.supplier||'', q, hb, hj, hb*q, hj*q, ts]);
  });
}

function deductStock(cab, nama, merkBarang, subKat, sup, qty) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Tunggu 10 detik
    var sh = getSheet(SHEET_NAMES.STOK_PART), lr = sh.getLastRow();
    if(lr<2) return;
    var d = sh.getRange(2,1,lr-1,sh.getLastColumn()).getValues();
    var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var cN=h.indexOf('NAMA_PART'), cM=h.indexOf('MERK_BARANG'), cC=h.indexOf('CABANG'),
        cS=h.indexOf('STOK'), cK=h.indexOf('SUB_KATEGORI'), cSu=h.indexOf('SUPPLIER');
    var searchNama = String(nama || '').trim().toUpperCase();
    var searchCab  = String(cab || '').trim().toUpperCase();
    var searchMerk = String(merkBarang || '').trim().toUpperCase();
    var searchSub  = String(subKat || '').trim().toUpperCase();
    var searchSup  = String(sup || '').trim().toUpperCase();

    for(var i=0;i<d.length;i++){
      var rowNama = String(d[i][cN] || '').trim().toUpperCase();
      var rowCab  = String(d[i][cC] || '').trim().toUpperCase();
      var rowMerk = String(d[i][cM] || '').trim().toUpperCase();
      var rowSub  = String(d[i][cK] || '').trim().toUpperCase();
      var rowSup  = String(d[i][cSu] || '').trim().toUpperCase();

      if(rowNama === searchNama && rowCab === searchCab &&
         (!searchMerk || rowMerk === searchMerk) && 
         (!searchSub  || rowSub === searchSub) &&
         (!searchSup  || rowSup === searchSup)){
        sh.getRange(i+2, cS+1).setValue(Math.max(0, (Number(d[i][cS])||0)-qty));
        return;
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function addStock(cab, nama, merkBarang, subKat, sup, qty, hb, hj, jenisBarang, persamaan) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sh = getSheet(SHEET_NAMES.STOK_PART), lr = sh.getLastRow();
    var hd = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var cP = hd.indexOf('PERSAMAAN');
    if(lr>=2){
      var d = sh.getRange(2,1,lr-1,sh.getLastColumn()).getValues();
      var cN=hd.indexOf('NAMA_PART'),cM=hd.indexOf('MERK_BARANG'),cC=hd.indexOf('CABANG'),
          cS=hd.indexOf('STOK'),cK=hd.indexOf('SUB_KATEGORI'),cHB=hd.indexOf('HARGA_BELI'),cHJ=hd.indexOf('HARGA_JUAL'),
          cSUP=hd.indexOf('SUPPLIER');
      for(var i=0;i<d.length;i++){
        if(String(d[i][cN])===String(nama) && String(d[i][cC])===String(cab) &&
           (!merkBarang||String(d[i][cM])===String(merkBarang)) && (!subKat||String(d[i][cK])===String(subKat)) &&
           (!sup||String(d[i][cSUP])===String(sup))){
          sh.getRange(i+2, cS+1).setValue((Number(d[i][cS])||0)+qty);
          if(hb) sh.getRange(i+2, cHB+1).setValue(hb);
          if(hj) sh.getRange(i+2, cHJ+1).setValue(hj);
          if(sup && cSUP !== -1) sh.getRange(i+2, cSUP+1).setValue(sup);
          if(persamaan && cP !== -1) {
            var existingPersamaan = String(d[i][cP] || '');
            if(!existingPersamaan.includes(persamaan)) {
               var newP = existingPersamaan ? existingPersamaan + ', ' + persamaan : persamaan;
               sh.getRange(i+2, cP+1).setValue(newP);
            }
          }
          return;
        }
      }
    }
    var id = generateID(ID_PREFIX.PART, SHEET_NAMES.STOK_PART);
    // Build row array
    var rowData = [id, jenisBarang||'', nama, subKat||'', merkBarang||'', sup||'', cab, qty, hb||0, hj||0, 'AKTIF'];
    // Append persamaan if column exists
    if(cP !== -1 && hd.length > 11) {
      // Pad array up to cP
      while(rowData.length < hd.length) rowData.push('');
      rowData[cP] = persamaan || '';
    }
    sh.appendRow(rowData);
  } finally {
    lock.releaseLock();
  }
}

function createKasEntry(data) {
  var id = generateID(ID_PREFIX.KAS, SHEET_NAMES.KAS_HARIAN);
  var tgl = data.tanggal ? data.tanggal : getTimestamp();
  getSheet(SHEET_NAMES.KAS_HARIAN).appendRow([id, tgl, data.cabang, data.jenis,
    data.metodeBayar, data.kategori, data.keterangan, Number(data.jumlah)||0,
    data.sumber, data.idTransaksi||'', data.createdBy||'']);
  SpreadsheetApp.flush();
  return id;
}

function createKasPusatEntry(data) {
  var id = generateID('KPT-', SHEET_NAMES.KAS_PUSAT);
  getSheet(SHEET_NAMES.KAS_PUSAT).appendRow([id, getTimestamp(), data.cabangTerkait||'', data.jenis,
    data.kategori, data.keterangan, Number(data.jumlah)||0, data.sumber,
    data.idReferensi||'', data.createdBy||'SYSTEM']);
  SpreadsheetApp.flush();
  return id;
}

function createPiutangEntry(data) {
  var id = generateID(ID_PREFIX.PIUTANG, SHEET_NAMES.PIUTANG);
  getSheet(SHEET_NAMES.PIUTANG).appendRow([id, getTimestamp(), data.cabang, data.namaPelanggan,
    data.telepon||'', data.keterangan, Number(data.jumlah)||0, 'BELUM_LUNAS', '',
    data.idTransaksi||'', data.createdBy||'']);
  return id;
}

function getTransaksiList(cabang, filter) {
  var data = getSheetDataByCabang(SHEET_NAMES.TRANSAKSI, cabang);
  if(filter){
    if(filter.status && filter.status!=='SEMUA')
      data = data.filter(function(r){return r.STATUS===filter.status;});
    if(filter.startDate){var s=new Date(filter.startDate);
      data=data.filter(function(r){return new Date(r.TGL_MASUK)>=s;});}
    if(filter.endDate){var e=new Date(filter.endDate);e.setHours(23,59,59);
      data=data.filter(function(r){return new Date(r.TGL_MASUK)<=e;});}
    if(filter.search){var q=filter.search.toUpperCase();
      data=data.filter(function(r){
        return String(r.ID_TRANSAKSI).toUpperCase().indexOf(q)!==-1||
               String(r.NAMA_PELANGGAN).toUpperCase().indexOf(q)!==-1||
               String(r.TIPE_HP).toUpperCase().indexOf(q)!==-1;});}
  }
  data.sort(function(a,b){return new Date(b.TGL_MASUK)-new Date(a.TGL_MASUK);});
  return JSON.parse(JSON.stringify(data));
}

function getTransaksiDetail(idTrx) {
  if (!idTrx) return null;
  // Trim ID untuk menghindari spasi tersembunyi dari Google Sheets
  var cleanId = String(idTrx).trim();
  
  // Coba cari di sheet TRANSAKSI dulu
  var trx = findRowByID(SHEET_NAMES.TRANSAKSI, cleanId);
  
  // Fallback: cari manual dengan trim() untuk mengatasi trailing spaces
  if (!trx) {
    var allTrx = getSheetData(SHEET_NAMES.TRANSAKSI);
    var found = allTrx.filter(function(r) {
      return String(r.ID_TRANSAKSI || '').trim() === cleanId;
    });
    if (found.length > 0) trx = found[0];
  }
  
  if (!trx) return null;
  
  var det = getSheetData(SHEET_NAMES.TRANSAKSI_DETAIL).filter(function(r) {
    return String(r.ID_TRANSAKSI || '').trim() === cleanId;
  });
  
  // Serialisasi aman — ubah Date ke string agar tidak error saat dikirim ke frontend
  return JSON.parse(JSON.stringify({transaksi: trx, parts: det}));
}

function calculateTotals(parts, ongkos, komisiPct) {
  var tm=0,tj=0;
  parts.forEach(function(p){var q=Number(p.qty)||0;tm+=(Number(p.hargaBeli)||0)*q;tj+=(Number(p.hargaJual)||0)*q;});
  ongkos=Number(ongkos)||0; komisiPct=Number(komisiPct)||10;
  var pend=tj+ongkos, lk=pend-tm, km=Math.round(lk*komisiPct/100);
  return {totalModal:tm,totalJual:tj,ongkosKerja:ongkos,pendapatan:pend,labaKotor:lk,komisi:km,labaBersih:lk-km};
}

// ======================== PENGELUARAN CABANG ========================

function savePengeluaran(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    validateRequired(data, ['cabang', 'jumlah', 'keterangan']);
    var jumlah = Number(data.jumlah) || 0;
    if (jumlah <= 0) throw new Error('Jumlah pengeluaran harus lebih dari 0');

    var id = createKasEntry({
      cabang: data.cabang,
      jenis: 'KELUAR',
      metodeBayar: data.metodeBayar || 'CASH',
      kategori: 'PENGELUARAN_BIAYA',
      keterangan: data.keterangan,
      jumlah: jumlah,
      sumber: 'OPERASIONAL',
      idTransaksi: '',
      tanggal: data.tanggal || '',
      createdBy: data.createdBy || 'SYSTEM'
    });

    logActivity(data.createdBy, 'PENGELUARAN', data.keterangan + ' sejumlah Rp' + jumlah, data.cabang, id);
    lock.releaseLock();
    return {success: true, message: 'Pengeluaran berhasil dicatat'};
  } catch(e) {
    if (lock) lock.releaseLock();
    return {success: false, message: 'Error: ' + e.message};
  }
}

// ======================== MANAJEMEN KASIR (KAS FISIK HARIAN) ========================

function getKasirData(cabang) {
  try {
    // Sanitize cabang — strip ':rowIndex' suffix that Sheets sometimes adds
    if (cabang) cabang = String(cabang).split(':')[0].trim().toUpperCase();
    
    // Use the same timezone as getTimestamp for consistent comparison
    var todayStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');
    
    var allKasData = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang);
    
    var totalCash = 0, totalNonCash = 0;
    var cashMasukHariIni = 0, cashKeluarHariIni = 0;
    var nonCashMasukHariIni = 0, nonCashKeluarHariIni = 0;
    var riwayatHariIni = [];
    
    allKasData.forEach(function(r) {
      var amt = Number(r.JUMLAH) || 0;
      var isCash = (r.METODE_BAYAR === 'CASH');
      
      // Check if today — compare date string to avoid timezone issues
      var isToday = false;
      try {
        var rowDate;
        if (r.TANGGAL instanceof Date) {
          rowDate = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
        } else {
          rowDate = String(r.TANGGAL || '').substring(0, 10);
        }
        isToday = (rowDate === todayStr);
      } catch(dateErr) {
        // If date parsing fails, still accumulate totals
      }
      
      // Accumulate totals (always, regardless of date)
      // Ignore UANG_OWNER so it doesn't mess up cashier's non-cash mutation
      if (r.METODE_BAYAR !== 'UANG_OWNER') {
        if (isCash) {
          if (r.JENIS === 'MASUK') {
            totalCash += amt;
            if (isToday) cashMasukHariIni += amt;
          } else {
            totalCash -= amt;
            if (isToday) cashKeluarHariIni += amt;
          }
        } else {
          if (r.JENIS === 'MASUK') {
            totalNonCash += amt;
            if (isToday) nonCashMasukHariIni += amt;
          } else {
            totalNonCash -= amt;
            if (isToday) nonCashKeluarHariIni += amt;
          }
        }
      }
      
      // Collect today's history (both cash and non-cash)
      if (isToday) riwayatHariIni.push(r);
    });
    
    // Sort by most recent first
    riwayatHariIni.sort(function(a,b) {
      try { return parseDate(b.TANGGAL) - parseDate(a.TANGGAL); } catch(e) { return 0; }
    });
    
    var resultData = {
      totalFisik: totalCash,
      totalNonCash: totalNonCash,
      masukHariIni: cashMasukHariIni,
      keluarHariIni: cashKeluarHariIni,
      nonCashMasukHariIni: nonCashMasukHariIni,
      nonCashKeluarHariIni: nonCashKeluarHariIni,
      riwayatHariIni: riwayatHariIni,
      totalRowsRead: allKasData.length
    };
    
    // Fix google.script.run silent failure: convert Date objects to strings
    return JSON.parse(JSON.stringify(resultData));
  } catch(e) { throw new Error('Gagal memuat data kasir: ' + e.message); }
}

/**
 * Debug function — call from browser console: google.script.run.withSuccessHandler(console.log).debugKasir('BL')
 */
function debugKasir(cabang) {
  var todayStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');
  var allData = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang);
  var sample = allData.slice(0, 5).map(function(r) {
    var rowDateType = typeof r.TANGGAL;
    var isDateObj = r.TANGGAL instanceof Date;
    var rowDateStr;
    if (isDateObj) {
      rowDateStr = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
    } else {
      rowDateStr = String(r.TANGGAL || '').substring(0, 10);
    }
    return {
      ID_KAS: r.ID_KAS,
      TANGGAL_RAW: String(r.TANGGAL),
      TANGGAL_TYPE: rowDateType,
      IS_DATE_OBJ: isDateObj,
      TANGGAL_FORMATTED: rowDateStr,
      TODAY: todayStr,
      IS_TODAY: rowDateStr === todayStr,
      JENIS: r.JENIS,
      METODE_BAYAR: r.METODE_BAYAR,
      JUMLAH: r.JUMLAH,
      CABANG: r.CABANG
    };
  });
  return {
    todayStr: todayStr,
    totalRows: allData.length,
    sample: sample
  };
}

function saveKasirAksi(data) {
  try {
    validateRequired(data, ['cabang', 'aksi', 'jumlah', 'keterangan']);
    var ts = getTimestamp();
    var amt = Number(data.jumlah);

    var jenis, kategori, metodeBayar = 'CASH';
    if (data.aksi === 'BUKA') {
      jenis = 'MASUK'; kategori = 'MODAL_KASIR';
    } else if (data.aksi === 'TUTUP') {
      jenis = 'KELUAR'; kategori = 'SETOR_OWNER';
    } else if (data.aksi === 'TUTUP_NONCASH') {
      jenis = 'KELUAR'; kategori = 'SETOR_OWNER'; metodeBayar = 'TRANSFER';
    } else if (data.aksi === 'PENGELUARAN') {
      jenis = 'KELUAR'; kategori = 'PENGELUARAN_OPERASIONAL';
      if (data.metodeBayar) metodeBayar = data.metodeBayar;
    } else {
      throw new Error('Aksi tidak valid');
    }

    var kasId = createKasEntry({
      cabang: data.cabang,
      jenis: jenis,
      metodeBayar: metodeBayar,
      kategori: kategori,
      keterangan: data.keterangan,
      jumlah: amt,
      sumber: 'KASIR',
      idTransaksi: '',
      createdBy: data.createdBy || ''
    });

    // ===== PHASE 2: TUTUP TOKO → KAS PUSAT =====
    // Setor ke Owner harus tercatat di Kas Pusat sebagai penerimaan
    // Ini TIDAK mempengaruhi laba rugi — hanya pemindahan kas
    if (data.aksi === 'TUTUP' || data.aksi === 'TUTUP_NONCASH') {
      createKasPusatEntry({
        cabangTerkait: data.cabang,
        jenis: 'MASUK',
        kategori: 'SETORAN_CABANG',
        keterangan: 'Setoran tutup toko ' + data.cabang + ' (' + (data.aksi === 'TUTUP' ? 'Cash' : 'Transfer') + ')',
        jumlah: amt,
        sumber: 'KAS_HARIAN',
        idReferensi: kasId,
        createdBy: data.createdBy || 'SYSTEM'
      });
    }

    logActivity(data.createdBy, 'KASIR_' + data.aksi, data.keterangan + ' - Rp' + amt, data.cabang, kasId);
    try { sendTelegramNotif('KASIR_AKSI', {id:kasId, aksi:data.aksi, keterangan:data.keterangan, jumlah:amt, cabang:data.cabang, metodeBayar:metodeBayar}); } catch(e) {}
    return { success: true, message: 'Berhasil mencatat kas.' };
  } catch(e) { return { success: false, message: e.message }; }
}

// ======================== PENJUALAN AKSESORIS ========================

function savePenjualan(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    validateRequired(data, ['cabang', 'namaPelanggan']);
    
    var id = generateID(ID_PREFIX.PENJUALAN, SHEET_NAMES.PENJUALAN);
    var ts = getTimestamp();
    var parts = data.parts || [];
    var totalModal = 0, totalJual = 0, totalQty = 0;

    parts.forEach(function(p) {
      var q = Number(p.qty)||0, hb = Number(p.hargaBeli)||0, hj = Number(p.hargaJual)||0;
      totalModal += hb*q; totalJual += hj*q; totalQty += q;
    });

    var labaKotor = totalJual - totalModal;
    var metode = data.metodeBayar || 'CASH';

    getSheet(SHEET_NAMES.PENJUALAN).appendRow([
      id, ts, data.cabang, data.namaPelanggan, data.telepon||'',
      totalQty, totalModal, totalJual, labaKotor, metode,
      data.catatan||'', data.createdBy||''
    ]);

    if (parts.length > 0) savePenjualanDetail(id, parts);

    parts.forEach(function(p) {
      if (p.nama && p.qty > 0) {
        deductStock(data.cabang, p.nama, p.merkBarang, p.subKategori, p.supplier, Number(p.qty));
        catatRiwayatPart({
          jenisTransaksi: 'PENJUALAN_LANGSUNG',
          jenisBarang: p.jenisBarang||'', namaPart: p.nama, subKategori: p.subKategori||'', merkBarang: p.merkBarang||'', supplier: p.supplier||'',
          cabang: data.cabang, qty: Number(p.qty), tipe: 'KELUAR', idReferensi: id,
          keterangan: 'Penjualan: ' + data.namaPelanggan
        });
      }
    });

    if (metode && metode !== 'BON' && totalJual > 0) {
      createKasEntry({
        cabang: data.cabang, jenis: 'MASUK', metodeBayar: metode,
        kategori: 'PENJUALAN_LANGSUNG', keterangan: 'Penjualan Part - ' + data.namaPelanggan,
        jumlah: totalJual, sumber: 'PENJUALAN', idTransaksi: id, createdBy: data.createdBy||''
      });
    }
    
    if (metode === 'BON' && totalJual > 0) {
      createPiutangEntry({
        cabang: data.cabang, namaPelanggan: data.namaPelanggan,
        telepon: data.telepon||'', keterangan: 'Penjualan Part/Aksesoris',
        jumlah: totalJual, idTransaksi: id, createdBy: data.createdBy||''
      });
    }

    getOrCreatePelanggan(data.namaPelanggan, data.telepon, 'UMUM');
    logActivity(data.createdBy, 'PENJUALAN_BARU', id + ' - Rp' + totalJual, data.cabang, id);
    SpreadsheetApp.flush();
    // Telegram notification
    try {
      var itemNames = parts.map(function(p){return tg(p.nama||'')+'x'+p.qty;}).join(', ');
      sendTelegramNotif('JUAL_PART', {id:id, items:itemNames, namaPelanggan:data.namaPelanggan, total:totalJual, metodeBayar:metode, cabang:data.cabang});
    } catch(e) { Logger.log('TG notif: '+e.message); }
    return {success:true, id:id, message:'Penjualan berhasil disimpan!'};
  } catch(e) {
    return {success:false, id:'', message:'Error: '+e.message};
  } finally {
    lock.releaseLock();
  }
}

function savePenjualanDetail(idPenjualan, parts) {
  var sh = getSheet(SHEET_NAMES.PENJUALAN_DETAIL), ts = getTimestamp();
  parts.forEach(function(p,i) {
    if(!p.nama) return;
    var q=Number(p.qty)||0, hb=Number(p.hargaBeli)||0, hj=Number(p.hargaJual)||0;
    sh.appendRow([idPenjualan, i+1, p.jenisBarang||'', p.nama, p.subKategori||'',
      p.merkBarang||'', p.supplier||'', q, hb, hj, hb*q, hj*q, ts]);
  });
}

// ======================== CETAK NOTA / STRUK ========================

function getNotaData(id) {
  if (!id) return {success: false, message: 'ID Transaksi tidak valid'};
  
  var isTrx = String(id).indexOf(ID_PREFIX.TRANSAKSI) === 0;
  var isPnj = String(id).indexOf(ID_PREFIX.PENJUALAN) === 0;
  
  if (!isTrx && !isPnj) return {success: false, message: 'Format ID tidak dikenal'};
  
  var sheetName = isTrx ? SHEET_NAMES.TRANSAKSI : SHEET_NAMES.PENJUALAN;
  var detailSheetName = isTrx ? SHEET_NAMES.TRANSAKSI_DETAIL : SHEET_NAMES.PENJUALAN_DETAIL;
  
  var headerData = getSheetData(sheetName).filter(function(r) {
    return String(r.ID_TRANSAKSI || r.ID_PENJUALAN) === String(id);
  });
  
  if (headerData.length === 0) return {success: false, message: 'Data tidak ditemukan'};
  var h = headerData[0];
  
  var detailData = getSheetData(detailSheetName).filter(function(r) {
    return String(r.ID_TRANSAKSI || r.ID_PENJUALAN) === String(id);
  });
  
  var parts = [];
  detailData.forEach(function(d) {
    parts.push({
      nama: d.NAMA_PART,
      qty: Number(d.QTY) || 0,
      hargaJual: Number(d.HARGA_JUAL) || 0
    });
  });
  
  var config = getConfigList('NAMA_TOKO');
  var namaToko = config && config.length > 0 ? config[0] : 'ServicePro HP';
  
  var nota = {
    id: id,
    tanggal: h.TGL_MASUK || h.TANGGAL,
    cabang: h.CABANG,
    pelanggan: h.NAMA_PELANGGAN,
    telepon: h.TELEPON || '',
    kasir: h.CREATED_BY || '',
    metodeBayar: h.METODE_BAYAR || 'CASH',
    catatan: h.CATATAN || '',
    namaToko: namaToko,
    parts: parts,
    totalPart: isTrx ? 0 : Number(h.TOTAL_JUAL || 0)
  };
  
  if (isTrx) {
    nota.teknisi = h.TEKNISI || '-';
    nota.tipeHp = h.TIPE_HP;
    nota.kerusakan = h.KERUSAKAN;
    nota.status = h.STATUS;
    nota.ongkosKerja = Number(h.ONGKOS_KERJA) || 0;
    
    var totalPartJual = 0;
    parts.forEach(function(p) { totalPartJual += (p.qty * p.hargaJual); });
    nota.totalPart = totalPartJual;
  }
  
  return JSON.parse(JSON.stringify({success: true, nota: nota}));
}

// ======================== PEMBATALAN TRANSAKSI ========================

// List transaksi aktif untuk void (search/filter di frontend)
function getTransaksiUntukBatalList(cabang) {
  var data = getSheetData(SHEET_NAMES.TRANSAKSI);
  if (cabang) data = data.filter(function(r) { return r.CABANG === cabang; });
  return data.map(function(r) {
    return {
      id: String(r.ID_TRANSAKSI || '').trim(),
      tanggal: String(r.TGL_MASUK || '').substring(0, 10),
      pelanggan: r.NAMA_PELANGGAN || '',
      telepon: r.TELEPON || '',
      cabang: r.CABANG || '',
      tipeHP: r.TIPE_HP || '',
      status: r.STATUS || '',
      total: (Number(r.HARGA_JUAL) || 0) + (Number(r.ONGKOS_KERJA) || 0)
    };
  });
}

// List penjualan aktif untuk void
function getPenjualanUntukBatalList(cabang) {
  var data = getSheetData(SHEET_NAMES.PENJUALAN);
  if (cabang) data = data.filter(function(r) { return r.CABANG === cabang; });
  return data.map(function(r) {
    var isBatal = (r.CATATAN || '').indexOf('[BATAL]') !== -1;
    return {
      id: String(r.ID_PENJUALAN || '').trim(),
      tanggal: String(r.TANGGAL || '').substring(0, 10),
      pelanggan: r.NAMA_PELANGGAN || '',
      telepon: r.TELEPON || '',
      cabang: r.CABANG || '',
      keterangan: r.KETERANGAN || '',
      status: isBatal ? 'DIBATALKAN' : 'SELESAI',
      total: Number(r.TOTAL_JUAL) || 0
    };
  });
}

function getTransaksiUntukBatal(id) {
  if (!id) return {success: false, message: 'ID kosong'};
  
  id = String(id).trim().toUpperCase();
  
  var isTrx = id.startsWith('TRX-');
  var isPnj = id.startsWith('PNJ-');
  
  if (!isTrx && !isPnj) return {success: false, message: 'ID harus berawalan TRX- atau PNJ-'};
  
  var sheetName = isTrx ? SHEET_NAMES.TRANSAKSI : SHEET_NAMES.PENJUALAN;
  var detailName = isTrx ? SHEET_NAMES.TRANSAKSI_DETAIL : SHEET_NAMES.PENJUALAN_DETAIL;
  
  var data = getSheetData(sheetName);
  var header = data.find(function(r) { 
    return String(isTrx ? r.ID_TRANSAKSI : r.ID_PENJUALAN).trim().toUpperCase() === id; 
  });
  
  if (!header) return {success: false, message: 'Transaksi tidak ditemukan. Pastikan ID benar (contoh: TRX-20260502-0001)'};
  
  var details = getSheetData(detailName).filter(function(r) {
    return String(isTrx ? r.ID_TRANSAKSI : r.ID_PENJUALAN).trim().toUpperCase() === id;
  });
  
  var status = isTrx ? header.STATUS : (header.CATATAN && header.CATATAN.indexOf('[BATAL]') !== -1 ? 'DIBATALKAN' : 'SELESAI');
  
  var result = {
    id: isTrx ? String(header.ID_TRANSAKSI).trim() : String(header.ID_PENJUALAN).trim(),
    tanggal: isTrx ? String(header.TGL_MASUK).substring(0, 10) : String(header.TANGGAL).substring(0, 10),
    cabang: header.CABANG,
    pelanggan: header.NAMA_PELANGGAN,
    status: status,
    total: isTrx ? ((Number(header.HARGA_JUAL)||0) + (Number(header.ONGKOS_KERJA)||0)) : (Number(header.TOTAL_JUAL)||0),
    parts: details.map(function(d) { return { nama: d.NAMA_PART, qty: d.QTY }; })
  };
  
  return JSON.parse(JSON.stringify({success: true, data: result}));
}

function voidTransaksi(params, _token) {
  requireAuth(_token);
  var id = String(params.id || '').trim();
  var user = params.user || '';
  
  var isTrx = id.startsWith('TRX-');
  var isPnj = id.startsWith('PNJ-');
  if (!isTrx && !isPnj) return {success: false, message: 'Format ID tidak valid (harus TRX- atau PNJ-)'};
  
  var sheetName = isTrx ? SHEET_NAMES.TRANSAKSI : SHEET_NAMES.PENJUALAN;
  var detailName = isTrx ? SHEET_NAMES.TRANSAKSI_DETAIL : SHEET_NAMES.PENJUALAN_DETAIL;
  
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return {success: false, message: 'Sistem sibuk, coba lagi nanti'};
  
  try {
    var ss = getSpreadsheet();
    
    // 1. CEK HEADER
    var shHeader = ss.getSheetByName(sheetName);
    var hData = shHeader.getDataRange().getValues();
    var hRow = -1;
    var currentCatatan = '';
    var statusValue = '';
    var cabangTrx = '';
    
    for (var i = 1; i < hData.length; i++) {
      if (String(hData[i][0]).trim() === id) { // Col 0 is ID, trim() untuk handle spasi Sheets
        hRow = i + 1;
        cabangTrx = hData[i][2]; // CABANG is col 2 in both
        if (isTrx) {
          statusValue = hData[i][24]; // STATUS is col 24
          currentCatatan = hData[i][27]; // CATATAN is col 27
        } else {
          currentCatatan = hData[i][10]; // CATATAN is col 10
        }
        break;
      }
    }
    
    if (hRow === -1) throw new Error('Data header tidak ditemukan di database');
    if (statusValue === 'BATAL' || statusValue === 'DIBATALKAN' || String(currentCatatan).indexOf('[BATAL]') !== -1) {
      throw new Error('Transaksi ini sudah berstatus BATAL');
    }
    
    // 2. KEMBALIKAN STOK
    var details = getSheetData(detailName).filter(function(r) {
      return String(isTrx ? r.ID_TRANSAKSI : r.ID_PENJUALAN).trim() === id;
    });
    
    var shStok = ss.getSheetByName(SHEET_NAMES.STOK_PART);
    var stokData = shStok.getDataRange().getValues();
    
    details.forEach(function(d) {
      var qtyToReturn = Number(d.QTY) || 0;
      if (qtyToReturn > 0) {
        var stokFound = false;
        for (var j = 1; j < stokData.length; j++) {
          // JENIS(1), NAMA(2), SUB(3), MERK(4), SUPPLIER(5), CABANG(6), STOK(7)
          if (stokData[j][1] === d.JENIS_BARANG &&
              stokData[j][2] === d.NAMA_PART &&
              stokData[j][3] === d.SUB_KATEGORI &&
              stokData[j][6] === cabangTrx &&
              // Cocokkan MERK dan SUPPLIER hanya jika data detail punya nilainya
              (!d.MERK_BARANG || stokData[j][4] === d.MERK_BARANG) &&
              (!d.SUPPLIER || stokData[j][5] === d.SUPPLIER)) {
              
            var currentStok = Number(stokData[j][7]) || 0;
            shStok.getRange(j + 1, 8).setValue(currentStok + qtyToReturn);
            stokFound = true;
            break;
          }
        }
        if (!stokFound) {
          // Jika tidak ditemukan di STOK_PART, tambah baris baru
          var newPartId = generateID(ID_PREFIX.PART, SHEET_NAMES.STOK_PART);
          shStok.appendRow([
            newPartId, d.JENIS_BARANG, d.NAMA_PART, d.SUB_KATEGORI, d.MERK_BARANG,
            d.SUPPLIER, cabangTrx, qtyToReturn, d.HARGA_BELI || 0, d.HARGA_JUAL || 0, 'AKTIF'
          ]);
        }
      }
    });
    
    // 2b. CATAT RIWAYAT PART (PENGEMBALIAN STOK)
    details.forEach(function(d) {
      var qtyToReturn = Number(d.QTY) || 0;
      if (qtyToReturn > 0) {
        catatRiwayatPart({
          jenisTransaksi: 'PEMBATALAN',
          jenisBarang: d.JENIS_BARANG || '',
          namaPart: d.NAMA_PART,
          subKategori: d.SUB_KATEGORI || '',
          merkBarang: d.MERK_BARANG || '',
          supplier: d.SUPPLIER || '',
          cabang: cabangTrx,
          qty: qtyToReturn,
          tipe: 'VOID_MASUK',
          idReferensi: id,
          keterangan: 'Pengembalian stok void transaksi ' + id
        });
      }
    });
    
    // 3. REVERSE KAS HARIAN
    var shKas = ss.getSheetByName(SHEET_NAMES.KAS_HARIAN);
    var kasData = shKas.getDataRange().getValues();
    var kasReversalRows = [];
    
    for (var k = 1; k < kasData.length; k++) {
      if (String(kasData[k][9]).trim() === id) { // ID_TRANSAKSI is col 9
        // 0 ID_KAS, 1 TGL, 2 CABANG, 3 JENIS, 4 METODE, 5 KATEGORI, 6 KETERANGAN, 7 JUMLAH, 8 SUMBER, 9 ID_TRX, 10 CREATED_BY
        var reverseJenis = kasData[k][3] === 'MASUK' ? 'KELUAR' : 'MASUK';
        var nominal = Number(kasData[k][7]) || 0;
        
        var newKasId = generateID(ID_PREFIX.KAS, SHEET_NAMES.KAS_HARIAN);
        kasReversalRows.push([
          newKasId, getTimestamp(), kasData[k][2], reverseJenis, kasData[k][4],
          'PEMBATALAN', 'Void Trx: ' + id, nominal, kasData[k][8], id, user
        ]);
      }
    }
    
    kasReversalRows.forEach(function(row) {
      shKas.appendRow(row);
    });
    
    // 4. BATALKAN PIUTANG (JIKA ADA)
    var shPiutang = ss.getSheetByName(SHEET_NAMES.PIUTANG);
    var piutangData = shPiutang.getDataRange().getValues();
    for (var p = 1; p < piutangData.length; p++) {
      if (String(piutangData[p][9]).trim() === id) { // ID_TRANSAKSI is col 9
        shPiutang.getRange(p + 1, 8).setValue('BATAL'); // STATUS_BAYAR (col 7 -> idx 8 in 1-based getRange? Wait. Col 7 idx is col 8. Let's count: 0 ID, 1 TGL, 2 CABANG, 3 NAMA, 4 TLP, 5 KET, 6 JUMLAH, 7 STATUS_BAYAR. So 7 is col H (8).)
        shPiutang.getRange(p + 1, 7).setValue(0); // Set JUMLAH to 0
      }
    }
    
    // 5. UPDATE HEADER (ZERO NOMINALS & BATAL)
    if (isTrx) {
      // 15 QTY, 16 HB, 17 HJ, 18 ONGKOS, 19 TMODAL, 20 L_KOTOR, 21 KOMISI, 22 L_BERSIH (1-based index is +1)
      for (var col = 16; col <= 23; col++) {
        shHeader.getRange(hRow, col).setValue(0);
      }
      shHeader.getRange(hRow, 25).setValue('BATAL'); // STATUS
      shHeader.getRange(hRow, 28).setValue(currentCatatan + ' [BATAL]'); // CATATAN
    } else {
      // PENJUALAN: 5 TQTY, 6 TMODAL, 7 TJUAL, 8 LKOTOR
      for (var col = 6; col <= 9; col++) {
        shHeader.getRange(hRow, col).setValue(0);
      }
      shHeader.getRange(hRow, 11).setValue(currentCatatan + ' [BATAL]'); // CATATAN
    }
    
    // 6. ZERO OUT DETAIL
    var detailRows = shHeader.getParent().getSheetByName(detailName).getDataRange().getValues();
    for (var dIdx = 1; dIdx < detailRows.length; dIdx++) {
      if (String(detailRows[dIdx][0]).trim() === id) {
        // 7 QTY, 8 HB, 9 HJ, 10 TMODAL, 11 TJUAL
        for (var col = 8; col <= 12; col++) {
          shHeader.getParent().getSheetByName(detailName).getRange(dIdx + 1, col).setValue(0);
        }
      }
    }
    
    // 7. LOG
    logActivity(user, 'VOID', 'Membatalkan transaksi ' + id, cabangTrx, id);
    // Telegram notification
    try { sendTelegramNotif('VOID_TRANSAKSI', {id:id, cabang:cabangTrx}); } catch(e) {}

    lock.releaseLock();
    return {success: true, message: 'Transaksi berhasil dibatalkan'};
    
  } catch(e) {
    if (lock) lock.releaseLock();
    return {success: false, message: e.message};
  }
}

function updateTransaksiHeader(id, data) {
  try {
    var sh = getSheet(SHEET_NAMES.TRANSAKSI);
    var row = findRowByID(SHEET_NAMES.TRANSAKSI, id);
    if (!row) return {success: false, message: 'Transaksi tidak ditemukan'};
    
    // Update data
    var updates = {
      NAMA_PELANGGAN: data.NAMA_PELANGGAN,
      TELEPON: data.TELEPON,
      TIPE_HP: data.TIPE_HP,
      KERUSAKAN: data.KERUSAKAN
    };
    
    updateRow(SHEET_NAMES.TRANSAKSI, row._rowIndex, updates);
    logActivity(data.createdBy || 'SYSTEM', 'EDIT_TRANSAKSI', 'Update data pelanggan transaksi ' + id, row.CABANG, id);
    
    return {success: true, message: 'Data transaksi berhasil diperbarui'};
  } catch (e) {
    return {success: false, message: 'Error: ' + e.message};
  }
}

/**
 * ============================================================
 * ServicePro HP v5.1 — StatusHelper.gs
 * Update status, edit part, dashboard data aggregation
 * ============================================================
 */

function updateStatus(idTrx, newStatus, data, _token) {
  var lock = LockService.getScriptLock();
  try {
    requireAuth(_token);
    lock.waitLock(30000);
    var trx = findRowByID(SHEET_NAMES.TRANSAKSI, idTrx);
    if (!trx) return {success:false, message:'Transaksi tidak ditemukan'};

    var updates = {STATUS: newStatus, UPDATED_AT: getTimestamp()};
    var ts = getTimestamp();
    var pendapatan = (Number(trx.HARGA_JUAL)||0) + (Number(trx.ONGKOS_KERJA)||0);

    // Handle specific status transitions
    if (newStatus === 'SELESAI_BELUM_DIAMBIL' || newStatus === 'SELESAI_DIAMBIL') {
      updates.TGL_SELESAI = ts;
    }

    // ===== TRANSISI KE SELESAI_DIAMBIL =====
    // Uang BARU masuk kas saat pelanggan mengambil HP dan membayar
    if (newStatus === 'SELESAI_DIAMBIL') {
      updates.TGL_DIAMBIL = ts;
      var metodeBayar = (data && data.metodeBayar) ? data.metodeBayar : trx.METODE_BAYAR;
      if (data && data.metodeBayar) updates.METODE_BAYAR = data.metodeBayar;

      // Cek apakah kas BELUM pernah dibuat untuk transaksi ini
      // (Kas sudah dibuat jika saveTransaksi langsung SELESAI_DIAMBIL, atau jika sudah pernah di-update ke SELESAI_DIAMBIL)
      var kasAlreadyExists = false;
      try {
        var existingKas = getSheetData(SHEET_NAMES.KAS_HARIAN).filter(function(k) {
          return String(k.ID_TRANSAKSI||'').trim() === String(idTrx).trim() &&
                 k.JENIS === 'MASUK' && k.KATEGORI !== 'PEMBATALAN';
        });
        kasAlreadyExists = existingKas.length > 0;
      } catch(e) { /* abaikan error — anggap belum ada */ }

      if (!kasAlreadyExists && pendapatan > 0) {
        if (metodeBayar.indexOf('SPLIT:') === 0) {
          // SPLIT payment — parse dan buat kas/piutang per komponen
          var splitParts = metodeBayar.substring(6).split(':');
          for (var si = 0; si < splitParts.length - 1; si += 2) {
            var splitMetode = splitParts[si];
            var splitJumlah = Number(splitParts[si + 1]) || 0;
            if (splitJumlah > 0 && splitMetode === 'BON') {
              createPiutangEntry({cabang:trx.CABANG, namaPelanggan:trx.NAMA_PELANGGAN,
                telepon:trx.TELEPON||'', keterangan:'Service '+trx.TIPE_HP+' (BON)',
                jumlah:splitJumlah, idTransaksi:idTrx, createdBy:(data?data.createdBy:'')});
            } else if (splitJumlah > 0) {
              createKasEntry({cabang:trx.CABANG, jenis:'MASUK', metodeBayar:splitMetode,
                kategori:'SERVICE', keterangan:'Service '+trx.TIPE_HP+' - '+trx.NAMA_PELANGGAN,
                jumlah:splitJumlah, sumber:'TRANSAKSI', idTransaksi:idTrx, createdBy:(data?data.createdBy:'')});
            }
          }
          // Jika ada komponen BON, status jadi SELESAI_BELUM_LUNAS
          if (metodeBayar.indexOf(':BON:') !== -1) {
            newStatus = 'SELESAI_BELUM_LUNAS';
            updates.STATUS = 'SELESAI_BELUM_LUNAS';
          }
          // Lunasi piutang lama jika sebelumnya BON
          if (trx.METODE_BAYAR === 'BON') {
            var piutangData = getSheetData(SHEET_NAMES.PIUTANG, 'ID_TRANSAKSI', idTrx);
            piutangData.forEach(function(p) {
              if (p.STATUS_BAYAR === 'BELUM_LUNAS') {
                updateRow(SHEET_NAMES.PIUTANG, p._rowIndex, {STATUS_BAYAR:'LUNAS', TGL_LUNAS:ts});
              }
            });
          }
        } else if (metodeBayar === 'BON') {
          // BON = piutang, bukan kas. Ubah status jadi SELESAI_BELUM_LUNAS
          createPiutangEntry({cabang:trx.CABANG, namaPelanggan:trx.NAMA_PELANGGAN,
            telepon:trx.TELEPON||'', keterangan:'Service '+trx.TIPE_HP,
            jumlah:pendapatan, idTransaksi:idTrx, createdBy:(data?data.createdBy:'')});
          newStatus = 'SELESAI_BELUM_LUNAS';
          updates.STATUS = 'SELESAI_BELUM_LUNAS';
        } else if (metodeBayar && metodeBayar !== 'BON') {
          // CASH/TRANSFER → masuk kas harian
          createKasEntry({cabang:trx.CABANG, jenis:'MASUK', metodeBayar:metodeBayar,
            kategori:'SERVICE', keterangan:'Service '+trx.TIPE_HP+' - '+trx.NAMA_PELANGGAN,
            jumlah:pendapatan, sumber:'TRANSAKSI', idTransaksi:idTrx, createdBy:(data?data.createdBy:'')});

          // Jika sebelumnya BON → lunasi piutang yang ada
          if (trx.METODE_BAYAR === 'BON') {
            var piutangData = getSheetData(SHEET_NAMES.PIUTANG, 'ID_TRANSAKSI', idTrx);
            piutangData.forEach(function(p) {
              if (p.STATUS_BAYAR === 'BELUM_LUNAS') {
                updateRow(SHEET_NAMES.PIUTANG, p._rowIndex, {STATUS_BAYAR:'LUNAS', TGL_LUNAS:ts});
              }
            });
          }
        }
      }
    }

    // ===== TRANSISI KE SELESAI_BELUM_LUNAS =====
    // Piutang dibuat saat status menunjukkan HP diambil tapi belum bayar
    if (newStatus === 'SELESAI_BELUM_LUNAS' && trx.STATUS !== 'SELESAI_BELUM_LUNAS') {
      // Cek piutang belum ada
      var existingPiutang = getSheetData(SHEET_NAMES.PIUTANG, 'ID_TRANSAKSI', idTrx).filter(function(p) {
        return p.STATUS_BAYAR === 'BELUM_LUNAS';
      });
      if (existingPiutang.length === 0 && pendapatan > 0) {
        createPiutangEntry({cabang:trx.CABANG, namaPelanggan:trx.NAMA_PELANGGAN,
          telepon:trx.TELEPON||'', keterangan:'Service '+trx.TIPE_HP,
          jumlah:pendapatan, idTransaksi:idTrx, createdBy:(data?data.createdBy:'')});
      }
      updates.METODE_BAYAR = 'BON';
    }

    // ===== BATAL =====
    if (newStatus === 'BATAL') {
      var voidResult = voidTransaksi({id: idTrx, user: data ? data.createdBy : ''});
      if (!voidResult.success) {
        return {success: false, message: 'Gagal membatalkan transaksi: ' + voidResult.message};
      }
      return {success: true, message: 'Transaksi berhasil dibatalkan beserta stok dan kas.'};
    }

    // Update teknisi if provided
    if (data && data.teknisi) updates.TEKNISI = data.teknisi;
    if (data && data.catatan) updates.CATATAN = data.catatan;
    if (data && data.metodeBayar && !updates.METODE_BAYAR) updates.METODE_BAYAR = data.metodeBayar;

    updateRow(SHEET_NAMES.TRANSAKSI, trx._rowIndex, updates);
    logActivity(data?data.createdBy:'', 'UPDATE_STATUS', idTrx+': '+trx.STATUS+' → '+newStatus, trx.CABANG, idTrx);
    SpreadsheetApp.flush();
    // Telegram notification
    try {
      sendTelegramNotif('STATUS_UPDATE', {id:idTrx, nama:trx.NAMA_PELANGGAN, statusLama:trx.STATUS, statusBaru:newStatus, total:trx.TOTAL_MODAL, metodeBayar:updates.METODE_BAYAR||trx.METODE_BAYAR, cabang:trx.CABANG});
      if (newStatus === 'SELESAI_BELUM_LUNAS' || (newStatus==='SELESAI_DIAMBIL' && trx.METODE_BAYAR==='BON')) {
        var pendapatan = Number(trx.LABA_BERSIH)||0 + Number(trx.ONGKOS)||0;
        sendTelegramNotif('BON_DIBERIKAN', {id:idTrx, nama:trx.NAMA_PELANGGAN, nominal:pendapatan, teknisi:trx.TEKNISI, cabang:trx.CABANG});
      }
      // Non-tunai selesai (TRANSFER) masuk kas
      if (newStatus === 'SELESAI_DIAMBIL' && (updates.METODE_BAYAR==='TRANSFER' || trx.METODE_BAYAR==='TRANSFER')) {
        var pendapatan2 = Number(trx.LABA_BERSIH)||0 + Number(trx.ONGKOS)||0;
        sendTelegramNotif('NON_TUNAI_MASUK', {id:idTrx, nama:trx.NAMA_PELANGGAN, nominal:pendapatan2, metodeBayar:'TRANSFER', cabang:trx.CABANG, tipeHp:trx.TIPE_HP});
      }
    } catch(e) { Logger.log('TG notif: '+e.message); }
    return {success:true, message:'Status berhasil diupdate ke '+newStatus};
  } catch(e) {
    return {success:false, message:'Error: '+safeError(e)};
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pelunasan BON — ubah metode bayar dari BON ke Cash/Transfer
 * tanpa harus mengubah status transaksi
 */
// Get piutang list with filtering
function getPiutangList(params) {
  try {
    var data = getSheetData(SHEET_NAMES.PIUTANG);
    if (!params) params = {};

    // Filter by cabang
    if (params.cabang) {
      data = data.filter(function(r) { return r.CABANG === params.cabang; });
    }

    // Filter by date range
    if (params.startDate) {
      var sdStr = String(params.startDate).substring(0, 10);
      var edStr = String(params.endDate || params.startDate).substring(0, 10);
      data = data.filter(function(r) {
        var d = String(r.TANGGAL || '');
        if (d.length > 10) d = d.substring(0, 10);
        return d >= sdStr && d <= edStr;
      });
    }

    // Sort by date descending
    data.sort(function(a, b) {
      var da = new Date(a.TANGGAL || 0).getTime();
      var db = new Date(b.TANGGAL || 0).getTime();
      return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
    });

    return data;
  } catch(e) {
    return [];
  }
}

function lunasiBon(idTrx, metodeBayar, createdBy, _token) {
  var lock = LockService.getScriptLock();
  try {
    requireAuth(_token);
    lock.waitLock(30000);
    var trx = findRowByID(SHEET_NAMES.TRANSAKSI, idTrx);
    if (!trx) return {success:false, message:'Transaksi tidak ditemukan'};

    // Accept both pure BON and SPLIT with BON component
    var isBON = trx.METODE_BAYAR === 'BON';
    var isSplitBON = trx.METODE_BAYAR.indexOf('SPLIT:') === 0 && trx.METODE_BAYAR.indexOf(':BON:') !== -1;
    if (!isBON && !isSplitBON) return {success:false, message:'Transaksi ini bukan BON/Split dengan BON'};

    var ts = getTimestamp();

    // Get BON amount from PIUTANG sheet (the actual unpaid amount)
    var piutangData = getSheetData(SHEET_NAMES.PIUTANG, 'ID_TRANSAKSI', idTrx)
      .filter(function(p) { return p.STATUS_BAYAR === 'BELUM_LUNAS'; });
    var bonAmount = 0;
    piutangData.forEach(function(p) { bonAmount += Number(p.JUMLAH) || 0; });

    if (bonAmount <= 0) return {success:false, message:'Tidak ada piutang aktif untuk transaksi ini'};

    // Catat kas masuk — use BON amount, not full pendapatan
    if (bonAmount > 0) {
      if (metodeBayar.indexOf('SPLIT:') === 0) {
        var splitParts = metodeBayar.substring(6).split(':');
        for (var si = 0; si < splitParts.length - 1; si += 2) {
          var splitMetode = splitParts[si];
          var splitJumlah = Number(splitParts[si + 1]) || 0;
          if (splitJumlah > 0) {
            createKasEntry({cabang:trx.CABANG, jenis:'MASUK', metodeBayar:splitMetode,
              kategori:'SERVICE', keterangan:'Pelunasan BON '+idTrx+' - '+trx.NAMA_PELANGGAN+' ('+splitMetode+')',
              jumlah:splitJumlah, sumber:'TRANSAKSI', idTransaksi:idTrx, createdBy:createdBy||''});
          }
        }
      } else {
        createKasEntry({cabang:trx.CABANG, jenis:'MASUK', metodeBayar:metodeBayar,
          kategori:'SERVICE', keterangan:'Pelunasan BON '+idTrx+' - '+trx.NAMA_PELANGGAN,
          jumlah:bonAmount, sumber:'TRANSAKSI', idTransaksi:idTrx, createdBy:createdBy||''});
      }
    }

    // Update piutang ke LUNAS
    piutangData.forEach(function(p) {
      updateRow(SHEET_NAMES.PIUTANG, p._rowIndex, {STATUS_BAYAR:'LUNAS', TGL_LUNAS:ts});
    });

    // Update metode bayar di transaksi
    var trxUpdates = {METODE_BAYAR: metodeBayar, UPDATED_AT: ts};

    // Update status to SELESAI_DIAMBIL if it was SELESAI_BELUM_LUNAS
    if (trx.STATUS === 'SELESAI_BELUM_LUNAS') {
      trxUpdates.STATUS = 'SELESAI_DIAMBIL';
    }

    updateRow(SHEET_NAMES.TRANSAKSI, trx._rowIndex, trxUpdates);
    logActivity(createdBy||'', 'PELUNASAN_BON', idTrx+': BON → '+metodeBayar+' (Rp'+bonAmount+')', trx.CABANG, idTrx);
    SpreadsheetApp.flush();
    // Telegram notification
    try { sendTelegramNotif('BON_LUNAS', {id:idTrx, nama:trx.NAMA_PELANGGAN, nominal:bonAmount, metodeBayar:metodeBayar, cabang:trx.CABANG}); } catch(e) {}

    return {success:true, message:'Pelunasan BON berhasil! '+trx.NAMA_PELANGGAN+' membayar Rp'+bonAmount+' via '+metodeBayar};
  } catch(e) {
    return {success:false, message:'Error: '+safeError(e)};
  } finally {
    lock.releaseLock();
  }
}

function editPart(idTrx, partData, _token) {
  var lock = LockService.getScriptLock();
  try {
    requireAuth(_token);
    lock.waitLock(30000);
    var trx = findRowByID(SHEET_NAMES.TRANSAKSI, idTrx);
    if (!trx) return {success:false, message:'Transaksi tidak ditemukan'};

    // Get old parts and return stock
    var oldParts = getSheetData(SHEET_NAMES.TRANSAKSI_DETAIL, 'ID_TRANSAKSI', idTrx);
    oldParts.forEach(function(op) {
      if (op.NAMA_PART && Number(op.QTY) > 0) {
        addStock(trx.CABANG, op.NAMA_PART, op.MERK_BARANG, op.SUB_KATEGORI, op.SUPPLIER, Number(op.QTY));
        catatRiwayatPart({jenisTransaksi:'EDIT_RETURN', jenisBarang:op.JENIS_BARANG||'', namaPart:op.NAMA_PART, subKategori:op.SUB_KATEGORI||'', merkBarang:op.MERK_BARANG||'',
          supplier: op.SUPPLIER || '',
          cabang:trx.CABANG, qty:Number(op.QTY), tipe:'MASUK', idReferensi:idTrx,
          keterangan:'Edit part - stok dikembalikan'});
      }
    });

    // Delete old detail rows
    var detSheet = getSheet(SHEET_NAMES.TRANSAKSI_DETAIL);
    var detData = detSheet.getDataRange().getValues();
    for (var i = detData.length - 1; i >= 1; i--) {
      if (String(detData[i][0]) === String(idTrx)) {
        detSheet.deleteRow(i + 1);
      }
    }

    // Save new parts
    var newParts = partData.parts || [];
    if (newParts.length > 0) saveTransaksiDetail(idTrx, newParts);

    // Deduct new stock
    var totalModal=0, totalJual=0, totalQty=0;
    var pN=[],pM=[],pK=[],pS=[];
    newParts.forEach(function(p) {
      var q=Number(p.qty)||0, hb=Number(p.hargaBeli)||0, hj=Number(p.hargaJual)||0;
      totalModal+=hb*q; totalJual+=hj*q; totalQty+=q;
      if(p.nama){pN.push(p.nama); deductStock(trx.CABANG,p.nama,p.merkBarang,p.subKategori,p.supplier,q);
        catatRiwayatPart({jenisTransaksi:'EDIT_USE', jenisBarang:p.jenisBarang||'', namaPart:p.nama, subKategori:p.subKategori||'', merkBarang:p.merkBarang||'',
          supplier: p.supplier || '',
          cabang:trx.CABANG, qty:q, tipe:'KELUAR', idReferensi:idTrx, keterangan:'Edit part - part baru', aliasDigunakan: p.aliasDigunakan||''});}
      if(p.merkBarang) pM.push(p.merkBarang);
      if(p.subKategori) pK.push(p.subKategori);
      if(p.supplier) pS.push(p.supplier);
    });

    // Recalculate totals
    var ongkos = Number(partData.ongkosKerja !== undefined ? partData.ongkosKerja : trx.ONGKOS_KERJA) || 0;
    var pend = totalJual + ongkos;
    var lk = pend - totalModal;
    var komPct = Number(getConfigValue('KOMISI_DEFAULT_PERSEN')) || 10;
    var kom = Math.round(lk * komPct / 100);

    updateRow(SHEET_NAMES.TRANSAKSI, trx._rowIndex, {
      NAMA_PART:pN.join(', '), MERK_BARANG:pM.join(', '), SUB_KATEGORI:pK.join(', '),
      SUPPLIER:pS.join(', '), QTY:totalQty, HARGA_BELI:totalModal, HARGA_JUAL:totalJual,
      ONGKOS_KERJA:ongkos, TOTAL_MODAL:totalModal, LABA_KOTOR:lk, KOMISI:kom,
      LABA_BERSIH:lk-kom, UPDATED_AT:getTimestamp(),
      STATUS: partData.status || trx.STATUS,
      TEKNISI: partData.teknisi || trx.TEKNISI
    });

    logActivity(partData.createdBy||'','EDIT_PART',idTrx+' - part diubah',trx.CABANG,idTrx);
    SpreadsheetApp.flush();
    // Telegram notification
    try { sendTelegramNotif('EDIT_PART_MASTER', {id:idTrx, namaPart:partData.nama||'', cabang:trx.CABANG}); } catch(e) {}
    return {success:true, message:'Part berhasil diupdate!'};
  } catch(e) {
    return {success:false, message:'Error: '+safeError(e)};
  } finally {
    lock.releaseLock();
  }
}

// ======================== DASHBOARD DATA ========================

function getDashboardData(cabang, periode) {
  try {
    var trxData = getSheetDataByCabang(SHEET_NAMES.TRANSAKSI, cabang);
    var pnjData = getSheetDataByCabang(SHEET_NAMES.PENJUALAN, cabang);
    var kasData = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang);
    var piutangData = getSheetDataByCabang(SHEET_NAMES.PIUTANG, cabang);
    var hutangData = getSheetDataByCabang(SHEET_NAMES.HUTANG_SUPPLIER, cabang);
    var stokData = getSheetDataByCabang(SHEET_NAMES.STOK_PART, cabang);

    // Filter by period (Improved robust parsing using string comparison)
    if (periode && periode.startDate) {
      var sdStr = String(periode.startDate).substring(0, 10);
      var edStr = String(periode.endDate || periode.startDate).substring(0, 10);
      
      var getRowDateStr = function(tanggal) {
        try {
          if (!tanggal) return '';
          if (tanggal instanceof Date) {
            return Utilities.formatDate(tanggal, 'Asia/Makassar', 'yyyy-MM-dd');
          }
          // Coba parse string tanggal
          var s = String(tanggal);
          // Format ISO: 2026-05-02T... atau 2026-05-02
          if (s.match(/^\d{4}-\d{2}/)) return s.substring(0, 10);
          // Coba parse sebagai Date
          var d = new Date(s);
          if (!isNaN(d.getTime())) {
            return Utilities.formatDate(d, 'Asia/Makassar', 'yyyy-MM-dd');
          }
          return s.substring(0, 10);
        } catch(e) { return ''; }
      };

      trxData = trxData.filter(function(r){ var d = getRowDateStr(r.TGL_MASUK); return d >= sdStr && d <= edStr; });
      pnjData = pnjData.filter(function(r){ var d = getRowDateStr(r.TANGGAL); return d >= sdStr && d <= edStr; });
      kasData = kasData.filter(function(r){ var d = getRowDateStr(r.TANGGAL); return d >= sdStr && d <= edStr; });
    }

    // KPI calculations
    var totalServis = trxData.length;
    var totalPendapatan = 0, totalLaba = 0, totalModal = 0;
    var statusCount = {};
    STATUS_LIST.forEach(function(s){statusCount[s]=0;});
    var metodeCount = {};

    trxData.forEach(function(r) {
      if (r.STATUS !== 'BATAL') {
        totalPendapatan += (Number(r.HARGA_JUAL)||0) + (Number(r.ONGKOS_KERJA)||0);
        totalLaba += Number(r.LABA_BERSIH) || 0;
        totalModal += Number(r.TOTAL_MODAL) || 0;
      }
      // BON yang sudah SELESAI_DIAMBIL tetap dihitung sebagai BELUM_LUNAS di chart
      var chartStatus = r.STATUS;
      if (r.METODE_BAYAR === 'BON' && r.STATUS === 'SELESAI_DIAMBIL') {
        chartStatus = 'SELESAI_BELUM_LUNAS';
      }
      if(statusCount[chartStatus]!==undefined) statusCount[chartStatus]++;
      var m = r.METODE_BAYAR || 'N/A';
      if (m.indexOf('SPLIT:') === 0) m = 'SPLIT';
      metodeCount[m] = (metodeCount[m]||0) + ((Number(r.HARGA_JUAL)||0)+(Number(r.ONGKOS_KERJA)||0));
    });

    // Tambah Penjualan Aksesoris
    var totalPenjualanItem = pnjData.length;
    pnjData.forEach(function(r) {
      totalPendapatan += Number(r.TOTAL_JUAL) || 0;
      totalLaba += Number(r.LABA_KOTOR) || 0;
      totalModal += Number(r.TOTAL_MODAL) || 0;
      var m = r.METODE_BAYAR || 'N/A';
      if (m.indexOf('SPLIT:') === 0) m = 'SPLIT';
      metodeCount[m] = (metodeCount[m]||0) + (Number(r.TOTAL_JUAL)||0);
    });

    // Kas
    var kasMasuk=0, kasKeluar=0;
    kasData.forEach(function(r){
      if(r.JENIS==='MASUK') kasMasuk+=Number(r.JUMLAH)||0;
      else kasKeluar+=Number(r.JUMLAH)||0;
    });

    // Piutang & Hutang
    var totalPiutang=0, totalHutang=0;
    piutangData.forEach(function(r){if(r.STATUS_BAYAR==='BELUM_LUNAS') totalPiutang+=Number(r.JUMLAH)||0;});
    hutangData.forEach(function(r){if(r.STATUS_BAYAR!=='LUNAS') totalHutang+=Number(r.SISA_HUTANG)||0;});

    // Stok overview
    var totalStokItem=0, totalStokNilai=0, lowStok=[];
    var threshold = Number(getConfigValue('LOW_STOCK_THRESHOLD'))||3;
    stokData.forEach(function(r){
      if(r.STATUS==='AKTIF'){
        var s=Number(r.STOK)||0;
        totalStokItem+=s; totalStokNilai+=s*(Number(r.HARGA_BELI)||0);
        if(s<=threshold && s>=0) lowStok.push({nama:r.NAMA_PART,merk:r.MERK_BARANG,cabang:r.CABANG,stok:s});
      }
    });

    // Recent 10 transactions & kas
    var recentTrx = trxData.sort(function(a,b){
      var da = new Date(a.TGL_MASUK||0).getTime();
      var db = new Date(b.TGL_MASUK||0).getTime();
      return (isNaN(db)?0:db) - (isNaN(da)?0:da);
    }).slice(0, 10);
    
    var recentKas = kasData.sort(function(a,b){
      var da = new Date(a.TANGGAL||0).getTime();
      var db = new Date(b.TANGGAL||0).getTime();
      return (isNaN(db)?0:db) - (isNaN(da)?0:da);
    }).slice(0,10);

    var resultData = {
      kpi: {totalServis:totalServis, totalPenjualan:totalPenjualanItem, totalPendapatan:totalPendapatan, totalLaba:totalLaba,
            totalModal:totalModal, kasMasuk:kasMasuk, kasKeluar:kasKeluar, saldo:kasMasuk-kasKeluar,
            totalPiutang:totalPiutang, totalHutang:totalHutang},
      statusCount: statusCount,
      metodeCount: metodeCount,
      stok: {totalItem:totalStokItem, totalNilai:totalStokNilai, lowStok:lowStok},
      recentTrx: recentTrx,
      recentKas: recentKas
    };
    return JSON.parse(JSON.stringify(resultData));
  } catch(e) {
    console.error('getDashboardData error: '+e.message);
    return {kpi:{}, statusCount:{}, metodeCount:{}, stok:{}, recentTrx:[], recentKas:[]};
  }
}

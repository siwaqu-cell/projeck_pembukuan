/**
 * ============================================================
 * ServicePro HP v5.1 — PembelianHelper.gs
 * Purchase from supplier, return to supplier, purchase reports
 * ============================================================
 */

function savePembelian(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    validateRequired(data, ['supplier', 'cabang', 'metodeBayar']);
    var items = data.items || [];
    if (items.length === 0) throw new Error('Tambahkan minimal 1 item');

    var id = generateID(ID_PREFIX.PEMBELIAN, SHEET_NAMES.PEMBELIAN);
    var ts = data.tanggal ? new Date(data.tanggal) : getTimestamp();
    var sh = getSheet(SHEET_NAMES.PEMBELIAN);
    var grandTotal = 0;

    items.forEach(function(item) {
      var q = Number(item.qty)||0, hb = Number(item.hargaBeli)||0;
      var total = hb * q;
      grandTotal += total;

      sh.appendRow([id, ts, data.supplier, data.cabang, data.metodeBayar,
        item.jenisBarang||'', item.nama, item.subKategori||'', item.merkBarang||'', q, hb, total,
        data.catatan||'', 'SELESAI', data.createdBy||'']);

      // Add to stock
      addStock(data.cabang, item.nama, item.merkBarang, item.subKategori, data.supplier, q, hb, Number(item.hargaJual)||0, item.jenisBarang, item.persamaan);

      // Record riwayat
      catatRiwayatPart({jenisTransaksi:'PEMBELIAN', jenisBarang:item.jenisBarang||'', namaPart:item.nama,
        subKategori:item.subKategori||'', merkBarang:item.merkBarang||'', supplier: data.supplier,
        cabang:data.cabang, qty:q, tipe:'MASUK', idReferensi:id,
        keterangan:'Beli dari '+data.supplier});
    });

    // BON: create HUTANG_SUPPLIER
    if (data.metodeBayar === 'BON' && grandTotal > 0) {
      var idH = generateID(ID_PREFIX.HUTANG, SHEET_NAMES.HUTANG_SUPPLIER);
      getSheet(SHEET_NAMES.HUTANG_SUPPLIER).appendRow([idH, ts, data.supplier, data.cabang,
        'Pembelian part - '+id, grandTotal, 0, grandTotal, 'BELUM_LUNAS', '', id, data.createdBy||'']);
    }

    logActivity(data.createdBy,'PEMBELIAN','Beli dari '+data.supplier+' total Rp'+grandTotal,data.cabang,id);
    lock.releaseLock();
    return {success:true, id:id, message:'Pembelian berhasil disimpan! Total: Rp '+grandTotal.toLocaleString('id-ID')};
  } catch(e) {
    if (lock) lock.releaseLock();
    return {success:false, message:'Error: '+e.message};
  }
}

function saveReturn(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    validateRequired(data, ['supplier', 'cabang']);
    var items = data.items || [];
    if (items.length === 0) throw new Error('Tambahkan minimal 1 barang');

    var id = generateID(ID_PREFIX.RETURN, SHEET_NAMES.RETURN_SUPPLIER);
    var ts = getTimestamp();
    var grandTotal = 0;
    
    // First, calculate total return value to deduct from hutang once
    items.forEach(function(item) {
      grandTotal += (Number(item.hargaBeli)||0) * (Number(item.qty)||0);
    });

    // Deduct hutang if requested
    if (data.potongHutang && grandTotal > 0) {
      var sisaHutangDipotong = grandTotal;
      var hutangList = getSheetData(SHEET_NAMES.HUTANG_SUPPLIER).filter(function(h){
        return h.SUPPLIER===data.supplier && h.CABANG===data.cabang && h.STATUS_BAYAR!=='LUNAS';
      });
      hutangList.forEach(function(h){
        if (sisaHutangDipotong <= 0) return;
        var sisa = Number(h.SISA_HUTANG)||0;
        var potong = Math.min(sisaHutangDipotong, sisa);
        if(potong>0){
          var newSisa = sisa - potong;
          updateRow(SHEET_NAMES.HUTANG_SUPPLIER, h._rowIndex, {
            POTONGAN_RETURN: (Number(h.POTONGAN_RETURN)||0)+potong,
            SISA_HUTANG: newSisa,
            STATUS_BAYAR: newSisa<=0?'LUNAS':'BELUM_LUNAS',
            TGL_LUNAS: newSisa<=0?ts:''
          });
          sisaHutangDipotong -= potong;
        }
      });
    }

    var shReturn = getSheet(SHEET_NAMES.RETURN_SUPPLIER);
    var returnNames = [];

    // Loop items to append rows and update stock
    items.forEach(function(item) {
      var q = Number(item.qty)||0, hb = Number(item.hargaBeli)||0;
      var total = hb * q;
      returnNames.push(item.namaPart);

      shReturn.appendRow([id, ts, data.supplier, data.cabang,
        item.jenisBarang||'', item.namaPart, item.subKategori||'', item.merkBarang||'', q, hb, total, data.alasan,
        data.potongHutang?'YA':'TIDAK', data.idBeliRef||'', 'SELESAI', data.createdBy||'']);

      // Deduct stock
      deductStock(data.cabang, item.namaPart, item.merkBarang, item.subKategori, data.supplier, q);

      // Record riwayat
      catatRiwayatPart({jenisTransaksi:'RETURN', jenisBarang:item.jenisBarang||'', namaPart:item.namaPart,
        subKategori:item.subKategori||'', merkBarang:item.merkBarang||'',
        cabang:data.cabang, qty:q, tipe:'KELUAR', idReferensi:id,
        keterangan:'Return ke '+data.supplier+' - '+data.alasan});
    });

    // Jika potong hutang = false, berarti dikembalikan tunai, catat ke Kas Harian
    if (!data.potongHutang && grandTotal > 0) {
      createKasEntry({
        cabang: data.cabang, jenis: 'MASUK', metodeBayar: 'CASH', // Anggap pengembalian cash
        kategori: 'LAIN_LAIN', keterangan: 'Refund Return dari Supplier ' + data.supplier,
        jumlah: grandTotal, sumber: 'RETURN', idTransaksi: id, createdBy: data.createdBy||'SYSTEM'
      });
    }

    logActivity(data.createdBy,'RETURN','Return ke '+data.supplier+' - '+returnNames.join(', '),data.cabang,id);
    lock.releaseLock();
    return {success:true, id:id, message:'Return berhasil disimpan!'};
  } catch(e) {
    if (lock) lock.releaseLock();
    return {success:false, message:'Error: '+e.message};
  }
}

function bayarHutang(data) {
  try {
    validateRequired(data, ['idHutang', 'jumlah', 'metodeBayar']);
    var hutang = findRowByID(SHEET_NAMES.HUTANG_SUPPLIER, data.idHutang);
    if (!hutang) return {success:false, message:'Hutang tidak ditemukan'};

    var bayar = Number(data.jumlah)||0;
    var sisa = (Number(hutang.SISA_HUTANG)||0) - bayar;
    var ts = getTimestamp();

    updateRow(SHEET_NAMES.HUTANG_SUPPLIER, hutang._rowIndex, {
      SISA_HUTANG: Math.max(0, sisa),
      STATUS_BAYAR: sisa<=0?'LUNAS':'BELUM_LUNAS',
      TGL_LUNAS: sisa<=0?ts:''
    });

    // Membuat entry di KAS_PUSAT — pembayaran hutang supplier
    // dilakukan oleh Owner dan tidak mempengaruhi kas harian cabang.
    createKasPusatEntry({
      cabangTerkait: hutang.CABANG,
      jenis: 'KELUAR',
      kategori: 'PEMBAYARAN_HUTANG',
      keterangan: 'Bayar hutang ke ' + hutang.SUPPLIER + ' (Via ' + data.metodeBayar + ')',
      jumlah: bayar,
      sumber: 'HUTANG_SUPPLIER',
      idReferensi: data.idHutang,
      createdBy: data.createdBy
    });

    logActivity(data.createdBy,'BAYAR_HUTANG','Bayar Rp'+bayar+' ke '+hutang.SUPPLIER,hutang.CABANG,data.idHutang);
    return {success:true, message:'Pembayaran hutang berhasil!'};
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function bayarPiutang(data) {
  try {
    validateRequired(data, ['idPiutang', 'jumlah', 'metodeBayar']);
    var pit = findRowByID(SHEET_NAMES.PIUTANG, data.idPiutang);
    if (!pit) return {success:false, message:'Piutang tidak ditemukan'};

    var ts = getTimestamp();
    updateRow(SHEET_NAMES.PIUTANG, pit._rowIndex, {STATUS_BAYAR:'LUNAS', TGL_LUNAS:ts});

    createKasEntry({cabang:pit.CABANG, jenis:'MASUK', metodeBayar:data.metodeBayar,
      kategori:'PELUNASAN_PIUTANG', keterangan:'Pelunasan dari '+pit.NAMA_PELANGGAN,
      jumlah:Number(data.jumlah)||0, sumber:'PIUTANG', idTransaksi:data.idPiutang, createdBy:data.createdBy||''});

    // Update transaksi if linked
    if (pit.ID_TRANSAKSI) {
      var trx = findRowByID(SHEET_NAMES.TRANSAKSI, pit.ID_TRANSAKSI);
      if (trx && trx.STATUS === 'SELESAI_BELUM_LUNAS') {
        updateRow(SHEET_NAMES.TRANSAKSI, trx._rowIndex, {STATUS:'SELESAI_DIAMBIL', METODE_BAYAR:data.metodeBayar, TGL_DIAMBIL:ts, UPDATED_AT:ts});
      }
    }

    logActivity(data.createdBy,'BAYAR_PIUTANG','Pelunasan dari '+pit.NAMA_PELANGGAN,pit.CABANG,data.idPiutang);
    return {success:true, message:'Pelunasan piutang berhasil!'};
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function getHutangList(cabang) {
  return getSheetDataByCabang(SHEET_NAMES.HUTANG_SUPPLIER, cabang);
}

function getPiutangList(cabang) {
  return getSheetDataByCabang(SHEET_NAMES.PIUTANG, cabang);
}

/**
 * ============================================================
 * ServicePro HP v5.1 — TransferHelper.gs
 * Transfer part between branches
 * ============================================================
 */

function saveTransfer(data) {
  try {
    validateRequired(data, ['cabangAsal', 'cabangTujuan', 'namaPart', 'qty']);
    if (data.cabangAsal === data.cabangTujuan) return {success:false, message:'Cabang asal dan tujuan tidak boleh sama'};

    var qty = Number(data.qty) || 0;
    if (qty <= 0) return {success:false, message:'Qty harus lebih dari 0'};

    // Check stock availability
    var stok = getStokByCabang(data.cabangAsal).filter(function(s) {
      return s.nama === data.namaPart && (!data.merkBarang || s.merkBarang === data.merkBarang);
    });
    if (stok.length === 0) return {success:false, message:'Barang tidak ditemukan di cabang asal'};
    if (stok[0].stok < qty) return {success:false, message:'Stok tidak cukup. Tersedia: ' + stok[0].stok};

    var id = generateID(ID_PREFIX.TRANSFER, SHEET_NAMES.TRANSFER_PART);

    // Save transfer record
    getSheet(SHEET_NAMES.TRANSFER_PART).appendRow([
      id, getTimestamp(), data.cabangAsal, data.cabangTujuan,
      data.jenisBarang||'', data.namaPart, data.subKategori||'', data.merkBarang||'', qty,
      data.catatan||'', data.createdBy||''
    ]);

    // Deduct from source
    deductStock(data.cabangAsal, data.namaPart, data.merkBarang, data.subKategori, '', qty);

    // Add to destination
    addStock(data.cabangTujuan, data.namaPart, data.merkBarang, data.subKategori, stok[0].supplier||'',
             qty, stok[0].hargaBeli, stok[0].hargaJual, data.jenisBarang);

    // Record riwayat for both branches
    catatRiwayatPart({jenisTransaksi:'TRANSFER', jenisBarang:data.jenisBarang||'', namaPart:data.namaPart,
      subKategori:data.subKategori||'', merkBarang:data.merkBarang||'', supplier: stok[0].supplier || '',
      cabang:data.cabangAsal, qty:qty, tipe:'TRANSFER_KELUAR', idReferensi:id,
      keterangan:'Transfer ke '+data.cabangTujuan});

    catatRiwayatPart({jenisTransaksi:'TRANSFER', jenisBarang:data.jenisBarang||'', namaPart:data.namaPart,
      subKategori:data.subKategori||'', merkBarang:data.merkBarang||'', supplier: stok[0].supplier || '',
      cabang:data.cabangTujuan, qty:qty, tipe:'TRANSFER_MASUK', idReferensi:id,
      keterangan:'Transfer dari '+data.cabangAsal});

    logActivity(data.createdBy, 'TRANSFER', data.namaPart+' x'+qty+': '+data.cabangAsal+' → '+data.cabangTujuan,
      data.cabangAsal, id);

    return {success:true, id:id, message:'Transfer berhasil! '+data.namaPart+' x'+qty+' dari '+data.cabangAsal+' ke '+data.cabangTujuan};
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function saveTransferMasal(data) {
  try {
    validateRequired(data, ['cabangAsal', 'cabangTujuan']);
    if (data.cabangAsal === data.cabangTujuan) return {success:false, message:'Cabang asal dan tujuan tidak boleh sama'};
    if (!data.items || data.items.length === 0) return {success:false, message:'Keranjang transfer kosong'};

    var idPrefix = generateID(ID_PREFIX.TRANSFER, SHEET_NAMES.TRANSFER_PART) + '_M';
    var errors = [];
    var totalSukses = 0;

    var transferSheet = getSheet(SHEET_NAMES.TRANSFER_PART);
    var ts = getTimestamp();

    data.items.forEach(function(item, idx) {
      try {
        var qty = Number(item.qty) || 0;
        if (qty <= 0) throw new Error('Qty <= 0');

        // Check stock availability
        var stokList = getStokByCabang(data.cabangAsal).filter(function(s) {
          return s.nama === item.namaPart && (!item.merkBarang || s.merkBarang === item.merkBarang);
        });
        if (stokList.length === 0) throw new Error('Barang tidak ditemukan di stok');
        if (stokList[0].stok < qty) throw new Error('Stok tidak cukup');

        var partID = idPrefix + (idx + 1);

        // Save transfer record
        transferSheet.appendRow([
          partID, ts, data.cabangAsal, data.cabangTujuan,
          item.jenisBarang||'', item.namaPart, item.subKategori||'', item.merkBarang||'', qty,
          data.catatan||'', data.createdBy||''
        ]);

        // Deduct from source
        deductStock(data.cabangAsal, item.namaPart, item.merkBarang, item.subKategori, '', qty);

        // Add to destination
        addStock(data.cabangTujuan, item.namaPart, item.merkBarang, item.subKategori, stokList[0].supplier||'',
                 qty, stokList[0].hargaBeli, stokList[0].hargaJual, item.jenisBarang);

        // Record riwayat for both branches
        catatRiwayatPart({jenisTransaksi:'TRANSFER', jenisBarang:item.jenisBarang||'', namaPart:item.namaPart,
          subKategori:item.subKategori||'', merkBarang:item.merkBarang||'', supplier: stokList[0].supplier || '',
          cabang:data.cabangAsal, qty:qty, tipe:'TRANSFER_KELUAR', idReferensi:partID,
          keterangan:'Transfer masal ke '+data.cabangTujuan});

        catatRiwayatPart({jenisTransaksi:'TRANSFER', jenisBarang:item.jenisBarang||'', namaPart:item.namaPart,
          subKategori:item.subKategori||'', merkBarang:item.merkBarang||'', supplier: stokList[0].supplier || '',
          cabang:data.cabangTujuan, qty:qty, tipe:'TRANSFER_MASUK', idReferensi:partID,
          keterangan:'Transfer masal dari '+data.cabangAsal});

        logActivity(data.createdBy, 'TRANSFER_MASAL', item.namaPart+' x'+qty+': '+data.cabangAsal+' → '+data.cabangTujuan, data.cabangAsal, partID);
        totalSukses++;
      } catch(err) {
        errors.push(item.namaPart + ': ' + err.message);
      }
    });

    if (totalSukses === 0) {
      return {success:false, message: 'Gagal semua: ' + errors.join(', ')};
    } else if (errors.length > 0) {
      return {success:true, message: 'Berhasil transfer ' + totalSukses + ' barang. Gagal: ' + errors.join(', ')};
    }

    return {success:true, message:'Transfer masal berhasil untuk ' + totalSukses + ' barang dari ' + data.cabangAsal + ' ke ' + data.cabangTujuan};
  } catch(e) {
    return {success:false, message:'Error sistem: '+e.message};
  }
}

function getTransferHistory(cabang) {
  if (!cabang || cabang === 'SEMUA') return getSheetData(SHEET_NAMES.TRANSFER_PART);
  return getSheetData(SHEET_NAMES.TRANSFER_PART).filter(function(r) {
    return r.CABANG_ASAL === cabang || r.CABANG_TUJUAN === cabang;
  });
}

/**
 * ============================================================
 * ServicePro HP v5.1 — RiwayatHelper.gs
 * Part movement tracking, comprehensive reports
 * ============================================================
 */

// ======================== RINGKASAN HARIAN (TUTUP TOKO) ========================

function getRingkasanHarian(cabang, tanggalAwal, tanggalAkhir) {
  try {
    var tglAwalStr = tanggalAwal ? String(tanggalAwal).substring(0, 10) : Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');
    var tglAkhirStr = tanggalAkhir ? String(tanggalAkhir).substring(0, 10) : tglAwalStr;

    var dAwal = new Date(tglAwalStr + 'T00:00:00');
    var dAkhir = new Date(tglAkhirStr + 'T23:59:59');

    var isDateInRange = function(val) {
      try {
        if (!val) return false;
        var s = '';
        if (val instanceof Date) { s = Utilities.formatDate(val, 'Asia/Makassar', 'yyyy-MM-dd'); }
        else {
          var str = String(val);
          var m = str.match(/^\d{4}-\d{2}-\d{2}/);
          if (m) { s = m[0]; }
          else {
            var dt = new Date(str);
            if (!isNaN(dt.getTime())) s = Utilities.formatDate(dt, 'Asia/Makassar', 'yyyy-MM-dd');
          }
        }
        if (!s) return false;
        var d = new Date(s + 'T12:00:00');
        return d.getTime() >= dAwal.getTime() && d.getTime() <= dAkhir.getTime();
      } catch(e) { return false; }
    };

    // 1. Ambil transaksi service yang selesai di rentang tanggal ini (berdasarkan TGL_MASUK)
    var trxAll = getSheetDataByCabang(SHEET_NAMES.TRANSAKSI, cabang);
    var trxHariIni = trxAll.filter(function(r) {
      return isDateInRange(r.TGL_MASUK) && r.STATUS !== 'BATAL';
    });

    // 2. Pembelian part di rentang tanggal ini
    var beliAll = getSheetDataByCabang(SHEET_NAMES.PEMBELIAN, cabang);
    var beliHariIni = beliAll.filter(function(r) {
      return isDateInRange(r.TANGGAL);
    });

    // 3. Kas Harian di rentang tanggal ini
    var kasAll = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang);
    var kasHariIni = kasAll.filter(function(r) {
      return isDateInRange(r.TANGGAL);
    });

    // 4. Hitung: Uang Jasa (Ongkos Kerja) per Teknisi
    var byTeknisi = {};
    var totalOngkos = 0;
    trxHariIni.forEach(function(r) {
      var tek = r.TEKNISI || 'Belum Ditentukan';
      var ongkos = Number(r.ONGKOS_KERJA) || 0;
      if (!byTeknisi[tek]) byTeknisi[tek] = { ongkos:0, jumlahServis:0 };
      byTeknisi[tek].ongkos += ongkos;
      byTeknisi[tek].jumlahServis++;
      totalOngkos += ongkos;
    });

    // 5. Hitung: Modal Part per Supplier (dari pembelian hari ini)
    var bySupplierBeli = {};
    var totalBeliPart = 0;
    beliHariIni.forEach(function(r) {
      var sup = r.SUPPLIER || 'Lainnya';
      var total = Number(r.TOTAL_BELI) || 0;
      if (!bySupplierBeli[sup]) bySupplierBeli[sup] = { total:0, qty:0, item:0 };
      bySupplierBeli[sup].total += total;
      bySupplierBeli[sup].qty   += Number(r.QTY) || 0;
      bySupplierBeli[sup].item++;
      totalBeliPart += total;
    });

    // 6. Hitung: Modal Part yang dipakai di transaksi (dari kolom TOTAL_MODAL)
    var bySupplierPakai = {};
    var totalModalPakai = 0;
    // Ambil info supplier dari stok
    var stokData = getSheetData(SHEET_NAMES.STOK_PART);
    var partSupMap = {};
    stokData.forEach(function(s) {
      if (s.NAMA_PART) partSupMap[s.NAMA_PART.toUpperCase()] = s.SUPPLIER || 'Lainnya';
    });
    // Dari detail transaksi
    var detailAll = getSheetData(SHEET_NAMES.TRANSAKSI_DETAIL);
    var idSet = {};
    trxHariIni.forEach(function(r) { idSet[r.ID_TRANSAKSI] = true; });
    detailAll.forEach(function(d) {
      if (!idSet[d.ID_TRANSAKSI]) return;
      var sup = d.SUPPLIER || partSupMap[(d.NAMA_PART||'').toUpperCase()] || 'Lainnya';
      var modal = (Number(d.HARGA_BELI)||0) * (Number(d.QTY)||0);
      if (!bySupplierPakai[sup]) bySupplierPakai[sup] = { modal:0, qty:0 };
      bySupplierPakai[sup].modal += modal;
      bySupplierPakai[sup].qty  += Number(d.QTY)||0;
      totalModalPakai += modal;
    });

    // 7. Ringkasan Kas
    var kasMasuk = 0, kasKeluar = 0;
    kasHariIni.forEach(function(r) {
      if (r.JENIS === 'MASUK') kasMasuk += Number(r.JUMLAH)||0;
      else kasKeluar += Number(r.JUMLAH)||0;
    });

    // 8. Ringkasan Servis
    var totalPendapatan = 0, totalLaba = 0, jumlahUnit = trxHariIni.length;
    trxHariIni.forEach(function(r) {
      totalPendapatan += (Number(r.HARGA_JUAL)||0) + (Number(r.ONGKOS_KERJA)||0);
      totalLaba += Number(r.LABA_BERSIH)||0;
    });

    return JSON.parse(JSON.stringify({
      tanggalAwal: tglAwalStr,
      tanggalAkhir: tglAkhirStr,
      cabang: cabang || 'SEMUA',
      ringkasan: {
        jumlahUnit: jumlahUnit,
        totalPendapatan: totalPendapatan,
        totalModalPakai: totalModalPakai,
        totalBeliPart: totalBeliPart,
        totalOngkos: totalOngkos,
        totalLaba: totalLaba,
        kasMasuk: kasMasuk,
        kasKeluar: kasKeluar,
        kasSaldo: kasMasuk - kasKeluar
      },
      byTeknisi: byTeknisi,
      bySupplierPakai: bySupplierPakai,
      bySupplierBeli: bySupplierBeli,
      kasDetail: kasHariIni
    }));
  } catch(e) {
    console.error('getRingkasanHarian error: ' + e.message);
    return { tanggal:'', ringkasan:{}, byTeknisi:{}, bySupplierPakai:{}, bySupplierBeli:{}, kasDetail:[], error: e.message };
  }
}

function catatRiwayatPart(data) {
  try {
    var id = generateID(ID_PREFIX.RIWAYAT, SHEET_NAMES.RIWAYAT_PART);
    var tgl = data.tanggal ? data.tanggal : getTimestamp();
    // Jika ada aliasDigunakan, tambahkan ke keterangan agar CCTV Part lengkap
    var ket = data.keterangan || '';
    if (data.aliasDigunakan && data.aliasDigunakan !== '') {
      ket += ' [Alias: ' + data.aliasDigunakan + ']';
    }
    getSheet(SHEET_NAMES.RIWAYAT_PART).appendRow([
      id, tgl, data.jenisTransaksi||'', data.jenisBarang||'', data.namaPart||'',
      data.subKategori||'', data.merkBarang||'', data.supplier||'',
      data.cabang||'', Number(data.qty)||0, data.tipe||'', data.idReferensi||'', ket
    ]);
    return id;
  } catch(e) {
    console.error('catatRiwayatPart error: '+e.message);
    return '';
  }
}

function getRiwayatPart(filter) {
  var data = getSheetData(SHEET_NAMES.RIWAYAT_PART);
  
  // Fill missing SUPPLIER for old data only
  var stokData = getSheetData(SHEET_NAMES.STOK_PART);
  var partToSupplier = {};
  stokData.forEach(function(s) {
    if (s.NAMA_PART && s.CABANG) {
      partToSupplier[s.NAMA_PART + '|' + s.CABANG] = s.SUPPLIER || '';
    }
  });

  data.forEach(function(r) {
    // 1. Jika kolom SUPPLIER kosong, coba ambil dari KETERANGAN (Kasus Pembelian)
    if (!r.SUPPLIER || r.SUPPLIER === '') {
      var ket = String(r.KETERANGAN || '');
      if (ket.indexOf('Beli dari ') !== -1) {
        r.SUPPLIER = ket.replace('Beli dari ', '').trim();
      }
    }

    // 2. Jika masih kosong, baru gunakan penebak stok sebagai cadangan terakhir
    if (!r.SUPPLIER || r.SUPPLIER === '') {
      var key = r.NAMA_PART + '|' + r.CABANG + '|' + (r.MERK_BARANG||'');
      r.SUPPLIER = partToSupplier[key] || '';
    }
  });

  if (filter) {
    if (filter.cabang && filter.cabang !== 'SEMUA')
      data = data.filter(function(r){return r.CABANG===filter.cabang;});
    if (filter.namaPart) {
      var q = filter.namaPart.toUpperCase();
      data = data.filter(function(r){return String(r.NAMA_PART).toUpperCase().indexOf(q)!==-1;});
    }
    if (filter.tipe && filter.tipe !== 'SEMUA')
      data = data.filter(function(r){return r.TIPE===filter.tipe;});
    if (filter.jenisBarang && filter.jenisBarang !== 'SEMUA')
      data = data.filter(function(r){return r.JENIS_BARANG===filter.jenisBarang;});
    if (filter.subKategori && filter.subKategori !== 'SEMUA')
      data = data.filter(function(r){return r.SUB_KATEGORI===filter.subKategori;});
    if (filter.merkBarang && filter.merkBarang !== 'SEMUA')
      data = data.filter(function(r){return r.MERK_BARANG===filter.merkBarang;});
    if (filter.supplier && filter.supplier !== 'SEMUA')
      data = data.filter(function(r){return r.SUPPLIER===filter.supplier;});
    
    if (filter.startDate) {
      var sdStr = String(filter.startDate).substring(0, 10);
      data = data.filter(function(r){
        try {
          var rowDate;
          if (r.TANGGAL instanceof Date) rowDate = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
          else rowDate = String(r.TANGGAL || '').substring(0, 10);
          return rowDate >= sdStr;
        } catch(e) { return true; }
      });
    }
    if (filter.endDate) {
      var edStr = String(filter.endDate).substring(0, 10);
      data = data.filter(function(r){
        try {
          var rowDate;
          if (r.TANGGAL instanceof Date) rowDate = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
          else rowDate = String(r.TANGGAL || '').substring(0, 10);
          return rowDate <= edStr;
        } catch(e) { return true; }
      });
    }
  }
  data.sort(function(a,b){
    try { return parseDate(b.TANGGAL)-parseDate(a.TANGGAL); } catch(e) { return 0; }
  });
  
  // Calculate Totals for Arus Barang report
  var totals = {masuk: 0, keluar: 0};
  data.forEach(function(r) {
    if (r.TIPE === 'MASUK' || r.TIPE === 'TRANSFER_MASUK') totals.masuk += (Number(r.QTY) || 0);
    else if (r.TIPE === 'KELUAR' || r.TIPE === 'TRANSFER_KELUAR') totals.keluar += (Number(r.QTY) || 0);
  });
  
  return JSON.parse(JSON.stringify({riwayat: data, totals: totals}));
}

// ======================== LAPORAN LENGKAP ========================

// ======================== LAPORAN SERVISAN ========================

function getLaporanServisan(cabang, filter) {
  try {
    var getRowDateStr = function(tanggal) {
      try {
        if (!tanggal) return '';
        if (tanggal instanceof Date) return Utilities.formatDate(tanggal, 'Asia/Makassar', 'yyyy-MM-dd');
        var s = String(tanggal);
        if (s.match(/^\d{4}-\d{2}/)) return s.substring(0, 10);
        var d = new Date(s);
        if (!isNaN(d.getTime())) return Utilities.formatDate(d, 'Asia/Makassar', 'yyyy-MM-dd');
        return s.substring(0, 10);
      } catch(e) { return ''; }
    };

    var sdStr = filter && filter.startDate ? String(filter.startDate).substring(0, 10) : '';
    var edStr = filter && filter.endDate   ? String(filter.endDate).substring(0, 10) : '';
    var statusFilter = filter && filter.status ? filter.status : '';
    var searchQ = filter && filter.search ? String(filter.search).toUpperCase() : '';

    var trxAll = getSheetDataByCabang(SHEET_NAMES.TRANSAKSI, cabang);

    // Filter tanggal
    var trx = trxAll.filter(function(r) {
      var d = getRowDateStr(r.TGL_MASUK);
      if (sdStr && d < sdStr) return false;
      if (edStr && d > edStr) return false;
      return true;
    });

    // Filter status
    if (statusFilter) trx = trx.filter(function(r) { return r.STATUS === statusFilter; });

    // Filter search
    if (searchQ) trx = trx.filter(function(r) {
      return String(r.ID_TRANSAKSI||'').toUpperCase().indexOf(searchQ) !== -1 ||
             String(r.NAMA_PELANGGAN||'').toUpperCase().indexOf(searchQ) !== -1 ||
             String(r.TIPE_HP||'').toUpperCase().indexOf(searchQ) !== -1 ||
             String(r.KERUSAKAN||'').toUpperCase().indexOf(searchQ) !== -1;
    });

    // Sort terbaru dulu
    trx.sort(function(a,b) {
      var da = getRowDateStr(a.TGL_MASUK), db = getRowDateStr(b.TGL_MASUK);
      return db > da ? 1 : db < da ? -1 : 0;
    });

    // Summary
    var summary = { total:0, selesai:0, proses:0, batal:0, totalPendapatan:0, totalModal:0, totalLabaKotor:0, totalLabaBersih:0 };
    var byCabang = {};

    trx.forEach(function(r) {
      summary.total++;
      var st = r.STATUS || '';
      if (st === 'BATAL') summary.batal++;
      else if (st === 'SELESAI_DIAMBIL' || st === 'SELESAI_BELUM_DIAMBIL' || st === 'SELESAI_BELUM_LUNAS') summary.selesai++;
      else summary.proses++;

      if (st !== 'BATAL') {
        var pend = (Number(r.HARGA_JUAL)||0) + (Number(r.ONGKOS_KERJA)||0);
        summary.totalPendapatan += pend;
        summary.totalModal      += Number(r.TOTAL_MODAL)||0;
        summary.totalLabaKotor  += Number(r.LABA_KOTOR)||0;
        summary.totalLabaBersih += Number(r.LABA_BERSIH)||0;
      }

      // By cabang breakdown
      var cab = r.CABANG || 'LAINNYA';
      if (!byCabang[cab]) {
        byCabang[cab] = { total:0, pendapatan:0, labaBersih:0, statusCount:{} };
      }
      byCabang[cab].total++;
      byCabang[cab].statusCount[st] = (byCabang[cab].statusCount[st]||0) + 1;
      if (st !== 'BATAL') {
        byCabang[cab].pendapatan += (Number(r.HARGA_JUAL)||0) + (Number(r.ONGKOS_KERJA)||0);
        byCabang[cab].labaBersih += Number(r.LABA_BERSIH)||0;
      }
    });

    return JSON.parse(JSON.stringify({ list:trx, summary:summary, byCabang:byCabang }));
  } catch(e) {
    console.error('getLaporanServisan error: ' + e.message);
    return { list:[], summary:{}, byCabang:{}, error: e.message };
  }
}

function getLaporanLengkap(cabang, periode) {
  var sdStr = periode && periode.startDate ? String(periode.startDate).substring(0, 10) : Utilities.formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'Asia/Makassar', 'yyyy-MM-dd');
  var edStr = periode && periode.endDate ? String(periode.endDate).substring(0, 10) : Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');

  var getRowDateStr = function(tanggal) {
    try {
      if (tanggal instanceof Date) {
        return Utilities.formatDate(tanggal, 'Asia/Makassar', 'yyyy-MM-dd');
      }
      return String(tanggal || '').substring(0, 10);
    } catch(e) { return ''; }
  };

  var trx = getSheetDataByCabang(SHEET_NAMES.TRANSAKSI, cabang).filter(function(r){
    var d = getRowDateStr(r.TGL_MASUK); return d >= sdStr && d <= edStr;
  });
  var kas = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang).filter(function(r){
    var d = getRowDateStr(r.TANGGAL); return d >= sdStr && d <= edStr;
  });
  var beli = getSheetDataByCabang(SHEET_NAMES.PEMBELIAN, cabang).filter(function(r){
    var d = getRowDateStr(r.TANGGAL); return d >= sdStr && d <= edStr;
  });
  var pnj = getSheetDataByCabang(SHEET_NAMES.PENJUALAN, cabang).filter(function(r){
    var d = getRowDateStr(r.TANGGAL); return d >= sdStr && d <= edStr;
  });

  // Revenue breakdown
  var rev = {service:0, ongkos:0, penjualan:0, total:0};
  var expense = {part:0, total:0};
  var profit = {kotor:0, komisi:0, bersih:0};
  var byTeknisi = {};
  var rugiList = [];

  trx.forEach(function(r){
    if (r.STATUS !== 'BATAL' && (Number(r.LABA_KOTOR)||0) <= 0) {
      rugiList.push({
        id: r.ID_TRANSAKSI,
        tanggal: getRowDateStr(r.TGL_MASUK),
        pelanggan: r.NAMA_PELANGGAN,
        keterangan: 'Servis: ' + (r.TIPE_HP || ''),
        labaKotor: Number(r.LABA_KOTOR)||0
      });
    }

    rev.service += Number(r.HARGA_JUAL)||0;
    rev.ongkos += Number(r.ONGKOS_KERJA)||0;
    profit.kotor += Number(r.LABA_KOTOR)||0;
    profit.komisi += Number(r.KOMISI)||0;
    profit.bersih += Number(r.LABA_BERSIH)||0;
    expense.part += Number(r.TOTAL_MODAL)||0;
    var tek = r.TEKNISI || 'Belum Ditentukan';
    if(!byTeknisi[tek]) byTeknisi[tek] = {count:0, revenue:0, komisi:0};
    byTeknisi[tek].count++;
    byTeknisi[tek].revenue += (Number(r.HARGA_JUAL)||0)+(Number(r.ONGKOS_KERJA)||0);
    byTeknisi[tek].komisi += Number(r.KOMISI)||0;
  });
  
  pnj.forEach(function(r){
    if (r.STATUS !== 'BATAL' && (Number(r.LABA_KOTOR)||0) <= 0) {
      rugiList.push({
        id: r.ID_PENJUALAN,
        tanggal: getRowDateStr(r.TANGGAL),
        pelanggan: r.NAMA_PELANGGAN,
        keterangan: 'Penjualan Aksesoris',
        labaKotor: Number(r.LABA_KOTOR)||0
      });
    }

    rev.penjualan += Number(r.TOTAL_JUAL)||0;
    profit.kotor += Number(r.LABA_KOTOR)||0;
    profit.bersih += Number(r.LABA_KOTOR)||0; // Laba bersih sama dengan kotor untuk penjualan (asumsi tanpa komisi)
    expense.part += Number(r.TOTAL_MODAL)||0;
  });

  rugiList.sort(function(a,b) { return a.labaKotor - b.labaKotor; });
  
  rev.total = rev.service + rev.ongkos + rev.penjualan;
  expense.total = expense.part;

  // Kas summary
  var kasMasuk=0, kasKeluar=0;
  kas.forEach(function(r){
    if(r.JENIS==='MASUK') kasMasuk+=Number(r.JUMLAH)||0;
    else kasKeluar+=Number(r.JUMLAH)||0;
  });

  // Top 10 customers
  var custMap = {};
  trx.forEach(function(r){
    var n = r.NAMA_PELANGGAN;
    if(!custMap[n]) custMap[n]={nama:n, count:0, total:0};
    custMap[n].count++;
    custMap[n].total += (Number(r.HARGA_JUAL)||0)+(Number(r.ONGKOS_KERJA)||0);
  });
  pnj.forEach(function(r){
    var n = r.NAMA_PELANGGAN;
    if(!custMap[n]) custMap[n]={nama:n, count:0, total:0};
    custMap[n].count++;
    custMap[n].total += Number(r.TOTAL_JUAL)||0;
  });
  var topCust = Object.values(custMap).sort(function(a,b){return b.total-a.total;}).slice(0,10);

  return {
    periode: {start:sdStr, end:edStr},
    summary: {totalServis:trx.length, totalPembelian:beli.length, totalPenjualan:pnj.length},
    revenue: rev, expense: expense, profit: profit,
    kas: {masuk:kasMasuk, keluar:kasKeluar, saldo:kasMasuk-kasKeluar},
    byTeknisi: byTeknisi, topCustomers: topCust, rugiList: rugiList
  };
}

// ======================== LAPORAN KAS ========================

function getLaporanKas(cabang, filter) {
  var data = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang);
  if (filter) {
    if (filter.jenis && filter.jenis !== 'SEMUA')
      data = data.filter(function(r){return r.JENIS===filter.jenis;});
    if (filter.metodeBayar && filter.metodeBayar !== 'SEMUA')
      data = data.filter(function(r){return r.METODE_BAYAR===filter.metodeBayar;});
    if (filter.startDate) {
      var sdStr = String(filter.startDate).substring(0, 10);
      data = data.filter(function(r){
        try {
          var rowDate;
          if (r.TANGGAL instanceof Date) {
            rowDate = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
          } else {
            rowDate = String(r.TANGGAL || '').substring(0, 10);
          }
          return rowDate >= sdStr;
        } catch(e) { return true; }
      });
    }
    if (filter.endDate) {
      var edStr = String(filter.endDate).substring(0, 10);
      data = data.filter(function(r){
        try {
          var rowDate;
          if (r.TANGGAL instanceof Date) {
            rowDate = Utilities.formatDate(r.TANGGAL, 'Asia/Makassar', 'yyyy-MM-dd');
          } else {
            rowDate = String(r.TANGGAL || '').substring(0, 10);
          }
          return rowDate <= edStr;
        } catch(e) { return true; }
      });
    }
  }
  data.sort(function(a,b){
    try { return parseDate(b.TANGGAL)-parseDate(a.TANGGAL); } catch(e) { return 0; }
  });

  var masuk=0, keluar=0;
  data.forEach(function(r){
    if(r.JENIS==='MASUK') masuk+=Number(r.JUMLAH)||0;
    else keluar+=Number(r.JUMLAH)||0;
  });

  var resultData = {data:data, summary:{masuk:masuk, keluar:keluar, saldo:masuk-keluar}};
  return JSON.parse(JSON.stringify(resultData));
}

// ======================== LAPORAN STOK ========================

function getLaporanStok(cabang, filter) {
  try {
    // 1. Ambil data stok — ini yang paling penting
    var stok = [];
    try {
      var rawStok = getSheetDataByCabang(SHEET_NAMES.STOK_PART, cabang);
      stok = rawStok.filter(function(r) { return String(r.STATUS||'').toUpperCase() === 'AKTIF'; });
    } catch(se) {
      console.error('getStok error: ' + se.message);
      stok = [];
    }

    // 2. Hitung summary stok
    var totalItem = 0, totalNilai = 0;
    stok.forEach(function(r) {
      var s = Number(r.STOK) || 0;
      totalItem += s;
      totalNilai += s * (Number(r.HARGA_BELI) || 0);
    });

    // 3. Ambil riwayat part untuk stok masuk/keluar (opsional)
    var masuk = 0, keluar = 0;
    try {
      var sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(SHEET_NAMES.RIWAYAT_PART);
      if (sheet && sheet.getLastRow() > 1) {
        var riwayat = getRiwayatPart({
          cabang: cabang,
          startDate: filter ? (filter.startDate || '') : '',
          endDate:   filter ? (filter.endDate   || '') : ''
        });
        riwayat.forEach(function(r) {
          if (r.TIPE === 'MASUK' || r.TIPE === 'TRANSFER_MASUK') masuk += Number(r.QTY) || 0;
          else keluar += Number(r.QTY) || 0;
        });
      }
    } catch(re) {
      console.warn('Riwayat Part kosong/error (diabaikan): ' + re.message);
    }

    var resultData = {
      stokList: stok,
      summary: { totalItem: totalItem, totalNilai: totalNilai, masuk: masuk, keluar: keluar }
    };
    return JSON.parse(JSON.stringify(resultData));
  } catch(e) {
    console.error('getLaporanStok FATAL error: ' + e.message + ' stack: ' + e.stack);
    return { stokList: [], summary: { totalItem:0, totalNilai:0, masuk:0, keluar:0 }, error: e.message };
  }
}

function getLaporanLabaRugiDetail(cabang, periode) {
  var sdStr = periode && periode.startDate ? String(periode.startDate).substring(0, 10) : Utilities.formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'Asia/Makassar', 'yyyy-MM-dd');
  var edStr = periode && periode.endDate ? String(periode.endDate).substring(0, 10) : Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');

  var getRowDateStr = function(tanggal) {
    try {
      if (tanggal instanceof Date) return Utilities.formatDate(tanggal, 'Asia/Makassar', 'yyyy-MM-dd');
      var s = String(tanggal || '');
      if (s.match(/^\d{4}-\d{2}/)) return s.substring(0, 10);
      var d = new Date(s);
      if (!isNaN(d.getTime())) return Utilities.formatDate(d, 'Asia/Makassar', 'yyyy-MM-dd');
      return s.substring(0, 10);
    } catch(e) { return ''; }
  };

  var trx = getSheetDataByCabang(SHEET_NAMES.TRANSAKSI, cabang).filter(function(r){
    var d = getRowDateStr(r.TGL_MASUK); return d >= sdStr && d <= edStr && r.STATUS !== 'BATAL';
  });
  var pnj = getSheetDataByCabang(SHEET_NAMES.PENJUALAN, cabang).filter(function(r){
    var d = getRowDateStr(r.TANGGAL); return d >= sdStr && d <= edStr && r.STATUS !== 'BATAL';
  });
  var kas = getSheetDataByCabang(SHEET_NAMES.KAS_HARIAN, cabang).filter(function(r){
    var d = getRowDateStr(r.TANGGAL); 
    return d >= sdStr && d <= edStr && r.JENIS === 'KELUAR' && r.KATEGORI === 'PENGELUARAN_BIAYA';
  });

  var dailyData = {};
  
  trx.forEach(function(r) {
    var d = getRowDateStr(r.TGL_MASUK);
    if (!dailyData[d]) dailyData[d] = { tanggal: d, pendapatanServis: 0, pendapatanAksesoris: 0, totalModal: 0, labaKotor: 0, komisi: 0, labaBersih: 0, trxCount: 0 };
    dailyData[d].pendapatanServis += (Number(r.HARGA_JUAL)||0) + (Number(r.ONGKOS_KERJA)||0);
    dailyData[d].totalModal += (Number(r.TOTAL_MODAL)||0);
    dailyData[d].labaKotor += (Number(r.LABA_KOTOR)||0);
    dailyData[d].komisi += (Number(r.KOMISI)||0);
    dailyData[d].labaBersih += (Number(r.LABA_BERSIH)||0);
    dailyData[d].trxCount++;
  });

  pnj.forEach(function(r) {
    var d = getRowDateStr(r.TANGGAL);
    if (!dailyData[d]) dailyData[d] = { tanggal: d, pendapatanServis: 0, pendapatanAksesoris: 0, totalModal: 0, labaKotor: 0, komisi: 0, labaBersih: 0, trxCount: 0 };
    dailyData[d].pendapatanAksesoris += (Number(r.TOTAL_JUAL)||0);
    dailyData[d].totalModal += (Number(r.TOTAL_MODAL)||0);
    dailyData[d].labaKotor += (Number(r.LABA_KOTOR)||0);
    dailyData[d].labaBersih += (Number(r.LABA_KOTOR)||0);
    dailyData[d].trxCount++;
  });

  // Calculate Operational Expenses (Opex)
  kas.forEach(function(r) {
    var d = getRowDateStr(r.TANGGAL);
    if (!dailyData[d]) dailyData[d] = { tanggal: d, pendapatanServis: 0, pendapatanAksesoris: 0, totalModal: 0, labaKotor: 0, komisi: 0, pengeluaran: 0, labaBersih: 0, trxCount: 0 };
    var opex = Number(r.JUMLAH) || 0;
    if (typeof dailyData[d].pengeluaran === 'undefined') dailyData[d].pengeluaran = 0;
    dailyData[d].pengeluaran += opex;
    dailyData[d].labaBersih -= opex; // Kurangi laba bersih dengan opex
  });

  var resultList = [];
  var totals = { pendapatanServis: 0, pendapatanAksesoris: 0, totalModal: 0, labaKotor: 0, komisi: 0, pengeluaran: 0, labaBersih: 0 };

  for (var k in dailyData) {
    var item = dailyData[k];
    item.pendapatanTotal = item.pendapatanServis + item.pendapatanAksesoris;
    totals.pendapatanServis += item.pendapatanServis;
    totals.pendapatanAksesoris += item.pendapatanAksesoris;
    totals.totalModal += item.totalModal;
    totals.labaKotor += item.labaKotor;
    totals.komisi += item.komisi;
    totals.pengeluaran += (item.pengeluaran || 0);
    totals.labaBersih += item.labaBersih;
    resultList.push(item);
  }

  resultList.sort(function(a,b) { return a.tanggal > b.tanggal ? -1 : 1; });
  totals.pendapatanTotal = totals.pendapatanServis + totals.pendapatanAksesoris;

  return JSON.parse(JSON.stringify({ daily: resultList, totals: totals, periode: {start: sdStr, end: edStr} }));
}

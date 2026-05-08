// ============================================================
// ServicePro HP v5.1 — TelegramHelper.gs
// Notification formatting, command handlers, report generators
// ============================================================

// ======================== HELPERS ========================
function tg(text) {
  if (!text) return '';
  return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function tgRp(num) {
  return 'Rp ' + Math.round(Number(num || 0)).toLocaleString('id-ID');
}

function tgDate(d) {
  if (!d) return '-';
  if (typeof d === 'string') {
    d = new Date(d);
    if (isNaN(d.getTime())) return String(d);
  }
  return Utilities.formatDate(d, 'Asia/Makassar', 'dd/MM/yyyy HH:mm');
}

function tgDateShort(d) {
  if (!d) return '-';
  if (typeof d === 'string') d = new Date(d);
  if (isNaN(d.getTime())) return String(d);
  return Utilities.formatDate(d, 'Asia/Makassar', 'dd/MM/yyyy');
}

function isToday(d) {
  if (!d) return false;
  if (typeof d === 'string') d = new Date(d);
  var now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(d) {
  if (!d) return false;
  if (typeof d === 'string') d = new Date(d);
  var now = new Date();
  var weekAgo = new Date(now.getTime() - 7 * 86400000);
  return d >= weekAgo;
}

function isThisMonth(d) {
  if (!d) return false;
  if (typeof d === 'string') d = new Date(d);
  var now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function filterByDate(data, col, period) {
  if (!data || !data.length) return [];
  return data.filter(function(r) {
    var d = r[col];
    if (!d) return false;
    if (typeof d === 'string') d = new Date(d);
    if (period === 'today') return isToday(d);
    if (period === 'week') return isThisWeek(d);
    if (period === 'month') return isThisMonth(d);
    return true;
  });
}

function truncateText(text, max) {
  if (!text || text.length <= max) return text;
  return text.substring(0, max) + '...';
}

// ======================== NOTIFICATIONS ========================
function formatNotifMessage(type, data) {
  if (!data) return null;
  var lines = [];
  var now = new Date();
  var tgl = tgDate(now);

  switch(type) {
    case 'TRANSAKSI_BARU':
      lines.push('<b>🆕 TRANSAKSI BARU</b>');
      lines.push('📋 <code>' + tg(data.id) + '</code> — ' + tg(data.nama));
      if (data.tipeHp) lines.push('📱 ' + tg(data.tipeHp));
      if (data.kerusakan) lines.push('🔧 ' + tg(data.kerusakan));
      if (data.teknisi) lines.push('👨‍🔧 Teknisi: ' + tg(data.teknisi));
      lines.push('📍 ' + tg(data.cabang || '-'));
      lines.push('⏰ ' + tgl);
      break;

    case 'STATUS_UPDATE':
      lines.push('<b>🔄 STATUS UPDATE</b>');
      lines.push('📋 <code>' + tg(data.id) + '</code> — ' + tg(data.nama));
      lines.push('➡️ ' + tg(data.statusLama) + ' → ' + tg(data.statusBaru));
      if (data.total) lines.push('💰 ' + tgRp(data.total));
      if (data.metodeBayar) lines.push('💳 ' + tg(data.metodeBayar));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'BON_DIBERIKAN':
      lines.push('<b>💳 BON DIBERIKAN</b>');
      lines.push('📋 <code>' + tg(data.id) + '</code> — ' + tg(data.nama));
      lines.push('💰 ' + tgRp(data.nominal));
      if (data.teknisi) lines.push('👨‍🔧 Teknisi: ' + tg(data.teknisi));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'BON_LUNAS':
      lines.push('<b>💰 BON LUNAS</b>');
      lines.push('📋 <code>' + tg(data.id) + '</code> — ' + tg(data.nama));
      lines.push('💵 ' + tgRp(data.nominal) + ' dibayar (' + tg(data.metodeBayar) + ')');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'PEMBELIAN_PART':
      lines.push('<b>📦 PEMBELIAN PART</b>');
      if (data.id) lines.push('📋 <code>' + tg(data.id) + '</code>');
      lines.push('🏪 ' + tg(data.items));
      lines.push('💰 ' + tgRp(data.total) + ' (' + tg(data.metodeBayar) + ')');
      lines.push('🏢 Supplier: ' + tg(data.supplier));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'JUAL_PART':
      lines.push('<b>🏷️ PENJUALAN PART</b>');
      if (data.id) lines.push('📋 <code>' + tg(data.id) + '</code>');
      lines.push('🛒 ' + tg(data.items));
      lines.push('👤 ' + tg(data.namaPelanggan));
      lines.push('💰 ' + tgRp(data.total) + ' (' + tg(data.metodeBayar) + ')');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'TRANSFER_CABANG':
      lines.push('<b>🔄 TRANSFER CABANG</b>');
      lines.push('📋 ' + tg(data.items));
      lines.push('📍 ' + tg(data.cabangAsal) + ' → ' + tg(data.cabangTujuan));
      break;

    case 'RETURN_SUPPLIER':
      lines.push('<b>↩️ RETURN SUPPLIER</b>');
      if (data.id) lines.push('📋 <code>' + tg(data.id) + '</code>');
      lines.push('📦 ' + tg(data.items));
      lines.push('💰 ' + tgRp(data.total));
      lines.push('🏢 ' + tg(data.supplier));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'STOK_RENDAH':
      lines.push('<b>⚠️ STOK RENDAH</b>');
      lines.push('📦 ' + tg(data.namaPart));
      lines.push('🔢 Stok: ' + (data.stok) + ' (min: ' + (data.stokMin) + ')');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'TAMBAH_PART':
      lines.push('<b>➕ PART BARU</b>');
      lines.push('📦 ' + tg(data.namaPart));
      lines.push('🔢 Stok: ' + tg(data.stok));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'EDIT_PART_MASTER':
      lines.push('<b>✏️ EDIT PART</b>');
      lines.push('📦 ' + tg(data.namaPart));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'HAPUS_PART':
      lines.push('<b>🗑️ HAPUS PART</b>');
      lines.push('📦 ' + tg(data.namaPart));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'USER_BARU':
      lines.push('<b>👤 USER BARU</b>');
      lines.push('🔐 ' + tg(data.username) + ' (' + tg(data.role) + ')');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'VOID_TRANSAKSI':
      lines.push('<b>❌ VOID TRANSAKSI</b>');
      lines.push('📋 <code>' + tg(data.id) + '</code> — ' + tg(data.nama));
      if (data.total) lines.push('💰 ' + tgRp(data.total) + ' dibatalkan');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'IMPORT_STOK':
      lines.push('<b>📥 IMPORT STOK</b>');
      lines.push('📦 ' + tg(data.count) + ' item berhasil diimport');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'KASIR_AKSI':
      var aksiLabel = {BUKA:'🏦 BUKA KASIR', TUTUP:'🏦 TUTUP KASIR', TUTUP_NONCASH:'🏦 TUTUP KASIR', PENGELUARAN:'💸 PENGELUARAN'};
      lines.push('<b>' + (aksiLabel[data.aksi] || '💰 KASIR') + '</b>');
      lines.push('💰 ' + tgRp(data.jumlah) + ' (' + tg(data.metodeBayar) + ')');
      if (data.keterangan) lines.push('📝 ' + tg(data.keterangan));
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'BAYAR_HUTANG':
      lines.push('<b>💳 BAYAR HUTANG</b>');
      lines.push('🏢 ' + tg(data.supplier));
      lines.push('💰 ' + tgRp(data.jumlah) + ' (' + tg(data.metodeBayar) + ')');
      if (data.sisa > 0) lines.push('📌 Sisa: ' + tgRp(data.sisa));
      else lines.push('✅ Lunas');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'BAYAR_PIUTANG':
      lines.push('<b>💰 PELUNASAN PIUTANG</b>');
      lines.push('👤 ' + tg(data.nama));
      lines.push('💵 ' + tgRp(data.jumlah) + ' (' + tg(data.metodeBayar) + ')');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    case 'NON_TUNAI_MASUK':
      lines.push('<b>📲 PEMBAYARAN NON-TUNAI</b>');
      lines.push('📋 <code>' + tg(data.id) + '</code> — ' + tg(data.nama));
      if (data.tipeHp) lines.push('📱 ' + tg(data.tipeHp));
      lines.push('💵 ' + tgRp(data.nominal) + ' (' + tg(data.metodeBayar) + ')');
      lines.push('📍 ' + tg(data.cabang || '-'));
      break;

    default:
      lines.push('<b>ℹ️ ' + tg(type) + '</b>');
      lines.push(tg(JSON.stringify(data).substring(0, 500)));
  }

  if (!lines.length) return null;
  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== LOW STOCK CHECK ========================
function checkAndNotifyLowStock(cabang) {
  try {
    var config = getTelegramConfig();
    if (!config.enabled || config.stokMin <= 0) return;
    var stokData = cabang && cabang !== 'SEMUA'
      ? getSheetDataByCabang(SHEET_NAMES.STOK_PART, cabang)
      : getSheetData(SHEET_NAMES.STOK_PART);
    var lowItems = [];
    var emptyItems = [];
    stokData.forEach(function(s) {
      if (s.STATUS !== 'AKTIF') return;
      var stok = Number(s.STOK) || 0;
      if (stok <= 0) {
        emptyItems.push({ namaPart: s.NAMA_PART, stok: stok, cabang: s.CABANG });
      } else if (stok <= config.stokMin) {
        lowItems.push({ namaPart: s.NAMA_PART, stok: stok, cabang: s.CABANG });
      }
    });
    // Send empty stock alerts
    emptyItems.slice(0, 10).forEach(function(item) {
      sendTelegramToOwner(
        '<b>🚨 STOK HABIS</b>\n📦 ' + tg(item.namaPart) + '\n📍 ' + tg(item.cabang) + '\n━━━━━━━━━━━━━━━',
        { disable_notification: true }
      );
    });
    // Send low stock alerts
    lowItems.slice(0, 10).forEach(function(item) {
      sendTelegramNotif('STOK_RENDAH', {
        namaPart: item.namaPart, stok: item.stok,
        stokMin: config.stokMin, cabang: item.cabang
      });
    });
  } catch(e) {
    Logger.log('Low stock check error: ' + e.message);
  }
}

// ======================== COMMAND HANDLER ========================
function handleTelegramCommand(text, chatId) {
  var cmd = text.trim().split(' ')[0].toLowerCase();
  var args = text.trim().substring(cmd.length).trim();
  var response = '';

  try {
    switch(cmd) {
      case '/start':
        response = cmdStart(chatId);
        break;
      case '/help':
        response = cmdHelp();
        break;
      case '/dashboard':
      case '/dash':
        if (args) {
          response = cmdDashboard(args);
        } else {
          cmdDashboardWithButtons(chatId);
        }
        return;
      case '/service':
        if (args) { response = cmdService(args); } else { cmdReportWithButtons(chatId, 'service'); return; }
        break;
      case '/pembelian':
      case '/beli':
        if (args) { response = cmdPembelian(args); } else { cmdReportWithButtons(chatId, 'pembelian'); return; }
        break;
      case '/jual':
        if (args) { response = cmdJual(args); } else { cmdReportWithButtons(chatId, 'jual'); return; }
        break;
      case '/stok':
        response = cmdStok(args);
        break;
      case '/stokrendah':
      case '/low':
        response = cmdStokRendah();
        break;
      case '/kas':
        if (args) { response = cmdKas(args); } else { cmdReportWithButtons(chatId, 'kas'); return; }
        break;
      case '/laci':
        response = cmdLaci(args);
        break;
      case '/bon':
      case '/piutang':
        response = cmdBon(args);
        break;
      case '/laba':
        response = cmdLaba(args);
        break;
      case '/cabang':
        response = cmdCabang(args);
        break;
      case '/top':
        response = cmdTop();
        break;
      case '/log':
        response = cmdLog();
        break;
      case '/debug':
        response = diagData();
        break;
      case '/notifikasi':
        response = cmdToggleNotif(args);
        break;
      case '/test':
        response = '<b>✅ Bot aktif!</b>\nWaktu: ' + tgDate(new Date());
        break;
      default:
        response = '❓ Command tidak dikenali.\nKirim /help untuk daftar command.';
    }
  } catch(e) {
    response = '⚠️ Error: ' + tg(e.message);
    Logger.log('TG command error [' + cmd + ']: ' + e.message);
  }

  if (response) {
    sendTelegramMessage(chatId, response);
  }
}

// ======================== COMMAND: START ========================
function cmdStart(chatId) {
  var buttons = {
    inline_keyboard: [
      [
        { text: '📊 Dashboard', callback_data: 'cmd:/dashboard' },
        { text: '🔧 Service', callback_data: 'cmd:/service' },
        { text: '📦 Pembelian', callback_data: 'cmd:/pembelian' }
      ],
      [
        { text: '🏷️ Penjualan', callback_data: 'cmd:/jual' },
        { text: '💰 Kas', callback_data: 'cmd:/kas' },
        { text: '💳 BON', callback_data: 'cmd:/bon' }
      ],
      [
        { text: '📦 Stok', callback_data: 'cmd:/stok' },
        { text: '⚠️ Stok Rendah', callback_data: 'cmd:/stokrendah' },
        { text: '📈 Laba', callback_data: 'cmd:/laba' }
      ],
      [
        { text: '📍 Cabang', callback_data: 'cmd:/cabang' },
        { text: '🏆 Top Teknisi', callback_data: 'cmd:/top' },
        { text: '📋 Log', callback_data: 'cmd:/log' }
      ]
    ]
  };
  var cabangList = getCabangNames();
  var cabInfo = cabangList.length > 0 ? '\n\n<b>📍 Cabang:</b> ' + cabangList.join(', ') : '';
  var msg = '<b>👋 ServicePro HP Bot</b>\n\nKlik menu di bawah atau ketik command:\n/dashboard • /service • /pembelian\n/jual • /kas • /bon • /stok\n/laba • /cabang • /top • /log\n\n/help untuk bantuan lengkap' + cabInfo;
  sendTelegramMessage(chatId, msg, { reply_markup: buttons });
  return null; // already sent
}

// ======================== COMMAND: HELP ========================
function cmdHelp() {
  return '<b>📖 Daftar Command</b>\n\n' +
    '<b>📊 Laporan:</b>\n' +
    '/dashboard — Ringkasan hari ini\n' +
    '/service — Laporan service\n' +
    '/pembelian — Laporan pembelian\n' +
    '/jual — Laporan penjualan\n' +
    '/kas — Laporan kas\n' +
    '/laci — Cek saldo laci kasir\n' +
    '/bon — Daftar piutang BON\n' +
    '/laba — Laba rugi ringkas\n' +
    '/cabang [nama] — Ringkasan per cabang\n' +
    '/top — Top teknisi bulan ini\n\n' +
    '<b>📦 Stok:</b>\n' +
    '/stok — Ringkasan stok\n' +
    '/stokrendah — Daftar stok rendah/habis\n\n' +
    '<b>⚙️ Lainnya:</b>\n' +
    '/log — 10 log aktivitas terakhir\n' +
    '/notifikasi on|off — Toggle notifikasi\n' +
    '/test — Test koneksi bot\n\n' +
    '<b>📌 Filter cabang &amp; periode:</b>\n' +
    'Tambahkan nama cabang dan/atau periode\n' +
    '<code>/service BL</code> — service BL hari ini\n' +
    '<code>/jual SIB week</code> — jual SIB 7 hari\n' +
    '<code>/kas month</code> — kas semua cabang bulan ini\n' +
    '<code>/dashboard LJ</code> — dashboard LJ hari ini\n' +
    'Default: hari ini, semua cabang\n\n' +
    '<b>📍 Daftar Cabang:</b>\n' + getCabangNames().join(', ');
}

// ======================== COMMAND: DASHBOARD WITH BUTTONS ========================
function cmdDashboardWithButtons(chatId) {
  var cabangs = getCabangNames();
  var btns = [];
  var row = [];
  row.push({ text: '📊 Semua Cabang', callback_data: 'cmd:/dashboard' });
  for (var i = 0; i < cabangs.length; i++) {
    var kode = cabangs[i].split(' ')[0];
    var nama = cabangs[i].replace(kode + ' ', '');
    row.push({ text: '📍 ' + kode, callback_data: 'cmd:/dashboard ' + kode });
    if (row.length === 3 || i === cabangs.length - 1) { btns.push(row); row = []; }
  }
  // Add period buttons
  btns.push([
    { text: '📅 Hari Ini', callback_data: 'cmd:/dashboard today' },
    { text: '📅 7 Hari', callback_data: 'cmd:/dashboard week' },
    { text: '📅 Bulan Ini', callback_data: 'cmd:/dashboard month' }
  ]);
  sendTelegramMessage(chatId, '<b>📊 Pilih Cabang Dashboard</b>', { reply_markup: { inline_keyboard: btns } });
}

// Generic report with cabang + period buttons
function cmdReportWithButtons(chatId, reportType) {
  var labels = { service:'🔧', pembelian:'📦', jual:'🏷️', kas:'💰', laba:'📈' };
  var emoji = labels[reportType] || '📊';
  var cabangs = getCabangNames();
  var btns = [];
  var row = [{ text: emoji + ' Semua Cabang', callback_data: 'cmd:/' + reportType }];
  for (var i = 0; i < cabangs.length; i++) {
    var kode = cabangs[i].split(' ')[0];
    row.push({ text: '📍 ' + kode, callback_data: 'cmd:/' + reportType + ' ' + kode });
    if (row.length === 3 || i === cabangs.length - 1) { btns.push(row); row = []; }
  }
  btns.push([
    { text: '📅 Hari Ini', callback_data: 'cmd:/' + reportType + ' today' },
    { text: '📅 7 Hari', callback_data: 'cmd:/' + reportType + ' week' },
    { text: '📅 Bulan Ini', callback_data: 'cmd:/' + reportType + ' month' }
  ]);
  sendTelegramMessage(chatId, '<b>' + emoji + ' Pilih Cabang — ' + reportType.toUpperCase() + '</b>', { reply_markup: { inline_keyboard: btns } });
}

// ======================== COMMAND: DASHBOARD ========================
function cmdDashboard(args) {
  var cp = parseCabangPeriod(args);
  var trxData = getSheetData(SHEET_NAMES.TRANSAKSI);
  var pnjData = getSheetData(SHEET_NAMES.PENJUALAN);

  var trx = filterByDate(trxData, 'TGL_MASUK', cp.period);
  var pnj = filterByDate(pnjData, 'TANGGAL', cp.period);
  trx = filterByCabang(trx, cp.cabang);
  pnj = filterByCabang(pnj, cp.cabang);

  var trxCount = trx.length;
  var pnjCount = pnj.length;
  var trxSelesai = trx.filter(function(t){return t.STATUS==='SELESAI_DIAMBIL';}).length;
  var trxProses = trx.filter(function(t){return t.STATUS!=='BATAL'&&t.STATUS!=='SELESAI_DIAMBIL';}).length;
  var trxBatal = trx.filter(function(t){return t.STATUS==='BATAL';}).length;
  var trxTotal = trx.reduce(function(s,t){return s+(Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);},0);
  var pnjTotal = pnj.reduce(function(s,p){return s+(Number(p.TOTAL_JUAL)||0);},0);
  var grandTotal = trxTotal + pnjTotal;

  // Per cabang
  var cabangMap = {};
  trx.forEach(function(t){
    if (!t.CABANG) return;
    if (!cabangMap[t.CABANG]) cabangMap[t.CABANG] = {count:0, total:0};
    cabangMap[t.CABANG].count++;
    cabangMap[t.CABANG].total += (Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);
  });
  pnj.forEach(function(p){
    if (!p.CABANG) return;
    if (!cabangMap[p.CABANG]) cabangMap[p.CABANG] = {count:0, total:0};
    cabangMap[p.CABANG].count++;
    cabangMap[p.CABANG].total += (Number(p.TOTAL_JUAL)||0);
  });

  var periodLabel = cp.period === 'week' ? '7 Hari Terakhir' : (cp.period === 'month' ? 'Bulan Ini' : 'Hari Ini');
  var cabLabel = cp.cabang ? ' (' + cp.cabang + ')' : '';
  var lines = [
    '<b>📊 DASHBOARD — ' + periodLabel + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '💰 Pendapatan: <b>' + tgRp(grandTotal) + '</b>',
    '📋 Service: ' + trxCount + ' (✅' + trxSelesai + ' 🔄' + trxProses + ' ❌' + trxBatal + ')',
    '🏷️ Penjualan: ' + pnjCount + ' — ' + tgRp(pnjTotal)
  ];

  var cabs = Object.keys(cabangMap);
  if (cabs.length > 1) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>📍 Per Cabang:</b>');
    cabs.sort().forEach(function(c){
      lines.push('• ' + tg(c) + ': ' + cabangMap[c].count + ' trx, ' + tgRp(cabangMap[c].total));
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  lines.push('⏰ ' + tgDate(new Date()));
  return lines.join('\n');
}

// ======================== COMMAND: SERVICE ========================
function cmdService(args) {
  var cp = parseCabangPeriod(args);
  var trxData = getSheetData(SHEET_NAMES.TRANSAKSI);
  var trx = filterByDate(trxData, 'TGL_MASUK', cp.period);
  trx = filterByCabang(trx, cp.cabang);

  var total = trx.reduce(function(s,t){return s+(Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);},0);
  var ongkosTotal = trx.reduce(function(s,t){return s+(Number(t.ONGKOS)||0);},0);
  var modalTotal = trx.reduce(function(s,t){return s+(Number(t.TOTAL_MODAL)||0);},0);
  var labaBersih = trx.reduce(function(s,t){return s+(Number(t.LABA_BERSIH)||0);},0);

  var periodLabel = cp.period === 'week' ? '7 Hari' : (cp.period === 'month' ? 'Bulan Ini' : 'Hari Ini');
  var cabLabel = cp.cabang ? ' (' + cp.cabang + ')' : '';
  var lines = [
    '<b>🔧 LAPORAN SERVICE — ' + periodLabel + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '📋 Total: ' + trx.length + ' transaksi',
    '💰 Pendapatan: <b>' + tgRp(total) + '</b>',
    '    Ongkos: ' + tgRp(ongkosTotal),
    '    Modal Part: ' + tgRp(modalTotal),
    '📈 Laba Bersih: <b>' + tgRp(labaBersih) + '</b>'
  ];

  // By teknisi
  var tekMap = {};
  trx.forEach(function(t){
    if (!t.TEKNISI) return;
    if (!tekMap[t.TEKNISI]) tekMap[t.TEKNISI] = {count:0, total:0};
    tekMap[t.TEKNISI].count++;
    tekMap[t.TEKNISI].total += (Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);
  });
  var teks = Object.keys(tekMap);
  if (teks.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>👨‍🔧 Per Teknisi:</b>');
    teks.sort(function(a,b){return tekMap[b].total - tekMap[a].total;}).forEach(function(t){
      lines.push('• ' + tg(t) + ': ' + tekMap[t].count + ' unit, ' + tgRp(tekMap[t].total));
    });
  }

  // Recent 5
  var recent = trx.slice().reverse().slice(0, 5);
  if (recent.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>📋 Terbaru:</b>');
    recent.forEach(function(t){
      var statusEmoji = t.STATUS === 'SELESAI_DIAMBIL' ? '✅' : (t.STATUS === 'BATAL' ? '❌' : '🔄');
      lines.push(statusEmoji + ' <code>' + tg(t.ID_TRANSAKSI) + '</code> ' + tg(t.TIPE_HP) + ' — ' + tg(t.NAMA_PELANGGAN));
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  lines.push('⏰ ' + tgDate(new Date()));
  return lines.join('\n');
}

// ======================== COMMAND: PEMBELIAN ========================
function cmdPembelian(args) {
  var cp = parseCabangPeriod(args);
  var data = getSheetData(SHEET_NAMES.PEMBELIAN);
  var filtered = filterByDate(data, 'TANGGAL', cp.period);
  filtered = filterByCabang(filtered, cp.cabang);

  var total = filtered.reduce(function(s,r){return s+(Number(r.TOTAL)||0);},0);
  var count = filtered.length;

  var periodLabel = cp.period === 'week' ? '7 Hari' : (cp.period === 'month' ? 'Bulan Ini' : 'Hari Ini');
  var cabLabel = cp.cabang ? ' (' + cp.cabang + ')' : '';
  var lines = [
    '<b>📦 LAPORAN PEMBELIAN — ' + periodLabel + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '📋 Total: ' + count + ' pembelian',
    '💰 Total Belanja: <b>' + tgRp(total) + '</b>'
  ];

  // By supplier
  var supMap = {};
  filtered.forEach(function(r){
    if (!r.SUPPLIER) return;
    if (!supMap[r.SUPPLIER]) supMap[r.SUPPLIER] = {count:0, total:0};
    supMap[r.SUPPLIER].count++;
    supMap[r.SUPPLIER].total += (Number(r.TOTAL)||0);
  });
  var sups = Object.keys(supMap);
  if (sups.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>🏢 Per Supplier:</b>');
    sups.sort(function(a,b){return supMap[b].total - supMap[a].total;}).forEach(function(s){
      lines.push('• ' + tg(s) + ': ' + supMap[s].count + 'x, ' + tgRp(supMap[s].total));
    });
  }

  // Recent 5
  var recent = filtered.slice().reverse().slice(0, 5);
  if (recent.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>📋 Terbaru:</b>');
    recent.forEach(function(r){
      lines.push('📦 ' + tg(r.NAMA_PART) + ' — ' + tg(r.SUPPLIER) + ' — ' + tgRp(r.TOTAL));
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: JUAL ========================
function cmdJual(args) {
  var cp = parseCabangPeriod(args);
  var data = getSheetData(SHEET_NAMES.PENJUALAN);
  var filtered = filterByDate(data, 'TANGGAL', cp.period);
  filtered = filterByCabang(filtered, cp.cabang);

  var totalJual = filtered.reduce(function(s,r){return s+(Number(r.TOTAL_JUAL)||0);},0);
  var totalModal = filtered.reduce(function(s,r){return s+(Number(r.TOTAL_MODAL)||0);},0);
  var laba = totalJual - totalModal;
  var count = filtered.length;

  var periodLabel = cp.period === 'week' ? '7 Hari' : (cp.period === 'month' ? 'Bulan Ini' : 'Hari Ini');
  var cabLabel = cp.cabang ? ' (' + cp.cabang + ')' : '';
  var lines = [
    '<b>🏷️ LAPORAN PENJUALAN — ' + periodLabel + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '📋 Total: ' + count + ' penjualan',
    '💰 Pendapatan: <b>' + tgRp(totalJual) + '</b>',
    '📊 Modal: ' + tgRp(totalModal),
    '📈 Laba Kotor: <b>' + tgRp(laba) + '</b>'
  ];

  var recent = filtered.slice().reverse().slice(0, 5);
  if (recent.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>📋 Terbaru:</b>');
    recent.forEach(function(r){
      lines.push('🏷️ ' + tg(r.NAMA_PELANGGAN) + ' — ' + tgRp(r.TOTAL_JUAL) + ' (' + tg(r.METODE_BAYAR) + ')');
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: STOK ========================
function cmdStok(args) {
  var stokData = getSheetData(SHEET_NAMES.STOK_PART).filter(function(s){return s.STATUS==='AKTIF';});
  var totalItems = stokData.length;
  var totalStok = stokData.reduce(function(s,r){return s+(Number(r.STOK)||0);},0);
  var totalModal = stokData.reduce(function(s,r){return s+(Number(r.STOK)||0)*(Number(r.HARGA_BELI)||0);},0);
  var totalJual = stokData.reduce(function(s,r){return s+(Number(r.STOK)||0)*(Number(r.HARGA_JUAL)||0);},0);
  var config = getTelegramConfig();
  var emptyCount = stokData.filter(function(s){return (Number(s.STOK)||0)<=0;}).length;
  var lowCount = stokData.filter(function(s){var st=Number(s.STOK)||0;return st>0&&st<=config.stokMin;}).length;

  var lines = [
    '<b>📦 RINGKASAN STOK</b>',
    '━━━━━━━━━━━━━━━',
    '📋 Total Item Aktif: ' + totalItems,
    '🔢 Total Stok: ' + totalStok + ' unit',
    '💰 Nilai Modal: ' + tgRp(totalModal),
    '💰 Nilai Jual: ' + tgRp(totalJual),
    '🚨 Stok Habis: ' + emptyCount,
    '⚠️ Stok Rendah: ' + lowCount + ' (≤' + config.stokMin + ')'
  ];

  // Per cabang
  var cabMap = {};
  stokData.forEach(function(s){
    if (!s.CABANG) return;
    if (!cabMap[s.CABANG]) cabMap[s.CABANG] = {count:0, stok:0};
    cabMap[s.CABANG].count++;
    cabMap[s.CABANG].stok += (Number(s.STOK)||0);
  });
  var cabs = Object.keys(cabMap);
  if (cabs.length > 1) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>📍 Per Cabang:</b>');
    cabs.sort().forEach(function(c){
      lines.push('• ' + tg(c) + ': ' + cabMap[c].count + ' item, ' + cabMap[c].stok + ' unit');
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: STOK RENDAH ========================
function cmdStokRendah() {
  var config = getTelegramConfig();
  var stokData = getSheetData(SHEET_NAMES.STOK_PART).filter(function(s){return s.STATUS==='AKTIF';});
  var low = stokData.filter(function(s){var st=Number(s.STOK)||0;return st<=config.stokMin;});
  var empty = low.filter(function(s){return (Number(s.STOK)||0)<=0;});
  var rendah = low.filter(function(s){return (Number(s.STOK)||0)>0;});

  var lines = [
    '<b>⚠️ STOK RENDAH &amp; HABIS</b>',
    '━━━━━━━━━━━━━━━'
  ];

  if (empty.length > 0) {
    lines.push('<b>🚨 HABIS (' + empty.length + '):</b>');
    empty.slice(0, 15).forEach(function(s){
      lines.push('❌ ' + tg(s.NAMA_PART) + ' — ' + tg(s.CABANG));
    });
    if (empty.length > 15) lines.push('... dan ' + (empty.length - 15) + ' lainnya');
  }

  if (rendah.length > 0) {
    lines.push('<b>⚠️ RENDAH (' + rendah.length + '):</b>');
    rendah.slice(0, 15).forEach(function(s){
      var st = Number(s.STOK)||0;
      lines.push('📦 ' + tg(s.NAMA_PART) + ' — Stok: ' + st + ' — ' + tg(s.CABANG));
    });
    if (rendah.length > 15) lines.push('... dan ' + (rendah.length - 15) + ' lainnya');
  }

  if (low.length === 0) {
    lines.push('✅ Semua stok aman!');
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: KAS ========================
function cmdKas(args) {
  var cp = parseCabangPeriod(args);
  var data = getSheetData(SHEET_NAMES.KAS_HARIAN);
  var filtered = filterByDate(data, 'TANGGAL', cp.period);
  filtered = filterByCabang(filtered, cp.cabang);

  var masuk = filtered.filter(function(r){return r.JENIS==='MASUK';});
  var keluar = filtered.filter(function(r){return r.JENIS==='KELUAR';});
  var totalMasuk = masuk.reduce(function(s,r){return s+(Number(r.JUMLAH)||0);},0);
  var totalKeluar = keluar.reduce(function(s,r){return s+(Number(r.JUMLAH)||0);},0);
  var saldo = totalMasuk - totalKeluar;

  var periodLabel = cp.period === 'week' ? '7 Hari' : (cp.period === 'month' ? 'Bulan Ini' : 'Hari Ini');
  var cabLabel = cp.cabang ? ' (' + cp.cabang + ')' : '';
  var lines = [
    '<b>💰 LAPORAN KAS — ' + periodLabel + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '💵 Pemasukan: <b>' + tgRp(totalMasuk) + '</b> (' + masuk.length + ' trx)',
    '💸 Pengeluaran: <b>' + tgRp(totalKeluar) + '</b> (' + keluar.length + ' trx)',
    '📊 Saldo: <b>' + tgRp(saldo) + '</b>'
  ];

  // By metode
  var metMap = {};
  masuk.forEach(function(r){
    if (!r.METODE_BAYAR) return;
    if (!metMap[r.METODE_BAYAR]) metMap[r.METODE_BAYAR] = 0;
    metMap[r.METODE_BAYAR] += (Number(r.JUMLAH)||0);
  });
  var mets = Object.keys(metMap);
  if (mets.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>💳 Pemasukan per Metode:</b>');
    mets.sort(function(a,b){return metMap[b]-metMap[a];}).forEach(function(m){
      lines.push('• ' + tg(m) + ': ' + tgRp(metMap[m]));
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: LACI ========================
function cmdLaci(args) {
  var cabang = args ? args.trim().toUpperCase() : '';
  if (!cabang) return '<b>❌ Format: /laci KODE_CABANG</b>\nContoh: /laci BL\n\nKode cabang: ' + getCabangNames().join(', ');

  var kasData = getSheetData(SHEET_NAMES.KAS_HARIAN);
  var todayStr = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');

  // Filter: cabang saja (SEMUA waktu untuk saldo)
  var cabKas = kasData.filter(function(r) {
    return String(r.CABANG).trim().toUpperCase() === cabang;
  });

  // Hitung saldo (SEMUA waktu, sama dengan getKasirData)
  var totalCash = 0, totalNonCash = 0;
  var cashMasukHariIni = 0, cashKeluarHariIni = 0, nonCashMasukHariIni = 0;

  cabKas.forEach(function(r) {
    var amt = Number(r.JUMLAH) || 0;
    var isCash = (r.METODE_BAYAR === 'CASH');

    // Cek hari ini
    var isToday = false;
    try {
      var rowDate = String(r.TANGGAL || '').substring(0, 10);
      isToday = (rowDate === todayStr);
    } catch(e) {}

    if (r.METODE_BAYAR !== 'UANG_OWNER') {
      if (isCash) {
        if (r.JENIS === 'MASUK') { totalCash += amt; if (isToday) cashMasukHariIni += amt; }
        else { totalCash -= amt; if (isToday) cashKeluarHariIni += amt; }
      } else {
        if (r.JENIS === 'MASUK') { totalNonCash += amt; if (isToday) nonCashMasukHariIni += amt; }
        else { totalNonCash -= amt; if (isToday) cashKeluarHariIni += amt; }
      }
    }
  });

  var lines = [
    '<b>🏦 KASIR — ' + cabang + '</b>',
    '━━━━━━━━━━━━━━━',
    '💵 Cash di Laci: <b>' + tgRp(totalCash) + '</b>',
    '💳 Non-Tunai (Transfer): <b>' + tgRp(totalNonCash) + '</b>',
    '━━━━━━━━━━━━━━━',
    '⬆️ Cash Masuk Hari Ini: ' + tgRp(cashMasukHariIni),
    '⬇️ Cash Keluar Hari Ini: ' + tgRp(cashKeluarHariIni),
    '💳 Transfer Masuk Hari Ini: ' + tgRp(nonCashMasukHariIni)
  ];

  lines.push('━━━━━━━━━━━━━━━');
  lines.push('⏰ ' + tgDate(new Date()));
  return lines.join('\n');
}

// ======================== COMMAND: BON ========================
function cmdBon(args) {
  var piutangData = getSheetData(SHEET_NAMES.PIUTANG);
  var belumLunas = piutangData.filter(function(p){return p.STATUS_BAYAR==='BELUM_LUNAS';});
  belumLunas = filterByCabang(belumLunas, args ? args.trim().toUpperCase() : '');
  var totalBon = belumLunas.reduce(function(s,p){return s+(Number(p.JUMLAH)||0);},0);

  var cabLabel = args ? ' (' + args.trim().toUpperCase() + ')' : '';
  var lines = [
    '<b>💳 DAFTAR PIUTANG BON' + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '📋 Total Piutang: ' + belumLunas.length,
    '💰 Total Nominal: <b>' + tgRp(totalBon) + '</b>'
  ];

  // By pelanggan
  var pelMap = {};
  belumLunas.forEach(function(p){
    var nama = p.NAMA_PELANGGAN || 'Unknown';
    if (!pelMap[nama]) pelMap[nama] = {count:0, total:0};
    pelMap[nama].count++;
    pelMap[nama].total += (Number(p.JUMLAH)||0);
  });
  var pels = Object.keys(pelMap);
  if (pels.length > 0) {
    lines.push('━━━━━━━━━━━━━━━');
    lines.push('<b>👤 Per Pelanggan:</b>');
    pels.sort(function(a,b){return pelMap[b].total - pelMap[a].total;}).slice(0, 15).forEach(function(n){
      lines.push('• ' + tg(n) + ': ' + pelMap[n].count + 'x, ' + tgRp(pelMap[n].total));
    });
    if (pels.length > 15) lines.push('... dan ' + (pels.length - 15) + ' pelanggan lainnya');
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: LABA ========================
function cmdLaba(args) {
  var cp = parseCabangPeriod(args);
  var trxData = getSheetData(SHEET_NAMES.TRANSAKSI);
  var pnjData = getSheetData(SHEET_NAMES.PENJUALAN);
  var beliData = getSheetData(SHEET_NAMES.PEMBELIAN);
  var kasData = getSheetData(SHEET_NAMES.KAS_HARIAN);

  var trx = filterByDate(trxData, 'TGL_MASUK', cp.period);
  var pnj = filterByDate(pnjData, 'TANGGAL', cp.period);
  var beli = filterByDate(beliData, 'TANGGAL', cp.period);
  var kas = filterByDate(kasData, 'TANGGAL', cp.period);
  trx = filterByCabang(trx, cp.cabang);
  pnj = filterByCabang(pnj, cp.cabang);
  beli = filterByCabang(beli, cp.cabang);
  kas = filterByCabang(kas, cp.cabang);

  var trxRevenue = trx.reduce(function(s,t){return s+(Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);},0);
  var trxLaba = trx.reduce(function(s,t){return s+(Number(t.LABA_BERSIH)||0);},0);
  var pnjRevenue = pnj.reduce(function(s,p){return s+(Number(p.TOTAL_JUAL)||0);},0);
  var pnjLaba = pnj.reduce(function(s,p){return s+(Number(p.LABA_KOTOR)||0);},0);
  var beliTotal = beli.reduce(function(s,b){return s+(Number(b.TOTAL)||0);},0);
  var kasKeluar = kas.filter(function(r){return r.JENIS==='KELUAR';}).reduce(function(s,r){return s+(Number(r.JUMLAH)||0);},0);

  var totalRevenue = trxRevenue + pnjRevenue;
  var totalLaba = trxLaba + pnjLaba;
  var totalBiaya = beliTotal + kasKeluar;

  var periodLabel = cp.period === 'week' ? '7 Hari' : (cp.period === 'month' ? 'Bulan Ini' : 'Hari Ini');
  var cabLabel = cp.cabang ? ' (' + cp.cabang + ')' : '';
  var lines = [
    '<b>📈 LABA RUGI — ' + periodLabel + cabLabel + '</b>',
    '━━━━━━━━━━━━━━━',
    '<b>Pendapatan:</b>',
    '🔧 Service: ' + tgRp(trxRevenue),
    '🏷️ Penjualan: ' + tgRp(pnjRevenue),
    '💰 Total: <b>' + tgRp(totalRevenue) + '</b>',
    '━━━━━━━━━━━━━━━',
    '<b>Pengeluaran:</b>',
    '📦 Pembelian Part: ' + tgRp(beliTotal),
    '💸 Pengeluaran Kas: ' + tgRp(kasKeluar),
    '💰 Total: <b>' + tgRp(totalBiaya) + '</b>',
    '━━━━━━━━━━━━━━━',
    '📊 Laba Kotor: <b>' + tgRp(totalLaba) + '</b>',
    '📊 Laba Bersih (est.): <b>' + tgRp(totalRevenue - totalBiaya) + '</b>'
  ];

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: CABANG ========================
function cmdCabang(args) {
  var cabName = (args || '').trim().toUpperCase();
  var trxData = getSheetData(SHEET_NAMES.TRANSAKSI);
  var pnjData = getSheetData(SHEET_NAMES.PENJUALAN);
  var stokData = getSheetData(SHEET_NAMES.STOK_PART).filter(function(s){return s.STATUS==='AKTIF';});

  var cabTrx = trxData.filter(function(t){return t.CABANG && t.CABANG.toUpperCase() === cabName && isToday(t.TGL_MASUK);});
  var cabPnj = pnjData.filter(function(p){return p.CABANG && p.CABANG.toUpperCase() === cabName && isToday(p.TANGGAL);});
  var cabStok = stokData.filter(function(s){return s.CABANG && s.CABANG.toUpperCase() === cabName;});

  if (cabTrx.length === 0 && cabPnj.length === 0 && cabStok.length === 0 && cabName) {
    return '❌ Cabang "' + tg(args) + '" tidak ditemukan.\n\nGunakan nama cabang yang terdaftar, atau kirim /cabang (tanpa argumen) untuk melihat semua.';
  }

  var lines = [];
  if (cabName) {
    var trxTotal = cabTrx.reduce(function(s,t){return s+(Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);},0);
    var pnjTotal = cabPnj.reduce(function(s,p){return s+(Number(p.TOTAL_JUAL)||0);},0);
    var trxSelesai = cabTrx.filter(function(t){return t.STATUS==='SELESAI_DIAMBIL';}).length;

    lines = [
      '<b>📍 CABANG: ' + tg(cabName) + '</b>',
      '━━━━━━━━━━━━━━━',
      '🔧 Service Hari Ini: ' + cabTrx.length + ' (✅' + trxSelesai + ')',
      '💰 Pendapatan Service: ' + tgRp(trxTotal),
      '🏷️ Penjualan Hari Ini: ' + cabPnj.length,
      '💰 Pendapatan Jual: ' + tgRp(pnjTotal),
      '📦 Stok Item: ' + cabStok.length,
      '━━━━━━━━━━━━━━━'
    ];
  } else {
    // List all cabang summary
    var cabList = {};
    trxData.filter(function(t){return t.CABANG && isToday(t.TGL_MASUK);}).forEach(function(t){
      if (!cabList[t.CABANG]) cabList[t.CABANG] = {trx:0, selesai:0, total:0};
      cabList[t.CABANG].trx++;
      if (t.STATUS==='SELESAI_DIAMBIL') cabList[t.CABANG].selesai++;
      cabList[t.CABANG].total += (Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);
    });

    lines = ['<b>📍 SEMUA CABANG — Hari Ini</b>', '━━━━━━━━━━━━━━━'];
    var cabs = Object.keys(cabList);
    if (cabs.length > 0) {
      cabs.sort().forEach(function(c){
        lines.push('📍 <b>' + tg(c) + '</b>: ' + cabList[c].trx + ' trx (✅' + cabList[c].selesai + ') — ' + tgRp(cabList[c].total));
      });
    } else {
      lines.push('Tidak ada transaksi hari ini');
    }
  }

  lines.push('⏰ ' + tgDate(new Date()));
  return lines.join('\n');
}

// ======================== COMMAND: TOP TEKNISI ========================
function cmdTop() {
  var trxData = getSheetData(SHEET_NAMES.TRANSAKSI);
  var monthTrx = filterByDate(trxData, 'TGL_MASUK', 'month');

  var tekMap = {};
  monthTrx.forEach(function(t){
    if (!t.TEKNISI || t.STATUS === 'BATAL') return;
    if (!tekMap[t.TEKNISI]) tekMap[t.TEKNISI] = {count:0, selesai:0, total:0, laba:0};
    tekMap[t.TEKNISI].count++;
    if (t.STATUS === 'SELESAI_DIAMBIL') tekMap[t.TEKNISI].selesai++;
    tekMap[t.TEKNISI].total += (Number(t.LABA_BERSIH)||0)+(Number(t.ONGKOS)||0);
    tekMap[t.TEKNISI].laba += (Number(t.LABA_BERSIH)||0);
  });

  var teks = Object.keys(tekMap).sort(function(a,b){return tekMap[b].total - tekMap[a].total;});
  var lines = [
    '<b>🏆 TOP TEKNISI — Bulan Ini</b>',
    '━━━━━━━━━━━━━━━'
  ];

  if (teks.length === 0) {
    lines.push('Belum ada data bulan ini');
  } else {
    var medals = ['🥇','🥈','🥉'];
    teks.slice(0, 10).forEach(function(t, i){
      var medal = i < 3 ? medals[i] : '  ' + (i+1) + '.';
      lines.push(medal + ' <b>' + tg(t) + '</b>');
      lines.push('    📋 ' + tekMap[t].count + ' trx (✅' + tekMap[t].selesai + ' selesai)');
      lines.push('    💰 ' + tgRp(tekMap[t].total) + ' | Laba: ' + tgRp(tekMap[t].laba));
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: LOG ========================
function cmdLog() {
  var logData = getSheetData(SHEET_NAMES.ACTIVITY_LOG);
  var recent = logData.slice().reverse().slice(0, 15);

  var lines = [
    '<b>📋 LOG AKTIVITAS — 15 Terakhir</b>',
    '━━━━━━━━━━━━━━━'
  ];

  if (recent.length === 0) {
    lines.push('Belum ada log');
  } else {
    recent.forEach(function(r){
      lines.push(tgDate(r.TIMESTAMP) + ' | ' + tg(r.AKSI) + ' | ' + tg(r.USER) + ' | ' + tg(truncateText(r.DETAIL, 60)));
    });
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ======================== COMMAND: TOGGLE NOTIF ========================
function cmdToggleNotif(args) {
  var arg = (args || '').trim().toLowerCase();
  var config = getTelegramConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CONFIG');
  if (!sheet) return '❌ Sheet CONFIG tidak ditemukan';

  var data = sheet.getDataRange().getValues();
  var rowIdx = -1;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === 'NOTIF_ENABLED') {
      rowIdx = i;
      break;
    }
  }

  var newState = arg === 'off' ? 'false' : 'true';
  if (rowIdx >= 0) {
    sheet.getRange(rowIdx + 1, 2).setValue(newState);
  } else {
    sheet.appendRow(['NOTIF_ENABLED', newState]);
  }

  var statusText = newState === 'true' ? '✅ AKTIF' : '❌ NONAKTIF';
  return '<b>🔔 Notifikasi: ' + statusText + '</b>\n\nGunakan /notifikasi on atau /notifikasi off';
}

// ======================== UTILITY ========================
function parsePeriod(args) {
  if (!args) return 'today';
  var a = args.toLowerCase().trim();
  if (a === 'week' || a === 'minggu' || a === '7') return 'week';
  if (a === 'month' || a === 'bulan' || a === '30') return 'month';
  if (a === 'today' || a === 'hari' || a === 'hari ini') return 'today';
  return 'today';
}

// Parse args to extract branch name and period
// Format: "/cmd BRANCH period" or "/cmd period" or "/cmd BRANCH"
function parseCabangPeriod(args) {
  var result = { cabang: '', period: 'today' };
  if (!args) return result;
  var parts = args.trim().split(/\s+/);
  var periods = ['today','week','month','minggu','bulan','hari','30','7','hari ini'];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].toLowerCase();
    if (periods.indexOf(p) !== -1) {
      result.period = parsePeriod(p);
    } else {
      result.cabang = parts[i].toUpperCase();
    }
  }
  return result;
}

// Get list of branch codes from CABANG sheet
function getCabangNames() {
  try {
    var data = getSheetData(SHEET_NAMES.CABANG);
    return data.map(function(c) {
      var kode = c.ID_CABANG ? String(c.ID_CABANG).trim() : '';
      var nama = c.NAMA_CABANG ? String(c.NAMA_CABANG).trim() : '';
      return kode ? (nama ? kode + ' (' + nama + ')' : kode) : '';
    }).filter(function(n) { return n.length > 0; });
  } catch(e) { return []; }
}

// Filter data array by branch (CABANG column)
function filterByCabang(data, cabang) {
  if (!cabang) return data;
  var cab = cabang.toUpperCase();
  return data.filter(function(r) {
    return r.CABANG && String(r.CABANG).trim().toUpperCase() === cab;
  });
}

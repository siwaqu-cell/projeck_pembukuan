/**
 * ============================================================
 * ServicePro HP v5.1 — ResetHelper.gs
 * Reset master data, config, and full system reset
 * ============================================================
 */

function resetMaster() {
  var ui = SpreadsheetApp.getUi();
  var c = ui.alert('⚠️ Reset Master Data', 'Hapus semua data di sheet:\n• CABANG\n• KARYAWAN\n• STOK_PART\n• PELANGGAN\n\nHeader tetap dipertahankan.\nLanjutkan?', ui.ButtonSet.YES_NO);
  if (c !== ui.Button.YES) return;

  [SHEET_NAMES.CABANG, SHEET_NAMES.KARYAWAN, SHEET_NAMES.STOK_PART, SHEET_NAMES.PELANGGAN].forEach(function(name) {
    var sh = getSheet(name);
    if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow()-1);
  });

  setupDefaultCabang();
  ui.alert('✅ Master data berhasil direset. Data cabang default telah dimasukkan kembali.');
}

function resetConfig() {
  var ui = SpreadsheetApp.getUi();
  var c = ui.alert('⚠️ Reset CONFIG', 'Hapus semua konfigurasi dan kembalikan ke default?\nLanjutkan?', ui.ButtonSet.YES_NO);
  if (c !== ui.Button.YES) return;

  var sh = getSheet(SHEET_NAMES.CONFIG);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow()-1);
  setupDefaultConfig();
  ui.alert('✅ CONFIG berhasil direset ke default.');
}

function resetSemua() {
  var ui = SpreadsheetApp.getUi();
  var c1 = ui.alert('🚨 PERINGATAN!', 'Ini akan menghapus SEMUA DATA di seluruh sheet!\n\n⚠️ Tindakan ini TIDAK BISA dibatalkan!\n\nApakah Anda YAKIN?', ui.ButtonSet.YES_NO);
  if (c1 !== ui.Button.YES) return;

  var c2 = ui.alert('🚨 KONFIRMASI TERAKHIR', 'Ketik "RESET" di prompt berikutnya untuk mengkonfirmasi.', ui.ButtonSet.OK_CANCEL);
  if (c2 !== ui.Button.OK) return;

  var resp = ui.prompt('Ketik RESET untuk mengkonfirmasi:');
  if (resp.getResponseText() !== 'RESET') { ui.alert('Reset dibatalkan.'); return; }

  // Delete all data rows from all sheets
  Object.values(SHEET_NAMES).forEach(function(name) {
    try {
      var sh = getSheet(name);
      if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow()-1);
    } catch(e) {}
  });

  // Re-insert defaults
  setupDefaultCabang();
  setupDefaultConfig();
  setupDefaultUsers();

  ui.alert('✅ Semua data berhasil direset. Data default telah dimasukkan kembali.');
}

/**
 * ============================================================
 * ServicePro HP v5.1 — Trigger.gs
 * onEdit auto-sync, time-based triggers
 * ============================================================
 */

function onEditTrigger(e) {
  try {
    if (!e || !e.source) return;
    var sheet = e.source.getActiveSheet();
    var name = sheet.getName();

    // Auto-sync validation when master data changes
    var masterSheets = [SHEET_NAMES.CABANG, SHEET_NAMES.KARYAWAN, SHEET_NAMES.STOK_PART, SHEET_NAMES.CONFIG];
    if (masterSheets.indexOf(name) !== -1) {
      // Debounce: only sync if editing within data rows
      if (e.range && e.range.getRow() >= 2) {
        SpreadsheetApp.getActiveSpreadsheet().toast('Menyinkronkan validasi...', '🔄', 3);
        setupValidasi();
      }
    }

    // Auto-update timestamp on TRANSAKSI edit
    if (name === SHEET_NAMES.TRANSAKSI && e.range && e.range.getRow() >= 2) {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var updatedCol = headers.indexOf('UPDATED_AT');
      if (updatedCol !== -1) {
        sheet.getRange(e.range.getRow(), updatedCol + 1).setValue(getTimestamp());
      }
    }
  } catch(err) {
    console.error('onEditTrigger error: ' + err.message);
  }
}

function createAllTriggers() {
  // Remove existing
  ScriptApp.getProjectTriggers().forEach(function(t) {
    ScriptApp.deleteTrigger(t);
  });

  // onEdit trigger
  ScriptApp.newTrigger('onEditTrigger')
    .forSpreadsheet(getSpreadsheet())
    .onEdit()
    .create();

  // Daily backup at 23:00
  ScriptApp.newTrigger('backupOtomatis')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .inTimezone('Asia/Makassar')
    .create();

  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert('✅ Semua trigger berhasil dibuat:\n• onEdit auto-sync\n• Backup otomatis jam 23:00');
  }
}

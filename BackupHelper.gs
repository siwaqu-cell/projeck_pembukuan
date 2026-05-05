/**
 * ============================================================
 * ServicePro HP v5.1 — BackupHelper.gs
 * Backup otomatis/manual, email notification, cleanup
 * ============================================================
 */

function backupOtomatis() {
  try {
    var ss = getSpreadsheet();
    var folderName = getConfigValue('BACKUP_FOLDER') || 'ServicePro_Backup';
    var folder = getOrCreateFolder(folderName);
    var fileName = 'ServicePro_Backup_' + Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd_HH-mm');

    var copy = ss.copy(fileName);
    var file = DriveApp.getFileById(copy.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    // Send email notification
    var email = getConfigValue('OWNER_EMAIL');
    if (email) {
      kirimEmail(email, '✅ Backup ServicePro Berhasil',
        'Backup otomatis berhasil dilakukan.\n\nFile: '+fileName+'\nWaktu: '+getTimestamp()+'\nFolder: '+folderName);
    }

    // Cleanup old backups
    hapusBackupLama();
    logActivity('SYSTEM', 'BACKUP', 'Backup otomatis: '+fileName, '', '');
    return {success:true, message:'Backup berhasil: '+fileName};
  } catch(e) {
    var email2 = getConfigValue('OWNER_EMAIL');
    if (email2) kirimEmail(email2, '❌ Backup ServicePro GAGAL', 'Error: '+e.message);
    return {success:false, message:'Error: '+e.message};
  }
}

function backupManual() {
  var result = backupOtomatis();
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert(result.success ? '✅ '+result.message : '❌ '+result.message);
  }
  return result;
}

function hapusBackupLama() {
  try {
    var folderName = getConfigValue('BACKUP_FOLDER') || 'ServicePro_Backup';
    var days = Number(getConfigValue('BACKUP_RETENTION_DAYS')) || 7;
    var folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) return;
    var folder = folders.next();
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    var files = folder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      if (f.getDateCreated() < cutoff) { f.setTrashed(true); }
    }
  } catch(e) { console.error('hapusBackupLama error: '+e.message); }
}

function kirimEmail(to, subject, body) {
  try { MailApp.sendEmail(to, subject, body); } catch(e) { console.error('kirimEmail error: '+e.message); }
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function aktivasiBackupOtomatis() {
  // Remove existing triggers
  matikanBackupOtomatis();
  // Create new daily trigger at 23:00
  ScriptApp.newTrigger('backupOtomatis').timeBased().atHour(23).everyDays(1)
    .inTimezone('Asia/Makassar').create();
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert('✅ Backup otomatis aktif setiap hari jam 23:00 WITA');
  }
}

function matikanBackupOtomatis() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'backupOtomatis') ScriptApp.deleteTrigger(t);
  });
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert('⏸️ Backup otomatis dimatikan');
  }
}

function bukaFolderBackup() {
  var folderName = getConfigValue('BACKUP_FOLDER') || 'ServicePro_Backup';
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    var url = folders.next().getUrl();
    var html = HtmlService.createHtmlOutput('<script>window.open("'+url+'","_blank");google.script.host.close();</script>')
      .setWidth(200).setHeight(50);
    SpreadsheetApp.getUi().showModalDialog(html, 'Membuka folder...');
  } else {
    SpreadsheetApp.getUi().alert('Folder backup belum ada');
  }
}

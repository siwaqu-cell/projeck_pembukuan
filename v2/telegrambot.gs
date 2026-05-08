// ============================================================
// ServicePro HP v5.1 — TelegramBot.gs
// Core Telegram Bot API: send messages, get updates, trigger setup
// ============================================================

function getTelegramConfig() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('CONFIG');
    if (!sheet) return { token: null, chatIds: [], enabled: true, stokMin: 3 };
    var data = sheet.getDataRange().getValues();
    var config = { token: null, chatIds: [], enabled: true, stokMin: 3 };
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0]).trim().toUpperCase();
      var val = String(data[i][1]).trim();
      if (key === 'BOT_TOKEN') config.token = val;
      if (key === 'OWNER_CHAT_ID') {
        config.chatIds = val.split(',').map(function(id){return id.trim();}).filter(function(id){return id.length > 0;});
      }
      if (key === 'NOTIF_ENABLED') config.enabled = (val !== 'false' && val !== 'FALSE' && val !== '0');
      if (key === 'STOK_MINIMUM') config.stokMin = parseInt(val) || 3;
    }
    return config;
  } catch(e) {
    return { token: null, chatIds: [], enabled: false, stokMin: 3 };
  }
}

function telegramApi(method, payload) {
  var config = getTelegramConfig();
  if (!config.token) return null;
  var url = 'https://api.telegram.org/bot' + config.token + '/' + method;
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  };
  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('TG API error ' + code + ': ' + response.getContentText());
      return null;
    }
    return JSON.parse(response.getContentText());
  } catch(e) {
    Logger.log('TG API fetch error: ' + e.message);
    return null;
  }
}

function sendTelegramMessage(chatId, text, opts) {
  var payload = {
    chat_id: chatId,
    text: text || '(kosong)',
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (opts) {
    if (opts.reply_markup) payload.reply_markup = opts.reply_markup;
    if (opts.disable_notification) payload.disable_notification = true;
  }
  return telegramApi('sendMessage', payload);
}

function sendTelegramToOwner(text, opts) {
  var config = getTelegramConfig();
  if (!config.token || config.chatIds.length === 0) return;
  if (!config.enabled) return;
  config.chatIds.forEach(function(chatId) {
    try { sendTelegramMessage(chatId, text, opts); } catch(e) {}
  });
}

function sendTelegramNotif(type, data) {
  try {
    var config = getTelegramConfig();
    if (!config.token || config.chatIds.length === 0 || !config.enabled) return;
    var text = formatNotifMessage(type, data);
    if (!text) return;
    sendTelegramToOwner(text);
    // Cek stok rendah setelah transaksi yang mengubah stok
    if (['TRANSAKSI_BARU','PEMBELIAN','JUAL_PART','TRANSFER_KELUAR','IMPORT_STOK','RETURN_SUPPLIER'].indexOf(type) !== -1) {
      checkAndNotifyLowStock(data.cabang);
    }
  } catch(e) {
    Logger.log('TG notif error: ' + e.message);
  }
}

function getLastUpdateId() {
  return parseInt(PropertiesService.getScriptProperties().getProperty('TG_UPDATE_OFFSET') || '0');
}

function setLastUpdateId(id) {
  PropertiesService.getScriptProperties().setProperty('TG_UPDATE_OFFSET', String(id));
}

function getTelegramUpdates() {
  var config = getTelegramConfig();
  if (!config.token) return [];
  var offset = getLastUpdateId();
  var result = telegramApi('getUpdates', {
    offset: offset + 1,
    timeout: 10,
    allowed_updates: ['message', 'callback_query']
  });
  if (!result || !result.ok || !result.result) return [];
  return result.result;
}

function checkTelegramCommands() {
  try {
    var updates = getTelegramUpdates();
    if (!updates.length) return;
    var config = getTelegramConfig();
    if (!config.token || config.chatIds.length === 0) return;
    for (var i = 0; i < updates.length; i++) {
      var u = updates[i];
      setLastUpdateId(u.update_id);
      // Only respond to authorized chats
      var chatId = u.message ? u.message.chat.id : (u.callback_query ? u.callback_query.message.chat.id : 0);
      if (config.chatIds.indexOf(String(chatId)) === -1) continue;
      if (u.message && u.message.text) {
        handleTelegramCommand(u.message.text, chatId);
      } else if (u.callback_query) {
        handleTelegramCallback(u.callback_query);
      }
    }
  } catch(e) {
    Logger.log('TG command check error: ' + e.message);
  }
}

function handleTelegramCallback(callbackQuery) {
  try {
    var data = callbackQuery.data || '';
    var chatId = callbackQuery.message.chat.id;
    var msgId = callbackQuery.message.message_id;
    // Acknowledge callback
    telegramApi('answerCallbackQuery', { callback_query_id: callbackQuery.id, text: '✅' });
    // Route to command handler
    if (data.indexOf('cmd:') === 0) {
      handleTelegramCommand(data.substring(4), chatId);
    }
  } catch(e) {
    Logger.log('TG callback error: ' + e.message);
  }
}

function setupTelegramTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkTelegramCommands') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('checkTelegramCommands').timeBased().everyMinutes(1).create();
  Logger.log('Telegram trigger set up (every 2 minutes)');
}

function removeTelegramTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkTelegramCommands') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log('Telegram trigger removed');
}

function setupWebhook() {
  removeTelegramTrigger();
  var config = getTelegramConfig();
  if (!config.token) return { success: false, message: 'BOT_TOKEN belum diisi di sheet CONFIG' };
  if (config.chatIds.length === 0) return { success: false, message: 'OWNER_CHAT_ID belum diisi' };

  // Try auto-detect URL first, then check CONFIG for manual URL
  var url = '';
  try {
    url = ScriptApp.getService().getUrl();
  } catch(e) {}

  // Also check CONFIG sheet for WEBAPP_URL (manual override)
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CONFIG');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === 'WEBAPP_URL') {
        url = String(data[i][1]).trim();
        break;
      }
    }
  }

  if (!url) return { success: false, message: 'URL web app tidak ditemukan.\n\nCara mendapatkan URL:\n1. Buka Apps Script → Deploy → New deployment\n2. Pilih "Web app" → Execute as: Me → Who: Anyone\n3. Klik Deploy → Copy URL-nya\n4. Simpan di sheet CONFIG:\n   Key: WEBAPP_URL\n   Value: (paste URL di sini)\n5. Jalankan setupWebhook lagi.' };

  var result = telegramApi('setWebhook', { url: url });
  if (result && result.ok) {
    PropertiesService.getScriptProperties().setProperty('TG_WEBHOOK_URL', url);
    return { success: true, message: 'Webhook aktif!\nURL: ' + url + '\nBot sekarang balas INSTAN. Kirim /help ke bot untuk test.' };
  }
  return { success: false, message: 'Gagal set webhook: ' + JSON.stringify(result) };
}

function deleteWebhook() {
  var config = getTelegramConfig();
  if (!config.token) return { success: false, message: 'BOT_TOKEN belum diisi' };
  var result = telegramApi('deleteWebhook', {});
  if (result && result.ok) {
    PropertiesService.getScriptProperties().deleteProperty('TG_WEBHOOK_URL');
    return { success: true, message: 'Webhook dihapus. Bot tidak akan menerima pesan lagi.' };
  }
  return { success: false, message: 'Gagal hapus webhook' };
}

function switchToPolling() {
  deleteWebhook();
  setupTelegramTrigger();
  return { success: true, message: 'Kembali ke polling mode (cek tiap 1 menit).' };
}

function testTelegramConnection() {
  var config = getTelegramConfig();
  if (!config.token) return { success: false, message: 'BOT_TOKEN belum diisi di sheet CONFIG' };
  if (config.chatIds.length === 0) return { success: false, message: 'OWNER_CHAT_ID belum diisi di sheet CONFIG' };
  var result = telegramApi('getMe');
  if (!result || !result.ok) return { success: false, message: 'Gagal koneksi ke Telegram API' };
  var botInfo = result.result;
  var sentCount = 0;
  config.chatIds.forEach(function(chatId) {
    var sent = sendTelegramMessage(chatId, '<b>✅ ServicePro HP — Bot Terhubung!</b>\n\nBot: @' + botInfo.username + '\nWaktu: ' + Utilities.formatDate(new Date(), 'Asia/Makassar', 'dd/MM/yyyy HH:mm:ss') + '\n\nKirim /help untuk melihat daftar command.');
    if (sent && sent.ok) sentCount++;
  });
  return { success: sentCount > 0, message: 'Bot terhubung! Pesan test terkirim ke ' + sentCount + '/' + config.chatIds.length + ' chat.' };
}

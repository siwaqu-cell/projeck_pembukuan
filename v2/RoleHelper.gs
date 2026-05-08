/**
 * ============================================================
 * ServicePro HP v5.1 — RoleHelper.gs
 * Login, access control, role-based permissions
 * ============================================================
 */

// Permission matrix
var PERMISSIONS = {
  OWNER: ['transaksi','status','pembelian','return','transfer','masterdata','dashboard',
          'laporankas','laporanstok','laporanlengkap','riwayatpart','importstok','backup','reset','users','kasir','piutang','riwayatlog','stockopname'],
  ADMIN: ['transaksi','status','pembelian','return','transfer','masterdata','dashboard',
          'laporankas','laporanstok','laporanlengkap','kasir','piutang','riwayatlog','stockopname'],
  ADMIN_NO_EDIT: ['transaksi','status','pembelian','return','transfer','kasir','stockopname'],
  ADMIN_HANYA_INPUT: ['transaksi','status','dashboard','laporanstok','kasir','stockopname'],
  ADMIN_LIMITED: ['transaksi','status','dashboard','laporanstok','kasir','stockopname'],
  TEKNISI: ['status','dashboard']
};

function hashPassword(plain) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plain);
  return bytes.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function login(username, password) {
  try {
    if (!username || !password) return {success:false, message:'Username dan password harus diisi'};

    var hashedInput = hashPassword(password);
    var users = getSheetData(SHEET_NAMES.USERS);
    var found = users.filter(function(u) {
      if (String(u.USERNAME).toLowerCase() !== String(username).toLowerCase()) return false;
      if (u.STATUS !== 'AKTIF') return false;
      // Support both hashed and plain text passwords (backward compatible)
      var stored = String(u.PASSWORD);
      return stored === hashedInput || stored === password;
    });

    if (found.length === 0) return {success:false, message:'Username atau password salah'};

    var user = found[0];
    logActivity(user.USERNAME, 'LOGIN', 'Login berhasil', user.CABANG, '');

    // Generate session token (8 hours TTL)
    var token = Utilities.getUuid();
    var sessionData = {
      username: user.USERNAME,
      role: user.ROLE,
      cabang: user.CABANG,
      nama: user.NAMA,
      permissions: PERMISSIONS[user.ROLE] || [],
      loginTime: getTimestamp()
    };
    CacheService.getScriptCache().put('session_' + token, JSON.stringify(sessionData), 21600); // 6 hours (max)

    return {
      success: true,
      message: 'Login berhasil!',
      token: token,
      session: sessionData
    };
  } catch(e) {
    return {success:false, message:'Error: '+e.message};
  }
}

function cekAkses(role, fitur) {
  var perms = PERMISSIONS[role] || [];
  return perms.indexOf(fitur) !== -1;
}

function validateSession(session) {
  if (!session || !session.username || !session.role) return false;
  var users = getSheetData(SHEET_NAMES.USERS);
  var found = users.filter(function(u) {
    return u.USERNAME === session.username && u.STATUS === 'AKTIF';
  });
  return found.length > 0;
}

/** Invalidate session token (logout) */
function invalidateSession(token) {
  if (token) CacheService.getScriptCache().remove('session_' + token);
}

function getCabangForUser(session) {
  if (!session) return [];
  if (session.cabang === 'SEMUA' || session.role === 'OWNER') {
    return getCabangList();
  }
  return getCabangList().filter(function(c){return c.id === session.cabang;});
}

function isOwner(session) {
  return session && session.role === 'OWNER';
}

function isCabangLocked(session) {
  return session && session.cabang && session.cabang !== 'SEMUA';
}

/**
 * ============================================================
 * ServicePro HP v5.1 — RoleHelper.gs
 * Login, access control, role-based permissions
 * ============================================================
 */

// Permission matrix
var PERMISSIONS = {
  OWNER: ['transaksi','status','pembelian','return','transfer','masterdata','dashboard',
          'laporankas','laporanstok','laporanlengkap','riwayatpart','importstok','backup','reset','users', 'kasir'],
  ADMIN: ['transaksi','status','pembelian','return','transfer','masterdata','dashboard',
          'laporankas','laporanstok','laporanlengkap', 'kasir'],
  ADMIN_NO_EDIT: ['transaksi','status','pembelian','return','transfer','masterdata',
          'laporankas','laporanstok', 'kasir'],
  ADMIN_LIMITED: ['transaksi','status','dashboard','laporanstok', 'kasir'],
  TEKNISI: ['status','dashboard']
};

function login(username, password) {
  try {
    if (!username || !password) return {success:false, message:'Username dan password harus diisi'};

    var users = getSheetData(SHEET_NAMES.USERS);
    var found = users.filter(function(u) {
      return String(u.USERNAME).toLowerCase() === String(username).toLowerCase() &&
             String(u.PASSWORD) === String(password) &&
             u.STATUS === 'AKTIF';
    });

    if (found.length === 0) return {success:false, message:'Username atau password salah'};

    var user = found[0];
    logActivity(user.USERNAME, 'LOGIN', 'Login berhasil', user.CABANG, '');

    return {
      success: true,
      message: 'Login berhasil!',
      session: {
        username: user.USERNAME,
        role: user.ROLE,
        cabang: user.CABANG,
        nama: user.NAMA,
        permissions: PERMISSIONS[user.ROLE] || [],
        loginTime: getTimestamp()
      }
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

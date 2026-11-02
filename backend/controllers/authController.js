const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');
const { isBlank } = require('../utils/validate');

const COLUMNS = 'id_user, nama, username, email, password_hash, role, level_akses';

// Sequence Login: input username & password -> Validasi -> ambil_data_user -> sukses/gagal
async function login(req, res) {
  const { username, password } = req.body || {};

  // Validasi (<<Gagal>> bila input kosong)
  const errors = [];
  if (isBlank(username)) errors.push('Username atau email wajib diisi');
  if (isBlank(password)) errors.push('Password wajib diisi');
  if (errors.length) return fail(res, 'Input tidak valid', 400, errors);

  if (!process.env.JWT_SECRET) {
    console.error('[AUTH] JWT_SECRET belum diisi di .env');
    return fail(res, 'Terjadi kesalahan pada server', 500);
  }

  const identifier = String(username).trim();

  // ambil_data_user(): cari berdasarkan username, lalu email
  let { data: user, error } = await supabase
    .from('users').select(COLUMNS).eq('username', identifier).maybeSingle();
  if (!error && !user) {
    ({ data: user, error } = await supabase
      .from('users').select(COLUMNS).eq('email', identifier.toLowerCase()).maybeSingle());
  }
  if (error) {
    console.error('[DB] Gagal mengambil data user:', error.message);
    return fail(res, 'Terjadi kesalahan pada server', 500);
  }

  // Pesan sengaja disamakan agar tidak membocorkan apakah username terdaftar
  const passwordCocok = user ? await bcrypt.compare(String(password), user.password_hash) : false;
  if (!user || !passwordCocok) {
    return fail(res, 'Username/email atau password salah', 401);
  }

  const token = jwt.sign(
    { id: user.id_user, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const { password_hash, ...profil } = user;
  return ok(res, { token, user: profil }, 'Login berhasil');
}

// Data pengguna yang sedang login (untuk frontend memuat sesi)
async function me(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('id_user, nama, username, email, role, level_akses')
    .eq('id_user', req.user.id)
    .maybeSingle();
  if (error) {
    console.error('[DB] Gagal mengambil profil:', error.message);
    return fail(res, 'Terjadi kesalahan pada server', 500);
  }
  if (!data) return fail(res, 'Pengguna tidak ditemukan', 404);
  return ok(res, data, 'Data pengguna berhasil diambil');
}

// Token bersifat stateless, jadi logout cukup menghapus token di sisi frontend
function logout(req, res) {
  return ok(res, null, 'Logout berhasil');
}

module.exports = { login, me, logout };

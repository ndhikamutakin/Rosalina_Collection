const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

// Memastikan pengguna sudah login (token JWT valid)
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return fail(res, 'Silakan login terlebih dahulu', 401);
  }
  if (!process.env.JWT_SECRET) {
    console.error('[AUTH] JWT_SECRET belum diisi di .env');
    return fail(res, 'Terjadi kesalahan pada server', 500);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    return next();
  } catch (err) {
    return fail(res, 'Sesi berakhir atau token tidak valid, silakan login ulang', 401);
  }
}

// Membatasi akses sesuai peran (owner / admin)
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return fail(res, 'Anda tidak memiliki akses untuk fitur ini', 403);
  }
  return next();
};

module.exports = { authenticate, authorize };

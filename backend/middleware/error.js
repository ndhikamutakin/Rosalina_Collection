const { fail } = require('../utils/response');

function notFound(req, res) {
  return fail(res, 'Endpoint tidak ditemukan', 404);
}

// Penanganan error terakhir: detail teknis hanya di log server, tidak dikirim ke pengguna
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && err.type === 'entity.parse.failed') {
    return fail(res, 'Format data yang dikirim tidak valid', 400);
  }
  console.error('[ERROR]', err);
  return fail(res, 'Terjadi kesalahan pada server', 500);
}

module.exports = { notFound, errorHandler };

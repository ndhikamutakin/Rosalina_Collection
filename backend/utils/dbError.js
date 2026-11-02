const { fail } = require('./response');

// Menerjemahkan error Supabase/PostgreSQL menjadi pesan yang aman
// (tidak membocorkan detail teknis ke pengguna).
function handleDbError(res, error, context = 'memproses data') {
  console.error(`[DB] Gagal ${context}:`, error && error.message);

  switch (error && error.code) {
    case '23503':
      return fail(res, 'Data tidak dapat diproses karena masih terkait dengan data lain', 409);
    case '23505':
      return fail(res, 'Data sudah ada (duplikat)', 409);
    case '23502':
    case '23514':
    case '22P02':
    case '22007':
      return fail(res, 'Data yang dimasukkan tidak valid', 400);
    default:
      return fail(res, `Gagal ${context}, silakan coba lagi`, 500);
  }
}

module.exports = { handleDbError };

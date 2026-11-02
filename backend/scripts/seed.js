// Membuat akun awal Owner dan Admin. Jalankan: npm run seed
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const users = [
  { nama: 'Owner Rosalina', username: 'owner', email: 'owner@rosalina.local', password: 'owner123', role: 'owner', level_akses: 'penuh' },
  { nama: 'Admin Rosalina', username: 'admin', email: 'admin@rosalina.local', password: 'admin123', role: 'admin', level_akses: 'operasional' },
];

(async () => {
  for (const u of users) {
    const { password, ...rest } = u;
    const password_hash = await bcrypt.hash(password, 10);
    const { error } = await supabase
      .from('users')
      .upsert({ ...rest, password_hash }, { onConflict: 'username' });
    if (error) {
      console.error(`Gagal membuat user ${u.username}:`, error.message);
      process.exitCode = 1;
    } else {
      console.log(`User ${u.username} siap (password awal: ${password}) - segera ganti!`);
    }
  }
})();

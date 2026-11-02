require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.warn('[PERINGATAN] SUPABASE_URL / SUPABASE_KEY belum diisi di file .env');
}

const supabase = createClient(url || 'http://localhost', key || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;

const supabase = require('../config/supabase');
const { makeCrud } = require('../utils/crud');

const SELECT_WO = '*, work_order(id_wo, tanggal, status, model:model_produksi(nama_model))';

// Pastikan work order ada (pesan lebih ramah daripada error foreign key)
async function cekWorkOrder(idWo) {
  const { data, error } = await supabase
    .from('work_order').select('id_wo').eq('id_wo', idWo).maybeSingle();
  if (error) return 'Gagal memeriksa work order';
  if (!data) return 'Work order tidak ditemukan';
  return null;
}

// Catat / Update / Hapus Hasil Potong
const hasilPotong = makeCrud({
  table: 'hasil_potong',
  idCol: 'id_potong',
  label: 'Hasil potong',
  select: SELECT_WO,
  rules: {
    id_wo: { label: 'Work order', required: true, type: 'int', min: 1 },
    jumlah: { label: 'Jumlah hasil potong', required: true, type: 'int', min: 1 },
    tanggal: { label: 'Tanggal', type: 'date' },
  },
  beforeSave: async (clean) => (clean.id_wo ? cekWorkOrder(clean.id_wo) : null),
});

// Catat / Update / Hapus Hasil Jahit (terhubung ke hasil potong)
const hasilJahit = makeCrud({
  table: 'hasil_jahit',
  idCol: 'id_jahit',
  label: 'Hasil jahit',
  select: SELECT_WO,
  rules: {
    id_wo: { label: 'Work order', required: true, type: 'int', min: 1 },
    id_potong: { label: 'Hasil potong', required: true, type: 'int', min: 1 },
    jumlah: { label: 'Jumlah hasil jahit', required: true, type: 'int', min: 1 },
    tanggal: { label: 'Tanggal', type: 'date' },
  },
  beforeSave: async (clean) => {
    if (clean.id_wo) {
      const msg = await cekWorkOrder(clean.id_wo);
      if (msg) return msg;
    }
    if (clean.id_potong) {
      const { data, error } = await supabase
        .from('hasil_potong').select('id_potong, id_wo').eq('id_potong', clean.id_potong).maybeSingle();
      if (error) return 'Gagal memeriksa hasil potong';
      if (!data) return 'Hasil potong tidak ditemukan';
      if (clean.id_wo && data.id_wo !== clean.id_wo) {
        return 'Hasil potong tidak sesuai dengan work order yang dipilih';
      }
    }
    return null;
  },
});

// Catat / Update / Hapus Hasil QC (jumlah lolos dan reject)
const hasilQc = makeCrud({
  table: 'hasil_qc',
  idCol: 'id_qc',
  label: 'Hasil QC',
  select: SELECT_WO,
  rules: {
    id_wo: { label: 'Work order', required: true, type: 'int', min: 1 },
    jumlah_lolos: { label: 'Jumlah lolos', required: true, type: 'int', min: 0 },
    jumlah_reject: { label: 'Jumlah reject', required: true, type: 'int', min: 0 },
    tanggal: { label: 'Tanggal', type: 'date' },
  },
  beforeSave: async (clean, id) => {
    const adaLolos = clean.jumlah_lolos !== undefined;
    const adaReject = clean.jumlah_reject !== undefined;
    if (id && adaLolos !== adaReject) {
      return 'Jumlah lolos dan jumlah reject harus diisi bersamaan';
    }
    if (adaLolos && adaReject) {
      clean.jumlah = clean.jumlah_lolos + clean.jumlah_reject;
      if (clean.jumlah < 1) return 'Total hasil QC minimal 1';
    }
    if (clean.id_wo) return cekWorkOrder(clean.id_wo);
    return null;
  },
});

module.exports = { hasilPotong, hasilJahit, hasilQc };

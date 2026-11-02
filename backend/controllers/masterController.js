const { makeCrud } = require('../utils/crud');

// Model Produksi: Tambah / Update / Hapus / Lihat Model Produksi
const modelProduksi = makeCrud({
  table: 'model_produksi',
  idCol: 'id_model',
  label: 'Model produksi',
  rules: {
    nama_model: { label: 'Nama model', required: true, type: 'string' },
    deskripsi: { label: 'Deskripsi', type: 'string' },
  },
});

// Kain: Tambah / Update / Hapus / Lihat Kain
const kain = makeCrud({
  table: 'kain',
  idCol: 'id_kain',
  label: 'Kain',
  rules: {
    nama_kain: { label: 'Nama kain', required: true, type: 'string' },
    jenis: { label: 'Jenis kain', required: true, type: 'string' },
    stok: { label: 'Stok', required: true, type: 'int', min: 0 },
  },
});

// Bahan Pendukung (Bahan Tambahan): Tambah / Update / Hapus / Lihat Bahan
const bahanPendukung = makeCrud({
  table: 'bahan_pendukung',
  idCol: 'id_bahan',
  label: 'Bahan pendukung',
  rules: {
    nama_bahan: { label: 'Nama bahan', required: true, type: 'string' },
    stok: { label: 'Stok', required: true, type: 'int', min: 0 },
  },
});

// Tim Produksi: Tambah karyawan / Ubah jumlah anggota / Hapus anggota / Lihat tim
const timProduksi = makeCrud({
  table: 'tim_produksi',
  idCol: 'id_karyawan',
  label: 'Tim produksi',
  rules: {
    nama_karyawan: { label: 'Nama karyawan', required: true, type: 'string' },
    jenis_tim: { label: 'Jenis tim', required: true, type: 'enum', values: ['potong', 'jahit', 'qc'] },
    jumlah_anggota: { label: 'Jumlah anggota', required: true, type: 'int', min: 0 },
  },
});

module.exports = { modelProduksi, kain, bahanPendukung, timProduksi };

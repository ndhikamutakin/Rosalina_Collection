const supabase = require('../config/supabase');
const { ok, created, fail } = require('../utils/response');
const { validate, isBlank, isDate } = require('../utils/validate');
const { handleDbError } = require('../utils/dbError');

const SELECT = '*, items:pembelian_detail(*)';

const itemRules = {
  jenis_bahan: { label: 'Jenis bahan', required: true, type: 'enum', values: ['kain', 'bahan_pendukung'] },
  id_kain: { label: 'Kain', type: 'int', min: 1 },
  id_bahan: { label: 'Bahan pendukung', type: 'int', min: 1 },
  jumlah: { label: 'Jumlah', required: true, type: 'int', min: 1 },
  harga_satuan: { label: 'Harga satuan', required: true, type: 'number', min: 0 },
};

// Memanggil fungsi SQL ubah_stok (atomik) untuk tiap item. sign: +1 tambah stok, -1 kurangi stok.
async function applyStock(items, sign) {
  const applied = [];
  for (const it of items) {
    const jenis = it.jenis_bahan;
    const id = jenis === 'kain' ? it.id_kain : it.id_bahan;
    const { error } = await supabase.rpc('ubah_stok', {
      p_jenis: jenis, p_id: id, p_delta: sign * it.jumlah,
    });
    if (error) return { error, applied };
    applied.push(it);
  }
  return { error: null, applied };
}

const rollbackStock = (applied, sign) => (applied.length ? applyStock(applied, -sign) : null);

// Sequence Tambah Pembelian Bahan: form -> simpan_Pembelian_bahan() -> sukses
async function create(req, res) {
  const body = req.body || {};
  const errors = [];

  const header = validate(body, {
    tanggal: { label: 'Tanggal', type: 'date' },
    keterangan: { label: 'Keterangan', type: 'string' },
    total_biaya: { label: 'Total biaya', type: 'number', min: 0 },
  });
  errors.push(...header.errors);

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = [];
  rawItems.forEach((raw, i) => {
    const r = validate(raw, itemRules);
    r.errors.forEach((e) => errors.push(`Item ${i + 1}: ${e}`));
    if (r.errors.length) return;
    if (r.clean.jenis_bahan === 'kain' && !r.clean.id_kain) errors.push(`Item ${i + 1}: Kain wajib dipilih`);
    if (r.clean.jenis_bahan === 'bahan_pendukung' && !r.clean.id_bahan) errors.push(`Item ${i + 1}: Bahan pendukung wajib dipilih`);
    const item = { ...r.clean };
    if (item.jenis_bahan === 'kain') delete item.id_bahan; else delete item.id_kain;
    items.push(item);
  });

  if (items.length === 0 && isBlank(body.total_biaya)) {
    errors.push('Isi rincian item pembelian atau total biaya');
  }
  if (errors.length) return fail(res, 'Input tidak valid', 400, errors);

  // Total biaya dihitung dari rincian bila ada
  const total = items.length
    ? items.reduce((t, it) => t + it.jumlah * it.harga_satuan, 0)
    : header.clean.total_biaya;

  const { data: pembelian, error: errHeader } = await supabase
    .from('pembelian_bahan')
    .insert({ ...header.clean, total_biaya: total })
    .select()
    .single();
  if (errHeader) return handleDbError(res, errHeader, 'menyimpan pembelian bahan');

  if (items.length) {
    const rows = items.map((it) => ({ ...it, id_pembelian: pembelian.id_pembelian }));
    const { error: errDetail } = await supabase.from('pembelian_detail').insert(rows);
    if (errDetail) {
      await supabase.from('pembelian_bahan').delete().eq('id_pembelian', pembelian.id_pembelian);
      return handleDbError(res, errDetail, 'menyimpan rincian pembelian');
    }

    const { error: errStok, applied } = await applyStock(items, +1);
    if (errStok) {
      await rollbackStock(applied, +1);
      await supabase.from('pembelian_bahan').delete().eq('id_pembelian', pembelian.id_pembelian);
      return handleDbError(res, errStok, 'memperbarui stok bahan');
    }
  }

  const { data, error } = await supabase
    .from('pembelian_bahan').select(SELECT).eq('id_pembelian', pembelian.id_pembelian).single();
  if (error) return handleDbError(res, error, 'mengambil pembelian bahan');
  return created(res, data, 'Pembelian bahan berhasil ditambahkan');
}

async function list(req, res) {
  const { mulai, selesai } = req.query;
  if ((mulai && !isDate(mulai)) || (selesai && !isDate(selesai))) {
    return fail(res, 'Tanggal harus berformat YYYY-MM-DD', 400);
  }
  let query = supabase.from('pembelian_bahan').select(SELECT).order('tanggal', { ascending: false });
  if (mulai) query = query.gte('tanggal', mulai);
  if (selesai) query = query.lte('tanggal', selesai);
  const { data, error } = await query;
  if (error) return handleDbError(res, error, 'mengambil data pembelian bahan');
  return ok(res, data, 'Data pembelian bahan berhasil diambil');
}

async function detail(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return fail(res, 'ID tidak valid', 400);
  const { data, error } = await supabase
    .from('pembelian_bahan').select(SELECT).eq('id_pembelian', id).maybeSingle();
  if (error) return handleDbError(res, error, 'mengambil pembelian bahan');
  if (!data) return fail(res, 'Pembelian bahan tidak ditemukan', 404);
  return ok(res, data, 'Data pembelian bahan berhasil diambil');
}

// Sequence Update Pembelian Bahan: ubah tanggal/keterangan (dan total biaya bila tanpa rincian).
// Untuk mengubah rincian item, hapus pembelian lalu buat ulang agar stok tetap konsisten.
async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return fail(res, 'ID tidak valid', 400);

  const { errors, clean } = validate(req.body, {
    tanggal: { label: 'Tanggal', type: 'date' },
    keterangan: { label: 'Keterangan', type: 'string' },
    total_biaya: { label: 'Total biaya', type: 'number', min: 0 },
  }, { partial: true });
  if (errors.length) return fail(res, 'Input tidak valid', 400, errors);
  if (Object.keys(clean).length === 0) return fail(res, 'Tidak ada data yang diubah', 400);

  if (clean.total_biaya !== undefined) {
    const { count, error: errCount } = await supabase
      .from('pembelian_detail').select('id_detail', { count: 'exact', head: true }).eq('id_pembelian', id);
    if (errCount) return handleDbError(res, errCount, 'memeriksa rincian pembelian');
    if (count > 0) {
      return fail(res, 'Total biaya dihitung otomatis dari rincian item dan tidak dapat diubah langsung', 400);
    }
  }

  const { data, error } = await supabase
    .from('pembelian_bahan').update(clean).eq('id_pembelian', id).select(SELECT);
  if (error) return handleDbError(res, error, 'memperbarui pembelian bahan');
  if (!data || data.length === 0) return fail(res, 'Pembelian bahan tidak ditemukan', 404);
  return ok(res, data[0], 'Pembelian bahan berhasil diperbarui');
}

// Sequence Hapus Pembelian: stok dikembalikan (dikurangi) sebelum data dihapus
async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return fail(res, 'ID tidak valid', 400);

  const { data: pembelian, error: errGet } = await supabase
    .from('pembelian_bahan').select(SELECT).eq('id_pembelian', id).maybeSingle();
  if (errGet) return handleDbError(res, errGet, 'mengambil pembelian bahan');
  if (!pembelian) return fail(res, 'Pembelian bahan tidak ditemukan', 404);

  const items = pembelian.items || [];
  const { error: errStok, applied } = await applyStock(items, -1);
  if (errStok) {
    await rollbackStock(applied, -1);
    if (errStok.code === '23514') {
      return fail(res, 'Pembelian tidak dapat dihapus karena stok bahan sudah terpakai', 409);
    }
    return handleDbError(res, errStok, 'mengembalikan stok bahan');
  }

  const { error } = await supabase.from('pembelian_bahan').delete().eq('id_pembelian', id);
  if (error) {
    await rollbackStock(applied, -1);
    return handleDbError(res, error, 'menghapus pembelian bahan');
  }
  return ok(res, pembelian, 'Pembelian bahan berhasil dihapus');
}

// Sequence Hitung Total Pembelian Bahan: Hitung_Total() -> ambil_data_pembelian() -> total biaya
async function hitungTotal(req, res) {
  const { mulai, selesai } = req.query;
  if ((mulai && !isDate(mulai)) || (selesai && !isDate(selesai))) {
    return fail(res, 'Tanggal harus berformat YYYY-MM-DD', 400);
  }
  let query = supabase.from('pembelian_bahan').select('total_biaya');
  if (mulai) query = query.gte('tanggal', mulai);
  if (selesai) query = query.lte('tanggal', selesai);
  const { data, error } = await query;
  if (error) return handleDbError(res, error, 'menghitung total pembelian');

  const totalBiaya = (data || []).reduce((t, r) => t + Number(r.total_biaya || 0), 0);
  return ok(
    res,
    { mulai: mulai || null, selesai: selesai || null, jumlah_transaksi: data.length, total_biaya: totalBiaya },
    'Total pembelian bahan berhasil dihitung'
  );
}

module.exports = { create, list, detail, update, remove, hitungTotal };

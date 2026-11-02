const supabase = require('../config/supabase');
const { ok, created, fail } = require('../utils/response');
const { validate } = require('../utils/validate');
const { handleDbError } = require('../utils/dbError');

const SELECT =
  '*, model:model_produksi(id_model, nama_model), tim:tim_produksi(id_karyawan, nama_karyawan, jenis_tim)';

const createRules = {
  tanggal: { label: 'Tanggal', type: 'date' },
  jumlah_produksi: { label: 'Jumlah produksi', required: true, type: 'int', min: 1 },
  id_model: { label: 'Model produksi', required: true, type: 'int', min: 1 },
  id_tim: { label: 'Tim produksi', type: 'int', min: 1 },
};

// Owner membuat work order (BuatWorkOrder)
async function create(req, res) {
  const { errors, clean } = validate(req.body, createRules);
  if (errors.length) return fail(res, 'Input tidak valid', 400, errors);

  const { data: model, error: errModel } = await supabase
    .from('model_produksi').select('id_model').eq('id_model', clean.id_model).maybeSingle();
  if (errModel) return handleDbError(res, errModel, 'memeriksa model produksi');
  if (!model) return fail(res, 'Model produksi tidak ditemukan', 400);

  if (clean.id_tim) {
    const { data: tim, error: errTim } = await supabase
      .from('tim_produksi').select('id_karyawan').eq('id_karyawan', clean.id_tim).maybeSingle();
    if (errTim) return handleDbError(res, errTim, 'memeriksa tim produksi');
    if (!tim) return fail(res, 'Tim produksi tidak ditemukan', 400);
  }

  const { data, error } = await supabase
    .from('work_order')
    .insert({ ...clean, status: 'proses', dibuat_oleh: req.user.id })
    .select(SELECT)
    .single();
  if (error) return handleDbError(res, error, 'menyimpan work order');
  return created(res, data, 'Work order berhasil dibuat');
}

async function list(req, res) {
  let query = supabase.from('work_order').select(SELECT).order('tanggal', { ascending: false });
  if (req.query.status) {
    if (!['proses', 'selesai'].includes(req.query.status)) {
      return fail(res, 'Status harus proses atau selesai', 400);
    }
    query = query.eq('status', req.query.status);
  }
  const { data, error } = await query;
  if (error) return handleDbError(res, error, 'mengambil data work order');
  return ok(res, data, 'Data work order berhasil diambil');
}

async function detail(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return fail(res, 'ID tidak valid', 400);
  const { data, error } = await supabase.from('work_order').select(SELECT).eq('id_wo', id).maybeSingle();
  if (error) return handleDbError(res, error, 'mengambil work order');
  if (!data) return fail(res, 'Work order tidak ditemukan', 404);
  return ok(res, data, 'Data work order berhasil diambil');
}

// MulaiProduksi() / SelesaiProduksi(): ubah status work order
async function updateStatus(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return fail(res, 'ID tidak valid', 400);

  const { errors, clean } = validate(req.body, {
    status: { label: 'Status', required: true, type: 'enum', values: ['proses', 'selesai'] },
  });
  if (errors.length) return fail(res, 'Input tidak valid', 400, errors);

  const { data, error } = await supabase
    .from('work_order').update({ status: clean.status }).eq('id_wo', id).select(SELECT);
  if (error) return handleDbError(res, error, 'memperbarui status work order');
  if (!data || data.length === 0) return fail(res, 'Work order tidak ditemukan', 404);
  return ok(res, data[0], 'Status work order berhasil diperbarui');
}

module.exports = { create, list, detail, updateStatus };

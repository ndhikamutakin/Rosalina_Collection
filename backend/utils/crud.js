const supabase = require('../config/supabase');
const { ok, created, fail } = require('./response');
const { validate } = require('./validate');
const { handleDbError } = require('./dbError');

/**
 * Pabrik controller CRUD untuk satu tabel.
 * opts: { table, idCol, label, rules, orderBy, select, beforeSave }
 */
function makeCrud({ table, idCol, label, rules, orderBy, select = '*', beforeSave }) {
  const parseId = (req) => {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  };

  return {
    // lihat daftar (sequence "Lihat ...")
    async list(req, res) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy || idCol, { ascending: true });
      if (error) return handleDbError(res, error, `mengambil data ${label}`);
      return ok(res, data, `Data ${label} berhasil diambil`);
    },

    async detail(req, res) {
      const id = parseId(req);
      if (!id) return fail(res, 'ID tidak valid', 400);
      const { data, error } = await supabase.from(table).select(select).eq(idCol, id).maybeSingle();
      if (error) return handleDbError(res, error, `mengambil data ${label}`);
      if (!data) return fail(res, `${label} tidak ditemukan`, 404);
      return ok(res, data, `Data ${label} berhasil diambil`);
    },

    // tambah (sequence "Tambah ...")
    async create(req, res) {
      const { errors, clean } = validate(req.body, rules);
      if (errors.length) return fail(res, 'Input tidak valid', 400, errors);
      if (beforeSave) {
        const msg = await beforeSave(clean, null);
        if (msg) return fail(res, msg, 400);
      }
      const { data, error } = await supabase.from(table).insert(clean).select().single();
      if (error) return handleDbError(res, error, `menyimpan ${label}`);
      return created(res, data, `${label} berhasil ditambahkan`);
    },

    // ubah (sequence "Update ...")
    async update(req, res) {
      const id = parseId(req);
      if (!id) return fail(res, 'ID tidak valid', 400);
      const { errors, clean } = validate(req.body, rules, { partial: true });
      if (errors.length) return fail(res, 'Input tidak valid', 400, errors);
      if (Object.keys(clean).length === 0) return fail(res, 'Tidak ada data yang diubah', 400);
      if (beforeSave) {
        const msg = await beforeSave(clean, id);
        if (msg) return fail(res, msg, 400);
      }
      const { data, error } = await supabase.from(table).update(clean).eq(idCol, id).select();
      if (error) return handleDbError(res, error, `memperbarui ${label}`);
      if (!data || data.length === 0) return fail(res, `${label} tidak ditemukan`, 404);
      return ok(res, data[0], `${label} berhasil diperbarui`);
    },

    // hapus (sequence "Hapus ...")
    async remove(req, res) {
      const id = parseId(req);
      if (!id) return fail(res, 'ID tidak valid', 400);
      const { data, error } = await supabase.from(table).delete().eq(idCol, id).select();
      if (error) return handleDbError(res, error, `menghapus ${label}`);
      if (!data || data.length === 0) return fail(res, `${label} tidak ditemukan`, 404);
      return ok(res, data[0], `${label} berhasil dihapus`);
    },
  };
}

module.exports = { makeCrud };

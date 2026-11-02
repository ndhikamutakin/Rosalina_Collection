// Format respons seragam: { success, message, data }
const ok = (res, data = null, message = 'Berhasil', status = 200) =>
  res.status(status).json({ success: true, message, data });

const created = (res, data, message = 'Data berhasil disimpan') =>
  ok(res, data, message, 201);

const fail = (res, message = 'Terjadi kesalahan', status = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};

module.exports = { ok, created, fail };

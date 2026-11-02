const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');
const { handleDbError } = require('../utils/dbError');

const sum = (rows, key) => (rows || []).reduce((total, r) => total + (Number(r[key]) || 0), 0);

// Sequence Monitoring Produksi: lihat status WO -> Get_Status() -> ambil_status() -> tampilkan status
async function status(req, res) {
  const [wo, potong, jahit, qc] = await Promise.all([
    supabase
      .from('work_order')
      .select('id_wo, tanggal, jumlah_produksi, status, model:model_produksi(nama_model)')
      .order('tanggal', { ascending: false }),
    supabase.from('hasil_potong').select('id_wo, jumlah'),
    supabase.from('hasil_jahit').select('id_wo, jumlah'),
    supabase.from('hasil_qc').select('id_wo, jumlah_lolos, jumlah_reject'),
  ]);

  const gagal = [wo, potong, jahit, qc].find((r) => r.error);
  if (gagal) return handleDbError(res, gagal.error, 'mengambil data monitoring');

  const group = (rows) => {
    const map = new Map();
    for (const r of rows.data || []) {
      if (!map.has(r.id_wo)) map.set(r.id_wo, []);
      map.get(r.id_wo).push(r);
    }
    return map;
  };
  const byPotong = group(potong);
  const byJahit = group(jahit);
  const byQc = group(qc);

  const workOrder = (wo.data || []).map((w) => ({
    ...w,
    hasil_potong: sum(byPotong.get(w.id_wo), 'jumlah'),
    hasil_jahit: sum(byJahit.get(w.id_wo), 'jumlah'),
    qc_lolos: sum(byQc.get(w.id_wo), 'jumlah_lolos'),
    qc_reject: sum(byQc.get(w.id_wo), 'jumlah_reject'),
  }));

  const ringkasan = {
    total_work_order: workOrder.length,
    work_order_proses: workOrder.filter((w) => w.status === 'proses').length,
    work_order_selesai: workOrder.filter((w) => w.status === 'selesai').length,
    total_jumlah_produksi: sum(workOrder, 'jumlah_produksi'),
    total_qc_lolos: sum(qc.data, 'jumlah_lolos'),
    total_qc_reject: sum(qc.data, 'jumlah_reject'),
  };

  return ok(res, { ringkasan, work_order: workOrder }, 'Data monitoring berhasil diambil');
}

module.exports = { status };

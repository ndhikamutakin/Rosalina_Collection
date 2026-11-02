const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');
const { isDate } = require('../utils/validate');
const { handleDbError } = require('../utils/dbError');

const PERIODE = ['harian', 'mingguan'];

const sum = (rows, key) => (rows || []).reduce((t, r) => t + (Number(r[key]) || 0), 0);

// Tanggal hari ini menurut waktu Indonesia (WIB), format YYYY-MM-DD
const hariIni = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

const addHari = (tanggal, n) => {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Rentang periode: harian = 1 hari, mingguan = Senin s.d. Minggu pada minggu tanggal tsb
function hitungRentang(periode, tanggal) {
  if (periode === 'harian') return { mulai: tanggal, selesai: tanggal };
  const hari = new Date(`${tanggal}T00:00:00Z`).getUTCDay(); // 0 = Minggu
  const mundur = (hari + 6) % 7;
  const mulai = addHari(tanggal, -mundur);
  return { mulai, selesai: addHari(mulai, 6) };
}

// Validasi parameter ?periode=harian|mingguan&tanggal=YYYY-MM-DD (pilih_periode)
function bacaParameter(query) {
  const periode = query.periode || 'harian';
  const tanggal = query.tanggal || hariIni();
  if (!PERIODE.includes(periode)) return { error: 'Periode harus harian atau mingguan' };
  if (!isDate(tanggal)) return { error: 'Tanggal harus berformat YYYY-MM-DD' };
  return { periode, tanggal };
}

// ambil_laporan(): total produksi, produk selesai, dan gagal QC pada periode
async function buatLaporan(periode, tanggal) {
  const { mulai, selesai } = hitungRentang(periode, tanggal);

  const [wo, qc] = await Promise.all([
    supabase
      .from('work_order')
      .select('id_wo, tanggal, jumlah_produksi, status, model:model_produksi(nama_model)')
      .gte('tanggal', mulai).lte('tanggal', selesai)
      .order('tanggal', { ascending: true }),
    supabase
      .from('hasil_qc')
      .select('id_wo, jumlah_lolos, jumlah_reject')
      .gte('tanggal', mulai).lte('tanggal', selesai),
  ]);
  if (wo.error) return { error: wo.error };
  if (qc.error) return { error: qc.error };

  return {
    laporan: {
      periode,
      mulai,
      selesai,
      total_produksi: sum(wo.data, 'jumlah_produksi'),
      produk_selesai: sum(qc.data, 'jumlah_lolos'),
      gagal_qc: sum(qc.data, 'jumlah_reject'),
      work_order: wo.data,
    },
  };
}

// Sequence Lihat Laporan Produksi: pilih_periode() -> tampilkan() -> ambil_laporan() -> laporan tampil
async function tampilkan(req, res) {
  const param = bacaParameter(req.query);
  if (param.error) return fail(res, param.error, 400);

  const { laporan, error } = await buatLaporan(param.periode, param.tanggal);
  if (error) return handleDbError(res, error, 'mengambil laporan produksi');
  return ok(res, laporan, 'Laporan produksi berhasil diambil');
}

function kirimPdf(res, l) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="laporan-produksi-${l.periode}-${l.mulai}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text('Laporan Produksi - Rosalina Collection', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Periode ${l.periode}: ${l.mulai} s.d. ${l.selesai}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(11)
    .text(`Total produksi : ${l.total_produksi}`)
    .text(`Produk selesai (lolos QC) : ${l.produk_selesai}`)
    .text(`Gagal QC (reject) : ${l.gagal_qc}`);
  doc.moveDown();

  const kolom = [
    { judul: 'No', x: 40, lebar: 30 },
    { judul: 'Tanggal', x: 75, lebar: 85 },
    { judul: 'ID WO', x: 165, lebar: 50 },
    { judul: 'Model', x: 220, lebar: 170 },
    { judul: 'Jumlah', x: 395, lebar: 60 },
    { judul: 'Status', x: 460, lebar: 90 },
  ];
  const baris = (y, nilai, tebal) => {
    doc.font(tebal ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    kolom.forEach((k, i) => doc.text(String(nilai[i] ?? ''), k.x, y, { width: k.lebar, lineBreak: false }));
  };

  let y = doc.y;
  baris(y, kolom.map((k) => k.judul), true);
  y += 16;
  l.work_order.forEach((w, i) => {
    if (y > 770) { doc.addPage(); y = 40; }
    baris(y, [i + 1, w.tanggal, w.id_wo, w.model ? w.model.nama_model : '-', w.jumlah_produksi, w.status]);
    y += 16;
  });
  if (l.work_order.length === 0) baris(y, ['', 'Tidak ada work order pada periode ini']);

  doc.end();
}

async function kirimExcel(res, l) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Laporan Produksi');

  ws.addRow(['Laporan Produksi - Rosalina Collection']).font = { bold: true, size: 14 };
  ws.addRow([`Periode ${l.periode}`, `${l.mulai} s.d. ${l.selesai}`]);
  ws.addRow([]);
  ws.addRow(['Total produksi', l.total_produksi]);
  ws.addRow(['Produk selesai (lolos QC)', l.produk_selesai]);
  ws.addRow(['Gagal QC (reject)', l.gagal_qc]);
  ws.addRow([]);
  const header = ws.addRow(['No', 'Tanggal', 'ID WO', 'Model', 'Jumlah Produksi', 'Status']);
  header.font = { bold: true };
  l.work_order.forEach((w, i) => {
    ws.addRow([i + 1, w.tanggal, w.id_wo, w.model ? w.model.nama_model : '-', w.jumlah_produksi, w.status]);
  });
  ws.columns.forEach((c) => { c.width = 22; });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="laporan-produksi-${l.periode}-${l.mulai}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

// Sequence Unduh Laporan Produksi: klik_download() -> download() -> ambil_laporan() -> file laporan
async function unduh(req, res) {
  const param = bacaParameter(req.query);
  if (param.error) return fail(res, param.error, 400);

  const format = req.query.format || 'pdf';
  if (!['pdf', 'xlsx'].includes(format)) return fail(res, 'Format harus pdf atau xlsx', 400);

  const { laporan, error } = await buatLaporan(param.periode, param.tanggal);
  if (error) return handleDbError(res, error, 'mengambil laporan produksi');

  if (format === 'pdf') return kirimPdf(res, laporan);
  return kirimExcel(res, laporan);
}

module.exports = { tampilkan, unduh, hitungRentang };

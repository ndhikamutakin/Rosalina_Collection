import CrudPage from '../components/CrudPage';
import { labelWO, tgl } from '../utils/format';

// Backend mengembalikan relasi `work_order` pada hasil potong / jahit / qc.
const kolomWO = {
  header: 'Work Order',
  render: (r) => (r.work_order ? `WO #${r.work_order.id_wo} - ${r.work_order.model?.nama_model || '-'}` : `WO #${r.id_wo}`),
};
const kolomTanggal = { header: 'Tanggal', render: (r) => tgl(r.tanggal) };

// Dropdown work order (dari GET /work-order)
const opsiWO = {
  endpoint: '/work-order',
  value: 'id_wo',
  label: (w) => `${labelWO(w)} (${w.jumlah_produksi} pcs, ${w.status})`,
};

// ---- Hasil Potong: /hasil-potong ----
const potongCols = [kolomWO, { header: 'Jumlah Potong', key: 'jumlah' }, kolomTanggal];
const potongFields = [
  { name: 'id_wo', label: 'Work order', type: 'select', options: opsiWO, required: true, full: true },
  { name: 'jumlah', label: 'Jumlah hasil potong', type: 'number', min: 1, required: true },
  { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
];
export const HasilPotong = () => (
  <CrudPage
    title="Hasil Potong" subtitle="Pencatatan hasil pemotongan per work order"
    endpoint="/hasil-potong" idKey="id_potong" label="Hasil potong"
    columns={potongCols} fields={potongFields}
  />
);

// ---- Hasil Jahit: /hasil-jahit (wajib terhubung ke hasil potong pada work order yang sama) ----
const jahitCols = [
  kolomWO,
  { header: 'Dari Hasil Potong', render: (r) => (r.id_potong ? `Potong #${r.id_potong}` : '-') },
  { header: 'Jumlah Jahit', key: 'jumlah' },
  kolomTanggal,
];
const jahitFields = [
  { name: 'id_wo', label: 'Work order', type: 'select', options: opsiWO, required: true, full: true, resets: ['id_potong'] },
  {
    name: 'id_potong', label: 'Hasil potong', type: 'select', required: true, full: true,
    placeholder: 'Pilih work order terlebih dahulu',
    options: {
      endpoint: '/hasil-potong',
      value: 'id_potong',
      filter: (d, form) => String(d.id_wo) === String(form.id_wo),
      label: (d) => `Potong #${d.id_potong} - ${d.jumlah} pcs (${tgl(d.tanggal)})`,
    },
  },
  { name: 'jumlah', label: 'Jumlah hasil jahit', type: 'number', min: 1, required: true },
  { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
];
export const HasilJahit = () => (
  <CrudPage
    title="Hasil Jahit" subtitle="Hasil jahit harus terhubung ke hasil potong dari work order yang sama"
    endpoint="/hasil-jahit" idKey="id_jahit" label="Hasil jahit"
    columns={jahitCols} fields={jahitFields}
  />
);

// ---- Hasil QC: /hasil-qc (total dihitung otomatis oleh backend = lolos + reject) ----
const qcCols = [
  kolomWO,
  { header: 'Lolos', render: (r) => <span className="badge ok">{r.jumlah_lolos}</span> },
  { header: 'Reject', render: (r) => <span className="badge danger">{r.jumlah_reject}</span> },
  { header: 'Total', key: 'jumlah' },
  kolomTanggal,
];
const qcFields = [
  { name: 'id_wo', label: 'Work order', type: 'select', options: opsiWO, required: true, full: true },
  { name: 'jumlah_lolos', label: 'Jumlah lolos', type: 'number', min: 0, required: true },
  { name: 'jumlah_reject', label: 'Jumlah reject', type: 'number', min: 0, required: true },
  {
    name: 'tanggal', label: 'Tanggal', type: 'date', required: true,
    hint: (f) => `Total QC: ${(Number(f.jumlah_lolos) || 0) + (Number(f.jumlah_reject) || 0)} pcs (dihitung otomatis)`,
  },
];
export const HasilQc = () => (
  <CrudPage
    title="Hasil QC" subtitle="Jumlah produk lolos dan reject per work order"
    endpoint="/hasil-qc" idKey="id_qc" label="Hasil QC"
    columns={qcCols} fields={qcFields}
  />
);

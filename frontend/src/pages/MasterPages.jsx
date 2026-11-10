import CrudPage from '../components/CrudPage';

// ---- Model Produksi: /model-produksi ----
const modelCols = [
  { header: 'Nama Model', key: 'nama_model' },
  { header: 'Deskripsi', key: 'deskripsi' },
];
const modelFields = [
  { name: 'nama_model', label: 'Nama model', required: true, full: true },
  { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', full: true },
];
export const ModelProduksi = () => (
  <CrudPage
    title="Model Produksi" subtitle="Daftar model pakaian yang diproduksi"
    endpoint="/model-produksi" idKey="id_model" label="Model produksi"
    columns={modelCols} fields={modelFields}
  />
);

// ---- Kain: /kain ----
const kainCols = [
  { header: 'Nama Kain', key: 'nama_kain' },
  { header: 'Jenis', key: 'jenis' },
  { header: 'Stok', key: 'stok' },
];
const kainFields = [
  { name: 'nama_kain', label: 'Nama kain', required: true },
  { name: 'jenis', label: 'Jenis kain', required: true },
  { name: 'stok', label: 'Stok', type: 'number', min: 0, required: true },
];
export const Kain = () => (
  <CrudPage
    title="Kain" subtitle="Stok kain bertambah otomatis saat ada pembelian bahan"
    endpoint="/kain" idKey="id_kain" label="Kain"
    columns={kainCols} fields={kainFields}
  />
);

// ---- Bahan Pendukung: /bahan-pendukung ----
const bahanCols = [
  { header: 'Nama Bahan', key: 'nama_bahan' },
  { header: 'Stok', key: 'stok' },
];
const bahanFields = [
  { name: 'nama_bahan', label: 'Nama bahan', required: true },
  { name: 'stok', label: 'Stok', type: 'number', min: 0, required: true },
];
export const BahanPendukung = () => (
  <CrudPage
    title="Bahan Pendukung" subtitle="Benang, kancing, resleting, dan bahan tambahan lain"
    endpoint="/bahan-pendukung" idKey="id_bahan" label="Bahan pendukung"
    columns={bahanCols} fields={bahanFields}
  />
);

// ---- Tim Produksi: /tim-produksi ----
const TIM = [
  { value: 'potong', label: 'Potong' },
  { value: 'jahit', label: 'Jahit' },
  { value: 'qc', label: 'QC' },
];
const timCols = [
  { header: 'Nama Karyawan / Tim', key: 'nama_karyawan' },
  { header: 'Jenis Tim', render: (r) => <span className="badge muted">{r.jenis_tim}</span> },
  { header: 'Jumlah Anggota', key: 'jumlah_anggota' },
];
const timFields = [
  { name: 'nama_karyawan', label: 'Nama karyawan / tim', required: true, full: true },
  { name: 'jenis_tim', label: 'Jenis tim', type: 'select', options: TIM, required: true },
  { name: 'jumlah_anggota', label: 'Jumlah anggota', type: 'number', min: 0, required: true },
];
export const TimProduksi = () => (
  <CrudPage
    title="Tim Produksi" subtitle="Tim potong, jahit, dan QC"
    endpoint="/tim-produksi" idKey="id_karyawan" label="Tim produksi"
    columns={timCols} fields={timFields}
  />
);

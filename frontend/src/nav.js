// Menu sidebar + hak akses per peran (mengikuti middleware authorize di backend/routes/index.js)
const SEMUA = ['owner', 'admin'];

export const NAV = [
  {
    section: 'Produksi',
    items: [
      { to: '/monitoring', label: 'Monitoring Produksi', roles: ['owner'] },
      { to: '/laporan', label: 'Laporan Produksi', roles: ['owner'] },
      { to: '/work-order', label: 'Work Order', roles: SEMUA },
    ],
  },
  {
    section: 'Hasil Produksi',
    items: [
      { to: '/hasil-potong', label: 'Hasil Potong', roles: SEMUA },
      { to: '/hasil-jahit', label: 'Hasil Jahit', roles: SEMUA },
      { to: '/hasil-qc', label: 'Hasil QC', roles: SEMUA },
    ],
  },
  {
    section: 'Data Master',
    items: [
      { to: '/model-produksi', label: 'Model Produksi', roles: SEMUA },
      { to: '/kain', label: 'Kain', roles: SEMUA },
      { to: '/bahan-pendukung', label: 'Bahan Pendukung', roles: SEMUA },
      { to: '/tim-produksi', label: 'Tim Produksi', roles: SEMUA },
    ],
  },
  {
    section: 'Pembelian',
    items: [{ to: '/pembelian-bahan', label: 'Pembelian Bahan', roles: SEMUA }],
  },
];

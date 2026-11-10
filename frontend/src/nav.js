import {
  Activity,
  BarChart3,
  ClipboardList,
  Scissors,
  Shirt,
  ClipboardCheck,
  Package,
  Layers,
  Wrench,
  Users,
  ShoppingCart,
} from 'lucide-react';

// Menu sidebar + hak akses per peran
const SEMUA = ['owner', 'admin'];

export const NAV = [
  {
    section: 'Produksi',
    items: [
      {
        to: '/monitoring',
        label: 'Monitoring Produksi',
        icon: Activity,
        roles: ['owner'],
      },
      {
        to: '/laporan',
        label: 'Laporan Produksi',
        icon: BarChart3,
        roles: ['owner'],
      },
      {
        to: '/work-order',
        label: 'Work Order',
        icon: ClipboardList,
        roles: SEMUA,
      },
    ],
  },
  {
    section: 'Hasil Produksi',
    items: [
      {
        to: '/hasil-potong',
        label: 'Hasil Potong',
        icon: Scissors,
        roles: SEMUA,
      },
      {
        to: '/hasil-jahit',
        label: 'Hasil Jahit',
        icon: Shirt,
        roles: SEMUA,
      },
      {
        to: '/hasil-qc',
        label: 'Hasil QC',
        icon: ClipboardCheck,
        roles: SEMUA,
      },
    ],
  },
  {
    section: 'Data Master',
    items: [
      {
        to: '/model-produksi',
        label: 'Model Produksi',
        icon: Package,
        roles: SEMUA,
      },
      {
        to: '/kain',
        label: 'Kain',
        icon: Layers,
        roles: SEMUA,
      },
      {
        to: '/bahan-pendukung',
        label: 'Bahan Pendukung',
        icon: Wrench,
        roles: SEMUA,
      },
      {
        to: '/tim-produksi',
        label: 'Tim Produksi',
        icon: Users,
        roles: SEMUA,
      },
    ],
  },
  {
    section: 'Pembelian',
    items: [
      {
        to: '/pembelian-bahan',
        label: 'Pembelian Bahan',
        icon: ShoppingCart,
        roles: SEMUA,
      },
    ],
  },
];
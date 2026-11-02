# Frontend Rosalina Collection

React + Vite. Terhubung ke backend Express + Supabase pada folder `backend/`.

## Struktur repo yang disarankan

```
Rosalina_Collection/
├── backend/
├── frontend/      <- folder ini
└── README.md
```

## Menjalankan (development)

1. Jalankan backend lebih dulu (lihat langkah di bawah), port `5000`.
2. Di folder `frontend/`:
   ```bash
   npm install
   cp .env.example .env     # Windows: copy .env.example .env
   npm run dev
   ```
3. Buka http://localhost:5173 dan masuk dengan akun hasil `npm run seed` di backend.

Request ke `/api/*` otomatis diteruskan oleh Vite ke `http://localhost:5000` (lihat `vite.config.js`),
jadi tidak ada masalah CORS saat development.

## Hak akses per peran (mengikuti `backend/routes/index.js`)

| Fitur | Owner | Admin |
|---|---|---|
| Monitoring Produksi, Laporan (lihat + unduh PDF/Excel) | ya | tidak |
| Buat Work Order | ya | tidak |
| Lihat Work Order, ubah status (proses / selesai) | ya | ya |
| Model, Kain, Bahan Pendukung, Tim, Hasil Potong/Jahit/QC, Pembelian: lihat | ya | ya |
| Model, Kain, Bahan Pendukung, Tim, Hasil Potong/Jahit/QC, Pembelian: tambah / ubah / hapus | tidak | ya |

Menu dan tombol disembunyikan sesuai peran, dan backend tetap menjadi penjaga utama (respons 403 bila dilanggar).

## Pemetaan sequence diagram ke halaman

| Sequence | Halaman / file |
|---|---|
| Login | `pages/Login.jsx`, `context/AuthContext.jsx` |
| Monitoring Produksi | `pages/Monitoring.jsx` |
| Lihat / Unduh Laporan Produksi | `pages/Laporan.jsx` |
| CRUD Model, Kain, Bahan, Tim | `pages/MasterPages.jsx` (memakai `components/CrudPage.jsx`) |
| Hasil Potong / Jahit / QC | `pages/HasilPages.jsx` |
| Pembelian Bahan + Hitung Total | `pages/Pembelian.jsx` |
| Buat Work Order, Mulai/Selesai Produksi | `pages/WorkOrder.jsx` |
| Konfirmasi update / delete | `components/Modal.jsx` (`Confirm`) |

## Production

```bash
npm run build      # hasil di dist/
```
- Jika frontend dan backend beda domain: isi `VITE_API_URL=https://api-anda.com/api` sebelum build,
  dan isi `CORS_ORIGIN=https://frontend-anda.com` di `.env` backend.
- Jika satu domain (mis. Nginx meneruskan `/api` ke backend), `VITE_API_URL` dibiarkan kosong.
- Karena memakai React Router, hosting statis perlu fallback semua rute ke `index.html`.

# Backend Rosalina Collection

Express + Supabase (PostgreSQL). Semua endpoint berawalan `/api` dan membalas JSON `{ success, message, data }`.
Setelah login, kirim header `Authorization: Bearer <token>`.

## Menjalankan

1. `npm install`
2. Salin `.env.example` menjadi `.env`, isi `SUPABASE_URL`, `SUPABASE_KEY` (service_role), `JWT_SECRET`.
3. Di Supabase: SQL Editor, jalankan isi `database/schema.sql`.
4. `npm run seed` (membuat akun awal: `owner` / `owner123` dan `admin` / `admin123`, segera ganti).
5. `npm run dev`, lalu buka http://localhost:5000

## Endpoint sesuai sequence diagram

| Sequence | Endpoint | Peran |
|---|---|---|
| Login | `POST /auth/login` (body: `username` atau email, `password`) | publik |
| Monitoring Produksi | `GET /monitoring/status` | Owner |
| Lihat Laporan Produksi | `GET /laporan/produksi?periode=harian\|mingguan&tanggal=YYYY-MM-DD` | Owner |
| Unduh Laporan Produksi | `GET /laporan/produksi/unduh?format=pdf\|xlsx&periode=...&tanggal=...` | Owner |
| CRUD Model Produksi | `/model-produksi` | lihat: semua, ubah: Admin |
| CRUD Kain | `/kain` | lihat: semua, ubah: Admin |
| CRUD Bahan Pendukung | `/bahan-pendukung` | lihat: semua, ubah: Admin |
| CRUD Tim Produksi | `/tim-produksi` | lihat: semua, ubah: Admin |
| Hasil Potong / Jahit / QC | `/hasil-potong`, `/hasil-jahit`, `/hasil-qc` | lihat: semua, ubah: Admin |
| Pembelian Bahan | `/pembelian-bahan` | lihat: semua, ubah: Admin |
| Hitung Total Pembelian | `GET /pembelian-bahan/total?mulai=&selesai=` | semua |

CRUD standar: `GET /x` (daftar), `GET /x/:id`, `POST /x`, `PUT /x/:id`, `DELETE /x/:id`.
Langkah "konfirmasi update/delete" pada sequence adalah dialog di frontend, lalu frontend memanggil PUT/DELETE.

Tambahan agar sistem bisa berjalan (tidak ada di sequence): `POST /work-order` (Owner, BuatWorkOrder),
`GET /work-order`, `PATCH /work-order/:id/status` (proses/selesai), `GET /auth/me`, `POST /auth/logout`.

## Contoh body

```json
// POST /kain
{ "nama_kain": "Katun Jepang", "jenis": "Katun", "stok": 100 }

// POST /work-order (Owner)
{ "tanggal": "2026-11-02", "jumlah_produksi": 100, "id_model": 1, "id_tim": 1 }

// POST /hasil-jahit  (id_potong harus milik work order yang sama)
{ "id_wo": 1, "id_potong": 1, "jumlah": 90, "tanggal": "2026-11-03" }

// POST /hasil-qc  (jumlah total dihitung otomatis = lolos + reject)
{ "id_wo": 1, "jumlah_lolos": 85, "jumlah_reject": 5 }

// POST /pembelian-bahan  (stok otomatis bertambah, total dihitung dari item)
{ "tanggal": "2026-11-02", "keterangan": "Belanja bulanan",
  "items": [
    { "jenis_bahan": "kain", "id_kain": 1, "jumlah": 50, "harga_satuan": 35000 },
    { "jenis_bahan": "bahan_pendukung", "id_bahan": 2, "jumlah": 200, "harga_satuan": 1500 }
  ] }
```

## Catatan desain

- Definisi laporan: `total_produksi` = jumlah produksi work order pada periode, `produk_selesai` = total lolos QC, `gagal_qc` = total reject QC. Laporan mingguan memakai Senin sampai Minggu.
- `hasil_jahit` punya kolom `id_potong` agar terhubung ke hasil potong (sesuai scope).
- Pembelian dengan rincian item tidak bisa diubah itemnya lewat PUT; hapus lalu buat ulang supaya stok tetap konsisten. Menghapus pembelian ditolak jika stok sudah terpakai.
- Pesan error ke pengguna tidak memuat detail teknis; detail hanya ada di log server.

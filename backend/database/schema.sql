-- Skema database Rosalina Collection (Supabase / PostgreSQL)
-- Jalankan di Supabase: SQL Editor -> New query -> paste -> Run

create table if not exists users (
  id_user       bigint generated always as identity primary key,
  nama          text not null,
  username      text not null unique,
  email         text unique,
  password_hash text not null,
  role          text not null check (role in ('owner', 'admin')),
  level_akses   text,
  created_at    timestamptz not null default now()
);

create table if not exists model_produksi (
  id_model   bigint generated always as identity primary key,
  nama_model text not null,
  deskripsi  text,
  created_at timestamptz not null default now()
);

create table if not exists kain (
  id_kain    bigint generated always as identity primary key,
  nama_kain  text not null,
  jenis      text,
  stok       integer not null default 0 check (stok >= 0),
  created_at timestamptz not null default now()
);

create table if not exists bahan_pendukung (
  id_bahan   bigint generated always as identity primary key,
  nama_bahan text not null,
  stok       integer not null default 0 check (stok >= 0),
  created_at timestamptz not null default now()
);

create table if not exists tim_produksi (
  id_karyawan    bigint generated always as identity primary key,
  nama_karyawan  text not null,
  jenis_tim      text not null check (jenis_tim in ('potong', 'jahit', 'qc')),
  jumlah_anggota integer not null default 1 check (jumlah_anggota >= 0),
  created_at     timestamptz not null default now()
);

create table if not exists work_order (
  id_wo            bigint generated always as identity primary key,
  tanggal          date not null default current_date,
  jumlah_produksi  integer not null check (jumlah_produksi > 0),
  status           text not null default 'proses' check (status in ('proses', 'selesai')),
  id_model         bigint not null references model_produksi(id_model),
  id_tim           bigint references tim_produksi(id_karyawan),
  dibuat_oleh      bigint references users(id_user),
  created_at       timestamptz not null default now()
);

create table if not exists hasil_potong (
  id_potong  bigint generated always as identity primary key,
  id_wo      bigint not null references work_order(id_wo) on delete cascade,
  jumlah     integer not null check (jumlah > 0),
  tanggal    date not null default current_date,
  created_at timestamptz not null default now()
);

-- hasil_jahit dikaitkan ke hasil_potong (sesuai scope: hasil jahit terhubung ke hasil potong)
create table if not exists hasil_jahit (
  id_jahit        bigint generated always as identity primary key,
  id_wo           bigint not null references work_order(id_wo) on delete cascade,
  id_potong       bigint references hasil_potong(id_potong),
  jumlah          integer not null check (jumlah > 0),
  tanggal         date not null default current_date,
  created_at      timestamptz not null default now()
);

create table if not exists hasil_qc (
  id_qc         bigint generated always as identity primary key,
  id_wo         bigint not null references work_order(id_wo) on delete cascade,
  jumlah        integer not null check (jumlah > 0),
  jumlah_lolos  integer not null default 0 check (jumlah_lolos >= 0),
  jumlah_reject integer not null default 0 check (jumlah_reject >= 0),
  tanggal       date not null default current_date,
  created_at    timestamptz not null default now(),
  check (jumlah_lolos + jumlah_reject = jumlah)
);

create table if not exists pembelian_bahan (
  id_pembelian bigint generated always as identity primary key,
  tanggal      date not null default current_date,
  total_biaya  numeric(14,2) not null default 0 check (total_biaya >= 0),
  keterangan   text,
  created_at   timestamptz not null default now()
);

-- Rincian pembelian: tiap baris menambah stok kain atau bahan pendukung
create table if not exists pembelian_detail (
  id_detail    bigint generated always as identity primary key,
  id_pembelian bigint not null references pembelian_bahan(id_pembelian) on delete cascade,
  jenis_bahan  text not null check (jenis_bahan in ('kain', 'bahan_pendukung')),
  id_kain      bigint references kain(id_kain),
  id_bahan     bigint references bahan_pendukung(id_bahan),
  jumlah       integer not null check (jumlah > 0),
  harga_satuan numeric(14,2) not null check (harga_satuan >= 0),
  check (
    (jenis_bahan = 'kain' and id_kain is not null and id_bahan is null) or
    (jenis_bahan = 'bahan_pendukung' and id_bahan is not null and id_kain is null)
  )
);

create index if not exists idx_wo_tanggal on work_order(tanggal);
create index if not exists idx_wo_status on work_order(status);
create index if not exists idx_potong_wo on hasil_potong(id_wo);
create index if not exists idx_jahit_wo on hasil_jahit(id_wo);
create index if not exists idx_qc_wo on hasil_qc(id_wo);
create index if not exists idx_pembelian_tanggal on pembelian_bahan(tanggal);

-- Fungsi atomik untuk menambah/mengurangi stok (dipanggil backend saat pembelian bahan).
-- Stok tidak boleh negatif: constraint check pada tabel akan menolak pengurangan berlebih.
create or replace function ubah_stok(p_jenis text, p_id bigint, p_delta integer)
returns integer
language plpgsql
as $$
declare
  v_stok integer;
begin
  if p_jenis = 'kain' then
    update kain set stok = stok + p_delta where id_kain = p_id returning stok into v_stok;
  elsif p_jenis = 'bahan_pendukung' then
    update bahan_pendukung set stok = stok + p_delta where id_bahan = p_id returning stok into v_stok;
  else
    raise exception 'jenis bahan tidak dikenal';
  end if;

  if v_stok is null then
    raise exception 'item stok tidak ditemukan' using errcode = '23503';
  end if;
  return v_stok;
end;
$$;

revoke all on function ubah_stok(text, bigint, integer) from public, anon, authenticated;

-- Backend memakai service_role key, jadi RLS aktif tanpa policy
-- akan memblokir akses langsung dari anon key (aman untuk data produksi).
alter table users enable row level security;
alter table model_produksi enable row level security;
alter table kain enable row level security;
alter table bahan_pendukung enable row level security;
alter table tim_produksi enable row level security;
alter table work_order enable row level security;
alter table hasil_potong enable row level security;
alter table hasil_jahit enable row level security;
alter table hasil_qc enable row level security;
alter table pembelian_bahan enable row level security;
alter table pembelian_detail enable row level security;
